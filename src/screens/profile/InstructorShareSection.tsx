/**
 * MY INSTRUCTOR — "Allow my instructor to see my progress" (must-do H2, owner
 * GO 2026-10-27; spec docs/CROSS_SESSION_HANDOFF.md, 2026-10-04 "INSTRUCTOR
 * PROGRESS SHARING").
 *
 * Lives in Profile right after WHO CAN SEE ME, with the other privacy
 * switches. OFF unless the student turns it on. Turning it on opens a POPUP
 * (never a pulldown): the instructor's code → instructor_share_lookup shows
 * WHO (name · school) → the student confirms → instructor_share_on. Turning it
 * off asks first (confirmDialog) → instructor_share_off. The state shown is
 * always the server's (instructor_share_mine); a failed read shows neither on
 * nor off. A guest has no account, so nothing can be shared and nothing is
 * claimed as saved.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useFocusEffect, useIsFocused } from '@react-navigation/native';

import { Modal } from '../../components/DimModal';
import { Section } from '../../components/Section';
import { Toggle } from '../../components/Toggle';
import {
  fetchMyInstructorShare,
  lookupInstructor,
  shareWithInstructor,
  stopSharingWithInstructor,
  type ShareState,
} from '../../features/instructor/api';
import {
  codeLooksRight,
  confirmLine,
  SHARE_COPY,
  sharingSince,
  stopLine,
} from '../../features/instructor/shareRules';
import { confirmDialog, notify } from '../../lib/confirm';
import { fetchMyRegistryName } from '../../features/profile/api';
import { createInFlightLatch, useLatchedPress } from '../../lib/latch';
import { createFocusGate } from '../../features/profile/focusGate';
import { colors, fonts } from '../../theme/tokens';

/** `code` is the code that was LOOKED UP: the share goes to the instructor
 *  whose name the popup showed, never to whatever the field says by the time
 *  SHARE MY PROGRESS is tapped (bug pass 1, CODE-1-03). */
type Found = { code: string; instructorName: string; school: string | null };

/** Shown on the button while the share write is out; CANCEL is held until the
 *  server has answered, because a cancel then could not stop it (CODE-1-25). */
const SHARING_LABEL = 'SHARING…';
/** Shown on FIND while the lookup is out. */
const FINDING_LABEL = 'FINDING…';

