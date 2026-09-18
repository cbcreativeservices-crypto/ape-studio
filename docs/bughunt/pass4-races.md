# Bug hunt — Pass 4, agent C: races

Axis: everything that assumes one thing happens at a time. Double-fires, two
screens doing the same work, out-of-order responses, identity changing mid-write,
write-write races on storage, timers vs lifecycle, audio start/stop, React 18.

**Headline.** The app's async hygiene is genuinely good at the level of a single
call — `alive` flags, `mountedRef`, `submitted.current` latches and the
entitlement provider's `generation` counter are all present and correct. What is
missing is hygiene at the level of *two callers*. Three patterns recur:

1. **Every list-shaped store in the app is a bare read-modify-write** on one
   AsyncStorage key with no cache, no lock and no queue: `projectStore`,
   `workflowStore`, `patternStore`, `enrollmentStore`, the final-exam queue.
   `projectStore` is the one wired to a **per-keystroke autosave**, and that is
   the worst bug in this report.
2. **Guards are per-instance where they need to be per-module** — a `useRef`
   guarding a store, a `useCallback` guarding a screen — so they work for the
   caller that wrote them and are inert for the second caller.
3. **A generation/identity check exists in exactly one file**
   (`EntitlementProvider`'s retry ladder) and is missing from every other
   deferred write, including the one inside that same file.

Confidence is stated per finding. Three findings I could not settle from source
alone are marked as such with what would settle them.

---

# REAL

## C1. Production Labs: the per-keystroke autosave is a lost-update race — typed answers vanish and the field jumps backwards on screen

**Severity:** BLOCKER (data loss in the flagship paid feature, into a
client-facing document)
**Confidence:** HIGH on the mechanism; HIGH that it is user-visible on a mid-range
Android. A device pass with a slow disk would show it in under a minute.

**Where:**
- `src/screens/lab/production/FieldRow.tsx:129` — `onChangeText={onChange}` (longText)
- `src/screens/lab/production/FieldRow.tsx:147` — same (date)
- `src/screens/lab/production/FieldRow.tsx:167` — same (time)
- `src/screens/lab/production/FieldRow.tsx:235` — same (shortText)
- `src/screens/lab/production/FieldRow.tsx:346` — same (every table cell)
- `src/screens/lab/production/FieldRow.tsx:372-375` — `setCell` rebuilds the whole
  row array from `rows`, which is derived from the same async-owned state
- `src/screens/lab/production/ProductionStageScreen.tsx:73-87` — `setValue`
- `src/features/production/projectStore.ts:173-185` — `mutate()`
- `src/features/production/projectStore.ts:117-152` — `loadList` / `saveList`

**The code.** `mutate` is a textbook non-atomic read-modify-write over the entire
project list:

```ts
async function mutate(lab, id, fn) {
  const all = await list(lab);              // getItem + JSON.parse the WHOLE list
  const i = all.findIndex((p) => p.id === id);
  if (i < 0) return null;
  const next = { ...fn(all[i]), updatedAt: Date.now() };
  all[i] = next;
  const ok = await write(lab, all);          // JSON.stringify + setItem the WHOLE list
  return ok ? next : null;
}
```

There is no module-level cache (`projectStore.ts:273-285` returns a singleton
around raw AsyncStorage), no lock and no write queue. `setValue`, `setNa`,
`acceptCondition` and `clearCondition` (`:222-251`) all route through it.

**The interleaving.** The learner types `Haz` into a hazard-register cell.

- keystroke `H` → `setValue` → `mutate` #1 reads list `L0`, computes `L0+{f:'H'}`.
- keystroke `a` lands ~120 ms later, before #1's `setItem` has returned →
  `mutate` #2 reads `L0` **again** and computes `L0+{f:'Ha'}`.
- keystroke `z` → `mutate` #3 reads `L0` → `L0+{f:'Haz'}`.
- Whichever `setItem` lands last is the stored state. On a device where the
  writes complete out of order (three independent bridge calls), that can be
  `'H'`.

Then the *display* half, which is the part the user actually sees. The input is
**controlled** — `value={typeof value === 'string' ? value : ''}`
(`FieldRow.tsx:128`) — and its value comes from the `project` state, which
`ProductionStageScreen.tsx:80` overwrites with whatever each `mutate` returns:

```ts
setProject((cur) => ({ ...cur, values: { ...cur.values, [k]: v } })); // optimistic
const saved = await projectStore().setValue(lab, project.id, stageId, fieldId, v);
if (saved) { setProject(saved); ... }                                 // authoritative
```

`mutate` returns `next` — *its own* snapshot. So when #1 resolves after the user
has typed `Haz`, `setProject(saved)` replaces the field's contents with `'H'`.
**Characters disappear from the box as you type.**

**Across fields it is worse.** Fill field A, tap field B, type one character
before A's write lands: B's `mutate` read `L0` (pre-A), so B's write is
`L0+{B}` — **field A's completed answer is gone from storage entirely**, and the
readiness meter and the exported packet are computed from storage.

**What should happen:** an edit buffers locally and the store serializes its
writes (a promise chain per key, or an in-memory list the store owns and
persists on a debounce). A `TextInput` must never take its value back from an
async round trip.

**Why this matters more than the arithmetic:** pass 3 fixed
`ProductionStageScreen` "discarding a failed write while showing the answer
saved". This is the *successful*-write case — `saved` is non-null, `saveFailed`
is cleared, everything looks correct, and the data is still wrong. The existing
fix cannot catch it.

**Same store, same race, reachable by double-tap:**
`src/screens/lab/production/ProductionActivityScreen.tsx:77-84` — `restart()` does
`await remove(...)` then `await upsert(...)` with no in-flight guard behind
`onPress={() => void restart()}` (`:167`). Two taps interleave as
remove/remove/upsert/upsert over stale reads; the second `remove`'s write (built
from a pre-first-upsert snapshot) can erase the re-seeded project, leaving the
exercise with nothing to open.

