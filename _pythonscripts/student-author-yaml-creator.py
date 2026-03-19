#!/usr/bin/env python3
"""Generate HugoBlox/Ownable author YAML files from an Excel roster.

This script is designed for the post-v0.11 HugoBlox / Ownable author system:
  - author data files live in: data/authors/<slug>.yaml
  - avatar images live in:    assets/media/authors/<slug>.<ext>

Typical usage
-------------
python student-author-yaml-creator-v2.py all-members.xlsx --img-dir ./photos

Expected Excel columns
----------------------
Required:
  foldername, name

Common optional columns (supported automatically):
  ApplicationID, Roll, Research Division, BSc Instituton, role, user_groups,
  graduation_year, thesis-title, degree_sought, first_enrollment,
  thesis_approval, email, phone, institution, organization, interests,
  github, linkedin, twitter, x, scholar, orcid, website

Notes
-----
- `bio` is populated from the Excel column `thesis-title` and defaults to "".
- `user_groups` is written at top level, alongside `interests` and `education`.
- Unknown non-empty columns are preserved under the `params` map in YAML.
"""
from __future__ import annotations

import argparse
import math
import re
import shutil
import sys
from pathlib import Path
from typing import Any

import pandas as pd
import yaml

IMAGE_EXTS = [".jpg", ".jpeg", ".png", ".webp"]

RESET, BOLD = "\033[0m", "\033[1m"
GREEN, YELLOW, RED, CYAN = "\033[92m", "\033[93m", "\033[91m", "\033[96m"


class QuoteEmptyStringDumper(yaml.SafeDumper):
    pass


def _repr_str(dumper: yaml.SafeDumper, data: str) -> yaml.nodes.ScalarNode:
    if data == "":
        return dumper.represent_scalar("tag:yaml.org,2002:str", data, style='"')
    return dumper.represent_scalar("tag:yaml.org,2002:str", data)


QuoteEmptyStringDumper.add_representer(str, _repr_str)


def cprint(msg: str, colour: str = "", *, bold: bool = False) -> None:
    prefix = (BOLD if bold else "") + colour
    print(f"{prefix}{msg}{RESET}")



def get_args() -> argparse.Namespace:
    p = argparse.ArgumentParser(
        description="Create HugoBlox data/authors/*.yaml files from an Excel sheet."
    )
    p.add_argument("excel", help="Path to roster Excel file (.xlsx)")
    p.add_argument("--img-dir", default=".", help="Directory containing source photos")
    p.add_argument(
        "--data-dir",
        default="../data/authors",
        help="Destination directory for generated author YAML files",
    )
    p.add_argument(
        "--media-dir",
        default="../assets/media/authors",
        help="Destination directory for copied author avatars",
    )
    p.add_argument(
        "--org",
        default="Dept. of EEE, BUET",
        help="Default organization name if Excel does not provide one",
    )
    p.add_argument(
        "--default-avatar",
        default="",
        help="Optional fallback avatar image to copy when no matching photo is found",
    )
    p.add_argument(
        "--sheet",
        default=0,
        help="Excel sheet name or index (default: first sheet)",
    )
    p.add_argument("--dry", action="store_true", help="Preview only; write nothing")
    return p.parse_args()


# -----------------------------------------------------------------------------
# Helpers
# -----------------------------------------------------------------------------

def is_blank(value: Any) -> bool:
    if value is None:
        return True
    if isinstance(value, float) and math.isnan(value):
        return True
    if isinstance(value, str) and value.strip() == "":
        return True
    return False



def clean_value(value: Any) -> Any:
    if is_blank(value):
        return None
    if hasattr(value, "item"):
        try:
            value = value.item()
        except Exception:
            pass
    if isinstance(value, str):
        value = value.strip()
        return value or None
    if isinstance(value, float) and value.is_integer():
        return int(value)
    return value



def normalize_col(name: str) -> str:
    return re.sub(r"[^a-z0-9]+", "_", str(name).strip().lower()).strip("_")



def slugify(text: str) -> str:
    text = str(text).strip().lower()
    text = re.sub(r"[^a-z0-9]+", "-", text)
    text = re.sub(r"-+", "-", text).strip("-")
    return text



def split_name(full_name: str) -> tuple[str | None, str | None]:
    parts = str(full_name).strip().split()
    if not parts:
        return None, None
    if len(parts) == 1:
        return parts[0], None
    return parts[0], " ".join(parts[1:])



def parse_listish(value: Any) -> list[str] | None:
    value = clean_value(value)
    if value is None:
        return None
    if isinstance(value, list):
        out = [str(v).strip() for v in value if str(v).strip()]
        return out or None
    text = str(value)
    parts = re.split(r"\s*[|;,/]\s*", text)
    out = [p.strip() for p in parts if p.strip()]
    return out or None



