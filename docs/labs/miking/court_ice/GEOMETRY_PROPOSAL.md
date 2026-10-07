# B14 Court, Racket and Ice Sports: GEOMETRY PROPOSAL — defines the shared BOUNDARY / PLANT tools

Status: PROPOSAL. Uses frame P (`field_diamond/` §1) and the parabolic tool (`parabolic/`).

## 1. Scenes (outlines are drawing defaults unless marked)
| Scene | Outline | Clearance drawn | Class |
|---|---|---|---|
| Practice line | mock boundary; A/B/C at 2/5/8 m inside, M 3 m outside → 5/8/11 m | lesson TRIAL | CONFIRMED arithmetic |
| Basketball | 28 × 15 m (common, not read) | ≥ 2 m obstruction-free band | SOURCED FIBA (Medium) |
| Volleyball (indoor) | 18 × 9 m | free zone 3 m (5/6.5 m for top events), 7 m (12.5 m) height in section view | SOURCED FIVB (Medium) |
| Tennis | 23.77 × 10.97 m (common, not read) | run-off as hatched; net posts carry "approval only" badge | drawing default |
| Badminton | 13.4 × 6.1 m (common, not read) | posts | drawing default |
| Ice hockey | 60 × 30 m rink (common IIHF size, not read), boards + glass | ice-facing surface "no hardware" | drawing default |

## 2. New shared tools (build once, `lessons/shared/sports/`)
1. **Boundary mic token + reflection tool** (section view): capsule height h above a surface, source point; draws direct
   and reflected paths; readout first notch c/(4h·cosθ)-style from the drawn geometry (DERIVED; `court_ice/SOURCES.md`).
   "On the surface" state = boundary. Note "soft mats are not a large hard surface" (B15).
2. **Plant + mount token**: airborne capsule on an isolated mount vs rigid clamp; a "vibration path" arrow (drawn only).
   Contact sensor token (separate symbol, labelled "hears the structure, not the air").
3. **Short shotgun / compact directional tokens** with ideal lobar/supercardioid overlays; words for frequency dependence.
4. **Headroom chain panel** (shared by B13–B17): capsule → adapter/transmitter → receiver → preamp → converter → bus;
   "first overloaded stage" exercise; trial target "strongest gentle test peak near −12 dBFS".

## 3. Starting setups
ONE MIC: short shotgun at M aimed at B, capsule 1 m. TWO MICS: second position overlapping at B (Δt + notches; move to
A/C). CLOSE · LIVE: approved floor boundary beyond the 2 m band (basketball). FARTHER BACK · STUDIO: fixed ambience.
ANOTHER START: isolated basket-area plant ("only with express approval").
