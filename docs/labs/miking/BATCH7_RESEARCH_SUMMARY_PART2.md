# Miking Labs, Lab 7 Sports & Broadcast (part 2) — Batch 7 research summary (B09–B17, 9 lessons)

Date: 2026-10-07. Researcher: Claude (preparation pass only — owner: "prepare, but do not start the build").
No app code, no sub-agents. Model: `BATCH5_RESEARCH_SUMMARY.md`. Text copies: `source_text/B09-…` to `B17-…`.
Folders (SOURCES.md + GEOMETRY_PROPOSAL.md each): `commentators/ sideline_interviews/ athletes_officials/ parabolic/
field_diamond/ court_ice/ track_gym_combat/ motorsport_equestrian_aquatic/ crowd_complete/`.
**Register**: Lab 7 part 2 source keys → `commentators/SOURCES.md` §0.

What these lessons are: method and safety lessons more than distance lessons. They give almost no mic-to-source
numbers (by design: "no universal distance"); every number they DO give is either a governing-body clearance (not a
mic position), a maker spec, or a practice-layout coordinate. The drawable heart of each lesson is therefore the
**practice layout** (all coordinates check out arithmetically) plus approved footprints on a sport plan.

New sourced data read today: SM2 guide (cardioid dynamic, outside corner of the mouth "not directly in front", boom
pivot 155°, 89 mm adjust); Coles lip mic bi-directional + wind 20/40 mph; Klover focus references (MiK 16: 1-1/8 in /
1-1/2 in; MiK 26: 2-1/4 in / 4 in) and capsule rules; derived dish depth/focal length and gain-onset (≈ 520 Hz for 26
in, ≈ 845 Hz for 16 in); IFAB Law 1 §1.12 and Law 4 text; World Rugby 1.3(e) 5 / 3.5 / 3.0 m; FIBA ≥ 2 m; FIVB 3 / 7 m
and 5 / 6.5 / 12.5 m; UWW 9 m + 1.5 m; MX391 full spec block; MKH 416; MK 4 / CCM 4; AMBEO; H2dX; NWS 30-minute rule
and "dugouts NOT SAFE"; EBU R 128 −23 LUFS / ±1 LU / −1 dBTP; VP83F "−12 to −6 dB".

## 1. Readiness per lesson

| Pri | Lesson | Readiness | Blocked on / owner decisions |
|---|---|---|---|
| 1 | B13 Field & diamond (defines the venue plan builder, frame P) | **READY with defaults** | Practice geometry CONFIRMED; IFAB / rugby clearances CONFIRMED; sport outlines are drawing defaults (D7-2); MLB/softball/NFL items UNSOURCED (no geometry depends on them). |
| 2 | B12 Parabolic (defines the dish tool) | **READY with defaults** | Focus references + capsule rules CONFIRMED; dish depth/focal length DERIVED (assumes rim diameter = model number); foot-aiming idea not re-read (an idea to try). |
| 3 | B09 Commentators (defines the broadcast speech set) | **READY with defaults** | Headset placement CONFIRMED; lip-guard distance UNKNOWN (drawing default); depends on frame V + Lab 7 part 1 tokens (D7-8). |
| 4 | B14 Court, racket & ice (boundary/plant tools) | **READY with defaults** | FIBA/FIVB numbers CONFIRMED (Medium); ITF/BWF/DEL unread (badges only, no numbers); boundary reflection math DERIVED. |
| 5 | B17 Crowd & complete coverage (coverage planner + downmix) | **READY** | Arithmetic, ORTF, M/S, EBU, ITU coefficient, maker specs CONFIRMED; immersive presets need D7-5. |
| 6 | B10 Sideline interviews | **READY with defaults** | No numbers in the lesson; zones from frame V; boom geometry from part 1 B04 if built. |
| 7 | B15 Track, gymnastics, combat | **READY with defaults** | UWW CONFIRMED (Medium); athletics/FIG/boxing/IJF unread → outlines drawing defaults; practice scene shared with B16. |
| 8 | B16 Motorsport, equestrian, aquatic | **needs owner input** (D7-3, D7-4) | Horse drawing scope and the optional hydrophone; otherwise buildable with the pass-by tool. |
| 9 | B11 Athletes, coaches & officials | **READY with defaults** | IFAB Law 4 CONFIRMED; torso frame T is a drawing default; the lesson is approval-heavy → D7-1. |

## 2. Corrections found in the owner's documents (16; log as `B0x-nn` in CORRECTIONS_LOG.md when built)

