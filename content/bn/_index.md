---
# Leave the homepage title empty to use the site title
title: ''
date: 2022-10-24
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
         আমরা **S**mart & **A**dvanced **J**unctions of **I**ntelligent **D**evices (SAJID) ধারণার অধীনে **কোয়ান্টাম**, **ফোটোনিক্স**, **অ্যান্টেনা**, **কম্পিউটিং ও কৃত্রিম বুদ্ধিমত্তা**, **এম্বেডেড সিস্টেম**, এবং **নবায়নযোগ্য শক্তি** বিষয়ক গবেষণা পরিচালনা করি। হাতে-কলমে উদ্ভাবন ও সমন্বিত গবেষণার মাধ্যমে আমরা উন্নত প্রযুক্তি উন্নয়ন এবং নতুন প্রজন্মের গবেষক ও প্রকৌশলী তৈরিতে প্রতিশ্রুতিবদ্ধ। এই গবেষণা কার্যক্রম পরিচালিত হচ্ছে বুয়েটের তড়িৎ ও ইলেকট্রনিক প্রকৌশল (EEE) বিভাগের ড. সাজিদ মুহাইমিন চৌধুরীর নেতৃত্বে।
      primary_action:
        text:  আমাদের টিম
        url: '#team'
        icon: hero/user-group
      secondary_action:
        text:  প্রকাশনা দেখুন
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
          description: পিয়ার-রিভিউড প্রকাশনা
          sub_metric: ফোটোনিক্স, ন্যানোপ্রযুক্তি ও এম্বেডেড সিস্টেম বিষয়ক জার্নাল ও আন্তর্জাতিক সম্মেলন
          icon: hero/document-text

        - statistic: "1298+"
          description: একাডেমিক উদ্ধৃতি
          sub_metric: "h-index: 13 (Google Scholar)"
          icon: hero/chart-bar

        - statistic: "7"
          description: তত্ত্বাবধানে সম্পন্ন এমএসসি গবেষণা
          sub_metric: ফোটোনিক্স, মেটাসারফেস, কোয়ান্টাম ডিভাইস ও শক্তি ব্যবস্থা
          icon: hero/user-group

        - statistic: "6"
          description: মূল গবেষণা ক্ষেত্র
          sub_metric: কোয়ান্টাম, ফোটোনিক্স, অ্যান্টেনা, কম্পিউটিং, এম্বেডেড সিস্টেম, নবায়নযোগ্য শক্তি (Q-PACERS)
          icon: hero/beaker
    design:
      layout: cards
      # Section background color (CSS class)
      css_class: "bg-gradient-to-b from-primary-50 to-white dark:from-primary-900/20 dark:to-gray-800"
      spacing:
        padding: ["3rem", 0, "3rem", 0]

  - block: research-areas
    id: research
    content:
      title: গবেষণার প্রধান ক্ষেত্রসমূহ
      subtitle: 
      text: Q-PACERS কাঠামোর অধীনে আমাদের গবেষণা কার্যক্রম সংগঠিত, যেখানে কোয়ান্টাম, ফোটোনিক, অ্যান্টেনা, কম্পিউটিং, এম্বেডেড এবং নবায়নযোগ্য শক্তি ব্যবস্থাকে সমন্বিত করে বুদ্ধিমান ডিভাইস ও উন্নত তড়িৎচৌম্বকীয় সিস্টেমের ভবিষ্যৎ চ্যালেঞ্জ মোকাবিলা করা হয়।

      items:
        - name: কোয়ান্টাম কম্পিউটিং ও কোয়ান্টাম ফোটোনিক্স
          description: কোয়ান্টাম তথ্য প্রক্রিয়াকরণ, ফোটোনিক কিউবিট এবং কোয়ান্টাম ডিভাইস আর্কিটেকচার নিয়ে গবেষণা, যেখানে অ্যালগরিদম-হার্ডওয়্যার সহ-নকশা এবং উদীয়মান কোয়ান্টাম ফোটোনিক প্ল্যাটফর্মে বিশেষ গুরুত্ব দেওয়া হয়।
          icon: hero/quantum
          gradient: from-indigo-400 to-purple-600
          status: active
          topics:
            - Photonic Qubits
            - Quantum Error Correction
            - Optical Quantum Systems
          cta:
            text: বিস্তারিত দেখুন
            url: /bn/research/quantum

        - name: ফোটোনিক্স ও ন্যানোফোটোনিক্স
          description: ন্যানোস্কেল ফোটোনিক উপাদান ও ডিভাইস নকশা, যেমন প্লাজমোনিক স্ট্রাকচার, মেটাসারফেস এবং অপটিক্যাল মডুলেটর, যা সেন্সিং, যোগাযোগ এবং আলো–পদার্থ পারস্পরিক ক্রিয়া নিয়ন্ত্রণে ব্যবহৃত হয়।
          icon: hero/photonics
          gradient: from-blue-400 to-cyan-600
          status: active
          topics:
            - Metasurfaces
            - Optical Modulators
            - Optical Sensing
          cta:
            text: বিস্তারিত দেখুন
            url: /bn/research/photonics

        - name: অ্যান্টেনা ও তড়িৎচৌম্বকীয় সিস্টেম
          description: উন্নত অ্যান্টেনা সিস্টেম এবং প্রকৌশলকৃত তড়িৎচৌম্বকীয় গঠন উন্নয়ন, যার মধ্যে ফ্র্যাক্টাল অ্যান্টেনা ও রিকনফিগারেবল মেটাসারফেস অন্তর্ভুক্ত।
          icon: hero/antenna
          gradient: from-green-400 to-emerald-600
          status: active
          topics:
            - Fractal Antennas
            - Electromagnetic Modeling
            - Wireless Systems
          cta:
            text: বিস্তারিত দেখুন
            url: /bn/research/antenna

        - name: ফিজিক্যাল সিস্টেমের জন্য কম্পিউটিং ও AI
          description: মেশিন লার্নিং, অপ্টিমাইজেশন এবং গণনামূলক পদ্ধতি ব্যবহার করে ফিজিক্যাল সিস্টেম ডিজাইন, যেমন AI-সহায়িত ফোটোনিক ডিজাইন ও physics-informed computation।
          icon: hero/computing
          gradient: from-purple-400 to-pink-600
          status: active
          topics:
            - AI for Photonics
            - Computer Architecture
            - Optimization Algorithms
          cta:
            text: বিস্তারিত দেখুন
            url: /bn/research/computing

        - name: এম্বেডেড সিস্টেম ও IoT
          description: বাস্তব প্রয়োগের জন্য এম্বেডেড প্ল্যাটফর্ম ও বুদ্ধিমান সেন্সিং সিস্টেম উন্নয়ন, বিশেষ করে পরিবেশ পর্যবেক্ষণ ও স্বাস্থ্যসেবা ক্ষেত্রে IoT-নির্ভর ডিভাইস।
          icon: hero/embedded
          gradient: from-yellow-400 to-orange-600
          status: active
          topics:
            - Embedded Systems Design
            - Edge Computing
            - Hardware Prototyping
          cta:
            text: বিস্তারিত দেখুন
            url: /bn/research/embedded

        - name: নবায়নযোগ্য শক্তি ও টেকসই সিস্টেম
          description: ন্যানোফোটোনিক্স ব্যবহার করে সৌর কোষ ও শক্তি ব্যবস্থার উন্নয়ন, শক্তি দক্ষতা বৃদ্ধি এবং টেকসই প্রযুক্তি উদ্ভাবনে গবেষণা।
          icon: hero/renewable
          gradient: from-amber-400 to-red-500
          status: active
          topics:
            - Photovoltaics
            - Energy Harvesting
            - Photocatalysis
          cta:
            text: বিস্তারিত দেখুন
            url: /bn/research/renewable

      cta:
        text: সকল গবেষণা কার্যক্রম
        url: /bn/research
        icon: hero/arrow-right
    design:
      layout: cards
      css_class: "bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800"
      spacing:
        padding: ["5rem", 0, "5rem", 0]

  - block: cta-card
    id: projects
    content:
      title: গবেষণা অনুদান
      text: আমাদের চলমান ও সম্পন্ন গবেষণা অনুদানসমূহ দেখতে নিচের লিংকে ক্লিক করুন।
      button:
        text: সকল গবেষণা অনুদান দেখুন
        url: /projects/
    design:
      card:
        css_class: 'bg-primary-300 dark:bg-primary-700'
        css_style: ''


  - block: team-showcase
    id: team
    content:
      title: আমাদের গবেষণা দল
      subtitle: ''
      text: ''
      user_groups:
        - Principal Investigator
      sort_by: 'Params.last_name'
      sort_ascending: true
      cta:
        text: সকল সদস্য দেখুন
        url: /bn/authors
        icon: user-group

  - block: collection
    id: publication
    content:
      title: সাম্প্রতিক প্রকাশনা
      text: ''
      filters:
        folders:
          - publication
        exclude_featured: false
      count: 5
    design:
      view: citation
  - block: cta-button-list
    content:
      buttons:
        - text: সকল প্রকাশনা দেখুন
          url: /publication/
          icon: academicons/google-scholar      

  - block: cta-card
    id: teaching
    content:
      title: পাঠদান
      text: কোর্সসমূহ
      button:
        text: সকল কোর্সের তালিকা দেখুন
        url: /teaching/
    design:
      card:
        css_class: 'bg-primary-300 dark:bg-primary-700'
        css_style: ''

  - block: collection
    id: news
    content:
      title: Lab News & Updates
      subtitle: ''
      text: ''
      # Page type to display. E.g. post, talk, publication...
      page_type: blog
      # Choose how many pages you would like to display (0 = all pages)
      count: 3
      # Filter on criteria
      filters:
        author: ''
        category: ''
        tag: ''
        exclude_featured: false
        exclude_future: false
        exclude_past: false
        publication_type: ''
      # Choose how many pages you would like to offset by
      offset: 0
      # Page order: descending (desc) or ascending (asc) date.
      order: desc
    design:
      # Choose a layout view
      view: card
      columns: 1

  - block: logos
    content:
      title: Collaborators & Partners
      subtitle: Leading the way together
      text: We work with top universities, research institutes, and industry leaders to advance scientific discovery
      logos:
        - name: MIT
          image: partners/placeholder-logo.svg
          url: https://mit.edu
          external: true
          description: Massachusetts Institute of Technology
        - name: Stanford University
          image: partners/placeholder-logo.svg
          url: https://stanford.edu
          external: true
          description: Stanford Research Collaboration
        - name: Google Research
          image: partners/placeholder-logo.svg
          url: https://research.google
          external: true
          description: AI & Machine Learning Partnership
        - name: National Science Foundation
          image: partners/placeholder-logo.svg
          url: https://nsf.gov
          external: true
          description: Research Funding Partner
        - name: Microsoft Research
          image: partners/placeholder-logo.svg
          url: https://www.microsoft.com/research
          external: true
          description: Computing Research Collaboration
        - name: NIH
          image: partners/placeholder-logo.svg
          url: https://nih.gov
          external: true
          description: National Institutes of Health
      cta:
        text: Become a Partner
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
      title: যোগাযোগ
      subtitle: গবেষণা সহযোগিতা, একাডেমিক যোগাযোগ ও শিক্ষার্থী তত্ত্বাবধান বিষয়ে যোগাযোগ করুন
      visit_title: অফিসে আসুন
      connect_title: অনলাইনে সংযুক্ত থাকুন
      address:
        lines:
          - ড. সাজিদ মুহাইমিন চৌধুরী
          - সহযোগী অধ্যাপক
          - তড়িৎ ও ইলেকট্রনিক প্রকৌশল বিভাগ (EEE)
          - বাংলাদেশ প্রকৌশল বিশ্ববিদ্যালয় (বুয়েট)
          - ইইই ২২২, ইসিই ভবন
          - বুয়েট, ঢাকেশ্বরী রোড
          - ঢাকা ১২০৫, বাংলাদেশ
      directions:
        - পালাশী দিক দিয়ে ইসিই ভবনে প্রবেশ করুন
        - সিঁড়ি দিয়ে ২য় তলায় উঠুন
        - অফিস: কক্ষ ২২২
      office_hours:
        - "শনিবার: সকাল ৯:০০টা - বিকাল ৪:০০টা"
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
        title: সম্ভাব্য শিক্ষার্থী ও গবেষণা-সহযোগীদের জন্য
        text: গবেষণা, তত্ত্বাবধান, যৌথ প্রকল্প বা একাডেমিক সহযোগিতা বিষয়ে আগ্রহী শিক্ষার্থী, গবেষক ও সহকর্মীদের যোগাযোগের জন্য স্বাগত জানানো হচ্ছে।
        button:
          text: ইমেইল করুন
          url: mailto:sajid@eee.buet.ac.bd
      map_url: https://maps.google.com/?q=EEE+222+ECE+Building+BUET+Dhakeshwari+Road+Dhaka+1205+Bangladesh
      show_form: false
    design:
      css_class: "bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800"
      spacing:
        padding: ["5rem", 0, "5rem", 0]

  - block: cta-card
    id: outreach
    content:
      title: আউটরিচ
      text: বিভিন্ন চিন্তাধারা ও উপকারী টুলসমূহের সংগ্রহ
      button:
        text: এখানে ক্লিক করুন
        url: /outreach
    design:
      card:
        # Card background color (CSS class)
        css_class: 'bg-primary-300 dark:bg-primary-700'
        css_style: ''
---