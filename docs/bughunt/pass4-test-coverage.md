# Bug-hunt pass 4 — agent D: what do the 1,485 tests actually prove?

Branch `audio-tools-engine`. Read-only pass; nothing outside this file was edited.

**Baseline measured this session:** `npm test` → 66 files, 222 suites, **1,485 tests,
1,485 pass, 0 fail, 7.5 s, exit 0**. All 66 files are really loaded by the glob
(verified with a TAP run — 66 distinct filenames appear). `npx tsc --noEmit` is clean.

**Headline.** The suite is much better than "green means nothing". The files written
during the three bug-hunt passes are unusually well built — they guard their own
parsers, they explain the bug they exist for, and I could not find a single test that
passes because a regex stopped matching. The problem is not that the tests lie. It is
**where they point**: 105 of 843 source files are touched, and the mass sits on lab
DSP, content engines and the production labs. The code that handles *money, identity,
a graded attempt and a hearing-safety promise* is almost entirely unguarded — and that
is exactly where all three passes found their blockers.

---

# 1. The tests worth writing before launch — ranked

Ranked by (damage if wrong) × (likelihood of being wrong), where "likelihood" is
evidenced by what passes 1–3 actually found. Eight, not ten; see §1.9 for what I cut
and why.

### 1.1 The account-wipe registry is complete — **write this one first**

*Assert:* every module that exports a `resetLocal` (or an account-scoped `reset*`) is
imported **and called** by `resetAllLocalStores()` in
`src/features/account/clearLocalAccountData.ts`; and every module holding module-level
mutable state behind a persisted `ape:*` key either appears in that registry or is
named in an explicit, commented exemption list.

*Bug class it would have caught:* the single most repeated defect in this repo.
Pass 2 found `soundSafetyAck` and `celebrationSeen` surviving the wipe (the hearing
warning is the safety gate — the next person on the phone got sound with no warning).
Pass 3 found `publicProfile` (18+ attestation inherited), `chainStore` and
`modMeterC`. Pass 3 lists as **still open**: permission ask-modes, Low-Light mode and
the audio-cap unlock surviving an account switch.

*It would fail today.* `src/features/onboarding/attractStore.ts` exports `resetLocal`
(line 164) and **nothing calls it**. Its key `ape:homeAttract2` *is* swept from
AsyncStorage (it is `ape:*` and does not match `isOnboardingFlag()`), so the in-memory
mirror is now out of step with storage and will be re-persisted under the next
account — the exact asymmetry that produced the four bugs above. Severity here is
MINOR on its own (a new account misses the "start here" cue); the point is that the
registry has drifted again, four fixes later, with no detector.

*Effort:* LOW. Pure source-text scan over `src/**`; no imports, no stubs. ~40 lines.

### 1.2 Offline replay: ordering, and when a row may be destroyed

*Assert*, against a stubbed supabase, for **both** `replayQuizSubmissions`
(`src/features/quiz/api.ts:240`) and its final-exam twin:
rows replay in `created_at` order; a **transient** failure `break`s, leaving that row
*and every row after it*; an **unrecognised** error keeps the row and continues; only a
**positively permanent** rejection deletes it; and the `transient` / `permanent`
regexes classify the real strings (`timeout`, `aborted`, `socket hang up`, `JWT
expired`, `attempt_not_found`, `already_finalized`).

*Bug class:* pass 2 — "quiz replay dropped rows on a timeout". The old guard tested
only `/network|fetch/`, so a timeout, an abort or an expired JWT fell through to
`deleteQueuedSubmission` and **permanently destroyed a graded attempt the server never
saw**. The whole guard is now two regex literals with zero tests. This is the highest
*damage* item on the list — it is silent, unrecoverable data loss on a paid capstone.

*Effort:* MEDIUM. Both seams already exist in the repo: the supabase module stub in
`test/v3CurriculumErrors.test.ts` / `test/calcUsage.test.ts`, and the AsyncStorage stub
in `test/measurementStore.test.ts`.

