# Bug hunt — Pass 2, agent G: end-to-end user journeys

**Date:** 2026-09-18 · **Branch:** audio-tools-engine
**Method:** source reading only. No dev server, no build, no `eas` command, no git write.
One read-only command was run: `node --test test/membershipGating.test.ts` (3/3 pass).

**Axis.** Pass 1 walked layers. This pass walks *people* — one journey end to end,
across every layer it touches — and looks at the seams, which is where a
layer-by-layer pass cannot see. Every finding below is either a seam between two
correct-in-isolation layers, or a thing a user hits only because of what they did
three screens earlier.

Findings already reported in `pass1-*.md` are NOT repeated. Where the brief asked
me to verify a pass-1 item, the verification is stated and marked **VERIFIED**.

---

## Verdicts

| # | Journey | Verdict |
|---|---------|---------|
| 1 | First run to first win | **COMPLETES.** Two edge dead ends; no blocker on the main line. |
| 2 | Free user meets a wall | **COMPLETES except one wall.** The Final Exam wall is a dead end with no way forward. Nothing owner-free is locked. |
| 3 | Becoming a member | **BREAKS.** A person with no account can be charged and has no recovery; and "your Academy access is active" is shown when it may not be. |
| 4 | The long haul (certificate) | **BREAKS.** The tenure rule is promised and not enforced; the enabled exam button walks into a refusal once it is; no celebration ever fires; the printed certificate's "Credential" ID is the user's ID. |
| 5 | Abandon and return | **BREAKS for the quiz and the exam.** Labs are clean. An interrupted attempt is presented as resumable and is not. Logging out silently destroys a queued capstone. |
| 6 | Back and deep link | **Back COMPLETES. Deep links partially BREAK.** Both known issues confirmed, plus a new consequence: Android claims URLs the JS filter then drops. |

---

# Journey 1 — First run to first win

Cold install → `SplashScreen.tsx` (2.5 s hold, session race guarded) → no
walkthrough (`FirstRunCoordinator.tsx:33` `FIRST_RUN_ENABLED = false`, parked by
the owner 2026-09-08) → `AuthScreen.tsx` with `AppWelcomeOverlay` (9 s forced
dwell) → Guest or account → `CourseSelectionScreen` (Home) → free topic →
`DashboardScreen` rack → `FlashcardsScreen` / `FillInBlankScreen` /
`MatchingScreen` / `ScenariosScreen` → `QuizScreen` → `CelebrationScreen`.

**The main line completes.** The rack's staged unlock, the free-topic seeding
(`enrollmentStore.ts:43` `FREE_ENROLL_GS = [3060, 3970]`) and the quiz→celebration
hand-off all connect. Two seams do not.

---

### J1-1 · Signing in from inside the calculator destroys the calculator you were in

**Severity:** MAJOR · **Confidence:** high

**Where:** `src/screens/lab/calc/CalcWorkspaceScreen.tsx:266-278` →
`src/screens/auth/AuthScreen.tsx:86-89` (`toHome`), `:263`, `:283`

**What the user does:** A guest opens a calculator (the Calculator Lab is
`alwaysFree`, `labCatalog.ts:448`), types their values, and reaches the wall:
*"Create a free account (or sign in) to run calculations"* with a
**SIGN IN / CREATE ACCOUNT** button.

**What happens:** the button does `navigate('Auth')`, which *pushes* the sign-in
screen over the calculator. On success `AuthScreen` calls `toHome()`:

```ts
const toHome = () => {
  navigation.reset({ index: 0, routes: [{ name: 'Main', params: { screen: 'Home' } }] });
  resume();
};
```

The `reset` throws the whole stack away. The user lands on Home. The calculator,
the workspace they chose and every value they typed are gone. They must find the
lab again, find the workspace again, and re-enter the numbers — which in this app
are often transcribed off a rig.

**What should happen:** the wall pushed Auth, so Auth should pop back to it.
`navigation.goBack()` when `navigation.canGoBack()` (the screen already renders a
RETURN affordance on exactly that condition, `AuthScreen.tsx:369`), falling back
to the reset for the app's own entry point.

**Why I believe it:** `reset({index:0, routes:[Main]})` is unambiguous, and the
same `toHome` serves both the cold entry point and this pushed one. The identical
shape affects the guest topic gate (`CourseSelectionScreen.tsx:1660-1663`), though
there the user is already on Home so the cost is only the forgotten topic.

---

### J1-2 · Three celebration buttons are labelled actions and are silently "close"

**Severity:** MINOR today, MAJOR the day credential celebrations are wired
**Confidence:** high

**Where:** `src/screens/results/CelebrationScreen.tsx:127-141`

```ts
case 'view-summary':
case 'view-requirement':
case 'share':
// eslint-disable-next-line no-fallthrough
case 'dismiss':
default:
  toStudy();
```

**What the user does:** taps **SHARE**, **VIEW SUMMARY** or **VIEW WHERE IT
APPLIES** on a celebration. **What happens:** the celebration closes and they are
`reset` onto the Study Dashboard. Nothing is shared, no summary appears. On the
credential cards SHARE sits beside body copy that says the credential *"can be
viewed, shared, and independently verified"* (`catalog.ts:222`, `:234`, `:247`,
`:260`), and `VIEW WHERE IT APPLIES` is the **primary** action on
`requirement-complete` (`catalog.ts:209`).

**Mitigating:** those celebrations are currently unreachable — see **J4-3**. Today
only `topic-complete` and `perfect-score` can fire, and neither carries these
kinds. So this is latent, not live. It becomes live the moment the credential
queue is connected, and the file's own comment concedes the buttons "are not built
yet".

