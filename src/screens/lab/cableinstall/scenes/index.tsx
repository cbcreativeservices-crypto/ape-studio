/**
 * Cable Dressing & Installation Lab — scene registry: module id → body.
 * Only the active stage mounts (host renders exactly one).
 */
import type { ComponentType } from 'react';
import type { CiModuleId, CiModuleProps } from '../registry';
import { WhyScene } from './WhyScene';
import { KnowScene } from './KnowScene';
import { RouteScene } from './RouteScene';
import { MechScene } from './MechScene';
import { SupportsScene } from './SupportsScene';
import { RackScene } from './RackScene';
import { WallsScene } from './WallsScene';
import { CeilingScene } from './CeilingScene';
import { FloorScene } from './FloorScene';
import { EmiScene } from './EmiScene';
import { FireScene } from './FireScene';
import { LabelScene } from './LabelScene';
import { InspectScene } from './InspectScene';

export const MODULE_BODIES: Record<CiModuleId, ComponentType<CiModuleProps>> = {
  why: WhyScene,
  know: KnowScene,
  route: RouteScene,
  mech: MechScene,
  supports: SupportsScene,
  rack: RackScene,
  walls: WallsScene,
  ceiling: CeilingScene,
  floor: FloorScene,
  emi: EmiScene,
  fire: FireScene,
  label: LabelScene,
  inspect: InspectScene,
};
