/**
 * Vacuum Tube Lab — Skia visualization core (owner 2026-07-29).
 *
 * VISUAL-FIRST: the lab teaches how a tube amplifies by CONTROLLING ELECTRON
 * FLOW, entirely through interactive animation — no audio at launch (stated
 * on-screen). HONESTY (§1.7): every drawing is an ILLUSTRATIVE MODEL — a
 * schematic side cross-section with a normalized tanh transfer curve, never
 * measured tube data; each host panel badges that.
 *
 * THE STAR (owner spec): the ELECTRON VIEW toggle — Physical view shows the
 * glass, electrodes and filament glow; Electron view shows the blue electron
 * cloud, flow lines and the grid's field squeezing the stream. Same geometry,
 * two mental models, one toggle.
 *
 * ONLY this file (and foundations/viz, for the clocks) imports Skia; loaded
 * solely via tube/skiaGate.requireTubeViz() so pre-Skia clients never touch it.
 */
import { useMemo } from 'react';
import { Canvas, Circle, Line as SkLine, Path, Skia } from '@shopify/react-native-skia';
import { useDerivedValue, type SharedValue } from 'react-native-reanimated';
export { usePhaseClock, useVizClock } from '../foundations/viz';

const GLASS = '#4a4a54';
const METAL = '#8a8c94';
const WAVE = '#ffc64d';
const GLOW = '#ffb246';
const ELECTRON = '#6fa8ff';
const ACCENT_GREEN = '#5bff85';
const ACCENT_RED = '#ff6b5e';
const GRID = '#2c2c33';
const GHOST = '#232329';
const BG = '#0c0c0f';

/** Worklet-safe deterministic hash (foundations idiom). */
function hashW(n: number): number {
  'worklet';
  const s = Math.sin(n) * 43758.5453123;
  return s - Math.floor(s);
}
function hashJs(n: number): number {
  const s = Math.sin(n) * 43758.5453123;
  return s - Math.floor(s);
}

/** Normalized illustrative transfer curve: grid drive 0..1 → plate current
 *  0..1 with cutoff at the bottom and saturation at the top. */
export function plateCurrent01(v01: number): number {
  return (Math.tanh(4.2 * (Math.max(0, Math.min(1, v01)) - 0.52)) + 1) / 2;
}

export type TubeKind = 'triode' | 'tetrode' | 'pentode';
export type TubePart = 'envelope' | 'heater' | 'cathode' | 'grid' | 'screen' | 'suppressor' | 'plate' | 'vacuum';

// ─────────────────────────────────────────────────────────────────────────────
// 1 · The cutaway — what's inside (also serves the Tube Types screen)

