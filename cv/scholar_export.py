#!/usr/bin/env python3
"""
Export a Google Scholar profile's publications + citation metrics to CSV.

Usage:
  python scholar_export.py --profile Fu8Hkb4AAAAJ --out publications1.csv
  python scholar_export.py --profile Fu8Hkb4AAAAJ --out publications.csv --crossref

Dependencies:
  pip install scholarly requests

Notes:
- Google Scholar does not provide an official public API. Automated access may be rate-limited or blocked.
- This script uses polite delays and does NOT attempt to bypass any blocks/captchas.
- Many fields (DOI/ISSN/Publisher/Volume/Issue/Pages) are often missing from Scholar; optional Crossref
  lookup can fill some of them, but not always.
"""

import argparse
import csv
import datetime as dt
import os
import random
import re
import time
from typing import Dict, Optional, Tuple

from scholarly import scholarly

def fetch_author_or_explain(profile_id: str):
    try:
        # More forgiving network behavior
        scholarly.set_retries(5)      # documented API
        scholarly.set_timeout(30)     # documented API

        author = scholarly.search_author_id(profile_id)
        author = scholarly.fill(author, sections=["publications"])
        return author

    except AttributeError as e:
        # This is the canonical-link NoneType failure you saw
        url = f"https://scholar.google.com/citations?user={profile_id}&hl=en"
        msg = (
            "\n[ERROR] Google Scholar did not return a normal profile page.\n"
            "This usually means you were served a CAPTCHA / 'unusual traffic' page,\n"
            "a consent interstitial, or the profile is not publicly reachable.\n\n"
            f"Check this URL in your browser (same network):\n  {url}\n\n"
            "If you see CAPTCHA / unusual traffic:\n"
            "  - Solve it in the browser, then rerun.\n"
            "  - Avoid VPN / shared networks; try a different network if possible.\n"
            "  - Increase --delay and consider using --max to limit publications.\n"
        )
        raise RuntimeError(msg) from e

    except Exception as e:
        raise RuntimeError(
            f"\n[ERROR] Failed to fetch profile {profile_id}. "
            "Possible rate-limit/block or connectivity issue.\n"
            "Try increasing --delay, reducing --max, and rerun.\n"
        ) from e

try:
    import requests
except ImportError:
    requests = None


COLUMNS = [
    "Cites", "Authors", "Title", "Year", "Source", "Publisher", "ArticleURL", "CitesURL",
    "GSRank", "QueryDate", "Type", "DOI", "ISSN", "CitationURL", "Volume", "Issue",
    "StartPage", "EndPage", "ECC", "CitesPerYear", "CitesPerAuthor", "AuthorCount", "Age"
]

DOI_REGEX = re.compile(r"\b10\.\d{4,9}/[-._;()/:A-Z0-9]+\b", re.IGNORECASE)


def polite_sleep(base: float = 1.2, jitter: float = 1.0) -> None:
    """Sleep with jitter to reduce request burstiness."""
    time.sleep(max(0.2, base + random.random() * jitter))


def safe_int(x) -> Optional[int]:
    try:
        if x is None:
            return None
        return int(str(x).strip())
    except Exception:
        return None


def parse_authors(raw: str) -> Tuple[str, int]:
    """
    Return (authors_string, author_count).
    Scholar bib author strings vary; we use a conservative split heuristic.
    """
    if not raw:
        return ("", 0)

    s = raw.strip()

    # Common formats: "A B, C D, E F" or "A B and C D" or "A B; C D"
    if " and " in s:
        parts = [p.strip() for p in s.split(" and ") if p.strip()]
    elif ";" in s:
        parts = [p.strip() for p in s.split(";") if p.strip()]
    else:
        parts = [p.strip() for p in s.split(",") if p.strip()]

    # If splitting produced nonsense (e.g., single author with comma in name),
    # fall back to raw string count = 1.
    count = len(parts) if len(parts) > 0 else 1
    return (s, count)


