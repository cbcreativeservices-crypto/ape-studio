/**
 * StageFullScreen — a Sound Systems display at the whole phone (owner
 * 2026-09-25: "the new lab has several screens with text too small to read …
 * these displays may need to be enlarged so the user can see them and make use
 * of them" → "do both - 9 pt minimum").
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
 */
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Modal } from '../../../components/DimModal';
import { colors, fonts } from '../../../theme/tokens';
import { StageAspectReport, type StageReport } from './stageAspect';

const ZOOMS = [1, 1.5, 2, 3] as const;

export function StageFullScreen({
  visible,
  onClose,
  render,
  badge,
}: {
  visible: boolean;
  onClose: () => void;
  render: (w: number, h: number) => ReactNode;
  badge?: string;
}) {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const [zoom, setZoom] = useState<number>(1);
  // Sideways, height is what limits the drawing: drop the hint line.
  const landscape = width > height;
  const [bodyH, setBodyH] = useState(0);
  // Every opening starts at the whole drawing.
  useEffect(() => {
    if (visible) setZoom(1);
  }, [visible]);

  // A StageFit drawing reports its aspect: then the canvas at every zoom is
  // the drawing's own shape. A drawing that paints the whole box itself
  // reports nothing and zooms as the plain box.
  const [shape, setShape] = useState<{ aspect: number; pad: number } | null>(null);
  const report = useMemo<StageReport>(
    () => ({
      aspect: (aspect: number, pad: number) =>
        setShape((cur) => (cur && cur.aspect === aspect && cur.pad === pad ? cur : { aspect, pad })),
      fixed: () => {},
    }),
    [],
  );

  const padX = 8;
  const fitW = Math.max(120, width - insets.left - insets.right - padX * 2);
  const fitH = Math.max(120, (bodyH || height * 0.7) - 8);
  let baseW = fitW;
  let baseH = fitH;
  if (shape) {
    const drawW = Math.min(fitW - shape.pad * 2, (fitH - shape.pad * 2) * shape.aspect);
    baseW = drawW + shape.pad * 2;
    baseH = drawW / shape.aspect + shape.pad * 2;
  }
  const w = Math.round(baseW * zoom);
  const h = Math.round(baseH * zoom);

  return (
    <Modal visible={visible} animationType="fade" onRequestClose={onClose} statusBarTranslucent>
      <View style={[styles.root, { paddingTop: insets.top + 6, paddingBottom: insets.bottom + 6, paddingLeft: insets.left, paddingRight: insets.right }]}>
        <View style={styles.bar}>
          <Text style={styles.title}>DISPLAY</Text>
          <View style={styles.zooms} accessibilityRole="radiogroup" accessibilityLabel="Zoom">
            {ZOOMS.map((z) => {
              const on = z === zoom;
              return (
                <Pressable
                  key={z}
                  onPress={() => setZoom(z)}
                  style={[styles.zoomBtn, on && styles.zoomBtnOn]}
                  hitSlop={4}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: on }}
                  accessibilityLabel={`Zoom ${z} times`}
                >
                  <Text style={[styles.zoomText, on && styles.zoomTextOn]}>{`${z}×`}</Text>
                </Pressable>
              );
            })}
          </View>
          <Pressable onPress={onClose} style={styles.close} hitSlop={10} accessibilityRole="button" accessibilityLabel="Close full screen">
            <Text style={styles.closeText}>✕</Text>
          </Pressable>
        </View>

        <View style={styles.body} onLayout={(e) => setBodyH(Math.round(e.nativeEvent.layout.height))}>
          {bodyH > 0 ? (
            // Two scrollers = drag in both directions once zoomed in. At 1×
            // the drawing fits and neither scrolls.
            <ScrollView
              key={`v${zoom}`}
              contentContainerStyle={styles.center}
              scrollEnabled={zoom > 1}
              showsVerticalScrollIndicator={zoom > 1}
            >
              <ScrollView
                horizontal
                contentContainerStyle={styles.center}
                scrollEnabled={zoom > 1}
                showsHorizontalScrollIndicator={zoom > 1}
              >
                <View style={{ width: w, height: h }}>
                  <StageAspectReport.Provider value={report}>{render(w, h)}</StageAspectReport.Provider>
                </View>
              </ScrollView>
            </ScrollView>
          ) : null}
        </View>

        {landscape ? null : (
          <Text style={styles.hint}>
            {zoom > 1 ? 'Drag to move around the drawing.' : 'Pick a zoom step to look closer. Turn the phone sideways for a wider view.'}
          </Text>
        )}
        {badge ? (
          <Text style={styles.badge} numberOfLines={landscape ? 1 : 2}>
            {badge}
          </Text>
        ) : null}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.screenBg },
  bar: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 12, paddingBottom: 8 },
  title: { fontFamily: fonts.oswaldSemiBold, fontSize: 13, letterSpacing: 1.6, color: colors.textSubAlt },
  zooms: { flex: 1, flexDirection: 'row', justifyContent: 'center', gap: 6 },
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
  zoomBtnOn: { borderColor: colors.amber, backgroundColor: '#1d1709' },
  zoomText: { fontFamily: fonts.oswaldSemiBold, fontSize: 15, color: colors.textSubAlt },
  zoomTextOn: { color: colors.amber },
  close: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: '#1b1c20' },
  closeText: { fontSize: 20, color: colors.textSecondary },
  body: { flex: 1, borderTopWidth: 1, borderBottomWidth: 1, borderColor: '#2c2c33', backgroundColor: '#0b0c0e' },
  center: { flexGrow: 1, alignItems: 'center', justifyContent: 'center' },
  hint: { fontFamily: fonts.barlowRegular, fontSize: 13, color: colors.textSub, textAlign: 'center', paddingTop: 8, paddingHorizontal: 12 },
  badge: { fontFamily: fonts.oswaldMedium, fontSize: 11.5, letterSpacing: 0.8, color: colors.textSubAlt, textAlign: 'center', paddingTop: 4, paddingHorizontal: 12 },
});
