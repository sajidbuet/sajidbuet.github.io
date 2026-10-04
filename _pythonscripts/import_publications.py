#!/usr/bin/env python3
"""Import cv/papers.bib into the publication folders without losing hand edits.

`academic import --overwrite --compact` regenerates every
content/en/publication/<id>/index.md from its template. On its own that

  * drops every key it does not generate (featured, aliases, hugoblox,
    projects, image, summary, url_code, ...), and the Markdown body;
  * stamps a fresh publishDate on every paper, so each run changes every file;
  * writes single-word authors such as "me" as " me", which links to
    /authors/-me/ instead of the owner's profile.

This script wraps the import and merges each regenerated page back into the
version that existed before it:

  base      the previous front matter and body (hand-written keys, key order,
            formatting and body all survive)
  updated   every value the importer produced from BibTeX overwrites the base,
            except the STICKY keys below, which keep the hand-set value
  links     merged by `name`: BibTeX entries win, extra hand-added links stay
  doi       always stored as `hugoblox.ids.doi` (top-level `doi` is deprecated
            in HugoBlox v0.11 and renders broken scheme-less links)
  authors   leading/trailing whitespace stripped, then each spelling listed in
            data/author_aliases.yaml replaced by its canonical identity
            (a profile slug or one canonical name), so a person gets one
            /authors/ page however the paper printed their name

Pages whose merged content is unchanged are restored byte-for-byte, so a
re-import only touches papers whose BibTeX actually changed.

Usage
-----
    python import_publications.py                  # cv/papers.bib -> content/{en,bn}/publication
    python import_publications.py my.bib --out content/en/publication
"""
from __future__ import annotations

import argparse
import re
import shutil
import subprocess
import sys
import tempfile
from io import StringIO
from pathlib import Path
from typing import Any

try:
    from ruamel.yaml import YAML
except ImportError:
    sys.exit("❌ ruamel.yaml missing. Install the importer with: python -m pip install academic")

SCRIPT_DIR = Path(__file__).resolve().parent
REPO_ROOT = SCRIPT_DIR.parent

# BibTeX spellings of the site owner; each becomes "me" so HugoBlox links the
# papers to data/authors/me.yaml. Regexes, applied in order (longest first).
OWNER_NAMES = [
    r"Sajid Muhaimin Choudhury",
    r"Choudhury, Sajid Muhaimin",
    r"Sajid Choudhury",
    r"S\. M\. Choudhury",
    r"\bSM Choudhury\b",
]
# Every other person: spelling -> canonical identity (see the file's header).
AUTHOR_ALIASES_FILE = REPO_ROOT / "data" / "author_aliases.yaml"
# Importer-generated keys whose hand-set value must survive a re-import.
STICKY = {"publishDate", "featured"}

RESET, GREEN, YELLOW, CYAN, DIM = "\033[0m", "\033[92m", "\033[93m", "\033[96m", "\033[2m"


def cprint(msg: str, colour: str = "") -> None:
    print(f"{colour}{msg}{RESET}")


def make_yaml() -> YAML:
    y = YAML()                      # round-trip, like the importer
    y.preserve_quotes = True
    return y


# -----------------------------------------------------------------------------
# Markdown page handling
# -----------------------------------------------------------------------------

def split_page(text: str) -> tuple[str, str]:
    """Return (front matter, body) of a '---' delimited Markdown page."""
    lines = text.splitlines(keepends=True)
    if not lines or lines[0].rstrip() != "---":
        raise ValueError("no front matter")
    for i in range(1, len(lines)):
        if lines[i].rstrip() == "---":
            return "".join(lines[1:i]), "".join(lines[i + 1:])
    raise ValueError("unterminated front matter")


def read_text(path: Path) -> tuple[str, str]:
    """Read a file as LF text; also return its original newline style."""
    raw = path.read_bytes().decode("utf-8")
    return raw.replace("\r\n", "\n"), ("\r\n" if "\r\n" in raw else "\n")


def write_text(path: Path, text: str, newline: str) -> None:
    path.write_bytes(text.replace("\n", newline).encode("utf-8"))


def link_key(link: Any) -> Any:
    return link.get("name") if isinstance(link, dict) else link


