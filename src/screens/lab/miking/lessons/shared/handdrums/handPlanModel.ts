/**
 * THE SETTING's band plan (HandPlan.tsx draws it) — pure, so the plans'
 * overlap test reads the same numbers the drawing uses. Shared by the
 * hand-drum family (M04a–M05), the small-percussion station plans (I02–I05d)
 * and the mallet-bar plans (I07–I10).
 *
 * Frame: the lesson's own instrument (the 'drums' thing) at its anchor, u
 * toward the audience (right), v across (down), mm. Positions are a typical
 * layout, ILLUSTRATIVE (never a measurement).
 *
 * Collision pass 2026-10-15 (owner: "no collisions or impossible layering in
 * ANY plan"): every neighbour's true footprint is here, from the same sizes
 * the drawing uses; the PA stacks stand on the deck's downstage corners
 * inside the plan; the studio room is the plan box inset by its wall
 * (ROOM_INSET), its wall drawn outside that face. STUDIO (owner 2026-10-15):
 * no wedges or side fills — every performer the plan draws or implies (a
 * player, the drummer at a kit, a keyboard player, a singer at a vocal mic)
 * has a personal headphone mixer, fed from the CONTROL ROOM at the room's
 * edge (monitoring/cueMix.ts).
 */
import type { InstrumentModel, VariantId } from '../../../engine/model/types.ts';
import { bodyEnvelope, shapeBox } from '../../../engine/geometry/contentFrame.ts';
import { foot, kitPieceFoots, labelPlaces, rectAround, rectOfCircle, unionRect, wedgeFoot, type PlanFoot, type PlanPt, type PlanRect } from '../planFoot.ts';
import { PLAN_BOX as KIT_PLAN_BOX } from '../kitPlanModel.ts';
import { DRUMMER } from '../kitScene/kitSceneModel.ts';
import { cueFootprints, cueLabels, type CueRig, type CueWall } from '../monitoring/cueMix.ts';
import type { PlanThing } from './family.ts';

export type PlanBox = { u0: number; u1: number; v0: number; v1: number };
export type PlanScene = 'kit' | 'stage' | 'studio';

/** The studio's wall: the room's inner face is the plan box inset by this. */
export const ROOM_INSET = 40;
/** The drawn wall's thickness (outside the inner face). */
export const ROOM_WALL = 60;
export function planRoom(box: PlanBox): PlanRect {
  return { u0: box.u0 + ROOM_INSET, u1: box.u1 - ROOM_INSET, v0: box.v0 + ROOM_INSET, v1: box.v1 - ROOM_INSET };
}
/** The wall band round the room (for the words only: a name never sits on a wall). */
export function roomWallFoots(box: PlanBox): PlanFoot[] {
  const r = planRoom(box);
  const t = ROOM_WALL;
  return [
    foot('wall:u0', 'wall', { u0: r.u0 - t, u1: r.u0, v0: r.v0 - t, v1: r.v1 + t }),
    foot('wall:u1', 'wall', { u0: r.u1, u1: r.u1 + t, v0: r.v0 - t, v1: r.v1 + t }),
    foot('wall:v0', 'wall', { u0: r.u0 - t, u1: r.u1 + t, v0: r.v0 - t, v1: r.v0 }),
    foot('wall:v1', 'wall', { u0: r.u0 - t, u1: r.u1 + t, v0: r.v1, v1: r.v1 + t }),
  ];
}

/* ── the neighbours' true sizes from above (mm, about the thing's anchor) ── */

/** A player from above (shoulders 260 × 460, the arms reaching forward to
 *  the drums), facing +u; the head at (HEAD_DU, 0). */
export const PLAYER_TOP = { back: 130, half: 230, arm: { u0: 40, u1: 300, v: 190, w: 62 }, headDu: 10 } as const;
/** The band's drum kit from above (the plan's own drawing): the bass drum,
 *  two rack toms, the floor tom, three cymbals and the throne; the drummer
 *  sits on the throne facing +u, the hi-hat on their left (−v). */
/** The drum kit on these plans is the SHARED five-piece kit at true size
 *  with its drummer (kitScene KitTop; expert review 2026-10-15: the old
 *  stand-in drew the kick as a round head from above — a kick lying on its
 *  side is a long shell from above — with no stands). A 'kit' thing's (u, v)
 *  is the kit's centre; its origin (the kick's batter head) sits here: */
