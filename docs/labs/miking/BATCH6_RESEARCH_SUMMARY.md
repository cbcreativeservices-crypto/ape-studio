# Miking Labs, Lab 6 Foley, Field & Scientific — Batch 6 research summary, PART 1 (F01–F08, 8 lessons)

Date: 2026-10-07. Researcher: Claude (preparation pass; no app code, no sub-agents). Owner: "prepare, but do not
start the build." Model: `BATCH5_RESEARCH_SUMMARY.md`, `lead_vocal/` format. Owner ruling: the app shows suggested
starting points; these docs stay exact and sourced; every UNKNOWN the picture needs is a **drawing default**
(`placeholder: true`). Survey: `survey/lab6.md` (2026-10-04, no web pages opened then — this pass opened them).
Text copies: `source_text/Foley-Footsteps-and-Surfaces-…txt`, `F02-…` to `F08-…txt` (already in the repo since
530ca9b6; re-extracted today with `_docx2txt.py` and byte-identical apart from line endings — not re-committed).

Folders (SOURCES.md + GEOMETRY_PROPOSAL.md each): `foley_footsteps/ foley_clothing/ foley_props/
foley_impacts_liquids/ foley_perspective/ field_ambience/ field_wildlife_distant/ field_moving_passby/`.
**Registers**: Lab 6 source keys + carry-over rules → `foley_footsteps/SOURCES.md` §0; the shotgun model →
`foley_footsteps/SOURCES.md` §c; frame F + Foley stage → `foley_footsteps/GEOMETRY_PROPOSAL.md`; frame G, sites,
wind layers, safety cards, field log → `field_ambience/GEOMETRY_PROPOSAL.md`; parabolic dish →
`field_wildlife_distant/`; moving-source path tool + Doppler → `field_moving_passby/`.

New sourced data not in the lessons: Foley First pit **1.2 × 1.0 m optimal, 0.8 m² minimum**, framing 70–100 mm,
slab ≥ 300 mm, leveling-layer resonance 80–200 Hz; Mix 2005 (Roesch, Warner) footsteps **3–6 ft "in front and/or to
the side … about 15 degrees"**, close KMR-class shotgun + room condenser; Foley First cloth **"can be increased to 3
meters"** for a rain cover; one footstep mic moved "half a meter closer"; SCHOEPS shotgun physics ("for wavelengths
longer than the tube … little effect"; narrower above; poor in a diffuse field); DPA XY **90° (±45°)**, AB 20 cm →
±70°, M/S ÷√2; RØDE ORTF 17 cm / 110°, XY 90°; NPS **wind > 5 m/s (11 mph)** (ANSI S12.9-2013), weather pairing,
25-day science period; NPS wildlife **25 yd / 100 yd** (bears, wolves), "if animals react … too close"; NWS "rain
shelters, small sheds, and open vehicles are not safe", "30 minutes after the last lightning or thunder"; NIOSH REL
**85 dBA / 8 h, 3 dB exchange**; Cornell dish rule **"wavelength … greater than the diameter … not captured or
amplified"**, typical dish **57 cm**; SCHOEPS dish **585 mm, focal 210 mm**, capsule faces the dish, 100 Hz–20 kHz with
EQ; Innercore **500 mm, focal 140 mm**; dish-gain formula 20·log10(3.25·D·E/λ) (practitioner, Medium); OpenStax
Doppler eq. 17.18; OSHA work-zone hazards + MUTCD Part 6; Shure open mics "+9 dB noise for 8 open mics"; SM4
"fire or electric shock" water warning; Rycote rain jacket "not intended to be used whilst recording"; Elemental
hydrophone vs airborne practice.

## 1. Readiness per lesson

