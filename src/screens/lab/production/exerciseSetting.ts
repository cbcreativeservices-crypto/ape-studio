/**
 * PO-03 (owner 2026-11-15: "build waves 1 thru 3", D62 adoption plan): most
 * exercises are written around ONE kind of production (an episode, an
 * interview, a band's mix, a recorded show). Opened from a project of another
 * type, the prompt read "an episode" under a chip saying "Live performance or
 * event". The exercise now NAMES ITS OWN SETTING in that same line whenever the
 * project's type is not one the scenario was written for; the scenario text
 * itself is unchanged. Pure: the exercise screen and the F4 wave test share it.
 *
 * `fits` = the project types the prompt describes as written. An exercise not
 * listed here is written for every type (e.g. Pre-Production's one-sentence
 * client brief).
 */
import { PATHWAY_LABEL, type PathwayId } from '../../../features/production/types.ts';

export const EXERCISE_SETTING: Readonly<Record<string, { setting: string; fits: readonly PathwayId[] }>> = {
  // Audio Post-Production
  'clarify-the-handoff': { setting: 'a podcast episode', fits: ['podcast'] },
  'safe-ingest': { setting: 'a podcast episode', fits: ['podcast'] },
  'restore-synchronisation': { setting: 'a recorded conversation with a remote guest', fits: ['podcast'] },
  'repair-without-overprocessing': { setting: 'a recorded interview', fits: ['podcast'] },
  'add-without-erasing': { setting: 'a podcast episode', fits: ['podcast'] },
  'route-the-mix': { setting: 'a music mix and its stems', fits: ['music'] },
  'meet-the-specification': { setting: 'a podcast episode', fits: ['podcast'] },
  'the-upload-succeeded': { setting: 'a music release', fits: ['music'] },
  // Audio Pre-Production
  'deliverable-detective': { setting: 'a recorded launch performance', fits: ['live'] },
  'save-the-production': { setting: 'a recorded three-act show', fits: ['live'] },
};

/** The line under an exercise's prompt: the project's type, and, when the
 *  scenario was written for another type, the setting it uses. */
export function exerciseSettingLine(activityId: string, pathway: PathwayId): string {
  const s = EXERCISE_SETTING[activityId];
  const label = PATHWAY_LABEL[pathway];
  if (!s || s.fits.includes(pathway)) return label;
  return `${label} project. This exercise uses ${s.setting}.`;
}
