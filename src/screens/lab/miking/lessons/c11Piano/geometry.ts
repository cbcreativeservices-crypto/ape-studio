/**
 * C11 PIANO — where things are (charter §2 layer 2), in lesson frame K
 * (model.ts). Every solid, anchor and view box is BUILT from the shared
 * piano family (pianoSpec.ts), so the drawing, the hit areas, the zones and
 * the readouts agree at every zoom. Clearances and the pianist are
 * ILLUSTRATIVE (no source gives one).
 *
 *   grand / short / baby  the case as its rim (one band) and the strings-
 *                         and-frame block inside it (the mic stays over
 *                         them), the lid on its hinge at the set-up's angle,
 *                         the stick, the damper row, the pin block and
 *                         fallboard, the music desk, the keys and cheeks,
 *                         three legs, the lyre and pedals.
 *   upright / uprightFront  the back and soundboard, the strings, the
 *                         action, the top's front strip, the open lid, the
 *                         keys, the lower front, the toe blocks, the pedals,
 *                         the upper front panel (off in uprightFront), and
 *                         the wall behind.
 */
import type { Envelope, InstrumentModel, Part, Provenance, ReferenceSurface, RefLine, Shape3, VariantId } from '../../engine/model/types.ts';
import { dd, FLOOR, FLOOR_Y, GRAND_DIMS, KEY_DIMS, KEY_TOP_Y, KEYS_Z0, LID_DEG, pianistAt, stickOf, type GrandGeom, type LidState } from '../shared/piano/pianoSpec.ts';
import { GB, GS, UP, type PianoVariant } from './model.ts';

const ill = (reason: string): Provenance => ({ kind: 'illustrative', reason });
const size = (k: 'B' | 'S'): Provenance => ({ kind: 'sourced', src: k === 'B' ? 'SW-B' : 'SW-S', quote: k === 'B' ? 'Length 6\' 11" (211 cm); Width 58" (148 cm)' : 'Length 5\' 1" (155 cm); Width 57¾" (147 cm)' });
const dflt = ill('a drawing default (acoustic_piano/GEOMETRY_PROPOSAL.md §2–§3)');

/** Clearances (ILLUSTRATIVE; the owner approves the values). */
export const CLEAR = {
  strings: dd(25, 'clearance over the strings, the frame and the dampers'),
  lid: dd(15, 'clearance under the lid'),
  action: dd(20, 'clearance from the upright’s action'),
};

const box = (x0: number, y0: number, z0: number, x1: number, y1: number, z1: number): Shape3 => ({ kind: 'box', min: { x: Math.min(x0, x1), y: Math.min(y0, y1), z: Math.min(z0, z1) }, max: { x: Math.max(x0, x1), y: Math.max(y0, y1), z: Math.max(z0, z1) } });