export function kitOrigin(t: { u: number; v: number }): PlanPt {
  const B = KIT_PLAN_BOX.kit;
  return { u: t.u - (B.u0 + B.u1) / 2, v: t.v - (B.v0 + B.v1) / 2 };
}
/** The retired stand-in kit's numbers (kept for reference by nothing drawn). */
export const KIT_TOP = {
  drums: [
    { id: 'kick', u: 260, v: 0, r: 280 },
    { id: 'tom1', u: -120, v: -340, r: 178 },
    { id: 'tom2', u: 120, v: -260, r: 152 },
    { id: 'floor', u: -140, v: 320, r: 203 },
  ],
  /** The heads' chrome hoop round each drum (mm). */
  hoop: 7,
  cymbals: [
    { id: 'hihat', u: -230, v: -580, r: 178 },
    { id: 'ride', u: 380, v: 430, r: 254 },
    { id: 'crash', u: 420, v: -470, r: 230 },
  ],
  throne: { u: -420, v: 0, r: 170 },
  /** The seated drummer's space (body, thighs, feet on the pedals). */
  drummer: { u0: -590, u1: -30, v0: -250, v1: 250 },
} as const;
/** An amp cabinet: 560 wide × 360 deep, its grille on the face side. */
export const AMP_TOP = { w: 560, d: 360 } as const;
/** A side-fill cabinet: 520 wide × 420 deep. */
export const SIDEFILL_TOP = { w: 520, d: 420 } as const;
/** A keyboard: 980 × 320 (its keys along u); the player sits on its bench
 *  (600 × 300, centred `seat` from the keyboard's edge) on −v, facing +v. */
export const KEYS_TOP = { w: 980, d: 320, keys: 18, keyW: 49, seat: 270, bench: { w: 600, d: 300 }, space: { half: 330, depth: 480 } } as const;
/** The keyboard player's bench centre. */
export function keysBench(t: PlanThing): PlanPt {
  return { u: t.u, v: t.v - KEYS_TOP.d / 2 - KEYS_TOP.seat };
}
/** A vocal mic stand from above: three legs (220), the boom back toward the
 *  singer (−u, 260) and the mic; the singer stands behind it, facing +u. */
export const MICSTAND_TOP = { leg: 220, legW: 22, boom: 260, mic: 34, singer: { du: -450, half: 230, depth: 130 } } as const;
/** Other percussion: two hand drums and a bell. */
export const PERC_TOP = {
  heads: [
    { u: -60, v: -140, r: 92 },
    { u: -60, v: 60, r: 110 },
  ],
  hoop: 7,
  bell: [
    { u: 110, v: -90 },
    { u: 240, v: -120 },
    { u: 240, v: -20 },
    { u: 110, v: -40 },
  ],
} as const;
/** A PA stack from above (600 wide × 420 deep), facing the audience (+u). */
export const PA_TOP = { w: 600, d: 420, edge: 60, gap: 40 } as const;

/** The micstand's legs (the drawing's own angles). */
export function micLegAngles(): number[] {
  return [0, 1, 2].map((k) => (k * 2 * Math.PI) / 3 + Math.PI / 6);
}

/** The PA stacks: on the deck's downstage corners (just upstage of the
 *  audience line, inside the plan box), facing the audience. */
export function paStacks(t: PlanThing, box: PlanBox): PlanPt[] {
  const u = t.u - PA_TOP.gap - PA_TOP.d / 2;
  return [
    { u, v: box.v0 + PA_TOP.edge + PA_TOP.w / 2 },
    { u, v: box.v1 - PA_TOP.edge - PA_TOP.w / 2 },
  ];
}

/** A vocal mic is a singer's (a performer); an area mic over the station is not. */
export function isSingerMic(t: PlanThing): boolean {
  return t.kind === 'micstand' && t.id !== 'area';
}

/** The footprint group a thing belongs to: the lesson's own instrument and
 *  its player ('player' in the hand-drum plans) are one assembly. */
export function groupOf(t: PlanThing): string {
  if (t.kind === 'drums' || (t.kind === 'player' && t.id === 'player')) return 'main';
  return t.id;
}

/** The lesson's own instrument from above (its art), about its anchor:
 *  the instrument's footprint, the drawn player's (when the art draws one),
 *  any keep-clear floor (a way off the box), and the player's head. */
export type ArtPlan = { foots: { id: string; kind: string; r: PlanRect }[]; keepClear: PlanRect[]; head: PlanPt | null; facing: number };

