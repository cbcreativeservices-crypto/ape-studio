# Session handoff — 2026-09-27 (owner paused mid-day)

Branch `audio-tools-engine`, HEAD pushed. Everything below is **committed, pushed AND published**
(OTA to production + preview, iOS build 30 rt `64a7eddf`, iOS build 32 rt `5d558314`,
Android vc14/15 rt `02255b7b`). Last publish: groups ios-32 `e096984b`, ios-30 `5986b902`,
android `b7a8a37c`. Google Play release of vc15 is still PAUSED by the owner. iOS build 32 is in
TestFlight (alpha testers). Do not commit Computer A's two discount-code docs
(`docs/APE_ACCESS_CODES_2026_08_21.sql`, `docs/APE_COMP_CODES_GUIDE_2026_09_07.md`).

## ⚠ OPEN — first thing when the owner returns

**Dead ▶ / ? / ⓘ in every lab on the owner's iPhone (iOS 27, build 32).** Owner's answers:
nothing happens on ▶ (no dim, no popup), ? and ⓘ dead too, everything else in the lab works.
Server logs (`query_logs`, UA `ProAudio/32 … Darwin/27`) showed the phone never called
`lab-audio`. Diagnosis: all three buttons PRESENT something (gate popup, ⓘ Modal, Help as
`presentation:'modal'`); LabShell asked for audio on mount → the gate popup presented mid native
push, stuck invisible, and iOS refused every later presentation.
- Fix 1 (`d94c6c57`): InteractionManager delay — did NOT help (does not see native-stack animations).
- Fix 2 (`04df512a`, published): entry request waits for `transitionEnd` (+1.2 s fallback).
- **Ask the owner:** after two cold restarts, does the sound popup appear ~1 s after opening the
  Bass lab, and do ?, ⓘ, ▶ respond? If the popup still never appears, something else is blocking
  presentations on that screen — next suspects: any other Modal mounted `visible` on lab entry
  (StageFullScreen, GuidedLessonSheet, AccuracyNote), or the gate's DimModal on iOS 27.
  Evidence path: Supabase `function_edge_logs` for `lab-audio` from Darwin/27.
- Related hardening already shipped: gate joins an open request and re-presents; LabAudioPlayer
  bounds `setAudioModeAsync` (1.5 s) and its finish listener now tracks the current clip.

## Done today (all published)

1. **Rack trays** never cover the dock inline; SE pass (full room, "more ↓" line, choices before
   the readout on overflow); Sound Systems CONSOLE trays hide the slider (`hideLane`).
2. **Preview harness** gained CompressionLab/GateLab/StereoLab and the five Sound Systems modes.
3. **TestFlight report (John Martin III, build 32):** STUDY NOW landed on the wrong topic —
   certificate topics enrol INACTIVE; the dashboard now switches the focused topic on.
4. **Last topic saved by id**, and the carousel follows the topic when the deck re-sorts.
5. **Dashboard deep-clean (`1101132f`)** — four audits, 20 fixes: jog wheel (tap closes, opens on
   release, scrim, back/blur close, VoiceOver), removed-deck restore, lab-proxy never targeted,
   `/topics/<slug>` links (were `/get/topics/…`), glossary EXIT/back from Home returns Home (the
   tester's glossary report), load tickets, no zero-progress overwrite on a failed user read,
   cache after stale check, celebrations gated on focus, empty-deck dead end, sign-out confirm.

## Needs a phone (not provable in the preview)

Jog-wheel turning feel; Android back on the dashboard overlays; glossary EXIT from Home; the
lab-entry popup fix above.

## Lessons

`docs/APE_ENGINEERING_LESSONS.md` § "2026-09-27".

## Addendum — 2026-09-28 (owner out for the day; back tonight)

**Published (all builds, prod + preview) from `186da5cd`:** ios-32 `3f07e565`, ios-30 `5eaa3393`,
android `a8521c16`. Contents: Cable Install stages 6/8/9/11 redrawn (Fable first pass, Opus finish
with expert + learning reviews — commits cf417014…c604e879, `8c45a492` exhaust wording), Sound
Systems SYSTEM MAP as three columns (`2cb2b4b1`), and the lab touch/playback PROBE (rounds 1–3).
**Play Store:** Internal testing release 15 (1.0.0) rolled out 2026-09-28.

**OPEN — Bass lab silent on owner's iPhone (iOS 27, b32).** Evidence so far: the tap reaches ▶
(probe: hit BHO, down=up=18); the phone DID fetch the recording (lab-audio 200 at 15:01:37Z);
Silent mode OFF → still silent; the other labs (engine sound) silent too; ? and ⓘ open nothing.
The round-3 probe (triple-tap the lab title) now lists: ▶ tap → gate → audio-mode (ok/ERR/TIMEOUT)
→ fetch/cached → player created/replaced + volume → first status updates → ? / i presses.
**First thing tonight:** get that screenshot; the last line reached is where sound dies.
REMOVE the probe (LabShell, labProbe.ts, LabAudioPlayer/useLabAudio/BassLab/HelpKey/AccuracyNote
TEMP lines) once found.

**Cable lab leftovers (agent-reported, not done):** rack rails ~5% wide and the 24-port patch
panel reads 2U (1U in reality) — needs a rack-geometry refactor; Stage 11's question flow is not on
the Rack Unit layout; Stage 8 FINISHED VIEW frames the ceiling from a different viewpoint;
control vs speaker teaching colours (#e0b25e / #ffd35e) nearly identical lab-wide; the other nine
stages were not surveyed.

**Publishing while agents are mid-edit:** publish from a clean `git worktree` at the wanted commit
(npm ci there, then copy `.gitignore` + `modules/*/ios|android` from the main folder so the bytes —
and the fingerprint — match; verify 5d558314 / 02255b7b before any `eas update`).
