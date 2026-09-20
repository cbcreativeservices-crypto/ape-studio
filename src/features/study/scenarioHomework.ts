/**
 * Scenarios "homework" data layer (owner spec 2026-08-11).
 *
 * Scenario items live in the admin-only quiz_questions table (usage='scenario'),
 * so all access is via SECURITY DEFINER RPCs. A topic's scenarios are grouped by
 * term (glossary_id); each term has up to 3. The homework is 3 ROUNDS — one
 * scenario per term per round — pre-assigned server-side so all of a term's
 * scenarios are covered across the rounds. Progress is durable (survives
 * reinstall, syncs across devices, resumes mid-round).
 *
 * ROBUSTNESS: a term bucket may hold 0/1/2/3+ scenarios. The server assignment
 * shuffles whatever exists and caps at 3, so a term simply appears in fewer
 * rounds when it has fewer scenarios — the client never assumes exactly 3 and
 * never crashes on a short bucket.
 */
import { supabase } from '../../lib/supabase';
import { emitStudyProgress } from './sync';
import {
  drainScenarioQueue,
  pendingScenarioCount,
  queueScenarioCall,
  type ScenarioPending,
} from './scenarioQueue';

export const SCENARIO_ROUNDS = 3;

const Q_TYPES = new Set(['mc', 'multi_select', 'sequencing']);

export type ScenarioQ = {
  id: string;
  prompt: string;
  media: { kind: 'audio'; url: string } | { kind: 'image'; url: string } | null;
  type: 'mc' | 'multi_select' | 'sequencing';
  options: string[];
  correct: string[];
  explanation: string;
  term: string | null;
  category: string | null;
};

export type ScenarioAnswer = { round: number; correct: boolean };

export type ScenarioHomework = {
  currentRound: number; // 1..3
  roundsCompleted: number; // 0..3
  cycle: number;
  /** rounds[r-1] = the ordered question list for round r (terms without a
   *  scenario in that slot are simply absent). */
  rounds: ScenarioQ[][];
  answers: Record<string, ScenarioAnswer>;
};

type RawQ = {
  prompt?: string;
  options?: unknown;
  question_type?: string;
  correct_answer?: string | null;
  correct_answers?: unknown;
  explanation?: string | null;
  media_url?: string | null;
  media_type?: string | null;
  term?: string | null;
  category?: string | null;
};

function mapQ(id: string, r: RawQ): ScenarioQ | null {
  if (!r || !r.prompt || !Array.isArray(r.options) || r.options.length === 0) return null;
  const type: ScenarioQ['type'] = Q_TYPES.has(r.question_type ?? '') ? (r.question_type as ScenarioQ['type']) : 'mc';
  const correct: string[] =
    Array.isArray(r.correct_answers) && r.correct_answers.length > 0
      ? (r.correct_answers as string[]).map(String)
      : r.correct_answer != null
        ? [String(r.correct_answer)]
        : [];
  if (correct.length === 0) return null;
  const media: ScenarioQ['media'] = r.media_url
    ? { kind: r.media_type === 'audio' ? 'audio' : 'image', url: r.media_url }
    : null;
  return {
    id,
    prompt: r.prompt,
    media,
    type,
    options: (r.options as unknown[]).map(String),
    correct,
    explanation: r.explanation ?? '',
    term: r.term ?? null,
    category: r.category ?? null,
  };
}

/** Assemble the 3 round question-lists from the server assignment + hydrated
 *  question map. Rounds are ordered by term name (stable, so mid-round resume
 *  lands in the same place next session). */
function assembleRounds(
  assignment: Record<string, string[]>,
  questions: Record<string, RawQ>,
): ScenarioQ[][] {
  const rounds: ScenarioQ[][] = [[], [], []];
  for (const [, qids] of Object.entries(assignment ?? {})) {
    if (!Array.isArray(qids)) continue;
    for (let r = 0; r < SCENARIO_ROUNDS; r++) {
      const qid = qids[r];
      if (!qid) continue; // term has no scenario for this round — fine
      const q = mapQ(qid, questions?.[qid] ?? {});
      if (q) rounds[r].push(q);
    }
  }
  const byTerm = (a: ScenarioQ, b: ScenarioQ) => (a.term ?? '').localeCompare(b.term ?? '') || a.id.localeCompare(b.id);
  return rounds.map((list) => list.sort(byTerm));
}

function parseHomework(data: any): ScenarioHomework | null {
  if (!data || data.error) return null;
  return {
    currentRound: Math.min(SCENARIO_ROUNDS, Math.max(1, Number(data.current_round) || 1)),
    roundsCompleted: Math.min(SCENARIO_ROUNDS, Math.max(0, Number(data.rounds_completed) || 0)),
    cycle: Number(data.cycle) || 1,
    rounds: assembleRounds(data.assignment ?? {}, data.questions ?? {}),
    answers: (data.answers ?? {}) as Record<string, ScenarioAnswer>,
  };
}

/** Load (creating on first entry) the user's scenario homework for a topic.
 *  Returns null on error / no auth so the screen shows an honest empty state. */
export async function fetchScenarioHomework(achievementId: string): Promise<ScenarioHomework | null> {
  try {
    const { data, error } = await supabase.rpc('get_scenario_homework', { p_achievement_id: achievementId });
    if (error) return null;
    return parseHomework(data);
  } catch {
    return null;
  }
}