---

## C2. A stale entitlement read re-applies the previous session's tier — Academy unlocks for a signed-out user, or is withheld from the person who paid

**Severity:** BLOCKER (a paid feature free / a paid feature locked)
**Confidence:** HIGH that the guard is absent; MEDIUM-HIGH that it is reachable
in practice (needs a sign-out or an account switch while a read is in flight,
which is exactly the launch-week slow-connection case).

**Where:**
- `src/features/commercial/EntitlementProvider.tsx:282-284` — `deriveAndApply`
- `src/features/commercial/EntitlementProvider.tsx:444-446` — `refreshEntitlement`
- The *correct* guard, in the same file, at `:301` and `:314`

**The code.** The file has a generation counter and uses it — but only around
`deriveAndApply`, never *inside* it:

```ts
const deriveAndApply = async (hasSession: boolean): Promise<boolean> => {
  if (!alive || devOverrode.current) return true;
  ...
  const { data, error } = await supabase.from('entitlements').select(...);   // ← the window
  ...
  const tier = academyTierFromRows((data ?? []) as EntRow[]);
  if (alive && !devOverrode.current) setEntitlementState(tier);              // ← no generation check
  return true;
};
```

`deriveWithRetry` captures `const mine = ++generation` and compares
`generation !== mine` at `:314` — but only *before* calling `deriveAndApply`,
never after its await. The tier is applied regardless of which session asked for
it.

**The interleaving.**

- User A (Academy) is signed in on a bad connection. An auth event fires
  `deriveWithRetry(true)` → generation 1 → the `entitlements` select goes out.
- A signs out. `SIGNED_OUT` → `deriveWithRetry(false)` → generation 2 →
  `setEntitlementState('anonymous')`, returns immediately.
- A's select finally resolves → `setEntitlementState('academy')`.
- **A signed-out device now reports `isMember: true` and `capsFor('academy')`.**
  Every members-only lab, every paid topic, every gated tool opens, until the
  next auth event or a relaunch.

