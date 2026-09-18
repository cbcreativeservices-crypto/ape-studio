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
