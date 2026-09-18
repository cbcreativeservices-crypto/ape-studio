# Bug-hunt PASS 2 — Agent A: data persistence and identity

Axis: every key the app writes to the device, and everything that depends on WHO is
signed in. Read-only pass; no source file was edited.

The `ape:*` storage sweep in `clearLocalAccountData.ts` is thorough and the per-key
parse guards are, with two exceptions, excellent — so almost nothing here is a
"forgot to try/catch" finding. **The defects cluster in one place: the app has TWO
independent account-change detectors, and they disagree; and the in-memory half of
the wipe (`resetAllLocalStores`) has drifted out of sync with the storage half
(`clearLocalAccountData`).** Four separate stores hold the departing user's data in
module-level variables that survive the wipe, and one of them gates a hearing-safety
warning.

Ordered most severe first.

---

## 1. BLOCKER — The Sound Safety warning is silently skipped for the next person on the device

**Confidence:** high. Traced end to end; no unknowns.

**Where:**
`src/features/audio/soundSafetyAck.ts:71` (`let cached`), `:75-77` (`isAcknowledged`)
`src/features/audio/AudioOutputGate.tsx:122` (phase selection)
`src/features/account/clearLocalAccountData.ts:112-149` (`resetAllLocalStores` — no reset for this module)

**What the user does:** User A accepts the once-ever Sound Safety Warning. A signs out
(Settings → sign out, or Guest Mode, or user B signs in on the same phone). B — or the
guest — opens any lab or tool and enables audio.

**What happens:** B is never shown the hearing-damage warning. They go straight to the
ordinary "explain the setting" popup and on to sound.

**What should happen:** B has never acknowledged anything, so B sees the warning. The
file's own docblock (`soundSafetyAck.ts:10-17`) states the purpose: *"a once-ever,
versioned acknowledgment that the user has read what this app can do to their hearing
and their equipment"*, and the gate's comment at `AudioOutputGate.tsx:180-183` says
*"an acknowledgment nobody wrote down did not happen"*.

**Why (traced):**
- `clearLocalAccountData()` sweeps every `ape:*` key not on KEEP. `ape:soundSafety:v1`
  is not on KEEP (`clearLocalAccountData.ts:47-53`) and is not an onboarding flag
  (`:67-69`), so **the record on disk is deleted**.
- `resetAllLocalStores()` resets 19 stores. `soundSafetyAck` is not one of them — the
  module exports only `__resetSoundSafetyAckForTests`, which is never called by the app
  (verified by grep across `src/` and `App.tsx`).
- So `cached` still holds A's record. `isAcknowledged()` returns
  `cached != null && cached.version >= SOUND_SAFETY_VERSION` → **true**.
- `AudioOutputGate.tsx:122`: `setPhase(isAcknowledged() ? 'explain' : 'safety')` → the
  safety popup is skipped.
- `AudioOutputGate` is mounted at the app root (`App.tsx:439`) and is never unmounted,
  so `cached` lives for the whole app run. Only a cold relaunch clears it.

**Second-order consequence:** the state is now inconsistent in the worst direction.
`recordSoundSafetyAck()` is never called for B, so there is **no record on disk at all**
— the evidence artifact this module exists to produce does not exist for the user who
actually used the app. On the next cold launch the warning reappears, which will read
as a flapping bug rather than as the safety gate it is.

**Guest Mode is the same path and is worse:** `AuthScreen.tsx:169` runs
`clearLocalAccountData({ total: true })`, so a no-account guest — whom the owner's
2026-09-01 ruling says must be remembered in NO way — inherits A's acknowledgment and
never sees the warning.

**Fix:** register a `resetLocal()` in `soundSafetyAck.ts` (set `cached = null;
loaded = false`) and call it from `resetAllLocalStores()`. Alternatively, decide the
acknowledgment is device-level evidence and add `ape:soundSafety:v1` to KEEP — but then
`userId` is wrong for everyone after the first, so the reset is the correct fix.

**Related but different (do not conflate):** `pass1-audio-safety.md` reports a cold-start
race where the warning is shown *again* and the record is *overwritten*. That is the
opposite symptom, a different mechanism, and its fix (awaiting the load promise) does
not touch this one.

