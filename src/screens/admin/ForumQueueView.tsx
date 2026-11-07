/**
 * The owner's forum queue, inside Abuse reports: what Claude held or hid, the
 * appeals, and the status of tracked topics.
 *
 * Nothing here enforces anything: every forum_admin_* function re-checks
 * `is_admin()` in the database. A refused read says so, on its own face, and is
 * never an empty queue.
 *
 * Child-safety items never show their text here, by design. Suspend and Ban use
 * the same account_set_standing as the rest of this screen, each behind a
 * question, and only the owner's hand: the AI never confirms a ban.
 */
import { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { confirmDialog, notify } from '../../lib/confirm';
import { useLatchedPress } from '../../lib/latch';
import { fonts } from '../../theme/tokens';
import {
  actOnPost,
  actOnUser,
  decideAppeal,
  decideQueueItem,
  fetchAiUsage,
  fetchAppeals,
  fetchQueue,
  fetchTracked,
  setMemberStanding,
  setTopicFlags,
  setTrackedStatus,
  type AdminAppeal,
  type AiUsage,
  type PostAction,
  type QueueDecision,
  type QueueItem,
  type UserAction,
} from '../../features/forum/adminApi';
import {
  aiUsageLine,
  queueOffers,
  queueWords,
  ruleLabel,
  timeAgo,
  trackedChoices,
  trackedFace,
  trackedProblem,
  urgentLabel,
} from '../../features/forum/rules';
import type { ForumTopic, TrackedStatus } from '../../features/forum/types';
import { useForumRead } from '../../features/forum/useForumRead';
import { useSendingPer } from '../directory/directoryBits';
import {
  AmberButton,
  F,
  ForumLoading,
  MenuPopup,
  Popup,
  PopupScroll,
  QuietButton,
  SampleStamp,
  StaleNote,
  StatusStamp,
  type MenuItem,
} from '../directory/forum/forumBits';

type Section = 'queue' | 'appeals' | 'tracked';
type Nav = { navigate: (route: string, params?: Record<string, unknown>) => void };

const SECTIONS: { key: Section; label: string }[] = [
  { key: 'queue', label: 'QUEUE' },
  { key: 'appeals', label: 'APPEALS' },
  { key: 'tracked', label: 'TRACKED' },
];

export function ForumQueueView() {
  const [section, setSection] = useState<Section>('queue');
  const usage = useForumRead<AiUsage | null>(fetchAiUsage, []);
  return (
    <ScrollView contentContainerStyle={st.body} keyboardShouldPersistTaps="handled">
      <SampleStamp />
      <Text style={st.usage}>
        AI this month: {usage.face === 'ready' ? aiUsageLine(usage.value) : usage.face === 'loading' ? '…' : 'could not be read'}
      </Text>
      {usage.value?.capHitAt ? <Text style={st.usageHot}>The cap was reached. New posts are being held.</Text> : null}
      <View style={st.tabs} accessibilityRole="tablist">
        {SECTIONS.map((s) => (
          <Pressable
            key={s.key}
            onPress={() => setSection(s.key)}
            hitSlop={6}
            style={[st.tab, section === s.key && st.tabOn]}
            accessibilityRole="tab"
            accessibilityState={{ selected: section === s.key }}
            aria-selected={section === s.key}
          >
            <Text style={[st.tabText, section === s.key && st.tabTextOn]}>{s.label}</Text>
          </Pressable>
        ))}
      </View>
      {section === 'queue' ? <QueueList /> : section === 'appeals' ? <AppealList /> : <TrackedList />}
    </ScrollView>
  );
}

/** A read that failed or was refused: never "nothing waiting". */
function Failed({ error, onRetry }: { error: string | null; onRetry: () => void }) {
  return (
    <View style={st.warn}>
      <Text style={st.warnText}>{error}</Text>
      <Pressable onPress={onRetry} hitSlop={8} accessibilityRole="button" accessibilityLabel="Retry">
        <Text style={st.retry}>RETRY</Text>
      </Pressable>
    </View>
  );
}

function Act({
  label,
  onPress,
  danger,
  disabled,
}: {
  label: string;
  onPress: () => void;
  danger?: boolean;
  disabled?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={[st.act, danger && st.actDanger, disabled && st.off]}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: !!disabled }}
      aria-disabled={!!disabled}
    >
      <Text style={[st.actText, danger && st.actTextDanger]}>{label}</Text>
    </Pressable>
  );
}