**What should happen:** don't render an action whose kind has no destination.

---

### Checked in journey 1 and found nothing

- The quiz→celebration hand-off (`QuizScreen.tsx:147-186`) correctly pops the
  study stack first, converts the raw score to a percentage, and carries the
  graded result so REVIEW RESULTS needs no re-fetch.
- Hardware back from `Celebration` lands on the Dashboard (the `popToTop()` at
  `QuizScreen.tsx:147` already reset the study stack) — the same place DONE goes.
- `withAmplitudeOrientation` does not gate the orientation lab against itself
  (`RootNavigator.tsx:486-489`).
- The free-topic seed re-keys correctly after the v3 renumber
  (`enrollmentStore.ts:29-46`).

---

# Journey 2 — Free user meets a wall

I walked every wall a free or guest user can hit. **Nothing the owner calls free
is locked.** Verified:

- **Pro Audio Safety (gs3060) and DAW Fundamentals (gs3970)** — `studyGate.ts:34-48`
  exempts exactly these two, and it fails *closed* only for a pseudo-topic with no
  `global_sequence`.
- **Calculator Lab** — `labCatalog.ts:448` `alwaysFree: true`;
  `labMembership.ts:43-47` subtracts `alwaysFree` from both the section rule and
  the leaf rule; the cap (`calcUsage.ts`) fails *open* when the RPC is missing.
- **The 31 pass-1 lab-gating holes** — **VERIFIED FIXED.**
  `node --test test/membershipGating.test.ts` → 3/3 pass, including "EVERY
  members-only route is registered through `withMembershipPreview`".

One wall is a genuine dead end, and the set as a whole is inconsistent.

---

### J2-1 · The Final Exam's membership wall has no way forward

**Severity:** MAJOR · **Confidence:** high

**Where:** `src/features/finalExam/api.ts:97` ·
`src/screens/exam/FinalExamScreen.tsx:349-373`

**What the user does:** a free or lapsed user reaches `AwardProgress` (from
Profile, the Credential Wall, the Awards chooser or Course Selection) and taps
**Take Final Exam**.

**What happens:** `start_final_exam` raises `academy_required`. The screen renders:

> Academy membership is required to take a Final Exam.

`canRetryStart` is `startErrorCode === 'offline' || 'unknown'`
(`FinalExamScreen.tsx:354`), so the only control drawn is **Back**. There is no
SEE PLANS, no GET MEMBERSHIP, no paywall route. This is the *most* expensive wall
in the app — the user got here by finishing a whole certificate's topics — and it
is the only one that does not offer the purchase.

**What should happen:** `academy_required` should render the same
**GET MEMBERSHIP → Paywall** affordance every other wall does.

---

### J2-2 · Seven different wall designs, in four different voices

**Severity:** MINOR · **Confidence:** high

A free user hitting the app's edges meets, in one session:

| Wall | Component | Headline | Way forward |
|---|---|---|---|
| Members-only lab | `UpgradeSheet.tsx` | ACADEMY MODE | SEE PLANS |
| Paid topic's study method | `StudyAccessSheet.tsx` | ACADEMY STUDY | UNLOCK ACADEMY ACCESS + *start a free topic* |
| Tool save | `MembershipGate.tsx` | 🔒 ACADEMY MEMBERSHIP | GET MEMBERSHIP |
| Guest taps paid topic | `PrePaywallPrompt` (`CourseSelectionScreen.tsx:1652`) | Create a free account | CREATE FREE ACCOUNT |
| Calculator weekly cap | `confirmDialog` (`CalcWorkspaceScreen.tsx:172`) | Weekly limit reached | See membership |
| Calculator, no account | inline (`CalcWorkspaceScreen.tsx:266`) | — | SIGN IN / CREATE ACCOUNT |
| Final Exam | plain text (`FinalExamScreen.tsx:349`) | — | **none** (J2-1) |

Each is individually honest. Together they read as several products. Worth one
consolidation pass after launch; not a launch blocker.

---

### J2-3 · The Calculator Lab is *locked*, not capped, for a no-account guest

**Severity:** MINOR · **Confidence:** high (behaviour) / unsure (intent)

**Where:** `CalcWorkspaceScreen.tsx:120` (`mustSignIn`), `:266-278`

`capped` is `free || lapsed`; `anonymous` gets `mustSignIn` instead, which hides
the answer entirely with no allowance at all. Meanwhile the Ear Lab draws the
Calculator Laboratory as the one unlocked hub for that same guest
(`EarLabScreen.tsx:92-93`, `:149`). So a guest is shown an open door and then
refused at every calculation. That may be the intended funnel — but the label and
the behaviour disagree, and the funnel then runs into **J1-1**. *Would settle it:*
the owner saying whether a no-account guest gets any free calculations.

---

### J2-4 · Most "Audio Fundamentals" labs are members-only — flagging the premise

**Severity:** none (informational) · **Confidence:** high

The task framed the Audio Fundamentals labs as free. In the catalog, the
`fundamentals` section contains 15 leaves and **12 carry `member: true`**, each
with an owner date attached — e.g. `labCatalog.ts:159` (Sound Playground),
`:160` (Microphone Principles), `:141` (Speaker Coverage), and the whole Signal
group at `:151-176` with the note *"Owner 2026-08-23: now member-only along with
the rest of Signal."* Free in that section today: **Understanding Level &
Amplitude**, **Foundations of Sound**, **Wave Physics Laboratory**.

