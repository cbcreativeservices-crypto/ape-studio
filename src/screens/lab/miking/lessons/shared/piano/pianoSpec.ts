/**
 * THE SHARED PIANO FAMILY — the technical truth (charter §2 layer 1) for every
 * piano the Miking Labs draw: the 88-key keyboard, the grand and baby grand
 * (case, rim, lid and its stick, the iron frame and its holes, the strings,
 * the hammer line, the dampers, the soundboard, the music desk, legs and
 * pedals), the upright (case, open top, front panels, the rear soundboard,
 * the action) and the pianist on the bench. Pure (no React Native): the
 * tests and every lesson's geometry read it directly. Lab 4 C11 builds on it;
 * the Ensembles lab (singer with piano) can reuse it.
 *
 * SIZES (docs/labs/miking/acoustic_piano/SOURCES.md §b): the grands' length
 * and width (Steinway Model B / S / D pages), the upright's height, width and
 * depth (K-52), the octave span (a 3-octave span of 49.2 cm on a museum
 * Bechstein — TRIAL for a modern keyboard), its case depth (TRIAL). Every
 * other number is a DRAWING DEFAULT (`placeholder: true`; GEOMETRY_PROPOSAL
 * §2–§5 list them, this file's comments name the few redrawn) — drawn, never
 * a readout reference.
 *
 * LESSON FRAME K (acoustic_piano/GEOMETRY_PROPOSAL.md frame P, extended to
 * the upright so one lesson can switch between them): origin = the HAMMER
 * STRIKE LINE at the keyboard's middle (the E4|F4 boundary), at the height of
 * a grand's strings; +x away from the pianist (toward a grand's tail, an
 * upright's back); +y DOWN (the floor at y = FLOOR_Y); +z toward the treble
 * end (the pianist's right). In an upright the strings stand in the plane
 * x = 0 and the hammers strike them from the pianist's side.
 */
import type { Dim, Provenance, Vec3 } from '../../../engine/model/types.ts';
import { polyDist2D } from '../../../engine/geometry/sdf.ts';

export const IN = 25.4;
const src = (s: string, quote: string): Provenance => ({ kind: 'sourced', src: s, quote });
const trial = (s: string, note: string): Provenance => ({ kind: 'trial', src: s, note });
const unk = (needed: string): Provenance => ({ kind: 'unknown', needed });
/** A drawing default: the picture needs a number no source gives. */
export const dd = (mm: number, needed: string): Dim => ({ mm, prov: unk(needed), placeholder: true });

export type Pt = readonly [number, number];

/* ═════════════════════════════ the floor, the keys ═════════════════════════════ */

/** A grand's strings 780 mm above the floor: key tops 720 + 60 (proposal §2). */
export const FLOOR = dd(780, 'the strings’ height above the floor (key tops 720 + 60)');
export const FLOOR_Y = FLOOR.mm;
/** Key tops 720 mm above the floor, for the grand and the upright alike. */
export const KEY_TOP_Y = FLOOR_Y - 720;

/** 88 keys, 52 white; the octave span is the museum Bechstein's (TRIAL). */
export const KEYBOARD = {
  keys: 88,
  white: 52,
  octave: { mm: 164, prov: trial('MET-BECH', '"3-octave span 49.2 cm" on a ca. 1893 grand, read as 164 mm per octave') } as Dim,
};
export const WHITE = KEYBOARD.octave.mm / 7; // 23.43 (DERIVED)
export const KEYS_WIDTH = KEYBOARD.white * WHITE; // 1218.3 (DERIVED)
export const KEYS_Z0 = -KEYS_WIDTH / 2; // the bass end (A0's left edge)
/** The visible lengths of the white and black keys, and a black key's width. */
export const KEY_DIMS = {
  whiteLen: dd(150, 'the white key’s visible length'),
  blackLen: dd(95, 'the black key’s visible length'),
  blackW: dd(13.6, 'the black key’s width (0.58 of a white key’s pitch)'),
};
const LETTERS = 'ABCDEFG';

/** White key i (0 = A0 … 51 = C8): its letter, octave number and z span. */
export function whiteKey(i: number): { letter: string; octave: number; z0: number; z1: number } {
  const letter = LETTERS[i % 7];
  // Octave numbers change at C: A0, B0, C1 … (i = 2 is C1).
  const octave = Math.floor((i + 5) / 7);
  return { letter, octave, z0: KEYS_Z0 + i * WHITE, z1: KEYS_Z0 + (i + 1) * WHITE };
}
/** The 36 black keys, each centred on the boundary after a C, D, F, G or A
 *  white key (a drawing simplification: real black keys sit a little off
 *  centre). */
