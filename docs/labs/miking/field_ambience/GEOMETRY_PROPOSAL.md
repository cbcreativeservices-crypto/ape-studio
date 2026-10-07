# F06 Natural and Urban Ambience: GEOMETRY PROPOSAL — defines the shared FIELD family (frame G)

Status: PROPOSAL. No app code. Value classes and voice rules as `foley_footsteps/GEOMETRY_PROPOSAL.md`.

## 1. Frame G (field site) — used by F06, F07, F08 (and later F09–F12, Lab 7 outdoor scenes)

- Units **metres in the model with mm precision** (the engine stays mm internally; the site scale tier rounds to
  0.1 m below 10 m, 1 m above — units rule shared with frame F). Origin = the **listening point** on the ground
  (the array's foot). +x right / +y down / +z toward the viewer, as frames S and F, so `stereoArray.ts` works
  unchanged; `face` = the array's plan bearing.
- Views: **plan** (site map, the main view, 5–120 m wide) and a **section/elevation** for the array on its stand
  (array height, windshield, recorder). Plan-only scenes are allowed (`views` without `side`, as E06).
- No compass/north unless a lesson needs it; bearings are relative to the array's front.

## 2. Site presets (NEW art `lessons/shared/field/sites.tsx`, illustrated real places, drawing-default sizes)

| Preset | Contents (plan) | Sources / hazards drawn |
|---|---|---|
| `woodland` | trees (canopy), a stream on one side, a path, birds at bearings, the listening point on the path edge | stream (moving water changes the water-to-bird balance, L32), path keep-out |
| `meadow` | open grass, hedgerow, distant road, wind arrow | open habitat (foam insufficient, CORNELL-ACC) |
| `plaza` | paved square, building facades (reflectors), walkways, a road with two lanes, a café | vehicle lanes + walking paths + access routes as keep-outs (L33) |
| `sidewalk` | street edge, passing traffic direction | traffic keep-out |

Source tokens are illustrated (bird, water, leaves, car, bus, people) with a bearing and range; their levels are
never numbers (no source).

## 3. Arrays at the listening point (Lab 5 stereo-array tool, unchanged)

| Setup | Geometry | Class | Role |
|---|---|---|---|
| One mono mic | an omni (or a directional mic aimed at a region), on a stand, height 1.5 m (drawing default) | method SOURCED (L12); height drawing default | **ONE MIC** (worked example) |
| XY | `xy` 90° (two makers) | SOURCED | ANOTHER START (ambience has no close/live mic role) |
| ORTF | locked 170 mm / 110°, recording angle 95° | SOURCED | **TWO MICS** (a pair) |
| AB omni | spacing drawing default 600 mm (O-8); DPA cardioid 20 cm example shown as a note | spacing drawing default | ANOTHER START |
| M/S | forward cardioid + side figure-8, width control | SOURCED matrix | ANOTHER START |
| Second vantage point | the same array moved to a second permitted point | method (L32) | **FARTHER BACK** (a second position, farther from the main source) |

Roles: ambience lessons fit the journey's roles loosely — the builder records the role choices in `SETUP_PICKS`
(as Lab 5 did) instead of forcing CLOSE/FARTHER labels; nothing invented.

The array's acceptance wedge is drawn in plan (ORTF 95° recording angle SOURCED; XY and AB wedges: no sourced
recording angle in Lab 6 except DPA's 20 cm/±70° AB example → drawn only for that preset; others show the capsule
axes only, `full_orchestra` rule "no recording angle is invented").

## 4. Wind protection (NEW, shared: `lessons/shared/field/wind.tsx` + `wind.ts`)
Layers drawn on the mic as real objects: foam → fur over foam ("softie") → basket/blimp with suspension → fur over
the basket. Each layer's effect is WORDS only (CORNELL-ACC: foam fine inside a forest, not in open grassland; a long-
hair cover is most effective with some high-frequency loss). A wind arrow on the site; the "wind on the capsule"
cue is a drawn turbulence mark at the capsule (illustrative), never a level. Monitoring threshold 5 m/s shown only
on the science card.

## 5. Safety cards (shared, exact wording from the sources, plain words)
- **Lightning** (NWS-LTG): thunder heard → indoors (a substantial building or hard-topped vehicle; not a rain
  shelter, small shed or open vehicle); wait 30 minutes after the last lightning or thunder. A mic recording is
  never a reason to stay out (L46).
- **Wildlife** (NPS-WILD): US national parks ask 25 yd from most wildlife, 100 yd from bears and wolves (some parks
  more); if an animal reacts you are too close; no calls or attractants. Drawn as a setback ring around an animal
  token (SOURCED radius when the preset is a US park; otherwise "local rules").
- **Traffic**: stands off vehicle lanes, walking paths and access routes (keep-outs).
- **Water and weather**: a windshield is not waterproofing; shelter outdoor mics from precipitation (S-SM63).
- **Hearing**: monitor at a safe level; long loud urban exposure → hearing protection (NIOSH-NOISE 85 dBA 8 h,
  internal; learner text without the authority name).

## 6. Field log (shared; extends Lab 5's worksheet `lessons/shared/ensemble/worksheet.ts`)
Fields (typed only, device-local via `createLocalStore`; **no GPS, no location permission** — permissions must match
the binary): date, local time + time zone, site (words), weather and wind, mic type/pattern, array + orientation,
height, wind protection, recorder settings, filters, channel map, take length, events, use restrictions (L40).

## 7. Readouts
Bearing of each source in the array's frame → which channel it favours (XY/ORTF image dot, the F05 image readout);
mono check: XY/M-S "centre holds", ORTF/AB "listen for low end and transients" (words). Level numbers only from
inverse-square between two drawn distances (relative).

## 8. Owner list
O-8 AB omni spacing default · site art (woodland, plaza) · show NPS distances as US-park examples · field log typed
only (confirm no GPS).
