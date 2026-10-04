# 02 — Content and Readability

Line numbers refer to `cv/dsmc-cv.tex` as of 2026-10-04.

## 1. Structure and length: CV or dossier?

The document is currently two things at once:

- **A CV** — profile, appointments, education, supervision, publications, memberships.
- **Parts of a promotion application** — "Research Initiative" (about 1 page, `:124–132`) and "Teaching Plan" (about 1.7 pages, `:134–158`) are narrative statements. Phrases such as "discussed in the Teaching Plan below" (`:129`) and "Teaching plan as a professor involves…" (`:137`) only make sense in an application. So do the commented-out headings "Details of Publications since last appointment" (`:160`) and "Details of Important design/research projects from 20/05/2024 to 21/05/2025" (`:166`).

The narrative costs pages 2–4 of a 10-page document and pushes the publications (your strongest evidence) to page 5.

**Suggestion:** keep one source but produce two outputs (mechanism in doc 03 §9):

| Build | Contents | Length |
|---|---|---|
| `cv` (default, for the website and general use) | Everything in doc 01 §10; research and teaching condensed to bullets | About 4 pages + publications |
| `dossier` (promotion, awards, grants) | The same, plus the full Research and Teaching statements as written now | As now |

## 2. Voice and tone

The narrative switches person and voice, sometimes within one paragraph:

| Line | Text | Voice |
|---|---|---|
| `:42` | "Dr. Sajid Muhaimin Choudhury is a Professor…" | Third person |
| `:127–131` | "Research is expanded…", "is actively pursued", "is actively studied" | Impersonal passive |
| `:128` | "Own MSc research produced…" / "central to **his** research vision" | Fragment / third person |
| `:139` | "Led a significant overhaul…" | Verb-led, no subject |
| `:153` | "**Dr. Choudhury** redesigned…", "under Dr. Choudhury's instruction" | Third person by name |
| `:154` | "have consistently developed and taught…" | First-person verb, no subject |
| `:155` | "Going forward, **he** plans…" | Third person |

**Suggestion:** inside the CV, use verb-led fragments with no pronoun ("Redesigned…", "Introduced…", "Supervised…"). This is the standard CV register and the shortest. Keep the third-person biography only for the 3–4 line profile at the top. In the dossier build, pick one person (third, given the current biography) and use it throughout.

Hedged or promotional phrasing in a CV costs credibility and space. Prefer the concrete fact:

| Now | Suggested |
|---|---|
| "Commitment to this field is further evidenced by…" (`:129`) | State the course and year: "Introduced EEE 6002 Quantum Computing and Quantum Photonics (2024)." |
| "demonstrated academic leadership in curriculum innovation" (`:155`) | Delete. The list of new courses demonstrates it. |
| "The success of this approach is evident in improved student engagement…" (`:153`) | Keep only verifiable outcomes: "Model adopted by the department for most compulsory sessional courses." |
| "spanning a broad spectrum of cutting-edge areas" (`:125`) | "Spanning photonics, quantum computing, antennas, embedded systems and renewable energy." |

## 3. Condensed research and teaching (the `cv` build)

These are illustrations built only from facts already in the CV and its publication list. Wording is for you to adjust.

**Research interests** (replaces `:124–132`):

> Q-PACERS — Quantum, Photonic, Antenna, Computing, Embedded and Renewable-energy Systems.
>
> - **Nanophotonics and plasmonics** — plasmonic resonators and metasurfaces for sensing and modulation; dual-band NIR/MIR absorber for biochemical sensing [J23].
> - **Metasurfaces and antennas** — fractal (hexaflake) microstrip antennas; electrically reconfigurable metalens for the 2 µm band [J22].
> - **Quantum computing and quantum photonics** — loss-tolerant one-way quantum repeaters [J29, X3].
> - **Embedded systems and IoT** — sensor-driven embedded platforms for monitoring and healthcare.
> - **Renewable energy** — light trapping in heterojunction solar cells [J24]; photocatalytic water splitting.

Citing your own J-numbers turns each research area into a pointer to evidence in the same document.

**Teaching and curriculum development** (replaces `:134–158`):

> - **EEE 415/416 Microprocessors and Embedded Systems** — moved the syllabus from Intel 8086 to ARM Cortex-M and Verilog-based design; restructured the lab into guided experiments plus an open-ended design project, a model later adopted for most compulsory sessional courses.
> - **Embedded Systems Laboratory modernisation** (lab-in-charge) — BDT 62.42 lakh; 17 workstations with STM32 Nucleo and Digilent Nexys A7 FPGA boards; approved by the University Syndicate, Jan 2022.
> - **New postgraduate courses** — EEE 6408 Nano Systems; EEE 6505 Nanophotonics and Plasmonics; EEE 6002 Quantum Computing and Quantum Photonics (special topics, 2024); EEE 6516 Quantum Computing (3.0 credit hours, approved by the Academic Council).

The full EEE 6516 syllabus (`:157`, about 9 lines) and the lab budget breakdown (`:151`) belong in the dossier build only.

