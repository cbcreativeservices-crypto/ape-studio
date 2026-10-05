# E14 Full Orchestra: GEOMETRY PROPOSAL — defines the STEREO-ARRAY TOOL and the SEATING-PLAN builder (frame S)

Sources: `full_orchestra/SOURCES.md` (§A arrays, §B seating), `lead_vocal/SOURCES.md` §0. Plan level only.

## 1. Frame S (stage), shared by every ensemble lesson (E02–E16)
- Units mm. Origin = **downstage centre edge of the performing area** (front edge of the front row for an
  orchestra; front riser edge for a choir). +x **upstage** (toward the back rows), +z toward the **conductor's
  left** (= the audience's left; conductor and audience both face upstage), +y down (height = −y). Two views: plan (x, z) and section (x, y). All seating
  descriptions below are "as the conductor faces the ensemble".
- `cond.podium` = (−1000, 0, 0) drawing default (podium position relative to the front desks is UNKNOWN).
- Every instrument/person is a token from the Labs 1–4 families (plan footprint) or the voice family (E01).

## 2. Stereo-array tool (one component, presets)
Array object: centre point `a.c` (x, y, z), aim azimuth/elevation, and a preset:

| Preset | Geometry (array frame: +u forward, +w left) | Locked? | Source |
|---|---|---|---|
| `xy` | 2 cardioids coincident, included angle α ∈ [90°, 135°], default 90° | angle slider | DPA-STEREO, S-REC |
| `ortf` | 2 cardioids, capsules at w = ±85, angle 110° included (±55°); recording angle 95° drawn as a wedge | **locked** 170/110 | SCH-MSTC74 |
| `nos`, `din` | 300/90°, 200/90° | locked | DPA-STEREO |
| `ab` | 2 omnis, spacing s ∈ [400, 600] default 500; extended range up to 2500 shows "centre hole" warning above 1000 | slider | DPA-AB-ORCH |
| `ab.shure` | s ∈ [914.4, 3048] | slider | S-LIVE |
| `ms` | cardioid Mid forward + figure-8 Side, coincident; width = S gain | slider | UA-MS |
| `decca.schoeps` | L (0, +1000), R (0, −1000), C (+1500 forward, 0); omnis; L/R outward turn β ∈ [0°, 45°] default 0; spheres optional (Ø ≈ 40) | sliders, constraint all pair distances ≥ 1500 | SCH-SURR |
| `decca.pellowe` | C at the orchestra front edge; L/R 762 back, 1524 apart | alt preset (D-DT1) | PELLOWE |
| `outriggers` | 2 omnis at w = ±3048 from the tree centre line, 1524 in front of the front strings, same height as tree | **drawing default from practice** (label) | PELLOWE, ARI-DECCA |

Heights (section view): `ab` and `decca` default 3200 above the stage floor (PELLOWE; inside DPA 3000–4000 and Tape
Op 2438.4–3048 above the conductor; ARI ≈ 3000). Array over/behind the podium by default (DPA-AB-ORCH).

Readouts (DERIVED, "calculated from the drawing", 20 °C, c via CALC-C): per-source arrival-time difference
between capsules (ms), spacing in mm/in, which sources lie inside the recording angle (ORTF 95°; X/Y and others:
UNKNOWN recording angle → no inside/outside readout, only a coverage cone drawn from the polar data), mono-sum
note, centre level for Decca (−4 to −5 dB, SCH-SURR, label "SCHOEPS example"), panning note (Pellowe: tree L/R
half, outriggers hard — historical).

Rules: 3:1 never applied between capsules of one array (§0.2). Path-difference delay readout:
Δt = Δd / c (1 m → 2.914 ms at 343.21 m/s; lessons' "2.9 ms at 343 m/s" CONFIRMED), with DPA-MULTI's > 4 m
threshold note and its "do not blindly align" warning.

## 3. Seating-plan builder (orchestra preset)
- Presets: `orch.american` (high-to-low strings left→right as the conductor faces them: Vn1, Vn2, Va, Vc,
  basses behind the cellos; JAX-SEAT "from high to low, left to right"; the inner-right order Va/Vc varies —
  drawing default Va inner, Vc outer per JAX-SEAT "cellos on the right").
  `orch.german` (Vn1 left, Vc+Cb beside Vn1, Va beside Vn2, Vn2 right; conductor's view). Winds centre behind
  strings, brass behind winds, percussion/timpani rear, harp/keys at a side (lesson L5, ABSIL general layout).
- Section counts, chair pitch, desk depth, riser heights: UNKNOWN → drawing defaults (e.g. ABSIL strings
  8+7+5+4+2 as the studio-orchestra example only).
- Section-support zones: directional mic r ∈ [1000, 1500] from the covered players, covering 3–4 musicians
  (DPA-MULTI) — drawn as a cardioid acceptance fan over 3–4 chair tokens.
- Rigging overlay: any flown/hung item shows "approved rigging plan and qualified crew" (lesson L54); no
  rigging geometry is drawn.

## 4. Owner list
1. Default Decca preset: SCHOEPS 2 × 1.5 m (lesson) vs Pellowe's smaller tree. 2. Accept outrigger defaults from
practice (no maker standard exists). 3. Default height 3.2 m. 4. Seating presets American + German enough?