/** One grand's parts (B for the grand set-ups, S for the baby), ids prefixed. */
function grandParts(g: GrandGeom, pre: 'gp' | 'bg', variants: VariantId[], lids: Partial<Record<VariantId, LidState>>, k: 'B' | 'S'): Part[] {
  const V = variants;
  const out: Part[] = [];
  const keyBack = g.xKey + KEY_DIMS.whiteLen.mm;
  out.push(
    { id: `${pre}.rim`, label: 'rim (the case)', short: 'rim', role: 'The curved case wall. Its top edge is where the lid rests; the long straight side is the bass side, the curved one the treble side.', prov: size(k), variants: V, solid: { kind: 'prism', pts: g.rimBand, y0: g.rimTop, y1: g.caseBottom } },
    { id: `${pre}.strings`, label: 'strings', short: 'strings', role: 'Steel strings — two or three per note above the bass, wound with copper in the bass, which crosses over the rest. The hammers strike them from below.', moving: true, clearance: CLEAR.strings, prov: dflt, variants: V, solid: { kind: 'prism', pts: g.inner, y0: GRAND_DIMS.frameTop.mm, y1: g.caseBottom } },
    { id: `${pre}.frame`, label: 'iron frame (the plate)', short: 'frame', role: 'The cast-iron frame that holds the strings’ huge combined pull. Its round holes and windows show the soundboard below.', prov: dflt, variants: V },
    { id: `${pre}.holes`, label: 'sound holes in the frame', short: 'holes', role: 'Round holes in the iron frame. A single mic aimed into one can carry the piano on one input; magnets or small mics sometimes sit near them, with the owner’s agreement.', prov: { kind: 'sourced', src: 'DPA-PIANO', quote: 'in or near the sound holes … Place at the high hole and another towards the last (or second to last) octave of low strings' }, variants: V },
    { id: `${pre}.soundboard`, label: 'soundboard', short: 'soundboard', role: 'The thin spruce board under the strings. The bridges pass the strings’ vibration to it, and its large surface moves the air — up toward the lid, and down under the piano.', prov: dflt, variants: V },
    { id: `${pre}.bridges`, label: 'bridges', short: 'bridges', role: 'Hardwood rails glued to the soundboard. The strings press on them, and their vibration reaches the board through them.', prov: dflt, variants: V },
    { id: `${pre}.dampers`, label: 'dampers', short: 'dampers', role: 'Felt pads resting on the strings just past the hammers. A key (or the sustain pedal) lifts them; when they fall back, the note stops. They move — nothing may touch them.', moving: true, clearance: CLEAR.strings, prov: dflt, variants: V, solid: box(GRAND_DIMS.damperX0.mm, GRAND_DIMS.damperTop.mm, g.dampers.z0, GRAND_DIMS.damperX1.mm, 0, g.dampers.z1) },
    { id: `${pre}.hammers`, label: 'hammers (the hammer line)', short: 'hammers', role: 'Felt hammers under the strings, thrown up by the keys. The dashed line is where they strike: starting points are measured back from it.', moving: true, prov: dflt, variants: V },
    { id: `${pre}.pins`, label: 'tuning pins and pin block', short: 'tuning pins', role: 'Where the strings are anchored and tuned, in front of the hammers. A tuner’s territory — nothing rests on it.', prov: dflt, variants: V, solid: box(keyBack, -60, -g.hw + 60, -140, g.caseBottom, g.hw - 60) },
    { id: `${pre}.desk`, label: 'music desk', short: 'desk', role: 'The music stand over the pin block. The pianist reads here: keep stands and mics out of their sight line.', prov: dflt, variants: V, solid: box(g.desk.x0 - 25, g.desk.y0, -g.desk.hw, g.desk.x1 + 8, g.desk.y1, g.desk.hw) },
    { id: `${pre}.keys`, label: 'keys', short: 'keys', role: '88 keys: 52 white, 36 black. Each key throws a hammer at its strings and lifts that note’s damper.', moving: true, prov: { kind: 'trial', src: 'MET-BECH', note: 'the octave span (164 mm) sets the keyboard’s width' }, variants: V, solid: box(g.xKey, KEY_TOP_Y - 20, KEYS_Z0, keyBack, g.caseBottom, -KEYS_Z0) },
    { id: `${pre}.cheekBass`, label: 'cheek', short: 'cheek', role: 'The case beside the keys.', prov: dflt, variants: V, listIn: [], solid: box(g.xKey, -60, -g.hw, -140, g.caseBottom, KEYS_Z0) },
    { id: `${pre}.cheekTreble`, label: 'cheek', short: 'cheek', role: 'The case beside the keys.', prov: dflt, variants: V, listIn: [], solid: box(g.xKey, -60, -KEYS_Z0, -140, g.caseBottom, g.hw) },
  );
  for (const v of V) {
    const lid = lids[v] ?? 'full';
    const st = stickOf(g, lid);
    out.push({
      id: `${pre}.lid.${v}`,
      label: lid === 'short' ? 'lid (on the short stick)' : 'lid (on the full stick)',
      short: 'lid',
      role: lid === 'short' ? 'Propped low on the short stick: less sound thrown out to the room, more separation — and much less room for a mic underneath.' : 'Hinged on the bass side and propped open on its stick, it reflects the soundboard’s sound out toward the curved side — usually the audience. Never reach under a lid that is not safely propped.',
      clearance: CLEAR.lid,
      prov: ill('lid angle UNKNOWN: a drawing default'),
      variants: [v],
      solid: { kind: 'prism', pts: g.lidPlan, y0: g.rimTop - GRAND_DIMS.lidT.mm, y1: g.rimTop, hinge: { y: g.rimTop, z: -g.hw, deg: LID_DEG[lid] } },
    });
    if (st) out.push({ id: `${pre}.stick.${v}`, label: lid === 'short' ? 'short stick' : 'lid stick (full)', short: 'stick', role: 'The prop that holds the lid. Set by someone who knows the piano; never adjust it, or reach under the lid, to place a mic.', prov: dflt, variants: [v], solid: { kind: 'capsule', a: st.a, b: st.b, r: 14 } });
  }
  g.legs.forEach((l, i) =>
    out.push({ id: `${pre}.leg${i}`, label: 'legs', short: 'legs', role: 'Three legs on casters.', prov: dflt, variants: V, listIn: i === 0 ? undefined : [], solid: { kind: 'capsule', a: { x: l.x, y: g.caseBottom, z: l.z }, b: { x: l.x, y: FLOOR_Y - 40, z: l.z }, r: GRAND_DIMS.legR.mm } }),
  );
  out.push({ id: `${pre}.lyre`, label: 'pedal lyre and pedals', short: 'pedals', role: 'The pedals under the keyboard’s middle, worked by the pianist’s feet. Pedal thumps travel into the floor and stands: keep a stand’s feet away.', moving: true, prov: { kind: 'illustrative', reason: 'proposal §5: pedals at x = −400 (drawn at −300 under the keys)' }, variants: V, solid: box(g.lyre.x - 190, g.caseBottom, -110, g.lyre.x + 80, FLOOR_Y, 110) });
  return out;
}

