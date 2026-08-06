# HANDOFF — Computer B (2026-07-29)

**You are Computer B.** Author the terms in `ComputerB_terms.csv` following `AUTHORING_GUIDE_shared.md` (read it first). You and Computer C cover **different subjects** — do not touch C's areas.

## Your scope: PRODUCTION, CRAFT & ARCHIVAL — 1,966 terms
Research stays inside these subjects, so you and C never research the same area.

| Subject | Terms | Topics (landing_topic) |
|---|---:|---|
| Film/TV Post & Dialogue | 871 | Film Scoring · Dubbing & Localization · Dubbing — Adaptation, Sync & Deliverables · Dialogue Editing · ADR & Looping · Re-Recording & Final Mix |
| Archival & Analog Tape | 606 | Audio Restoration & Archival · Analog Tape / Tape Machines · Magnetic Tape Preservation & Conservation · Archival Preservation & Obsolete Media |
| Recording & Mix Craft | 489 | Instrument & Close Miking Techniques · Stereo & Ensemble Miking Techniques · Dynamics Processing · Reverb & Delay |

## Workflow (see AUTHORING_GUIDE_shared.md for the full committee spec)
1. **Pass 1 — Graduate-Student Author** drafts all 8 fields for every term.
2. **Pass 2 — 4-member committee + corrections + readability gate.** Independent review of every term by the **Audio Technical**, **Learning/Cognition**, **Language/Communications**, and **Legal Researcher** experts; aggregate → editor corrections → Flesch-Kincaid gate. Work in **topic-coherent batches of ~250 terms cut at topic boundaries**, ~35-term review groups.
3. Hand back the four review files, corrected merge payload, difficulty report, legal-citations report, and completion notes. Corrected output goes to **Machine A** for DB ingest — never the authored-only draft.

## Key reminders
- **No verbatim copying.** Independent wording; cite controlling source.
- **Source priority:** professional orgs/companies → academia/research → popular sites → forums → Wikipedia.
- **plain_english** at 14-yo level (FK grade ≤ 9). No placeholders.
- Keep the `landing_topic` from the CSV; batch by it. Flag un-sourceable/safety/uncertain terms for Booth.
- Existing-vs-new topic note: some of your topics already exist in the live glossary (e.g., Film Scoring, Dialogue Editing, Analog Tape / Tape Machines, Dynamics Processing) and some are new (e.g., Magnetic Tape Preservation & Conservation, Archival Preservation & Obsolete Media, Dubbing — Adaptation, Sync & Deliverables). Machine A creates any new topic rows at ingest — you just author to the assigned `landing_topic`.