Flip the tiers and it is the other failure: user B signs in, B's fast read lands
first, A's slow read lands second and downgrades B to `free` — a paying customer
locked out of what they bought, with no way back short of killing the app (the
file's own comment at `:290-292` says exactly that).

`refreshEntitlement` (`:419-451`) has the same hole and no generation at all. It
is reachable from the Paywall's purchase-success path, the Paywall's Restore, and
Settings → Redeem code. It *does* check `isRealAccount` at `:431` — but that check
is before the entitlements query, so a sign-out during the query still lands.

**What should happen:** `deriveAndApply` takes `mine` and re-checks
`generation === mine` immediately before `setEntitlementState`;
`refreshEntitlement` bumps and checks the same counter.

---

## C3. The offline exam/quiz queues can be replayed twice at once — duplicate result dialogs, and a queued row resurrected or lost

**Severity:** MAJOR (duplicate dialogs, confusing result reporting); the
lost-row variant is BLOCKER-severity but lower likelihood
**Confidence:** HIGH that `load()` is unguarded and has four independent callers.
HIGH that two can overlap. MEDIUM on how often the destructive ordering wins.

**Where:**
- `src/screens/dashboard/DashboardScreen.tsx:744-899` — `load()`, no in-flight guard
- callers: `:906` (focus effect via `InteractionManager`), `:917`
  (`onStudyProgress` — fires whenever any study write lands), `:930`
  (`switchMode`), `:942` (`enrolledKey` effect)
- `src/screens/dashboard/DashboardScreen.tsx:756` — `replayQuizSubmissions()`
- `src/screens/dashboard/DashboardScreen.tsx:767` — `replayExamSubmissions()`
- `src/features/finalExam/api.ts:332-392` — `replayExamSubmissions`, read at `:333`,
  network loop, write at `:391`

`load()` has a `mountedRef` and a `dataRef` (for the spinner), but nothing that
says "a load is already running". Grepping the file for `loadingRef` /
`inFlightRef` returns nothing.

**The interleaving.** The learner sat their capstone offline; a row is in
`ape:finalExamQueue`. They open the Study tab.

- Focus effect → `load()` #1 → `replayExamSubmissions()` → `readQueue()` → `[R1]`
  → `submitFinalExam(R1)` goes out over a slow connection.
- While that is in flight, a study write flushes (the Flashcards session's 30 s
  loop, or a method exit) → `onStudyProgress` → `load()` #2 →
  `replayExamSubmissions()` → `readQueue()` → still `[R1]`, because #1 has not
  written yet → submits R1 **again**.
- Both succeed — `api.ts:329-331` notes the server returns the frozen
  `result_payload` for a finalized attempt — so both push to `done`.
- The learner gets **"Offline exam submitted — Score x/y … Credential awarded."
  twice**, and `notify` queues, so they must dismiss it twice for one exam.

The destructive variant: the queue holds R1 and R2.

- #1 reads `[R1,R2]`, submits R1, hits a transient failure on R2 → `offline=true`
  → `remaining=[R2]`.
- #2 reads `[R1,R2]`, submits R1 (frozen result), then R2 — this time it
  succeeds → `remaining=[]` → `writeQueue([])`.
- #1 finishes last and writes `[R2]` → R2 is **resurrected**, and the next load
  announces it a third time.

Reverse the finishing order and a genuinely-still-pending row is dropped.

**What should happen:** `load()` holds a module- or ref-level promise and a
second caller awaits it rather than starting a second pass; `replayExamSubmissions`
holds its own single-flight latch, which would also fix C4.

---

## C4. Queueing a second offline exam during a replay deletes it — after telling the learner it is saved

**Severity:** BLOCKER (graded capstone lost, against an explicit promise)
**Confidence:** HIGH on the mechanism. MEDIUM on reachability — it needs two
final exams, one already queued and one being submitted, in one offline stretch.

**Where:**
- `src/features/finalExam/api.ts:317-324` — `enqueueExamSubmission`
- `src/features/finalExam/api.ts:333` and `:391` — the replay's read and write
- `src/screens/exam/FinalExamScreen.tsx:182` — the call site, and `:191-195` — the
  promise made on success

```ts
export async function enqueueExamSubmission(row: QueuedExam): Promise<boolean> {
  const rows = await readQueue();                                   // ← read
  const next = rows.filter((r) => r.attemptId !== row.attemptId);
  next.push({ ...row, userId: row.userId ?? (await currentUserId()) }); // ← a SECOND await
  return writeQueue(next);                                          // ← write
}
```

Note the second await: `currentUserId()` is a Supabase auth round trip sitting
*between* the read and the write, widening the window well beyond one storage hop.

**The interleaving.** R1 is queued (an earlier offline exam, this user's, still
failing).

- The Dashboard's `load()` runs `replayExamSubmissions()` → reads `[R1]` → tries
  R1 → transient failure → `remaining=[R1]`, heading for `writeQueue` at `:391`.
- Meanwhile the learner finishes their second capstone offline. `doSubmit` fails
  the network test, calls `enqueueExamSubmission(R2)` → reads `[R1]` → writes
  `[R1,R2]` → returns `true`.
- `FinalExamScreen.tsx:191-195` shows **"Your exam is saved and will be submitted
  automatically when you reconnect. Your finish time is preserved."**
- The replay's `writeQueue([R1])` lands. **R2 is gone.** The only copy of those
  answers was `answers.current` on a screen the learner has just been told it is
  safe to leave.

The empty-queue short-circuit at `:334` (`if (rows.length === 0) return []`)
correctly prevents the simplest version of this, which is why the window needs a
pre-existing row. It does not prevent this one.

**What should happen:** both paths go through one serialized queue mutator, or
the replay writes back with a compare-and-set on the row ids it actually read.

---

## C5. A user's last study batch is enqueued *after* the sign-out wipe clears the queue, and replays credited to the next person

**Severity:** MAJOR (progress credited to the wrong account; the departing user
loses it)
**Confidence:** HIGH on the ordering. HIGH that the queue rows carry no owner.

**Where:**
- `src/features/study/sync.ts:266-288` — `StudySession.stop()`
- `src/features/study/sync.ts:234-263` — `flushOnce`, `enqueue` on failure at `:257`
- `src/features/study/studyQueueStorage.native.ts:23-31` — schema: **no user column**
- `src/features/study/studyQueueStorage.native.ts:62-64` — `clearQueuedBatches()`
- `src/features/account/clearLocalAccountData.ts:172` — where it is called
- `src/screens/settings/SettingsScreen.tsx:210-214` — the Log out path
- `src/screens/study/FlashcardsScreen.tsx:520-527` — session start/stop

**The interleaving.** Learner A is mid-Flashcards. They go to Settings and Log out.

`SettingsScreen.tsx:210-214`:
```ts
markIntentionalSignOut();
await supabase.auth.signOut();
navigation.reset({ index: 0, routes: [{ name: 'Splash' }] });
```

Two things then run concurrently.

*The wipe*, via `accountLocalSync`'s `SIGNED_OUT` listener: `getItem` →
`getAllKeys` → `multiRemove` → `clearStoredMeasurements()` → then, synchronously,
`resetAllLocalStores()` → `clearQueuedBatches()` → `DELETE FROM study_queue`.
Four storage hops.

*The teardown*, via `navigation.reset` unmounting the Study stack →
`FlashcardsScreen.tsx:525` → `void s.stop()` → `await this.flush()` →
`replayQueue()` then `callRpc('record_study_progress', …)`. That RPC now has no
session, so it goes to the network and comes back 401 — **a full round trip** —
and only then does `sync.ts:257` run `enqueue(...)`, a synchronous SQLite INSERT.

A network round trip is slower than four AsyncStorage hops, essentially always.
So **the insert lands after the delete**, and A's final batch survives a wipe
whose entire purpose (`studyQueueStorage.native.ts:59-61`) is to stop exactly
this.

User B then signs in on the same device and opens any study method. The first
`flushOnce` calls `replayQueue()` (`sync.ts:236`), which reads the row — it has an
`achievement_id` and a `method_key` and **no user id** — and sends it under B's
JWT. B is credited with study time on a topic they have never opened, and A's
last minutes are recorded against a stranger.

**What should happen:** the same fix the final-exam queue already has —
`studyQueueStorage` gets a `user_id` column stamped at insert and filtered at
replay (`finalExam/api.ts:236, 320, 345-348` is the working model). The same gap
exists verbatim in `src/features/quiz/submissionQueueStorage.native.ts:22-30`.

---

## C6. Double-tap: four buttons that create a record or pop a screen have no in-flight guard

**Severity:** MAJOR (`CalcWorkflowEditScreen` — double pop plus a duplicate);
MINOR-to-MAJOR for the rest
**Confidence:** HIGH — read directly; no `busy` state, no `disabled`, no latch.

This is the same shape as the already-known preview-dismiss double-pop.

**a) `src/screens/lab/calc/CalcWorkflowEditScreen.tsx` — the worst of the four.**
`onPress={() => void onSave()}` (`:149`) on an unguarded async handler (`:87-126`):

