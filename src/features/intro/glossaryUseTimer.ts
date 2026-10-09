/**
 * Glossary use timer (owner 2026-10-09): "Our Commitment to You" appears once,
 * after about four minutes of Glossary use the first time — no longer on the
 * Academy menu at launch.
 *
 * Counts only while the Glossary is focused, usable and the app is in the
 * foreground; the total carries across visits. The key sits in the
 * device-level `ape:onboarding:` family, so an account wipe keeps it.
 */
import { useEffect, useState } from 'react';
import { AppState } from 'react-native';
import { createLocalStore } from '../storage/localStore';

export const GLOSSARY_COMMITMENT_MS = 4 * 60 * 1000;
const TICK_MS = 15000;

const store = createLocalStore<number>({
  key: 'ape:onboarding:glossaryUseMs',
  empty: () => 0,
  parse: (parsed) => {
    if (typeof parsed !== 'number' || !Number.isFinite(parsed) || parsed < 0) throw new Error('glossaryUseMs: not a duration');
    return parsed;
  },
});

/** True once the Glossary has been used for `GLOSSARY_COMMITMENT_MS` in total.
 *  `counting` is the host's "the learner is really using it" condition. */
export function useGlossaryUseReached(counting: boolean): boolean {
  const total = store.use();
  const reached = total >= GLOSSARY_COMMITMENT_MS;
  const [foreground, setForeground] = useState(AppState.currentState === 'active');

  useEffect(() => {
    const sub = AppState.addEventListener('change', (s) => setForeground(s === 'active'));
    return () => sub.remove();
  }, []);

  useEffect(() => {
    if (!counting || !foreground || reached) return;
    let last = Date.now();
    const id = setInterval(() => {
      const now = Date.now();
      // A stalled timer (device asleep) never counts more than one tick.
      const step = Math.min(now - last, TICK_MS * 2);
      last = now;
      void store.mutate((ms) => ms + step);
    }, TICK_MS);
    return () => clearInterval(id);
  }, [counting, foreground, reached]);

  return reached;
}
