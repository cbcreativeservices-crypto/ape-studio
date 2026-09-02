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

export type EarFamily = 'tone' | 'dynamics' | 'time' | 'space' | 'defect' | 'pitch';

export type EarModuleEntry = EarModule & { family: EarFamily; member: boolean };

export const EAR_MODULES: EarModuleEntry[] = [
  { ...M1_FREQUENCY, family: 'tone', member: false },
  { ...M2_EQ, family: 'tone', member: true },
  { ...M3_BAND, family: 'tone', member: true },
  { ...M4_NOISE, family: 'tone', member: false },
  { ...M7_LOUDNESS, family: 'dynamics', member: false },
  { ...M10_COMPRESSION, family: 'dynamics', member: true },
  { ...M14_CLIPPING, family: 'dynamics', member: true },
];

export function earModuleById(id: EarModuleId): EarModuleEntry | undefined {
  return EAR_MODULES.find((m) => m.id === id);
}
