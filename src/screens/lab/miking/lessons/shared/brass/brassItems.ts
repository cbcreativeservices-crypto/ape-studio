/**
 * THE BRASS FAMILY'S SHARED CHECKS — items that read the same on a trumpet,
 * a flugelhorn and a trombone, with the horn's own word dropped in. The
 * generic ones (hearing, polarity, delay, the supercardioid null) are the
 * bowed family's, reused (bowedItems.ts); these are the brass-specific
 * ones: a mic's own overload, feedback with a bell, and the power reasons.
 *
 * Item-writing rules (LESSON_JOURNEY §5, tested): the correct option is
 * never conspicuously longer; wrong options are real misconceptions without
 * absolute words; no brand or model; every wrong option has its own
 * explanation; reasoning, not the recall of a number.
 */
import type { MikingScenario, SetupReason, Symptom } from '../../../engine/model/types.ts';

const OK = 'No — the mic’s own capsule may be overloading';
const METER = 'Yes — a clean meter means the whole chain is clean';
const LOWGAIN = 'Yes, as long as the preamp gain is set low';

/** The meter is clean but the loudest accent smears (L8, DPA-TPT): a "No" key. */
export const overloadCheck = (id: string, noun: string): MikingScenario => ({
  id,
  page: 'microphone',
  prompt: `The ${noun}’s loudest accent sounds smeared, yet the desk’s input meter never clips. Is the mic surely fine?`,
  options: [OK, METER, LOWGAIN],
  correct: OK,
  explain: `Close to a ${noun}’s bell the peaks are very high, and a mic’s own capsule and electronics can overload before anything reaches the desk. Check the mic’s rating and any pad its maker allows, then set gain on the strongest real passage.`,
  why: {
    [METER]: 'The meter reads the preamp, after the mic. The mic itself can already be distorting.',
    [LOWGAIN]: 'Low preamp gain does not protect the mic’s own electronics from the level at the bell.',
  },
});

/** Feedback or stage bleed with a horn mic. */
export const brassFeedback = (id: string, noun: string): Symptom => ({
  id,
  observation: 'Feedback, or the stage bleeds into the mic',
  firstChecks: 'Lower the offending level; revise the mic, monitor and player geometry and the number of open mics.',
  options: ['Lower the level; then change the layout and open mics', `Boost the ${noun} channel so it rides over the ring`, 'Swap to an omni mic, which is less likely to feed back'],
  correct: 'Lower the level; then change the layout and open mics',
  explain: 'Feedback is a sound-system condition: reduce the level first, then move the mic or the wedge, aim the pattern’s rejection and close mics you do not need. Never provoke feedback on purpose.',
  why: {
    [`Boost the ${noun} channel so it rides over the ring`]: 'More gain feeds the loop. Lower the level first.',
    'Swap to an omni mic, which is less likely to feed back': 'An omni rejects nothing: it usually makes feedback more likely, not less.',
  },
});

export const DYN_POWER_REASON: SetupReason = { id: 'r.power', label: 'The mic gets the power it needs: none for a dynamic, phantom for a condenser', role: 'required', feedback: 'Say how the mic is powered: a dynamic needs none; a condenser needs phantom power.' };
export const CLIP_POWER_REASON: SetupReason = { id: 'r.power', label: 'Each mic gets its power: phantom (through its adapter) for the miniature, none for a dynamic', role: 'required', feedback: 'Say how the mic is powered: the miniature needs phantom power through its adapter; a dynamic needs none.' };
