#!/usr/bin/env python3
"""student-page-creator.py  🚀  (HugoBlox People Page Generator)
════════════════════════════════════════════════════════════

This script converts a roster Excel sheet into HugoBlox "People" pages.

Workflow for each row
---------------------
1. 📁  Ensure folder `content/authors/<foldername>` exists.
2. 🖼️   Copy `<ApplicationID>.jpg|png|jpeg` → `avatar.jpg` **or**, if missing,
   fall back to the file given by `--default-avatar`. If an avatar already
   exists inside the folder it is **never** overwritten.
3. 📝   Generate/refresh `_index.md` with YAML front‑matter populated from the
   Excel row (optional fields are included only when non‑blank).

Required Excel headers
----------------------
```
ApplicationID | Roll | name | Research Division | BSc Instituton | foldername |
role | user_groups | graduation_year | thesis-title
```

Run
---
```bash
python student-page-creator.py students.xlsx \
       --img-dir ./photos \
       --pages-dir ./content/authors \
       --default-avatar ./default-avatar.jpg      # default path
```
Use `--dry` for a safe preview (no filesystem writes).
"""

from __future__ import annotations

import argparse
import logging
import shutil
import sys
import textwrap
from pathlib import Path

import pandas as pd  # pip install pandas openpyxl

###############################################################################
# Console helpers                                                             #
###############################################################################

RESET  = "\033[0m"; BOLD = "\033[1m"; GREEN = "\033[92m"; YELLOW = "\033[93m"; RED = "\033[91m"; CYAN = "\033[96m"
FOLDER_EMO, COPY_EMO, WRITE_EMO, WARN_EMO, PASS_EMO, LOCK_EMO = "📁", "🖼️ ", "📝", "⚠️ ", "✅", "🔒"

def cprint(msg: str, colour: str = "", *, bold: bool = False) -> None:
    print(f"{(BOLD if bold else '') + colour}{msg}{RESET}")

###############################################################################
# CLI                                                                         #
###############################################################################

EXTENSIONS = [".jpg", ".jpeg", ".png"]

def get_args() -> argparse.Namespace:
    p = argparse.ArgumentParser(description="Generate colourful HugoBlox author pages.")
    p.add_argument("excel", help="Roster Excel file (.xlsx)")
    p.add_argument("--img-dir", default=".", help="Directory containing photos")
    p.add_argument("--pages-dir", default="./content/authors", help="Destination root for author folders")
    p.add_argument("--org", default="Q-PACER RG, Dept of EEE, BUET", help="Organisation string for YAML")
    p.add_argument("--default-avatar", default="./default-avatar.jpg", help="Fallback avatar when photo missing")
    p.add_argument("--dry", action="store_true", help="Preview run – no file writes")
    return p.parse_args()

###############################################################################
# Helpers                                                                     #
###############################################################################

def conditional_zfill(app_id: str) -> str:
    return app_id if app_id.startswith("0") else app_id.zfill(7)

def find_image(app_id: str, img_dir: Path) -> Path | None:
    app_id_pad = conditional_zfill(app_id)
    for ext in EXTENSIONS:
        for cand in (img_dir / f"{app_id}{ext}", img_dir / f"{app_id_pad}{ext}"):
            if cand.is_file():
                return cand.resolve()
    return None

def split_name(full_name: str) -> tuple[str, str]:
    parts = full_name.strip().split()
    return (parts[0], " ".join(parts[1:])) if parts else ("", "")

def build_yaml(front: dict) -> str:
    lines = ["---"]
    for k, v in front.items():
        if v in (None, ""): continue
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

def write_markdown(dest: Path, *, front: dict, body: list[str], dry: bool=False):
    md_path = dest / "_index.md"
    content = build_yaml(front) + "\n\n" + "\n".join(body) + "\n"
    if dry:
        cprint(f"{WRITE_EMO} {md_path} (dry)", CYAN)
    else:
        try:
            md_path.write_text(content, encoding="utf-8")
            cprint(f"{WRITE_EMO} {md_path}", CYAN)
        except PermissionError:
            cprint(f"{WARN_EMO} cannot write markdown – open elsewhere: {md_path}", RED)

###############################################################################
# Core                                                                        #
###############################################################################

