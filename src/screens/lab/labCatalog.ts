/**
 * labCatalog — the data-driven hierarchy behind the Audio Fundamentals &
 * Training Lab (owner IA restructure 2026-08-01). Every lab lives under a
 * SUBJECT category, in one of two top-level sections:
 *   • AUDIO FUNDAMENTALS (free + required) — divided into SOUND then SIGNAL.
 *   • TRAINING LAB (members-only) — the former "Audio Processing" split into
 *     smaller subjects (Equalization, Dynamics, Time Effects, Modulation,
 *     Distortion, Phase), plus Synthesis, Spatial, Pitch, Instruments, Mixing,
 *     Voice, Electronics, and the Calculator Lab in its own subject.
 *
 * The big module hubs (Wave Physics, Digital Audio Systems, Visual Audio
 * Analysis) are listed as single labs that OPEN their own module drill-down.
 * Planned labs are `status: 'development'` rows sorted in with the active labs
 * of their subject (§1.7: no dead links). Counts are computed, never hard-coded.
 */
import type { RootStackParamList } from '../../navigation/types';
import { WORKSPACES } from './calc/registry';
import { computeLabRouteMembership } from './labMembership';

/** Which top-level section a category lives under: AUDIO FUNDAMENTALS is the
 *  required part (core labs free, deeper labs `member: true`), TRAINING LAB is
 *  entirely members-only. */
export type LabSection = 'fundamentals' | 'training';

/** One tappable lab (leaf). `route` is a real screen; `params` for hub-module
 *  deep-links (e.g. the Signal Detective module inside the Meter lab). A leaf
 *  marked `status: 'development'` is a planned lab with NO route yet — it shows
 *  as a non-tappable "in development — soon to be released" row (§1.7: no dead
 *  links). */
export type LabLeaf = {
  name: string;
  blurb: string;
  route?: keyof RootStackParamList;
  params?: object;
  status?: 'development';
  /** Stable audio_fundamentals lab key — matches the labs-catalog seed and the
   *  mark_lab_complete RPC (R6c). Present only on the 11 fundamentals labs that
   *  count toward the universal certificate requirement. IMMUTABLE once live. */
  key?: string;
  /** Member-only override for a lab that lives in a FREE section (owner
   *  2026-08-23). Most of Audio Fundamentals is free, but these deeper labs
   *  require Academy membership. Lock = `leaf.member || section === 'training'`.
   *  Training-section labs don't need this (the section already gates them). */
  member?: boolean;
};

/** An optional middle "Lab Family" grouping inside a category. */
export type LabFamily = { name: string; labs: LabLeaf[] };

type Common = {
  id: string;
  /** Short glyph icon in the design language's tag-badge. */
  glyph: string;
  /** Category tint. Amber is the default for every subject; 'purple' marks
   *  the Calculator Laboratory, matching the purple Σ the glossary already
   *  uses to open it (owner 2026-09-17). */
  accent?: 'amber' | 'purple';
  name: string;
  /** One-sentence description shown on the category card. */
  description: string;
  /** How the count reads (default "N Labs"). */
  countLabel?: (n: number) => string;
  /** Top-level section. */
  section: LabSection;
  /** Exempt from its section's membership lock (owner 2026-09-01): the Audio
   *  Calculator Laboratory is ALWAYS accessible — free users get it with the
   *  weekly calculation cap, members without one. */
  alwaysFree?: boolean;
  /** Standalone labs listed INLINE under the category (in addition to its
   *  families/labs, or beneath a hub). */
  extraLabs?: LabLeaf[];
};

/** Note shown on a planned-lab row.
 *
 *  CURRENTLY UNUSED, ON PURPOSE. The owner removed every placeholder row on
 *  2026-09-17 ("remove the planned modules — I will add them to a future
 *  update"), so no leaf carries `status: 'development'` and this string renders
 *  nowhere. The MECHANISM is kept, not deleted: the `status` field, this note
 *  and the three screens that read it are all still wired, so the future update
 *  switches them back on by adding rows — no new plumbing. Same shape as
 *  cymatics'
 *  `PLANNED_AREAS = []`.
 *
 *  Its wording was changed to "Coming Soon" earlier the same day, reversing the
 *  2026-08-10 no-promise rule. That reversal now affects nothing visible, but
 *  the caution survives for whoever re-adds a row: App Store review has
 *  historically read "coming soon" placeholders as an incomplete-app signal
 *  under guideline 2.1, and the older wording ("Planned lab — not open yet.")
 *  carried the same meaning without the forward promise. See
 *  docs/APE_PRODUCTION_LABS_PLAN_2026_09_17.md §11. */
