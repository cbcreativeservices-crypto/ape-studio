/**
 * Module component map — only BUILT modules are listed, so the lab is
 * shippable after every phase (home lists what is here; content for all
 * eight lives in features/amp/ampContent.ts).
 */
import type { ComponentType } from 'react';
import type { AmpModuleId } from '../../../../features/amp/ampContent';
import { Mod1What } from './mod1What';
import { Mod2Devices } from './mod2Devices';
import { Mod3Bias } from './mod3Bias';

export const AMP_MODULE_COMPONENTS: Partial<Record<AmpModuleId, ComponentType<{}>>> = {
  what: Mod1What,
  devices: Mod2Devices,
  bias: Mod3Bias,
};

export const BUILT_MODULE_IDS = Object.keys(AMP_MODULE_COMPONENTS) as AmpModuleId[];
