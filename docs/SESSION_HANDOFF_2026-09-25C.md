# Session handoff — 2026-09-25, late afternoon (after the evening handoff)

**Read this first.** Then `docs/APE_GOVERNANCE_DECISIONS_2026_09_25.md` (D23–D31) and the
2026-09-25 "late" section of `docs/APE_ENGINEERING_LESSONS.md`. This supersedes
`SESSION_HANDOFF_2026-09-25B.md` (kept for history).

Repo `C:\Users\profe\dev\ape-studio`, branch `audio-tools-engine`, HEAD `dbf6c9b2` + this
handoff, pushed. tsc clean, **1,991 tests pass**. Working tree clean apart from untracked
images (§7).

---

## 1 · PUBLISHED — both channels, from `dbf6c9b2`, 16:1x PDT (23:1x UTC)

The owner's own publish attempt earlier had NOT landed (nothing new on any branch); ccode
published on the owner's words ("also do an ota update").

| Channel | Platform | Update id | Proof |
|---|---|---|---|
| production | iOS | `01a0dad5-3c2d-760a-8d4f-3c56f7ef5770` | u.expo.dev serves it (HTTP 200, `expo-update-id` header) |
| production | Android | `01a0dad5-3c2d-734c-a894-cf9fdb866913` | — |
| preview | iOS | `01a0dad8-bdb8-7cd5-b70c-67ebcd7ebd63` | — |
| preview | Android | `01a0dad8-bdb8-7886-be70-e92043577c7f` | **Pixel proven over adb**: launch 1 downloaded this id and restarted into it; launch 2 "No update available" |

Fingerprints matched the installed runtimes (ios `64a7eddf…`, android `02255b7b…`) with the
pre-fix Swift file restored; it was reverted after — tree clean. **Owner still has to confirm
the iPad and iPhone** (close fully, open, wait a minute, close fully, open).

**What this update carries:** the Sound Systems Lab Rack Unit pass (`eaff23f1`), its bug +
latency pass (`476c0de0`), the map line fix (`1099d4de`), 12 Cable Install defect photographs
(`8a00ef7a`), and the app half of the per-device glossary meter (`1099d4de`). The DB half was
applied live earlier (§3).

## 2 · What landed this session (all pushed)

