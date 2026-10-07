/**
 * MixingGuidesHubScreen — route `MixingGuides` (owner 2026-10-07: "a written
 * reference … 50 different music styles … for mixing engineers to understand
 * and mix/balance/successfully make their audience get what they expect").
 *
 * The 50 styles in the owner's index order (ranked by listening reach — the
 * index has no families), on the same animated two-column push-button grid
 * as the Labs menu and the Miking family hubs (GlassTile / GlassPanel: two
 * across on a phone; on a tablet the menu takes the width — three across,
 * four once the window is landscape-wide, as EarLabScreen does). A quick
 * filter narrows the grid by style name, mix priority or origin.
 *
 * Each tile: number, style, its "mix priority #1" line and ✓ READ. The count
 * line reads "n of 50 read" — lab-local progress (readProgress.ts). A failed
 * progress read says so (D51) and every guide still opens. Members-only
 * gating is the navigator's (MemberGated + withMembershipPreview).
 */
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View, useWindowDimensions } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, fonts } from '../../../theme/tokens';
import { cardColumn, readingText } from '../../../theme/readingColumn';
import { useIsTablet, useWideOnTablet } from '../../../theme/useIsTablet';
import { fitValue } from '../../../theme/legibility';
import type { RootStackParamList } from '../../../navigation/types';
import { GlassPanel, GlassTile } from '../../tools/GlassTile';
import { LabHeader } from '../kit/LabNavBar';
import { ProgressLoadingNote, ProgressUnreadableNote } from '../kit/ProgressUnreadableNote';
import { MIXING_GUIDE_INDEX } from './data/index';
import { STARTING_POINTS_LINE } from './data/types';
import { filterGuides, readCountLine } from './guideSearch';
import { useGuidesHydrated, useGuidesRead, useGuidesUnreadable } from './readProgress';

