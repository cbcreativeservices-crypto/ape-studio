# HANDOFF — Computer B · SOUND LAW / NOISE REGULATION & COMPLIANCE (2026-08-02)

**You are Computer B.** Author the **208 net-new terms** in `ComputerB_terms_NOISELAW.csv`, then run the full committee review. These are new glossary rows (INSERT). Machine A is the sole DB writer and creates the topic rows / assigns `achievement_id` at ingest.

`source_batch` for this wave: `NOISELAW_2026_08_02`.

New subject: **Sound Law, Noise Regulation & Compliance** (a dedicated branch — deliberately separate from ordinary "acoustics" because it serves international/touring work). 5 landing topics (already set in the CSV).

---

## 1. Your input CSV — columns

| column | meaning |
|---|---|
| `term` | headword — **frozen** |
| `subject` | `Sound Law, Noise Regulation & Compliance` — frozen |
| `landing_topic` | one of the 5 sub-topics below — **frozen**, batch by it |
| `concept_hint` | a **one-line disambiguation pointer** carried from the source research list, telling you *which* concept the headword means. **DO NOT copy or paraphrase it** — author every field originally. It only disambiguates the term. |
| `status` | `NEW` |
| `source_batch` | `NOISELAW_2026_08_02` |

Scope by landing topic: Legal & Regulatory Framework 41 · Measurement Descriptors & Compliance Metrics 37 · Live Events & Entertainment Compliance 30 · Assessment, Mapping & Mitigation 69 · Standards, Laws & Instruments 31. **Total 208.**

---

## 2. The 8-field contract (every term)

`definition · plain_english · purpose_function · practical_application · category · related_terms[] · common_mistakes[] · scenario_contexts[]`. List fields are JSON arrays. Add `formula_symbolic` + `formula_words` for the metric terms that carry a formula (e.g. Lden weighting, exchange-rate/dose math, dB(C)−dB(A)). `category` = the `landing_topic` (or a short sub-label consistent with it). `difficulty` ∈ {beginner, intermediate, advanced}, lowercase.

---

## 3. Workflow — standard established formula

1. **Pass 1 — Graduate-Student Author:** draft all 8 fields for every term, batched by `landing_topic`.
2. **Pass 2 — 4-member committee + corrections + readability gate:** independent review by **Audio Technical**, **Learning/Cognition**, **Language/Communications**, and **Legal Researcher** experts → aggregate → editor corrections (changed fields only, web-verified) → **Flesch-Kincaid gate** (`plain_english` grade ≤ 9, ≤ 20-word sentences). Topic-coherent batches (~150–200 terms, ~35-term review groups). The **Legal Researcher lens is central this wave** (see §4).
3. **Hand back to Machine A:** the four review files, the **corrected merge payload** (never the authored-only draft), a difficulty-recommendation report (advisory), a legal-citations report, and completion notes.

---

## 4. Rules — general + LAW-SPECIFIC (read carefully)

**Educational, not legal advice.** These entries teach professionals what a term *means* and how it is used — they are **not legal advice**. Every definition must make clear, where relevant, that **exact limits vary by country, city, venue license, permit, time of day, receiver location, and measurement method.**

- **Never present a specific number as a universal law.** When you cite a figure (e.g. 85 dB(A), 87 dB ELV, 55 dB Lden, 140 dB(C) peak), **attribute it to the specific standard/jurisdiction** it comes from (OSHA, NIOSH, EU 2003/10/EC, WHO, ISO 1996, a named country). Prefer "for example, under X…" phrasing over "the limit is…".
- **No verbatim copying — critical here.** This set references copyrighted standards and legal instruments (OSHA/ANSI, EU directives, ISO 1996 / 12913, IEC 61672 / 60942, BS 4142, DIN 15905-5, AS/NZS 1269, national codes). **Write every definition independently and cite the controlling standard/instrument** in your sources — never paste or closely paraphrase standard/legal text.
- **Neutrality on enforcement/surveillance-adjacent items.** Keep definitions factual and compliance-oriented; no operational how-to for evading limits or defeating limiters.
- **plain_english at a 14-year-old level.** No placeholders, no "TBD", no boilerplate.
- **Source priority:** standards bodies / regulators (ISO, IEC, OSHA, NIOSH, EU, WHO, national authorities) → academia/research → reputable industry sources → forums → Wikipedia. This branch should lean Tier 1.
- **Safety:** prefix the specific mistake with `UNSAFE:` where a term touches hearing damage or hazardous exposure (peak SPL, pyrotechnic/impulse noise, dose, exchange rate, hearing-protection derating). Flag any uncertain/unsourceable term for Booth — do not guess.
- Keep `term` / `landing_topic` frozen; do not merge citations into field text.

---

## 5. Deliverable → Machine A (INSERT)

Return the corrected merge payload keyed so Machine A can INSERT each term under its `landing_topic` (Machine A creates the 5 new topic rows and assigns `achievement_id`). Keep `source_batch = NOISELAW_2026_08_02`. Do not write to the database.

Note for Machine A / Booth: one near-duplicate to resolve at ingest — **"Peak sound pressure level"** vs. the existing glossary term **"Peak sound pressure"** (likely same concept, fuller name). Also, the 5 landing topics are provisional sub-topics of the new branch; final topic consolidation is Booth's call at ingest.
