/**
 * WebsiteLinks — "ON THE WEBSITE" on the Profile screen (owner 2026-11-01):
 * direct links to the website pages a learner shows other people — the
 * employer page (what Academy training means, how a credential is earned) and
 * credential verification — plus the mission, the founder and how credentials work.
 * The list and its public-page rule live in siteLinkList.ts.
 *
 * Shown to everyone, guest or member: none of these is an upsell.
 */
import { useState } from 'react';
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { websiteUrl } from '../commercial/brand';
import { colors, fonts } from '../../theme/tokens';
import { WEBSITE_LINKS, websiteLink } from './siteLinkList';

export function WebsiteLinks() {
  const [failed, setFailed] = useState<string | null>(null);

  return (
    <View style={styles.wrap}>
      <View style={styles.statusRow}>
        <View style={styles.dot} />
        <Text style={styles.label}>ON THE WEBSITE</Text>
      </View>
      {WEBSITE_LINKS.map(([path, title, blurb]) => (
        <Pressable
          key={path}
          style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
          // A blocked or missing browser must not be an unhandled rejection
          // (2026-09-30 bug pass): say where to go instead.
          onPress={() => {
            setFailed(null);
            void Linking.openURL(websiteLink(path)).catch(() => setFailed(path));
          }}
          accessibilityRole="link"
          accessibilityLabel={`${title.toLowerCase()}, opens the website. ${blurb}`}
        >
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.blurb}>{blurb}</Text>
          </View>
          <Text style={styles.chevron}>↗</Text>
        </Pressable>
      ))}
      {failed ? (
        <Text style={styles.warn}>
          Couldn’t open the website — visit {websiteUrl().replace(/^https?:\/\//, '')}/{failed} in your browser.
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  // Matches the LowLight / Audio Output row surface it sits beside.
  wrap: {
    borderRadius: 12,
    backgroundColor: '#141414',
    borderWidth: 1,
    borderColor: '#262626',
    paddingVertical: 11,
    paddingHorizontal: 14,
    gap: 4,
  },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 2 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.amber },
  label: { fontFamily: fonts.oswaldSemiBold, fontSize: 12, letterSpacing: 1.4, color: '#8a8c90' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 9,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#262626',
  },
  rowPressed: { opacity: 0.6 },
  title: { fontFamily: fonts.oswaldSemiBold, fontSize: 13, letterSpacing: 1.1, color: colors.textPrimary },
  blurb: { fontFamily: fonts.barlowRegular, fontSize: 12, lineHeight: 16, color: colors.textMuted, marginTop: 1 },
  chevron: { fontFamily: fonts.oswaldSemiBold, fontSize: 16, color: colors.amber },
  warn: { fontFamily: fonts.barlowRegular, fontSize: 12, lineHeight: 16, color: colors.amber, marginTop: 4 },
});