/* ── Queue ───────────────────────────────────────────────────────────── */

const SUSPEND_DAYS = [7, 30];

function QueueList() {
  const navigation = useNavigation() as unknown as Nav;
  const read = useForumRead<QueueItem[]>(fetchQueue, []);
  const [busy, run] = useSendingPer();
  const [memberOf, setMemberOf] = useState<QueueItem | null>(null);

  const done = useCallback((logId: number) => read.patch((rows) => rows.filter((r) => r.logId !== logId)), [read]);

  const decide = useCallback(
    (item: QueueItem, decision: QueueDecision, note?: string) => {
      run(String(item.logId), async () => {
        const r = await decideQueueItem(item.logId, decision, note);
        if (r.ok) done(item.logId);
        else notify('Not saved', r.error);
      });
    },
    [done, run],
  );

  const onPost = useCallback(
    (item: QueueItem, action: PostAction) => {
      const postId = item.postId;
      if (!postId) return;
      run(String(item.logId), async () => {
        const r = await actOnPost(postId, action);
        if (!r.ok) {
          notify('Not saved', r.error);
          return;
        }
        const d = await decideQueueItem(item.logId, 'noted', action);
        if (d.ok) done(item.logId);
        else notify('Done, but still listed', d.error);
      });
    },
    [done, run],
  );

  const onUser = useCallback(
    (item: QueueItem, action: UserAction, hours: number) => {
      const user = item.targetUser;
      if (!user) return;
      run(String(item.logId), async () => {
        const r = await actOnUser(user, action, hours, item.rule ?? undefined);
        if (r.ok) notify('Saved', action === 'warn' ? 'The member was warned.' : action === 'mute' ? `Muted for ${hours} hours.` : 'The mute was lifted.');
        else notify('Not saved', r.error);
      });
    },
    [run],
  );

  const stand = useCallback(
    (item: QueueItem, status: 'suspended' | 'banned', days?: number) => {
      const user = item.targetUser;
      if (!user) return;
      const what = status === 'banned' ? 'Ban' : `Suspend for ${days} days`;
      confirmDialog(
        `${what} ${item.author?.name ?? 'this member'}?`,
        status === 'banned'
          ? 'Their profile is unpublished at once and they can no longer post or contact anyone.'
          : `They cannot post or contact anyone until it lifts, after ${days} days.`,
        what,
        () => {
          run(String(item.logId), async () => {
            const r = await setMemberStanding(user, status, days, item.rule ?? 'forum');
            if (!r.ok) {
              notify('Not saved', r.error);
              return;
            }
            const d = await decideQueueItem(item.logId, status);
            if (d.ok) done(item.logId);
            else notify('Done, but still listed', d.error);
          });
        },
        { destructive: true },
      );
    },
    [done, run],
  );

  const memberItems: MenuItem[] = memberOf
    ? [
        { key: 'warn', label: 'Warn', note: 'They see a notice with the rule', onPress: () => onUser(memberOf, 'warn', 0) },
        { key: 'mute', label: 'Mute for 24 hours', note: 'They can read but not post', onPress: () => onUser(memberOf, 'mute', 24) },
        { key: 'unmute', label: 'Lift a mute', onPress: () => onUser(memberOf, 'unmute', 0) },
        ...SUSPEND_DAYS.map((d) => ({
          key: `s${d}`,
          label: `Suspend for ${d} days`,
          danger: true,
          onPress: () => stand(memberOf, 'suspended', d),
        })),
        { key: 'ban', label: 'Ban', danger: true, onPress: () => stand(memberOf, 'banned') },
      ]
    : [];

  if (read.face === 'loading') return <ForumLoading label="Loading the queue…" />;
  if (read.face === 'unreadable' || !read.value) return <Failed error={read.error} onRetry={() => void read.reload()} />;
  if (read.value.length === 0) return <Text style={st.muted}>Nothing is waiting for you.</Text>;

  return (
    <>
      {read.stale ? <StaleNote /> : null}
      {read.value.map((item) => {
        const urgent = urgentLabel(item.urgentCategory);
        const child = item.urgentCategory === 'child_safety';
        const rule = ruleLabel(item.rule);
        const key = String(item.logId);
        const off = busy(key);
        const offers = queueOffers(item);
        const destroy = () =>
          confirmDialog('Delete this post?', 'It is gone for everyone. The text stays as evidence.', 'DELETE', () => decide(item, 'delete'), {
            destructive: true,
          });
        return (
          <View key={item.logId} style={[st.card, urgent && st.cardUrgent]}>
            <View style={st.rowTop}>
              <Text style={[st.head, urgent && st.headUrgent]}>{urgent ?? `${queueWords(item.mode)} · ${queueWords(item.action)}`.toUpperCase()}</Text>
              <Text style={st.when}>{timeAgo(item.createdAt)}</Text>
            </View>
            {item.author ? <Text style={st.who}>{item.author.name}</Text> : null}
            {item.topicTitle ? (
              <Pressable
                onPress={() => item.topicId && navigation.navigate('ForumThread', { topicId: item.topicId })}
                accessibilityRole="button"
                accessibilityLabel={`Open ${item.topicTitle}`}
              >
                <Text style={st.topic}>{item.topicTitle} ›</Text>
              </Pressable>
            ) : null}
            {child ? (
              <Text style={st.child}>The text is preserved and not shown here. Report as the law requires.</Text>
            ) : item.postBody || item.excerpt ? (
              <Text style={st.ex}>{item.postBody ?? item.excerpt}</Text>
            ) : null}
            {rule ? <Text style={st.meta}>{rule}</Text> : null}
            {item.reason ? <Text style={st.meta}>{item.reason}</Text> : null}
            {item.recommendation ? <Text style={st.rec}>Suggested: {queueWords(item.recommendation)}</Text> : null}
            {item.openReports > 0 ? (
              <Text style={st.reports}>
                {item.openReports === 1 ? '1 open report' : `${item.openReports} open reports`}
              </Text>
            ) : null}
            <View style={st.acts}>
              <Act label="DISMISS" onPress={() => decide(item, 'dismiss')} disabled={off} />
              <Act label="CONFIRM" onPress={() => decide(item, 'confirm')} disabled={off} />
              {offers.restore ? <Act label="RESTORE" onPress={() => decide(item, 'restore')} disabled={off} /> : null}
              {offers.hide ? <Act label="HIDE" onPress={() => decide(item, 'hide')} disabled={off} /> : null}
              {offers.pleaseEdit ? <Act label="PLEASE EDIT" onPress={() => onPost(item, 'please_edit')} disabled={off} /> : null}
              {offers.delete ? <Act label="DELETE" onPress={destroy} disabled={off} danger /> : null}
              {item.targetUser ? <Act label="MEMBER ›" onPress={() => setMemberOf(item)} disabled={off} /> : null}
            </View>
          </View>
        );
      })}
      <MenuPopup visible={!!memberOf} onClose={() => setMemberOf(null)} items={memberItems} />
    </>
  );
}

