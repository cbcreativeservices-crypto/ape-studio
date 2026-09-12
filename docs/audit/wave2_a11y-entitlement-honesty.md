# Wave 2 launch-readiness audit — Accessibility · Entitlement · Honesty

Scope: `src/screens/**`, `src/features/**`, `src/components/**`. Read-only. Cited `file:line`.
Date: 2026-09-09. High-confidence findings only.

General note: this codebase has had unusually diligent a11y and honesty sweeps. Interactive
elements overwhelmingly carry `accessibilityRole`/`accessibilityLabel`, meters are honestly
labeled "estimate/approximate/uncalibrated", and paid extras gate on real standing (`isMember`).
The findings below are the genuine remaining gaps.

## Top 5

1. **[Med · a11y]** `SpectrumColorPicker` hue wheel and lightness slider are invisible to
   assistive tech (no role/label/value) — the color-customization member perk can't be operated
   by a screen-reader user. `src/components/SpectrumColorPicker.tsx:140,153`.
2. **[Med · entitlement]** `EntitlementProvider.resolved` (the M6 first-paint guard) is exposed
   but consumed by **nothing** — a real academy member sees anonymous/free locks, veils and
   upsells flash on every cold start until the first server read lands.
3. **[Med · honesty]** `subjectMeta.ts` is self-declared **PLACEHOLDER copy** yet renders live in
   the Curriculum tree — violates the ratified-copy rule (and is keyed to the retired v2 matrix).
4. **[Med · honesty]** `TrophyScreen` shows the literal placeholder text **"Trophy 512²"** to real
   users on topic completion whenever trophy art is missing. `src/screens/results/TrophyScreen.tsx:80`.
5. **[Med · entitlement]** The centralized capability ladder is largely vestigial: only
   `caps.allTopics` and `caps.completionRecords` are ever read; 5 of 7 caps are dead and gating is
   scattered across `isMember`, raw `entitlement`, and server RLS — inconsistent idioms even inside
   one file (`CourseSelectionScreen.tsx:785` vs `:1045`).

---

## Accessibility

**[Med] [a11y] Hue color wheel not operable by assistive tech** · `src/components/SpectrumColorPicker.tsx:140`
Issue: the hue ring is a bare `<View {...wheelPan.panHandlers}>` wrapping an SVG — no
`accessibilityRole`, `accessibilityLabel`, `accessibilityValue`, or actions. A non-sighted member
cannot select a hue at all. Reused by `ColorWheelButton`, `LedColorPicker`, and the waveform color
popup, so the gap propagates.
Fix: make the wrapper `accessibilityRole="adjustable"` with label "Hue" + `accessibilityActions`
increment/decrement stepping `setHue` (mirror the existing `JogWheel.tsx:675` pattern).
`auto_fixable: no`

**[Med] [a11y] Lightness slider not operable by assistive tech** · `src/components/SpectrumColorPicker.tsx:153`
Issue: same defect on the lightness bar (`<View {...barPan.panHandlers}>`) — no role/label/value.
Only the "USE" button (`:170`) is labeled, so a screen-reader user can commit only the default seed
color, never adjust it.
Fix: `accessibilityRole="adjustable"` + label "Lightness" + `accessibilityValue={{min,max,now}}` +
increment/decrement stepping `setLight`.
`auto_fixable: no`

**[Low] [a11y] DSP debug buttons lack `accessibilityRole`** · `src/screens/tools/DspDebugScreen.tsx:98,113,116,119`
Issue: the back and START/STOP/RESET PEAK `Pressable`s have no `accessibilityRole="button"`. They
each have a visible `<Text>` child so a label is still derived (not icon-only), and this is an
internal debug screen — low impact.
Fix: add `accessibilityRole="button"`.
`auto_fixable: yes`

**[Low] [a11y] Credential/trophy art image has no label** · `src/screens/achievements/CredentialWall.tsx:135`
Issue: the certificate `<Image>` inside `TrophyModal` has no `accessibilityLabel`. Meaning is not
fully lost (the modal scrim announces the credential name + earned date), so this is polish.
Fix: add `accessibilityLabel={credentialName}` or mark the decorative frame `accessible={false}`.
`auto_fixable: yes`

---

## Entitlement