```ts
const w: Workflow = { id: editingId ?? Crypto.randomUUID(), ... };   // :113
const ok = await workflowStore.saveWorkflow(w);                      // :120
if (!ok) { notify(...); return; }
navigation.goBack();                                                  // :125
```

Two taps on a NEW workflow: two `Crypto.randomUUID()` calls → **two saved
workflows with the same name**, *and* two `navigation.goBack()` calls → the user
is popped **two screens**, landing somewhere they did not come from. `saveWorkflow`
is itself a read-modify-write (`workflowStore.ts:85-92`), so one of the two may
also vanish depending on which write lands last.

**b) `src/screens/lab/production/ProductionLabScreen.tsx:79-87`, pressed at `:152`.**
```ts
const p = newProject(lab, pathway, `${PATHWAY_LABEL[pathway]} ${def.newProjectNoun}`);
await projectStore().upsert(p);
await reload();
setOpenId(p.id);
```
No guard, `Pressable` never disabled. Two taps → two projects with identical
names in the switcher (`:163-177`), and `setOpenId` runs twice so which one the
learner lands in is decided by whichever `upsert` resolves last. `upsert` is the
same RMW as C1, so the two can also clobber each other.

**c) `src/screens/lab/calc/CalcProjectsScreen.tsx:119-158`, pressed at `:179`.**
`id: editing?.id ?? Crypto.randomUUID()` (`:144`) with no guard → duplicate saved
projects.

**d) `src/screens/lab/production/ProductionActivityScreen.tsx:77-84`, pressed at
`:167`** — covered under C1.

**Verified NOT vulnerable** (guard read and confirmed): `DeleteAccountButton`
(`:42` early-return + `disabled={busy}` at `:98`), `ExportPanel` (`:118` latch +
`on={… && !busy}` on every button), `PaywallScreen` (CONTINUE is *replaced* by a
spinner at `:397-410`, Restore is `onPress={busy ? undefined : onRestore}` at
`:411`), and both assessment screens — `pickSingle` guards on `selIdx !== null`
(`QuizScreen`/`FinalExamScreen`), `pickMatch` guards on already-paired indices,
and `confirmMulti`'s repeated call is absorbed because `recordAndAdvance` clears
the previous advance timer.

