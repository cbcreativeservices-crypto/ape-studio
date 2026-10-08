# Lab 6 part 1 (F01–F08) — builder prompts, ready to paste

Prepared 2026-10-07 (preparation pass, branch `prep-lab6a`). **Do not start any of these until the owner says go,
in their own words, in that moment** (owner 2026-10-07: "prepare, but do not start the build"; AGENTS.md BUILD RULE;
D56: design and lab builds on Opus 5.5 at HIGH effort). Two groups of four, modelled on the Lab 5 builds
(lab5-g1 … lab5-g5). Research: `BATCH6_RESEARCH_SUMMARY.md`. Each prompt is self-contained.

Merge order when both are done: **lab6-g1 first, then lab6-g2** (g2 replaces its `fieldmics/` stub imports with
g1's real files during the merge; the stub paths below are the agreed ones).

---

## Group 1 — `lab6-g1` · Foley stage: F01 Footsteps (first), F02 Clothing, F03 Props, F04 Impacts & Liquids

```
You are building Miking Lab 6 (Foley, Field & Scientific), group 1: F01 Foley Footsteps and Surfaces (FIRST —
it builds the shared Foley-stage family), then F02 Clothing and Body Movement, F03 Props and Object Handling,
F04 Impacts, Liquids and Textures. Opus 5.5, HIGH effort. No sub-agents.

SETUP
- Repo C:\Users\profe\dev\ape-studio. Work in your own git worktree created from origin/final-lab
  (`git fetch origin`, then a worktree on a new branch `lab6-g1` from `origin/final-lab`). Use
  `git -c core.autocrlf=false` for every git command; edit with the Edit tool or Python with newline=''
  (the CRLF trap breaks source-regex tests).
- Never push to final-lab, never publish, never run eas / build / submit / update / SQL. Commit locally in logical
  chunks; each message ends with a blank line then `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.
  When done, push ONLY your branch as a backup: `git push origin HEAD:lab6-g1`. Fill only the `^affects other side:
  <FILL` / `^needs: <FILL` stub lines the post-commit hook adds to docs/CROSS_SESSION_HANDOFF.md.

READ FIRST (in this order)
1. docs/labs/miking/BUILDER_BRIEF.md (binding) and AGENTS.md (house helpers, ratchets, test command).
2. docs/APE_LAB_VISUAL_CHARTER_2026_10_04.md (esp. §12) and docs/labs/miking/LESSON_JOURNEY.md (the 8-page
   journey: MEET IT, STARTING SETUPS drawn on the scene, MICROPHONES, PLACEMENT STUDIO, ADVANCED, PRACTICE; the
   standard line; NEW/EXPERIENCED; quick check rules; §12 voice).
3. The Kick lesson code (the quality standard): src/screens/lab/miking/lessons/m01Kick/*, pages/*, engine/*.
4. docs/labs/miking/BATCH6_RESEARCH_SUMMARY.md (§1–§5), then the four research folders:
   foley_footsteps/ (SOURCES.md §0 = the Lab 6 source register, §c = the shotgun model; GEOMETRY_PROPOSAL.md
   = frame F, the Foley stage, performer, mics and mounts), foley_clothing/, foley_props/, foley_impacts_liquids/.
5. The owner's text: docs/labs/miking/source_text/Foley-Footsteps-and-Surfaces-Miking-Technique.txt and
   F02-…, F03-…, F04-…txt. Never modify the .docx files in assets/Miking Lab Reference Docs/.
6. Reuse models: Lab 5 frame S (lessons/shared/ensemble/frameS.ts), stereoArray.ts + ArrayArt.tsx, the shared LDC
   (grpLdc), lessons/shared/players (PlayerFigure, playerPose), engine/physics (polar, twoMic, levels),
   engine/setups.ts (roles, SETUP_PICKS, setupPairs), M10 room lesson (room-mic wording), Lab 5 worksheet.ts.

BUILD (shared, once — you own these paths)
- lessons/shared/foley/ : frame F helpers (axes = frame S), stage.ts (pit 1200×1000 mm, rim 100, surfaces tile /
  woodPanel / concrete / gravel / leaves / carpetOver with the under-layer in section, room shell, live booth at
  stage left with PA + wedge), performer.ts (walk/pivot/scuff, holdGarment/wearJacket poses on shared/players;
  footfall area, motion envelope, gesture arc, exit path as keep-outs), props.tsx (key ring, paper, door with
  swing arc + pinch zones on the existing `sweep` keep-out, drawer, chair, padded block, basin with the
  illustrative splash envelope, brush on fabric), medium.ts card (air / water / structure).
- lessons/shared/fieldmics/ : shotgunShort (Ø19×250 drawing, capsule 200 mm behind the grille, `mic.ref` at the
  capsule), the `shotgunLobe` renderer (base supercardioid below c/L_tube, narrowing banded lobe above — said once
  as "a simplified picture", never a number), small supercardioid, shock mount, pistol grip + basket/blimp + fur,
  and the `pole` boom mount. EXPORT NAMES g2 will import (keep them): `SHOTGUN_SHORT`, `ShotgunArt`,
  `shotgunLobe`, `PoleBoomArt`, `WindLayers` (if you draw the basket/fur here, else leave to g2), `ShockMountArt`.
- engine additions (each with a test): MountKind += 'pole'; transducer += 'hydrophone' | 'contact' (pattern
  'unstated'); a rounding scale tier in engine/model/units.ts (10 mm below 1 m, 50 mm to 10 m, then 0.1 m / 1 m).
- data/registry.ts: fill the `field` lab's `blurb` and `familyBlurb` (plain words, no promises of unbuilt lessons)
  and add your four LessonMeta rows (labId 'field', ids F01–F04).

PER LESSON (lessons/f01Footsteps, f02Clothing, f03Props, f04Impacts)
- model.ts, geometry.ts, art.tsx, lesson.ts (+ copy.ts / pages as the house lessons do); zones, setups and roles
  exactly as each GEOMETRY_PROPOSAL.md; every distance from SOURCES/GEOMETRY or a logged drawing default — never an
  invented dimension. Defaults the owner may overrule are listed in BATCH6 §5 (O-1…O-7): build on the bracketed
  default and list the item in your hand-over.
- Apply every correction in the lesson's SOURCES.md §c/§e and log each in docs/labs/miking/CORRECTIONS_LOG.md under
  ONE new section "## Lab 6 · group 1 · Foley stage: F01, F02, F03, F04 (branch lab6-g1, <date>)" (id, line,
  lesson says, app says, why, source key, status).
- Learner text: suggested starting points voice, no brands, models, practitioner names, studios, magazines or
  "guide says" (add every new name you meet — e.g. Rode, RØDE, Rycote, KMR, NTG, CMIT, TLM, U67, Foley First,
  NoiseFloor, Hensley, Hecker, Roesch, Malcolm, Cross, Valasis, Bry, Hayes, Sound Devices — to BRAND_NAMES in
  test/mikingLearnerText.test.ts). Owner exception: the word "Hammond" is allowed in learner text — never add it to
  BRAND_NAMES. No institutional words (student, classroom, course, instructor, academy). Safety lines exact in plain
  words (performer envelope, stands/cables out of landing and exit paths, wet/electrical, never provoke feedback,
  hearing). FULLY SILENT: no audio anywhere.
- Quick check: 6 items from MEET IT + STARTING SETUPS, ≥ 1 critical safety item; item-writing rules §5.
- A model test per lesson that checks real relationships (part counts, anchors, every zone start outside the
  motion / gesture / swing / splash envelope, no collision at zone centres, setups drawn on the scene, roles valid).

MERGE HYGIENE
- data/lessons.ts and data/lessonArt.ts: ONE contiguous block per file headed
  `/* Lab 6 (field), group 1 — Foley stage: F01, F02, F03, F04 (each lesson on its own line). */`
  — never edit other groups' lines; no hard-coded lesson totals anywhere (tests count from the registry).
- Shared engine files: each change in one contiguous commented "lab6 group 1" block.
- Stage only your own files.

VERIFY
- `npx tsc --noEmit` clean; FULL suite: `node --test --test-timeout=120000 "test/**/*.test.ts"` green.
- Inspect every stage of every lesson at 390×844 with your own preview server (#labpreview/MikingLesson/F01?page=…
  &step=…&setup=…&unlock=1) or headless Chrome; look at each capture, refine twice. Display text ≥ 9 pt after
  fitValue; Rack Unit; full screen zooms everything; drags clear of the edges.
- Save captures to docs/labs/miking/screens/lab6_g1/ (PNG, named <lesson>_<page>_<step>.png).
- Self-review as audio expert and as learning designer against docs/labs/miking/kick/REVIEW_*.md; fix findings;
  record them in the CORRECTIONS_LOG section.

HAND-OVER (final answer): lessons built, shared files created, corrections logged (count), owner items still open
(O-numbers with the default used), test count, screenshots folder, commits, branch lab6-g1 pushed.
```

---

## Group 2 — `lab6-g2` · Perspective & field: F06 Ambience (first), F08 Pass-bys, F07 Wildlife, F05 Foley Perspective (last)

```
You are building Miking Lab 6 (Foley, Field & Scientific), group 2: F06 Natural and Urban Ambience (FIRST — it
builds the shared field family), then F08 Moving Sources and Pass-bys (builds the path tool), F07 Wildlife and
Distant Sources (builds the parabolic dish), and F05 Foley Perspective and Multiple Microphones LAST (it sits on
group 1's Foley stage). Opus 5.5, HIGH effort. No sub-agents.

SETUP
- Repo C:\Users\profe\dev\ape-studio. Your own git worktree from origin/final-lab on a new branch `lab6-g2`
  (`git fetch origin` first). `git -c core.autocrlf=false` always; Edit tool or Python newline=''.
- If origin/lab6-g1 exists when you start, merge it first (`git merge origin/lab6-g1`) and build on its
  lessons/shared/foley/ and lessons/shared/fieldmics/. If it does not, import from those agreed paths through a
  minimal stub (export names: SHOTGUN_SHORT, ShotgunArt, shotgunLobe, PoleBoomArt, ShockMountArt; frame F helpers
  in lessons/shared/foley/frameF.ts) and note every stub in your CORRECTIONS_LOG section and hand-over; do F05 last
  so the stub is replaced before you finish if g1 lands meanwhile.
- Never push to final-lab, never publish, never run eas / build / submit / update / SQL. Commit locally in logical
  chunks; messages end with a blank line then `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`. When
  done: `git push origin HEAD:lab6-g2` (backup only). Fill only the `^affects other side: <FILL` / `^needs: <FILL`
  stub lines in docs/CROSS_SESSION_HANDOFF.md.

READ FIRST
1. docs/labs/miking/BUILDER_BRIEF.md, AGENTS.md.
2. docs/APE_LAB_VISUAL_CHARTER_2026_10_04.md §12; docs/labs/miking/LESSON_JOURNEY.md.
3. Kick code (m01Kick, pages, engine) — the quality standard.
4. docs/labs/miking/BATCH6_RESEARCH_SUMMARY.md, then research folders field_ambience/ (frame G, sites, wind
   layers, safety cards, field log), field_moving_passby/ (path tool, Doppler), field_wildlife_distant/ (dish),
   foley_perspective/ (F05), and foley_footsteps/SOURCES.md §0 (the Lab 6 source register) + §c (shotgun).
5. The owner's text: docs/labs/miking/source_text/F05-…, F06-…, F07-…, F08-…txt (never touch the .docx files).
6. Reuse: Lab 5 lessons/shared/ensemble/stereoArray.ts + ArrayArt.tsx (XY 90°, ORTF locked 170 mm/110° with the
   95° recording angle, AB, M/S — unchanged), frameS.ts, worksheet.ts; engine/physics polar, twoMic, levels;
   engine/setups.ts (SETUP_PICKS for the ambience/wildlife role names, O-14); CALC-C speed of sound.

BUILD (shared, once — you own lessons/shared/field/)
- frameG.ts (metre scale, listening-point origin, axes = frame S), sites.tsx (woodland, meadow, plaza, sidewalk —
  illustrated real places; traffic lanes, walking paths, access routes as keep-outs), wind.tsx/wind.ts (foam → fur
  → basket → fur, effects in words), safety cards (lightning, wildlife setback ring, traffic, water/weather,
  hearing — exact facts from the SOURCES files, plain words, no authority names on screen), fieldLog (extends
  Lab 5 worksheet; typed only, createLocalStore, NO GPS / location permission).
- path.ts (pure, tested): finger-scrubbed source on a polyline (no loop, no autoplay); per mic: distance, arrival
  angle, inverse-square level vs the closest point, pattern gain, tracked-mic mode, ideal Doppler factor
  v/(v − v_s·cos φ) and cents, Δt between separated mics. Strips drawn from the model, "a simplified picture" said
  once. Test against SOURCES numbers (walking 1.4 m/s → +7.1 / −7.0 cents with c = 343.21 m/s).
- stereoImage.ts (pure, tested): XY / M/S level image, ORTF / AB level + time.
- dish.ts + DishArt.tsx (pure, tested): D 570 default, presets 585/210 and 500/140, paraboloid z = r²/(4f),
  capsule at the focus facing the dish, "little help from the dish below about c/D" (587 / 602 / 686 Hz), beam
  narrowing drawn illustrative; NO gain curve unless the owner approves O-9.
- data/registry.ts: your four LessonMeta rows (labId 'field', F05–F08) — g1 fills the lab blurb; if g1 has not
  landed, fill a neutral blurb and note it.

PER LESSON (lessons/f05Perspective, f06Ambience, f07Wildlife, f08Passby) — as group 1's prompt: model / geometry /
art / lesson files; zones, setups and roles from GEOMETRY_PROPOSAL.md; defaults from BATCH6 §5 (O-3, O-8 … O-14)
with the bracketed default; every correction in SOURCES.md §c applied and logged in ONE new CORRECTIONS_LOG section
"## Lab 6 · group 2 · perspective & field: F06, F08, F07, F05 (branch lab6-g2, <date>)"; brand/name list updates in
test/mikingLearnerText.test.ts BRAND_NAMES (e.g. Cornell, Macaulay, Innercore, Telinga, Wildtronics, Sound Devices,
OpenStax, Rode, RØDE, Rycote, MKH, Roesch) — "Hammond" is the owner's one allowed name and is never added; no
institutional words; safety exact (lightning, wildlife distances as US-park examples with "local rules first",
traffic: a stand or cone is not traffic control, no one inside the path envelope, vehicles only as a paper plan,
water/weather, hearing, never provoke feedback); FULLY SILENT; quick check 6 items with ≥ 1 critical; a model test
per lesson (setback ring respected, keep-outs clear, array geometry locked, path readouts against hand-computed
values, dish focus on the axis).

MERGE HYGIENE
- data/lessons.ts and data/lessonArt.ts: ONE contiguous block per file headed
  `/* Lab 6 (field), group 2 — perspective & field: F06, F08, F07, F05 (each lesson on its own line). */`;
  no hard-coded totals; shared-file changes in one commented "lab6 group 2" block; stage only your own files.

VERIFY
- tsc clean; FULL suite green (`node --test --test-timeout=120000 "test/**/*.test.ts"`).
- Every stage of every lesson at 390×844 (own preview server or headless Chrome), looked at and refined twice;
  ≥ 9 pt text after fitValue; Rack Unit; full screen zooms all; drags clear of edges.
- Captures in docs/labs/miking/screens/lab6_g2/.
- Audio-expert + learning self-review against docs/labs/miking/kick/REVIEW_*.md; fix; record.

HAND-OVER (final answer): lessons built, shared files, stubs (if any) and whether replaced, corrections logged
(count), open owner items with defaults used, test count, screenshots folder, commits, branch lab6-g2 pushed.
```
