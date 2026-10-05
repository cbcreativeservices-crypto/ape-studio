# C01 Acoustic Guitar: GEOMETRY PROPOSAL (steel 6, 12-string, nylon)

Status: PROPOSAL. No app code. Source keys: `acoustic_guitar/SOURCES.md` (this folder). Value classes
as `snare/GEOMETRY_PROPOSAL.md`: **SOURCED** · **DERIVED** (formula given) · **TRIAL** (sourced value
borrowed from another instrument or read under an interpretation) · **UNKNOWN** · **DRAWING DEFAULT**
= "drawing default, not a published figure", `placeholder: true`, never shown as a readout.

This file also defines the **GUITAR BODY FAMILY** (§7) reused by C03 Resonator, C05 Banjo / Mandolin /
Ukulele, C07 Acoustic bass guitar and C13 Oud.

---

## 1. Frame G (instrument frame, mm)

- Origin **G0 = saddle centre on the top plane** (the bridge end of the scale; the string centre line
  meets the top here). Compensation of the saddle is ignored (TRIAL: the nominal scale is drawn).
- **+x** along the string centre line from the saddle toward the nut / headstock.
- **+y** in the top plane, perpendicular to the strings, toward the treble (first) string. In normal
  playing posture this side faces the floor, so +y ≈ down (the Batch 1 "+y down" habit).
- **+z** out of the top, toward the listener / microphone. The back is at z = −depth.
- Views: **front view** (audience looking at the top, −z): screen X = x, screen Y = y. **Top view**
  (looking down on the treble rim): screen X = x, screen Y = z. One `mic.ref` (x, y, z) + one aim
  vector; both drags edit the same 3D point.
