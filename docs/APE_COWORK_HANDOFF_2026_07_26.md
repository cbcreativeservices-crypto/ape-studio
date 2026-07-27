# AP&E Studio — Cowork Handoff (2026-07-26, end of session)

**Purpose:** hand this to Claude cowork/chat so it can update the project **memory** and
**governance** files with what shipped this session. This is a **records-update handoff** —
the code is already committed and pushed; nothing here asks cowork to touch the codebase.

---

## 1. Repo state (authoritative)

| Item | Value |
|---|---|
| Repo | `https://github.com/cbcreativeservices-crypto/ape-studio.git` |
| Branch | `audio-tools-engine` |
| HEAD | `667c196` — *Audio warning = two side bars + shake-to-panic-mute; Bass lab instrument look* |
| Working tree | **clean**, HEAD **pushed** to origin |
| Stack | Expo SDK 57.0.7 / RN 0.86 / TypeScript strict / Hermes |
| Verify | `node node_modules/typescript/bin/tsc --noEmit --pretty false` EXIT 0 · Metro bundle 200 · **native goldens 166/166** |
| Native engine | **engineVersion 7** in source (`modules/ape-dsp/ios/core/EngineHub.hpp` `kEngineVersion`) |

**Commit lineage this session (newest → oldest):**
- `667c196` audio warning = two side bars only (shrunk 1/3) + SHAKE-TO-PANIC-MUTE; Bass lab wood-neck/blue-body/sound-hole
- `476e55e` warning-line polish: audio frame 3→6 px; low-light line 2→4 px + red→burnt-orange
- `3b547ba` wave-2 labs live: FM Synth + Binaural Panner + Modular Synth (UIs + lessons + menu + glossary)
- `590d969` wave-2 bridges: engineVersion 6→7, iOS + Android + TS surfaces
- `39142cf` wave-2 native DSP: FM voice + binaural bus + modular voice (goldens 132→166)
- `de0c627` expansion labs wave 1: Bass Guitar + Autotune (live, JS over the existing engine)
- `44a4916` menu: Ear Training card far left + renamed "Ear Training & Audio Lab"
- `c038886` migrate HarmonicLabScreen onto the shared LabShell
- `1938490` glossary: surface linked lab's Common Mistakes on term pages
- `40afaec` audio safety: visible red output frame + mic↔speaker feedback interlock

**Builds:** v6 effects `500c091f` (prior); **v7 expansion `958ed016` FINISHED** →
`https://expo.dev/artifacts/eas/MaQf4al2QJJE-JAE4XXWa_SKG3IKcx3ZhfNgrRMRV3s.apk` (Android dev,
on-device validation OWED — see §5).

---

## 2. What shipped this session (for the memory/project files)

### A. Audio safety + output-warning UX
- **Mic↔speaker feedback interlock** (`40afaec`): `audioOutputStore` gained `micActive` /
  `feedbackAllowed` + `isSpeakerFeedbackMuted()`. `useDspEngine` sets mic active on capture start,
  clears on every teardown. **MicFeedbackGuard** (root) cuts the generator the instant the mic goes
  hot without the override; **FeedbackAllowRow** is the physical override, shown ONLY in Harmonic
  Lab LIVE (session-only, default OFF, self-resets on unmount). HarmonicsView LIVE tone sounds iff
  the override is on.
- **Red audio-output frame** — made visible (edge hairline → inset frame), then **two vertical
  SIDE BARS only** (top/bottom dropped), 6 px, each shrunk to 2/3 height centered (`667c196`).
- **Shake-to-panic-mute** (`667c196`): while audio output is enabled, 2 accelerometer jolts >1.9 g
  within 700 ms → `panicMuteAudio()` = genStop + binStop + modStop (10 ms fades) + fxReset +
  Speech.stop() + `disableAudioOutput()` (silence-locked; fresh 5-s hold required) + Warning haptic.
  `ShakeToMute` root component subscribes to expo-sensors Accelerometer ONLY while audio can sound.
  (Deps expo-sensors/expo-speech/expo-haptics were already bundled → ships over Metro on v7.)
- **Low-light indicator** (`476e55e`): top line 2→4 px; colour red → **burnt darker glowing orange**
  `#c2540f` (const `RED`→`EMBER` in `LowLightLayer.tsx`), deliberately a distinct hue from the
  audio-frame red so the two warnings never read as the same thing; 15 % theater dim preserved.

