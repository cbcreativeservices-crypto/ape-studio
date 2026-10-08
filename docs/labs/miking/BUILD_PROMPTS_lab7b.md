# Lab 7 part 2 (B09–B17) — builder prompts (ready to paste; DO NOT run until the owner says go)

Owner, 2026-10-07: "Labs 6 and 7 are in — prepare to build those when I leave again. Prepare, but do not start the
build." These prompts are the preparation. Each runs on Opus 5.5 at HIGH effort, one builder per group, no sub-agents.
Groups and dependencies: `BATCH7_RESEARCH_SUMMARY_PART2.md` §4. G1 and G2 can run in parallel; G3 starts after G2 is
merged onto `final-lab` (or from G2's pushed backup branch `lab7-g2`).

---

## Common block (paste at the top of every group prompt)

```
Repo C:\Users\profe\dev\ape-studio. Work in your own git worktree created from origin/final-lab
(`git fetch origin`, `git worktree add <path> -b <group-branch> origin/final-lab`). Use git with
`-c core.autocrlf=false`. No sub-agents. Never run eas / build / submit / update / publish / deploy / SQL.
Never push to final-lab or audio-tools-engine. Push ONLY your backup branch (named below).

READ FIRST (in this order):
- AGENTS.md (house helpers, ratchets; tests: node --test --test-timeout=120000 "test/**/*.test.ts")
- docs/APE_LAB_VISUAL_CHARTER_2026_10_04.md (esp. §12)
- docs/labs/miking/BUILDER_BRIEF.md, LESSON_JOURNEY.md (the 8-page journey, STARTING SETUPS, §0 restructure),
  ENGINE_BLUEPRINT.md, SOURCES_SHARED.md
- docs/labs/miking/BATCH7_RESEARCH_SUMMARY_PART2.md and, for each of your lessons, its folder's SOURCES.md +
  GEOMETRY_PROPOSAL.md and its source_text/B##-….txt
- the Kick lesson code (src/screens/lab/miking/lessons/m01Kick/*) as the quality standard, and the Lab 5 code you
  reuse: lessons/shared/voice/, lessons/shared/ensemble/ (stereo array tool, seating/stage-plot builder, routing matrix)

OWNER RULES (binding):
- Suggested STARTING POINTS only: "after our research, here is where we recommend you begin". No citations, no brand
  or model names, no rule-book names or article numbers, no SOURCED/TRIAL badges, no sources page in learner text
  (test/mikingLearnerText.test.ts). The only allowed proper name is "Hammond" (not used in this lab).
- FULLY SILENT. No audio anywhere. Computed visuals (Δt, comb notches, polar, gain onset) are drawings.
- Real equipment and real physics; generic mics drawn as types, never a brand likeness. Never invent a dimension:
  use the GEOMETRY_PROPOSAL values; a drawing default stays `placeholder: true` and is never a readout.
- Safety-critical content exact, in plain words: never into play / run-off / medical routes; approval before any
  mount or body fit; never alter protective equipment; no mic on a horse, tack or rider; wet-area electrics by a
  qualified person; lightning — shelter, wait 30 minutes after the last thunder, dugouts and rain shelters are not safe;
  start headphone level low; never provoke feedback. One shared safety card, worded once.
- No institutional words ("student", "classroom", "instructor", "Academy") — "you", "practice".
- Apply the corrections listed in the summary §2 and log each applied one in docs/labs/miking/CORRECTIONS_LOG.md
  under ONE section for your group.
- Labs never block navigation; every lesson ends with the what's-left screen; credit only grows.
- Display text ≥ 9 pt after fitValue at 390 wide; Rack Unit; everything zooms in full screen.

MERGE HYGIENE:
- Register your lessons in ONE contiguous block in the lab hub / registry (a "Lab 7 · part 2 · G#" block), never
  interleaved with other groups. Create the Lab 7 entry only if it does not exist yet; if it does, append your block.
- Never hard-code lesson or page totals in text or tests; derive counts from the registry.
- Shared code goes ONLY at the agreed paths: lessons/shared/sports/ (venue plan builder, practice scenes, dish,
  boundary/plant, pass-by, headroom, coverage/downmix) and lessons/shared/broadcast/ (speech set, routing panel).
  If another group owns a file you need and it is not on final-lab yet, write a thin stub that imports from the agreed
  path and say so in your final report.
- Stage only your own files. CROSS_SESSION_HANDOFF.md: fill only your post-commit stub lines.

VERIFY before you finish:
- tsc clean; the FULL test suite passes; a model test per lesson (part counts, zones inside clear space, no zone
  centre inside a keep-clear hatch, practice-layout arithmetic, derived readouts match the summary's numbers).
- Capture every page at 390×844 (your own preview server on a free port, or headless Chrome via
  #labpreview/MikingLesson/<ID>?page=<id>&unlock=1). Look at each capture; refine twice. Save captures under
  docs/labs/miking/<lesson>/shots/.
- Self-review as an audio expert and as a learning designer against docs/labs/miking/kick/REVIEW_*.md; fix findings.
- Commit in logical chunks (messages end with a blank line + `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`),
  then `git push origin HEAD:<backup-branch>`. Final report: lessons built, shared files created, stubs left, corrections
  applied, owner questions, test counts, branch.
```

---

## G1 — Speech in sport (B09, B10, B11) · branch `lab7-g1`

```
<common block>

YOUR LESSONS: B09 Commentators and Announce Positions (commentators/), then B10 Sideline and Post-Event Interviews
(sideline_interviews/), then B11 Athletes, Coaches and Officials (athletes_officials/).

BUILD FIRST (you own them unless Lab 7 part 1 already put them on final-lab — check lessons/shared/broadcast/):
1. lessons/shared/broadcast/broadcastMics.ts + art: headset boom (capsule at the outside corner of the mouth, not in
   front; pivot 155°), lip mic with guard (figure-8, guard distance a drawing default), desk arm, handheld with flag,
   lav, compact shotgun on a short pole.
2. Feeds & routing panel (program / PA / record / talkback / own headphones; cough-mute; IFB and mix-minus as paths;
   an officials' private circuit that cannot be routed to program).
3. Torso frame T for body-worn layouts (front + side, keep-out regions for protective gear) — commentators/ and
   athletes_officials/ GEOMETRY_PROPOSAL.
4. The booth preset and interview layer on the venue plan builder: if G2's lessons/shared/sports/venuePlan.ts is not on
   final-lab yet, build only a minimal plan canvas in lessons/shared/broadcast/ and leave a TODO to switch to venuePlan.

REUSE: frame V (lessons/shared/voice/) for heads, head turns and zones; Lab 5 routing-role matrix; the twoMic engine for
"one voice in two mics". Spill readout = 20·log10(d_partner/d_own) + ideal polar gain, labelled a simplified picture.

STARTING SETUPS per the three GEOMETRY_PROPOSAL §5/§4 lists. Practice = the shared Lab 7 worksheet (permission rows).
Owner items to leave as defaults and list in your report: D7-1, D7-7, D7-8.
```

## G2 — Action pickup on fields and courts (B13, B12, B14) · branch `lab7-g2`

```
<common block>

YOUR LESSONS: B13 Field and Diamond Sports (field_diamond/) FIRST, then B12 Parabolic and Tracked Action Pickup
(parabolic/), then B14 Court, Racket and Ice Sports (court_ice/).

BUILD FIRST (you own them; G3 depends on them — push lab7-g2 as soon as the venue plan builder works):
1. lessons/shared/sports/venuePlan.ts (frame P): layers, tokens, readouts (plan + slant range, aim, off-axis to PA,
   Δt, notches, inverse square), coverage-map mode. Extend — do not copy — the Lab 5 seating/stage-plot builder.
2. Practice scenes practiceField (30 × 20 m, M (15,−6), A/B/C — ranges 10.0 / 18.9 / 24.0 m, B at 32° left) and
   practiceLine (2/5/8 m inside, M 3 m outside → 5/8/11 m). These are the Placement Studio scenes.
3. Headroom chain panel (first overloaded stage; −12 dBFS gentle trial).
4. Parabolic dish tool (paraboloid from f/d presets 660/224/122 mm and 406/122/84 mm, `placeholder`; focus element;
   ray overlay; gain onset ≈ c/D; aim error words; operator arc).
5. Boundary + plant tools (section view, reflected path, first notch c/(4h) for perpendicular arrival; isolated vs rigid
   plant; contact-sensor symbol).

SPORT OUTLINES: plan outlines at standard dimensions — read each rulebook dimension you draw, or keep it a drawing
default. Clearances drawn: IFAB no-attachment badge on goals/nets/flags; rugby perimeter 5 m (min 3.5 / 3.0 m);
FIBA ≥ 2 m; FIVB 3 m / 7 m (5 / 6.5 / 12.5 m) — numbers per owner decision D7-1 (default: "typical clear zone — check
your event's rules").

Owner items to leave as defaults and list: D7-1, D7-2, D7-6.
```

## G3 — Arenas, moving sources, complete coverage (B15, B16, B17) · branch `lab7-g3`

```
<common block>

START FROM final-lab with G2 merged (or rebase on origin/lab7-g2 and say so). If G1's routing panel is not merged,
stub-import it from lessons/shared/broadcast/.

YOUR LESSONS: B15 Track, Gymnastics and Combat Sports (track_gym_combat/), B16 Motorsport, Equestrian and Aquatic
Events (motorsport_equestrian_aquatic/), B17 Crowd and Complete Sports Coverage (crowd_complete/).

BUILD:
1. practiceSmall scene — ONE scene shared by B15 and B16 (A/B/C, M1/M2; 2.00 m / 2.83 m; double-range option 4 m).
2. Pass-by tool lessons/shared/sports/passBy.ts: scrubbed source path, per-position range, inverse-square level, Δt and
   notches between two mics; NO Doppler number (a walking source is not a speed measurement).
3. practiceCrowd scene (A, U1–U3, S at 1.5 m aimed at U2, D at 1 m aimed at A).
4. Coverage planner (roles × minimal/extensive, counts computed — never hard-coded) and downmix panel (M = (L+R)/2
   trial; ITU 0.7071 example; one delivery card −23 LUFS / ±1 LU live / −1 dBTP, "use your broadcaster's").
5. Array presets added to the Lab 5 array tool ONLY if owner decision D7-5 says yes; otherwise immersive stays in words.
6. M/S width k with the matrix readout.

DRAWING SCOPE: horses and vehicles as plan silhouettes only (D7-3 default); hydrophone as one optional ANOTHER START
card (D7-4 default: keep, container scene, every connector on the dry side). Sport outlines as G2 (D7-2).
Owner items to list: D7-3, D7-4, D7-5.
```
