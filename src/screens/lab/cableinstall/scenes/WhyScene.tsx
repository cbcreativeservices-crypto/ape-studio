/**
 * STAGE 1 — Why Cable Dressing Matters (spec §8).
 *
 * THE REFERENCE SCENE for this lab's teaching rhythm (spec §38):
 *   ACTION → RESULT (RuleFeedback) → WHY? (expand) → SOURCE (expand).
 * Six consequences, then the core interaction: "Which installation would you
 * approve?" — four close-ups where the pretty one is wrong, teaching
 * NEAT ≠ CORRECT. Completion: consequences reviewed + the approval call made.
 *
 * Accessibility: every choice is a labeled button (no color-only state, no
 * drag); verdicts are announced; targets ≥44dp.
 */
import { useEffect, useState, type ReactNode } from 'react';
import { AccessibilityInfo, Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Line, Path, Rect } from 'react-native-svg';
import { colors, fonts } from '../../../../theme/tokens';
import { CiSection, RuleFeedback, announceComplete } from '../bits';
import {
  AG,
  ALine,
  APath,
  Appear,
  CI_EASE,
  CI_MOTION,
  Stagger,
  cancelAnimation,
  useAnimatedProps,
  useCiMotion,
  useDrawIn,
  useSharedValue,
  withDelay,
  withRepeat,
  withTiming,
} from '../motion';
import type { CiModuleProps } from '../registry';

const CONSEQUENCES: { id: string; title: string; body: string }[] = [
  { id: 'safety', title: 'SAFETY', body: 'Trip hazards, damaged power cables, falling cable, obstructed access — cable placed wrong hurts people first.' },
  { id: 'reliability', title: 'RELIABILITY', body: 'Poor strain relief, excessive stress and damaged connectors become the intermittent faults that eat entire days.' },
  { id: 'signal', title: 'SIGNAL INTEGRITY', body: 'Interference exposure, deformed twisted pairs, over-bent fiber and careless routing all degrade the thing the cable exists to carry.' },
  { id: 'service', title: 'SERVICEABILITY', body: 'Technicians must identify, trace, disconnect, replace and troubleshoot — dressing decides whether that takes minutes or a shift.' },
  { id: 'mech', title: 'MECHANICAL PROTECTION', body: 'Abrasion, pinch points, crush and unsupported weight damage cable invisibly, from the inside out.' },
  { id: 'work', title: 'PROFESSIONAL WORKMANSHIP', body: 'An installation should be organized, understandable and maintainable — by someone who has never seen it before.' },
];

type ExampleId = 'a' | 'b' | 'c' | 'd';

const EXAMPLES: { id: ExampleId; name: string; caption: string; verdictRule: string; verdict: 'good' | 'bad'; short: string }[] = [
  {
    id: 'a',
    name: 'A — THE SHOWPIECE',
    caption: 'Beautifully symmetrical bundle — cinched so hard the cables have gone oval.',
    verdict: 'bad',
    verdictRule: 'mech-restraint-tension',
    short: 'Gorgeous — and the over-tight restraints are deforming every cable in the loom.',
  },
  {
    id: 'b',
    name: 'B — THE PROFESSIONAL',
    caption: 'Less photogenic: gentle bends, labeled ends, supported weight, reachable connectors.',
    verdict: 'good',
    verdictRule: 'rack-not-max-tight',
    short: 'Approve it. Supported, serviceable, honest geometry — this is what correct looks like.',
  },
  {
    id: 'c',
    name: 'C — THE PILE',
    caption: 'Unsecured cable heaped where it fell.',
    verdict: 'bad',
    verdictRule: 'sup-purpose-built',
    short: 'Nothing is supported, nothing is traceable — this isn\'t an installation yet.',
  },
  {
    id: 'd',
    name: 'D — THE BLOCKADE',
    caption: 'A tidy loom dressed straight across the ventilation grille and the service panel.',
    verdict: 'bad',
    verdictRule: 'rack-airflow',
    short: 'Neat — and it blocks cooling and service access. Tidy in the wrong place is still wrong.',
  },
];

