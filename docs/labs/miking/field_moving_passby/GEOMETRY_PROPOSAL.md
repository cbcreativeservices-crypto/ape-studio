# F08 Moving Sources and Pass-bys: GEOMETRY PROPOSAL — defines the shared MOVING-SOURCE PATH TOOL

Status: PROPOSAL. Frame G, sites, wind layers, safety cards, field log: `field_ambience/GEOMETRY_PROPOSAL.md`.
Stereo arrays: Lab 5 `stereoArray.ts`. Image readout: `foley_perspective/GEOMETRY_PROPOSAL.md` §4.

## 1. Scene (plan, frame G)
- Origin = the **closest permitted mic position** (the listening point). A straight path parallel to the x-axis at
  closest distance d_min (drawing default 3 m for the walking exercise; none sourced — L74), from x = −15 m
  (approach) to +15 m (departure). Variants: `walk` (consenting performer on a traffic-free route — the exercise),
  `bicycle` (paper/plan only), `vehicle` (PAPER PLAN ONLY: a permitted closed route, driver, safety lead, crew
  setback zone — never animated as a live pass on the learner's own site, L45).
- Keep-outs: the **path envelope** (subject width + deviation/stopping area; drawing default 1.5 m each side for
  walking, 3 m for the vehicle plan) — no mic, stand, cable or crew inside; operator position fixed outside it; the
  crew never steps toward the action (L35).

## 2. The path tool (NEW, pure + tested: `lessons/shared/field/path.ts`; used by F01, F05, F07, F08, Lab 7)
- `PathDef = { points: Vec3[] (polyline), speedMs: number (drawing default), envelopeHalfWidth: number }`.
- The learner **scrubs** a parameter s ∈ [0, 1] with a finger along the drawn path (no loop, no autoplay — D8;
  silent). At each s the tool returns, per mic:
  - distance r(s) and arrival angle θ(s) (`polar.arrivalAngle`);
  - relative level vs the closest point: −20·log10(r(s)/r_min) (inverse square, ideal, free field);
  - the mic pattern's gain at θ(s) (`polar.gainDb`) — for a TRACKED mic θ stays ≈ 0 (the aim follows the source);
  - **Doppler factor** for the stated speed: v / (v − v_s·cos φ) where φ = angle between the source's velocity and
    the source→mic line (OSX-DOPPLER eq. 17.18 generalised to the radial component; DERIVED, labelled "ideal model,
    steady tone") and its cents; c from CALC-C;
  - for a pair: image position (level / level+time, the F05 image readout) and Δt for two separate mics (`twoMic`).
- Draw: a level-vs-position strip and a pitch-factor strip under the plan, with the current s marked (the strips
  are drawn from the model; never a recording; "a simplified picture" said once).

## 3. Starting setups

| Setup | Geometry | Class | Role |
|---|---|---|---|
| Fixed mono | omni (or a directional aimed at the crossing arc) at the listening point, stand 1.5 m high (drawing default), wind protection | method SOURCED (L12) | **ONE MIC** (worked example) |
| Fixed XY / M/S | `xy` 90° or `ms` at the listening point, facing the path | SOURCED geometry | **TWO MICS** (a coincident pair) |
| Fixed ORTF / spaced pair | `ortf` locked 170 mm / 110° | SOURCED | **FARTHER BACK** role ("a wider image") — `SETUP_PICKS` |
| Tracked shotgun | operator at a fixed safe station, mic swivelled to follow s | method SOURCED (L21) | **CLOSE · LIVE** role ("holds the subject") — `SETUP_PICKS` |
| Start-mic + end-mic | two separate mics near each end (outside the envelope) | method (L24) | ANOTHER START ("two perspectives, not stereo") |

## 4. Safety (exact, plain words; shared cards)
Never on an active roadway; a stand or a cone is not traffic control; nobody and nothing inside the path envelope
or the stopping area; no boom over a public street, railway or track; hearing protection that keeps awareness;
lightning card; the performer or driver watches the route, never the mic.

## 5. Owner list
Vehicle shown in plan only (paper plan) · speeds as drawing defaults (walking 1.4 m/s; vehicle example) · the
pitch strip as an ideal model · people/vehicle art.
