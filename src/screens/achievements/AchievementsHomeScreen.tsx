/**
 * AchievementsHomeScreen — the "Trophy Case" hub (v3 redesign 2026-09-04).
 * Three category cards — Topics, Certificates, Programs — each showing its
 * earned count and a strip of the most-recent trophies, so progress in all
 * three shows the moment you land. Tapping a card drills into that category.
 * Replaces the old single 50-slot v1 grid (AchievementsScreen).
 *
 * Reached from the bottom tab OR the Profile "Trophies & records" link; the
 * latter passes `from: 'profile'` so a back-to-Profile chevron shows (owner
 * 2026-08-07).
 */
import { useCallback, useState, type ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { AchievementsStackParamList } from '../../navigation/types';
import { colors, fonts } from '../../theme/tokens';
import { TrophyImage } from '../../components/TrophyImage';
import { CredentialBadge, type CredentialKind } from '../../components/CredentialBadge';
import { fetchAchievementsHub, type HubData } from '../../features/achievements/api';

const MINI = 44;

function MiniTopic({ iconUrl }: { iconUrl: string | null }) {
  return (
    <View style={[styles.mini, { borderColor: `${colors.amber}55` }]}>
      <TrophyImage
        iconUrl={iconUrl}
        fill
        radius={6}
        fallback={<Text style={[styles.miniGlyph, { color: colors.amber }]}>★</Text>}
      />
    </View>
  );
}

function RecentStrip({ children, empty, loading }: { children: ReactNode; empty: boolean; loading?: boolean }) {
  // While loading, render the same-height placeholder row (no text) so the
  // cards don't jump taller once the data lands (Bug+Hater night A1-04).
  if (loading || empty) {
    return (
      <View style={styles.stripEmpty}>
        <View style={styles.miniPlaceholder} />
        {loading ? null : <Text style={styles.emptyText}>Nothing earned yet — tap to explore.</Text>}
      </View>
    );
  }
  return <View style={styles.strip}>{children}</View>;
}

export function AchievementsHomeScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const route = useRoute<RouteProp<AchievementsStackParamList, 'AchievementsHome'>>();
  const cameFromProfile = route.params?.from === 'profile';
  const [hub, setHub] = useState<HubData | null>(null);

  useFocusEffect(
    useCallback(() => {
      fetchAchievementsHub()
        .then(setHub)
        .catch(() => setHub(null));
    }, []),
  );

  const t = hub?.topics;
  const c = hub?.certificates;
  const p = hub?.programs;

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.headerRow}>
          {cameFromProfile ? (
            <Pressable
              onPress={() => {
                navigation.setParams({ from: undefined });
                navigation.navigate('Profile');
              }}
              hitSlop={10}
              accessibilityRole="button"
              accessibilityLabel="Back to profile"
              style={styles.backBtn}
            >
              <Text style={styles.back}>‹</Text>
            </Pressable>
          ) : null}
          <Text style={styles.title}>TROPHY CASE</Text>
        </View>

        {/* TOPICS */}
        <Pressable
          style={({ pressed }) => [styles.card, { borderColor: `${colors.amber}44` }, pressed && styles.cardPressed]}
          onPress={() => navigation.navigate('Topics')}
          accessibilityRole="button"
          accessibilityLabel={`Topics, ${t?.earned ?? 0} of ${t?.total ?? 0} earned`}
        >
          <View style={styles.cardHead}>
            <Text style={styles.cardName}>TOPICS</Text>
            <Text style={[styles.count, { color: colors.amber, textShadowColor: `${colors.amber}66` }]}>
              {t ? `${t.earned} / ${t.total}` : '— / —'}
            </Text>
            <View style={styles.flex} />
            <Text style={styles.chevron}>›</Text>
          </View>
          <RecentStrip loading={!t} empty={!!t && t.recent.length === 0}>
            {(t?.recent ?? []).map((topic) => (
              <MiniTopic key={topic.achievementId} iconUrl={topic.iconUrl} />
            ))}
          </RecentStrip>
        </Pressable>

        {/* CERTIFICATES */}
        <Pressable
          style={({ pressed }) => [styles.card, { borderColor: `${colors.cyan}44` }, pressed && styles.cardPressed]}
          onPress={() => navigation.navigate('Certificates')}
          accessibilityRole="button"
          accessibilityLabel={`Certificates, ${c?.earned ?? 0} earned`}
        >
          <View style={styles.cardHead}>
            <Text style={styles.cardName}>CERTIFICATES</Text>
            <Text style={[styles.count, { color: colors.cyan, textShadowColor: `${colors.cyan}66` }]}>
              {c ? `${c.earned} EARNED` : '—'}
            </Text>
            <View style={styles.flex} />
            <Text style={styles.chevron}>›</Text>
          </View>
          <RecentStrip loading={!c} empty={!!c && c.recent.length === 0}>
            {(c?.recent ?? []).map((cred) => (
              <MiniCredential key={cred.id} kind="certificate" />
            ))}
          </RecentStrip>
        </Pressable>

        {/* PROGRAMS */}
        <Pressable
          style={({ pressed }) => [styles.card, { borderColor: `${colors.programPurple}44` }, pressed && styles.cardPressed]}
          onPress={() => navigation.navigate('Programs')}
          accessibilityRole="button"
          accessibilityLabel={`Programs, ${p?.earned ?? 0} earned`}
        >
          <View style={styles.cardHead}>
            <Text style={styles.cardName}>PROGRAMS</Text>
            <Text style={[styles.count, { color: colors.programPurple, textShadowColor: `${colors.programPurple}66` }]}>
              {p ? `${p.earned} EARNED` : '—'}
            </Text>
            <View style={styles.flex} />
            <Text style={styles.chevron}>›</Text>
          </View>
          <RecentStrip loading={!p} empty={!!p && p.recent.length === 0}>
            {(p?.recent ?? []).map((cred) => (
              <MiniCredential key={cred.id} kind="program" />
            ))}
          </RecentStrip>
        </Pressable>
      </ScrollView>
    </View>
  );
}