export function blackKeys(): { z0: number; z1: number }[] {
  const out: { z0: number; z1: number }[] = [];
  const w = KEY_DIMS.blackW.mm;
  for (let i = 0; i < KEYBOARD.white - 1; i++) {
    if ('CDFGA'.includes(LETTERS[i % 7])) {
      const zb = KEYS_Z0 + (i + 1) * WHITE;
      out.push({ z0: zb - w / 2, z1: zb + w / 2 });
    }
  }
  return out;
}
/** The keyboard's middle (E4|F4): white key 26's left edge — z = 0. */
export const MIDDLE_Z = KEYS_Z0 + 26 * WHITE;
/** Middle A (A4, white key 28): its centre, +58.6 mm (DERIVED). */
export const A4_Z = KEYS_Z0 + 28.5 * WHITE;
/** The z of key k's centre (k = 1 … 88, A0 … C8) at the hammer line, spread
 *  evenly (a drawing simplification of the action's layout). */
export function keyZ(k: number): number {
  return KEYS_Z0 + ((k - 0.5) / KEYBOARD.keys) * KEYS_WIDTH;
}

/** Equal-tempered pitch of key k (A0 = 1 → 27.5 Hz; C8 = 88 → 4186.0 Hz). */
export function keyHz(k: number): number {
  return 440 * Math.pow(2, (k - 49) / 12);
}

/* ═══════════════════════════════════ GRANDS ════════════════════════════════════ */

export type GrandId = 'B' | 'S' | 'D';
export type LidState = 'full' | 'short' | 'closed' | 'off';

export type GrandSpec = { id: GrandId; name: string; length: Dim; width: Dim; longest?: Dim };

export const GRANDS: Record<GrandId, GrandSpec> = {
  B: {
    id: 'B',
    name: 'grand piano (about 2.1 m)',
    length: { mm: 2110, prov: src('SW-B', 'Length 6\' 11" (211 cm)') },
    width: { mm: 1480, prov: src('SW-B', 'Width 58" (148 cm)') },
    longest: { mm: 1510, prov: src('SW-B', 'longest string "Agraffe/bridge: 59¼" (151 cm)"') },
  },
  S: {
    id: 'S',
    name: 'baby grand (about 1.55 m)',
    length: { mm: 1550, prov: src('SW-S', 'Length 5\' 1" (155 cm)') },
    width: { mm: 1470, prov: src('SW-S', 'Width 57¾" (147 cm)') },
    longest: { mm: 1160, prov: src('SW-S', 'longest string 45½" (116 cm)') },
  },
  D: {
    id: 'D',
    name: 'concert grand (about 2.7 m)',
    length: { mm: 2740, prov: src('SW-D', 'Length 8\' 11¾" (274 cm)') },
    width: { mm: 1560, prov: src('SW-D', 'Width 61¾" (156 cm)') },
  },
};

/** Grand drawing defaults (GEOMETRY_PROPOSAL §2; the rim and lid redrawn —
 *  CORRECTIONS_LOG C11-G1/G2). */
export const GRAND_DIMS = {
  keyFront: dd(-470, 'the key fronts’ x (a grand’s longest key is 622 mm; the hammer line sits under its back half)'),
  /** Rim top 150 mm above the strings and a 355 mm deep case: the museum
   *  Bechstein's case depth (TRIAL) puts the strings well below the rim. */
  rimTop: dd(-150, 'the rim top above the strings'),
  caseDepth: { mm: 355, prov: trial('MET-BECH', '"D. of case 35.5 cm w/o lid", a ca. 1893 grand') } as Dim,
  rimT: dd(55, 'the rim’s thickness'),
  lidT: dd(25, 'the lid’s thickness'),
  /** The main lid starts here; its front flap is folded back onto it. */
  lidFront: dd(-150, 'where the main lid begins (its front flap folded back)'),
  /** 26° on the full stick, 11° on the short stick (UNKNOWN; redrawn from
   *  the proposal's 40°/15° so the sticks keep the case's proportions). */
  lidFull: dd(26, 'the lid’s angle on the full stick'),
  lidShort: dd(11, 'the lid’s angle on the short stick'),
  stickX: dd(150, 'where the stick’s socket sits on the treble rim'),
  /** The strings frame's top (the iron frame's bars, the bridge pins). */
  frameTop: dd(-30, 'the top of the strings and the iron frame’s bars'),
  soundboardY: dd(90, 'the soundboard under the strings'),
  pinblock: dd(-170, 'the tuning pins’ back edge'),
  damperX0: dd(15, 'the damper heads’ span along the strings'),
  damperX1: dd(95, 'the damper heads’ span along the strings'),
  damperTop: dd(-95, 'the damper heads’ height over the strings'),
  /** The highest notes are drawn without dampers (a drawing default). */
  damperLastKey: dd(70, 'the highest key drawn with a damper'),
  deskX0: dd(-310, 'the music desk'),
  deskX1: dd(-220, 'the music desk'),
  deskTop: dd(-520, 'the music desk’s top edge'),
  deskHalfW: dd(420, 'the music desk’s half width'),
  holeR: dd(50, 'the iron frame’s round holes'),
  legR: dd(45, 'a leg’s radius'),
  lyreX: dd(-300, 'the pedal lyre'),
};
const G = (k: keyof typeof GRAND_DIMS) => GRAND_DIMS[k].mm;

