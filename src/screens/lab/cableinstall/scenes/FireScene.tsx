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
  'SIMULATED PROJECT DOCUMENTS — Drawing A-401 marks the equipment-room wall as a fire-resistance-rated assembly, slab to slab. The cable schedule lists this run\'s cable as rated for every space on the route. On the truck: a tube of generic "fire-rated" sealant. In the submittals: a listed firestop system matched to this wall type and this cable bundle.';

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
function RatedHatch({ active, loops, ys }: { active: boolean; loops: boolean; ys: number[] }) {
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
      {ys.map((y) => (
        <Path key={y} d={`M${RATED.x} ${y} L${RATED.x + RATED.t} ${y - RATED.t}`} stroke="#ff5a48" strokeWidth={1} strokeOpacity={0.55} />
      ))}
    </AG>
  );
}

/** The sleeved opening: pulses amber while the five questions are live,
 *  settles green once the flow is answered. */
function SleeveMarker({ on, done }: { on: boolean; done: boolean; reduce?: boolean }) {
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
      {done ? null : <PulseRing cx={SLEEVE.cx} cy={SLEEVE.cy} r={15} color={colors.amber} run />}
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
/** Units per metre in the section (drawn to scale: 1 m = 40 units). */
const BM = 40;
/** The slab between the floors, the lower room's tiles and floor. The
 *  ceiling cavity is 1.3 m deep, the rooms 2.4 m clear. */
const SLAB = { y: 38, h: 10 } as const;
const CAV_TOP = SLAB.y + SLAB.h;
const TILE_Y = 100;
const FLOOR_Y = 196;
/** The non-rated partition (store | equipment room). */
const PART = { x: 84, t: 6 } as const;
/** The MARKED rated wall — the equipment room's wall to the open office:
 *  studs with two layers of board each face (about 0.17 m overall). */
const RATED = { x: 196, t: 7 } as const;
/** The sleeved opening through it — the five-question penetration. */
const SLEEVE = { cx: RATED.x + RATED.t / 2, cy: 70, h: 6 } as const;
/** The stacked riser rooms: walls at each floor, the slab continuous with
 *  its sleeves; the backbone at `cableX`, a spare sleeve at `spareX` that
 *  the proposed route would use. */
const SHAFT = { x0: 300, x1: 344, wall: 6, cableX: 328, spareX: 316 } as const;
/** The rack (side section, 2.0 m tall, 1.0 m deep; front faces left). */
const RACK_X = 132;
/** Where the cables drop from the tray to the rack top (a short vertical
 *  ladder carries them). */
const DROP = { x0: 140, x1: 154 } as const;
/** Existing cable colours in the tray (teaching colours, deliberately not the
 *  cyan of the air arrows). */
const EXIST_A = '#c4692a';
const EXIST_B = '#8a8f98';
const AIR = '#4fd0e0';

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
  return <Path d={`M${x} ${y} L${ex} ${ey} ${head}`} stroke={AIR} strokeWidth={1.2} fill="none" strokeLinecap="round" strokeLinejoin="round" />;
}

/** A return grille set in the tile line (seen in section: frame and blades). */
function Grille({ x0, x1 }: { x0: number; x1: number }) {
  const slats: string[] = [];
  for (let x = x0 + 2.6; x < x1 - 1.5; x += 3.2) slats.push(`M${x} ${TILE_Y - 1.6} l1.6 3.4`);
  return (
    <G>
      <Rect x={x0} y={TILE_Y - 2} width={x1 - x0} height={4.4} fill="#1b1c20" stroke="#d9d7d0" strokeWidth={0.6} />
      <Path d={slats.join('')} stroke="#d9d7d0" strokeWidth={0.7} />
    </G>
  );
}

/** A plain leader: a fine line from the label to a dot on the object. */
function Lead({ x1, y1, x2, y2, color = '#8d9199' }: { x1: number; y1: number; x2: number; y2: number; color?: string }) {
  return (
    <G>
      <Line x1={x1} y1={y1} x2={x2} y2={y2} stroke={color} strokeWidth={0.6} />
      <Circle cx={x2} cy={y2} r={1.2} fill={color} />
    </G>
  );
}

