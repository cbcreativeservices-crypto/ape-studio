/**
 * CableInstallLabScreen — "Cable Dressing & Installation" (owner brief
 * 2026-08-24): a professional installation-decision lab. 13 stages on the
 * SHARED lab navigation (kit/LabNavBar, owner 2026-09-30: one strip on every
 * step — INTRO, MODULE n / 13, WHAT'S LEFT — CONTENTS from the readout, the
 * myth interstitial intercepting NEXT through `beforeAdvance`; a single
 * ScrollView, ONLY the active stage mounts), with Rule-or-Myth interstitials
 * between stages, a mastery profile, and the field-check reward on
 * completion. The completion stage is the lab's own what's-left end state.
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
import { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GlassButton } from '../../../components/GlassButton';
import { AccuracyNote } from '../../../components/AccuracyNote';
import { useEntitlement } from '../../../features/commercial/EntitlementProvider';
import { markLabUnit, registerLabUnits, useLabCompletion } from '../../../features/lab/labCompletion';
import { colors, fonts } from '../../../theme/tokens';
import { LabHeader, LabNavBar, LabNavProvider, LabNextButton, useLabNav } from '../kit/LabNavBar';
import { useLabEndGuest } from '../kit/LabEndScreen';
import { ciLeftLead, ciSaveNotice, ciSaveState, type CiSaveState } from './completeCopy';
import { RuleOrMythCard, SourceSheet } from './bits';
import { IntroSceneArt } from './introSceneArt';
import {
  Animated,
  Appear,
  CI_MOTION,
  CI_SPRING_UI,
  Stagger,
  cancelAnimation,
  useAnimatedStyle,
  useCiMotion,
  useCountUp,
  useSharedValue,
  withDelay,
  withSpring,
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
// Tablet (owner 2026-09-29): a page of rows/cards - capped at the card column
// and centred instead of stretching rows 990 pt wide. No-op on a phone.
import { cardColumn } from '../../../theme/readingColumn';
import { ScrollLockProvider } from '../scrollLock';

const STEP_KEY = 'ape:ciStep';
const STATE_KEY = 'ape:ciState';
const LAB_KEY = 'af_cable_install' as const;

/** `run` is present only during a REPEAT LAB run: the stages redone THIS run
 *  (bug hunt 2026-09-29). Absent = the run is the banked progress. */
type CiPersisted = { dims: CiDimScores; myths: string[]; run?: string[] };

/** Steps: 0 = intro · 1..13 = stages · 14 = completion. A pending myth
 *  interstitial renders INSTEAD of the target stage until dismissed. */
const INTRO_STEP = 0;
const COMPLETE_STEP = CI_MODULES.length + 1;

