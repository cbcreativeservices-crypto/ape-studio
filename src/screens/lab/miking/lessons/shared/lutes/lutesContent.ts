/**
 * The lute family's stage sources and setting plan (lesson frame, engine
 * coordinates). Positions are a TYPICAL layout — no source gives them (each
 * `prov` says so, internally); the plan page badges them as typical. The
 * checks whose reasoning is the same on every plucked string (hearing,
 * power, patterns, polarity, gain, a second path) come from the guitar
 * family's stringsContent.ts — written once, reused here.
 */
import type { Provenance, Vec3, Wedge } from '../../../engine/model/types.ts';
import type { LuteScene } from './luteModel.ts';

const STAGE: Provenance = { kind: 'illustrative', reason: 'a typical stage layout; no source gives the positions' };
const v = (x: number, y: number, z: number): Vec3 => ({ x, y, z });

/** The oud's: a floor wedge downstage facing the player, and the player's voice. */
export function oudWedges(sc: LuteScene): Wedge[] {
  return [
    {
      id: 'wedge',
      label: 'the player’s floor wedge, downstage, facing the player',
      short: 'WEDGE',
      p: v(150, sc.floorY, 1200),
      lift: 150,
      faces: v(0, 0, -1),
      note: 'In front of the player on the floor, facing back at them. A mic aimed at the oud has it behind and below — where a pattern’s rejection can help.',
      prov: STAGE,
    },
    {
      id: 'voice',
      label: 'the player’s own voice (a singing oud player)',
      short: 'VOICE',
      p: sc.fit.mouth,
      lift: 0,
      faces: v(0, 0, 1),
      note: 'Above and behind the oud mic’s front: in the front half of any pattern aimed at the oud, so no null reaches it. Plan the balance instead.',
      prov: STAGE,
      glyph: 'none',
    },
  ];
}

/** The sitar's: a floor wedge in front, and the tabla beside the player. */
export function sitarWedges(sc: LuteScene): Wedge[] {
  return [
    {
      id: 'wedge',
      label: 'the player’s floor wedge, in front, facing the player',
      short: 'WEDGE',
      p: v(120, sc.floorY, 1150),
      lift: 150,
      faces: v(0, 0, -1),
      note: 'In front of the player on the floor, facing back at them. A mic aimed at the board has it behind and below — where a pattern’s rejection can help.',
      prov: STAGE,
    },
    {
      id: 'tabla',
      label: 'the tabla, beside the player',
      short: 'TABLA',
      p: v(920, sc.floorY - 200, 100),
      lift: 0,
      faces: v(-1, 0, 0),
      note: 'Beside the sitar, at the mic’s side. Turning the mic changes the sitar’s tone too: distance, balance and the tabla’s own mics do more than a null here.',
      prov: STAGE,
      glyph: 'none',
    },
  ];
}

/** The veena's: a side-fill monitor on a stand, and a floor wedge in front. */
export function veenaWedges(sc: LuteScene): Wedge[] {
  return [
    {
      id: 'sidefill',
      label: 'a side-fill monitor on a stand, at the player’s right',
      short: 'SIDE-FILL',
      p: v(-1500, sc.floorY, 250),
      lift: 850,
      faces: v(1, 0, -0.2),
      note: 'On a stand at the player’s right, its box about head height, facing in. A mic looking down at the veena has its rear toward the ceiling and that side — where a pattern’s rejection can reach.',
      prov: STAGE,
      glyph: 'none',
    },
    {
      id: 'wedge',
      label: 'a floor wedge in front of the player',
      short: 'FLOOR WEDGE',
      p: v(60, sc.floorY, 850),
      lift: 150,
      faces: v(0, 0, -1),
      note: 'Low and in front. A mic looking DOWN at the veena has this wedge off to its side and front — no null of this pattern reaches it. Keep its level down, or use the side-fill.',
      prov: STAGE,
    },
  ];
}

/* ── the setting plan ── */

export type LutePlanKind = 'player' | 'chair' | 'rug' | 'vocal' | 'riq' | 'tabla' | 'tanpura' | 'mridangam' | 'sidefill' | 'pa' | 'audience' | 'room';
export type LutePlanObject = { id: string; kind: LutePlanKind; at: { x: number; z: number }; faces?: { x: number; z: number }; scene: 'kit' | 'stage' | 'studio' | 'all'; r?: number };

