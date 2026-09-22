---
# Leave the homepage title empty to use the site title
title: ''
date: 2022-10-24
type: landing

design:
  # Phase 3: default section rhythm from the approved spacing scale.
  # Was '6rem' (96px), which produced ~12,800px of homepage.
  spacing: '4.5rem'

sections:
  # ── 1. Hero / Identity ────────────────────────────────────────────────
  - block: hero-with-stats
    id: about
    content:
      # The wordmark above already states the name, so the h1 carries the
      # positioning rather than repeating it.
      title: 'Quantum, photonic and intelligent device research'
      text: |
        Six domains — quantum, photonics, antennas, computing and AI, embedded systems and renewable energy — investigated together and built in the lab.
      details: |
        Led by [Dr. Sajid Muhaimin Choudhury](/authors/me), [Department of EEE, BUET](https://eee.buet.ac.bd).
      primary_action:
        text: Explore Research
        url: '/research/'
        icon: hero/beaker
      secondary_action:
        text: Meet the Team
        url: '/authors/'
        icon: hero/user-group
      # Compact credibility strip, folded into the hero.
      # Values mirror the previous stats block — no new claims.
      items:
        - value: '50+'
          label: Peer-reviewed publications
        - value: '1300+'
          label: Scholarly citations
        - value: '13'
          label: h-index (Google Scholar)
        - value: '6'
          label: Research areas
    design:
      css_class: ''
      spacing:
        padding: ['3rem', 0, '2rem', 0]

  # ── 2. Research at a Glance ───────────────────────────────────────────
  - block: research-area-qpacers
    id: research
    content:
      title: Research
      subtitle: ''
      text: Research runs under the Q-PACERS framework — Quantum, Photonic, Antenna, Computing, Embedded and Renewable-energy Systems.
      items:
        - name: Quantum Computing & Quantum Photonics
          description: Photonic qubits, quantum error correction and device architectures, with emphasis on algorithm–hardware co-design.
          icon: hero/quantum
          status: emerging
          topics:
            - Photonic Qubits
            - Quantum Error Correction
            - Optical Quantum Systems
          cta:
            url: /research/quantum

        - name: Photonics & Nanophotonics
          description: Plasmonic structures, metasurfaces and optical modulators for sensing, communication and light–matter interaction.
          icon: hero/photonics
          status: active
          topics:
            - Metasurfaces
            - Optical Modulators
            - Optical Sensing
          cta:
            url: /research/photonics

        - name: Antenna & Electromagnetic Systems
          description: Fractal antennas and reconfigurable metasurfaces for communication and sensing applications.
          icon: hero/antenna
          status: past
          topics:
            - Fractal Antennas
            - Electromagnetic Modeling
            - Wireless Systems
          cta:
            url: /research/antenna

        - name: Computing & AI for Physical Systems
          description: Machine learning, optimisation and physics-informed computation applied to photonic and hardware design.
          icon: hero/computing
          status: planning
          topics:
            - AI for Photonics
            - Computer Architecture
            - Optimization Algorithms
          cta:
            url: /research/computing

        - name: Embedded Systems & IoT
          description: Embedded platforms and intelligent sensing for environmental monitoring and healthcare systems.
          icon: hero/embedded
          status: active
          topics:
            - Embedded Systems Design
            - Edge Computing
            - Hardware Prototyping
          cta:
            url: /research/embedded

        - name: Renewable Energy & Sustainable Systems
          description: Photovoltaic technologies and energy harvesting using nanophotonics and energy-aware design.
          icon: hero/renewable
          status: active
          topics:
            - Photovoltaics
            - Energy Harvesting
            - Photocatalysis
          cta:
            text: All research areas
            url: /research/
    design:
      layout: cards
      css_class: 'sj-band'
      spacing:
        padding: ['4.5rem', 0, '4.5rem', 0]

  # ── 3. Selected Publications ──────────────────────────────────────────
  # Curated via `featured: true` in publication front matter — not
  # most-recent. See docs/redesign/implementation-roadmap.md (Phase 3).
  - block: collection
    id: publication
    content:
      title: Selected Publications
      text: ''
      filters:
        folders:
          - publication
        featured_only: true
      count: 4
      archive:
        text: View all publications
    design:
      view: citation
      spacing:
        padding: ['4.5rem', 0, '4.5rem', 0]

  # ── 4. Featured Projects (placeholder until Phase 4) ──────────────────
  - block: projects-featured
    id: projects-portfolio
    content:
      title: Projects & Engineering Work
      subtitle: ''
      count: 3
      text: |
        Selected open-source software, research software and engineering tools from the lab will be showcased here.
      cta:
        text: View all projects
        url: /projects/
    design:
      css_class: 'sj-band'
      spacing:
        padding: ['4.5rem', 0, '4.5rem', 0]

  # ── 5. Team ───────────────────────────────────────────────────────────
  - block: team-showcase-admin
    id: team
    content:
      title: Team
      subtitle: ''
      text: ''
      user_groups:
        - Principal Investigator
      sort_by: 'Params.last_name'
      sort_ascending: true
      cta:
        text: View all team members
        url: /authors/
        icon: user-group
    design:
      show_role: true
      show_organizations: false
      show_interests: false
      show_social: true
      css_class: 'sj-team-compact'
      spacing:
        padding: ['4.5rem', 0, '4.5rem', 0]

  # ── 6. Teaching & Notes ───────────────────────────────────────────────
  - block: collection
    id: teaching
    content:
      title: Teaching
      subtitle: ''
      text: ''
      filters:
        folders:
          - teaching
        exclude_past: false
      count: 3
      sort_by: Date
      sort_ascending: false
      archive:
        text: View teaching
    design:
      view: compact
      show_date: false
      show_read_time: false
      show_read_more: false
      css_class: 'sj-band sj-compact-list'
      spacing:
        padding: ['4.5rem', 0, '4.5rem', 0]

  # ── 7. Latest News ────────────────────────────────────────────────────
  - block: collection
    id: news
    content:
      title: Latest News
      subtitle: ''
      text: ''
      filters:
        folders:
          - news
        exclude_past: false
      count: 3
      sort_by: Date
      sort_ascending: false
      archive:
        text: View all news
    design:
      view: compact
      show_date: true
      show_read_time: false
      show_read_more: false
      css_class: 'sj-compact-list'
      spacing:
        padding: ['4.5rem', 0, '4.5rem', 0]

  # ── 8. Collaborators & Partners ───────────────────────────────────────
  - block: logos
    id: partners
    content:
      title: Collaborators & Partners
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
        padding: ['3rem', 0, '3rem', 0]

  # ── 9. Contact ────────────────────────────────────────────────────────
  - block: contact-info
    id: contact
    content:
      title: Contact
      subtitle: For research collaboration, academic enquiries and student supervision.
      visit_title: Visit Office
      connect_title: Connect Online
      address:
        lines:
          - Department of EEE, BUET
          - EEE 222, ECE Building
          - Dhaka 1205, Bangladesh
      email: sajid@eee.buet.ac.bd
      social:
        - icon: brands/linkedin
          url: https://linkedin.com/in/sajidmc
        - icon: academicons/google-scholar
          url: https://scholar.google.com/citations?user=Fu8Hkb4AAAAJ&hl=en
        - icon: academicons/orcid
          url: https://orcid.org/0000-0002-0216-7125
      show_form: false
    design:
      css_class: 'sj-contact-compact'
      spacing:
        padding: ['3rem', 0, '3rem', 0]

# ── Removed from the homepage in Phase 3 ────────────────────────────────
#   * block: collection id: projects  (full Research Grants list, 1852px)
#       -> grants remain at /projects/ and on /research/ until Phase 4
#          migrates Funding to /research/funding/.
#   * block: stats  (576px standalone card section)
#       -> folded into the hero as a compact strip.
#   * block: cta-button-list  (orphan 288px section for one button)
#       -> replaced by inline section links.
#   * block: sajid-general-links-blog id: outreach  (1108px, a verbatim
#     duplicate of content/outreach/_index.md)
#       -> Phase 5: that section is now /resources/, linked from the navbar
#          and the footer. /outreach/ remains only as an alias.
---
