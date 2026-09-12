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

### Wave 1 — regression on the last 48 hours (4 agents) · commit `da8b79aa`

Every finding below was **re-verified in the main session** before it was
touched. Several agent suspicions came back wrong and were dropped; those are
recorded too, because a wrong suspicion costs the next person time.

#### Fixed

| # | What | Where |
|---|---|---|
| 1 | **The gate hero's follower had attack and release on the wrong edges.** For a compressor, `gr` rising = reduction deepening = attack. For a GATE, `gr` is attenuation, so `gr` FALLING to zero is the gate OPENING, and opening is the fast edge. Engine is ground truth: `Effects.hpp:398` opens with `aA`, closes with `aR` after the hold. Drawn swapped, the lab applied its hard-coded 1 ms attack to the CLOSING edge and the student's RELEASE chip to the opening one — **at the lab's own defaults the drawn gate never opened**, a flat floor under a caption promising "you hear it open on every hit". | `fxAnim.tsx` |
| 2 | **The source marker added 2026-09-12 was over-claiming.** The curve's x-axis is the DETECTOR level, and the detector is a one-pole peak follower — it only reaches the source's peak for a steady tone, under-reading a click by 7-13 dB. The compressor lab's opening state drew "-7.5 dB NET" while the honest GR ladder 40 px away read **0.0**. Marker now renders only for sources declaring `steadyPeakDb`. | `fxViz.tsx`, `fxLabConfigs.tsx`, `FxLabScreen.tsx` |
| 3 | **Gate marker removed entirely.** Source peak -20 vs thresholds -50/-35/-20 means `dbIn < thresholdDb` is false at every reachable fader position — permanently inert while asserting "nothing happens", at the moment the ladder read 18-37 dB. | `fxLabConfigs.tsx` |
| 4 | **`ControlSlider`'s touch map stopped being the inverse of its cap position** (14 files). The reskin gave the cap an inset travel lane but left the touch reading full width: putting a finger on the cap moved it up to 3.75% of range (1.5 dB on the de-esser threshold), and the cap ran 12 pt ahead of the finger mid-drag. Took the rack lane's look without its geometry contract. | `amp/kit.tsx` |
| 5 | **The breathing pulse was eating the new dark caps**, in two of the three faders. It animates OPACITY, and the standard was set against the OLD light thumbs. The eqBits cap fell to ~1.1:1 contrast at the dim end — a flat EQ board periodically had **no visible caps at all**. Pulse now rides the indicator line, as `ParamLane` already did. | `amp/kit.tsx`, `eqBits.tsx` |
| 6 | eqBits band faders were operable **only by dragging** (WCAG 2.5.7) — now adjustable + increment/decrement + `aria-valuenow`. | `eqBits.tsx` |
| 7 | eqBits indicator line sat **1 px below the value it reported**, missing the unity tick it exists to be read against. | `eqBits.tsx` |
| 8 | A sideways scroll on the 31-band board **scrubbed the band you pushed off from** — touch-down wrote a value before the horizontal handoff could be evaluated. Scrolling boards are now relative-drag. | `eqBits.tsx` |
| 9 | `ParamLane` tick stops marked the **SLOT's** travel, not the **CAP's** — 4 px out at each end. Invisible until 2026-09-12, because the old fill tip landed exactly on them. | `ParamLane.tsx` |
| 10 | SignalGen's LEVEL lane was missing `level: true`. | `SignalGenScreen.tsx` |
| 11 | The GR ladder **pegged silently** at settings the UI itself names — limiter ceiling -45 "SQUASH" measures 24.9 dB on a 24 dB scale. Comp/limiter now scale to 30. | `FxLabScreen.tsx` |

**Tests:** `test/dynamicsFollower.test.ts`, +7, pinning which constant drives
which edge per processor including the gate lab's exact default. **Mutation-
checked**: reverting the follower to the symmetric form fails 3 of them. It also
pins the source text, so the regression cannot come back silently. Suite
**1035 to 1042**, tsc clean.

#### Agent suspicions that came back WRONG (recorded so they are not re-chased)

- **Pink noise does not peak at -20 dBFS.** It does: measured -21.5 over 30 s
  from the shipped Kellet filter (sine -20.0, click -20.2, white -20.0). The
  constant was right; the **detector** was the problem, which is a different
  bug (#2).
- **`ControlSlider` drags might not reach exact min/max.** They do, exactly —
  the ends were always right. It is the **interior** that was wrong (#4).
- **The cap could cover the readout.** It never could; the readout is in a
  separate row above the track.
- **eqBits consumers outside the EQ lab were never exercised.** There are none
  — the only one has been unreachable dead code since 2026-08-23.
- **`PagedLab` has no ScrollLockProvider.** It has one, correctly placed, and
  it is irrelevant here because no paged lab uses these components.
- **The follower's pre-roll might be too short for the slowest release.** Worst
  case error 0.79 dB — 1.3% of the panel height. Not a finding.
- **Multiplicative decay might drift.** It does not: ~1e-14 per period, and the
  phase re-seats with a real `exp` at every burst boundary.

#### Reported, NOT changed — owner decisions

1. **Bipolar `level` lanes now assert silence at max cut.** Found independently
   by two agents, which is worth weighting. The 7 EQ GAIN lanes, `modMeterA`
   GAIN x3, `modChain` INPUT/GAIN, `modLearn` FADER map lane-0 to a CUT, not to
   silence — so the amplitude ramp reads -18 dB of cut as MIDI-blue "silence"
   and +18 of boost as red "clipping", neither of which is what an EQ band gain
   means. Invisible while every lane had a fill; now the level ramp is the only
   fill left in the component. `rampColorsSymmetric` already exists if a
   bipolar ramp is the answer. **This is why `modMeterB`'s EQ lane was left
   alone** — adding `level: true` there for consistency would have propagated
   the problem rather than fixed it.
2. **"NET" can read POSITIVE while the GR ladder shows reduction.** Makeup +6,
   threshold -30, 2:1 gives "+1.0 dB NET" with the amber dot ABOVE the unity
   dot, while the ladder reads 5 dB. It IS the net and the label is honest, but
   it is a copy/design call.
3. **The `home` double-tap flag has almost no coverage** — exactly ONE producer
   across 118 faders. On ~15 labs the double-tap silently does nothing.
4. **The gear cap overhangs the slot** by roughly half its body at both stops
   (5 to 6.5 px, a 1.5 px worsening). Fixing it changes the value/position map
   on a control the owner just passed.
5. **Android: the cap's shadow is probably clipped** by `overflow: hidden` on
   the track. Device-only.
6. **`GrMeter` reads "-0.0 dB" at rest.** Cosmetic.

#### The scroll-lock claim is weaker than it looked

Both live `GraphicBoard` call sites render in the **pinned stage**, outside the
well's `ScrollLockProvider`, so `useScrollLock()` resolves to a provider whose
`ScrollView` is not rendered for rack modules. Not a bug — the stage is pinned,
nothing can steal the gesture — but it means **the owner's "eq passed" did not
validate leg (c) at all.** If a future lab drops a `GraphicBoard` into a
`PagedLab` page or a RackUnit well, that path is genuinely untested.

#### Harness note

`ReferenceError: attackMs is not defined` appeared in the preview console and
cost time. It is **not live**: the count held at exactly 2 across three page
loads and both labs (a live throw would have given 6). Stale buffer entries
from before the `--clear` restart. The documented technique — **compare message
COUNTS, never presence** — is what settled it.
