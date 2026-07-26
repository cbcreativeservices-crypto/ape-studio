# AP&E — Governance & Decisions Log (2026-07-23)

Rulings of record from the audio-tools build cycle. Successor to
`APE_GOVERNANCE_DECISIONS_2026_07_18.md`; supersedes conflicting earlier notes.
Owner rulings issued in the Claude Code dev session, 2026-07-23.

## New rulings (owner, 2026-07-23)

### R1 — dB SPL calibration: DEVICE-LOCAL OFFSET
The SPL Reference Meter gains a field-calibration flow: the user calibrates
against a reference sound-level meter (steady pink noise; adjust an offset
until the app matches the reference). The single offset is stored **on-device
only** (`ape:splCalOffset`) — never server-side (tech-spec §7.2 stands).
Calibrated readings display **"dB SPL · field-calibrated (approximate)"**;
uncalibrated readings remain **"dBFS · uncalibrated approximate"**. Saved
measurements carry `calibration_status: 'calibrated'` + the offset in
`measurement_settings` (context disclosure, spec §5). Approximate ALWAYS —
this is not, and never claims to be, an IEC 61672 instrument.

### R2 — Light-pulse (camera) mode: HOLD
The Frequency Counter's optical mode stays at the honest in-development card
until the audio engine is validated on-device. Revisit after validation;
implementation sketch when it lands: expo-camera frame-brightness analysis,
camera permission requested lazily on first use, measurable range honestly
capped by frame rate (~≤15 Hz) and disclosed on-screen.

### R3 — Android: PORT COMMITTED (new work order)
The measurement tools WILL ship on Android. The portable C++ core
(`modules/ape-dsp/ios/core/` — golden-tested host-side, no platform deps) is
the shared foundation; the work order is the platform bridge:
- Kotlin Expo module + Oboe/AAudio capture (measurement-equivalent input path,
  read-back verification like iOS), JNI onto the same EngineHub/Generator.
- Output path for the generator via Oboe.
- PROPOSED device baseline (confirm at port kickoff): arm64-v8a, Android 10+,
  Snapdragon 778G-class mid-range as the perf-budget device (Android analog of
  the Q5/A13 ruling). FFT ceiling ≤16384 unchanged.
- Until the port lands, Android clients keep the honest "not in this build" gate.

### R4 — Backend deploys: EXECUTED 2026-07-24 (production yjgolswjggmlpeowvtxr)
Both applied directly to production (a dev branch `r4-telemetry-h3` was created per
the ruled path but came up MIGRATIONS_FAILED — the project's migration history
doesn't replay cleanly onto a fresh branch, so merge was unsafe; T-1 was validated
on the branch, then both migrations applied directly + advisors + branch deleted):
- **H3** — migration `h3_flashcard_gate_views_2_to_1`: in `record_study_progress`
  the flashcard completion gate is now `views >= 1 OR known` (was `>= 2`),
  matching the client `studyDisplayPct`. Applied via a fail-closed
  pg_get_functiondef replace (verified single occurrence). Verified live.
- **T-1** — migration `t1_tool_usage_telemetry` (+ `t1_tool_usage_rls_initplan_optimize`):
  new table `public.tool_usage_log` (id, user_id→users, tool_id, opened_at,
  duration_seconds, created_at; RLS own-row SELECT) + RPC `record_tool_usage(text,
  timestamptz,integer)` SECURITY DEFINER, authenticated-only, inserts one row.
  Opens+durations only; no measurement content/audio; no progression writes.
  Advisors: zero new ERRORs; one WARN (authenticated SECURITY DEFINER RPC — the
  accepted student-RPC class, same as record_study_progress/submit_quiz).
- **FOLLOW-UP (client, not done):** wire the client to call `record_tool_usage`
  on tool open/close. Table is empty until then. Also flag `MIGRATIONS_FAILED`
  branching to the DBA — the migration history needs cleanup before branch-based
  deploys work.

