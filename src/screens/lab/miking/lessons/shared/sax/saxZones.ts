/**
 * THE SAXOPHONE FAMILY'S SUGGESTED STARTING POINTS (charter §2 layer 1),
 * as geometry: each kind of zone the research gives (alto_sax/SOURCES.md
 * §2, alto_sax/GEOMETRY_PROPOSAL.md §4), built on a family (saxFamily.ts).
 * The LESSON writes the words (label, band, tendency, checks) — the voice
 * is the owner's starting-points voice; the research words stay here in the
 * internal `src` / `quote` / `prov` fields.
 *
 *   above     a few inches above the bell, aimed at the sound holes        S-REC / S-LIVE / S-SAX
 *   into      a few inches from the bell, aimed into it (bright, isolated)  S-REC / S-LIVE / S-BWS
 *   holes     a few inches from the sound holes (warm, key noise)          S-BWS
 *   clip      a miniature on the bell rim, angled between bell and keys    DPA-MOUNT / DPA-SAX
 *   front     18–24 in in front, aimed between the bell and the LH keys    MDAT (ADD)
 *   third     12–24 in from the bell, aimed a third of the way up          SW-SAX (2024 archive)
 *   triangle  the equilateral triangle: the mic as far from the top and
 *             the bottom of the horn as the horn is long                  S-SAX (DERIVED geometry)
 *   shoulder  over the player's right shoulder                             S-SAX
 *   sopFar    soprano: the clip as far from the bell as it goes, aimed
 *             back up at the upper keys (round, warm)                      DPA-MOUNT
 *   sopFront  soprano: the clip in front of the bell (bite)                DPA-MOUNT
 *
 * "A few inches" has no number: drawn 5–10 cm (a drawing default). Every
 * start is found once at load: the first pose (in order of preference)
 * inside the zone and clear of every solid, standing AND seated.
 */
import type { DocumentedZone, MicPose, Provenance, Vec3 } from '../../../engine/model/types.ts';
import { add, dist, dot, norm, scale, sub } from '../../../engine/geometry/vec.ts';
import { MIC_TYPES } from '../../../data/micTypes.ts';
import { aimAt, around, firstClear, zoneDisc, zoneSection } from '../bowed/bowedModel.ts';
import { holesOf } from './saxSpec.ts';
import { onTube } from './saxPosture.ts';
import { FORWARD, earR, midpoint, upAcross } from './saxModel.ts';
import { SAX_VARIANT_IDS, type SaxFamily } from './saxFamily.ts';

export type ZoneKindId = 'above' | 'into' | 'holes' | 'clip' | 'front' | 'third' | 'triangle' | 'shoulder' | 'sopFar' | 'sopFront';
/** The learner-facing words a lesson supplies for a zone. */
export type ZoneWords = { label: string; band: string; tendency: string; checks: string[] };

const ill = (reason: string): Provenance => ({ kind: 'illustrative', reason });
const FEW = ill('"a few inches" has no number: drawn 5–10 cm (a drawing default)');
const DYNAMICS = ['saxDynCard', 'saxDynSuper'];

/** Square to `axis`, on the side of `toward` (unit). */
function across(axis: Vec3, toward: Vec3): Vec3 {
  return norm(sub(toward, scale(axis, dot(toward, axis))));
}

/** A star-shaped region round `c` in one view's plane (through c), as a
 *  polygon: for each direction, the radial span where `test` holds. */
function sampled(view: 'side' | 'top', c: Vec3, rMax: number, test: (p: Vec3) => boolean): { poly: [number, number][] }[] {
  const out: [number, number][] = [];
  const inner: [number, number][] = [];
  for (let i = 0; i < 90; i++) {
    const a = (i / 90) * Math.PI * 2;
    const d = view === 'side' ? { x: Math.cos(a), y: Math.sin(a), z: 0 } : { x: Math.cos(a), y: 0, z: Math.sin(a) };
    let lo = -1;
    let hi = -1;
    for (let r = 0; r <= rMax; r += 10) {
      if (test(add(c, scale(d, r)))) {
        if (lo < 0) lo = r;
        hi = r;
      }
    }
    if (lo >= 0) {
      const uv = (r: number): [number, number] => [c.x + d.x * r, view === 'side' ? c.y + d.y * r : c.z + d.z * r];
      out.push(uv(hi));
      inner.push(uv(lo));
    }
  }
  return out.length > 2 ? [{ poly: [...out, ...inner.reverse()] }] : [];
}

