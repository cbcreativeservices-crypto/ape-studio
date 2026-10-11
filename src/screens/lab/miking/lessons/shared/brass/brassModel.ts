/**
 * THE BRASS FAMILY IN THE ENGINE (charter §2 layer 2): the solids, the
 * keep-outs, the reference surface (the bell), the bell's axis and the clip
 * rim one horn and its player compile to — from brassSpec.ts and
 * brassPosture.ts, so the drawing, the collisions, the zones and the
 * readouts agree.
 *
 * KEEP-OUTS (trumpet/ and trombone/ GEOMETRY_PROPOSAL.md §3; ILLUSTRATIVE):
 *   • the VALVE HANDS (trumpet, flugelhorn): a box round the casings and
 *     both hands (proposal: 120 × 100 × 120 round the valves);
 *   • the SLIDE's travel (trombones): the outer slide, its crook and the
 *     right hand from 1st to 7th position (the DERIVED 559 mm), with a
 *     comfortable buffer round it (the lesson's L45; proposal default 150 —
 *     100 here, a drawing default) — the proposal's env.tb.slide. It is
 *     what stops "a mic straight in front of the bell": its stand drops
 *     through the slide's path;
 *   • the SLIDE ARM at 1st, 4th and 7th position;
 *   • the bass trombone's LEFT THUMB at its triggers (env.btb.leftHand);
 *   • the player's head, body, arms and legs.
 * No mic, gooseneck, stand or boom may enter any of them (the lessons'
 * safety rule); the engine stops the mic and names the part. The bell's own
 * travel as the player moves (proposal ±15°/±10°) and the mutes' path are
 * taught in words: a clip rides on the bell, and a mute changes the source.
 *
 * Pure: plain data.
 */
import type { Dim, InstrumentModel, Part, Provenance, ReferenceSurface, RefLine, Rim, Shape3, Vec3, ViewBox } from '../../../engine/model/types.ts';
import { add, scale } from '../../../engine/geometry/vec.ts';
import { mergeVariants } from '../bowed/bowedModel.ts';
import { bellRadius, SLIDE_7TH } from './brassSpec.ts';
import type { HornPose } from './brassPosture.ts';

const ill = (reason: string): Provenance => ({ kind: 'illustrative', reason });
const PLAYER = ill('the player’s body: a drawing default (no source gives a player’s reach)');
const cap = (a: Vec3, b: Vec3, r: number): Shape3 => ({ kind: 'capsule', a, b, r });

/** The slide's keep-out buffer (the lesson's "comfortable buffer"; a drawing default). */
export const SLIDE_BUFFER: Dim = { mm: 100, prov: { kind: 'unknown', needed: 'the comfortable buffer round the slide’s travel (L45; proposal default 150, drawn 100)' }, placeholder: true };

export type BrassModelOpts = {
  id: string;
  name: string;
  views: { side: ViewBox; top: ViewBox };
  variants?: InstrumentModel['variants'];
};