/** Firestop at one face of a penetration — the lab's symbol for an installed
 *  listed system (real products vary in form and colour). */
function Firestop({ x, y, w, h }: { x: number; y: number; w: number; h: number }) {
  return <Rect x={x} y={y} width={w} height={h} rx={0.6} fill="#c8372b" stroke="#6e1a13" strokeWidth={0.3} />;
}

/** Stacked masonry riser walls, coursed, interrupted by the slab. */
function RiserWall({ x, y0, y1 }: { x: number; y0: number; y1: number }) {
  const courses: number[] = [];
  for (let y = y0 + 8; y < y1 - 1; y += 8) courses.push(y);
  return (
    <G>
      <ConcreteCut x={x} y={y0} w={SHAFT.wall} h={y1 - y0} />
      {courses.map((y) => (
        <Line key={y} x1={x} y1={y} x2={x + SHAFT.wall} y2={y} stroke="#23252a" strokeWidth={0.45} />
      ))}
    </G>
  );
}

/**
 * Section, drawn to scale: the floor above, the slab, and the lower floor — a
 * store and the equipment room separated by a non-rated partition that stops
 * just above the ceiling, the MARKED rated equipment-room wall running slab
 * to slab with its sleeve, an open office, and the stacked riser rooms on the
 * right with firestopped slab sleeves. Left of the rated wall the cavity
 * carries a DUCTED return (the cavity is not the air path); over the open
 * office the return grille opens into the cavity and the air crosses the open
 * space to the return inlet — the cavity IS the air path (washed cyan). The
 * building RESPONDS: choosing a space routes the cable toward it and fades
 * that space up; each answer in the five-question flow adds its step to the
 * penetration (cable through the sleeve → firestop both faces → done).
 */
