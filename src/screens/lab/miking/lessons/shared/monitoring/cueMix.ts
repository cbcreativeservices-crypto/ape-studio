/**
 * THE STUDIO HEADPHONE MIX (owner 2026-10-15) — pure geometry, no Skia.
 *
 * Most studio tracking is monitored through headphones rather than wedges
 * (control-room tracking and speaker playback exist too — MK-03 hedge,
 * 2026-10-20). This lab's studio plans draw, at EACH performer's
 * station a personal headphone mixer (a personal monitor mixer, ≈ 236 wide ×
 * 188 deep × 64 tall mm, on its own round-base stand) with the player's
 * headphones plugged into it, and each mixer fed back from the control room
 * by its own cable (a network or snake line) to a distribution point at the
 * room's edge. Every Miking STUDIO plan draws one per performer from this
 * module (CueMixPlan.tsx draws it; test/mikingPlanCollisions_20261015 checks it).
 *
 * Plan frame: the caller's own (u, v) in mm. A station is placed by the
 * caller at a realistic reach beside its performer — never on them.
 *
 * ROUTING (cables drawn independently — traceable, parallel lanes, never
 * merged; D70): each mixer's feed leaves the back of its stand, runs straight
 * to its OWN lane along the wall that holds the distribution point, then
 * along that lane to the box. The mixer farthest along the wall gets the lane
 * nearest the wall, so no feed ever crosses another; at the box the lanes
 * turn down with concentric corners at a constant gap.
 */

import { labelPlaces, type PlanCable, type PlanFoot, type PlanPt, type PlanRect } from '../planFoot.ts';

export type { PlanCable, PlanFoot, PlanPt, PlanRect } from '../planFoot.ts';

/** A personal headphone mixer: its true top-view size and its stand (mm). */
export const CUE_MIXER = { w: 236, d: 188, baseR: 150 } as const;
/** The distribution point at the room edge (a wall box with one jack per
 *  station), depth from the wall (mm); its width grows with the stations. */
export const CUE_HUB = { d: 150, jackPitch: 90, margin: 70 } as const;
/** Lane spacing and the first lane's distance from the wall face (mm). */
export const CUE_LANE = { gap: 80, first: 110 } as const;

/** Which wall the distribution point is on: the room's u0 / u1 / v0 / v1. */
export type CueWall = 'u0' | 'u1' | 'v0' | 'v1';

export type CueStation = {
  /** The performer this station serves (an id unique in the plan). */
  id: string;
  /** The mixer's centre (on its stand). */
  at: PlanPt;
  /** The performer's head centre (the headphones sit on it) and the way the
   *  face points (radians in the plan, atan2(dv, du)). */
  head: PlanPt;
  facing: number;
  /** Optional corner points the feed passes before it drops to its lane. */
  via?: readonly PlanPt[];
  /** No figure is drawn at this station (an empty chair, a throne, a bench,
   *  a vocal mic with no singer): the headphones rest there, centred on
   *  `head`, and are drawn FACE-ON (owner 2026-10-15: phones seen from above
   *  without a head do not read as headphones) — the band's arc over the two
   *  cups, the cord from one cup, true size (PHONES_FRONT). */
  alone?: boolean;
  /** The players who SHARE this mixer (owner 2026-10-16: an orchestra
   *  records with one headphone box per music stand, shared by the players at
   *  that stand): each gets their own phones cord from it. Absent: the
   *  station serves one player, `id` / `head` / `facing` / `alone`. */
  seats?: readonly CueSeat[];
};

/** One player a mixer serves: their id (unique in the plan), head and facing,
 *  and whether a figure is drawn (`alone`: the phones rest face-on). */
export type CueSeat = { id: string; head: PlanPt; facing: number; alone?: boolean };

/** The players a station serves (its `seats`, or the one player it names). */
export function cueSeats(s: CueStation): readonly CueSeat[] {
  return s.seats ?? [{ id: s.id, head: s.head, facing: s.facing, alone: s.alone }];
}

/** Closed-back headphones seen face-on, resting (mm, about the rest point;
 *  −v = the band's top): the band's arc over the cups, ≈ 190 across the
 *  cups' outer faces and ≈ 200 from the band's top to the cups' bottom; each
 *  cup 52 × 96 (a cushion and its shell, seen edge-on to the face). */
export const PHONES_FRONT = { cupU: 70, cupW: 52, cupTop: -2, cupBot: 94, bandTop: -106, bandW: 16 } as const;