const unionInto = (r: PlanRect | null, b: PlanRect): PlanRect => (r ? { u0: Math.min(r.u0, b.u0), u1: Math.max(r.u1, b.u1), v0: Math.min(r.v0, b.v0), v1: Math.max(r.v1, b.v1) } : { ...b });

/**
 * The art's footprint from the lesson's model (the art draws only from it):
 * every solid part in this variant (u = x, v = z). `withPlayer`: the art
 * draws the player too (the small-percussion family) — their body
 * envelopes, the head, the keep-clear way off.
 */
export function modelArtPlan(model: InstrumentModel, variant: VariantId, withPlayer: boolean): ArtPlan {
  let inst: PlanRect | null = null;
  for (const p of model.parts) {
    if (!p.solid || (p.variants && !p.variants.includes(variant))) continue;
    const b = shapeBox(p.solid);
    if (b) inst = unionInto(inst, { u0: b.min.x, u1: b.max.x, v0: b.min.z, v1: b.max.z });
  }
  const out: ArtPlan = { foots: inst ? [{ id: 'instrument', kind: 'instrument', r: inst }] : [], keepClear: [], head: null, facing: 0 };
  if (!withPlayer) return out;
  let body: PlanRect | null = null;
  let head: PlanRect | null = null;
  let player: PlanRect | null = null;
  for (const e of model.envelopes) {
    if (e.variants && !e.variants.includes(variant)) continue;
    const b = shapeBox(e.shape);
    if (!b) continue;
    const r = { u0: b.min.x, u1: b.max.x, v0: b.min.z, v1: b.max.z };
    if (/^env\.exit/.test(e.id)) out.keepClear.push(r);
    else if (bodyEnvelope(e)) {
      body = unionInto(body, r);
      if (/^env\.head/.test(e.id)) head = r;
      if (e.id === 'env.player' || /^env\.torso/.test(e.id)) player = unionInto(player, r);
    }
  }
  if (body) out.foots.push({ id: 'artPlayer', kind: 'player', r: body });
  const h = head ?? player;
  if (h) out.head = { u: (h.u0 + h.u1) / 2, v: (h.v0 + h.v1) / 2 };
  return out;
}

/** Things shown in a scene ('kit' = the band view: the always-there ones). */
export function shownThings(things: readonly PlanThing[], scene: PlanScene): PlanThing[] {
  return things.filter((t) => t.scene === 'all' || (scene !== 'kit' && t.scene === scene));
}

/** A performer the plan draws or implies, by its station id. */
export type PlanPerformer = { id: string; group: string; head: PlanPt; facing: number };

/** Every performer in the scene: a player, the drummer at a kit (on the
 *  throne), a keyboard player (on the bench), a singer (behind a vocal mic),
 *  and the art's own player. An amp, other percussion or an area mic is not one. */
export function planPerformers(things: readonly PlanThing[], scene: PlanScene, art: ArtPlan | null): PlanPerformer[] {
  const out: PlanPerformer[] = [];
  for (const t of shownThings(things, scene)) {
    const g = groupOf(t);
    if (t.kind === 'drums' && art?.head) out.push({ id: t.id, group: g, head: { u: t.u + art.head.u, v: t.v + art.head.v }, facing: art.facing });
    else if (t.kind === 'player') out.push({ id: t.id, group: g, head: { u: t.u + PLAYER_TOP.headDu, v: t.v }, facing: 0 });
    else if (t.kind === 'kit') {
      const o = kitOrigin(t);
      out.push({ id: t.id, group: g, head: { u: o.u + DRUMMER.headTop.x, v: o.v + DRUMMER.headTop.z }, facing: 0 });
    }
    else if (t.kind === 'keys') out.push({ id: t.id, group: g, head: keysBench(t), facing: Math.PI / 2 });
    else if (isSingerMic(t)) out.push({ id: t.id, group: g, head: { u: t.u + MICSTAND_TOP.singer.du, v: t.v }, facing: 0 });
  }
  return out;
}

