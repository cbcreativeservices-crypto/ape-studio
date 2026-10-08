/**
 * FIELD AND SPATIAL MICROPHONES for the Miking Labs — Lab 6 group 6 (F09
 * Location Speech, F10 Spatial Field Pickup). Same conventions as
 * micDrawings.tsx (which switches to these through MikingMicArt): LOCAL
 * coordinates, the mic's FRONT at the origin, its body toward +y; `r` the
 * radius, `len` the length front to tail; a side-address type also gets
 * `cross` — its long, upright extent in a SIDE view (`cross > 2r`), or its
 * width seen from above (`cross = 2r`).
 *
 * Illustrations, never glyphs (house rule): layered gradients lit from the
 * upper left, a rim light on the lit edge, a contour, a soft contact shadow.
 * Generic types only — no maker's likeness, no badge.
 *
 *   ShotgunMic     a short shotgun: the slotted interference tube, the
 *                  capsule band, the satin body to the connector — in a
 *                  suspension (two cradle rings with their elastic).
 *   BlimpMic       the same in a basket windshield with a fur cover
 *                  (outdoors): a long rounded body under long fibres.
 *   LavalierMic    a miniature on a clothing clip: the black capsule, its
 *                  mesh cap, a thin cable leaving the tail.
 *   DummyHeadMic   a binaural model head (a matte polymer head, not a
 *                  person): its FACE on the front point, the ear mics in the
 *                  outer ears level with the head's centre `len` behind it;
 *                  in profile (side view) or from above.
 *   AmbiTetraMic   a first-order Ambisonic mic held upright: the round
 *                  capsule head (four capsules on a tetrahedron) centred
 *                  `len` behind the front point, the slim body below, the
 *                  front mark on the side that faces the scene's front.
 *   DmsClusterMic  a Double M/S cluster: a forward and a rear small cardioid
 *                  with a side-address figure-8 between them, its positive
 *                  side marked "+".
 * A side view of the upright types assumes the engine's turn for a mic that
 * faces +x (local +x is DOWN on the glass) — every Lab 6 group 6 scene faces
 * them that way.
 */
import { useMemo } from 'react';
import { BlurMask, Group, LinearGradient, Path, RadialGradient, Skia, vec } from '@shopify/react-native-skia';

type SkPathT = ReturnType<typeof Skia.Path.Make>;
const make = () => Skia.Path.Make();
const LIT = (r: number) => ({ start: vec(r, 0), end: vec(-r, 0) });
const AMBER = '#ffc64d';

/* ── SHOTGUN (short, end-address) ── */

function buildShotgun(r: number, len: number) {
  const tube = len * 0.62; // the slotted interference tube
  const body: SkPathT = make();
  body.addRRect(Skia.RRectXY(Skia.XYWHRect(-r, 0, r * 2, len), r * 0.5, r * 0.5));
  const cap: SkPathT = make();
  cap.addRRect(Skia.RRectXY(Skia.XYWHRect(-r * 1.02, 0, r * 2.04, len * 0.035), r * 0.5, r * 0.3));
  const slots: SkPathT = make();
  const n = Math.max(4, Math.floor(tube / Math.max(6, r * 1.6)));
  for (let k = 1; k < n; k++) {
    const y = len * 0.05 + (k / n) * (tube - len * 0.05);
    slots.addRRect(Skia.RRectXY(Skia.XYWHRect(-r * 0.62, y, r * 1.24, Math.max(1.2, r * 0.42)), r * 0.2, r * 0.2));
  }
  const band: SkPathT = make();
  band.addRect(Skia.XYWHRect(-r * 1.04, tube, r * 2.08, len * 0.03));
  const xlr: SkPathT = make();
  xlr.addRect(Skia.XYWHRect(-r * 0.86, len * 0.94, r * 1.72, len * 0.06));
  // The suspension: two cradle rings round the body, the elastic between.
  const rings: SkPathT = make();
  const ringR = r * 2.3;
  for (const t of [0.62, 0.86]) rings.addOval(Skia.XYWHRect(-ringR, len * t - r * 0.45, ringR * 2, r * 0.9));
  const elastic: SkPathT = make();
  for (const t of [0.62, 0.86]) {
    const y = len * t;
    elastic.moveTo(-ringR, y);
    elastic.lineTo(-r, y + r * 0.2);
    elastic.moveTo(ringR, y);
    elastic.lineTo(r, y + r * 0.2);
  }
  const cradle: SkPathT = make();
  cradle.moveTo(ringR, len * 0.62);
  cradle.lineTo(ringR * 1.1, len * 0.74);
  cradle.lineTo(ringR, len * 0.86);
  return { body, cap, slots, band, xlr, rings, elastic, cradle };
}

