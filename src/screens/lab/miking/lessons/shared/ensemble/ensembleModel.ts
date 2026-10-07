/**
 * An ENSEMBLE as the engine's InstrumentModel (frame S, frameS.ts): every
 * player a solid the mic and its stand keep clear of, every section a named
 * part with its sound point, the podium and the conductor's space, the floor
 * and the front of the ensemble to measure from — one variant per seating.
 * Pure; tested. Used by every Lab 5 ensemble lesson (E11–E16) so the shared
 * engine pages (microphones, studio or live, two mics) work on a stage.
 *
 *   ensembleModel({ id, name, variants: [{ id, label, blurb, seating }], ... })
 *   surfaces   'floor'  (heights: "3.2 m above the floor")
 *              'front'  (the front of the front row, normal downstage:
 *                        "1.5 m in front of the front row")
 *              target surfaces a lesson adds for its spots (targetSurface)
 *   line       'across' (a plane: left or right of the centre line)
 *   parts      `${variant}:${seatId}`  a cylinder round each player (floor to
 *                                      head) — never listed, never touched
 *              `${variant}:${section}` the section, named, for regions
 *              `${variant}:podium`    the podium and the conductor
 *   envelope   `${variant}:conductor`  the conductor's space (arms and baton)
 *
 * The engine's two views: 'side' is the FRONT elevation (from the hall),
 * 'top' the PLAN in the conductor's view. Lab 5's own pages add the SECTION.
 * Every clearance is ILLUSTRATIVE (a drawing default).
 */
import type { DocumentedZone, Envelope, InstrumentModel, MicPose, Part, Provenance, ReferenceSurface, Vec3, ViewBox } from '../../../engine/model/types.ts';
import { sectorPolys } from '../handGeom.ts';
import { add, aimOf, mul, planDir, sub, unit, v3 } from './frameS.ts';
import { headTop, sectionCentre, seatsOf, supportOf, type Seating } from './seating.ts';
import { GEAR_SIZE, PA_BOX } from './bandStage.ts';
import { KIT } from '../kitPlanModel.ts';

/** `short`: the dock chip's one word (SEATING ▸ …), distinct per variant. */
export type EnsembleVariant = { id: string; label: string; short?: string; blurb: string; seating: Seating };
const SHORTS = new Map<string, string>();
/** A variant's one-word chip label (its `short`, else its label's first word). */
export function variantShort(modelId: string, variantId: string, label: string): string {
  return SHORTS.get(`${modelId}|${variantId}`) ?? label.split(' ')[0];
}
const ill = (reason: string): Provenance => ({ kind: 'illustrative', reason });

/** Large instruments drawn in front of their player (SeatingArt.tsx): their
 *  plan box in the player's frame (width across, from f0 to f1 mm ahead) and
 *  height — collision solids, drawing defaults. */
const FOOTPRINT: Partial<Record<string, { w: number; f0: number; f1: number; h: number; dx?: number }>> = {
  piano: { w: 1500, f0: 300, f1: 2450, h: 1000 },
  timpani: { w: 1700, f0: 150, f1: 1150, h: 900 },
  harp: { w: 500, f0: -100, f1: 520, h: 1800 },
  celesta: { w: 1000, f0: 240, f1: 780, h: 1000 },
  // Group 4: the drum kit round its drummer (Lab 1's shared kit: the
  // hi-hat beside the throne to the kick's front hoop, the cymbals up to
  // about 1.25 m) and a stage keyboard on its stand. The kit is one kind for
  // groups 4 and 5 (group 5's big band uses this footprint too).
  drumkit: { w: 2000, f0: -300, f1: -KIT.throne.c.u + KIT.kick.hoop.u1, h: 1300 },
  keys: { w: 1300, f0: 280, f1: 650, h: 1000 },
  // group 5 (sections): the mallet keyboards (Lab 2's frames), the congas,
  // the small-percussion table, the guitar's amp beside its player (`dx`).
  marimba: { w: 2130, f0: 220, f1: 1120, h: 1000 },
  vibraphone: { w: 1530, f0: 220, f1: 970, h: 960 },
  congas: { w: 720, f0: 200, f1: 560, h: 790 },
  perctable: { w: 900, f0: 200, f1: 650, h: 900 },
  guitar: { w: 560, f0: 335, f1: 605, h: 540, dx: 470 },
};
/** Group 4: a singer's body ends at the shoulders and the head is its own
 *  narrower solid, so a stage vocal mic can sit a few centimetres from the
 *  lips (the voice family's head: r 114, the lips 87 mm ahead of its axis). */
