/**
 * MasteringLabScreen — "Mastering Lab: From Final Mix to Release" (owner
 * build order 2026-10-01). ONE screen, eight modules, each a run of steps
 * (Learn → Listen → Explore → Practice → Review) on the shared lab
 * navigation strip in sub-step mode (kit/LabNavBar, owner 2026-09-30):
 *
 *     ‹ MASTERING LAB                                 ⓘ
 *     [⏮] [‹ PREV]   MODULE 3 · STEP 2 / 5 ▾   [NEXT ›]
 *
 * ‹ PREV / NEXT › walk a module's steps and roll over to the neighbouring
 * module; the readout opens CONTENTS (the eight modules — experienced users
 * jump straight to equipment, workflow or delivery); FINISH › on the last
 * step of Module 8 opens the what's-left screen (owner: every lab ends on
 * one; labs never block navigation).
 *
 * CREDIT: a module banks when every one of its decision scenarios has been
 * answered (Module 8 also needs its QC checklist complete). NEXT past a
 * module's last step banks it first — the way forward never costs credit.
 * Credit is never removed: START OVER (PRACTICE) clears answers and the
 * resume point, keeps `done`. HOUSE GUEST RULE: a signed-out guest or a
 * members-only preview restores nothing and saves nothing; the first load
 * waits for the entitlement tier to be `resolved`.
 *
 * MODELLED ON amp/AmpModuleScreen.tsx (steps + racks), without the per-module
 * route: a module change is a state change on this one screen.
 */
import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, fonts } from '../../../theme/tokens';
import { readingColumn } from '../../../theme/readingColumn';
import { AccuracyNote } from '../../../components/AccuracyNote';
import { confirmDialog } from '../../../lib/confirm';
import { useEntitlement } from '../../../features/commercial/EntitlementProvider';
import { LabEndScreen, useLabEndGuest } from '../kit/LabEndScreen';
import { LabHeader, LabNavBar, LabNavProvider, LabNextButton, useLabNav } from '../kit/LabNavBar';
import { retainSessionStems } from '../mixing/audio/mixAudio';
import { MASTERING_MODULES, masteringModuleById, scenariosForModule, type MasteringModuleId } from './masteringContent';
import { emptyMasteringModule, resetMasteringPractice, setMasteringSaveBlocked, updateMasteringProgress, type MasteringProgressState } from './masteringProgress';
import { MASTERING_MODULE_COMPONENTS } from './modules';
import { StepHostContext, type StepHost } from './steps';
import { TakeawayCard } from './kit';
import { releaseProgramme } from './useMasterPlayback';

export const MASTERING_LAB_TITLE = 'Mastering Lab';
const SUBTITLE = 'From Final Mix to Release';

const ACCURACY_DETAIL =
  'This lab MODELS mastering on your phone. The LISTEN pages render a synthesized session through real offline DSP and measure it with BS.1770-style ESTIMATES, heard through an UNCALIBRATED output; the diagrams are models. Learn the decisions here; master with calibrated monitoring and certified metering.';

