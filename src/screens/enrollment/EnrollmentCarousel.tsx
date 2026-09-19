/**
 * EnrollmentCarousel — the top of Manage My Learning › Enrollments.
 *
 * ── WHAT CHANGED AND WHY (owner 2026-09-19, dictated after a device pass) ────
 *
 * MY ENROLLMENT used to be one tall vertical stack: a container per credential
 * (purple PROGRAM, blue CERTIFICATE), each expanding to reveal its topics
 * inline. Comparing two credentials meant scrolling past everything between
 * them, and the screen opened fully expanded, so the first thing a member saw
 * was a wall.
 *
 * Now the credentials are a horizontal deck and only ONE is under the eye at a
 * time. What sits below the deck belongs to whatever is centred:
 *
 *   column 1  ALL TOPICS  — the flat enrolled-topic list (always present; a
 *                           new account already has the two free topics)
 *   column 2+ one card per credential, IN THE ORDER THE USER ADDED IT
 *
 * ⛔ Nothing is pre-populated. A credential appears here only when the user
 * adds it, so the deck is a record of their own choices rather than a catalog.
 *
 * ── PRESENTATION ONLY ───────────────────────────────────────────────────────
 *
 * This component owns NO enrollment state and NO rules. Loading, removing,
 * navigation and progress all arrive as props from EnrollmentScreen, which
 * remains the single place those happen. Two surfaces mutating one enrollment
 * through two code paths is how the Dashboard and this screen drift apart.
 *
 * The snap/centring mechanic is deliberately the SAME one as the main menu's
 * course deck (CourseSelectionScreen: fixed CARD_W, side padding of
 * (window − CARD_W) / 2, snapToInterval): the owner asked for it to feel like
 * that deck, and a second hand-rolled carousel would drift from it.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { Dimensions, Image, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import type { NativeScrollEvent, NativeSyntheticEvent } from 'react-native';
import { CredentialThumb } from '../awards/CredentialThumb';
import { LedMeter, segmentsForPct } from '../../components/LedMeter';
import { colors, fonts } from '../../theme/tokens';

/** The Study tab's own icon, so the control looks like where it sends you. */
const STUDY_ICON = require('../../../assets/icons/nav/nav-study.png');

export const CERT_BLUE = '#2f9bff';
export const PROGRAM_PURPLE = '#b06cff';

/**
 * One deck position. `kind: 'topics'` is ALL TOPICS and is always the
 * left-most card; `placeholder` is the empty-state ghost described below.
 */
export type CarouselCard = {
  key: string;
  kind: 'topics' | 'cert' | 'program' | 'subject' | 'placeholder';
  title: string;
  /** Credential slug for the artwork; null for column 1 and for subjects. */
  slug: string | null;
  /** 0–100 across the card's topics. */
  pct: number;
  topicCount: number;
  /** Every one of its topics is in the study deck. */
  allLoaded: boolean;
};

/**
 * ⛔ THE SAME GEOMETRY AS THE MAIN MENU'S COURSE DECK (owner 2026-09-19:
 * "make the containers the same width as the menu cards ... match
 * aesthetic"). Copied from CourseSelectionScreen deliberately, values and
 * all — a card that is merely similar reads as a mistake next to the real
 * thing. Wider card + smaller gap is also what lets the neighbouring cards
 * show at the edges, which is the point of a deck.
 */
const BASE_W = Math.min(Dimensions.get('window').width, Dimensions.get('window').height);
const CARD_MAX_W = 280;
const MENU_CARD_W = Math.min(Math.round(BASE_W * 0.7 * 0.93), CARD_MAX_W);
const MENU_CARD_GAP = 14;
/**
 * Fixed so every card is the same height while swiping. Sized to the tallest
 * real content — a 58px thumb beside a two-line title, then the meter row,
 * then the action row — with nothing left over. It was 188 on the first device
 * pass and the ALL TOPICS card (no artwork, one-line title) showed an obvious
 * dead band between the title and the meter.
 */
const CARD_H = 156;

