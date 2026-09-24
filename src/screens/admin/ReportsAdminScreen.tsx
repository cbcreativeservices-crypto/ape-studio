/**
 * ABUSE REPORTS — the moderation queue (owner 2026-09-19).
 *
 * ── WHY THIS EXISTS ─────────────────────────────────────────────────────────
 *
 * `contact_report()` wrote a row and that was the end of it. `contact_reports`
 * had an admin RLS policy and ZERO grants, so the policy was inert — the GRANT
 * refuses before a policy is ever consulted — and no admin could read a report
 * from any client at all. Every report anyone filed went into a hole.
 *
 * There was also nothing to DO about one: no suspend, no ban, no removal.
 * Apple guideline 1.2 wants report + block + eject together for user-to-user
 * content, and this app declares messaging to both stores. We had one of three.
 *
 * ── HOW TO READ A ROW ───────────────────────────────────────────────────────
 *
 * PRIOR REPORTS is the signal. One angry exchange looks identical to a pattern
 * until you know whether four other people have said the same thing, so it is
 * given its own line rather than buried.
 *
 * ── SECURITY ────────────────────────────────────────────────────────────────
 *
 * Nothing here enforces anything. Every RPC re-checks `is_admin()` in the
 * database and refuses with "not permitted" — verified by calling them as
 * `authenticated`. Hiding this screen is a courtesy, not a control.
 */
import { useCallback, useEffect, useState } from 'react';
import { BACK_HIT_SLOP } from '../../components/backHitSlop';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { colors, fonts } from '../../theme/tokens';
import { confirmDialog, notify } from '../../lib/confirm';
import {
  fetchReportMessages,
  fetchReportQueue,
  resolveReport,
  setAccountStanding,
  type AccountStatus,
  type ReportMessage,
  type ReportRow,
} from '../../features/moderation/api';

/** Suspension lengths offered. A free-text date picker invites typos. */
const SUSPEND_DAYS = [7, 30] as const;

