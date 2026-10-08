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
import { memo, useCallback, useDeferredValue, useEffect, useMemo, useRef, useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View, useWindowDimensions, type GestureResponderEvent, type LayoutChangeEvent, type NativeScrollEvent, type NativeSyntheticEvent, type StyleProp, type ViewStyle } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, fonts } from '../../../theme/tokens';
import { cardColumn, readingText } from '../../../theme/readingColumn';
import { useIsTablet, useWideOnTablet } from '../../../theme/useIsTablet';
import { fitValue } from '../../../theme/legibility';
import type { RootStackParamList } from '../../../navigation/types';
import { GlassPanel, GlassTile } from '../../tools/GlassTile';
import { LabHeader } from '../kit/LabNavBar';
import { ProNoteButton, ProNoteIntro } from '../../../features/lab/ProNote';
import { ProgressLoadingNote, ProgressUnreadableNote } from '../kit/ProgressUnreadableNote';
import { MIXING_GUIDE_INDEX, type MixingGuideEntry } from './data/index';
import { STARTING_POINTS_LINE } from './data/types';
import { filterGuides, readCountLine } from './guideSearch';
import { useGuidesHydrated, useGuidesRead, useGuidesUnreadable } from './readProgress';
import { GuideWorldMap, ShowMapButton } from './GuideWorldMap';
import { WORLD_ASPECT } from './data/worldMap';

const TOUCH = Platform.OS !== 'web';
/** A deliberate tap: the countries flash this long, then the guide opens (owner 2026-10-08). */
export const SELECT_FLASH_MS = 1500;

