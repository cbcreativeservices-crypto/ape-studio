# Bug hunt — Pass 1: state, persistence, offline, React correctness

**Date:** 2026-09-17
**Branch:** audio-tools-engine
**Scope:** `src/` — hook order, async-after-unmount, stores/AsyncStorage, offline replay, effect dependencies.

**Baseline:** every file cited below was read at or after `213736bd` (the Dashboard hook fix) and verified clean of working-tree modifications at the time of reading, so the line numbers are accurate. Note that another session was committing to this branch concurrently (HEAD moved to `41efaded` during the audit) and had modified `Celebration.tsx`, `RootNavigator.tsx`, `types.ts`, `QuizScreen.tsx`, `CelebrationScreen.tsx` and two edge functions in the working tree. **None of those files carries a finding**, but re-check line numbers in `QuizScreen.tsx` and `Celebration.tsx` if you act on the "clean" notes about them.

## Coverage

**840 source files scanned** (`src/**/*.ts`, `src/**/*.tsx`, excluding `.d.ts`). Of those, **459 contain hook usage** and were analysed function-by-function.

The hook-order audit was **not** done by grep. I wrote a TypeScript-compiler-API analyser that parses every file, walks every function-like scope (declaration, expression, arrow, method), and for each scope records the source position of every hook call and every `return` at that same scope — not descending into nested function scopes, so callbacks are analysed as their own scopes rather than confused with their parent.

**The analyser was validated three ways before I trusted its output:**

1. **Against the known bug.** Run against `DashboardScreen.tsx` at commit `213736bd^` (pre-fix), it reports exactly the real defect: `useMemo` at L1328 after the early return at L1141. That is the bug the owner found by hand today.
2. **Against a synthetic file** containing all seven violation shapes — hook after early return, hook in an `if` block, hook in a ternary, hook behind `&&`, hook in a `.map()` callback, hook after an early return inside a *custom hook*, and hook after a `switch`-case return. All seven were caught, and a correctly-written control component produced no finding.
3. **False positives were eliminated, not ignored.** The first run produced 37 candidates; 35 were the pattern `return useSyncExternalStore(...)`, where the hook is *inside* the return expression and is therefore not "after" it. I fixed the analyser to exclude hooks contained within a return's source span rather than hand-waving them away.

`npx tsc --noEmit` passes clean (exit 0) and `npm test` reports **1429 passing, 0 failing** across 210 suites — which is the point: **every finding below is invisible to tsc and to the test suite.**

⚠️ **One caveat on any grep-based audit of this repo, including parts of this one.** `src/features/lab/LabAudioPlayer.ts` contains a literal NUL byte, so ripgrep (and therefore the `Grep` tool) classifies it as binary and **skips it entirely** — searches return zero hits rather than an error. See **F18**. The AST passes in section 1 read every file directly off disk and were unaffected, but keyword greps used elsewhere in this audit would have missed that file.

---

# 1. Hook-order audit (complete)

## Result: no live hook-order crash remains in `src/`.

After validation, the analyser reports **two** flagged sites across 459 hook-using files, plus three fixed-count loops that it correctly did not flag. I read all five. None is a live crash. The DashboardScreen fix appears to have been the only real instance.

| File | Scope | Early return | Hook(s) after / conditional | Verdict |
|---|---|---|---|---|
| `src/features/intro/FirstRunCoordinator.tsx` | `FirstRunCoordinator` L44 | L47 `if (!FIRST_RUN_ENABLED) return null` | 11 hooks, L48–L66 | **Safe today, latent landmine** — see F7 |
| `src/screens/lab/wave/vizWave.tsx` | `PulseNodes` L771 | — | `useDerivedValue` L788 inside `for` loop L785 | **Safe** — bound is `NODE_BUCKETS = 24`, a module constant |
| `src/screens/lab/digital/vizChain.tsx` | `buildStrip` L360 | — | `useDerivedValue` L362 in a plain function | **Safe** — called exactly 3×, unconditionally (L425–427) |
| `src/screens/lab/foundations/viz.tsx` | `makeSide` L1435 | — | `useDerivedValue` L1437, L1453 | **Safe** — called exactly 2×, unconditionally (L1465–1466) |
| `src/screens/lab/cableinstall/scenes/KnowScene.tsx` | `TypeCard` L221 | L225 | `useLabel` L232, L240 | **Not a hook** — `useLabel` is a plain string helper, misleadingly named |

### Where I checked and found nothing

- **Every `use*` call in every function scope in all 459 hook-using files.** No hook is called after a top-level early return anywhere except the FirstRunCoordinator case above.
- **No hook is called inside an `if`, ternary, `&&`/`||`, `switch`, `try/catch`, or variable-bound loop** anywhere in `src/`. The only loop-bound hook is `vizWave`'s, bound by a module constant.
- **No React hook is called from a non-component scope.** A separate pass checked every hook call's nearest enclosing function and flagged any whose scope was not a component, a custom hook, or a `memo`/`forwardRef` wrapper. Zero real React hooks were found in `.map()` callbacks, event handlers, or `useMemo` bodies — the only three hits were the deliberate fixed-count helpers listed above.
- **`useSyncExternalStore` `getSnapshot` stability.** All 20 call sites return a stable module-level reference (`() => current`, `() => state.frame`). None constructs a fresh array/object per call, so none can produce the "getSnapshot should be cached" infinite render loop. `timeTrial.ts` documents this requirement explicitly.

This section is complete. The remaining findings are state/persistence defects, and several are worse than the hook bug was.

---

# 2. Findings

Index, most severe first. Numbering is stable for reference; read top-to-bottom for priority.