const SINGER = { shoulder: 1430, headR: 120 } as const;
export const seatPartId = (v: string, seatId: string) => `${v}:${seatId}`;
export const sectionPartId = (v: string, sec: string) => `${v}:${sec}`;
/** The radius kept clear round a player (body and chair), mm. ILLUSTRATIVE. */
export const PLAYER_R = 300;
/** The conductor's space round the podium (arms and baton), mm. ILLUSTRATIVE. */
export const CONDUCTOR_SPACE = { r: 700, h: 2400 } as const;

/** The stage box for a set of seatings, with the room the arrays need. */
export function stageViews(seatings: readonly Seating[], extra: { zMax?: number; hMax?: number } = {}): { side: ViewBox; top: ViewBox } {
  const x0 = Math.min(...seatings.map((s) => s.stage.x0)) - 300;
  const x1 = Math.max(...seatings.map((s) => s.stage.x1)) + 300;
  const z0 = Math.min(...seatings.map((s) => s.stage.z0)) - 200;
  const z1 = Math.max(extra.zMax ?? 0, ...seatings.map((s) => s.stage.z1)) + 400;
  const top = -(extra.hMax ?? 4300);
  return { side: { u0: x0, u1: x1, v0: top, v1: 300 }, top: { u0: x0, u1: x1, v0: z0, v1: z1 } };
}

