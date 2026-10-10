/**
 * THE ELECTRIC PIANOS — the look (charter §2 layer 3), drawn ONLY from
 * keysGeometry.ts / wurliModel.ts / keysSpec.ts in millimetres of each view's
 * (u, v) plane, so the drawing, the labels, the hit areas and the readouts
 * agree at every zoom.
 *
 *   RhodesFrontArt   the tine piano on its legs, from the player's side: the
 *                    harp cover, the name rail with the controls and the
 *                    jack, the keys, the legs and the sustain pedal
 *   RhodesTopArt     the same from above
 *   WurliFrontArt    the reed piano from the seated player: the lid's slope
 *                    with its two oval grilles, the keys, the case on legs
 *   WurliSection     the reed piano CUT through the bass-side speaker (side)
 *                    or at the speakers' height (top) — the placement scene's
 *                    art: the lid shell, the oval speaker in section (on the
 *                    lid, or on the amp rail behind it), the keys, the action
 *                    in shadow, the seated player (minimal line art)
 *   OvalFace         one 4 × 8 in oval speaker face-on, the three spots
 *
 * Light from the upper left, gradients for form, rim highlights; the house
 * stroke hierarchy. Generic finishes, no maker's likeness, name or logo.
 * Static (D8): paths are built once per view and cached at module scope.
 */
import { BlurMask, Circle, DashPathEffect, Group, Line, LinearGradient, Path, RadialGradient, Skia, vec } from '@shopify/react-native-skia';
import type { LessonArt } from '../../../engine/scene/sceneTypes.ts';
import type { StaticLabel } from '../../../engine/scene/StaticLabels';
import type { ViewId } from '../../../engine/model/types.ts';
import { SPK } from '../speakers/SpeakerArt';
import { OVAL_SPOTS, SPEAKER_OVAL_4x8 as OV } from './keysSpec.ts';
import { RHODES_FRONT, RHODES_TOP, WURLI_FRONT, type KeyRects, type Rect } from './keysGeometry.ts';
import { C_BASS, C_TREBLE, FACE_TOP, OVAL_SECTION, PLAYER, W, onSpeaker } from './wurliModel.ts';
import { FigureHead, FigureMass, headAbove, headProfile, limb, type FigureTone } from '../players/PlayerFigure';
import { pt } from '../players/playerPose';

type SkPath = ReturnType<typeof Skia.Path.Make>;
const make = () => Skia.Path.Make();
function rr(p: SkPath, u0: number, v0: number, u1: number, v1: number, r: number): SkPath {
  p.addRRect(Skia.RRectXY(Skia.XYWHRect(Math.min(u0, u1), Math.min(v0, v1), Math.abs(u1 - u0), Math.abs(v1 - v0)), r, r));
  return p;
}
const R = (q: Rect, r = 0) => rr(make(), q.u0, q.v0, q.u1, q.v1, r);
function poly(pts: readonly (readonly [number, number])[], close = true): SkPath {
  const p = make();
  pts.forEach(([u, v], i) => (i === 0 ? p.moveTo(u, v) : p.lineTo(u, v)));
  if (close) p.close();
  return p;
}
function ellipse(cu: number, cv: number, a: number, b: number): SkPath {
  const p = make();
  p.addOval(Skia.XYWHRect(cu - a, cv - b, 2 * a, 2 * b));
  return p;
}

/* ── palette (house tokens + material ramps) ── */
export const KEYS = {
  amber: '#ffc64d',
  ivory: ['#fdfcf8', '#ebe8df', '#c4c0b5'],
  ebony: ['#2a2b30', '#121316', '#050506'],
  tolex: SPK.tolex,
  chrome: SPK.chrome,
  /** The reed piano's moulded case (a cosmetic finish). */
  plastic: ['#8e4636', '#5e2a20', '#2e130e'],
  plasticRim: '#c27a62',
  nameRail: ['#5b5e66', '#2a2c32', '#121316'],
  floor: SPK.floor,
  interior: SPK.interior,
  player: '#8a8f9c',
} as const;

/* ── keys ── */
function KeysTop({ k, hi }: { k: KeyRects; hi?: boolean }) {
  const whites = make();
  const lines = make();
  for (const w of k.whites) {
    rr(whites, w.u0 + 0.5, w.v0, w.u1 - 0.5, w.v1, 1.5);
    lines.moveTo(w.u0, w.v0);
    lines.lineTo(w.u0, w.v1);
  }
  const blacks = make();
  const blackHi = make();
  for (const b of k.blacks) {
    rr(blacks, b.u0, b.v0, b.u1, b.v1, 1.6);
    rr(blackHi, b.u0 + (b.u1 - b.u0) * 0.22, b.v0 + 3, b.u0 + (b.u1 - b.u0) * 0.42, b.v1 - 6, 1);
  }
  const v0 = k.whites[0].v0;
  const v1 = k.whites[0].v1;
  return (
    <Group>
      <Path path={whites}>
        <LinearGradient start={vec(0, Math.min(v0, v1))} end={vec(0, Math.max(v0, v1))} colors={[...KEYS.ivory]} />
      </Path>
      <Path path={lines} style="stroke" strokeWidth={0.8} color="#7d796f" opacity={0.7} />
      <Path path={blacks} color="#000" opacity={0.45}>
        <BlurMask blur={2.5} style="normal" />
      </Path>
      <Path path={blacks}>
        <LinearGradient start={vec(0, Math.min(v0, v1))} end={vec(0, Math.max(v0, v1))} colors={[...KEYS.ebony]} />
      </Path>
      <Path path={blackHi} color="#ffffff" opacity={0.14} />
      {hi ? <Path path={rr(make(), k.whites[0].u0 - 6, Math.min(v0, v1) - 6, k.whites[k.whites.length - 1].u1 + 6, Math.max(v0, v1) + 6, 6)} style="stroke" strokeWidth={4} color={KEYS.amber} /> : null}
    </Group>
  );
}

/* ── shared hardware ── */
/** Polished chrome across a round tube: dark edge, hot highlight left of
 *  centre (light from the upper left), a reflected band on the right. */
const TUBE = ['#3a3d45', '#f6f8fb', '#c9ced7', '#7d828c', '#c2c7d0', '#2a2c32'] as const;
const TUBE_POS = [0, 0.24, 0.42, 0.66, 0.84, 1];

/**
 * A screw-in chrome leg: a tapered tube from its socket (u0, v0) under the
 * case to the floor at u1, with the threaded collar at the top and a rubber
 * foot cap. Ø 30 at the socket → Ø 24 at the foot; the cap Ø 34 × 28.
 */
function TubeLeg({ u0, v0, u1, dim = 1 }: { u0: number; v0: number; u1: number; dim?: number }) {
  const rT = 15;
  const rB = 12;
  const footV = -26;
  const len = Math.hypot(u1 - u0, footV - v0);
  const nx = (footV - v0) / len; // unit normal to the axis (screen x)
  const ny = -(u1 - u0) / len;
  const tube = poly([
    [u0 - nx * rT, v0 - ny * rT],
    [u0 + nx * rT, v0 + ny * rT],
    [u1 + nx * rB, footV + ny * rB],
    [u1 - nx * rB, footV - ny * rB],
  ]);
  const mu = (u0 + u1) / 2;
  const mv = (v0 + footV) / 2;
  return (
    <Group opacity={dim}>
      <Path path={tube}>
        <LinearGradient start={vec(mu - nx * 14, mv - ny * 14)} end={vec(mu + nx * 14, mv + ny * 14)} colors={[...TUBE]} positions={TUBE_POS} />
      </Path>
      <Path path={tube} style="stroke" strokeWidth={1.2} color="#08080a" opacity={0.55} />
      {/* the collar where the leg screws into its socket plate */}
      <Path path={rr(make(), u0 - 19, v0, u0 + 19, v0 + 16, 3)}>
        <LinearGradient start={vec(u0 - 19, 0)} end={vec(u0 + 19, 0)} colors={[...TUBE]} positions={TUBE_POS} />
      </Path>
      <Line p1={vec(u0 - 18, v0 + 6)} p2={vec(u0 + 18, v0 + 6)} color="#2a2c32" strokeWidth={1.4} opacity={0.7} />
      <Line p1={vec(u0 - 18, v0 + 11)} p2={vec(u0 + 18, v0 + 11)} color="#2a2c32" strokeWidth={1.4} opacity={0.7} />
      {/* the rubber foot */}
      <Path path={rr(make(), u1 - 17, footV - 4, u1 + 17, 0, 7)}>
        <LinearGradient start={vec(u1 - 17, 0)} end={vec(u1 + 17, 0)} colors={['#2e3036', '#1a1b1f', '#08080a']} />
      </Path>
      <Line p1={vec(u1 - 13, footV)} p2={vec(u1 + 9, footV)} color="#5a5d66" strokeWidth={1.4} opacity={0.6} />
    </Group>
  );
}

function Floor({ u0, u1 }: { u0: number; u1: number }) {
  return (
    <Group>
      <Path path={rr(make(), u0, 0, u1, 40, 0)}>
        <LinearGradient start={vec(0, 0)} end={vec(0, 40)} colors={[...KEYS.floor]} />
      </Path>
      <Line p1={vec(u0, 0)} p2={vec(u1, 0)} color="#4a4c58" strokeWidth={2.5} />
    </Group>
  );
}

/** A black skirted control knob (Ø 2r) with a knurled metal cap and a white pointer. */
function Knob({ u, v, r }: { u: number; v: number; r: number }) {
  const ang = -2.2;
  return (
    <Group>
      <Circle cx={u + 1.5} cy={v + 2.5} r={r + 1} color="#000" opacity={0.55}>
        <BlurMask blur={2} style="normal" />
      </Circle>
      <Circle cx={u} cy={v} r={r}>
        <RadialGradient c={vec(u - r * 0.4, v - r * 0.45)} r={r * 1.6} colors={['#4a4c54', '#1a1b1f', '#050506']} />
      </Circle>
      <Circle cx={u} cy={v} r={r * 0.62}>
        <RadialGradient c={vec(u - r * 0.25, v - r * 0.3)} r={r} colors={['#f2f4f8', '#a6acb7', '#4a4e57']} />
      </Circle>
      <Circle cx={u} cy={v} r={r * 0.62} style="stroke" strokeWidth={0.9} color="#08080a" opacity={0.6} />
      <Line p1={vec(u + Math.cos(ang) * r * 0.2, v + Math.sin(ang) * r * 0.2)} p2={vec(u + Math.cos(ang) * r * 0.95, v + Math.sin(ang) * r * 0.95)} color="#f6f2e8" strokeWidth={1.8} strokeCap="round" />
    </Group>
  );
}

