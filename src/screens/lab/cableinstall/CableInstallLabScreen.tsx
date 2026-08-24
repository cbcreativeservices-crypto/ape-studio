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
import Svg, { Circle, Line, Path, Rect } from 'react-native-svg';
import { useNavigation } from '@react-navigation/native';
import { GlassButton } from '../../../components/GlassButton';
import { AccuracyNote } from '../../../components/AccuracyNote';
import { useEntitlement } from '../../../features/commercial/EntitlementProvider';
import { markLabUnit, registerLabUnits, useLabCompletion } from '../../../features/lab/labCompletion';
import { colors, fonts } from '../../../theme/tokens';
import { Entrance } from '../cable/lessons/bits';
import { RuleOrMythCard, ScoreBars, SourceSheet } from './bits';
import { CI_MYTHS } from './data/scenarios';
import { CI_DIM_META, mergeDims, overallScore, weakestDim, type CiDimScores } from './engine/score';
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
                  <View style={[styles.dot, done && styles.dotDone, active && styles.dotActive, !enterable && styles.dotLocked]} />
                </Pressable>
              );
            })}
            <Text style={styles.dotsCount}>
              {cleared}/{total}
            </Text>
          </View>
        </>
      ) : null}

      <ScrollView ref={scrollRef} contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View onLayout={(e) => setWidth(Math.round(e.nativeEvent.layout.width))}>
          {myth ? (
            <Entrance>
              <RuleOrMythCard myth={myth} onDone={() => goTo(step + 1)} openSources={openSources} />
            </Entrance>
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
            <Entrance key={mod.id}>
              <View style={{ gap: 10 }}>
                <Text style={styles.stageTag}>{mod.tag}</Text>
                <Text style={styles.stageTitle}>{mod.title}</Text>
                <Text style={styles.stageIntro}>{mod.intro}</Text>
                {width > 0 ? (
                  <Body width={width} completed={modDone} onComplete={onModuleComplete} openSources={openSources} />
                ) : null}
              </View>
            </Entrance>
          ) : null}
        </View>

        {step > INTRO_STEP && step < COMPLETE_STEP && !myth ? (
          <View style={styles.bottomNav}>
            <GlassButton label="‹ BACK" tint="teal" height={44} fontSize={13} onPress={prev} />
            <GlassButton
              label={step === CI_MODULES.length ? (labComplete ? 'FINISH ✓' : modDone ? 'FINISH ✓' : 'COMPLETE THE STAGE') : modDone ? 'NEXT ›' : 'COMPLETE THE STAGE'}
              tint={modDone ? 'green' : 'gold'}
              height={44}
              fontSize={13}
              onPress={modDone ? next : undefined}
              disabled={!modDone}
            />
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

/** The opening scene — several environments in one uncluttered section:
 *  rack, tray, wall pathway, ceiling supports, stage/floor run, conduit,
 *  patch field. Training visualization, drawn honest (cables terminate). */
function IntroScene({ w }: { w: number }) {
  const h = Math.round(w * 0.56);
  return (
    <Svg width={w} height={h} viewBox="0 0 360 200" accessibilityLabel="Installation scene: stage, floor run, wall pathway, ceiling tray and equipment rack">
      <Rect x={0} y={0} width={360} height={200} rx={12} fill="#101014" />
      {/* structure */}
      <Line x1={0} y1={26} x2={360} y2={26} stroke="#2c2c33" strokeWidth={2} />
      <Line x1={0} y1={168} x2={360} y2={168} stroke="#2c2c33" strokeWidth={2} />
      {/* ceiling tray */}
      <Rect x={30} y={30} width={240} height={10} rx={2} fill="none" stroke="#6f7378" strokeWidth={1.6} />
      {[50, 90, 130, 170, 210, 250].map((x) => (
        <Line key={x} x1={x} y1={30} x2={x} y2={40} stroke="#6f7378" strokeWidth={1} />
      ))}
      {/* J-hooks after tray */}
      {[286, 312].map((x) => (
        <Path key={x} d={`M${x} 30 v8 a6 6 0 0 0 12 0`} stroke="#6f7378" strokeWidth={1.6} fill="none" />
      ))}
      {/* network + audio bundle in tray → rack */}
      <Path d="M40 36 H268 M268 36 C300 36 292 38 292 44" stroke="#37d97b" strokeWidth={2.2} fill="none" />
      <Path d="M40 39 H265 M265 39 C298 39 296 42 296 48" stroke="#4fd0e0" strokeWidth={2.2} fill="none" />
      {/* rack */}
      <Rect x={286} y={44} width={58} height={124} rx={4} fill="#17171c" stroke="#3a3c42" strokeWidth={1.5} />
      {[54, 72, 90, 108, 126, 144].map((y) => (
        <Rect key={y} x={291} y={y} width={48} height={12} rx={2} fill="#101014" stroke="#2c2c33" strokeWidth={1} />
      ))}
      {/* patch field dots */}
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <Circle key={i} cx={297 + i * 8} cy={60} r={1.8} fill="#4fd0e0" />
      ))}
      {/* cable entry into rack (from tray drop) */}
      <Path d="M292 44 v10 M296 48 v8" stroke="#37d97b" strokeWidth={2} fill="none" />
      {/* wall plate + raceway on left wall */}
      <Rect x={18} y={96} width={14} height={20} rx={2} fill="#101014" stroke="#6f7378" strokeWidth={1.4} />
      <Rect x={32} y={102} width={92} height={8} rx={2} fill="none" stroke="#6f7378" strokeWidth={1.4} />
      <Path d="M32 106 H124" stroke="#4fd0e0" strokeWidth={2} fill="none" />
      {/* stage riser at left floor */}
      <Rect x={14} y={140} width={90} height={28} rx={3} fill="#141418" stroke="#3a3c42" strokeWidth={1.4} />
      <Rect x={22} y={148} width={18} height={12} rx={2} fill="#101014" stroke="#6f7378" strokeWidth={1.2} />
      {/* stage box → floor run with protector to rack base */}
      <Path d="M40 154 C70 154 70 164 96 164 H180" stroke="#4fd0e0" strokeWidth={2.4} fill="none" />
      <Path d="M180 164 h34" stroke="#4fd0e0" strokeWidth={2.4} fill="none" />
      {/* floor protector over the crossing */}
      <Path d="M176 168 l10 -8 h24 l10 8 z" fill="#26262c" stroke="#6f7378" strokeWidth={1.2} />
      <Path d="M214 164 H286 v-6" stroke="#4fd0e0" strokeWidth={2.4} fill="none" />
      {/* conduit riser to tray at mid wall */}
      <Rect x={130} y={40} width={7} height={128} rx={3} fill="none" stroke="#6f7378" strokeWidth={1.4} />
      {/* power feed (separate, planned) */}
      <Path d="M352 168 v-96 c0 -6 -4 -8 -8 -8 h-4" stroke="#ff5a48" strokeWidth={2.2} fill="none" />
      <Circle cx={338} cy={64} r={2.2} fill="#ff5a48" />
    </Svg>
  );
}

