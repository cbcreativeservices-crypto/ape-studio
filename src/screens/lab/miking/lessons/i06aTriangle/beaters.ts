/**
 * I06a TRIANGLE — THE BEATERS in 3D (x toward the audience, y down, z the
 * player's right), so every view draws the same 215 mm rod (owner 2026-11-22:
 * "It should look like normal stick tech. usage"; from above the held beater
 * was drawn 264 mm, longer than the real one). Held: the tip on the base's
 * middle on the player's side, the grip end in the right hand, low and to the
 * right. Mounted: one beater on each lower side, the grip ends out and below.
 * The hand holds the grip end (the dark end cap). Pure (moved out of art.tsx
 * unchanged, 2026-11-24, so the player's pose module can read it).
 */
import { MOUNTED, ROD_D, TRI } from './model.ts';
import { BASE_Y } from './geometry.ts';

const BEATER = TRI.beater.mm;
export type P3 = { x: number; y: number; z: number };
export type Beater3 = { grip: P3; tip: P3 };
const beaterFrom = (tip: P3, toward: P3): Beater3 => {
  const n = Math.hypot(toward.x, toward.y, toward.z);
  return { tip, grip: { x: tip.x + (toward.x / n) * BEATER, y: tip.y + (toward.y / n) * BEATER, z: tip.z + (toward.z / n) * BEATER } };
};
/** Where the mounted beater meets its lower side (z = 46 on the near side). */
const lowSideY = (z: number) => MOUNTED.top[1] + ((MOUNTED.top[0] - Math.abs(z)) / MOUNTED.top[0]) * (MOUNTED.open[1] - MOUNTED.top[1]);
export const HELD_BEATER: Beater3 = beaterFrom({ x: -ROD_D, y: BASE_Y, z: 8 }, { x: -222, y: 85, z: 142 });
export const MOUNTED_BEATER: Beater3 = beaterFrom({ x: -ROD_D, y: lowSideY(46), z: 46 }, { x: -197, y: 86, z: 134 });
/** The other mounted beater: the first mirrored across the triangle (the player's left). */
export const mirrorZ = (p: P3): P3 => ({ ...p, z: -p.z });
