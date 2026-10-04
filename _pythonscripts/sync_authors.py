#!/usr/bin/env python3
"""Sync the lab roster (all-members.xlsx) into HugoBlox v0.11 author files.

For every roster row (keyed by the `foldername` column) this writes:

  data/authors/<slug>.yaml                 author profile (hugoblox/author/v1)
  assets/media/authors/<slug>.<ext>        avatar, when a photo is found in --img-dir
  content/en/authors/<foldername>/_index.md   term page; its Markdown body is shown
                                           on the person's profile page

<slug> is the lower-cased, hyphenated foldername — the key HugoBlox looks up
with `index site.Data.authors (urlize $slug)`.

Nothing is ever deleted. Files that exist on disk but no longer match a roster
row are listed at the end so you can remove them by hand.

Usage
-----
    python sync_authors.py                      # all-members.xlsx next to this script
    python sync_authors.py roster.xlsx --dry    # preview, write nothing
    python sync_authors.py --only data          # skip content/en/authors/*/_index.md

Required columns: foldername, name.  Recognised optional columns:
  ApplicationID, Roll, Research Division, BSc Instituton, role, user_groups,
  graduation_year, thesis-title, degree_sought, first_enrollment,
  thesis_approval, email, phone, institution, organization, interests,
  github, linkedin, twitter, x, scholar, orcid, website
Any other non-empty column is preserved under `params.excel` in the YAML.
"""
from __future__ import annotations

import argparse
import datetime as dt
import filecmp
import re
import shutil
import sys
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any

try:
    import pandas as pd
    import yaml
except ImportError:
    sys.exit("❌ Missing dependency. Install with: python -m pip install pandas openpyxl pyyaml")

SCRIPT_DIR = Path(__file__).resolve().parent
REPO_ROOT = SCRIPT_DIR.parent

IMAGE_EXTS = (".jpg", ".jpeg", ".png", ".webp")
RESERVED_SLUGS = {"admin", "me"}             # hand-maintained, never generated
CONTENT_NON_MEMBER = {"admin", "me", "alumni"}  # content/en/authors subfolders that are not roster rows
PLACEHOLDERS = {"-", "–", "—", "n/a", "na", "nan", "none"}

# (column, icon) pairs for `links`; icon names follow data/authors/me.yaml.
LINK_COLUMNS = [
    ("email", "hero/envelope"),
    ("website", "hero/link"),
    ("github", "brands/github"),
    ("linkedin", "brands/linkedin"),
    ("twitter", "brands/x"),
    ("x", "brands/x"),
    ("scholar", "brands/google-scholar"),
    ("orcid", "brands/orcid"),
]
KNOWN_COLUMNS = {
    "applicationid", "roll", "name", "research_division", "bsc_instituton",
    "foldername", "role", "user_groups", "graduation_year", "thesis_title",
    "degree_sought", "first_enrollment", "thesis_approval", "phone",
    "institution", "organization", "bio", "interests",
} | {col for col, _ in LINK_COLUMNS}

RESET, BOLD = "\033[0m", "\033[1m"
GREEN, YELLOW, RED, CYAN, DIM = "\033[92m", "\033[93m", "\033[91m", "\033[96m", "\033[2m"


def cprint(msg: str, colour: str = "", *, bold: bool = False) -> None:
    print(f"{BOLD if bold else ''}{colour}{msg}{RESET}")


# -----------------------------------------------------------------------------
# Value cleaning
# -----------------------------------------------------------------------------

def clean(value: Any) -> Any:
    """Normalise one Excel cell: blanks/NaN/placeholders -> None, 2025.0 -> 2025."""
    if value is None:
        return None
    if not isinstance(value, (list, dict)) and pd.isna(value):
        return None
    if hasattr(value, "item") and not isinstance(value, (str, bytes)):
        try:
            value = value.item()          # numpy scalar -> Python scalar
        except (AttributeError, ValueError):
            pass
    if isinstance(value, pd.Timestamp):
        value = value.to_pydatetime()
    if isinstance(value, dt.datetime):
        return value.date().isoformat() if value.time() == dt.time() else value.isoformat()
    if isinstance(value, dt.date):
        return value.isoformat()
    if isinstance(value, float) and value.is_integer():
        return int(value)
    if isinstance(value, str):
        value = value.strip()
        return None if value.lower() in PLACEHOLDERS or not value else value
    return value


def normalize_col(name: Any) -> str:
    return re.sub(r"[^a-z0-9]+", "_", str(name).strip().lower()).strip("_")


