/**
 * REQUESTS — incoming and outgoing contact requests, and accepted
 * conversations (spec §2, §8.3).
 *
 * A request carries a PURPOSE that the recipient already agreed to hear about,
 * and a short message. Nothing is a conversation until the recipient accepts.
 * No email address appears anywhere in this screen, in either direction.
 */
import { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, FlatList, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Modal } from '../../components/DimModal';
import { colors, fonts } from '../../theme/tokens';
import { Banner, Chip, ChipWrap, EmptyState, Eyebrow, Helper, Loading, PrimaryButton } from './directoryBits';
import {
  blockMember,
  fetchContactThreads,
  fetchThreadMessages,
  reportMember,
  respondToRequest,
  sendThreadMessage,
  type ContactThread,
  type ReportReason,
  type ThreadMessage,
} from '../../features/directory/api';

const REASONS: { key: ReportReason; label: string }[] = [
  { key: 'spam', label: 'Spam' },
  { key: 'harassment', label: 'Harassment' },
  { key: 'solicitation', label: 'Solicitation' },
  { key: 'impersonation', label: 'Impersonation' },
  { key: 'other', label: 'Something else' },
];

function confirmThen(title: string, body: string, yes: string, onYes: () => void): void {
  if (Platform.OS === 'web') {
    if (typeof window === 'undefined' || window.confirm(`${title}\n\n${body}`)) onYes();
    return;
  }
  Alert.alert(title, body, [
    { text: 'Cancel', style: 'cancel' },
    { text: yes, onPress: onYes },
  ]);
}

const STATUS_LABEL: Record<ContactThread['status'], string> = {
  pending: 'Waiting',
  accepted: 'Open',
  declined: 'Declined',
  withdrawn: 'Withdrawn',
  blocked: 'Closed',
};

type ThreadAction = 'accept' | 'decline' | 'withdraw';

/** One flattened row of the requests list: a section eyebrow or a request card.
 *  INCOMING and SENT always shared one scroller, so they share one FlatList. */
type RequestRow =
  | { kind: 'eyebrow'; key: string; label: string }
  | { kind: 'incoming'; key: string; thread: ContactThread }
  | { kind: 'outgoing'; key: string; thread: ContactThread };

/**
 * An incoming request card. Extracted to module scope and memoized
 * (virtualization pass 2026-09-11): every card carries its own ReportLink —
 * which holds state AND mounts a Modal — so rendering the whole inbox eagerly
 * inside a ScrollView cost one hidden sheet per request. Markup is unchanged.
 */
const IncomingCard = memo(function IncomingCard({
  t,
  onAct,
  onOpen,
  onReload,
  onError,
}: {
  t: ContactThread;
  onAct: (t: ContactThread, action: ThreadAction) => void;
  onOpen: (t: ContactThread) => void;
  onReload: () => Promise<void>;
  onError: (e: string) => void;
}) {
  return (
    <View style={st.card}>
      <Text style={st.name}>{t.otherDisplayName}</Text>
      <Text style={st.purpose}>{t.purposeLabel}</Text>
      <Text style={st.msg}>{t.message}</Text>
      <Text style={st.status}>{STATUS_LABEL[t.status]}</Text>
      {t.status === 'pending' ? (
        <View style={st.row}>
          <PrimaryButton label="ACCEPT" tone="green" onPress={() => onAct(t, 'accept')} />
          <View style={{ width: 8 }} />
          <PrimaryButton label="DECLINE" onPress={() => onAct(t, 'decline')} />
        </View>
      ) : null}
      {t.status === 'accepted' ? (
        <PrimaryButton label={`OPEN CONVERSATION (${t.messageCount})`} onPress={() => onOpen(t)} />
      ) : null}
      <View style={st.row}>
        <Pressable
          onPress={() =>
            confirmThen(
              `Block ${t.otherDisplayName}?`,
              'They will not be able to contact you again, and neither of you will see the other in the directory. Any open conversation closes.',
              'Block',
              () =>
                void blockMember(t.otherToken ?? '', true).then((r) =>
                  r.ok ? onReload() : onError(r.error),
                ),
            )
          }
          hitSlop={6}
          style={st.link}
          accessibilityRole="button"
          accessibilityLabel={`Block ${t.otherDisplayName}`}
        >
          <Text style={st.linkText}>BLOCK</Text>
        </Pressable>
        <ReportLink thread={t} onDone={onReload} onError={onError} />
      </View>
    </View>
  );
});

