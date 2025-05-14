#!/usr/bin/env python3
"""
student-page-creator.py
Generate HugoBlox “People” pages and copy avatars from an Excel roster.

Usage example
-------------
python student-page-creator.py students.xlsx \
    --img-dir ./photos \
    --pages-dir ./content/authors \
    --role "Masters Student" \
    --dry         # optional, just shows what would happen
"""

import argparse
import logging
import shutil
import sys
import textwrap
from pathlib import Path

import pandas as pd

# ------------- CLI ---------------------------------------------------------- #
def get_args():
    p = argparse.ArgumentParser(description="Create HugoBlox people pages.")
    p.add_argument("excel", help="Path of the Excel file")
    p.add_argument("--img-dir", default=".", help="Folder containing images")
    p.add_argument("--pages-dir", default="./content/authors",
                   help="Destination pages directory")
    p.add_argument("--role", default="Masters Student",
                   help="Role/position string written to front‑matter")
    p.add_argument("--org", default="Q-PACER RG, Dept of EEE, BUET",
                   help="Organization/Affiliation string")
    p.add_argument("--dry", action="store_true",
                   help="Dry‑run: don’t write files, only show actions")
    return p.parse_args()


# ------------- Helpers ------------------------------------------------------ #
EXTS = [".jpg", ".jpeg", ".png"]


def find_image(app_id: str, img_dir: Path) -> Path | None:
    """Return the first existing image path for given ApplicationID."""
    candidates: list[Path] = []
    app_id_pad = app_id.zfill(6)
    for ext in EXTS:
        candidates.extend([*img_dir.glob(f"{app_id}{ext}"),
                           *img_dir.glob(f"{app_id_pad}{ext}")])
    files = [c.resolve() for c in candidates if c.is_file()]
    return files[0] if files else None


def split_name(full_name: str) -> tuple[str, str]:
    parts = full_name.strip().split()
    return (parts[0], " ".join(parts[1:])) if parts else ("", "")


def write_markdown(folder: Path, *, first: str, last: str, full: str,
                   foldername: str, role: str, org: str,
                   student_id: str, division: str, bsc_inst: str,
                   dry: bool = False) -> None:
    """Generate _index.md front‑matter + body inside *folder*."""
    fm = textwrap.dedent(f"""\
        ---
        # Display name
        title: {full}

        # Full name (for SEO)
        first_name: {first} {last}
        last_name: {student_id}

        # Username (matches folder name)
        authors:
          - {foldername}

        superuser: false
        role: {role}

        organizations:
          - name: {org}
            url: ''

        bio: Student ID {student_id}

        user_groups:
          - Grad Students
        ---

        * **Student ID:** {student_id}
        * **Research Division:** {division}
        * **BSc Institution:** {bsc_inst}
        """)

    md_path = folder / "_index.md"
    if dry:
        print(f"[DRY‑RUN] ├─ would write markdown → {md_path}")
        return
    with md_path.open("w", encoding="utf-8") as f:
        f.write(fm)
    logging.info(f"Created {md_path}")


# ------------- Core --------------------------------------------------------- #
def process(df: pd.DataFrame, img_dir: Path, pages_dir: Path, args):
    created, missing = 0, 0

    for _, row in df.iterrows():
        app_id       = str(row["ApplicationID"]).strip().zfill(7)
        foldername   = str(row["foldername"]).strip()
        full_name    = str(row["name"]).strip()
        division     = str(row["Research Division"]).strip()
        bsc_inst     = str(row["BSc Instituton"]).strip()
        student_id   = str(row["Roll"]).strip()

        img_src = find_image(app_id, img_dir)
        if img_src is None:
            logging.warning(f"✗ Image not found for ApplicationID {app_id}")
            missing += 1
            continue

        dest_dir   = pages_dir / foldername
        avatar_dst = dest_dir / "avatar.jpg"
        if not args.dry:
            dest_dir.mkdir(parents=True, exist_ok=True)

        # copy avatar
        if args.dry:
            print(f"[DRY‑RUN] ├─ would copy {img_src.name} → {avatar_dst}")
        else:
            shutil.copy(img_src, avatar_dst)
            logging.info(f"Copied avatar → {avatar_dst}")

        # write markdown
        first, last = split_name(full_name)
        write_markdown(dest_dir,
                       first=first, last=last, full=full_name,
                       foldername=foldername,
                       role=args.role, org=args.org,
                       student_id=student_id, division=division,
                       bsc_inst=bsc_inst,
                       dry=args.dry)

        created += 1

    print(f"\n✓ Completed. Pages created: {created} | Missing avatars: {missing}")


# ------------- Entry -------------------------------------------------------- #
def main():
    args = get_args()
    excel_path = Path(args.excel).expanduser().resolve()
    img_dir    = Path(args.img_dir).expanduser().resolve()
    pages_dir  = Path(args.pages_dir).expanduser().resolve()

    if not excel_path.exists():
        sys.exit(f"Excel file not found: {excel_path}")
    if not img_dir.is_dir():
        sys.exit(f"Image directory not found: {img_dir}")

    logging.basicConfig(level=logging.INFO, format="%(levelname)s - %(message)s")

    df = pd.read_excel(excel_path, engine="openpyxl")
    required = {"ApplicationID", "Roll", "name", "Research Division",
                "BSc Instituton", "foldername"}
    if not required.issubset(df.columns):
        sys.exit(f"Excel must contain columns: {required}")

    process(df, img_dir, pages_dir, args)


if __name__ == "__main__":
    main()
