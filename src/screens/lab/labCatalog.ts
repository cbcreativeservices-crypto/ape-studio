/**
 * labCatalog — the data-driven hierarchy behind the Audio Learning Lab
 * (owner IA restructure 2026-07-29). Replaces the flat scrolling list with
 * CATEGORY → (optional Lab Family) → LAB.
 *
 * FUTURE-PROOFING (owner requirements):
 *  • Lab counts are NEVER hard-coded — they are COMPUTED here. 'list'
 *    categories count their real leaf labs; 'hub' categories pull the length
 *    of the target lab's own module registry (Wave/Digital/Meter/Calculator),
 *    so adding a module or a lab updates every displayed count automatically.
 *  • Adding a lab = add one leaf to a family/category (or a module to a
 *    registry). The navigation system needs no other change.
 *
 * HONESTY: every leaf is a REAL route. Aspirational sub-topics in the owner's
 * spec that aren't separate labs today (e.g. "Op-Amps", "Transistors",
 * "Hearing & Perception") are intentionally NOT listed as labs — they slot in
 * later and the counts follow. No dead links, no fabricated counts (§1.7).
 */
import type { RootStackParamList } from '../../navigation/types';
import { WAVE_MODULES } from './wave/modules/registry';
import { DIGITAL_MODULES } from './digital/modules/registry';
import { METER_MODULES } from './meter/modules/registry';
import { WORKSPACES } from './calc/registry';

/** One tappable lab (leaf). `route` is a real screen; `params` for hub-module
 *  deep-links (e.g. the Signal Detective module inside the Meter lab). */
export type LabLeaf = {
  name: string;
  blurb: string;
  route: keyof RootStackParamList;
  params?: object;
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
};

/** A category is either a HUB (opens an existing lab home that owns its own
 *  drill-down; count = that lab's module registry length) or a LIST (opens a
 *  category-detail screen listing its labs, optionally grouped into families). */
export type LabCategory = Common &
  (
    | { kind: 'hub'; route: keyof RootStackParamList; params?: object; count: number; hubBlurb: string }
    | { kind: 'list'; families?: LabFamily[]; labs?: LabLeaf[] }
  );

const labsPlural = (n: number) => `${n} ${n === 1 ? 'Lab' : 'Labs'}`;