/** One thing's footprints (mm, absolute). */
export function thingFoots(t: PlanThing, box: PlanBox, art: ArtPlan | null): PlanFoot[] {
  const g = groupOf(t);
  const at = { u: t.u, v: t.v };
  const out: PlanFoot[] = [];
  switch (t.kind) {
    case 'drums':
      for (const f of art?.foots ?? []) out.push(foot(f.id === 'instrument' ? t.id : `${t.id}:${f.id}`, f.kind, { u0: t.u + f.r.u0, u1: t.u + f.r.u1, v0: t.v + f.r.v0, v1: t.v + f.r.v1 }, { group: g }));
      (art?.keepClear ?? []).forEach((r, i) => out.push(foot(`${t.id}:keepClear${i}`, 'keepClear', { u0: t.u + r.u0, u1: t.u + r.u1, v0: t.v + r.v0, v1: t.v + r.v1 }, { group: g, zone: true })));
      break;
    case 'player': {
      const A = PLAYER_TOP.arm;
      out.push(foot(t.id, 'player', { u0: t.u - PLAYER_TOP.back, u1: t.u + A.u1 + A.w / 2, v0: t.v - A.v - A.w / 2, v1: t.v + A.v + A.w / 2 }, { group: g }));
      break;
    }
    case 'kit': {
      // the shared kit: every drum, cymbal, stand foot, the throne and the
      // seated drummer (one group)
      out.push(...kitPieceFoots(kitOrigin(t), g).map((f) => ({ ...f, id: `${t.id}:${f.id.slice(g.length + 1)}` })));
      break;
    }
    case 'amp':
      out.push(foot(t.id, 'amp', rectAround(at, AMP_TOP.d, AMP_TOP.w, t.face ?? 0)));
      break;
    case 'sidefill':
      out.push(foot(t.id, 'sideFill', rectAround(at, SIDEFILL_TOP.d, SIDEFILL_TOP.w, t.face ?? 0)));
      break;
    case 'wedge': {
      const a = t.face ?? 0;
      out.push(wedgeFoot({ id: t.id, p: { x: t.u, y: 0, z: t.v }, faces: { x: Math.cos(a), y: 0, z: Math.sin(a) } }));
      break;
    }
    case 'keys': {
      out.push(foot(t.id, 'keys', { u0: t.u - KEYS_TOP.w / 2, u1: t.u + KEYS_TOP.w / 2, v0: t.v - KEYS_TOP.d / 2, v1: t.v + KEYS_TOP.d / 2 }, { group: g }));
      const S = KEYS_TOP.space;
      out.push(foot(`${t.id}:bench`, 'seat', rectAround(keysBench(t), KEYS_TOP.bench.w, KEYS_TOP.bench.d, 0), { group: g }));
      out.push(foot(`${t.id}:player`, 'keepClear', { u0: t.u - S.half, u1: t.u + S.half, v0: t.v - KEYS_TOP.d / 2 - S.depth, v1: t.v - KEYS_TOP.d / 2 }, { group: g, zone: true }));
      break;
    }
    case 'micstand': {
      const M = MICSTAND_TOP;
      const legs = micLegAngles().map((a) => ({ u: t.u + Math.cos(a) * M.leg, v: t.v + Math.sin(a) * M.leg }));
      const us = [...legs.map((p) => p.u), t.u - M.boom - 20 - M.mic];
      const vs = legs.map((p) => p.v);
      const h = M.legW / 2;
      out.push(foot(t.id, 'micStand', { u0: Math.min(...us) - h, u1: Math.max(...us) + h, v0: Math.min(...vs) - h, v1: Math.max(...vs) + h }, { group: g }));
      if (isSingerMic(t)) out.push(foot(`${t.id}:singer`, 'keepClear', { u0: t.u + M.singer.du - M.singer.depth, u1: t.u + M.singer.du + M.singer.depth, v0: t.v - M.singer.half, v1: t.v + M.singer.half }, { group: g, zone: true }));
      break;
    }
    case 'perc': {
      const P = PERC_TOP;
      const r = P.heads.map((h) => rectOfCircle({ u: t.u + h.u, v: t.v + h.v }, h.r + P.hoop));
      const us = [...r.flatMap((x) => [x.u0, x.u1]), ...P.bell.map((b) => t.u + b.u)];
      const vs = [...r.flatMap((x) => [x.v0, x.v1]), ...P.bell.map((b) => t.v + b.v)];
      out.push(foot(t.id, 'perc', { u0: Math.min(...us), u1: Math.max(...us), v0: Math.min(...vs), v1: Math.max(...vs) }));
      break;
    }
    case 'audience':
      out.push(foot(t.id, 'audience', { u0: t.u, u1: box.u1, v0: box.v0, v1: box.v1 }, { zone: true }));
      paStacks(t, box).forEach((p, i) => out.push(foot(`${t.id}:pa${i}`, 'pa', rectAround(p, PA_TOP.d, PA_TOP.w, 0))));
      break;
    case 'room':
      break;
  }
  return out;
}

