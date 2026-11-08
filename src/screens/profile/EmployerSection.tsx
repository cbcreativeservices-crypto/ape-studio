/**
 * EmployerSection — the employer's (and, since R1 2026-10-27, the verified
 * INSTRUCTOR's) half of the Profile screen. Same application, same approval,
 * same section; the words follow the account's `kind` (VERIFIER_COPY).
 *
 * ── WHAT THIS IS AND IS NOT ────────────────────────────────────────────────
 *
 * It is NOT an application form. Applying happens on the website, where the
 * network checks run (owner: "the website has an additional application… that
 * we can then use some web tools to verify somewhat their credibility").
 * Putting a second door here would be an unverified way into the same room.
 *
 * It is: where you find out where your application stands, and — once a human
 * has approved it — where you say what you are looking for. Those category
 * selections are the thing verification unlocks.
 *
 * ── IT RENDERS NOTHING FOR ALMOST EVERYONE ─────────────────────────────────
 *
 * Members are the overwhelming majority and must never see employer UI. So the
 * section returns null unless there is an application to talk about. A learner
 * should not have to scroll past a recruiting panel that will never apply to
 * them.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';

import { Chip, ChipWrap } from '../directory/directoryBits';
import { fetchTaxonomy, type Taxonomy } from '../../features/directory/api';
import {
  fetchMyEmployerApplication,
  fetchMyEmployerInterests,
  myVerifierKind,
  setEmployerInterests,
  type EmployerApplication,
} from '../../features/employer/api';
import { VERIFIER_COPY, type VerifierKind } from '../../features/employer/verifierKind';
import { KindSwitchRow } from './KindSwitchRow';
import { InstructorCodeRow } from './InstructorCodeRow';
import { setFeedbackIdentity } from '../../lib/feedback';
import { getFeedbackIdentity } from '../../lib/feedbackTags';
import { employerSectionFace, knownVerifierKind } from '../../features/profile/employerFace';
import { useLatchedPress } from '../../lib/latch';
import { recordVerifierAnswer, useRememberedVerifierKind } from '../../features/profile/verifierKindMemory';
import { supabase } from '../../lib/supabase';
import { safeSessionResult } from '../../lib/getSessionSafe';
import { localStoreWipeCount } from '../../features/storage/localStoreRegistry';
import { PublicPageRow } from './PublicPageRow';
import { colors, fonts } from '../../theme/tokens';

const APPLY_URL = 'https://www.proaudiotrainingacademy.com/employers/apply';

/** The signed-in account, read locally. `null` = none or the read stalled:
 *  either way no remembered kind is evidence. */
async function signedInUid(): Promise<string | null> {
  try {
    const { result, timedOut } = await safeSessionResult(supabase.auth.getSession(), 'employerSection');
    return timedOut ? null : result.data.session?.user?.id ?? null;
  } catch {
    return null;
  }
}

/**
 * `queueReasons` are written by `employer_decide()` for the ADMIN queue —
 * lowercase fragments meant for a reviewer, not sentences meant for the
 * applicant. Rendered raw they read as accusations ("consumer mailbox
 * provider"), and the one the applicant can actually fix — an unconfirmed
 * work email — never said where to go and fix it. Map for display; the raw
 * strings are untouched for the admin screen.
 */
const QUEUE_REASON_LABEL: Record<string, string> = {
  'work email not confirmed':
    'Your work email has not been confirmed yet. Open your application on the website and enter the code we emailed you.',
  'work email is not at the company domain':
    'The work email you gave is not at your company’s own domain.',
  'consumer mailbox provider':
    'The work email you gave is at a personal mailbox provider rather than a company one.',
  'company domain did not resolve':
    'We could not reach your company’s domain when we checked.',
  'company website did not answer':
    'Your company website did not answer when we checked.',
  'company name too short to check':
    'The company name you gave was too short for us to check automatically.',
};

type Kind = 'area' | 'role' | 'open_to';