def process(df: pd.DataFrame, img_dir: Path, pages_dir: Path, default_avatar: Path, args):
    total = len(df)
    processed = skipped = fallback_used = 0
    missing_photo = 0

    cprint(f"Processing {total} rows…", CYAN, bold=True)

    for _, row in df.iterrows():
        app_id = str(row["ApplicationID"]).strip()
        foldername = str(row["foldername"]).strip()
        dest_dir = pages_dir / foldername
        avatar_dst = dest_dir / "avatar.jpg"

        # ensure folder
        if not dest_dir.exists():
            if args.dry:
                cprint(f"{FOLDER_EMO} {dest_dir} [dry-create]", GREEN)
            else:
                dest_dir.mkdir(parents=True)
                cprint(f"{FOLDER_EMO} {dest_dir}", GREEN)

        # avatar logic
        if avatar_dst.is_file():
            skipped +=1
            cprint(f"{COPY_EMO} avatar exists – skip copy for {foldername}", YELLOW)
        else:
            src = find_image(app_id, img_dir)
            if src is None:
                # try default avatar
                if default_avatar.is_file():
                    src = default_avatar
                    fallback_used += 1
                    cprint(f"{COPY_EMO} using default avatar for {foldername}", CYAN)
                else:
                    cprint(f"{WARN_EMO} no photo and default avatar missing", RED)
                    missing_photo += 1
                    src = None
            if src is not None and not args.dry:
                try:
                    shutil.copy(src, avatar_dst)
                    cprint(f"{COPY_EMO} {avatar_dst}", GREEN)
                except PermissionError:
                    cprint(f"{WARN_EMO} cannot copy avatar – file in use: {avatar_dst}", RED)
            elif src is not None and args.dry:
                cprint(f"{COPY_EMO} {src.name} → {avatar_dst} [dry]", GREEN)

        # markdown
        first, last = split_name(str(row["name"]).strip())
        front = {
            "title": row["name"].strip(),
            "first_name": f"{first} {last}",
            "last_name": str(row["Roll"]).strip(),
            "authors": [foldername],
            "superuser": "false",
            "organizations": [f"{{name: {args.org}, url: ''}}"],
            "role": str(row.get("role", "")).strip() or None,
            "user_groups": [str(row.get("user_groups", "")).strip()] if str(row.get("user_groups", "")).strip() else None,
            "graduation_year": str(row.get("graduation_year", "")).strip() or None,
            "thesis": {"title": str(row.get("thesis-title", "")).strip()} if str(row.get("thesis-title", "")).strip() else None,
        }
        body = [
            f"* **Student ID:** {row['Roll']}",
            f"* **Research Division:** {row['Research Division']}",
            f"* **BSc Institution:** {row['BSc Instituton']}",
        ]
        write_markdown(dest_dir, front=front, body=body, dry=args.dry)
        processed += 1

    # summary
    cprint("\nSummary", CYAN, bold=True)
    cprint(f"{PASS_EMO} Pages processed : {processed}/{total}", GREEN, bold=True)
    cprint(f"{COPY_EMO} Avatars skipped  : {skipped}", YELLOW)
    cprint(f"{COPY_EMO} Default avatars  : {fallback_used}", CYAN)
    cprint(f"{WARN_EMO} Missing photos   : {missing_photo}", RED if missing_photo else GREEN)

###############################################################################
# Entry                                                                       #
###############################################################################

def main():
    args = get_args()
    excel_path = Path(args.excel).expanduser().resolve()
    img_dir = Path(args.img_dir).expanduser().resolve()
    pages_dir = Path(args.pages_dir).expanduser().resolve()
    default_avatar = Path(args.default_avatar).expanduser().resolve()

    if not excel_path.exists():
        sys.exit(f"❌  Excel not found: {excel_path}")
    if not img_dir.is_dir():
        sys.exit(f"❌  Image dir not found: {img_dir}")
    if not default_avatar.is_file():
        cprint(f"{WARN_EMO} default avatar not found: {default_avatar}", YELLOW)

    logging.basicConfig(level=logging.ERROR)

    try:
        with open(excel_path, "rb") as f:
            df = pd.read_excel(f, engine="openpyxl", engine_kwargs={"read_only": True})
    except PermissionError:
        cprint(f"{LOCK_EMO}  Excel file is open elsewhere. Close it and retry.", RED, bold=True)
        sys.exit(1)

    required = {"ApplicationID","Roll","name","Research Division","BSc Instituton","foldername"}
    if not required.issubset(df.columns):
        sys.exit("❌  Excel missing required columns: " + ", ".join(required))

    process(df, img_dir, pages_dir, default_avatar, args)

if __name__ == "__main__":
    main()