export function InstructorShareSection() {
  /** null = the first read is still out. */
  const [share, setShare] = useState<ShareState | null>(null);
  const [popupOpen, setPopupOpen] = useState(false);
  const [code, setCode] = useState('');
  const [found, setFound] = useState<Found | null>(null);
  const [popupError, setPopupError] = useState<string | null>(null);
  /** A lookup is out: the code field is locked so it cannot drift from the
   *  code being looked up. */
  const [finding, setFinding] = useState(false);
  /** The share write is out: nothing in the popup can be tapped but the wait. */
  const [sharing, setSharing] = useState(false);
  /** Bumped each time the popup opens or closes, so a lookup that lands after
   *  CANCEL (or in a later popup) shows nothing. */
  const popupTicket = useRef(0);
  /** One FIND latch per popup: a lookup still out from a cancelled popup must
   *  not hold FIND (or the field) in the next one. Its answer is dropped by
   *  `popupTicket`. */
  const [findLatch, setFindLatch] = useState(createInFlightLatch);
  /** Profile is a TAB, so it stays mounted while another tab is in front, and
   *  the RN Modal and `notify` are global: an answer that lands after the
   *  member left Profile must open nothing over Study or My Progress (bug pass
   *  2, CODE-2-11). Kept in a ref so an await reads it as it is NOW. */
  const isFocused = useIsFocused();
  const focusedRef = useRef(isFocused);
  focusedRef.current = isFocused;
  /** Drops an answer nobody waits for; keeps a failure until Profile is back
   *  in front (features/profile/focusGate.ts). */
  const [gate] = useState(() => createFocusGate(() => focusedRef.current));

  // Newest read wins; a failed read re-asks when Profile (a tab, so it stays
  // mounted) is focused again — "reopen Profile" has to work.
  const ticket = useRef(0);
  const failed = useRef(false);
  const load = useCallback(async () => {
    const mine = ++ticket.current;
    const s = await fetchMyInstructorShare();
    if (mine !== ticket.current) return s;
    failed.current = s.state === 'error';
    setShare(s);
    return s;
  }, []);
  useEffect(() => {
    void load();
    // Unmount: any read still out lands nowhere.
    return () => void ++ticket.current;
  }, [load]);
  useFocusEffect(
    useCallback(() => {
      // A failed stop that landed while another tab was in front is told now.
      gate.onFocus();
      if (failed.current) void load();
    }, [load, gate]),
  );

  const openPopup = () => {
    popupTicket.current++;
    // A new popup is usable at once, even while an old lookup is still out.
    setFinding(false);
    setFindLatch(createInFlightLatch());
    setCode('');
    setFound(null);
    setPopupError(null);
    setPopupOpen(true);
  };
  /** Only while Profile is in front (CODE-2-11): for answers that land after
   *  an await. */
  const notifyOnProfile: typeof notify = (...a) => gate.ifFocused(() => notify(...a));
  const openPopupOnProfile = () => gate.ifFocused(openPopup);
  const closePopup = () => {
    // A share already sent cannot be called back, so CANCEL waits for it.
    if (sharing) return;
    popupTicket.current++;
    setPopupOpen(false);
  };

  const onFind = useLatchedPress(async () => {
    setPopupError(null);
    if (!codeLooksRight(code)) {
      setPopupError(SHARE_COPY.codeShape);
      return;
    }
    const asked = code;
    const mine = popupTicket.current;
    setFinding(true);
    try {
      const r = await lookupInstructor(code);
      if (mine !== popupTicket.current) return; // cancelled, or a newer popup
      if (r.ok) setFound({ code: asked, instructorName: r.instructorName, school: r.school });
      else setPopupError(r.error);
    } finally {
      // Only this popup's own lookup clears its busy state.
      if (mine === popupTicket.current) setFinding(false);
    }
  }, findLatch);

  const onShare = useLatchedPress(async () => {
    if (!found) return;
    // The code that was looked up and confirmed, not the field's text now.
    const code = found.code;
    setPopupError(null);
    setSharing(true);
    try {
      const r = await shareWithInstructor(code);
      if (r.ok) {
        // "On" only from the row the server returned.
        ticket.current++;
        failed.current = false;
        setShare({ state: 'on', share: r.share });
        popupTicket.current++;
        setPopupOpen(false);
        return;
      }
      setPopupError(r.error);
      // A write we could not confirm: show what the server now says.
      void load();
    } finally {
      setSharing(false);
    }
  });

  const stop = useLatchedPress(async () => {
    const r = await stopSharingWithInstructor();
    const now = await load();
    if (!r.ok || now.state !== 'off') {
      // A stop we could not confirm must be seen, but never over another tab:
      // if Profile is not in front it waits for the next focus (CODE-2-11
      // follow-up).
      const body = r.ok ? SHARE_COPY.readFailed : r.error;
      gate.nowOrOnFocus(() => notify(SHARE_COPY.notConfirmedTitle, body));
    }
  });

  const onToggle = (next: boolean) => {
    if (share?.state === 'on' && !next) {
      confirmDialog(SHARE_COPY.stopTitle, stopLine(share.share), SHARE_COPY.stopYes, () => stop(), {
        destructive: true,
      });
      return;
    }
    if (share?.state === 'off' && next) void startShare();
  };

  // A name before sharing (owner 2026-10-27): the instructor sees the SAVED
  // certificate name (private.person_label reads users.registry_name first);
  // without one they would see the account name, which starts out as the
  // part of the email before the @. A read that fails is said as such, never
  // treated as "no name".
  const startShare = useLatchedPress(async () => {
    // Everything below lands after the read, when Profile may no longer be in
    // front: the notice and the popup open only over Profile (CODE-2-11). The
    // switch never turned on, so a dropped answer costs nothing: the member
    // turns it on again back on Profile.
    const notify = notifyOnProfile;
    const openPopup = openPopupOnProfile;
    let name: string | null;
    try {
      name = await fetchMyRegistryName();
    } catch {
      notify(SHARE_COPY.notConfirmedTitle, SHARE_COPY.readFailed);
      return;
    }
    if (!name) {
      notify(SHARE_COPY.nameFirstTitle, SHARE_COPY.nameFirstBody);
      return;
    }
    openPopup();
  });

  const summary =
    share === null
      ? '…'
      : share.state === 'on'
        ? share.share.instructorActive
          ? 'sharing'
          : 'not shared'
        : share.state === 'off'
          ? 'off'
          : share.state === 'guest'
            ? 'needs an account'
            : 'couldn’t check';

  return (
    <Section title={SHARE_COPY.sectionTitle} summary={summary}>
      <Text style={styles.intro}>{SHARE_COPY.intro}</Text>

      {share?.state === 'guest' ? (
        <Text style={styles.warn}>{SHARE_COPY.guest}</Text>
      ) : (
        <>
          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>{SHARE_COPY.switchLabel}</Text>
            <Toggle
              on={share?.state === 'on'}
              label={SHARE_COPY.switchLabel}
              // Neither on nor off is asserted until the server has answered.
              disabled={share === null || share.state === 'error'}
              onChange={onToggle}
            />
          </View>
          {share === null ? <Text style={styles.hint}>{SHARE_COPY.checking}</Text> : null}
          {share?.state === 'error' ? <Text style={styles.warn}>{SHARE_COPY.readFailed}</Text> : null}
          {share?.state === 'on' ? (
            <>
              <Text style={styles.state}>{sharingSince(share.share)}</Text>
              {!share.share.instructorActive ? <Text style={styles.warn}>{SHARE_COPY.inactive}</Text> : null}
              <Pressable
                onPress={openPopup}
                style={styles.link}
                accessibilityRole="button"
                accessibilityLabel="Share with a different instructor"
              >
                <Text style={styles.linkText}>{SHARE_COPY.differentCode} ›</Text>
              </Pressable>
            </>
          ) : null}
        </>
      )}

      <View style={styles.manifest}>
        <Text style={styles.groupLabel}>{SHARE_COPY.seesHead}</Text>
        {SHARE_COPY.sees.map((line) => (
          <Text key={line} style={styles.manifestOn}>
            · {line}
          </Text>
        ))}
        <Text style={[styles.groupLabel, { marginTop: 10 }]}>{SHARE_COPY.neverHead}</Text>
        {SHARE_COPY.never.map((line) => (
          <Text key={line} style={styles.manifestOff}>
            · {line}
          </Text>
        ))}
      </View>
      <Text style={styles.hint}>
        {SHARE_COPY.oneAtATime} {SHARE_COPY.employersNever}
      </Text>

      <Modal
        accessibilityViewIsModal
        visible={popupOpen}
        transparent
        animationType="fade"
        onRequestClose={closePopup}
      >
        <KeyboardAvoidingView style={styles.scrim} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={styles.card}>
            {found ? (
              <>
                <Text accessibilityRole="header" style={styles.title}>
                  {SHARE_COPY.confirmTitle}
                </Text>
                <Text style={styles.who}>{found.instructorName}</Text>
                {found.school ? <Text style={styles.school}>{found.school}</Text> : null}
                <Text style={styles.body}>{confirmLine(found)}</Text>
                {popupError ? <Text style={styles.popupError}>{popupError}</Text> : null}
                <Pressable
                  onPress={onShare}
                  disabled={sharing}
                  style={styles.cta}
                  accessibilityRole="button"
                  accessibilityState={{ busy: sharing, disabled: sharing }}
                  accessibilityLabel={
                    sharing ? 'Sharing your progress' : `Share my progress with ${found.instructorName}`
                  }
                >
                  <Text style={styles.ctaText}>{sharing ? SHARING_LABEL : SHARE_COPY.share}</Text>
                </Pressable>
                <Pressable
                  onPress={() => {
                    setFound(null);
                    setPopupError(null);
                  }}
                  disabled={sharing}
                  hitSlop={8}
                  accessibilityRole="button"
                  accessibilityState={{ disabled: sharing }}
                  accessibilityLabel="Use a different code"
                >
                  <Text style={[styles.dismiss, sharing && styles.held]}>{SHARE_COPY.differentCode}</Text>
                </Pressable>
              </>
            ) : (
              <>
                <Text accessibilityRole="header" style={styles.title}>
                  {SHARE_COPY.enterTitle}
                </Text>
                <Text style={styles.body}>{SHARE_COPY.enterBody}</Text>
                <TextInput
                  style={styles.input}
                  value={code}
                  editable={!finding}
                  onChangeText={(t) => {
                    setCode(t);
                    setPopupError(null);
                  }}
                  placeholder="ABCD-2345"
                  placeholderTextColor={colors.textMuted}
                  autoCapitalize="characters"
                  autoCorrect={false}
                  maxLength={16}
                  returnKeyType="go"
                  onSubmitEditing={onFind}
                  accessibilityLabel="Instructor code"
                />
                {popupError ? <Text style={styles.popupError}>{popupError}</Text> : null}
                <Pressable
                  onPress={onFind}
                  disabled={finding}
                  style={styles.cta}
                  accessibilityRole="button"
                  accessibilityState={{ busy: finding, disabled: finding }}
                  accessibilityLabel={finding ? 'Finding your instructor' : 'Find my instructor'}
                >
                  <Text style={styles.ctaText}>{finding ? FINDING_LABEL : SHARE_COPY.lookUp}</Text>
                </Pressable>
              </>
            )}
            <Pressable
              onPress={closePopup}
              disabled={sharing}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityState={{ disabled: sharing }}
              accessibilityLabel="Cancel"
            >
              <Text style={[styles.dismiss, sharing && styles.held]}>{SHARE_COPY.cancel}</Text>
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </Section>
  );
}