I did not treat this as a bug — the code cites explicit, later owner rulings — but
the brief's premise and the catalog disagree, and only the owner can say which is
current.

---

# Journey 3 — Becoming a member

Paywall → store sheet → `purchaseUpdatedListener` → `validate-purchase` edge
function → `entitlements` row → `refreshEntitlement()` → every `useEntitlement`
consumer re-renders.

**What works, verified:** the mid-session unlock is genuinely live. A tier change
produces a new memoized context value (`EntitlementProvider.tsx:440-463`), the
Dashboard recomputes its gates in render (`DashboardScreen.tsx:1330-1339`), and a
lab already showing its paywall scrim drops it without a relaunch
(`withMembershipPreview.tsx:70-73`). The "don't buy while unresolved" guard
(`PaywallScreen.tsx:120-128`) and the three-state Restore
(`purchase.ts:198-243`) are both well built.

The journey breaks at both ends: who is allowed to start it, and what they are
told at the finish.

---

### J3-1 · A person with no account can be charged, and has no way to recover

**Severity:** BLOCKER · **Confidence:** high

**Where:** `src/screens/commercial/PaywallScreen.tsx:118-148` ·
`supabase/functions/validate-purchase/index.ts:187-215`

**What the user does:** enters Guest Mode (or follows a deep link while signed
out — see **J6-3**), taps **MEMBERSHIP** on Course Selection
(`CourseSelectionScreen.tsx:1420`), picks a plan, taps **CONTINUE**, and pays.

**What happens:** `onContinue` checks three things — `resolved`, `isMember`,
`available` — and **never whether there is an account.** `entitlement ===
'anonymous'` falls straight through to `buyPlan`. The store charges the card.
The receipt reaches `validate-purchase`, which needs an authenticated caller:

```ts
const authUid = auth.user?.id;
if (!authUid) return json({ ok: false, error: 'not_authenticated' }, 401);   // :188
…
if (!userId) return json({ ok: false, error: 'no_user_row' });               // :215
```

`validateWithServer` maps every failure to `false` (`purchase.ts:91-99`), so the
user is told:

> We couldn't verify that purchase. **If you were charged, use Restore Purchases.**

Restore runs the same validation and returns `'error'`, whose copy is
*"We couldn't reach the store — check your connection"* (`PaywallScreen.tsx:186`).
The user has paid, is told it is a connection problem, and **no screen anywhere
suggests creating an account.** Because `finishTransaction` is only called in the
`ok` branch (`purchase.ts:123-127`), on Google Play the unacknowledged purchase is
**auto-refunded at 72 hours** with no in-app signal either way.

**What should happen:** `onContinue` must refuse an anonymous session and route to
account creation — exactly the guard `accessCode.ts:75-80` already applies to the
*free* code path. Money deserves at least the guard the giveaway has.

---

### J3-2 · "Your Academy access is active" is shown when it may not be

**Severity:** BLOCKER · **Confidence:** high

**Where:** `PaywallScreen.tsx:48-60` (`welcome`), `:69-78` (`reflectPurchase`);
same shape on restore at `:159-170`

```ts
refreshEntitlement().catch(() => false).then((ok) => {
  setBusy(false);
  if (ok) { welcome(); return; }        // welcome() = "Welcome to Academy / Your Academy access is active. Enjoy!"
```

`ok === true` means only **"a read completed"**. `refreshEntitlement` returns
`true` while setting the tier to `'anonymous'` for a guest session
(`EntitlementProvider.tsx:378-381`) and returns `true` for a read that legitimately
came back `'free'` or `'lapsed'` (`:391-393`).

So a buyer whose entitlement row has not committed yet (or the guest of **J3-1**)
is congratulated, taps **Great**, is `goBack()`-ed — or deep-linked straight into
the content they paid for — **and it is still locked.** Reopening the Paywall shows
the full sales screen again with no acknowledgement of the purchase, and the only
escape is the Restore they were just told they did not need.

**What should happen:** branch the alert on the resulting tier (`entitlement ===
'academy'`), not on the boolean. The false branch already has good copy and a
Retry — it is simply reached on the wrong condition.

---

### J3-3 · Leaving the Paywall mid-purchase abandons the purchase permanently

**Severity:** MAJOR · **Confidence:** high

**Where:** `PaywallScreen.tsx:112-115` → `purchase.ts:152-160`

The Paywall's effect cleanup calls `teardownPurchases()`, which nulls `handlers`
and removes both listeners. A `purchaseUpdatedListener` event arriving after that
has nowhere to land: `validate-purchase` is never called, the entitlement row is
never written, `finishTransaction` is never called.

**Nothing resumes it.** `initPurchases` and `restorePurchases` have exactly two
call sites in the repo — `PaywallScreen.tsx:99` and `:156`. There is no boot-time
reconcile and no `AppState` re-check on the commercial path. The store *will*
re-deliver the unfinished transaction, but only if the user happens to reopen the
Paywall; nothing tells them to. On Google Play the clock to auto-refund is again
72 hours.

Backgrounding is safe (the Paywall is `presentation: 'modal'`,
`RootNavigator.tsx:529`, so it is not unmounted). Tapping ✕ or Android back is not.

---

### J3-4 · Validation failure cannot tell "you are offline" from "we rejected you"

**Severity:** MAJOR · **Confidence:** high

**Where:** `purchase.ts:81-100`, one `boolean`, versus the documented
`RestoreResult` triad at `:198-208`

