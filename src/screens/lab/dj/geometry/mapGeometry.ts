/**
 * mapGeometry — the Screen 4 system map, laid out in millimetres (pure, so
 * test/djCables.test.ts can check every route). Seen from BEHIND the booth,
 * the way you reach round to wire it — that is, from the AUDIENCE side — so the
 * gear is MIRRORED: deck B on the left, the mixer, deck A on the right; the
 * booth monitors (the DJ's own: monitor L on the DJ's left) R on the left and
 * L on the right — consistent with the mixer's rear (CH 2 and MASTER R on the
 * left). The PA is named from the audience (screen 20, djRoom): PA L stands
 * at HOUSE LEFT, which is YOUR left from this side, so the two MASTER runs
 * cross once on their way out (wiring audit WF-DJ-01, owner 2026-10-20).
 *
 * TWO BANDS (visual review 2026-10-18, finding 14):
 *   ROOM   the floor, the PA speakers on tripod stands, the DJ table with the
 *          booth monitors and the gear on it — every object at ONE stated
 *          scale (ROOM_SCALE); the distances are not to scale (said on it);
 *   PATCH  everything you plug, at TRUE size: each speaker's input plate
 *          (combo input + IEC), the three rear panels, the mixer's front edge
 *          with the headphone jack, the headphones, the power strip.
 * Every cable has its own lane (D69): no two share a lane, and no route
 * passes within one plug radius of a plug it is not attached to.
 */
import { MIXER_REAR, MIXER_REAR_JACKS, PLAYER_REAR, PLAYER_REAR_JACKS, type Box, type Pt } from './boothGeometry.ts';
import { PHONES_CABLE_END, PLATE, PLATE_H, PLATE_W, STRIP_D, STRIP_OUTLET_Y, STRIP_W, stripOutletXMirrored } from './gearGeometry.ts';
import { PLUGS, type JackId, type PlugId } from '../model/djModel.ts';

export type SpeakerKey = 'paL' | 'paR' | 'boothL' | 'boothR';
export type PlugKindMap = 'rca' | 'xlr' | 'trs' | 'iec' | 'mains';

/** Plug radius (mm) as drawn plugged in: the clearance a cable keeps from
 *  any plug it is not attached to. */
export const PLUG_R: Record<PlugKindMap, number> = { rca: 5.4, xlr: 10.5, trs: 6.4, iec: 12, mains: 17 };

/** The room band's one scale: speakers, stands and table at 15 %. */
export const ROOM_SCALE = 0.15;
export const FLOOR_Y = 330;

export const MAP_FRAME: Box = { x: -8, y: -8, w: 1056, h: 840 };

export const MAP = {
  // the room band (positions of each object's centre line, mm of the map)
  room: { paL: 95, boothR: 418, boothL: 642, paR: 965, table: { x: 395, w: 270 } },
  // the patch band
  plate: { paL: { x: 20, y: 380 }, boothR: { x: 250, y: 380 }, boothL: { x: 640, y: 380 }, paR: { x: 870, y: 380 } },
  B: { x: 20, y: 526 },
  mixer: { x: 375, y: 526 },
  A: { x: 700, y: 526 },
  front: { x: 415, y: 676, w: 190, h: 18 },
  phones: { x: 150, y: 706, s: 0.35 },
  strip: { x: 365, y: 756 },
} as const;

export const plateBox = (k: SpeakerKey): Box => ({ x: MAP.plate[k].x, y: MAP.plate[k].y, w: PLATE_W, h: PLATE_H });
export const speakerInput = (k: SpeakerKey): Pt => ({ x: MAP.plate[k].x + PLATE.input.x, y: MAP.plate[k].y + PLATE.input.y });
export const speakerInlet = (k: SpeakerKey): Pt => ({ x: MAP.plate[k].x + PLATE.ac.x, y: MAP.plate[k].y + PLATE.ac.y });
export const mixerJack = (j: keyof typeof MIXER_REAR_JACKS): Pt => ({ x: MAP.mixer.x + MIXER_REAR_JACKS[j].x, y: MAP.mixer.y + MIXER_REAR_JACKS[j].y });
export const playerJack = (d: 'A' | 'B', j: keyof typeof PLAYER_REAR_JACKS): Pt => ({ x: MAP[d].x + PLAYER_REAR_JACKS[j].x, y: MAP[d].y + PLAYER_REAR_JACKS[j].y });
export const phonesJackPt: Pt = { x: MAP.front.x + 26, y: MAP.front.y + 9 };
/** Outlet `i` on the map: the strip is seen from behind too, so outlet 1 is
 *  at its RIGHT end — the cords then run to the strip without crossing. */
export const outletPt = (i: number): Pt => ({ x: MAP.strip.x + stripOutletXMirrored(i), y: MAP.strip.y + STRIP_OUTLET_Y });
export const phonesCableStart: Pt = { x: MAP.phones.x + PHONES_CABLE_END.x * MAP.phones.s, y: MAP.phones.y + PHONES_CABLE_END.y * MAP.phones.s };