---

## C7. `syncLocalToIdentity` has no in-flight latch, so two auth events wipe concurrently and the identity marker can be written out of order

**Severity:** MAJOR (the next launch wipes a user who should not be wiped)
**Confidence:** HIGH that there is no latch and no generation. MEDIUM on how
often the losing order wins — both calls do near-identical work, so the earlier
one usually finishes first.

**Where:**
- `src/features/account/accountLocalSync.ts:63-77` — the listener,
  `void syncLocalToIdentity(...)`, fire-and-forget
- `src/features/account/accountLocalSync.ts:32-52` — read marker → wipe → write marker
- `src/screens/auth/AuthScreen.tsx:150` and `:168-179` — a *second* concurrent wipe
- `src/features/account/clearLocalAccountData.ts:94-127` — `getAllKeys` → filter →
  `multiRemove` → `clearStoredMeasurements()`

```ts
prev = await AsyncStorage.getItem(LOCAL_USER_ID_KEY);   // OLD marker
if ((prev ?? '') === identity) return;
await clearLocalAccountData();                          // getAllKeys + multiRemove + SQLite
resetAllLocalStores();
await AsyncStorage.setItem(LOCAL_USER_ID_KEY, identity); // NEW marker
```

**The interleaving.** Sign out, then sign in as a different account — the
back-to-back case the app produces itself (Guest Mode at `AuthScreen.tsx:150`,
the device-takeover cancel at `:118-123`, and any log-out-then-log-in).

- `SIGNED_OUT` → run #1 with `identity=''`. Reads `prev='uidA'`, starts the sweep.
- `SIGNED_IN` as B → run #2 with `identity='uidB'`. Its `getItem` lands *before*
  run #1's `setItem`, so it also reads `'uidA'` → it too starts a sweep.
- Two `getAllKeys → multiRemove → clearStoredMeasurements` sequences run over the
  same keys.
- If run #2's marker write lands first and run #1's `setItem('')` lands second,
  the device is left marked `''` while B is signed in. On B's **next launch**,
  `INITIAL_SESSION` compares `'' !== 'uidB'` → **B's device data is wiped a second
  time**: their enrollment edits, Home cards, term lists, Career Finder answers,
  saved measurements and settings, all from a session they completed normally.

Separately, `enterGuest` (`AuthScreen.tsx:139-187`) runs its *own*
`clearLocalAccountData({ total: true })` concurrently with the listener's
non-total one, and its Career Finder preservation is a read-across-the-sweep:

```ts
const finderRecord = await AsyncStorage.getItem('ape:careerfinder:v1');  // :168
await clearLocalAccountData({ total: true });                            // :169
resetAllLocalStores();                                                   // :170
if (finderRecord) await AsyncStorage.setItem('ape:careerfinder:v1', finderRecord); // :171
```

The listener's sweep started earlier (during `signOut()` at `:150`). If its
`getAllKeys` snapshot is taken before line 171 and its `multiRemove` executes
after, the restored record is deleted — breaking the owner's explicit 2026-09-03
ruling that the Career Finder record survives guest re-entry ("Your answers stay
on this phone"). The counts favour the record surviving (line 171 is four hops
behind), so I rate this part **borderline**, but the two wipes genuinely overlap
and the outcome is decided by timing.

**What should happen:** `syncLocalToIdentity` serializes on a module-level
promise chain, and the callers that already wipe explicitly
(`AuthScreen.enterGuest`, `SingleDeviceGuard`, `DeleteAccountButton`) suppress the
listener rather than racing it.

---

## C8. Cancelling the enrollment server sync only cancels a *pending* timer, never an executing one

**Severity:** MAJOR (the server master list the backend gates v3 study/quiz on)
**Confidence:** HIGH that the gap exists. MEDIUM on the worst outcome, which
needs the reconcile read to fail — see the second half, which makes that likely.

**Where:**
- `src/features/enrollment/enrollmentStore.ts:137-179` — `scheduleServerSync`
- `src/features/enrollment/enrollmentStore.ts:329-346` — `resetLocal`, and its own
  comment at `:330-335` describing the bug this was meant to close
- `src/features/enrollment/enrollmentStore.ts:110-136` — `reconcileFromServer`

The 2026-08-28 fix cancels the debounce:

```ts
export function resetLocal(): void {
  if (syncTimer) clearTimeout(syncTimer);   // ← no-op if the timer has already FIRED
  syncTimer = null;
  ...
  list = [];
```

But once the timer has fired, its async IIFE is already running and
`clearTimeout` on a fired handle does nothing. That IIFE then does
`await getSession()` → `await reconcileFromServer()` → and only *then*
`supabase.rpc('sync_my_enrollments', { p_items: list.map(...) })` at `:153-155`,
**reading module-level `list` at that moment**. `resetLocal` has set it to `[]`.

