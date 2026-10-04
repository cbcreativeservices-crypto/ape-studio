# KNOWN-ISSUE CATALOG for hunts 11–13 (lead reassessment, 2026-10-04)

This catalog comes from reassessing every bug found since 2026-10-01:
- runs 1 and 2;
- the pattern hunt (25 patterns: docs/bughunt/PATTERN_CATALOG_2026_10_02.md);
- evening hunts 1–3;
- hunts 4–10;
- 2 deep dives;
- the perf hunt (75 fixes);
- the perf decisions;
- the start-up trim.

Each class has kept coming back. For EVERY screen, store, and async path in your area, check every class below. These are the rugs to look under.

## A. Classes that keep recurring (highest yield)

**K1 · An unknown session is NOT "signed out".** This class was found 4 times, twice causing data loss.
- `safeSession` / `getSession` / `getUser` stall, reject, or resolve as `{session:null, error: AuthRetryableFetchError}` when offline with an expired token.
- Every such read must use `safeSessionResult()` and treat `timedOut` as UNKNOWN:
  - never wipe;
  - never claim "sign in" or "guest";
  - never drop a write;
  - never settle a tier.
- Check EVERY `supabase.auth.onAuthStateChange` listener, every INITIAL_SESSION / TOKEN_REFRESHED / SIGNED_OUT handler, and every `getSession` / `getUser` / `hasSafeSession` / `safeUser` call.
  - `grep -rn "onAuthStateChange\|getSession\|getUser\|hasSafeSession\|safeUser\|safeSession(" src`.
- A real SIGNED_OUT or a dead refresh token must still wipe.

**K2 · A failed read is NOT empty.** Found in nearly every hunt.
- Every list or record screen has three faces: loading, unreadable, truly empty.
- Never write over an unread copy.
- A screen that saves a WHOLE object must not save before it has loaded. This has caused Settings defaults, the Home Setup wipe, the Production rename, and the enrollment server replace.
- A server push of a local list must never send an unread or empty stand-in.
- A failed save must be told to the user (shared notice). It must never show ✓ or "saved".

**K3 · Membership is four states.** Use `useMemberGate`: open / locked / checking / unconfirmed.
- Nothing unlocks on a failed read.
- No 🔒, upsell, or "not signed in" wording to a maybe-member.
- Use `useUpsellAllowed` for upsell copy and `useGuestWording` for guest copy.
- NEW 2026-10-04: `resolved` now flips as soon as a REMEMBERED tier is applied (perf decision 2), before the network read. Re-audit every consumer of `resolved` / `entitlement` / `isMember`:
  - nothing may treat a remembered tier as confirmed (`tierKnown`);
  - no purchase, credit, or irreversible action may run on it.

**K4 · Stale async.**
- Newest load wins (load tickets).
- Generation fences across an account wipe.
- In-flight dedupe and memos must be keyed by identity AND reset on wipe.
- A late answer must never overwrite a newer one, a newer screen, or a different account's state.

**K5 · Identity, wipe, and caches.**
- Every module-level cache, memo, or Set (NEW today: topicItemsCache, appUserIdMemo, v3 memoOnce, tube signed-URL memo, achievements/awards 8 s shared reads, Glossary NAME_HITS, `lastKnownOpen` in calcPrefs, careerIndex Map, Cymatics LRU, the five self-registering resets) must:
  - be cleared on account wipe / identity change via `registerLocalStoreReset`;
  - never serve one user's or tier's data to another.
- Check that the cache key includes everything that changes the answer (uid, tier, standing).
- Check what happens after a WRITE that should invalidate it. Example: a trophy earned while the 8 s shared read is cached; a purchase while topic items are cached by tier.

**K6 · Honest wording.**
- A network failure is not "on our side", "still being set up", "no longer active", or "not found".
- No "Playing" when sound failed.
- No "counts toward credit" for a guest.
- Server refusals map to their own message (readableError ordering).

**K7 · Charging.**
- Glossary D50: an opened term is free for the session; Share is never an extra charge; a sent-but-unanswered read is never re-sent, except after a coded rollback.
- Calc refusals cost nothing, and no paid number leaks beside a refusal.

**K8 · Audio.**
- `startFenced` on every start.
- Preloads/pre-renders must NEVER auto-play (Drum, Mixing, Mastering, lab clips).
- A refused or failed start shows `tone.error` / AUDIO_UNAVAILABLE.
- Stop on close.
- OPEN item: clip-player LOAD failures are silent app-wide (Drum, Mastering, Ear, Mixing). Fix these consistently with the shared message.

**K9 · Hearing-safety exposure monitor.**
- Session gap and close.
- Latches reset per session.
- The today total includes the held second.
- Quiet-tick no-emit (perf).
- Day-index cache (perf).
- Warnings held in Low-Light.
- Re-audit the perf changes here carefully.

