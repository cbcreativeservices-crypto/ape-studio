# B16 Motorsport, Equestrian and Aquatic: GEOMETRY PROPOSAL — defines the MOVING-SOURCE (pass-by) tool

Status: PROPOSAL. Uses frame P, `sports.practiceSmall` (B15 §1), the headroom panel, the stereo-array tool (Lab 5).

## 1. Moving-source tool (build once, `lessons/shared/sports/passBy.ts`)
- A source travels a path (line or arc) past fixed mics; a scrubber (finger drag, UI thread) sets its position s.
- Readouts at s (DERIVED, ideal model): range to each mic, inverse-square level change vs the closest point, Δt between
  two mics and the resulting comb notches — showing that a delay fixed at one point is wrong elsewhere (B13–B17's shared
  lesson). No pitch/Doppler number is shown (lesson L257: a walk is not a speed measurement); a static "pitch rises on
  approach, falls on departure" note only.
- Aim modes: oblique along the segment vs across it (lesson L63).

## 2. Scenes (drawing defaults; no rule dimensions read)
| Scene | Elements | Keep-outs |
|---|---|---|
| Circuit / rally pass-by | track segment, barrier/fence, spectator area, approved media point | track, run-off, marshal escape routes |
| Jumping arena | course plan, fences, approach/landing/recovery envelopes, gate | arena while a horse competes; no mic on horse/tack/rider |
| Pool | lanes, blocks, start speakers, timing pads, deck | blocks, timing, start system, deck routes |
| Hydrophone (optional) | container section: water depth, sensor depth, wall/bottom distances | "dry side" for every connector |

Animals: a generic horse silhouette in plan only (owner decision D7-3), no detailed figure.

## 3. Starting setups
ONE MIC: fixed directional at an approved pass-by point aimed obliquely along the segment. TWO MICS: M1 + M2 on the
practice path (pass-by Δt). CLOSE · LIVE: arena perimeter sector aimed at a landing region. FARTHER BACK · STUDIO:
coincident stereo ambience. ANOTHER START: optional hydrophone in a container (if the owner keeps it).
