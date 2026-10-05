# A05b Alto saxophone: GEOMETRY PROPOSAL — and the SAX FAMILY (4 sizes, one model)

Status: PROPOSAL. Sources: `alto_sax/SOURCES.md` (family keys §0). Value classes and the drawing-default rule:
`trumpet/GEOMETRY_PROPOSAL.md` header. Soprano, tenor and baritone use this file with their own row (§2).

## 1. Frame X (sax frame, mm)

The sax is modelled as a **centre-line path** P(u), u = path length from the reed tip (u = 0) to the bell rim
(u = U). Segments: mouthpiece + neck → body (straight, the tone-hole field) → bow (U-turn; not on soprano)
→ bell (rises for alto/tenor/bari; continues straight for soprano). Origin **X0 = bell-rim centre**; +x along
the bell axis out of the bell; +y down; +z player's right. Posture places frame X in W (§4).
Bell axis: alto/tenor/bari point **up and forward** (bell "curves upward"); soprano points **down-forward
along the body** (straight).

## 2. Family rows (all dimensions drawing defaults unless marked)

| Parameter | Soprano | Alto | Tenor | Baritone | Class / source |
|---|---|---|---|---|---|
| Shape | straight (curved-neck / curved-bell variants exist) | curved | curved, neck has a dip | curved + neck loop | SOURCED words (Y-HUB-SAX; bari "bent neck" lesson [1]) |
| Lowest sounding note | A♭3 207.65 Hz | D♭3 138.59 Hz | A♭2 103.83 Hz | D♭2 69.30 Hz (low-A model C2 65.41 Hz) | SOURCED (DPA-TABLE) / PHYS-ET |
| Acoustic length of the lowest note, L0 = c/(2f) at 20 °C | 826.4 | 1238.2 | 1652.7 | 2476.3 (2623.5 low A) | DERIVED (CALC-C, cone ≈ open–open; ILLUSTRATIVE, ignores end/mouthpiece corrections) |
| Visible height / length (floor-standing view, mouthpiece→lowest point) | 640 | 700 | 860 | 1000 (Met 967 TRIAL) | drawing defaults; bari TRIAL MET-BARI |
| Bell rim Ø | 85 | 120 | 140 | 160 | drawing defaults |
| Bell cut-in (bell acts as high-pass/megaphone above) | 2600 Hz | UNKNOWN (between) | 1800 Hz | UNKNOWN | SOURCED UNSW-SAX for soprano/tenor only |
| Low A key | — | — | — | yes (thumb, left hand) | SOURCED Y-SAX-PLAY2 |
| Player pose | standing; instrument 30° from vertical, bell down-forward ("downward-looking position") | strap; body angled to the player's right side, bell beside the right thigh | as alto, lower and further right | harness; floor-peg-free, bell at hip, body to the right | ILLUSTRATIVE (words SOURCED Y-HUB-SAX for soprano) |

## 3. Tone-hole field and the register selector (the family's core teaching layer)

- Tone holes sit on the body segment at path distances **u_k ≈ L0·2^(−k/12)** from the reed tip, k = 1…17
  (one semitone per hole, UNSW-SAX "each opened tone hole raises the pitch by a semitone, which requires a pipe
  that is about 6% shorter"). DERIVED, **ILLUSTRATIVE** — real holes, key cups and chimney sizes are UNKNOWN.
  Holes with u_k inside the bow/bell segment are drawn on the bell side of the bow (low C♯/B/B♭ keys).
- **Register selector**: the learner picks a written note. First register: k = semitones above the lowest note;
  second register (octave key): k = semitones − 12. The **first open hole** = hole k (highlight). k = 0 → all
  closed → **bell** highlighted. Holes past k (toward the bell) are drawn "partly radiating" (dim), and above
  the cut-in frequency the bell glows too. Wording on screen follows SOURCES §1 (first open hole).
- Radiation drawing: small qualitative spheres at the radiating holes and bell; no dB. Tag "simplified".
- Readouts: distance from the mic to (a) the active first open hole, (b) the bell rim, (c) the body midpoint;
  the ratio (a)/(b) is the "hole-vs-bell balance" indicator (inverse-distance only; label "ideal point sources").

## 4. Zones (each verified; distances from the named target)

| Zone id | Region | Verdict / source |
|---|---|---|
| `zone.sx.aboveBell` | 50–100 above the bell rim (alto/tenor/bari), aimed at the body/sound holes | CONFIRMED (Shure "a few inches" — band is a drawing default) |
| `zone.sx.intoBell` | 50–100 in front of the rim on the bell axis | CONFIRMED (Shure) |
| `zone.sx.holes` | 50–100 from the tone-hole field, facing the keys | CONFIRMED (Shure: warm, fingering noise) |
| `zone.sx.dpaMount` | beside the bell on the player's right-hand side (clip/gooseneck reach ≤ 140) | CONFIRMED (DPA-SAX, DPA-MOUNT) |
| `zone.sx.sweetwater` | 304.8–609.6 from the bell, aimed at the point one third of the way from bell to mouthpiece; seated: height = right elbow (posture anchor) | CONFIRMED (SW-SAX archive) |
| `zone.sx.mdat` | 457.2–609.6 in front, aimed between the bell and the left-hand keys | ADD (MDAT) |
| `zone.sx.hill` | equilateral triangle: mic distance from the top and from the bottom of the horn = horn length | CONFIRMED words (S-SAX), DERIVED geometry |
| `zone.sx.martin` | 203.2–381, 45° off the bell toward mid-body | **UNREACHABLE** — show only after the owner verifies the Sweetwater text |
| `zone.sx.shoulder` | over the player's right shoulder (ear-side) | CONFIRMED words (S-SAX); height = ear (posture), distance drawing default 150–300 from the ear |
| `zone.sx.room` | omni / figure-8 room mic, distance drawing default 2000–4000 | CONFIRMED words (S-SAX Van Gelder, Hill) |

Soprano: `aboveBell` is **not** offered as the "natural middle" (S-REC: a mid-instrument mic will not catch
holes and bell together); soprano has `zone.sx.sop.far` (clip as far from the bell as possible, aimed back at
the upper keys) and `zone.sx.sop.front` (in front of the bell — "bite") from DPA-MOUNT.

## 5. Envelopes and keep-outs
Key/rod/pad/guard/neck-cork no-mount list (lesson safety; DPA clip goes on the bell rim only); right-hand and
left-hand boxes over the key stacks; bell swing ±10° (drawing default); player turn ±20° (bari: stand must
clear the turn, Bari L-safety). Strap/harness line from neck to the strap ring.

## 6. Invariants
k = 0 lights the bell only; hole positions decrease monotonically toward the mouthpiece; soprano bell axis is
never "up"; every distance readout names its target (hole / bell / body).

## 7. Owner list
All modern dimensions (drawing defaults); whether to draw the curved soprano; Martin figures (verify); display
units for "a few inches" (no number published — show words, not a band label).