So: the user edits enrollment, the 800 ms debounce fires, and during its two
network round trips they sign out and sign in as B. `getSession()` returns B,
`reconcileFromServer` errors or no-ops, and the RPC pushes
`sync_my_enrollments({ p_items: [] })` **under B** — wiping B's enrollment master
list. That is the identical outcome the comment at `:330-335` records as having
already happened once; the window is now two network hops instead of 30 s, but
it is the same hole.

**And the pull-before-push guard is a one-shot that a single failure burns.**
`reconcileFromServer` sets `reconciled = true` at `:112`, *before* its await, and
returns without clearing it on the error path at `:118-122`. So one failed read —
a missing grant on `user_topic_enrollments`, an outage, an offline first launch —
permanently disarms the protection for the whole app run, and the very next push
overwrites the master list with the two-topic seed. That is precisely the
reinstall scenario the mechanism was written for (`:74-88`).

**What I verified is correct here, so it does not need touching:** the
`isPristineSeed(list)` check at `:126` sits immediately before the assignment at
`:128` with no await between them, so a user edit cannot be clobbered by an
in-flight reconcile. That part is right.

---

## C9. "Leave & wipe" does not wipe — the saved draft is restored on re-entry

**Severity:** MAJOR (an explicit promise in a dialog is not kept; on the exam it
is also an integrity rule)
**Confidence:** HIGH — this is a dependency-array bug readable straight off the
page, not a timing guess. Found while walking the exam's timers; strictly it is a
stale-closure bug rather than a race, and I am labelling it honestly as such.

**Where:**
- `src/screens/exam/FinalExamScreen.tsx:379-395` — `confirmExit`, deps `[navigation]`
- `src/screens/quiz/QuizScreen.tsx:420-431` — the twin

```ts
const confirmExit = useCallback(() => {
  confirmDialog('Leave the Final Exam?',
    'Your answers will be wiped immediately. The exam allows no pause or save.',
    'Leave & wipe',
    () => {
      answers.current = {};
      if (payload) void clearAttemptDraft(payload.attempt_id);   // :390
      navigation.goBack();
    }, ...);
}, [navigation]);                                                // ← `payload` missing
```

`confirmExit` is created on the first render, when `payload` is `null`, and its
dependency array never lets it be recreated. So the captured `payload` is
**permanently null** and line 390 never runs. `answers.current = {}` does work
(refs are stable), but the draft on disk survives.

The learner taps "Leave & wipe", is told their answers are gone — and on re-entry
`startFinalExam` resumes the same `attempt_id`, `loadAttemptDraft` finds the draft
(`:107-112`) and restores every answer and their position. The dialog is
false, and `attemptDraft.ts:23-26` states the intended rule in as many words:
"an explicit 'Leave & wipe' still wipes, because the learner chose it."

`QuizScreen`'s twin is more clear-cut: it does not call `clearAttemptDraft` **at
all** (`:420-431`), while showing the same "Your answers will be wiped
immediately" copy. If resuming a quiz is deliberate, the copy is wrong; if the
copy is right, the call is missing. One of the two needs a decision — I cannot
tell which from the source, and the owner should pick.

**Fix:** add `payload` to the dependency array (exam) and add the
`clearAttemptDraft` call (quiz), or change the copy.

---

## C10. A stop is fired into a HAL that is still opening

**Severity:** MAJOR if it bites (a stuck mic indicator, or a stream that will not
reopen); MINOR if the native layer absorbs it
**Confidence:** MEDIUM. The JS-side asymmetry is unambiguous and the file itself
documents the overlap as dangerous. What I cannot settle from source is whether
the native module tolerates it — **a device check on a cold Android mic tool
would settle this in one attempt.**

**Where:**
- `src/features/tools/engine/micSession.ts:59-66` — `doStop`
- `src/features/tools/engine/micSession.ts:88-101` — `acquireMic`'s `forceRestart`
  path, which explicitly does **not** do this
- `src/features/tools/engine/micSession.ts:114-133` — the in-flight start

The `forceRestart` path awaits the in-flight start before stopping, with the
reason written down: *"let any in-flight start settle, then fully stop (awaited)
so the fresh open below can't overlap a half-torn-down HAL."*

`doStop` does not:

```ts
function doStop(): void {
  cancelPendingRelease();
  startGen++;
  if (streamState === 'stopped') return;
  streamState = 'stopped';
  setMicActive(false);
  void ApeDsp.stop();        // ← fired straight into a running ApeDsp.start()
}
```

**The interleaving.** A cold Android HAL open costs 5–10 s (the `startGen`
docblock at `:40-41` says so). The user opens a mic tool, then within 1.5 s
presses Home or backs out.

