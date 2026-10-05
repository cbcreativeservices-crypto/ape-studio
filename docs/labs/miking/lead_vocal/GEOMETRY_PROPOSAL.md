# E01 Lead Vocal: GEOMETRY PROPOSAL — defines the shared VOICE/HEAD family (frame V)

Status: PROPOSAL. No app code. Sources: `lead_vocal/SOURCES.md` (keys in §0). Value classes as
`kick/GEOMETRY_PROPOSAL.md`: SOURCED / DERIVED / TRIAL / UNKNOWN; a drawing that needs an UNKNOWN uses a
**drawing default** (`placeholder: true`, never shown as a readout, on the owner list).
The app shows **suggested starting points** only; zone labels say "starting point".

## 1. Frame V (voice) — used by E01–E07 and every singer in E08–E16

- Units mm. **Origin = lip point**: centre of the lip opening on the mid-sagittal plane (lessons measure "from
  the mouth"). +x forward along the mouth axis (horizontal when the head is level), +y **down** (charter),
  +z to the singer's left. Head pitch θ_h (nod) and yaw ψ_h rotate the mouth axis; default 0.
- Two views from one 3D model: **side** (x, y) and **plan** (x, z). Children (E06) use **plan only** (lead ruling).
- `v.mrp` = (25, 0, 0) SOURCED (GRAS-44AB, ITU-T P.51/P.58 practice), drawn as a small tick labelled
  "telecom reference point", not used for readouts.
- `v.nose` (aim target alternative): between nose and mouth is the S-REC aim; drawn as the segment from the lip
  point to the nose tip. Nose tip offset: **drawing default** (head outline is UNKNOWN, see §2).

## 2. Head/torso outline

| Item | Value | Class |
|---|---|---|
| Head width, depth, height; nose, chin, eye-level offsets | UNKNOWN (IEC 60318-7 / ANSI S3.36 numbers not read) | drawing default (adult), `placeholder: true` |
| Eye level above lip point | UNKNOWN | drawing default; used only to place N-POP "about eye level" overhead option |
| Standing lip height above floor | UNKNOWN | drawing default; stands are drawn relative to the lip point, so no readout depends on it |
| Child head (E06) | not drawn in side view | plan-view footprint only (drawing default) |

Rule (visual charter): the head is a real line-art head (house head-icon spec: minimal bald line-art), never a
circle stand-in.

## 3. Mic, pop filter and zones (all distances lip point → capsule front reference `mic.ref`)

| Zone id | Geometry | Class / source |
|---|---|---|
| `zone.v.shure` | on axis, r ∈ [100, 200] | SOURCED S-VOC-REC |
| `zone.v.neumann` | on axis, r ∈ [200, 300] | SOURCED N-VOC |
| `zone.v.dpaClose` | on axis, r = 101.6, rehearse [50.8, 152.4] | SOURCED DPA-VOC-STUDIO (conv.) |
| `zone.v.loose` | r ≈ 304.8 | SOURCED DPA-VOC-STUDIO ("around 12 inches") |
| `zone.v.stage` | r ≤ 100 | SOURCED DPA-VOICE |
| `zone.v.sm58.close` | r < 150, on axis | SOURCED S-SM58-UG |
| `zone.v.sm58.nose` | r ∈ [150, 600], mic "just above nose height" | SOURCED; nose height = drawing default |
| `zone.v.sm58.side` | r ∈ [200, 600], "slightly off to one side" | SOURCED; "slightly" angle UNKNOWN → drawing default 20° yaw |
| `zone.v.sm58.far` | r ∈ [900, 1800] | SOURCED |
| `zone.v.below` | mic lowered off the mouth line (sibilance) | SOURCED direction (S-VOC-REC); amount UNKNOWN → drawing default 30° below axis |
| `zone.v.overhead` | mic above, at "about eye level", angled down to the mouth (no-pop-screen option) | SOURCED N-POP; eye level drawing default |
| `pop.screen` | plane between lip and mic, ≥ 100 from the mic (`d_pop_mic ≥ 100`), tilted a few degrees from parallel to the capsule | SOURCED N-POP / N-VOC; tilt angle UNKNOWN → drawing default 10° |

Constraint check (DERIVED): a pop screen ≥ 100 mm from the mic only fits zones with r > 100 + screen thickness;
in `zone.v.shure` at r = 100 the screen would touch the lips → the tool shows "move back or use the built-in
windscreen" instead of drawing an impossible screen.

## 4. Readouts (all "calculated from the drawing", qualitative where unsourced)

- Distance r (mm / in), off-axis angle of the mouth in the mic's polar frame.
- **Proximity**: only the sourced statement (SM58 example: +6 to +10 dB below 100 Hz at about 6 mm) and a
  monotone "more bass as you move in" indicator for directional mics; omni shows "no directional proximity
  effect" (lesson L30). No invented dB curve.
- **Plosive risk**: ON when the mic lies inside the drawing-default air-jet cone (`placeholder`) and no pop screen
  is between; label "illustrative".
- **Direct-to-room** indicator: qualitative arrow (closer → more direct), inverse-square −6 dB per doubling
  (S-LIVE) is the only number shown.
- Monitor null: §0.1 angles; wedge snaps "safe" when inside ±15° (drawing default tolerance) of the null.

## 5. Live layout (plan view, frame V)
- Wedge for cardioid: on the mic's rear axis, i.e. in front of the singer, facing them (S-SM58-UG, S-VOC-TIPS).
- Wedge(s) for super/hyper: at ±(180−126)=±54° / ±(180−110)=±70° from the rear axis (DERIVED from S-LIVE); show
  the S-REC 65° variant note (D-POL).
- Wedge distance from the mic and wedge size: UNKNOWN → drawing default.
- Headset/earset: capsule "according to the manufacturer's instructions" (lesson); no number → drawn at a
  drawing-default point near the mouth corner, labelled "follow the headset maker".

## 6. Owner list
1. Approve drawing-default head (adult) and the lip-point origin. 2. Default studio distance (150 mm, D-LV1).
3. Show SM58 rows by model name? 4. Air-jet cone default (illustrative only).
