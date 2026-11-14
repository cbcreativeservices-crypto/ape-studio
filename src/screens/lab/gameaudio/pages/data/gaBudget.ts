/**
 * gaBudget — what page 17 ("Budgets and voice limits") needs beside the
 * model: the BUDGET lane's stops, the memory arithmetic the page shows, how
 * many protected voices are sounding (the budget cannot be set below that
 * number), and what the last BURST cost, read from the model's own log.
 * Pure TypeScript (test/gameAudioChD.test.ts).
 *
 * MEMORY. A decoded sound is its samples, each kept as a 32-bit number
 * (4 bytes), for every channel: samples × 4 × channels. That is the only
 * cost this page prints, because it is exact. It prints no processing
 * figure: the lab does not measure one.
 */
import type { GaLogEntry, GaLogKind, GaState } from '../../model/gaModel.ts';

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
/** The lane's value, beside the lane's own name BUDGET: "8 VOICES",
 *  "1 VOICE", "NO LIMIT" (so a screen reader says "BUDGET: 8 VOICES", not
 *  the name twice). */
export const budgetWords = (limit: number): string => (limit ? `${limit} ${limit === 1 ? 'VOICE' : 'VOICES'}` : 'NO LIMIT');

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
  `${r.label}: ${r.seconds} ${r.seconds === 1 ? 'second' : 'seconds'} at ${fmtInt(r.sr)} samples per second, ${r.channels === 1 ? 'one channel' : `${r.channels} channels`}, ${fmtInt(r.bytes)} bytes when decoded.`;

/* ── the floor under the budget ─────────────────────────────────────────── */

/** Protected voices sounding now. The model keeps the budget at or above
 *  this number: a protected voice is never taken, so a smaller budget could
 *  not be kept. */
export const protectedSounding = (s: GaState): number => s.voices.filter((v) => v.protected && v.state !== 'virtual').length;
/** Would the model refuse to go this low right now? */
export const budgetHeld = (s: GaState, limit: number): boolean => limit !== 0 && limit < protectedSounding(s);

/** The BUDGET lane's line (bug test GA2 B-05, 2026-11-13: at the protected
 *  floor ‹ FEWER did nothing and nothing on screen said why). `lane` is the
 *  stop the lane shows, `limit` the model's budget, `asked` the budget the
 *  learner asked for last, `guarded` the protected voices sounding. When the
 *  learner asked for less than the budget and the protected voices hold it
 *  up, the line says so; the model's own BUDGET line in the log says it in
 *  full. */
export function budgetLaneWords(lane: number, limit: number, asked: number | null, guarded: number): string {
  const words = budgetWords(lane);
  const heldUp = lane === limit && limit !== 0 && asked != null && asked !== 0 && asked < limit && guarded >= limit;
  return heldUp ? `${words} · HELD: ${guarded} PROTECTED` : words;
}

/** The kinds of log line page 17 shows: what was taken (STOP), refused, the
 *  loops' state, and MIX, which carries the model's BUDGET lines (among them
 *  "BUDGET: 1 asked, but 2 protected voices are sounding…", GA2 B-05). */
export const P17_LOG_KINDS: readonly GaLogKind[] = ['stop', 'refused', 'state', 'mix'];

/* ── what the last burst cost ───────────────────────────────────────────── */

/** How many crate impacts one press of BURST posts. */
export const BURST_COUNT = 12;

/** One voice the budget took for a new sound: whose it was, and what became
 *  of it (a loop goes virtual and waits; a one-shot stops). `times` counts a
 *  run of the same name one after another ("Crate impact" four times). */
export type BurstTheft = { name: string; loop: boolean; times: number };
export type BurstReport = {
  /** In the order the voices were taken: the least important first. */
  thefts: BurstTheft[];
  /** Voices taken, and new sounds refused, since that BURST. */
  stolen: number;
  refused: number;
};

const STOLEN_LINE = /^Voice STOLEN from (.+?) \(i\d+\)/;

/** What happened since the newest BURST, read from the log lines the model
 *  wrote (one STOP line per theft, one REFUSED line per refusal). null until
 *  a burst is in the log. The test holds this against the reducer, so a
 *  reworded log line cannot empty the card unnoticed. */
export function lastBurst(log: readonly GaLogEntry[]): BurstReport | null {
  let at = -1;
  for (let i = log.length - 1; i >= 0; i--) {
    if (log[i].kind === 'trigger' && log[i].text.startsWith('BURST:')) {
      at = i;
      break;
    }
  }
  if (at < 0) return null;
  const thefts: BurstTheft[] = [];
  let stolen = 0;
  let refused = 0;
  for (const l of log.slice(at + 1)) {
    if (l.kind === 'refused') refused += 1;
    if (l.kind !== 'stop') continue;
    const m = STOLEN_LINE.exec(l.text);
    if (!m) continue;
    stolen += 1;
    const loop = l.text.includes('It is a loop');
    const last = thefts[thefts.length - 1];
    if (last && last.name === m[1] && last.loop === loop) last.times += 1;
    else thefts.push({ name: m[1], loop, times: 1 });
  }
  return { thefts, stolen, refused };
}

/** One row of the card: "Room tone · a loop: virtual now" /
 *  "Crate impact × 4 · a one-shot: stopped". */
export const burstTheftWords = (t: BurstTheft): string => `${t.name}${t.times > 1 ? ` × ${t.times}` : ''} · ${t.loop ? 'a loop: it went virtual' : t.times > 1 ? 'one-shots: they stopped' : 'a one-shot: it stopped'}`;

/** The card in one spoken sentence. */
export function burstSpoken(r: BurstReport | null): string {
  if (!r) return 'No burst yet. Press BURST.';
  const taken = r.thefts.length ? `Voices taken, in order: ${r.thefts.map(burstTheftWords).join('; ')}.` : 'No voice was taken.';
  return `${taken} ${r.refused} new ${r.refused === 1 ? 'sound was' : 'sounds were'} refused.`;
}