| Pri | Lesson | Readiness | Blocked on / owner decisions |
|---|---|---|---|
| 1 | F01 Footsteps & surfaces (defines frame F, Foley stage, performer, shotgun + mounts) | **READY with defaults** | Pit size, Roesch 0.9–1.8 m, FF 1.5–2 m and 3.5 m all CONFIRMED (practice, Medium). Lesson's own 0.8–1.0 m CLOSE trial UNSOURCED (O-1); heights and motion-envelope margin drawing defaults; shotgun lobe drawing (O-2). |
| 2 | F06 Natural & urban ambience (defines frame G, sites, wind, safety cards, field log) | **READY with defaults** | ORTF/XY/AB-example/M-S CONFIRMED; NPS/NWS/NIOSH numbers CONFIRMED; mic height, AB omni spacing (O-8), site sizes drawing defaults. |
| 3 | F08 Moving sources & pass-bys (defines the path tool + Doppler) | **READY with defaults** | Doppler CONFIRMED (textbook); no setback/speed/angle anywhere (lesson says so) → drawing defaults; vehicle = paper plan only (O-10). |
| 4 | F05 Foley perspective & multiple mics | **READY** (reuses Lab 5 array tool + F01 stage + F08 path) | Roesch 3–6 ft CONFIRMED (+15°); XY 90° and ORTF geometry added from makers; XY distance drawing default. |
| 5 | F02 Clothing & body movement | **READY with defaults** | 1–1.5 m and 3 m CONFIRMED; close-detail distance none published (O-5). |
| 6 | F07 Wildlife & distant sources (defines the parabolic dish) | **READY with defaults** | Dish geometry CONFIRMED (two makers + Cornell); λ = D threshold DERIVED; gain curve only if O-9; ranges drawing defaults; NPS distances (O-11). |
| 7 | F04 Impacts, liquids & textures | **READY with defaults** | Safety facts CONFIRMED (SM4, Rycote, Bry, Valasis); no distance or splash radius anywhere → drawing defaults (O-7). |
| 8 | F03 Props & object handling | **READY with defaults (thin)** | No number in lesson or sources; aim targets only; distances drawing defaults (O-6); wrong ref [9] replaced. |

No lesson is blocked. Every lesson needs only drawing defaults the owner can overrule; none needs new owner text.

## 2. Corrections found in the owner's documents (40 in all; full lists in each SOURCES.md §c / §e)

1. **Institutional wording in all 8**: "Pro Audio Training Academy" headers; "Students / student"; "classroom
   trial / position / materials / exercise"; "course exercise" (F08); "Guided teaching exercise"; "Student
   observation / field sheet"; "Pass criterion: the student". → "you", "suggested trial", "Practice exercise",
   "your observation sheet". (F01-C1 … F08-C1.)
2. **Missing geometry the lessons name**: F05 never gives ORTF or XY numbers (F05-C2/C3) — add 170 mm / 110°
   included (recording angle 95°) and XY 90°; F06 XY angle missing (F06-C2); F07 omits the dish–wavelength relation
   the plan demands (F07-C3) — Cornell's λ > D rule now sourced; F01 omits the shock mount the plan asks for (F01-C5).
3. **Numbers the sources give but the lessons leave out**: Roesch 3–6 ft + "about 15°" (F01-C2, F05-C4); "half a
   metre closer" (F01-C3); rain cover "up to 3 m" (F02-C2); NPS 25/100 yd (F06-C3, F07-C2); wind > 5 m/s for
   monitoring only (F06-C4); NWS "lightning or thunder" + unsafe shelters (F06-C5); walking Doppler ≈ ±7 cents as a
   model (F08-C2).
4. **Wrong or weak references**: F03 [9] is a band article cited for live Foley → re-cite Shure placement/live
   guidance (F03-C3); F03 L28 "three stations" — the Mix 1997 text read today describes stations by content, two
   named → "several stations" (F03-C2); F08 [5] maker link is dead (404) → specs page (F08-C3); F04 [6] HTML guide
   renders client-side → the PDF (F04-C3); F07 L31 "the dish surface may rustle" is not in either cited page
   (F07-C4, kept as practice); F01 [4] / F05 [6] locale and hashed links (record only).
5. **Cross-links to lessons that do not exist yet** (B04/B05/B08 in Lab 7; F09–F16; ".docx" names in F01) → in-app
   links to built lessons only (no future promises) (F01-C6, F02-C3, F03-C5, F04-C4, F05-C6, F06-C6, F08-C4).