export function TubeCutawayView({
  phase,
  width,
  height = 250,
  kind,
  highlight,
  electronView,
  showSecondary = false,
}: {
  phase: SharedValue<number>;
  width: number;
  height?: number;
  kind: TubeKind;
  /** The tapped part (amber highlight), or null. */
  highlight: TubePart | null;
  electronView: boolean;
  /** Types screen: animate secondary emission (tetrode problem, pentode fix). */
  showSecondary?: boolean;
}) {
  const w = width;
  const h = height;
  const cx = w / 2;
  const topY = 16;
  const baseY = h - 46;
  const stackTop = topY + 34;
  const stackBot = baseY - 16;

  const hasScreen = kind !== 'triode';
  const hasSuppressor = kind === 'pentode';

  const colorFor = (part: TubePart, base: string) => (highlight === part ? WAVE : base);

  // Static electrode geometry (symmetric side cross-section).
  const parts = useMemo(() => {
    const env = Skia.Path.Make();
    // Glass envelope: dome top + straight sides + base.
    env.moveTo(cx - 58, baseY);
    env.lineTo(cx - 58, topY + 34);
    env.addArc({ x: cx - 58, y: topY, width: 116, height: 68 }, 180, 180);
    env.moveTo(cx + 58, topY + 34);
    env.lineTo(cx + 58, baseY);
    // Base + pins.
    env.addRRect(Skia.RRectXY(Skia.XYWHRect(cx - 44, baseY, 88, 18), 4, 4));
    for (let i = -3; i <= 3; i++) {
      env.moveTo(cx + i * 12, baseY + 18);
      env.lineTo(cx + i * 12, baseY + 30);
    }

    const heater = Skia.Path.Make();
    // Zigzag filament inside the cathode sleeve.
    const zn = 8;
    for (let i = 0; i <= zn; i++) {
      const y = stackTop + 8 + ((stackBot - stackTop - 16) * i) / zn;
      const x = cx + (i % 2 === 0 ? -3 : 3);
      if (i === 0) heater.moveTo(x, y);
      else heater.lineTo(x, y);
    }

    const cathode = Skia.Path.Make();
    for (const sgn of [-1, 1]) {
      cathode.moveTo(cx + sgn * 8, stackTop + 4);
      cathode.lineTo(cx + sgn * 8, stackBot - 4);
    }

    const gridP = Skia.Path.Make();
    const screenP = Skia.Path.Make();
    const suppP = Skia.Path.Make();
    const dots = (path: ReturnType<typeof Skia.Path.Make>, dx: number) => {
      for (const sgn of [-1, 1]) {
        for (let i = 0; i < 7; i++) {
          const y = stackTop + 8 + ((stackBot - stackTop - 16) * i) / 6;
          path.addCircle(cx + sgn * dx, y, 2.1);
        }
      }
    };
    dots(gridP, 19);
    if (hasScreen) dots(screenP, 31);
    if (hasSuppressor) dots(suppP, 43);

    const plate = Skia.Path.Make();
    for (const sgn of [-1, 1]) {
      plate.moveTo(cx + sgn * 53, stackTop);
      plate.lineTo(cx + sgn * 53, stackBot);
      plate.lineTo(cx + sgn * 40, stackBot);
      plate.moveTo(cx + sgn * 53, stackTop);
      plate.lineTo(cx + sgn * 40, stackTop);
    }

    const vacuum = Skia.Path.Make();
    vacuum.addRRect(Skia.RRectXY(Skia.XYWHRect(cx - 56, topY + 6, 112, baseY - topY - 10), 26, 26));
    return { env, heater, cathode, gridP, screenP, suppP, plate, vacuum };
  }, [cx, topY, baseY, stackTop, stackBot, hasScreen, hasSuppressor]);

  // Physical view: the filament glow breathes. Electron view: cloud + flow.
  const glow = useDerivedValue(() => {
    const ph = phase.value;
    const p = Skia.Path.Make();
    if (!electronView) {
      const r = 13 + 2.5 * Math.sin(ph);
      p.addCircle(cx, (stackTop + stackBot) / 2, r);
    }
    return p;
  }, [phase, cx, stackTop, stackBot, electronView]);

  const electrons = useDerivedValue(() => {
    const ph = phase.value;
    const p = Skia.Path.Make();
    if (electronView) {
      // Cloud near the cathode + streams drifting outward to both plates.
      for (let i = 0; i < 30; i++) {
        const row = hashW(i * 13.7);
        const y = stackTop + 8 + row * (stackBot - stackTop - 16);
        const sgn = i % 2 === 0 ? 1 : -1;
        const f = (ph / (2 * Math.PI) + hashW(i * 71.3)) % 1;
        const x = cx + sgn * (10 + f * 41);
        p.addCircle(x, y + 2 * Math.sin(ph * 2 + i), 1.9);
      }
      // Space-charge cloud hugging the cathode.
      for (let i = 0; i < 12; i++) {
        const y = stackTop + 10 + hashW(i * 5.1) * (stackBot - stackTop - 20);
        p.addCircle(cx + (hashW(i * 9.7) - 0.5) * 10, y, 1.6);
      }
    }
    if (showSecondary && electronView && hasScreen) {
      // Secondary emission: electrons knocked BACK off the plate. In a
      // tetrode they reach the screen grid (the problem); the pentode's
      // suppressor turns them around (the fix).
      for (let i = 0; i < 5; i++) {
        const y = stackTop + 16 + hashW(i * 3.3) * (stackBot - stackTop - 32);
        const f = (ph / (2 * Math.PI) + i / 5) % 1;
        const span = hasSuppressor ? 9 : 21; // stopped at suppressor vs reaching screen
        const sgn = i % 2 === 0 ? 1 : -1;
        p.addCircle(cx + sgn * (52 - f * span), y, 1.8);
      }
    }
    return p;
  }, [phase, cx, stackTop, stackBot, electronView, showSecondary, hasScreen, hasSuppressor]);

  return (
    <Canvas style={{ width: w, height: h, backgroundColor: BG }}>
      {highlight === 'vacuum' ? <Path path={parts.vacuum} color={WAVE} style="stroke" strokeWidth={2} opacity={0.8} /> : null}
      <Path path={glow} color={GLOW} opacity={0.35} />
      <Path path={parts.env} color={colorFor('envelope', GLASS)} style="stroke" strokeWidth={2.4} />
      <Path path={parts.plate} color={colorFor('plate', METAL)} style="stroke" strokeWidth={2.6} />
      {hasSuppressor ? <Path path={parts.suppP} color={colorFor('suppressor', METAL)} /> : null}
      {hasScreen ? <Path path={parts.screenP} color={colorFor('screen', METAL)} /> : null}
      <Path path={parts.gridP} color={colorFor('grid', electronView ? ELECTRON : METAL)} />
      <Path path={parts.cathode} color={colorFor('cathode', METAL)} style="stroke" strokeWidth={2.6} />
      <Path path={parts.heater} color={colorFor('heater', electronView ? METAL : GLOW)} style="stroke" strokeWidth={1.8} />
      <Path path={electrons} color={showSecondary ? ACCENT_RED : ELECTRON} opacity={showSecondary ? 0.9 : 0.85} />
    </Canvas>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 2 · Electron flow — the warm-up sequence (heat → emission → cloud → current)

export function ElectronFlowView({
  phase,
  width,
  height = 190,
  heat01,
}: {
  phase: SharedValue<number>;
  width: number;
  height?: number;
  /** 0 = cold … 1 = fully conducting (the warm-up slider). */
  heat01: number;
}) {
  const w = width;
  const h = height;
  const cathX = 46;
  const plateX = w - 40;
  const top = 26;
  const bot = h - 26;

  const chrome = useMemo(() => {
    const p = Skia.Path.Make();
    // Cathode bar + heater zig behind it.
    p.moveTo(cathX, top);
    p.lineTo(cathX, bot);
    const zn = 7;
    for (let i = 0; i <= zn; i++) {
      const y = top + 6 + ((bot - top - 12) * i) / zn;
      const x = cathX - 12 + (i % 2 === 0 ? -3 : 3);
      if (i === 0) p.moveTo(x, y);
      else p.lineTo(x, y);
    }
    // Plate with + terminal.
    p.moveTo(plateX, top);
    p.lineTo(plateX, bot);
    p.moveTo(plateX + 8, top + 10);
    p.lineTo(plateX + 8, top + 22);
    p.moveTo(plateX + 2, top + 16);
    p.lineTo(plateX + 14, top + 16);
    return p;
  }, [cathX, plateX, top, bot]);

  // Heater glow ramps first.
  const glow = useDerivedValue(() => {
    const ph = phase.value;
    const p = Skia.Path.Make();
    const g = Math.min(1, heat01 / 0.3);
    if (g > 0.02) {
      const r = (8 + 2 * Math.sin(ph)) * g + 4;
      p.addCircle(cathX - 12, (top + bot) / 2, r);
    }
    return p;
  }, [phase, cathX, top, bot, heat01]);

  const electrons = useDerivedValue(() => {
    const ph = phase.value;
    const p = Skia.Path.Make();
    // Emission begins ~0.3; the cloud thickens; drift to the plate above ~0.7.
    const emit = Math.max(0, (heat01 - 0.3) / 0.7);
    const drifting = heat01 > 0.7;
    const n = Math.round(emit * 34);
    for (let i = 0; i < n; i++) {
      const y = top + 8 + hashW(i * 17.9) * (bot - top - 16);
      if (drifting && hashW(i * 3.7) < (heat01 - 0.7) / 0.3 + 0.25) {
        const f = (ph / (2 * Math.PI) + hashW(i * 51.3)) % 1;
        p.addCircle(cathX + 8 + f * (plateX - cathX - 16), y, 1.9);
      } else {
        // Space-charge cloud loitering near the cathode.
        const jitter = 3 * Math.sin(ph * 2 + i);
        p.addCircle(cathX + 6 + hashW(i * 29.1) * 22 + jitter, y, 1.7);
      }
    }
    return p;
  }, [phase, cathX, plateX, top, bot, heat01]);

  return (
    <Canvas style={{ width: w, height: h, backgroundColor: BG }}>
      <Path path={glow} color={GLOW} opacity={0.4} />
      <Path path={chrome} color={METAL} style="stroke" strokeWidth={2.4} />
      <Path path={electrons} color={ELECTRON} opacity={0.9} />
    </Canvas>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 3 · The control grid — a small voltage gating a large current

export function GridControlView({
  phase,
  width,
  height = 190,
  cond,
  electronView,
}: {
  phase: SharedValue<number>;
  width: number;
  height?: number;
  /** 0 = grid most negative (cutoff) … 1 = least negative (full flow). */
  cond: number;
  electronView: boolean;
}) {
  const w = width;
  const h = height;
  const cathX = 40;
  const gridX = w * 0.46;
  const plateX = w - 38;
  const top = 24;
  const bot = h - 24;

  const chrome = useMemo(() => {
    const p = Skia.Path.Make();
    p.moveTo(cathX, top);
    p.lineTo(cathX, bot);
    for (let i = 0; i < 6; i++) {
      p.addCircle(gridX, top + 10 + ((bot - top - 20) * i) / 5, 2.4);
    }
    p.moveTo(plateX, top);
    p.lineTo(plateX, bot);
    return p;
  }, [cathX, gridX, plateX, top, bot]);

  // Field lines (electron view): the grid's negative field pushing back.
  const field = useMemo(() => {
    const p = Skia.Path.Make();
    if (electronView) {
      const strength = 1 - cond;
      const len = 8 + strength * 16;
      for (let i = 0; i < 5; i++) {
        const y = top + 16 + ((bot - top - 32) * i) / 4;
        p.moveTo(gridX - 6, y);
        p.lineTo(gridX - 6 - len, y);
        p.moveTo(gridX - 6 - len, y);
        p.lineTo(gridX - 2 - len, y - 3);
        p.moveTo(gridX - 6 - len, y);
        p.lineTo(gridX - 2 - len, y + 3);
      }
    }
    return p;
  }, [gridX, top, bot, cond, electronView]);

  const electrons = useDerivedValue(() => {
    const ph = phase.value;
    const p = Skia.Path.Make();
    for (let i = 0; i < 26; i++) {
      const y = top + 8 + hashW(i * 23.3) * (bot - top - 16);
      const passes = hashW(i * 7.7) < cond;
      const f = (ph / (2 * Math.PI) + hashW(i * 41.9)) % 1;
      if (passes) {
        p.addCircle(cathX + 8 + f * (plateX - cathX - 14), y, 1.9);
      } else {
        // Turned back before the grid: out and back on the cathode side.
        const tri = f < 0.5 ? f * 2 : 2 - f * 2;
        p.addCircle(cathX + 8 + tri * (gridX - cathX - 22), y, 1.7);
      }
    }
    return p;
  }, [phase, cathX, gridX, plateX, top, bot, cond]);

  return (
    <Canvas style={{ width: w, height: h, backgroundColor: BG }}>
      <Path path={field} color={ELECTRON} style="stroke" strokeWidth={1.2} opacity={0.5} />
      <Path path={chrome} color={METAL} style="stroke" strokeWidth={2.4} />
      {/* The grid's negativity, visualized on the wires themselves. */}
      <Circle cx={gridX} cy={top - 8} r={4 + (1 - cond) * 3} color={ELECTRON} opacity={0.25 + (1 - cond) * 0.6} />
      <Path path={electrons} color={ELECTRON} opacity={0.9} />
    </Canvas>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 4 · Amplification — small wave in, large (inverted) wave out

export function AmplifyView({
  phase,
  width,
  height = 176,
}: {
  phase: SharedValue<number>;
  width: number;
  height?: number;
}) {
  const w = width;
  const h = height;
  const mid = h / 2;
  const inX0 = 8;
  const inX1 = w * 0.3;
  const boxX0 = w * 0.34;
  const boxX1 = w * 0.6;
  const outX0 = w * 0.64;
  const outX1 = w - 8;

  const box = useMemo(() => {
    const p = Skia.Path.Make();
    p.addRRect(Skia.RRectXY(Skia.XYWHRect(boxX0, mid - 42, boxX1 - boxX0, 84), 14, 14));
    // Grid symbol inside.
    for (let i = 0; i < 4; i++) p.addCircle((boxX0 + boxX1) / 2, mid - 18 + i * 12, 2);
    // In/out leads.
    p.moveTo(inX1, mid);
    p.lineTo(boxX0, mid);
    p.moveTo(boxX1, mid);
    p.lineTo(outX0, mid);
    return p;
  }, [boxX0, boxX1, inX1, outX0, mid]);

  const waves = useDerivedValue(() => {
    const ph = phase.value;
    const pIn = Skia.Path.Make();
    const pOut = Skia.Path.Make();
    const N = 60;
    for (let i = 0; i <= N; i++) {
      const t = i / N;
      const th = t * 2 * Math.PI * 2.2 - ph;
      const yi = mid - 8 * Math.sin(th);
      // Plate output: LARGER and INVERTED (the tube's honest sign flip).
      const yo = mid + 52 * Math.sin(th);
      const xi = inX0 + t * (inX1 - inX0);
      const xo = outX0 + t * (outX1 - outX0);
      if (i === 0) {
        pIn.moveTo(xi, yi);
        pOut.moveTo(xo, yo);
      } else {
        pIn.lineTo(xi, yi);
        pOut.lineTo(xo, yo);
      }
    }
    const both = Skia.Path.Make();
    both.addPath(pIn);
    both.addPath(pOut);
    return both;
  }, [phase, mid, inX0, inX1, outX0, outX1]);

  return (
    <Canvas style={{ width: w, height: h, backgroundColor: BG }}>
      <SkLine p1={{ x: 0, y: mid }} p2={{ x: w, y: mid }} color={GHOST} strokeWidth={1} />
      <Path path={box} color={METAL} style="stroke" strokeWidth={2.2} />
      <Path path={waves} color={WAVE} style="stroke" strokeWidth={2.2} />
    </Canvas>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 5 · Why high voltage — weak vs strong plate attraction

export function HighVoltageView({
  phase,
  width,
  height = 176,
  highB,
}: {
  phase: SharedValue<number>;
  width: number;
  height?: number;
  highB: boolean;
}) {
  const w = width;
  const h = height;
  const cathX = 44;
  const plateX = w - 44;
  const top = 22;
  const bot = h - 44;

  const chrome = useMemo(() => {
    const p = Skia.Path.Make();
    p.moveTo(cathX, top);
    p.lineTo(cathX, bot);
    p.moveTo(plateX, top);
    p.lineTo(plateX, bot);
    // The supply: one cell vs a stack of four.
    const cells = highB ? 4 : 1;
    const bx = w / 2 - (cells * 14) / 2;
    for (let i = 0; i < cells; i++) {
      p.moveTo(bx + i * 14, h - 30);
      p.lineTo(bx + i * 14, h - 14);
      p.moveTo(bx + i * 14 + 7, h - 26);
      p.lineTo(bx + i * 14 + 7, h - 18);
    }
    // Wire from supply to plate.
    p.moveTo(bx + cells * 14, h - 22);
    p.lineTo(plateX, h - 22);
    p.lineTo(plateX, bot);
    return p;
  }, [cathX, plateX, top, bot, w, h, highB]);

  const electrons = useDerivedValue(() => {
    const ph = phase.value;
    const p = Skia.Path.Make();
    const n = highB ? 26 : 8;
    const speed = highB ? 1 : 0.4;
    for (let i = 0; i < n; i++) {
      const y = top + 8 + hashW(i * 19.1) * (bot - top - 16);
      const f = ((ph * speed) / (2 * Math.PI) + hashW(i * 47.7)) % 1;
      p.addCircle(cathX + 8 + f * (plateX - cathX - 14), y, 1.9);
    }
    // Attraction arrows at the plate — longer when B+ is high.
    const len = highB ? 18 : 7;
    for (let i = 0; i < 3; i++) {
      const y = top + 20 + ((bot - top - 40) * i) / 2;
      p.addRect(Skia.XYWHRect(plateX - len - 6, y - 1, len, 2));
    }
    return p;
  }, [phase, cathX, plateX, top, bot, highB]);

  return (
    <Canvas style={{ width: w, height: h, backgroundColor: BG }}>
      <Path path={chrome} color={METAL} style="stroke" strokeWidth={2.4} />
      <Path path={electrons} color={ELECTRON} opacity={0.9} />
    </Canvas>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 7 · Bias — the operating point on the transfer curve

export function BiasView({
  phase,
  width,
  height = 200,
  bias01,
}: {
  phase: SharedValue<number>;
  width: number;
  height?: number;
  /** 0 = far too negative (cutoff) … 0.5 ≈ linear … 1 = too positive (sat). */
  bias01: number;
}) {
  const w = width;
  const h = height;
  const cw = w * 0.56; // curve region
  const cx0 = 10;
  const cy0 = 14;
  const chh = h - 28;
  const ox0 = w * 0.62; // output-wave region
  const ow = w - ox0 - 8;

  const xOfV = (v: number) => cx0 + v * (cw - 20);
  const yOfI = (ip: number) => cy0 + (1 - ip) * chh;

  const curve = useMemo(() => {
    const p = Skia.Path.Make();
    for (let i = 0; i <= 80; i++) {
      const v = i / 80;
      const y = yOfI(plateCurrent01(v));
      if (i === 0) p.moveTo(xOfV(v), y);
      else p.lineTo(xOfV(v), y);
    }
    return p;
  }, [w, h]);

  // Operating point + drive extremes (plain JS — captured by the worklet).
  const DRIVE = 0.15;
  const opX = xOfV(bias01);
  const opY = yOfI(plateCurrent01(bias01));

  const dyn = useDerivedValue(() => {
    const ph = phase.value;
    const p = Skia.Path.Make();
    // The input drive swings the grid around the operating point…
    const vNow = bias01 + DRIVE * Math.sin(ph * 2);
    const vC = vNow < 0 ? 0 : vNow > 1 ? 1 : vNow;
    const ipNow = (Math.tanh(4.2 * (vC - 0.52)) + 1) / 2;
    p.addCircle(cx0 + vC * (cw - 20), cy0 + (1 - ipNow) * chh, 5);
    // …and the OUTPUT wave is that swing read off the curve.
    const N = 56;
    for (let i = 0; i <= N; i++) {
      const t = i / N;
      const v = bias01 + DRIVE * Math.sin(t * 2 * Math.PI * 2 - ph * 2);
      const vc = v < 0 ? 0 : v > 1 ? 1 : v;
      const ip = (Math.tanh(4.2 * (vc - 0.52)) + 1) / 2;
      const x = ox0 + t * ow;
      const y = cy0 + (1 - ip) * chh;
      if (i === 0) p.moveTo(x, y);
      else p.lineTo(x, y);
    }
    return p;
  }, [phase, bias01, cx0, cw, cy0, chh, ox0, ow]);

  return (
    <Canvas style={{ width: w, height: h, backgroundColor: BG }}>
      {/* Region hints: cutoff floor and saturation ceiling. */}
      <SkLine p1={{ x: cx0, y: yOfI(0.02) }} p2={{ x: cx0 + cw - 20, y: yOfI(0.02) }} color={GHOST} strokeWidth={1.4} />
      <SkLine p1={{ x: cx0, y: yOfI(0.98) }} p2={{ x: cx0 + cw - 20, y: yOfI(0.98) }} color={GHOST} strokeWidth={1.4} />
      <SkLine p1={{ x: ox0 - 8, y: cy0 }} p2={{ x: ox0 - 8, y: cy0 + chh }} color={GHOST} strokeWidth={1.4} />
      <Path path={curve} color={METAL} style="stroke" strokeWidth={2.2} />
      <Circle cx={opX} cy={opY} r={7} color={bias01 < 0.22 || bias01 > 0.8 ? ACCENT_RED : ACCENT_GREEN} style="stroke" strokeWidth={2.2} />
      <Path path={dyn} color={WAVE} style="stroke" strokeWidth={2.2} />
    </Canvas>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 8 · Saturation — the straight line that rounds into soft clipping

export function SaturationView({
  phase,
  width,
  height = 200,
  drive01,
}: {
  phase: SharedValue<number>;
  width: number;
  height?: number;
  /** 0 = tiny signal (linear) … 1 = pushed hard (rounded peaks). */
  drive01: number;
}) {
  const w = width;
  const h = height;
  const cs = Math.min(w * 0.42, h - 24); // square transfer plot
  const cx0 = 8;
  const cy0 = (h - cs) / 2;
  const wx0 = w * 0.5;
  const ww = w - wx0 - 8;
  const midIn = cy0 + cs * 0.27;
  const midOut = cy0 + cs * 0.75;
  const drive = 0.15 + drive01 * 0.85;

  const curve = useMemo(() => {
    const p = Skia.Path.Make();
    const K = Math.tanh(2.6);
    for (let i = 0; i <= 70; i++) {
      const x = -1 + (2 * i) / 70;
      const y = Math.tanh(2.6 * x) / K;
      const px = cx0 + ((x + 1) / 2) * cs;
      const py = cy0 + (1 - (y + 1) / 2) * cs;
      if (i === 0) p.moveTo(px, py);
      else p.lineTo(px, py);
    }
    // Unity reference (the straight line it USED to be).
    p.moveTo(cx0, cy0 + cs);
    p.lineTo(cx0 + cs, cy0);
    return p;
  }, [cx0, cy0, cs]);

  const waves = useDerivedValue(() => {
    const ph = phase.value;
    const p = Skia.Path.Make();
    const K = Math.tanh(2.6);
    const N = 70;
    // Input wave (its drawn amplitude follows the drive).
    for (let i = 0; i <= N; i++) {
      const t = i / N;
      const s = drive * Math.sin(t * 2 * Math.PI * 2.2 - ph);
      const x = wx0 + t * ww;
      const yi = midIn - s * (cs * 0.2);
      if (i === 0) p.moveTo(x, yi);
      else p.lineTo(x, yi);
    }
    // Output as its own subpath.
    for (let i = 0; i <= N; i++) {
      const t = i / N;
      const s = drive * Math.sin(t * 2 * Math.PI * 2.2 - ph);
      const out = Math.tanh(2.6 * s) / K;
      const x = wx0 + t * ww;
      const yo = midOut - out * (cs * 0.2);
      if (i === 0) p.moveTo(x, yo);
      else p.lineTo(x, yo);
    }
    return p;
  }, [phase, wx0, ww, midIn, midOut, cs, drive]);

  return (
    <Canvas style={{ width: w, height: h, backgroundColor: BG }}>
      <SkLine p1={{ x: wx0, y: midIn }} p2={{ x: w - 8, y: midIn }} color={GHOST} strokeWidth={1} />
      <SkLine p1={{ x: wx0, y: midOut }} p2={{ x: w - 8, y: midOut }} color={GHOST} strokeWidth={1} />
      <Path path={curve} color={METAL} style="stroke" strokeWidth={2} />
      <Path path={waves} color={WAVE} style="stroke" strokeWidth={2.2} />
    </Canvas>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 9 · Tube vs transistor — two physics, one job

export function TubeVsTransistorView({
  phase,
  width,
  height = 190,
}: {
  phase: SharedValue<number>;
  width: number;
  height?: number;
}) {
  const w = width;
  const h = height;
  const half = w / 2;
  const top = 22;
  const bot = h - 22;

  const chrome = useMemo(() => {
    const p = Skia.Path.Make();
    // Divider.
    p.moveTo(half, 8);
    p.lineTo(half, h - 8);
    // LEFT — mini tube: envelope + cathode/grid/plate.
    const tcx = half * 0.5;
    p.addRRect(Skia.RRectXY(Skia.XYWHRect(tcx - 34, top, 68, bot - top), 20, 20));
    p.moveTo(tcx - 20, bot - 14);
    p.lineTo(tcx + 20, bot - 14); // cathode
    for (let i = -2; i <= 2; i++) p.addCircle(tcx + i * 9, (top + bot) / 2, 1.8); // grid
    p.moveTo(tcx - 20, top + 14);
    p.lineTo(tcx + 20, top + 14); // plate
    // RIGHT — transistor: three semiconductor layers, thin base.
    const rx = half + half * 0.5;
    p.addRect(Skia.XYWHRect(rx - 30, top + 6, 60, (bot - top - 12) * 0.42)); // collector
    p.addRect(Skia.XYWHRect(rx - 30, top + 6 + (bot - top - 12) * 0.42, 60, (bot - top - 12) * 0.16)); // base (thin)
    p.addRect(Skia.XYWHRect(rx - 30, top + 6 + (bot - top - 12) * 0.58, 60, (bot - top - 12) * 0.42)); // emitter
    // Base lead.
    p.moveTo(rx + 30, top + 6 + (bot - top - 12) * 0.5);
    p.lineTo(rx + 44, top + 6 + (bot - top - 12) * 0.5);
    return p;
  }, [half, h, top, bot]);

  const carriers = useDerivedValue(() => {
    const ph = phase.value;
    const p = Skia.Path.Make();
    const tcx = half * 0.5;
    // Tube: electrons crossing open vacuum, cathode → plate (upward).
    for (let i = 0; i < 12; i++) {
      const f = (ph / (2 * Math.PI) + hashW(i * 31.7)) % 1;
      const x = tcx - 16 + hashW(i * 7.3) * 32;
      p.addCircle(x, bot - 18 - f * (bot - top - 34), 1.8);
    }
    // Transistor: carriers crossing the junctions, emitter → collector.
    const rx = half + half * 0.5;
    for (let i = 0; i < 12; i++) {
      const f = (ph / (2 * Math.PI) + hashW(i * 13.9)) % 1;
      const x = rx - 24 + hashW(i * 5.9) * 48;
      p.addCircle(x, bot - 12 - f * (bot - top - 24), 1.8);
    }
    return p;
  }, [phase, half, top, bot]);

  return (
    <Canvas style={{ width: w, height: h, backgroundColor: BG }}>
      <Path path={chrome} color={METAL} style="stroke" strokeWidth={2} />
      <Path path={carriers} color={ELECTRON} opacity={0.9} />
    </Canvas>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 10 · Classic tubes — bottle glyphs for the gallery

export function TubeGlyph({
  width,
  height = 92,
  kind,
}: {
  width: number;
  height?: number;
  kind: 'preamp' | 'power';
}) {
  const w = width;
  const h = height;
  const cx = w / 2;

  const art = useMemo(() => {
    const p = Skia.Path.Make();
    const bw = kind === 'power' ? 34 : 20; // bottle half-width
    const topY = kind === 'power' ? 8 : 16;
    const baseY = h - 18;
    p.moveTo(cx - bw, baseY);
    p.lineTo(cx - bw, topY + 18);
    p.addArc({ x: cx - bw, y: topY, width: 2 * bw, height: 36 }, 180, 180);
    p.moveTo(cx + bw, topY + 18);
    p.lineTo(cx + bw, baseY);
    p.addRRect(Skia.RRectXY(Skia.XYWHRect(cx - bw + 4, baseY, 2 * bw - 8, 8), 2, 2));
    // Internal hint: plate box + grid dots.
    p.addRect(Skia.XYWHRect(cx - bw * 0.5, topY + 20, bw, baseY - topY - 30));
    for (let i = 0; i < 3; i++) p.addCircle(cx, topY + 30 + i * 12, 1.6);
    return p;
  }, [cx, h, kind]);

  return (
    <Canvas style={{ width: w, height: h, backgroundColor: BG }}>
      <Path path={art} color={kind === 'power' ? METAL : GLASS} style="stroke" strokeWidth={2.2} />
    </Canvas>
  );
}
