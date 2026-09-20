/**
 * CredentialDetailModal — the expanded view of ONE certificate / program path,
 * opened from a flat chooser row (owner 2026-09-15; replaces the inline
 * expand/collapse cards on AwardsScreen).
 *
 * VISUAL SHELL = TopicDetailModal (Explore's expanded topic view), so the two
 * "look closer at one thing" popups in the Academy read as the same object:
 *   1. Full-bleed credential art across the head of the card, fading into the
 *      card surface. The art is a HEAD, not a button: this popup already is
 *      the expanded view, so it opens no second full-screen viewer (owner
 *      2026-09-15 — the tap-to-open + corner tick were removed as redundant).
 *   2. Identity block, left-aligned: eyebrow (SPECIALIZATION CERTIFICATE in amber /
 *      PROGRAM CERTIFICATE in purple) › credential title. The accent colour is
 *      the ONLY thing that says cert-vs-program at this level; no glyphs.
 *   3. Info readout: mono green number + stacked label in an inset panel — the
 *      standard slot Computer C's per-credential data will fill. Today it holds
 *      the one metric the catalog already carries: the total number of required
 *      topics (core + this credential's own), with the split spelled out.
 *   4. The credential's own topic list (SPECIALIZATION TOPICS / REQUIRED
 *      TOPICS, plus ELECTIVE — CHOOSE ONE for programs that carry electives).
 *   5. FIXED FOOTER — unlike the view-only topic popup this one is ACTIONABLE:
 *      ENROLL (green) and VIEW PROGRESS & FINAL EXAM (amber) sit outside the
 *      scroll so they are always reachable, then a quiet CLOSE row.
 *
 * Presentation + wiring only: the enroll / progress handlers are passed in by
 * AwardsScreen and are the SAME functions the inline cards used to call.
 *
 * SWIPE (2026-09-15): swipe left / right steps to the next / previous
 * credential in the A–Z list currently shown (`nav`, owned by AwardsScreen)
 * without closing. The card SHELL (frame + ENROLL / VIEW PROGRESS / CLOSE)
 * stays put; only the item CONTENT slides and crossfades, and the art
 * crossfades through `ArtCrossfade` (the previous picture stays until the next
 * has loaded) — which is what removed the flash on stepping. Core PanResponder
 * → reanimated; see components/detailSwipe.tsx.
 *
 * SCROLL BUDGET (2026-09-15, twin of TopicDetailModal's fix): the ScrollView
 * gets its OWN explicit bound — the measured card budget minus the measured
 * ENROLL / VIEW PROGRESS / CLOSE footer — so every specialization topic
 * scrolls fully into view above the fixed footer, on small screens too.
 */
