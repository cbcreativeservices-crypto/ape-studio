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
import { Canvas, Circle, Line as SkLine, Path, Skia } from '@shopify/react-native-skia';
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

  const mic = useMemo(() => {
    const p = Skia.Path.Make();
    // Small capsule pointing up (the front axis).
    p.moveTo(cx - 5, cy + 10);
    p.lineTo(cx - 5, cy - 6);
    p.lineTo(cx, cy - 12);
    p.lineTo(cx + 5, cy - 6);
    p.lineTo(cx + 5, cy + 10);
    p.close();
    return p;
  }, [cx, cy]);

  // Source position + its pickup gain (plain JS — captured by the worklet).
  const thSrc = (srcAngleDeg * Math.PI) / 180;
  const sx = cx + R * Math.sin(thSrc);
  const sy = cy - R * Math.cos(thSrc);
  const gain = polarGain(a, b, thSrc);

  const srcStatic = useMemo(() => {
    const p = Skia.Path.Make();
    p.addCircle(sx, sy, 7);
    // Pickup line: source → mic, weight shown by the panel readout; the drawn
    // line fades with gain via opacity on the Path element below.
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
      <Path path={grid} color={GRID} style="stroke" strokeWidth={1} />
      <Path path={ripples} color={PARTICLE} style="stroke" strokeWidth={1.2} opacity={0.3} />
      <Path path={pattern} color={WAVE} style="stroke" strokeWidth={2.4} />
      <Path path={mic} color={CONE} style="stroke" strokeWidth={2} />
      <Path path={srcStatic} color={ACCENT_GREEN} style="stroke" strokeWidth={2} opacity={0.25 + 0.75 * gain} />
      <Circle cx={sx} cy={sy} r={6} color={ACCENT_GREEN} />
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

  const glyphs = useMemo(() => {
    const p = Skia.Path.Make();
    // Mouth (source).
    p.addCircle(srcX, mid, 9);
    p.moveTo(srcX + 9, mid - 4);
    p.lineTo(srcX + 14, mid);
    p.lineTo(srcX + 9, mid + 4);
    // Mic capsule at distance.
    p.moveTo(micX, mid - 12);
    p.lineTo(micX + 16, mid - 8);
    p.lineTo(micX + 16, mid + 8);
    p.lineTo(micX, mid + 12);
    p.close();
    return p;
  }, [srcX, micX, mid]);

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
      <SkLine p1={{ x: 0, y: mid }} p2={{ x: w, y: mid }} color={GHOST} strokeWidth={1} />
      <Path path={fronts} color={PARTICLE} style="stroke" strokeWidth={1.3} opacity={0.4} />
      <Path path={glyphs} color={CONE} style="stroke" strokeWidth={2.2} />
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

  const curve = useMemo(() => {
    const p = Skia.Path.Make();
    const N = 110;
    for (let i = 0; i <= N; i++) {
      const f = fLo * Math.pow(fHi / fLo, i / N);
      const y = yOf(dbAt(f));
      if (i === 0) p.moveTo(0, y);
      else p.lineTo(xOf(f), y);
    }
    return p;
  }, [w, h, dbAt]);

  return (
    <Canvas style={{ width: w, height: h, backgroundColor: BG }}>
      <Path path={grid} color={GHOST} style="stroke" strokeWidth={1} />
      <SkLine p1={{ x: 0, y: yOf(0) }} p2={{ x: w, y: yOf(0) }} color={GRID} strokeWidth={1.2} />
      <Path path={curve} color={color} style="stroke" strokeWidth={2.4} />
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
  const th = (angleDeg * Math.PI) / 180;

  const scene = useMemo(() => {
    const p = Skia.Path.Make();
    // Source + sound direction arrow.
    p.addCircle(srcX, mid, 8);
    p.moveTo(srcX + 12, mid);
    p.lineTo(micX - 26, mid);
    p.moveTo(micX - 34, mid - 5);
    p.lineTo(micX - 26, mid);
    p.lineTo(micX - 34, mid + 5);
    // Mic rotated: front axis at `angleDeg` away from the incoming sound.
    const c = Math.cos(th + Math.PI); // mic front points back toward source at 0°
    const s = Math.sin(th + Math.PI);
    const L = 24;
    const bx = micX - c * L; // rear end
    const by = mid - s * L;
    p.moveTo(micX, mid);
    p.lineTo(bx, by);
    p.addCircle(micX + c * 4, mid + s * 4, 7);
    return p;
  }, [srcX, micX, mid, th]);

  return (
    <Canvas style={{ width: w, height: h, backgroundColor: BG }}>
      <Path path={scene} color={CONE} style="stroke" strokeWidth={2.4} />
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

  const scene = useMemo(() => {
    const p = Skia.Path.Make();
    // Mouth.
    p.addCircle(srcX, mid, 9);
    // Mic capsule.
    p.moveTo(micX, mid - 12);
    p.lineTo(micX + 15, mid - 8);
    p.lineTo(micX + 15, mid + 8);
    p.lineTo(micX, mid + 12);
    p.close();
    // Barrier per mode.
    if (mode === 'pop') {
      p.moveTo(barX, mid - 26);
      p.lineTo(barX, mid + 26);
      p.addCircle(barX, mid, 26);
    } else if (mode === 'foam') {
      p.addRRect(Skia.RRectXY(Skia.XYWHRect(micX - 8, mid - 18, 30, 36), 10, 10));
    } else if (mode === 'blimp') {
      p.addRRect(Skia.RRectXY(Skia.XYWHRect(micX - 34, mid - 24, 58, 48), 22, 22));
    }
    return p;
  }, [srcX, micX, barX, mid, mode]);

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
      <Path path={sound} color={WAVE} style="stroke" strokeWidth={1.6} opacity={0.55} />
      <Path path={puffs} color={ACCENT_BLUE} />
      <Path path={scene} color={CONE} style="stroke" strokeWidth={2.2} />
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

  const dyn = useDerivedValue(() => {
    const ph = phase.value;
    const base = 5 * Math.sin(ph * 1.9);
    const p = Skia.Path.Make();
    // The stand: full vibration at the floor, `damp` of it at the mic.
    const N = 12;
    for (let i = 0; i <= N; i++) {
      const f = i / N;
      const y = floorY - f * (floorY - topY - 18);
      const off = base * (1 - f) + base * damp * f;
      if (i === 0) p.moveTo(cx + off, y);
      else p.lineTo(cx + off, y);
    }
    // Mic body riding the top.
    const micOff = base * damp;
    p.addRRect(Skia.RRectXY(Skia.XYWHRect(cx + micOff - 9, topY - 20, 18, 38), 8, 8));
    return p;
  }, [phase, cx, floorY, topY, damp]);

  const chrome = useMemo(() => {
    const p = Skia.Path.Make();
    p.moveTo(cx - 44, floorY);
    p.lineTo(cx + 44, floorY);
    // Shake arrows at the base.
    p.moveTo(cx - 34, floorY - 8);
    p.lineTo(cx - 22, floorY - 8);
    p.moveTo(cx + 22, floorY - 8);
    p.lineTo(cx + 34, floorY - 8);
    if (shockMount) {
      // Elastic cradle: two arcs around the mic body zone.
      p.addArc({ x: cx - 22, y: topY - 16, width: 44, height: 44 }, 210, 120);
      p.addArc({ x: cx - 22, y: topY - 16, width: 44, height: 44 }, 30, 120);
    }
    return p;
  }, [cx, floorY, topY, shockMount]);

  return (
    <Canvas style={{ width: w, height: h, backgroundColor: BG }}>
      <Path path={chrome} color={shockMount ? ACCENT_GREEN : GRID} style="stroke" strokeWidth={2} />
      <Path path={dyn} color={CONE} style="stroke" strokeWidth={2.6} />
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

  const paths = useMemo(() => {
    const caps = Skia.Path.Make();
    const area = Skia.Path.Make();
    const wedge = (x: number, y: number, angDeg: number, spreadDeg: number, r: number) => {
      const a0 = angDeg - spreadDeg / 2;
      area.moveTo(x, y);
      area.addArc({ x: x - r, y: y - r, width: 2 * r, height: 2 * r }, a0 - 90, spreadDeg);
      area.lineTo(x, y);
    };
    const capsule = (x: number, y: number, angDeg: number) => {
      const th = (angDeg * Math.PI) / 180;
      const dx = Math.sin(th);
      const dy = -Math.cos(th);
      caps.moveTo(x - dx * 16, y - dy * 16);
      caps.lineTo(x + dx * 10, y + dy * 10);
      caps.addCircle(x + dx * 15, y + dy * 15, 5.5);
    };
    const R = h * 0.52;
    if (tech === 'xy') {
      capsule(cx, cy, -45);
      capsule(cx, cy, 45);
      wedge(cx, cy, -45, 70, R);
      wedge(cx, cy, 45, 70, R);
    } else if (tech === 'ortf') {
      capsule(cx - 20, cy, -55);
      capsule(cx + 20, cy, 55);
      wedge(cx - 20, cy, -55, 70, R);
      wedge(cx + 20, cy, 55, 70, R);
      // Spacing bracket (≈17 cm).
      caps.moveTo(cx - 20, cy + 22);
      caps.lineTo(cx + 20, cy + 22);
    } else if (tech === 'ab') {
      capsule(cx - 62, cy, 0);
      capsule(cx + 62, cy, 0);
      wedge(cx - 62, cy, 0, 80, R);
      wedge(cx + 62, cy, 0, 80, R);
      caps.moveTo(cx - 62, cy + 22);
      caps.lineTo(cx + 62, cy + 22);
    } else {
      // Mid-Side: cardioid forward + figure-8 sideways at one point.
      capsule(cx, cy - 6, 0);
      wedge(cx, cy - 6, 0, 80, R);
      // Fig-8 side lobes.
      area.addCircle(cx - 26, cy + 10, 22);
      area.addCircle(cx + 26, cy + 10, 22);
      caps.moveTo(cx - 14, cy + 10);
      caps.lineTo(cx + 14, cy + 10);
    }
    return { caps, area };
  }, [cx, cy, h, tech]);

  return (
    <Canvas style={{ width: w, height: h, backgroundColor: BG }}>
      {/* Stage line the pair is aimed at. */}
      <SkLine p1={{ x: 12, y: 16 }} p2={{ x: w - 12, y: 16 }} color={GRID} strokeWidth={2} />
      <Path path={paths.area} color={WAVE} style="stroke" strokeWidth={1.2} opacity={0.5} />
      <Path path={paths.caps} color={CONE} style="stroke" strokeWidth={2.6} />
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

  // Panel 1 — the handheld mic + hand.
  const micPanel = useMemo(() => {
    const p = Skia.Path.Make();
    const topY = 16;
    const botY = h - 16;
    // Grille ball + body.
    p.addCircle(micX, topY + 16, 15);
    p.moveTo(micX - 9, topY + 29);
    p.lineTo(micX - 7, botY);
    p.lineTo(micX + 7, botY);
    p.lineTo(micX + 9, topY + 29);
    p.close();
    return p;
  }, [micX, h]);

  const hand = useMemo(() => {
    const p = Skia.Path.Make();
    const topY = 16;
    const botY = h - 16;
    // Hand center rides from the handle (bottom) to the grille (top).
    const yC = botY - 24 - pos01 * (botY - topY - 44);
    p.addRRect(Skia.RRectXY(Skia.XYWHRect(micX - 17, yC - 20, 34, 44), 12, 12));
    // At the full cup, fingers wrap the grille.
    if (pos01 > 0.8) {
      p.addArc({ x: micX - 19, y: topY + 1, width: 38, height: 38 }, 200, 140);
    }
    return p;
  }, [micX, h, pos01]);

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
  const resp = useMemo(() => {
    const p = Skia.Path.Make();
    const N = 90;
    for (let i = 0; i <= N; i++) {
      const f = 40 * Math.pow(400, i / N); // 40 Hz … 16 kHz
      const db = cupResponseDb(f, pos01);
      const y = ry0 + rh / 2 - (db / 10) * (rh / 2.4);
      const x = rx0 + (i / N) * rw;
      if (i === 0) p.moveTo(x, y);
      else p.lineTo(x, y);
    }
    return p;
  }, [rx0, rw, ry0, rh, pos01]);

  return (
    <Canvas style={{ width: w, height: h, backgroundColor: BG }}>
      {/* Panel frames. */}
      <SkLine p1={{ x: w * 0.34, y: 8 }} p2={{ x: w * 0.34, y: h - 8 }} color={GHOST} strokeWidth={1.4} />
      <SkLine p1={{ x: w * 0.36, y: h * 0.53 }} p2={{ x: w - 6, y: h * 0.53 }} color={GHOST} strokeWidth={1.4} />
      {/* 1 · Mic + hand. */}
      <Path path={micPanel} color={CONE} style="stroke" strokeWidth={2.4} />
      <Path path={hand} color={ACCENT_BLUE} style="stroke" strokeWidth={2.2} opacity={0.9} />
      {/* 2 · Polar: intended (ghost) vs current. */}
      <Path path={polarRef} color={GHOST} style="stroke" strokeWidth={1.6} />
      <Path path={polar} color={pos01 > 0.6 ? ACCENT_RED : WAVE} style="stroke" strokeWidth={2.2} />
      {/* 3 · Response: reference zero + current. */}
      <SkLine p1={{ x: rx0, y: ry0 + rh / 2 }} p2={{ x: rx0 + rw, y: ry0 + rh / 2 }} color={GRID} strokeWidth={1.2} />
      <Path path={resp} color={pos01 > 0.6 ? ACCENT_RED : WAVE} style="stroke" strokeWidth={2.2} />
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

  const shell = useMemo(() => {
    const p = Skia.Path.Make();
    // Cutaway capsule housing.
    p.addRRect(Skia.RRectXY(Skia.XYWHRect(cx - 46, capY - 26, 92, 62), 14, 14));
    // Diaphragm (the moving element, near the front/top).
    p.moveTo(cx - 26, capY - 8);
    p.lineTo(cx + 26, capY - 8);
    // Rear ports (the slots that make it directional).
    for (const dx of [-38, 38]) {
      p.moveTo(cx + dx, capY + 14);
      p.lineTo(cx + dx, capY + 26);
    }
    // Internal acoustic path hint.
    p.moveTo(cx - 34, capY + 20);
    p.lineTo(cx - 8, capY - 4);
    p.moveTo(cx + 34, capY + 20);
    p.lineTo(cx + 8, capY - 4);
    return p;
  }, [cx, capY]);

  const handBlock = useMemo(() => {
    const p = Skia.Path.Make();
    if (blocked) {
      p.addArc({ x: cx - 58, y: capY - 20, width: 116, height: 84 }, 140, 260);
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

  return (
    <Canvas style={{ width: w, height: h, backgroundColor: BG }}>
      <Path path={shell} color={CONE} style="stroke" strokeWidth={2.2} />
      <Path path={arrows} color={blocked ? ACCENT_YELLOW : ACCENT_GREEN} />
      <Path path={handBlock} color={ACCENT_RED} style="stroke" strokeWidth={3} opacity={0.9} />
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

  const art = useMemo(() => {
    const p = Skia.Path.Make();
    const head = (x: number, y: number) => {
      p.addCircle(x, y, 11);
      p.moveTo(x + 8, y + 4); // chin/mouth hint
      p.lineTo(x + 12, y + 6);
    };
    const mic = (x: number, y: number, angDeg: number, handAtGrille: boolean, cupped: boolean) => {
      const th = (angDeg * Math.PI) / 180;
      const dx = Math.sin(th);
      const dy = -Math.cos(th);
      p.addCircle(x + dx * 22, y + dy * 22, 9);
      p.moveTo(x - dx * 16, y - dy * 16);
      p.lineTo(x + dx * 13, y + dy * 13);
      // The hand.
      const handF = handAtGrille || cupped ? 16 : -8;
      const hx = x + dx * handF;
      const hy = y + dy * handF;
      p.addRRect(Skia.RRectXY(Skia.XYWHRect(hx - 9, hy - 9, 18, 18), 6, 6));
      if (cupped) p.addArc({ x: x + dx * 22 - 13, y: y + dy * 22 - 13, width: 26, height: 26 }, 160, 220);
    };
    switch (kind) {
      case 'correct':
        head(cx - 46, 34);
        mic(cx + 6, 66, -35, false, false);
        break;
      case 'grille':
        head(cx - 46, 34);
        mic(cx + 6, 66, -35, true, false);
        break;
      case 'cup':
        head(cx - 46, 34);
        mic(cx + 6, 66, -35, false, true);
        break;
      case 'away':
        head(cx - 46, 34);
        mic(cx + 10, 62, 55, false, false); // pointing away from the mouth
        break;
      case 'far':
        head(cx - 62, 30);
        mic(cx + 42, 78, -30, false, false); // way too distant
        p.moveTo(cx - 46, 44);
        p.lineTo(cx + 28, 66);
        break;
      case 'switch':
        head(cx - 46, 34);
        mic(cx + 6, 66, -35, false, false);
        // Hand over the switch area (mid body).
        p.addRRect(Skia.RRectXY(Skia.XYWHRect(cx + 6 - 10, 62, 20, 14), 5, 5));
        break;
      case 'antenna':
        head(cx - 46, 34);
        mic(cx + 6, 66, -35, false, false);
        // Antenna at the base, hand wrapped over it.
        p.moveTo(cx + 6 - Math.sin((-35 * Math.PI) / 180) * 16, 66 + Math.cos((-35 * Math.PI) / 180) * 16);
        p.lineTo(cx + 6 - Math.sin((-35 * Math.PI) / 180) * 30, 66 + Math.cos((-35 * Math.PI) / 180) * 30);
        p.addRRect(Skia.RRectXY(Skia.XYWHRect(cx - 6, 84, 22, 16), 6, 6));
        break;
    }
    return p;
  }, [cx, kind]);

  const bad = kind !== 'correct';
  return (
    <Canvas style={{ width: w, height: h, backgroundColor: BG }}>
      <Path path={art} color={bad ? PARTICLE : ACCENT_GREEN} style="stroke" strokeWidth={2.2} />
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

  const { cells, speakers } = useMemo(() => {
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
    const paths: Record<CoverageClass, ReturnType<typeof Skia.Path.Make>> = {
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
        paths[classifyCoverage(lvl)].addRect(Skia.XYWHRect(c * cw + 1, audY0 + r * ch + 1, cw - 2, ch - 2));
      }
    }
    // Speaker glyphs + aim lines.
    const glyphs = Skia.Path.Make();
    for (const s of spks) {
      const th = (s.aim * Math.PI) / 180;
      const dx = Math.sin(th);
      const dy = Math.cos(th);
      const sz = s.small ? 6 : 10;
      glyphs.addRRect(Skia.RRectXY(Skia.XYWHRect(s.x - sz, s.y - sz - 6, sz * 2, sz * 1.6), 3, 3));
      glyphs.moveTo(s.x, s.y);
      // Aim cue clamped into the canvas so an edge speaker at hard aim keeps it.
      const L = s.small ? 26 : 46;
      glyphs.lineTo(Math.max(4, Math.min(w - 4, s.x + dx * L)), s.y + dy * L);
    }
    return { cells: paths, speakers: glyphs };
  }, [w, h, audY0, audH, spk1x01, spk1AimDeg, spk2On, spk2x01, spk2AimDeg, hDeg, frontFills]);

  return (
    <Canvas style={{ width: w, height: h, backgroundColor: BG }}>
      {/* Stage strip. */}
      <Path
        path={useMemo(() => {
          const p = Skia.Path.Make();
          p.addRect(Skia.XYWHRect(0, 0, w, stageH));
          return p;
        }, [w])}
        color="#17171c"
      />
      <Path path={cells.gray} color="rgba(150,150,160,0.12)" />
      <Path path={cells.yellow} color="rgba(255,215,107,0.30)" />
      <Path path={cells.green} color="rgba(91,255,133,0.30)" />
      <Path path={cells.red} color="rgba(255,107,94,0.38)" />
      <SkLine p1={{ x: 0, y: stageH }} p2={{ x: w, y: stageH }} color={GRID} strokeWidth={1.5} />
      <Path path={speakers} color={PARTICLE} style="stroke" strokeWidth={2.2} />
    </Canvas>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SPEAKER LAB · Side view — height, tilt, vertical coverage, delay concept

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

  const { room, wedge, seats } = useMemo(() => {
    const room = Skia.Path.Make();
    room.moveTo(0, floorY);
    room.lineTo(w, floorY);
    room.moveTo(0, ceilY);
    room.lineTo(w, ceilY);
    // Stage block.
    room.addRect(Skia.XYWHRect(4, stageTop, stageW, floorY - stageTop));
    // Speaker box.
    room.addRRect(Skia.RRectXY(Skia.XYWHRect(spkX - 9, spkY - 9, 20, 18), 3, 3));

    // Coverage wedge: axis tilted DOWN from horizontal by tiltDeg.
    const wedge = Skia.Path.Make();
    const axis = (tiltDeg * Math.PI) / 180;
    const half = ((vDeg / 2) * Math.PI) / 180;
    const L = w * 1.2;
    const ex = (ang: number) => spkX + Math.cos(ang) * L;
    const ey = (ang: number) => spkY + Math.sin(ang) * L;
    wedge.moveTo(spkX, spkY);
    wedge.lineTo(ex(axis - half), ey(axis - half));
    wedge.moveTo(spkX, spkY);
    wedge.lineTo(ex(axis + half), ey(axis + half));
    wedge.moveTo(spkX, spkY);
    wedge.lineTo(ex(axis), ey(axis));

    // Delay speaker (concept only): hung at ~60% depth, covering the rear.
    const audX0 = stageW + 26;
    const audW = depth01 * (w - audX0 - 14);
    const dlyX = audX0 + audW * 0.58;
    const dlyY = ceilY + 22;
    if (delayOn) {
      room.addRRect(Skia.RRectXY(Skia.XYWHRect(dlyX - 7, dlyY - 7, 16, 14), 3, 3));
      wedge.moveTo(dlyX, dlyY);
      wedge.lineTo(dlyX + w * 0.5, dlyY + w * 0.34);
      wedge.moveTo(dlyX, dlyY);
      wedge.lineTo(dlyX + w * 0.16, dlyY + w * 0.5);
    }

    // Seats: classified heads along the depth.
    const seatPaths: Record<CoverageClass, ReturnType<typeof Skia.Path.Make>> = {
      red: Skia.Path.Make(),
      green: Skia.Path.Make(),
      yellow: Skia.Path.Make(),
      gray: Skia.Path.Make(),
    };
    const N = 9;
    for (let i = 0; i < N; i++) {
      const sx = audX0 + ((i + 0.5) / N) * audW;
      const rise = sloped ? (i / (N - 1)) * 34 : 0;
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
      seatPaths[cls].addCircle(sx, hy, 6);
      seatPaths[cls].moveTo(sx, hy + 6);
      seatPaths[cls].lineTo(sx, floorY - rise);
    }
    return { room, wedge, seats: seatPaths };
  }, [w, floorY, ceilY, stageTop, spkX, spkY, tiltDeg, vDeg, depth01, sloped, delayOn]);

  return (
    <Canvas style={{ width: w, height: h, backgroundColor: BG }}>
      <Path path={wedge} color={WAVE} style="stroke" strokeWidth={1.4} opacity={0.55} />
      <Path path={room} color={CONE} style="stroke" strokeWidth={2.2} />
      <Path path={seats.gray} color="rgba(150,150,160,0.5)" style="stroke" strokeWidth={2.2} />
      <Path path={seats.yellow} color={ACCENT_YELLOW} style="stroke" strokeWidth={2.2} />
      <Path path={seats.green} color={ACCENT_GREEN} style="stroke" strokeWidth={2.2} />
      <Path path={seats.red} color={ACCENT_RED} style="stroke" strokeWidth={2.2} />
    </Canvas>
  );
}