/** A zone of one kind on a family, with the lesson's words. */
export function saxZone(F: SaxFamily, kind: ZoneKindId, id: string, w: ZoneWords): DocumentedZone {
  const A = F.A;
  const row = F.row;
  const P = F.STANDING;
  const right = across(A.bellAxis, P.ax.n);
  const up = { x: 0, y: -1, z: 0 };
  const draws = (target: Vec3, axis: Vec3, cone: number, r0: number, r1: number, toward?: Vec3) => ({ side: zoneSection('side', target, axis, cone, r0, r1, toward), top: zoneSection('top', target, axis, cone, r0, r1, toward) });
  const start = (z: Omit<DocumentedZone, 'start'>, gen: Iterable<MicPose>): DocumentedZone => ({ ...z, start: firstClear(F.MODEL, z, SAX_VARIANT_IDS, gen, MIC_TYPES) } as DocumentedZone);
  const near = [75, 68, 82, 62, 88, 56, 94];
  switch (kind) {
    case 'above': {
      const sop = row.id === 'soprano';
      const normal = sop ? upAcross(A.bellAxis) : A.bellAxis;
      return start(
        {
          id,
          ...w,
          kind: 'sourced',
          src: 'S-REC',
          quote: 'Position: A few inches above bell and aiming at sound holes — Natural (S-REC p.13, S-LIVE p.26, the S-SAX photo caption)',
          bandProv: FEW,
          refSurface: sop ? 'bellTop' : 'bell',
          side: 'outside',
          distance: { min: 50, max: 100 },
          cone: { min: 0, max: sop ? 55 : 45, prov: ill('above the bell: within 45° of its axis (the soprano: of "up") — the lab’s drawing') },
          aimAt: { surface: 'holes', r: A.rimR * 3.6, prov: ill('aimed toward the sound holes: the front axis meets the key stack’s plane near its middle') },
          requires: { micTypeIds: DYNAMICS },
          draw: draws(A.rimC, normal, sop ? 55 : 45, 50, 100),
        },
        around(A.rimC, normal, near, sop ? 50 : 40, A.holesC, FORWARD),
      );
    }
    case 'into':
      return start(
        {
          id,
          ...w,
          kind: 'sourced',
          src: 'S-REC',
          quote: 'A few inches from and aiming into bell — Bright, minimizes feedback and leakage (S-REC, S-LIVE; S-BWS)',
          bandProv: FEW,
          refSurface: 'bell',
          side: 'outside',
          distance: { min: 50, max: 100 },
          cone: { min: 0, max: 22, prov: ill('on the bell’s axis: within 22° (the lab’s drawing)') },
          aim: { maxOffAxis: 18, prov: ill('aimed into the bell: within 18° of its centre') },
          requires: { micTypeIds: DYNAMICS },
          draw: draws(A.rimC, A.bellAxis, 22, 50, 100),
        },
        around(A.rimC, A.bellAxis, near, 18, A.rimC, FORWARD),
      );
    case 'holes':
      return start(
        {
          id,
          ...w,
          kind: 'sourced',
          src: 'S-BWS',
          quote: 'Moving the mic a few inches from the sound holes creates a warm, full sound, but may pick up additional finger noise.',
          bandProv: FEW,
          refSurface: 'holes',
          side: 'outside',
          distance: { min: 50, max: 100 },
          cone: { min: 0, max: 45, prov: ill('in front of the key stack: within 45° of its outward line (the lab’s drawing)') },
          aim: { maxOffAxis: 30, prov: ill('aimed at the holes: within 30°') },
          requires: { micTypeIds: DYNAMICS },
          draw: draws(A.holesC, A.holesN, 45, 50, 100),
        },
        around(A.holesC, A.holesN, near, 40, A.holesC, up),
      );
    case 'clip':
    case 'sopFront':
    case 'sopFar': {
      const H = holesOf(row);
      const bellKey = H.filter((h) => h.on === 'bell')[1] ?? H[1];
      const keyPt = onTube(P, bellKey.u, 40, 4);
      const aimPt = kind === 'sopFar' ? A.upperKeys : kind === 'sopFront' ? A.rimC : midpoint(A.rimC, keyPt);
      const other = norm({ x: A.bellAxis.y * right.z - A.bellAxis.z * right.y, y: A.bellAxis.z * right.x - A.bellAxis.x * right.z, z: A.bellAxis.x * right.y - A.bellAxis.y * right.x });
      const nominal =
        kind === 'clip'
          ? add(add(A.rimC, scale(A.bellAxis, 28)), scale(right, A.rimR + 26))
          : kind === 'sopFront'
            ? add(A.rimC, scale(A.bellAxis, 55))
            : add(add(A.rimC, scale(A.bellAxis, -105)), scale(right, A.rimR * 0.5 + 40));
      const dir = norm(sub(aimPt, nominal));
      function* gen(): Generator<MicPose> {
        for (const a of [0, 12, -12, 24, -24, 36])
          for (const b of [0, 12, -12, 24, -24])
            for (const c of [0, 10, -10, 20]) {
              const p = add(add(add(nominal, scale(A.bellAxis, a)), scale(right, c)), scale(other, b));
              yield aimAt(p, aimPt);
            }
      }
      const base = {
        id,
        ...w,
        kind: 'sourced' as const,
        src: kind === 'clip' ? 'DPA-MOUNT' : 'DPA-MOUNT',
        quote:
          kind === 'clip'
            ? 'do not point the microphone directly into the bell, but angle it between the bell and the keys (4099S); "The spot slightly to the saxophone player’s right-hand side, next to the bell" (DPA-SAX)'
            : kind === 'sopFar'
              ? 'For a round and warm character on the soprano sax, place the 4099S as far away from the bell as possible … point it towards the upper joint'
              : 'Place it in front of the bell for a harder sound with more bite.',
        bandProv: ill('no distance is given: the capsule within the clip’s reach of the rim (a drawing default)'),
        refSurface: 'bell',
        side: 'outside' as const,
        requires: { micTypeIds: ['saxClip'] },
      };
      if (kind === 'clip')
        return start(
          {
            ...base,
            distance: { min: 40, max: 160 },
            cone: { min: 25, max: 115, toward: right, prov: ill('beside the bell on the player’s right-hand side (the lab’s drawing)') },
            aim: { maxOffAxis: 35, dir, prov: ill('angled between the bell and the keys: within 35°') },
            draw: { side: zoneDisc('side', nominal, 34), top: zoneDisc('top', nominal, 34) },
          },
          gen(),
        );
      if (kind === 'sopFront')
        return start(
          {
            ...base,
            distance: { min: 30, max: 95 },
            cone: { min: 0, max: 35, prov: ill('in front of the bell: within 35° of its axis (the lab’s drawing)') },
            aim: { maxOffAxis: 25, prov: ill('aimed into the bell: within 25°') },
            draw: draws(A.rimC, A.bellAxis, 35, 30, 95),
          },
          gen(),
        );
      return start(
        {
          ...base,
          distance: { min: 70, max: 175 },
          cone: { min: 95, max: 178, toward: right, prov: ill('back along the body from the rim, on the player’s right (the lab’s drawing)') },
          aim: { maxOffAxis: 30, dir, prov: ill('aimed back toward the upper keys: within 30°') },
          draw: { side: zoneDisc('side', nominal, 40), top: zoneDisc('top', nominal, 40) },
        },
        gen(),
      );
    }
    case 'front': {
      const c = midpoint(A.rimC, A.upperKeys);
      return start(
        {
          id,
          ...w,
          kind: 'sourced',
          src: 'MDAT',
          quote: 'Saxophones — Place the microphone directly in front of the instrument about 18-24 inches. Aim the microphone in between the bell and the left hand keys.',
          refSurface: 'between',
          side: 'outside',
          distance: { min: 457.2, max: 609.6 },
          cone: { min: 0, max: 40, prov: ill('directly in front: within 40° of the audience-facing line (the lab’s drawing)') },
          aim: { maxOffAxis: 25, prov: ill('aimed between the bell and the left-hand keys: within 25°') },
          requires: { micTypeIds: ['saxLdc'] },
          draw: draws(c, FORWARD, 40, 457.2, 609.6),
        },
        around(c, FORWARD, [530, 500, 560, 480, 590], 36, c, up),
      );
    }
    case 'third':
      return start(
        {
          id,
          ...w,
          kind: 'sourced',
          src: 'SW-SAX',
          quote: 'Start with the mic about 12–24 inches away from the bell of the saxophone, not pointing directly into the bell, but a third of the way up the horn between the bell and the mouthpiece… If the player is seated, then a mic height approximately even with their right elbow is a good starting point. (2024 archived copy)',
          refSurface: 'bellFront',
          side: 'outside',
          distance: { min: 304.8, max: 609.6 },
          cone: { min: 0, max: 60, prov: ill('in front of the bell: within 60° of the audience-facing line (the lab’s drawing)') },
          aimAt: { surface: 'third', r: 130, prov: ill('aimed a third of the way up the horn: the front axis meets the body there, within 13 cm') },
          requires: { micTypeIds: ['saxLdc'] },
          draw: draws(A.rimC, FORWARD, 60, 304.8, 609.6),
        },
        around(A.rimC, norm(add(FORWARD, { x: 0, y: 0.15, z: 0 })), [450, 420, 480, 390, 520, 360], 54, A.third, up),
      );
    case 'triangle': {
      // The horn's length H, top to bottom; the apex in front, H from both.
      const H = dist(A.top, A.bottom);
      const mid = midpoint(A.top, A.bottom);
      const apex = add(mid, scale(FORWARD, H * Math.sqrt(3) / 2));
      const aimDir = norm(sub(mid, apex));
      const test = (p: Vec3) => {
        const a = dist(p, A.top);
        const b = dist(p, A.bottom);
        return a >= 0.9 * H && a <= 1.15 * H && b >= 0.9 * H && b <= 1.15 * H && p.x > mid.x;
      };
      function* gen(): Generator<MicPose> {
        for (const dx of [0, 40, -40, 80])
          for (const dy of [0, 40, -40])
            for (const dz of [0, 60, -60]) yield aimAt(add(apex, { x: dx, y: dy, z: dz }), add(mid, { x: 0, y: dy, z: 0 }));
      }
      return start(
        {
          id,
          ...w,
          kind: 'sourced',
          src: 'S-SAX',
          quote: 'Imagine a triangle, where the top of the horn and the bottom of the horn and the mic and make an equilateral triangle… the larger the horn, the farther away (Adam Hill). Geometry DERIVED: the mic as far from the top and the bottom as they are from each other.',
          bandProv: ill('the equilateral triangle drawn as 0.9–1.15 × the horn’s length from its top and its bottom'),
          refSurface: 'top',
          side: 'outside',
          distance: { min: 0.9 * H, max: 1.15 * H },
          near: { point: A.bottom, min: 0.9 * H, max: 1.15 * H, prov: ill('the triangle’s other side, from the bottom of the horn') },
          cone: { min: 0, max: 60, prov: ill('in front of the horn (the lab’s drawing)') },
          aim: { maxOffAxis: 25, dir: aimDir, prov: ill('aimed at the middle of the horn: within 25°') },
          requires: { micTypeIds: ['saxLdc'] },
          draw: { side: sampled('side', apex, H * 0.5, test), top: sampled('top', apex, H * 0.5, test) },
        },
        gen(),
      );
    }
    case 'shoulder': {
      const ear = earR(P);
      const n = norm({ x: -0.5, y: -1, z: 0.6 });
      const look = midpoint(A.holesC, A.rimC);
      return start(
        {
          id,
          ...w,
          kind: 'sourced',
          src: 'S-SAX',
          quote: 'placing a mic over the shoulder of the sax player… you’re miking what the horn player is hearing (Adam Hill)',
          bandProv: ill('no distance is given: 15–30 cm from the player’s right ear (a drawing default)'),
          refSurface: 'ear',
          side: 'outside',
          distance: { min: 150, max: 300 },
          cone: { min: 0, max: 60, prov: ill('above and a little behind the right shoulder (the lab’s drawing)') },
          aim: { maxOffAxis: 35, dir: norm(sub(look, add(ear, scale(n, 220)))), prov: ill('looking down over the shoulder at the horn: within 35°') },
          requires: { micTypeIds: ['saxLdc'] },
          draw: draws(ear, n, 60, 150, 300),
        },
        around(ear, n, [220, 200, 240, 180, 260, 160, 280], 54, look, FORWARD),
      );
    }
  }
}
