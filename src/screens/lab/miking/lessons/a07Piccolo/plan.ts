/**
 * A07's place in the woodwind section plan (WindPlan draws it; the plans'
 * overlap test reads it): its own seat and its own drawing per variant —
 * seated at the end of the flutes in every variant.
 */
import type { WindPlanConfig } from '../shared/woodwinds/windPlanModel.ts';
import { SEATED } from './geometry.ts';

export const A07_PLAN: WindPlanConfig = { own: 'picc', layoutOf: () => SEATED, ownLabel: 'PICCOLO · THIS LESSON' };
