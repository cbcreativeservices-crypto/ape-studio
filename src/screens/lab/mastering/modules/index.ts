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

export type MasteringModuleComponent = ComponentType<ModuleProps & { onQcComplete: (complete: boolean) => void }>;

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
