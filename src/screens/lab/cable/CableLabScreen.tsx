/**
 * CableLabScreen — Cable & Connector Fundamentals (owner spec 2026-08-15).
 * "Identify it. Understand it. Connect it safely."
 *
 * A FREE Audio Fundamentals lab: 9 lessons + virtual cable tester + final
 * system challenge + gated final knowledge check, as a stepped progression
 * (MicSelect idiom: top nav + dots, BACK/NEXT, tap-to-jump, freely open —
 * COMPLETION is what's gated, via af_cables units in labCompletion).
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
import { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GlassButton } from '../../../components/GlassButton';
import { useEntitlement } from '../../../features/commercial/EntitlementProvider';
import { registerLabUnits, useLabCompletion } from '../../../features/lab/labCompletion';
import { colors, fonts } from '../../../theme/tokens';
import { CABLE_LESSONS, CABLE_UNITS, CORE_QUESTION } from './data/lessons';
import { CableStepNavCtx } from './lessons/bits';
import { LESSON_BODIES } from './lessons';

const STEP_KEY = 'ape:cableStep';

export function CableLabScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const [step, setStep] = useState(0);
  const scrollRef = useRef<ScrollView>(null);

  // Completion wiring (R6c): declare the full unit set on mount so the store
  // knows the target — and can retry a finished-offline completion.
  useEffect(() => {
    registerLabUnits('af_cables', CABLE_UNITS);
  }, []);
  const { cleared, total } = useLabCompletion('af_cables');

  // Guest rule (owner 2026-08-12): anonymous users neither restore nor persist
  // their place — every open starts at the first lesson.
  const { entitlement } = useEntitlement();
  const noAccountRef = useRef(entitlement === 'anonymous');
  noAccountRef.current = entitlement === 'anonymous';
  const navigatedRef = useRef(false);

  useEffect(() => {
    void AsyncStorage.getItem(STEP_KEY).then((v) => {
      if (navigatedRef.current || noAccountRef.current) return;
      const n = v == null ? NaN : Number(v);
      if (Number.isInteger(n) && n > 0 && n < CABLE_LESSONS.length) setStep(n);
    });
  }, []);

  const goTo = useCallback((n: number) => {
    navigatedRef.current = true;
    setStep(n);
    scrollRef.current?.scrollTo({ y: 0, animated: false });
    if (!noAccountRef.current) void AsyncStorage.setItem(STEP_KEY, String(n));
  }, []);

  const s = CABLE_LESSONS[step];
  const Body = LESSON_BODIES[s.id];
  const last = CABLE_LESSONS.length - 1;

  /** Lesson-id step jump for lesson bodies (Lesson 12 actions, §5.12). */
  const goToLesson = useCallback(
    (id: (typeof CABLE_LESSONS)[number]['id']) => {
      const i = CABLE_LESSONS.findIndex((l) => l.id === id);
      if (i >= 0) goTo(i);
    },
    [goTo],
  );

  return (
    <View style={[styles.root, { paddingTop: insets.top + 10 }]}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={10} accessibilityRole="button" accessibilityLabel="Back">
          <Text style={styles.back}>‹</Text>
        </Pressable>
        <View style={{ flexShrink: 1, flexGrow: 1 }}>
          <Text style={styles.title}>CABLE & CONNECTOR FUNDAMENTALS</Text>
          <Text style={styles.subtitle}>Identify it. Understand it. Connect it safely.</Text>
        </View>
      </View>
      <Text style={styles.coreQ}>{CORE_QUESTION}</Text>

      <View style={styles.topNav}>
        <Pressable onPress={() => goTo(0)} disabled={step === 0} hitSlop={{ top: 14, bottom: 14, left: 8, right: 8 }} accessibilityRole="button" accessibilityLabel="First lesson">
          <Text style={[styles.navBtn, step === 0 && styles.navBtnDisabled]}>⏮ START</Text>
        </Pressable>
        <Pressable onPress={() => goTo(Math.max(0, step - 1))} disabled={step === 0} hitSlop={{ top: 14, bottom: 14, left: 8, right: 8 }} accessibilityRole="button" accessibilityLabel="Previous lesson">
          <Text style={[styles.navBtn, step === 0 && styles.navBtnDisabled]}>‹ PREV</Text>
        </Pressable>
        <View style={{ flex: 1 }} />
        <Text style={styles.navPos}>{`STEP ${step + 1} / ${CABLE_LESSONS.length}`}</Text>
        <View style={{ flex: 1 }} />
        <Pressable
          onPress={() => goTo(Math.min(last, step + 1))}
          disabled={step === last}
          hitSlop={{ top: 14, bottom: 14, left: 8, right: 8 }}
          accessibilityRole="button"
          accessibilityLabel="Next lesson"
        >
          <Text style={[styles.navBtn, step === last && styles.navBtnDisabled]}>NEXT ›</Text>
        </Pressable>
      </View>
      <View style={styles.dotsRow}>
        {CABLE_LESSONS.map((st, i) => (
          <Pressable
            key={st.id}
            onPress={() => goTo(i)}
            hitSlop={{ top: 18, bottom: 18, left: 9, right: 9 }}
            accessibilityRole="button"
            accessibilityState={{ selected: i === step }}
            accessibilityLabel={`Go to ${st.title}${i === step ? ', current lesson' : i < step ? ', visited' : ''}`}
          >
            <View style={[styles.dot, i === step && styles.dotActive, i < step && styles.dotDone]} />
          </Pressable>
        ))}
        {total > 0 ? (
          <Text
            style={styles.progressText}
            accessibilityLabel={`${cleared} of ${total} lab units cleared`}
          >{`${cleared}/${total} UNITS`}</Text>
        ) : null}
      </View>

      <ScrollView ref={scrollRef} contentContainerStyle={styles.scroll}>
        <Text style={styles.tag}>{`${s.tag} · ${step + 1} OF ${CABLE_LESSONS.length}`}</Text>
        <Text style={styles.stepTitle}>{s.title}</Text>
        <Text style={styles.body}>{s.intro}</Text>
        <CableStepNavCtx.Provider value={goToLesson}>
          <Body key={s.id} />
        </CableStepNavCtx.Provider>
        <View style={styles.navRow}>
          <View style={{ flex: 1 }}>
            <GlassButton label="‹ BACK" tint="gold" disabled={step === 0} onPress={() => goTo(Math.max(0, step - 1))} />
          </View>
          <View style={{ flex: 1 }}>
            <GlassButton
              label={step === last ? 'DONE ✓' : 'NEXT ›'}
              tint="green"
              onPress={() => (step === last ? navigation.goBack() : goTo(Math.min(last, step + 1)))}
            />
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.screenBg },
  header: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14, paddingBottom: 2 },
  back: { fontFamily: fonts.oswaldSemiBold, fontSize: 30, color: colors.textSub, marginTop: -4, paddingRight: 2 },
  title: { fontFamily: fonts.oswaldSemiBold, fontSize: 16, letterSpacing: 1.2, color: colors.textPrimary },
  subtitle: { fontFamily: fonts.barlowRegular, fontSize: 12.5, color: colors.textSub, marginTop: 1 },
  coreQ: {
    fontFamily: fonts.barlowMedium,
    fontSize: 13,
    fontStyle: 'italic',
    color: colors.amberLabel,
    paddingHorizontal: 16,
    paddingBottom: 6,
  },
  topNav: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 2 },
  navBtn: { fontFamily: fonts.oswaldSemiBold, fontSize: 12, letterSpacing: 1, color: colors.amber, paddingHorizontal: 6 },
  navBtnDisabled: { color: '#45454d' },
  navPos: { fontFamily: fonts.oswaldSemiBold, fontSize: 11, letterSpacing: 1.2, color: colors.textSub },
  dotsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 6 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#2c2c33' },
  dotActive: { backgroundColor: colors.amber },
  dotDone: { backgroundColor: 'rgba(255,198,77,.45)' },
  progressText: { fontFamily: fonts.oswaldSemiBold, fontSize: 10, letterSpacing: 1, color: colors.textSub, marginLeft: 'auto' },

  scroll: { padding: 16, paddingTop: 8, paddingBottom: 30, gap: 10 },
  tag: { fontFamily: fonts.oswaldSemiBold, fontSize: 10.5, letterSpacing: 1.6, color: colors.amberLabel },
  stepTitle: { fontFamily: fonts.oswaldSemiBold, fontSize: 18, letterSpacing: 1, color: colors.textPrimary },
  body: { fontFamily: fonts.barlowRegular, fontSize: 14, lineHeight: 20, color: colors.textSecondary },
  navRow: { flexDirection: 'row', gap: 10, marginTop: 8 },
});
