/**
 * ChannelBadge — a member's initials on a small console-channel tile with a
 * status LED (owner-approved redesign 2026-11-01, mockup
 * Downloads/2026-11-01_COMMUNITY_CHAT_REDESIGN_MOCKUP.html).
 *
 * The LED encodes ONE fact per screen:
 *   Explore              green = accepts contact requests · off = does not
 *   Requests / thread    amber = waiting on you · green = open conversation
 *                        · off = sent, closed or blocked
 * A verified employer / instructor gets the steel tile.
 *
 * Decorative for screen readers: every row that uses it already says the
 * name and the state in its own label.
 */
import { StyleSheet, Text, View } from 'react-native';
import { colors, fonts } from '../../theme/tokens';

export type BadgeLed = 'green' | 'amber' | 'off';

export const STEEL = '#9fb4c8';

/** Up to two initials from a display name ("Harbor Sound Co." → "HS"). */
export function initialsOf(name: string): string {
  const words = name
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .split(/\s+/)
    .filter(Boolean);
  if (words.length === 0) return '·';
  const first = words[0][0] ?? '';
  const second = words.length > 1 ? words[1][0] ?? '' : words[0][1] ?? '';
  return (first + second).toUpperCase();
}

export function ChannelBadge({
  name,
  led,
  steel = false,
  size = 46,
}: {
  name: string;
  led: BadgeLed;
  /** A verified employer or instructor. */
  steel?: boolean;
  size?: number;
}) {
  const ledColor = led === 'green' ? colors.green : led === 'amber' ? colors.amber : '#3a3d47';
  return (
    <View
      style={[
        st.tile,
        { width: size, height: size, borderRadius: Math.round(size * 0.26) },
        steel && st.steel,
      ]}
      accessible={false}
      importantForAccessibility="no-hide-descendants"
    >
      <Text
        // Two initials at most (initialsOf), sized from the tile and not
        // scaled by system text size (the badge is decorative): it always fits.
        maxFontSizeMultiplier={1}
        style={[st.initials, { fontSize: Math.round(size * 0.35) }, steel && { color: STEEL }]}
      >
        {initialsOf(name)}
      </Text>
      <View
        style={[
          st.led,
          { backgroundColor: ledColor },
          led !== 'off' && { shadowColor: ledColor, shadowOpacity: 0.9, shadowRadius: 5, shadowOffset: { width: 0, height: 0 } },
        ]}
      />
    </View>
  );
}

const st = StyleSheet.create({
  tile: {
    backgroundColor: '#1b1d24',
    borderWidth: 1,
    borderColor: '#2e313b',
    alignItems: 'center',
    justifyContent: 'center',
  },
  steel: { borderColor: 'rgba(159,180,200,0.55)' },
  initials: { fontFamily: fonts.oswaldSemiBold, letterSpacing: 0.6, color: colors.textPrimary },
  led: {
    position: 'absolute',
    right: -3,
    top: -3,
    width: 11,
    height: 11,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#0b0c0f',
  },
});