/** A ¼ in jack socket: its chrome hex nut and the dark bore. */
function Jack({ u, v }: { u: number; v: number }) {
  const hex: [number, number][] = [];
  for (let i = 0; i < 6; i++) hex.push([u + 9.5 * Math.cos((i * Math.PI) / 3 + Math.PI / 6), v + 9.5 * Math.sin((i * Math.PI) / 3 + Math.PI / 6)]);
  return (
    <Group>
      <Path path={poly(hex)}>
        <LinearGradient start={vec(u - 9, v - 9)} end={vec(u + 9, v + 9)} colors={[...KEYS.chrome]} />
      </Path>
      <Path path={poly(hex)} style="stroke" strokeWidth={0.8} color="#08080a" opacity={0.6} />
      <Circle cx={u} cy={v} r={5.6} color="#5a5e68" />
      <Circle cx={u} cy={v} r={4.4} color="#030304" />
    </Group>
  );
}

/**
 * The keys as the seated player sees them (a near-front elevation): the white
 * tops foreshortened (back edge above), the black keys standing 12 mm proud
 * with their front faces catching the light, and the white keys' front faces
 * down to `face1`. White 23.5 wide; black 13.6 wide × 95 long.
 */
function KeysElevation({ k, face1 }: { k: KeyRects; face1: number }) {
  const back = Math.min(k.whites[0].v0, k.whites[0].v1);
  const front = Math.max(k.whites[0].v0, k.whites[0].v1);
  const RISE = 12;
  const tops = make();
  const faces = make();
  const gaps = make();
  for (const w of k.whites) {
    rr(tops, w.u0 + 0.5, back, w.u1 - 0.5, front, 0.6);
    rr(faces, w.u0 + 0.7, front + 0.4, w.u1 - 0.7, face1, 1.8);
    gaps.moveTo(w.u0, back);
    gaps.lineTo(w.u0, face1);
  }
  const last = k.whites[k.whites.length - 1];
  gaps.moveTo(last.u1, back);
  gaps.lineTo(last.u1, face1);
  const bTop = make();
  const bFace = make();
  const bShadow = make();
  const bLip = make();
  for (const b of k.blacks) {
    const bf = Math.max(b.v0, b.v1);
    rr(bTop, b.u0, back - RISE, b.u1, bf - RISE + 1, 1);
    rr(bFace, b.u0, bf - RISE, b.u1, bf, 1.4);
    rr(bShadow, b.u0 + 1.5, bf - 2, b.u1 + 3, bf + 3.5, 2);
    bLip.moveTo(b.u0 + 1.2, bf - RISE + 0.6);
    bLip.lineTo(b.u1 - 1.2, bf - RISE + 0.6);
  }
  return (
    <Group>
      <Path path={tops}>
        <LinearGradient start={vec(0, back)} end={vec(0, front)} colors={['#d9d5ca', '#f4f2ec', '#fdfcf8']} />
      </Path>
      <Path path={faces}>
        <LinearGradient start={vec(0, front)} end={vec(0, face1)} colors={['#fbfaf6', '#e2dfd6', '#aaa69c']} />
      </Path>
      <Path path={gaps} style="stroke" strokeWidth={1.1} color="#5e5a52" opacity={0.85} />
      <Line p1={vec(k.whites[0].u0, front + 0.3)} p2={vec(last.u1, front + 0.3)} color="#ffffff" strokeWidth={0.9} opacity={0.7} />
      <Path path={bShadow} color="#000" opacity={0.35}>
        <BlurMask blur={1.5} style="normal" />
      </Path>
      <Path path={bTop}>
        <LinearGradient start={vec(0, back - RISE)} end={vec(0, back)} colors={['#3a3b41', '#16171a', '#0b0b0d']} />
      </Path>
      <Path path={bFace}>
        <LinearGradient start={vec(0, back)} end={vec(0, front)} colors={['#4a4c54', '#25262b', '#0d0d10']} />
      </Path>
      <Path path={bLip} style="stroke" strokeWidth={0.9} color="#8a8f9c" opacity={0.7} />
    </Group>
  );
}

const hiRect = (q: Rect, pad = 8) => <Path path={rr(make(), q.u0 - pad, q.v0 - pad, q.u1 + pad, q.v1 + pad, 8)} style="stroke" strokeWidth={4} color={KEYS.amber} />;

/* ═══════════════ the tine piano ═══════════════
 * REAL DIMENSIONS (mm), code comment only:
 *   the 73-key stage model (maker's manual) 1153 W × 563 D × 225 H; the
 *   61-key passive model the lesson draws: the same case 7 white keys
 *   narrower → 988.5 W (36 white keys × 23.5 = 846, end blocks 71 each),
 *   C to C (25 black keys, 13.6 wide × 95 long, standing 12 proud).
 *   Bottom case ≈ 100 deep below the key tops, covered in black vinyl, a
 *   key slip trim 5 high; harp cover (lid) ≈ 65 above the name rail, its
 *   front a lit bevel; name rail 38 high carrying two Ø 24 knobs (volume,
 *   bass) and the ¼ in output jack at the bass end.
 *   Key tops 720 above the floor on four screw-in chrome legs, Ø 30 → 24,
 *   ≈ 640 long, each leaning ≈ 6.5° outward (70 over the drop), rubber feet
 *   Ø 34; the sustain pedal ≈ 110 wide × 260 long × 50 high on the floor with
 *   its Ø 12 push rod rising into a socket under the keybed.
 */
type RhodesFrontPaths = Record<'lid' | 'lidBevel' | 'caseLow' | 'cheekL' | 'cheekR' | 'rail' | 'plate' | 'slip' | 'trim' | 'caps', SkPath>;
let rhFront: RhodesFrontPaths | null = null;
function rhodesFrontPaths(): RhodesFrontPaths {
  if (rhFront) return rhFront;
  const F = RHODES_FRONT;
  const half = F.half;
  const seam = F.nameRail.v0;
  // the harp cover: rounded at its upper corners, a lit bevel along its front
  const lid = make();
  lid.moveTo(-half + 4, seam);
  lid.lineTo(-half + 4, F.top + 30);
  lid.quadTo(-half + 4, F.top, -half + 34, F.top);
  lid.lineTo(half - 34, F.top);
  lid.quadTo(half - 4, F.top, half - 4, F.top + 30);
  lid.lineTo(half - 4, seam);
  lid.close();
  const bev = F.top + 30;
  const lidBevel = make();
  lidBevel.moveTo(-half + 6, seam - 3);
  lidBevel.lineTo(-half + 6, bev);
  lidBevel.lineTo(half - 6, bev);
  lidBevel.lineTo(half - 6, seam - 3);
  lidBevel.close();
  const caseLow = rr(make(), -half, seam + 2, half, F.bottom, 10);
  const cheekL = make();
  cheekL.moveTo(-half, F.bottom - 10);
  cheekL.lineTo(-half, seam + 2);
  cheekL.lineTo(-half + F.cheek - 14, seam + 2);
  cheekL.quadTo(-half + F.cheek, seam + 2, -half + F.cheek, seam + 16);
  cheekL.lineTo(-half + F.cheek, F.slip.v0);
  cheekL.lineTo(-half + F.cheek, F.bottom);
  cheekL.lineTo(-half + 10, F.bottom);
  cheekL.close();
  const m = Skia.Matrix();
  m.scale(-1, 1);
  const cheekR = cheekL.copy();
  cheekR.transform(m);
  const rail = R(F.nameRail, 1.5);
  const plate = rr(make(), F.knobs[0] - 24, F.nameRail.v0 + 5, F.jack + 20, F.nameRail.v1 - 5, 3);
  const slip = R(F.slip, 2);
  const trim = rr(make(), F.slip.u0, F.slip.v0, F.slip.u1, F.slip.v0 + 5, 1);
  // chrome corner caps on the case's lower corners
  const caps = make();
  for (const sg of [-1, 1]) {
    const x = sg * half;
    caps.addPath(
      poly([
        [x, F.bottom - 30],
        [x, F.bottom - 6],
        [x - sg * 6, F.bottom],
        [x - sg * 30, F.bottom],
        [x - sg * 30, F.bottom - 5],
        [x - sg * 5, F.bottom - 5],
        [x - sg * 5, F.bottom - 30],
      ]),
    );
  }
  rhFront = { lid, lidBevel, caseLow, cheekL, cheekR, rail, plate, slip, trim, caps };
  return rhFront;
}