**[Med] [entitlement] `resolved` first-paint guard is dead — members flash locked UI on cold start** · `src/features/commercial/EntitlementProvider.tsx:133,155,326`
Issue: `resolved` was added (comment cites M6, 2026-09-07: "first paint must stay neutral rather
than showing the 'anonymous' rung to a member") and is provided in context, but **no screen reads
it** (grep of `src/**` finds only the provider). So between mount and the first `entitlements` read
resolving, a genuine academy member renders as `anonymous` → sees 🔒 locks, veils and Paywall
upsells on Tools/Labs/Courses until it self-corrects. Over-gating a paying member, not a content
leak — but visible and reproducible on every launch.
Fix: gate the lock/upsell branches (e.g. `CourseSelectionScreen`, `ToolsHubScreen`,
`AudioLearningScreen`) on `resolved`, rendering a neutral skeleton until the first read lands.
`auto_fixable: no`

**[Med] [entitlement] Capability ladder is largely vestigial; gating idioms inconsistent** · `src/features/commercial/EntitlementProvider.tsx:50-96`
Issue: `capsFor()` defines 7 caps as the stated single-source ladder, but only `caps.allTopics`
(`CourseSelectionScreen.tsx:1042,1045`) and `caps.completionRecords` (`ProfileScreen.tsx:620`) are
ever consumed. `commonMistakes`, `audioTools`, `freeTopics`, `syncedProgress`, `albumAchievements`
are dead — real gating is done ad hoc via `isMember` (tools, labs, glossary) and raw `entitlement`
comparisons. Within one file, `CourseSelectionScreen` gates openability on raw `entitlement`
(`:785-786`) but the Home-Setup deck on `caps.allTopics` (`:1045`). Risk: the ladder reads as the
SSoT but changing `capsFor()` mostly does nothing, so a future dev trusting it could ship a leak.
Fix: either route gates through `caps.*` consistently, or delete the unused caps and document that
gating lives in `isMember` + server RLS. Not a live leak today.
`auto_fixable: no`

**[Low] [entitlement] Calculator weekly cap fails OPEN** · `src/features/lab/calcUsage.ts:15,43-49,52-65`
Issue: `consumeCalc`/`getCalcStatus` return `OPEN {allowed:true, unavailable:true}` on any RPC
error/absence/network failure, so free & lapsed users get **unlimited** free calculations whenever
`calc_consume`/`calc_usage_status` are unreachable or the SQL migration isn't deployed. This is a
documented owner decision (never break the calculator), and the server is the SSoT — but it is a
launch dependency: confirm `docs/APE_CALC_WEEKLY_LIMIT_5_2026_09_01.SQL` is applied or the 5/week
cap is silently absent. (Client `CALC_WEEKLY_LIMIT = 5` matches the owner's 2026-09-01 setting.)
`auto_fixable: no`

**[Info] [entitlement] Glossary Common-Mistakes has no independent client gate** · `src/screens/glossary/GlossaryScreen.tsx:1086-1092,660-669`
Issue: the always-shown "COMMON MISTAKES" body trusts the server: `common_mistakes` is read from the
academy-gated view `glossary_full_v`, and a non-member's query returns null → the UI shows "—". The
share path *does* add a client `isMember` gate (`:1409`), but the on-screen display path does not —
correctness rests entirely on the RLS of `glossary_full_v`. Backend is frozen/out of scope; noting
so the RLS on that view is verified before launch. Not a client defect.
`auto_fixable: no`

---

## Honesty / copy

**[Med] [honesty] PLACEHOLDER subject copy renders live in the Curriculum tree** · `src/data/subjectMeta.ts:6-7` → `src/screens/curriculum/CurriculumScreen.tsx:265`
Issue: the file header states "PLACEHOLDER COPY — reasonable first-pass text; replace with the
Academy's official descriptions and career mappings," and `subjectMeta(s.name)` feeds those
descriptions/careers into every expanded subject card. Unratified copy shown to real users violates
the ratified-copy rule. Compounding: the map is keyed to `course_topic_matrix_v2.json` (retired per
project memory; v3 is live), so any v3 subject whose name doesn't match silently renders a blank
description/careers.
Fix: replace with owner-ratified subject copy keyed to v3 subject names, or hide the description/
careers rows until ratified.
`auto_fixable: no`

**[Med] [honesty] "Trophy 512²" placeholder shown on topic completion** · `src/screens/results/TrophyScreen.tsx:80`
Issue: `TrophyImage` fallback renders the literal debug string `Trophy 512²` when `iconUrl` is
absent/fails. Trophy art is supplied later (per project memory), so real users completing a topic
today see placeholder text on the celebration screen — a high-visibility moment.
Fix: replace the fallback with a finished generic trophy glyph/vector (no dimension text), or hide
the slot until art loads.
`auto_fixable: yes`

**[Low] [honesty] Exposure "Calibrated reference" chip drops the "approximate" qualifier** · `src/screens/tools/ExposureMonitorScreen.tsx:120`
Issue: `confLabel = confidence === 'calibrated' ? 'Calibrated reference' : 'General estimate'`. A
user field-calibration is not a lab calibration; the SPL tool is careful to always say
"field-calibrated (approximate)" (`SplMeterScreen.tsx:739`), but this dose chip says
"Calibrated reference" unqualified. The surrounding screen copy does say dose is estimated at the
ear, so impact is minor, but the two tools should match.
Fix: label it "Field reference (approximate)" or similar to match the SPL tool's wording.
`auto_fixable: yes`

**[Info] [honesty] The two known ratified-copy math errors compute CORRECTLY as written** · `src/screens/lab/calc/workspaces/dynamics.ts:33-40` · `src/screens/lab/calc/workspaces/micsRf.ts:217-219`
Verified, not a defect today:
- Compressor GR example: threshold −20 dBFS, 4:1, input −8 → 12 dB over → 12÷4 = 3 → output −17 dBFS,
  GR = −8 − (−17) = **9 dB**. Text says "−17 dBFS (9 dB of gain reduction)" — correct.
- RF link budget: 550 MHz @ 50 m → FSPL = 20log₁₀(50)+20log₁₀(5.5e8)−147.56 = **61.2 dB**;
  Prx = 10+2+2−61.2 = **−47.2 dBm**; margin = −47.2 −(−95) = **47.8 dB** — all correct.
These appear already fixed since the 2026-09-01 Test-Expert night. Flagged only because project
memory lists them as awaiting owner re-ratification — confirm the ratified copy sheet now matches.
`auto_fixable: no`
