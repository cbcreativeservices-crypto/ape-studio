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
const GHOST = '#232329';
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
  const heaterCy = (stackTop + stackBot) / 2;

  const hasScreen = kind !== 'triode';
  const hasSuppressor = kind === 'pentode';

  const colorFor = (part: TubePart, base: string) => (highlight === part ? WAVE : base);

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

    const heater = Skia.Path.Make();
    // Zigzag filament inside the cathode sleeve.
    const zn = 8;
    for (let i = 0; i <= zn; i++) {
      const y = stackTop + 8 + ((stackBot - stackTop - 16) * i) / zn;
      const x = cx + (i % 2 === 0 ? -3 : 3);
      if (i === 0) heater.moveTo(x, y);
      else heater.lineTo(x, y);
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

    // Slim support rods behind each grid-wire column.
    const rods = Skia.Path.Make();
    const rodXs = [19, ...(hasScreen ? [31] : []), ...(hasSuppressor ? [43] : [])];
    for (const dx of rodXs) {
      for (const sgn of [-1, 1]) {
        rods.moveTo(cx + sgn * dx, stackTop + 4);
        rods.lineTo(cx + sgn * dx, stackBot - 4);
      }
    }

    // Plate outline (open box brackets — kept for the amber highlight layer).
    const plateOutline = Skia.Path.Make();
    for (const sgn of [-1, 1]) {
      plateOutline.moveTo(cx + sgn * 53, stackTop);
      plateOutline.lineTo(cx + sgn * 53, stackBot);
      plateOutline.lineTo(cx + sgn * 40, stackBot);
      plateOutline.moveTo(cx + sgn * 53, stackTop);
      plateOutline.lineTo(cx + sgn * 40, stackTop);
    }

    const vacuum = Skia.Path.Make();
    vacuum.addRRect(Skia.RRectXY(Skia.XYWHRect(cx - 56, topY + 6, 112, baseY - topY - 10), 26, 26));
    return { bottle, streak, innerRefl, nub, heater, gridP, screenP, suppP, rods, plateOutline, vacuum };
  }, [cx, topY, baseY, stackTop, stackBot, hasScreen, hasSuppressor]);

  // Physical view: the filament glow breathes (same radius law as ever).
  const glowR = useDerivedValue(() => {
    const ph = phase.value;
    return electronView ? 0 : 13 + 2.5 * Math.sin(ph);
  }, [phase, electronView]);
  const glowROuter = useDerivedValue(() => {
    const ph = phase.value;
    return electronView ? 0 : (13 + 2.5 * Math.sin(ph)) * 2.3;
  }, [phase, electronView]);
  // The warm glass tint — the whole envelope catches the filament light.
  const ambientO = useDerivedValue(() => {
    const ph = phase.value;
    return electronView ? 0 : 0.1 + 0.035 * Math.sin(ph);
  }, [phase, electronView]);

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
    return p;
  }, [phase, cx, stackTop, stackBot, electronView]);

  const secondaries = useDerivedValue(() => {
    const ph = phase.value;
    const p = Skia.Path.Make();
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
      {highlight === 'vacuum' ? (
        <Path path={parts.vacuum} color={WAVE} style="stroke" strokeWidth={2.4} opacity={0.85}>
          <BlurMask blur={3} style="normal" />
        </Path>
      ) : null}

      {/* ── Internals (drawn first; the glass overlays them) ── */}
      {/* Plate: gray metal box — translucent front face + gradient side walls. */}
      <RoundedRect x={cx - 40} y={stackTop} width={80} height={stackH} r={4} color="#3a3d44" opacity={0.16} />
      <MetalPanel x={cx - 53} y={stackTop} w={13} h={stackH} />
      <MetalPanel x={cx + 40} y={stackTop} w={13} h={stackH} />
      <RoundedRect x={cx - 53} y={stackTop - 3.5} width={106} height={4} r={2}>
        <LinearGradient start={vec(cx - 53, stackTop - 3.5)} end={vec(cx - 53, stackTop + 0.5)} colors={[PLATE_LIGHT, PLATE_DARK]} />
      </RoundedRect>
      <Path path={parts.plateOutline} color={colorFor('plate', '#767a84')} style="stroke" strokeWidth={1.6} opacity={highlight === 'plate' ? 1 : 0.65} />
      {highlight === 'plate' ? (
        <Path path={parts.plateOutline} color={WAVE} style="stroke" strokeWidth={3}>
          <BlurMask blur={4} style="normal" />
        </Path>
      ) : null}

      {/* Grid helices: faint support rods + neat wire dots. */}
      <Path path={parts.rods} color="#5a5d67" style="stroke" strokeWidth={1} opacity={0.4} />
      {hasSuppressor ? <Path path={parts.suppP} color={colorFor('suppressor', METAL)} /> : null}
      {hasSuppressor && highlight === 'suppressor' ? (
        <Path path={parts.suppP} color={WAVE}>
          <BlurMask blur={4} style="normal" />
        </Path>
      ) : null}
      {hasScreen ? <Path path={parts.screenP} color={colorFor('screen', METAL)} /> : null}
      {hasScreen && highlight === 'screen' ? (
        <Path path={parts.screenP} color={WAVE}>
          <BlurMask blur={4} style="normal" />
        </Path>
      ) : null}
      <Path path={parts.gridP} color={colorFor('grid', electronView ? ELECTRON : METAL)} />
      {highlight === 'grid' ? (
        <Path path={parts.gridP} color={WAVE}>
          <BlurMask blur={4} style="normal" />
        </Path>
      ) : null}

      {/* Cathode sleeve: bright metal cylinder around the heater. */}
      <CathodeSleeve x={cx - 8} y={stackTop + 4} w={16} h={stackH - 8} />
      {highlight === 'cathode' ? (
        <RoundedRect x={cx - 8} y={stackTop + 4} width={16} height={stackH - 8} r={6} color={WAVE} style="stroke" strokeWidth={2.6}>
          <BlurMask blur={3} style="normal" />
        </RoundedRect>
      ) : null}

      {/* Heater: layered warm radial glow (breathing) + the zigzag filament. */}
      <Circle cx={cx} cy={heaterCy} r={glowROuter} color={GLOW} opacity={0.3}>
        <BlurMask blur={16} style="normal" />
      </Circle>
      <Circle cx={cx} cy={heaterCy} r={glowR} color={FILAMENT_CORE} opacity={0.5}>
        <BlurMask blur={7} style="normal" />
      </Circle>
      {!electronView ? <Path path={parts.heater} color={GLOW} style="stroke" strokeWidth={3.4} opacity={0.5}><BlurMask blur={3} style="normal" /></Path> : null}
      <Path path={parts.heater} color={colorFor('heater', electronView ? METAL : FILAMENT_CORE)} style="stroke" strokeWidth={1.8} />

      {/* Electrons: soft halo layer + bright cores. */}
      <Path path={electrons} color={ELECTRON} opacity={0.4}>
        <BlurMask blur={4.5} style="normal" />
      </Path>
      <Path path={electrons} color={ELECTRON} opacity={0.9} />
      <Path path={secondaries} color={ACCENT_RED} opacity={0.5}>
        <BlurMask blur={4} style="normal" />
      </Path>
      <Path path={secondaries} color={ACCENT_RED} opacity={0.9} />

      {/* ── The glass, overlaying the internals ── */}
      <Path path={parts.bottle}>
        <LinearGradient
          start={vec(cx - 58, topY)}
          end={vec(cx + 58, topY)}
          colors={['#8f97a824', '#58607014', '#2e313b0e', '#47506019']}
        />
      </Path>
      <Path path={parts.bottle} color={colorFor('envelope', GLASS_EDGE)} style="stroke" strokeWidth={2.4} />
      {highlight === 'envelope' ? (
        <Path path={parts.bottle} color={WAVE} style="stroke" strokeWidth={3.5} opacity={0.9}>
          <BlurMask blur={4} style="normal" />
        </Path>
      ) : null}
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
      <Path path={heaterZig} color={heaterO > 0.15 ? FILAMENT_CORE : METAL} style="stroke" strokeWidth={1.8} />

      {/* Cathode sleeve — the electron source. */}
      <CathodeSleeve x={cathX - 5} y={top} w={10} h={bot - top} r={5} />

      {/* Plate — gradient metal panel with a brass + terminal. */}
      <MetalPanel x={plateX - 3} y={top} w={11} h={bot - top} r={3.5} />
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
      {/* The grid's repelling field (electron view). */}
      <Path path={field} color={ELECTRON} style="stroke" strokeWidth={2.6} opacity={0.25}>
        <BlurMask blur={3} style="normal" />
      </Path>
      <Path path={field} color={ELECTRON} style="stroke" strokeWidth={1.2} opacity={0.55} />

      {/* Cathode sleeve and plate panel — real metal, not bare lines. */}
      <CathodeSleeve x={cathX - 5} y={top} w={10} h={bot - top} r={5} />
      <MetalPanel x={plateX - 3} y={top} w={11} h={bot - top} r={3.5} />

      {/* Grid: faint support rod + wire dots. */}
      <SkLine p1={{ x: gridX, y: top + 6 }} p2={{ x: gridX, y: bot - 6 }} color="#5a5d67" strokeWidth={1} opacity={0.4} />
      <Path path={gridDots} color={electronView ? ELECTRON : METAL} />

      {/* The grid's negativity, visualized on the wires themselves. */}
      <Circle cx={gridX} cy={top - 8} r={4 + (1 - cond) * 3} color={ELECTRON} opacity={0.3}>
        <BlurMask blur={5} style="normal" />
      </Circle>
      <Circle cx={gridX} cy={top - 8} r={4 + (1 - cond) * 3} color={ELECTRON} opacity={0.25 + (1 - cond) * 0.6} />

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
      <Path path={tube.grid} color={METAL} />
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
      {/* Cathode and plate — real metal structures. */}
      <CathodeSleeve x={cathX - 5} y={top} w={10} h={bot - top} r={5} />
      <MetalPanel x={plateX - 3} y={top} w={11} h={bot - top} r={3.5} />
      {/* When B+ is high the plate visibly "pulls" — a faint charged sheen. */}
      {highB ? (
        <RoundedRect x={plateX - 3} y={top} width={11} height={bot - top} r={3.5} color={WAVE} opacity={0.2}>
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

  const art = useMemo(() => {
    // LEFT — a real mini bottle.
    const bottle = makeBottlePath(tcx, top, bot - 4, 34, 22);
    const streak = makeStreakPath(tcx, top, bot - 4, 34, 22);
    const grid = Skia.Path.Make();
    for (let i = -2; i <= 2; i++) grid.addCircle(tcx + i * 9, (top + bot) / 2, 1.8);

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

    const legs = Skia.Path.Make();
    for (const dx of [-16, 0, 16]) {
      legs.moveTo(rx + dx, bBot);
      legs.lineTo(rx + dx, bot);
    }
    return { bottle, streak, grid, body, legs, bTop, bBot, bw2 };
  }, [tcx, rx, top, bot]);

  // The mini tube's filament breathes.
  const filR = useDerivedValue(() => 9 + 2 * Math.sin(phase.value), [phase]);

  const carriers = useDerivedValue(() => {
    const ph = phase.value;
    const p = Skia.Path.Make();
    // Tube: electrons crossing open vacuum, cathode → plate (upward).
    for (let i = 0; i < 12; i++) {
      const f = (ph / (2 * Math.PI) + hashW(i * 31.7)) % 1;
      const x = tcx - 16 + hashW(i * 7.3) * 32;
      p.addCircle(x, bot - 18 - f * (bot - top - 34), 1.8);
    }
    // Transistor: carriers crossing the junctions, emitter → collector.
    for (let i = 0; i < 12; i++) {
      const f = (ph / (2 * Math.PI) + hashW(i * 13.9)) % 1;
      const x = rx - 24 + hashW(i * 5.9) * 48;
      p.addCircle(x, bot - 12 - f * (bot - top - 24), 1.8);
    }
    return p;
  }, [phase, tcx, rx, half, top, bot]);

  const midY = (top + bot) / 2;
  const faceX = rx - art.bw2 + 6;
  const faceY = art.bTop + 8;
  const faceW = art.bw2 * 2 - 12;
  const faceH = art.bBot - art.bTop - 14;
  return (
    <Canvas style={{ width: w, height: h, backgroundColor: BG }}>
      <Vignette w={w} h={h} />
      {/* Divider. */}
      <SkLine p1={{ x: half, y: 8 }} p2={{ x: half, y: h - 8 }} color={GHOST} strokeWidth={1.4} />

      {/* ── LEFT: mini glowing tube ── */}
      <Circle cx={tcx} cy={bot - 16} r={20} color={GLOW} opacity={0.28}>
        <BlurMask blur={14} style="normal" />
      </Circle>
      <Circle cx={tcx} cy={bot - 16} r={filR} color={FILAMENT_CORE} opacity={0.55}>
        <BlurMask blur={6} style="normal" />
      </Circle>
      {/* Cathode bar (bottom) and plate bar (top). */}
      <RoundedRect x={tcx - 20} y={bot - 16.5} width={40} height={5} r={2.2}>
        <LinearGradient start={vec(tcx - 20, bot - 16.5)} end={vec(tcx - 20, bot - 11.5)} colors={[METAL_LIGHT, METAL_DARK]} />
      </RoundedRect>
      <RoundedRect x={tcx - 20} y={top + 11} width={40} height={6} r={2.5}>
        <LinearGradient start={vec(tcx - 20, top + 11)} end={vec(tcx - 20, top + 17)} colors={[PLATE_LIGHT, PLATE_DARK]} />
      </RoundedRect>
      <Path path={art.grid} color={METAL} />
      {/* Glass over the internals. */}
      <Path path={art.bottle}>
        <LinearGradient start={vec(tcx - 34, top)} end={vec(tcx + 34, top)} colors={['#8f97a822', '#58607012', '#47506018']} />
      </Path>
      <Path path={art.bottle} color={GLASS_EDGE} style="stroke" strokeWidth={2} />
      <Path path={art.streak} style="stroke" strokeWidth={3.4} strokeCap="round" opacity={0.75}>
        <LinearGradient start={vec(0, top)} end={vec(0, bot)} colors={['#ffffff4d', '#ffffff1a', '#ffffff05']} />
        <BlurMask blur={1.5} style="normal" />
      </Path>

      {/* ── RIGHT: TO-92 transistor package ── */}
      <Path path={art.legs} color={METAL_DARK} style="stroke" strokeWidth={3.4} />
      <Path path={art.legs} color={METAL_LIGHT} style="stroke" strokeWidth={1.2} opacity={0.55} />
      <Path path={art.body}>
        <LinearGradient start={vec(rx - art.bw2, art.bTop)} end={vec(rx + art.bw2, art.bBot)} colors={['#33333c', '#232329', '#17171c']} />
      </Path>
      <Path path={art.body} color="#4a4c58" style="stroke" strokeWidth={1.6} />
      {/* Flat face — slightly lighter, catching the upper-left light. */}
      <RoundedRect x={faceX} y={faceY} width={faceW} height={faceH} r={5}>
        <LinearGradient start={vec(faceX, faceY)} end={vec(faceX + faceW, faceY + faceH)} colors={['#3b3d47', '#26262d']} />
      </RoundedRect>
      {/* Junction-layer inset: collector / thin base / emitter. */}
      <RoundedRect x={faceX + 5} y={midY - 22} width={faceW - 10} height={16} r={2}>
        <LinearGradient start={vec(0, midY - 22)} end={vec(0, midY - 6)} colors={['#54627a', '#3c4658']} />
      </RoundedRect>
      <RoundedRect x={faceX + 5} y={midY - 5} width={faceW - 10} height={5} r={1.5} color={WAVE} opacity={0.75} />
      <RoundedRect x={faceX + 5} y={midY + 1} width={faceW - 10} height={16} r={2}>
        <LinearGradient start={vec(0, midY + 1)} end={vec(0, midY + 17)} colors={['#4a5568', '#333c4b']} />
      </RoundedRect>

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
