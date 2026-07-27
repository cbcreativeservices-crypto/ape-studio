/**
 * Glossary Learning Profiles (v4 MASTER Pillar A §6) — the per-term gate for the
 * audio-lab action row (Hear It · Experiment · Watch It · Launch Lab).
 *
 * HONESTY RULE (owner directive 2026-07-26, an application of measurement-tools
 * §1.7): a term shows a lab action ONLY when that action is validated, linked,
 * and FUNCTIONAL today. Three buckets:
 *   1. READY      → returned by getLearningProfile; the row renders with ONLY
 *                   the actions that actually work for that term.
 *   2. PLANNED    → known to need a lab link later, NOT ready → never returned,
 *                   never shown (documentation of intent only).
 *   3. everything else → no profile, no row.
 *
 * Reality today: the only live lab is the Harmonic Lab, and only **Launch Lab**
 * (open the lab) is wired — per-term CONFIGURED deep-links for Hear/Experiment/
 * Watch are not built yet, so ready terms expose LAUNCH LAB ONLY. As those modes
 * (and other labs) ship, add the action/term here — never before.
 *
 * Client-config first (v4 A3): no schema/backend change; this graduates to a DB
 * column later.
 */
import type { LabId } from '../lab/guidedLessons';

/** A route to a LIVE lab screen (must be a registered RootStack route). Extend
 *  as labs ship. */
export type LabRoute =
  | 'HarmonicLab'
  | 'OscillatorLab'
  | 'NoiseLab'
  | 'HarmonographLab'
  | 'BassLab'
  | 'AutotuneLab'
  | 'FmLab'
  | 'BinauralLab'
  | 'ModularLab'
  | 'FoundationsCourse'
  | 'EqLab'
  | 'DelayLab'
  | 'ReverbLab'
  | 'ChorusLab'
  | 'FlangerLab'
  | 'PhaserLab'
  | 'CompressionLab'
  | 'GateLab'
  | 'LimiterLab'
  | 'DistortionLab'
  | 'PhaseLab'
  | 'StereoLab';

/** The four glossary actions (v4 MASTER §6.1). */
export type GlossaryActionKind = 'hear_it' | 'experiment' | 'watch_it' | 'launch_lab';

/** A single functional action for a term. */
export type GlossaryAction = { kind: GlossaryActionKind; route: LabRoute };

export type LearningProfile = {
  /** The live lab this term links into (labels / guided-lesson tie-in). */
  lab: LabId;
  /** FUNCTIONAL actions only. Never includes a planned-but-unwired action. */
  actions: GlossaryAction[];
};

/** Button labels (emoji + text) for each action kind. */
export const ACTION_LABELS: Record<GlossaryActionKind, string> = {
  hear_it: '▶  Hear It',
  experiment: '🧪  Experiment',
  watch_it: '📈  Watch It',
  launch_lab: '🚀  Launch Lab',
};

/** Normalize a term for matching (case/space-insensitive). */
export function normTerm(t: string): string {
  return t.trim().toLowerCase().replace(/\s+/g, ' ');
}

// ── BUCKET 1 · READY ─────────────────────────────────────────────────────────
// The Harmonic-family terms that exist in the glossary and are genuinely taught
// by the LIVE Harmonic Lab. Only Launch Lab is wired today → that is the only
// action listed. (When configured Hear/Experiment/Watch modes ship, add them
// here per term — and never before.)
const LAUNCH_HARMONIC: GlossaryAction[] = [{ kind: 'launch_lab', route: 'HarmonicLab' }];

const READY_TERMS_HARMONIC = [
  'Additive Synthesis', 'Fundamental', 'Fundamental frequency', 'Harmonic Distortion',
  'Harmonic Series', 'Harmonics', 'Overtones', 'Partials', 'Pulse Wave', 'Pulse Width',
  'Pulse Width Modulation', 'Sawtooth Wave', 'Sine wave', 'Square Wave', 'THD', 'Timbre',
  'Triangle Wave', 'Waveform',
];

