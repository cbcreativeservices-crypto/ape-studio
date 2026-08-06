# AP&E Glossary — Batch 1 Committee Review

**Scope:** 50 terms, alphabetical A-set · **Date:** 2026-06-20 · **Status:** Pending Approval
**Output depth (per your selection):** full 4-agent narrative for Moderate+ revisions; condensed log for Minor / No-Change.

Agents — **T** = Senior Pro Audio Technical Editor · **L** = Learning/Instructional Design · **R** = Plain Language/Readability · **C** = Communications/Developmental Editor.

---

## Part A — Full committee narrative (Moderate+ revisions)

### AES67  *(AUDI204 · Audio Networking Infrastructure)*

- **T — Observations:** Concise Def called AES67 "real-time, networked transfer of **AES3** digital audio over IP." Inaccurate: AES67 is an audio-over-IP **interoperability** standard (RTP transport, PTP/IEEE-1588 sync, uncompressed L16/L24 PCM). It is independent of AES3. Category "Sound Reinforcement" is wrong.
  **Recommendations:** Redefine as AoIP interoperability (RTP+PTP, uncompressed PCM); stop equating with AES3-over-IP; Category → "Audio Networking."
- **L — Observations:** The "modern evolution of AES/EBU" analogy aids first exposure but cements the AES3 misconception. **Rec:** keep a bridging analogy but frame AES67 as a *common language* between systems (Dante/RAVENNA/Livewire).
- **R — Observations:** Plain-English is readable; only the AES3 framing needs correcting. **Rec:** preserve the "audio over Ethernet, like data/video" sentence.
- **C — Observations:** Related Terms lacked the defining mechanism (PTP). **Rec:** add PTP and "Audio-over-IP."
- **Consensus:** **Moderate Revision.** Confidence: **High** (AES standards, manufacturer AoIP documentation).
- **Applied:** Concise + Plain-English rewritten; Category → Audio Networking; Related → `AES3 / AES-EBU | Dante | AVB | Audio-over-IP | PTP (Precision Time Protocol) | Word Clock`; Media → `diagram: audio-over-IP network routing audio over Ethernet with PTP clock sync`. Status → Revised / Pending Approval.

### A-weighting  *(AUDI201 · Audio Measurement & Optimization)*

- **T — Observations:** "emphasizing midrange frequencies" is imprecise — A-weighting does not *boost* mid; the curve passes ~0 dB near 1–2 kHz and **attenuates** lows/highs. Category "Audio Technology" is a catch-all; sibling *A-weighted (dBA)* is "Sound Measurement."
  **Rec:** reword to "passes midrange near unity while attenuating low/high"; Category → Sound Measurement.
- **L — Observations:** Pairs naturally with *A-weighted (dBA)* but didn't link back to it. **Rec:** add reciprocal cross-reference.
- **R — Observations:** Otherwise clear and well-pitched. **Rec:** no readability change.
- **C — Observations:** Concept order is sound. **Rec:** none beyond the technical wording.
- **Consensus:** **Moderate Revision.** Confidence: **High** (IEC 61672 weighting curves; equal-loudness literature).
- **Applied:** Concise reworded; Category → Sound Measurement; Related adds `A-weighted (dBA)`; Media kept (A/C/Z curves). Status → Revised / Pending Approval.

### Active ribbon microphone  *(MUSI190 · Microphones)*

- **T — Observations:** "active circuitry lowers the output impedance … to **standard line-level impedance**" conflates level with impedance. Active ribbons present a **low output impedance** but the signal remains **mic level**. **Rec:** correct the line-level claim.
- **L — Observations:** Good real-world framing (warmth + convenience). **Rec:** keep.
- **R — Observations:** Plain-English ran long (one dense block > 5 sentences), exceeding the accessibility target. **Rec:** tighten (Decision Log D-3).
- **C — Observations:** The passive-vs-active contrast is the key idea and should lead. **Rec:** foreground it.
- **Consensus:** **Moderate Revision.** Confidence: **High** (Royer/AEA active-ribbon documentation).
- **Applied:** Plain-English rewritten — low/consistent output impedance, signal stays mic level, ribbon tone retained; Media → `diagram: ribbon element + internal preamp + phantom power, passive-vs-active comparison`. Status → Revised / Pending Approval.

### 12AU7 / ECC82  *(AUDI201 · Amplifiers)* — data integrity