/* ── completion + field check (spec §43/§44/§62) ────────────────────────── */
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
  const worst = weakestDim(dims);
  return (
    <View style={{ gap: 14 }}>
      <Text style={styles.completeTitle}>CABLE DRESSING & INSTALLATION — COMPLETE</Text>
      <Text style={styles.introLead}>
        You demonstrated professional decision-making in cable routing, mechanical protection, pathways and supports,
        rack dressing, floor and overhead installations, identification and documentation, and final inspection.
      </Text>
      <View style={styles.profileCard}>
        <Text style={styles.profileHead}>MASTERY PROFILE · OVERALL {overallScore(dims)}</Text>
        <ScoreBars dims={dims} />
        {worst ? <Text style={styles.reviewLine}>Recommended review: {CI_DIM_META[worst].label}</Text> : null}
      </View>
      <View style={{ gap: 8 }}>
        <GlassButton label="VIEW FIELD CHECK" tint="green" height={46} fontSize={13} onPress={onFieldCheck} />
        <GlassButton label="REVIEW RESULTS" tint="teal" height={44} fontSize={12.5} onPress={onReview} />
        <GlassButton label="REPEAT LAB" tint="gold" height={44} fontSize={12.5} onPress={onRepeat} />
        <GlassButton label="RETURN TO TRAINING" tint="teal" height={44} fontSize={12.5} onPress={onReturn} />
      </View>
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
      {CI_FIELD_CHECK.map((sec) => (
        <View key={sec.title} style={styles.fieldSec}>
          <Text style={styles.fieldSecTitle}>{sec.title}</Text>
          {sec.items.map((it) => (
            <Text key={it} style={styles.fieldItem}>
              □  {it}
            </Text>
          ))}
        </View>
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
  fieldSec: { gap: 5, borderRadius: 10, borderWidth: 1, borderColor: '#26262c', backgroundColor: '#131316', padding: 12 },
  fieldSecTitle: { fontFamily: fonts.oswaldSemiBold, fontSize: 11.5, letterSpacing: 1.4, color: colors.amber },
  fieldItem: { fontFamily: fonts.barlowRegular, fontSize: 13, lineHeight: 19, color: colors.textSecondary },
});
