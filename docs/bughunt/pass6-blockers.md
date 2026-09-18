# Pass 6, agent B — blockers only, whole app, final sweep

# COUNT: 0

**No new blocker.** Nothing I can defend as "this would lose a customer their
money, their work, their access or their hearing, or get the app pulled."

Every blocker-shaped thing I found this pass was already on the brief's fixed
list, the open list, or in `LAUNCH_READINESS.md`. Four times I got far enough
into a trace to start writing a finding, and four times the grep against
`docs/bughunt/` came back with it already filed — by name, with a line number,
in an earlier pass. That is what a sixth pass over a well-hunted tree looks
like, and I would rather say it plainly than pad.

The rest of this report is the evidence for the zero: where I went, what I
verified is genuinely in place (not just claimed in a comment), the four
candidates I killed and why, and the two questions the repo structurally cannot
answer.

---

## 1 · What I killed, and where it is already filed

These are the four I traced to the end before finding them already known. They
are listed so a seventh pass does not spend the same hour, and because each one
is a *verification* of an open item the owner still has to act on.

**1. No purchase listener exists outside the Paywall.**
`src/features/commercial/purchase.ts:104` (`initPurchases`) is the only place
`purchaseUpdatedListener` is ever registered, and
`src/screens/commercial/PaywallScreen.tsx:111` is its only caller;
`teardownPurchases` (`purchase.ts:141`) nulls `handlers` and removes the
listeners on unmount. `finishTransaction` runs only in the `ok` branch
(`purchase.ts:118`), so an unvalidated Google purchase is never acknowledged and
Play auto-refunds it. **Already filed:** `pass2-network.md §10`,
`pass2-journeys.md` (the interrupted-transaction case), `LAUNCH_READINESS.md`
A7 and 2B Tier 2 ("Purchase listeners live only while the paywall is mounted").
Confirmed still true in the working tree today.