def sanitize_for_yaml(obj: Any) -> Any:
    if isinstance(obj, dict):
        out: dict[str, Any] = {}
        for k, v in obj.items():
            sv = sanitize_for_yaml(v)
            if sv not in (None, "", [], {}):
                out[str(k)] = sv
        return out
    if isinstance(obj, list):
        out = [sanitize_for_yaml(v) for v in obj]
        out = [v for v in out if v not in (None, "", [], {})]
        return out
    return clean_value(obj)



def conditional_zfill(app_id: str) -> str:
    app_id = str(app_id).strip()
    return app_id if app_id.startswith("0") else app_id.zfill(7)



def find_image(row: dict[str, Any], img_dir: Path) -> Path | None:
    candidates: list[str] = []
    for key in ("applicationid", "roll", "foldername", "name"):
        value = clean_value(row.get(key))
        if value is None:
            continue
        val = str(value).strip()
        candidates.append(val)
        if key == "applicationid":
            candidates.append(conditional_zfill(val))
    seen: set[str] = set()
    ordered_candidates = []
    for cand in candidates:
        if cand not in seen:
            seen.add(cand)
            ordered_candidates.append(cand)
    for stem in ordered_candidates:
        for ext in IMAGE_EXTS:
            fp = img_dir / f"{stem}{ext}"
            if fp.is_file():
                return fp.resolve()
    return None



def build_social(row: dict[str, Any]) -> list[dict[str, str]]:
    mapping = [
        ("email", "envelope", lambda v: f"mailto:{v}"),
        ("website", "link", lambda v: str(v)),
        ("github", "brands/github", lambda v: str(v)),
        ("linkedin", "brands/linkedin", lambda v: str(v)),
        ("twitter", "brands/x", lambda v: str(v)),
        ("x", "brands/x", lambda v: str(v)),
        ("scholar", "academicons/google-scholar", lambda v: str(v)),
        ("orcid", "academicons/orcid", lambda v: str(v)),
    ]
    social = []
    for col, icon, transform in mapping:
        value = clean_value(row.get(col))
        if value is not None:
            social.append({"icon": icon, "link": transform(value)})
    return social



def build_author_record(
    row: dict[str, Any], *, slug: str, default_org: str, avatar_ext: str | None
) -> dict[str, Any]:
    title = clean_value(row.get("name"))
    if title is None:
        raise ValueError("missing name")

    first_name, last_name = split_name(title)

    organization_name = (
        clean_value(row.get("organization"))
        or clean_value(row.get("institution"))
        or default_org
    )

    interests = parse_listish(row.get("interests"))
    if not interests:
        research_division = clean_value(row.get("research_division"))
        if research_division:
            interests = [str(research_division)]

    user_groups = parse_listish(row.get("user_groups"))

    education = []
    bsc_inst = clean_value(row.get("bsc_instituton"))
    grad_year = clean_value(row.get("graduation_year"))
    if bsc_inst:
        education.append(
            sanitize_for_yaml(
                {
                    "course": "BSc",
                    "institution": bsc_inst,
                    "year": grad_year,
                }
            )
        )

    thesis_title = clean_value(row.get("thesis_title"))
    if thesis_title:
        degree = clean_value(row.get("degree_sought")) or "Thesis"
        education.append(
            sanitize_for_yaml(
                {
                    "course": f"{degree} Research",
                    "institution": organization_name,
                }
            )
        )

    known_fields = {
        "applicationid",
        "roll",
        "name",
        "research_division",
        "bsc_instituton",
        "foldername",
        "role",
        "user_groups",
        "graduation_year",
        "thesis_title",
        "degree_sought",
        "first_enrollment",
        "thesis_approval",
        "email",
        "phone",
        "institution",
        "organization",
        "bio",
        "interests",
        "github",
        "linkedin",
        "twitter",
        "x",
        "scholar",
        "orcid",
        "website",
    }

    extra_params = {}
    for col, value in row.items():
        if col in known_fields:
            continue
        value = clean_value(value)
        if value is not None:
            extra_params[col] = value

    student_params = sanitize_for_yaml(
        {
            "application_id": row.get("applicationid"),
            "roll": row.get("roll"),
            "degree_sought": row.get("degree_sought"),
            "first_enrollment": row.get("first_enrollment"),
            "thesis_status": row.get("thesis_approval"),
            "thesis_title": thesis_title,
            "research_division": row.get("research_division"),
            "phone": row.get("phone"),
        }
    )

    params = {}
    if student_params:
        params["student"] = student_params
    if extra_params:
        params["excel"] = sanitize_for_yaml(extra_params)

    record: dict[str, Any] = {
        "title": title,
        "name": sanitize_for_yaml({"first": first_name, "last": last_name}),
        "role": clean_value(row.get("role")),
        "bio": thesis_title or "",
        "organizations": [{"name": organization_name}],
        "education": education,
        "interests": interests,
        "user_groups": user_groups,
        "social": build_social(row),
        "params": params,
    }

    if record["role"] is None:
        del record["role"]
    if not record["organizations"]:
        del record["organizations"]
    if not record["education"]:
        del record["education"]
    if not record["interests"]:
        del record["interests"]
    if not record["user_groups"]:
        del record["user_groups"]
    if not record["social"]:
        del record["social"]
    if not record["params"]:
        del record["params"]

    return record


