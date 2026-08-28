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
import Svg, { G, Line, Path, Rect, Text as SvgText } from 'react-native-svg';
import { colors, fonts } from '../../../../theme/tokens';
import { OptionChip, VerdictBanner } from '../../cable/lessons/bits';
import { CiSection, RuleFeedback, SpecCard, announceComplete } from '../bits';
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
        <Path d={d} stroke={colors.amber} strokeWidth={2.4} fill="none" strokeDasharray="6 5" />
      ) : (
        <APath
          d={d}
          stroke={colors.amber}
          strokeWidth={2.4}
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
      {[122, 134, 146, 158, 170, 182, 194, 206].map((y) => (
        <Path key={y} d={`M180 ${y} L188 ${y - 8}`} stroke="#ff5a48" strokeWidth={1} strokeOpacity={0.55} />
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
        x={167}
        y={165}
        width={34}
        height={22}
        rx={5}
        fill="none"
        stroke={done ? colors.green : colors.amber}
        strokeWidth={1.6}
        strokeDasharray={done ? undefined : '4 3'}
      />
      {done ? (
        <ACircle cx={184} cy={176} r={20} fill="none" stroke={colors.green} strokeWidth={1.4} opacity={0.75} animatedProps={ring} />
      ) : (
        <PulseRing cx={184} cy={176} r={15} color={colors.amber} run />
      )}
    </>
  );
}

/** Numbered space marker — springs a touch larger the moment it is identified. */
function SpaceMarker({ cx, cy, n, done, reduce }: { cx: number; cy: number; n: number; done: boolean; reduce: boolean }) {
  const r = useSpringTo(done ? 9.2 : 8, reduce);
  const p = useAnimatedProps(() => ({ r: r.value }));
  const tint = done ? colors.green : colors.amber;
  return (
    <G>
      <ACircle cx={cx} cy={cy} r={done ? 9.2 : 8} fill="#17171c" stroke={tint} strokeWidth={1.5} animatedProps={p} />
      <SvgText x={cx} y={cy + 3} fontSize={8.5} fill={tint} textAnchor="middle">
        {String(n)}
      </SvgText>
    </G>
  );
}

/* ── building-section training visualization ────────────────────────────── */
/** Section: two floors, riser shaft, lower room with a non-rated partition
 *  (tray penetration), a MARKED rated wall (conduit sleeve), suspended
 *  ceiling with a quiet cavity left of the rated wall and an air-handling
 *  space right of it. The building RESPONDS to attention: choosing a space
 *  routes the cable toward it and fades that space's highlight up. */
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
  const h = Math.round(w * 0.62);
  const ROUTES: Record<string, { d: string; len: number; end: [number, number] }> = {
    'fs-cavity': { d: 'M44 182 H60 V133 H126', len: 140, end: [126, 133] },
    'fs-plenum': { d: 'M44 194 H160 V177 H202 V134 H236', len: 260, end: [236, 134] },
    'fs-riser': { d: 'M44 198 H160 V177 H202 V196 H310 V152', len: 360, end: [310, 152] },
  };
  const HL: Record<string, [number, number, number, number]> = {
    'fs-cavity': [86, 113, 92, 41],
    'fs-plenum': [190, 113, 104, 41],
    'fs-riser': [298, 10, 32, 200],
  };
  const MARK: Record<string, [number, number]> = {
    'fs-cavity': [96, 120],
    'fs-plenum': [284, 122],
    'fs-riser': [314, 56],
  };
  const route = sel ? ROUTES[sel] : null;
  const hl = sel ? HL[sel] : null;
  return (
    <Svg
      width={w}
      height={h}
      viewBox="0 0 360 224"
      accessibilityLabel="Building section, training visualization: two floors with a riser shaft on the right. The lower room has a non-rated partition with a cable tray passing through it, a marked fire-rated wall with a conduit sleeve, a quiet ceiling cavity left of the rated wall, and an air-handling ceiling space right of it. Proposed cable routes draw as dashed lines from the rack. All interaction happens in the cards below."
    >
      <Rect x={6} y={8} width={348} height={204} rx={10} fill="#101014" stroke="#2c2c33" strokeWidth={1.5} />

      {/* floor slab between the two floors (opening at the shaft, sleeved) */}
      <Rect x={6} y={100} width={290} height={12} fill="#1c1c22" />
      <Rect x={332} y={100} width={22} height={12} fill="#1c1c22" />
      {[20, 60, 100, 140, 180, 220, 260].map((x) => (
        <Line key={x} x1={x} y1={112} x2={x + 10} y2={100} stroke="#26262c" strokeWidth={1} />
      ))}
      <Rect x={296} y={100} width={12} height={12} fill="#1c1c22" />
      <Rect x={320} y={100} width={12} height={12} fill="#1c1c22" />
      {/* conduit sleeve through the slab (floor penetration) + riser cable */}
      <Rect x={308} y={96} width={12} height={20} rx={2} fill="#101014" stroke="#6f7378" strokeWidth={1.4} />
      <Path d="M314 24 V208" stroke="#37d97b" strokeWidth={2} />

      {/* riser shaft walls (gap low-left = access opening for the route) */}
      <Line x1={296} y1={8} x2={296} y2={190} stroke="#3a3c42" strokeWidth={2} />
      <Line x1={296} y1={202} x2={296} y2={212} stroke="#3a3c42" strokeWidth={2} />
      <Line x1={332} y1={8} x2={332} y2={212} stroke="#3a3c42" strokeWidth={2} />
      <SvgText x={314} y={20} fontSize={6.5} fill="#6f7378" textAnchor="middle">
        RISER
      </SvgText>

      {/* upper floor hint: its own suspended ceiling */}
      <Line x1={12} y1={84} x2={292} y2={84} stroke="#26262c" strokeWidth={1} strokeDasharray="10 4" />

      {/* lower-room suspended ceiling (tile lines, hangers, light, grille) */}
      {[96, 124, 152].map((x) => (
        <Line key={x} x1={x} y1={112} x2={x} y2={128} stroke="#2c2c33" strokeWidth={0.8} />
      ))}
      {[210, 238, 266].map((x) => (
        <Line key={x} x1={x} y1={112} x2={x} y2={152} stroke="#2c2c33" strokeWidth={0.8} />
      ))}
      <Line x1={8} y1={156} x2={76} y2={156} stroke="#3a3c42" strokeWidth={1.6} strokeDasharray="10 3" />
      <Line x1={84} y1={156} x2={180} y2={156} stroke="#3a3c42" strokeWidth={1.6} strokeDasharray="10 3" />
      <Line x1={188} y1={156} x2={296} y2={156} stroke="#3a3c42" strokeWidth={1.6} strokeDasharray="10 3" />
      <Rect x={110} y={150} width={30} height={6} fill="#17171c" stroke="#3a3c42" strokeWidth={1} />
      {/* return grille + air movement (bay right of the rated wall) */}
      <Rect x={244} y={152} width={28} height={8} rx={1.5} fill="#101014" stroke="#6f7378" strokeWidth={1.2} />
      {[154.5, 157].map((y) => (
        <Line key={y} x1={247} y1={y} x2={269} y2={y} stroke="#3a3c42" strokeWidth={0.8} />
      ))}
      <Path d="M258 150 V136 M258 136 l-4 6 M258 136 l4 6" stroke="#4fd0e0" strokeWidth={1.4} fill="none" />
      <Path d="M198 128 h18 m0 0 l-6 -4 m6 4 l-6 4" stroke="#4fd0e0" strokeWidth={1.4} fill="none" />
      <Path d="M206 142 h18 m0 0 l-6 -4 m6 4 l-6 4" stroke="#4fd0e0" strokeWidth={1.4} fill="none" />
      <Path d="M266 130 h18 m0 0 l-6 -4 m6 4 l-6 4" stroke="#4fd0e0" strokeWidth={1.4} fill="none" />

      {/* non-rated partition with a framed tray opening (tray penetration) */}
      <Rect x={76} y={112} width={8} height={12} fill="#1c1c22" stroke="#3a3c42" strokeWidth={1} />
      <Rect x={76} y={142} width={8} height={70} fill="#1c1c22" stroke="#3a3c42" strokeWidth={1} />
      <Rect x={74} y={124} width={12} height={18} rx={2} fill="none" stroke="#6f7378" strokeWidth={1.2} />

      {/* cable tray in the cavity, through the non-rated wall */}
      <Line x1={14} y1={128} x2={170} y2={128} stroke="#6f7378" strokeWidth={1.6} />
      <Line x1={14} y1={138} x2={170} y2={138} stroke="#6f7378" strokeWidth={1.6} />
      {[26, 46, 66, 96, 116, 136, 156].map((x) => (
        <Line key={x} x1={x} y1={128} x2={x} y2={138} stroke="#6f7378" strokeWidth={0.8} />
      ))}
      <Path d="M16 131 H168" stroke="#37d97b" strokeWidth={1.6} />
      <Path d="M16 135 H168" stroke="#4fd0e0" strokeWidth={1.6} />

      {/* MARKED rated wall (hatch + placard) with its conduit sleeve */}
      <Rect x={180} y={112} width={8} height={100} fill="#241416" stroke="#3a3c42" strokeWidth={1} />
      <RatedHatch active={flowOn && !flowDone} loops={m.loops} />
      <Rect x={118} y={158} width={68} height={11} rx={2} fill="#1a0f0f" stroke="#ff5a48" strokeWidth={1} />
      <SvgText x={152} y={166} fontSize={6} fill="#ff8a6b" textAnchor="middle">
        RATED · SEE PLANS
      </SvgText>
      <Rect x={172} y={170} width={24} height={12} rx={3} fill="#101014" stroke="#6f7378" strokeWidth={1.4} />
      <SleeveMarker on={flowOn} done={flowDone} reduce={m.reduce} />

      {/* origin rack in the lower room */}
      <SvgText x={29} y={165} fontSize={5.5} fill="#6f7378" textAnchor="middle">
        RACK
      </SvgText>
      <Rect x={14} y={168} width={30} height={40} rx={3} fill="#17171c" stroke="#3a3c42" strokeWidth={1.4} />
      {[176, 186, 196].map((y) => (
        <Rect key={y} x={18} y={y} width={22} height={7} rx={1.5} fill="#101014" stroke="#2c2c33" strokeWidth={0.8} />
      ))}

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

  return (
    <View style={{ gap: 14 }}>
      <BuildingArt w={width} sel={sel} done={(id) => spaceAns[id] != null} flowOn={spacesDone} flowDone={flowDone} />
      <Text style={styles.tintNote}>
        TRAINING VISUALIZATION — simplified building section; tints are the lab’s teaching colors, not field colors.
        Red-hatched wall = marked rated assembly · plain wall = non-rated partition · numbered markers = the three spaces
        below.
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
                      {s.options.map((opt, oi) => (
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
                    {q.options.map((opt, oi) => (
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
