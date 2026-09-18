# Pass 4 — agent A — adversarial verification of the pass-3 fixes

Scope: every item under "FIXED in pass 3" in `docs/bughunt/BRIEF.md`, plus the
pass-2 fixes those commits touched again. Commits read in full:
`0bbde663`, `0407b131`, `020912e1` (and `2cdcd53b`, brief only).

**Build state:** `npx tsc --noEmit` → exit 0, no output.
`npm test` → **1485 pass / 0 fail**, 222 suites, 7.0 s. Neither tells you
anything about the findings below; three of them are invisible to the suite by
construction.

READ-ONLY: no source file was edited. This report is the only file written.

---

## Verdict table

| # | Fix (pass 3) | Verdict |
|---|---|---|
| 1 | `enrollmentStore` pull-before-push reconcile | **BROKEN** |
| 2 | `tierKnown` exported from `EntitlementProvider` | **NEW BUG INTRODUCED** |
| 3 | `MEMBER_ONLY_EXTRA_ROUTES` / `isMemberOnlyLabRoute` | HOLDS WITH CAVEATS |
| 4 | `membershipGating.test.ts` "the wrapper is not the gate" | HOLDS WITH CAVEATS |
| 5 | 43 calculator `formula:` separators | HOLDS WITH CAVEATS |
| 6 | `saveMeasurement` → Promise + injected reporter | HOLDS WITH CAVEATS |
| 7 | `parseQuantity` in `CalcProjectsScreen` | HOLDS WITH CAVEATS |
| 8 | `GateHold` spinner + GO BACK | HOLDS WITH CAVEATS |
| 9 | `ProductionStageScreen` failed-write banner | HOLDS WITH CAVEATS |
| 10 | `<AccuracyNote/>` into the `PagedLab` shell | HOLDS WITH CAVEATS |
| 11 | Settings gates on `tierKnown`; DELETE ACCOUNT stays | HOLDS WITH CAVEATS |
| 12 | `refreshEntitlement` returns `Entitlement \| false` | HOLDS |
| 13 | Paywall welcome + restore branch on the tier | HOLDS |
| 14 | `useCredentialCelebration` → `confirmShown()` | HOLDS |
| 15 | `panicMuteAudio` on `background` only | HOLDS |
| 16 | Exam retry notifies once | HOLDS |
| 17 | `parseQuantity` in `calcPanel` + "check this value" | HOLDS |
| 18 | `EngineGate onRetry` at 9 call sites | HOLDS |
| 19 | Log-out copy names what is destroyed | HOLDS |
| 20 | Help: in-app delete, telemetry disclosed | HOLDS |
| 21 | `CareerFamilyScreen` free-topics copy | HOLDS |
| 22 | `fmt()` — 48000 reads as 48000 | HOLDS |
| 23 | `filePlayers` pause-only (pass 2, re-checked) | HOLDS |
| 24 | `attemptDraft` (pass 2, re-checked) | HOLDS |

---

## 1. BROKEN — the enrollment reconcile is inert, and it still fails OPEN

`src/features/enrollment/enrollmentStore.ts` lines 96–135 (`reconcileFromServer`)
and 137–178 (`scheduleServerSync`). Commit `0407b131`.

The fix is meant to stop a reinstall pushing a two-topic seed over a paying
member's enrollment master list — which the backend gates v3 study and quizzes
on. It does not, for three independent reasons.

**(a) The read can never return a row.** The store does a direct PostgREST
select:

```ts
const { data, error } = await supabase
  .from('user_topic_enrollments')
  .select('gs, favorite, active, position')
  .order('position', { ascending: true });
```

`docs/APE_SECURITY_REVIEW_2026_08_28.md` §F-"Live tables in the deny-all set"
names `user_topic_enrollments` explicitly, and states the failure mode in as
many words:

> "If any client code ever queries one of these **directly** (rather than via an
> RPC), it will silently return **zero rows** instead of erroring. That failure
> mode is invisible in testing."

