/**
 * LearningIntroSheet — the intro shown before a student begins a TOPIC or a
 * COURSE (user request 2026-07-18). Renders the fixed structure — what / why /
 * where / who / importance / what you'll learn — from a LearningIntro. Fields
 * that aren't authored yet show a muted "Coming soon" so the shape is visible
 * during development.
 */
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, fonts } from '../../theme/tokens';
import { LowLightDim } from '../settings/LowLightLayer';
import { useOverlaysSuppressed } from '../dev/popupSuppressStore';
import { isIntroEmpty, type LearningIntro } from './learningIntros';

const SECTIONS: { head: string; get: (i: LearningIntro) => string | undefined }[] = [
  { head: 'WHAT IT IS', get: (i) => i.what },
  { head: 'WHY IT MATTERS', get: (i) => i.why },
  { head: "WHERE IT'S USED", get: (i) => i.where },
  { head: 'WHO WORKS WITH IT', get: (i) => i.who },
  { head: 'WHY IT MATTERS TO MASTER', get: (i) => i.importance },
];

export function LearningIntroSheet({
  visible,
  kind,
  title,
  intro,
  onBegin,
}: {
  visible: boolean;
  kind: 'topic' | 'course';
  title: string;
  intro: LearningIntro;
  /** Dismiss + mark seen; label reads "BEGIN". */
  onBegin: () => void;
}) {
  const insets = useSafeAreaInsets();
  const empty = isIntroEmpty(intro);
  // Suppression wins over the caller's `visible` — dev kill-switch OR Low-Light
  // Production Mode.
  const suppressed = useOverlaysSuppressed();
  if (suppressed) return null;

  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent onRequestClose={onBegin}>
      {/* Tapping the dimmed area dismisses (never a hard block); the card
          absorbs its own taps so content/BEGIN aren't swallowed. */}
      <Pressable style={styles.backdrop} onPress={onBegin} accessibilityLabel="Dismiss">
        <Pressable style={[styles.card, { maxHeight: `${88}%` }]} onPress={() => {}}>
          <View style={styles.head}>
            <Text style={styles.eyebrow}>{kind === 'course' ? 'COURSE INTRO' : 'TOPIC INTRO'}</Text>
            <Text style={styles.title}>{title}</Text>
            <View style={styles.rule} />
          </View>

          <ScrollView
            contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 8 }]}
            showsVerticalScrollIndicator={false}
          >
            {empty ? (
              <Text style={styles.draftNote}>
                This intro is being written. It will introduce the topic and explain the why, where,
                who, what, and importance — and what you’ll learn — before you begin.
              </Text>
            ) : null}

            {SECTIONS.map((s) => {
              const val = s.get(intro);
              return (
                <View key={s.head} style={styles.section}>
                  <Text style={styles.sectionHead}>{s.head}</Text>
                  {val ? (
                    <Text style={styles.sectionBody}>{val}</Text>
                  ) : (
                    <Text style={styles.comingSoon}>Coming soon.</Text>
                  )}
                </View>
              );
            })}

            <View style={styles.section}>
              <Text style={styles.sectionHead}>WHAT YOU’LL LEARN</Text>
              {intro.willLearn && intro.willLearn.length ? (
                intro.willLearn.map((line) => (
                  <View key={line} style={styles.bulletRow}>
                    <Text style={styles.bullet}>▸</Text>
                    <Text style={styles.bulletText}>{line}</Text>
                  </View>
                ))
              ) : (
                <Text style={styles.comingSoon}>Coming soon.</Text>
              )}
            </View>
          </ScrollView>

          <Pressable style={styles.beginBtn} onPress={onBegin} accessibilityRole="button" accessibilityLabel="Begin">
            <Text style={styles.beginText}>BEGIN</Text>
          </Pressable>
        </Pressable>
      </Pressable>
      <LowLightDim />
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,.8)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  card: {
    width: '100%',
    maxWidth: 460,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,180,0,.5)',
    backgroundColor: '#141310',
    padding: 20,
  },
  head: { gap: 8, marginBottom: 6 },
  eyebrow: { fontFamily: fonts.oswaldSemiBold, fontSize: 11, letterSpacing: 2.2, color: colors.amber },
  title: { fontFamily: fonts.oswaldMedium, fontSize: 22, lineHeight: 27, color: colors.textPrimary },
  rule: { width: 44, height: 2, backgroundColor: colors.amber, borderRadius: 1 },

  scroll: { gap: 14, paddingTop: 8 },
  draftNote: {
    fontFamily: fonts.barlowRegular,
    fontStyle: 'italic',
    fontSize: 13.5,
    lineHeight: 20,
    color: colors.textSub,
  },
  section: { gap: 5 },
  sectionHead: { fontFamily: fonts.oswaldSemiBold, fontSize: 12, letterSpacing: 1.6, color: colors.amberLabel },
  sectionBody: { fontFamily: fonts.barlowMedium, fontSize: 15.5, lineHeight: 23, color: colors.textSecondary },
  comingSoon: { fontFamily: fonts.barlowRegular, fontStyle: 'italic', fontSize: 13.5, color: colors.textMuted },
  bulletRow: { flexDirection: 'row', gap: 9, alignItems: 'flex-start' },
  bullet: { fontFamily: fonts.oswaldSemiBold, fontSize: 13, color: colors.amber, lineHeight: 22 },
  bulletText: { flex: 1, fontFamily: fonts.barlowMedium, fontSize: 15.5, lineHeight: 23, color: colors.textSecondary },

  beginBtn: {
    marginTop: 14,
    backgroundColor: '#1d1607',
    borderWidth: 1,
    borderColor: 'rgba(255,180,0,.55)',
    borderRadius: 10,
    paddingVertical: 13,
    alignItems: 'center',
  },
  beginText: { fontFamily: fonts.oswaldSemiBold, fontSize: 14, letterSpacing: 1.6, color: colors.amber },
});