const styles = StyleSheet.create({
  intro: { fontFamily: fonts.barlowRegular, fontSize: 14, lineHeight: 20, color: colors.textSecondary },
  switchRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 10, minHeight: 44 },
  switchLabel: { flex: 1, fontFamily: fonts.barlowSemiBold, fontSize: 15, color: colors.textPrimary },
  state: { fontFamily: fonts.barlowSemiBold, fontSize: 14, lineHeight: 20, color: '#7dffa1', marginTop: 4 },
  hint: { fontFamily: fonts.barlowRegular, fontSize: 13, lineHeight: 19, color: colors.textSub, marginTop: 6 },
  warn: { fontFamily: fonts.barlowRegular, fontSize: 13, lineHeight: 19, color: '#ffb060', marginTop: 6 },
  link: { paddingVertical: 8, minHeight: 44, justifyContent: 'center' },
  linkText: { fontFamily: fonts.oswaldSemiBold, fontSize: 12, letterSpacing: 1, color: colors.amber },
  manifest: { marginTop: 12, gap: 3 },
  groupLabel: { fontFamily: fonts.oswaldSemiBold, fontSize: 10.5, letterSpacing: 1.3, color: colors.textSub, marginBottom: 2 },
  manifestOn: { fontFamily: fonts.barlowRegular, fontSize: 13.5, lineHeight: 19, color: colors.textSecondary },
  manifestOff: { fontFamily: fonts.barlowRegular, fontSize: 13.5, lineHeight: 19, color: colors.textSub },
  // The popup — the app dialog's voice (AppDialog), centred, never a pulldown.
  scrim: { flex: 1, backgroundColor: 'rgba(0,0,0,0.72)', alignItems: 'center', justifyContent: 'center', padding: 26 },
  card: {
    width: '100%',
    maxWidth: 340,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#2b2b33',
    backgroundColor: '#141418',
    padding: 22,
    alignItems: 'center',
    gap: 12,
  },
  title: { fontFamily: fonts.oswaldSemiBold, fontSize: 16, letterSpacing: 0.6, color: colors.amber, textAlign: 'center' },
  body: { fontFamily: fonts.barlowRegular, fontSize: 14.5, lineHeight: 21, color: colors.textSecondary, textAlign: 'center' },
  who: { fontFamily: fonts.oswaldSemiBold, fontSize: 20, color: '#ffffff', textAlign: 'center' },
  school: { fontFamily: fonts.barlowSemiBold, fontSize: 15, color: colors.textSecondary, textAlign: 'center', marginTop: -6 },
  input: {
    alignSelf: 'stretch',
    borderWidth: 1,
    borderColor: colors.hairline,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontFamily: fonts.oswaldSemiBold,
    fontSize: 20,
    letterSpacing: 3,
    color: '#ffffff',
    textAlign: 'center',
    backgroundColor: '#0e0e12',
  },
  popupError: { fontFamily: fonts.barlowRegular, fontSize: 13.5, lineHeight: 19, color: '#ff7a68', textAlign: 'center' },
  cta: {
    marginTop: 4,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,198,77,.55)',
    backgroundColor: '#1c1608',
    paddingVertical: 12,
    paddingHorizontal: 22,
    minWidth: 150,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaText: { fontFamily: fonts.oswaldSemiBold, fontSize: 14, letterSpacing: 1.4, color: colors.amber },
  dismiss: { fontFamily: fonts.oswaldSemiBold, fontSize: 12, letterSpacing: 1, color: colors.textMuted, paddingVertical: 6 },
  held: { opacity: 0.4 },
});
