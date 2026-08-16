/**
 * ExposureCheckin — the 15-minute listening-exposure check-in overlay (owner
 * spec 2026-08-12 §3–§6). Mounted ONCE at the app root, above the navigator.
 *
 * The thin red top line (AudioBorderFrame) stays the universal "audio is
 * active" signal. At each check-in this panel expands DOWN from the top edge
 * and its bottom border IS that red line — the line physically becomes the
 * panel's lower boundary, then retracts back to the thin line on dismissal.
 * The underlying screen is overlaid, never reflowed, and playback is never
 * interrupted.
 *
 * Severity styling escalates (routine → advisory → approaching → reached)
 * without flashing or pulsing. Respects Reduce Motion (fade instead of slide),
 * announces a concise screen-reader summary without stealing focus, and honors
 * the dev/low-light overlay suppression like every other auto-overlay.
 */
import { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, PanResponder, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { navigationRef } from '../../navigation/navigationRef';
import { areOverlaysSuppressed } from '../dev/popupSuppressStore';
import { colors, fonts } from '../../theme/tokens';
import {
  exposureMessage,
  fmtDuration,
  fmtRemaining,
  onExposureCheckin,
  type CheckinKind,
  type ExposureSnapshot,
} from './exposureMonitor';

const AUDIO_RED = '#ff2a2a'; // matches AudioBorderFrame
const LINE_THICK = 2.58;
const PANEL_H = 178;

/** Routine check-ins appear ONLY inside audio tools and labs (owner
 *  2026-08-12) — elsewhere the dosimeter runs silently. Critical dose warnings
 *  (approaching/reached) still show anywhere: they are once-per-day
 *  hearing-safety events and must not vanish because the user navigated away
 *  while audio kept sounding (§17). */
const AUDIO_ROUTES = new Set<string>([
  'ToolsHub', 'ToolInfo', 'ToolLearn', 'ToolDemo', 'ConceptModule', 'ToolLibrary',
  'SplMeter', 'Rta', 'WaveformLive', 'SignalGen', 'SpectrogramLive', 'Rt60Live',
  'FrequencyCounter', 'MultiMeter', 'DspDebug', 'ExposureMonitor',
  'AudioLearning', 'EarLab', 'LabCategory', 'AmplitudeLab', 'HarmonicLab',
  'OscillatorLab', 'NoiseLab', 'HarmonographLab', 'EqLab', 'DelayLab',
  'ReverbLab', 'ChorusLab', 'FlangerLab', 'PhaserLab', 'CompressionLab',
  'GateLab', 'LimiterLab', 'DistortionLab', 'PhaseLab', 'StereoLab',
  'SignalChainLab', 'BassLab', 'AutotuneLab', 'FmLab', 'BinauralLab',
  'ModularLab', 'MicLab', 'MicSelectLab', 'CableLab', 'SpeakerLab', 'TubeLab',
  'TubeReference', 'TubeCard', 'DigitalLab', 'DigitalModule', 'WaveLab',
  'WaveModule', 'MeterLab', 'MeterModule', 'EqLabHome', 'EqModule',
  'GainLabHome', 'GainModule', 'FoundationsCourse', 'FoundationsPlayground',
]);

function onAudioScreen(): boolean {
  try {
    const name = navigationRef.isReady() ? navigationRef.getCurrentRoute()?.name : undefined;
    return name != null && AUDIO_ROUTES.has(name);
  } catch {
    return false;
  }
}

const KIND_STYLE: Record<CheckinKind, { border: string; title: string; holdMs: number }> = {
  routine: { border: '#2c2c33', title: 'LISTENING EXPOSURE', holdMs: 8000 },
  advisory: { border: 'rgba(255,180,0,.55)', title: 'LISTENING EXPOSURE · ELEVATED', holdMs: 10000 },
  approaching: { border: 'rgba(255,180,0,.85)', title: 'LISTENING EXPOSURE · DOSE APPROACHING', holdMs: 12000 },
  reached: { border: AUDIO_RED, title: 'LISTENING EXPOSURE · DOSE REACHED', holdMs: 14000 },
};

export function ExposureCheckin() {
  const insets = useSafeAreaInsets();
  const [show, setShow] = useState<{ kind: CheckinKind; snap: ExposureSnapshot } | null>(null);
  const [reduceMotion, setReduceMotion] = useState(false);
  const slide = useRef(new Animated.Value(0)).current; // 0 hidden → 1 shown
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let alive = true;
    void AccessibilityInfo.isReduceMotionEnabled().then((v) => {
      if (alive) setReduceMotion(v);
    });
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduceMotion);
    return () => {
      alive = false;
      sub.remove();
    };
  }, []);

  const dismiss = () => {
    if (hideTimer.current) clearTimeout(hideTimer.current);
    Animated.timing(slide, { toValue: 0, duration: reduceMotion ? 120 : 260, useNativeDriver: true }).start(() =>
      setShow(null),
    );
  };

  useEffect(() => {
    return onExposureCheckin((kind, snap) => {
      if (areOverlaysSuppressed()) return; // dev kill-switch / low-light: nothing auto-appears
      // Routine/advisory check-ins are scoped to audio tools & labs (owner
      // 2026-08-12); critical dose warnings show anywhere.
      if ((kind === 'routine' || kind === 'advisory') && !onAudioScreen()) return;
      setShow({ kind, snap });
      if (snap.settings.haptics) void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
      // Concise announcement; focus is NOT moved (§23) so activities continue.
      AccessibilityInfo.announceForAccessibility(
        `Listening exposure check-in. ${fmtDuration(snap.todayActiveSec)} today. ` +
          `${snap.currentDb != null ? `Estimated ${Math.round(snap.currentDb)} dBA. ` : ''}` +
          `Daily dose ${Math.round(snap.todayDose * 100)} percent. Details available.`,
      );
      Animated.timing(slide, { toValue: 1, duration: reduceMotion ? 120 : 320, useNativeDriver: true }).start();
      if (hideTimer.current) clearTimeout(hideTimer.current);
      hideTimer.current = setTimeout(dismiss, KIND_STYLE[kind].holdMs);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reduceMotion]);

  const pan = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_e, g) => g.dy < -12 && Math.abs(g.dy) > Math.abs(g.dx),
      onPanResponderRelease: (_e, g) => {
        if (g.dy < -12) dismiss();
      },
    }),
  ).current;

  if (!show) return null;
  const { kind, snap } = show;
  const ks = KIND_STYLE[kind];
  const translateY = reduceMotion
    ? 0
    : slide.interpolate({ inputRange: [0, 1], outputRange: [-(PANEL_H + insets.top), 0] });
  const opacity = reduceMotion ? slide : 1;

  const openMonitor = () => {
    dismiss();
    if (navigationRef.isReady()) navigationRef.navigate('ExposureMonitor' as never);
  };

  return (
    <Animated.View
      {...pan.panHandlers}
      style={[styles.panel, { paddingTop: insets.top + 6, borderColor: ks.border, transform: [{ translateY }], opacity }]}
      accessibilityLiveRegion="polite"
    >
      <Pressable onPress={openMonitor} accessibilityRole="button" accessibilityLabel="Open the Listening Exposure Monitor">
        <View style={styles.headRow}>
          <Text style={[styles.title, kind === 'reached' && { color: AUDIO_RED }]}>{ks.title}</Text>
          <Pressable onPress={dismiss} hitSlop={12} accessibilityRole="button" accessibilityLabel="Dismiss">
            <Text style={styles.close}>✕</Text>
          </Pressable>
        </View>
        <View style={styles.grid}>
          <Text style={styles.big}>{fmtDuration(snap.todayActiveSec)} today</Text>
          <Text style={styles.big}>Dose {Math.round(snap.todayDose * 100)}%</Text>
          <Text style={styles.mid}>
            {snap.currentDb != null ? `${Math.round(snap.currentDb)} dBA estimated` : 'Level estimate unavailable'}
          </Text>
          <Text style={styles.mid}>{fmtRemaining(snap.remainingSec, snap.confidence, snap.todayDose)} remaining</Text>
        </View>
        <Text style={styles.route}>
          {snap.routeLabel}
          {snap.route !== 'environmental' ? ` · ${snap.confidence === 'calibrated' ? 'Calibrated' : 'General estimate'}` : ''}
        </Text>
        <Text style={styles.message}>{exposureMessage(snap)}</Text>
        <View style={styles.actionRow}>
          <Text style={styles.action}>VIEW EXPOSURE ›</Text>
          <Text style={styles.dismissHint}>swipe up to dismiss</Text>
        </View>
      </Pressable>
      {/* The red audio line — now the panel's bottom boundary. */}
      <View style={[styles.bottomLine, kind === 'reached' && { height: LINE_THICK * 2 }]} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  panel: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: '#121216',
    borderBottomWidth: 0,
    borderLeftWidth: 0,
    borderRightWidth: 0,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingBottom: 0,
    zIndex: 60,
    elevation: 12,
  },
  headRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { fontFamily: fonts.oswaldSemiBold, fontSize: 12, letterSpacing: 1.6, color: colors.amber },
  close: { fontSize: 16, color: colors.textSubAlt, padding: 2 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginTop: 6 },
  big: { fontFamily: fonts.oswaldSemiBold, fontSize: 16, color: colors.textPrimary, width: '48%', marginBottom: 2 },
  mid: { fontFamily: fonts.barlowMedium, fontSize: 13, color: colors.textSecondary, width: '48%' },
  route: { fontFamily: fonts.oswaldSemiBold, fontSize: 10, letterSpacing: 1, color: colors.textSub, marginTop: 5 },
  message: { fontFamily: fonts.barlowRegular, fontSize: 12.5, lineHeight: 17, color: colors.textSecondary, marginTop: 4 },
  actionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginVertical: 8 },
  action: { fontFamily: fonts.oswaldSemiBold, fontSize: 12, letterSpacing: 1.2, color: colors.green },
  dismissHint: { fontFamily: fonts.barlowRegular, fontSize: 10.5, color: colors.textSub },
  bottomLine: { height: LINE_THICK, backgroundColor: AUDIO_RED, marginHorizontal: -16 },
});
