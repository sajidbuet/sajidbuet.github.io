# pycv_update_citations_bib.py
import pandas as pd
import bibtexparser
import logging
import os
from urllib.parse import urlparse, parse_qs

from bibtexparser.bparser import BibTexParser
from bibtexparser.bwriter import BibTexWriter

# Custom parser that keeps non-standard types like @patent
parser = BibTexParser(common_strings=True)
parser.ignore_nonstandard_types = False  # <-- This is critical!

# Configure logging
logging.basicConfig(
    filename='update_citations_py.log',
    filemode='w',
    level=logging.INFO,          # change to logging.DEBUG if you want debug lines
    format='%(asctime)s - %(levelname)s - %(message)s'
)

def extract_citation_for_view(url: str) -> str | None:
    """
    Return the value of the 'citation_for_view' query parameter from a Scholar citation URL.
    Example:
      https://scholar.google.com/citations?...&citation_for_view=Fu8Hkb4AAAAJ:CHSYGLWDkRkC
    -> 'Fu8Hkb4AAAAJ:CHSYGLWDkRkC'
    """
    if url is None:
        return None
    s = str(url).strip()
    if not s:
        return None
    try:
        q = parse_qs(urlparse(s).query)
        val = q.get("citation_for_view")
        if not val:
            return None
        return val[0].strip() if val[0] else None
    except Exception:
        return None

def main():
    csv_path = 'PopCites.csv'
    bib_path = 'papers.bib'

    # Check if files exist
    if not os.path.exists(csv_path):
        logging.error(f"CSV file not found: {csv_path}")
        return
    if not os.path.exists(bib_path):
        logging.error(f"BibTeX file not found: {bib_path}")
        return

    logging.info(f"Loading CSV file: {csv_path}")
    try:
        csv_df = pd.read_csv(csv_path)
    except Exception as e:
        logging.exception(f"Failed to read CSV file: {e}")
        return

    if 'CitationURL' not in csv_df.columns or 'Cites' not in csv_df.columns:
        logging.error("CSV file must contain 'CitationURL' and 'Cites' columns.")
        return

    # Build mapping using ONLY citation_for_view
    url_to_cites = {}
    missing_key = 0
    for raw_url, cites in zip(csv_df['CitationURL'], csv_df['Cites']):
        key = extract_citation_for_view(raw_url)
        if not key:
            missing_key += 1
            continue
        # If duplicates exist, last one wins (same as your original dict(zip(...)))
        url_to_cites[key] = cites

    logging.info(f"Loaded {len(url_to_cites)} citation_for_view keys from CSV. Skipped {missing_key} rows without citation_for_view.")

    logging.info(f"Loading BibTeX file: {bib_path}")
    try:
        with open(bib_path, 'r', encoding='utf-8') as bibtex_file:
            bib_database = bibtexparser.load(bibtex_file, parser=parser)
    except Exception as e:
        logging.exception(f"Failed to read BibTeX file: {e}")
        return

    updated_entries = 0
    for entry in bib_database.entries:
        entry_id = entry.get('ID', 'UnknownID')
        citesurl = entry.get('citesurl')
        if not citesurl:
            logging.warning(f"Entry '{entry_id}' is missing 'citesurl'. Skipping.")
            continue

        key = extract_citation_for_view(citesurl)
        if not key:
            logging.warning(f"Entry '{entry_id}' citesurl has no 'citation_for_view'. Skipping. citesurl={citesurl}")
            continue

        if key in url_to_cites:
            new_citationnos = str(url_to_cites[key])
            old_citationnos = entry.get('citationnos')
            if old_citationnos != new_citationnos:
                logging.info(f"Updating 'citationnos' for entry '{entry_id}': {old_citationnos} -> {new_citationnos}")
                entry['citationnos'] = new_citationnos
                updated_entries += 1
        else:
            logging.warning(f"No matching citation_for_view found in CSV for entry '{entry_id}'. key={key}")

    logging.info(f"Total entries updated: {updated_entries}")

    writer = BibTexWriter()
    writer.indent = '    '
    writer.order_entries_by = None

    try:
        with open(bib_path, 'w', encoding='utf-8') as bibtex_file:
            bibtexparser.dump(bib_database, bibtex_file, writer=writer)
        logging.info(f"Successfully wrote updates to BibTeX file: {bib_path}")
    except Exception as e:
        logging.exception(f"Failed to write to BibTeX file: {e}")

    print("Execution Successful! Check update_citations_py.log")

if __name__ == "__main__":
    main()
