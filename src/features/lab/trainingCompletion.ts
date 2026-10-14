/**
 * trainingCompletion — WHEN each training lab / lesson counts as complete,
 * and the BACKFILL that credits work finished before this update
 * (owner 2026-10-13: training labs count toward certificates; required labs
 * unlock the final exam, checked on the server).
 *
 * The keys are trainingLabKeys.ts. The sending is labCompletion's (one queue:
 * sent/unsent, lab_not_found kept and retried, guests never send, preview
 * earns nothing, wiped with the account). This module holds the RULES, as
 * pure functions, and the scan. The live hooks call the same rules at the
 * moment of completion and report through trainingSignal:
 *
 *   mk_<lesson>   Miking: every journey page credited (creditedCount ===
 *                 PAGE_IDS.length — the hub's ✓)          mikingProgress.bankPage
 *   mxb_/mxa_<p>  Mixing: that page marked done           Beginning/AdvancedMixingLabScreen onPageDone
 *   tr_mastering  every module banked (8)                 MasteringLabScreen
 *   tr_drum_tuning every chapter banked (7)               DrumTuningLabScreen
 *   tr_tuning     every chapter (14 — the store's `done`) TuningLabScreen
 *   tr_sound_systems the hub's COMPLETE rule              SoundSystemsLabScreen (soundsystems/labComplete)
 *   tr_<practice> the lab's understanding check passed    passUnderstandingCheck (PagedLab, LabShell,
 *                 (incl. tr_eq — see trainingLabKeys)     SsPagedLab, LabUnderstandingBlock)
 *   ear_<module>  mastered ≥ REQUIRED_EAR_LEVEL           EarModuleScreen
 *   tr_preprod / tr_postprod  one project with EVERY stage readStage() === 'complete'
 *                                                         ProductionStageScreen
 *
 * BACKFILL: `backfillTrainingCompletion()` reads every one of those stores and
 * records whatever is already complete — run by labCompletion (lazily) once a
 * signed-in account's device is settled (each launch, and after each sign-in),
 * so learners who finished labs before this update get the credit. Recording
 * is idempotent; only unsent keys are sent.
 */
import { PAGE_IDS } from '../../screens/lab/miking/engine/model/types.ts';
import { creditedCount } from '../../screens/lab/miking/engine/progress/creditMap.ts';
import { getMikingProgress, hydrateMiking, isMikingUnreadable, type MikingProgress } from '../../screens/lab/miking/engine/progress/mikingProgress';
import { MASTERING_MODULES } from '../../screens/lab/mastering/masteringContent';
import { loadMasteringProgress, masteringReadFailed, type MasteringProgressState } from '../../screens/lab/mastering/masteringProgress';
import { DRUM_CHAPTERS } from '../../screens/lab/drumtuning/drumContent';
import { drumReadFailed, loadDrumProgress, type DrumProgressState } from '../../screens/lab/drumtuning/drumProgress';
import { isTuningProgressUnreadable, loadTuningProgress, type TuningProgress } from '../tuning/tuningProgress';
import { isEarProgressUnreadable, loadEarProgress, type EarProgressState } from '../ear/earProgress';
import { getSoundSystemsProgress, hydrateSoundSystemsProgress, isSoundSystemsProgressUnreadable } from '../soundsystems/progress';
import { soundSystemsLabComplete } from '../soundsystems/labComplete';
import { SS_LEARN_ID, SS_PAGE_COUNTS } from '../../screens/lab/soundsystems/units';
import { isPagedProgressUnreadable, loadPagedProgress } from './pagedProgress';
import { projectStore } from '../production/projectStore';
import { productionProjectComplete } from '../production/complete';
import { UNDERSTANDING_UNIT } from './understanding';
import { hasLabUnit, hydrateLabCompletion, isLabCompletionUnreadable, labCompletionGeneration, recordTrainingDone, retryUnsentLabCredit } from './labCompletion';
import {
  EAR_MODULE_IDS,
  MIXING_ADV_PAGE_IDS,
  MIXING_BEG_PAGE_IDS,
  REQUIRED_EAR_LEVEL,
  UNDERSTANDING_LAB_IDS,
  earModuleKey,
  mikingLessonKey,
  mixingPageKeyAt,
  trainingKeyFor,
  trainingKeyForCheck,
} from './trainingLabKeys';

/* ── The rules (pure) ─────────────────────────────────────────────────────── */

/** mk_ keys for every Miking lesson whose journey is fully credited. */
export function mikingCompleteKeys(p: MikingProgress): string[] {
  return Object.entries(p.lessons)
    .filter(([, l]) => creditedCount(l.done) === PAGE_IDS.length)
    .map(([id]) => mikingLessonKey(id));
}

/** mxb_/mxa_ keys for the Mixing pages marked done (indexes past the lab's
 *  real pages — the appended check page — are not pages). */
export function mixingDoneKeys(lab: 'beg' | 'adv', completed: readonly number[]): string[] {
  const n = (lab === 'beg' ? MIXING_BEG_PAGE_IDS : MIXING_ADV_PAGE_IDS).length;
  return completed.filter((i) => i >= 0 && i < n).map((i) => mixingPageKeyAt(lab, i));
}

export function masteringAllDone(s: MasteringProgressState): boolean {
  return MASTERING_MODULES.every((m) => s.modules[m.id]?.done === true);
}