| # | Severity | Finding | Where |
|---|---|---|---|
| F1 | **blocker** | Queued offline quiz/exam permanently deleted on any non-network error | `quiz/api.ts:244`, `finalExam/api.ts:279` |
| F2 | **blocker** | Exam queue destroys the whole queue when one byte is corrupt | `finalExam/api.ts:225` |
| F3 | **blocker** | "Your exam is saved" can be a false promise | `finalExam/api.ts:234` |
| F4 | serious | Visiting Enrollments after a cold start can wipe the Home carousel | `homeCardsStore.ts:114` |
| F5 | serious | Corrupt local enrollment is pushed to the server | `enrollmentStore.ts:126` |
| F6 | serious | Logout mid-fetch re-seeds the dashboard cache with the previous user's data | `DashboardScreen.tsx:841` |
| F9 | serious | Glossary term keeps speaking after the user closes it | `SpeakButton.tsx:59` |
| F10 | serious | One member's private messages render under another member's name | `RequestsView.tsx:373` |
| F11 | serious | Art Studio autosave can save an older artwork over a newer one | `GalleryArt.tsx:88` |
| F14 | serious | Free user can save a measurement and get a false "SAVED ✓" | `SplMeterScreen.tsx:1263` |
| F18 | serious* | `LabAudioPlayer.ts` holds a NUL byte — invisible to every text search | `LabAudioPlayer.ts` |
| F7 | minor | FirstRunCoordinator's early return sits above eleven hooks (latent) | `FirstRunCoordinator.tsx:47` |
| F8 | minor | Concurrent dashboard loads replay a queued submission twice | `DashboardScreen.tsx:722` |
| F12 | minor | Directory search shows results for superseded filters | `ExploreView.tsx:72` |
| F13 | minor | Partial guards and unguarded fetches (consolidated) | various |
| F15 | minor | Mix audio keeps playing over a pushed screen | `mixing/kit.tsx:238` |
| F16 | minor | Stale `assetKey` freezes clip-end detection (latent) | `LabAudioPlayer.ts:88` |
| F17 | minor | Image-retry latch never resets in recycled lists | `CardArt.tsx:78` |

\* F18 is a process defect rather than a runtime bug, but it is ranked serious because it silently blinds every grep-based review of this repo.

**The three blockers are one bug family:** the offline submission path for graded work loses data on transient failure, on corruption, and on a failed write — and tells the learner it succeeded in all three cases. They share a fix surface and should be done together.

**Two findings are honesty bugs rather than crashes** — F3 ("your exam is saved") and F14 ("SAVED ✓") both tell the user something succeeded when it did not. Worth grouping mentally, because both erode trust in exactly the way the calculator-accuracy standard exists to prevent.

---

## F1. A queued offline quiz or exam is permanently deleted on any non-network error

**Severity:** blocker
**Where:** `src/features/quiz/api.ts:244-250`, `src/features/finalExam/api.ts:279-286`

**What happens:** A learner finishes a quiz or the final exam with no connection. They are told it is saved and will submit automatically. On reconnect, the replay hits any error that is not literally the words "network" or "fetch" — an expired JWT after a long offline stretch, a 503/504, a statement timeout, a rate limit, an aborted request on a flaky reconnect — and the completed, graded attempt is **silently deleted**. No notification. The learner simply finds the topic still unpassed, with no way to recover the attempt. For `finalExam` this is the credential-awarding capstone.

**Why:** Both replay loops treat "not a network error" as "permanently rejected, drop it":

```js
// quiz/api.ts:245
if (/network|fetch/i.test((e as Error).message)) break; // still offline
console.warn('[quiz] dropping rejected queued submission:', (e as Error).message);
deleteQueuedSubmission(r.attempt_id);
```

The premise — "a hard reject means the row can't ever succeed" — is false, because the regex cannot distinguish a permanent rejection from a transient one. The codebase already knows this regex is too narrow: **`src/features/study/sync.ts:38` uses a materially broader test for the exact same job**:

```js
return /network|fetch failed|Failed to fetch|timeout|abort/i.test(msg);
```

So `timeout` and `abort` — the two most common flaky-reconnect failures — are correctly retried for *study progress*, the least valuable data in the app, and cause **permanent deletion of a graded capstone exam**. The protection is inverted relative to the stakes.

**Fix:** Invert the default: keep the row unless the server returns a known-permanent rejection.
1. Share one `isNetworkError` helper (the broad `sync.ts:38` version) across all three queues.
2. Drop a row only on an allow-list of terminal server codes (e.g. `attempt_not_found`, `attempt_already_finalized`).
3. Add an `attempts` / `last_error` column and drop only after N failures, so a genuinely poisoned row cannot wedge the queue forever.
4. When a row *is* dropped, tell the user — this is their exam, and it currently vanishes with only a `console.warn`.

---

## F2. The exam queue destroys the whole queue when one byte is corrupt

**Severity:** blocker
**Where:** `src/features/finalExam/api.ts:225-240`

**What happens:** If the queued-exam blob in AsyncStorage is damaged, every queued capstone exam is silently discarded and then permanently overwritten with an empty list.

**Why:** `readQueue()` swallows a parse failure and returns `[]`:

```js
async function readQueue(): Promise<QueuedExam[]> {
  try {
    const raw = await AsyncStorage.getItem(QUEUE_KEY);
    return raw ? (JSON.parse(raw) as QueuedExam[]) : [];
  } catch { return []; }
}
```

`[]` is indistinguishable from "queue is empty". `replayExamSubmissions()` then calls `writeQueue(remaining)` and `enqueueExamSubmission()` does read-modify-write — either of which **overwrites the still-recoverable damaged blob with `[]`**. The evidence is gone.

This is squarely against the repo's own documented idiom. `src/features/cymatics/patternStore.ts:219-245` and `src/features/production/projectStore.ts` both do it correctly: damaged rows are moved aside under a `:damaged` key and never destroyed, and the header comments say so in as many words. The exam queue — the highest-stakes collection in the app — is the one that does not follow it.

**Fix:** Apply the `patternStore` `loadList` pattern to the exam queue: on a parse failure, copy the raw blob to `${QUEUE_KEY}:damaged` before clearing, and validate row-by-row so one bad row does not condemn its siblings. Distinguish "read failed" from "empty" in the return type so callers never overwrite on the strength of a failed read.

---

## F3. "Your exam is saved" can be a false promise

