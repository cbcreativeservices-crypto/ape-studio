/**
 * Tuner timing bench (owner tuner phase 1, 2026-10-23; method from the tuner
 * research report). Feeds IDENTICAL synthetic pitch readings through the
 * Advanced Tuner's display logic BEFORE (200 ms average → near-centre needle
 * damping, digits every frame, IN TUNE on the averaged pitch) and AFTER (one
 * PITCH_TAU_MS filter, digits every DIGITS_EVERY_MS, IN TUNE on the last
 * CONFIRM_WINDOW_MS mean + spread), at the native cadence: one YIN estimate
 * per ~50 ms drain (20 readings/s).
 *
 * It measures the JS display path only. Microphone, OS buffering, the 75 ms
 * of audio YIN needs and screen presentation add delay on top — that part is
 * phase 2 (docs/APE_NEXT_BUILD_CHECKLIST.md) and needs a device.
 *
 *   node scripts/tunerBench.ts            → prints the tables
 *   test/tunerBench_20261023.test.ts      → asserts the improvements
 */
import {
  averageCents,
  CONFIRM_MS,
  confirmStats,
  centsBetween,
  dampCents,
  filterCents,
  INITIAL_LOCK,
  nearestTarget,
  PITCH_TAU_MS,
  pushConfirm,
  SPREAD_MAX_CENTS,
  stepDigits,
  stepLock,
  type ConfirmSample,
  type DigitsState,
  type LockState,
  type StringTarget,
} from '../src/features/tools/tuner/centerLock.ts';

export const FRAME_MS = 50; // native drain cadence (EngineHub "~50 ms")

/** Deterministic Gaussian noise (seeded) so every run is identical. */
function noise(seed: number): () => number {
  let s = seed >>> 0;
  const u = () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return (s + 0.5) / 4294967296;
  };
  return () => Math.sqrt(-2 * Math.log(u())) * Math.cos(2 * Math.PI * u());
}

type Out = { t: number; needle: number; digits: number | null; confirmed: boolean };
export type Pipeline = 'before' | 'after';

/** Run a reading sequence (cents per frame; null = no pitch) through a pipeline. */
export function run(kind: Pipeline, readings: (number | null)[], tauMs = PITCH_TAU_MS): Out[] {
  const out: Out[] = [];
  let avg: number | null = null;
  let needle = 0;
  let lock: LockState = INITIAL_LOCK;
  let win: ConfirmSample[] = [];
  let digits: DigitsState = { value: null, at: -1e9 };
  readings.forEach((raw, k) => {
    const t = k * FRAME_MS;
    if (kind === 'before') {
      avg = averageCents(avg, raw, FRAME_MS);
      if (avg != null) needle = dampCents(needle, avg, FRAME_MS);
      lock = stepLock(lock, avg, t);
      out.push({ t, needle, digits: avg, confirmed: lock.confirmed });
    } else {
      avg = filterCents(avg, raw, FRAME_MS, tauMs);
      if (avg != null) needle = avg;
      win = pushConfirm(win, raw, t);
      const st = confirmStats(win);
      lock = stepLock(lock, st ? st.mean : null, t, st != null && st.spread <= SPREAD_MAX_CENTS);
      digits = stepDigits(digits, avg, t);
      out.push({ t, needle, digits: digits.value, confirmed: lock.confirmed });
    }
  });
  return out;
}

const hold = (c: number, frames: number) => Array.from({ length: frames }, () => c);

/** Needle T50/T90 (ms) for a step from `from` cents to 0 (the player tunes it). */
export function stepResponse(kind: Pipeline, from: number, tauMs?: number): { t50: number; t90: number } {
  const pre = hold(from, 60); // 3 s settled at `from`
  const res = run(kind, [...pre, ...hold(0, 80)], tauMs).slice(pre.length);
  const t = (frac: number) => {
    const r = res.find((o) => Math.abs(o.needle) <= Math.abs(from) * (1 - frac));
    return r ? r.t - pre.length * FRAME_MS + FRAME_MS : Infinity;
  };
  return { t50: t(0.5), t90: t(0.9) };
}

/** Needle and digit steadiness on a steady tone with natural wobble (σ cents). */
export function steadiness(kind: Pipeline, sigma: number, tauMs?: number): { needleSd: number; digitChangesPerS: number } {
  const n = noise(7);
  const readings = Array.from({ length: 200 }, () => sigma * n()); // 10 s
  const res = run(kind, readings, tauMs).slice(20); // skip the first second
  const m = res.reduce((a, o) => a + o.needle, 0) / res.length;
  const sd = Math.sqrt(res.reduce((a, o) => a + (o.needle - m) ** 2, 0) / res.length);
  // A change the reader SEES: the printed value (1 decimal) differs.
  let changes = 0;
  for (let i = 1; i < res.length; i++) {
    const a = res[i - 1].digits, b = res[i].digits;
    if (a != null && b != null && a.toFixed(1) !== b.toFixed(1)) changes++;
  }
  return { needleSd: sd, digitChangesPerS: changes / ((res.length * FRAME_MS) / 1000) };
}

/** Time (ms) to IN TUNE on a tone `offset` cents off with wobble σ; Infinity = never in 5 s. */
export function timeToConfirm(kind: Pipeline, offset: number, sigma: number): number {
  const n = noise(11);
  const res = run(kind, Array.from({ length: 100 }, () => offset + sigma * n()));
  const r = res.find((o) => o.confirmed);
  return r ? r.t + FRAME_MS : Infinity;
}

