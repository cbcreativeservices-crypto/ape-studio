# A02a Tenor trombone: GEOMETRY PROPOSAL — and the SLIDE ENVELOPE (shared with A02b)

Brass family frames/zones/radiation: `trumpet/GEOMETRY_PROPOSAL.md`. Sources: `trombone/SOURCES.md`.

## 1. Extra frame: slide frame S

Origin **S0 = the slide's stocking/crook end at 1st position**; +x along the slide toward the audience
(parallel to the bell axis; the bell sits above-left of the slide in the player's left-hand hold). Slide
travel s ∈ [0, s7] along +x. In the side view, the slide lies **below** the bell axis by drawing default
120 and the bell rim sits drawing default 250 behind S0 (the slide reaches beyond the bell even closed).

## 2. Instrument row

| Symbol | Value (mm) | Class | Source |
|---|---|---|---|
| `D_bell` | 204.4 (option 180) | SOURCED (D-TB2) | YSL-354 / PL-2010 |
| `L_tube` | 2700 (label) | SOURCED (D-TB1: 2750) | Y-HUB-TBN / PL-2010 |
| `s_n` (n = 1…7) | 0, 80.3, 165.3, 255.4, 350.9, 452.0, 559.2 | DERIVED, TRIAL | SOURCES §c |
| closed slide length (mouthpiece → crook) | drawing default 700 | UNKNOWN | — |
| slide tube spacing | drawing default 70 | UNKNOWN | — |
| bell section length (rim → tuning slide) | drawing default 650 | UNKNOWN | — |
| trigger (F attachment) | optional; tubing inside the bell section | SOURCED existence | Y-HUB-TBN |

## 3. Envelopes (the lesson's core safety idea)

- **`env.tb.slide`** = the swept volume of the outer slide, crook and right hand: a box along +x from
  S0 − 50 to S0 + s7 + 120 (hand + crook margin, drawing default), width 70 + 2·60, height 2·80, plus the
  right forearm wedge. DERIVED travel, drawing-default margins. The lesson's "comfortable buffer" (L45) is
  a user-set slider, default 150 (drawing default).
- Bell-travel, mute path as brass family. **Rule: no stand, boom, capsule or cable inside `env.tb.slide`**
  (L8, L45); the clip may only sit on the stationary bell rim (L21, DPA-MOUNT).
- Readout: minimum distance from the mic/stand to `env.tb.slide` (mm), red ≤ 0, amber < buffer.
- Animation: the slide steps through positions 1→7 with the note label; the envelope is the union.

## 4. Zones (from Bb0)

`zone.tb.dpa` [300, 500] slightly off axis (CONFIRMED) · `zone.tb.shure` [304.8, 609.6] (CONFIRMED) ·
`zone.tb.mdat` [609.6, 1219.2] (ADD) · `zone.tb.room` ≈ 3000 (CONFIRMED) · `zone.tb.practical` = the part
of the DPA/Shure zones that lies **above or beside** `env.tb.slide` + buffer, aimed across the bell
(lesson inference, labelled "lesson's practical arrangement — not a published figure"). Because the slide
reaches past the bell, the build computes this intersection; for the defaults a mic straight in front of
the bell at 300–500 is **inside** the 7th-position envelope when the slide runs on the bell axis line in
plan view → the scene teaches L45 ("An apparently reasonable mic directly in front of the bell can
intersect the lower slide's path").

## 5. Radiation layer
Brass family; trombone row: near-omni to 400 Hz (≥ −6 dB everywhere, PL-2010), front from 500 Hz,
bell-concentrated ≥ 1 kHz.

## 6. Owner list
Slide geometry defaults (closed length, spacing, bell offset); bell Ø default 204.4 vs 180; buffer default;
whether the slide animates.
