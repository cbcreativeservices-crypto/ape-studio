/**
 * THE SIDE-ADDRESS RIBBON for the Miking Labs (s9 art pass round 2,
 * 2026-10-10) — MikingMicArt 'ribbon'. Same conventions as the side-address
 * condenser (micDrawings.tsx SideLdcMic): LOCAL coordinates, the mic's FRONT
 * FACE at the origin, its depth toward +y, its long upright extent along
 * local x (`cross` long in a SIDE view, the +x end the head); from ABOVE
 * (`cross ≤ 2r`) x runs across the mic's width. `len` is the type's depth
 * envelope: the yoke's stem reaches back to it, where the engine's stand or
 * boom meets the mic (the tail point (0, len)).
 *
 * The class, in mm (the long-body figure-8 ribbon): a pill-shaped body
 * ≈ Ø 48–56 × ≈ 160, round-topped; the RIBBON WINDOW over the upper ≈ 36 %,
 * open mesh on BOTH faces (front and back — the figure-8); inside it the
 * MOTOR: two magnet pole pieces (side plates ≈ 12 apart) with the
 * corrugated aluminium ribbon (≈ 2.5 wide, ≈ 50 long) hanging in the gap;
 * the satin lower body to the XLR collar; a U-YOKE pivoting on the body's
 * sides just below the window, its stem back to the stand. Generic — no
 * maker's likeness, no badge, no logo.
 *
 * Views: from the SIDE the near pole piece's side plate shows through the
 * side window with the gap and the ribbon's edge in it, the front and back
 * mesh at the edges; from ABOVE the section through the window: both pole
 * pieces, the ribbon across the gap, the mesh front and back, the yoke.
 */
import { useMemo } from 'react';
import { BlurMask, Circle, Group, LinearGradient, Path, Skia, vec } from '@shopify/react-native-skia';

type SkPathT = ReturnType<typeof Skia.Path.Make>;
const make = () => Skia.Path.Make();

function hatch(x0: number, y0: number, x1: number, y1: number, step: number): SkPathT {
  const p = make();
  const w = x1 - x0;
  const h = y1 - y0;
  for (let d = -h; d < w; d += step) {
    p.moveTo(x0 + d, y0);
    p.lineTo(x0 + d + h, y1);
    p.moveTo(x0 + d + h, y0);
    p.lineTo(x0 + d, y1);
  }
  return p;
}