// Oscillator / Noise / Harmonograph labs LIVE (2026-07-26): their DB-verified
// glossary terms go READY with Launch Lab (the wired action). Brown/Blue/Violet
// Noise, FM, AM, Lissajous etc. are NOT glossary terms today — nothing to link.
const launch = (route: LabRoute): GlossaryAction[] => [{ kind: 'launch_lab', route }];

const READY_TERMS_OSCILLATOR = ['Oscillator', 'Signal Generator'];
const READY_TERMS_NOISE = ['Noise', 'White Noise', 'Pink Noise'];
const READY_TERMS_HARMONOGRAPH = [
  'Interval', 'Octave', 'Unison', 'Consonance', 'Dissonance', 'Beat Frequency',
];
// Expansion labs LIVE (2026-07-26, wave 1). DB-verified terms only ('Node',
// 'Semitone', 'Autotune' etc. are NOT glossary terms today — nothing to link).
const READY_TERMS_BASS = ['Wavelength', 'Standing wave', 'Antinode', 'Resonance'];
const READY_TERMS_AUTOTUNE = ['Pitch Correction', 'Pitch', 'Cents'];
// Wave-2 expansion labs (2026-07-26). DB-verified 2026-07-26; 'Low-Pass Filter'
// stays with EqLab (READY is one-profile-per-term); HRTF links to Binaural
// because its lesson teaches exactly what an HRTF is (and that our model isn't
// one). 'Carrier'/'Modulator'/'Sideband'/'Binaural'/'ITD'/'ILD' not in DB.
const READY_TERMS_FM = ['FM Synthesis', 'Frequency modulation'];
const READY_TERMS_BINAURAL = ['Sound Localization', 'Spatial Audio', 'Head-related transfer function'];
const READY_TERMS_MODULAR = [
  'Synthesizer', 'Synthesis', 'Subtractive Synthesis', 'VCO', 'VCF', 'LFO', 'ADSR',
  'Envelope', 'Sequencer', 'Step Sequencer', 'cutoff frequency', 'Patch', 'Tremolo', 'Vibrato',
];
// Foundations of Sound (2026-07-26, course MVP = Modules 1–4). DB-verified;
// only what the MVP genuinely teaches TODAY — 'Frequency' and 'Loudness' wait
// for Modules 5 and 9 (honesty rule: link when taught, never before).
const READY_TERMS_FOUNDATIONS = ['Sound Wave', 'Rarefaction', 'Amplitude'];

// Effect labs LIVE (2026-07-26, the 12 FxLab screens over the v6 effects path).
// DB-verified terms only; each is genuinely taught by its lab's controls +
// hero visual + lesson. Threshold/Attack/Release map to Compression (the
// primary dynamics teacher). Notch/Knee etc. are lesson-only → NOT linked.
const READY_FX: [string[], LabId, LabRoute][] = [
  [['Graphic equalizer', 'Shelving EQ', 'High-Pass Filter', 'Low-Pass Filter', 'Q', 'Bandwidth'], 'eq', 'EqLab'],
  [['Delay', 'Echo', 'Feedback', 'Ping-Pong Delay'], 'delay', 'DelayLab'],
  [['RT60', 'Pre-Delay', 'Decay Time'], 'reverb', 'ReverbLab'],
  [['Chorus'], 'chorus', 'ChorusLab'],
  [['Flanging', 'Comb filter', 'Comb Filtering'], 'flanger', 'FlangerLab'],
  [['Phaser', 'All-pass filter'], 'phaser', 'PhaserLab'],
  [['Threshold', 'Ratio', 'Attack', 'Attack Time', 'Release', 'Release Time', 'Makeup Gain'], 'compression', 'CompressionLab'],
  [['Gate', 'Noise Gate', 'Downward expansion', 'Expander'], 'gate', 'GateLab'],
  [['Limiter', 'Limiting', 'Brickwall Limiter', 'Ceiling'], 'limiter', 'LimiterLab'],
  [['Distortion', 'Clipping', 'Saturation', 'Overdrive', 'Aliasing'], 'distortion', 'DistortionLab'],
  [['Phase', 'Phase cancellation', 'Phase shift', 'Mono compatibility', 'Correlation Meter', 'Mono'], 'phase', 'PhaseLab'],
  [['Stereo', 'Stereo Width', 'Pan'], 'stereo', 'StereoLab'],
];