Transport error, 401, `not_verified`, `no_user_row` and `grant_failed` all become
`false`, and all produce *"We couldn't verify that purchase."* A buyer who is
merely offline reads that as a rejection of their money. The team already
identified and fixed exactly this defect on the restore path — the docblock at
`:198-208` spells out the reasoning — and did not port it to the path that takes
payment.

---

### J3-5 · "Code applied" is shown when the refresh failed

**Severity:** MINOR · **Confidence:** high
**Where:** `SettingsScreen.tsx:101-114`

`submitRedeem` awaits `refreshEntitlement()` and discards its return value, then
notifies *"Code applied — your Academy access is active"* while the app is still
showing FREE and everything is still locked. The Paywall handles this same case
properly with a Retry/Later dialog (`PaywallScreen.tsx:79-96`). Settings does not.

*(Note: pass-1 entitlement reported a "Code applied when the refresh failed" item.
If that is the same line, treat this as a VERIFY: it is still present at
`SettingsScreen.tsx:107,110`.)*

---

### J3-6 · An admin grant never reaches a running app

**Severity:** MINOR · **Confidence:** high

The only `postgres_changes` subscription in the app is
`SingleDeviceGuard.tsx:122-130`. Entitlement is re-read at provider mount, on
`SIGNED_IN`/`SIGNED_OUT`/`INITIAL_SESSION`, and on an explicit
`refreshEntitlement()` — nothing else. An owner comping an account from the admin
console does not reach an app that is open; the user must relaunch, sign out and
in, or redeem a code. Nothing in the UI says so, so the support answer to
"I comped you, it's not showing" is undiscoverable.

---

### J3-7 · Two smaller honesty gaps on the purchase screen

**Severity:** MINOR · **Confidence:** high

- `available` starts optimistically `true` (`PaywallScreen.tsx:44`) and nothing in
  the rendered screen changes when init reports `false` (`:109-111`). On a build
  shipped without expo-iap's native half, the user sees a fully working store and
  only learns it cannot sell when they tap CONTINUE (`:136-142`).
- **Restore Purchases exists only on the Paywall** (`:353`). Settings →
  MEMBERSHIP (`SettingsScreen.tsx:627-649`) has Status and Redeem code but no
  Restore, so a returning member who reinstalls has to guess that the *sales*
  screen is where you recover a purchase you already made.

---

# Journey 4 — The long haul (a member earns a certificate)

Enrol (`AwardsScreen.tsx:659-675` / `EnrollmentScreen.tsx:658`) → many topics →
`AwardProgressScreen` → `FinalExamScreen` → `FinalExamResultScreen` →
`CredentialWall` / Profile → certificate PDF.

This journey has the most seams and the most breaks.

---

### J4-1 · The membership-tenure rule is promised in the UI and not enforced

**Severity:** BLOCKER · **Confidence:** high on the code, medium on live state

**Where:** `supabase/migrations/2026091801_paid_month_before_credential.sql:22-25`
and `:211-223` · `AwardsScreen.tsx:416-418` · `AwardProgressScreen.tsx:276-278`

Two screens state the rule as fact:

> Credentials are granted after one complete month of paid membership.
> *(`AwardProgressScreen.tsx:277`)*

The migration that enforces it says, in its own header:

```
-- The rule has been STATED in the app since 2026-07-22 (AwardsScreen) and has
-- never been ENFORCED. This migration is the enforcement.
--
-- NOT YET APPLIED — see docs/APE_MEMBER_TENURE_FOR_COMP_A.md.
```

and the actual gate is a **manual hand-edit of the live `start_final_exam` body**
(`:211-223`), not something the migration applies.

**So, as shipped, there is no tenure gate at all:** someone can subscribe, burn
through a short certificate and be issued a credential on day one, against a rule
the app tells them applies. That is a promise the product does not keep, in the
direction that costs money.

*Would settle it:* reading the live `start_final_exam` body for
`member_month_complete`. I did not, and must not, touch the database.

---

### J4-2 · The enabled "Take Final Exam" button walks members into refusals

**Severity:** MAJOR · **Confidence:** high

**Where:** `src/screens/awards/AwardProgressScreen.tsx:245-262` ·
`src/features/finalExam/api.ts:78-112`

The client's unlock rule is topic completion only (`features/awards/api.ts:139`).
The server can refuse for **seven** other reasons: `academy_required`,
`paid_tenure_required`, `already_earned`, `award_content_incomplete`,
`pool_too_small`, `under_lockout`, `user_not_found`. None of them is reflected on
AwardProgress, so the green button is fully live, the member taps it, the exam
screen mounts, and the refusal is the first they hear of it — on a Back-only error
screen (**J2-1**).

Compounding it, the two disclosures disagree about **what** the month gates:

- `AwardsScreen.tsx:417` — "…required before a **certificate can be granted**."
- `finalExam/api.ts:102` — "A **Final Exam opens** after one complete month…"

The server gates the exam *start*. A member reading the Awards wording reasonably
expects to be allowed to sit the exam and have the certificate held back, and is
instead turned away at the door. And because the refusal carries no date
(deliberately — `api.ts:98-100`), a member who has done everything **cannot find
out when they become eligible**. There is no "eligible on ⟨date⟩", no counter, and
nothing on AwardProgress that changes state.

Finally, `CredentialDetailModal.tsx` — now the primary enrol surface
(`AwardsScreen.tsx:893-905`, `:962-974`, `CourseSelectionScreen.tsx:1606`) — never
mentions tenure at all. The two screens that do state it are both skippable.

---

### J4-3 · No celebration ever fires for a credential — the whole tier is unreachable

