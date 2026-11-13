/**
 * hudB — instrument strips: output, wall, music, lines. Contract: gaHudTypes.ts.
 *
 *   output  pages 13 and 3   what reaches each ear          bOutput.tsx
 *   wall    page 12          the wall's filter and level,   bWall.tsx
 *                            the room's reverb
 *   music   pages 14 and 22  the four bars, in time         bMusic.tsx
 *   lines   page 15          one line at a time, one file   bLines.tsx
 *                            for each language
 *
 * What each strip reads is in bModel.ts (pure, tested: test/gameAudioHudB);
 * the shared glass and type are in bKit.tsx; the frame clock and the event
 * tracker are in bClock.ts.
 */
import type { GaHudMap } from './gaHudTypes';
import { BLinesHud } from './bLines';
import { BMusicHud } from './bMusic';
import { BOutputHud } from './bOutput';
import { BWallHud } from './bWall';

export const GA_HUDS_B: GaHudMap = {
  output: BOutputHud,
  wall: BWallHud,
  music: BMusicHud,
  lines: BLinesHud,
};
