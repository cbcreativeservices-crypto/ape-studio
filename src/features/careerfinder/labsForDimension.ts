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
import type { RootStackParamList } from '../../navigation/types';
import type { DimensionCode } from './dimensions';

export type LabLink = { route: keyof RootStackParamList; title: string; why: string };

export const LAB_FOR_DIMENSION: Record<DimensionCode, LabLink> = {
  CP: { route: 'OscillatorLab', title: 'Oscillator Lab', why: 'shape a sound from nothing' },
  RC: { route: 'MicSelectLab', title: 'Microphone Selection Lab', why: 'choose and place the right mic' },
  ER: { route: 'EqLabHome', title: 'EQ Lab', why: 'hear what a mix decision does' },
  MS: { route: 'EnvelopeLab', title: 'Sound Envelope & Transients Lab', why: 'how a sound tells a story in time' },
  LO: { route: 'SignalChainLab', title: 'Signal Chain Lab', why: 'find the fault while the show runs' },
  SD: { route: 'CableInstallLab', title: 'Cable Dressing & Installation Lab', why: 'make install decisions a pro would' },
  BM: { route: 'CableLab', title: 'Cable & Connector Fundamentals', why: 'get hands-on with the hardware' },
  DA: { route: 'DigitalLab', title: 'Digital Audio Lab', why: 'see sampling and bits do their work' },
  AR: { route: 'MeterLab', title: 'Visual Audio Analysis Lab', why: 'read a measurement like an analyst' },
  HC: { route: 'EarTrainingLab', title: 'Ear Training Lab', why: 'train the listening that hearing work depends on' },
  TE: { route: 'FoundationsCourse', title: 'Foundations of Sound', why: 'the course you would teach from' },
  BO: { route: 'CalcLab', title: 'Audio Calculators Lab', why: 'the numbers behind a quote or a spec' },
  PC: { route: 'TubeReference', title: 'Vacuum Tube Reference', why: 'a curated collection, the way an archive is' },
  GS: { route: 'GainLabHome', title: 'Gain Staging Lab', why: 'keep a signal inside the rules at every stage' },
};
