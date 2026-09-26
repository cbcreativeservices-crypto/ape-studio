# Session handoff — 2026-09-26 (C: the Wave Physics walkthrough)

**Read this first.** Then `docs/APE_GOVERNANCE_DECISIONS_2026_09_25.md` **D38–D43** (new today) and
the **2026-09-26 (C)** section at the end of `docs/APE_ENGINEERING_LESSONS.md`. This supersedes
`SESSION_HANDOFF_2026-09-26B.md` (its §1 publish state, §4 "still needed" list, §7 do-not-touch and
§8 publish routine all still apply — only the walkthrough status changed).

Repo `C:\Users\profe\dev\ape-studio`, branch `audio-tools-engine`, **everything pushed**.
`tsc` clean, **1,995 tests pass**. Tree clean apart from the long-standing untracked image folders
and **Computer A's discount-code work** (see §4).

---

## 1 · Phones — STILL NOTHING PUBLISHED

Last publish is still the retired session's **23:40 PDT 2026-09-25** (`6de27879`). Everything from
session B **and** today is JS-only and rides the next update. Publishing is the owner's word only
(26B §8 routine: restore the pre-fix Swift with bash, fingerprints, own `$env:TEMP`, both channels,
Pixel proves it, restore the Swift). Nobody asked to publish today.

## 2 · What landed today (32 commits, all pushed)

All 16 Wave Physics modules were walked with the owner, one by one, in the pane at 390×844.

