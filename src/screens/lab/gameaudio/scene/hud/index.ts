/**
 * The Game Audio lab's instrument strips, by id (contract: gaHudTypes.ts).
 * A page names one in its GaRack spec (`hud`); an id with no strip yet draws
 * nothing.
 */
import { GA_HUDS_A } from './hudA';
import { GA_HUDS_B } from './hudB';
import { GA_HUDS_C } from './hudC';
import type { GaHudMap } from './gaHudTypes';

export const GA_HUDS: GaHudMap = { ...GA_HUDS_A, ...GA_HUDS_B, ...GA_HUDS_C };
export { GA_HUD_H, GA_HUD_H_FULL, type GaHudId, type GaHudProps } from './gaHudTypes';