export const LID_DEG: Record<LidState, number> = { full: G('lidFull'), short: G('lidShort'), closed: 0, off: 0 };

export type StringRun = { k: number; bass: boolean; a: Pt; b: Pt };

export type GrandGeom = {
  spec: GrandSpec;
  xKey: number;
  xTail: number;
  hw: number;
  rimTop: number;
  caseBottom: number;
  /** The bentside's z at x (the curved treble wall), for x in [xs, the tail round]. */
  bentZ: (x: number) => number;
  xs: number;
  /** The tail round: its centre and radius (plan). */
  tail: { cx: number; cz: number; r: number };
  /** Outer plan outline (closed, keyboard end first). */
  outline: Pt[];
  /** The open interior over the strings (plan). */
  inner: Pt[];
  /** The rim as one band (outer then inner), open across the keyboard. */
  rimBand: Pt[];
  /** The main lid's plan shape (the outline behind `lidFront`). */
  lidPlan: Pt[];
  /** The point where the bentside's outward normal points at 45° (+x, +z). */
  curve: { p: Vec3; n: Vec3 };
  holes: { id: 'high' | 'low'; c: Vec3; r: number }[];
  strings: StringRun[];
  longBridge: Pt[];
  bassBridge: Pt[];
  dampers: { z0: number; z1: number };
  desk: { x0: number; x1: number; y0: number; y1: number; hw: number };
  legs: Vec3[];
  lyre: { x: number; z: number };
  stick: { x: number; z: number };
};

/** The bentside: from the straight treble side's end (xs, +hw) to the tail
 *  round's top (cx, cz + r), z = zEnd + (hw − zEnd)·(1 − u)^1.6 — a drawing
 *  default for the classic inward curve (no maker drawing was read). */
const BENT_P = 1.6;

const geomCache = new Map<GrandId, GrandGeom>();