/** The parts list, the keep-outs and the surfaces of one horn and player. */
export function brassModel(P: HornPose, o: BrassModelOpts): InstrumentModel {
  const { spec, player: pl } = P;
  const R = spec.bell.mm / 2;
  const F = spec.flare.mm;
  const slide = spec.kind === 'slide';
  const bellProv: Provenance = spec.bell.prov;
  const parts: Part[] = [];
  const name = spec.name;

  /* the bell: three frusta along the flare (the inside is open; a mic in
   * front of the rim is clear of it) */
  const xs = [-F, -F * 0.45, -F * 0.15, 0];
  for (let i = 0; i < 3; i++) {
    const a = P.H({ x: xs[i], y: 0, z: 0 });
    const b = P.H({ x: xs[i + 1], y: 0, z: 0 });
    parts.push({
      id: i === 0 ? 'br.bell' : `br.bell${i}`,
      label: 'bell',
      short: 'bell',
      role: `The flared end of the tube, ${spec.bell.mm} mm across at the rim on this ${name}. Most of the sound leaves here — the low notes spreading all round, the high ones beaming forward along its axis.`,
      prov: bellProv,
      ...(i === 0 ? {} : { listIn: [] }),
      solid: { kind: 'frustum', a, b, ra: bellRadius(spec, xs[i]) + 1, rb: bellRadius(spec, xs[i + 1]) + (i === 2 ? 3 : 1) },
    });
  }

  /* the tubing: a capsule per segment of each centre line */
  const roleOf: Record<string, { label: string; short: string; role: string }> = {
    'br.bell': { label: 'bell', short: 'bell', role: '' },
    'br.leadpipe': { label: 'leadpipe', short: 'leadpipe', role: 'The tube the mouthpiece fits into: the air column starts here.' },
    'br.slides': { label: 'tuning and valve slides', short: 'slides', role: 'Short U-shaped slides set the tuning; the valve slides are the extra lengths each valve brings in. Players pull them out to tune — keep clips and cables clear.' },
    'br.valves': { label: slide ? 'valve section' : 'valves', short: slide ? 'valves' : 'valves', role: slide ? 'Two rotary valves in the bell section, worked by the left hand: each brings in an extra loop of tube for the lowest notes.' : 'Three piston valves. Pressing one sends the air round an extra loop of tube, lowering the pitch.' },
    'br.slide': { label: 'slide', short: 'slide', role: 'The long U of tube the right hand moves: out to make the tube longer and the pitch lower — seven positions from 1st (closed) to 7th (out at arm’s length). It is precision tubing: never let anything touch it.' },
  };
  for (const t of P.tubes) {
    for (let i = 0; i < t.pts.length - 1; i++) {
      const id = `${t.id}.${i}`;
      const r = roleOf[t.part];
      const first = i === 0 && t.part !== 'br.bell' && !parts.some((p) => p.id === t.part);
      parts.push({
        id: first ? t.part : `br.t.${id}`,
        label: r.label,
        short: r.short,
        role: r.role || roleOf['br.bell'].role,
        prov: ill('tube routing: a drawing default'),
        listIn: first ? undefined : [],
        moving: t.part === 'br.slide' ? true : undefined,
        solid: cap(t.pts[i], t.pts[i + 1], t.r),
      });
    }
  }
  if (P.valves.length) {
    P.valves.forEach((vv, i) => {
      const top = add(vv.c, scale(P.up, vv.h));
      const bot = add(vv.c, scale(P.up, -vv.h));
      parts.push({ id: `br.casing${i}`, label: 'valves', short: 'valves', role: roleOf['br.valves'].role, prov: ill('valve block: proposal drawing default (casing Ø 24, spacing 26)'), listIn: [], solid: cap(top, bot, vv.r) });
      parts.push({ id: `br.button${i}`, label: 'valves', short: 'valves', role: roleOf['br.valves'].role, prov: ill('valve buttons: drawing default'), listIn: [], solid: cap(top, vv.button, 9) });
    });
  }
  P.rotors.forEach((ro, i) => {
    parts.push({ id: `br.rotor${i}`, label: 'valve section', short: 'valves', role: roleOf['br.valves'].role, prov: ill('rotor placement: drawing default (bass_trombone/GEOMETRY_PROPOSAL.md)'), listIn: [], solid: { kind: 'cyl', a: add(ro.c, { x: 0, y: 0, z: -26 }), b: add(ro.c, { x: 0, y: 0, z: 26 }), r: ro.r } });
  });
  parts.push({
    id: 'br.mouthpiece',
    label: 'mouthpiece',
    short: 'mouthpiece',
    role: 'The cup the lips buzz into. The player’s breath and the buzz start the sound here; a mic near the player’s face hears breath and valve noise.',
    prov: ill('mouthpiece size: a drawing default'),
    solid: cap(P.mouthpiece.cup, P.mouthpiece.shank, P.mouthpiece.r),
  });

  /* the keep-outs */
  if (!slide && P.valves.length) {
    const xsV = P.valves.map((vv) => vv.c.x);
    const ys = [...P.valves.map((vv) => vv.button.y), pl.handL.y, pl.handR.y];
    parts.push({
      id: 'br.valveHands',
      label: 'the valve hands',
      short: 'valve hands',
      role: 'The left hand holds the valve casings and the right hand’s fingers work the buttons, moving all the time. Keep mics, clips and cables out of this space.',
      moving: true,
      prov: ill('env: the proposal’s 120 × 100 × 120 box round the valves, grown to hold both hands (drawing default)'),
      solid: { kind: 'box', min: { x: Math.min(...xsV) - 62, y: Math.min(...ys) - 45, z: pl.handL.z - 40 }, max: { x: Math.max(...xsV) + 62, y: P.valves[0].c.y + P.valves[0].h + 50, z: pl.handR.z + 40 } },
    });
  }
  if (P.slide) {
    const s = P.slide;
    const [yU, yL] = s.legs;
    const x0 = s.outerFrom.x - s.s - 30; // the outer slide's back end at 1st
    const x1 = s.crook.x - s.s + SLIDE_7TH + (yL - yU) / 2 + 30; // the crook at 7th
    parts.push({
      id: 'br.slidePath',
      label: 'the slide’s path',
      short: 'slide path',
      role: `The outer slide and its crook travel from 1st position out to 7th — about ${Math.round(SLIDE_7TH / 10)} cm further out — with the right hand. A stand, boom, cable or mic anywhere in this path, or close beside it, is in the wrong place: leave a comfortable buffer.`,
      moving: true,
      prov: ill('env.tb.slide: the DERIVED 7th-position travel (559 mm) with drawing-default margins'),
      clearance: SLIDE_BUFFER,
      solid: { kind: 'box', min: { x: x0, y: yU - 40, z: s.z - 70 }, max: { x: x1, y: yL + 40, z: s.z + 75 } },
    });
    P.slideArm.forEach((a, i) => {
      parts.push({ id: `br.armR${i}a`, label: 'the slide arm', short: 'slide arm', role: 'The right arm moves the slide — from a bent elbow at 1st position to a straight arm at 7th. Its whole sweep is a keep-out.', moving: true, prov: PLAYER, listIn: i === 2 ? undefined : [], solid: cap(pl.shoulderR, a.elbow, 55) });
      parts.push({ id: `br.armR${i}b`, label: 'the slide arm', short: 'slide arm', role: 'The forearm and hand.', moving: true, prov: PLAYER, listIn: [], solid: cap(a.elbow, a.hand, 48) });
    });
  } else {
    parts.push({ id: 'br.armR1a', label: 'the right arm', short: 'right arm', role: 'The right arm, its fingers on the valves.', prov: PLAYER, listIn: [], solid: cap(pl.shoulderR, pl.elbowR, 55) });
    parts.push({ id: 'br.armR1b', label: 'the right arm', short: 'right arm', role: 'The right forearm.', prov: PLAYER, listIn: [], solid: cap(pl.elbowR, pl.handR, 48) });
  }
  if (P.triggers.length) {
    const tx = P.triggers.map((t) => t.x);
    const ty = P.triggers.map((t) => t.y);
    const tz = P.triggers.map((t) => t.z);
    parts.push({
      id: 'br.thumb',
      label: 'the left thumb at the valve triggers',
      short: 'triggers',
      role: 'The left thumb and, on many horns, a finger work the valve triggers beside the mouthpiece, all the time in low passages. Keep cables and clips away from the triggers and their linkage.',
      moving: true,
      prov: ill('env.btb.leftHand: a 100 × 80 × 80 box at the triggers (proposal drawing default)'),
      solid: { kind: 'box', min: { x: Math.min(...tx) - 40, y: Math.min(...ty) - 40, z: Math.min(...tz) - 40 }, max: { x: Math.max(...tx) + 40, y: Math.max(...ty) + 40, z: Math.max(...tz) + 40 } },
    });
  }
  parts.push({ id: 'br.armL1', label: 'the left arm', short: 'left arm', role: 'The left arm holds the instrument.', prov: PLAYER, listIn: [], solid: cap(pl.shoulderL, pl.elbowL, 52) });
  parts.push({ id: 'br.armL2', label: 'the left arm', short: 'left arm', role: 'The left forearm.', prov: PLAYER, listIn: [], solid: cap(pl.elbowL, pl.handL, 46) });
  parts.push({
    id: 'br.player',
    label: 'the player',
    short: 'player',
    role: slide ? 'The trombonist stands behind the horn: the bell section over the left shoulder, the slide straight out from the mouth.' : `The player holds the ${name} at the lips, the bell pointing forward — and moves with the music, turning toward the band or a conductor.`,
    prov: PLAYER,
    solid: cap(pl.pelvis, pl.neck, 150),
  });
  parts.push({ id: 'br.head', label: 'the player’s head', short: 'head', role: 'The player’s head and face — and their breath. The player hears the horn from behind the bell, not as the audience does.', prov: PLAYER, solid: cap(pl.head, pl.head, pl.headR) });
  parts.push({ id: 'br.shoulders', label: 'the player', short: 'player', role: 'Shoulders.', prov: PLAYER, listIn: [], solid: cap(pl.shoulderL, pl.shoulderR, 62) });
  for (const [k, a, b, r] of [
    ['thighL', pl.hipL, pl.kneeL, 75],
    ['thighR', pl.hipR, pl.kneeR, 75],
    ['shinL', pl.kneeL, pl.ankleL, 55],
    ['shinR', pl.kneeR, pl.ankleR, 55],
    ['footL', pl.ankleL, pl.toeL, 45],
    ['footR', pl.ankleR, pl.toeR, 45],
  ] as const) {
    parts.push({ id: `br.${k}`, label: 'the player’s legs and feet', short: 'legs', role: 'The player’s legs and feet. Keep stand bases and cables clear of them.', prov: PLAYER, listIn: [], solid: cap(a, b, r) });
  }

  /* the bell as the reference: a TARGET point (distance = from the rim's centre) */
  const surfaces: ReferenceSurface[] = [{ id: 'bell', partId: 'br.bell', label: 'the bell', point: { x: 0, y: 0, z: 0 }, normal: P.axis, target: true }];
  const lines: RefLine[] = [{ id: 'axis', label: 'the bell’s axis', point: { x: 0, y: 0, z: 0 }, dir: P.axis }];
  const rims: Rim[] = [{ id: 'bell', label: 'the bell rim', c: { x: 0, y: 0, z: 0 }, axis: P.axis, r: R }];
  return {
    id: o.id,
    name: o.name,
    parts,
    regions: [
      { id: 'r.bell', partId: 'br.bell', label: 'the bell', anchor: { x: 0, y: 0, z: 0 }, prov: bellProv, note: 'Nearly all the sound leaves at the bell: the low notes spread out all round it, and the higher the pitch, the more it beams straight ahead along the bell’s axis.' },
      { id: 'r.lips', partId: 'br.mouthpiece', label: 'the mouthpiece', anchor: P.mouthpiece.cup, prov: ill('the cup'), note: 'The buzzing lips start the sound inside the cup; breath and lip noise leave here too, faintly.' },
      ...(P.valves.length ? [{ id: 'r.valves', partId: 'br.leadpipe', label: 'the valves', anchor: P.valves[1].c, prov: ill('the middle valve'), note: 'The valves click and the air rushes as they move — a close mic near them hears it.' }] : []),
      ...(P.slide ? [{ id: 'r.slide', partId: 'br.slide', label: 'the slide', anchor: P.slide.crook, prov: ill('the crook'), note: 'The slide carries the air column out and back; it makes little sound of its own.' }] : []),
    ],
    surfaces,
    lines,
    envelopes: [],
    variants: o.variants ?? [{ id: 'play', label: 'PLAYING', blurb: 'The player standing, playing.' }],
    defaultVariant: (o.variants ?? [{ id: 'play' }])[0].id,
    views: o.views,
    // A mic behind the bell faces forward, toward the bell's back.
    aimAzLimit: 180,
    yFloor: { mm: P.floorY, prov: { kind: 'unknown', needed: 'the bell’s height above the floor (the player’s lips 1550 mm up: a posture drawing default)' }, placeholder: true },
    // Nothing is "inside" a horn for a mic: a degenerate interior far below.
    interior: { x0: 0, x1: 1, rIn: 0.5, c: { x: 0, y: P.floorY + 5000, z: 0 } },
    rims,
    ports: Object.fromEntries((o.variants ?? [{ id: 'play' }]).map((v) => [v.id, null])),
  };
}