**Severity:** blocker
**Where:** `src/features/finalExam/api.ts:234-240`, message at `src/screens/exam/FinalExamScreen.tsx:149-152`

**What happens:** The learner finishes the capstone offline and is told:

> "Your exam is saved and will be submitted automatically when you reconnect. Your finish time is preserved."

If the write failed, none of that is true and the exam is already gone when the dialog appears.

**Why:** `writeQueue` swallows every storage error and returns `void`, so `enqueueExamSubmission` cannot fail and the caller shows the reassuring message unconditionally:

```js
async function writeQueue(rows: QueuedExam[]): Promise<void> {
  try { await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(rows)); }
  catch { /* storage full / unavailable — nothing further we can do here. */ }
}
```

Storage exhaustion is not hypothetical on this app — the SQLITE_FULL incident of 2026-09-11 is cited in `quiz/api.ts:135` as the reason the *start* path is defensively guarded. The same failure mode here costs the exam rather than the resume.

Note the asymmetry with the quiz queue, which is SQLite-backed and writes synchronously per row — so the quiz path is materially safer than the exam path. The capstone has the weaker storage.

**Fix:** Make `writeQueue` return `boolean` and have `enqueueExamSubmission` propagate it. On failure, do **not** claim the exam is saved — keep the learner on the screen with the answers in memory and offer retry, which is the one moment the data still exists.

---

## F4. Visiting Enrollments after a cold start can wipe the user's Home carousel

**Severity:** serious
**Where:** `src/features/home/homeCardsStore.ts:41-67, 114-121`; triggered from `src/screens/enrollment/EnrollmentScreen.tsx:634-640`

**What happens:** A user who has customised their Home cards (up to 20) and holds any certificate or program opens the Enrollments screen after a cold start. Their Home carousel is replaced by just the core-course cards. Their arrangement is gone from storage.

**Why:** A hydration race with a destructive write.

`homeCardsStore` never hydrates at module load — unlike `deckOrderStore`, which does exactly that at its line 50. It hydrates lazily, only when a *reader* (`getHomeGs`, `isOnHome`) is called, and those readers kick off `void hydrate()` and immediately return the current in-memory `list` without awaiting it.

The mutators are worse: `ensureHome`, `removeHome`, `toggleHome` and `setHomeGs` **never call `hydrate()` at all**. They mutate the module-level `list` and persist it immediately.

`EnrollmentScreen` runs this on mount:

```js
useEffect(() => {
  for (const gs of COREQ_TOPIC_GS) {
    const done = (prog.get(gs)?.pct ?? 0) >= 100;
    if (hasCredential && !done) ensureHome(gs);
    else removeHome(gs);
  }
}, [hasCredential, prog]);
```

Effects run synchronously after commit, while the `AsyncStorage.getItem` started during render is still pending. So `list` is `[]`, `ensureHome(gs)` appends to nothing, and `persist()` writes `[gs]` over the user's real list. The in-flight hydrate then resolves with the pre-write value and assigns `list = [...]` wholesale, so memory and storage now disagree and the next mutation persists whichever won. The outcome is non-deterministic, which is why it will reproduce intermittently rather than never.

**Scope — this is precisely bounded.** I enumerated every persisted-store mutator that is invoked automatically from an effect (rather than by a user tap, which happens long after hydration). There are exactly four in the whole app, all in `EnrollmentScreen`:

| Site | Call | Pre-hydration behaviour |
|---|---|---|
| L295 | `pruneInvalidGs()` | safe — guarded by `if (valid.size === 0) return 0`, and computes `removed === 0` on an empty list, so it never commits |
| L622 | `setActiveMany()` | safe — maps over an empty list, `changed` stays false, never commits |
| L638 | `removeHome()` | safe — early-returns when the gs is absent, which it always is on an empty list |
| **L637** | **`ensureHome()`** | **destructive — appends to `[]` and persists, overwriting the stored list** |

`ensureHome` is the only mutator in the app that *adds* on a pre-hydration read, and adding is the one operation an empty list does not make a no-op. So this is a single-site bug, not a sprawling class — which makes it cheap to fix with confidence.

Note also that only 2 of the 10 persisted stores (`deckOrderStore`, `popupSuppressStore`) hydrate at module load. The other eight are safe today only because nothing writes to them before a user interaction. That is an accident of current call sites, not a property of the design.

**Fix:** Two changes, both small:
1. Call `void hydrate()` at module load, matching `deckOrderStore:50`.
2. Make every mutator hydration-safe — `if (!hydrated) { void hydrate().then(() => ensureHome(gs)); return; }` — so no write is ever computed from a pre-hydration default. Having `hydrate()` merge into `list` rather than overwrite it would also remove the second half of the race.

---

## F5. Corrupt local enrollment data is pushed to the server, unenrolling the user everywhere

**Severity:** serious
**Where:** `src/features/enrollment/enrollmentStore.ts:111-160` (catch at L126), `commit()` at L166-171

**What happens:** If the local enrollment blob is damaged, the user silently becomes enrolled in nothing — and the empty list is then **synced to the backend**, so the loss follows them to every device rather than being repaired by one.

**Why:** Hydration treats corruption as emptiness:

```js
} catch {
  // corrupt/absent → start empty
}
...
list = loaded;   // []
```

`commit()` calls both `persist()` and `scheduleServerSync()`, so the first subsequent mutation propagates the empty list upstream. `scheduleServerSync` sends the local list verbatim as the authoritative master:

```js
const { error } = await supabase.rpc('sync_my_enrollments', {
  p_items: list.map((e, i) => ({ gs: e.gs, favorite: e.favorite, active: e.active, position: i })),
});
```

With `list === []` that is an RPC whose meaning is "I am enrolled in nothing." The severity is set by the comment three lines above it in the same file: **"backend gates v3 study/quiz on this list."** So a single damaged local byte does not merely blank one device's menu — it can revoke the user's access to their own study and quiz content on *every* device, and the local copy that could have repaired it was overwritten in the same breath.