/** The studio's headphone mix as a plan states it: the distribution point's
 *  wall and centre, and each performer's mixer (by the performer's id) with
 *  any corner points its feed passes. */
export type PlanCueSpec = {
  wall: CueWall;
  hubAt: number;
  layout?: 'wall' | 'row';
  stations: readonly { of: string; at: PlanPt; via?: readonly PlanPt[] }[];
};

/** The studio's headphone mix (null on a stage, or with no spec). */
export function planCue(things: readonly PlanThing[], box: PlanBox, art: ArtPlan | null, spec: PlanCueSpec | undefined, scene: PlanScene): CueRig | null {
  if (scene !== 'studio' || !spec) return null;
  const perf = planPerformers(things, scene, art);
  return {
    room: planRoom(box),
    wall: spec.wall,
    hubAt: spec.hubAt,
    layout: spec.layout,
    stations: spec.stations.flatMap((s) => {
      const p = perf.find((q) => q.id === s.of);
      // the keyboard's bench and a vocal mic draw no figure:
      // the phones rest there, face-on
      const t = things.find((q) => q.id === s.of);
      const alone = !!t && (t.kind === 'keys' || isSingerMic(t));
      return p ? [{ id: s.of, at: s.at, head: p.head, facing: p.facing, via: s.via, ...(alone ? { alone } : {}) }] : [];
    }),
  };
}

/** Every object's footprint on the plan in this scene (mm). */
export function handPlanFoots(things: readonly PlanThing[], box: PlanBox, scene: PlanScene, art: ArtPlan | null, cue?: PlanCueSpec): PlanFoot[] {
  const out = shownThings(things, scene).flatMap((t) => thingFoots(t, box, art));
  const rig = planCue(things, box, art, cue, scene);
  if (rig) out.push(...cueFootprints(rig));
  return out;
}

/** Where a thing's name points (the object's centre; the lesson's own
 *  instrument: the middle of its art). */
export function labelPoint(t: PlanThing, art: ArtPlan | null = null): PlanPt {
  if (t.kind === 'audience') return { u: t.u + 260, v: t.v };
  const inst = t.kind === 'drums' ? art?.foots.find((f) => f.id === 'instrument') : undefined;
  if (inst) return { u: t.u + (inst.r.u0 + inst.r.u1) / 2, v: t.v + (inst.r.v0 + inst.r.v1) / 2 };
  return { u: t.u, v: t.v };
}

type PlanLabel = { id: string; text: string; u: number; v: number; align: 'left' | 'center' | 'right'; alts?: { u: number; v: number; align: 'left' | 'center' | 'right' }[]; tone: 'muted' | 'amber' | 'illustrative'; point?: PlanPt };

/**
 * The plan's words (StaticLabels with `clearOf`): every thing's name just
 * outside its own footprint (below, right, left, above — planFoot
 * labelPlaces at the plan's scale `s` = px per mm ÷ the text scale), else in
 * free space with a leader back to `point`; the studio's HEADPHONE MIX and
 * CONTROL ROOM. `blockers`: what a word may not sit on (every object, and
 * the studio's walls).
 */
export function handPlanLabels(things: readonly PlanThing[], box: PlanBox, scene: PlanScene, art: ArtPlan | null, cue: PlanCueSpec | undefined, shortOf: (id: string) => string, highlight: string | null, s: number): { labels: PlanLabel[]; blockers: PlanFoot[] } {
  const foots = handPlanFoots(things, box, scene, art, cue);
  const rig = planCue(things, box, art, cue, scene);
  const labels: PlanLabel[] = shownThings(things, scene)
    .filter((t) => t.kind !== 'room')
    .map((t) => {
      const point = labelPoint(t, art);
      const tone = t.id === highlight ? ('amber' as const) : ('muted' as const);
      if (t.kind === 'audience') return { id: t.id, text: shortOf(t.id), u: point.u, v: point.v, align: 'center' as const, tone, point };
      const own = thingFoots(t, box, art).filter((f) => !f.zone);
      const places = labelPlaces(own.length ? unionRect(own) : { u0: t.u, u1: t.u, v0: t.v, v1: t.v }, s);
      return { id: t.id, text: shortOf(t.id), u: places[0].u, v: places[0].v, align: places[0].align, alts: places.slice(1), tone, point };
    });
  if (rig) labels.push(...cueLabels(rig).map((l) => ({ ...l, tone: 'illustrative' as const })));
  return { labels, blockers: scene === 'studio' ? [...foots, ...roomWallFoots(box)] : foots };
}
