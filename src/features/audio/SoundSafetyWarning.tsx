/**
 * SoundSafetyWarning — the gate a user must pass before this app is allowed to
 * make any sound at all.
 *
 * Owner 2026-09-17. It sits IN FRONT of the existing per-session audio-output
 * gate (AudioOutputGate's explain → 5-second hold), not instead of it:
 *
 *     first launch   →  THIS  →  explain  →  hold 5s  →  sound
 *     every launch after       →  explain  →  hold 5s  →  sound
 *
 * WHEN IT IS ASKED (owner 2026-11-14, "Once per session (Recommended)"): on
 * the first sound lab of a session. KEEP SOUND OFF is honoured until the app
 * is closed; a new launch asks again (soundSafetyAck.ts, the switch
 * SOUND_SAFETY_ASK_AFTER_DECLINE). An acceptance is recorded once, ever.
 *
 * ── THE RULES THIS SCREEN OBEYS, AND WHY EACH ONE MATTERS ────────────────────
 *
 *  • The box starts UNCHECKED and is never pre-selected.
 *  • ENABLE SOUND is DISABLED until the box is checked — it is not merely
 *    styled as disabled, it does not fire.
 *  • Tapping the dim does NOTHING (2026-11-14): only KEEP SOUND OFF or BACK
 *    close it, as "keep sound off", because a dismissal is not an agreement.
 *    A stray tap on the dim used to close it, which a learner saw as the
 *    sheet "vanishing on its own" (audit G6_EqLab: "without me pressing
 *    either KEEP SOUND OFF or I UNDERSTAND").
 *  • Nothing plays before acceptance. This component produces no sound itself
 *    and returns control to the gate, which is still muted.
 *  • If the acknowledgment CANNOT BE RECORDED, sound is not enabled. An
 *    acknowledgment nobody wrote down did not happen.
 *  • A tap in the sheet's first moment (POPUP_ARM_MS) is ignored: a tap aimed
 *    at the lab a beat before the sheet arrived never presses a button on it.
 *  • No fade: the sheet is opaque from its first frame. A fading sheet left
 *    its text and the lab's text overlapping and both unreadable (audit
 *    G6_LimiterLab, "semi-transparent for ~2 s").
 *
 * ── THE BUTTONS ARE PINNED, THE CHECKBOX IS NOT (owner approval 2026-11-14) ──
 *
 * The warning is long and is meant to be. It scrolls; the acknowledgment
 * checkbox sits at the END of the text, inside the scroll, so ticking it still
 * means passing the text. The two buttons are pinned below the scroll so they
 * are always on screen (audit 2026-11-14: Compression and Signal Chain needed
 * a scroll inside the sheet to reach KEEP SOUND OFF; report row 2, "Pin KEEP
 * SOUND OFF and ENABLE SOUND so both are always visible", approved by the
 * owner: "Begin fixing all bugs found and do obvious ... fixes"). A pinned
 * ENABLE SOUND cannot be tapped before the text has moved: it stays disabled
 * until the box at the end of the text is ticked.
 *
 * ── …AND THEY APPEAR ONLY AT THE END (owner 2026-11-14, on the iPhone) ───────
 *
 * "Do not show the I UNDERSTAND / KEEP SOUND OFF area until the user scrolls
 * all the way down to the bottom." The footer stays below the scroll, but it
 * is not drawn until the reader has reached the end of the warning once
 * (`reachedEnd`, sticky for this request). A warning short enough to fit
 * without scrolling (a tablet) counts as read at once. A screen reader user
 * gets the footer at once (they move through the text by focus, not by a
 * scroll position). BACK still declines at any time, so the sheet never traps.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Platform, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions, type NativeScrollEvent } from 'react-native';
import { Modal } from '../../components/DimModal';
import { colors, fonts } from '../../theme/tokens';
import { isIntroCardOwed, isScreenWorkUnderway, popupArming } from '../intro/screenIntros';
import { clearSoundAsk, decideSoundSafetyOpen, noteSoundSafetyDeclined, soundAskOpenId } from './soundSafetyAck';
import {
  SOUND_SAFETY_ACCEPT,
  SOUND_SAFETY_ACK,
  SOUND_SAFETY_BODY,
  SOUND_SAFETY_DECLINE,
  SOUND_SAFETY_FOOTNOTE,
  SOUND_SAFETY_INTRO,
  SOUND_SAFETY_LIMITS,
  SOUND_SAFETY_PROTECTIONS,
  SOUND_SAFETY_PROTECTIONS_TITLE,
  SOUND_SAFETY_STEPS,
  SOUND_SAFETY_STEPS_TITLE,
  SOUND_SAFETY_TITLE,
} from './soundSafetyText';

/**
 * The open request's decision is kept while ANY copy of the sheet is up (the
 * root one or the one hosted inside another Modal) and for a beat after the
 * last one goes, so the gate's close-and-reopen of the same request (its
 * iOS re-present, HOST_DISMISS_MS) or a hosting switch never re-decides it.
 * A request settled by a path that never passed through this sheet's buttons
 * (a hosted BACK, a failed record) is forgotten once nothing has shown it for
 * SHEET_FORGET_MS.
 */
