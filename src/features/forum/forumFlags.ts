/**
 * The forum's two device flags: the welcome was seen here, and the community
 * rules were accepted. The rules agreement is also recorded on the account
 * (forum_rules_accept, SERVER_GAPS row 10) once the server has it; the phone's
 * record stays as the fallback for a server without it.
 *
 * A failed read is UNREADABLE and is never overwritten (createLocalStore), and
 * `known` stays false, so nothing interrupts on a guess. The dev sample has its
 * own in-memory flags, so looking at the sample never touches the real ones.
 */
import { useCallback, useSyncExternalStore } from 'react';
import { createLocalStore } from '../storage/localStore';
import { sampleFlags, setSampleFlags, subscribeSample } from './sampleSwitch.ts';
import { acceptForumRules } from './api';

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
    // Kept on the phone AND recorded on the account; either one is enough.
    return acceptForumRules(() => store.mutate((f) => ({ ...f, rulesAccepted: true })));
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
