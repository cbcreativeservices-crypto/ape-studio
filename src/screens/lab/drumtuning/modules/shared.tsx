/**
 * Shared chapter contract + the honesty badges every stage prints + the
 * strike/tap hooks every HEAR page uses.
 */
import { useMemo } from 'react';
import type { TuningNote } from '../drumContent';
import { DRUMS, fundamentalHz, meanTension, renderStrike, renderTap, tensionForHz, type DrumKind, type HeadState, type StrikeParams } from '../drumEngine';
import type { SoundSync } from '../stagesDrum';
import { useDrumPlayback, type DrumPlayback } from '../useDrumPlayback';

/** What became of a SAVE: on the disk, kept for this session only (a guest
 *  or a preview), or a write that failed. */
export type NoteSaveResult = 'saved' | 'session' | 'failed';

export type ChapterProps = {
  /** A scenario reached its right answer; `correct` = the FIRST pick was
   *  right — the host records it. */
  onAnswered: (scenarioId: string, correct: boolean) => void;
  /** This chapter's recorded answers (scenario id → first pick right), for
   *  the REVIEW page's "your run". */
  answers: Readonly<Record<string, boolean>>;
  /** The chapter's interactive reached its goal — the host records it. */
  onInteractive: () => void;
  /** Chapter 6 only: the tuning notes (host-owned, guest rule applied). */
  notes: readonly TuningNote[];
  onSaveNote: (note: TuningNote) => Promise<NoteSaveResult>;
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
  return fundamentalHz(spec.diameterIn, meanTension(h), which === 'batter' ? spec.sigmaBatter : spec.sigmaReso);
}

/** What a stage needs to move in sync with a playback. */
export const syncOf = (pb: DrumPlayback): SoundSync => ({ progress: pb.progress, playing: pb.playing, envDb: pb.rendered?.envDb ?? null });

export const fmtS = (s: number | null | undefined): string => (s == null || !Number.isFinite(s) ? '—' : `${s.toFixed(2)} s`);
export const fmtCents = (c: number | null | undefined): string => (c == null || !Number.isFinite(c) ? '—' : `${c >= 0 ? '+' : ''}${c.toFixed(0)} ¢`);
/** A turn as a tech says it: "+⅛ turn", "−¼ turn", "0". */
export function fmtTurn(t: number): string {
  const a = Math.abs(t);
  if (a < 1 / 32) return 'no turn';
  const sixteenths = Math.round(a * 16);
  const whole = Math.floor(sixteenths / 16);
  const frac = sixteenths % 16;
  const fracWord = frac === 0 ? '' : frac === 8 ? '½' : frac === 4 ? '¼' : frac === 12 ? '¾' : frac === 2 ? '⅛' : frac === 6 ? '⅜' : frac === 10 ? '⅝' : frac === 14 ? '⅞' : `${frac}/16`;
  const body = whole ? `${whole}${fracWord ? ' ' + fracWord : ''}` : fracWord;
  return `${t > 0 ? '+' : '−'}${body} turn`;
}
/** Words a drummer uses for a tension fader position (0..1 of the range). */
export function tensionWord(frac: number): string {
  return frac < 0.15 ? 'very low' : frac < 0.35 ? 'low' : frac < 0.6 ? 'medium' : frac < 0.85 ? 'high' : 'very high';
}
