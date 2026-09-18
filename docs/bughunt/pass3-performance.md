# Bug hunt — Pass 3, agent G: performance, startup and the first sixty seconds

Axis: does the app feel fast on a **mid-range Android phone**. Not leaks (pass 2
covered those) — work the app does that it should not do at all, or should do
later.

Everything below was read, not guessed. Where I could measure, I measured and
say so; where I could only reason, I say that too and name what would settle it.

---

## Worth fixing before launch — the shortlist

Ranked by *user-visible slowness per unit of fix risk*. Only these five are
"this is slow". Everything after them in the body is "this is wasteful but
invisible" and is labelled as such.

| # | What | Where | Cost | Fix size |
|---|------|-------|------|----------|
| **G1** | The Study tab re-downloads one JSON row **per (topic × glossary term)** on every focus and after every study write, unpaginated, just to count them | `src/features/dashboard/api.ts:136-144` | 100 KB – 1.5 MB per Dashboard load, repeated all day | small |
| **G2** | Opening **Explore** pages the whole `glossary_topics` join table (≥26,855 rows) 1,000 at a time, **sequentially**, on every mount | `src/features/curriculum/curriculumStats.ts:79-93` | ~27 serial round trips, ~1 MB, 5–10 s on cellular | small |
| **G3** | Every Home top button mounts **all five** Awards pages at once, each with its own fetch storm | `src/screens/awards/AwardsScreen.tsx:784-830` | 4 screens built + ~8 queries the user did not ask for | one-line-ish |
| **G4** | Explore → **TOPICS** tab mounts 171 unvirtualized rows, each pulling a **1024×1024 WebP** to draw it at 34 pt | `src/screens/curriculum/CurriculumScreen.tsx:443` | ~166 concurrent requests, **~33 MB** of mobile data in one tap | small |
| **G5** | An **889 KB music-notation font nobody references** is loaded before the first frame | `src/theme/tokens.ts:120` | blocks Splash; 889 KB of the binary | one line |

G5 is five minutes. G1/G2/G4 are contained single-function changes. G3 is one
prop. None of them touch navigation or entitlement.

**Not on the shortlist, deliberately:** the cold-start module graph (G6) is the
largest single number in this report and I still would not touch it days from
launch — see its risk note.

---

# Findings

## G1. The Dashboard downloads thousands of rows to count them — on every focus, and again after every study write

