/**
 * BrandLogo — app icon tile (design-reference BrandLogo.dc.html).
 * brand-logo.png is 1254×1254; rendered contained at `size`.
 * The area OUTSIDE the gold rounded frame is transparent (user request
 * 2026-07-18); everything inside the frame is unchanged. Safe on any surface.
 */
import { Image, StyleSheet } from 'react-native';

export function BrandLogo({ size = 120 }: { size?: number }) {
  return (
    <Image
      source={require('../../assets/brand-logo.png')}
      style={[styles.img, { width: size, height: size }]}
      resizeMode="contain"
      accessibilityLabel="Pro Audio Training Academy"
    />
  );
}

const styles = StyleSheet.create({
  img: { flexShrink: 0 },
});
