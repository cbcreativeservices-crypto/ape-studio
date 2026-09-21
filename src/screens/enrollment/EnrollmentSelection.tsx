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
import { actionsFitBesideIdentity, artSideLen } from './selectionLayout';
import { HoldToActivate } from '../../components/HoldToActivate';
import { AttractRing } from '../../features/onboarding/AttractCue';

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

/**
 * The eyebrow over the selection's name.
 *
 * ⚠️ The topics one is a SENTENCE, not a label (owner 2026-09-19). "ALL
 * TOPICS" named the card but never said what the card was for; this says
 * what the list underneath actually is. It is the only eyebrow that runs
 * long, which is why `kind` below drops the label letter-spacing when the
 * text is a sentence — tracked-out capitals are for two words, not ten.
 */
function labelFor(kind: CarouselCard['kind']): string {
  return kind === 'topics'
    ? 'TOPICS AVAILABLE FOR LOADING IN YOUR STUDY DASHBOARD'
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
  /** Corner placement only while the column is wide enough to hold both. */
  const actionsBeside = actionsFitBesideIdentity(rowW);

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
        ── ART LEFT, EVERYTHING ELSE IN ONE COLUMN TO ITS RIGHT ──────────────
        Owner 2026-09-19, choosing between two ways of closing the empty
        space they had circled: "I would rather have the LED meter and the
        final exam button narrower and to the right with the image on the
        left, than have the image smaller and the button and LED so wide
        across." So every control is back in the right-hand column, and the
        art is the big thing on the left.

        ⛔ THE ART IS A SQUARE, AND THAT IS NOT NEGOTIABLE — THE SOURCE ART
        IS SQUARE. It ran the full height of the row for one commit and
        `cover` cropped a square photo to its middle vertical third at ~2×,
        so every credential became an unreadable zoomed strip. A gap is a
        blemish; ruined artwork is a broken feature.

        ⛔ AND THAT IS WHY THESE TWO ROWS ARE FULL WIDTH. Square art and no
        gap cannot both be true while four controls share the column beside
        it — the column is simply always taller. Given the choice, the owner
        took the full-width rows (2026-09-19) rather than let the art crop.
        So only the identity and the two topic actions stay beside the art;
        FINAL EXAM / REMOVE and the meter sit beneath the whole head, where
        they are better anyway: the meter reads across the card, and the
        award button stops being a long label in a narrow box.

        ⛔ THE SIDE IS STILL DERIVED FROM A WIDTH. Never from a height — see
        selectionLayout.ts for the infinite loop that shipped and flickered
        on a real phone.
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
          /* ⛔ NARROWER BOX THAN THE CREDENTIAL ART (owner 2026-09-20).
             The credentials show a photograph that earns a full square; this
             is a line icon at 0.58 of one, so a full-square box left it
             floating in emptiness and pushed the title to the same far-right
             start as the credential cards. Holding the box to 0.66 of the
             side pulls the title back past the centre of the screen and
             makes MY ENROLLED TOPICS read as a different KIND of card at a
             glance — which is the whole point. The HEIGHT stays square so
             nothing below it shifts. */
          <View style={[s.markBox, { width: Math.round(sideLen * 0.66), height: sideLen }]}>
            {/* 0.92 → 0.58 of the square: the book-and-heart mark reads as an
                ICON here, not as artwork, and at 0.92 it filled its box far
                more heavily than the credential photographs beside it
                (owner 2026-09-20, "37% smaller"). */}
            <MyTopicsIcon size={Math.round(sideLen * 0.58)} />
          </View>
        )}

        <View style={s.body}>
          {/* TOP — identity on the left, STUDY ALL in the corner, LOAD ALL
              directly beneath it. The two actions that move topics live
              together, away from the two that concern the credential. */}
          <View style={[s.topRow, !actionsBeside && s.topRowStacked]}>
            <View style={s.identity}>
              <Text style={[s.kind, isTopics && s.kindLong, { color: accent }]}>{labelFor(card.kind)}</Text>
              <Text style={s.title} numberOfLines={2}>
                {card.title}
              </Text>
              <Text style={s.count}>
                {card.topicCount} topic{card.topicCount === 1 ? '' : 's'}
                {summary ? ` · ${summary}` : ''}
              </Text>
            </View>

            <View style={[s.deckActions, !actionsBeside && s.deckActionsStacked]}>
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

              {/* ⛔ THE VERB AND THE STATE ARE TWO DIFFERENT FACTS
                  (owner 2026-09-20). One button carrying both had to say
                  "UNLOAD ALL TOPICS" to mean "these ARE loaded", so the
                  reader had to invert the label to learn where they stood —
                  and the one word they had to read to do it was the word for
                  the opposite thing.

                  Split: the LEFT is the action and always names what the tap
                  will do; the RIGHT is a lamp that never moves and only
                  reports. Amber lit = loaded, gray = not, the same language
                  as the LOADED pill on every row below. */}
              <View style={s.loadRow}>
                <Pressable
                  style={[s.loadActionBtn, !card.allLoaded && s.loadActionBtnInvite]}
                  onPress={() => onToggleLoad(card)}
                  hitSlop={6}
                  accessibilityRole="button"
                  accessibilityLabel={
                    card.allLoaded
                      ? `Unload all ${card.topicCount} topics of ${card.title} from the study deck`
                      : `Load all ${card.topicCount} topics of ${card.title} into the study deck`
                  }
                >
                  {/* "ALL" stays in the label (owner 2026-09-20): the bare
                      verb beside a per-topic list read as though it acted on
                      one row. It acts on every topic in the card.

                      ⛔ THE FRAME LIGHTS ONLY ON THE INVITATION (owner
                      2026-09-21). LOAD ALL is the thing to do next, so it
                      gets the full amber treatment, frame and all. UNLOAD ALL
                      is the undo of something already done — the text stays
                      amber so it is plainly the same control, but the frame
                      goes quiet so a loaded card is not two lit boxes
                      competing for the eye. */}
                  <Text style={s.loadText} numberOfLines={1}>
                    {card.allLoaded ? 'UNLOAD ALL' : 'LOAD ALL'}
                  </Text>
                </Pressable>
                {/* ⛔ NO FRAME ON THIS ONE, EITHER STATE (owner 2026-09-21).
                    It is the only thing in the head that is not a control, and
                    a frame is what everything else here wears to say "press
                    me". Losing it is how the lamp stops looking like a button
                    and starts looking like a readout. The row pills below keep
                    theirs — they ARE tappable. */}
                <View
                  style={[s.loadLamp, card.allLoaded && s.loadLampOn]}
                  accessible
                  accessibilityLabel={
                    card.allLoaded
                      ? 'All topics are loaded in your study dashboard'
                      : 'These topics are not loaded in your study dashboard'
                  }
                >
                  <Text style={[s.loadLampText, card.allLoaded && s.loadLampTextOn]}>LOADED</Text>
                </View>
              </View>
            </View>
          </View>
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
              {/* ⛔ ALWAYS GLOWING (owner 2026-09-20) — `persistent`, not a
                  first-run cue. This is the thing the whole card is FOR: the
                  certificate at the end of it. Every other control here moves
                  topics around; this one is the destination, and it should
                  never stop looking like it. Holds a static level under
                  reduce-motion and in Low-Light. */}
              <AttractRing active persistent />
              <Text style={s.awardText}>FINAL EXAM - EARN CERTIFICATE AWARD</Text>
            </Pressable>
          ) : (
            <View style={{ flex: 1 }} />
          )}
          {onRemove ? (
            /* ⛔ HOLD THREE SECONDS (owner 2026-09-20). This throws away a
               whole credential and every topic under it, and it sat one
               stray tap away from the button people press to open their
               final exam. A hold cannot be done by accident, and the fill
               shows what is being committed to while there is still time to
               let go. Same idiom as the audio-output gate, three seconds
               rather than five. */
            <HoldToActivate
              label="HOLD TO REMOVE"
              holdingLabel="KEEP HOLDING"
              holdMs={3000}
              compact
              tint={colors.textSub}
              bg="#151517"
              onComplete={onRemove}
            />
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
  );
}

