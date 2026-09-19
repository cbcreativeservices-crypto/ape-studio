/**
 * EnrollmentSelection — the head of MY ENROLLMENT: whichever thing the list
 * below belongs to, shown full width.
 *
 * ── WHY THIS IS NOT A CAROUSEL ANY MORE (owner 2026-09-19) ──────────────────
 *
 * It was one: a snapping deck of cards with the neighbours peeking at the
 * edges. That put a bordered card INSIDE the green MY ENROLLMENT frame — a box
 * within a box — and the owner was right that it read as a separate thing
 * sitting in the panel rather than as the panel's own heading. It also spent a
 * third of the width on cards you were not looking at.
 *
 * So: one selection at a time, full width, with no frame of its own. Moving
 * between selections is the ‹ › control in the nav row above, which is now
 * large and obvious precisely because it is the only way through. Nothing is
 * shown off to the sides.
 *
 * Because the nested card is gone, everything here can breathe — the icon, the
 * title and the controls are all bigger than they could be inside a 280pt card.
 *
 * ── PRESENTATION ONLY ───────────────────────────────────────────────────────
 * No enrollment state and no rules: loading, navigation and progress arrive as
 * props from EnrollmentScreen, which stays the one place those happen.
 */
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { CredentialThumb } from '../awards/CredentialThumb';
import { MyTopicsIcon } from '../../components/MyTopicsIcon';
import { LedMeter, segmentsForPct } from '../../components/LedMeter';
import { colors, fonts } from '../../theme/tokens';

/** The Study tab's own icon, so the control looks like where it sends you. */
const STUDY_ICON = require('../../../assets/icons/nav/nav-study.png');

export const CERT_BLUE = '#2f9bff';
export const PROGRAM_PURPLE = '#b06cff';

/**
 * One selectable thing. `kind: 'topics'` is ALL TOPICS and is always first;
 * `placeholder` is the empty-state stand-in.
 */
export type CarouselCard = {
  key: string;
  kind: 'topics' | 'cert' | 'program' | 'subject' | 'placeholder';
  title: string;
  /** Credential slug for the artwork; null for ALL TOPICS and subjects. */
  slug: string | null;
  /** 0–100 across this selection's topics. */
  pct: number;
  topicCount: number;
  /** Every one of its topics is in the study deck. */
  allLoaded: boolean;
};

export function accentFor(kind: CarouselCard['kind']): string {
  if (kind === 'placeholder') return colors.textSub;
  return kind === 'program' ? PROGRAM_PURPLE : kind === 'cert' ? CERT_BLUE : colors.amber;
}

function labelFor(kind: CarouselCard['kind']): string {
  return kind === 'topics'
    ? 'ALL TOPICS'
    : kind === 'program'
      ? 'PROGRAM'
      : kind === 'cert'
        ? 'CERTIFICATE'
        : 'SUBJECT';
}

