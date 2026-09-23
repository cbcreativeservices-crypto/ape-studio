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
 *   4. The per-topic description (Computer C copy) as a left-aligned reading block.
 *   5. "WHERE THESE SKILLS APPLY": per-topic roles as passive tags (NOT buttons).
 *   6. Fixed footer CLOSE — outside the scroll so it is always reachable.
 *
 * SWIPE (2026-09-15): swipe left / right steps to the next / previous topic in
 * the list being browsed (`nav`, owned by CurriculumScreen) without closing.
 * The card SHELL (frame + footer) stays put; only the item CONTENT slides and
 * crossfades, and the art crossfades through `ArtCrossfade` so a step never
 * shows a blank frame. Core PanResponder → reanimated; see
 * components/detailSwipe.tsx for the motion + the scroll arbitration.
 *
 * The art head is exactly that — a head. It is not tappable and opens no
 * second viewer: this popup already IS the expanded view (owner 2026-09-15).
 *
 * SCROLL BUDGET (2026-09-15 fix): the ScrollView used to rely on flex-shrink
 * inside a card bounded only by `maxHeight` (itself taken from the WINDOW
 * height, not the modal's real content area), so on real devices its bottom
 * sat under the fixed footer and the last role tags could never be reached.
 * Now the card budget is measured from the scrim actually on screen and the
 * ScrollView gets its OWN explicit bound: budget − measured footer − border.
 */
import { useState } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { DetailPager } from '../../components/detailSwipe';
import { TrophyImage } from '../../components/TrophyImage';
import { topicImagePath } from '../../data/topicImages';
import { useEntitlement } from '../../features/commercial/EntitlementProvider';
import { LowLightDim } from '../../features/settings/LowLightLayer';
import { colors, fonts } from '../../theme/tokens';
import { REQUIRES_LABEL, type Career } from '../../data/careerRequirement';

export type TopicDetail = {
  gs: number;
  name: string;
  subjectName: string | null;
  field: string | null;
  /** Per-topic description (Computer C copy). */
  description: string | null;
  /** Where these skills apply — per-topic roles (Computer C copy). Rendered as
   *  passive tags, not buttons; roles needing further education are labelled.
   *  May be empty. */
  roles: readonly Career[];
  /** Glossary terms covered by this topic. */
  terms: number | null;
};

/** Thousands separator without relying on Intl (limited under Hermes). */
const fmt = (n: number) => n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');

const CARD_MAX_W = 380;
const SCRIM_PAD = 22;
const CARD_BG = '#141416';
const CARD_BORDER = 1;
/** Footer height before its first onLayout (minHeight 48 + top rule). */
const FOOTER_SEED = 49;

export function TopicDetailModal({
  topic,
  prev,
  next,
  onStep,
  onClose,
  onEnrollTopic,
  isTopicEnrolled,
}: {
  topic: TopicDetail | null;
  /** Neighbours in the browsed list for the swipe pager (parent-owned); null at
   *  a list end. Omit prev+next+onStep for a popup with nothing to swipe to. */
  prev?: TopicDetail | null;
  next?: TopicDetail | null;
  onStep?: (dir: 1 | -1) => void;
  onClose: () => void;
  /** Enrol THIS topic (owner 2026-09-15). When provided, the footer shows an
   *  acknowledgement checkbox + Enroll button to the left of Close. Enroll only
   *  fires once acknowledged; it does NOT navigate or close — the user closes. */
  onEnrollTopic?: (gs: number) => void;
  /** Whether a gs is already enrolled (parent-owned, reactive). */
  isTopicEnrolled?: (gs: number) => boolean;
}) {
  const { width, height } = useWindowDimensions();
  const cardW = Math.min(width - SCRIM_PAD * 2, CARD_MAX_W);
  const pageW = cardW - CARD_BORDER * 2;
  // Square art (TrophyImage is contain-fit) — full page width, but never more
  // than ~42% of the window so the identity block is on screen at open.
  const art = Math.min(pageW, Math.round(height * 0.42));
  // Card budget = 86% of the window, but never more than the scrim ACTUALLY on
  // screen (the modal's content area can be shorter than the window).
  // A ticked box must not claim more than the entitlement allows (S2).
  const { entitlement, resolved } = useEntitlement();
  /**
   * ⛔ HOLD THE MEMBER-FAVOURING STATE UNTIL `resolved`. The provider boots at
   * 'anonymous', so gating on `entitlement` alone told a PAYING member that the
   * topic they just ticked "needs Academy membership" — during the pre-resolve
   * window, and permanently for a member whose boot read failed with no
   * `lastTier` cache (a reinstall with no signal). This was the only one of the
   * `useEntitlement()` consumers reading the tier for a decision without also
   * reading `resolved`; `studyGate.ts`, `withMembershipPreview` and the glossary
   * all hold. It is text only — no access is withheld either way — but telling a
   * member they have not paid is not a small thing. (overnight hunt 2026-09-23)
   */
  const needsMembership = resolved && entitlement !== 'academy';
  const [scrimH, setScrimH] = useState(0);
  const [footerH, setFooterH] = useState(FOOTER_SEED);
  const budget = Math.min(Math.round(height * 0.86), scrimH > 0 ? scrimH - SCRIM_PAD * 2 : Infinity);
  const scrollMax = Math.max(120, budget - footerH - CARD_BORDER * 2);

  // Enrolment (owner 2026-09-15): the footer checkbox enrols this topic in place
  // — it never navigates or closes; the user then taps CLOSE. The box reflects
  // the live enrolled state and toggles it.
  const canEnroll = !!onEnrollTopic && topic != null;
  const enrolled = !!topic && !!isTopicEnrolled?.(topic.gs);

  // One topic's content = the art head + the spec-sheet body, in its own
  // vertical ScrollView (nested inside the horizontal pager on Android).
  const renderPage = (t: TopicDetail) => (
    <ScrollView
      style={{ maxHeight: scrollMax }}
      showsVerticalScrollIndicator={false}
      nestedScrollEnabled
      bounces={false}
      directionalLockEnabled
    >
      {/* Art head — full bleed, seated into the card by the fade. Not tappable:
          this popup already IS the expanded view. */}
      <View style={[styles.artWell, { height: art }]}>
        <View style={{ width: art, height: art }}>
          <TrophyImage iconUrl={topicImagePath(t.gs)} fill radius={0} fallback={<View style={styles.artEmpty} />} />
        </View>
        <LinearGradient
          pointerEvents="none"
          colors={['rgba(20,20,22,0)', 'rgba(20,20,22,0.55)', CARD_BG]}
          locations={[0, 0.6, 1]}
          style={styles.artFade}
        />
        <Text style={styles.artWatermark}>Stylized illustration — not technically accurate</Text>
      </View>

      <View style={styles.body}>
        <View style={styles.identity}>
          {t.field ? <Text style={styles.field}>{t.field.toUpperCase()}</Text> : null}
          {t.subjectName ? <Text style={styles.subject}>{t.subjectName.toUpperCase()}</Text> : null}
          <Text accessibilityRole="header" style={styles.title}>{t.name}</Text>
        </View>

        {t.terms != null ? (
          <View style={styles.stat} accessible accessibilityLabel={`${fmt(t.terms)} glossary terms in this topic`}>
            <Text style={styles.statNum}>{fmt(t.terms)}</Text>
            <View style={styles.statLabels}>
              <Text style={styles.statLabel}>GLOSSARY TERMS</Text>
              <Text style={styles.statSub}>covered in this topic</Text>
            </View>
          </View>
        ) : null}

        {t.description ? <Text style={styles.desc}>{t.description}</Text> : null}

        {t.roles.length ? (
          <View style={styles.rolesBlock}>
            <Text style={styles.rolesLabel}>WHERE THESE SKILLS APPLY</Text>
            <View
              style={styles.tags}
              accessible
              accessibilityLabel={`Where these skills apply: ${t.roles
                .map((r) => (r.requires ? `${r.name} — ${REQUIRES_LABEL[r.requires]}` : r.name))
                .join(', ')}`}
            >
              {t.roles.map((r) => (
                <View key={r.name} style={styles.tag}>
                  <Text style={styles.tagText}>{r.name}</Text>
                  {r.requires ? <Text style={styles.reqNote}>{REQUIRES_LABEL[r.requires]}</Text> : null}
                </View>
              ))}
            </View>
            {/* ⛔ UNCONDITIONAL — see the twin note in CredentialDetailModal. */}
            <Text style={styles.rolesNote}>
              Studying this topic supports these roles; it does not qualify anyone for them. Some
              need a degree, licence or certification beyond the Academy (shown on the role).
            </Text>
          </View>
        ) : null}
      </View>
    </ScrollView>
  );

  return (
    <Modal accessibilityViewIsModal visible={topic != null} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.scrim} onLayout={(e) => setScrimH(e.nativeEvent.layout.height)}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityRole="button" accessibilityLabel="Close" />
        <View style={[styles.card, { maxHeight: budget }]} accessibilityViewIsModal>
          {topic ? (
            <>
              {onStep ? (
                <DetailPager
                  width={pageW}
                  prev={prev ?? null}
                  current={topic}
                  next={next ?? null}
                  onStep={onStep}
                  renderPage={renderPage}
                />
              ) : (
                renderPage(topic)
              )}

              {/* Fixed footer — always reachable regardless of scroll. Checking
                  the box IS the enrolment (owner 2026-09-15): it enrols in place,
                  never navigates or closes; the user then taps CLOSE. */}
              <View style={styles.footer} onLayout={(e) => setFooterH(Math.round(e.nativeEvent.layout.height))}>
                {canEnroll ? (
                  <Pressable
                    style={styles.ackRow}
                    onPress={() => { if (topic) onEnrollTopic?.(topic.gs); }}
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked: enrolled }}
                    accessibilityLabel="Add this topic to my enrolled studies"
                  >
                    <View style={[styles.checkbox, enrolled && styles.checkboxOn]}>
                      {enrolled ? <Text style={styles.checkboxTick}>✓</Text> : null}
                    </View>
                    {/* S2: this screen has no entitlement check, so a FREE
                        user could tick the box, read "Added", and then be
                        refused the topic twice in two different words — on the
                        Home gate and on the Enrollments screen. Say the
                        condition here, at the moment the box is ticked. */}
                    <Text style={styles.ackText}>
                      {enrolled
                        ? needsMembership
                          ? 'Saved to your list — studying this topic needs Academy membership.'
                          : 'Added to My Enrollments'
                        : 'Add this topic to My Enrollments'}
                    </Text>
                  </Pressable>
                ) : null}
                <Pressable
                  style={({ pressed }) => [styles.close, pressed && styles.closePressed]}
                  onPress={onClose}
                  accessibilityRole="button"
                  accessibilityLabel="Close"
                >
                  <Text style={styles.closeText}>CLOSE</Text>
                </Pressable>
              </View>
            </>
          ) : null}
        </View>
      </View>
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
    borderWidth: CARD_BORDER,
    borderColor: colors.hairline,
    overflow: 'hidden',
  },

  // Art head.
  artWell: { width: '100%', alignItems: 'center', backgroundColor: '#0d0d0e' },
  artEmpty: { flex: 1, backgroundColor: '#1a1a1c' },
  artFade: { position: 'absolute', left: 0, right: 0, bottom: 0, height: '38%' },
  // Faint disclaimer: topic art is illustrative, not a technical diagram. Sits at
  // the TOP so it clears the identity block that overlays the lower fade.
  artWatermark: {
    position: 'absolute',
    top: 6,
    left: 0,
    right: 0,
    textAlign: 'center',
    fontFamily: fonts.barlowRegular,
    fontSize: 9,
    letterSpacing: 0.4,
    color: 'rgba(220,228,238,0.42)',
  },

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

  // Per-topic description — left-aligned reading block.
  desc: { fontFamily: fonts.barlowMedium, fontSize: 15.5, lineHeight: 23, color: colors.textSecondary },

  // Where these skills apply — passive tags (NOT buttons): no border, soft
  // neutral fill, muted text, so nothing reads as tappable (owner 2026-09-15).
  rolesBlock: { gap: 10 },
  rolesLabel: { fontFamily: fonts.oswaldSemiBold, fontSize: 11, letterSpacing: 1.6, color: colors.textSub },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tag: { backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 6, paddingHorizontal: 10, paddingVertical: 5 },
  tagText: { fontFamily: fonts.barlowMedium, fontSize: 13.5, lineHeight: 17, color: colors.textSecondary },
  rolesNote: { fontFamily: fonts.barlowRegular, fontSize: 12, lineHeight: 17, color: '#ffb060', marginTop: 8 },
  reqNote: { fontFamily: fonts.barlowMedium, fontSize: 10.5, lineHeight: 13, letterSpacing: 0.2, color: colors.textSub, marginTop: 2 },

  // Footer: optional acknowledge row + a row of [Enroll | Close].
  footer: { borderTopWidth: 1, borderTopColor: colors.hairline, backgroundColor: '#111113' },
  ackRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 11,
    borderBottomWidth: 1,
    borderBottomColor: colors.hairlineDim,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: colors.textSub,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxOn: { borderColor: colors.green, backgroundColor: 'rgba(55,224,95,0.15)' },
  checkboxTick: { color: colors.green, fontSize: 13, lineHeight: 15, fontFamily: fonts.oswaldSemiBold },
  ackText: { flex: 1, fontFamily: fonts.barlowMedium, fontSize: 13, lineHeight: 17, color: colors.textSecondary },

  close: { minHeight: 48, alignItems: 'center', justifyContent: 'center' },
  closePressed: { backgroundColor: '#1a1a1d' },
  closeText: { fontFamily: fonts.oswaldSemiBold, fontSize: 12, letterSpacing: 2.2, color: colors.textSub },
});
