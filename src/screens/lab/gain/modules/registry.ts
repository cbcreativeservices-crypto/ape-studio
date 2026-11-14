/**
 * Gain Staging Lab module registry (owner spec 2026-08-07). Structure follows
 * the owner's order: LEARN (what it is → input gain → follow the signal → too
 * low vs too high → gain vs fader), EXPLORE (a full multi-stage chain with
 * Signal X-Ray, plus Free Practice), CHALLENGE (troubleshoot a misconfigured
 * system). Principle-first — no hard dBFS targets in the early lessons.
 */

export type GainSection = 'learn' | 'explore' | 'challenge';

export const GAIN_SECTION_META: { id: GainSection; title: string; note: string }[] = [
  { id: 'learn', title: 'LEARN', note: 'What gain staging is, and how each stage feeds the next.' },
  { id: 'explore', title: 'EXPLORE', note: 'Build and balance a full chain — with Signal X-Ray.' },
  { id: 'challenge', title: 'CHALLENGE', note: 'Find the stage that’s wrong.' },
];

export type GainModuleId =
  | 'intro'
  | 'input'
  | 'follow'
  | 'lowhigh'
  | 'fadervsgain'
  | 'multistage'
  | 'freeplay'
  | 'troubleshoot';

export type GainModuleComponentProps = { width: number; focused: boolean };

export type GainModuleDef = { id: GainModuleId; title: string; blurb: string; section: GainSection };

export const GAIN_MODULES: GainModuleDef[] = [
  { id: 'intro', title: 'What Gain Staging Is', blurb: 'The signal as a path through stages — each with a healthy operating range.', section: 'learn' },
  { id: 'input', title: 'Input Gain First', blurb: 'Set the preamp so the signal is strong without clipping.', section: 'learn' },
  { id: 'follow', title: 'Follow the Signal', blurb: 'A bad decision early in the chain follows the signal downstream.', section: 'learn' },
  { id: 'lowhigh', title: 'Too Low vs. Too High', blurb: 'Two ways to get it wrong — and how each one hurts.', section: 'learn' },
  { id: 'fadervsgain', title: 'Gain vs. Fader', blurb: 'Why pulling the fader down cannot undo upstream clipping.', section: 'learn' },
  { id: 'multistage', title: 'Multiple Gain Stages', blurb: 'A channel strip as a chain of stages — clip LEDs outside, Signal X-Ray to see inside each one.', section: 'explore' },
  { id: 'freeplay', title: 'Free Practice', blurb: 'Even the source is yours — feed the rig anything, nothing is graded.', section: 'explore' },
  { id: 'troubleshoot', title: 'Troubleshooting Challenge', blurb: 'Only the master is visible — and it’s clipping. Inspect stage by stage and find it.', section: 'challenge' },
];

/** The Troubleshooting Challenge's own "what is missing" line on the
 *  what's-left list (phase 2 end screen, 2026-11-14): it is the one module
 *  that counts on a pass, not on opening. */
export const GAIN_TROUBLESHOOT_LEFT = 'Still to do: find the first stage that clips and fix it, until the green frame appears.';

/** "Done = work done" (owner's decision 1, phase 3, 2026-11-14): what makes
 *  each module count — never opening it.
 *   - What Gain Staging Is, Follow the Signal, Too Low vs. Too High, Gain vs.
 *     Fader: the CHECK YOURSELF answered right (1 each).
 *   - Input Gain First: the preamp set in the healthy green (its goal line).
 *   - Multiple Gain Stages: the chain balanced (BALANCE ✓ OK).
 *   - Free Practice: any change made to the source or a stage.
 *   - Troubleshooting Challenge: the fault found and fixed (unchanged).
 *  The numbers are the checks each module draws (0 = a hands-on goal). */
export const GAIN_MODULE_CHECKS: Record<GainModuleId, number> = {
  intro: 1,
  input: 0,
  follow: 1,
  lowhigh: 1,
  fadervsgain: 1,
  multistage: 0,
  freeplay: 0,
  troubleshoot: 0,
};

/** HOW IT COUNTS on the Gain end screens (home + module). */
export const GAIN_HOW_IT_COUNTS =
  'A module counts once its own task is done: its CHECK YOURSELF answered right, or its goal reached (healthy input gain, a balanced chain, a change in Free Practice, the fault fixed). Practicing again never removes credit.';

/** The what's-left row's second line: what is still to do on that module. */
export const GAIN_LEFT: Record<GainModuleId, string> = {
  intro: 'Still to do: answer its CHECK YOURSELF right.',
  input: 'Still to do: set the input gain so the preamp sits in the healthy green.',
  follow: 'Still to do: answer its CHECK YOURSELF right.',
  lowhigh: 'Still to do: answer its CHECK YOURSELF right.',
  fadervsgain: 'Still to do: answer its CHECK YOURSELF right.',
  multistage: 'Still to do: balance the chain until BALANCE reads ✓ OK.',
  freeplay: 'Still to do: change the source or any stage.',
  troubleshoot: GAIN_TROUBLESHOOT_LEFT,
};