function accentFor(kind: CarouselCard['kind']): string {
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

export function EnrollmentCarousel({
  cards,
  activeIndex,
  onIndexChange,
  onToggleLoad,
  onStudy,
}: {
  cards: CarouselCard[];
  activeIndex: number;
  onIndexChange: (i: number) => void;
  /** Load / unload EVERY topic of that card in one action. */
  onToggleLoad: (card: CarouselCard) => void;
  /** Open the Dashboard on that card's work. */
  onStudy: (card: CarouselCard) => void;
}) {
  /**
   * The deck must centre against ITS OWN width, not the window's. It is nested
   * inside the MY ENROLLMENT panel, which has its own horizontal padding, so
   * centring on the window put the card left of centre with a band of dead
   * space on the right — visible on the first device pass, 2026-09-19.
   *
   * The window is still the fallback for the very first frame, before layout
   * has measured anything.
   */
  const { width: windowW } = useWindowDimensions();
  const [trackW, setTrackW] = useState(0);
  const availW = trackW || windowW;
  // Never wider than the space we actually have, but otherwise exactly the
  // menu card.
  const cardW = Math.min(MENU_CARD_W, Math.round(availW * 0.92));
  const gap = MENU_CARD_GAP;
  const interval = cardW + gap;
  const sidePad = Math.max(0, Math.round((availW - cardW) / 2));
  const listRef = useRef<ScrollView>(null);

  /** The index the USER last landed on by scrolling. */
  const scrolledTo = useRef(activeIndex);

  const onMomentumEnd = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const i = Math.round(e.nativeEvent.contentOffset.x / interval);
      const clamped = Math.max(0, Math.min(cards.length - 1, i));
      scrolledTo.current = clamped;
      if (clamped !== activeIndex) onIndexChange(clamped);
    },
    [interval, cards.length, activeIndex, onIndexChange],
  );

  /**
   * Follow an index the PARENT changed. Removing the credential you were
   * looking at resets the parent to column 0, but the list itself stays
   * scrolled where it was — so the card under the centre line would be one
   * thing while the panel below described another. Only scrolls when the
   * change did not come from the user, so it never fights a swipe.
   */
  useEffect(() => {
    if (scrolledTo.current === activeIndex) return;
    scrolledTo.current = activeIndex;
    listRef.current?.scrollTo({ x: activeIndex * interval, animated: true });
  }, [activeIndex, interval]);

  const renderCard = (item: CarouselCard, index: number) => {
    const accent = accentFor(item.kind);
    const centred = index === activeIndex;
    const isTopics = item.kind === 'topics';

    /**
     * A member with no credentials yet would otherwise see a deck of one and
     * have no idea it IS a deck. This ghost sits where their first
     * certificate will, says so, and is deliberately inert — a dashed outline
     * and muted type, so it reads as a space to fill rather than a thing that
     * failed to load (owner 2026-09-19: "if none yet use a blank to
     * demonstrate the purpose already").
     */
    if (item.kind === 'placeholder') {
      return (
        <View
          key={item.key}
          style={[s.card, s.ghost, { width: cardW, height: CARD_H }]}
          accessible
          accessibilityLabel="No certificates or programs yet. Ones you enrol in appear here, beside your topics."
        >
          <View style={[s.thumb, s.thumbPlain, s.ghostThumb]}>
            <Text style={s.ghostGlyph}>+</Text>
          </View>
          <Text style={s.ghostTitle}>Your certificates and programs</Text>
          <Text style={s.ghostBody}>Enrol in one and it appears here, beside your topics.</Text>
        </View>
      );
    }
    return (
      <Pressable
        key={item.key}
        style={[
          s.card,
          { width: cardW, height: CARD_H, borderColor: centred ? accent : colors.hairline },
          centred && s.cardCentred,
        ]}
        onPress={() => {
          if (!centred) {
            onIndexChange(index);
            listRef.current?.scrollTo({ x: index * interval, animated: true });
          }
        }}
        accessibilityRole="button"
        accessibilityState={{ selected: centred }}
        accessibilityLabel={
          `${labelFor(item.kind)}: ${item.title}. ${item.pct}% complete, ${item.topicCount} topics. ` +
          (centred ? 'Showing below.' : 'Tap to show below.')
        }
      >
        <View style={s.cardHead}>
          {/* Column 1 has no artwork — it is the whole list, not one award. */}
          {item.slug ? (
            /* The SAME framed viewer box the Dashboard gives a topic (owner
               2026-09-19) — tap it and the credential's artwork opens
               full-screen. CredentialThumb already owns that viewer, so this
               is the existing component rather than a second one that would
               drift from it. Same slug ⇒ same file as the Certificates and
               Programs screens. */
            <CredentialThumb
              slug={item.slug}
              title={item.title}
              accent={accent}
              size={58}
              kind={item.kind === 'program' ? 'program' : 'certificate'}
            />
          ) : (
            <View style={[s.thumb, s.thumbPlain, { borderColor: `${accent}66` }]}>
              <Text style={[s.thumbGlyph, { color: accent }]}>☰</Text>
            </View>
          )}
          <View style={s.headText}>
            <Text style={[s.kind, { color: accent, borderColor: accent }]}>{labelFor(item.kind)}</Text>
            <Text style={s.title} numberOfLines={2}>
              {item.title}
            </Text>
          </View>
        </View>

        <View style={s.meterRow}>
          <LedMeter filled={segmentsForPct(item.pct)} segWidth={4} />
          <Text style={s.pct}>{item.pct}%</Text>
        </View>

        <View style={s.actionRow}>
          {/* LOADED / UNLOADED covers ALL of this card's topics at once. */}
          <Pressable
            style={[s.loadPill, s.loadPillWide, item.allLoaded && { borderColor: colors.green, backgroundColor: 'rgba(55,224,95,.14)' }]}
            onPress={() => onToggleLoad(item)}
            hitSlop={6}
            accessibilityRole="button"
            accessibilityState={{ selected: item.allLoaded }}
            aria-pressed={item.allLoaded}
            accessibilityLabel={
              item.allLoaded
                ? `Unload all ${item.topicCount} topics of ${item.title} from the study deck`
                : `Load all ${item.topicCount} topics of ${item.title} into the study deck`
            }
          >
            {/* Owner 2026-09-19: name the ACTION, not the state — one tap
                moves every topic of this credential in or out of the deck. */}
            <Text style={[s.loadText, item.allLoaded && { color: colors.green }]}>
              {item.allLoaded ? 'UNLOAD ALL TOPICS' : 'LOAD ALL TOPICS'}
            </Text>
          </Pressable>
          {isTopics ? (
            <Text style={s.count}>
              {item.topicCount} topic{item.topicCount === 1 ? '' : 's'}
            </Text>
          ) : null}
          <View style={{ flex: 1 }} />
          <Pressable
            style={s.studyBtn}
            onPress={() => onStudy(item)}
            hitSlop={6}
            accessibilityRole="button"
            accessibilityLabel={
              isTopics
                ? 'Study — open your dashboard'
                : `Study all of ${item.title} — loads its ${item.topicCount} topics and opens your dashboard`
            }
          >
            <Image source={STUDY_ICON} style={s.studyIcon} resizeMode="contain" />
            {/* STUDY ALL, because it loads the whole credential into the
                dashboard and goes there — not one topic (owner 2026-09-19). */}
            <Text style={s.studyText}>{isTopics ? 'STUDY' : 'STUDY ALL'}</Text>
          </Pressable>
        </View>
      </Pressable>
    );
  };

  return (
    // onLayout gives the deck its real available width (see `trackW` above).
    <View onLayout={(e) => setTrackW(Math.round(e.nativeEvent.layout.width))}>
      {/*
        ⛔ A PLAIN HORIZONTAL ScrollView, DELIBERATELY — DO NOT "UPGRADE" IT
        BACK TO A FlatList.

        On the device pass of 2026-09-19 a FlatList here rendered VERTICALLY
        despite `horizontal`: both cards at the same x, stacked, and a
        horizontal swipe moved nothing. Measured from uiautomator bounds, not
        judged by eye —
            [75,1207][799,1617]  ALL TOPICS
            [75,1617][799,2026]  CERTIFICATE
        — and the only scrollable node on screen was the screen's own vertical
        ScrollView. Making the row explicit (horizontal={true}, flexDirection
        row, gap, alignItems center, flexGrow 0) did NOT fix it.

        Rather than keep guessing at a virtualized list nested in a vertical
        ScrollView, this uses the primitive that plainly does the job. The deck
        holds one card per credential the user enrolled in — a handful, tens at
        most — so virtualization buys nothing here. (The main menu's deck keeps
        its FlatList: that one is 20+ cards and it works.)
      */}
      <ScrollView
        ref={listRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        snapToInterval={interval}
        decelerationRate="fast"
        disableIntervalMomentum
        style={{ flexGrow: 0 }}
        contentContainerStyle={{ alignItems: 'center', gap, paddingHorizontal: sidePad }}
        onMomentumScrollEnd={onMomentumEnd}
      >
        {cards.map((c, i) => renderCard(c, i))}
      </ScrollView>
      {/* Position dots. One card means there is nothing to page through. */}
      {cards.length > 1 ? (
        <View style={s.dots} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
          {cards.map((c, i) => (
            // `c.kind`, NOT cards[activeIndex].kind: removing the credential you
            // were looking at shortens this list, and the parent's index reset
            // only runs AFTER this render — so indexing by activeIndex would
            // dereference undefined and take the screen down on the way out.
            <View key={c.key} style={[s.dot, i === activeIndex && { backgroundColor: accentFor(c.kind) }]} />
          ))}
        </View>
      ) : null}
    </View>
  );
}

