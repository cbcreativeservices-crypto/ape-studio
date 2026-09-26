# Session handoff — 2026-09-26 (B: the legibility night + morning walkthrough)

**Read this first.** Then `docs/APE_GOVERNANCE_DECISIONS_2026_09_25.md` (D34–D37) and the
2026-09-26 section of `docs/APE_ENGINEERING_LESSONS.md`. This supersedes `SESSION_HANDOFF_2026-09-25D.md`
(its §8 publish routine still applies). `SESSION_HANDOFF_2026-09-26.md` (no letter) is the OLDER Sound
Systems build note — ignore its date.

Repo `C:\Users\profe\dev\ape-studio`, branch `audio-tools-engine`, HEAD = this handoff, **pushed**.
`tsc` clean, **1,995 tests pass**. Tree clean apart from the long-standing untracked image folders.

---

## 1 · Phones — NOTHING from this session is published

Last publish is still the retired session's **23:40 PDT 2026-09-25** from a clean worktree at `6de27879`
(iOS `01a0dc73-5eee-74f2-…`, Android `01a0dc73-5eee-747a-…`, Pixel on it). Everything below is JS-only and
rides the update; **the owner said "update the phones" and the auto-mode classifier refused `eas update`
in this session** (see §5). The Swift file in the tree is the COMMITTED crash fix (`427a0897`) — a build
may go from this tree as is; an OTA needs the pre-fix Swift restored first (25C §8).

## 2 · What landed (39 commits, all pushed)

| Area | Commits | What |
|---|---|---|
| Shared rack full screen | `f3be3797` `eeece891` `62ae564b` `800b9a9f` `c3e80579` `f8b9d79d` `2d392040` `1a69d3ca` | Rack owns the full-screen modal with its dock + trays inside (`RackStage.fullScreen`); title shrinks; sideways pan; hint rolls up/down; bezel readouts on top; dock rises over an open tray; 34 pt HIDE/FULL row (44 pt hit); cropped bezel cell drops its label; narrow fixed-shape drawings open at the fill-width step. `StageTextScale` for RN text over Skia; `kit/ExpandableFigure` for inline figures. |
| Harness | `7a397c3c` | `#labpreview/<Screen>/<id>` opens any lab in the web preview. |
| Eleven labs, 9 pt + FULL SCREEN | Cable `26fb82d3` · De-Esser `6293cb24` · Wave `58b6fe79` · Meter `a360c57f` · Speech `309e60b3` · Foundations `fa535552` · Mic `3107cbb7` · Amp `78b652c9` · EQ `8ed7fbc8` · Osc `20a8fc69` · Env `2160048d` | Every display label ≥ 9 pt at 375/390; full screen with controls. Sound Systems re-checked, no change. |
| Parity pass (morning) | Wave `89cb3917` · Mic `5d80ba6a` · SS `41f92f3a` · Osc `0063c87d` · Cable `9ce7586c` · De-Esser `205426d2` · Speech `02054a6a` · Amp `62ec9832` · Env `ab23175b` · Foundations `ae5e259b` · EQ `7cc09e12` · Meter `f031688a` | Everything in every drawing zooms with the step; inline labs put live readouts at the top of the dock. |
| Bass Guitar Lab | `db203299` | ▶ plays the 72 published `bass_fretboard` recordings; the string model is the fallback. |
| Docs | `08f4acd6` `4515b6d5` + this | `docs/APE_LAB_LEGIBILITY_PASS_2026_09_26.md` (report of record, §6 = morning rulings), D35–D37, lessons. |

## 3 · The walkthrough — where it stopped

The owner walked **Wave Physics · Module 1 Reflection** in the pane and ruled the five D35 items; they
were applied everywhere. The walkthrough was to continue with **Module 2 Absorption** ("next") — it has
NOT been walked. Harness: `preview_start {name:'ape-web-8092'}` → `http://localhost:8092/?v=x#labpreview/WaveModule/absorption`,
tab at 390×844, tap FULL SCREEN, show 1× then 2×, then ask.

## 4 · Owner's "still needed" list (given 2026-09-26, before the build)

A new build carries ONE thing an update cannot: the **iOS audio-crash fix** (`427a0897`; iOS build 30
predates it; Android build 14 has it). Dev bypass flags all false. Sentry EAS vars unverified (optional).

After the build and upload: `eas submit` + TestFlight Internal group (A's lane); flip
`certificate_requires_exam` after the client ships; deploy `store-notifications`; Computer C images (5
defect remakes, 17 sort photos, extension cord); topic-split copy (parked); Production labs screens +
design items; calculator accuracy audit; glossary on-disk cache; lab leftovers (font-only labs from the
brief §7; Cable Install resume quirk; VU/Stereo tall box at 1×); iPhone checks (flashcard scroll, OPEN
GLOSSARY); launch day: website gate off + robots/sitemap 200, password-reset flow + email template,
paywall "beta / end of year" copy. After launch: home-setup button, Liquid Studio phase control.

## 5 · Blocked in this session — the owner decides

- **`eas update` was refused by the auto-mode permission classifier** ("Production Deploy") even on the
  owner's explicit "update the phones"; so was `cat` on the 25C publish doc and a memory file. Options
  given to the owner: run the three commands themselves (restore pre-fix Swift with bash → two
  `eas-cli update` calls with `$env:TEMP` set to an own folder → `git checkout` the Swift file), or add a
  permission rule for `npx eas-cli update` and ask the session to retry. Neither happened yet.

## 6 · Harness facts
- Own server `ape-web-8092` (user-level launch.json). 8091 belongs to another chat — never stop it.
- Playwright MCP is shared; use the built-in pane with a tabId per agent (cap 9 tabs).
- The pane reports the page hidden: rAF ~3/s, audio gate re-mutes, HoldToActivate never completes.
  `window.__r.getModules()` reaches any module for diagnostics.
- Screenshot before measuring (onLayout waits for a paint in a background tab).

## 7 · Do not touch
`assets/exports/*`, `assets/compc-*`, `assets/group-5-defect-library/*`, `assets/Certificate_Squares/*`
(untracked on purpose); `web/` (a push publishes the site); `kit/PagedLab.tsx` behaviour; images without
the owner naming the folder and saying go.

## 8 · Publishing ("update the phones")
25C §8 with the 25D corrections: restore the pre-fix Swift file with **bash**
(`git show 427a0897^:modules/ape-dsp/ios/ApeDspModule.swift > modules/ape-dsp/ios/ApeDspModule.swift`),
expected fingerprints iOS `64a7eddf33375780a486104c99dc4cc230b728e6` / Android `02255b7bae6489047ab17f67be58e5f50885e644`
(iOS re-verified this session), own `$env:TEMP`, both channels, Pixel proves the production Android id,
then `git checkout -- modules/ape-dsp/ios/ApeDspModule.swift`. Never publish unasked.