**Severity:** MAJOR **Confidence:** high (code path traced end to end; the row
magnitude comes from the project's own measurement, cited below)

**Where:** `src/features/dashboard/api.ts:130-144`

```ts
const { data: direct } = await supabase
  .from('glossary_topics')
  .select('achievement_id')
  .in('achievement_id', topicIds);
for (const r of (direct ?? []) as { achievement_id: string }[]) {
  counts.set(r.achievement_id, (counts.get(r.achievement_id) ?? 0) + 1);
}
```

**What the user does:** taps the Study tab. Or finishes a flashcard and comes
back. Or the 30 s study-flush loop lands.

**What happens:** `resolveItemCounts` fetches **one JSON object per
(topic, glossary-term) pair** for every enrolled topic — and then throws the
rows away, keeping only a count. There is no `count` aggregate, no RPC, no
pagination.

**The trigger points** (`src/screens/dashboard/DashboardScreen.tsx`):
- line 900 — `useFocusEffect` → `InteractionManager.runAfterInteractions(load)`
- line 911 — `onStudyProgress(() => void load())`, i.e. **every study write**
- line 936 — every enrollment-list edit
- line 924 — every Course ⇄ Enrollment toggle

**The cost.** `docs/APE_GLOSSARY_DEVICE_ID_BUILD_PLAN_2026_09_13.md:329` records
the measurement: *"0 of 26,855 terms are unlinked from `glossary_topics`"*. So
the table holds ≥26,855 rows across 171 topics — ~157 terms per topic. The
response is `{"achievement_id":"<36-char uuid>"}`, ~55 bytes of JSON per row:

| Enrolled topics | Rows | Payload per Dashboard load |
|---|---|---|
| 2 (the free tasters) | ~310 | ~17 KB |
| 12 (a certificate) | ~1,900 | ~105 KB |
| 50 (a programme) | ~7,850 | ~430 KB |
| 171 (everything) | ~26,855 | **~1.5 MB** |

A programme student who studies for an hour, bouncing between a method screen
and the Dashboard, pays ~430 KB **per bounce** — and each one also parses
~8,000 objects on the JS thread before the rack can repaint.

**Second-order risk, and why this is not just slow.**
`docs/CCODE_CLIENT_THROTTLING_2026_09_05.md:31-32` singled out **this exact
call** ten days ago: *"§C. Paginate the one unpaginated `glossary_topics`
fetch… This bounds the largest single response so the owner can safely set a
server-side **Max rows** cap afterward."* It was never done. If a Max-rows cap
is ever set on the project (and the doc says the plan is to set one), this
query silently truncates, `itemCountByTopic` comes back short, and **every
study-method percentage on the Dashboard is wrong** — quietly, with no error.

**What should happen:** a `count`-only read (PostgREST `head: true` +
`count: 'exact'` per topic, or better a `get_topic_term_counts(gs[])` definer
RPC returning 171 integers). Failing that, page it with the pattern that
already exists 30 lines away in `curriculumStats.ts` — which is exactly what
the throttling doc asked for.

---

## G2. Explore pages the entire glossary→topic join table, one thousand rows at a time, in a serial loop

**Severity:** MAJOR **Confidence:** high

**Where:** `src/features/curriculum/curriculumStats.ts:79-93`

```ts
for (let from = 0; ; from += PAGE) {            // PAGE = 1000
  const { data, error } = await supabase
    .from('glossary_topics')
    .select('achievement_id')
    .in('achievement_id', ids)                  // ids = all 171 topics
    .range(from, from + PAGE - 1);
  if (error || !data || data.length === 0) break;
  ...
  if (data.length < PAGE) break;
}
```

**What the user does:** taps **Explore** (or any of the other four Home top
buttons — see G3, which mounts this page regardless).

**What happens:** with ≥26,855 rows to walk, this is **~27 HTTP round trips,
awaited one after another**, each returning ~37 KB. On a mid-range phone on
4G with a 150 ms RTT and typical Supabase response time, that is comfortably
**5–10 seconds of continuous network** — and it starts the moment the screen
mounts, competing with the curriculum fetch, the certificate/programme fetch
and the topic-tile images.

**And it is all for a line inside a collapsed accordion.** The only thing
`termsByGs` feeds is `"{n} topic(s) · {terms} terms"` in the SUBJECTS tab's
*expanded* body (`CurriculumScreen.tsx:378-380`). The headline numbers it also
returns (`totalTerms`, `totalQuestions`) are already served instantly and
cached by `useAcademyStats` — which the screen calls on the very next line
(`CurriculumScreen.tsx:188-191`) and whose own header says *"Nightly-precomputed
counts → INSTANT hero (cached, zero spinner). Live curriculum/credential fetches
below are the first-run fallback only."* The expensive hook is the fallback that
always runs.

**A correctness wrinkle worth passing on:** the paged query has **no `.order()`**.
PostgreSQL does not guarantee row order across separate `LIMIT/OFFSET` queries
without an `ORDER BY`, so consecutive pages can repeat or skip rows and the
per-subject term counts can come out wrong. Adding `.order('achievement_id')`
fixes it at zero cost — but the real fix is not to do this on the client at all.

**What should happen:** run it only when a subject is expanded, or add a
`get_terms_by_topic()` definer RPC that returns 171 `(gs, count)` pairs in one
request. Either turns 27 round trips into one.

---

## G3. Every Home top button builds all five Awards pages, not the one that was tapped

**Severity:** MAJOR **Confidence:** high

**Where:** `src/screens/awards/AwardsScreen.tsx:784-830`

```tsx
<FlatList
  data={PAGE_ORDER}                 // ['curriculum','specialization','program','directory','enrollment']
  horizontal
  pagingEnabled
  initialScrollIndex={startIdx}
  getItemLayout={...}
  renderItem={({ item }) => item === 'curriculum' ? <CurriculumView …/>
                          : item === 'directory'  ? <DirectoryView …/>
                          : item === 'enrollment' ? <EnrollmentView …/>
                          : <AwardPageView …/>}
/>
```

No `initialNumToRender`, no `windowSize`. `FlatList`'s default
`initialNumToRender` is **10** and there are **5** pages — so all five mount on
the first render.

**What the user does:** taps *Explore*, *Certificates*, *Programs*, *Directory*
or *Enrollments* on the Home screen (`CourseSelectionScreen.tsx:1483, 1500,
1510, 1520, 1534`). All five land on the same pager.

**What happens — the fetch storm from one tap:**

| Page mounted | Work it starts on mount |
|---|---|
| `CurriculumView` | `fetchV3Curriculum()`, `fetchV3Programs()` + `fetchV3Certs()`, `useAcademyStats()` (AsyncStorage + RPC), `useCurriculumStats()` → **G2's 27 serial round trips**, `useCareerFinder()`, 50 subject accordions built |
| `AwardPageView` ×2 | certificate / programme lists |
| `DirectoryView` | `fetchPublicProfile` + its 8 modals constructed |
| `EnrollmentView` | `fetchV3CurriculumStrict` + `fetchV3ProgramsStrict` + `fetchV3CertsStrict`, `fetchEnrollmentDashboard`, `loadAllLocalMethodStates` (an `AsyncStorage.getAllKeys` + `multiGet`) |

Roughly eight server round trips and four full screens' worth of React tree for
a user who asked for one. On Android `removeClippedSubviews` defaults to true
for `VirtualizedList`, so the off-screen pages get *detached from the view
hierarchy* — but they stay **mounted**, so every one of those effects still
fires. Detaching saves draw cost; it saves none of the network or the JS.

**What should happen:** `initialNumToRender={1}` + `windowSize={3}` on that
`FlatList`. The pager already has `getItemLayout`, so paging still lands
exactly; neighbours pre-render, the far pages do not. One prop pair, no
behaviour change the user can see other than speed.

---

## G4. The TOPICS tab pulls 33 MB of 1024² artwork to draw 34 pt thumbnails, unvirtualized

**Severity:** MAJOR **Confidence:** high on the geometry and the file sizes;
high on the request count; the wall-clock depends on the user's connection

**Where:**
- `src/screens/curriculum/CurriculumScreen.tsx:443-445` — `{allTopics.map((t) => <TopicRow …/>)}` inside a plain `ScrollView` (line 312)
- `src/screens/curriculum/CurriculumScreen.tsx:72-84` — `TopicRow` → `<TrophyImage iconUrl={topicImagePath(gs)} size={34} …/>`
- `src/data/topicImages.ts:1-11` — *"The 166 per-topic tile images … **1024x1024 WebP**"*

**What the user does:** on Explore, taps the **TOPICS · 171** tab (the other tab,
SUBJECTS, is the default — this one is one tap away).

**What happens:** 171 rows render at once. There is no `FlatList`, no
`removeClippedSubviews`, no windowing — `ScrollView` mounts every child. 166 of
those rows resolve a real `topicImagePath`, so `TrophyImage` immediately mounts
166 `<Image>`s pointing at the `topic-tiles` bucket.

**Measured (`assets/topic-images-webp`, the source set for that bucket):**

```
count 166   total 33.30 MB   median 202 KB   max 367 KB
```

So one tap fires **166 concurrent HTTPS requests for ~33 MB** to fill
34 pt × 34 pt squares (≈102 px at 3×). That is ~100× more pixels than the
display needs, per row. On a 5 Mbps mobile connection the download alone is
close to a minute, during which the list shows `topicThumbFallback` dark
squares. `expo-image`'s disk cache means it is a first-visit cost, not a
per-visit one — but the first visit is the one a new paying customer has.

The same 1024² assets are used elsewhere, correctly: `TopicDetailModal` shows
one full-bleed (right size for the file), and `achievements/GalleryScreen.tsx:110-121`
puts them in a windowed `FlatList` (`initialNumToRender={10}`, `windowSize={7}`).
This screen is the outlier.

**What should happen:** either (a) make this a `FlatList` so only what is on
screen requests art, or (b) serve a thumbnail rendition
(Supabase Storage supports `?width=96` image transforms) for the 34 pt rows.
(a) alone fixes the 166-concurrent-requests problem; (a)+(b) makes it free.

---

## G5. Two fonts are loaded before the first frame that nothing in the app uses — one of them is 889 KB

**Severity:** MINOR (but it is the cheapest real win in this report)
**Confidence:** high — verified by exhaustive grep

**Where:** `src/theme/tokens.ts:104-121`, consumed by `App.tsx:140`
(`useFonts(fontAssets)`), which gates the entire app behind
`if (!fontsLoaded && !fontError) return <View …/>` at `App.tsx:237`.

`fontAssets` registers 16 faces. Two of them are never referenced:

- **`Bravura` (line 120) — `assets/fonts/Bravura.otf`, 889,260 bytes.** It is the
  single largest asset in the bundle (`dist/assets/.../Bravura.*.otf`). Nothing
  in the app sets `fontFamily: 'Bravura'` — `grep -rn "fonts\.bravura\|'Bravura'" src --include=*.tsx`
  returns nothing outside `tokens.ts`. The one screen that draws SMuFL glyphs,
  `src/screens/lab/amplitude/AmplitudeOrientation.tsx:577`, loads the file
  **itself and separately**, through Skia:
  `const dynFont = useFont(require('../../../../assets/fonts/Bravura.otf'), DYN_SIZE)`.
  So the boot-blocking registration is pure waste.
- **`Yellowtail` (line 117 / `fonts.script`, line 92).** `grep -rn "fonts\.script\|Yellowtail" src App.tsx` returns
  only the two declaration lines. Dead.

**What the user sees:** the Splash screen — and therefore its deliberate 2.5 s
intro hold (`SplashScreen.tsx:99`) — cannot **start** until `useFonts` resolves
all 16. The 2.5 s is not competing with the font load; it is queued **behind**
it. An 889 KB OTF that is parsed by the platform font engine on a mid-range
Android is a real slice of that pre-hold gap.

**What should happen:** delete both entries from `fontAssets`. Nothing renders
differently; `AmplitudeOrientation` keeps its own Skia `useFont`.

---

## G6. 840 of 855 project modules — 98% of the app — are evaluated before the first frame

**Severity:** MAJOR by size, **but see the risk note: I do not recommend acting
on this before launch.**
**Confidence:** high on the numbers (measured); *low* on the millisecond figure,
which I could not measure from here.

**Where:** `src/navigation/RootNavigator.tsx:15-137` — **113 static screen
imports**, no `React.lazy`, no `getComponent`, no dynamic `import()`. `App.tsx:13`
imports `RootNavigator` at module scope, so requiring `App` requires all of it.
`App.tsx:15-49` adds ~25 more screen imports on top, for dev-only web preview
harnesses.

**Measured** (walked the static ESM import graph from `App.tsx` over project
files; script is throwaway, not committed):

```
BOOT GRAPH (static imports from App.tsx, project files only)
  modules: 840   source bytes: 13.89 MB
  src/screens modules in boot graph: 447
  total src files on disk: 855   bytes: 15.61 MB
  src files NOT statically reachable from App.tsx: 27
```

And from the shipped Android bundle's source map
(`dist/_expo/static/js/android/index-*.hbc.map`):

```
3,277 modules, 23.90 MB of source → 18.44 MB of Hermes bytecode
  src + assets:   13.14 MB  (829 files)
  node_modules:    9.60 MB  (2,441 files)
```

**Why it is all eager, not lazy.** Expo's Metro preset ships
`inlineRequires: false` (verified in this project's installed
`@expo/metro-config/build/ExpoMetroConfig.js`), and `metro.config.js` spreads
`config.transformer` without replacing `getTransformOptions` — so the default
survives. With inline requires off, every `import` is hoisted to a `require()`
at the top of the module body. Requiring `App` therefore executes the module
body of all 447 screen modules — every `StyleSheet.create`, every module-scope
constant table, every `Animated.Value` — before `SplashScreen` can mount, before
the 2.5 s hold begins.

**The biggest single passengers on that graph** (from the bundle map):

| KB | Module | Why it is on the boot path |
|---|---|---|
| 512 | `src/features/credentials/certificateAssets.ts` | `ProfileScreen.tsx:26` → `certificateHtml.ts:3`. Base64 WOFF2 + a PNG data-URI + two glyph-width tables, needed only when someone prints a certificate |
| 299 | `@sentry-internal/replay` | pulled in by `@sentry/react-native`'s barrel export. Session Replay is *deliberately never added* (`telemetry.ts:63`) — this is browser code that cannot run on RN |
| 216 | `src/data/careerIndex.json` | `careerIndex.ts:13` ← `CurriculumScreen.tsx:38` |
| 220+227 | `curated/oddTerms.json`, `misunderstoodTerms.json` | `App.tsx:61` → `localSchedule.ts:27` → `curatedTermLists.ts:28-29`, which also runs `clean()` over both 1,095-entry arrays at module scope |
| 76+32 | `@sentry-internal/feedback`, `replay-canvas` | same barrel, same reason |

**Honest scoping of the data files.** I measured the parse side of these and
they are *not* the problem: `careerIndex.json` is ~0.9 ms to `JSON.parse` on
V8, `clean()` over both curated lists is ~0.09 ms. Hermes materialises bundled
JSON from a serialised object-literal buffer, which is comparable. Call it tens
of milliseconds and a couple of MB of heap for the lot — **wasteful but
invisible**. `careerIndex.ts` is also careful: the 1,898-career decode in
`all()` is lazy behind a memo (`careerIndex.ts:62-82`), and the eight ~220 KB
cymatics modal-library JSONs are `require`d *inside* `loadLibraryShape`
(`modalLibrary.ts:185-205`) rather than imported — 1.7 MB correctly kept off the
boot path. Good work; I checked because I expected to find the opposite.

**So what does the 18.4 MB actually cost?** I can't tell you from a desktop. The
per-module `require` dispatch for 3,277 modules plus 447 screen module bodies is
the kind of thing that lands between a few hundred milliseconds and a couple of
seconds on a mid-range Android — but that range is too wide to act on.

**What would settle it:** Sentry's `appStart` integration is already in the
bundle (`@sentry/react-native/dist/js/tracing/integrations/appStart.js`) but is
switched off by `enableAutoPerformanceTracing: false` (`telemetry.ts:61`).
Turning it on for a single internal build gives the real cold-start-to-TTI
split. Failing that, two `performance.now()` marks — one as the first line of
`index.ts`, one in `SplashScreen`'s first effect — logged once, answers it in a
minute.

**Risk note — why this is not on the shortlist.** There are two levers:

1. `inlineRequires: true` in `metro.config.js`. One line, and it is what the
   bare React Native template ships. But Expo turns it *off* on purpose: it
   changes **when module side effects run**, and this codebase leans on import
   ordering in several places by design — `index.ts` documents at length that
   `App` must be imported *after* CanvasKit resolves, and there are
   hydrate-on-import stores (`labCompletion.ts:170`, `deckOrderStore.ts:50`,
   `popupSuppressStore.ts:45`, `amplitudeOrientation.ts:52`,
   `onboardingFlow.ts:77`) plus `initTelemetry()` / `initExposureMonitor()` at
   `App.tsx:92-101`. Flipping it needs a full device regression pass, not a
   publish.
2. Converting `RootNavigator`'s 113 imports to `getComponent={() => require(…)}`.
   Mechanical and side-effect-safe, but it is 113 edits to the single file that
   every route in the app passes through, days from launch.

Both are right. Neither is right *this week*. Measure first.

---

## G7. The Cymatics gallery runs the full physics chain for every thumbnail, synchronously, inside render

**Severity:** MAJOR (for anyone who saves more than a handful of patterns)
**Confidence:** high on the mechanism; the device figure is extrapolated from a
desktop measurement and is stated as a range

**Where:** `src/screens/lab/cymatics/GalleryScreen.tsx:51-61` and `:265-266`

```ts
const geomCache = new Map<string, PatternGeometry>();
function geometryFor(p: SavedPattern): PatternGeometry {
  const key = `${p.id}:${JSON.stringify(p.state)}`;
  let g = geomCache.get(key);
  if (!g) {
    g = patternGeometry(p.state, ART_N);              // ART_N = 96
    if (geomCache.size > 80) geomCache.delete(geomCache.keys().next().value as string);
    geomCache.set(key, g);
  }
  return g;
}
…
{visible.map((p) => {
  const g = geometryFor(p);                            // ← inside render
```

**What the user does:** opens **Pattern Gallery & Art Studio** with N saved
patterns.

**What happens per thumbnail, on the JS thread, in the render pass:**
1. `patternGeometry(state, 96)` → `plateModes(spec, 16)` then
   `sampleField(…, 96)`: a 96 × 96 grid × 16 modes ≈ **147,000 mode
   evaluations**. With a second tone selected it runs twice plus a
   normalisation pass (`patternField.ts:45-60`).
2. `<PatternFigure>` → `figureLayers` → `analyse(g)`
   (`figure.ts:65-72`): marching squares over the 95×95 cell grid
   (`isoLines`) **and** a region labelling pass over all 9,216 cells
   (`labelRegions`), then `polylinesToPath` builds the path strings.

**Measured** (the real modules, under `node --test` with the project's own
resolver hook, after JIT warm-up):

```
per-thumbnail: patternGeometry 3.48 ms, figureLayers/analyse 1.81 ms
20 thumbnails total 105.8 ms   (desktop node/V8)
```

**≈5.3 ms per thumbnail on desktop V8.** Hermes has no optimising JIT — it is an
interpreter with inline caches — and a mid-range Android core is slower again.
Treat 5.3 ms as a floor and expect **roughly 25–60 ms per thumbnail on the
target device**. At 20 saved patterns that is **0.5–1.2 s of completely frozen
UI** with no spinner: the screen simply does not appear until it finishes. At 40
patterns, double it.

**Two things that are right** and keep this from being worse: `analyse()` is
cached on a `WeakMap` keyed by the geometry object (`figure.ts:64`), and
`PatternFigure` is `memo`'d with a `useMemo`'d frame (`PatternFigure.tsx:89-92`),
so a favourite-toggle or a filter tap does *not* recompute — the cached geometry
object comes back by identity and memo holds. The cost is the **first** paint
with N patterns.

**Two things that are not:**
- The cache is a FIFO capped at 80 (`geomCache.keys().next().value`), not an LRU.
  Past 80 saved patterns it evicts the oldest inserted rather than the least
  recently used, so scrolling a large gallery can thrash and recompute
  repeatedly.
- `JSON.stringify(p.state)` runs once per pattern **per render**, even on the
  cache-hit path. Small, but it is in the hot loop for no reason —
  `p.updatedAt` is already on the record and is a valid cache key.

**What should happen:** compute geometry off the render pass — a `useEffect`
that fills a state map, thumbnails showing a placeholder until their entry
lands, and (ideally) `InteractionManager.runAfterInteractions` so the screen
transition finishes first. That is the exact idiom `ToolsHubScreen.tsx:985-990`
already uses (`displaysReady`) for the same reason, with the same comment:
*"the screen was slow to open."*

Note: this screen is the uncommitted Cymatics Phase 4 work, so it can be fixed
in the same pass as its device test rather than as a launch hotfix.

---

## G8. The Enrollments browser re-renders all 171 topic rows on every add and every remove

**Severity:** MINOR **Confidence:** high

**Where:** `src/screens/enrollment/EnrollmentScreen.tsx:943` (`topicAddRow`) and
`:1776` (`allTopicsAZ.map((t) => topicAddRow(t.gs, t.name))`, inside the
`ScrollView` at line 385).

`topicAddRow` is a **plain closure defined in the component body** — not a
component, so it cannot be `memo`'d, and every call re-creates the whole subtree.
The "all topics A–Z" view renders all 171 rows (≈700 native views) with no
virtualization. Tapping ✓/+ calls `toggleTopic`, which changes `enrolledGs`,
which re-runs the parent render, which rebuilds all 171 rows to change one
checkmark.

**Cost:** text-only rows, so the mount is survivable (unlike G4, there are no
images here) — but the *diff* on every tap is 171 × ~4 elements. On a mid-range
phone that is tens of milliseconds of lag between the tap and the ✓ appearing,
every time, while a user is adding a programme's worth of topics one by one.

**What should happen:** extract `topicAddRow` into a `memo`'d `TopicAddRow`
component taking `(gs, name, on, started, coreLocked, onToggle, onRemove)`, so
only the touched row re-renders. A `FlatList` would be better still but is a
bigger change.

---

## G9. The Home carousel's `extraData` is a fresh array literal on every render

**Severity:** MINOR **Confidence:** high — this is the *same bug the team already
fixed in the Glossary*, still present on the app's first screen

**Where:** `src/screens/courses/CourseSelectionScreen.tsx:1571`

```tsx
extraData={[activeIdx]}
```

`VirtualizedList` compares `extraData` **by reference**. A new array every render
means every mounted cell is dirty on every parent render.

The identical mistake is documented as fixed in
`src/screens/glossary/GlossaryScreen.tsx:2230-2231`:
> *"Stable FlatList extraData (launch audit 2026-09-09): this was a fresh array
> literal every render, which FlatList compares by reference — so any parent…"*

It compounds with `CourseCardView` (line 478) not being wrapped in `memo`, and
with `renderItem` being an inline arrow (line 1578). Home re-renders on focus
(`load()` at 1043), on `setV3NameIndex` (1053), on every enrollment/bundle store
change — and each one repaints every visible card, including its `CardArt`
image and Skia shimmer wrapper.

**What should happen:** `extraData={activeIdx}` (a number — compared by value),
and `export const CourseCardView = memo(function CourseCardView(…))`. The
handlers passed to it are already `useCallback`'d, so `memo` will actually hold.

---

## G10. The tube-diagram viewer's pinch/zoom settle runs on the JS thread for transform-only animations

**Severity:** MINOR **Confidence:** high

**Where:** `src/screens/lab/tube/TubeCardScreen.tsx:269, 281-283, 287, 298-300`

Seven `Animated.spring(...)` calls, all `useNativeDriver: false`. The only
animated style is
`transform: [{ translateX: txAV }, { translateY: tyAV }, { scale: scaleAV }]`
(line 461) — every one of which the native driver supports.

**What the user does:** pinches, swipes or double-taps a tube spec card in the
full-screen viewer, then lets go. The **settle** (spring back to fit, snap to
scale, swipe rebound) is computed frame-by-frame in JS and pushed across on
every frame. During the drag itself the values come from `PanResponder`
`setValue` calls (line 253), so that half is JS-bound regardless — but the
release animation, which is the part with momentum and the part the eye
follows, does not need to be.

This is a member-only feature that is, per the project notes, not yet
device-tested. Worth flipping to `useNativeDriver: true` before it is.

**Elsewhere:** the other 19 `useNativeDriver: false` sites I checked animate
width, SVG geometry or colour, which genuinely cannot use the native driver.
`src/screens/careerfinder/kit.tsx:134` and `EnrollmentScreen.tsx:182,192` drive
layout `width` — a `scaleX` on a full-width bar would move those to the native
driver too, but that is a redesign, not a fix.

---

## G11. A Realtime WebSocket is opened at boot for every launch, including signed-out ones

**Severity:** MINOR **Confidence:** high

**Where:** `src/features/account/SingleDeviceGuard.tsx:115-130`, inside a
`useEffect(…, [])` with no session guard.

```ts
channel = supabase
  .channel('active_device_watch')
  .on('postgres_changes', { event: '*', schema: 'public', table: 'active_device' }, () => void check())
  .subscribe();
```

Every cold start opens a Realtime socket and joins a topic — even for a guest
or a signed-out user, who has no `active_device` row and for whom the channel
can never deliver anything. It adds a WebSocket handshake to the boot burst
(competing with the entitlement query, the curriculum fetch and the card-art
prefetch) and keeps a heartbeat running for the life of the process.

**What should happen:** move the subscribe inside the branch that already knows
there is a real account, and tear it down on sign-out. Cheap; mostly a battery
and boot-contention win rather than a visible one.

---

## G12. ~410 KB of browser-only Sentry code ships in the native bundle

**Severity:** MINOR — "wasteful but invisible", included for completeness
**Confidence:** high (read straight off the shipped bundle's source map)

```
299.2 KB  @sentry-internal/replay
 76.3 KB  @sentry-internal/feedback
 31.6 KB  @sentry-internal/replay-canvas
```

`telemetry.ts:63` is explicit that Session Replay is deliberately never added —
these arrive through `@sentry/react-native`'s re-export of `@sentry/react` →
`@sentry/browser`. They are DOM-dependent and cannot execute on React Native.
Roughly 410 KB of the 18.4 MB bundle that is dead on arrival.

Not worth touching before launch: the fix is import-surgery on a third-party
barrel export, which is exactly the kind of change that trades 400 KB for a
crash-reporting regression. Noted so it is not rediscovered.

---

## G13. Confirming the standing meter-responsiveness item, with numbers

Not a new finding — this is the owner's existing *"live meters must bypass React
state"* rule. Adding the measurement so the remaining scope is visible.

`src/features/tools/engine/useDspEngine.ts:63` sets `POLL_MS = 66` (~15 Hz) and
lines 160-168 do:

```ts
timer.current = setInterval(() => {
  setFrames({ meter: …, bands: …, pitch: …, waveform: p.waveform ? ApeDsp.getWaveform() : [] });
}, POLL_MS);
```

A `setFrames` with a **fresh object** 15 times a second re-renders the whole
screen 15 times a second. The heaviest consumer is
`src/screens/tools/MultiMeterScreen.tsx:401-404`, which asks for
`meter + bands + pitch + waveform` simultaneously — so 15×/s it marshals a full
waveform array across the bridge, allocates a new object, and repaints a
97 KB screen. `RtaScreen`, `WaveformScreen`, `SpectrogramScreen`,
`FrequencyCounterScreen`, `Rt60Screen` and `HarmonicsView` are on the same path.

The hook's own comment (lines 147-151) already states the correct pattern and
says lifecycle-only consumers must not "eat a 15 Hz whole-screen re-render" —
`SplMeterScreen` is the one that was converted. The rest were not. Consistent
with what the owner already knows; flagged so the scope is six screens, not one.

---

# Things I checked and found healthy

Stating these explicitly so the next pass does not spend tokens re-deriving
them. Several are places I expected to find problems and did not.

- **Splash itself** (`SplashScreen.tsx`) — the session read is kicked off
  *before* the 2.5 s timer and awaited at the timer, so it resolves during the
  hold rather than after it; it has a rejection catch, a 5 s hang race, and a
  cancel guard. Nothing competes with the intro from inside this file. The
  competition is all upstream of it (G5, G6).
- **Splash logo** — `BrandLogo` uses the 768² **webp** (76 KB), not the 1.7 MB
  PNG beside it, with `resizeMode="contain"` at 225 pt. Correctly sized.
- **Card-art warming** (`CourseSelectionScreen.tsx:347-365`) — already fixed:
  five immediate prefetches, the other 21 staggered at 3 s + 250 ms apart, with
  a module-level once-guard. The comment records the exact regression this
  solved.
- **Curriculum fetch** (`data/v3Curriculum.ts:50-70`) — session-memoised, with a
  failure deliberately *not* cached so Retry refetches. The "every screen
  refetches 166 rows on focus" bug is fixed.
- **Academy hero stats** (`features/curriculum/academyStats.ts`) — AsyncStorage
  cache for instant paint, background RPC refresh. Textbook.
- **Cymatics modal-library JSON** (`features/cymatics/modalLibrary.ts:185-205`) —
  eight ~220 KB shape files `require`d lazily inside `loadLibraryShape`, cached.
  1.7 MB correctly kept off the boot path.
- **Glossary screen** — `useDeferredValue` on the search box; the term list, the
  held-chip list and the bookmark popup are all `FlatList`s with `keyExtractor`,
  `initialNumToRender`, `maxToRenderPerBatch` and `windowSize`; `extraData` is
  stabilised. For the biggest data set in the app, this screen is the best-tuned
  one in it.
- **Tools hub** (`ToolsHubScreen.tsx:940-990`) — per-tile viewport gating by
  geometry (state changes only when the visible *set* changes), plus
  `InteractionManager` + a 350 ms guaranteed fallback so the heavy SVG/skin art
  never renders during the open transition.
- **Dashboard** (`DashboardScreen.tsx:958-980`) — the deck/ordering `useMemo`
  was already tightened in the 2026-09-09 launch audit; the quiz glow loop is
  native-driver and honours reduce-motion; the focus reload is deferred behind
  `runAfterInteractions`. Its one remaining problem is G1, which lives in the
  API layer, not the screen.
- **Achievements gallery** (`achievements/GalleryScreen.tsx:110-121`) — windowed
  `FlatList`, `keyExtractor`, `numColumns`. The right way to show the 1024²
  tiles, and the counter-example to G4.
- **Nav-bar fader animation** (`components/nav/NavIcon.tsx:116-165`) — runs
  forever, but transform-only, native-driver on device, reduce-motion aware,
  with a module-scope guard so a remount cannot multiply the excursions. Costs
  battery, not frames; leaving it alone.
- **Dev-only web preview harnesses** — 28 modules / 194 KB of `*Preview.tsx`
  reach the production Android bundle. Real, and small enough not to matter.
- **Career index** (`features/careerfinder/careerIndex.ts:62-82`) — the
  1,898-career decode is lazy and memoised; only `CAREER_COUNT` and the version
  string are read at module scope.

---

# Coverage

**Read in full or in the relevant part:** `index.ts`, `App.tsx`,
`metro.config.js`, `app.json`, `src/navigation/RootNavigator.tsx`,
`MainTabs.tsx`, `AchievementsStack.tsx`, `SplashScreen.tsx`,
`components/BrandLogo.tsx`, `components/TrophyImage.tsx`,
`components/nav/NavIcon.tsx`, `theme/tokens.ts`,
`features/telemetry/telemetry.ts`, `features/commercial/EntitlementProvider.tsx`,
`features/account/SingleDeviceGuard.tsx`, `features/audio/AudioOutputGate.tsx`,
`features/dashboard/api.ts`, `features/curriculum/curriculumStats.ts`,
`features/curriculum/academyStats.ts`, `features/enrollment/enrollmentProgress.ts`,
`features/study/localProgress.ts`, `features/notifications/curatedTermLists.ts`,
`features/notifications/localSchedule.ts` (imports), `features/intro/screenIntros.ts`,
`features/tools/engine/useDspEngine.ts`, `features/cymatics/{figure,patternField,modalLibrary}.ts`,
`data/v3Curriculum.ts`, `data/topicImages.ts`, `features/careerfinder/careerIndex.ts`,
`screens/courses/CourseSelectionScreen.tsx`, `screens/curriculum/CurriculumScreen.tsx`,
`screens/awards/AwardsScreen.tsx`, `screens/enrollment/EnrollmentScreen.tsx`,
`screens/dashboard/DashboardScreen.tsx` (perf paths),
`screens/glossary/GlossaryScreen.tsx` (list + search paths),
`screens/tools/ToolsHubScreen.tsx` (gating), `screens/achievements/{GalleryScreen,TopicsScreen}.tsx`,
`screens/lab/cymatics/{GalleryScreen,PatternFigure}.tsx`,
`screens/lab/tube/TubeCardScreen.tsx`, `screens/careerfinder/CareerFamilyScreen.tsx`,
`screens/study/FlashcardsScreen.tsx` (regex + list paths).

**Swept across the whole tree:** module-scope side effects and `void hydrate()`
patterns; top-level computed constants; `new RegExp` construction sites;
`useNativeDriver: false` (26 sites); `Animated.loop` without a focus/AppState
gate (16 files); `FlatList` without `keyExtractor` (4 files); `getAllKeys`
(6 sites); `setInterval` across tools; `<Image>` without `resizeMode`; every
JSON > 20 KB in `src/`; every asset directory by size.

**Measured, not estimated:**
- The shipped Android Hermes bundle and its source map — module count, byte
  split, largest modules.
- The static import graph from `App.tsx` (840/855 modules, 13.89 MB).
- Expo's `inlineRequires` default, read from the installed package.
- `patternGeometry` + `figureLayers` timing, by running the real modules under
  `node --test` with the project's own resolver hook (temporary file, removed;
  `git status` is clean of my work).
- `careerIndex.json` parse cost and the curated-list `clean()` cost.
- `assets/topic-images-webp`: 166 files, 33.30 MB, median 202 KB.
- Bravura.otf: 889,260 bytes, the largest asset in `dist/assets`.

**Not covered, and why:**
- **On-device wall-clock.** Everything here is static analysis plus desktop
  microbenchmarks. Two cold-start numbers would sharpen G6 enormously and I
  said exactly how to get them.
- **Native/DSP performance.** The ape-dsp module, audio buffer sizing and Skia
  draw cost are below the JS layer I can read. The `false clipping is native`
  item in the project notes lives there.
- **Server-side query plans.** G1 and G2 are client-side *shapes* — how long
  those queries take in Postgres, and whether a Max-rows cap is already set,
  needs the live project.
- **Bundle-level tree-shaking.** I did not try to work out what else in the
  9.6 MB of `node_modules` is dead beyond the Sentry browser packages.
- **Leaks and teardown** — pass 2's axis, deliberately avoided.
