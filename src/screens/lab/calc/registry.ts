/**
 * Calculator Lab registry — the launch workspaces (owner spec 2026-07-29)
 * grouped into sections, PLUS the full second-tier and advanced-tier buildout
 * (owner 2026-08-07): all 28 roadmap calculators are now built and live, so
 * COMING_SOON is empty. New workspace files only need an import + array spread
 * here; workflowCatalog flattens WORKSPACES automatically.
 */
import type { CalcSectionId, Workspace } from './calcTypes';
import { WS_WAVE } from './workspaces/wave';
import { WORKSPACES_TIME } from './workspaces/timePhase';
import { WORKSPACES_LEVELS } from './workspaces/levels';
import { WORKSPACES_SPL } from './workspaces/splSafety';
import { WORKSPACES_SPEAKERS } from './workspaces/speakers';
import { WORKSPACES_ROOMS_MUSIC } from './workspaces/roomsMusic';
// Second-tier + advanced buildout (owner 2026-08-07).
import { WORKSPACES_ROOMS_SECOND } from './workspaces/roomsSecond';
import { WORKSPACES_ROOMS_ADVANCED } from './workspaces/roomsAdvanced';
import { WORKSPACES_POWER_ELEC } from './workspaces/powerElec';
import { WORKSPACES_SPEAKERS_ADV } from './workspaces/speakersAdv';
import { WORKSPACES_DIGITAL_ADV } from './workspaces/digitalAdv';
import { WORKSPACES_MICS_RF } from './workspaces/micsRf';
import { WORKSPACES_LOUDNESS } from './workspaces/loudness';
import { WORKSPACES_WAVES_ADV } from './workspaces/wavesAdv';

export const WORKSPACES: Workspace[] = [
  WS_WAVE,
  ...WORKSPACES_TIME,
  ...WORKSPACES_LEVELS,
  ...WORKSPACES_SPL,
  ...WORKSPACES_SPEAKERS,
  ...WORKSPACES_ROOMS_MUSIC,
  ...WORKSPACES_ROOMS_SECOND,
  ...WORKSPACES_ROOMS_ADVANCED,
  ...WORKSPACES_POWER_ELEC,
  ...WORKSPACES_SPEAKERS_ADV,
  ...WORKSPACES_DIGITAL_ADV,
  ...WORKSPACES_MICS_RF,
  ...WORKSPACES_LOUDNESS,
  ...WORKSPACES_WAVES_ADV,
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

/** Post-launch roadmap — now fully built (owner buildout 2026-08-07), so this
 *  is empty and the "IN DEVELOPMENT" strip renders nothing. Kept as an export
 *  so CalcLabScreen's import stays valid and future roadmap items have a home. */
export const COMING_SOON: { title: string; items: string[] }[] = [];