def slugify(text: str) -> str:
    return re.sub(r"[^a-z0-9]+", "-", str(text).strip().lower()).strip("-")


def split_list(value: Any) -> list[str]:
    value = clean(value)
    if value is None:
        return []
    return [p for p in (s.strip() for s in re.split(r"[|;,/]", str(value))) if p]


def prune(obj: Any) -> Any:
    """Recursively drop None / empty strings / empty containers."""
    if isinstance(obj, dict):
        out = {k: prune(v) for k, v in obj.items()}
        return {k: v for k, v in out.items() if v not in (None, "", [], {})}
    if isinstance(obj, list):
        return [v for v in (prune(x) for x in obj) if v not in (None, "", [], {})]
    return obj


# -----------------------------------------------------------------------------
# Roster model
# -----------------------------------------------------------------------------

@dataclass
class Member:
    row: dict[str, Any]          # normalised column name -> cleaned value
    folder: str
    slug: str
    name: str
    extras: dict[str, Any] = field(default_factory=dict)

    def get(self, key: str) -> Any:
        return self.row.get(key)

    @property
    def given_family(self) -> tuple[str, str | None]:
        parts = self.name.split()
        return parts[0], (" ".join(parts[1:]) or None)


def load_roster(path: Path, sheet: int | str) -> list[Member]:
    try:
        df = pd.read_excel(path, engine="openpyxl", sheet_name=sheet, dtype=object)
    except PermissionError:
        sys.exit(f"❌ {path.name} is open elsewhere (Excel?). Close it and retry.")
    except ImportError:
        sys.exit("❌ Missing dependency. Install with: python -m pip install openpyxl")

    missing = {"foldername", "name"} - {normalize_col(c) for c in df.columns}
    if missing:
        sys.exit("❌ Roster is missing required columns: " + ", ".join(sorted(missing)))

    members: list[Member] = []
    seen: dict[str, int] = {}
    for excel_row, raw in enumerate(df.to_dict(orient="records"), start=2):
        row = {normalize_col(k): clean(v) for k, v in raw.items()}
        name, folder = row.get("name"), row.get("foldername")
        if name is None and folder is None:
            continue                                    # fully blank row
        if name is None:
            cprint(f"⚠️  Row {excel_row}: no name — skipped", YELLOW)
            continue
        folder = str(folder or name)
        slug = slugify(folder)
        if not slug or slug in RESERVED_SLUGS:
            cprint(f"↷  Row {excel_row}: reserved slug '{slug}' — skipped", DIM)
            continue
        if slug in seen:
            sys.exit(f"❌ Row {excel_row}: slug '{slug}' duplicates row {seen[slug]}. Fix `foldername`.")
        seen[slug] = excel_row
        extras = {k: v for k, v in row.items() if k not in KNOWN_COLUMNS and v is not None}
        members.append(Member(row=row, folder=folder, slug=slug, name=str(name), extras=extras))
    return members


# -----------------------------------------------------------------------------
# Builders
# -----------------------------------------------------------------------------

def build_profile(m: Member, org: str) -> dict[str, Any]:
    """data/authors/<slug>.yaml — keys read by layouts/people/term.html & team blocks."""
    given, family = m.given_family
    affiliation = m.get("organization") or m.get("institution") or org
    interests = split_list(m.get("interests")) or split_list(m.get("research_division"))
    education = [{"degree": "BSc", "institution": m.get("bsc_instituton")}] if m.get("bsc_instituton") else []
    if m.get("degree_sought"):
        # graduation_year belongs to this (MSc/PhD) degree, not the BSc.
        education.append({"degree": m.get("degree_sought"), "institution": affiliation,
                          "year": m.get("graduation_year")})
    links = []
    for col, icon in LINK_COLUMNS:
        if (value := m.get(col)) is not None:
            links.append({"icon": icon, "url": f"mailto:{value}" if col == "email" else str(value)})

    return prune({
        "schema": "hugoblox/author/v1",
        "slug": m.slug,
        "title": m.name,
        "name": {"given": given, "family": family},
        "role": m.get("role"),
        "bio": m.get("bio") or m.get("thesis_title"),
        "affiliations": [{"name": affiliation}],
        "education": education,
        "interests": interests,
        "user_groups": split_list(m.get("user_groups")),
        "links": links,
        "params": {
            "student": {
                "application_id": m.get("applicationid"),
                "roll": m.get("roll"),
                "degree_sought": m.get("degree_sought"),
                "first_enrollment": m.get("first_enrollment"),
                "graduation_year": m.get("graduation_year"),
                "thesis_status": m.get("thesis_approval"),
                "thesis_title": m.get("thesis_title"),
                "research_division": m.get("research_division"),
                "phone": m.get("phone"),
            },
            "excel": m.extras,
        },
    })


