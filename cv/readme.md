# LaTeX CV Template with Automated Citation Integration

This LaTeX CV template is designed for academics and researchers seeking a streamlined way to manage and present their publications and citation metrics. It integrates with Google Scholar and leverages automation tools to keep your CV up-to-date with minimal effort.

## Features

- **Reverse Numbering of Publications**: Publications are listed in reverse chronological order, with numbering that reflects the most recent works first.

- **Automated Citation Counts**: Citation numbers are fetched directly from Google Scholar, ensuring your CV reflects the latest impact metrics.

- **Integration with Publish or Perish**: Utilizes the Publish or Perish tool to automatically retrieve citation data from Google Scholar.

- **Dynamic BibTeX Updates**: A Python script updates your `.bib` file with current citation counts, keeping your publication list accurate.

- **Author Metrics and Graphs**: The Python script also updates author-level metrics and generates visual graphs to showcase your research impact.

## Getting Started

### Prerequisites

- **LaTeX Distribution**: Ensure you have a LaTeX distribution installed (e.g., TeX Live, MiKTeX).

- **Python 3**: Required for running the automation scripts.

- **Publish or Perish**: Download and install [Publish or Perish](https://harzing.com/resources/publish-or-perish) to fetch citation data.

### Installation

1. **Clone the Repository**:

   ```bash
   git clone https://github.com/sajidbuet/sajidbuet.github.io/cv.git
   cd cv
   ```


2. **Set Up the Python Environment**:

   ```bash
   pip install -r requirements.txt
   ```


3. **Configure Publish or Perish**:

   - Set up your Google Scholar profile within Publish or Perish.

   - Export the citation data to a CSV file named `PopCites.csv` and place it in the project directory.

4. **Update the BibTeX File**:

   ```bash
   python update_citations.py
   ```


   This script will update your `papers.bib` file with the latest citation counts and generate updated author metrics and graphs.

5. **Compile the LaTeX CV**:

   Use your preferred LaTeX editor or command-line tool to compile the `cv.tex` file:

   ```bash
   lualatex cv.tex
   biber cv
   lualatex cv.tex
   lualatex cv.tex
   ```
If you use VS Code, here is the build recipe for it
** To Be Done: create a json file with VSCode Settings **


## File Structure

- `cv.tex`: Main LaTeX CV file.

- `papers.bib`: BibTeX file containing your publications.

- `PopCites.csv`: CSV file exported from Publish or Perish with citation data.

- `update_citations.py`: Python script to update citation counts and author metrics.

- `metrics/`: Directory containing generated graphs and metrics.

## Customization

- **Adding Publications**: Add new publications to the `papers.bib` file in standard BibTeX format. Each publication should have the google scholar link manually copied in the citesurl and the citationnumber can be blank.

- **Styling**: Modify the `cv.tex` file to change the layout, fonts, or colors to match your preferences.

- **Graphs and Metrics**: Customize the Python script to generate additional graphs or metrics as needed.

## Contributing

Contributions are welcome! Feel free to fork the repository and submit pull requests for improvements or additional features.

## License

This project is licensed under the MIT License.

---

Feel free to replace `yourusername` with your actual GitHub username in the clone URL. Let me know if you need further assistance or customization! 