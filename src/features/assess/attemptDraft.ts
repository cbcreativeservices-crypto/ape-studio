/**
 * attemptDraft — the answers a learner has given so far in a quiz or a final
 * exam, kept on the device until that attempt is submitted.
 *
 * ── THE HOLE THIS FILLS ──────────────────────────────────────────────────────
 *
 * Found 2026-09-17 by a bug-hunting pass over the end-to-end journeys.
 *
 * Both screens hold their answers in a `useRef` and their position in a
 * `useState`. The ATTEMPT already survives a relaunch — `startQuizAttempt`
 * stores a client attempt id precisely so a crash rejoins the same attempt and
 * the same served questions — but the ANSWERS did not. So after the app was
 * killed mid-quiz, the learner came back to question 1 of a paper they had
 * half-finished, with everything they had entered gone.
 *
 * It was worse than losing the work, because the CLOCK does not restart: the
 * deadline is computed from the server's `started_at`. If the time limit had
 * passed while the app was closed, the first countdown tick after arriving
 * force-submitted — an empty attempt, scored zero, recorded as a real sitting.
 *
 * ── WHY THIS IS NOT "PAUSING" THE EXAM ──────────────────────────────────────
 *
 * The Final Exam is deliberately unpausable, and its exit dialog says so: leave
 * and your answers are wiped. That rule is about TIME, and time is untouched
 * here — the deadline still runs from `started_at`, a relaunch buys nothing, and
 * an explicit "Leave & wipe" still wipes, because the learner chose it.
 *
 * What this removes is the case nobody chose: a crash, a low-memory kill, a
 * phone call that never came back. Losing an hour's work to that is not a rule,
 * it is an accident, and it has never been part of any design here.
 *
 * ── SHAPE ────────────────────────────────────────────────────────────────────
 *
 * Keyed by ATTEMPT id, not by topic: a draft can only ever be restored into the
 * exact attempt that produced it, so a stale one cannot bleed into a new sitting.
 * Every call is guarded and best-effort — this is a convenience, and a storage
 * failure must never take down a screen someone is being graded on.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';

const key = (attemptId: string) => `ape:attemptDraft:${attemptId}`;

export type AttemptDraft = {
  /** slot index → the answer, exactly as the submit RPC wants it. */
  answers: Record<string, unknown>;
  /** The question the learner was on. */
  qIdx: number;
};

/**
 * ⛔ A DRAFT THAT COULD NOT BE READ IS NOT "NO DRAFT" (wave 2, 2026-10-02).
 *
 * A throwing read answered `null`, the screen started the attempt from
 * question one with no answers, and the very next answer wrote a one-answer
 * draft OVER the stored one — the earlier answers were gone from the device
 * for good, which is the exact accident this file exists to prevent. Now the
 * read is tried twice; if it still fails the attempt is marked UNREADABLE,
 * and every save for it first reads the stored draft again and MERGES (stored
 * answers kept, this session's answers on top). While the stored draft still
 * cannot be read, a save writes nothing — the stored copy outlives the hiccup.
 * Drafts are keyed by attempt and kept by the account wipe on purpose (see
 * clearLocalAccountData), so they need no generation fence.
 */
const unreadable = new Set<string>();
/** One write at a time per attempt, so a merge cannot land after a newer save. */
const chains = new Map<string, Promise<void>>();

function parseDraft(raw: string | null): AttemptDraft | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<AttemptDraft>;
    if (!parsed || typeof parsed !== 'object' || typeof parsed.answers !== 'object' || !parsed.answers) {
      return null;
    }
    const qIdx = Number.isInteger(parsed.qIdx) && (parsed.qIdx as number) >= 0 ? (parsed.qIdx as number) : 0;
    return { answers: parsed.answers as Record<string, unknown>, qIdx };
  } catch {
    // A draft we cannot PARSE is treated as absent rather than as a reason to
    // fail: starting from question one is bad, refusing to open the exam is
    // worse. (Damaged, not unreadable: there is nothing usable to keep.)
    return null;
  }
}

/** Read the draft for this attempt, or null if there is none to restore. */
export async function loadAttemptDraft(attemptId: string): Promise<AttemptDraft | null> {
  if (!attemptId) return null;
  for (let i = 0; i < 2; i++) {
    try {
      const raw = await AsyncStorage.getItem(key(attemptId));
      unreadable.delete(attemptId);
      return parseDraft(raw);
    } catch {
      /* read failed — try once more, then mark the attempt unreadable */
    }
  }
  unreadable.add(attemptId);
  return null;
}

/** True when the last read of this attempt's draft FAILED: the screen is
 *  showing a fresh start, but earlier answers may still be on the device. */
export function isAttemptDraftUnreadable(attemptId: string): boolean {
  return unreadable.has(attemptId);
}

/**
 * Store the draft. Fire-and-forget on purpose: this is called on every answer,
 * and an answer must never wait on a disk write to register. Resolves true
 * only when the device accepted the write (callers may ignore it).
 */
export function saveAttemptDraft(attemptId: string, draft: AttemptDraft): Promise<boolean> {
  if (!attemptId) return Promise.resolve(false);
  // Snapshot now: the caller keeps mutating its answers object.
  const snap: AttemptDraft = { answers: { ...draft.answers }, qIdx: draft.qIdx };
  const prev = chains.get(attemptId) ?? Promise.resolve();
  let ok = false;
  const run = prev.then(async () => {
    try {
      let out = snap;
      if (unreadable.has(attemptId)) {
        let stored: AttemptDraft | null;
        try {
          stored = parseDraft(await AsyncStorage.getItem(key(attemptId)));
        } catch {
          return; // still unreadable: write nothing over the stored draft
        }
        unreadable.delete(attemptId);
        if (stored) {
          out = {
            answers: { ...stored.answers, ...snap.answers },
            qIdx: Math.max(stored.qIdx, snap.qIdx),
          };
        }
      }
      await AsyncStorage.setItem(key(attemptId), JSON.stringify(out));
      ok = true;
    } catch {
      /* best-effort */
    }
  });
  const settled = run.then(() => {
    if (chains.get(attemptId) === settled) chains.delete(attemptId);
  });
  chains.set(attemptId, settled);
  return run.then(() => ok);
}

/** Drop the draft. Call after a submit lands, and after an explicit wipe. */
export async function clearAttemptDraft(attemptId: string): Promise<void> {
  if (!attemptId) return;
  // Behind any save still queued for this attempt, so a late save cannot
  // re-create the draft after the submit cleared it.
  await (chains.get(attemptId) ?? Promise.resolve());
  unreadable.delete(attemptId);
  try {
    await AsyncStorage.removeItem(key(attemptId));
  } catch {
    /* best-effort */
  }
}
