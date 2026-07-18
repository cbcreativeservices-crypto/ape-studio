# AP&E STUDIO — FULL SESSION HAND-OFF · 2026-07-09
**From:** Claude Code client-build session · **To:** backend/governance project chat
**Covers:** all work 2026-07-09 (full day). Supersedes nothing — companion to
`APE_BACKEND_HANDOFF_2026_07_08.md` (which carries the running backend ratify list; its §2b
was updated live today and matches §1 below).
**Location note:** kept in `ape-studio\docs\` — OneDrive writes from tooling don't persist
(Files-On-Demand). Copy to OneDrive via Explorer if wanted in the governance registry.

Backend project: Supabase `yjgolswjggmlpeowvtxr`, SCHEMA v2.12.
App repo: `C:\Users\profe\dev\ape-studio` (tsc clean, iOS bundle HTTP 200 at end of day).

---

## §1 — BACKEND-RELEVANT ACTIONS TODAY (ratify / execute)

### 1.1 ⏰ Study time gates — CHANGED + production value CONFIRMED
`study_methods.min_engagement_seconds` for flashcards / fill_in_blank / matching set to
**200** (testing value; history 600→300→150→200). ear_training 300 / scenarios 600 untouched.
**Production restore target = 360 s — ✅ CONFIRMED BY USER 2026-07-09** (closes the old
270-vs-600 question). Run on the user's go-ahead after testing:
```sql
UPDATE study_methods SET min_engagement_seconds = 360
WHERE key IN ('flashcards','fill_in_blank','matching');
```

### 1.2 Trophy `icon_url` — 2 MORE topics set (ratify; same pattern as the 33)
Client-session DML (user-directed). Both PNGs uploaded by the user to the public
`trophy-icons` bucket via the Supabase Dashboard; public URLs verified HTTP 200. Trophy art
now covers **35** topics.
```sql
UPDATE achievements SET icon_url = 'trophy-icons/pro audio safety.png'
  WHERE id = 'eebac0e9-c48a-49c5-8c71-6e43d9bee2ee'; -- Professional Audio Safety
UPDATE achievements SET icon_url = 'trophy-icons/Sound and Acoustics.png'
  WHERE id = '595c0857-5afa-4b6a-a0bb-fdea84ae2a8c'; -- Sound & Acoustics
