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
export type LabRoute = 'HarmonicLab';

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

const READY: Record<string, LearningProfile> = Object.fromEntries(
  READY_TERMS_HARMONIC.map((t) => [normTerm(t), { lab: 'harmonic', actions: LAUNCH_HARMONIC } as LearningProfile]),
);

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
