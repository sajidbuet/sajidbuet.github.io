---
title: EEE 6516 (October 2026)
placing: 20
icon: book
date: '2026-10-01T00:00:00Z'
publishDate: '2026-10-01T00:00:00Z'
course_type: Postgraduate
summary: Quantum Computing
show_date: false
authors: []
tags: []
featured: false
---

> [!IMPORTANT]+ First class will be held online
> The first class of EEE 6516 (Week 1, Lecture 0: an introduction to quantum computing and the course) will be held **online on Zoom**.
>
> **Zoom link:** <https://bdren.zoom.us/j/5689856083?omn=93714118132>

> Handout for Week 02 is now uploaded.

> **Course announcements:** For the latest announcements, materials and submissions, please use the class Team in your **Microsoft Teams** account. If you have not been added to the class Team, please e-mail the course instructor.

In 2025 the Nobel Prize in Physics was awarded for showing that an *electrical circuit* (a superconducting chip with a Josephson junction) can behave as a single quantum object, with quantised energy levels and quantum tunnelling. Circuits of this kind are the ancestors of today's superconducting qubits. Quantum computing is therefore not only a subject for physicists. Its hardest problems are electrical-engineering problems: microwave control and readout, cryogenic electronics, photonics, signal processing, coding theory and the security of communication systems.

This course builds quantum computing from what an EEE graduate already knows: linear algebra, phasors, signals, probability and digital logic. **No background in quantum mechanics is assumed.** Every idea is also tested in simulation, using free, open-source software that runs on your own laptop.

## Course Information

| | |
|---|---|
| **Course** | EEE 6516 – Quantum Computing (postgraduate) |
| **Instructor** | Dr. Sajid Muhaimin Choudhury, Professor, Department of EEE, BUET (SAJID Lab) |
| **Office** | EEE 222, ECE Building, BUET |
| **E-mail** | sajid@eee.buet.ac.bd |
| **Classes** | Tuesdays, two lectures of 75 minutes. Week 1 has one introductory class (online, see above); Week 7 has no lectures (midterm-assignment week); Week 13 is for final-project presentations |
| **Communication** | Microsoft Teams (materials, announcements, submissions, messages) |

## Syllabus

### Course Content

Introduction to quantum computing; Postulates of quantum mechanics; Qubits and single-qubit gates; Operators and quantum measurement; Quantum information processing, superposition, entanglement, no cloning theorem, and quantum teleportation; Quantum circuits, controlled operation and measurement, universal quantum gates; Quantum algorithms: Deutsch-Jozsa algorithm, Grover's algorithm, Shor's algorithm, quantum Fourier transform and phase estimation; Density matrices and Bloch sphere representation of quantum variables; Quantum error correction and fault-tolerant architecture; Physical realization of quantum computers: harmonic oscillator, optical quantum computers, trapped ions, superconducting qubits, and new implementation schemes.

### Prerequisites

- Python, linear algebra and probability at the level of a BSc in EEE.
- **No quantum mechanics is assumed.** Chapter 1 builds the mathematical toolkit (complex vectors, Dirac notation, operators and eigenvalues).

## Course Outcomes (CO)

After completing this course, students will be able to:

| CO No. | CO Statement | Domain and Taxonomy Level | Delivery Method(s) | Assessment Tool(s) |
|---|---|---|---|---|
| CO1 | **Apply** the postulates of quantum mechanics and the linear algebra of qubits to compute states, gate actions, measurement probabilities and expectation values of single- and multi-qubit systems, including entangled and mixed states | C3: Cognitive / Apply | Lectures, handouts, worked examples, in-class activities | Class tests, term final |
| CO2 | **Analyse** quantum algorithms (Deutsch–Jozsa, Bernstein–Vazirani, Grover, QFT, phase estimation, Shor), error-correcting codes and physical qubit platforms, and **evaluate** their resource costs and limitations against classical baselines and noise | C4: Cognitive / Analyse; C5: Cognitive / Evaluate | Lectures, handouts, simulations | Class tests, term final, midterm assignment |
| CO3 | **Implement, simulate and verify** multi-qubit circuits and quantum dynamics with open-source simulators, including noise, interpret the results statistically, and **communicate** a reproducible simulation study | P4: Psychomotor / Mechanism; C6: Cognitive / Create (report) | Simulation exercises, live demonstrations, project supervision | Midterm assignment, final project (report, code, presentation) |