export function RhodesFrontArt({ hi }: { hi?: string | null }) {
  const F = RHODES_FRONT;
  const half = F.half;
  const g = rhodesFrontPaths();
  const pedal = F.pedal;
  const railV = (F.nameRail.v0 + F.nameRail.v1) / 2;
  const out = (u: number) => u + Math.sign(u) * F.legSplay;
  return (
    <Group>
      <Floor u0={-half - 120} u1={half + 120} />
      {/* soft shadow under the instrument and at each foot */}
      <Path path={rr(make(), -half + 40, -12, half - 40, 8, 10)} color="#000" opacity={0.45}>
        <BlurMask blur={16} style="normal" />
      </Path>
      {F.legs.map((u) => (
        <Path key={`s${u}`} path={rr(make(), out(u) - 30, -6, out(u) + 30, 8, 7)} color="#000" opacity={0.6}>
          <BlurMask blur={5} style="normal" />
        </Path>
      ))}
      {/* the rear pair, behind and a little inboard */}
      {F.legs.map((u) => {
        const ur = u - Math.sign(u) * 34;
        return <TubeLeg key={`r${u}`} u0={ur} v0={F.bottom} u1={ur + Math.sign(u) * (F.legSplay - 26)} dim={0.42} />;
      })}
      {/* the sustain pedal: its push rod up into the socket under the keybed */}
      <Path path={rr(make(), pedal.u - 6, F.bottom + 8, pedal.u + 6, -pedal.h + 4, 3)}>
        <LinearGradient start={vec(pedal.u - 6, 0)} end={vec(pedal.u + 6, 0)} colors={['#4a4c54', '#1d1e22', '#08080a']} />
      </Path>
      <Path path={rr(make(), pedal.u - 13, F.bottom - 1, pedal.u + 13, F.bottom + 12, 3)}>
        <LinearGradient start={vec(pedal.u - 13, 0)} end={vec(pedal.u + 13, 0)} colors={[...TUBE]} positions={TUBE_POS} />
      </Path>
      <Path path={rr(make(), pedal.u - pedal.w / 2, -14, pedal.u + pedal.w / 2, 0, 4)}>
        <LinearGradient start={vec(0, -14)} end={vec(0, 0)} colors={['#3a3b41', '#16171b', '#08080a']} />
      </Path>
      <Path path={poly([[pedal.u - pedal.w / 2 + 8, -14], [pedal.u + pedal.w / 2 - 8, -14], [pedal.u + pedal.w / 2 - 12, -pedal.h + 6], [pedal.u - pedal.w / 2 + 12, -pedal.h + 6]])}>
        <LinearGradient start={vec(pedal.u - pedal.w / 2, 0)} end={vec(pedal.u + pedal.w / 2, 0)} colors={[...TUBE]} positions={TUBE_POS} />
      </Path>
      <Path path={rr(make(), pedal.u - pedal.w / 2 + 10, -pedal.h, pedal.u + pedal.w / 2 - 10, -pedal.h + 9, 3)} color="#121316" />
      {[-30, -15, 0, 15, 30].map((d) => (
        <Line key={d} p1={vec(pedal.u + d, -pedal.h + 2)} p2={vec(pedal.u + d, -pedal.h + 7)} color="#3a3c44" strokeWidth={1.4} />
      ))}
      {/* the front pair of legs */}
      {F.legs.map((u) => (
        <TubeLeg key={`f${u}`} u0={u} v0={F.bottom} u1={out(u)} />
      ))}
      {/* the bottom case (black vinyl) and its end blocks */}
      <Path path={g.caseLow}>
        <LinearGradient start={vec(-half, F.nameRail.v0)} end={vec(half * 0.3, F.bottom)} colors={[...KEYS.tolex]} />
      </Path>
      <Path path={g.cheekL}>
        <LinearGradient start={vec(-half, 0)} end={vec(-half + F.cheek, 0)} colors={['#45464d', '#24252a', '#141518']} />
      </Path>
      <Path path={g.cheekR}>
        <LinearGradient start={vec(half - F.cheek, 0)} end={vec(half, 0)} colors={['#2a2b30', '#17181b', '#0b0b0d']} />
      </Path>
      <Path path={g.cheekL} style="stroke" strokeWidth={1.2} color="#6a6d76" opacity={0.45} />
      <Path path={g.cheekR} style="stroke" strokeWidth={1.2} color="#08080a" opacity={0.7} />
      {/* the harp cover over the tines: top, and its lit front bevel */}
      <Path path={g.lid}>
        <LinearGradient start={vec(0, F.top)} end={vec(0, F.nameRail.v0)} colors={['#2e3036', '#1a1b1f', '#0e0f11']} />
      </Path>
      <Path path={g.lidBevel}>
        <LinearGradient start={vec(-half, F.top + 30)} end={vec(half * 0.6, F.nameRail.v0)} colors={['#5a5d66', '#33353c', '#1a1b1f']} />
      </Path>
      <Line p1={vec(-half + 30, F.top + 2.5)} p2={vec(half - 30, F.top + 2.5)} color="#ffffff" strokeWidth={2} opacity={0.18} />
      <Line p1={vec(-half + 8, F.top + 30)} p2={vec(half - 8, F.top + 30)} color="#8a8f9c" strokeWidth={1.2} opacity={0.5} />
      <Path path={g.lid} style="stroke" strokeWidth={1.4} color="#08080a" opacity={0.8} />
      <Line p1={vec(-half + 2, F.nameRail.v0 + 1)} p2={vec(half - 2, F.nameRail.v0 + 1)} color="#030304" strokeWidth={3} />
      {/* the name rail: the control plate with two knobs and the output jack at the bass end */}
      <Path path={g.rail}>
        <LinearGradient start={vec(0, F.nameRail.v0)} end={vec(0, F.nameRail.v1)} colors={['#3a3c43', '#1e1f24', '#0e0f11']} />
      </Path>
      <Line p1={vec(F.nameRail.u0, F.nameRail.v0 + 2)} p2={vec(F.nameRail.u1, F.nameRail.v0 + 2)} color="#c9ced7" strokeWidth={2} opacity={0.55} />
      <Path path={g.plate}>
        <LinearGradient start={vec(0, F.nameRail.v0 + 5)} end={vec(0, F.nameRail.v1 - 5)} colors={['#5a5e68', '#3a3d45', '#24262b']} />
      </Path>
      <Path path={g.plate} style="stroke" strokeWidth={0.9} color="#08080a" opacity={0.7} />
      {F.knobs.map((u) => (
        <Knob key={u} u={u} v={railV} r={12} />
      ))}
      <Jack u={F.jack} v={railV} />
      {/* the keys */}
      <KeysElevation k={F.keys} face1={F.keyFace.v1} />
      {/* the key slip below the keys, its aluminium trim, the corner caps */}
      <Path path={g.slip}>
        <LinearGradient start={vec(0, F.slip.v0)} end={vec(0, F.slip.v1)} colors={['#34353b', '#1b1c20', '#0d0e10']} />
      </Path>
      <Path path={g.trim}>
        <LinearGradient start={vec(0, F.slip.v0)} end={vec(0, F.slip.v0 + 5)} colors={[...KEYS.chrome]} />
      </Path>
      <Path path={g.caps}>
        <LinearGradient start={vec(-half, F.bottom - 30)} end={vec(-half + 30, F.bottom)} colors={[...KEYS.chrome]} />
      </Path>
      <Path path={g.caseLow} style="stroke" strokeWidth={1.4} color="#08080a" opacity={0.8} />
      {hi === 'rh.harp' ? hiRect(F.lid) : null}
      {hi === 'rh.keys' ? hiRect({ u0: F.keyTops.u0, v0: F.keyTops.v0 - 14, u1: F.keyTops.u1, v1: F.keyFace.v1 }) : null}
      {hi === 'rh.controls' ? hiRect({ u0: F.knobs[0] - 16, v0: F.nameRail.v0, u1: F.knobs[1] + 16, v1: F.nameRail.v1 }, 6) : null}
      {hi === 'rh.jack' ? <Circle cx={F.jack} cy={railV} r={20} style="stroke" strokeWidth={4} color={KEYS.amber} /> : null}
      {hi === 'rh.legs' ? F.legs.map((u) => <Path key={u} path={poly([[u - 34, F.bottom], [u + 34, F.bottom], [out(u) + 34, 4], [out(u) - 34, 4]])} style="stroke" strokeWidth={4} strokeJoin="round" color={KEYS.amber} />) : null}
      {hi === 'rh.pedal' ? hiRect({ u0: pedal.u - pedal.w / 2, v0: -pedal.h, u1: pedal.u + pedal.w / 2, v1: 0 }) : null}
    </Group>
  );
}

/** The same instrument from above (the player at the bottom): the vinyl-covered
 *  case 988.5 × 563 with chrome corners, the crowned harp cover over the
 *  tines with its lit front roll and two front latches, the name rail with
 *  the control plate, and the 36 white / 25 black keys 150 deep. */
export function RhodesTopArt({ hi }: { hi?: string | null }) {
  const T = RHODES_TOP;
  const half = T.half;
  const body = rr(make(), -half, T.back, half, T.front, 26);
  const lid = R(T.lid, 22);
  const roll = rr(make(), T.lid.u0 + 4, T.lid.v1 - 22, T.lid.u1 - 4, T.lid.v1, 10);
  const cheeks = make();
  rr(cheeks, -half + 6, T.nameRail.v0, T.keysBox.u0 - 2, T.front - 6, 8);
  rr(cheeks, T.keysBox.u1 + 2, T.nameRail.v0, half - 6, T.front - 6, 8);
  const corners = make();
  for (const su of [-1, 1])
    for (const sv of [-1, 1]) {
      const cu = su * half;
      const cv = sv > 0 ? T.front : T.back;
      corners.addPath(
        poly([
          [cu, cv - sv * 34],
          [cu, cv - sv * 10],
          [cu - su * 10, cv],
          [cu - su * 34, cv],
          [cu - su * 34, cv - sv * 7],
          [cu - su * 7, cv - sv * 7],
          [cu - su * 7, cv - sv * 34],
        ]),
      );
    }
  return (
    <Group>
      <Path path={rr(make(), -half + 10, T.back + 14, half + 10, T.front + 16, 30)} color="#000" opacity={0.55}>
        <BlurMask blur={14} style="normal" />
      </Path>
      <Path path={body}>
        <LinearGradient start={vec(-half, T.back)} end={vec(half, T.front)} colors={[...KEYS.tolex]} />
      </Path>
      <Path path={cheeks}>
        <LinearGradient start={vec(-half, T.nameRail.v0)} end={vec(-half + 80, T.front)} colors={['#3a3b41', '#22232a', '#121316']} />
      </Path>
      {/* the harp cover: a shallow crown lit from the upper left, its front edge rolling down to the name rail */}
      <Path path={lid}>
        <LinearGradient start={vec(-half, T.lid.v0)} end={vec(half * 0.4, T.lid.v1)} colors={['#4a4c54', '#2a2c31', '#17181c']} />
      </Path>
      <Path path={lid}>
        <RadialGradient c={vec(-half * 0.45, T.lid.v0 + 70)} r={half * 0.9} colors={['rgba(255,255,255,0.10)', 'rgba(255,255,255,0)']} />
      </Path>
      <Path path={roll}>
        <LinearGradient start={vec(0, T.lid.v1 - 22)} end={vec(0, T.lid.v1)} colors={['#3a3c43', '#5a5d66', '#1a1b1f']} />
      </Path>
      <Line p1={vec(T.lid.u0 + 24, T.lid.v0 + 3)} p2={vec(T.lid.u1 - 24, T.lid.v0 + 3)} color="#ffffff" strokeWidth={2} opacity={0.12} />
      <Path path={lid} style="stroke" strokeWidth={1.4} color="#08080a" opacity={0.8} />
      {/* the lid's two front latches */}
      {[-half * 0.55, half * 0.55].map((u) => (
        <Group key={u}>
          <Path path={rr(make(), u - 20, T.lid.v1 - 14, u + 20, T.lid.v1 + 4, 3)}>
            <LinearGradient start={vec(u - 20, 0)} end={vec(u + 20, 0)} colors={[...TUBE]} positions={TUBE_POS} />
          </Path>
          <Path path={rr(make(), u - 20, T.lid.v1 - 14, u + 20, T.lid.v1 + 4, 3)} style="stroke" strokeWidth={0.9} color="#08080a" opacity={0.6} />
          <Line p1={vec(u - 12, T.lid.v1 - 5)} p2={vec(u + 12, T.lid.v1 - 5)} color="#2a2c32" strokeWidth={1.4} />
        </Group>
      ))}
      {/* the name rail and its control plate */}
      <Path path={R(T.nameRail, 2)}>
        <LinearGradient start={vec(0, T.nameRail.v0)} end={vec(0, T.nameRail.v1)} colors={['#3a3c43', '#1e1f24', '#0e0f11']} />
      </Path>
      <Line p1={vec(T.nameRail.u0, T.nameRail.v0 + 2)} p2={vec(T.nameRail.u1, T.nameRail.v0 + 2)} color="#c9ced7" strokeWidth={2} opacity={0.5} />
      <Path path={rr(make(), T.knobs[0] - 24, T.nameRail.v0 + 4, T.jack + 20, T.nameRail.v1 - 4, 3)}>
        <LinearGradient start={vec(0, T.nameRail.v0)} end={vec(0, T.nameRail.v1)} colors={['#5a5e68', '#3a3d45', '#24262b']} />
      </Path>
      {T.knobs.map((u) => (
        <Knob key={u} u={u} v={T.railV} r={11} />
      ))}
      <Jack u={T.jack} v={T.railV} />
      <KeysTop k={T.keys} />
      <Path path={rr(make(), T.keysBox.u0, T.front - 9, T.keysBox.u1, T.front - 4, 1)}>
        <LinearGradient start={vec(0, T.front - 9)} end={vec(0, T.front - 4)} colors={[...KEYS.chrome]} />
      </Path>
      <Path path={corners}>
        <LinearGradient start={vec(-half, T.back)} end={vec(half, T.front)} colors={[...KEYS.chrome]} />
      </Path>
      <Path path={body} style="stroke" strokeWidth={1.4} color="#08080a" opacity={0.8} />
      {hi === 'rh.harp' ? hiRect(T.lid) : null}
      {hi === 'rh.keys' ? hiRect(T.keysBox) : null}
      {hi === 'rh.controls' ? hiRect({ u0: T.knobs[0] - 16, v0: T.nameRail.v0, u1: T.knobs[1] + 16, v1: T.nameRail.v1 }, 6) : null}
      {hi === 'rh.jack' ? <Circle cx={T.jack} cy={T.railV} r={20} style="stroke" strokeWidth={4} color={KEYS.amber} /> : null}
    </Group>
  );
}

