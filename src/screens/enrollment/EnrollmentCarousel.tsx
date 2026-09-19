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
import { useCallback, useEffect, useRef } from 'react';
import { FlatList, Image, Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import type { NativeScrollEvent, NativeSyntheticEvent } from 'react-native';
import { CardArt } from '../../components/CardArt';
import { credentialArtUrl } from '../awards/CredentialThumb';
import { LedMeter, segmentsForPct } from '../../components/LedMeter';
import { colors, fonts } from '../../theme/tokens';

/** The Study tab's own icon, so the control looks like where it sends you. */
const STUDY_ICON = require('../../../assets/icons/nav/nav-study.png');

export const CERT_BLUE = '#2f9bff';
export const PROGRAM_PURPLE = '#b06cff';

/** One deck position. `kind: 'topics'` is column 1 and is always index 0. */
export type CarouselCard = {
  key: string;
  kind: 'topics' | 'cert' | 'program' | 'subject';
  title: string;
  /** Credential slug for the artwork; null for column 1 and for subjects. */
  slug: string | null;
  /** 0–100 across the card's topics. */
  pct: number;
  topicCount: number;
  /** Every one of its topics is in the study deck. */
  allLoaded: boolean;
};

const CARD_MAX_W = 300;
const CARD_H = 188;

function accentFor(kind: CarouselCard['kind']): string {
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
  const { width: windowW } = useWindowDimensions();
  const cardW = Math.min(Math.round(windowW * 0.78), CARD_MAX_W);
  const gap = 12;
  const interval = cardW + gap;
  // Centres the first and last card. Read from the live window so rotation and
  // a split-view drag re-centre instead of leaving the deck offset.
  const sidePad = Math.max(0, Math.round((windowW - cardW) / 2));
  const listRef = useRef<FlatList<CarouselCard>>(null);

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
    listRef.current?.scrollToOffset({ offset: activeIndex * interval, animated: true });
  }, [activeIndex, interval]);

  const renderItem = ({ item, index }: { item: CarouselCard; index: number }) => {
    const accent = accentFor(item.kind);
    const centred = index === activeIndex;
    const isTopics = item.kind === 'topics';
    return (
      <Pressable
        style={[
          s.card,
          { width: cardW, height: CARD_H, marginRight: gap, borderColor: centred ? accent : colors.hairline },
          centred && s.cardCentred,
        ]}
        onPress={() => {
          if (!centred) {
            onIndexChange(index);
            listRef.current?.scrollToOffset({ offset: index * interval, animated: true });
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
            <View style={[s.thumb, { borderColor: `${accent}66` }]}>
              {/* Same slug → same file as the Certificates / Programs screens
                  (credentialArtUrl). Not every slug has art uploaded yet, so the
                  frame simply stays dark until it does. */}
              <CardArt uri={credentialArtUrl(item.slug)} style={s.thumbArt} />
            </View>
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
            style={[s.loadPill, item.allLoaded && { borderColor: colors.green, backgroundColor: 'rgba(55,224,95,.14)' }]}
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
            <Text style={[s.loadText, item.allLoaded && { color: colors.green }]}>
              {item.allLoaded ? 'LOADED' : 'UNLOADED'}
            </Text>
          </Pressable>
          <Text style={s.count}>
            {item.topicCount} topic{item.topicCount === 1 ? '' : 's'}
          </Text>
          <View style={{ flex: 1 }} />
          <Pressable
            style={s.studyBtn}
            onPress={() => onStudy(item)}
            hitSlop={6}
            accessibilityRole="button"
            accessibilityLabel={isTopics ? 'Study — open your dashboard' : `Study ${item.title}`}
          >
            <Image source={STUDY_ICON} style={s.studyIcon} resizeMode="contain" />
            <Text style={s.studyText}>STUDY</Text>
          </Pressable>
        </View>
      </Pressable>
    );
  };

  return (
    <View>
      <FlatList
        ref={listRef}
        data={cards}
        horizontal
        keyExtractor={(c) => c.key}
        renderItem={renderItem}
        showsHorizontalScrollIndicator={false}
        snapToInterval={interval}
        decelerationRate="fast"
        disableIntervalMomentum
        contentContainerStyle={{ paddingLeft: sidePad, paddingRight: Math.max(sidePad - gap, 0) }}
        onMomentumScrollEnd={onMomentumEnd}
        // Every card is a fixed width, so the list can place them without
        // measuring — which is what keeps the snap honest on a cold render.
        getItemLayout={(_, index) => ({ length: interval, offset: interval * index, index })}
      />
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
