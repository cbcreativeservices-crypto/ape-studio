# Lab Design + Learning Pass — Final Report (2026-08-31)

**The commission:** a design-agent pass over ALL Audio Fundamentals and
Advanced Training Labs, with a learning/cognition expert working alongside,
assess → grade → redesign → fix, implementing everything they recommend,
committing and pushing per lab. Unattended day run.

**The result: all 38 labs assessed and fixed. 37 pushed, 1 deferred**
(Harmonograph — its owner-gated mechanism rebuild would have made any pass
churn). Every lab got a two-hat agent assessment (senior designer + learning
scientist), a merged fix list, same-day implementation, live browser
verification where the web sim allows, one commit per lab/batch, and a push to
`origin/audio-tools-engine`. Full per-lab grades and statuses:
`docs/APE_LAB_DESIGN_PASS_2026_08_31.md`.

---

## The headline finds (things that were actively wrong)

| # | What | Where |
|---|---|---|
| 1 | **Bass fretboard tap crashed the ENTIRE web app** (NaN row → unmounted tree, no root error boundary). Reproduced, guarded, verified fixed. | Bass Guitar Physics |
| 2 | **The RTA painted quiet RED and loud BLUE** — the amplitude ramp inverted (gradient start/end swapped). | Visual Audio Analysis |
| 3 | **A safety-zero route scored 75/100** ("across the hallway floor", one point behind a legal pick) — unweighted mean ignored the spec-§22 weights. Now weighted + red ✕ REJECTED — SAFETY tag. | Cable Install |
| 4 | **MatchCurve gave 95% "EXCELLENT" for doing nothing** on a narrow-notch target. Score now normalized so flat = 0. | EQ hub |
| 5 | **5 of 16 characteristics were unreachable** — chip row never wrapped, five rendered off-screen. | Mic Selection |
| 6 | **Gain M4 said "BALANCED: healthy level at every stage"** on the too-low-early scenario it exists to condemn. | Gain Staging |
| 7 | **Autotune claimed "0¢ — exactly on pitch"** while its own drawn curve ended ~3¢ short (asymptote vs τ math). | Autotune |
| 8 | **The Troubleshoot challenge leaked its answer** — red arrows between hidden columns pointed at the fault. | Gain Staging |
| 9 | **Tube FLOW narrated streaming electrons over a 0% plate meter** (caption at 0.60 heat, conduction at 0.75). | Vacuum Tube |
| 10 | **FM cried wolf**: normal negative-frequency reflections wore the same red "aliased" style as genuine faults — at safe defaults. | FM Synthesis |

## The systemic learning fixes (the owner's stated priority)

- **Retrieval everywhere.** The FX fleet (12 labs), all 5 synthesis labs, the
  trio (Bass/Autotune/Binaural), Signal Chain, and 2 EQ modules had ZERO
  checks. ~50 recognition questions authored and wired through the
  auto-shuffling CheckQuestion — each keyed to the lab's ONE core contrast
  (flanger even comb vs phaser uneven notches, gate-below vs comp-above,
  RT60-is-a-time, name-the-noise-colour, name-the-routing…).
- **Answer cues killed.** Correct answers were position-cued (authored first,
  rendered unshuffled — Cable lab's 6 exercise sites, Cable Install's 6 MCQ
  sites, Mic Selection's factor/reason lists) or length-cued (Detective's 28
  options, gain checks, tube checks, Detective option definitions). All
  shuffled by presentation / trimmed to distractor register.
- **Trainers that anti-taught, fixed:** MatchCurve's null-move reward;
  FindFrequency calling a right-direction move "wrong direction"; Mic
  Selection's challenge printing the answer on a wrong pick; Cable Install
  stage 1 announcing "complete" right after calling the pick wrong;
  Detective forgetting a 27/28 run on back-swipe (now persisted).
- **Invisible physics made visible:** the gain lab's noise floor is now a grey
  hiss-fill that rides up the meters when you stack late gain (the too-low
  story finally has a referent) + NOISE bezel cell.

## Fleet-wide upgrades (paid across many labs at once)

- **Hub progress ticks** — Meter/Digital/Wave/Gain hub rows now show a green ✓
  on visited modules (new `useLabClearedUnits` selector; data existed, nothing
  read it).
- **Instructions out of disclosures** (LabShell) — the first-move instruction
  no longer hides inside the collapsed LAB NOTES.
- **44pt targets:** LabChip fleet hitSlop + a dozen bespoke chips (hub tool
  chips, noise chips, calc SEND, cable options, dots).
- **ParamLane readable at the ends** — label/value get backed chips (same-hue
  text vanished into the thumb).
- **Bezel units survive truncation** ("80 ms", not "80").
- **DEV WEB WORKFLOW:** the wordmark dev tier now SURVIVES web reloads
  (hydrated at boot + preserved across the auto-guest wipe, `__DEV__`+web
  only). No more re-paywall every reload.

## 📱 Owner review queue (all new copy is flagged in commits)

| Step | Where 📍/📱 | What |
|---|---|---|
| 1 | 📱 phone | Device pass of the fleet — especially: Meter lab (RTA ramp, Detective), Gain M4 hiss-fill, Cable Install route reveal (REJECTED tag), Signal Chain checks, FX fleet checks, Mic Selection challenge flow |
| 2 | 📍 `docs/APE_LAB_DESIGN_PASS_2026_08_31.md` | Skim per-lab "Left (OWNER)" items — the judgment calls I deliberately did not make (safety-adjacent distractor enrichment in Cable L03/L12, PrincipleBanner cadence, Fix-the-Signal boost scenario, DockTray double-tap, root error boundary) |
| 3 | 📱 phone | New check/copy audit — every commit since `69b6d8e` marks NEW COPY lines; ~50 check questions + ~20 caption/blurb lines await your ratification |
| 4 | 📍 `C:\Users\profe\dev\ape-studio\docs\APE_LAB_DESIGN_PASS_2026_08_31.md` | Harmonograph deliberately untouched — awaiting your OK on the mechanism mock |

## Numbers

- 38 labs assessed (13 Fundamentals + 25 Training) · 37 pushed · 1 deferred
- ~24 implementation commits, each pushed same-session
- ~50 new CheckQuestions · ~40 defects fixed · 10 headline bugs
- 3 app-level infra fixes (dev-tier persistence, LabShell, labCompletion)
- tsc clean at every commit; live browser verification throughout

*Every agent report's DO-NOT-LOSE list was honored: no honesty badge weakened,
no owner-ruled visual reversed (M7 waterfall, chooser-fader, band accumulate,
Detective one-at-a-time, calc rack, tube catalog all untouched).*
