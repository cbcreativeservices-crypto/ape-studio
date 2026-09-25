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
      <Image
        source={source}
        style={[styles.img, { aspectRatio: aspect }]}
        resizeMode="cover"
        accessibilityIgnoresInvertColors
        accessible
        accessibilityLabel={`Photo: ${label}`}
      />
      {caption ? <Text style={styles.caption}>{caption}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignSelf: 'stretch', gap: 4 },
  img: { width: '100%', borderRadius: 10, backgroundColor: '#e6e6e6' },
  caption: { color: colors.amberLabel, fontFamily: fonts.oswaldMedium, fontSize: 9.5, letterSpacing: 1.6 },
});