export function ShotgunMic({ r, len, tint }: { r: number; len: number; tint?: string }) {
  const p = useMemo(() => buildShotgun(r, len), [r, len]);
  const lit = LIT(r);
  const hair = Math.max(0.35, r * 0.06);
  return (
    <Group>
      <Group transform={[{ translateX: -r * 0.2 }, { translateY: r * 0.2 }]}>
        <Path path={p.body} color="#000000" opacity={0.45}>
          <BlurMask blur={r * 0.35} style="normal" />
        </Path>
      </Group>
      {/* The suspension's far side, behind the body. */}
      <Path path={p.cradle} style="stroke" strokeWidth={hair * 3} color="#1a1b1f" />
      <Path path={p.body}>
        <LinearGradient start={lit.start} end={lit.end} colors={['#9aa0ab', '#5c616b', '#2c2e35', '#15161a']} positions={[0, 0.3, 0.7, 1]} />
      </Path>
      <Path path={p.slots} color="#07080a" opacity={0.85} />
      <Group transform={[{ translateX: -hair * 0.6 }, { translateY: -hair * 0.4 }]}>
        <Path path={p.slots} style="stroke" strokeWidth={hair * 0.6} color="#c9ced8" opacity={0.25} />
      </Group>
      <Path path={p.band}>
        <LinearGradient start={lit.start} end={lit.end} colors={['#eef1f6', '#9aa0ab', '#3a3d45']} />
      </Path>
      <Path path={p.cap}>
        <LinearGradient start={lit.start} end={lit.end} colors={['#c9ced8', '#6c717b', '#24262c']} />
      </Path>
      <Path path={p.xlr} color="#8a8f99" opacity={0.85} />
      <Path path={p.body} style="stroke" strokeWidth={hair * 1.3} color="#08080a" opacity={0.9} />
      <Path path={p.body} style="stroke" strokeWidth={hair} color={tint ?? '#e3e7ef'} opacity={tint ? 0.95 : 0.22} />
      {/* The cradle rings and their elastic, in front. */}
      <Path path={p.elastic} style="stroke" strokeWidth={hair * 1.4} color="#0d0e11" />
      <Path path={p.rings} style="stroke" strokeWidth={hair * 2.4} color="#121317" />
      <Path path={p.rings} style="stroke" strokeWidth={hair * 1.2} color="#5b5f69" />
    </Group>
  );
}

/* ── BLIMP (basket windshield + fur) ── */

function buildBlimp(r: number, len: number) {
  const body: SkPathT = make();
  body.addRRect(Skia.RRectXY(Skia.XYWHRect(-r, 0, r * 2, len), r * 0.95, r * 0.95));
  // Long fibres: short strokes leaning back (−y to +y), all round the edge,
  // and a few lying across the body (the cover's nap).
  const fur: SkPathT = make();
  const step = Math.max(2.5, r * 0.12);
  for (let y = r * 0.2; y < len - r * 0.2; y += step) {
    for (const s of [-1, 1]) {
      const x0 = s * r * 0.88;
      fur.moveTo(x0, y);
      fur.lineTo(s * (r * 1.12 + ((y * 7) % 5)), y + step * 2.2);
    }
  }
  for (let a = 0; a <= Math.PI; a += 0.22) {
    for (const [cy, sgn] of [
      [r, -1],
      [len - r, 1],
    ] as const) {
      const x = Math.cos(a) * r * 0.9;
      const y = cy + sgn * Math.sin(a) * r * 0.9;
      fur.moveTo(x, y);
      fur.lineTo(x * 1.22, y + sgn * r * 0.22);
    }
  }
  const nap: SkPathT = make();
  for (let y = r * 0.6; y < len - r * 0.6; y += step * 1.7) {
    nap.moveTo(-r * 0.6, y);
    nap.quadTo(0, y + step * 1.3, r * 0.62, y + step * 0.3);
  }
  // The pistol grip's clamp ring at the tail (the pole fits here).
  const clamp: SkPathT = make();
  clamp.addRRect(Skia.RRectXY(Skia.XYWHRect(-r * 0.32, len - r * 0.1, r * 0.64, r * 0.32), r * 0.1, r * 0.1));
  return { body, fur, nap, clamp };
}