1. **B09-01** ref [4] title "Shure, Broadcast Audience and Venue Pickup" links to a 2012 church-audio Q&A page — wrong
   page for the title. Owner: replace the link.
2. **B09-02** the lesson never states the SM2's pattern; its guide says cardioid dynamic, close-talking (internal record;
   the app says "a close-talk headset mic").
3. **B09-03** HMD/HME 26 spec link now redirects twice to an asset store; the pattern claims could not be re-read.
   Owner: refresh the link. App text names no models anyway.
4. **B10-01 / B10-02** refs [5] and [6] are press releases (Super Bowl story, IBC 2022 news) titled as technical
   documents. Note only.
5. **B12-01** Klover's FAQ says wavelength is "not relevant in the same way"; physically misleading. The lesson already
   resolves it correctly — keep the lesson's resolution; never show the FAQ claim.
6. **B12-02** the lesson gives no dish geometry; the app draws a paraboloid DERIVED from the maker's focus references
   (`parabolic/SOURCES.md` §b), labelled a simplified picture.
7. **B13-01** "IFAB … Section 1.12" is correct, but that section is headed Commercial advertising — cite it as "Law 1,
   §1.12 (the equipment sentence)" in the owner's document so readers can find it.
8. **B14-01** FIBA "Articles 2.2 and 2.5.1 … unobstructed boundary lane" — the rule text read is "any obstruction … at
   least 2 m from the playing court"; it is an obstruction clearance, which the lesson then correctly says is not a crew
   strip. Wording only.
9. **B15-01** B15 and B16 use the identical practice geometry (A/B/C, M1/M2); the app builds ONE shared practice scene.
10. **B16-01** "Underwater and airborne dB references differ" — add the actual references (1 µPa in water, 20 µPa in
    air: a 26 dB offset) in the internal record; no number on screen.
11. **B16-02** H2dX sensitivity reads "1V/Pa" in the manual's text layer; the unit is 1 V/µPa (glyph loss). The lesson is
    right; record it so nobody "fixes" it.
12. **B17-01** "Academy minimal stereo example … four microphone input channels" and "14" — correct; the app computes
    these from the role table and never hard-codes them.
13. **B11-01** safeguarding: the practice uses "a consenting adult"; keep exactly (no minors in fittings).
14. **R-07 (all nine)** institutional wording: "Pro Audio Training Academy" headers, "Academy recommendation", "student",
    "classroom", "instructor", "supervisor approves" → "you", "suggested starting point", "practice", "a qualified
    person". App name only in chrome.
15. **R-08 (all nine)** brand and model names (Shure, Sennheiser, Coles, Klover, Wildtronics, SCHOEPS, DPA, Aquarian,
    Rycote, RØDE, TopVision) and governing-body rule numbers → internal record only; learner text gets generic types and
    "check your event's rules". ("Hammond" is the one allowed name in learner text; it does not occur in B09–B17.)
16. **R-09 (B13–B17)** each lesson repeats the NWS lightning rule and the rain-jacket caution: keep both (safety), as one
    shared safety card worded once.

No WRONG safety number was found. Every safety-critical item checked (NWS 30 min / no dugouts, never into play, never
alter protective equipment, no mic on horse/tack/rider, wet-area electrics by a qualified person, start headphone level
low) stays, in plain words, exactly.

## 3. Shared families and tools to build once (`lessons/shared/sports/` unless noted)

1. **Venue plan builder (frame P)** — `field_diamond/GEOMETRY_PROPOSAL.md` §1. Extends Lab 5's seating/stage-plot
   builder: layers (play area, keep-clear hatch, routes, approved footprints, cameras, crowd/PA sectors, targets),
   readouts (plan + slant range, aim, off-axis to PA, Δt, notches, inverse square), coverage-map mode. Used by all nine.
2. **Practice scenes**: `practiceField` (B13), `practiceLine` (B14), `practiceSmall` (B15 = B16), `practiceCrowd` (B17)
   — the Placement Studio scenes.
3. **Broadcast speech set** — `lessons/shared/broadcast/` (`commentators/` §4): headset boom, lip mic, desk arm,
   handheld with flag, lav, compact shotgun on a pole + frame V head turns + torso frame T (`athletes_officials/` §1).
   Shared with Lab 7 part 1 (one owner).
4. **Parabolic dish tool** (`parabolic/`): paraboloid from f/d, focus element, ray overlay, gain-onset c/D readout,
   operator arc.
