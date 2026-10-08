/**
 * SPECIALIZED SENSORS, drawn (charter §2 layer 3; §6 look) — Lab 6 group 5
 * (branch lab6-g5), for F15 and F16 and any later lesson that meets them:
 *
 *   ContactSensor     a contact accelerometer: a hex base screwed to the
 *                     surface, a cylindrical body, a side connector and its
 *                     cable (side view)
 *   IntensityProbe    a p–p intensity probe from above: two capsules face to
 *                     face, the solid spacer between them, the probe's
 *                     handle, its positive-direction arrow
 *   Hydrophone        a hydrophone element on its cable (an end-capped
 *                     cylinder under a protective cage)
 *   AcousticCamera    a planar array: a ring of capsules on a frame round a
 *                     camera lens, on its mount
 *   UltrasonicDetector a handheld detector: the body, the display, the
 *                     forward-facing capsule under its mesh
 *
 * Generic objects only — no maker's likeness, no logos. Sizes are drawing
 * defaults (the caller places and scales them); every path is built once per
 * size; nothing moves by itself.
 */
import { useMemo } from 'react';
import { BlurMask, Circle, Group, LinearGradient, Path, RadialGradient, vec } from '@shopify/react-native-skia';
import { make, rectP } from './MeasureArt';

const EDGE = '#07080a';

/* ── the contact sensor (side view): base on the surface at y = 0, body up (−y) ── */

/** A contact accelerometer standing on a surface at (x, y), `s` mm tall; `warn` tints it red. */
export function ContactSensor({ x, y, s, warn = false, cable = true }: { x: number; y: number; s: number; warn?: boolean; cable?: boolean }) {
  const p = useMemo(() => {
    const w = s * 0.62;
    const base = make();
    // A hex base seen from the side: three faces.
    base.moveTo(x - w * 0.62, y);
    base.lineTo(x + w * 0.62, y);
    base.lineTo(x + w * 0.62, y - s * 0.22);
    base.lineTo(x - w * 0.62, y - s * 0.22);
    base.close();
    const faces = make();
    faces.moveTo(x - w * 0.2, y);
    faces.lineTo(x - w * 0.2, y - s * 0.22);
    faces.moveTo(x + w * 0.2, y);
    faces.lineTo(x + w * 0.2, y - s * 0.22);
    const body = rectP(make(), x - w * 0.45, y - s, x + w * 0.45, y - s * 0.2, w * 0.12);
    const conn = rectP(make(), x + w * 0.42, y - s * 0.72, x + w * 0.85, y - s * 0.5, w * 0.06);
    const lead = make();
    lead.moveTo(x + w * 0.85, y - s * 0.61);
    lead.cubicTo(x + w * 1.6, y - s * 0.61, x + w * 1.4, y - s * 0.05, x + w * 2.6, y - s * 0.02);
    return { base, faces, body, conn, lead, w };
  }, [x, y, s]);
  return (
    <Group>
      <Group transform={[{ translateX: -p.w * 0.08 }, { translateY: p.w * 0.1 }]}>
        <Path path={p.body} color="#000" opacity={0.45}>
          <BlurMask blur={p.w * 0.15} style="normal" />
        </Path>
      </Group>
      {cable ? <Path path={p.lead} style="stroke" strokeWidth={Math.max(1, s * 0.08)} strokeCap="round" color="#17181c" /> : null}
      <Path path={p.base}>
        <LinearGradient start={vec(x - p.w, y)} end={vec(x + p.w, y)} colors={['#d4d8df', '#7c818b', '#3a3d44']} />
      </Path>
      <Path path={p.faces} style="stroke" strokeWidth={Math.max(0.6, s * 0.02)} color="#2a2c31" />
      <Path path={p.body}>
        <LinearGradient start={vec(x - p.w * 0.5, 0)} end={vec(x + p.w * 0.5, 0)} colors={warn ? ['#ffb3aa', '#c0392b', '#5a1a14'] : ['#e9ecf1', '#9ba0aa', '#3f434a']} />
      </Path>
      <Path path={p.conn}>
        <LinearGradient start={vec(0, y - s * 0.72)} end={vec(0, y - s * 0.5)} colors={['#e6c77a', '#8a6b2a']} />
      </Path>
      <Path path={p.body} style="stroke" strokeWidth={Math.max(0.6, s * 0.025)} color={EDGE} />
      <Path path={p.base} style="stroke" strokeWidth={Math.max(0.6, s * 0.025)} color={EDGE} />
    </Group>
  );
}

