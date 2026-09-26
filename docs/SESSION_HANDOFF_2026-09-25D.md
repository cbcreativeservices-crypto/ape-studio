# Session handoff — 2026-09-25, late night (after 25C)

**Read this first.** Then `docs/APE_GOVERNANCE_DECISIONS_2026_09_25.md` (D23–D33) and the
2026-09-25 "late" and "night" sections of `docs/APE_ENGINEERING_LESSONS.md`. This supersedes
`SESSION_HANDOFF_2026-09-25C.md` (kept for history — its §8 publish routine still applies).

**If the job is the lab legibility work** (FULL SCREEN + 9 pt labels for eleven more labs), the
brief is `docs/LAB_FULLSCREEN_AND_9PT_HANDOFF_2026_09_25.md` (copy in Downloads:
`2026-09-25_LAB_FULLSCREEN_AND_9PT_HANDOFF.md`). Read it whole before any code.

Repo `C:\Users\profe\dev\ape-studio`, branch `audio-tools-engine`, HEAD `a2f8a18d` + this
handoff, **pushed**. `tsc` clean, **1,991 tests pass**. Tree clean apart from the long-standing
untracked image folders (§7).

---

## 1 · Phones — everything below is PUBLISHED and proven

Five over-the-air updates tonight, each to `production` AND `preview`, each followed by the Pixel
proof (launch 1 downloads the new id and restarts; launch 2 "No update available") and a curl
check that u.expo.dev serves the new iOS id. Latest:

| Channel | Platform | Update id | What it carries |
|---|---|---|---|
| production | iOS | `01a0dc58-f889-751b-9299-2951f4d34ec5` | everything below (latest: dashboard label) |
| production | Android | `01a0dc58-f889-7019-b44d-876c3f29ede3` | Pixel proven |
| preview | iOS / Android | `01a0dc5c-0dde-…` | same |

- The **Pixel now runs the Play-signed internal-testing build 14 on `production`** (Computer A:
  do not sideload dev/preview builds onto it — signature mismatch). The old note "Pixel = preview"
  is wrong.
- The owner still confirms the iPhone/iPad by eye (close fully, open, wait a minute, close, open).

## 2 · What landed tonight (all pushed and published)

| Commit | What |
|---|---|
| `6c6e3be3` | Cable Install: 5 mismatched defect photos UNWIRED (d01 crushed-by-tie, d04 sharp-bend, d05 connector-strain, d08 slack-pile, d10 bad-floor-crossing) — those Final Inspection cards are drawing-only; webp files still on disk. Remake brief `docs/art/APE_DEFECT_PHOTO_REMAKE_BRIEF_2026_09_25.md`; zip `Downloads/2026-09-25_COMP_C_DEFECT_PHOTO_REMAKE_5.zip` (v2 brief findings 1/2/3/4/6 marked superseded). |
| `70325ddc`, `795b5f8f` | Codes (D33): Create Account + Settings → Redeem + placeholders + "not recognized" + help all say "type it exactly as given, including the dashes (-)"; no discount/sponsor wording; the client's `discount_pending` status and message removed. |
| `d0276ac1` | Flashcards: full-screen definition text no longer clips its last word on iPhone (tester: "Impairment" ended "safety-sensi"). Best-evidence fix (iOS-only; not reproducible on web/Pixel) — confirm on an iPhone. |
| `987cf20e` | Sound Systems: **FULL SCREEN** view for every drawing display (RackUnit opt-in `stage.onEnlarge`; `soundsystems/StageFullScreen.tsx`, `stageAspect.ts`; zoom 1/1.5/2/3×, pan, all orientations, still tappable). |
| `54e48aee`, `16735785` | Sound Systems: every display label ≥ 9 pt (was down to 2.6). Report `docs/APE_SOUND_SYSTEMS_LEGIBILITY_PASS_2026_09_25.md`. Re-measured by the lead: every page 9.0–10.1 pt at 390. |
| `f687664f` | Dashboard: Safety / Grounding & Electrical / Workplace Skills / Audio Fundamentals Lab show "TOPIC n OF m · REQUIRED FOR EVERY CERTIFICATE" (TestFlight: John Martin III thought his Microphone Building enrollment had "locked on a different course"). |
| `7af84b8a` | The legibility handoff for the next job. |

## 3 · TestFlight feedback — state (the owner asked ccode to check it tonight)