## Weekly Plan

Classes are on Tuesdays. Class tests are held outside lecture time.

| Week | Lectures | Topics |
|---|---|---|
| 1 | 0 | Introduction to quantum computing and to the course **(online)** [Slides](EEE6516-Lecture-00-CourseInfo.pdf)|
| 2 | 1–2 | Chapter 1: why quantum computing; complex vectors, Dirac notation, operators, eigenvalues [Handout](EEE6516-chapter01.pdf)|
| 3 | 3–4 | Chapter 2: states and measurement; single-qubit gates, Bloch sphere |
| 4 | 5–6 | Chapter 2: dynamics, observables, shot noise · Chapter 3: composite systems, two-qubit gates |
| 5 | 7–8 | Chapter 3: circuit model, universality; Qiskit, Cirq, PennyLane · Chapter 4: entanglement |
| 6 | 9–10 | Chapter 4: teleportation, superdense coding, CHSH · Chapter 5: oracles, Deutsch–Jozsa |
| 7 | — | No lectures: midterm-assignment week |
| 8 | 11–12 | Chapter 5: Grover search · Chapter 6: quantum Fourier transform |
| 9 | 13–14 | Chapter 6: phase estimation; order finding and Shor's algorithm |
| 10 | 15–16 | Chapter 7: density matrices; quantum channels and noise |
| 11 | 17–18 | Chapter 8: error correction; stabilisers, surface code, fault tolerance |
| 12 | 19–20 | Chapter 9: superconducting qubits; trapped ions, photons, neutral atoms |
| 13 | — | Final-project presentations |

## Assessment

### Grading Policy

| Component | Weight | Notes |
|---|---|---|
| Class tests | 15% | Three tests, 5% each, held outside lecture time |
| Midterm assignment | 25% | Individual simulation study with a personal parameter set |
| Final project | 30% | Groups of 2–3: reproduce and extend a published result by simulation; report, code and a 12-minute presentation |
| Term final | 30% | As per the published routine |

### Assessment Milestones

| Week | Milestone |
|---|---|
| 5 | CT1 (Chapters 1–2) |
| 6 | Midterm assignment released |
| 7 | Midterm assignment due (end of the week) |
| 8 | Final-project groups and paper proposal due |
| 9 | CT2 (Chapters 3–5) |
| 11 | CT3 (Chapters 6–7); final-project progress check |
| 12 | Final-project report and code due |
| 13 | Final-project presentations (12 minutes + Q&A) |

### Midterm Assignment and Final Project

Both are **simulation projects**.

- **Midterm assignment (individual).** You implement a circuit or protocol from Chapters 2–5, predict its behaviour analytically, simulate it, and study one non-ideal effect such as noise. Each student receives a personal set of parameters.
- **Final project (groups of 2–3).** Your group chooses a peer-reviewed paper whose central circuit or simulation fits on a laptop, either from the curated list or with the instructor's approval at the proposal stage. You then:
  1. **reproduce** one key figure or table;
  2. **extend** it in one direction, for example noise level, problem size, a different simulator or error mitigation;
  3. **verify** the results with analytic checks, fixed random seeds and stated tolerances.

  Your code must regenerate every figure from a single command. Report templates (LaTeX, Overleaf-compatible) are provided on Teams.

### Late Submission

- Up to 2 days late: 10% penalty.
- More than 2 days late: 25% penalty.

## Policies

### Incomplete Grade Policy

