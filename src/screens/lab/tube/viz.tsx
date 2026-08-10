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
 * VISUAL STANDARDS (docs/APE_VISUAL_STANDARDS_2026_07_29.md): physical objects
 * are drawn as recognizable illustrations — glass bottles with gradients and a
 * specular streak, gradient-sheened metal electrodes, bakelite bases with real
 * pins, battery cell stacks, a TO-92 transistor package — never bare
 * rect/line/circle proxies. Abstract data (transfer curves, waves) stays
 * geometric but styled: gradient underfills, glow strokes, soft zone shading.
 * Light comes from the upper-left; the filament glow breathes on the phase
 * clock. All math (plateCurrent01, bias/saturation/amplify formulas, particle
 * counts) is unchanged — this is a restyle only.
 *
 * ONLY this file (and foundations/viz, for the clocks) imports Skia; loaded
 * solely via tube/skiaGate.requireTubeViz() so pre-Skia clients never touch it.
 */
import { useMemo } from 'react';
import {
  BlurMask,
  Canvas,
  Circle,
  DashPathEffect,
  Line as SkLine,
  LinearGradient,
  Path,
  RadialGradient,
  RoundedRect,
  Skia,
  vec,
} from '@shopify/react-native-skia';
import { useDerivedValue, type SharedValue } from 'react-native-reanimated';
export { usePhaseClock, useVizClock } from '../foundations/viz';
import { MIDLINE_BLUE, WAVE_LEVEL_STOPS } from '../../../features/tools/levelColor';
import { TUBE_INK, TUBE_INK_EXTRA } from './tubeInks';

// ── REFERENCE-CARD INK CODE (owner 2026-08-10) ──────────────────────────────
// The Tube Reference cards define the official per-element color language;
// every drawing below uses it so the lab animations and the reference images
// read as ONE system: heater orange · cathode teal · control grid blue ·
// screen grid purple · suppressor/beam gold · plate amber · glass silver.
// Tap-highlights glow in the ELEMENT'S OWN ink (matching its card callout),
// not a generic amber. Geometry & math unchanged — this is the ink layer.
const INK = TUBE_INK;
const INK_X = TUBE_INK_EXTRA;

// App-wide amplitude→colour standard (owner 2026-07-31): the MIDI-velocity ramp,
// MIDI-0 blue at the mid line climbing to red at ±full scale. Split into Skia
// LinearGradient colours/positions once.
const WAVE_LEVEL_COLORS = WAVE_LEVEL_STOPS.map((s) => s.color);
const WAVE_LEVEL_POS = WAVE_LEVEL_STOPS.map((s) => s.offset);

const GLASS = '#4a4a54';
const METAL = '#8a8c94';
const WAVE = '#ffc64d';
const GLOW = '#ffb246';
const ELECTRON = '#6fa8ff';
const ACCENT_GREEN = '#5bff85';
const ACCENT_RED = '#ff6b5e';
const GHOST = '#2e2f38';
const BG = '#0c0c0f';

// Illustration tones (light from the upper-left).
const METAL_LIGHT = '#b9bdc7';
const METAL_MID = '#82868f';
const METAL_DARK = '#4d5058';
const PLATE_LIGHT = '#9aa0ac';
const PLATE_MID = '#5c6069';
const PLATE_DARK = '#3b3e46';
const BAKELITE_LIGHT = '#4a3529';
const BAKELITE_MID = '#33241b';
const BAKELITE_DARK = '#221913';
const GLASS_EDGE = '#5d6270';
const FILAMENT_CORE = '#ffe4a8';

