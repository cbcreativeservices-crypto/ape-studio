/**
 * M07a CONCERT BASS DRUM — the technical truth (charter §2 layer 1). Keys
 * point into docs/labs/miking/concert_bass_drum/SOURCES.md.
 *
 * FRAME (the engine's: the main reference head at the origin, the drum's
 * axis along x): origin = the PLAYING-head centre; the drum runs from x = −D
 * (the far head) to 0; +x toward the player (who stands beyond the playing
 * head — every mic here faces −x, the engine's aim convention); +y DOWN;
 * +z toward the conductor (the heads face sideways into the ensemble, so
 * the conductor is off to the side). The drum hangs in a tilting stand, its
 * heads vertical (proposal: tilt drawing default 0°).
 *
 * Owner ruling 2026-10-04: `src`, `quote`, every `prov` and the unknowns are
 * the internal record; the learner sees starting points only.
 */
import type { Dim, DocumentedZone, Provenance } from '../../engine/model/types.ts';
import { CONCERT_BD_36x16 as SPEC } from '../shared/drums/concertSpec.ts';

const src = (s: string, quote: string): Provenance => ({ kind: 'sourced', src: s, quote });
const ill = (reason: string): Provenance => ({ kind: 'illustrative', reason });
const unk = (needed: string): Provenance => ({ kind: 'unknown', needed });
const placeholder = (mm: number, needed: string): Dim => ({ mm, prov: unk(needed), placeholder: true });

export { SPEC };
export const R = SPEC.d.mm / 2;
export const D = SPEC.depth.mm;

export const CBD_DIMS = {
  /** Centre height above the floor: UNKNOWN (proposal drawing default 800). */
  centreH: placeholder(800, 'the drum’s centre height on its stand'),
  /** "about 45 cm (1'6") away" from the skin, "looking diagonally downwards". */
  deccaDist: { mm: 450, prov: src('DECCA', 'looking diagonally downwards towards the skin from a distance of about 45 cm (1\'6") away') } as Dim,
  /** The diagonal: 45° above the head-centre horizontal — a drawing default. */
  deccaElev: placeholder(45, 'the spot’s elevation above the head centre (the source says "diagonally downwards")'),
  /** The stand (casters, pivots, uprights): words sourced, sizes drawing defaults. */
  standHalfZ: placeholder(R + 70, 'stand width (uprights either side of the shell)'),
  standHalfX: placeholder(300, 'stand footprint along the drum'),
  headClear: { mm: 10, prov: ill('head excursion: no source gives a number') } as Dim,
} as const;

export const FLOOR_Y = CBD_DIMS.centreH.mm;
/** The middle of the shell (the pivots' x). */
export const MID_X = -D / 2;

const E = (CBD_DIMS.deccaElev.mm * Math.PI) / 180;
const DECCA_START = { x: CBD_DIMS.deccaDist.mm * Math.cos(E), y: -CBD_DIMS.deccaDist.mm * Math.sin(E), z: 0 };
const BOTH = ['orchSdc', 'smallDynCard'];

/* ── SUGGESTED STARTING POINTS (lesson L13-L24; corrections B-01..B-03). ── */
export const CBD_ZONES: DocumentedZone[] = [
  {
    id: 'cbd.spot',
    label: 'Above the playing head, looking down at it',
    band: 'Start about 45 cm (18 in) from the playing head, above its centre, looking diagonally down at the head — outside the mallet’s and the damping hand’s path.',
    kind: 'sourced',
    src: 'DECCA',
    quote: 'The microphone is best placed just above the instrument, looking diagonally downwards towards the skin from a distance of about 45 cm (1\'6") away.',
    refSurface: 'playing',
    side: 'outside',
    distance: { min: 230, max: 420 },
    bandProv: ill('"about 45 cm": a mic 38–52 cm from the head centre at the diagonal is 23–42 cm out from the head plane (the lab’s band)'),
    radial: { line: 'axis', min: 230, max: 420, prov: ill('"just above": 23–42 cm above (or beside) the drum’s axis, the lab’s band for the diagonal') },
    box: { min: { x: 0, y: -1200, z: -220 }, max: { x: 900, y: -120, z: 220 }, prov: ill('above the head centre, near the drum’s mid-plane (drawing default)') },
    aim: { minOffAxis: 20, maxOffAxis: 70, prov: ill('"diagonally downwards": the lab counts 20–70° off the head’s axis') },
    aimAt: { surface: 'playing', r: R * 0.8, prov: ill('looking at the skin: the axis meets the head') },
    requires: { micTypeIds: BOTH },
    drawn: { side: { u0: 230, u1: 420, v0: -420, v1: -230 }, top: { u0: 230, u1: 420, v0: -220, v1: 220 } },
    start: { p: DECCA_START, az: 0, el: -45 },
    tendency: 'The mallet’s transient on top of the low end the main pickup already carries. Start it low in the mix and check that the drum stays in its place in the orchestra.',
    checks: ['The full mallet arc and both damping hands, with the player', 'The loudest hit against the input — a pad may be needed', 'The stand secured, its brakes on'],
  },
  {
    id: 'cbd.close',
    label: 'Closer and steeper, for a loud stage',
    band: 'Start closer than the 45 cm spot — as near as the mallet and the damping hand safely allow — still above the head and looking down at it.',
    kind: 'trial',
    src: 'LESSON-CBD',
    quote: 'Begin with one stable playing-side directional mic, as near as safely useful, with the actual PA and monitors active.',
    refSurface: 'playing',
    side: 'outside',
    distance: { min: 120, max: 230 },
    bandProv: ill('"as near as safely useful": 12–23 cm out from the head is the lab’s drawing'),
    radial: { line: 'axis', min: 230, max: 440, prov: ill('above the head centre, the lab’s band') },
    box: { min: { x: 0, y: -1200, z: -220 }, max: { x: 900, y: -120, z: 220 }, prov: ill('above the head centre, near the drum’s mid-plane (drawing default)') },
    aim: { minOffAxis: 25, maxOffAxis: 75, prov: ill('looking down at the head: the lab’s tolerance') },
    aimAt: { surface: 'playing', r: R * 0.8, prov: ill('looking at the skin: the axis meets the head') },
    requires: { micTypeIds: BOTH },
    drawn: { side: { u0: 120, u1: 230, v0: -440, v1: -230 }, top: { u0: 120, u1: 230, v0: -220, v1: 220 } },
    start: { p: { x: 180, y: -330, z: 0 }, az: 0, el: -61 },
    tendency: 'More of the drum against the stage and the PA — and more of the exact spot on the head and the mallet. Usable gain before feedback is the reason to come closer.',
    checks: ['The mallet, the rolls and the damping hand — closer means tighter', 'Feedback with the real PA and monitors, with the operator', 'Peak headroom for the loudest hit'],
  },
];
