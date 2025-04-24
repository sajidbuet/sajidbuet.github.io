# Dr. Sajid Muhaimin Choudhury
# Usage:
#  this file would need updated PoPMetrics.csv downloaded with Publish or Perish.
# You also need to manually update the PoPAuthYear.csv by looking at the PoP gui.
#  (this could not be automated). PoPAuthYear.csv needs to have correct citation-per-year 
# for all years except the last one. 



#!/usr/bin/env python3
import pandas as pd
#import matplotlib.pyplot as plt
import re
import math

def main():
    # 1) Load the per‑year CSV
    df_year = pd.read_csv('PoPAuthYear.csv')  
    #    expects columns: Year,Cites
    
    # 2) Load the metrics CSV (single row of values)
    df_metrics = pd.read_csv('PoPMetrics.csv')  
    #    header: 34 field names, one data row
    
    # 3) Extract total citations
    metrics = df_metrics.iloc[0].to_dict()
    total_citations = int(metrics.get('c', 0)) #Citations
    total_papers = int(metrics.get('p', 0)) #Papers
    h_index = int(metrics.get('h', 0))  #h_index  
    i10_index = int(metrics.get('hc', 0))  #hc_index  

    

    print(f"           Total citations from PoPMetrics: {total_citations}")
    
    # 4) Compute sum of all but the last year
    if len(df_year) < 2:
        raise ValueError("           Need at least two years of data to recalculation.")
    sum_except_last = df_year['Cites'][:-1].sum()
    print(f"           Sum of citations except last year: {sum_except_last}")
    # 5) Recalculate the last year's value
    last_idx = df_year.index[-1]
    df_year.at[last_idx, 'Cites'] = total_citations - sum_except_last
    print(f"           Recalculated last year ({df_year.at[last_idx,'Year']}) cites: "
          f"{df_year.at[last_idx,'Cites']}")
    
    # 6) Plot Year vs. Cites
    #plt.figure(figsize=(8,4))
    plotyears = df_year['Year'][-8:].astype(str)
    plotcites = df_year['Cites'][-8:]
    #plt.bar(plotyears, plotcites, width=0.6)
    #plt.xlabel('Year')
    #plt.ylabel('Citations')
    #plt.title('Annual Citations')
    #plt.xticks(rotation=45)
    #plt.tight_layout()
    
    # 7) Show or save
    #plt.show()
    # plt.savefig('annual_citations.png', dpi=300)

    # Coordinate and tick label strings
    coordinates_str = " ".join(f"({y},{c})" for y, c in zip(plotyears, plotcites))
    xticklabels_str = ",".join(str(y) for y in plotyears)

    print("           Starting update of gscholar.tex")
    # Determine ymax and ytick values
    ymax = math.ceil(max(plotcites) / 55) * 55
    yticks = list(range(0, ymax + 1, 55))
    ytick_str = ",".join(str(y) for y in yticks)

    print(f"           Auto-adjusted ymax = {ymax}")
    print(f"           Auto-generated yticks = {ytick_str}")
    # Read the LaTeX file
    try:
        with open("gscholar.tex", "r", encoding="utf-8") as file:
            content = file.read()
    except FileNotFoundError:
        print("           ERROR: File gscholar.tex not found.")
        exit(1)

    # Debug original values
    print("\n            Original values preview:")
    match_metrics = re.findall(r"(Total Citations|h.?index|i10.?index)\s*&\s*\d+", content)
    print("\n".join(match_metrics) if match_metrics else "No metrics found")

    match_coords = re.search(r"\\addplot\[fill=gray\] coordinates \{([^}]*)\}", content)
    print(f"\n            Old TikZ coordinates: {match_coords.group(1)}" if match_coords else "No plot coordinates found")

    # Safe regex for dashes (accepts regular or non-breaking hyphens)
    def safe_replace(label, value):
        pattern = rf"{label}\s*&\s*\d+"
        return re.sub(pattern, f"{label} & {value}", content)

    # Update the metrics table (support non-breaking hyphen too)
    content = re.sub(r"Total Citations\s*&\s*\d+", f"Total Citations & {total_citations}", content)
    content = re.sub(r"h.?index\s*&\s*\d+", f"h-index & {h_index}", content)
    content = re.sub(r"i10.?index\s*&\s*\d+", f"i10-index & {i10_index}", content)

    # Update xtick labels
    content = re.sub(
        r"xticklabels=\{[^}]*\}",
        f"xticklabels={{ {xticklabels_str} }}",
        content
    )

    # Update bar chart coordinates
    replacement = "addplot[fill=gray] coordinates { " + coordinates_str + " };"
    content = re.sub(r"addplot\[fill=gray\] coordinates \{[^}]*\};", replacement, content)


        # Replace ymax
    content = re.sub(
        r"ymax=\d+",
        f"ymax={ymax}",
        content
    )

    # Replace ytick
    content = re.sub(
        r"ytick=\{[^}]*\}",
        f"ytick={{ {ytick_str} }}",
        content
    )

    # Write back
    with open("gscholar.tex", "w", encoding="utf-8") as file:
        file.write(content)

    print("\n Update complete. New values:")
    print(f" Total Citations: {total_citations}")
    print(f" h-index: {h_index}")
    print(f" i10-index: {i10_index}")
    print(f" Coordinates: {coordinates_str}")
    print(f" xTick Labels: {xticklabels_str}")

    print("gscholar.tex updated successfully.")

if __name__ == '__main__':
    main()
