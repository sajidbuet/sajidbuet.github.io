---
weight: 10
placing: 21
icon: 'book'
course_type: 'Postgraduate'
show_date: false
authors: []
tags: ['quantum computing', 'EEE 6516']
featured: false
title: 'EEE 6516 Quantum Computing'
summary: 'EEE 6516 Quantum Computing (Postgraduate).'
description: 'Public course materials for EEE 6516 Quantum Computing: course overview, lecture plan, lecture slides and a sample chapter by Sajid Muhaimin Choudhury (SAJID Lab).'
date: '2026-10-15T00:00:00Z'
publishDate: '2026-10-15T00:00:00Z'
---

Public teaching materials for the postgraduate course **EEE 6516 Quantum Computing**. Lecture slides are published lecture by lecture once every image in them is cleared for public distribution.

## Course information

| | |
|---|---|
| **Course** | EEE 6516 Quantum Computing (EEE 6516) |
| **Level** | Postgraduate |
| **Credit hours** | Two lectures of 75 minutes per week (20 lectures plus an introductory class) |
| **Instructor** | Sajid Muhaimin Choudhury |

## Course description

This course builds quantum computing from what an EEE graduate already knows: linear algebra, phasors, signals, probability and digital logic. No background in quantum mechanics is assumed. Every idea is also tested in simulation, using free, open-source software that runs on your own laptop. Course content: introduction to quantum computing; postulates of quantum mechanics; qubits and single-qubit gates; operators and quantum measurement; quantum information processing, superposition, entanglement, the no-cloning theorem and quantum teleportation; quantum circuits, controlled operations and measurement, universal quantum gates; quantum algorithms (Deutsch–Jozsa, Grover, Shor, the quantum Fourier transform and phase estimation); density matrices and the Bloch-sphere representation; quantum error correction and fault-tolerant architecture; physical realisation of quantum computers.

## Prerequisites

- Python, linear algebra and probability at the level of a BSc in EEE.
- No quantum mechanics is assumed. Chapter 1 builds the mathematical toolkit (complex vectors, Dirac notation, operators and eigenvalues).

## Learning outcomes

- **CO1** Apply the postulates of quantum mechanics and the linear algebra of qubits to compute states, gate actions, measurement probabilities and expectation values of single- and multi-qubit systems, including entangled and mixed states.
- **CO2** Analyse quantum algorithms (Deutsch–Jozsa, Bernstein–Vazirani, Grover, QFT, phase estimation, Shor), error-correcting codes and physical qubit platforms, and evaluate their resource costs and limitations against classical baselines and noise.
- **CO3** Implement, simulate and verify multi-qubit circuits and quantum dynamics with open-source simulators, including noise, interpret the results statistically, and communicate a reproducible simulation study.

## Major subject areas

- Why quantum computing; the mathematical toolkit
- Postulates and the single qubit
- Multiple qubits and quantum circuits
- Entanglement and quantum information
- Query algorithms and Grover search
- Quantum Fourier transform, phase estimation and Shor's algorithm
- Density matrices and noise
- Quantum error correction and fault tolerance
- Physical realisations

## Textbooks and references

- Chapter handouts written by the instructor are the primary course material.

## Software

- Python with NumPy, Qiskit and Qiskit Aer, and QuTiP; Cirq and PennyLane are shown as alternatives. All free, open-source and run locally.

## Assessment

- Class tests: 15 % (three tests, 5 % each, outside lecture time)
- Midterm assignment: 25 % (individual simulation study)
- Final project: 30 % (groups of 2–3; reproduce and extend a published result by simulation)
- Term final: 30 %

## Lecture plan

Twenty lectures of 75 minutes in nine chapters, two lectures per week, after an introductory class in Week 1. Week 7 is a midterm-assignment week and Week 13 is for final-project presentations.

Download: [EEE 6516 Quantum Computing lecture plan (PDF)](EEE6516-Lecture-Plan.pdf)

