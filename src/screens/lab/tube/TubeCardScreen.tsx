/**
 * TubeCardScreen — viewer for one tube reference card
 * (spec: docs/APE_TUBE_REFERENCE_SPEC_2026_08_09.md).
 *
 * LAYOUT (owner 2026-08-10): a FIXED nav bar sits ABOVE the image in its own
 * space — it never overlays the card. Tube stepping is by the bar's ‹ / ›
 * arrows and the PAGE 1 / PAGE 2 tabs.
 *
 * SWIPE (owner 2026-08-18): a horizontal swipe on the image also flips through
 * the sheets, in reading order — page 1 → page 2 → next tube's page 1 → … (and
 * the reverse). The earlier swipe was removed because it fought the image's
 * pan for the SAME one-finger drag; this one only arms when the image is NOT
 * zoomed (scale ≈ 1, where there is no pan to fight), so the two never compete.
 * The sheet follows the finger and snaps to the next/prev sheet past a
 * threshold, else springs back.
 *
 * DELIBERATELY core RN only (PanResponder + Animated + Image): the project has
 * no gesture-handler / expo-image, and a native add would stay dark until the
 * next EAS dev build. Native URL caching + Image.prefetch of neighbours keeps
 * paging snappy.
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Image,
  type LayoutChangeEvent,
  PanResponder,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors, fonts } from '../../../theme/tokens';
import type { RootStackParamList } from '../../../navigation/types';
import { GlassButton } from '../../../components/GlassButton';
import { useEntitlement } from '../../../features/commercial/EntitlementProvider';
import { TUBE_CARD_ASPECT, TUBE_FAMILY_META, TUBE_PAGES, TUBE_REFS, fetchTubePageUri, type TubeFamily } from './tubeRefs';

const MAX_SCALE = 4;
const DOUBLE_TAP_SCALE = 2.5;
const clamp = (x: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, x));

/** Brief (≤3-word) category label per family, shown left of the page toggle. */
const FAMILY_SHORT: Record<TubeFamily, string> = {
  preamp: 'Preamp Triode',
  power: 'Power Output',
  dht: 'Directly-Heated Triode',
  rectifier: 'Rectifier',
};

