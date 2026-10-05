# A08a Soprano clarinet: GEOMETRY PROPOSAL — and the REED-WOODWIND family (clarinet, bass clarinet, oboe, bassoon)

Sources: `soprano_clarinet/SOURCES.md` (family keys §0). Value classes: `trumpet/GEOMETRY_PROPOSAL.md` header.

## 1. Frame R (mm), whole family
The instrument is a centre-line path P(u), u = length along the instrument **from the bell end** (u = 0 at the
bell rim) to the reed tip (u = U). Origin **R0 = bell-rim centre**. +x along the bell axis out of the bell;
+y down; +z player's right. **DPA's "one third of the length from the bell"** = the point P(U/3) — one rule
for all four instruments; its direction in the world follows the posture (above the bell for clarinet/oboe,
below the bell for bassoon). The 15–20 cm DPA distance is measured from P(U/3) along the outward normal on the
key side (lab convention, said on screen).

## 2. Rows

| Parameter | Soprano clarinet (B♭) | Oboe | Bass clarinet | Bassoon | Class / source |
|---|---|---|---|---|---|
| U (bell → reed tip) | 629 (+ mouthpiece drawing default 90) | 545 | drawing default 1350 incl. neck | 1350 (visible) | Met TRIAL / Met TRIAL / UNKNOWN / Yamaha "around 135 centimeters" SOURCED |
| P(U/3) from the bell | 209.7 | 181.7 | 450 | 450 | DERIVED |
| Bell | flared, Ø drawing default 65, axis down-forward | Ø 57 (Met 504275 "Bell diam.: 5.7 cm") axis down-forward | curved, **upward-facing**, Ø drawing default 110 | at the **top**, Ø 40 inner (Y-BSN-MECH "at the bell it is 40 millimeters") | mixed (see cell) |
| Bore | cylindrical | conical | cylindrical | conical, folded ("U-shaped"), ~2.6 m unfolded | SOURCED words (UNSW, PL-2010, Y-BSN-MECH "around 260 centimeters") |
| Posture | seated/standing, instrument 30–40° from the body, bell at knee height (drawing default) | same, bell slightly higher | seated, floor peg, curved neck to the mouth | seated, seat strap, instrument diagonal across the body, bell above the head | ILLUSTRATIVE |
| Tone-hole cutoff | 1500 Hz | 1500 Hz | UNKNOWN | 400–500 Hz | PL-2010 |
| Lowest note | D3 146.83 Hz | B♭3 233.08 Hz | B♭1 58.27 Hz (low C model) | B♭1 58.27 Hz | DPA-TABLE (oboe DPA lists C¹ 262 Hz — see oboe SOURCES) / Y-YCL622 "extending down to low C" + PHYS-ET |

## 3. Register layer (as the sax family)
First open hole highlighted; all-closed → bell. Hole positions along P(u) drawn by the semitone rule from the
reed end (ILLUSTRATIVE). Clarinet overblows a twelfth (k = semitones − 19 in the second register; UNSW-CL
cylindrical bore) — oboe/bassoon/sax overblow an octave. Above the tone-hole cutoff, the bell direction gains
(clarinet 2 kHz band toward the bell — PL-2010).

## 4. Soprano clarinet zones

| Zone id | Region | Verdict / source |
|---|---|---|
| `zone.cl.dpa` | 150–200 from P(209.7), facing the holes, angled to include the bell | CONFIRMED, DPA-CL |
| `zone.cl.mdat` | 609.6–1219.2 in front, aimed at the instrument centre P(U/2) | ADD, MDAT |
| `zone.cl.section` | between two players at head height, pointing down (floor not carpeted) | CONFIRMED, DPA-CL |
| `zone.cl.uclip` | strap at the top of the bell, capsule toward the keys; gooseneck variant looking back to the upper joint | CONFIRMED, DPA-CL / DPA-MOUNT |
| `zone.cl.bellOnly` | on the bell axis (comparison only: "won't pick up the rest of the notes") | MDAT words |

Envelopes: hands/ring keys, bell swing ±10° (drawing default), wooden-body no-clamp zones, joints (no
bridging). Owner: posture angles; bell Ø default; mouthpiece length default.