So `error` is null, `rows.length === 0`, and the function returns at
`if (rows.length === 0) return; // the server has nothing to teach us`. The
`console.warn` the author left as a tripwire — *"if this is a missing grant, it
is worth someone seeing"* — is on the `error` branch and will therefore never
fire. The fix is a no-op on every device, and it is a no-op **silently**, which
is the specific thing it was written to avoid.

**(b) It fails OPEN.** Even where the read does fail loudly, the very next
statement is the destructive one:

```ts
await reconcileFromServer();            // returns quietly on any failure
const { error } = await supabase.rpc('sync_my_enrollments', { p_items: list… });
```

A pull that did not happen does not stop the push. On a reinstall with one flaky
read, the seed still overwrites the master list. The brief's own standing rule is
*fail CLOSED on entitlement, fail OPEN on infrastructure* — but this is not an
infrastructure convenience, it is a destructive write whose only safety check
just failed. It should skip the push (and re-arm the existing backoff) whenever
the pull did not produce a definitive answer.

**(c) `reconciled` latches on failure.** `reconciled = true` is set on line 112,
*before* the `try`. One failed or empty read disables the pull for the rest of
the app run, so the retry backoff in `scheduleServerSync` re-pushes without ever
re-reading.

Two smaller notes on the same function:
- The select carries no `.eq('user_id', …)`. It relies entirely on RLS to scope
  rows to the caller. Given the app's own history (`project_v3_credential_rls`:
  a public-read policy added to make a catalog table visible), if anyone ever
  adds a permissive read policy here to "make the pull work", this adopts *every
  user's* rows into a fresh device's list. An explicit uid filter costs nothing.
- The column list may not exist. `DROP_V1_SCAFFOLDING_2026_09_03/10_APPLY_rewrite_live_functions.sql`
  keys the table on `ute.achievement_id`; the select asks for `gs`. I cannot
  resolve this from the repo.

**Severity:** BLOCKER, unchanged from before the fix — a reinstalling paying
member still loses their enrollment list, and the app still shows them as
enrolled while the server refuses.
**Confidence:** high on (b) and (c) (pure code reading). High on (a), resting on
the repo's own security review rather than a live DB.
**What would settle it:** on the live DB, `select * from pg_policies where
tablename='user_topic_enrollments'` plus a column list, and one authenticated
client select. If the table is still deny-all, the pull must go through an RPC
(`get_my_enrollments`) exactly as the push does.

---

## 2. NEW BUG INTRODUCED — `tierKnown` is not a dependency of the context memo

`src/features/commercial/EntitlementProvider.tsx` line 514 (the value) vs line
516 (the dependency array). Commit `020912e1`.

```ts
const value = useMemo<EntitlementContextValue>(
  () => ({ …, resolved, setCommercialMode, setEntitlement, refreshEntitlement, tierKnown }),
  [commercialMode, entitlement, resolved, setCommercialMode, setEntitlement, refreshEntitlement],
);                                                            // ← no tierKnown
```

`setTierKnown(true)` re-renders the provider, but with every dependency
unchanged `useMemo` hands back the **cached object**, which still carries
`tierKnown: false`. Consumers never see the flip.

On the happy paths this is masked: `deriveWithRetry` flips `tierKnown` in the
same batch as either `resolved` (false→true) or `entitlement`
(`'anonymous'`→ a real tier), and either one re-computes the memo.

It is not masked on the path the code itself documents at line 364: `getSession()`
rejecting on a secure-store read error. Then `.catch()` runs, `deriveWithRetry`
is never called, `resolved` flips true in the `.finally()`, and `tierKnown` stays
false. The subsequent `INITIAL_SESSION` from `onAuthStateChange` calls
`deriveWithRetry` → for a guest it sets `'anonymous'` (no state change, React
bails) and `setTierKnown(true)`. `resolved` is already true. **The memo does not
recompute and `tierKnown` is stuck at false for the whole app run.**

