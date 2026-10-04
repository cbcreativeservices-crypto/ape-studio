/**
 * LabPhoto — a bundled photograph inside a lab card: the real object shown
 * ALONGSIDE the annotated drawing, never in place of it (owner 2026-09-25 —
 * the drawing carries the layer labels and the tap zones; the photo is what
 * the technician will see on the bench). Sources are bundled WebP under
 * assets/lab-art/, converted from the owner's exports at 1024 px wide.
 */
import type { ComponentType } from 'react';
import { Image, StyleSheet, Text, View, type ImageStyle, type StyleProp, type ViewStyle } from 'react-native';
import { requireOptionalNativeModule } from 'expo-modules-core';
import { colors, fonts } from '../../../theme/tokens';

/**
 * expo-image when its native module is in this binary (perf hunt 2026-10-03),
 * else RN Image — the TrophyImage / CardArt guard. A 1024-px photo decodes to
 * ~3 MB, over the size React Native's iOS image cache keeps, so RN Image
 * decoded it again on every page visit; expo-image holds the decoded photo in
 * memory, so paging back shows it at once.
 */
type ExpoImageComp = ComponentType<{
  source?: number;
  style?: StyleProp<ImageStyle>;
  contentFit?: 'cover' | 'contain';
  cachePolicy?: 'none' | 'disk' | 'memory' | 'memory-disk';
  transition?: number;
  accessible?: boolean;
  accessibilityIgnoresInvertColors?: boolean;
}>;
const EXPO_IMAGE: ExpoImageComp | null = (() => {
  try {
    if (!requireOptionalNativeModule('ExpoImage')) return null;
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const lib = require('expo-image') as { Image?: ExpoImageComp };
    return lib.Image ?? null;
  } catch {
    return null;
  }
})();

export function LabPhoto({ source, aspect, label, caption, style }: { source: number; aspect: number; label: string; caption?: string; style?: StyleProp<ViewStyle> }) {
  return (
    <View style={[styles.wrap, style]}>
      {/* The FRAME owns the size (width from the parent, height from the
          aspect ratio) and the image fills it. Putting `aspectRatio` on the
          Image itself does not work on web: a bundled asset arrives with its
          own pixel height (e.g. 765) applied ahead of the style, and an
          explicit height beats aspect-ratio — the photo rendered 765 px tall
          on a 317 px wide phone card (found 2026-09-25). */}
      <View style={[styles.frame, { aspectRatio: aspect }]} accessible accessibilityRole="image" accessibilityLabel={`Photo: ${label}`}>
        {EXPO_IMAGE ? (
          <EXPO_IMAGE source={source} style={styles.img} contentFit="cover" cachePolicy="memory" transition={0} accessible={false} accessibilityIgnoresInvertColors />
        ) : (
          <Image source={source} style={styles.img} resizeMode="cover" accessibilityIgnoresInvertColors />
        )}
      </View>
      {caption ? <Text style={styles.caption}>{caption}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignSelf: 'stretch', gap: 4 },
  frame: { width: '100%', borderRadius: 10, overflow: 'hidden', backgroundColor: '#e6e6e6' },
  img: { width: '100%', height: '100%' },
  caption: { color: colors.amberLabel, fontFamily: fonts.oswaldMedium, fontSize: 9.5, letterSpacing: 1.6 },
});
