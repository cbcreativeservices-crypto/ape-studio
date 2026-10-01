import type { ComponentType } from 'react';
import type { MasteringModuleId } from '../masteringContent';
import type { ModuleProps } from './shared';
import { Mod1What } from './mod1What';
import { Mod2Roles } from './mod2Roles';
import { Mod3Room } from './mod3Room';
import { Mod4Tools } from './mod4Tools';
import { Mod5Workflow } from './mod5Workflow';
import { Mod6Loudness } from './mod6Loudness';
import { Mod7Release } from './mod7Release';
import { Mod8Project } from './mod8Project';

export type MasteringModuleComponent = ComponentType<ModuleProps & {
  onQcComplete: (complete: boolean) => void;
  /** Module 8's persisted ticks (host-owned, guest rule applied). */
  savedChecks?: readonly string[];
  savedQc?: readonly string[];
  onProjectState?: (checks: string[], qc: string[]) => void;
}>;

/** Steps per module — static, so PREV on a module's first step can land on
 *  the previous module's LAST step (cognitive review finding 18). Pinned
 *  against the module files by test/masteringLabStructure.test.ts. */
export const MASTERING_STEP_COUNTS: Record<MasteringModuleId, number> = {
  what: 5, roles: 4, room: 5, tools: 5, workflow: 5, loudness: 6, release: 4, project: 5,
};

/** The step that EARNS a module's credit — its PRACTICE deck (Module 8: the
 *  track decisions, then the QC checklist). The what's-left screen jumps
 *  straight to it (owner: each outstanding item links straight to it), not
 *  to the module's first step. Pinned against the module files by
 *  test/masteringLabStructure.test.ts. */
export const MASTERING_CREDIT_STEP: Record<MasteringModuleId, number> = {
  what: 3, roles: 2, room: 3, tools: 3, workflow: 3, loudness: 4, release: 2, project: 1,
};
export const MASTERING_PROJECT_QC_STEP = 4;

export const MASTERING_MODULE_COMPONENTS: Record<MasteringModuleId, MasteringModuleComponent> = {
  what: Mod1What,
  roles: Mod2Roles,
  room: Mod3Room,
  tools: Mod4Tools,
  workflow: Mod5Workflow,
  loudness: Mod6Loudness,
  release: Mod7Release,
  project: Mod8Project,
};
