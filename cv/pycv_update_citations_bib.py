# pycv_update_citations_bib.py
import pandas as pd
import bibtexparser
import logging
import os

from bibtexparser.bparser import BibTexParser
from bibtexparser.bwriter import BibTexWriter

# Custom parser that keeps non-standard types like @patent
parser = BibTexParser(common_strings=True)
parser.ignore_nonstandard_types = False  # <-- This is critical!

# Configure logging
logging.basicConfig(
    filename='update_citations_py.log',
    filemode='w',  # Overwrite the log file each run; use 'a' to append
    level=logging.INFO,  # Set the logging level to DEBUG to capture all messages
    format='%(asctime)s - %(levelname)s - %(message)s'
)

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

    # Create a mapping from CitationURL to Cites
    url_to_cites = dict(zip(csv_df['CitationURL'], csv_df['Cites']))
    logging.debug(f"Loaded {len(url_to_cites)} citation entries from CSV.")

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
        logging.debug(f"Start url update for {entry_id} ...")
        logging.debug(f"citesurl = {citesurl}")
        logging.debug(f"url_to_cites = {url_to_cites}")

        if citesurl in url_to_cites:
            logging.debug(f"Entered the condition! ")
            new_citationnos = str(url_to_cites[citesurl])
            old_citationnos = entry.get('citationnos')
            if old_citationnos != new_citationnos:
                logging.info(f"Updating 'citationnos' for entry '{entry_id}': {old_citationnos} -> {new_citationnos}")
                entry['citationnos'] = new_citationnos
                updated_entries += 1
            else:
                logging.debug(f"No update needed for entry '{entry_id}'; 'citationnos' is already up-to-date.")
        else:
            logging.warning(f"No matching 'CitationURL' found in CSV for entry '{entry_id}'.")

    logging.info(f"Total entries updated: {updated_entries}")
    # Custom writer that also keeps all fields and entries
    writer = BibTexWriter()
    writer.indent = '    '  # optional: pretty formatting
    writer.order_entries_by = None  # optional: keep original order
    try:
        with open(bib_path, 'w', encoding='utf-8') as bibtex_file:
            bibtexparser.dump(bib_database, bibtex_file, writer=writer)
        logging.info(f"Successfully wrote updates to BibTeX file: {bib_path}")
    except Exception as e:
        logging.exception(f"Failed to write to BibTeX file: {e}")
    print ("Execution Successful! Check update_citations_py.log")
if __name__ == "__main__":
    main()
