# Bug-hunt brief — read this first

App: ape-studio, Expo SDK 57 / React Native. Pro Audio Training Academy.
Branch `audio-tools-engine`. **Days from launch.** Paying customers.

## Your job
Find REAL bugs — things that would misbehave for a real user on a real phone.
Walk the code as a user walks the app: pick an entry point, follow every button,
every state, every failure. Read the code you are reasoning about; do not guess.

## Rules
- **READ-ONLY on source.** Do not edit any file except your own report. Eight
  agents run in parallel; conflicting edits would be worse than the bugs.
- You MAY run `npx tsc --noEmit`, `npm test`, and any read-only command.
- NEVER run `eas build`, `eas update`, `eas submit`, `git commit`, `git push`,
  or anything billed or external. Not once, for any reason.
- Never touch image assets.

## What counts as a finding
A finding needs: the file and line, what the user does, what happens, what
should happen, and why you believe it — ideally the code path traced. Severity:
- **BLOCKER** — data loss, money, a safety promise not kept, a crash, a paid
  feature free, a free feature locked.
- **MAJOR** — a flow that cannot be completed, wrong information shown as fact.
- **MINOR** — cosmetic, copy, inconsistency.

State your confidence. A confidently-wrong finding costs more than a missed one,
because it gets fixed. If you are unsure, say so and say what would settle it.
**"I found nothing in X" is a real, useful result.** Do not pad.

## Already found and FIXED in pass 1 — do NOT re-report; VERIFY instead
- 31 members-only lab routes were registered without `withMembershipPreview`
  (test: `test/membershipGating.test.ts`).
- Shake-to-mute and the auto-mute could not stop file playback (`filePlayers.ts`,
  test: `test/filePlayerSafety.test.ts`).
- `AudioPlayer.tsx`'s player had no output ceiling.
- The offline exam queue cleared itself on unreadable data, and the screen told
  the learner their exam was saved without checking.
- Quiz score was shown raw instead of as a percentage.
- Dashboard had a `useMemo` below an early return (cold-load crash).
- `add-without-erasing` was unpassable on the music pathway.
Pass-1 reports are in `docs/bughunt/pass1-*.md` — skim the one nearest your area
so you do not repeat it, then go somewhere it did not.

## Standing product rules you can hold code against
- **Low-Light Production Mode**: nothing may auto-appear or flash; new overlays
  must gate on `useOverlaysSuppressed`.
- **Required education must be disclosed**: any career/role needing a degree,
  licence or certification must say so.
- **Calculators are a source of truth** used in the field near high voltage and
  rigging weight. An approximation must be labelled.
- Every lab/tool must carry `<AccuracyNote/>` — learn here, measure with a
  calibrated instrument.
- Fail CLOSED on entitlement, fail OPEN on infrastructure errors.

---

## FIXED in pass 2 — do NOT re-report; VERIFY instead
- Google refund path revoked a member on the request body alone (store-notifications).
- Offline queues: quiz replay dropped rows on a timeout; enqueueSubmission was
  void over a bare SQLite write; study/sync dropped on any non-network error;
  signing out swept `ape:finalExamQueue`.
- `stopAllFilePlayers()` zeroed volume and nothing restored it (my own pass-1 bug).
- FinalExamScreen promised a retry while holding the submit latch (also mine).
- Paywall could charge someone with no account; "access is active" fired on a
  completed read rather than on membership.
- Anonymous device key read as a new user and wiped guest progress.
- soundSafetyAck + celebrationSeen in-memory mirrors survived the account wipe.
- Scenarios audio bypassed the sound safety gate.
- Backgrounding the app left lab tones playing (no AppState anywhere in labs).
- Quiz/exam answers were lost on a crash → `attemptDraft.ts`.
- Quiz score printed out of a hardcoded 30 on variable-size v3 quizzes.
- Calculators used `parseFloat`: `10,000` became 10 → `parseQuantity`.
- Production labs: a decimal point could not be typed; a blank table row read as
  a complete required answer (incl. the hazard and rights registers).
- 7 child routes of the paid labs were ungated; 7 declared deep links were
  rejected by `isClaimedPath`; a signed-out deep link landed above `Auth`.
- Required-education disclosure added to the Career Finder results screen and to
  Rigger / Production electrician / Sonar Systems Technician.
- Low-Light burned the once-a-day hearing-dose warning without showing it.
- `fetchMyCredentials` reported a failed read as "you have earned nothing".
- Credential celebrations had no caller at all.

## KNOWN and still open — do NOT re-report unless you can add something new
- Certificates appear to be awarded by a DB trigger on topic completion, which
  would bypass the Final Exam and the paid-month rule. Server-side; needs the
  owner and a live DB check.
- The tenure migration and both edge functions are not deployed.
- Enrollments are pushed to the server but never pulled back.
- 13 labs carry no `<AccuracyNote/>`; the Community Directory's 8 modals omit
  `accessibilityViewIsModal`; CareerFamilyScreen promises free first topics on
  41 of 42 families; `fmt()` prints scientific notation from 10,000 up;
  calculators open a QWERTY keyboard on Android; production dates are parsed
  with `Date.parse`; the printed certificate's ID is the user's registry token.

---

## FIXED in pass 3 — do NOT re-report; VERIFY instead
- `isMemberOnlyLabRoute` returned false for routes the catalog cannot name, so
  `MemberGated` was INERT on 8 paid-lab routes — and the deep links had been
  opened on the assumption it worked. Both flagship labs were reachable by URL.
- `refreshEntitlement` returned a boolean, so the paywall's "welcome" check read
  a stale ref and every successful purchase reported as a failure.