---

## 2. BLOCKER — Tapping AGREE on the glossary's temporary device ID deletes a guest's study progress

**Confidence:** high on the code path. Medium-high on the user-visible blast radius
(see "what would settle it").

**Where:**
`src/features/commercial/EntitlementProvider.tsx:305-312` (`clearLocalOnUserChange`) and `:353` (its call site)
`src/features/study/localProgress.ts:34-41` (`clearAllLocalMethodStates`)
`src/features/glossary/deviceKey.ts:120-131` (`mintDeviceKey` → `signInAnonymously`)

**What the user does:** A guest (no account) works through a free topic — flashcards,
fill-in-blank, matching. They then open the Glossary and tap **AGREE** on the temporary
device ID dialog.

**What happens:** every `ape:localMethod:*` key is deleted. For a guest that is the
*only* record of their study: the Dashboard LEDs drop to zero, CONTINUE reverts to
START, and the flashcards→homework→quiz power sequence re-locks.

**What should happen:** nothing. The dialog they just agreed to says, verbatim
(`src/lib/copy.ts:58-61`):

> "…No name, no email, no password, and none of your progress is stored with it."

**Why (traced):** `mintDeviceKey()` calls `supabase.auth.signInAnonymously()`, which
raises `SIGNED_IN` with a session whose `user.id` is a fresh anonymous uid.
`EntitlementProvider.tsx:353` passes that id straight through:

```ts
clearLocalOnUserChange(session?.user?.id ?? null);
```

with no `isRealAccount()` filter. In `clearLocalOnUserChange` (`:306`), `uidSeeded` is
true and the anon uid ≠ the previous `null`, so it runs `clearAllLocalMethodStates()`.

This is **exactly the hazard the sibling detector was fixed for**. `accountLocalSync.ts:69-75`
carries the warning in a ⚠️ block and maps an anonymous session to the guest identity
`''` *specifically* so it is not read as a user change — citing the same dialog copy.
`EntitlementProvider`'s copy of the logic never got that fix. `realAccount.ts:10-25`
enumerates the call sites that were audited when `isRealAccount` was introduced;
`clearLocalOnUserChange` is not among them.

**It recurs.** The 7-day purge forces a new key, which mints a new anon uid ≠ the stored
one, so the wipe fires again on a later visit — the `accountLocalSync` docblock
anticipates exactly this ("and again every time the 7-day purge forces a new one").

**A signed-in account is not affected:** `mintDeviceKey` returns early when
`getSession()` already has a session (`deviceKey.ts:122-123`), so a real user never
mints an anon key.

**Why "progress isn't saved without an account" does not excuse it:** that notice
(`DashboardScreen.tsx:1679`) is about the *server*. It is keyed correctly on
`isRealAccount` (`:747-751`) and it promises nothing about the device copy vanishing
mid-session while the app is open.

**Fix:** one line — `clearLocalOnUserChange(isRealAccount(session) ? (session?.user?.id ?? null) : null)`,
matching `accountLocalSync.ts:75`. `isRealAccount` is already imported in this file.

**What would settle the blast radius:** whether the study *gates* (not just the LED
display) read the local mirror for a guest. `localProgress.ts:8-10` says gates read
server truth and the mirror is display-only, but a guest has no server rows at all, so
in practice the mirror is all they have. A device run — study a free topic as a guest,
then accept the glossary dialog, then look at the Dashboard — settles it in two minutes.

---

## 3. BLOCKER — Signing in on a fresh install replaces the server enrollment list with the two free topics

**Confidence:** medium-high. The client path is certain; the impact depends on whether
`sync_my_enrollments` replaces or merges, which I cannot read (server-side RPC, not in
the repo). See "what would settle it".

**Where:** `src/features/enrollment/enrollmentStore.ts:109-160` (`hydrate`, the seed
block), `:69-108` (`scheduleServerSync`)

**What the user does:** a paying member reinstalls the app, or signs in on a second
phone, or signs in after someone else used the device.

**What happens:** ~800 ms after the Study/Home tab first reads enrollment, the app
sends `sync_my_enrollments({ p_items: [gs 3060, gs 3970] })` — the two free topics and
nothing else.

