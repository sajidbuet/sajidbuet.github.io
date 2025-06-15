#!/usr/bin/env python3
"""student-page-creator.py  🚀  (HugoBlox People Page Generator)
════════════════════════════════════════════════════════════

Synchronise a roster Excel sheet with HugoBlox *People* pages.

Key features (2025‑05‑16)
------------------------
* **Create or update** each author folder (`content/authors/<foldername>`).
* Skip the **special** `admin/` folder entirely.
* Copy a personal photo to `avatar.jpg` once; fall back to `--default-avatar`.
* (Re)write `_index.md` with YAML front‑matter and bio bullets on every run.
* Colourful, emoji‑rich console output and safe **dry‑run** mode.

Required Excel headers
----------------------
```
ApplicationID | Roll | name | Research Division | BSc Instituton | foldername |
role | user_groups | graduation_year | thesis-title
```

Typical usage
-------------
```bash
# real run
author_excel=all-members.xlsx
python student-page-creator.py $author_excel --img-dir ./photos

# preview (nothing written)
python student-page-creator.py $author_excel --dry
```
"""
from __future__ import annotations

import argparse
import logging
import os
import shutil
import sys
from pathlib import Path

import pandas as pd  # pip install pandas openpyxl

###############################################################################
# Console helpers                                                             #
###############################################################################

RESET, BOLD = "\033[0m", "\033[1m"
GREEN, YELLOW, RED, CYAN = "\033[92m", "\033[93m", "\033[91m", "\033[96m"
FOLDER_EMO, COPY_EMO, WRITE_EMO, WARN_EMO, PASS_EMO, LOCK_EMO = "📁", "🖼️", "📝", "⚠️", "✅", "🔒"


def cprint(msg: str, colour: str = "", *, bold: bool = False) -> None:
    """Colourised print helper."""
    prefix = (BOLD if bold else "") + colour
    print(f"{prefix}{msg}{RESET}")

###############################################################################
# CLI arguments                                                               #
###############################################################################

EXTENSIONS = [".jpg", ".jpeg", ".png"]


def get_args() -> argparse.Namespace:
    """Parse command‑line arguments."""
    p = argparse.ArgumentParser(description="Create / refresh HugoBlox author pages from Excel.")
    p.add_argument("excel", help="Path to roster Excel (.xlsx)")
    p.add_argument("--img-dir", default=".", help="Directory containing photos")
    p.add_argument("--pages-dir", default="../content/authors", help="Author folders root")
    p.add_argument("--org", default="Q‑PACER RG, Dept of EEE, BUET", help="Organisation name")
    p.add_argument("--default-avatar", default="./default-avatar.jpg", help="Fallback avatar path")
    p.add_argument("--dry", action="store_true", help="Dry‑run – no file writes")
    return p.parse_args()

###############################################################################
# Utility functions                                                           #
###############################################################################


def conditional_zfill(app_id: str) -> str:
    """Pad to 7 digits unless ID already starts with 0."""
    return app_id if app_id.startswith("0") else app_id.zfill(7)


def find_image(app_id: str, img_dir: Path) -> Path | None:
    """Return the first matching photo for *app_id* or None."""
    aid_padded = conditional_zfill(app_id)
    for ext in EXTENSIONS:
        for cand in (img_dir / f"{app_id}{ext}", img_dir / f"{aid_padded}{ext}"):
            if cand.is_file():
                return cand.resolve()
    return None


def split_name(full_name: str) -> tuple[str, str]:
    parts = full_name.strip().split()
    return (parts[0], " ".join(parts[1:])) if parts else ("", "")


def build_yaml(front: dict) -> str:
    """Return a YAML front‑matter block, skipping empty fields."""
    lines = ["---"]
    for k, v in front.items():
        if v in (None, "", []):
            continue
        if isinstance(v, list):
            lines.append(f"{k}:")
            lines += [f"  - {item}" for item in v]
        elif isinstance(v, dict):
            lines.append(f"{k}:")
            lines += [f"  {ik}: {iv}" for ik, iv in v.items()]
        else:
            lines.append(f"{k}: {v}")
    lines.append("---")
    return "\n".join(lines)


def write_markdown(folder: Path, front: dict, body: list[str], *, dry: bool) -> None:
    md_path = folder / "_index.md"
    short = f"{folder.name}{os.sep}{md_path.name}"
    content = build_yaml(front) + "\n\n" + "\n".join(body) + "\n"
    if dry:
        cprint(f"{WRITE_EMO} {short} (dry)", CYAN)
        return
    try:
        md_path.write_text(content, encoding="utf‑8")
    except PermissionError:
        cprint(f"{WARN_EMO} cannot write markdown – open elsewhere: {md_path}", RED)

###############################################################################
# Core processing                                                             #
###############################################################################