**Severity:** MAJOR · **Confidence:** high

**Where:** `src/features/celebration/celebrationQueue.ts` ·
`src/screens/quiz/QuizScreen.tsx:176`

`credentialCelebration()` and `resolveCelebrations()` — the functions that decide
`first-certificate`, `certificate-earned`, `first-program`, `program-complete` and
`multiple-credentials` — have **no caller in `src/`**. The only references in the
whole repo outside their own module are in `test/celebration.test.ts`. The single
place anything navigates to `'Celebration'` is `QuizScreen.tsx:176`, which raises
only `topic-complete` or `perfect-score`.

So the strongest moment in the product — the one the catalog calls *"the
strongest, and the rarest"* (`catalog.ts:213`) — produces nothing. The same is true
of `subject-complete`, `requirement-complete` and `lab-complete`. A member who
finishes a certificate sees `FinalExamResultScreen`'s green box and that is all.

The tested, written logic is sitting there unconnected. This is a wiring gap, not
a design gap.

---

### J4-4 · The printed certificate's "Credential" ID is the *user's* ID

**Severity:** MAJOR · **Confidence:** high

**Where:** `src/features/credentials/certificatePdf.ts:73-82` ·
`src/features/credentials/certificateHtml.ts:250`, `:261`, `:146`, `:155-171` ·
`src/features/profile/api.ts:151-161`

`exportCertificate` fetches `fetchMyQrToken()` — the **user's** permanent
`my_identity().qr_token` — and passes it as `qrToken`. `buildCertificateHtml` then
derives `shortId` from it and prints it under the label **"Credential"**
(`:261`), repeats it in the microprint as `REGISTERED CREDENTIAL ${shortId}`
(`:146`), and feeds it to `idGlyphSvg(uuid)` whose own comment claims:

> *"Deterministic per credential — a swapped name/ID won't reproduce it."*

It is deterministic **per user**. Every certificate and every program the same
member downloads carries an identical "Credential" ID, identical microprint and an
identical anti-forgery glyph. The security property the comment asserts does not
hold for the thing the field is labelled as.

**Related, same path:** the QR resolves to `registryUrl(qrToken)` — the member's
*registry page*, not a per-credential verification — and `public_verify_by_token`
is gated on `users.show_in_registry` (documented at `profile/api.ts:185-191`). A
member who has not opted into the registry gets a certificate printed with
"Scan to verify" (`certificateHtml.ts:265`) pointing at a page that will not
resolve them. *(Server side inferred from that comment; I could not read the RPC.)*

---

### J4-5 · "Manage My Learning" — where people land after enrolling — has a dead exam button and no route to the real one

**Severity:** MAJOR · **Confidence:** high

**Where:** `src/screens/enrollment/EnrollmentScreen.tsx:1116-1130` and `:1215-1218`

```tsx
<Pressable style={styles.finalExamBtn} disabled …
  // The button is a placeholder that never enables (not even at 100%),
  accessibilityLabel="Take Final Exam — not available yet">
  <Text style={styles.finalExamText}>TAKE FINAL EXAM</Text>
```

Enrollments is the **terminal** page of the Awards pager (swipe-locked,
`AwardsScreen.tsx:82-83`) and the page the user is dropped onto after enrolling
(`:624-630`). `grep AwardProgress src/screens/enrollment/EnrollmentScreen.tsx` →
**0 hits**. So a member who completes 100 % of a certificate and returns to the
screen where they enrolled sees a grey, permanently disabled TAKE FINAL EXAM and
no link to the screen where the exam actually works.

The working entry points are `CredentialWall.tsx:236`, `AwardsScreen.tsx:680`,
`CourseSelectionScreen.tsx:1606` and `ProfileScreen.tsx:674` — none of which is
where the flow deposits them.

**What should happen:** either enable the button through `AwardProgress`, or
replace it with a "View progress ›" link. A disabled control that never enables is
worse than no control, because it reads as "not yet" forever.

---

### J4-6 · A missing award date also deletes the Credential ID from the document

**Severity:** MINOR · **Confidence:** high
**Where:** `certificateHtml.ts:261`

```ts
const metaHtml = date ? `<div class="metadata">…Awarded…${shortId ? `…Credential…` : ''}</div>` : '';
```

`shortId` is nested inside the `date` ternary. A credential whose `earned_at` is
null or unparseable prints with **no Awarded date and no Credential ID**, even
though the token is present and the QR and microprint still render.

---

### J4-7 · Two progress counts for the same certificate

**Severity:** MINOR · **Confidence:** high

`AwardProgressScreen.tsx:210-219` counts against the server RPC
`award_required_topics`, which already unions the four standing requirements.
`ProfileScreen.tsx:658-665` counts against `b.topics.length` from the local bundle,
which holds the v3 topics only. A member can read **"3 of 3 topics complete"** on
Profile and **"3 / 7"** on AwardProgress for the same certificate.

---

### J4-8 · "It has been added to your record" is asserted regardless of issuance

**Severity:** MINOR · **Confidence:** high
**Where:** `FinalExamResultScreen.tsx:23-27` vs `:97`

The `pass` body says *"It has been added to your record"* whenever
`outcome === 'pass'`, while the green CREDENTIAL ISSUED panel is separately gated
on `result.credential_awarded`. If the server ever passes without awarding (a
re-pass of a held credential, or an insert failure), the prose claims issuance the
panel withholds.

---

# Journey 5 — Abandon and return

Leave each multi-step flow halfway and come back; then force-quit and come back.

