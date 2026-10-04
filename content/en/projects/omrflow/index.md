---
title: OMRFlow
summary: Desktop software for designing OMR templates, processing scanned answer sheets, resolving uncertain marks and generating auditable results offline.
description: OMRFlow is open-source desktop software for optical mark recognition — template design, scan normalisation, batch processing, human review of uncertain reads, attendance reconciliation, scoring and report generation, run locally.

date: 2026-09-23
lastmod: 2026-09-23

project_category: software
status: alpha
featured: true

license: MIT

technologies:
  - Python
  - PySide6
  - OpenCV

project_links:
  repository: https://github.com/sajidbuet/OMRflow
  release: https://github.com/sajidbuet/OMRflow/releases

collaborators:
  - me

# Sourced only from the repository: its description ("Smart Mark Checker —
# Open-Source OMR Examination Processing"), README, LICENSE (MIT) and
# pyproject.toml (Python >= 3.12; PySide6, OpenCV, NumPy, pandas, openpyxl,
# SQLAlchemy, pydantic, Pillow, psutil). The installable release is
# 0.1.0-alpha.1 and the README states real-data qualification is incomplete,
# so `status: alpha` and the wording below stay inside what the repository
# actually claims. No maturity, adoption or reliability claim is made here
# that the repository does not make.
---

## Motivation

Marking multiple-choice examinations by hand is slow, and the commercial OMR
systems that automate it are closed, licence-bound and generally expect the
answer sheets to be uploaded somewhere. A department that wants to keep student
scripts on its own machines needs something it can run locally and inspect.

## What it does

OMRFlow covers the sequence end to end: a template designer defines the
registration markers and bubble grid for a sheet; scans are geometrically
normalised for rotation, translation, scale, skew and perspective; recognition
reports what it found, including blanks, multiple marks and uncertain reads
rather than silently guessing; batches are processed across multiple cores and
can resume after an interruption; a human resolves the uncertain cases, with an
audit trail of every correction; attendance is reconciled; per-set answer keys
are applied and verified; and reports are generated while preserving the custom
formatting of the destination workbook.

Processing is local. The software is MIT-licensed and the source is on GitHub.

## Status

**Alpha.** The current installable release is `0.1.0-alpha.1`, published for
evaluation and testing. The repository states that real-data qualification is
not complete and that generated results should be independently verified before
operational use. The repository is the place to check the current qualification
status before relying on it for an examination.
