/**
 * StageFullScreen — a lab display at the whole phone (owner 2026-09-25: "the
 * new lab has several screens with text too small to read … these displays
 * may need to be enlarged so the user can see them and make use of them" →
 * "do both - 9 pt minimum"). Built for Sound Systems; shared by every lab
 * since the eleven-lab legibility pass (rack/ since 2026-09-25).
 *
 * The pinned glass is at most 250 pt tall, so a busy drawing (the system map,
 * the venue plan, the channel strip) can only be so large there. This view
 * renders the SAME stage — same page state, still tappable — into the whole
 * screen, with zoom steps and drag-to-pan. The drawings are vectors, so every
 * step is re-drawn sharp, not magnified pixels.
 *
 * Zoom is STEPS + scroll, not pinch: pinch needs react-native-gesture-handler,
 * a native package this app does not ship, and adding one moves the runtime
 * fingerprint (no over-the-air update until a new build). Steps work the same
 * on iOS, Android and web.
 *
 * Turning the phone sideways gives a wider drawing: the Modal allows every
 * orientation (DimModal) and the size is read live from the window.
 * The honesty badge rides along — a disclosure is never left behind.
 *
 * The lab's CONTROLS come along (owner 2026-09-25: "the user must still be
 * able to adjust and view their changes to controls"): a rack passes its dock
 * (`controls`) and its tray layer (`overlay`); an inline figure passes the
 * page's own controls. They sit docked under the drawing, pinned — the Rack
 * Unit law holds in here too: the picture may scroll, operating may not.
 *
 * Text that is NOT vector (React Native <Text> laid over a Skia canvas) does
 * not grow with the box. The view therefore publishes StageTextScale =
 * rendered width ÷ `glassW` (the width the stage had on the glass), and the
 * overlay-label helpers multiply their font size by it. See stageAspect.ts.
 *
 * USING THE SPACE (owner 2026-10-01, "every lab uses the space better";
 * the rules are in stageFitMath.ts, node-tested):
 *  - StageTextScale is floored at 1 (sideways a short body had shrunk
 *    labels under 9 pt); StageGlassWidth tells a stage the real glass width.
 *  - A FIT step fills the body's other side (a wide drawing's height in
 *    portrait, a tall one's width sideways) and pans along it. 1× stays the
 *    opening: the whole drawing, uncropped.
 *  - SIDEWAYS the frame folds: readouts and the badge ride in the bar beside
 *    the zoom keys, there is no hint line, and the dock folds to a slim
 *    handle on a tap (the lane is one tap away; an open tray keeps it up).
 *  - A wide drawing's portrait hint says so and sends the learner sideways.
 */
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Animated, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { isTabletWindow } from '../../../theme/tablet'; // tablet wording, owner 2026-09-29 (Android large-screen pass)
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Modal } from '../../../components/DimModal';
import { colors, fonts } from '../../../theme/tokens';
import { StageAspectReport, StageGlassWidth, StageInFullScreen, StageTextScale, type StageReport } from './stageAspect';
import { anchorOffset, baseSize, compaction, factorOf, fitFactor, isLandscape, textScaleFor, wantsRotate, zoomSteps } from './stageFitMath';

/** The dock fold outlives one opening (a learner who folded it sideways
 *  keeps it folded on the next display this session), never a relaunch. */
let dockFoldedCache = false;

