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

/** Read the draft for this attempt, or null if there is none to restore. */
export async function loadAttemptDraft(attemptId: string): Promise<AttemptDraft | null> {
  if (!attemptId) return null;
  try {
    const raw = await AsyncStorage.getItem(key(attemptId));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<AttemptDraft>;
    // A draft we cannot read is treated as absent rather than as a reason to
    // fail: starting from question one is bad, refusing to open the exam is
    // worse.
    if (!parsed || typeof parsed !== 'object' || typeof parsed.answers !== 'object' || !parsed.answers) {
      return null;
    }
    const qIdx = Number.isInteger(parsed.qIdx) && (parsed.qIdx as number) >= 0 ? (parsed.qIdx as number) : 0;
    return { answers: parsed.answers as Record<string, unknown>, qIdx };
  } catch {
    return null;
  }
}

/**
 * Store the draft. Fire-and-forget on purpose: this is called on every answer,
 * and an answer must never wait on a disk write to register.
 */
export function saveAttemptDraft(attemptId: string, draft: AttemptDraft): void {
  if (!attemptId) return;
  try {
    void AsyncStorage.setItem(key(attemptId), JSON.stringify(draft)).catch(() => {});
  } catch {
    /* best-effort */
  }
}

/** Drop the draft. Call after a submit lands, and after an explicit wipe. */
export async function clearAttemptDraft(attemptId: string): Promise<void> {
  if (!attemptId) return;
  try {
    await AsyncStorage.removeItem(key(attemptId));
  } catch {
    /* best-effort */
  }
}
