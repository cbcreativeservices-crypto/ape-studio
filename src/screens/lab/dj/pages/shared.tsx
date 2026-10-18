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
import { useBoothAudio, type BoothAudio } from '../booth/useBoothAudio';
import { transportOf, type Transport } from '../dock';
import type { BoothRender, Stage, Tap } from '../engine/djRender';
import type { Booth } from '../model/djModel';
import type { BoothMotion } from '../art/motion';

export type BoothKit = { booth: Booth; audio: BoothAudio; tr: Transport; motion: BoothMotion };

export function useBoothKit(): BoothKit {
  const booth = useBooth();
  const audio = useBoothAudio();
  const tr = useMemo(() => transportOf(audio), [audio]);
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

/** "−6.2" / "OVER +1.4" / "—" for a peak readout, tinted on the ramp. */
export function peakCell(k: string, db: number | null): BezelItem {
  if (db == null || db === -Infinity) return { k, v: '—', tint: colors.textSub };
  if (db >= 0) return { k, v: `OVER +${db.toFixed(1)}`, tint: PEAK_RED };
  return { k, v: `${db.toFixed(1)} dBFS`, tint: levelColorForDb(db, -40, 0) };
}

/** The sound status in a word, for the bezel. */
export function soundCell(a: BoothAudio): BezelItem {
  const v = a.status === 'playing' ? 'SOUND ON' : a.status === 'silent' ? 'SOUND OFF' : a.status === 'rendering' ? 'STARTING' : a.status === 'failed' ? 'NO AUDIO' : 'STOPPED';
  return { k: 'BOOTH', v, tint: a.status === 'playing' ? colors.green : a.status === 'failed' ? PEAK_RED : colors.textSub };
}
