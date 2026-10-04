/**
 * The community unread badge (owner decision 2026-10-04): pending contact
 * requests + unread messages. Renders NOTHING when the count is unknown (a
 * failed read, an unread session), when there is no account, or at 0 — a
 * badge only ever states a number the server just gave for THIS account.
 *
 * Also the React side of the counts store (./inboxCounts.ts holds the rules):
 * `useCommunityInbox()` and `refreshCommunityInbox()`. One module on purpose —
 * the TabBar loads it at app start, and the start graph is budgeted
 * (test/perfStartTrim_20261004). The server read (./inboxApi) is required on
 * first use, after the first frame.
 */
import { useEffect, useSyncExternalStore } from 'react';
import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { colors, fonts } from '../../theme/tokens';
import {
  badgeA11y,
  badgeCount,
  badgeText,
  getInboxState,
  pendingCount,
  refreshInbox,
  subscribeInbox,
  threadUnread,
  type InboxRead,
  type InboxState,
} from './inboxCounts';

/** A badge mounting does not re-read an answer younger than this. */
const BADGE_MIN_AGE_MS = 15_000;

const readCounts = (): Promise<InboxRead> =>
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  (require('./inboxApi') as typeof import('./inboxApi')).readInboxCounts();

/** Re-read the counts. `force` after a write the counts must reflect. */
export function refreshCommunityInbox(force = false): Promise<void> {
  return refreshInbox(readCounts, force ? { force: true } : { minAgeMs: BADGE_MIN_AGE_MS });
}

/** The current counts; reads them (throttled) when the caller mounts. */
export function useCommunityInbox(): InboxState {
  const s = useSyncExternalStore(subscribeInbox, getInboxState, getInboxState);
  useEffect(() => {
    void refreshCommunityInbox();
  }, []);
  return s;
}

export function CountPill({ n, label, style }: { n: number; label: string; style?: StyleProp<ViewStyle> }) {
  return (
    <View style={[st.pill, style]} accessible accessibilityLabel={label}>
      {/* At most three characters ("99+"): the pill grows to fit, never truncates. */}
      <Text style={st.text}>{badgeText(n)}</Text>
    </View>
  );
}

/**
 * `what`: 'all' (requests + messages — every entry point), 'requests' (pending
 * incoming only), or a conversation id (that conversation's unread messages).
 */
export function CommunityBadge({
  what = 'all',
  style,
  state: given,
}: {
  what?: 'all' | 'requests' | { thread: string };
  style?: StyleProp<ViewStyle>;
  /** Pass the state when the parent already reads it (no second subscription). */
  state?: InboxState;
}) {
  const own = useCommunityInbox();
  const s = given ?? own;
  let n: number | null;
  let label: string;
  if (what === 'all') {
    n = badgeCount(s);
    label = badgeA11y(s);
  } else if (what === 'requests') {
    n = pendingCount(s);
    label = n ? `${n} contact ${n === 1 ? 'request' : 'requests'} waiting` : '';
  } else {
    const k = threadUnread(s, what.thread);
    n = k > 0 ? k : null;
    label = n ? `${n} new ${n === 1 ? 'message' : 'messages'}` : '';
  }
  if (!n) return null;
  return <CountPill n={n} label={label} style={style} />;
}

const st = StyleSheet.create({
  pill: {
    minWidth: 18,
    height: 18,
    paddingHorizontal: 5,
    borderRadius: 9,
    backgroundColor: colors.amber,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // ≥ 9 pt (house rule for value text).
  text: { fontFamily: fonts.oswaldSemiBold, fontSize: 11, lineHeight: 14, color: colors.black },
});
