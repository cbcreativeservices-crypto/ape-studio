/**
 * TopicFieldsScreen — the Topics category, level 1: one card per v3 FIELD with
 * that field's earned/total count and accent. Drills into TopicSubjects. Also
 * hosts the link to the chronological Gallery (top of the Topics experience).
 */
import { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { colors, fonts } from '../../theme/tokens';
import { fetchTopicAchievements, type FieldGroup } from '../../features/achievements/api';

export function TopicFieldsScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const [fields, setFields] = useState<FieldGroup[] | null>(null);
  const [earnedTotal, setEarnedTotal] = useState(0);
  const [total, setTotal] = useState(0);

  useFocusEffect(
    useCallback(() => {
      fetchTopicAchievements()
        .then(({ fields, earnedTotal, totalCount }) => {
          setFields(fields);
          setEarnedTotal(earnedTotal);
          setTotal(totalCount);
        })
        .catch(() => setFields([]));
    }, []),
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
          <Text style={styles.title}>TOPICS</Text>
          <Text style={styles.counter}>
            {earnedTotal} / {total}
          </Text>
          <View style={styles.flex} />
          <Pressable
            accessibilityRole="button"
            onPress={() => navigation.navigate('Gallery')}
            hitSlop={8}
          >
            <Text style={styles.galleryLink}>YOUR GALLERY ›</Text>
          </Pressable>
        </View>

        {fields && fields.length === 0 && (
          <Text style={styles.empty}>Topics will appear here once the curriculum loads.</Text>
        )}

        {(fields ?? []).map((f) => (
          <Pressable
            key={f.field}
            style={({ pressed }) => [
              styles.card,
              { borderLeftColor: f.color },
              pressed && styles.cardPressed,
            ]}
            onPress={() => navigation.navigate('TopicSubjects', { field: f.field })}
            accessibilityRole="button"
            accessibilityLabel={`${f.field}, ${f.earnedCount} of ${f.totalCount} earned`}
          >
            <View style={styles.cardMain}>
              <Text style={styles.cardName}>{f.field}</Text>
              <Text style={styles.cardSub}>
                {f.subjects.length} {f.subjects.length === 1 ? 'subject' : 'subjects'}
              </Text>
            </View>
            <Text style={[styles.cardCount, { color: f.color }]}>
              {f.earnedCount} / {f.totalCount}
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
  headerRow: { flexDirection: 'row', alignItems: 'baseline', gap: 10, marginBottom: 2 },
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
  flex: { flex: 1 },
  galleryLink: { fontFamily: fonts.oswaldSemiBold, fontSize: 12, letterSpacing: 1.2, color: colors.textSubAlt },
  empty: { fontFamily: fonts.barlowRegular, fontSize: 14, color: colors.textSub, marginTop: 8 },
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