export type CueRig = {
  /** Unique in the plan when a plan has more than one distribution point
   *  (an orchestra: one per section, each at the room edge). */
  id?: string;
  /** The studio room's inner wall faces (mm). */
  room: PlanRect;
  wall: CueWall;
  /** 'wall' (default): each feed runs to its own lane along the hub's wall.
   *  'row': a row of performers; the feeds run in parallel lanes beside the
   *  row (on `rowSide`, ±1 across the row) straight to the hub at the row's
   *  end, the station nearest the wall in the lane nearest the row. */
  layout?: 'wall' | 'row';
  rowSide?: 1 | -1;
  /** Where along that wall the distribution point is centred (u for a v wall,
   *  v for a u wall). Ignored for a 'row' (the hub spans its lanes). */
  hubAt: number;
  /** The hub's words; null = none (a second section box beside a labelled one). */
  hubLabel?: string | null;
  stations: readonly CueStation[];
};

/* Local frame: `a` runs along the hub's wall, `b` increases toward it. */
function toLocal(wall: CueWall, p: PlanPt): { a: number; b: number } {
  switch (wall) {
    case 'v1':
      return { a: p.u, b: p.v };
    case 'v0':
      return { a: p.u, b: -p.v };
    case 'u1':
      return { a: p.v, b: p.u };
    case 'u0':
      return { a: p.v, b: -p.u };
  }
}
function fromLocal(wall: CueWall, a: number, b: number): PlanPt {
  switch (wall) {
    case 'v1':
      return { u: a, v: b };
    case 'v0':
      return { u: a, v: -b };
    case 'u1':
      return { u: b, v: a };
    case 'u0':
      return { u: -b, v: a };
  }
}
function wallB(rig: CueRig): number {
  const r = rig.room;
  return rig.wall === 'v1' ? r.v1 : rig.wall === 'v0' ? -r.v0 : rig.wall === 'u1' ? r.u1 : -r.u0;
}

const hubId = (rig: CueRig) => (rig.id ? `cueHub:${rig.id}` : 'cueHub');

type CueLayout = { feeds: PlanCable[]; hub: PlanRect; label: PlanPt };

/**
 * Each station's feed back to the distribution point (its own polyline) and
 * the hub's box. 'wall': stations on each side of the hub are laned by
 * distance (farthest = nearest the wall), turning down to the box with
 * concentric corners. 'row': see CueRig.layout.
 */
export function cueLayout(rig: CueRig): CueLayout {
  const B = wallB(rig);
  const hubFace = B - CUE_HUB.d;
  const st = rig.stations.map((s) => ({ s, L: toLocal(rig.wall, s.via && s.via.length ? s.via[s.via.length - 1] : s.at) }));
  const n = Math.max(1, st.length);
  const feeds: PlanCable[] = [];
  const cable = (s: CueStation, pts: PlanPt[]) => feeds.push({ id: `cue:${s.id}`, kind: 'cueFeed', pts: dedupe([s.at, ...(s.via ?? []), ...pts]), from: `cueMixer:${s.id}`, to: hubId(rig) });
  let a0: number;
  let a1: number;
  let mid: number;
  if (rig.layout === 'row') {
    const side = rig.rowSide ?? 1;
    const base = side > 0 ? Math.max(...st.map((x) => x.L.a)) : Math.min(...st.map((x) => x.L.a));
    // nearest the wall first: the lane nearest the row
    const order = [...st].sort((x, y) => y.L.b - x.L.b);
    const lanes = order.map((x, k) => {
      const laneA = base + side * (CUE_MIXER.baseR + CUE_LANE.first + k * CUE_LANE.gap);
      cable(x.s, [fromLocal(rig.wall, laneA, x.L.b), fromLocal(rig.wall, laneA, hubFace)]);
      return laneA;
    });
    a0 = Math.min(...lanes) - CUE_HUB.margin;
    a1 = Math.max(...lanes) + CUE_HUB.margin;
    mid = (a0 + a1) / 2;
  } else {
    const left = st.filter((x) => x.L.a < rig.hubAt).sort((x, y) => x.L.a - y.L.a); // farthest first
    const right = st.filter((x) => x.L.a >= rig.hubAt).sort((x, y) => y.L.a - x.L.a); // farthest first
    const pitch = CUE_HUB.jackPitch;
    const jack0 = rig.hubAt - ((n - 1) * pitch) / 2;
    const route = (group: typeof st, side: -1 | 1) => {
      group.forEach((x, k) => {
        // the jack: the left group fills the box from its left end, the right from its right end
        const j = side < 0 ? k : n - 1 - k;
        const jackA = jack0 + j * pitch;
        const laneB = hubFace - CUE_LANE.first - k * CUE_LANE.gap;
        if (Math.abs(x.L.a - jackA) < 1) cable(x.s, [fromLocal(rig.wall, jackA, hubFace)]);
        else cable(x.s, [fromLocal(rig.wall, x.L.a, laneB), fromLocal(rig.wall, jackA, laneB), fromLocal(rig.wall, jackA, hubFace)]);
      });
    };
    route(left, -1);
    route(right, 1);
    const half = (n * pitch) / 2 + CUE_HUB.margin;
    a0 = rig.hubAt - half;
    a1 = rig.hubAt + half;
    mid = rig.hubAt;
  }
  const p0 = fromLocal(rig.wall, a0, B - CUE_HUB.d);
  const p1 = fromLocal(rig.wall, a1, B);
  const hub = { u0: Math.min(p0.u, p1.u), u1: Math.max(p0.u, p1.u), v0: Math.min(p0.v, p1.v), v1: Math.max(p0.v, p1.v) };
  return { feeds, hub, label: fromLocal(rig.wall, mid, B - CUE_HUB.d - 140) };
}

