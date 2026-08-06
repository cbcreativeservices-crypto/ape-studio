# AP&E Glossary Decision Log

**Status:** ACTIVE — persistent project memory. Consult before every batch.
**Established:** Batch 1 (alphabetical A-terms) · 2026-06-20
**Source master:** `APE_Glossary_FULLY_AUTHORED.xlsx` (1,203 term rows, 18 fields, 8 courses)

This log records the standards the committee adopts as it reviews. Standards are **proposed** when first set and become **locked** only on your final approval. Nothing here is immutable; later terms may reopen earlier decisions.

---

## 1. Definition Standards

| ID | Standard | Status |
|----|----------|--------|
| D-1 | **Two-tier definitions.** Concise Definition = 2–3 technical sentences. Plain-English = 4–5 accessible sentences with practical context. | Proposed |
| D-2 | **Zero boilerplate / zero TBD.** Every field comprehensive, accurate, industry-standard. (Inherited project rule.) | Locked |
| D-3 | **Plain-English length cap.** Where an entry's Plain-English exceeds ~5 sentences, tighten without losing accuracy (e.g. *Active ribbon microphone*). | Proposed |
| D-4 | **Technical precision over convenient simplification.** A simplification that becomes inaccurate is rejected (e.g. A-weighting does not "emphasize midrange"; it passes mid near-unity and attenuates the extremes). | Proposed |

## 2. Terminology Standards

| ID | Standard | Status |
|----|----------|--------|
| T-1 | **Acronym + expansion on first field.** Term and Concise Definition spell out acronyms once: "AAC (Advanced Audio Coding)." | Proposed |
| T-2 | **Acronym / full-name / cluster entries are allowed** (e.g. `ADC`, `A/D converter (ADC)`, `ADC / DAC`) but must cross-reference each other and not contradict. | Proposed |
| T-3 | **AES67 is an audio-over-IP interoperability standard** (RTP + PTP, uncompressed PCM), *not* "AES3 over IP." Do not conflate the transport with AES3. | Proposed |

## 3. Learning Standards

| ID | Standard | Status |
|----|----------|--------|
| L-1 | **Scenario Contexts** = 2–3 concrete, workplace-anchored situations (live, studio, post, career), not restatements of the definition. | Proposed |
| L-2 | **Common Mistakes** = real misconceptions a first-semester learner makes, phrased as the error to avoid. | Proposed |
| L-3 | **Difficulty** uses `beginner | intermediate | advanced`, calibrated to a first-year CTE learner. | Proposed |

## 4. Media Standards

| ID | Standard | Status |
|----|----------|--------|
| M-1 | **No blank Media field.** Every term carries a recommendation even if no asset exists yet (protocol requirement). | Locked |
| M-2 | **Format:** `type: short description`. Types: `image`, `diagram`, `illustration`, `infographic`, `animation`, `video`, `audio`, `interactive`. | Proposed |
| M-3 | **One asset per term** unless a comparison is essential. Prefer the single asset that most improves understanding/retention. | Proposed |
| M-4 | **Media notes must match their term.** Batch 1 found drift (ADSR, graphic-EQ, absorption-table, and ducking notes landed on wrong rows). Verify alignment every batch. | Locked |

## 5. Cross-Reference Standards

| ID | Standard | Status |
|----|----------|--------|
| X-1 | **No self-references.** A term must not list itself in Related Terms (fixed on 6 career terms in Batch 1). | Locked |
| X-2 | **Related Terms capitalization.** Capitalize the first character of each pipe-separated entry; preserve acronyms. Applied to revised terms; pending file-wide cleanup. | Proposed |
| X-3 | **Reciprocity for tight pairs.** Paired concepts should reference each other (e.g. *A-weighted (dBA)* ↔ *A-weighting*; added in Batch 1). | Proposed |

## 6. Category Taxonomy (OPEN — needs your approval)

The `Category` field is applied inconsistently across the file. The catch-all **"Audio Technology"** is used for unrelated concepts (e.g. *Absorption*, *A-weighting*). **Proposed rule:** Category should name a specific domain aligned to Topic, reserving generic catch-alls.

Batch-1 category fixes applied (clear errors only):