| Commit | What |
|---|---|
| `eaff23f1` + `d31c1c61` | **Sound Systems Lab: Rack Unit layout pass** (background agent) — 43 of 52 pages are rack pages; report `docs/APE_SOUND_SYSTEMS_RACK_PASS_2026_09_25.md` |
| `476c0de0` + `1ace4f12` | **Sound Systems Lab: bug + latency pass** (agent) — 6 bugs, 2 slow rides (LEARN 17 AIM 40/70 ms → 14/20; PREAMP 27–29 → 18–24); report `docs/APE_SOUND_SYSTEMS_BUG_LATENCY_PASS_2026_09_25.md`; one wording change (two possessives) |
| `8a00ef7a` + `24ed025e` | **Cable Install: 12 Computer C defect photos wired** (`data/defectArt.ts`; 8 show on Final Inspection findings, 4 have no card); SupportsScene `<Svg accessible>` React-DOM error fixed; **Computer C brief v2** `docs/art/APE_LAB_PHOTO_BRIEF_v2_2026_09_25.md`; old package marked SUPERSEDED |
| `1d0755c2` + `6bbebf58` | Brief v2: zip-contents section; the complete zip (§4) |
| `1099d4de` + `dbf6c9b2` | **Glossary meter per device** (client + migration, §3) and **Sound Systems map**: runs 2.2 → 1.3, arrowheads 7.5 × 4.2 with a dark edge, edge labels on knocked-out pills (owner's phone screenshot) |

## 3 · DB change applied live (Supabase MCP, project `yjgolswjggmlpeowvtxr`)

`supabase/migrations/2026092502_glossary_meter_per_device.sql` — owner: a guest who hit the
weekly lock signed in to a free account on the same phone and "it was completely unlocked
fresh again". New table `public.glossary_usage_device` (one row per install id);
`glossary_consume(p_device_id text default null)`, `glossary_usage_status(p_device_id …)`,
`get_glossary_definition(p_id uuid, p_device_id …)` replace the old overloads (dropped). A
lookup needs room in BOTH the identity row and the device row; a block increments neither;
the fuller row is reported. Verified on the live DB in a rolled-back transaction. Guard test
`test/glossaryMeterPerDevice.test.ts`. Recorded for Computer A in `docs/CROSS_SESSION_HANDOFF.md`.
Memory: `reference_glossary_meter_per_device`.

**To test on a phone once it has the update:** as a guest, open 14 definitions → lock; sign in
to `gratis@` (free) → still locked; sign out → still locked; Guest Mode again → still locked.

## 4 · Waiting on other computers / the owner

- **Computer C — 31 images.** The owner rejected the 09-25 prompt package ("100% inaccurate
  and incomplete … design is nothing like the app needs") and stopped C. The replacement is
  ONE zip, nothing to assemble: `Downloads/2026-09-25_COMP_C_LAB_IMAGES_HANDOFF_v2.zip`
  (brief, manifest, 34 ready-to-paste prompts, app screens + the 17 sort pictograms, the 22
  approved references, every draft with a verdict). Rule it teaches: one photo per Final
  Inspection FINDING matching its label and zone; Stage 5 = the same object the pictogram
  shows; white background for object shots (owner ruling 2026-09-21); 1200 × 896 exactly.
  When PNGs land: convert (Pillow, 1024 wide, q82) into `assets/lab-art/cable-install/
  {supports,defects}/<id>.webp`, one `require` line per file, guard test
  `test/cableInstallArt.test.ts`. ⛔ Images only on the owner naming the folder and saying go.
- **The 5 mismatched defect photos** (d01 crushed-by-tie, d04 sharp-bend, d05 connector-strain,
  d08 slack-pile, d10 bad-floor-crossing) are IN the app under findings whose words they do not
  match. Owner has not ruled; unwire on their word or wait for C's replacements.
- **Owner's iPad/iPhone confirmation** of the rack lab and the map lines (§1).
- **Build.** `427a0897` (native audio crash fix, Swift) still needs a BUILD — owner's cue only.
  Until then every OTA publish must temporarily restore the pre-fix Swift file (§8).
- **Computer A — topic split.** ⛔ PARKED (D25). Do nothing until un-parked.
- Two Sentry hangs left deliberately; tester migration to build 30; launch-day landmines
  (memory `project_launch_reminders`).

## 5 · Known limits carried (do not "fix" without asking)
From the bug pass: OPERATE 1/5 wrong first step reads SO FAR OK until a predecessor is
tapped (engine design); capstones 5–9 open at REQS 1/n on an empty venue (vacuous
requirements); BUILD state not persisted between BUILD pages; LEARN 18 ≈ 15 ms/step
(react-native-svg rewrites every path on re-render — under threshold). Sound Systems short-
phone and tablet passes were verified with the pane hidden (SVG stages cannot mount there).

## 6 · Preview harness, this session's facts
- `http://localhost:8091` is ANOTHER CHAT'S server (still running at hand-back). Open it with
  `preview_start` + `url:`; never try to stop it (the classifier refuses, rightly). HMR picks
  up edits. Hash routes need a full load: change the query string.
- **Playwright (`mcp__playwright__*`) is SHARED with background agents** — a page can be reset
  to about:blank between your calls. Do multi-step captures in ONE `browser_run_code_unsafe`
  call (no `require`; Playwright creates screenshot dirs itself).
- The Cable Install lab resumes at its last stage on reload — START LAB is not always there.
- Built-in browser: use `tabId` explicitly while an agent runs.

## 7 · Do not touch
- `assets/exports/*`, `assets/compc-*`, `assets/group-5-defect-library/*`,
  `assets/Certificate_Squares/*` — untracked, on purpose.
- `web/` — a push publishes the live site.
- `src/screens/lab/kit/PagedLab.tsx` behaviour (30 labs).

## 8 · How to publish when the owner says "update the phones"

1. Tree clean? (`git status --short | grep -v "^??"`). If someone's work is uncommitted, use
   the clean-worktree routine in `SESSION_HANDOFF_2026-09-25B.md` §7.
2. Restore the pre-fix Swift file, check both fingerprints:
```bash
cd C:\Users\profe\dev\ape-studio; git show 427a0897^:modules/ape-dsp/ios/ApeDspModule.swift > modules/ape-dsp/ios/ApeDspModule.swift; npx expo-updates fingerprint:generate --platform ios | python -c "import json,sys; print(json.load(sys.stdin)['hash'])"; npx expo-updates fingerprint:generate --platform android | python -c "import json,sys; print(json.load(sys.stdin)['hash'])"
```
   Expected ios `64a7eddf33375780a486104c99dc4cc230b728e6`, android
   `02255b7bae6489047ab17f67be58e5f50885e644`.
3. Check the newest entry on each branch is not a rollback (`eas update:list --branch …`).
4. Publish `production` then `preview` (`--environment preview --non-interactive`). If another
   chat's preview server is running, point the export at its own temp folder first
   (`$env:TEMP=…; $env:TMP=$env:TEMP`) — otherwise `--clear` fails with ENOTEMPTY on the
   Metro cache. ⚠️ In auto mode the classifier may refuse `eas update` as a "Production
   Deploy" even on the owner's words; it later allowed it on the owner's repeated instruction.
   If refused: stop, hand the owner the three commands, do not route around it.
5. `git checkout -- modules/ape-dsp/ios/ApeDspModule.swift`.
6. Prove the Pixel: `adb shell am force-stop com.cbcreativeservices.apestudio`, launch via
   `monkey -p … -c android.intent.category.LAUNCHER 1`, wait ~75 s, repeat; `adb logcat -d |
   grep dev.expo.updates` — launch 1 shows the downloaded manifest id, launch 2 "No update
   available".
7. Confirm what an iPhone gets:
```bash
curl -s -D - -o /dev/null -H "expo-platform: ios" -H "expo-runtime-version: 64a7eddf33375780a486104c99dc4cc230b728e6" -H "expo-channel-name: production" -H "expo-protocol-version: 1" -H "accept: multipart/mixed, application/expo+json, application/json" https://u.expo.dev/72f69470-fe12-4ecb-a10b-e8331d53812d
```
   (plain `application/json` accept → 406). Then give the owner the two-launch steps.
