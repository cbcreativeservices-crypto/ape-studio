# AP&E — Handoff after the overnight agent run of 2026-09-12 → 13

**Read this first. It is the single entry point to the night's work.**
Companion: `docs/APE_AGENT_NIGHT_2026_09_12.md` (the wave-by-wave log with every
finding, including the ones that came back wrong).

Branch `audio-tools-engine`, **clean against origin**, everything pushed.
`tsc --noEmit` clean. Suite **1055 pass / 180 suites / 0 fail** (was 1035).

---

## 1. What this run was

The owner commissioned an all-night multi-pass agent run before sleeping and
gave two rulings at commission:

1. **Weight the night on REGRESSION over the last 48 hours** — the 2026-09-11
   gear design pass had changed *shared* controls consumed by dozens of files,
   all web-verified only.
2. **Fix and push the safe findings**, rather than only reporting. Anything
   touching ratified copy, audio maths or design judgment gets REPORTED.

Ten commits, `6a198905` → `b4eb04fe`, on top of `d2cd5698`.

---

## 2. The five findings that mattered most

| # | What was wrong | Why it mattered |
|---|---|---|
| 1 | **The gate hero's follower had attack and release on the wrong edges.** For a compressor `gr` rising = attack; for a GATE `gr` is attenuation, so `gr` FALLING is the gate OPENING, and opening is the fast edge (`Effects.hpp:398`). | At the gate lab's own defaults **the drawn gate never opened** — a flat floor under a caption promising "you hear it open on every hit". It passed its own check on 09-11 because HOLD *did* move the trace: the picture responded, it just responded wrongly. |
| 2 | **SOLO could clip the level-matched A/B.** `matchGainDb` was unclamped and SOLO fed it. | Soloing the snare on Beginning Mixing p5 asked for **+14.55 dB** and landed the render at **+8.08 dBFS**, where the WAV writer hard-clamps. One tap, and the learner A/Bs against distortion under a note promising the comparison is decisions, not loudness. Measured on the real renderer. |
| 3 | **One FX lab could silence another.** `EffectChain::reset()` only sets param 0 to 0; every other atomic keeps its last value for the process lifetime (`Effects.hpp:760`). Chorus/flanger/phaser share `FX.mod`. | Leave the flanger at MIX 100%, open the PHASER: `mix_=1.0` gives the pure all-pass — **no notches and no audible phasing at all** — under a hero drawing textbook notches. |
| 4 | **Four live tools kept reading after the mic was released.** `stop()` releases the mic and halts polling but never clears `frames`. | A full trace and a real-looking level with nothing measuring. Worst was Waveform, where STOP also cleared the FROZEN badge, so it was labelled LIVE. Three sibling tools already guarded it — which is what makes it a miss, not a design. |
| 5 | **A storage hiccup could refuse the Final Exam.** The attempt id was read and written with no guard *before* the RPC. | A paying member with full eligibility and a reachable server, refused their capstone over a write that only affects resuming. |

---

## 3. ⚠️ The device-pass list — nothing here was observable on the web preview

Gesture arbitration, DSP freeze, real audio and anything behind a Supabase
session **cannot** be settled on the preview. These are reasoned or
browser-verified, never device-verified:

| Where | What to check |
|---|---|
| Gate lab | The drawn gate now OPENS on every hit and the RELEASE chip changes the tail. (Browser-verified; hear it.) |
| Compressor lab | The SOURCE/NET marker now appears **only** on the sine source, not on the click or pink. |
| Mixing labs | SOLO a channel, press MY MIX: it must NOT be loudness-matched any more, and must not clip. Also — a console edit now STOPS a sounding render; on device that will read as "the audio cuts out when I touch anything". **Owner call whether that is right.** |
| EQ lab (31-band board) | Scrolling the board sideways must no longer scrub the band you push off from. Tapping a band no longer jumps it — drag only, on scrolling boards. |
| Every rack lab | `ParamLane` tick stops moved 4 px to mark the CAP's travel rather than the SLOT's. |
| Amp / de-esser / envelope / patchbay | `ControlSlider`: a finger landing on the cap must no longer move it, and the fill tip now ends under the cap. |
| 12 labs (foundations, digital, wave, eq, gain, micspeaker, cableinstall) | `DragSlider` is fully re-skinned and its touch target went 30 pt → 44 pt. **Biggest untested blast radius of the night.** |
| Patchbay | **On a TABLET.** The jack tap band now scales with the art. This lab is the `af_patchbay` credit and was uncompletable at tablet width. |
| Rt60 / RTA / Spectrogram / Waveform | Press STOP: the meter must go dark, not hold its last frame. Waveform must now say FROZEN, not LIVE. |
| Tools hub | The SPL tile needle must rest at the bottom in silence, not park at 40%. |
| Flashcards | New PREV / NEXT buttons; full screen has an assistive-tech-only card nav. |
| Amp lab | Class D "recovered audio" must be flat at zero input, and device current must not flat-top at 360°. |