**What should happen:** the member's existing enrollment list should be read down from
the server, or at minimum not overwritten by a local list that was never populated.

**Why (traced):**
- Fresh/cleared storage → `hydrate()` reads `KEY` as null, `loaded = []`, `before = 0`.
- `SEED_KEY` (`ape:enrollmentSeeded5`) is also absent — it is an `ape:*` key and is swept
  by `clearLocalAccountData`, and on a reinstall it never existed — so the one-time seed
  block at `:127-153` runs.
- `freeAdd` = both `FREE_ENROLL_GS`, `loaded.length (2) !== before (0)`, so
  `migrated = true` → `scheduleServerSync()` at `:159`.
- The debounced callback checks the session at fire time, sees a real account, and sends
  the local list verbatim as the master.
- **There is no pull.** `grep` for `from('user_topic_enrollments')` across `src/` returns
  nothing; `sync_my_enrollments` is the only reference to the table. The local store is
  always the source and always overwrites.

Governance R3 (`docs/APE_GOVERNANCE_DECISIONS_2026_08_06.md:26-33`) makes this a paid-access
issue: *"A topic is studiable/quizzable when the student has it in My Enrollments
(`user_topic_enrollments`) AND the paywall passes."* So the member keeps their academy
entitlement but loses the list the backend gates on, and every topic they paid to study
goes quiet until they re-add it by hand.

**What would settle it:** the body of `sync_my_enrollments`. Strong circumstantial
evidence that it replaces: the fix comment at `enrollmentStore.ts:260-265` says an
empty `p_items` *"wiped THEIR enrollment master list"* — that is a first-hand report of
replace semantics from a bug that was actually observed.

**Relationship to pass 1 F5:** `pass1-state-hooks.md` F5 reports the same *sink* (local
list overwrites server) with a different *trigger* (a corrupt local blob). This one needs
no corruption — it is the ordinary reinstall / second-device / shared-device sign-in, so
it fires for every affected user rather than for unlucky ones. F5's suggested fix
("prefer server reconciliation when the local read failed") does not cover it, because
here the local read did not fail: it correctly read "nothing stored yet". The seed path
needs its own guard: do not `scheduleServerSync()` for a seed that ran against empty
storage on a signed-in account until the server list has been read.

---

## 4. MAJOR — After an account switch, the new user's celebrations are suppressed, and the old user's record is re-persisted under their account

**Confidence:** high.

**Where:**
`src/features/celebration/celebrationSeen.ts:23` (`let seen`), `:56-58` (`wasSeen`), `:86-97` (`markSeen`)
`src/features/celebration/useMethodCelebration.ts:101` (`if (wasSeen(topicId, id)) return null`)
`src/features/account/clearLocalAccountData.ts:112-149` (not in the registry)

**What the user does:** A finishes the flashcard deck for topic T (and is congratulated).
A signs out; B signs in on the same phone, same app run. B finishes the flashcard deck
for topic T.

**What happens:** B gets no celebration. Nor for fill-in-blank, matching, scenarios, or
the "final quiz unlocked" notice — for any topic A had already celebrated.

**What should happen:** B is a different person with a different history and should be
congratulated.

**Why (traced):** the scope key is the **topic id** (`useMethodCelebration.ts:120`
`markSeen(progress.topicId, event.id)`), which is a shared curriculum id — identical for
every user. `ape:celebrationsSeen:v1` is swept by `clearLocalAccountData`, but the
module-level `seen` set is not reset (no `resetLocal`, and
`__resetCelebrationsSeenForTests` is never called by the app). `wasSeen` reads the
surviving set.

**The write-back is the nastier half.** `markSeen` at `:93` persists `[...s]` — the
*whole* set. The first celebration B does earn writes A's entire history to disk under
B's session, so B's record is permanently poisoned and survives B's next cold start.

**Related but different:** `pass1-study-flow.md` reports the opposite symptom — the key
being *swept* makes celebrations *re-fire* on a new device. Both are real; they are the
disk half and the memory half of the same missing reset. Its suggested fix (suppress
notices for topics already `status: 'complete'` on the server) fixes neither the
suppression here nor the cross-account write-back.

