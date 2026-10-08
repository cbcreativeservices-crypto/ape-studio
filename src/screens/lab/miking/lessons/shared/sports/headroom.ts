/**
 * THE HEADROOM CHAIN — the whole signal chain, stage by stage (B13 L103–L106,
 * B14 L157–L172; shared by B13–B17). Built once by group 2 (lab7-g5). Pure;
 * tested.
 *
 *   capsule → adapter or transmitter input → receiver → preamp → converter
 *   → mix bus → output fader
 *
 * What it teaches (the lessons' own words): "A low output fader does not undo
 * upstream clipping"; check every stage, not only the last meter; set the
 * loudest safe rehearsal peak near −12 dBFS at the digital input and keep
 * more margin when the real event could be louder — a suggested starting
 * point, not a delivery standard; a high-pass filter cannot repair clipped
 * audio.
 *
 * THE EXAMPLE CHAIN (a simplified picture, said once on the page): levels are
 * in dB relative to one gentle handclap at the capsule. The events' sizes
 * (the loudest safe rehearsal peak +10 dB, a real-event surprise +16 dB) and
 * each stage's overload point are DRAWING DEFAULTS — `HEADROOM_DEFAULTS`,
 * listed as unknowns in each lesson, never a measurement of any equipment.
 * The one number printed is the converter's peak in dBFS, computed from the
 * learner's own gain settings through this example chain.
 */

export type StageId = 'capsule' | 'tx' | 'rx' | 'preamp' | 'adc' | 'bus';
export type EventId = 'clap' | 'loud' | 'event';
export type HeadroomStage = { id: StageId; label: string; short: string; blurb: string };

export const STAGES: readonly HeadroomStage[] = [
  { id: 'capsule', label: 'The capsule and its electronics', short: 'CAPSULE', blurb: 'The mic itself has a maximum level it can take. A pad AFTER it cannot cure overload here — where a pad sits matters.' },
  { id: 'tx', label: 'The adapter or transmitter input', short: 'TX IN', blurb: 'A wireless transmitter’s or an adapter’s input has its own gain and its own limit. It can clip while every meter after it looks fine.' },
  { id: 'rx', label: 'The receiver output', short: 'RX OUT', blurb: 'The receiver passes on whatever arrived — clipped or not. Turning its output down only hides an earlier clip.' },
  { id: 'preamp', label: 'The mic preamp', short: 'PREAMP', blurb: 'The input gain. Set it for the loudest event you expect, not the quietest.' },
  { id: 'adc', label: 'The converter (dBFS)', short: 'CONVERTER', blurb: 'The digital input: 0 dBFS is its ceiling. Nothing passes above it.' },
  { id: 'bus', label: 'The mix bus and output fader', short: 'BUS · FADER', blurb: 'Summing can make new peaks; the output fader only scales what already happened upstream.' },
];

export const EVENTS: Readonly<Record<EventId, { label: string; short: string; blurb: string }>> = {
  clap: { label: 'A gentle handclap', short: 'GENTLE', blurb: 'One quiet, repeatable clap at the target — an easy test, not the loudest moment.' },
  loud: { label: 'The loudest safe rehearsal peak', short: 'LOUDEST', blurb: 'The nearest and loudest credible event you can make safely: an excited nearby voice, a natural bat or glove transient at a safe distance. Never a hazardous peak made for testing.' },
  event: { label: 'A real-event surprise', short: 'EVENT', blurb: 'What the real match can do that a rehearsal cannot: a celebration, a whistle close by, a crowd peak.' },
};
export const EVENT_IDS: readonly EventId[] = ['clap', 'loud', 'event'];

/** DRAWING DEFAULTS (never a measurement): the events' sizes relative to the
 *  gentle clap at the capsule, each stage's overload point in the same units
 *  after the gains before it, and the controls' ranges and starting values.
 *  The starting chain is the common mistake: the GENTLE clap set to −12 dBFS
 *  and the transmitter input too hot. */