def build_page(m: Member, org: str) -> str:
    """content/en/authors/<foldername>/_index.md — front matter + "Information" list."""
    given, family = m.given_family
    front = prune({
        "title": m.name,
        "slug": m.slug,
        "first_name": given,
        "last_name": family,
        "authors": [m.folder],
        "superuser": False,
        "organizations": [{"name": m.get("organization") or m.get("institution") or org}],
        "role": m.get("role"),
        "user_groups": split_list(m.get("user_groups")),
        "graduation_year": m.get("graduation_year"),
        "thesis": {"title": m.get("thesis_title")},
    })
    facts = [
        ("Student ID", m.get("roll")),
        ("BSc Institution", m.get("bsc_instituton")),
        ("Working Towards", m.get("degree_sought")),
        ("First Enrollment", m.get("first_enrollment")),
        ("Research Division", m.get("research_division")),
        ("Thesis Status", m.get("thesis_approval")),
    ]
    body = "\n".join(f"* **{label}:** {value}" for label, value in facts if value is not None)
    return f"---\n{dump_yaml(front)}---\n\n## Information\n{body}\n"


class _Dumper(yaml.SafeDumper):
    """Quote numeric-looking strings. PyYAML (YAML 1.1) leaves e.g. 0424062380
    bare because 8/9 make it non-octal, but Hugo's YAML 1.2 parser would read
    it as the integer 424062380 and drop the leading zero."""


def _represent_str(dumper: yaml.SafeDumper, value: str) -> yaml.ScalarNode:
    style = "'" if re.fullmatch(r"[-+]?[0-9][0-9_]*(\.[0-9]*)?([eE][-+]?[0-9]+)?", value) else None
    return dumper.represent_scalar("tag:yaml.org,2002:str", value, style=style)


_Dumper.add_representer(str, _represent_str)


def dump_yaml(data: dict[str, Any]) -> str:
    return yaml.dump(data, Dumper=_Dumper, allow_unicode=True, sort_keys=False, width=100)


# -----------------------------------------------------------------------------
# File operations (all idempotent; nothing is deleted)
# -----------------------------------------------------------------------------

class Sync:
    def __init__(self, dry: bool) -> None:
        self.dry = dry
        self.counts = {"written": 0, "unchanged": 0, "avatars": 0, "no_avatar": 0}

    def write_text(self, path: Path, text: str) -> None:
        rel = path.relative_to(REPO_ROOT) if path.is_relative_to(REPO_ROOT) else path
        if path.is_file() and path.read_text(encoding="utf-8") == text:
            self.counts["unchanged"] += 1
            return
        self.counts["written"] += 1
        if self.dry:
            cprint(f"📝 {rel} [dry]", GREEN)
            return
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(text, encoding="utf-8")
        cprint(f"📝 {rel}", GREEN)

    def sync_avatar(self, m: Member, img_dir: Path, media_dir: Path, default_avatar: Path | None) -> None:
        existing = existing_avatars(media_dir, m.slug)
        src = find_photo(m, img_dir) or (None if existing else default_avatar)
        if src is None:
            if not existing:
                self.counts["no_avatar"] += 1
                cprint(f"⚠️  no photo for {m.slug}", YELLOW)
            return
        # Reuse an existing file's spelling so a case-only difference on Windows
        # never creates a second avatar for the same slug.
        dst = next((p for p in existing if p.suffix.lower() == src.suffix.lower()),
                   media_dir / f"{m.slug}{src.suffix.lower()}")
        if dst.is_file() and filecmp.cmp(src, dst, shallow=False):
            return
        others = [p.name for p in existing if p != dst]
        if others:
            cprint(f"⚠️  {m.slug}: other avatar file(s) {others} also match; Hugo picks one", YELLOW)
        self.counts["avatars"] += 1
        if self.dry:
            cprint(f"🖼️  {src.name} -> {dst.name} [dry]", GREEN)
            return
        media_dir.mkdir(parents=True, exist_ok=True)
        shutil.copy2(src, dst)
        cprint(f"🖼️  {src.name} -> {dst.name}", GREEN)


def existing_avatars(media_dir: Path, slug: str) -> list[Path]:
    if not media_dir.is_dir():
        return []
    return [p for p in media_dir.iterdir()
            if p.is_file() and p.stem.lower() == slug and p.suffix.lower() in IMAGE_EXTS]