export function TubeCardScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, 'TubeCard'>>();
  const { entitlement } = useEntitlement();
  const unlocked = entitlement === 'academy';

  const startIdx = Math.max(0, TUBE_REFS.findIndex((r) => r.id === route.params.id));
  const [idx, setIdx] = useState(startIdx);
  // Each tube has two pages (owner 2026-08-17); the toggle picks which.
  const [page, setPage] = useState<1 | 2>(1);
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  const [retryKey, setRetryKey] = useState(0);
  // Secured card URLs are fetched from the tube-image Edge Function (signed,
  // short-lived), so the visible page's URI resolves asynchronously.
  const [pageUri, setPageUri] = useState<string | null>(null);
  const tube = TUBE_REFS[idx];
  const famTitle = TUBE_FAMILY_META.find((f) => f.key === tube.family)?.title ?? '';
  const catTitle = FAMILY_SHORT[tube.family];

  // The image area measures itself (space BELOW the fixed nav bar). The card is
  // fitted (contain) inside it at scale 1.
  const [area, setArea] = useState({ w: 0, h: 0 });
  const onAreaLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    setArea((a) => (a.w === width && a.h === height ? a : { w: width, h: height }));
  };
  const imgW = area.w > 0 && area.h > 0 ? Math.min(area.w, area.h * TUBE_CARD_ASPECT) : 0;
  const imgH = imgW / TUBE_CARD_ASPECT;

  // Transform: Animated values drive the view; refs hold committed numbers.
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
  const areaRef = useRef(area);
  areaRef.current = area;
  const dimsRef = useRef({ imgW, imgH });
  dimsRef.current = { imgW, imgH };
  // Live idx/page for the (once-memoized) pan responder to read without staleness.
  const idxRef = useRef(idx);
  idxRef.current = idx;
  const pageRef = useRef(page);
  pageRef.current = page;
  const maxT = (scale: number) => {
    const a = areaRef.current;
    const d = dimsRef.current;
    return {
      x: Math.max(0, (d.imgW * scale - a.w) / 2),
      y: Math.max(0, (d.imgH * scale - a.h) / 2),
    };
  };
  const resetTransform = () => {
    setTransform(1, 0, 0);
  };

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
    setPage(1); // new tube always opens on page 1
    setLoaded(false);
    setFailed(false);
    resetTransform();
  };

  const goPage = (nextPage: 1 | 2) => {
    if (nextPage === page) return;
    setPage(nextPage);
    setLoaded(false);
    setFailed(false);
    resetTransform();
  };

  // Flip one sheet in reading order: page 1 → page 2 → next tube page 1 → … .
  // Returns false at the very ends (so a swipe there springs back). Used by the
  // swipe gesture; reads live idx/page via refs. resetTransform() re-centres the
  // incoming sheet at scale 1.
  const goSheet = (dir: 1 | -1): boolean => {
    const i = idxRef.current;
    const p = pageRef.current;
    let ni = i;
    let np: 1 | 2 = p;
    if (dir === 1) {
      if (p === 1) np = 2;
      else if (i < TUBE_REFS.length - 1) { ni = i + 1; np = 1; }
      else return false;
    } else {
      if (p === 2) np = 1;
      else if (i > 0) { ni = i - 1; np = 2; }
      else return false;
    }
    if (ni !== i) setIdx(ni);
    setPage(np);
    setLoaded(false);
    setFailed(false);
    resetTransform();
    return true;
  };
  const goSheetRef = useRef(goSheet);
  goSheetRef.current = goSheet;

  const responder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        // Claim MOVE gestures for: a second finger (pinch); a one-finger drag
        // while zoomed (pan); OR a clearly-horizontal one-finger drag while NOT
        // zoomed (swipe between sheets). A plain tap moves too little to arm any
        // of these, so double-tap zoom still works.
        onMoveShouldSetPanResponder: (evt, g) =>
          evt.nativeEvent.touches.length >= 2 ||
          (cur.current.scale > 1.01 && (Math.abs(g.dx) > 2 || Math.abs(g.dy) > 2)) ||
          (cur.current.scale <= 1.01 && Math.abs(g.dx) > 10 && Math.abs(g.dx) > Math.abs(g.dy) * 1.4),
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

          // One finger, zoomed in → pan (clamped to edges).
          if (s.startScale > 1.01) {
            s.mode = 'pan';
            const m = maxT(cur.current.scale);
            setTransform(
              cur.current.scale,
              clamp(s.startTx + g.dx, -m.x, m.x),
              clamp(s.startTy + g.dy, -m.y, m.y),
            );
          } else {
            // One finger, not zoomed → swipe between sheets: the sheet follows
            // the finger. Dampen the drag hard at the very ends (nowhere to go).
            s.mode = 'swipe';
            const atStart = idxRef.current === 0 && pageRef.current === 1;
            const atEnd = idxRef.current === TUBE_REFS.length - 1 && pageRef.current === 2;
            let dx = g.dx;
            if ((dx < 0 && atEnd) || (dx > 0 && atStart)) dx *= 0.32;
            txAV.setValue(dx);
          }
        },
        onPanResponderRelease: (_evt, g) => {
          const s = session.current;
          const now = Date.now();

          // Swipe → snap to the next/prev sheet past a threshold, else spring
          // the current sheet back to centre.
          if (s.mode === 'swipe') {
            const w = areaRef.current.w || 1;
            const threshold = Math.min(90, w * 0.22);
            let committed = false;
            if (g.dx <= -threshold) committed = goSheetRef.current(1);
            else if (g.dx >= threshold) committed = goSheetRef.current(-1);
            if (!committed) {
              Animated.spring(txAV, { toValue: 0, bounciness: 4, useNativeDriver: false }).start();
              cur.current = { ...cur.current, tx: 0 };
            }
            return;
          }

          // Double-tap toggles zoom.
          if (!s.moved && now - s.downAt < 240) {
            if (now - s.lastTapAt < 320) {
              s.lastTapAt = 0;
              if (cur.current.scale > 1.01) {
                Animated.parallel([
                  Animated.spring(scaleAV, { toValue: 1, useNativeDriver: false }),
                  Animated.spring(txAV, { toValue: 0, useNativeDriver: false }),
                  Animated.spring(tyAV, { toValue: 0, useNativeDriver: false }),
                ]).start();
                cur.current = { scale: 1, tx: 0, ty: 0 };
              } else {
                Animated.spring(scaleAV, { toValue: DOUBLE_TAP_SCALE, useNativeDriver: false }).start();
                cur.current = { scale: DOUBLE_TAP_SCALE, tx: 0, ty: 0 };
              }
              return;
            }
            s.lastTapAt = now;
            return;
          }

          if (s.mode === 'pinch' && cur.current.scale < 1.05) {
            Animated.parallel([
              Animated.spring(scaleAV, { toValue: 1, useNativeDriver: false }),
              Animated.spring(txAV, { toValue: 0, useNativeDriver: false }),
              Animated.spring(tyAV, { toValue: 0, useNativeDriver: false }),
            ]).start();
            cur.current = { scale: 1, tx: 0, ty: 0 };
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  // Resolve the VISIBLE page's signed URL whenever the tube/page changes or a
  // retry is requested. A failure (not entitled / offline) shows the load-error
  // state, consistent with the previous behaviour.
  useEffect(() => {
    let alive = true;
    setPageUri(null);
    setLoaded(false);
    setFailed(false);
    fetchTubePageUri(tube.stem, page)
      .then((u) => {
        if (!alive) return;
        if (u) setPageUri(u);
        else setFailed(true);
      })
      .catch(() => {
        if (alive) setFailed(true);
      });
    return () => {
      alive = false;
    };
  }, [tube.stem, page, retryKey]);

  useEffect(() => {
    const prev = TUBE_REFS[idx - 1];
    const next = TUBE_REFS[idx + 1];
    // Warm the neighbours the same way, via signed URLs: the other page of THIS
    // tube (so the toggle/forward-swipe is instant), plus both neighbours'
    // facing pages (next→page 1, prev→page 2). Best-effort; failures are ignored.
    let alive = true;
    const warm = async (stem: string, p: 1 | 2) => {
      const u = await fetchTubePageUri(stem, p);
      if (alive && u) Image.prefetch(u).catch(() => {});
    };
    void warm(tube.stem, 2);
    if (prev) void warm(prev.stem, 2);
    if (next) void warm(next.stem, 1);
    return () => {
      alive = false;
    };
  }, [idx, tube.stem]);

  // Non-members never reach the cards (deep-link safe).
  if (!unlocked) {
    return (
      <View style={[styles.root, { paddingTop: insets.top + 10, paddingHorizontal: 16 }]}>
        <View style={styles.lockHeader}>
          <Pressable onPress={() => navigation.goBack()} hitSlop={10} accessibilityRole="button" accessibilityLabel="Back">
            <Text style={styles.back}>‹</Text>
          </Pressable>
          <Text style={styles.barTitle}>TUBE REFERENCE</Text>
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
    <View style={[styles.root, { paddingTop: insets.top + 8 }]}>
      {/* FIXED nav bar — ABOVE the image, its own space (owner 2026-08-10). */}
      <View style={styles.navBar}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={12} accessibilityRole="button" accessibilityLabel="Back to the tube list">
          <Text style={styles.back}>‹</Text>
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={styles.barTitle} numberOfLines={1}>
            {String(tube.num).padStart(2, '0')} / {TUBE_REFS.length} · {tube.short}
          </Text>
          <Text style={styles.barSub} numberOfLines={1}>{famTitle}</Text>
        </View>
        <Pressable
          onPress={() => goTo(idx - 1)}
          disabled={idx === 0}
          hitSlop={8}
          style={[styles.stepBtn, idx === 0 && styles.stepBtnOff]}
          accessibilityRole="button"
          accessibilityLabel="Previous tube"
        >
          <Text style={styles.stepArrow}>‹</Text>
        </Pressable>
        <Pressable
          onPress={() => goTo(idx + 1)}
          disabled={idx === TUBE_REFS.length - 1}
          hitSlop={8}
          style={[styles.stepBtn, idx === TUBE_REFS.length - 1 && styles.stepBtnOff]}
          accessibilityRole="button"
          accessibilityLabel="Next tube"
        >
          <Text style={styles.stepArrow}>›</Text>
        </Pressable>
      </View>

      {/* Page toggle — each tube has two pages (owner 2026-08-17). Its own
          fixed row above the image, never over it (same rule as the nav bar).
          A brief category label sits to the LEFT of the page buttons. */}
      <View style={styles.pageRow}>
        <Text style={styles.pageCat} numberOfLines={1}>{catTitle}</Text>
        <View style={styles.pageTabs}>
          {([1, 2] as const).map((p) => (
            <Pressable
              key={p}
              onPress={() => goPage(p)}
              style={[styles.pageTab, page === p && styles.pageTabOn]}
              accessibilityRole="button"
              accessibilityState={{ selected: page === p }}
              accessibilityLabel={`Show page ${p} of ${TUBE_PAGES}`}
            >
              <Text style={[styles.pageTabText, page === p && styles.pageTabTextOn]}>PAGE {p}</Text>
            </Pressable>
          ))}
        </View>
      </View>

      {/* Image area — everything below the bar; pinch-zoom + pan only. */}
      <View style={styles.imageArea} onLayout={onAreaLayout} {...responder.panHandlers}>
        {imgW > 0 && pageUri ? (
          <Animated.View
            style={{
              width: imgW,
              height: imgH,
              transform: [{ translateX: txAV }, { translateY: tyAV }, { scale: scaleAV }],
            }}
          >
            <Image
              key={`${tube.stem}-p${page}-${retryKey}`}
              source={{ uri: pageUri }}
              style={{ width: imgW, height: imgH }}
              resizeMode="contain"
              onLoad={() => setLoaded(true)}
              onError={() => setFailed(true)}
              accessibilityLabel={`${tube.short} reference card, page ${page} of ${TUBE_PAGES} — ${tube.role}`}
            />
          </Animated.View>
        ) : null}

        {!loaded && !failed ? (
          <View style={styles.centerOverlay} pointerEvents="none">
            <ActivityIndicator size="large" color={colors.amber} />
            <Text style={styles.loadText}>LOADING {tube.short} · PAGE {page}…</Text>
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
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#000' },
  back: { fontFamily: fonts.oswaldSemiBold, fontSize: 30, color: colors.textSecondary, marginTop: -4, paddingRight: 2 },

  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 14,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#1c1c22',
    backgroundColor: colors.screenBg,
  },
  barTitle: { fontFamily: fonts.oswaldSemiBold, fontSize: 15, letterSpacing: 1, color: colors.textPrimary },
  barSub: { fontFamily: fonts.barlowRegular, fontSize: 11.5, color: colors.textSub, marginTop: 1 },
  stepBtn: {
    width: 40,
    height: 40,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#33333c',
    backgroundColor: '#17171c',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepBtnOff: { opacity: 0.3 },
  stepArrow: { fontFamily: fonts.oswaldSemiBold, fontSize: 24, color: colors.textSecondary, marginTop: -3 },

  // Page toggle row — centered PAGE 1 / PAGE 2 segments (owner 2026-08-17).
  pageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#1c1c22',
    backgroundColor: colors.screenBg,
  },
  // Brief category label at the left of the page-toggle row.
  pageCat: {
    flex: 1,
    fontFamily: fonts.oswaldSemiBold,
    fontSize: 12.5,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: colors.textSecondary,
  },
  pageTabs: { flexDirection: 'row', gap: 8 },
  pageTab: {
    minWidth: 92,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#33333c',
    backgroundColor: '#17171c',
    paddingVertical: 7,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  pageTabOn: { borderColor: 'rgba(255,198,77,.6)', backgroundColor: 'rgba(255,198,77,.12)' },
  pageTabText: { fontFamily: fonts.oswaldSemiBold, fontSize: 12.5, letterSpacing: 1.4, color: colors.textSub },
  pageTabTextOn: { color: colors.amber },

  imageArea: { flex: 1, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },

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

  lockHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingBottom: 12 },
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
