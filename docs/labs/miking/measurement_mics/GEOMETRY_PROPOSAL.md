# F11 Measurement Microphones and Calibration: GEOMETRY PROPOSAL — defines the shared MEASUREMENT family (frame M)

Status: PROPOSAL. No app code. Sources: `measurement_mics/SOURCES.md` (keys in §0). Value classes as
`lead_vocal/GEOMETRY_PROPOSAL.md`: SOURCED / DERIVED / PRACTICE / UNKNOWN → **drawing default** (`placeholder: true`,
never a readout). Learner text: suggested starting points, no brands, no standard numbers as citations (a standard
may be NAMED only as "the method you were given" — owner decision D-6B-3).

## 1. Frame M (measurement) — owned by Lab 6b group 1, used by F11–F16 (and F12's site, F13's room, F14's venue)

- Units mm in the bench view, m in room/site views (scene frame shared with Lab 6 part 1, see §5).
- **Origin = the capsule's diaphragm centre** for the bench/chain view; +x along the capsule axis (front), +y down.
- Every measurement-mic drawing carries: capsule (1/2 in default, 1/4 in variant), protection grid (removable),
  preamp body, cable, the power/conditioning box, analyzer/recorder. Sizes: 1/2 in = 12.7 mm (conv.), 1/4 in =
  6.35 mm (conv.) nominal capsule diameters — DERIVED from the name; body lengths drawing default.
- Generic only: no maker likeness.

## 2. Objects (the family to build once: `lessons/shared/measure/`)

| Object | Geometry | Class |
|---|---|---|
| Measurement mic, three response types: free-field / pressure / random-incidence | same body; a label ring + the incidence arrow differ | SOURCED types (GRAS-FF) |
| Incidence arrow | free-field: source on axis (0°) — PRACTICE "often 0°"; random-incidence: "sound from many directions" drawn as a fan; pressure: coupler/flush | PRACTICE / SOURCED |
| Acoustic calibrator + coupler; 1/4-in adapter | cylinder body with cavity seated over the capsule; output selector 94 / 114 dB, 1 kHz | SOURCED (NTI-CAL); size drawing default |
| Power paths | three plugs: polarization supply, CCP/IEPE constant-current, 48 V phantom; join rules in §3 | SOURCED in substance (GRAS-POL, not re-read) |
| Sturdy stand + boom; windscreen ball | stand drawn on the floor; operator keep-away ring around the capsule | PRACTICE (radius drawing default 1 m) |
| Sound level meter (whole instrument) | for F12; handheld body + capsule + windscreen, on a tripod | drawing default sizes |

## 3. Pages that are NOT placement scenes (new rack type: **chain rack**)

1. **Chain builder** (capsule → preamp → power → input → analyzer): a join is refused with its reason (prepolarized on
   a polarization supply, externally polarized on CCP, either on bare phantom without the approved adapter). Safety
   line exact: "do not experiment with pinouts or apply power to an unverified sensor".
2. **Field picker**: free-field / pressure / diffuse; the drawn capsule rotates to the matching incidence; a wrong
   pairing shows "check the correction for this field".
3. **Calibrator check**: seat (fit OK/poor), PRE value, run, POST value (unadjusted), drift = POST − PRE; the result
   is labelled "relative only" whenever any link is unknown. No tolerance number is invented — the method supplies it
   (the learner sets the tolerance from a brief).
4. Readouts: 94 dB SPL ≈ 1 Pa via the sensitivity calculator; mV/Pa ↔ dB re 1 V/Pa via calc.

## 4. STARTING SETUPS (journey §6 stage 2) for F11

- ONE MIC: free-field mic on a stand, aimed at a small loudspeaker on axis, operator outside the keep-away ring,
  distance drawn as a dimension marked "logged distance" (drawing default 1 m; never shown as a rule).
- TWO MICS: two channels at the same position class, each with its own sensitivity record ("same model ≠ matched").
- CLOSE · LIVE: venue listener position (hand-off to F14's seats).
- FARTHER BACK · STUDIO: diffuse/random-incidence mic in a reverberant room (hand-off to F13).
- ANOTHER START: calibrator seated on the capsule (the only "distance" is zero: the coupler).

## 5. Dependencies and shared pieces

- **Scene frame F** (ground plane, metres, scene front) — owned by Lab 6 part 1's first group if it builds first;
  otherwise group 1 here builds it in `lessons/shared/field/sceneFrame.ts` and part 1 imports it. Agree the path.
- Reuses: `engine/physics/levels.ts` (inverse square), calc `leq`/`combine`/sensitivity, the app's Learn concept
  `rt60-t20-t30-edt` wording for consistency (F13).
- New, built once: `shared/measure/` (objects above, chain rack, calibrator check, "relative / calibrated" label
  logic, log-sheet fields).

## 6. Owner list
1. Chain rack as a new page type (no mic dragging) — D-6B-1.  2. Naming standards (IEC 61672 etc.) in learner text — D-6B-3.
3. Operator keep-away radius default (1 m drawing default).
