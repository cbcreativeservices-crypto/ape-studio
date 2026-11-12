/**
 * gaBudget — what page 17 ("Budgets and voice limits") needs beside the
 * model: the BUDGET lane's stops, the memory arithmetic the page shows, and
 * how many protected voices are sounding (the budget cannot be set below
 * that number). Pure TypeScript (test/gameAudioChD.test.ts).
 *
 * MEMORY. A decoded sound is its samples, each kept as a 32-bit number
 * (4 bytes), for every channel: samples × 4 × channels. That is the only
 * cost this page prints, because it is exact. It prints no processing
 * figure: the lab does not measure one.
 */
import type { GaState } from '../../model/gaModel.ts';

/* ── the BUDGET lane ────────────────────────────────────────────────────── */

/** The voice limits the lane stops at, tightest first. 0 = no limit. */
export const BUDGET_STOPS = [1, 2, 4, 8, 12, 16, 0] as const;
const LAST = BUDGET_STOPS.length - 1;

const stopIndex = (limit: number): number => {
  if (!limit) return LAST;
  const i = BUDGET_STOPS.findIndex((n) => n !== 0 && n >= limit);
  return i < 0 ? LAST - 1 : i;
};

export const laneToBudget = (v: number): number => BUDGET_STOPS[Math.max(0, Math.min(LAST, Math.round(v * LAST)))];
export const budgetToLane = (limit: number): number => stopIndex(limit) / LAST;
/** The stop one step tighter (−1) or looser (+1); the ends hold. */
export const budgetStep = (limit: number, dir: -1 | 1): number => BUDGET_STOPS[Math.max(0, Math.min(LAST, stopIndex(limit) + dir))];

export const budgetShort = (limit: number): string => (limit ? String(limit) : 'NONE');
export const budgetWords = (limit: number): string => (limit ? `BUDGET ${limit} ${limit === 1 ? 'VOICE' : 'VOICES'}` : 'BUDGET: NO LIMIT');

/* ── memory ─────────────────────────────────────────────────────────────── */

export const BYTES_PER_SAMPLE = 4;
export const decodedBytes = (samples: number, channels: number): number => samples * BYTES_PER_SAMPLE * channels;

/** 192000 → "192,000" (the same on every device). */
export const fmtInt = (n: number): string => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ',');

export type MemorySound = { sr: number; ch: readonly { length: number }[] };
export type MemoryRow = {
  id: string;
  label: string;
  file: string;
  seconds: number;
  sr: number;
  samples: number;
  channels: number;
  bytes: number;
  /** "48,000 samples × 4 bytes × 1 channel = 192,000 bytes" */
  sum: string;
};

/** The three sounds the MEMORY card shows: a short one-shot, a one-second
 *  loop, and a long two-channel bed. */
export const MEMORY_IDS = ['impact', 'alarm', 'amb_yard'] as const;

export function memoryRow(id: string, label: string, file: string, sound: MemorySound): MemoryRow {
  const samples = sound.ch[0]?.length ?? 0;
  const channels = sound.ch.length;
  const bytes = decodedBytes(samples, channels);
  return {
    id,
    label,
    file,
    seconds: sound.sr > 0 ? Math.round((samples / sound.sr) * 100) / 100 : 0,
    sr: sound.sr,
    samples,
    channels,
    bytes,
    sum: `${fmtInt(samples)} samples × ${BYTES_PER_SAMPLE} bytes × ${channels} ${channels === 1 ? 'channel' : 'channels'} = ${fmtInt(bytes)} bytes`,
  };
}

/** One row as a spoken sentence (the card's accessibility label). */
export const memoryRowSpoken = (r: MemoryRow): string =>
  `${r.label}: ${r.seconds} seconds at ${fmtInt(r.sr)} samples per second, ${r.channels === 1 ? 'one channel' : `${r.channels} channels`}, ${fmtInt(r.bytes)} bytes when decoded.`;

/* ── the floor under the budget ─────────────────────────────────────────── */

/** Protected voices sounding now. The model keeps the budget at or above
 *  this number: a protected voice is never taken, so a smaller budget could
 *  not be kept. */
export const protectedSounding = (s: GaState): number => s.voices.filter((v) => v.protected && v.state !== 'virtual').length;
/** Would the model refuse to go this low right now? */
export const budgetHeld = (s: GaState, limit: number): boolean => limit !== 0 && limit < protectedSounding(s);