6. **Header lab names differ** (F01 "Foley Field and Scientific Lab", F02–F08 "Foley Field and Acoustical Lab") →
   the registry name "Foley, Field & Scientific" (F01-C7).
7. **Internal note (not an owner error)**: DPA's stereo page writes ORTF as "angled ±110°"; the standard is 110°
   INCLUDED (±55°) — F06 L30 is right; the app follows F06 (D-ORTF).

No physics errors were found (the survey's checks stand: M/S sum, Doppler direction and size, polarity ≠ delay,
dish behaviour, open-mic noise). No "ring out" or feedback-provoking exercise exists in F01–F08.

## 3. Shared families and tools to build once

1. **Frame F + the Foley stage** (`lessons/shared/foley/`) — origin at the active area, axes = frame S so the Lab 5
   array tool drops in; pit 1200 × 1000 mm with surface variants (tile, hollow wood panel, concrete, gravel, leaves,
   carpet-over-wood in section); room shell; live theatre Foley booth (stage left) with PA + wedge. F01–F05.
2. **Performer + motion envelopes** (extends `shared/players`): walking/pivot/scuff poses, garment-holding/wearing
   poses, arm-reach gesture arc, footfall area + body column keep-out, exit path. F01–F05 (and Lab 7 people).
3. **Field mics and mounts** (`lessons/shared/fieldmics/`): `shotgunShort` with the **banded shotgun lobe**
   (supercardioid below c/L_tube, narrowing above — a simplified picture), small supercardioid, Lab 5's shared LDC
   as the room mic, shock mount, **pole boom** (new MountKind), pistol grip + basket/blimp + fur. Every lesson.
4. **Props + effects** (`lessons/shared/foley/props.tsx`): key ring, paper, door (swing arc + pinch zones on the
   existing `sweep` keep-out), drawer, chair, padded block, basin with the **splash envelope**, brush on fabric;
   **sensing-medium card** (air / water / structure) and the `hydrophone` / `contact` transducer kinds. F03, F04.
5. **Frame G + field sites** (`lessons/shared/field/`): metre-scale plan, site presets (woodland, meadow, plaza,
   sidewalk), listening point, traffic/path keep-outs, **wind layers** (foam → fur → basket → fur), **safety cards**
   (lightning, wildlife setback ring, traffic, water/weather, hearing), **field log** (extends Lab 5's worksheet;
   typed only, no GPS). F06–F08 (and F09–F12, Lab 7 outdoors).
6. **Moving-source path tool** (`lessons/shared/field/path.ts`): finger-scrubbed source on a polyline (no loop),
   per-mic distance, arrival angle, inverse-square level strip, pattern gain, ideal Doppler factor + cents strip,
   tracked-mic mode, Δt for separated mics. F01, F05, F07, F08 (Lab 7 sports).
7. **Stereo image readout** (`lessons/shared/field/stereoImage.ts`): XY / M/S level image, ORTF / AB level + time;
   pure and tested. F05, F06, F08.
8. **Parabolic dish** (`lessons/shared/field/dish.ts`, `DishArt.tsx`): D, focus, capsule facing the dish, c/D
   "little help below" readout, illustrative narrowing beam, optional gain curve (O-9). F07 (Lab 7 B12).
9. **Reused unchanged**: Lab 5 `stereoArray.ts` + `ArrayArt.tsx` (XY, ORTF, AB, M/S), `twoMic.ts` (Δt, comb,
   polarity), `polar.ts`, `levels.ts`, the journey engine (`setups.ts` roles, `SETUP_PICKS`, `setupPairs`), Lab 5
   worksheet, the S-LIVE/NOM gain-margin words. No measurement-mic need in F01–F08 (that starts at F11).
10. **Engine additions (small, shared)**: a scale tier for rounding (mm below 1 m … 1 m above 10 m) in
    `engine/model/units.ts`; `MountKind` += `pole`; `transducer` += `hydrophone`, `contact`; pattern renderer
    `shotgunLobe`. Each with a test; no native dependency.

## 4. Builder grouping (2 groups of 4)

