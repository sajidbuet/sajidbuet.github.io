#!/usr/bin/env python3
"""
Google Scholar profile exporter to CSV using Selenium + Microsoft Edge
with a locally-installed msedgedriver.exe (no webdriver-manager).

Install:
  pip install selenium

Run:
  python scholar_export_edge_localdriver.py --profile Fu8Hkb4AAAAJ --out my_scholar.csv --driver-path "C:\\Tools\\msedgedriver\\msedgedriver.exe"

Optional:
  python scholar_export_edge_localdriver.py --profile Fu8Hkb4AAAAJ --out my_scholar.csv --driver-path "C:\\Tools\\msedgedriver\\msedgedriver.exe" --user-data-dir "C:\\temp\\gs_edge_profile"
"""

import argparse
import csv
import datetime as dt
import os
import re
import time
from typing import Dict, Tuple, Optional
from urllib.parse import urljoin

from selenium import webdriver
from selenium.common.exceptions import TimeoutException, WebDriverException
from selenium.webdriver.common.by import By
from selenium.webdriver.edge.options import Options as EdgeOptions
from selenium.webdriver.edge.service import Service as EdgeService
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC


BASE = "https://scholar.google.com"
COLUMNS = [
    "Cites", "Authors", "Title", "Year", "Source", "Publisher", "ArticleURL", "CitesURL",
    "GSRank", "QueryDate", "Type", "DOI", "ISSN", "CitationURL", "Volume", "Issue",
    "StartPage", "EndPage", "ECC", "CitesPerYear", "CitesPerAuthor", "AuthorCount", "Age"
]
DOI_REGEX = re.compile(r"\b10\.\d{4,9}/[-._;()/:A-Z0-9]+\b", re.IGNORECASE)


def safe_int(x) -> Optional[int]:
    try:
        if x is None:
            return None
        s = str(x).strip()
        if s == "":
            return None
        return int(s)
    except Exception:
        return None


def split_pages(p: str) -> Tuple[str, str]:
    p = (p or "").strip()
    if "-" in p:
        a, b = p.split("-", 1)
        return a.strip(), b.strip()
    return p, ""


def parse_authors(raw: str) -> Tuple[str, int]:
    s = (raw or "").strip()
    if not s:
        return "", 0
    if " and " in s:
        parts = [p.strip() for p in s.split(" and ") if p.strip()]
    elif ";" in s:
        parts = [p.strip() for p in s.split(";") if p.strip()]
    else:
        parts = [p.strip() for p in s.split(",") if p.strip()]
    return s, max(1, len(parts))


def infer_type(source: str) -> str:
    v = (source or "").lower()
    if any(k in v for k in ["conference", "proc", "proceedings", "symposium", "workshop"]):
        return "conference"
    if any(k in v for k in ["journal", "transactions", "letters", "review"]):
        return "journal"
    if "thesis" in v or "dissertation" in v:
        return "thesis"
    return ""


def extract_doi(*fields: str) -> str:
    blob = " ".join([f for f in fields if f])
    m = DOI_REGEX.search(blob)
    return m.group(0) if m else ""


def wait_for_user_if_captcha(driver: webdriver.Edge) -> None:
    """
    Detect likely CAPTCHA / unusual traffic / consent interstitial and pause.
    We do not attempt to bypass or automate CAPTCHA solving.
    """
    time.sleep(1.0)
    url = (driver.current_url or "").lower()
    html = (driver.page_source or "").lower()

    indicators = [
        "captcha",
        "recaptcha",
        "unusual traffic",
        "our systems have detected unusual traffic",
        "gs_captcha",
        "consent.google.com",
    ]
    if any(x in url for x in indicators) or any(x in html for x in indicators):
        print("\n[CAPTCHA/CONSENT DETECTED]")
        print("Please solve it manually in the opened Edge window.")
        input("After solving, press Enter here to continue...")
        time.sleep(1.0)