/** Map anchor of any jack. */
export function jackPt(j: JackId): Pt {
  if (j.startsWith('ch') || j.startsWith('booth.') || j.startsWith('master.')) return mixerJack(j as keyof typeof MIXER_REAR_JACKS);
  if (j === 'mix.phones') return phonesJackPt;
  if (j.startsWith('strip.')) return outletPt(Number(j.slice(6)));
  return speakerInput(j.slice(0, -3) as SpeakerKey);
}

/** The fixed end of each plug's cable on the map. */
export function fixedEnd(p: PlugId): Pt | null {
  switch (p) {
    case 'A.rcaL': return playerJack('A', 'outL');
    case 'A.rcaR': return playerJack('A', 'outR');
    case 'B.rcaL': return playerJack('B', 'outL');
    case 'B.rcaR': return playerJack('B', 'outR');
    case 'mst.xlrL': return mixerJack('master.L');
    case 'mst.xlrR': return mixerJack('master.R');
    case 'bth.trsL': return mixerJack('booth.L');
    case 'bth.trsR': return mixerJack('booth.R');
    case 'phones': return phonesCableStart;
    case 'ac.playerA': return playerJack('A', 'ac');
    case 'ac.playerB': return playerJack('B', 'ac');
    case 'ac.mixer': return mixerJack('ac');
    case 'ac.paL': return speakerInlet('paL');
    case 'ac.paR': return speakerInlet('paR');
    case 'ac.boothL': return speakerInlet('boothL');
    case 'ac.boothR': return speakerInlet('boothR');
    default: return null;
  }
}

/** Each run's lane (y of its horizontal run, or x of an edge run). */
export const LANE = {
  // RCA, below the rear panels
  'B.rcaL': 642, 'B.rcaR': 650, 'A.rcaL': 658, 'A.rcaR': 666,
  // outputs, between the plates and the rear panels (MASTER L runs left to
  // PA L, MASTER R right to PA R: they cross once, at right angles)
  'mst.xlrL': 492, 'mst.xlrR': 500, 'bth.trsL': 508, 'bth.trsR': 516,
  // speaker power, under the plates, out to the room's edges, down, and in
  // over the strip (the outer cord to the outer outlet: no crossing)
  'ac.paR': 476, 'ac.paL': 476, 'ac.boothR': 484, 'ac.boothL': 484,
  // device power, between the mixer front and the strip
  'ac.mixer': 716, 'ac.playerB': 724, 'ac.playerA': 732,
} as const;
const EDGE: Partial<Record<PlugId, number>> = { 'ac.paL': 6, 'ac.boothR': 15, 'ac.boothL': 1025, 'ac.paR': 1034 };
const OVER: Partial<Record<PlugId, number>> = { 'ac.boothR': 740, 'ac.boothL': 740, 'ac.paR': 748, 'ac.paL': 748 };

/** The column an RCA (or any) cable climbs to reach a TOP-row jack, so it
 *  never runs over the bottom-row plug under it. */
const approachX = (j: JackId, b: Pt): number => (j.endsWith('.L') && (j.startsWith('ch') || j.startsWith('booth')) ? b.x - 11 : b.x);

/** The run a plug's cable takes through its lane. */
export function routeOf(p: PlugId, to: JackId | null): [number, number][] {
  const a = fixedEnd(p)!;
  const kind = PLUGS[p].kind;
  if (!to) return looseRoute(p, a);
  const b = jackPt(to);
  if (kind === 'rca') {
    const lane = LANE[p as keyof typeof LANE];
    const ax = approachX(to, b);
    return ax === b.x ? [[a.x, a.y], [a.x, lane], [b.x, lane], [b.x, b.y]] : [[a.x, a.y], [a.x, lane], [ax, lane], [ax, b.y], [b.x, b.y]];
  }
  if (kind === 'xlr' || kind === 'trs') {
    const lane = LANE[p as keyof typeof LANE];
    // a cable from the bottom-row booth jack steps sideways first, so it never
    // climbs over the booth L plug above it (finding 16)
    const start: [number, number][] = p === 'bth.trsR' ? [[a.x, a.y], [a.x - 14, a.y], [a.x - 14, lane]] : [[a.x, a.y], [a.x, lane]];
    if (to.startsWith('ch') || to.startsWith('booth') || to.startsWith('master')) {
      // into another mixer jack (a mistake the tray allows): straight across
      return [...start, [b.x, lane], [b.x, b.y]];
    }
    return [...start, [b.x, lane], [b.x, b.y]];
  }
  if (kind === 'phones') {
    return [[a.x, a.y], [a.x + 26, a.y + 3], [a.x + 45, b.y + 19], [b.x, b.y + 19], [b.x, b.y]];
  }
  // power
  const edge = EDGE[p];
  if (edge != null) {
    const lane = LANE[p as keyof typeof LANE];
    const over = OVER[p]!;
    return [[a.x, a.y], [a.x, lane], [edge, lane], [edge, over], [b.x, over], [b.x, b.y]];
  }
  const lane = LANE[p as keyof typeof LANE];
  return [[a.x, a.y], [a.x, lane], [b.x, lane], [b.x, b.y]];
}