function uprightParts(): Part[] {
  const V = ['upright', 'uprightFront'];
  const u = UP;
  const yH = u.hammerY;
  return [
    { id: 'up.back', label: 'soundboard and back', short: 'soundboard', role: 'The upright’s soundboard stands at the back, behind the strings, with its ribs and the back posts behind it. Much of the sound leaves from the back — so the wall behind matters.', prov: dflt, variants: V, solid: box(u.soundboard.x0, u.yTop, -u.hw, u.xBack, FLOOR_Y - 10, u.hw) },
    { id: 'up.strings', label: 'strings and iron frame', short: 'strings', role: 'The strings stand upright, just in front of the soundboard, held by the iron frame; the bass strings cross over the others.', moving: true, clearance: CLEAR.action, prov: dflt, variants: V, solid: box(-14, u.strings.y0 - 70, -u.hw + 30, u.soundboard.x0, u.strings.y1 + 60, u.hw - 30) },
    { id: 'up.action', label: 'hammers and dampers (the action)', short: 'action', role: 'In front of the strings: the hammers swing forward to strike them at the hammer line, and the dampers rest on them just above. Nothing may touch any of it.', moving: true, clearance: CLEAR.action, prov: dflt, variants: V, solid: box(-95, yH - 160, -u.hw + 30, -14, yH + 60, u.hw - 30) },
    { id: 'up.actionLow', label: 'hammers and dampers (the action)', short: 'action', role: 'The action’s shanks, butts and levers, below the hammer heads.', moving: true, clearance: CLEAR.action, prov: dflt, variants: V, listIn: [], solid: box(u.actionFront, yH + 60, -u.hw + 30, -14, KEY_TOP_Y, u.hw - 30) },
    { id: 'up.top', label: 'top lid (open)', short: 'lid', role: 'The top lid, propped open (or removed by the owner): mics go just over the opening, or inside it above the action.', prov: dflt, variants: V, solid: { kind: 'capsule', a: u.lid.hinge, b: u.lid.tip, r: 16 } },
    { id: 'up.caseTop', label: 'case top', short: 'case', role: 'The case’s front strip and back rail around the opening.', prov: dflt, variants: V, listIn: [], solid: box(u.panel.x - 18, u.yTop, -u.hw, u.top.x0, u.yTop + 22, u.hw) },
    { id: 'up.ends', label: 'case ends', short: 'case', role: 'The case’s two ends.', prov: { kind: 'sourced', src: 'SW-K52', quote: 'Width 60" (152.5 cm)' }, variants: V, listIn: [], solid: box(u.panel.x - 18, u.yTop, u.hw - 30, u.xBack, u.keybedY + 30, u.hw) },
    { id: 'up.endsBass', label: 'case ends', short: 'case', role: 'The case’s two ends.', prov: dflt, variants: V, listIn: [], solid: box(u.panel.x - 18, u.yTop, -u.hw, u.xBack, u.keybedY + 30, -u.hw + 30) },
    { id: 'up.panel', label: 'upper front panel', short: 'panel', role: 'The board in front of the action, above the keys. Only the owner or a technician takes it off — then a mic can face the hammers.', prov: dflt, variants: ['upright'], solid: box(u.panel.x - u.panel.t, u.panel.y0, -u.hw, u.panel.x, u.panel.y1, u.hw) },
    { id: 'up.keys', label: 'keys', short: 'keys', role: '88 keys; each one swings a hammer forward against its strings.', moving: true, prov: { kind: 'trial', src: 'MET-BECH', note: 'the octave span sets the keyboard’s width' }, variants: V, solid: box(u.xKey, KEY_TOP_Y - 20, -u.hw, u.panel.x, u.keybedY + 30, u.hw) },
    { id: 'up.lower', label: 'lower front board', short: 'lower board', role: 'The board by the pianist’s knees. Behind it are the lower strings and the pedal works: a mic there hears feet and pedal thumps too.', prov: dflt, variants: V, solid: box(u.lower.x - 18, u.keybedY + 30, -u.hw, -14, FLOOR_Y - 10, u.hw) },
    { id: 'up.toe', label: 'toe blocks and casters', short: 'toe blocks', role: 'The supports under the keys’ ends.', prov: dflt, variants: V, listIn: [], solid: box(u.xKey + 30, u.keybedY + 30, -u.hw, u.xKey + 110, FLOOR_Y, u.hw) },
    { id: 'up.pedals', label: 'pedals', short: 'pedals', role: 'Worked by the pianist’s feet; their thumps travel into the floor.', moving: true, prov: dflt, variants: V, solid: box(-650, FLOOR_Y - 60, -150, -470, FLOOR_Y, 150) },
    { id: 'up.wall', label: 'the wall behind', short: 'wall', role: 'Most uprights stand against a wall. Pulled out (here about 40 cm), there is room for a mic behind — pressed against the wall, there is none.', prov: { kind: 'illustrative', reason: 'proposal §3: a wall 40 cm behind (drawing default)' }, variants: V, solid: box(u.wallX, -1000, -1100, u.wallX + 60, FLOOR_Y, 1100) },
  ];
}