export function grandGeom(id: GrandId): GrandGeom {
  const hit = geomCache.get(id);
  if (hit) return hit;
  const spec = GRANDS[id];
  const L = spec.length.mm;
  const hw = spec.width.mm / 2;
  const xKey = G('keyFront');
  const xTail = L + xKey;
  const rimTop = G('rimTop');
  const caseBottom = rimTop + GRAND_DIMS.caseDepth.mm;
  const xs = xKey + 0.365 * L;
  // The tail round: a little tighter on a short case (drawing default).
  const rt = spec.width.mm * (0.15 - 0.03 * Math.max(0, Math.min(1, (2110 - L) / 560)));
  const tail = { cx: xTail - rt, cz: -hw + rt, r: rt };
  const zEnd = tail.cz + rt;
  const bentZ = (x: number) => {
    const u = Math.max(0, Math.min(1, (x - xs) / (tail.cx - xs)));
    return zEnd + (hw - zEnd) * Math.pow(1 - u, BENT_P);
  };
  const ring = (inset: number, front: number): Pt[] => {
    const pts: Pt[] = [];
    const h = hw - inset;
    pts.push([front, -h], [front, h], [xs, h]);
    const N = 22;
    for (let i = 1; i <= N; i++) {
      const x = xs + ((tail.cx - xs) * i) / N;
      pts.push([x, bentZ(x) - inset]);
    }
    const M = 10;
    for (let i = 1; i <= M; i++) {
      const a = Math.PI / 2 - (Math.PI * i) / M;
      pts.push([tail.cx + (rt - inset) * Math.cos(a), tail.cz + (rt - inset) * Math.sin(a)]);
    }
    return pts;
  };
  const outline = ring(0, xKey);
  const t = G('rimT');
  const inner = ring(t, -140);
  // The rim band: outer from behind the keys round to the treble side, then
  // the inner outline back (one polygon; the open interior is not in it).
  const outerFromKeys = ring(0, -140);
  const rimBand: Pt[] = [...outerFromKeys.slice(1), outerFromKeys[0], ...[...inner.slice(1), inner[0]].reverse()];
  const lidPlan = ring(0, G('lidFront'));

  // Where the bentside faces 45° out (slope dz/dx = −1): DERIVED from bentZ.
  let best = xs;
  let bestErr = Infinity;
  for (let x = xs; x <= tail.cx; x += 2) {
    const m = (bentZ(x + 1) - bentZ(x - 1)) / 2;
    if (Math.abs(m + 1) < bestErr) {
      bestErr = Math.abs(m + 1);
      best = x;
    }
  }
  const curve = { p: { x: best, y: rimTop, z: bentZ(best) }, n: { x: Math.SQRT1_2, y: 0, z: Math.SQRT1_2 } };

  // STRINGS (drawing defaults, overstrung; only the longest is sourced): the
  // bass strings (keys 1–20) run on a higher plane, angled a little toward
  // the treble, across the tenor strings to the bass bridge near the tail;
  // the tenor and treble strings run back from the agraffes, fanning toward
  // the bass side, to the long bridge (the line through their ends). Their
  // lengths shorten toward the treble by a drawing rule (× 1.88 per octave,
  // 52 mm at the top), capped where the case runs out.
  const longest = spec.longest?.mm ?? 0.715 * L;
  const sL = longest / 1510;
  const BASS = 20;
  const strings: StringRun[] = [];
  for (let k = 1; k <= KEYBOARD.keys; k++) {
    const z = keyZ(k);
    if (k <= BASS) {
      const f = (k - 1) / (BASS - 1);
      const len = longest - f * 330 * sL;
      // A shorter case leaves less room to angle them: the fan narrows with it.
      const ang = ((2.5 + 4.5 * f) * Math.max(0.2, Math.min(1, (sL - 0.7) / 0.3)) * Math.PI) / 180;
      strings.push({ k, bass: true, a: [-190, z], b: fit(inner, -190, z, ang, len) });
      continue;
    }
    const f = (k - BASS - 1) / (KEYBOARD.keys - BASS - 1);
    const len = Math.min(1180 * sL, 52 * Math.pow(1.88, (KEYBOARD.keys - k) / 12));
    const ang = (-14 * Math.pow(1 - f, 1.4) * Math.PI) / 180;
    const ax = -40 - 90 * (1 - f);
    strings.push({ k, bass: false, a: [ax, z], b: fit(inner, ax, z, ang, len) });
  }
  const longBridge: Pt[] = strings.filter((s) => !s.bass).map((s) => s.b).reverse();
  const bassBridge: Pt[] = [strings[BASS - 1].b, strings[0].b];

  // Two of the iron frame's round holes, named in DPA's piano article ("the
  // high hole … towards the last (or second to last) octave of low
  // strings"). Where they sit is a drawing default: the high one between the
  // treble bridge and the bentside, the low one under the lowest strings.
  const hx = xKey + 0.46 * (xTail - xKey);
  const holes = [
    { id: 'high' as const, c: { x: hx, y: 0, z: bentZ(hx) - t - 67 }, r: G('holeR') },
    { id: 'low' as const, c: { x: -190 + 0.45 * longest, y: 0, z: keyZ(4) + 20 }, r: G('holeR') },
  ];

  const dampers = { z0: keyZ(1) - 8, z1: keyZ(G('damperLastKey')) + 8 };
  const desk = { x0: G('deskX0'), x1: G('deskX1'), y0: G('deskTop'), y1: rimTop + 90, hw: G('deskHalfW') };
  const legs: Vec3[] = [
    { x: xKey + 150, y: 0, z: -hw + 110 },
    { x: xKey + 150, y: 0, z: hw - 110 },
    { x: tail.cx - 60, y: 0, z: tail.cz - 20 },
  ];
  const g: GrandGeom = {
    spec,
    xKey,
    xTail,
    hw,
    rimTop,
    caseBottom,
    bentZ,
    xs,
    tail,
    outline,
    inner,
    rimBand,
    lidPlan,
    curve,
    holes,
    strings,
    longBridge,
    bassBridge,
    dampers,
    desk,
    legs,
    lyre: { x: G('lyreX'), z: 0 },
    stick: { x: G('stickX'), z: hw - t / 2 },
  };
  geomCache.set(id, g);
  return g;
}

