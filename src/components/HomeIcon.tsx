/**
 * HomeIcon — the amber house glyph (same bundled art as the Home nav tab) used
 * as the "add to Home screen" toggle so it clearly points to the Home screen
 * (user request 2026-07-22). filled = the item is on Home (full color); not
 * filled = dimmed. Replaced the SVG outline/fill with the shared PNG when the
 * nav icons became bundled images (owner 2026-08-13); the `color` prop is kept
 * for call-site compatibility but no longer tints the raster.
 */
import { Image } from 'react-native';

export function HomeIcon({ filled, size = 20 }: { color?: string; filled?: boolean; size?: number }) {
  return (
    <Image
      source={require('../../assets/icons/nav/nav-home.png')}
      style={{ width: size, height: size, opacity: filled ? 1 : 0.35 }}
      resizeMode="contain"
    />
  );
}
