/**
 * TopicsScreen — the Topics category of the Trophy Case, built on the SAME
 * structure as the Explore/Curriculum screen (owner 2026-09-04): ONE flat,
 * scrollable list of expandable SUBJECT cards, with the FIELD name as a light
 * gray divider above the first subject of each field (not a navigable level).
 * Subjects read in the app's amber; expanding a subject reveals its topics with
 * their earned-trophy state. Replaces the old Field→Subject→Grid drill (three
 * screens) and the rejected per-field rainbow palette.
 */
import { useCallback, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { colors, fonts } from '../../theme/tokens';
import { TrophyImage } from '../../components/TrophyImage';
import { TrophyModal } from '../../components/TrophyModal';
import { fetchTopicAchievements, type FieldGroup, type TopicAchievement } from '../../features/achievements/api';

type FlatSubject = { field: string; subject: string; topics: TopicAchievement[]; earnedCount: number; totalCount: number };

function flatten(fields: FieldGroup[]): FlatSubject[] {
  return fields.flatMap((f) =>
    f.subjects.map((s) => ({
      field: f.field,
      subject: s.subject,
      topics: s.topics,
      earnedCount: s.earnedCount,
      totalCount: s.totalCount,
    })),
  );
}

function fmtDate(iso: string | null): string {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }).toUpperCase();
}

export function TopicsScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const [fields, setFields] = useState<FieldGroup[] | null>(null);
  const [earnedTotal, setEarnedTotal] = useState(0);
  const [total, setTotal] = useState(0);
  const [open, setOpen] = useState<string | null>(null);
  const [modalTopic, setModalTopic] = useState<TopicAchievement | null>(null);

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

  const subjects = useMemo(() => (fields ? flatten(fields) : []), [fields]);

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
          <Pressable accessibilityRole="button" accessibilityLabel="Your gallery" onPress={() => navigation.navigate('Gallery')} hitSlop={8}>
            <Text style={styles.galleryLink}>YOUR GALLERY ›</Text>
          </Pressable>
        </View>

        <Text style={styles.subjectsHead}>SUBJECTS</Text>

        <View style={styles.tree}>
          {subjects.map((s, i) => {
            const key = `${s.field}|${s.subject}`;
            const isOpen = open === key;
            const showField = i === 0 || subjects[i - 1].field !== s.field;
            const hasEarned = s.earnedCount > 0;
            return (
              <View key={key}>
                {showField ? <Text style={styles.fieldHead}>{s.field.toUpperCase()}</Text> : null}
                <View style={styles.subjectCard}>
                  <Pressable
                    style={styles.subjectRow}
                    onPress={() => setOpen((prev) => (prev === key ? null : key))}
                    accessibilityRole="button"
                    accessibilityState={{ expanded: isOpen }}
                    // RN-web drops accessibilityState; aria-expanded reaches the DOM (A1-02).
                    aria-expanded={isOpen}
                    accessibilityLabel={`${s.subject}, ${s.earnedCount} of ${s.totalCount} earned`}
                  >
                    <Text style={styles.subjectChevron}>{isOpen ? '▾' : '▸'}</Text>
                    <Text style={styles.subjectName} numberOfLines={2}>
                      {s.subject}
                    </Text>
                    <Text style={[styles.subjectCount, hasEarned ? styles.subjectCountEarned : null]}>
                      {s.earnedCount} / {s.totalCount}
                    </Text>
                  </Pressable>

                  {isOpen ? (
                    <View style={styles.expanded}>
                      {s.topics.map((t) => (
                        <TopicRow key={t.achievementId} topic={t} onOpen={setModalTopic} />
                      ))}
                    </View>
                  ) : null}
                </View>
              </View>
            );
          })}
        </View>
      </ScrollView>

      <TrophyModal
        visible={!!modalTopic}
        iconUrl={modalTopic?.iconUrl}
        name={modalTopic?.name}
        color={colors.amber}
        meta={
          modalTopic?.status === 'complete'
            ? modalTopic.dateEarned
              ? `EARNED ${fmtDate(modalTopic.dateEarned)}`
              : 'EARNED'
            : modalTopic?.status === 'passed_incomplete'
              ? 'PASSED — TROPHY NOT YET EARNED'
              : 'NOT YET EARNED'
        }
        onClose={() => setModalTopic(null)}
      />
    </View>
  );
}