**2. `validate-purchase` binds a receipt to no account.**
`supabase/functions/validate-purchase/index.ts:220-285` writes the entitlement
keyed on `(user_id, product)` with no check that `store_ref` is already claimed
by someone else, so one bought transaction id could be redeemed by unlimited
accounts. **Already filed:** `pass1-entitlement.md` ("no uniqueness check on
`store_ref`", Blocker 4 / receipt binding), and `LAUNCH_READINESS.md` A6 warns
explicitly not to "fix" the Google refund matching by flipping the `||` because
it re-opens this hole. Still open, still server-side.

**3. `getDeviceId` regenerates on a storage read failure, and the single-device
guard then signs the user out and wipes local data** with *"Your account was
signed in on another device"* — `deviceIdentity.ts:16-35` →
`singleDevice.ts:49-54` → `SingleDeviceGuard.tsx:49-65`. **Already filed:**
`pass2-persistence.md §11`, rated MINOR there, and I agree with that rating: it
needs a persistent AsyncStorage failure, and the wipe correctly preserves
`ape:finalExamQueue`.

**4. The paid-lab scrim / accessibility hole.** In flight in the working tree
while I was reading (`withMembershipPreview.tsx:145-155`). I checked the fix
rather than the bug: `UpgradeSheet` is drawn by the root-level
`LabPreviewOverlay` (`App.tsx`), **not** inside `Screen`, so hiding the gated
subtree does not also hide the upgrade path or trap a screen-reader user on a
dead screen. The fix is sound. It does add a wrapping `View` to ~40 routes —
`LAUNCH_READINESS.md` is right that this wants a visual smoke test.

---

## 2 · Verified actually in place (not just documented)

I spent most of the pass confirming that the fixes the brief claims are real
code, because a regression in one of these would itself be the blocker.

| Promise | Verified at | Verdict |
|---|---|---|
| Shake-to-mute reaches file playback | `panicMute.ts:26` calls `stopAllFilePlayers()` **first and synchronously**; `filePlayers.ts:69-95` pauses without zeroing volume | ✅ real |
| Every file player is registered *and* capped | Registration is fused into `applyCeiling` (`outputCeiling.ts:77`); all three creation sites call it — `earPlayer.ts:140`, `LabAudioPlayer.ts:93`, `AudioPlayer.tsx:69`. `grep` for `createAudioPlayer\|useAudioPlayer` returns exactly those three | ✅ real |
| Backgrounding silences the app | `AudioOutputGate.tsx:150-180`, `'background'` only, not `'inactive'` | ✅ real |
| No sound without the gate | All 17 `genStart`/`binStart`/`modStart`/`Speech.speak` sites carry `requestAudioOutput` in the same file (18/18 files checked individually) | ✅ real |
| Exam queue survives sign-out, replays only its own owner | `clearLocalAccountData.ts` KEEP list; `finalExam/api.ts:392` owner check; lock released across the network loop (`:358-377`) | ✅ real |
| Members-only labs gated at the navigator | `test/membershipGating.test.ts` asserts **both** halves (wrapper *and* predicate) plus a non-vacuity assertion on the parse; 1505 tests pass | ✅ real |
| Tool training layer gated at the destination | `ToolLearnScreen:49`, `ToolDemoScreen:43`, `ConceptModuleScreen:41`, `MeasurementLibraryScreen:429` each branch on `useToolsLocked()` and render `ToolAcademyLock` instead of the content — not merely a greyed button | ✅ real |
| Dev bypasses are off | `devMode.ts` — `bypassAcademyLocks`, `bypassQuizLocks`, `bypassMethodLocks` all `false`, and `devBypass()` is `__DEV__`-guarded anyway | ✅ real |
| Paywall carries Terms + Privacy beside the buy controls | `PaywallScreen.tsx:281-292` | ✅ real |
| Directory block + report are wired to UI | `blockMember`/`reportMember` called from `AudioCommunityDirectoryScreen:223,270` and `RequestsView:105,332` | ✅ real |

`npx tsc --noEmit` clean. `npm test` — 1505 pass, 0 fail, 228 suites.

---

## 3 · Where I looked and found nothing

Ordered by how hard I looked.

**Money.** `purchase.ts` end to end; `validate-purchase/index.ts` line by line
(Apple JWS path, Google OAuth path, the tenure clock, the never-shorten rule,
the `grant_failed` no-lie branch); `PaywallScreen` purchase, restore, manage and
policy paths; `accessCode.ts`; `iapProducts.ts`. I checked the expo-iap **5.5.1**
type definitions in `node_modules` to confirm the `apple`/`google` request keys
the app uses are correct for the installed version (they are — `types.d.ts:1573`,
`:1669`) and that `subscriptionOffers` is optional. Nothing new beyond §1.

**Entitlement.** `EntitlementProvider` in full — the generation counter, the
bounded retry, `resolved` vs `tierKnown`, the `refreshEntitlement` re-read of
session identity after the await, the `useMemo` dep list; `entitlementExpiry.ts`;
`studyGate.ts`; `realAccount.ts`. `caps.audioTools` has **zero consumers** — I
chased that as a possible "paid feature free" and it is not one: the tools are
deliberately free and the member-only extras gate on `isMember` via
`useToolsLocked`, which is correct and enforced at each destination.

**User work.** `measurementStore.ts` + both backends + the legacy-key migration;
`finalExam/api.ts` queue in full; `studyQueueStorage.native.ts`;
`projectStore.ts`; `clearLocalAccountData.ts` / `accountLocalSync.ts` /
`SingleDeviceGuard.tsx`; `authStorage.native.ts` chunking. The one thing I'd
flag as *worth knowing* rather than as a finding: three modules open the same
`ape-studio.db` with three separate handles (`measurementsBackend.native.ts:45`,
`studyQueueStorage.native.ts:18`, `submissionQueueStorage.native.ts`), and two of
them use `withTransactionSync`. I could not produce a path where that loses data
and I will not assert a SQLITE_BUSY risk I have not reproduced.

**Sound and hearing.** `panicMute`, `outputCeiling`, `filePlayers`,
`AudioOutputGate`, `exposureMonitor` (dose model, background rule),
`cymatics/useDriveTone.ts` (the newest sound source in the app — properly gated,
level-capped to −40…−12 dBFS, stops on blur). The dose math in
`splSafety.ts` — `allowMin = Tc·60·2^(−(L−Lc)/ER)` is correct for both criteria,
and the mismatched-list case announces the truncation rather than silently
under-reading a dose (`:472-480`).

**Numbers acted on in the field.** `calcUnits.ts` (every quantity converts to a
base unit before `compute` sees it; °F is a real affine conversion, not a scale
factor); `powerElec.ts` voltage drop and the reverse gauge solve — the round trip
is `2L`, and `Math.floor(awgReal)` rounds toward the **thicker** conductor, which
is the safe direction. The known-open `dBV = dBu − 2.218 · dBu = dBV + 2.218`
separator bug (`pass3-teaching.md §1`) is still there and still worth fixing.

**Crashes.** No eslint is installed in this repo, so the conditional-hook class
that caused the pass-1 Dashboard cold-load crash has never been swept
mechanically. I wrote a scanner (brace-depth tracking over every `.tsx`,
component-shaped functions, hook calls at function top level after an early
return) and ran it over all of `src`. **Three hits, all three false positives**
— `return h;` inside a `useState` initialiser (`EnvelopeLabScreen.tsx:80`), a
`returnDb` property name (`pagesAdvB.tsx:291`), and a non-hook helper called
`useLabel` (`KnowScene.tsx:232`). A second sweep for hook calls indented inside
conditionals returned only `useFocusEffect(useCallback(…))` continuation lines.
**There is no conditional-hook crash left in the app.** That negative is, I
think, the most useful thing in this report.

**Store-pull risk.** `app.json` (permissions, usage strings, intent filters);
restore control, account deletion, Terms/Privacy on the purchase screen, and UGC
block/report all present. The two real store risks — the Community Directory's
age posture and the submission pack's two false console answers — are already
`LAUNCH_READINESS.md` D1 and A11, and both are the owner's decisions, not code.

---

## 4 · What a repo-only pass cannot settle

Not findings. Stated so the zero is not mistaken for coverage it does not have.

1. **The server.** 40 of 52 RPCs and 25 of 31 tables have no definition in this
   repo (`pass5-server.md §0`). Everything that decides whether a certificate is
   minted, whether a refund lands, and whether progress rows are writable lives
   there. `LAUNCH_READINESS.md` A1–A3 is still the highest-value hour available,
   and nothing I did this pass substitutes for it.
2. **Content.** ~22,700 glossary definitions and the quiz banks are in Supabase
   and have never been read by any pass. A wrong answer key on a graded Final
   Exam would be a blocker by any definition, and no agent can see one.

---

## 5 · My honest read

The app code is in good shape. Six passes and ~48 agents have taken the
blocker-class defects out of the client, and the pattern in this tree now is
that when I find a sharp edge, there is already a comment above it explaining
which pass found it and why the fix is shaped the way it is.

What is left that can hurt a customer is not in the bundle: the undeployed money
path, the unknown certificate trigger, and the fact that a hundred-odd changed
files have still only been verified by a type-checker. I would spend the next
hour on `pass5-device-script.md` and the ten read-only queries, not on a seventh
code pass.

*Read-only throughout. No source file was modified by this agent.*
