# HANDOFF — Computer C (2026-07-29)

**You are Computer C.** Author the terms in `ComputerC_terms.csv` following `AUTHORING_GUIDE_shared.md` (read it first). You and Computer B cover **different subjects** — do not touch B's areas.

## Your scope: SCIENCE, STANDARDS, TRANSDUCERS & CONCEPTS — 3,290 terms
Research stays inside these subjects, so you and B never research the same area.

| Subject | Terms | Topics (landing_topic) |
|---|---:|---|
| Transducer Engineering (Mics & Loudspeakers) | 756 | Microphones · Microphone Types & Transducers · Loudspeaker / Transducer Engineering · Loudspeaker Types & Drivers · Loudspeaker Enclosures, Horns & Radiation |
| Foundational & Educational Concepts | 670 | Foundations — Sound, Waveform, Level & Phase · Digital Audio — Sampling, Quantization & Formats · Signal Processing Concepts (Filters, Dynamics, FX & Noise) · Psychoacoustics · Recording, Mixing & Troubleshooting Concepts |
| Standards | 654 | Standards — General Acoustics & Signal Terms · Standards — Coding, Systems, Metadata & Transport · Standards — Immersive/Object/Scene, MIR, ML & Loudness · Standards — Psychoacoustics, Hearing & Audiology · Standards — Room, Building, Environmental & Measurement |
| Acoustics & Physics Science | 566 | Sound & Acoustics · Advanced & Physical Acoustics (Nonlinear/Structural/Aero/Materials) · Room Acoustics · Ultrasonics, Underwater & Spatial-Audio Science |
| Electronics, DSP & Measurement | 499 | Measurement Fundamentals & Metering · Signal Analysis & Test Equipment · Audio Electrical, Networking & Systems Concepts |
| Surveillance & Forensic Audio | 145 | Surveillance, Forensic & Covert Audio |

## Workflow (see AUTHORING_GUIDE_shared.md for the full committee spec)
1. **Pass 1 — Graduate-Student Author** drafts all 8 fields for every term.
2. **Pass 2 — 4-member committee + corrections + readability gate.** Independent review of every term by the **Audio Technical**, **Learning/Cognition**, **Language/Communications**, and **Legal Researcher** experts; aggregate → editor corrections → Flesch-Kincaid gate. Work in **topic-coherent batches of ~250 terms cut at topic boundaries**, ~35-term review groups. (Your Standards-heavy set makes the Legal Researcher's copyright + mark-flagging jobs especially important.)
3. Hand back the four review files, corrected merge payload, difficulty report, legal-citations report, and completion notes. Corrected output goes to **Machine A** for DB ingest — never the authored-only draft.

## Key reminders
- **No verbatim copying** — critical here: your set is heavy with copyrighted standards (IEC/ISO/ANSI/AES/ITU-R/MPEG/IEEE/JASA). Write every definition independently; **cite the controlling standard** in the source field.
- **Source priority:** professional orgs/companies → academia/research → popular sites → forums → Wikipedia. Your Standards + Science subjects should lean heavily on Tier 1–2.
- **plain_english** at 14-yo level (FK grade ≤ 9) even for deep science terms. No placeholders.
- Equation-bearing terms: fill `formula_symbolic` + `formula_words`.
- Keep the `landing_topic` from the CSV; batch by it. Flag un-sourceable/safety/uncertain terms for Booth.
- Existing-vs-new topic note: some topics already exist (e.g., Microphones, Loudspeaker / Transducer Engineering, Psychoacoustics, Measurement Fundamentals & Metering, Sound & Acoustics, Room Acoustics, Signal Analysis & Test Equipment) and many are new (the five Standards topics, Advanced & Physical Acoustics, Ultrasonics…, the Foundational/Concept topics, Surveillance…). Machine A creates any new topic rows at ingest — you just author to the assigned `landing_topic`.
