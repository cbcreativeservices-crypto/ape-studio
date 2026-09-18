# Bug hunt — PASS 2, agent B: the network / Supabase boundary

Scope: every `supabase.from(...)`, `.rpc(...)`, `.functions.invoke(...)` and raw
`fetch` in `src/`, plus all five edge functions under `supabase/functions/`.
Axis: what the app does when the boundary goes wrong — error checked or not,
fail-open vs fail-closed, loading states that never end, unmount/stale-response
races, retry paths, and anything the server should decide but the client does.

Pass-1 `pass1-entitlement.md` was read first; nothing it reported is repeated
here. Two of its findings are **re-opened below because the fix does not work**
(§1 and §6) — those are flagged explicitly.

Severity per the brief. Confidence stated on every finding.

---

## 1. BLOCKER — a Google refund notification revokes membership with **no verification at all**; the 2026-09-17 fix is dead code

**File:** `supabase/functions/store-notifications/index.ts:331-360`
(the `voided?.purchaseToken` branch), with `markRefunded` at `:218-250`.

**Confidence: high** on the code path (it is a pure-logic proof, below).
Medium on how often it fires in the wild — that depends on Google's feed.

### The code

```ts
if (voided?.purchaseToken) {
  const sku = decoded.subscriptionNotification?.subscriptionId ?? '';     // :347
  const truth =
    (sku ? await googleTruth(voided.purchaseToken, sku, 'subs')   : null) ?? // :349
    (sku ? await googleTruth(voided.purchaseToken, sku, 'in-app') : null);   // :350

  const n = await markRefunded(admin, [voided.purchaseToken], 'google voided purchase'); // :355
  return ok('google: voided purchase', { rows: n, verified: truth ? truth.revoked : '…' });
}
```

`decoded` is a `GoogleRtdn` (`:378-382`). A Google Real-Time Developer
Notification carries **exactly one** of `oneTimeProductNotification`,
`subscriptionNotification`, `voidedPurchaseNotification` or `testNotification`.
So inside the `voided` branch, `decoded.subscriptionNotification` is always
`undefined` ⇒ `sku` is always `''` ⇒ both ternaries at `:349-350` short-circuit
to `null` ⇒ **`truth` is always `null`, on every request, forever.** The two
`googleTruth` calls are never made. `truth` is then used only to decorate the
response body at `:358`, which nobody reads.

`markRefunded` at `:355` runs unconditionally, on the request body alone. It
sets `status:'refunded'`, `refunded_at: now`, and `member_since: null`.

### Why this matters

The file's own header (`:10-24`) states the security model as the whole design:

> "A notification is used ONLY as a trigger … and never as evidence of WHAT
> changed. The function then asks Apple or Google directly … and acts on that
> answer alone. A forged notification can therefore do exactly one thing: cause
> us to re-check a transaction against the store and confirm it is fine."

On the Google voided path that sentence is false. The endpoint is public
(`--no-verify-jwt`), there is no JWS/Pub/Sub signature check anywhere in the
file, and the only thing in front of it is `STORE_NOTIFY_SLUG`, which the file
itself calls "noise reduction, not security" (`:392-395`). The comment at
`:352-354` says the order id is not used as a match key because it is
"attacker-controlled on a public endpoint" — but the purchase token, which *is*
used, arrives on the same attacker-controlled body.

Two distinct consequences:

1. **Adversarial.** Anyone who learns the slug and any valid purchase token
   (a user's own device holds theirs) can POST a synthetic
   `voidedPurchaseNotification` and revoke that entitlement. The victim drops to
   `lapsed` (`EntitlementProvider.academyTierFromRows:140` — `status !== 'active'`
   is skipped, so `active` stays false), **and** `member_since: null` means
   `start_final_exam` raises `paid_tenure_required` forever after
   (`features/finalExam/api.ts:84`). Paying again restarts the clock from zero
   (`validate-purchase:269-270`), so the damage to a credential is permanent.

2. **Non-adversarial, and the more likely one.** `GoogleRtdn.voidedPurchaseNotification`
   carries `refundType` (`:381`) and the code never reads it. `refundType: 1` is
   a *quantity-based partial* refund. Google's voided-purchases feed also
   replays historical voids when a subscription to the topic is (re)created.
   Every one of those revokes the member's entire entitlement and wipes their
   tenure, unverified.

### What should happen

A void must be confirmed against Google before it is acted on, exactly as the
Apple path does (`:308-328`: `appleTruth` → `if (truth.revocationDate)`). The
SKU is genuinely absent from a voided notification, but Google's
`purchases.voidedpurchases.list` is the resource designed for this and takes no
SKU; failing that, the entitlement row already on file carries the plan, so the
SKU can be looked up from `entitlements.store_ref = purchaseToken` before the
verification call rather than fished out of the request body. Until one of those
lands, the honest behaviour is to log and change nothing — the header already
says returning 200 on an unconfirmable rumour is correct.

### Note

Pass 1 §"Google verification on the voided path is called with the wrong
argument" reported the earlier version of this (`packageName` passed where the
SKU belongs). The `CORRECTED 2026-09-17` comment at `:342-346` replaced the wrong
argument with an argument that is always empty, and left the unconditional
`markRefunded` in place. **The bug is not fixed; it is now silent instead of
404-ing.** Please re-open it.

