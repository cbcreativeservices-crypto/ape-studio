/**
 * TubeCardScreen — full-screen viewer for one tube reference card
 * (spec: docs/APE_TUBE_REFERENCE_SPEC_2026_08_09.md).
 *
 * The cards are dense (2160×3840 — pin tables, ratings), so the viewer is a
 * zoomable surface: PINCH to zoom (1–4×), PAN when zoomed (clamped to the
 * card), SWIPE left/right when un-zoomed to move between tubes, DOUBLE-TAP to
 * toggle 1× ↔ 2.5×.
 *
 * DELIBERATELY built on core RN only (PanResponder + Animated): the project
 * has no react-native-gesture-handler / expo-image, and adding native modules
 * would leave this feature dark until the next EAS dev build (the same
 * constraint keyboardControllerSafe exists for). Native URL caching (Fresco /
 * NSURLCache) + Image.prefetch of the neighbours keeps paging snappy.
 *
 * Transform order [{translateX},{translateY},{scale}] keeps translation in
 * screen pixels (translate composes before the centre-anchored scale).
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Image,
  PanResponder,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors, fonts } from '../../../theme/tokens';
import type { RootStackParamList } from '../../../navigation/types';
import { GlassButton } from '../../../components/GlassButton';
import { useEntitlement } from '../../../features/commercial/EntitlementProvider';
import { TUBE_CARD_ASPECT, TUBE_FAMILY_META, TUBE_REFS, tubeImageUrl } from './tubeRefs';

const MAX_SCALE = 4;
const DOUBLE_TAP_SCALE = 2.5;
const SWIPE_DISTANCE = 72; // px of horizontal drag that commits a tube change
const clamp = (x: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, x));

export function TubeCardScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, 'TubeCard'>>();
  const { width: screenW, height: screenH } = useWindowDimensions();
  const { entitlement } = useEntitlement();
  const unlocked = entitlement === 'academy';

  const startIdx = Math.max(0, TUBE_REFS.findIndex((r) => r.id === route.params.id));
  const [idx, setIdx] = useState(startIdx);
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  const [retryKey, setRetryKey] = useState(0);
  const tube = TUBE_REFS[idx];
  const famTitle = TUBE_FAMILY_META.find((f) => f.key === tube.family)?.title ?? '';

  // Fitted (contain) card size at scale 1.
  const imgW = Math.min(screenW, screenH * TUBE_CARD_ASPECT);
  const imgH = imgW / TUBE_CARD_ASPECT;

  // ── Transform state: Animated values drive the view; refs hold the committed
  // numbers (PanResponder handlers never read Animated internals).
  const scaleAV = useRef(new Animated.Value(1)).current;
  const txAV = useRef(new Animated.Value(0)).current;
  const tyAV = useRef(new Animated.Value(0)).current;
  const cur = useRef({ scale: 1, tx: 0, ty: 0 });
  const setTransform = (scale: number, tx: number, ty: number) => {
    cur.current = { scale, tx, ty };
    scaleAV.setValue(scale);
    txAV.setValue(tx);
    tyAV.setValue(ty);
  };
  const maxT = (scale: number) => ({
    x: Math.max(0, (imgW * scale - screenW) / 2),
    y: Math.max(0, (imgH * scale - screenH) / 2),
  });
  const resetTransform = () => setTransform(1, 0, 0);

  // Gesture-session bookkeeping (one PanResponder, three modes).
  const session = useRef({
    mode: 'idle' as 'idle' | 'pinch' | 'pan' | 'swipe',
    startScale: 1,
    startTx: 0,
    startTy: 0,
    startDist: 0,
    startMidX: 0,
    startMidY: 0,
    moved: false,
    downAt: 0,
    lastTapAt: 0,
  });

  const goTo = (nextIdx: number) => {
    if (nextIdx < 0 || nextIdx >= TUBE_REFS.length) return;
    setIdx(nextIdx);
    setLoaded(false);
    setFailed(false);
    resetTransform();
  };
  // Keep handler logic on the latest idx without re-creating the responder.
  const idxRef = useRef(idx);
  idxRef.current = idx;

  const responder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: (evt) => {
          const s = session.current;
          s.mode = 'idle';
          s.moved = false;
          s.downAt = Date.now();
          s.startScale = cur.current.scale;
          s.startTx = cur.current.tx;
          s.startTy = cur.current.ty;
          const t = evt.nativeEvent.touches;
          if (t.length >= 2) {
            s.mode = 'pinch';
            s.startDist = Math.hypot(t[0].pageX - t[1].pageX, t[0].pageY - t[1].pageY);
            s.startMidX = (t[0].pageX + t[1].pageX) / 2;
            s.startMidY = (t[0].pageY + t[1].pageY) / 2;
          }
        },
        onPanResponderMove: (evt, g) => {
          const s = session.current;
          const t = evt.nativeEvent.touches;

          // Entering (or continuing) a pinch always wins.
          if (t.length >= 2) {
            if (s.mode !== 'pinch') {
              s.mode = 'pinch';
              s.startScale = cur.current.scale;
              s.startTx = cur.current.tx;
              s.startTy = cur.current.ty;
              s.startDist = Math.hypot(t[0].pageX - t[1].pageX, t[0].pageY - t[1].pageY);
              s.startMidX = (t[0].pageX + t[1].pageX) / 2;
              s.startMidY = (t[0].pageY + t[1].pageY) / 2;
            }
            const dist = Math.hypot(t[0].pageX - t[1].pageX, t[0].pageY - t[1].pageY);
            const scale = clamp(s.startScale * (dist / Math.max(1, s.startDist)), 0.8, MAX_SCALE);
            // Mid-point follow keeps the zoom feeling anchored under the fingers.
            const midX = (t[0].pageX + t[1].pageX) / 2;
            const midY = (t[0].pageY + t[1].pageY) / 2;
            const m = maxT(scale);
            const tx = clamp(s.startTx + (midX - s.startMidX), -m.x, m.x);
            const ty = clamp(s.startTy + (midY - s.startMidY), -m.y, m.y);
            setTransform(scale, tx, ty);
            s.moved = true;
            return;
          }

          if (Math.abs(g.dx) > 4 || Math.abs(g.dy) > 4) s.moved = true;

          if (s.startScale > 1.01 && s.mode !== 'swipe') {
            // Zoomed in → one finger pans the card, clamped to its edges.
            s.mode = 'pan';
            const m = maxT(cur.current.scale);
            setTransform(
              cur.current.scale,
              clamp(s.startTx + g.dx, -m.x, m.x),
              clamp(s.startTy + g.dy, -m.y, m.y),
            );
            return;
          }

          if (s.mode !== 'pan') {
            // Un-zoomed → horizontal drag previews the tube change (slight
            // resistance at the ends of the list).
            s.mode = 'swipe';
            const i = idxRef.current;
            const atEdge = (g.dx > 0 && i === 0) || (g.dx < 0 && i === TUBE_REFS.length - 1);
            txAV.setValue(atEdge ? g.dx / 3 : g.dx);
            cur.current.tx = g.dx;
          }
        },
        onPanResponderRelease: (evt, g) => {
          const s = session.current;
          const now = Date.now();

          // Double-tap: two quick, still taps → toggle zoom.
          if (!s.moved && now - s.downAt < 240) {
            if (now - s.lastTapAt < 320) {
              s.lastTapAt = 0;
              if (cur.current.scale > 1.01) {
                Animated.parallel([
                  Animated.spring(scaleAV, { toValue: 1, useNativeDriver: false }),
                  Animated.spring(txAV, { toValue: 0, useNativeDriver: false }),
                  Animated.spring(tyAV, { toValue: 0, useNativeDriver: false }),
                ]).start(() => setTransform(1, 0, 0));
                cur.current = { scale: 1, tx: 0, ty: 0 };
              } else {
                Animated.spring(scaleAV, { toValue: DOUBLE_TAP_SCALE, useNativeDriver: false }).start();
                cur.current = { scale: DOUBLE_TAP_SCALE, tx: 0, ty: 0 };
              }
              return;
            }
            s.lastTapAt = now;
          }

          if (s.mode === 'pinch') {
            if (cur.current.scale < 1.05) {
              // Released near/below 1× → settle back to the fitted card.
              Animated.parallel([
                Animated.spring(scaleAV, { toValue: 1, useNativeDriver: false }),
                Animated.spring(txAV, { toValue: 0, useNativeDriver: false }),
                Animated.spring(tyAV, { toValue: 0, useNativeDriver: false }),
              ]).start();
              cur.current = { scale: 1, tx: 0, ty: 0 };
            }
            return;
          }

          if (s.mode === 'swipe') {
            const i = idxRef.current;
            const commit =
              Math.abs(g.dx) > SWIPE_DISTANCE &&
              !((g.dx > 0 && i === 0) || (g.dx < 0 && i === TUBE_REFS.length - 1));
            if (commit) {
              goTo(g.dx < 0 ? i + 1 : i - 1);
            } else {
              Animated.spring(txAV, { toValue: 0, useNativeDriver: false }).start();
              cur.current.tx = 0;
            }
          }
        },
        onPanResponderTerminate: () => {
          const m = maxT(cur.current.scale);
          setTransform(
            Math.max(1, cur.current.scale),
            clamp(cur.current.tx, -m.x, m.x),
            clamp(cur.current.ty, -m.y, m.y),
          );
        },
      }),
    // Screen metrics are the only inputs the closures capture besides refs.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [screenW, screenH],
  );

  // Prefetch neighbours so swiping feels instant.
  useEffect(() => {
    const prev = TUBE_REFS[idx - 1];
    const next = TUBE_REFS[idx + 1];
    if (prev) Image.prefetch(tubeImageUrl(prev.file)).catch(() => {});
    if (next) Image.prefetch(tubeImageUrl(next.file)).catch(() => {});
  }, [idx]);

  // Deep-link guard: the route is safe to hit from anywhere — non-members get
  // the same lock the browse screen shows, never the cards.
  if (!unlocked) {
    return (
      <View style={[styles.root, { paddingTop: insets.top + 10, paddingHorizontal: 16 }]}>
        <View style={styles.header}>
          <Pressable onPress={() => navigation.goBack()} hitSlop={10} accessibilityRole="button" accessibilityLabel="Back">
            <Text style={styles.back}>‹</Text>
          </Pressable>
          <Text style={styles.hTitle}>TUBE REFERENCE</Text>
        </View>
        <View style={styles.lockCard}>
          <Text style={styles.lockEyebrow}>ACADEMY MEMBERS</Text>
          <Text style={styles.lockTitle}>The Tube Reference Library</Text>
          <Text style={styles.lockBody}>
            The full-screen tube reference cards are a feature of Academy membership.
          </Text>
          <View style={{ marginTop: 6 }}>
            <GlassButton label="UPGRADE TO ACADEMY" tint="gold" height={48} fontSize={14} onPress={() => navigation.navigate('Paywall')} />
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.rootViewer}>
      {/* The zoomable card surface. */}
      <View style={StyleSheet.absoluteFill} {...responder.panHandlers}>
        <Animated.View
          style={{
            flex: 1,
            alignItems: 'center',
            justifyContent: 'center',
            transform: [{ translateX: txAV }, { translateY: tyAV }, { scale: scaleAV }],
          }}
        >
          <Image
            key={`${tube.file}-${retryKey}`}
            source={{ uri: tubeImageUrl(tube.file) }}
            style={{ width: imgW, height: imgH }}
            resizeMode="contain"
            onLoad={() => setLoaded(true)}
            onError={() => setFailed(true)}
            accessibilityLabel={`${tube.short} reference card — ${tube.role}`}
          />
        </Animated.View>
      </View>

      {!loaded && !failed ? (
        <View style={styles.centerOverlay} pointerEvents="none">
          <ActivityIndicator size="large" color={colors.amber} />
          <Text style={styles.loadText}>LOADING {tube.short}…</Text>
        </View>
      ) : null}
      {failed ? (
        <View style={styles.centerOverlay}>
          <Text style={styles.loadText}>Couldn’t load the {tube.short} card — check your connection.</Text>
          <Pressable
            style={styles.retryBtn}
            onPress={() => {
              setFailed(false);
              setLoaded(false);
              setRetryKey((k) => k + 1);
            }}
            accessibilityRole="button"
            accessibilityLabel="Retry loading the card"
          >
            <Text style={styles.retryText}>RETRY</Text>
          </Pressable>
        </View>
      ) : null}

      {/* Header overlay — back, position, tube, family. */}
      <View style={[styles.topBar, { paddingTop: insets.top + 8 }]} pointerEvents="box-none">
        <Pressable onPress={() => navigation.goBack()} hitSlop={12} accessibilityRole="button" accessibilityLabel="Back to the tube list">
          <Text style={styles.back}>‹</Text>
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={styles.hTitle}>
            {String(tube.num).padStart(2, '0')} / {TUBE_REFS.length} · {tube.short}
          </Text>
          <Text style={styles.hSub}>{famTitle}</Text>
        </View>
        <Pressable
          onPress={() => goTo(idx - 1)}
          hitSlop={10}
          disabled={idx === 0}
          accessibilityRole="button"
          accessibilityLabel="Previous tube"
        >
          <Text style={[styles.navArrow, idx === 0 && styles.navArrowOff]}>‹</Text>
        </Pressable>
        <Pressable
          onPress={() => goTo(idx + 1)}
          hitSlop={10}
          disabled={idx === TUBE_REFS.length - 1}
          accessibilityRole="button"
          accessibilityLabel="Next tube"
        >
          <Text style={[styles.navArrow, idx === TUBE_REFS.length - 1 && styles.navArrowOff]}>›</Text>
        </Pressable>
      </View>

      {/* Gesture hint. */}
      <View style={[styles.hintBar, { paddingBottom: insets.bottom + 8 }]} pointerEvents="none">
        <Text style={styles.hintText}>PINCH TO ZOOM · SWIPE FOR NEXT TUBE · DOUBLE-TAP TO MAGNIFY</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.screenBg, gap: 12 },
  rootViewer: { flex: 1, backgroundColor: '#000' },
  header: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingBottom: 8 },
  back: { fontFamily: fonts.oswaldSemiBold, fontSize: 30, color: colors.textSecondary, marginTop: -4, paddingRight: 2 },

  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 14,
    paddingBottom: 8,
    backgroundColor: 'rgba(0,0,0,.55)',
  },
  hTitle: { fontFamily: fonts.oswaldSemiBold, fontSize: 15, letterSpacing: 1, color: colors.textPrimary },
  hSub: { fontFamily: fonts.barlowRegular, fontSize: 11.5, color: colors.textSub, marginTop: 1 },
  navArrow: { fontFamily: fonts.oswaldSemiBold, fontSize: 28, color: colors.textSecondary, paddingHorizontal: 6, marginTop: -3 },
  navArrowOff: { opacity: 0.25 },

  hintBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingTop: 8,
    backgroundColor: 'rgba(0,0,0,.45)',
  },
  hintText: { fontFamily: fonts.oswaldSemiBold, fontSize: 10, letterSpacing: 1.1, color: colors.textSub },

  centerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingHorizontal: 30,
  },
  loadText: { fontFamily: fonts.oswaldSemiBold, fontSize: 12, letterSpacing: 1.2, color: colors.textSub, textAlign: 'center' },
  retryBtn: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,198,77,.5)',
    backgroundColor: 'rgba(255,198,77,.12)',
    paddingVertical: 10,
    paddingHorizontal: 22,
  },
  retryText: { fontFamily: fonts.oswaldSemiBold, fontSize: 12, letterSpacing: 1.2, color: colors.amber },

  lockCard: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(91,176,255,.45)',
    backgroundColor: '#0b1420',
    padding: 16,
    gap: 8,
  },
  lockEyebrow: { fontFamily: fonts.oswaldSemiBold, fontSize: 11, letterSpacing: 2.2, color: '#7fd4ff' },
  lockTitle: { fontFamily: fonts.oswaldMedium, fontSize: 20, color: colors.textPrimary },
  lockBody: { fontFamily: fonts.barlowRegular, fontSize: 14, lineHeight: 20.5, color: colors.textSecondary },
});