This is the same destroy-don't-quarantine defect as F2, but with a server-replication multiplier — and again it contradicts the `patternStore` idiom used elsewhere in the same codebase.

**Fix:** Distinguish "read failed" from "genuinely empty". On a parse failure, quarantine the raw blob under `${KEY}:damaged`, and **suppress `scheduleServerSync()`** until a known-good local state exists — never let a failed read overwrite good server state. Prefer server reconciliation over local truth when the local read failed.

---

## F6. Logging out mid-fetch re-seeds the dashboard cache with the previous user's data

**Severity:** serious
**Where:** `src/screens/dashboard/DashboardScreen.tsx:841-842`

**What happens:** User A signs out (or switches accounts) while the Dashboard is still fetching. User B signs in and lands on the Dashboard — and for a moment sees **user A's topics, progress and deck**, rendered instantly from cache before B's own fetch replaces it.

**Why:** A one-line ordering mistake. The cache write sits *above* the unmount guard:

```js
setDashboardCache(d, idx); // instant landing next time (owner 2026-08-17)
if (!mountedRef.current) return; // unmounted mid-fetch — don't setState
```

Sign-out calls `clearLocalAccountData()` → `resetDashboardCache()` (`clearLocalAccountData.ts:126`), which nulls the cache. But the in-flight fetch belonging to A's session then resolves and calls `setDashboardCache(d, idx)`, re-populating the module-level cache *after* the wipe. The Dashboard seeds its initial state straight from that cache:

```js
const [data, setData] = useState<DashboardData | null>(() => getDashboardCache()?.data ?? null);
```

so B mounts on A's data.

This breaks an invariant the cache file itself declares in its header:

> "Cleared on sign-out/account-switch via resetAllLocalStores() **so a new account can never flash the previous user's dashboard**."

The guard on the very next line proves the author anticipated exactly this unmount-during-logout scenario — the `setState` calls are protected; the cache write simply ended up one line too early. Note this is the *only* consequential instance of the async-after-unmount class I found, because under React 18 a late `setState` is a silent no-op — the damage here comes from writing to module-level state that outlives the component.

**Fix:** Move `setDashboardCache(d, idx)` below the `mountedRef` guard. Better still, stamp the cache with the user id it was fetched for and have `getDashboardCache()` return `null` when that id does not match the current session — so the invariant is enforced by the cache rather than by statement order in a 2,850-line component.

---

## F7. FirstRunCoordinator's early return sits above eleven hooks

**Severity:** minor (latent — correct today)
**Where:** `src/features/intro/FirstRunCoordinator.tsx:47`, hooks at L48-L66

**What happens:** Nothing today. I am reporting it because it is the exact shape of the bug that crashed the Dashboard, and it is one keystroke from becoming live.

**Why:** The guard is a module-level constant, so it is the same on every render and the hook count never varies (always zero):

```js
const FIRST_RUN_ENABLED = false;   // module scope
...
export function FirstRunCoordinator() {
  if (!FIRST_RUN_ENABLED) return null;
  const { complete, visited, hydrated } = useOnboardingFlow();   // + 10 more hooks
```

The in-file comment correctly reasons this through. The hazard is the adjacent instruction to *"Flip back to `true` to re-enable"* — and more so any future change that makes the condition dynamic (a flag read, a prop, an entitlement check). The moment the guard depends on anything that can change between renders, all eleven hooks become conditional and the screen throws "Rendered more hooks than during the previous render," exactly as the Dashboard did.

**Fix:** Move the guard below the hooks (`if (!FIRST_RUN_ENABLED) return null;` immediately before the JSX), or split into a thin wrapper that returns `null` and an inner component holding the hooks. Either makes the parked state structurally safe rather than safe-by-coincidence.

---

## F8. Concurrent dashboard loads can replay the same queued submission twice

**Severity:** minor
**Where:** `src/screens/dashboard/DashboardScreen.tsx:722, 729`; triggers at L868, L879, L892, L904

**What happens:** The learner can see the "Offline exam submitted — Credential awarded." notification twice for one exam.

**Why:** `load()` is invoked from four independent, unserialised places — a focus effect, the study-progress bus, a callback, and a mount effect — and has no in-flight guard. Two overlapping runs each call `getQueuedSubmissions()`, see the same rows, and submit the same `attempt_id`. Per the comment at `finalExam/api.ts:252-254`, a finalized attempt returns its frozen `result_payload` rather than erroring, so the second replay **succeeds** and pushes a duplicate result into the notify loop.

Data is not lost (deletion is idempotent), so this is cosmetic — but it is cosmetic on the single most emotionally loaded moment in the product.

**Fix:** Guard the replay with a module-level in-flight promise — `if (replayInFlight) return replayInFlight;` — so concurrent callers share one pass. This also removes the duplicate-submit load on the server.

---

## F9. A glossary term keeps speaking after the user closes it, and cannot be stopped

**Severity:** serious
**Where:** `src/components/SpeakButton.tsx:39-45` (cleanup) vs `:59-66` (the ordering)

**What happens:** The user taps the speaker on a glossary term while audio output is muted. The audio-enable / sound-safety dialog appears. They close the term popup (or the FlatList recycles the row) while that dialog is up. The gate then resolves and the term is **read aloud from a component that no longer exists**, with nothing able to stop it until the utterance finishes.

**Why:** The unmount cleanup is conditional on a flag that is set too late:

```js
useEffect(() => () => {
  if (mine.current) stopAllSpeech();   // mine.current is still false
}, []);
...
const ok = await requestAudioOutput();   // user closes the popup during this
if (!ok) return;
stopAllSpeech();
mine.current = true;                     // set only AFTER the await
setPlaying(true);
activeReset = reset;
Speech.speak(text, { ... });
```

At unmount `mine.current` is still `false`, so the cleanup no-ops and the safety net is defeated. There is a second effect: `activeReset = reset` parks a closure that calls `setPlaying` on the dead component in a **module-level global**, so the next `stopAllSpeech()` anywhere in the app fires a setState into it.

This violates the standing audio rule that nothing sounds from a screen the user has left, and it is exactly the kind of unstoppable auto-audio that Low-Light Production Mode exists to prevent.

