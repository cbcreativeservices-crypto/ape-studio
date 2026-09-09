# Launch-readiness autonomous audit — 2026-09-09 (waves)

Owner is away; running autonomous audit + safe-fix waves toward launch. Cadence:
**go slow, save often, work in waves** to avoid hitting limits. Each wave writes
its own findings file under `docs/audit/`, then safe fixes are applied and
committed incrementally (each gated by `tsc` + `npm test`).

## Focus (owner, 2026-09-09)
1. Bugs · 2. Navigation issues · 3. **Load/ready times** — screens, images, audio
   tools, and buttons that lag before acting (the priority).
Plus: cold-start/TTI, image prefetch/cache, memory/long-session, offline/empty/
error states, accessibility, entitlement correctness, honesty/copy, crash
resilience, regression gate.

## Guardrails (hard)
- NO `eas build`/`eas submit`, NO publishing/store actions, NO destructive/schema
  DB changes, NO bucket deletes, NO secret handling, NO external sends. Backend frozen.
- Every commit: `tsc` + `npm test` green. Stay on `audio-tools-engine`.
- Auto-apply only LOW-RISK/HIGH-CONFIDENCE fixes; FILE anything risky/design/
  backend/native-build-gated for owner review.

## Wave log
- **Wave 1** (load-latency + navigation) — COMPLETE 2026-09-09. Findings:
  `docs/audit/wave1_load-latency.md` (11: 3 high / 5 med / 3 low),
  `docs/audit/wave1_navigation.md` (5: 1 high / 4 low-med). Navigation is
  otherwise in strong shape (clean route registry, guarded tab reset, hardened
  deep-links). Audio-tool OPEN path already well optimized (warm mic, deferral).

### Browser passes
Live visual (screenshot/click) passes require the desktop Browser pane to be
DISPLAYED — it was collapsed/hidden during this run, so the page can't render
for screenshots. Functional checks (DOM, console, network, Metro logs) work
regardless and are used meanwhile. Resume the visual walkthrough when the pane
is shown.

## Fixes applied (running list)
- ✅ **Final Exam Android hardware-back guard** (launch blocker) — `FinalExamScreen.tsx` (commit e3c8632).
- ✅ **Splash session fetch parallel with the 2.5s hold** — `SplashScreen.tsx` (commit ed2c497).

### Queued safe fixes (auto-apply, in progress)
- Topic-tile prefetch on data-ready (Dashboard/Achievements) — load-audit med.
- `TrophyImage` → expo-image cache/force-cache/retry hardening (mirror CardArt) — load-audit med, high value (backs all topic tiles).
- `App.tsx` preview-only screens → `__DEV__`-guarded requires (keep Skia/DSP out of the production boot graph) — load-audit med.
- Final Exam / Result `popToTop()` lands on Splash → pop to Dashboard instead — nav low-med.

