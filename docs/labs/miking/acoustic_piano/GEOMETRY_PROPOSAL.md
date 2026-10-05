# C11 Acoustic Piano: GEOMETRY PROPOSAL (grand, baby grand, upright)

Status: PROPOSAL. Sources: `acoustic_piano/SOURCES.md`. Value classes: `acoustic_guitar/GEOMETRY_PROPOSAL.md`
header. This file defines the **PIANO FAMILY** (grand plan + side, upright side + rear), reused by the
Ensembles lab (singer with piano) later.

## 1. Keyboard (shared by all three)

- 88 keys, 52 white. Octave span 164 mm (TRIAL: MET-BECH "3-octave span 49.2 cm"); white-key pitch
  164/7 = 23.43 (DERIVED); keyboard width 52 × 23.43 = 1218.3 (DERIVED from TRIAL).
- The keyboard's exact middle is the E4|F4 boundary (26 white keys each side; DERIVED by counting).
- Middle A (A4) centre: 2.5 white keys treble of the middle = **+58.6** (DERIVED).
- Pitches (PHYS-ET): A0 27.500 Hz, A4 440 Hz, C8 4186.0 Hz.

## 2. Frame P — grand (Model B default; Model S baby grand; Model D option)

- Origin **P0 = the hammer strike line at the keyboard middle (E4|F4), in the string plane.**
- **+x** from the keyboard toward the tail (along the treble strings); **+y down**; **+z** toward the
  treble end (pianist's right). Views: plan (from above, screen X = x, Y = z) and side (from the
  curved/treble side, screen X = x, Y = y).