/* ── the intensity probe, from above: its axis along +u from (cx, cy), turned by `deg` ── */

/** A p–p intensity probe: two capsules facing each other across a `spacer` (mm), its axis turned `deg` from +u. */
export function IntensityProbe({ cx, cy, spacer, deg, scale = 1 }: { cx: number; cy: number; spacer: number; deg: number; scale?: number }) {
  const p = useMemo(() => {
    const r = 6.35; // a 1/2 in capsule's radius (12.7 mm diameter, from its name)
    const capLen = 30;
    const half = spacer / 2;
    // Capsule A on the −u side facing +u, capsule B on the +u side facing −u, the spacer between their grids.
    const capA = rectP(make(), -half - capLen, -r, -half, r, 2);
    const capB = rectP(make(), half, -r, half + capLen, r, 2);
    const grids = make();
    rectP(grids, -half - 3, -r * 0.9, -half, r * 0.9, 1);
    rectP(grids, half, -r * 0.9, half + 3, r * 0.9, 1);
    const spacerBody = rectP(make(), -half, -r * 0.45, half, r * 0.45, 1.5);
    // The preamps run back to a Y-shaped holder and the handle (+v side).
    const arms = make();
    arms.moveTo(-half - capLen, 0);
    arms.lineTo(-half - capLen - 22, 0);
    arms.lineTo(-half - capLen - 22, 46);
    arms.moveTo(half + capLen, 0);
    arms.lineTo(half + capLen + 22, 0);
    arms.lineTo(half + capLen + 22, 46);
    const handle = rectP(make(), -half - capLen - 32, 46, half + capLen + 32, 66, 8);
    const grip = rectP(make(), -14, 66, 14, 170, 9);
    return { capA, capB, grids, spacerBody, arms, handle, grip, r };
  }, [spacer]);
  return (
    <Group transform={[{ translateX: cx }, { translateY: cy }, { rotate: (deg * Math.PI) / 180 }, { scale }]}>
      <Group transform={[{ translateX: -2 }, { translateY: 4 }]}>
        <Path path={p.handle} color="#000" opacity={0.4}>
          <BlurMask blur={5} style="normal" />
        </Path>
      </Group>
      <Path path={p.arms} style="stroke" strokeWidth={5} strokeCap="round" color="#3b3e45" />
      <Path path={p.grip}>
        <LinearGradient start={vec(-14, 0)} end={vec(14, 0)} colors={['#4a4e57', '#24262b']} />
      </Path>
      <Path path={p.handle}>
        <LinearGradient start={vec(0, 46)} end={vec(0, 66)} colors={['#8e939c', '#3e4148']} />
      </Path>
      <Path path={p.capA}>
        <LinearGradient start={vec(0, -p.r)} end={vec(0, p.r)} colors={['#eef0f4', '#9aa0aa', '#3c4048']} />
      </Path>
      <Path path={p.capB}>
        <LinearGradient start={vec(0, -p.r)} end={vec(0, p.r)} colors={['#eef0f4', '#9aa0aa', '#3c4048']} />
      </Path>
      <Path path={p.grids} color="#15161a" />
      <Path path={p.spacerBody}>
        <LinearGradient start={vec(0, -p.r)} end={vec(0, p.r)} colors={['#e6c77a', '#8a6b2a']} />
      </Path>
      <Path path={p.capA} style="stroke" strokeWidth={1} color={EDGE} />
      <Path path={p.capB} style="stroke" strokeWidth={1} color={EDGE} />
      <Path path={p.handle} style="stroke" strokeWidth={1.2} color={EDGE} />
    </Group>
  );
}

