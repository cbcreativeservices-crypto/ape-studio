/**
 * Shared chapter contract + the honesty badges every stage prints + the
 * strike/tap hooks every HEAR page uses.
 */
import { useMemo } from 'react';
import type { TuningNote } from '../drumContent';
import { DRUMS, fundamentalHz, renderStrike, renderTap, tensionForHz, type DrumKind, type HeadState, type StrikeParams } from '../drumEngine';
import { useDrumPlayback, type DrumPlayback } from '../useDrumPlayback';

export type ChapterProps = {
  /** A scenario was answered (first pick) — the host records it. */
  onAnswered: (scenarioId: string, correct: boolean) => void;
  /** The chapter's interactive reached its goal — the host records it. */
  onInteractive: () => void;
  /** Chapter 6 only: the tuning notes (host-owned, guest rule applied). */
  notes: readonly TuningNote[];
  onSaveNote: (note: TuningNote) => void;
  onDeleteNote: (id: string) => void;
  /** A signed-out guest or a members-only preview: nothing is saved. */
  guest: boolean;
  preview: boolean;
};

/** Stages that draw a MODEL (a diagram, the drum, the partial list). */
export const MODEL_BADGE = 'MODEL · illustration, not a measurement';
/** Stages that draw the rendered hit: real offline synthesis of the model
 *  (membrane modes, coupled heads, bend, damping), measured from the
 *  buffer, heard through an uncalibrated phone output. */
export const RENDER_BADGE = 'SYNTHESIZED · additive membrane model rendered offline, envelope and T60 measured from the buffer, uncalibrated output';
export const VIB_BADGE = 'MODEL · the mode shape the sound was built from (Bessel J_n · cos nθ), strobed; fades with the measured envelope';

/** One strike, rendered offline whenever its parameters change. */
export function useStrike(p: StrikeParams, draw = true): DrumPlayback {
  const key = useMemo(() => JSON.stringify(p), [p]);
  return useDrumPlayback(key, () => renderStrike(p), draw);
}

/** One lug tap, rendered on ▶. */
export function useTap(head: HeadState, lug: number, drum: DrumKind, which: 'batter' | 'reso' = 'batter'): DrumPlayback {
  const key = useMemo(() => `tap:${drum}:${which}:${lug}:${JSON.stringify(head)}`, [head, lug, drum, which]);
  return useDrumPlayback(key, () => renderTap(head, lug, drum, which), false);
}

/** A head at a wanted (0,1) pitch, even. */
export function headAtHz(drum: DrumKind, hz: number, which: 'batter' | 'reso'): HeadState {
  const spec = DRUMS[drum];
  const sigma = which === 'batter' ? spec.sigmaBatter : spec.sigmaReso;
  return { tension: tensionForHz(spec.diameterIn, hz, sigma), turns: new Array(spec.lugs).fill(0) };
}

/** The (0,1) pitch of a head, from its mean tension. */
export function headHz(drum: DrumKind, h: HeadState, which: 'batter' | 'reso'): number {
  const spec = DRUMS[drum];
  const t = h.turns.reduce((a, b) => a + b, 0) / h.turns.length;
  return fundamentalHz(spec.diameterIn, h.tension * (1 + 0.25 * t), which === 'batter' ? spec.sigmaBatter : spec.sigmaReso);
}

export const fmtS = (s: number | null | undefined): string => (s == null || !Number.isFinite(s) ? '—' : `${s.toFixed(2)} s`);
export const fmtCents = (c: number | null | undefined): string => (c == null || !Number.isFinite(c) ? '—' : `${c >= 0 ? '+' : ''}${c.toFixed(0)} ¢`);
export const fmtTurn = (t: number): string => `${t >= 0 ? '+' : '−'}${Math.abs(t).toFixed(2)} turn`;