**Clean:** the paged labs persist completed pages and last page and resume exactly
(`features/lab/pagedProgress.ts` — validated on read, so a damaged record cannot
make the dots lie). Calculator workflows persist. Lab preview state is in-memory
and re-arms from `withMembershipPreview` on re-entry.

**Broken:** the two timed assessments, in three different ways.

---

### J5-1 · An interrupted quiz or exam keeps its clock but loses its answers and its place

**Severity:** MAJOR (quiz) / BLOCKER (final exam) · **Confidence:** high on the
client, medium on the server half

**Where:** `src/features/quiz/api.ts:117-160` · `src/features/finalExam/api.ts:14-16`,
`:143-175` · `QuizScreen.tsx:79-89`, `:121-124`, `:232-248` ·
`FinalExamScreen.tsx:73-90`, `:112-118`, `:188-205`

The intent id is persisted so that "a crash/relaunch resumes the SAME attempt",
and the exam's docblock says plainly: *"Resume = re-call."* But the only state
that survives is the **server's**. On the client:

- `answers` is a `useRef({})` — in memory only, never persisted, reset on mount.
- `qIdx` is `useState(0)` — the resumed attempt restarts at question 1.
- `deadline` is `new Date(payload.started_at).getTime() + time_limit_seconds*1000`
  — computed from the **original** start, so the clock has been running the whole
  time the app was closed.

So a learner who force-quits at question 25 of 30, seven minutes in, returns to
question 1 with the same 30 questions and three minutes left and nothing recorded.
They will fail.

And if they come back after the limit has elapsed, the countdown effect fires
immediately on mount:

```ts
setMsLeft(deadline - Date.now());
const t = setInterval(() => { const left = deadline - Date.now();
  if (left <= 0) { clearInterval(t); void doSubmit(deadline); } }, 250);
```

`deadline - Date.now()` is already negative, so the **first tick auto-submits an
empty attempt**. The user taps "Take Final Exam", sees a spinner, and is handed a
graded failure for an exam they never saw.

For the quiz this is recoverable — `timed_out` carries no lockout and
`ResultsScreen.tsx:78-96` clears the intent and offers a clean Retake. For the
**Final Exam** it burns the capstone attempt; `FinalExamResultScreen` does offer a
retake for `timed_out`, so it is recoverable too, but the member has been told
their capstone failed for reasons that were not their doing.