## 4. Missing or weak sections

Include only those you have content for; these are the sections reviewers of a professor's CV usually look for.

| Section | Notes |
|---|---|
| **Research grants and funded projects** | Absent from the CV, but the website lists three in `content/research/funding/`: *Design and Low-cost Fabrication of Optical Biosensors for Virus Detection* (2021, BDT 1,00,000); *Structurally Tunable Gear-Shaped Plasmonic Sensor* (2023, BDT 7,00,000); *Synergizing Deep Learning and Topology Optimization for Tunable Meta-lens Design* (2024, BDT 14,00,000). Give role (PI/Co-PI), funder and period. |
| **Awards and honours** | None listed. Membership of the National Young Academy of Bangladesh is under Memberships and could be presented as an honour. |
| **Postgraduate supervision — ongoing** | Only completed theses are listed (7). The lab roster (`_pythonscripts/all-members.xlsx`) shows 7 current MSc students and 1 PhD student. List "Ongoing" separately with expected completion. |
| **Courses taught** | Only *developed* courses appear. A compact list of courses regularly taught (UG/PG) is standard. |
| **Professional service** | Reviewing, technical programme committees, editorial roles, departmental committees: none listed. The IEEE and Optica leadership roles are currently under "Memberships", which undersells them. Retitle as "Professional Service and Leadership". |
| **Invited talks / keynotes** | None listed. |
| **References** | "Available upon request" (`:268–270`) adds a heading for no information. Remove it, or list 3 referees in the dossier build. |
| **H.S.C. / S.S.C.** | Optional for a full professor. If kept, one line each, with no GPA bullets. |

## 5. Postgraduate supervision list

Now (`:171–179`): student name, then degree and month, then the **title in bold**. The capitalisation of titles is inconsistent ("Design **Of** Silicon-carbide…", "…Metasurface **For** Metalensing **At** Near Infrared Waveband" versus sentence-style elsewhere).

Suggested:
- **Name first, regular weight; title in italic** (the title is the longest element, so bold makes the list heavy).
- Consistent title case, as the theses were submitted.
- Graduation month and year in the left date column, matching the §1 grid in doc 01.
- Link each thesis to its paper where one exists. The CV already contains them, e.g. Puja Das → X2, Ayon Sarker → J23, Soikot Sarkar → J24, Md. Asif Hossain Bhuiyan → J22, Md. Ehsanul Karim → J18/J21. Please verify these pairings; they are matched by topic, not by a stated link.
- Split into "Completed" and "Ongoing" (§4).

## 6. Corrections

| Line | Now | Fix |
|---|---|---|
| 90, 99 | Engine**e**ing | Engineering |
| 149 | avaiable | available |
| 151 | availabilty | availability |
| 129 | `Bangladesh\'s` (prints "Bangladeshś") | `Bangladesh's` |
| 147 | STM32 Nucleo-**F4446** | Check the part number; ST's naming for the Cortex-M4 board is usually *Nucleo-F446RE*. |
| 145 | "(ratio 1 : 2 students)" | "(one workstation per two students)" |
| 151 | "…civil and electrical works 14%)" | Unbalanced parenthesis |
| 178 | "Shamima Akter Mitu M.Sc. Engg." | Add a comma after the name |
| 175 | "Md Asif Hossain Bhuiyan" | "Md." for consistency with the other names |
| 227 | "Vice -Chair" | "Vice-Chair" |
| 241 | "Member, The Optica" | "Member, Optica" (the society dropped "The" when it renamed from OSA) |
| 243–245 | Dates without parentheses | Match the IEEE block format, or move all dates to the date column |
| 250 | "(AAAB)	}" | Stray tab and space inside the bold group; renders "(AAAB) ," |
| 83 | PHD THESIS TITLE IN CAPITALS | Title case, italic |
| 48 vs 54 | "July 2025 – to date" vs "July 2022 – July 2025" | "Jul 2025 – present" |
| 88 | "Aug 2011 – 2013" | Add a month to the end date |
| 3 | `cvauthor={…}` class option | Has no effect (doc 03 §1) |

## 7. Data mismatches with the website (verify, don't assume)

`data/authors/me.yaml` drives the website's profile page. It disagrees with the CV in several places. One of the two is wrong in each row; I can't tell which.

| Item | CV (`dsmc-cv.tex`) | Website (`data/authors/me.yaml`) |
|---|---|---|
| Assistant Professor | Jun 2013 – Jul 2022 | 2019-01-01 – 2019-12-31 |
| Associate Professor start | Jul 2022 | 2022-06-21 |
| M.Sc. | Aug 2011 – 2013 | ends 2011-11-11 |
| B.Sc. | Dec 2004 – Aug 2010 | ends 2009-11-11 |
| Lecturer roles (2009–2013) | Listed | Not listed |

The website dates ending in `-11-11` look like placeholders. Keeping both documents in one data file would remove this class of error (doc 03 §6).