export function rhodesLabels(view: 'front' | 'top'): StaticLabel[] {
  if (view === 'front') {
    const F = RHODES_FRONT;
    return [
      { id: 'lid', text: 'HARP COVER · THE TINES ARE UNDER IT', short: 'HARP COVER', u: 0, v: F.top - 34, align: 'center' },
      { id: 'ctl', text: 'CONTROLS · OUTPUT JACK', short: 'CONTROLS', u: F.knobs[0] - 30, v: F.nameRail.v0 - 34, align: 'left', tone: 'muted' },
      { id: 'keys', text: 'KEYS', u: 120, v: F.keyFace.v1 + 34, align: 'center', tone: 'muted' },
      { id: 'legs', text: 'LEGS', u: F.legs[0] + 40, v: -190, align: 'left', tone: 'muted' },
      { id: 'pedal', text: 'SUSTAIN PEDAL', short: 'PEDAL', u: F.pedal.u + 70, v: -30, align: 'left', tone: 'amber' },
    ];
  }
  const T = RHODES_TOP;
  return [
    { id: 'lid', text: 'HARP COVER', u: 0, v: (T.lid.v0 + T.lid.v1) / 2, align: 'center' },
    { id: 'ctl', text: 'CONTROLS · JACK', short: 'CONTROLS', u: T.knobs[0] - 20, v: T.nameRail.v0 - 26, align: 'left', tone: 'amber' },
    { id: 'keys', text: 'KEYS · THE PLAYER SITS HERE', short: 'KEYS', u: 0, v: T.front + 40, align: 'center', tone: 'muted' },
  ];
}

/* ═══════════════ the reed piano ═══════════════ */
export type WurliMount = 'lid' | 'rail';

/** The louvres across an oval grille (moulded into the lid), each slot
 *  clipped to the oval: `n` slots, open `open` of their pitch. */
function grilleSlots(g: { u: number; v: number; a: number; b: number }, n = 7, open = 0.55): SkPath {
  const p = make();
  for (let i = 0; i < n; i++) {
    const v = g.v - g.b + ((i + 0.5) * 2 * g.b) / n;
    const t = 1 - ((v - g.v) / g.b) ** 2;
    if (t <= 0) continue;
    const h = g.a * Math.sqrt(t) * 0.9;
    const hh = ((g.b / n) * open);
    rr(p, g.u - h, v - hh, g.u + h, v + hh, hh);
  }
  return p;
}
/** The lit lower lip of each louvre (light from above). */
function grilleLips(g: { u: number; v: number; a: number; b: number }, n = 7, open = 0.55): SkPath {
  const p = make();
  for (let i = 0; i < n; i++) {
    const v = g.v - g.b + ((i + 0.5) * 2 * g.b) / n;
    const t = 1 - ((v - g.v) / g.b) ** 2;
    if (t <= 0) continue;
    const h = g.a * Math.sqrt(t) * 0.88;
    const y = v + (g.b / n) * open + 0.8;
    p.moveTo(g.u - h, y);
    p.lineTo(g.u + h, y);
  }
  return p;
}

/*
 * THE REED PIANO from the seated player — REAL DIMENSIONS (mm), code comment
 * only (the case is a drawing default; the lesson says "measure a real one"):
 *   a 64-key portable reed piano A to C: 38 white keys (26 black); a real
 *   white key is ≈ 23.5 wide (893 across) — the drawing default spreads the
 *   38 over 940 (24.7 each) between 40 end blocks; case ≈ 1020 W × 500 D ×
 *   230 H in moulded plastic: a lower case under the keys and a lid whose
 *   front slopes back 20° above the keys. Two 4 × 8 in (102 × 203) oval
 *   speakers behind two moulded oval grilles of louvres in that slope,
 *   ±260 from the centre. Volume and vibrato knobs (Ø 20 / Ø 16) at the bass
 *   end. Key tops 720 above the floor on four screw-in chrome legs (Ø 28 →
 *   22, rubber feet); a chrome sustain pedal ≈ 100 wide on its cable.
 */
export function WurliFrontArt({ hi, mount = 'lid' }: { hi?: string | null; mount?: WurliMount }) {
  const F = WURLI_FRONT;
  const half = F.half;
  const pedal = F.pedal;
  const top = F.face.v0;
  // the lid: its top seen foreshortened above the slope, the ends rounded down
  const lid = make();
  lid.moveTo(-half + 2, F.face.v1);
  lid.lineTo(-half + 2, top + 10);
  lid.cubicTo(-half + 2, top - 10, -half + 18, top - 16, -half + 44, top - 16);
  lid.lineTo(half - 44, top - 16);
  lid.cubicTo(half - 18, top - 16, half - 2, top - 10, half - 2, top + 10);
  lid.lineTo(half - 2, F.face.v1);
  lid.close();
  const lidTop = make();
  lidTop.moveTo(-half + 8, top + 2);
  lidTop.cubicTo(-half + 10, top - 10, -half + 22, top - 14, -half + 44, top - 14);
  lidTop.lineTo(half - 44, top - 14);
  lidTop.cubicTo(half - 22, top - 14, half - 10, top - 10, half - 8, top + 2);
  lidTop.close();
  // the lower case under the keys, and the moulded end blocks beside the keys
  const body = make();
  body.moveTo(-half, F.body.v0 - 4);
  body.lineTo(half, F.body.v0 - 4);
  body.lineTo(half, F.body.v1 - 16);
  body.quadTo(half, F.body.v1, half - 16, F.body.v1);
  body.lineTo(-half + 16, F.body.v1);
  body.quadTo(-half, F.body.v1, -half, F.body.v1 - 16);
  body.close();
  const ends = make();
  for (const sg of [-1, 1]) {
    const o = sg * half;
    const i = sg * F.keyTops.u1;
    ends.addPath(
      poly([
        [o, F.body.v0],
        [o, F.keyTops.v0 - 4],
        [i + sg * 6, F.keyTops.v0 - 4],
        [i, F.keyTops.v0 + 4],
        [i, F.body.v0],
      ]),
    );
  }
  return (
    <Group>
      <Floor u0={-half - 120} u1={half + 120} />
      <Path path={rr(make(), -half + 40, -12, half - 40, 8, 10)} color="#000" opacity={0.45}>
        <BlurMask blur={16} style="normal" />
      </Path>
      {F.legs.map((u, i) => {
        const sp = i === 0 ? -22 : 22;
        return (
          <Group key={i}>
            <Path path={rr(make(), u + sp - 28, -6, u + sp + 28, 8, 7)} color="#000" opacity={0.6}>
              <BlurMask blur={5} style="normal" />
            </Path>
            <TubeLeg u0={u - Math.sign(sp) * 30} v0={F.body.v1} u1={u - Math.sign(sp) * 30 + sp * 0.5} dim={0.42} />
            <TubeLeg u0={u} v0={F.body.v1} u1={u + sp} />
          </Group>
        );
      })}
      {/* the sustain pedal on its cable up to the case */}
      <Path path={(() => { const p = make(); p.moveTo(pedal.u + 34, -pedal.h + 24); p.cubicTo(pedal.u + 160, -40, pedal.u + 200, F.body.v1 + 60, pedal.u + 210, F.body.v1 + 4); return p; })()} style="stroke" strokeWidth={6} strokeCap="round" color="#08080a" />
      <Path path={(() => { const p = make(); p.moveTo(pedal.u + 34, -pedal.h + 24); p.cubicTo(pedal.u + 160, -40, pedal.u + 200, F.body.v1 + 60, pedal.u + 210, F.body.v1 + 4); return p; })()} style="stroke" strokeWidth={3.6} strokeCap="round" color="#2e3036" />
      <Path path={rr(make(), pedal.u - pedal.w / 2, -12, pedal.u + pedal.w / 2, 0, 4)}>
        <LinearGradient start={vec(0, -12)} end={vec(0, 0)} colors={['#3a3b41', '#16171b', '#08080a']} />
      </Path>
      <Path path={poly([[pedal.u - pedal.w / 2 + 6, -12], [pedal.u + pedal.w / 2 - 6, -12], [pedal.u + pedal.w / 2 - 10, -pedal.h + 8], [pedal.u - pedal.w / 2 + 10, -pedal.h + 8]])}>
        <LinearGradient start={vec(pedal.u - pedal.w / 2, 0)} end={vec(pedal.u + pedal.w / 2, 0)} colors={[...TUBE]} positions={TUBE_POS} />
      </Path>
      <Path path={rr(make(), pedal.u - pedal.w / 2 + 8, -pedal.h, pedal.u + pedal.w / 2 - 8, -pedal.h + 10, 3)} color="#121316" />
      {[-28, -14, 0, 14, 28].map((d) => (
        <Line key={d} p1={vec(pedal.u + d, -pedal.h + 2)} p2={vec(pedal.u + d, -pedal.h + 8)} color="#3a3c44" strokeWidth={1.4} />
      ))}
      {/* the lower case */}
      <Path path={body}>
        <LinearGradient start={vec(-half, F.body.v0)} end={vec(half * 0.5, F.body.v1)} colors={[...KEYS.plastic]} />
      </Path>
      <Line p1={vec(-half + 14, F.body.v1 - 3)} p2={vec(half - 14, F.body.v1 - 3)} color="#000" strokeWidth={3} opacity={0.35} />
      <Path path={body} style="stroke" strokeWidth={1.4} color="#1a0a06" opacity={0.8} />
      {/* the lid: its top, then its front slope with the two grilles */}
      <Path path={lid}>
        <LinearGradient start={vec(-half, top)} end={vec(half * 0.4, F.face.v1)} colors={['#a85a46', '#6e3226', '#3a1810']} />
      </Path>
      <Path path={lidTop}>
        <LinearGradient start={vec(-half, top - 14)} end={vec(half * 0.5, top + 2)} colors={['#d08a70', '#a85a46', '#7a3828']} />
      </Path>
      <Line p1={vec(-half + 44, top - 12)} p2={vec(half - 44, top - 12)} color="#ffffff" strokeWidth={2} opacity={0.22} />
      <Line p1={vec(-half + 10, top + 3)} p2={vec(half - 10, top + 3)} color={KEYS.plasticRim} strokeWidth={1.4} opacity={0.6} />
      {F.grilles.map((g, i) => (
        <Group key={i}>
          {/* the moulded oval: a lit bevel round a recessed grille */}
          <Path path={ellipse(g.u, g.v, g.a + 6, g.b + 5)}>
            <LinearGradient start={vec(g.u - g.a, g.v - g.b)} end={vec(g.u + g.a * 0.5, g.v + g.b)} colors={['#4a1e14', '#7a3a2a', '#c27a62']} />
          </Path>
          <Path path={ellipse(g.u, g.v, g.a, g.b)}>
            <RadialGradient c={vec(g.u - g.a * 0.3, g.v - g.b * 0.4)} r={g.a * 1.3} colors={['#5a2a1e', '#3a1810', '#22100a']} />
          </Path>
          {/* the louvres: dark openings onto the speaker behind, each with a lit lip */}
          <Path path={grilleSlots(g)} color={mount === 'lid' ? '#070404' : '#0d0807'} />
          <Path path={grilleLips(g)} style="stroke" strokeWidth={1.2} color="#c27a62" opacity={0.55} />
          <Path path={ellipse(g.u, g.v, g.a, g.b)} style="stroke" strokeWidth={1.4} color="#1a0a06" opacity={0.85} />
        </Group>
      ))}
      <Path path={lid} style="stroke" strokeWidth={1.4} color="#1a0a06" opacity={0.85} />
      {/* the end blocks; the controls at the bass end */}
      <Path path={ends}>
        <LinearGradient start={vec(-half, F.keyTops.v0)} end={vec(-half + 40, F.body.v0)} colors={['#b8664e', '#7a3828', '#4a1e14']} />
      </Path>
      <Path path={ends} style="stroke" strokeWidth={1.2} color="#1a0a06" opacity={0.8} />
      <Knob u={-half + 22} v={F.keyTops.v0 - 6} r={10} />
      <Knob u={-half + 22} v={F.keyFace.v1 - 4} r={8} />
      {/* the keys, then the slip rail in front of them */}
      <KeysElevation k={F.keys} face1={F.keyFace.v1} />
      <Path path={rr(make(), F.keyFace.u0, F.body.v0 - 4, F.keyFace.u1, F.body.v0 + 1, 1)}>
        <LinearGradient start={vec(0, F.body.v0 - 4)} end={vec(0, F.body.v0 + 1)} colors={['#d08a70', '#7a3828', '#3a1810']} />
      </Path>
      {hi === 'wur.lid' ? hiRect(F.face) : null}
      {hi === 'wur.grille' ? F.grilles.map((g, i) => <Path key={i} path={ellipse(g.u, g.v, g.a + 12, g.b + 11)} style="stroke" strokeWidth={4} color={KEYS.amber} />) : null}
      {hi === 'wur.keys' ? hiRect({ u0: F.keyTops.u0, v0: F.keyTops.v0 - 12, u1: F.keyTops.u1, v1: F.keyFace.v1 }) : null}
      {hi === 'wur.case' ? hiRect(F.body) : null}
      {hi === 'wur.controls' ? hiRect({ u0: -half + 6, v0: F.keyTops.v0 - 20, u1: -half + 40, v1: F.keyFace.v1 + 6 }, 4) : null}
      {hi === 'wur.legs' ? F.legs.map((u) => <Path key={u} path={rr(make(), u - 40 + (u < 0 ? -22 : 0), F.body.v1, u + 40 + (u > 0 ? 22 : 0), 4, 8)} style="stroke" strokeWidth={4} color={KEYS.amber} />) : null}
      {hi === 'wur.pedal' ? hiRect({ u0: pedal.u - pedal.w / 2, v0: -pedal.h, u1: pedal.u + pedal.w / 2, v1: 0 }) : null}
    </Group>
  );
}

