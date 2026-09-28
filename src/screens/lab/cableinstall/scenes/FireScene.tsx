/**
 * STAGE 11 — Penetrations, Fire & Building Spaces (spec §18).
 *
 * AWARENESS + IDENTIFICATION, not firestop design: the learner routes a cable
 * toward three building spaces on a section drawing (ceiling cavity, air-
 * handling space, riser shaft) and identifies what each space means for the
 * installation (CI_FIRE_SPACES), then walks the FIVE questions professionals
 * answer before one rated-wall penetration. Two lessons must land, each with
 * its own card (WhyScene idiom): "Firestopping is a SYSTEM, not red sealant"
 * and "Ceiling cavity ≠ automatically plenum".
 *
 * Completion: all three spaces identified + the five-question flow answered →
 * onComplete({ safety, routing }) ONCE. Replay via `completed` (pre-revealed).
 * Accessibility: every choice is a ≥44dp labeled button; verdicts announce
 * via VerdictBanner; the SVG is a described training visualization — all
 * interaction happens in the cards.
 */
import { useEffect, useState, type ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import Svg, { Circle, G, Line, Path, Rect, Text as SvgText } from 'react-native-svg';
import { colors, fonts } from '../../../../theme/tokens';
import { OptionChip, VerdictBanner } from '../../cable/lessons/bits';
import { CiSection, RuleFeedback, SpecCard, announceComplete, stableShuffle } from '../bits';
import { ExpandableFigure } from '../../kit/ExpandableFigure';
import { Callout, CeilingCut, ConcreteCut, DuctSide, JacketPath, LadderTraySide, RackSide, ScaleBar, StudWallCut, SVG_A11Y } from '../svgArt';
import {
  ACircle,
  AG,
  APath,
  Animated,
  Appear,
  CI_EASE,
  CI_MOTION,
  CI_SPRING_UI,
  PulseRing,
  Stagger,
  cancelAnimation,
  useAnimatedProps,
  useAnimatedStyle,
  useCiMotion,
  useDrawIn,
  useSharedValue,
  withDelay,
  withRepeat,
  withSpring,
  withTiming,
} from '../motion';
import { CI_FIRE_SPACES } from '../data/scenarios';
import { clamp100 } from '../engine/score';
import type { CiModuleProps } from '../registry';

/* ── the five-question penetration flow (one rated-wall attempt) ────────── */
type FlowQ = { id: string; q: string; options: string[]; correctIdx: number; reveal: string; ruleId: string };

const FLOW_SPEC =
  'SIMULATED PROJECT DOCUMENTS — Drawing A-401 marks the corridor wall at the equipment room as a fire-resistance-rated assembly. The cable schedule lists this run\'s cable as rated for every space on the route. On the truck: a tube of generic "fire-rated" sealant. In the submittals: a listed firestop system matched to this wall type and this cable bundle.';

const FLOW: FlowQ[] = [
  {
    id: 'f-assembly',
    q: 'What space/assembly are you about to penetrate?',
    options: [
      'A fire-resistance-rated assembly — the drawings mark it',
      'An ordinary partition — treat it like drywall',
      'No way to know, so assume whichever is faster',
    ],
    correctIdx: 0,
    reveal: 'The drawings identify it. Reading the assembly from the documents is the step that makes every later decision possible.',
    ruleId: 'wall-verify-assembly',
  },
  {
    id: 'f-cable',
    q: 'Does the cable have the right rating for these spaces?',
    options: [
      'Check the schedule/listing — here the cable is listed for the spaces this run crosses',
      '"Low voltage" needs no rating anywhere',
      'The jacket color decides',
    ],
    correctIdx: 0,
    reveal: 'The space dictates the cable. The schedule confirms this cable\'s listing — without that check the route can be perfect and the installation still wrong.',
    ruleId: 'plan-environment',
  },
  {
    id: 'f-listed',
    q: 'Is a listed penetration/firestop system required here?',
    options: [
      'Yes — a rated-assembly penetration is protected by a tested, listed system',
      'No — a tight hole seals itself',
      'Only if an inspector is scheduled',
    ],
    correctIdx: 0,
    reveal: 'Rated assembly = listed system. The requirement travels with the wall, not with who happens to be watching.',
    ruleId: 'fire-system-not-sealant',
  },
  {
    id: 'f-compat',
    q: 'The truck offers the tube of generic "fire-rated" sealant. Compatible and tested for this assembly?',
    options: [
      'Not verifiable as a system — use the listed system matched to THIS assembly and THESE penetrants',
      'Yes — the label says fire rated',
      'Yes, if applied extra thick',
    ],
    correctIdx: 0,
    reveal: 'A tube is a component. The listing covers the assembly, the penetrating items, the annular space and the materials together — outside its tested system, "fire rated" on a label means nothing.',
    ruleId: 'fire-system-not-sealant',
  },
  {
    id: 'f-verify',
    q: 'Submittals in hand, one detail still unclear. Is professional / AHJ verification required?',
    options: [
      'When anything is unsure — yes: documents, the project team, or the AHJ, before the work',
      'Never — installers self-certify firestop',
      'Only on government projects',
    ],
    correctIdx: 0,
    reveal: 'Life-safety construction is never a guess. Verification is not weakness — it is the professional behavior the industry\'s documents assume.',
    ruleId: 'fire-when-unsure',
  },
];

/* ── motion helpers (WhyScene idiom — primitive props only) ─────────────── */
/** Spring a scalar to its target with the UI spring (the kit's useSettle is
 *  typed to its own default spring config). */
function useSpringTo(target: number, reduce: boolean) {
  const v = useSharedValue(target);
  useEffect(() => {
    if (reduce) {
      v.value = target;
      return;
    }
    v.value = withSpring(target, CI_SPRING_UI);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target, reduce]);
  return v;
}

/** Opacity entrance for static furniture inside an SVG. */
function FadeIn({ children, delay = 0, reduce }: { children: ReactNode; delay?: number; reduce: boolean }) {
  const t = useSharedValue(reduce ? 1 : 0);
  useEffect(() => {
    cancelAnimation(t);
    if (reduce) {
      t.value = 1;
      return;
    }
    t.value = 0;
    t.value = withDelay(delay, withTiming(1, { duration: CI_MOTION.base, easing: CI_EASE.out }));
    return () => cancelAnimation(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [delay, reduce]);
  const p = useAnimatedProps(() => ({ opacity: t.value }));
  return (
    <AG opacity={reduce ? 1 : 0} animatedProps={p}>
      {children}
    </AG>
  );
}

/** The stage's thesis lands slower than a normal card (CI_MOTION.reveal). */
function Reveal({ children, delay = 0, style }: { children: ReactNode; delay?: number; style?: StyleProp<ViewStyle> }) {
  const m = useCiMotion();
  const t = useSharedValue(m.reduce ? 1 : 0);
  useEffect(() => {
    cancelAnimation(t);
    if (m.reduce) {
      t.value = 1;
      return;
    }
    t.value = 0;
    t.value = withDelay(m.d(delay), withTiming(1, { duration: CI_MOTION.reveal, easing: CI_EASE.out }));
    return () => cancelAnimation(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [delay, m.reduce]);
  const s = useAnimatedStyle(() => ({
    opacity: t.value,
    transform: [{ translateY: (1 - t.value) * 16 }, { scale: 0.975 + 0.025 * t.value }],
  }));
  return <Animated.View style={[style, s]}>{children}</Animated.View>;
}

/** The cable ROUTES toward the chosen space: a solid lead travels the route,
 *  then settles into the dashed "proposed route" with its endpoint. Keyed by
 *  the selection so every new choice re-routes. */
function RouteDraw({ d, len, end }: { d: string; len: number; end: [number, number] }) {
  const m = useCiMotion();
  const [arrived, setArrived] = useState(false);
  const { animatedProps, dashArray, restOffset } = useDrawIn(len, { run: true, onDone: () => setArrived(true) });
  const r = useSpringTo(arrived ? 3.5 : 0, m.reduce);
  const dot = useAnimatedProps(() => ({ r: r.value }));
  return (
    <>
      {arrived ? (
        <Path d={d} stroke={colors.amber} strokeWidth={1.8} fill="none" strokeDasharray="5 4" strokeLinecap="round" />
      ) : (
        <APath
          d={d}
          stroke={colors.amber}
          strokeWidth={1.8}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={dashArray}
          strokeDashoffset={restOffset}
          animatedProps={animatedProps}
        />
      )}
      <ACircle cx={end[0]} cy={end[1]} r={0} fill={colors.amber} animatedProps={dot} />
    </>
  );
}

/** Quiet danger: the rated wall's hatching breathes while it is the active
 *  subject (the five-question flow), and rests solid otherwise. */
function RatedHatch({ active, loops }: { active: boolean; loops: boolean }) {
  const t = useSharedValue(0);
  useEffect(() => {
    cancelAnimation(t);
    if (!active || !loops) {
      t.value = 0;
      return;
    }
    t.value = withRepeat(withTiming(1, { duration: 2200, easing: CI_EASE.inOut }), -1, true);
    return () => cancelAnimation(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, loops]);
  const p = useAnimatedProps(() => ({ opacity: 0.62 + 0.38 * t.value }));
  return (
    <AG opacity={1} animatedProps={p}>
      {[84, 96, 108, 120, 132, 144, 156, 168, 180, 192, 204].map((y) => (
        <Path key={y} d={`M${RATED.x} ${y} L${RATED.x + RATED.t} ${y - RATED.t}`} stroke="#ff5a48" strokeWidth={1} strokeOpacity={0.55} />
      ))}
    </AG>
  );
}

/** The sleeved opening: pulses amber while the five questions are live,
 *  settles green once the flow is answered. */
function SleeveMarker({ on, done, reduce }: { on: boolean; done: boolean; reduce: boolean }) {
  const r = useSpringTo(done ? 15 : 20, reduce);
  const ring = useAnimatedProps(() => ({ r: r.value }));
  if (!on) return null;
  return (
    <>
      <Rect
        x={SLEEVE.cx - 16}
        y={SLEEVE.cy - 11}
        width={32}
        height={22}
        rx={5}
        fill="none"
        stroke={done ? colors.green : colors.amber}
        strokeWidth={1.6}
        strokeDasharray={done ? undefined : '4 3'}
      />
      {done ? (
        <ACircle cx={SLEEVE.cx} cy={SLEEVE.cy} r={20} fill="none" stroke={colors.green} strokeWidth={1.4} opacity={0.75} animatedProps={ring} />
      ) : (
        <PulseRing cx={SLEEVE.cx} cy={SLEEVE.cy} r={15} color={colors.amber} run />
      )}
    </>
  );
}

/** Numbered space marker — springs a touch larger the moment it is identified. */
function SpaceMarker({ cx, cy, n, done, reduce }: { cx: number; cy: number; n: number; done: boolean; reduce: boolean }) {
  const r = useSpringTo(done ? 10.7 : 9.5, reduce);
  const p = useAnimatedProps(() => ({ r: r.value }));
  const tint = done ? colors.green : colors.amber;
  return (
    <G>
      <ACircle cx={cx} cy={cy} r={done ? 10.7 : 9.5} fill="#17171c" stroke={tint} strokeWidth={1.5} animatedProps={p} />
      <Callout x={cx} y={cy + 3.6} text={String(n)} size={10.5} color={tint} bg={null} />
    </G>
  );
}

/* ── building-section training visualization ────────────────────────────── */
/** units per metre in the section. */
const BM = 40;
/** Floor lines: the slab between floors, the lower room's tiles + floor. */
const SLAB = { y: 64, h: 10 } as const;
const TILE_Y = 116;
const FLOOR_Y = 212;
/** The marked rated wall (slab to slab, two layers of board each face). */
const RATED = { x: 200, t: 8 } as const;
/** The sleeved opening through it — the five-question penetration. */
const SLEEVE = { cx: RATED.x + RATED.t / 2, cy: 180, h: 5 } as const;
/** The riser shaft. */
const SHAFT = { x0: 296, x1: 336, wall: 4, cableX: 316 } as const;

/** A small air-movement arrow (teaching colour). */
function AirArrow({ x, y, dir, len = 10 }: { x: number; y: number; dir: 'up' | 'down' | 'left' | 'right'; len?: number }) {
  const dx = dir === 'right' ? len : dir === 'left' ? -len : 0;
  const dy = dir === 'down' ? len : dir === 'up' ? -len : 0;
  const ex = x + dx;
  const ey = y + dy;
  const h = 3;
  const head =
    dir === 'up' ? `M${ex - h} ${ey + h} L${ex} ${ey} L${ex + h} ${ey + h}` :
    dir === 'down' ? `M${ex - h} ${ey - h} L${ex} ${ey} L${ex + h} ${ey - h}` :
    dir === 'right' ? `M${ex - h} ${ey - h} L${ex} ${ey} L${ex - h} ${ey + h}` :
    `M${ex + h} ${ey - h} L${ex} ${ey} L${ex + h} ${ey + h}`;
  return <Path d={`M${x} ${y} L${ex} ${ey} ${head}`} stroke="#4fd0e0" strokeWidth={1.1} fill="none" strokeLinecap="round" strokeLinejoin="round" />;
}

/** A return / supply grille set in the tile line. */
function Grille({ x0, x1 }: { x0: number; x1: number }) {
  const slats: string[] = [];
  for (let x = x0 + 2.6; x < x1 - 1.5; x += 3.2) slats.push(`M${x} ${TILE_Y + 1} v3.6`);
  return (
    <G>
      <Rect x={x0} y={TILE_Y} width={x1 - x0} height={5.4} rx={0.8} fill="#d9d7d0" stroke="#8d8a80" strokeWidth={0.5} />
      <Path d={slats.join('')} stroke="#8d8a80" strokeWidth={0.8} />
    </G>
  );
}

/**
 * Section: two floors, the riser shaft on the right. The lower room holds
 * the rack, a non-rated partition that stops at the ceiling, and the MARKED
 * rated wall that runs slab to slab with the sleeved opening. Left of the
 * rated wall the ceiling cavity carries a DUCTED return (a cavity, not a
 * plenum); right of it the return grille opens straight into the cavity —
 * air moves through the space itself. The building RESPONDS to attention:
 * choosing a space routes the cable toward it and fades that space up.
 */
function BuildingArt({
  w,
  sel,
  done,
  flowOn,
  flowDone,
}: {
  w: number;
  sel: string | null;
  done: (id: string) => boolean;
  flowOn: boolean;
  flowDone: boolean;
}) {
  const m = useCiMotion();
  const h = Math.round((w * 224) / 360);
  const ROUTES: Record<string, { d: string; len: number; end: [number, number] }> = {
    'fs-cavity': { d: 'M44 132 V100 H128', len: 130, end: [128, 100] },
    'fs-plenum': { d: `M52 ${SLEEVE.cy} H${RATED.x + RATED.t + 6} V104 H236`, len: 280, end: [236, 104] },
    'fs-riser': { d: `M52 ${SLEEVE.cy + 4} H${RATED.x + RATED.t + 6} V194 H${SHAFT.cableX} V120`, len: 380, end: [SHAFT.cableX, 120] },
  };
  const HL: Record<string, [number, number, number, number]> = {
    'fs-cavity': [12, SLAB.y + SLAB.h + 2, RATED.x - 14, TILE_Y - SLAB.y - SLAB.h - 4],
    'fs-plenum': [RATED.x + RATED.t + 2, SLAB.y + SLAB.h + 2, SHAFT.x0 - RATED.x - RATED.t - 4, TILE_Y - SLAB.y - SLAB.h - 4],
    'fs-riser': [SHAFT.x0 + SHAFT.wall, 8, SHAFT.x1 - SHAFT.x0 - 2 * SHAFT.wall, FLOOR_Y - 8],
  };
  const MARK: Record<string, [number, number]> = {
    'fs-cavity': [152, 90],
    'fs-plenum': [254, 96],
    'fs-riser': [SHAFT.cableX, 40],
  };
  const route = sel ? ROUTES[sel] : null;
  const hl = sel ? HL[sel] : null;
  const cavTop = SLAB.y + SLAB.h;
  return (
    <Svg {...SVG_A11Y}
      width={w}
      height={h}
      viewBox="0 0 360 224"
      accessibilityLabel="Building section, training visualization: two floors with a riser shaft on the right. The lower room holds the equipment rack, a non-rated partition that stops at the suspended ceiling, and a marked fire-rated wall that runs slab to slab with a sleeved opening. Left of the rated wall the ceiling cavity has a ducted return grille; right of it the return grille opens into the cavity itself, the air-handling space. The riser cable passes the floor slab through a fire-stopped sleeve. Proposed cable routes draw as dashed lines from the rack. All interaction happens in the cards below."
    >
      <Rect x={6} y={2} width={348} height={218} rx={10} fill="#111216" />

      {/* ── structure: ground slab, the slab between floors, the shaft ── */}
      <ConcreteCut x={6} y={FLOOR_Y} w={348} h={8} />
      <ConcreteCut x={6} y={SLAB.y} w={SHAFT.x0 - 6} h={SLAB.h} />
      <ConcreteCut x={SHAFT.x1} y={SLAB.y} w={354 - SHAFT.x1} h={SLAB.h} />
      {/* shaft floor slab, with the sleeved opening left open */}
      <ConcreteCut x={SHAFT.x0} y={SLAB.y} w={SHAFT.cableX - 4 - SHAFT.x0} h={SLAB.h} />
      <ConcreteCut x={SHAFT.cableX + 4} y={SLAB.y} w={SHAFT.x1 - SHAFT.cableX - 4} h={SLAB.h} />
      {/* shaft walls: masonry, coursed, ground to top */}
      {[SHAFT.x0, SHAFT.x1 - SHAFT.wall].map((x) => (
        <G key={x}>
          <ConcreteCut x={x} y={8} w={SHAFT.wall} h={FLOOR_Y - 8} />
          {Array.from({ length: 16 }, (_, i) => 20 + i * 12).map((y) => (
            <Line key={y} x1={x} y1={y} x2={x + SHAFT.wall} y2={y} stroke="#23252a" strokeWidth={0.45} />
          ))}
        </G>
      ))}
      {/* the shaft-wall sleeve at floor level where the lower route enters */}
      <Rect x={SHAFT.x0 - 2} y={191} width={SHAFT.wall + 4} height={6} rx={0.8} fill="#80868f" stroke="#2c2f34" strokeWidth={0.5} />

      {/* ── riser shaft: vertical cable runway, the backbone on it, the slab
          sleeve with firestop top and bottom ── */}
      <Rect x={SHAFT.cableX + 5} y={12} width={5} height={FLOOR_Y - 12} fill="#3a3d43" stroke="#1d1f24" strokeWidth={0.4} />
      {Array.from({ length: 16 }, (_, i) => 18 + i * 12).map((y) => (
        <Line key={y} x1={SHAFT.cableX + 5} y1={y} x2={SHAFT.cableX + 10} y2={y} stroke="#6d737b" strokeWidth={0.9} />
      ))}
      <JacketPath d={`M${SHAFT.cableX} 12 V${FLOOR_Y}`} color="#37d97b" width={2.4} />
      {[40, 100, 140, 176].map((y) => (
        <Rect key={y} x={SHAFT.cableX - 2.4} y={y} width={9.4} height={2.2} rx={0.6} fill="#23262b" stroke="#0a0a0c" strokeWidth={0.3} />
      ))}
      <Rect x={SHAFT.cableX - 3} y={SLAB.y - 4} width={6} height={SLAB.h + 8} rx={0.8} fill="#80868f" stroke="#2c2f34" strokeWidth={0.5} />
      <Rect x={SHAFT.cableX - 3.4} y={SLAB.y - 4.6} width={6.8} height={2.4} rx={0.8} fill="#c8372b" />
      <Rect x={SHAFT.cableX - 3.4} y={SLAB.y + SLAB.h + 2.2} width={6.8} height={2.4} rx={0.8} fill="#c8372b" />
      <JacketPath d={`M${SHAFT.cableX} ${SLAB.y - 5} V${SLAB.y + SLAB.h + 5}`} color="#37d97b" width={2.4} shadow={false} />
      <Callout x={SHAFT.cableX} y={19} text="RISER" size={10} color="#9ea3ad" bg={null} />
      <Callout x={SHAFT.cableX} y={166} text="CMR" size={9.6} color="#9ea3ad" bg="rgba(17,18,22,0.9)" />

      {/* ── upper floor: its own suspended ceiling, a scale bar ── */}
      <CeilingCut x0={10} x1={SHAFT.x0 - 2} y={52} m={BM} hangTo={12} />
      <Callout x={60} y={32} text="UPPER FLOOR" size={9.6} color="#6d717a" bg={null} />
      <ScaleBar x={200} y={36} m={BM} metres={1} color="#8d9199" />

      {/* ── lower room's suspended ceiling, hung from the slab; a cut-out
          above the rack where its cables rise ── */}
      <CeilingCut x0={10} x1={RATED.x - 1} y={TILE_Y} m={BM} hangTo={cavTop} opening={[34, 50]} />
      <CeilingCut x0={RATED.x + RATED.t + 1} x1={SHAFT.x0 - 2} y={TILE_Y} m={BM} hangTo={cavTop} />

      {/* ── SPACE 1 · the cavity left of the rated wall: DUCTED return (a
          grille with its own duct back to the air handler) + the tray ── */}
      <DuctSide x0={10} x1={90} y={80} h={14} m={BM} hangTo={cavTop} />
      <Rect x={64} y={94} width={26} height={TILE_Y - 94} fill="#868b93" stroke="#2c2f34" strokeWidth={0.5} />
      <Grille x0={62} x1={92} />
      <AirArrow x={77} y={113} dir="up" len={12} />
      <AirArrow x={58} y={87} dir="left" len={12} />
      <AirArrow x={36} y={87} dir="left" len={12} />
      <LadderTraySide x0={56} x1={RATED.x - 6} y={110} m={BM} rodTo={cavTop} rodEvery={1.5} />
      <JacketPath d="M40 132 V107 H190" color="#37d97b" width={2.2} />
      <JacketPath d="M44 132 V104 H190" color="#4fd0e0" width={2.2} />
      <Callout x={90} y={128} text="DUCTED RETURN" size={9.6} color="#9ea3ad" bg="rgba(17,18,22,0.9)" />

      {/* non-rated partition: stops at the ceiling (a rated wall would not) */}
      <StudWallCut x={126} y0={TILE_Y} y1={FLOOR_Y} t={5} />
      <Callout x={156} y={208} text="NON-RATED" size={9.6} color="#9ea3ad" bg={null} />

      {/* ── SPACE 2 · right of the rated wall: the return grille opens into
          the cavity itself (an air-handling space); supply is ducted to a
          diffuser ── */}
      <DuctSide x0={RATED.x + RATED.t + 4} x1={SHAFT.x0 - 4} y={78} h={11} m={BM} hangTo={cavTop} />
      <Rect x={218} y={89} width={16} height={TILE_Y - 89} fill="#868b93" stroke="#2c2f34" strokeWidth={0.5} />
      <Grille x0={214} x1={238} />
      <AirArrow x={222} y={123} dir="down" len={10} />
      <AirArrow x={230} y={123} dir="down" len={10} />
      <Grille x0={262} x1={290} />
      <AirArrow x={270} y={113} dir="up" len={12} />
      <AirArrow x={282} y={113} dir="up" len={12} />
      <AirArrow x={262} y={98} dir="left" len={14} />
      <AirArrow x={248} y={110} dir="left" len={14} />
      <Callout x={252} y={128} text="PLENUM RETURN" size={9.6} color="#9ea3ad" bg="rgba(17,18,22,0.9)" />

      {/* ── the MARKED rated wall: slab to slab, two layers of board each
          face, the rating hatch, the sleeve through it ── */}
      <Rect x={RATED.x} y={cavTop} width={RATED.t} height={FLOOR_Y - cavTop} fill="#241416" />
      {[0, 1.2, RATED.t - 2.4, RATED.t - 1.2].map((dx) => (
        <Rect key={dx} x={RATED.x + dx} y={cavTop} width={1.2} height={FLOOR_Y - cavTop} fill="#d7d4cc" />
      ))}
      <RatedHatch active={flowOn && !flowDone} loops={m.loops} />
      <Rect x={RATED.x - 4} y={SLEEVE.cy - SLEEVE.h / 2} width={RATED.t + 8} height={SLEEVE.h} rx={1} fill="#80868f" stroke="#2c2f34" strokeWidth={0.5} />
      {flowDone ? (
        <G>
          {/* the listed system, installed: firestop material both faces */}
          <Rect x={RATED.x - 5} y={SLEEVE.cy - SLEEVE.h / 2 - 1.6} width={2} height={SLEEVE.h + 3.2} rx={0.8} fill="#c8372b" />
          <Rect x={RATED.x + RATED.t + 3} y={SLEEVE.cy - SLEEVE.h / 2 - 1.6} width={2} height={SLEEVE.h + 3.2} rx={0.8} fill="#c8372b" />
        </G>
      ) : null}
      <Callout x={262} y={208} text="RATED · SEE PLANS" size={10} color="#ff8a6b" bg="#1a0f0f" border="#ff5a48" />
      <Line x1={218} y1={205} x2={RATED.x + RATED.t + 1} y2={200} stroke="#ff5a48" strokeWidth={0.6} />
      <SleeveMarker on={flowOn} done={flowDone} reduce={m.reduce} />

      {/* ── the rack in section (2 m tall, 1 m deep) with its labels ── */}
      <RackSide x={12} floorY={FLOOR_Y} m={BM} />
      <Callout x={32} y={176} text="RACK" size={10.5} color="#9ea3ad" bg={null} />
      <Callout x={58} y={208} text="EQUIP RM" size={9.6} color="#6d717a" bg={null} anchor="start" />

      {/* the building responds to attention: the route travels toward the
          chosen space and that space's highlight fades up behind it */}
      {hl && sel ? (
        <FadeIn key={`hl-${sel}`} delay={m.d(CI_MOTION.quick)} reduce={m.reduce}>
          <Rect
            x={hl[0]}
            y={hl[1]}
            width={hl[2]}
            height={hl[3]}
            rx={4}
            fill={colors.amber}
            fillOpacity={0.08}
            stroke={colors.amber}
            strokeOpacity={0.5}
            strokeWidth={1.2}
            strokeDasharray="5 4"
          />
        </FadeIn>
      ) : null}
      {route && sel ? <RouteDraw key={`rt-${sel}`} d={route.d} len={route.len} end={route.end} /> : null}

      {/* numbered space markers (green once identified) */}
      {CI_FIRE_SPACES.map((s, i) => {
        const [mx, my] = MARK[s.id];
        return <SpaceMarker key={s.id} cx={mx} cy={my} n={i + 1} done={done(s.id)} reduce={m.reduce} />;
      })}
    </Svg>
  );
}

/* ── lesson card (WhyScene "NEAT ≠ CORRECT" idiom) ──────────────────────── */
/** The stage's thesis — a deliberate reveal, slower than a normal card. */
function LessonCard({ head, body }: { head: string; body: string }) {
  return (
    <Reveal style={styles.lessonCard}>
      <Text style={styles.lessonHead}>{head}</Text>
      <Text style={styles.lessonBody}>{body}</Text>
    </Reveal>
  );
}

/* ── the scene ──────────────────────────────────────────────────────────── */
export function FireScene({ width, completed, onComplete, openSources }: CiModuleProps) {
  const [spaceAns, setSpaceAns] = useState<Record<string, number>>(() => {
    if (!completed) return {};
    const pre: Record<string, number> = {};
    for (const s of CI_FIRE_SPACES) pre[s.id] = s.correctIdx;
    return pre;
  });
  const [flowAns, setFlowAns] = useState<number[]>(() => (completed ? FLOW.map((q) => q.correctIdx) : []));
  const [sel, setSel] = useState<string | null>(completed ? CI_FIRE_SPACES[CI_FIRE_SPACES.length - 1].id : null);
  const [fired, setFired] = useState(completed);

  const spacesDone = CI_FIRE_SPACES.every((s) => spaceAns[s.id] != null);
  const flowDone = flowAns.length >= FLOW.length;
  const plenumPairDone = spaceAns['fs-cavity'] != null && spaceAns['fs-plenum'] != null;

  const maybeFire = (spaces: Record<string, number>, flow: number[]) => {
    if (fired) return;
    if (!CI_FIRE_SPACES.every((s) => spaces[s.id] != null) || flow.length < FLOW.length) return;
    setFired(true);
    const spaceWrong = CI_FIRE_SPACES.filter((s) => spaces[s.id] !== s.correctIdx).length;
    const flowWrong = FLOW.filter((q, i) => flow[i] !== q.correctIdx).length;
    announceComplete('Stage 11 complete.');
    onComplete({
      safety: clamp100(100 - flowWrong * 15 - spaceWrong * 5),
      routing: clamp100(100 - spaceWrong * 15 - flowWrong * 5),
    });
  };

  const answerSpace = (id: string, idx: number) => {
    if (spaceAns[id] != null) return;
    const next = { ...spaceAns, [id]: idx };
    setSpaceAns(next);
    maybeFire(next, flowAns);
  };

  const answerFlow = (qi: number, idx: number) => {
    if (flowAns.length !== qi) return;
    const next = [...flowAns, idx];
    setFlowAns(next);
    maybeFire(spaceAns, next);
  };

  /* ── the controls that change the drawing — rendered on the page AND docked
     under the drawing in full screen (owner 2026-09-25: "the user must still be
     able to adjust and view their changes to controls"). State lives here; the
     elements are simply rendered twice. ──────────────────────────────────── */
  const spaceDock = (
    <View style={{ gap: 6, paddingHorizontal: 12 }}>
      {CI_FIRE_SPACES.map((sp, i) => {
        const answered = spaceAns[sp.id] != null;
        const isSel = sel === sp.id;
        return (
          <Pressable
            key={sp.id}
            onPress={() => setSel(isSel ? null : sp.id)}
            style={[styles.spaceCard, isSel && styles.spaceCardSel, styles.spaceHead, { paddingVertical: 6 }]}
            accessibilityRole="button"
            accessibilityState={{ selected: isSel }}
            aria-pressed={isSel}
            accessibilityLabel={`Space ${i + 1}. ${sp.label}${answered ? ', identified' : ''}`}
          >
            <View style={[styles.spaceNum, answered && styles.spaceNumDone]}>
              <Text style={[styles.spaceNumText, answered && { color: colors.green }]}>{answered ? '✓' : i + 1}</Text>
            </View>
            <Text style={styles.spaceLabel}>{sp.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );

  return (
    <View style={{ gap: 14 }}>
      <ExpandableFigure
        width={width}
        aspect={360 / 224}
        title="BUILDING"
        badge="Training visualization — simplified section; teaching colors, not field colors."
        render={(w) => <BuildingArt w={w} sel={sel} done={(id) => spaceAns[id] != null} flowOn={spacesDone} flowDone={flowDone} />}
        controls={spaceDock}
      />
      <Text style={styles.tintNote}>
        TRAINING VISUALIZATION — simplified building section; tints are the lab’s teaching colors, not field colors.
        Red-hatched wall = marked rated assembly (slab to slab) · plain wall = non-rated partition (stops at the ceiling) ·
        numbered markers = the three spaces below.
      </Text>

      <CiSection title="ROUTE THE CABLE — IDENTIFY EACH SPACE FIRST">
        <Text style={styles.lead}>
          Three candidate spaces stand between the rack and where this cable must go. Tap a space to route toward it —
          then identify what the space means before anything gets pulled.
        </Text>
        <View style={{ gap: 10 }}>
          {CI_FIRE_SPACES.map((s, i) => {
            const ans = spaceAns[s.id];
            const answered = ans != null;
            const isSel = sel === s.id;
            return (
              <Stagger key={s.id} index={i} style={[styles.spaceCard, isSel && styles.spaceCardSel]}>
                <Pressable
                  onPress={() => setSel(isSel ? null : s.id)}
                  style={styles.spaceHead}
                  accessibilityRole="button"
                  accessibilityState={{ selected: isSel, expanded: isSel }}
                  aria-pressed={isSel}
                  aria-expanded={isSel}
                  accessibilityLabel={`Space ${i + 1}. ${s.label}${answered ? ', identified' : ''}`}
                >
                  <View style={[styles.spaceNum, answered && styles.spaceNumDone]}>
                    <Text style={[styles.spaceNumText, answered && { color: colors.green }]}>{answered ? '✓' : i + 1}</Text>
                  </View>
                  <Text style={styles.spaceLabel}>{s.label}</Text>
                </Pressable>
                {isSel ? (
                  <View style={{ gap: 8 }}>
                    <Text style={styles.spaceQ}>Cable routed toward this space (dashed on the section). {s.question}</Text>
                    <View style={{ gap: 7 }}>
                      {stableShuffle(s.options).map(({ item: opt, idx: oi }) => (
                        <OptionChip
                          key={oi}
                          label={opt}
                          // Show what the LEARNER picked, not the right answer
                          // (fix 2026-08-28): this highlighted `correctIdx`, so
                          // a wrong pick lit up the correct chip and the learner
                          // could not see what they had actually chosen — while
                          // the banner below told them they were wrong.
                          active={answered && oi === spaceAns[s.id]}
                          disabled={answered}
                          onPress={() => answerSpace(s.id, oi)}
                        />
                      ))}
                    </View>
                    {answered ? (
                      <Appear style={{ gap: 8 }}>
                        <VerdictBanner verdict={ans === s.correctIdx ? 'correct' : 'wrong'} text={s.reveal} />
                        <RuleFeedback ruleId={s.ruleId} verdict={ans === s.correctIdx ? 'good' : 'bad'} openSources={openSources} />
                      </Appear>
                    ) : null}
                  </View>
                ) : null}
              </Stagger>
            );
          })}
        </View>
        {plenumPairDone ? (
          <LessonCard
            head="CEILING CAVITY ≠ AUTOMATICALLY PLENUM"
            body="Whether a ceiling space handles environmental air is a fact of the building’s design — some cavities move air through the open space, most carry it in ducts, and the requirements differ. Identify the space from the project documents before selecting cable; assuming in either direction produces a wrong installation."
          />
        ) : null}
      </CiSection>

      <CiSection title="ONE RATED-WALL PENETRATION — FIVE QUESTIONS">
        {!spacesDone ? (
          <Text style={styles.pendingNote}>Identify all three spaces above to unlock the penetration walk-through.</Text>
        ) : (
          <View style={{ gap: 10 }}>
            <Text style={styles.lead}>
              You are at the sleeved opening in the marked wall (highlighted on the section). Five questions professionals
              answer BEFORE the cable goes through — every time.
            </Text>
            <SpecCard text={FLOW_SPEC} />
            {FLOW.slice(0, Math.min(FLOW.length, flowAns.length + 1)).map((q, qi) => {
              const ans = flowAns[qi];
              const answered = ans != null;
              return (
                <Appear key={q.id} style={styles.flowCard}>
                  <Text style={styles.flowNum}>
                    QUESTION {qi + 1} / {FLOW.length}
                  </Text>
                  <Text style={styles.flowQ}>{q.q}</Text>
                  <View style={{ gap: 7 }}>
                    {stableShuffle(q.options).map(({ item: opt, idx: oi }) => (
                      <OptionChip
                        key={oi}
                        label={opt}
                        // The learner's own pick (fix 2026-08-28) — see above.
                        active={answered && oi === flowAns[qi]}
                        disabled={answered}
                        onPress={() => answerFlow(qi, oi)}
                      />
                    ))}
                  </View>
                  {answered ? (
                    <Appear style={{ gap: 8 }}>
                      <VerdictBanner verdict={ans === q.correctIdx ? 'correct' : 'wrong'} text={q.reveal} />
                      <RuleFeedback ruleId={q.ruleId} verdict={ans === q.correctIdx ? 'good' : 'bad'} openSources={openSources} />
                    </Appear>
                  ) : null}
                </Appear>
              );
            })}
            {flowDone ? (
              <LessonCard
                head="FIRESTOPPING IS A SYSTEM — NOT RED SEALANT"
                body="A listed firestop system specifies the assembly, the penetrating items, the annular space and the materials together, tested as one. No tube of sealant is “fire rated” outside the system it was tested in — matching the listed system to this wall and these cables IS the installation."
              />
            ) : null}
          </View>
        )}
      </CiSection>

      <Text style={styles.scopeNote}>
        Awareness training — this stage teaches recognition and verification, not firestop system design. Rated-assembly
        work is executed and verified per the project’s listed systems and the authority having jurisdiction.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  tintNote: { fontFamily: fonts.oswaldSemiBold, fontSize: 9, letterSpacing: 0.8, lineHeight: 13, color: colors.textSub },
  lead: { fontFamily: fonts.barlowRegular, fontSize: 13.5, lineHeight: 19, color: colors.textSecondary },
  spaceCard: { gap: 10, borderRadius: 12, borderWidth: 1, borderColor: '#26262c', backgroundColor: '#131316', padding: 12 },
  spaceCardSel: { borderColor: 'rgba(255,198,77,.6)' },
  spaceHead: { flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 44 },
  spaceNum: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 1.5,
    borderColor: 'rgba(255,198,77,.6)',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#17171c',
  },
  spaceNumDone: { borderColor: 'rgba(55,224,95,.6)' },
  spaceNumText: { fontFamily: fonts.oswaldSemiBold, fontSize: 12, color: colors.amber },
  spaceLabel: { flex: 1, fontFamily: fonts.barlowMedium, fontSize: 13.5, lineHeight: 18.5, color: colors.textPrimary },
  spaceQ: { fontFamily: fonts.barlowMedium, fontSize: 13, lineHeight: 18.5, color: colors.textSecondary },
  flowCard: { gap: 8, borderRadius: 12, borderWidth: 1, borderColor: '#26262c', backgroundColor: '#131316', padding: 12 },
  flowNum: { fontFamily: fonts.oswaldSemiBold, fontSize: 10.5, letterSpacing: 1.4, color: colors.amberLabel },
  flowQ: { fontFamily: fonts.barlowMedium, fontSize: 14, lineHeight: 19.5, color: colors.textPrimary },
  lessonCard: { gap: 6, borderRadius: 10, borderLeftWidth: 3, borderLeftColor: colors.amber, backgroundColor: '#151310', padding: 12 },
  lessonHead: { fontFamily: fonts.oswaldSemiBold, fontSize: 13, letterSpacing: 1.6, color: colors.amber },
  lessonBody: { fontFamily: fonts.barlowRegular, fontSize: 13, lineHeight: 19, color: colors.textSecondary },
  pendingNote: { fontFamily: fonts.barlowMedium, fontSize: 12.5, color: colors.amberLabel },
  scopeNote: { fontFamily: fonts.barlowRegular, fontSize: 11.5, lineHeight: 16, color: colors.textSub, fontStyle: 'italic' },
});
