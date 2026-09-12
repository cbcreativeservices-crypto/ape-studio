# Wave 1 audit — Load / Ready times & Button latency

Read-only audit for launch-readiness. Focus: screen mount cost, image
readiness, audio-tool open time, and tap→feedback latency. Every finding below
is grounded in a file:line that was actually read.

Overall the **audio-tool open path is already well engineered** — warm shared
mic session, `InteractionManager.runAfterInteractions` deferral of the native
start, a 12 s watchdog, and a 1.5 s fallback so the tool never parks on
"Starting…" (`src/features/tools/engine/useDspEngine.ts`). The biggest wins are
in **oversized bundled images decoded at mount** and a couple of **image-cache /
warming gaps** where remote art is loaded cold.

## Top 5 highest-impact

1. **Oversized PNG lab/glossary/calc backgrounds decoded on mount** (2.2–2.7 MB each; AudioLearning mounts ~5.3 MB of them) — Cat 2.
2. **1.6 MB brand-logo PNG on the Splash screen** — the very first frame at boot — Cat 2.
3. **2.8 MB `vu_skin_spl.png` decoded when the SPL meter opens** — Cat 2.
4. **`TrophyImage` (topic tiles + trophies) uses plain RN `Image`** — none of the expo-image cache-policy / force-cache / retry hardening that `CardArt` was rewritten to add; re-fetches each launch and one failure = permanent blank — Cat 2.
5. **Splash gates on a hard 2500 ms timer, then awaits `getSession()`** before it can route — first interactive screen = 2.5 s + a network round-trip — Cat 4.

Auto-fixable: 5 of the 11 findings (see each).

---

## Category 1 — Screen mount cost

### [Sev: med] Preview-only screens are eagerly imported at app boot
`App.tsx:15-34` (e.g. `Spl3dGaugePreview`, `ToolPreview`, `SamplerPreview`,
`ProfilePreview`, `SettingsPreview`, `NotifySchedulePreview`, `CableArtPreview`,
plus `MicPrinciplesLabScreen`, `CalcWorkspaceScreen`, `CalcLabScreen`,
`CableInstallLabScreen` and the six `CareerFinder*` screens).
- **Why it hurts:** these are referenced ONLY inside `__DEV__ && Platform.OS === 'web'`
  hash-preview branches (`App.tsx:193-296`), but the static `import`s at the top
  of `App.tsx` still pull every one of those modules (and their transitive
  Skia/SVG/DSP deps) into the boot module graph and run their top-level code on
  device in production, where the branches are dead.
- **Fix:** load the preview screens through a `__DEV__`-guarded `require()` inside
  the web-preview branch (or a separate dev entry file) so production never
  evaluates them. The real navigable screens (CareerFinder/Calc) still load via
  `RootNavigator` when navigated to.
- `auto_fixable: yes` (mechanical: swap the preview-only `import`s for guarded requires)

### [Sev: low] 237 KB of career JSON parsed when the Curriculum tab module loads
`src/features/careerfinder/careerIndex.ts:13-14` imports `careerIndex.json`
(216 KB) + `careerFamilies.json` (21 KB); `src/screens/curriculum/CurriculumScreen.tsx:25`
imports this module at top level just for `CAREER_COUNT` and `familyFieldOf`.
- **Why it hurts:** Metro embeds the JSON and it is `JSON.parse`d at module eval.
  The heavy title decode is correctly lazy (`all()` at `careerIndex.ts:64-85`),
  but the raw parse still happens the moment the Curriculum tab (or any Career
  Finder screen) is first loaded.
- **Fix:** acceptable as-is, but if Curriculum mount ever feels heavy, expose
  `CAREER_COUNT`/`familyFieldOf` from a tiny metadata module that doesn't pull
  the full 1,902-title array.
- `auto_fixable: no` (needs a small data-module refactor)

### [Sev: low] Whole screen graph is imported eagerly (native-stack, no lazy)
`src/navigation/RootNavigator.tsx:12-55+` imports ~100 screen modules statically.
- **Why it hurts:** native-stack does not lazy-load; every lab/tool/screen module
  (including Skia-heavy labs) is evaluated during the first render of the
  navigator, adding to time-to-interactive.
