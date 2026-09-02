/**
 * EAR_MODULES — the Ear Training Lab's module registry (spec §3).
 *
 * Modules land in waves (spec §6); the registry only ever lists what is
 * actually built, so the lab is shippable after every wave.
 *
 * Free/member split: spec §3 recommends M1 (level 1), M4 and M7 as the free
 * taste — OWNER DECIDES. V1 approximates that as whole-module flags below.
 */
import type { EarModule, EarModuleId } from '../earTypes';
import { M1_FREQUENCY, M2_EQ, M3_BAND, M4_NOISE } from './tone';
import { M7_LOUDNESS, M10_COMPRESSION, M14_CLIPPING } from './dynamics';
import { M8_DELAY, M9_REVERB, M12_POLARITY, M13_COMB } from './time';
import { M5_DEFECTS } from './defects';
import { M6_STEREO } from './spatial';
import { M11_PITCH } from './pitch';

export type EarFamily = 'tone' | 'dynamics' | 'time' | 'space' | 'defect' | 'pitch';

export type EarModuleEntry = EarModule & { family: EarFamily; member: boolean };

export const EAR_MODULES: EarModuleEntry[] = [
  { ...M1_FREQUENCY, family: 'tone', member: false },
  { ...M2_EQ, family: 'tone', member: true },
  { ...M3_BAND, family: 'tone', member: true },
  { ...M4_NOISE, family: 'tone', member: false },
  { ...M5_DEFECTS, family: 'defect', member: true },
  { ...M6_STEREO, family: 'space', member: true },
  { ...M7_LOUDNESS, family: 'dynamics', member: false },
  { ...M8_DELAY, family: 'time', member: true },
  { ...M9_REVERB, family: 'time', member: true },
  { ...M10_COMPRESSION, family: 'dynamics', member: true },
  { ...M11_PITCH, family: 'pitch', member: true },
  { ...M12_POLARITY, family: 'time', member: true },
  { ...M13_COMB, family: 'time', member: true },
  { ...M14_CLIPPING, family: 'dynamics', member: true },
];

export function earModuleById(id: EarModuleId): EarModuleEntry | undefined {
  return EAR_MODULES.find((m) => m.id === id);
}