- Distances in readouts are "grille front to <target>", never millimetre claims (lesson L31 "Do not
  infer a result from a drawing alone").

## 2. The three default guitars

Fret positions: d_n from the nut = L·(1 − 2^(−n/12)) (PHYS-ET, DERIVED); from the saddle = L·2^(−n/12).
2^(−1) = 0.5; 2^(−14/12) = 0.445449.

| Symbol | Steel 6 (Taylor dreadnought) | 12-string (Martin HD12-28) | Nylon (Cordoba C5) | Class / source |
|---|---|---|---|---|
| Scale L | 647.7 | 632.46 | 650 | SOURCED: TAY-DN 25-1/2"; MAR-HD12 24.9"; ELD-C5 650 mm |
| Frets to body | 14 | 14 | 12 | Steel: TRIAL (TAY-DN does not state it; borrowed from MAR-HD12 "D-14 Fret (Dreadnought)"); 12-string SOURCED MAR-HD12; nylon SOURCED ELD-C5 "Joins at the 12th fret" |
| 12th fret x | 323.85 | 316.23 | 325.0 | DERIVED L/2 |
| Body neck-end edge x (= joint fret) | 288.52 | 281.73 | 325.0 | DERIVED L·2^(−14/12) or L/2; TRIAL: the joint fret is drawn at the body edge |
| Nut x | 647.7 | 632.46 | 650 | DERIVED |
| Body length | 508.0 | 508.0 | 488.95 | SOURCED TAY-DN / TRIAL (TAY-DN for HD12-28) / SOURCED ELD-C5 |
| Tail end x | −219.48 | −226.27 | −163.95 | DERIVED (edge − body length) |
| Lower-bout width (±y) | 406.4 (±203.2) | 406.4 TRIAL | 371.48 (±185.74) | SOURCED / TRIAL / SOURCED |
| Waist width | 280.99 | 280.99 TRIAL | UNKNOWN → drawing default 235 | TAY-DN |
| Upper-bout width | UNKNOWN → drawing default 292 | same | drawing default 280 | — |
| Depth (z of back) | 117.475 at soundhole | TRIAL 117.475 | 101.6 | TAY-DN / ELD-C5 |
| Lower-bout max x, waist x, upper-bout max x | drawing defaults: −110, 60, 220 | same | −80, 90, 255 | UNKNOWN |
| Soundhole centre x, Ø | drawing default 185, Ø 100 | same | drawing default 225, Ø 85 | UNKNOWN |
| Bridge plate | drawing default 150 (y) × 30 (x), centred at x = −8 | same, 12 pins | tie-block 185 × 30 | UNKNOWN |
| Nut width | drawing default 43 | 46.04 SOURCED | 50.8 SOURCED (ELD-C5) | |
| 12th-fret fingerboard width | drawing default 54 | 57.15 SOURCED | drawing default 62 | |
| String plane height over top at saddle | drawing default 12 | same | 12 | UNKNOWN |
| Courses | 6 single | 6 courses (12 strings); octave pairing on lower 4 drawn as a DRAWING DEFAULT (lesson "in common arrangements") | 6 single | |

Invariants: the soundhole lies wholly between the bridge plate and the body edge; the 12th fret on the
14-fret guitars lies **35.33 mm (steel) / 34.50 mm (12-string) beyond the body edge on the neck**
(DERIVED); on the nylon guitar the 12th fret IS the body edge.

## 3. Named anchors

`ag.saddle` (0,0,0) · `ag.fret12` (x12, 0, h) · `ag.joint` (x_edge, 0, h) · `ag.nut` (L, 0, h) ·
`ag.hole.center` (x_sh, 0, 0) · `ag.hole.rim` circle · `ag.bridge.plate` · `ag.body.outline` (spline
through the bout/waist points of §2) · `ag.body.back` plane z = −depth · `ag.side.bass` / `ag.side.treble`
(y = ∓ half-width) · `ag.upperBout.treble` (x_upper, +0.6·half-width, 0) · `ag.headstock` (beyond the nut;
length drawing default 190). h = string/fretboard height above the top: drawing default 12 at the saddle,
rising to 18 at the joint (UNKNOWN).

## 4. Recommended starting zones (each verified against the lesson)

d = distance from `mic.ref` to the named target along the mic axis; the mic stands in front (z > 0)
unless stated.

| Zone id | Target / region | d (mm) | Verification | Source |
|---|---|---|---|---|
| `zone.ag.fret12` | `ag.fret12`, aim between the upper soundboard and nearby strings | 152.4–304.8 | **CONFIRMED** L12/L30 ("6-12 inches (15-30 cm) … near the 12th fret") | S-PGA27 |
| `zone.ag.hole` | `ag.hole.center` | 152.4–304.8 | **DIFFERENT (wording)**: Shure gives the sound hole the same band ("Place near the sound hole for a full sound"); L28 "closer to the sound hole" should read "near" | S-PGA27 |
| `zone.ag.joint.mount` | clip-mounted capsule between `ag.joint` and `ag.hole`, aim toward the hole for more level | no number; capsule z drawing default 60 | **CONFIRMED** L28 (no number exists) | DPA-AG, DPA-MOUNT |
| `zone.ag.stage.underFret` | on the body under the fretboard end, aim upward (−y), away from the monitor | no number | **CONFIRMED** L44 | DPA-AG |
| `zone.ag.b.8in` | `ag.hole.center` | 203.2 | not in lesson (optional extra) | S-REC/S-LIVE |
| `zone.ag.b.3in` | `ag.hole.center` | 76.2 | not in lesson ("Very bassy, boomy" row) — use as the "too close to the hole" demonstration | S-REC/S-LIVE (Medium pairing) |
| `zone.ag.b.bridge` | `ag.saddle` | 101.6–203.2 | not in lesson; supports L18 "toward bridge" | S-REC/S-LIVE |
| `zone.ag.b.side` | (0, −half-width − 152.4, 0) = (0, −355.6, 0) on the steel guitar, aim +y | 152.4 from the bass side | not in lesson | S-REC/S-LIVE; half-width at the bridge TRIAL = lower bout |
| `zone.ag.taylor` | `ag.upperBout.treble` (drawing-default point) | 304.8 | not in lesson; a third adjacent start | TAY-REC |
| `zone.ag.room2` | second mic for the S-REC two-mic tip | 1219.2 from the hole | optional | S-REC |
| `pair.ag.xy` | coincident, 90° included (drawing default), at `zone.ag.fret12` | | L41 CONFIRMED (concept) | S-STEREO, DPA-STEREO |
| `pair.ag.ortf` | 170 spacing, 110° included | | L41 "near-coincident" | DPA-STEREO ("spaced 17 cm (7 in)") |
| `pair.ag.spaced` | one at `zone.ag.fret12`, one at `zone.ag.b.bridge`; spacing free | | L41/L42 | S-STEREO |

Lesson's "step back in a good room" (L21) and "move closer with directional mic" (L24) carry no number:
draw as arrows along the mic axis, not zones.

## 5. Player posture and reach envelopes (ILLUSTRATIVE; all DRAWING DEFAULTS)

No source gives guitarist geometry. Mark every value `placeholder: true`; the owner checks on the phone.

| Envelope id | Region in frame G (mm) | Use |
|---|---|---|
| `env.ag.strum` | box x ∈ [−60, 160], y ∈ [−180, +180], z ∈ [0, 130] (picking hand + pick swing over hole and bridge) | keep-out for stand mics; a clip capsule may sit at its edge |
| `env.ag.fret` | x ∈ [x_edge − 20, L + 20], y ∈ [−70, +100], z ∈ [−90, +110] (fretting hand around the neck) | keep-out |
| `env.ag.body` | seated player torso behind the guitar: z < −depth − 10, x ∈ [−300, 300], y ∈ [−550, +250] | keep-out |
| `env.ag.head` | sphere r 110 centred (150, −470, −230) (head above and behind the upper bout) | keep-out; the sight line from the eyes to (x_edge + 150, 0, h) must stay ≥ 60 from any stand or mic |
| `env.ag.move` | the whole guitar may shift ±60 in x, y, z and rotate ±10° (lesson L33 "several centimeters") | readout "distance changes with movement" |
| Neck elevation | default 0° (neck level); real players tilt the neck up ~0–45° (not sourced) | posture slider later, if the owner wants it |
| Standing | same envelopes, guitar raised on a strap: world y shift drawing default −250 | |

Collision fail state: any mic, stand or cable segment inside `env.ag.*` = "move it", never a hard block
(labs never block navigation).

## 6. Readouts

Distance to target (grille front), lateral position along x as "fret 12 · joint · hole · bridge" labels,
aim angle between the mic axis and the vector to the target, in/out of a recommended zone, clip fit
(guitar depth must lie in DPA-MOUNT 35–122 mm: steel 117.475 ✓, nylon 101.6 ✓ — DERIVED).

## 7. GUITAR BODY FAMILY (build once)

One parametric component: outline (body length, lower/waist/upper bout widths and their x stations),
depth (tail and neck end), scale L, frets-to-body, fret formula (§2), sound openings
{round hole | oval hole | twin f-holes | resonator coverplate | membrane head | rosettes (×1–3)},
bridge {pin | tie-block | floating | biscuit/spider | banjo bridge}, neck + headstock {flat | slotted |
bent-back pegbox}, course count and pairing, cutaway flag. Variants and their defaults:

| Variant | Parameters (key in that lesson's SOURCES.md) |
|---|---|
| Steel 6, 12-string, nylon | this file §2 |
| Acoustic bass guitar | C07: Martin BC-16E (34" scale, 17th-fret joint, 0000/M-14 cutaway body) |
| Resonator (single cone / tricone) | C03: National 9.5" single cone (cone Ø SOURCED); body = steel default TRIAL |
| Mandolin A/F, ukulele ×4, banjo pot | C05 files |
| Oud bowl | C13 file (all drawing defaults) |

## 8. UNKNOWNS for the owner

1. Bout stations, upper-bout width, soundhole size/position, bridge plate (drawing defaults above).
2. Neck elevation and seated/standing defaults; head position.
3. 12-string octave-course order (drawing default: octave pairs on strings 3–6, unisons on 1–2).
4. Show the Shure booklet rows (3 in / 8 in / bridge / side) as extra starting points, or keep only the
   lesson's two? (Recommended: add 3 in as the "boomy" demonstration point.)