- **Fix:** consider `React.lazy` / dynamic import for the heavy lab + tool screens
  that are not on the boot path (labs, tools, career finder). Larger change;
  measure first.
- `auto_fixable: no` (architectural)

---

## Category 2 — Image loading / readiness

### [Sev: high] 2.2–2.7 MB PNG backgrounds bundled and decoded on mount
- `src/screens/lab/AudioLearningScreen.tsx:27-28` — `training-labs.png` (2.6 MB)
  **and** `audio-fundamentals.png` (2.7 MB): ~5.3 MB decoded when the lab home mounts.
- `src/screens/glossary/GlossaryScreen.tsx:55` — `glossary.png` (2.5 MB).
- `src/screens/lab/calc/CalcLabScreen.tsx:23` — `calc-lab.png` (2.2 MB).
- **Why it hurts:** each is a full-resolution PNG `require`d and drawn as a
  full-screen background; decoding multi-MB PNGs on the UI/decoder thread costs
  memory and stalls first paint of the screen. `assets/` totals 57 MB.
- **Fix:** re-encode as WebP sized to the actual display (≈1080–1440 px wide);
  typically drops each to 150–400 KB and cuts decode time by an order of
  magnitude. No code change beyond the asset swap.
- `auto_fixable: no` (asset regeneration + native rebuild)

### [Sev: high] 1.6 MB brand logo on the Splash (first frame at boot)
`src/components/BrandLogo.tsx:12` requires `brand-logo.png` (1254×1254, 1.6 MB),
rendered at 225 px on `src/screens/SplashScreen.tsx:83`.
- **Why it hurts:** the logo is on the literal first screen; decoding a 1.6 MB
  PNG competes with font loading and JS init exactly when perceived boot speed
  matters most.
- **Fix:** ship a downscaled logo (e.g. 512×512 WebP/PNG) for `BrandLogo`; keep
  the full-res file only where a large render is genuinely needed.
- `auto_fixable: no` (asset)

### [Sev: high] 2.8 MB `vu_skin_spl.png` decoded when the SPL meter opens
`src/screens/tools/SkinnedVu.tsx:28` — `VU_SKIN = require('.../vu_skin_spl.png')`
(2.8 MB, the largest asset in the app).
- **Why it hurts:** adds decode time and memory right on the tool-open path the
  owner cares about.
- **Fix:** re-encode to WebP at the rendered size.
- `auto_fixable: no` (asset)

### [Sev: med] `TrophyImage` bypasses all the CardArt cache/retry hardening
`src/components/TrophyImage.tsx:57-68` renders remote Storage art with a plain
React-Native `<Image source={{uri}}>` — no `expo-image`, no `cachePolicy`, no
iOS `cache:'force-cache'`, no retry.
- **Why it hurts:** `CardArt.tsx:1-24,97-138` documents that the Storage buckets
  serve `Cache-Control: no-cache`, which makes iOS RN `Image` revalidate on every
  render/launch and leave a tile **permanently blank** after a single failed
  request. `TrophyImage` now backs the Dashboard current-topic art and every
  Achievements topic/trophy tile (`topicImagePath` → `TrophyImage`,
  `DashboardScreen.tsx:1402,1747`; `TopicsScreen.tsx:169`) and has exactly the
  vulnerability CardArt was rewritten to eliminate.
- **Fix:** route `TrophyImage` through the same expo-image (`memory-disk`) +
  force-cache + backoff-retry path as `CardArt` (share a common image
  component).
- `auto_fixable: yes` (self-contained component change; mirror CardArt)

### [Sev: med] Topic-tile art is never warmed ahead of the screen
`warmCardArt()` (`src/screens/courses/CourseSelectionScreen.tsx:349-367`) only
prefetches the Home carousel's `CARD_IMAGE` set. Nothing prefetches the
`topic-tiles` bucket images that the Dashboard and Achievements then load cold.
- **Why it hurts:** Home already warms its own art, so the pattern exists — but
  the next screens' remote images (current-topic tile, achievements grid) start
  downloading only when their screen mounts, so they pop in late.
