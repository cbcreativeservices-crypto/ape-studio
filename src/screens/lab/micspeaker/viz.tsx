/**
 * Mic & Speaker Labs — Skia visualization core (owner 2026-07-29).
 *
 * VISUAL-FIRST LAUNCH (owner decision): these labs teach microphone capture
 * and loudspeaker coverage entirely through manipulable drawings — audio
 * demonstrations are explicitly "coming in a future release" and every screen
 * says so. HONESTY (§1.7): every curve here is an ILLUSTRATIVE MODEL (polar
 * equations, simplified response shelves, conceptual coverage) — never a
 * measurement, never an SPL prediction; each host panel badges that.
 *
 * VISUAL STANDARDS (owner ruling, docs/APE_VISUAL_STANDARDS_2026_07_29.md):
 * physical objects (mics, heads, hands, cabinets, stands, pop gear) are drawn
 * as recognizable illustrations — layered gradient-filled paths, light from
 * the upper-left, soft glows, floor/vignette scene depth. Abstract data
 * (curves, coverage cells, polar plots, ripples) stays geometric but styled:
 * gradient underfills and glow strokes, never hairline-on-black. All math
 * and readout semantics are IDENTICAL to the pre-retrofit file.
 *
 * ONLY this file (and foundations/viz, which it reuses clocks from) imports
 * '@shopify/react-native-skia'; it is loaded solely through
 * micspeaker/skiaGate.requireMsViz(), so pre-Skia clients never evaluate it.
 *
 * Models used (kept honest in shape):
 *   polar        r(θ) = |A + B·cosθ|          (first-order pattern family)
 *   distance     level ∝ 1/d (drawn),         direct/room bars conceptual
 *   proximity    LF shelf grows as distance shrinks — directional mics only
 *   off-axis     broadband 20·log10|A+B·cosθ| + growing HF rolloff
 *   coverage     within-dispersion × 1/d^n, classified into 4 bands
 */
import { useMemo } from 'react';
import {
  BlurMask,
  Canvas,
  Circle,
  Group,
  Line as SkLine,
  LinearGradient,
  Path,
  RadialGradient,
  Skia,
  vec,
} from '@shopify/react-native-skia';
import { useDerivedValue, type SharedValue } from 'react-native-reanimated';
// Reuse the house clocks (same Skia-gated load condition as this file).
export { usePhaseClock, useVizClock } from '../foundations/viz';

const PARTICLE = '#cfd2d8';
const WAVE = '#ffc64d';
const CONE = '#8a8c94';
const ACCENT_GREEN = '#5bff85';
const ACCENT_BLUE = '#6fa8ff';
const ACCENT_RED = '#ff6b5e';
const ACCENT_YELLOW = '#ffd76b';
const GRID = '#2c2c33';
const GHOST = '#232329';
const BG = '#0c0c0f';
// Illustration tones (light source: upper-left).
const METAL_HI = '#c6cad4';
const METAL_MID = '#7c7f89';
const METAL_LO = '#3a3c44';
const BODY_HI = '#4a4d58';
const BODY_LO = '#1e1f26';
const SKIN_HI = '#3d4149';
const SKIN_LO = '#23252c';

type SkPathT = ReturnType<typeof Skia.Path.Make>;

