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

function buildShotgun(r: number, len: number, capAt?: number) {
  // ART PASS s9 (2026-10-10). The short shotgun, in mm (Ø 19–21 × 250 class):
  // a FRONT CAP (the tube's open end, a fine mesh disc behind a rim); the
  // INTERFERENCE TUBE over the front ≈ 62 % — long narrow slots in staggered
  // pairs down its length (on the near side: two rows), each ≈ 1.5 Ø long;
  // the CAPSULE BAND where the tube ends (the capsule sits just behind it);
  // the satin body (the preamp) to a knurled XLR END. A suspension's two
  // cradle rings with their elastic hold the body.
  // `capAt` (optional): where the capsule sits from the front (a shotgun read
  // to its capsule) — the tube ends there; else at the class's ≈ 62 %.
  const tube = capAt !== undefined && capAt > r * 4 && capAt < len - r * 2 ? capAt - Math.max(r * 0.35, len * 0.022) : len * 0.62;
  const body: SkPathT = make();
  body.addRRect(Skia.RRectXY(Skia.XYWHRect(-r, 0, r * 2, len), r * 0.4, r * 0.4));
  const cap: SkPathT = make();
  cap.addRRect(Skia.RRectXY(Skia.XYWHRect(-r * 1.02, 0, r * 2.04, Math.max(r * 0.5, len * 0.03)), r * 0.4, r * 0.25));
  const slots: SkPathT = make();
  const s0 = len * 0.06;
  const sl = Math.max(r * 1.2, Math.min(r * 1.9, (tube - s0) / 6));
  const pitch = sl * 1.35;
  const sw = r * 0.26;
  let k = 0;
  for (let y = s0; y + sl <= tube - r * 0.3; y += pitch * 0.5, k++) {
    const x = k % 2 ? r * 0.36 : -r * 0.36;
    slots.addRRect(Skia.RRectXY(Skia.XYWHRect(x - sw / 2, y, sw, sl), sw * 0.5, sw * 0.5));
  }
  const band: SkPathT = make();
  band.addRect(Skia.XYWHRect(-r * 1.03, tube, r * 2.06, Math.max(r * 0.35, len * 0.022)));
  const xlr0 = len - Math.max(r * 1.1, len * 0.06);
  const xlr: SkPathT = make();
  xlr.addRRect(Skia.RRectXY(Skia.XYWHRect(-r * 0.96, xlr0, r * 1.92, len - xlr0), r * 0.3, r * 0.3));
  const knurl: SkPathT = make();
  for (let x = -r * 0.8; x < r * 0.85; x += Math.max(0.6, r * 0.22)) {
    knurl.moveTo(x, xlr0 + (len - xlr0) * 0.2);
    knurl.lineTo(x, len - (len - xlr0) * 0.2);
  }
  // The suspension: two cradle rings round the body, the elastic between.
  const rings: SkPathT = make();
  const ringR = r * 2.3;
  const bandEnd = tube + Math.max(r * 0.35, len * 0.022);
  const ringYs = [bandEnd + (xlr0 - bandEnd) * 0.22, bandEnd + (xlr0 - bandEnd) * 0.8];
  for (const y of ringYs) rings.addOval(Skia.XYWHRect(-ringR, y - r * 0.4, ringR * 2, r * 0.8));
  const elastic: SkPathT = make();
  for (const y of ringYs) {
    for (const s of [-1, 1]) {
      elastic.moveTo(s * ringR, y - r * 0.1);
      elastic.lineTo(s * r, y - r * 0.5);
      elastic.moveTo(s * ringR, y + r * 0.1);
      elastic.lineTo(s * r, y + r * 0.5);
    }
  }
  const cradle: SkPathT = make();
  cradle.moveTo(ringR, ringYs[0]);
  cradle.lineTo(ringR * 1.1, (ringYs[0] + ringYs[1]) / 2);
  cradle.lineTo(ringR, ringYs[1]);
  return { body, cap, slots, band, xlr, knurl, rings, elastic, cradle, tube };
}

