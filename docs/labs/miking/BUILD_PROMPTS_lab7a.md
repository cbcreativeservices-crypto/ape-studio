# Miking Lab 7a (B01–B08) — builder prompts, ready to paste

Prepared 2026-10-07. **Do not start any of these until the owner says go** (owner: "prepare, but do not start the
build"; AGENTS.md D56: Opus 5.5, HIGH effort, only after the owner's explicit go). Order: G1 first; G2 and G3 after G1
is merged into `final-lab` (they may run in parallel).

---

## Common block (paste at the top of every group prompt)

```
Repo C:\Users\profe\dev\ape-studio. Work in your own git worktree created from origin/final-lab:
`git fetch origin` then branch from `origin/final-lab`. Use git with `-c core.autocrlf=false`. Use the Edit tool or
newline-preserving writes (Python edits flip LF→CRLF). No sub-agents. No eas / build / submit / update / publish /
deploy / SQL. Never push to final-lab; push only your backup branch (named below). No new native dependencies; never
edit package.json scripts.

READ FIRST, in this order:
1. AGENTS.md (house helpers, ratchets) and docs/APE_LAB_VISUAL_CHARTER_2026_10_04.md (§12 especially).
2. docs/labs/miking/BUILDER_BRIEF.md, LESSON_JOURNEY.md (the 8-page journey, §0 restructure, STARTING SETUPS,
   §12 voice), MIKING_LABS_PLAN_2026_10_04.md §6, SOURCES_SHARED.md, CORRECTIONS_LOG.md (format).
3. docs/labs/miking/BATCH7_RESEARCH_SUMMARY.md, then each of your lessons' SOURCES.md + GEOMETRY_PROPOSAL.md and
   radio_host/SOURCES.md §0 (the Lab 7a source register). The owner's lesson text is
   docs/labs/miking/source_text/B0n-*.txt (never edit the .docx in assets/).
4. The quality standard: src/screens/lab/miking/lessons/m01Kick/* (OWNER-APPROVED), and the closest Lab 5 lessons:
   lessons/e01LeadVocal, e03RapVocal (frame V voice), e09CompleteBand / e05Choir (frame S, stage plot, seating),
   and the shared toolkits lessons/shared/voice/*, lessons/shared/ensemble/* (stereoArray, frameS, seating,
   worksheet), lessons/shared/players/*.

REUSE, never duplicate: frame V head + voiceStarts rows (closeRow, looseRow, lowRow, stageRow, headsetRow);
voiceMics (vocDynCard, vocLdc, vocHeadset); boundaryHalf, sdcCard, arrCard, miniOmni (data/micTypes.ts,
ensembleMics.ts); frame S; stereoArray; engine/physics/twoMic.ts and polar.ts; the Lab 5 gain-margin / NOM panel.
New shared broadcast code lives ONLY in src/screens/lab/miking/lessons/shared/broadcast/ (owner per file named in
your group). If you need a file another group owns, import from the agreed path with a minimal stub and say so in
your report.

OWNER RULES: suggested starting points voice ("after our research, here is where we recommend you begin"); no brands,
model names, source names or citations in learner text (exception allowed by the owner: "Hammond"); add every new
brand from your SOURCES.md to BRAND_NAMES in test/mikingLearnerText.test.ts; no SOURCED/TRIAL badges, no sources
page; FULLY SILENT (no audio ever; "how it sounds" = visual physics); real equipment drawn as real objects (generic,
no logos); real physics only (inverse square, image-source reflection, twoMic Δt/notch, first-order polars;
anything else is words); never invent a dimension — use the GEOMETRY_PROPOSAL value or its drawing default
(placeholder: true); safety-critical content exact and in plain words (lightning 30 minutes; consent and skin-safe
adhesive; no bodypack lav into 48 V phantom except via its specified adapter; never provoke feedback; overhead gear
only by qualified crew; never swing gear over people); no institutional words ("student", "classroom",
"instructor"); members only with the existing preview; credit only grows; labs never block navigation; display text
≥ 9 pt after fitValue; Rack Unit; everything zooms in full screen.

PER LESSON: lessons/<id>/{model.ts, geometry.ts, art.tsx, lesson.ts (+ copy.ts)}; STARTING SETUPS roles from the
GEOMETRY_PROPOSAL §Setups; the 6-item quick check with ≥ 1 critical safety item; apply every correction listed in
the lesson's SOURCES.md and log each in CORRECTIONS_LOG.md (one section per group, ids B01-1 etc.); a model test
with real relationships (anchors, zones in clear space, frame keep-out respected, no collision at zone centres,
head-turn readouts).

MERGE HYGIENE: register your lessons in ONE contiguous block per file (data/registry.ts, data/lessons.ts,
data/lessonArt.ts), headed by a one-line comment "Lab 7 (broadcast), group N — …", each lesson on its own line, labId
'broadcast'. No hard-coded lesson totals anywhere (tests count from the registry). Do not reorder other labs' lines.

VERIFY: `npx tsc --noEmit` clean; FULL suite `node --test --test-timeout=120000 "test/**/*.test.ts"` green; capture
every page/step of every lesson at 390×844 and 412×915 with your own preview server (#labpreview/MikingLesson/<ID>
?page=…&step=…&setup=…&unlock=1) or headless Chrome, LOOK at each capture, refine twice; run your own audio-expert,
learning and visual self-review (kick/REVIEW_* style) and fix the findings. Save captures under
docs/labs/miking/screens/lab7-gN/.

COMMIT locally in logical chunks; every message ends with a blank line then
`Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`; stage only your own files; after each commit fill only the
`affects other side: <FILL` and `needs: <FILL` stub lines the post-commit hook adds to docs/CROSS_SESSION_HANDOFF.md
(they ride into the next commit). Then `git push origin HEAD:lab7-gN` (backup branch only).

FINAL ANSWER: lessons built, shared files created (paths), corrections applied, review findings fixed/left, test
counts, capture folder, open owner items, branch name.
```

---

## G1 — Desk & studio voice: B01, B07, B06 (branch `lab7-g1`)

```
[Common block]

GROUP 1 of Miking Lab 7a (Sports & Broadcast, broadcast speech). Build, in order:
B01 Radio, Podcast and Studio Hosts (lessons/b01RadioHost) — research: docs/labs/miking/radio_host/
B07 Voiceover, Narration and Broadcast Guests (lessons/b07Voiceover) — research: voiceover_guests/
B06 Panels, Press Conferences and Groups (lessons/b06Panels) — research: panels_press/

You OWN and build first (shared/broadcast/): talkerPose.ts (SEATED talker on the frame-V head + chair/desk) and the
HEAD-TURN control with r / off-axis readouts; deskReflection.ts (image source → Δt, first notch via twoMic);
broadcastMics.ts (bcDynEnd, boomArm, gooseneck; leave clearly named slots for G2/G3 types: shotgunShort,
compactHyper, camMic, repOmni, lav*, hs*); openMicPanel.ts + bleed matrix (reuse the Lab 5 NOM/gain-margin panel);
routing.ts + RoutingPanel art (PA, monitor, program/stream, recorder, IFB, talkback, press feed box: line in →
isolated mic-level outs, remote return with mix-minus). Document each export in a header comment so G2/G3 can import.

Corrections to apply and log: B01-1 (L38 no-provocation wording), B06-1 (lectern 10–14 in, a little off-centre; NOT
"8 in below"), B-INST, B-XLINK (cross-links only to built lessons). 3:1 is a NOTE readout only, never graded.
Registry: fill MIKING_LABS 'broadcast' blurb + familyBlurb in plain words (no brands), e.g. family line "Miking
speech for broadcast — hosts, interviews, panels and audiences"; keep the lab hidden until a lesson is 'ready'
(it will be). Owner items pending: drawing defaults (desk, table, lectern), O-LEC — use the proposals' defaults and
list them in your report.
```

## G2 — Body-worn & camera: B05, B04, B02 (branch `lab7-g2`; start after G1 is merged)

```
[Common block]

GROUP 2 of Miking Lab 7a. Start from origin/final-lab AFTER group 1 (lab7-g1) is merged; import G1's
shared/broadcast/ (talkerPose, deskReflection, broadcastMics, openMicPanel, routing). Build, in order:
B05 Lavalier, Headset and Concealed Pickup (lessons/b05Lavalier) — research: lavalier_headset/
B04 Boom and Camera-Mounted Pickup (lessons/b04BoomCamera) — research: boom_camera/
B02 News Anchors and Seated Interviews (lessons/b02NewsAnchor) — research: news_anchor/

You OWN: bodyWorn.ts (mount points sternum/lapel/collar/tie/neckline/concealed/headset, one garment layer, clip,
broadcast loop + secondary loop, transmitter pack); cameraFrame.ts (generic camera, angle-of-view wedge in side and
plan as a collision keep-out, close/wide presets, outsideFrame test) and boomPole.ts (pole, stand boom, operator,
shock mount); the mic types shotgunShort, compactHyper, camMic, lavOmni, lavCard, hsCard in broadcastMics.ts.
G3 imports cameraFrame.ts — land it in your FIRST commit and push the backup branch early.

Shotgun pattern: owner decision O-SG. If not yet answered, draw the hypercardioid-like lobe described as "a
simplified picture" and say in words that the real pattern narrows and changes with pitch; list it as an open owner
item. Never draw an invented polar as data.
Corrections: B05-1 (re-cite 5–8 in to the pastor article, internal only), B-INST, B-XLINK; D-LAV1 → one sternum zone
125–250 mm. Safety exact: consent, wardrobe approval, skin-safe adhesive only on skin, no bodypack lav into 48 V
phantom except via its specified adapter, overhead booms rigged by qualified crew, never swing gear over people, no
conductive pole near overhead power lines (text only).
```

## G3 — Field & audience: B03, B08 (branch `lab7-g3`; start after G1 is merged, parallel with G2)

```
[Common block]

GROUP 3 of Miking Lab 7a. Start from origin/final-lab AFTER group 1 (lab7-g1) is merged. Build, in order:
B03 Field Reporters and Handheld Interviews (lessons/b03FieldReporter) — research: field_reporter/
B08 Broadcast Audience and Event Space (lessons/b08Audience) — research: audience_ambience/

You OWN: handoff.ts (two standing frame-V talkers, handoff arc, r_A/r_B and the inverse-square level difference);
wind.ts + art (grille / foam / fitted fur / basket+fur, wind arrow, tendencies in words only) — FIRST check whether
the Lab 6 builder already created a wind kit (grep lessons/shared/field); if so import it instead; venue.ts
(audience plan on frame S + seating tokens, sections, aisles, exits as keep-outs, PA clusters with coverage wedges,
two presets small studio / multi-section event), surround (5-capsule) and Ambisonics (4-capsule) tokens with a
front arrow and channel labels (no decode); the mic type repOmni in broadcastMics.ts. Camera: import
shared/broadcast/cameraFrame.ts from G2; if it is not merged yet, stub that path with the minimal API in
boom_camera/GEOMETRY_PROPOSAL.md §1 and note it.

B03 safety, exact and unattributed: if thunder is heard, go to a safe building or vehicle and stay at least 30
minutes after the last thunder; a windscreen does not make an outdoor interview safe; electronics out of rain; a
stop/relocate signal agreed before going live. B08: crowd mics go to broadcast/record only (routing check fails if
sent to PA); two zone mics are not a stereo pair (show Δt and the mono notch); XY/ORTF/AB from stereoArray.ts.
Corrections: B-INST, B-XLINK (B08 L66 "later sports sound pickup" → no link until B09–B17 exist).
```