export function MixingGuidesHubScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const tablet = useIsTablet();
  const wide = useWideOnTablet();
  const { width: winW, height: winH } = useWindowDimensions();
  const tabletTile = winW >= 1100 ? styles.tileQuarter : styles.tileThird;
  const [query, setQuery] = useState('');
  // The field echoes at once; the grid follows at low priority (deferred).
  const deferredQuery = useDeferredValue(query);
  const shown = useMemo(() => filterGuides(MIXING_GUIDE_INDEX, deferredQuery), [deferredQuery]);
  // Hunt 2026-10-07 (timing): the 50 tiles stay MOUNTED and a filtered-out
  // tile is only hidden — a keystroke used to unmount/remount the animated
  // tiles (181 ms for the first letter, 167 ms to clear on desktop dev).
  const shownIds = useMemo(() => new Set(shown.map((g) => g.id)), [shown]);
  const openGuide = useCallback((id: string) => navigation.navigate('MixingGuide', { id }), [navigation]);
  const progress = useGuidesRead();
  const hydrated = useGuidesHydrated();
  const unreadable = useGuidesUnreadable();
  const read = useMemo(() => new Set(progress.read), [progress.read]);
  const readCount = MIXING_GUIDE_INDEX.filter((g) => read.has(g.id)).length;
  const total = MIXING_GUIDE_INDEX.length;

  // ── The world map (owner 2026-10-07/08): pinned above the list.
  //  - SWIPE: while the learner scrolls, the card under their finger lights its
  //    countries (and keeps following as the list glides after the finger lifts).
  //  - TAP: a deliberate press SELECTS — the countries flash for 1.5 s while the
  //    map is showing, then the guide opens. With the map hidden it opens at once.
  //  - HOVER (web / iPad pointer) lights the card under the pointer.
  const [activeId, setActiveId] = useState<string | null>(null);
  const [flashId, setFlashId] = useState<string | null>(null);
  const [mapHidden, setMapHidden] = useState(false);
  const mapW = Math.round(Math.min(winW - 32, 560, winH * 0.26 * WORLD_ASPECT));
  const activeTitle = activeId ? MIXING_GUIDE_INDEX.find((g) => g.id === activeId)?.title ?? null : null;
  const tileBox = useRef(new Map<string, { x: number; y: number; w: number; h: number }>()).current;
  const grid = useRef({ x: 0, y: 0 });
  const scrollBox = useRef<View>(null);
  const scrollWin = useRef({ x: 0, y: 0 });
  const finger = useRef({ x: 0, y: 0 });
  const scrollY = useRef(0);
  const dragUntil = useRef(0);
  const openTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => { if (openTimer.current) clearTimeout(openTimer.current); }, []);
  // Leaving mid-flash (BACK, a tab switch) cancels the pending open.
  useFocusEffect(useCallback(() => () => {
    if (openTimer.current) clearTimeout(openTimer.current);
    openTimer.current = null;
    setFlashId(null);
  }, []));
  const selectGuide = useCallback((id: string) => {
    if (openTimer.current) clearTimeout(openTimer.current);
    if (mapHidden) { openTimer.current = null; openGuide(id); return; }
    setActiveId(id);
    setFlashId(id);
    openTimer.current = setTimeout(() => {
      openTimer.current = null;
      setFlashId(null);
      openGuide(id);
    }, SELECT_FLASH_MS);
  }, [mapHidden, openGuide]);
  const onTileLayout = useCallback((id: string, e: LayoutChangeEvent) => {
    const { x, y, width, height } = e.nativeEvent.layout;
    tileBox.set(id, { x, y, w: width, h: height });
  }, [tileBox]);
  const onTileHoverOut = useCallback(() => setActiveId((cur) => (flashId ? cur : null)), [flashId]);
  const onTilePoint = useCallback((id: string) => { if (!flashId) setActiveId(id); }, [flashId]);
  const measureScroll = useCallback(() => {
    scrollBox.current?.measureInWindow((x, y) => { scrollWin.current = { x, y }; });
  }, []);
  const onFinger = useCallback((e: GestureResponderEvent) => {
    finger.current = { x: e.nativeEvent.pageX, y: e.nativeEvent.pageY };
  }, []);
  const onDragStart = useCallback(() => { measureScroll(); dragUntil.current = Date.now() + 1500; }, [measureScroll]);
  // The card under the finger (in the list's own coordinates). Only a
  // finger-driven scroll moves the map — a mouse wheel would fight the hover.
  const onScroll = useCallback((e: NativeSyntheticEvent<NativeScrollEvent>) => {
    scrollY.current = e.nativeEvent.contentOffset.y;
    if (mapHidden || flashId || Date.now() > dragUntil.current) return;
    dragUntil.current = Math.max(dragUntil.current, Date.now() + 400);
    const cx = finger.current.x - scrollWin.current.x - grid.current.x;
    const cy = finger.current.y - scrollWin.current.y + scrollY.current - grid.current.y;
    const hit = MIXING_GUIDE_INDEX.find((g) => {
      const b = tileBox.get(g.id);
      return shownIds.has(g.id) && b && b.h > 0 && cx >= b.x && cx <= b.x + b.w && cy >= b.y && cy <= b.y + b.h;
    });
    if (hit) setActiveId((cur) => (cur === hit.id ? cur : hit.id));
  }, [mapHidden, flashId, shownIds, tileBox]);
  return (
    <View style={[styles.root, { paddingTop: insets.top + 10 }]}>
      <LabHeader title="MIXING GUIDES" subtitle={`${total} music styles — what the audience expects, and where to start the mix`} />
      {mapHidden ? (
        <ShowMapButton onShow={() => setMapHidden(false)} />
      ) : (
        <GuideWorldMap activeId={activeId} activeTitle={activeTitle} flashing={flashId !== null} width={mapW} touch={TOUCH} onHide={() => setMapHidden(true)} />
      )}
      <View ref={scrollBox} style={styles.scrollBox} onLayout={measureScroll}>
      <ScrollView
        onTouchStart={onFinger}
        onTouchMove={onFinger}
        onScroll={onScroll}
        scrollEventThrottle={100}
        onScrollBeginDrag={onDragStart}
        onMomentumScrollBegin={onDragStart}
        contentContainerStyle={[styles.scroll, cardColumn, wide, { paddingBottom: insets.bottom + 24 }]}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
      >
        <Text style={[styles.intro, wide && readingText]}>
          One guide per style: what its audience listens for, then balance, EQ, compression, effects, vocals, loudness, live versus studio, common mistakes and reference recordings.
        </Text>
        <Text style={[styles.note, wide && readingText]}>{STARTING_POINTS_LINE}</Text>
        {/* The Mixing-family note (owner 2026-10-07): a small link on the first page. */}
        <ProNoteButton />

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
          <Text style={styles.empty}>No style matches “{deferredQuery}”. Try a shorter word, or clear the search to see all {total}.</Text>
        ) : null}
        <View onLayout={(e) => { grid.current = { x: e.nativeEvent.layout.x, y: e.nativeEvent.layout.y }; }}>
        <GlassPanel style={[styles.tileGrid, !tablet && styles.tilePanelPhone, shown.length === 0 && styles.tileHidden]}>
            {MIXING_GUIDE_INDEX.map((g) => (
              <HubTile key={g.id} g={g} done={read.has(g.id)} hidden={!shownIds.has(g.id)} tileStyle={tablet ? tabletTile : styles.tileHalf} onOpen={selectGuide} onPoint={onTilePoint} onHoverOut={onTileHoverOut} onTileLayout={onTileLayout} />
            ))}
          </GlassPanel>
        </View>
      </ScrollView>
      </View>
      {/* First open of any Mixing-family lab (owner 2026-10-07): once per device. */}
      <ProNoteIntro />
    </View>
  );
}