/* ── the pianist (ILLUSTRATIVE, proposal §5) ── */
const PG = pianistAt(GB.xKey, GB.lyre.x);
const PU = pianistAt(UP.xKey, -560);
const envFor = (p: ReturnType<typeof pianistAt>, variants: VariantId[], pre: string): Envelope[] => [
  { id: `${pre}.pianist`, label: 'the pianist', shape: { kind: 'box', min: p.body.min, max: p.body.max }, prov: ill('proposal §5: the seated pianist (drawing defaults)'), variants },
  { id: `${pre}.hands`, label: 'the pianist’s arms and hands', shape: { kind: 'box', min: p.arms.min, max: p.arms.max }, prov: ill('the hands sweep the whole keyboard'), variants },
  { id: `${pre}.feet`, label: 'the pianist’s feet and the pedals', shape: { kind: 'box', min: p.feet.min, max: p.feet.max }, prov: ill('the pedals and the feet'), variants },
];
const benchPart = (p: ReturnType<typeof pianistAt>, variants: VariantId[], id: string): Part => ({
  id,
  label: 'bench',
  short: 'bench',
  role: 'The pianist’s bench. Stands and cables stay clear of it and of the pianist’s feet.',
  prov: ill('proposal §5: bench 760 × 360, seat 480 up (drawing defaults)'),
  variants,
  solid: box(p.bench.x0, p.bench.y - 60, -p.bench.hw, p.bench.x1, FLOOR_Y, p.bench.hw),
});

const GV: PianoVariant[] = ['grand', 'short'];
const parts: Part[] = [
  ...grandParts(GB, 'gp', GV, { grand: 'full', short: 'short' }, 'B'),
  ...grandParts(GS, 'bg', ['baby'], { baby: 'full' }, 'S'),
  ...uprightParts(),
  benchPart(PG, ['grand', 'short', 'baby'], 'bench.grand'),
  benchPart(PU, ['upright', 'uprightFront'], 'bench.upright'),
];

const ALLG: PianoVariant[] = ['grand', 'short', 'baby'];
const ALLU: PianoVariant[] = ['upright', 'uprightFront'];