/**
 * Close-up per example — the MOTION tells the story (owner 2026-08-24):
 *   A the cable draws in flawlessly straight… then each tie bites and the
 *     jacket deformation swells under it (the flaw arrives after the beauty)
 *   B draws in with honest curves, supports land, then the labels flip up —
 *     calm, in the order a professional actually works
 *   C dumps in fast and out of order — no plan, no sequence
 *   D the loom sweeps across, then the vent behind it flushes hot and keeps
 *     breathing — the blocked airflow is visible, not stated
 * All primitive-prop animation (see motion.tsx's hard-won rule).
 */
function ExampleArt({ id, w, run }: { id: ExampleId; w: number; run: boolean }) {
  const h = 74;
  const vb = 160;
  const common = { width: w, height: h, viewBox: `0 0 ${vb} 74` } as const;
  const m = useCiMotion();

  if (id === 'a') {
    return (
      <Svg {...common}>
        <Rect x={0} y={0} width={vb} height={74} rx={8} fill="#101014" />
        {[18, 30, 42, 54].map((y, i) => (
          <DrawLine key={y} d={`M8 ${y} H152`} len={148} color="#4fd0e0" width={5} run={run} delay={i * 70} />
        ))}
        {/* ties bite AFTER the loom lands — beauty first, damage second */}
        {[40, 80, 120].map((x, i) => (
          <TieBite key={x} x={x} run={run} delay={CI_MOTION.draw * 0.55 + i * 110} />
        ))}
      </Svg>
    );
  }

  if (id === 'b') {
    return (
      <Svg {...common}>
        <Rect x={0} y={0} width={vb} height={74} rx={8} fill="#101014" />
        {/* supports go in FIRST — the professional order */}
        {[36, 72].map((x, i) => (
          <FadeIn key={x} run={run} delay={i * 90}>
            <Path d={`M${x} 8 v6 a7 7 0 0 0 14 0`} stroke="#6f7378" strokeWidth={1.8} fill="none" />
          </FadeIn>
        ))}
        <DrawLine d="M10 16 H96 C118 16 118 30 118 38 v20" len={150} color="#4fd0e0" width={4.5} run={run} delay={180} />
        <DrawLine d="M10 28 H88 C110 28 112 40 112 46 v12" len={142} color="#37d97b" width={4.5} run={run} delay={260} />
        {/* labels land last, once the run is dressed */}
        {[
          { x: 120, y: 40 },
          { x: 114, y: 52 },
        ].map((l, i) => (
          <FadeIn key={l.y} run={run} delay={CI_MOTION.draw * 0.7 + i * 90}>
            <Rect x={l.x} y={l.y} width={14} height={7} rx={1.5} fill="#26262c" stroke="#6f7378" strokeWidth={0.8} />
          </FadeIn>
        ))}
      </Svg>
    );
  }

  if (id === 'c') {
    return (
      <Svg {...common}>
        <Rect x={0} y={0} width={vb} height={74} rx={8} fill="#101014" />
        <Line x1={10} y1={68} x2={150} y2={68} stroke="#2c2c33" strokeWidth={2} />
        {/* dumped, not routed: both runs arrive at once, fast and unordered */}
        <DrawLine
          d="M14 60 C30 30 44 66 58 44 C70 26 84 66 98 48 C110 34 124 62 146 40"
          len={190}
          color="#4fd0e0"
          width={4}
          run={run}
          delay={0}
          duration={m.d(430)}
        />
        <DrawLine
          d="M20 64 C40 44 52 70 70 54 C88 40 100 68 120 52 C132 44 140 58 150 52"
          len={186}
          color="#37d97b"
          width={4}
          run={run}
          delay={40}
          duration={m.d(400)}
        />
      </Svg>
    );
  }

  return (
    <Svg {...common}>
      <Rect x={0} y={0} width={vb} height={74} rx={8} fill="#101014" />
      <Rect x={96} y={10} width={54} height={54} rx={4} fill="#17171c" stroke="#3a3c42" strokeWidth={1.4} />
      {/* vent slats keep breathing hot once the loom covers them */}
      {[18, 24, 30, 36].map((y, i) => (
        <VentSlat key={y} y={y} run={run} index={i} />
      ))}
      <Rect x={104} y={44} width={38} height={14} rx={2} fill="#101014" stroke="#3a3c42" strokeWidth={1} />
      <DrawLine d="M8 26 H150" len={142} color="#ffd35e" width={5} run={run} delay={120} />
      <DrawLine d="M8 50 H150" len={142} color="#ffd35e" width={5} run={run} delay={200} />
    </Svg>
  );
}

