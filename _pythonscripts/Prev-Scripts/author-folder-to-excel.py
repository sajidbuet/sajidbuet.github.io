#!/usr/bin/env python3
"""author-folder-to-excel.py  📂➜📊
typical usage:

python author-folder-to-excel.py --pages-dir ../content/authors --output ./all-members.xlsx

Sync (reverse) HugoBlox *author* folders → Excel roster.

• Scans `--pages-dir` (default: `content/authors`).
• Reads every `_index.md`, parses YAML + body, and extracts:
    title              → **name**
    last_name          → **Roll** (student‑ID)
    role, user_groups, graduation_year, thesis.title  (optional)
    bullet lines       → **Research Division**, **BSc Institution**
• Builds/merges an Excel file (`--output`). Missing values are saved as
  **empty strings** (no NaN) and a friendly 🔒 message is shown if the file is
  open elsewhere.

Usage
-----
```bash
python author-folder-to-excel.py                       # default run
python author-folder-to-excel.py --dry                 # preview
python author-folder-to-excel.py \
  --pages-dir ./content/people \
  --output    ./rosters/grad-cohort.xlsx
```
Dependencies → `pip install pandas openpyxl pyyaml`.
"""
from __future__ import annotations

import argparse
import re
import sys
from pathlib import Path

import pandas as pd  # type: ignore
import yaml          # type: ignore – PyYAML
from yaml.loader import SafeLoader

###############################################################################
# Console helpers                                                             #
###############################################################################
RESET, BOLD = "\033[0m", "\033[1m"
GREEN, YELLOW, RED, CYAN = "\033[92m", "\033[93m", "\033[91m", "\033[96m"
PASS_EMO, WARN_EMO, LOCK_EMO = "✅", "⚠️", "🔒"

def cprint(msg: str, colour: str = "", *, bold: bool = False):
    print(f"{(BOLD if bold else '') + colour}{msg}{RESET}")

###############################################################################
# CLI                                                                         #
###############################################################################

def get_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Reverse‑sync author folders to an Excel roster.")
    parser.add_argument("--pages-dir", default="./content/authors", help="Root directory of author folders")
    parser.add_argument("--output", default="students-reverse.xlsx", help="Excel file to create/update")
    parser.add_argument("--dry", action="store_true", help="Preview DataFrame – skip Excel write")
    return parser.parse_args()

###############################################################################
# Custom YAML loader – keep numeric scalars **as strings**                    #
###############################################################################

class StrLoader(SafeLoader):
    """YAML loader that treats ints/floats as raw strings (preserves leading zeros)."""
    pass

def _as_str(loader, node):
    return loader.construct_scalar(node)

for tag in ["tag:yaml.org,2002:int", "tag:yaml.org,2002:float", "tag:yaml.org,2002:bool"]:
    StrLoader.add_constructor(tag, _as_str)

###############################################################################
# Regex patterns                                                              #                                                              #
###############################################################################
FRONT_RE   = re.compile(r"^---\n(.*?)\n---\n", re.S)
RES_DIV_RE = re.compile(r"\* \*\*Research Division:\*\* (.+)")
BSC_RE     = re.compile(r"\* \*\*BSc Institution:\*\* (.+)")

###############################################################################
# Markdown → dict helper                                                      #
###############################################################################

def parse_markdown(md_path: Path) -> dict | None:
    """Return a clean record dict from one `_index.md` or *None* if malformed."""
    text = md_path.read_text(encoding="utf-8")
    m_front = FRONT_RE.match(text)
    if not m_front:
        return None  # no YAML section

    front = yaml.load(m_front.group(1), Loader=StrLoader) or {}
    body  = text[m_front.end():]

    # safe front‑matter getter (string, never NaN/None)
    def f(key: str) -> str:
        val = front.get(key)
        if val is None or (isinstance(val, float) and pd.isna(val)):
            return ""
        return str(val)

    # thesis‑title
    thesis_title = ""
    if isinstance(front.get("thesis"), dict):
        raw = front["thesis"].get("title")
        if raw is not None and not (isinstance(raw, float) and pd.isna(raw)):
            thesis_title = str(raw)

    # research division & institution from body
    div_match = RES_DIV_RE.search(body)
    inst_match = BSC_RE.search(body)

    return {
        "ApplicationID"    : "",  # not stored in markdown
        "Roll"             : f("last_name"),
        "name"             : f("title"),
        "Research Division": div_match.group(1).strip() if div_match else "",
        "BSc Instituton"  : inst_match.group(1).strip() if inst_match else "",
        "foldername"       : md_path.parent.name,
        "role"             : f("role"),
        "user_groups"      : ",".join(front.get("user_groups", [])) if front.get("user_groups") else "",
        "graduation_year"  : f("graduation_year"),
        "thesis-title"     : thesis_title,
    }

###############################################################################
# Main                                                                        #
###############################################################################

def main() -> None:
    args = get_args()

    pages_root = Path(args.pages_dir).expanduser().resolve()
    if not pages_root.is_dir():
        sys.exit(f"Pages directory not found: {pages_root}")

    # gather records ---------------------------------------------------------
    records: list[dict] = []
    for sub in pages_root.iterdir():
        md = sub / "_index.md"
        if sub.is_dir() and md.is_file():
            rec = parse_markdown(md)
            if rec:
                records.append(rec)

    if not records:
        sys.exit("No valid _index.md files found – nothing to export.")

    df_new = pd.DataFrame(records)[[
        "ApplicationID", "Roll", "name", "Research Division", "BSc Instituton",
        "foldername", "role", "user_groups", "graduation_year", "thesis-title",
    ]]

    out_path = Path(args.output).expanduser().resolve()

    # merge with existing Excel if present ----------------------------------
    if out_path.exists():
        df_old = pd.read_excel(out_path, engine="openpyxl")
        df_combined = (
            df_old.set_index("foldername")
            .combine_first(df_new.set_index("foldername"))
            .reset_index()
        )
    else:
        df_combined = df_new

    # ensure no NaN / literal 'nan'
    df_combined = df_combined.replace({pd.NA: "", "nan": ""}).fillna("")

    # output -----------------------------------------------------------------
    if args.dry:
        print(df_combined.to_string(index=False))
        cprint(f"Would write → {out_path}", CYAN)
    else:
        try:
            df_combined.to_excel(out_path, index=False, engine="openpyxl")
            cprint(f"{PASS_EMO} Excel written → {out_path}", GREEN, bold=True)
        except PermissionError:
            cprint(
                f"{LOCK_EMO}  The Excel file '{out_path.name}' is open in another program. "
                "Please close it and rerun the script.",
                RED,
                bold=True,
            )
            sys.exit(1)


if __name__ == "__main__":
    main()
