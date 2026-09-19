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
import { Image, Pressable, StyleSheet, Text, View, type LayoutChangeEvent } from 'react-native';
import { useState } from 'react';
import { CredentialThumb } from '../awards/CredentialThumb';
import { MyTopicsIcon } from '../../components/MyTopicsIcon';
import { LedMeter, segmentsForPct } from '../../components/LedMeter';
import { colors, fonts } from '../../theme/tokens';
import { artSideLen } from './selectionLayout';

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
  summary,
  onToggleLoad,
  onStudy,
  onOpenAward,
  onRemove,
}: {
  card: CarouselCard | null;
  /** "3 of 7 complete" — omitted for ALL TOPICS, which has no requirement set. */
  summary?: string | null;
  /** Load / unload EVERY topic of this selection in one action. */
  onToggleLoad: (card: CarouselCard) => void;
  /** Open the Dashboard on this selection's work. */
  onStudy: (card: CarouselCard) => void;
  /** Credential-only; omit for ALL TOPICS and the placeholder. */
  onOpenAward?: () => void;
  /** Credential-only, and omitted for a DERIVED one — nothing to remove. */
  onRemove?: () => void;
}) {
  /**
   * The art is a SQUARE (owner 2026-09-19: "make the left prog/cert image
   * area a square to match the image square always"), sized from the ROW'S
   * WIDTH.
   *
   * ⛔ NEVER SIZE IT FROM A HEIGHT. THIS SHIPPED AS AN INFINITE LOOP.
   *
   * It measured the text column's height and used that as the square's side,
   * on the reasoning that the row's height is max(text, art) and so feeding
   * the row back in could only grow — but the text column's height was safe.
   * That was wrong, and the comment saying so was the bug's own alibi. The
   * square's SIDE is also its WIDTH, and the text column is `flex: 1` beside
   * it in the same row: a wider square leaves a narrower column, a narrower
   * column wraps more and gets TALLER, and that taller height became the next
   * side. Every pass grew. On a phone it never converged — the owner saw the
   * head balloon to most of the screen with the buttons pushed off the right
   * edge, re-rendering continuously, which reads as a violent flicker.
   *
   * Width is the only input that is safe, because nothing the art does can
   * change it: the row's width is set by the panel above. One measurement,
   * one pass, no feedback path at all.
   */
  const [rowW, setRowW] = useState(0);
  const onHeadLayout = (e: LayoutChangeEvent) => {
    const w = Math.round(e.nativeEvent.layout.width);
    if (w > 0 && w !== rowW) setRowW(w);
  };
  // Derived in render, not stored — state that mirrors a prop is state that
  // can be one render stale, which is its own class of bug on this screen.
  const sideLen = artSideLen(rowW);

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
      {/*
        ⛔ THE ART RUNS THE FULL HEIGHT OF THE PANEL (owner 2026-09-19) and
        everything else is one column to its right, left-justified to the
        art's edge. `alignSelf: 'stretch'` inside the row does that without
        measuring anything: the text column sets the height, the art takes it.
      */}
      <View style={s.head} onLayout={onHeadLayout}>
        {card.slug ? (
          <CredentialThumb
            slug={card.slug}
            title={card.title}
            accent={accent}
            size={sideLen}
            kind={card.kind === 'program' ? 'program' : 'certificate'}
          />
        ) : (
          <View style={[s.markBox, { width: sideLen, height: sideLen }]}>
            <MyTopicsIcon size={Math.round(sideLen * 0.92)} />
          </View>
        )}

        <View style={s.body}>
          {/* TOP — identity on the left, STUDY ALL in the corner, LOAD ALL
              directly beneath it. The two actions that move topics live
              together, away from the two that concern the credential. */}
          <View style={s.topRow}>
            <View style={s.identity}>
              <Text style={[s.kind, { color: accent }]}>{labelFor(card.kind)}</Text>
              <Text style={s.title} numberOfLines={2}>
                {card.title}
              </Text>
              <Text style={s.count}>
                {card.topicCount} topic{card.topicCount === 1 ? '' : 's'}
                {summary ? ` · ${summary}` : ''}
              </Text>
            </View>

            <View style={s.deckActions}>
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
                <Text style={[s.loadText, card.allLoaded && { color: colors.green }]}>
                  {card.allLoaded ? 'UNLOAD ALL TOPICS' : 'LOAD ALL TOPICS'}
                </Text>
              </Pressable>
            </View>
          </View>

          {/* MIDDLE — the two that are about the CREDENTIAL rather than about
              moving topics around. Absent on ALL TOPICS, which is neither an
              award nor an enrollment you can drop. */}
          {onOpenAward || onRemove ? (
            <View style={s.credActions}>
              {onOpenAward ? (
                <Pressable
                  style={s.awardBtn}
                  onPress={onOpenAward}
                  accessibilityRole="button"
                  accessibilityLabel={`Open the ${card.title} award page to see its Final Exam`}
                >
                  <Text style={s.awardText}>FINAL EXAM · ON THE AWARD PAGE →</Text>
                </Pressable>
              ) : (
                <View style={{ flex: 1 }} />
              )}
              {onRemove ? (
                <Pressable
                  style={s.removeBtn}
                  onPress={onRemove}
                  accessibilityRole="button"
                  accessibilityLabel={`Remove ${card.title} and its topics from the list`}
                >
                  <Text style={s.removeText}>REMOVE</Text>
                </Pressable>
              ) : null}
            </View>
          ) : null}

          {/* BOTTOM — one meter for this selection. The requirements panel
              that used to sit below carried a second copy of exactly this
              (owner: "the LED is a repeat of the LED above it"), so that
              panel is gone and its two buttons moved up here. */}
          <View style={s.meterRow}>
            <View style={{ flex: 1 }}>
              <LedMeter filled={segmentsForPct(card.pct)} fullWidth />
            </View>
            <Text style={s.pct}>{card.pct}%</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  // No frame and no background: this IS the green panel's heading.
  wrap: { paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: colors.hairline },
  head: { flexDirection: 'row', alignItems: 'flex-start', gap: 14 },
  markBox: { alignItems: 'center', justifyContent: 'center' },
  body: { flex: 1, gap: 10, paddingTop: 2 },
  topRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  identity: { flex: 1, gap: 4 },
  kind: { fontFamily: fonts.oswaldSemiBold, fontSize: 11, letterSpacing: 1.3 },
  title: { fontFamily: fonts.oswaldSemiBold, fontSize: 21, lineHeight: 25, color: colors.textPrimary },
  count: { fontFamily: fonts.mono, fontSize: 12.5, color: colors.textSub },
  /* The two controls that move topics, stacked in the corner. */
  deckActions: { alignItems: 'flex-end', gap: 8 },
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
  loadBtn: {
    borderWidth: 1,
    borderColor: colors.hairline,
    borderRadius: 8,
    paddingHorizontal: 12,
    minHeight: 40,
    justifyContent: 'center',
  },
  loadText: { fontFamily: fonts.oswaldSemiBold, fontSize: 11.5, letterSpacing: 1, color: colors.textSub },
  /* The two that are about the credential itself. */
  credActions: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  awardBtn: { flex: 1, borderWidth: 1, borderColor: 'rgba(255,198,77,.45)', borderRadius: 8, paddingVertical: 11, alignItems: 'center' },
  awardText: { fontFamily: fonts.oswaldSemiBold, fontSize: 10.5, letterSpacing: 0.8, color: colors.amber },
  removeBtn: { minHeight: 44, justifyContent: 'center', paddingHorizontal: 10 },
  removeText: { fontFamily: fonts.oswaldSemiBold, fontSize: 10.5, letterSpacing: 1.2, color: colors.textSub },
  meterRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  pct: { fontFamily: fonts.mono, fontSize: 13, color: colors.textSecondary },

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