5. **Boundary + plant tools** (`court_ice/` §2): reflection-path section view with first-notch readout; isolated vs rigid
   plant; contact-sensor symbol.
6. **Moving-source (pass-by) tool** (`motorsport_equestrian_aquatic/` §1): scrubbed source path, per-position Δt /
   notches / level — "one-point delay does not transfer".
7. **Headroom chain panel** (B13–B17): stage-by-stage "first overloaded stage"; −12 dBFS gentle trial.
8. **Feeds & routing panel** (B09, B11, B17): program / PA / record / talkback / IFB / mix-minus / international sound;
   officials' private circuit drawn closed.
9. **Coverage planner + downmix panel** (`crowd_complete/` §3–4), plus two new array presets for the Lab 5 array tool
   (four-channel hemisphere spot; tetrahedral A-format).
10. **One safety card** (lightning, weather covers, never into play, wet electrics) and **one Lab 7 worksheet**
    (permission/approval rows + coverage map + observation rows) generalised from the lessons' sheets.

Measurement mics: none needed (B13–B17 point to F11/F12 for exposure; the app keeps "dBFS is not hearing exposure").

## 4. Builder grouping (3 groups; prompts in `BUILD_PROMPTS_lab7b.md`)

1. **G1 Speech in sport** — B09 commentators (first; builds the broadcast speech set + routing panel), B10 sideline
   interviews, B11 athletes/coaches/officials (torso frame T). Depends: frame V (Lab 5, built); Lab 7 part 1 tokens if
   that lab merges first (else G1 owns `lessons/shared/broadcast/`).
2. **G2 Action pickup on fields and courts** — B13 field/diamond (first; builds the venue plan builder + practiceField +
   headroom panel), B12 parabolic (dish tool), B14 court/ice (boundary/plant tools + practiceLine). Depends: Lab 5
   seating/stage-plot builder (built).
3. **G3 Arenas, moving sources, complete coverage** — B15 track/gym/combat (practiceSmall), B16 motorsport/equestrian/
   aquatic (pass-by tool), B17 crowd & complete coverage (coverage planner, downmix, array presets). Depends: G2's venue
   plan builder (merge G2 first, or start from G2's pushed backup branch `lab7-g2`); G1's routing panel for B17 (stub
   import from the agreed path if G1 is not merged).

Order: G1 and G2 in parallel; G3 after G2 is merged (or rebased on `lab7-g2`).

## 5. Owner decisions needed

- **D7-1 Rules on screen.** These lessons are mostly about approval. Proposal: one plain "Before any mic: get approval"
  card per lesson and drawn keep-clear zones; sport clearance NUMBERS (FIBA 2 m, rugby 5 / 3.5 / 3.0 m, FIVB free zone,
  UWW 1.5 m) shown as "typical clear zone — check your event's rules", with no rule-book names. Or no numbers at all?
- **D7-2 Sport outlines.** 15 sport plans (football, soccer, rugby, baseball, softball, basketball, volleyball, tennis,
  badminton, hockey, track, gymnastics, boxing, wrestling/judo, pool, arena, circuit). Proposal: simple plan outlines at
  standard dimensions (each builder reads the rulebook dimension; until then drawing defaults), and the PRACTICE layouts
  as the interactive Placement Studio. OK?
- **D7-3 People, horses, vehicles.** Proposal: generic line-art adults (no team marks), horses and vehicles as plan-view
  silhouettes only — no detailed animal or car art. OK?
- **D7-4 Hydrophone (B16)** — keep the optional underwater extension as one ANOTHER START card, or drop it?
- **D7-5 Immersive (B17)** — add the two new array presets (hemisphere spot, tetrahedral A-format) to the shared array
  tool, or keep B17 stereo-only with immersive in words?
- **D7-6 Photos** for Comp C: microphones on a field/court are the "real photo alongside" — one photo per lesson
  (commentary booth headset, sideline handheld, coach headset, parabolic dish operator, perimeter shotgun, courtside
  boundary mic, ringside mic, trackside mic, audience pair). Prompts to be written on your go.
- **D7-7 Lip-mic distance** — no readable maker figure; keep a drawing default (60 mm) with no readout, or omit the
  distance dimension on that setup?
- **D7-8 Part 1 coordination** — whichever of Lab 7 part 1 (B01–B08) or part 2 G1 builds first owns
  `lessons/shared/broadcast/`; confirm part 1's prep uses the same path.
