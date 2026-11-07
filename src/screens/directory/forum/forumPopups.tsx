/**
 * The forum's three popups that write: accept the community rules, report a
 * post, and appeal a decision. Centred over the dim, never in the page flow.
 */
import { useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { useLatchedPress } from '../../../lib/latch';
import { fonts } from '../../../theme/tokens';
import { appealPost, reportPost } from '../../../features/forum/api';
import { APPEAL_MAX, REPORT_REASONS } from '../../../features/forum/rules';
import { AlsoBlockChip, Chip, ChipWrap } from '../directoryBits';
import { AmberButton, F, FieldLabel, Popup, PopupScroll, QuietButton } from './forumBits';

/** The AI disclosure, in the approved words (mockup screen 5). */
export const AI_DISCLOSURE =
  'Posts are checked for the community rules by an AI service (Anthropic) before they appear. Most posts appear within a few seconds.';

/** Before a first post (Apple 5.1.2(i): explicit permission, Play: rules
 *  accepted before posting). App-side: the server has no check yet. */
const COMMUNITY_RULES = [
  'Respect people. Criticize the mix, not the person.',
  'Beginners are welcome here, so no "just Google it".',
  'Stay on audio. Promote your business in Careers & Business only, and say who you work for.',
  'Share advice you can stand behind, and point to a qualified professional on mains power, rigging and hearing.',
  'No pirated software or samples, and no one else’s private details.',
];

export function RulesPopup({
  visible,
  onAccept,
  onClose,
}: {
  visible: boolean;
  /** Latched by the host, which goes on to post. */
  onAccept: () => void;
  onClose: () => void;
}) {
  return (
    <Popup visible={visible} onClose={onClose} label="Community rules" closeOnBackdrop={false}>
      <View style={st.card}>
        <PopupScroll>
          <Text style={st.eb}>BEFORE YOUR FIRST POST</Text>
          <Text accessibilityRole="header" style={st.title}>
            Community rules
          </Text>
          {COMMUNITY_RULES.map((r) => (
            <Text key={r} style={st.rule}>
              {r}
            </Text>
          ))}
          <Text style={st.disclosure}>{AI_DISCLOSURE} Anyone can report a post, and every removal can be appealed to a person.</Text>
          <View style={st.buttons}>
            <QuietButton label="NOT NOW" onPress={onClose} />
            <AmberButton label="I AGREE" onPress={onAccept} style={st.grow} />
          </View>
        </PopupScroll>
      </View>
    </Popup>
  );
}

type ReportProps = {
  /** The post being reported; null keeps it closed. */
  postId: string | null;
  authorName: string;
  canBlock: boolean;
  onClose: () => void;
  onDone: (result: { alsoBlock: boolean }) => void;
};

export function ReportPopup(props: ReportProps) {
  return (
    <Popup visible={!!props.postId} onClose={props.onClose} label="Report post">
      {props.postId ? <ReportCard key={props.postId} {...props} postId={props.postId} /> : null}
    </Popup>
  );
}

function ReportCard({ postId, authorName, canBlock, onClose, onDone }: ReportProps & { postId: string }) {
  const [reason, setReason] = useState<string | null>(null);
  const [alsoBlock, setAlsoBlock] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const send = useLatchedPress(async () => {
    if (!reason) return;
    setBusy(true);
    const r = await reportPost(postId, reason);
    setBusy(false);
    if (r.ok) onDone({ alsoBlock });
    else setError(r.error);
  });

  return (
    <View style={st.card}>
      <PopupScroll>
        <Text accessibilityRole="header" style={st.title}>
          Report this post
        </Text>
        <Text style={st.lead}>Reports are reviewed straight away. {authorName} is not told who sent it.</Text>
        <ChipWrap>
          {REPORT_REASONS.map((r) => (
            <Chip key={r.key} label={r.label} on={reason === r.key} onPress={() => setReason(r.key)} />
          ))}
        </ChipWrap>
        {canBlock ? <AlsoBlockChip on={alsoBlock} onToggle={() => setAlsoBlock((b) => !b)} /> : null}
        {error ? <Text style={st.error}>{error}</Text> : null}
        <View style={st.buttons}>
          <QuietButton label="CANCEL" onPress={onClose} />
          <AmberButton label="SEND REPORT" onPress={send} busy={busy} disabled={!reason} style={st.grow} />
        </View>
      </PopupScroll>
    </View>
  );
}

type AppealProps = { postId: string | null; onClose: () => void; onDone: () => void };

export function AppealPopup(props: AppealProps) {
  return (
    <Popup visible={!!props.postId} onClose={props.onClose} label="Appeal">
      {props.postId ? <AppealCard key={props.postId} {...props} postId={props.postId} /> : null}
    </Popup>
  );
}

function AppealCard({ postId, onClose, onDone }: AppealProps & { postId: string }) {
  const [text, setText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const send = useLatchedPress(async () => {
    if (!text.trim()) return;
    setBusy(true);
    const r = await appealPost(postId, text.trim());
    setBusy(false);
    if (r.ok) onDone();
    else setError(r.error);
  });

  return (
    <View style={st.card}>
      <PopupScroll>
        <Text accessibilityRole="header" style={st.title}>
          Appeal this decision
        </Text>
        <Text style={st.lead}>An appeal goes to a person, who reads your post and your reason.</Text>
        <FieldLabel>WHY SHOULD IT STAY UP?</FieldLabel>
        <TextInput
          value={text}
          onChangeText={setText}
          multiline
          maxLength={APPEAL_MAX}
          style={st.input}
          placeholder="Say what the review missed"
          placeholderTextColor={F.muted}
          accessibilityLabel="Why should it stay up?"
          textAlignVertical="top"
        />
        {error ? <Text style={st.error}>{error}</Text> : null}
        <View style={st.buttons}>
          <QuietButton label="CANCEL" onPress={onClose} />
          <AmberButton label="SEND APPEAL" onPress={send} busy={busy} disabled={!text.trim()} style={st.grow} />
        </View>
      </PopupScroll>
    </View>
  );
}

const st = StyleSheet.create({
  card: {
    backgroundColor: F.raised,
    borderWidth: 1,
    borderColor: F.line2,
    borderRadius: 20,
    paddingTop: 20,
    paddingHorizontal: 18,
    paddingBottom: 16,
    flexShrink: 1,
  },
  eb: { fontFamily: fonts.mono, fontSize: 10, letterSpacing: 1.4, color: F.amber, marginBottom: 6 },
  title: { fontFamily: fonts.oswaldSemiBold, fontSize: 19, lineHeight: 24, color: F.text, marginBottom: 6 },
  lead: { fontFamily: fonts.barlowRegular, fontSize: 13.5, lineHeight: 19, color: F.sub, marginBottom: 10 },
  rule: { fontFamily: fonts.barlowRegular, fontSize: 13.5, lineHeight: 19.5, color: F.body, marginTop: 7 },
  disclosure: { fontFamily: fonts.barlowRegular, fontSize: 12, lineHeight: 17, color: F.muted, marginTop: 12 },
  buttons: { flexDirection: 'row', gap: 10, marginTop: 14 },
  grow: { flex: 1 },
  error: { fontFamily: fonts.barlowRegular, fontSize: 13, lineHeight: 18, color: F.red, marginTop: 10 },
  input: {
    minHeight: 96,
    backgroundColor: F.panel,
    borderWidth: 1,
    borderColor: F.line2,
    borderRadius: 12,
    paddingVertical: 11,
    paddingHorizontal: 13,
    fontFamily: fonts.barlowRegular,
    fontSize: 14,
    color: F.text,
  },
});
