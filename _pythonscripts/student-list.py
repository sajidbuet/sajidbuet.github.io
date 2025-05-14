#!/usr/bin/env python3
"""
student‑list.py
Rename applicant photos according to an Excel sheet.

© 2025 BUET Q‑PACERS
"""

import argparse
import logging
import os
from pathlib import Path
import sys
import pandas as pd

# ---------- CLI ----------
def get_args():
    p = argparse.ArgumentParser(
        description="Rename applicant images based on an Excel mapping."
    )
    p.add_argument("excel", help="Path to the Excel file")
    p.add_argument(
        "-d",
        "--dir",
        default=".",
        help="Directory containing the images (default: current directory)",
    )
    p.add_argument(
        "--dry",
        action="store_true",
        help="Run without actually renaming (just show what would happen)",
    )
    return p.parse_args()


# ---------- Core ----------
def rename_images(df: pd.DataFrame, img_dir: Path, dry: bool = False):
    exts = [".jpg", ".jpeg", ".png"]
    renamed, missing = 0, 0

    for _, row in df.iterrows():
        app_id_raw = str(row["ApplicationID"]).strip()
        # ৬ অঙ্কে শূন্য‑padding; ফাইলে শূন্য না থাকলেও পরে গ্লব করে খুঁজে নেব
        app_id_pad = app_id_raw.zfill(7)
        target_stem = str(row["foldername"]).strip()

        # সম্ভাব্য সব এক্সটেনশনে পুরোনো ফাইল খুঁজে দেখা
        matches = []
        for e in exts:
            # দুই রকম ফরম্যাট খুঁজে নিন: 600043.jpg এবং 0600043.jpg
            matches.extend(list(img_dir.glob(f"{app_id_raw}{e}")))
            matches.extend(list(img_dir.glob(f"{app_id_pad}{e}")))
        # একই ফাইল একাধিকবার যোগ হলে সরিয়ে দিন
        matches = list({m.resolve() for m in matches if m.is_file()})

        if not matches:
            logging.warning(f"Image not found for ApplicationID {app_id_raw}")
            missing += 1
            continue
        if len(matches) > 1:
            logging.warning(
                f"Multiple images found for ApplicationID {app_id_raw}: {matches}"
            )

        old_path = matches[0]
        new_path = old_path.with_name(f"{target_stem}{old_path.suffix.lower()}")

        # যদি নতুন নাম ইতিমধ্যে থাকে, তাহলে ওভাররাইট না করে সতর্কতা দিন
        if new_path.exists():
            logging.error(f"Target file already exists: {new_path}")
            continue

        if dry:
            print(f"[DRY‑RUN] {old_path.name}  ->  {new_path.name}")
        else:
            old_path.rename(new_path)
            print(f"Renamed  {old_path.name}  →  {new_path.name}")
        renamed += 1

    print(f"\n✓ Done. Renamed: {renamed}, Missing: {missing}")


# ---------- Entry ----------
def main():
    args = get_args()
    excel_path = Path(args.excel).expanduser().resolve()
    img_dir = Path(args.dir).expanduser().resolve()

    if not excel_path.exists():
        sys.exit(f"Excel file not found: {excel_path}")
    if not img_dir.is_dir():
        sys.exit(f"Image directory not found: {img_dir}")

    # Excel ফাইল পড়া (pandas + openpyxl)
    df = pd.read_excel(excel_path, engine="openpyxl")

    required_cols = {"ApplicationID", "foldername"}
    if not required_cols.issubset(df.columns):
        sys.exit(f"Excel must contain columns: {required_cols}")

    rename_images(df, img_dir, dry=args.dry)


if __name__ == "__main__":
    main()
