# Dr. Sajid Muhaimin Choudhury
# Usage:
#  this file would need updated PoPMetrics.csv downloaded with Publish or Perish.
# You also need to manually update the PoPAuthYear.csv by looking at the PoP gui.
#  (this could not be automated). PoPAuthYear.csv needs to have correct citation-per-year 
# for all years except the last one. 



#!/usr/bin/env python3
import pandas as pd
import matplotlib.pyplot as plt

def main():
    # 1) Load the per‑year CSV
    df_year = pd.read_csv('PoPAuthYear.csv')  
    #    expects columns: Year,Cites
    
    # 2) Load the metrics CSV (single row of values)
    df_metrics = pd.read_csv('PoPMetrics.csv')  
    #    header: 34 field names, one data row
    
    # 3) Extract total citations
    metrics = df_metrics.iloc[0].to_dict()
    total_citations = int(metrics.get('Citations', 0))
    total_papers = int(metrics.get('Papers', 0))
    h_index = int(metrics.get('h_index', 0))
    print(f"Total citations from PoPMetrics: {total_citations}")
    
    # 4) Compute sum of all but the last year
    if len(df_year) < 2:
        raise ValueError("Need at least two years of data to recalculation.")
    sum_except_last = df_year['Cites'][:-1].sum()
    print(f"Sum of citations except last year: {sum_except_last}")
    # 5) Recalculate the last year's value
    last_idx = df_year.index[-1]
    df_year.at[last_idx, 'Cites'] = total_citations - sum_except_last
    print(f"Recalculated last year ({df_year.at[last_idx,'Year']}) cites: "
          f"{df_year.at[last_idx,'Cites']}")
    
    # 6) Plot Year vs. Cites
    plt.figure(figsize=(8,4))
    plt.bar(df_year['Year'][-8:].astype(str), df_year['Cites'][-8:], width=0.6)
    plt.xlabel('Year')
    plt.ylabel('Citations')
    plt.title('Annual Citations')
    plt.xticks(rotation=45)
    plt.tight_layout()
    
    # 7) Show or save
    plt.show()
    # plt.savefig('annual_citations.png', dpi=300)

if __name__ == '__main__':
    main()
