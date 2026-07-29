/**
 * Calculator Lab registry — the 25 LAUNCH workspaces (owner spec 2026-07-29)
 * grouped into sections, plus the post-launch tiers listed honestly as
 * IN DEVELOPMENT (Second Tier, Advanced Tier — the owner's roadmap of record;
 * see docs/APE_CALC_LAB roadmap note + project memory).
 */
import type { CalcSectionId, Workspace } from './calcTypes';
import { WS_WAVE } from './workspaces/wave';
import { WORKSPACES_TIME } from './workspaces/timePhase';
import { WORKSPACES_LEVELS } from './workspaces/levels';
import { WORKSPACES_SPL } from './workspaces/splSafety';
import { WORKSPACES_SPEAKERS } from './workspaces/speakers';
import { WORKSPACES_ROOMS_MUSIC } from './workspaces/roomsMusic';

export const WORKSPACES: Workspace[] = [
  WS_WAVE,
  ...WORKSPACES_TIME,
  ...WORKSPACES_LEVELS,
  ...WORKSPACES_SPL,
  ...WORKSPACES_SPEAKERS,
  ...WORKSPACES_ROOMS_MUSIC,
];

export function getWorkspace(id: string): Workspace | undefined {
  return WORKSPACES.find((w) => w.id === id);
}

export const SECTION_META: { id: CalcSectionId; title: string; note: string }[] = [
  { id: 'waves', title: 'WAVES & TIME', note: 'Frequency, wavelength, delay, phase — the physics under everything.' },
  { id: 'levels', title: 'LEVELS & DECIBELS', note: 'dB, references, ratios, gain structure.' },
  { id: 'spl', title: 'SPL & HEARING SAFETY', note: 'Sound pressure, source addition, exposure.' },
  { id: 'speakers', title: 'SPEAKERS & POWER', note: 'Sensitivity, amplifier power, impedance, cable, 70 V.' },
  { id: 'mics', title: 'MICS & RECORDING', note: 'From SPL at the capsule to level at the converter.' },
  { id: 'digital', title: 'DIGITAL AUDIO', note: 'Samples, storage, latency, resolution.' },
  { id: 'music', title: 'MUSIC & PRODUCTION', note: 'Tempo, note values, pitch and cents.' },
  { id: 'rooms', title: 'ROOMS & ACOUSTICS', note: 'Modes, reverberation, treatment.' },
  { id: 'filters', title: 'FILTERS & EQ', note: 'Q, bandwidth, band edges.' },
  { id: 'electronics', title: 'ELECTRONICS', note: 'Ohm’s law, dividers, reactance.' },
];

/** Post-launch roadmap — shown dimmed with an IN DEVELOPMENT badge. */
export const COMING_SOON: { title: string; items: string[] }[] = [
  {
    title: 'SECOND TIER — IN DEVELOPMENT',
    items: [
      'Critical Distance', 'Schroeder Frequency', 'Boundary Interference', 'Reflection Path',
      'Stereo-Mic Geometry', 'Analog Alignment', 'Clock Drift', 'Network-Audio Bandwidth',
      'Crossover Components', 'Transformer Ratios', 'Pads & Attenuators', 'Mic Sensitivity Converter',
      'Voltage Drop', 'Rack Power & Heat', 'Timecode', 'Loudness Normalization', 'RF & Link Budget',
    ],
  },
  {
    title: 'ADVANCED TIER — IN DEVELOPMENT',
    items: [
      'Eyring & Millington–Sette RT', 'QRD & Primitive-Root Diffusers', 'Panel & Helmholtz Absorbers',
      'Complex Impedance', 'FIR Filter Length', 'Convolution Resources', 'Intermodulation Products',
      'Transmission-Loss Estimates', 'Loudness & True-Peak Analysis (ITU-R BS.1770-5)',
      'Line-Array / Polar-Data Calculations', 'Driver Excursion & Enclosures',
    ],
  },
];