- **T — Observations:** Tube content (low-mu ~17–20 dual triode, buffer/cathode-follower use) is accurate. **But the Media field carried an unrelated note:** *"video: an amplitude envelope tracing attack, decay, sustain, and release (ONE video for Dynamics Processing)"* — an **ADSR** asset misfiled on a vacuum tube.
- **L / R / C — Observations:** A first-semester learner shown an ADSR animation for a tube would be actively misled. Definitional text needs no change.
- **Consensus:** **Moderate Revision** (single field, but a correctness-breaking error). Confidence: **High.**
- **Applied:** Media → `image: photo of a 12AU7/ECC82 nine-pin dual-triode (low-mu) with pinout`. Status → Revised / Pending Approval. **Action:** the displaced ADSR note belongs with *ADSR* (term #43), which is correctly covered there.

### 12AX7 / ECC83  *(AUDI201 · Amplifiers)* — data integrity

- **T — Observations:** Tube content (high-mu ~100 preamp workhorse) accurate. **Media field carried a graphic-EQ note:** *"image: front panel of a 31-band (1/3-octave) graphic EQ"* — wrong term.
- **L / R / C — Observations:** Same mismatch risk as above; text is fine.
- **Consensus:** **Moderate Revision** (field correction). Confidence: **High.**
- **Applied:** Media → `image: photo of a 12AX7/ECC83 preamp tube seated in an amplifier first gain stage`. Status → Revised / Pending Approval.

---

## Part B — Condensed log (Minor revisions)

| # | Term | Change | Status |
|---|------|--------|--------|
| 17 | About Me Page | Removed self-reference from Related Terms → `Professional Biography \| Professional Portfolio \| Elevator Pitch \| Branding`. Media added. | Revised |
| 19 | Absorption | Category "Audio Technology" → "Acoustics". Media added (animation). | Revised |
| 20 | Absorption coefficient | Category → "Acoustics". (Media note was correct; retained.) | Revised |
| 23 | Accountability | Removed self-reference → `Reliability \| Professional Conduct \| Work Ethic \| Professional Expectations`. Media added. | Revised |
| 24 | Acoustic baffle | Wrong Media note (absorption-coefficient table) replaced → gobos around a drum kit. | Revised |
| 35 | Active Listening | Removed self-reference → `Professional Communication \| Relationship Building \| Informational Interview \| Professionalism`. Media added. | Revised |
| 38 | Adaptability | Removed self-reference → `Emerging Technologies \| Lifelong Learning \| Transferable Skills \| Innovation`. Media added. | Revised |
| 42 | ADR | Wrong Media note (sidechain-ducking video) replaced → ADR session synced to picture. | Revised |
| 44 | Advertising | Removed self-reference → `Marketing \| Promotion \| Target Audience \| Lead Generation`. Media added. | Revised |
| 45 | Advisory Board | Removed self-reference → `Mentorship \| Industry Association \| Professional Organization \| Networking`. Media added. | Revised |

## Part C — No changes required (Media recommendation added; kept *approved*)

Definitions verified accurate and complete; only the previously-blank Media field was populated:

1/3-octave display · 1/48-octave display · 12AT7 / ECC81 · 12AY7 / 6072 · 2A3 · 300B · 5.1 / 7.1 Surround Sound · 5U4 · 6550 · 6L6 · A-weighted (dBA) · A/D converter (ADC) · AAC · AC701 · Accomplishment Statement · Acoustic cloud · Acoustic coupling · Acoustic environment · Acoustic Feedback / Howlround / Ringing · Acoustic isolation · Acoustic overload · Acoustic panel · Acoustic Treatment · Acoustics · Action Verbs · Active trace · Adaptive Audio · ADC · ADC / DAC · ADSR · AES (Audio Engineering Society) · AES3 / AES-EBU · AFL & PFL (monitor bus modes) · AFL (After-Fade Listen) · Absorber / Absorbers.

---

## Student Learning Notes (selected)

- **Why AES67 matters:** It is why a Dante rack and a RAVENNA console can share audio over one network — the backbone of modern networked venues and broadcast plants.
- **Common misconception (A-weighting):** that it "boosts" the mids. It doesn't add gain anywhere; it *reduces* the lows and highs your ear cares about less at moderate levels.
- **Memory aid (ADC/DAC):** "A→D, record in; D→A, play out." Every interface has both doors.
- **Real-world (Active ribbon):** reach for one when your preamp is short on clean gain but you still want a ribbon's smooth top end.
- **Recommended media pattern:** tubes → labeled photos/pinouts; acoustics phenomena → animations of energy/behavior; measurement → annotated analyzer screens; career terms → before/after or scenario infographics.