export function BlimpMic({ r, len, tint }: { r: number; len: number; tint?: string }) {
  const p = useMemo(() => buildBlimp(r, len), [r, len]);
  const hair = Math.max(0.4, r * 0.03);
  return (
    <Group>
      <Group transform={[{ translateX: -r * 0.12 }, { translateY: r * 0.12 }]}>
        <Path path={p.body} color="#000000" opacity={0.5}>
          <BlurMask blur={r * 0.3} style="normal" />
        </Path>
      </Group>
      <Path path={p.fur} style="stroke" strokeWidth={hair * 1.5} strokeCap="round" color="#3d3a36" opacity={0.95} />
      <Path path={p.body}>
        <LinearGradient start={vec(r, 0)} end={vec(-r, 0)} colors={['#b9b2a6', '#8c857a', '#5d5850', '#34312d']} positions={[0, 0.3, 0.7, 1]} />
      </Path>
      <Group clip={p.body}>
        <Path path={p.nap} style="stroke" strokeWidth={hair * 1.2} color="#2b2825" opacity={0.45} />
        <Group transform={[{ translateX: -hair }, { translateY: -hair }]}>
          <Path path={p.nap} style="stroke" strokeWidth={hair * 0.8} color="#ece6da" opacity={0.25} />
        </Group>
      </Group>
      <Group transform={[{ translateX: -hair * 1.2 }, { translateY: -hair }]}>
        <Path path={p.fur} style="stroke" strokeWidth={hair * 0.7} strokeCap="round" color="#d8d1c4" opacity={0.35} />
      </Group>
      <Path path={p.clamp} color="#2a2c32" />
      <Path path={p.body} style="stroke" strokeWidth={hair} color={tint ?? '#efe8dc'} opacity={tint ? 0.95 : 0.2} />
    </Group>
  );
}

/* ── LAVALIER (a miniature on a clothing clip) ── */

export function LavalierMic({ r, len, tint }: { r: number; len: number; tint?: string }) {
  const p = useMemo(() => {
    const body = make();
    body.addRRect(Skia.RRectXY(Skia.XYWHRect(-r, 0, r * 2, len), r * 0.45, r * 0.45));
    const cap = make();
    cap.addRRect(Skia.RRectXY(Skia.XYWHRect(-r * 0.98, 0, r * 1.96, len * 0.3), r * 0.5, r * 0.4));
    const cable = make();
    cable.moveTo(0, len);
    cable.cubicTo(r * 0.6, len + r * 3, -r * 1.5, len + r * 5, -r * 0.6, len + r * 9);
    return { body, cap, cable };
  }, [r, len]);
  const hair = Math.max(0.25, r * 0.12);
  return (
    <Group>
      <Path path={p.cable} style="stroke" strokeWidth={r * 0.55} strokeCap="round" color="#0b0c0e" />
      <Path path={p.body}>
        <LinearGradient start={vec(r, 0)} end={vec(-r, 0)} colors={['#4a4e57', '#1d1f24', '#0a0b0d']} />
      </Path>
      <Path path={p.cap}>
        <LinearGradient start={vec(r, 0)} end={vec(-r, 0)} colors={['#9aa0ab', '#3c3f47', '#121317']} />
      </Path>
      <Path path={p.body} style="stroke" strokeWidth={hair} color={tint ?? '#c9ced8'} opacity={tint ? 0.95 : 0.4} />
    </Group>
  );
}

/* ── DUMMY HEAD (binaural) ── */

const POLY = ['#c8c1b6', '#a39b8f', '#7a7369', '#4e4943'];

