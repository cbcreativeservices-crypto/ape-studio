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