---

## 2. BLOCKER — a graded offline quiz is permanently deleted on a timeout, an abort, or any unrecognised server error

**File:** `src/features/quiz/api.ts:244-250`

```ts
} catch (e) {
  if (/network|fetch/i.test((e as Error).message)) break; // still offline
  console.warn('[quiz] dropping rejected queued submission:', (e as Error).message);
  deleteQueuedSubmission(r.attempt_id);
}
```

**Confidence: high.** This is the same defect that was found and fixed on the
final-exam queue the day before, and the fix was not carried across.

**What the user does.** Takes a quiz with no connection. `enqueueSubmission`
persists the answers (`:201-220`). On the next Dashboard focus,
`replayQuizSubmissions()` runs (`DashboardScreen.tsx:722`).

**What happens.** If the replay fails with anything whose message does not
contain the literal substring "network" or "fetch", the row is `DELETE`d and the
attempt is gone — never graded, never recorded, unrecoverable. Messages that do
**not** match:

- `JWT expired` (PostgREST `PGRST301`) — the ordinary case when a session lapsed
  while the device was offline, which is *exactly* the population that has a
  queued submission.
- `Aborted`, `timeout`, `The request timed out` — a slow first request on a
  recovering connection.
- A Supabase gateway 5xx, whose body is not PostgREST JSON, so `error.message`
  is a status line or empty string.
- Any RLS/permission error.

**What should happen.** Exactly what `features/finalExam/api.ts:331-355` now
does, whose comment states the rule and the reason:

```
// WIDENED 2026-09-17. This tested only /network|fetch/, so a TIMEOUT or an
// ABORT — neither of which contains either word — fell through to the
// `else` and PERMANENTLY DELETED a graded capstone the server had never seen.
// The rule now: a row is dropped ONLY on a positive, permanent server rejection.
```

and which keeps the row on an unrecognised error. The quiz queue is on the old,
narrow test. Given the exam file's own note that "the least valuable data in the
app had the best protection", the quiz queue is now the one left behind.

Note also: `replayQuizSubmissions` uses `break` on the offline case, so a single
poisoned row at the head stops the whole queue — but it is deleted first, so the
queue does not wedge. The problem is the deletion, not the loop.

---

## 3. BLOCKER — queued study progress is deleted on a non-network error, and the enrollment bug in §5 makes exactly that error happen every cycle

**File:** `src/features/study/sync.ts:137-142`, with `isNetworkError` at `:36-39`

```ts
function isNetworkError(e: unknown): boolean {
  const msg = e instanceof Error ? e.message : String(e);
  return /network|fetch failed|Failed to fetch|timeout|abort/i.test(msg);
}
…
} catch (e) {
  if (isNetworkError(e)) return;                  // still offline — try next loop
  console.warn('[study-sync] dropping rejected queued batch:', (e as Error).message);
  deleteQueuedBatches(g.map((r) => r.id));        // ← permanent
}
```

**Confidence: high** on the code; **high** on reachability once §5 is granted.

`replayQueue` is the single arbiter that drops a batch, and `flushOnce:233`
deliberately routes *every* failed live flush into the durable queue so this
function decides its fate (`:224-238`). So this `delete` is where a study
session actually dies.

`isNetworkError` is wider than the quiz one but still misses `JWT expired`, an
RLS denial, and any `record_study_progress` `RAISE`. Per
`docs/APE_GOVERNANCE_DECISIONS_2026_08_06.md` R3, `record_study_progress`
branches on the v3 enrollment list — so a user whose `user_topic_enrollments`
row is missing (see §5) gets a **deterministic, non-network rejection** on every
single batch. The queue then deletes every batch it holds, every cycle, silently:
flashcards viewed, questions answered and engagement seconds all vanish, and the
Dashboard LEDs and the quiz gate never move.