const SHEET_FORGET_MS = 700;
let sheetsUp = 0;
let forgetTimer: ReturnType<typeof setTimeout> | null = null;
function holdSheetOpen(): () => void {
  sheetsUp += 1;
  if (forgetTimer) clearTimeout(forgetTimer);
  forgetTimer = null;
  return () => {
    sheetsUp = Math.max(0, sheetsUp - 1);
    if (sheetsUp > 0) return;
    if (forgetTimer) clearTimeout(forgetTimer);
    forgetTimer = setTimeout(() => {
      forgetTimer = null;
      if (sheetsUp === 0) clearSoundAsk();
    }, SHEET_FORGET_MS);
  };
}

export function SoundSafetyWarning({
  visible,
  onAccept,
  onDecline,
  busy = false,
  embedded = false,
}: {
  visible: boolean;
  /** Called only when the box is ticked AND the accept button is pressed. */
  onAccept: () => void;
  /** Every other exit: the decline button, the hardware back key — and a
   *  request this session's KEEP SOUND OFF already answered. */
  onDecline: () => void;
  /** The acknowledgment is being written — ACCEPT shows it and cannot fire
   *  twice (bug hunt 2026-09-29). */
  busy?: boolean;
  /** Render as an in-tree overlay instead of its own Modal — used when the
   *  gate hosts it inside an already-open Modal (see DimModal.tsx). */
  embedded?: boolean;
}) {
  const [checked, setChecked] = useState(false);
  const { height } = useWindowDimensions();

  // ONCE PER SESSION (owner 2026-11-14): decided once per request, kept while
  // the sheet is up (decideSoundSafetyOpen). 'refuse' = KEEP SOUND OFF was
  // already chosen this session; 'drop' = an arrival ask over work under way
  // or a first-open card. Either way no sheet: the request answers "sound
  // off" at once (below), and a 'drop' is not counted as a decline.
  const decision = visible
    ? decideSoundSafetyOpen({ workUnderway: isScreenWorkUnderway(), cardOwed: isIntroCardOwed() })
    : null;
  const shown = decision === 'show';
  const answeredRef = useRef(false);
  useEffect(() => {
    if (!visible) {
      answeredRef.current = false;
      return;
    }
    if (decision === 'show' || answeredRef.current) return;
    answeredRef.current = true;
    clearSoundAsk();
    onDecline();
  }, [visible, decision, onDecline]);

  // The box resets on every NEW request — not on the gate's close-and-reopen
  // of the same one (a tick must not vanish under the reader). A
  // declined-then-reopened warning never remembers a tick (close() below).
  const openId = soundAskOpenId();
  useEffect(() => {
    setChecked(false);
  }, [openId]);

  // THE BUTTONS APPEAR AT THE END (owner 2026-11-14): sticky once reached for
  // this request; the box view's height and the text's height decide a
  // warning that fits without scrolling.
  const [reachedEnd, setReachedEnd] = useState(false);
  useEffect(() => {
    setReachedEnd(false);
  }, [openId]);
  const [readerOn, setReaderOn] = useState(false);
  useEffect(() => {
    // react-native-web answers `true` always, so on the web the screen-reader
    // exception would show the buttons at once; phones answer truthfully.
    if (Platform.OS === 'web') return undefined;
    let live = true;
    AccessibilityInfo.isScreenReaderEnabled()
      .then((on) => {
        if (live) setReaderOn(on);
      })
      .catch(() => {});
    const sub = AccessibilityInfo.addEventListener('screenReaderChanged', (on: boolean) => setReaderOn(on));
    return () => {
      live = false;
      sub?.remove?.();
    };
  }, []);
  const boxH = useRef(0);
  const textH = useRef(0);
  const checkFits = () => {
    if (boxH.current > 0 && textH.current > 0 && textH.current <= boxH.current + END_SLACK_PX) setReachedEnd(true);
  };
  const onScroll = (e: { nativeEvent: NativeScrollEvent }) => {
    if (reachedEnd) return;
    if (atScrollEnd(e.nativeEvent)) setReachedEnd(true);
  };
  const showButtons = reachedEnd || readerOn;

  // The arm window starts when the sheet is really shown.
  const shownAt = useRef<number | null>(null);
  useEffect(() => {
    shownAt.current = shown ? Date.now() : null;
    if (!shown) return undefined;
    return holdSheetOpen();
  }, [shown]);
  const arming = useCallback(() => popupArming(shownAt.current, Date.now()), []);

  const close = useCallback(() => {
    setChecked(false);
    onDecline();
  }, [onDecline]);
  /** KEEP SOUND OFF / BACK: the learner's choice, honoured this session. */
  const decline = useCallback(() => {
    if (arming()) return;
    noteSoundSafetyDeclined();
    close();
  }, [arming, close]);

  // The tick is KEPT while the acknowledgment is written (it used to clear on
  // press, so the box emptied under the finger while the save ran); it resets
  // on the next request instead, above.
  const accept = useCallback(() => {
    if (!checked || busy) return; // belt and braces — the button is already disabled
    if (arming()) return;
    clearSoundAsk();
    onAccept();
  }, [checked, busy, arming, onAccept]);

  const acceptOff = !checked || busy;

  const body = (
      <View style={[styles.backdrop, embedded ? StyleSheet.absoluteFill : null]} accessibilityViewIsModal>
        {/* The dim takes the tap and does nothing: neither an agreement nor a
            dismissal (the sheet never "vanishes" under a stray tap). */}
        <Pressable style={StyleSheet.absoluteFill} onPress={() => {}} accessible={false} />
        <View style={[styles.card, { maxHeight: height * 0.88 }]}>
          <View style={styles.headerBar}>
            <Text style={styles.title}>{SOUND_SAFETY_TITLE}</Text>
          </View>

          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollBody}
            showsVerticalScrollIndicator
            nestedScrollEnabled
            onScroll={onScroll}
            scrollEventThrottle={64}
            onLayout={(e) => {
              boxH.current = e.nativeEvent.layout.height;
              checkFits();
            }}
            onContentSizeChange={(_w, h) => {
              textH.current = h;
              checkFits();
            }}
          >
            <Text style={styles.intro}>{SOUND_SAFETY_INTRO}</Text>

            {SOUND_SAFETY_BODY.map((p) => (
              <Text key={p.slice(0, 24)} style={styles.body}>
                {p}
              </Text>
            ))}

            <Text style={styles.sectionTitle}>{SOUND_SAFETY_STEPS_TITLE}</Text>
            {SOUND_SAFETY_STEPS.map((s) => (
              <View key={s.slice(0, 24)} style={styles.bulletRow}>
                <Text style={styles.bulletDot}>•</Text>
                <Text style={styles.bulletText}>{s}</Text>
              </View>
            ))}

            {/* The app's own protections. Told here, before they are needed,
                rather than discovered later in a popup. */}
            <Text style={[styles.sectionTitle, styles.sectionTitleGreen]}>
              {SOUND_SAFETY_PROTECTIONS_TITLE}
            </Text>
            {SOUND_SAFETY_PROTECTIONS.map((s) => (
              <View key={s.slice(0, 24)} style={styles.bulletRow}>
                <Text style={[styles.bulletDot, styles.bulletDotGreen]}>•</Text>
                <Text style={styles.bulletText}>{s}</Text>
              </View>
            ))}

            <Text style={styles.limits}>{SOUND_SAFETY_LIMITS}</Text>

            {/* ── the acknowledgment: at the END of the text, in the scroll ── */}
            <Pressable
              style={styles.ackRow}
              onPress={() => setChecked((v) => !v)}
              accessibilityRole="checkbox"
              accessibilityState={{ checked }}
              // RNW 0.21 drops accessibilityState; aria-checked is what reaches
              // the DOM and is required on role=checkbox.
              aria-checked={checked}
              accessibilityLabel={SOUND_SAFETY_ACK}
            >
              <View style={[styles.checkbox, checked && styles.checkboxOn]}>
                {checked ? <Text style={styles.checkboxMark}>✓</Text> : null}
              </View>
              <Text style={styles.ackText}>{SOUND_SAFETY_ACK}</Text>
            </Pressable>

            <Text style={styles.footNote}>{SOUND_SAFETY_FOOTNOTE}</Text>
          </ScrollView>

          {/* Below the scroll, drawn only once the end of the warning has been
              reached (owner 2026-11-14; see the header). Until then one quiet
              line says where the buttons are. */}
          {!showButtons ? (
            <View style={styles.footer}>
              <Text style={styles.scrollHint}>{SCROLL_HINT}</Text>
            </View>
          ) : (
          <View style={styles.footer}>
            <Pressable
              style={[styles.acceptBtn, acceptOff && styles.acceptBtnOff]}
              onPress={accept}
              disabled={!checked || busy}
              accessibilityRole="button"
              accessibilityState={{ disabled: acceptOff, busy }}
              accessibilityLabel={
                busy
                  ? 'Saving your acknowledgment'
                  : checked
                    ? SOUND_SAFETY_ACCEPT
                    : 'Enable sound. Unavailable until you check the box at the end of the warning.'
              }
            >
              <Text style={[styles.acceptText, acceptOff && styles.acceptTextOff]}>
                {busy ? 'SAVING…' : SOUND_SAFETY_ACCEPT}
              </Text>
            </Pressable>

            <Pressable
              style={styles.declineBtn}
              onPress={decline}
              accessibilityRole="button"
              accessibilityLabel={SOUND_SAFETY_DECLINE}
            >
              <Text style={styles.declineText}>{SOUND_SAFETY_DECLINE}</Text>
            </Pressable>
          </View>
          )}
        </View>
      </View>
  );

  if (embedded) return shown ? body : null;
  return (
    <Modal
      accessibilityViewIsModal
      // A root surface of the audio gate: it publishes into other hosts, and
      // hosts a confirm raised over it — skipped by the gate's own count.
      overlayPublisher="gate"
      visible={shown}
      transparent
      // No fade (2026-11-14): opaque from its first frame, never see-through.
      animationType="none"
      statusBarTranslucent
      onRequestClose={decline}
    >
      {body}
    </Modal>
  );
}

