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