export function StageFullScreen({
  visible,
  onClose,
  render,
  badge,
  glassW,
  aspect,
  title = 'DISPLAY',
  controls,
  overlay,
  readouts,
  overlayLift = 0,
  openStep = '1',
  onBack,
}: {
  visible: boolean;
  onClose: () => void;
  /** Android back (the Modal's onRequestClose). A rack passes one that closes
   *  an open tray before leaving full screen (bug hunt 2026-09-29). Unset =
   *  onClose. */
  onBack?: () => void;
  render: (w: number, h: number) => ReactNode;
  badge?: string;
  /** The width the stage is drawn at on the glass (or inline). Sets
   *  StageTextScale (floored at 1) so overlay labels grow with the drawing,
   *  and is published as StageGlassWidth. Omit = 1. */
  glassW?: number;
  /** A fixed drawing shape the host already knows (an inline figure). A
   *  StageFit child reports its own and overrides this. */
  aspect?: number;
  title?: string;
  /** The controls, docked under the drawing (a rack's lane + keys). */
  controls?: ReactNode;
  /** An overlay layer over the drawing + controls (a rack's tray). */
  overlay?: ReactNode;
  /** The live readouts (a rack's bezel strip), shown across the top under the
   *  bar — there is room up there and the numbers belong with the picture
   *  (owner 2026-09-26). Sideways they ride IN the bar. */
  readouts?: ReactNode;
  /** Height the controls should rise by while the overlay is open (the tray
   *  card's height): the dock slides up above the tray so it stays usable
   *  during a choice, and drops back when the tray closes. 0 = at rest. */
  overlayLift?: number;
  /** The zoom step an opening lands on: '1' (default, the whole drawing) or
   *  'fit'. Falls back to '1' when FIT is not offered (shownKey). */
  openStep?: '1' | 'fit';
}) {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const landscape = isLandscape(width, height);
  const fold = compaction(landscape);
  const [bodyH, setBodyH] = useState(0);
  const [bodyW, setBodyW] = useState(0);
  // The zoom step by KEY ('1' | '1.5' | '2' | '3' | 'fit'): FIT's factor
  // follows the body, so a rotation keeps the learner on FIT, re-fitted.
  const [stepKey, setStepKey] = useState('1');
  // Every opening starts at the whole drawing. Reset on CLOSE as well (bug
  // pass 2026-10-01): reset only on open, the first frame of the next opening
  // still drew the old 3× / FIT step (and mounted its scrollers) before
  // snapping back to 1×.
  useEffect(() => {
    setStepKey(openStep);
  }, [visible, openStep]);
  // The hint line rolls DOWN out of the way on a tap and back up from a
  // small ? chip (owner 2026-09-26: "make the 'pick a zoom step…' message
  // collapsable — animate it like a roll up/down message"). Height and
  // slide are driven together so it reads as a shutter, not a fade.
  const [hintOpen, setHintOpen] = useState(true);
  const hintAnim = useRef(new Animated.Value(1)).current;
  const toggleHint = () => {
    const next = !hintOpen;
    setHintOpen(next);
    Animated.timing(hintAnim, { toValue: next ? 1 : 0, duration: 220, useNativeDriver: false }).start();
  };
  // The dock's lift above an open tray, animated both ways.
  const liftAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(liftAnim, { toValue: -overlayLift, duration: 200, useNativeDriver: true }).start();
  }, [overlayLift, liftAnim]);
  const hintMaxH = hintAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 48] });
  const hintShift = hintAnim.interpolate({ inputRange: [0, 1], outputRange: [16, 0] });
  // The dock folds to a handle on a tap (sideways the body is what it gives
  // back). An open tray always has its dock up — the lane rides above it.
  const [dockFolded, setDockFolded] = useState(dockFoldedCache);
  // The view stays mounted while closed, so a frame mounted BEFORE the
  // learner folded another display's dock still held the old value: re-read
  // the session cache on every opening (bug pass 2026-10-01).
  useEffect(() => {
    if (visible) setDockFolded(dockFoldedCache);
  }, [visible]);
  const toggleDock = () => {
    setDockFolded((f) => {
      dockFoldedCache = !f;
      return !f;
    });
  };
  const dockUp = !dockFolded || overlayLift > 0;

  // A StageFit drawing reports its aspect: then the canvas at every zoom is
  // the drawing's own shape. A drawing that paints the whole box itself
  // reports nothing and zooms as the plain box.
  const [shape, setShape] = useState<{ aspect: number; pad: number } | null>(null);
  const report = useMemo<StageReport>(
    () => ({
      aspect: (a: number, pad: number) =>
        setShape((cur) => (cur && cur.aspect === a && cur.pad === pad ? cur : { aspect: a, pad })),
      fixed: () => {},
    }),
    [],
  );
  const effShape = shape ?? (aspect ? { aspect, pad: 0 } : null);

  const padX = 8;
  const fitW = Math.max(120, width - insets.left - insets.right - padX * 2);
  const fitH = Math.max(120, (bodyH || height * 0.7) - 8);
  // 1× is ALWAYS the whole drawing, and every opening starts there (owner
  // 2026-09-26: "1× should be zoomed full out to see everything always").
  // This replaces the fill-width opening step of 1a69d3ca, which cropped a
  // height-limited drawing top and bottom.
  const { w: baseW, h: baseH } = baseSize({ fitW, fitH, shape: effShape });
  const fit = fitFactor({ baseW, baseH, fitW, fitH });
  const steps = zoomSteps(fit);
  // A rotation can take the FIT step away while it is selected (night pass 2,
  // 2026-10-01): the drawing fell back to 1× but no key read selected. The
  // key that is actually showing is the one lit.
  const shownKey = steps.some((s) => s.key === stepKey) ? stepKey : '1';
  const zoom = factorOf(steps, shownKey);
  const w = Math.round(baseW * zoom);
  const h = Math.round(baseH * zoom);
  const rotate = wantsRotate({ landscape, baseH, fitH, fit });

  // ZOOM ANCHOR (owner 2026-09-26): a step zooms in on the spot the learner
  // last touched in the drawing; untouched, it zooms on the centre. Held as
  // a fraction of the drawing so it survives every step's re-draw.
  const anchor = useRef<{ fx: number; fy: number } | null>(null);
  useEffect(() => {
    if (visible) anchor.current = null;
  }, [visible]);
  const drawRef = useRef<View>(null);
  const hScroll = useRef<ScrollView>(null);
  const vScroll = useRef<ScrollView>(null);
  // Record the touch WITHOUT claiming it: the capture probe answers false,
  // so the drawing's own drag still gets the gesture (touch and mouse alike).
  const noteTouch = (e: { nativeEvent: { pageX: number; pageY: number } }) => {
    const { pageX: tx, pageY: ty } = e.nativeEvent;
    drawRef.current?.measure((_x, _y, mw, mh, px, py) => {
      if (mw > 0 && mh > 0) {
        anchor.current = {
          fx: Math.max(0, Math.min(1, (tx - px) / mw)),
          fy: Math.max(0, Math.min(1, (ty - py) / mh)),
        };
      }
    });
    return false;
  };
  // Each step re-mounts the scrollers (key), so once the new content has its
  // size, scroll each axis to put the anchor mid-view.
  // Once per zoom step and axis: re-running on every content-size change
  // snapped a panned learner back whenever the body resized (hint roll-up,
  // rotation) — QA 2026-09-26.
  const anchoredAt = useRef({ x: -1, y: -1 });
  useEffect(() => {
    if (visible) anchoredAt.current = { x: -1, y: -1 };
  }, [visible, zoom]);
  const anchorScroll = (axis: 'x' | 'y', content: number) => {
    const view = axis === 'x' ? bodyW : bodyH;
    if (zoom <= 1 || view <= 0 || content <= view) return;
    if (anchoredAt.current[axis] === zoom) return;
    anchoredAt.current[axis] = zoom;
    const f = anchor.current ? (axis === 'x' ? anchor.current.fx : anchor.current.fy) : 0.5;
    const off = anchorOffset(content, view, f);
    if (axis === 'x') hScroll.current?.scrollTo({ x: off, y: 0, animated: false });
    else vScroll.current?.scrollTo({ x: 0, y: off, animated: false });
  };
  // Overlay labels (RN <Text> over Skia) grow by this — 1 on the glass, and
  // never under 1 here: a short sideways body can fit the drawing narrower
  // than its glass, and the labels must not follow it under the 9 pt floor.
  // A lab that lays out in glass units (w ÷ textScale) then lays out at its
  // real, narrower width with glass-size text — legible, still the whole
  // drawing. (A lab needing the real glass width reads StageGlassWidth.)
  const textScale = textScaleFor(w, glassW ?? 0);
  // Pan whenever the drawing overflows the body — a zoom step, or the bottom
  // `overlayLift` px an open tray covers.
  const panX = w > bodyW;
  const panY = h > bodyH || overlayLift > 0;

  const hintText = zoom > 1
    ? 'Drag to move around the drawing.'
    : rotate
      ? `This drawing is wide — turn the ${isTabletWindow(width, height) ? 'tablet' : 'phone'} sideways to see it big, or tap FIT to fill the height.`
      : `Pick a zoom step to look closer${fit > 1.15 ? ' — FIT fills the screen' : ''}. Turn the ${isTabletWindow(width, height) ? 'tablet' : 'phone'} sideways for a wider view.`;

  return (
    <Modal visible={visible} animationType="fade" onRequestClose={onBack ?? onClose} statusBarTranslucent>
      <View style={[styles.root, { paddingTop: insets.top + 6, paddingBottom: insets.bottom + 6, paddingLeft: insets.left, paddingRight: insets.right }]}>
        <View style={[styles.bar, landscape && styles.barLandscape]}>
          {/* One line, shrinks: a long title ("THE SPEECH SYSTEM") pushed the
              zoom row and clipped ✕ at 390 (Speech pass 2026-09-26). */}
          <Text style={[styles.title, landscape && styles.titleLandscape]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.75}>
            {title}
          </Text>
          <View style={[styles.zooms, fold.readoutsInBar && readouts ? styles.zoomsTight : null]} accessibilityRole="radiogroup" accessibilityLabel="Zoom">
            {steps.map((s) => {
              const on = s.key === shownKey;
              return (
                <Pressable
                  key={s.key}
                  onPress={() => setStepKey(s.key)}
                  style={[styles.zoomBtn, landscape && styles.zoomBtnLandscape, on && styles.zoomBtnOn]}
                  hitSlop={4}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: on }}
                  accessibilityLabel={s.key === 'fit' ? 'Zoom to fit the screen' : `Zoom ${s.factor} times`}
                >
                  <Text style={[styles.zoomText, on && styles.zoomTextOn]}>{s.label}</Text>
                </Pressable>
              );
            })}
          </View>
          {fold.readoutsInBar && readouts ? <View style={styles.barReadouts}>{readouts}</View> : null}
          <Pressable onPress={onClose} style={styles.close} hitSlop={10} accessibilityRole="button" accessibilityLabel="Close full screen">
            <Text style={styles.closeText}>✕</Text>
          </Pressable>
        </View>

        <View style={styles.stack}>
        {!fold.readoutsInBar && readouts ? <View style={styles.readouts}>{readouts}</View> : null}
        <View
          style={styles.body}
          testID="stage-fullscreen-body"
          onLayout={(e) => {
            setBodyH(Math.round(e.nativeEvent.layout.height));
            setBodyW(Math.round(e.nativeEvent.layout.width));
          }}
        >
          {bodyH > 0 ? (
            // Two scrollers = drag in both directions once zoomed in. At 1×
            // the drawing fits and neither scrolls.
            <ScrollView
              key={`v${shownKey}`}
              ref={vScroll}
              onContentSizeChange={(_cw, ch) => anchorScroll('y', ch)}
              // The outer (vertical) content must NOT centre its child
              // horizontally: with alignItems:'center' the inner horizontal
              // scroller took its CONTENT width, so the overflow landed on
              // this outer scroller, which cannot pan sideways — at 2× the
              // drawing could not be dragged left/right (Sound Systems
              // re-check 2026-09-26). Stretched, the inner scroller is the
              // viewport's width and owns the sideways drag.
              // An open tray + the lifted dock cover the bottom `overlayLift`
              // px of the body: pad the content by that much and let it
              // scroll even at 1×, so the whole drawing stays reachable while
              // choosing (QA 2026-09-26, D35.2 "the tray never veils").
              contentContainerStyle={[styles.vCenter, overlayLift > 0 ? { paddingBottom: overlayLift } : null]}
              scrollEnabled={panY}
              showsVerticalScrollIndicator={panY}
            >
              <ScrollView
                ref={hScroll}
                onContentSizeChange={(cw) => anchorScroll('x', cw)}
                horizontal
                contentContainerStyle={styles.center}
                scrollEnabled={panX}
                showsHorizontalScrollIndicator={panX}
              >
                <View ref={drawRef} style={{ width: w, height: h }} testID="stage-fullscreen-drawing" onStartShouldSetResponderCapture={noteTouch}>
                  <StageAspectReport.Provider value={report}>
                    <StageGlassWidth.Provider value={glassW ?? 0}>
                      <StageTextScale.Provider value={textScale}>
                        <StageInFullScreen.Provider value>{render(w, h)}</StageInFullScreen.Provider>
                      </StageTextScale.Provider>
                    </StageGlassWidth.Provider>
                  </StageAspectReport.Provider>
                </View>
              </ScrollView>
            </ScrollView>
          ) : null}
        </View>

        {fold.hint ? (
          <View style={styles.hintWrap}>
            <Animated.View style={[styles.hintRoll, { maxHeight: hintMaxH, opacity: hintAnim, transform: [{ translateY: hintShift }] }]}>
              <Pressable onPress={toggleHint} accessibilityRole="button" accessibilityLabel="Hide this hint" hitSlop={6}>
                <Text style={[styles.hint, rotate && zoom <= 1 && styles.hintRotate]} numberOfLines={2}>
                  {rotate && zoom <= 1 ? '⟳  ' : ''}
                  {hintText}
                  <Text style={styles.hintChevron}>  ▾</Text>
                </Text>
              </Pressable>
            </Animated.View>
            {hintOpen ? null : (
              <Pressable onPress={toggleHint} style={styles.hintChip} accessibilityRole="button" accessibilityLabel="Show the zoom hint" hitSlop={8}>
                <Text style={styles.hintChipText}>?</Text>
              </Pressable>
            )}
          </View>
        ) : null}
        {badge && !fold.badgeInFoot ? (
          <Text style={styles.badge} numberOfLines={2}>
            {badge}
          </Text>
        ) : null}
        {/* The FOOT row: the dock's fold handle, and sideways the honesty
            badge on one line beside it (the row has the width; a disclosure
            that costs the drawing nothing). The handle is a slim tab on the
            dock's top edge: folded, it is all that is left of the dock —
            still docked at the bottom, one tap from the lane. It steps aside
            while a tray holds the dock up. */}
        {controls || (fold.badgeInFoot && badge) ? (
          <View style={styles.foot}>
            {fold.badgeInFoot && badge ? (
              <Text style={styles.badgeInFoot} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.95}>
                {badge}
              </Text>
            ) : (
              <View style={styles.footSpacer} />
            )}
            {controls && overlayLift <= 0 ? (
              <Pressable
                onPress={toggleDock}
                style={styles.dockHandle}
                hitSlop={{ top: 6, bottom: 2, left: 12, right: 12 }}
                accessibilityRole="button"
                accessibilityState={{ expanded: dockUp }}
                accessibilityLabel={dockUp ? 'Fold the controls away' : 'Show the controls'}
              >
                <Text style={styles.dockHandleText}>{dockUp ? '▾  HIDE CONTROLS' : '▴  CONTROLS'}</Text>
              </Pressable>
            ) : null}
          </View>
        ) : null}
        {overlay ? (
          <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
            {overlay}
          </View>
        ) : null}
        {/* Rendered AFTER the overlay so the lifted dock sits on top of the
            tray's backdrop, not under it. */}
        {controls && dockUp ? (
          <Animated.View style={[styles.controls, { transform: [{ translateY: liftAnim }] }]}>{controls}</Animated.View>
        ) : null}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.screenBg },
  bar: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 12, paddingBottom: 8 },
  barLandscape: { gap: 8, paddingBottom: 4 },
  title: { fontFamily: fonts.oswaldSemiBold, fontSize: 13, letterSpacing: 1.6, color: colors.textSubAlt, flexShrink: 1, maxWidth: '32%' },
  titleLandscape: { maxWidth: '18%' },
  zooms: { flex: 1, flexDirection: 'row', justifyContent: 'center', gap: 6 },
  // Beside the readouts the zoom row keeps its own width — the strip's
  // cells are flexible and would otherwise squeeze 2× and 3× off the bar.
  zoomsTight: { flexGrow: 0, flexShrink: 0, flexBasis: 'auto', gap: 4 },
  zoomBtn: {
    minWidth: 48,
    minHeight: 40,
    paddingHorizontal: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#2c2c33',
    backgroundColor: '#101114',
    alignItems: 'center',
    justifyContent: 'center',
  },
  zoomBtnLandscape: { minWidth: 40, paddingHorizontal: 6 },
  zoomBtnOn: { borderColor: colors.amber, backgroundColor: '#1d1709' },
  zoomText: { fontFamily: fonts.oswaldSemiBold, fontSize: 15, color: colors.textSubAlt },
  zoomTextOn: { color: colors.amber },
  barReadouts: { flexGrow: 1, flexShrink: 1, flexBasis: 0, minWidth: 0, borderRadius: 8, overflow: 'hidden' },
  close: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: '#1b1c20' },
  closeText: { fontSize: 20, color: colors.textSecondary },
  stack: { flex: 1 },
  readouts: { paddingHorizontal: 8, paddingBottom: 4 },
  controls: { paddingTop: 0 },
  foot: { flexDirection: 'row', alignItems: 'center', minHeight: 22, paddingHorizontal: 10, gap: 8 },
  footSpacer: { flex: 1 },
  badgeInFoot: { flex: 1, fontFamily: fonts.oswaldMedium, fontSize: 9.5, letterSpacing: 0.5, color: colors.textSubAlt },
  dockHandle: { minHeight: 22, paddingHorizontal: 14, justifyContent: 'center' },
  dockHandleText: { fontFamily: fonts.oswaldSemiBold, fontSize: 10.5, letterSpacing: 1.4, color: colors.textSubAlt },
  body: { flex: 1, borderTopWidth: 1, borderBottomWidth: 1, borderColor: '#2c2c33', backgroundColor: '#0b0c0e' },
  center: { flexGrow: 1, alignItems: 'center', justifyContent: 'center' },
  vCenter: { flexGrow: 1, justifyContent: 'center' },
  hintWrap: { alignItems: 'center', minHeight: 8 },
  hintRoll: { overflow: 'hidden', alignSelf: 'stretch' },
  hint: { fontFamily: fonts.barlowRegular, fontSize: 13, color: colors.textSub, textAlign: 'center', paddingTop: 8, paddingHorizontal: 12 },
  hintRotate: { color: colors.textSecondary },
  hintChevron: { color: colors.textSubAlt, fontSize: 12 },
  hintChip: { marginTop: 4, width: 26, height: 22, borderRadius: 11, borderWidth: 1, borderColor: '#2c2c33', backgroundColor: '#101114', alignItems: 'center', justifyContent: 'center' },
  hintChipText: { fontFamily: fonts.oswaldSemiBold, fontSize: 12, color: colors.textSubAlt },
  badge: { fontFamily: fonts.oswaldMedium, fontSize: 11.5, letterSpacing: 0.8, color: colors.textSubAlt, textAlign: 'center', paddingTop: 4, paddingHorizontal: 12 },
});
