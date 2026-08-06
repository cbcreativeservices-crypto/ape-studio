# Computer B — Authoring Handoff: Sub-90 Grow Wave (Perception/Hearing cluster)
_2026-08-01 · from Machine A (DB/backend, sole DB writer) · project yjgolswjggmlpeowvtxr_

## ⚠️ COPYRIGHT / ORIGINALITY RULE — READ FIRST (STANDING)
**Standards- and paper-sourced terms get INDEPENDENTLY-WRITTEN definitions plus a citation of the controlling standard/source. NEVER copy or closely paraphrase** dictionaries, encyclopedias (incl. Wikipedia), textbooks, standards documents (IEC/ISO/AES/ANSI), manufacturer docs, or other glossaries. Facts, spec values, and the headword itself are not copyrightable — the *expression* must be ours. This batch is heavy with standards/clinical/academic sources (IEC 60268-16, ISO 12913 soundscape, clinical audiology, psychoacoustics literature), so this rule is especially load-bearing here.

## Scope
**265 net-new terms** to author across the **four perception/hearing topics** we deliberately kept (they are legitimate, distinct, and underpin the new Hearing Science & Audiology, Acoustics & Psychoacoustics Research, and DSP/AI programs). Goal: lift each topic well past the 90-term floor.

Your term list: **`ComputerB_terms.csv`** (columns: term, subject, landing_topic, landing_gs, achievement_id, status, source_batch, related_parent_xref, framing_note). **Keep the `landing_topic`/`landing_gs` — do not re-topic.** Return authored + committee-reviewed output to **Machine A**; you never write to the DB.

| landing_gs | Topic | Terms to author |
|---|---|---|
| 1430 | Hearing Disorders & Health | 48 |
| 1450 | Spatial Hearing & Localization | 51 |
| 1460 | Speech Intelligibility | 67 |
| 1470 | Loudness & Listening Environments | 99 |
| | **Total** | **265** |

These 265 are already **deduped against the live 17,391-term glossary** (see `SUB90_TERM_DEDUP_2026_08_01.csv`). Verbatim duplicates were removed before this handoff. Do not re-author anything not in your CSV.

## Workflow (per `AUTHORING_GUIDE_shared.md`, included)
1. **PASS 1 — Graduate-student author**: draft all 8 fields per term (definition · plain_english [FK ≤ grade 9, sentences ≤ 20 words] · purpose_function · practical_application · category=landing_topic · related_terms[] · common_mistakes[] · scenario_contexts[]; set difficulty; equation terms fill formula_symbolic + formula_words). No placeholders / no "TBD".
2. **PASS 2 — 4-member committee** (Audio Technical · Learning/Cognition · Language/Communications · Legal Researcher w/ copyright + mark-flagging), then apply corrections, then the **programmatic Flesch-Kincaid readability gate** (grade ≤ 9). Committee is defined in full in `AUTHORING_GUIDE_shared.md`.
3. **PASS 3** (questions + scenarios): later, on go-ahead only.

## Cross-references (6 terms)
These are net-new but sit next to an existing parent already in the glossary. Author them as distinct entries and add the parent to `related_terms` (do NOT merge):
- Fear hyperacusis → related: **Hyperacusis**
- Near-field interaural level difference → related: **Interaural Level Difference**
- Apparent signal-to-noise ratio → related: **Signal-to-noise ratio**
- Auditory masking correction → related: **Auditory Masking**
- Speech privacy index → related: **Speech Privacy**
- Modulation transfer function → related: **Transfer function**

## Contested-terminology framing (flag, don't state as settled)
A few entries are contested or historical in the clinical/research literature. Author them with explicit **"proposed / historical / not a settled unitary diagnosis"** framing, and add each to the Flagged-Terms register: **King–Kopetzky syndrome, Obscure auditory dysfunction, Tonic tensor tympani syndrome, Hidden hearing loss** (as a research label, not a diagnosis), **Pitch-shifted tinnitus, Residual excitation**. (Marked in the CSV `framing_note` column.)

## Suggested authoring order (highest-value obscure terms first)
1. **Hearing Disorders:** noxacusis, cochlear dead region, off-frequency listening, auditory neuropathy spectrum disorder, diplacusis binauralis, third-window syndrome, auditory deprivation effect, binaural interference, tone decay, pure word deafness.
2. **Spatial Hearing:** binaural sluggishness, time–intensity trading, Clifton effect, precedence buildup, proximity-image effect, auditory parallax, better-ear glimpsing, binaural diffuseness, localization compression, pinna-cue remapping.
3. **Speech Intelligibility:** modulation transfer index, apparent SNR, redundancy correction, glimpse proportion, informational masking, diagnostic rhyme test, matrix sentence test, band-importance function, speech privacy index, Lombard slope.
4. **Loudness & Listening Environments:** specific loudness, partial loudness, loudness enhancement, softness imperception, induced loudness reduction, binaural inhibition, acoustic horizon, sonotope, changing-state effect, psychoacoustic annoyance.

## Return
Deliver authored + committee-reviewed CSV back to Machine A (drop in `AUDIO APP/`). Machine A applies as INSERTs to `glossary` with the given `achievement_id`, then verifies term counts per topic clear 90.