- *AES67*: "Sound Reinforcement" → **"Audio Networking"**
- *A-weighting*: "Audio Technology" → **"Sound Measurement"** (matches sibling *A-weighted (dBA)*)
- *Absorption*, *Absorption coefficient*: "Audio Technology" → **"Acoustics"**

**Pending decision:** whether to standardize the acoustics group into *acoustic-science phenomena* vs *acoustic-treatment devices* across the whole file. **Not yet applied** — awaiting your approval to avoid mass edits without sign-off.

## 7. Fields Not to Fabricate

| ID | Standard | Status |
|----|----------|--------|
| F-1 | **Weight %** is a course-blueprint metric. Where blank (~18 of the 50 A-terms; 299 file-wide), it will **not** be guessed. Flagged for the authoritative weighting source. | Locked |
| F-2 | **Status / Source / Notes** are helper columns slated for deletion before app import; safe to annotate for traceability. | Locked |

---

## Batch 2 Updates (terms 51–100) · 2026-06-20

Reviewed by the full 5-member committee (4 experts + Master Editor). Standards confirmed and extended:

- **X-1 (no self-references) — reaffirmed Locked.** 8 more removed; file-wide scan found **109** additional across terms 51–550 (systemic in MUSI108/205B career terms). Queued for cleanup during their batches or a single sweep on approval.
- **L-1 (Scenario Contexts) — strengthened.** Telegraphic noun-phrase scenarios are non-compliant; rewrite into concrete, picture-able workplace situations. 27 fixed in Batch 2.
- **M-4 (media-note alignment) — reaffirmed Locked.** 5 more copy-paste Media errors corrected; drift confirmed systemic across the file.
- **D-4 (precision over simplification) — applied.** Technical corrections: amplifier classes (Class B ≈ 78.5%), Asymmetrical clipping (even-order *added to* odd-order), all-pass filter (de-bloated).
- **New — Difficulty calibration:** near-twin terms must share Difficulty; recalibrated *Aliasing* and *ATSC 3.0* to intermediate. (Difficulty is editable; Category remains untouched per your instruction.)
- **Category:** confirmed **leave alone** per your decision — inconsistencies (e.g. *BPM*) are logged, not changed.

**Cumulative master after Batch 2:** `AP&E_Glossary_v7_Batch2_MASTER.xlsx` — 55 terms revised total (Batch 1: 15 + Batch 2: 40).

## Batch 3 & 4 Updates (terms 101–200) · 2026-06-20

Full 5-member committee on each batch. Outcomes:

- **Factual corrections (D-4 applied):** *C-weighting* (nearly flat ~31.5 Hz–8 kHz, not "mid-emphasis" — fixed the self-contradiction flagged back in Batch 2), *Capsule polarization voltage* (60–80 V internal, not the 48 V phantom supply), *Chorus Effect* (15–35 ms delay, no feedback), *Aux-fed subwoofer* (live-sound aux send, not home-theater bass management), plus *automatic mic mixer*, *Boundary microphone*, *Butterworth*.
- **X-1 (self-references):** 18 more removed (3 in B3, 15 in B4). Artifact confirmed concentrated in MUSI108/205B career terms.
- **M-4 (media drift):** 11 more copy-paste Media errors corrected; includes an authoring annotation "(ONE video for Mixers)" on *Bus* that must never ship to learners — **new rule M-5**.
- **M-5 (new, Locked):** Strip any internal authoring annotations (e.g. "(ONE video for X)") from Media before publication; replace with a real term-specific asset.
- **X-2 (xref canonicalization):** ~92 wrong-name Related-Terms entries mapped to canonical glossary spellings across the two batches; placeholder non-headword "refs" dropped; genuinely missing targets left flagged, not invented.
- **L-1 / new L-4:** *Practical Application* must teach a procedure ("do this"), not list applications ("X uses it, Y uses it"). Rewrote the Batch-4 calibration/capsule cluster accordingly. **L-4 (Proposed).**
- **Difficulty calibration:** Bidirectional Microphone, Bass trap, Broadcast Audio → intermediate (near-twin alignment / true skill level). Category still **left alone** per your standing instruction.