/** The distribution point's box (plan rect) and where its words go. */
export function cueHub(rig: CueRig): { rect: PlanRect; label: PlanPt } {
  const L = cueLayout(rig);
  return { rect: L.hub, label: L.label };
}

/** The mixer's footprint (its stand's round base, which is wider than the
 *  mixer itself) as a plan rect. */
export function cueMixerRect(s: CueStation): PlanRect {
  const r = Math.max(CUE_MIXER.baseR, Math.hypot(CUE_MIXER.w, CUE_MIXER.d) / 2);
  return { u0: s.at.u - r, u1: s.at.u + r, v0: s.at.v - r, v1: s.at.v + r };
}

/** Each station's feed back to the distribution point. */
export function cueFeeds(rig: CueRig): PlanCable[] {
  return cueLayout(rig).feeds;
}

/** The headphone cable: from the mixer's front edge (the phones jack faces
 *  the performer) to the ear cup on the mixer's side, with a gentle sag. */
export function cuePhones(s: CueStation, mixer: string = s.id): PlanCable {
  if (s.alone) {
    // face-on phones at rest: the cord leaves the bottom of the cup nearer
    // the mixer and runs to the mixer's front edge, hanging in a slight sag
    const F = PHONES_FRONT;
    const side = s.at.u < s.head.u ? -1 : 1;
    const cup = { u: s.head.u + side * F.cupU, v: s.head.v + F.cupBot };
    const du0 = cup.u - s.at.u;
    const dv0 = cup.v - s.at.v;
    const l0 = Math.hypot(du0, dv0) || 1;
    const jack = { u: s.at.u + (du0 / l0) * (CUE_MIXER.d / 2), v: s.at.v + (dv0 / l0) * (CUE_MIXER.d / 2) };
    const mid = { u: (jack.u + cup.u) / 2, v: Math.max(jack.v, cup.v) + 50 };
    return { id: `phones:${s.id}`, kind: 'phones', pts: [jack, mid, cup], from: `cueMixer:${mixer}`, to: `head:${s.id}` };
  }
  const cup = cueCups(s).find((c, i, all) => Math.hypot(c.u - s.at.u, c.v - s.at.v) <= Math.hypot(all[1 - i].u - s.at.u, all[1 - i].v - s.at.v))!;
  const du = cup.u - s.at.u;
  const dv = cup.v - s.at.v;
  const l = Math.hypot(du, dv) || 1;
  const jack = { u: s.at.u + (du / l) * (CUE_MIXER.d / 2), v: s.at.v + (dv / l) * (CUE_MIXER.d / 2) };
  // a sag to one side of the straight line (a cord hangs, it is not a rod)
  const mid = { u: (jack.u + cup.u) / 2 + (-dv / l) * 60, v: (jack.v + cup.v) / 2 + (du / l) * 60 };
  return { id: `phones:${s.id}`, kind: 'phones', pts: [jack, mid, cup], from: `cueMixer:${mixer}`, to: `head:${s.id}` };
}

/** The two ear cups on the performer's head (mm): either side of the head,
 *  across the way the face points. A closed-back headphone's cup ≈ 95 × 75. */
