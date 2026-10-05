/**
 * C10 HARP — the starting points (charter §2 layer 1). Source keys point
 * into docs/labs/miking/harp/SOURCES.md; geometry from harpSpec.ts (frame H:
 * origin on the floor at the front of the base, +x toward the audience, +y
 * down, +z the player's right; the strings in the plane z = 0).
 *
 * Two set-ups: a concert pedal harp (1.9 m) and a lever harp (drawn at 0.75
 * of it). The lever harp keeps the same KINDS of starting points: the
 * lesson says not to copy a concert harp's measurements without listening,
 * so its numbers are the same starting distances, to be moved by ear.
 */
import type { DocumentedZone, MicPose, Provenance, Vec3 } from '../../engine/model/types.ts';
import { harpGeom, harpistAt, type HarpGeom } from './harpSpec.ts';

export const HP = harpGeom(false);
export const LV = harpGeom(true);
export const HARPIST = harpistAt();

const ill = (reason: string): Provenance => ({ kind: 'illustrative', reason });
const DEG = Math.PI / 180;
const IN = 25.4;

export const v3 = (p: readonly [number, number], z = 0): Vec3 => ({ x: p[0], y: p[1], z });
export function aimedAlong(p: Vec3, d: Vec3): MicPose {
  const l = Math.hypot(d.x, d.y, d.z);
  const u = { x: d.x / l, y: d.y / l, z: d.z / l };
  const el = -Math.asin(u.y) / DEG;
  const az = Math.atan2(u.z, -u.x) / DEG;
  return { p, az, el };
}
export const aimedAt = (p: Vec3, t: Vec3) => aimedAlong(p, { x: t.x - p.x, y: t.y - p.y, z: t.z - p.z });
const add = (p: Vec3, n: readonly [number, number], k: number, z = 0): Vec3 => ({ x: p.x + n[0] * k, y: p.y + n[1] * k, z: p.z + z });

const SDC = ['sdcCard'];