export function ensembleModel(o: { id: string; name: string; variants: readonly EnsembleVariant[]; views?: { side: ViewBox; top: ViewBox }; viewsByVariant?: InstrumentModel['viewsByVariant']; extraSurfaces?: ReferenceSurface[] }): InstrumentModel {
  const parts: Part[] = [];
  const envelopes: Envelope[] = [];
  const regions: InstrumentModel['regions'] = [];
  for (const V of o.variants) {
    const S = V.seating;
    for (const sec of S.sections) {
      parts.push({ id: sectionPartId(V.id, sec.id), label: sec.label, short: sec.short, role: sec.radiates, variants: [V.id], listIn: [], prov: ill('a drawing-default seating') });
      regions.push({ id: `r.${V.id}.${sec.id}`, partId: sectionPartId(V.id, sec.id), label: `the ${sec.label}`, anchor: sectionCentre(S, sec.id), variants: [V.id], prov: ill('the section’s players’ sound points (a drawing default)'), note: sec.radiates });
      for (const seat of seatsOf(S, sec.id)) {
        const singer = seat.kind === 'singer';
        parts.push({
          id: seatPartId(V.id, seat.id),
          label: sec.label,
          short: sec.short,
          role: '',
          solid: { kind: 'cyl', a: v3(seat.p.x, 0, seat.p.z), b: v3(seat.p.x, singer ? seat.p.y - SINGER.shoulder : -headTop(seat), seat.p.z), r: PLAYER_R },
          variants: [V.id],
          listIn: [],
          prov: ill('a player and chair: a drawing default'),
        });
        if (singer)
          parts.push({
            id: `${seatPartId(V.id, seat.id)}.head`,
            label: 'the singer’s head',
            short: sec.short,
            role: '',
            solid: { kind: 'cyl', a: v3(seat.p.x, seat.p.y - SINGER.shoulder, seat.p.z), b: v3(seat.p.x, -headTop(seat), seat.p.z), r: SINGER.headR },
            variants: [V.id],
            listIn: [],
            prov: ill('the voice family’s head, as a cylinder: a drawing default'),
          });
        // A large instrument in front of its player is a solid of its own.
        const big = FOOTPRINT[seat.kind];
        if (big) {
          const f = planDir(seat.face);
          const r = v3(Math.cos((seat.face * Math.PI) / 180), 0, Math.sin((seat.face * Math.PI) / 180));
          const dx = big.dx ?? 0;
          const corners = [
            [-big.w / 2 + dx, big.f0],
            [big.w / 2 + dx, big.f0],
            [-big.w / 2 + dx, big.f1],
            [big.w / 2 + dx, big.f1],
          ].map(([x, a]) => add(add(seat.p, mul(r, x)), mul(f, a)));
          const xs = corners.map((c) => c.x);
          const zs = corners.map((c) => c.z);
          parts.push({
            id: `${seatPartId(V.id, seat.id)}.inst`,
            label: `the ${sec.label}`,
            short: sec.short,
            role: '',
            solid: { kind: 'box', min: v3(Math.min(...xs), seat.p.y - big.h, Math.min(...zs)), max: v3(Math.max(...xs), seat.p.y, Math.max(...zs)) },
            variants: [V.id],
            listIn: [],
            prov: ill('the instrument’s footprint: a drawing default'),
          });
        }
      }
    }
    // Group 4: the stage gear — every amp, wedge, DI box, PA and gobo is a
    // solid the mics and their stands keep clear of. An amp turned at an
    // angle is a cylinder along its own front-back axis (its grille the
    // front disc), so a close mic can sit at the grille; the rest are boxes.
    for (const g of S.gear ?? []) {
      const G = GEAR_SIZE[g.kind];
      const f = planDir(g.face);
      const square = Math.abs(f.x) < 1e-6 || Math.abs(f.z) < 1e-6;
      const amp = g.kind === 'combo' || g.kind === 'bassRig';
      const hTop = g.kind === 'pa' ? PA_BOX.bottom + PA_BOX.h : G.h;
      let solid: Part['solid'];
      if (amp && !square) {
        const c = add(g.p, v3(0, -G.h / 2, 0));
        solid = { kind: 'cyl', a: add(c, mul(f, -G.d / 2)), b: add(c, mul(f, G.d / 2)), r: Math.max(G.w, G.h) / 2 };
      } else {
        const r = v3(Math.cos((g.face * Math.PI) / 180), 0, Math.sin((g.face * Math.PI) / 180));
        const xs = [-1, 1].flatMap((a) => [-1, 1].map((b) => g.p.x + r.x * (a * G.w) / 2 + f.x * (b * G.d) / 2));
        const zs = [-1, 1].flatMap((a) => [-1, 1].map((b) => g.p.z + r.z * (a * G.w) / 2 + f.z * (b * G.d) / 2));
        solid = { kind: 'box', min: v3(Math.min(...xs), g.p.y - hTop, Math.min(...zs)), max: v3(Math.max(...xs), g.p.y, Math.max(...zs)) };
      }
      parts.push({ id: `${V.id}:gear.${g.id}`, label: g.label, short: g.short, role: '', solid, variants: [V.id], listIn: [], prov: ill('stage gear where a typical stage plot puts it: a drawing default') });
    }
    if (S.podium && S.conductor) {
      const P = S.podium;
      parts.push({ id: sectionPartId(V.id, 'podium'), label: 'the podium and the conductor', short: 'PODIUM', role: 'The conductor stands here; the main pair often goes above or just behind it, high enough to see past the players.', solid: { kind: 'box', min: v3(P.c.x - P.w / 2, -P.h, P.c.z - P.d / 2), max: v3(P.c.x + P.w / 2, 0, P.c.z + P.d / 2) }, variants: [V.id], listIn: [], prov: ill('a 0.9 m podium: a drawing default') });
      const c = S.conductor.p;
      envelopes.push({ id: `${V.id}:conductor`, label: 'the conductor’s space (arms and baton)', shape: { kind: 'cyl', a: v3(c.x, 0, c.z), b: v3(c.x, -CONDUCTOR_SPACE.h, c.z), r: CONDUCTOR_SPACE.r }, variants: [V.id], prov: ill('the conductor’s reach: a drawing default') });
    }
  }
  const first = o.variants[0];
  const anyPart = sectionPartId(first.id, first.seating.sections[0].id);
  const surfaces: ReferenceSurface[] = [
    { id: 'floor', partId: anyPart, label: 'the floor', point: v3(0, 0, 0), normal: v3(0, -1, 0), plus: { words: 'above', key: 'ABOVE' }, minus: { words: 'below', key: 'BELOW' } },
    { id: 'front', partId: anyPart, label: first.seating.viewer === 'audience' ? 'the front line of the band' : 'the front of the front row', point: v3(0, -1100, 0), normal: v3(0, 0, 1), plus: { words: 'in front of', key: 'IN FRONT' }, minus: { words: 'behind', key: 'BEHIND' } },
    ...(o.extraSurfaces ?? []),
  ];
  const views = o.views ?? stageViews(o.variants.map((v) => v.seating));
  for (const v of o.variants) if (v.short) SHORTS.set(`${o.id}|${v.id}`, v.short.toUpperCase());
  // Group 4: a stage plot says left and right as the audience sees it.
  const who = first.seating.viewer === 'audience' ? 'audience' : 'conductor';
  return {
    id: o.id,
    name: o.name,
    parts,
    regions,
    surfaces,
    lines: [{ id: 'across', label: 'the centre line', point: v3(0, 0, 0), dir: v3(1, 0, 0), plane: true, words: { plus: `to the ${who}’s right of`, minus: `to the ${who}’s left of`, keyPlus: 'RIGHT', keyMinus: 'LEFT' } }],
    envelopes,
    variants: o.variants.map((v) => ({ id: v.id, label: v.label.toUpperCase(), blurb: v.blurb, phrase: v.label.toLowerCase() })),
    defaultVariant: first.id,
    views,
    ...(o.viewsByVariant ? { viewsByVariant: o.viewsByVariant } : {}),
    viewTags: who === 'audience' ? { side: 'FROM THE AUDIENCE · FRONT', top: 'FROM ABOVE · THE STAGE PLOT' } : { side: 'FROM THE HALL · FRONT', top: 'FROM ABOVE · THE CONDUCTOR’S VIEW' },
    // The authored boxes ARE the stage (stageViews): a scene with no mic
    // keeps them, so the recommended starting points drawn round the
    // players always sit on the glass.
    fitAuthored: { side: true, top: true },
    // A stage-sized scene fits at ~0.02–0.1 on a phone: print its few labels there.
    labelMinScale: 0.012,
    aimAzLimit: 180,
    aimHome: { az: -90, el: -30 },
    // A tall stand's boom runs level, away from the mic's tail (toward the
    // conductor and the hall when the mic faces the ensemble).
    mountRule: { boom: 'level', fallback: v3(0, 0, 1), length: 700 },
    yFloor: { mm: 0, prov: ill('frame S: the stage floor is y = 0') },
    interior: { x0: 0, x1: 0, rIn: 0, c: v3(0, 0, 0) },
    ports: Object.fromEntries(o.variants.map((v) => [v.id, null])),
  };
}