const surfaces: ReferenceSurface[] = [
  { id: 'strings', partId: 'gp.strings', label: 'the strings', point: { x: 0, y: 0, z: 0 }, normal: { x: 0, y: -1, z: 0 }, plus: { words: 'above', key: 'ABOVE' }, minus: { words: 'below', key: 'BELOW' }, variants: ALLG },
  { id: 'curve', partId: 'gp.rim', label: 'the curved side', point: GB.curve.p, normal: GB.curve.n, plus: { words: 'out from', key: 'OUT FROM' }, minus: { words: 'inside', key: 'INSIDE' }, variants: ['grand', 'short'] },
  { id: 'curveS', partId: 'bg.rim', label: 'the curved side', point: GS.curve.p, normal: GS.curve.n, plus: { words: 'out from', key: 'OUT FROM' }, minus: { words: 'inside', key: 'INSIDE' }, variants: ['baby'] },
  { id: 'holeHigh', partId: 'gp.holes', label: 'the high sound hole', point: GB.holes[0].c, normal: { x: 0, y: -1, z: 0 }, plus: { words: 'above', key: 'ABOVE' }, minus: { words: 'below', key: 'BELOW' }, variants: ['grand', 'short'] },
  { id: 'holeHighS', partId: 'bg.holes', label: 'the high sound hole', point: GS.holes[0].c, normal: { x: 0, y: -1, z: 0 }, plus: { words: 'above', key: 'ABOVE' }, minus: { words: 'below', key: 'BELOW' }, variants: ['baby'] },
  { id: 'under', partId: 'gp.soundboard', label: 'the case bottom', point: { x: 0, y: GB.caseBottom, z: 0 }, normal: { x: 0, y: 1, z: 0 }, plus: { words: 'below', key: 'BELOW' }, minus: { words: 'above', key: 'ABOVE' }, variants: ALLG },
  { id: 'uTop', partId: 'up.top', label: 'the top', point: { x: 0, y: UP.yTop, z: 0 }, normal: { x: 0, y: -1, z: 0 }, plus: { words: 'above', key: 'ABOVE' }, minus: { words: 'below', key: 'BELOW' }, variants: ALLU },
  { id: 'uBoard', partId: 'up.back', label: 'the soundboard', point: { x: UP.soundboard.x1, y: 0, z: 0 }, normal: { x: 1, y: 0, z: 0 }, plus: { words: 'behind', key: 'BEHIND' }, minus: { words: 'in front of', key: 'IN FRONT OF' }, variants: ALLU },
  { id: 'uHammers', partId: 'up.action', label: 'the hammers', point: { x: -70, y: UP.hammerY, z: 0 }, normal: { x: -1, y: 0, z: 0 }, plus: { words: 'in front of', key: 'IN FRONT OF' }, minus: { words: 'behind', key: 'BEHIND' }, variants: ['uprightFront'] },
];

const lines: RefLine[] = [
  { id: 'hammers', label: 'the hammer line', point: { x: 0, y: 0, z: 0 }, dir: { x: 1, y: 0, z: 0 }, plane: true, words: { plus: 'behind', minus: 'in front of', keyPlus: 'BEHIND HAMMERS', keyMinus: 'BEFORE HAMMERS' }, variants: ALLG, surfaces: ['strings', 'holeHigh', 'holeHighS'] },
  { id: 'rimTop', label: 'the rim top', point: { x: 0, y: GB.rimTop, z: 0 }, dir: { x: 0, y: -1, z: 0 }, plane: true, words: { plus: 'above', minus: 'below', keyPlus: 'ABOVE RIM', keyMinus: 'BELOW RIM' }, variants: ALLG, surfaces: ['curve', 'curveS'] },
  { id: 'centre', label: 'the keyboard’s middle', point: { x: 0, y: 0, z: 0 }, dir: { x: 0, y: 0, z: 1 }, plane: true, words: { plus: 'treble side of', minus: 'bass side of', keyPlus: 'TREBLE SIDE', keyMinus: 'BASS SIDE' }, surfaces: ['under', 'uTop', 'uBoard', 'uHammers'] },
];

const envelopes: Envelope[] = [...envFor(PG, ALLG, 'g'), ...envFor(PU, ALLU, 'u')];

/** View boxes: the grand needs room for the pianist and the curve; the baby
 *  is shorter; the upright for the rear and the wall. */
const GRAND_VIEWS = { side: { u0: -1150, u1: 1900, v0: -1050, v1: FLOOR_Y + 30 }, top: { u0: -1150, u1: 1900, v0: -1000, v1: 1250 } };
const BABY_VIEWS = { side: { u0: -1150, u1: 1450, v0: -1050, v1: FLOOR_Y + 30 }, top: { u0: -1150, u1: 1450, v0: -1000, v1: 1150 } };
const UP_VIEWS = { side: { u0: -1300, u1: 640, v0: -1150, v1: FLOOR_Y + 30 }, top: { u0: -1300, u1: 640, v0: -1000, v1: 1000 } };

