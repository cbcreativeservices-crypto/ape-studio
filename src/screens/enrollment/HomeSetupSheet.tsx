/**
 * HomeSetupSheet — the Home (Course Select) screen customizer, opened from the
 * Enrollment screen (owner 2026-08-01 rework).
 *
 * ALWAYS ON YOUR HOME (locked): Audio Tools + Glossary, plus the required
 * pre-reqs — Pro Audio Safety always, and (while a certificate/program is held
 * and still incomplete) Grounding & Electrical, Workplace Skills, and the Audio
 * Fundamentals & Training Lab. These are reminders; their menu cards are managed
 * by the enrollment screen and disappear when the last credential is removed.
 *
 * ON YOUR HOME (editable): ONLY the user's ENROLLED topics (minus the cores).
 * Each row's Home icon toggles whether it becomes a menu card; long-press-hold a
 * row and drag to reorder — top of the list is the card CLOSEST to Glossary, and
 * further down the list = further RIGHT of Glossary on the menu. No add-topics
 * browser and no sort chips — the list IS the enrollment list.
 *
 * Edits a DRAFT (order + on/off + default); Save commits to homeCardsStore,
 * Cancel discards. Non-paid users may look but every write opens the prompt.
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import { officialTopicName } from '../../data/officialTopicNames';
import { Animated, PanResponder, Pressable, ScrollView, StyleSheet, Text, View, type GestureResponderEvent } from 'react-native';
import { Modal } from '../../components/DimModal';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, fonts } from '../../theme/tokens';
import { BookIcon } from '../../components/BookIcon';
import { HomeIcon } from '../../components/HomeIcon';
import { PrePaywallPrompt } from '../../components/PrePaywallPrompt';
import { MATRIX_SUBJECTS } from '../../data/courseTopicMatrix';
import { fetchV3Curriculum } from '../../data/v3Curriculum';
import { COREQ_TOPIC_GS } from '../awards/awardsData';
import { useEnrollment } from '../../features/enrollment/enrollmentStore';
import { useBundles } from '../../features/enrollment/enrolledBundlesStore';
import { useEnrollmentProgress } from '../../features/enrollment/enrollmentProgress';
import { getDefaultHomeGs, getHomeGs, HOME_MAX, setDefaultHomeGs, setHomeGs } from '../../features/home/homeCardsStore';

const GREEN = '#37e05f';
const BLUE = '#7fbfff';
const AMBER = colors.amber;
const GRAY = '#54565c';
const ROW_H = 64; // estimated editable-row height for the drag-to-reorder step
const FOUNDATIONS_LABEL = 'Audio Fundamentals & Advanced Training Labs';

export function HomeSetupSheet({ visible, onClose, paid = true }: { visible: boolean; onClose: () => void; paid?: boolean }) {
  const insets = useSafeAreaInsets();
  const enrolled = useEnrollment();
  const bundles = useBundles();
  const hasCredential = bundles.some((b) => b.kind === 'cert' || b.kind === 'program');

  const [order, setOrder] = useState<number[]>([]); // enrolled NON-core gs, in list order
  const [onSet, setOnSet] = useState<Set<number>>(new Set()); // which are on the Home menu
  const [defaultDraft, setDefaultDraft] = useState<number | null>(null);
  const [warn, setWarn] = useState(false);
  const [payOpen, setPayOpen] = useState(false);
  // Membership-upsell timing (owner 2026-08-05): for non-members the prompt
  // appears as soon as they tap ANYWHERE in this popup — but not on their very
  // first tap (a free look); the SECOND tap raises it. A root-level onTouchStart
  // owns this (touch events bubble to it from every child). Writes stay blocked
  // on every tap regardless of the count.
  const tapCount = useRef(0);
  useEffect(() => {
    if (visible) tapCount.current = 0; // fresh count each time the sheet opens
  }, [visible]);
  const onAnyTap = () => {
    if (paid) return;
    tapCount.current += 1;
    if (tapCount.current >= 2) setPayOpen(true);
  };
  const guard = (fn: () => void) => {
    if (paid) fn(); // non-members: write blocked; the tap counter shows the upsell
  };

  // LIVE v3 curriculum names (owner 2026-08-06): the retired v2 MATRIX_SUBJECTS
  // doesn't cover v3 gs (3000+), so every enrolled topic rendered as "Topic gsN".
  // Resolve names + subjects off the live curriculum (the same source Explore /
  // Awards use); keep the v2 matrix only as a last-resort fallback.
  const [v3Index, setV3Index] = useState<Map<number, { name: string; subject: string }>>(new Map());
  useEffect(() => {
    let alive = true;
    void fetchV3Curriculum().then((fields) => {
      if (!alive) return;
      const m = new Map<number, { name: string; subject: string }>();
      for (const f of fields) for (const s of f.subjects) for (const t of s.topics) m.set(t.gs, { name: t.name, subject: s.subject });
      setV3Index(m);
    });
    return () => {
      alive = false;
    };
  }, []);
  const topicIndex = useMemo(() => {
    const m = new Map<number, { name: string; subject: string }>();
    for (const s of MATRIX_SUBJECTS) for (const t of s.topics) m.set(t.gs, { name: t.name, subject: s.name });
    return m;
  }, []);
  const nameFor = (gs: number) =>
    officialTopicName(gs, v3Index.get(gs)?.name ?? topicIndex.get(gs)?.name);
  const subjectFor = (gs: number) => v3Index.get(gs)?.subject ?? topicIndex.get(gs)?.subject ?? '';

  // The user's enrolled topics, minus the required cores (those live locked in
  // the ALWAYS-ON section, not this editable list).
  const enrolledNonCore = useMemo(
    () => enrolled.map((e) => e.gs).filter((g) => !COREQ_TOPIC_GS.includes(g)),
    [enrolled],
  );

  // Progress (cores + enrolled) for the "remain until completed" reminders.
  const progGs = useMemo(() => Array.from(new Set([...COREQ_TOPIC_GS, ...enrolled.map((e) => e.gs)])), [enrolled]);
  const prog = useEnrollmentProgress(progGs);
  const isDone = (gs: number) => (prog.get(gs)?.pct ?? 0) >= 100;

  // (Re)build the draft each time the sheet opens, from the live stores.
  useEffect(() => {
    if (!visible) return;
    const home = getHomeGs();
    const onHome = home.filter((g) => enrolledNonCore.includes(g)); // home order first
    const off = enrolledNonCore.filter((g) => !home.includes(g)); // then the rest, enrollment order
    setOrder([...onHome, ...off]);
    setOnSet(new Set(onHome));
    setDefaultDraft(getDefaultHomeGs());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  // Cores currently reserved on Home (Safety always; Grounding/Workplace while a
  // credential is held) — used for the cap math and preserved on Save.
  const coresOnHome = useMemo(() => COREQ_TOPIC_GS.filter((gs) => getHomeGs().includes(gs)), [visible, hasCredential, prog]);

  const toggleRow = (gs: number) =>
    guard(() => {
      setOnSet((prev) => {
        const n = new Set(prev);
        if (n.has(gs)) {
          n.delete(gs);
          setDefaultDraft((d) => (d === gs ? null : d));
        } else {
          if (coresOnHome.length + n.size + 1 > HOME_MAX) {
            setWarn(true);
            return prev;
          }
          n.add(gs);
        }
        return n;
      });
    });

  const save = () =>
    guard(() => {
      const cores = getHomeGs().filter((g) => COREQ_TOPIC_GS.includes(g)); // preserve reserved cores
      const editableOn = order.filter((g) => onSet.has(g)); // user's picks, in list order
      setHomeGs([...cores, ...editableOn]);
      setDefaultHomeGs(defaultDraft);
      onClose();
    });

  // ── Long-press-hold-then-drag reorder (owner 2026-08-01) ──────────────────
  const holdTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const liftedRef = useRef<number | null>(null);
  const touchStart = useRef({ x: 0, y: 0 });
  const dragAccum = useRef(0);
  const liftAnim = useRef(new Animated.Value(0)).current;
  const [liftedGs, setLiftedGs] = useState<number | null>(null);
  useEffect(() => () => {
    if (holdTimer.current) clearTimeout(holdTimer.current);
  }, []);
  const beginLift = (gs: number) => {
    liftedRef.current = gs;
    setLiftedGs(gs);
    Animated.spring(liftAnim, { toValue: 1, useNativeDriver: true, friction: 5, tension: 90 }).start();
  };
  const endLift = () => {
    if (holdTimer.current) {
      clearTimeout(holdTimer.current);
      holdTimer.current = null;
    }
    if (liftedRef.current == null) return;
    liftedRef.current = null;
    Animated.timing(liftAnim, { toValue: 0, duration: 150, useNativeDriver: true }).start(() => setLiftedGs(null));
  };
  const moveInOrder = (gs: number, dir: -1 | 1) =>
    setOrder((prev) => {
      const i = prev.indexOf(gs);
      const j = i + dir;
      if (i < 0 || j < 0 || j >= prev.length) return prev;
      const n = [...prev];
      [n[i], n[j]] = [n[j], n[i]];
      return n;
    });
  const rowPan = (gs: number) =>
    PanResponder.create({
      onMoveShouldSetPanResponder: () => liftedRef.current === gs,
      onMoveShouldSetPanResponderCapture: () => liftedRef.current === gs,
      onPanResponderTerminationRequest: () => liftedRef.current !== gs,
      onPanResponderGrant: () => {
        dragAccum.current = 0;
      },
      onPanResponderMove: (_e, g) => {
        if (liftedRef.current !== gs) return;
        const step = Math.trunc((g.dy - dragAccum.current) / ROW_H);
        if (step !== 0) {
          const dir: -1 | 1 = step > 0 ? 1 : -1;
          for (let k = 0; k < Math.abs(step); k++) moveInOrder(gs, dir);
          dragAccum.current += step * ROW_H;
        }
      },
      onPanResponderRelease: endLift,
      onPanResponderTerminate: endLift,
    });
  const rowTouch = (gs: number) => ({
    onTouchStart: (ev: GestureResponderEvent) => {
      touchStart.current = { x: ev.nativeEvent.pageX, y: ev.nativeEvent.pageY };
      if (holdTimer.current) clearTimeout(holdTimer.current);
      holdTimer.current = setTimeout(() => beginLift(gs), 350);
    },
    onTouchMove: (ev: GestureResponderEvent) => {
      if (liftedRef.current === gs) return;
      const dx = ev.nativeEvent.pageX - touchStart.current.x;
      const dy = ev.nativeEvent.pageY - touchStart.current.y;
      if (Math.hypot(dx, dy) > 12 && holdTimer.current) {
        clearTimeout(holdTimer.current);
        holdTimer.current = null;
      }
    },
    onTouchEnd: () => {
      if (holdTimer.current) {
        clearTimeout(holdTimer.current);
        holdTimer.current = null;
      }
      if (liftedRef.current === gs) endLift();
    },
    onTouchCancel: () => {
      if (holdTimer.current) {
        clearTimeout(holdTimer.current);
        holdTimer.current = null;
      }
      if (liftedRef.current === gs) endLift();
    },
  });

  // A locked "always on your home" reminder row.
  const lockedRow = (key: string, icon: React.ReactNode, label: string, sub?: string) => (
    <View key={key} style={styles.lockedRow}>
      {icon}
      <View style={{ flex: 1 }}>
        <Text style={styles.lockedName} numberOfLines={1}>
          {label}
        </Text>
        {sub ? <Text style={styles.lockedSub} numberOfLines={1}>{sub}</Text> : null}
      </View>
      <Text style={styles.lock}>🔒</Text>
    </View>
  );

  return (
    <Modal accessibilityViewIsModal visible={visible} transparent animationType="slide" statusBarTranslucent onRequestClose={onClose}>
      <View style={[styles.root, { paddingTop: insets.top }]} onTouchStart={onAnyTap}>
        <View style={styles.head}>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>HOME SCREEN SETUP</Text>
            <Text style={styles.sub}>Toggle enrolled topics onto your Home menu, and drag to order them.</Text>
          </View>
          <Pressable onPress={onClose} hitSlop={12} accessibilityRole="button" accessibilityLabel="Cancel">
            <Text style={styles.close}>✕</Text>
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          {/* Always-on, locked. */}
          <Text style={styles.sectionHead}>ALWAYS ON YOUR HOME</Text>
          {lockedRow('tools', <BookIcon color={GREEN} filled size={20} />, 'Audio Tools')}
          {lockedRow('glossary', <BookIcon color={BLUE} filled size={20} />, 'Glossary')}
          {/* Pro Audio Safety — the free pre-req, always. */}
          {lockedRow('safety', <HomeIcon color={AMBER} filled size={18} />, nameFor(COREQ_TOPIC_GS[0]), 'Required pre-requisite')}
          {/* The other required cores + the lab — only while a credential is held
              and still incomplete (a reminder to finish them). */}
          {hasCredential
            ? COREQ_TOPIC_GS.slice(1)
                .filter((gs) => !isDone(gs))
                .map((gs) => lockedRow(`core${gs}`, <HomeIcon color={AMBER} filled size={18} />, nameFor(gs), 'Required with your certificate'))
            : null}
          {hasCredential
            ? lockedRow('foundations', <BookIcon color={AMBER} filled size={20} />, FOUNDATIONS_LABEL, 'Required lab · complete inside the lab')
            : null}

          {/* The editable list — ONLY enrolled topics (minus cores). */}
          <Text style={[styles.sectionHead, { marginTop: 16 }]}>ON YOUR HOME</Text>
          <Text style={styles.hint}>
            Tap a topic's Home icon to add/remove it from your menu. Long-press and drag to reorder — the top row is
            closest to Glossary; lower rows sit further right.
          </Text>
          {order.length === 0 ? (
            <Text style={styles.empty}>No enrolled topics yet — add topics from your enrollment list.</Text>
          ) : (
            order.map((gs) => {
              const on = onSet.has(gs);
              const lifted = liftedGs === gs;
              return (
                <Animated.View
                  key={gs}
                  {...(paid ? rowPan(gs).panHandlers : {})}
                  {...(paid ? rowTouch(gs) : {})}
                  style={[
                    styles.placedRow,
                    !on && styles.placedRowOff,
                    lifted && styles.placedRowLifted,
                    lifted && { transform: [{ scale: liftAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 1.04] }) }] },
                  ]}
                >
                  <Pressable
                    onPress={() => toggleRow(gs)}
                    hitSlop={8}
                    accessibilityRole="button"
                    accessibilityState={{ selected: on }}
                    accessibilityLabel={on ? `Remove ${nameFor(gs)} from Home` : `Add ${nameFor(gs)} to Home`}
                  >
                    <HomeIcon color={on ? AMBER : GRAY} filled={on} size={22} />
                  </Pressable>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.placedName, !on && styles.placedNameOff]} numberOfLines={1}>
                      {nameFor(gs)}
                    </Text>
                    <Text style={styles.placedSubject} numberOfLines={1}>
                      {subjectFor(gs)}
                    </Text>
                  </View>
                  {/* Default landing-card picker — only meaningful for on-Home topics. */}
                  {on ? (
                    <Pressable
                      style={[styles.defaultBtn, defaultDraft === gs && styles.defaultBtnOn]}
                      onPress={() => guard(() => setDefaultDraft((d) => (d === gs ? null : gs)))}
                      accessibilityRole="button"
                      accessibilityState={{ selected: defaultDraft === gs }}
                      accessibilityLabel={defaultDraft === gs ? `${nameFor(gs)} is the default opening card` : `Set ${nameFor(gs)} as the default opening card`}
                    >
                      <Text style={[styles.defaultText, defaultDraft === gs && styles.defaultTextOn]}>
                        {defaultDraft === gs ? 'DEFAULT' : 'SET DEFAULT'}
                      </Text>
                    </Pressable>
                  ) : null}
                  <Text style={styles.dragHandle}>⋮⋮</Text>
                </Animated.View>
              );
            })
          )}
          {order.some((g) => onSet.has(g)) ? (
            <Text style={styles.defaultHint}>The card marked DEFAULT is where your Home carousel opens.</Text>
          ) : null}
        </ScrollView>

        {/* Footer actions. */}
        <View style={[styles.footer, { paddingBottom: insets.bottom + 10 }]}>
          <Pressable style={styles.resetBtn} onPress={() => guard(() => { setOnSet(new Set()); setDefaultDraft(null); })} accessibilityRole="button" accessibilityLabel="Clear Home selections">
            <Text style={styles.resetText}>RESET</Text>
          </Pressable>
          <Pressable style={styles.cancelBtn} onPress={onClose} accessibilityRole="button" accessibilityLabel="Cancel">
            <Text style={styles.cancelText}>CANCEL</Text>
          </Pressable>
          <Pressable style={styles.saveBtn} onPress={save} accessibilityRole="button" accessibilityLabel="Save and return">
            <Text style={styles.saveText}>SAVE & RETURN</Text>
          </Pressable>
        </View>
      </View>

      <PrePaywallPrompt
        visible={warn}
        onClose={() => setWarn(false)}
        title="Home screen is full"
        lines={[`You can place up to ${HOME_MAX} cards on your Home screen.`, 'Remove one first to add another.']}
      />

      {/* Unpaid users can browse this setup but not change it (owner 2026-07-31).
          Raised on the 2nd tap anywhere (owner 2026-08-05) — reset on dismiss so
          the "one free tap, then prompt" cycle repeats. */}
      <PrePaywallPrompt
        visible={payOpen}
        onClose={() => {
          setPayOpen(false);
          tapCount.current = 0;
        }}
        title="Membership required"
        lines={[
          'Customizing your Home screen is an Academy membership feature.',
          'Look around all you like — and consider becoming a member.',
        ]}
      />
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.screenBg },
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#232323',
  },
  title: { fontFamily: fonts.oswaldSemiBold, fontSize: 16, letterSpacing: 1.2, color: colors.textPrimary },
  sub: { fontFamily: fonts.barlowRegular, fontSize: 12.5, color: colors.textSub, marginTop: 1 },
  close: { fontFamily: fonts.oswaldSemiBold, fontSize: 22, color: colors.textSubAlt },

  scroll: { padding: 16, gap: 8, paddingBottom: 20 },
  sectionHead: { fontFamily: fonts.oswaldSemiBold, fontSize: 12, letterSpacing: 1.6, color: colors.amberLabel, marginTop: 6 },
  hint: { fontFamily: fonts.barlowRegular, fontSize: 12, lineHeight: 17, color: colors.textSub },
  empty: { fontFamily: fonts.barlowRegular, fontStyle: 'italic', fontSize: 13.5, color: colors.textSub },

  lockedRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10, paddingHorizontal: 12, borderWidth: 1, borderColor: '#2a2a2a', borderRadius: 9, backgroundColor: '#141414' },
  lockedName: { fontFamily: fonts.oswaldMedium, fontSize: 15.5, color: colors.textPrimary },
  lockedSub: { fontFamily: fonts.barlowRegular, fontSize: 11.5, color: colors.textSub, marginTop: 1 },
  lock: { fontSize: 14, color: colors.textSub },

  placedRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 9, paddingHorizontal: 12, borderWidth: 1, borderColor: 'rgba(255,198,77,.4)', borderRadius: 10, backgroundColor: '#161206' },
  placedRowOff: { borderColor: '#2a2a2a', backgroundColor: '#141414' },
  placedRowLifted: {
    borderColor: 'rgba(255,255,255,.9)',
    zIndex: 30,
    elevation: 14,
    shadowColor: '#000',
    shadowOpacity: 0.6,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 7 },
  },
  placedName: { fontFamily: fonts.oswaldMedium, fontSize: 15, color: colors.textPrimary },
  placedNameOff: { color: colors.textSecondary },
  placedSubject: { fontFamily: fonts.barlowRegular, fontSize: 12, color: colors.textSub, marginTop: 1 },
  dragHandle: { fontFamily: fonts.oswaldSemiBold, fontSize: 16, color: '#6a6a72', paddingHorizontal: 2, letterSpacing: -2 },
  defaultHint: { fontFamily: fonts.barlowRegular, fontStyle: 'italic', fontSize: 12, color: colors.textSub, marginTop: 2 },
  defaultBtn: { borderWidth: 1, borderColor: '#3a3a3a', borderRadius: 8, paddingVertical: 4, paddingHorizontal: 8 },
  defaultBtnOn: { borderColor: 'rgba(255,198,77,.7)', backgroundColor: 'rgba(255,198,77,.14)' },
  defaultText: { fontFamily: fonts.oswaldSemiBold, fontSize: 10, letterSpacing: 0.6, color: colors.textSub },
  defaultTextOn: { color: AMBER },

  footer: { flexDirection: 'row', gap: 8, paddingHorizontal: 16, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#232323', backgroundColor: '#121212' },
  resetBtn: { borderWidth: 1, borderColor: '#3a3a3a', borderRadius: 9, paddingVertical: 11, paddingHorizontal: 14, alignItems: 'center' },
  resetText: { fontFamily: fonts.oswaldSemiBold, fontSize: 12, letterSpacing: 1, color: colors.textSub },
  cancelBtn: { flex: 1, borderWidth: 1, borderColor: '#3a3a3a', borderRadius: 9, paddingVertical: 11, alignItems: 'center' },
  cancelText: { fontFamily: fonts.oswaldSemiBold, fontSize: 12, letterSpacing: 1, color: colors.textSecondary },
  saveBtn: { flex: 1.4, borderRadius: 9, paddingVertical: 11, alignItems: 'center', backgroundColor: 'rgba(55,224,95,.14)', borderWidth: 1.5, borderColor: 'rgba(55,224,95,.7)' },
  saveText: { fontFamily: fonts.oswaldSemiBold, fontSize: 12, letterSpacing: 1, color: GREEN },
});