### R4 (original ruling) — Backend deploys: BOTH GREEN-LIT (execute in the backend session)
The client stays frozen; the backend/governance session executes via
dev-branch → tests → advisors → merge:
1. **T-1 tool-usage telemetry** — its deploy trigger ("until the engine
   build") has FIRED. Scope unchanged per Q3: opens + durations only
   ({tool_id, opened_at, duration_seconds}), authenticated RPC, no
   measurement content, no audio, ever. Spec of record:
   `T1_TOOL_USAGE_TELEMETRY_RPC_SPEC_2026_07_09_v1.md`.
2. **H3 flashcard gate views ≥2 → ≥1** — approved 2026-07-09, deploy held;
   now green-lit. Aligns the server gate with the display model
   (`studyDisplayPct`) on every surface (Dashboard + Enrollment meters).

## Ratifications of record (executed under owner direction this cycle)

- **Engine build order** ("build the engine", 2026-07-23): executed. Portable
  C++ DSP core (weighting, FFT/banding, ballistics, YIN, generator, waveform
  envelope, RT60/Schroeder) golden-tested 61/61 host-side; Swift/ObjC++ bridge;
  EAS build 2 (b7fd9334, commit 755af762) compiled it on iOS arm64 —
  ARCHIVE SUCCEEDED, zero errors.
- **Generator output path**: implemented as an ape-dsp extension
  (AVAudioSourceNode). Q4 caps (−20 dBFS default, −12 hard cap, session
  tap-through unlock) enforced IN the C++ core and proven by golden vectors.
- **Spike deviations ratified**: drop-NEWEST SPSC ring overrun (+counter);
  findings F1–F5 are platform truths binding future engine work.
- **Tuner merge** (spec recommendation accepted 2026-07-23): one dashboard
  tool, "Frequency Counter & Tuner" — 7 tiles total.
- **Tools access model**: tools + Saved Measurement Library + A/B compare are
  FREE; Learn/Demo tutorials and concept modules are Academy-gated (matches
  the ratified marketingLine).
- **Demo mode**: visual/animated only until an audio output UX ships;
  permanent "TRAINING DEMO — NOT A LIVE MEASUREMENT" badge (spec §5).
- **Clipping severity**: `input_clipping` grades INVALID (spec §15 Module 8
  "clipping invalidates data" outweighs §9's softer copy; flip back only with
  a ruling that also rewords the capstone). RT60 scopes clip flags to the
  armed capture window (2026-07-23 review) — flags describe the capture,
  never the session.
- **RT60 method honesty** (2026-07-23 review): every RT60 value carries ITS
  method (per band) and ITS fit's R²; invalid captures are unsaveable; poor
  fit is distinguished from insufficient range.

## Draft-pending items (need owner read-through, not blocking)

- Learn-mode tutorial copy (7 tools) + 8 concept modules
  (`src/features/tools/learn/`) — drafted from the spec of record by the dev
  session; treat as DRAFT until read through. Owner-authored texts (the spec
  itself, paywall copy 2026-07-23) are ratified by definition.

## Housekeeping

- `docs/service_key.txt` (0-byte stray) deleted 2026-07-23.
- Next EAS build should follow the RT60-UI commit (native gained per-fit R²
  marshaling + pending-flag arming after build 2; the RT60 screen shows
  R² 0.00 against build-2 clients until then).

## Addendum — UI/behavior pass (owner, 2026-07-24)

A large owner-driven UI iteration session. Significant **behavioral** decisions of
record (cosmetic tweaks omitted). All work is UNCOMMITTED on branch
`audio-tools-engine` atop `572aa6b` at time of writing (16 files modified, 2 new:
`src/features/dev/popupSuppressStore.ts`, this session's edits).

### D1 — Bookmarks are PER-CONTEXT (fresh start)
Bookmarks are no longer one global list. Each context keeps its own set under
`ape:bm:<ctx>`: `glossary`, each topic (`achievementId`), the custom list
(`flagged`). API in `flaggedStore.ts` is context-keyed (`getBookmarks(ctx)`,
`toggleBookmark(ctx,id)`, `useBookmarks(ctx)`, `removeBookmarks(ctx,ids)`,
`listBookmarkContexts()`); `TermSelectIcons` requires a `bookmarkCtx` prop. The old
global `ape:glossaryFavs` is **abandoned (not migrated)** — owner chose a fresh
start. The **heart** list was removed entirely; the custom **starred** list stays
GLOBAL by design.

### D2 — Required core courses are LOCKED into the study deck until completed
Every incomplete enrolled required-core course (`COREQ_TOPIC_GS`) is force-loaded
into the Dashboard deck and **cannot be deactivated or removed** until it reaches
100% (then it unlocks). Shown with a "🔒 until completed" caption on its deck
toggle. (Previously only Pro Audio Safety was locked; now all cores.)

### D3 — "My Custom List" can ride the Dashboard as a current topic
New Enrollment container + `flaggedStore.customOnDashboard` toggle. When ON, a
synthetic topic (`id = FLAGGED_TOPIC_ID`) is appended to the Dashboard topic swipe
and renders a flashcards-only panel (no method rack / quiz — it has no server
topic). Off by default; toggled from the Enrollment container.

### D4 — Home Setup owns the Dashboard's default landing card
`homeCardsStore` gained a `defaultGs` (persisted `ape:homeDefaultGs`) set via a
"SET DEFAULT" picker in Home Setup; the Course-Select carousel opens on that card.
The old per-card "my courses" ★ marks system was removed.

### D5 — Study icons deep-link to the Dashboard with their topic
Enrollment study icons pass a `focusGs` nav param; the Dashboard fronts that topic
on arrival (topic gs, or `FLAGGED_TOPIC_ID` for the custom list).

### D6 — Dev master popup kill-switch
`popupSuppressStore` (`ape:devSuppressPopups`) + a DevVisualIndex toggle suppress
ALL popups (screen intros, welcome/commitment, learning sheets, coach marks),
winning over `DEV_BYPASS.alwaysShowIntros`.

### D7 — Glossary two-level bookmark filter (glossary-only)
Holding the Glossary bookmark filter opens a LEVEL-1 picker of every context with
≥1 bookmark (name + count), then LEVEL-2 shows that context's terms. This two-step
behavior is Glossary-only.

## Pending big features & backend changes (owner, 2026-07-25) — NOT YET BUILT

Captured from the owner's spec so nothing is lost; these are large / backend /
destructive and warrant focused, confirmed builds.

### P1 — Quiz redesign (⚠️ BACKEND UPDATE REQUIRED — backend is FROZEN, needs approval)
- Quiz is **always 10 minutes** and **always 30 questions** (fixed).
- **Pass = score ≥ 28** (of 30).
- **Remove the lower-score-to-unlock threshold entirely** — strict topic sequencing
  is no longer used/valid for this project, so there's no "partial pass unlocks the
  next topic" anymore.
- Requires updating the server quiz config + `start_quiz_attempt`/gate logic (10/30/28,
  drop unlock threshold). Supabase migration + governance sign-off before doing it.

### P2 — Delete account & 100% data erasure (⚠️ DESTRUCTIVE + BACKEND + GOVERNANCE)
- Settings, at the very bottom: a **Delete account** action.
- UI: **press-and-hold 5 s** (animate a ring/fill + show the countdown timer), then a
  **final confirm popup**.
- On confirm: erase **100%** of the account + personal data — progress, records, and
  **certificates** — and **invalidate any generated links/QR codes** pointing to the
  user (e.g. the Professional Registry link/QR).
- IRREVERSIBLE. Needs a backend erasure RPC (Supabase) + registry-link invalidation +
  governance approval. Per safety rules Claude builds the UI and calls the
  USER-triggered RPC; Claude does not perform the deletion itself.

  **DONE 2026-07-25 (dev, no users).** Migration `p2_delete_my_account_rpc` →
  `public.delete_my_account()` (SECURITY DEFINER, owner postgres, authenticated-only):
  deletes the CALLER's personal records + PII across all user_id tables (quiz_attempts→
  items cascade, progress, badges, method progress, performance_metrics, enrollment,
  entitlements, notification prefs/log, session_logs, tool_usage_log, audit_log) + the
  `users` row + a best-effort `auth.users` delete. No `registry` table exists yet, so
  removing the user record inherently makes any future registry link resolve to a generic
  "account deleted" page (nothing to explicitly invalidate now — revisit when the registry
  backend is wired). Client: `DeleteAccountButton` (5s press-hold animated fill + countdown
  → final confirm Alert → RPC → signOut → Splash), at the bottom of Settings.

### P3 — Study-method PACE TIMER (large new feature; Fill-in-Blank, Matching, Scenarios)
- New **timer button** (timer/stopwatch icon) at the top of each of those 3 screens,
  **left of the return button**. Opens a popup to turn a countdown timer **on/off** and
  choose a **pace**.
- Pace basis: quiz = 10 min / 30 q = **20 s per question**. The timer lets the user set a
  pace **at or below quiz pace** (needs a short user-facing explanation of the concept).
  Owner's options (verbatim, resolve at build): slower multiples **0.5x, 1x, 1.5x, 2x,
  3x, 4x** (slower than quiz pace) and **faster 1.5x, 2x**; plus, at the extreme, a
  **STOPWATCH mode** (time yourself over 30 questions — no target).
- Real-time **ahead / on-pace / behind** animation vs the set pace (like the owner's PACE
  reference: horizontal BEHIND ← ON PACE → AHEAD scale w/ a marker, "N of M answered",
  "mm:ss / mm:ss", "+mm:ss AHEAD"). **Readout must be HORIZONTAL and THIN** (low vertical
  height — NOT the vertically-tall example).
- Stopwatch mode stores **pace records for future return**: best time, average time, and
  other **encouraging metrics** — ALL labels/feedback must be **positive & encouraging**.
  (Records store: device-local first, or backend — decide at build.)
- When the timer is ON, a **new thin horizontal timer-bar container** appears in the study
  screen **below the top section (LED meter)** and **above the study area**, showing the
  timer settings, the pace readout, and a button to open settings.

  **RESOLVED (owner, 2026-07-25):**
  1. **Pace scale = multiple of time-per-question.** 1× = quiz pace (20s/q). Slower = MORE
     time: 1.5×=30s, 2×=40s, 3×=60s, 4×=80s. Faster = LESS time: 1.5×faster≈13s, 2×faster=10s.
     **Drop 0.5×.** Presets: 2×/1.5× faster · 1× · 1.5×/2×/3×/4× slower · **Stopwatch**.
  2. **Records: BACKEND (account-synced)** — needs a Supabase migration (approved new change).
  3. **Time-out = pace tracker only, NO hard stop** — never blocks study; on running out show an
     encouraging "time's up — keep going!". Practice, not a test.
  4. **Thin readout = status word + offset + mini scale** in one low-height row
     (e.g. `AHEAD +01:05   BEHIND ◄──●──► AHEAD   16/25 · 10:20`).

**P1 & P2 status: APPROVED to build (owner 2026-07-25).** P2 refinement: delete only what is
legally required for the user's privacy + personal records; the registry QR/link redirects to a
**generic "this account has been deleted" page with NO personal info**.

**P3 DONE 2026-07-25** (dev). Backend migration `p3_pace_records`: table `study_pace_records`
(RLS on, access via SECURITY DEFINER RPCs only) + `record_pace_session(method,seconds,questions)`
+ `get_pace_records()` (authenticated). Client: `src/features/study/paceStore.ts` (device-local
per-method settings + `paceMath` + presets/SEC_PER_Q), `paceRecords.ts` (RPC wrappers),
`PaceReadout.tsx` (thin horizontal status+offset+mini-scale+K/M·elapsed), `PaceTimerBar.tsx`,
`PaceTimerModal.tsx` (on/off + preset radio + explanation + stopwatch records). `StudyHeader`
gained an optional `onOpenTimer` (⏱ button left of RETURN). Integrated into FillInBlank/Matching/
Scenarios (bar below LED row / above content when enabled; answered from states/idx; 1s elapsed
tick; stopwatch records once on completion). No hard stop on overtime.

### Already done this cycle (2026-07-25)
- Shared `FullscreenIcon` component; study-method overlay (`StudyFsOverlay.FsButton`) now
  uses the same green glyph as flashcards.
- Glossary bookmark popup redesign (glossary list default + other lists below) and
  `TermSelectIcons` `hideKnown` (✓/✗ hidden in bookmark/custom list popups) + confirm-on-close.

## Addendum — big session (owner, 2026-07-25 → 26): Ear Lab, additive engine, audio-mute, pace-timer suite

All committed+pushed at **HEAD `7ab920e`** on `audio-tools-engine` (49 files, +8554/−357);
tsc 0 / Android+iOS bundles 200 / native goldens **82/82**. Client-only except the noted
Supabase migrations (backend was FROZEN; owner explicitly green-lit each — dev, no live users).

### Backend migrations DEPLOYED (prod `yjgolswjggmlpeowvtxr`)
- **P1 quiz** `p1_quiz_30q_pass28_drop_partial` — 30 questions, pass ≥ 28, partial-unlock path retired.
- **Time-trial crediting** (3 migrations): `p3_time_trial_credit` (adds `student_method_progress.trial_passed`
  + `credit_time_trial(achievement,method)` RPC, authenticated-only, mirrors `record_study_progress`
  guards); `p3_time_trial_gate_honor` (`start_quiz_attempt` counts a method done when `trial_passed`);
  `p3_time_trial_snapshot_honor` (`build_study_snapshot.gate_pass` honors it so the HUD matches).
- (P2 delete-account RPC + P3 pace records recorded above.)

### Pace-timer suite — evolved well past the original P3 spec (owner iterations)
Grace period (in-progress question gets a full lap before "behind"); marker steps in 5s intervals;
GREEN on-pace/ahead, AMBER only when behind; pace advances on CORRECT answers only; `BrainoutputsPM`
= individual correct-press rate (per-pair in Matching); centered multiplier tag on the scale;
console-fader preset picker (tap, not hold); AUTO TRACK silent background mode (saves to records);
separate running/added state (start-stop flip + reset + remove); TimerIcon (custom, always blue);
thin border-less **fullscreen** readout (long-press = reset). **TIME TRIAL** = official 15-min
challenge: average ≥ quiz pace, correct-only, a pass credits ONE study method (the crediting is the
backend work above). Continue-Learning banner deep-links to the exact last method screen.

### Global AUDIO-OUTPUT MUTE — safety/product policy (owner, 2026-07-25)
App is **SILENT BY DEFAULT**. No app-emitted sound until a deliberate **5-second hold** enables it;
**auto-re-mutes** on relaunch, login, and 10 minutes idle. Any sound attempt fronts a two-step gate
(explain → hold-to-enable). Covers ALL app audio incl. in-app TTS ("ADA" cues) and the tone generator.
When armed: a persistent thin **red screen frame** (every screen) + the Profile row reads red.
Disclosed limit: OS assistive tech (VoiceOver/TalkBack) is OS-controlled and cannot be app-muted.

### EAR TRAINING & CRITICAL LISTENING LAB — new learning environment
Its own pinned **home card + route** — the **7-tool audio dashboard stays FROZEN** (spec §), so the
Lab is NOT a hub tile. Full owner spec of record: `docs/APE_HARMONICS_WATERFALL_LAB_SPEC_2026_07_25.md`
(Harmonic Visualizer + 3-D Waterfall Decay Analyzer). Phasing: **P1 shell** (modes Learn/Explore/
Practice/Test, audio-gate on entry) ✅ · **HarmonicsView** RX-style (log axis + LIN, piano-key gutter
with note/cents, RX heat colormap, hi-res) analytic + live-mic ✅ · **HV-1** interactive analytic lab
(draggable stems, identity cards, phase lab, 9 presets, odd/even, THD, A/B, solo audio) ✅ · **HV-2**
NATIVE additive synthesis ✅. **Parked** (owner): the 3-D Waterfall (spec banked) until the harmonic
visualizer is finished. NEXT: HV-3 (learning modes wired to sound), then Waterfall.

Integrity rulings reaffirmed for the Lab (§1.7 no-fake-meters extended): ANALYTIC vs LIVE always
labeled ("ANALYTIC MODEL — NOT A MEASUREMENT"; live = "dBFS · UNCALIBRATED"); **THD+N is never
fabricated** in the analytic model (shown as "live measurement required"); waveform presets are
labeled "simplified instructional models" (no claim of reproducing real tubes/transformers/speakers);
no auto-playing audio.

### ape-dsp engine — additive synthesis (native)
New GenMode **12 "additive"**: 12 phase-continuous harmonics, per-harmonic amp/phase, no-clip
`norm = 1/max(1, Σaₙ)` through the SAME Q4 level-cap chain as sine, ~8 ms slope-limited ramps.
Identical contract across C++/iOS/Android/TS (flat `[f0, a1..a12, p1..p12]`, Hz/0..1/degrees);
`engineVersion` **2 → 3** (constant-driven). v3 → `PLAY MODEL` plays the live 12-harmonic mixture;
v2 installs fall back to sine + honest note. Golden suite **82/82** (17 new additive vectors: spectral
correctness, all-ones clip bound under the cap, ramp continuity, phase/crest, Nyquist omission).

### Device builds (2026-07-26, from `7ab920e`) — owner upgraded EAS plan
Both **v3 dev clients** built: Android (build 118fd704) + iOS (build 6834bea7, provisioned iPhone
UDID 00008130-…001C; iPad still unregistered → needs `eas device:create` + rebuild). Dev clients load
JS + Supabase keys from Metro at runtime (sidesteps the old standalone "supabaseUrl required" crash).
**On-device validation is the open item** — the HV-2 mixture audio and everything else awaits a real pass.

*End of decisions log.*