def open_profile(driver: webdriver.Edge, profile_id: str) -> None:
    url = f"{BASE}/citations?user={profile_id}&hl=en&pagesize=100"
    driver.get(url)
    wait_for_user_if_captcha(driver)


def click_show_more_until_done(driver: webdriver.Edge, max_items: int) -> None:
    while True:
        rows = driver.find_elements(By.CSS_SELECTOR, "#gsc_a_b .gsc_a_tr")
        if max_items and len(rows) >= max_items:
            return

        more_btns = driver.find_elements(By.ID, "gsc_bpf_more")
        if not more_btns:
            return

        more = more_btns[0]
        if more.get_attribute("disabled"):
            return

        driver.execute_script("arguments[0].click();", more)
        time.sleep(1.0)
        wait_for_user_if_captcha(driver)


def parse_modal_fields(driver: webdriver.Edge) -> Dict[str, str]:
    out: Dict[str, str] = {}
    WebDriverWait(driver, 20).until(EC.presence_of_element_located((By.ID, "gsc_vcd")))

    fields = driver.find_elements(By.CSS_SELECTOR, "#gsc_vcd_table .gsc_vcd_field")
    values = driver.find_elements(By.CSS_SELECTOR, "#gsc_vcd_table .gsc_vcd_value")

    for f, v in zip(fields, values):
        key = (f.text or "").strip().lower()
        val = (v.text or "").strip()
        out[key] = val

        links = v.find_elements(By.TAG_NAME, "a")
        if links:
            href = links[0].get_attribute("href")
            if href:
                out[key + "_href"] = href

    cited_by = driver.find_elements(By.ID, "gsc_vcd_ccl")
    if cited_by:
        href = cited_by[0].get_attribute("href")
        if href:
            out["cited_by_href"] = href

    return out


def close_modal(driver: webdriver.Edge) -> None:
    close_btns = driver.find_elements(By.ID, "gsc_vcd_x")
    if close_btns:
        driver.execute_script("arguments[0].click();", close_btns[0])
        time.sleep(0.25)