Read in App Store Connect → TestFlight → Feedback → Screenshots (owner's Chrome, signed in).
Nothing was changed in App Store Connect.
- 10 older reports (Frank, Jason, 2–3 days old) were already fixed and shipped 09-24
  (`docs/TESTER_FEEDBACK_2026_09_23.md`).
- **John Martin III** (build 30) — explained + fixed (`f687664f`, above).
- **C Booth / owner** (build 28): "glossary button took me to the study dashboard" — best-evidence
  fix `430db688` shipped at 16:15. **Owner to re-test on the iPhone:** Home → OPEN GLOSSARY.
- ⚠️ Store consoles are still Computer A's lane (memory `feedback_comp_a_owns_store_consoles`);
  tonight's check was on the owner's direct instruction and only READ tester feedback.

## 4 · Waiting on other computers / the owner

- **Computer C** — two packages out: the v2 lab-images zip (31 images) and tonight's defect remake
  zip (5 photos). When PNGs land: the owner names the folder and says go; convert (Pillow, 1024
  wide, q82) into `assets/lab-art/cable-install/{supports,defects}/<id>.webp`, one require line
  each, guard test `test/cableInstallArt.test.ts`. The remakes re-add the five lines removed in
  `6c6e3be3`.
- **Computer A** — asked to drop the `discount` kind of access code (D33); A has queued it as
  their first DB item. A's topic + certificate copy handoff (`docs/CCODE_TOPIC_CERT_COPY_2026-09-25/`)
  is SEEN but the topic split is **PARKED** (D25) — do not apply until the owner un-parks it.
  Tonight's answers to A are in `docs/CROSS_SESSION_HANDOFF.md` (top).
- **Build** — `427a0897` (native audio crash fix, Swift) still needs a BUILD, owner's cue only.
  Until then every publish restores the pre-fix Swift file first (§8 of 25C; use **bash**, not cmd —
  cmd gave iOS fingerprint `8ba35686…` instead of `64a7eddf…`).
- **Owner checks on a phone:** the Sound Systems FULL SCREEN button and readable labels; the
  "Impairment" flashcard ends "safety-sensitive work."; Settings → Redeem wording; the glossary
  weekly meter per device (25C §3 test).

## 5 · Next jobs (owner's call which)

1. **Lab legibility** — eleven labs (Cable Install 9–13, De-Esser, Wave Physics, Meter lab, Speech,
   Foundations, Mic Principles, Amplifier, EQ scale, Oscillator, Envelope) — brief ready (see top).
   Survey with every number: `Downloads/2026-09-25_LAB_DISPLAY_TEXT_SURVEY.md`.
2. Font-size-only labs (Gain Staging, Mixing console, Calculator header, Patchbay 8.9, dynamics GR
   meter, Digital captions) — not asked for yet.
3. Sound Systems leftovers: bezel values truncated at 375 ("REVERB HEA…"); LEARN 18 timeline ~5 pt.

## 6 · Preview harness facts (tonight)
- `ape-web` preview on 8091 was STARTED BY THIS SESSION (the other chat's server had stopped).
  `preview_start {name:'ape-web'}`. It may still be running.
- The full app root (`/`, `/labs/eq`) rendered BLANK in the preview several times tonight (no
  server error). Harness hashes work: `#soundsystemspreview`, `#eqmodulepreview`,
  `#micprinciplespreview`, `#cableinstallpreview`, … (App.tsx ~l.300–480).
- Built-in browser `javascript_tool` calls time out at ~45 s — one mode/page per call.
- The survey agent marked pages "visited" in the preview's local storage (`ape:deesser:v1`,
  `ape:speech:v1`, `ape:patchbay:v1`, `ape:labProgress`) — preview only.

## 7 · Do not touch
- `assets/exports/*`, `assets/compc-*`, `assets/group-5-defect-library/*`,
  `assets/Certificate_Squares/*` — untracked on purpose.
- `web/` — a push publishes the live site.
- `src/screens/lab/kit/PagedLab.tsx` behaviour (30 labs).
- Images of any kind without the owner naming the folder and saying go.

## 8 · Publishing ("update the phones")
Unchanged from `SESSION_HANDOFF_2026-09-25C.md` §8, with two corrections: restore the Swift file
with bash (`git show 427a0897^:modules/ape-dsp/ios/ApeDspModule.swift > modules/ape-dsp/ios/ApeDspModule.swift`),
and the Pixel proves the **production** Android id. Expected fingerprints: iOS
`64a7eddf33375780a486104c99dc4cc230b728e6`, Android `02255b7bae6489047ab17f67be58e5f50885e644`.
Point the export at its own temp folder (`$env:TEMP=…\ape-eas-0925d; $env:TMP=$env:TEMP`) when
another chat's preview server is running. Never publish unasked.