function buildRibbon(r: number, len: number, cross: number) {
  const side = cross > r * 2 + 1;
  const out = {
    side,
    D: 0,
    shell: make(),
    window: make(),
    meshClip: make(),
    mesh: make(),
    poles: make(),
    gap: make(),
    ribbon: make(),
    frame: make(),
    collar: make(),
    yoke: make(),
    knob: { x: 0, y: 0, r: 0 },
    knob2: { x: 0, y: 0, r: 0 },
  };
  if (side) {
    // ── from the side: x along the mic, +x the head ──
    const D = Math.min(len, r * 2 * 0.85, cross * 0.32);
    out.D = D;
    const hd = D / 2;
    const top = cross / 2;
    const bot = -cross / 2;
    const L = cross;
    // The pill body: a round top, a squared base.
    const s = out.shell;
    s.moveTo(bot + D * 0.06, 0);
    s.lineTo(top - hd, 0);
    s.arcToOval(Skia.XYWHRect(top - D, 0, D, D), 270, 180, false);
    s.lineTo(bot + D * 0.06, D);
    s.quadTo(bot, D, bot, D * 0.94);
    s.lineTo(bot, D * 0.06);
    s.quadTo(bot, 0, bot + D * 0.06, 0);
    s.close();
    // The ribbon window: the upper ≈ 36 %, below the round top.
    const w0 = Math.max(0.08 * L, D * 0.34);
    const w1 = top - hd * 0.55;
    out.window.addRRect(Skia.RRectXY(Skia.XYWHRect(w0, D * 0.05, w1 - w0, D * 0.9), D * 0.08, D * 0.08));
    out.meshClip.addPath(out.window);
    // Mesh at the front and back faces (seen edge-on at the window's edges)
    // and over the side opening.
    out.mesh = hatch(w0, 0, w1, D, Math.max(0.7, D * 0.07));
    // The near pole piece's side plate, the gap in it, the ribbon's edge.
    out.poles.addRRect(Skia.RRectXY(Skia.XYWHRect(w0 + D * 0.08, D * 0.24, w1 - w0 - D * 0.16, D * 0.52), D * 0.04, D * 0.04));
    out.gap.addRect(Skia.XYWHRect(w0 + D * 0.12, hd - D * 0.045, w1 - w0 - D * 0.24, D * 0.09));
    const zz = Math.max(0.5, D * 0.035);
    out.ribbon.moveTo(w0 + D * 0.14, hd);
    for (let x = w0 + D * 0.14, i = 0; x < w1 - D * 0.14; x += zz, i++) out.ribbon.lineTo(x, hd + (i % 2 ? -1 : 1) * D * 0.022);
    // The window's frame (its top and bottom bars).
    out.frame.addRect(Skia.XYWHRect(w0 - D * 0.04, 0, D * 0.08, D));
    out.frame.addRect(Skia.XYWHRect(w1 - D * 0.04, 0, D * 0.08, D));
    // The XLR collar at the base.
    out.collar.addRect(Skia.XYWHRect(bot, D * 0.04, D * 0.16, D * 0.92));
    // The U-yoke: the near arm's pivot on the body's side just below the
    // window, the arm back to the stem at the tail point.
    const ky = hd;
    const kx = 0; // the engine's tail point is (0, len)
    const aw = D * 0.18;
    out.yoke.addRRect(Skia.RRectXY(Skia.XYWHRect(kx - aw / 2, ky, aw, Math.max(D * 0.2, len - ky - D * 0.12)), aw * 0.4, aw * 0.4));
    out.yoke.addRRect(Skia.RRectXY(Skia.XYWHRect(kx - aw * 0.75, len - D * 0.2, aw * 1.5, D * 0.2), aw * 0.3, aw * 0.3));
    out.knob = { x: kx, y: ky, r: D * 0.17 };
  } else {
    // ── from above: the section through the window ──
    const w = Math.min(cross, Math.max(len * 0.9, 40));
    const D = Math.min(len, w * 0.9);
    out.D = D;
    const hd = D / 2;
    const hw = w / 2;
    out.shell.addRRect(Skia.RRectXY(Skia.XYWHRect(-hw, 0, w, D), Math.min(w, D) * 0.45, Math.min(w, D) * 0.45));
    out.window.addRect(Skia.XYWHRect(-hw * 0.84, 0, w * 0.84, D));
    // The mesh faces: front and back only (the sides are the magnets' plates).
    out.meshClip.addRect(Skia.XYWHRect(-hw, 0, w, D * 0.17));
    out.meshClip.addRect(Skia.XYWHRect(-hw, D * 0.83, w, D * 0.17));
    out.mesh = hatch(-hw, 0, hw, D, Math.max(0.7, D * 0.08));
    // The two pole pieces left and right of the gap, front to back.
    for (const sg of [-1, 1]) out.poles.addRRect(Skia.RRectXY(Skia.XYWHRect(sg > 0 ? hw * 0.14 : -hw * 0.72, D * 0.2, hw * 0.58, D * 0.6), D * 0.04, D * 0.04));
    // The ribbon across the gap, its corrugation as a fine wave.
    const zz = Math.max(0.3, w * 0.02);
    out.ribbon.moveTo(-hw * 0.13, hd);
    for (let x = -hw * 0.13, i = 0; x < hw * 0.13; x += zz, i++) out.ribbon.lineTo(x, hd + (i % 2 ? -1 : 1) * D * 0.02);
    // The yoke: its two arms along the sides, the base behind, the stem to the stand.
    const aw = Math.max(1, w * 0.07);
    const by = Math.min(len - aw, D + D * 0.6);
    for (const sg of [-1, 1]) out.yoke.addRRect(Skia.RRectXY(Skia.XYWHRect(sg * (hw + aw * 0.2) - (sg > 0 ? 0 : aw), hd - aw, aw, by - hd + aw), aw * 0.4, aw * 0.4));
    out.yoke.addRRect(Skia.RRectXY(Skia.XYWHRect(-hw - aw * 1.2, by - aw / 2, w + aw * 2.4, aw), aw * 0.4, aw * 0.4));
    if (len - by > aw) out.yoke.addRRect(Skia.RRectXY(Skia.XYWHRect(-aw * 0.6, by, aw * 1.2, len - by), aw * 0.4, aw * 0.4));
    out.knob = { x: -hw - aw * 0.3, y: hd, r: aw * 1.1 };
    out.knob2 = { x: hw + aw * 0.3, y: hd, r: aw * 1.1 };
  }
  return out;
}