export const PIANO_MODEL: InstrumentModel = {
  id: 'piano',
  name: 'grand piano',
  parts,
  regions: [
    { id: 'r.hammers', partId: 'gp.hammers', label: 'hammers striking the strings', anchor: { x: 0, y: 0, z: 0 }, prov: dflt, variants: ['grand', 'short'], note: 'The attack: the hammers strike the strings here, with their felt, the keys and the action adding their own noise.' },
    { id: 'r.board', partId: 'gp.soundboard', label: 'soundboard', anchor: { x: 600, y: 90, z: -100 }, prov: dflt, variants: ['grand', 'short'], note: 'The body of the sound: the soundboard moves the air, upward toward the lid and down under the piano.' },
    { id: 'r.hammersS', partId: 'bg.hammers', label: 'hammers striking the strings', anchor: { x: 0, y: 0, z: 0 }, prov: dflt, variants: ['baby'], note: 'The attack starts where the hammers strike the strings.' },
    { id: 'r.boardS', partId: 'bg.soundboard', label: 'soundboard', anchor: { x: 400, y: 90, z: -100 }, prov: dflt, variants: ['baby'], note: 'The soundboard moves the air, up toward the lid and down under the piano.' },
    { id: 'r.uHammers', partId: 'up.action', label: 'hammers striking the strings', anchor: { x: -10, y: UP.hammerY, z: 0 }, prov: dflt, variants: ALLU, note: 'The attack: the hammers strike the strings from the pianist’s side.' },
    { id: 'r.uBoard', partId: 'up.back', label: 'soundboard', anchor: { x: 34, y: 80, z: 0 }, prov: dflt, variants: ALLU, note: 'The upright’s soundboard faces the back: much of its sound leaves toward the wall behind, and some up through the open top.' },
  ],
  surfaces,
  lines,
  envelopes,
  variants: [
    { id: 'grand', label: 'GRAND · FULL STICK', blurb: 'A 2.1 m grand with its lid propped on the full stick — the usual set-up for a solo piano or a quiet room.', phrase: 'its lid on the full stick' },
    { id: 'short', label: 'GRAND · SHORT STICK', blurb: 'The same grand with the lid on the short stick: less sound thrown out, more separation on a loud stage — and little room under it.', phrase: 'its lid on the short stick' },
    { id: 'baby', label: 'BABY GRAND', blurb: 'A 1.55 m baby grand, lid on the full stick: the same layout, less room inside, a different scale — listen, don’t assume.', phrase: 'its lid on the full stick' },
    { id: 'upright', label: 'UPRIGHT · TOP OPEN', blurb: 'A 1.32 m upright with its top lid open: strings standing upright, the soundboard at the back, pulled out from the wall.', phrase: 'its top open' },
    { id: 'uprightFront', label: 'UPRIGHT · FRONT PANEL OFF', blurb: 'The same upright with its upper front panel taken off by the owner or a technician: the hammers face you.', phrase: 'its front panel off' },
  ],
  defaultVariant: 'grand',
  views: GRAND_VIEWS,
  viewsByVariant: { baby: BABY_VIEWS, upright: UP_VIEWS, uprightFront: UP_VIEWS },
  aimAzLimit: 180,
  yFloor: FLOOR,
  // No drum interior: nothing counts as "inside" (every zone is 'either').
  interior: { x0: 0, x1: 0, rIn: 0, c: { x: 0, y: 0, z: 0 } },
  ports: { grand: null, short: null, baby: null, upright: null, uprightFront: null },
  // The stand's boom reaches in from the open (curved / treble) side; over an
  // upright it first comes up out of the top (ILLUSTRATIVE).
  boomRoute: {
    grand: { legs: [{ dir: { x: 0, y: 0, z: 1 }, past: GB.hw + 200, back: GB.hw + 40 }] },
    short: { legs: [{ dir: { x: 0, y: 0, z: 1 }, past: GB.hw + 200, back: GB.hw + 40 }] },
    baby: { legs: [{ dir: { x: 0, y: 0, z: 1 }, past: GS.hw + 200, back: GS.hw + 40 }] },
    upright: { legs: [{ dir: { x: 0, y: -1, z: 0 }, past: 760 }, { dir: { x: 0, y: 0, z: 1 }, past: UP.hw + 200, back: UP.hw + 40 }] },
    uprightFront: { legs: [{ dir: { x: 0, y: -1, z: 0 }, past: 760 }, { dir: { x: 0, y: 0, z: 1 }, past: UP.hw + 200, back: UP.hw + 40 }] },
  },
};

/** The key-front x and the pedals' x per set-up (the art and the plan). */
export const PIANIST_AT = { grand: { xKey: GB.xKey, pedalX: GB.lyre.x }, upright: { xKey: UP.xKey, pedalX: -560 } };
export { GRAND_DIMS };