export function ShotgunMic({ r, len, tint, capAt }: { r: number; len: number; tint?: string; capAt?: number }) {
  const p = useMemo(() => buildShotgun(r, len, capAt), [r, len, capAt]);
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
      {/* The tube and body: satin dark metal with a long specular band. */}
      <Path path={p.body}>
        <LinearGradient start={lit.start} end={lit.end} colors={['#5c616b', '#a3a8b2', '#5c616b', '#2c2e35', '#15161a']} positions={[0, 0.16, 0.38, 0.72, 1]} />
      </Path>
      <Path path={p.slots} color="#050506" opacity={0.9} />
      <Group transform={[{ translateX: -hair * 0.5 }, { translateY: -hair * 0.4 }]}>
        <Path path={p.slots} style="stroke" strokeWidth={hair * 0.5} color="#c9ced8" opacity={0.22} />
      </Group>
      <Path path={p.band}>
        <LinearGradient start={lit.start} end={lit.end} colors={['#eef1f6', '#9aa0ab', '#3a3d45']} />
      </Path>
      <Path path={p.cap}>
        <LinearGradient start={lit.start} end={lit.end} colors={['#c9ced8', '#6c717b', '#24262c']} />
      </Path>
      <Path path={p.xlr}>
        <LinearGradient start={lit.start} end={lit.end} colors={['#4a4e57', '#24262b', '#0e0f12']} />
      </Path>
      <Path path={p.knurl} style="stroke" strokeWidth={hair * 0.7} color="#050506" opacity={0.8} />
      <Path path={p.body} style="stroke" strokeWidth={hair * 1.3} color="#08080a" opacity={0.9} />
      <Path path={p.body} style="stroke" strokeWidth={hair} color={tint ?? '#e3e7ef'} opacity={tint ? 0.95 : 0.22} />
      {/* The cradle rings and their elastic, in front. */}
      <Path path={p.elastic} style="stroke" strokeWidth={hair * 1.2} color="#c9a24a" opacity={0.85} />
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

// ART PASS s9 (2026-10-10). The miniature, in mm: a CAPSULE Ø 5–8 × 10–15
// (the type passes Ø 6 × 12 / Ø 7 × 15): a black matte barrel, its front a
// fine mesh cap (≈ 30 %), a hairline ring behind it; the strain-relief
// BOOT at the tail and the thin cable (Ø ≈ 1.6) leaving it; the plastic
// CLOTHING CLIP holding the barrel (a cradle ≈ 1.3 × the capsule's width,
// its sprung jaw lying along the cable). Matte black: the lit edge only.
export function LavalierMic({ r, len, tint }: { r: number; len: number; tint?: string }) {
  const p = useMemo(() => {
    const body = make();
    body.addRRect(Skia.RRectXY(Skia.XYWHRect(-r, 0, r * 2, len), r * 0.45, r * 0.45));
    const cap = make();
    cap.addRRect(Skia.RRectXY(Skia.XYWHRect(-r * 0.98, 0, r * 1.96, len * 0.3), r * 0.5, r * 0.4));
    const mesh = make();
    const st = Math.max(0.3, r * 0.32);
    for (let d = -len * 0.3; d < r * 2; d += st) {
      mesh.moveTo(-r + d, 0);
      mesh.lineTo(-r + d + len * 0.3, len * 0.3);
      mesh.moveTo(-r + d + len * 0.3, 0);
      mesh.lineTo(-r + d, len * 0.3);
    }
    const ringLine = make();
    ringLine.moveTo(-r * 0.98, len * 0.3);
    ringLine.lineTo(r * 0.98, len * 0.3);
    const boot = make();
    boot.moveTo(-r * 0.7, len);
    boot.lineTo(r * 0.7, len);
    boot.lineTo(r * 0.32, len + r * 1.6);
    boot.lineTo(-r * 0.32, len + r * 1.6);
    boot.close();
    const cable = make();
    cable.moveTo(0, len + r * 1.5);
    cable.cubicTo(r * 0.6, len + r * 4, -r * 1.5, len + r * 6, -r * 0.6, len + r * 10);
    // The clip: a cradle round the barrel's rear half, the jaw along the cable.
    const clip = make();
    clip.addRRect(Skia.RRectXY(Skia.XYWHRect(-r * 1.3, len * 0.42, r * 2.6, len * 0.42), r * 0.3, r * 0.3));
    const jaw = make();
    jaw.addRRect(Skia.RRectXY(Skia.XYWHRect(r * 0.55, len * 0.62, r * 0.9, len * 0.95), r * 0.35, r * 0.35));
    return { body, cap, mesh, ringLine, boot, cable, clip, jaw };
  }, [r, len]);
  const hair = Math.max(0.2, r * 0.1);
  return (
    <Group>
      <Path path={p.cable} style="stroke" strokeWidth={r * 0.55} strokeCap="round" color="#0b0c0e" />
      <Path path={p.cable} style="stroke" strokeWidth={r * 0.18} strokeCap="round" color="#3a3d44" opacity={0.6} />
      <Path path={p.jaw}>
        <LinearGradient start={vec(r * 1.4, 0)} end={vec(r * 0.5, 0)} colors={['#3d4048', '#16171b']} />
      </Path>
      <Path path={p.body}>
        <LinearGradient start={vec(r, 0)} end={vec(-r, 0)} colors={['#4a4e57', '#1d1f24', '#0a0b0d']} />
      </Path>
      <Path path={p.boot} color="#121317" />
      <Path path={p.cap}>
        <LinearGradient start={vec(r, 0)} end={vec(-r, 0)} colors={['#8a8f99', '#3c3f47', '#121317']} />
      </Path>
      <Group clip={p.cap}>
        <Path path={p.mesh} style="stroke" strokeWidth={Math.max(0.12, r * 0.06)} color="#050506" opacity={0.7} />
      </Group>
      <Path path={p.ringLine} style="stroke" strokeWidth={hair * 0.6} color="#9aa0ab" opacity={0.6} />
      <Path path={p.clip}>
        <LinearGradient start={vec(r * 1.3, 0)} end={vec(-r * 1.3, 0)} colors={['#4d515b', '#25272d', '#0e0f12']} />
      </Path>
      <Path path={p.clip} style="stroke" strokeWidth={hair * 0.6} color="#000000" opacity={0.8} />
      <Path path={p.body} style="stroke" strokeWidth={hair} color={tint ?? '#c9ced8'} opacity={tint ? 0.95 : 0.4} />
    </Group>
  );
}

/* ── DUMMY HEAD (binaural) ── */

// ART PASS s9 (2026-10-10). The binaural model head (a product, not a
// person: a neutral matte polymer head with true PINNAE and a mic in each
// ear canal), in mm: head height crown → chin ≈ 225; depth nose tip → back
// of the head ≈ 200 (the ear canal ≈ 95 behind the nose tip — the type's
// `len`); width across the head ≈ 155, ≈ 190 over the outer ears (the
// type's 2r); an outer ear ≈ 62 tall × 34 wide, its canal level with the
// lower brow line; a short neck (Ø ≈ 105 × 110 deep) to a mounting flange.
// Sculpted face (brow, nose, lips, chin) — smooth, no eyes, no hair.
const POLY = ['#cfc8bd', '#aaa296', '#7d766c', '#4e4943'];

function buildHead(r: number, len: number, side: boolean, cross: number) {
  // The ear canal (the reference for the ear mics) sits `len` behind the
  // face, level with the head's centre. Side: local +x is DOWN on the glass
  // (crown at −x, chin at +x); from above: x across, y back.
  const cy = len;
  const out = { skull: make(), ear: make(), concha: make(), helixIn: make(), mic: make(), flange: make(), nose: make(), features: make(), shade: make() };
  const sy = len / 95; // depth scale (the model's 95 mm face → canal)
  if (side) {
    const sx = sy; // one scale in profile
    const crown = -125 * sx;
    const bottom = Math.max(110 * sx, crown + cross); // the neck's foot
    const P = (x: number, y: number): [number, number] => [x * sx, y * sy];
    const k = out.skull;
    const m = (a: [number, number]) => k.moveTo(a[0], a[1]);
    const c = (a: [number, number], b: [number, number], d: [number, number]) => k.cubicTo(a[0], a[1], b[0], b[1], d[0], d[1]);
    const l = (a: [number, number]) => k.lineTo(a[0], a[1]);
    // Profile, from the crown down the face to the neck, back up the nape.
    m(P(-125, 100));
    c(P(-128, 60), P(-114, 34), P(-94, 24)); // forehead
    c(P(-74, 14), P(-52, 12), P(-40, 12)); // brow ridge
    c(P(-34, 14), P(-31, 19), P(-27, 20)); // nasion
    c(P(-12, 12), P(4, 1), P(9, 0)); // nose bridge → tip
    c(P(14, 2), P(18, 9), P(20, 14)); // tip → under the nose
    c(P(24, 15), P(28, 12), P(33, 10)); // upper lip
    c(P(37, 12), P(39, 15), P(41, 15)); // mouth
    c(P(44, 13), P(48, 11), P(51, 12)); // lower lip
    c(P(56, 18), P(60, 19), P(64, 17)); // under the lip
    c(P(72, 12), P(82, 13), P(90, 24)); // chin
    c(P(96, 34), P(96, 52), P(92, 64)); // under the chin
    c(P(90, 70), P(92, 74), P(98, 76)); // throat
    l([bottom - 8 * sx, 74 * sy]); // the neck's front
    l([bottom - 8 * sx, 178 * sy]); // across the neck's foot
    l([88 * sx, 172 * sy]); // the nape
    c(P(62, 178), P(40, 196), P(10, 201)); // under the occiput
    c(P(-30, 206), P(-80, 190), P(-108, 160)); // the back of the skull
    c(P(-124, 140), P(-126, 120), P(-125, 100)); // over the crown
    k.close();
    // The nose's side wing and the lips' parting (sculpted lines).
    out.nose.moveTo(...P(8, 16));
    out.nose.cubicTo(...P(12, 22), ...P(16, 24), ...P(19, 22));
    out.features.moveTo(...P(41, 15));
    out.features.lineTo(...P(42, 26));
    // A soft brow-and-eye socket shade, and the cheekbone shade.
    out.shade.addOval(Skia.XYWHRect(-30 * sx, 14 * sy, 20 * sx, 18 * sy));
    // The outer ear round the canal at (0, cy): helix up and back, lobe below.
    const E = (x: number, y: number): [number, number] => [x * sx, cy + y * sy];
    const e = out.ear;
    e.moveTo(...E(-20, -6)); // helix root, above the tragus
    e.cubicTo(...E(-32, -4), ...E(-40, 4), ...E(-38, 14)); // up over the top
    e.cubicTo(...E(-36, 24), ...E(-24, 32), ...E(-6, 31)); // the back rim
    e.cubicTo(...E(10, 30), ...E(22, 24), ...E(28, 16)); // down to the lobe
    e.cubicTo(...E(32, 10), ...E(28, 4), ...E(22, 4)); // lobe
    e.cubicTo(...E(16, 4), ...E(12, 2), ...E(8, -2)); // intertragic notch
    e.cubicTo(...E(6, -6), ...E(0, -7), ...E(-6, -6)); // tragus
    e.close();
    // The concha (the bowl round the canal) and the antihelix ridge.
    out.concha.moveTo(...E(-10, -1));
    out.concha.cubicTo(...E(-18, 4), ...E(-14, 16), ...E(-2, 17));
    out.concha.cubicTo(...E(8, 17), ...E(12, 10), ...E(8, 4));
    out.concha.cubicTo(...E(4, 0), ...E(-4, -2), ...E(-10, -1));
    out.concha.close();
    out.helixIn.moveTo(...E(-28, 4));
    out.helixIn.cubicTo(...E(-30, 16), ...E(-20, 24), ...E(-4, 24));
    out.helixIn.cubicTo(...E(8, 24), ...E(16, 20), ...E(20, 14));
    out.mic.addCircle(0, cy, Math.max(1.2, 3 * sy));
    // The mounting flange at the neck's foot.
    out.flange.addRRect(Skia.RRectXY(Skia.XYWHRect(bottom - 9 * sx, 60 * sy, 9 * sx, 130 * sy), 2 * sx, 2 * sx));
  } else {
    // From above: the skull (narrow at the brow, widest behind the ears),
    // the nose at the front, an outer ear standing out from each side.
    const sx = r / 95;
    const P = (x: number, y: number): [number, number] => [x * sx, y * sy];
    const k = out.skull;
    k.moveTo(...P(0, 8));
    k.cubicTo(...P(26, 8), ...P(52, 16), ...P(64, 36));
    k.cubicTo(...P(76, 56), ...P(78, 90), ...P(78, 118));
    k.cubicTo(...P(78, 160), ...P(56, 198), ...P(0, 200));
    k.cubicTo(...P(-56, 198), ...P(-78, 160), ...P(-78, 118));
    k.cubicTo(...P(-78, 90), ...P(-76, 56), ...P(-64, 36));
    k.cubicTo(...P(-52, 16), ...P(-26, 8), ...P(0, 8));
    k.close();
    out.nose.moveTo(...P(-9, 14));
    out.nose.cubicTo(...P(-7, 8), ...P(-3, 1), ...P(0, 0));
    out.nose.cubicTo(...P(3, 1), ...P(7, 8), ...P(9, 14));
    out.nose.close();
    for (const s of [-1, 1]) {
      const e = out.ear;
      e.moveTo(...P(s * 74, 84));
      e.cubicTo(...P(s * 84, 86), ...P(s * 92, 98), ...P(s * 95, 112));
      e.cubicTo(...P(s * 96, 122), ...P(s * 90, 128), ...P(s * 80, 126));
      e.lineTo(...P(s * 75, 122));
      e.close();
      out.concha.addOval(Skia.XYWHRect(Math.min(s * 76, s * 86) * sx, 90 * sy, 10 * sx, 14 * sy));
      out.mic.addCircle(s * 80 * sx, cy, Math.max(1.2, 3 * sy));
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
        <>
          <Path path={p.flange}>
            <LinearGradient start={vec(b.x, b.y)} end={vec(b.x, b.y + b.height)} colors={['#5a5e67', '#2a2c32', '#121317']} />
          </Path>
          <Path path={p.flange} style="stroke" strokeWidth={hair} color="#08080a" opacity={0.8} />
        </>
      ) : null}
      {/* The head: matte polymer, lit from the upper left (front and crown). */}
      <Path path={p.skull}>
        <RadialGradient c={vec(b.x + b.width * 0.28, b.y + b.height * 0.22)} r={Math.max(b.width, b.height) * 0.95} colors={POLY} positions={[0, 0.38, 0.78, 1]} />
      </Path>
      <Group clip={p.skull}>
        <Path path={p.shade} color="#3a352f" opacity={0.14}>
          <BlurMask blur={len * 0.06} style="normal" />
        </Path>
      </Group>
      <Path path={p.nose} style={side ? 'stroke' : 'fill'} strokeWidth={hair * 1.2} strokeCap="round" color={side ? '#6e675d' : '#b9b1a5'} opacity={0.85} />
      {!side ? <Path path={p.nose} style="stroke" strokeWidth={hair} color="#4e4943" opacity={0.7} /> : null}
      <Path path={p.features} style="stroke" strokeWidth={hair} strokeCap="round" color="#6e675d" opacity={0.6} />
      {/* The outer ears: the rim, the bowl round the canal, the mic in it. */}
      <Path path={p.ear}>
        <LinearGradient start={vec(b.x, b.y)} end={vec(b.x + b.width, b.y + b.height)} colors={['#c4bcb0', '#958d81', '#5e584f']} />
      </Path>
      <Path path={p.concha} color="#5e584f" opacity={0.75} />
      <Path path={p.helixIn} style="stroke" strokeWidth={hair * 1.1} strokeCap="round" color="#6e675d" opacity={0.7} />
      <Path path={p.ear} style="stroke" strokeWidth={hair} color="#2c2925" opacity={0.85} />
      <Path path={p.mic} color="#0b0c0e" />
      <Path path={p.mic} style="stroke" strokeWidth={hair * 0.8} color={AMBER} opacity={0.9} />
      <Path path={p.skull} style="stroke" strokeWidth={hair * 1.4} color="#1e1c19" opacity={0.85} />
      <Path path={p.skull} style="stroke" strokeWidth={hair} color={tint ?? '#f3ede2'} opacity={tint ? 0.95 : 0.3} />
    </Group>
  );
}

