
# save as scholar_yearly.py
# USAGE: 
#pip install scholarly
#python scholar_yearly.py Fu8Hkb4AAAAJ > cites.json
from scholarly import scholarly
#!/usr/bin/env python3
# scholar_yearly_debug.py

import sys, io
import json
import logging

# Make sure stdout uses UTF‑8 (works in Python 3.7+)
try:
    sys.stdout.reconfigure(encoding='utf-8')
except AttributeError:
    # Fallback for older Pythons
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

# 1) Enable logging from scholarly and urllib3 so you see HTTP status info
logging.basicConfig(
    format='%(asctime)s %(name)s [%(levelname)s] %(message)s',
    level=logging.INFO
)
# scholarly logger
logging.getLogger('scholarly').setLevel(logging.DEBUG)
# requests / urllib3
logging.getLogger('urllib3').setLevel(logging.INFO)

from scholarly import scholarly, ProxyGenerator

def fetch_cites_by_year(author_id: str):
    print(f"[*] Starting fetch for author ID = {author_id}")

    # 2) (Optional) set up a ProxyGenerator to ensure you can connect
    pg = ProxyGenerator()
    success = pg.FreeProxies()
    if not success:
        print("[!] Warning: Failed to initialize FreeProxies — you may be blocked.")
    scholarly.use_proxy(pg)

    print("[*] Searching author by ID...")
    try:
        author = scholarly.search_author_id(author_id)
        print("[+] search_author_id returned an object.")
        # Show the fields we got before fill
        print("    Available fields pre‐fill:", list(author.keys()))
    except Exception as e:
        print("[!] ERROR during search_author_id():", e)
        return {}

    print("[*] Now filling author with cites_per_year section...")
    try:
        author_full = scholarly.fill(author, sections=['citedby_per_year'])
        print("[+] fill() completed.")
    except Exception as e:
        print("[!] ERROR during fill():", e)
        return {}

    # 3) Inspect what actually came back
    keys = list(author_full.keys())
    print("    Available fields post‐fill:", keys)

    # 4) Extract the histogram
    cites_hist = author_full.get('citedby_per_year', None)
    if cites_hist is None:
        print("[!] No 'citedby_per_year' found in the returned author object.")
        # Dump entire author_full for inspection
        print(json.dumps(author_full, indent=2, ensure_ascii=False))
        return {}

    print("[*] Raw citedby_per_year dict:")
    print(json.dumps(cites_hist, indent=2))

    return cites_hist

if __name__ == '__main__':
    if len(sys.argv) != 2:
        print("Usage: python3 scholar_yearly_debug.py <GS_AUTHOR_ID>")
        sys.exit(1)

    aid = sys.argv[1]
    data = fetch_cites_by_year(aid)
    print("\n=== Final JSON Output ===")
    print(json.dumps(data, indent=2))