/* ── Appeals ─────────────────────────────────────────────────────────── */

function AppealList() {
  const read = useForumRead<AdminAppeal[]>(fetchAppeals, []);
  const [deciding, setDeciding] = useState<{ appeal: AdminAppeal; outcome: 'upheld' | 'overturned' } | null>(null);
  const [note, setNote] = useState('');
  const [error, setError] = useState<string | null>(null);

  const open = (appeal: AdminAppeal, outcome: 'upheld' | 'overturned') => {
    setNote('');
    setError(null);
    setDeciding({ appeal, outcome });
  };
  const save = useLatchedPress(async () => {
    if (!deciding) return;
    const r = await decideAppeal(deciding.appeal.appealId, deciding.outcome, note.trim() || undefined);
    if (!r.ok) {
      setError(r.error);
      return;
    }
    read.patch((rows) => rows.filter((a) => a.appealId !== deciding.appeal.appealId));
    setDeciding(null);
  });

  if (read.face === 'loading') return <ForumLoading label="Loading appeals…" />;
  if (read.face === 'unreadable' || !read.value) return <Failed error={read.error} onRetry={() => void read.reload()} />;
  if (read.value.length === 0) return <Text style={st.muted}>No appeals are waiting.</Text>;

  return (
    <>
      {read.value.map((a) => (
        <View key={a.appealId} style={st.card}>
          <View style={st.rowTop}>
            <Text style={st.head}>{ruleLabel(a.modRule) ?? 'APPEAL'}</Text>
            <Text style={st.when}>{timeAgo(a.createdAt)}</Text>
          </View>
          {a.member ? <Text style={st.who}>{a.member.name}</Text> : null}
          {a.postBody ? <Text style={st.ex}>{a.postBody}</Text> : null}
          {a.modReason ? <Text style={st.meta}>Removed because: {a.modReason}</Text> : null}
          <Text style={st.appeal}>Their appeal: {a.reason}</Text>
          {a.recommendation ? <Text style={st.rec}>Suggested: {a.recommendation}</Text> : null}
          <View style={st.acts}>
            <Act label="OVERTURN" onPress={() => open(a, 'overturned')} />
            <Act label="UPHOLD" onPress={() => open(a, 'upheld')} />
          </View>
        </View>
      ))}
      <Popup visible={!!deciding} onClose={() => setDeciding(null)} label="Decide this appeal">
        <View style={st.popup}>
          <PopupScroll>
            <Text accessibilityRole="header" style={st.popupTitle}>
              {deciding?.outcome === 'overturned' ? 'Overturn and restore the post' : 'Uphold the decision'}
            </Text>
            <Text style={st.popupLead}>The member gets a notice with these words.</Text>
            <TextInput
              value={note}
              onChangeText={setNote}
              multiline
              maxLength={1000}
              style={st.input}
              placeholder="A short note (optional)"
              placeholderTextColor={F.muted}
              accessibilityLabel="A short note"
              textAlignVertical="top"
            />
            {error ? <Text style={st.error}>{error}</Text> : null}
            <View style={st.popupButtons}>
              <QuietButton label="CANCEL" onPress={() => setDeciding(null)} />
              <AmberButton label="SAVE" onPress={save} style={st.grow} />
            </View>
          </PopupScroll>
        </View>
      </Popup>
    </>
  );
}