### 1.3 Entitlement tier derivation from the server's rows

*Assert:* `academyTierFromRows` (currently private inside
`src/features/commercial/EntitlementProvider.tsx:107`) returns `academy` when any row
is active **regardless of row order**, with an expired row present; `lapsed` when rows
exist and none is active; `free` for no rows; and `academy` when the only active row
has an unreadable `expires_at` (fail OPEN, matching the ruling already pinned in
`entitlementExpiry.test.ts`).

*Bug class:* pass 1 found the old `[0]` indexing **classifying an active paying member
as lapsed**. Pass 3 found `refreshEntitlement` returning a boolean, so every successful
purchase reported as a failure. This is a paid feature going dark for a paying
customer — the brief's BLOCKER definition, twice over. `classifyExpiry` is tested;
the function that *consumes* it, which is where both bugs actually lived, is not.

*Effort:* LOW test, SMALL refactor — move the ~35-line function to a leaf
`entitlementTier.ts` (its only dependency is `entitlementExpiry`, already a leaf) and
import it back.

### 1.4 Required-education disclosure is consistent everywhere a career is named

*Assert:* across `src/data/credentialCopy.ts`, `src/data/topicCopy.ts` and the Career
Finder families, a given career title (compared case-insensitively) carries **one and
only one** `requires` code; every code used is a key of `REQUIRES_LABEL`.