/** The raw RPCs, with no queueing — used by the drain and by the wrappers. */
async function sendAnswer(achievementId: string, questionId: string, round: number, correct: boolean): Promise<boolean> {
  try {
    // supabase-js RESOLVES with { error } rather than throwing, so the catch
    // below never sees an RPC error — check `error` explicitly or a failed
    // persist (mid-round resume relies on it) would pass completely silently.
    const { error } = await supabase.rpc('record_scenario_answer', {
      p_achievement_id: achievementId,
      p_question_id: questionId,
      p_round: round,
      p_correct: correct,
    });
    if (error) {
      console.warn('[scenario] record_scenario_answer failed:', error.message);
      return false;
    }
    return true;
  } catch (e) {
    console.warn('[scenario] record_scenario_answer threw:', (e as Error).message);
    return false;
  }
}

async function sendComplete(achievementId: string, round: number): Promise<number | null> {
  try {
    const { data, error } = await supabase.rpc('complete_scenario_round', {
      p_achievement_id: achievementId,
      p_round: round,
    });
    if (error) return null;
    emitStudyProgress(); // refresh any live Dashboard LED
    return Number(data) || round;
  } catch {
    return null;
  }
}

/** Send one queued scenario call. Shape-dispatched by the drain. */
async function sendPending(item: ScenarioPending): Promise<boolean> {
  return item.kind === 'answer'
    ? sendAnswer(item.achievementId, item.questionId, item.round, item.correct)
    : (await sendComplete(item.achievementId, item.round)) !== null;
}

/**
 * Push everything scenarios could not send earlier.
 *
 * ⛔ CALL THIS BEFORE A NEW CALL, not only on a timer: the queue must stay in
 * order, and a fresh answer sent ahead of an older queued one would land out
 * of sequence.
 */
export function flushScenarioQueue(): Promise<number> {
  return drainScenarioQueue(sendPending);
}

/** Unsent scenario calls still on this device. */
export { pendingScenarioCount };

/**
 * Persist one answered scenario (drives mid-round resume).
 *
 * ⛔ QUEUES ON FAILURE. This used to warn and return, and scenarios was the
 * ONLY study method that could lose a learner's work outright — see the note
 * at the top of scenarioQueue.ts.
 */
export async function recordScenarioAnswer(
  achievementId: string,
  questionId: string,
  round: number,
  correct: boolean,
): Promise<void> {
  // Anything already waiting goes first, so order is preserved.
  const stillPending = await flushScenarioQueue();
  if (stillPending > 0 || !(await sendAnswer(achievementId, questionId, round, correct))) {
    await queueScenarioCall({ kind: 'answer', achievementId, questionId, round, correct, at: Date.now() });
  }
}

/**
 * Mark a round complete → advances the round + moves the Dashboard LED to
 * rounds/3. Returns the new rounds-completed count.
 *
 * ⛔ QUEUES ON FAILURE, like the answers it completes. Returning `round`
 * unchanged on failure is what let the round report congratulate a learner
 * for a round the server never heard about.
 */
export async function completeScenarioRound(achievementId: string, round: number): Promise<number> {
  const stillPending = await flushScenarioQueue();
  if (stillPending === 0) {
    const n = await sendComplete(achievementId, round);
    if (n !== null) return n;
  }
  await queueScenarioCall({ kind: 'complete', achievementId, round, at: Date.now() });
  return round;
}

/** Re-shuffle a fresh 3-round cycle after all 3 are done. Returns the new plan. */
export async function startScenarioCycle(achievementId: string): Promise<ScenarioHomework | null> {
  try {
    const { data, error } = await supabase.rpc('start_scenario_cycle', { p_achievement_id: achievementId });
    if (error) return null;
    emitStudyProgress();
    return parseHomework(data);
  } catch {
    return null;
  }
}

// ─────────────────────────────────────────── end-of-round analysis ──────────
export type CategoryStat = { category: string; correct: number; total: number; pct: number };
export type RoundReport = {
  round: number;
  score: number;
  total: number;
  strengths: CategoryStat[]; // high accuracy — encourage
  toReview: CategoryStat[]; // lower accuracy — the concepts to revisit
  missed: { term: string | null; prompt: string; answer: string; explanation: string }[];
};

/** Build the encouraging, concept-clustered report for a just-finished round.
 *  Groups the round's answers by term category; strengths vs. revisit are split
 *  by accuracy so the copy can point at the concepts blocking the bigger view. */
export function buildRoundReport(
  round: number,
  questions: ScenarioQ[],
  answers: Record<string, ScenarioAnswer>,
): RoundReport {
  const byCat = new Map<string, { correct: number; total: number }>();
  const missed: RoundReport['missed'] = [];
  let score = 0;
  for (const q of questions) {
    const a = answers[q.id];
    const correct = !!a?.correct;
    if (correct) score++;
    const cat = q.category ?? 'General';
    const c = byCat.get(cat) ?? { correct: 0, total: 0 };
    c.total++;
    if (correct) c.correct++;
    byCat.set(cat, c);
    if (!correct) {
      missed.push({ term: q.term, prompt: q.prompt, answer: q.correct[0] ?? '', explanation: q.explanation });
    }
  }
  const stats: CategoryStat[] = [...byCat.entries()]
    .map(([category, v]) => ({ category, correct: v.correct, total: v.total, pct: Math.round((v.correct / Math.max(1, v.total)) * 100) }))
    .sort((a, b) => b.pct - a.pct);
  const strengths = stats.filter((s) => s.pct >= 80);
  const toReview = stats.filter((s) => s.pct < 80).sort((a, b) => a.pct - b.pct);
  return { round, score, total: questions.length, strengths, toReview, missed };
}