- `useCredentialCelebration` recorded the credential before the caller showed it.
- `panicMuteAudio` on AppState `inactive` (Control Centre, the mic permission
  prompt) → `background` only.
- The exam retry notified every 15s and `notify` queues → tells them once.
- `parseFloat` survived in `CalcProjectsScreen` (persisting 10,000 Ω as 10 Ω into
  a named record) and in `calcPanel`'s warning line.
- ProductionStageScreen discarded a failed write while showing the answer saved.
- `saveMeasurement` showed "SAVED ✓" on failure, at all 8 tools.
- `EngineGate`'s `onRetry` was passed by nothing, at all 9 mic tools.
- `GateHold` was a blank buttonless screen on ~40 paid routes with no timeout.
- Log out did not say it destroys measurements, term lists, settings and the
  user's microphone calibration.
- Settings asserted identity from `resolved`, so offline a member read as GUEST
  and lost the DELETE ACCOUNT row.
- Help told users to email support to delete their account (App Review 5.1.1(v))
  and omitted telemetry from "what does the app send off my phone?".
- 43 calculator formulas used `·` as both multiply and an equation separator.
- CareerFamilyScreen's "first free topics are open to everyone" (false on 42/42).
- `fmt()` printed every value above 10,000 in scientific notation.
- 13 labs had no `<AccuracyNote/>`; enrollments were pushed but never pulled.

## STILL OPEN after pass 3 — confirmed, not yet fixed
- The time trial keeps running after sign-out and credits the arriving user.
- Permission ask-modes, Low-Light mode and the audio cap unlock survive an
  account switch.
- Production budget maths reads "12,000" as zero, into a client-facing PDF.
- "Reduce animations" leaves 11 of 17 `withRepeat` files running.
- The paywall states hardcoded USD prices; `loadStoreProducts()` has no callers.
- The Final Exam's membership wall offers only Back; six error strings tell a
  paying customer to "report this to your professor".
- "Manage My Learning" has a permanently disabled TAKE FINAL EXAM.
- Android: no audio focus anywhere; the Oboe OUTPUT stream has no error callback
  or watchdog; hardware BACK escapes the Celebration screen; no
  `ios.associatedDomains`.
- Perf: the Study tab counts by downloading ~27k rows; Explore pages the whole
  join table serially; Awards mounts 5 pages per tap; TOPICS pulls 33 MB.
- Teaching: the 144-vs-146 dB attribution in modDac; the binaural ~800 Hz
  threshold is stated backwards; the Lissajous vertical-vs-45° contradiction.
- Certificates appear to be awarded by a DB trigger, bypassing the Final Exam
  and the paid-month rule (server-side; needs the owner).

---

## FIXED in pass 5 — VERIFY, do not re-report
- The enrollment push guard (pass 4) broke every new user; reverted, reasoning
  recorded in the source. The reinstall overwrite is a SERVER fix.
- The comma handling (pass 4) made typed `12,000` into `12`; rewritten to keep
  raw text and interpret at commit. `test/productionNumberInput.test.ts`.
- The 8 routes added to the members-only predicate (pass 4) were never wrapped,
  so nothing consulted it. Wrapped; test extended.
- The curriculum required-education disclosure was inert (matched the index's
  canonical titles against short-form prose). Now reads the app's own `requires`
  codes; `test/gatedRoleDisclosure.test.ts` asserts it FIRES on real copy.
- CareerFamilyScreen printed ten licensed occupations bare.
- The SHARE button on five credential celebrations did nothing and spent the
  celebration. Removed.
- `refreshEntitlement` had the same stale-read hole as `deriveAndApply`.
- The exam queue lock was held across the replay's network loop.
- `projectStore.remove`/`duplicate` bypassed the serialization.
- The enable-audio popup promised sound survives backgrounding; it no longer does.
- Scenarios showed a correct answer in the "selected" colour, so neither the ✓
  nor the spoken ", correct" ever appeared.
- The accuracy note only rendered on page 1 of a paged lab, which restores the
  last page.
- Production lab/activity screens discarded failed writes (the stage screen was
  fixed in pass 3; these two are its siblings).

## NEW and unfixed after pass 5 — highest value first
- **`.gitignore` is CRLF on disk and LF in the index.** It is fingerprint source
  #2. This is the exact trap that silently broke OTA before. DO NOT TOUCH IT
  until the local fingerprint is compared with the installed build's
  runtimeVersion — fixing it could equally restore or break OTA.
- `status='refunded'` is likely rejected by a CHECK constraint (`active`,
  `lapsed`, `revoked`), so every refund may silently no-op.
- Deploy ORDER matters: both edge functions read columns the unapplied migration
  adds. Deploy the function first and a real purchase charges the customer and
  returns `grant_failed`.
- Google refunds match on purchase token while `validate-purchase` stores the
  order id — permanently unmatchable.
- The paid-lab scrim is a **BLOCKER on Android**: TalkBack's ACTION_CLICK never
  hit-tests, so a free user can operate the whole paid lab through the scrim.
- Quiz/exam **matching questions are unusable without sight, and graded**.
- RN `<Image>` does not default `accessible`, so the quiz and exam question
  figures are invisible to VoiceOver.
- The glossary's 14-a-week cap resets every time a guest re-enters Guest Mode.
- The store-review prompt is the only auto-overlay with no Low-Light gate, and
  it burns its once-per-version allowance when suppressed.
- `subjectMeta`'s `SUBJECT_META_RATIFIED` was flipped to true inside an unrelated
  commit; 50 subjects of unratified copy are live.