export function cueCups(s: CueStation): [PlanPt, PlanPt] {
  const nu = -Math.sin(s.facing);
  const nv = Math.cos(s.facing);
  const R = 98;
  return [
    { u: s.head.u + nu * R, v: s.head.v + nv * R },
    { u: s.head.u - nu * R, v: s.head.v - nv * R },
  ];
}

/** Every footprint the headphone mix adds to a plan (the overlap test). */
export function cueFootprints(rig: CueRig): PlanFoot[] {
  return [...rig.stations.map((s) => ({ id: `cueMixer:${s.id}`, kind: 'cueMixer', ...cueMixerRect(s) })), { id: hubId(rig), kind: 'cueHub', ...cueHub(rig).rect }];
}

/** Every phones cord a station plugs in: one per player it serves, each from
 *  the station's own mixer to that player. */
export function cueStationPhones(s: CueStation): PlanCable[] {
  return cueSeats(s).map((p) => cuePhones({ ...s, ...p }, s.id));
}

/** Every cable the headphone mix adds to a plan (the overlap test). */
export function cueCables(rig: CueRig): PlanCable[] {
  return [...cueFeeds(rig), ...rig.stations.flatMap(cueStationPhones)];
}

function dedupe(pts: PlanPt[]): PlanPt[] {
  return pts.filter((p, i) => i === 0 || Math.hypot(p.u - pts[i - 1].u, p.v - pts[i - 1].v) > 0.5);
}

/** The words for the headphone mix, in the caller's label shape: one
 *  HEADPHONE MIX per mixer (beside its stand, on the side away from the
 *  performer) and CONTROL ROOM at the distribution point. */
/** `named`: label only these stations' mixers (a plan full of identical
 *  mixers names the lesson's own performer's; the others read the same). */
export function cueLabels(rig: CueRig, s = 0.07, named?: readonly string[]): { id: string; text: string; u: number; v: number; align: 'left' | 'center' | 'right'; alts: { u: number; v: number; align: 'left' | 'center' | 'right' }[]; point: PlanPt }[] {
  // Each name's own places hug its object (just outside it, at this scale):
  // first on the side away from the performer, then the other sides; the
  // layout falls back to free space with a leader only when all are taken.
  const out = rig.stations.filter((st) => !named || named.includes(st.id)).map((st) => {
    const r = cueMixerRect(st);
    const places = labelPlaces(r, s);
    const du = st.at.u - st.head.u;
    const dv = st.at.v - st.head.v;
    // away from the performer first
    const order = Math.abs(du) > Math.abs(dv) ? (du > 0 ? [1, 0, 3, 2] : [2, 0, 3, 1]) : dv > 0 ? [0, 1, 2, 3] : [3, 1, 2, 0];
    const ps = order.map((i) => places[i]);
    return { id: `cueMix:${st.id}`, text: 'HEADPHONE MIX', ...ps[0], alts: ps.slice(1), point: st.at };
  });
  const L = cueLayout(rig);
  const words = rig.hubLabel === undefined ? 'CONTROL ROOM' : rig.hubLabel;
  if (words) {
    const hp = labelPlaces(L.hub, s);
    // On a side wall the words run along the floor beside the wall, from
    // the wall inward (above or below the box), then out from its face; on
    // an end wall, out from its face first, then beside the box.
    const k = 1 / Math.max(1e-6, s);
    const h = L.hub;
    // a few rows along the wall either side of the box, nearest first
    const rows = [0, 1, 2, 3].flatMap((n) => [
      { below: true, d: 11 * k + n * 15 * k },
      { below: false, d: 9 * k + n * 15 * k },
    ]);
    const side = (u: number, align: 'left' | 'right') => rows.map((r) => ({ u, v: r.below ? h.v1 + r.d : h.v0 - r.d, align }));
    const ps =
      rig.wall === 'u0'
        ? [...side(h.u0, 'left'), hp[1]]
        : rig.wall === 'u1'
          ? [...side(h.u1, 'right'), hp[2]]
          : rig.wall === 'v1'
            ? [hp[3], hp[1], hp[2], ...[1, 2, 3].map((n) => ({ ...hp[3], v: hp[3].v - n * 15 * k }))]
            : [hp[0], hp[1], hp[2], ...[1, 2, 3].map((n) => ({ ...hp[0], v: hp[0].v + n * 15 * k }))];
    out.push({ id: hubId(rig), text: words, ...ps[0], alts: ps.slice(1), point: { u: (L.hub.u0 + L.hub.u1) / 2, v: (L.hub.v0 + L.hub.v1) / 2 } });
  }
  return out;
}
