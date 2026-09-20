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
import { StudioButton } from '../../components/StudioButton';
import { CredentialBadge, type CredentialKind } from '../../components/CredentialBadge';
import { fetchAchievementsHub, type HubData } from '../../features/achievements/api';
import { TROPHY_CASE_EMPTY } from '../../features/celebration/catalog';
import { ScreenIntroOverlay } from '../../features/intro/ScreenIntroOverlay';

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

function RecentStrip({
  children,
  empty,
  loading,
  emptyLabel,
}: {
  children: ReactNode;
  empty: boolean;
  loading?: boolean;
  /** Owner copy 2026-09-18 — each category says what WILL appear here, rather
   *  than all three sharing one generic "nothing earned yet". */
  emptyLabel: string;
}) {
  // While loading, render the same-height placeholder row (no text) so the
  // cards don't jump taller once the data lands (Bug+Hater night A1-04).
  if (loading || empty) {
    return (
      <View style={styles.stripEmpty}>
        <View style={styles.miniPlaceholder} />
        {loading ? null : <Text style={styles.emptyText}>{emptyLabel}</Text>}
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
  // Distinguish a failed fetch (offline/blip) from a genuinely empty trophy
  // case: a rejection used to leave all three strips in a permanent skeleton
  // with no error and no retry (launch audit 2026-09-09).
  const [error, setError] = useState(false);

  const load = useCallback(() => {
    setError(false);
    fetchAchievementsHub()
      .then(setHub)
      .catch(() => setError(true)); // keep any hub already on screen; surface the error only when there's none
  }, []);

  useFocusEffect(useCallback(() => load(), [load]));

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
          <Text style={styles.title}>{TROPHY_CASE_EMPTY.title}</Text>
        </View>

        {/* Owner copy 2026-09-18. Sits above the error branch so the case still
            introduces itself when the counts cannot be read. */}
        <Text style={styles.tagline}>{TROPHY_CASE_EMPTY.tagline}</Text>
        <Text style={styles.intro}>{TROPHY_CASE_EMPTY.intro}</Text>

        {error && !hub ? (
          <View style={styles.errorCard}>
            <Text style={styles.errorText}>
              Couldn’t load this right now. Nothing you’ve earned is affected — check your connection and retry, and email info@proaudiotrainingacademy.com if it keeps failing.
            </Text>
            <View style={{ width: 180 }}>
              <StudioButton label="Retry" variant="secondary" small onPress={load} />
            </View>
          </View>
        ) : (
        <>
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
              {t ? `${t.earned} / ${t.total} COMPLETED` : '— / —'}
            </Text>
            <View style={styles.flex} />
            <Text style={styles.chevron}>›</Text>
          </View>
          <RecentStrip
            loading={!t}
            empty={!!t && t.recent.length === 0}
            emptyLabel={TROPHY_CASE_EMPTY.topics}
          >
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
          <RecentStrip
            loading={!c}
            empty={!!c && c.recent.length === 0}
            emptyLabel={TROPHY_CASE_EMPTY.certificates}
          >
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
              {/* COMPLETED, not EARNED — owner copy 2026-09-18. Certificates are
                  "earned", programs are "completed". */}
              {p ? `${p.earned} COMPLETED` : '—'}
            </Text>
            <View style={styles.flex} />
            <Text style={styles.chevron}>›</Text>
          </View>
          <RecentStrip
            loading={!p}
            empty={!!p && p.recent.length === 0}
            emptyLabel={TROPHY_CASE_EMPTY.programs}
          >
            {(p?.recent ?? []).map((cred) => (
              <MiniCredential key={cred.id} kind="program" />
            ))}
          </RecentStrip>
        </Pressable>

        {/* ── SHARING, NOT FEATURING (owner 2026-09-18) ───────────────────────
            The first draft of this section was headed FEATURED ACHIEVEMENT and
            said an accomplishment could be selected "to feature and share".
            Featuring does not exist and is not being built — the owner's ruling
            was "remove feature, user can only share" — so every trace of it is
            gone, heading included: that word WAS the promise.

            What is left is true today. Sharing is real and shipped: open any
            certificate or program and the share row offers the link, the QR as
            an image, and the printed certificate. */}
        <View style={styles.featured} accessibilityRole="summary">
          <Text style={styles.cardName}>{TROPHY_CASE_EMPTY.shareHead}</Text>
          <Text style={styles.featuredLead}>{TROPHY_CASE_EMPTY.shareLead}</Text>
          <Text style={styles.emptyText}>{TROPHY_CASE_EMPTY.shareHint}</Text>
        </View>
        </>
        )}
      </ScrollView>

      {/* Trophy-case intro (Pillar B, plan §3) — draft copy awaits owner
          ratification; hidden from real users while placeholder-tagged. */}
      <ScreenIntroOverlay introKey="awards" />
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
  tagline: {
    fontFamily: fonts.oswaldSemiBold,
    fontSize: 13,
    letterSpacing: 1.6,
    color: colors.amber,
    marginTop: 2,
  },
  intro: {
    fontFamily: fonts.barlowRegular,
    fontSize: 14,
    lineHeight: 21,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  featured: {
    backgroundColor: '#141414',
    borderWidth: 1,
    borderColor: colors.hairlineDim,
    borderRadius: 12,
    padding: 16,
    gap: 8,
  },
  featuredLead: {
    fontFamily: fonts.barlowMedium,
    fontSize: 14,
    lineHeight: 21,
    color: colors.textPrimary,
  },
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
  errorCard: {
    backgroundColor: '#161616',
    borderWidth: 1,
    borderColor: colors.hairlineDim,
    borderRadius: 12,
    padding: 20,
    gap: 14,
    alignItems: 'center',
  },
  errorText: { fontFamily: fonts.barlowRegular, fontSize: 14, lineHeight: 21, color: colors.textSub, textAlign: 'center' },
});