/** A TARGET surface at a point (a spot's or a support's players), its
 *  normal the direction the mic approaches from (`toward`, unit). */
export function targetSurface(id: string, partId: string, label: string, point: Vec3, toward: Vec3): ReferenceSurface {
  return { id, partId, label, point, normal: unit(toward), target: true };
}

/**
 * A SUPPORT or SPOT zone: the mic `dMin`–`dMax` from the target (a target
 * surface), within `coneMax`° of the approach direction, aimed within
 * `aimMax`° of the target; drawn as that shell's sector in both engine
 * views. `start` must be clear and inside (validateLesson checks it).
 */
export function targetZone(o: {
  id: string;
  label: string;
  band: string;
  src: string;
  quote: string;
  kind: DocumentedZone['kind'];
  surface: ReferenceSurface;
  side: Vec3;
  d: [number, number];
  coneMax: number;
  aimMax: number;
  start: MicPose;
  variants?: string[];
  micTypeIds: string[];
  tendency: string;
  checks: string[];
  prov: Provenance;
}): DocumentedZone {
  const polys = sectorPolys(o.surface.point, o.surface.normal, o.side, o.d[0], o.d[1], 0, o.coneMax);
  return {
    id: o.id,
    label: o.label,
    band: o.band,
    kind: o.kind,
    src: o.src,
    quote: o.quote,
    refSurface: o.surface.id,
    side: 'either',
    distance: { min: o.d[0], max: o.d[1] },
    cone: { min: 0, max: o.coneMax, prov: o.prov },
    aim: { maxOffAxis: o.aimMax, prov: ill('aimed at the players: the lab’s tolerance') },
    requires: { micTypeIds: o.micTypeIds, ...(o.variants ? { variants: o.variants } : {}) },
    start: o.start,
    draw: { side: polys.side, top: polys.top },
    tendency: o.tendency,
    checks: o.checks,
  };
}