def infer_type(bib: Dict) -> str:
    """
    Best-effort 'Type' inference from Scholar bib.
    """
    # Some bibs include 'pub_type' or 'ENTRYTYPE' depending on source.
    for k in ("pub_type", "ENTRYTYPE", "entrytype", "type"):
        if k in bib and bib.get(k):
            return str(bib.get(k))

    venue = (bib.get("venue") or bib.get("journal") or "").lower()
    if any(x in venue for x in ["conference", "proc", "proceedings", "symposium", "workshop"]):
        return "conference"
    if any(x in venue for x in ["journal", "rev", "letters", "transactions"]):
        return "journal"
    if "thesis" in venue or "dissertation" in venue:
        return "thesis"
    return ""


def extract_doi_from_text(*fields: str) -> str:
    blob = " ".join([f for f in fields if f])
    m = DOI_REGEX.search(blob)
    return m.group(0) if m else ""


def crossref_lookup(title: str, authors: str, year: Optional[int]) -> Dict[str, str]:
    """
    Best-effort Crossref lookup to populate DOI/ISSN/Publisher/Volume/Issue/Pages.
    Requires 'requests'. Returns dict with any found fields.
    """
    if requests is None:
        return {}

    # Keep query short; Crossref is more reliable with title + year.
    params = {
        "query.title": title,
        "rows": 1,
    }
    if year:
        params["filter"] = f"from-pub-date:{year}-01-01,until-pub-date:{year}-12-31"
    # Provide a reasonable UA (recommended by Crossref etiquette).
    headers = {"User-Agent": "scholar-export-script/1.0 (mailto:example@example.com)"}

    try:
        r = requests.get("https://api.crossref.org/works", params=params, headers=headers, timeout=20)
        r.raise_for_status()
        data = r.json()
        items = data.get("message", {}).get("items", [])
        if not items:
            return {}

        it = items[0]
        out: Dict[str, str] = {}

        doi = it.get("DOI") or ""
        if doi:
            out["DOI"] = doi

        issn = it.get("ISSN") or []
        if isinstance(issn, list) and issn:
            out["ISSN"] = issn[0]

        publisher = it.get("publisher") or ""
        if publisher:
            out["Publisher"] = publisher

        volume = it.get("volume") or ""
        issue = it.get("issue") or ""
        page = it.get("page") or ""
        if volume:
            out["Volume"] = str(volume)
        if issue:
            out["Issue"] = str(issue)
        if page:
            # page can be like "123-130" or "e15"
            out["StartPage"], out["EndPage"] = split_pages(str(page))

        return out
    except Exception:
        return {}


def split_pages(page_str: str) -> Tuple[str, str]:
    s = page_str.strip()
    if "-" in s:
        a, b = s.split("-", 1)
        return a.strip(), b.strip()
    return s, ""


