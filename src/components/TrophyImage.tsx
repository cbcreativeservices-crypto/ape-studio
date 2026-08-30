/**
 * TrophyImage — renders a topic's trophy art from achievements.icon_url, with
 * a graceful fallback to the previous placeholder box when the URL is absent
 * OR the image fails to load. icon_url is stored as "<bucket>/<filename>"
 * (e.g. "trophy-icons/Microphones.png") in a PUBLIC Supabase Storage bucket,
 * so the public object URL is deterministic — no signed-URL round-trip.
 *
 * Fallback matters: icon_url may be set before the PNG is actually uploaded
 * (see the trophy-icons upload step), so a missing object must degrade to the
 * placeholder rather than showing a broken image.
 */
import { useState, type ReactNode } from 'react';
import { Image, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { SUPABASE_URL } from '../lib/env';

/** Build the public object URL for an achievements.icon_url value. */
export function trophyIconUrl(iconUrl: string | null | undefined): string | null {
  if (!iconUrl) return null;
  // Encode each path segment (filenames contain spaces) but keep the slashes.
  const encoded = iconUrl.split('/').map(encodeURIComponent).join('/');
  return `${SUPABASE_URL}/storage/v1/object/public/${encoded}`;
}

export function TrophyImage({
  iconUrl,
  size,
  radius = 10,
  fill = false,
  style,
  fallback,
}: {
  iconUrl: string | null | undefined;
  /** Fixed square size; ignored when `fill` (fills the parent instead). */
  size?: number;
  radius?: number;
  /** Fill the parent container (for percentage-sized cells like the grid). */
  fill?: boolean;
  style?: StyleProp<ViewStyle>;
  /** Rendered when there's no URL or the image errors (e.g. the placeholder). */
  fallback: ReactNode;
}) {
  const [failed, setFailed] = useState(false);
  const url = trophyIconUrl(iconUrl);

  if (!url || failed) {
    return <>{fallback}</>;
  }

  const box: ViewStyle = fill
    ? { width: '100%', height: '100%', borderRadius: radius, overflow: 'hidden' }
    : { width: size, height: size, borderRadius: radius, overflow: 'hidden' };

  return (
    <View style={[box, style]}>
      <Image
        accessible={false}
        importantForAccessibility="no"
        source={{ uri: url }}
        style={styles.img}
        resizeMode="contain"
        onError={() => setFailed(true)}
        accessibilityIgnoresInvertColors
      />
    </View>
  );
}

const styles = StyleSheet.create({
  img: { width: '100%', height: '100%' },
});