Consequences, all in `SettingsScreen.tsx`: MEMBERSHIP summary stuck on `…`,
Status stuck on `CHECKING…`, the guest's "Sign in / create account" row never
appears (line 723), and DELETE ACCOUNT is shown to a guest indefinitely (line
791). Also `requestLocalNotifSync` is not the issue — that effect reads the state
directly, not the context.

**Severity:** MINOR today (narrow trigger, degraded-but-safe outcome), but it is
a latent correctness bug in the one value the pass-3 fix was built around, and
the next consumer to gate on `tierKnown` inherits it.
**Fix:** add `tierKnown` to the array. One word.
**Confidence:** high — this is React semantics, not speculation.

---

## 3. HOLDS WITH CAVEATS — `MEMBER_ONLY_EXTRA_ROUTES` is incomplete

`src/screens/lab/labCatalog.ts` lines 531–575.

**Does it fix the stated bug?** Yes. I traced it end to end.
`withMembershipPreview` (`src/features/lab/withMembershipPreview.tsx`) calls
`isMemberOnlyLabRoute(route.name)`; the predicate now returns true for the nine
listed routes; `labRouteName` resolves for all nine (`'Cymatics Lab'` /
`'Production Labs'`), so `startLabPreview(route.name, …)` no longer falls back to
`'This lab'` and the upgrade sheet reads correctly. The
`proaudio://labs/cymatics/plate` hole is closed.

**Is anything now members-only that should be free?** No. All nine sit behind
`CymaticsLab` (category `physics`, `section: 'training'`) or `PreProdLab` /
`PostProdLab` (`member: true`). None has a free context.

**What it misses.** I enumerated all 118 `<Stack.Screen>` registrations in
`RootNavigator.tsx` and checked every one that sits inside or behind a paid lab.
Eight more child routes are behind a members-only parent and are **not** gated —
registered with `Gated.X` (the orientation wrapper, which checks nothing) or with
a bare screen, and absent from `MEMBER_ONLY_EXTRA_ROUTES`:

| Route | Registered as | Paid parent |
|---|---|---|
| `DigitalModule` | `Gated.DigitalModule` | `DigitalLab` (`member: true`) |
| `EqModule` | `Gated.EqModule` | `EqLabHome` (`training`) |
| `GainModule` | `Gated.GainModule` | `GainLabHome` (`member: true`) |
| `EarModule` | `EarModuleScreen` | `EarTrainingLab` (`training`) |
| `AmpModule` | `AmpModuleScreen` | `AmpLab` (`training`) |
| `TubeReference` | `TubeReferenceScreen` | `TubeLab` (`training`) |
| `TubeCard` | `TubeCardScreen` | `TubeLab` (`training`) |
| `DeEsserLab` | `DeEsserLabScreen` | `SmartProcessorsLab` (`training`) |

(`MeterModule` is correctly gated — the catalog names it at labCatalog.ts:156.
`WaveModule` is correctly free — `WaveLab` is `section: 'fundamentals'` with no
`member` flag.)

**Not currently exploitable**, and I checked both ways in:
- None of the eight appears in `linking.ts`'s `config.screens`, and
  `isClaimedPath`'s `case 'labs'` only admits two-segment paths plus the four
  `LAB_DEEP_PATHS` regexes. No URL reaches them.
- There is **no navigation-state persistence** — `App.tsx` mounts
  `NavigationContainer` with no `initialState` / `onStateChange` pair, so a
  lapsed member cannot be restored into `EqModule`.
- Every in-app `navigate()` to them originates inside the gated parent
  (`DigitalLabHomeScreen.tsx:40`, `EqLabHomeScreen.tsx:25`,
  `GainLabHomeScreen.tsx:24`, `EarTrainingLabScreen.tsx:75`,
  `AmpLabHomeScreen.tsx:91/111`, `VacuumTubeLabScreen.tsx:825`).