export function wurliFrontLabels(): StaticLabel[] {
  const F = WURLI_FRONT;
  return [
    { id: 'g', text: 'TWO OVAL GRILLES · FACING YOU', short: 'GRILLES', u: 0, v: F.face.v0 - 34, align: 'center', tone: 'amber' },
    { id: 'keys', text: 'KEYS', u: 0, v: F.keyFace.v1 + 34, align: 'center', tone: 'muted' },
    { id: 'ctl', text: 'VOLUME · VIBRATO', short: 'CONTROLS', u: -F.half - 6, v: F.face.v0 - 34, align: 'left', tone: 'muted' },
    { id: 'pedal', text: 'SUSTAIN PEDAL', short: 'PEDAL', u: F.pedal.u + 70, v: -36, align: 'left', tone: 'muted' },
  ];
}

/* ── the reed piano CUT (the placement scene's art, and page 1's side view) ── */
type Built = {
  floor: SkPath;
  shell: SkPath;
  shellFill: SkPath;
  interior: SkPath;
  keys: SkPath;
  keyTop: SkPath;
  caseCut: SkPath;
  action: SkPath;
  legs: SkPath;
  pedal: SkPath;
  pedalCable: SkPath;
  spk: { frame: SkPath; cone: SkPath; surround: SkPath; dust: SkPath; magnet: SkPath; bracket: SkPath | null }[];
  slots: SkPath;
  player: SkPath;
  playerLine: SkPath;
  /** The seated player's body masses in the house figure style (round 2,
   *  2026-10-10; it was stick line art): drawn far → near. */
  masses: { path: SkPath; tone: FigureTone; far?: boolean }[];
  bench: SkPath;
  /** The player's head (PlayerFigure skin silhouette) at the origin, and
   *  where it sits (rot: radians, the from-above head's nose to −x). */
  head: SkPath;
  headAt: { x: number; y: number; rot: number };
  /** The action seen through the cut (in shadow). SIDE: one note's parts and
   *  `keyCap` the white key's top; TOP: the rows of reeds, and `keyCap` the
   *  black keys. */
  act: { board: SkPath; parts: SkPath; rails: SkPath; reedBar: SkPath; reed: SkPath; solder: SkPath; comb: SkPath; combMount: SkPath; shank: SkPath; head: SkPath; ampRail: SkPath; keyCap: SkPath } | null;
};
const builtCache = new Map<string, Built>();

/** The oval speaker in section: across `r` (its minor axis in the side cut,
 *  its major axis in the top cut), mapped by `at(d, r)` to (u, v). */
function speakerInSection(at: (d: number, r: number) => [number, number], rCut: number, rSur: number, rDust: number, rFrame: number, dOff: number) {
  const S = OVAL_SECTION;
  const dF = S.dFlange + dOff;
  const dApex = S.dApex + dOff;
  const dEdge = dF - 5 * OV.kDepth;
  const coil = rCut * 0.16;
  const coneD = (r: number) => {
    const t = Math.max(0, Math.min(1, (r - coil) / (rSur - coil)));
    return dApex + (dEdge - dApex) * (t + 0.18 * t * (1 - t));
  };
  const frame = make();
  const cone = make();
  const surround = make();
  const dust = make();
  for (const sg of [-1, 1]) {
    // the frame's flange and its basket strut back to the magnet
    frame.addPath(poly([at(dF, sg * (rCut - 2)), at(dF, sg * rFrame), at(dF - 3, sg * rFrame), at(dF - 3, sg * (rCut - 2))]));
    frame.addPath(poly([at(dF - 3, sg * (rFrame - 4)), at(S.dMagnetFront + dOff, sg * (S.rMagnet + 2)), at(S.dMagnetFront + dOff - 2, sg * S.rMagnet), at(dF - 4, sg * (rFrame - 7))]));
    // the cone (a line) and the surround roll
    const n = 14;
    for (let i = 0; i <= n; i++) {
      const r = coil + ((rSur - coil) * i) / n;
      const [u, v] = at(coneD(r), sg * r);
      if (i === 0) cone.moveTo(u, v);
      else cone.lineTo(u, v);
    }
    const [su, sv] = at(coneD(rSur), sg * rSur);
    surround.moveTo(su, sv);
    const [mu, mv] = at(dEdge + 2.5, sg * (rSur + rCut) * 0.5);
    const [eu, ev] = at(dF, sg * rCut);
    surround.quadTo(mu, mv, eu, ev);
  }
  // the dust cap dome
  const m = 12;
  const dBase = coneD(rDust);
  for (let i = 0; i <= m; i++) {
    const r = -rDust + (2 * rDust * i) / m;
    const [u, v] = at(dBase + 5 * OV.kDepth * Math.sqrt(Math.max(0, 1 - (r / rDust) ** 2)), r);
    if (i === 0) dust.moveTo(u, v);
    else dust.lineTo(u, v);
  }
  const magnet = poly([at(S.dMagnetFront + dOff, -S.rMagnet), at(S.dMagnetFront + dOff, S.rMagnet), at(S.dMagnetBack + dOff, S.rMagnet), at(S.dMagnetBack + dOff, -S.rMagnet)]);
  return { frame, cone, surround, dust, magnet };
}

/** A closed outline through `pts`, each corner listed in `round` rounded by
 *  its radius (a quadratic through the corner) — moulded plastic, not boxes. */
function roundedChain(pts: readonly (readonly [number, number])[], round: Record<number, number>): SkPath {
  const p = make();
  const n = pts.length;
  for (let i = 0; i < n; i++) {
    const [x, y] = pts[i];
    const r = round[i] ?? 0;
    if (!r) {
      if (i === 0) p.moveTo(x, y);
      else p.lineTo(x, y);
      continue;
    }
    const [px, py] = pts[(i - 1 + n) % n];
    const [nx, ny] = pts[(i + 1) % n];
    const lp = Math.hypot(px - x, py - y);
    const ln = Math.hypot(nx - x, ny - y);
    const a: [number, number] = [x + ((px - x) * r) / lp, y + ((py - y) * r) / lp];
    const b: [number, number] = [x + ((nx - x) * r) / ln, y + ((ny - y) * r) / ln];
    if (i === 0) p.moveTo(a[0], a[1]);
    else p.lineTo(a[0], a[1]);
    p.quadTo(x, y, b[0], b[1]);
  }
  p.close();
  return p;
}