**What should happen.** Adopt the final-exam rule: drop only on a *positive,
permanent* server rejection (a known `invalid_event`-class raise), keep and retry
anything unrecognised, and surface a persistent-failure state to the user rather
than deleting their work. A bounded age or attempt cap is the right way to stop
the queue growing without end.

---

## 4. MAJOR — a transient read failure blanks a member's entire Dashboard, and the blank is presented as fact and cached

**Files:** `src/features/dashboard/api.ts:198-206`, `:272-287`, `:139`, `:157`,
`:163`; `src/screens/dashboard/DashboardScreen.tsx:841`.

**Confidence: high.**

### The three defects, in one function

```ts
// api.ts:196-206
let userId = 'local';
try {
  const { data: user } = await supabase.from('users').select('id, nickname').single();
  if (user) { userId = user.id; … }
} catch {
  // no account — device-local only
}
```

`supabase-js` **resolves** with `{ data: null, error }`; it does not throw. So
the `catch` is unreachable for every real failure mode, and a network blip, a
5xx, or an RLS hiccup on the `users` read leaves `userId === 'local'` with the
comment asserting "no account" about a signed-in member.

```ts
// api.ts:272-287
if (userId !== 'local') {
  const [{ data: prog }, { data: mRows }] = await Promise.all([ … ]);
  for (const p of (prog ?? []) as TopicProgress[]) progressByTopic.set(…);
  methodRows = (mRows ?? []) as MethodProgressRow[];
}
```

Two consequences chain:
1. `userId === 'local'` ⇒ **the two progress queries are never issued at all.**
2. Even when they are issued, both `error` fields are destructured away. A
   failure yields `null` ⇒ `?? []` ⇒ empty.

`resolveItemCounts` (`:139`, `:157`, `:163`) discards its three errors the same
way, so the per-topic term denominator collapses to 0.

### What the user sees

`fetchEnrollmentDashboard` throws only on `achErr` (`:248`), so none of this
reaches `DashboardScreen`'s error branch. The screen renders normally with:

- every topic `status: 'locked'` (`DashboardScreen.tsx:820-824` computes the
  frontier from `progressByTopic`, which is empty → frontier 0),
- every study-method meter at 0% (the device-local mirror at `:787-812` masks
  some of it, but `student_achievement_progress` has no local mirror at all),
- the flashcards→homework→quiz power sequence back at stage one, which the
  standing rule says renders as *powered-off panels, not an error*, so the
  learner is told nothing is wrong,
- `setGuest(isGuest)` keyed on the session (`:750`), so the "your progress isn't
  saved" notice does **not** appear either.

`setDashboardCache(d, idx)` at `:841` then stores that zeroed snapshot, and
`DashboardScreen.tsx:572/588/589` seed state from it, so every later mount paints
the blank instantly. It clears only on a later successful focus refetch.

**What should happen.** Check `error` on the `users` read and on both progress
reads, and treat a failure as the error+Retry state the screen already has
(`:845-857`) — never as "this member has done nothing". Distinguish "no account"
(`error === null && data === null`) from "the read failed". Do not write a failed
load into `dashboardCache`.

---

## 5. MAJOR — the enrollment list never re-syncs after it gives up, and the server list is what gates study and quizzes

**File:** `src/features/enrollment/enrollmentStore.ts:67-109`, `:160`, `:169`

**Confidence: high** on the client behaviour (grep-verified: `scheduleServerSync`
has exactly two callers, both local mutations). **Medium** on the server-side
consequence, which rests on the governance doc rather than on the function body,
which I cannot read. See "what would settle it".

`sync_my_enrollments` is called from exactly two places:

- `commit()` (`:169`) — a local add/remove/favourite/active/reorder, and
- the one-time v3 re-key migration (`:160`).

There is **no sync on sign-in, on app foreground, or on boot.** The retry ladder
(`:86-106`) is bounded at `MAX_SYNC_RETRIES = 4` (~1.5s→3s→6s→12s ≈ 23 seconds
total) and then gives up permanently with a `console.warn`.

**What the user does.** Signs in on a train, or signs up on a flaky connection.
The seed of the two free topics fires `scheduleServerSync()` (`:160`); all five
attempts fall inside the same bad ~23 seconds; `syncRetries` resets to 0 and
nothing ever tries again.

**What happens.** `user_topic_enrollments` stays empty on the server while the
device shows the user correctly enrolled (the local list is authoritative for
display — `:16-18`). Per `docs/APE_GOVERNANCE_DECISIONS_2026_08_06.md` R3:

> "A topic is studiable/quizzable when the student has it in **My Enrollments**
> (`user_topic_enrollments`) … Study/quiz RPCs (`record_study_progress`,
> `start_quiz_attempt`) branch on the v3 curriculum id"