| Item | Model B | Model S | Model D | Class |
|---|---|---|---|---|
| Case length (key front → tail) | 2110 | 1550 | 2740 | SOURCED SW-B / SW-S / SW-D |
| Case width (z) | 1480 | 1470 | 1560 | SOURCED |
| Key front at | x = −470 | −470 | −470 | drawing default (longest key 622 SOURCED SW-D; hammer line sits under the key's back half) |
| Tail at | x = 1640 | 1080 | 2270 | DERIVED (length − 470) |
| Case z span | [−740, +740] | [−735, +735] | [−780, +780] | DERIVED (centred: drawing default) |
| Straight (bass) side | z = −half-width, x from −470 to tail | | | drawing default (convention, not sourced) |
| Curved (bentside) wall | spline from (x 300, z +half) to the tail; apex of the curve drawing default (x 0.45·L_case − 470, z +half) | | | drawing default |
| Rim top above string plane | y = −60 | | | drawing default (MET-BECH case depth 355 w/o lid TRIAL for the rim height) |
| Floor | y = +780 (key tops 720 above the floor + 60) | | | drawing default |
| Lid | hinged on the straight side (z = −half-width); full stick 40°, short stick 15°, closed 0° | | | drawing default ×3 (angles UNKNOWN) |
| Register bands at the hammer line | bass z ∈ [−609, −200], middle [−200, +200], treble [+200, +609] | | | drawing default (bass strings cross over; real split UNKNOWN) |
| Frame "sound holes" | high hole (x 500, z +350); low hole near the last / second-to-last bass octave (x 900, z −420) | | | positions drawing default; the two holes are named by DPA-PIANO |
| Soundboard | under the strings, y = +100, inside the rim | | | drawing default |
| Dampers / action | keep-out box x ∈ [−470, +120], y ∈ [−80, +200] over the full keyboard width | | | drawing default |

### Grand zones (each verified against the lesson; mic.ref positions in frame P)

| Zone id | Position | Lid | Verification | Source |
|---|---|---|---|---|
| `zone.gp.dpa.outsideAB` (solo/isolated start) | two omnis 300 apart (z = ±150 about the curve's centre), "just outside" the curved side, "relatively low": drawing default 800 out from the rim, height = rim top | full stick | **CONFIRMED** L30 | DPA-PIANO |
| `zone.gp.dpa.ortfCurve` | ORTF (170 mm, 110° included) in the curve, facing the strings; distance drawing default 900 | full stick | **CONFIRMED** L30 | DPA-STEREO |
| `zone.gp.dpa.ortfOver` | ORTF centre (x 600 "mid frame" drawing default, y −300, z 0), both capsules pitched **45° down toward the pianist** (−x) | open | **DIFFERENT**: L31 omits the 45° | DPA-PIANO |
| `zone.gp.dpa.abOver` | omnis y −300, spaced 300 | open | not in lesson | DPA-PIANO |
| `zone.gp.dpa.hang` | minis y ∈ [−400, −300], x = −40 ("slightly in front of the hammers", drawing default), z = ±150 | any | not in lesson | DPA-PIANO |
| `zone.gp.shure.1` | (203.2, −304.8, middle band) | off / full | **CONFIRMED** L31 (Shure pair; the numbers are new to the lesson) | S-REC/S-LIVE |
| `zone.gp.shure.2` | (203.2, −203.2, treble band) | off / full | as above | S-REC/S-LIVE |
| `zone.gp.shure.4` | (203.2, −152.4, middle band) | short stick | CONFIRMED L19 "close … shorter lid" | S-REC/S-LIVE |
| `zone.gp.shure.lowMic` | low mic moved 152.4 further from the keyboard (+x), both splayed outward | | not in lesson | S-REC/S-LIVE |
| `zone.gp.shure.holes` | aim into the frame holes (positions above) | any | **CONFIRMED** L35 (S-RHYTHM "a single SM58 pointing into one of the soundboard holes"; also booklet row 3) | S-RHYTHM, S-REC/S-LIVE |
| `zone.gp.shure.lidCentre` | next to the underside of the raised lid, centred | raised | not in lesson | S-REC/S-LIVE |
| `zone.gp.shure.under` | under the piano, y = +600 (drawing default), aim up (−y) | any | not in lesson | S-REC/S-LIVE |
| `zone.gp.boundary.lid` | boundary on the lid underside over the lower treble strings | short / closed | **CONFIRMED** L34 | S-PIANIST, S-REC |
| `zone.gp.boundary.pair` | two boundaries on the closed lid at its keyboard edge, at z = **−386.6** and **+425.7** (2/3 from A4 at +58.6 to each keyboard end ±609.2) | closed | not in lesson | S-REC (position DERIVED from TRIAL key span) |
| `zone.gp.boundary.rim` | vertical on the inside rim at the curve apex | any | not in lesson | S-REC |
| `zone.gp.magnets` | wide cardioids on the frame at either end; minis at the high hole and the low hole | any | CONFIRMED L34 | DPA-PIANO |

Lid travel keep-out `ko.gp.lid`: the swept volume of the lid from closed to full stick about its hinge
(drawing-default angles); no mic, stand or cable inside it (L7, L70). Strings/dampers/hammers/action:
`ko.gp.action` (above). Pianist: §5.

## 3. Frame U — upright (Steinway K-52 default)

- Origin **U0 = floor point under the centre of the case back face.** **+x** toward the pianist (out of
  the front), **+y down** (floor y = 0), **+z** toward the treble end.

| Item | Value | Class |
|---|---|---|
| Case | H 1320 (top y = −1320), W 1525 (z ∈ [−762.5, +762.5]), D 680 (keyboard front x = 680) | SOURCED SW-K52 |
| Upper case front (above the keys) | x = 330 | drawing default |
| Key tops | y = −720 | drawing default |
| Soundboard | back of the case, x ∈ [20, 60], y ∈ [−1250, −150] | drawing default |
| Hammer line | x = 250, y = −950 | drawing default |
| Top lid opening | x ∈ [40, 320] at y = −1320 | drawing default |
| Removable front panel (upper) | x = 330, y ∈ [−1250, −760]; lower front board x = 330 (below the keys), y ∈ [−600, −80] | drawing default |
| Wall behind | x = −400 when rear-miking (L37: never pressed to the wall) | drawing default |

### Upright zones

| Zone id | Position (frame U) | Verification | Source |
|---|---|---|---|
| `zone.up.top.treble` / `.bass` | just over the open top above the treble / bass strings: (180, −1380, ±400) | **CONFIRMED** L37 (split pair) | S-REC/S-LIVE, S-RHYTHM |
| `zone.up.inside` | inside the top near bass and treble strings: (180, −1250, ±400), aimed slightly toward the hammers | CONFIRMED L37 | S-RHYTHM, S-REC |
| `zone.up.rear.bass` / `.treble` | 203.2 from the soundboard: (−183, −700, ∓400) | CONFIRMED L37 ("rear sweet spot") — numbers new to the lesson | S-REC/S-LIVE |
| `zone.up.floor` | on the floor 304.8 from the soundboard centre, aiming at the piano: (−265, 0, 0) | not in lesson | S-REC/S-LIVE |
| `zone.up.front.hammers` | front panel removed (owner approval), "several inches" from the hammers: (330 + 100, −950, 0) — 100 is a drawing default | CONFIRMED L38 | S-REC/S-LIVE, S-RHYTHM |
| `zone.up.lowerFront` | lower front board removed, by the player's feet | CONFIRMED L38 | S-RHYTHM |

## 4. Readouts

Height over the strings (−y), distance from the hammer line (x), register band under the mic, lid state,
pair spacing/angle (ORTF 170/110 check), mono-check panel (spaced pairs), level note "> 130 dB near the
hammers" (DPA) next to the hearing line.

## 5. Pianist envelope (ILLUSTRATIVE, drawing defaults)

Bench 760 × 360, seat 480 above the floor, front edge 250 from the key fronts. Torso box behind the bench
front; head sphere r 110 at 1250 above the floor, 450 from the key fronts. Hands sweep the keyboard
width ±609 at key height. Pedals at the floor under the keyboard middle (grand: x = −400; upright:
x = 600), foot zone 400 × 250. Sight line from the eyes to the music desk: keep stands out of it.

## 6. Invariants

Keyboard middle at z = 0; A4 at +58.6; boundary pair z values as DERIVED; every Shure grand zone has
x = +203.2; ORTF pairs are 170 mm / 110°; no zone inside `ko.gp.lid` or `ko.gp.action`; upright rear
zones have x < 0.

## 7. UNKNOWNS for the owner

Lid angles and hinge, rim height, frame-hole positions, register band edges, hammer-line and soundboard
positions (all drawing defaults). Whether to draw Model B (default), S and D, plus the K-52 upright.
