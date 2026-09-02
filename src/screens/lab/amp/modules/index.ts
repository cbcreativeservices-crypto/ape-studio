/**
 * Module component map — all eight modules. Content for every module lives
 * in features/amp/ampContent.ts; each component here is its interactions.
 */
import type { ComponentType } from 'react';
import type { AmpModuleId } from '../../../../features/amp/ampContent';
import { Mod1What } from './mod1What';
import { Mod2Devices } from './mod2Devices';
import { Mod3Bias } from './mod3Bias';
import { Mod4Classes } from './mod4Classes';
import { Mod5ClassD } from './mod5ClassD';
import { Mod6Supply } from './mod6Supply';
import { Mod7RealWorld } from './mod7RealWorld';
import { Mod8Apply } from './mod8Apply';

export type AmpModuleProps = {
  /** Module 8 reports when the final assessment has been submitted. */
  onFinalSubmitted?: () => void;
};

export const AMP_MODULE_COMPONENTS: Partial<Record<AmpModuleId, ComponentType<AmpModuleProps>>> = {
  what: Mod1What,
  devices: Mod2Devices,
  bias: Mod3Bias,
  classes: Mod4Classes,
  classd: Mod5ClassD,
  supply: Mod6Supply,
  realworld: Mod7RealWorld,
  apply: Mod8Apply,
};

export const BUILT_MODULE_IDS = Object.keys(AMP_MODULE_COMPONENTS) as AmpModuleId[];
