/**
 * useFoundationsRead — whether THIS learner has read THIS topic's Topic
 * Foundations, and the way to mark it (D47, 2026-11-03).
 *
 * `known` is true only when the session read ANSWERED (a stalled read is not
 * a guest — safeSessionResult, catalog K1) and the store was READ (not
 * UNREADABLE). While unknown, the Flashcards popup does not auto-appear and
 * the Dashboard shows the plain READ button, never the ✓.
 */
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { supabase } from '../../lib/supabase';
import { safeSessionResult } from '../../lib/getSessionSafe';
import { foundationsReadStore, markFoundationsRead } from './foundationsReadStore';
import { isFoundationsRead } from './foundationsText';

/** The learner's id, 'guest' for a session known to have none, or null when
 *  the session read did not answer. */
async function currentUid(): Promise<string | null> {
  try {
    const { result, timedOut } = await safeSessionResult(supabase.auth.getSession(), 'TopicFoundations');
    if (timedOut) return null;
    return result.data.session?.user?.id ?? 'guest';
  } catch {
    return null;
  }
}

export type FoundationsReadState = {
  /** The session answered and the store was read. */
  known: boolean;
  /** The lookup has finished, whichever way (known or not). */
  settled: boolean;
  /** Read — meaningful only when `known`. */
  read: boolean;
  /** Mark read; answers the WRITE RESULT. False when the state is unknown. */
  markRead: () => Promise<boolean>;
};

export function useFoundationsRead(achievementId: string): FoundationsReadState {
  const map = foundationsReadStore.use();
  const hydrated = foundationsReadStore.useHydrated();
  // Subscribed, not read once: a failed read changes no value, so only this
  // tells the screen the lookup has finished (UNREADABLE).
  const unreadable = useSyncExternalStore(foundationsReadStore.subscribe, foundationsReadStore.isUnreadable, foundationsReadStore.isUnreadable);
  // The account wipe bumps the generation: ask whose state it is again.
  const gen = foundationsReadStore.generation();
  const [uid, setUid] = useState<string | null>(null);
  const [uidAsked, setUidAsked] = useState(false);
  const uidRef = useRef<string | null>(null);
  uidRef.current = uid;

  useEffect(() => {
    let alive = true;
    setUidAsked(false);
    setUid(null);
    void currentUid().then((u) => {
      if (!alive) return;
      setUid(u);
      setUidAsked(true);
    });
    return () => {
      alive = false;
    };
  }, [gen]);

  const known = !!achievementId && uid != null && hydrated && !unreadable;
  const settled = uidAsked && (uid == null || hydrated || unreadable);
  const read = known && isFoundationsRead(map, uid as string, achievementId);

  const markRead = useCallback(async () => {
    const u = uidRef.current;
    if (!u || !achievementId) return false;
    return markFoundationsRead(u, achievementId);
  }, [achievementId]);

  return { known, settled, read, markRead };
}