An I grade is given **only** if you have completed the midterm assignment and the final project (report and presentation), and miss the term final for reasons beyond your control. Apply to the Head of the Department of EEE within one week of the start of the final examinations. If you missed the assignment or the final project, you cannot receive an I grade, and you will be graded according to the grading policy. If you are unsure whether you can continue, please withdraw from the course.

### Make-up Class Test Policy

A make-up class test is given only to students who missed a class test for circumstances beyond their control. It must be taken before the end of classes of the semester.

### Academic Integrity and Generative AI

- Plagiarism in a report or in code results in zero for that assessment. Reused code must be cited, including the paper's own code if it is published. Copying another student's or group's code or results is plagiarism.
- **Generative AI: limited use.** The analytic predictions, the design of your verification tests and the interpretation of your results must be your own work. Help with coding, debugging or language is allowed, but you must declare it in your report.
- You must be able to explain every line of your code and every number in your report in the Q&A. Marks for a part can be withheld if you cannot explain it.

## Textbooks and Resources

### Course Materials

- Chapter handouts and lecture slides for EEE 6516 (primary; on Teams).

### Textbook

- M. A. Nielsen and I. L. Chuang, *Quantum Computation and Quantum Information*, 10th anniversary edition, Cambridge University Press, 2010.

### Further Reading

- R. LaPierre, *Introduction to Quantum Computing*, Springer, 2021.
- L. Susskind and A. Friedman, *Quantum Mechanics: The Theoretical Minimum*, Basic Books, 2014.
- R. de Wolf, *Quantum Computing: Lecture Notes*, [arXiv:1907.09415](https://arxiv.org/abs/1907.09415).

### Software

All simulations run **locally on your own laptop**. No cloud account, token or paid service is needed.

| Software | Version used in the course | Use |
|---|---|---|
| [NumPy](https://numpy.org/) | — | First step: states and gates as arrays |
| [Qiskit](https://pypi.org/project/qiskit/) + [Qiskit Aer](https://pypi.org/project/qiskit-aer/) | 2.5.2 / 0.17.2 | Circuits, algorithms, noise models |
| [QuTiP](https://pypi.org/project/qutip/) | 5.3.1 | Density matrices, dynamics, hardware models |
| [Cirq](https://pypi.org/project/cirq-core/) | 1.7.0 | Alternative circuit simulator (from Lecture 7) |
| [PennyLane](https://pypi.org/project/pennylane/) | 0.45.1 | Alternative circuit simulator (from Lecture 7) |
| [Stim](https://pypi.org/project/stim/) | 1.16.0 | Error-correction (stabiliser) simulation |

Please install the course environment before Lecture 1, following Section 1.10 of the Chapter 1 handout.

## Why Should an EEE Graduate Student Take This Course?

- **It is electrical engineering.** A superconducting quantum computer is a microwave transmitter and receiver around a chip cooled to about 10–20 mK. Trapped-ion and neutral-atom machines are built from lasers, optics and detectors. Error correction combines coding theory with real-time decoding, and Shor's algorithm has driven the move to new post-quantum cryptography standards (NIST FIPS 203, 204 and 205, published in August 2024).
- **EE and ECE departments teach it.** For example:
  - MIT 6.6410J *Quantum Computation*;
  - Cornell ECE 5330 *Quantum Physics and Engineering*;
  - Stony Brook ESE 512 *Introduction to Quantum Systems Engineering*;
  - Purdue's ECE *Quantum Computing* series.
- **It builds on the skills you have and adds new ones.** You bring linear algebra, phasors, probability, digital logic, electromagnetics and Python. The course adds qubit calculations, the analysis of algorithms and hardware against classical baselines, and reproducible simulation. These open thesis directions in quantum devices, cryogenic microwave electronics, photonics, control and post-quantum security.

---
*Course content follows the approved BUET syllabus for EEE 6516. Week-by-week topics may be adjusted during the term; announcements on Teams take precedence over this page.*