- `acquireMic` → `streamState='starting'`, `myGen=1`, `ApeDsp.start()` in flight.
- `releaseMic()` arms a 1500 ms timer (`:142`); at t+1.5 s `doStop` runs,
  `startGen→2`, and issues `ApeDsp.stop()` **while `start()` is still opening**.
- At t+8 s `start()` resolves, sees `myGen !== startGen`, and issues a *second*
  `ApeDsp.stop()` (`:121`).

So the native module receives stop-during-start followed by stop-after-start.
The `startGen` token correctly prevents the JS state from claiming an orphaned
stream — that fix is sound — but it does not prevent the overlapping native calls
it was written alongside. `releaseMicNow()` (`:146-148`), which the background
handler uses, has the same shape with no debounce at all.

**What should happen:** `doStop` awaits `startInFlight` before calling
`ApeDsp.stop()`, exactly as `:91-100` already does.

---

# THEORETICAL

Real code paths, but each needs an ordering I could not convince myself a user
will hit. Listed so they are not re-found, not so they are fixed this week.

**T1. `useCredentialCelebration`'s cross-screen guard cannot work.**
`src/features/celebration/useCredentialCelebration.ts:98` — `const running = useRef(false)`,
with the comment at `:96-97`: *"Two screens can regain focus together, and without
this both would read the same 'new' credential and celebrate it twice."* A
`useRef` is per hook *instance*; two screens calling the hook get two independent
refs and the guard does nothing for the case it names. It is correct for
re-entry within one screen, and there is currently exactly one caller
(`DashboardScreen.tsx:573`), so this is latent — but the comment claims a
protection the code does not provide, and the second caller will not know.

**T2. Celebrating the same credential twice.**
Same file: `running.current` is released in the `finally` when `check()` resolves,
*before* the caller runs `confirmShown()`, and `confirmShown` fires
`void writeKnown(...)` un-awaited (`:143-145`). A second `check()` that reaches
`readKnown()` before that write lands would re-celebrate. In practice `check()`
does `await fetchMyCredentials()` (network) first, so the single `setItem` will
have landed. Safe by a wide margin, but by accident rather than by design.