/** One tile, memoised: a keystroke or a ✓ elsewhere re-renders only the
 *  tiles whose props changed. A filtered-out tile is hidden, not unmounted. */
const HubTile = memo(function HubTile({
  g,
  done,
  hidden,
  tileStyle,
  onOpen,
  onPoint,
  onHoverOut,
  onTileLayout,
}: {
  g: MixingGuideEntry;
  done: boolean;
  hidden: boolean;
  tileStyle: StyleProp<ViewStyle>;
  onOpen: (id: string) => void;
  /** The map lights this style (hover, or a finger landing on the tile). */
  onPoint: (id: string) => void;
  onHoverOut: () => void;
  onTileLayout: (id: string, e: LayoutChangeEvent) => void;
}) {
  return (
    <GlassTile
      style={hidden ? [tileStyle, styles.tileHidden] : tileStyle}
      glassStyle={styles.tileFace}
      onPress={() => onOpen(g.id)}
      onTouchStart={() => onPoint(g.id)}
      onHoverIn={() => onPoint(g.id)}
      onHoverOut={onHoverOut}
      onLayout={(e) => onTileLayout(g.id, e)}
      accessibilityLabel={`${g.num}. ${g.title}. Mix priority: ${g.line}.${done ? ' Read.' : ''}`}
    >
      <Text style={styles.tileNum} {...fitValue(11)}>{String(g.num).padStart(2, '0')}</Text>
      <Text style={styles.tileName}>{g.title}</Text>
      <Text style={styles.tileSub} numberOfLines={4}>{g.line}</Text>
      {done ? <Text style={styles.tileRead} {...fitValue(11)}>✓ READ</Text> : null}
    </GlassTile>
  );
});

const styles = StyleSheet.create({
  tileHidden: { display: 'none' },
  root: { flex: 1, backgroundColor: colors.screenBg },
  scrollBox: { flex: 1 },
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
  // Hunt 2026-10-07 R2: 32% / 24% left a ~35 px empty strip on the right of
  // the iPad grid (left margin 12). Sized to close it and still fit at 768.
  tileThird: { width: '32.4%' },
  tileQuarter: { width: '24.2%' },
  tileFace: { minHeight: 118, padding: 12, gap: 4, backgroundColor: '#101116' },
  tileNum: { fontFamily: fonts.mono, fontSize: 11, color: colors.textSub },
  tileName: { fontFamily: fonts.oswaldSemiBold, fontSize: 15, letterSpacing: 0.4, color: colors.amber },
  tileSub: { fontFamily: fonts.barlowRegular, fontSize: 12.5, lineHeight: 16, color: '#d4d6da', flexGrow: 1 },
  tileRead: { fontFamily: fonts.oswaldMedium, fontSize: 11, letterSpacing: 1, color: colors.green },
});
