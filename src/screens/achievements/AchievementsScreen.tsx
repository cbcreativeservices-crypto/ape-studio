/**
 * S5* — All Achievements (LOCKED, MASTER; visuals from
 * 15-s5-all-achievements.dc.html): "ACHIEVEMENTS  n / 50" header, 5-column
 * grid of 50 permanent slots. Tile states (design generator):
 *   complete = trophy slot, course-color border + glow (artwork pending)
 *   passed_incomplete = ☆ colored outline, 1.5px border ([TBD-DESIGN] #2)
 *   unlocked = ★ dim on #232323 · locked = empty #141414, untappable
 * 24 real topics today; the remaining slots render locked (denominator is
 * FIXED at 50, D-5). Earned/passed/unlocked tap → Trophy (achievements_grid).
 * Header link to Your Gallery (S9) — nav map gives Gallery no entry point;
 * judgment call, flagged. New student = 50-grey wall, as specced.
 */
import { useCallback, useState } from 'react';
import { Dimensions, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { AchievementsStackParamList } from '../../navigation/types';
import { colors, fonts } from '../../theme/tokens';
import { TrophyImage } from '../../components/TrophyImage';
import { TrophyModal } from '../../components/TrophyModal';
import { fetchAchievements, type AchievementTile } from '../../features/profile/api';

const GRID_SLOTS = 50;

// Pixel-computed 5-column tile — percentage widths + `gap` were rounding over
// 100% and collapsing the grid to a single stacked column (Booth 2026-07-08).
const COLS = 5;
const H_PAD = 16;
const TILE_GAP = 10;
const TILE = Math.floor((Dimensions.get('window').width - H_PAD * 2 - TILE_GAP * (COLS - 1)) / COLS);

export function AchievementsScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const route = useRoute<RouteProp<AchievementsStackParamList, 'AchievementsGrid'>>();
  // Reached from the Profile link (not the bottom tab) ⇒ show a back button that
  // returns to Profile (owner 2026-08-07). From the tab there's no back to show.
  const cameFromProfile = route.params?.from === 'profile';
  const [tiles, setTiles] = useState<AchievementTile[]>([]);
  const [earned, setEarned] = useState(0);
  // Tapping a trophy opens it FULL-SIZE in a popup (Booth 2026-07-11) rather
  // than navigating away.
  const [modalTile, setModalTile] = useState<AchievementTile | null>(null);

  useFocusEffect(
    useCallback(() => {
      fetchAchievements()
        .then(({ tiles, earned }) => {
          setTiles(tiles);
          setEarned(earned);
        })
        .catch(() => {});
    }, []),
  );

  // Any visible trophy — earned OR a locked preview — opens the full-size popup
  // (Booth 2026-07-11). The popup is a viewer, so lock status doesn't gate it.
  const openTrophy = (t: AchievementTile) => {
    setModalTile(t);
  };

  // Place each achievement at its permanent grid slot (global_sequence), not
  // sequentially — so trophies always sit in their correct spot (Booth 2026-07-09).
  const slots: (AchievementTile | null)[] = Array.from({ length: GRID_SLOTS }, () => null);
  for (const t of tiles) {
    const idx = t.position - 1;
    if (idx >= 0 && idx < GRID_SLOTS) slots[idx] = t;
  }

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.headerRow}>
          {cameFromProfile ? (
            <Pressable
              onPress={() => {
                // Clear the origin flag so re-opening the grid from the bottom
                // tab later doesn't still show the back button, then return.
                navigation.setParams({ from: undefined } as never);
                (navigation as any).navigate('Profile');
              }}
              hitSlop={10}
              accessibilityRole="button"
              accessibilityLabel="Back to profile"
              style={styles.backBtn}
            >
              <Text style={styles.back}>‹</Text>
            </Pressable>
          ) : null}
          <Text style={styles.title}>ACHIEVEMENTS</Text>
          <Text style={styles.counter}>
            {earned} / {GRID_SLOTS}
          </Text>
          <View style={{ flex: 1 }} />
          <Pressable onPress={() => (navigation as any).navigate('Gallery')} hitSlop={8}>
            <Text style={styles.galleryLink}>YOUR GALLERY ›</Text>
          </Pressable>
        </View>

        <View style={styles.grid}>
          {slots.map((t, i) => {
            if (!t) {
              return <View key={`empty-${i}`} style={[styles.tile, styles.tileLocked]} />;
            }
            const earned = t.status === 'complete';

            // Any tile with trophy art shows it — full-color when earned, a
            // dimmed PREVIEW otherwise (Booth 2026-07-09: show what's available).
            if (t.iconUrl) {
              return (
                <Pressable
                  key={t.id}
                  onPress={() => openTrophy(t)}
                  style={[
                    styles.tile,
                    earned
                      ? [styles.tileComplete, { borderColor: t.color, shadowColor: t.color }]
                      : styles.tilePreview,
                    // Unearned previews dimmed a further 7% → 67% (Booth 2026-07-11).
                    !earned && { opacity: 0.67 },
                  ]}
                >
                  <TrophyImage iconUrl={t.iconUrl} fill radius={7} fallback={<View />} />
                </Pressable>
              );
            }

            // No custom art → keep the status glyphs.
            if (t.status === 'locked') {
              return <View key={t.id} style={[styles.tile, styles.tileLocked]} />;
            }
            const glyph = t.status === 'complete' ? '★' : t.status === 'passed_incomplete' ? '☆' : '★';
            const glyphColor = t.status === 'unlocked' ? '#666666' : t.color;
            return (
              <Pressable
                key={t.id}
                onPress={() => openTrophy(t)}
                style={[
                  styles.tile,
                  t.status === 'complete'
                    ? [styles.tileComplete, { borderColor: t.color, shadowColor: t.color }]
                    : t.status === 'passed_incomplete'
                      ? [styles.tilePassed, { borderColor: t.color }]
                      : styles.tileUnlocked,
                ]}
              >
                <Text style={[styles.tileGlyph, { color: glyphColor }]}>{glyph}</Text>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>

      <TrophyModal
        visible={!!modalTile}
        iconUrl={modalTile?.iconUrl}
        name={modalTile?.name}
        color={modalTile?.color}
        onClose={() => setModalTile(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.screenBg },
  scroll: { padding: H_PAD, gap: 14 },
  headerRow: { flexDirection: 'row', alignItems: 'baseline', gap: 10 },
  backBtn: { alignSelf: 'center' },
  back: { fontFamily: fonts.oswaldSemiBold, fontSize: 28, lineHeight: 28, color: colors.textSub, marginRight: -2 },
  title: { fontFamily: fonts.oswaldSemiBold, fontSize: 18, letterSpacing: 1.4, color: colors.textPrimary },
  counter: {
    fontFamily: fonts.mono,
    fontSize: 13,
    color: colors.amber,
    textShadowColor: 'rgba(255,180,0,.4)',
    textShadowRadius: 6,
    textShadowOffset: { width: 0, height: 0 },
  },
  galleryLink: { fontFamily: fonts.oswaldSemiBold, fontSize: 12, letterSpacing: 1.2, color: colors.textSubAlt },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: TILE_GAP },
  tile: {
    width: TILE,
    height: TILE,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tileComplete: {
    backgroundColor: '#161616',
    borderWidth: 1,
    shadowOpacity: 0.55,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 0 },
  },
  tilePassed: { backgroundColor: '#161616', borderWidth: 1.5 },
  tileUnlocked: { backgroundColor: '#232323', borderWidth: 1, borderColor: '#333333', opacity: 0.75 },
  tileLocked: { backgroundColor: '#141414', borderWidth: 1, borderColor: '#1f1f1f', opacity: 0.6 },
  tilePreview: { backgroundColor: '#161616', borderWidth: 1, borderColor: '#2a2a2a' },
  tileGlyph: { fontFamily: fonts.oswaldSemiBold, fontSize: 16 },
});
