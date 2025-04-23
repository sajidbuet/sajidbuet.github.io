#!/usr/bin/env python3
"""
scholar_yearly.py

Reads PoPAuthYear.csv and PoPMetrics.csv from the current directory,
recalculates the last year’s citations, and updates gscholar.tex in place
to reflect the new table (only “All” column) and bar‐chart data.
"""
import pandas as pd
import re

def main():
    # 1) Load the CSVs
    df_year    = pd.read_csv('PoPAuthYear.csv')   # columns: Year,Cites
    df_metrics = pd.read_csv('PoPMetrics.csv')    # header: many fields including 'Citations','h-index','i10-index'

    # 2) Extract total metrics
    row = df_metrics.iloc[0]
    total_cites = int(float(row['Citations']))
    hindex      = int(float(row['h-index']))
    i10index    = int(float(row['i10-index']))

    # 3) Recalculate last year’s citations
    if len(df_year) < 2:
        raise ValueError("Need at least two years of data to recalculate.")
    sum_except_last = df_year['Cites'][:-1].sum()
    last_idx = df_year.index[-1]
    df_year.at[last_idx, 'Cites'] = total_cites - sum_except_last

    # 4) Prepare replacements
    # 4a) Table snippet
    table_snippet = (
        r"\begin{tabular}{lr}" "\n"
        r"\toprule" "\n"
        r"  & \textbf{All} \\" "\n"
        r"\midrule" "\n"
        f"  Citations        & {total_cites} \\\\" "\n"
        f"  h\\textendash index & {hindex} \\\\" "\n"
        f"  i10\\textendash index & {i10index} \\\\" "\n"
        r"\bottomrule" "\n"
        r"\end{tabular}"
    )

    # 4b) Bar‐chart data
    years = df_year['Year'].astype(int).tolist()
    cites = df_year['Cites'].astype(int).tolist()
    xtick_str = 'xticklabels={' + ','.join(str(y) for y in years) + '}'
    coords_str = ' '.join(f"({y},{c})" for y, c in zip(years, cites))
    plot_snippet = r"\addplot[fill=gray] coordinates {" + coords_str + "};"

    # 5) Read gscholar.tex
    fname = 'gscholar.tex'
    with open(fname, encoding='utf-8') as f:
        text = f.read()

    # 6) Apply substitutions
    # Replace entire tabular environment
    text = re.sub(
        r"\\begin\{tabular\}.*?\\end\{tabular\}",
        table_snippet,
        text,
        flags=re.S
    )
    # Replace xticklabels
    text = re.sub(
        r"xticklabels=\{.*?\}",
        xtick_str,
        text
    )
    # Replace coordinates line
    text = re.sub(
        r"\\addplot\[.*?\]\s*coordinates\s*\{.*?\};",
        plot_snippet,
        text,
        flags=re.S
    )

    # 7) Write back
    with open(fname, 'w', encoding='utf-8') as f:
        f.write(text)

    print(f"[+] Updated {fname} with latest metrics and annual data.")

if __name__ == '__main__':
    main()