/** A string's far end: `len` along the angle, shortened (if it must be) to
 *  end at least 30 mm inside the case — a small case shortens its strings. */
function fit(inner: Pt[], x: number, z: number, ang: number, len: number): Pt {
  let l = len;
  while (l > 30 && polyDist2D(inner, x + l * Math.cos(ang), z + l * Math.sin(ang)) > -30) l -= 5;
  return [x + l * Math.cos(ang), z + l * Math.sin(ang)];
}

/** The lid's UNDERSIDE height over plan z (its hinge on the bass rim). */
export function lidUnderY(g: GrandGeom, state: LidState, z: number): number {
  return g.rimTop - (z + g.hw) * Math.tan((LID_DEG[state] * Math.PI) / 180);
}
/** The stick: from its socket on the treble rim, leaning in to a cup under
 *  the lid near its free edge (none closed or off). The cup's place (90 % of
 *  the way across the lid) is a drawing default; at 26° the stick comes out
 *  about 64 cm long, at 11° about 29 cm. */
export function stickOf(g: GrandGeom, state: LidState): { a: Vec3; b: Vec3 } | null {
  if (state === 'closed' || state === 'off') return null;
  const cup = lidPoint(g, state, g.stick.x, -g.hw + 0.9 * 2 * g.hw, 'under');
  return { a: { x: g.stick.x, y: g.rimTop, z: g.stick.z }, b: cup };
}
/** A plan point (x, z) of the lid, turned up on its hinge: its top-face
 *  position in the side view (x, y) and the plan (x, z). */
export function lidPoint(g: GrandGeom, state: LidState, x: number, z: number, face: 'top' | 'under' = 'top'): Vec3 {
  const a = (LID_DEG[state] * Math.PI) / 180;
  const dz = z + g.hw;
  const t = face === 'top' ? G('lidT') : 0;
  // The forward turn of (dz, dy = −t) about the hinge (y = rimTop, z = −hw).
  return { x, y: g.rimTop + -dz * Math.sin(a) + -t * Math.cos(a), z: -g.hw + dz * Math.cos(a) - t * Math.sin(a) };
}

/* ═══════════════════════════════════ UPRIGHT ═══════════════════════════════════ */

/** The upright (K-52 sizes), in frame K: strings in the plane x = 0, the
 *  case back at x = +100, the key fronts 680 in front of it. Every inside
 *  position is a drawing default (proposal §3, redrawn so the strings sit
 *  just in front of the soundboard — CORRECTIONS_LOG C11-G3). */
export const UPRIGHT = {
  height: { mm: 1320, prov: src('SW-K52', 'Height 52" (132 cm)') } as Dim,
  width: { mm: 1525, prov: src('SW-K52', 'Width 60" (152.5 cm)') } as Dim,
  depth: { mm: 680, prov: src('SW-K52', 'Depth 26 ¾" (68 cm)') } as Dim,
};
export const UPRIGHT_DIMS = {
  back: dd(100, 'the case back behind the strings (back posts and soundboard)'),
  soundboard0: dd(28, 'the soundboard’s front face behind the strings'),
  soundboard1: dd(40, 'the soundboard’s back face'),
  hammerH: dd(950, 'the hammer line’s height above the floor'),
  hammerRest: dd(-45, 'the hammer heads at rest, in front of the strings'),
  actionFront: dd(-200, 'the action’s front'),
  panelX: dd(-230, 'the upper front panel'),
  panelT: dd(18, 'the front panels’ thickness'),
  panelBottomH: dd(760, 'the upper panel’s lower edge (above the keys)'),
  panelTopH: dd(1250, 'the upper panel’s top edge'),
  lowerBoardX: dd(-200, 'the lower front board under the keybed'),
  keybedH: dd(600, 'the keybed’s underside'),
  topOpen0: dd(-220, 'the open top’s front edge'),
  topOpen1: dd(60, 'the open top’s back edge'),
  stringLow: dd(130, 'the strings’ lowest point above the floor'),
  stringHigh: dd(1250, 'the strings’ top (tuning pins) above the floor'),
  wallX: dd(500, 'a wall behind, 40 cm from the back (proposal: never pressed to the wall)'),
  lidLean: dd(12, 'the open top lid leaning back from upright'),
  lidLen: dd(560, 'the top lid’s depth'),
};
const U = (k: keyof typeof UPRIGHT_DIMS) => UPRIGHT_DIMS[k].mm;