/** A cable that installs itself along its path. */
function DrawLine({
  d,
  len,
  color,
  width,
  run,
  delay = 0,
  duration,
}: {
  d: string;
  len: number;
  color: string;
  width: number;
  run: boolean;
  delay?: number;
  duration?: number;
}) {
  const { animatedProps, dashArray, restOffset } = useDrawIn(len, { run, delay, duration });
  return (
    <APath
      d={d}
      stroke={color}
      strokeWidth={width}
      fill="none"
      strokeLinecap="round"
      strokeDasharray={dashArray}
      strokeDashoffset={restOffset}
      animatedProps={animatedProps}
    />
  );
}

/** The tie bites: the strap snaps down and the jacket swells around it. */
function TieBite({ x, run, delay }: { x: number; run: boolean; delay: number }) {
  const m = useCiMotion();
  const t = useSharedValue(0);
  useEffect(() => {
    cancelAnimation(t);
    if (!run) {
      t.value = 0;
      return;
    }
    t.value = withDelay(m.d(delay), withTiming(1, { duration: m.d(CI_MOTION.settle), easing: CI_EASE.physical }));
    return () => cancelAnimation(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [run, delay, m.reduce]);

  const strap = useAnimatedProps(() => ({ opacity: t.value, strokeWidth: 3 * (0.6 + 0.4 * t.value) }));
  // deformation swells as the strap tightens
  const bulge = useAnimatedProps(() => ({ opacity: t.value, strokeWidth: 1.4 * t.value }));
  return (
    <>
      <ALine x1={x} y1={10} x2={x} y2={64} stroke="#e8e8ea" strokeWidth={3} opacity={0} animatedProps={strap} />
      <APath
        d={`M${x - 7} 36 q7 -7 14 0 q-7 7 -14 0`}
        fill="none"
        stroke="#ff9b8f"
        strokeWidth={1.4}
        opacity={0}
        animatedProps={bulge}
      />
    </>
  );
}

/** A vent slat that flushes hot and keeps breathing while it's blocked. */
function VentSlat({ y, run, index }: { y: number; run: boolean; index: number }) {
  const m = useCiMotion();
  const t = useSharedValue(0);
  useEffect(() => {
    cancelAnimation(t);
    if (!run || !m.loops) {
      t.value = 0;
      return;
    }
    t.value = withDelay(
      CI_MOTION.draw * 0.8 + index * 120,
      withRepeat(withTiming(1, { duration: 1600, easing: CI_EASE.inOut }), -1, true),
    );
    return () => cancelAnimation(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [run, index, m.loops]);
  const p = useAnimatedProps(() => ({ opacity: 0.35 + 0.65 * t.value }));
  return (
    <>
      <Line x1={104} y1={y} x2={142} y2={y} stroke="#3a3c42" strokeWidth={2} />
      <ALine x1={104} y1={y} x2={142} y2={y} stroke="#ff7a5e" strokeWidth={2} opacity={0} animatedProps={p} />
    </>
  );
}

/** Simple opacity entrance for static furniture inside an SVG. */
function FadeIn({ children, run, delay = 0 }: { children: ReactNode; run: boolean; delay?: number }) {
  const m = useCiMotion();
  const t = useSharedValue(run && !m.reduce ? 0 : 1);
  useEffect(() => {
    cancelAnimation(t);
    if (!run) {
      t.value = 0;
      return;
    }
    if (m.reduce) {
      t.value = 1;
      return;
    }
    t.value = withDelay(delay, withTiming(1, { duration: CI_MOTION.base, easing: CI_EASE.out }));
    return () => cancelAnimation(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [run, delay, m.reduce]);
  const p = useAnimatedProps(() => ({ opacity: t.value }));
  return (
    <AG opacity={run && !m.reduce ? 0 : 1} animatedProps={p}>
      {children}
    </AG>
  );
}

export function WhyScene({ width, completed, onComplete, openSources }: CiModuleProps) {
  const [seen, setSeen] = useState<Set<string>>(() => new Set(completed ? CONSEQUENCES.map((c) => c.id) : []));
  const [open, setOpen] = useState<string | null>(null);
  const [pick, setPick] = useState<ExampleId | null>(completed ? 'b' : null);
  // Scored on the FIRST pick; the stage now ENDS on approving the right one
  // (learning pass 2026-08-31 — it used to say "Stage 1 complete." right after
  // telling you your approval was wrong).
  const [firstPick, setFirstPick] = useState<ExampleId | null>(completed ? 'b' : null);
  const [fired, setFired] = useState(completed);

  const consequencesDone = seen.size >= CONSEQUENCES.length;
  // Cables draw themselves in once the cards are mounted (one beat after mount
  // so the first paint is the empty rack, then the install happens).
  const [artRun, setArtRun] = useState(false);
  useEffect(() => {
    const id = setTimeout(() => setArtRun(true), 120);
    return () => clearTimeout(id);
  }, []);
  const artW = Math.max(120, width - 28);

  const choose = (id: ExampleId) => {
    if (pick === 'b') return; // approved — done
    if (firstPick == null) setFirstPick(id);
    setPick(id);
    const right = id === 'b';
    AccessibilityInfo.announceForAccessibility(right ? 'Approved — correct call.' : 'Not the one a professional approves.');
    if (right && consequencesDone && !fired) {
      const scoredRight = (firstPick ?? id) === 'b';
      setFired(true);
      announceComplete('Stage 1 complete.');
      onComplete({ workmanship: scoredRight ? 100 : 60, serviceability: scoredRight ? 90 : 60 });
    }
  };

  return (
    <View style={{ gap: 14 }}>
      <CiSection title="SIX THINGS RIDING ON EVERY RUN — TAP EACH">
        <View style={{ gap: 8 }}>
          {CONSEQUENCES.map((c, ci) => {
            const isOpen = open === c.id;
            const isSeen = seen.has(c.id);
            return (
              <Stagger key={c.id} index={ci}>
              <Pressable
                style={[styles.conseq, isSeen && styles.conseqSeen]}
                onPress={() => {
                  setOpen(isOpen ? null : c.id);
                  setSeen((s) => new Set(s).add(c.id));
                }}
                accessibilityRole="button"
                accessibilityState={{ expanded: isOpen }}
                accessibilityLabel={`${c.title}${isSeen ? ', reviewed' : ''}`}
              >
                <Text style={[styles.conseqTitle, isSeen && { color: colors.green }]}>
                  {isSeen ? '✓ ' : ''}
                  {c.title}
                </Text>
                {isOpen ? <Text style={styles.conseqBody}>{c.body}</Text> : null}
              </Pressable>
              </Stagger>
            );
          })}
        </View>
      </CiSection>

      <CiSection title="WHICH INSTALLATION WOULD YOU APPROVE?">
        <Text style={styles.lead}>
          Four close-ups from the same job. Only one earns a professional sign-off — and it isn’t the prettiest.
        </Text>
        <View style={{ gap: 10 }}>
          {EXAMPLES.map((ex) => {
            const picked = pick === ex.id;
            const revealed = pick != null;
            // After a wrong reveal only the correct install stays tappable.
            const locked = revealed && (pick === 'b' || ex.id !== 'b');
            return (
              <View key={ex.id} style={[styles.example, picked && styles.examplePicked]}>
                <Pressable
                  onPress={() => choose(ex.id)}
                  disabled={locked}
                  accessibilityRole="button"
                  accessibilityState={{ selected: picked, disabled: locked }}
                  accessibilityLabel={`${ex.name}. ${ex.caption}${revealed ? (ex.verdict === 'good' ? '. This is the correct approval.' : '. Not approvable.') : ''}`}
                  style={{ gap: 8 }}
                >
                  <Text style={styles.exampleName}>{ex.name}</Text>
                  <ExampleArt id={ex.id} w={artW} run={artRun} />
                  <Text style={styles.exampleCaption}>{ex.caption}</Text>
                </Pressable>
                {revealed ? (
                  <Appear>
                    <RuleFeedback ruleId={ex.verdictRule} verdict={ex.verdict} short={ex.short} openSources={openSources} />
                  </Appear>
                ) : null}
              </View>
            );
          })}
        </View>
        {pick != null ? (
          <Appear delay={120}>
          <View style={styles.lessonCard}>
            <Text style={styles.lessonHead}>NEAT ≠ CORRECT</Text>
            <Text style={styles.lessonBody}>
              A professional installation must simultaneously satisfy safety, performance, mechanical requirements,
              serviceability, documentation and workmanship. Appearance is a byproduct of doing those six right — never a
              substitute for them.
            </Text>
            {!consequencesDone ? (
              <Text style={styles.pendingNote}>Review all six consequences above to complete this stage.</Text>
            ) : null}
            {pick != null && pick !== 'b' ? (
              <Text style={styles.pendingNote}>Now approve the one that earns sign-off.</Text>
            ) : null}
          </View>
          </Appear>
        ) : null}
        {pick === 'b' && consequencesDone && !fired ? (
          <Pressable
            style={styles.finishBtn}
            onPress={() => {
              setFired(true);
              announceComplete('Stage 1 complete.');
              onComplete({ workmanship: firstPick === 'b' ? 100 : 60, serviceability: firstPick === 'b' ? 90 : 60 });
            }}
            accessibilityRole="button"
            accessibilityLabel="Complete stage one"
          >
            <Text style={styles.finishText}>MARK STAGE COMPLETE ✓</Text>
          </Pressable>
        ) : null}
      </CiSection>
    </View>
  );
}

const styles = StyleSheet.create({
  lead: { fontFamily: fonts.barlowRegular, fontSize: 13.5, lineHeight: 19, color: colors.textSecondary },
  conseq: { borderRadius: 10, borderWidth: 1, borderColor: '#26262c', backgroundColor: '#131316', paddingVertical: 11, paddingHorizontal: 12, gap: 6 },
  conseqSeen: { borderColor: 'rgba(55,224,95,.35)' },
  conseqTitle: { fontFamily: fonts.oswaldSemiBold, fontSize: 12.5, letterSpacing: 1.2, color: colors.textSecondary },
  conseqBody: { fontFamily: fonts.barlowRegular, fontSize: 13, lineHeight: 18.5, color: colors.textSub },
  example: { gap: 8, borderRadius: 12, borderWidth: 1, borderColor: '#26262c', backgroundColor: '#131316', padding: 12 },
  examplePicked: { borderColor: 'rgba(255,198,77,.6)' },
  exampleName: { fontFamily: fonts.oswaldSemiBold, fontSize: 12, letterSpacing: 1.2, color: colors.amberLabel },
  exampleCaption: { fontFamily: fonts.barlowRegular, fontSize: 12.5, lineHeight: 17, color: colors.textSub },
  lessonCard: { gap: 6, borderRadius: 10, borderLeftWidth: 3, borderLeftColor: colors.amber, backgroundColor: '#151310', padding: 12 },
  lessonHead: { fontFamily: fonts.oswaldSemiBold, fontSize: 13, letterSpacing: 1.6, color: colors.amber },
  lessonBody: { fontFamily: fonts.barlowRegular, fontSize: 13, lineHeight: 19, color: colors.textSecondary },
  pendingNote: { fontFamily: fonts.barlowMedium, fontSize: 12.5, color: colors.amberLabel },
  finishBtn: { alignItems: 'center', borderRadius: 10, backgroundColor: colors.green, paddingVertical: 13 },
  finishText: { fontFamily: fonts.oswaldSemiBold, fontSize: 13.5, letterSpacing: 1.2, color: '#0a1a0f' },
});
