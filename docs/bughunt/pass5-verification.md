# Pass 5 — agent A — adversarial verification of the pass-4 fixes

Scope: commits `70ed9ef1` ("pass 4: a lost-update race per keystroke…") and
`695caf8d` ("pass 4 part 2: stale entitlement reads, a lost exam, and a shake
that did two jobs"), read in full, plus the pass-3 fixes those commits touched
again.

**Build state:** `npx tsc --noEmit` → exit 0, no output.
`npm test` → **1488 pass / 0 fail**, 223 suites, 6.8 s.
Neither tells you anything about the findings below. There is **no test anywhere
in the suite** for the comma parser, the projectStore queue, `useShake`, the
entitlement generation guard, or the exam queue lock — four of the five headline
fixes shipped with zero coverage, while the fifth is nothing but a test.

READ-ONLY: no source file was edited. This report is the only file written.

---

## Verdict table

| # | Fix (pass 4) | Verdict |
|---|---|---|
| 1 | `FieldRow` comma handling | **BROKEN — REGRESSION, worse than before** |
| 2 | `MEMBER_ONLY_EXTRA_ROUTES` + 8 child routes | **BROKEN — completely inert** |
| 3 | `resetPopupSuppression` | **BROKEN — no-op; its key is on the KEEP list** |
| 4 | `projectStore` `serialize()` queue | **PARTIAL — `remove` and `duplicate` are outside it** |
| 5 | enrollment "do not push if the pull failed" | **PARTIAL — a real edit (clear all topics) now never syncs** |
| 6 | Entitlement `generation` guard | **PARTIAL — `refreshEntitlement` has the identical hole, unguarded** |
| 7 | `withQueueLock` in `finalExam/api.ts` | **HOLDS, WITH A NEW HANG RISK** (lock held across an unbounded network loop) |
| 8 | `test/accountWipeRegistry.test.ts` | HOLDS WITH CAVEATS — blind to `const` stores; one EXEMPT reason is false |
| 9 | `useShake` `yieldToMute` | HOLDS — the condition is exactly right; two caveats |
| 10 | `tierKnown` added to the memo deps | HOLDS |
| 11 | `resetTimeTrials` | HOLDS |
| 12 | `resetAskModeCache` | HOLDS |
| 13 | `resetLowLight` | HOLDS |
| 14 | `resetMixingCommitments` | HOLDS |
| 15 | `ParamLane` `accessible` | HOLDS |
| 16 | "report this to your professor" ×6 | HOLDS |
| 17 | Six "Coming Soon" rows removed | HOLDS |
| 18 | Profile "Full Course Certification" | HOLDS |
| 19 | Final Exam membership wall offers the plans | HOLDS |
| 20 | Third "rigger" gets `requires: 'CERT'` | HOLDS — but **six more undisclosed roles on a live screen** (new bug) |

---

## 1. BROKEN — typing `12,000` now commits **12**. That is a 1000× regression.

`src/screens/lab/production/FieldRow.tsx` lines 455–476.

The commit's own claim: *"'12,000' became 12000, which is right by luck rather
than by rule."* After the fix, typed `12,000` is **12**. The old code was right;
the new code is wrong. In a client-facing budget field.

**Why.** The transform runs on `onChangeText` and its result is stored in
`draft`, which is the TextInput's controlled `value`. So the *next* keystroke
arrives appended to the already-transformed text. A comma is rewritten to `.`
the instant it is typed — before three digits can follow it — so the grouping
branch (`/(^|\D)\d{1,3}(,\d{3})+(\D|$)/`) can never fire on typed input. It only
fires on a paste, where the whole string arrives at once.

Traced, character by character (`t` → `t2` → `cleaned` → committed):

| Typed | `t` at that keystroke | `draft` after | committed | Right? |
|---|---|---|---|---|
| `1` | `1` | `1` | 1 | ✔ |
| `1,` | `1,` | `1.` | 1 | ✔ (in progress; user sees `1.`) |
| `1,5` | `1.5` | `1.5` | **1.5** | ✔ |
| `1,50` | `1.50` | `1.50` | **1.5** | ✔ |
| `12,` | `12,` | `12.` | 12 | ✔ (in progress) |
| `12,0` | `12.0` | `12.0` | 12 | — |
| `12,00` | `12.00` | `12.00` | 12 | — |
| `12,000` | `12.000` | `12.000` | **12** | ✘ **should be 12000** |
| `1,234,5` | … `1.234` then the 2nd comma is stripped … | `1.2345` | **1.2345** | ✘ (paste gives 12345) |
| `-1,5` | `-1,` → `-1.` → `-1.5` | `-1.5` | **−1.5** | ✔ |
| `1.5` | `1.5` | `1.5` | **1.5** | ✔ |
| `1,5.5` | `1.` → `1.5` → `1.5.`→`1.5` → `1.55` | `1.55` | **1.55** | ✘ (paste gives 15.5) |

And the same keystrokes give a *different* answer depending on route:

- **Pasted** `12,000` → grouping branch → `12000`. ✔
- **Typed** `12,000` → `12`. ✘

It is also **non-deterministic at speed.** React Native's TextInput is not
strictly controlled — the native view accepts the character immediately and the
`value` prop is applied on the next render. If the user out-types the render,
`t` can still be the raw `12,00` + `0` = `12,000`, the grouping branch fires,
and they get 12000. Slow typing gives 12. The same person, the same field, two
answers 1000× apart, decided by frame timing.

Two more defects in the same block:

- `t2.replace(',', '.')` replaces only the **first** comma; the rest are stripped
  by the `[^0-9.\-]` filter. `1,2,3` → `1.23`.
- The doc comment says *"ambiguity resolves towards the decimal reading, because
  a grouping separator is cosmetic and a decimal point is not."* The code does
  the opposite for the only genuinely ambiguous case: a pasted European `1,500`
  (= one and a half) matches the grouping regex and becomes **1500**.

**Severity: BLOCKER.** The brief's own classification — wrong information shown
as fact, in a field the owner ships to a client in a PDF, and the pass-3 open
list already carries "Production budget maths reads 12,000 as zero" as a live
item. This fix moved it from *zero* to *twelve*, which is worse: zero looks
broken and twelve looks like an answer.
**Confidence: high** on the typed path (pure string tracing; the draft round-trip
is visible in the code — `value={draft ?? committed}`).
**What I would do instead:** do not transform on the keystroke. Keep the raw
text in `draft` (accepting `,` as a character), and resolve the comma **on blur
/ on commit**, once, when the whole string is known. Or resolve by device locale
(`expo-localization`) instead of guessing, and show the resolved number under
the field so the user can see what the app decided. Guessing silently in a
money field is the part that cannot stand.

---

## 2. BROKEN — the eight new `MEMBER_ONLY_EXTRA_ROUTES` entries gate nothing at all

`src/screens/lab/labCatalog.ts` lines 567–581 vs
`src/navigation/RootNavigator.tsx` lines 189–200, 260–297, 477–530.

This is the pass-3 blocker inverted, and the file itself states the rule that
the change breaks: *"the wrapper is not the gate; this predicate is"* — and the
test says the other half out loud: *"the predicate without the wrapper is never
consulted."*

`isMemberOnlyLabRoute` has **exactly one consumer** in the whole repo:

```
src/features/lab/withMembershipPreview.tsx:97    const memberOnly = isMemberOnlyLabRoute(route.name);
```

(grep across `src` and `test`: the only other hits are the predicate's own
definition and the test file.) So a route that is not wrapped in
`withMembershipPreview` never asks the question. None of the eight is wrapped:

| Route | Registered as (RootNavigator) | In `MemberGated`? |
|---|---|---|
| `DigitalModule` | `Gated.DigitalModule` (line 488) | no |
| `EqModule` | `Gated.EqModule` (528) | no |
| `GainModule` | `Gated.GainModule` (530) | no |
| `EarModule` | `EarModuleScreen` (513) | no |
| `AmpModule` | `AmpModuleScreen` (515) | no |
| `TubeReference` | `TubeReferenceScreen` (477) | no |
| `TubeCard` | `TubeCardScreen` (478) | no |
| `DeEsserLab` | `DeEsserLabScreen` (524) | no |

`Gated.*` is `withAmplitudeOrientation` and checks nothing. The `MemberGated`
map (lines 260–297) contains `MeterModule` and no other module route.

So the commit's comment — *"Eight more routes sit inside or behind a paid lab
and were equally invisible to the catalog"* — is now followed by a fix that
changes the predicate's answer for eight routes nobody asks about. Net effect on
the running app: **zero**. It reads as handled and is not.

`test/membershipGating.test.ts` does not catch this: its "CHILD routes of the two
flagship labs" case (line 126) is the one assertion that checks **both** halves,
and its hardcoded `children` list was not extended with the eight. That is why
the suite is green.

**Is anything now gated that should be free?** No — I checked each parent in the
catalog. `DeEsserLab` in particular: its only catalog row is
`SmartProcessorsLab` (`labCatalog.ts:250`), in category `dynamics`,
`section: 'training'` → members-only. `SmartProcessorsLab` is itself wrapped in
`withMembershipPreview` (RootNavigator:293). So `DeEsserLab` being members-only
is correct; it just isn't enforced. Same for the other seven
(`TubeLab`/`AmpLab` = `electronics`/training, `EarTrainingLab` = `eartraining`/
training, `EqLabHome`/`GainLabHome`/`DigitalLab` = member or training).

**Severity: MINOR today** (still unreachable — none is in `linking.ts`,
`isClaimedPath` rejects them, there is no navigation-state persistence),
**BLOCKER the day anyone adds one of those paths to the linking config** — which
is precisely the sequence that produced the pass-3 blocker.
**Confidence: high.**
**Fix:** move all eight into `MemberGated` (`withMembershipPreview(...)`) in
RootNavigator, and add the eight names to the test's `children` array so it can
never pass again in this state.

---

## 3. BROKEN — `resetPopupSuppression()` is a no-op, and its comment says the opposite

`src/features/dev/popupSuppressStore.ts` lines 48–61 vs
`src/features/account/clearLocalAccountData.ts` line 72.

```ts
export function resetPopupSuppression(): void {
  suppressed = false;
  hydrated = false;     // ← "re-hydrates from the (now cleared) storage"
  hydrating = null;
}
```

The doc says *"Re-hydrates from the (now cleared) storage on the next read,
which is the correct default of OFF."* The storage is **not** cleared:

```ts
const KEEP: ReadonlySet<string> = new Set<string>([
  …
  'ape:devSuppressPopups', // dev-only override
]);
```

`hydrated = false` therefore guarantees the next `arePopupsSuppressed()` re-reads
`'1'` and restores `suppressed = true`. The wipe produces a momentary blip and
nothing else. Setting `hydrated = false` is actively the wrong move here — had
it been left `true`, `suppressed = false` would at least have stuck for the run.

Two smaller defects in the same function:

- **It does not `emit()`.** Every sibling that was added this pass does
  (`resetLowLight`, `resetMixingCommitments`). Mounted `usePopupsSuppressed`
  consumers keep their stale snapshot.
- **The doc comment is about the wrong module.** It describes Low-Light
  Production Mode; this file is the dev-menu kill switch (`ape:devSuppressPopups`,
  toggled from `DevVisualIndex`). It was pasted from `resetLowLight`'s comment.
  It also orphans the pre-existing
  `/** Current value (sync). Triggers hydration… */` line, which now sits above
  the reset instead of above `arePopupsSuppressed`.

**Severity: MINOR** — it is a dev-only flag and unreachable in release. But it is
a registered entry in the safety registry that does not do what it says, which
is the exact failure mode the registry test was written to end.
**Confidence: high.**
**Fix:** either drop the entry and EXEMPT the module ("dev-only override, on the
KEEP list by design"), or take `ape:devSuppressPopups` off KEEP. Not both halves
half-done.

The other four resets are fine — see §11.

---

## 4. PARTIAL — the queue does not cover `remove` or `duplicate`

`src/features/production/projectStore.ts` lines 197–239.

**Does it fix the stated bug?** For the paths it covers, yes. `mutate` and
`upsert` now run strictly in sequence, so each read-modify-write sees the
previous write. `setValue` / `setNa` / `acceptCondition` / `clearCondition` all
route through `mutate`. Verified: the store is a module singleton
(`projectStore()` memoises `defaultStore`), so the queue is app-wide per lab, not
per screen.

**Two write paths are still outside it:**

```ts
async remove(lab, id) {
  return write(lab, (await list(lab)).filter((p) => p.id !== id));   // read-modify-write, unqueued
},
async duplicate(lab, id) {
  const all = await list(lab);  …  all.unshift(copy);  return (await write(lab, all)) ? copy : null;
},                                                                    // read-modify-write, unqueued
```

A write outside the queue re-opens the lost-update race for everything inside
it. The concrete path is `ProductionActivityScreen.tsx:77–83` (`restart`):

```ts
await projectStore().remove(lab, project.id);   // NOT queued
const seeded = seedActivityProject(lab, pathway, activity);
await projectStore().upsert(seeded);            // queued
```

A learner types in the stage screen (one queued job per character), navigates
back, taps RESTART while a job is still pending. If `remove` reads before the
pending job writes: `remove` writes `L\{P}`, then the pending job writes `L`
back — **P is resurrected**, the restart silently did not happen, and
`upsert(seeded)` then adds a second row with the same `scenarioId`. `load()`
does `.find(p => p.scenarioId === activityId)` and returns whichever is first,
so the stale project accumulates in storage invisibly.

`duplicate` and `clearCondition` have no callers today (`duplicate` is dead
code); `remove` has one, above.

**Deadlock / rejection / ordering — I checked all three and found nothing:**
- No nesting. `mutate`'s `fn` is pure; `upsert`'s job touches only `list`/`write`.
  No serialized function calls another serialized function, so the chain cannot
  deadlock on itself.
- `.then(job, job)` runs the next job on both settle paths, and
  `queues[lab] = run.catch(() => undefined)` keeps the *chain* promise handled
  while `run` still rejects to the caller. No swallowed rejection, no unhandled
  one (all four call sites `await`). `list()` and `write()` swallow internally, so
  a job effectively never rejects anyway.
- Caller ordering is preserved: a caller's promise resolves after its own job and
  before the next one's.

**But `mutate` does NOT return the right snapshot to a controlled TextInput.**
This is the part I would look at hardest.

`ProductionStageScreen.setValue` (lines 71–85) does an optimistic
`setProject(...)`, awaits the store, then does `setProject(saved)` —
**unconditionally replacing local state with the store's snapshot.** Under the
new queue, `saved` from keystroke *k* is guaranteed to contain keystrokes 1…*k*
and, equally guaranteed, **not** *k+1…k+n*, because those jobs have not run yet.
So whenever queue depth ≥ 1, `setProject(saved)` reverts the optimistic state by
exactly the depth.

For `number` / `currency` / `duration` that is invisible — `NumberField` holds a
local `draft`. For **`longText`, `date`, `time`, `shortText` and every table
cell** (`FieldRow.tsx` 126, 144, 164, 232, 343) the TextInput is controlled
straight from `value` with no draft, so a lagging `saved` pushes an older string
into the field and resets the cursor.

Before serialising, all N in-flight jobs ran concurrently and the total latency
was one job. Now it is N × (getItem + JSON.parse + JSON.stringify + setItem) of
the **whole project list**. The commit says *"a queue costs nothing a user can
perceive"* — that is an assumption, and it is the only thing standing between
this fix and the symptom it was written to cure (characters appearing to vanish),
now produced by queue latency instead of by a race.

**Severity: MAJOR if the latency is real, MINOR if not.**
**Confidence:** high that the state revert is certain at depth ≥ 1 (pure code
reading); **low** on whether a user sees it, because I cannot measure
AsyncStorage on the owner's phones.
**What would settle it:** type a long sentence into a `longText` field on an
Android device with three or four saved projects (the tables make the JSON big)
and watch for lag or cursor jumps.
**Fix regardless:** draft-buffer the text fields exactly as `NumberField` does,
or debounce the store write (~250 ms) instead of writing per character — and put
`remove` and `duplicate` inside `serialize`.

**Not fixed, carried over from pass 4's own report:** `mutate` still returns
`null` for both "the write failed" and "the project is gone", so the stage
screen's banner still tells a user whose project was deleted to "free up some
space".

---

## 5. PARTIAL — the enrollment guard now drops a real user edit

`src/features/enrollment/enrollmentStore.ts` lines 111–149 and 159–175.

The destructive half is genuinely closed: an unconfirmed pull no longer lets a
pristine seed overwrite the master list. Good.

But `isPristineSeed` returns **true for an empty list**:

```ts
function isPristineSeed(l: EnrollTopic[]): boolean {
  if (l.length === 0) return true;
  …
}
```

and `reconcileConfirmed` can only become true if a direct select on
`user_topic_enrollments` returns rows — which, per the repo's own security review
quoted in the comment three lines above, it never does today. So
`confirmed === false` always, and the guard reduces to:

> if the local list is empty **or** the two-topic seed, never push.

Two consequences:

1. **A user who unenrolls from everything never syncs it.** That is a deliberate
   edit by someone holding the phone — the exact case the comment says it
   protects (*"A user who has actually chosen topics on this device still syncs
   normally — that is a real edit, not a seed"*) — and it is indistinguishable
   from the seed to this predicate. The server keeps their old list; the backend
   gates v3 study and quizzes on the server list; the app shows them unenrolled.
2. **A brand-new account's default seed never reaches the server at all.**
   Whether that matters depends on whether the backend needs the two free topics
   present in `user_topic_enrollments`. I cannot answer that from the repo.

Also: `reconciled = true` still latches in the `finally`, i.e. **after a failed
read**, so the pull is disabled for the whole app run after the first failure.
Moving it from before the `try` into the `finally` only covers a throw *on the
way in*. The pass-4 verifier's point (c) is half addressed.

**Severity: MAJOR** for (1) — a user action silently not taking effect on the
list that gates their paid content.
**Confidence:** high on the code; **medium** on the impact, which rests on the
security review's claim that the select returns zero rows.
**Fix:** distinguish `EMPTY_BY_USER_EDIT` from `NEVER_TOUCHED` (a `dirty` flag
set by the setters and persisted), and retry the pull on the backoff instead of
latching after one failure. And route the pull through an RPC
(`get_my_enrollments`) exactly as the push goes through `sync_my_enrollments`,
so it can actually return rows.

---

## 6. PARTIAL — `refreshEntitlement` has the identical stale-read hole, ungated

`src/features/commercial/EntitlementProvider.tsx` lines 277–302 (fixed) vs
435–466 (not fixed).

**Is `gen` threaded through every call?** Through every call of `deriveAndApply`,
yes — both sites (321, 331) pass `mine`, and `mine` is `++generation` taken once
per `deriveWithRetry`. Correct.

**Is there a path where the tier is now NEVER applied?** I went after this and
the answer is no. Specifically the `!hasSession` branch you asked about:

```ts
const current = () => alive && generation === gen && !devOverrode.current;
if (!hasSession) { if (current()) setEntitlementState('anonymous'); return true; }
```

There is **no `await` before this branch**, so it executes synchronously inside
the `deriveWithRetry` call that just did `mine = ++generation`. `generation === gen`
is true by construction, and `alive` / `devOverrode` were checked on the line
above. It always applies. And every increment of `generation` happens inside
`deriveWithRetry`, which then performs its own apply — so a superseded call
declining to write is always paired with a newer call that writes. No hole.

**But the guard is scoped inside the `useEffect`, and `refreshEntitlement` is
outside it:**

```ts
const refreshEntitlement = useCallback(async () => {
  …
  const { data: sess } = await supabase.auth.getSession();
  if (!isRealAccount(sess.session)) { setEntitlementState('anonymous'); return 'anonymous'; }
  const { data, error } = await supabase.from('entitlements')…   // ← awaits
  const tier = academyTierFromRows(…);
  if (!devOverrode.current) setEntitlementState(tier);           // ← no generation check
```

Same shape, same consequence, on a hotter path: this is what the paywall calls
after a purchase (`PaywallScreen.tsx:70`, `:216`), what restore calls, what
`AuthScreen.tsx:239` calls on sign-in, and what Settings calls on redeem. A
sign-out (or a sign-in as a different account) during the `entitlements` select
applies the previous session's tier to the current one. The window is shorter
than the one that was fixed — `getSession()` is re-read at the top — but it is
the same bug, and the commit message states the hole is closed.

**Severity: MINOR–MAJOR** (narrow window; entitlement is re-derived on the next
auth event, so it self-heals).
**Confidence: high.**
**Fix:** hoist `generation` to a `useRef` so `refreshEntitlement` can take the
same snapshot-and-recheck.

---

## 7. HOLDS, WITH A NEW HANG RISK — `withQueueLock`

`src/features/finalExam/api.ts` lines 316–337, 339–350, 353–360.

**Can it deadlock (a locked function calling another locked one)?** No. I traced
every call inside `replayExamSubmissionsLocked`: `readQueue`, `currentUserId`,
`submitFinalExam` (a bare `supabase.rpc`, line 204), `clearExamIntent`,
`writeQueue`. None of them re-enters `withQueueLock`. `enqueueExamSubmission` is
called from exactly one place, `FinalExamScreen.tsx:182`, which is outside the
lock. No nesting anywhere, so no deadlock.

**Does it drop a rejection?** No — same `.then(job, job)` /
`chain = run.catch(…)` shape as `projectStore`, and both callers handle: the
Dashboard does `replayExamSubmissions().catch(() => [])` (line 767), the exam
screen `await`s inside a `try`.

**Does `clearExamQueue` need the lock?** By construction yes — it is a bare
`AsyncStorage.removeItem(QUEUE_KEY)` and a replay that read before it and writes
after it would resurrect the deleted queue, including the *other user's* rows
that the replay deliberately keeps (`remaining.push(r)`). But it does not matter
today: **`clearExamQueue` has no callers at all** (grep across `src`). It is dead
code whose doc-comment claims a behaviour — *"Drop the queue on account switch"* —
that contradicts the current design, where the queue is on the KEEP list and
deliberately survives a sign-out. Delete it or lock it; leaving an exported
unlocked queue-destroyer next to a carefully locked pair is how the next person
re-introduces the bug.

**The new risk — the lock is held across an unbounded network loop.**
`replayExamSubmissionsLocked` awaits `submitFinalExam` once per queued row,
inside the lock. `supabase.rpc` is `fetch`, and RN's `fetch` has no default
timeout. A dead socket therefore parks the chain indefinitely, and
`enqueueExamSubmission` — which the exam screen **awaits before telling the
learner anything** (`FinalExamScreen.tsx:182`) — never resolves:

> Dashboard mounts → `replayExamSubmissions()` starts, hangs on a dead socket →
> learner navigates to the Final Exam, sits it, submits → the submit fails on the
> network → `await enqueueExamSubmission(...)` blocks forever → the screen sits on
> `setSubmitting(true)` with no dialog, and the exam is **never written to the
> queue**.

Before this commit the enqueue would have gone straight through. This is the
highest-stakes write in the app and the fix made it depend on an unrelated
network loop finishing.

**Severity: MAJOR.** **Confidence: high** on the code path, **medium** on how
often a `fetch` hangs rather than erroring.
**Fix:** do not hold the lock across the network. Take it for the read, release,
do the submissions, take it again for the write — or give the lock wait a
timeout.

Pre-existing and not introduced here, but it compounds: `queueReadable` (line
289) is a module-level `let` that is never set back to `true`, so one transient
storage read failure makes `writeQueue` refuse for the rest of the app run and
every later enqueue returns `false`.

---

## 8. HOLDS WITH CAVEATS — the wipe registry test

`test/accountWipeRegistry.test.ts`.

**Can it pass vacuously?** Not wholly — the first `it` guards the input
(`stateful.length > 20`, actual **30**; `imported.size > 15`, actual 26). But it
can pass vacuously *per file*, three ways. I reproduced the scan to check rather
than eyeballing it:

1. **It matches on BASENAME, not path.**
   `imported` is `[...registry.matchAll(/from '([^']+)'/g)].map(m => m[1].split('/').pop())`
   — so any stateful file called `store.ts` is "registered" if *any* `…/store`
   import exists. Two stateful files collide today:
   `features/careerfinder/store.ts` and `features/settings/store.ts`. Both happen
   to be imported, so the collision is benign **right now**; the mechanism is not.
   Add `src/features/foo/store.ts` holding user state tomorrow and the test says
   nothing. `api.ts`, `kit.tsx`, `patternStore.ts` are the same shape.
2. **It checks the IMPORT, never the CALL.** An import present with the reset
   never invoked passes.
3. **Would it catch a store that uses `const state = {…}` instead of `let`?**
   **No.** The filter is `/^let\s+\w+/m && /'ape:[\w:]+/`. I ran it: 8 files hold
   `const`-declared module state alongside an `ape:` key and are invisible to the
   scan — including `features/flags/flaggedStore.ts`, which *is* registered, by
   luck, not by the test. `/^let/` also requires column zero, so `export let foo`
   would be missed. And the key must be in **single quotes**: 10 files build
   their keys with backticks and are invisible for that reason alone, including
   `features/permissions/permissionStore.ts` and `features/study/paceStore.ts` —
   both of which ARE in the registry, neither of which the test protects.
   `features/study/timeTrial.ts` is the proof: its state is four `const` `Map`s,
   it is not in `stateful`, and the test did not find it. It was found by eye.

**Are the EXEMPT reasons actually true?** I checked each of the twelve.

| EXEMPT entry | Verdict |
|---|---|
| `features/account/deviceIdentity.ts` | ✅ `ape:deviceId` is on KEEP |
| `features/tools/measure/calibrationStore.ts` | ✅ `ape:splCalOffset` is on KEEP |
| `features/intro/onboardingFlow.ts` | ⚠️ true for an account switch (`isOnboardingFlag`), **false for `{ total: true }`** — AuthScreen:169 wipes a guest 100% clean per the owner's ruling, but the in-memory flags survive, so the guest still sees no intros |
| `features/lab/amplitudeOrientation.ts` | ⚠️ same caveat |
| `features/onboarding/attractStore.ts` | ❌ **wrong.** The reason claims parity with `onboardingFlow`, but its key is `'ape:homeAttract2'` — not `ape:intro:`, not `ape:coach:`, not `*FsGuide` — so it **is swept** on every account switch while the in-memory `state` survives. The module even exports `resetLocal()` documented *"Account wipe / user switch — clear all cues (clearLocalAccountData)"*, and nothing calls it. Either the exemption or the module's own doc is wrong |
| `features/review/reviewPrompt.ts` | ⚠️ reason is incomplete. `ape:review:v1` is not on KEEP, so the sweep deletes the cooldown anyway; the memory exemption only preserves it until the next launch. If the cooldown really must survive, the key belongs on KEEP |
| `features/notifications/localSchedule.ts` | ⚠️ plausible, not airtight — `lastFullSyncAt` throttles the rebuild (`FOREGROUND_THROTTLE_MS`, line 213), so a full re-sync right after a switch can be skipped. Low stakes |
| `features/finalExam/api.ts` | ✅ correct — `ape:finalExamQueue` is on KEEP by design |
| `features/production/projectStore.ts` | ⚠️ true ("a store instance, not user data") but now also holds the `queues` chain; a job that lands after the sweep can re-write a departing user's project (see §4) |
| `features/cymatics/patternStore.ts` | ✅ verified — `let defaultStore` only |
| `features/amp/ampProgress.ts` | ✅ verified — `let writeQueue` only |
| `screens/glossary/GlossaryScreen.tsx` | ✅ verified — the `let`s are `ENTRIES_CACHE`, `ENTRIES_TABLE`, `MEDIA_CACHE`, `FORMULA_CACHE`, `releaseTimer` and a lazy component. Reference data |

The third `it` (every EXEMPT entry still matches the scan) is a genuinely good
guard and it works.

**Severity: MINOR** (test quality). **Confidence: high** — I re-ran the
heuristics rather than reading them.
**Fix, in order of value:** (a) match on the resolved import PATH, not the
basename; (b) widen the state regex to `^\s*(export\s+)?(let|var)\b` plus
`const \w+ = new (Map|Set)` and `const \w+: \w+ = {`; (c) accept backtick keys;
(d) assert the reset is **called**, not merely imported; (e) fix the
`attractStore` exemption.

---

## 9. HOLDS — `useShake` `yieldToMute`. The condition is exactly right.

`src/lib/useShake.ts` lines 42–72.

**Is `isAudioOutputEnabled()` the right condition?** Yes, and it is right for a
better reason than the commit states. `ShakeToMute`
(`src/features/audio/ShakeToMute.tsx`) subscribes the accelerometer **only while
`useAudioOutputEnabled()` is true** and tears it down the instant the gate
flips. So `enabled === false` does not merely mean "nothing to mute" — it means
the mute listener is not running at all. The two conditions are the same
boolean, read from the same module. There is no window where the mute wants the
gesture and `yieldToMute` lets the study write through.

**A learner who never enables audio:** the shortcut still fires, and that is
correct. Audio output is off by default and needs a deliberate 5-second hold, so
for most of the study day `ShakeToMute` is not listening.

**Does the mute itself still work?** Yes — `ShakeToMute` is a separate component
with its own accelerometer subscription and its own thresholds (2 jolts ≥ 1.9 g
within 700 ms). It never went through `useShake` and is untouched.

**Consumers — you have all of them.** `useShake` has exactly two call sites in
`src`: `FlashcardsScreen.tsx:1175` and `StudyFsOverlay.tsx:68`. Both pass
`{ yieldToMute: true }`. Nothing else imports it.

**Two caveats.**

1. **The on-screen guides now lie.** `FlashcardsScreen.tsx:1744` prints
   "Shake to mark it Known" and `StudyFsOverlay.tsx:99` prints "Shake to go back
   a question", unconditionally, in the full-screen guide. Both are false
   whenever audio output is on, with no on-screen explanation of why the gesture
   stopped working. MINOR, but it is a stated instruction that is now sometimes
   untrue — add "(while sound is off)" or hide the line via
   `useAudioOutputEnabled()`.
2. **A sustained shake still writes.** The debounce is stamped *before* the
   yield check:
   ```ts
   if (now - last.current > 1200) {
     last.current = now;
     if (yieldToMute.current && isAudioOutputEnabled()) return;
   ```
   so the 1200 ms window is consumed by the yielded shake. The panic mute fires
   ~100 ms in and flips `enabled` false. Anyone still shaking at t = 1.25 s
   passes the check — audio is now off — and the flashcard toggles. The commit's
   own framing ("the mute owns the gesture") does not survive a shake longer than
   1.2 s, which is a plausible length for a panic gesture. MINOR; a "a mute fired
   in the last N seconds" timestamp in `panicMute` would close it.

---

## 10–19. The ones that hold clean

- **10. `tierKnown` in the memo deps** (`EntitlementProvider.tsx:538`). Correct;
  the pass-4 verifier's one-word fix landed as described.
- **11. `resetTimeTrials`** (`timeTrial.ts:292–316`). Complete — the module's
  entire state is `states`, `snapshots`, `listeners`, `timers`, and it clears the
  first three plus every interval, keeping `listeners` (they belong to mounted
  screens) and emitting so each re-reads idle. Safe with nothing initialised:
  empty `Map`s, no-op loops. The important half is `clearTimer` — an armed
  interval was the actual hazard, and it is cleared.
- **12. `resetAskModeCache`** (`permissionStore.ts:60–62`). `cache` is the only
  module state; the loop is a no-op on an empty object. ✔
- **13. `resetLowLight`** (`lowLight.ts:56–64`). Covers `on`, `touchedAt`,
  `hydrated`, `gatePending`, `tapTimes` and emits — that is all of the module's
  mutable state except the two listener sets, which correctly stay. `ape:lowLight`
  and `ape:lowLightAt` are not on KEEP so the re-hydrate genuinely reads OFF, and
  the sweep runs **before** the reset at all four call sites
  (`accountLocalSync:45-46`, `SingleDeviceGuard:57-58`,
  `DeleteAccountButton:82-83`, `AuthScreen:169-170`), which is the order that
  makes `hydrated = false` safe. Residual: `hydrate()` has no in-flight guard, so
  a read issued before the sweep can resolve after it and restore `on = true`.
  Very narrow; worth a `hydrating` promise like `popupSuppressStore` has.
- **14. `resetMixingCommitments`** (`mixing/kit.tsx:59–74`). Covers both
  `focalCurrent` and `prioritiesCurrent` and notifies both listener sets. The
  module's hydration is a one-shot import-time read, so nothing re-populates it.
  Safe with nothing mounted. ✔
- **15. `ParamLane accessible`** (`ParamLane.tsx:139`). Correct and load-bearing:
  RN defaults `accessible` to false on a `View` and iOS drives
  `isAccessibilityElement` from it alone, so the `adjustable` role and the
  increment actions really were invisible. One prop, every rack lab.
- **16. The six "professor" strings** (`finalExam/api.ts:108/110`,
  `quiz/api.ts:93/94`, `auth/api.ts:67/104`). All six replaced; no
  "professor" remains in those maps. The new copy names a real recovery path.
- **17. Six "Coming Soon" rows** (`SmartProcessorsLabScreen.tsx:17–36`). Removed
  from the array, kept in a comment. Matches the owner's standing ruling.
- **18. Profile "Full Course Certification"** → "Whole-curriculum progress" /
  "% of the whole curriculum" (`ProfileScreen.tsx:643`, `:1158`). The label no
  longer names a credential the app does not issue.
- **19. Final Exam membership wall** now offers the plans rather than only Back.

---

## 20. NEW BUG — six more careers on a live screen with no education disclosure

The commit fixed the third `rigger` by adding `requires: 'CERT'` in
`src/data/topicCopy.ts:120`. That is correct, and the structured path
(`careerRequirement.ts` → `REQUIRES_LABEL`) renders it.

But `src/data/subjectMeta.ts` carries a **plain-string** `careers:` field that
`CurriculumScreen.tsx:486–489` renders verbatim, with no lookup and no
disclosure. I cross-referenced every role name that carries a `requires` code
anywhere in `topicCopy.ts` / `credentialCopy.ts` (90 names) against those
strings. Six hits:

| File:line | Rendered string | The app's own classification |
|---|---|---|
| `subjectMeta.ts:20` | "**Acoustician**, system tech, studio designer, install/AV designer." | `DEGREE` |
| `subjectMeta.ts:24` | "System engineer, **acoustician**, QC/test technician, install tuner." | `DEGREE` |
| `subjectMeta.ts:34` | "**Research acoustician**, heritage consultant, academic, museum/AV specialist." | `DEGREE` |
| `subjectMeta.ts:38` | "**Bioacoustics researcher**, environmental scientist, sonar/defense, academia." | `DEGREE` |
| `subjectMeta.ts:182` | "Preservation/restoration engineer, **archivist**, library/museum audio." | `DEGREE` |
| `subjectMeta.ts:250` | "Stagehand, **rigger**, production manager, venue crew." | `CERT` |

`subjectMeta.ts:250` is the **fourth** rigger — the one the pass-4 commit was
hunting. It also lists "academic", "academia" and "environmental scientist",
which are obviously degree-gated and are not in the classification at all.

This is the standing HARD RULE (owner, 2026-09-15): *"we must be clear when
other education — degrees, certifications, etc. — is required for careers.
always. every time."*

**Severity: MAJOR** by the brief's "wrong information shown as fact", and it is a
named owner rule.
**Confidence: high** — the classification is the app's own, and the render site
is `CurriculumScreen.tsx:489`.
**Fix:** `subjectMeta.careers` should be `Career[]`, not a string, so it goes
through the same `REQUIRES_LABEL` path as everything else. Until then, at
minimum append the disclosure to those six strings.

---

## What I would fix first

1. **#1 — the comma parser.** It is the only BLOCKER, it is a regression the
   commit introduced, it lands in a client-facing money field, and the same
   keystrokes give 12 or 12000 depending on how fast you type.
2. **#7 — the exam lock across the network.** A hung replay can silently prevent
   the last copy of a graded capstone from ever being written.
3. **#20 — the six careers.** A named HARD RULE, live on screen, and the fix is
   data.
4. **#2 — wrap the eight routes in `MemberGated`** and extend the test's
   `children` list, before anyone touches `linking.ts` again.
5. **#5 — the enrollment guard**, so "I unenrolled from everything" is not
   silently discarded.
6. **#4 — draft-buffer the text fields / debounce the write**, and put `remove`
   and `duplicate` inside `serialize`.
7. **#3 and #6** — two small, certain corrections.
