/**
 * I01d SPLASH CYMBAL — where things are (charter §2 layer 2): the shared
 * 5-piece kit plus the splash in each setup (cymbalFx.ts): the 10 in on its
 * Z-shaped arm clamped to the tom holder's post, or the 8 in upside down on
 * the 18 in crash. Its top and under faces, edge lines and stick's side are
 * per setup; the arm's rod is a solid (and the clip's hold).
 */
import type { InstrumentModel, Part, Shape3 } from '../../engine/model/types.ts';
import { CYMBAL_SWING, fxSolid, splashArmSolids, SPLASH_10, SPLASH_8, ARM_ROD } from '../shared/cymbals/cymbalFx.ts';
import { cymbalModel, edgeLine, ill, stickSector, topSurface, underSurface, at } from '../shared/cymbals/cymbalLesson.ts';
import { KIT_CYMBALS, KIT_DRUMS } from '../shared/kitPlanModel.ts';
import { ARM, ARM_CLIP, PIGGY, STRIKE_ARM, STRIKE_PIG, TH_ARM } from './model.ts';

const armShapes = splashArmSolids();
const armProv = { kind: 'sourced', src: 'MEINL-CY2', quote: 'Z-shaped 3/8” rod with extra-long knurled end; For splashes or small crashes' } as const;
const plate = (s: { shape: Shape3; clearance: number }) => s.shape;

const OWN: Part[] = [
  { id: 'splash.plate', label: '10 in splash', short: 'splash', role: 'A small, thin cymbal for short accents — an “effect” cymbal. Struck near its edge, it speaks fast and dies away soon. Small enough to swing a lot.', solid: plate(fxSolid(ARM)), clearance: CYMBAL_SWING, moving: true, prov: SPLASH_10.d.prov, variants: ['arm'] },
  { id: 'splash.arm', label: 'arm and clamp', short: 'arm', role: 'A Z-shaped rod on a clamp, here on the tom holder’s post: it puts the splash where the player wants it, between the larger cymbals. A small clip mic can hold on to it.', solid: armShapes[0], prov: armProv, variants: ['arm'] },
  { id: 'splash.arm1', label: 'arm and clamp', short: 'arm', role: 'The arm’s level run.', solid: armShapes[1], prov: armProv, variants: ['arm'], listIn: [] },
  { id: 'splash.arm2', label: 'arm and clamp', short: 'arm', role: 'The arm rising to the splash.', solid: armShapes[2], prov: armProv, variants: ['arm'], listIn: [] },
  { id: 'splash.clamp', label: 'arm and clamp', short: 'clamp', role: 'The multi-clamp on the post.', solid: armShapes[3], prov: armProv, variants: ['arm'], listIn: [] },
  { id: 'piggy.plate', label: '8 in splash, upside down on the crash', short: 'splash on top', role: 'An 8 in splash turned over and stacked on top of the 18 in crash, on the same rod with a felt between. The two swing together — the crash carries the splash.', solid: plate(fxSolid(PIGGY)), clearance: CYMBAL_SWING, moving: true, prov: { kind: 'sourced', src: 'ZIL-BARATA', quote: 'Kerope 18" with A custom splash 8" inverted on top' }, variants: ['piggy'] },
  { id: 'splash.mount', label: 'felts, sleeve and wing nut', short: 'mount', role: 'The splash sits loose between felts so it can move; on top of a crash, a felt keeps the two apart.', prov: SPLASH_10.d.prov },
];