/** How close to the bottom counts as "the end" (a fling rarely lands on the
 *  last pixel). */
export const END_SLACK_PX = 24;
/** The scroll position is at the end of the warning. */
export function atScrollEnd(n: Pick<NativeScrollEvent, 'contentOffset' | 'contentSize' | 'layoutMeasurement'>): boolean {
  return n.contentOffset.y + n.layoutMeasurement.height >= n.contentSize.height - END_SLACK_PX;
}
export const SCROLL_HINT = 'Scroll to the end of the warning to continue ↓';

const RED = '#ff6b5e';
const GREEN = colors.green;

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    // Nearly opaque: the lab's text never reads through the warning.
    backgroundColor: 'rgba(8,8,10,0.94)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  card: {
    width: '100%',
    // 460 = the long-read popup width the intro/help sheets share (owner
    // 2026-09-29, tablet pass): at 380 this — the longest popup in the app —
    // was a thin scrolling strip in the middle of an iPad. Phones never reach
    // either cap.
    maxWidth: 460,
    backgroundColor: '#17181a',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: 'rgba(255,42,42,.55)',
    overflow: 'hidden',
  },
  headerBar: {
    backgroundColor: 'rgba(255,42,42,.12)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,42,42,.4)',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  title: {
    fontFamily: fonts.oswaldSemiBold,
    fontSize: 15,
    letterSpacing: 1.1,
    color: RED,
    textAlign: 'center',
  },
  // Shrinks first, so the pinned footer always keeps its room.
  scroll: { flexGrow: 0, flexShrink: 1 },
  scrollBody: { padding: 16, gap: 10 },
  intro: { fontFamily: fonts.oswaldMedium, fontSize: 14, color: colors.textPrimary },
  body: { fontFamily: fonts.barlowRegular, fontSize: 13.5, lineHeight: 20, color: colors.textSecondary },
  sectionTitle: {
    fontFamily: fonts.oswaldSemiBold,
    fontSize: 12.5,
    letterSpacing: 1,
    color: RED,
    marginTop: 6,
  },
  sectionTitleGreen: { color: GREEN },
  bulletRow: { flexDirection: 'row', gap: 8, paddingRight: 4 },
  bulletDot: { fontFamily: fonts.barlowMedium, fontSize: 14, lineHeight: 20, color: RED },
  bulletDotGreen: { color: GREEN },
  bulletText: { flex: 1, fontFamily: fonts.barlowRegular, fontSize: 13, lineHeight: 20, color: colors.textSecondary },
  limits: {
    fontFamily: fonts.barlowRegular,
    fontSize: 12.5,
    lineHeight: 19,
    color: colors.textSub,
    marginTop: 6,
  },
  ackRow: {
    flexDirection: 'row',
    gap: 11,
    alignItems: 'flex-start',
    marginTop: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#3a3a3a',
    backgroundColor: '#141414',
    padding: 13,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: '#6a6a6a',
    backgroundColor: '#0f0f0f',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxOn: { borderColor: 'rgba(55,224,95,.85)', backgroundColor: 'rgba(55,224,95,.16)' },
  checkboxMark: { fontFamily: fonts.oswaldSemiBold, fontSize: 15, lineHeight: 17, color: GREEN },
  ackText: { flex: 1, fontFamily: fonts.barlowMedium, fontSize: 12.5, lineHeight: 18, color: colors.textSecondary },
  // The pinned footer: a hairline above it says "the text scrolls, these stay".
  footer: {
    borderTopWidth: 1,
    borderTopColor: '#2a2a2e',
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 12,
    gap: 8,
  },
  scrollHint: { fontFamily: fonts.barlowMedium, fontSize: 13, lineHeight: 18, color: colors.textSub, textAlign: 'center', paddingVertical: 6 },
  acceptBtn: {
    borderRadius: 9,
    backgroundColor: 'rgba(55,224,95,.12)',
    borderWidth: 1.5,
    borderColor: 'rgba(55,224,95,.7)',
    paddingVertical: 12,
    alignItems: 'center',
  },
  acceptBtnOff: { backgroundColor: '#141414', borderColor: '#3a3a3a' },
  acceptText: { fontFamily: fonts.oswaldSemiBold, fontSize: 13, letterSpacing: 0.8, color: GREEN, textAlign: 'center' },
  acceptTextOff: { color: colors.textMuted },
  declineBtn: {
    borderRadius: 9,
    borderWidth: 1,
    borderColor: '#3a3a3a',
    backgroundColor: '#141414',
    paddingVertical: 12,
    alignItems: 'center',
  },
  declineText: { fontFamily: fonts.oswaldSemiBold, fontSize: 13, letterSpacing: 0.8, color: colors.textSecondary },
  footNote: {
    fontFamily: fonts.barlowRegular,
    fontSize: 11.5,
    lineHeight: 16,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: 4,
  },
});