/** The zones for one harp (pre = hp / lv; S = the surface-id suffix). */
function zonesFor(g: HarpGeom, pre: 'hp' | 'lv', S: '' | 'L'): DocumentedZone[] {
  const V = [pre === 'hp' ? 'pedal' : 'lever'];
  const M = v3(g.boardAt(0.5));
  const front = add(M, g.n, 600, 320);
  const crownTop: Vec3 = { x: g.crown.c[0], y: g.crown.top, z: 0 };
  const up = v3(g.boardAt(0.7));
  const hole = v3(g.holes[1].c);
  const out: [number, number] = [-g.n[0], -g.n[1]];
  const k = g.scale;
  return [
    {
      id: `${pre}.front`,
      label: 'In front, about 60 cm from the soundboard',
      band: 'Start one mic about 60 cm (2 ft) out from the soundboard, from the audience side and a little to one side of the strings, aimed back through the strings at part of the board, toward the player.',
      kind: 'sourced',
      src: 'S-REC',
      quote: 'Aiming toward player at part of soundboard, about 2 feet away',
      refSurface: `board${S}`,
      side: 'either',
      distance: { min: 2 * 12 * IN - 150, max: 2 * 12 * IN + 150 },
      bandProv: ill('a ±15 cm band round the guide’s “about 2 feet”'),
      requires: { variants: V, micTypeIds: SDC },
      aim: { maxOffAxis: 45, prov: ill('“aiming … at part of soundboard”: within 45° of facing the board') },
      drawn: {
        side: { u0: M.x + g.n[0] * 450, u1: M.x + g.n[0] * 750, v0: M.y + g.n[1] * 750 - 260 * k, v1: M.y + g.n[1] * 450 + 260 * k },
        top: { u0: M.x + g.n[0] * 450, u1: M.x + g.n[0] * 750, v0: -700, v1: 700 },
      },
      start: aimedAt(front, M),
      tendency: 'A defined, practical single view — one register or the board’s resonance can stand out. Move it a little in height and sideways while the harpist plays the whole range.',
      checks: ['Clear of the harpist’s hands, the strings and their sight line', 'Bass, treble and glissandi all present?', 'The stand’s feet clear of the pedals'],
    },
    {
      id: `${pre}.pillar`,
      label: 'Near the top of the pillar, looking down at the soundboard',
      band: 'Start a directional mic around the top of the pillar, a little to one side, pointing down toward the soundboard — a spot mic for an ensemble.',
      kind: 'sourced',
      src: 'DPA-HARP',
      quote: 'A workable starting point is the area around the top of the harp’s pillar, with the microphone pointing down towards the sound board',
      refSurface: `crown${S}`,
      side: 'either',
      distance: { min: -150, max: 400 },
      bandProv: ill('“the area around the top of the pillar”: from 15 cm below the crown’s top to 40 cm above it, the lab’s drawing'),
      requires: { variants: V, micTypeIds: SDC },
      aimAt: { surface: `board${S}`, r: 560 * k, prov: ill('“pointing down towards the sound board”: the axis meets the board') },
      box: { min: { x: g.crown.c[0] - 300 * k, y: -3000, z: -650 }, max: { x: g.crown.c[0] + 500 * k, y: 0, z: 650 }, prov: ill('around the pillar’s top') },
      drawn: {
        side: { u0: g.crown.c[0] - 300 * k, u1: g.crown.c[0] + 500 * k, v0: g.crown.top - 400, v1: g.crown.top + 150 },
        top: { u0: g.crown.c[0] - 300 * k, u1: g.crown.c[0] + 500 * k, v0: -650, v1: 650 },
      },
      start: aimedAt({ x: crownTop.x + 160 * k, y: crownTop.y - 90, z: 280 }, v3(g.boardAt(0.55))),
      tendency: 'Detail without aiming at the boomy middle of the board — more of the upper strings, and it can pull the harp forward in the picture. Bring it up only as far as the music needs.',
      checks: ['A secure stand: nothing swings over the harp or the harpist’s head', 'Clear of the neck and the crown', 'How far forward it pulls the harp in the mix'],
    },
    {
      id: `${pre}.behind`,
      label: 'Slightly behind, on the player’s right, a little above their head',
      band: 'Start slightly behind the harp on the side away from the harpist’s head, a little higher than their head, pointing down toward the soundboard.',
      kind: 'sourced',
      src: 'DPA-HARP',
      quote: 'slightly behind the harp, pointing downwards from the right – essentially opposite the player’s head, just a little higher',
      refSurface: 'floor',
      side: 'either',
      distance: { min: 1300, max: 1800 },
      bandProv: ill('“just a little higher” than the seated harpist’s head (1.3 m, a drawing default): 1.3–1.8 m'),
      radial: { line: 'centre', min: 250, max: 800, prov: ill('“opposite the player’s head”: 25–80 cm to the player’s right of the strings') },
      requires: { variants: V, micTypeIds: SDC },
      aimAt: { surface: `board${S}`, r: 560 * k, prov: ill('“pointing downwards”: the axis meets the board') },
      box: { min: { x: -1150, y: -3000, z: -2000 }, max: { x: -420 * k, y: 0, z: 2000 }, prov: ill('behind the harp (the player’s side)') },
      drawn: {
        side: { u0: -1150, u1: -420 * k, v0: -1800, v1: -1300 },
        top: { u0: -1150, u1: -420 * k, v0: 250, v1: 800 },
      },
      start: aimedAt({ x: -760, y: -1480, z: 470 }, v3(g.boardAt(0.5))),
      tendency: 'A gentler spot than the pillar — when the pillar view sounds too forward or bright.',
      checks: ['A secure stand and boom: never over the harpist’s head', 'Clear of the harpist’s sight line and arms'],
    },
    {
      id: `${pre}.pair`,
      label: 'About 30 cm from the soundboard (an upper and a lower spot)',
      band: 'Start each of two cardioids about 30 cm (12 in) from the soundboard, one toward its upper half and one lower, from beside the strings — and bring the upper one up a little more.',
      kind: 'sourced',
      src: 'DPA-HARP',
      quote: 'One from right behind the harp, facing the sound board from about 30 cm distance, the other looking at the sound board horizontally, from about the same distance… mixed with the top microphone twice as loud as the lower one',
      refSurface: `board${S}`,
      side: 'either',
      distance: { min: 250, max: 350 },
      bandProv: ill('a ±5 cm band round “about 30 cm”'),
      requires: { variants: V, micTypeIds: SDC },
      aim: { maxOffAxis: 55, prov: ill('“facing the sound board”: within 55° of square to it') },
      drawn: {
        side: { u0: up.x + g.n[0] * 250 - 340 * k, u1: up.x + g.n[0] * 350 + 340 * k, v0: up.y + g.n[1] * 350 - 520 * k, v1: up.y + g.n[1] * 250 + 520 * k },
        top: { u0: up.x + g.n[0] * 250 - 340 * k, u1: up.x + g.n[0] * 350 + 340 * k, v0: 200, v1: 700 },
      },
      start: aimedAt(add(up, g.n, 300, 300), up),
      tendency: 'Two separate views of the board for the upper and lower registers when one mic misses part of the harp. They need not be panned apart — much of the harp’s range runs up and down, not side to side.',
      checks: ['Each mic alone, then both in mono', 'Clear of the strings and the harpist’s hands'],
    },
    {
      id: `${pre}.hole`,
      label: 'A miniature at the second sound hole from the bottom',
      band: 'For live sound, with the owner’s agreement: a miniature omni on an approved holder at the opening of the second sound hole from the bottom — nothing forced in, nothing taped to the finish.',
      kind: 'sourced',
      src: 'DPA-HARP',
      quote: 'concealed within one of the harp’s sound holes… try the second sound hole from the bottom',
      refSurface: `hole${S}`,
      side: 'either',
      distance: { min: 0, max: 60 },
      bandProv: ill('at the opening: up to 6 cm out from it, the lab’s drawing (the guide puts it inside)'),
      requires: { variants: V, micTypeIds: ['miniOmni'], mount: 'clip' },
      aimAt: { surface: `hole${S}`, r: 45 * k, prov: ill('looking into the hole') },
      drawn: {
        side: { cu: hole.x, cv: hole.y, r0: 0, r1: 90 * k, a0: 0, a1: 360 },
        top: { u0: hole.x - 90 * k, u1: hole.x + 60 * k, v0: -60, v1: 60 },
      },
      start: aimedAlong(add(hole, out, 40, 18), { x: g.n[0], y: g.n[1], z: 0 }),
      tendency: 'A close, concealed signal on a stage — with its own colouring of the sound near the hole, and more feedback margin than an open stand mic, not unlimited.',
      checks: ['The owner’s agreement, and an approved holder', 'Nothing blocking the hole; no foam pushed in', 'Cable relief so a pull cannot reach the harp'],
    },
  ];
}

export const HARP_ZONES: DocumentedZone[] = [...zonesFor(HP, 'hp', ''), ...zonesFor(LV, 'lv', 'L')];
