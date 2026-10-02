/**
 * AmpModuleScreen — the generic module shell (spec Part 2 preamble): objective
 * → the module's own explanation + interactions → knowledge checks →
 * takeaway → MARK COMPLETE. Progress (visited/done/checks) persists to
 * ape:amp:v1 through the serialized updater; nothing per-frame is ever stored.
 *
 * NAVIGATION is the shared lab strip (kit/LabNavBar, owner 2026-09-30) in
 * sub-step mode: ‹ PREV / NEXT › walk a module's steps and roll over to the
 * previous / next module at the boundaries (a module move is a
 * navigation.replace, as before); the readout "MODULE 3 · STEP 2 / 4 ▾" opens
 * CONTENTS (the module list); FINISH › on the last module opens the what's-
 * left screen. NEXT past the last step BANKS the module first when every
 * check is answered (credit is never lost to the way forward), and the old
 * skip-ahead link is simply NEXT with checks still open. The in-flow
 * "NEXT: <step> ›" at the end of every well is LabNextButton (automatic in a
 * RackUnit well, appended to a read step's document here).
 */
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors, fonts } from '../../../theme/tokens';
import type { RootStackParamList } from '../../../navigation/types';
import { AMP_MODULES, ampModuleById, checksForModule } from '../../../features/amp/ampContent';
import { emptyAmpModule, setAmpSaveBlocked, updateAmpProgress, type AmpProgressState } from '../../../features/amp/ampProgress';
import { ampEndModel } from '../../../features/amp/ampEnd';
import { AMP_MODULE_COMPONENTS, BUILT_MODULE_IDS } from './modules';
import { CheckCard, SectionTitle, TakeawayCard } from './kit';
import { AmpStepHostContext, type AmpStepHost } from './steps';
import { AccuracyNote } from '../../../components/AccuracyNote';
import { LabEndScreen, useLabEndGuest } from '../kit/LabEndScreen';
import { LabHeader, LabNavBar, LabNavProvider, LabNextButton, useLabNav } from '../kit/LabNavBar';
import { useEntitlement } from '../../../features/commercial/EntitlementProvider';
// Tablet (owner 2026-09-29): a reading surface - capped at the reading column
// and centred instead of running 990 pt wide. No-op on a phone.
import { readingColumn } from '../../../theme/readingColumn';
import { safeGoBack } from '../../../lib/safeGoBack';

const LAB_TITLE = 'Amplifier Principles Lab';

