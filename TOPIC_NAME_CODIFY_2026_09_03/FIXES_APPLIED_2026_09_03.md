# Overnight fix pass — Section 1 (1A–1D) + your decisions · 2026-09-03

## Executive summary

Everything you scoped for tonight is **applied to your working tree and
verified**: all of Section 1 — 1A (dead ends), 1B (navigation), 1C (readouts),
1D (small things) — plus the four decisions you sent. Device typecheck is clean
and the full test suite passes.

- **Device `tsc --noEmit`: 0 errors**
- **`npm test`: 179 / 179 pass (33 suites, 0 fail)**
- Changes are **uncommitted** in `audio-tools-engine` — left for you to review
  and commit. Nothing was committed or pushed on your behalf.
- **One production DB step is staged and waiting for your approval** (topic-name
  rename) — see the end.

## What was applied

Section 1 splits into fixes that needed no decision (applied) and the four you
just decided (applied as code). Confirmed-finding counts below.

| Section | Items | Status |
|---|---|---|
| 1A — Dead ends, crashes, data loss | 17 findings | ✅ Applied |
| 1B — Navigation | 11 findings (incl. B-066) | ✅ Applied |
| 1C — Readouts & numbers | 14 findings (incl. B-124) | ✅ Applied |
| 1D — Small things | 10 findings | ✅ Applied |
| Your 4 decisions | codified names, quiz 30/28, post-quiz→Dashboard, B-152 button | ✅ Applied |

### Your four decisions (as code)

1. **S1(b) — visible button.** *Understanding Level & Amplitude* now shows a
   **MARK REVIEWED** button when the lab still needs reviewing, so Audio
   Fundamentals lab credit is reachable. (B-152)
2. **Routing.** Quiz Results / Trophy land on **Study → Dashboard**; login still
   lands on Home. (B-003 / B-045)
3. **Quiz is 30 questions, pass ≥ 28.** Every `/25`, `24+`, "RETRY FOR 24+",
   "Score 24+" is now 30 / 28 / 28+. (B-010 / B-046 / B-084)
4. **Official topic names codified.** `Pro Audio Safety`, `Grounding &
   Electrical`, `Workplace Skills`, lab `Audio Fundamentals`
   (+ `DAW Fundamentals & Session Management`). A single source
   (`officialTopicNames.ts`) now backs every fallback, so the UI never shows
   "Topic" or a gs number — the real name always shows. (Code done; the DB
   source rows are the pending step below.)

### 1D — the 10 small things

Accessibility: ToolsHub bottom nav now uses role `tab` + selected state and
reads **"Progress"** for the Achievements route (B-037/B-185); the dosimeter
chip shows one consistent time for label and readout (B-186). Touch: Quiz and
Final Exam "‹" Leave control hit area widened (B-057). Storage resilience:
Calculator prefs and the three lab step-restore reads no longer throw on
web/offline (B-067). Readouts: Profile pluralizes "1 goal" (B-091); speaker SPL
prose rounds to whole dB (B-109); the transformer prose drops the "an 2:1"
article bug (B-110); the reverb-decay fader reads "6.0 s" in both places (B-115).

## Verification

| Check | Result |
|---|---|
| Container `tsc` (my working copy) | 0 errors |
| **Device `tsc --noEmit`** | **0 errors** |
| **Device `npm test`** | **179 / 179 pass** |
| Patch application | 21 / 22 files via `git apply`; 1 handled below |
| Line endings | preserved per file (CRLF/LF), no whole-file churn |

## One thing worth your eye (not a problem)

**`AmpModuleScreen.tsx` (B-065)** — your Amplifier Principles lab pass already
refactored this file and already records the check answer **before** the
persistence step, which is exactly what B-065 asked for. So I **left your newer
version untouched** rather than overwrite it. No action needed.

## Pending — needs your approval (production DB)

Topic-name **display rows** in `achievements.name` still hold the old names
(`Professional Audio Safety`, `Grounding & Shielding`, `Audio Fundamentals
Lab`). The app already shows the codified names via the code override, so this
is source-hygiene, not a display fix.

A **guarded, reversible, dry-run-verified** SQL package is delivered
(`topicnames_sql/`, run order in its README). I did **not** run it against
production — DB mutations wait for your go. Run `00`→`90` when you're ready, or
tell me to apply it.

## Confidence

- **Requirements understanding:** High — worked from the committee report's 1A–1D
  sections and your four decisions verbatim.
- **Implementation approach:** High for 1B/1C/1D (small, local, pattern-matched
  to existing code); High for the decisions.
- **Verification:** High on web-testable logic (tsc + tests). **Two native-only
  items (B-066 preview scrim, B-170-class mic release) cannot be exercised in the
  web harness** — they typecheck and follow the report's prescribed fix, but
  want a quick look on the Pixel.

## Known gotchas carried forward

- Your repo files are mixed CRLF/LF per file; all edits preserved each file's
  own endings.
- `_bughunt_tmp/` in the repo root is my scratch (the patch + tsc/test logs).
  It's untracked — safe to delete.
- Still open for tomorrow: the ~120 "needs decision" findings beyond the four
  you sent, and the 2 option-escalations / 108 beginner leaks for Computer C.