/* ── Tracked topics ──────────────────────────────────────────────────── */

const STATUS_WORD: Record<TrackedStatus, string> = {
  under_review: 'Under review',
  planned: 'Planned',
  in_progress: 'In progress',
  shipped: 'Shipped',
  declined: 'Declined',
  accepted: 'Accepted',
};

function TrackedList() {
  const read = useForumRead<ForumTopic[]>(fetchTracked, []);
  const [topic, setTopic] = useState<ForumTopic | null>(null);
  const [status, setStatus] = useState<TrackedStatus>('under_review');
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);

  const open = (t: ForumTopic) => {
    setTopic(t);
    setStatus(t.trackedStatus ?? 'under_review');
    setReason('');
    setError(null);
  };
  const problem = trackedProblem(status, reason);
  const save = useLatchedPress(async () => {
    if (!topic || problem) return;
    const r = await setTrackedStatus(topic.id, status, reason.trim() || undefined);
    if (!r.ok) {
      setError(r.error);
      return;
    }
    read.patch((rows) => rows.map((t) => (t.id === topic.id ? { ...t, trackedStatus: status } : t)));
    setTopic(null);
  });
  const flag = useLatchedPress(async (flags: { pinned?: boolean; locked?: boolean }) => {
    if (!topic) return;
    const r = await setTopicFlags(topic.id, flags);
    if (!r.ok) {
      setError(r.error);
      return;
    }
    read.patch((rows) => rows.map((t) => (t.id === topic.id ? { ...t, ...flags } : t)));
    setTopic((t) => (t ? { ...t, ...flags } : t));
  });

  if (read.face === 'loading') return <ForumLoading label="Loading tracked topics…" />;
  if (read.face === 'unreadable' || !read.value) return <Failed error={read.error} onRetry={() => void read.reload()} />;
  if (read.value.length === 0) return <Text style={st.muted}>No ideas, corrections or bug reports yet.</Text>;

  return (
    <>
      {read.value.map((t) => {
        const face = trackedFace(t.trackedStatus);
        return (
          <Pressable
            key={t.id}
            onPress={() => open(t)}
            style={({ pressed }) => [st.card, pressed && st.pressed]}
            accessibilityRole="button"
            accessibilityLabel={`Set the status of ${t.title}`}
          >
            <Text style={st.topicPlain}>{t.title}</Text>
            <View style={st.trackRow}>
              {face ? <StatusStamp tone={face.tone}>{face.stamp}</StatusStamp> : null}
              <Text style={st.when}>{t.categoryName}</Text>
              {t.locked ? <Text style={st.when}>LOCKED</Text> : null}
              {t.pinned ? <Text style={st.when}>PINNED</Text> : null}
            </View>
          </Pressable>
        );
      })}
      <Popup visible={!!topic} onClose={() => setTopic(null)} label="Set the status">
        <View style={st.popup}>
          <PopupScroll>
            <Text accessibilityRole="header" style={st.popupTitle}>
              {topic?.title}
            </Text>
            <View style={st.choices}>
              {topic
                ? trackedChoices(topic.topicKind).map((s) => (
                    <Pressable
                      key={s}
                      onPress={() => setStatus(s)}
                      style={[st.choice, status === s && st.choiceOn]}
                      accessibilityRole="radio"
                      accessibilityState={{ selected: status === s }}
                      aria-checked={status === s}
                    >
                      <Text style={[st.choiceText, status === s && st.choiceTextOn]}>{STATUS_WORD[s]}</Text>
                    </Pressable>
                  ))
                : null}
            </View>
            <TextInput
              value={reason}
              onChangeText={setReason}
              multiline
              maxLength={1000}
              style={st.input}
              placeholder="Reason. For shipped, start with the version: v1.1: Now in Settings."
              placeholderTextColor={F.muted}
              accessibilityLabel="Reason"
              textAlignVertical="top"
            />
            {problem ? <Text style={st.meta}>{problem}</Text> : null}
            {error ? <Text style={st.error}>{error}</Text> : null}
            <View style={st.acts}>
              <Act label={topic?.pinned ? 'UNPIN' : 'PIN'} onPress={() => flag({ pinned: !topic?.pinned })} />
              <Act label={topic?.locked ? 'UNLOCK' : 'LOCK'} onPress={() => flag({ locked: !topic?.locked })} />
            </View>
            <View style={st.popupButtons}>
              <QuietButton label="CANCEL" onPress={() => setTopic(null)} />
              <AmberButton label="SAVE" onPress={save} disabled={!!problem} style={st.grow} />
            </View>
          </PopupScroll>
        </View>
      </Popup>
    </>
  );
}