function buildWurli(view: ViewId, mount: WurliMount): Built {
  const key = `${view}:${mount}`;
  const hit = builtCache.get(key);
  if (hit) return hit;
  const dOff = mount === 'rail' ? -14 : 0;
  const P = PLAYER;
  let out: Built;
  if (view === 'side') {
    // the lid shell (6 mm), from the face's foot up the slope, over the top, down the back
    const outer: [number, number][] = [
      [W.faceFootX, W.faceFootY],
      [FACE_TOP.x, FACE_TOP.y],
      [W.caseBackX, W.caseTopY],
      [W.caseBackX, W.caseBottomY],
      [W.slipX, W.caseBottomY],
      [W.slipX, W.keyTopY + 6],
      [W.keyFrontX, W.keyTopY + 6],
      [W.keyFrontX, W.keyBottomY],
      [W.faceFootX + 4, W.keyBottomY],
    ];
    const shellFill = poly(outer);
    const t = 7;
    const shell = roundedChain(
      [
        [W.faceFootX, W.faceFootY],
        [FACE_TOP.x, FACE_TOP.y],
        [W.caseBackX, W.caseTopY],
        [W.caseBackX, W.caseBottomY],
        [W.caseBackX + t, W.caseBottomY],
        [W.caseBackX + t, W.caseTopY + t],
        [FACE_TOP.x - t * 0.4 + 2, FACE_TOP.y + t],
        [W.faceFootX - t, W.faceFootY],
      ],
      { 1: 26, 2: 40, 5: 33, 6: 20 },
    );
    const interior = roundedChain(
      [
        [W.faceFootX - t, W.faceFootY],
        [FACE_TOP.x + 2, FACE_TOP.y + t],
        [W.caseBackX + t, W.caseTopY + t],
        [W.caseBackX + t, W.caseBottomY - 14],
        [W.faceFootX - t, W.caseBottomY - 14],
      ],
      { 1: 20, 2: 33 },
    );
    const caseCut = poly([
      [W.caseBackX, W.caseBottomY - 14],
      [W.slipX, W.caseBottomY - 14],
      [W.slipX, W.keyBottomY + 2],
      [W.slipX - 8, W.keyBottomY + 2],
      [W.slipX - 8, W.caseBottomY - 22],
      [W.caseBackX, W.caseBottomY - 22],
    ]);
    // one white key in section: wood ≈ 440 long back to the hammer, the
    // plastic key top (≈ 3 thick, 145 long) with its front lip
    const keys = rr(make(), -440, W.keyTopY, W.keyFrontX, W.keyBottomY, 2);
    const keyTop = rr(make(), W.faceFootX, W.keyTopY, W.keyFrontX - 1, W.keyTopY + 4, 1);
    const keyCap = poly([
      [-145, W.keyTopY - 3],
      [W.keyFrontX + 1.5, W.keyTopY - 3],
      [W.keyFrontX + 1.5, W.keyTopY + 10],
      [W.keyFrontX - 1, W.keyTopY + 10],
      [W.keyFrontX - 1, W.keyTopY],
      [-145, W.keyTopY],
    ]);
    // The action in shadow, behind the amplifier rail (the speakers and the
    // amplifier sit IN FRONT of the action on this model): the reed bar at
    // the back with one steel reed (≈ 60 long here, they vary by note)
    // pointing toward the player, its tip between the teeth of the pickup
    // comb on an insulated mount; the felt hammer under the reed, its shank
    // pivoting on a flange behind; the key's balance and back rails.
    const action = make();
    const rails = make();
    rr(rails, -262, W.keyBottomY, -238, W.caseBottomY - 22, 2); // balance rail
    rr(rails, -446, W.keyBottomY + 3, -422, W.caseBottomY - 22, 2); // back rail (felt on top)
    rr(rails, -475, -780, -462, W.caseBottomY - 22, 2); // the action bracket at the back
    rr(rails, -462, -738, -446, -726, 2); // the hammer rail
    const reedBar = rr(make(), -478, -806, -418, -780, 3);
    const reed = make();
    reed.moveTo(-422, -793);
    reed.lineTo(-352, -793);
    const solder = make();
    solder.addOval(Skia.XYWHRect(-362, -799, 10, 6));
    const comb = rr(make(), -360, -802, -336, -784, 2);
    const combMount = rr(make(), -366, -834, -330, -804, 3);
    // the hammer: flange on the back rail, shank forward and up, felt head under the reed
    const shank = poly([
      [-449, -737],
      [-432, -740],
      [-392, -771],
      [-384, -764],
      [-426, -724],
      [-449, -726],
    ]);
    const headF = rr(make(), -404, -786, -380, -770, 4);
    // the amplifier rail: a board standing just behind the speakers
    const ampRail = rr(make(), -306, -852, -293, -705, 2);
    // its circuit board on stand-offs behind the rail, two electrolytics and
    // a power transistor on its heat sink standing off the board
    const board = rr(make(), -318, -796, -310, -708, 1);
    const parts = make();
    rr(parts, -334, -774, -318, -757, 3);
    rr(parts, -332, -750, -318, -738, 3);
    rr(parts, -338, -731, -318, -712, 1);
    const legs = make();
    for (const x of W.legX) rr(legs, x - 13, W.caseBottomY, x + 13, -4, 6);
    const pedal = poly([[P.pedal.x0, -6], [P.pedal.x1, -6], [P.pedal.x1 - 10, -P.pedal.h], [P.pedal.x0 + 12, -P.pedal.h + 8]]);
    const pedalCable = make();
    pedalCable.moveTo(P.pedal.x0 + 10, -20);
    pedalCable.cubicTo(60, -10, -20, -200, -60, W.caseBottomY + 10);
    // the speaker(s) cut through
    const c = C_BASS;
    const at = (d: number, s: number): [number, number] => {
      const p = onSpeaker(c, d, s, 0);
      return [p.x, p.y];
    };
    const sp = speakerInSection(at, OV.bCone, OV.bSur, OV.bDust, OV.bFrame, dOff);
    const bracket = mount === 'rail' ? poly([at(OVAL_SECTION.dFlange + dOff - 3, OV.bFrame - 6), at(OVAL_SECTION.dFlange + dOff - 3, OV.bFrame + 4), [-293, -846], [-293, -834]]) : null;
    const slots = make();
    for (let k = -3; k <= 3; k++) {
      const s0 = k * 13 - 4;
      const [u0, v0] = at(0.5, s0);
      const [u1, v1] = at(0.5, s0 + 8);
      slots.moveTo(u0, v0);
      slots.lineTo(u1, v1);
    }
    // the seated player: minimal line art (ILLUSTRATIVE); the head is the
    // figure's own skin silhouette in profile, facing the keys (−x) — head
    // fix 2026-10-08: a head ON A BODY is PlayerFigure's FigureHead, never a
    // circle and never the line-art icon.
    const player = make();
    const head = headProfile(pt(0, 0), P.head.r, P.head.r * 1.45, -1).fill;
    const playerLine = make();
    playerLine.moveTo(P.head.x + 6, P.head.y + P.head.r * 0.92);
    playerLine.lineTo(P.shoulder.x, P.shoulder.y);
    playerLine.lineTo(P.hip.x + 10, P.hip.y);
    playerLine.moveTo(P.shoulder.x - 6, P.shoulder.y + 20);
    playerLine.lineTo(P.elbow.x, P.elbow.y);
    playerLine.lineTo(P.hand.x, P.hand.y);
    playerLine.moveTo(P.hip.x, P.hip.y);
    playerLine.lineTo(P.knee.x, P.knee.y);
    playerLine.lineTo(P.foot.x, P.foot.y);
    playerLine.lineTo(P.foot.x + 90, P.foot.y + 10);
    // The body at true scale from the same pose points (chest ≈ 250 deep,
    // upper arm ≈ 300, forearm ≈ 260 to the keys, thigh ≈ 440, shin ≈ 480,
    // a shoe ≈ 270 on the pedal): far arm first, then the torso, the near
    // leg and the near arm.
    const S = (x: number, y: number) => pt(x, y);
    const masses: Built['masses'] = [
      { path: limb([S(P.shoulder.x - 10, P.shoulder.y + 25), S(P.elbow.x + 10, P.elbow.y - 10), S(P.hand.x + 30, P.hand.y - 15)], [46, 38, 30]), tone: 'shirt', far: true },
      { path: limb([S(P.hip.x + 10, P.hip.y), S(P.knee.x, P.knee.y), S(P.foot.x + 20, P.foot.y - 20)], [80, 58, 44]), tone: 'trousers', far: true },
      { path: limb([S(P.head.x + 5, P.head.y + 60), S(P.shoulder.x + 5, P.shoulder.y - 20)], [36, 44]), tone: 'skin' },
      { path: limb([S(P.shoulder.x + 5, P.shoulder.y + 10), S(P.hip.x + 15, P.hip.y - 10)], [118, 112]), tone: 'shirt' },
      { path: limb([S(P.hip.x, P.hip.y + 5), S(P.knee.x, P.knee.y), S(P.foot.x, P.foot.y - 25)], [84, 60, 46]), tone: 'trousers' },
      { path: limb([S(P.foot.x + 95, P.foot.y - 30), S(P.foot.x - 120, -78)], [42, 30]), tone: 'shoe' },
      { path: limb([S(P.shoulder.x - 15, P.shoulder.y + 35), S(P.elbow.x, P.elbow.y), S(P.hand.x + 20, P.hand.y - 5)], [50, 40, 32]), tone: 'shirt' },
      { path: limb([S(P.hand.x + 20, P.hand.y - 5), S(P.hand.x - 70, P.hand.y + 12)], [30, 22]), tone: 'skin' },
    ];
    const bench = make();
    rr(bench, 470, -500, 800, -470, 6);
    rr(bench, 490, -470, 510, -4, 3);
    rr(bench, 760, -470, 780, -4, 3);
    out = { floor: rr(make(), -1500, 0, 900, 40, 0), shell, shellFill, interior, keys, keyTop, caseCut, action, legs, pedal, pedalCable, spk: [{ ...sp, bracket }], slots, player, playerLine, masses, bench, head, headAt: { x: P.head.x, y: P.head.y, rot: 0 }, act: { board, parts, rails, reedBar, reed, solder, comb, combMount, shank, head: headF, ampRail, keyCap } };
  } else {
    // TOP: cut at the speakers' height (y = C_BASS.y): the lid's front panel
    // and back, the ends; both speakers cut along their long axis; the keys
    // below the cut; the seated player from above.
    const t = 7;
    const fx = C_BASS.x;
    const shellFill = rr(make(), W.caseBackX, -W.halfW, fx, W.halfW, 10);
    const shell = make();
    rr(shell, fx - t, -W.halfW, fx, W.halfW, 2);
    rr(shell, W.caseBackX, -W.halfW, W.caseBackX + t, W.halfW, 2);
    rr(shell, W.caseBackX, -W.halfW, fx, -W.halfW + t, 2);
    rr(shell, W.caseBackX, W.halfW - t, fx, W.halfW, 2);
    const interior = rr(make(), W.caseBackX + t, -W.halfW + t, fx - t, W.halfW - t, 4);
    const keys = rr(make(), W.faceFootX, -W.halfW + 40, W.keyFrontX, W.halfW - 40, 2);
    const keyTop = make();
    const n = 38;
    const kw = (2 * (W.halfW - 40)) / n;
    for (let i = 1; i < n; i++) {
      keyTop.moveTo(W.faceFootX, -W.halfW + 40 + i * kw);
      keyTop.lineTo(W.keyFrontX, -W.halfW + 40 + i * kw);
    }
    // the black keys at the back of the visible keys (A at the bass end: a
    // black key follows C, D, F, G and A), 0.62 of the 150 visible
    const blacksTop = make();
    for (let i = 0; i < n - 1; i++) {
      if (![0, 1, 3, 4, 5].includes((i + 5) % 7)) continue;
      const z = -W.halfW + 40 + (i + 1) * kw;
      rr(blacksTop, W.faceFootX, z - kw * 0.29, W.faceFootX + 150 * 0.62, z + kw * 0.29, 1.5);
    }
    // the action below the cut, seen from above: the reed bar along the
    // keyboard, 64 reeds pointing toward the player with their tuning solder,
    // the pickup comb across their tips, the amplifier rail and its board
    const action = make();
    const pitch = (2 * (W.halfW - 40)) / 64;
    const reedT = make();
    const solderT = make();
    for (let i = 0; i < 64; i++) {
      const z = -W.halfW + 40 + (i + 0.5) * pitch;
      reedT.moveTo(-420, z);
      reedT.lineTo(-352, z);
      solderT.addOval(Skia.XYWHRect(-361, z - 2.4, 9, 4.8));
    }
    const actTop = {
      board: rr(make(), -318, -300, -310, 300, 1),
      parts: make(),
      rails: make(),
      reedBar: rr(make(), -478, -W.halfW + 34, -418, W.halfW - 34, 3),
      reed: reedT,
      solder: solderT,
      comb: rr(make(), -360, -W.halfW + 36, -336, W.halfW - 36, 2),
      combMount: make(),
      shank: make(),
      head: make(),
      ampRail: rr(make(), -306, -W.halfW + 30, -293, W.halfW - 30, 2),
      keyCap: blacksTop,
    };
    const caseCut = rr(make(), W.caseBackX, -W.halfW - 2, W.slipX, W.halfW + 2, 12);
    const legs = make();
    const pedal = rr(make(), P.pedal.x0, P.pedal.z0, P.pedal.x1, P.pedal.z1, 10);
    const pedalCable = make();
    pedalCable.moveTo(P.pedal.x0, (P.pedal.z0 + P.pedal.z1) / 2);
    pedalCable.cubicTo(80, 120, 40, 260, W.slipX, 300);
    const spk = [C_BASS, C_TREBLE].map((c) => {
      const at = (d: number, s: number): [number, number] => {
        const p = onSpeaker(c, d, 0, s);
        return [p.x, p.z];
      };
      return { ...speakerInSection(at, OV.aCone, OV.aSur, OV.aDust, OV.aFrame, dOff), bracket: null };
    });
    const slots = make();
    for (const c of [C_BASS, C_TREBLE])
      for (let k = -5; k <= 5; k++) {
        slots.moveTo(fx + 1, c.z + k * 16 - 5);
        slots.lineTo(fx + 1, c.z + k * 16 + 5);
      }
    const player = make();
    player.addOval(Skia.XYWHRect(P.shoulder.x - 110, -230, 220, 460));
    // the head from above (the figure's own, nose turned to the keys, −x)
    const head = headAbove(pt(0, 0), P.head.r * 0.95).fill;
    const playerLine = make();
    for (const sg of [-1, 1]) {
      playerLine.moveTo(P.shoulder.x - 40, sg * 200);
      playerLine.lineTo(P.elbow.x, sg * P.elbow.z);
      playerLine.lineTo(P.hand.x, sg * P.hand.z);
      playerLine.moveTo(P.hip.x - 30, sg * 120);
      playerLine.lineTo(P.knee.x, sg * P.knee.z);
    }
    // From above: the shoulders (≈ 450 × 220), the arms to the keys, the
    // hands, the thighs under them, in the house figure style.
    const T = (x: number, z: number) => pt(x, z);
    const masses: Built['masses'] = [
      ...[-1, 1].map((sg) => ({ path: limb([T(P.hip.x - 30, sg * 110), T(P.knee.x, sg * P.knee.z)], [82, 62]), tone: 'trousers' as FigureTone })),
      { path: limb([T(P.shoulder.x, -118), T(P.shoulder.x, 118)], [108, 108]), tone: 'shirt' },
      ...[-1, 1].map((sg) => ({ path: limb([T(P.shoulder.x - 10, sg * 180), T(P.elbow.x, sg * P.elbow.z), T(P.hand.x + 20, sg * P.hand.z)], [50, 40, 32]), tone: 'shirt' as FigureTone })),
      ...[-1, 1].map((sg) => ({ path: limb([T(P.hand.x + 20, sg * P.hand.z), T(P.hand.x - 70, sg * (P.hand.z - 10))], [30, 22]), tone: 'skin' as FigureTone })),
    ];
    const bench = rr(make(), 470, -380, 800, 380, 14);
    out = { floor: make(), shell, shellFill, interior, keys, keyTop, caseCut, action, legs, pedal, pedalCable, spk, slots, player, playerLine, masses, bench, head, headAt: { x: P.head.x + 10, y: 0, rot: Math.PI / 2 }, act: actTop };
  }
  builtCache.set(key, out);
  return out;
}