export function CableInstallLabScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { entitlement, resolved, isMember } = useEntitlement();
  // The completion screen's save wording (owner 2026-10-01): the shared lab
  // rule (useLabEndGuest) + this lab's own guest reading below. Members are
  // always 'saved' and never see an offer.
  const endGuest = useLabEndGuest();
  // `resolved` REQUIRED (entitlement roll-out 2026-09-11): the provider boots
  // at 'anonymous', and the restore effect below runs on MOUNT — so without it
  // a signed-in user reopening this lab was treated as a guest and dumped back
  // on the first lesson instead of the page they left off on. Unknown ⇒ not a
  // guest; the real guest rule applies the moment the tier is known.
  const noAccountRef = useRef(resolved && entitlement === 'anonymous');
  noAccountRef.current = resolved && entitlement === 'anonymous';

  const [step, setStep] = useState(INTRO_STEP);
  const [dims, setDims] = useState<CiDimScores>({});
  const [shownMyths, setShownMyths] = useState<string[]>([]);
  const [pendingMyth, setPendingMyth] = useState<string | null>(null);
  const [sourceIds, setSourceIds] = useState<string[] | null>(null);
  const [showObjectives, setShowObjectives] = useState(false);
  const [showFieldCheck, setShowFieldCheck] = useState(false);
  const [width, setWidth] = useState(0);
  const [dragLocked, setDragLocked] = useState(false);
  // A slider unmounted mid-drag (stage change) never sends its release —
  // never leave the page unscrollable.
  useEffect(() => setDragLocked(false), [step]);
  const navigatedRef = useRef(false);
  const leavingRef = useRef(false);
  const scrollRef = useRef<ScrollView | null>(null);

  // Local mirror of completed units (we mark + mirror so a stage flips to done
  // synchronously; the mirror is hydrated from labCompletion's per-unit set —
  // replay simply re-runs the module). This is BANKED credit and never shrinks.
  const completedUnitsRef = useRef<Set<string>>(new Set());
  // THIS RUN (bug hunt 2026-09-29): REPEAT LAB used to empty the banked
  // mirror above while the saved per-unit progress stayed full — the counter
  // read 15/15 over empty dots, the completion screen said "13 of 13 stages
  // still to finish" for credit already banked, and reopening the lab turned
  // every dot green again. Dots, resume and what's-left now read this set;
  // it equals the banked set until a Repeat starts a fresh run (persisted in
  // ape:ciState `run` so a reopen keeps the run).
  const runUnitsRef = useRef<Set<string>>(new Set());
  const repeatedRef = useRef(false);
  const [, forceTick] = useState(0);

  const { complete: labComplete, cleared, total } = useLabCompletion(LAB_KEY);
  const clearedUnits = useLabClearedUnits(LAB_KEY);

  useEffect(() => {
    registerLabUnits(LAB_KEY, CI_LAB_UNITS);
  }, []);

  // Resume (guest rule: anonymous users neither restore nor persist).
  // ⛔ WAIT FOR `resolved` (bug pass 3, 2026-09-30; the kit/PagedLab fix):
  // run on mount, the read saw noAccountRef false before the tier was known,
  // so a signed-out device restored the previous account's stage, scores and
  // run. `resolved` flips once, bounded — a signed-in learner is not held.
  useEffect(() => {
    if (!resolved || noAccountRef.current) return;
    let alive = true;
    void (async () => {
      try {
        const [[, rawStep], [, rawState]] = await AsyncStorage.multiGet([STEP_KEY, STATE_KEY]);
        if (!alive || navigatedRef.current) return;
        // Step FIRST (bug hunt 2026-09-29): a corrupt or "null" ape:ciState
        // threw on `st.dims` before the step was restored, so a damaged
        // score blob also lost the learner's place.
        if (rawStep != null) {
          const n = Number(rawStep);
          if (Number.isFinite(n) && n >= 0 && n <= COMPLETE_STEP) setStep(n);
        }
        if (rawState) {
          const st = JSON.parse(rawState) as CiPersisted | null;
          setDims(st?.dims ?? {});
          setShownMyths(Array.isArray(st?.myths) ? st.myths : []);
          if (Array.isArray(st?.run)) {
            repeatedRef.current = true;
            runUnitsRef.current = new Set(st.run);
            forceTick((t) => t + 1);
          }
        }
      } catch {
        /* resume is best-effort */
      }
    })();
    return () => {
      alive = false;
    };
  }, [resolved]);

  const persist = useCallback((nextStep: number, nextDims: CiDimScores, nextMyths: string[]) => {
    if (noAccountRef.current) return;
    const run = repeatedRef.current ? [...runUnitsRef.current] : undefined;
    void AsyncStorage.multiSet([
      [STEP_KEY, String(nextStep)],
      [STATE_KEY, JSON.stringify({ dims: nextDims, myths: nextMyths, run } satisfies CiPersisted)],
    ]).catch(() => {});
  }, []);

  // `nextDims` lets a caller that has just reset the scores persist THOSE —
  // the closure's `dims` is the render-time value, so `setDims({}); goTo(1)`
  // wrote the old scores back to ape:ciState (B-164).
  const goTo = useCallback(
    (n: number, nextDims?: CiDimScores, nextMyths?: string[]) => {
      navigatedRef.current = true;
      setStep(n);
      setPendingMyth(null);
      persist(n, nextDims ?? dims, nextMyths ?? shownMyths);
      scrollRef.current?.scrollTo({ y: 0, animated: false });
    },
    [dims, shownMyths, persist],
  );

  // HYDRATE THE MIRROR ON RESUME (fix 2026-08-28, reworked B-153 2026-09-02).
  // The 08-28 fix seeded the mirror from the persisted STEP ("being on step n
  // means stages 1…n-1 were cleared") — but the step only records WHERE the
  // user was, not what they cleared: tapping ‹ PREV back to stage 3 and leaving
  // persisted step 3, so stages 4–5 came back locked while the counter read
  // "5 of 15 units complete"; a plain resume on stage 6 had dots 2–5 drawn
  // complete yet disabled and stage 6 announced ", locked". The per-unit set
  // the screen already subscribes to (`clearedUnits`, ape:labProgress) is the
  // truth, so mirror THAT. The step decides only where to land.
  useEffect(() => {
    let added = false;
    for (const u of clearedUnits) {
      if (!completedUnitsRef.current.has(u)) {
        completedUnitsRef.current.add(u);
        added = true;
      }
      // a Repeat run starts empty: banked credit does not pre-fill it
      if (!repeatedRef.current && !runUnitsRef.current.has(u)) {
        runUnitsRef.current.add(u);
        added = true;
      }
    }
    if (added) forceTick((t) => t + 1);
  }, [clearedUnits]);

  // Computed every render (13 Set lookups) rather than memoised: a memo keyed
  // on [cleared, step] kept the pre-hydration value 1 after the mirror was
  // seeded, so the resume landing locked every stage ≥ 2 (B-153).
  let firstIncomplete = COMPLETE_STEP;
  for (let i = 0; i < CI_MODULES.length; i++) {
    if (!runUnitsRef.current.has(CI_MODULES[i].unit)) {
      firstIncomplete = i + 1;
      break;
    }
  }

  /**
   * ⛔ EVERY STAGE IS ALWAYS REACHABLE (owner 2026-09-20, standing rule for
   * ALL labs): "always allow user to scroll through pages without requiring
   * them to finish every detail." The strip's NEXT › and every CONTENTS row
   * are always live; nothing here gates a stage on the one before it.
   *
   * ⚠️ CREDIT IS STILL EARNED, NOT GIVEN. `completedUnits` is untouched; the
   * completion stage lists what is outstanding and links to it. Freedom to
   * move is not the same as freedom from the work, and conflating the two is
   * how you end up either nagging or lying.
   */

  const moduleIdx = step - 1; // 0-based into CI_MODULES when 1..13
  const mod = moduleIdx >= 0 && moduleIdx < CI_MODULES.length ? CI_MODULES[moduleIdx] : null;

  /** Checkpoint scores (H-2b): merge and persist WITHOUT completing the unit. */
  const onModuleDims = useCallback(
    (newDims: CiDimScores) => {
      const merged = mergeDims(dims, newDims);
      setDims(merged);
      persist(step, merged, shownMyths);
    },
    [dims, step, shownMyths, persist],
  );

  const onModuleComplete = useCallback(
    (newDims?: CiDimScores) => {
      if (!mod) return;
      if (!completedUnitsRef.current.has(mod.unit)) {
        completedUnitsRef.current.add(mod.unit);
        markLabUnit(LAB_KEY, mod.unit);
      }
      runUnitsRef.current.add(mod.unit);
      const merged = newDims ? mergeDims(dims, newDims) : dims;
      setDims(merged);
      persist(step, merged, shownMyths);
      forceTick((t) => t + 1);
    },
    [mod, dims, step, shownMyths, persist],
  );

  const openSources = useCallback((ids: string[]) => setSourceIds(ids), []);

  /**
   * NEXT › / FINISH › from the shared strip (and the in-flow button) land
   * here first. 'consumed' = the myth interstitial took the tap: between two
   * stages (spec §25), once a stage's unit is done, one un-shown myth renders
   * INSTEAD of the next stage — one per boundary, never repeated across the
   * lab. While a myth is showing, NEXT › means the same as the card's own
   * continue (B-064: every tap used to swap in the next un-shown myth,
   * recording it as shown, instead of advancing), so it is NOT consumed and
   * the hook moves on to the stage the myth was holding.
   */
  const beforeAdvance = useCallback(
    (from: number) => {
      if (pendingMyth || from < 0) return;
      if (mod && runUnitsRef.current.has(mod.unit)) {
        const myth = CI_MYTHS.find((m) => !shownMyths.includes(m.id));
        if (myth && step < CI_MODULES.length) {
          setPendingMyth(myth.id);
          const myths = [...shownMyths, myth.id];
          setShownMyths(myths);
          persist(step, dims, myths);
          scrollRef.current?.scrollTo({ y: 0, animated: false });
          return 'consumed';
        }
      }
    },
    [pendingMyth, mod, shownMyths, step, dims, persist],
  );

  /** REPEAT LAB (completion stage) and the CONTENTS reset: a fresh RUN, not a
   *  wipe of banked credit (see runUnitsRef). */
  const repeatLab = useCallback(() => {
    repeatedRef.current = true;
    runUnitsRef.current = new Set();
    setDims({});
    setShownMyths([]);
    goTo(1, {}, []);
  }, [goTo]);

  // The shared strip (kit/LabNavBar): step 0 is the INTRO (index -1), the
  // stages are MODULE 1–13, the completion stage is the end state (WHAT'S
  // LEFT, NEXT's slot empty). CONTENTS ✓ reads THIS RUN (runUnitsRef), as the
  // what's-left list does; `forceTick` re-renders it when a unit lands.
  const navUnits = CI_MODULES.map((m) => {
    const done = runUnitsRef.current.has(m.unit);
    return { id: m.id, title: m.title, done };
  });
  const ending = step === COMPLETE_STEP;
  const navGo = useCallback((i: number) => goTo(i + 1), [goTo]);
  const finish = useCallback(() => goTo(COMPLETE_STEP), [goTo]);
  const unEnd = useCallback(() => goTo(CI_MODULES.length), [goTo]);
  const nav = useLabNav({
    units: navUnits,
    index: ending ? CI_MODULES.length - 1 : step - 1,
    ending,
    intro: true,
    go: navGo,
    beforeAdvance,
    finish,
    unEnd,
    reset: { label: 'REPEAT LAB (PRACTICE)', run: repeatLab },
  });

  const modDone = mod ? runUnitsRef.current.has(mod.unit) : false;
  /** The per-unit set a scene resumes from. During a Repeat run the scenes
   *  start fresh (InspectScene would otherwise jump straight to its quiz). */
  const sceneClearedUnits = repeatedRef.current ? undefined : clearedUnits;
  const Body = mod ? MODULE_BODIES[mod.id] : null;
  const myth = pendingMyth ? CI_MYTHS.find((m) => m.id === pendingMyth) : null;
  /** A rack-layout stage (display pinned, well scrolls, dock at the bottom):
   *  it gets the full height and no ScrollView of ours; its well appends the
   *  in-flow NEXT itself (RackUnit under LabNavProvider). */
  const rackStage = !!(mod && Body && mod.rack && !myth);

  return (
    <LabNavProvider value={nav}>
    <View style={[styles.root, { paddingTop: insets.top + 10 }]}>
      <LabHeader title={CI_TITLE.toUpperCase()} subtitle={CI_SUBTITLE} right={<AccuracyNote compact />} />
      <LabNavBar nav={nav} />

      {rackStage && mod && Body ? (
        <View style={styles.rackFill}>
          <Body
            key={mod.id}
            width={width}
            completed={modDone}
            onComplete={onModuleComplete}
            onDims={onModuleDims}
            openSources={openSources}
            clearedUnits={sceneClearedUnits}
            head={{ tag: mod.tag, title: mod.title, intro: mod.intro }}
          />
        </View>
      ) : (
      // Drag-vs-scroll lock (bug hunt 2026-09-30): the Mech / Label / EMI
      // DragSliders lock through ScrollLockCtx, and this host provided none, so
      // a slightly diagonal drag scrolled the page instead of the slider.
      <ScrollView ref={scrollRef} contentContainerStyle={[styles.scroll, cardColumn]} keyboardShouldPersistTaps="handled" scrollEnabled={!dragLocked}>
        <ScrollLockProvider value={setDragLocked}>
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
              // A finished run's START LAB starts at stage 1, not the last
              // stage (bug hunt 2026-09-30).
              onStart={() => goTo(firstIncomplete <= CI_MODULES.length ? firstIncomplete : 1)}
              resumeLabel={firstIncomplete > 1 && firstIncomplete <= CI_MODULES.length ? `RESUME — MODULE ${firstIncomplete}` : null}
              progressLine={`${cleared} of ${total} units complete`}
              onSources={() => setSourceIds(['nec', 'osha', 'bldg_fire', 'ada', 'tia568', 'tia569', 'tia606', 'tia607', 'bicsi_n1', 'bicsi_itsimm', 'bicsi_tdmm', 'avixa_f502_01', 'avixa_f502_02', 'avixa_f501_01', 'avixa_verify', 'aes48', 'iso14763', 'en50174', 'nema_tray', 'mfr_cable', 'mfr_support', 'firestop_listed', 'ufgs'])}
            />
          ) : step === COMPLETE_STEP ? (
            showFieldCheck ? (
              <FieldCheckStage onBack={() => setShowFieldCheck(false)} />
            ) : (
              <CompleteStage
                dims={dims}
                outstanding={CI_MODULES.map((m, i) => ({
                  ...m,
                  step: i + 1,
                  banked: completedUnitsRef.current.has(m.unit),
                })).filter((m) => !runUnitsRef.current.has(m.unit))}
                onGoToStage={(n) => goTo(n)}
                onFieldCheck={() => setShowFieldCheck(true)}
                canReview={weakestDim(dims) != null}
                onReview={() => {
                  const worst = weakestDim(dims);
                  // Nothing below 80 → nothing to review (bug hunt 2026-09-29:
                  // a null weakest dim fell through to 'route').
                  if (!worst) return;
                  const target = worst === 'documentation' ? 'label' : worst === 'serviceability' ? 'rack' : worst === 'protection' ? 'mech' : worst === 'safety' ? 'floor' : worst === 'signal' ? 'emi' : 'route';
                  const idx = CI_MODULES.findIndex((m) => m.id === target);
                  goTo(idx + 1);
                }}
                onRepeat={repeatLab}
                saveState={ciSaveState({ endGuest, noAccount: noAccountRef.current, isMember })}
                // In-flow buttons, not a popup — so a straight navigate (no
                // afterDialogCloses wait). Paywall is a modal over the lab:
                // the lab stays underneath and is never blocked. Paywall
                // itself sends a guest to Auth to create the account first.
                onJoin={() => (navigation as unknown as { navigate: (r: 'Paywall') => void }).navigate('Paywall')}
                onSignIn={() => (navigation as unknown as { navigate: (r: 'Auth') => void }).navigate('Auth')}
                // One exit (bug hunt 2026-09-30 pass 2): a doubled RETURN ran
                // goBack() twice and popped the screen under the lab too.
                onReturn={() => {
                  if (leavingRef.current) return;
                  leavingRef.current = true;
                  navigation.goBack();
                }}
              />
            )
          ) : mod && Body ? (
            <Appear key={mod.id} style={{ gap: 10 }}>
              <Text style={styles.stageTag}>{mod.tag}</Text>
              <Text style={styles.stageTitle}>{mod.title}</Text>
              <Text style={styles.stageIntro}>{mod.intro}</Text>
              {width > 0 ? (
                <Body width={width} completed={modDone} onComplete={onModuleComplete} onDims={onModuleDims} openSources={openSources} clearedUnits={sceneClearedUnits} />
              ) : null}
            </Appear>
          ) : null}
        </View>

        {/* The in-flow NEXT / FINISH at the end of a stage. The intro has its
            own START LAB, the myth card its own continue, and the completion
            stage is the end state (LabNextButton draws nothing there). */}
        {step > INTRO_STEP && step < COMPLETE_STEP && !myth ? <LabNextButton nav={nav} /> : null}
        </ScrollLockProvider>
      </ScrollView>
      )}

      <SourceSheet sourceIds={sourceIds} onClose={() => setSourceIds(null)} />
    </View>
    </LabNavProvider>
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
  outstanding,
  onGoToStage,
  onFieldCheck,
  canReview,
  onReview,
  onRepeat,
  onReturn,
  saveState,
  onJoin,
  onSignIn,
}: {
  dims: CiDimScores;
  /** Stages not yet completed THIS RUN. Empty = the run is finished.
   *  `banked` = its credit is already saved (a Repeat run). */
  outstanding: { id: string; title: string; step: number; banked: boolean }[];
  onGoToStage: (step: number) => void;
  onFieldCheck: () => void;
  /** False when no dimension is below 80 — there is nothing to review. */
  canReview: boolean;
  onReview: () => void;
  onRepeat: () => void;
  onReturn: () => void;
  /** Whether this run is really saved (completeCopy.ts). */
  saveState: CiSaveState;
  /** Open membership (Paywall). */
  onJoin: () => void;
  /** Guest only: an existing member signs in (Auth). */
  onSignIn: () => void;
}) {
  /**
   * Now that every stage is reachable at any time (owner 2026-09-20), a
   * learner can arrive here having skipped work — so this screen must be able
   * to say so. It states what is left and links straight to it, instead of
   * congratulating someone for a lab they have not finished.
   */
  const done = outstanding.length === 0;
  // Word the list by credit (bug hunt 2026-09-29): after REPEAT LAB the
  // stages are unplayed THIS RUN but already credited — "still to finish
  // before this lab counts toward your credit" was false for them.
  const unbanked = outstanding.filter((m) => !m.banked).length;
  const replayOnly = outstanding.length - unbanked;
  // Nothing is kept for a guest or a preview — never tell them it is.
  const saved = saveState === 'saved';
  const notice = ciSaveNotice(saveState);
  return (
    <View style={{ gap: 14 }}>
      <Text style={styles.completeTitle}>
        CABLE DRESSING & INSTALLATION — {done ? 'COMPLETE' : 'WHAT IS LEFT'}
      </Text>
      {done ? (
        <Text style={styles.introLead}>
          You demonstrated professional decision-making in cable routing, mechanical protection, pathways and supports,
          rack dressing, floor and overhead installations, identification and documentation, and final inspection.
        </Text>
      ) : (
        <>
          <Text style={styles.introLead}>
            {ciLeftLead(saveState, { unbanked, replayOnly, total: CI_MODULES.length })}
          </Text>
          <View style={styles.leftList}>
            {outstanding.map((m) => (
              <Pressable
                key={m.id}
                onPress={() => onGoToStage(m.step)}
                style={styles.leftRow}
                accessibilityRole="button"
                accessibilityLabel={`Go to stage ${m.step}, ${m.title}${saved && m.banked ? ', already credited' : ''}`}
              >
                <Text style={styles.leftStep}>STAGE {m.step}</Text>
                <Text style={styles.leftTitle} numberOfLines={1}>
                  {m.title}
                </Text>
                {saved && m.banked ? <Text style={styles.leftBanked}>CREDITED</Text> : null}
                <Text style={styles.leftGo}>›</Text>
              </Pressable>
            ))}
          </View>
        </>
      )}
      {notice ? (
        <View style={styles.saveNotice} accessibilityRole="summary">
          <Text style={styles.saveNoticeTitle} accessibilityRole="header">
            {notice.title}
          </Text>
          <Text style={styles.saveNoticeBody}>{notice.body}</Text>
          <GlassButton label={notice.join} tint="gold" height={46} fontSize={13} onPress={onJoin} />
          {notice.signIn ? (
            <GlassButton label={notice.signIn} tint="teal" height={44} fontSize={12} onPress={onSignIn} />
          ) : null}
        </View>
      ) : null}
      <MasteryProfile dims={dims} />
      <Appear delay={CI_MOTION.base} style={{ gap: 8 }}>
        <GlassButton label="VIEW FIELD CHECK" tint="green" height={46} fontSize={13} onPress={onFieldCheck} />
        {canReview ? (
          <GlassButton label="REVIEW RESULTS" tint="teal" height={44} fontSize={12.5} onPress={onReview} />
        ) : Object.keys(dims).length > 0 ? (
          <Text style={styles.reviewLine}>Nothing below 80 — no review recommended.</Text>
        ) : null}
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
      <GlassButton label="‹ RETURN TO RESULTS" tint="teal" height={44} fontSize={12.5} onPress={onBack} />
    </View>
  );
}

