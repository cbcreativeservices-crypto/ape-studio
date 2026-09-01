/**
 * Session-length countdown timer for the Flashcards screen (owner 2026-08-13).
 *
 * A SILENT countdown a learner sets to cap a study session (5–60 min). They can
 * watch it on-screen (a small pill in the meter row) or hide it and just get a
 * top-of-screen banner when it expires. Uses the SAME blue clock (TimerIcon) as
 * the pace timer, so the two read as one family. Self-contained and NOT
 * persisted — it resets when the screen unmounts (a session cap, not a setting).
 *
 * The parent only re-renders on start/stop/expire; the per-second display ticks
 * inside SessionTimerPill so the (heavy) flashcards screen doesn't re-render
 * every second while the timer runs.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { Modal } from '../../components/DimModal';
import { TimerIcon } from '../../components/TimerIcon';
import { colors, fonts } from '../../theme/tokens';

/** Selectable session lengths, in minutes — up to one hour. */
const PRESETS = [5, 10, 15, 20, 30, 45, 60] as const;

export type SessionTimerApi = {
  running: boolean;
  showOnScreen: boolean;
  expired: boolean;
  configOpen: boolean;
  /** Epoch ms the countdown ends at (null when not running). */
  endAt: number | null;
  openConfig: () => void;
  closeConfig: () => void;
  start: (minutes: number, showOnScreen: boolean) => void;
  stop: () => void;
  dismissExpired: () => void;
};

export function useSessionTimer(): SessionTimerApi {
  const [running, setRunning] = useState(false);
  const [showOnScreen, setShowOnScreen] = useState(true);
  const [expired, setExpired] = useState(false);
  const [configOpen, setConfigOpen] = useState(false);
  const [endAt, setEndAt] = useState<number | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearPending = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = null;
  }, []);

  // Single fire-at-end timeout (no per-second interval here) so the parent only
  // re-renders when the session actually ends.
  const start = useCallback(
    (minutes: number, show: boolean) => {
      clearPending();
      const ms = Math.max(1, Math.round(minutes * 60)) * 1000;
      setShowOnScreen(show);
      setExpired(false);
      setEndAt(Date.now() + ms);
      setRunning(true);
      setConfigOpen(false);
      timeoutRef.current = setTimeout(() => {
        setRunning(false);
        setEndAt(null);
        setExpired(true);
      }, ms);
    },
    [clearPending],
  );

  const stop = useCallback(() => {
    clearPending();
    setRunning(false);
    setEndAt(null);
    setExpired(false);
  }, [clearPending]);

  const dismissExpired = useCallback(() => setExpired(false), []);
  const openConfig = useCallback(() => setConfigOpen(true), []);
  const closeConfig = useCallback(() => setConfigOpen(false), []);

  // Clear the pending timeout if the screen unmounts mid-session.
  useEffect(() => clearPending, [clearPending]);

  return { running, showOnScreen, expired, configOpen, endAt, openConfig, closeConfig, start, stop, dismissExpired };
}

