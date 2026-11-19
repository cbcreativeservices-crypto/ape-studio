// GENERATED COPY of the app file named below. Do not edit here.
// Change the app file, then run: node scripts/sync-career-finder-web.mjs
// Source: src/features/careerfinder/labsForDimension.ts
/**
 * Audio Career Finder — "try a lab" bridge (learning review 2026-09-04).
 *
 * One existing Academy lab per activity dimension, so the results page can
 * turn "you said you would enjoy X" into a first hands-on step. Routes are
 * registered in src/navigation/RootNavigator.tsx; member-only labs preview
 * rather than block (LabPreviewOverlay), so every link is safe to follow.
 *
 * Pure data: no React, no React Native.
 */
import type { DimensionCode } from './dimensions';

export type LabLink = { route: string; title: string; why: string };

// Seven `why` lines reworded (Comp A text review 2026-11-14, CF-A0605–A0625): knowledge, not
// skill promises (house rule), and no claim that an in-app lab is hands-on with hardware.
export const LAB_FOR_DIMENSION: Record<DimensionCode, LabLink> = {
  CP: { route: 'OscillatorLab', title: 'Oscillator Lab', why: 'shape a sound from nothing' },
  RC: { route: 'MicSelectLab', title: 'Microphone Selection Lab', why: 'choose and place the right mic' },
  ER: { route: 'EqLabHome', title: 'EQ Lab', why: 'hear what a mix decision does' },
  MS: { route: 'EnvelopeLab', title: 'Sound Envelope & Transients Lab', why: 'see how a sound starts, holds and fades' },
  LO: { route: 'SignalChainLab', title: 'Signal Chain Lab', why: 'find the fault while the show runs' },
  SD: { route: 'CableInstallLab', title: 'Cable Dressing & Installation Lab', why: 'see the install decisions a pro makes' },
  BM: { route: 'CableLab', title: 'Cable & Connector Fundamentals', why: 'learn the cables and connectors pros use' },
  DA: { route: 'DigitalLab', title: 'Digital Audio Lab', why: 'see sampling and bits do their work' },
  AR: { route: 'MeterLab', title: 'Visual Audio Analysis Lab', why: 'see how an analyst reads a measurement' },
  HC: { route: 'EarTrainingLab', title: 'Ear Training Lab', why: 'hear the pitch and level differences hearing work deals with' },
  TE: { route: 'FoundationsCourse', title: 'Foundations of Sound', why: 'the basics every audio course starts with' },
  BO: { route: 'CalcLab', title: 'Audio Calculators Lab', why: 'the numbers behind a quote or a spec' },
  PC: { route: 'TubeReference', title: 'Vacuum Tube Reference', why: 'a curated collection, organized the way an archive is' },
  GS: { route: 'GainLabHome', title: 'Gain Staging Lab', why: 'see how signal level is kept right at every stage' },
};