| Week | Unit | Title | Topics | Outcomes | Labs | Readings | Public slides |
|---|---|---|---|---|---|---|---|
| 1 | L00 | Introduction to quantum computing and to the course | Introduction to quantum computing and to the course (course page, Weekly Plan) (published) | Not stated | — | Not stated | [Slides (PDF)](EEE6516-Lecture-00.pdf) |
| 2 | L01 | Why quantum computing | Why quantum computing: bits vs qubits, landscape, course and toolchain | Not stated | — | Chapter 1 handout | [Slides (PDF)](EEE6516-Lecture-01.pdf) |
| 2 | L02 | Complex vector spaces for engineers | Complex vector spaces for engineers: Dirac notation, operators, eigenvalues | Not stated | — | Chapter 1 handout | [Slides (PDF)](EEE6516-Lecture-02.pdf) |
| 3 | L03 | Postulates I | Postulates I: states, superposition, the Born rule, measurement | Not stated | — | Chapter 2 handout | [Slides (PDF)](EEE6516-Lecture-03.pdf) |
| 3 | L04 | Single-qubit gates and the Bloch sphere; evolution under a Hamiltonian | Single-qubit gates and the Bloch sphere; evolution under a Hamiltonian | Not stated | — | Chapter 2 handout | [Slides (PDF)](EEE6516-Lecture-04.pdf) |
| 4 | L05 | Observables, expectation values, measurement bases; sampling and shot noise | Observables, expectation values, measurement bases; sampling and shot noise | Not stated | — | Chapter 2 handout | [Slides (PDF)](EEE6516-Lecture-05.pdf) |
| 4 | L06 | Composite systems | Composite systems: tensor products, ordering conventions, two-qubit gates | Not stated | — | Chapter 3 handout | [Slides (PDF)](EEE6516-Lecture-06.pdf) |
| 5 | L07 | The circuit model | The circuit model: measurement, universality, reversible logic, transpilation; the same circuit in Qiskit, Cirq and PennyLane | Not stated | — | Chapter 3 handout | [Slides (PDF)](EEE6516-Lecture-07.pdf) |
| 5 | L08 | Entanglement | Entanglement: Bell states, no-cloning, Bell measurement | Not stated | — | Chapter 4 handout | [Slides (PDF)](EEE6516-Lecture-08.pdf) |
| 6 | L09 | Teleportation, superdense coding and the CHSH inequality | Teleportation, superdense coding and the CHSH inequality | Not stated | — | Chapter 4 handout | [Slides (PDF)](EEE6516-Lecture-09.pdf) |
| 6 | L10 | Oracles and phase kickback | Oracles and phase kickback: Deutsch, Deutsch–Jozsa, Bernstein–Vazirani | Not stated | — | Chapter 5 handout | [Slides (PDF)](EEE6516-Lecture-10.pdf) |
| 8 | L11 | Grover search and amplitude amplification | Grover search and amplitude amplification | Not stated | — | Chapter 5 handout | [Slides (PDF)](EEE6516-Lecture-11.pdf) |
| 8 | L12 | The quantum Fourier transform | The quantum Fourier transform | Not stated | — | Chapter 6 handout | [Slides (PDF)](EEE6516-Lecture-12.pdf) |
| 9 | L13 | Quantum phase estimation | Quantum phase estimation | Not stated | — | Chapter 6 handout | [Slides (PDF)](EEE6516-Lecture-13.pdf) |
| 9 | L14 | Order finding and Shor's algorithm | Order finding and Shor's algorithm | Not stated | — | Chapter 6 handout | [Slides (PDF)](EEE6516-Lecture-14.pdf) |
| 10 | L15 | Density matrices, partial trace, the Bloch ball | Density matrices, partial trace, the Bloch ball | Not stated | — | Chapter 7 handout | [Slides (PDF)](EEE6516-Lecture-15.pdf) |
| 10 | L16 | Quantum channels and noise; T1/T2; noisy simulation | Quantum channels and noise; T1/T2; noisy simulation | Not stated | — | Chapter 7 handout | [Slides (PDF)](EEE6516-Lecture-16.pdf) |
| 11 | L17 | Error correction | Error correction: repetition codes, syndromes, the Shor code | Not stated | — | Chapter 8 handout | [Slides (PDF)](EEE6516-Lecture-17.pdf) |
| 11 | L18 | Stabilisers, the surface code and fault tolerance | Stabilisers, the surface code and fault tolerance | Not stated | — | Chapter 8 handout | [Slides (PDF)](EEE6516-Lecture-18.pdf) |
| 12 | L19 | Superconducting qubits from the harmonic oscillator | Superconducting qubits from the harmonic oscillator | Not stated | — | Chapter 9 handout | — |
| 12 | L20 | Trapped ions, photons, neutral atoms and spins; comparing platforms | Trapped ions, photons, neutral atoms and spins; comparing platforms | Not stated | — | Chapter 9 handout | — |

*Slides are published lecture by lecture after copyright clearance; the plan may be adjusted during the term.*


## Rights and reuse

Copyright (c) 2026 Sajid Muhaimin Choudhury. All rights reserved.

Third-party figures are reproduced only where their licence or a permission allows public distribution; each is credited where it appears. Figures without cleared rights are not reproduced and are cited with a link to their source instead.

*Release qc-2026-10-15, prepared 2026-10-15.*
