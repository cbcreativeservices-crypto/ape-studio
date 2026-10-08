/**
 * THE FOLEY FAMILY'S OWN PAGES — reused, never copied:
 *   instrument  the small-percussion family's ORIENT page (SInstrument): the
 *               shared page with the scene framed CLOSE on the action
 *               (`lesson.sp.close`), so a prop or a shoe is not a few points
 *               wide on a phone;
 *   sound       the small-percussion family's three-step HOW IT SOUNDS page
 *               (SSound): the event sequence, the lesson's pair of motions,
 *               attack and body in words — no drumhead step;
 *   setting     the family's "before any mic" page (FoleySetting: the voice
 *               family's shape, plus an optional illustrated decision step).
 * A Foley lesson carries `sp` (smallperc/family.ts SpExtra) for the first two.
 */
import type { LessonArt } from '../../../engine/scene/sceneTypes.ts';
import { SInstrument } from '../smallperc/pages/SInstrument';
import { SSound } from '../smallperc/pages/SSound';
import { makeFoleySetting, type FoleySettingSpec } from './FoleySetting';

export const FOLEY_HEARING =
  'Protect hearing — the performer’s and yours. Keep headphones, monitors and any PA at comfortable levels: a useful balance never needs a dangerous level, and a performer judging texture on headphones needs them comfortable for long sessions. A widely used guideline: no more than 85 dBA averaged over an 8-hour day, halving the time for every 3 dBA above that — a limit for PEOPLE, measured where a person listens; a mic’s maximum SPL rating says nothing about it.';

/** A Foley lesson's art with the family's pages and their step counts.
 *  `path`: the lesson's own decision step on STARTING SETUPS (F04's paths). */
export function withFoleyPages(art: LessonArt, path?: FoleySettingSpec['path']): LessonArt {
  const setting = makeFoleySetting({ hearing: FOLEY_HEARING, ...(path ? { path } : {}) });
  return {
    ...art,
    pages: { instrument: SInstrument as never, sound: SSound as never, setting: setting as never },
    stepCounts: { sound: art.CoupledHeads ? 3 : 2, setting: path ? 2 : 1 },
  };
}