export const HEADROOM_DEFAULTS = {
  events: { clap: 0, loud: 10, event: 16 } as Readonly<Record<EventId, number>>,
  capsuleLimit: 40,
  txLimit: 0,
  rxLimit: 0,
  preampLimit: 8,
  adcLimit: 0,
  busLimit: 6,
  tx: { min: -30, max: 0, start: -6 },
  pre: { min: -20, max: 20, start: -6 },
  fader: { min: -30, max: 6, start: 0 },
} as const;

/** The suggested starting point for the loudest safe rehearsal peak at the
 *  converter (B13 L105, B14 L172 — a starting point, not a standard). */
export const TRIAL_DBFS = -12;
/** How near −12 dBFS counts as "near" in the exercise (the lab's tolerance). */
export const TRIAL_TOL = 2;

export type ChainSettings = { tx: number; pre: number; fader: number };
export const START_SETTINGS: ChainSettings = { tx: HEADROOM_DEFAULTS.tx.start, pre: HEADROOM_DEFAULTS.pre.start, fader: HEADROOM_DEFAULTS.fader.start };

export type StageReading = { id: StageId; level: number; limit: number; over: boolean; clippedBefore: boolean };
export type ChainReading = { stages: StageReading[]; firstOver: StageId | null; adcDbfs: number; busOut: number };

/**
 * One event through the chain. Each stage sees the level after the gains
 * before it; a stage over its limit clips there (the level passed on is its
 * limit), and every stage after it carries `clippedBefore` — however low its
 * own meter reads.
 */
export function readChain(s: ChainSettings, ev: EventId): ChainReading {
  const D = HEADROOM_DEFAULTS;
  const out: StageReading[] = [];
  let firstOver: StageId | null = null;
  let clipped = false;
  const at = (id: StageId, level: number, limit: number): number => {
    const over = level > limit + 1e-9;
    out.push({ id, level, limit, over, clippedBefore: clipped });
    if (over && !firstOver) firstOver = id;
    if (over) clipped = true;
    return Math.min(level, limit);
  };
  let l = D.events[ev];
  l = at('capsule', l, D.capsuleLimit);
  l = at('tx', l + s.tx, D.txLimit);
  l = at('rx', l, D.rxLimit);
  l = at('preamp', l + s.pre, D.preampLimit);
  const adc = at('adc', l, D.adcLimit);
  const bus = at('bus', adc, D.busLimit);
  return { stages: out, firstOver, adcDbfs: adc, busOut: bus + s.fader };
}

/** The exercise is done: the loudest safe rehearsal peak sits near −12 dBFS
 *  at the converter, and not one stage is over for ANY event — the real-event
 *  surprise included (the margin kept). */
export function chainGood(s: ChainSettings): boolean {
  const loud = readChain(s, 'loud');
  if (Math.abs(loud.adcDbfs - TRIAL_DBFS) > TRIAL_TOL) return false;
  return EVENT_IDS.every((e) => readChain(s, e).firstOver === null);
}

/** Plain words for a reading (the well's NOW line and the screen reader). */
export function chainWords(s: ChainSettings, ev: EventId): string {
  const r = readChain(s, ev);
  const first = r.firstOver ? STAGES.find((q) => q.id === r.firstOver)! : null;
  const meter = `the converter reads ${fmtDbfs(r.adcDbfs)}`;
  if (!first) return `${EVENTS[ev].label}: no stage is over; ${meter}.`;
  if (first.id === 'adc') return `${EVENTS[ev].label}: the converter is over its ceiling — clipped.`;
  return `${EVENTS[ev].label}: the first overloaded stage is ${first.label.toLowerCase()} — clipped there, although ${meter}.`;
}
export const fmtDbfs = (v: number): string => (Number.isFinite(v) ? `${v > 0 ? '+' : v < 0 ? '−' : ''}${Math.abs(Math.round(v))} dBFS` : '—');
export const fmtDb = (v: number): string => (Number.isFinite(v) ? `${v > 0 ? '+' : v < 0 ? '−' : ''}${Math.abs(Math.round(v))} dB` : '—');
