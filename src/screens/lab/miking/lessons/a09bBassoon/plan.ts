/**
 * A09b's place in the woodwind section plan (WindPlan draws it; the plans'
 * overlap test reads it): its own seat and its own drawing per variant.
 */
import type { WindPlanConfig } from '../shared/woodwinds/windPlanModel.ts';
import { layoutOf } from './geometry.ts';

export const A09B_PLAN: WindPlanConfig = { own: 'bsn1', layoutOf, ownLabel: 'BASSOON 1 · THIS LESSON' };
