/**
 * A06's place in the woodwind section plan (WindPlan draws it; the plans'
 * overlap test reads it): its own seat and its own drawing per variant.
 */
import type { WindPlanConfig } from '../shared/woodwinds/windPlanModel.ts';
import { layoutOf } from './geometry.ts';

export const A06_PLAN: WindPlanConfig = { own: 'fl1', layoutOf, ownLabel: 'FLUTE 1 · THIS LESSON' };