export function EmployerSection() {
  const [expanded, setExpanded] = useState(false);
  const [app, setApp] = useState<EmployerApplication | null>(null);
  const [verified, setVerified] = useState(false);
  /** The verified account's kind, from my_verifier_kind() (R1). */
  const [verifierKind, setVerifierKind] = useState<VerifierKind | null>(null);
  /** The verified-employer check itself FAILED — the status is unknown, so
   *  the section must not say the account is no longer active. */
  const [verifyFailed, setVerifyFailed] = useState(false);
  const [loaded, setLoaded] = useState(false);
  /** Whose remembered verifier kind may be used (verifierKindMemory.ts). */
  const [uid, setUid] = useState<string | null>(null);
  const [tax, setTax] = useState<Taxonomy | null>(null);
  const [picked, setPicked] = useState<Record<string, string[]>>({});
  /**
   * The employer's OWN choices could not be read (evening hunt 3, 2026-10-02).
   * `picked` then stays empty, and each save writes a kind's WHOLE list — so
   * one chip tapped over a failed read replaced every stored choice of that
   * kind with that one chip. The taxonomy is cached for the run, so this was
   * the ordinary offline / flaky case: chips drawn, all unlit, all live. The
   * chips are not offered until the choices they would overwrite are known.
   */
  const [interestsFailed, setInterestsFailed] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  /**
   * SAVES RUN ONE AT A TIME, FROM THE LATEST PICKS (bug hunt 2026-09-29). Each
   * save writes a kind's WHOLE list, built from `picked` as of the last render,
   * so two quick taps each dropped the other's chip, their writes could land
   * out of order, and a failed first save rolled back over the second tap.
   * `pickedRef` is always the newest list; `saveChain` serialises the writes;
   * only the newest save for a kind (`seq`) may roll back or set the note.
   */
  const pickedRef = useRef(picked);
  pickedRef.current = picked;
  const saveChain = useRef<Promise<unknown>>(Promise.resolve());
  const seq = useRef<Record<string, number>>({});

  /**
   * "REOPEN THIS SCREEN" HAS TO WORK (deep dive B, 2026-10-03). Every failure
   * line below tells the employer to reopen the screen, but this loaded once on
   * mount and Profile is a TAB — it stays mounted — so leaving and coming back
   * re-asked nothing. A verified employer whose check dropped once kept "Couldn’t
   * check your employer account" (and no chips) until the app was killed. A
   * failed read now re-asks when Profile is focused again; a clean load never
   * does, so an in-flight chip save is never read over. Newest load wins.
   */
  const failedRef = useRef(false);
  const loadTicket = useRef(0);
  /** The stored choices have been read once; `picked` is authoritative after. */
  const pickedLoaded = useRef(false);
  const load = useCallback(async () => {
    const ticket = ++loadTicket.current;
    // The account wipe this load started under (bug pass 3, CODE-3-11). A load
    // that lands after sign-out must not write the OLD account's role into the
    // feedback identity or its verifier kind back onto the device.
    const wipe = localStoreWipeCount();
    /** A wipe ran while this load was out (check P3, R2). By the time the
     *  count has moved, the wipe's in-memory resets have all run (same tick as
     *  the bump), so read again for whoever is signed in NOW, and mark the
     *  load failed so a focus re-reads too. Never leave the section hidden.
     *  After a sign-out the section unmounts first, and the ticket check
     *  before each fence stops the load before it gets here. */
    const readAgain = () => {
      failedRef.current = true;
      void load();
    };
    const [state, who, me] = await Promise.all([
      fetchMyEmployerApplication(),
      myVerifierKind(),
      signedInUid(),
    ]);
    if (ticket !== loadTicket.current) return;
    if (wipe !== localStoreWipeCount()) return readAgain();
    setUid(me);
    // Only a SERVER answer is remembered on the device: a kind is kept, a
    // clean 'none' forgets, 'unknown' changes nothing (CODE-2-13 follow-up).
    if (me && who !== 'unknown') void recordVerifierAnswer(me, who);
    // 'unknown' = the check FAILED (null here), never "not verified".
    const isVerified = who === 'unknown' ? null : who !== 'none';
    // A FAILED check keeps the kind this sign-in already learned (sign-in fill,
    // or this section's last good read), so the couldn't-check face can be
    // drawn and worded for a verified account (bug pass 2, CODE-2-13). Every
    // verified-only row also checks `verified`, so this opens nothing.
    setVerifierKind(
      who === 'none' ? null : who === 'unknown' ? knownVerifierKind(getFeedbackIdentity().role) : who,
    );
    // Feedback emails carry the verified kind as `role=` so the inbox can route
    // employers/instructors first (Comp A 2026-11-02). From THIS existing read
    // only — no new query; a failed read ('unknown') leaves it as it was.
    if (who !== 'unknown') setFeedbackIdentity({ role: who === 'none' ? undefined : who });
    failedRef.current = isVerified === null || state.state === 'error';
    setVerified(isVerified === true);
    // A FAILED verified-check is not "not verified" (hunt 7, 2026-10-03).
    setVerifyFailed(isVerified === null);
    // An ERROR is not "no application". Rendering the empty state to somebody
    // whose application is in the queue is what makes people apply twice.
    if (state.state === 'have') setApp(state.application);
    setLoaded(true);

    if (isVerified) {
      const [t, mine] = await Promise.all([fetchTaxonomy(), fetchMyEmployerInterests()]);
      if (ticket !== loadTicket.current) return;
      if (wipe !== localStoreWipeCount()) return readAgain();
      setTax(t);
      if (!t || !mine) failedRef.current = true;
      // A retry that now reads the stored choices clears the earlier failure.
      if (mine) setInterestsFailed(false);
      // Choices already READ are the screen's to keep (hunt 9, 2026-10-03).
      // A focus reload also runs when only the application read failed, with
      // the chips live: applying its (older) list mid-save darkened the chip
      // just tapped while its write landed, and the next tap in that row wrote
      // the whole list without it. Only choices never read are filled in.
      if (mine && !pickedLoaded.current) {
        pickedLoaded.current = true;
        setPicked(mine);
      } else if (!mine && !pickedLoaded.current) setInterestsFailed(true);
    }
  }, []);

  useEffect(() => {
    void load();
    // Unmount: any load still out lands nowhere (CODE-3-11).
    return () => void ++loadTicket.current;
  }, [load]);

  useFocusEffect(
    useCallback(() => {
      if (failedRef.current) void load();
    }, [load]),
  );

  /** TRY AGAIN on the couldn't-check face; one read at a time. */
  const retry = useLatchedPress(() => load());

  // A cold, offline launch knows nothing in memory: the kind the server last
  // confirmed for THIS account, kept on the device, words the couldn't-check
  // face. It is read from the device after the first render, so the section
  // re-renders when it lands (CODE-2-13 follow-up).
  const remembered = useRememberedVerifierKind(uid);
  useEffect(() => {
    if (verifyFailed && !verifierKind && remembered) setVerifierKind(remembered);
  }, [verifyFailed, verifierKind, remembered]);

  // Nothing to say to a member, so say nothing. But a VERIFIED account whose
  // reads both failed is not "nothing here": it gets the couldn't-check face
  // with a retry (bug pass 2, CODE-2-13). What this sign-in already knows is
  // the only evidence the account is one, so a learner still sees nothing.
  const face = employerSectionFace({ loaded, hasApp: !!app, verified, verifyFailed, knownKind: verifierKind });
  if (face === 'hidden') return null;
  const unreadable = face === 'unreadable';

  /** The verified kind when known, else what the application asked for. */
  const copy = VERIFIER_COPY[verifierKind ?? app?.kind ?? 'employer'];
  /** The couldn't-check line below is showing: offer the retry beside it. */
  const checkFailedShown = !verified && app?.status !== 'pending' && app?.status !== 'rejected' && verifyFailed;

  const toggle = async (kind: Kind, slug: string) => {
    const current = pickedRef.current[kind] ?? [];
    const next = current.includes(slug) ? current.filter((s) => s !== slug) : [...current, slug];
    pickedRef.current = { ...pickedRef.current, [kind]: next };
    setPicked((p) => ({ ...p, [kind]: next }));
    const mine = (seq.current[kind] = (seq.current[kind] ?? 0) + 1);
    const run = saveChain.current.then(() => setEmployerInterests(kind, next));
    saveChain.current = run.catch(() => {});
    const res = await run.catch(() => ({ ok: false as const, error: 'Couldn’t save that. Check your connection and try again.' }));
    if (mine !== seq.current[kind]) return; // a newer tap owns the outcome
    if (!res.ok) {
      // Put it back. A chip that stays lit after a failed save is a lie about
      // what the server holds.
      pickedRef.current = { ...pickedRef.current, [kind]: current };
      setPicked((p) => ({ ...p, [kind]: current }));
      setNote(res.error);
    } else {
      setNote(null);
    }
  };

  const row = (kind: Kind, title: string, items: { slug: string; label: string }[]) => (
    <View style={styles.block}>
      <Text style={styles.blockHead}>{title}</Text>
      <ChipWrap>
        {items.map((i) => (
          <Chip
            key={i.slug}
            label={i.label}
            on={(picked[kind] ?? []).includes(i.slug)}
            onPress={() => void toggle(kind, i.slug)}
          />
        ))}
      </ChipWrap>
    </View>
  );

  // Owner 2026-11-05: a verified account's section took up too much of Profile,
  // so it folds and starts closed. An application still in progress stays open:
  // its status is the reason the section is there.
  const showBody = !verified || expanded;

  return (
    <View style={styles.wrap}>
      <Pressable
        style={styles.headRow}
        onPress={verified ? () => setExpanded((v) => !v) : undefined}
        disabled={!verified}
        accessibilityRole={verified ? 'button' : undefined}
        accessibilityState={verified ? { expanded } : undefined}
        aria-expanded={verified ? expanded : undefined}
        accessibilityLabel={verified ? `${copy.accountHead}, ${copy.badgeA11y}, ${expanded ? 'expanded' : 'collapsed'}` : undefined}
      >
        {verified ? <Text style={[styles.caret, expanded && styles.caretOpen]}>▸</Text> : null}
        <Text style={styles.head}>{copy.accountHead}</Text>
        {verified ? (
          <View style={styles.tag}>
            <Text style={styles.tagText}>VERIFIED</Text>
          </View>
        ) : null}
      </Pressable>
      {showBody ? (
        <>

      {app ? <Text style={styles.company}>{app.companyName}</Text> : null}

      {verified ? (
        <Text style={styles.body}>{copy.activeBody}</Text>
      ) : app?.status === 'pending' ? (
        <>
          {/* No mailer runs on `employer_review`, so no decision email is ever
              sent — this screen is the only place the answer appears. */}
          <Text style={styles.body}>
            We could not confirm everything automatically, so a person is looking at your
            application. Nothing more is needed from you. Check back on this screen for the
            decision.
          </Text>
          {app.queueReasons.length ? (
            <View style={styles.reasons}>
              <Text style={styles.reasonsHead}>WHAT WE COULD NOT CONFIRM</Text>
              {app.queueReasons.map((r) => (
                <Text key={r} style={styles.reason}>
                  · {QUEUE_REASON_LABEL[r] ?? r}
                </Text>
              ))}
            </View>
          ) : null}
        </>
      ) : app?.status === 'rejected' ? (
        <>
          <Text style={styles.body}>This application was not approved.</Text>
          {app.reviewNote ? <Text style={styles.reason}>{app.reviewNote}</Text> : null}
        </>
      ) : verifyFailed ? (
        <Text style={styles.warn}>{copy.checkFailed}</Text>
      ) : (
        <Text style={styles.body}>This application is no longer active.</Text>
      )}

      {checkFailedShown ? (
        <Pressable style={styles.link} onPress={retry} accessibilityRole="button" accessibilityLabel="Try again">
          <Text style={styles.linkText}>TRY AGAIN ›</Text>
        </Pressable>
      ) : null}

      {note ? <Text style={styles.warn}>{note}</Text> : null}

      {/* A verified INSTRUCTOR's code for students (instructor_my_code).
          Never drawn for an employer: the server answers null for one anyway. */}
      {verified && verifierKind === 'instructor' ? <InstructorCodeRow /> : null}
      {verified ? <KindSwitchRow onSwitched={() => void load()} /> : null}

      {/* SHARE MY PUBLIC PAGE (must-do H5): the website's /e/<token> page.
          Draws nothing until my_employer_public_token() answers a token. */}
      {verified && verifierKind ? <PublicPageRow kind={verifierKind} /> : null}

      {verified && tax && interestsFailed ? (
        <Text style={styles.warn}>
          Couldn’t load what you have already chosen. Check your connection and reopen this screen.
        </Text>
      ) : null}

      {verified && tax && !interestsFailed ? (
        <>
          {row('area', copy.areaHead, tax.areas)}
          {row('role', copy.roleHead, tax.roles)}
          {row('open_to', copy.offerHead, tax.openTo)}
        </>
      ) : null}

      {verified && !tax ? (
        // A failed taxonomy read draws every row blank, which reads as "there
        // is nothing to choose" rather than "this did not load".
        <Text style={styles.warn}>
          Couldn’t load the category list. Check your connection and reopen this screen.
        </Text>
      ) : null}

      {/* An account known to be verified has nothing to apply for: only
          the retry is offered while its reads are failing. */}
      {!verified && !unreadable ? (
        <Pressable
          style={styles.link}
          // `void` does not handle a rejection: no browser / a blocked open was
          // an unhandled promise rejection (2026-09-30 bug pass). Say where to go.
          onPress={() =>
            void Linking.openURL(APPLY_URL).catch(() =>
              setNote('Couldn’t open the website. Visit proaudiotrainingacademy.com/employers/apply in your browser.'),
            )
          }
          accessibilityRole="link"
          accessibilityLabel={copy.openApplicationA11y}
        >
          <Text style={styles.linkText}>OPEN MY APPLICATION ON THE WEBSITE ›</Text>
        </Pressable>
      ) : null}
        </>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderWidth: 1,
    borderColor: colors.hairlineDim,
    backgroundColor: '#141414',
    borderRadius: 12,
    padding: 16,
    gap: 10,
  },
  headRow: { flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 24 },
  caret: { fontFamily: fonts.oswaldSemiBold, fontSize: 13, color: colors.amber },
  caretOpen: { transform: [{ rotate: '90deg' }] },
  head: { fontFamily: fonts.oswaldSemiBold, fontSize: 13, letterSpacing: 1.4, color: colors.textPrimary },
  tag: {
    borderWidth: 1,
    borderColor: 'rgba(125,255,161,.55)',
    backgroundColor: 'rgba(125,255,161,.12)',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  tagText: { fontFamily: fonts.oswaldSemiBold, fontSize: 9.5, letterSpacing: 1, color: '#7dffa1' },
  company: { fontFamily: fonts.oswaldSemiBold, fontSize: 18, color: '#ffffff' },
  body: { fontFamily: fonts.barlowRegular, fontSize: 14, lineHeight: 20, color: colors.textSecondary },
  reasons: { gap: 2, marginTop: 2 },
  reasonsHead: { fontFamily: fonts.barlowSemiBold, fontSize: 13, color: colors.textPrimary },
  reason: { fontFamily: fonts.barlowRegular, fontSize: 13, lineHeight: 19, color: colors.textSub },
  warn: { fontFamily: fonts.barlowRegular, fontSize: 13, color: '#ffb060' },
  block: { gap: 6, marginTop: 4 },
  blockHead: { fontFamily: fonts.oswaldSemiBold, fontSize: 10.5, letterSpacing: 1.3, color: colors.textSub },
  link: { paddingVertical: 8, minHeight: 44, justifyContent: 'center' },
  linkText: { fontFamily: fonts.oswaldSemiBold, fontSize: 12, letterSpacing: 1, color: colors.amber },
});
