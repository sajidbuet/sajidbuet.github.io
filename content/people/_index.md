---
title: People
date: 2022-10-24

type: landing

sections:
  - block: people-admin
    content:
      title: Meet the Team
      # Choose which groups/teams of users to display.
      #   Edit `user_groups` in each user's profile to add them to one or more of these groups.
      user_groups:
          - Principal Investigator
      sort_by: Params.last_name
      sort_ascending: true
    design:
      show_interests: true
      show_role: true
      show_social: true
      show_organizations: true
  - block: people
    content:
      title: 
      # Choose which groups/teams of users to display.
      #   Edit `user_groups` in each user's profile to add them to one or more of these groups.
      user_groups:
          - Researchers
          - PhD Students
          - MSc Students
          - Undergrad Students
          - UG Students
          - Administration
          - Visitors
      sort_by: Params.last_name
      sort_ascending: true
    design:
      show_interests: false
      show_role: false
      show_social: false
      show_thesis: false
  - block: markdown
    content:
      text: |
        <br> Click here to learn about <a href = "/people/alumni">group alumni</a>
  
---

Click Here to know about [Group Alumni](/people/alumni)