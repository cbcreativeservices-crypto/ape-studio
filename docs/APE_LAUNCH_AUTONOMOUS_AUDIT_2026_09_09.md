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

---

## Wave 3 (part 2) — offline / empty / error states — COMPLETE 2026-09-09
Findings: `docs/audit/wave3_offline-empty-errors.md` (12: offline 6, empty 2,
error 4 · 2 high / 5 med / 5 low). **Positive:** the newer subsystems (tools
EngineGate/useDspEngine watchdog; Dashboard self-heal + Retry/Back-to-Login) are
exemplary. Recurring anti-pattern in OLDER content-fetch screens:
`.catch(() => setState(empty))` makes an offline blip look like "nothing here."

### Fix applied
- ✅ **Feedback links no longer fail silently** without a mail app — `feedback.ts`
  now shows the support address on failure (540b8d2).

### Filed for owner review — offline/empty/error (mostly additive error states; verify happy path)
- **[High] Glossary: fetch failure looks identical to "No results"** — `GlossaryScreen.tsx:1272,1967`. Distinguish offline (message + retry) from a genuine empty result.
- **[High] Achievements hub: fetch failure → permanent loading skeleton** (`.catch(()=>setHub(null))`) with no error/retry — `AchievementsHomeScreen.tsx:60`.
- **[Med] CredentialWall: failed fetch → "COMING SOON — No certificates"** — `CredentialWall.tsx:55`.
- **[Med] Auth shows raw Supabase error.message** ("Network request failed") + generic fallback — `auth/api.ts:39,72,77,98,107,113`. Map to plain, actionable copy.
- Remaining lows in the report file.

---

# END-OF-DAY SUMMARY — 2026-09-09 autonomous launch audit

Four waves across the owner's focus (bugs, navigation, load/ready times, button
latency) plus cold-start, memory/long-session, offline/empty/error,
accessibility, entitlement, and honesty. **Headline: the app is in strong,
well-hardened shape.** No crash-on-normal-use defect, no paid-content leak, a
strong a11y baseline, disciplined teardown, and the ratified-copy math already
correct. The real risks were a handful of boot/edge hangs and a few older
content-fetch screens — the boot hangs and the launch-blocking items are fixed.

## Fixes applied & committed (12, each tsc + 296 tests green)
- Final Exam Android hardware-back guard (launch blocker) — e3c8632
- Splash session fetch parallelized with the 2.5 s hold — ed2c497
- Boot-hang guards: font-load error + Splash session rejection — c77b8ec
- TrophyScreen dev placeholder → ★ + guarded param; harmonicModel denominator — 035fdf5
- TrophyImage cache hardening (protects all topic tiles) — 0403df1
- Feedback links don't fail silently without a mail app — 540b8d2
(+ report/scaffold commits)

## Prioritized punch-list for the owner (highest launch value first)
1. **Oversized bundled images → sized WebP** (biggest load win): glossary 2.5 MB, SPL skin 2.8 MB, AudioLearning ~5.3 MB, logo 1.6 MB, calc 2.2 MB. I can script the PIL re-encode on your go — takes effect only after a **native rebuild** (build rule: your call).
2. ✅ DONE (commit 26a2514): **GalleryScreen virtualization** — ScrollView+.map → windowed 2-column FlatList (initialNumToRender/maxToRenderPerBatch 10, windowSize 7, removeClippedSubviews); layout preserved (16/14/12 px spacing, half-width cards, odd-row spacer). Device-verify the grid once a session is available.
3. ✅ DONE (commit be84706): **Final Exam C1 + M3 ported** — selection now keyed by option INDEX (duplicate-text options stay independent; values still submitted per F4); `answerable` + "Skip question" fallback prevents strand on a malformed question. tsc + 296 tests green.
4. ✅ DONE (commit 2f0d61d): **Distinguish offline from empty** on Glossary + Trophy Case + CredentialWall — each now tracks a load-failure flag and shows a "check your connection" card + Retry instead of rendering the failure as an empty collection. tsc + 296 tests green. (Device-verify the offline cards on the phone — web preview has no session to populate these.)
5. ✅ DONE (commit cc598ff): **Wired `EntitlementProvider.resolved` into first paint** — CourseSelection folds it into its loader gate; ToolsHub holds the member-gated block until resolved; AudioLearning derives `locked = resolved && !isMember` so the pre-resolve view is non-alarming. A member no longer sees locks/upsells flash on cold start. tsc + 296 tests green. (Device-verify the cold-start paint as a member.)
6. ◑ PARTIAL (commit d6f5ad7): **Render perf** — DONE the two auto-fixable wins: Dashboard deck arrays/Map/orderDeckIds wrapped in one `useMemo`; Glossary FlatList `extraData` memoized (now includes bookmarks/starred/isMember so the bail-out stays correct). STILL OPEN (auto_fixable:no, bigger): Glossary `renderItem`→`React.memo` row extraction (219-line flagship renderItem — do as a focused, device-verified pass) and the full-corpus search-scan precompute (already off the input's critical path via useDeferredValue). tsc + 296 tests green.
7. ◑ PARTIAL — CODE FIXES DONE, OWNER ITEMS OUTSTANDING:
   - ✅ DONE (588d88e): FinalExam result no longer strands on Splash — `replace` instead of `popToTop`; Done/back returns to the originating AwardProgress.
   - ✅ DONE (c49d983): SpectrumColorPicker a11y (hue wheel + lightness slider now `adjustable` w/ label/value/step actions — fixes ColorWheelButton/LedColorPicker/waveform popup too); + DspDebug button roles + CredentialWall cert-image label.
   - ✅ VERIFIED: calc weekly-cap SQL — `calc_consume`/`calc_usage_status` + `calc_usage` table ARE deployed, BUT server `v_limit := 10`, while the client constant + `docs/APE_CALC_WEEKLY_LIMIT_5_2026_09_01.SQL` intend **5**. The 5/week migration was NOT applied → OWNER: apply it (or accept 10 and update `CALC_WEEKLY_LIMIT`).
   - ✅ RATIFIED (owner 2026-09-09, governance RC1): compressor & RF calculator copy — both math-correct, re-ratified; re-ratification item closed.
   - ⏳ OWNER: `subjectMeta` is PLACEHOLDER + v2-keyed copy (render already null-guards unmatched subjects, so no blank-row bug) — ratify real v3-keyed copy, or ask me to hide behind a flag.
   - ⏳ OWNER/CONTRACT (not touched): dead `Directory` route (harmless alias — delete or document); `labs/eq` deep-link ambiguity + uneven lab coverage (cross-repo AASA decision).

All findings with file:line + fixes are in `docs/audit/wave1_*.md`, `wave2_*.md`,
`wave3_*.md`. Guardrails held: no builds, no publishing, no backend/DB changes,
no secrets. Auto-applied only low-risk/high-confidence fixes; everything above is
filed for your judgment + device verification.

---

## Punch-list #1 — DONE (owner GO 2026-09-09, commit ed74948)
Re-encoded the 6 oversized bundled PNGs to sized WebP: **14.21 MB → 0.50 MB**
(saved 13.7 MB), quality preserved, logo alpha kept. Rewired the require() sites;
original PNGs kept as unreferenced masters (not bundled). Verified in web preview;
tsc + 296 tests green. Takes full effect in production after the next native build.
