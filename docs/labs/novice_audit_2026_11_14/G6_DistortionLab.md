# G6 · DistortionLab — beginner orientation audit

Walked 2026-11-14 at 390 x 844, sound OFF. **How reached:** not in the `#labpreview/` harness; full app → OPEN LABS → EXPLORE ADVANCED LABS → Distortion & Saturation → Distortion (no lock). Shared frame judged in G6_EqLab.md. EXPLORE walked; LEARN / CHECK from `distortionScreenGuides.ts` + on-page cards.

---

## Page 1 · EXPLORE

| Field | Finding |
|---|---|
| Page | Distortion Lab · EXPLORE |
| First look | Intro card "**Distortion**": "any change to a signal that adds sound the original did not have… the warm tone of a tube amp or guitar overdrive… harsh clipping… Engineers measure… harmonic and intermodulation content." Good until the last sentence. Then Sound Safety (10th time), learning popup. Then the clearest hero picture of the effect labs: a small grey sine on IN, and on OUT a big wave whose tops are sliced flat at two red lines, with the dashed "what it would have been" above. Thinks: "the wave got its top cut off." Exactly right. |
| Overwhelm | **2 / 5.** |
| Knows what it is learning? | **Yes / partly** — "pushing too hard flattens the wave" lands visually; "harmonics" (what the flattening creates) is asserted in words but never drawn on this screen. |
| Knows what to do first? | **Yes.** WHERE TO START: "Tap ▶ with SINE 220 Hz on HARD CLIP. Drag DRIVE from +12 dB to +36 dB and watch the wave flatten at the red lines. Then set TYPE to TUBE (ASYM)." The silent half works fully: HARD → flat tops; TUBE → lopsided, rounded shape. |
| Words they would not know | "Clipping · Odd vs Even · Aliasing" (subtitle) · "harmonic and intermodulation content" (card) · "IN = −20 dBFS sine", "0 dBFS", "DRIVEN (before clip)" · "harmonic series" · "OVERSAMPLING" / **"OS"** key · "SOFT (TANH)" (tanh is a maths function name) · "TUBE (ASYM)" · "single-ended tube stages" · "Bitcrush and sample-rate reduction… this lab does not draw them". |
| Follows / continues? | Mostly. The subtitle promises "Odd vs Even · Aliasing", but the screen shows only the wave shape; odd/even harmonics and aliasing are told in LAB NOTES, not shown. The OS key's effect "barely shows on this source" (caption) — another key that looks dead by default. |
| What works | The before/after wave with the dashed "would-have-been" peak and red 0 dBFS lines: cause → effect at a glance. TYPE choices change the shape visibly. CHECK YOURSELF "Distortion makes a pure sine tone sound 'rich'. What was added? — New frequencies…" is the right first question. |
| Suggestions | 1. **Draw the harmonics**: a small bar row under OUT (1st, 2nd, 3rd, 4th, 5th…) that grows with DRIVE and shows even bars appearing only on TUBE (ASYM). That makes "Odd vs Even" visible and silent-friendly. **M.** 2. **Rename trays in words**: "HARD CLIP — sliced flat", "SOFT — rounded off", "TUBE — lopsided, warm". Drop "TANH". **S.** 3. **Spell out OS** ("OVERSAMPLING — cleaner highs") and grey it out on the default source, or default to the source where it shows. **S.** 4. **End the card at "…pushed too hard."** — "intermodulation" belongs to LEARN. **S.** 5. Move "Bitcrush… this lab does not draw them" into LEARN. **S.** |
| Hobbyist | Will love TUBE vs HARD; will want an input level meter and real-instrument sources (guitar). |

---

## Page 2 · LEARN (from source)
WHERE TO START: "Read what distortion is first. Then read the COMMON MISTAKES line on odd and even harmonics…" — reading first is right. Topics: bent sine → harmonic series, odd vs even, aliasing, THD. "THD" and "aliasing" will need a picture (aliasing especially: "frequencies folding back down"). **M.**

## Page 3 · CHECK (from source)
What distortion adds to a sine, odd harmonics from a symmetric clip, oversampling OFF, parallel distortion. On-page CHECK YOURSELF: the right answers are the long ones ("New frequencies — harmonics created by bending the waveform"; "DRIVE sets how hard the wave hits the clipping stage… MIX blends…"). **S.**

---

## Lab verdict — DistortionLab

**Beginner's journey:** The most self-explaining hero picture of the effect labs — a sine with its top sliced off at a red line, the lost part drawn dashed — and TYPE visibly reshapes it. What the subtitle promises (odd vs even, aliasing) is only told in words, so a sound-off beginner learns "clipping flattens the wave" but not yet "that creates new tones".

**3 biggest orientation problems**
1. Harmonics (the core idea) are not drawn.
2. Maths/jargon labels on keys and trays (TANH, ASYM, OS).
3. Card ends in "harmonic and intermodulation content".

**3 best things**
1. Before/after wave with dashed "would-have-been" peak and red ceiling lines.
2. TYPE choices visibly reshape the wave.
3. First CHECK YOURSELF targets the core idea ("new frequencies").

**First 30 seconds rewrite**
Card: "**Distortion** — push a sound harder than the equipment can carry and its shape gets squashed. That squashing adds new tones: the 'grit' of an overdriven guitar." Pointer on DRIVE: "Drag right. See the tops get sliced off? Watch the new bars appear underneath — those are the new tones."