export function RibbonMic({ r, len, cross, tint }: { r: number; len: number; cross: number; tint?: string }) {
  const p = useMemo(() => buildRibbon(r, len, cross), [r, len, cross]);
  const D = p.D;
  const hair = Math.max(0.35, D * 0.014);
  const L = (a: string[], pos?: number[]) => <LinearGradient start={vec(0, 0)} end={vec(0, D)} colors={a} positions={pos} />;
  const knobs = [p.knob, p.knob2].filter((k) => k.r > 0);
  return (
    <Group>
      <Group transform={[{ translateX: -D * 0.06 }, { translateY: D * 0.08 }]}>
        <Path path={p.shell} color="#000000" opacity={0.45}>
          <BlurMask blur={D * 0.1} style="normal" />
        </Path>
      </Group>
      {/* The yoke and its stem, behind the body. */}
      <Path path={p.yoke}>{L(['#8a8f99', '#4a4e57', '#1f2126'])}</Path>
      <Path path={p.yoke} style="stroke" strokeWidth={hair} color="#050506" />
      {/* The body: dark satin, lit at its face. */}
      <Path path={p.shell}>{L(['#7d828c', '#4a4e57', '#2a2c32', '#16171b'], [0, 0.25, 0.7, 1])}</Path>
      {p.side ? <Path path={p.collar}>{L(['#9ea3ad', '#5a5e67', '#24262b'])}</Path> : null}
      {/* The window: dark inside, the motor, the ribbon, then the mesh. */}
      <Group clip={p.shell}>
        <Path path={p.window} color="#08090b" />
        <Path path={p.poles}>{L(['#4a4e57', '#2a2c32', '#141519'])}</Path>
        {p.side ? <Path path={p.gap} color="#050506" /> : null}
        <Path path={p.ribbon} style="stroke" strokeWidth={Math.max(0.3, D * 0.025)} color="#e2c98f" opacity={0.95} />
        <Group clip={p.meshClip}>
          <Path path={p.mesh} style="stroke" strokeWidth={Math.max(0.2, D * 0.012)} color="#c9ced8" opacity={0.38} />
        </Group>
        {p.side ? <Path path={p.frame}>{L(['#b4b9c3', '#6a6e78', '#2a2c32'])}</Path> : null}
      </Group>
      <Path path={p.shell} style="stroke" strokeWidth={hair * 1.3} color="#08080a" opacity={0.9} />
      {/* The yoke's pivot knob(s) on the body's side. */}
      {knobs.map((k, i) => (
        <Group key={i}>
          <Circle cx={k.x} cy={k.y} r={k.r}>
            <LinearGradient start={vec(k.x, k.y - k.r)} end={vec(k.x, k.y + k.r)} colors={['#9aa0ab', '#3a3d45', '#15161a']} />
          </Circle>
          <Circle cx={k.x} cy={k.y} r={k.r} style="stroke" strokeWidth={hair} color="#050506" />
        </Group>
      ))}
      <Path path={p.shell} style="stroke" strokeWidth={hair} color={tint ?? '#e3e7ef'} opacity={tint ? 0.95 : 0.25} />
    </Group>
  );
}