export function EnrollmentSelection({
  card,
  onToggleLoad,
  onStudy,
}: {
  card: CarouselCard | null;
  /** Load / unload EVERY topic of this selection in one action. */
  onToggleLoad: (card: CarouselCard) => void;
  /** Open the Dashboard on this selection's work. */
  onStudy: (card: CarouselCard) => void;
}) {
  if (!card) return null;
  const accent = accentFor(card.kind);
  const isTopics = card.kind === 'topics';

  /**
   * A member with no credentials yet would otherwise see nothing here and not
   * know the ‹ › control leads anywhere. This says what will appear and is
   * deliberately inert — muted, dashed, a space to fill rather than something
   * that failed to load.
   */
  if (card.kind === 'placeholder') {
    return (
      <View
        style={s.ghost}
        accessible
        accessibilityLabel="No certificates or programs yet. Ones you enrol in appear here, beside your topics."
      >
        <View style={s.ghostThumb}>
          <Text style={s.ghostGlyph}>+</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={s.ghostTitle}>Your certificates and programs</Text>
          <Text style={s.ghostBody}>Enrol in one and it appears here, beside your topics.</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={s.wrap}>
      <View style={s.head}>
        {card.slug ? (
          /* The same framed viewer box the Dashboard gives a topic — tap it and
             the artwork opens full screen. CredentialThumb already owns that
             viewer, so this is that component and not a second one. */
          <CredentialThumb
            slug={card.slug}
            title={card.title}
            accent={accent}
            size={78}
            kind={card.kind === 'program' ? 'program' : 'certificate'}
          />
        ) : (
          /* No box around it (owner 2026-09-19) — the mark stands on its
             own, the way the book does in the reference. */
          <MyTopicsIcon size={78} color={accent} framed={false} />
        )}
        <View style={s.headText}>
          <Text style={[s.kind, { color: accent }]}>{labelFor(card.kind)}</Text>
          <Text style={s.title} numberOfLines={2}>
            {card.title}
          </Text>
          <Text style={s.count}>
            {card.topicCount} topic{card.topicCount === 1 ? '' : 's'}
          </Text>
        </View>
      </View>

      <View style={s.meterRow}>
        <LedMeter filled={segmentsForPct(card.pct)} segWidth={6} />
        <Text style={s.pct}>{card.pct}%</Text>
      </View>

      <View style={s.actionRow}>
        <Pressable
          style={[s.loadBtn, card.allLoaded && { borderColor: colors.green, backgroundColor: 'rgba(55,224,95,.14)' }]}
          onPress={() => onToggleLoad(card)}
          hitSlop={6}
          accessibilityRole="button"
          accessibilityState={{ selected: card.allLoaded }}
          aria-pressed={card.allLoaded}
          accessibilityLabel={
            card.allLoaded
              ? `Unload all ${card.topicCount} topics of ${card.title} from the study deck`
              : `Load all ${card.topicCount} topics of ${card.title} into the study deck`
          }
        >
          {/* Names the ACTION, not the state — one tap moves every topic. */}
          <Text style={[s.loadText, card.allLoaded && { color: colors.green }]}>
            {card.allLoaded ? 'UNLOAD ALL TOPICS' : 'LOAD ALL TOPICS'}
          </Text>
        </Pressable>
        <View style={{ flex: 1 }} />
        <Pressable
          style={s.studyBtn}
          onPress={() => onStudy(card)}
          hitSlop={6}
          accessibilityRole="button"
          accessibilityLabel={
            isTopics
              ? 'Study — open your dashboard'
              : `Study all of ${card.title} — loads its ${card.topicCount} topics and opens your dashboard`
          }
        >
          <Image source={STUDY_ICON} style={s.studyIcon} resizeMode="contain" />
          <Text style={s.studyText}>{isTopics ? 'STUDY' : 'STUDY ALL'}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  // No frame and no background: this IS the green panel's heading now, not a
  // card sitting inside it.
  wrap: { gap: 8, paddingTop: 4, paddingBottom: 14, borderBottomWidth: 1, borderBottomColor: colors.hairline },
  head: { flexDirection: 'row', alignItems: 'flex-start', gap: 14 },
  headText: { flex: 1, paddingTop: 3 },
  // Not a pill. It is a label, and a box on it reads as a button that is not.
  kind: { alignSelf: 'flex-start', fontFamily: fonts.oswaldSemiBold, fontSize: 11, letterSpacing: 1.3, marginBottom: 3 },
  title: { fontFamily: fonts.oswaldSemiBold, fontSize: 21, lineHeight: 25, color: colors.textPrimary },
  count: { fontFamily: fonts.mono, fontSize: 13, color: colors.textSub, marginTop: 5 },
  meterRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  pct: { fontFamily: fonts.mono, fontSize: 14, color: colors.textSecondary },
  actionRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 6 },
  loadBtn: {
    borderWidth: 1,
    borderColor: colors.hairline,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 9,
    minHeight: 44,
    justifyContent: 'center',
  },
  loadText: { fontFamily: fonts.oswaldSemiBold, fontSize: 11.5, letterSpacing: 1, color: colors.textSub },
  studyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    minHeight: 44,
    paddingHorizontal: 13,
    borderWidth: 1.5,
    borderColor: colors.blue,
    backgroundColor: 'rgba(47,155,255,.14)',
    borderRadius: 8,
  },
  studyIcon: { width: 26, height: 26 },
  studyText: { fontFamily: fonts.oswaldSemiBold, fontSize: 13.5, letterSpacing: 1, color: colors.blue },

  ghost: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 16,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.hairline,
  },
  ghostThumb: {
    width: 62,
    height: 62,
    borderRadius: 12,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#2e2e35',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ghostGlyph: { fontFamily: fonts.oswaldMedium, fontSize: 26, color: '#4a4a55' },
  ghostTitle: { fontFamily: fonts.oswaldSemiBold, fontSize: 15, letterSpacing: 0.5, color: colors.textSecondary },
  ghostBody: { fontFamily: fonts.barlowRegular, fontSize: 12.5, lineHeight: 17, color: colors.textSub, marginTop: 3 },
});