/* ── the hydrophone element: an end-capped cylinder under a cage, its cable up ── */

/** A hydrophone `len` mm long hanging at (x, y) (its top), its cable running up `cable` mm. */
export function Hydrophone({ x, y, len, cable }: { x: number; y: number; len: number; cable: number }) {
  const p = useMemo(() => {
    const r = len * 0.2;
    const body = rectP(make(), x - r, y, x + r, y + len, r * 0.6);
    const boot = rectP(make(), x - r * 0.55, y - len * 0.22, x + r * 0.55, y + len * 0.05, r * 0.3);
    const cage = make();
    for (const k of [-1, -0.33, 0.33, 1]) {
      cage.moveTo(x + k * r * 1.25, y + len * 0.2);
      cage.lineTo(x + k * r * 1.25, y + len * 1.08);
    }
    cage.moveTo(x - r * 1.25, y + len * 1.08);
    cage.lineTo(x + r * 1.25, y + len * 1.08);
    const lead = make();
    lead.moveTo(x, y - len * 0.22);
    lead.lineTo(x, y - cable);
    return { body, boot, cage, lead, r };
  }, [x, y, len, cable]);
  return (
    <Group>
      <Path path={p.lead} style="stroke" strokeWidth={Math.max(2, p.r * 0.35)} color="#101114" />
      <Path path={p.boot} color="#1b1c20" />
      <Path path={p.body}>
        <LinearGradient start={vec(x - p.r, 0)} end={vec(x + p.r, 0)} colors={['#5a6b78', '#2a3640', '#11181d']} />
      </Path>
      <Path path={p.body} style="stroke" strokeWidth={Math.max(1, p.r * 0.12)} color={EDGE} />
      <Path path={p.cage} style="stroke" strokeWidth={Math.max(1, p.r * 0.12)} color="#9aa3ad" opacity={0.85} />
    </Group>
  );
}

/* ── the acoustic camera: capsules on a ring frame round a lens, face-on ── */

/** A planar imaging array face-on, centred at (cx, cy), `r` mm to its outer capsules, on a short mount below. */
export function AcousticCamera({ cx, cy, r }: { cx: number; cy: number; r: number }) {
  const p = useMemo(() => {
    const frame = make();
    frame.addCircle(cx, cy, r * 1.08);
    const inner = make();
    inner.addCircle(cx, cy, r * 0.82);
    const spokes = make();
    for (let i = 0; i < 6; i++) {
      const a = (i * Math.PI) / 3;
      spokes.moveTo(cx + Math.cos(a) * r * 0.2, cy + Math.sin(a) * r * 0.2);
      spokes.lineTo(cx + Math.cos(a) * r * 1.05, cy + Math.sin(a) * r * 1.05);
    }
    const caps: { x: number; y: number }[] = [];
    // Capsules on spiral arms (an irregular layout, as practical arrays use).
    for (let arm = 0; arm < 6; arm++)
      for (let j = 1; j <= 5; j++) {
        const t = j / 5;
        const a = (arm * Math.PI) / 3 + t * 1.1;
        caps.push({ x: cx + Math.cos(a) * r * (0.22 + 0.8 * t), y: cy + Math.sin(a) * r * (0.22 + 0.8 * t) });
      }
    const mount = rectP(make(), cx - r * 0.08, cy + r * 1.06, cx + r * 0.08, cy + r * 1.7, r * 0.03);
    const foot = rectP(make(), cx - r * 0.45, cy + r * 1.66, cx + r * 0.45, cy + r * 1.76, r * 0.05);
    return { frame, inner, spokes, caps, mount, foot };
  }, [cx, cy, r]);
  return (
    <Group>
      <Path path={p.mount}>
        <LinearGradient start={vec(cx - r * 0.1, 0)} end={vec(cx + r * 0.1, 0)} colors={['#9da2ac', '#3b3e45']} />
      </Path>
      <Path path={p.foot} color="#2a2c31" />
      <Path path={p.frame} style="stroke" strokeWidth={r * 0.06} color="#3a3d44" />
      <Path path={p.inner} style="stroke" strokeWidth={r * 0.03} color="#2b2e34" />
      <Path path={p.spokes} style="stroke" strokeWidth={r * 0.035} color="#4a4e57" />
      {p.caps.map((c, i) => (
        <Circle key={i} cx={c.x} cy={c.y} r={r * 0.045} color="#c7ccd4" />
      ))}
      <Circle cx={cx} cy={cy} r={r * 0.19}>
        <RadialGradient c={vec(cx - r * 0.06, cy - r * 0.06)} r={r * 0.2} colors={['#4d6a8a', '#16212c', '#05070a']} />
      </Circle>
      <Circle cx={cx} cy={cy} r={r * 0.19} style="stroke" strokeWidth={r * 0.025} color="#8a9099" />
      <Circle cx={cx - r * 0.06} cy={cy - r * 0.07} r={r * 0.04} color="#ffffff" opacity={0.35} />
    </Group>
  );
}