/** A sent (outgoing) request card. */
const OutgoingCard = memo(function OutgoingCard({
  t,
  onAct,
  onOpen,
}: {
  t: ContactThread;
  onAct: (t: ContactThread, action: ThreadAction) => void;
  onOpen: (t: ContactThread) => void;
}) {
  return (
    <View style={st.card}>
      <Text style={st.name}>{t.otherDisplayName}</Text>
      <Text style={st.purpose}>{t.purposeLabel}</Text>
      <Text style={st.msg}>{t.message}</Text>
      <Text style={st.status}>{STATUS_LABEL[t.status]}</Text>
      {t.status === 'pending' ? (
        <PrimaryButton label="WITHDRAW" onPress={() => onAct(t, 'withdraw')} />
      ) : null}
      {t.status === 'accepted' ? (
        <PrimaryButton label={`OPEN CONVERSATION (${t.messageCount})`} onPress={() => onOpen(t)} />
      ) : null}
    </View>
  );
});

export function RequestsView() {
  const [threads, setThreads] = useState<ContactThread[] | null>(null);
  const [err, setErr] = useState<string | null>(null);
  // [75] (2026-09-07): a FAILED load used to land on "No contact requests yet",
  // hiding real pending requests behind what read as an empty inbox. Loading /
  // error+Retry / empty are now three distinct states.
  const [loadErr, setLoadErr] = useState<string | null>(null);
  const [open, setOpen] = useState<ContactThread | null>(null);

  const load = useCallback(async () => {
    const r = await fetchContactThreads();
    if (!r.ok) {
      setLoadErr(r.error);
      return;
    }
    setLoadErr(null);
    setThreads(r.rows);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const act = useCallback(
    (t: ContactThread, action: ThreadAction) => {
      void respondToRequest(t.id, action).then(async (r) => {
        if (!r.ok) return setErr(r.error);
        setErr(null);
        await load();
      });
    },
    [load],
  );

  const openThread = useCallback((t: ContactThread) => setOpen(t), []);

  // INCOMING then SENT, each behind its eyebrow — the exact order and spacing
  // the ScrollView rendered, flattened so ONE FlatList virtualizes both.
  const rows = useMemo<RequestRow[]>(() => {
    if (!threads) return [];
    const incoming = threads.filter((t) => t.direction === 'incoming');
    const outgoing = threads.filter((t) => t.direction === 'outgoing');
    const out: RequestRow[] = [];
    if (incoming.length) out.push({ kind: 'eyebrow', key: 'eb:in', label: 'INCOMING' });
    for (const t of incoming) out.push({ kind: 'incoming', key: `in:${t.id}`, thread: t });
    if (outgoing.length) out.push({ kind: 'eyebrow', key: 'eb:out', label: 'SENT' });
    for (const t of outgoing) out.push({ kind: 'outgoing', key: `out:${t.id}`, thread: t });
    return out;
  }, [threads]);

  const keyExtractor = useCallback((r: RequestRow) => r.key, []);
  const renderRow = useCallback(
    ({ item }: { item: RequestRow }) => {
      if (item.kind === 'eyebrow') return <Eyebrow>{item.label}</Eyebrow>;
      if (item.kind === 'incoming') {
        return (
          <IncomingCard
            t={item.thread}
            onAct={act}
            onOpen={openThread}
            onReload={load}
            onError={setErr}
          />
        );
      }
      return <OutgoingCard t={item.thread} onAct={act} onOpen={openThread} />;
    },
    [act, openThread, load],
  );

  // Never loaded and the fetch failed → say so and offer a retry (not "none").
  if (threads === null && loadErr) {
    return (
      <ScrollView contentContainerStyle={st.body}>
        <Banner tone="warn">{loadErr}</Banner>
        <PrimaryButton label="RETRY" onPress={() => void load()} />
      </ScrollView>
    );
  }
  if (threads === null) return <Loading label="Loading your requests…" />;

  return (
    <>
      {/* Virtualized 2026-09-11: this was a ScrollView that mounted every
          request card (and every card's hidden report Modal) up front. It is
          the page's own scroller — the Directory screen wraps the tabs in a
          plain View — so the FlatList replaces it outright, with the banners /
          empty state as the header and the privacy note as the footer. */}
      <FlatList
        data={rows}
        keyExtractor={keyExtractor}
        renderItem={renderRow}
        contentContainerStyle={st.body}
        initialNumToRender={6}
        maxToRenderPerBatch={6}
        windowSize={7}
        ListHeaderComponent={
          <>
            {err ? <Banner tone="warn">{err}</Banner> : null}
            {/* A REFRESH that failed after a good first load: the list below is
                stale, so say so rather than letting it look current. */}
            {loadErr ? (
              <Banner tone="warn">{`${loadErr} Showing the last list that loaded.`}</Banner>
            ) : null}
            {threads.length === 0 ? (
              <EmptyState
                title="No contact requests yet"
                lines={[
                  'Requests you send and receive appear here.',
                  'Members can only contact you about the things you chose under “Open To”.',
                ]}
              />
            ) : null}
          </>
        }
        ListFooterComponent={
          <Helper>
            Messages reach members through Pro Audio Training Academy. Email addresses are never
            shown to either side, and both members remain identifiable to the Academy so that
            reports can be acted on.
          </Helper>
        }
      />

      {/* Outside the list: a Modal renders as an overlay regardless of where it
          sits in the tree, and this keeps it mounted across cell recycling. */}
      <ThreadSheet thread={open} onClose={() => setOpen(null)} />
    </>
  );
}

function ReportLink({
  thread,
  onDone,
  onError,
}: {
  thread: ContactThread;
  onDone: () => Promise<void>;
  onError: (e: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<ReportReason>('spam');
  const [detail, setDetail] = useState('');
  return (
    <>
      <Pressable
        onPress={() => setOpen(true)}
        hitSlop={6}
        style={st.link}
        accessibilityRole="button"
        accessibilityLabel={`Report ${thread.otherDisplayName}`}
      >
        <Text style={st.linkText}>REPORT</Text>
      </Pressable>
      <Modal visible={open} transparent animationType="slide" onRequestClose={() => setOpen(false)}>
        <View style={st.sheetRoot}>
          <View style={st.sheet}>
            <Text accessibilityRole="header" style={st.sheetTitle}>
              REPORT THIS REQUEST
            </Text>
            <Helper>
              Tell us what happened. Reports go to Pro Audio Training Academy, not to the other
              member.
            </Helper>
            <ChipWrap>
              {REASONS.map((r) => (
                <Chip key={r.key} label={r.label} on={reason === r.key} onPress={() => setReason(r.key)} />
              ))}
            </ChipWrap>
            <TextInput
              style={st.input}
              value={detail}
              onChangeText={setDetail}
              placeholder="Anything else we should know (optional)"
              placeholderTextColor={colors.textMuted}
              multiline
              maxLength={1000}
              accessibilityLabel="Report details"
            />
            <PrimaryButton
              label="SEND REPORT"
              tone="danger"
              onPress={() =>
                void reportMember({
                  token: thread.otherToken,
                  requestId: thread.id,
                  reason,
                  detail,
                }).then(async (r) => {
                  setOpen(false);
                  if (!r.ok) return onError(r.error);
                  setDetail('');
                  await onDone();
                })
              }
            />
            <PrimaryButton label="CANCEL" onPress={() => setOpen(false)} />
          </View>
        </View>
      </Modal>
    </>
  );
}

/** One conversation bubble. Module-level + memoized so the message FlatList can
 *  reuse cells (virtualization pass 2026-09-11); markup is unchanged. */
const Bubble = memo(function Bubble({ m }: { m: ThreadMessage }) {
  return (
    <View style={[st.bubble, m.mine && st.bubbleMine]}>
      <Text style={st.bubbleText}>{m.body}</Text>
    </View>
  );
});

const bubbleKey = (m: ThreadMessage) => m.id;
const renderBubble = ({ item }: { item: ThreadMessage }) => <Bubble m={item} />;

function ThreadSheet({ thread, onClose }: { thread: ContactThread | null; onClose: () => void }) {
  const [msgs, setMsgs] = useState<ThreadMessage[]>([]);
  const [body, setBody] = useState('');
  const [err, setErr] = useState<string | null>(null);

  // [75] (2026-09-07): a failed message fetch used to render as an empty
  // conversation; surface it instead (the reply box still works).
  const load = useCallback(async () => {
    if (!thread) return;
    const r = await fetchThreadMessages(thread.id);
    if (!r.ok) {
      setErr(r.error);
      return;
    }
    setErr(null);
    setMsgs(r.rows);
  }, [thread]);

  // Clear the previous conversation BEFORE fetching the next one (network audit
  // 2026-09-11). This sheet stays mounted across opens, and a failed fetch keeps
  // whatever `msgs` already held — so opening a second conversation offline
  // displayed the FIRST member's messages under the second member's name.
  const threadId = thread?.id ?? null;
  useEffect(() => {
    setMsgs([]);
    setErr(null);
    setBody('');
  }, [threadId]);

  useEffect(() => {
    void load();
  }, [load]);

  if (!thread) return null;
  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <View style={st.sheetRoot}>
        <View style={[st.sheet, { maxHeight: '88%' }]}>
          <View style={st.sheetHead}>
            <Text accessibilityRole="header" style={st.sheetTitle}>
              {thread.otherDisplayName.toUpperCase()}
            </Text>
            <Pressable onPress={onClose} hitSlop={10} accessibilityRole="button" accessibilityLabel="Close conversation">
              <Text style={st.close}>✕</Text>
            </Pressable>
          </View>
          {err ? <Banner tone="warn">{err}</Banner> : null}
          {/* Virtualized 2026-09-11: a conversation grows without bound, and
              every bubble was mounted on open. The sheet body is a plain View,
              so nothing of the same orientation nests this list; the request's
              purpose + opening message stay pinned above as the list header,
              exactly where the ScrollView put them. */}
          <FlatList
            style={{ flex: 1 }}
            data={msgs}
            keyExtractor={bubbleKey}
            renderItem={renderBubble}
            initialNumToRender={12}
            maxToRenderPerBatch={12}
            windowSize={7}
            ListHeaderComponent={
              <>
                <Text style={st.purpose}>{thread.purposeLabel}</Text>
                <Text style={st.msg}>{thread.message}</Text>
              </>
            }
          />
          <TextInput
            style={st.input}
            value={body}
            onChangeText={setBody}
            placeholder="Write a reply"
            placeholderTextColor={colors.textMuted}
            multiline
            maxLength={2000}
            accessibilityLabel="Write a reply"
          />
          <PrimaryButton
            label="SEND"
            tone="green"
            disabled={!body.trim()}
            onPress={() =>
              void sendThreadMessage(thread.id, body.trim()).then(async (r) => {
                if (!r.ok) return setErr(r.error);
                setErr(null);
                setBody('');
                await load();
              })
            }
          />
        </View>
      </View>
    </Modal>
  );
}

const st = StyleSheet.create({
  body: { padding: 14, paddingBottom: 40 },
  card: {
    backgroundColor: '#181818',
    borderWidth: 1,
    borderColor: colors.hairlineAlt,
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
  },
  name: { fontFamily: fonts.oswaldSemiBold, fontSize: 16, color: colors.textPrimary },
  purpose: { fontFamily: fonts.oswaldMedium, fontSize: 10.5, letterSpacing: 1.4, color: colors.amber, marginTop: 4 },
  msg: { fontFamily: fonts.barlowRegular, fontSize: 14, lineHeight: 20, color: colors.textSecondary, marginTop: 8 },
  status: { fontFamily: fonts.barlowMedium, fontSize: 12, color: colors.textMutedDeep, marginTop: 8 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 14, marginTop: 6 },
  link: { minHeight: 44, justifyContent: 'center' },
  linkText: { fontFamily: fonts.oswaldSemiBold, fontSize: 11, letterSpacing: 1.3, color: colors.textMuted },
  sheetRoot: { flex: 1, backgroundColor: 'rgba(0,0,0,.75)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: '#141414',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    borderWidth: 1,
    borderColor: colors.hairlineAlt,
    padding: 14,
  },
  sheetHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sheetTitle: { fontFamily: fonts.oswaldSemiBold, fontSize: 13, letterSpacing: 2, color: colors.amberLabel },
  close: { fontFamily: fonts.barlowMedium, fontSize: 18, color: colors.textSub, padding: 4 },
  input: {
    backgroundColor: '#101010',
    borderWidth: 1,
    borderColor: '#2c2c2c',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontFamily: fonts.barlowRegular,
    fontSize: 15,
    color: colors.textPrimary,
    marginTop: 10,
    minHeight: 48,
  },
  bubble: {
    backgroundColor: '#101010',
    borderWidth: 1,
    borderColor: '#2a2a2a',
    borderRadius: 10,
    padding: 10,
    marginTop: 8,
    alignSelf: 'flex-start',
    maxWidth: '88%',
  },
  bubbleMine: { alignSelf: 'flex-end', backgroundColor: '#0d1f14', borderColor: 'rgba(55,224,95,.4)' },
  bubbleText: { fontFamily: fonts.barlowRegular, fontSize: 14, lineHeight: 20, color: colors.textSecondary },
});
