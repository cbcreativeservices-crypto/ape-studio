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

### Wave 1b — the rest of the gear pass + the nine non-dynamics FX labs · commit `3a0f5e7c`

#### Fixed

| # | What | Where |
|---|---|---|
| 1 | **SOLO could clip the level-matched A/B.** The pages promise "any improvement you hear is decisions, not loudness". `matchGainDb` was unclamped and SOLO fed it: soloing the snare on Beginning Mixing p5 asked for **+14.55 dB** and landed the render at **+8.08 dBFS**, where the WAV writer hard-clamps. One tap, and the learner A/Bs against distortion. Measured on the real renderer, not reasoned. Two guards now: a soloed render is not level-matched at all, and the match can never push past −1 dBFS. | `mixAudio.ts`, `mixing/kit.tsx` |
| 2 | **A console edit never stopped the sounding mix.** Press play, solo a channel — the tapes relight instantly while the ears carry on with the previous un-soloed render for the rest of the loop, and `active` went null so the button reverted to ▶ and **nothing on the page could stop the sound.** | `mixing/kit.tsx` |
| 3 | **One FX lab could silence another.** `EffectChain::reset()` only sets param 0 (enabled) to 0 — every other atomic keeps its last written value for the process lifetime (`Effects.hpp:760`). Chorus/flanger/phaser all share `FX.mod`; phase/stereo share `FX.stereo`. Leave the flanger at MIX 100%, open the PHASER: `mix_=1.0` yields the pure all-pass — unity at every frequency, **no notches and no audible phasing at all** — under a hero drawing textbook notches. Every shared-node config now declares its whole node. | `fxLabConfigs.tsx` |
| 4 | **The gate's engine attack is 10 ms, not 1.** The config asserted "1 ms is the engine's behaviour, not a placeholder" — wrong by 10x and confident enough to stop the next reader checking. The lab never writes param 3, so `attackMs_{10.0}` stands (`Effects.hpp:421`; only the limiter is forced to 0.1 at `:373`). Limiter corrected 0.2 → 0.1 for the same reason. | `fxLabConfigs.tsx` |
| 5 | **The limiter's RELEASE was inexpressible.** A steady tone holds the peak follower at a constant envelope, so GR never recovers and the release chips moved nothing — the compressor's 2026-09-11 failure, in the one dynamics lab that kept its sine. Sine stays FIRST (the ratified caption depends on it); a transient is one tap away. | `fxLabConfigs.tsx` |
| 6 | The knob's **pointer was positioned by subtracting half its WIDTH from `top`** as well as `left`, so the box centre sat 4 pt down-screen before rotation — inside its own radius at the top of travel, canted off-axis at the ends, missing the ticks it exists to be read against. | `kit/gear.tsx` |
| 7 | The fader could **surrender the gesture MID-DRAG** — `g.dx`/`g.dy` are cumulative, so drifting sideways far enough after committing handed the touch to the channel scroller. | `kit/gear.tsx` |
| 8 | A **purely horizontal jiggle counted as a tap**, so two of them reset the fader to unity and threw away the learner's setting. | `kit/gear.tsx` |
| 9 | The **nudges could never reach 0 dB** from an odd value a drag left behind (−7 walks −5, −3, −1, +1 straight over unity). | `kit/gear.tsx` |
| 10 | `gear.tsx` held the **only two `accessibilityValue` sites in the repo with no `aria-value*` twin** (role=slider is invalid ARIA without `aria-valuenow`), plus two toggles announcing `aria-selected` on `role="button"`. | `kit/gear.tsx` |

**Tests:** `test/mixLevelMatch.test.ts`, +5, pinned against the real measured
numbers and covering both guards plus the stop-on-edit. Suite **1042 → 1047**.

#### Suspicions that came back WRONG

- **The taper might not be invertible.** It is exact: max round-trip error
  **1.07e-14 dB**, both knots continuous, strictly monotonic, `−60 → 0` and
  `+12 → 1` exactly.
- **The printed scale might be laid out linearly.** It is drawn FROM the taper,
  using the identical expression the cap uses — 0 dB sits 20 pt from where
  linear would put it, −20 dB 32.3 pt. This is emphatically **not** the
  `ParamLane`/`ControlSlider` defect; same file family, and this one is right.
- **A drag to a printed detent might not return the printed dB.** It returns
  `12, 6, 0, −6, −12, −20, −30, −40, −60` — exact at every one.
- **`gear.tsx` might have the dark-cap pulse problem.** It does not: the pulse
  was already on the amber indicator, never the cap body. Whoever wrote it had
  already made the fix the other two components needed tonight.
- **Pink noise might not peak at −20 dBFS.** −21.5 measured over 30 s.
- **The flanger might share the mod labs' bugs.** It is the one FX lab with
  **zero** findings.

#### Reported, NOT changed — owner decisions