export const LAB_CATEGORIES: LabCategory[] = [
  {
    id: 'foundations',
    glyph: '★',
    name: 'Foundations',
    description: 'Everything the rest of the Academy builds upon — the fundamentals of sound, waves, and hearing.',
    kind: 'list',
    labs: [
      { name: 'Foundations of Sound', blurb: 'Air, waves, amplitude, wavelength, phase, harmonics — sound made visible, module by module.', route: 'FoundationsCourse' },
      { name: 'Sound Playground', blurb: 'A free sandbox for every Foundations control and display at once.', route: 'FoundationsPlayground' },
    ],
  },
  {
    id: 'processing',
    glyph: '⚙',
    name: 'Audio Processing',
    description: 'Learn how professional processors shape and control sound.',
    kind: 'list',
    families: [
      {
        name: 'Equalization',
        labs: [{ name: 'Equalizer', blurb: 'Graphic, parametric, shelves, filters, dynamic EQ.', route: 'EqLab' }],
      },
      {
        name: 'Dynamics',
        labs: [
          { name: 'Compression', blurb: 'Threshold, ratio, attack/release, envelope.', route: 'CompressionLab' },
          { name: 'Gate / Expander', blurb: 'Downward expansion, chatter, sidechain.', route: 'GateLab' },
          { name: 'Limiter', blurb: 'Brickwall ceiling, true-peak, loudness.', route: 'LimiterLab' },
        ],
      },
      {
        name: 'Time Effects',
        labs: [
          { name: 'Delay', blurb: 'Echoes, slapback, tempo sync, feedback.', route: 'DelayLab' },
          { name: 'Reverb', blurb: 'Rooms, pre-delay, decay, RT60, damping.', route: 'ReverbLab' },
        ],
      },
      {
        name: 'Modulation',
        labs: [
          { name: 'Chorus', blurb: 'Detuned voices, width, modulation.', route: 'ChorusLab' },
          { name: 'Flanger', blurb: 'Sweeping comb-filter notches.', route: 'FlangerLab' },
          { name: 'Phaser', blurb: 'All-pass stages, phase cancellation.', route: 'PhaserLab' },
        ],
      },
      {
        name: 'Saturation',
        labs: [{ name: 'Distortion', blurb: 'Harmonics, clipping, saturation, aliasing.', route: 'DistortionLab' }],
      },
      {
        name: 'Phase',
        labs: [{ name: 'Phase', blurb: 'Polarity vs phase, correlation, mono compatibility.', route: 'PhaseLab' }],
      },
    ],
  },
  {
    id: 'synthesis',
    glyph: '∿',
    name: 'Signal Generation & Synthesis',
    description: 'Create and shape sound from scratch — oscillators, noise, synthesis, and imaging.',
    kind: 'list',
    labs: [
      { name: 'Oscillators', blurb: 'Sine/square/saw, FM, AM, band-limiting.', route: 'OscillatorLab' },
      { name: 'Noise', blurb: 'White → violet colors, floor, SNR, masking.', route: 'NoiseLab' },
      { name: 'Harmonics', blurb: 'Additive synthesis, spectrum, Fourier.', route: 'HarmonicLab' },
      { name: 'FM Synthesis', blurb: 'Carrier + modulator: ratio, index, and sidebands.', route: 'FmLab' },
      { name: 'Modular Synth', blurb: 'VCO · VCF · VCA · LFO · envelope · sequencer — signal flow and patching.', route: 'ModularLab' },
      { name: 'Stereo Imaging', blurb: 'Pan, width, Mid/Side, mono-fold.', route: 'StereoLab' },
      { name: 'Harmonograph', blurb: 'Frequency ratios ↔ musical intervals.', route: 'HarmonographLab' },
    ],
  },
  {
    id: 'wave',
    glyph: '◎',
    name: 'Wave Physics Laboratory',
    description: 'Interactive acoustic simulations — reflection, interference, coverage, and room behavior.',
    kind: 'hub',
    route: 'WaveLab',
    count: WAVE_MODULES.length,
    hubBlurb: 'One Room Builder engine, many experiments: reflection, absorption, diffusion, standing waves, arrays, delay alignment.',
  },
  {
    id: 'micspeaker',
    glyph: '🎙',
    name: 'Microphones & Loudspeakers',
    description: 'How microphones capture sound and loudspeakers deliver it.',
    kind: 'list',
    families: [
      {
        name: 'Microphones',
        labs: [{ name: 'Microphone Principles', blurb: 'Pickup patterns, proximity, off-axis, plosives, stereo pairs — and what cupping the mic really does.', route: 'MicLab' }],
      },
      {
        name: 'Loudspeakers',
        labs: [{ name: 'Speaker Placement & Coverage', blurb: 'Dispersion, aim, height and tilt — who stands in the beam, drawn as a live coverage map.', route: 'SpeakerLab' }],
      },
    ],
  },
  {
    id: 'digital',
    glyph: '⛁',
    name: 'Digital Audio Systems',
    description: 'How analog sound becomes numbers — and numbers become sound again.',
    kind: 'hub',
    route: 'DigitalLab',
    count: DIGITAL_MODULES.length,
    hubBlurb: 'Sampling, Nyquist, aliasing, bit depth, quantization, dither, binary audio, A/D and D/A conversion, reconstruction.',
  },
  {
    id: 'analysis',
    glyph: '📊',
    name: 'Visual Audio Analysis',
    description: 'Read every professional analysis display, from waveform to waterfall.',
    kind: 'hub',
    route: 'MeterLab',
    count: METER_MODULES.length,
    hubBlurb: 'Waveform, spectrum, spectrogram, waterfall, phase scope, correlation, LUFS, peak, RMS, VU — plus the Signal Detective.',
  },
  {
    id: 'calculators',
    glyph: '🖩',
    name: 'Audio Calculator Laboratory',
    description: 'Professional audio math — with the reasoning, not just the result.',
    kind: 'hub',
    route: 'CalcLab',
    count: WORKSPACES.length,
    countLabel: (n) => `${n} Calculators`,
    hubBlurb: 'SPL, dB, speaker power, delay, wavelength, room modes, cable loss, Ohm’s law, digital audio, coverage — chained.',
  },
  {
    id: 'interactive',
    glyph: '⛓',
    name: 'Interactive Systems',
    description: 'Combine many concepts into larger, hands-on simulations.',
    kind: 'list',
    labs: [
      { name: 'Signal Chain Builder', blurb: 'Generator → EQ → Comp → Gate → FX → Reverb → Limiter → Output.', route: 'SignalChainLab' },
      { name: 'Signal Detective', blurb: 'Identify the meter, read the display, spot the problem, prescribe the fix.', route: 'MeterModule', params: { id: 'detective' } },
    ],
  },
  {
    id: 'applied',
    glyph: '🎸',
    name: 'Applied Audio Labs',
    description: 'Audio concepts through real instruments and studio tools.',
    kind: 'list',
    labs: [
      { name: 'Bass Guitar Physics', blurb: 'String division, wavelength, harmonics, fret fractions ↔ intervals.', route: 'BassLab' },
      { name: 'Autotune', blurb: 'Pitch correction on the cents grid — amount, retune speed.', route: 'AutotuneLab' },
      { name: 'Binaural Panner', blurb: 'Move sound objects around your head — binaural headphone mix.', route: 'BinauralLab' },
    ],
  },
  {
    id: 'electronics',
    glyph: '⚡',
    name: 'Audio Electronics',
    description: 'Inside the analog gear — how circuits amplify and shape signals.',
    kind: 'list',
    labs: [
      { name: 'Vacuum Tube Fundamentals', blurb: 'How a tube amplifies by controlling electron flow — with an Electron View that shows the invisible.', route: 'TubeLab' },
    ],
  },
];

/** Computed leaf-lab count for a category (never hard-coded). */
export function categoryCount(cat: LabCategory): number {
  if (cat.kind === 'hub') return cat.count;
  const fromFamilies = (cat.families ?? []).reduce((n, f) => n + f.labs.length, 0);
  return fromFamilies + (cat.labs?.length ?? 0);
}

/** The card's count label, e.g. "16 Labs" / "25 Calculators". */
export function categoryCountLabel(cat: LabCategory): string {
  const n = categoryCount(cat);
  return (cat.countLabel ?? labsPlural)(n);
}

/** All leaves in a 'list' category, flattened (families then loose labs). */
export function categoryLeaves(cat: LabCategory): LabLeaf[] {
  if (cat.kind === 'hub') return [];
  return [...(cat.families ?? []).flatMap((f) => f.labs), ...(cat.labs ?? [])];
}

export function getCategory(id: string): LabCategory | undefined {
  return LAB_CATEGORIES.find((c) => c.id === id);
}

/** Grand total across everything (for the landing subtitle). */
export function totalLabCount(): number {
  return LAB_CATEGORIES.reduce((n, c) => n + categoryCount(c), 0);
}