**Cumulative master after Batch 4:** `AP&E_Glossary_v8_Batch4_MASTER.xlsx` — **141 terms revised total** (B1 15 · B2 40 · B3 36 · B4 50). 200 of 1,203 terms reviewed (~17%).

## Batches 5–10 Updates (terms 201–500) · 2026-06-20

Full 5-member committee per batch (Batch 10 reviewed directly by the Master Editor after a subagent session limit). Outcomes:

- **Factual corrections (D-4):** *dB SPL* and *Decibel* both fixed (+3 dB doubles **power**, +6 dB doubles **pressure**); *DVD-Audio* (192 kHz stereo-only; 5.1 capped 24-bit/96 kHz); *Expander* (downward expansion attenuates **below**-threshold); *Fader* (linear-travel slider, **log/audio taper** law); *Externally polarized condenser* (60–80 V internal, not 48 V phantom); *critical band*, *Distortion measurements*, *Diaphragm directionality*.
- **X-1 (self-references):** ~66 more removed (B5 19 · B6 10 · B7 9 · B8 12 · B9 10 · B10 6). Reviewed range now 0 remaining.
- **M-4 / M-5 (media):** ~30 more copy-paste Media errors corrected and all internal "(ONE … for X)" annotations stripped. Reviewed range now 0 blank Media and 0 residual annotations.
- **L-1 / L-4:** continued conversion of telegraphic Scenario Contexts and "X uses it" Practical Application into concrete, procedural, workplace-anchored text.
- **New — Duplicate handling (X-4, Proposed):** the committee **flags** near-duplicate clusters and malformed rows (e.g. *DTS / DTS*, the *Expander* sentence-as-headword, the EQ/gain-staging/Grounding clusters) but does **not** merge or delete rows without your explicit approval. A consolidation policy is pending.
- **Category:** still **left alone** per your decision; miscategorizations logged only.
- **Weight %:** still not fabricated.

**Cumulative master after Batch 10:** `AP&E_Glossary_v9_Batch10_MASTER.xlsx` — **400 terms revised total** across Batches 1–10. **500 of 1,203 terms reviewed (~42%).** Remaining: terms 501–1,203 (Batches 11–24).

## Batches 11–17 Updates (terms 501–850) · 2026-06-20

Full 5-member committee on every batch (four independent expert subagents + Master Editor). Outcomes:

- **Factual corrections (D-4):** *LUFS* uses **K-weighting**, not A-weighting (ITU-R BS.1770) — the standout fix; *K-weighted (LUFS)* target ~−14; *Line Level* consumer = **−10 dBV** (not dBu); *Multipin tube mic cable* carries heater/B+ not phantom power; *Microphone preamp* = first gain stage; *Large-Diaphragm Microphone* example (KSM8 is dynamic) corrected; *phaser* cascaded all-pass; plus mic-sensitivity, mic output transformer, Mains-hum, M/S, MADI, piezo, plug-in-power precision fixes.
- **X-1 (self-references):** ~72 more removed; reviewed range (1–850) now 0 remaining.
- **M-4 / M-5 (media):** ~28 more copy-paste Media errors corrected; all "(ONE … for X)" annotations stripped. Reviewed range now 0 blank / 0 annotations.
- **New — Data-hygiene log (DH-1, Proposed):** malformed Term labels flagged but NOT auto-renamed (cross-refs depend on them): `"Line level (+4 dBu"`, `"low-pass,"`, `"ohm (W)"` (Ω mojibake), stray `"M&E; Track"`. Needs a Term-field cleanup pass on approval.
- **New — Coverage gap log (DH-2, Proposed):** referenced-but-undefined terms — the normalling vocabulary (*Normalled, Half-Normal, Non-Normalled, TT/Bantam*), *Mono compatibility*, *Anti-aliasing filter*, *Spectral leakage*. Candidates to ADD on approval.
- **X-4 (duplicates):** more clusters flagged, not merged (Precedence/Haas, Pot/Potentiometer, Noise Gate/Gate, Parametric EQ pair, Patch bay pair, etc.).
- **Category / Weight %:** unchanged per your standing instructions.

