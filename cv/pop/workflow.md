
## Workflow 

 - PublishorPerish - update the PoPAuthYear.csv from the GUI (once every year at the start of the year.)
        - to do: add a check if current year is not in the csv, give an error / warning
Each time CV update workflow
 - add new publications in the papers.bib file. Add citationurl field in the bib file from the PoPCites.csv, add journal metrics from SCIMAGO JR manually.
 - PublishorPerish Commandline - update PoPCites.csv with pop8query.exe
 - PublishorPerish Commandline - update PoPMetrics.csv with pop8metrics.exe
 - Run author_page.py to update the latex file gscholar.tex
 - Run update_citation.py to update the citations in the bib file
 - Run lualatex > biber > lualatex to compile the PDF
 - Copy PDF in the author folders
 - Run academic file converter on the bib file to update webpage
   
- 