- **Fix:** when Dashboard/enrollment data resolves, `Image.prefetch` (or
  expo-image prefetch) the current topic's `topicImagePath` and the visible
  achievements tiles.
- `auto_fixable: yes` (add a prefetch call on data-ready)

### [Sev: med] Achievements Gallery mounts every trophy at once (no virtualization)
`src/screens/achievements/GalleryScreen.tsx:51-96` — `ScrollView` +
`(entries ?? []).map(...)`, each entry a remote `TrophyImage` (line 83).
- **Why it hurts:** with many earned topics/certs (up to 166), all rows mount
  simultaneously, firing that many cold remote image loads and building the full
  view tree up front — mount cost grows with the user's progress.
- **Fix:** use a `FlatList`/`FlashList` grid (windowing) so only on-screen tiles
  mount and fetch. (`TopicsScreen` is mitigated because its topic rows live inside
  collapsed subject accordions — `TopicsScreen.tsx:114-119`.)
- `auto_fixable: no` (list refactor; verify layout)

---

## Category 3 — Audio-tool open time

### [Sev: low] (Positive / informational) Open path is already optimized
`src/features/tools/engine/useDspEngine.ts`:
- Warm shared mic session adopted on open (`acquireMic`, lines 125-140) so a
  return to a tool is ~0 ms instead of a cold HAL re-open.
- Native start deferred to `InteractionManager.runAfterInteractions` with a 1.5 s
  fallback so it runs after the push transition and never hangs (lines 211-243).
- 12 s watchdog converts a stuck permission/HAL open into an actionable error
  instead of an infinite spinner (lines 111-117).
- Android skips the `PermissionsAndroid.request` bridge round-trip once granted
  (lines 37-44).
No defect. The documented 5–10 s **cold** HAL open is native and not addressable
from JS; the warm-session design already hides it on subsequent opens.

### [Sev: low] Tools hub starts the mic on mount (by design)
`src/screens/tools/hubPreviewEngine.ts:1-40` — one shared engine + 12.5 Hz tick
drives the live tile previews; it is an explicit owner exemption, refcount-safe,
and tears down on blur/background. Tile tap calls `stopForNavigation()` then
`navigation.navigate(...)` synchronously (`ToolsHubScreen.tsx:811-819`) — no
await before nav, deterministic handoff. No change needed.

---

## Category 4 — Button / tap latency

### [Sev: med] Splash: hard 2.5 s timer, then a serial `getSession()` before routing
`src/screens/SplashScreen.tsx:29-61` — the `setTimeout(2500)` fires, and only
*inside* the callback does it `await supabase.auth.getSession()` before
`navigation.reset`.
- **Why it hurts:** the first interactive screen appears at 2.5 s **plus** the
  session-fetch latency, so a slow auth read pushes real boot past the intended
  hold.
- **Fix:** kick off `getSession()` immediately on mount (store the promise) and
  `await` the already-resolved result when the 2.5 s timer fires, so routing is
  instant at 2.5 s. Preserves the owner's intentional intro hold.
- `auto_fixable: yes` (run the session fetch in parallel with the hold)

### [Sev: low] Home carousel refetches session + rebuilds catalog on every focus
`src/screens/courses/CourseSelectionScreen.tsx:1047-1130` — `load()` runs on
every `useFocusEffect`, doing `supabase.auth.getSession()` + `getPublicCatalog()`
+ a `.map().sort()` over the field topics (lines 1083-1087).
- **Why it hurts:** returning to Home (a very common navigation) re-awaits the
  session and rebuilds the deck each time; the card grid can flash/rebuild.
  `getPublicCatalog` falls back to a bundled seed so it is not a network block,
  and `warmCardArt` is idempotent.
- **Fix:** cache the built catalog for the session (as the glossary loaders do at
  `GlossaryScreen.tsx:79-89`) and only rebuild when entitlement/session actually
  changes.
- `auto_fixable: no` (needs a small caching layer + invalidation)

---

## Counts
- high: 3 · med: 5 · low: 3 (total 11)
- auto_fixable: 5 (App.tsx preview requires, TrophyImage cache path, topic-tile
  prefetch, Splash parallel getSession, plus the warming addition)
