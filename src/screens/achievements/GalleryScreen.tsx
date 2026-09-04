/**
 * S9 — Achievement Gallery (LOCKED June 7; visuals from 16-s9-gallery.dc.html):
 * earned only, newest first, 2-column cards — 48px course-color vinyl disc,
 * topic name, "COURSE · DATE" mono. Card borders/glow in the course color.
 * Tap → Trophy (entry=gallery). Empty: "Earn your first trophy to see it
 * here." Bottom nav visible (nested in the Achievements tab stack).
 */
import { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { colors, fonts } from '../../theme/tokens';
import { TrophyImage } from '../../components/TrophyImage';
import { fetchGalleryV3, type GalleryEntry } from '../../features/achievements/api';

function BadgeDisc({ color }: { color: string }) {
  // Design: radial rings — dark core, color ring, dark band, color ring, dark rim.
  return (
    <Svg width={48} height={48} viewBox="0 0 48 48">
      <Circle cx={24} cy={24} r={24} fill="#122030" />
      <Circle cx={24} cy={24} r={16} fill="none" stroke={color} strokeWidth={3} />
      <Circle cx={24} cy={24} r={10.5} fill="none" stroke={color} strokeWidth={2.5} opacity={0.85} />
      <Circle cx={24} cy={24} r={4.5} fill="#0b0b0b" />
    </Svg>
  );
}

function fmtDate(iso: string): string {
  const d = new Date(iso);
  return d
    .toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    .toUpperCase();
}

export function GalleryScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const [entries, setEntries] = useState<GalleryEntry[] | null>(null);

  useFocusEffect(
    useCallback(() => {
      fetchGalleryV3()
        .then(setEntries)
        .catch(() => setEntries([]));
    }, []),
  );

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.headerRow}>
          <Pressable
            onPress={() => (navigation as any).goBack()}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel="Back"
            style={styles.backBtn}
          >
            <Text style={styles.back}>‹</Text>
          </Pressable>
          <Text style={styles.title}>YOUR GALLERY</Text>
        </View>

        {entries && entries.length === 0 && (
          <Text style={styles.empty}>Earn your first trophy to see it here.</Text>
        )}

        <View style={styles.grid}>
          {(entries ?? []).map((e) => (
            <Pressable accessibilityRole="button"
              key={e.achievementId}
              style={[styles.card, { borderColor: `${e.color}66`, shadowColor: e.color }]}
              onPress={() =>
                (navigation as any).navigate('Trophy', {
                  topicName: e.name,
                  achievementId: e.achievementId,
                  badgeEarned: false,
                  entrySource: 'gallery',
                })
              }
            >
              <TrophyImage
                iconUrl={e.iconUrl}
                size={48}
                radius={8}
                fallback={<BadgeDisc color={e.color} />}
              />
              <Text style={styles.cardName}>{e.name.toUpperCase()}</Text>
              <Text style={styles.cardMeta}>
                {e.subject} · {fmtDate(e.dateEarned)}
              </Text>
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.screenBg },
  scroll: { padding: 16, gap: 14 },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  backBtn: { alignSelf: 'center' },
  back: { fontFamily: fonts.oswaldSemiBold, fontSize: 28, lineHeight: 28, color: colors.textSub, marginRight: -2 },
  title: { fontFamily: fonts.oswaldSemiBold, fontSize: 18, letterSpacing: 1.4, color: colors.textPrimary },
  empty: { fontFamily: fonts.barlowRegular, fontSize: 14, color: colors.textSub, marginTop: 8 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  card: {
    width: '48%',
    backgroundColor: '#181818',
    borderWidth: 1,
    borderRadius: 10,
    padding: 14,
    gap: 10,
    shadowOpacity: 0.35,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 0 },
  },
  cardName: { fontFamily: fonts.oswaldSemiBold, fontSize: 13, letterSpacing: 0.5, color: colors.textPrimary },
  cardMeta: { fontFamily: fonts.mono, fontSize: 11, color: '#777777' },
});