def find_photo(m: Member, img_dir: Path) -> Path | None:
    if not img_dir.is_dir():
        return None
    stems: list[str] = []
    for key in ("applicationid", "roll", "foldername", "name"):
        if (value := m.get(key)) is not None:
            stems.append(str(value))
            if key == "applicationid" and not str(value).startswith("0"):
                stems.append(str(value).zfill(7))
    by_name = {p.name.lower(): p for p in img_dir.iterdir() if p.is_file()}
    for stem in dict.fromkeys(stems):           # de-duplicate, keep order
        for ext in IMAGE_EXTS:
            if hit := by_name.get(f"{stem}{ext}".lower()):
                return hit
    return None


def report_orphans(members: list[Member], data_dir: Path, pages_dir: Path) -> None:
    slugs = {m.slug for m in members}
    orphans = []
    if data_dir.is_dir():
        orphans += [p for p in data_dir.glob("*.yaml")
                    if "." not in p.stem and p.stem not in slugs | RESERVED_SLUGS]
    if pages_dir.is_dir():
        orphans += [p for p in pages_dir.iterdir()
                    if p.is_dir() and slugify(p.name) not in slugs | CONTENT_NON_MEMBER]
    if orphans:
        cprint(f"\n🧹 {len(orphans)} item(s) not in the roster (left untouched — delete by hand if obsolete):", YELLOW)
        for p in sorted(orphans):
            cprint(f"   {p.relative_to(REPO_ROOT)}", DIM)


# -----------------------------------------------------------------------------
# Entry point
# -----------------------------------------------------------------------------

def get_args() -> argparse.Namespace:
    p = argparse.ArgumentParser(description="Sync the roster Excel into HugoBlox author files.")
    p.add_argument("excel", nargs="?", default=SCRIPT_DIR / "all-members.xlsx", type=Path,
                   help="Roster workbook (default: all-members.xlsx next to this script)")
    p.add_argument("--sheet", default="0", help="Sheet name or 0-based index (default: 0)")
    p.add_argument("--img-dir", type=Path, default=SCRIPT_DIR / "photos", help="Source photos")
    p.add_argument("--data-dir", type=Path, default=REPO_ROOT / "data" / "authors")
    p.add_argument("--media-dir", type=Path, default=REPO_ROOT / "assets" / "media" / "authors")
    p.add_argument("--pages-dir", type=Path, default=REPO_ROOT / "content" / "en" / "authors")
    p.add_argument("--org", default="Dept. of EEE, BUET", help="Affiliation when the row has none")
    p.add_argument("--default-avatar", type=Path, help="Fallback image for members with no avatar at all")
    p.add_argument("--only", choices=("data", "pages"), help="Write only data/authors (+avatars) or only content pages")
    p.add_argument("--dry", action="store_true", help="Preview only; write nothing")
    return p.parse_args()


def main() -> int:
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8")   # emoji-safe when piped on Windows
    args = get_args()
    excel = args.excel.expanduser().resolve()
    if not excel.is_file():
        sys.exit(f"❌ Roster not found: {excel}")
    if args.default_avatar and not args.default_avatar.is_file():
        sys.exit(f"❌ --default-avatar not found: {args.default_avatar}")
    if not args.img_dir.is_dir():
        cprint(f"⚠️  Photo folder not found: {args.img_dir} (existing avatars are kept)", YELLOW)

    sheet: int | str = int(args.sheet) if str(args.sheet).isdigit() else args.sheet
    members = load_roster(excel, sheet)
    cprint(f"👥 {len(members)} members in {excel.name}{' (dry run)' if args.dry else ''}", CYAN, bold=True)

    sync = Sync(args.dry)
    for m in members:
        if args.only != "pages":
            sync.write_text(args.data_dir / f"{m.slug}.yaml", dump_yaml(build_profile(m, args.org)))
            sync.sync_avatar(m, args.img_dir, args.media_dir, args.default_avatar)
        if args.only != "data":
            sync.write_text(args.pages_dir / m.folder / "_index.md", build_page(m, args.org))

    report_orphans(members, args.data_dir, args.pages_dir)
    c = sync.counts
    verb = "would change" if args.dry else "written"
    cprint(f"\n✅ files {verb}: {c['written']}   unchanged: {c['unchanged']}   "
           f"avatars {verb}: {c['avatars']}   members without avatar: {c['no_avatar']}", GREEN, bold=True)
    return 0


if __name__ == "__main__":
    sys.exit(main())
