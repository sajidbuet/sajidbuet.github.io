---
title: Our Team
cms_exclude: true
type: landing

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
    id: team
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

# Meet Our Research Team

Our lab brings together talented researchers from diverse backgrounds, united by a shared passion for advancing science through computational methods. We foster a collaborative environment where innovation thrives and each team member contributes their unique expertise to our collective mission.

## Join Our Team

We are always looking for motivated individuals who share our passion for research. If you're interested in joining our lab, please check our [open positions](/opportunities) or contact us directly.

## All Team Members

<!-- Author names dynamically appear here -->