**Fix:** add `resetLocal()` to `celebrationSeen.ts` (`seen = null; loading = null`) and
call it from `resetAllLocalStores()`.

---

## 5. MAJOR — A Supabase session written to the AsyncStorage fallback is never deleted on sign-out

**Confidence:** high on the mechanism. Medium on how often the fallback is armed in the
field — it needs either a stale client or a SecureStore error.

**Where:** `src/lib/authStorage.native.ts:94-119`

**What happens:** the JWT and refresh token can end up in plaintext AsyncStorage and stay
there through sign-out, account switch, and every `clearLocalAccountData()` call.

**Why (traced):** the three methods each pick *one* store and never reconcile:

```ts
async setItem(key, value) {
  if (!SecureStore) return AsyncStorage.setItem(key, value);
  try { await secureSet(SecureStore, key, value); }
  catch { await AsyncStorage.setItem(key, value); }   // ← plaintext copy written
},
async removeItem(key) {
  if (!SecureStore) return AsyncStorage.removeItem(key);
  try { await secureRemove(SecureStore, key); }       // ← succeeds; AsyncStorage copy untouched
  catch { await AsyncStorage.removeItem(key); }
},
```

If a write ever takes the `catch` at `:108` (a keychain error — on iOS, a write before
first unlock is the classic one, since SecureStore's default accessibility is
`AFTER_FIRST_UNLOCK`) and the keychain works again later, `removeItem` takes the `try`
branch and the plaintext copy is orphaned. `clearLocalAccountData` cannot reach it: it
deliberately scopes to `ape:*` and leaves `sb-*` alone (`clearLocalAccountData.ts:72-75`).
This defeats the stated purpose of the file (`:3-7`: *"must NOT sit in AsyncStorage
(plaintext on disk…)"*).

**It can also resurrect a signed-out session.** A later keychain read error takes
`getItem`'s `catch` at `:100` and returns the stale token. If its refresh token is still
valid, a user who signed out is signed back in as themselves — or, on a shared device, a
different account's token is the one on disk.

**Second, separate defect in the same file — the documented auto-upgrade does not
happen.** `:13-15` claims *"it auto-upgrades to the keychain once the client is
rebuilt."* It does not. On the old build the session is in AsyncStorage; after the
rebuild `SecureStore` is non-null, so `getItem` (`:96`) goes to `secureGet`, finds
nothing, and returns null. Supabase sees no session. **Every user upgrading across the
SecureStore boundary is signed out**, and their plaintext tokens are left behind with
nothing that will ever remove them. Days from launch, this matters for anyone on a build
older than 2026-09-04.

**Fix:** in `getItem`, fall back to AsyncStorage when `secureGet` returns null, migrate
the value into the keychain, and delete the AsyncStorage copy. In `removeItem`, always
remove from **both** stores regardless of which one succeeded.

---

## 6. MINOR — `attractStore.resetLocal()` is written for the account-wipe registry but never wired into it

**Confidence:** high — a straight "declared, not called".

**Where:** `src/features/onboarding/attractStore.ts:162-168` vs
`src/features/account/clearLocalAccountData.ts:112-149`

The function's own docblock reads *"Account wipe / user switch — clear all cues
(clearLocalAccountData)"*, and it is not in `resetAllLocalStores()`. So after a switch or
a guest entry, `state` still holds A's `exploreDone` / `aboutDone` / `enrolledOnce` /
`firstSeenAt`. The new user's Home screen shows the EXPLORE and ABOUT "start here" cues
already retired — they miss the primary begin-here affordance — and the next `persist()`
writes A's cue state back to disk under B.

**Fix:** import it and add `resetAttractStore()` to `resetAllLocalStores()`. One line.

---

## 7. MINOR — Three more module caches survive the wipe (same class as #1/#4/#6, lower stakes)

**Confidence:** high on the mechanism; the severity is low for each.

All three have their `ape:*` key deleted by the sweep while their in-memory copy lives
on, so disk and memory disagree and the departing user's value is re-persisted under the
next account on the next write.

| Store | Key | Carried into the next session |
|---|---|---|
| `src/features/review/reviewPrompt.ts:39` (`state`) | `ape:review:v1` | A's session counts, active days, and "already asked this version" flag — so B can be asked for a store review on day one, or never asked |
| `src/features/settings/lowLight.ts:25-26` (`on`, `touchedAt`) | `ape:lowLight`, `ape:lowLightAt` | Low-Light Production Mode stays visually ON for the new user but is OFF on disk, so it silently flips off at the next cold start |
| `src/screens/lab/mixing/kit.tsx:43,79` (`focalCurrent`, `prioritiesCurrent`) | `ape:mixing:focal`, `ape:mixing:priorities` | A's declared focal point and three mix priorities are echoed back to B as their own commitments |

The mixing pair is additionally read at **import time** (`kit.tsx:48`, `:81`), so nothing
ever re-reads them after a wipe even at a route change.

**Fix:** same one-line-each pattern — add a `resetLocal()` and register it.

---

## 8. MINOR — The guest→account glossary migration sends the wrong list, races the account wipe, and discards half of what it collects

**Confidence:** high on the code facts; medium on impact, since I cannot read what
`register_commercial_user(p_favorites)` does with the payload.

**Where:** `src/features/commercial/commercialAuth.ts:16-36`, `:45-56`;
`src/features/flags/flaggedStore.ts:25,35-40,144-148`

Three distinct problems in one 12-line path — the only guest→account carry-over the app
has:

1. **Wrong list.** `FAVS_KEY = 'ape:glossaryFavs'`, which is `BOOKMARK_KEY` — the
   **🔖 bookmark** list, not favourites. The user's actual ♥ favourites live under
   `ape:heartTerms` (`flaggedStore.ts:35-40`) and are never migrated. `flaggedStore.ts:144-148`
   even states the old global key is *"abandoned and never read"* — but
   `STORAGE_KEYS.bookmark` still points at it, so it is very much still written, and
   this is what gets sent as `p_favorites`.
2. **Races its own wipe.** `registerCommercialUser` calls `ensureSession()` first (`:47`),
   which raises `SIGNED_IN`. `useAccountLocalSync` then wipes every `ape:*` key including
   both migration keys. `collectFavoritesMigration()` runs afterwards at `:52`. The read
   is one storage round-trip and the wipe is three (`getItem` → `getAllKeys` →
   `multiRemove`), so the read usually wins — but nothing orders them, and on a loaded
   device it can flip and migrate an empty list.
3. **`recent` is collected and thrown away.** `migration.recent` is built at `:35` and
   never referenced; only `p_favorites` is sent. `ape:glossaryRecent` is wiped in the
   same breath, so the guest's glossary history is lost at signup with no server copy.

**Fix:** collect *before* `ensureSession()`, send the list the user actually thinks of
as favourites (`ape:heartTerms`), and either use `recent` or stop reading it.

---

## 9. MINOR — A failed settings write is invisible: the toggle sticks on screen, nothing persists, and notifications are not rescheduled

**Confidence:** high on the code path; needs a storage failure to fire, which this app
has on record (the SQLITE_FULL incident cited at `finalExam/api.ts:154-158`).

**Where:** `src/features/settings/store.ts:204-211`; callers at
`src/screens/settings/SettingsScreen.tsx:151,160,168`

```ts
export async function saveLocalSettings(s: LocalSettings): Promise<void> {
  hapticsOn = s.haptics;
  micReleaseOnBg = s.micReleaseOnBackground;
  applyA11yFromSettings(s);                       // UI restyles immediately
  await AsyncStorage.setItem(KEY, JSON.stringify(s));   // unguarded — can reject
  requestLocalNotifSync(s);                       // never runs if it does
}
```

Every call site is `void saveLocalSettings(next)` with no `.catch`. On a full device:
the mirrors and the a11y styling are already applied so the switch looks saved; the
write rejects as an **unhandled promise rejection**; the setting is gone on relaunch;
and because the throw happens before `requestLocalNotifSync`, a notification change the
user just made is not applied at all. This is the one unguarded `setItem` in the app's
settings/preferences layer — its neighbours (`lowLight.ts:70`, `colorModePref.ts:30`,
`linksPref.ts:30`) all use `.catch(() => {})`.

**Fix:** wrap the write, move `requestLocalNotifSync(s)` outside the failure path, and
return a boolean the screen can use to say the setting could not be saved.

---

## 10. MINOR — Two smaller offline-exam storage wrinkles

**Confidence:** medium. Both are adjacent to a pass-1 fix; neither is that fix.

**Where:** `src/features/finalExam/api.ts:239-266`; `clearLocalAccountData.ts:89-91`

- **`queueReadable` never re-arms.** It is set false on a read failure (`:244`, `:262`)
  and there is no path back to true for the rest of the app run. One transient storage
  blip therefore makes `writeQueue` refuse *every* later submission (`:268-273`), so an
  honest "your exam could not be saved" is shown for exams that would now save fine. The
  refusal itself is the right call; the latch should clear on the next successful read.
- **The `:damaged` quarantine keys are swept.** `ape:finalExamQueue:damaged` (and every
  other `…:damaged` key: `soundSafetyAck.ts:58`, `workflowStore.ts:43`,
  `patternStore.ts:233`) starts with `ape:`, is not on KEEP, and is not an onboarding
  flag — so the next sign-out or account switch deletes it. The whole point of the idiom
  is that *"nothing that might still be recoverable is deleted by a parse error"*
  (`api.ts:225-231`); a sign-out deletes it anyway. Adding a `k.endsWith(':damaged')`
  exception to `isOnboardingFlag`'s sibling check would preserve it.

---

## 11. MINOR — `getDeviceId` has no single-flight, and a failed persist means a new device id every launch

**Confidence:** medium — the mechanism is certain, the reachability is low.

**Where:** `src/features/account/deviceIdentity.ts:16-35`

Two concurrent callers that both miss the `cached` check generate two different UUIDs
before either `setItem` lands. `claimThisDevice()` would then claim id X while
`isDisplaced()` checks id Y, and `SingleDeviceGuard` signs the user out with *"Your
account was signed in on another device"* (`SingleDeviceGuard.tsx:62-65`). In practice
the guard returns early on the Auth/Splash routes (`:48`), so the window is narrow.

The storage-failure path is the more plausible one: if `setItem` at `:30` fails, the id
holds for this run only, and the **next** launch generates a different id — which the
server reads as a new device, displacing the previous claim and signing the user out on
every single launch, with a message that blames a second device that does not exist.

**Fix:** a module-level in-flight promise (the `hydrating` idiom used by every other
store in this codebase), and surface a persist failure rather than swallowing it.

---

## 12. MINOR — The glossary free-definition cap resets on every Guest Mode entry (probably accepted)

**Confidence:** high on the mechanism, low that it is news.

`ape:glossaryUsageLocal` is swept by `clearLocalAccountData({ total: true })`
(`AuthScreen.tsx:169`) and the anonymous uid the server meter counts against is discarded
at the same moment, so a guest who has spent all 14 weekly definitions gets a fresh
allowance by tapping GUEST MODE again — two taps, no reinstall.

I am flagging it only so the decision is on the record: `deviceKey.ts:19-27` explicitly
forbids "fixing" this by adding the consent key to KEEP, citing the owner's 2026-09-01
ruling that a no-account guest is remembered in no way. Those two rules cannot both hold
— either the cap is bypassable for guests, or a guest is remembered. **If the bypass is
accepted, it should say so in `glossaryCap.ts`'s docblock**, because the next person to
find it will file it as a paywall bug.

---

## What I checked and found clean

**Full AsyncStorage key inventory.** I enumerated every call site
(`getItem`/`setItem`/`removeItem`/`multiGet`/`multiSet`/`multiRemove`/`getAllKeys`) across
81 files and every key literal. **Every key in the app is under the `ape:` prefix** — I
found no storage key that would escape the sweep. The only non-`ape:` storage the app
owns is the Supabase `sb-*` auth session (deliberately excluded, but see #5) and the
SQLite measurements table (wiped by name at `clearLocalAccountData.ts:103`).

**Parse safety — clean.** I checked every `JSON.parse` in the codebase for a guard.
Every one is either inside a `try` or inside a promise chain terminated by `.catch`.
The five that look unguarded on a first pass (`careerfinder/store.ts:111`,
`celebrationSeen.ts:43`, `reviewPrompt.ts:46`, `CenterLockTuner.tsx:148`,
`patternStore.ts:283`) all sit in `.then()` bodies with a trailing `.catch`. **No read
in this app can take a screen down.** Shape validation after parse is also unusually
good — `lastStudyLocation.ts:68-83`, `homeCardsStore.ts:44-57`, `enrollmentStore.ts:117-125`
and `patternStore.ts:109-187` all validate field-by-field rather than trusting a cast.

**Storage-failure handling — clean apart from #9.** I checked every unguarded `await
setItem`. `deviceProfile.ts` (crowdsource consent + queue), `glossaryCap.ts`,
`localProgress.ts`, `permissionStore.ts`, `pagedProgress.ts`, `ampProgress.ts`,
`earProgress.ts`, `tuningProgress.ts`, `scenarioExempt.ts`, `dashboard/api.ts` and
`exposureMonitor.ts` are all wrapped and all fail in the safe direction.
`settings/store.ts:208` is the sole exception.

**`clearLocalAccountData`'s allowlist — correct as written.** KEEP holds exactly five
keys: mic calibration (hardware, governance R1), the install id, and three `__DEV__`-only
overrides. I verified the three dev keys are read only behind `__DEV__` guards
(`EntitlementProvider.tsx:211,344,401,436` — every one is `if (!__DEV__) return` or
`__DEV__ && Platform.OS === 'web'`), so **no dev entitlement override can survive into a
release build**. The `isOnboardingFlag` prefix/suffix exception matches only
`ape:intro:*`, `ape:coach:*` and the three `…FsGuide` keys — I confirmed no progress or
entitlement key collides with those shapes.

**`resetAllLocalStores` — 15 of the 19 registered stores verified correct.** I read each
`resetLocal` and confirmed it clears both the data and the `hydrated`/`hydrating` flags
and emits. `flaggedStore.ts:319-342` is the best of them: it resets the per-context
bookmark stores **in place** rather than clearing the Map, with a comment explaining that
replacing them would orphan mounted hooks' listeners. `enrollmentStore.ts:266-269` cancels
the armed sync timer first, which closes a real prior bug. The four gaps are #1, #4, #6
and #7.

**User-namespaced keys — the one that needs it has it.** `TopicWelcomeSheet.tsx:95,115`
keys on `seenKey(uid, topicId)`. Everything else is correctly *not* namespaced, because
the sweep makes namespacing unnecessary — which is why the four module-cache gaps above
are the whole story rather than a storage-layout problem.

**Versioned records.** Only `soundSafetyAck` carries an in-record schema version. Its
`cached.version >= SOUND_SAFETY_VERSION` comparison behaves correctly on a downgrade (a
newer acceptance still counts). `ape:enrollmentSeeded5`, `ape:homeAttract2` and the
`:v1` key suffixes are version-in-the-key-name, which is the safe pattern — an old
version's data is simply never read. I found no store that would mis-read an older
schema. Note for the record: a `SOUND_SAFETY_VERSION` bump overwrites the v1 record at
the same key, destroying the earlier evidence — `pass1-audio-safety.md` already reports
the re-accept overwrite, and the fix is the same.

**Day-boundary handling in the hearing-dose store — clean.** `exposureMonitor.ts:345-350`
rolls to a fresh day on a calendar/timezone change, the retention prune at `:283-290`
is bounded, and `resetLocal` re-seeds. This was my main worry on the safety axis after #1
and it holds up.

**Not re-reported (pass 1, verified still-accurate context, different finding):**
`pass1-state-hooks.md` F5 (corrupt enrollment pushed to server) and F6 (dashboard cache
re-seeded mid-fetch); `pass1-study-flow.md`'s celebration re-fire and scenarios-exemption
loss; `pass1-audio-safety.md`'s cold-start ack race. Findings #3 and #4 above are
adjacent to three of those and I have said so explicitly in each, with what is new.

**Areas I did not reach:** the SQLite measurement backend's schema-migration path
(`measurementsBackend.native.ts` — I read the wipe path but not the table upgrade), and
the notification scheduler's persisted batch keys (`ape:notif:*`) beyond confirming they
are swept and guarded.
