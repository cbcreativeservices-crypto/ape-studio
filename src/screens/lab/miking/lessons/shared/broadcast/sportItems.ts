/**
 * SHARED CHECKS FOR SPEECH IN SPORT — Lab 7b group 1 (B09, B10, B11): the
 * bowed family's generic items (shared/bowed/bowedItems.ts) say "instrument";
 * these say "voice". Pure data.
 */
import type { MikingScenario, SetupReason } from '../../../engine/model/types.ts';

/** A wrong setup reason: loudness. */
export const LOUD_VOICE: SetupReason = { id: 'r.loud', label: 'It will give the loudest voice of any position', role: 'wrong', feedback: 'Loudness is not a passing reason — level comes from gain and distance, not from a position.' };

/** Which change removes the arrival-time difference of one voice in two mics. */
export const removeDelayVoice = (id: string): MikingScenario => ({
  id,
  page: 'practice',
  prompt: 'One voice in two open mics sounds thin. Which change removes the arrival-time difference itself?',
  options: ['Moving a mic so the two paths are closer to equal', 'Flipping the polarity switch on one of the two microphones', 'Turning the farther mic up until it matches'],
  correct: 'Moving a mic so the two paths are closer to equal',
  explain: 'Only the paths set the delay. Polarity moves the notches; level changes their depth; neither removes the delay. Often the better answer is one mic open, not two.',
  why: {
    'Flipping the polarity switch on one of the two microphones': 'Polarity flips the sign; it moves the notches but does not remove the delay.',
    'Turning the farther mic up until it matches': 'Level changes the depth of the notches, not where they are or the delay behind them.',
  },
});
