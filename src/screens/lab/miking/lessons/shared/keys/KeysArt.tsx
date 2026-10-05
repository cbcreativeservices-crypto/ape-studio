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

/** A chrome leg from (u, v0) to the floor, a little splayed. */
function Leg({ u, v0, splay }: { u: number; v0: number; splay: number }) {
  const p = poly([
    [u - 13, v0],
    [u + 13, v0],
    [u + splay + 11, -4],
    [u + splay - 11, -4],
  ]);
  return (
    <Group>
      <Path path={p}>
        <LinearGradient start={vec(u - 13, 0)} end={vec(u + 13, 0)} colors={[...KEYS.chrome]} />
      </Path>
      <Path path={rr(make(), u + splay - 18, -10, u + splay + 18, 0, 4)} color="#16171b" />
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

function Knob({ u, v, r }: { u: number; v: number; r: number }) {
  return (
    <Group>
      <Circle cx={u + 1.5} cy={v + 2} r={r} color="#000" opacity={0.45} />
      <Circle cx={u} cy={v} r={r}>
        <RadialGradient c={vec(u - r * 0.35, v - r * 0.4)} r={r * 1.5} colors={['#f2f4f8', '#9aa0ab', '#3a3d45']} />
      </Circle>
      <Line p1={vec(u, v)} p2={vec(u - r * 0.45, v - r * 0.8)} color="#16171b" strokeWidth={1.6} />
    </Group>
  );
}

function Jack({ u, v }: { u: number; v: number }) {
  return (
    <Group>
      <Circle cx={u} cy={v} r={9}>
        <RadialGradient c={vec(u - 3, v - 3)} r={12} colors={[...KEYS.chrome]} />
      </Circle>
      <Circle cx={u} cy={v} r={4.2} color="#030304" />
    </Group>
  );
}

const hiRect = (q: Rect, pad = 8) => <Path path={rr(make(), q.u0 - pad, q.v0 - pad, q.u1 + pad, q.v1 + pad, 8)} style="stroke" strokeWidth={4} color={KEYS.amber} />;

/* ═══════════════ the tine piano ═══════════════ */
export function RhodesFrontArt({ hi }: { hi?: string | null }) {
  const F = RHODES_FRONT;
  const half = F.half;
  const body = rr(make(), -half, F.top, half, F.bottom, 22);
  const lid = R(F.lid, 14);
  const rail = R(F.nameRail, 2);
  const slip = R(F.slip, 2);
  const cheekL = rr(make(), -half, F.top + 6, -half + F.cheek, F.bottom, 18);
  const cheekR = rr(make(), half - F.cheek, F.top + 6, half, F.bottom, 18);
  const tops = make();
  const n = 36;
  const kw = (F.keyTops.u1 - F.keyTops.u0) / n;
  for (let i = 0; i < n; i++) rr(tops, F.keyTops.u0 + i * kw + 0.5, F.keyTops.v0, F.keyTops.u0 + (i + 1) * kw - 0.5, F.keyTops.v1, 1);
  const faces = make();
  for (let i = 0; i < n; i++) rr(faces, F.keyFace.u0 + i * kw + 0.6, F.keyFace.v0 + 1, F.keyFace.u0 + (i + 1) * kw - 0.6, F.keyFace.v1, 1.2);
  const blacks = make();
  const pat = [true, true, false, true, true, true, false];
  for (let i = 0; i < n - 1; i++) if (pat[i % 7]) rr(blacks, F.keyTops.u0 + (i + 1) * kw - kw * 0.3, F.keyTops.v0 - 4, F.keyTops.u0 + (i + 1) * kw + kw * 0.3, F.keyTops.v0 + 12, 1.4);
  const pedal = F.pedal;
  return (
    <Group>
      <Floor u0={-half - 120} u1={half + 120} />
      {/* shadow under the instrument */}
      <Path path={rr(make(), -half + 40, -14, half - 40, 6, 10)} color="#000" opacity={0.55}>
        <BlurMask blur={14} style="normal" />
      </Path>
      {F.legs.map((u, i) => (
        <Leg key={i} u={u} v0={F.bottom} splay={i === 0 ? -26 : 26} />
      ))}
      {/* the sustain pedal and its rod up to the case */}
      <Path path={rr(make(), pedal.u - 3, F.bottom, pedal.u + 3, -pedal.h + 6, 2)}>
        <LinearGradient start={vec(pedal.u - 3, 0)} end={vec(pedal.u + 3, 0)} colors={[...KEYS.chrome]} />
      </Path>
      <Path path={poly([[pedal.u - pedal.w / 2, -8], [pedal.u + pedal.w / 2, -8], [pedal.u + pedal.w / 2 - 10, -pedal.h], [pedal.u - pedal.w / 2 + 10, -pedal.h]])}>
        <LinearGradient start={vec(0, -pedal.h)} end={vec(0, 0)} colors={[...KEYS.chrome]} />
      </Path>
      <Path path={rr(make(), pedal.u - pedal.w / 2 + 14, -pedal.h + 6, pedal.u + pedal.w / 2 - 14, -pedal.h + 16, 3)} color="#1a1b1f" />
      {/* the case: covered sides, the harp cover over the action */}
      <Path path={body}>
        <LinearGradient start={vec(-half, F.top)} end={vec(half, F.bottom)} colors={[...KEYS.tolex]} />
      </Path>
      <Path path={lid}>
        <LinearGradient start={vec(0, F.lid.v0)} end={vec(0, F.lid.v1)} colors={['#4a4c54', '#25272c', '#121316']} />
      </Path>
      <Path path={rr(make(), F.lid.u0 + 30, F.lid.v0 + 6, F.lid.u1 - 30, F.lid.v0 + 16, 5)} color="#ffffff" opacity={0.08} />
      <Path path={cheekL}>
        <LinearGradient start={vec(-half, 0)} end={vec(-half + F.cheek, 0)} colors={['#3a3b41', '#1d1e22', '#0f1012']} />
      </Path>
      <Path path={cheekR}>
        <LinearGradient start={vec(half - F.cheek, 0)} end={vec(half, 0)} colors={['#2a2b30', '#16171b', '#0b0b0d']} />
      </Path>
      {/* the name rail: the controls and the output jack at the left */}
      <Path path={rail}>
        <LinearGradient start={vec(0, F.nameRail.v0)} end={vec(0, F.nameRail.v1)} colors={[...KEYS.nameRail]} />
      </Path>
      {F.knobs.map((u) => (
        <Knob key={u} u={u} v={(F.nameRail.v0 + F.nameRail.v1) / 2} r={12} />
      ))}
      <Jack u={F.jack} v={(F.nameRail.v0 + F.nameRail.v1) / 2} />
      {/* the keys: tops (seen a little from above), black keys, front faces */}
      <Path path={tops}>
        <LinearGradient start={vec(0, F.keyTops.v0)} end={vec(0, F.keyTops.v1)} colors={[...KEYS.ivory]} />
      </Path>
      <Path path={blacks}>
        <LinearGradient start={vec(0, F.keyTops.v0)} end={vec(0, F.keyTops.v0 + 12)} colors={[...KEYS.ebony]} />
      </Path>
      <Path path={faces}>
        <LinearGradient start={vec(0, F.keyFace.v0)} end={vec(0, F.keyFace.v1)} colors={['#e9e6dd', '#c9c5ba', '#9f9b91']} />
      </Path>
      <Path path={slip}>
        <LinearGradient start={vec(0, F.slip.v0)} end={vec(0, F.slip.v1)} colors={['#3a3b41', '#1d1e22', '#0f1012']} />
      </Path>
      <Path path={rr(make(), F.slip.u0, F.slip.v0, F.slip.u1, F.slip.v0 + 5, 1)}>
        <LinearGradient start={vec(0, F.slip.v0)} end={vec(0, F.slip.v0 + 5)} colors={[...KEYS.chrome]} />
      </Path>
      <Path path={body} style="stroke" strokeWidth={1.4} color="#5a5c64" opacity={0.7} />
      {hi === 'rh.harp' ? hiRect(F.lid) : null}
      {hi === 'rh.keys' ? hiRect({ u0: F.keyTops.u0, v0: F.keyTops.v0 - 4, u1: F.keyTops.u1, v1: F.keyFace.v1 }) : null}
      {hi === 'rh.controls' ? hiRect({ u0: F.knobs[0] - 16, v0: F.nameRail.v0, u1: F.knobs[1] + 16, v1: F.nameRail.v1 }, 6) : null}
      {hi === 'rh.jack' ? <Circle cx={F.jack} cy={(F.nameRail.v0 + F.nameRail.v1) / 2} r={20} style="stroke" strokeWidth={4} color={KEYS.amber} /> : null}
      {hi === 'rh.legs' ? F.legs.map((u) => <Path key={u} path={rr(make(), Math.min(u, u + (u < 0 ? -26 : 26)) - 24, F.bottom, Math.max(u, u + (u < 0 ? -26 : 26)) + 24, 4, 8)} style="stroke" strokeWidth={4} color={KEYS.amber} />) : null}
      {hi === 'rh.pedal' ? hiRect({ u0: pedal.u - pedal.w / 2, v0: -pedal.h, u1: pedal.u + pedal.w / 2, v1: 0 }) : null}
    </Group>
  );
}

export function RhodesTopArt({ hi }: { hi?: string | null }) {
  const T = RHODES_TOP;
  const half = T.half;
  const body = rr(make(), -half, T.back, half, T.front, 30);
  return (
    <Group>
      <Path path={rr(make(), -half + 10, T.back + 14, half + 10, T.front + 16, 30)} color="#000" opacity={0.55}>
        <BlurMask blur={14} style="normal" />
      </Path>
      <Path path={body}>
        <LinearGradient start={vec(-half, T.back)} end={vec(half, T.front)} colors={[...KEYS.tolex]} />
      </Path>
      <Path path={R(T.lid, 18)}>
        <LinearGradient start={vec(-half, T.lid.v0)} end={vec(half * 0.2, T.lid.v1)} colors={['#4d4f57', '#2a2c31', '#141519']} />
      </Path>
      <Path path={R(T.lid, 18)} style="stroke" strokeWidth={1.2} color="#6a6d76" opacity={0.6} />
      {/* the lid's latches */}
      {[-half * 0.55, half * 0.55].map((u) => (
        <Path key={u} path={rr(make(), u - 20, T.lid.v1 - 16, u + 20, T.lid.v1 - 6, 3)}>
          <LinearGradient start={vec(u - 20, 0)} end={vec(u + 20, 0)} colors={[...KEYS.chrome]} />
        </Path>
      ))}
      <Path path={R(T.nameRail, 2)}>
        <LinearGradient start={vec(0, T.nameRail.v0)} end={vec(0, T.nameRail.v1)} colors={[...KEYS.nameRail]} />
      </Path>
      {T.knobs.map((u) => (
        <Knob key={u} u={u} v={T.railV} r={11} />
      ))}
      <Jack u={T.jack} v={T.railV} />
      <KeysTop k={T.keys} />
      <Path path={body} style="stroke" strokeWidth={1.4} color="#5a5c64" opacity={0.7} />
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

/** Slots across an oval grille (the lid's moulded grille), clipped to it. */
function grilleSlots(g: { u: number; v: number; a: number; b: number }): SkPath {
  const p = make();
  const n = 9;
  for (let i = 0; i < n; i++) {
    const v = g.v - g.b + ((i + 0.5) * 2 * g.b) / n;
    const t = 1 - ((v - g.v) / g.b) ** 2;
    if (t <= 0) continue;
    const h = g.a * Math.sqrt(t) * 0.94;
    rr(p, g.u - h, v - (g.b / n) * 0.32, g.u + h, v + (g.b / n) * 0.32, 2);
  }
  return p;
}

export function WurliFrontArt({ hi, mount = 'lid' }: { hi?: string | null; mount?: WurliMount }) {
  const F = WURLI_FRONT;
  const half = F.half;
  const face = R(F.face, 14);
  const body = R(F.body, 12);
  const pedal = F.pedal;
  return (
    <Group>
      <Floor u0={-half - 120} u1={half + 120} />
      <Path path={rr(make(), -half + 40, -14, half - 40, 6, 10)} color="#000" opacity={0.55}>
        <BlurMask blur={14} style="normal" />
      </Path>
      {F.legs.map((u, i) => (
        <Leg key={i} u={u} v0={F.body.v1} splay={i === 0 ? -22 : 22} />
      ))}
      {/* the sustain pedal on its cable */}
      <Path path={(() => { const p = make(); p.moveTo(pedal.u + 40, -pedal.h + 20); p.cubicTo(pedal.u + 160, -40, pedal.u + 200, F.body.v1 + 60, pedal.u + 210, F.body.v1); return p; })()} style="stroke" strokeWidth={4} color="#202126" />
      <Path path={poly([[pedal.u - pedal.w / 2, -6], [pedal.u + pedal.w / 2, -6], [pedal.u + pedal.w / 2 - 8, -pedal.h], [pedal.u - pedal.w / 2 + 8, -pedal.h]])}>
        <LinearGradient start={vec(0, -pedal.h)} end={vec(0, 0)} colors={[...KEYS.chrome]} />
      </Path>
      <Path path={rr(make(), pedal.u - pedal.w / 2 + 12, -pedal.h + 6, pedal.u + pedal.w / 2 - 12, -pedal.h + 16, 3)} color="#1a1b1f" />
      {/* the case below the keys */}
      <Path path={body}>
        <LinearGradient start={vec(-half, F.body.v0)} end={vec(half, F.body.v1)} colors={[...KEYS.plastic]} />
      </Path>
      <Path path={body} style="stroke" strokeWidth={1.4} color={KEYS.plasticRim} opacity={0.45} />
      {/* the lid's front slope, its rim lit from the upper left */}
      <Path path={face}>
        <LinearGradient start={vec(-half, F.face.v0)} end={vec(half * 0.4, F.face.v1)} colors={['#a85a46', '#6e3226', '#3a1810']} />
      </Path>
      <Path path={rr(make(), F.face.u0 + 26, F.face.v0 + 5, F.face.u1 - 26, F.face.v0 + 13, 4)} color="#ffffff" opacity={0.12} />
      {F.grilles.map((g, i) => (
        <Group key={i}>
          <Path path={ellipse(g.u, g.v, g.a, g.b)}>
            <RadialGradient c={vec(g.u - g.a * 0.3, g.v - g.b * 0.4)} r={g.a * 1.3} colors={['#2a2420', '#14100d', '#070505']} />
          </Path>
          <Path path={grilleSlots(g)} color={mount === 'lid' ? '#3a2f29' : '#2a2320'} opacity={0.9} />
          <Path path={ellipse(g.u, g.v, g.a, g.b)} style="stroke" strokeWidth={2} color={KEYS.plasticRim} opacity={0.55} />
        </Group>
      ))}
      <Path path={face} style="stroke" strokeWidth={1.4} color={KEYS.plasticRim} opacity={0.55} />
      {/* the controls at the left end */}
      <Knob u={-half + 22} v={F.keyTops.v0 - 6} r={10} />
      <Knob u={-half + 22} v={F.keyFace.v1 - 4} r={8} />
      {/* the keys */}
      <KeysTop k={F.keys} />
      <Path path={(() => { const p = make(); for (const w of F.keys.whites) rr(p, w.u0 + 0.6, F.keyFace.v0 + 1, w.u1 - 0.6, F.keyFace.v1, 1); return p; })()}>
        <LinearGradient start={vec(0, F.keyFace.v0)} end={vec(0, F.keyFace.v1)} colors={['#e9e6dd', '#c9c5ba', '#9f9b91']} />
      </Path>
      {hi === 'wur.lid' ? hiRect(F.face) : null}
      {hi === 'wur.grille' ? F.grilles.map((g, i) => <Path key={i} path={ellipse(g.u, g.v, g.a + 8, g.b + 8)} style="stroke" strokeWidth={4} color={KEYS.amber} />) : null}
      {hi === 'wur.keys' ? hiRect({ u0: F.keyTops.u0, v0: F.keyTops.v0, u1: F.keyTops.u1, v1: F.keyFace.v1 }) : null}
      {hi === 'wur.case' ? hiRect(F.body) : null}
      {hi === 'wur.controls' ? hiRect({ u0: -half + 6, v0: F.keyTops.v0 - 20, u1: -half + 40, v1: F.keyFace.v1 + 6 }, 4) : null}
      {hi === 'wur.legs' ? F.legs.map((u) => <Path key={u} path={rr(make(), u - 40, F.body.v1, u + 40, 4, 8)} style="stroke" strokeWidth={4} color={KEYS.amber} />) : null}
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
  bench: SkPath;
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
    const shell = poly([
      [W.faceFootX, W.faceFootY],
      [FACE_TOP.x, FACE_TOP.y],
      [W.caseBackX, W.caseTopY],
      [W.caseBackX, W.caseBottomY],
      [W.caseBackX + t, W.caseBottomY],
      [W.caseBackX + t, W.caseTopY + t],
      [FACE_TOP.x - t * 0.4 + 2, FACE_TOP.y + t],
      [W.faceFootX - t, W.faceFootY],
    ]);
    const interior = poly([
      [W.faceFootX - t, W.faceFootY],
      [FACE_TOP.x + 2, FACE_TOP.y + t],
      [W.caseBackX + t, W.caseTopY + t],
      [W.caseBackX + t, W.caseBottomY - 14],
      [W.faceFootX - t, W.caseBottomY - 14],
    ]);
    const caseCut = poly([
      [W.caseBackX, W.caseBottomY - 14],
      [W.slipX, W.caseBottomY - 14],
      [W.slipX, W.keyBottomY + 2],
      [W.slipX - 8, W.keyBottomY + 2],
      [W.slipX - 8, W.caseBottomY - 22],
      [W.caseBackX, W.caseBottomY - 22],
    ]);
    // one white key in section, reaching back under the lid to its pivot
    const keys = rr(make(), -330, W.keyTopY, W.keyFrontX, W.keyBottomY, 2);
    const keyTop = rr(make(), W.faceFootX, W.keyTopY, W.keyFrontX - 1, W.keyTopY + 4, 1);
    // the action in shadow: the reed bar, a hammer, the pickup and the amp rail
    const action = make();
    rr(action, -420, -790, -330, -770, 3);
    rr(action, -380, -768, -300, -760, 2);
    rr(action, -310, -760, -280, -740, 4);
    rr(action, -455, -840, -432, -700, 3);
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
    const bracket = mount === 'rail' ? poly([at(OVAL_SECTION.dFlange + dOff - 3, OV.bFrame), at(OVAL_SECTION.dFlange + dOff - 3, OV.bFrame + 14), [-455, -840 + 0], [-455, -826]]) : null;
    const slots = make();
    for (let k = -3; k <= 3; k++) {
      const s0 = k * 13 - 4;
      const [u0, v0] = at(0.5, s0);
      const [u1, v1] = at(0.5, s0 + 8);
      slots.moveTo(u0, v0);
      slots.lineTo(u1, v1);
    }
    // the seated player: minimal line art (ILLUSTRATIVE)
    const player = make();
    player.addCircle(P.head.x, P.head.y, P.head.r * 0.92);
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
    const bench = make();
    rr(bench, 470, -500, 800, -470, 6);
    rr(bench, 490, -470, 510, -4, 3);
    rr(bench, 760, -470, 780, -4, 3);
    out = { floor: rr(make(), -1500, 0, 900, 40, 0), shell, shellFill, interior, keys, keyTop, caseCut, action, legs, pedal, pedalCable, spk: [{ ...sp, bracket }], slots, player, playerLine, bench };
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
    const action = make();
    for (const z of [-200, -60, 80, 220]) rr(action, -430, z - 40, -300, z + 40, 6);
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
    player.addCircle(P.head.x + 10, 0, P.head.r * 0.9);
    const playerLine = make();
    for (const sg of [-1, 1]) {
      playerLine.moveTo(P.shoulder.x - 40, sg * 200);
      playerLine.lineTo(P.elbow.x, sg * P.elbow.z);
      playerLine.lineTo(P.hand.x, sg * P.hand.z);
      playerLine.moveTo(P.hip.x - 30, sg * 120);
      playerLine.lineTo(P.knee.x, sg * P.knee.z);
    }
    const bench = rr(make(), 470, -380, 800, 380, 14);
    out = { floor: make(), shell, shellFill, interior, keys, keyTop, caseCut, action, legs, pedal, pedalCable, spk, slots, player, playerLine, bench };
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
      {side ? (
        <Path path={g.legs} opacity={0.75}>
          <LinearGradient start={vec(-30, 0)} end={vec(30, 0)} colors={[...KEYS.chrome]} />
        </Path>
      ) : null}
      {showPlayer ? (
        <Group>
          <Path path={g.bench} color="#2a2b31" opacity={0.85} />
          <Path path={g.player} color={KEYS.player} opacity={0.18} />
          <Path path={g.player} style="stroke" strokeWidth={3} color={KEYS.player} opacity={0.75} />
          <Path path={g.playerLine} style="stroke" strokeWidth={side ? 34 : 30} strokeCap="round" strokeJoin="round" color={KEYS.player} opacity={0.16} />
          <Path path={g.playerLine} style="stroke" strokeWidth={3} strokeCap="round" strokeJoin="round" color={KEYS.player} opacity={0.75} />
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
      <Path path={g.keys}>
        <LinearGradient start={vec(0, side ? W.keyTopY : -W.halfW)} end={vec(0, side ? W.keyBottomY : W.halfW)} colors={[...KEYS.ivory]} />
      </Path>
      <Path path={g.keyTop} style="stroke" strokeWidth={side ? 0 : 0.8} color="#7d796f" opacity={0.7} />
      {side ? <Path path={g.keyTop} color="#ffffff" opacity={0.5} /> : null}
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
