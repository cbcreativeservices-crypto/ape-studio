/**
 * TopicDetailModal — the expanded topic view on Explore (owner 2026-09-15).
 * Fulfils the curriculum promise ("…expands to show its topics, term coverage,
 * and where those skills apply in a professional audio career") for a single
 * topic — VIEW ONLY (owner 2026-09-15: no links; just the image + the extra
 * data). Scrim or CLOSE dismisses.
 *
 * Layout (redesign 2026-09-15) — a topic "spec sheet" read top-to-bottom:
 *   1. Full-bleed topic art across the head of the card, fading into the card
 *      surface so the identity block sits ON the art rather than under a
 *      framed thumbnail.
 *   2. Identity block, left-aligned: FIELD (muted) › SUBJECT (amber) › Topic
 *      title (large). The three sizes/colours ARE the hierarchy — no glyphs.
 *   3. Term coverage as a readout: mono green number + stacked label, in an
 *      inset panel (the app's data-readout grammar: Share Tech Mono, green).
 *   4. The subject description as a left-aligned reading block.
 *   5. "WHERE THESE SKILLS APPLY": each role as its own green chip (the
 *      Career-Finder chip grammar) instead of a comma run.
 *   6. Fixed footer CLOSE — outside the scroll so it is always reachable.
 */
import { LinearGradient } from 'expo-linear-gradient';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { TrophyImage } from '../../components/TrophyImage';
import { topicImagePath } from '../../data/topicImages';
import { LowLightDim } from '../../features/settings/LowLightLayer';
import { colors, fonts } from '../../theme/tokens';

export type TopicDetail = {
  gs: number;
  name: string;
  subjectName: string | null;
  field: string | null;
  /** Where these skills apply — the subject's career applications. */
  careers: string | null;
  description: string | null;
  /** Glossary terms covered by this topic. */
  terms: number | null;
};

/** Thousands separator without relying on Intl (limited under Hermes). */
const fmt = (n: number) => n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');

const CARD_MAX_W = 380;
const SCRIM_PAD = 22;
const CARD_BG = '#141416';

export function TopicDetailModal({
  topic,
  onClose,
}: {
  topic: TopicDetail | null;
  onClose: () => void;
}) {
  const { width, height } = useWindowDimensions();
  const cardW = Math.min(width - SCRIM_PAD * 2, CARD_MAX_W);
  // Square art (TrophyImage is contain-fit) — full card width, but never more
  // than ~42% of the window so the identity block is on screen at open.
  const art = Math.min(cardW, Math.round(height * 0.42));

  return (
    <Modal accessibilityViewIsModal visible={topic != null} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.scrim} onPress={onClose} accessibilityRole="button" accessibilityLabel="Close">
        {/* Card absorbs taps so the scrim only closes from OUTSIDE the card. */}
        <Pressable style={[styles.card, { maxHeight: height * 0.86 }]} onPress={() => {}} accessibilityViewIsModal>
          {topic ? (
            <>
              <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
                {/* 1 · Art head — full bleed, seated into the card by the fade. */}
                <View style={[styles.artWell, { height: art }]}>
                  <View style={{ width: art, height: art }}>
                    <TrophyImage iconUrl={topicImagePath(topic.gs)} fill radius={0} fallback={<View style={styles.artEmpty} />} />
                  </View>
                  <LinearGradient
                    pointerEvents="none"
                    colors={['rgba(20,20,22,0)', 'rgba(20,20,22,0.55)', CARD_BG]}
                    locations={[0, 0.6, 1]}
                    style={styles.artFade}
                  />
                </View>

                <View style={styles.body}>
                  {/* 2 · Identity: field › subject › topic. */}
                  <View style={styles.identity}>
                    {topic.field ? <Text style={styles.field}>{topic.field.toUpperCase()}</Text> : null}
                    {topic.subjectName ? <Text style={styles.subject}>{topic.subjectName.toUpperCase()}</Text> : null}
                    <Text accessibilityRole="header" style={styles.title}>{topic.name}</Text>
                  </View>

                  {/* 3 · Term coverage readout. */}
                  {topic.terms != null ? (
                    <View
                      style={styles.stat}
                      accessible
                      accessibilityLabel={`${fmt(topic.terms)} glossary terms in this topic`}
                    >
                      <Text style={styles.statNum}>{fmt(topic.terms)}</Text>
                      <View style={styles.statLabels}>
                        <Text style={styles.statLabel}>GLOSSARY TERMS</Text>
                        <Text style={styles.statSub}>covered in this topic</Text>
                      </View>
                    </View>
                  ) : null}

                  {/* Per-topic description + "where these skills apply" are
                      pending real per-topic copy (Computer C, 2026-09-15). The
                      subject-level blurb was removed because it misrepresents the
                      individual topic; re-add here once per-topic copy exists. */}
                </View>
              </ScrollView>

              {/* 6 · Fixed footer — always reachable regardless of scroll. */}
              <Pressable
                style={({ pressed }) => [styles.close, pressed && styles.closePressed]}
                onPress={onClose}
                accessibilityRole="button"
                accessibilityLabel="Close"
              >
                <Text style={styles.closeText}>CLOSE</Text>
              </Pressable>
            </>
          ) : null}
        </Pressable>
      </Pressable>
      <LowLightDim />
    </Modal>
  );
}

const styles = StyleSheet.create({
  scrim: { flex: 1, backgroundColor: 'rgba(0,0,0,0.86)', alignItems: 'center', justifyContent: 'center', padding: SCRIM_PAD },
  card: {
    width: '100%',
    maxWidth: CARD_MAX_W,
    backgroundColor: CARD_BG,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.hairline,
    overflow: 'hidden',
  },

  // Art head.
  artWell: { width: '100%', alignItems: 'center', backgroundColor: '#0d0d0e' },
  artEmpty: { flex: 1, backgroundColor: '#1a1a1c' },
  artFade: { position: 'absolute', left: 0, right: 0, bottom: 0, height: '38%' },

  body: { paddingHorizontal: 20, paddingTop: 2, paddingBottom: 22, gap: 18 },

  // Identity block — three tiers, three sizes.
  identity: { gap: 3 },
  field: { fontFamily: fonts.oswaldMedium, fontSize: 11, letterSpacing: 1.8, color: colors.textMuted },
  subject: { fontFamily: fonts.oswaldSemiBold, fontSize: 12, letterSpacing: 1.6, color: colors.amberLabel },
  title: { fontFamily: fonts.oswaldSemiBold, fontSize: 25, lineHeight: 30, letterSpacing: 0.2, color: colors.textPrimary, marginTop: 4 },

  // Term-coverage readout.
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.hairlineDim,
    backgroundColor: '#0f0f11',
  },
  statNum: { fontFamily: fonts.mono, fontSize: 30, lineHeight: 34, color: colors.green, fontVariant: ['tabular-nums'] },
  statLabels: { gap: 1, borderLeftWidth: 1, borderLeftColor: colors.hairline, paddingLeft: 14 },
  statLabel: { fontFamily: fonts.oswaldSemiBold, fontSize: 11, letterSpacing: 1.6, color: colors.textSecondary },
  statSub: { fontFamily: fonts.barlowRegular, fontSize: 13, color: colors.textSub },

  // Footer.
  close: {
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderTopWidth: 1,
    borderTopColor: colors.hairline,
    backgroundColor: '#111113',
  },
  closePressed: { backgroundColor: '#1a1a1d' },
  closeText: { fontFamily: fonts.oswaldSemiBold, fontSize: 12, letterSpacing: 2.2, color: colors.textSub },
});
