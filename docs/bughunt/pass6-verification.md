# Pass 6 — agent A — adversarial verification of the pass-5 fixes

Scope: commit `b5fc6378` ("pass 5: three of my pass-4 fixes were broken, one
badly"), read in full, plus the pass-4 code it reverted and the pass-3 fixes it
touched again. `git log --oneline -6` confirms `db87c85a` (brief only) sits on
top of it and nothing else has landed since.

**Build state (run just now, this tree):**
`npx tsc --noEmit` → **exit 0, no output**.
`npm test` → **1505 pass / 0 fail / 0 skipped**, **228 suites**, 6.31 s.
(Pass 5 measured 1488/223. The three new suites in this commit account for the
+17 tests and +5 suites.)

There is **no linter in this repo** — no `.eslintrc*`, no `eslint.config.*`, no
prettier or biome config, and `package.json` has exactly one quality script
(`"test": "node --test \"test/**/*.test.ts\""`). That answers the `void SHARE`
question below and it also means neither tsc nor the suite will ever tell you
about an unused export or a dead branch.

READ-ONLY: no source file was edited. This report is the only file written.
(Analysis scripts were run from the session scratchpad, not the repo.)

---

## Verdict table

| # | Fix (pass 5) | Verdict |
|---|---|---|
| 1 | Enrollment guard reverted — push unconditional again | **HOLDS, WITH A NEW BLOCKING PATH** — `await reconcileFromServer()` still sits in front of the push with no timeout; `reconcileConfirmed` is now dead state |
| 2 | `interpretTypedNumber` — interpret at commit, not per keystroke | **HOLDS as a parser. PARTIAL as a field** — a refused string wipes the answer and the text with no explanation; unambiguous European `1.250,50` is refused; `1,500` is silently guessed as 1500 |
| 3 | `test/productionNumberInput.test.ts` (`new Function` extraction) | **HOLDS — cannot pass vacuously**, but it tests a function the app never calls directly and does not cover the caller's filter |
| 4 | 8 routes wrapped in `MemberGated` | **HOLDS — CLEAN.** Both halves, `options={swipe}` preserved, no props dropped |
| 5 | `namesGatedRole` + `GATED_ROLE_NAMES` + curriculum note | **PARTIAL — it fires, on exactly the right 6 of 50, with no over-disclosure — but it under-fires by construction** (first-occurrence-only; no plurals; no hyphen/variant forms) |
| 6 | CareerFamilyScreen licensed-occupation disclosure | **HOLDS** |
| 7 | SHARE removed from the celebration catalog | **HOLDS.** Nothing expects it; `void SHARE` trips nothing (there is no linter) |
| 8 | `refreshEntitlement` stale-read guard | **HOLDS**, with one un-guarded line and an extra `getSession()` round-trip |
| 9 | Exam-queue lock no longer held across the network | **HOLDS.** `replayInFlight` cannot stick true; the final locked write keeps what it should. One narrow drop case |
| 10 | `projectStore.remove`/`duplicate` inside `serialize` | **HOLDS mechanically — and is now DEAD CODE**, because the same commit deleted `remove`'s only caller |
| 11 | `ProductionActivityScreen.restart` — "seed first, then replace" | 🔴 **BROKEN — NEW BUG. The comment's premise is false: the ids do NOT match.** Every RESTART permanently leaks a duplicate project |
| 12 | `ProductionLabScreen.start` / `ProductionActivityScreen.load` failed writes | **HOLDS** |
| 13 | Enable-audio popup copy | **HOLDS** — `panicMuteAudio()` really does run on background (`AudioOutputGate.tsx:180`) |
| 14 | Scenarios `correctGreen` | **HOLDS** — `correctGreen` is a real `AnswerCell` state, with the ✓ and the `", correct"` label |
| 15 | `AccuracyNote` moved out of the page-0 block in `PagedLab` | **HOLDS** (cosmetic ordering note below) |
| 16 | `modWaveA` Hz / kHz casing | HOLDS |

---

## 11. 🔴 BROKEN — RESTART leaks a project every time, and the comment that
##     justifies it is factually wrong

`src/screens/lab/production/ProductionActivityScreen.tsx:87–110`.

The commit removed the `projectStore().remove(...)` from `restart` on this
stated reasoning:

> `// The ids match, so `upsert` overwrites in place and the remove is
>  // unnecessary; dropping it removes the window entirely.`

**The ids do not match.** `seedActivityProject` mints a fresh id on every call:

```ts
// src/features/production/activities.ts:80
id: newProjectId(),
// src/features/production/types.ts:225-227
export function newProjectId(): string {
  return `p_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}
