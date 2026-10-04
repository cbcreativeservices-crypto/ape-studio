/**
 * S9 — Achievement Gallery (LOCKED June 7; visuals from 16-s9-gallery.dc.html):
 * earned only, newest first, 2-column cards — 48px course-color vinyl disc,
 * topic name, "COURSE · DATE" mono. Card borders/glow in the course color.
 * Tap → Trophy (entry=gallery). Empty: "Earn your first trophy to see it
 * here." Bottom nav visible (nested in the Achievements tab stack).
 */
import { useCallback, useMemo, useRef, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { colors, fonts } from '../../theme/tokens';
import { gridColumns } from '../../theme/tablet';
import { TrophyImage } from '../../components/TrophyImage';
import { StudioButton } from '../../components/StudioButton';
import { fetchGalleryV3, type GalleryEntry } from '../../features/achievements/api';
import { safeGoBack } from '../../lib/safeGoBack';

// A row item is either a trophy entry or the odd-row-padding spacer sentinel.
type GalleryRow = GalleryEntry | '__spacer__';

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
  // [10] (2026-09-07): guard a bad/missing date (matches Topics/AwardProgress).
  if (Number.isNaN(d.getTime())) return '';
  return d
    .toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    .toUpperCase();
}

export function GalleryScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const [entries, setEntries] = useState<GalleryEntry[] | null>(null);
  // Distinguish a failed fetch from a genuinely empty gallery: a rejection used
  // to collapse into "Earn your first trophy to see it here", telling a member
  // who has earned trophies they've earned nothing (error-vs-empty class the
  // launch audit fixed on Home/CredentialWall/Topics but missed here).
  const [loadError, setLoadError] = useState(false);
  const entriesRef = useRef(entries);
  entriesRef.current = entries;
  /** The last load that landed FAILED (its [] is the error card's, not a
   *  read). See the LOADING face in load(). */
  const failedRef = useRef(false);
  // ONE EXIT for ‹ (night bug pass 3, 2026-10-01): a double tap's second
  // goBack() from the popped route bubbled up and switched to the Home tab.
  // safeGoBack alone guards it (focus check + its time window); the old
  // one-way latch on top left ‹ dead for good if a leave ever did not go
  // through (final round B, 2026-10-02).
  const leave = useCallback(() => {
    safeGoBack(navigation as any);
  }, [navigation]);

  // NEWEST LOAD WINS (hunt 5, 2026-10-03; pattern P2). This runs on every
  // focus (a tab switch away and back keeps this screen mounted) and on Retry;
  // an OLDER load's late rejection landed after a newer one had loaded an
  // empty gallery and swapped it for the error card, and an older answer
  // could replace a newer one.
  const loadTicket = useRef(0);
  const load = useCallback(() => {
    const ticket = ++loadTicket.current;
    setLoadError(false);
    // Back to the LOADING face while nothing is on screen (hunt 8,
    // 2026-10-03): RETRY from the error card left `entries` at [] with the
    // error cleared, so the read in flight showed "No trophies yet — Earn
    // your first trophy" to a member whose gallery simply had not loaded.
    if (failedRef.current) setEntries(null);
    fetchGalleryV3()
      .then((e) => {
        if (ticket !== loadTicket.current) return;
        failedRef.current = false;
        setEntries(e);
      })
      .catch(() => {
        if (ticket !== loadTicket.current) return;
        // KEEP WHAT IS ON SCREEN (bug pass 1, 2026-09-30). This runs on every
        // focus — including the way BACK from a trophy opened here — so one
        // offline refetch replaced a gallery of earned trophies with an error
        // card. Same rule as AchievementsHome: the error is for the empty
        // state only.
        if (entriesRef.current && entriesRef.current.length > 0) return;
        setEntries([]);
        failedRef.current = true;
        setLoadError(true);
      });
  }, []);

  useFocusEffect(useCallback(() => load(), [load]));

  // Columns (owner 2026-09-29, tablet pass): two on a phone, as always; a
  // tablet gains columns instead of stretching each trophy card ~490 pt wide
  // around a 48 pt badge. 16 pt scroll padding each side, 12 pt row gap.
  const { width: winW } = useWindowDimensions();
  const cols = gridColumns(winW - 32, 220, 12, 2, 4);
  // Pad to a full last row so a lone trailing card keeps its column width
  // (flex:1 would otherwise stretch it across the row). Spacers render nothing.
  const SPACER = '__spacer__';
  const data = useMemo<GalleryRow[]>(() => {
    const list: GalleryRow[] = entries ?? [];
    const short = (cols - (list.length % cols)) % cols;
    return short ? [...list, ...Array<GalleryRow>(short).fill(SPACER)] : list;
  }, [entries, cols]);

  const renderItem = useCallback(
    ({ item }: { item: GalleryRow }) => {
      if (item === SPACER) return <View style={styles.spacer} />;
      const e = item;
      return (
      <Pressable
        accessibilityRole="button"
        style={[styles.card, { borderColor: `${colors.amber}66`, shadowColor: colors.amber }]}
        onPress={() =>
          (navigation as any).navigate('Trophy', {
            topicName: e.name,
            achievementId: e.achievementId,
            entrySource: 'gallery',
          })
        }
      >
        <TrophyImage
          iconUrl={e.iconUrl}
          size={48}
          radius={8}
          fallback={<BadgeDisc color={colors.amber} />}
        />
        <Text style={styles.cardName}>{e.name.toUpperCase()}</Text>
        <Text style={styles.cardMeta}>
          {e.subject} · {fmtDate(e.dateEarned)}
        </Text>
      </Pressable>
      );
    },
    [navigation],
  );

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <FlatList
        data={data}
        keyExtractor={(item, i) => (item === SPACER ? `spacer-${i}` : item.achievementId)}
        renderItem={renderItem}
        // numColumns cannot change on a mounted FlatList: re-key on rotation.
        key={`cols-${cols}`}
        numColumns={cols}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.scroll}
        // Windowing: keep memory bounded when a user has earned many trophies.
        initialNumToRender={10}
        maxToRenderPerBatch={10}
        windowSize={7}
        removeClippedSubviews
        ListHeaderComponent={
          <View style={styles.headerRow}>
            <Pressable
              onPress={leave}
              hitSlop={10}
              accessibilityRole="button"
              accessibilityLabel="Back"
              style={styles.backBtn}
            >
              <Text style={styles.back}>‹</Text>
            </Pressable>
            <Text style={styles.title}>YOUR GALLERY</Text>
          </View>
        }
        ListEmptyComponent={
          entries && entries.length === 0 ? (
            loadError ? (
              <View style={styles.errorCard}>
                <Text style={styles.errorText}>
                  Couldn’t load this right now. Nothing you’ve earned is affected — check your connection and retry, and email info@proaudiotrainingacademy.com if it keeps failing.
                </Text>
                <View style={{ width: 180 }}>
                  <StudioButton label="Retry" variant="secondary" small onPress={load} />
                </View>
              </View>
            ) : (
              // A real empty state (owner 2026-09-29, tablet pass): one grey
              // line in the corner of an iPad-sized screen read as broken. An
              // empty vinyl disc in the gallery's own language, what fills it,
              // and the way there.
              <View style={styles.emptyWrap}>
                <Svg width={112} height={112} viewBox="0 0 112 112" accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
                  <Circle cx={56} cy={56} r={54} fill="#15161b" stroke="#34363f" strokeWidth={2} />
                  <Circle cx={56} cy={56} r={44} fill="none" stroke="#24262d" strokeWidth={1.2} />
                  <Circle cx={56} cy={56} r={35} fill="none" stroke="#24262d" strokeWidth={1.2} />
                  <Circle cx={56} cy={56} r={18} fill={colors.amber} opacity={0.35} />
                  <Circle cx={56} cy={56} r={3.5} fill="#0b0b0e" />
                </Svg>
                <Text style={styles.emptyTitle}>No trophies yet</Text>
                <Text style={styles.empty}>Earn your first trophy to see it here — pass a topic quiz and it lands in this gallery, newest first.</Text>
                <View style={{ width: 220, marginTop: 6 }}>
                  <StudioButton label="Start studying" small onPress={() => (navigation as { navigate: (n: string) => void }).navigate('Study')} />
                </View>
              </View>
            )
          ) : null
        }
      />
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
  empty: { fontFamily: fonts.barlowRegular, fontSize: 14, lineHeight: 20, color: colors.textSub, textAlign: 'center', maxWidth: 360 },
  emptyWrap: { alignItems: 'center', gap: 10, paddingTop: 72, paddingHorizontal: 24 },
  emptyTitle: { fontFamily: fonts.oswaldSemiBold, fontSize: 18, letterSpacing: 1, color: colors.textPrimary, marginTop: 6 },
  errorCard: {
    backgroundColor: '#161616',
    borderWidth: 1,
    borderColor: colors.hairlineDim,
    borderRadius: 12,
    padding: 20,
    gap: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  errorText: { fontFamily: fonts.barlowRegular, fontSize: 14, lineHeight: 21, color: colors.textSub, textAlign: 'center' },
  row: { gap: 12 },
  spacer: { flex: 1 },
  card: {
    flex: 1,
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
