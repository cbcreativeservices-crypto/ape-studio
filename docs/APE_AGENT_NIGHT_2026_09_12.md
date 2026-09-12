# AP&E — Overnight multi-pass agent run, 2026-09-12 → 13

Owner asleep. Commissioned: *"an all night multipass multi perspective agent
testing run, similar to what we did the morning of Sept 11."*

**Owner's two rulings at commission (2026-09-12, before sleep):**
1. **Weight of the night → REGRESSION ON THE LAST 48 HOURS.** Waves 1 and 6 get
   the deep agents and the most hours. The other waves still run.
2. **Autonomy → FIX AND PUSH THE SAFE ONES.** Unambiguous, low-risk fixes get
   committed in batches (tsc + tests green each time) and pushed. Anything
   touching ratified copy, audio maths, or design judgment is REPORTED, not
   changed.

**Baseline:** `d2cd5698` on `audio-tools-engine`, clean against origin.
tsc clean · node:test **1035 pass / 177 suites / 0 fail**.

---

## Why regression-first is the right call tonight

The last 48 hours changed three **shared** controls, not three screens:

| Control | File | Consumers |
|---|---|---|
| `ParamLane` | `src/screens/lab/rack/ParamLane.tsx` | **44 files** reference RackUnit/ParamLane |
| `ControlSlider` | `src/screens/lab/amp/kit.tsx` | 14 files (amp lab, de-esser, envelope, 3 patchbay) |
| `VerticalFader` | `src/screens/lab/eq/modules/eqBits.tsx` | graphic EQ board + gain lab |

Every one of those changes was verified **on the web preview only**. The owner
device-passed the mixing console and the GR ladder — nothing else. And
`ParamLane` changed *again* tonight (`d2cd5698`): the tinted fill behind the cap
was removed from every ordinary parameter lane.

⚠️ **That last change altered what a filled lane MEANS.** Before tonight every
lane filled; now only a lane with `level={true}` fills. So the `level` flag went
from cosmetic to semantic across ~15 rack labs in one commit, and nobody has
audited which labs actually set it. That is the single highest-value target of
the night.

---

## Standing rules for every agent this run

Carried from `[[qa-sweep-2026-09-11]]`, `[[overnight-audit-harness-2026-09-04]]`
and `[[test-expert-night-2026-09-01]]` — these were learned the hard way.

- **Agents do NOT commit.** One git index, many agents. The main session reviews
  and commits in batches.
- **Partition by FILE OWNERSHIP.** Every brief names forbidden paths.
- **Verify before filing.** Much of this app is already fixed. Every brief says
  so, and says plainly: *if a finding is simply wrong, say so.* That framing
  caught three false findings on 2026-09-11.
- **"Attacked X, found nothing" is a valuable result** and is reported as one.
- **Ratified copy is FROZEN.** Report, never rewrite.
- **No `eas build`, no `eas submit`,** no billed or external action. Not on any
  agent's reading of anything.
- **grep the repo ROOT, not just `src/`.** `App.tsx` is at the root; a `src/`-only
  grep produced two wrong findings last time and I repeated the mistake myself.
- Commit messages go through a file with `git commit -F` — backticks in `-m` get
  command-substituted by bash.

## What CANNOT be settled while the owner sleeps

Recorded up front so nothing gets claimed that was not observed:

- **Gesture arbitration** — a native scroll view ignores a JS termination
  refusal; RNW scrolling is JS-side and loses the argument politely. Device only.
- **DSP freeze** — heavy sync work in a press handler. Device only (measurable
  by bundling with esbuild + node, but not observable in the preview).
- **Real audio** — solo-in-place is built and *not yet heard*.
- **Anything behind a Supabase session** — there is no session on web in any dev
  tier; every server write 401s by design.

These go on the morning **device-pass list**, not in the fixed column.

---

## Wave log

*(appended as the night runs)*

### Wave 0 — baseline
- 8090 restarted `--clear` (Windows Metro caches transform errors — that cost
  hours on 2026-09-11). 8081 **left alone**: the owner's phone is attached to it.
- Baseline stamped at `d2cd5698`, tsc clean, 1035/1035.