/**
 * A zone's SECTION in one view (u, v mm): the region r0…r1 from the target
 * whose direction lies between cMin° and cMax° of `axis` (and on the
 * `toward` side), cut through the target in that view's plane — one polygon
 * per run of directions (a ring cone cuts the plane in two arcs).
 */
export function coneSection(view: 'side' | 'top', target: Vec3, axis: Vec3, cMin: number, cMax: number, r0: number, r1: number, toward?: Vec3): { poly: [number, number][] }[] {
  const n = 240;
  const ok: boolean[] = [];
  const dirs: Vec3[] = [];
  const al = Math.hypot(axis.x, axis.y, axis.z);
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    const d = view === 'side' ? { x: Math.cos(a), y: Math.sin(a), z: 0 } : { x: Math.cos(a), y: 0, z: Math.sin(a) };
    dirs.push(d);
    const c = (d.x * axis.x + d.y * axis.y + d.z * axis.z) / al;
    const ang = (Math.acos(Math.max(-1, Math.min(1, c))) * 180) / Math.PI;
    const tw = !toward || d.x * toward.x + d.y * toward.y + d.z * toward.z >= -1e-9;
    ok.push(ang >= cMin - 1e-9 && ang <= cMax + 1e-9 && tw);
  }
  const uv = (p: Vec3): [number, number] => [p.x, view === 'side' ? p.y : p.z];
  const out: { poly: [number, number][] }[] = [];
  const seen = new Set<number>();
  for (let i = 0; i < n; i++) {
    if (!ok[i] || ok[(i - 1 + n) % n] || seen.has(i)) continue;
    const run: number[] = [];
    for (let k = 0; k < n && ok[(i + k) % n]; k++) {
      run.push((i + k) % n);
      seen.add((i + k) % n);
    }
    const pts: [number, number][] = [];
    for (const j of run) pts.push(uv(add(target, scale(dirs[j], r1))));
    for (let k = run.length - 1; k >= 0; k--) pts.push(uv(add(target, scale(dirs[run[k]], r0))));
    out.push({ poly: pts });
  }
  if (!out.length && ok.every(Boolean)) {
    // Every direction: a full ring.
    const pts: [number, number][] = [];
    for (let j = 0; j <= n; j++) pts.push(uv(add(target, scale(dirs[j % n], r1))));
    for (let j = n; j >= 0; j--) pts.push(uv(add(target, scale(dirs[j % n], r0))));
    out.push({ poly: pts });
  }
  return out;
}