const READY: Record<string, LearningProfile> = Object.fromEntries([
  ...READY_FX.flatMap(([terms, lab, route]) =>
    terms.map((t) => [normTerm(t), { lab, actions: launch(route) } as LearningProfile] as const),
  ),
  ...READY_TERMS_HARMONIC.map(
    (t) => [normTerm(t), { lab: 'harmonic', actions: LAUNCH_HARMONIC } as LearningProfile] as const,
  ),
  ...READY_TERMS_OSCILLATOR.map(
    (t) => [normTerm(t), { lab: 'oscillator', actions: launch('OscillatorLab') } as LearningProfile] as const,
  ),
  ...READY_TERMS_NOISE.map(
    (t) => [normTerm(t), { lab: 'noise', actions: launch('NoiseLab') } as LearningProfile] as const,
  ),
  ...READY_TERMS_HARMONOGRAPH.map(
    (t) => [normTerm(t), { lab: 'harmonograph', actions: launch('HarmonographLab') } as LearningProfile] as const,
  ),
  ...READY_TERMS_BASS.map(
    (t) => [normTerm(t), { lab: 'bass', actions: launch('BassLab') } as LearningProfile] as const,
  ),
  ...READY_TERMS_AUTOTUNE.map(
    (t) => [normTerm(t), { lab: 'autotune', actions: launch('AutotuneLab') } as LearningProfile] as const,
  ),
  ...READY_TERMS_FM.map(
    (t) => [normTerm(t), { lab: 'fm', actions: launch('FmLab') } as LearningProfile] as const,
  ),
  ...READY_TERMS_BINAURAL.map(
    (t) => [normTerm(t), { lab: 'binaural', actions: launch('BinauralLab') } as LearningProfile] as const,
  ),
  ...READY_TERMS_MODULAR.map(
    (t) => [normTerm(t), { lab: 'modular', actions: launch('ModularLab') } as LearningProfile] as const,
  ),
  ...READY_TERMS_FOUNDATIONS.map(
    (t) => [normTerm(t), { lab: 'foundations', actions: launch('FoundationsCourse') } as LearningProfile] as const,
  ),
]);

// ── BUCKET 2 · PLANNED, NOT READY ────────────────────────────────────────────
// Known to need a lab link once the target lab ships — NEVER returned by
// getLearningProfile and NEVER shown (honest-metrics: never advertise an unwired
// feature). Documentation of intent only; move a term into READY when its lab
// and link are live and functional. One flagship cluster per not-yet-live lab
// (fill in real glossary term strings as labs are built):
export const PLANNED_TERMS: readonly string[] = [
  // EQ:          'Equalizer', 'Parametric Equalizer', 'Q', 'Bandwidth', 'Notch Filter'
  // Delay:       'Delay', 'Slapback', 'Feedback', 'Ping-pong Delay'
  // Reverb:      'Reverb', 'RT60', 'Pre-delay', 'Early Reflections'
  // Compression: 'Compressor', 'Threshold', 'Ratio', 'Attack', 'Release', 'Makeup Gain'
  // Distortion:  'Distortion', 'Saturation', 'Clipping', 'Aliasing'
  // Noise:       'White Noise', 'Pink Noise', 'Noise Floor', 'SNR'
  // Phase:       'Phase', 'Polarity', 'Comb Filtering', 'Correlation'
  // Stereo:      'Panning', 'Stereo Width', 'Mid/Side', 'Mono Compatibility'
  // Harmonograph:'Interval', 'Octave', 'Perfect Fifth', 'Lissajous', 'Consonance'
];

/** The learning profile for a term, or null when the term is NOT ready (buckets
 *  2 and 3). Never returns a profile with zero functional actions — so callers
 *  can treat null / empty identically as "no row". */
export function getLearningProfile(term?: string | null): LearningProfile | null {
  if (!term) return null;
  const p = READY[normTerm(term)];
  return p && p.actions.length > 0 ? p : null;
}