function MiniCredential({ kind }: { kind: CredentialKind }) {
  return (
    <View style={styles.miniCred}>
      <CredentialBadge kind={kind} size={MINI} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.screenBg },
  scroll: { padding: 16, gap: 14 },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 2 },
  backBtn: { alignSelf: 'center' },
  back: { fontFamily: fonts.oswaldSemiBold, fontSize: 28, lineHeight: 28, color: colors.textSub, marginRight: -2 },
  title: { fontFamily: fonts.oswaldSemiBold, fontSize: 18, letterSpacing: 1.6, color: colors.textPrimary },
  flex: { flex: 1 },
  card: {
    backgroundColor: '#161616',
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    gap: 14,
  },
  cardPressed: { opacity: 0.85 },
  cardHead: { flexDirection: 'row', alignItems: 'baseline', gap: 10 },
  cardName: { fontFamily: fonts.oswaldSemiBold, fontSize: 15, letterSpacing: 1.4, color: colors.textPrimary },
  count: {
    fontFamily: fonts.mono,
    fontSize: 13,
    textShadowRadius: 6,
    textShadowOffset: { width: 0, height: 0 },
  },
  chevron: { fontFamily: fonts.oswaldSemiBold, fontSize: 20, color: colors.textSub },
  strip: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  stripEmpty: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  mini: {
    width: MINI,
    height: MINI,
    borderRadius: 8,
    borderWidth: 1,
    backgroundColor: '#0f0f0f',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  miniCred: { width: MINI, height: MINI, alignItems: 'center', justifyContent: 'center' },
  miniGlyph: { fontFamily: fonts.oswaldSemiBold, fontSize: 18 },
  miniPlaceholder: {
    width: MINI,
    height: MINI,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#242424',
    backgroundColor: '#111111',
    opacity: 0.6,
  },
  emptyText: { fontFamily: fonts.barlowRegular, fontSize: 13, color: colors.textSub, flex: 1 },
});
