#!/usr/bin/env python3
# scholar_yearly.py
# USAGE:
#   pip install scholarly
#   python scholar_yearly.py <GS_AUTHOR_ID>
# python scholar_yearly.py Fu8Hkb4AAAAJ
import sys
import io
import json
import logging
import re
from scholarly import scholarly, ProxyGenerator

# Ensure stdout uses UTF‑8
try:
    sys.stdout.reconfigure(encoding='utf-8')
except AttributeError:
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

# Logging setup
logging.basicConfig(
    format='%(asctime)s %(name)s [%(levelname)s] %(message)s',
    level=logging.INFO
)
logging.getLogger('scholarly').setLevel(logging.DEBUG)
logging.getLogger('urllib3').setLevel(logging.INFO)

def fetch_cites_by_year(author_id: str):
    print(f"[*] Starting fetch for author ID = {author_id}")

    # Set up proxy to avoid blocking
    pg = ProxyGenerator()
    if pg.FreeProxies():
        scholarly.use_proxy(pg)
        print("[*] Using free proxies")
    else:
        print("[!] Warning: Failed to initialize FreeProxies — you may be blocked.")

    # Search author by ID
    try:
        author = scholarly.search_author_id(author_id)
        print("[+] search_author_id returned an object.")
        print("    Available fields pre-fill:", list(author.keys()))
    except Exception as e:
        print("[!] ERROR during search_author_id():", e)
        return {}

    # Fill full author profile
    print("[*] Filling author with full profile...")
    try:
        author_full = scholarly.fill(author)
        print("[+] fill() completed.")
    except Exception as e:
        print("[!] ERROR during fill():", e)
        return {}

    print("    Available fields post-fill:", list(author_full.keys()))

    # Extract histogram
    hist = author_full.get('citedby_per_year')
    if hist is None:
        print("[!] No 'citedby_per_year' found in the returned author object.")
        print(json.dumps(author_full, indent=2, ensure_ascii=False))
        return {}

    # Extract core metrics
    total_cites = author_full.get('citedby', 0)
    hindex      = author_full.get('hindex', 0)
    i10index    = author_full.get('i10index', 0)

    print(f"[*] Total citations: {total_cites}")
    print(f"[*] h-index: {hindex}, i10-index: {i10index}")
    print("[*] Raw citedby_per_year dict:")
    print(json.dumps(hist, indent=2))

    return {
        'hist': hist,
        'total': total_cites,
        'hindex': hindex,
        'i10index': i10index
    }

def main():
    if len(sys.argv) != 2:
        print("Usage: python3 scholar_yearly.py <GS_AUTHOR_ID>")
        sys.exit(1)

    aid = sys.argv[1]
    out = fetch_cites_by_year(aid)
    if not out:
        sys.exit(1)

    hist = out['hist']
    total = out['total']
    hidx = out['hindex']
    i10 = out['i10index']

    # Update gscholar.tex in-place
    fname = 'gscholar.tex'
    text = open(fname, encoding='utf-8').read()

    # 1) Replace the table (drop "Since 2020" column)
    table = r"""\begin{tabular}{lr}
\toprule
  & \textbf{All} \\
\midrule
Citations  & %d \\
h\textendash index & %d \\
i10\textendash index & %d \\
\bottomrule
\end{tabular}""" % (total, hidx, i10)
    text = re.sub(
        r'\\begin\{tabular\}.*?\\end\{tabular\}',
        table, text, flags=re.S
    )

    # 2) Update the xticklabels to match fetched years
    years = sorted(int(y) for y in hist.keys())
    xtick_str = 'xticklabels={' + ','.join(str(y) for y in years) + '}'
    text = re.sub(
        r'xticklabels=\{.*?\}',
        xtick_str, text
    )

    # 3) Regenerate the \addplot coordinates from hist
    coords = ' '.join(f'({y},{hist[str(y)]})' for y in years)
    plot = r'\addplot[fill=gray] coordinates {' + coords + '};'
    text = re.sub(
        r'\\addplot\[.*?\]\s*coordinates\s*\{.*?\};',
        plot, text, flags=re.S
    )

    with open(fname, 'w', encoding='utf-8') as f:
        f.write(text)

    print(f"[+] Updated {fname}")

if __name__ == '__main__':
    main()