function fmt(totalSec: number): string {
  const s = Math.max(0, Math.round(totalSec));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${r.toString().padStart(2, '0')}`;
}

/** Blue-clock button for the filter row — lit blue while a session runs. */
export function SessionTimerButton({ active, onPress }: { active: boolean; onPress: () => void }) {
  return (
    <Pressable hitSlop={6}
      style={[styles.btn, active && styles.btnActive]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      accessibilityLabel="Session timer"
    >
      <TimerIcon color={active ? colors.blue : '#8a8c90'} size={18} />
    </Pressable>
  );
}

/** On-screen countdown pill — self-ticks so the parent isn't re-rendered each
 *  second. Only mounts while a session runs AND the learner chose to see it. */
export function SessionTimerPill({ timer }: { timer: SessionTimerApi }) {
  const { running, showOnScreen, endAt } = timer;
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [running]);
  if (!running || !showOnScreen || endAt == null) return null;
  const remaining = Math.max(0, (endAt - now) / 1000);
  return (
    <View style={styles.pill} accessibilityLabel={`Session time left ${fmt(remaining)}`}>
      <TimerIcon color={colors.blue} size={13} />
      <Text style={styles.pillText}>{fmt(remaining)}</Text>
    </View>
  );
}

/** Config popup — pick a length, choose on-screen vs. banner-only, Start/Stop. */
export function SessionTimerModal({ timer }: { timer: SessionTimerApi }) {
  const [minutes, setMinutes] = useState<number>(5);
  const [show, setShow] = useState(true);
  return (
    <Modal accessibilityViewIsModal visible={timer.configOpen} transparent animationType="fade" onRequestClose={timer.closeConfig}>
      <Pressable accessible={false} style={styles.backdrop} onPress={timer.closeConfig}>
        <Pressable accessible={false} style={styles.sheet} onPress={() => {}}>
          <Text style={styles.title}>SESSION TIMER</Text>
          <Text style={styles.sub}>A silent countdown to cap this study session.</Text>

          <Text style={styles.fieldLabel}>Length</Text>
          <View style={styles.presetRow}>
            {PRESETS.map((m) => (
              <Pressable
                key={m}
                style={[styles.preset, minutes === m && styles.presetOn]}
                onPress={() => setMinutes(m)}
                accessibilityRole="button"
                accessibilityState={{ selected: minutes === m }}
              >
                <Text style={[styles.presetText, minutes === m && styles.presetTextOn]}>{m} min</Text>
              </Pressable>
            ))}
          </View>

          <Pressable style={styles.toggleRow} onPress={() => setShow((v) => !v)} accessibilityRole="checkbox" accessibilityState={{ checked: show }}>
            <View style={[styles.checkbox, show && styles.checkboxOn]}>{show ? <Text style={styles.checkMark}>✓</Text> : null}</View>
            <Text style={styles.toggleText}>Show the timer on screen</Text>
          </Pressable>
          <Text style={styles.toggleHint}>
            {show ? 'A small countdown shows in the meter row.' : 'Hidden — you’ll get a banner when time is up.'}
          </Text>

          <Pressable style={styles.startBtn} onPress={() => timer.start(minutes, show)} accessibilityRole="button">
            <Text style={styles.startText}>{timer.running ? 'RESTART' : 'START'}</Text>
          </Pressable>
          {timer.running ? (
            <Pressable style={styles.stopBtn} onPress={timer.stop} accessibilityRole="button">
              <Text style={styles.stopText}>STOP TIMER</Text>
            </Pressable>
          ) : (
            <Pressable style={styles.cancelBtn} onPress={timer.closeConfig} accessibilityRole="button">
              <Text style={styles.cancelText}>NOT NOW</Text>
            </Pressable>
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

/** Top-of-screen expiry banner — drops in, auto-dismisses after a few seconds. */
export function SessionTimerBanner({ timer }: { timer: SessionTimerApi }) {
  const ty = useRef(new Animated.Value(-160)).current;
  const { expired, dismissExpired } = timer;
  useEffect(() => {
    if (!expired) return;
    Animated.spring(ty, { toValue: 0, useNativeDriver: true, speed: 12, bounciness: 6 }).start();
    const id = setTimeout(() => {
      Animated.timing(ty, { toValue: -160, duration: 240, useNativeDriver: true }).start(() => dismissExpired());
    }, 4500);
    return () => clearTimeout(id);
  }, [expired, dismissExpired, ty]);
  if (!expired) return null;
  return (
    <Modal accessibilityViewIsModal visible transparent animationType="none" onRequestClose={dismissExpired}>
      <View style={styles.bannerWrap} pointerEvents="box-none">
        <Animated.View style={[styles.banner, { transform: [{ translateY: ty }] }]}>
          <TimerIcon color="#0b0b0b" size={18} />
          <Text style={styles.bannerText}>Session time is up</Text>
          <Pressable onPress={dismissExpired} hitSlop={12} accessibilityRole="button" accessibilityLabel="Dismiss">
            <Text style={styles.bannerX}>✕</Text>
          </Pressable>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  btn: {
    minWidth: 40,
    height: 34,
    paddingHorizontal: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.steelBorder,
    backgroundColor: '#141414',
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnActive: { borderColor: 'rgba(47,155,255,.9)', backgroundColor: 'rgba(47,155,255,.16)' },

  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(47,155,255,.5)',
    backgroundColor: 'rgba(47,155,255,.12)',
  },
  pillText: { fontFamily: fonts.oswaldSemiBold, fontSize: 13, color: colors.blue, minWidth: 34, textAlign: 'center' },

  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  sheet: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#151517',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.steelBorder,
    padding: 20,
  },
  title: { fontFamily: fonts.oswaldSemiBold, fontSize: 18, letterSpacing: 1, color: colors.textPrimary },
  sub: { fontFamily: fonts.oswaldMedium, fontSize: 13, color: colors.textSub, marginTop: 4, marginBottom: 14 },
  fieldLabel: { fontFamily: fonts.oswaldSemiBold, fontSize: 12, letterSpacing: 0.6, color: colors.amberLabel, marginBottom: 8 },
  presetRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  preset: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.steelBorder,
    backgroundColor: '#101012',
  },
  presetOn: { borderColor: 'rgba(47,155,255,.9)', backgroundColor: 'rgba(47,155,255,.18)' },
  presetText: { fontFamily: fonts.oswaldMedium, fontSize: 14, color: colors.textSub },
  presetTextOn: { color: '#7fbfff' },

  toggleRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 4 },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: colors.steelBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxOn: { borderColor: 'rgba(47,155,255,.9)', backgroundColor: 'rgba(47,155,255,.18)' },
  checkMark: { fontFamily: fonts.oswaldSemiBold, fontSize: 14, color: '#7fbfff' },
  toggleText: { fontFamily: fonts.oswaldMedium, fontSize: 14, color: colors.textPrimary },
  toggleHint: { fontFamily: fonts.oswaldMedium, fontSize: 12, color: colors.textMutedDeep, marginLeft: 32, marginBottom: 18 },

  startBtn: {
    height: 48,
    borderRadius: 10,
    backgroundColor: colors.blue,
    alignItems: 'center',
    justifyContent: 'center',
  },
  startText: { fontFamily: fonts.oswaldSemiBold, fontSize: 15, letterSpacing: 1, color: '#04121f' },
  stopBtn: { height: 44, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginTop: 10, borderWidth: 1, borderColor: colors.red },
  stopText: { fontFamily: fonts.oswaldSemiBold, fontSize: 13, letterSpacing: 0.8, color: colors.red },
  cancelBtn: { height: 44, alignItems: 'center', justifyContent: 'center', marginTop: 6 },
  cancelText: { fontFamily: fonts.oswaldMedium, fontSize: 13, letterSpacing: 0.8, color: colors.textMuted },

  bannerWrap: { position: 'absolute', top: 0, left: 0, right: 0, alignItems: 'center' },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 52,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: colors.amber,
    shadowColor: '#000',
    shadowOpacity: 0.4,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 6,
  },
  bannerText: { fontFamily: fonts.oswaldSemiBold, fontSize: 15, letterSpacing: 0.5, color: '#0b0b0b' },
  bannerX: { fontFamily: fonts.oswaldSemiBold, fontSize: 15, color: 'rgba(11,11,11,0.65)', paddingHorizontal: 2 },
});