```

So `upsert`'s `all.findIndex((x) => x.id === p.id)` returns −1 and it takes the
`all.unshift(row)` branch. The old project is never overwritten and never
removed. Traced consequences:

1. **One orphaned project per RESTART, forever.** `saveList` has no cap
   (`projectStore.ts:145–152` is a bare `setItem(JSON.stringify(list))`), and
   `projectStore.remove` now has **zero callers in the entire repo** — this
   commit deleted the only one — so there is no path, UI or otherwise, that can
   ever delete one.
2. **The learner sees them.** `ProductionLabScreen.reload()` (line 55–59) reads
   the whole list with no `scenarioId` filter, and lines 173–189 render a
   switcher chip per project showing `p.name`. `seedActivityProject` sets
   `name: activity.title`. So after three restarts of one exercise the
   production lab's project switcher shows three identically-labelled chips and
   the learner cannot tell which one is live — and cannot delete any of them.
3. **The auto-opened project drifts.** `setOpenId((cur) => cur ?? list[0]?.id)`
   opens the first row, which is now whichever activity seed was written last —
   not the learner's own real project.
4. It grows the JSON blob that every single keystroke rewrites (`mutate` is a
   read-modify-write of the whole list), so it makes the latency concern from
   the pass-5 report worse over time, and eventually triggers the very
   `setItem` failure the *same commit* added a `notify` dialog for.

The restart does *appear* to work in the moment, because `upsert` unshifts to
the front and `load()` does `.find((p) => p.scenarioId === activityId)` — the
newest copy wins. That is what makes this quiet: the symptom shows up in a
different screen, later.

The window the change was closing is real (delete-succeeds-then-create-fails).
The correct close is to keep `seedActivityProject`'s output but **reuse the
existing project's id** — `const seeded = { ...seedActivityProject(lab,
pathway, activity), id: project.id }` — which then genuinely makes `upsert` an
in-place overwrite and makes the comment true. (`project` is already in scope
and already null-guarded on the line above.)

**Severity: MAJOR.** Not data loss of a learner's answers, but unbounded local
growth, a project list that becomes progressively wrong, and no way to clean it
up. **Confidence: high** — three-line trace, all in this repo.

---

## 1. HOLDS, WITH A NEW BLOCKING PATH — the enrollment revert

`src/features/enrollment/enrollmentStore.ts:159–200`.

**Is the push genuinely unconditional again?** Yes. The `if (!confirmed &&
isPristineSeed(list)) return;` block is gone; the only thing between the session
check and `supabase.rpc('sync_my_enrollments', …)` is `await
reconcileFromServer()`. Verified by reading the whole function, not the diff.
The retry/backoff around the RPC is untouched and still correct.

**Can `reconcileFromServer` throw into the caller?** No. Lines 112–151 are
`try { … } catch { console.warn; return false } finally { reconciled = true }`,
and the only statement outside the `try` is `if (reconciled) return
reconcileConfirmed;`, which cannot throw. Clean.

**Can it BLOCK the caller?** Yes — and this is the one thing I would change.

```ts
await reconcileFromServer();            // line 188 — an untimed supabase select
const { error } = await supabase.rpc('sync_my_enrollments', …);
```

RN's `fetch` has no default timeout and there is none configured anywhere in
this app (the same commit's own exam-lock fix says exactly that, in its own
comment, eight files away). A socket that accepts and never answers parks line
188 forever. Nothing rejects, so the outer `catch`'s backoff never arms, and
`syncTimer` has already fired — **there is no retry**. The push never happens,
and `start_quiz_attempt` / `record_study_progress` / `credit_time_trial` raise
`not_enrolled`: precisely the failure this commit was written to undo, reached
by a different road.

It is narrower than the guard was — it needs a hung socket rather than merely a
denied read, and `if (reconciled) return reconcileConfirmed` means only the
**first** sync per identity is exposed. But the first sync per identity is the
new-user enrolment. The fix is one line: don't await the pull, or race it
against a timeout. It is best-effort by the comment's own admission; it should
not be able to hold the push hostage.

**Severity: MAJOR if it fires, low probability.** **Confidence: high on the code
path, low on frequency** — I cannot measure how often a request hangs rather
than errors on the owner's network. What would settle it: a `Promise.race` with
a 5 s timer around line 188, which costs nothing and removes the question.

**Is `reconciled` / `reconcileConfirmed` still coherent?**
- `reconciled` — **live and correct.** Latched in the `finally`, so a throw on
  the way in does not disable the pull.
- `isPristineSeed` — **live.** Still guards the adopt-the-server-list branch at
  line 136.
- `reconcileConfirmed` — **now dead state.** It is set at line 135 and returned
  at line 113, but the function's return value is discarded at its only call
  site (line 188), and grep finds no other reader. `reconcileFromServer`'s
  `Promise<boolean>` is now a boolean nobody reads. Harmless, but it is the
  residue of the reverted design and should either be deleted or the function
  made `Promise<void>`.

**One behaviour that survived the revert and is worth the owner's eye:**
`isPristineSeed([]) === true`, so if the client ever *does* gain read access,
`reconcileFromServer` will overwrite a deliberately-emptied list with the
server's rows and silently re-enrol the user. Inert today (the select returns
zero rows), live the day the RLS/RPC read is added — which is the server fix
this very comment asks for.

---

## 2. HOLDS as a parser, PARTIAL as a field — `interpretTypedNumber`

`src/screens/lab/production/FieldRow.tsx:458–491` (the helper) and `503–535`
(the caller).

**Does it fix the stated bug?** Yes, completely, and the approach is right. The
text is no longer transformed on the keystroke, the draft holds raw characters,
and the interpretation runs on the whole string. Typed and pasted `12,000` now
give the same answer. Traced by hand, every state the brief asked for:

| Input | Route through the function | Committed |
|---|---|---|
| `1250.50` (each keystroke) | 1 → 12 → 125 → 1250 → `1250.` (trailing-point branch) → 1250.5 → **1250.5** | correct at every step |
| `12,000` (each keystroke) | 1 → 12 → `12,` (trailing-separator) 12 → `12,0` (decimal-comma) 12 → `12,00` 12 → grouping → **12000** | correct; the 1000× regression is gone |
| `1.234,5` | dots=1, commas=1 → the `dots > 0` regex `^\d{1,3}(,\d{3})*\.\d*$` fails → **null** | see below |
| `0.5` | 0 → 0 (`0.`) → **0.5** | correct |
| `-0` | `neg=true`, `t='0'` → **−0** | harmless; `String(-0)` is `'0'` and `JSON.stringify(-0)` is `0` |
| `00` | passes `^\d*\.?\d*$` → **0** | correct |
| `1..` | `dots = 2` → **null** | the previously committed `1` is wiped |
| `1,2,3` | commas=2, no branch matches → **null** | correct refusal |
| paste `$1,250.50` | caller strips `$`; `dots>0` regex matches → `1250.50` → **1250.5** | correct |

`Number.isFinite` is checked, `1e999` is rejected by the shape regex before it
can reach `Number`, and the caller's `[^0-9.,\-]` filter means a paste of
letters, currency symbols or spaces cannot reach the helper. **So the brief's
premise about letters and spaces does not hold — they are filtered out of the
draft.** Three things do:

**(a) A refused string destroys the stored answer and then vanishes, unexplained.**
`onChange(interpretTypedNumber(raw))` runs on every keystroke, so the moment the
text passes through an unreadable state the committed value becomes `null` —
including when the field already held a good number. Then `onBlur={() =>
setDraft(null)}` drops back to `committed`, which for `null` is `''`
(line 504). The user is left with an **empty field**, their previous answer
gone, and the only feedback anywhere on screen is the 7 px readiness dot at
`FieldRow.tsx:50` changing colour. There is no inline message. The brief asked
whether the `onBlur` clear is correct when the value is null: it is *consistent*
(blank field = no value) but it is the wrong choice here, because it destroys
the evidence of what the person typed at the same moment it destroys their
answer. Keeping the draft when the value is null — or showing "not a number I
can read" — would cost one line.

**(b) An unambiguous European number is refused.** `1.250,50` is not ambiguous
in any locale: dot groups, comma decimals, 1250.50. The `dots > 0` branch
demands the *US* order and returns null. The helper's own doc says it
"deliberately refuses the ambiguous cases"; this one is not ambiguous, it is
just the other convention. On a phone set to a European locale, whose keypad
puts the comma where the user expects it, this is the ordinary way to type the
number.

**(c) The one genuinely ambiguous case is silently guessed, in the direction the
file used to say it would not.** `1,500` matches the grouping branch and commits
**1500**; in a decimal-comma locale the person meant 1.5. Same 1000× error class
as the bug just fixed, in the same field, into the same client-facing packet —
only now it is a documented design decision rather than an accident, and there
is nothing on screen to show which reading the app took until the field is
blurred (at which point it reads `1500`, which *is* honest feedback, but only if
the user looks).

**Severity:** (a) **MAJOR** — silent loss of an entered answer in a budget field
with no explanation. (b) and (c) **MINOR–MAJOR**, depending on whether any
customer is on a decimal-comma locale.
**Confidence: high** on all three (pure tracing; I ran the helper).
**What would settle (c):** resolve by device locale
(`expo-localization`) rather than by shape, and render the interpreted value
under the field ("reads as 1,500.00") so the guess is visible before it is
exported.

**Two smaller things in the same block:**

- A minus **anywhere** is stripped and only a *leading* one makes the value
  negative, so a pasted `1-2` commits **12** and `5-` commits **5**. `-` is in
  the caller's allow-list, so it survives the filter. Unreachable from
  `keyboardType="decimal-pad"` (neither iOS nor Android puts a minus on it),
  reachable by paste. MINOR.
- `field.kind === 'duration'` routes to `NumberField`
  (`FieldRow.tsx:137–139`), so a duration typed as `1:30` would have the colon
  stripped and commit **130**. **No field in either lab currently uses
  `duration`** — grep finds it only in the `schema.ts:28` union — so this is a
  trap for the next author, not a live bug.

---

## 3. HOLDS — the `new Function` extraction cannot pass vacuously

`test/productionNumberInput.test.ts:52–66`.

**Can the extraction capture the wrong thing?**

```ts
const body = source.slice(
  source.indexOf('export function interpretTypedNumber'),
  source.indexOf('\n}', source.indexOf('export function interpretTypedNumber')) + 2,
);
```

`indexOf('\n}')` needs a `}` in **column zero**. Every closing brace inside
`interpretTypedNumber` is indented, so the first column-zero brace after the
declaration is the function's own. The capture is exact today. It survives a
CRLF checkout (`\r\n}` still contains `\n}`) — worth stating given `.gitignore`/
`.easignore` line-ending history in this repo.

**Can it stop matching and pass vacuously?** No, and the failure is loud. If the
function is renamed, moved to another module or converted to a `const` arrow,
`indexOf` returns **−1**; `slice(-1, …)` yields `''`; `new Function('; return
interpretTypedNumber;')()` then throws `ReferenceError` at **module top level**,
so the whole file fails to load and the suite goes red. The `body.length > 400`
and `typeof === 'function'` guards in the first `describe` are belt-and-braces
on top of that.

**Does the type-annotation strip produce valid JS?** Yes.
`.replace('export function','function')` then `.replace(/: string|: number \| null/g,'')`
turns `export function interpretTypedNumber(raw: string): number | null {` into
`function interpretTypedNumber(raw) {`. The body carries no other annotations
(`let t`, `const neg`, `const dots`, `const commas`, `const n` are all
un-annotated), and no string literal in the function contains `": string"`. It
compiles and runs — I executed it. It is fragile against a *second* typed
parameter, which the guards would not catch (the regex would leave `opts?: Opts`
intact and `new Function` would throw — so again, loud, not silent).

**The real gap is coverage, not extraction.** The test exercises the pure helper.
The app never calls the helper directly — it calls it through
`onChangeText`, and the caller's `t.replace(/[^0-9.,\-]/g, '')` filter, the
`setDraft` round-trip and `onBlur={() => setDraft(null)}` are the parts that
produced §2(a) and the `1-2 → 12` case. None of those has a test. The eleven
assertions pin the arithmetic and none of them would have caught what is
actually wrong with the field now.

---

## 4. HOLDS — CLEAN — the eight newly-wrapped routes

`src/navigation/RootNavigator.tsx:253–270, 497–498, 508, 533, 535, 544, 547, 549`.

- **Both halves, all eight.** Each of `DigitalModule`, `EqModule`, `GainModule`,
  `EarModule`, `AmpModule`, `TubeReference`, `TubeCard`, `DeEsserLab` is now
  `MemberGated.X` at its `Stack.Screen`, and all eight are still in
  `MEMBER_ONLY_EXTRA_ROUTES` (`labCatalog.ts:574–581`). `membershipGating.test.ts`
  line 143 ff. now asserts **both** (`!c || !/MemberGated\./.test(c) ||
  !isMemberOnlyLabRoute(r)`), so this specific state cannot come back green.
- **Does each still render for a MEMBER?** Yes. `withMembershipPreview` returns
  `<Screen {...props} />` unchanged when `resolved && isMember`
  (`withMembershipPreview.tsx:157`).
- **`options={swipe}` on `TubeReference` / `TubeCard`** — preserved. It lives on
  the `Stack.Screen`, and only the `component` prop changed (lines 497–498).
- **Do any drop route params?** No. All eight screen components take **zero
  props** (`export function EarModuleScreen()`, `TubeCardScreen()`, etc. —
  verified for all eight) and read their params via `useRoute()` internally. The
  wrapper spreads `{...props}` anyway, so nothing could be dropped even if they
  did.
- **Composition order** for the three that also carry orientation:
  `withMembershipPreview(withAmplitudeOrientation(X))` — membership outer,
  orientation inner. That is the right way round: a non-member never reaches the
  orientation gate, and a member passes straight through both.
- **Is anything now gated that should be free?** No. Every parent is already
  `MemberGated.*` in the same file (`DigitalLab`, `EqLabHome`, `GainLabHome`,
  `EarTrainingLab`, `AmpLab`, `TubeLab`, `SmartProcessorsLab`), and the catalog
  rows for `DigitalLab` and `GainLabHome` carry `member: true` explicitly.
  `DeEsserLab` has no catalog row of its own — it is reached only from
  `SmartProcessorsLab` — so `MEMBER_ONLY_EXTRA_ROUTES` is the only thing that
  can classify it, and it does.

One consequence worth knowing rather than fixing: a member on a cold start now
sees the `GateHold` "Checking your membership…" beat on eight more routes
including `TubeCard`, which is reached by tapping a card inside `TubeReference`.
`resolved` is app-wide and sticky after the first read, so in practice this is
the first navigation after launch only.

---

## 5. PARTIAL — the disclosure fires, on the right subjects, and under-fires
##    by construction

`src/data/gatedRoles.ts` (new), `src/screens/curriculum/CurriculumScreen.tsx:491–506`.

I ran the real modules against the real data rather than reading them.

**Is the derivation correct, and does it include every `requires` role?**
Yes. `GATED_ROLE_NAMES` walks `CREDENTIAL_COPY_BY_SLUG` and `TOPIC_COPY_BY_GS`
and collects every `career.requires` / `role.requires` name → **102 names**,
none shorter than 5 characters (so the `t.length < 5` cutoff discards nothing
today). It is derived from the classification itself, so it cannot fall behind
it — which was the whole point, and it works.

**Does the screen actually render the note?** Yes, and I chased the two things
that could have made it inert:
- `subjectMeta(name)` returns `EMPTY` unless `SUBJECT_META_RATIFIED` is true —
  it is `true` (`subjectMeta.ts:270`), so `meta.careers` is non-empty and the
  `CAREER APPLICATIONS` block renders.
- `CurriculumScreen.tsx:453` looks up `subjectMeta(s.name)` where `s` comes from
  `v3Subjects` (the live v3 curriculum). The 50 `SUBJECT_META` keys are the v3
  subject strings and my run resolved all 50, so the lookup is not silently
  missing.

**Does it fire?** On exactly **6 of 50**, and they are exactly the six the
pass-5 report named:

| Subject | Matched role |
|---|---|
| Acoustics & Room Behavior | Acoustician |
| Measurement & Analysis | Acoustician |
| Human & Heritage Acoustics | Research Acoustician / Acoustician |
| Life, Earth & Space Acoustics | Bioacoustics Researcher |
| Preservation & Restoration | archivist |
| Stage & Venue | Rigger |

**Over-disclosure?** None. I checked all 44 non-firing lines by hand against the
102 names: no false positive, and the warning does not appear on a single
subject whose careers need nothing extra. The "does not fire on a list of roles
that need nothing extra" test in `gatedRoleDisclosure.test.ts` is real and it
passes for the right reason.

**Under-disclosure — three concrete holes.** `namesGatedRole` is a substring
match of 102 canonical names against free prose, and prose does not oblige:

1. **It only looks at the FIRST occurrence.** `const i = text.indexOf(t)` — if
   that occurrence fails the word-boundary check, the role is abandoned even
   though a clean one follows. Demonstrated, running the real function:
   `namesGatedRole('Outrigger tech, rigger, crew.')` → **`false`**. A `.matchAll`
   or the very regex the test file already uses
   (`(?<![a-z])…(?![a-z])`) would fix it. Note that the test's *independent*
   scan uses that regex, so the two implementations already disagree — the test
   just happens not to hit a case where they differ.
2. **No plurals.** `namesGatedRole('Stagehand, riggers, crew.')` → **`false`**;
   `namesGatedRole('Acousticians and testers.')` → **`false`**.
3. **No variant forms, and two live subject lines are missed because of it.**
   - *Sound Visualization & Imaging* — "Acoustic-imaging engineer, NVH
     specialist…". The app classifies **Acoustic Imaging Engineer** and **NVH
     Engineer** as degree-gated; the hyphen and "specialist" defeat the match.
     No warning.
   - *Physical & Advanced Acoustics* — "Research scientist, acoustic engineer,
     transducer/R&D, academia." The app classifies **Acoustics Engineer**,
     **Acoustical Physicist** and several `…Researcher` roles as degree-gated;
     "acoustic engineer" and "academia" match none of the 102 strings. No
     warning — on arguably the most degree-gated subject in the list.

So: a genuine improvement over the inert version, a real fix for six screens,
and still short of the HARD RULE's "always, every time". **Severity: MINOR**
(two subject lines, under-disclosure not misinformation). **Confidence: high** —
I executed the shipped function against the shipped data.
**Fix:** `subjectMeta.careers` should be `Career[]`, as the module's own comment
says. Short of that, switch `namesGatedRole` to the test's regex and add an
optional `s?` to the boundary.

---

## 7. HOLDS — SHARE

`src/features/celebration/catalog.ts:16–32`.

- Removed from all five credential celebrations; no `SHARE` remains in any
  `actions` array.
- **Does anything still expect it?** `kind: 'share'` is still a member of
  `CelebrationActionKind` (`types.ts:70`) and `CelebrationScreen.tsx:137` still
  has its `case 'share':`. Both are now unreachable and both are harmless — but
  that `case` is the dead branch that *was* the bug (it exits like DONE and
  spends the celebration), sitting there ready for whoever re-adds the button.
  If the intent is "kept, unused, with the note", the note belongs on the
  `case` too. No test, type-check or caller breaks. tsc is clean.
- **Will `void SHARE` trip a linter?** **No — there is no linter in this
  repository.** No `.eslintrc*`, no `eslint.config.*`, no prettier or biome
  config, and no lint script. `void SHARE;` exists solely to satisfy TypeScript's
  unused-local check, and tsc passes. (If a linter is ever added,
  `no-unused-expressions` and `no-void` would both flag this line; a
  `// eslint-disable-next-line` or simply exporting `SHARE` would be steadier.)

---

## 8. HOLDS — `refreshEntitlement`

`src/features/commercial/EntitlementProvider.tsx:445–479`.

The shape is right: `uidAtStart` is captured before the `entitlements` select
and `stillSameUser()` re-reads the session after it, so an answer belonging to a
departed session is discarded and `false` is returned — which the documented
contract already means as "failed, retry honestly", so the paywall/restore
callers behave sensibly. Two notes, neither worth a fix on its own:

- `uidAtStart` is taken from `sess`, but the `if (!isRealAccount(sess.session))
  { setEntitlementState('anonymous'); return 'anonymous'; }` branch above is
  **not** guarded — a sign-in landing inside that one `getSession()` await would
  still write `anonymous` over a real account. The window is a single local
  storage read and it self-heals on the next auth event. Vestigial.
- `stillSameUser()` is a second `supabase.auth.getSession()`. In supabase-js v2
  that is a storage read, but it will silently perform a **token refresh** if the
  access token has expired — i.e. it can go to the network, on a path whose whole
  point is that it is already slow. `supabase.auth.getUser()` is not cheaper;
  hoisting `generation` to a `useRef` (the fix the pass-5 report suggested)
  would have been free.

---

## 9. HOLDS — the exam replay re-entrancy flag and the final locked write

`src/features/finalExam/api.ts:352–447`.

**Can `replayInFlight` get stuck true if the promise rejects?** **No.**
`replayExamSubmissionsLocked` is an `async function` **declaration**, so it is
hoisted and it always returns a promise — it can never throw synchronously
before `.finally()` is attached. `.finally()` runs on both settle paths. The
only way the flag could stick is a promise that never settles, which is the
hung-fetch case — and in that case the *previous* design hung the queue lock
instead, which was strictly worse.

**Does the fix achieve what it claims?** Yes. The network loop no longer holds
the lock, so `enqueueExamSubmission` (which `FinalExamScreen.tsx:182` awaits
before telling the learner anything) is no longer behind it. That was the pass-5
finding and it is genuinely closed.

**Does the final locked write drop rows it should keep, or keep rows it should
drop?** I walked it:

- Another user's rows → `remaining` → kept, and also excluded from
  `arrivedMeanwhile` (they are in `attempted`) so they are written exactly once,
  not duplicated. ✔
- Transient failure → `offline = true`, `remaining` → kept. ✔
- Unrecognised error → kept (the widened pass-3 rule is intact). ✔
- Positive permanent rejection → dropped. ✔
- **A row queued while the replay ran** → not in `attempted` → `arrivedMeanwhile`
  → kept. ✔ This is the case the fix was written for and it works.
- `readQueue()` failing inside the lock returns `[]`, so `arrivedMeanwhile` is
  empty and the write degrades to `writeQueue(remaining)` — the old behaviour.
  Safe. ✔
- `writeQueue` refusing (`queueReadable === false`) leaves the whole original
  queue in place; submitted rows replay once more and the server returns the
  frozen `result_payload`. Duplicate celebration, no loss. ✔

**The one drop case:** `attempted` is keyed on `attemptId`, and
`enqueueExamSubmission` also dedupes on `attemptId`. So a row **re-enqueued
mid-replay under an attemptId that was already in `rows`** is filtered out of
`arrivedMeanwhile`, and if the replay dropped that id as permanently rejected it
is lost. Reaching it needs the exam screen to re-queue the same attempt while a
Dashboard replay is in flight on it *and* the server to answer
`attempt_not_found`. A fresh sitting mints a fresh attemptId
(`start_quiz_attempt`), so the ordinary path is safe. **Theoretical; I could not
construct a realistic sequence.** Keying `arrivedMeanwhile` on identity rather
than attemptId would close it.

**Residual, unchanged from pass 5 and still true:**
- `clearExamQueue` (line 450) still has **no callers anywhere**, is still
  unlocked, and its doc still describes a behaviour ("drop the queue on account
  switch") that contradicts the design, where `ape:finalExamQueue` is on the
  KEEP list on purpose.
- `queueReadable` (line 289) is still a one-way module-level `let`.
- A second concurrent `replayExamSubmissions()` now returns `[]` immediately.
  `DashboardScreen.tsx:767` is the only caller and it just skips the "Offline
  exam submitted" notify for that call — the first call still delivers it. No
  loss, but it is a return value that means two different things now.

---

## 10. HOLDS mechanically — and `projectStore.remove` is now dead code

`src/features/production/projectStore.ts:236–264`.

- **Does the early `return null` in `duplicate` still return from the right
  function?** Yes. It is inside the `async () => { … }` job passed to
  `serialize`, so it resolves the job; `serialize<T>` returns `run` (the
  `.then(job, job)` chain) unchanged, so `duplicate` resolves to `null`. tsc
  infers `Promise<ProductionProject | null>` and agrees with the `ProjectStore`
  type (line 158). Verified by typecheck, not by eye.
- `serialize` itself is correct: `.then(job, job)` runs the next job on both
  settle paths, `queues[lab] = run.catch(() => undefined)` keeps the chain
  promise handled while `run` still rejects to the caller, and neither `remove`
  nor `duplicate` calls another serialized function, so no self-deadlock.
- The `duplicate` body was not re-indented when it was wrapped (lines 245–262
  sit two levels shallower than their block). Cosmetic, and there is no
  formatter in this repo to object.
- **But both are now unreachable.** `duplicate` never had a caller, and the same
  commit deleted `remove`'s only one (`ProductionActivityScreen.restart`). Grep
  across `src` finds no `projectStore().remove(` or `.duplicate(` anywhere. So
  the fix's own stated justification — *"a concrete hazard on the activity
  screen's RESTART, which deletes and recreates back to back"* — describes a
  path the same commit removed. The change is still correct; it now protects
  nothing, and it means there is **no way for a learner to delete a production
  project**, which is what makes §11 permanent.

---

## 12–16. The ones that hold clean

- **12. Failed writes on `ProductionLabScreen.start` (line 82–91) and
  `ProductionActivityScreen.load` (line 60–70).** Both now check `upsert`'s
  boolean and `notify` + `return` instead of proceeding. Matches the pass-3
  treatment of the stage screen. ✔ (The third sibling, `restart`, is §11.)
- **13. Enable-audio popup copy** (`AudioOutputGate.tsx:314–324`). The new
  sentence — "mutes when you leave the app — so nothing is left playing behind
  you" — is backed by real code: `AudioOutputGate.tsx:180`,
  `if (isAudioOutputEnabled()) panicMuteAudio();` on the AppState transition. The
  removed clause was the false one. One nuance: pass 3 deliberately narrowed the
  trigger to `background` only, so Control Centre / the app-switcher preview /
  a permission prompt (`inactive`) do **not** mute — which most users would call
  "leaving the app". The sentence is accurate to the code and slightly generous
  to it. Not worth changing; worth knowing.
- **14. Scenarios `correctGreen`** (`ScenariosScreen.tsx:496`). `correctGreen` is
  a real `AnswerCell` state (`AnswerCell.tsx:18, 29`) and it is the exact state
  that drives both the ✓ glyph (line 120–122) and the `", correct"` suffix on the
  accessibility label (line 64). The fix does what it says, for both sighted and
  screen-reader users. ✔
- **15. `AccuracyNote` out of the page-0 block** (`PagedLab.tsx:197`). It now
  renders on every page, which is the point, and it is unconditional so nothing
  auto-appears (Low-Light safe). One cosmetic side effect: on page 0 the note
  now renders **above** the subtitle rather than below it, and `styles.accuracy`
  was spaced for the old position. Worth a look on a device; not a bug.
- **16. `modWaveA` Hz/kHz casing.** Correct SI casing throughout, including the
  `DIFFRACTION_CHECK.reveal` prose that references the readout labels, so the
  text and the readouts still agree. ✔

---

## What I would fix first

1. **§11 — `restart` leaks a project per tap.** One line
   (`{ ...seedActivityProject(...), id: project.id }`), it makes the commit's own
   comment true, and it is the only new bug this pass introduced.
2. **§2(a) — the budget field that blanks itself.** Keep the draft when the
   value is null and say why, rather than deleting the answer and the evidence
   together.
3. **§1 — put a timeout on `await reconcileFromServer()`.** A best-effort read
   should not be able to hold the enrolment push open forever, one file away
   from a fix that makes exactly that argument.
4. **§5 — switch `namesGatedRole` to `matchAll` / the test's own regex**, so
   "Outrigger tech, rigger" stops reading as clean.
5. **§2(b)/(c)** — decide the locale question deliberately and show the user the
   number the app decided on.
6. **§10** — either restore a delete path for production projects or delete
   `remove`/`duplicate`; an unreachable pair of carefully-serialized writers is
   how the next person concludes deletion is handled.