def make_edge_driver(driver_path: str, user_data_dir: str) -> webdriver.Edge:
    if not os.path.exists(driver_path):
        raise FileNotFoundError(f"msedgedriver.exe not found at: {driver_path}")

    edge_opts = EdgeOptions()
    edge_opts.add_argument("--lang=en-US")

    if user_data_dir:
        os.makedirs(user_data_dir, exist_ok=True)
        edge_opts.add_argument(f"--user-data-dir={user_data_dir}")

    # IMPORTANT: explicitly provide the driver path
    service = EdgeService(executable_path=driver_path)
    return webdriver.Edge(service=service, options=edge_opts)


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--profile", required=True, help="Google Scholar profile ID (e.g., Fu8Hkb4AAAAJ)")
    ap.add_argument("--out", required=True, help="Output CSV (will overwrite if exists)")
    ap.add_argument("--driver-path", required=True, help="Full path to msedgedriver.exe")
    ap.add_argument("--max", type=int, default=0, help="Max publications to export (0 = all)")
    ap.add_argument("--user-data-dir", default="", help="Edge user data dir for persistent cookies (optional)")
    args = ap.parse_args()

    if os.path.exists(args.out):
        os.remove(args.out)

    query_date = dt.datetime.now().date().isoformat()
    current_year = dt.datetime.now().year

    driver = None
    try:
        driver = make_edge_driver(args.driver_path, args.user_data_dir)

        open_profile(driver, args.profile)

        WebDriverWait(driver, 25).until(EC.presence_of_element_located((By.ID, "gsc_a_b")))
        click_show_more_until_done(driver, args.max)

        rows = driver.find_elements(By.CSS_SELECTOR, "#gsc_a_b .gsc_a_tr")
        if args.max and args.max > 0:
            rows = rows[:args.max]

        with open(args.out, "w", newline="", encoding="utf-8") as f:
            w = csv.DictWriter(f, fieldnames=COLUMNS)
            w.writeheader()

            for rank, row in enumerate(rows, start=1):
                title_el = row.find_element(By.CSS_SELECTOR, "a.gsc_a_at")
                title = (title_el.text or "").strip()

                authors = ""
                source = ""
                gray = row.find_elements(By.CSS_SELECTOR, "td.gsc_a_t .gs_gray")
                if len(gray) >= 1:
                    authors = (gray[0].text or "").strip()
                if len(gray) >= 2:
                    source = (gray[1].text or "").strip()

                year = safe_int(row.find_element(By.CSS_SELECTOR, "td.gsc_a_y").text)

                cites_txt = row.find_element(By.CSS_SELECTOR, "td.gsc_a_c").text.strip()
                cites = safe_int(cites_txt) or 0

                cites_url = ""
                cites_link = row.find_elements(By.CSS_SELECTOR, "td.gsc_a_c a")
                if cites_link:
                    href = cites_link[0].get_attribute("href")
                    if href:
                        cites_url = href if href.startswith("http") else urljoin(BASE, href)

                driver.execute_script("arguments[0].click();", title_el)
                time.sleep(0.5)
                wait_for_user_if_captcha(driver)

                modal = parse_modal_fields(driver)

                modal_authors = modal.get("authors", "") or authors
                modal_source = (
                    modal.get("publication", "")
                    or modal.get("journal", "")
                    or modal.get("conference", "")
                    or source
                )
                publisher = modal.get("publisher", "")

                volume = modal.get("volume", "")
                issue = modal.get("issue", "")
                pages = modal.get("pages", "")
                start_page, end_page = split_pages(pages)

                issn = modal.get("issn", "")
                doi = modal.get("doi", "")
                if not doi:
                    doi = extract_doi(
                        title,
                        modal.get("description", ""),
                        modal.get("publication", ""),
                        modal.get("publication_href", ""),
                        modal.get("url_href", ""),
                    )

                article_url = modal.get("url_href", "") or modal.get("publication_href", "") or ""
                cites_url_final = modal.get("cited_by_href", "") or cites_url

                authors_str, author_count = parse_authors(modal_authors)
                pub_type = infer_type(modal_source)

                age = (current_year - year) if year else None
                if age is not None and age < 0:
                    age = None

                denom_years = None
                if age is not None:
                    denom_years = 1 if age == 0 else age

                cites_per_year = (cites / denom_years) if denom_years else ""
                cites_per_author = (cites / author_count) if author_count else ""

                out = {c: "" for c in COLUMNS}
                out.update({
                    "Cites": cites,
                    "Authors": authors_str,
                    "Title": title,
                    "Year": year if year else "",
                    "Source": modal_source,
                    "Publisher": publisher,
                    "ArticleURL": article_url,
                    "CitesURL": cites_url_final,
                    "GSRank": rank,
                    "QueryDate": query_date,
                    "Type": pub_type,
                    "DOI": doi,
                    "ISSN": issn,
                    "CitationURL": cites_url_final,
                    "Volume": volume,
                    "Issue": issue,
                    "StartPage": start_page,
                    "EndPage": end_page,
                    "ECC": cites,
                    "CitesPerYear": cites_per_year,
                    "CitesPerAuthor": cites_per_author,
                    "AuthorCount": author_count,
                    "Age": age if age is not None else "",
                })

                w.writerow(out)
                close_modal(driver)
                time.sleep(0.35)

        print(f"Done. Wrote: {args.out}")

    except (TimeoutException, WebDriverException) as e:
        raise SystemExit(
            "\n[ERROR] Edge automation failed.\n"
            "Check:\n"
            "  1) The Edge window is showing the Scholar profile (not a CAPTCHA/consent page)\n"
            "  2) Your msedgedriver.exe version matches Edge major version\n"
            "  3) --driver-path points to the exact msedgedriver.exe\n\n"
            f"Details: {e}\n"
        )
    finally:
        if driver is not None:
            driver.quit()


if __name__ == "__main__":
    main()