so `start_quiz_attempt` raises `not_enrolled` → the learner is shown **"You are
not enrolled in this course."** (`features/quiz/api.ts:91`) for a topic the app
lists as enrolled, with no retry and no way to act on the message. And
`record_study_progress` rejects on every batch, which is the trigger for §3 —
their study progress is then deleted rather than queued.

The only escape is to toggle something in the enrollment list, which nothing
tells the user to do.

**What should happen.** Re-arm the sync on `SIGNED_IN` and on app foreground, and
persist a dirty flag so a give-up is retried on the next launch rather than
forgotten. A cheap, correct version: keep a `syncedAt`/`dirty` marker next to
`ape:enrollmentList` and call `scheduleServerSync()` from the same
`onAuthStateChange` the other guards already subscribe to.

**What would settle it:** read the live `start_quiz_attempt` body and confirm the
`not_enrolled` raise reads `user_topic_enrollments`. If it does not, this drops
to MINOR (a stale server mirror with no user-visible effect).

---

## 6. MAJOR — the "error vs empty" fix on the credential walls is dead code; a failed read still reads as "you have earned nothing"

**Files:** `src/features/credentials/api.ts:35-99`;
`src/features/achievements/api.ts:56-63`, `:70-85`, `:173-178`, `:208-216`;
`src/screens/achievements/CredentialWall.tsx:71-78`, `:110-118`.

**Confidence: high.**

`CredentialWall` was hardened for precisely this class:

```tsx
// CredentialWall.tsx:69-78 — comment: "a rejection used to collapse into
// 'COMING SOON — none available yet' … reporting 'you're offline' as
// 'these don't exist' (launch audit 2026-09-09)."
fetchEarnedCredentialsByType(kind).then(setRows).catch(() => setFailed(true));
fetchNearestCredential(kind).then(setNearest).catch(() => setFailed(true));
```

But neither call can reject:

- `fetchEarnedCredentialsByType` (`achievements/api.ts:173-178`) delegates to
  `fetchMyCredentials`, whose entire body is inside one `try { … } catch { return [] }`
  (`credentials/api.ts:36/97-99`) and which returns `[]` on the `users` read
  failing (`:39`), on the awards read erroring (`:46`) and on any throw.
- `fetchNearestCredential` (`:208-216`) awaits `fetchV3Certs()` / `fetchV3Programs()`
  — the **lenient** wrappers, `Strict().catch(() => [])` (`data/v3Curriculum.ts:167/203`)
  — and `fetchTopicAchievements`, which catches inside `internalUserId`
  (`achievements/api.ts:56-63`) and discards the progress read's `error` (`:75`).
  Neither rejects.

So `setFailed(true)` can only ever fire via `fetchAwardProgress` (`:244`), which
is one narrow sub-read. The error card at `CredentialWall.tsx:110-118` is
effectively unreachable, and what the user actually gets on a failed read is
`0 EARNED` in the header (`:157`), no rows, and the waiting slot rendering
`{ kind: 'none_published' }` (`achievements/api.ts:216`, reached because the
lenient catalog fetch returned `[]`) — i.e. the "COMING SOON" state the comment
says it fixed.

The same `error`-discard at `achievements/api.ts:75` means the whole Achievements
trophy grid renders every topic `locked` (`:98`) for a member who has earned
them.

**What should happen.** `fetchMyCredentials` and `fetchTopicAchievements` need
the `Strict`/lenient split `v3Curriculum.ts:34-46` already established for this
exact reason, and the walls need to consume the strict variants. `fetchGalleryV3`
in the same file already does it right (`:161`: `if (error) throw error;` with a
comment naming the class) — that is the model.

---

## 7. MAJOR — a member's public directory profile shows zero credentials when one of two RPCs fails

**File:** `src/features/directory/api.ts:348-383`

```ts
const [p, c] = await Promise.all([
  supabase.rpc('community_profile_public', { p_token: token }),
  supabase.rpc('community_profile_public_credentials', { p_token: token }),
]);
if (p.error) return null;
…
credentials: ((c.data ?? []) as Record<string, unknown>[]).map(…)
```

**Confidence: high** on the code; medium on frequency.

`c.error` is never checked. If the credentials RPC fails while the profile RPC
succeeds, `c.data` is `null` ⇒ `?? []` ⇒ the "VERIFIED CREDENTIALS" block is
skipped entirely (`AudioCommunityDirectoryScreen.tsx:190`, gated on
`data.credentials.length`). A member who shares their directory link is shown to
a prospective employer as holding **no credentials at all**, stated as fact, with
no error, no retry, and no way for either party to tell.