export const DEV_NOTE = 'Coming Soon';

/** A category is either a HUB (opens an existing lab home that owns its own
 *  drill-down; count = that lab's module registry length) or a LIST (opens a
 *  category-detail screen listing its labs, optionally grouped into families). */
export type LabCategory = Common &
  (
    | { kind: 'hub'; route: keyof RootStackParamList; params?: object; count: number; hubBlurb: string }
    | { kind: 'list'; families?: LabFamily[]; labs?: LabLeaf[] }
  );

const labsPlural = (n: number) => `${n} ${n === 1 ? 'Lab' : 'Labs'}`;

const RAW_LAB_CATEGORIES: LabCategory[] = [
  // ── AUDIO FUNDAMENTALS: Sound · Acoustics · Signal ───────────────────
  // Owner 2026-08-10: three fundamentals categories. Owner 2026-08-23: the
  // section is no longer all-free — the core intro labs (Level & Amplitude,
  // Foundations of Sound, Wave Physics) stay free; deeper labs carry
  // `member: true` and lock for non-members (all of Signal, plus Sound
  // Playground, Mic Principles, Speaker Placement & Coverage).
  {
    id: 'sound',
    glyph: '🔊',
    name: 'Sound',
    description: 'What sound is and how we hear and capture it — waves, amplitude, frequency, harmonics, hearing, microphones.',
    section: 'fundamentals',
    kind: 'list',
    labs: [
      // START HERE (owner 2026-08-12): the app-wide blue→red level/amplitude
      // color language, taught once. First lab in Audio Fundamentals, before
      // any other visual audio lab.
      { name: 'Understanding Level & Amplitude', blurb: 'The blue→red color language every Academy display uses for level and amplitude — learn it once, recognize it everywhere.', route: 'AmplitudeLab', key: 'af_amplitude' },
      { name: 'Foundations of Sound', blurb: 'Air, waves, amplitude, wavelength, phase, harmonics — sound made visible, module by module.', route: 'FoundationsCourse', key: 'af_foundations' },
      { name: 'Sound Playground', blurb: 'A sandbox for every Foundations control and display at once.', route: 'FoundationsPlayground', key: 'af_sound_playground', member: true },
      { name: 'Microphone Principles', blurb: 'Pickup patterns, proximity, off-axis, plosives, stereo pairs — and what cupping the mic really does.', route: 'MicLab', key: 'af_mic_principles', member: true },
      // The dosimeter itself is NOT a catalog lab (owner 2026-08-12): it runs
      // silently in the background; the user interacts with it ONLY from the
      // Measurement & Analysis Tools menu (readout + popup) and the 15-minute
      // check-ins inside audio tools/labs.
    ],
  },
  {
    id: 'acoustics',
    glyph: '🏛',
    name: 'Acoustics',
    description: 'How sound behaves in real spaces — reflection, absorption, interference, standing waves, and speaker coverage.',
    section: 'fundamentals',
    kind: 'list',
    labs: [
      { name: 'Wave Physics Laboratory', blurb: 'Reflection, absorption, interference, coverage, standing waves, arrays — room behaviour.', route: 'WaveLab', key: 'af_wave_physics' },
      { name: 'Speaker Placement & Coverage', blurb: 'Dispersion, aim, height and tilt — who stands in the beam, drawn as a live coverage map.', route: 'SpeakerLab', key: 'af_speaker_coverage', member: true },
    ],
  },
  {
    id: 'signal',
    glyph: '📶',
    name: 'Signal',
    description: 'Sound as a signal — digital audio, analysis displays, and the signal chain.',
    section: 'fundamentals',
    kind: 'list',
    labs: [
      { name: 'Digital Audio Systems', blurb: 'Sampling, Nyquist, aliasing, bit depth, quantization, dither, A/D and D/A conversion.', route: 'DigitalLab', key: 'af_digital_audio', member: true },
      { name: 'Visual Audio Analysis', blurb: 'Waveform, spectrum, spectrogram, waterfall, phase, correlation, LUFS, peak, RMS, VU.', route: 'MeterLab', key: 'af_visual_analysis', member: true },
      { name: 'Signal Chain Builder', blurb: 'Generator → EQ → Comp → Gate → FX → Reverb → Limiter → Output.', route: 'SignalChainLab', key: 'af_signal_chain', member: true },
      { name: 'Signal Detective', blurb: 'Identify the meter, read the display, spot the problem, prescribe the fix.', route: 'MeterModule', params: { id: 'detective' }, key: 'af_signal_detective', member: true },
      // FLAGSHIP (owner spec 2026-08-15): connectors, cables, selection,
      // inspection, virtual tester, system challenges, safety-gated final.
      // Placed after the signal-flow labs, before Gain Staging (owner ruling).
      // Owner 2026-08-23: now member-only along with the rest of Signal.
      { name: 'Cable & Connector Fundamentals', blurb: 'Identify it. Understand it. Connect it safely — what every connector carries, what’s inside the cable, and what happens when the wrong one is used.', route: 'CableLab', key: 'af_cables', member: true },
      // Audio Connectors & Cable Selection (owner brief 2026-09-11): the
      // selection-and-diagnosis companion to the fundamentals lab — same
      // verified connector records, new stations (same-connector/different-job
      // matrix, build-the-system scenarios, fault finder, job-final).
      { name: 'Audio Connectors & Cable Selection', blurb: 'The shape never tells you the signal — pick the right cable for real systems, refuse the unsafe ones, and find the fault when it hides.', route: 'ConnectorSelectLab', key: 'af_connector_select', member: true },
      // Professional installation practice — the decision lab that follows the
      // connector fundamentals (owner brief 2026-08-24).
      { name: 'Cable Dressing & Installation', blurb: 'Route it. Support it. Protect it. Make it serviceable — professional installation decisions from plan to final inspection.', route: 'CableInstallLab', key: 'af_cable_install', member: true },
      // LIVE, complete (owner brief 2026-09-10; both phases device-passed,
      // copy ratified). af_patchbay key added on the owner's 2026-09-10 ruling
      // ("anything in the Audio Fundamentals container is part of the
      // fundamentals requisite") — credit is inert server-side until the owner
      // runs docs/APE_PATCHBAY_LAB_SEED_2026_09_10.sql.
      { name: 'Patchbay Signal Flow & Normalling', blurb: 'Top is the source, bottom is the destination — thru, full-normal and half-normal, the switching contact that makes them real, and the patch that changes everything.', route: 'PatchbayLab', key: 'af_patchbay', member: true },
      // LIVE (owner 2026-08-07): own home + 8 modules (Signal X-Ray et al).
      { name: 'Gain Staging', blurb: 'Set levels right at every stage — headroom, noise floor, unity gain through the chain.', route: 'GainLabHome', key: 'af_gain_staging', member: true },
    ],
  },

  // ── TRAINING LAB ─────────────────────────────────────────────────────
  // Mixing leads the training section (owner GO 2026-09-11): the workflow
  // umbrella the EQ/dynamics/effects labs plug into. Member-only (owner
  // recommendation-approved). Advanced Mixing joins when built.
  {
    // 'mixingworkflow', not 'mixing': the pre-existing "Mixing & Production"
    // category below already holds id 'mixing'. Sharing it produced a duplicate
    // React key in EarLabScreen (which also builds per-leaf state as
    // `${cat.id}:${leaf.name}`), so the two categories could omit or duplicate
    // each other's rows. Caught by the 2026-09-11 QA sweep.
    // SETTLED 2026-09-17: the duplicate is gone. The all-placeholder "Mixing &
    // Production" category was removed with the rest of the placeholders, so
    // this is now the only mixing category. The id stays 'mixingworkflow' —
    // renaming it would change its `labs/:id` deep link for no gain.
    id: 'mixingworkflow',
    glyph: '🎛',
    name: 'Mixing',
    description: 'Balance, clarity, depth, movement and focus — the listening decisions that make a mix.',
    section: 'training',
    kind: 'list',
    labs: [
      // Both labs LIVE (overnight build 2026-09-11; owner ratification pending).
      { name: 'Beginning Mixing', blurb: 'A repeatable process from session prep to a clear, balanced stereo mix — faders first, plugins later.', route: 'BeginningMixingLab', member: true },
      { name: 'Advanced Mixing', blurb: 'Complex routing, parallel paths, phase, translation, stems and professional delivery — repair and ship real mixes.', route: 'AdvancedMixingLab', member: true },
    ],
  },
  // Production Workflow (owner GO 2026-09-17). The two flagship labs: what
  // happens BEFORE anything is recorded, and what happens after. Plan of record:
  // docs/APE_PRODUCTION_LABS_PLAN_2026_09_17.md. Audio Post-Production is not
  // listed until it is built — placeholder rows were removed app-wide the same
  // day, and adding one back here would undo that.
  {
    id: 'production',
    glyph: '🎬',
    name: 'Production Workflow',
    description: 'Planning a production before it starts, and finishing it after the recording stops.',
    section: 'training',
    kind: 'list',
    labs: [
      { name: 'Audio Pre-Production', blurb: 'Turn a vague brief into a production a crew can actually run — scope, deliverables, people, schedule and budget — and leave with a Production Packet that shows its own gaps.', route: 'PreProdLab', params: { lab: 'preprod' }, member: true },
      { name: 'Audio Post-Production', blurb: 'Take a folder of recordings through to a delivery somebody has accepted — ingest, sync, edit, mix, finish to specification, and prove the files arrived intact — leaving a Delivery Package and an archive that can still be opened years later.', route: 'PostProdLab', params: { lab: 'postprod' }, member: true },
    ],
  },
  {
    id: 'equalization',
    glyph: '🎚',
    name: 'Equalization',
    description: 'Shape tone by frequency — graphic, parametric, shelves, filters, dynamic EQ.',
    section: 'training',
    kind: 'list',
    labs: [
      { name: 'Equalizer', blurb: 'Graphic, parametric, shelves, filters, dynamic EQ.', route: 'EqLab' },
      // LIVE (slice 1, owner 2026-08-07): its own home + Seeing Frequency module.
      { name: 'EQ Lab', blurb: 'See, hear, manipulate and diagnose frequency content — live spectrum, filters, training.', route: 'EqLabHome' },
    ],
  },
  {
    id: 'dynamics',
    glyph: '📉',
    name: 'Dynamics',
    description: 'Control level over time — compression, gating, limiting.',
    section: 'training',
    kind: 'list',
    labs: [
      { name: 'Compression', blurb: 'Threshold, ratio, attack/release, envelope.', route: 'CompressionLab' },
      { name: 'Gate / Expander', blurb: 'Downward expansion, chatter, sidechain.', route: 'GateLab' },
      { name: 'Limiter', blurb: 'Brickwall ceiling, true-peak, loudness.', route: 'LimiterLab' },
      // LIVE V1 (owner brief 2026-09-02): the family hub opens with the De-Esser
      // & Sibilance Control lab; the other processors are listed as planned.
      { name: 'Smart Processors Lab', blurb: 'Processors that listen, decide and act — V1: the De-Esser & Sibilance Control lab.', route: 'SmartProcessorsLab' },
    ],
  },
  {
    id: 'timefx',
    glyph: '⏱',
    name: 'Time Effects',
    description: 'Echoes and spaces — delay and reverb.',
    section: 'training',
    kind: 'list',
    labs: [
      { name: 'Delay', blurb: 'Echoes, slapback, tempo sync, feedback.', route: 'DelayLab' },
      { name: 'Reverb', blurb: 'Rooms, pre-delay, decay, RT60, damping.', route: 'ReverbLab' },
    ],
  },
  {
    id: 'modulation',
    glyph: '🌀',
    name: 'Modulation',
    description: 'Moving comb filters and detuned voices — chorus, flanger, phaser.',
    section: 'training',
    kind: 'list',
    labs: [
      { name: 'Chorus', blurb: 'Detuned voices, width, modulation.', route: 'ChorusLab' },
      { name: 'Flanger', blurb: 'Sweeping comb-filter notches.', route: 'FlangerLab' },
      { name: 'Phaser', blurb: 'All-pass stages, phase cancellation.', route: 'PhaserLab' },
    ],
  },
  {
    id: 'saturation',
    glyph: '🔥',
    name: 'Distortion & Saturation',
    description: 'Add harmonics — clipping, saturation, tube and tape colour.',
    section: 'training',
    kind: 'list',
    labs: [{ name: 'Distortion', blurb: 'Harmonics, clipping, saturation, aliasing.', route: 'DistortionLab' }],
  },
  {
    id: 'phase',
    glyph: '◐',
    name: 'Phase',
    description: 'Polarity vs phase, correlation, mono compatibility.',
    section: 'training',
    kind: 'list',
    labs: [{ name: 'Phase', blurb: 'Polarity vs phase, correlation, mono compatibility.', route: 'PhaseLab' }],
  },
  {
    id: 'synthesis',
    glyph: '∿',
    name: 'Synthesis & Sound Design',
    description: 'Create sound from scratch — oscillators, noise, FM, modular, envelopes.',
    section: 'training',
    kind: 'list',
    labs: [
      { name: 'Oscillators', blurb: 'Sine/square/saw, FM, AM, band-limiting.', route: 'OscillatorLab' },
      { name: 'Noise', blurb: 'White → violet colors, floor, SNR, masking.', route: 'NoiseLab' },
      { name: 'Harmonics', blurb: 'Additive synthesis, spectrum, Fourier.', route: 'HarmonicLab' },
      { name: 'FM Synthesis', blurb: 'Carrier + modulator: ratio, index, and sidebands.', route: 'FmLab' },
      { name: 'Modular Synth', blurb: 'VCO · VCF · VCA · LFO · envelope · sequencer — signal flow and patching.', route: 'ModularLab' },
      // LIVE (owner brief 2026-09-02): the Sound Envelope & Transients Lab.
      { name: 'Sound Envelope & Transients Lab', blurb: 'Attack, transient, decay, sustain, release, duration — how a sound evolves over time at its source.', route: 'EnvelopeLab' },
      // REMOVED 2026-09-17 (owner): 'Sample Lab' placeholder — returns in a
      // future update. See the note on DEV_NOTE.
    ],
  },
  {
    id: 'spatial',
    glyph: '🎧',
    name: 'Stereo & Spatial',
    description: 'Width and placement — stereo imaging and binaural space.',
    section: 'training',
    kind: 'list',
    labs: [
      { name: 'Stereo Imaging', blurb: 'Pan, width, Mid/Side, mono-fold.', route: 'StereoLab' },
      { name: 'Binaural Panner', blurb: 'Move sound objects around your head — binaural headphone mix.', route: 'BinauralLab' },
    ],
  },
  {
    id: 'pitch',
    glyph: '🎵',
    name: 'Pitch & Tuning',
    description: 'Pitch correction and tuning systems.',
    section: 'training',
    kind: 'list',
    labs: [
      { name: 'Autotune', blurb: 'Pitch correction on the cents grid — amount, retune speed.', route: 'AutotuneLab' },
      // LIVE (owner build spec 2026-09-02): the former 'Tunings Lab'
      // placeholder, built as the fourteen-chapter Tuning & Temperament Lab.
      { name: 'Tuning & Temperament Lab', blurb: 'How musical scales are built, heard, and compared — pure fifths, the comma, Just, meantone, and equal temperament.', route: 'TuningLab' },
    ],
  },
  {
    // Sound Visualization (owner 2026-08-10): a members-only area for seeing
    // sound take shape — cymatics and other visual forms.
    //
    // Harmonograph has been in both places. It went to Pitch & Tuning on
    // 2026-08-23 (it does teach frequency ratios as musical intervals) and came
    // back here on 2026-09-17 at the owner's instruction: what a user actually
    // does in it is WATCH a drawing appear, which is this category's whole
    // subject, and it belongs beside Cymatics rather than beside Autotune.
    id: 'visualization',
    glyph: '👁',
    name: 'Sound Visualization',
    description: 'Seeing sound take shape — cymatic plate patterns and other visual forms of vibration.',
    section: 'training',
    kind: 'list',
    labs: [
      // LIVE Phase 1 (owner GO 2026-09-16, spec docs/APE_CYMATICS_LAB_SPEC_2026_09_16.md):
      // standalone lab home + Chladni Plate Studio + theory/integrity modules
      // + guided experiments. Liquid / membrane / harmony / art phases follow.
      { name: 'Cymatics Lab: Sound Made Visible', blurb: 'Chladni plates, a liquid dish on a shaker, a drumhead and a loudspeaker cone — build a plate, drive it with a tone, watch sand find the still lines; shake a liquid past its Faraday threshold; tune a drum and hear why a timpani has a pitch; sweep a cone into breakup; save, colour, compare and print your patterns. Why a frequency has no shape of its own.', route: 'CymaticsLab' },
      { name: 'Harmonograph', blurb: 'Frequency ratios ↔︎ musical intervals, drawn as living Lissajous curves.', route: 'HarmonographLab' },
    ],
  },
  {
    id: 'instruments',
    glyph: '🎸',
    name: 'Instruments & Recording',
    description: 'Real instruments and capturing them well.',
    section: 'training',
    kind: 'list',
    labs: [
      { name: 'Bass Guitar Physics', blurb: 'String division, wavelength, harmonics, fret fractions ↔︎ intervals.', route: 'BassLab' },
      // REMOVED 2026-09-17 (owner): 'Instrument Recording Lab' placeholder —
      // returns in a future update. See the note on DEV_NOTE.
      // LIVE (owner spec 2026-08-12): 9 lessons + Choose-the-Mic challenge +
      // optional mic-locker exercise. Selection & characteristics only — the
      // physics/technique labs stay separate.
      { name: 'Microphone Selection Lab', blurb: 'Read the specs, weigh the job, make a defensible choice — types, characteristics, patterns, and the Choose-the-Mic challenge.', route: 'MicSelectLab' },
    ],
  },
  // REMOVED 2026-09-17 (owner): the whole "Mixing & Production" category
  // (id 'mixing'). All three of its rows were placeholders — Mixing Principle,
  // Room Mode Testing, Custom Room Treatment Design — so dropping them would
  // have left an empty category card reading "0 Labs". They return in a future
  // update. This also settles the duplicate flagged in the note on
  // 'mixingworkflow' above: the live "Mixing" category is now the only one.
  // A stale `labs/mixing` deep link degrades to the category screen's own
  // "not available" state (linking.ts), so no dead link is created.
  {
    id: 'voice',
    glyph: '🗣',
    name: 'Voice & Speech',
    description: 'The voice — formants, intelligibility, de-essing.',
    section: 'training',
    kind: 'list',
    // LIVE (owner brief 2026-09-02): "How Human Speech Works" — visual, paged.
    labs: [{ name: 'Speech & Voice Lab', blurb: 'How human speech works — anatomy, voicing, vowels and formants, consonants, plosives, sibilance, distance, voices, problems.', route: 'SpeechLab' }],
  },
  {
    id: 'electronics',
    glyph: '⚡',
    name: 'Audio Electronics',
    description: 'Inside the analog gear — circuits, tubes, and cabling.',
    section: 'training',
    kind: 'list',
    labs: [
      { name: 'Vacuum Tube Fundamentals', blurb: 'How a tube amplifies by controlling electron flow — with an Electron View that shows the invisible.', route: 'TubeLab' },
      // The planned 'Cable Troubleshooting Lab' and 'Audio Connectors and
      // Connections Lab' rows were REMOVED (owner ruling 2026-08-15) —
      // superseded by the free Cable & Connector Fundamentals lab (CableLab).
      // The 'Patchbay Lab' PLANNED placeholder was REMOVED (owner ruling
      // 2026-09-14, device pass): the full Patchbay Signal Flow & Normalling
      // lab (route 'PatchbayLab') ships live under Signal → Connectors, so a
      // "coming soon" row here was redundant and misleading.
      // LIVE (owner build spec 2026-09-02): the former 'Amplifier Types Lab'
      // placeholder, built as the eight-module Amplifier Principles Lab.
      { name: 'Amplifier Principles Lab', blurb: 'From transistors and transformers to amplifier classes — what the amplifier is doing, what load it sees, and where the energy comes from.', route: 'AmpLab' },
    ],
  },
  {
    id: 'eartraining',
    glyph: '👂',
    name: 'Ear Training',
    description: 'Critical listening drills — hear a change, then see it measured.',
    section: 'training',
    kind: 'list',
    labs: [
      {
        name: 'Ear Training Lab',
        blurb: 'Frequencies, EQ moves, bands, noise colors and more — rendered signals, honest scoring, and the analyzer view of every answer.',
        route: 'EarTrainingLab',
      },
    ],
  },
  {
    id: 'calculators',
    // SIGMA, not the pocket-calculator emoji: U+1F5A9 has no glyph in the
    // Android system font and rendered as a tofu box on the Pixel. Sigma is
    // also the app's established calculator mark (the purple Σ in the
    // glossary opens this same lab).
    glyph: 'Σ',
    accent: 'purple',
    name: 'Audio Calculator Laboratory',
    description: 'Professional audio math — with the reasoning, not just the result.',
    section: 'training',
    // Always open, to every tier (owner 2026-09-01) — free accounts are limited
    // by the weekly calculation cap, not by a lock on the lab.
    alwaysFree: true,
    kind: 'hub',
    route: 'CalcLab',
    // Count the CALCULATORS, not the workspaces (fix 2026-08-31: the row
    // said "55 Calculators" over 163 ratified functions).
    count: WORKSPACES.reduce((a, w) => a + w.functions.length, 0),
    countLabel: (n) => `${n} Calculators`,
    hubBlurb: 'SPL, dB, speaker power, delay, wavelength, room modes, cable loss, Ohm’s law, digital audio, coverage — chained.',
  },
];