1. **lab6-g1 — Foley stage**: **F01 footsteps first** (builds 1, 2, 3 and the engine additions), then F02 clothing
   (gesture envelope, pole boom), F03 props (props, door swing), F04 impacts/liquids (splash envelope, medium card,
   hydrophone/contact kinds). Owns `lessons/shared/foley/` and `lessons/shared/fieldmics/`. Fills the `field` lab's
   `blurb` / `familyBlurb` in `data/registry.ts` (the first ready Lab 6 lesson makes the tile appear).
2. **lab6-g2 — Perspective & field**: **F06 ambience first** (builds 5 and 7), then **F08 pass-bys** (builds 6), then
   F07 wildlife (builds 8), then **F05 Foley perspective last** (needs g1's frame F stage and shotgun; until merged,
   import from the agreed paths through a stub and note it — BUILDER_BRIEF rule 9). Owns `lessons/shared/field/`.

Dependencies: g2 needs g1's `fieldmics/` (shotgun, mounts) and `foley/` (stage) — run g1 first, or run both with
g2 stubbing `fieldmics/` imports (agreed paths and type names in `BUILD_PROMPTS_lab6a.md`). g1 needs nothing from
g2 except the path tool for F01's "walking across" step, which F01 may defer (a static near/far footfall pair is
enough; the scrub arrives with g2 and F01 can adopt it in a later pass).

## 5. Owner decisions needed (defaults in brackets; the builders proceed on the defaults unless told otherwise)

- **O-1** F01 CLOSE start: the lesson's own 0.8–1.0 m trial, or start CLOSE at Roesch's 0.9 m lower edge?
  [show 0.8–1.0 m as a suggested starting point]
- **O-2** The shotgun drawn as "a simplified picture": base pattern at low/mid, a narrowing lobe at high
  frequencies, no numbers. [yes]
- **O-3** People, animals and vehicles in the art: walking performer, Foley artist with cloth and props, boom
  operator, field recordist with headphones, birds/animals, a car in PLAN view only. [yes, house figure style]
- **O-4** Roesch's "about 15 degrees" read as 15° off the walker's front line in plan. [yes]
- **O-5** F02 close-detail distance (none published). [400–600 mm, drawn outside the gesture arc]
- **O-6** F03 prop distances (none published): defaults, or aim-only starts with no number? [defaults]
- **O-7** F04 splash envelope drawn at 2.5 × the basin radius (illustrative); hydrophone and contact sensor as
  cards only, never placed. [yes]
- **O-8** F06 AB omni spacing for ambience (no source). [600 mm]
- **O-9** F07: draw a dish gain curve from the practitioner formula, or words + the "little help below about N Hz"
  readout only? [words + readout only]
- **O-10** F08: finger-scrubbed path with level and pitch strips as an ideal model; walking 1.4 m/s and a vehicle
  example speed as drawing defaults; vehicles only as a paper plan. [yes]
- **O-11** Show the US national-park wildlife distances (25 yd / 100 yd) as examples, "local rules first". [yes]
- **O-12** Field log typed only, kept on the device, no GPS or location permission. [yes]
- **O-13** Lab 6 tile text and whether part 1 (F01–F08) goes ready before F09–F16 are built. [ready per lesson, as
  Labs 1–5]
- **O-14** Ambience and wildlife setups use role names that fit them ("a second position", "a wider view") through
  `SETUP_PICKS`, instead of CLOSE · LIVE / FARTHER BACK · STUDIO. [yes]

## 6. Sources not reachable / not re-read
Sound Devices pages (403: M/S basics, seven steps, live tips, Watson Wu, Eric Potter); Rycote boom shock mounts
(429); Sennheiser MKH 416 info page (404 — specs page found via search, Low); Rycote WS-1 and Nano Shield; RØDE wind
article; DPA binaural; NPS "In the Field" and "Types of Sound Data"; Cornell data page; Telinga; Shure "placement
secrets"; Shure rhythm-section article; SCHOEPS CCM 41 page; Edward Foley library interview. None drives a
CONFIRMED geometry value. Shure live and recording booklets: read in Batches 1/5, not re-read today.