export function drumAllDone(s: DrumProgressState): boolean {
  return DRUM_CHAPTERS.every((c) => s.modules[c.id]?.done === true);
}

/** The Tuning store's own `done` (set when every chapter is complete). */
export function tuningAllDone(p: TuningProgress): boolean {
  return p.done === true;
}

/** ear_ keys for every module whose mastered level reaches the requirement. */
export function earCompleteKeys(s: EarProgressState): string[] {
  return EAR_MODULE_IDS.filter((id) => (s.modules[id]?.mastered ?? 0) >= REQUIRED_EAR_LEVEL).map(earModuleKey);
}

export { productionProjectComplete };

/* ── The backfill ─────────────────────────────────────────────────────────── */

/** Every training key complete in the device's stores right now. A store
 *  that could not be READ contributes nothing (never a stand-in copy). */
export async function collectCompletedTrainingKeys(): Promise<string[]> {
  const out = new Set<string>();
  const add = (k: string) => {
    if (k) out.add(k);
  };
  const step = async (fn: () => Promise<void>) => {
    try {
      await fn();
    } catch {
      // one store failing never stops the others
    }
  };

  await step(async () => {
    await hydrateMiking();
    if (!isMikingUnreadable()) mikingCompleteKeys(getMikingProgress()).forEach(add);
  });
  for (const [lab, labId] of [['beg', 'mixing-beg'], ['adv', 'mixing-adv']] as const) {
    await step(async () => {
      const p = await loadPagedProgress(labId);
      if (!isPagedProgressUnreadable(labId)) mixingDoneKeys(lab, p.completed).forEach(add);
    });
  }
  await step(async () => {
    const s = await loadMasteringProgress(true);
    if (!masteringReadFailed(s) && masteringAllDone(s)) add(trainingKeyFor('MasteringLab'));
  });
  await step(async () => {
    const s = await loadDrumProgress();
    if (!drumReadFailed(s) && drumAllDone(s)) add(trainingKeyFor('DrumTuningLab'));
  });
  await step(async () => {
    const p = await loadTuningProgress();
    if (!isTuningProgressUnreadable() && tuningAllDone(p)) add(trainingKeyFor('TuningLab'));
  });
  await step(async () => {
    const s = await loadEarProgress();
    if (!isEarProgressUnreadable(s)) earCompleteKeys(s).forEach(add);
  });
  // Understanding checks passed (units banked under the screen's labId).
  await step(async () => {
    await hydrateLabCompletion();
    if (isLabCompletionUnreadable()) return;
    for (const labId of new Set(Object.values(UNDERSTANDING_LAB_IDS))) {
      if (hasLabUnit(labId, UNDERSTANDING_UNIT)) add(trainingKeyForCheck(labId));
    }
  });
  await step(async () => {
    await hydrateSoundSystemsProgress();
    await hydrateLabCompletion();
    const learn = await loadPagedProgress(SS_LEARN_ID);
    if (isSoundSystemsProgressUnreadable() || isPagedProgressUnreadable(SS_LEARN_ID) || isLabCompletionUnreadable()) return;
    const learnPages = learn.completed.filter((p) => p < SS_PAGE_COUNTS.learn).length;
    if (soundSystemsLabComplete(learnPages, getSoundSystemsProgress(), hasLabUnit(SS_LEARN_ID, UNDERSTANDING_UNIT))) add(trainingKeyFor('SoundSystemsLab'));
  });
  for (const [lab, route] of [['preprod', 'PreProdLab'], ['postprod', 'PostProdLab']] as const) {
    await step(async () => {
      const list = await projectStore().tryLoad(lab);
      if (list && list.some((p) => productionProjectComplete(lab, p))) add(trainingKeyFor(route));
    });
  }
  return [...out];
}

let running: { gen: number; done: Promise<void> } | null = null;
/**
 * Record every completed training key and send the unsent ones. Callers make
 * sure a settled signed-in account owns the device (labCompletion's settle
 * listener).
 * One run at a time; a call during a run FOR THE SAME ACCOUNT joins it.
 *
 * ACCOUNT SWITCH MID-SCAN (toddler pass 2026-10-13): the scan reads a dozen
 * stores; a sign-out → sign-in while it ran used to record the keys read
 * from the departing account's stores into the NEXT account (recordUnit
 * took the generation current at record time) — and the new account's own
 * settle joined that run, so its own scan never happened. Now the keys are
 * recorded under the generation the scan started in (a wipe since → none
 * are), and a call from a newer account runs its own scan after.
 */
export function backfillTrainingCompletion(): Promise<void> {
  const gen = labCompletionGeneration();
  if (running && running.gen === gen) return running.done;
  const before = running?.done ?? Promise.resolve();
  const run = {
    gen,
    done: before
      .catch(() => {})
      .then(async () => {
        if (gen !== labCompletionGeneration()) return; // another wipe since this call
        const keys = await collectCompletedTrainingKeys();
        for (const k of keys) await recordTrainingDone(k, gen);
        if (gen !== labCompletionGeneration()) return;
        // A key recorded on an earlier launch but never accepted (offline, or
        // lab_not_found before the backend rows landed) goes again.
        await retryUnsentLabCredit();
      })
      .finally(() => {
        if (running === run) running = null;
      }),
  };
  running = run;
  return run.done;
}