**Fix:** Add a real mount flag rather than overloading the ownership flag:

```js
const mountedRef = useRef(true);
useEffect(() => () => { mountedRef.current = false; if (mine.current) stopAllSpeech(); }, []);
...
const ok = await requestAudioOutput();
if (!ok || !mountedRef.current) return;
```

---

## F10. One member's private messages can render under another member's name

**Severity:** serious
**Where:** `src/screens/directory/RequestsView.tsx:373-397`

**What happens:** The user opens conversation A, closes it, and quickly opens conversation B. If A's fetch resolves after B's, **A's private messages are displayed inside B's sheet, under B's display name in the header.**

**Why:** `load` is a `useCallback` keyed on `thread`, and the effect runs it with no cancellation token:

```js
const load = useCallback(async () => {
  if (!thread) return;
  const r = await fetchThreadMessages(thread.id);
  ...
  setMsgs(r.rows);          // no check that `thread` is still the current one
}, [thread]);

useEffect(() => { void load(); }, [load]);
```

`ThreadSheet` stays mounted across opens (stated in the comment at L383-387), so nothing unmounts to break the stale write. The adjacent comment shows the 2026-09-11 network audit fixed the *stale-retain* half of this bug — clearing `msgs` on thread change — but the *out-of-order-resolve* half was not addressed, and it is the half that shows the wrong person's messages rather than an empty list.

**Fix:** Guard the write against the thread it was issued for:

```js
useEffect(() => {
  let alive = true;
  void (async () => {
    const r = await fetchThreadMessages(threadId);
    if (!alive) return;
    ...
  })();
  return () => { alive = false; };
}, [threadId]);
```

---

## F11. Art Studio autosave can save an older artwork over a newer one

**Severity:** serious (Cymatics Phase 4, committed in `550bb53e` — fix before the device pass)
**Where:** `src/screens/lab/cymatics/GalleryArt.tsx:88-109`, with `src/features/cymatics/patternStore.ts:293-300`

**What happens:** While painting in the Art Studio, strokes can be silently lost — the chip says "Artwork saved ✓" while the file on disk is an older snapshot.

**Why:** Two compounding races. The debounce clears the *timer* but not the *promise*:

```js
const t = setTimeout(() => {
  void patternStore().saveArtwork(art).then((ok) => {
    setSaveState(ok ? 'saved' : 'failed');   // unguarded
    dirty.current = !ok;
  });
  onArtwork(art);
}, 500);
return () => clearTimeout(t);
```

Once the 500 ms timer has fired, `clearTimeout` can no longer stop anything. And `saveArtwork` is an unserialised read-modify-write of the entire artwork list (load all → splice → write all), so two overlapping saves interleave and **whichever completes last wins** — which is not necessarily the newest. The unmount-flush effect at L104-109 adds a third concurrent writer of `latest.current`, and the manual retry chip a fourth.

This matters most on exactly the device the Phase 4 pass will use: a slower disk makes a write exceed 500 ms, which is the precondition for the overlap.

**Fix:** A generation counter checked before `setSaveState`, and serialise writes inside `patternStore` by chaining each `saveArtwork` onto a module-level promise so a read-modify-write can never interleave.

---

## F12. Directory search can show results for filters the user already changed

**Severity:** minor
**Where:** `src/screens/directory/ExploreView.tsx:72-88`

**What happens:** Tapping several filter chips in sequence leaves the result grid showing results that do not match the lit chips, and the spinner clears while a newer search is still in flight.

**Why:** Only the free-text box is debounced; chip `toggle` mutates the filter set immediately and the effect fires a `searchDirectory` per change with no cancellation. The last request to *resolve* wins `setRows`/`setTotal`, and `setBusy(false)` at L75 runs on whichever finishes first.

**Fix:** A generation counter in `run`, checked before every setter.

---

## F13. Partial guards and unguarded fetches (consolidated)

**Severity:** minor
**Where:** listed below

React 18 makes a late `setState` a silent no-op, so these do not crash or warn — they matter only where two responses can land out of order, or where a timer outlives the screen. Grouped because the fix is identical and mechanical.

**Genuine partial guards** — a cancellation flag is declared but covers only some setters:

- `src/screens/awards/AwardProgressScreen.tsx:65-77, 104-107` — `alive` guards only `setLoading(false)`; `setNoSession`, `setFailed` and `setProgress` inside `load()` are unguarded, as is `onRefresh` at L115. This is the textbook shape of the class.

**Uncleared timer that outlives the screen:**

- `src/screens/lab/eartraining/EarModuleScreen.tsx:251` — the `onPlay` await path is correctly `aliveRef`-guarded, but the trailing `setTimeout(() => setPlaying(...), ms + 60)` is never cleared.

**Missing `.catch` producing an unhandled rejection:**

- `src/screens/profile/ProfileScreen.tsx:228-238` — `loadPublicProfile().then(...)` has no `.catch` and no guard, and `src/features/profile/publicProfile.ts:81` awaits `fetchMyRegistryName()` *outside* its try, so a throw escapes. Same missing guard at L205.

**Two requests in flight at boot** (re-run on entitlement resolving, no cancellation):

- `src/screens/directory/DirectoryScreen.tsx:113-129`, `src/screens/results/TrophyScreen.tsx:60-73`, `src/screens/achievements/TopicsScreen.tsx:55-69`.

**Unguarded AsyncStorage-read-then-setState** (leak only, one line each): `AwardsScreen.tsx:514`, `DashboardScreen.tsx:679`, `SplMeterScreen.tsx:635`, `CalcWorkflowEditScreen.tsx:41`, `lib/coachMark.ts:57` (no cleanup at all), `patternStore.ts:342` (`usePatterns`), `GalleryScreen.tsx:83`, `CourseSelectionScreen.tsx:1043`, `CalcWorkflowsScreen.tsx:58,104,136`, `CalcProjectsScreen.tsx:70`, `CalcResultsScreen.tsx:57`, `CalcWorkflowRunScreen.tsx:105`, `AchievementsHomeScreen.tsx:65`, `ExploreView.tsx:62`, `GlossaryScreen.tsx:1381,1424`, `SettingsScreen.tsx:130-146`, `ExportPanel.tsx:90`, `CredentialWall.tsx:74,82`.