```
Remaining ACTIVE topics without art (next art batch): Amps & Loudspeakers, Commercial Audio
Systems, Connectors & I/O Connections, Consumer Audio Systems, Corporate AV, Distributed
Audio Systems, Vehicle Audio. (Other null-icon topics are `is_active=false` — no art needed
until activated.)

### 1.3 Storage — `course-cards` bucket now 10 files
User uploaded `205a_card.PNG` + `205b_card.PNG` (MUSI205A/B) via Dashboard; client mapping
added; verified HTTP 200. **All 9 courses + glossary now have card art.**
⏳ PENDING user upload: `measurement_tools_card.PNG` (exact filename; already mapped in
client code with graceful fallback) for the new Measurement & Analysis card (§2).

### 1.4 Carried, still open on the backend side (unchanged from the 07-08 doc)
- Flashcard gate → 1 view (`record_study_progress` `views>=2` → `>=1`) — **approved 07-09**,
  deploy via dev-branch → tests → advisors → merge.
- D-3 quiz explanations · D-2/D-2b verify RPC + register codes · anon grant revokes ·
  glossary media columns · Site URL / password-reset deep link · single-sentence quiz stems ·
  footnote/due-date data source · notifications pipeline.

---

## §2 — NEW MODULE: MEASUREMENT & ANALYSIS TOOLS (governance summary)

**Specs of record (user-provided, in Downloads — recommend registering in the Project):**
- `AUDIO_MEASUREMENT_TOOLS_RESEARCH_2026_07_09_v1.md` (functional/measurement spec)
- `AUDIO_MEASUREMENT_TOOLS_TECH_RESEARCH_2026_07_09_v1.md` (engineering/backend spec)

**Built today (client-only MVP per the tech report):**
- New Home-carousel card "Measurement & Analysis" at far LEFT of the Glossary card
  (Glossary remains the standard landing card; remembered position kept for returning users).
- ToolsHub screen (root stack, nav hidden): 5 tools, per-tool colored glass keys
  (SPL orange · RTA blue · Waveform teal · Spectrogram purple · RT60 green).
- Per-tool INFO screens: purpose / what-it-measures / what-it-does-NOT-measure / phone-mic
  limits (verbatim-faithful to the functional spec) + honest "engine in development" status.
  **No fake meters** (spec §1.7 integrity rule).
- Files: `src/screens/tools/{toolsData.ts, ToolsHubScreen.tsx, ToolInfoScreen.tsx}`;
  routes `ToolsHub` / `ToolInfo` on the root stack.

**Backend surface = ZERO by design** (tech report §7): no tables, RPCs, grants, buckets.
**Rulings the backend/governance chat owns before the real tools build (tech report §10.3):**
- Q1 Spike 0 approach: custom Expo Module + C++ core (recommended) vs `react-native-audio-api`.
- Q2 RTA low-frequency band strategy (gray-out vs filterbank for MVP).
- Q3 usage telemetry T-1 wanted? (if yes → minimal event RPC spec).
- Q4 test-signal output level cap.
- Q5 minimum device class / performance budget.
Plus: Spike 0 itself and a **new EAS iOS dev build** (native module) when approved.

---

## §3 — CLIENT-ONLY CHANGELOG (context; no backend action)

### Buttons / design system (biggest visual change of the day)
- **GlassButton (scribble-strip glass key) is now THE app-wide button.** `StudioButton` is a
  thin wrapper over it (variant→tint: primary/white→gold, success→green, outline→blue,
  secondary/light→steel) — all ~24 legacy call sites (Back/Retry/Confirm/Retake/Done, quiz
  block, auth) converted at once. New tints added: blue, teal, purple.
- **SwitchButton** (new component): photoreal illuminated pushbutton — casing cutout, glass
  cover w/ diffused glow + specular, incandescent behavior (warm palette, lamp lags the
  mechanical press, idle filament drift), press travel 2 px. Used on Dashboard method rows.
- Course-card + Dashboard-GLOSSARY buttons ended the day on the GlassButton aesthetic with
  original colors (continue gold · review green · glossary blue); locked = flat 2D purple pill.
- All buttons app-wide: 25% harder corners.

### Dashboard
- Method containers re-laid-out: title+% row and PARTIAL-width LED in a left column, square
  action button right; compacted (less padding, button −15%) so the quiz block fits on screen.
- Current-topic trophy now ALWAYS full illumination (earn-state dimming lives only on the
  Achievements screen).
- GLOSSARY header button → blue glass key.

### Glossary
- CARDS/LIST toggle moved into the header (always visible; toggles view WITHOUT resetting the
  focused term; card→list justifies the term to the top).
- Filter chips no longer scroll (wrapping row); visible in list mode while a term is expanded.
- Card popup: tap popup area to close (plus ✕); expanded list terms justify to top.
- Topic picker rows no longer show the associated course code.

### Course Selection (Home)
- Centered hero header (logo 72, wordmark 24, blue "PROFESSIONAL AUDIO GLOSSARY" eyebrow 12).
- Status subtitles removed from all cards.
- Locked cards: purple wash removed → art clear, image dimmed 30% + 10% neutral gray; purple
  kept on frame + locked pill only.
- 205A/205B card art mapped; Measurement & Analysis card added (§2).

### Flashcards
- **FILTERS popup**: choose which definition sections show on reveal (All / Definition / Plain
  English / Purpose & Application / Scenarios / Mistakes / Related Terms + Reset); persisted
  device-global (`ape:fcSections`); tap cycles ONLY enabled sections and returns to the term
  after the last one.

### Navigation (bug of the day — regression #4, now closed)
- **STUDY tab landing on Glossary**: root cause was popToTop popping to routes[0] (which can BE
  Glossary when the stack mounts there from the Home card) and, later, targeted resets hitting
  stale tab-bar state keys ("action not handled" redbox, surfaced when opening Matching).
  **Final fix (two layers):** TabBar does plain `navigate(tab, {screen: root})`; GlossaryScreen
  itself listens to the parent `tabPress` and navigates to Dashboard from within its own live
  stack. QuizScreen's submit `popToTop` now guarded with `canGoBack()`.
- HOME nav icon → house silhouette (was VU bars).

---

## §4 — USER/BOOTH ACTION ITEMS
1. Upload `measurement_tools_card.PNG` to `course-cards` (exact filename) — card art appears
   with zero code change.
2. Trophy art batch for the 7 remaining active topics (§1.2) when ready.
3. Rule Q1–Q5 (§2) in the governance chat before the measurement-tools engine build.
4. Give the go-ahead for the 360 s gate restore when testing wraps (§1.1).

## §5 — VERIFICATION STATE
- `npx tsc --noEmit` clean; iOS bundle `http://localhost:8081/index.bundle?platform=ios&dev=true`
  HTTP 200 (Metro restarted after the new `src/screens/tools/` directory — watcher gotcha).
- Storage URLs verified 200: 2 trophy PNGs, 10 course-card PNGs.
- Remaining Code-brief §8 smoke tests unchanged (see 07-08 doc §4).

## §6 — MEMORY RECORD (project memory updated today)
- Trophy pipeline: DONE, 35 topics, Dashboard-upload workflow is the standard (never handle
  service-role keys in chat).
- Time gates: 200 s now / **360 s confirmed production**.
- Nav rule: never popToTop / targeted-reset for tab-to-root; navigate + screen-level tabPress
  listener is the durable pattern.
- Buttons: GlassButton = app-wide standard; StudioButton is a legacy wrapper.
- Measurement tools: MVP shipped client-only; Q1–Q5 + Spike 0 + new EAS build gate the engine.

*End of hand-off.*
