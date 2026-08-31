/**
 * CableInstallLabScreen — "Cable Dressing & Installation" (owner brief
 * 2026-08-24): a professional installation-decision lab. 13 stages on the
 * stepped-lab shell (CableLab/MicSelect template — hand-rolled header, top
 * nav, dots, single ScrollView, ONLY the active stage mounts), with
 * Rule-or-Myth interstitials between stages, a mastery profile, and the
 * field-check reward on completion.
 *
 * The loop every stage serves: PLAN → ROUTE → SUPPORT → DRESS → PROTECT →
 * TERMINATE → LABEL → INSPECT.
 *
 * Progress: one labCompletion unit per stage + inspect/final-check units
 * (key 'af_cable_install' — queued safely until the backend row is seeded;
 * see docs/APE_CABLE_INSTALL_SEED_2026_08_24.sql). Resume: step persisted at
 * 'ape:ciStep'; dimension scores + shown myths at 'ape:ciState'. Anonymous
 * users neither restore nor persist (house guest rule).
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { GlassButton } from '../../../components/GlassButton';
import { AccuracyNote } from '../../../components/AccuracyNote';
import { useEntitlement } from '../../../features/commercial/EntitlementProvider';
import { markLabUnit, registerLabUnits, useLabCompletion } from '../../../features/lab/labCompletion';
import { colors, fonts } from '../../../theme/tokens';
import { RuleOrMythCard, SourceSheet } from './bits';
import { IntroSceneArt } from './introSceneArt';
import {
  Animated,
  Appear,
  CI_EASE,
  CI_MOTION,
  CI_SPRING_UI,
  Stagger,
  cancelAnimation,
  useAnimatedStyle,
  useCiMotion,
  useCountUp,
  useSharedValue,
  withDelay,
  withSequence,
  withSpring,
  withTiming,
} from './motion';
import { CI_MYTHS } from './data/scenarios';
import { CI_DIMS, CI_DIM_META, masteryBlocks, mergeDims, overallScore, weakestDim, type CiDimScores } from './engine/score';
import { useLabClearedUnits } from '../../../features/lab/labCompletion';
import {
  CI_FIELD_CHECK,
  CI_GOVERN_NOTE,
  CI_LAB_UNITS,
  CI_MODULES,
  CI_OBJECTIVES,
  CI_SUBTITLE,
  CI_TITLE,
  type CiModuleId,
} from './registry';
import { MODULE_BODIES } from './scenes';

const STEP_KEY = 'ape:ciStep';
const STATE_KEY = 'ape:ciState';
const LAB_KEY = 'af_cable_install' as const;

type CiPersisted = { dims: CiDimScores; myths: string[] };

/** Steps: 0 = intro · 1..13 = stages · 14 = completion. A pending myth
 *  interstitial renders INSTEAD of the target stage until dismissed. */
const INTRO_STEP = 0;
const COMPLETE_STEP = CI_MODULES.length + 1;

