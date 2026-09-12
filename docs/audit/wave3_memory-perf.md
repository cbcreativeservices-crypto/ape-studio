# Wave 3 audit — Memory / long-session / list performance

Scope: `src/screens/glossary/**`, `src/screens/achievements/**`, `src/screens/dashboard/**`,
`src/features/**`, `src/components/**`. Read-only. Expo SDK 57 / RN 0.86, New Arch.

**Headline:** the app is unusually disciplined about teardown — session caches, external
stores, timers, RAF loops, AppState/AccessibilityInfo listeners and Animated loops are almost
all correctly cleaned up or are intentional process-lifetime singletons. The real launch risk
is concentrated in **one unvirtualized image list (Gallery)** plus a cluster of **FlatList /
re-render inefficiencies in the Glossary** that scale with the 26,847-row corpus.

Counts by severity: **High 1 · Medium 5 · Low 6** (12 findings). **Auto-fixable: 5.**

## Top 5
1. **[High] GalleryScreen renders every earned trophy in a ScrollView + `.map` (no virtualization)** — all 166+ remote images mount at once.
2. **[Med] Glossary FlatList `extraData` is a fresh array literal every render** — defeats FlatList's re-render bail-out for all mounted rows.
3. **[Med] Glossary `renderItem` is an inline closure + rows aren't memoized** — every parent state change re-renders all windowed rows.
4. **[Med] Glossary `visible` maps + sorts the full 26,847-row corpus on every settled search** — allocates per-entry arrays in `searchRank`; only partially mitigated by `useDeferredValue`.
5. **[Med] DashboardScreen rebuilds the deck arrays + `orderDeckIds()` on every render** — no `useMemo`.

---

## Findings

### [High] GalleryScreen: unvirtualized image grid mounts all trophies at once
`src/screens/achievements/GalleryScreen.tsx:51,70-95`
Issue: the earned-trophy gallery is a `ScrollView` whose `contentContainerStyle` wraps
`(entries ?? []).map(...)`. Each card mounts a `<TrophyImage>` that loads a remote Supabase
Storage image via expo-image with `cachePolicy="memory-disk"`. With the v3 model every topic
has its own trophy, so a heavy user can have 166+ earned entries — all image views instantiated
and all bitmaps decoded/held in memory simultaneously, with no windowing. This is the classic
render-all-at-once mount cost + resident-memory spike on the exact 2–3 GB devices most at risk
of an OOM kill. Refetches on every focus (`useFocusEffect`) as well.
Fix: convert to `FlatList` (2-column via `numColumns`, `keyExtractor={e=>e.achievementId}`) or
FlashList, with `initialNumToRender`/`windowSize`/`removeClippedSubviews` so off-screen trophy
images unmount. Mirrors the pattern already used correctly in `GlossaryScreen`.
`auto_fixable: no`

### [Med] Glossary FlatList `extraData` is a new array every render
`src/screens/glossary/GlossaryScreen.tsx:1970`
Issue: `extraData={[expandedIds, focusedId, details, cardView, ttsBeg, termIndex, mediaById,
filter, formulaById, search, selectMode, selectedIds, linksOn]}` allocates a brand-new array on
every render. `extraData` is compared by reference, so a new identity every time forces FlatList
to treat its data as changed and re-render every mounted row on any parent state change — it can
never take the cheap bail-out. Combined with finding #3 this makes each keystroke/toggle re-render
all ~30 windowed rows.
Fix: wrap in `useMemo(() => [...], [deps])`, or (better) drop `extraData` entirely once rows are a
`React.memo` component keyed on the specific props they read.
`auto_fixable: yes`

### [Med] Glossary `renderItem` inline closure + non-memoized rows
`src/screens/glossary/GlossaryScreen.tsx:1971`
Issue: `renderItem={({ item }) => { ... }}` is re-created on every render and the row body is
inlined rather than a memoized component. Nothing shields a row from re-rendering when unrelated
screen state changes (search field colour, popup trail, bookmark counts, etc.). Each row also runs
`LinkedText` (which is internally memoized per text, so that part is fine).
Fix: extract a `const GlossaryRow = React.memo(function Row(props){...})` and a stable
`renderItem` (module-scope or `useCallback`) passing only the props the row uses; combined with #2
this stops the whole visible window from re-rendering on every keystroke.
`auto_fixable: no`