The likeliest trigger is not a blip: it is the failure mode this codebase has
already been bitten by — a public-catalog RPC that has a policy but no `GRANT`,
per `project_v3_credential_rls` ("silent empty catalog"). If
`community_profile_public_credentials` loses (or never had) its grant, **every**
public profile shows zero credentials, permanently, and the credentials directory
quietly stops being a credentials directory.

This is the one un-hardened read in an otherwise exemplary file — the same module
carefully separated `ok`/`none`/`error` for the owner's *own* profile (`:130-141`)
and gave list reads a `ListResult` union (`:400-404`) for exactly this reason.

**What should happen.** Return a three-state result here too, and render
"couldn't load credentials — retry" rather than an authoritative empty list.

---

## 8. MAJOR — the free-tier calculator cap is fully defeated by turning off the network

**Files:** `src/features/lab/calcUsage.ts:42-48`, `:53-64`;
`src/screens/lab/calc/CalcWorkspaceScreen.tsx:156-172`

**Confidence: high** on the behaviour (it is explicit and deliberate); this is a
judgement call on whether the trade-off is the right one, not a coding mistake.

```ts
// calcUsage.ts — const OPEN = { …, allowed: true, unavailable: true }
// consumeCalc(): any error, any throw, RPC missing → return OPEN
```
```tsx
// CalcWorkspaceScreen.tsx:166-170
if (u.unavailable) {
  // Server unreachable / RPC not yet deployed → fail open: reveal, no count.
  setConsumedSig(inputSig);
  return;
}
```

A free/lapsed account gets 5 calculations a week. Calculators compute **locally**
— the RPC is only the meter. So a free user in aeroplane mode gets **unlimited**
calculations, forever, with no counter and no paywall. The brief's rule is fail
CLOSED on entitlement; this is the paid/free boundary of the Calculator
Laboratory, the app's largest feature (53 workspaces), and it is open to anyone
who swipes down a control centre.

**What should happen.** The pattern to fix it is already in this codebase:
`features/glossary/glossaryCap.ts:132-147` (`consumeLocal`) keeps a device-local
rolling-week window in AsyncStorage for guests. Reusing that as a **floor** when
the server is unreachable — count locally, reconcile upward on the next
successful `calc_consume` — keeps offline calculators working (which is the
legitimate reason for the fail-open) without handing out an unlimited allowance.

The glossary's own fail-open (`glossaryCap.ts:73-103`) is a different matter and
I am **not** reporting it: the glossary corpus cannot load offline in the first
place, so the cap is not bypassable the same way.

---

## 9. MAJOR — the Tube Reference tells a paying member they are not a member whenever the server hiccups

**Files:** `supabase/functions/tube-image/index.ts:75-92`;
`src/screens/lab/tube/tubeRefs.ts:181-189`;
`src/screens/lab/tube/TubeCardScreen.tsx:486-490`

**Confidence: high** on the code path; medium on frequency.

Server side:

```ts
const { data: ents } = await userClient.from("entitlements")… // :75  error DISCARDED
const entitled = !!acad && acad.status === "active" && …
if (!entitled) return json({ error: "forbidden" }, 403);      // :84
…
const { data: tube } = await userClient.from("tubes")…        // :87  error DISCARDED
if (!tube) return json({ error: "not_found" }, 404);          // :92
```

Client side:

```ts
const status = (error as { context?: { status?: number } }).context?.status;
return { url: null, reason: status != null && status >= 400 && status < 500 ? 'auth' : 'network' };
```

Every 4xx — including the 404 for a stem missing from the `tubes` catalog and the
400 for a malformed body — is mapped to `'auth'`, which renders:

> "The 12AX7 card needs an active Academy sign-in — sign in and try again."

**Three ways a paying member reaches that line:**

