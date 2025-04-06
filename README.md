# Q-PACERS Personal Website Repository

Welcome to the repository for my personal website [sajid.buet.ac.bd](https://sajid.buet.ac.bd), built using Hugo and the HugoBlox framework. This project showcases my professional portfolio, publications, and more.

## Features

- **Custom Layouts:** Tailored templates to present content uniquely.
- **Multilingual Support:** Enables content in multiple languages (Bangla and English) for a diverse audience.
- **Indic Number function:** Convert roman numerals to indic numbers (১২৩৪৫৬) using script
- **Automated Scripts:** PowerShell and batch scripts streamline development and deployment.

## Repository Structure

- **`assets/`**: Static assets like images and stylesheets.
- **`content/`**: Markdown files for site pages and posts.
- **`layouts/`**: Custom templates for content rendering.
- **`static/`**: Files served directly at the root URL.
- **`config/_default/`**: Configuration files for Hugo settings.
- **`i18n/`**: Translation files for multilingual support. Additional entry for custom fields
- **`_pythonscripts`**: Python codes for importing old website data.

## Custom Scripts

The repository includes several scripts to facilitate various tasks:

- **PowerShell Scripts (`.ps1`):**
  - `ac-import.ps1`: Automates the import of academic publications into the website.
  - `full-compile-buet.ps1`: Compiles the site with specific settings for BUET.
  - `latexrun.ps1`: Processes LaTeX files, converting them to web-friendly formats.

- **Batch Scripts (`.BAT`):**
  - `gitcommit.BAT`: Stages all changes, commits with a message, and pushes to the repository.
  - `rmpublic.BAT`: Removes the `public/` directory to clean up the build environment.


## Multilingual Support

The website supports multiple languages, with translations managed in the `i18n/` directory. Each language has its own `.yaml` file containing key-value pairs for translation strings. This setup allows for seamless content localization.

## Layout Customizations

Custom layouts in the `layouts/` directory override default Hugo templates, providing unique designs for various sections of the site. These templates are tailored to enhance the presentation of content such as publications, events, and team profiles.
- **Custom Layouts (`.html` in `layouts/`):**
  - 

## Deployment

The site is configured for deployment on Netlify, with settings specified in the `netlify.toml` file. This configuration ensures smooth and automated deployment processes.

## License

This project is licensed under the MIT License. For more details, refer to the [LICENSE.md](LICENSE.md) file.

---

*Note: This README provides an overview of the repository's structure and functionalities. For detailed instructions on installation, usage, and contribution guidelines, please refer to the respective documentation files within the repository.* 