### B. Glossary + shell consistency
- **Common Mistakes into glossary term pages** (`1938490`): for a term with a READY Learning
  Profile, `TermDetails` shows the linked lab's authored Common-Mistakes ("COMMON MISTAKES · {LAB}
  LAB") — free client content, distinct from the entitlement-gated DB `common_mistakes` block.
- **HarmonicLabScreen → LabShell** (`c038886`): dropped ~150 lines of hand-rolled shell; LabShell
  gained a render-prop Explore child exposing `setScrollLocked` for the stem-drag editor.
- **Menu** (`44a4916`): the pinned Lab card moved FAR LEFT (`[Lab][Tools][Glossary]…`) in both deck
  builders and renamed **"Ear Training & Audio Lab"** (card, title map, EarLab subtitle). HOME
  landing finds the Glossary card by kind (was a fixed index); academy custom deck keeps the Lab card.

### C. Expansion labs — WAVE 1 (JS over the existing engine, audible now)
- **Bass Guitar Lab** (`de0c627`, instrument look `667c196`): tappable true-geometry fretboard
  (fret → 2^(−n/12) fraction: 12=½ oct, 7≈⅔ P5, 5≈¾ P4), natural-harmonics node mode (½⅓¼⅕ → exact
  harmonic n), additive pluck (amps 1/n, v2 sine fallback), standing-wave drawing, string-λ vs
  air-λ readout. Instrument background: **wood neck + blue body + round sound hole** behind the
  strings; metal frets / bone nut / pearl inlays.
- **Autotune Lab** (`de0c627`): vertical cents grid, fixed off-pitch 6-note melody, CORRECTION
  (0/50/100 %) + RETUNE SPEED (fast/med/slow); the drawn curve == the audible 20 Hz generator glide
  (same exponential); **GENERATOR DEMO** badge (no mic — owner decision); control change ends a
  running pass so graph/audio never diverge.

### D. Expansion labs — WAVE 2 (native, engineVersion 7)
- **Native DSP** (`39142cf`, goldens 132→166/166): **FM voice** (`Generator` `GenMode::Fm`,
  `setFm(ratio,index,decaySec)`; Bessel-verified — J_k(1) exact, I=0 = pure carrier, index-decay
  strike) · **BinauralBus** (`Binaural.hpp`: 3 sources sine/white/pink, Woodworth ITD ramped
  fractional delay, ~8 dB ILD, head-shadow one-pole, behind-LPF, 1/d gain, Q4 cap + published
  busNorm) · **ModularVoice** (`Modular.hpp`: polyBLEP VCO → ZDF SVF LPF → ADSR VCA → tanh stage;
  LFO→pitch/cutoff/amp; env→cutoff; 8-step sequencer with env retrigger; one scalar setter).
- **Bridges** (`590d969`): output = gen→EffectChain, then binaural + modular MIX IN (bypass chain);
  ONE shared output stream per platform (torn down only when ALL voices idle); `genSetHpf` fans out
  to all three voices; full iOS (`ApeDspCore`/`ApeDspModule.swift`) + Android (`ApeDspJni.cpp`/
  `ApeDspModule.kt`) + TS (`index.ts`: `GEN_MODES.fm`, `GenParams.fm`, `BIN_SRC`/`binSet`/`binStart`/
  `binStop`/`binStatus`, `MOD_PARAM`/`modSet`/`modStart`/`modStop`/`modStatus`, `wave2Available()`≥7).
- **Lab UIs** (`3b547ba`): **FM** (exact Bessel sideband hero, folds dashed red, Carson vs Nyquist,
  STRIKE) · **Binaural** (draggable overhead stage via LabShell `setScrollLocked`,
  HEADPHONES-REQUIRED + NOT-MEASURED-HRTF badges, native-mirroring readouts, busNorm shown) ·
  **Modular** (live patch-flow diagram with active cables + REAL native env meter / step highlight,
  PATCH IDEAS presets with why-this-routing). Lessons `fm`/`binaural`/`modular` (nums 20–22),
  menu entries 19–21 live.

---

## 3. Governance — decisions of record this session (for the governance log)

All are applications of the standing honesty rule (measurement-tools §1.7) + owner UX rulings.
Proposed as new ruling entries (successor to `APE_GOVERNANCE_DECISIONS_2026_07_23.md`):

