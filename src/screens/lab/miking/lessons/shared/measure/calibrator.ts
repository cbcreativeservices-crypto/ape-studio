/**
 * THE FIELD CALIBRATOR CHECK (F11 L29–L33; measurement_mics/
 * GEOMETRY_PROPOSAL.md §3.3). Pure; tested.
 *
 * The calibrator seats over the capsule (a 1/4 in capsule through its
 * adapter) and makes a known level at 1 kHz — 94 or 114 dB (NTI-CAL). The
 * check is read BEFORE the run and AFTER it; the after value is read
 * UNADJUSTED, and drift = after − before. Whether that passes is the
 * METHOD's call: the tolerance comes from the brief the learner was handed,
 * never from a number this lab invents (L31: "not one number invented").
 *
 * The readings are a MADE-UP EXAMPLE (owner D-6B-2): each scenario is a
 * fixed, labelled story of a check — a good one, a poor seat, a missing
 * adapter, a drift — so the learner meets each fault once. Nothing is
 * measured here; nothing makes a sound.
 */
import { P_REF_PA } from '../../../../calc/calcUnits.ts';
import { CALIBRATOR } from './measureSpec.ts';

/** The pressure (Pa) of a sound pressure level (dB re 20 µPa) — the shared
 *  calculator reference (calcUnits.P_REF_PA). 94 dB ≈ 1.0024 Pa. */
export function pascalsOf(splDb: number): number {
  return P_REF_PA * Math.pow(10, splDb / 20);
}

export type CalLevel = (typeof CALIBRATOR.levels)[number];
export type Seat = 'seated' | 'loose' | 'noAdapter';
/** One labelled story of a check (a made-up example). */
export type CalScenario = {
  id: string;
  label: string;
  capsule: 'half' | 'quarter';
  /** The level the calibrator states (dB at 1 kHz). */
  stated: CalLevel;
  /** What the chain reads before the run, by how the calibrator sits. */
  pre: Readonly<Record<Seat, number | null>>;
  /** The unadjusted reading after the run (properly seated). */
  post: number;
  /** The tolerance the BRIEF gives (the method's, ± dB). */
  tolerance: number;
  brief: string;
};

/** What a reading means. `null` reading = no stable reading at all. */
export type CalVerdict = { stable: boolean; offset: number | null; within: boolean };

export function verdict(stated: number, reading: number | null, tolerance: number): CalVerdict {
  if (reading === null || !Number.isFinite(reading)) return { stable: false, offset: null, within: false };
  const offset = reading - stated;
  return { stable: true, offset, within: Math.abs(offset) <= tolerance + 1e-9 };
}

/** Drift between the before and after checks (after − before), dB. */
export function drift(pre: number, post: number): number {
  return post - pre;
}

export type CalOutcome = {
  pre: CalVerdict;
  post: CalVerdict;
  drift: number | null;
  /** Drift inside the brief's tolerance too. */
  pass: boolean;
  /** The plain next step. */
  action: string;
};

/** The whole check for a scenario, with the calibrator seated `seat` for the pre-run reading. */
export function runCheck(s: CalScenario, seat: Seat): CalOutcome {
  const preR = s.pre[seat];
  const pre = verdict(s.stated, preR, s.tolerance);
  const post = verdict(s.stated, s.post, s.tolerance);
  if (!pre.stable) {
    return { pre, post, drift: null, pass: false, action: s.capsule === 'quarter' && seat === 'noAdapter' ? 'No stable reading: a 1/4 in capsule needs the calibrator’s adapter. Fit it as the manuals direct, then check again.' : 'No stable reading: check the seat, the battery and the cable before anything else.' };
  }
  if (!pre.within) {
    return { pre, post, drift: null, pass: false, action: 'The reading before the run is off: re-seat the calibrator, check the adapter, the battery and the level setting — never turn the gain to force the number.' };
  }
  const d = drift(preR as number, s.post);
  const ok = post.within && Math.abs(d) <= s.tolerance + 1e-9;
  return {
    pre,
    post,
    drift: d,
    pass: ok,
    action: ok ? 'Both checks inside the method’s tolerance: log the stated level, both readings and the drift with the data.' : 'Outside the method’s tolerance: keep the data and the unadjusted value, and mark the run for investigation under the method’s rule — never force the display back.',
  };
}

/** The made-up checks every measurement lesson can use (the story told once each). */
export const CAL_SCENARIOS: readonly CalScenario[] = [
  {
    id: 'good',
    label: 'A clean check',
    capsule: 'half',
    stated: 94,
    pre: { seated: 94.0, loose: 92.4, noAdapter: 94.0 },
    post: 94.1,
    tolerance: 0.5,
    brief: 'A 1/2 in mic on its preamp. The calibrator says 94 dB at 1 kHz. In this exercise, the method you were handed allows ±0.5 dB.',
  },
  {
    id: 'quarter',
    label: 'A 1/4 in capsule',
    capsule: 'quarter',
    stated: 114,
    pre: { seated: 114.1, loose: 111.8, noAdapter: null },
    post: 113.9,
    tolerance: 0.5,
    brief: 'A 1/4 in mic. The calibrator is set to 114 dB at 1 kHz. In this exercise, the method you were handed allows ±0.5 dB.',
  },
  {
    id: 'drift',
    label: 'A drift after the run',
    capsule: 'half',
    stated: 94,
    pre: { seated: 94.0, loose: 92.6, noAdapter: 94.0 },
    post: 95.2,
    tolerance: 0.5,
    brief: 'A 1/2 in mic out in the cold for an afternoon. The calibrator says 94 dB at 1 kHz. In this exercise, the method you were handed allows ±0.5 dB.',
  },
];