export function oudPlan(sc: LuteScene): LutePlanObject[] {
  const h = sc.fit.head.c;
  const m = sc.fit.mouth;
  return [
    { id: 'player', kind: 'player', at: { x: h.x, z: h.z }, scene: 'all', r: 320 },
    { id: 'chair', kind: 'chair', at: { x: h.x, z: h.z - 40 }, scene: 'kit', r: 220 },
    { id: 'vocal', kind: 'vocal', at: { x: m.x - 40, z: m.z + 110 }, faces: { x: m.x - 160, z: 520 }, scene: 'kit', r: 140 },
    { id: 'riq', kind: 'riq', at: { x: 1000, z: -170 }, scene: 'kit', r: 240 },
    { id: 'paL', kind: 'pa', at: { x: -2000, z: 1950 }, scene: 'stage', r: 300 },
    { id: 'paR', kind: 'pa', at: { x: 2100, z: 1950 }, scene: 'stage', r: 300 },
    { id: 'audience', kind: 'audience', at: { x: 0, z: 1650 }, scene: 'stage', r: 300 },
    { id: 'room', kind: 'room', at: { x: -2100, z: -2250 }, scene: 'studio', r: 300 },
  ];
}

export function sitarPlan(sc: LuteScene): LutePlanObject[] {
  const h = sc.fit.head.c;
  return [
    { id: 'player', kind: 'player', at: { x: h.x, z: h.z }, scene: 'all', r: 360 },
    { id: 'rug', kind: 'rug', at: { x: 350, z: -250 }, scene: 'all', r: 1100 },
    { id: 'tabla', kind: 'tabla', at: { x: 920, z: 100 }, scene: 'kit', r: 260 },
    { id: 'tanpura', kind: 'tanpura', at: { x: -330, z: -930 }, scene: 'kit', r: 260 },
    { id: 'paL', kind: 'pa', at: { x: -2000, z: 1950 }, scene: 'stage', r: 300 },
    { id: 'paR', kind: 'pa', at: { x: 2100, z: 1950 }, scene: 'stage', r: 300 },
    { id: 'audience', kind: 'audience', at: { x: 0, z: 1650 }, scene: 'stage', r: 300 },
    { id: 'room', kind: 'room', at: { x: -2100, z: -2250 }, scene: 'studio', r: 300 },
  ];
}

export function veenaPlan(sc: LuteScene): LutePlanObject[] {
  const h = sc.fit.head.c;
  return [
    { id: 'player', kind: 'player', at: { x: h.x, z: h.z }, scene: 'all', r: 360 },
    { id: 'rug', kind: 'rug', at: { x: 400, z: -250 }, scene: 'all', r: 1100 },
    { id: 'mridangam', kind: 'mridangam', at: { x: 1280, z: 60 }, scene: 'kit', r: 340 },
    { id: 'tanpura', kind: 'tanpura', at: { x: 780, z: -930 }, scene: 'kit', r: 260 },
    { id: 'sidefill', kind: 'sidefill', at: { x: -1500, z: 250 }, faces: { x: 1, z: -0.2 }, scene: 'stage', r: 260 },
    { id: 'paL', kind: 'pa', at: { x: -2000, z: 1950 }, scene: 'stage', r: 300 },
    { id: 'paR', kind: 'pa', at: { x: 2100, z: 1950 }, scene: 'stage', r: 300 },
    { id: 'audience', kind: 'audience', at: { x: 0, z: 1650 }, scene: 'stage', r: 300 },
    { id: 'room', kind: 'room', at: { x: -2100, z: -2250 }, scene: 'studio', r: 300 },
  ];
}

/** The plain hearing line (the research's "add the hearing line" fix, C13–C15). */
export const LUTE_HEARING =
  'Protect your hearing during soundcheck and long sessions. A widely used guideline: no more than 85 dBA averaged over an 8-hour day, and halve the time for every 3 dBA above that. It is a limit for PEOPLE, measured where a person listens — not a microphone’s rating. Monitors and a percussion section reach far higher than the instrument alone: keep levels and time down, and use hearing protection.';