/**
 * One model for the lesson's two horns (trumpet + flugelhorn, tenor + bass
 * trombone): the parts as the bowed family merges postures (a part that
 * differs is kept once per variant, the second as `id.<variant>`), and the
 * surfaces, lines, rims and regions kept once when they agree, else once
 * per variant (the flugelhorn's bell is dipped, the bass trombone's bell is
 * larger) — the second variant's ids get a `.<variant>` suffix.
 */
export function mergeBrass(list: { variant: string; model: InstrumentModel }[], views: InstrumentModel['viewsByVariant']): InstrumentModel {
  const base = mergeVariants(list, views);
  const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);
  const strip = <T extends { variants?: string[] }>(x: T) => ({ ...x, variants: undefined });
  function per<T extends { id: string; variants?: string[] }>(pick: (m: InstrumentModel) => T[] | undefined): T[] {
    const out: T[] = [];
    const [first, ...rest] = list;
    for (const x of pick(first.model) ?? []) {
      const others = rest.map((r) => (pick(r.model) ?? []).find((y) => y.id === x.id));
      out.push(others.every((y) => y && same(strip(y), strip(x))) ? x : { ...x, variants: [first.variant] });
    }
    for (const r of rest) {
      for (const y of pick(r.model) ?? []) {
        const x = (pick(first.model) ?? []).find((q) => q.id === y.id);
        if (x && same(strip(y), strip(x))) continue;
        out.push({ ...y, id: `${y.id}.${r.variant}`, variants: [r.variant] });
      }
    }
    return out;
  }
  // A region's or a surface's part may be a variant twin.
  const twinOf = (partId: string, v?: string) => (v && base.parts.some((p) => p.id === `${partId}.${v}`) ? `${partId}.${v}` : partId);
  const regions = per((m) => m.regions).map((rg) => ({ ...rg, partId: twinOf(rg.partId, rg.variants?.[0]) }));
  const surfaces = per((m) => m.surfaces).map((s) => ({ ...s, partId: twinOf(s.partId, s.variants?.[0]) }));
  return { ...base, regions, surfaces, lines: per((m) => m.lines), rims: per((m) => m.rims) };
}
