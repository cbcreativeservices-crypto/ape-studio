/**
 * trainingSignal — the ONE call every training-lab completion source makes
 * (owner 2026-10-13: training labs count toward certificates).
 *
 * `reportTrainingComplete(key)` with a key from trainingLabKeys.ts (anything
 * else is refused here). The lab stores and screens that call it (Miking's
 * progress store, the Mixing / Ear / Mastering / Drum / Tuning / Production /
 * Sound Systems screens) import only this and trainingLabKeys — never
 * labCompletion → supabase — so their node tests and bundles are unchanged.
 *
 * The sink is labCompletion.markTrainingDone (the same sent/unsent queue,
 * preview rule, guest carry and account wipe as every af_* lab), loaded on the
 * first report by a lazy require. labCompletion is in the app-start graph and
 * imports neither this module nor trainingLabKeys, so the graph is unchanged
 * (test/perfStartTrim_20261004). Where a require is impossible (node ESM
 * tests) a key waits here until a sink is installed with setTrainingSink.
 */
import { isTrainingKey } from './trainingLabKeys';

type Sink = (key: string) => void;

let sink: Sink | null = null;
const early = new Set<string>();

/** A training lab, Miking lesson, Mixing page or Ear module is complete on
 *  this device. Idempotent — the sink records each key once. */
export function reportTrainingComplete(key: string): void {
  if (!key || !isTrainingKey(key)) return;
  if (!sink) loadSink();
  if (sink) sink(key);
  else early.add(key);
}

function loadSink(): void {
  try {
    if (typeof require !== 'function') return;
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const m = require('./labCompletion') as typeof import('./labCompletion');
    setTrainingSink(m.markTrainingDone);
  } catch {
    // not loadable here — the key waits in `early`
  }
}

/** Install the sink (the app does it on the first report; tests directly).
 *  Replays anything reported before. */
export function setTrainingSink(fn: Sink): void {
  sink = fn;
  const waiting = [...early];
  early.clear();
  for (const k of waiting) fn(k);
}

/** Tests: what is waiting for a sink. */
export function __pendingTrainingReports(): string[] {
  return [...early];
}
