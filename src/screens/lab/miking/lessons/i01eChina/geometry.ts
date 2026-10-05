/**
 * I01e CHINA CYMBAL — where things are (charter §2 layer 2): the shared
 * 5-piece kit with the 18 in China on the 18 in crash's stand (the crash
 * itself removed from this lesson's kit), upright or inverted. Its top and
 * under faces (the under face at the plate's lowest point in each setup),
 * edge lines and the stick's side are per setup.
 */
import type { InstrumentModel, Part } from '../../engine/model/types.ts';
import { CHINA_18, CYMBAL_SWING, fxSolid } from '../shared/cymbals/cymbalFx.ts';
import { at, cymbalModel, edgeLine, ill, stickSector, topSurface, underSurface } from '../shared/cymbals/cymbalLesson.ts';
import { KIT_DRUMS } from '../shared/kitPlanModel.ts';
import { DROP, INV, STRIKE_INV, STRIKE_UP, TH, UP } from './model.ts';

const shape = { kind: 'sourced', src: 'SAB-101', quote: 'China or Chinese are cymbals that have an upturned edge.' } as const;
const profile = { kind: 'unknown', needed: 'the China profile (cup, shoulder, valley, lip) — drawing defaults' } as const;

const OWN: Part[] = [
  { id: 'china.plate', label: '18 in China', short: 'China', role: 'A cymbal with a squarer cup and an upturned edge: trashy, cutting and quick to speak. Upright it can even serve as a ride; turned over, it is crashed for accents.', solid: fxSolid(UP).shape, clearance: CYMBAL_SWING, moving: true, prov: CHINA_18.d.prov, variants: ['upright'] },
  { id: 'china.plateI', label: '18 in China, turned over', short: 'China', role: 'The same China turned over, cup down: the valley becomes a raised ring and the lip turns down. Players crash it this way.', solid: fxSolid(INV).shape, clearance: CYMBAL_SWING, moving: true, prov: CHINA_18.d.prov, variants: ['inverted'] },
  { id: 'china.cup', label: 'cup', short: 'cup', role: 'The China’s bell: squarer and flatter-topped than a crash’s. Struck, it gives a hard, focused accent.', prov: profile },
  { id: 'china.shoulder', label: 'shoulder and valley', short: 'shoulder', role: 'The plate falls from the cup to the valley — the lowest ring of an upright China. A jazz player rides on the side of the shoulder, about an inch above the valley.', prov: { kind: 'sourced', src: 'SAB-JH', quote: 'Where the shoulder kind of comes down into the valley, you want to go up about an inch above that to play the side of the shoulder.' } },
  { id: 'china.lip', label: 'upturned lip', short: 'lip', role: 'Past the valley the edge turns back up to the rim: the China’s mark, and much of its trashy sound.', prov: shape },
  { id: 'china.mount', label: 'felts, sleeve and wing nut', short: 'mount', role: 'The China sits loose between its felts on the stand that held the 18 in crash, upright or turned over.', prov: profile },
];

export const CHINA_MODEL: InstrumentModel = cymbalModel({
  id: 'china18',
  name: 'China cymbal',
  variants: [
    { id: 'upright', label: 'UPRIGHT', blurb: 'Cup up, the lip turning up at the edge — the way some jazz players ride a large China.', phrase: 'the China upright' },
    { id: 'inverted', label: 'TURNED OVER', blurb: 'Cup down: the valley becomes a raised ring and the lip turns down — the way players mount it to crash it.', phrase: 'the China turned over' },
  ],
  defaultVariant: 'upright',
  views: {
    side: { u0: -140, u1: 760, v0: -1400, v1: -540 },
    top: { u0: -140, u1: 760, v0: -40, v1: 840 },
  },
  roles: {
    'kit.tom2': 'Under the China, on the right: its mic hears the China, and a China mic aimed down hears the tom.',
    'cym.ride': 'Beside the China on the right: another loud cymbal a China mic hears.',
    'kit.throne': 'The player sits here; the China is struck from this side.',
  },
  listed: ['kit.tom2', 'cym.ride', 'kit.throne'],
  omit: ['cym.crash2'],
  own: OWN,
  surfaces: [
    topSurface('chTopU', 'china.plate', 'the China', UP, ['upright']),
    underSurface('chUnderU', 'china.plate', 'the China’s lowest point', UP, DROP.upright, ['upright']),
    topSurface('chTopI', 'china.plateI', 'the China', INV, ['inverted']),
    underSurface('chUnderI', 'china.plateI', 'the China’s lowest point', INV, DROP.inverted, ['inverted']),
  ],
  lines: [edgeLine('chEdgeU', 'the China’s edge', UP, ['chTopU', 'chUnderU'], ['upright']), edgeLine('chEdgeI', 'the China’s edge', INV, ['chTopI', 'chUnderI'], ['inverted'])],
  envelopes: [
    { id: 'env.chStick', label: 'the stick over the China', shape: stickSector(UP, 80, 40), prov: ill('the player’s side, a stick’s length up — the lab’s drawing (china_cymbal/GEOMETRY_PROPOSAL.md ko.stick)'), variants: ['upright'] },
    { id: 'env.chIStick', label: 'the stick over the China', shape: stickSector(INV, 80, 40), prov: ill('as above, turned over'), variants: ['inverted'] },
  ],
  regions: [
    { id: 'r.shoulder', partId: 'china.shoulder', label: 'the stick on the shoulder', anchor: STRIKE_UP, prov: ill('about an inch above the valley, toward the player'), variants: ['upright'], note: 'The side of the shoulder, about an inch above the valley: where a jazz player rides an upright China.' },
    { id: 'r.edgeI', partId: 'china.plateI', label: 'the stick near the edge', anchor: STRIKE_INV, prov: ill('near the edge, toward the player'), variants: ['inverted'], note: 'Turned over and crashed near its edge: the China’s trashy accent starts here.' },
    { id: 'r.cup', partId: 'china.cup', label: 'the cup', anchor: at(UP, 0, TH, 30), prov: ill('the cup'), variants: ['upright'], note: 'The squarer cup at the centre.' },
    { id: 'r.tom', partId: 'kit.tom2', label: 'the 12 in tom below', anchor: KIT_DRUMS.tom2.c, prov: ill('the shared 5-piece kit'), note: 'The tom under the China: the drum a China mic aimed down hears most.' },
  ],
  boomOut: { x: 1, y: 0, z: 0 },
  boomLength: 520,
});