export type UprightGeom = {
  hw: number;
  xBack: number;
  xKey: number;
  yTop: number;
  hammerY: number;
  actionFront: number;
  keyTopY: number;
  panel: { x: number; t: number; y0: number; y1: number };
  lower: { x: number; y0: number; y1: number };
  keybedY: number;
  soundboard: { x0: number; x1: number; y0: number; y1: number };
  strings: { y0: number; y1: number };
  top: { x0: number; x1: number };
  lid: { hinge: Vec3; tip: Vec3 };
  wallX: number;
};

export function uprightGeom(): UprightGeom {
  const yH = (h: number) => FLOOR_Y - h;
  const xBack = U('back');
  const lean = (U('lidLean') * Math.PI) / 180;
  const hinge = { x: xBack, y: yH(UPRIGHT.height.mm), z: 0 };
  return {
    hw: UPRIGHT.width.mm / 2,
    xBack,
    xKey: xBack - UPRIGHT.depth.mm,
    yTop: yH(UPRIGHT.height.mm),
    hammerY: yH(U('hammerH')),
    actionFront: U('actionFront'),
    keyTopY: KEY_TOP_Y,
    panel: { x: U('panelX'), t: U('panelT'), y0: yH(U('panelTopH')), y1: yH(U('panelBottomH')) },
    lower: { x: U('lowerBoardX'), y0: yH(U('keybedH')) + 30, y1: FLOOR_Y - 60 },
    keybedY: yH(U('keybedH')),
    soundboard: { x0: U('soundboard0'), x1: U('soundboard1'), y0: yH(U('stringHigh')) + 20, y1: yH(U('stringLow')) + 20 },
    strings: { y0: yH(U('stringHigh')), y1: yH(U('stringLow')) },
    top: { x0: U('topOpen0'), x1: U('topOpen1') },
    lid: { hinge, tip: { x: xBack + Math.sin(lean) * U('lidLen'), y: hinge.y - Math.cos(lean) * U('lidLen'), z: 0 } },
    wallX: U('wallX'),
  };
}

/* ═════════════════════════════ THE PIANIST (ILLUSTRATIVE) ═════════════════════ */

/** Proposal §5 (drawing defaults): bench 760 × 360, seat 480 up, its front
 *  edge 250 from the key fronts; the head (r 110) 1250 up, 450 from the key
 *  fronts; the hands over the keys; the feet on the pedals. */
export const PIANIST_DIMS = {
  benchW: dd(760, 'the bench’s width'),
  benchD: dd(360, 'the bench’s depth'),
  seatH: dd(480, 'the seat height'),
  benchGap: dd(250, 'the bench’s front edge from the key fronts'),
  headH: dd(1250, 'the pianist’s head height (seated)'),
  headBack: dd(450, 'the pianist’s head from the key fronts'),
  headR: dd(110, 'the head’s radius'),
};

export type Pianist = {
  bench: { x0: number; x1: number; y: number; hw: number };
  head: Vec3;
  headR: number;
  /** Torso and head; arms and hands; feet and pedals (keep-outs, ILLUSTRATIVE). */
  body: { min: Vec3; max: Vec3 };
  arms: { min: Vec3; max: Vec3 };
  feet: { min: Vec3; max: Vec3 };
};

export function pianistAt(xKey: number, pedalX: number): Pianist {
  const P = (k: keyof typeof PIANIST_DIMS) => PIANIST_DIMS[k].mm;
  const bx1 = xKey - P('benchGap');
  const bx0 = bx1 - P('benchD');
  const head = { x: xKey - P('headBack'), y: FLOOR_Y - P('headH'), z: 0 };
  return {
    bench: { x0: bx0, x1: bx1, y: FLOOR_Y - P('seatH'), hw: P('benchW') / 2 },
    head,
    headR: P('headR'),
    body: { min: { x: bx0 - 20, y: head.y - P('headR') - 10, z: -280 }, max: { x: bx1 - 40, y: FLOOR_Y - P('seatH'), z: 280 } },
    arms: { min: { x: bx1 - 40, y: KEY_TOP_Y - 250, z: -650 }, max: { x: xKey + 140, y: KEY_TOP_Y, z: 650 } },
    feet: { min: { x: bx1 - 60, y: FLOOR_Y - 170, z: -300 }, max: { x: pedalX + 120, y: FLOOR_Y, z: 300 } },
  };
}
