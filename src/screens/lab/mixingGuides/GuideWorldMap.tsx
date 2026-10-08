/**
 * GuideWorldMap — the world map pinned above the Mixing Guides list (owner
 * 2026-10-07/08: "show at the top of the Mixing (50) list and when a user
 * hovers over a music card it fills in and shows the country's location on
 * the map … filling in the country space will need to be animated").
 *
 * Two layers in one frame: the style's countries (fills, animated in), and the
 * owner's own Earth outline on top, so the borders stay exactly the owner's.
 * The stroke width is set in screen pixels (the outline is 1117 units wide,
 * drawn at phone width), so the borders stay visible at any size.
 *
 * What lights it (owner chose "press + scroll", map pinned):
 *   - a mouse / trackpad hover over a card (web, iPad);
 *   - a finger landing on a card;
 *   - while the learner drags the list, the card nearest the top.
 * The caption names the style and its countries in words, so the map is never
 * the only carrier of the information (the drawing itself is hidden from
 * screen readers; the caption is read).
 */
import { memo, useEffect, useRef, useState } from 'react';
import { Animated, Easing, Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, G, Path } from 'react-native-svg';
import { A11Y_HIDDEN } from '../../../features/settings/a11y';
import { useDecorativeMotion } from '../../../features/settings/decorativeMotion';
import { colors, fonts } from '../../../theme/tokens';
import { COUNTRIES, OUTLINE_D, WORLD_ASPECT, WORLD_VIEWBOX } from './data/worldMap';
import { STYLE_COUNTRIES, countryList } from './data/styleCountries';

const VIEW_W = 1117.51;
const FILL = '#e3a33a';

/** The outline never re-renders: 134 kB of path data drawn once. */
const Outline = memo(function Outline({ width, height }: { width: number; height: number }) {
  // ~0.7 px on screen whatever the drawn size.
  const stroke = (0.7 * VIEW_W) / width;
  return (
    <Svg width={width} height={height} viewBox={WORLD_VIEWBOX} style={StyleSheet.absoluteFill} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <Path d={OUTLINE_D} fill="none" stroke="rgba(214,218,226,0.55)" strokeWidth={stroke} strokeLinejoin="round" strokeLinecap="round" />
    </Svg>
  );
});

const Fills = memo(function Fills({ styleId, width, height }: { styleId: string | null; width: number; height: number }) {
  const codes = styleId ? STYLE_COUNTRIES[styleId] ?? [] : [];
  // A country too small to see filled at this size (Jamaica, Panama, Lebanon…)
  // also gets a ring: 7 px across on screen, whatever the drawn size.
  const px = VIEW_W / width;
  return (
    <Svg width={width} height={height} viewBox={WORLD_VIEWBOX} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <G fill={FILL}>
        {codes.map((c) => (COUNTRIES[c] ? <Path key={c} d={COUNTRIES[c].d} /> : null))}
      </G>
      {codes.map((c) => {
        const k = COUNTRIES[c];
        return k?.small ? <Circle key={`r${c}`} cx={k.c[0]} cy={k.c[1]} r={7 * px} fill="none" stroke={FILL} strokeWidth={1.6 * px} /> : null;
      })}
    </Svg>
  );
});

export function GuideWorldMap({
  activeId,
  activeTitle,
  width,
  touch,
  onHide,
}: {
  activeId: string | null;
  activeTitle: string | null;
  width: number;
  /** Words for a touch screen ("press") vs a pointer ("hover"). */
  touch: boolean;
  onHide: () => void;
}) {
  const height = Math.round(width / WORLD_ASPECT);
  const motion = useDecorativeMotion();
  // The fill layer shown, and its opacity: fade the old style out, swap, fade the new one in.
  const [shown, setShown] = useState<string | null>(activeId);
  const opacity = useRef(new Animated.Value(activeId ? 1 : 0)).current;
  const swap = useRef<Animated.CompositeAnimation | null>(null);

  useEffect(() => {
    if (activeId === shown) return;
    swap.current?.stop();
    if (!motion) {
      setShown(activeId);
      opacity.setValue(activeId ? 1 : 0);
      return;
    }
    const fadeIn = () => {
      setShown(activeId);
      if (!activeId) return;
      swap.current = Animated.timing(opacity, { toValue: 1, duration: 260, easing: Easing.out(Easing.cubic), useNativeDriver: true });
      swap.current.start();
    };
    swap.current = Animated.timing(opacity, { toValue: 0, duration: shown ? 110 : 0, easing: Easing.in(Easing.quad), useNativeDriver: true });
    swap.current.start(({ finished }) => {
      if (finished) fadeIn();
    });
  }, [activeId, shown, motion, opacity]);

  const caption = activeId && activeTitle
    ? `${activeTitle} — ${countryList(activeId)}`
    : touch
      ? 'Press a style, or scroll the list, to see where it comes from.'
      : 'Point at a style to see where it comes from.';

  return (
    <View style={styles.wrap}>
      <View style={[styles.frame, { width, height }]} {...A11Y_HIDDEN}>
        <Animated.View style={[StyleSheet.absoluteFill, { opacity }]}>
          <Fills styleId={shown} width={width} height={height} />
        </Animated.View>
        <Outline width={width} height={height} />
      </View>
      <View style={[styles.captionRow, { width }]}>
        <Text style={styles.caption} numberOfLines={2} accessibilityLiveRegion="polite">{caption}</Text>
        <Pressable onPress={onHide} hitSlop={8} accessibilityRole="button" accessibilityLabel="Hide the world map">
          <Text style={styles.hide}>Hide map</Text>
        </Pressable>
      </View>
    </View>
  );
}

/** The slim bar left when the map is hidden. */
export function ShowMapButton({ onShow }: { onShow: () => void }) {
  return (
    <Pressable onPress={onShow} style={styles.showBtn} hitSlop={8} accessibilityRole="button" accessibilityLabel="Show the world map">
      <Text style={styles.hide}>Show map ›</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', paddingHorizontal: 16, paddingBottom: 6, gap: 4 },
  frame: { borderRadius: 8, backgroundColor: '#15171b', overflow: 'hidden' },
  captionRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  caption: { flex: 1, color: colors.textSub, fontFamily: fonts.barlowMedium, fontSize: 12.5, lineHeight: 17 },
  hide: { color: colors.amberLabel, fontFamily: fonts.barlowMedium, fontSize: 12.5, lineHeight: 17 },
  showBtn: { alignSelf: 'flex-end', marginHorizontal: 16, marginBottom: 4 },
});