# -----------------------------------------------------------------------------
# Core processing
# -----------------------------------------------------------------------------

def process(
    df: pd.DataFrame,
    *,
    img_dir: Path,
    data_dir: Path,
    media_dir: Path,
    default_avatar: Path | None,
    default_org: str,
    dry: bool,
) -> None:
    data_dir.mkdir(parents=True, exist_ok=True) if not dry else None
    media_dir.mkdir(parents=True, exist_ok=True) if not dry else None

    total = len(df)
    written = 0
    copied = 0
    missing_photos = 0

    cprint(f"Processing {total} rows...", CYAN, bold=True)
    cprint(f"YAML output : {data_dir}", CYAN)
    cprint(f"Avatar output: {media_dir}", CYAN)

    records = df.to_dict(orient="records")

    for raw_row in records:
        row = {normalize_col(k): clean_value(v) for k, v in raw_row.items()}
        title = clean_value(row.get("name"))
        foldername = clean_value(row.get("foldername"))

        if not title:
            cprint("⚠️  Skipping row with empty name", YELLOW)
            continue

        slug = slugify(foldername or title)
        if not slug:
            cprint(f"⚠️  Could not derive slug for {title}; skipping", YELLOW)
            continue
        if slug == "admin":
            cprint(f"↷ Skipping reserved slug: {slug}", YELLOW)
            continue

        avatar_src = find_image(row, img_dir) if img_dir.is_dir() else None
        avatar_ext: str | None = None
        if avatar_src is None and default_avatar and default_avatar.is_file():
            avatar_src = default_avatar.resolve()

        if avatar_src is not None:
            avatar_ext = avatar_src.suffix.lower()
            avatar_dst = media_dir / f"{slug}{avatar_ext}"
            if dry:
                cprint(f"🖼️  {avatar_src.name} -> {avatar_dst.name} [dry]", GREEN)
            else:
                shutil.copy2(avatar_src, avatar_dst)
                copied += 1
        else:
            missing_photos += 1

        record = build_author_record(
            row,
            slug=slug,
            default_org=default_org,
            avatar_ext=avatar_ext,
        )

        yaml_path = data_dir / f"{slug}.yaml"
        yaml_text = yaml.dump(
            record,
            Dumper=QuoteEmptyStringDumper,
            allow_unicode=True,
            sort_keys=False,
            default_flow_style=False,
            width=100,
        )

        if dry:
            cprint(f"📝 {yaml_path.name} [dry]", GREEN)
        else:
            yaml_path.write_text(yaml_text, encoding="utf-8")
            written += 1
            cprint(f"📝 {yaml_path}", GREEN)

    cprint("\nSummary", CYAN, bold=True)
    cprint(f"✅ YAML files written : {written if not dry else 'preview only'}", GREEN, bold=True)
    cprint(f"🖼️  Avatars copied    : {copied if not dry else 'preview only'}", GREEN)
    cprint(f"⚠️  Missing photos    : {missing_photos}", YELLOW if missing_photos else GREEN)


# -----------------------------------------------------------------------------
# Entry point
# -----------------------------------------------------------------------------

def main() -> None:
    args = get_args()

    excel_path = Path(args.excel).expanduser().resolve()
    img_dir = Path(args.img_dir).expanduser().resolve()
    data_dir = Path(args.data_dir).expanduser().resolve()
    media_dir = Path(args.media_dir).expanduser().resolve()
    default_avatar = Path(args.default_avatar).expanduser().resolve() if args.default_avatar else None

    if not excel_path.exists():
        sys.exit(f"❌ Excel file not found: {excel_path}")

    try:
        sheet = int(args.sheet)
    except ValueError:
        sheet = args.sheet

    try:
        df = pd.read_excel(excel_path, engine="openpyxl", sheet_name=sheet)
    except ImportError:
        sys.exit("❌ Missing dependency. Install with: pip install pandas openpyxl pyyaml")
    except PermissionError:
        sys.exit("❌ Excel file is open elsewhere. Close it and retry.")
    except Exception as e:
        sys.exit(f"❌ Failed to read Excel: {e}")

    normalized_cols = {normalize_col(c) for c in df.columns}
    missing = {"foldername", "name"} - normalized_cols
    if missing:
        sys.exit("❌ Excel is missing required columns: " + ", ".join(sorted(missing)))

    process(
        df,
        img_dir=img_dir,
        data_dir=data_dir,
        media_dir=media_dir,
        default_avatar=default_avatar,
        default_org=args.org,
        dry=args.dry,
    )


if __name__ == "__main__":
    main()
