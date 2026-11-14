/**
 * earLabEnd — the pure half of the Ear Training Lab's "what's left" END
 * SCREEN (emulator pass 2026-10-14: the hub listed 14 modules with no end and
 * the drill looped on NEXT ROUND forever).
 *
 *   Owner hard rule: "Labs NEVER block navigation; every lab ends with a
 *   'what's left' screen." Credit is never removed.
 *
 * NO NEW CREDIT RULE. A module counts exactly when the lab already credits it
 * (trainingCompletion: `ear_<module>` once its `mastered` level reaches
 * REQUIRED_EAR_LEVEL — `mastered` only ever grows, so a bad run never takes a
 * row back). Everything else is said as PRACTICE: a module with answers
 * logged reads "tried", with the level reached; one without reads "not tried
 * yet". React-free so it is unit-tested without Metro.
 */
import type { LabEndUnit } from '../kit/labEnd';
import type { EarModuleProgress } from '../../../features/ear/earProgress';
import { REQUIRED_EAR_LEVEL } from '../../../features/lab/trainingLabKeys.ts';

export type EarEndModule = { id: string; title: string; levels: number };

/** The words under the drill header's score pill. The score is the average of
 *  up to the last 20 answers; with fewer, it said "last 20" under a 100 % that
 *  rested on ONE answer (novice audit 2026-11-14, G7_EarTrainingLab). It now
 *  says how many answers it rests on until there are 20. */
export function earScoreWindowLabel(answers: number, window = 20): { sub: string; a11y: string } {
  if (answers >= window) return { sub: `last ${window}`, a11y: `over the last ${window} trials` };
  const n = Math.max(0, Math.floor(answers));
  return { sub: n === 1 ? '1 answer' : `${n} answers`, a11y: n === 1 ? 'over 1 answer so far' : `over ${n} answers so far` };
}

/** PLAY FIRST (owner decision 4, 2026-11-14): a trial's answers unlock once
 *  EVERY clip of the trial has sounded at least once (a clip counts only when
 *  it actually played: the screen bumps `plays` after the output gate said
 *  yes). Replays stay allowed any time, within the level's replay cap. */
export function earAnswersUnlocked(plays: readonly number[]): boolean {
  return plays.length > 0 && plays.every((n) => n > 0);
}

/** The line under the clips while the answers are still locked. */
export function earPlayFirstLine(soundOff: boolean): string {
  return soundOff
    ? 'This drill needs sound, and sound is off. The answers open once you have played every clip. Turn sound on (Profile › AUDIO OUTPUT) to practice, or go to the drill list; nothing here is lost.'
    : 'Play every clip first. The answers open once you have heard each one.';
}

/** True when the module already counts (the lab's existing credit rule). */
export function earModuleCredited(p: EarModuleProgress | undefined): boolean {
  return (p?.mastered ?? 0) >= REQUIRED_EAR_LEVEL;
}

/** True when at least one answer has been logged (practice, not credit). */
export function earModuleTried(p: EarModuleProgress | undefined): boolean {
  return (p?.total ?? 0) > 0;
}

// NEW COPY — owner review.
const TO_COUNT = `Clear level ${REQUIRED_EAR_LEVEL} at 80 % over 20 answers to count`;

/** One row per module, in lab order, with its practice state in words. */
export function earEndUnits(
  modules: readonly EarEndModule[],
  progress: Partial<Record<string, EarModuleProgress>> | undefined,
): LabEndUnit[] {
  return modules.map((m) => {
    const p = progress?.[m.id];
    let detail: string;
    if (earModuleCredited(p)) {
      // Phase 3 (owner 2026-11-14): no "N of total" progress; the level is named alone.
      detail = `Level ${Math.min(p!.mastered, m.levels)} cleared — practice on for the higher levels`;
    } else if (earModuleTried(p)) {
      const n = p!.total;
      detail = `Tried · level ${Math.min(p!.level, m.levels)} · ${n} answer${n === 1 ? '' : 's'} · ${TO_COUNT.toLowerCase()}`;
    } else {
      detail = `Not tried yet · ${TO_COUNT.toLowerCase()}`;
    }
    return { id: m.id, label: m.title, detail };
  });
}

/** The module ids that already count. Never shrinks: `mastered` only grows. */
export function earCreditedIds(
  modules: readonly EarEndModule[],
  progress: Partial<Record<string, EarModuleProgress>> | undefined,
): Set<string> {
  return new Set(modules.filter((m) => earModuleCredited(progress?.[m.id])).map((m) => m.id));
}
