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
