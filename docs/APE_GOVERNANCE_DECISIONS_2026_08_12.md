# AP&E — Governance & Decisions Log (2026-08-12)

Rulings of record from the audio-tools / measurement-honesty dev cycle
(`audio-tools-engine` branch). Successor to
`APE_GOVERNANCE_DECISIONS_2026_08_06.md`; supersedes conflicting earlier notes
where called out below. Owner rulings issued in the Claude Code dev sessions
through 2026-08-12.

> Scope note: this log covers the **measurement tools + labs** (units, colour,
> visual, first-use, and safety standards). It does not touch the v3-curriculum
> rulings in the 2026-08-06 log — those (its R1–R8) stand unchanged. The R-number
> series below restarts at R1 per house style (each dated log numbers its own),
> so "R1" here is **not** the 2026-08-06 "R1".

## New rulings (owner, 2026-08-12)

### R1 — SPL READOUTS SHOW dB SPL / dBA / dBC, NOT dBFS
**Supersedes the earlier measurement-tools ruling that "uncalibrated stays
dBFS."** The SPL Reference Meter's level / Leq / peak readouts **and its saved
records** show **estimated dB SPL** (with the active weighting: dB SPL / dBA /
dBC), never dBFS.

- Estimate = `dBFS + field offset` when field-calibrated; when uncalibrated, a
  **nominal offset** (0 dBFS ≈ 100 dB SPL) is applied so the number reads as a
  plausible sound-pressure level. Pro users expect SPL, not full-scale digital.
- **Floored at 0** (no negative SPL).
- **Always labeled** — `field-calibrated (approximate)` or
  `uncalibrated estimate`; the uncalibrated nominal offset is recorded as the
  disclaimer on the record.
- Uncalibrated saved records carry `calibration_status: 'uncalibrated'` +
  `uncalibrated_input` + the nominal offset string.
- **dBFS is reserved for genuine DIGITAL readings** (headroom / clip / converter
  overload) and is never used for an SPL-meter readout. The clip cue is kept via
  colour, not by relabelling the number dBFS.

Note: the **MultiMeter** deliberately stays **dBFS · uncalibrated** across all
four of its panels (it is an all-at-once relative instrument, not the calibrated
SPL tool) and labels itself so verbatim. This ruling governs the dedicated **SPL
Reference Meter**, not the MultiMeter.

### R2 — ONE AMPLITUDE COLOUR RAMP (level → colour, everywhere)
Wherever level/amplitude is **drawn** (bars, spectra, waveforms, heat maps,
spectrograms) **or shown as a number**, it uses the **single app-wide ramp**:
**blue (quiet) → green → yellow → orange → red (loud)**. Silence / the
zero-pressure mid-line is **MIDI-0 blue**.

- Source of truth: `src/features/tools/levelColor.ts` — `levelColor`,
  `heatColor`, `levelColorForDb`, `MIDLINE_BLUE`, `WAVE_LEVEL_STOPS`.
- Numeric readouts colour via `levelColorForDb` (applied 2026-08-12 across
  Spectrogram / SPL / RTA / Waveform / MultiMeter). No tool invents its own
  amplitude palette.

### R3 — LAB VISUAL STANDARDS (recognizable Skia illustrations, STANDING)
(Owner 2026-07-29, restated of record.) **No primitive stand-ins for real
objects** — a mic, speaker, head, tube, etc. must be a recognizable Skia
illustration (gradients / curves), never a box / circle / line. Abstract data
(graphs, meters, spectra) may stay clean-geometric but must be styled. All
illustrations are fictional; honesty rules unchanged.

### R4 — FIRST-USE AMPLITUDE-ORIENTATION GATE
Before any audio lab/tool renders live level colour, the user is shown the
amplitude colour-language orientation **once** ("Understanding Level &
Amplitude" — the blue→red magnitude convention), via `withAmplitudeOrientation`
(one persisted flag, shows once). The standalone lab remains available on demand.
Rationale: the colour ramp (R2) is only honest if the learner has been taught to
read it.

### R5 — MICROPHONE SELECTION LAB
Added of record: `src/screens/lab/micselect/*` — 9 lessons + a Choose-the-Mic
challenge + an optional locker; 12 Skia mic illustrations. **All mics are
fictional** (no real makes/models), consistent with R3 + the no-fake standards.

### R6 — LISTENING EXPOSURE MONITOR (audio dosimeter)
Added of record: `src/features/audio/exposureMonitor.ts` — a centralized service
holding **ONE combined exposure timeline**.

- Tracks **output** (playback, estimated from source dBFS + an adjustable
  reference) **and incoming** (mic-measured environmental level while a
  measurement tool runs — **measured** when field-calibrated, else **estimated**,
  and labeled as such). Levels are combined **max-per-tick, never summed**.
- 3 dB-exchange dose (OSHA / conservative selectable); persists; midnight reset;
  45-day history. The poller **arms only while foregrounded AND** (output can
  sound OR mic capturing) — no background cost, nothing simulated while idle.
- **Runs silently.** Interaction is only via the ToolsHub **dosimeter chip**
  (live readout + OPEN → `ExposureMonitor` modal) and the **15-minute check-in**
  overlay (routine/advisory check-ins only inside audio tools/labs; critical
  dose warnings anywhere). `ExposureMonitorScreen` (route `ExposureMonitor`,
  modal, ungated) exposes session / today / by-source / 7–30 day history /
  settings / calibration / privacy.
- **No measurement content leaves the device**; dose math is exported as pure
  functions (host-side golden suite pending a separate test-infra decision).

---

## Carried standing rules (unchanged, restated for the record)
- **No fake meters** (measurement-tools §1.7): live tools are honest-gated
  (`EngineGate`) until the native `ape-dsp` engine is in the build; ANALYTIC vs
  LIVE is always labeled.
- **Read the versioned Expo docs first** (`https://docs.expo.dev/versions/v57.0.0/`)
  before writing Expo-touching code (AGENTS.md / CLAUDE.md).
- **Frozen backend** — client-only unless the owner explicitly green-lights a
  Supabase migration; native offline-queue behaviour stays byte-identical.
- **Ratified commercial copy** in `src/lib/copy.ts` is verbatim — add strings,
  never reword existing ones; rewording routes to governance.
- **Governance of record** lives in `docs/APE_GOVERNANCE_DECISIONS_*.md` (this is
  now the latest) + `docs/SCREEN_STATUS.md` — the source of truth when memory and
  code disagree.