def build_cites_url(citedby_url: str) -> str:
    # scholarly often returns paths like "/scholar?cites=....&hl=en"
    if not citedby_url:
        return ""
    if citedby_url.startswith("http"):
        return citedby_url
    return "https://scholar.google.com" + citedby_url


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--profile", required=True, help="Google Scholar profile ID (e.g., Fu8Hkb4AAAAJ)")
    ap.add_argument("--out", required=True, help="Output CSV filename (will overwrite if exists)")
    ap.add_argument("--crossref", action="store_true", help="Attempt to enrich metadata via Crossref")
    ap.add_argument("--max", type=int, default=0, help="Max publications to export (0 = all)")
    ap.add_argument("--delay", type=float, default=1.2, help="Base delay between Scholar requests (seconds)")
    args = ap.parse_args()

    # Overwrite file if exists
    if os.path.exists(args.out):
        os.remove(args.out)

    query_date = dt.datetime.now().date().isoformat()
    current_year = dt.datetime.now().year

    # Fetch author + publications
    author = fetch_author_or_explain(args.profile)

    pubs = author.get("publications", [])
    if args.max and args.max > 0:
        pubs = pubs[: args.max]

    with open(args.out, "w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=COLUMNS)
        w.writeheader()

        for idx, pub in enumerate(pubs, start=1):
            # Fill publication details (may trigger network requests)
            try:
                pub_f = scholarly.fill(pub)
            except Exception:
                # If a particular pub fails, keep going
                pub_f = pub

            bib = pub_f.get("bib", {}) or {}
            title = str(bib.get("title") or "").strip()
            authors_raw = str(bib.get("author") or bib.get("authors") or "").strip()
            authors_str, author_count = parse_authors(authors_raw)

            year = safe_int(bib.get("pub_year") or bib.get("year") or pub_f.get("year"))
            venue = str(bib.get("venue") or bib.get("journal") or bib.get("booktitle") or "").strip()

            cites = safe_int(pub_f.get("num_citations")) or 0
            citedby_url = pub_f.get("citedby_url") or ""
            cites_url = build_cites_url(citedby_url)

            article_url = str(pub_f.get("pub_url") or bib.get("url") or "").strip()

            # Derivations
            age = (current_year - year) if year else None
            if age is not None and age < 0:
                age = None

            # Avoid divide-by-zero: if age==0 (this year), use 1 year for rate
            denom_years = 1 if (age is not None and age == 0) else (age if age else None)
            cites_per_year = (cites / denom_years) if denom_years else ""

            cites_per_author = (cites / author_count) if author_count else ""
            pub_type = infer_type(bib)

            # Best-effort DOI extraction
            doi = str(bib.get("doi") or "").strip()
            if not doi:
                doi = extract_doi_from_text(title, article_url, str(bib.get("note") or ""), str(bib.get("abstract") or ""))

            # Optional Crossref enrichment
            enriched: Dict[str, str] = {}
            if args.crossref:
                enriched = crossref_lookup(title=title, authors=authors_str, year=year)

            # Pages from Scholar (if present)
            start_page = str(bib.get("start_page") or "").strip()
            end_page = str(bib.get("end_page") or "").strip()
            if (not start_page and not end_page) and bib.get("pages"):
                start_page, end_page = split_pages(str(bib.get("pages")))

            # Volume/Issue from Scholar bib (if present)
            volume = str(bib.get("volume") or "").strip()
            issue = str(bib.get("issue") or "").strip()

            row = {c: "" for c in COLUMNS}
            row.update({
                "Cites": cites,
                "Authors": authors_str,
                "Title": title,
                "Year": year if year is not None else "",
                "Source": venue,
                "Publisher": "",
                "ArticleURL": article_url,
                "CitesURL": cites_url,
                "GSRank": idx,
                "QueryDate": query_date,
                "Type": pub_type,
                "DOI": doi,
                "ISSN": "",
                "CitationURL": cites_url,   # kept same as CitesURL (you can change if you use a different convention)
                "Volume": volume,
                "Issue": issue,
                "StartPage": start_page,
                "EndPage": end_page,
                "ECC": cites,               # not a standard Scholar field; set equal to cites by default
                "CitesPerYear": cites_per_year,
                "CitesPerAuthor": cites_per_author,
                "AuthorCount": author_count,
                "Age": age if age is not None else "",
            })

            # Apply Crossref-enriched fields (only if present)
            if enriched:
                for k, v in enriched.items():
                    if k in row and (row.get(k) in ("", None)):
                        row[k] = v
                # Crossref pages/vol/issue override if Scholar lacks them
                for k in ("Volume", "Issue", "StartPage", "EndPage", "Publisher", "ISSN", "DOI"):
                    if k in enriched and (row.get(k) in ("", None)):
                        row[k] = enriched[k]

            w.writerow(row)

            polite_sleep(base=args.delay, jitter=0.8)


if __name__ == "__main__":
    main()