---

## 4. OPEN — owner decisions, ranked

### 4.1 The stereo lab's WIDTH control does nothing
**The biggest open item.** `Generator.hpp:296` duplicates mono unless
`stereoOn_` is set, so SIDE is identically zero and `width` multiplies zero:
0 / 50 / 100 / 200% is **bit-identical audio**. The Lissajous repeats the error
in its own model, so CORRELATION stays pinned at +1.00 "mono / in phase" at
200% OVER. The animated hero *appears* to work only because it fabricates the
missing difference (`d0 = flavor === 'width' ? 1.1 : 0`, with a comment saying
so). **Both check questions and the ratified caption describe behaviour that
does not exist.** DELAY's PING-PONG is inaudible for the same root cause while
both heroes label taps L R L R. Fixing it needs a decorrelated source — a
design decision, and then copy re-ratification.

### 4.2 Bipolar `level` lanes assert silence at maximum cut
Found independently by two agents. The 7 EQ GAIN lanes, `modMeterA` GAIN ×3,
`modChain` INPUT/GAIN and `modLearn` FADER map lane-0 to a **cut**, not to
silence — so the amplitude ramp reads −18 dB of cut as MIDI-blue "silence" and
+18 of boost as red "clipping". Invisible while every lane had a fill; now the
level ramp is the only fill left. `rampColorsSymmetric` already exists.
**This is why `modMeterB`'s EQ lane was deliberately left alone** — adding
`level: true` there for consistency would have propagated the problem.

### 4.3 The EQ caption denies Q on a LOW-PASS while the engine applies it
At LOW-PASS / 1 kHz / Q 8 there is a **+18 dB resonant peak** pinning the
graph, under a sentence reading "GAIN and Q don't apply to a pass filter".
High-pass genuinely is Q-less; low-pass is not, in both the engine
(`Effects.hpp:126`) and the drawn curve. The code comment one line above the
caption already knew the distinction and it got flattened. **Needs a new
ratified sentence.**

### 4.4 "NET" can read POSITIVE while the GR ladder shows reduction
Makeup +6, threshold −30, 2:1 → "+1.0 dB NET" with the amber dot ABOVE the
unity dot, while the ladder reads 5 dB. It *is* the net and the label is
honest, but it is a copy/design call.

### 4.5 The `home` double-tap flag has almost no coverage
Exactly ONE producer across 118 faders. On ~15 labs the double-tap silently
does nothing.

### 4.6 Smaller open items
- The page note "MY MIX is level-matched to the wall" is now inaccurate **while
  a solo is active** — a direct consequence of the clipping fix. Ratified copy.
- Three scribble-strip solo states are separated by hue alone (mutual contrast
  1.05 / 1.11 / 1.16 : 1). The colours are an owner ruling.
- The gear cap overhangs its slot by ~half its body at both stops. Fixing it
  changes the value↔position map on a device-passed control.
- The phaser's RESONANCE never reaches its static hero (`fxViz`'s third
  argument is MIX, and the function models no feedback term).
- Reverb's HF DAMPING is the only param in the nine labs with **no on-screen
  representation of any kind** — not in a hero, not on the bezel, not in copy.
- `GrMeter` reads "−0.0 dB" at rest.
- SPL side-rail toggles reach 26 pt (clears WCAG AA); the full 44 needs a
  layout decision on the landscape rail.

---

## 5. Store readiness

**RULED BY THE OWNER 2026-09-13: privacy and terms stay LOCKED until launch.**
So the 401 on `/privacy`, `/terms`, `/support` is a **launch-day action, not a
defect** — unlock or exempt them in `web/proxy.ts` as part of the launch
sequence. `web/proxy.ts` is the owner's uncommitted work in progress and was not
touched. Note the coupled item: there is **no in-app link** to either document
anywhere, which Apple 3.1.2 expects for auto-renewing subscriptions — worth
adding at the same time, pointed at the then-public URLs.

