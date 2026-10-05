# A01a Trumpet: GEOMETRY PROPOSAL — and the BRASS BELL FAMILY (frames, zones, radiation layer)

Status: PROPOSAL, no app code. Sources: `trumpet/SOURCES.md` (Lab 3 keys in §0). Value classes as in
`kick/GEOMETRY_PROPOSAL.md`: **SOURCED / DERIVED / TRIAL / UNKNOWN**; every UNKNOWN the picture needs is a
**drawing default, not a published figure** (`placeholder: true`, never a readout). Flugelhorn, trombone,
bass trombone, euphonium, tuba and French horn reuse §1, §3, §5 and §6 with their own parameter rows.

## 1. Frames (whole brass family)

**Frame Bb (bell frame, mm).** Origin **Bb0 = centre of the bell rim plane**. **+x** along the bell axis,
out of the bell (the direction the bell "fires"). **+y** down (charter y-down). **+z** to the player's right.
All published distances "from the bell" (Shure, DPA, MDAT) are measured from Bb0 to the mic's grille front
(lab convention, said on screen; the acoustic centre is not the grille — kick L39 rule).

**Frame W (world).** Origin on the floor below the player's lips; +X toward the audience, +Y down
(floor Y = 0, heights negative), +Z player's right. The posture places Bb in W (§4).

Views: **side** (screen X = x, Y = y), **top** (X = x, Y = z), and a **player view** in W showing the
movement envelope. One 3-D mic position, one aim vector; readouts from 3-D values only.

## 2. Instrument row (trumpet)

| Symbol | Value (mm) | Class | Source |
|---|---|---|---|
| `D_bell` | 123 | SOURCED | YTR-2330 "123mm (4-7/8")" |
| `bore` | 11.65 | SOURCED | YTR-2330 |
| `L_tube` | 1400 (label only) | SOURCED | PL-2010 "approximately 1.4 m" |
| overall length mouthpiece → bell rim | drawing default 480 | UNKNOWN | — |
| bell flare length (rim → start of flare) | drawing default 200 | UNKNOWN | — |
| valve block (3 pistons) centre, from rim | x = −300, y = +40; casing Ø 24, spacing 26 | UNKNOWN | drawing defaults |
| mouthpiece cup at | x = −480 on the axis | UNKNOWN | drawing default |
| mutes: protrusion beyond rim | straight/cup/Harmon drawing default 60–120; plunger = hand-held disc Ø 140 in front of the rim | UNKNOWN | drawing defaults (lesson L20: "protrusion" varies) |

## 3. Shared brass anchors and envelopes

`br.bell.rim` (circle r = D_bell/2 in the plane x = 0) · `br.bell.axis` (the +x ray) ·
`br.bell.edgeAim` = the rim point nearest the mic (aim target for "toward the bell edge") ·
`br.valves` · `br.mouthpiece` · `br.player.head` (sphere r 110 at the mouthpiece end, drawing default).

**Bell travel envelope `env.br.bell`** (ILLUSTRATIVE, drawing default): the bell axis sweeps ±15° yaw and
±10° pitch about the mouthpiece (lesson L6 "watch how far the bell moves"; no source gives a number).
**Valve-hand envelope**: box 120 × 100 × 120 around the valves. **Mute path**: cylinder r = D_bell/2 + 30,
x ∈ [0, +150]. No mic, boom or cable may enter these (fail state "move it", never blocking).

## 4. Trumpet posture (ILLUSTRATIVE, drawing defaults)

Standing player; lips at W (0, −1550, 0); bell axis horizontal, pointing +X, rim at X = +480 (seated:
lips Y = −1150). Bell may dip 10° for soft playing (drawing default). Behind-the-bell listening point =
the player's ears at (−80, −1620, ±80) — used to show DPA's "the wrong side of the instrument".

## 5. Starting zones (each verified; distances from Bb0)

| Zone id | Region | Verdict / source |
|---|---|---|
| `zone.tp.dpa` | d ∈ [300, 500], aim offset 5–20° off axis ("slightly off axis" — the angle band is a drawing default) | CONFIRMED, DPA-TPT |
| `zone.tp.dpa.warm` | same d, mic axis tilted down or sideways up to 45° | ADD, DPA-TPT "up to 45º" |
| `zone.tp.shure` | d ∈ [304.8, 609.6]; on axis = "bright", to one side = "natural or mellow" | CONFIRMED, S-BWS/S-LIVE/S-REC |
| `zone.tp.mdat` | d ∈ [609.6, 1219.2], aimed at the bell edge | ADD (survey 3d-2), MDAT |
| `zone.tp.royer` | d ∈ [609.6, 1524], mic 152.4 below the bell axis | ADD (optional, ribbon), ROY-BRASS |
| `zone.tp.room` | d ≈ 3000 in a large room | CONFIRMED number (lesson text says "several-meter" → fix), DPA-TPT |
| `zone.tp.back` | close, behind the bell (x < 0, beside the bell flare); no distance | CONFIRMED, no number → drawing default 100–200 |
| `zone.tp.clip` | gooseneck capsule in front of the rim, aimed between centre and edge; reach ≤ 140 (4099 gooseneck, `SOURCES_SHARED.md` MKT-4099) | CONFIRMED, DPA-MOUNT |

The overlap DPA ∩ Shure = [304.8, 500] is drawn as the shared "starting region" (lesson L85 "roughly
30–60 cm").

## 6. Radiation layer (brass family; qualitative, sourced trend)

- Two bands only: **low (< ~500 Hz)** drawn as a near-sphere around the bell; **high (≥ 1 kHz)** drawn as a
  lobe on `br.bell.axis` that narrows as frequency rises. Trumpet text: PL-2010 "At 1 kHz and above the
  directivity is increased in the front direction"; symmetric about the axis.
- The lobe never carries dB numbers (PL-2010 gives plots, not a table). Tag: "measured trend (Pätynen &
  Lokki 2010), not to scale".
- Readout `offAxisDeg` = angle between `br.bell.axis` and (mic − Bb0); words: 0–15° "on axis — bright",
  15–45° "off axis — softer top" (Shure words; band edges are drawing defaults).

## 7. Readouts

Distance grille→Bb0 (cm and in, ≈ 5 mm display), off-axis angle, aim error to `br.bell.edgeAim`, in/out of
each zone (source tag), collision with `env.br.bell`/valve hand/mute path, stand-vs-clip toggle, mono-sum
panel (spot + 3 m room: Δt from `SOURCES_SHARED.md` §1), headroom chain (capsule → pad → transmitter → preamp
→ converter; DPA's ">140 dB" peak note) — never a fixed limiter number (L8).

## 8. Invariants

Zones lie on +x (except `zone.tp.back`); `zone.tp.dpa` ⊂ [300, 500]; the overlap region equals
[304.8, 500]; no readout reads a drawing default; the trumpet bell Ø equals 123 in every view.

## 9. Owner list

Overall length/valve layout/bell flare (drawing defaults); bell-travel angles; whether to show the
Royer and MDAT zones (both ADD); lesson fix "several-meter" → "about 3 m".
