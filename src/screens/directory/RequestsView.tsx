/**
 * REQUESTS — incoming and outgoing contact requests, and accepted
 * conversations (spec §2, §8.3).
 *
 * A request carries a PURPOSE that the recipient already agreed to hear about,
 * and a short message. Nothing is a conversation until the recipient accepts.
 * No email address appears anywhere in this screen, in either direction.
 */
import { useCallback, useEffect, useState } from 'react';
import { Alert, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
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

export function RequestsView() {
  const [threads, setThreads] = useState<ContactThread[] | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [open, setOpen] = useState<ContactThread | null>(null);

  const load = useCallback(async () => {
    setThreads(await fetchContactThreads());
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const act = async (t: ContactThread, action: 'accept' | 'decline' | 'withdraw') => {
    const r = await respondToRequest(t.id, action);
    if (!r.ok) return setErr(r.error);
    setErr(null);
    await load();
  };

  if (threads === null) return <Loading label="Loading your requests…" />;

  const incoming = threads.filter((t) => t.direction === 'incoming');
  const outgoing = threads.filter((t) => t.direction === 'outgoing');

  return (
    <ScrollView contentContainerStyle={st.body}>
      {err ? <Banner tone="warn">{err}</Banner> : null}

      {threads.length === 0 ? (
        <EmptyState
          title="No contact requests yet"
          lines={[
            'Requests you send and receive appear here.',
            'Members can only contact you about the things you chose under “Open To”.',
          ]}
        />
      ) : null}

      {incoming.length ? <Eyebrow>INCOMING</Eyebrow> : null}
      {incoming.map((t) => (
        <View key={t.id} style={st.card}>
          <Text style={st.name}>{t.otherDisplayName}</Text>
          <Text style={st.purpose}>{t.purposeLabel}</Text>
          <Text style={st.msg}>{t.message}</Text>
          <Text style={st.status}>{STATUS_LABEL[t.status]}</Text>
          {t.status === 'pending' ? (
            <View style={st.row}>
              <PrimaryButton label="ACCEPT" tone="green" onPress={() => void act(t, 'accept')} />
              <View style={{ width: 8 }} />
              <PrimaryButton label="DECLINE" onPress={() => void act(t, 'decline')} />
            </View>
          ) : null}
          {t.status === 'accepted' ? (
            <PrimaryButton label={`OPEN CONVERSATION (${t.messageCount})`} onPress={() => setOpen(t)} />
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
                      r.ok ? load() : setErr(r.error),
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
            <ReportLink thread={t} onDone={load} onError={setErr} />
          </View>
        </View>
      ))}

      {outgoing.length ? <Eyebrow>SENT</Eyebrow> : null}
      {outgoing.map((t) => (
        <View key={t.id} style={st.card}>
          <Text style={st.name}>{t.otherDisplayName}</Text>
          <Text style={st.purpose}>{t.purposeLabel}</Text>
          <Text style={st.msg}>{t.message}</Text>
          <Text style={st.status}>{STATUS_LABEL[t.status]}</Text>
          {t.status === 'pending' ? (
            <PrimaryButton label="WITHDRAW" onPress={() => void act(t, 'withdraw')} />
          ) : null}
          {t.status === 'accepted' ? (
            <PrimaryButton label={`OPEN CONVERSATION (${t.messageCount})`} onPress={() => setOpen(t)} />
          ) : null}
        </View>
      ))}

      <Helper>
        Messages reach members through Pro Audio Training Academy. Email addresses are never shown to
        either side, and both members remain identifiable to the Academy so that reports can be acted
        on.
      </Helper>

      <ThreadSheet thread={open} onClose={() => setOpen(null)} />
    </ScrollView>
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

function ThreadSheet({ thread, onClose }: { thread: ContactThread | null; onClose: () => void }) {
  const [msgs, setMsgs] = useState<ThreadMessage[]>([]);
  const [body, setBody] = useState('');
  const [err, setErr] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (thread) setMsgs(await fetchThreadMessages(thread.id));
  }, [thread]);

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
          <ScrollView style={{ flex: 1 }}>
            <Text style={st.purpose}>{thread.purposeLabel}</Text>
            <Text style={st.msg}>{thread.message}</Text>
            {msgs.map((m) => (
              <View key={m.id} style={[st.bubble, m.mine && st.bubbleMine]}>
                <Text style={st.bubbleText}>{m.body}</Text>
              </View>
            ))}
          </ScrollView>
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