export function ReportsAdminScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const [tab, setTab] = useState<'open' | 'all'>('open');
  const [rows, setRows] = useState<ReportRow[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [thread, setThread] = useState<{ id: string; msgs: ReportMessage[] | null } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setErr(null);
    const r = await fetchReportQueue(tab);
    // null is a refusal or a dropped connection, NOT an empty queue.
    if (r === null) setErr('Could not load the report queue. Check your connection and try again.');
    setRows(r);
    setLoading(false);
  }, [tab]);

  useEffect(() => {
    void load();
  }, [load]);

  const act = (r: ReportRow, status: AccountStatus, days?: number) => {
    const what =
      status === 'warned' ? 'Warn' :
      status === 'suspended' ? `Suspend for ${days} days` :
      status === 'banned' ? 'Ban' : 'Reinstate';
    const body =
      status === 'banned'
        ? 'Their profile is unpublished immediately and they can no longer contact anyone. Their credentials and existing conversations are KEPT — a ban must not destroy the evidence behind it, or an appeal. They can still sign in and read the reason.'
        : status === 'suspended'
          ? `They cannot contact anyone or appear in the directory until it lifts. It expires on its own after ${days} days; nothing has to be remembered.`
          : status === 'warned'
            ? 'Nothing is blocked. They are told, with the reason.'
            : 'Their account returns to normal and their profile can be published again.';
    confirmDialog(
      `${what} ${r.reportedDisplay}?`,
      body,
      what,
      () => {
        void (async () => {
          setBusy(r.id);
          const res = await setAccountStanding({
            userId: r.reportedUser,
            status,
            until: days ? new Date(Date.now() + days * 86400_000).toISOString() : null,
            reason: r.reason,
            publicNote: null,
            privateNote: r.detail ?? null,
            reportIds: [r.id],
          });
          setBusy(null);
          if (!res.ok) {
            notify('Could not save', res.error);
            return;
          }
          await load();
        })();
      },
      { destructive: status === 'banned' || status === 'suspended' },
    );
  };

  const dismiss = (r: ReportRow) => {
    confirmDialog(
      'Dismiss this report?',
      'It is kept on the record and still counts toward this member’s prior-report total. No action is taken against them.',
      'Dismiss',
      () => {
        void (async () => {
          setBusy(r.id);
          const res = await resolveReport(r.id, 'dismissed');
          setBusy(null);
          if (!res.ok) {
            notify('Could not save', res.error);
            return;
          }
          await load();
        })();
      },
    );
  };

  const openThread = (r: ReportRow) => {
    void (async () => {
      setThread({ id: r.id, msgs: null });
      setThread({ id: r.id, msgs: await fetchReportMessages(r.id) });
    })();
  };

  return (
    <View style={[s.root, { paddingTop: insets.top + 8 }]}>
      <View style={s.head}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={BACK_HIT_SLOP} accessibilityRole="button" accessibilityLabel="Back">
          <Text style={s.back}>‹</Text>
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={s.kicker}>ADMIN</Text>
          <Text accessibilityRole="header" style={s.title}>
            Abuse reports
          </Text>
        </View>
      </View>

      <View style={s.tabs}>
        {(['open', 'all'] as const).map((t) => (
          <Pressable
            key={t}
            onPress={() => setTab(t)}
            hitSlop={8}
            style={[s.tab, tab === t && s.tabOn]}
            accessibilityRole="tab"
            accessibilityState={{ selected: tab === t }}
            accessibilityLabel={t === 'open' ? 'Open reports' : 'All reports'}
          >
            <Text style={[s.tabText, tab === t && s.tabTextOn]}>
              {t === 'open' ? `OPEN${rows && tab === 'open' ? ` (${rows.length})` : ''}` : 'ALL'}
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
        {!loading && !err && rows?.length === 0 ? (
          <Text style={s.muted}>{tab === 'open' ? 'No reports are waiting.' : 'No reports have ever been filed.'}</Text>
        ) : null}

        {!loading &&
          rows?.map((r) => (
            <View key={r.id} style={s.card}>
              <View style={s.rowTop}>
                <Text style={s.reason}>{r.reason.toUpperCase()}</Text>
                <Text style={[s.status, r.status === 'open' ? s.statusOpen : s.statusDone]}>
                  {r.status.toUpperCase()}
                </Text>
              </View>

              <Text style={s.who}>
                {r.reportedDisplay}
                {r.reportedStatus !== 'active' ? (
                  <Text style={s.standing}> · {r.reportedStatus.toUpperCase()}</Text>
                ) : null}
              </Text>
              <Text style={s.sub}>reported by {r.reporterDisplay}</Text>

              {/* The triage signal, given its own line. One bad exchange and a
                  pattern look identical until you know this number. */}
              <Text style={[s.prior, r.priorReports > 0 && s.priorHot]}>
                {r.priorReports === 0
                  ? 'First report against this member'
                  : `${r.priorReports} other report${r.priorReports === 1 ? '' : 's'} against this member`}
              </Text>

              {r.detail ? <Text style={s.detail}>“{r.detail}”</Text> : null}

              {thread?.id === r.id ? (
                <View style={s.thread}>
                  {thread.msgs === null ? (
                    <Text style={s.muted}>Loading the conversation…</Text>
                  ) : thread.msgs.length === 0 ? (
                    <Text style={s.muted}>No messages — this report is not about a conversation.</Text>
                  ) : (
                    thread.msgs.map((m, i) => (
                      <Text key={i} style={[s.msg, m.senderIsReported && s.msgReported]}>
                        {m.senderIsReported ? '▸ ' : '  '}
                        {m.body}
                      </Text>
                    ))
                  )}
                </View>
              ) : r.requestId ? (
                <Pressable onPress={() => openThread(r)} hitSlop={8} accessibilityRole="button" accessibilityLabel="Read the conversation">
                  <Text style={s.link}>READ THE CONVERSATION</Text>
                </Pressable>
              ) : null}

              {r.status === 'open' ? (
                <View style={s.actions}>
                  <Btn label="WARN" tone="warn" disabled={busy === r.id} onPress={() => act(r, 'warned')} a11y={`Warn ${r.reportedDisplay}`} />
                  {SUSPEND_DAYS.map((d) => (
                    <Btn key={d} label={`${d}D`} tone="warn" disabled={busy === r.id} onPress={() => act(r, 'suspended', d)} a11y={`Suspend ${r.reportedDisplay} for ${d} days`} />
                  ))}
                  <Btn label="BAN" tone="bad" disabled={busy === r.id} onPress={() => act(r, 'banned')} a11y={`Ban ${r.reportedDisplay}`} />
                  <Btn label="DISMISS" tone="plain" disabled={busy === r.id} onPress={() => dismiss(r)} a11y="Dismiss this report" />
                </View>
              ) : r.reportedStatus !== 'active' ? (
                <View style={s.actions}>
                  <Btn label="REINSTATE" tone="ok" disabled={busy === r.id} onPress={() => act(r, 'active')} a11y={`Reinstate ${r.reportedDisplay}`} />
                </View>
              ) : null}
            </View>
          ))}
      </ScrollView>
    </View>
  );
}

function Btn({
  label, tone, disabled, onPress, a11y,
}: {
  label: string;
  tone: 'ok' | 'warn' | 'bad' | 'plain';
  disabled?: boolean;
  onPress: () => void;
  a11y: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={[s.btn, TONE[tone].box, disabled && s.btnOff]}
      accessibilityRole="button"
      accessibilityLabel={a11y}
    >
      <Text style={[s.btnText, TONE[tone].text]}>{label}</Text>
    </Pressable>
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

  card: { borderWidth: 1, borderColor: colors.hairline, borderRadius: 11, backgroundColor: '#101013', padding: 14, gap: 3 },
  rowTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  reason: { fontFamily: fonts.oswaldSemiBold, fontSize: 12.5, letterSpacing: 1, color: colors.amber },
  status: { fontFamily: fonts.oswaldSemiBold, fontSize: 10.5, letterSpacing: 1 },
  statusOpen: { color: colors.red },
  statusDone: { color: colors.textMuted },

  who: { fontFamily: fonts.oswaldSemiBold, fontSize: 16.5, color: colors.textPrimary, marginTop: 4 },
  standing: { fontFamily: fonts.oswaldSemiBold, fontSize: 12, color: colors.red },
  sub: { fontFamily: fonts.barlowRegular, fontSize: 12.5, color: colors.textSub },
  prior: { fontFamily: fonts.barlowMedium, fontSize: 12.5, color: colors.textSub, marginTop: 6 },
  priorHot: { color: colors.red },
  detail: { fontFamily: fonts.barlowRegular, fontSize: 13.5, color: colors.textSecondary, marginTop: 6, fontStyle: 'italic' },

  link: { fontFamily: fonts.oswaldSemiBold, fontSize: 11.5, letterSpacing: 1, color: colors.amber, paddingVertical: 10, marginTop: 4 },
  thread: { borderLeftWidth: 2, borderLeftColor: colors.hairline, paddingLeft: 10, gap: 5, marginTop: 8 },
  msg: { fontFamily: fonts.barlowRegular, fontSize: 12.5, color: colors.textSub },
  msgReported: { color: colors.textPrimary },

  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  btn: { borderRadius: 8, borderWidth: 1.5, paddingHorizontal: 12, paddingVertical: 10, minHeight: 44, justifyContent: 'center' },
  btnOff: { opacity: 0.5 },
  btnText: { fontFamily: fonts.oswaldSemiBold, fontSize: 12, letterSpacing: 1 },
  // Button tones. Named apart from the banner's `warn`/`warnText` above —
  // indexing styles by a prop name collided with them and silently picked the
  // wrong style.
  btnOk: { borderColor: 'rgba(55,224,95,.7)', backgroundColor: 'rgba(55,224,95,.10)' },
  btnOkText: { color: colors.green },
  btnWarn: { borderColor: 'rgba(255,198,77,.7)', backgroundColor: 'rgba(255,198,77,.10)' },
  btnWarnText: { color: colors.amber },
  btnBad: { borderColor: 'rgba(255,75,58,.7)', backgroundColor: 'rgba(255,75,58,.10)' },
  btnBadText: { color: colors.red },
  btnPlain: { borderColor: colors.hairline },
  btnPlainText: { color: colors.textSub },
});

const TONE = {
  ok: { box: s.btnOk, text: s.btnOkText },
  warn: { box: s.btnWarn, text: s.btnWarnText },
  bad: { box: s.btnBad, text: s.btnBadText },
  plain: { box: s.btnPlain, text: s.btnPlainText },
} as const;