***It fails today, and this is a live HARD-RULE violation.*** `src/data/topicCopy.ts`
line 120, topic **3580** ("Getting PA systems into position — flying line arrays and
ground stacking, motors and rigging hardware, load limits, and site safety") lists the
role `{ name: "rigger" }` with **no `requires` code** — while the identical role is
`{ name: "Rigger", requires: "CERT" }` at `topicCopy.ts:177` and
`credentialCopy.ts:46`. Because the lookup is by exact name, the lowercase entry
renders with no label at all. A learner reading the *overhead-load-limits* topic is
told rigger is a role it leads to, with the certification requirement silently
dropped — on the single highest-stakes career in the catalog. Pass 2 fixed Rigger in
two places and missed the third; nothing detected it.

Severity: **MAJOR** (wrong information shown as fact, against a standing HARD RULE).
608 distinct career titles were checked; this is the only inconsistency, so the fix is
one word and the test keeps it that way.

*Effort:* VERY LOW. ~25 lines, pure data, no stubs. Best value-per-line on this list.

### 1.5 The hearing-dose maths

*Assert:* `allowableSec` (`src/features/audio/exposureMonitor.ts:123`) gives 8 h at the
reference level for all three standards; halves per exchange-rate step (85→88 dB ⇒ 4 h
on a 3 dB model; 90→95 ⇒ 4 h on OSHA's 5 dB); returns `Infinity` strictly below each
floor and a finite value **at** it; and is monotonically decreasing. Assert `dateKeyOf`
produces the **local** Y-M-D across a DST transition and in a non-UTC offset.

*Why:* this is a safety promise the app makes in writing, and it is the one number a
user might act on. Zero tests. A day-key that drifts to UTC either resets somebody's
dose early or never resets it. `soundSafety.test.ts` covers the *gate* and the output
ceiling; it does not touch the dose.

*Effort:* LOW test, SMALL refactor. The module's own comment at line 121 says the dose
maths is "pure — kept extractable for host-side tests", but line 30 imports
`AppState` from `react-native`, so it is not extractable today. Moving the ~10 lines to
`exposureMath.ts` makes the comment true.

### 1.6 The membership gate agrees with itself in **both** directions

*Assert* (as three lines added to the existing `test/membershipGating.test.ts`): every
entry in the navigator's `MemberGated` map satisfies `isMemberOnlyLabRoute(route)`;
and every route named in `MEMBER_ONLY_EXTRA_ROUTES` is actually registered in
`RootNavigator`.

*Bug class:* the pass-3 BLOCKER — 8 routes wrapped in `MemberGated.*`, gating nothing,
on both flagship paid labs, with the deep links opened on the strength of that
wrapping. The fix was an allowlist, not a mechanism: `isMemberOnlyLabRoute` still ends
`?? false` (`src/screens/lab/labCatalog.ts:573`), so the **next** child route added to
a paid lab is fail-open again by default. I ran this check today: 53 `MemberGated`
entries, **0 inert** — so it passes now and exists purely to catch the next one, which
the Production Labs build will create.

*Effort:* LOW — extends a file that already does the hard parsing.

### 1.7 Exam / quiz start-error mapping, and the copy it selects

*Assert:* every key of `EXAM_START_ERROR_COPY` and `QUIZ_START_ERROR_COPY` round-trips
through `parseStartError`; that `award_incomplete` can never shadow
`award_content_incomplete` (it is a substring of it — the longest-first sort is the
only thing preventing it); and that **no** user-facing string in either table tells a
paying customer to contact a professor or instructor.

*Bug class:* pass 3 still-open — "six error strings tell a paying customer to *report
this to your professor*". The substring shadowing is a one-character-of-sorting away
from showing the wrong reason a Final Exam will not start, which on the
`paid_tenure_required` path is the difference between "come back when the month is up"
and "your account is broken".

*Effort:* LOW–MEDIUM. Needs the parser + copy tables in a leaf module, or the existing
supabase/AsyncStorage stub pair.

### 1.8 `attemptDraft` survives the crash it exists for

*Assert:* a draft written mid-attempt reads back identically; it is scoped to its
attempt id (a second attempt cannot read the first's answers); it is cleared on a
successful submit; and unreadable stored JSON yields "no draft", never a throw and
never a partially-restored answer set.

*Bug class:* pass 2 — "quiz/exam answers were lost on a crash → `attemptDraft.ts`".
The fix for lost answers has no test that the recovery actually recovers.

*Effort:* LOW. AsyncStorage stub only; `attemptDraft.ts`'s sole hard import is
AsyncStorage, so it is testable **today** with no source change at all.

### 1.9 Deliberately NOT proposed

- **`<AccuracyNote/>` presence across labs** — a static sweep is tempting (pass 3 fixed
  13 missing ones), but "which files are lab screens" has no mechanical definition
  here: 34 files under `src/screens/lab` reference it against 30 `*LabScreen.tsx`. A
  test that needs a hand-maintained file list is the thing it is meant to replace, and
  days from launch a false failure costs more than the regression it prevents.
- **`gateReadout` (`src/features/dashboard/gates.ts`)** — untested, but its own
  docblock is right that it is display-only and the server re-checks at quiz start. A
  wrong readout is MINOR. Not worth a slot.

---

# 2. Inventory — what the 66 files actually assert

Grouped by the part of the app they protect. Counts are files, not assertions.

### Real, load-bearing coverage

| Area | Files | What is actually asserted |
|---|---|---|
| **Production labs** (pre + post) | `productionEngine` (2,249 lines), `productionAnswered` | By far the deepest suite: schema resolution, every rule per pathway, `readStage`/`readProject`/`blockingReasons`, the "no blocker fires before the user types anything" invariant, accepted-condition clearing, the packet HTML, and a check that every `learnMore` route exists in the real `RootStackParamList`. |
| **Lab DSP / engines** | `meterEngine`, `waveEngine`, `harmonicModel`, `eqMath`, `gainEngine`, `ampModel`, `mixingEngine`, `mixingAdvanced`, `mixingStemsRelease`, `patchbayEngine`, `deEsserModel`, `envelopeModel`, `speechModel`, `earWavetable`, `dynamicsFollower`, `engineDegenerate` (624 lines of hostile inputs across five engines) | Genuine numerical assertions against physics, plus a dedicated degenerate-input file. This is the strongest-tested region of the app and, notably, the region where passes 1–3 found the *fewest* blockers. |
| **Cymatics** | `cymaticsPlate`, `cymaticsMembrane`, `cymaticsFaraday`, `cymaticsLibrary`, `cymaticsGallery`, `heatRampWorklet` | Modal maths, contours / marching squares, symmetry mapping, SVG export structure, the pattern store's round-trip and its damaged-row quarantine. |
| **Calculators** | `calcDegenerate` (448), `calcInputParsing`, `labUnits`, `routeEval`, `connectorSelect`, `centerLock`, `tuningMath`, `tuningAudio`, `centsRail`, `mixLevelMatch`, `grLadder` | `parseQuantity` / `parseList` hostile input, `fmt` / `fmtInt`, per-function degenerate sweeps with a guard that the sweep is non-empty. |
| **Deep links** | `deepLinks`, `linkPaths` | The strongest pair in the repo. `deepLinks` derives every declared path from `linking.ts` and asserts `isClaimedPath` accepts it, with a parse-sanity guard **and** a hardcoded list of the seven regressed URLs. `linkPaths` covers host spoofing, `javascript:` / `file:` / `intent:` / `data:`, traversal, encoded slashes, oversize input, backslash smuggling and a literal NUL byte. |
| **Membership gating** | `membershipGating`, `labMembershipGate` | See §3 and §4 — strong, with one blind spot. |
| **Glossary metering** | `glossaryDeviceKey`, `glossaryGatewayFault`, `glossaryCollapsedLines`, `singleFlight` | Consent, key minting, the double-mint race that happened on the owner's phone, RPC-not-deployed fallback, and the free-tier boundary. |
| **Privacy / honesty** | `telemetry` (scrub contract), `directoryRules`, `hostileInput`, `helpContent`, `screenIntros`, `certificateQr` | `hostileInput` is good: it pins *where* a long name is clipped rather than letting it clip silently. |
| **Celebrations** | `celebration`, `credentialCelebration` | Catalog placeholders are real value fields; `resolveCelebrations` collapses to one screen; Low-Light suppression is source-pinned. |
| **Misc leaf logic** | `realAccount`, `profileRead`, `entitlementExpiry`, `studyGate`, `calcUsage`, `reviewEligibility`, `coachMark`, `enrollReorderStep`, `careerFinder`, `careerFinderIndex`, `measurementStore`, `v3CurriculumErrors`, `filePlayerSafety`, `soundSafety`, `studySentences` | Mostly one-bug-one-file regression tests, each with a docblock naming the incident. |

### Areas with **no** coverage at all

- **Auth and account lifecycle** — sign-in, sign-out, account switch, single-device
  guard, delete-account, and the whole wipe registry. Zero tests.
- **Offline queues** — quiz, final exam and study. The storage modules
  (`submissionQueueStorage{,.native}.ts`, `studyQueueStorage{,.native}.ts`) and every
  `replay*` / `flush*` path. Zero tests. `getQueuedSubmissions()` sorts by
  `created_at` on web and `ORDER BY created_at` on native — the two implementations
  are unverified against each other.
- **Entitlement provider** — tier derivation, the bounded boot retry, the dev-override
  interaction, `refreshEntitlement`. Zero.
- **Quiz and Final Exam APIs** — start, submit, idempotency, error mapping, the
  timeout / void contract. Zero.
- **`attemptDraft`** — the crash-recovery module. Zero.
- **Hearing exposure / dose** — `allowableSec`, `dateKeyOf`, the session integrator,
  the check-in thresholds. Zero.
- **Settings, permissions, Low-Light, audio-output store** — zero (except
  `celebration.test.ts`'s single source-pin on the Celebration overlay).
- **Study sync** (`features/study/sync.ts`), **enrollment store**, **dashboard cache**,
  **notifications scheduler** — zero.
- **Careers / required-education data integrity** — zero (see 1.4).

### Answering the eight paths named in the brief

| Path | Tested? |
|---|---|
| Entitlement tier derivation | **NO** — only `classifyExpiry`, one *input* to it |
| Paid-month tenure rule | **NO** — server-side; the client has only the copy string, untested, and the migration is undeployed |
| Study gates | **PARTIAL** — `studyGate.test.ts` covers the two membership gates well (including a jog-race case). The flashcards→homework→quiz power sequence (`dashboard/gates.ts`) is untested, but is display-only |
| Offline queues' replay ordering | **NO** |
| Account wipe registry | **NO** |
| Deep-link filter | **YES** — two files, both strong |
| Readiness engine's blockers | **YES** — `productionEngine.test.ts`, extensively |
| Exposure / dose maths | **NO** |

---

# 3. Vacuous and near-vacuous tests

**I looked hard and found very little.** The audit:

- Every `matchAll`-driven test in the repo was examined (8 sites in 6 files). Five of
  the six carry an explicit parse-sanity guard — `membershipGating.test.ts:78`
  (`needed.size > 30`, `reg.size > 90`), `deepLinks.test.ts:86` (`declared.length > 25`
  plus a named-route check), `productionEngine.test.ts:1727` (`registered.size > 30`),
  `helpContent.test.ts:226` (`found.length >= 5` plus five named terms),
  `calcDegenerate.test.ts:282` ("the sweep actually covers the whole lab"). The sixth,
  `celebration.test.ts:132`, iterates placeholders inside an already-non-empty catalog,
  so a broken regex weakens it rather than emptying it.
- Every `assert.deepEqual(x, [])` (63 sites) was checked; all assert on a real function
  return, not on a regex-derived collection that could be empty by accident.
- Every bare `assert.ok(identifier)` (16 sites) is an existence guard immediately
  before a dereference.
- No assertion on a mock's own behaviour was found. The two module stubs
  (`ape-test:supabase`, `ape-test:async-storage`) are steered per-test and every
  assertion is on the module under test's *output*.
- Source-text checks overwhelmingly use `assert.match` / `assert.deepEqual(x, [...])`,
  both of which **fail** when a regex stops matching. The dangerous inverse —
  `assert.deepEqual(regexDerived, [])` — appears only in the four files that guard it.

`membershipGating.test.ts` is the model, and its guard idiom has clearly propagated.
Three genuine weaknesses remain:

### 3.1 The "mirror" family tests a copy, not the code — and one has no drift detector

`grLadder.test.ts`, `centsRail.test.ts`, `mixLevelMatch.test.ts` and
`dynamicsFollower.test.ts` restate the production arithmetic inside the test, because
the real code lives in a Skia/RN component. Three of the four then pin the source with
an `assert.match` on the exact expression, which is a reasonable drift detector.

**`grLadder.test.ts` does not.** It says so in its own header — *"Kept in lockstep by
hand"* — and asserts nothing about `src/features/lab/fxViz.tsx`. Its six tests prove
that a function written in the test file behaves correctly. I checked: the mirror is
currently accurate (`fxViz.tsx:806-808`). But if that expression changes, all six tests
stay green and prove nothing about the meter. Under the owner's no-fake-meters rule,
that is worth the two-line fix — add the same `assert.match` source pin the three
sibling files already carry.

**Confidence: high** — read both files.

### 3.2 `v3CurriculumErrors.test.ts` is order-dependent by design

Its header warns: *"⚠️ ORDER MATTERS in this file"* — the curriculum memo is
module-level state and the failure cases must run before the success case. This is
correct under `node --test`'s sequential execution today, but it is a latent trap: any
future move to a concurrent runner, or a reordering during an edit, changes what is
proven. It would most likely *fail* rather than pass vacuously, so this is a note, not
a finding. **Confidence: high.**

### 3.3 Test files are never type-checked

`tsconfig.json` lists `"test"` in `exclude`, and nothing in `src` imports them, so
**zero test files reach `tsc`** (verified: `tsc --listFilesOnly | grep -c /test/` → 0).
Combined with `as never` / `as never[]` casts used to build fixtures (e.g.
`membershipGating.test.ts:57`, `celebration.test.ts:139`), a fixture can drift from the
real type and the test keeps asserting on a shape the app no longer produces. Node's
type-stripping runs it regardless. Severity MINOR today; worth knowing before anyone
trusts a fixture as a spec. **Confidence: high.**

*(Non-finding, noted for tooling: `test/linkPaths.test.ts` contains a literal NUL byte
at line 71. It is deliberate — a control-character rejection case — but it makes the
file "binary" to `grep`, `rg` and diff tools, so it silently drops out of repo-wide
text searches. Intentional; flagged only so nobody "fixes" it.)*

---

# 4. Tests that pin the WRONG behaviour

### 4.1 `labMembershipGate.test.ts` blesses the default that caused the pass-3 BLOCKER

```
test('unknown routes are absent (treated as free by the callers)', () => {
  const m = computeLabRouteMembership([]);
  assert.equal(m.get('NotARealScreen'), undefined);
});
```

That comment — *"treated as free by the callers"* — is a written, tested endorsement of
fail-OPEN on an entitlement question. It is the precise semantics that made
`withMembershipPreview` inert on eight paid-lab routes, across **both flagship labs**,
after the matching deep links had been opened. `isMemberOnlyLabRoute` still ends
`?? false` (`labCatalog.ts:573`); the pass-3 fix was a hand-written allowlist
(`MEMBER_ONLY_EXTRA_ROUTES`, 8 entries), not a change of default.

The brief's own standing rule is *"fail CLOSED on entitlement, fail OPEN on
infrastructure errors."* An unrecognised route is not an infrastructure error.

I am **not** proposing the default be flipped days from launch — a fail-closed default
would lock free labs the moment any catalog name drifts, which is a worse failure.
What I am reporting is that the test *records the fail-open default as correct*, so
whoever next reads it will not think to check. The comment should say "fail-open by
necessity, covered by `MEMBER_ONLY_EXTRA_ROUTES` + `membershipGating.test.ts`", and
the guard in 1.6 should exist. **Confidence: high** — traced the predicate and ran it
against all 53 `MemberGated` entries.

The sibling case in the same file, *"a route free in ANY occurrence is never reported
members-only"*, is the same shape one level down: a route appearing in both a free and
a paid category resolves to free. That is defensible (it models an aliased screen) but
it is another fail-open on entitlement, tested as intended, and worth an explicit
sentence rather than an implicit one.

### 4.2 `calcUsage.test.ts` — the last case pins a dishonest counter

```
test('a consume row WITHOUT an allowed column reads as allowed (current contract)', …)
  assert.equal(u.allowed, true);
  assert.equal(u.unavailable, false);   // ← claims the cap WAS checked
```

Everywhere else in that file, "we could not evaluate the cap" sets `unavailable: true`
so the UI can say *"usage not counted"*. Here the cap was **not** evaluated — the
server's answer was missing the deciding column — and the flag says it was. The user is
told their free calculation was counted when nothing counted it.

To the file's great credit it flags this itself: *"a change here is a product decision,
not a refactor."* So this is a **MINOR** finding and an owner question, not a bug to
fix blind. It is listed because it is the only place I found where a test asserts the
app reports something it does not know. **Confidence: high.**

### 4.3 Checked and clean

- `parseList` — the contract change is now consistent across **both**
  `calcDegenerate.test.ts` (with a 12-line rationale citing the source-of-truth rule)
  and `calcInputParsing.test.ts`. No residue of the old drop-the-bad-token behaviour.
- `v3CurriculumErrors.test.ts` — asserts the *strict* variants reject and the lenient
  ones resolve `[]`, with the lenient path justified by its legacy callers. This is the
  correct shape of the "failed read reported as empty" fix, not a re-pinning of it.
- `entitlementExpiry.test.ts` — fail-open on an unreadable expiry is an explicit owner
  ruling (2026-09-11) and is infrastructure, not entitlement. Correct.
- `studyGate.test.ts` — fails **closed** on a missing `gs`, and its "nobody is locked
  before the tier is known" case is the right fail-open (a pre-resolution lock showed a
  paying member an upgrade sheet). Both directions right.

---

# 5. The seams — what cannot be tested, and the smallest fix

Two seams already exist and work well, and both are under-used:

- **Extensionless-import resolver** (`registerHooks({resolve})`) — in 20 files. Lets a
  test import app source that imports siblings without extensions.
- **Module stubbing** (`registerHooks({load})`) — `ape-test:async-storage` in
  `measurementStore.test.ts` (a full in-memory `getItem` / `setItem` / `getAllKeys` /
  `multiRemove`), and `ape-test:supabase` in `v3CurriculumErrors.test.ts` (a thenable
  query builder) and `calcUsage.test.ts` (an `rpc` shim).

**There is no `react-native` stub anywhere.** That is the hard wall. Ranked by what
matters:

| Module | Blocked by | Smallest change |
|---|---|---|
| `features/audio/exposureMonitor.ts` — dose maths, day key | `import { AppState } from 'react-native'` (line 30) | Move `allowableSec` + `dateKeyOf` + the threshold constants to a leaf `exposureMath.ts`. ~10 lines. The file's own line-121 comment already claims this is done. |
| `features/commercial/EntitlementProvider.tsx` — `academyTierFromRows` | `.tsx`, React | Move the function to `entitlementTier.ts` (its only dep, `entitlementExpiry`, is already a leaf) and re-import. ~35 lines. |
| `features/quiz/api.ts`, `features/finalExam/api.ts` — replay, error mapping | AsyncStorage + `expo-crypto` + supabase | **No source change needed** — add an `expo-crypto` stub next to the two that exist. Alternatively lift `parseStartError` + the `*_ERROR_COPY` tables to a leaf `errors.ts`, which is cheaper and covers 1.7 alone. |
| `features/account/clearLocalAccountData.ts` — the wipe registry | AsyncStorage, plus 20 app modules that each pull React | **No source change needed for 1.1** — the registry-completeness test is a source-text scan. A *behavioural* test of the KEEP allowlist would need the AsyncStorage stub, which already implements `getAllKeys` / `multiRemove`. |
| `features/assess/attemptDraft.ts` | AsyncStorage only | **Nothing.** Testable today with the existing stub. |
| `features/study/sync.ts` | `react-native` AppState + supabase | Extract the batching / ordering logic; leave the AppState listener in place. Larger job — not before launch. |
| `features/settings/lowLight.ts`, `features/audio/audioOutputStore.ts` | `react` (hooks only) | Both are hook-wrapped module stores with **no `resetLocal` at all** — the pass-3 still-open "survive an account switch" items. Adding `resetLocal` is the fix *and* makes 1.1 detect them. |
| Everything JSON / asset-importing | Metro-only resolution | Out of scope; correctly tested via source text where it matters (`labUnits`, `careerFinderIndex`). |

---

# 6. What I did not find

- No test that passes because its regex stopped matching.
- No test asserting on a mock instead of on the code.
- No snapshot of a value the test itself computed, other than the four documented
  "mirror" files in §3.1.
- No file skipped by the runner; no `it.skip` / `todo`; no `only`.

The suite's problem is coverage shape, not integrity. Every blocker in passes 1, 2 and
3 lived in code with no test — auth, entitlement, offline queues, gating wrappers,
account wipe — and every one of those areas is still uncovered today except the
deep-link filter, which pass 3 covered and which is now the strongest thing in the
repo. That is the signal, and §1 is the shortest list that acts on it.
