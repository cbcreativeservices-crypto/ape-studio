# A11 Accordion: GEOMETRY PROPOSAL (two moving sides + bellows envelope)

## 1. Frame A (mm)
Origin **A0 = centre of the treble grille** (the keyboard-side grille). +x out of the player's chest toward the
audience; +y down; +z toward the bass side (the player's **left**). The treble box is fixed to the player's right side/chest; the
**bass box translates and rotates** with the bellows.

## 2. Row (full-size piano accordion; all sizes drawing defaults except counts)
| Item | Value | Class |
|---|---|---|
| treble keys / bass buttons | 41 / 120 (option 140) | SOURCED (S-ACC) |
| treble box H × W × D | 480 × 200 × 180 | drawing default |
| bass box H × W × D | 480 × 140 × 180 | drawing default |
| bellows closed / max opening (bass edge) | 100 / 600, fan angle up to 35° (bottom opens more) | drawing defaults (lesson L7 "maximum bellows extension", "lower bellows arc") |
| treble grille, bass-side outlets | grille 300 × 80 on the treble box face; outlets on the bass box end face (positions UNKNOWN) | drawing defaults |
| strap + air button | drawn; air button on the bass side | SOURCED words (HOH-XS) |

## 3. Envelope `env.ac.bellows`
Union of bass-box positions over a full push/pull cycle (closed → max opening → closed) plus elbow/forearm.
Cable rule: slack ≥ max opening + 150 (drawing default); "cable catches the bellows" = stop state (L42).

## 4. Zones (from the named surface)
| Zone | Region | Verdict / source |
|---|---|---|
| `zone.ac.one` | 304.8–609.6 in front, centred | CONFIRMED (S-ACC, S-REC) |
| `zone.ac.treble` | 304.8 from the keyboard side (KSM137) | CONFIRMED |
| `zone.ac.bellows` | 101.6–152.4 from the bellows side (KSM137) — **moves with the bass box**, so the readout shows the min–max over the cycle | CONFIRMED |
| `zone.ac.sm57` | 457.2 from the centre of the grille | CONFIRMED (fix lesson wording) |
| `zone.ac.akg` | C 416III gooseneck on the bass side aimed at a sound hole + stand toward treble | CONFIRMED (AKG-416) |
| `zone.ac.strap` | clip on the shoulder strap (keys side / bellows side) | CONFIRMED (S-ACC) |
| `zone.ac.internal` | built-in mics (badge only) | CONFIRMED (S-ACC) |

Two-mic panel: distance from each mic to its side over the bellows cycle → arrival-time difference varies
(DERIVED, `SOURCES_SHARED.md` §1) — teaches L34 "moving sides change microphone-to-source distance".
Owner: all sizes; bellows maximum; whether to show button/diatonic variants (S-ACC types: piano, chromatic,
diatonic — "The pitch of a single key changes as the bellows are pushed or pulled" for diatonic).
