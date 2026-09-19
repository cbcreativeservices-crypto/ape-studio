/**
 * EMPLOYER REVIEW — the admin queue (owner 2026-09-19).
 *
 * ── WHY THIS EXISTS ─────────────────────────────────────────────────────────
 *
 * `employer_review` had existed for a while with ZERO callers. There was no
 * list of pending applications anywhere, and revoking a granted badge was
 * impossible through any client. So the "queue the ambiguous ones for a human"
 * half of the design terminated in the Supabase SQL editor — while the review
 * email told the owner to use "the admin list" and promised the badge "can be
 * revoked at any time". This is that list, and that revoke.
 *
 * ── WHAT THE SCREEN IS FOR ──────────────────────────────────────────────────
 *
 * Deciding, with the evidence in front of you. Every automated signal is shown
 * as a plain yes/no, and the ones that FAILED are what the database wrote as
 * queue reasons — so the row explains itself rather than making the reviewer
 * re-derive why it is here.
 *
 * WORK EMAIL CONFIRMED is listed first and separately because it is the only
 * signal an impostor cannot supply: company name is free text, the website is
 * a domain they need not own, and "email at company domain" is a string
 * comparison. An application without it should almost never be approved, and
 * the screen says so rather than leaving it as one tick among five.
 *
 * ── SECURITY ────────────────────────────────────────────────────────────────
 *
 * Nothing here is the enforcement. Every RPC is guarded by is_admin() in the
 * database and refuses with "not permitted" regardless of what this screen
 * does. Hiding it from non-admins is a courtesy, not a control.
 */
