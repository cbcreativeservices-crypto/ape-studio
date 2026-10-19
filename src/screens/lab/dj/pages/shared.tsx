/**
 * Shared page plumbing for the DJ Systems Lab screens: one booth hook (the
 * store + the sound/clock engine + the transport), chunk-level readings from
 * the latest render, and bezel cells coloured by the house ramp.
 */
import { useMemo } from 'react';
import { colors } from '../../../../theme/tokens';
import { levelColorForDb } from '../../../../features/tools/levelColor';
import type { BezelItem } from '../../rack/rackTypes';
import { useBooth } from '../booth/boothStore';
import { useBoothAudio, type BoothAudio, type BoothAudioOpts } from '../booth/useBoothAudio';
import { transportOf, type Transport } from '../dock';
import type { BoothRender, Stage, Tap } from '../engine/djRender';
import type { Booth } from '../model/djModel';
import type { BoothMotion } from '../art/motion';

export type BoothKit = { booth: Booth; audio: BoothAudio; tr: Transport; motion: BoothMotion };

/** `lockPhase`: decks start in phase with each other (the pre-matched blend
 *  screens 6, 8 and 9). */
export function useBoothKit(opts?: { lockPhase?: boolean; audio?: BoothAudioOpts }): BoothKit {
  const booth = useBooth();
  // ADDITIVE (Stage 2b): an event screen renders through engine/djEventRender
  const audio = useBoothAudio(opts?.audio);
  const lockPhase = !!opts?.lockPhase;
  const tr = useMemo(() => transportOf(audio, { lockPhase }), [audio, lockPhase]);
  const motion = useMemo(() => ({ clock: audio.clock, meters: audio.meters }), [audio.clock, audio.meters]);
  return { booth, audio, tr, motion };
}

/** The loudest raw block (dBFS, before any clip) of a tap in a render. */
export function peakDb(r: BoothRender | null, tap: Tap): number | null {
  if (!r) return null;
  let m = -120;
  for (const v of r.raw[tap]) if (v > m) m = v;
  return m <= -59.9 ? -Infinity : m;
}

export const anyClip = (r: BoothRender | null, stages?: readonly Stage[]): boolean =>
  !!r && (stages ?? (Object.keys(r.clipped) as Stage[])).some((s) => r.clipped[s] > 0);

export const PEAK_RED = '#ff5a48';

/** "−6.2 dBFS" / "CLIP" / "—" for a peak readout, tinted on the ramp. A
 *  real meter cannot read above full scale, so a level at or over 0 dBFS
 *  reads CLIP (audio review 2026-10-18 #30). */
export function peakCell(k: string, db: number | null): BezelItem {
  if (db == null || db === -Infinity) return { k, v: '—', tint: colors.textSub };
  if (db >= 0) return { k, v: 'CLIP', tint: PEAK_RED };
  return { k, v: `${db.toFixed(1)} dBFS`, tint: levelColorForDb(db, -40, 0) };
}

/** A peak readout for a narrow cell: the number on the value line, the
 *  unit under it, so the cell keeps its word (D36). */
export function peakShort(k: string, db: number | null, flex?: number): BezelItem {
  if (db == null || db === -Infinity) return { k, v: '—', tint: colors.textSub, flex };
  if (db >= 0) return { k, v: 'CLIP', tint: PEAK_RED, flex };
  return { k, v: db.toFixed(1), vA11y: `${db.toFixed(1)} dBFS`, sub: /PEAK/.test(k) ? 'dBFS' : 'dBFS PEAK', tint: levelColorForDb(db, -40, 0), flex };
}

/** The sound status in a word, for the bezel. */
export function soundCell(a: BoothAudio): BezelItem {
  const v = a.status === 'playing' ? 'SOUND ON' : a.status === 'silent' ? 'SOUND OFF' : a.status === 'rendering' ? 'STARTING' : a.status === 'failed' ? 'NO AUDIO' : 'STOPPED';
  return { k: 'BOOTH', v, tint: a.status === 'playing' ? colors.green : a.status === 'failed' ? PEAK_RED : colors.textSub };
}
