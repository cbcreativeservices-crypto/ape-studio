/**
 * TopicSubjectsScreen — the Topics category, level 2: the SUBJECTS within one
 * field, each with its earned/total count. Drills into TopicGrid (one subject's
 * trophy grid). The field accent carries through from the field you came from.
 */
import { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { AchievementsStackParamList } from '../../navigation/types';
import { colors, fonts } from '../../theme/tokens';
import { fieldColor } from '../../theme/fieldPalette';
import { fetchTopicAchievements, type FieldGroup } from '../../features/achievements/api';

export function TopicSubjectsScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const { field } = useRoute<RouteProp<AchievementsStackParamList, 'TopicSubjects'>>().params;
  const [group, setGroup] = useState<FieldGroup | null>(null);
  const color = fieldColor(field);

  useFocusEffect(
    useCallback(() => {
      fetchTopicAchievements()
        .then(({ fields }) => setGroup(fields.find((f) => f.field === field) ?? null))
        .catch(() => setGroup(null));
    }, [field]),
  );

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
            {field.toUpperCase()}
          </Text>
          <View style={styles.flex} />
          {group ? (
            <Text style={[styles.counter, { color }]}>
              {group.earnedCount} / {group.totalCount}
            </Text>
          ) : null}
        </View>

        {(group?.subjects ?? []).map((s) => (
          <Pressable
            key={s.subject}
            style={({ pressed }) => [styles.card, { borderLeftColor: color }, pressed && styles.cardPressed]}
            onPress={() => navigation.navigate('TopicGrid', { field, subject: s.subject })}
            accessibilityRole="button"
            accessibilityLabel={`${s.subject}, ${s.earnedCount} of ${s.totalCount} earned`}
          >
            <View style={styles.cardMain}>
              <Text style={styles.cardName}>{s.subject}</Text>
              <Text style={styles.cardSub}>
                {s.totalCount} {s.totalCount === 1 ? 'topic' : 'topics'}
              </Text>
            </View>
            <Text style={[styles.cardCount, { color }]}>
              {s.earnedCount} / {s.totalCount}
            </Text>
            <Text style={styles.chevron}>›</Text>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.screenBg },
  scroll: { padding: 16, gap: 12 },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 2 },
  backBtn: { alignSelf: 'center' },
  back: { fontFamily: fonts.oswaldSemiBold, fontSize: 28, lineHeight: 28, color: colors.textSub, marginRight: -2 },
  title: { fontFamily: fonts.oswaldSemiBold, fontSize: 16, letterSpacing: 1.2, color: colors.textPrimary, flexShrink: 1 },
  flex: { flex: 1 },
  counter: { fontFamily: fonts.mono, fontSize: 13, textShadowRadius: 6, textShadowOffset: { width: 0, height: 0 } },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#161616',
    borderRadius: 10,
    borderLeftWidth: 4,
    borderColor: '#242424',
    paddingVertical: 14,
    paddingHorizontal: 14,
  },
  cardPressed: { opacity: 0.85 },
  cardMain: { flex: 1, gap: 3 },
  cardName: { fontFamily: fonts.oswaldSemiBold, fontSize: 15, letterSpacing: 0.4, color: colors.textPrimary },
  cardSub: { fontFamily: fonts.barlowRegular, fontSize: 12, color: colors.textMuted },
  cardCount: { fontFamily: fonts.mono, fontSize: 13 },
  chevron: { fontFamily: fonts.oswaldSemiBold, fontSize: 20, color: colors.textSub },
});