export const SPLASH_MODEL: InstrumentModel = cymbalModel({
  id: 'splash108',
  name: 'splash cymbal',
  variants: [
    { id: 'arm', label: 'ON AN ARM', blurb: 'A 10 in splash on a Z-shaped arm over the 10 in tom, below and in front of the 16 in crash.', phrase: 'the splash on its arm' },
    { id: 'piggy', label: 'ON THE CRASH', blurb: 'An 8 in splash upside down on top of the 18 in crash, sharing its rod and stand.', phrase: 'the splash on top of the crash' },
  ],
  defaultVariant: 'arm',
  views: {
    side: { u0: -440, u1: 380, v0: -1170, v1: -330 },
    top: { u0: -440, u1: 380, v0: -640, v1: 220 },
  },
  viewsByVariant: {
    piggy: { side: { u0: -80, u1: 640, v0: -1420, v1: -640 }, top: { u0: -80, u1: 640, v0: 0, v1: 760 } },
  },
  roles: {
    'kit.tom1': 'Right under the splash on its arm: the tom mic hears the splash, and a splash mic aimed down hears the tom.',
    'cym.crash1': 'Above and beside the splash on its arm: two cymbals that swing, close together.',
    'cym.crash2': 'In the other setup, the 18 in crash carries the 8 in splash on top: they move as one.',
    'kit.throne': 'The player sits here: the splash is struck from this side.',
  },
  listed: ['kit.tom1', 'cym.crash1', 'cym.crash2', 'kit.throne'],
  own: OWN,
  surfaces: [
    topSurface('spTop', 'splash.plate', 'the splash', ARM, ['arm']),
    underSurface('spUnder', 'splash.plate', 'the splash’s underside', ARM, 0, ['arm']),
    topSurface('pgTop', 'piggy.plate', 'the splash on top', PIGGY, ['piggy']),
  ],
  lines: [edgeLine('spEdge', 'the splash’s edge', ARM, ['spTop', 'spUnder'], ['arm']), edgeLine('pgEdge', 'the splash’s edge', PIGGY, ['pgTop'], ['piggy'])],
  envelopes: [
    { id: 'env.spStick', label: 'the stick over the splash', shape: stickSector(ARM, 80, 30), prov: ill('the player’s side of the splash, a stick’s length up — the lab’s drawing'), variants: ['arm'] },
    { id: 'env.pgStick', label: 'the stick over the cymbals', shape: stickSector({ ...PIGGY, spec: { ...PIGGY.spec, d: { ...PIGGY.spec.d, mm: 457.2 } } }, 80, 30), prov: ill('the player’s side of the crash and the splash on it, a stick’s length up'), variants: ['piggy'] },
  ],
  regions: [
    { id: 'r.edge', partId: 'splash.plate', label: 'the stick near the edge', anchor: STRIKE_ARM, prov: ill('near the edge, toward the player'), variants: ['arm'], note: 'Where the stick strikes the splash: its quick attack starts here.' },
    { id: 'r.bell', partId: 'splash.plate', label: 'the bell', anchor: at(ARM, 0, TH_ARM, ARM.spec.rise.mm), prov: ill('the bell'), variants: ['arm'], note: 'The small raised centre.' },
    { id: 'r.tom', partId: 'kit.tom1', label: 'the 10 in tom below', anchor: KIT_DRUMS.tom1.c, prov: ill('the shared 5-piece kit'), variants: ['arm'], note: 'The tom under the splash: the drum a splash mic aimed down hears most.' },
    { id: 'r.pig', partId: 'piggy.plate', label: 'the stick on the splash', anchor: STRIKE_PIG, prov: ill('near its edge, toward the player'), variants: ['piggy'], note: 'The splash on top of the crash: struck near its edge.' },
    { id: 'r.host', partId: 'cym.crash2', label: 'the crash under it', anchor: KIT_CYMBALS.crash2.c, prov: ill('the 18 in crash under the splash'), variants: ['piggy'], note: 'The crash the splash sits on: it rings and swings with it.' },
  ],
  rims: [{ id: 'rim.arm', label: 'the splash’s arm', c: ARM_CLIP, axis: { x: 0, y: 1, z: 0 }, r: ARM_ROD.d.mm / 2 + 1, variants: ['arm'] }],
  boomOut: { x: 1, y: 0, z: 0 },
  boomLength: 520,
});