### [Med] Glossary `visible` scans/sorts the entire corpus on every settled search
`src/screens/glossary/GlossaryScreen.tsx:1483-1518` (search block 1506-1516; `searchRank` 276-285)
Issue: the `visible` memo filters and sorts all 26,847 entries. On a search it does
`entries.map(e => ({ e, r: searchRank(...) }))` (allocates a wrapper object per entry) then
`.filter().sort()`. `searchRank` itself does `termLower.split(/[^a-z0-9]+/)` per candidate,
allocating an array for every corpus row on every settle. The code already added `useDeferredValue`
(line 1482) to keep typing responsive, and acknowledges the cost in a comment — but the O(n log n)
sort + per-row allocations still run in full on each settled query and each filter/bookmark change.
Fix: precompute a `{ id, term, termLower, wordStarts }` array once per corpus load (memo on
`entries`) and have the search reuse it; short-circuit `.sort` when the query is empty; consider a
prefix bucket. Lower priority than #2/#3 because it's already off the input's critical path.
`auto_fixable: no`

### [Med] DashboardScreen rebuilds deck arrays + `orderDeckIds()` every render
`src/screens/dashboard/DashboardScreen.tsx:917-928`
Issue: `deckMembers`, `deckById` (`new Map(...)`), `orderedIds` (`orderDeckIds(...)`), `topics`
and `removedMembers` are all derived inline in the render body with no `useMemo` — recomputed on
every render of a long-lived, animation-heavy screen (jog dial, pulse loop, pan responder). The
comment calls them "cheap; small arrays," and they are bounded by the enrolled-topic count, so
this is a churn/GC concern rather than a leak, but it runs on a screen that re-renders often.
Fix: `useMemo` keyed on `[data, deckPrefs, customOnDashboard]`.
`auto_fixable: yes`