function BuildingArt({
  w,
  sel,
  done,
  flowOn,
  flowStep,
  flowDone,
}: {
  w: number;
  sel: string | null;
  done: (id: string) => boolean;
  flowOn: boolean;
  flowStep: number;
  flowDone: boolean;
}) {
  const m = useCiMotion();
  const h = Math.round((w * 224) / 360);
  const rackTop = FLOOR_Y - 2 * BM;
  const wallR = RATED.x + RATED.t;
  const ROUTES: Record<string, { d: string; len: number; end: [number, number] }> = {
    'fs-cavity': { d: `M151 ${rackTop} V${SLEEVE.cy} H176`, len: 80, end: [176, SLEEVE.cy] },
    'fs-plenum': { d: `M151 ${rackTop} V${SLEEVE.cy} H250`, len: 160, end: [250, SLEEVE.cy] },
    'fs-riser': { d: `M151 ${rackTop} V${SLEEVE.cy} H${SHAFT.spareX} V16`, len: 280, end: [SHAFT.spareX, 16] },
  };
  const HL: Record<string, [number, number, number, number]> = {
    'fs-cavity': [10, CAV_TOP + 1.5, RATED.x - 12, TILE_Y - CAV_TOP - 5],
    'fs-plenum': [wallR + 1.5, CAV_TOP + 1.5, SHAFT.x0 - wallR - 3, TILE_Y - CAV_TOP - 5],
    'fs-riser': [SHAFT.x0 + SHAFT.wall + 1, 6, SHAFT.x1 - SHAFT.x0 - 2 * SHAFT.wall - 2, FLOOR_Y - 8],
  };
  const MARK: Record<string, [number, number]> = {
    'fs-cavity': [176, 88],
    'fs-plenum': [250, 88],
    'fs-riser': [SHAFT.spareX + 2, 22],
  };
  const route = sel ? ROUTES[sel] : null;
  const hl = sel ? HL[sel] : null;
  const hatch: number[] = [];
  for (let y = CAV_TOP + 7; y <= FLOOR_Y; y += 7) hatch.push(y);
  const board = 0.65;
  return (
    <Svg {...SVG_A11Y}
      width={w}
      height={h}
      viewBox="0 0 360 224"
      accessibilityLabel="Building section drawn to scale, training visualization. Floor above, the concrete slab, and the lower floor: a store and the equipment room with the rack, separated by a non-rated partition that stops just above the suspended ceiling. The equipment-room wall is a marked fire-rated assembly running slab to slab, with a sleeve through it at cable-tray height. Above the store and equipment room the ceiling cavity holds a cable tray and a ducted return — the air stays in the duct; the cavity is not the air path. Over the open office the return grille opens into the cavity and the air crosses the open space to the return inlet — the cavity is the air path. On the right, stacked riser rooms carry a riser-rated backbone through a firestopped slab sleeve, beside a spare sleeve. Proposed cable routes draw as dashed lines from the rack. All interaction happens in the cards below."
    >
      <Rect x={0} y={0} width={360} height={224} rx={10} fill="#111216" />

      {/* ── structure: the slab between floors (cut, continuous through the
          riser with its sleeve openings), the ground slab ── */}
      <ConcreteCut x={6} y={FLOOR_Y} w={348} h={8} />
      <ConcreteCut x={6} y={SLAB.y} w={SHAFT.spareX - 3.5 - 6} h={SLAB.h} />
      <ConcreteCut x={SHAFT.spareX + 3.5} y={SLAB.y} w={SHAFT.cableX - 3.5 - SHAFT.spareX - 3.5} h={SLAB.h} />
      <ConcreteCut x={SHAFT.cableX + 3.5} y={SLAB.y} w={354 - SHAFT.cableX - 3.5} h={SLAB.h} />
      {/* riser-room walls, stopping at the slab on each floor */}
      {[SHAFT.x0, SHAFT.x1 - SHAFT.wall].map((x) => (
        <G key={x}>
          <RiserWall x={x} y0={4} y1={SLAB.y} />
          <RiserWall x={x} y0={SLAB.y + SLAB.h} y1={FLOOR_Y} />
        </G>
      ))}

      {/* ── floor above + the scale ── */}
      <Callout x={14} y={20} text="FLOOR ABOVE" size={9.6} color="#6d717a" bg={null} anchor="start" />
      <ScaleBar x={104} y={19} m={BM} metres={1} color="#8d9199" />

      {/* ── riser: vertical ladder runway (broken at the slab), the
          riser-rated backbone strapped to it through its firestopped sleeve,
          and a spare sleeve beside it, capped with a firestop plug ── */}
      {[
        [4, SLAB.y - 5],
        [SLAB.y + SLAB.h + 5, FLOOR_Y],
      ].map(([a, b]) => (
        <G key={a}>
          <Rect x={SHAFT.cableX + 3} y={a} width={5} height={b - a} fill="#3a3d43" stroke="#1d1f24" strokeWidth={0.4} />
          {Array.from({ length: Math.floor((b - a) / 12) }, (_, i) => a + 6 + i * 12).map((y) => (
            <Line key={y} x1={SHAFT.cableX + 3} y1={y} x2={SHAFT.cableX + 8} y2={y} stroke="#6d737b" strokeWidth={0.9} />
          ))}
        </G>
      ))}
      <JacketPath d={`M${SHAFT.cableX} 4 V${FLOOR_Y}`} color="#37d97b" width={2.4} />
      {[24, 80, 124, 168].map((y) => (
        <Rect key={y} x={SHAFT.cableX - 2.4} y={y} width={10.4} height={2.2} rx={0.6} fill="#23262b" stroke="#0a0a0c" strokeWidth={0.3} />
      ))}
      {[SHAFT.cableX, SHAFT.spareX].map((x) => (
        <G key={x}>
          <Rect x={x - 3} y={SLAB.y - 3} width={6} height={SLAB.h + 6} fill="#80868f" stroke="#2c2f34" strokeWidth={0.5} />
          {/* the spare's plug is opened while a route is proposed through it
              — it is re-firestopped per its system after the pull */}
          {x === SHAFT.spareX && sel === 'fs-riser' ? null : (
            <>
              <Firestop x={x - 3.6} y={SLAB.y - 4.4} w={7.2} h={2.4} />
              <Firestop x={x - 3.6} y={SLAB.y + SLAB.h + 2} w={7.2} h={2.4} />
            </>
          )}
        </G>
      ))}
      <JacketPath d={`M${SHAFT.cableX} ${SLAB.y - 5} V${SLAB.y + SLAB.h + 5}`} color="#37d97b" width={2.4} shadow={false} />
      <Callout x={296} y={12} text="STACKED RISER" size={9.6} color="#9ea3ad" bg={null} anchor="end" />
      <Callout x={296} y={29} text="SLEEVES + FIRESTOP" size={9.6} color="#ff8a6b" bg={null} anchor="end" />
      <Lead x1={297} y1={26} x2={SHAFT.spareX - 3.5} y2={SLAB.y - 3} color="#ff8a6b" />
      <Callout x={SHAFT.cableX - 5} y={180} text="CMR" size={9.6} color="#9ea3ad" bg="rgba(17,18,22,0.92)" />
      {/* the riser-room wall sleeve where a route from the office side enters */}
      <Rect x={SHAFT.x0 - 3} y={SLEEVE.cy - 3} width={SHAFT.wall + 6} height={6} fill="#80868f" stroke="#2c2f34" strokeWidth={0.5} />
      <Firestop x={SHAFT.x0 - 4.4} y={SLEEVE.cy - 3.6} w={1.6} h={7.2} />
      <Firestop x={SHAFT.x0 + SHAFT.wall + 2.8} y={SLEEVE.cy - 3.6} w={1.6} h={7.2} />

      {/* ── the suspended ceilings, hung from the slab (wires at 1.2 m,
          tees at 0.6 m); a cut-out above the rack where its cables rise ── */}
      <CeilingCut x0={8} x1={RATED.x - 0.5} y={TILE_Y} m={BM} hangTo={CAV_TOP} opening={[DROP.x0 - 2, DROP.x1 + 2]} />
      <CeilingCut x0={wallR + 0.5} x1={SHAFT.x0 - 0.5} y={TILE_Y} m={BM} hangTo={CAV_TOP} />

      {/* ── SPACE 2 wash: over the open office the cavity itself carries the
          return air ── */}
      <Rect x={wallR + 0.6} y={CAV_TOP + 0.6} width={SHAFT.x0 - wallR - 1.2} height={TILE_Y - CAV_TOP - 3} fill={AIR} fillOpacity={sel === 'fs-plenum' ? 0.13 : 0.07} />

      {/* ── SPACE 1 · store + equipment-room cavity: the return air is
          DUCTED — a grille with its own duct back to the air handler ── */}
      <DuctSide x0={8} x1={150} y={51} h={10} m={BM} hangTo={CAV_TOP} />
      <Rect x={30} y={61} width={20} height={TILE_Y - 63} fill="#80858d" stroke="#2c2f34" strokeWidth={0.5} />
      <Grille x0={27} x1={53} />
      <AirArrow x={40} y={96} dir="up" len={12} />
      <AirArrow x={24} y={56} dir="left" len={12} />
      <AirArrow x={146} y={56} dir="left" len={14} />
      <SvgText x={98} y={59.4} fontFamily={fonts.oswaldSemiBold} fontSize={9.6} fill="#1b1c20" textAnchor="middle">
        RETURN DUCT
      </SvgText>
      <LadderTraySide x0={60} x1={RATED.x - 6} y={74} m={BM} rodTo={CAV_TOP} rodEvery={1.5} />
      {/* a short vertical ladder carries the drop from the tray to the rack */}
      <Rect x={DROP.x0} y={74} width={1.4} height={rackTop - 74} fill="#9ba1a8" />
      <Rect x={DROP.x1 - 1.4} y={74} width={1.4} height={rackTop - 74} fill="#9ba1a8" />
      {Array.from({ length: 4 }, (_, i) => 80 + i * 10).map((y) => (
        <Line key={y} x1={DROP.x0} y1={y} x2={DROP.x1} y2={y} stroke="#5d636b" strokeWidth={0.6} />
      ))}
      {/* existing cables: rack → tray → down into the partition to the
          store's outlets */}
      <JacketPath d={`M144 ${rackTop} V71.6 H92 Q87 71.6 87 76 V${TILE_Y - 6}`} color={EXIST_A} width={2} />
      <JacketPath d={`M147.4 ${rackTop} V70 H94 Q89 70 89 75 V${TILE_Y - 6}`} color={EXIST_B} width={2} />
      <Callout x={107} y={88} text="CABLE TRAY" size={9.6} color="#9ea3ad" bg="rgba(17,18,22,0.92)" />
      <Lead x1={107} y1={81} x2={107} y2={74.5} />
      <Callout x={46} y={113} text="AIR STAYS" size={9.6} color={AIR} bg={null} />
      <Callout x={46} y={125} text="IN THE DUCT" size={9.6} color={AIR} bg={null} />

      {/* the non-rated partition: stops just above the ceiling */}
      <StudWallCut x={PART.x} y0={TILE_Y - 8} y1={FLOOR_Y} t={PART.t} />
      <Callout x={45} y={164} text="NON-RATED" size={9.6} color="#9ea3ad" bg={null} />
      <Callout x={45} y={177} text="PARTITION" size={9.6} color="#9ea3ad" bg={null} />
      <Lead x1={66} y1={168} x2={PART.x - 0.5} y2={168} />

      {/* ── SPACE 2 · the open-office cavity: the return grille opens into
          the cavity, the air crosses the open space to the return inlet (a
          duct cut in section — one diagonal = return — its open face toward
          the air) ── */}
      <Rect x={212} y={50} width={20} height={14} fill="#80858d" stroke="#2c2f34" strokeWidth={0.5} />
      <Path d="M212 64 L232 50" stroke="#2c2f34" strokeWidth={0.6} />
      <Path d="M232 50 V64" stroke={AIR} strokeWidth={1.2} strokeDasharray="1.6 1.4" />
      <Grille x0={264} x1={290} />
      <AirArrow x={271} y={96} dir="up" len={11} />
      <AirArrow x={283} y={96} dir="up" len={11} />
      <Path d="M277 82 Q277 60 262 58" stroke={AIR} strokeWidth={1.2} fill="none" strokeDasharray="2 2" />
      <AirArrow x={262} y={58} dir="left" len={24} />
      <Callout x={250} y={113} text="AIR RETURNS" size={9.6} color={AIR} bg={null} />
      <Callout x={250} y={125} text="THROUGH CAVITY" size={9.6} color={AIR} bg={null} />

      {/* ── the MARKED rated wall: slab to slab (head-of-wall joint at the
          slab), studs with two layers of board each face, the rating hatch,
          the sleeve through it ── */}
      <Rect x={RATED.x} y={CAV_TOP} width={RATED.t} height={FLOOR_Y - CAV_TOP} fill="#241416" />
      {[0, board, RATED.t - 2 * board, RATED.t - board].map((dx) => (
        <Rect key={dx} x={RATED.x + dx} y={CAV_TOP} width={board - 0.1} height={FLOOR_Y - CAV_TOP} fill="#d7d4cc" />
      ))}
      <Rect x={RATED.x - 0.6} y={CAV_TOP} width={RATED.t + 1.2} height={1.8} fill="#c8372b" opacity={0.85} />
      <RatedHatch active={flowOn && !flowDone} loops={m.loops} ys={hatch} />
      <Rect x={RATED.x - 4} y={SLEEVE.cy - SLEEVE.h / 2} width={RATED.t + 8} height={SLEEVE.h} fill="#80868f" stroke="#2c2f34" strokeWidth={0.5} />
      {flowStep >= 2 ? (
        /* the penetrant: this run's cable through the sleeve */
        <JacketPath d={`M${RATED.x - 14} ${SLEEVE.cy} H${wallR + 14}`} color="#c77dff" width={2.2} shadow={false} />
      ) : null}
      {flowStep >= 4 ? (
        <G>
          {/* the listed system, installed: firestop both faces */}
          <Firestop x={RATED.x - 5.6} y={SLEEVE.cy - SLEEVE.h / 2 - 1.4} w={1.8} h={SLEEVE.h + 2.8} />
          <Firestop x={wallR + 3.8} y={SLEEVE.cy - SLEEVE.h / 2 - 1.4} w={1.8} h={SLEEVE.h + 2.8} />
        </G>
      ) : null}
      <Callout x={RATED.x - 22} y={57} text="SLEEVE" size={9.6} color="#b9bdc6" bg="rgba(17,18,22,0.92)" />
      <Lead x1={RATED.x - 8} y1={60} x2={RATED.x - 3} y2={SLEEVE.cy - 3} />
      <Rect x={216} y={156} width={70} height={32} rx={3} fill="#1a0f0f" stroke="#ff5a48" strokeWidth={flowStep >= 1 ? 1.4 : 0.8} />
      <Callout x={251} y={169} text="RATED WALL" size={9.6} color="#ff8a6b" bg={null} />
      <Callout x={251} y={182} text="SLAB TO SLAB" size={9.6} color="#ff8a6b" bg={null} />
      <Line x1={216} y1={172} x2={wallR + 0.5} y2={172} stroke="#ff5a48" strokeWidth={0.6} />
      <SleeveMarker on={flowOn} done={flowDone} />

      {/* ── the rack (side section, 2.0 m; front faces the door side) ── */}
      <RackSide x={RACK_X} floorY={FLOOR_Y} m={BM} />
      <Callout x={RACK_X + 20} y={188} text="RACK" size={9.6} color="#9ea3ad" bg="rgba(17,18,22,0.92)" />
      <Callout x={RACK_X - 3} y={150} text="FRONT" size={9.6} color="#8d9199" bg={null} anchor="end" />
      <Path d={`M${RACK_X - 4} 154 H${RACK_X - 34} M${RACK_X - 30} 151.4 L${RACK_X - 34} 154 L${RACK_X - 30} 156.6`} stroke="#8d9199" strokeWidth={0.7} fill="none" />

      {/* room names under the section */}
      <Callout x={45} y={217} text="STORE" size={9.6} color="#8d9199" bg={null} />
      <Callout x={143} y={217} text="EQUIPMENT ROOM" size={9.6} color="#8d9199" bg={null} />
      <Callout x={251} y={217} text="OPEN OFFICE" size={9.6} color="#8d9199" bg={null} />
      <Callout x={322} y={217} text="RISER" size={9.6} color="#8d9199" bg={null} />

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
        render={(w) => <BuildingArt w={w} sel={sel} done={(id) => spaceAns[id] != null} flowOn={spacesDone} flowStep={flowAns.length} flowDone={flowDone} />}
        controls={spaceDock}
      />
      <View style={{ gap: 3 }}>
        <Text style={styles.tintNote}>TRAINING VISUALIZATION — simplified building section, drawn to scale (see the 1 m bar); teaching colors, not field colors.</Text>
        <Text style={styles.tintNote}>• Red-hatched wall = marked rated assembly, slab to slab · plain stud wall = non-rated partition, stops just above the ceiling</Text>
        <Text style={styles.tintNote}>• Cyan arrows = air movement · cyan-washed cavity = the cavity itself carries return air · grey duct = return air kept in a duct</Text>
        <Text style={styles.tintNote}>• Red caps = an installed listed firestop system (lab symbol — real products vary in form and color)</Text>
        <Text style={styles.tintNote}>• Amber dashed = your proposed route · violet = this run’s cable · CMR = riser-rated cable listing · numbers = the three spaces below</Text>
        <Text style={styles.tintNote}>Whether a wall is rated and how a space handles air come from the project drawings — verify with the plans and the AHJ.</Text>
      </View>

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