def load_author_aliases(path: Path = AUTHOR_ALIASES_FILE) -> dict[str, str]:
    """Return {spelling: canonical} from data/author_aliases.yaml."""
    if not path.is_file():
        return {}
    data = YAML(typ="safe").load(path.read_text(encoding="utf-8")) or {}
    aliases: dict[str, str] = {}
    for canonical, spellings in data.items():
        if str(canonical).startswith("_"):          # e.g. _not_mapped
            continue
        for spelling in spellings or []:
            spelling = str(spelling).strip()
            if aliases.get(spelling, canonical) != canonical:
                raise ValueError(f"{path.name}: '{spelling}' is listed under both "
                                 f"'{aliases[spelling]}' and '{canonical}'")
            aliases[spelling] = str(canonical)
    return aliases


AUTHOR_ALIASES = load_author_aliases()


def canonical_author(name: Any) -> Any:
    if not isinstance(name, str):
        return name
    name = name.strip()
    return AUTHOR_ALIASES.get(name, name)


def strip_authors(fm: dict) -> bool:
    """Trim author names and map them to their canonical identity, in place."""
    authors = fm.get("authors")
    if not isinstance(authors, list):
        return False
    changed = False
    for i, a in enumerate(authors):
        canonical = canonical_author(a)
        if canonical != a:
            authors[i] = canonical
            changed = True
    return changed


def set_doi(fm: Any, doi: Any) -> bool:
    """Store `doi` as hugoblox.ids.doi (HugoBlox v0.11 deprecates top-level `doi`,
    which also renders scheme-less href="10.xxxx/..." links). Returns True if changed."""
    had_top_level = "doi" in fm
    pos = list(fm).index("doi") if had_top_level else len(fm)
    fm.pop("doi", None)
    hugoblox = fm.get("hugoblox")
    if not isinstance(hugoblox, dict):
        fm.insert(pos, "hugoblox", {"ids": {"doi": doi}})
        return True
    ids = hugoblox.setdefault("ids", {})
    if ids.get("doi") == doi:
        return had_top_level
    ids["doi"] = doi
    return True


def merge(base: dict, new: dict) -> list[str]:
    """Apply importer values from `new` onto `base` in place; return changed keys."""
    changed: list[str] = []
    if "doi" in base and set_doi(base, base["doi"]):
        changed.append("doi→hugoblox.ids.doi")
    for key, value in new.items():
        if key in STICKY and key in base:
            continue
        if key == "doi":
            if set_doi(base, value):
                changed.append("hugoblox.ids.doi")
            continue
        if key == "links" and isinstance(base.get("links"), list) and isinstance(value, list):
            new_keys = {link_key(l) for l in value}
            value = list(value) + [l for l in base["links"] if link_key(l) not in new_keys]
        if key == "authors" and isinstance(value, list):
            value = [canonical_author(a) for a in value]
        if base.get(key) != value:
            base[key] = value
            changed.append(key)
    if strip_authors(base) and "authors" not in changed:
        changed.append("authors")
    return changed


def dump_page(yaml: YAML, fm: Any, body: str) -> str:
    buf = StringIO()
    yaml.dump(fm, buf)
    return f"---\n{buf.getvalue()}---\n{body}"


# -----------------------------------------------------------------------------
# Import
# -----------------------------------------------------------------------------

def snapshot(pub_dir: Path) -> dict[Path, bytes]:
    return {p: p.read_bytes() for p in pub_dir.glob("*/index.md")}


def run_academic(academic: str, bib: Path, pub_dir: Path) -> None:
    cmd = [academic, "import", str(bib), str(pub_dir), "--compact", "--overwrite"]
    result = subprocess.run(cmd)
    if result.returncode != 0:
        raise RuntimeError(f"academic import failed for {pub_dir} (exit code {result.returncode})")


def postprocess(pub_dir: Path, before: dict[Path, bytes]) -> dict[str, int]:
    yaml = make_yaml()
    counts = {"new": 0, "updated": 0, "unchanged": 0}
    for path in sorted(pub_dir.glob("*/index.md")):
        rel = path.relative_to(REPO_ROOT) if path.is_relative_to(REPO_ROOT) else path
        new_text, newline = read_text(path)
        new_fm_text, new_body = split_page(new_text)
        new_fm = yaml.load(new_fm_text) or {}

        if path not in before:                       # paper added to the .bib
            strip_authors(new_fm)
            if "doi" in new_fm:
                set_doi(new_fm, new_fm["doi"])
            write_text(path, dump_page(yaml, new_fm, new_body), newline)
            counts["new"] += 1
            cprint(f"  ➕ {rel}", GREEN)
            continue

        old_raw = before[path]
        old_text = old_raw.decode("utf-8").replace("\r\n", "\n")
        old_newline = "\r\n" if b"\r\n" in old_raw else "\n"
        try:
            old_fm_text, old_body = split_page(old_text)
            base = yaml.load(old_fm_text) or {}
        except Exception as exc:                     # unreadable hand edit: keep importer output
            cprint(f"  ⚠️  {rel}: previous version unreadable ({exc}); kept importer output", YELLOW)
            continue

        changed = merge(base, new_fm)
        if not changed:
            path.write_bytes(old_raw)                # byte-for-byte restore
            counts["unchanged"] += 1
            continue
        write_text(path, dump_page(yaml, base, old_body), old_newline)
        counts["updated"] += 1
        cprint(f"  ✏️  {rel}: {', '.join(changed)}", CYAN)
    return counts