### [Low] TopicsScreen renders the full subject tree in a ScrollView
`src/screens/achievements/TopicsScreen.tsx:86-125`
Issue: the whole flattened subject list is `subjects.map(...)` inside a `ScrollView`. Only the
one open subject renders its topic rows (collapsed subjects don't), so the mounted node count is
bounded (~40 subject cards + one expanded subject's topics) and there are no images at the subject
level — acceptable today. It becomes a virtualization candidate only if the subject count grows a
lot or topic rows are shown expanded-by-default.
Fix (if needed later): `SectionList`/`FlatList` of subjects.
`auto_fixable: no`

### [Low] CredentialWall earned list is a ScrollView + `.map`
`src/screens/achievements/CredentialWall.tsx:77,93-122`
Issue: earned certificates/programs render via `.map` in a `ScrollView`, each with a bundled
`Image` (local `require`, not remote). Count is bounded by the number of published credentials
(small), so no action needed now; noted for completeness against the "long list" hunt.
`auto_fixable: no`

### [Low] flaggedStore per-context bookmark stores never pruned
`src/features/flags/flaggedStore.ts:145,151-158`
Issue: `bookmarkStores = new Map()` gains one `SetStore` per bookmark context (`glossary` + each
topic id the user bookmarks under) and is only ever reset in place (`resetLocal`), never shrunk.
Growth is bounded by the number of distinct contexts (~171 topics + glossary), each holding a
small Set, so this is a low ceiling, not an unbounded leak. The in-place reset is deliberate and
correct (replacing the Map would orphan mounted `useBookmarks` listeners — well documented).
`auto_fixable: no`

### [Low] Glossary cold load pages the glossary table ~2–3× per session-cache miss
`src/screens/glossary/GlossaryScreen.tsx:134-222`, effects at `985-1006`
Issue: a cold Glossary open runs three independent full paged scans — the corpus
(`loadAllEntries`, id/term/definition/plain_english), `glossary_media`, and a second full
`glossary` scan for `formula_symbolic/_words` (`fetchAllGlossaryFormulas`, which today 403s on
every row per the comment). All three are session-cached and dropped together by the release
valve, so this is a startup-bandwidth/time cost, not a leak; but after the 60 s background release
(line 105) the next open re-pays all of it. The formula scan in particular re-reads all 26,847
rows to (currently) build an empty map.
Fix: gate the formula scan behind a cheap capability probe, or fold the columns into the main
select once the grant lands; consider a persistent delta-sync cache (already noted as deferred
launch-prep work #2/#3 in the file header comment).
`auto_fixable: no`

### [Low] Glossary corpus caches — memory release valve is correctly wired (verify-only)
`src/screens/glossary/GlossaryScreen.tsx:87-119`
Not a defect — confirming the item called out in the brief. `ENTRIES_CACHE` / `MEDIA_CACHE` /
`FORMULA_CACHE` hold the whole corpus + derived indexes for the process, and the documented
"release valve" IS actually wired: a module-level `AppState.addEventListener('change', ...)` drops
all three after a sustained 60 s in `background`, and cancels the timer on any non-background
transition (so a quick app-switch doesn't cost a reload). The listener is a process-lifetime
singleton (intended, not a leak). One nuance: the release keys on state `=== 'background'` only —
iOS `inactive` (and some OEM states) won't arm it, but a true background will. Working as intended.
`auto_fixable: no`

### [Low] Tool-demo Animated loops run continuously while mounted (no motion/focus gate)
`src/components/tooldemos/RtaDemo.tsx:196-205,277-288` (representative; other `tooldemos/*` similar)
Issue: `MorphBars`/`SceneSmoothing` start `Animated.loop(...)` that run forever while mounted, and
`MorphBars`' flutter loop uses `useNativeDriver:false` (drives SVG rect geometry on the JS thread).
They're correctly `loop.stop()`-ed on unmount, so there's no leak, and they only mount while their
screen is up — but they don't honor `animationsAllowed()` (the app+OS reduce-motion flag that the
Dashboard pulse now respects, `features/settings/a11y.ts`) and keep the JS thread busy even when
the demo is scrolled off / the screen is blurred. Battery/CPU during a long tools session more than
memory.
Fix: gate the loops on `animationsAllowed()` and/or screen focus.
`auto_fixable: no`

### [Low] Confetti allocates 26 `Animated.Value`s per mount (verify-only)
`src/components/Confetti.tsx:22-49`
Not a defect. A 3 s burst; the pieces live in a `useRef` (not recreated on re-render) and the
parallel animation is `stop()`-ed on unmount. No `Dimensions` listener is added. Included only
because confetti is a common leak source and this one is clean.
`auto_fixable: no`

---

## Explicitly checked and found correctly torn down (not leaks)
- `features/study/sync.ts` — `StudySession.start()` timers + AppState sub all cleared in `stop()`; progress bus uses add/return-remove.
- `features/study/SessionTimer.tsx` — single fire-at-end timeout cleared on unmount; per-second interval lives in a child pill and is cleared.
- `features/tools/engine/useRafFrameLoop.ts` — RAF loop guarded by `alive` + `cancelAnimationFrame` on cleanup; callback read through a ref so it never re-subscribes.
- `features/audio/exposureMonitor.ts` — 1 s poller armed only while audio/mic active + app foreground; `day.sessions` capped at 60; AppState listener is an intentional app-root singleton.
- `features/settings/a11y.ts`, `features/settings/LowLightLayer.tsx` — AccessibilityInfo/AppState listeners are singletons or removed via `sub.remove()` on unmount.
- `features/profile/topicTrophies.ts`, `features/flags/flaggedStore.ts` — external stores hydrate once, add/remove listeners in `useEffect` cleanup, and expose `resetLocal()` for account switch.
- `components/TrophyImage.tsx` — retry timer cleared on url change/unmount; expo-image cache keyed on URL.
