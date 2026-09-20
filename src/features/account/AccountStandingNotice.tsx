/**
 * Tells a member their account has been warned, suspended or banned.
 *
 * ── WHY THEY ARE TOLD AT ALL ────────────────────────────────────────────────
 *
 * A silent restriction is indistinguishable from a broken app. Somebody who
 * cannot contact anyone and is not told why will file support tickets, leave
 * one-star reviews about a bug, or simply make a second account — and we have
 * no ban-evasion signal to catch that. In the EU the DSA additionally expects
 * a statement of reasons when a service restricts a recipient.
 *
 * So: the FACT and the REASON CODE are always given. The evidence never is —
 * naming the specific message or the person who reported it is how a
 * moderation notice turns into retaliation. The reporter is never identified
 * in any state.
 *
 * ── WHY IT IS A NOTICE AND NOT A WALL ───────────────────────────────────────
 *
 * A restricted account can still sign in, study, and use every lab and tool.
 * What stops is the COMMUNITY: contacting people, appearing in the directory.
 * Locking someone out of content they paid for is a refund question, not a
 * moderation one, and it is not ours to answer here.
 *
 * ⚠️ NOT ENFORCEMENT. Every restricted action is refused by the database
 * (`account_restricted()` inside each RPC). This only explains what is
 * already true. `null` from the read means "nothing to say" and must leave
 * the app fully usable — a dropped request must never look like a ban.
 */
import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, fonts } from '../../theme/tokens';
import { fetchMyStanding, type MyStanding } from '../moderation/api';

/**
 * The stored reason is the REPORTER'S chip value (`spam` | `harassment` |
 * `solicitation` | `impersonation` | `other`), written straight through by
 * `ReportsAdminScreen`. It used to render raw, so a restricted member read
 * `Reason: harassment` in monospace — or `Reason: other`, which says nothing
 * at all. Map it to a sentence; fall back to the neutral phrasing for any
 * code added later so a new slug can never leak to a member.
 */
const REASON_LABEL: Record<string, string> = {
  spam: 'Unsolicited or repeated messages',
  harassment: 'Harassment or abusive conduct',
  solicitation: 'Unwanted soliciting or recruiting',
  impersonation: 'Impersonating another person or organisation',
  other: 'Conduct reported by another member',
};

function reasonLabel(code: string | null | undefined): string {
  return (code && REASON_LABEL[code]) || 'Conduct reported by another member';
}

/** dd Mon yyyy, in the reader's own timezone — never a UTC ISO string. */
function until(iso: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
}

export function AccountStandingNotice() {
  const [standing, setStanding] = useState<MyStanding | null>(null);

  useEffect(() => {
    let alive = true;
    void fetchMyStanding().then((s) => {
      if (alive) setStanding(s);
    });
    return () => {
      alive = false;
    };
  }, []);

  if (!standing || standing.status === 'active') return null;

  const banned = standing.status === 'banned' || standing.status === 'removed';
  const suspended = standing.status === 'suspended';

  const title = banned
    ? 'Your community access has been removed'
    : suspended
      ? 'Your community access is paused'
      : 'A note about your account';

  const body = banned
    ? // ⚠️ This used to say "reply to the email we sent". Nothing sends one:
      // `account_set_standing()` calls no mailer and there is no trigger on
      // `account_standing` / `moderation_actions`. Name a route that exists.
      'You can still study, and your certificates are unaffected. You cannot contact members or appear in the directory. If you believe this is wrong, email info@proaudiotrainingacademy.com and we will look at it again.'
    : suspended
      ? `You can still study, and your certificates are unaffected. You cannot contact members or appear in the directory until ${until(standing.until) || 'the suspension lifts'}. If you believe this is wrong, email info@proaudiotrainingacademy.com.`
      : 'Everything still works. This is a note about community conduct, not a restriction.';

  return (
    <View
      style={[s.wrap, banned ? s.bad : suspended ? s.warn : s.note]}
      accessible
      accessibilityRole="alert"
      accessibilityLabel={`${title}. ${body} Reason: ${reasonLabel(standing.reasonCode)}.`}
    >
      <Text style={[s.title, banned ? s.badText : suspended ? s.warnText : s.noteText]}>{title}</Text>
      <Text style={s.body}>{body}</Text>
      {/* The reason is always given; the evidence never is. */}
      <Text style={s.reason}>Reason: {reasonLabel(standing.reasonCode)}</Text>
      {standing.publicNote ? <Text style={s.body}>{standing.publicNote}</Text> : null}
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { borderRadius: 11, borderWidth: 1, padding: 14, gap: 6, marginTop: 14 },
  bad: { borderColor: 'rgba(255,75,58,.55)', backgroundColor: 'rgba(255,75,58,.09)' },
  warn: { borderColor: 'rgba(255,198,77,.55)', backgroundColor: 'rgba(255,198,77,.09)' },
  note: { borderColor: colors.hairline, backgroundColor: '#101013' },
  title: { fontFamily: fonts.oswaldSemiBold, fontSize: 15.5 },
  badText: { color: colors.red },
  warnText: { color: colors.amber },
  noteText: { color: colors.textPrimary },
  body: { fontFamily: fonts.barlowRegular, fontSize: 13.5, lineHeight: 20, color: colors.textSecondary },
  reason: { fontFamily: fonts.mono, fontSize: 12, color: colors.textSub },
});