import { useState } from 'react';
import { Image, Modal, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { DetailPager } from '../../components/detailSwipe';
import { CardArt } from '../../components/CardArt';
import { LowLightDim } from '../../features/settings/LowLightLayer';
import { colors, fonts } from '../../theme/tokens';
import { credentialCopy } from '../../data/credentialCopy';
import { REQUIRES_LABEL } from '../../data/careerRequirement';
import { credentialArtUrl, credentialEyebrow } from './CredentialThumb';

export type CredentialDetail = {
  kind: 'certificate' | 'program';
  id: string;
  slug: string;
  name: string;
  /** This credential's OWN topics (specialization topics for a certificate;
   *  required non-elective topics for a program). */
  topics: number[];
  /** Program electives (choose one); empty for certificates. */
  electives: number[];
};

/** Mix a #rrggbb colour toward white by `amt` (0..1) — for a softer chip frame. */
function lighten(hex: string, amt: number): string {
  if (hex[0] !== '#' || hex.length < 7) return hex;
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const mix = (c: number) => Math.round(c + (255 - c) * amt);
  return `rgb(${mix(r)},${mix(g)},${mix(b)})`;
}

const CARD_MAX_W = 380;
const SCRIM_PAD = 22;
const CARD_BG = '#141416';
const CARD_BORDER = 1;
/** Footer height before its first onLayout (two buttons + CLOSE row). Enrolled
 *  adds two more, but the footer re-measures on layout — this is only the seed. */
const FOOTER_SEED = 152;

/** The Study tab's own icon, so STUDY NOW looks like where it sends you. */
const STUDY_ICON = require('../../../assets/icons/nav/nav-study.png');

export function CredentialDetailModal({
  credential,
  accent,
  coreCount,
  nameForGs,
  onEnroll,
  onProgress,
  onStudy,
  onEnrollments,
  overlay,
  onClose,
  isEnrolled,
  prev,
  next,
  onStep,
}: {
  credential: CredentialDetail | null;
  /** Amber for certificates, purple for programs. */
  accent: string;
  /** Number of required core topics every credential shares (COREQ_TOPIC_GS). */
  coreCount: number;
  nameForGs: (gs: number) => string;
  /** Enrol/unenrol this credential IN PLACE — never navigates or closes (owner
   *  2026-09-16, matching the topic view). */
  onEnroll: (c: CredentialDetail) => void;
  onProgress: (c: CredentialDetail) => void;
  /** Open the dashboard already loaded with this credential's first topic.
   *  Omit for an account that cannot hold an enrollment — the button is then
   *  not rendered at all rather than rendered and lying. */
  onStudy?: (c: CredentialDetail) => void;
  /** Open My Enrollments. Same rule as `onStudy`. */
  onEnrollments?: () => void;
  /** Anything that must render ABOVE this modal — in practice the
   *  PrePaywallPrompt in `embedded` mode. It has to live INSIDE this Modal's
   *  tree: on Android a sibling Modal attaches to the activity window and is
   *  drawn BENEATH this one. See the note atop components/PrePaywallPrompt. */
  overlay?: React.ReactNode;
  onClose: () => void;
  /** Whether this credential is already enrolled (parent-owned, reactive). */
  isEnrolled?: (c: CredentialDetail) => boolean;
  /** Neighbours in the A–Z list for the swipe pager (parent-owned); null at a
   *  list end. Omit prev+next+onStep for a popup with nothing to swipe to. */
  prev?: CredentialDetail | null;
  next?: CredentialDetail | null;
  onStep?: (dir: 1 | -1) => void;
}) {
  const { width, height } = useWindowDimensions();
  const cardW = Math.min(width - SCRIM_PAD * 2, CARD_MAX_W);
  const pageW = cardW - CARD_BORDER * 2;
  // The card art is landscape-ish; cap the head at ~34% of the window so the
  // identity block + readout are on screen at open, above the fold.
  const artH = Math.min(Math.round(pageW * 0.72), Math.round(height * 0.34));
  // Card budget = 88% of the window, but never more than the scrim ACTUALLY on
  // screen; the ScrollView is bounded by that budget minus the measured footer.
  /**
   * Did the credential's artwork fail to load? Only 66 of 128 certificates have
   * art uploaded, so for the MAJORITY this well used to render an empty dark
   * rectangle with "Simulated possible work environment" floating on it — and
   * announce "<name> artwork" to a screen reader for artwork that is not there.
   * CredentialWall already does this; the chooser did not, so the same
   * credential looked finished in one place and broken in the other.
   */
  const [artFailed, setArtFailed] = useState(false);
  const [scrimH, setScrimH] = useState(0);
  const [footerH, setFooterH] = useState(FOOTER_SEED);
  const budget = Math.min(Math.round(height * 0.88), scrimH > 0 ? scrimH - SCRIM_PAD * 2 : Infinity);
  const scrollMax = Math.max(120, budget - footerH - CARD_BORDER * 2);

  const enrolled = !!credential && !!isEnrolled?.(credential);
  const enrollLabel = enrolled
    ? 'ENROLLED ✓'
    : credential?.kind === 'certificate'
      ? 'ENROLL IN THIS CERTIFICATE ›'
      : 'ENROLL IN THIS PROGRAM ›';

  // One credential's content = art head + identity + readout + topic list, in
  // its own vertical ScrollView (nested inside the horizontal pager on Android).
  const renderPage = (c: CredentialDetail) => {
    const isCert = c.kind === 'certificate';
    const eyebrow = credentialEyebrow(c.kind);
    const copy = credentialCopy(c.slug);
    const total = coreCount + c.topics.length;
    const ownNoun = isCert ? 'specialization' : 'program';
    const listHead = isCert ? 'SPECIALIZATION TOPICS' : 'REQUIRED TOPICS';
    return (
      <ScrollView
        style={{ maxHeight: scrollMax }}
        showsVerticalScrollIndicator={false}
        nestedScrollEnabled
        bounces={false}
        directionalLockEnabled
      >
        {/* Art head — full bleed, seated into the card by the fade. Not tappable:
            this popup already IS the expanded view. */}
        <View
          style={[styles.artWell, { height: artH }]}
          accessible
          // Do not announce artwork that is not there.
          accessibilityLabel={artFailed ? `${c.name}` : `${c.name} artwork`}
        >
          <CardArt
            uri={credentialArtUrl(c.slug)}
            style={styles.artFill}
            imageStyle={styles.artImg}
            onExhausted={() => setArtFailed(true)}
          />
          {artFailed ? (
            // A deliberate, labelled placeholder rather than a blank well. The
            // credential is real even when its picture has not been made yet.
            <Text style={styles.artPlaceholder} numberOfLines={2}>
              {c.name}
            </Text>
          ) : (
            // The watermark describes the PICTURE, so it goes with the picture.
            <Text style={styles.artWatermark}>Simulated possible work environment</Text>
          )}
        </View>

        <View style={styles.body}>
          <View style={styles.identity}>
            {eyebrow ? <Text style={[styles.eyebrow, { color: accent }]}>{eyebrow}</Text> : null}
            <Text accessibilityRole="header" style={styles.title}>{c.name}</Text>
          </View>

          {copy?.description ? <Text style={styles.desc}>{copy.description}</Text> : null}

          <View
            style={styles.stat}
            accessible
            accessibilityLabel={`${total} required topics and labs: ${coreCount} core plus ${c.topics.length} ${ownNoun}`}
          >
            <Text style={styles.statNum}>{total}</Text>
            <View style={styles.statLabels}>
              <Text style={styles.statLabel}>REQUIRED TOPICS &amp; LABS</Text>
              <Text style={styles.statSub}>
                {coreCount} core + {c.topics.length} {ownNoun}
                {c.electives.length ? ' · 1 elective' : ''}
              </Text>
            </View>
          </View>

          <View style={styles.list}>
            <Text style={[styles.listHead, { color: accent }]}>{listHead}</Text>
            {c.topics.map((gs) => (
              <View key={gs} style={styles.topicRow}>
                <Text style={[styles.bullet, { color: accent }]}>•</Text>
                <Text style={styles.topicText}>{nameForGs(gs)}</Text>
              </View>
            ))}
            {c.electives.length ? (
              <>
                <Text style={[styles.listHead, styles.listHeadGap, { color: accent }]}>ELECTIVE — CHOOSE ONE</Text>
                {c.electives.map((gs) => (
                  <View key={gs} style={styles.topicRow}>
                    <Text style={[styles.bullet, { color: accent }]}>○</Text>
                    <Text style={styles.topicText}>{nameForGs(gs)}</Text>
                  </View>
                ))}
              </>
            ) : null}
          </View>

          {copy?.whereApplies.length ? (
            <View style={styles.metaBlock}>
              <Text style={[styles.metaLabel, { color: accent }]}>WHERE THESE SKILLS APPLY</Text>
              <View
                style={styles.tags}
                accessible
                accessibilityLabel={`Where these skills apply: ${copy.whereApplies.join(', ')}`}
              >
                {copy.whereApplies.map((w) => (
                  <View key={w} style={styles.tag}>
                    <Text style={styles.tagText}>{w}</Text>
                  </View>
                ))}
              </View>
            </View>
          ) : null}

          {copy?.careers.length ? (
            <View style={styles.metaBlock}>
              <Text style={[styles.metaLabel, { color: accent }]}>WHERE THIS KNOWLEDGE IS USED AT WORK</Text>
              <View
                style={styles.tags}
                accessible
                accessibilityLabel={`Careers this can lead to: ${copy.careers
                  .map((c) => (c.requires ? `${c.name} — ${REQUIRES_LABEL[c.requires]}` : c.name))
                  .join(', ')}`}
              >
                {copy.careers.map((r) => (
                  <View key={r.name} style={[styles.tag, styles.careerTag, { borderColor: lighten(accent, 0.75) }]}>
                    <Text style={styles.tagText}>{r.name}</Text>
                    {r.requires ? <Text style={styles.reqNote}>{REQUIRES_LABEL[r.requires]}</Text> : null}
                  </View>
                ))}
              </View>
              {/* ⛔ UNCONDITIONAL, AND IT STAYS UNCONDITIONAL. The per-role
                  chips only fire where a `requires` code was assigned, and most
                  role names have none — so gating this on "does any role here
                  need a credential" would make the disclosure true only some of
                  the time, which is how the CurriculumScreen matcher ended up
                  firing on 6 of 44 lists. */}
              <Text style={styles.careersNote}>
                This certificate documents Academy study. On its own it is not a qualification for
                any role — employers weigh experience and practical ability too, and some roles
                listed need a degree, licence or certification beyond the Academy (shown on the
                role).
              </Text>
            </View>
          ) : null}
        </View>
      </ScrollView>
    );
  };

  return (
    <Modal accessibilityViewIsModal visible={credential != null} transparent animationType="fade" statusBarTranslucent onRequestClose={onClose}>
      <View style={styles.scrim} onLayout={(e) => setScrimH(e.nativeEvent.layout.height)}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityRole="button" accessibilityLabel="Close" />
        <View style={[styles.card, { maxHeight: budget }]} accessibilityViewIsModal>
          {credential ? (
            <>
              {onStep ? (
                <DetailPager
                  width={pageW}
                  prev={prev ?? null}
                  current={credential}
                  next={next ?? null}
                  onStep={onStep}
                  renderPage={renderPage}
                />
              ) : (
                renderPage(credential)
              )}

              {/* Fixed, ACTIONABLE footer — outside the scroll. Measured so the
                  scroll budget above is exact. */}
              <View style={styles.footer} onLayout={(e) => setFooterH(Math.round(e.nativeEvent.layout.height))}>
                <Pressable
                  style={({ pressed }) => [styles.enrollBtn, enrolled && styles.enrollBtnDone, pressed && styles.btnPressed]}
                  onPress={() => onEnroll(credential)}
                  accessibilityRole="button"
                  accessibilityState={{ checked: enrolled }}
                  accessibilityLabel={enrolled ? `Enrolled in ${credential.name}` : `Enroll in ${credential.name}`}
                >
                  <Text style={styles.enrollBtnText}>{enrollLabel}</Text>
                </Pressable>

                {/* ── ONCE ENROLLED, WHERE DO I GO? ────────────────────────────
                    Owner 2026-09-19, watching an enrol on the Pixel: the button
                    flipped to ENROLLED ✓ and the screen offered nothing to do
                    next. Enrolling is a commitment, and the moment right after
                    it is when someone is most willing to start.

                    Both are OPTIONAL and the HOST decides whether to pass them.
                    They are only handed in when the account can actually hold
                    an enrollment — offering "go to my enrollments" to someone
                    whose pick will not survive the session is a lie, and this
                    modal deliberately knows nothing about entitlement. */}
                {enrolled && onStudy ? (
                  <Pressable
                    style={({ pressed }) => [styles.studyBtn, pressed && styles.btnPressed]}
                    onPress={() => onStudy(credential)}
                    accessibilityRole="button"
                    accessibilityLabel={`Study ${credential.name} now — opens your dashboard`}
                  >
                    <Image source={STUDY_ICON} style={styles.studyIcon} resizeMode="contain" />
                    <Text style={styles.studyBtnText}>STUDY NOW ›</Text>
                  </Pressable>
                ) : null}
                {enrolled && onEnrollments ? (
                  <Pressable
                    style={({ pressed }) => [styles.enrollmentsBtn, pressed && styles.btnPressed]}
                    onPress={onEnrollments}
                    accessibilityRole="button"
                    accessibilityLabel="Go to my enrollments"
                  >
                    <Text style={styles.enrollmentsBtnText}>GO TO MY ENROLLMENTS ›</Text>
                  </Pressable>
                ) : null}

                <Pressable
                  style={({ pressed }) => [styles.progressBtn, pressed && styles.btnPressed]}
                  onPress={() => onProgress(credential)}
                  accessibilityRole="button"
                  accessibilityLabel={`View progress and Final Exam for ${credential.name}`}
                >
                  <Text style={styles.progressBtnText}>VIEW PROGRESS & FINAL EXAM ›</Text>
                </Pressable>
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
      {/* ABOVE the card, INSIDE this Modal — a sibling Modal would be drawn
          beneath it on Android. See components/PrePaywallPrompt. */}
      {overlay}
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
  artWell: { width: '100%', backgroundColor: CARD_BG },
  artFill: { width: '100%', height: '100%' },
  artImg: { borderRadius: 0 },
  // Faint disclaimer over the art: the pictures are illustrative, not real rooms.
  artPlaceholder: {
    position: 'absolute',
    left: 16,
    right: 16,
    top: 0,
    bottom: 0,
    textAlign: 'center',
    textAlignVertical: 'center',
    fontFamily: fonts.oswaldSemiBold,
    fontSize: 15,
    letterSpacing: 0.8,
    lineHeight: 22,
    color: 'rgba(220,228,238,0.45)',
  },
  artWatermark: {
    position: 'absolute',
    bottom: 6,
    left: 0,
    right: 0,
    textAlign: 'center',
    fontFamily: fonts.barlowRegular,
    fontSize: 9,
    letterSpacing: 0.4,
    color: 'rgba(220,228,238,0.42)',
  },

  body: { paddingHorizontal: 20, paddingTop: 18, paddingBottom: 22, gap: 18 },

  // Identity block.
  identity: { gap: 3 },
  eyebrow: { fontFamily: fonts.oswaldSemiBold, fontSize: 12, letterSpacing: 1.8 },
  title: { fontFamily: fonts.oswaldSemiBold, fontSize: 25, lineHeight: 30, letterSpacing: 0.2, color: colors.textPrimary, marginTop: 4 },

  // Per-credential description — left-aligned reading block (TopicDetailModal grammar).
  desc: { fontFamily: fonts.barlowMedium, fontSize: 15, lineHeight: 22, color: colors.textSecondary },

  // Where-applies / careers — passive tags, NOT buttons. Careers get a thin
  // accent outline so the "path forward" reads as the credential's own colour.
  metaBlock: { gap: 10 },
  metaLabel: { fontFamily: fonts.oswaldSemiBold, fontSize: 11, letterSpacing: 1.6 },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tag: { backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 6, paddingHorizontal: 10, paddingVertical: 5 },
  careerTag: { backgroundColor: 'transparent', borderWidth: StyleSheet.hairlineWidth },
  tagText: { fontFamily: fonts.barlowMedium, fontSize: 13.5, lineHeight: 17, color: colors.textSecondary },
  careersNote: { fontFamily: fonts.barlowRegular, fontSize: 12, lineHeight: 17, color: '#ffb060', marginTop: 8 },
  reqNote: { fontFamily: fonts.barlowMedium, fontSize: 10.5, lineHeight: 13, letterSpacing: 0.2, color: colors.textSub, marginTop: 2 },

  // Info readout (TopicDetailModal grammar: Share Tech Mono, green).
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
  statLabels: { flex: 1, gap: 1, borderLeftWidth: 1, borderLeftColor: colors.hairline, paddingLeft: 14 },
  statLabel: { fontFamily: fonts.oswaldSemiBold, fontSize: 11, letterSpacing: 1.6, color: colors.textSecondary },
  statSub: { fontFamily: fonts.barlowRegular, fontSize: 13, color: colors.textSub },

  // Topic list.
  list: { gap: 6 },
  listHead: { fontFamily: fonts.oswaldSemiBold, fontSize: 11, letterSpacing: 1.6, marginBottom: 2 },
  listHeadGap: { marginTop: 10 },
  topicRow: { flexDirection: 'row', gap: 9, alignItems: 'flex-start', paddingLeft: 2 },
  bullet: { fontFamily: fonts.barlowRegular, fontSize: 16, lineHeight: 22, width: 12 },
  topicText: { flex: 1, fontFamily: fonts.barlowMedium, fontSize: 15, lineHeight: 22, color: colors.textSecondary },

  // Footer: actions + close. Same button colours as the retired inline cards
  // (green = "add these topics", amber = "the earn path for this award").
  footer: { borderTopWidth: 1, borderTopColor: colors.hairline, backgroundColor: '#111113', paddingHorizontal: 14, paddingTop: 12 },
  enrollBtn: {
    borderWidth: 1.5,
    borderColor: 'rgba(55,224,95,.7)',
    backgroundColor: 'rgba(55,224,95,.1)',
    borderRadius: 9,
    paddingVertical: 11,
    alignItems: 'center',
  },
  enrollBtnDone: { backgroundColor: 'rgba(55,224,95,.22)', borderColor: colors.green },
  enrollBtnText: { fontFamily: fonts.oswaldSemiBold, fontSize: 13, letterSpacing: 1, color: colors.green },
  progressBtn: {
    marginTop: 8,
    borderWidth: 1.5,
    borderColor: 'rgba(255,198,77,.7)',
    backgroundColor: 'rgba(255,198,77,.1)',
    borderRadius: 9,
    paddingVertical: 11,
    alignItems: 'center',
  },
  progressBtnText: { fontFamily: fonts.oswaldSemiBold, fontSize: 13, letterSpacing: 1, color: colors.amber },
  /* STUDY NOW — the Study tab's own blue and its own icon, so the button looks
     like the place it sends you. */
  studyBtn: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
    borderWidth: 1.5,
    borderColor: 'rgba(47,155,255,.7)',
    backgroundColor: 'rgba(47,155,255,.12)',
    borderRadius: 9,
    paddingVertical: 11,
  },
  studyIcon: { width: 19, height: 19 },
  studyBtnText: { fontFamily: fonts.oswaldSemiBold, fontSize: 13, letterSpacing: 1, color: colors.blue },
  /* Quieter than the other three: a useful onward door, not the main one. */
  enrollmentsBtn: {
    marginTop: 8,
    borderWidth: 1,
    borderColor: colors.hairline,
    borderRadius: 9,
    paddingVertical: 10,
    alignItems: 'center',
  },
  enrollmentsBtnText: { fontFamily: fonts.oswaldSemiBold, fontSize: 12, letterSpacing: 1.4, color: colors.textSecondary },
  btnPressed: { opacity: 0.7 },
  close: { minHeight: 46, alignItems: 'center', justifyContent: 'center', marginTop: 4, marginHorizontal: -14 },
  closePressed: { backgroundColor: '#1a1a1d' },
  closeText: { fontFamily: fonts.oswaldSemiBold, fontSize: 12, letterSpacing: 2.2, color: colors.textSub },
});