/**
 * A MAIN-ARRAY zone: the array's reference point between `h` heights above
 * the floor (or `d` in front of the front row), inside `box` (frame S). The
 * engine's single mic stands for the array's centre; Lab 5's own pages draw
 * the whole array there.
 */
export function mainZone(o: {
  id: string;
  label: string;
  band: string;
  src: string;
  quote: string;
  kind: DocumentedZone['kind'];
  ref: 'floor' | 'front';
  d: [number, number];
  box: { min: Vec3; max: Vec3 };
  start: MicPose;
  variants?: string[];
  micTypeIds: string[];
  tendency: string;
  checks: string[];
  bandProv?: Provenance;
}): DocumentedZone {
  const b = o.box;
  return {
    id: o.id,
    label: o.label,
    band: o.band,
    kind: o.kind,
    src: o.src,
    quote: o.quote,
    refSurface: o.ref,
    side: 'either',
    distance: { min: o.d[0], max: o.d[1] },
    ...(o.bandProv ? { bandProv: o.bandProv } : {}),
    box: { min: b.min, max: b.max, prov: ill('the zone’s other two dimensions: drawing defaults from the research words') },
    requires: { micTypeIds: o.micTypeIds, ...(o.variants ? { variants: o.variants } : {}) },
    start: o.start,
    drawn: { side: { u0: b.min.x, u1: b.max.x, v0: b.min.y, v1: b.max.y }, top: { u0: b.min.x, u1: b.max.x, v0: b.min.z, v1: b.max.z } },
    tendency: o.tendency,
    checks: o.checks,
  };
}

/** A support mic's pose for a group of players (seating.supportOf), aimed at them. */
export function supportPose(s: Seating, sections: string | readonly string[], o: { r?: number; n?: number; lift?: number; toward?: Vec3 } = {}): { pose: MicPose; target: Vec3; approach: Vec3; players: number } {
  const ids = typeof sections === 'string' ? [sections] : sections;
  if (ids.length === 1) {
    const sp = supportOf(s, ids[0], o);
    return { pose: { p: sp.p, ...aimOf(sub(sp.target, sp.p)) }, target: sp.target, approach: unit(sub(sp.p, sp.target)), players: sp.seats.length };
  }
  // Several small sections as one group (two flutes and two oboes): their
  // players' mean sound point, approached the same way.
  const parts = ids.map((id) => supportOf(s, id, { ...o, n: 99 }));
  const seats = parts.flatMap((q) => q.seats);
  const target = parts.map((q) => mul(q.target, q.seats.length)).reduce((a, b) => add(a, b), v3(0, 0, 0));
  const T = mul(target, 1 / Math.max(1, seats.length));
  const one = supportOf(s, ids[0], o);
  const dir = unit(sub(one.p, one.target));
  const p = add(T, mul(dir, o.r ?? 1250));
  return { pose: { p, ...aimOf(sub(T, p)) }, target: T, approach: dir, players: seats.length };
}