import { useCallback, useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { colors, fonts } from '../../theme/tokens';
import { confirmDialog, notify } from '../../lib/confirm';
import {
  fetchActiveEmployers,
  fetchPendingApplications,
  reviewApplication,
  setEmployerRevoked,
  type ActiveEmployer,
  type PendingApplication,
} from '../../features/employer/api';

export function EmployerAdminScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const [tab, setTab] = useState<'pending' | 'active'>('pending');
  const [pending, setPending] = useState<PendingApplication[] | null>(null);
  const [active, setActive] = useState<ActiveEmployer[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setErr(null);
    const [p, a] = await Promise.all([fetchPendingApplications(), fetchActiveEmployers()]);
    // A null here is a refusal or a dropped connection, NOT an empty queue.
    // Showing "nothing to review" when the read failed is how a queue gets
    // quietly ignored for a week.
    if (p === null || a === null) setErr('Could not load the employer queue. Check your connection and try again.');
    setPending(p);
    setActive(a);
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const decide = (app: PendingApplication, action: 'approve' | 'reject') => {
    const verb = action === 'approve' ? 'Approve' : 'Reject';
    const body =
      action === 'approve'
        ? app.emailConfirmed
          ? 'They will be able to contact members without publishing a community profile, and the app vouches for them with a VERIFIED EMPLOYER badge.'
          : 'THIS APPLICANT HAS NOT CONFIRMED THEIR WORK EMAIL. Nothing proves they hold that mailbox or work at that company. Approve only if you have verified them another way.'
        : 'They are told the application was not approved. They can apply again later.';
    confirmDialog(
      `${verb} ${app.companyName}?`,
      body,
      verb,
      () => {
        void (async () => {
          setBusy(app.id);
          const r = await reviewApplication(app.id, action);
          setBusy(null);
          if (!r.ok) {
            notify('Could not save', r.error);
            return;
          }
          await load();
        })();
      },
      // Approving an UNCONFIRMED applicant is styled as the dangerous action
      // it is, not as the friendly green one.
      { destructive: action === 'reject' || !app.emailConfirmed },
    );
  };

  const toggleRevoke = (e: ActiveEmployer) => {
    const on = e.revokedAt == null;
    confirmDialog(
      on ? `Revoke ${e.companyName}?` : `Restore ${e.companyName}?`,
      on
        ? 'Their badge stops immediately and they can no longer contact members. Existing conversations are not deleted. This can be undone.'
        : 'Their verified badge and the ability to contact members come back.',
      on ? 'Revoke' : 'Restore',
      () => {
        void (async () => {
          setBusy(e.userId);
          const r = await setEmployerRevoked(e.userId, on);
          setBusy(null);
          if (!r.ok) {
            notify('Could not save', r.error);
            return;
          }
          await load();
        })();
      },
      { destructive: on },
    );
  };

  return (
    <View style={[s.root, { paddingTop: insets.top + 8 }]}>
      <View style={s.head}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={16} accessibilityRole="button" accessibilityLabel="Back">
          <Text style={s.back}>‹</Text>
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={s.kicker}>ADMIN</Text>
          <Text accessibilityRole="header" style={s.title}>
            Employer review
          </Text>
        </View>
      </View>

      <View style={s.tabs}>
        {(['pending', 'active'] as const).map((t) => (
          <Pressable
            key={t}
            onPress={() => setTab(t)}
            hitSlop={8}
            style={[s.tab, tab === t && s.tabOn]}
            accessibilityRole="tab"
            accessibilityState={{ selected: tab === t }}
            accessibilityLabel={t === 'pending' ? 'Awaiting review' : 'Verified employers'}
          >
            <Text style={[s.tabText, tab === t && s.tabTextOn]}>
              {t === 'pending' ? `AWAITING REVIEW${pending ? ` (${pending.length})` : ''}` : 'VERIFIED'}
            </Text>
          </Pressable>
        ))}
      </View>

      <ScrollView contentContainerStyle={s.body}>
        {err ? (
          <View style={s.warn}>
            <Text style={s.warnText}>{err}</Text>
            <Pressable onPress={() => void load()} hitSlop={8} accessibilityRole="button" accessibilityLabel="Retry">
              <Text style={s.retry}>RETRY</Text>
            </Pressable>
          </View>
        ) : null}

        {loading ? <Text style={s.muted}>Loading…</Text> : null}

        {!loading && tab === 'pending' && pending?.length === 0 ? (
          <Text style={s.muted}>Nothing is waiting for review.</Text>
        ) : null}

        {!loading && tab === 'pending'
          ? pending?.map((a) => (
              <View key={a.id} style={s.card}>
                <Text style={s.company}>{a.companyName}</Text>
                <Text style={s.sub}>
                  {a.companyWebsite} · APP-{a.id.slice(0, 8)}
                </Text>

                {/* The one that matters, called out rather than buried. */}
                <View style={[s.verdict, a.emailConfirmed ? s.verdictOk : s.verdictBad]}>
                  <Text style={[s.verdictText, a.emailConfirmed ? s.verdictTextOk : s.verdictTextBad]}>
                    {a.emailConfirmed
                      ? '✓ WORK EMAIL CONFIRMED — they hold that mailbox'
                      : '⚠ WORK EMAIL NOT CONFIRMED — nothing proves they hold it'}
                  </Text>
                </View>

                <Row k="Work email" v={a.workEmail} />
                <Row k="Role" v={a.roleTitle || '—'} />
                {a.hiringFor ? <Row k="Hiring for" v={a.hiringFor} /> : null}
                <Row k="Email at company domain" v={a.emailMatchesSite ? 'yes' : 'NO'} bad={!a.emailMatchesSite} />
                <Row k="Consumer mailbox" v={a.freeMail ? 'YES' : 'no'} bad={a.freeMail} />
                <Row k="Domain resolves" v={a.domainResolves ? 'yes' : 'NO'} bad={!a.domainResolves} />
                <Row k="Site answers" v={a.siteReachable ? 'yes' : 'NO'} bad={!a.siteReachable} />

                {a.queueReasons.length ? (
                  <Text style={s.reasons}>Queued because: {a.queueReasons.join(' · ')}</Text>
                ) : null}

                <View style={s.actions}>
                  <Pressable
                    onPress={() => decide(a, 'approve')}
                    disabled={busy === a.id}
                    style={[s.btn, s.btnOk, busy === a.id && s.btnOff]}
                    accessibilityRole="button"
                    accessibilityLabel={`Approve ${a.companyName}`}
                  >
                    <Text style={s.btnOkText}>APPROVE</Text>
                  </Pressable>
                  <Pressable
                    onPress={() => decide(a, 'reject')}
                    disabled={busy === a.id}
                    style={[s.btn, s.btnNo, busy === a.id && s.btnOff]}
                    accessibilityRole="button"
                    accessibilityLabel={`Reject ${a.companyName}`}
                  >
                    <Text style={s.btnNoText}>REJECT</Text>
                  </Pressable>
                </View>
              </View>
            ))
          : null}

        {!loading && tab === 'active' && active?.length === 0 ? (
          <Text style={s.muted}>No employer accounts yet.</Text>
        ) : null}

        {!loading && tab === 'active'
          ? active?.map((e) => (
              <View key={e.userId} style={s.card}>
                <Text style={s.company}>{e.companyName}</Text>
                <Text style={s.sub}>{e.companyWebsite}</Text>
                <Text style={[s.status, e.revokedAt ? s.statusOff : s.statusOn]}>
                  {e.revokedAt ? 'REVOKED' : 'ACTIVE'}
                </Text>
                <View style={s.actions}>
                  <Pressable
                    onPress={() => toggleRevoke(e)}
                    disabled={busy === e.userId}
                    style={[s.btn, e.revokedAt ? s.btnOk : s.btnNo, busy === e.userId && s.btnOff]}
                    accessibilityRole="button"
                    accessibilityLabel={`${e.revokedAt ? 'Restore' : 'Revoke'} ${e.companyName}`}
                  >
                    <Text style={e.revokedAt ? s.btnOkText : s.btnNoText}>
                      {e.revokedAt ? 'RESTORE' : 'REVOKE'}
                    </Text>
                  </Pressable>
                </View>
              </View>
            ))
          : null}
      </ScrollView>
    </View>
  );
}

function Row({ k, v, bad }: { k: string; v: string; bad?: boolean }) {
  return (
    <View style={s.row}>
      <Text style={s.rowK}>{k}</Text>
      <Text style={[s.rowV, bad && s.rowBad]}>{v}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.screenBg },
  head: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14, paddingBottom: 8 },
  back: { fontFamily: fonts.oswaldSemiBold, fontSize: 26, color: colors.amber, paddingHorizontal: 4, paddingVertical: 6 },
  kicker: { fontFamily: fonts.oswaldSemiBold, fontSize: 11, letterSpacing: 1.3, color: colors.textMuted },
  title: { fontFamily: fonts.oswaldSemiBold, fontSize: 20, color: colors.textPrimary },

  tabs: { flexDirection: 'row', gap: 8, paddingHorizontal: 14, paddingBottom: 10 },
  tab: { flex: 1, borderWidth: 1, borderColor: colors.hairline, borderRadius: 8, paddingVertical: 10, alignItems: 'center', minHeight: 44, justifyContent: 'center' },
  tabOn: { borderColor: colors.amber, backgroundColor: 'rgba(255,198,77,.10)' },
  tabText: { fontFamily: fonts.oswaldSemiBold, fontSize: 11.5, letterSpacing: 0.9, color: colors.textSub },
  tabTextOn: { color: colors.amber },

  body: { padding: 14, paddingBottom: 40, gap: 12 },
  muted: { fontFamily: fonts.barlowRegular, fontSize: 14, color: colors.textSub },

  warn: { borderLeftWidth: 3, borderLeftColor: colors.red, backgroundColor: 'rgba(255,75,58,.08)', borderRadius: 6, padding: 12, gap: 8 },
  warnText: { fontFamily: fonts.barlowRegular, fontSize: 13.5, color: colors.textSecondary },
  retry: { fontFamily: fonts.oswaldSemiBold, fontSize: 12.5, letterSpacing: 1, color: colors.amber, paddingVertical: 8 },

  card: { borderWidth: 1, borderColor: colors.hairline, borderRadius: 11, backgroundColor: '#101013', padding: 14, gap: 4 },
  company: { fontFamily: fonts.oswaldSemiBold, fontSize: 17, color: colors.textPrimary },
  sub: { fontFamily: fonts.mono, fontSize: 11.5, color: colors.textMuted, marginBottom: 6 },

  verdict: { borderRadius: 7, paddingHorizontal: 10, paddingVertical: 8, marginBottom: 6 },
  verdictOk: { backgroundColor: 'rgba(55,224,95,.10)', borderWidth: 1, borderColor: 'rgba(55,224,95,.45)' },
  verdictBad: { backgroundColor: 'rgba(255,75,58,.10)', borderWidth: 1, borderColor: 'rgba(255,75,58,.5)' },
  verdictText: { fontFamily: fonts.barlowMedium, fontSize: 12.5, lineHeight: 18 },
  verdictTextOk: { color: colors.green },
  verdictTextBad: { color: colors.red },

  row: { flexDirection: 'row', justifyContent: 'space-between', gap: 12, paddingVertical: 2 },
  rowK: { fontFamily: fonts.barlowRegular, fontSize: 13, color: colors.textSub, flex: 1 },
  rowV: { fontFamily: fonts.barlowMedium, fontSize: 13, color: colors.textPrimary },
  rowBad: { color: colors.amber },

  reasons: { fontFamily: fonts.barlowRegular, fontSize: 12.5, color: colors.amber, marginTop: 8 },

  status: { fontFamily: fonts.oswaldSemiBold, fontSize: 12, letterSpacing: 1, marginTop: 4 },
  statusOn: { color: colors.green },
  statusOff: { color: colors.red },

  actions: { flexDirection: 'row', gap: 10, marginTop: 12 },
  btn: { flex: 1, borderRadius: 9, borderWidth: 1.5, paddingVertical: 11, alignItems: 'center', minHeight: 44, justifyContent: 'center' },
  btnOk: { borderColor: 'rgba(55,224,95,.7)', backgroundColor: 'rgba(55,224,95,.10)' },
  btnNo: { borderColor: 'rgba(255,75,58,.7)', backgroundColor: 'rgba(255,75,58,.10)' },
  btnOff: { opacity: 0.5 },
  btnOkText: { fontFamily: fonts.oswaldSemiBold, fontSize: 12.5, letterSpacing: 1.1, color: colors.green },
  btnNoText: { fontFamily: fonts.oswaldSemiBold, fontSize: 12.5, letterSpacing: 1.1, color: colors.red },
});