export function MasteringLabScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  // The programme render (useMasterPlayback) sums the mixing lab's session
  // stems; keep them resident while the lab is open, release both on close.
  useEffect(() => {
    const release = retainSessionStems();
    return () => {
      release();
      releaseProgramme();
    };
  }, []);

  // HOUSE GUEST RULE: neither restore nor save for a guest / a preview.
  setMasteringSaveBlocked(useLabEndGuest());
  const { resolved } = useEntitlement();

  const [modId, setModId] = useState<MasteringModuleId>('what');
  const [step, setStepRaw] = useState(0);
  const [stepTitles, setStepTitles] = useState<string[]>([]);
  const [answers, setAnswers] = useState<Record<string, boolean>>({});
  const [doneIds, setDoneIds] = useState<ReadonlySet<string>>(() => new Set());
  const [qcComplete, setQcComplete] = useState(false);
  const [endState, setEndState] = useState<MasteringProgressState | null>(null);
  const [loaded, setLoaded] = useState(false);

  const mod = masteringModuleById(modId);
  const idx = MASTERING_MODULES.findIndex((m) => m.id === modId);
  const Component = MASTERING_MODULE_COMPONENTS[mod.id];

  // ⛔ WAIT FOR `resolved` before the first read (the kit/PagedLab fix): the
  // save-block flag reads false until the tier is known.
  useEffect(() => {
    if (!resolved || loaded) return;
    let alive = true;
    void updateMasteringProgress(() => {}).then((s) => {
      if (!alive) return;
      setDoneIds(new Set(MASTERING_MODULES.filter((x) => s.modules[x.id]?.done).map((x) => x.id)));
      if (s.lastModule && MASTERING_MODULES.some((m) => m.id === s.lastModule)) {
        setModId(s.lastModule);
        setAnswers(s.modules[s.lastModule]?.answers ?? {});
        setStepRaw(s.lastStep ?? 0);
      }
      setLoaded(true);
    });
    return () => {
      alive = false;
    };
  }, [resolved, loaded]);

  // Module answers follow the module; the resume point is written on move.
  const openModule = useCallback((id: MasteringModuleId, atStep = 0) => {
    setEndState(null);
    setModId(id);
    setStepRaw(atStep);
    setQcComplete(false);
    void updateMasteringProgress((s) => {
      s.lastModule = id;
      s.lastStep = atStep;
    }).then((s) => setAnswers(s.modules[id]?.answers ?? {}));
  }, []);

  const onAnswered = useCallback(
    (scenarioId: string, correct: boolean) => {
      setAnswers((prev) => ({ ...prev, [scenarioId]: correct }));
      void updateMasteringProgress((s) => {
        const m = s.modules[modId] ?? emptyMasteringModule();
        s.modules[modId] = { ...m, answers: { ...m.answers, [scenarioId]: correct } };
      });
    },
    [modId],
  );

  const scenarios = scenariosForModule(mod.id);
  const answeredCount = scenarios.filter((s) => s.id in answers).length;
  const complete = answeredCount === scenarios.length && (mod.id !== 'project' || qcComplete);
  const done = doneIds.has(mod.id);

  /** THE CREDIT ACTION: bank this module. Never navigates. */
  const bank = useCallback(() => {
    setDoneIds((prev) => (prev.has(modId) ? prev : new Set([...prev, modId])));
    void updateMasteringProgress((s) => {
      const m = s.modules[modId] ?? emptyMasteringModule();
      s.modules[modId] = { ...m, done: true };
    });
  }, [modId]);

  const setStep = useCallback(
    (i: number) => {
      setStepRaw(i);
      void updateMasteringProgress((s) => {
        s.lastStep = i;
      });
    },
    [],
  );
  const onSteps = useCallback((t: string[]) => {
    setStepTitles((prev) => (prev.length === t.length && prev.every((x, i) => x === t[i]) ? prev : t));
  }, []);
  const stepCount = stepTitles.length;
  const stepIdx = Math.min(step, Math.max(0, stepCount - 1));

  const go = useCallback(
    (i: number) => {
      const target = MASTERING_MODULES[Math.max(0, Math.min(MASTERING_MODULES.length - 1, i))];
      if (!target) return;
      if (target.id === modId) {
        setEndState(null);
        setStep(0);
        return;
      }
      openModule(target.id, 0);
    },
    [modId, openModule, setStep],
  );
  const showEnd = useCallback(() => {
    void updateMasteringProgress(() => {}).then(setEndState);
  }, []);
  const unEnd = useCallback(() => setEndState(null), []);
  const beforeAdvance = useCallback(() => {
    if (complete && !done) bank();
  }, [complete, done, bank]);
  const sub = useMemo(
    () => (stepCount > 1 ? { index: stepIdx, count: stepCount, titles: stepTitles, go: setStep } : undefined),
    [stepCount, stepIdx, stepTitles, setStep],
  );
  const units = useMemo(() => MASTERING_MODULES.map((x) => ({ id: x.id, title: x.title, done: doneIds.has(x.id) })), [doneIds]);

  const doReset = () =>
    void resetMasteringPractice().then((s) => {
      setDoneIds(new Set(MASTERING_MODULES.filter((x) => s.modules[x.id]?.done).map((x) => x.id)));
      openModule('what', 0);
    });
  const confirmReset = () => {
    const message = `Starts ${MASTERING_LAB_TITLE} again from Module 1. Credit you have already earned stays.`;
    if (Platform.OS === 'web') {
      const confirm = (globalThis as unknown as { confirm?: (m: string) => boolean }).confirm;
      if (typeof confirm !== 'function' || confirm(`Start a fresh practice run? ${message}`)) doReset();
      return;
    }
    confirmDialog('Start a fresh practice run?', message, 'Start over', doReset);
  };

  const nav = useLabNav({
    units,
    index: Math.max(0, idx),
    ending: !!endState,
    go,
    beforeAdvance,
    finish: showEnd,
    unEnd,
    sub,
    reset: { label: 'START OVER (PRACTICE)', run: confirmReset },
  });

  const head = (
    <View style={styles.objective}>
      <Text style={styles.objectiveLabel}>OBJECTIVE · MODULE {mod.num} OF {MASTERING_MODULES.length}</Text>
      <Text style={styles.objectiveText}>{mod.objective}</Text>
    </View>
  );
  const tail = (
    <>
      <TakeawayCard>{mod.takeaway}</TakeawayCard>
      <Text style={styles.requirement}>
        {done
          ? 'This module is credited. Review it any time — practising never removes credit.'
          : complete
            ? 'Every decision answered — NEXT / FINISH below credits this module and moves on.'
            : mod.id === 'project'
              ? `Credit for this module: answer the ${scenarios.length} track decisions and complete the QC checklist (${answeredCount} of ${scenarios.length} answered). NEXT still moves on; you can come back.`
              : `Credit for this module: answer its ${scenarios.length} decisions on the PRACTICE step (${answeredCount} of ${scenarios.length} so far). A wrong pick is fine — the explanation is the point. NEXT still moves on; you can come back.`}
      </Text>
    </>
  );
  const readWrap = (body: ReactNode) => (
    <ScrollView contentContainerStyle={[styles.scroll, readingColumn, { paddingBottom: insets.bottom + 28 }]}>
      {body}
      <LabNextButton />
    </ScrollView>
  );
  const host: StepHost = { step: stepIdx, setStep, onSteps, head, tail, readWrap };

  let end: ReactNode = null;
  if (endState) {
    const cleared = new Set<string>(MASTERING_MODULES.filter((x) => endState.modules[x.id]?.done).map((x) => x.id));
    end = (
      <LabEndScreen
        labTitle={`${MASTERING_LAB_TITLE}: ${SUBTITLE}`}
        units={MASTERING_MODULES.map((x) => ({ id: x.id, label: x.title, detail: x.id === 'project' ? 'Four track decisions + the QC checklist' : `${scenariosForModule(x.id).length} decisions on the PRACTICE step` }))}
        cleared={cleared}
        mode="progress"
        onJump={(id) => openModule(id as MasteringModuleId, 0)}
        onPracticeAgain={() => openModule('what', 0)}
        onDone={() => navigation.goBack()}
        bottomInset
      />
    );
  }

  return (
    <LabNavProvider value={nav}>
      <View style={[styles.root, { paddingTop: insets.top + 10 }]}>
        <LabHeader
          title={endState ? MASTERING_LAB_TITLE.toUpperCase() : mod.title.toUpperCase()}
          subtitle={endState ? 'What’s left' : `${MASTERING_LAB_TITLE}: ${SUBTITLE}${done ? ' · credited' : ''}`}
          right={<AccuracyNote compact detail={ACCURACY_DETAIL} />}
        />
        <LabNavBar nav={nav} />
        {end ?? (
          <View style={styles.body}>
            <StepHostContext.Provider value={host}>
              <Component key={mod.id} onAnswered={onAnswered} onQcComplete={setQcComplete} />
            </StepHostContext.Provider>
          </View>
        )}
      </View>
    </LabNavProvider>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.screenBg },
  body: { flex: 1 },
  scroll: { paddingHorizontal: 16, paddingTop: 8, gap: 10 },
  objective: { borderLeftWidth: 2, borderLeftColor: colors.amberLabel, paddingLeft: 10, gap: 2 },
  objectiveLabel: { color: colors.amberLabel, fontFamily: fonts.oswaldMedium, fontSize: 10.5, letterSpacing: 2 },
  objectiveText: { color: colors.textPrimary, fontFamily: fonts.barlowMedium, fontSize: 14, lineHeight: 19 },
  requirement: { color: colors.textMuted, fontFamily: fonts.barlowRegular, fontSize: 12, textAlign: 'center', lineHeight: 16 },
});