/* ── the ultrasonic detector, side view: the capsule end at (x, y), body toward +u ── */

export function UltrasonicDetector({ x, y, len }: { x: number; y: number; len: number }) {
  const p = useMemo(() => {
    const h = len * 0.28;
    const body = rectP(make(), x + len * 0.12, y - h / 2, x + len, y + h / 2, h * 0.2);
    const nose = make();
    nose.moveTo(x + len * 0.12, y - h * 0.32);
    nose.lineTo(x, y - h * 0.22);
    nose.lineTo(x, y + h * 0.22);
    nose.lineTo(x + len * 0.12, y + h * 0.32);
    nose.close();
    const mesh = make();
    for (let k = -2; k <= 2; k++) {
      mesh.moveTo(x + 1, y + k * h * 0.08);
      mesh.lineTo(x + len * 0.06, y + k * h * 0.09);
    }
    const screen = rectP(make(), x + len * 0.35, y - h * 0.32, x + len * 0.75, y + h * 0.02, h * 0.06);
    const keys = make();
    for (const k of [0.42, 0.55, 0.68]) keys.addCircle(x + len * k, y + h * 0.24, h * 0.07);
    return { body, nose, mesh, screen, keys, h };
  }, [x, y, len]);
  return (
    <Group>
      <Group transform={[{ translateX: -3 }, { translateY: 5 }]}>
        <Path path={p.body} color="#000" opacity={0.45}>
          <BlurMask blur={6} style="normal" />
        </Path>
      </Group>
      <Path path={p.body}>
        <LinearGradient start={vec(0, y - p.h / 2)} end={vec(0, y + p.h / 2)} colors={['#4f5560', '#2c3037', '#16181c']} />
      </Path>
      <Path path={p.nose}>
        <LinearGradient start={vec(0, y - p.h / 2)} end={vec(0, y + p.h / 2)} colors={['#a9aeb7', '#4e525a']} />
      </Path>
      <Path path={p.mesh} style="stroke" strokeWidth={1} color="#15161a" />
      <Path path={p.screen} color="#0d1a12" />
      <Path path={p.keys}>
        <LinearGradient start={vec(0, y)} end={vec(0, y + p.h / 2)} colors={['#8a8f99', '#3e4148']} />
      </Path>
      <Path path={p.body} style="stroke" strokeWidth={1.4} color={EDGE} />
    </Group>
  );
}
