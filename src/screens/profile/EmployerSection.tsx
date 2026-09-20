/**
 * EmployerSection — the employer's half of the Profile screen.
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
import { useCallback, useEffect, useState } from 'react';
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';

import { Chip, ChipWrap } from '../directory/directoryBits';
import { fetchTaxonomy, type Taxonomy } from '../../features/directory/api';
import {
  amIVerifiedEmployer,
  fetchMyEmployerApplication,
  fetchMyEmployerInterests,
  setEmployerInterests,
  type EmployerApplication,
} from '../../features/employer/api';
import { colors, fonts } from '../../theme/tokens';

const APPLY_URL = 'https://www.proaudiotrainingacademy.com/employers/apply';

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
    'Your work email has not been confirmed yet — open your application on the website and enter the code we emailed you.',
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
  const [app, setApp] = useState<EmployerApplication | null>(null);
  const [verified, setVerified] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [tax, setTax] = useState<Taxonomy | null>(null);
  const [picked, setPicked] = useState<Record<string, string[]>>({});
  const [note, setNote] = useState<string | null>(null);

  const load = useCallback(async () => {
    const [state, isVerified] = await Promise.all([
      fetchMyEmployerApplication(),
      amIVerifiedEmployer(),
    ]);
    setVerified(isVerified);
    // An ERROR is not "no application". Rendering the empty state to somebody
    // whose application is in the queue is what makes people apply twice.
    if (state.state === 'have') setApp(state.application);
    setLoaded(true);

    if (isVerified) {
      const [t, mine] = await Promise.all([fetchTaxonomy(), fetchMyEmployerInterests()]);
      setTax(t);
      if (mine) setPicked(mine);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  // Nothing to say to a member, so say nothing.
  if (!loaded || (!app && !verified)) return null;

  const toggle = async (kind: Kind, slug: string) => {
    const current = picked[kind] ?? [];
    const next = current.includes(slug) ? current.filter((s) => s !== slug) : [...current, slug];
    setPicked((p) => ({ ...p, [kind]: next }));
    const res = await setEmployerInterests(kind, next);
    if (!res.ok) {
      // Put it back. A chip that stays lit after a failed save is a lie about
      // what the server holds.
      setPicked((p) => ({ ...p, [kind]: current }));
      setNote(res.error);
    } else {
      setNote(null);
    }
  };

  const Row = ({ kind, title, items }: { kind: Kind; title: string; items: { slug: string; label: string }[] }) => (
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

  return (
    <View style={styles.wrap}>
      <View style={styles.headRow}>
        <Text style={styles.head}>EMPLOYER ACCOUNT</Text>
        {verified ? (
          <View style={styles.tag} accessible accessibilityLabel="Verified employer">
            <Text style={styles.tagText}>VERIFIED</Text>
          </View>
        ) : null}
      </View>

      {app ? <Text style={styles.company}>{app.companyName}</Text> : null}

      {verified ? (
        <Text style={styles.body}>
          Your employer account is active. Choose what you are looking for — members can see this,
          and it is how the right people find you.
        </Text>
      ) : app?.status === 'pending' ? (
        <>
          {/* No mailer runs on `employer_review`, so no decision email is ever
              sent — this screen is the only place the answer appears. */}
          <Text style={styles.body}>
            We could not confirm everything automatically, so a person is looking at your
            application. Nothing more is needed from you — check back on this screen for the
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
      ) : (
        <Text style={styles.body}>This application is no longer active.</Text>
      )}

      {note ? <Text style={styles.warn}>{note}</Text> : null}

      {verified && tax ? (
        <>
          <Row kind="area" title="AREAS YOU HIRE IN" items={tax.areas} />
          <Row kind="role" title="ROLES YOU ARE LOOKING FOR" items={tax.roles} />
          <Row kind="open_to" title="WHAT YOU ARE OFFERING" items={tax.openTo} />
        </>
      ) : null}

      {verified && !tax ? (
        // A failed taxonomy read draws every row blank, which reads as "there
        // is nothing to choose" rather than "this did not load".
        <Text style={styles.warn}>
          Couldn’t load the category list. Check your connection and reopen this screen.
        </Text>
      ) : null}

      {!verified ? (
        <Pressable
          style={styles.link}
          onPress={() => void Linking.openURL(APPLY_URL)}
          accessibilityRole="link"
          accessibilityLabel="Open your employer application on the website"
        >
          <Text style={styles.linkText}>OPEN MY APPLICATION ON THE WEBSITE ›</Text>
        </Pressable>
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
  headRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
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