// PLANNED LABS ARE SHOWN (owner 2026-08-10, corrected): planned/unbuilt labs
// (status:'development') DO appear as visible placeholders — the owner wants
// students to see what the curriculum covers. What we must NOT do is PROMISE a
// feature or imply a TIMELINE ("coming soon", "in development", "soon", "later",
// "arrives with X build"). The dev rows are shown, non-tappable, labeled with a
// neutral, timeline-free note (DEV_NOTE). No filtering here — the full plan is
// the catalog.
export const LAB_CATEGORIES: LabCategory[] = RAW_LAB_CATEGORIES;

/** Computed leaf-lab count for a category (never hard-coded). */
export function categoryCount(cat: LabCategory): number {
  const extra = cat.extraLabs?.length ?? 0;
  if (cat.kind === 'hub') return cat.count + extra;
  const fromFamilies = (cat.families ?? []).reduce((n, f) => n + f.labs.length, 0);
  return fromFamilies + (cat.labs?.length ?? 0) + extra;
}

/** Categories belonging to a top-level section, in catalog order. */
export function sectionCategories(section: LabSection): LabCategory[] {
  const cats = LAB_CATEGORIES.filter((c) => c.section === section);
  // Training Lab is listed A→Z by category name (owner 2026-08-10). Audio
  // Fundamentals keeps its deliberate Sound → Acoustics → Signal order.
  return section === 'training' ? [...cats].sort((a, b) => a.name.localeCompare(b.name)) : cats;
}

