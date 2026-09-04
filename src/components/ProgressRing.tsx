/**
 * ProgressRing — a small radial progress indicator (SVG), following the same
 * react-native-svg idiom as CredentialBadge / GalleryScreen's BadgeDisc.
 * Used by the Achievements "waiting slot" to show how close the next credential
 * is to completion. `progress` is 0..1, or null for an indeterminate "—" state.
 */
import Svg, { Circle } from 'react-native-svg';
import { StyleSheet, Text, View } from 'react-native';
import { fonts } from '../theme/tokens';

export function ProgressRing({
  size = 48,
  strokeWidth = 4,
  progress,
  color,
  trackColor = '#2a2a2a',
  centerLabel,
}: {
  size?: number;
  strokeWidth?: number;
  /** 0..1, or null for the indeterminate "—" (track only). */
  progress: number | null;
  color: string;
  trackColor?: string;
  centerLabel?: string;
}) {
  const r = (size - strokeWidth) / 2;
  const cx = size / 2;
  const circumference = 2 * Math.PI * r;
  const clamped = progress == null ? 0 : Math.max(0, Math.min(1, progress));
  const offset = circumference * (1 - clamped);

  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size}>
        <Circle cx={cx} cy={cx} r={r} stroke={trackColor} strokeWidth={strokeWidth} fill="none" />
        {progress != null ? (
          <Circle
            cx={cx}
            cy={cx}
            r={r}
            stroke={color}
            strokeWidth={strokeWidth}
            fill="none"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            transform={`rotate(-90 ${cx} ${cx})`}
          />
        ) : null}
      </Svg>
      {centerLabel ? (
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
          <View style={styles.center}>
            <Text style={[styles.label, { color }]} numberOfLines={1}>
              {centerLabel}
            </Text>
          </View>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  label: { fontFamily: fonts.mono, fontSize: 10 },
});