- **G-A · Glossary lab-action honesty (reaffirmed + extended):** a term shows a lab action / lab
  Common-Mistakes ONLY when the lab is live, linked, and FUNCTIONAL today (`learningProfiles` READY
  bucket). New READY links this session are all against **DB-verified glossary terms** (verified
  read-only via MCP `execute_sql`): Bass (Wavelength/Standing wave/Antinode/Resonance), Autotune
  (Pitch Correction/Pitch/Cents), FM (FM Synthesis/Frequency modulation), Binaural (Sound
  Localization/Spatial Audio/HRTF), Modular (Synthesizer/Synthesis/Subtractive Synthesis/VCO/VCF/
  LFO/ADSR/Envelope/Sequencer/Step Sequencer/cutoff frequency/Patch/Tremolo/Vibrato).
- **G-B · Binaural is a SIMPLIFIED model, not HRTF (owner decision):** the Binaural Panner uses an
  ITD+ILD+head-shadow spherical-head model, permanently badged "SIMPLIFIED BINAURAL — NOT MEASURED
  HRTF" + "HEADPHONES REQUIRED". No claim of measured-HRTF localization; front/back ambiguity
  disclosed in-lab.
- **G-C · Autotune is a GENERATOR DEMO, not mic correction (owner decision):** no microphone; the
  "singer" is the tone generator, so the correction is real, honest retuning of a synthesized voice.
  Real-time mic pitch-shift is explicitly out of scope for this lab.
- **G-D · Wave-2 audio is engine-gated ≥ v7:** FM/binaural/modular visuals + lessons run on any
  build; audio no-ops with an honest "install the v7 build" note below v7 (effects-labs idiom).
- **G-E · Audio-output safety UX:** persistent red side-bar warning whenever output can sound;
  mic↔speaker feedback interlock (speaker auto-muted while mic captures, physical override only
  where both are needed); shake-to-panic-mute → silence-locked. Low-light indicator is burnt orange,
  a distinct hue from the audio red.

### Backend governance status — **NO CHANGES THIS SESSION**
- Backend (Supabase `yjgolswjggmlpeowvtxr`) remains **FROZEN**. **Zero migrations** were applied.
- All glossary lab links are **client-config only** (`learningProfiles.ts`) — the documented
  "client-config first, DB column later" approach (v4 MASTER A3). No schema change is required for
  anything shipped this session.
- The only backend access this session was **read-only** `execute_sql` SELECTs to verify glossary
  term names before wiring READY links. No writes.
- **Nothing is pending owner approval on the backend.** (The parked Stage 5/6 glossary migration
  and the retired `ear_training` study-method migration are unchanged from prior sessions.)

---

## 4. Records-update checklist (for cowork)

1. **Memory** (`C:\Users\profe\.claude\projects\C--Users-profe\memory\`) — already updated by the
   code session: `project_next_session.md` (HEAD `667c196` + this session's features) and
   `project_learning_lab_v4.md` (wave-1/wave-2 adoption). Verify they match §1–§2 above; no
   duplication needed.
2. **Governance log** — add ruling entries G-A…G-E (§3) to a successor governance doc
   (`APE_GOVERNANCE_DECISIONS_2026_07_26.md`) if Booth wants them formally logged; the backend
   status line ("no changes, backend frozen, client-config links only") is the load-bearing record.
3. **v4 MASTER spec** — Booth's ritual (CANDIDATE→LOCKED + STATE/TRACKER/INDEX bump) is unchanged;
   the expansion labs (Bass/Autotune/FM/Binaural/Modular) are additive to the 16-lab + capstone
   scope and can be folded in at his next re-issue.

---

## 5. Owed / next

- **ON-DEVICE VALIDATION (v7 build `958ed016`)** — install the APK and check: FM strike/bell +
  sideband graph matches the ear; Binaural drag localizes on headphones (side snap, front/back
  vague = expected), 3-source mix, no clicks while dragging; Modular drone + ACID BASS (env→cutoff
  squelch), sequencer steps audible with the lit step matching, LFO destination A/B; **regression** —
  harmonic/effects/chain/oscillator/noise/harmonograph/bass/autotune still fine on v7; speaker-HPF
  fanout (binaural/modular on the phone speaker get the 150 Hz HPF); shake-to-mute + two-side-bar
  frame + burnt-orange low-light line (all JS — reload, no reinstall).
- Wave Physics spike (spec filed `docs/APE_WAVELAB_SPIKE_SPEC_2026_07_26_v1_DRAFT.md`; do NOT build
  until owner green-lights).
- Pillar A configured Hear/Experiment/Watch deep-link modes (then flip those actions per term in
  `learningProfiles` READY).