export function WurliSection({ view, mount = 'lid', showPlayer = true, hi }: { view: ViewId; mount?: WurliMount; showPlayer?: boolean; hi?: string | null }) {
  const g = buildWurli(view, mount);
  const side = view === 'side';
  return (
    <Group>
      {side ? (
        <>
          <Path path={g.floor}>
            <LinearGradient start={vec(0, 0)} end={vec(0, 40)} colors={[...KEYS.floor]} />
          </Path>
          <Line p1={vec(-1500, 0)} p2={vec(900, 0)} color="#4a4c58" strokeWidth={2.5} />
        </>
      ) : null}
      {/* behind the cut: the legs (side), the floor shadow */}
      {side ? W.legX.map((x) => <TubeLeg key={x} u0={x} v0={W.caseBottomY} u1={x} dim={0.8} />) : null}
      {showPlayer ? (
        <Group>
          <Path path={g.bench} color="#2a2b31" opacity={0.85} />
          {/* The seated player in the house figure style (round 2: was stick line art). */}
          {g.masses.map((m, i) => (
            <FigureMass key={i} path={m.path} tone={m.tone} far={m.far} contour={4} />
          ))}
          <Group transform={[{ translateX: g.headAt.x }, { translateY: g.headAt.y }, { rotate: g.headAt.rot }]}>
            <FigureHead fill={g.head} />
          </Group>
        </Group>
      ) : null}
      <Path path={g.pedalCable} style="stroke" strokeWidth={4} color="#202126" />
      <Path path={g.pedal}>
        <LinearGradient start={vec(0, -60)} end={vec(0, 0)} colors={[...KEYS.chrome]} />
      </Path>
      {/* the case: a dim inside seen through the cut, the moulded shell */}
      <Path path={g.shellFill} color="#000" opacity={0.55}>
        <BlurMask blur={side ? 8 : 14} style="normal" />
      </Path>
      <Path path={g.interior}>
        <LinearGradient start={vec(0, side ? W.caseTopY : -W.halfW)} end={vec(0, side ? W.caseBottomY : W.halfW)} colors={[...KEYS.interior]} />
      </Path>
      <Path path={g.action} color="#3a332c" opacity={0.75} />
      {g.act ? (
        <Group opacity={0.8}>
          <Path path={g.act.rails}>
            <LinearGradient start={vec(-480, -760)} end={vec(-230, -660)} colors={[...SPK.ply.slice(1, 4)]} />
          </Path>
          <Path path={g.act.board} color="#1d3b2a" />
          <Path path={g.act.parts}>
            <LinearGradient start={vec(-338, 0)} end={vec(-318, 0)} colors={['#5a7fb8', '#2e4f86', '#16294a']} />
          </Path>
          <Path path={g.act.ampRail}>
            <LinearGradient start={vec(-306, 0)} end={vec(-293, 0)} colors={[...SPK.ply.slice(1, 4)]} />
          </Path>
          <Path path={g.act.reedBar}>
            <LinearGradient start={vec(-478, -806)} end={vec(-418, -780)} colors={[...SPK.steel]} />
          </Path>
          {side ? <Circle cx={-436} cy={-809} r={4} color="#c8ccd4" /> : null}
          <Path path={g.act.reed} style="stroke" strokeWidth={side ? 2.4 : 3.6} strokeCap="round" color="#c9ced7" />
          <Path path={g.act.solder} color="#b7b2a6" />
          <Path path={g.act.combMount}>
            <LinearGradient start={vec(0, -834)} end={vec(0, -804)} colors={['#6e4a2c', '#4a2f1a', '#24160b']} />
          </Path>
          <Path path={g.act.comb} color="rgba(200,204,212,0.3)" />
          <Path path={g.act.comb} style="stroke" strokeWidth={1.2} color="#c8ccd4" opacity={0.8} />
          <Path path={g.act.shank}>
            <LinearGradient start={vec(-440, -730)} end={vec(-384, -770)} colors={['#c79a5e', '#8e5f2c', '#4e3014']} />
          </Path>
          <Path path={g.act.head}>
            <LinearGradient start={vec(0, -786)} end={vec(0, -770)} colors={['#f2ede2', '#cfc6b4', '#8f8676']} />
          </Path>
        </Group>
      ) : null}
      {!side ? <Path path={g.caseCut} style="stroke" strokeWidth={3} color={KEYS.plasticRim} opacity={0.35} /> : null}
      {side ? (
        <Path path={g.caseCut}>
          <LinearGradient start={vec(0, W.caseBottomY - 22)} end={vec(0, W.caseBottomY)} colors={[...KEYS.plastic]} />
        </Path>
      ) : null}
      {/* the speaker(s) in section */}
      {g.spk.map((s, i) => (
        <Group key={i}>
          {s.bracket ? <Path path={s.bracket} color="#6a6f7a" /> : null}
          <Path path={s.magnet}>
            <LinearGradient start={vec(-260, -830)} end={vec(-200, -760)} colors={[...SPK.magnet]} />
          </Path>
          <Path path={s.magnet} style="stroke" strokeWidth={3.2} strokeJoin="round" color="#8a909b" />
          <Path path={s.frame}>
            <LinearGradient start={vec(-240, -850)} end={vec(-180, -750)} colors={[...SPK.steel]} />
          </Path>
          <Path path={s.cone} style="stroke" strokeWidth={3.2} strokeJoin="round" color="#3b322b" />
          <Path path={s.cone} style="stroke" strokeWidth={1} color="#8a7a6a" opacity={0.5} />
          <Path path={s.surround} style="stroke" strokeWidth={2.2} color="#2a241f" />
          <Path path={s.dust} style="stroke" strokeWidth={2.4} color="#5b524a" />
        </Group>
      ))}
      {/* the keys */}
      {side && g.act ? (
        <>
          <Path path={g.keys}>
            <LinearGradient start={vec(0, W.keyTopY)} end={vec(0, W.keyBottomY)} colors={['#e2b57a', '#b07a42', '#6e431f']} />
          </Path>
          <Path path={g.keys} style="stroke" strokeWidth={1} color="#2b170a" opacity={0.7} />
          <Path path={g.act.keyCap}>
            <LinearGradient start={vec(0, W.keyTopY - 3)} end={vec(0, W.keyTopY + 10)} colors={[...KEYS.ivory]} />
          </Path>
          <Path path={g.act.keyCap} style="stroke" strokeWidth={0.8} color="#7d796f" opacity={0.8} />
        </>
      ) : (
        <>
          <Path path={g.keys}>
            <LinearGradient start={vec(W.faceFootX, 0)} end={vec(W.keyFrontX, 0)} colors={['#c4c0b5', '#ebe8df', '#fdfcf8']} />
          </Path>
          <Path path={g.keyTop} style="stroke" strokeWidth={1.4} color="#7d796f" opacity={0.85} />
          {g.act ? (
            <>
              <Path path={g.act.keyCap}>
                <LinearGradient start={vec(W.faceFootX, 0)} end={vec(W.faceFootX + 93, 0)} colors={[...KEYS.ebony]} />
              </Path>
              <Path path={g.act.keyCap} style="stroke" strokeWidth={0.8} color="#4a4c54" opacity={0.8} />
            </>
          ) : null}
        </>
      )}
      {/* the lid shell (cut face) and its grille slots */}
      <Path path={g.shell}>
        <LinearGradient start={vec(W.caseBackX, W.caseTopY)} end={vec(W.faceFootX, W.faceFootY)} colors={[...KEYS.plastic]} />
      </Path>
      <Path path={g.shell} style="stroke" strokeWidth={1.4} color={SPK.ink} opacity={0.85} />
      <Path path={g.slots} style="stroke" strokeWidth={3.4} strokeCap="round" color="#0b0806" />
      {hi === 'wur.lid' ? <Path path={g.shell} style="stroke" strokeWidth={6} color={KEYS.amber} /> : null}
      {hi === 'wur.cone' || hi === 'wur.grille' ? g.spk.slice(0, 1).map((s, i) => <Path key={i} path={s.cone} style="stroke" strokeWidth={7} color={KEYS.amber} />) : null}
    </Group>
  );
}

