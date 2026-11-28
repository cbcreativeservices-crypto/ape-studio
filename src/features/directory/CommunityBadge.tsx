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
import { COMMUNITY_VISIBLE } from '../../config/communityVisible';
import { createLocalStore } from '../storage/localStore';
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

/** Re-read the counts. `force` after a write the counts must reflect. While
 *  the community is switched off this is the one place every caller (app start,
 *  foreground, Home, tab bar, a received alert) stops asking the server. */
export function refreshCommunityInbox(force = false): Promise<void> {
  if (!COMMUNITY_VISIBLE) return Promise.resolve();
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

/* ── The academy's message (owner 2026-11-17) [MD:D68] ────────────────────
 * "Make this a message from the academy then and not a forum post - but it
 * has to show on the main menu page so user click and read it" (chose "In the
 * app, this one only"). While unread, the main menu's green New Messages opens
 * AcademyMessageScreen (the text lives there, loaded only when opened), which
 * marks it read. Kept HERE, in a module the main menu already loads, so the
 * app-start graph does not grow (perfStartTrim cap). Read = a device-local
 * flag on the shared safe store: nothing shows until the flag has been read
 * (a failed read shows nothing). The key is in the device-level `ape:intro:*`
 * family, so it survives the guest launch wipe and account switches: once per phone. A later message = a new id + text. */
export const ACADEMY_MESSAGE_ID = 'welcome-2026-11';

const academyRead = createLocalStore<ReadonlySet<string>>({
  // In the device-level `ape:intro:*` "seen" family, so the guest launch wipe
  // and account switches keep it (clearLocalAccountData isOnboardingFlag): a
  // seen-once message, not a person's work. Without it a guest saw it every launch.
  key: 'ape:intro:academyMessagesRead:v1',
  empty: () => new Set<string>(),
  parse: (parsed) => {
    if (!Array.isArray(parsed)) throw new Error('academyMessagesRead: not a list');
    return new Set(parsed.filter((x): x is string => typeof x === 'string'));
  },
  serialize: (s) => JSON.stringify([...s]),
});

/** Pure rule: show only once the record is read and lacks the id. */
export function academyMessageUnread(hydrated: boolean, read: ReadonlySet<string>): boolean {
  return hydrated && !read.has(ACADEMY_MESSAGE_ID);
}

/** True while the main menu should show New Messages for the academy message. */
export function useAcademyMessageUnread(): boolean {
  const read = academyRead.use();
  const hydrated = academyRead.useHydrated();
  return academyMessageUnread(hydrated, read);
}

/** Mark it read. A refused write shows the shared save-failure notice (ratchet). */
export function markAcademyMessageRead(): void {
  if (academyRead.get().has(ACADEMY_MESSAGE_ID)) return;
  void academyRead.mutate((s) => (s.has(ACADEMY_MESSAGE_ID) ? s : new Set([...s, ACADEMY_MESSAGE_ID])));
}