function withAlpha(hex: string, a: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${a})`;
}

/** First-order polar gain at θ (radians from the mic's front axis). */
export function polarGain(a: number, b: number, theta: number): number {
  return Math.abs(a + b * Math.cos(theta));
}

/** The pattern family the Polar Viewer teaches. */
export const POLAR_PATTERNS: { key: string; label: string; a: number; b: number }[] = [
  { key: 'omni', label: 'OMNI', a: 1, b: 0 },
  { key: 'cardioid', label: 'CARDIOID', a: 0.5, b: 0.5 },
  { key: 'super', label: 'SUPER', a: 0.37, b: 0.63 },
  { key: 'hyper', label: 'HYPER', a: 0.25, b: 0.75 },
  { key: 'fig8', label: 'FIGURE-8', a: 0, b: 1 },
];

// ─────────────────────────────────────────────────────────────────────────────
// Shared illustration builders (all static geometry — always inside useMemo
// at the call site; nothing here runs per-frame).

/** Human head in profile FACING RIGHT (+x), mouth open, origin at the mouth.
 *  `s` scales a ~46-px-tall base head. */
function headProfilePath(s: number): SkPathT {
  const p = Skia.Path.Make();
  p.moveTo(4 * s, -8 * s); // top of the open mouth
  p.cubicTo(9 * s, -10 * s, 8.5 * s, -15 * s, 3.5 * s, -16.5 * s); // under-nose
  p.cubicTo(9.5 * s, -21 * s, 7 * s, -29 * s, -1.5 * s, -33 * s); // nose bridge → brow
  p.cubicTo(-13 * s, -40 * s, -29 * s, -33 * s, -30 * s, -19 * s); // crown → back of skull
  p.cubicTo(-30.5 * s, -9 * s, -27 * s, -1 * s, -23 * s, 5 * s); // occiput → nape
  p.cubicTo(-21 * s, 11 * s, -15 * s, 15.5 * s, -7 * s, 15 * s); // neck → jawline
  p.cubicTo(-2.5 * s, 14 * s, 2 * s, 10 * s, 3 * s, 6 * s); // jaw → chin
  p.cubicTo(6.5 * s, 4.5 * s, 6.5 * s, 1.5 * s, 3 * s, 0); // lower lip
  p.cubicTo(0.5 * s, -2 * s, 0.5 * s, -5.5 * s, 4 * s, -8 * s); // open-mouth notch
  p.close();
  return p;
}

/** A rendered profile head (silhouette + form gradient + rim light), facing
 *  along `angleDeg` measured like atan2 (0 = +x / right). */
function ProfileHead({
  x,
  y,
  angleRad,
  scale,
  tint,
  glow,
}: {
  x: number;
  y: number;
  angleRad: number;
  scale: number;
  tint: string;
  glow?: boolean;
}) {
  const path = useMemo(() => headProfilePath(scale), [scale]);
  const ext = 40 * scale;
  return (
    <Group transform={[{ translateX: x }, { translateY: y }, { rotate: angleRad }]}>
      {glow ? (
        <Path path={path} color={tint} style="stroke" strokeWidth={5 * scale} opacity={0.3}>
          <BlurMask blur={6 * scale} style="normal" />
        </Path>
      ) : null}
      <Path path={path}>
        <LinearGradient start={vec(-ext, -ext)} end={vec(ext * 0.4, ext)} colors={[SKIN_HI, SKIN_LO]} />
      </Path>
      <Path path={path} color={tint} style="stroke" strokeWidth={1.6} opacity={0.9} />
    </Group>
  );
}

/** Head-and-shoulders bust appended to `p`; `x` = center, `y` = base line. */
function appendBust(p: SkPathT, x: number, y: number, s: number) {
  // Shoulders: a soft dome.
  p.moveTo(x - 8 * s, y);
  p.cubicTo(x - 8 * s, y - 5.5 * s, x - 5 * s, y - 8 * s, x - 2.4 * s, y - 8.6 * s);
  p.lineTo(x + 2.4 * s, y - 8.6 * s);
  p.cubicTo(x + 5 * s, y - 8 * s, x + 8 * s, y - 5.5 * s, x + 8 * s, y);
  p.close();
  // Head: a slightly egg-shaped oval on the shoulders.
  p.addOval(Skia.XYWHRect(x - 3.5 * s, y - 16.6 * s, 7 * s, 8.6 * s));
}

/** Handheld vocal mic parts, LOCAL coords: grille sphere centered at the
 *  origin, tapered body extending toward +y (behind the grille). */
function buildHandheldMic(gr: number, len: number) {
  const y0 = gr * 0.72; // neck: where the body meets the grille ball
  const y1 = y0 + len;
  const topW = gr * 0.68;
  const botW = gr * 0.48;
  const body = Skia.Path.Make();
  body.moveTo(-topW, y0);
  body.lineTo(-botW, y1 - botW);
  body.quadTo(-botW, y1, 0, y1);
  body.quadTo(botW, y1, botW, y1 - botW);
  body.lineTo(topW, y0);
  body.close();
  // Wire-mesh grille: latitude + longitude ovals inscribed in the sphere.
  const mesh = Skia.Path.Make();
  for (const t of [-0.55, -0.15, 0.25, 0.62]) {
    const hw = gr * Math.sqrt(1 - t * t);
    mesh.addOval(Skia.XYWHRect(-hw, gr * t - gr * 0.15, hw * 2, gr * 0.3));
  }
  for (const t of [-0.45, 0, 0.45]) {
    const hh = gr * Math.sqrt(1 - t * t);
    mesh.addOval(Skia.XYWHRect(gr * t - gr * 0.13, -hh, gr * 0.26, hh * 2));
  }
  // Accent ring at the neck.
  const ring = Skia.Path.Make();
  ring.addRect(Skia.XYWHRect(-topW, y0, topW * 2, gr * 0.2));
  return { body, mesh, ring, y0, y1 };
}

/**
 * Recognizable handheld vocal mic: spherical mesh grille + specular highlight
 * over a tapered metal-sheen body. `x,y` = grille CENTER; `angleDeg` uses the
 * lab convention front = (sin θ, −cos θ), i.e. 0° points up.
 */
function HandheldMic({
  x,
  y,
  angleDeg,
  grilleR,
  bodyLen,
}: {
  x: number;
  y: number;
  angleDeg: number;
  grilleR: number;
  bodyLen: number;
}) {
  const gr = grilleR;
  const parts = useMemo(() => buildHandheldMic(gr, bodyLen), [gr, bodyLen]);
  return (
    <Group transform={[{ translateX: x }, { translateY: y }, { rotate: (angleDeg * Math.PI) / 180 }]}>
      <Path path={parts.body}>
        <LinearGradient
          start={vec(-gr, 0)}
          end={vec(gr, 0)}
          colors={[METAL_LO, METAL_HI, METAL_MID, METAL_LO]}
          positions={[0, 0.28, 0.55, 1]}
        />
      </Path>
      <Path path={parts.ring} color={WAVE} opacity={0.65} />
      <Circle cx={0} cy={0} r={gr}>
        <RadialGradient
          c={vec(-gr * 0.35, -gr * 0.4)}
          r={gr * 1.9}
          colors={['#dde0e7', '#8a8c94', '#33343c']}
        />
      </Circle>
      <Path path={parts.mesh} color="#101116" style="stroke" strokeWidth={Math.max(0.6, gr * 0.07)} opacity={0.55} />
      <Circle cx={-gr * 0.34} cy={-gr * 0.4} r={gr * 0.3} color="#ffffff" opacity={0.4}>
        <BlurMask blur={gr * 0.28} style="normal" />
      </Circle>
    </Group>
  );
}

/** Slim pencil-condenser mic, LOCAL: capsule tip at origin, body toward +y. */
function buildPencilMic(w2: number, len: number): SkPathT {
  const p = Skia.Path.Make();
  const capL = len * 0.26;
  // Capsule (slightly narrower), rounded nose.
  p.moveTo(-w2 * 0.8, capL);
  p.lineTo(-w2 * 0.8, w2);
  p.quadTo(-w2 * 0.8, 0, 0, 0);
  p.quadTo(w2 * 0.8, 0, w2 * 0.8, w2);
  p.lineTo(w2 * 0.8, capL);
  p.close();
  // Body: a stadium behind the capsule.
  p.addRRect(Skia.RRectXY(Skia.XYWHRect(-w2, capL, w2 * 2, len - capL), w2, w2));
  return p;
}

function PencilMic({ x, y, angleDeg, scale = 1 }: { x: number; y: number; angleDeg: number; scale?: number }) {
  const w2 = 4.6 * scale;
  const len = 30 * scale;
  const path = useMemo(() => buildPencilMic(w2, len), [w2, len]);
  return (
    <Group transform={[{ translateX: x }, { translateY: y }, { rotate: (angleDeg * Math.PI) / 180 }]}>
      <Path path={path}>
        <LinearGradient
          start={vec(-w2, 0)}
          end={vec(w2, 0)}
          colors={[METAL_LO, METAL_HI, METAL_MID, METAL_LO]}
          positions={[0, 0.3, 0.55, 1]}
        />
      </Path>
      <SkLine
        p1={{ x: -w2 * 0.8, y: len * 0.26 }}
        p2={{ x: w2 * 0.8, y: len * 0.26 }}
        color={WAVE}
        strokeWidth={1.1 * scale}
        opacity={0.7}
      />
    </Group>
  );
}

/** Gripping hand (fist) silhouette around a vertical mic body at (x, y). */
function fistPath(x: number, y: number, s: number): SkPathT {
  const p = Skia.Path.Make();
  // Palm: on the right of the body.
  p.addOval(Skia.XYWHRect(x - 2 * s, y - 13 * s, 22 * s, 27 * s));
  // Four fingers wrapping across the body.
  for (let i = 0; i < 4; i++) {
    const fy = y - 11 * s + i * 6.6 * s;
    p.addRRect(Skia.RRectXY(Skia.XYWHRect(x - 17 * s, fy, 27 * s, 5.4 * s), 2.7 * s, 2.7 * s));
  }
  // Thumb hooking up the near side.
  p.addOval(Skia.XYWHRect(x + 7 * s, y - 18 * s, 7.5 * s, 15 * s));
  return p;
}

function Fist({ x, y, scale, tint }: { x: number; y: number; scale: number; tint: string }) {
  const path = useMemo(() => fistPath(x, y, scale), [x, y, scale]);
  return (
    <>
      <Path path={path}>
        <LinearGradient
          start={vec(x - 17 * scale, y - 18 * scale)}
          end={vec(x + 16 * scale, y + 16 * scale)}
          colors={[SKIN_HI, SKIN_LO]}
        />
      </Path>
      <Path path={path} color={tint} style="stroke" strokeWidth={1.5} opacity={0.85} />
    </>
  );
}

/** Subtle edge vignette so scenes don't float on flat black. Render last on
 *  scene canvases (not over data maps). */
function Vignette({ w, h }: { w: number; h: number }) {
  const rect = useMemo(() => {
    const p = Skia.Path.Make();
    p.addRect(Skia.XYWHRect(0, 0, w, h));
    return p;
  }, [w, h]);
  return (
    <Path path={rect}>
      <RadialGradient
        c={vec(w / 2, h / 2)}
        r={Math.max(w, h) * 0.72}
        colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0)', 'rgba(0,0,0,0.30)']}
        positions={[0, 0.6, 1]}
      />
    </Path>
  );
}

/** Floor strip: gradient ground + edge line for scene depth. */
function Floor({ w, y, h }: { w: number; y: number; h: number }) {
  const rect = useMemo(() => {
    const p = Skia.Path.Make();
    p.addRect(Skia.XYWHRect(0, y, w, h));
    return p;
  }, [w, y, h]);
  return (
    <>
      <Path path={rect}>
        <LinearGradient start={vec(0, y)} end={vec(0, y + h)} colors={['#17181d', '#0d0d10']} />
      </Path>
      <SkLine p1={{ x: 0, y }} p2={{ x: w, y }} color="#2a2b32" strokeWidth={1.2} />
    </>
  );
}

/** Glow + crisp double-stroke for a styled curve. */
function GlowStroke({
  path,
  color,
  width = 2.4,
  opacity = 1,
}: {
  path: SkPathT | SharedValue<SkPathT>;
  color: string;
  width?: number;
  opacity?: number;
}) {
  return (
    <>
      <Path path={path} color={color} style="stroke" strokeWidth={width * 2.6} opacity={0.22 * opacity}>
        <BlurMask blur={width * 2.2} style="normal" />
      </Path>
      <Path path={path} color={color} style="stroke" strokeWidth={width} opacity={opacity} />
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 1 · Polar Pattern Viewer — drag the source around the mic

export function PolarPatternView({
  phase,
  width,
  height = 230,
  a,
  b,
  srcAngleDeg,
}: {
  phase: SharedValue<number>;
  width: number;
  height?: number;
  a: number;
  b: number;
  /** Source angle: 0° = the mic's front (up); clockwise positive. */
  srcAngleDeg: number;
}) {
  const w = width;
  const h = height;
  const cx = w / 2;
  const cy = h / 2;
  const R = Math.min(w, h) / 2 - 16;

  const grid = useMemo(() => {
    const p = Skia.Path.Make();
    for (const f of [1, 0.66, 0.33]) p.addCircle(cx, cy, R * f);
    p.moveTo(cx - R, cy);
    p.lineTo(cx + R, cy);
    p.moveTo(cx, cy - R);
    p.lineTo(cx, cy + R);
    return p;
  }, [cx, cy, R]);

  const pattern = useMemo(() => {
    const p = Skia.Path.Make();
    for (let i = 0; i <= 180; i++) {
      const th = (i / 180) * 2 * Math.PI;
      const r = R * 0.92 * polarGain(a, b, th);
      const x = cx + r * Math.sin(th);
      const y = cy - r * Math.cos(th);
      if (i === 0) p.moveTo(x, y);
      else p.lineTo(x, y);
    }
    p.close();
    return p;
  }, [cx, cy, R, a, b]);

  // Source position + its pickup gain (plain JS — captured by the worklet).
  const thSrc = (srcAngleDeg * Math.PI) / 180;
  const sx = cx + R * Math.sin(thSrc);
  const sy = cy - R * Math.cos(thSrc);
  const gain = polarGain(a, b, thSrc);
  const faceAngle = Math.atan2(cy - sy, cx - sx); // head faces the mic

  const pickupLine = useMemo(() => {
    const p = Skia.Path.Make();
    p.moveTo(sx, sy);
    p.lineTo(cx, cy);
    return p;
  }, [sx, sy, cx, cy]);

  // Ripples traveling source → mic (phase-continuous).
  const ripples = useDerivedValue(() => {
    const ph = phase.value;
    const p = Skia.Path.Make();
    const dist = Math.hypot(sx - cx, sy - cy);
    for (let i = 0; i < 3; i++) {
      const f = (ph / (2 * Math.PI) + i / 3) % 1;
      p.addCircle(sx, sy, 6 + f * dist);
    }
    return p;
  }, [phase, sx, sy, cx, cy]);

  return (
    <Canvas style={{ width: w, height: h, backgroundColor: BG }}>
      {/* Ambient depth behind the plot. */}
      <Circle cx={cx} cy={cy} r={R}>
        <RadialGradient c={vec(cx, cy)} r={R} colors={['#15161c', BG]} />
      </Circle>
      <Path path={grid} color={GRID} style="stroke" strokeWidth={1} />
      <Path path={ripples} color={PARTICLE} style="stroke" strokeWidth={1.2} opacity={0.28} />
      {/* Pattern: gradient-filled lobe + glow stroke (abstract data, styled). */}
      <Path path={pattern}>
        <RadialGradient
          c={vec(cx, cy)}
          r={R}
          colors={[withAlpha(WAVE, 0.26), withAlpha(WAVE, 0.03)]}
        />
      </Path>
      <GlowStroke path={pattern} color={WAVE} width={2.4} />
      {/* Pickup line, weight fading with gain (same opacity law as before). */}
      <Path
        path={pickupLine}
        color={ACCENT_GREEN}
        style="stroke"
        strokeWidth={2}
        opacity={0.25 + 0.75 * gain}
      />
      {/* The mic itself, front axis up. */}
      <HandheldMic x={cx} y={cy - 6} angleDeg={0} grilleR={8} bodyLen={22} />
      {/* The source: a head in profile, mouth toward the mic. */}
      <ProfileHead x={sx} y={sy} angleRad={faceAngle} scale={0.4} tint={ACCENT_GREEN} glow />
      <Vignette w={w} h={h} />
    </Canvas>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 2 · Distance — wavefronts, working distance, direct vs room

export function DistanceView({
  phase,
  width,
  height = 150,
  dist01,
}: {
  phase: SharedValue<number>;
  width: number;
  height?: number;
  /** 0 = closest working distance · 1 = far. */
  dist01: number;
}) {
  const w = width;
  const h = height;
  const mid = h / 2;
  const srcX = 22;
  const micX = 64 + dist01 * (w - 110);

  const fronts = useDerivedValue(() => {
    const ph = phase.value;
    const p = Skia.Path.Make();
    const maxR = w - 36;
    for (let i = 0; i < 4; i++) {
      const f = (ph / (2 * Math.PI) + i / 4) % 1;
      const r = 10 + f * maxR;
      // Forward-facing arcs only (a mouth radiates ahead).
      p.addArc({ x: srcX - r, y: mid - r, width: 2 * r, height: 2 * r }, -64, 128);
    }
    return p;
  }, [phase, srcX, mid, w]);

  return (
    <Canvas style={{ width: w, height: h, backgroundColor: BG }}>
      <Floor w={w} y={h - 16} h={16} />
      <Path path={fronts} color={WAVE} style="stroke" strokeWidth={4} opacity={0.12}>
        <BlurMask blur={4} style="normal" />
      </Path>
      <Path path={fronts} color={PARTICLE} style="stroke" strokeWidth={1.3} opacity={0.42} />
      {/* Talker in profile, mouth at the wavefront origin. */}
      <ProfileHead x={srcX} y={mid} angleRad={0} scale={0.52} tint={CONE} />
      {/* The mic at working distance, grille facing the talker. */}
      <HandheldMic x={micX} y={mid} angleDeg={-90} grilleR={9} bodyLen={26} />
      <Vignette w={w} h={h} />
    </Canvas>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 3 · Proximity effect — the LF shelf that appears as you move in

/** Illustrative proximity boost curve (dB at f for a given boost setting). */
export function proximityDb(f: number, boostDb: number): number {
  if (f >= 220) return 0;
  const x = Math.min(1, Math.log2(220 / f) / 2.2); // 0 at 220 Hz → 1 near 48 Hz
  return boostDb * x;
}

export function ResponseCurveView({
  width,
  height = 132,
  dbAt,
  color = WAVE,
  floorDb = -14,
  ceilDb = 14,
}: {
  width: number;
  height?: number;
  /** dB at frequency (40..16k) — the illustrative model to draw. */
  dbAt: (f: number) => number;
  color?: string;
  floorDb?: number;
  ceilDb?: number;
}) {
  const w = width;
  const h = height;
  const fLo = 40;
  const fHi = 16000;
  const xOf = (f: number) => (Math.log(f / fLo) / Math.log(fHi / fLo)) * w;
  const yOf = (db: number) => 8 + ((ceilDb - Math.max(floorDb, Math.min(ceilDb, db))) / (ceilDb - floorDb)) * (h - 16);

  const grid = useMemo(() => {
    const p = Skia.Path.Make();
    for (const f of [100, 1000, 10000]) {
      p.moveTo(xOf(f), 4);
      p.lineTo(xOf(f), h - 4);
    }
    return p;
  }, [w, h]);

  const { curve, under } = useMemo(() => {
    const c = Skia.Path.Make();
    const u = Skia.Path.Make();
    const N = 110;
    for (let i = 0; i <= N; i++) {
      const f = fLo * Math.pow(fHi / fLo, i / N);
      const y = yOf(dbAt(f));
      const x = i === 0 ? 0 : xOf(f);
      if (i === 0) {
        c.moveTo(0, y);
        u.moveTo(0, y);
      } else {
        c.lineTo(x, y);
        u.lineTo(x, y);
      }
    }
    u.lineTo(w, h);
    u.lineTo(0, h);
    u.close();
    return { curve: c, under: u };
  }, [w, h, dbAt]);

  return (
    <Canvas style={{ width: w, height: h, backgroundColor: BG }}>
      <Path path={grid} color={GHOST} style="stroke" strokeWidth={1} />
      <SkLine p1={{ x: 0, y: yOf(0) }} p2={{ x: w, y: yOf(0) }} color={GRID} strokeWidth={1.2} />
      {/* Gradient underfill lifts the curve off black (abstract, styled). */}
      <Path path={under}>
        <LinearGradient start={vec(0, 0)} end={vec(0, h)} colors={[withAlpha(color, 0.26), withAlpha(color, 0.02)]} />
      </Path>
      <GlowStroke path={curve} color={color} width={2.4} />
    </Canvas>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 4 · Off-axis — the mic turned away from the source

/** Illustrative off-axis response: broadband polar loss + growing HF rolloff. */
export function offAxisDb(f: number, angleDeg: number): number {
  const th = (angleDeg * Math.PI) / 180;
  const broadband = 20 * Math.log10(Math.max(0.07, polarGain(0.5, 0.5, th)));
  const hfCut = -(angleDeg / 180) * 9; // extra HF loss, grows with angle
  const hfMix = f <= 2000 ? 0 : Math.min(1, Math.log2(f / 2000) / 3);
  return broadband + hfCut * hfMix;
}

export function OffAxisMicView({
  width,
  height = 96,
  angleDeg,
}: {
  width: number;
  height?: number;
  angleDeg: number;
}) {
  const w = width;
  const h = height;
  const mid = h / 2;
  const srcX = 24;
  const micX = w - 60;

  const arrow = useMemo(() => {
    const p = Skia.Path.Make();
    p.moveTo(srcX + 14, mid);
    p.lineTo(micX - 26, mid);
    p.moveTo(micX - 34, mid - 5);
    p.lineTo(micX - 26, mid);
    p.lineTo(micX - 34, mid + 5);
    return p;
  }, [srcX, micX, mid]);

  return (
    <Canvas style={{ width: w, height: h, backgroundColor: BG }}>
      <Floor w={w} y={h - 10} h={10} />
      <GlowStroke path={arrow} color={WAVE} width={1.8} opacity={0.8} />
      <ProfileHead x={srcX} y={mid} angleRad={0} scale={0.42} tint={CONE} />
      {/* Mic rotated: at 0° the grille faces the incoming sound (left). */}
      <HandheldMic x={micX} y={mid} angleDeg={-90 + angleDeg} grilleR={8} bodyLen={24} />
      <Vignette w={w} h={h} />
    </Canvas>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 5 · Pop filter — plosive bursts vs the barrier family

export const POP_MODES: { key: string; label: string; pass: number }[] = [
  { key: 'none', label: 'NO PROTECTION', pass: 1 },
  { key: 'pop', label: 'POP FILTER', pass: 0.3 },
  { key: 'foam', label: 'FOAM', pass: 0.5 },
  { key: 'blimp', label: 'SHOTGUN WINDSHIELD', pass: 0.12 },
];

export function PopFilterView({
  phase,
  width,
  height = 150,
  mode,
}: {
  phase: SharedValue<number>;
  width: number;
  height?: number;
  mode: 'none' | 'pop' | 'foam' | 'blimp';
}) {
  const w = width;
  const h = height;
  const mid = h / 2;
  const srcX = 24;
  const micX = w - 42;
  const barX = srcX + (micX - srcX) * 0.62;
  const pass = mode === 'none' ? 1 : mode === 'pop' ? 0.3 : mode === 'foam' ? 0.5 : 0.12;
  const gx = micX + 2; // grille center

  const gear = useMemo(() => {
    const hoop = Skia.Path.Make();
    const hoopMesh = Skia.Path.Make();
    const foam = Skia.Path.Make();
    const blimp = Skia.Path.Make();
    const blimpRibs = Skia.Path.Make();
    if (mode === 'pop') {
      // Hoop with visible mesh + gooseneck.
      hoop.addCircle(barX, mid, 26);
      hoop.addCircle(barX, mid, 22.5);
      for (let i = -3; i <= 3; i++) {
        const off = i * 6.4;
        const half = Math.sqrt(Math.max(0, 22.5 * 22.5 - off * off));
        hoopMesh.moveTo(barX + off, mid - half);
        hoopMesh.lineTo(barX + off, mid + half);
        hoopMesh.moveTo(barX - half, mid + off);
        hoopMesh.lineTo(barX + half, mid + off);
      }
      hoop.moveTo(barX, mid + 26);
      hoop.quadTo(barX + 4, mid + 44, barX + 18, h - 4); // gooseneck
    } else if (mode === 'foam') {
      // Sculpted foam windscreen hugging the grille: soft blobby silhouette.
      foam.moveTo(gx - 17, mid);
      foam.cubicTo(gx - 18, mid - 12, gx - 9, mid - 19, gx + 1, mid - 18);
      foam.cubicTo(gx + 11, mid - 19, gx + 18, mid - 11, gx + 17, mid - 1);
      foam.cubicTo(gx + 18, mid + 10, gx + 10, mid + 19, gx, mid + 18);
      foam.cubicTo(gx - 10, mid + 19, gx - 17, mid + 11, gx - 17, mid);
      foam.close();
    } else if (mode === 'blimp') {
      // Slotted blimp shell surrounding the whole mic.
      blimp.addRRect(Skia.RRectXY(Skia.XYWHRect(gx - 32, mid - 24, 60, 48), 24, 24));
      for (const t of [-0.55, 0, 0.55]) {
        blimpRibs.addOval(Skia.XYWHRect(gx - 32 + 6, mid + t * 24 - 3.4, 48, 6.8));
      }
    }
    return { hoop, hoopMesh, foam, blimp, blimpRibs };
  }, [srcX, micX, barX, mid, mode, gx, h]);

  // The sound itself (a small steady wave) ALWAYS passes — wind is the enemy.
  const sound = useDerivedValue(() => {
    const ph = phase.value;
    const p = Skia.Path.Make();
    const N = 60;
    for (let i = 0; i <= N; i++) {
      const x = srcX + 12 + (i / N) * (micX - srcX - 20);
      const y = mid - 5 * Math.sin((i / N) * 2 * Math.PI * 3 - ph);
      if (i === 0) p.moveTo(x, y);
      else p.lineTo(x, y);
    }
    return p;
  }, [phase, srcX, micX, mid]);

  // Plosive puffs: a particle cluster launched each cycle; blocked at the
  // barrier (only `pass` of the energy continues, spread wider).
  const puffs = useDerivedValue(() => {
    const ph = phase.value;
    const p = Skia.Path.Make();
    const f = (ph / (2 * Math.PI)) % 1; // 0..1 along the flight
    const x = srcX + 12 + f * (micX - srcX - 16);
    const blockAt = mode === 'none' ? 1e9 : mode === 'pop' ? barX : micX - 12;
    for (let i = 0; i < 7; i++) {
      const spread = 4 + f * 18 + (i % 3) * 3;
      const yy = mid + (i - 3) * (spread / 3);
      if (x <= blockAt) {
        p.addCircle(x, yy, 2.2);
      } else {
        // Past the barrier: only a fraction continues (drawn smaller/fewer).
        if (i / 7 < pass) p.addCircle(x, yy, 1.6);
      }
    }
    return p;
  }, [phase, srcX, micX, barX, mid, mode, pass]);

  return (
    <Canvas style={{ width: w, height: h, backgroundColor: BG }}>
      <Floor w={w} y={h - 12} h={12} />
      <GlowStroke path={sound} color={WAVE} width={1.6} opacity={0.6} />
      {/* Wind puffs: soft-glowing air, not sound. */}
      <Path path={puffs} color={ACCENT_BLUE} opacity={0.4}>
        <BlurMask blur={3.5} style="normal" />
      </Path>
      <Path path={puffs} color={ACCENT_BLUE} />
      <ProfileHead x={srcX} y={mid} angleRad={0} scale={0.5} tint={CONE} />
      <HandheldMic x={gx} y={mid} angleDeg={-90} grilleR={9} bodyLen={24} />
      {mode === 'pop' ? (
        <>
          <Path path={gear.hoopMesh} color={PARTICLE} style="stroke" strokeWidth={0.8} opacity={0.4} />
          <Path path={gear.hoop} color={METAL_MID} style="stroke" strokeWidth={2}>
            <LinearGradient start={vec(barX - 26, mid - 26)} end={vec(barX + 26, mid + 26)} colors={[METAL_HI, METAL_LO]} />
          </Path>
        </>
      ) : null}
      {mode === 'foam' ? (
        <>
          <Path path={gear.foam} opacity={0.94}>
            <RadialGradient c={vec(gx - 6, mid - 7)} r={30} colors={['#4a4133', '#241f18']} />
          </Path>
          <Path path={gear.foam} color="#6b5f49" style="stroke" strokeWidth={1.4} opacity={0.8} />
        </>
      ) : null}
      {mode === 'blimp' ? (
        <>
          <Path path={gear.blimp} opacity={0.3}>
            <LinearGradient start={vec(gx - 32, mid - 24)} end={vec(gx + 28, mid + 24)} colors={[METAL_HI, METAL_LO]} />
          </Path>
          <Path path={gear.blimpRibs} color={PARTICLE} style="stroke" strokeWidth={1} opacity={0.45} />
          <Path path={gear.blimp} color={METAL_MID} style="stroke" strokeWidth={1.8} />
        </>
      ) : null}
      <Vignette w={w} h={h} />
    </Canvas>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 6 · Shock mount — vibration up the stand

export function ShockMountView({
  phase,
  width,
  height = 170,
  shockMount,
}: {
  phase: SharedValue<number>;
  width: number;
  height?: number;
  shockMount: boolean;
}) {
  const w = width;
  const h = height;
  const cx = w / 2;
  const floorY = h - 14;
  const topY = 34;
  const damp = shockMount ? 0.15 : 0.9;

  // The stand column: full vibration at the floor, `damp` of it at the mic.
  const stand = useDerivedValue(() => {
    const ph = phase.value;
    const base = 5 * Math.sin(ph * 1.9);
    const p = Skia.Path.Make();
    const N = 12;
    for (let i = 0; i <= N; i++) {
      const f = i / N;
      const y = floorY - f * (floorY - topY - 18);
      const off = base * (1 - f) + base * damp * f;
      if (i === 0) p.moveTo(cx + off, y);
      else p.lineTo(cx + off, y);
    }
    // Tripod legs riding the base offset.
    p.moveTo(cx + base - 26, floorY);
    p.lineTo(cx + base, floorY - 16);
    p.lineTo(cx + base + 26, floorY);
    return p;
  }, [phase, cx, floorY, topY, damp]);

  // Mic assembly (body + grille) riding the damped top of the stand.
  const micBody = useDerivedValue(() => {
    const ph = phase.value;
    const base = 5 * Math.sin(ph * 1.9);
    const micOff = base * damp;
    const p = Skia.Path.Make();
    p.addRRect(Skia.RRectXY(Skia.XYWHRect(cx + micOff - 9, topY - 20, 18, 38), 8, 8));
    p.addCircle(cx + micOff, topY - 24, 9);
    return p;
  }, [phase, cx, topY, damp]);

  // Elastic cradle: suspension ring + visible bands (shock mount only).
  const cradle = useDerivedValue(() => {
    const p = Skia.Path.Make();
    if (!shockMount) return p;
    const ph = phase.value;
    const base = 5 * Math.sin(ph * 1.9);
    const micOff = base * damp;
    const rx = 24;
    const ry = 30;
    const ringCx = cx + base * 0.55; // ring follows the stand more than the mic
    const ringCy = topY - 2;
    p.addOval(Skia.XYWHRect(ringCx - rx, ringCy - ry, rx * 2, ry * 2));
    // Elastic bands: ring → mic body (they stretch as the two move apart).
    for (const t of [-0.8, -0.3, 0.3, 0.8]) {
      const bandY = ringCy + t * ry * 0.86;
      const edge = rx * Math.sqrt(Math.max(0, 1 - Math.pow((bandY - ringCy) / ry, 2)));
      p.moveTo(ringCx - edge, bandY);
      p.lineTo(cx + micOff - 9, bandY);
      p.moveTo(ringCx + edge, bandY);
      p.lineTo(cx + micOff + 9, bandY);
    }
    return p;
  }, [phase, cx, topY, damp, shockMount]);

  const arrows = useMemo(() => {
    const p = Skia.Path.Make();
    for (const s of [-1, 1]) {
      p.moveTo(cx + s * 34, floorY - 12);
      p.lineTo(cx + s * 22, floorY - 8);
      p.moveTo(cx + s * 34, floorY - 4);
      p.lineTo(cx + s * 22, floorY - 8);
    }
    return p;
  }, [cx, floorY]);

  return (
    <Canvas style={{ width: w, height: h, backgroundColor: BG }}>
      <Floor w={w} y={floorY} h={h - floorY} />
      {/* Vibration source cue at the base. */}
      <GlowStroke path={arrows} color={ACCENT_RED} width={2} opacity={0.85} />
      <Path path={stand} style="stroke" strokeWidth={5} strokeJoin="round" strokeCap="round">
        <LinearGradient start={vec(cx - 6, 0)} end={vec(cx + 6, 0)} colors={[METAL_HI, METAL_LO]} />
      </Path>
      <Path path={cradle} color={ACCENT_GREEN} style="stroke" strokeWidth={2} opacity={0.9} />
      <Path path={micBody}>
        <LinearGradient start={vec(cx - 10, 0)} end={vec(cx + 10, 0)} colors={[METAL_LO, METAL_HI, METAL_LO]} positions={[0, 0.35, 1]} />
      </Path>
      <Path path={micBody} color="#565a66" style="stroke" strokeWidth={1} opacity={0.7} />
      <Vignette w={w} h={h} />
    </Canvas>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 7 · Stereo techniques — XY · ORTF · AB · Mid-Side

export type StereoTech = 'xy' | 'ortf' | 'ab' | 'ms';

export function StereoTechniqueView({
  width,
  height = 190,
  tech,
}: {
  width: number;
  height?: number;
  tech: StereoTech;
}) {
  const w = width;
  const h = height;
  const cx = w / 2;
  const cy = h * 0.68;

  const layout = useMemo(() => {
    const R = h * 0.52;
    const mics: { x: number; y: number; ang: number }[] = [];
    const wedges: { x: number; y: number; path: SkPathT }[] = [];
    const chrome = Skia.Path.Make();
    const lobes: { x: number; y: number; r: number }[] = [];
    const wedge = (x: number, y: number, angDeg: number, spreadDeg: number) => {
      const p = Skia.Path.Make();
      p.moveTo(x, y);
      const a0 = ((angDeg - spreadDeg / 2 - 90) * Math.PI) / 180;
      const a1 = ((angDeg + spreadDeg / 2 - 90) * Math.PI) / 180;
      const N = 14;
      for (let i = 0; i <= N; i++) {
        const a = a0 + ((a1 - a0) * i) / N;
        p.lineTo(x + R * Math.cos(a), y + R * Math.sin(a));
      }
      p.close();
      wedges.push({ x, y, path: p });
    };
    if (tech === 'xy') {
      mics.push({ x: cx, y: cy, ang: -45 }, { x: cx, y: cy, ang: 45 });
      wedge(cx, cy, -45, 70);
      wedge(cx, cy, 45, 70);
    } else if (tech === 'ortf') {
      mics.push({ x: cx - 20, y: cy, ang: -55 }, { x: cx + 20, y: cy, ang: 55 });
      wedge(cx - 20, cy, -55, 70);
      wedge(cx + 20, cy, 55, 70);
      // Spacing bracket (≈17 cm).
      chrome.moveTo(cx - 20, cy + 22);
      chrome.lineTo(cx + 20, cy + 22);
      chrome.moveTo(cx - 20, cy + 18);
      chrome.lineTo(cx - 20, cy + 26);
      chrome.moveTo(cx + 20, cy + 18);
      chrome.lineTo(cx + 20, cy + 26);
    } else if (tech === 'ab') {
      mics.push({ x: cx - 62, y: cy, ang: 0 }, { x: cx + 62, y: cy, ang: 0 });
      wedge(cx - 62, cy, 0, 80);
      wedge(cx + 62, cy, 0, 80);
      chrome.moveTo(cx - 62, cy + 22);
      chrome.lineTo(cx + 62, cy + 22);
      chrome.moveTo(cx - 62, cy + 18);
      chrome.lineTo(cx - 62, cy + 26);
      chrome.moveTo(cx + 62, cy + 18);
      chrome.lineTo(cx + 62, cy + 26);
    } else {
      // Mid-Side: cardioid forward + figure-8 sideways at one point.
      mics.push({ x: cx, y: cy - 6, ang: 0 });
      wedge(cx, cy - 6, 0, 80);
      lobes.push({ x: cx - 26, y: cy + 10, r: 22 }, { x: cx + 26, y: cy + 10, r: 22 });
      // The side (figure-8) element: a small horizontal capsule.
      chrome.addRRect(Skia.RRectXY(Skia.XYWHRect(cx - 14, cy + 6, 28, 8), 4, 4));
    }
    return { mics, wedges, chrome, lobes, R };
  }, [cx, cy, h, tech]);

  const stage = useMemo(() => {
    const p = Skia.Path.Make();
    p.addRect(Skia.XYWHRect(0, 0, w, 24));
    return p;
  }, [w]);
  const performers = useMemo(() => {
    const p = Skia.Path.Make();
    for (const fx of [0.3, 0.5, 0.7]) appendBust(p, w * fx, 23, 1.15);
    return p;
  }, [w]);

  return (
    <Canvas style={{ width: w, height: h, backgroundColor: BG }}>
      {/* The stage the pair is aimed at — with performers, not a bare line. */}
      <Path path={stage}>
        <LinearGradient start={vec(0, 0)} end={vec(0, 24)} colors={['#1c1d24', '#111116']} />
      </Path>
      <Path path={performers}>
        <LinearGradient start={vec(0, 4)} end={vec(0, 24)} colors={['#4a4d58', '#26272e']} />
      </Path>
      <SkLine p1={{ x: 0, y: 24 }} p2={{ x: w, y: 24 }} color={withAlpha(WAVE, 0.4)} strokeWidth={1.2} />
      {/* Pickup areas: soft gradient wedges (abstract, styled). */}
      {layout.wedges.map((wd, i) => (
        <Path key={i} path={wd.path}>
          <RadialGradient c={vec(wd.x, wd.y)} r={layout.R} colors={[withAlpha(WAVE, 0.22), withAlpha(WAVE, 0)]} />
        </Path>
      ))}
      {layout.wedges.map((wd, i) => (
        <Path key={`s${i}`} path={wd.path} color={WAVE} style="stroke" strokeWidth={1.1} opacity={0.4} />
      ))}
      {/* Mid-Side fig-8 lobes. */}
      {layout.lobes.map((lb, i) => (
        <Circle key={i} cx={lb.x} cy={lb.y} r={lb.r}>
          <RadialGradient c={vec(lb.x, lb.y)} r={lb.r} colors={[withAlpha(ACCENT_BLUE, 0.22), withAlpha(ACCENT_BLUE, 0.02)]} />
        </Circle>
      ))}
      {layout.lobes.map((lb, i) => (
        <Circle key={`s${i}`} cx={lb.x} cy={lb.y} r={lb.r} color={ACCENT_BLUE} style="stroke" strokeWidth={1.2} opacity={0.5} />
      ))}
      <Path path={layout.chrome} color={CONE} style="stroke" strokeWidth={2} />
      {layout.mics.map((m, i) => (
        <PencilMic key={i} x={m.x} y={m.y} angleDeg={m.ang} scale={1.1} />
      ))}
      <Vignette w={w} h={h} />
    </Canvas>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 8 · Hand placement — mic · polar · response, synchronized (the cupping star)

/** Morph params for a hand at pos01 (0 = correct grip … 1 = full cup). */
export function cupMorph(pos01: number): { a: number; b: number; ripple: number; sever: number } {
  const t = Math.max(0, Math.min(1, pos01));
  const c = Math.max(0, (t - 0.35) / 0.65); // port interference begins ~0.35
  const b = 0.5 - 0.45 * c; // cardioid → omni-ish
  const a = 1 - b;
  // Irregularity peaks at the PARTIAL cup, settles as the cup completes.
  const ripple = 0.2 * Math.sin(Math.PI * Math.min(1, c * 1.35));
  return { a, b, ripple, sever: c };
}

/** Illustrative cupped-mic response: flat → peaks/dips as ports block. */
export function cupResponseDb(f: number, pos01: number): number {
  const { sever } = cupMorph(pos01);
  if (sever <= 0) return 0;
  const g = (fc: number, oct: number) => Math.exp(-Math.pow(Math.log2(f / fc) / oct, 2));
  return sever * (7 * g(900, 0.7) - 8 * g(3000, 0.6) + 6 * g(5500, 0.5) - 4 * g(12000, 0.8));
}

export function HandPlacementView({
  width,
  pos01,
}: {
  width: number;
  /** 0 = hand on the handle (correct) … 1 = full cup over the grille. */
  pos01: number;
}) {
  const w = width;
  const h = 216;
  const micX = w * 0.17;
  const { a, b, ripple } = cupMorph(pos01);
  const topY = 16;
  const botY = h - 16;
  const grilleY = topY + 16;

  // Panel 1 — the hand rides from the handle (bottom) to the grille (top).
  const yC = botY - 24 - pos01 * (botY - topY - 44);
  const cupArc = useMemo(() => {
    const p = Skia.Path.Make();
    if (pos01 > 0.8) {
      p.addArc({ x: micX - 21, y: grilleY - 21, width: 42, height: 42 }, 200, 140);
    }
    return p;
  }, [micX, grilleY, pos01]);

  // Panel 2 — the polar pattern (top right). pR sized so gain+ripple (≤1.2)
  // never clips the canvas top.
  const pcx = w * 0.63;
  const pcy = h * 0.28;
  const pR = h * 0.22;
  const polar = useMemo(() => {
    const p = Skia.Path.Make();
    for (let i = 0; i <= 150; i++) {
      const th = (i / 150) * 2 * Math.PI;
      const r = pR * Math.max(0.04, polarGain(a, b, th) + ripple * Math.cos(3 * th));
      const x = pcx + r * Math.sin(th);
      const y = pcy - r * Math.cos(th);
      if (i === 0) p.moveTo(x, y);
      else p.lineTo(x, y);
    }
    p.close();
    return p;
  }, [pcx, pcy, pR, a, b, ripple]);
  const polarRef = useMemo(() => {
    const p = Skia.Path.Make();
    for (let i = 0; i <= 120; i++) {
      const th = (i / 120) * 2 * Math.PI;
      const r = pR * polarGain(0.5, 0.5, th);
      const x = pcx + r * Math.sin(th);
      const y = pcy - r * Math.cos(th);
      if (i === 0) p.moveTo(x, y);
      else p.lineTo(x, y);
    }
    p.close();
    return p;
  }, [pcx, pcy, pR]);

  // Panel 3 — the response curve (bottom right).
  const ry0 = h * 0.58;
  const rh = h * 0.36;
  const rx0 = w * 0.38;
  const rw = w * 0.58;
  const { resp, respUnder } = useMemo(() => {
    const c = Skia.Path.Make();
    const u = Skia.Path.Make();
    const N = 90;
    for (let i = 0; i <= N; i++) {
      const f = 40 * Math.pow(400, i / N); // 40 Hz … 16 kHz
      const db = cupResponseDb(f, pos01);
      const y = ry0 + rh / 2 - (db / 10) * (rh / 2.4);
      const x = rx0 + (i / N) * rw;
      if (i === 0) {
        c.moveTo(x, y);
        u.moveTo(x, y);
      } else {
        c.lineTo(x, y);
        u.lineTo(x, y);
      }
    }
    u.lineTo(rx0 + rw, ry0 + rh);
    u.lineTo(rx0, ry0 + rh);
    u.close();
    return { resp: c, respUnder: u };
  }, [rx0, rw, ry0, rh, pos01]);

  const alarm = pos01 > 0.6;
  const liveColor = alarm ? ACCENT_RED : WAVE;

  return (
    <Canvas style={{ width: w, height: h, backgroundColor: BG }}>
      {/* Panel frames. */}
      <SkLine p1={{ x: w * 0.34, y: 8 }} p2={{ x: w * 0.34, y: h - 8 }} color={GHOST} strokeWidth={1.4} />
      <SkLine p1={{ x: w * 0.36, y: h * 0.53 }} p2={{ x: w - 6, y: h * 0.53 }} color={GHOST} strokeWidth={1.4} />
      {/* 1 · The mic — full handheld illustration — and the gripping hand. */}
      <HandheldMic x={micX} y={grilleY} angleDeg={0} grilleR={15} bodyLen={botY - grilleY - 26} />
      <Fist x={micX} y={yC} scale={1.05} tint={alarm ? ACCENT_RED : ACCENT_BLUE} />
      <GlowStroke path={cupArc} color={ACCENT_RED} width={5} opacity={0.9} />
      {/* 2 · Polar: intended (ghost) vs current, gradient-filled. */}
      <Path path={polarRef} color={GHOST} style="stroke" strokeWidth={1.6} />
      <Path path={polar}>
        <RadialGradient c={vec(pcx, pcy)} r={pR * 1.2} colors={[withAlpha(liveColor, 0.24), withAlpha(liveColor, 0.02)]} />
      </Path>
      <GlowStroke path={polar} color={liveColor} width={2.2} />
      {/* 3 · Response: reference zero + current with underfill. */}
      <SkLine p1={{ x: rx0, y: ry0 + rh / 2 }} p2={{ x: rx0 + rw, y: ry0 + rh / 2 }} color={GRID} strokeWidth={1.2} />
      <Path path={respUnder}>
        <LinearGradient start={vec(0, ry0)} end={vec(0, ry0 + rh)} colors={[withAlpha(liveColor, 0.2), withAlpha(liveColor, 0.02)]} />
      </Path>
      <GlowStroke path={resp} color={liveColor} width={2.2} />
    </Canvas>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 8b · Why it happens — the pressure-gradient cutaway

export function MicCutawayView({
  phase,
  width,
  height = 150,
  blocked,
}: {
  phase: SharedValue<number>;
  width: number;
  height?: number;
  blocked: boolean;
}) {
  const w = width;
  const h = height;
  const cx = w / 2;
  const capY = 44;

  const shellPath = useMemo(() => {
    const p = Skia.Path.Make();
    p.addRRect(Skia.RRectXY(Skia.XYWHRect(cx - 46, capY - 26, 92, 62), 14, 14));
    return p;
  }, [cx, capY]);

  const innards = useMemo(() => {
    const p = Skia.Path.Make();
    // Rear ports (the slots that make it directional).
    for (const dx of [-38, 38]) {
      p.addRRect(Skia.RRectXY(Skia.XYWHRect(cx + dx - 2, capY + 14, 4, 14), 2, 2));
    }
    // Internal acoustic path hint.
    p.moveTo(cx - 34, capY + 20);
    p.lineTo(cx - 8, capY - 4);
    p.moveTo(cx + 34, capY + 20);
    p.lineTo(cx + 8, capY - 4);
    return p;
  }, [cx, capY]);

  const diaphragm = useMemo(() => {
    const p = Skia.Path.Make();
    p.moveTo(cx - 26, capY - 8);
    p.lineTo(cx + 26, capY - 8);
    return p;
  }, [cx, capY]);

  // The cupping hand: a curved palm hugging the capsule (blocked state).
  const handBlock = useMemo(() => {
    const p = Skia.Path.Make();
    if (blocked) {
      p.addArc({ x: cx - 58, y: capY - 20, width: 116, height: 84 }, 140, 260);
      // Finger bumps riding the palm curve.
      for (const ang of [155, 205, 255, 305]) {
        const rad = (ang * Math.PI) / 180;
        const fx = cx + 58 * Math.cos(rad);
        const fy = capY + 22 + 42 * Math.sin(rad);
        p.addOval(Skia.XYWHRect(fx - 5, fy - 5, 10, 10));
      }
    }
    return p;
  }, [cx, capY, blocked]);

  // Animated entries: FRONT always arrives; REAR arrives only when open.
  const arrows = useDerivedValue(() => {
    const ph = phase.value;
    const f = (ph / (2 * Math.PI)) % 1;
    const p = Skia.Path.Make();
    // Front path: from above, down to the diaphragm.
    const fy = 6 + f * (capY - 22);
    p.addCircle(cx - 12, fy, 2.4);
    p.addCircle(cx + 12, fy + 4, 2.4);
    if (!blocked) {
      // Rear paths: up into the side ports.
      const ry = h - 10 - f * (h - 10 - (capY + 28));
      p.addCircle(cx - 38, ry, 2.4);
      p.addCircle(cx + 38, ry, 2.4);
    }
    return p;
  }, [phase, cx, capY, h, blocked]);

  const dotColor = blocked ? ACCENT_YELLOW : ACCENT_GREEN;
  return (
    <Canvas style={{ width: w, height: h, backgroundColor: BG }}>
      {/* Cutaway housing with a metal-form gradient. */}
      <Path path={shellPath}>
        <LinearGradient
          start={vec(cx - 46, capY - 26)}
          end={vec(cx + 46, capY + 36)}
          colors={['#33353e', '#191a20']}
        />
      </Path>
      <Path path={shellPath} color="#565a66" style="stroke" strokeWidth={1.8} />
      <Path path={innards} color={CONE} style="stroke" strokeWidth={1.8} opacity={0.85} />
      {/* Diaphragm: the live element, softly glowing. */}
      <GlowStroke path={diaphragm} color={WAVE} width={2.6} />
      <Path path={arrows} color={dotColor} opacity={0.4}>
        <BlurMask blur={3.5} style="normal" />
      </Path>
      <Path path={arrows} color={dotColor} />
      <Path path={handBlock} color={ACCENT_RED} style="stroke" strokeWidth={3} opacity={0.35}>
        <BlurMask blur={5} style="normal" />
      </Path>
      <Path path={handBlock} color={ACCENT_RED} style="stroke" strokeWidth={3} opacity={0.9} />
      <Vignette w={w} h={h} />
    </Canvas>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 9 · Common handheld mistakes — mini illustrations for the gallery

export type MistakeKind = 'correct' | 'grille' | 'cup' | 'away' | 'far' | 'switch' | 'antenna';

export function MistakeIllustration({
  width,
  height = 110,
  kind,
}: {
  width: number;
  height?: number;
  kind: MistakeKind;
}) {
  const w = width;
  const h = height;
  const cx = w / 2;

  const layout = useMemo(() => {
    // Mic anchor + angle per kind (same geometry family as the original).
    const micAt = (x: number, y: number, angDeg: number) => {
      const th = (angDeg * Math.PI) / 180;
      const dx = Math.sin(th);
      const dy = -Math.cos(th);
      return { gx: x + dx * 22, gy: y + dy * 22, ang: angDeg, x, y, dx, dy };
    };
    const far = kind === 'far';
    const head = far ? { x: cx - 62, y: 30 } : { x: cx - 46, y: 34 };
    const mic = far
      ? micAt(cx + 42, 78, -30)
      : kind === 'away'
        ? micAt(cx + 10, 62, 55)
        : micAt(cx + 6, 66, -35);
    // Hand position along the mic axis: handle grip vs at the grille.
    const atGrille = kind === 'grille' || kind === 'cup';
    const handF = atGrille ? 16 : kind === 'antenna' ? -26 : -8;
    const hand = { x: mic.x + mic.dx * handF, y: mic.y + mic.dy * handF };
    const extras = Skia.Path.Make();
    if (kind === 'cup') {
      extras.addArc({ x: mic.gx - 13, y: mic.gy - 13, width: 26, height: 26 }, 160, 220);
    }
    if (far) {
      // The gulf between mouth and mic: fading dots.
      for (let i = 1; i <= 5; i++) {
        const t = i / 6;
        extras.addCircle(head.x + 16 + t * (mic.gx - head.x - 26), head.y + 10 + t * (mic.gy - head.y - 8), 1.6);
      }
    }
    if (kind === 'antenna') {
      // Antenna stub past the base of the body.
      extras.moveTo(mic.x - mic.dx * 30, mic.y - mic.dy * 30);
      extras.lineTo(mic.x - mic.dx * 42, mic.y - mic.dy * 42);
    }
    const alert = Skia.Path.Make();
    if (kind === 'switch') {
      // The mute switch on the body, under the hand's reach.
      alert.addRRect(Skia.RRectXY(Skia.XYWHRect(mic.x - mic.dx * 4 - 5, mic.y - mic.dy * 4 - 4, 10, 8), 2.5, 2.5));
    }
    const badHand = kind === 'grille' || kind === 'cup' || kind === 'antenna';
    return { head, mic, hand, extras, alert, badHand };
  }, [cx, kind]);

  const good = kind === 'correct';
  const outline = good ? ACCENT_GREEN : CONE;
  return (
    <Canvas style={{ width: w, height: h, backgroundColor: BG }}>
      <Floor w={w} y={h - 8} h={8} />
      <ProfileHead x={layout.head.x} y={layout.head.y} angleRad={0} scale={0.44} tint={outline} glow={good} />
      <Path path={layout.extras} color={PARTICLE} style="stroke" strokeWidth={1.6} opacity={0.6} />
      <HandheldMic x={layout.mic.gx} y={layout.mic.gy} angleDeg={layout.mic.ang} grilleR={8} bodyLen={24} />
      <Fist
        x={layout.hand.x}
        y={layout.hand.y}
        scale={0.72}
        tint={layout.badHand ? ACCENT_RED : good ? ACCENT_GREEN : ACCENT_BLUE}
      />
      <GlowStroke path={layout.alert} color={ACCENT_RED} width={2} opacity={0.95} />
      <Vignette w={w} h={h} />
    </Canvas>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SPEAKER LAB · Top view — coverage map (CONCEPTUAL, never an SPL prediction)

export const DISPERSIONS: { key: string; label: string; hDeg: number; vDeg: number }[] = [
  { key: '60x40', label: '60° × 40°', hDeg: 60, vDeg: 40 },
  { key: '90x60', label: '90° × 60°', hDeg: 90, vDeg: 60 },
  { key: '100x100', label: '100° × 100°', hDeg: 100, vDeg: 100 },
  { key: '120x60', label: '120° × 60°', hDeg: 120, vDeg: 60 },
];

export type CoverageClass = 'red' | 'green' | 'yellow' | 'gray';

/** Conceptual level from one speaker to one point (top view). */
function topLevel(
  sx: number,
  sy: number,
  aimDeg: number,
  hDeg: number,
  px: number,
  py: number,
  refD: number,
  scale: number,
): number {
  const vx = px - sx;
  const vy = py - sy;
  const d = Math.max(12, Math.hypot(vx, vy));
  // Aim: 0° = straight into the audience (down the screen).
  const th = (aimDeg * Math.PI) / 180;
  const ax = Math.sin(th);
  const ay = Math.cos(th);
  const cosA = (vx * ax + vy * ay) / d;
  const ang = (Math.acos(Math.max(-1, Math.min(1, cosA))) * 180) / Math.PI;
  const half = hDeg / 2;
  const base = ang <= half ? 1 : ang <= half + 12 ? 0.5 : 0.08;
  return scale * base * Math.pow(refD / d, 1.5);
}

export function classifyCoverage(lvl: number): CoverageClass {
  if (lvl >= 1.7) return 'red';
  if (lvl >= 0.5) return 'green';
  if (lvl >= 0.26) return 'yellow';
  return 'gray';
}

/** Top-view PA cabinet: trapezoid box + face gradient + horn slot (local
 *  coords, front face toward +y — matching the aim convention). */
function CabinetTop({ x, y, aimDeg, small }: { x: number; y: number; aimDeg: number; small?: boolean }) {
  const s = small ? 0.62 : 1;
  const path = useMemo(() => {
    const p = Skia.Path.Make();
    const bw = 7.5 * s; // back half-width
    const fw = 11.5 * s; // front half-width
    const d = 17 * s; // depth
    p.moveTo(-bw, -d);
    p.lineTo(bw, -d);
    p.lineTo(fw, 0);
    p.lineTo(-fw, 0);
    p.close();
    return p;
  }, [s]);
  const horn = useMemo(() => {
    const p = Skia.Path.Make();
    p.addRRect(Skia.RRectXY(Skia.XYWHRect(-6.5 * s, -4.2 * s, 13 * s, 2.6 * s), 1.2 * s, 1.2 * s));
    return p;
  }, [s]);
  return (
    <Group transform={[{ translateX: x }, { translateY: y }, { rotate: (-aimDeg * Math.PI) / 180 }]}>
      <Path path={path}>
        <LinearGradient start={vec(-10 * s, -17 * s)} end={vec(10 * s, 0)} colors={[BODY_HI, BODY_LO]} />
      </Path>
      <Path path={path} color="#5a5e6a" style="stroke" strokeWidth={1.1} />
      <Path path={horn} color="#101116" />
    </Group>
  );
}

export function TopCoverageView({
  width,
  height = 250,
  spk1x01,
  spk1AimDeg,
  spk2On,
  spk2x01,
  spk2AimDeg,
  hDeg,
  frontFills,
}: {
  width: number;
  height?: number;
  spk1x01: number;
  spk1AimDeg: number;
  spk2On: boolean;
  spk2x01: number;
  spk2AimDeg: number;
  hDeg: number;
  frontFills: boolean;
}) {
  const w = width;
  const h = height;
  const stageH = 26;
  const audY0 = stageH + 8;
  const audH = h - audY0 - 8;

  const { cells, aims, spkList } = useMemo(() => {
    const refD = 0.55 * audH;
    const spks: { x: number; y: number; aim: number; hd: number; refD: number; scale: number; small?: boolean }[] = [
      { x: spk1x01 * (w - 40) + 20, y: stageH, aim: spk1AimDeg, hd: hDeg, refD, scale: 1 },
    ];
    if (spk2On) spks.push({ x: spk2x01 * (w - 40) + 20, y: stageH, aim: spk2AimDeg, hd: hDeg, refD, scale: 1 });
    if (frontFills) {
      for (const fx of [0.3, 0.7]) {
        spks.push({ x: fx * w, y: stageH, aim: 0, hd: 90, refD: 0.2 * audH, scale: 0.5, small: true });
      }
    }
    const paths: Record<CoverageClass, SkPathT> = {
      red: Skia.Path.Make(),
      green: Skia.Path.Make(),
      yellow: Skia.Path.Make(),
      gray: Skia.Path.Make(),
    };
    const COLS = 13;
    const ROWS = 14;
    const cw = w / COLS;
    const ch = audH / ROWS;
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const px = (c + 0.5) * cw;
        const py = audY0 + (r + 0.5) * ch;
        let lvl = 0;
        for (const s of spks) lvl += topLevel(s.x, s.y, s.aim, s.hd, px, py, s.refD, s.scale);
        paths[classifyCoverage(lvl)].addRRect(
          Skia.RRectXY(Skia.XYWHRect(c * cw + 1.2, audY0 + r * ch + 1.2, cw - 2.4, ch - 2.4), 2.5, 2.5),
        );
      }
    }
    // Aim cue lines, clamped into the canvas (kept absolute like before so an
    // edge speaker at hard aim keeps its cue).
    const aimPath = Skia.Path.Make();
    for (const s of spks) {
      const th = (s.aim * Math.PI) / 180;
      const dx = Math.sin(th);
      const dy = Math.cos(th);
      const L = s.small ? 26 : 46;
      aimPath.moveTo(s.x, s.y);
      aimPath.lineTo(Math.max(4, Math.min(w - 4, s.x + dx * L)), s.y + dy * L);
    }
    return { cells: paths, aims: aimPath, spkList: spks };
  }, [w, h, audY0, audH, spk1x01, spk1AimDeg, spk2On, spk2x01, spk2AimDeg, hDeg, frontFills]);

  const stage = useMemo(() => {
    const p = Skia.Path.Make();
    p.addRect(Skia.XYWHRect(0, 0, w, stageH));
    return p;
  }, [w]);
  const performers = useMemo(() => {
    const p = Skia.Path.Make();
    for (const fx of [0.42, 0.5, 0.58]) appendBust(p, w * fx, stageH - 3, 1);
    return p;
  }, [w]);

  return (
    <Canvas style={{ width: w, height: h, backgroundColor: BG }}>
      {/* Stage strip with depth + a hint of the band. */}
      <Path path={stage}>
        <LinearGradient start={vec(0, 0)} end={vec(0, stageH)} colors={['#20212a', '#131318']} />
      </Path>
      <Path path={performers}>
        <LinearGradient start={vec(0, 4)} end={vec(0, stageH)} colors={['#464956', '#23242c']} />
      </Path>
      {/* Coverage cells: rounded, soft (abstract data — styled, kept honest). */}
      <Path path={cells.gray} color="rgba(150,150,160,0.12)" />
      <Path path={cells.yellow} color="rgba(255,215,107,0.30)" />
      <Path path={cells.green} color="rgba(91,255,133,0.30)" />
      <Path path={cells.red} color="rgba(255,107,94,0.38)" />
      <SkLine p1={{ x: 0, y: stageH }} p2={{ x: w, y: stageH }} color={GRID} strokeWidth={1.5} />
      <GlowStroke path={aims} color={PARTICLE} width={1.6} opacity={0.8} />
      {spkList.map((s, i) => (
        <CabinetTop key={i} x={s.x} y={s.y} aimDeg={s.aim} small={s.small} />
      ))}
    </Canvas>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SPEAKER LAB · Side view — height, tilt, vertical coverage, delay concept

/** Side-view PA cabinet: rounded trapezoid, woofer cone + dust cap, horn slot.
 *  Local coords: front face toward +x; rotate = down-tilt. */
function CabinetSide({ x, y, tiltDeg, scale = 1 }: { x: number; y: number; tiltDeg: number; scale?: number }) {
  const s = scale;
  const box = useMemo(() => {
    const p = Skia.Path.Make();
    p.moveTo(-8 * s, -7 * s);
    p.lineTo(10.5 * s, -9 * s);
    p.quadTo(12 * s, -9 * s, 12 * s, -7.5 * s);
    p.lineTo(12 * s, 7.5 * s);
    p.quadTo(12 * s, 9 * s, 10.5 * s, 9 * s);
    p.lineTo(-8 * s, 7 * s);
    p.quadTo(-9.5 * s, 6.5 * s, -9.5 * s, 5 * s);
    p.lineTo(-9.5 * s, -5 * s);
    p.quadTo(-9.5 * s, -6.5 * s, -8 * s, -7 * s);
    p.close();
    return p;
  }, [s]);
  const horn = useMemo(() => {
    const p = Skia.Path.Make();
    p.addRRect(Skia.RRectXY(Skia.XYWHRect(6 * s, -6.6 * s, 4.6 * s, 4.4 * s), 1.2 * s, 1.2 * s));
    return p;
  }, [s]);
  return (
    <Group transform={[{ translateX: x }, { translateY: y }, { rotate: (tiltDeg * Math.PI) / 180 }]}>
      <Path path={box}>
        <LinearGradient start={vec(-9 * s, -9 * s)} end={vec(12 * s, 9 * s)} colors={[BODY_HI, BODY_LO]} />
      </Path>
      <Path path={box} color="#5a5e6a" style="stroke" strokeWidth={1.1} />
      {/* Woofer: radial-gradient cone + dust cap. */}
      <Circle cx={7.2 * s} cy={3 * s} r={4.6 * s}>
        <RadialGradient c={vec(6 * s, 1.6 * s)} r={7 * s} colors={['#787c88', '#26272e']} />
      </Circle>
      <Circle cx={7.2 * s} cy={3 * s} r={1.5 * s} color="#a7abb6" />
      <Path path={horn} color="#101116" />
    </Group>
  );
}

const SEAT_GRADS: Record<CoverageClass, [string, string]> = {
  green: ['#7dffa1', '#20713d'],
  yellow: ['#ffe08f', '#7d6526'],
  red: ['#ff8a7d', '#7c332c'],
  gray: ['#9a9ca6', '#3a3c44'],
};

export function SideCoverageView({
  width,
  height = 230,
  h01,
  tiltDeg,
  vDeg,
  stage01,
  ceil01,
  depth01,
  sloped,
  delayOn,
}: {
  width: number;
  height?: number;
  /** 0 = speaker at stage-top level … 1 = at the ceiling. */
  h01: number;
  /** Downward tilt in degrees (0 = firing level). */
  tiltDeg: number;
  vDeg: number;
  stage01: number;
  ceil01: number;
  depth01: number;
  sloped: boolean;
  delayOn: boolean;
}) {
  const w = width;
  const h = height;
  const floorY = h - 16;
  const ceilY = 18 + (1 - ceil01) * 42;
  const stageW = 44;
  const stageTop = floorY - (16 + stage01 * 34);
  const spkX = 30;
  const spkY = stageTop - 8 - h01 * Math.max(10, stageTop - 8 - (ceilY + 12));

  const geo = useMemo(() => {
    const axis = (tiltDeg * Math.PI) / 180;
    const half = ((vDeg / 2) * Math.PI) / 180;
    const L = w * 1.2;

    // Main coverage wedge: a filled fan, plus its center-axis cue.
    const wedgeFill = Skia.Path.Make();
    wedgeFill.moveTo(spkX, spkY);
    const N = 14;
    for (let i = 0; i <= N; i++) {
      const a = axis - half + ((2 * half) * i) / N;
      wedgeFill.lineTo(spkX + Math.cos(a) * L, spkY + Math.sin(a) * L);
    }
    wedgeFill.close();
    const axisLine = Skia.Path.Make();
    axisLine.moveTo(spkX, spkY);
    axisLine.lineTo(spkX + Math.cos(axis) * L, spkY + Math.sin(axis) * L);

    // Room lines.
    const room = Skia.Path.Make();
    room.moveTo(0, ceilY);
    room.lineTo(w, ceilY);

    // Stage block.
    const stage = Skia.Path.Make();
    stage.addRRect(Skia.RRectXY(Skia.XYWHRect(4, stageTop, stageW, floorY - stageTop), 3, 3));

    // Delay speaker (concept only): hung at ~60% depth, covering the rear.
    const audX0 = stageW + 26;
    const audW = depth01 * (w - audX0 - 14);
    const dlyX = audX0 + audW * 0.58;
    const dlyY = ceilY + 22;
    const delayWedge = Skia.Path.Make();
    if (delayOn) {
      // Fan between the two original delay-cone edges.
      const aA = Math.atan2(w * 0.34, w * 0.5); // shallow edge
      const aB = Math.atan2(w * 0.5, w * 0.16); // steep edge
      delayWedge.moveTo(dlyX, dlyY);
      const M = 10;
      for (let i = 0; i <= M; i++) {
        const a = aA + ((aB - aA) * i) / M;
        delayWedge.lineTo(dlyX + Math.cos(a) * w * 0.65, dlyY + Math.sin(a) * w * 0.65);
      }
      delayWedge.close();
    }

    // Seats: classified audience busts along the depth (SAME classification
    // math as always — only the drawing changed).
    const seatPaths: Record<CoverageClass, SkPathT> = {
      red: Skia.Path.Make(),
      green: Skia.Path.Make(),
      yellow: Skia.Path.Make(),
      gray: Skia.Path.Make(),
    };
    const NS = 9;
    for (let i = 0; i < NS; i++) {
      const sx = audX0 + ((i + 0.5) / NS) * audW;
      const rise = sloped ? (i / (NS - 1)) * 34 : 0;
      const hy = floorY - 14 - rise;
      const vx = sx - spkX;
      const vy = hy - spkY;
      const d = Math.hypot(vx, vy);
      const ang = Math.atan2(vy, vx); // downward positive
      const off = Math.abs(ang - axis);
      let cls: CoverageClass = off <= half ? 'green' : off <= half + (7 * Math.PI) / 180 ? 'yellow' : 'gray';
      // Hot zone: front rows blasted point-blank inside the core.
      if (cls === 'green' && d < w * 0.2) cls = 'red';
      // Delay speaker rescues the rear (concept only).
      if (delayOn && cls === 'gray' && sx > dlyX - 8) cls = 'green';
      appendBust(seatPaths[cls], sx, floorY - rise, 1.35);
    }
    return { wedgeFill, axisLine, room, stage, delayWedge, seats: seatPaths, dlyX, dlyY };
  }, [w, floorY, ceilY, stageTop, spkX, spkY, tiltDeg, vDeg, depth01, sloped, delayOn, stageW]);

  return (
    <Canvas style={{ width: w, height: h, backgroundColor: BG }}>
      {/* Room: ceiling line + gradient floor. */}
      <Path path={geo.room} color={GRID} style="stroke" strokeWidth={1.6} />
      <Floor w={w} y={floorY} h={h - floorY} />
      {/* Coverage wedge: soft gradient fan + axis cue (abstract, styled). */}
      <Path path={geo.wedgeFill}>
        <RadialGradient c={vec(spkX, spkY)} r={w * 0.9} colors={[withAlpha(WAVE, 0.2), withAlpha(WAVE, 0)]} />
      </Path>
      <Path path={geo.wedgeFill} color={WAVE} style="stroke" strokeWidth={1} opacity={0.35} />
      <GlowStroke path={geo.axisLine} color={WAVE} width={1.4} opacity={0.6} />
      {delayOn ? (
        <>
          <Path path={geo.delayWedge}>
            <RadialGradient c={vec(geo.dlyX, geo.dlyY)} r={w * 0.6} colors={[withAlpha(ACCENT_BLUE, 0.2), withAlpha(ACCENT_BLUE, 0)]} />
          </Path>
          <Path path={geo.delayWedge} color={ACCENT_BLUE} style="stroke" strokeWidth={1} opacity={0.35} />
        </>
      ) : null}
      {/* Stage block. */}
      <Path path={geo.stage}>
        <LinearGradient start={vec(4, stageTop)} end={vec(4, floorY)} colors={['#2b2d36', '#15161b']} />
      </Path>
      <Path path={geo.stage} color="#454854" style="stroke" strokeWidth={1.2} />
      {/* Cabinets: main (tilted with the wedge) + optional delay box. */}
      <CabinetSide x={spkX} y={spkY} tiltDeg={tiltDeg} />
      {delayOn ? <CabinetSide x={geo.dlyX} y={geo.dlyY} tiltDeg={48} scale={0.72} /> : null}
      {/* The audience: coverage-tinted busts. */}
      <Path path={geo.seats.gray}>
        <LinearGradient start={vec(0, floorY - 58)} end={vec(0, floorY)} colors={SEAT_GRADS.gray} />
      </Path>
      <Path path={geo.seats.yellow}>
        <LinearGradient start={vec(0, floorY - 58)} end={vec(0, floorY)} colors={SEAT_GRADS.yellow} />
      </Path>
      <Path path={geo.seats.green}>
        <LinearGradient start={vec(0, floorY - 58)} end={vec(0, floorY)} colors={SEAT_GRADS.green} />
      </Path>
      <Path path={geo.seats.red}>
        <LinearGradient start={vec(0, floorY - 58)} end={vec(0, floorY)} colors={SEAT_GRADS.red} />
      </Path>
      <Vignette w={w} h={h} />
    </Canvas>
  );
}