export function MixingGuidesHubScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const tablet = useIsTablet();
  const wide = useWideOnTablet();
  const { width: winW } = useWindowDimensions();
  const tabletTile = winW >= 1100 ? styles.tileQuarter : styles.tileThird;
  const [query, setQuery] = useState('');
  const shown = useMemo(() => filterGuides(MIXING_GUIDE_INDEX, query), [query]);
  const progress = useGuidesRead();
  const hydrated = useGuidesHydrated();
  const unreadable = useGuidesUnreadable();
  const read = new Set(progress.read);
  const readCount = MIXING_GUIDE_INDEX.filter((g) => read.has(g.id)).length;
  const total = MIXING_GUIDE_INDEX.length;

  return (
    <View style={[styles.root, { paddingTop: insets.top + 10 }]}>
      <LabHeader title="MIXING GUIDES" subtitle={`${total} music styles — what the audience expects, and where to start the mix`} />
      <ScrollView
        contentContainerStyle={[styles.scroll, cardColumn, wide, { paddingBottom: insets.bottom + 24 }]}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
      >
        <Text style={[styles.intro, wide && readingText]}>
          One guide per style: what its audience listens for, then balance, EQ, compression, effects, vocals, loudness, live versus studio, common mistakes and reference recordings.
        </Text>
        <Text style={[styles.note, wide && readingText]}>{STARTING_POINTS_LINE}</Text>

        <View style={[styles.searchWrap, wide && readingText]}>
          <Text style={styles.searchIcon} accessible={false}>⌕</Text>
          <TextInput
            style={styles.search}
            value={query}
            onChangeText={setQuery}
            placeholder="Find a style — salsa, metal, k-pop…"
            placeholderTextColor={colors.textMuted}
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="search"
            accessibilityLabel="Find a style"
          />
          {query ? (
            <Pressable onPress={() => setQuery('')} hitSlop={10} accessibilityRole="button" accessibilityLabel="Clear the search">
              <Text style={styles.clear}>✕</Text>
            </Pressable>
          ) : null}
        </View>

        <View style={styles.countRow}>
          {unreadable ? (
            <ProgressUnreadableNote style={{ flex: 1 }} />
          ) : !hydrated ? (
            <ProgressLoadingNote />
          ) : (
            <Text style={[styles.count, readCount === total && { color: colors.green }]} {...fitValue(13)}>
              {readCountLine(readCount, total)}
            </Text>
          )}
          {query ? <Text style={styles.matches} {...fitValue(12)}>{`${shown.length} match${shown.length === 1 ? '' : 'es'}`}</Text> : null}
        </View>

        {shown.length === 0 ? (
          <Text style={styles.empty}>No style matches “{query}”. Try a shorter word, or clear the search to see all {total}.</Text>
        ) : (
          <GlassPanel style={[styles.tileGrid, !tablet && styles.tilePanelPhone]}>
            {shown.map((g) => {
              const done = read.has(g.id);
              return (
                <GlassTile
                  key={g.id}
                  style={tablet ? tabletTile : styles.tileHalf}
                  glassStyle={styles.tileFace}
                  onPress={() => navigation.navigate('MixingGuide', { id: g.id })}
                  accessibilityLabel={`${g.num}. ${g.title}. Mix priority: ${g.line}.${done ? ' Read.' : ''}`}
                >
                  <Text style={styles.tileNum} {...fitValue(11)}>{String(g.num).padStart(2, '0')}</Text>
                  <Text style={styles.tileName}>{g.title}</Text>
                  <Text style={styles.tileSub} numberOfLines={4}>{g.line}</Text>
                  {done ? <Text style={styles.tileRead} {...fitValue(11)}>✓ READ</Text> : null}
                </GlassTile>
              );
            })}
          </GlassPanel>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.screenBg },
  scroll: { paddingHorizontal: 16, paddingTop: 6, gap: 12 },
  intro: { color: colors.textSecondary, fontFamily: fonts.barlowRegular, fontSize: 14.5, lineHeight: 21 },
  note: { color: colors.textSub, fontFamily: fonts.barlowRegular, fontSize: 13, lineHeight: 18 },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 9,
    borderWidth: 1.5,
    borderColor: '#3a3d4a',
    backgroundColor: '#17181d',
    paddingHorizontal: 12,
  },
  searchIcon: { fontFamily: fonts.oswaldSemiBold, fontSize: 17, color: colors.textSub },
  search: { flex: 1, fontFamily: fonts.barlowMedium, fontSize: 15, color: colors.textPrimary, paddingVertical: 10 },
  clear: { fontFamily: fonts.oswaldSemiBold, fontSize: 15, color: colors.textSub },
  countRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10, minHeight: 20 },
  count: { fontFamily: fonts.oswaldMedium, fontSize: 13, letterSpacing: 0.8, color: colors.amberLabel },
  matches: { fontFamily: fonts.oswaldMedium, fontSize: 12, letterSpacing: 0.6, color: colors.textSub },
  empty: { color: colors.textSecondary, fontFamily: fonts.barlowRegular, fontSize: 14, lineHeight: 20 },
  // The Labs menu's tile grid (EarLabScreen): the panel, its thinner phone
  // margin, the tile widths and the tile face.
  tileGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'flex-start', columnGap: 8, rowGap: 10 },
  tilePanelPhone: { padding: 7 },
  tileHalf: { width: '48.5%' },
  tileThird: { width: '32%' },
  tileQuarter: { width: '24%' },
  tileFace: { minHeight: 118, padding: 12, gap: 4, backgroundColor: '#101116' },
  tileNum: { fontFamily: fonts.mono, fontSize: 11, color: colors.textSub },
  tileName: { fontFamily: fonts.oswaldSemiBold, fontSize: 15, letterSpacing: 0.4, color: colors.amber },
  tileSub: { fontFamily: fonts.barlowRegular, fontSize: 12.5, lineHeight: 16, color: '#d4d6da', flexGrow: 1 },
  tileRead: { fontFamily: fonts.oswaldMedium, fontSize: 11, letterSpacing: 1, color: colors.green },
});
