---
title: Research
date: 2022-10-24
type: landing

# Phase 4: restructured around the approved hierarchy —
#   Overview · Research Areas · Funding & Grants · Collaborations · Opportunities
# In-page section navigation is used rather than hover dropdowns, which the
# current navbar component cannot make keyboard-accessible.
# The six Q-PACERS area URLs are unchanged.

sections:
  - block: hero-qpacers
    id: overview
    content:
      title: |
         Research
      image:
        filename: Q-PACER.svg
      text: |
        <br>Research in the lab runs under the **Q-PACERS** framework:
        [**Q**uantum](quantum), [**P**hotonic](photonics), [**A**ntenna](antenna),
        [**C**omputing](computing), [**E**mbedded](embedded) and
        [**R**enewable-energy](renewable) **S**ystems.

        The six areas share methods and people rather than running separately —
        photonic device design feeds the quantum work, the computing and AI work
        supports photonic and metasurface design, and the embedded and
        renewable-energy work turns those designs into hardware. Each area page
        lists its own publications.

  - block: research-area-qpacers
    id: areas
    content:
      title: Research Areas
      subtitle: ''
      text: ''
      items:
        - name: Quantum Computing & Quantum Photonics
          description: Photonic qubits, quantum error correction and device architectures, with emphasis on algorithm–hardware co-design.
          icon: hero/quantum
          status: emerging
          topics: [Photonic Qubits, Quantum Error Correction, Optical Quantum Systems]
          cta:
            url: /research/quantum

        - name: Photonics & Nanophotonics
          description: Plasmonic structures, metasurfaces and optical modulators for sensing, communication and light–matter interaction.
          icon: hero/photonics
          status: active
          topics: [Metasurfaces, Optical Modulators, Optical Sensing]
          cta:
            url: /research/photonics

        - name: Antenna & Electromagnetic Systems
          description: Fractal antennas and reconfigurable metasurfaces for communication and sensing applications.
          icon: hero/antenna
          status: past
          topics: [Fractal Antennas, Electromagnetic Modeling, Wireless Systems]
          cta:
            url: /research/antenna

        - name: Computing & AI for Physical Systems
          description: Machine learning, optimisation and physics-informed computation applied to photonic and hardware design.
          icon: hero/computing
          status: planning
          topics: [AI for Photonics, Computer Architecture, Optimization Algorithms]
          cta:
            url: /research/computing

        - name: Embedded Systems & IoT
          description: Embedded platforms and intelligent sensing for environmental monitoring and healthcare systems.
          icon: hero/embedded
          status: active
          topics: [Embedded Systems Design, Edge Computing, Hardware Prototyping]
          cta:
            url: /research/embedded

        - name: Renewable Energy & Sustainable Systems
          description: Photovoltaic technologies and energy harvesting using nanophotonics and energy-aware design.
          icon: hero/renewable
          status: active
          topics: [Photovoltaics, Energy Harvesting, Photocatalysis]
          cta:
            url: /research/renewable
    design:
      layout: cards
      css_class: 'sj-band'
      spacing:
        padding: ['4.5rem', 0, '4.5rem', 0]

  # ── Funding & Grants — summary only; full list lives at /research/funding/
  - block: grants-summary
    id: funding
    content:
      title: Funding & Grants
      text: Research is supported by competitive internal and national grants.
      count: 3
      cta:
        text: All funding & grants
        url: /research/funding/
    design:
      spacing:
        padding: ['4.5rem', 0, '4.5rem', 0]

  # ── Collaborations — existing partner content only
  - block: logos
    id: collaborations
    content:
      title: Collaborations
      subtitle: ''
      text: ''
      logos:
        - name: BUET
          image: partners/BUET_LOGO.svg
          url: https://eee.buet.ac.bd
          external: true
          description: Bangladesh University of Engineering and Technology
        - name: Purdue University
          image: partners/Purdue_University.svg
          url: https://www.purdue.edu
          external: true
          description: Purdue University
        - name: BRAC University
          image: partners/BRAC_University.svg
          url: https://www.bracu.ac.bd
          external: true
          description: BRAC University
        - name: United International University
          image: partners/UIU.svg
          url: https://www.uiu.ac.bd
          external: true
          description: United International University
    design:
      display_mode: grid
      show_pattern: false
      css_class: 'sj-band sj-partners'
      spacing:
        # Compact: four partners do not need a showcase-height band.
        padding: ['2.5rem', 0, '2.5rem', 0]

  # ── Opportunities
  # Deliberately worded as an invitation to enquire. No positions, stipends or
  # scholarships are claimed, because no repository content supports any.
  - block: markdown
    id: opportunities
    content:
      title: Opportunities
      text: |
        Prospective students, researchers and collaborators are welcome to get in
        touch about research supervision and joint projects.

        [Contact Dr. Sajid Muhaimin Choudhury](mailto:sajid@eee.buet.ac.bd)
    design:
      spacing:
        padding: ['3rem', 0, '4rem', 0]
---
