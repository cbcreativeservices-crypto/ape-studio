/**
 * EQ Lab module registry (owner spec 2026-08-07 — docs/APE_EQ_LAB_SPEC_2026_08_07.md).
 * The lab's visible IA is LEARN / EXPLORE / TRAIN / CHALLENGE; the educational
 * progression is SEE → MANIPULATE → HEAR → IDENTIFY → CORRECT.
 *
 * LIVE modules carry an id + component (EqModuleScreen). PLANNED modules are
 * listed honestly as IN DEVELOPMENT on the lab home (same grammar as the lab
 * catalog's dev placeholders) and gain ids as they're built — slice 1 ships
 * only "Seeing Frequency" (spec lessons 1+3, the signature moment).
 */

export type EqSection = 'learn' | 'explore' | 'train' | 'challenge';

export const EQ_SECTION_META: { id: EqSection; title: string; note: string }[] = [
  { id: 'learn', title: 'LEARN', note: 'Frequency & spectrum · EQ parameters · filter types · slope & bandwidth.' },
  { id: 'explore', title: 'EXPLORE', note: 'Hands-on EQs against real and example signals.' },
  { id: 'train', title: 'TRAIN', note: 'Find it, match it, fix it.' },
  { id: 'challenge', title: 'CHALLENGE', note: 'Practical problems — you decide what to change.' },
];

export type EqModuleId = 'spectrum';

export type EqModuleDef = {
  id: EqModuleId;
  title: string;
  blurb: string;
  section: EqSection;
};

/** Modules that are BUILT — routable via EqModule { id }. */
export const EQ_MODULES: EqModuleDef[] = [
  {
    id: 'spectrum',
    title: 'Seeing Frequency',
    blurb:
      'Live spectrum from your phone microphone — look below 100 Hz, then cover that region with a low-cut filter.',
    section: 'learn',
  },
];

/** Modules on the approved roadmap, not yet built — shown dimmed with an IN
 *  DEVELOPMENT badge (never tappable; honesty rule). Order = spec lesson order. */
export const EQ_PLANNED: { title: string; blurb: string; section: EqSection }[] = [
  { title: 'Why We Use EQ', blurb: 'Boost, cut, and the balance of frequency content.', section: 'learn' },
  { title: 'The Camera Analogy', blurb: 'Fixed → semi-parametric → fully parametric. Move = frequency, zoom = Q.', section: 'learn' },
  { title: 'Parametric Controls', blurb: 'Frequency · Gain · Q — one band, live response graph.', section: 'learn' },
  { title: 'Q & Bandwidth', blurb: 'Higher Q = narrower. Q and octave bandwidth, side by side.', section: 'learn' },
  { title: 'Filter Shapes', blurb: 'Bell, shelves, high-pass, low-pass, notch — manipulate each one.', section: 'learn' },
  { title: 'Filter Slopes', blurb: '6 → 48 dB/octave overlaid, cutoff held constant.', section: 'learn' },
  { title: 'Graphic vs. Parametric', blurb: 'Fixed bands vs full control — why pros reach for each.', section: 'learn' },
  { title: 'Multi-Band Parametric', blurb: 'Four bands + filters; individual curves and the combined response.', section: 'explore' },
  { title: 'Graphic EQ', blurb: '1-octave and 1/3-octave — and what the sliders really do.', section: 'explore' },
  { title: 'Live Spectrum + EQ', blurb: 'Your room’s spectrum with the EQ response overlaid.', section: 'explore' },
  { title: 'Find the Frequency', blurb: 'Something is wrong with this signal. Find it.', section: 'train' },
  { title: 'Match the Curve', blurb: 'Recreate the gray target response — scored.', section: 'train' },
  { title: 'Fix the Signal', blurb: 'Diagnose and correct — nobody tells you which control.', section: 'train' },
  { title: 'EQ Challenges', blurb: 'Boost vs cut, smooth vs jagged, and more.', section: 'challenge' },
];