## Filed for owner review (running list)
- **Oversized bundled images (asset regen + native rebuild):** glossary.png 2.5 MB, calc-lab.png 2.2 MB, AudioLearning training-labs.png 2.6 MB + audio-fundamentals.png 2.7 MB (~5.3 MB on one mount), brand-logo.png 1.6 MB (Splash first frame), vu_skin_spl.png 2.8 MB (SPL open). Re-encode as sized WebP (~150–400 KB each). I can script the PIL re-encode on your go; takes effect in production only after a rebuild (per the build rule I won't build).
- **Achievements Gallery** mounts all trophies at once (no virtualization) — refactor to FlatList/FlashList grid; verify layout. `GalleryScreen.tsx`.
- **Home carousel** refetches session + rebuilds catalog on every focus — add a session-scoped cache + invalidation. `CourseSelectionScreen.tsx`.
- **Career JSON** (237 KB) parsed at Curriculum/CareerFinder module load — optional metadata-module split.
- **Native-stack has no lazy loading** — consider React.lazy for heavy off-boot labs/tools; measure first (architectural).
- **Nav (low):** dead route `Directory` (registered, no callers); Settings→About/Paywall modal-over-modal (needs a device check for the black-screen trap); deep-link `labs/eq` resolves to the audible lab not `EqLabHome`, several flagship labs not deep-linkable, unmapped `labs/*` dead-end on LabCategory empty state.

---

## Wave 2 — COMPLETE 2026-09-09
Findings: `docs/audit/wave2_bugs.md` (8: 0 high / 4 med / 4 low) and
`docs/audit/wave2_a11y-entitlement-honesty.md` (12: a11y 4, entitlement 4, honesty 4).
Codebase is exceptionally hardened — no crash-on-normal-use defect; strong a11y
baseline; **no paid-content leak**; the two known ratified-copy math errors
already compute correctly (only copy-sheet re-ratification remains).

### Fixes applied — wave 2 (committed)
- ✅ Boot-hang guards: App.tsx font-load error + Splash getSession rejection (c77b8ec).
- ✅ Defensive: TrophyScreen dev "Trophy 512²" placeholder → clean ★ + guarded
  topicName param; harmonicModel (points-1) denominator (035fdf5).

### Filed for owner review — wave 2
- **Final Exam is missing two later QuizScreen fixes (med, high-stakes capstone):**
  C1 index-based selection (dup option text → dup keys / mis-submit / matching
  soft-lock) and M3 skip-unanswerable fallback (malformed question strands the
  learner until the 10-min force-submit). Recommend porting both from QuizScreen;
  bigger refactor — not auto-applied.
- **`EntitlementProvider.resolved` is consumed by nothing (med):** the M6 first-
  paint guard exists but no screen holds paint on it, so a real member sees
  anonymous/free locks + upsells flash on every cold start. Wire `resolved` into
  CourseSelection/Dashboard first-paint.
- **`subjectMeta.ts` is self-declared PLACEHOLDER copy rendering live** in the
  Curriculum tree (and keyed to the retired v2 matrix) — author or suppress.
- **TrophyScreen results art**: now falls back to ★ because it still uses the old
  icon_url (trophy-icons deleted). Wire it to `topicImagePath` (needs the topic
  gs/achievementId in the Trophy nav params) so the earned screen shows the tile.
- **SpectrumColorPicker a11y (med):** hue wheel + lightness slider are invisible
  to assistive tech (bare View + panHandlers) — add role/label/value.
- **Capability ladder mostly vestigial (med):** only `caps.allTopics` +
  `caps.completionRecords` are read; gating is scattered (raw entitlement vs caps).
- **calc weekly cap fails OPEN by design** — confirm the 5/week `calc_usage` SQL
  is deployed on the backend, or the cap is silently absent.
- **exposureMonitor** ~1 s/session daily-total undercount (dose math — left for
  owner review rather than auto-editing hearing-safety accounting).
- **EarModuleScreen** playback setTimeout not cleared (latent no-op on RN19).

---

## Wave 3 (part 1) — memory / list / long-session perf — COMPLETE 2026-09-09
Findings: `docs/audit/wave3_memory-perf.md` (12: 1 high / 5 med / 6 low).
**Positive:** the Glossary corpus "release valve" IS wired (caches dropped after
60 s backgrounded, timer cancelled on foreground) — not a leak; timers/loops/
listeners across the app are correctly torn down.

### Filed for owner review — perf refactors on hot screens (NOT auto-applied — need careful impl + device/layout verify)
- **[HIGH · should-fix pre-launch] GalleryScreen OOM risk** — `achievements/GalleryScreen.tsx:70` renders all 166+ earned trophies via `ScrollView` + `.map`, every remote image mounting/decoding at once. Refactor to FlatList/FlashList grid with windowing (match the current column layout; verify on device).
- **[Med] Glossary FlatList `extraData` is a fresh array literal every render** — `GlossaryScreen.tsx:1970` → reference compare always fails, every visible row re-renders on any state change. Give it a stable/memoized value with the right deps.
- **[Med] Glossary `renderItem` inline + rows not memoized** — `GlossaryScreen.tsx:1971` → whole visible window re-renders per keystroke. Extract a `React.memo` row + stable renderItem.
- **[Med] Glossary `visible` memo maps+sorts all 26,847 entries per settled search** — `GlossaryScreen.tsx:1483-1518` (per-row array alloc in `searchRank`); already partly mitigated by `useDeferredValue`. Optimize the ranking pass.
- **[Med] Dashboard rebuilds deck arrays + `orderDeckIds()` every render** — `DashboardScreen.tsx:917-928`; wrap in `useMemo` (careful with deps).
- **[Low] tool-demo Animated loops ignore reduce-motion** — gate on `animationsAllowed()` (CPU/battery, not memory).
- Other lows (bounded/acceptable): TopicsScreen/CredentialWall ScrollView `.map` (bounded), per-context `bookmarkStores` map (~171 max), ~2–3× table paging on cold glossary load.

_(Wave 3 part 2 — offline / empty / error states — still running; results appended when it lands.)_
