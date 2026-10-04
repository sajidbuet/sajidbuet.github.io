---
aliases:
  - /outreach/blog/
title: "Writing & Tutorials"

# Listing view
list_heading: "All articles"
view: card-noimage

summary: "Long-form technical and academic articles — tooling workflows, automation scripts, and practical guides."
# Optional banner image (relative to `assets/media/` folder).
banner:
  caption: ''
  image: ''
description: "Technical writing and step-by-step tutorials on Markdown and vector figures, Overleaf revision workflows, Microsoft Teams administration, Excel formulas, and citation tracking."
weight: 30

# Every ARTICLE in this section renders with layouts/blogpost/single.html —
# the two-column reading layout with the "On this page" rail.
#
# `_target.kind: page` is what keeps it to the articles. Without it the type
# would also land on this branch page and the listing would lose its own
# template, and it must not spread to the rest of /resources/ either: the
# academic, personal, professional and templates sections keep the generic
# layouts/single.html.
#
# Setting the type here rather than in each post means existing articles needed
# no front-matter change, and new ones need none either.
cascade:
  - _target:
      kind: page
    type: blogpost
---
