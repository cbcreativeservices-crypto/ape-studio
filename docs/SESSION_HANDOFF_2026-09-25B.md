# Session handoff — 2026-09-25, evening

**Read this first.** Then `docs/APE_GOVERNANCE_DECISIONS_2026_09_25.md` (D23–D29,
today's rulings) and the 2026-09-25 evening section of `docs/APE_ENGINEERING_LESSONS.md`.

Repo `C:\Users\profe\dev\ape-studio`, branch `audio-tools-engine`, pushed.
tsc clean, 1,986 tests pass. Working tree clean apart from untracked images (§6).

---

## 1 · ⛔ A background design agent may still be working in this tree

The previous session launched a design agent to bring the **Sound Systems Lab** onto the
Rack Unit layout (owner: *"controls on the bottom, the display above, data in between that
scrolls — many screens need adjustment"*, governance D24). It edits ONLY
`src/screens/lab/soundsystems/**` (and wiring in `src/features/soundsystems/**`), verifies
in the `#soundsystemspreview` harness, then commits **"Sound Systems Lab: Rack Unit layout
pass"**, fills its sync-channel stub, pushes, and writes
`docs/APE_SOUND_SYSTEMS_RACK_PASS_2026_09_25.md` + `Downloads/2026-09-25_SOUND_SYSTEMS_RACK_PASS.md`.

**Before touching anything:**
```bash
cd C:\Users\profe\dev\ape-studio; git log --oneline -6; git status --short | grep -v "^??"
```
- Report file present + commit on the branch → the pass is done; read the report.
- Report absent and `soundsystems` files modified but uncommitted → the agent is still
  running or died mid-way. Do not edit those files; do not `git add -A` (ever); leave the
  preview server alone. If the owner says the agent is gone, review the diff before
  deciding to keep or discard it.
- Never `git add .` in this tree while any of this is outstanding.

## 2 · What shipped today (all pushed)

| Commit | What |
|---|---|
| `51933b51` | 22 lab photographs (Cable Install Stage 2, Connector Select Stations 1 & 4) ALONGSIDE the vectors, `kit/LabPhoto` |
| `3d224541` | 24-hour usage review: guest 401 guards + sign-up breached-password hint (3 DB migrations applied) |
| `6af09a42` | Dashboard focus fix (TestFlight report) |
| `3440d2e0` | EXPLORE: standards program + certificate in two study areas |
| `b9b4ff71` | Reveal-card slots for Stage 5 sort (17) + Final Inspection (27), EMPTY until Computer C delivers; **LabPhoto aspect fix** (web ignored `aspectRatio` on an Image — photos rendered 765 px tall on phone cards); guard test `test/cableInstallArt.test.ts` |
| `430db688` | iPad: Profile on a 760 **card column**; Glossary route **drops its fade transition** (best-evidence fix for the iPad black screen) |

**Published (OTA, 19:22–19:26 UTC, both channels, from `52eecd8e`):** everything up to and
including `b9b4ff71`. Fingerprints matched both installed runtimes; Pixel proven running
(launch 2 "No update available"); u.expo.dev serves iOS update
`01a0da05-06fd-7ac6-b670-0d6b1469ec10` on `production`. **Owner confirmed on the iPad:
"the photos look right now."**

**NOT published:** `430db688` (Profile width + Glossary fade). ⛔ Publish only on the owner's
own words. When they say so, follow §7.

## 3 · Owner's open iPad reports

1. **Profile "narrow squeezed"** — fixed in `430db688` (`cardColumn`, 760). Verified 760 at
   1024 in the browser. Needs a publish + the owner's look.
2. **Glossary "just black screened (2 attempts)"** — NOT reproduced. Evidence: no Sentry
   events; edge logs show the corpus paged fully on attempt 1 (19:35:24–53) and was cached
   on attempt 2; renders at tablet width on web. The Glossary was the only Study route with
   `NAV_FADE`, reached from Home by a cross-tab navigate — removed (default push). If it
   still goes black after a publish, ask the owner: is the GLOSSARY header / tab bar
   visible? does tapping change anything (the intro modal reshows until tapped)? does
   rotating change anything? Side note: the iPad is a GUEST (anonymous device key minted at
   19:35:23 — designed behaviour, not a fault).

## 4 · Waiting on other computers

- **Computer C — 46 lab images.** Zip handed over:
  `Downloads/2026-09-25_COMP_C_LAB_IMAGES_HANDOFF.zip` (prompt package + manifest + 22
  approved references + rejected drafts). Package of record:
  `docs/art/APE_LAB_PHOTO_PROMPTS_2026_09_25.md`. When PNGs land in `assets/exports/`
  named `group-N-NN-<lab-id>.png`: convert to WebP (Pillow q82, 1024 wide) into
  `assets/lab-art/cable-install/{supports,defects}/<id>.webp` (+ `cable-install/extension.webp`,
  `connector-select/…` for 3-02), add one `require` line per file in
  `data/supportArt.ts` / `data/defectArt.ts` / `data/cableTypeArt.ts`; the guard test
  catches bad keys/paths. ⛔ Images only on the owner naming the folder and saying go.
- **Computer A — topic split.** ⛔ PARKED by the owner (D25). A's round-2 entry at the top of
  `docs/CROSS_SESSION_HANDOFF.md` (171 topics) is SEEN, not acted on, ACK left blank on
  purpose. Do nothing until the owner un-parks.
- **Build.** `427a0897` (native audio crash fix, Swift) still needs a BUILD — owner's cue
  only. Until then every OTA publish must temporarily restore the pre-fix Swift file so the
  iOS fingerprint matches (§7).

## 5 · Still open from earlier today
- Two Sentry hangs left deliberately (`APE-STUDIO-R`/`-S`) — owner: leave them.
- Launch-day landmine: the website reset link points behind the pre-launch gate; one email
  template must carry both `{{ .Token }}` and `{{ .ConfirmationURL }}` (memory
  `project_launch_reminders`).
- Tester migration: build 30 is submitted; testers on build 28 must update manually.

## 6 · Do not touch
- `assets/exports/*`, `assets/compc-*`, `assets/Certificate_Squares/*` — untracked, on
  purpose. Never add/commit/delete images without the owner naming the folder.
- `src/screens/lab/soundsystems/**` while §1 is outstanding.
- `web/` — a push publishes the live site (Vercel production = this branch).

## 7 · How to publish when the owner says "update the phones"
```bash
cd C:\Users\profe\dev\ape-studio; git show 427a0897^:modules/ape-dsp/ios/ApeDspModule.swift > modules/ape-dsp/ios/ApeDspModule.swift; npx expo-updates fingerprint:generate --platform ios | python -c "import json,sys; print(json.load(sys.stdin)['hash'])"; npx expo-updates fingerprint:generate --platform android | python -c "import json,sys; print(json.load(sys.stdin)['hash'])"
```
Expected: iOS `64a7eddf33375780a486104c99dc4cc230b728e6`, Android
`02255b7bae6489047ab17f67be58e5f50885e644` (the installed runtimes). Stop the preview server
first (Metro cache). Then `npx eas-cli update --branch production --environment preview
--message "…" --non-interactive`, the same for `preview`, then
`git checkout -- modules/ape-dsp/ios/ApeDspModule.swift`. Prove the Pixel over adb
(launch 1 downloads, launch 2 "No update available"); curl u.expo.dev for the iOS manifest;
give the owner the iPad/iPhone relaunch steps. Details: memory `reference_fast_dev_loop`.

## 8 · Preview harness
`ape-web` at http://localhost:8091 (start via preview_start). Hash routes need a FULL load —
change the query string: `?r=x#soundsystemspreview`, `#cableinstallpreview`,
`#connectorselectpreview`, `#profilepreview` (that one lacks the AudioOutputGate provider and
renders blank — use the real Profile tab instead). RN Pressables answer
`dispatchEvent(new MouseEvent('click',{bubbles:true}))` on `[aria-label]`; SVG targets need
`find` + ref clicks.
