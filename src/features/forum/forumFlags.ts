/**
 * The forum's two device flags: the welcome was seen here, and the community
 * rules were accepted (app-side, brief item h: the server has no check yet).
 *
 * A failed read is UNREADABLE and is never overwritten (createLocalStore), and
 * `known` stays false, so nothing interrupts on a guess. The dev sample has its
 * own in-memory flags, so looking at the sample never touches the real ones.
 */
import { useCallback, useSyncExternalStore } from 'react';
import { createLocalStore } from '../storage/localStore';
import { sampleFlags, setSampleFlags, subscribeSample } from './sampleSwitch.ts';

type Flags = { welcomeSeen: boolean; rulesAccepted: boolean };

const store = createLocalStore<Flags>({
  key: 'ape:forum-flags',
  empty: () => ({ welcomeSeen: false, rulesAccepted: false }),
  parse: (raw) => {
    if (!raw || typeof raw !== 'object') throw new Error('forum flags');
    const r = raw as Partial<Flags>;
    return { welcomeSeen: r.welcomeSeen === true, rulesAccepted: r.rulesAccepted === true };
  },
});

export function useForumFlags(): Flags & {
  known: boolean;
  /** True only when the device accepted the write. */
  acceptRules: () => Promise<boolean>;
  markWelcomeSeen: () => Promise<boolean>;
} {
  const real = store.use();
  const hydrated = store.useHydrated();
  const sample = useSyncExternalStore(subscribeSample, sampleFlags, sampleFlags);

  const acceptRules = useCallback(async () => {
    if (sampleFlags()) {
      setSampleFlags({ rulesAccepted: true });
      return true;
    }
    return store.mutate((f) => ({ ...f, rulesAccepted: true }));
  }, []);
  const markWelcomeSeen = useCallback(async () => {
    if (sampleFlags()) {
      setSampleFlags({ welcomeSeen: true });
      return true;
    }
    return store.mutate((f) => ({ ...f, welcomeSeen: true }));
  }, []);

  const flags = sample ?? real;
  return {
    ...flags,
    known: sample ? true : hydrated && !store.isUnreadable(),
    acceptRules,
    markWelcomeSeen,
  };
}
