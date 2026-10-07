# F12 Sound Level and Environmental Noise: GEOMETRY PROPOSAL

Status: PROPOSAL, no app code.

## 1. Frames
Scene frame F, plan + side; metres. Frame M objects (SLM on tripod, windscreen, calibrator).

## 2. Drawable model
| Item | Geometry | Class |
|---|---|---|
| Site: road with traffic lane, a house facade, open lawn, HVAC unit, tree line | plan, drawing-default sizes | drawing default |
| Receiver A (open) and B (facade) + A-repeat | SLM tripod; capsule height **1.5 m (5 ft)** in the "highway method" preset | CONFIRMED (FHWA-FG), shown as "the method's height", other presets unlabelled height |
| Facade positions | 3 m (10 ft) from the side; 2 m (6.6 ft) from the facade midpoint; against-facade | CONFIRMED (FHWA-FG) — used only in a "building method" preset |
| Operator keep-away and tripod | ring around the SLM | PRACTICE |
| Wind arrow + windscreen | 5 m/s exclusion shown only in the "park monitoring" preset | CONFIRMED (NPS-RM47) |
| Keep-outs | road lane, water edge, power line (3 m, OSHA-ELEC) | SOURCED where numbered |

## 3. Non-placement pages
- **Level-descriptor tool**: a SYNTHETIC time history (labelled "a made-up example, not a measurement") from which
  LAeq,T (calc `leq`), LAFmax, L10/L50/L90 are computed; shows why mean-of-dB is wrong.
- **Background subtraction**: energy subtraction 10·log10(10^(Lt/10) − 10^(Lb/10)); refuses when Lt − Lb is below
  the method's limit (D-6B-8). NEW calculator workspace needed (none exists) → lands on `audio-tools-engine` under the
  calculator rule; builder stubs the call and notes it.
- **Log sheet**: typed fields only (no GPS, no location permission).

## 4. STARTING SETUPS
ONE MIC: SLM at receiver A, open position, method height. TWO MICS: A and B synchronized (two meters, two calibrations).
CLOSE · LIVE: venue audience spot check (hand-off to F14 seat heights 1.2/1.7 m). FARTHER BACK · STUDIO: none
(HVAC unit indoors as ANOTHER START, interior mic ≥ 1.5 m above floor and ≥ 0.9 m (3 ft) from a wall, FHWA-FG).

## 5. Shared / new
REUSE frame M, scene frame F, calc `leq`/`combine`. NEW: descriptor tool + synthetic history generator
(`shared/measure/levelHistory.ts`, deterministic, seeded — no loop), background-subtraction calculator.