/** The individual labs listed INLINE under a category on the landing. A hub's
 *  many modules stay inside the hub itself (opened via its card), so only its
 *  attached extraLabs list here; a 'list' category lists all its real labs plus
 *  any extraLabs. */
export function categoryLabRows(cat: LabCategory): LabLeaf[] {
  if (cat.kind === 'hub') return cat.extraLabs ?? [];
  return [
    ...(cat.families ?? []).flatMap((f) => f.labs),
    ...(cat.labs ?? []),
    ...(cat.extraLabs ?? []),
  ];
}

/** Every category rendered as uniform lab ROWS. A hub becomes ONE row that opens
 *  the hub, followed by its attached extraLabs; a 'list' category contributes
 *  all its labs. */
export function categoryEntries(cat: LabCategory): LabLeaf[] {
  if (cat.kind === 'hub') {
    return [{ name: cat.name, blurb: cat.hubBlurb, route: cat.route, params: cat.params }, ...(cat.extraLabs ?? [])];
  }
  return categoryLabRows(cat);
}

/** The card's count label, e.g. "5 Labs" / "25 Calculators". */
export function categoryCountLabel(cat: LabCategory): string {
  const n = categoryCount(cat);
  return (cat.countLabel ?? labsPlural)(n);
}

/** All leaves in a 'list' category, flattened (families, loose labs, extras). */
export function categoryLeaves(cat: LabCategory): LabLeaf[] {
  if (cat.kind === 'hub') return cat.extraLabs ?? [];
  return [...(cat.families ?? []).flatMap((f) => f.labs), ...(cat.labs ?? []), ...(cat.extraLabs ?? [])];
}

