/**
 * Sound Systems Lab — "is the whole lab complete?" (2026-10-13).
 *
 * ONE rule, shared by the hub's "SOUND SYSTEMS LAB — COMPLETE" panel and the
 * training-credit report (tr_sound_systems, trainingCompletion.ts), so the
 * certificate never counts a lab the hub still lists work for — or the
 * reverse. It is exactly what the hub's WHAT IS LEFT list counts:
 *   LEARN        every chapter page            (PagedLab, ape:sound-systems-learn:v1)
 *   BUILD        every capstone passed         (progress.capstones)
 *   ROUTE        every console exercise        (progress.route)
 *   OPERATE      every exercise                (progress.operate)
 *   TROUBLESHOOT every fault solved            (progress.faults)
 *   + the understanding check on LEARN passed  (labCompletion unit)
 * The four practice modes' PAGES are not counted (their pages are where the
 * capstones / exercises / faults are done; those are what count).
 */
import { CAPSTONES } from './capstones';
import { FAULTS } from './faults';
import type { SoundSystemsProgress } from './progress';
import { SS_PAGE_COUNTS } from '../../screens/lab/soundsystems/units';

export const SS_ROUTE_EXERCISES = 8;
export const SS_OPERATE_EXERCISES = 5;

/** The hub's row totals. */
export const SS_TOTALS = {
  learn: SS_PAGE_COUNTS.learn,
  build: CAPSTONES.length,
  route: SS_ROUTE_EXERCISES,
  operate: SS_OPERATE_EXERCISES,
  troubleshoot: FAULTS.length,
} as const;

/** `learnPages` = LEARN's own pages done (the appended check page excluded). */
export function soundSystemsLabComplete(learnPages: number, progress: SoundSystemsProgress, checkPassed: boolean): boolean {
  return (
    checkPassed &&
    learnPages >= SS_TOTALS.learn &&
    progress.capstones.length >= SS_TOTALS.build &&
    progress.route.length >= SS_TOTALS.route &&
    progress.operate.length >= SS_TOTALS.operate &&
    progress.faults.length >= SS_TOTALS.troubleshoot
  );
}
