# AP&E Glossary — Batch 3 & 4 Committee Review

**Scope:** terms 101–200 (*automatic mic mixer* → *Chorus Effect*) · **Date:** 2026-06-20 · **Status:** Pending Approval
**Committee:** **T** Technical · **L** Learning · **R** Readability · **C** Communications + Master Editor.
**Output depth:** full narrative for the four Major revisions; condensed logs otherwise.

---

## Part A — Full committee narrative (Major revisions)

### Aux-fed subwoofer  *(AUDI201 · Loudspeakers)* — Batch 3, Major

- **T:** Definition described a consumer home-theater AVR with bass management. Wrong context — in live sound (the course's frame) an aux-fed sub is driven by a dedicated **post-fader aux send** carrying only chosen low-frequency sources (kick, bass, floor toms, synth), deliberately excluding vocals/cymbals to reduce low-end mud and intermodulation distortion. **Rec:** rewrite to the live-sound meaning. *High confidence — Fulcrum Acoustic, FOH Magazine, Yamaha Pro Audio.*
- **L:** Add the "why" — cleaner low end and more control. **R:** the original was a parenthesis-heavy run-on; simplify. **C:** 5 of 7 cross-refs were broken; rebuild.
- **Consensus:** **Major (wrong context).** Applied: Concise + Plain-English rewritten; Related Terms rebuilt; Media → `diagram: console aux send feeding subwoofers with only LF sources routed`.

### C-weighting  *(AUDI201 · Sound Measurement)* — Batch 4, Major

- **T:** Concise + Plain-English claimed C-weighting "emphasizes mid-range (1–4 kHz) and de-emphasizes lows and highs." Factually wrong and **self-contradictory** — the term's own Common Mistakes field already said "near-flat 31.5 Hz–8 kHz." C-weighting is essentially flat across the audio band, rolling off only at the extremes; it's used for **peak/high-level and low-frequency** work where A-weighting is inappropriate. **Rec:** correct all affected fields. *High confidence — IEC 61672.*
- **L:** Pair it explicitly with A-weighting (use C for loud/LF, A for moderate-level exposure). **R:** remove the misleading "emphasizes" verb. **C:** reconcile with sibling *C-weighted (dBC)*.
- **Consensus:** **Major (factual + internal contradiction).** Applied: Concise/Plain-English/Purpose/Common Mistakes rewritten to "nearly flat ~31.5 Hz–8 kHz"; Media → `diagram: C-weighting curve shown nearly flat across the band vs the A-weighting curve`.

### Capsule polarization voltage  *(AUDI201 · Microphones)* — Batch 4, Major

- **T:** Stated "typically 48 volts," conflating the **48 V phantom supply** with the **capsule polarizing voltage**, which is generated internally by a DC-DC converter to **~60–80 V** (sometimes higher). Electret capsules instead use a permanently charged material and need no external polarizing voltage. **Rec:** correct the figure and add the electret contrast. *High confidence — Neumann / phantom-power references.*
- **L/R:** Plain-English restated jargon ("establish the electrostatic field that enables transduction"); translate to everyday language. **C:** confirm against neighboring capsule terms.
- **Consensus:** **Major (factual).** Applied: Concise/Plain-English/Common Mistakes rewritten; Media → `diagram: condenser capsule with DC polarizing voltage across diaphragm and backplate`.

### Chorus Effect  *(MUSI190 · Modulation Effects)* — Batch 4, Major

- **T:** Practical Application gave "100–300 ms delay, 5–15% feedback." Chorus uses a **short modulated delay (~15–35 ms)**; 100–300 ms is slapback/echo, and **feedback is a flanger parameter**, not standard chorus. The term's own Common Mistakes correctly distinguished chorus from flanger — the body contradicted itself. **Rec:** correct the ranges, drop feedback. *High confidence.*
- **L/R/C:** Definition and analogy ("multiple instruments playing together") are strong; only the parameters were wrong.
- **Consensus:** **Major (factual).** Applied: Practical Application corrected (15–35 ms, 0.1–2 Hz rate, no feedback); Media → `audio: a guitar chord dry vs with chorus, A/B comparison`.

---

## Part B — Condensed log (Moderate revisions)

**Batch 3 (17 Moderate):** mostly telegraphic Scenario Contexts rewritten into concrete tasks plus cross-reference repair — AV-over-IP, Averaging, Banding, Bandwidth, Base, Bode plot, binaural recording, Bit/Byte/Bit Rate/Bit Depth, Bluetooth, Broadcast & Streaming Loudness Standards, and the career terms (Benefits, Best Practices, Brand Awareness — self-refs removed). **BPM** Related Terms fully rebuilt.

**Batch 4 (3 Moderate):** **Cables (audio)**, **Cardioid Microphone**, **Channel Strip** — Media copy-paste corrections plus tightened wording / differentiated scenario from the near-duplicate *Cardioid*.

## Part C — Minor + housekeeping

Scenario upgrades, readability trims of "plain-English harder than the concise" entries (buffer amplifier, Butterworth, Capsule leakage, Capsule-to-grid, Center-terminated capsule, Channel delay), ~92 cross-reference repairs across both batches, and Media added to every previously-blank field. 47 definitions across the two batches were judged sound and left unchanged on content.

## Part D — Difficulty recalibrations

Bidirectional Microphone → intermediate · Bass trap → intermediate · Broadcast Audio → intermediate.

---

## Student Learning Notes (selected)

- **C vs A weighting:** use **C** for loud, bass-heavy measurements (it hears the lows); use **A** for moderate-level noise-exposure. C is the flat one.
- **Phantom ≠ polarizing voltage:** 48 V comes *in*; the mic quietly steps it up to 60–80 V *inside* to charge the capsule.
- **Chorus vs flanger:** chorus = short delay, **no feedback** (lush doubling); add feedback and you've made a flanger (jet-sweep).
- **Aux-fed subs (live):** send only kick/bass/toms to the subs so vocals and cymbals don't muddy the low end.

## Cross-committee flags carried forward

- **Self-reference artifact** persists (18 more removed across these two batches); large file-wide cohort remains.
- **Category** issues logged but untouched per your instruction (*BPM*, weighting/cardioid/capsule families).
- Duplicate pairs (Bidirectional, BNC, Cardioid) flagged for possible merge.