export function getCategory(id: string): LabCategory | undefined {
  return LAB_CATEGORIES.find((c) => c.id === id);
}

// ── Membership rule, keyed by SCREEN ROUTE (single source of truth) ──────────
// The SAME rule EarLabScreen paints as a row lock, expressed per screen route,
// so the deep-link / pendingLink screen gate (withMembershipPreview) can never
// disagree with the list. Without this a lab could show a 🔒 in the Ear Lab yet
// open fully via `proaudio://labs/<lab>` (navigation bug hunt 2026-09-14, E1).
// The derivation lives in ./labMembership (node-testable — no calc import).
const LAB_ROUTE_MEMBERSHIP = computeLabRouteMembership(LAB_CATEGORIES);

/**
 * Members-only routes the CATALOG CANNOT NAME.
 *
 * ── WHY THIS EXISTS, AND WHY THE ABSENCE OF IT WAS A BLOCKER ─────────────
 *
 * `LAB_ROUTE_MEMBERSHIP` is derived from the catalog, and the catalog lists
 * LABS. It has no vocabulary for the screens INSIDE a lab, or for a route that
 * exists only as a shared target — so `isMemberOnlyLabRoute` returned false for
 * every one of them, and `withMembershipPreview` (which asks exactly that
 * question) let them straight through.
 *
 * Wrapping those routes in `MemberGated.*` in the navigator therefore did
 * NOTHING, and on 2026-09-17 I compounded it: having "gated" them, I opened the
 * matching deep links in `isClaimedPath`, retiring the accidental protection
 * that had been covering the hole. A non-member opening
 * `proaudio://labs/cymatics/plate` got the live members-only lab — no scrim,
 * audio ungated, completion credited — in both flagship paid labs. Found by a
 * pass-3 pattern sweep looking for exactly this shape of inert gate.
 *
 * The lesson is that the wrapper is not the gate; this predicate is. A route
 * belongs here when it is reachable on its own and lives behind a paid lab.
 */
