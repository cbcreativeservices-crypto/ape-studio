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
  { id: 'multistage', title: 'Multiple Gain Stages', blurb: 'A rack of real devices — clip LEDs outside, Signal X-Ray to see inside every box.', section: 'explore' },
  { id: 'freeplay', title: 'Free Practice', blurb: 'Even the source is yours — feed the rig anything, nothing is graded.', section: 'explore' },
  { id: 'troubleshoot', title: 'Troubleshooting Challenge', blurb: 'Only the master is visible — and it’s clipping. Inspect stage by stage and find it.', section: 'challenge' },
];
