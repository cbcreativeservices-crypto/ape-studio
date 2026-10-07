# B12 Parabolic: GEOMETRY PROPOSAL — defines the shared PARABOLIC DISH tool

Status: PROPOSAL. Builds once: `lessons/shared/sports/parabolic.ts` (+ art). Used by B12, B13, B14, B15, B16.

## 1. Dish model (frame D: origin = dish vertex, +x = dish axis forward)
- Paraboloid y² + z² = 4 f x, rim at x = d. Presets: large (D 660 mm, d 224, f 122) and small (D 406 mm, d 122, f 84)
  — DERIVED (`parabolic/SOURCES.md` §b), `placeholder` until a maker drawing is read.
- Element at the focus, capsule facing the dish (as the maker specifies), handle + optional monopod, wind cover.
- Ray overlay (labelled "simplified picture"): on-axis rays converge at F; an off-axis ray set misses F by an amount
  computed from the geometry (DERIVED); low-frequency "direct path to capsule" drawn as a separate arrow.

## 2. Readouts (DERIVED, ideal model)
- Gain-onset frequency ≈ c/D (343/D). Show "below about X Hz the dish adds little; the capsule still hears it directly".
- Focus error: slide the element ±20 mm; readout of offset only (no invented dB curve), words "higher frequencies weaken first".
- Aim error: 0 / 10 / 20° off axis (lesson trials) — words only.

## 3. Operator footprint (frame P, venue plan builder)
Operator box (approved footprint), turn arc (wedge), target path (line), handoff point to a fixed mic, crowd/PA arrows,
no-entry hatch (play / run-off). The dish cone drawn is illustrative, labelled.

## 4. Starting setups
ONE MIC: dish aimed at a fixed target zone from the operator box. ANOTHER START: aim below a distant player (idea to
try). FALLBACK cards: perimeter shotgun, fixed boundary, ambience pair, second dish (each a token).
TWO MICS: dish + fixed mic on one source: Δt + notches change as the target moves (moving-source tool, summary §3).

## 5. Keep-outs and safety in drawings
Operator never enters hatched space; cable route outside walkways; a "stop" state when the target leaves the arc.