Fixed tonight: **"needs the next dev build" was shipping to users** in the
MultiMeter snapshot sheet. `expo-image-picker` and `expo-location` are not
installed and are deliberately off the loader table, so those branches rendered
in EVERY production build. Verified the *other* "needs the next app build"
strings are genuinely conditional — their packages are installed and in the
table, so they do not appear in a shipped build.

Still open, reported not changed:
- **Four Android permissions and one iOS key are declared but unreachable** —
  `READ_MEDIA_IMAGES`, `READ_MEDIA_VISUAL_USER_SELECTED`, `READ_EXTERNAL_STORAGE`
  (from the `expo-media-library` plugin; the app's only use is write-only) and
  `ACTIVITY_RECOGNITION` (from `expo-sensors`; only the accelerometer is used).
  Same pattern the location keys were removed for. `app.json` is owner territory.
- **Certificate QR verification is dead in every build.** `certificateHtml.ts`
  reaches `qrcode` through the dynamic path, so it always resolves null and the
  PDF always falls back to "verification unavailable". ⚠️ **I declined to add it
  to `LOADERS`**: it is not a direct dependency, and that file's own comment
  warns a literal require of an absent package fails the whole bundle. Install
  `qrcode` as a direct dependency first, then add the line.
- **Stale module-scope `Dimensions.get()`** in `AwardsScreen`, `ToolsHubScreen`
  and `CourseSelectionScreen` — captured once at boot, so an iPad Split View or
  rotation mis-pages the carousel. `useWindowDimensions` is the house pattern.
- `CourseSelectionScreen`'s card is proportional width against a **fixed 409 pt
  height** — at iPad width the Home cards go landscape. First screen a reviewer
  sees.
- **No dev harness renders at tablet width** (all capped 360–480), which is
  exactly why the patchbay bug was invisible.

---

## 6. Design proposals (built on the gear pass, none applied)

Ranked by teaching value per unit of effort. Full detail in the wave log.

1. **`RotarySelector` in `gear.tsx`** — answers BOTH open survey items #3b
   (detented dynamics knobs) and #8 (rotary selectors); reaches 61 tray
   declarations across 29 files from one file. ⚠️ Needs an owner rule for arc
   labels: ratified chip labels like "0.5 ms FAST" will not fit an arc, and
   `shortChoice()` already has the precedent for numeric-on-the-arc,
   full-label-in-the-blurb.
2. **`TrayOption.glyph`** + waveform shapes on the oscillator chips — on a real
   generator the shape IS the label.
3. **ADSR fader bank** for the envelope lab — every synth ever built draws A D S
   R as four vertical faders in time order; we stack five horizontal ones. Also
   move HOLD from last to second, where it is in the signal's life.
4. **De-esser processor panel** — ⚠️ borderline against the autotune ruling
   ("no hardware skin when the real counterpart is software"); the de-esser
   exists in both worlds. Owner's line to draw.
5. **"Selected" is GREEN in the PagedLab labs and AMBER in the rack labs** — 79
   call sites. A real inconsistency, but it touches ratified surfaces.
6. **Two brushed-cap materials** (light silver in study, dark in the lab kit)
   coexist unexplained.

---

## 7. Standing rules this run operated under

- **NEVER** `eas build` / `eas submit` on my own reading. Only the owner saying
  so in the moment.
- Ratified copy is FROZEN — report, never rewrite.
- Agents do NOT commit; the main session reviews and commits in batches.
- Every agent finding was **re-verified in the main session before being
  applied**. Several came back wrong and were dropped — they are recorded in the
  wave log so nobody re-chases them.
- **grep the repo ROOT, not just `src/`** — `App.tsx` is at the root.
- Commit messages go through a file with `git commit -F`; backticks in `-m` get
  command-substituted.
- **Windows Metro caches TRANSFORM ERRORS**, and the preview console
  **accumulates across navigations**. Compare message COUNTS, never presence —
  that is what settled two false alarms tonight. `--clear` restart clears it.

## 8. One thing I got wrong

`dc362c77` staged `docs/` rather than the one file I had written and swept **11
documentation files that were not mine** into that commit — audit reports from
earlier sessions, `CROSS_SESSION_HANDOFF.md`, and a nav-findings jsonl. Docs
only, additive, already pushed. `CROSS_SESSION_HANDOFF.md` coordinates with
another session and may have been mid-edit. Say the word and they lift back out.
The `web/` work in progress was NOT swept up and is still uncommitted.
