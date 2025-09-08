import yaml
import re
import os

# Sample data structured as a list of dictionaries
entries = [
    {
        'date': '2024-11-11',
        'title': 'Polarization Insensitive Electrically Reconfigurable Meta-Lens for 2 μm Wavelength Published',
        'details': (
            'A groundbreaking study titled "Polarization Insensitive Electrically Reconfigurable Meta-Lens for 2 μm Wavelength" '
            'has been published in Optical Materials Express. This research introduces a meta-lens capable of focusing light '
            'at a 2 μm wavelength without sensitivity to polarization, enhancing its versatility in optical applications. '
            'The lens\'s electrical reconfigurability allows dynamic adjustments, paving the way for advancements in adaptive '
            'optics and infrared imaging systems.'
        ),
        'link': 'https://doi.org/10.1364/OME.540435'
    },
    {
        'date': '2024-09-16',
        'title': 'DFT Analysis of Strain Effects on Monolayer Silicon Carbide Published',
        'details': (
            'A recent publication in Physica B: Condensed Matter presents a density functional theory (DFT) analysis titled '
            '"Investigation of the Physical Properties through Strain Effect of Monolayer Silicon Carbide Material." The study '
            'examines how strain influences the mechanical and electronic properties of monolayer silicon carbide (SiC), '
            'revealing potential applications in nanoscale devices. Understanding these strain effects is crucial for designing '
            'SiC-based components in flexible electronics and sensors.'
        ),
        'link': 'https://doi.org/10.1016/j.physb.2024.416670'
    },
    {
        'date': '2024-09-16',
        'title': 'Reconfigurable Metasurface for Quantum Emitter Control Published',
        'details': (
            'Researchers have published a paper titled "Sb₂S₃/AlGaAs-Based Reconfigurable Metasurface for Dynamic Polarization '
            'and Directionality Control of Quantum Emitter Emission" in RSC Advances. The study demonstrates a metasurface that '
            'can dynamically control the polarization and directionality of light emitted from quantum sources. This innovation '
            'holds promise for quantum communication technologies, where precise manipulation of light is essential for '
            'information transfer and processing.'
        ),
        'link': 'https://doi.org/10.1039/D4RA03726J'
    },
    {
        'date': '2024-09-06',
        'title': 'Synergizing Deep Learning and Phase Change Materials for Multifunctional Metasurfaces',
        'details': (
            'A new study, "Synergizing Deep Learning and Phase Change Materials for Four-State Broadband Multifunctional '
            'Metasurfaces in the Visible Range," has been published in the Journal of Optics and Laser Technology. The research '
            'integrates deep learning algorithms with phase change materials to design metasurfaces capable of multiple '
            'functionalities across the visible spectrum. This approach could lead to the development of advanced optical devices '
            'with applications in imaging, sensing, and display technologies.'
        ),
        'link': 'https://doi.org/10.1016/j.optlastec.2024.108789'
    },
    {
        'date': '2024-08-20',
        'title': 'Google Scholar Profile Surpasses 1000 Citations',
        'details': (
            'A notable academic milestone has been achieved, with the Google Scholar profile surpassing 1000 citations. This '
            'reflects the significant impact and recognition of the research contributions within the scholarly community, '
            'highlighting the influence and reach of the published works.'
        ),
        'link': 'http://scholar.google.com/citations?user=Fu8Hkb4AAAAJ&hl=en'
    },
    {
        'date': '2024-06-04',
        'title': 'Md. Ehsanul Karim Successfully Defends MSc Thesis',
        'details': (
            'Congratulations to Md. Ehsanul Karim for successfully defending his Master\'s thesis. This accomplishment marks a '
            'significant step in his academic journey and contributes valuable insights to his field of study.'
        ),
        'link': None
    },
    {
        'date': '2024-05-09',
        'title': 'New PG Course on Quantum Photonics and Computing Offered',
        'details': (
            'An experimental postgraduate course on Quantum Photonics and Quantum Computing is being offered in the April 2024 '
            'semester. This course aims to equip students with foundational knowledge and practical skills in these cutting-edge '
            'areas, preparing them for research and development roles in quantum technologies.'
        ),
        'link': '/teaching/A2024_EEE6004Q'
    },
    {
        'date': '2024-05-06',
        'title': 'Three Papers Published in ICTP 2023 Proceedings',
        'details': (
            'Three research papers have been published in the Proceedings of ICTP 2023, showcasing advancements in various '
            'technological domains. These publications reflect ongoing research efforts and contributions to the international '
            'scientific community.'
        ),
        'link': None
    },
    {
        'date': '2024-02-17',
        'title': 'Call for Research Assistant Applications',
        'details': (
            'A call for Research Assistant (RA) applications has been announced for the project "RISE-Metalens." This opportunity '
            'invites aspiring researchers to contribute to cutting-edge studies in metasurface technologies, offering a platform '
            'to engage in innovative research and development.'
        ),
        'link': '/research/RISE-Metalens'
    },
    {
        'date': '2024-02-17',
        'title': 'Meta-Lens Design Project Funded by RISE, BUET',
        'details': (
            'The project "Synergizing Deep Learning and Topology Optimization for Tunable Meta-Lens Design" has secured full '
            'funding from RISE, BUET. This initiative aims to develop tunable meta-lenses by integrating deep learning techniques '
            'with topology optimization, potentially revolutionizing optical device design and functionality.'
        ),
        'link': None
    },
    {
        'date': '2024-01-01',
        'title': 'VO₂-Based All-Optical Reflection Modulator Published',
        'details': (
            'The proceedings from the International Photonic Conference in Florida, USA, include a paper titled "VO₂-Based '
            'All-Optical Reflection Modulator for 2 μm Wave Band." The study explores the use of vanadium dioxide (VO₂) in '
            'developing optical modulators operating at the 2 μm wavelength, offering insights into the design of efficient '
            'optical communication components.'
        ),
        'link': 'https://ieeexplore.ieee.org/abstract/document/10360477'
    },
        {
        'date': '2023-04-29',
        'title': 'Reconfigurable Broadband Metasurface Published',
        'details': (
            'A paper titled "Reconfigurable Broadband Metasurface with Switchable Functionalities in the Visible Range" has been '
            'published in Optical Materials Express. The research presents a metasurface capable of switching functionalities '
            'across the visible spectrum, enabling dynamic control over light manipulation for applications in imaging and display '
            'technologies.'
        ),
        'link': None
    },
    {
        'date': '2023-05-03',
        'title': "Shamima Akter Mitu Defends Master's Thesis",
        'details': (
            'Congratulations to Shamima Akter Mitu for successfully defending her Master\'s thesis. This achievement signifies her '
            'dedication and contribution to her area of research, marking a milestone in her academic career.'
        ),
        'link': None
    },
    {
        'date': '2022-12-22',
        'title': 'Comprehensive Review on Biomimicry in Nanotechnology Published',
        'details': (
            'A comprehensive review titled "Biomimicry in Nanotechnology: A Comprehensive Review" has been published in Nanoscale '
            'Advances. The paper delves into how biological principles inspire the design and development of nanomaterials and '
            'devices, highlighting the intersection of biology and nanotechnology for innovative solutions.'
        ),
        'link': 'https://pubs.rsc.org/en/content/articlelanding/2023/na/d2na00571a'
    },
    {
        'date': '2022-11-25',
        'title': 'Abdul Mukit Secures RISE Student Research Grant',
        'details': (
            'Congratulations to Abdul Mukit on successfully securing funding from the RISE Student Research Grant (Call-ID: S2022-02) '
            'for his proposal "Continuous Variable Quantum Key Distribution Optimization and Enhancing an Efficient Quantum Repeater '
            'Architecture Design for Better Quantum Communication Fidelity."'
        ),
        'link': None
    }
    # Add more entries as needed
]

def generate_filename(date, title):
    # Extract keywords from the title for the filename
    keywords = '-'.join(re.findall(r'\b\w+\b', title.lower())[:3])
    return f"{date}-{keywords}.md"

def create_markdown_file(entry):
    filename = generate_filename(entry['date'], entry['title'])
    front_matter = {
        'title': entry['title'],
        'date': entry['date'],
        'image': {
            'focal_point': 'top'
        }
    }
    content = (
        f"---\n"
        f"{yaml.dump(front_matter, default_flow_style=False)}"
        f"---\n\n"
        f"{entry['details']}\n\n"
    )
    if entry.get('link'):
        content += f"[Click here to read more]({entry['link']})\n\n"
    content += "<!--more-->\n"
    with open(filename, 'w', encoding='utf-8') as file:
        file.write(content)

# Generate Markdown files for each entry
for entry in entries:
    create_markdown_file(entry)