/** Worklet-safe deterministic hash (foundations idiom). */
function hashW(n: number): number {
  'worklet';
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
// Shared illustration helpers (internal — not part of the module contract)

/** Smooth glass-bottle silhouette: straight sides, organic dome, closed fill. */
function makeBottlePath(cx: number, topY: number, baseY: number, hw: number, domeH: number) {
  const p = Skia.Path.Make();
  const shoulder = topY + domeH;
  p.moveTo(cx - hw, baseY);
  p.lineTo(cx - hw, shoulder);
  p.cubicTo(cx - hw, topY + domeH * 0.38, cx - hw * 0.6, topY, cx, topY);
  p.cubicTo(cx + hw * 0.6, topY, cx + hw, topY + domeH * 0.38, cx + hw, shoulder);
  p.lineTo(cx + hw, baseY);
  p.close();
  return p;
}

/** Specular streak hugging the inner-left of a bottle (upper-left light). */
function makeStreakPath(cx: number, topY: number, baseY: number, hw: number, domeH: number) {
  const p = Skia.Path.Make();
  const x = cx - hw + Math.max(6, hw * 0.16);
  p.moveTo(x, baseY - 10);
  p.lineTo(x, topY + domeH + 4);
  p.cubicTo(x + 1, topY + domeH * 0.55, cx - hw * 0.45, topY + 6, cx - hw * 0.12, topY + 4);
  return p;
}

/** Vertical metal panel with a left-lit sheen. */
function MetalPanel({ x, y, w, h, r = 3, opacity = 1 }: { x: number; y: number; w: number; h: number; r?: number; opacity?: number }) {
  return (
    <RoundedRect x={x} y={y} width={w} height={h} r={r} opacity={opacity}>
      <LinearGradient start={vec(x, y)} end={vec(x + w, y)} colors={[PLATE_LIGHT, PLATE_MID, PLATE_DARK]} />
    </RoundedRect>
  );
}

/** Bright cathode-sleeve cylinder (lighter metal than the plate). */
function CathodeSleeve({ x, y, w, h, r = 6, opacity = 1 }: { x: number; y: number; w: number; h: number; r?: number; opacity?: number }) {
  return (
    <RoundedRect x={x} y={y} width={w} height={h} r={r} opacity={opacity}>
      <LinearGradient start={vec(x, y)} end={vec(x + w, y)} colors={[METAL_LIGHT, METAL_MID, METAL_DARK]} />
    </RoundedRect>
  );
}

/** Subtle scene depth: radial lift in the middle fading to the bg. */
function Vignette({ w, h }: { w: number; h: number }) {
  return (
    <RoundedRect x={0} y={0} width={w} height={h} r={0}>
      <RadialGradient c={vec(w / 2, h * 0.42)} r={Math.max(w, h) * 0.72} colors={['#16161c', BG]} />
    </RoundedRect>
  );
}

/** Bakelite tube base with gradient + top rim highlight. */
function BakeliteBase({ x, y, w, h, r = 4 }: { x: number; y: number; w: number; h: number; r?: number }) {
  return (
    <>
      <RoundedRect x={x} y={y} width={w} height={h} r={r}>
        <LinearGradient start={vec(x, y)} end={vec(x, y + h)} colors={[BAKELITE_LIGHT, BAKELITE_MID, BAKELITE_DARK]} />
      </RoundedRect>
      <RoundedRect x={x + 2} y={y + 1} width={w - 4} height={2.4} r={1.2} color="#6b4c38" opacity={0.6} />
    </>
  );
}

/** One base pin: metal gradient + a tiny left-edge highlight. */
function Pin({ x, y, h }: { x: number; y: number; h: number }) {
  return (
    <>
      <RoundedRect x={x - 1.6} y={y} width={3.2} height={h} r={1.6}>
        <LinearGradient start={vec(x - 1.6, y)} end={vec(x + 1.6, y)} colors={['#cfd3db', '#8a8e98', '#4f525a']} />
      </RoundedRect>
      <RoundedRect x={x - 1.1} y={y + 1} width={0.9} height={h - 3} r={0.45} color="#ffffff" opacity={0.35} />
    </>
  );
}

/** A single battery cell drawn as a real cell: body, sheen, + cap. */
function BatteryCell({ x, y, w, h }: { x: number; y: number; w: number; h: number }) {
  return (
    <>
      <RoundedRect x={x} y={y} width={w} height={h} r={2}>
        <LinearGradient start={vec(x, y)} end={vec(x + w, y)} colors={['#565a64', '#33363e', '#1f2127']} />
      </RoundedRect>
      <RoundedRect x={x + 1.4} y={y + 1.5} width={1.4} height={h - 3} r={0.7} color="#ffffff" opacity={0.22} />
      <RoundedRect x={x + w / 2 - 2} y={y - 3} width={4} height={3.4} r={1}>
        <LinearGradient start={vec(x + w / 2 - 2, y - 3)} end={vec(x + w / 2 + 2, y - 3)} colors={['#e8c887', '#b98f3f']} />
      </RoundedRect>
    </>
  );
}

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
  visible,
}: {
  phase: SharedValue<number>;
  width: number;
  height?: number;
  kind: TubeKind;
  /** The tapped part (glows in its own ink), or null. */
  highlight: TubePart | null;
  electronView: boolean;
  /** Types screen: animate secondary emission (tetrode problem, pentode fix). */
  showSecondary?: boolean;
  /** Inside screen show/hide toggles (owner 2026-08-10): which parts are drawn;
   *  undefined = all. The glass silhouette always renders (hide-all = glass
   *  only). PHYSICS-CONSEQUENCE mode (owner 2026-08-10 "next level"): hiding a
   *  part changes what the electrons DO, not just what is drawn — no heater =
   *  cold cathode (stuck electrons), no glass = air scatter, no plate = space
   *  charge falls back, no G1 = wide-open flood, no G2 = crawl, no G3 = red
   *  secondaries leak back. Each part visibly earns its place. */
  visible?: readonly TubePart[];
}) {
  const w = width;
  const h = height;
  const cx = w / 2;
  const topY = 16;
  const baseY = h - 46;
  const stackTop = topY + 34;
  const stackBot = baseY - 16;
  const heaterCy = (stackTop + stackBot) / 2;

  const hasScreen = kind !== 'triode';
  const hasSuppressor = kind === 'pentode';

  // Reference-card ink code: each element is ALWAYS drawn in its own ink; a
  // tapped part glows brighter in that same ink (its card-callout color).
  const hl = (part: TubePart) => highlight === part;
  // Show/hide toggles (owner 2026-08-10): undefined = everything visible.
  const show = (part: TubePart) => !visible || visible.includes(part);
  const heaterOn = show('heater');
  const cathodeOn = show('cathode');
  // Physics flags (owner 2026-08-10): emission needs BOTH the heater (the heat)
  // and the cathode (the coated emitter surface) — hide either and the flow
  // stops, each for its own reason.
  const emitting = heaterOn && cathodeOn;
  const glassOn = show('envelope');
  const plateOn = show('plate');
  const g1On = show('grid');
  const g2On = hasScreen && show('screen');
  const g3On = hasSuppressor && show('suppressor');
  // Inside screen only (visible prop in use): physics consequences are live.
  const toggled = visible !== undefined;
  // Mica spacers support the electrode stack — gone once the stack is gone.
  const anyStack = show('plate') || show('grid') || show('screen') || show('suppressor') || cathodeOn || heaterOn;

  // Static geometry (symmetric side cross-section).
  const parts = useMemo(() => {
    const bottle = makeBottlePath(cx, topY, baseY, 58, 34);
    const streak = makeStreakPath(cx, topY, baseY, 58, 34);

    // Faint inner reflection down the right side of the glass.
    const innerRefl = Skia.Path.Make();
    innerRefl.moveTo(cx + 49, baseY - 14);
    innerRefl.lineTo(cx + 49, topY + 40);
    innerRefl.cubicTo(cx + 49, topY + 26, cx + 38, topY + 12, cx + 22, topY + 8);

    // Evacuation tip nub on the dome.
    const nub = Skia.Path.Make();
    nub.addRRect(Skia.RRectXY(Skia.XYWHRect(cx - 2.4, topY - 7, 4.8, 9), 2.2, 2.2));

    // Silver getter flash coating the inside of the dome (the mirror-like
    // patch every real tube carries — drawn on all the reference cards).
    const getterFlash = Skia.Path.Make();
    getterFlash.moveTo(cx - 44, topY + 22);
    getterFlash.cubicTo(cx - 30, topY + 3, cx + 30, topY + 3, cx + 44, topY + 22);
    getterFlash.cubicTo(cx + 26, topY + 15, cx - 26, topY + 15, cx - 44, topY + 22);
    getterFlash.close();

    const heater = Skia.Path.Make();
    // Zigzag filament inside the cathode sleeve.
    const zn = 8;
    for (let i = 0; i <= zn; i++) {
      const y = stackTop + 8 + ((stackBot - stackTop - 16) * i) / zn;
      const x = cx + (i % 2 === 0 ? -3 : 3);
      if (i === 0) heater.moveTo(x, y);
      else heater.lineTo(x, y);
    }

    // Grids drawn the way the REFERENCE CARDS draw them: fine horizontal coil
    // turns (the winding cut by the section plane), not dots — G1 wound
    // tightest, G2 coarser, G3 coarsest (true to construction and the cards).
    const rungs = (dx: number, step: number) => {
      const p = Skia.Path.Make();
      for (const sgn of [-1, 1]) {
        for (let y = stackTop + 8; y <= stackBot - 8; y += step) {
          p.moveTo(cx + sgn * dx - 4.5, y);
          p.lineTo(cx + sgn * dx + 4.5, y);
        }
      }
      return p;
    };
    const gridP = rungs(19, 7);
    const screenP = hasScreen ? rungs(31, 10) : Skia.Path.Make();
    const suppP = hasSuppressor ? rungs(43, 13) : Skia.Path.Make();

    // Slim support rods behind each grid-wire column — one path per grid type
    // so each grid's rods show/hide with it (owner 2026-08-10).
    const rodPair = (dx: number) => {
      const p = Skia.Path.Make();
      for (const sgn of [-1, 1]) {
        p.moveTo(cx + sgn * dx, stackTop + 4);
        p.lineTo(cx + sgn * dx, stackBot - 4);
      }
      return p;
    };
    const rodsG = rodPair(19);
    const rodsS = rodPair(31);
    const rodsX = rodPair(43);

    const vacuum = Skia.Path.Make();
    vacuum.addRRect(Skia.RRectXY(Skia.XYWHRect(cx - 56, topY + 6, 112, baseY - topY - 10), 26, 26));
    return { bottle, streak, innerRefl, nub, getterFlash, heater, gridP, screenP, suppP, rodsG, rodsS, rodsX, vacuum };
  }, [cx, topY, baseY, stackTop, stackBot, hasScreen, hasSuppressor]);

  // Physical view: the filament glow breathes (same radius law as ever).
  const glowR = useDerivedValue(() => {
    const ph = phase.value;
    return electronView || !heaterOn ? 0 : 13 + 2.5 * Math.sin(ph);
  }, [phase, electronView, heaterOn]);
  const glowROuter = useDerivedValue(() => {
    const ph = phase.value;
    return electronView || !heaterOn ? 0 : (13 + 2.5 * Math.sin(ph)) * 2.3;
  }, [phase, electronView, heaterOn]);
  // The warm glass tint — the whole envelope catches the filament light.
  const ambientO = useDerivedValue(() => {
    const ph = phase.value;
    return electronView || !heaterOn ? 0 : 0.1 + 0.035 * Math.sin(ph);
  }, [phase, electronView, heaterOn]);

  // PHYSICS-CONSEQUENCE electron sim (owner 2026-08-10): what the electrons DO
  // depends on which parts are present. Dominant effect wins: emission gate →
  // air scatter (no glass) → space-charge fallback (no plate) → normal transit
  // shaped by G1 (bunching), G2 (acceleration).
  const electrons = useDerivedValue(() => {
    const ph = phase.value;
    const p = Skia.Path.Make();
    if (!electronView || !emitting) return p;
    const T = ph / (2 * Math.PI);
    const rowY = (i: number) => stackTop + 8 + hashW(i * 13.7) * (stackBot - stackTop - 16);

    if (toggled && !glassOn) {
      // NO GLASS = NO VACUUM: air molecules everywhere — electrons zigzag a few
      // steps off the cathode, collide, and are gone (f>0.45 = dead, respawn).
      for (let i = 0; i < 26; i++) {
        const f = (T * 1.4 + hashW(i * 71.3)) % 1;
        if (f > 0.45) continue;
        const sgn = i % 2 === 0 ? 1 : -1;
        const zig = 3.5 * Math.sin(ph * 6 + i * 2.7);
        p.addCircle(cx + sgn * (10 + f * 26), rowY(i) + zig, 1.9);
      }
      for (let i = 0; i < 8; i++) {
        const y = stackTop + 10 + hashW(i * 5.1) * (stackBot - stackTop - 20);
        p.addCircle(cx + (hashW(i * 9.7) - 0.5) * 10, y, 1.6);
      }
      return p;
    }

    if (toggled && !plateOn) {
      // NO PLATE: nothing pulls them across — drift out, stall, fall back
      // (sin envelope out-and-return) into a THICK space-charge cloud.
      for (let i = 0; i < 26; i++) {
        const f = (T * 0.7 + hashW(i * 71.3)) % 1;
        const sgn = i % 2 === 0 ? 1 : -1;
        const r = 10 + 22 * Math.sin(Math.PI * f);
        p.addCircle(cx + sgn * r, rowY(i) + 2 * Math.sin(ph * 2 + i), 1.9);
      }
      for (let i = 0; i < 18; i++) {
        const y = stackTop + 10 + hashW(i * 5.1) * (stackBot - stackTop - 20);
        p.addCircle(cx + (hashW(i * 9.7) - 0.5) * 14, y, 1.6);
      }
      return p;
    }

    // NORMAL TRANSIT — shaped by which grids are in:
    //  G1 in  → the flow is METERED into marching bunches (4 packets);
    //  G1 out → wide-open uncontrolled flood (more, faster, uniform).
    //  G2 in  → crawl to the screen grid, then its + charge SNAPS them across;
    //  G2 out → sluggish crawl the whole way.
    const n = !toggled || g1On ? 30 : 38;
    const rate = (toggled && !g1On ? 1.35 : 1) * (toggled && hasScreen && !g2On ? 0.55 : 1);
    for (let i = 0; i < n; i++) {
      const off =
        toggled && g1On ? (i % 4) / 4 + hashW(i * 71.3) * 0.09 : hashW(i * 71.3);
      const f = (T * rate + off) % 1;
      const sgn = i % 2 === 0 ? 1 : -1;
      const r =
        toggled && g2On
          ? f < 0.62
            ? 10 + (f / 0.62) * 21
            : 31 + ((f - 0.62) / 0.38) * 20
          : 10 + f * 41;
      p.addCircle(cx + sgn * r, rowY(i) + 2 * Math.sin(ph * 2 + i), 1.9);
    }
    // Space-charge cloud hugging the cathode.
    for (let i = 0; i < 12; i++) {
      const y = stackTop + 10 + hashW(i * 5.1) * (stackBot - stackTop - 20);
      p.addCircle(cx + (hashW(i * 9.7) - 0.5) * 10, y, 1.6);
    }
    return p;
  }, [phase, cx, stackTop, stackBot, electronView, emitting, toggled, glassOn, plateOn, g1On, g2On, hasScreen]);

  // COLD CATHODE (heater hidden, cathode shown): a few dim electrons cling to
  // the sleeve and tremble — not enough heat to escape the metal.
  const coldDots = useDerivedValue(() => {
    const ph = phase.value;
    const p = Skia.Path.Make();
    if (electronView && toggled && cathodeOn && !heaterOn) {
      for (let i = 0; i < 7; i++) {
        const y = stackTop + 12 + hashW(i * 6.3) * (stackBot - stackTop - 24);
        p.addCircle(cx + (i % 2 === 0 ? 8.5 : -8.5) + 0.8 * Math.sin(ph * 3 + i * 2.1), y, 1.5);
      }
    }
    return p;
  }, [phase, cx, stackTop, stackBot, electronView, toggled, cathodeOn, heaterOn]);

  // AIR (glass hidden): gray molecules drift through the whole envelope — the
  // vacuum is GONE, and the drawing says so at a glance.
  const airDots = useDerivedValue(() => {
    const ph = phase.value;
    const p = Skia.Path.Make();
    if (toggled && !glassOn) {
      for (let i = 0; i < 22; i++) {
        const x = cx - 52 + hashW(i * 3.7) * 104 + 4 * Math.sin(ph * 0.8 + i * 1.7);
        const y = topY + 14 + hashW(i * 8.9) * (baseY - topY - 26) + 3 * Math.cos(ph * 0.6 + i * 2.3);
        p.addCircle(x, y, 1.3);
      }
    }
    return p;
  }, [phase, cx, topY, baseY, toggled, glassOn]);

  const secondaries = useDerivedValue(() => {
    const ph = phase.value;
    const p = Skia.Path.Make();
    // Secondary emission: electrons knocked BACK off the plate.
    //  · Types screen (showSecondary): tetrode problem vs pentode fix, as ever.
    //  · Inside screen (toggled): hiding G3 UNLEASHES the problem — red
    //    secondaries leak back toward the + screen grid; re-add G3 and they
    //    vanish (the suppressor visibly earning its place).
    const g3Fix = hasSuppressor && g3On;
    const demo = showSecondary && hasScreen;
    const auto = toggled && !showSecondary && g2On && !g3Fix && glassOn && plateOn;
    if (electronView && emitting && (demo || auto)) {
      for (let i = 0; i < 5; i++) {
        const y = stackTop + 16 + hashW(i * 3.3) * (stackBot - stackTop - 32);
        const f = (ph / (2 * Math.PI) + i / 5) % 1;
        const span = g3Fix ? 9 : 21; // stopped at suppressor vs reaching screen
        const sgn = i % 2 === 0 ? 1 : -1;
        p.addCircle(cx + sgn * (52 - f * span), y, 1.8);
      }
    }
    return p;
  }, [phase, cx, stackTop, stackBot, electronView, showSecondary, hasScreen, hasSuppressor, emitting, toggled, g2On, g3On, glassOn, plateOn]);

  const stackH = stackBot - stackTop;
  return (
    <Canvas style={{ width: w, height: h, backgroundColor: BG }}>
      <Vignette w={w} h={h} />
      {/* Ground shadow lifting the bottle off the floor. */}
      <RoundedRect x={cx - 52} y={h - 8} width={104} height={4.5} r={2.2} color="#000000" opacity={0.5}>
        <BlurMask blur={5} style="normal" />
      </RoundedRect>
      {/* Warm ambient tube glow tinting the glass (physical view). */}
      <Circle cx={cx} cy={heaterCy} r={64} color={GLOW} opacity={ambientO}>
        <BlurMask blur={26} style="normal" />
      </Circle>
      {show('vacuum') ? (
        <Path path={parts.vacuum} color={INK.vacuum} style="stroke" strokeWidth={1.4} opacity={0.16}>
          <DashPathEffect intervals={[6, 7]} />
        </Path>
      ) : null}
      {hl('vacuum') ? (
        <Path path={parts.vacuum} color={INK.vacuum} style="stroke" strokeWidth={2.4} opacity={0.85}>
          <BlurMask blur={3} style="normal" />
        </Path>
      ) : null}

      {/* AIR flooding the envelope when the glass is hidden (no vacuum!) —
          gray molecules drifting everywhere the electrons need to fly. */}
      <Path path={airDots} color="#9aa0ad" opacity={0.32} />

      {/* ── Internals (drawn first; the glass overlays them) ── */}
      {/* Plate: gray metal box — translucent front face + gradient side walls. */}
      {show('plate') ? (
        <>
          {/* Card-style plate: the near-black anode box with a bold amber
              outline — the section plane opens the front, so everything inside
              stays visible (exactly how the reference cards draw it). */}
          <RoundedRect x={cx - 53} y={stackTop} width={106} height={stackH} r={5} color="#0e0e12" opacity={0.8} />
          <RoundedRect x={cx - 53} y={stackTop} width={106} height={stackH} r={5} color={INK.plate} style="stroke" strokeWidth={2.4} opacity={hl('plate') ? 1 : 0.9} />
          {hl('plate') ? (
            <RoundedRect x={cx - 53} y={stackTop} width={106} height={stackH} r={5} color={INK.plate} style="stroke" strokeWidth={4.2}>
              <BlurMask blur={4.5} style="normal" />
            </RoundedRect>
          ) : null}
        </>
      ) : null}

      {/* Mica spacer discs capping the electrode stack (tan, as on the cards);
          they support the stack, so they leave when the whole stack is hidden. */}
      {anyStack ? (
        <>
          <RoundedRect x={cx - 50} y={stackTop - 9.5} width={100} height={5.5} r={2.4}>
            <LinearGradient start={vec(cx - 50, stackTop - 9.5)} end={vec(cx - 50, stackTop - 4)} colors={[INK_X.micaHi, INK_X.micaLo]} />
          </RoundedRect>
          <RoundedRect x={cx - 50} y={stackBot + 3.5} width={100} height={5.5} r={2.4}>
            <LinearGradient start={vec(cx - 50, stackBot + 3.5)} end={vec(cx - 50, stackBot + 9)} colors={[INK_X.micaHi, INK_X.micaLo]} />
          </RoundedRect>
        </>
      ) : null}

      {/* Grid helices: faint support rods + neat wire dots. */}
      {/* Grid helices in the card ink code: G1 blue · G2 purple · G3 gold —
          each with its own support rods, so each toggles as one unit. */}
      {show('grid') ? <Path path={parts.rodsG} color={INK.grid} style="stroke" strokeWidth={1.3} opacity={0.5} /> : null}
      {hasScreen && show('screen') ? <Path path={parts.rodsS} color={INK.screen} style="stroke" strokeWidth={1.3} opacity={0.5} /> : null}
      {hasSuppressor && show('suppressor') ? <Path path={parts.rodsX} color={INK.suppressor} style="stroke" strokeWidth={1.3} opacity={0.5} /> : null}
      {hasSuppressor && show('suppressor') ? <Path path={parts.suppP} color={INK.suppressor} style="stroke" strokeWidth={1.7} /> : null}
      {hasSuppressor && show('suppressor') && hl('suppressor') ? (
        <Path path={parts.suppP} color={INK.suppressor} style="stroke" strokeWidth={3}>
          <BlurMask blur={4} style="normal" />
        </Path>
      ) : null}
      {hasScreen && show('screen') ? <Path path={parts.screenP} color={INK.screen} style="stroke" strokeWidth={1.7} /> : null}
      {hasScreen && show('screen') && hl('screen') ? (
        <Path path={parts.screenP} color={INK.screen} style="stroke" strokeWidth={3}>
          <BlurMask blur={4} style="normal" />
        </Path>
      ) : null}
      {show('grid') ? <Path path={parts.gridP} color={INK.grid} style="stroke" strokeWidth={1.7} /> : null}
      {show('grid') && hl('grid') ? (
        <Path path={parts.gridP} color={INK.grid} style="stroke" strokeWidth={3}>
          <BlurMask blur={4} style="normal" />
        </Path>
      ) : null}

      {/* Card-style cathode: a SOLID teal emitting sleeve (the coated cylinder),
          with a lighter core streak — exactly the cards' teal bar. */}
      {show('cathode') ? (
        <>
          <RoundedRect x={cx - 8} y={stackTop + 4} width={16} height={stackH - 8} r={6}>
            <LinearGradient start={vec(cx - 8, stackTop)} end={vec(cx + 8, stackTop)} colors={['#63e2d4', '#2fae9f', '#1d7f73']} />
          </RoundedRect>
          <RoundedRect x={cx - 5.5} y={stackTop + 8} width={3} height={stackH - 16} r={1.5} color="#c8f4ee" opacity={0.5} />
          {hl('cathode') ? (
            <RoundedRect x={cx - 8} y={stackTop + 4} width={16} height={stackH - 8} r={6} color={INK.cathode} style="stroke" strokeWidth={2.8}>
              <BlurMask blur={3.5} style="normal" />
            </RoundedRect>
          ) : null}
        </>
      ) : null}

      {/* Heater: layered warm radial glow (breathing) + the zigzag filament. */}
      <Circle cx={cx} cy={heaterCy} r={glowROuter} color={GLOW} opacity={0.3}>
        <BlurMask blur={16} style="normal" />
      </Circle>
      <Circle cx={cx} cy={heaterCy} r={glowR} color={FILAMENT_CORE} opacity={0.5}>
        <BlurMask blur={7} style="normal" />
      </Circle>
      {heaterOn ? (
        <>
          {!electronView ? <Path path={parts.heater} color={GLOW} style="stroke" strokeWidth={3.4} opacity={0.5}><BlurMask blur={3} style="normal" /></Path> : null}
          {/* Heater in its orange card ink; a thin white-hot core when lit. */}
          <Path path={parts.heater} color={INK.heater} style="stroke" strokeWidth={2} />
          {!electronView ? <Path path={parts.heater} color={FILAMENT_CORE} style="stroke" strokeWidth={0.9} opacity={0.85} /> : null}
          {hl('heater') ? (
            <Path path={parts.heater} color={INK.heater} style="stroke" strokeWidth={3.2}>
              <BlurMask blur={4} style="normal" />
            </Path>
          ) : null}
        </>
      ) : null}

      {/* Electrons: soft halo layer + bright cores. */}
      <Path path={electrons} color={ELECTRON} opacity={0.4}>
        <BlurMask blur={4.5} style="normal" />
      </Path>
      <Path path={electrons} color={ELECTRON} opacity={0.9} />
      {/* Cold-cathode electrons: stuck to the sleeve, trembling, going nowhere. */}
      <Path path={coldDots} color={ELECTRON} opacity={0.35} />
      <Path path={secondaries} color={ACCENT_RED} opacity={0.5}>
        <BlurMask blur={4} style="normal" />
      </Path>
      <Path path={secondaries} color={ACCENT_RED} opacity={0.9} />

      {/* ── The glass, overlaying the internals. The silhouette ALWAYS renders
          (hide-all = glass only, owner 2026-08-10); un-ticking GLASS keeps a
          faint outline so the tube never vanishes entirely. ── */}
      {show('envelope') ? (
        <>
          <Path path={parts.bottle}>
            <LinearGradient
              start={vec(cx - 58, topY)}
              end={vec(cx + 58, topY)}
              colors={['#8f97a824', '#58607014', '#2e313b0e', '#47506019']}
            />
          </Path>
          {/* Getter flash: the mirror-silver dome coating (reference-card look). */}
          <Path path={parts.getterFlash} opacity={0.5}>
            <LinearGradient start={vec(cx, topY + 3)} end={vec(cx, topY + 22)} colors={[INK_X.getterFlashHi, INK_X.getterFlashLo]} />
          </Path>
        </>
      ) : null}
      <Path path={parts.bottle} color={hl('envelope') ? INK.envelope : INK_X.glassEdge} style="stroke" strokeWidth={2.4} opacity={show('envelope') ? 1 : 0.4} />
      {hl('envelope') ? (
        <Path path={parts.bottle} color={INK.envelope} style="stroke" strokeWidth={3.5} opacity={0.9}>
          <BlurMask blur={4} style="normal" />
        </Path>
      ) : null}
      {show('envelope') ? (
        <>
          <Path path={parts.streak} style="stroke" strokeWidth={4.5} strokeCap="round" opacity={0.8}>
            <LinearGradient start={vec(0, topY)} end={vec(0, baseY)} colors={['#ffffff5c', '#ffffff24', '#ffffff06']} />
            <BlurMask blur={1.6} style="normal" />
          </Path>
          <Path path={parts.innerRefl} color="#ffffff" style="stroke" strokeWidth={1.6} strokeCap="round" opacity={0.07} />
          {/* Evacuation tip nub. */}
          <Path path={parts.nub}>
            <LinearGradient start={vec(cx - 2.4, topY - 7)} end={vec(cx + 2.4, topY - 7)} colors={['#9aa2b2', '#565d6b']} />
          </Path>
          <Circle cx={cx - 0.7} cy={topY - 5.4} r={1} color="#ffffff" opacity={0.55} />
        </>
      ) : null}

      {/* ── Bakelite base + metal pins ── */}
      <BakeliteBase x={cx - 44} y={baseY} w={88} h={18} />
      {[-3, -2, -1, 0, 1, 2, 3].map((i) => (
        <Pin key={i} x={cx + i * 12} y={baseY + 18} h={12} />
      ))}
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
  const midY = (top + bot) / 2;

  // Heater zigzag behind the cathode sleeve (same geometry as ever).
  const heaterZig = useMemo(() => {
    const p = Skia.Path.Make();
    const zn = 7;
    for (let i = 0; i <= zn; i++) {
      const y = top + 6 + ((bot - top - 12) * i) / zn;
      const x = cathX - 12 + (i % 2 === 0 ? -3 : 3);
      if (i === 0) p.moveTo(x, y);
      else p.lineTo(x, y);
    }
    return p;
  }, [cathX, top, bot]);

  // Brass "+" badge marking the plate's positive terminal.
  const plusMark = useMemo(() => {
    const p = Skia.Path.Make();
    const px = plateX + 15;
    const py = top + 16;
    p.moveTo(px - 4, py);
    p.lineTo(px + 4, py);
    p.moveTo(px, py - 4);
    p.lineTo(px, py + 4);
    return p;
  }, [plateX, top]);

  // Heater glow ramps first (radius law unchanged; zero below the threshold).
  const glowR = useDerivedValue(() => {
    const ph = phase.value;
    const g = Math.min(1, heat01 / 0.3);
    return g > 0.02 ? (8 + 2 * Math.sin(ph)) * g + 4 : 0;
  }, [phase, heat01]);
  const glowROuter = useDerivedValue(() => {
    const ph = phase.value;
    const g = Math.min(1, heat01 / 0.3);
    return g > 0.02 ? ((8 + 2 * Math.sin(ph)) * g + 4) * 2.2 : 0;
  }, [phase, heat01]);
  const heaterO = Math.min(1, heat01 / 0.3);

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
        // Gently arced flight path instead of a dead-straight lane.
        const bend = Math.sin(f * Math.PI) * 5 * (hashW(i * 2.3) - 0.5);
        p.addCircle(cathX + 8 + f * (plateX - cathX - 16), y + bend, 1.9);
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
      <Vignette w={w} h={h} />
      {/* Heater: layered warm glow behind the sleeve. */}
      <Circle cx={cathX - 12} cy={midY} r={glowROuter} color={GLOW} opacity={0.3}>
        <BlurMask blur={14} style="normal" />
      </Circle>
      <Circle cx={cathX - 12} cy={midY} r={glowR} color={FILAMENT_CORE} opacity={0.55}>
        <BlurMask blur={6} style="normal" />
      </Circle>
      <Path path={heaterZig} color={GLOW} style="stroke" strokeWidth={3} opacity={0.45 * heaterO}>
        <BlurMask blur={2.5} style="normal" />
      </Path>
      {/* Heater in its orange card ink — white-hot core once it's glowing. */}
      <Path path={heaterZig} color={heaterO > 0.15 ? FILAMENT_CORE : INK.heater} style="stroke" strokeWidth={1.8} />

      {/* Cathode sleeve — the electron source, rimmed in its teal card ink. */}
      <CathodeSleeve x={cathX - 5} y={top} w={10} h={bot - top} r={5} />
      <RoundedRect x={cathX - 5} y={top} width={10} height={bot - top} r={5} color={INK.cathode} style="stroke" strokeWidth={1.3} opacity={0.75} />

      {/* Plate — gradient metal panel in its amber card ink, brass + terminal. */}
      <MetalPanel x={plateX - 3} y={top} w={11} h={bot - top} r={3.5} />
      <RoundedRect x={plateX - 3} y={top} width={11} height={bot - top} r={3.5} color={INK.plate} style="stroke" strokeWidth={1.3} opacity={0.8} />
      <Circle cx={plateX + 15} cy={top + 16} r={7}>
        <RadialGradient c={vec(plateX + 13, top + 14)} r={9} colors={['#e8c887', '#a87e35']} />
      </Circle>
      <Path path={plusMark} color="#3a2c12" style="stroke" strokeWidth={1.8} strokeCap="round" />

      {/* Electrons: halo + cores. */}
      <Path path={electrons} color={ELECTRON} opacity={0.4}>
        <BlurMask blur={4.5} style="normal" />
      </Path>
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

  const gridDots = useMemo(() => {
    const p = Skia.Path.Make();
    for (let i = 0; i < 6; i++) {
      p.addCircle(gridX, top + 10 + ((bot - top - 20) * i) / 5, 2.4);
    }
    return p;
  }, [gridX, top, bot]);

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
        // Gently curved flight through the grid gaps.
        const bend = Math.sin(f * Math.PI) * 6 * (hashW(i * 3.1) - 0.5);
        p.addCircle(cathX + 8 + f * (plateX - cathX - 14), y + bend, 1.9);
      } else {
        // Turned back before the grid: out and back on the cathode side.
        const tri = f < 0.5 ? f * 2 : 2 - f * 2;
        p.addCircle(cathX + 8 + tri * (gridX - cathX - 22), y + 1.5 * Math.sin(ph * 2 + i), 1.7);
      }
    }
    return p;
  }, [phase, cathX, gridX, plateX, top, bot, cond]);

  return (
    <Canvas style={{ width: w, height: h, backgroundColor: BG }}>
      <Vignette w={w} h={h} />
      {/* The grid's repelling field (electron view) — in the grid's blue ink. */}
      <Path path={field} color={INK.grid} style="stroke" strokeWidth={2.6} opacity={0.3}>
        <BlurMask blur={3} style="normal" />
      </Path>
      <Path path={field} color={INK.grid} style="stroke" strokeWidth={1.2} opacity={0.6} />

      {/* Cathode (teal ink) and plate (amber ink) — real metal, card-coded rims. */}
      <CathodeSleeve x={cathX - 5} y={top} w={10} h={bot - top} r={5} />
      <RoundedRect x={cathX - 5} y={top} width={10} height={bot - top} r={5} color={INK.cathode} style="stroke" strokeWidth={1.3} opacity={0.75} />
      <MetalPanel x={plateX - 3} y={top} w={11} h={bot - top} r={3.5} />
      <RoundedRect x={plateX - 3} y={top} width={11} height={bot - top} r={3.5} color={INK.plate} style="stroke" strokeWidth={1.3} opacity={0.8} />

      {/* Grid: faint support rod + wire dots in the control grid's blue ink. */}
      <SkLine p1={{ x: gridX, y: top + 6 }} p2={{ x: gridX, y: bot - 6 }} color="#5a5d67" strokeWidth={1} opacity={0.4} />
      <Path path={gridDots} color={INK.grid} />

      {/* The grid's negativity, visualized on the wires themselves. */}
      <Circle cx={gridX} cy={top - 8} r={4 + (1 - cond) * 3} color={INK.grid} opacity={0.3}>
        <BlurMask blur={5} style="normal" />
      </Circle>
      <Circle cx={gridX} cy={top - 8} r={4 + (1 - cond) * 3} color={INK.grid} opacity={0.25 + (1 - cond) * 0.6} />

      {/* Electrons: halo + cores. */}
      <Path path={electrons} color={ELECTRON} opacity={0.4}>
        <BlurMask blur={4.5} style="normal" />
      </Path>
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

  // The stage is a small illustrated triode, not a rounded-rect box.
  const tcx = (boxX0 + boxX1) / 2;
  const hw = Math.min(26, (boxX1 - boxX0) / 2 - 4);
  const tTop = mid - 44;
  const tBase = mid + 30;

  const tube = useMemo(() => {
    const bottle = makeBottlePath(tcx, tTop, tBase, hw, hw * 0.6);
    const streak = makeStreakPath(tcx, tTop, tBase, hw, hw * 0.6);
    const grid = Skia.Path.Make();
    for (let i = 0; i < 4; i++) grid.addCircle(tcx, mid - 18 + i * 12, 2);
    const leads = Skia.Path.Make();
    leads.moveTo(inX1, mid);
    leads.lineTo(tcx - hw, mid);
    leads.moveTo(tcx + hw, mid);
    leads.lineTo(outX0, mid);
    return { bottle, streak, grid, leads };
  }, [tcx, tTop, tBase, hw, mid, inX1, outX0]);

  // The little filament breathes.
  const filR = useDerivedValue(() => 6 + 1.5 * Math.sin(phase.value), [phase]);

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

  // Soft gradient underfill: same waves, closed back to the midline.
  const waveFill = useDerivedValue(() => {
    const ph = phase.value;
    const p = Skia.Path.Make();
    const N = 60;
    p.moveTo(inX0, mid);
    for (let i = 0; i <= N; i++) {
      const t = i / N;
      const th = t * 2 * Math.PI * 2.2 - ph;
      p.lineTo(inX0 + t * (inX1 - inX0), mid - 8 * Math.sin(th));
    }
    p.lineTo(inX1, mid);
    p.close();
    p.moveTo(outX0, mid);
    for (let i = 0; i <= N; i++) {
      const t = i / N;
      const th = t * 2 * Math.PI * 2.2 - ph;
      p.lineTo(outX0 + t * (outX1 - outX0), mid + 52 * Math.sin(th));
    }
    p.lineTo(outX1, mid);
    p.close();
    return p;
  }, [phase, mid, inX0, inX1, outX0, outX1]);

  return (
    <Canvas style={{ width: w, height: h, backgroundColor: BG }}>
      <Vignette w={w} h={h} />
      {/* The mid line is 0 amplitude → always MIDI-0 blue (owner 2026-07-31). */}
      <SkLine p1={{ x: 0, y: mid }} p2={{ x: w, y: mid }} color={MIDLINE_BLUE} strokeWidth={1} />

      {/* ── The mini triode stage ── */}
      <Path path={tube.leads} color={METAL} style="stroke" strokeWidth={2.2} />
      {/* Warm glow inside the little bottle. */}
      <Circle cx={tcx} cy={mid + 22} r={16} color={GLOW} opacity={0.3}>
        <BlurMask blur={12} style="normal" />
      </Circle>
      <Circle cx={tcx} cy={mid + 22} r={filR} color={FILAMENT_CORE} opacity={0.6}>
        <BlurMask blur={5} style="normal" />
      </Circle>
      {/* Plate bar (top) and cathode bar (bottom). */}
      <RoundedRect x={tcx - hw * 0.6} y={mid - 34} width={hw * 1.2} height={6} r={2.5}>
        <LinearGradient start={vec(tcx - hw * 0.6, mid - 34)} end={vec(tcx - hw * 0.6, mid - 28)} colors={[PLATE_LIGHT, PLATE_DARK]} />
      </RoundedRect>
      <RoundedRect x={tcx - hw * 0.45} y={mid + 24} width={hw * 0.9} height={4.5} r={2}>
        <LinearGradient start={vec(tcx - hw * 0.45, mid + 24)} end={vec(tcx - hw * 0.45, mid + 28.5)} colors={[METAL_LIGHT, METAL_DARK]} />
      </RoundedRect>
      {/* Card ink code: plate amber rim · cathode teal rim · grid blue dots. */}
      <RoundedRect x={tcx - hw * 0.6} y={mid - 34} width={hw * 1.2} height={6} r={2.5} color={INK.plate} style="stroke" strokeWidth={1.1} opacity={0.8} />
      <RoundedRect x={tcx - hw * 0.45} y={mid + 24} width={hw * 0.9} height={4.5} r={2} color={INK.cathode} style="stroke" strokeWidth={1.1} opacity={0.75} />
      <Path path={tube.grid} color={INK.grid} />
      {/* Glass over the internals. */}
      <Path path={tube.bottle}>
        <LinearGradient start={vec(tcx - hw, tTop)} end={vec(tcx + hw, tTop)} colors={['#8f97a824', '#58607012', '#47506019']} />
      </Path>
      <Path path={tube.bottle} color={GLASS_EDGE} style="stroke" strokeWidth={2} />
      <Path path={tube.streak} style="stroke" strokeWidth={3} strokeCap="round" opacity={0.75}>
        <LinearGradient start={vec(0, tTop)} end={vec(0, tBase)} colors={['#ffffff52', '#ffffff1c', '#ffffff05']} />
        <BlurMask blur={1.4} style="normal" />
      </Path>
      <RoundedRect x={tcx - hw + 4} y={tBase} width={2 * hw - 8} height={7} r={2}>
        <LinearGradient start={vec(0, tBase)} end={vec(0, tBase + 7)} colors={[BAKELITE_LIGHT, BAKELITE_DARK]} />
      </RoundedRect>

      {/* ── The waves: soft underfill + glow stroke + core stroke. Coloured by
          AMPLITUDE with the MIDI-velocity ramp (blue at the mid line → red at the
          big output peaks), keyed to the ±52 px output swing so the tiny input
          reads cool and the amplified output reads hot (owner 2026-07-31). ── */}
      <Path path={waveFill} opacity={0.28}>
        <LinearGradient start={vec(0, mid - 52)} end={vec(0, mid + 52)} colors={WAVE_LEVEL_COLORS} positions={WAVE_LEVEL_POS} />
      </Path>
      <Path path={waves} style="stroke" strokeWidth={5} opacity={0.3}>
        <LinearGradient start={vec(0, mid - 52)} end={vec(0, mid + 52)} colors={WAVE_LEVEL_COLORS} positions={WAVE_LEVEL_POS} />
        <BlurMask blur={5} style="normal" />
      </Path>
      <Path path={waves} style="stroke" strokeWidth={2.2} strokeJoin="round">
        <LinearGradient start={vec(0, mid - 52)} end={vec(0, mid + 52)} colors={WAVE_LEVEL_COLORS} positions={WAVE_LEVEL_POS} />
      </Path>
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

  const cells = highB ? 4 : 1;
  const bx = w / 2 - (cells * 14) / 2;

  // Supply wire from the battery stack to the plate.
  const wire = useMemo(() => {
    const p = Skia.Path.Make();
    p.moveTo(bx + cells * 14, h - 22);
    p.lineTo(plateX, h - 22);
    p.lineTo(plateX, bot);
    return p;
  }, [bx, cells, plateX, bot, h]);

  const electrons = useDerivedValue(() => {
    const ph = phase.value;
    const p = Skia.Path.Make();
    const n = highB ? 26 : 8;
    const speed = highB ? 1 : 0.4;
    for (let i = 0; i < n; i++) {
      const y = top + 8 + hashW(i * 19.1) * (bot - top - 16);
      const f = ((ph * speed) / (2 * Math.PI) + hashW(i * 47.7)) % 1;
      const bend = Math.sin(f * Math.PI) * 4 * (hashW(i * 2.9) - 0.5);
      p.addCircle(cathX + 8 + f * (plateX - cathX - 14), y + bend, 1.9);
    }
    return p;
  }, [phase, cathX, plateX, top, bot, highB]);

  // Attraction arrows at the plate — longer when B+ is high (same length law).
  const arrows = useMemo(() => {
    const p = Skia.Path.Make();
    const len = highB ? 18 : 7;
    for (let i = 0; i < 3; i++) {
      const y = top + 20 + ((bot - top - 40) * i) / 2;
      p.addRRect(Skia.RRectXY(Skia.XYWHRect(plateX - len - 8, y - 1, len, 2), 1, 1));
      p.moveTo(plateX - 8, y - 4);
      p.lineTo(plateX - 3.5, y);
      p.lineTo(plateX - 8, y + 4);
      p.close();
    }
    return p;
  }, [plateX, top, bot, highB]);

  return (
    <Canvas style={{ width: w, height: h, backgroundColor: BG }}>
      <Vignette w={w} h={h} />
      {/* Cathode (teal ink) and plate (amber ink) — real metal structures. */}
      <CathodeSleeve x={cathX - 5} y={top} w={10} h={bot - top} r={5} />
      <RoundedRect x={cathX - 5} y={top} width={10} height={bot - top} r={5} color={INK.cathode} style="stroke" strokeWidth={1.3} opacity={0.75} />
      <MetalPanel x={plateX - 3} y={top} w={11} h={bot - top} r={3.5} />
      <RoundedRect x={plateX - 3} y={top} width={11} height={bot - top} r={3.5} color={INK.plate} style="stroke" strokeWidth={1.3} opacity={0.8} />
      {/* When B+ is high the plate visibly "pulls" — a charged amber sheen. */}
      {highB ? (
        <RoundedRect x={plateX - 3} y={top} width={11} height={bot - top} r={3.5} color={INK.plate} opacity={0.25}>
          <BlurMask blur={7} style="normal" />
        </RoundedRect>
      ) : null}

      {/* The supply: a real battery cell stack (one cell vs four in series). */}
      <RoundedRect x={bx - 6} y={h - 12.5} width={cells * 14 + 12} height={3} r={1.5} color="#1b1c21" />
      {Array.from({ length: cells }, (_, i) => (
        <BatteryCell key={i} x={bx + i * 14 - 5 + 7} y={h - 30} w={10} h={16} />
      ))}
      <Path path={wire} color={METAL_DARK} style="stroke" strokeWidth={3.4} strokeJoin="round" />
      <Path path={wire} color={METAL_LIGHT} style="stroke" strokeWidth={1.2} strokeJoin="round" opacity={0.5} />

      {/* Attraction arrows with a soft glow. */}
      <Path path={arrows} color={ELECTRON} opacity={0.35}>
        <BlurMask blur={3.5} style="normal" />
      </Path>
      <Path path={arrows} color={ELECTRON} opacity={0.85} />

      {/* Electrons: halo + cores. */}
      <Path path={electrons} color={ELECTRON} opacity={0.4}>
        <BlurMask blur={4.5} style="normal" />
      </Path>
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

  const curves = useMemo(() => {
    const stroke = Skia.Path.Make();
    for (let i = 0; i <= 80; i++) {
      const v = i / 80;
      const y = yOfI(plateCurrent01(v));
      if (i === 0) stroke.moveTo(xOfV(v), y);
      else stroke.lineTo(xOfV(v), y);
    }
    // Gradient underfill: same curve closed down to the bottom axis.
    const fill = stroke.copy();
    fill.lineTo(xOfV(1), cy0 + chh);
    fill.lineTo(xOfV(0), cy0 + chh);
    fill.close();
    // Axis ticks along the bottom (grid drive) and left (plate current).
    const ticks = Skia.Path.Make();
    for (let i = 0; i <= 4; i++) {
      const x = cx0 + ((cw - 20) * i) / 4;
      ticks.moveTo(x, cy0 + chh);
      ticks.lineTo(x, cy0 + chh - 5);
      const y = cy0 + (chh * i) / 4;
      ticks.moveTo(cx0, y);
      ticks.lineTo(cx0 + 5, y);
    }
    return { stroke, fill, ticks };
  }, [w, h]);

  // Operating point + drive extremes (plain JS — captured by the worklet).
  const DRIVE = 0.15;
  const opX = xOfV(bias01);
  const opY = yOfI(plateCurrent01(bias01));
  const opBad = bias01 < 0.22 || bias01 > 0.8;
  const opColor = opBad ? ACCENT_RED : ACCENT_GREEN;

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
      <Vignette w={w} h={h} />
      {/* Soft zone shading: cutoff (left) and saturation (right) regions. */}
      <RoundedRect x={cx0} y={cy0} width={xOfV(0.25) - cx0} height={chh} r={0}>
        <LinearGradient start={vec(cx0, cy0)} end={vec(xOfV(0.25), cy0)} colors={['#ff6b5e17', '#ff6b5e00']} />
      </RoundedRect>
      <RoundedRect x={xOfV(0.8)} y={cy0} width={xOfV(1) - xOfV(0.8)} height={chh} r={0}>
        <LinearGradient start={vec(xOfV(0.8), cy0)} end={vec(xOfV(1), cy0)} colors={['#ff6b5e00', '#ff6b5e17']} />
      </RoundedRect>
      {/* Region hints: cutoff floor and saturation ceiling. */}
      <SkLine p1={{ x: cx0, y: yOfI(0.02) }} p2={{ x: cx0 + cw - 20, y: yOfI(0.02) }} color={GHOST} strokeWidth={1.4} />
      <SkLine p1={{ x: cx0, y: yOfI(0.98) }} p2={{ x: cx0 + cw - 20, y: yOfI(0.98) }} color={GHOST} strokeWidth={1.4} />
      <SkLine p1={{ x: ox0 - 8, y: cy0 }} p2={{ x: ox0 - 8, y: cy0 + chh }} color={GHOST} strokeWidth={1.4} />
      <Path path={curves.ticks} color="#3a3a42" style="stroke" strokeWidth={1.2} />
      {/* Transfer curve: gradient underfill + glow stroke + core stroke. */}
      <Path path={curves.fill}>
        <LinearGradient start={vec(0, cy0)} end={vec(0, cy0 + chh)} colors={['#ffc64d26', '#ffc64d05']} />
      </Path>
      <Path path={curves.stroke} color={WAVE} style="stroke" strokeWidth={5} opacity={0.18}>
        <BlurMask blur={5} style="normal" />
      </Path>
      <Path path={curves.stroke} color="#a8adb8" style="stroke" strokeWidth={2.2} strokeJoin="round" />
      {/* The operating point: glowing halo + ring. */}
      <Circle cx={opX} cy={opY} r={12} color={opColor} opacity={0.35}>
        <BlurMask blur={7} style="normal" />
      </Circle>
      <Circle cx={opX} cy={opY} r={7} color={opColor} style="stroke" strokeWidth={2.2} />
      {/* The moving swing dot + resulting output wave. */}
      <Path path={dyn} color={WAVE} style="stroke" strokeWidth={5} opacity={0.28}>
        <BlurMask blur={5} style="normal" />
      </Path>
      <Path path={dyn} color={WAVE} style="stroke" strokeWidth={2.2} strokeJoin="round" />
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

  const curves = useMemo(() => {
    const stroke = Skia.Path.Make();
    const K = Math.tanh(2.6);
    for (let i = 0; i <= 70; i++) {
      const x = -1 + (2 * i) / 70;
      const y = Math.tanh(2.6 * x) / K;
      const px = cx0 + ((x + 1) / 2) * cs;
      const py = cy0 + (1 - (y + 1) / 2) * cs;
      if (i === 0) stroke.moveTo(px, py);
      else stroke.lineTo(px, py);
    }
    // Gradient underfill below the transfer curve.
    const fill = stroke.copy();
    fill.lineTo(cx0 + cs, cy0 + cs);
    fill.lineTo(cx0, cy0 + cs);
    fill.close();
    // Unity reference (the straight line it USED to be) — dashed & faint.
    const unity = Skia.Path.Make();
    unity.moveTo(cx0, cy0 + cs);
    unity.lineTo(cx0 + cs, cy0);
    return { stroke, fill, unity };
  }, [cx0, cy0, cs]);

  // Full-scale amplitude of each wave (drawn); used to key the velocity ramp so
  // both waves colour blue at their mid line → red at their peaks.
  const ampMax = cs * 0.2;
  const waveIn = useDerivedValue(() => {
    const ph = phase.value;
    const p = Skia.Path.Make();
    const N = 70;
    for (let i = 0; i <= N; i++) {
      const t = i / N;
      const s = drive * Math.sin(t * 2 * Math.PI * 2.2 - ph);
      const x = wx0 + t * ww;
      const yi = midIn - s * ampMax;
      if (i === 0) p.moveTo(x, yi);
      else p.lineTo(x, yi);
    }
    return p;
  }, [phase, wx0, ww, midIn, ampMax, drive]);
  const waveOut = useDerivedValue(() => {
    const ph = phase.value;
    const p = Skia.Path.Make();
    const K = Math.tanh(2.6);
    const N = 70;
    for (let i = 0; i <= N; i++) {
      const t = i / N;
      const s = drive * Math.sin(t * 2 * Math.PI * 2.2 - ph);
      const out = Math.tanh(2.6 * s) / K;
      const x = wx0 + t * ww;
      const yo = midOut - out * ampMax;
      if (i === 0) p.moveTo(x, yo);
      else p.lineTo(x, yo);
    }
    return p;
  }, [phase, wx0, ww, midOut, ampMax, drive]);

  return (
    <Canvas style={{ width: w, height: h, backgroundColor: BG }}>
      <Vignette w={w} h={h} />
      {/* Soft zone shading where the curve flattens (top & bottom). */}
      <RoundedRect x={cx0} y={cy0} width={cs} height={cs * 0.14} r={0}>
        <LinearGradient start={vec(0, cy0)} end={vec(0, cy0 + cs * 0.14)} colors={['#ff6b5e14', '#ff6b5e00']} />
      </RoundedRect>
      <RoundedRect x={cx0} y={cy0 + cs * 0.86} width={cs} height={cs * 0.14} r={0}>
        <LinearGradient start={vec(0, cy0 + cs * 0.86)} end={vec(0, cy0 + cs)} colors={['#ff6b5e00', '#ff6b5e14']} />
      </RoundedRect>
      {/* Amplitude mid lines → always MIDI-0 blue (owner 2026-07-31). */}
      <SkLine p1={{ x: wx0, y: midIn }} p2={{ x: w - 8, y: midIn }} color={MIDLINE_BLUE} strokeWidth={1} />
      <SkLine p1={{ x: wx0, y: midOut }} p2={{ x: w - 8, y: midOut }} color={MIDLINE_BLUE} strokeWidth={1} />
      {/* Unity reference — dashed ghost of the straight line. */}
      <Path path={curves.unity} color="#4a4a54" style="stroke" strokeWidth={1.4} opacity={0.7}>
        <DashPathEffect intervals={[6, 5]} />
      </Path>
      {/* Transfer curve: underfill + glow + core. */}
      <Path path={curves.fill}>
        <LinearGradient start={vec(0, cy0)} end={vec(0, cy0 + cs)} colors={['#ffc64d22', '#ffc64d04']} />
      </Path>
      <Path path={curves.stroke} color={WAVE} style="stroke" strokeWidth={4.5} opacity={0.18}>
        <BlurMask blur={4.5} style="normal" />
      </Path>
      <Path path={curves.stroke} color="#a8adb8" style="stroke" strokeWidth={2} strokeJoin="round" />
      {/* Waves: glow + core, each coloured by AMPLITUDE with the MIDI-velocity
          ramp (blue at its mid line → red at its peaks). Input and output ride
          separate mid lines, so each gets its own gradient axis. */}
      <Path path={waveIn} style="stroke" strokeWidth={5} opacity={0.25}>
        <LinearGradient start={vec(0, midIn - ampMax)} end={vec(0, midIn + ampMax)} colors={WAVE_LEVEL_COLORS} positions={WAVE_LEVEL_POS} />
        <BlurMask blur={5} style="normal" />
      </Path>
      <Path path={waveIn} style="stroke" strokeWidth={2.2} strokeJoin="round">
        <LinearGradient start={vec(0, midIn - ampMax)} end={vec(0, midIn + ampMax)} colors={WAVE_LEVEL_COLORS} positions={WAVE_LEVEL_POS} />
      </Path>
      <Path path={waveOut} style="stroke" strokeWidth={5} opacity={0.25}>
        <LinearGradient start={vec(0, midOut - ampMax)} end={vec(0, midOut + ampMax)} colors={WAVE_LEVEL_COLORS} positions={WAVE_LEVEL_POS} />
        <BlurMask blur={5} style="normal" />
      </Path>
      <Path path={waveOut} style="stroke" strokeWidth={2.2} strokeJoin="round">
        <LinearGradient start={vec(0, midOut - ampMax)} end={vec(0, midOut + ampMax)} colors={WAVE_LEVEL_COLORS} positions={WAVE_LEVEL_POS} />
      </Path>
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
  const tcx = half * 0.5;
  const rx = half + half * 0.5;
  const midY = (top + bot) / 2;

  // LEFT interior stack (a MINI version of the Inside cutaway — same mental
  // model, owner 2026-08-10: plate BOX around a central cathode, flow OUTWARD).
  const stackT = top + 16;
  const stackB = bot - 22;
  const heaterCy = (stackT + stackB) / 2;

  // RIGHT conduction conduit (owner 2026-08-10): carriers move ONLY through the
  // defined path — emitter leg → emitter region → across the thin base →
  // collector region → collector leg. Never free-floating like vacuum
  // electrons; the confinement IS the lesson.
  const condPts = useMemo(() => {
    const pts = [
      [rx - 16, bot],
      [rx - 16, midY + 12],
      [rx, midY + 8],
      [rx, midY - 14],
      [rx + 16, midY - 10],
      [rx + 16, bot],
    ];
    const cum = [0];
    for (let i = 1; i < pts.length; i++) {
      cum.push(cum[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
    }
    return { xs: pts.map((p) => p[0]), ys: pts.map((p) => p[1]), cum, total: cum[cum.length - 1] };
  }, [rx, bot, midY]);

  const art = useMemo(() => {
    // LEFT — a real mini bottle.
    const bottle = makeBottlePath(tcx, top, bot - 4, 34, 22);
    const streak = makeStreakPath(tcx, top, bot - 4, 34, 22);
    // Blue control-grid rungs between cathode and plate (cutaway style).
    const grid = Skia.Path.Make();
    for (const sgn of [-1, 1]) {
      for (let y = stackT + 6; y <= stackB - 6; y += 8) {
        grid.moveTo(tcx + sgn * 14 - 3.5, y);
        grid.lineTo(tcx + sgn * 14 + 3.5, y);
      }
    }
    // Tiny orange heater zigzag inside the cathode.
    const heater = Skia.Path.Make();
    for (let i = 0; i <= 5; i++) {
      const y = stackT + 8 + ((stackB - stackT - 16) * i) / 5;
      const x = tcx + (i % 2 === 0 ? -2 : 2);
      if (i === 0) heater.moveTo(x, y);
      else heater.lineTo(x, y);
    }

    // RIGHT — a TO-92 transistor package: D-shaped body, flat face, 3 legs.
    const body = Skia.Path.Make();
    const bw2 = 32;
    const bTop = top + 6;
    const bBot = bot - 26;
    body.moveTo(rx - bw2, bBot);
    body.lineTo(rx - bw2, bTop + 20);
    body.cubicTo(rx - bw2, bTop + 4, rx - bw2 * 0.55, bTop, rx, bTop);
    body.cubicTo(rx + bw2 * 0.55, bTop, rx + bw2, bTop + 4, rx + bw2, bTop + 20);
    body.lineTo(rx + bw2, bBot);
    body.close();

    // Emitter + collector legs (outer two); the BASE leg is drawn separately in
    // blue — the control electrode, same ink as the tube's grid.
    const legs = Skia.Path.Make();
    for (const dx of [-16, 16]) {
      legs.moveTo(rx + dx, bBot);
      legs.lineTo(rx + dx, bot);
    }
    const baseLeg = Skia.Path.Make();
    baseLeg.moveTo(rx, bot);
    baseLeg.lineTo(rx, bBot);

    // The conduit guide the carriers ride (drawn faintly, so the CONFINED path
    // is visible — the whole point of the comparison).
    const conduit = Skia.Path.Make();
    conduit.moveTo(rx - 16, bot);
    conduit.lineTo(rx - 16, midY + 12);
    conduit.lineTo(rx, midY + 8);
    conduit.lineTo(rx, midY - 14);
    conduit.lineTo(rx + 16, midY - 10);
    conduit.lineTo(rx + 16, bot);

    return { bottle, streak, grid, heater, body, legs, baseLeg, conduit, bTop, bBot, bw2 };
  }, [tcx, rx, top, bot, stackT, stackB, midY]);

  // The mini tube's heater glow breathes at the cathode centre.
  const filR = useDerivedValue(() => 8 + 1.8 * Math.sin(phase.value), [phase]);
  // The base "gate" pulses — a small control signal admitting a large flow.
  const baseR = useDerivedValue(() => 3 + 1.4 * (0.5 + 0.5 * Math.sin(phase.value * 2)), [phase]);

  const condXs = condPts.xs;
  const condYs = condPts.ys;
  const condCum = condPts.cum;
  const condTotal = condPts.total;
  const carriers = useDerivedValue(() => {
    const ph = phase.value;
    const p = Skia.Path.Make();
    // TUBE: electrons fly OUTWARD from the central cathode across open vacuum
    // to the plate walls — the same picture the cutaway teaches.
    for (let i = 0; i < 12; i++) {
      const sgn = i % 2 === 0 ? 1 : -1;
      const y = stackT + 7 + hashW(i * 23.1) * (stackB - stackT - 14);
      const f = (ph / (2 * Math.PI) + hashW(i * 31.7)) % 1;
      p.addCircle(tcx + sgn * (8 + f * 15), y + 1.5 * Math.sin(ph * 2 + i), 1.8);
    }
    // A little space-charge cloud hugging the cathode.
    for (let i = 0; i < 5; i++) {
      const y = stackT + 8 + hashW(i * 5.7) * (stackB - stackT - 16);
      p.addCircle(tcx + (hashW(i * 9.1) - 0.5) * 7, y, 1.4);
    }
    // TRANSISTOR: carriers in single file ALONG the conduit — evenly spaced
    // beads walking the path, never leaving it.
    for (let i = 0; i < 10; i++) {
      const f = ((ph / (2 * Math.PI)) * 0.5 + i / 10) % 1;
      const s = f * condTotal;
      for (let k = 1; k < 6; k++) {
        if (s <= condCum[k]) {
          const t = (s - condCum[k - 1]) / Math.max(1e-6, condCum[k] - condCum[k - 1]);
          p.addCircle(
            condXs[k - 1] + (condXs[k] - condXs[k - 1]) * t,
            condYs[k - 1] + (condYs[k] - condYs[k - 1]) * t,
            1.8,
          );
          break;
        }
      }
    }
    return p;
  }, [phase, tcx, stackT, stackB, condXs, condYs, condCum, condTotal]);

  const faceX = rx - art.bw2 + 6;
  const faceY = art.bTop + 8;
  const faceW = art.bw2 * 2 - 12;
  const faceH = art.bBot - art.bTop - 14;
  return (
    <Canvas style={{ width: w, height: h, backgroundColor: BG }}>
      <Vignette w={w} h={h} />
      {/* Divider. */}
      <SkLine p1={{ x: half, y: 8 }} p2={{ x: half, y: h - 8 }} color={GHOST} strokeWidth={1.4} />

      {/* ── LEFT: mini cutaway tube — plate box · blue grid · teal cathode ── */}
      {/* Card-style plate box around the works (amber ink). */}
      <RoundedRect x={tcx - 26} y={stackT} width={52} height={stackB - stackT} r={4} color="#0e0e12" opacity={0.8} />
      <RoundedRect x={tcx - 26} y={stackT} width={52} height={stackB - stackT} r={4} color={INK.plate} style="stroke" strokeWidth={1.8} opacity={0.9} />
      {/* Control grid rungs (blue ink). */}
      <Path path={art.grid} color={INK.grid} style="stroke" strokeWidth={1.4} />
      {/* Heater glow + solid teal cathode at the centre. */}
      <Circle cx={tcx} cy={heaterCy} r={filR} color={GLOW} opacity={0.4}>
        <BlurMask blur={8} style="normal" />
      </Circle>
      <RoundedRect x={tcx - 5} y={stackT + 3} width={10} height={stackB - stackT - 6} r={4}>
        <LinearGradient start={vec(tcx - 5, stackT)} end={vec(tcx + 5, stackT)} colors={['#63e2d4', '#2fae9f', '#1d7f73']} />
      </RoundedRect>
      <Path path={art.heater} color={INK.heater} style="stroke" strokeWidth={1.4} />
      {/* Glass over the internals. */}
      <Path path={art.bottle}>
        <LinearGradient start={vec(tcx - 34, top)} end={vec(tcx + 34, top)} colors={['#8f97a822', '#58607012', '#47506018']} />
      </Path>
      <Path path={art.bottle} color={GLASS_EDGE} style="stroke" strokeWidth={2} />
      <Path path={art.streak} style="stroke" strokeWidth={3.4} strokeCap="round" opacity={0.75}>
        <LinearGradient start={vec(0, top)} end={vec(0, bot)} colors={['#ffffff4d', '#ffffff1a', '#ffffff05']} />
        <BlurMask blur={1.5} style="normal" />
      </Path>

      {/* ── RIGHT: TO-92 — carriers CONFINED to the conduction path ── */}
      <Path path={art.legs} color={METAL_DARK} style="stroke" strokeWidth={3.4} />
      <Path path={art.legs} color={METAL_LIGHT} style="stroke" strokeWidth={1.2} opacity={0.55} />
      {/* Base leg in the CONTROL ink (blue — the transistor's "grid"). */}
      <Path path={art.baseLeg} color={INK.grid} style="stroke" strokeWidth={3.2} opacity={0.85} />
      <Path path={art.body}>
        <LinearGradient start={vec(rx - art.bw2, art.bTop)} end={vec(rx + art.bw2, art.bBot)} colors={['#33333c', '#232329', '#17171c']} />
      </Path>
      <Path path={art.body} color="#4a4c58" style="stroke" strokeWidth={1.6} />
      {/* Flat face — slightly lighter, catching the upper-left light. */}
      <RoundedRect x={faceX} y={faceY} width={faceW} height={faceH} r={5}>
        <LinearGradient start={vec(faceX, faceY)} end={vec(faceX + faceW, faceY + faceH)} colors={['#3b3d47', '#26262d']} />
      </RoundedRect>
      {/* Junction stack: collector / thin BASE (control blue) / emitter. */}
      <RoundedRect x={faceX + 5} y={midY - 22} width={faceW - 10} height={16} r={2}>
        <LinearGradient start={vec(0, midY - 22)} end={vec(0, midY - 6)} colors={['#54627a', '#3c4658']} />
      </RoundedRect>
      <RoundedRect x={faceX + 5} y={midY - 5} width={faceW - 10} height={5} r={1.5} color={INK.grid} opacity={0.85} />
      <RoundedRect x={faceX + 5} y={midY + 1} width={faceW - 10} height={16} r={2}>
        <LinearGradient start={vec(0, midY + 1)} end={vec(0, midY + 17)} colors={['#4a5568', '#333c4b']} />
      </RoundedRect>
      {/* The conduction conduit — visible, so "confined" is unmistakable. */}
      <Path path={art.conduit} color={ELECTRON} style="stroke" strokeWidth={4.5} opacity={0.14} strokeJoin="round" />
      <Path path={art.conduit} color={ELECTRON} style="stroke" strokeWidth={1.2} opacity={0.4} strokeJoin="round" />
      {/* The base gate pulsing where the path crosses the thin blue layer. */}
      <Circle cx={rx} cy={midY - 2.5} r={baseR} color={INK.grid} opacity={0.8}>
        <BlurMask blur={4} style="normal" />
      </Circle>

      {/* Carriers: halo + cores. */}
      <Path path={carriers} color={ELECTRON} opacity={0.4}>
        <BlurMask blur={4} style="normal" />
      </Path>
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
  const bw = kind === 'power' ? 34 : 20; // bottle half-width
  const topY = kind === 'power' ? 8 : 16;
  const baseY = h - 18;

  const art = useMemo(() => {
    const domeH = kind === 'power' ? 18 : 15;
    const bottle = makeBottlePath(cx, topY, baseY, bw, domeH);
    const streak = makeStreakPath(cx, topY, baseY, bw, domeH);
    const grid = Skia.Path.Make();
    for (let i = 0; i < 3; i++) grid.addCircle(cx, topY + 30 + i * 12, 1.6);
    return { bottle, streak, grid };
  }, [cx, topY, baseY, bw, kind]);

  const plateX = cx - bw * 0.5;
  const plateY = topY + 20;
  const plateW = bw;
  const plateH = baseY - topY - 30;
  const edge = kind === 'power' ? METAL : GLASS;

  return (
    <Canvas style={{ width: w, height: h, backgroundColor: BG }}>
      {/* Warm filament glint deep in the bottle. */}
      <Circle cx={cx} cy={baseY - 14} r={kind === 'power' ? 11 : 8} color={GLOW} opacity={0.4}>
        <BlurMask blur={9} style="normal" />
      </Circle>
      <Circle cx={cx} cy={baseY - 14} r={2.4} color={FILAMENT_CORE} opacity={0.85}>
        <BlurMask blur={2} style="normal" />
      </Circle>
      {/* Internal plate silhouette. */}
      <RoundedRect x={plateX} y={plateY} width={plateW} height={plateH} r={3} opacity={0.9}>
        <LinearGradient start={vec(plateX, plateY)} end={vec(plateX + plateW, plateY)} colors={['#565a64', '#3a3d45', '#2b2d34']} />
      </RoundedRect>
      <Path path={art.grid} color={METAL} />
      {/* Glass: gradient body + edge + specular streak. */}
      <Path path={art.bottle}>
        <LinearGradient start={vec(cx - bw, topY)} end={vec(cx + bw, topY)} colors={['#8f97a826', '#58607014', '#4750601c']} />
      </Path>
      <Path path={art.bottle} color={edge} style="stroke" strokeWidth={2.2} />
      <Path path={art.streak} style="stroke" strokeWidth={kind === 'power' ? 3.4 : 2.6} strokeCap="round" opacity={0.8}>
        <LinearGradient start={vec(0, topY)} end={vec(0, baseY)} colors={['#ffffff54', '#ffffff1e', '#ffffff06']} />
        <BlurMask blur={1.4} style="normal" />
      </Path>
      {/* Evacuation nub. */}
      <Circle cx={cx} cy={topY - 1.5} r={2.2}>
        <LinearGradient start={vec(cx - 2.2, topY - 3.7)} end={vec(cx + 2.2, topY)} colors={['#9aa2b2', '#565d6b']} />
      </Circle>
      {/* Bakelite base + pin stubs. */}
      <BakeliteBase x={cx - bw + 4} y={baseY} w={2 * bw - 8} h={8} r={2} />
      {[-1.5, -0.5, 0.5, 1.5].map((i) => (
        <RoundedRect key={i} x={cx + i * (bw * 0.42) - 1.2} y={baseY + 8} width={2.4} height={5} r={1.2}>
          <LinearGradient start={vec(cx + i * (bw * 0.42) - 1.2, baseY + 8)} end={vec(cx + i * (bw * 0.42) + 1.2, baseY + 8)} colors={['#c9ccd4', '#5b5e66']} />
        </RoundedRect>
      ))}
    </Canvas>
  );
}