export function CableInstallLabScreen() {
  const navigation = useNavigation();
  const { entitlement } = useEntitlement();
  const noAccountRef = useRef(entitlement === 'anonymous');
  noAccountRef.current = entitlement === 'anonymous';

  const [step, setStep] = useState(INTRO_STEP);
  const [dims, setDims] = useState<CiDimScores>({});
  const [shownMyths, setShownMyths] = useState<string[]>([]);
  const [pendingMyth, setPendingMyth] = useState<string | null>(null);
  const [sourceIds, setSourceIds] = useState<string[] | null>(null);
  const [showObjectives, setShowObjectives] = useState(false);
  const [showFieldCheck, setShowFieldCheck] = useState(false);
  const [width, setWidth] = useState(0);
  const navigatedRef = useRef(false);
  const scrollRef = useRef<ScrollView | null>(null);

  const { complete: labComplete, cleared, total } = useLabCompletion(LAB_KEY);
  const clearedUnits = useLabClearedUnits(LAB_KEY);

  useEffect(() => {
    registerLabUnits(LAB_KEY, CI_LAB_UNITS);
  }, []);

  // Resume (guest rule: anonymous users neither restore nor persist).
  useEffect(() => {
    if (noAccountRef.current) return;
    let alive = true;
    void (async () => {
      try {
        const [[, rawStep], [, rawState]] = await AsyncStorage.multiGet([STEP_KEY, STATE_KEY]);
        if (!alive || navigatedRef.current) return;
        if (rawState) {
          const st = JSON.parse(rawState) as CiPersisted;
          setDims(st.dims ?? {});
          setShownMyths(st.myths ?? []);
        }
        if (rawStep != null) {
          const n = Number(rawStep);
          if (Number.isFinite(n) && n >= 0 && n <= COMPLETE_STEP) setStep(n);
        }
      } catch {
        /* resume is best-effort */
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const persist = useCallback((nextStep: number, nextDims: CiDimScores, nextMyths: string[]) => {
    if (noAccountRef.current) return;
    void AsyncStorage.multiSet([
      [STEP_KEY, String(nextStep)],
      [STATE_KEY, JSON.stringify({ dims: nextDims, myths: nextMyths } satisfies CiPersisted)],
    ]).catch(() => {});
  }, []);

  const goTo = useCallback(
    (n: number) => {
      navigatedRef.current = true;
      setStep(n);
      setPendingMyth(null);
      persist(n, dims, shownMyths);
      scrollRef.current?.scrollTo({ y: 0, animated: false });
    },
    [dims, shownMyths, persist],
  );

  // Local mirror of completed units (labCompletion doesn't expose per-unit
  // reads; we mark + mirror, and hydrate the mirror from overall progress by
  // trusting persisted step ordering — replay simply re-runs the module).
  const completedUnitsRef = useRef<Set<string>>(new Set());
  const [, forceTick] = useState(0);

  // HYDRATE THE MIRROR ON RESUME (fix 2026-08-28). The comment above always
  // claimed the mirror is seeded "from overall progress by trusting persisted
  // step ordering" — but nothing ever did it, so a resumed session had an EMPTY
  // set: `firstIncomplete` collapsed to 1, `canEnter(n)` was false for every
  // n ≥ 2, and the user landed on stage 6 with dots 2–13 drawn locked and
  // announced ", locked" next to a counter reading "5 of 15 units complete".
  // The intro screen was worse — `resumeLabel` went null, so the button read
  // START LAB and threw the user back to stage 1 under that same counter.
  // Being ON step n means stages 1…n-1 were cleared, which is exactly the
  // ordering the persisted step encodes. Runs once, after resume settles.
  const hydratedRef = useRef(false);
  useEffect(() => {
    if (hydratedRef.current || step <= INTRO_STEP) return;
    hydratedRef.current = true;
    const done = Math.min(step - 1, CI_MODULES.length);
    for (let i = 0; i < done; i++) completedUnitsRef.current.add(CI_MODULES[i].unit);
    if (done > 0) forceTick((t) => t + 1);
  }, [step]);

  const firstIncomplete = useMemo(() => {
    for (let i = 0; i < CI_MODULES.length; i++) {
      if (!completedUnitsRef.current.has(CI_MODULES[i].unit)) return i + 1;
    }
    return COMPLETE_STEP;
  }, [cleared, step]); // eslint-disable-line react-hooks/exhaustive-deps

  const canEnter = useCallback(
    (n: number) => {
      if (n <= INTRO_STEP) return true;
      if (n >= COMPLETE_STEP) return firstIncomplete >= COMPLETE_STEP;
      return n <= firstIncomplete;
    },
    [firstIncomplete],
  );

  const moduleIdx = step - 1; // 0-based into CI_MODULES when 1..13
  const mod = moduleIdx >= 0 && moduleIdx < CI_MODULES.length ? CI_MODULES[moduleIdx] : null;

  const onModuleComplete = useCallback(
    (newDims?: CiDimScores) => {
      if (!mod) return;
      if (!completedUnitsRef.current.has(mod.unit)) {
        completedUnitsRef.current.add(mod.unit);
        markLabUnit(LAB_KEY, mod.unit);
      }
      const merged = newDims ? mergeDims(dims, newDims) : dims;
      setDims(merged);
      persist(step, merged, shownMyths);
      forceTick((t) => t + 1);
    },
    [mod, dims, step, shownMyths, persist],
  );

  const openSources = useCallback((ids: string[]) => setSourceIds(ids), []);

  const next = () => {
    if (step === INTRO_STEP) {
      goTo(1);
      return;
    }
    if (mod && completedUnitsRef.current.has(mod.unit)) {
      // Myth interstitial between stages (spec §25) — one per boundary,
      // never repeated across the lab.
      const myth = CI_MYTHS.find((m) => !shownMyths.includes(m.id));
      if (myth && step < CI_MODULES.length) {
        setPendingMyth(myth.id);
        const myths = [...shownMyths, myth.id];
        setShownMyths(myths);
        persist(step, dims, myths);
        scrollRef.current?.scrollTo({ y: 0, animated: false });
        return;
      }
    }
    goTo(Math.min(COMPLETE_STEP, step + 1));
  };

  const prev = () => goTo(Math.max(INTRO_STEP, step - 1));

  const modDone = mod ? completedUnitsRef.current.has(mod.unit) : false;
  const Body = mod ? MODULE_BODIES[mod.id] : null;
  const myth = pendingMyth ? CI_MYTHS.find((m) => m.id === pendingMyth) : null;

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={10} accessibilityRole="button" accessibilityLabel="Back">
          <Text style={styles.back}>‹</Text>
        </Pressable>
        <View style={{ flexShrink: 1, flexGrow: 1 }}>
          <Text style={styles.title}>{CI_TITLE.toUpperCase()}</Text>
          <Text style={styles.subtitle}>{CI_SUBTITLE}</Text>
        </View>
        <AccuracyNote compact />
      </View>

      {step > INTRO_STEP && step < COMPLETE_STEP ? (
        <>
          <View style={styles.topNav}>
            <Pressable onPress={() => goTo(INTRO_STEP)} hitSlop={8} accessibilityRole="button" accessibilityLabel="Lab start">
              <Text style={styles.navBtn}>⏮ START</Text>
            </Pressable>
            <Pressable onPress={prev} hitSlop={8} accessibilityRole="button" accessibilityLabel="Previous stage">
              <Text style={styles.navBtn}>‹ PREV</Text>
            </Pressable>
            <View style={{ flex: 1 }} />
            <Text style={styles.navPos}>
              STAGE {step} / {CI_MODULES.length}
            </Text>
            <View style={{ flex: 1 }} />
            <Pressable
              onPress={next}
              hitSlop={8}
              disabled={!modDone && !canEnter(step + 1)}
              accessibilityRole="button"
              accessibilityLabel="Next stage"
            >
              <Text style={[styles.navBtn, !modDone && !canEnter(step + 1) && styles.navBtnDisabled]}>NEXT ›</Text>
            </Pressable>
          </View>
          <View style={styles.dotsRow} accessibilityLabel={`${cleared} of ${total} units complete`}>
            {CI_MODULES.map((m, i) => {
              const n = i + 1;
              const done = completedUnitsRef.current.has(m.unit);
              const active = n === step;
              const enterable = canEnter(n);
              return (
                <Pressable
                  key={m.id}
                  onPress={() => enterable && goTo(n)}
                  disabled={!enterable}
                  hitSlop={6}
                  accessibilityRole="button"
                  accessibilityState={{ selected: active, disabled: !enterable }}
                  accessibilityLabel={`${m.title}${done ? ', complete' : enterable ? '' : ', locked'}`}
                >
                  <ProgressDot done={done} active={active} enterable={enterable} />
                </Pressable>
              );
            })}
            <Text style={styles.dotsCount}>
              {cleared}/{total} units
            </Text>
          </View>
        </>
      ) : null}

      <ScrollView ref={scrollRef} contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View onLayout={(e) => setWidth(Math.round(e.nativeEvent.layout.width))}>
          {myth ? (
            <Appear key={myth.id}>
              <RuleOrMythCard myth={myth} onDone={() => goTo(step + 1)} openSources={openSources} />
            </Appear>
          ) : step === INTRO_STEP ? (
            <IntroStage
              width={width}
              started={firstIncomplete > 1 || cleared > 0}
              showObjectives={showObjectives}
              onToggleObjectives={() => setShowObjectives((o) => !o)}
              onStart={() => goTo(Math.min(firstIncomplete, CI_MODULES.length))}
              resumeLabel={firstIncomplete > 1 && firstIncomplete <= CI_MODULES.length ? `CONTINUE — STAGE ${firstIncomplete}` : null}
              progressLine={`${cleared} of ${total} units complete`}
              onSources={() => setSourceIds(['nec', 'osha', 'bldg_fire', 'ada', 'tia568', 'tia569', 'tia606', 'tia607', 'bicsi_n1', 'bicsi_itsimm', 'bicsi_tdmm', 'avixa_f502_01', 'avixa_f502_02', 'avixa_f501_01', 'avixa_verify', 'aes48', 'iso14763', 'en50174', 'nema_tray', 'mfr_cable', 'mfr_support', 'firestop_listed', 'ufgs'])}
            />
          ) : step === COMPLETE_STEP ? (
            showFieldCheck ? (
              <FieldCheckStage onBack={() => setShowFieldCheck(false)} />
            ) : (
              <CompleteStage
                dims={dims}
                onFieldCheck={() => setShowFieldCheck(true)}
                onReview={() => {
                  const worst = weakestDim(dims);
                  const target = worst === 'documentation' ? 'label' : worst === 'serviceability' ? 'rack' : worst === 'protection' ? 'mech' : worst === 'safety' ? 'floor' : worst === 'signal' ? 'emi' : 'route';
                  const idx = CI_MODULES.findIndex((m) => m.id === target);
                  goTo(idx + 1);
                }}
                onRepeat={() => {
                  completedUnitsRef.current = new Set();
                  setDims({});
                  goTo(1);
                }}
                onReturn={() => navigation.goBack()}
              />
            )
          ) : mod && Body ? (
            <Appear key={mod.id} style={{ gap: 10 }}>
              <Text style={styles.stageTag}>{mod.tag}</Text>
              <Text style={styles.stageTitle}>{mod.title}</Text>
              <Text style={styles.stageIntro}>{mod.intro}</Text>
              {width > 0 ? (
                <Body width={width} completed={modDone} onComplete={onModuleComplete} openSources={openSources} clearedUnits={clearedUnits} />
              ) : null}
            </Appear>
          ) : null}
        </View>

        {step > INTRO_STEP && step < COMPLETE_STEP && !myth ? (
          <View style={styles.bottomNav}>
            {/* flex wrappers (design pass 2026-08-31): the buttons rendered
                content-width — BACK was a ~40pt-wide chiclet. */}
            <View style={{ flex: 1 }}>
              <GlassButton label="‹ BACK" tint="teal" height={44} fontSize={13} onPress={prev} />
            </View>
            <View style={{ flex: 2 }}>
              <GlassButton
                label={step === CI_MODULES.length ? (labComplete ? 'FINISH ✓' : modDone ? 'FINISH ✓' : 'COMPLETE THE STAGE') : modDone ? 'NEXT ›' : 'COMPLETE THE STAGE'}
                tint={modDone ? 'green' : 'gold'}
                height={44}
                fontSize={13}
                onPress={modDone ? next : undefined}
                disabled={!modDone}
              />
            </View>
          </View>
        ) : null}
      </ScrollView>

      <SourceSheet sourceIds={sourceIds} onClose={() => setSourceIds(null)} />
    </View>
  );
}

/* ── intro stage (spec §7) ──────────────────────────────────────────────── */
function IntroStage({
  width,
  started,
  showObjectives,
  onToggleObjectives,
  onStart,
  resumeLabel,
  progressLine,
  onSources,
}: {
  width: number;
  started: boolean;
  showObjectives: boolean;
  onToggleObjectives: () => void;
  onStart: () => void;
  resumeLabel: string | null;
  progressLine: string;
  onSources: () => void;
}) {
  return (
    <View style={{ gap: 14 }}>
      {width > 40 ? <IntroScene w={width} /> : null}
      <Text style={styles.introLead}>
        Professional cable installation is not “make the wires look neat.” It is planning the route, using the correct
        pathway, supporting and protecting the cable, respecting its physical limits, controlling its relationship to
        other systems, preserving serviceability, identifying everything — and verifying the finished installation.
      </Text>
      <Text style={styles.governNote}>{CI_GOVERN_NOTE}</Text>
      <View style={{ gap: 10 }}>
        <GlassButton label={resumeLabel ?? 'START LAB'} tint="green" height={48} fontSize={14} onPress={onStart} />
        <GlassButton label="WHAT YOU’LL LEARN" tint="teal" height={44} fontSize={12.5} onPress={onToggleObjectives} />
      </View>
      {started ? <Text style={styles.progressLine}>{progressLine}</Text> : null}
      {showObjectives ? (
        <View style={styles.objectives}>
          {CI_OBJECTIVES.map((o) => (
            <Text key={o} style={styles.objective}>
              •  {o}
            </Text>
          ))}
        </View>
      ) : null}
      <Pressable onPress={onSources} accessibilityRole="button" accessibilityLabel="Sources and standards panel">
        <Text style={styles.sourcesLink}>SOURCES / STANDARDS ›</Text>
      </Pressable>
    </View>
  );
}

/** A progress dot: springs to green with a small pop the moment its stage is
 *  completed, and settles a touch larger while it is the active stage. */
function ProgressDot({ done, active, enterable }: { done: boolean; active: boolean; enterable: boolean }) {
  const m = useCiMotion();
  const pop = useSharedValue(1);
  const ring = useSharedValue(active ? 1.18 : 1);
  const wasDone = useRef(done);
  useEffect(() => {
    if (done && !wasDone.current && !m.reduce) {
      cancelAnimation(pop);
      pop.value = withSequence(withTiming(1.5, { duration: 130, easing: CI_EASE.out }), withSpring(1, CI_SPRING_UI));
    }
    wasDone.current = done;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [done, m.reduce]);
  useEffect(() => {
    if (m.reduce) {
      ring.value = active ? 1.18 : 1;
      return;
    }
    ring.value = withSpring(active ? 1.18 : 1, CI_SPRING_UI);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, m.reduce]);
  const s = useAnimatedStyle(() => ({ transform: [{ scale: pop.value * ring.value }] }));
  return (
    <Animated.View
      style={[styles.dot, done && styles.dotDone, active && styles.dotActive, !enterable && styles.dotLocked, s]}
    />
  );
}

/** The opening scene — several environments in one uncluttered section:
 *  rack, tray, wall pathway, ceiling supports, stage/floor run, conduit,
 *  patch field. Training visualization, drawn honest (cables terminate).
 *  It INSTALLS ITSELF on mount: structure first, then every run pulled in
 *  along its route, in the order the work would actually happen. */
function IntroScene({ w }: { w: number }) {
  const m = useCiMotion();
  const [run, setRun] = useState(false);
  useEffect(() => {
    const id = setTimeout(() => setRun(true), 120);
    return () => clearTimeout(id);
  }, []);
  return <IntroSceneArt w={w} run={run} reduce={m.reduce} />;
}

/* ── completion + field check (spec §43/§44/§62) ────────────────────────── */
/** One mastery block, lighting up in its turn. */
function MasteryBlock({ on, delay, reduce }: { on: boolean; delay: number; reduce: boolean }) {
  const k = useSharedValue(reduce && on ? 1 : 0);
  useEffect(() => {
    cancelAnimation(k);
    if (!on) {
      k.value = 0;
      return;
    }
    if (reduce) {
      k.value = 1;
      return;
    }
    k.value = 0;
    k.value = withDelay(delay, withSpring(1, CI_SPRING_UI));
    return () => cancelAnimation(k);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [on, delay, reduce]);
  const s = useAnimatedStyle(() => ({ opacity: Math.max(0, Math.min(1, k.value)), transform: [{ scale: 0.55 + 0.45 * k.value }] }));
  return (
    <View style={styles.dimBlock}>
      {on ? <Animated.View style={[StyleSheet.absoluteFill, styles.dimBlockOn, s]} /> : null}
    </View>
  );
}

/** The mastery profile: dimensions arrive in sequence, their blocks FILL in
 *  sequence, and the overall score counts up to its value. */
function MasteryProfile({ dims }: { dims: CiDimScores }) {
  const m = useCiMotion();
  const overall = useCountUp(overallScore(dims), CI_MOTION.reveal);
  const rows = CI_DIMS.filter((d) => dims[d] != null);
  const worst = weakestDim(dims);
  return (
    <View style={styles.profileCard}>
      <Text style={styles.profileHead}>MASTERY PROFILE · OVERALL {overall}</Text>
      <View style={{ gap: 7 }}>
        {rows.map((d, ri) => {
          const v = dims[d] ?? 0;
          const blocks = masteryBlocks(v);
          return (
            <Stagger key={d} index={ri} from={8}>
              <View style={styles.dimRow} accessibilityLabel={`${CI_DIM_META[d].label}: ${v} out of 100`}>
                <Text style={styles.dimLabel}>{CI_DIM_META[d].label}</Text>
                <View style={styles.dimBlocks}>
                  {[0, 1, 2, 3, 4].map((i) => (
                    <MasteryBlock key={i} on={i < blocks} delay={ri * 90 + i * 70 + 120} reduce={m.reduce} />
                  ))}
                </View>
                <Text style={styles.dimVal}>{v}</Text>
              </View>
            </Stagger>
          );
        })}
      </View>
      {worst ? <Text style={styles.reviewLine}>Recommended review: {CI_DIM_META[worst].label}</Text> : null}
    </View>
  );
}

function CompleteStage({
  dims,
  onFieldCheck,
  onReview,
  onRepeat,
  onReturn,
}: {
  dims: CiDimScores;
  onFieldCheck: () => void;
  onReview: () => void;
  onRepeat: () => void;
  onReturn: () => void;
}) {
  return (
    <View style={{ gap: 14 }}>
      <Text style={styles.completeTitle}>CABLE DRESSING & INSTALLATION — COMPLETE</Text>
      <Text style={styles.introLead}>
        You demonstrated professional decision-making in cable routing, mechanical protection, pathways and supports,
        rack dressing, floor and overhead installations, identification and documentation, and final inspection.
      </Text>
      <MasteryProfile dims={dims} />
      <Appear delay={CI_MOTION.base} style={{ gap: 8 }}>
        <GlassButton label="VIEW FIELD CHECK" tint="green" height={46} fontSize={13} onPress={onFieldCheck} />
        <GlassButton label="REVIEW RESULTS" tint="teal" height={44} fontSize={12.5} onPress={onReview} />
        <GlassButton label="REPEAT LAB" tint="gold" height={44} fontSize={12.5} onPress={onRepeat} />
        <GlassButton label="RETURN TO TRAINING" tint="teal" height={44} fontSize={12.5} onPress={onReturn} />
      </Appear>
    </View>
  );
}

function FieldCheckStage({ onBack }: { onBack: () => void }) {
  return (
    <View style={{ gap: 12 }}>
      <Text style={styles.completeTitle}>CABLE INSTALLATION FIELD CHECK</Text>
      <Text style={styles.governNote}>
        A training summary — not a substitute for project documents, manufacturer requirements or applicable codes.
      </Text>
      {CI_FIELD_CHECK.map((sec, si) => (
        <Stagger key={sec.title} index={Math.min(si, 5)} style={styles.fieldSec}>
          <Text style={styles.fieldSecTitle}>{sec.title}</Text>
          {sec.items.map((it) => (
            <Text key={it} style={styles.fieldItem}>
              □  {it}
            </Text>
          ))}
        </Stagger>
      ))}
      <GlassButton label="‹ BACK TO RESULTS" tint="teal" height={44} fontSize={12.5} onPress={onBack} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.screenBg, paddingTop: 54 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14, paddingBottom: 8 },
  back: { fontFamily: fonts.oswaldSemiBold, fontSize: 30, color: colors.textSub, marginTop: -4, paddingRight: 2 },
  title: { fontFamily: fonts.oswaldSemiBold, fontSize: 15.5, letterSpacing: 1.1, color: colors.textPrimary },
  subtitle: { fontFamily: fonts.barlowRegular, fontSize: 12, color: colors.textSub, marginTop: 1 },
  topNav: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 16, paddingBottom: 4 },
  navBtn: { fontFamily: fonts.oswaldSemiBold, fontSize: 12.5, letterSpacing: 1, color: colors.amber },
  navBtnDisabled: { color: '#45454d' },
  navPos: { fontFamily: fonts.oswaldSemiBold, fontSize: 11, letterSpacing: 1, color: colors.textSub },
  dotsRow: { flexDirection: 'row', alignItems: 'center', gap: 7, paddingHorizontal: 16, paddingBottom: 6 },
  dot: { width: 9, height: 9, borderRadius: 5, backgroundColor: '#2c2c33' },
  dotDone: { backgroundColor: colors.green },
  dotActive: { borderWidth: 1.5, borderColor: colors.amber },
  dotLocked: { opacity: 0.45 },
  dotsCount: { marginLeft: 6, fontFamily: fonts.mono, fontSize: 11, color: colors.textSub },
  scroll: { padding: 16, paddingBottom: 40, gap: 14 },
  stageTag: { fontFamily: fonts.oswaldSemiBold, fontSize: 11, letterSpacing: 2, color: colors.amberLabel },
  stageTitle: { fontFamily: fonts.oswaldSemiBold, fontSize: 19, letterSpacing: 0.5, color: colors.textPrimary },
  stageIntro: { fontFamily: fonts.barlowRegular, fontSize: 13.5, lineHeight: 19, color: colors.textSecondary },
  bottomNav: { flexDirection: 'row', gap: 10, marginTop: 16 },
  introLead: { fontFamily: fonts.barlowRegular, fontSize: 14, lineHeight: 20.5, color: colors.textSecondary },
  governNote: { fontFamily: fonts.barlowRegular, fontSize: 12, lineHeight: 17, color: colors.textSub, fontStyle: 'italic' },
  progressLine: { fontFamily: fonts.oswaldMedium, fontSize: 12, letterSpacing: 0.6, color: colors.amberLabel },
  objectives: { gap: 6, borderRadius: 10, borderWidth: 1, borderColor: '#26262c', backgroundColor: '#131316', padding: 12 },
  objective: { fontFamily: fonts.barlowMedium, fontSize: 13.5, lineHeight: 19, color: colors.textSecondary },
  sourcesLink: { fontFamily: fonts.oswaldSemiBold, fontSize: 11.5, letterSpacing: 1.2, color: colors.textSub },
  completeTitle: { fontFamily: fonts.oswaldSemiBold, fontSize: 17, letterSpacing: 1, color: colors.green },
  profileCard: { gap: 10, borderRadius: 12, borderWidth: 1, borderColor: '#26262c', backgroundColor: '#131316', padding: 14 },
  profileHead: { fontFamily: fonts.oswaldSemiBold, fontSize: 12, letterSpacing: 1.4, color: colors.amber },
  reviewLine: { fontFamily: fonts.barlowMedium, fontSize: 12.5, color: colors.amberLabel },
  // mastery rows (bits' ScoreBars markup, with the fill animated in sequence)
  dimRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  dimLabel: { flex: 1, fontFamily: fonts.oswaldMedium, fontSize: 12, letterSpacing: 0.4, color: colors.textSecondary },
  dimBlocks: { flexDirection: 'row', gap: 3 },
  dimBlock: { width: 16, height: 10, borderRadius: 2, backgroundColor: '#26262c', overflow: 'hidden' },
  dimBlockOn: { backgroundColor: colors.amber, borderRadius: 2 },
  dimVal: { width: 30, textAlign: 'right', fontFamily: fonts.mono, fontSize: 12, color: colors.amberLabel },
  fieldSec: { gap: 5, borderRadius: 10, borderWidth: 1, borderColor: '#26262c', backgroundColor: '#131316', padding: 12 },
  fieldSecTitle: { fontFamily: fonts.oswaldSemiBold, fontSize: 11.5, letterSpacing: 1.4, color: colors.amber },
  fieldItem: { fontFamily: fonts.barlowRegular, fontSize: 13, lineHeight: 19, color: colors.textSecondary },
});