function buildHead(r: number, len: number, side: boolean, cross: number) {
  // The head's centre is `len` behind the face (local y), the ears level
  // with it; the width across is 2r (the ears' outer edges).
  const cy = len;
  const out: { skull: SkPathT; ear: SkPathT; mic: SkPathT; neck: SkPathT; nose: SkPathT } = { skull: make(), ear: make(), mic: make(), neck: make(), nose: make() };
  if (side) {
    // In profile, local +x is DOWN: the crown at −x, the chin at +x. The face
    // runs along y = 0 … the back of the skull at y ≈ cy + 0.95·len.
    const H = Math.min(cross * 0.48, len * 1.25);
    const k = out.skull;
    k.moveTo(-H * 0.98, cy);
    k.cubicTo(-H * 1.0, cy - len * 0.55, -H * 0.62, -len * 0.04, -H * 0.3, len * 0.02);
    k.cubicTo(-H * 0.1, len * 0.05, -H * 0.02, -len * 0.06, H * 0.12, -len * 0.04);
    k.cubicTo(H * 0.3, len * 0.02, H * 0.48, len * 0.12, H * 0.62, len * 0.22);
    k.cubicTo(H * 0.74, len * 0.34, H * 0.7, len * 0.6, H * 0.58, len * 0.86);
    k.lineTo(H * 0.62, cy + len * 0.55);
    k.cubicTo(H * 0.2, cy + len * 0.95, -H * 0.4, cy + len * 1.0, -H * 0.8, cy + len * 0.7);
    k.cubicTo(-H * 1.0, cy + len * 0.45, -H * 1.0, cy + len * 0.2, -H * 0.98, cy);
    k.close();
    // The nose ridge (the front mark of the face), a small brow line.
    out.nose.moveTo(-H * 0.05, len * 0.0);
    out.nose.cubicTo(H * 0.05, -len * 0.1, H * 0.16, -len * 0.08, H * 0.2, len * 0.02);
    // The outer ear (pinna) at the head's centre, the ear mic in its bowl.
    out.ear.addOval(Skia.XYWHRect(-H * 0.16, cy - len * 0.2, H * 0.42, len * 0.34));
    out.mic.addCircle(H * 0.06, cy - len * 0.03, Math.max(1.5, len * 0.05));
    // The neck down to the mount.
    out.neck.addRRect(Skia.RRectXY(Skia.XYWHRect(H * 0.55, cy - len * 0.45, Math.max(10, cross * 0.5 - H * 0.55), len * 0.85), len * 0.2, len * 0.2));
  } else {
    // From above: an egg — narrow at the face, wide behind — the nose at the
    // front, an outer ear each side level with the centre, the ear mics.
    const k = out.skull;
    k.moveTo(0, -len * 0.05);
    k.cubicTo(r * 0.55, -len * 0.05, r * 0.86, cy * 0.45, r * 0.86, cy);
    k.cubicTo(r * 0.86, cy + len * 0.7, r * 0.5, cy + len * 0.98, 0, cy + len * 0.98);
    k.cubicTo(-r * 0.5, cy + len * 0.98, -r * 0.86, cy + len * 0.7, -r * 0.86, cy);
    k.cubicTo(-r * 0.86, cy * 0.45, -r * 0.55, -len * 0.05, 0, -len * 0.05);
    k.close();
    out.nose.addOval(Skia.XYWHRect(-r * 0.12, -len * 0.14, r * 0.24, len * 0.2));
    for (const s of [-1, 1]) {
      out.ear.addOval(Skia.XYWHRect(s > 0 ? r * 0.78 : -r * 1.0, cy - len * 0.22, r * 0.22, len * 0.42));
      out.mic.addCircle(s * r * 0.86, cy, Math.max(1.5, len * 0.05));
    }
  }
  return out;
}