**Polish:** `StudyFsOverlay.tsx:45-53` (a `guideKey` change mid-read applies the old key's count); `academyStats.ts:45-76` (cache read and RPC refresh both `setStats` with no ordering — if the RPC wins, the stale cached value overwrites the fresh one; add a `gotFresh` flag). `EntitlementProvider.tsx:211-220, 339-347` are unguarded but `__DEV__ && web` only, so no release exposure.

---

## F14. A free user can save a measurement and get a false "SAVED ✓"

**Severity:** serious
**Where:** `src/screens/tools/SplMeterScreen.tsx:1263-1270`, deps at `:1324`; gate at `src/screens/tools/ToolLockUi.tsx:31-47`

**What happens:** A free or anonymous user opens the SPL meter, sees the correctly greyed **🔒 SAVE LOG**, taps it — and a real record is written with a cheerful **SAVED ✓**. The membership prompt never appears. The button looks locked and behaves unlocked.

**Why:** A stale closure over the entitlement gate. `useSaveGate()` returns a **fresh object every render**, and `locked` is member-favouring until the tier resolves:

```js
export function useToolsLocked(): boolean {
  const { isMember, resolved } = useEntitlement();
  return resolved && !isMember;   // unresolved → false → unlocked
}
```

`onSaveLog` is a `useCallback` with an eslint-disable and deps that do not include the gate:

```js
}, [state, weighting, response, offset, cal]);
```

None of those change once the meter settles into `'running'`, so the callback is never rebuilt and keeps the `saveGate` object it captured — the one with `locked: false` from before entitlement resolved. Meanwhile the *label* is read fresh at render (`:1505`, `:1851`), which is exactly why the lock icon is visible while the behaviour is not locked.

Two realistic ways in: `EntitlementProvider` retries at boot (1.5 s / 4 s / 10 s), so a user who starts the meter promptly captures the pre-resolution gate; and a later `SIGNED_OUT` flips `isMember` without rebuilding the callback, so a signed-out user keeps saving for the rest of the visit.

This contradicts the owner ruling quoted in the code immediately above the bug — *"a locked user gets the membership route, never a ✓ for a record they cannot open"* — and, with payments going live, it is a paid-perk bypass rather than a cosmetic slip. I have ranked it **serious** rather than minor for that reason.

The five sibling save handlers were checked and are **not** exposed: `RtaScreen:930` and `SpectrogramScreen:395` list `frames`/`history` so they rebuild constantly, `Rt60Screen:343` is an un-memoized plain function, and `MultiMeterScreen:872` keys on `draft`. SPL is the only one.

**Fix:** Keep the memo, read the gate live:

```js
const saveGateRef = useRef(saveGate);
saveGateRef.current = saveGate;
// then inside the callback:
if (saveGateRef.current.locked) { saveGateRef.current.prompt(); return; }
```

---

## F15. Mix audio keeps playing over a pushed screen

**Severity:** minor
**Where:** `src/screens/lab/mixing/kit.tsx:238` (`useMixPlayback`), link at `:597`

**What happens:** On *Basic EQ in Context*, the user presses a variant to hear the mix, then taps **OPEN THE EQ LAB** while it is still playing. The mix keeps sounding underneath the EQ Lab, on top of whatever the EQ Lab's HEAR IT bar starts.

**Why:** `useMixPlayback`'s only teardown is an `[]`-dep unmount effect. `OpenLabLink` navigates the **root** stack, and native-stack keeps the previous screen mounted — so the cleanup never runs. I confirmed there is **no `useFocusEffect` anywhere in `src/screens/lab/mixing/`**, which is the house idiom every other lab uses for exactly this (e.g. `HarmonicsView.tsx:1492`).

Bounded — the clips are one-shot and ≤ ~10 s, and only `PageEqContext` in `pagesC.tsx` has both a player and a cross-lab link — but it is the only audible instance, and silence-on-leave is a standing rule.

**Fix:** Add the house blur-stop beside the existing effect:

```js
useFocusEffect(useCallback(() => () => {
  playerRef.current?.stop();
  setActive(null);
}, []));
```

---

## F16. Stale `assetKey` freezes clip-end detection

**Severity:** minor (latent — no consumers yet)
**Where:** `src/features/lab/LabAudioPlayer.ts:88`

**What happens:** From the second clip onward, `onEnded` never fires and `activeKey` is never cleared, so a ▶/■ transport would stick on "playing" over silence.

**Why:** The `playbackStatusUpdate` listener is registered only in the `else` branch that *creates* the player, so it is registered once ever; every later `play()` takes the `this.player.replace(...)` path. The closure's `assetKey` is therefore permanently the first clip played, while `this.activeKey` updates on every play — so the guard `this.activeKey === assetKey` is false forever after clip #1.

The sibling `earPlayer.ts:142` does this correctly. Nothing imports `useLabAudio` yet (same module as the F13 note), so this is a one-line fix to make before the first lab wires it up rather than after.

**Fix:** `if (st?.didJustFinish && this.activeKey != null) { … }`.

---

## F17. Image-retry latch never resets in recycled lists

**Severity:** minor
**Where:** `src/components/CardArt.tsx:78-83`, `src/components/TrophyImage.tsx:105`

**What happens:** In the recycled lists these components live in — Home carousel, Awards credential thumbs, Achievements gallery, dashboard trophies — an instance can permanently lose its retry ability, so a genuinely failing image shows the fallback and never recovers.

**Why:** The cleanup clears the timer but does not null the handle, while the guard tests the handle:

```js
return () => { if (timer.current) clearTimeout(timer.current); };   // not nulled
...
const retry = () => {
  if (attempt >= MAX_ATTEMPTS - 1 || timer.current) return;          // latched on
```

The inner callback that would have nulled it only runs if the timer fires — and it has just been cleared. So after a `uri` change with a retry pending (routine during recycling), `timer.current` stays truthy forever and `retry()` returns early for the life of that instance.

**Fix:** `return () => { if (timer.current) { clearTimeout(timer.current); timer.current = null; } };`

---

## F18. `LabAudioPlayer.ts` contains a literal NUL byte and is invisible to every text search

**Severity:** serious (as a process defect, not a runtime bug)
**Where:** `src/features/lab/LabAudioPlayer.ts`, offset 1616 — `` `${labKey}\0${assetKey}` `` used as a cache-key separator

**What happens:** Nothing at runtime. But `file` reports the file as `data`, and ripgrep refuses to search it:

```
$ rg -n "assetKey" src/features/lab/LabAudioPlayer.ts
binary file matches (found "\0" byte around offset 1616)
```

**Why this matters more than it looks:** ripgrep is the engine behind the `Grep` tool, so **this file is silently skipped by every grep-based audit of this repo** — including security passes, refactor sweeps, and "find every call site of X" checks. A reviewer gets zero hits and reasonably concludes the pattern is absent. It is the only such file in `src/`.

It is also the file holding F16, which is not a coincidence: a latent bug survived in the one file no text search can see.

For this audit specifically, the hook-order and async analyses were **not** affected — they read every file through `fs.readFileSync` over a directory walk, so `LabAudioPlayer.ts` was parsed and analysed like any other (and came back clean on hook order). But the keyword greps used for the store/offline sections would have missed it.

**Fix:** Replace the separator with `` (unit separator) or a plain `::`. One character, and it restores the file to every future search.

---

# 3. Areas checked and found clean

Recording these so the coverage is auditable.

- **Hook order and conditional hooks** — complete, see section 1. Only the FirstRunCoordinator landmine.
- **`useSyncExternalStore` snapshot stability** — all 20 sites stable; no infinite-loop risk.
- **`src/features/cymatics/patternStore.ts`** — exemplary. Row-by-row validation, damaged rows quarantined under `:damaged`, never destroyed. This is the pattern F2 and F5 should adopt.
- **`src/features/production/projectStore.ts`** — same idiom, clean.
- **`src/features/permissions/permissionStore.ts`** — reads per-capability on demand with no cached module state, so it has no hydration race.
- **`src/features/study/studyQueueStorage.native.ts`** — SQLite-backed, parameterised except for one deliberately documented and integer-filtered `IN (...)`, with a correct empty-list guard. Clean.
- **`src/features/study/sync.ts`** — the best of the three queues: broad network-error detection, explicit refusal to drop events on the buffer path, and a single documented arbiter for dropping poisoned batches.
- **Offline timestamps** — all three queues preserve the true `submitted_at` and pass `submitted_offline=true` on replay. **No stale-timestamp bug exists**; the finish time is genuinely honoured, as the exam UI claims.
- **Cross-account contamination** — every queue and store exposes a `clear*`/`resetLocal` called from `clearLocalAccountData`, so one user's queued work cannot replay under the next user's session. This is handled consistently and well.
- **Telemetry** — `src/features/telemetry/telemetry.ts` holds no persistent queue of its own (Sentry and Aptabase own their buffering), so there is nothing here to lose, duplicate, or replay stale.
- **Session-only vs persisted** — `tunerFrameStore`, `labPreviewStore`, `audioOutputStore` and the calc `chainStore`/`workflowStore` are session-scoped by design and correctly hold no AsyncStorage state. The web quiz queue is deliberately in-memory and the UI says so explicitly (`QuizScreen.tsx:190-196`).

### Async-after-unmount: clean areas

All 122 effects containing an `await`/`.then(` were checked, plus 38 async callbacks outside effects.

- **The lab audio-generator family is the reference implementation** — `OscillatorLabScreen`, `BassLabScreen`, `NoiseLabScreen`, `FmLabScreen`, `FxLabScreen`, `BinauralLabScreen`, `AutotuneLabScreen`, `ModularLabScreen`, `SignalChainLabScreen`, `HarmonographLabScreen`, `FoundationsCourseScreen`, `FoundationsPlaygroundScreen`, `SignalGenScreen`, `cymatics/useDriveTone`, `modHarmony`, `modAnalog`, `eqAudition`, `mixing/kit`. Every one uses `const gen = ++genRef.current` / `if (!ok || gen !== genRef.current) return`, guarded on **both** awaits (the output gate *and* the generator start), with `useFocusEffect(() => () => stop())`. This is the pattern F9 and F12 should copy.
- **`src/screens/quiz/` and `src/screens/exam/`** — both carry an explicit `mountedRef` *and* a local `alive` flag, and clear their advance timers. Given F1–F3 sit in the API layer beneath them, it is worth stating plainly that the **screens** are correct; the defects are in the queue modules.
- **`src/screens/study/`** — `FlashcardsScreen` (guards every setter including the nested `fetchTopicMedia` chain), `FillInBlankScreen`, `MatchingScreen`, `ScenariosScreen`.
- **`src/screens/glossary/GlossaryScreen.tsx:1613-1698`** — the main focus effect is `alive`-guarded across both awaits, including the second `loadAllEntries`.
- **`src/features/account/`** — `SingleDeviceGuard` (alive + `handling` ref, re-checked after the `isDisplaced` await) and `SessionExpiryGuard` are correct.
- **`src/features/lab/LabAudioPlayer.ts`** — token + `disposed` guarded internally; cannot touch a released native player. **Nothing in `src/` sets state on a released native resource**, which is the one outcome that would have been a crash rather than a no-op.
- **Low-Light Production Mode is not at risk from any of these races.** I checked all six consumers of `useOverlaysSuppressed` individually, because "nothing may auto-appear" is a standing hard rule and several of these races end in a `setVisible(true)`. Every surface gates on the **current** suppressed value at render time, not on the value captured when the async read started:
  - `lib/coachMark.ts:98` — `visible: visible && !suppressed`
  - `ScreenIntroOverlay.tsx:84` — `visible && focused && !suppressed`
  - `TopicWelcomeSheet.tsx:118` — `visible && !!copy && focused && !suppressed`
  - `Celebration.tsx:52-63` — collapses every tier to the quiet inline form via `formFor(def.tier, suppressed)`
  - `LearningIntroSheet.tsx:43`, `useMethodCelebration.ts` — same pattern.

  So even where a late `setVisible(true)` lands (e.g. `coachMark.ts:57`, where the suppression check happens *before* the AsyncStorage read), the render gate still hides it. The rule is enforced structurally rather than by timing. `useMethodCelebration.ts:40` and `coachMark.ts:50-52` both carry comments warning against `a() || b()` short-circuiting the second hook — the team already knows the conditional-hook hazard, which matches what section 1 found.
- **`src/features/curriculum/`, `src/features/enrollment/` progress, `topicTrophies.ts`, `useMethodCelebration.ts`, `src/navigation/`, `src/config/`, `src/theme/`, `src/data/`** — correctly guarded, or no async effects at all.

One note on a near-miss: `src/features/lab/useLabAudio.ts:55-72` has the same unguarded-after-await shape (it would report a spurious `'network'` failure when the user switches clips quickly), but it currently has **no consumers**. Worth fixing before it is wired into the lab audio work rather than after — alongside F16, which lives in the same module.

### Timers, listeners and subscriptions: clean areas

~240 timer / listener / rAF / subscription sites were checked. **No leaked interval, no leaked listener, no leaked rAF loop, and no un-torn-down mic or DSP session was found anywhere in `src/`.** The effect hygiene here is genuinely strong — generation counters, `alive` flags, live-ref (`xRef.current = x`) reads and paired teardown are used consistently.

- **The highest-stakes timers are textbook.** `QuizScreen` and `FinalExamScreen` both clear the countdown interval and the advance timer on unmount, hold a `mountedRef`, and remove their AppState and BackHandler listeners. `ResultsScreen` lockout countdown, `SessionTimer`, `FlashcardsScreen`, `FillInBlankScreen`, `MatchingScreen` and `ScenariosScreen` are all clean, as are `features/study/sync.ts` (accrual + sync intervals + AppState sub, all cleared in `stop()`) and `timeTrial.ts`.
- **Shell and root** — `DashboardScreen` (all 12 effects, including the `onStudyProgress` unsubscribe and the `InteractionManager` task cancel), `GlossaryScreen` (both `tabPress` listeners unsubscribed), `CourseSelectionScreen`, `AwardsScreen`, `SplashScreen`, `EntitlementProvider`, `SingleDeviceGuard` (poll + AppState + realtime channel all torn down), `navigation/*`, `lib/useShake.ts`, `JogWheel`, `HoldToActivate`, `ScreenErrorBoundary`, `AppDialog`.
- **Tools (122 sites)** — zero findings. The tricky variants are handled correctly: `hubPreviewsSim.tsx:212` and `CenterLockTuner.tsx:1136` reassign their handle but the cleanup closes over the live `let`; `DspDebugScreen`/`SignalGenScreen` use generation counters so an awaited start landing post-unmount aborts; `SplMeterScreen:379` clears a whole `Map` of timers; `useDspEngine` has watchdog-in-`finally` plus blur *and* unmount teardown.
- **Labs (95 sites)** — every `setInterval(noteAudioActivity, …)` has a matching `clearInterval`; every tone generator follows gate → generation counter → keepalive → `useFocusEffect` stop; all `AccessibilityInfo`/`BackHandler`/`navigation.addListener`/`Animated.Value` listeners are removed; all `Animated.loop`/`withRepeat` are stopped or cancelled. F15 is the single exception in the whole lab tree.
- **Polish only, not worth a pre-launch change** (all self-terminating, React 18 no-ops the late setState): `rack/DockButton.tsx:77` (220 ms flash timer), `audio/ExposureCheckin.tsx:115` (app-root mounted, never unmounts), `settings/DeleteAccountButton.tsx:47`, `EnrollmentScreen.tsx:484`, `HomeSetupSheet.tsx:253`, `CalcWorkspaceScreen.tsx:65`.

# 4. Test coverage gap

`test/` contains **no test** touching `replayQuizSubmissions`, `replayExamSubmissions`, either queue storage module, or `homeCardsStore`. Every finding above lives in code the suite never executes, which is why 1429 passing tests and a clean `tsc` did not surface any of it. F1 and F2 are both straightforwardly unit-testable against the existing injectable `KeyValueStore` / in-memory adapters — a fake that throws a timeout, and a fake holding a corrupt blob, would pin both.

# 5. Suggested order of work

1. **F1** — one shared `isNetworkError` + an allow-list for permanent drops. Smallest change in the set and it removes the worst outcome: silent loss of graded work. Two unit tests against the existing in-memory adapters would pin it.
2. **F3** — make `writeQueue` return success and stop the false reassurance. One-line signature change plus the caller.
3. **F6** — move one line below the `mountedRef` guard. Trivial fix, and it closes a cross-account data exposure.
4. **F2 / F5** — port the `patternStore` quarantine idiom to the exam queue and the enrollment store; suppress server sync after a failed read.
5. **F4** — module-load hydrate + hydration-safe mutators in `homeCardsStore`. Single-site, precisely bounded.
6. **F14** — one ref, and it closes a paid-perk bypass while payments are going live.
7. **F18** — one character. Do it early, so every later search in this repo is trustworthy.
8. **F11** — fix before the Cymatics Phase 4 device pass, since a slower device is what triggers it.
9. **F9 / F10** — one added mount flag and one `alive` guard respectively.
10. **F16** — one line, before `useLabAudio` gets its first consumer.
11. **F7 / F8 / F12 / F13 / F15 / F17** — structural hardening; no user-visible bug today, or cosmetic only.

A note on sequencing: items 1–3, 6 and 7 are each a handful of lines (F18 is one character), carry the highest severity, and touch code with no test coverage to break. They are the cheapest risk reduction available before launch.
