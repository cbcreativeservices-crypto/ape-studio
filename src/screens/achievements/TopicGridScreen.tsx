/**
 * TopicGridScreen — the Topics category, level 3: the trophy grid for ONE
 * subject. Direct descendant of the old v1 AchievementsScreen grid — same
 * 5-column tiles, same four states (complete / passed_incomplete / unlocked /
 * locked), same TrophyImage art + tap-to-popup (TrophyModal). The v1 fixed
 * 50-slot / global_sequence-position logic is GONE: a subject renders exactly
 * its own topics in curriculum order, so v3's 166 topics are never all on one
 * screen. Tile color/glow comes from the field accent (v3 has no course color).
 */
import { useCallback, useState } from 'react';
import { Dimensions, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { AchievementsStackParamList } from '../../navigation/types';
import { colors, fonts } from '../../theme/tokens';
import { fieldColor } from '../../theme/fieldPalette';
import { TrophyImage } from '../../components/TrophyImage';
import { TrophyModal } from '../../components/TrophyModal';
import { fetchTopicAchievements, type TopicAchievement } from '../../features/achievements/api';

const COLS = 5;
const H_PAD = 16;
const TILE_GAP = 10;
const TILE = Math.floor((Dimensions.get('window').width - H_PAD * 2 - TILE_GAP * (COLS - 1)) / COLS);

export function TopicGridScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const { field, subject } = useRoute<RouteProp<AchievementsStackParamList, 'TopicGrid'>>().params;
  const color = fieldColor(field);
  const [topics, setTopics] = useState<TopicAchievement[]>([]);
  const [modalTile, setModalTile] = useState<TopicAchievement | null>(null);

  useFocusEffect(
    useCallback(() => {
      fetchTopicAchievements()
        .then(({ fields }) => {
          const s = fields.find((f) => f.field === field)?.subjects.find((x) => x.subject === subject);
          setTopics(s?.topics ?? []);
        })
        .catch(() => setTopics([]));
    }, [field, subject]),
  );

  const earned = topics.filter((t) => t.status === 'complete').length;

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.headerRow}>
          <Pressable
            onPress={() => navigation.goBack()}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel="Back"
            style={styles.backBtn}
          >
            <Text style={styles.back}>‹</Text>
          </Pressable>
          <Text style={styles.title} numberOfLines={1}>
            {subject.toUpperCase()}
          </Text>
          <View style={styles.flex} />
          <Text style={[styles.counter, { color }]}>
            {earned} / {topics.length}
          </Text>
        </View>

        <View style={styles.grid}>
          {topics.map((t) => {
            const isEarned = t.status === 'complete';

            if (t.iconUrl) {
              return (
                <Pressable
                  key={t.achievementId}
                  onPress={() => setModalTile(t)}
                  accessibilityRole="button"
                  accessibilityLabel={`${t.name}${isEarned ? ', earned' : ', not yet earned'}`}
                  style={[
                    styles.tile,
                    isEarned
                      ? [styles.tileComplete, { borderColor: color, shadowColor: color }]
                      : styles.tilePreview,
                    !isEarned && { opacity: 0.67 },
                  ]}
                >
                  <TrophyImage iconUrl={t.iconUrl} fill radius={7} fallback={<View />} />
                </Pressable>
              );
            }

            if (t.status === 'locked') {
              return <View key={t.achievementId} style={[styles.tile, styles.tileLocked]} />;
            }
            const glyph = t.status === 'passed_incomplete' ? '☆' : '★';
            const glyphColor = t.status === 'unlocked' ? '#666666' : color;
            return (
              <Pressable
                accessibilityRole="button"
                key={t.achievementId}
                onPress={() => setModalTile(t)}
                accessibilityLabel={`${t.name}${isEarned ? ', earned' : ', not yet earned'}`}
                style={[
                  styles.tile,
                  t.status === 'complete'
                    ? [styles.tileComplete, { borderColor: color, shadowColor: color }]
                    : t.status === 'passed_incomplete'
                      ? [styles.tilePassed, { borderColor: color }]
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
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  backBtn: { alignSelf: 'center' },
  back: { fontFamily: fonts.oswaldSemiBold, fontSize: 28, lineHeight: 28, color: colors.textSub, marginRight: -2 },
  title: { fontFamily: fonts.oswaldSemiBold, fontSize: 16, letterSpacing: 1.2, color: colors.textPrimary, flexShrink: 1 },
  flex: { flex: 1 },
  counter: { fontFamily: fonts.mono, fontSize: 13, textShadowRadius: 6, textShadowOffset: { width: 0, height: 0 } },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: TILE_GAP },
  tile: { width: TILE, height: TILE, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
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
