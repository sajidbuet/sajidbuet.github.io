---
# Leave the homepage title empty to use the site title
title:
date: 2022-10-24
type: landing

sections:
  - block: hero
    content:
      title: |
         
      image:
        filename: Q-PACER.svg
      text: |
        <br>

        **Q-PACERS** or the   **Q**uantum-, **P**hotonic-, **A**ntenna-, **C**omputing-, **E**mbedded- , and **R**enewable-energy **S**ystems Research Group  is a hub of innovation in electronics and photonics research at the Department of EEE, BUET, Bangladesh. Founded and led by [Dr. Sajid Muhaimin Choudhury](author/dsmc), the group leverages expertise in both experimental and computational tools to tackle cutting-edge research challenges.
        


  - block: markdown
    content:
      title: Our Mission
      subtitle: 
      text: Our mission is to advance knowledge in nanophotonics, embedded systems, and quantum computing, and to develop practical technological solutions for society. We aim to solve fundamental and high-impact research questions in photonics and quantum computation while training the next generation of engineers and scientists.
    design:
      # See Page Builder docs for all section customization options.
      # Choose how many columns the section has. Valid values: '1' or '2'.
      columns: '1'  
  - block: collection
    content:
      title: Latest News
      subtitle:
      text:
      count: 3
      filters:
        author: ''
        category: ''
        exclude_featured: false
        publication_type: ''
        tag: ''
      offset: 0
      order: desc
      page_type: news
    design:
      view: card
      columns: '1'


  - block: collection
    content:
      title: Latest Papers
      text: ""
      count: 3
      filters:
        folders:
          - publication
    design:
      view: citation
      columns: '1'
  - block: people-admin
    content:
      title: Principle Investigator
      # Choose which groups/teams of users to display.
      #   Edit `user_groups` in each user's profile to add them to one or more of these groups.
      user_groups:
          - Principal Investigator
      sort_ascending: true
    design:
      show_interests: true
      show_role: true
      show_social: true

  - block: markdown
    content:
      title:
      subtitle:
      text: |
        {{% cta cta_link="./people/" cta_text="Meet the team →" %}}
    design:
      columns: '1'
---
