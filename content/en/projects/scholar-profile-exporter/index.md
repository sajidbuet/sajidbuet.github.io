---
title: Scholar Profile Exporter
summary: Userscript that exports a Google Scholar profile to a Publish-or-Perish-style CSV, so citation counts can feed an automated publication list.
description: A TamperMonkey userscript that runs on a Google Scholar profile page and exports citation data as a Publish-or-Perish-style CSV plus BibTeX links, for scripted CV and publication-list updates.

date: 2026-01-24
lastmod: 2026-01-24

project_category: research-software
status: active
featured: true

technologies:
  - JavaScript
  - TamperMonkey

project_links:
  repository: https://github.com/sajidbuet/scholar-profile-exporter

collaborators:
  - me

related_research:
  - computing

# Sourced from the author's own write-up:
# /outreach/blog/20260124-citation-count/ and the repository description
# ("Scholar Profile Exporter (CSV + BibTeX Link)"). No claims beyond those.
---

## Motivation

Keeping per-article citation counts in a CV or publication list is tedious to do
by hand. The Publish or Perish desktop tool used to fill that role, but Google
Scholar increasingly requires a signed-in session or a CAPTCHA, which that
tool does not handle.

## What it does

The script runs as a TamperMonkey userscript on top of a loaded Google Scholar
profile page — so it works within an ordinary signed-in browser session — and
exports the profile in a Publish-or-Perish-style CSV, together with BibTeX
links. That CSV is the input format an existing set of scripts already expects,
so the downstream publication-list and BibTeX update workflow is unchanged.

## Status

Active. Source is on GitHub; it requires the TamperMonkey browser extension.