export function DummyHeadMic({ r, len, cross, tint }: { r: number; len: number; cross: number; tint?: string }) {
  const side = cross > r * 2 + 1;
  const p = useMemo(() => buildHead(r, len, side, cross), [r, len, side, cross]);
  const b = p.skull.getBounds();
  const hair = Math.max(0.5, len * 0.012);
  return (
    <Group>
      <Group transform={[{ translateX: -len * 0.04 }, { translateY: len * 0.05 }]}>
        <Path path={p.skull} color="#000000" opacity={0.45}>
          <BlurMask blur={len * 0.06} style="normal" />
        </Path>
      </Group>
      {side ? (
        <Path path={p.neck}>
          <LinearGradient start={vec(b.x, b.y)} end={vec(b.x + b.width, b.y + b.height)} colors={POLY.slice(1)} />
        </Path>
      ) : null}
      <Path path={p.skull}>
        <RadialGradient c={vec(b.x + b.width * 0.32, b.y + b.height * 0.3)} r={Math.max(b.width, b.height) * 0.85} colors={POLY} positions={[0, 0.35, 0.75, 1]} />
      </Path>
      <Path path={p.nose} style="stroke" strokeWidth={hair * 2} strokeCap="round" color="#5e584f" opacity={0.85} />
      <Path path={p.ear}>
        <LinearGradient start={vec(b.x, b.y)} end={vec(b.x + b.width, b.y + b.height)} colors={['#b8b0a4', '#7a7369', '#4a453f']} />
      </Path>
      <Path path={p.ear} style="stroke" strokeWidth={hair} color="#2c2925" opacity={0.85} />
      <Path path={p.mic} color="#0b0c0e" />
      <Path path={p.mic} style="stroke" strokeWidth={hair * 0.8} color={AMBER} opacity={0.9} />
      <Path path={p.skull} style="stroke" strokeWidth={hair * 1.4} color="#1e1c19" opacity={0.85} />
      <Path path={p.skull} style="stroke" strokeWidth={hair} color={tint ?? '#f3ede2'} opacity={tint ? 0.95 : 0.3} />
    </Group>
  );
}

/* ── AMBISONIC (four capsules on a tetrahedron, held upright) ── */

export function AmbiTetraMic({ r, len, cross, tint }: { r: number; len: number; cross: number; tint?: string }) {
  const side = cross > r * 2 + 1;
  const p = useMemo(() => {
    const head = make();
    head.addCircle(0, len, r);
    const caps = make();
    const body = make();
    const mark = make();
    if (side) {
      // Two capsules seen from the side (the near pair), the slim body below.
      caps.addCircle(-r * 0.3, len - r * 0.38, r * 0.3);
      caps.addCircle(r * 0.32, len + r * 0.36, r * 0.3);
      body.addRRect(Skia.RRectXY(Skia.XYWHRect(r * 0.8, len - r * 0.42, Math.max(r, cross - r * 0.8), r * 0.84), r * 0.3, r * 0.3));
      // The front mark: a small bar on the front of the body, just below the head.
      mark.addRRect(Skia.RRectXY(Skia.XYWHRect(r * 1.1, len - r * 0.5, r * 0.5, r * 0.18), r * 0.08, r * 0.08));
    } else {
      // From above: all four capsules, front pair toward −y.
      for (const [x, y] of [
        [-0.42, -0.42],
        [0.42, -0.42],
        [-0.42, 0.42],
        [0.42, 0.42],
      ] as const)
        caps.addCircle(x * r, len + y * r, r * 0.3);
      mark.addRRect(Skia.RRectXY(Skia.XYWHRect(-r * 0.12, len - r * 1.18, r * 0.24, r * 0.3), r * 0.08, r * 0.08));
    }
    return { head, caps, body, mark };
  }, [r, len, side, cross]);
  const hair = Math.max(0.35, r * 0.05);
  return (
    <Group>
      {side ? (
        <Path path={p.body}>
          <LinearGradient start={vec(0, len - r)} end={vec(0, len + r)} colors={['#8a8f99', '#3a3d45', '#15161a']} />
        </Path>
      ) : null}
      <Path path={p.head}>
        <RadialGradient c={vec(-r * 0.35, len - r * 0.35)} r={r * 1.5} colors={['#d6dae2', '#8a8f99', '#3a3d45', '#1a1b1f']} positions={[0, 0.3, 0.75, 1]} />
      </Path>
      <Path path={p.caps} color="#101114" opacity={0.85} />
      <Path path={p.caps} style="stroke" strokeWidth={hair} color="#b9912f" opacity={0.7} />
      <Path path={p.mark} color={AMBER} />
      <Path path={p.head} style="stroke" strokeWidth={hair * 1.2} color="#08080a" opacity={0.85} />
      <Path path={p.head} style="stroke" strokeWidth={hair} color={tint ?? '#e3e7ef'} opacity={tint ? 0.95 : 0.3} />
    </Group>
  );
}