export function AmpModuleScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, 'AmpModule'>>();
  const mod = ampModuleById(route.params.id);
  const Component = AMP_MODULE_COMPONENTS[mod.id];
  // HOUSE GUEST RULE (bug hunt 2026-09-30 pass 2): a signed-out guest's
  // progress is neither restored nor written (see ampProgress).
  setAmpSaveBlocked(useLabEndGuest());
  const [checksAnswered, setChecksAnswered] = useState<Record<string, boolean>>({});
  const [done, setDone] = useState(false);
  /** Every module already marked done — the ✓ marks in CONTENTS. */
  const [doneIds, setDoneIds] = useState<ReadonlySet<string>>(() => new Set());
  const [finalSubmitted, setFinalSubmitted] = useState(false);
  // Module 8's own checks ARE its assessment (they sit in the scored final
  // pool); repeating them as "check yourself" on the same screen showed the
  // learner items they had just answered in the final.
  const checks = mod.id === 'apply' ? [] : checksForModule(mod.id);

  // ⛔ WAIT FOR `resolved` (bug pass 3, 2026-09-30; the kit/PagedLab fix):
  // before the tier is known the save-block flag reads false, so a signed-out
  // device restored the previous account's checks — and wrote `visited`.
  const { resolved } = useEntitlement();
  useEffect(() => {
    if (!resolved) return;
    let alive = true;
    void updateAmpProgress((s) => {
      const m = s.modules[mod.id] ?? emptyAmpModule();
      s.modules[mod.id] = { ...m, visited: true };
      s.lastModule = mod.id;
    }).then((s) => {
      if (!alive) return;
      const m = s.modules[mod.id] ?? emptyAmpModule();
      // MERGED, never replaced (bug pass 2026-10-01): this read resolves with
      // the state from BEFORE any check answered or MARK COMPLETE tapped while
      // it was queued, and used to wipe those off the screen (the button
      // came back on a module just banked).
      setDone((d) => d || m.done);
      setDoneIds((prev) => new Set([...prev, ...AMP_MODULES.filter((x) => s.modules[x.id]?.done).map((x) => x.id)]));
      setChecksAnswered((prev) => ({ ...m.checks, ...prev }));
      setFinalSubmitted((f) => f || !!s.final);
    });
    return () => {
      alive = false;
    };
  }, [mod.id, resolved]);

  const onCheck = useCallback(
    (id: string, correct: boolean) => {
      setChecksAnswered((prev) => ({ ...prev, [id]: correct }));
      void updateAmpProgress((s) => {
        const m = s.modules[mod.id] ?? emptyAmpModule();
        s.modules[mod.id] = { ...m, checks: { ...m.checks, [id]: correct } };
      });
    },
    [mod.id],
  );

  const onFinalSubmitted = useCallback(() => setFinalSubmitted(true), []);

  // The last module completes only after the final assessment is submitted
  // (spec Part 3 §11); every other module after its checks.
  const needsFinal = mod.id === 'apply' && !finalSubmitted;
  const answeredCount = checks.filter((c) => c.id in checksAnswered).length;
  const allChecksAnswered = answeredCount === checks.length && !needsFinal;

  /**
   * THE LAST MODULE ENDS ON THE WHAT'S-LEFT SCREEN (owner 2026-09-29: "every
   * lab ends with a 'what's left' screen"; keep credit, always allow a redo).
   * FINISH › (and CONTENTS → WHAT'S LEFT) shows LabEndScreen in place with the
   * progress read back from ape:amp:v1 — the modules not yet marked complete
   * and the final assessment (best result — a later retake never un-passes
   * it). PRACTISE AGAIN reopens Module 1 and clears nothing.
   */
  const [endState, setEndState] = useState<AmpProgressState | null>(null);
  // Bumped by every move away from the end screen (night pass 2, 2026-10-01):
  // FINISH then a quick strip tap left the queued read to land afterwards and
  // throw the end screen back over the module just chosen.
  const endReq = useRef(0);
  const showEnd = useCallback(() => {
    const my = ++endReq.current;
    // A no-op mutate: reads the progress queued behind every earlier write.
    void updateAmpProgress(() => {}).then((s) => {
      if (my === endReq.current) setEndState(s);
    });
  }, []);
  const built = useMemo(() => AMP_MODULES.filter((x) => BUILT_MODULE_IDS.includes(x.id)), []);
  const idx = Math.max(0, built.findIndex((x) => x.id === mod.id));

  /** THE CREDIT ACTION: mark this module done. Never navigates — the strip
   *  (or MARK COMPLETE ›, which goes through the strip's NEXT) moves on.
   *  Queued behind every earlier write (checks, Module 8's final) — nothing
   *  is clobbered whichever order the learner did things in. */
  const bank = useCallback(() => {
    setDone(true);
    setDoneIds((prev) => (prev.has(mod.id) ? prev : new Set([...prev, mod.id])));
    void updateAmpProgress((s) => {
      const m = s.modules[mod.id] ?? emptyAmpModule();
      s.modules[mod.id] = { ...m, done: true };
    });
  }, [mod.id]);

  /**
   * RACK REBUILD (owner, TestFlight build 32, 2026-09-30): a module is a run
   * of STEPS (steps.tsx). A rack step pins its rig on the glass with its
   * controls in the dock below; a read step scrolls as a document. The
   * module component stays mounted across steps, the strip under the header
   * moves between them, the objective heads the first step and the checks +
   * takeaway + MARK COMPLETE close the last.
   */
  const [step, setStepRaw] = useState(0);
  const [stepTitles, setStepTitles] = useState<string[]>([]);
  const onSteps = useCallback((t: string[]) => {
    setStepTitles((prev) => (prev.length === t.length && prev.every((x, i) => x === t[i]) ? prev : t));
  }, []);
  const setStep = useCallback((i: number) => setStepRaw(i), []);
  useEffect(() => setStepRaw(0), [mod.id]);
  const stepCount = stepTitles.length;
  const stepIdx = Math.min(step, Math.max(0, stepCount - 1));

  // The shared strip. A module move is a navigation.replace (as before), so
  // the new module mounts fresh at its first step with its own tap lock.
  const go = useCallback(
    (i: number) => {
      endReq.current++;
      setEndState(null);
      const target = built[Math.max(0, Math.min(built.length - 1, i))];
      if (!target) return;
      if (target.id === mod.id) {
        setStepRaw(0);
        return;
      }
      navigation.replace('AmpModule', { id: target.id });
    },
    [built, mod.id, navigation],
  );
  const unEnd = useCallback(() => {
    endReq.current++;
    setEndState(null);
  }, []);
  // NEXT past the last step / FINISH: bank the module first when its checks
  // are all in — the way forward never costs credit. With checks still open
  // it simply moves on (the old skip-ahead link; labs never block navigation).
  const beforeAdvance = useCallback(() => {
    if (allChecksAnswered && !done) bank();
  }, [allChecksAnswered, done, bank]);
  const sub = useMemo(
    () => (stepCount > 1 ? { index: stepIdx, count: stepCount, titles: stepTitles, go: setStep } : undefined),
    [stepCount, stepIdx, stepTitles, setStep],
  );
  const units = useMemo(() => built.map((x) => ({ id: x.id, title: x.title, done: doneIds.has(x.id) })), [built, doneIds]);
  const nav = useLabNav({
    units,
    index: idx,
    ending: !!endState,
    go,
    beforeAdvance,
    finish: showEnd,
    unEnd,
    sub,
  });

  const head = (
    <View style={styles.objective}>
      <Text style={styles.objectiveLabel}>OBJECTIVE</Text>
      <Text style={styles.objectiveText}>{mod.objective}</Text>
    </View>
  );
  const tail = (
    <>
      {checks.length ? (
        <>
          <SectionTitle>CHECK YOURSELF · {answeredCount} OF {checks.length}</SectionTitle>
          {checks.map((c) => (
            <CheckCard key={c.id} check={c} onAnswered={(ok) => onCheck(c.id, ok)} />
          ))}
        </>
      ) : null}

      <TakeawayCard>{mod.takeaway}</TakeawayCard>

      {/* The credit action (was "MARK COMPLETE & CONTINUE ›" — the word
          CONTINUE is retired from navigation, 2026-09-30). It banks the module
          and moves on through the strip's own NEXT, so it is one tap lock and
          one path with the strip. Hidden once the module is banked — the
          header says "completed" and NEXT / FINISH below carry on. */}
      {!done ? (
        <Pressable
          style={[styles.completeBtn, !allChecksAnswered && styles.completeBtnDim]}
          onPress={nav.next}
          disabled={!allChecksAnswered}
          accessibilityRole="button"
          accessibilityState={{ disabled: !allChecksAnswered }}
          aria-disabled={!allChecksAnswered}
          accessibilityLabel={allChecksAnswered ? 'Mark module complete and move on' : needsFinal ? 'Submit the final assessment above to complete the lab' : 'Answer every check above to mark this module complete'}
        >
          <Text style={styles.completeText}>MARK COMPLETE ›</Text>
        </Pressable>
      ) : null}
      {!allChecksAnswered ? (
        <Text style={styles.requirement}>
          {needsFinal
            ? 'Submit the final assessment above to complete the lab.'
            : `Answer the ${checks.length} check${checks.length > 1 ? 's' : ''} above to mark this module complete — a wrong pick is fine, the explanation is the point. NEXT below still moves on; you can come back.`}
        </Text>
      ) : null}
      {/* Labs never block navigation (owner 2026-09-20/29; bug hunt 2026-09-30):
          an unanswered check costs credit, never the way forward — NEXT /
          FINISH (LabNextButton) follows at the end of every well. */}
    </>
  );
  // A READ step's document scroller (reading column on a tablet; the rack
  // steps own their scroll well and get LabNextButton from RackUnit). A read
  // step ends with the same in-flow NEXT / FINISH.
  const readWrap = (body: ReactNode) => (
    <ScrollView contentContainerStyle={[styles.scroll, readingColumn, { paddingBottom: insets.bottom + 28 }]}>
      {body}
      <LabNextButton />
    </ScrollView>
  );
  // Rebuilt per render on purpose: head/tail carry this render's checks. The
  // only effect keyed on it (the module's step report) depends on the stable
  // `onSteps` alone.
  const host: AmpStepHost = { step: stepIdx, setStep, onSteps, head, tail, readWrap };

  let end: ReactNode = null;
  if (endState) {
    // The same builder as the hub's SEE WHAT'S LEFT (features/amp/ampEnd).
    const { units: endUnits, cleared } = ampEndModel(endState, built);
    end = (
      <LabEndScreen
        labTitle={LAB_TITLE}
        units={endUnits}
        cleared={cleared}
        mode="progress"
        onJump={(id) => navigation.replace('AmpModule', { id: id === 'final' ? 'apply' : (id as typeof mod.id) })}
        onPracticeAgain={() => navigation.replace('AmpModule', { id: built[0]?.id ?? mod.id })}
        onDone={() => safeGoBack(navigation)}
        bottomInset
      />
    );
  }

  return (
    <LabNavProvider value={nav}>
      <View style={[styles.root, { paddingTop: insets.top + 10 }]}>
        {/* The shared header: ‹ leaves the lab. The lab HOME carries the
            accuracy note too; a module opened from a deep link or resumed from
            the dashboard never passes through it. */}
        <LabHeader
          title={endState ? LAB_TITLE.toUpperCase() : mod.title.toUpperCase()}
          subtitle={endState ? 'What’s left' : `Module ${mod.num} of ${AMP_MODULES.length}${done ? ' · completed' : ''}`}
          right={
            <AccuracyNote compact detail="This lab MODELS amplifier behaviour on your phone — the numbers and curves are teaching tools, not bench measurements, and any level it plays goes through an UNCALIBRATED output. For real amplifier work use proper test gear." />
          }
        />
        <LabNavBar nav={nav} />
        {end ?? (
          <View style={styles.body}>
            {Component ? (
              <AmpStepHostContext.Provider value={host}>
                <Component onFinalSubmitted={onFinalSubmitted} />
              </AmpStepHostContext.Provider>
            ) : (
              readWrap(<Text style={styles.missing}>This module is not available.</Text>)
            )}
          </View>
        )}
      </View>
    </LabNavProvider>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.screenBg },
  body: { flex: 1 },
  scroll: { paddingHorizontal: 16, gap: 10 },
  objective: { borderLeftWidth: 2, borderLeftColor: colors.amberLabel, paddingLeft: 10, gap: 2 },
  objectiveLabel: { color: colors.amberLabel, fontFamily: fonts.oswaldMedium, fontSize: 10.5, letterSpacing: 2 },
  objectiveText: { color: colors.textPrimary, fontFamily: fonts.barlowMedium, fontSize: 14, lineHeight: 19 },
  missing: { color: colors.textMuted, fontFamily: fonts.barlowRegular, fontSize: 13 },
  completeBtn: {
    marginTop: 8, minHeight: 50, borderRadius: 12, backgroundColor: '#173021', borderWidth: 1, borderColor: colors.green,
    alignItems: 'center', justifyContent: 'center',
  },
  completeBtnDim: { opacity: 0.45 },
  completeText: { color: colors.green, fontFamily: fonts.oswaldSemiBold, fontSize: 15, letterSpacing: 1.5 },
  requirement: { color: colors.textMuted, fontFamily: fonts.barlowRegular, fontSize: 12, textAlign: 'center' },
});