const MEMBER_ONLY_EXTRA_ROUTES: Record<string, string> = {
  // Inside the Cymatics Lab (its own catalog row is `CymaticsLab`).
  CymaticsModule: 'Cymatics Lab',
  CymaticsPlateStudio: 'Cymatics Lab',
  CymaticsLiquidStudio: 'Cymatics Lab',
  CymaticsMembraneStudio: 'Cymatics Lab',
  CymaticsGallery: 'Cymatics Lab',
  // The production labs. The catalog names `PreProdLab` / `PostProdLab`; the
  // navigator ALSO registers the shared `ProductionLab` target and the two
  // child screens, none of which the catalog can see.
  ProductionLab: 'Production Labs',
  ProductionStage: 'Production Labs',
  ProductionActivity: 'Production Labs',
};

/** True when EVERY catalog appearance of this screen route is members-only —
 *  so a non-member reaching it by any route (deep link, pendingLink resume, an
 *  Ear Lab row) should get the preview, never the live lab. */
export function isMemberOnlyLabRoute(route: string): boolean {
  if (route in MEMBER_ONLY_EXTRA_ROUTES) return true;
  return LAB_ROUTE_MEMBERSHIP.get(route)?.memberOnly ?? false;
}

/** The lab's display name for a screen route (for the preview upgrade sheet). */
export function labRouteName(route: string): string | undefined {
  return LAB_ROUTE_MEMBERSHIP.get(route)?.name ?? MEMBER_ONLY_EXTRA_ROUTES[route];
}

/** Grand total across everything (for the landing subtitle). */
export function totalLabCount(): number {
  return LAB_CATEGORIES.reduce((n, c) => n + categoryCount(c), 0);
}