const s = StyleSheet.create({
  // No frame and no background: this IS the green panel's heading.
  wrap: { paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: colors.hairline, gap: 10 },
  head: { flexDirection: 'row', alignItems: 'flex-start', gap: 14 },
  markBox: { alignItems: 'center', justifyContent: 'center' },
  /* Only the identity row lives here now — see the note above the head. */
  body: { flex: 1, paddingTop: 2 },
  topRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  /* Narrow column: the same controls in the same order, stacked. See
     actionsFitBesideIdentity — side by side, the title breaks mid-word. */
  topRowStacked: { flexDirection: 'column', gap: 10 },
  identity: { flex: 1, gap: 4 },
  kind: { fontFamily: fonts.oswaldSemiBold, fontSize: 11, letterSpacing: 1.3 },
  /* The topics eyebrow is a full sentence: 1.3 of tracking across fifty
     characters is unreadable and wraps badly, so it keeps the size and
     loses the spacing. */
  kindLong: { letterSpacing: 0.4, lineHeight: 14 },
  title: { fontFamily: fonts.oswaldSemiBold, fontSize: 21, lineHeight: 25, color: colors.textPrimary },
  count: { fontFamily: fonts.mono, fontSize: 12.5, color: colors.textSub },
  /* The two controls that move topics, stacked in the corner. */
  deckActions: { alignItems: 'flex-end', gap: 8 },
  deckActionsStacked: { alignSelf: 'stretch', alignItems: 'stretch' },
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
  /* Action + state lamp, splitting the width the single button used to take.
     ⛔ CONTENT-WIDTH, NOT flex:1 HALVES. `deckActions` is an auto-width
     flex-end column, so flex:1 children resolve against a basis of 0 and the
     pair collapsed to roughly the STUDY button's width above — which clipped
     "UNLOAD ALL" to "UNLOAD…". Each sizes to its own label instead; the
     narrow-screen case is already handled by actionsFitBesideIdentity, which
     stacks the whole column. */
  loadRow: { flexDirection: 'row', alignItems: 'stretch', gap: 6 },
  loadActionBtn: {
    borderWidth: 1,
    borderColor: colors.hairline,
    borderRadius: 8,
    paddingHorizontal: 11,
    minHeight: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  /* LOAD ALL — the invitation, so the frame lights with the text. */
  loadActionBtnInvite: { borderColor: 'rgba(255,198,77,.55)', backgroundColor: 'rgba(255,198,77,.08)' },
  loadText: { fontFamily: fonts.oswaldSemiBold, fontSize: 11.5, letterSpacing: 0.8, color: colors.amber },
  /* Reports only — never a tap target, so it is a View, not a Pressable, and
     it carries NO frame in either state. */
  loadLamp: {
    borderWidth: 0,
    backgroundColor: '#1c1c1c',
    borderRadius: 8,
    paddingHorizontal: 10,
    minHeight: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadLampOn: { backgroundColor: 'rgba(255,198,77,.14)' },
  loadLampText: { fontFamily: fonts.oswaldSemiBold, fontSize: 11.5, letterSpacing: 1, color: colors.textSub },
  loadLampTextOn: { color: colors.amber },
  /* The two that are about the credential itself. */
  credActions: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  awardBtn: { flex: 1, borderWidth: 1, borderColor: 'rgba(255,198,77,.45)', borderRadius: 8, paddingVertical: 11, alignItems: 'center' },
  awardText: { fontFamily: fonts.oswaldSemiBold, fontSize: 10.5, letterSpacing: 0.8, color: colors.amber },
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