const st = StyleSheet.create({
  pressed: { opacity: 0.7 },
  off: { opacity: 0.5 },
  body: { paddingHorizontal: 16, paddingBottom: 40 },
  usage: { fontFamily: fonts.mono, fontSize: 11, color: F.sub, marginBottom: 4 },
  usageHot: { fontFamily: fonts.barlowSemiBold, fontSize: 13, color: F.red, marginBottom: 4 },
  tabs: { flexDirection: 'row', gap: 6, marginTop: 8, marginBottom: 12 },
  tab: { borderWidth: 1, borderColor: F.line2, borderRadius: 999, paddingVertical: 6, paddingHorizontal: 12 },
  tabOn: { backgroundColor: F.amber, borderColor: F.amber },
  tabText: { fontFamily: fonts.oswaldMedium, fontSize: 11.5, letterSpacing: 1.1, color: F.sub },
  tabTextOn: { color: '#111' },
  muted: { fontFamily: fonts.barlowRegular, fontSize: 13.5, color: F.muted, paddingVertical: 16 },
  warn: { borderWidth: 1, borderColor: 'rgba(255,198,77,.45)', borderRadius: 12, padding: 12, gap: 8 },
  warnText: { fontFamily: fonts.barlowRegular, fontSize: 13.5, lineHeight: 19, color: F.amber },
  retry: { fontFamily: fonts.oswaldMedium, fontSize: 12, letterSpacing: 1.2, color: F.amber },
  card: { backgroundColor: F.panel, borderWidth: 1, borderColor: F.line, borderRadius: 14, padding: 12, marginBottom: 10 },
  cardUrgent: { borderColor: 'rgba(255,90,72,.6)' },
  rowTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  head: { flexShrink: 1, fontFamily: fonts.oswaldMedium, fontSize: 12, letterSpacing: 1.3, color: F.amber },
  headUrgent: { color: F.red },
  when: { fontFamily: fonts.mono, fontSize: 10, color: F.muted },
  who: { fontFamily: fonts.oswaldSemiBold, fontSize: 14, color: F.text, marginTop: 6 },
  topic: { fontFamily: fonts.barlowMedium, fontSize: 13, lineHeight: 18, color: F.amber, marginTop: 3 },
  topicPlain: { fontFamily: fonts.barlowSemiBold, fontSize: 14, lineHeight: 19, color: F.text },
  ex: {
    fontFamily: fonts.barlowItalic,
    fontSize: 13,
    lineHeight: 18,
    color: F.body,
    borderLeftWidth: 2,
    borderLeftColor: F.line2,
    paddingLeft: 8,
    marginTop: 8,
  },
  child: { fontFamily: fonts.barlowSemiBold, fontSize: 13, lineHeight: 18, color: F.red, marginTop: 8 },
  meta: { fontFamily: fonts.barlowRegular, fontSize: 12.5, lineHeight: 17, color: F.sub, marginTop: 6 },
  rec: { fontFamily: fonts.barlowMedium, fontSize: 12.5, lineHeight: 17, color: F.steel, marginTop: 6 },
  reports: { fontFamily: fonts.mono, fontSize: 10.5, color: F.amber, marginTop: 6 },
  appeal: { fontFamily: fonts.barlowMedium, fontSize: 13, lineHeight: 18, color: F.text, marginTop: 8 },
  acts: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 10 },
  act: { minHeight: 32, justifyContent: 'center', paddingHorizontal: 10, borderRadius: 10, borderWidth: 1, borderColor: F.line2 },
  actDanger: { borderColor: 'rgba(255,90,72,.5)' },
  actText: { fontFamily: fonts.oswaldMedium, fontSize: 11.5, letterSpacing: 1, color: F.sub },
  actTextDanger: { color: F.red },
  trackRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8, marginTop: 6 },
  popup: { backgroundColor: F.raised, borderWidth: 1, borderColor: F.line2, borderRadius: 20, padding: 18, flexShrink: 1 },
  popupTitle: { fontFamily: fonts.oswaldSemiBold, fontSize: 17, lineHeight: 22, color: F.text, marginBottom: 6 },
  popupLead: { fontFamily: fonts.barlowRegular, fontSize: 13, lineHeight: 18, color: F.sub, marginBottom: 10 },
  popupButtons: { flexDirection: 'row', gap: 10, marginTop: 14 },
  grow: { flex: 1 },
  input: {
    minHeight: 80,
    backgroundColor: F.panel,
    borderWidth: 1,
    borderColor: F.line2,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    fontFamily: fonts.barlowRegular,
    fontSize: 14,
    color: F.text,
    marginTop: 8,
  },
  error: { fontFamily: fonts.barlowRegular, fontSize: 13, color: F.red, marginTop: 8 },
  choices: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 4 },
  choice: { borderWidth: 1, borderColor: F.line2, borderRadius: 999, paddingVertical: 6, paddingHorizontal: 10 },
  choiceOn: { backgroundColor: F.amberDim, borderColor: 'rgba(255,198,77,.5)' },
  choiceText: { fontFamily: fonts.barlowRegular, fontSize: 12.5, color: F.sub },
  choiceTextOn: { color: F.amber },
});