/** A loose end: down from its fixed end a little, then where its plug lies
 *  (the drawing sags the last stretch). */
function looseRoute(p: PlugId, a: Pt): [number, number][] {
  const kind = PLUGS[p].kind;
  if (kind === 'phones') return [[a.x, a.y], [a.x + 6, a.y + 10], [a.x + 34, a.y + 22]];
  const right = p.endsWith('R') || p === 'ac.playerA' || p === 'ac.paL' || p === 'ac.boothL';
  const side = right ? 1 : -1;
  if (kind === 'iec') return [[a.x, a.y], [a.x, a.y + 16], [a.x + side * 26, a.y + 40]];
  if (p === 'bth.trsR') return [[a.x, a.y], [a.x - 14, a.y], [a.x - 14, a.y + 12], [a.x - 30, a.y + 30]];
  if (p === 'bth.trsL') return [[a.x, a.y], [a.x - 11, a.y], [a.x - 11, a.y + 12], [a.x - 4, a.y + 52]];
  return [[a.x, a.y], [a.x, a.y + 12], [a.x + side * 18, a.y + 30]];
}

/** The far plug's kind on the map: a power cord ends in a MAINS plug. */
export const farKindOf = (p: PlugId): PlugKindMap => (PLUGS[p].kind === 'iec' ? 'mains' : PLUGS[p].kind === 'phones' ? 'trs' : (PLUGS[p].kind as PlugKindMap));
export const fixedKindOf = (p: PlugId): PlugKindMap => (PLUGS[p].kind === 'phones' ? 'trs' : (PLUGS[p].kind as PlugKindMap));

/** Where each run's label flag sits (on its own lane, staggered). */
export const FLAG: Record<string, [number, number]> = {
  'B.rcaL': [170, 642], 'B.rcaR': [262, 650], 'A.rcaL': [700, 658], 'A.rcaR': [612, 666],
  'mst.xlrL': [160, 492], 'mst.xlrR': [840, 500], 'bth.trsL': [600, 508], 'bth.trsR': [384, 516],
  'ac.mixer': [575, 716], 'ac.playerB': [445, 724], 'ac.playerA': [650, 732],
  'ac.paL': [66, 748], 'ac.boothR': [236, 740], 'ac.boothL': [826, 740], 'ac.paR': [968, 748],
  phones: [330, 704],
};

/** Where the mixer outputs' flags sit while their cables hang loose (the
 *  four ends hang close together, so their flags take staggered rows). */
export const LOOSE_FLAG: Partial<Record<PlugId, [number, number]>> = {
  'bth.trsR': [384, 516], 'mst.xlrR': [548, 670], 'bth.trsL': [492, 700], 'mst.xlrL': [606, 642],
};

/** Plain-word names for the flags (9 pt on the glass). */
export const FLAG_TEXT: Record<string, string> = {
  'A.rcaL': 'A L', 'A.rcaR': 'A R', 'B.rcaL': 'B L', 'B.rcaR': 'B R',
  'mst.xlrL': 'MST L', 'mst.xlrR': 'MST R', 'bth.trsL': 'BTH L', 'bth.trsR': 'BTH R',
  phones: 'PHONES', 'ac.playerA': 'PWR A', 'ac.playerB': 'PWR B', 'ac.mixer': 'PWR MIX',
  'ac.paL': 'PWR PA L', 'ac.paR': 'PWR PA R', 'ac.boothL': 'PWR BTH L', 'ac.boothR': 'PWR BTH R',
};

/** Parallel lanes tied together every 60 mm: [plugA, plugB]. */
export const TIED: readonly [PlugId, PlugId][] = [['B.rcaL', 'B.rcaR'], ['A.rcaL', 'A.rcaR']];

export const MAP_PLUGS: readonly PlugId[] = ['A.rcaL', 'A.rcaR', 'B.rcaL', 'B.rcaR', 'mst.xlrL', 'mst.xlrR', 'bth.trsL', 'bth.trsR', 'phones', 'ac.playerA', 'ac.playerB', 'ac.mixer', 'ac.paL', 'ac.paR', 'ac.boothL', 'ac.boothR'];

/** Device bodies on the map (labels keep to the space round them). */
export const MAP_BODIES: readonly Box[] = [
  { x: MAP.B.x, y: MAP.B.y, w: PLAYER_REAR.w, h: PLAYER_REAR.h },
  { x: MAP.mixer.x, y: MAP.mixer.y, w: MIXER_REAR.w, h: MIXER_REAR.h },
  { x: MAP.A.x, y: MAP.A.y, w: PLAYER_REAR.w, h: PLAYER_REAR.h },
  { x: MAP.strip.x, y: MAP.strip.y, w: STRIP_W, h: STRIP_D },
  plateBox('paR'), plateBox('boothR'), plateBox('boothL'), plateBox('paL'),
];
