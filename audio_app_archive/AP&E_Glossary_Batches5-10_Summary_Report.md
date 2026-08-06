# AP&E Glossary — Batches 5–10 Summary Report

**Scope:** terms 201–500 alphabetically (*Class 1 capability* → *Howlround (UK)*)
**Date:** 2026-06-20 · **Status:** CANDIDATE / PENDING APPROVAL
**Master output:** `AP&E_Glossary_v9_Batch10_MASTER.xlsx` (cumulative: Batches 1–10)
**Review method:** 5-member committee per batch (Technical, Learning, Readability, Communications + Master Editor). All six batches received the full four independent expert reviews. (Batch 10's first attempt was interrupted by a session limit and was completed by the Master Editor alone; the full four-agent committee was then re-run and re-consolidated, bringing Batch 10 to parity.)

---

## Cumulative position

| | Count |
|---|------:|
| Terms reviewed so far (Batches 1–10) | **500 of 1,203 (~42%)** |
| Terms revised (file-wide) | **438** |
| Terms still original (`approved`) | 765 |
| Blank Media in reviewed range | 0 |
| Self-references in reviewed range | 0 |
| Residual authoring annotations ("(ONE … for X)") | 0 |

## Per-batch results (Batches 5–10)

| Batch | Terms | Revised | Media-only | Headline issues |
|------:|------:|--------:|-----------:|-----------------|
| 5 (201–250) | 50 | 47 | 3 | 19 self-refs; *Coherence trace* circular definition; wrong-media on Compressor/Condenser/Class 1; Comb / Compressor / Condenser duplicate clusters |
| 6 (251–300) | 50 | 50 | 0 | **Major: dB SPL** (+3 dB doubles *power*, +6 dB doubles *pressure*); *critical band* oversimplification; *Curtain absorption* "reduce reverberation and absorption" fix; 10 self-refs; 8 wrong-media |
| 7 (301–350) | 50 | 50 | 0 | **Major: Decibel** (+3 dB power / +6 dB pressure); malformed duplicate *DTS / DTS*; *Distortion measurements* benchmark; *Diaphragm* directionality; 9 self-refs |
| 8 (351–400) | 50 | 50 | 0 | *DVD-Audio* spec (192 kHz is stereo-only; 5.1 capped at 96 kHz); *Electret* phantom-power contradiction; EQ-family triple duplicate; 12 self-refs |
| 9 (401–450) | 50 | 50 | 0 | *Expander* downward-expansion error; *Fader* "linear" → audio-taper law; *Externally polarized condenser* voltage; *Expander* duplicate row; 10 self-refs |
| 10 (451–500) | 50 | 50 | 0 | Full four-agent committee (after re-run). 6 self-refs + 6 copy-paste Media errors (interim pass); then technical fixes (Gate, graphic EQ, HDBaseT 100 m, Headset-mic patterns), scenario/readability rewrites, xref repair; gain-staging / Gate / Grounding duplicate clusters flagged |

## Most important technical corrections (High confidence)

- **dB SPL** and **Decibel** (two separate entries) both wrongly stated "+3 dB = doubling of sound pressure." Corrected to the standard: **+3 dB doubles power/intensity; +6 dB doubles pressure/voltage.** Both errors contradicted the entries' own other fields. This is a foundational concept future engineers would have internalized wrong.
- **DVD-Audio** — 24-bit/192 kHz is **stereo-only**; 5.1 multichannel LPCM is capped at **24-bit/96 kHz** (data-rate limit). Corrected.
- **Expander** — "downward expander makes loud signals louder" corrected (it attenuates **below**-threshold signals; above-threshold is unchanged).
- **Fader** — "linear potentiometer / linear level response" corrected to a **linear-travel slider with a logarithmic audio-taper (fader law)**.
- **Externally polarized / Capsule polarization** — repeated conflation of the **48 V phantom supply** with the internal **~60–80 V capsule polarizing voltage**, corrected across affected terms.
- **critical band** ("roughly one-third octave wide") corrected toward the Bark/ERB reality (≈constant ~100 Hz below 500 Hz).
- **Distortion measurements**, **Diaphragm directionality**, **Diffusion vs low-frequency control** — precision fixes.

## Systemic patterns confirmed (and handled)

1. **Self-references** — ~66 more removed across Batches 5–10 (file-wide total now ~100+). Entirely concentrated in MUSI108/205B business/career terms that appended their own name as the last Related Term.
2. **Copy-paste Media drift** — ~30 more wrong-term Media notes corrected; multiple internal "(ONE video for X)" authoring annotations stripped (Decision Log rule M-5). Reviewed range is now 100% clean of both.
3. **Telegraphic Scenario Contexts** — the dominant learning defect; hundreds rewritten into concrete, workplace-anchored situations.
4. **"Plain-English harder than the Concise"** — dense, boilerplate-closing Plain-English ("Understanding X helps engineers…") simplified throughout.

## Duplicate / near-duplicate clusters flagged (NOT merged — pending your decision)

- Comb filter / Comb Filtering · Compression/Compressor / Compressor · Condenser / Condenser Microphone (Batch 5)
- dB SPL / dBSPL (Batch 6)
- DTS / DTS — malformed duplicate (Batch 7)
- EQ (equalizer) / Equalization / EQ / Equalizer · Early decay time (EDT) / EDT · Electret / Electret condenser microphone (Batch 8)
- Expander / "Expander increases dynamic range below a threshold" · Fast Fourier Transform (FFT) / FFT (Batch 9)
- gain stage / gain staging / Gain Staging / Gain structure · Gate / Gate / Noise Gate · Ground / Grounding / Grounding (Batch 10)

These are **flagged for your call** to merge or differentiate; the committee did not delete rows without approval.

## Items requiring future review

1. **Duplicate consolidation** — approve a merge/differentiate policy for the clusters above (and the malformed *DTS / DTS* and *Expander…* sentence-as-headword rows).
2. **Category** — numerous miscategorizations logged (e.g. *BPM*, *Distortion measurements*, *Expander* "Microphones") but **left unchanged** per your instruction.
3. **Weight %** — still blank where originally blank; awaiting course blueprint.
4. **Remaining scope** — terms 501–1,203 (~703 terms, Batches 11–24) not yet reviewed.

## Verification performed

- Reviewed range (terms 1–500): 0 blank Media · 0 self-references · 0 residual authoring annotations. ✓
- 400 terms flagged *Revised / Pending Approval*; 803 untouched `approved`; no spillover to unreviewed rows. ✓
- 1,203 data rows and all 3 sheets preserved. ✓
- Two foundational dB errors and the DVD-Audio/Expander/Fader fixes confirmed in the saved master. ✓

**Nothing marked Final or Production-Ready.** All revisions are *Candidate / Pending Approval*.
