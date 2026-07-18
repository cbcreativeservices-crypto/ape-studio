/**
 * BrandLogo — app icon tile (design-reference BrandLogo.dc.html).
 * brand-logo.png is 1254×1254; rendered contained at `size`.
 * Note: this export is opaque (black corners) — fine on the near-black
 * surfaces it sits on; request a transparent RGBA version for light surfaces.
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
