/**
 * earPrograms — REAL program sources for the EQ Recognition and Band ID drills
 * (2026-10-01; spec M2 "V2 = real stems, marked").
 *
 * The synthesized surrogate (pink noise / harmonic complex) stays the DEFAULT
 * and the offline fallback. A learner may pick a recorded source instead; it
 * is fetched from the lab-audio bucket (public `demo_signals` assets, verified
 * published in lab_audio_assets), decoded and resampled in JS. If it is not
 * ready — loading, offline, any error — the trial is drawn from the synth,
 * silently, with one honest line under the chips. A trial is never blocked.
 *
 * Grading is untouched: the module applies the SAME EQ move / band logic and
 * the same self-verification to the recording that it applies to the synth,
 * and present() level-matches it to the same −20 dBFS RMS target.
 *
 * Pure (no React / native) — tested in Node.
 */
import { toMono } from '../audio/resample';
import type { EarProgram } from './earTypes';

export type EarSourceId = 'synth' | 'piano' | 'guitar';

export type EarSource = {
  id: EarSourceId;
  /** Chip label. */
  label: string;
  /** What the note calls it. */
  name: string;
  labKey?: string;
  assetKey?: string;
};

export const EAR_SOURCES: readonly EarSource[] = [
  { id: 'synth', label: 'Synth', name: 'synthesized source' },
  { id: 'piano', label: 'Piano', name: 'piano chord', labKey: 'demo_signals', assetKey: 'piano-chord-1' },
  { id: 'guitar', label: 'Guitar', name: 'acoustic guitar chord', labKey: 'demo_signals', assetKey: 'acoustic-guitar-a-chord' },
];

export function earSourceById(id: EarSourceId): EarSource {
  return EAR_SOURCES.find((s) => s.id === id) ?? EAR_SOURCES[0];
}

/** The clip loader's state, as the screen sees it (useLabClipBuffer). */
export type ClipState = {
  status: 'idle' | 'loading' | 'ready' | 'error';
  buffer: { channels: readonly Float32Array[]; sampleRate: number } | null;
};

/** Fold a decoded 48 kHz clip into the module's program form (mono). */
export function programFromClip(name: string, buffer: { channels: readonly Float32Array[]; sampleRate: number }): EarProgram | null {
  if (buffer.sampleRate !== 48000 || buffer.channels.length === 0) return null;
  const mono = toMono(buffer.channels);
  // Under half a second of audio cannot carry a 1.6 s trial honestly.
  if (mono.length < 24000) return null;
  return { name, mono };
}

/**
 * Which program the next trial draws from, plus the one-line note for the
 * chips. `program` undefined = the synth (the default and the fallback).
 */
export function resolveEarSource(
  source: EarSource,
  clip: ClipState,
  program: EarProgram | null,
): { program: EarProgram | undefined; note: string | null } {
  if (source.id === 'synth') return { program: undefined, note: null };
  if (clip.status === 'ready' && program) return { program, note: null };
  if (clip.status === 'error' || (clip.status === 'ready' && !program)) {
    // NEW COPY
    return {
      program: undefined,
      note: `Couldn’t load the ${source.name} recording (offline?) — trials use the synthesized source. Tap ${source.label} to try again.`,
    };
  }
  // NEW COPY
  return { program: undefined, note: `Loading the ${source.name} recording — synthesized source until it’s ready.` };
}