export function wurliSectionLabels(view: ViewId): StaticLabel[] {
  if (view === 'side') {
    return [
      { id: 'lid', text: 'LID', u: (W.caseBackX + FACE_TOP.x) / 2, v: W.caseTopY - 26, align: 'center', tone: 'muted' },
      { id: 'grille', text: 'GRILLE · OVAL SPEAKER', short: 'SPEAKER', u: FACE_TOP.x - 18, v: FACE_TOP.y - 60, align: 'right' },
      { id: 'keys', text: 'KEYS', u: -60, v: W.keyBottomY + 30, align: 'center', tone: 'muted' },
      { id: 'player', text: 'THE PLAYER', short: 'PLAYER', u: PLAYER.head.x, v: PLAYER.head.y - PLAYER.head.r - 30, align: 'center', tone: 'illustrative' },
      { id: 'pedal', text: 'PEDAL', u: (PLAYER.pedal.x0 + PLAYER.pedal.x1) / 2, v: -90, align: 'center', tone: 'muted' },
      { id: 'audience', text: '← AUDIENCE SIDE', short: '← AUDIENCE', u: -1400, v: -60, align: 'left', tone: 'illustrative' },
    ];
  }
  return [
    { id: 'bass', text: 'BASS-SIDE SPEAKER', short: 'BASS SPK', u: C_BASS.x - 20, v: C_BASS.z - OV.aFrame - 30, align: 'right' },
    { id: 'treble', text: 'OTHER SPEAKER', short: 'OTHER', u: C_TREBLE.x - 20, v: C_TREBLE.z + OV.aFrame + 34, align: 'right', tone: 'muted' },
    { id: 'keys', text: 'KEYS', u: -75, v: W.halfW + 30, align: 'center', tone: 'muted' },
    { id: 'player', text: 'THE PLAYER', short: 'PLAYER', u: PLAYER.shoulder.x, v: -300, align: 'center', tone: 'illustrative' },
  ];
}

/** The part under (u, v) in a reed-piano SECTION view; `tol` in mm. */
export function wurliHitTest(view: ViewId, u: number, v: number, tol: number): string | null {
  if (view === 'side') {
    const c = C_BASS;
    const du = u - c.x;
    const dv = v - c.y;
    const d = du * W.n.x + dv * W.n.y;
    const s = du * W.up.x + dv * W.up.y;
    if (Math.abs(s) <= OV.bFrame + tol && d <= 4 + tol && d >= OVAL_SECTION.dMagnetBack - tol) return d > OVAL_SECTION.dFlange ? 'wur.grille' : 'wur.cone';
    if (u >= W.faceFootX - 30 && u <= W.keyFrontX + tol && v >= W.keyTopY - tol && v <= W.keyBottomY + tol) return 'wur.keys';
    if (u >= W.caseBackX - tol && u <= W.faceFootX + tol && v >= W.caseTopY - tol && v <= W.faceFootY + tol) return 'wur.lid';
    if (u >= W.caseBackX - tol && u <= W.slipX + tol && v >= W.keyBottomY && v <= W.caseBottomY + tol) return 'wur.case';
    return null;
  }
  for (const c of [C_BASS, C_TREBLE]) if (Math.abs(v - c.z) <= OV.aFrame + tol && u <= c.x + tol && u >= c.x + OVAL_SECTION.dMagnetBack - tol) return 'wur.cone';
  if (u >= W.faceFootX - tol && u <= W.keyFrontX + tol && Math.abs(v) <= W.halfW - 40 + tol) return 'wur.keys';
  if (u >= W.caseBackX - tol && u <= C_BASS.x + tol && Math.abs(v) <= W.halfW + tol) return 'wur.lid';
  return null;
}

let lessonArt: LessonArt | null = null;
/** The reed piano's LessonArt for the engine's placement scene. */
export function wurliLessonArt(): LessonArt {
  if (lessonArt) return lessonArt;
  lessonArt = {
    Instrument: ({ view }: { view: ViewId }) => <WurliSection view={view} />,
    labels: (view) => wurliSectionLabels(view).map((l) => ({ id: l.id, text: l.text, short: l.short, u: l.u, v: l.v, align: l.align, tone: l.tone === 'illustrative' ? 'illustrative' : 'muted' })),
    hitTest: (view, _variant, u, v, tol) => wurliHitTest(view, u, v, tol),
  };
  return lessonArt;
}

/* ═══════════════ one oval speaker face-on ═══════════════ */
export type OvalSpot = 'centre' | 'off' | 'out';
/** Face-on (u = along the long axis, v = across), the outward end at −u. */
export function OvalFace({ spot, hi }: { spot?: OvalSpot | null; hi?: string | null }) {
  const holes = [
    [-OV.aFrame * 0.8, -OV.bFrame * 0.62],
    [OV.aFrame * 0.8, -OV.bFrame * 0.62],
    [-OV.aFrame * 0.8, OV.bFrame * 0.62],
    [OV.aFrame * 0.8, OV.bFrame * 0.62],
  ];
  const su = spot === 'centre' ? 0 : spot === 'off' ? -OVAL_SPOTS.off : spot === 'out' ? -OVAL_SPOTS.out : null;
  const k = OV.kMinor;
  return (
    <Group>
      <Path path={ellipse(4, 6, OV.aFrame + 6, OV.bFrame + 6)} color="#000" opacity={0.5}>
        <BlurMask blur={8} style="normal" />
      </Path>
      <Path path={ellipse(0, 0, OV.aFrame, OV.bFrame)}>
        <RadialGradient c={vec(-OV.aFrame * 0.4, -OV.bFrame * 0.5)} r={OV.aFrame * 1.5} colors={[...SPK.steel]} />
      </Path>
      {holes.map(([u, v], i) => (
        <Group key={i}>
          <Circle cx={u} cy={v} r={5.5} color="#0d0e11" />
          <Circle cx={u} cy={v} r={3} color="#9aa0ab" />
        </Group>
      ))}
      <Path path={ellipse(0, 0, OV.aCone, OV.bCone)}>
        <RadialGradient c={vec(-OV.aCone * 0.3, -OV.bCone * 0.4)} r={OV.aCone * 1.4} colors={['#4f4740', '#2a241f', '#14110e']} />
      </Path>
      <Path path={ellipse(0, 0, (OV.aSur + OV.aCone) / 2, (OV.bSur + OV.bCone) / 2)} style="stroke" strokeWidth={(OV.bCone - OV.bSur) * 0.3} color="#1c1815" />
      <Path path={ellipse(0, 0, OV.aSur, OV.bSur)}>
        <RadialGradient c={vec(-OV.aSur * 0.35, -OV.bSur * 0.45)} r={OV.aSur * 1.3} colors={[...SPK.cone]} />
      </Path>
      <Path path={ellipse(0, 0, OV.aSur, OV.bSur)} style="stroke" strokeWidth={1.4 * k * 2} color="#5a5048" />
      <Path path={ellipse(0, 0, OV.aSur * 0.75, OV.bSur * 0.75)} style="stroke" strokeWidth={1} color="#5c5249" opacity={0.5} />
      <Path path={ellipse(0, 0, OV.aDust, OV.bDust)}>
        <RadialGradient c={vec(-OV.aDust * 0.4, -OV.bDust * 0.45)} r={OV.aDust * 1.3} colors={['#7a6f64', '#3b342e', '#1d1916']} />
      </Path>
      <Path path={ellipse(-OV.aDust * 0.3, -OV.bDust * 0.35, OV.aDust * 0.3, OV.bDust * 0.3)} color="#ffffff" opacity={0.08} />
      {su != null ? (
        <Group>
          <Circle cx={su} cy={0} r={13} style="stroke" strokeWidth={4} color="#6fa8ff" />
          <Circle cx={su} cy={0} r={4} color="#6fa8ff" />
        </Group>
      ) : null}
      {hi === 'wur.dust' ? <Path path={ellipse(0, 0, OV.aDust + 5, OV.bDust + 5)} style="stroke" strokeWidth={3.5} color={KEYS.amber} /> : null}
      {hi === 'wur.cone' ? <Path path={ellipse(0, 0, OV.aSur + 4, OV.bSur + 4)} style="stroke" strokeWidth={3.5} color={KEYS.amber} /> : null}
      {hi === 'wur.frame' ? <Path path={ellipse(0, 0, OV.aFrame + 5, OV.bFrame + 5)} style="stroke" strokeWidth={3.5} color={KEYS.amber} /> : null}
      <Line p1={vec(-OV.aFrame - 30, 0)} p2={vec(OV.aFrame + 30, 0)} color="#8a8f9c" strokeWidth={1} opacity={0.5}>
        <DashPathEffect intervals={[8, 6]} />
      </Line>
    </Group>
  );
}

export function ovalLabels(): StaticLabel[] {
  return [
    { id: 'dust', text: 'DUST CAP', u: 0, v: OV.bFrame + 22, align: 'center', tone: 'amber' },
    { id: 'cone', text: 'OVAL CONE · 4 × 8 in', short: 'CONE', u: 0, v: -OV.bFrame - 24, align: 'center' },
    { id: 'out', text: '← OUTER END', short: '← OUT', u: -OV.aFrame - 8, v: OV.bFrame + 22, align: 'left', tone: 'muted' },
    { id: 'in', text: 'TOWARD THE MIDDLE →', short: 'MIDDLE →', u: OV.aFrame + 8, v: OV.bFrame + 22, align: 'right', tone: 'muted' },
  ];
}

export function ovalHit(u: number, v: number, tol: number): string | null {
  const e = (a: number, b: number) => (u / (a + tol)) ** 2 + (v / (b + tol)) ** 2 <= 1;
  if (e(OV.aDust, OV.bDust)) return 'wur.dust';
  if (e(OV.aSur, OV.bSur)) return 'wur.cone';
  if (e(OV.aFrame, OV.bFrame)) return 'wur.frame';
  return null;
}