function TopicRow({ topic, onOpen }: { topic: TopicAchievement; onOpen: (t: TopicAchievement) => void }) {
  const earned = topic.status === 'complete';
  // Locked topics aren't interactive (mirrors the old grid's locked-tile rule).
  if (topic.status === 'locked') {
    return (
      <View style={styles.topicRow}>
        <View style={styles.topicIcon}>
          <Text style={styles.lockGlyph}>·</Text>
        </View>
        <Text style={styles.topicNameLocked} numberOfLines={2}>
          {topic.name}
        </Text>
      </View>
    );
  }

  const glyph = earned ? '★' : '☆';
  const glyphColor = topic.status === 'unlocked' ? '#666666' : colors.amber;

  return (
    <Pressable
      style={styles.topicRow}
      onPress={() => onOpen(topic)}
      accessibilityRole="button"
      accessibilityLabel={`${topic.name}${earned ? ', earned' : ', not yet earned'}`}
    >
      <View style={styles.topicIcon}>
        {earned && topic.iconUrl ? (
          <TrophyImage iconUrl={topic.iconUrl} fill radius={6} fallback={<Text style={[styles.glyph, { color: glyphColor }]}>{glyph}</Text>} />
        ) : (
          <Text style={[styles.glyph, { color: glyphColor }]}>{glyph}</Text>
        )}
      </View>
      <Text style={[styles.topicName, earned ? null : styles.topicNameDim]} numberOfLines={2}>
        {topic.name}
      </Text>
      {earned && topic.dateEarned ? <Text style={styles.topicDate}>{fmtDate(topic.dateEarned)}</Text> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.screenBg },
  scroll: { padding: 16, gap: 12 },
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
  flex: { flex: 1 },
  galleryLink: { fontFamily: fonts.oswaldSemiBold, fontSize: 12, letterSpacing: 1.2, color: colors.textSubAlt },
  subjectsHead: { fontFamily: fonts.oswaldSemiBold, fontSize: 13, letterSpacing: 2.2, color: colors.amber, marginBottom: -4 },
  fieldHead: { fontFamily: fonts.oswaldSemiBold, fontSize: 11, letterSpacing: 1.6, color: colors.textSub, marginTop: 10, marginBottom: 6 },
  tree: { gap: 8 },
  subjectCard: { backgroundColor: '#161616', borderWidth: 1, borderColor: '#232323', borderRadius: 9, overflow: 'hidden' },
  subjectRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 12, paddingHorizontal: 13 },
  subjectChevron: { fontFamily: fonts.oswaldSemiBold, fontSize: 14, color: colors.textSub, width: 14 },
  subjectName: { flex: 1, fontFamily: fonts.oswaldMedium, fontSize: 17, color: colors.amber },
  subjectCount: { fontFamily: fonts.mono, fontSize: 13, color: colors.textSub, textAlign: 'right' },
  subjectCountEarned: {
    color: colors.amber,
    textShadowColor: 'rgba(255,180,0,.4)',
    textShadowRadius: 6,
    textShadowOffset: { width: 0, height: 0 },
  },
  expanded: { paddingHorizontal: 14, paddingBottom: 12, paddingTop: 2, gap: 6, borderTopWidth: 1, borderTopColor: '#1e1e1e' },
  topicRow: { flexDirection: 'row', alignItems: 'center', gap: 11, paddingVertical: 5 },
  topicIcon: {
    width: 34,
    height: 34,
    borderRadius: 7,
    backgroundColor: '#0f0f0f',
    borderWidth: 1,
    borderColor: '#242424',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  glyph: { fontFamily: fonts.oswaldSemiBold, fontSize: 16 },
  lockGlyph: { fontFamily: fonts.oswaldSemiBold, fontSize: 16, color: '#3a3a3a' },
  topicName: { flex: 1, fontFamily: fonts.barlowMedium, fontSize: 14.5, lineHeight: 20, color: colors.textPrimary },
  topicNameDim: { color: colors.textSecondary },
  topicNameLocked: { flex: 1, fontFamily: fonts.barlowMedium, fontSize: 14.5, lineHeight: 20, color: colors.textMuted },
  topicDate: { fontFamily: fonts.mono, fontSize: 11, color: colors.textSub },
});
