---
title: Team
cms_exclude: true
type: landing

description: "The people of SAJID Lab at BUET EEE — the principal investigator, PhD, MSc and undergraduate researchers working on photonics, quantum computing and embedded systems, and the group's alumni."

# Phase 5: /people/ was a byte-for-byte duplicate of this page apart from one
# subtitle line. It is removed and preserved as an alias so existing links and
# any search indexing keep resolving here, which is the canonical Team page.
# The `authors` taxonomy is deliberately NOT renamed to `team` (IA §16) —
# renaming the taxonomy key would churn every author URL for a cosmetic gain.
aliases:
  - /people/

# View.
#   1 = List
#   2 = Compact
#   3 = Card
#   4 = Citation
view: 3

# Optional banner image (relative to `assets/media/` folder).
banner:
  caption: ''
  image: ''

sections:
  # Phase 5: this block exists so the page has exactly one <h1>. `type: landing`
  # never renders `.Content`, which is why the old body copy — including its
  # `# Meet Our Research Team` heading — was silently dropped and the page
  # shipped with zero headings (visual-audit P1-11).
  - block: markdown
    id: intro
    content:
      text: |-
        # Team {#team-intro}

        SAJID Lab brings together undergraduate, MSc and PhD researchers at the
        Department of EEE, BUET. The group works across photonics, quantum
        computing, antenna and RF design, embedded systems and renewable energy,
        combining device modelling and simulation with hands-on hardware work.
    design:
      spacing:
        padding: ["3rem", 0, "1rem", 0]

  - block: team-showcase-admin
    id: team
    content:
      title: Meet Our Team
      subtitle: 'Principal Investigator'
      text: ''
      user_groups:
        - Principal Investigator
      sort_by: 'Params.last_name'
      sort_ascending: true
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
  - block: team-showcase
    id: members
    content:
      title:
      subtitle: ''
      text: ''
      user_groups:
        - PhD Students
        - MSc Students
        - Undergrad Students
      sort_by: 'Params.last_name'
      sort_ascending: true
      cta:
        text: View Group Alumni
        url: /authors/alumni
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
---
