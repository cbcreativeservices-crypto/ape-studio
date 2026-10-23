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
      p: v(SITAR_TABLA_AT.x, sc.floorY - 200, SITAR_TABLA_AT.z),
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

/**
 * Collision pass 2026-10-15 (owner: "no collisions or impossible layering in
 * ANY plan"): the accompanists sit clear of the player's space (the tabla
 * beyond the sitar's neck, the mridangam beyond the veena's, the frame drum
 * beyond the oud's pegbox), each tanpura player behind, and every one of them
 * on the rug — now sized to hold them all (a concert rug or riser); the
 * wedges stand off the rug's front; the PA on the deck's front corners,
 * upstage of the audience edge. A typical layout (lutePlanModel.ts lays the
 * footprints out from these same numbers).
 */
export type LutePlanKind = 'player' | 'chair' | 'rug' | 'vocal' | 'riq' | 'tabla' | 'tanpura' | 'mridangam' | 'sidefill' | 'pa' | 'audience' | 'room';
/** `half`: a rug's half-size (u, v) about `at`. */
export type LutePlanObject = { id: string; kind: LutePlanKind; at: { x: number; z: number }; faces?: { x: number; z: number }; half?: { x: number; z: number }; scene: 'kit' | 'stage' | 'studio' | 'all'; r?: number };

/** Where the audience edge runs (z) and the PA stacks just upstage of it. */
export const LUTE_STAGE = { edgeZ: 1650, paU: [-2000, 2100], paHalf: 220, paToEdge: 40 } as const;
/** Where THE ROOM is named in the studio: open floor downstage right. */
export const LUTE_ROOM_AT = { x: 1300, z: 1500 } as const;
/** The tabla beside the sitar, beyond its neck (the tabla source in sitarWedges sits here too). */
export const SITAR_TABLA_AT = { x: 1150, z: 100 } as const;
/** The frame drum beside the oud, beyond its pegbox. */
export const OUD_RIQ_AT = { x: 1100, z: -170 } as const;
/** The mridangam beside the veena, beyond its neck end. */
export const VEENA_MRIDANGAM_AT = { x: 1450, z: 60 } as const;

function stageObjects(): LutePlanObject[] {
  const paZ = LUTE_STAGE.edgeZ - LUTE_STAGE.paToEdge - LUTE_STAGE.paHalf;
  return [
    { id: 'paL', kind: 'pa', at: { x: LUTE_STAGE.paU[0], z: paZ }, scene: 'stage', r: 300 },
    { id: 'paR', kind: 'pa', at: { x: LUTE_STAGE.paU[1], z: paZ }, scene: 'stage', r: 300 },
    { id: 'audience', kind: 'audience', at: { x: 0, z: LUTE_STAGE.edgeZ + 260 }, scene: 'stage', r: 300 },
    { id: 'room', kind: 'room', at: LUTE_ROOM_AT, scene: 'studio', r: 300 },
  ];
}

export function oudPlan(sc: LuteScene): LutePlanObject[] {
  const h = sc.fit.head.c;
  const m = sc.fit.mouth;
  return [
    { id: 'player', kind: 'player', at: { x: h.x, z: h.z }, scene: 'all', r: 320 },
    { id: 'chair', kind: 'chair', at: { x: h.x, z: h.z - 40 }, scene: 'kit', r: 220 },
    { id: 'vocal', kind: 'vocal', at: { x: m.x - 40, z: m.z + 110 }, faces: { x: m.x - 160, z: 520 }, scene: 'kit', r: 140 },
    { id: 'riq', kind: 'riq', at: OUD_RIQ_AT, scene: 'kit', r: 240 },
    ...stageObjects(),
  ];
}

export function sitarPlan(sc: LuteScene): LutePlanObject[] {
  const h = sc.fit.head.c;
  return [
    { id: 'player', kind: 'player', at: { x: h.x, z: h.z }, scene: 'all', r: 360 },
    { id: 'rug', kind: 'rug', at: { x: 425, z: -390 }, half: { x: 1425, z: 910 }, scene: 'all', r: 1100 },
    { id: 'tabla', kind: 'tabla', at: SITAR_TABLA_AT, scene: 'kit', r: 260 },
    { id: 'tanpura', kind: 'tanpura', at: { x: -250, z: -1080 }, scene: 'kit', r: 260 },
    ...stageObjects(),
  ];
}

export function veenaPlan(sc: LuteScene): LutePlanObject[] {
  const h = sc.fit.head.c;
  return [
    { id: 'player', kind: 'player', at: { x: h.x, z: h.z }, scene: 'all', r: 360 },
    { id: 'rug', kind: 'rug', at: { x: 740, z: -275 }, half: { x: 1460, z: 835 }, scene: 'all', r: 1100 },
    { id: 'mridangam', kind: 'mridangam', at: VEENA_MRIDANGAM_AT, scene: 'kit', r: 340 },
    { id: 'tanpura', kind: 'tanpura', at: { x: 780, z: -930 }, scene: 'kit', r: 260 },
    { id: 'sidefill', kind: 'sidefill', at: { x: -1500, z: 250 }, faces: { x: 1, z: -0.2 }, scene: 'stage', r: 260 },
    ...stageObjects(),
  ];
}

/** The plain hearing line (the research's "add the hearing line" fix, C13–C15). */
export const LUTE_HEARING =
  'Protect your hearing during soundcheck and long sessions. NIOSH advises no more than 85 dBA averaged over an 8-hour day, halving the time for every 3 dB above that; the US legal limit (OSHA) is 90 dBA with a 5 dB rule. These are limits for PEOPLE, measured where a person listens — not a microphone’s rating. Monitors and a percussion section reach far higher than the instrument alone: keep levels and time down, and use hearing protection.';
