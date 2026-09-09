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
