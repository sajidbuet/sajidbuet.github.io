#!/usr/bin/env python3
"""student-page-creator.py  🚀  (HugoBlox People Page Generator)
════════════════════════════════════════════════════════════

For **each row** in a roster Excel sheet this script will
1. 📁 create/verify an author folder `content/authors/<foldername>`.
2. 🖼️  copy `<ApplicationID>.jpg|png|jpeg` → `avatar.jpg` *unless it already exists*.
3. 📝 (re)write `_index.md` with YAML front‑matter populated from that row.

Expected Excel headers (exact):
    ApplicationID | Roll | name | Research Division | BSc Instituton | foldername |
    role | user_groups | graduation_year | thesis-title

Optional columns (**role**, **user_groups**, **graduation_year**, **thesis-title**) are
added to the YAML only if their cell is non‑blank.

Run (always colourful & verbose):
    python student-page-creator.py students.xlsx \
        --img-dir ./photos \
        --pages-dir ./content/authors

Add `--dry` for a safe preview with **no** filesystem writes.
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
# Console‑colour helpers                                                      #
###############################################################################

RESET  = "\033[0m"
BOLD   = "\033[1m"
GREEN  = "\033[92m"
YELLOW = "\033[93m"
RED    = "\033[91m"
CYAN   = "\033[96m"

FOLDER_EMO = "📁"
COPY_EMO   = "🖼️ "
WRITE_EMO  = "📝"
WARN_EMO   = "⚠️ "
PASS_EMO   = "✅"
LOCK_EMO   = "🔒"


def cprint(msg: str, colour: str = "", *, bold: bool = False) -> None:
    """Print *msg* in colour (and optionally bold)."""
    prefix = (BOLD if bold else "") + colour
    print(f"{prefix}{msg}{RESET}")

###############################################################################
# CLI arguments                                                               #
###############################################################################

EXTENSIONS = [".jpg", ".jpeg", ".png"]


def get_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Generate HugoBlox author pages (colourful output)."
    )
    parser.add_argument("excel", help="Roster Excel file (.xlsx)")
    parser.add_argument("--img-dir", default=".", help="Directory with photos")
    parser.add_argument(
        "--pages-dir",
        default="./content/authors",
        help="Destination root for author folders",
    )
    parser.add_argument(
        "--org",
        default="Q-PACER RG, Dept of EEE, BUET",
        help="Organisation string for YAML (constant)",
    )
    parser.add_argument("--dry", action="store_true", help="Preview only – no writes")
    return parser.parse_args()

###############################################################################
# Helper functions                                                            #
###############################################################################

def conditional_zfill(app_id: str) -> str:
    """Return *app_id* padded to 7 digits unless it already starts with 0."""
    return app_id if app_id.startswith("0") else app_id.zfill(7)


def find_image(app_id: str, img_dir: Path) -> Path | None:
    """Find the first image that matches *app_id* in *img_dir*."""
    app_id_pad = conditional_zfill(app_id)
    for ext in EXTENSIONS:
        for candidate in (img_dir / f"{app_id}{ext}", img_dir / f"{app_id_pad}{ext}"):
            if candidate.is_file():
                return candidate.resolve()
    return None


def split_name(full_name: str) -> tuple[str, str]:
    parts = full_name.strip().split()
    return (parts[0], " ".join(parts[1:])) if parts else ("", "")


def build_yaml(front: dict) -> str:
    """Serialize *front* (skipping None/"") to minimal YAML."""
    lines: list[str] = ["---"]
    for key, value in front.items():
        if value in (None, ""):
            continue
        if isinstance(value, list):
            lines.append(f"{key}:")
            for v in value:
                lines.append(f"  - {v}")
        elif isinstance(value, dict):
            lines.append(f"{key}:")
            for k, v in value.items():
                lines.append(f"  {k}: {v}")
        else:
            lines.append(f"{key}: {value}")
    lines.append("---")
    return "\n".join(lines)


def write_markdown(
    dest: Path,
    *,
    front: dict,
    body_lines: list[str],
    dry: bool = False,
) -> None:
    """Create/overwrite `_index.md` in *dest* using *front* and *body_lines*."""
    md_path = dest / "_index.md"
    content = build_yaml(front) + "\n\n" + "\n".join(body_lines) + "\n"

    if dry:
        cprint(f"{WRITE_EMO} {md_path} (dry)", CYAN)
    else:
        try:
            md_path.write_text(content, encoding="utf-8")
            cprint(f"{WRITE_EMO} {md_path}", CYAN)
        except PermissionError:
            cprint(f"{WARN_EMO} cannot write markdown – file open elsewhere: {md_path}", RED)

###############################################################################
# Core processing                                                             #
###############################################################################

def process(df: pd.DataFrame, img_dir: Path, pages_dir: Path, args) -> None:
    total = len(df.index)
    processed = skipped_avatar = missing_photo = 0

    cprint(f"Processing {total} rows…", CYAN, bold=True)

    for _, row in df.iterrows():
        # ── extract & sanitise values ─────────────────────────────────────
        app_id_raw = str(row["ApplicationID"]).strip()
        foldername = str(row["foldername"]).strip()
        full_name  = str(row["name"]).strip()
        first, last = split_name(full_name)
        division   = str(row["Research Division"]).strip()
        bsc_inst   = str(row["BSc Instituton"]).strip()
        student_id = str(row["Roll"]).strip()
        role        = str(row.get("role", "")).strip()
        user_groups = str(row.get("user_groups", "")).strip()
        grad_year   = str(row.get("graduation_year", "")).strip()
        thesis_ttl  = str(row.get("thesis-title", "")).strip()

        dest_dir   = pages_dir / foldername
        avatar_dst = dest_dir / "avatar.jpg"

        # ── ensure folder exists ─────────────────────────────────────────
        if not dest_dir.exists():
            if args.dry:
                cprint(f"{FOLDER_EMO} {dest_dir} (create) [dry]", GREEN)
            else:
                dest_dir.mkdir(parents=True)
                cprint(f"{FOLDER_EMO} {dest_dir}", GREEN)

        # ── copy avatar if needed ────────────────────────────────────────
        if not avatar_dst.is_file():
            img_src = find_image(app_id_raw, img_dir)
            if img_src:
                if args.dry:
                    cprint(f"{COPY_EMO} {img_src.name} → {avatar_dst} [dry]", GREEN)
                else:
                    try:
                        shutil.copy(img_src, avatar_dst)
                        cprint(f"{COPY_EMO} {avatar_dst}", GREEN)
                    except PermissionError:
                        cprint(f"{WARN_EMO} cannot copy avatar – file in use: {avatar_dst}", RED)
            else:
                cprint(f"{WARN_EMO} no photo for {app_id_raw}", YELLOW)
                missing_photo += 1
        else:
            skipped_avatar += 1
            cprint(f"{COPY_EMO} avatar exists – skip copy for {foldername}", YELLOW)

        # ── build YAML front‑matter dict ─────────────────────────────────
        front = {
            "title": full_name,
            "first_name": f"{first} {last}",
            "last_name": student_id,
            "authors": [foldername],
            "superuser": "false",
            "organizations": [f"{{name: {args.org}, url: ''}}"],
            # optional
            "role": role or None,
            "user_groups": [user_groups] if user_groups else None,
            "graduation_year": grad_year or None,
            "thesis": {"title": thesis_ttl} if thesis_ttl else None,
        }

        body_lines = [
            f"* **Student ID:** {student_id}",
            f"* **Research Division:** {division}",
            f"* **BSc Institution:** {bsc_inst}",
        ]

        write_markdown(dest_dir, front=front, body_lines=body_lines, dry=args.dry)
        processed += 1

    # ── summary ──────────────────────────────────────────────────────────
    cprint("\nSummary", CYAN, bold=True)
    cprint(f"{PASS_EMO} Pages processed : {processed}/{total}", GREEN, bold=True)
    cprint(f"{COPY_EMO} Avatars skipped  : {skipped_avatar}", YELLOW)
    cprint(f"{WARN_EMO} Missing photos   : {missing_photo}", RED if missing_photo else GREEN)

###############################################################################
# Entry                                                                       #
###############################################################################

def main() -> None:
    args = get_args()

    excel_path = Path(args.excel).expanduser().resolve()
    img_dir    = Path(args.img_dir).expanduser().resolve()
    pages_dir  = Path(args.pages_dir).expanduser().resolve()

    if not excel_path.exists():
        sys.exit(f"❌  Excel file not found: {excel_path}")
    if not img_dir.is_dir():
        sys.exit(f"❌  Image directory not found: {img_dir}")

    logging.basicConfig(level=logging.ERROR)

    # read Excel in *read‑only* mode to avoid Windows lock issues
    try:
        with open(excel_path, "rb") as f:
            df = pd.read_excel(f, engine="openpyxl", engine_kwargs={"read_only": True})
    except PermissionError:
        cprint(f"{LOCK_EMO}  Excel file is open elsewhere. Close it and retry.", RED, bold=True)
        sys.exit(1)
    except Exception as exc:
        sys.exit(f"❌  Failed to read Excel: {exc}")

    mandatory = {
        "ApplicationID",
        "Roll",
        "name",
        "Research Division",
        "BSc Instituton",
        "foldername",
    }
    if not mandatory.issubset(df.columns):
        sys.exit("❌  Excel must contain columns: " + ", ".join(mandatory))

    process(df, img_dir, pages_dir, args)


if __name__ == "__main__":
    main()
