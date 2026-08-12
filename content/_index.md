---
# Leave the homepage title empty to use the site title
title: ''
date: 2026-12-08
type: landing

design:
  # Default section spacing
  spacing: '6rem'

sections:
  - block: hero-with-stats
    id: about
    content:
      title: |
        SAJID Lab 
      text: |
         We work on problems related to **quantum**, **photonics**, **antenna**, **computing and AI**, **embedded systems**, **renewable** systems through interdisciplinary research and hands-on innovation. Led by [Dr. Sajid Muhaimin Choudhury](/authors/me), [Department of EEE, BUET](https://eee.buet.ac.bd), our goal is to develop rigorous, high-impact technologies while training the next generation of researchers and engineers.
      primary_action:
        text:  Meet the Team
        url: '#team'
        icon: hero/user-group
      secondary_action:
        text:  View Publications
        url: '#publication'
        icon: hero/academic-cap
      #announcement:
      #  text: "We are hiring PhD students and postdocs!"
      #  link:
      #    text: "Apply now"
      #    url: "/opportunities"
    design:
      # For full-screen, add `min-h-screen` below
      css_class: ""
      background:
        # Option A: Modern gradient mesh (recommended for 2025/2026)
        gradient_mesh:
          enable: true
          style: "waves"
          animation: "pulse"
          intensity: "medium"
          colors:
            - "primary-500/30"
            - "secondary-600/20"
            - "indigo-600/15"
        
        # Option B: Team/lab image (uncomment to use instead of gradient mesh)
        #image:
        #  filename: "pexels-polina-tankilevitch-3735769.jpg"
        #  filters:
        #    brightness: 0.6
        #    contrast: 1.1



  - block: stats
    content:
      items:
        - statistic: "50+"
          description: Peer-reviewed publications
          sub_metric: Journals and international conferences in photonics, nanotechnology, and embedded systems
          icon: hero/document-text

        - statistic: "1300+"
          description: Scholarly citations
          sub_metric: "h-index: 13 (Google Scholar)"
          icon: hero/chart-bar

        - statistic: "7"
          description: MSc theses supervised
          sub_metric: Photonics, metasurfaces, quantum devices, and energy systems
          icon: hero/user-group

        - statistic: "6"
          description: Core research domains
          sub_metric: Quantum, Photonics, Antenna, Computing, Embedded Systems, Renewable Energy (Q-PACERS)
          icon: hero/beaker
    design:
      layout: cards
      # Section background color (CSS class)
      css_class: "bg-gradient-to-b from-primary-50 to-white dark:from-primary-900/20 dark:to-gray-800"
      spacing:
        padding: ["3rem", 0, "3rem", 0]

  - block: research-area-qpacers
    id: research
    
    content:
      title: Research Focus Areas
      subtitle: 
      text: Research is organized under the Q-PACERS framework, integrating Quantum, Photonic, Antenna, Computing, Embedded, and Renewable-Energy Systems to address next-generation challenges in intelligent devices and advanced electromagnetic systems.
      
      items:
        - name: Quantum Computing & Quantum Photonics
          description: Investigating quantum information processing, photonic qubits, and quantum device architectures, with emphasis on algorithm–hardware co-design and emerging quantum photonic platforms.
          icon: hero/quantum
          gradient: from-indigo-400 to-purple-600
          status: emerging
          topics:
            - Photonic Qubits
            - Quantum Error Correction
            - Optical Quantum Systems
          cta:
            text: Explore Research
            url: /research/quantum

        - name: Photonics & Nanophotonics
          description: Designing nanoscale photonic materials and devices, including plasmonic structures, metasurfaces, and optical modulators for sensing, communication, and light–matter interaction engineering.
          icon: hero/photonics
          gradient: from-blue-400 to-cyan-600
          status: active
          topics:
            - Metasurfaces
            - Optical Modulators
            - Optical Sensing
          cta:
            text: Explore Research
            url: /research/photonics

        - name: Antenna & Electromagnetic Systems
          description: Developing advanced antenna systems and engineered electromagnetic structures, including fractal antennas and reconfigurable metasurfaces for communication and sensing applications.
          icon: hero/antenna
          gradient: from-green-400 to-emerald-600
          status: past
          topics:
            - Fractal Antennas
            - Electromagnetic Modeling
            - Wireless Systems
          cta:
            text: Explore Research
            url: /research/antenna

        - name: Computing & AI for Physical Systems
          description: Integrating machine learning, optimization, and computational methods with physical system design, including AI-assisted photonic design and physics-informed computation.
          icon: hero/computing
          gradient: from-purple-400 to-pink-600
          status: planning
          topics:
            - AI for Photonics
            - Computer Architecture
            - Optimization Algorithms
          cta:
            text: Explore Research
            url: /research/computing

        - name: Embedded Systems & IoT
          description: Designing embedded platforms and intelligent sensing systems for real-world applications, including IoT-enabled devices for environmental monitoring and healthcare systems.
          icon: hero/embedded
          gradient: from-yellow-400 to-orange-600
          status: active
          topics:
            - Embedded Systems Design
            - Edge Computing
            - Hardware Prototyping
          cta:
            text: Explore Research
            url: /research/embedded

        - name: Renewable Energy & Sustainable Systems
          description: Advancing photovoltaic technologies and sustainable energy systems using nanophotonics, including solar cell optimization and energy-aware intelligent systems.
          icon: hero/renewable
          gradient: from-amber-400 to-red-500
          status: active
          topics:
            - Photovoltaics
            - Energy Harvesting
            - Photocatalysis
          cta:
            text: Explore Research
            url: /research/renewable

      cta:
        text: View All Research Activities
        url: /research
        icon: hero/arrow-right

    design:
      layout: cards
      css_class: "bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800"
      spacing:
        padding: ["5rem", 0, "5rem", 0]


  - block: collection
    id: projects
    content:
      title: Research Grants
      subtitle: ''
      text: ''
      filters:
        folders:
          - projects
      count: 0  # Number of items to show (0 = all)
      # Default filter UI (for future release)
      #default_button_index: 0
      # Filter toolbar (optional)
      # Add or remove as many filters as you like
    #   buttons:
    #     - name: All
    #       tag: '*'
    #     - name: Machine Learning
    #       tag: ML
    #     - name: Biology
    #       tag: Biology
    #     - name: Materials
    #       tag: Materials
    design:
      view: grant
      columns: 2


  - block: team-showcase-admin
    id: team
    content:
      title: Meet Our Team
      subtitle: ''
      text: ''
      user_groups:
        - Principal Investigator
      sort_by: 'Params.last_name'
      sort_ascending: true
      cta:
        text: View All Team Members
        url: /authors
        icon: user-group
    design:
      show_role: true
      show_organizations: false
      show_interests: true
      show_social: true
      # Section background color
      css_class: "bg-gray-50 dark:bg-gray-900"
      # Reduce spacing
      spacing:
        padding: ["3rem", 0, "3rem", 0]

  - block: collection
    id: publication
    content:
      title: Recent Publications
      text: ''
      filters:
        folders:
          - publication
        exclude_featured: false
      count: 3
    design:
      view: citation
  - block: cta-button-list
    content:
      buttons:
        - text: View All Publications
          url: /publication/
          icon: academicons/google-scholar      
#  - block: collection
#    id: featured
#    content:
#      title: Featured Research
#      filters:
#        folders:
#          - featured-research
#        featured_only: true
#    design:
#      view: article-grid
#      columns: 2

  - block: collection
    id: teaching
    content:
      title: Teaching
      subtitle: Courses offered
      text: List all courses
      filters:
        folders:
          - teaching
        exclude_past: false  # Show both past and future events
      count: 5
      sort_by: Date
      sort_ascending: false
    design:
      view: card-basic
      # columns: 3
      show_date: true
      show_read_time: false
      show_read_more: true
      css_class: "bg-gradient-to-b from-white to-gray-50 dark:from-gray-800 dark:to-gray-900"
      spacing:
        padding: ["4rem", 0, "4rem", 0]


  - block: collection
    id: news
    content:
      title: News & Updates
      subtitle: ''
      text: ''
      filters:
        folders:
          - news
        exclude_past: false  # Show both past and future events
      count: 3
      sort_by: Date
      sort_ascending: false
    design:
      view: card-noimage
      # columns: 3
      show_date: true
      show_read_time: false
      show_read_more: true
      css_class: "bg-gradient-to-b from-white to-gray-50 dark:from-gray-800 dark:to-gray-900"
      spacing:
        padding: ["4rem", 0, "4rem", 0]      

  - block: logos
    content:
      title: Collaborators & Partners
      subtitle: Leading the way together
      text: We work with top universities, research institutes, and industry leaders to advance scientific discovery
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
          url: https://research.google
          external: true
          description: BRAC University
        - name: United International University
          image: partners/UIU.svg
          url: https://www.uiu.ac.bd
          external: true
          description: United International University
      cta:
        text: Collaborate with us
        url: /#contact
        icon: hero/user-plus
    design:
      display_mode: grid
      show_pattern: false
      css_class: "bg-gradient-to-b from-white to-gray-50 dark:from-gray-800 dark:to-gray-900"
      spacing:
        padding: ["4rem", 0, "4rem", 0]

  - block: contact-info
    id: contact
    content:
      title: Contact
      subtitle: Get in touch for research collaboration, academic inquiries, and student supervision
      visit_title: Visit Office
      connect_title: Connect Online
      address:
        lines:
          - Dr. Sajid Muhaimin Choudhury
          - Professor
          - Department of Electrical and Electronic Engineering (EEE)
          - Bangladesh University of Engineering and Technology (BUET)
          - EEE 222, ECE Building
          - BUET, Dhakeshwari Road
          - Dhaka 1205, Bangladesh
      directions:
        - Enter ECE Building from the Palashi side
        - Take the stairs to Floor 2
        - Office: Room 222
      office_hours:
        - "Saturday: 9:00 AM - 4:00 PM"
      email: sajid@eee.buet.ac.bd
      phone: "+88-02-55666000 / Ext 6452"
      social:
        - icon: brands/linkedin
          url: https://linkedin.com/in/sajidmc
        - icon: academicons/google-scholar
          url: https://scholar.google.com/citations?user=Fu8Hkb4AAAAJ&hl=en
        - icon: academicons/orcid
          url: https://orcid.org/0000-0002-0216-7125
      prospective:
        title: Prospective Students and Collaborators
        text: Prospective students, researchers, and collaborators are welcome to get in touch regarding research opportunities, supervision, and joint projects.
        button:
          text: Email Dr. Sajid
          url: mailto:sajid@eee.buet.ac.bd
      map_url: https://maps.google.com/?q=EEE+222+ECE+Building+BUET+Dhakeshwari+Road+Dhaka+1205+Bangladesh
      show_form: false
    design:
      css_class: "bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800"
      spacing:
        padding: ["5rem", 0, "5rem", 0]


  - block: sajid-general-links-blog
    id: outreach
    content:
      title: Outreach & Beyond Research
      subtitle: >
        Resources, writing, professional service, and personal creative work beyond formal research.

      column_1:
        heading: Resources
        subheading: >
          Useful resources for students, collaborators.
        icon: hero/academic-cap
        buttons:
          - title: LOR Request
            description: Guidance for requesting a letter of recommendation.
            url: /outreach/lor
            icon: hero/document-text

          - title: Templates
            description: Reusable templates, formats, and lab resources.
            url: /outreach/templates
            icon: hero/squares-2x2

          - title: Unicode Scientific Symbols
            description: Scientific typing help for Greek letters, symbols, subscripts, and superscripts.
            url: /outreach/scientific-typing
            icon: hero/calculator

          - title: Graphics
            description: Logos, visual assets, and graphic work prepared for academic and institutional use.
            url: /outreach/graphics
            icon: hero/photo

      blog:
        heading: Blog
        heading_url: /outreach/blog
        subheading: ""
        icon: hero/pencil-square
        folder: /outreach/blog
        limit: 4
        feature_first: false
        feature_all: false
        read_more_text: Read more
        all_posts_url: /outreach/blog
        all_posts_text: View all blog posts

      column_3:
        heading: Activities
        subheading: >
          Activities beyond academic work.
        icon: hero/sparkles
        buttons:
          - title: Professional Activities
            description: Current and past service, leadership, and professional engagement.
            url: /outreach/professional
            icon: hero/briefcase

          - title: Hobbies
            description: Personal interests and related pages.
            url: /outreach/hobbies
            icon: hero/heart

          - title: Poems
            description: A collection of poems written by me.
            url: /outreach/poetry
            icon: hero/book-open

          - title: Songs
            description: Songs composed by me, including AI-assisted creative work.
            url: /outreach/songs
            icon: hero/musical-note
      bottom_ctas:
        - title: View All Resources
          url: /outreach/
          icon: hero/academic-cap
          show_arrow: true

        - title: Visit the Blog
          url: /outreach/blog
          icon: hero/pencil-square
          show_arrow: true

        - title: Explore Activities
          url: /outreach/professional
          icon: hero/sparkles
          show_arrow: true
    design:
      columns: "1"

---