**What should happen:** either persist `answers` + `qIdx` alongside the intent id
so a resume is a real resume, or refuse to re-open an attempt whose deadline has
passed and say so ("that attempt expired while the app was closed — starting a new
one"). The current behaviour is the worst of both: it keeps the penalty and drops
the work.

*Medium confidence caveat:* whether the server returns the expired `in_progress`
attempt or opens a fresh one is decided in `start_quiz_attempt` /
`start_final_exam`, whose bodies are not in this repo. The client-side loss of
answers and position is certain regardless. *Would settle the rest:* reading those
two function bodies.

---

### J5-2 · Logging out silently destroys a queued offline Final Exam

**Severity:** BLOCKER (data loss on a paid capstone) · **Confidence:** high

**Where:** `FinalExamScreen.tsx:157-162` · `features/finalExam/api.ts:221`
(`QUEUE_KEY = 'ape:finalExamQueue'`) ·
`features/account/clearLocalAccountData.ts:88-93` ·
`features/account/accountLocalSync.ts:44-46` · `SettingsScreen.tsx:186`

**What the user does:** finishes the Final Exam with no signal. The app promises:

> Your exam is saved and will be submitted automatically when you reconnect.
> Your finish time is preserved.

They then log out — or another device claims the account, or they enter Guest Mode
to show a friend.

**What happens:** every one of those paths runs `clearLocalAccountData()`, which
removes **every** `ape:*` key not on a five-entry KEEP allowlist:

```ts
(k) => k.startsWith('ape:') && !KEEP.has(k) && (opts?.total === true || !isOnboardingFlag(k))
```

`ape:finalExamQueue` is swept. The graded capstone is gone, permanently, with no
warning and no trace. The logout confirm says only:

> **Log out?** You can sign in as a different user afterward.

Callers of the wipe: `accountLocalSync.ts:45` (every identity change, including a
plain sign-out), `SingleDeviceGuard.tsx:57` (another device takes over),
`AuthScreen.tsx:169` (Guest Mode), `DeleteAccountButton.tsx:82`.

**What should happen:** check the queues before wiping, and either flush them or
tell the user ("You have an exam waiting to submit. Reconnect first, or it will be
lost."). At minimum the exam queue should be on KEEP and keyed by user id, the way
the intent ids are.

**Related dead code:** `clearExamQueue()` (`finalExam/api.ts:362-365`) documents
itself as *"Drop the queue on account switch so one user's exam never replays as
another's"* and has **zero callers** in the repo. The `ape:*` sweep happens to do
the job, which is why the cross-account replay it guards against does not occur —
but the protection is accidental, and the same accident is what causes the data
loss above. `clearQueuedSubmissions()` and `clearQueuedBatches()` *are* called
explicitly from the wipe (`clearLocalAccountData.ts:147-148`), so the exam is the
odd one out in both directions.

---

### J5-3 · The "Could not save your exam" state is a true dead end

**Severity:** MAJOR · **Confidence:** high

**Where:** `FinalExamScreen.tsx:163-171`

When `enqueueExamSubmission` returns false (storage full, or an unreadable queue
the code refuses to clobber), the screen deliberately holds the double-submit
latch and tells the learner:

> Stay on this screen and keep the app open — reconnect and it will submit.
> **Do not close the app.**

**Nothing on that screen retries.** There is no `NetInfo` listener and no
connectivity check anywhere in the file (the only listeners are `AppState` for the
focus-void rule at `:208-210` and `BackHandler` at `:338-345`). The countdown
interval has already been cleared at 0:00 (`:200`), and `doSubmit` is latched by
`submitted.current` (`:121`), so every path back into it returns immediately. The
instruction is unfulfillable.

The exits, meanwhile, all lose the exam: the `‹` runs `confirmExit` which wipes
(`:311-322`), and hardware back is **not** blocked here —
`if (submitted.current) return false;` (`:341`) hands the press to the default
handler, which pops the screen.

There is also a cruel loop in the instruction itself: reconnecting means leaving
the app, and this same screen's anti-cheat has already warned that an app switch
voids the attempt.

**What should happen:** a **Try submitting again** button in this state, and a
connectivity listener that retries on reconnect.

---

### Checked in journey 5 and found nothing

- `pagedProgress.ts` — resumes cleanly, validates on read.
- `labPreviewStore` — in-memory, correctly re-armed by `withMembershipPreview` on
  re-entry, and `beginLabPreviewLeave` holds the scrim through the pop.
- The quiz's deliberate exit is honest: *"Your answers will be wiped immediately.
  The quiz allows no pause or save."* — it just does not mention that the clock
  keeps running (see J5-1).

---

# Journey 6 — Back, and deep links

### Hardware back from every terminal screen — **no findings**

I traced each one. `gestureEnabled: false` only blocks the iOS swipe, so Android
hardware back pops these screens; in every case the screen underneath is correct:

| Screen | Below it | Why it is right |
|---|---|---|
| `Celebration` | `Main` (Study/Dashboard) | `QuizScreen.tsx:147` already `popToTop()`-ed the study stack |
| `Results` | `Main` (Study/Dashboard) | same |
| `Trophy` (viewer) | wherever it was opened | it is a viewer, not a terminal |
| `FinalExamResult` | `AwardProgress` | the exam used `replace`, not push (`FinalExamScreen.tsx:143`) |
| `Quiz` | — | `BackHandler` → wipe-confirm (`QuizScreen.tsx:299-303`) |
| `FinalExam` | — | `BackHandler` → wipe-confirm (`:338-345`), except the J5-3 state |
| 7 modal screens | presenting screen | standard modal dismiss |

---

### J6-1 · **VERIFIED** — seven declared deep links are rejected by the app's own filter, and Android claims them anyway

**Severity:** MAJOR · **Confidence:** high

`isClaimedPath` (`linkPaths.ts:133-136`) requires `more.length === 0` for the
`labs` family — i.e. at most two segments. These seven three-or-more-segment paths
are declared in `linking.ts:87-95` and can never be accepted:

```
labs/cymatics/plate      labs/cymatics/liquid      labs/cymatics/membrane
labs/cymatics/gallery    labs/cymatics/module/:id
labs/production/:lab/:projectId/:stageId
labs/production/:lab/exercise/:activityId/:pathway
```

Pass 1 (navigation, labs-content) reported this; it is **still present**.

**New, and this is the cross-layer half:** `app.json` declares an
`autoVerify: true` Android App Link on `pathPrefix: "/labs"` for both hosts. So on
Android the OS *does* hand these URLs to the app — and `filter: isAcceptedLink`
(`linking.ts:46`) then silently drops them, and `setPendingLink` rejects them too
(`pendingLink.ts:33`). The user taps a share link to the Cymatics gallery, the app
opens, and they land on Home with no message and no way to get where they were
going. Not claiming a URL leaves it with the website; claiming it and then
dropping it is strictly worse than either.

---

### J6-2 · **VERIFIED** — `app.json` has no `ios.associatedDomains`

**Severity:** MAJOR · **Confidence:** high

```
ios keys: ['supportsTablet', 'bundleIdentifier', 'infoPlist']
associatedDomains: None
```

Both `https://` prefixes in `linking.ts:42` are inert on iOS. Every one of the
**18** Android intent-filter entries has no iOS counterpart, so on iPhone every
`proaudiotrainingacademy.com` link opens Safari and the app is never offered. Only
`proaudio://` works. Pass 1 (navigation) reported this; confirmed still true.

---

### J6-3 · A deep link for a signed-out user opens the destination *instead of* the sign-in screen

**Severity:** MAJOR · **Confidence:** high

**Where:** `src/screens/SplashScreen.tsx:76-90`

React Navigation resolves a cold-start link to `[Splash, Target]`
(`initialRouteName: 'Splash'`, `linking.ts:52`). Splash then rebuilds the stack:

```ts
const base = signedIn ? 'Main' : 'Auth';
const pushed  = …routes.filter(r => r.name !== 'Splash')…;         // [Target]
const baseRoute = pushed.find(r => r.name === base) ?? { name: base };  // {name:'Auth'}
const above = pushed.filter(r => r !== baseRoute && (signedIn || r.name !== 'Main')); // [Target]
navigation.reset({ index: above.length, routes: [baseRoute, ...above] });  // [Auth, Target]
```

Only `Main` is filtered out for a signed-out user. Everything else is carried over
**on top of** `Auth` — so a person with no account who taps `proaudio://labs/eq`,
`…/awards/specialization` or `…/directory` never sees the sign-in screen at all;
they are dropped straight onto the destination.

For a members-only lab the membership scrim does engage correctly
(`withMembershipPreview`), so nothing paid leaks. But the resulting path is:

> marketing link → members-only lab → UpgradeSheet → **SEE PLANS** →
> `navigationRef.navigate('Paywall')` (`LabPreviewOverlay.tsx:36-41`) → **CONTINUE**

…which is a straight line from an advertisement to **J3-1**: a purchase by someone
with no account, which cannot be validated and cannot be recovered. This is the
single most likely way a real customer reaches that bug.

It also means "NOT NOW" on that sheet drops the user onto a bare sign-in screen
they never asked for, with no explanation of why they are there.

**What should happen:** for a signed-out user, carry the destination into
`pendingLink` (the machinery already exists and already runs) and show `Auth`
first, rather than presenting the destination above it. `clearPendingLink()` is
called only on the signed-*in* branch (`SplashScreen.tsx:83`), so the pending path
is still held — it is simply redundant, because the screen was pushed anyway.

---

## Summary, worst first

| # | Severity | Journey | Finding |
|---|---|---|---|
| J3-1 | **BLOCKER** | 3 | A guest with no account can be charged; validation fails; copy blames the connection; no recovery; Play auto-refunds at 72 h |
| J3-2 | **BLOCKER** | 3 | "Your Academy access is active" fires on "a read completed", not on being a member |
| J5-2 | **BLOCKER** | 5 | Logging out silently wipes a queued offline Final Exam the app promised to submit |
| J4-1 | **BLOCKER** | 4 | The one-month tenure rule is stated as fact in two screens and is not enforced |
| J5-1 | **BLOCKER/MAJOR** | 5 | Resume keeps the clock, drops the answers and the place; an expired attempt auto-submits blank on re-entry |
| J3-3 | MAJOR | 3 | Leaving the Paywall mid-purchase abandons validation permanently; nothing resumes it |
| J3-4 | MAJOR | 3 | Validation failure cannot distinguish offline from rejected |
| J4-2 | MAJOR | 4 | The enabled Final Exam button ignores seven server-side refusals; no eligibility date anywhere |
| J4-3 | MAJOR | 4 | No credential celebration can ever fire — the queue has no caller |
| J4-4 | MAJOR | 4 | The certificate's "Credential" ID is the user's registry token; the anti-forgery glyph is per-user |
| J4-5 | MAJOR | 4 | "Manage My Learning" shows a permanently dead TAKE FINAL EXAM and never links to the working one |
| J5-3 | MAJOR | 5 | "Could not save your exam" is a dead end — no retry, no reconnect listener |
| J2-1 | MAJOR | 2 | The Final Exam membership wall offers only Back |
| J6-1 | MAJOR | 6 | VERIFIED — 7 lab deep links rejected by `isClaimedPath`; Android claims them and then drops them |
| J6-2 | MAJOR | 6 | VERIFIED — no `ios.associatedDomains`; all 18 https paths inert on iOS |
| J6-3 | MAJOR | 6 | A signed-out deep link opens the destination above `Auth` — the shortest route to J3-1 |
| J1-1 | MAJOR | 1 | Signing in from inside a calculator resets the stack and loses the entered values |
| J3-5 | MINOR | 3 | "Code applied" shown when the entitlement refresh failed |
| J3-6 | MINOR | 3 | An admin grant never reaches a running app |
| J3-7 | MINOR | 3 | `available=false` invisible until CONTINUE; Restore missing from Settings |
| J4-6 | MINOR | 4 | A missing award date also removes the Credential ID from the printed document |
| J4-7 | MINOR | 4 | Profile and AwardProgress show different denominators for the same certificate |
| J4-8 | MINOR | 4 | "Added to your record" asserted regardless of `credential_awarded` |
| J1-2 | MINOR | 1 | SHARE / VIEW SUMMARY / VIEW WHERE IT APPLIES are silent closes (latent) |
| J2-2 | MINOR | 2 | Seven wall designs in four voices |
| J2-3 | MINOR | 2 | The Calculator Lab is locked, not capped, for a no-account guest |
| J2-4 | — | 2 | Informational: 12 of 15 "Audio Fundamentals" leaves are `member: true` by owner ruling |

## Suggested order

1. **J3-1** and **J3-2** — both are money, both are small edits (an account check
   in `onContinue`; branch the alert on the tier instead of the boolean).
2. **J5-2** — one condition before the `ape:*` sweep.
3. **J4-1** — a decision, not a fix: apply the tenure gate, or remove the two
   sentences that promise it. Shipping with both as they are is the bad case.
4. **J5-1 / J5-3** — the timed assessments. Persist the answers, or refuse an
   expired resume and say so.
5. **J6-3 / J6-1 / J6-2** — deep links, all three together: widen `isClaimedPath`
   for the `labs` family, add `ios.associatedDomains`, and route a signed-out link
   through `Auth` via the `pendingLink` that is already being set.
6. **J4-2 / J4-5 / J2-1** — the certificate path's dead ends, one pass.
7. **J4-3** — wire the celebration queue that is already written and tested.
8. **J4-4** — the printed credential's identity fields, before any certificate is
   shared publicly.

## What I did not check

- Any server function body (`start_quiz_attempt`, `start_final_exam`,
  `submit_*`, `public_verify_by_token`, `member_month_complete`). Two findings
  (J4-1, J5-1) carry a stated dependency on them.
- Whether the tenure migration has been applied to the live database.
- Runtime behaviour of any kind — no device, no simulator, no dev server.
- Store-side behaviour (StoreKit / Play Billing re-delivery timing). The 72-hour
  Play auto-refund is a platform rule, not something I read in this repo.
