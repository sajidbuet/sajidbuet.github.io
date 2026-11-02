---
title: MAVILERA
summary: Browser-based interactive laboratory for exploring computer and microprocessor architecture; the first module is a RISC-V simulator with datapath animation.
description: MAVILERA (Microprocessor Architecture Visualization, Interactive Learning, Execution, and Runtime Analysis) is an open-source, architecture-neutral educational platform whose simulators run entirely in the browser. Its RISC-V Laboratory is available now.

date: 2026-11-02
lastmod: 2026-11-02

project_category: software
status: active
featured: true

license: Apache-2.0

technologies:
  - JavaScript
  - RISC-V
  - HTML

project_links:
  live: https://sajidlab.org/mavilera/
  repository: https://github.com/sajidbuet/mavilera

collaborators:
  - me

# Sourced only from the repository README and LICENSE. MAVILERA is described
# there as a provisional name pending legal clearance, not a registered
# trademark. Only the RISC-V Laboratory is built; other modules are planned.
---

## Motivation

Computer architecture is hard to teach from static diagrams. Students need to
step through programs and watch instructions move through a datapath, without
installing toolchains or uploading their work anywhere.

## What it does

MAVILERA is an open-source educational platform for interactive exploration of
computer and microprocessor architecture. Every simulator runs entirely in the
browser; no program or data is uploaded.

The **RISC-V Laboratory** is the available module. It includes an assembler and
disassembler for RV32I + M, an instruction-level simulator with stepping,
breakpoints and watchpoints, a teaching-subset C compiler, and animated
single-cycle, multicycle and five-stage pipelined processors with hazard
handling and CPI comparison. It also provides 21 teaching templates, waveforms
and an exercise mode.

## Status

Only the RISC-V Laboratory is built. SAP-1, SAP-2, MOS 6502, Intel 8086, Armv7
and MIPS modules are planned, not built. The project name is provisional and
MAVILERA is independent of RISC-V International, Arm, Intel and any other
owner of an architecture name.