def process_roster(df: pd.DataFrame, *, img_dir: Path, pages_dir: Path, default_avatar: Path, args) -> None:
    total = len(df)
    processed = skipped_avatar = fallback_used = missing_photo = 0
    cprint(f"Processing {total} rows…", CYAN, bold=True)
    cprint(f"Author pages root: {pages_dir}", CYAN)

    for _, row in df.iterrows():
        foldername = str(row["foldername"]).strip()
        if foldername.lower() == "admin":
            continue  # skip special folder

        author_dir = pages_dir / foldername
        avatar_dst = author_dir / "avatar.jpg"

        # 1 ‑ ensure folder exists
        if not author_dir.exists():
            (cprint(f"{FOLDER_EMO} {author_dir} [dry‑create]", GREEN)
             if args.dry else (author_dir.mkdir(parents=True, exist_ok=True),
                               cprint(f"{FOLDER_EMO} {author_dir}", GREEN)))

        # 2 ‑ copy avatar only if missing
        if not avatar_dst.is_file():
            src = find_image(str(row["ApplicationID"]).strip(), img_dir)
            if src is None and default_avatar.is_file():
                fallback_used += 1
                src = default_avatar
                cprint(f"{COPY_EMO} using default avatar for {foldername}", CYAN)
            if src is None:
                missing_photo += 1
            elif args.dry:
                cprint(f"{COPY_EMO} {src.name} → {avatar_dst} [dry]", GREEN)
            else:
                try:
                    shutil.copy(src, avatar_dst)
                    cprint(f"{COPY_EMO} {avatar_dst}", GREEN)
                except PermissionError:
                    cprint(f"{WARN_EMO} cannot copy avatar – file locked: {avatar_dst}", RED)
        else:
            skipped_avatar += 1

        # 3 ‑ write / refresh markdown
        first, last = split_name(str(row["name"]).strip())
        yaml_front = {
            "title": row["name"].strip(),
            "slug": foldername.lower(),
            "first_name": first,
            "last_name": last,
            "authors": [foldername],
            "superuser": False,
            "organizations": [{"name": args.org, "url": ""}],
            "role": str(row.get("role", "")).strip() or None,
            "user_groups": [str(row.get("user_groups", "")).strip()] if str(row.get("user_groups", "")).strip() else None,
            "graduation_year": str(row.get("graduation_year", "")).strip() or None,
            "thesis": {"title": str(row.get("thesis-title", "")).strip()} if str(row.get("thesis-title", "")).strip() else None,
        }
        body = [
            "## Information",
            f"* **Student ID:** {row['Roll']}",
            f"* **BSc Institution:** {row['BSc Instituton']}",
            f"* **Working Towards:** {row.get('degree_sought', '')}",
            f"* **First Enrollment:** {row.get('first_enrollment', '')}",
            f"* **Research Division:** {row['Research Division']}",
            f"* **Thesis Status:** {row.get('thesis_approval', '')}",
        ]
        write_markdown(author_dir, yaml_front, body, dry=args.dry)
        processed += 1

    # summary
    cprint("\nSummary", CYAN, bold=True)
    cprint(f"{PASS_EMO} Pages processed : {processed}/{total}", GREEN, bold=True)
    cprint(f"{COPY_EMO} Avatars skipped : {skipped_avatar}", YELLOW)
    cprint(f"{COPY_EMO} Default avatars : {fallback_used}", CYAN)
    cprint(f"{WARN_EMO} Missing photos  : {missing_photo}", RED if missing_photo else GREEN)

###############################################################################
# Entry point                                                                 #
###############################################################################


def main() -> None:
    args = get_args()

    excel_path = Path(args.excel).expanduser().resolve()
    img_dir = Path(args.img_dir).expanduser().resolve()
    pages_dir = Path(args.pages_dir).expanduser().resolve()
    default_avatar = Path(args.default_avatar).expanduser().resolve()

    if not excel_path.exists():
        sys.exit(f"❌  Excel not found: {excel_path}")
    if not img_dir.is_dir():
        sys.exit(f"❌  Image directory not found: {img_dir}")
    if not default_avatar.exists():
        cprint(f"{WARN_EMO} default avatar not found: {default_avatar}", YELLOW)

    logging.basicConfig(level=logging.ERROR)

    try:
        # Read via the *path* (not a file‑like object) so pandas can pick the correct engine.
        df = pd.read_excel(excel_path, engine="openpyxl", sheet_name=0)
    except ImportError as e:
        cprint(f"{LOCK_EMO}  openpyxl is not installed – install with `pip install openpyxl`.", RED, bold=True)
        sys.exit(1)
    except PermissionError:
        cprint(f"{LOCK_EMO}  Excel file is open elsewhere. Close it and retry.", RED, bold=True)
        sys.exit(1)

    required = {"ApplicationID", "Roll", "name", "Research Division", "BSc Instituton", "foldername"}
    missing_cols = required.difference(df.columns)
    if missing_cols:
        sys.exit("❌  Excel missing required columns: " + ", ".join(sorted(missing_cols)))

    process_roster(df, img_dir=img_dir, pages_dir=pages_dir, default_avatar=default_avatar, args=args)


if __name__ == "__main__":
    main()
