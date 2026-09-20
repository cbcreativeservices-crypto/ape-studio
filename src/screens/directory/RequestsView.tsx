/**
 * REQUESTS — incoming and outgoing contact requests, and accepted
 * conversations (spec §2, §8.3).
 *
 * A request carries a PURPOSE that the recipient already agreed to hear about,
 * and a short message. Nothing is a conversation until the recipient accepts.
 * No email address appears anywhere in this screen, in either direction.
 */
import { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { FlatList, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Modal } from '../../components/DimModal';
import { colors, fonts } from '../../theme/tokens';
import { Banner, Chip, ChipWrap, EmptyState, Eyebrow, Helper, Loading, PrimaryButton } from './directoryBits';
import {
  blockThread,
  fetchContactThreads,
  fetchContactAllowance,
  fetchThreadMessages,
  type ContactAllowance,
  reportMember,
  respondToRequest,
  sendThreadMessage,
  type ContactThread,
  type ReportReason,
  type ThreadMessage,
} from '../../features/directory/api';
import { confirmDialog, notify as appNotify } from '../../lib/confirm';

const REASONS: { key: ReportReason; label: string }[] = [
  { key: 'spam', label: 'Spam' },
  { key: 'harassment', label: 'Harassment' },
  { key: 'solicitation', label: 'Solicitation' },
  { key: 'impersonation', label: 'Impersonation' },
  { key: 'other', label: 'Something else' },
];

/** Acknowledge something, in the same idiom as confirmThen below. */
function notify(title: string, body: string): void {
  appNotify(title, body);
}

function confirmThen(title: string, body: string, yes: string, onYes: () => void): void {
  confirmDialog(title, body, yes, onYes);
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
      <ThreadWho t={t} />
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
              // ── THREAD-SCOPED, NOT TOKEN-SCOPED (2026-09-19) ─────────
              // This sent `t.otherToken ?? ''`. An EMPLOYER has no community
              // profile, so contact_threads returns a null token and '' was
              // cast to uuid — the button threw `invalid input syntax for
              // type uuid: ""` at the member. "Block an abusive user" was
              // simply not true for the one party who can message you
              // without publishing anything. The request id identifies the
              // counterparty for every kind of thread.
              () =>
                void blockThread(t.id, true).then((r) =>
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
      <ThreadWho t={t} />
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


/**
 * WHO is on the other end of this thread.
 *
 * ── WHY THIS IS NOT JUST A NAME (2026-09-18) ────────────────────────────────
 *
 * An employer has no community profile — that is the design — so before the
 * employer fields existed, `contact_threads` fell through to a generic
 * "Member". A company asking a graduate about work rendered exactly like a
 * peer, with the app implicitly vouching for them by saying nothing.
 *
 * The person deciding whether to accept is being asked to trust a stranger, so
 * they get three things: that it IS an organisation, that a human verified it,
 * and the site — so the claim is checkable by them and not only by us.
 *
 * The badge is drawn ONLY when `otherVerified` is true. An employer row that
 * somehow arrives unverified reads as a plain name, which is the honest
 * rendering: an unverified badge is worse than none.
 */
function ThreadWho({ t }: { t: ContactThread }) {
  const employer = t.otherKind === 'employer';
  return (
    <View style={st.whoWrap}>
      <View style={st.whoRow}>
        <Text style={st.name}>{t.otherDisplayName}</Text>
        {employer && t.otherVerified ? (
          <View
            style={st.verifiedTag}
            accessible
            accessibilityLabel="Verified employer. We checked this organisation."
          >
            <Text style={st.verifiedTagText}>VERIFIED EMPLOYER</Text>
          </View>
        ) : null}
      </View>
      {employer && t.otherWebsite ? (
        <Text style={st.whoSite} numberOfLines={1}>
          {t.otherWebsite}
        </Text>
      ) : null}
    </View>
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
  /** On by default — see the note by the chip. */
  const [alsoBlock, setAlsoBlock] = useState(true);
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
      <Modal accessibilityViewIsModal visible={open} transparent animationType="slide" onRequestClose={() => setOpen(false)}>
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
            {/* ── BLOCK IN THE SAME STEP (2026-09-19) ─────────────────────
                Apple 1.2 looks for report AND block together, and a person who
                has to perform two separate actions usually performs one. On by
                default: somebody upset enough to report is rarely hoping to
                keep hearing from them. */}
            <ChipWrap>
              <Chip
                label={alsoBlock ? 'Also blocking them ✓' : 'Also block them'}
                on={alsoBlock}
                onPress={() => setAlsoBlock((v) => !v)}
              />
            </ChipWrap>

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
                  // Thread-scoped, so this works against an employer too.
                  if (alsoBlock) {
                    const b2 = await blockThread(thread.id, true);
                    if (!b2.ok) onError(b2.error);
                  }
                  // Acknowledge it. A report that vanishes silently reads as
                  // one that was not received, and the person is left
                  // wondering whether to report again.
                  notify(
                    'Report received',
                    alsoBlock
                      ? 'We review reports and act on them. You will not hear from this member again, and they are not told that you reported them.'
                      : 'We review reports and act on them. The other member is not told that you reported them.',
                  );
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
  const insets = useSafeAreaInsets();
  const [msgs, setMsgs] = useState<ThreadMessage[]>([]);
  const [body, setBody] = useState('');
  const [err, setErr] = useState<string | null>(null);
  /** Remaining allowance. null = unknown, which must read as ALLOWED. */
  const [allow, setAllow] = useState<ContactAllowance | null>(null);

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
    // Allowance rides along with the messages so the count is right after
    // every send, and a failure leaves it null (= unknown = allowed).
    setAllow(await fetchContactAllowance(thread.id));
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
    setAllow(null);
  }, [threadId]);

  useEffect(() => {
    void load();
  }, [load]);

  if (!thread) return null;
  return (
    /**
     * ⛔ THE KEYBOARD COVERED THE COMPOSER AND SEND, WITH NO WAY OUT.
     *
     * This sheet is bottom-anchored and its last two children are the reply
     * box and SEND. There was no KeyboardAvoidingView, no bottom inset and no
     * keyboardDismissMode, and an RN <Modal> renders in its own native
     * container, so the app-root KeyboardProvider/KeyboardToolbar never
     * reached inside it. Result: the keyboard came up over the member's own
     * text AND over SEND; the input is `multiline`, so Return inserted a
     * newline rather than dismissing; and the message list would not drop it
     * on a drag either. The only escape was backgrounding the app — on every
     * single message send, in the whole of the messaging feature.
     */
    <Modal accessibilityViewIsModal visible transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={st.sheetRoot}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* With the keyboard DOWN, SEND used to sit 14pt from the physical
            edge, under the home indicator. */}
        <View style={[st.sheet, { maxHeight: '88%', paddingBottom: 14 + insets.bottom }]}>
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
            // Drag the conversation to put the keyboard away — the second
            // escape route, since a multiline Return cannot dismiss it.
            keyboardDismissMode="interactive"
            keyboardShouldPersistTaps="handled"
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
            maxLength={allow?.messageMaxChars ?? 1000}
            accessibilityLabel="Write a reply"
          />

          {/* ── SAY THE LIMIT BEFORE THE WALL (owner 2026-09-19) ───────────
              Every cap here used to be discovered by hitting it. `allow` is
              null when the read failed, and null must read as ALLOWED — the
              server is the enforcement, and guessing "blocked" on a dropped
              connection would lock someone out of their own conversation. */}
          {allow?.awaitingReply ? (
            <Text style={st.allowance}>
              Wait for a reply before sending more.
            </Text>
          ) : allow && allow.messagesLeftHereToday <= 3 ? (
            <Text style={st.allowance}>
              {allow.messagesLeftHereToday === 0
                ? 'No replies left in this conversation today. It resets tomorrow.'
                : `${allow.messagesLeftHereToday} ${allow.messagesLeftHereToday === 1 ? 'reply' : 'replies'} left in this conversation today.`}
            </Text>
          ) : null}

          <PrimaryButton
            label="SEND"
            tone="green"
            disabled={
              !body.trim() ||
              allow?.awaitingReply === true ||
              allow?.messagesLeftHereToday === 0 ||
              allow?.messagesLeftToday === 0 ||
              allow?.messagesLeftThisWeek === 0
            }
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
      </KeyboardAvoidingView>
    </Modal>
  );
}

const st = StyleSheet.create({
  allowance: { fontFamily: fonts.barlowRegular, fontSize: 12.5, color: colors.textSub, marginTop: 6 },
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
  whoWrap: { gap: 2 },
  whoRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  verifiedTag: {
    borderWidth: 1,
    borderColor: 'rgba(125,255,161,.55)',
    backgroundColor: 'rgba(125,255,161,.12)',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  verifiedTagText: {
    fontFamily: fonts.oswaldSemiBold,
    fontSize: 9.5,
    letterSpacing: 1,
    color: '#7dffa1',
  },
  whoSite: { fontFamily: fonts.mono, fontSize: 11.5, color: colors.textSub },
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
