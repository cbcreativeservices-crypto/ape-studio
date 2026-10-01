/**
 * CableLabScreen — Cable & Connector Fundamentals (owner spec 2026-08-15).
 * "Identify it. Understand it. Connect it safely."
 *
 * A FREE Audio Fundamentals lab: 9 lessons + virtual cable tester + final
 * system challenge + gated final knowledge check, as a stepped progression
 * on the SHARED lab navigation (kit/LabNavBar, owner 2026-09-30): one strip,
 * CONTENTS from the readout, freely open — COMPLETION is what's gated, via
 * af_cables units in labCompletion. Lesson 12 is this lab's own what's-left
 * screen, so it is the END STATE: the readout reads WHAT'S LEFT and NEXT's
 * slot is empty there.
 *
 * SAFETY-CRITICAL CONTENT AREA (owner mandate 2026-08-15): connector facts
 * render only from the verified data registry (cable/data/*) — see
 * docs/APE_CABLE_LAB_PLAN_2026_08_15.md §9 for the verification protocol.
 *
 * Step position persists device-locally (ape:cableStep); anonymous users
 * never resume nor persist (owner 2026-08-12 guest rule, MicSelect verbatim).
 * Only the ACTIVE lesson's body mounts (perf rule — the connector art never
 * all coexists in the tree).
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useEntitlement } from '../../../features/commercial/EntitlementProvider';
import { registerLabUnits, useLabClearedUnits, useLabCompletion } from '../../../features/lab/labCompletion';
import { colors, fonts } from '../../../theme/tokens';
import { AccuracyNote } from '../../../components/AccuracyNote';
import { LabHeader, LabNavBar, LabNavProvider, LabNextButton, useLabNav } from '../kit/LabNavBar';
import { CABLE_LESSONS, CABLE_UNITS, CORE_QUESTION, LESSON_UNITS } from './data/lessons';
import { CableShellStateCtx, CableStepNavCtx } from './lessons/bits';
import { LESSON_BODIES } from './lessons';
// Tablet (owner 2026-09-29): a page of rows/cards - capped at the card column
// and centred instead of stretching rows 990 pt wide. No-op on a phone.
import { cardColumn } from '../../../theme/readingColumn';

const STEP_KEY = 'ape:cableStep';

export function CableLabScreen() {
  const insets = useSafeAreaInsets();
  const [step, setStep] = useState(0);
  const scrollRef = useRef<ScrollView>(null);

  // Completion wiring (R6c): declare the full unit set on mount so the store
  // knows the target — and can retry a finished-offline completion.
  useEffect(() => {
    registerLabUnits('af_cables', CABLE_UNITS);
  }, []);
  const { cleared, total } = useLabCompletion('af_cables');
  const clearedUnits = useLabClearedUnits('af_cables');
  // Lesson state that must outlive the one mounted lesson (bench / challenge
  // progress — bug hunt 2026-09-29). One object for the screen's lifetime.
  const [lessonState] = useState<Record<string, unknown>>(() => ({}));

  // Guest rule (owner 2026-08-12): anonymous users neither restore nor persist
  // their place — every open starts at the first lesson.
  const { entitlement, resolved } = useEntitlement();
  // `resolved` REQUIRED (entitlement roll-out 2026-09-11): the provider boots
  // at 'anonymous', and the restore effect below runs on MOUNT — so without it
  // a signed-in user reopening this lab was treated as a guest and dumped back
  // on the first lesson instead of the page they left off on. Unknown ⇒ not a
  // guest; the real guest rule applies the moment the tier is known.
  const noAccountRef = useRef(resolved && entitlement === 'anonymous');
  noAccountRef.current = resolved && entitlement === 'anonymous';
  const navigatedRef = useRef(false);

  // ⛔ WAIT FOR `resolved` (bug pass 3, 2026-09-30; the kit/PagedLab fix):
  // a read that landed before the tier was known saw noAccountRef false, so a
  // signed-out device restored the previous account's lesson. `resolved`
  // flips once, bounded — a signed-in learner is not held.
  useEffect(() => {
    if (!resolved) return;
    void AsyncStorage.getItem(STEP_KEY).then((v) => {
      if (navigatedRef.current || noAccountRef.current) return;
      const n = v == null ? NaN : Number(v);
      if (Number.isInteger(n) && n > 0 && n < CABLE_LESSONS.length) setStep(n);
    }).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resolved]);

  const goTo = useCallback((n: number) => {
    navigatedRef.current = true;
    setStep(n);
    scrollRef.current?.scrollTo({ y: 0, animated: false });
    if (!noAccountRef.current) void AsyncStorage.setItem(STEP_KEY, String(n)).catch(() => {});
  }, []);

  const s = CABLE_LESSONS[step];
  const Body = LESSON_BODIES[s.id];
  const last = CABLE_LESSONS.length - 1;

  // The shared strip (kit/LabNavBar). Units = lessons 1–11; lesson 12 (the
  // lab's own what's-left) is the end state. Done = that lesson's units are
  // cleared (LESSON_UNITS) — never "paged past" (bug hunt 2026-09-29).
  const ending = step === last;
  const navUnits = useMemo(
    () =>
      CABLE_LESSONS.slice(0, last).map((st) => {
        const units = LESSON_UNITS[st.id];
        return { id: st.id, title: st.title, done: units.length > 0 && units.every((u) => clearedUnits.has(u)) };
      }),
    [clearedUnits, last],
  );
  const finish = useCallback(() => goTo(last), [goTo, last]);
  const unEnd = useCallback(() => goTo(last - 1), [goTo, last]);
  const nav = useLabNav({
    units: navUnits,
    index: ending ? last - 1 : step,
    ending,
    go: goTo,
    finish,
    unEnd,
    reset: { label: 'START OVER (PRACTICE)', run: () => goTo(0) },
  });

  /** Lesson-id step jump for lesson bodies (Lesson 12 actions, §5.12). */
  const goToLesson = useCallback(
    (id: (typeof CABLE_LESSONS)[number]['id']) => {
      const i = CABLE_LESSONS.findIndex((l) => l.id === id);
      if (i >= 0) goTo(i);
    },
    [goTo],
  );

  return (
    <LabNavProvider value={nav}>
      <View style={[styles.root, { paddingTop: insets.top + 10 }]}>
        {/* Standing rule: every lab steers the user to a dedicated CALIBRATED
            instrument for real measurement — this app teaches, and the phone's
            mic and audio path are uncalibrated. Added 2026-09-17 after a
            bug-hunt pass found this lab had no note at all. */}
        <LabHeader title="CABLE & CONNECTOR FUNDAMENTALS" subtitle="Identify it. Understand it. Connect it safely." right={<AccuracyNote compact />} />
        <LabNavBar nav={nav} />

        <ScrollView ref={scrollRef} contentContainerStyle={[styles.scroll, cardColumn]}>
          <Text style={styles.coreQ}>{CORE_QUESTION}</Text>
          <View style={styles.tagRow}>
            <Text style={styles.tag}>{`${s.tag} · ${step + 1} OF ${CABLE_LESSONS.length}`}</Text>
            {total > 0 ? (
              <Text style={styles.progressText} accessibilityLabel={`${cleared} of ${total} lab units cleared`}>{`${cleared}/${total} UNITS`}</Text>
            ) : null}
          </View>
          <Text style={styles.stepTitle}>{s.title}</Text>
          <Text style={styles.body}>{s.intro}</Text>
          <CableStepNavCtx.Provider value={goToLesson}>
            <CableShellStateCtx.Provider value={lessonState}>
              <Body key={s.id} />
            </CableShellStateCtx.Provider>
          </CableStepNavCtx.Provider>
          {/* The in-flow NEXT / FINISH; draws nothing on lesson 12 (the end
              state — its own what's-left list and jump links take over, and
              the header ‹ leaves the lab). */}
          <LabNextButton nav={nav} />
        </ScrollView>
      </View>
    </LabNavProvider>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.screenBg },
  coreQ: {
    fontFamily: fonts.barlowMedium,
    fontSize: 13,
    fontStyle: 'italic',
    color: colors.amberLabel,
  },
  tagRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  progressText: { fontFamily: fonts.oswaldSemiBold, fontSize: 10, letterSpacing: 1, color: colors.textSub },

  scroll: { padding: 16, paddingTop: 10, paddingBottom: 30, gap: 10 },
  tag: { fontFamily: fonts.oswaldSemiBold, fontSize: 10.5, letterSpacing: 1.6, color: colors.amberLabel },
  stepTitle: { fontFamily: fonts.oswaldSemiBold, fontSize: 18, letterSpacing: 1, color: colors.textPrimary },
  body: { fontFamily: fonts.barlowRegular, fontSize: 14, lineHeight: 20, color: colors.textSecondary },
});