1. ⚠️ **The STEREO IMAGING lab's WIDTH does nothing.** The generator is mono-
   duplicated unless `stereoOn_` is set (`Generator.hpp:296`), so SIDE is
   identically zero and `width` multiplies zero. WIDTH at 0 / 50 / 100 / 200%
   is **bit-identical audio**. The Lissajous repeats the error in its own model
   (`phi = 0` ⇒ `l === r` ⇒ side 0 for every width), so the correlation readout
   stays pinned at +1.00 "mono / in phase" at 200% OVER. Meanwhile the animated
   hero *does* spread, because it fabricates the missing difference
   (`d0 = flavor === 'width' ? 1.1 : 0`, with a comment saying "otherwise SIDE
   would be zero and width invisible") — the author saw the un-expressible
   signal and patched the picture instead of the source. **Both check questions
   and the ratified caption describe behaviour that does not exist.** Fixing it
   needs a decorrelated source, which is a design decision.
2. **DELAY's PING-PONG is inaudible** for the same root cause, while both heroes
   label taps L R L R.
3. **The EQ caption denies Q on a LOW-PASS while the engine and the curve both
   apply it.** At LOW-PASS / 1 kHz / Q 8 there is a **+18 dB resonant peak**
   pinning the graph, under a sentence saying "GAIN and Q don't apply to a pass
   filter". The code comment one line above already knew the distinction ("HP
   ignores Q") and it got flattened. HP is genuinely Q-less; LP is not. Needs a
   new ratified sentence.
4. **The phaser's RESONANCE never reaches its static hero** — `fxViz`'s third
   argument is MIX, not feedback, and the function models no feedback term.
5. **Reverb's HF DAMPING is the only param in the nine labs with no on-screen
   representation of any kind** — not in a hero, not on the bezel, not in the
   caption.
6. **Three scribble-strip solo states are distinguished by hue alone** (WCAG
   1.4.1): mutual contrast 1.05:1, 1.11:1, 1.16:1. The colours are an owner
   ruling, so this needs your eye.
7. **The page note "MY MIX is level-matched to the wall" is now inaccurate while
   a solo is active** — a direct consequence of fix #1, and ratified copy.
8. RESET MIX stays greyed out when the only change is a solo.

---

### Wave 2 — systemic classes outside the labs (2 agents) · commit `0fb4d5f5`

Both agents reported mostly-clean territory, which is itself the result: the
conditional-hook class is **gone** (235 files swept by script plus manual review
of the riskiest), the `resolved` gate holds at every site but two, and **no
blob-shaped AsyncStorage writer survives anywhere** — the SQLite migration is
complete and `clearLocalAccountData` does wipe the SQLite table that the
`ape:*` key sweep cannot see.

#### Fixed

| # | What | Where |
|---|---|---|
| 1 | **A storage hiccup could refuse the Final Exam.** `startFinalExam`/`startQuizAttempt` read and wrote their client attempt id with no try/catch, *before* the RPC — so a local write failure threw, and the caller's broad catch turned it into "the exam could not be started". A paying member with full eligibility and a reachable server, refused their capstone over a write that only affects RESUMING. Storage failure here is proven, not hypothetical. | `finalExam/api.ts`, `quiz/api.ts` |
| 2 | **The Paywall's duplicate-purchase guard read `isMember` without `resolved`** — false until the entitlement read lands, so a member arriving early fell through toward `buyPlan`. Money is the one place where "we don't know yet" must not mean "go ahead"; it now holds instead. | `PaywallScreen.tsx` |
| 3 | A member picking a certificate before resolution was told their choices **"won't be saved without an account"** — false and alarming. | `AwardsScreen.tsx` |
| 4 | **29 fire-and-forget `AsyncStorage` writes across 19 files** had no `.catch`. The in-memory value has already flipped, so the UI reports success while the write silently fails and an unhandled rejection surfaces far from its cause. Verified the way a mechanical sweep should be — grepping for what is NOT the target now returns empty. | 19 files |
| 5 | `panicMuteAudio()` fired three bare native stop calls. Harmless today, but this is the **shake-to-mute safety path**. | `panicMute.ts` |

#### Reported, NOT changed

- **`FirstRunCoordinator` declares every hook after an early return.** Inert
  today — the flag is a build-time constant and the file says so correctly —
  but the owner's own comment says it gets flipped back on, and the moment that
  guard varies per render it is the exact crash class that hit three cable
  lessons.
- `QuizScreen`'s per-question pick handlers lack the synchronous ref guard its
  three sibling study screens all carry. Traced: it does not currently
  mis-score, because the model writes to a ref and the submit is one guarded
  batched payload. Defence-in-depth only.

#### ⚠️ Mine to own: a too-broad `git add` in `dc362c77`

I staged `docs/` rather than the one file I had written, and swept **11
documentation files that were not mine** into that commit — audit reports from
earlier sessions, `CROSS_SESSION_HANDOFF.md`, and `app_nav_findings_2026_09_07.jsonl`,
all of which had been sitting uncommitted in the working tree since before
tonight. They are documentation only, additive, and no code was involved, so I
left them rather than doing git surgery on an already-pushed commit at 4am —
but it was not my call to make, and `CROSS_SESSION_HANDOFF.md` in particular
coordinates with another session and may have been mid-edit. Say the word and
I will lift those 11 files back out.

The `web/` work in progress (SEO, the connect pages) was NOT swept up and is
still uncommitted, as it should be. Every add from here is path-specific.

---

## OWNER RULING 2026-09-13 — privacy and terms stay LOCKED until launch

Both store audits flagged the 401 on `/privacy`, `/terms` and `/support` as
submission-blocking. The owner has ruled that the site gate **stays closed until
launch**, so this is a **launch-day action, not a defect**: unlock or exempt
those three paths in `web/proxy.ts` as part of the launch sequence, not before.
`web/proxy.ts` is the owner's uncommitted work in progress and was not touched.

The coupled item survives and should be done in the same pass: there is **no
in-app link** to either document anywhere in the app, which Apple guideline
3.1.2 expects for auto-renewing subscriptions, ideally at the point of purchase.
Adding those links is only worth doing once the pages are publicly reachable.

**Full handoff: `docs/APE_AGENT_NIGHT_HANDOFF_2026_09_13.md`.**