**Cumulative master after Batch 17:** `AP&E_Glossary_v10_Batch17_MASTER.xlsx` — **785 terms revised total** across Batches 1–17. **850 of 1,203 terms reviewed (~71%).** Remaining: terms 851–1,203 (Batches 18–24).

## Batches 18–21 Updates (terms 851–1050) · 2026-06-20

Full 5-member committee on every batch. Outcomes:

- **Factual corrections (D-4):** *Ribbon transformer* impedance/level (sub-ohm ribbon → mic-level ~200–600 Ω, not line level); *Microphone sensitivity* sign error (−44 dBV/Pa, always negative); *Single-diaphragm capsule* ribbon-mic confusion; *Ribbon motor* permanent magnets only; *Smaart LE* is paid not free; plus Reverberation, Smaart Suite/RT, loudspeaker-sensitivity, SPL precision fixes.
- **X-1 (self-references):** ~76 more removed (career-heavy batches); reviewed range (1–1,050) now 0 remaining.
- **M-4 / M-5 (media):** ~11 more copy-paste Media errors corrected; all annotations stripped. Reviewed range 100% clean.
- **DH-1 (data hygiene) extended:** accent-key mismatch — *Résumé* missed the automated merge (agents typed "Resume"); patched manually. Watch accented headwords. Ambiguous headwords flagged: *Reflection* (acoustic vs portfolio homonym), *Red* (red/brown noise).
- **DH-2 (coverage gap) extended:** *Transmission loss*, *Mass law*, *Helmholtz resonator* referenced but undefined — candidates to ADD.
- **X-4 (duplicates):** more clusters flagged, not merged (Q/Q Factor, Ribbon trio, RT60/Reverberation time, RTA/RTA view, Sample Rate/Sample Rates, Small-diaphragm pair, Smaart family).
- **Category / Weight %:** unchanged per your standing instructions.

**Cumulative master after Batch 21:** `AP&E_Glossary_v11_Batch21_MASTER.xlsx` — **985 terms revised total** across Batches 1–21. **1,050 of 1,203 terms reviewed (~87%).** Remaining: terms 1051–1,203 (Batches 22–24).

## Batches 22–24 Updates + PROJECT COMPLETE (terms 1051–1203) · 2026-06-20

Full 5-member committee on every batch. **The entire glossary (1,203 terms) has now been reviewed.**

- **Factual corrections (D-4):** *Subwoofer* range contradiction; *Supercardioid* shotgun-mic error; *Single-diaphragm capsule* ribbon confusion (Batch 21); *Smaart LE* paid-not-free; plus tube-mic, weighting, and Word Clock precision fixes.
- **X-1 (self-references):** ~28 more removed in B22–24; **whole-file total now 0 remaining**.
- **M-4 / M-5 (media):** ~14 more copy-paste Media errors corrected; **whole file now 0 blank Media, 0 annotations**.
- **DH-1 (headwords):** add *"Surround Sound (if present)"*, the *"M&E; Track"* semicolon, and "microphone microphone" typo to the cleanup list.
- **DH-2 (missing terms):** no new additions beyond prior list.
- **X-4 (duplicates):** final clusters flagged (TRS/TRS Connector, TS/TS Connector, VU/VU Meter, XLR/XLR Connector, Unbalanced pair).

**FINAL master:** `AP&E_Glossary_v12_COMPLETE_MASTER.xlsx` — **1,203 of 1,203 terms reviewed (100%)**, **1,138 revised**, 65 `approved` (media-only). Whole-file verification clean. All revisions remain **Candidate / Pending Approval**.

### Pending your decision (committee did not act without approval)
1. Duplicate-cluster merge policy. 2. Malformed-headword cleanup (Term-field edits). 3. Missing-term additions. 4. Category taxonomy (left untouched per instruction). 5. Weight % source or drop.

## Open Items Carried Forward

1. **Category taxonomy** — approve or amend the proposed phenomena-vs-devices split before applying file-wide.
2. **Weight %** — provide course blueprint or confirm leaving blanks.
3. **Media-note drift** — likely affects rows beyond Batch 1; audit each batch.
4. **Related-Terms capitalization** — approve file-wide normalization (X-2).
5. **ADC / A-weighting / AFL clusters** — confirm intentional retention of near-duplicate acronym/full-name entries.
