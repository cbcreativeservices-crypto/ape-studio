/**
 * LabPhoto — a bundled photograph inside a lab card: the real object shown
 * ALONGSIDE the annotated drawing, never in place of it (owner 2026-09-25 —
 * the drawing carries the layer labels and the tap zones; the photo is what
 * the technician will see on the bench). Sources are bundled WebP under
 * assets/lab-art/, converted from the owner's exports at 1024 px wide.
 */
import { Image, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { colors, fonts } from '../../../theme/tokens';

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
        <Image source={source} style={styles.img} resizeMode="cover" accessibilityIgnoresInvertColors />
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