BIB_ENTRY = re.compile(r"@\w+\s*\{\s*([^,\s]+)\s*,(.*?)\n\}", re.S)
BIB_AUTHOR = re.compile(r"(?m)^(\s*author\s*=\s*)\{(.*)\},?\s*$")


def bib_authors(bib: Path) -> dict[str, str]:
    """{citation key (lower case): author field as written in the .bib}."""
    out = {}
    for key, body in BIB_ENTRY.findall(bib.read_text(encoding="utf-8")):
        m = BIB_AUTHOR.search(body)
        if m:
            out[key.lower()] = m.group(2)
    return out


def restore_cite_bib(pub_dir: Path, authors: dict[str, str]) -> int:
    """`academic` writes each cite.bib from the personalised .bib, so the owner
    appears as the author "me" in every downloadable citation. Put the author
    field back exactly as cv/papers.bib has it."""
    fixed = 0
    for path in pub_dir.glob("*/cite.bib"):
        text, newline = read_text(path)
        m = BIB_ENTRY.search(text)
        original = authors.get(m.group(1).lower()) if m else None
        if original is None:
            continue
        new = BIB_AUTHOR.sub(lambda a: f"{a.group(1)}{{{original}}},", text, count=1)
        if new != text:
            write_text(path, new, newline)
            fixed += 1
    return fixed


def personalise_bib(bib: Path, dest: Path) -> int:
    text = bib.read_text(encoding="utf-8")
    total = 0
    for pattern in OWNER_NAMES:
        text, n = re.subn(pattern, "me", text, flags=re.IGNORECASE)
        total += n
    dest.write_text(text, encoding="utf-8")          # no BOM
    return total


def get_args() -> argparse.Namespace:
    p = argparse.ArgumentParser(description="Import a .bib into HugoBlox publication pages, keeping hand edits.")
    p.add_argument("bib", nargs="?", type=Path, default=REPO_ROOT / "cv" / "papers.bib")
    p.add_argument("--out", type=Path, action="append",
                   help="Publication folder (repeatable; default: content/en/publication and content/bn/publication)")
    return p.parse_args()


def main() -> int:
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8")
    args = get_args()
    out_dirs = args.out or [REPO_ROOT / "content" / "en" / "publication", REPO_ROOT / "content" / "bn" / "publication"]
    if not args.bib.is_file():
        sys.exit(f"❌ BibTeX file not found: {args.bib}")
    academic = shutil.which("academic")
    if not academic:
        sys.exit("❌ 'academic' is not on PATH. Install with: python -m pip install academic")

    with tempfile.TemporaryDirectory() as tmp:
        bib_me = Path(tmp) / "papers-me.bib"
        cprint(f"📚 {args.bib.name}: {personalise_bib(args.bib, bib_me)} owner name(s) → 'me'", CYAN)
        for pub_dir in out_dirs:
            pub_dir.mkdir(parents=True, exist_ok=True)
            cprint(f"🔄 academic import → {pub_dir}", CYAN)
            before = snapshot(pub_dir)
            try:
                run_academic(academic, bib_me, pub_dir)
            finally:
                # Merge even after a failed import so partially rewritten pages are repaired.
                c = postprocess(pub_dir, before)
                restore_cite_bib(pub_dir, bib_authors(args.bib))
                cprint(f"✅ {pub_dir.name}: {c['updated']} updated, {c['new']} new, "
                       f"{c['unchanged']} unchanged (hand edits preserved)", GREEN)
    return 0


if __name__ == "__main__":
    try:
        sys.exit(main())
    except RuntimeError as exc:
        sys.exit(f"❌ {exc}")
