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

/** Which top-level section a category lives under: AUDIO FUNDAMENTALS is the
 *  free + required part, TRAINING LAB is members-only. */
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
};

/** An optional middle "Lab Family" grouping inside a category. */
export type LabFamily = { name: string; labs: LabLeaf[] };

type Common = {
  id: string;
  /** Short glyph icon in the design language's tag-badge. */
  glyph: string;
  name: string;
  /** One-sentence description shown on the category card. */
  description: string;
  /** How the count reads (default "N Labs"). */
  countLabel?: (n: number) => string;
  /** Top-level section. */
  section: LabSection;
  /** Standalone labs listed INLINE under the category (in addition to its
   *  families/labs, or beneath a hub). */
  extraLabs?: LabLeaf[];
};

/** Note shown on a planned-lab row (owner 2026-08-10): states the present fact
 *  only — it is part of the curriculum but not open yet. NO timeline, NO promise
 *  ("soon", "later", "coming", "in development" are all forbidden). */
export const DEV_NOTE = 'Planned lab — not open yet.';

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
  // ── AUDIO FUNDAMENTALS (free): Sound · Acoustics · Signal ────────────
  // Owner 2026-08-10: three fundamentals categories, all included free.
  {
    id: 'sound',
    glyph: '🔊',
    name: 'Sound',
    description: 'What sound is and how we hear and capture it — waves, amplitude, frequency, harmonics, hearing, microphones.',
    section: 'fundamentals',
    kind: 'list',
    labs: [
      { name: 'Foundations of Sound', blurb: 'Air, waves, amplitude, wavelength, phase, harmonics — sound made visible, module by module.', route: 'FoundationsCourse' },
      { name: 'Sound Playground', blurb: 'A free sandbox for every Foundations control and display at once.', route: 'FoundationsPlayground' },
      { name: 'Microphone Principles', blurb: 'Pickup patterns, proximity, off-axis, plosives, stereo pairs — and what cupping the mic really does.', route: 'MicLab' },
      // Dosimeter Lab (owner 2026-08-10): planned to AUTO-RUN in the background,
      // accumulating the user's sound-exposure dose whenever audio output plays.
      // Behavior to be scoped/built later — placeholder only for now.
      { name: 'Dosimeter Lab', blurb: 'A background sound-exposure monitor — tracks your daily noise dose while audio plays.', status: 'development' },
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
      { name: 'Wave Physics Laboratory', blurb: 'Reflection, absorption, interference, coverage, standing waves, arrays — room behaviour.', route: 'WaveLab' },
      { name: 'Speaker Placement & Coverage', blurb: 'Dispersion, aim, height and tilt — who stands in the beam, drawn as a live coverage map.', route: 'SpeakerLab' },
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
      { name: 'Digital Audio Systems', blurb: 'Sampling, Nyquist, aliasing, bit depth, quantization, dither, A/D and D/A conversion.', route: 'DigitalLab' },
      { name: 'Visual Audio Analysis', blurb: 'Waveform, spectrum, spectrogram, waterfall, phase, correlation, LUFS, peak, RMS, VU.', route: 'MeterLab' },
      { name: 'Signal Chain Builder', blurb: 'Generator → EQ → Comp → Gate → FX → Reverb → Limiter → Output.', route: 'SignalChainLab' },
      { name: 'Signal Detective', blurb: 'Identify the meter, read the display, spot the problem, prescribe the fix.', route: 'MeterModule', params: { id: 'detective' } },
      // LIVE (owner 2026-08-07): own home + 8 modules (Signal X-Ray et al).
      { name: 'Gain Staging', blurb: 'Set levels right at every stage — headroom, noise floor, unity gain through the chain.', route: 'GainLabHome' },
    ],
  },

  // ── TRAINING LAB ─────────────────────────────────────────────────────
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
      { name: 'Smart Processors Lab', blurb: 'Assistive / adaptive processors — how they decide.', status: 'development' },
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
      { name: 'Sound Envelope Lab', blurb: 'Attack, decay, sustain, release — shaping dynamics over time.', status: 'development' },
      { name: 'Sample Lab', blurb: 'Sampling, looping, slicing, time-stretch.', status: 'development' },
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
      { name: 'Tunings Lab', blurb: 'Temperaments, reference pitches, just vs equal.', status: 'development' },
    ],
  },
  {
    // Sound Visualization (owner 2026-08-10): a members-only area for seeing
    // sound take shape — cymatics, harmonograph, and other visual forms.
    id: 'visualization',
    glyph: '👁',
    name: 'Sound Visualization',
    description: 'Seeing sound take shape — cymatic plate patterns, harmonograph curves, and other visual forms of vibration.',
    section: 'training',
    kind: 'list',
    labs: [
      { name: 'Harmonograph', blurb: 'Frequency ratios ↔︎ musical intervals, drawn as living Lissajous curves.', route: 'HarmonographLab' },
      { name: 'Cymatics Lab', blurb: 'Sound made visible — the standing-wave patterns that appear when a tone vibrates a plate or membrane.', status: 'development' },
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
      { name: 'Instrument Recording Lab', blurb: 'Mic choice and placement per instrument.', status: 'development' },
      { name: 'Microphone Selection Lab', blurb: 'Pick the right mic for the source — dynamic vs condenser vs ribbon, pattern and application.', status: 'development' },
    ],
  },
  {
    id: 'mixing',
    glyph: '🎛',
    name: 'Mixing & Production',
    description: 'Putting it together — balance, depth, and treating the room.',
    section: 'training',
    kind: 'list',
    labs: [
      { name: 'Mixing Principle Lab', blurb: 'Balance, panning, depth, bus structure.', status: 'development' },
      { name: 'Room Mode Testing Lab', blurb: 'Find and tame axial / tangential / oblique modes.', status: 'development' },
      { name: 'Custom Room Treatment Design Lab', blurb: 'Design absorption, diffusion and bass trapping for a room from its dimensions and use.', status: 'development' },
    ],
  },
  {
    id: 'voice',
    glyph: '🗣',
    name: 'Voice & Speech',
    description: 'The voice — formants, intelligibility, de-essing.',
    section: 'training',
    kind: 'list',
    labs: [{ name: 'Speech Lab', blurb: 'Voice, formants, intelligibility, de-essing.', status: 'development' }],
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
      { name: 'Cable Troubleshooting Lab', blurb: 'Balanced vs unbalanced, hum, opens, shorts.', status: 'development' },
      { name: 'Audio Connectors and Connections Lab', blurb: 'XLR, TRS, TS, speakON, RCA, banana — what each connector carries and how they mate.', status: 'development' },
      { name: 'Patchbay Lab', blurb: 'Normalled, half-normalled and open patchbays — route signal without repatching the rack.', status: 'development' },
      { name: 'Amplifier Types Lab', blurb: 'Class A, AB, D and tube — how each amplifies, and the sound, heat and efficiency trade-offs.', status: 'development' },
    ],
  },
  {
    id: 'calculators',
    glyph: '🖩',
    name: 'Audio Calculator Laboratory',
    description: 'Professional audio math — with the reasoning, not just the result.',
    section: 'training',
    kind: 'hub',
    route: 'CalcLab',
    count: WORKSPACES.length,
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

/** Grand total across everything (for the landing subtitle). */
export function totalLabCount(): number {
  return LAB_CATEGORIES.reduce((n, c) => n + categoryCount(c), 0);
}