1. The `entitlements` select at `:75` errors transiently → `ents` is `null` →
   `entitled` is false → **403**. (Refusing the signed URL on an unreadable
   entitlement is *correct* — that is fail-closed on entitlement. Telling the
   member they aren't signed in is not; the honest answer is "we couldn't check
   right now, retry".)
2. The `tubes` catalog read at `:87` errors, or the table lacks a `SELECT` grant
   for `authenticated` — the documented RLS-plus-GRANT trap from
   `project_v3_credential_rls` — → **404** → `'auth'` for every member, on every
   card, permanently.
3. A stem naming drift between `TUBE_REFS` (`tubeRefs.ts:76-140`) and the `tubes`
   table → 404 on that one card → the member is told to sign in.

The copy at `TubeCardScreen.tsx:485` was itself written to fix the mirror-image
bug ("auth failures used to say 'check your connection' — advice RETRY could never
satisfy"); the mapping now overcorrects in the other direction.

**What should happen.** The edge function should distinguish "not entitled"
(403) from "we could not determine entitlement" (503) and from "no such card"
(404), and `fetchTubePage` should carry all three back so the card can say the
true thing. At minimum, stop folding 404 into `'auth'`.

---

## 10. MAJOR — a Google purchase is never acknowledged when validation cannot reach the server, and Google auto-refunds it after 3 days

**Files:** `src/features/commercial/purchase.ts:81-100`, `:117-148`, `:150-170`;
`src/screens/commercial/PaywallScreen.tsx:99-115`

**Confidence: high** on the code and on Google's acknowledgement rule;
medium on how many users hit the window.

`validateWithServer` (`:81-100`) returns `false` for **both** "the server said
`ok:false`" and "we could not reach the server". In the purchase listener:

```ts
const ok = await validateWithServer(purchase);
if (ok) { await iap.finishTransaction({ purchase, isConsumable: false }); handlers?.onSuccess(); }
else     { handlers?.onError('We couldn’t verify that purchase…'); }
```

`finishTransaction` is what acknowledges the purchase on Google Play. Google
**automatically refunds and revokes any purchase not acknowledged within 3 days.**

Two things make the window realistic rather than theoretical:

- The listeners are registered by `initPurchases` only while `PaywallScreen` is
  mounted, and `teardownPurchases()` on unmount calls `l.remove()` on both and
  nulls `handlers` (`:151-170`, `PaywallScreen.tsx:113-114`). A purchase that
  completes after the user navigates away — or that arrives while the app is
  cold — has **no listener at all**. It is only re-delivered when the user next
  opens the paywall. The usual guidance is to register the purchase listener at
  the app root for exactly this reason.
- `restorePurchases` (`:215-242`) only calls `finishTransaction` when validation
  *succeeds*, so a restore during the same outage does not rescue it either.

If the seven edge-function secrets are unset — a known open item in the owner's
launch notes — `validate-purchase` returns `ok:false` for *every* buyer, nothing
is ever acknowledged, and every Android purchase silently reverses itself 72
hours later while the buyer has been told "use Restore Purchases".

**What should happen.** Distinguish `ok:false` (server verified, refuse) from a
transport failure (unknown, retry) in `validateWithServer`; register the
purchase listeners at the app root rather than only on the paywall; and add a
foreground retry that re-attempts validation for any unfinished purchase
`getAvailablePurchases()` still reports.

Pass 1 listed "the client does not `finishTransaction` on failure" under
*checked and found nothing*. That is right for a genuine verification failure and
wrong for an outage — which is the fail-open-on-infrastructure half of the rule.

---

## 11. MINOR — the curriculum term counts can be a silent partial count

**File:** `src/features/curriculum/curriculumStats.ts:81-92`

```ts
for (let from = 0; ; from += PAGE) {
  const { data, error } = await supabase.from('glossary_topics')…range(from, from + PAGE - 1);
  if (error || !data || data.length === 0) break;      // ← error and "done" are the same exit
  …
}
```

An error on page *n* is indistinguishable from "the last page", so the loop
exits and the partial tally is published as `termsByGs`. A topic with 40 terms
can show "12 terms" as a fact on the Curriculum screen. Display-only, hence
MINOR — but it is the same error-as-empty shape. The totals path above it
(`:29-47`) handles its errors correctly and returns `null`; the paging loop
should do the same and set `termsByGs` to an unknown state.

**Confidence: high.**

---

## 12. MINOR — the final-exam queue latches itself shut for the rest of the app run

**File:** `src/features/finalExam/api.ts:266`, `:276-282`

`queueReadable` is a module-level flag set to `false` by any `readQueue`
failure, and **never set back to `true`**. After one transient AsyncStorage read
error, `writeQueue` refuses for the remainder of the process, so
`enqueueExamSubmission` returns `false` for every subsequent offline submit.

The direction is safe (it refuses rather than clobbering, and it reports `false`
so the caller can be honest), which is why this is MINOR rather than a BLOCKER.
But it never recovers even after storage does. A re-read attempt before
refusing, or clearing the flag on a successful `readQueue`, would fix it.

**Confidence: high.**

---

## 13. MINOR — `StudySession.flush()` can reject, producing a recurring unhandled rejection

**File:** `src/features/study/sync.ts:199-239`, `:242-263`; callers
`FlashcardsScreen.tsx:524`, `FillInBlankScreen.tsx`, `MatchingScreen.tsx`

`flushOnce()` opens with `await replayQueue()` (`:212`), which calls the
**synchronous** `getQueuedBatches()` → `db.getAllSync(...)`
(`studyQueueStorage.native.ts:44`). That throws on a damaged or full database —
this repo already records a `SQLITE_FULL` incident (`quiz/api.ts:135`). The throw
escapes `flushOnce` before the `try` at `:220`, so `flush()` rejects; the 30-second
timer calls it as `void this.flush()` (`:174`) and `stop()` is called as
`void s.stop()`, so each becomes an unhandled promise rejection every cycle.

The data is not lost — `stop()`'s `finally` (`:250-262`) still persists the
buffer — so this is MINOR. Wrapping the `replayQueue()` call at `:212` in its own
try/catch would contain it and let the live flush proceed.

**Confidence: medium-high** — I have not reproduced the SQLite throw, only traced
the path from a failure mode this codebase has already seen.

---

## 14. MINOR / verification item — the `lab-audio` edge function is not in this repo

**File:** `src/features/lab/labAudio.ts:63`

`supabase.functions.invoke('lab-audio', …)` is called, but `supabase/functions/`
contains only `admin-codes`, `on-weekly-concept`, `store-notifications`,
`tube-image` and `validate-purchase`. If the function is deployed but not
committed, that is a source-of-truth gap worth closing before launch; if it is
not deployed, the gateway 404 maps to `reason: 'not_found'` (`:69`) and every lab
audio asset silently reports "no such asset" rather than "unavailable".

The client side itself is correct — it never throws and separates
`auth`/`not_found`/`network` (`:56-87`). **Confidence: high** that the file is
absent from the repo; **unknown** whether it is deployed. `supabase functions
list` would settle it.

---

## 15. MINOR — `on-weekly-concept` push payload can exceed Expo's 4 KiB message limit

**File:** `supabase/functions/on-weekly-concept/index.ts:239-257`

The `data` object carries the **entire** concept card — `what_it_is`,
`misconception`, `correction`, `why_it_matters` — inside the push message. Expo's
push service rejects a message over 4 096 bytes with `MessageTooBig`, which lands
in `ticketData?.status !== 'ok'` → `expoStatus = 'failed'` (`:271`) and the user
simply never receives that week's push. The email transport still works, so this
degrades rather than breaks.

It is worth measuring the four fields' combined length across the concept table
before launch; if any row is near the limit, send an id in `data` and let the app
fetch the card.

**Confidence: medium** — the limit and the failure mode are certain; whether any
real row exceeds it I could not check (the concepts live in Supabase).

Two smaller notes on the same function, neither worth its own entry: Expo push
receipts are never read, so a `DeviceNotRegistered` token is never cleared
(`:259-274`); and the per-user loop is fully serial with up to two network calls
each, so a large subscriber list will hit the edge-function wall clock — the
delivery row is inserted *before* the send (`:217-232`), so users the timeout
cuts off are marked "fired today" and silently skipped rather than retried on the
next 15-minute tick.

---

## Checked specifically, and correct as written

Recording these so the next pass does not re-walk them.

- **`src/data/v3Curriculum.ts`** — the `Strict`/lenient split (`:34-46`) is the
  right model and is correctly implemented: the strict variants reject on
  `error` and resolve `[]` only for a genuine empty set, the session memo never
  caches a failure (`:60-69`), and `fetchV3ProgramsStrict`/`fetchV3CertsStrict`
  check every one of their four errors. The problem in §6 is that the *lenient*
  wrappers still feed screens that need the strict ones — not this file.
- **`CurriculumScreen.tsx:149-166`** — uses the lenient fetch but compensates
  correctly: it treats `flat.length === 0` as `'error'` because a real
  171-topic curriculum is never empty, and offers Retry. `credCounts` renders
  `0` as `null` → "Loading", so a failed count is not shown as a fact.
- **`src/features/directory/api.ts`** (everything except §7) — `MyProfileLoad`
  three-states the owner's own profile with an explicit docblock on why
  (`:130-141`), `SaveResult` and `ListResult` do the same for writes and lists,
  and `searchDirectory` separates `ok` from `error`. Model code.
- **`src/screens/glossary/GlossaryScreen.tsx` + `deviceKeyState.ts`** — I chased
  the `if (alive && keyReady) setLoading(false)` at `:1692` expecting a permanent
  spinner on a failed device-key mint. It is not reachable: `setKeyFailedOpen(true)`
  (`:1165`) feeds `gatewayDeployed: false` into `deviceKeyState` (`:1098`), which
  returns `'ready'` (`deviceKeyState.ts:49`), so `keyReady` flips true and the
  load proceeds on the legacy relation. `probeGateway` also correctly refuses to
  cache a transient failure (`glossaryGateway.ts:59-64`). No finding.
- **`SplashScreen.tsx:33-52`** — `getSession()` is guarded against both rejecting
  *and* hanging (a 5-second `Promise.race`), so the boot cannot stick.
- **`EntitlementProvider.tsx`** — re-verified §1's read path: the bounded retry
  can only raise a tier, generations cancel stale reads, `resolved` flips in
  `.finally()`, `tierKnown` gates the notification mirror. Nothing to add to
  pass 1.
- **`awards/api.ts:75-101`** — the one place that gets the `Promise.all`
  partial-failure right: `achErr ?? progErr ?? credErr` is checked and any one
  of them produces the failed state, with a comment naming the class (B-174).
  §7 is the same shape done wrong; this is the template.
- **`SingleDeviceGuard` + `singleDevice.ts`** — fails open on every path
  (`isDisplaced` returns `false` on a null active device and on any error), the
  realtime channel is best-effort with a synchronous stale-channel sweep, and
  the poll is the backstop. Correct direction throughout.
- **`SessionExpiryGuard.tsx`** — the anonymous-session and intentional-sign-out
  exemptions are both right; it cannot bounce a guest to login.
- **`accountLocalSync.ts`** — the `(prev ?? '') === identity` comparison and the
  anonymous-maps-to-guest rule are both correct, and the clear-then-write
  ordering around `ape:localUserId` is right.
- **`ScenariosScreen.tsx:220-247`** — the exemplary version of error-vs-empty:
  a failed homework load is `'error'` and explicitly does **not** record the
  scenario exemption, because doing so "would falsely unlock the quiz". Exactly
  the reasoning §4 and §6 are missing.
- **`settings/store.ts` + `SettingsScreen.tsx:79-84`** — a null prefs result is
  correctly discriminated as guest-vs-failure by `prefs == null && resolved &&
  !isGuest`, with a Retry. (`updateNotificationPref:275-287` would report success
  on a zero-row `UPDATE`, but the screen's `if (!prefs) return` makes that
  unreachable.)
- **`finalExam/api.ts:308-359`** — the widened transient/permanent split is
  correct and is the standard §2 and §3 should be held to.
- **`DeleteAccountButton.tsx:72-88`**, **`accessCode.ts`**, **`commercialAuth.ts`**,
  **`paceRecords.ts`**, **`tools/telemetry.ts`**, **`academyStats.ts`** — all
  check `error` explicitly and fail in the safe direction. Nothing to report.
- **`validate-purchase/index.ts`** — beyond what pass 1 covered, I checked the
  `isApple` platform inference (`:203`): a client cannot route itself to a
  weaker verifier, because both paths verify against the real store and a
  mis-routed request simply fails. No client-supplied value is trusted for a
  decision the server owns.
- **`admin-codes/index.ts`** — agreed with pass 1. The only nit: `codeRow`
  (`:397-400`) escapes `<` but not quotes when interpolating `r.note` into
  markup, and `r.code` goes into an inline `onclick` string (`:387`). Both values
  are minted or typed by the authenticated admin themselves behind five factors,
  so there is no meaningful attacker. Not a finding.

## Not checked

- **Live server function bodies.** `start_quiz_attempt`, `record_study_progress`,
  `redeem_access_code`, `sync_my_enrollments`, `glossary_consume`, `calc_consume`
  and the `community_profile_*` family are all read through their call sites
  only. §5 in particular rests on the governance doc's statement of the rule
  rather than the deployed SQL.
- **Whether `lab-audio` is deployed** (§14), and whether the `tubes` table
  carries a `SELECT` grant for `authenticated` (§9, cause 2). Both are one
  dashboard query away.
- **`supabase/functions/` deployment state generally** — I read the committed
  source; I did not confirm which version is live.
- Realtime channel behaviour under reconnection beyond `SingleDeviceGuard`.
- Anything outside the network boundary: audio, rendering, navigation, lab
  content. Those belong to the other agents.

## Suggested order of work

1. §1 — it revokes paying members' access and their credential eligibility from
   a public endpoint with no verification, and the fix it appears to have
   received does not run.
2. §2 and §3 — both destroy graded/earned work. §2 is a five-line change: copy
   the transient/permanent split from `finalExam/api.ts:345-355`.
3. §5 — cheap to fix (re-arm the sync on `SIGNED_IN` and on foreground) and it
   is the trigger that makes §3 fire repeatedly for a real user.
4. §4 and §6 — the same one-line class (`error` destructured away) in the two
   screens a member looks at to see what they have achieved.
5. §10 — before any Android selling happens.
6. §7, §8, §9 — then the MINORs.