| Area | Commits | What |
|---|---|---|
| Full screen (every lab) | `a5e33e6c` | 1× always = the whole drawing; a zoom step anchors on the last touch, else the centre (D38). |
| Wave walls | `a5e33e6c` `edcb3a3a` | Each wall material drawn in section (stud wall, slab, pane, planks, drape, pile, wedge foam, wrapped fiberglass, seated row); deep walls where a material is chosen; walls zoom. |
| Diffusion | `94dc0f69` `07e0d005` `60ec580c` `190e9bc6` `9dafbce2` | QRD diffuser drawn on the wall at its printed depth; pulse balls split and burst off it (1/N energy share, bluer); opens with pressure on. |
| Pressure / rays | `8b52b6b1` `212a38b2` `8b1b382f` | Pressure shows balls without rays; timing labs open with balls on (D42); balls 13 % slower. |
| Refraction | `1b54b067` | One model for picture and readout; 400 m scene, heights ×20 tagged; `H @150 m`. |
| Diffraction | `70ffad7b` | True-scale scene; wrap is the only sound in the shadow; listener level halo. |
| Interference | `e536683d` | `vs 1 SPKR` (+6.0 dB / NULL); map resolution grows with zoom. |
| Comb | `0595a1c2` | Comb curve on the display; mic 0.5 m from the wall; mic glyph. |
| Standing / all maps | `efbd84f7` | 64 colour steps; listener head on a dark disc. |
| Proportions (all 16) | `10748284` `3e9499bd` | Objects to real size (D39); Line Array in true section; rooms fill their stage (9–16); `RING GAP > λ` disclosure. |
| Coverage | `03740e86` | Open air; −6 dB edges drawn; `vs ON-AXIS`. |
| Delay Alignment | `eb84fe4c` | Open air; `SUM` vs perfect addition (auto-align used to make the seat quieter). |
| Cardioid | `d8d538eb` | FRONT SUB / REAR SUB · Ø · ms / AUDIENCE / REAR MIC labels on plates. |
| Beam Steering | `afe2e694` | Delay staircase + steer line; Δt in ms; `vs STRAIGHT`. |
| Echo | `d09fd0f1` `2c96565d` | `FAR WALL` readout (291 ms canyon, was side walls' 74 ms) + path; arrival timeline on the display; each room's walls match its copy. |
| Reverb | `046f0ed4` `17fbcfcb` | Decay curve on the display; playhead rides it in step with each pulse. |
| Rings | `d2c9c357` | Rings clipped at the walls in every room… |
| Room Builder | `abeb48ec` → `0981b406` | …except Room Builder: what the neighbours hear (D43) + accuracy note. |
| Docs | this commit | D38–D43, lessons (C), this handoff. |

## 3 · Where the walkthrough stands

**Done: all 16 modules** walked and ruled. No module is mid-review. The owner has not yet looked at
the other labs' full-screen views against D38's new "1× = whole drawing" rule (it changed the
opening zoom for narrow fixed-shape drawings in every lab) — worth one glance on the next pass.

Open, owner-deferred (not asked to do):
- Room Builder outside zone is 4 m; at 40 Hz the rings are ~8.6 m apart so one passes only now and
  then. Widening the zone shrinks the room on the glass — owner's call.
- Reverb's playhead is synced to the balls (3.45 s cycle), so it runs ~0.6× real time; offered a
  true-time option, no answer.
- Cardioid: the listener (the FRONT readout's point) is unlabelled; offered "FRONT MIC".
- Refraction keeps symbol-sized speaker/bust (heights are ×20 there; a true figure would be 35 m).

## 4 · Not mine — leave alone

- `supabase/migrations/2026092601_remove_discount_access_codes.sql` (untracked) and the edits to
  `docs/APE_ACCESS_CODES_2026_08_21.sql` / `docs/APE_COMP_CODES_GUIDE_2026_09_07.md` are
  **Computer A's** discount-code removal (already applied live per its header). Owner ruling today:
  *"let comp a finish discount codes unless it instructed you to."* Do not commit them.
- `docs/CCODE_TOPIC_CERT_COPY_2026-09-25/` (untracked) — topic-split copy; that work is parked.

## 5 · Harness facts (today)

- `ape-web-8092` is registered to another chat, so `preview_start {name}` refuses; open it with
  `preview_start {url:'http://localhost:8092/?v=x#labpreview/WaveModule/<id>'}` — the server is up
  and hot-reloads this repo. Module ids: reflection absorption diffusion refraction diffraction
  interference comb standing coverage linearray delayalign cardioidsub beamsteer echo reverb builder.
- The pane drops the 390×844 emulation between turns — `resize_window` first in every batch.
- Work in a background tab (`tabs_create`) when the owner may be clicking in the fronted one.
- First FULL SCREEN render of a heat map can take several seconds in the throttled pane — wait
  before calling it blank.
- The post-commit hook stamps a sync stub per commit; fill `affects/needs` (Wave work = "nothing —
  client JS only") and it rides the next commit.

## 6 · Next

Ask the owner. The standing lists are 26B §4 (build carries the iOS crash fix; A's lane items;
launch-day items) plus §3 above.

---

## 7 · Evening (owner away, standing instruction: fix tester reports → QA today's screens → full build)

**TestFlight tester screenshots** (read-only in the owner's Chrome, nothing changed in App Store
Connect): the three NEW reports (John Martin III, build 30, iPhone 16 Pro, all on Flashcards) are
fixed in `d2efa1bf` + `b7d9f414`:
- a long definition can be read to the end — a tap before the end now PAGES the text down (and only
  flips the card once the end is reached); a "more ↓" cue shows while there is more;
- the last line clears "Suggest a correction";
- both filter rows fit on one line at normal text size (the full-screen and timer buttons used to
  wrap onto a third line); they still wrap as a large-system-text fallback.
Older reports (1–4 days) were already fixed 09-23/25; C Booth's "glossary button → study
dashboard" (`430db688`) still wants an **iPhone re-test by the owner**.

**QA agents** (three, report-only, in the built-in pane): Wave 1–8, Wave 9–16, shared components +
Flashcards review. All actionable findings fixed in `b7d9f414` and `71f87615` (duplicate React key,
prose that contradicted readouts, full-screen tray veiling the drawing at 1×, snap-back after
zoom, scaled strokes, "THROUGH −0 dB", coverage wedges outside the room, Delay Alignment 0.01 ms,
Echo/Reverb room sizing, Line Array copy/pitch/floor, Diffusion legend "scattered", …). No
regressions found in the other labs' full screens or graphs. Deliberately NOT changed: Room
Builder outside rings start just under the room colour for every wall (owner's wording, D43 —
reach carries the loss; the QA agent suggested scaling the start by the loss — owner's call);
Coverage's flat-in-wedge directivity with a −12 dB floor (disclosed model). Not reachable in the
preview: Sound Systems module pages, Oscillator/Bass (sound-safety modal), fxLabConfigs labs.

**Full build — owner's word ("lets do the full build, not just an ota")**, from `3c6a37cd`:
- **Both FINISHED** (checked 2026-09-26 evening).
- Android **version code 15** — `db0de81b-381b-443f-a739-195c7373a0bb`
- iOS **build number 32** — `520707e3-1138-4fd8-8ffb-ce10a7071f8b` (31 was consumed by a first
  attempt my 15-min command timeout cut off mid-upload; the project archive is 636 MB — the
  untracked image folders ride along; do NOT add an .easignore, it breaks OTA fingerprints)
- These binaries carry EVERYTHING: the iOS audio-crash fix `427a0897` plus all of 26B and today.
- **Not submitted.** `eas submit` / TestFlight / Play upload are Computer A's lane (build ≠ submit).
- No OTA was published: the phones still run the 23:40 09-25 update until the new builds are
  installed. A new binary has a NEW runtime fingerprint, so a later `eas update` for these builds
  needs no Swift-restore dance.

**Also started (owner, evening):** a background Opus agent redesigning every Cable Dressing &
Installation Lab display, one scene at a time (owner: "primitive … would have to not allow the lab
to be published"). It commits per scene, does NOT push, touches no images. Its work is NOT in
builds 32 / 15 — it ships in a later update or build after the owner reviews it.