So this is defence-in-depth, not a live hole. But it is *exactly* the
configuration that produced the pass-3 blocker: routes wrapped-or-not in the
navigator, invisible to the predicate, protected only by the accident that
`isClaimedPath` does not name them. The day someone adds
`labs/digital/module/:id` to the linking config — the same move that was made for
Cymatics on 2026-09-17 — all eight open at once. **MINOR now, BLOCKER on the next
deep-link change.**

Nit, not a finding: `if (route in MEMBER_ONLY_EXTRA_ROUTES)` walks the prototype
chain, so `isMemberOnlyLabRoute('toString')` is true and
`labRouteName('constructor')` returns a function typed as `string`. No route is
named any of those, so it costs nothing today; `Object.hasOwn` or a
`null`-prototype object would close it.

---

## 4. HOLDS WITH CAVEATS — the new test cannot see the bug it was written for

`test/membershipGating.test.ts` lines 105–122, "THE WRAPPER IS NOT THE GATE —
the predicate it calls must agree", commented as *"the only version of this test
that could not have passed while the app was open."*

It asserts `[...needed].filter(r => !isMemberOnlyLabRoute(r))` is empty. But
`needed` comes from `memberOnlyRoutes()` (line 53), which walks `LAB_CATEGORIES`
and applies `l.member || c.section === 'training'`, minus `alwaysFree` — and
`isMemberOnlyLabRoute` reads `computeLabRouteMembership(LAB_CATEGORIES)`, which
applies the same rule to the same data. It is two near-identical derivations
compared against each other. They can diverge only in two corners
(`computeLabRouteMembership` includes `extraLabs` and requires **every**
occurrence to be members-only; the test's copy uses **any** occurrence), so the
assertion has some teeth — but it has none at all for the class of bug in
question. The pass-3 blocker was *routes the catalog cannot name*, and `needed`
by construction contains only routes the catalog **can** name. It would have
passed on 2026-09-17 exactly as it passes now.

The assertion with real teeth is the third one (line 124, "the CHILD routes of
the two flagship labs"), which hard-codes a list and checks the wrapper **and**
the predicate. That is the right shape. Its list is hand-maintained and carries
the same eight omissions as finding #3, so nothing in the suite would notice a
ninth child route being added ungated.

**Suggestion:** derive the child set from the navigator instead — for every
`<Stack.Screen>` whose component expression is `Gated.X` or a bare screen, assert
it is not reachable from a members-only parent — or at minimum assert that
`MEMBER_ONLY_EXTRA_ROUTES` plus the catalog covers every route registered in the
lab block. **MINOR** (test quality), high confidence.

---

## 5. HOLDS WITH CAVEATS — six `·`-as-separator formulas were missed

I checked all 43 changed strings against their `compute()` and `plainFormula`,
and then swept every remaining `formula:` in `src/screens/lab/calc/workspaces/`.

**In the "changed a genuine multiplication by mistake" direction: zero.** All 43
conversions are correct. The three restorations are right too — `Vpeak = Vrms ·
√2; Vpp = 2 · Vpeak`, `A = Σ (Sᵢ · αᵢ); RT60 = 0.161 · V / A` and
`Vrms = Vpeak / √2; Vpp = 2 · Vpeak` each keep their real multiplies and convert
only the separator.

**In the other direction, six were missed.** Each is confirmed by its own
`plainFormula`, which already uses a semicolon or "and" at exactly the point the
`·` sits:

| File:line | String | Why it is a separator |
|---|---|---|
| `src/screens/lab/calc/workspaces/loudness.ts:155` | `ΔLU = A − B · perceived ≈ 2^(ΔLU/10)` | `compute` is `n(v.lufsA) - n(v.lufsB)` — nothing multiplies. plainFormula: *"equals A minus B; the perceived loudness ratio is…"* |
| `src/screens/lab/calc/workspaces/speakers.ts:739` | `load = Σtaps · amp ≥ Σtaps × 10^(headroom/10); I = …` | `load = taps.reduce(sum)`. plainFormula: *"equals the sum of the tap settings; the recommended amplifier is…"* |
| `src/screens/lab/calc/workspaces/speakersAdv.ts:148` | `onset ≈ c/L · tight control ≈ 2c/L` | Two relations. The same file writes it correctly in prose at line 131: *"onset ≈ c/L (tight at 2c/L)"* |
| `src/screens/lab/calc/workspaces/speakersAdv.ts:199` | `point: −20·log₁₀(r₂/r₁) · line (near field): −10·log₁₀(r₂/r₁)` | Two labelled cases |
| `src/screens/lab/calc/workspaces/roomsMusic.ts:116` | `beat (ms) = 60000 / BPM · dotted ×1.5 · triplet ×2/3` | Three clauses |
| `src/screens/lab/calc/workspaces/levels.ts:973` | `f1–f2 from fc & Q · audibility widens with \|gain\|` | Two clauses |

`src/screens/lab/calc/workspaces/wavesAdv.ts:165`
(`2nd: f₂±f₁ · 3rd: 2f₁±f₂, 2f₂±f₁`) is the same shape but reads as a bullet
between two labelled lists rather than as arithmetic — borderline; I would fix it
for consistency, not because it misleads.

`speakers.ts:739` is the sharpest of these: the commit **edited that exact
string**, converted the second `·` and left the first, so the line now teaches
two different meanings for punctuation inside one formula.

Three strings that survived the sweep and are correct as-is: `f = n · c / (2 ·
L) … n = 1…4` and `f = n · c / (2 · d), n = 1…6` (`roomsMusic.ts:706/768`) and
`Δf · T = 1` (`timePhase.ts:900`, a genuine product).

**Severity:** MAJOR for `loudness.ts:155` and `speakersAdv.ts:148` under the
brief's "wrong information shown as fact" — `B · perceived` and `c/L · tight` are
readable as arithmetic in a product the brief calls a field source of truth.
MINOR for the other four. Confidence: high.

---

## 6. HOLDS WITH CAVEATS — `saveMeasurement`

`src/features/tools/measure/measurementStore.ts` lines 202–262; reporter wired at
`App.tsx:141`.

Verified against every question asked:
- **Can it fire during a test?** No. `reportSaveFailure` defaults to `null` and
  the node test imports the store directly; only `App.tsx` injects, and no test
  imports `App.tsx`.
- **Twice, or from a background save?** No. All eight call sites are
  user-initiated `onSave` / `onSaveSnapshot` callbacks (`FrequencyCounterScreen`
  557 and 1099, `MultiMeterScreen` 897, `Rt60Screen` 358, `RtaScreen` 952,
  `SpectrogramScreen` 410, `SplMeterScreen` 1301, `WaveformScreen` 298) — none is
  inside an effect, interval or auto-save. One tap, at most one dialog. `notify`
  falls back to `Alert.alert` when the dialog host is unmounted
  (`src/lib/confirm.ts`), so the message always lands.
- **Unhandled rejection from `void saveMeasurement(...)`?** No. `hydrate()`
  swallows everything internally and the `putRow` await is inside a `try`.
- **Does the in-memory list still update before the write?** Yes —
  `list = next` precedes `await putRow(...)`, and `emit()` runs on both paths.

**The caveat:** the commit's own diagnosis was *"All eight tools set their
success state on the next line"* — and all eight still do. The call sites were
changed from `saveMeasurement(…)` to `void saveMeasurement(…)` and nothing else;
e.g. `FrequencyCounterScreen.tsx:589` still runs `setJustSaved(true)`
unconditionally. On a failed write the user gets **SAVED ✓ and a "Measurement
not saved" dialog at the same time**. The dialog wins and the user is not
deceived, so this is not the original blocker — but a green tick under a failure
alert is not what "the message lives in the store" implies, and the Promise now
returned is discarded at all eight sites. Awaiting it to gate the tick is one
line per screen. **MINOR.**

---

## 7. HOLDS WITH CAVEATS — `parseQuantity` in `CalcProjectsScreen`

`src/screens/lab/calc/CalcProjectsScreen.tsx` lines 127–140.

**Does an existing saved project still load and run?** Yes, and I checked the
round trip. `toDraft` (line 46) regenerates every `raw` string from the stored
`baseValue` via `fmt(units[0].fromBase(v.baseValue), 6)`, so a draft row is
always machine-generated text, never the user's original keystrokes. Every output
`fmt` can produce is accepted by `parseQuantity`: plain decimals, and the
exponential form above 1e7 / below 1e-4 (`parseQuantity`'s regex allows
`[eE][+-]?\d+`). `'0'` parses; the non-finite `'—'` case cannot arise because
`saveProject` already rejects non-finite at line 134.

**Migration concern:** none. The change is at write time only; no stored value is
re-interpreted. Note that the `fmt(…, 6)` round trip quantises to six significant
figures on any re-save, but that predates this commit (`parseFloat` did the same)
and is not a regression.

**The caveat:** `if (!label || !Number.isFinite(base)) continue;` now drops a row
**silently** where `parseFloat` used to keep a wrong one. A user who types
`47uF`, `10,00` or `1.2.3` into a labelled row, names the project and taps SAVE
gets a successful save with that row gone and no message. `calcPanel` got a
"⚠ Check this value" hint for exactly this case (finding #17, which holds);
this screen did not. Silent is better than wrong, but it is still the user's
labelled row vanishing. **MINOR** — count the skipped rows and say so in the
existing `notify` path.

---

## 8. HOLDS WITH CAVEATS — `GateHold`

`src/features/lab/withMembershipPreview.tsx` lines 62–95 and 118–128.

**Does the paid lab still never mount in that window?** Yes. Both guards are
unchanged and still sit above `return <Screen {...props} />`:
`if (memberOnly && !resolved) return <GateHold …/>` and
`if (gated && !armedForThis) return <GateHold …/>`. The preview-arming `useEffect`
runs on mount regardless of which branch renders. The 4 s timer is `useEffect(…,
[])` and is cleared on unmount. No regression.

**The caveat you asked about is real but narrow.** `onBack` is always supplied
(`goBack` is an arrow function, always truthy), so `slow && onBack` renders the
button unconditionally after four seconds. Its handler is
`if (navigation.canGoBack()) navigation.goBack();` — a **no-op when `canGoBack()`
is false**, i.e. a visible button that does nothing on the screen whose entire
purpose is to stop the user being trapped.

I could not construct a case where `canGoBack()` is actually false:
`linking.config` declares `initialRouteName: 'Splash'`, so a cold-start deep
link builds `[Splash, <lab>]`; `navigateToPath` explicitly navigates rather than
resets, so a pendingLink resume lands on top of an existing stack. So the button
should work in practice. But the handler is written as though the false case can
happen, and if it ever does the user is back in the trap with a dead control on
screen. One line fixes it for good:
`navigation.canGoBack() ? navigation.goBack() : navigation.reset({ index: 0, routes: [{ name: 'Main' }] })`.
**MINOR**, medium confidence on reachability; a deep-link cold start on device
with `canGoBack()` logged would settle it.

---

## 9. HOLDS WITH CAVEATS — `ProductionStageScreen` failed-write banner

`src/screens/lab/production/ProductionStageScreen.tsx` lines 55–100 and 125–135.

The banner appears, is `accessibilityRole="alert"` with an assertive live region,
and covers both mutating call sites on this screen. Three residual problems:

1. **The banner clears while the data is still lost.** `setSaveFailed(false)` on
   any later success. But `createProjectStore.mutate`
   (`src/features/production/projectStore.ts:173`) re-reads the whole list from
   storage and writes it back — it does not carry the screen's optimistic state.
   So if field A's write fails and field B's succeeds, A is **still** absent from
   storage and the warning telling the user to re-enter it disappears the moment
   they touch the next field. The banner should latch per-field, or at least stay
   until the user acknowledges it.
2. **`null` conflates two different failures.** `mutate` returns `null` both when
   `write()` fails *and* when `all.findIndex(p => p.id === id) < 0` — the project
   is gone. A deleted or missing project therefore tells the user to "free up
   some space", which is wrong information at the point they most need the right
   information.
3. **The same silent discard remains one screen over.** The commit says "every
   call site in ProductionStageScreen", and that is literally true — but the
   sibling screens in the same paid lab were untouched:
   - `ProductionLabScreen.tsx:82` — `await projectStore().upsert(p)` in
     `start()`, boolean discarded. A failed write means the new project never
     persists; `reload()` then will not find it and `setOpenId(p.id)` points at
     nothing, with no message.
   - `ProductionLabScreen.tsx:96` — `acceptCondition` discards `null`, which here
     ALSO means "refused because the name or reason was blank". The sheet closes
     either way with no explanation.
   - `ProductionActivityScreen.tsx:60` and `:81` — `upsert(seeded)` discarded,
     then `setProject(seeded)` shows a project that may never have been written.

**MINOR–MAJOR**, high confidence (all read directly from the store source).

---

## 10. HOLDS WITH CAVEATS — `<AccuracyNote/>` in the `PagedLab` shell

`src/screens/lab/kit/PagedLab.tsx` lines 194–212.

The note now renders for all seven shell-based labs, and for any lab added later
— which is the right structural move. But it is rendered **inside the page body,
gated on `page === 0`**, and the same component restores the user's last page on
mount:

```ts
void loadPagedProgress(labId).then((p) => { … setPage(Math.min(p.lastPage, pages.length - 1)); });
```

So a returning user resumes on page 4 and never sees it; only a first visit (or a
reset) shows it at all. The standing rule is that every lab carries the note *in
its header*. Moving it next to the title/kicker block (outside the `page === 0`
branch) would make the claim true. **MINOR**, high confidence.

---

## 11. HOLDS WITH CAVEATS — Settings gating on `tierKnown`

`src/screens/settings/SettingsScreen.tsx` lines 97, 654, 658–668, 723, 791.

The offline-member regression is genuinely fixed: `tierKnown` is only ever set by
`markKnown()` inside `deriveWithRetry`, which runs only when `deriveAndApply`
returned true — i.e. a read produced a tier, or there is definitively no session.
It is never true when it should not be. (Subject to finding #2, which can leave
it stuck *false* — the safe direction.)

**Does DELETE ACCOUNT appear for a genuine guest?** For a *settled* guest, no:
`hasSession === false` short-circuits `deriveAndApply`, `tierKnown` flips true
without any network, `isGuest` is true, and `{tierKnown && isGuest ? null : …}`
hides it. Correct.

It **is** visible in the tier-unknown window, which is the deliberate trade. If a
guest taps it there: 5-second hold → confirm → `supabase.rpc('delete_my_account')`
(`src/features/settings/DeleteAccountButton.tsx:70`). If the RPC refuses an
anonymous JWT, the `catch` shows "Could not delete account" and nothing is lost —
the honest failure the comment promises. **If it does not refuse**, the success
path runs `clearLocalAccountData()` + `resetAllLocalStores()`, which for a guest
wipes the only record of anything they have studied. I cannot tell which from the
repo — `delete_my_account` is not in any `.sql` file here. Given the 5-second hold
and two confirmations the practical risk is low, but it is worth knowing.
**What would settle it:** the definition of `delete_my_account` and whether it
guards on `auth.jwt()->>'is_anonymous'`.

---

## The eleven that hold clean

- **12. `refreshEntitlement: Promise<Entitlement | false>`.** I traced every
  caller, including transitive ones. There are exactly four:
  `PaywallScreen.tsx:70` (branches on `tier === 'academy'` — correct),
  `PaywallScreen.tsx:216` (`=== 'academy'` — correct),
  `AuthScreen.tsx:239` (`await`, result discarded — unaffected by the change),
  `SettingsScreen.tsx:113` (`await`, result discarded — unaffected). **No caller
  does a bare truthiness check**, so the "`'free'` and `'lapsed'` are truthy"
  hazard has no victim today. The doc comment on line 173 warns about it, which
  is the right guard for the next caller. The internal
  `entitlementRef.current = entitlement` assignment during render is read only in
  the dev-override branch (line 420), where it is correct.
- **13. Paywall.** The microtask/ref bug is genuinely gone — the value now comes
  back from the call rather than from a ref. `reflectPurchase` guards on
  `alive`, and the restore branch's `=== 'academy'` is the honest test.
- **14. `useCredentialCelebration` → `confirmShown()`.** Exactly one caller
  (`DashboardScreen.tsx:719–727`) and it calls `c.confirmShown()` on the branch
  that navigates to Celebration. Nothing is burned on a dropped result.
- **15. `panicMuteAudio` on `'background'` only** (`AudioOutputGate.tsx:168`).
  Correct: Android has no `inactive`, so the pass-2 finding ("backgrounding left
  lab tones playing") is still covered, while Control Centre and the mic
  permission prompt no longer kill the lab that raised them.
- **16. Exam retry notifies once** (`FinalExamScreen.tsx:209–223`). The
  `retryFinishMsRef` read is correct: false on the first failure (notify), then
  the `setRetryFinishMs` re-render updates the ref, so the 15 s retries are
  silent; a success nulls both and re-arms one future notice.
- **17. `calcPanel` parseQuantity + the "check this value" line**
  (`calcPanel.tsx:126–186`). The warning and the answer now share one parser. The
  hint flickers mid-typing (`10,` and `1e` both parse as null), which is
  cosmetic; the copy is accurate about what `parseQuantity` accepts.
- **18. `EngineGate onRetry`.** All nine sites pass `onRetry={start}`
  (SPL ×2, RTA, Waveform, Spectrogram, RT60, FrequencyCounter ×2, MultiMeter).
- **19. Log-out copy.** Names measurements, term lists, settings and the mic
  calibration, and says signing back into the same account does not restore them.
  Matches `clearLocalAccountData`.
- **20. Help.** In-app delete path is correct (Settings → DELETE ACCOUNT, 5 s
  hold). The telemetry answer now names crash reporting and usage analytics.
- **21. `CareerFamilyScreen`.** The new sentence claims only that *adding* is
  free, which is true, and discloses that studying needs membership.
- **22. `fmt()`.** The `p.includes('e') → String(Number(p))` round trip returns
  48000/44100/192000 as plain decimals; exponential is retained outside
  1e-4…1e7, where `parseQuantity` still accepts it.
- **23/24. Pass-2 re-checks.** `stopAllFilePlayers` is pause-only with no volume
  write (the zeroing regression is gone). `attemptDraft` is wired on both
  surfaces — load at start, save per answer, clear on submit
  (`FinalExamScreen` 107/167/316/390, `QuizScreen` 115/162/357). `QuizScreen`
  has no abandon-time clear, but a stale draft is keyed by `attempt_id` and a new
  attempt gets a new id, so nothing is restored wrongly.

---

## What I would fix first

1. **#1**, the enrollment reconcile — it is the only BLOCKER here, it is
   currently a no-op, and the data loss it was written to stop is still live.
   Minimum: do not push when the pull was not definitive.
2. **#2**, one word in a dependency array.
3. **#5**, six formula strings, one of which is in a line the commit already
   edited.
4. **#3/#4** together — the eight child routes and a test that can actually see
   them, before anyone touches the linking config again.