**K10 · Modals and dialogs.**
- Never Modal over Modal on Android.
- iOS refuses to present during a dismiss, so use `rootModalHoldMs` / `afterDialogCloses` / `useModalHandoff`.
- Nothing auto-appears in Low-Light.
- Popups, not pulldowns.

**K11 · Double taps.** Use `useLatchedPress` / `openOnce`. Two different routes from one press can stack two screens.

**K12 · Calculators.** 100% accurate (D53); impossible outputs refused in words; shared constants; three faces on the saved lists.

## B. NEWEST CODE: regressions most likely here (re-audit FIRST)

These are today's perf commits: f578503d, a5d4614e, 7d26ca02. Memoisation and caching can create STALE-UI bugs.

- **`React.memo` rows/cards with custom comparators** (FieldRow, PianoStrip `sameCenters`, TermSelectIcons, MemoCourseCardView, MemberCard, FilterPanel, PickRow, TopicAddRow, WorkspaceLowerBody, CurriculumView, EnrollmentView, SkinnedVu, SideLed, PrintedScale, AwardPageView, DirectoryView).
  - Does any comparator or memo skip an update that should show? Check: a label change, a lock-state change, a tier change, a theme/Low-Light change, a selection, a stale closure in an onPress captured by a memoised child.
- **Caches:**
  - v3 programs/certs memo — no auth reset, public catalog: fine?
  - topicItemsCache — key and invalidation after a purchase or refund.
  - achievements/awards 8 s shared reads — after earning a trophy, after a sign-out within 8 s.
  - Glossary NAME_HITS.
  - tube URL memo.
  - appUserIdMemo — account switch race.
  - calcPrefs `lastKnownOpen`.
  - careerIndex title Map.
- **Lazy screens** (getComponent + lazyScreen cache).
  - Every route still opens.
  - Deep links and pendingLink still work.
  - A screen requiring a module that registers a wipe reset only on first load: is the reset registered BEFORE any state could be written? Self-registration happens at module evaluation, so check that no store in those 5 modules (modMeterC, mixing kit, careerfinder store, labClipBuffer, directory/api) can hold state without the module having been evaluated.
  - `src/dev/webPreviews.tsx` must be excluded from phone builds.
- **Prefetch / preload.**
  - Expo-image prefetch must not leak member-only images to non-members (signed URLs).
  - Press-in prefetches (member sheet, tube page 1, hub warm) on a press that is then cancelled.
  - Drum, Mixing, and Mastering pre-renders cancel on leave and never play.
  - Lab clip fetch starts at the tap BEFORE the gate: is any audio session changed before the gate?
- **Explore kept mounted with display:none.**
  - Hidden effects still running.
  - Blocked members refreshed.
  - Keyboard.
  - Focus-based effects firing while hidden.
- **PagedLab RESTORE_WAIT_MS** and the 200 ms wait: any path where the page never shows?
- **Dashboard focus-ticket skip** (cold Study tab single load): any path where NO load happens?
- **Career Finder auto-advance 300 ms**: double answers within 300 ms.
- **Quiz/exam clock re-render once per second**: the 0:00 forced submit and the one-minute warning still fire on time.
- **EntitlementProvider `resolved` on remembered tier** (see K3).
- **myUserRow from the stored session + memo** (see K1/K5).
- **Settings `unreadShown`**, the push token running alongside the account lookup, and the PermissionPrompt request-before-write.
- **program_topics / certificate_topics `readAllPages`**: other large tables read by the app may also exceed the 1000-row page. Check any `.from('<table>').select()` without a filter on a table that can pass 1000 rows (read-only DB count allowed via the Supabase MCP).

## C. DO NOT re-report (owner calls / accepted designs)
- D54:
  - EarLab/LabCategory pre-resolve open;
  - Dashboard study switches on 'unconfirmed'.
- Request notifications and unread counts (they do not exist; owner question pending).
- The save notice on a module-open visit write (owner question pending).
- Free-refusal bisection (an owner design).
- Splash 2.5 s and 490 ms transitions; HOST_DISMISS 450 (needs a device test).
- Mixing first-press stem synthesis (worker).
- Multi-term glossary share sequential (D50).
- Server items already with Comp A: migration 2026100301 and bucket cache headers. The security fixes are LIVE.

## D. Process (unchanged)
- House helpers only. Ratchets only shrink.
- Every fix gets a receipt that FAILS on HEAD.
- R2 proof: copy aside, run with `git show HEAD:`, restore, cmp.
- Use the Edit tool so line endings are preserved.
- No sub-agents. No commit, push, git stash, or checkout. No eas or publish. No packages, assets, eas.json, package.json, web/, supabase/, or launch.json.
- Read-only DB checks are allowed.
- Report honestly: only REAL bugs with receipts. Zero is fine.