const s = StyleSheet.create({
  card: {
    backgroundColor: '#121215',
    borderWidth: 1.5,
    borderRadius: 14,
    padding: 12,
    justifyContent: 'space-between',
  },
  cardCentred: { backgroundColor: '#17171b' },
  ghost: {
    borderStyle: 'dashed',
    borderColor: '#2e2e35',
    backgroundColor: '#0e0e11',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  ghostThumb: { borderColor: '#2e2e35', width: 44, height: 44 },
  ghostGlyph: { fontFamily: fonts.oswaldMedium, fontSize: 22, color: '#4a4a55' },
  ghostTitle: { fontFamily: fonts.oswaldSemiBold, fontSize: 13, letterSpacing: 0.6, color: colors.textSecondary, textAlign: 'center' },
  ghostBody: { fontFamily: fonts.barlowRegular, fontSize: 11.5, lineHeight: 16, color: colors.textSub, textAlign: 'center', paddingHorizontal: 14 },
  cardHead: { flexDirection: 'row', gap: 10 },
  thumb: { width: 58, height: 58, borderRadius: 8, borderWidth: 1, overflow: 'hidden', backgroundColor: '#0c0c0e' },
  thumbArt: { width: '100%', height: '100%' },
  thumbPlain: { alignItems: 'center', justifyContent: 'center' },
  thumbGlyph: { fontSize: 24, fontFamily: fonts.oswaldMedium },
  headText: { flex: 1, gap: 5 },
  kind: {
    alignSelf: 'flex-start',
    fontFamily: fonts.oswaldSemiBold,
    fontSize: 9.5,
    letterSpacing: 1.1,
    borderWidth: 1,
    borderRadius: 4,
    paddingHorizontal: 5,
    paddingVertical: 1.5,
  },
  title: { fontFamily: fonts.oswaldSemiBold, fontSize: 15, lineHeight: 18, color: colors.textPrimary },
  meterRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  pct: { fontFamily: fonts.mono, fontSize: 12, color: colors.textSecondary },
  actionRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  loadPillWide: { flexShrink: 1 },
  loadPill: {
    borderWidth: 1,
    borderColor: colors.hairline,
    borderRadius: 5,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  loadText: { fontFamily: fonts.oswaldSemiBold, fontSize: 9.5, letterSpacing: 1, color: colors.textSub },
  count: { fontFamily: fonts.barlowRegular, fontSize: 11.5, color: colors.textSub },
  studyBtn: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  studyIcon: { width: 20, height: 20 },
  studyText: { fontFamily: fonts.oswaldSemiBold, fontSize: 11, letterSpacing: 1, color: colors.blue },
  dots: { flexDirection: 'row', gap: 5, justifyContent: 'center', marginTop: 9 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#33333a' },
});