**T3. Debounced registry publishes.**
`src/features/profile/publicProfile.ts:167-177` (name, 1200 ms) and `:216-228`
(public listing, 1500 ms) capture their payload at arm time and take identity
from the JWT at fire time. `resetLocal()` (`:238-250`) cancels both timers and
*is* registered in `resetAllLocalStores()` — but that runs after
`await clearLocalAccountData()`, so on the sign-out paths that do no explicit
teardown (Settings Log out, the Dashboard's two sign-outs, the takeover cancel)
the timer is live for the whole sweep. Firing during sign-out just fails
unauthenticated; publishing A's bio under B needs a full sign-in inside 1.5 s,
which a human will not do.

**T4. `exposureMonitor.resetLocal()` never stops the 1 s timer.**
`src/features/audio/exposureMonitor.ts:253-272` zeroes fifteen module variables and
re-fires `void hydrate()`, but never calls `stopTimer()` (`:521`); `timer` is set
at `:519`. A `persistDay()` already in flight when the wipe runs can write the
departing user's dose after the sweep, into `ape:exposure:v1:day:<date>` — a key
with no user in it. That is the 2026-08-28 bug (documented at `:241-251`) through
a different door. The window is one storage hop and `sounding` is false by the
time any of this happens, so the surviving record would be near-empty.

**T5. The guest glossary meter can leak a free lookup.**
`src/features/glossary/glossaryCap.ts:132-147` — `readLocal()` … `writeLocal({used: cur.used + 1})`.
Two definitions expanded in the same instant both read `used = N` and both write
`N+1`. Costs one lookup out of the weekly allowance. Not worth launch-week time.

**T6. Two mounted instances of the same tool colour preference.**
`src/features/tools/waveColorPref.ts:36-55` is the only preference store in the app
with no module cache and no listener set — each `useToolColorPref(key)` call holds
its own `useState`. `ape:tools:tunerColor` is used by
`src/screens/tools/FrequencyCounterScreen.tsx:402` and by the full-screen overlay
mounted over it, `src/screens/tools/SkinnedTunerVu.tsx:474`. Change the colour in
one and the other keeps the old value and will write it back on its next set.
Cosmetic.

**T7. Coach-mark open counters advance by one instead of two.**
`src/lib/coachMark.ts:70-71` reads into `opens.current` (a `useRef`) and `:93`
writes `opens.current + 1`. Two mounts of the same key both read `N`, both write
`N+1`, so the 0→5 retire budget stretches. Cosmetic; the same shape in
`src/components/StudyFsOverlay.tsx:48-59` and
`src/screens/study/FlashcardsScreen.tsx:1143-1162`, where a full-screen open before
the un-awaited read resolves resets the stored count to 1.

**T8. `record_tool_usage` on unmount takes identity at fire time.**
`src/features/tools/telemetry.ts:35-56` fires the RPC from an unmount cleanup with
`toolRef`/`openedAtRef` captured on mount. A sign-out that unmounts the tool sends
it with no session (it fails, harmlessly, and is swallowed). Attributing A's tool
session to B needs the unmount to land after a new sign-in, which the navigation
order does not produce. Telemetry only, and the `MIN_SECONDS`/`MAX_SECONDS` bounds
at `:41` discard most of the odd cases anyway.

**T9. `localSchedule`'s 1200 ms debounce has no reset function.**
`src/features/notifications/localSchedule.ts:200-209` captures `LocalSettings` at arm
time; the module has no `resetLocal` and is not in `resetAllLocalStores()`, so
`syncTimer`, `lastSlice` and `lastFullSyncAt` all survive an account switch. It
writes only device-local `ape:notif:*` keys, which the sweep removes anyway, so
the worst case is one stale reschedule.

---

# Coverage

## Walked and found nothing to report

- **Both assessment screens' double-tap surface.** `pickSingle` (`selIdx !== null`),
  `pickMatch` (already-paired guards), `confirmMulti` (absorbed by the advance
  timer being cleared and re-set), and `doSubmit`'s `submitted.current` latch —
  which is set **before** the first await in both files
  (`FinalExamScreen.tsx:149-150`, `QuizScreen.tsx:144`). This is the pattern the
  rest of the app should copy. The retry loop at `FinalExamScreen.tsx:246-252` is
  also correct: the 15 s interval cannot double-submit because a submit still in
  flight leaves `submitted.current` true.
- **`micSession`'s state machine**, apart from C10. The `startGen` token, the
  `startInFlight` promise reuse at `:111`, `cancelPendingRelease` at the top of
  `acquireMic`, and the `captureAlive()` check before adopting a warm stream are
  all correct and cover the orderings I tried.
- **`StudySession.flush()`** (`sync.ts:223-232`). The `while (this.inflight) await this.inflight`
  serialization is right, and the comment explaining why the old early-return was
  fatal is accurate. Its problem is C5 — *when* it runs — not *how*.
- **`enrollmentStore`'s pristine-seed check** — see the note at the end of C8.
- **`EntitlementProvider`'s retry ladder** (`:300-322`). The only deferred path in
  the repo with a correct arm-time/fire-time identity guard. Use it as the model
  for C2's fix.
- **`replayExamSubmissions`'s per-row owner check** (`api.ts:345-348`) and the
  `userId` stamp at `:320`. Correct, and the model for C5.
- **SQLite row writes.** All three modules open `ape-studio.db`; every row write is
  a single-statement `INSERT OR REPLACE` or `DELETE` via `runSync`, and the two
  multi-statement paths (`measurementsBackend.native.ts:78-80` and `:85-94`) are
  wrapped in `withTransactionSync`. No read-then-write on a row anywhere. The
  races in the measurement layer are on the in-memory `list`, not the table.
- **`PaywallScreen`.** `busy` gates both controls structurally, the `alive` flag is
  checked before `welcome()`, and the React-18 ref-during-render mistake the brief
  warns about is genuinely fixed — `refreshEntitlement` returns the tier rather
  than the caller reading a ref (`EntitlementProvider.tsx:410-418`,
  `PaywallScreen.tsx:72-90`). I looked for the same mistake elsewhere: the four
  other write-during-render refs (`entitlementRef`, `retryFinishMsRef`,
  `dataRef`, `viewModeRef`) are each read only from a callback that runs a frame
  or more later, not from a microtask chained onto the call that set them.
- **`useState` initializers.** Every lazy initializer I read
  (`DashboardScreen.tsx:583, 599, 600`) is a pure cache read with no side effect.

## Not covered — where the next races pass should go

- **The Cymatics Phase 4 code** (`src/features/cymatics/patternStore.ts`,
  `src/screens/lab/cymatics/*`). `patternStore` has the identical RMW shape as C1
  (`:264-304`, and `deletePattern` at `:272-278` does four sequential awaits across
  **two** keys), and `GalleryArt.tsx:237` saves artwork from an unguarded `onPress`.
  I did not trace how often those writes overlap because the lab is uncommitted
  and under active device testing; it wants its own look with C1's mechanism in mind.
- **The native audio modules.** C10 needs a Swift/Kotlin read and a device check.
- **Reanimated shared values vs JS state** in the meter/tool screens — a different
  concurrency model (UI thread vs JS thread) that I did not open at all.
- **The web (`.ts`) siblings of the SQLite backends.**
  `measurementsBackend.ts:47-59` (`putRow`/`deleteRows`) is a bare RMW where the
  native one is transactional, so the web preview has a race the phones do not.