/** Share of time IN TUNE is shown on a vibrato note (mean on target, ±depth at rateHz). */
export function vibratoGreen(kind: Pipeline, depth: number, rateHz: number): number {
  const res = run(kind, Array.from({ length: 200 }, (_, k) => depth * Math.sin(2 * Math.PI * rateHz * (k * FRAME_MS) / 1000)));
  return res.filter((o) => o.confirmed).length / res.length;
}

/** Green while silent (must be 0): a confirmed note, then the sound stops. */
export function greenAfterSilence(kind: Pipeline): number {
  const res = run(kind, [...hold(0, 40), ...hold(null as unknown as number, 20)]).slice(40);
  return res.filter((o) => o.confirmed).length;
}

/** Low B (5-string bass) heard on its 2nd partial: which string does AUTO pick? */
export function lowB(): { before: string; after: string; afterCents: number } {
  const bass5: StringTarget[] = ['B0', 'E1', 'A1', 'D2', 'G2'].map((note, i) => {
    const midi = ({ B0: 23, E1: 28, A1: 33, D2: 38, G2: 43 } as Record<string, number>)[note];
    return { index: i + 1, note, label: note, hz: 440 * Math.pow(2, (midi - 69) / 12), course: i } as StringTarget;
  });
  const heard = 2 * bass5[0].hz * Math.pow(2, 3 / 1200); // low B 3 ¢ sharp, heard on partial 2
  let best = 0;
  bass5.forEach((t, i) => {
    if (Math.abs(centsBetween(heard, t.hz)) < Math.abs(centsBetween(heard, bass5[best].hz))) best = i;
  });
  const after = nearestTarget(heard, bass5);
  return { before: bass5[best].note, after: bass5[after.i].note, afterCents: after.cents };
}

function fmt(ms: number): string {
  return Number.isFinite(ms) ? `${Math.round(ms)} ms` : 'never';
}

if (import.meta.url === `file:///${process.argv[1]?.replace(/\\/g, '/')}` || process.argv[1]?.endsWith('tunerBench.ts')) {
  const rows: string[] = [];
  rows.push('| Measure | Before | After (τ 80 ms) | τ 40 | τ 140 |', '|---|---|---|---|---|');
  for (const from of [5, 20, -20]) {
    const b = stepResponse('before', from), a = stepResponse('after', from), a40 = stepResponse('after', from, 40), a140 = stepResponse('after', from, 140);
    rows.push(`| Needle T50 · ${from > 0 ? '+' : ''}${from} ¢ step | ${fmt(b.t50)} | ${fmt(a.t50)} | ${fmt(a40.t50)} | ${fmt(a140.t50)} |`);
    rows.push(`| Needle T90 · ${from > 0 ? '+' : ''}${from} ¢ step | ${fmt(b.t90)} | ${fmt(a.t90)} | ${fmt(a40.t90)} | ${fmt(a140.t90)} |`);
  }
  for (const sigma of [1, 2.5]) {
    const b = steadiness('before', sigma), a = steadiness('after', sigma), a40 = steadiness('after', sigma, 40), a140 = steadiness('after', sigma, 140);
    rows.push(`| Needle wobble (SD) · string ±${sigma} ¢ | ${b.needleSd.toFixed(2)} ¢ | ${a.needleSd.toFixed(2)} ¢ | ${a40.needleSd.toFixed(2)} ¢ | ${a140.needleSd.toFixed(2)} ¢ |`);
    rows.push(`| Cents digits change · string ±${sigma} ¢ | ${b.digitChangesPerS.toFixed(1)} /s | ${a.digitChangesPerS.toFixed(1)} /s | ${a40.digitChangesPerS.toFixed(1)} /s | ${a140.digitChangesPerS.toFixed(1)} /s |`);
  }
  rows.push('', '| Confirmation | Before | After |', '|---|---|---|');
  rows.push(`| Time to IN TUNE · clean string (+0.5 ¢, ±1 ¢) | ${fmt(timeToConfirm('before', 0.5, 1))} | ${fmt(timeToConfirm('after', 0.5, 1))} |`);
  rows.push(`| Time to IN TUNE · lively string (+0.5 ¢, ±2.5 ¢) | ${fmt(timeToConfirm('before', 0.5, 2.5))} | ${fmt(timeToConfirm('after', 0.5, 2.5))} |`);
  rows.push(`| IN TUNE shown during vibrato ±8 ¢ at 5 Hz | ${(vibratoGreen('before', 8, 5) * 100).toFixed(0)} % of the time | ${(vibratoGreen('after', 8, 5) * 100).toFixed(0)} % |`);
  rows.push(`| IN TUNE frames after the sound stops | ${greenAfterSilence('before')} | ${greenAfterSilence('after')} |`);
  const lb = lowB();
  rows.push(`| 5-string low B heard on its 2nd partial → string chosen | ${lb.before} (wrong) | ${lb.after} (${lb.afterCents >= 0 ? '+' : ''}${lb.afterCents.toFixed(1)} ¢) |`);
  rows.push('', `Cadence ${FRAME_MS} ms (20 readings/s, native). CONFIRM_MS ${CONFIRM_MS} ms. JS display path only.`);
  console.log(rows.join('\n'));
}