/* ── DOUBLE M/S (front + rear cardioids, a side figure-8) ── */

export function DmsClusterMic({ r, len, cross, tint }: { r: number; len: number; cross: number; tint?: string }) {
  const side = cross > r * 2 + 1;
  const p = useMemo(() => {
    const pr = r * 0.42; // a pencil capsule's radius
    const pl = r * 2.6; // its length
    const front = make();
    front.addRRect(Skia.RRectXY(Skia.XYWHRect(-pr, len - pl - r * 0.2, pr * 2, pl), pr * 0.5, pr * 0.5));
    const rear = make();
    rear.addRRect(Skia.RRectXY(Skia.XYWHRect(-pr, len + r * 0.2, pr * 2, pl), pr * 0.5, pr * 0.5));
    const grilles = make();
    grilles.addRRect(Skia.RRectXY(Skia.XYWHRect(-pr, len - pl - r * 0.2, pr * 2, pl * 0.26), pr * 0.5, pr * 0.5));
    grilles.addRRect(Skia.RRectXY(Skia.XYWHRect(-pr, len + r * 0.2 + pl * 0.74, pr * 2, pl * 0.26), pr * 0.5, pr * 0.5));
    // The figure-8: a side-address body between them (seen edge-on from
    // above; its broad face from the side), the "+" on its positive side.
    const eight = make();
    const mount = make();
    const plus = make();
    if (side) {
      eight.addRRect(Skia.RRectXY(Skia.XYWHRect(-r * 0.9, len - r * 0.55, r * 1.8, r * 1.1), r * 0.4, r * 0.4));
      mount.addRRect(Skia.RRectXY(Skia.XYWHRect(r * 0.9, len - r * 0.2, Math.max(r, cross - r * 0.9), r * 0.4), r * 0.15, r * 0.15));
    } else {
      eight.addRRect(Skia.RRectXY(Skia.XYWHRect(-r * 0.9, len - r * 0.32, r * 1.8, r * 0.64), r * 0.25, r * 0.25));
      // "+" on the LEFT (local −x faces the array's left when it faces +x).
      const cx = -r * 1.25;
      plus.moveTo(cx - r * 0.22, len);
      plus.lineTo(cx + r * 0.22, len);
      plus.moveTo(cx, len - r * 0.22);
      plus.lineTo(cx, len + r * 0.22);
    }
    return { front, rear, grilles, eight, mount, plus };
  }, [r, len, side, cross]);
  const hair = Math.max(0.3, r * 0.05);
  return (
    <Group>
      {side ? (
        <Path path={p.mount}>
          <LinearGradient start={vec(0, len - r)} end={vec(0, len + r)} colors={['#6c717b', '#2a2c32', '#121317']} />
        </Path>
      ) : null}
      <Path path={p.eight}>
        <LinearGradient start={vec(-r, len - r)} end={vec(r, len + r)} colors={['#a9aeb8', '#575c66', '#1e2025']} />
      </Path>
      <Path path={p.front}>
        <LinearGradient start={vec(r * 0.4, 0)} end={vec(-r * 0.4, 0)} colors={['#e6e9ef', '#7c7f89', '#2b2d34']} />
      </Path>
      <Path path={p.rear}>
        <LinearGradient start={vec(r * 0.4, 0)} end={vec(-r * 0.4, 0)} colors={['#e6e9ef', '#7c7f89', '#2b2d34']} />
      </Path>
      <Path path={p.grilles} color="#1e2025" opacity={0.75} />
      <Path path={p.plus} style="stroke" strokeWidth={hair * 2.2} strokeCap="round" color={AMBER} />
      <Path path={p.eight} style="stroke" strokeWidth={hair} color="#08080a" opacity={0.85} />
      <Path path={p.front} style="stroke" strokeWidth={hair} color={tint ?? '#e3e7ef'} opacity={tint ? 0.95 : 0.3} />
    </Group>
  );
}
