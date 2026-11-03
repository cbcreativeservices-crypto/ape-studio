/**
 * The Study Dashboard's TOPIC FOUNDATIONS row — its data and its popup
 * (D47, owner GO 2026-11-03). The rack hardware itself (frame, screws, icon
 * well, glass label, switch) stays in DashboardScreen and is drawn through
 * `renderRow`, so the row is the SAME component as the method rows.
 *
 * ⛔ LOADED LAZILY. DashboardScreen is in the app-start graph, which is at its
 * 260-module cap (test/perfStartTrim_20261004). It require()s this module
 * from a runSoon callback, so nothing here — nor the lesson store or the dev
 * preview copy — is evaluated before the first frame.
 *
 * Shows NOTHING for a topic with no Foundations text, a server without the
 * column, or a failed read (owner decision 3). Opening it here never counts
 * as read; only I'VE READ THIS does. Access is the Flashcards row's own: a
 * locked topic's tap goes to the same study-access popup (no new paywall).
 */
import { useEffect, useState, type ReactElement } from 'react';
import { cachedFoundations, loadFoundations } from './foundationsSource';
import type { FoundationsLesson } from './foundationsText';
import { FoundationsSheet } from './TopicFoundationsSheet';
import { useFoundationsRead } from './useFoundationsRead';

/** Wait this long on a topic before asking the server, so turning the topic
 *  dial past twenty topics does not send twenty reads. */
const SETTLE_MS = 300;

export type FoundationsRowProps = {
  /** I'VE READ THIS was tapped (known state only). */
  read: boolean;
  /** Same lock as the Flashcards row (actMembershipLocked). */
  locked: boolean;
  onPress: () => void;
};

export function FoundationsDashboardSlot({
  achievementId,
  gs,
  locked,
  onLocked,
  renderRow,
}: {
  achievementId: string;
  gs: number | null;
  locked: boolean;
  /** The Flashcards row's own locked-tap answer (the study-access popup). */
  onLocked: () => void;
  renderRow: (p: FoundationsRowProps) => ReactElement;
}) {
  const [found, setFound] = useState<{ id: string; lesson: FoundationsLesson | null }>(() => ({
    id: achievementId,
    lesson: cachedFoundations(achievementId) ?? null,
  }));
  const [open, setOpen] = useState(false);
  const rs = useFoundationsRead(achievementId);

  useEffect(() => {
    setOpen(false);
    const cached = cachedFoundations(achievementId);
    if (cached !== undefined) {
      setFound({ id: achievementId, lesson: cached });
      return undefined;
    }
    let alive = true;
    const t = setTimeout(() => {
      void loadFoundations(achievementId, gs).then((lesson) => {
        if (alive) setFound({ id: achievementId, lesson });
      });
    }, SETTLE_MS);
    return () => {
      alive = false;
      clearTimeout(t);
    };
  }, [achievementId, gs]);

  const lesson = found.id === achievementId ? found.lesson : null;
  if (!lesson) return null;
  const read = rs.known && rs.read;
  return (
    <>
      {renderRow({
        read,
        locked,
        onPress: () => (locked ? onLocked() : setOpen(true)),
      })}
      {open ? (
        <FoundationsSheet
          lesson={lesson}
          alreadyRead={read}
          onLater={() => setOpen(false)}
          onRead={async () => {
            await rs.markRead();
            setOpen(false);
          }}
        />
      ) : null}
    </>
  );
}