/* ── AMBISONIC (four capsules on a tetrahedron, held upright) ── */

// ART PASS s9 (2026-10-10). The first-order Ambisonic mic, in mm: a round
// HEAD Ø ≈ 50 — a woven-mesh basket on a frame ring, the four capsules
// (Ø ≈ 14) on the faces of a tetrahedron seen through it; a short neck ring;
// the slim BODY Ø ≈ 25 below to its connector; the FRONT MARK on the body's
// front, just below the head.
export function AmbiTetraMic({ r, len, cross, tint }: { r: number; len: number; cross: number; tint?: string }) {
  const side = cross > r * 2 + 1;
  const p = useMemo(() => {
    const head = make();
    head.addCircle(0, len, r);
    const caps = make();
    const body = make();
    const neck = make();
    const mark = make();
    const xlr = make();
    const mesh = make();
    const st = Math.max(0.8, r * 0.16);
    for (let d = -2 * r; d < 2 * r; d += st) {
      mesh.moveTo(-r + d, len - r);
      mesh.lineTo(-r + d + 2 * r, len + r);
      mesh.moveTo(-r + d + 2 * r, len - r);
      mesh.lineTo(-r + d, len + r);
    }
    if (side) {
      // Two capsules of the near pair, tilted as on the tetrahedron, the
      // slim body below (local +x is DOWN on the glass).
      caps.addCircle(-r * 0.32, len - r * 0.36, r * 0.28);
      caps.addCircle(r * 0.3, len + r * 0.34, r * 0.28);
      const bl = Math.max(r, cross - r * 0.8);
      neck.addRRect(Skia.RRectXY(Skia.XYWHRect(r * 0.84, len - r * 0.56, r * 0.3, r * 1.12), r * 0.08, r * 0.08));
      body.addRRect(Skia.RRectXY(Skia.XYWHRect(r * 1.1, len - r * 0.5, bl - r * 0.3, r * 1.0), r * 0.24, r * 0.24));
      xlr.addRRect(Skia.RRectXY(Skia.XYWHRect(r * 0.8 + bl - r * 0.55, len - r * 0.46, r * 0.55, r * 0.92), r * 0.12, r * 0.12));
      // The front mark: a small bar on the front of the body, just below the head.
      mark.addRRect(Skia.RRectXY(Skia.XYWHRect(r * 1.35, len - r * 0.56, r * 0.5, r * 0.16), r * 0.06, r * 0.06));
    } else {
      // From above: all four capsules, the front pair toward −y.
      for (const [x, y] of [
        [-0.42, -0.42],
        [0.42, -0.42],
        [-0.42, 0.42],
        [0.42, 0.42],
      ] as const)
        caps.addCircle(x * r, len + y * r, r * 0.28);
      mark.addRRect(Skia.RRectXY(Skia.XYWHRect(-r * 0.12, len - r * 1.18, r * 0.24, r * 0.3), r * 0.08, r * 0.08));
    }
    return { head, caps, body, neck, mark, xlr, mesh };
  }, [r, len, side, cross]);
  const hair = Math.max(0.35, r * 0.05);
  return (
    <Group>
      {side ? (
        <>
          <Path path={p.body}>
            <LinearGradient start={vec(0, len - r)} end={vec(0, len + r)} colors={['#9ea3ad', '#4a4e57', '#1c1d22', '#0f1013']} positions={[0, 0.3, 0.7, 1]} />
          </Path>
          <Path path={p.xlr}>
            <LinearGradient start={vec(0, len - r)} end={vec(0, len + r)} colors={['#5a5e67', '#24262b', '#0e0f12']} />
          </Path>
          <Path path={p.neck}>
            <LinearGradient start={vec(0, len - r)} end={vec(0, len + r)} colors={['#eef1f6', '#9aa0ab', '#3a3d45']} />
          </Path>
          <Path path={p.body} style="stroke" strokeWidth={hair} color="#08080a" opacity={0.85} />
        </>
      ) : null}
      {/* The head: dark interior, the capsules, the woven mesh over them. */}
      <Path path={p.head}>
        <RadialGradient c={vec(-r * 0.35, len - r * 0.35)} r={r * 1.5} colors={['#7d828c', '#3a3d45', '#1a1b1f']} positions={[0, 0.55, 1]} />
      </Path>
      <Group clip={p.head}>
        <Path path={p.caps} color="#0b0c0e" opacity={0.9} />
        <Path path={p.caps} style="stroke" strokeWidth={hair} color="#b9912f" opacity={0.75} />
        <Path path={p.mesh} style="stroke" strokeWidth={Math.max(0.25, r * 0.025)} color="#d9dde5" opacity={0.4} />
      </Group>
      <Path path={p.head} style="stroke" strokeWidth={Math.max(0.5, r * 0.08)} color="#c9ced8" opacity={0.7} />
      <Path path={p.mark} color={AMBER} />
      <Path path={p.head} style="stroke" strokeWidth={hair * 0.8} color="#08080a" opacity={0.85} />
      <Path path={p.head} style="stroke" strokeWidth={hair} color={tint ?? '#e3e7ef'} opacity={tint ? 0.95 : 0.25} />
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