const styles = StyleSheet.create({
  // Top padding follows the safe area (bug hunt 2026-09-30): a fixed 54 put
  // the back chevron under a Dynamic Island (inset 59-62).
  root: { flex: 1, backgroundColor: colors.screenBg },
  scroll: { padding: 16, paddingBottom: 40, gap: 14 },
  stageTag: { fontFamily: fonts.oswaldSemiBold, fontSize: 11, letterSpacing: 2, color: colors.amberLabel },
  stageTitle: { fontFamily: fonts.oswaldSemiBold, fontSize: 19, letterSpacing: 0.5, color: colors.textPrimary },
  stageIntro: { fontFamily: fonts.barlowRegular, fontSize: 13.5, lineHeight: 19, color: colors.textSecondary },
  /** Rack-layout stage: the RackUnit takes the whole height under the strip. */
  rackFill: { flex: 1 },
  introLead: { fontFamily: fonts.barlowRegular, fontSize: 14, lineHeight: 20.5, color: colors.textSecondary },
  governNote: { fontFamily: fonts.barlowRegular, fontSize: 12, lineHeight: 17, color: colors.textSub, fontStyle: 'italic' },
  progressLine: { fontFamily: fonts.oswaldMedium, fontSize: 12, letterSpacing: 0.6, color: colors.amberLabel },
  objectives: { gap: 6, borderRadius: 10, borderWidth: 1, borderColor: '#26262c', backgroundColor: '#131316', padding: 12 },
  objective: { fontFamily: fonts.barlowMedium, fontSize: 13.5, lineHeight: 19, color: colors.textSecondary },
  sourcesLink: { fontFamily: fonts.oswaldSemiBold, fontSize: 11.5, letterSpacing: 1.2, color: colors.textSub },
  leftList: { gap: 1, borderWidth: 1, borderColor: '#2a2a2e', borderRadius: 10, overflow: 'hidden' },
  leftRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 11, paddingHorizontal: 12, backgroundColor: '#141416' },
  leftStep: { fontFamily: fonts.mono, fontSize: 10, letterSpacing: 1, color: colors.amber, width: 64 },
  leftTitle: { flex: 1, fontFamily: fonts.barlowRegular, fontSize: 14, color: colors.textSecondary },
  leftBanked: { fontFamily: fonts.mono, fontSize: 10, letterSpacing: 1, color: colors.green },
  leftGo: { fontFamily: fonts.oswaldSemiBold, fontSize: 16, color: colors.amber },
  completeTitle: { fontFamily: fonts.oswaldSemiBold, fontSize: 17, letterSpacing: 1, color: colors.green },
  saveNotice: { gap: 10, borderRadius: 12, borderWidth: 1, borderColor: colors.amber, backgroundColor: '#1a1610', padding: 14 },
  saveNoticeTitle: { fontFamily: fonts.oswaldSemiBold, fontSize: 13, letterSpacing: 1.2, color: colors.amber },
  saveNoticeBody: { fontFamily: fonts.barlowRegular, fontSize: 13.5, lineHeight: 19.5, color: colors.textSecondary },
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
