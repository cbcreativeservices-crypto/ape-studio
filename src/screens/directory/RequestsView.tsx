/**
 * REQUESTS — incoming and outgoing contact requests, and accepted
 * conversations (spec §2, §8.3).
 *
 * A request carries a PURPOSE that the recipient already agreed to hear about,
 * and a short message. Nothing is a conversation until the recipient accepts.
 * No email address appears anywhere in this screen, in either direction.
 *
 * LAYOUT (owner-approved redesign 2026-11-01, mockup
 * Downloads/2026-11-01_COMMUNITY_CHAT_REDESIGN_MOCKUP.html): an inbox grouped
 * by what each request needs — WAITING ON YOU, CONVERSATIONS, SENT, CLOSED —
 * with compact rows, and a full-height conversation thread. Presentation only:
 * every handler, fence and confirmation below is the one that was here.
 */
import { memo, useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { AppState, FlatList, KeyboardAvoidingView, Linking, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Modal } from '../../components/DimModal';
import { BACK_GLYPH_MAX_SCALE, colors, fonts } from '../../theme/tokens';
import { AlsoBlockChip, Banner, Chip, ChipWrap, EmptyState, Helper, Loading, PrimaryButton, RetryOrSignIn, useFailedReadLine, useSending, useSendingPer } from './directoryBits';
import { ChannelBadge, STEEL, type BadgeLed } from './ChannelBadge';
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
import { VERIFIER_COPY } from '../../features/employer/verifierKind';
import { employerPageUrl } from '../../features/employer/publicPage';
import { confirmDialog, notify as appNotify } from '../../lib/confirm';
import { markThreadSeen, threadUnread } from '../../features/directory/inboxCounts';
import { markThreadRead } from '../../features/directory/inboxApi';
import { refreshCommunityInbox, useCommunityInbox } from '../../features/directory/CommunityBadge';
import { cardColumn } from '../../theme/readingColumn';
import * as Crypto from 'expo-crypto';
import { landedAlready, pendingFor, type PendingSend } from '../../features/directory/sendOnce';
import { sampleDirectoryOn } from '../../features/directory/sampleThreads';

/** The mockup's palette (brief 2026-11-01). Amber, green and steel come from
 *  the theme tokens / ChannelBadge. */
const C = {
  bg: '#0b0c0f',
  panel: '#121318',
  raised: '#181a21',
  line: '#24262e',
  line2: '#2e313b',
  text: '#f0f0f0',
  sub: '#a6a6ad',
  muted: '#7f818a',
  mineBg: '#262010',
  mineBorder: 'rgba(255,198,77,.35)',
  mineTime: '#a08a55',
} as const;

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

function confirmThen(
  title: string,
  body: string,
  yes: string,
  onYes: () => void,
  opts?: { destructive?: boolean },
): void {
  confirmDialog(title, body, yes, onYes, opts);
}

const STATUS_LABEL: Record<ContactThread['status'], string> = {
  pending: 'Waiting',
  accepted: 'Open',
  declined: 'Declined',
  withdrawn: 'Withdrawn',
  blocked: 'Closed',
};

type ThreadAction = 'accept' | 'decline' | 'withdraw';

/** "OPEN CONVERSATION (5)", plus "· 2 NEW" when the server says two of them
 *  are unread (owner 2026-10-04). Nothing is added when unread is unknown. */
export function conversationLabel(t: ContactThread, unread: number): string {
  const base = `OPEN CONVERSATION (${t.messageCount})`;
  return unread > 0 ? `${base} · ${unread} NEW` : base;
}

// ── TIME WORDS ─────────────────────────────────────────────────────────────
// Hand-rolled (no Intl options), so Hermes, the web preview and the tests all
// print the same thing.

const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
const WEEKDAYS = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];

const parseTime = (iso: string | null | undefined): number => (iso ? Date.parse(iso) : NaN);

/** "3h" on the row, "3 hours ago" for a screen reader. null for no date. */
function relativeTime(iso: string | null | undefined, now = Date.now()): { short: string; spoken: string } | null {
  const t = parseTime(iso);
  if (!Number.isFinite(t)) return null;
  const mins = Math.floor(Math.max(0, now - t) / 60_000);
  const say = (n: number, unit: string) => `${n} ${unit}${n === 1 ? '' : 's'} ago`;
  if (mins < 1) return { short: 'now', spoken: 'just now' };
  if (mins < 60) return { short: `${mins}m`, spoken: say(mins, 'minute') };
  const hours = Math.floor(mins / 60);
  if (hours < 24) return { short: `${hours}h`, spoken: say(hours, 'hour') };
  const days = Math.floor(hours / 24);
  if (days < 7) return { short: `${days}d`, spoken: say(days, 'day') };
  const weeks = Math.floor(days / 7);
  if (weeks < 5) return { short: `${weeks}w`, spoken: say(weeks, 'week') };
  const d = new Date(t);
  const label = `${MONTHS[d.getMonth()]} ${d.getDate()}`;
  return { short: label, spoken: label };
}

/** "4:12 PM" under a bubble. '' for no date. */
function clockTime(iso: string | null | undefined): string {
  const t = parseTime(iso);
  if (!Number.isFinite(t)) return '';
  const d = new Date(t);
  const h = d.getHours();
  return `${h % 12 === 0 ? 12 : h % 12}:${String(d.getMinutes()).padStart(2, '0')} ${h < 12 ? 'AM' : 'PM'}`;
}

const dayStart = (t: number) => {
  const d = new Date(t);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
};

/** The divider above a day's first message: TODAY, a weekday in the last
 *  week, or the date. '' for no date. */
function dayLabel(iso: string | null | undefined, now = Date.now()): string {
  const t = parseTime(iso);
  if (!Number.isFinite(t)) return '';
  const days = Math.round((dayStart(now) - dayStart(t)) / 86_400_000);
  if (days <= 0) return 'TODAY';
  const d = new Date(t);
  if (days < 7) return WEEKDAYS[d.getDay()];
  const label = `${MONTHS[d.getMonth()]} ${d.getDate()}`;
  return d.getFullYear() === new Date(now).getFullYear() ? label : `${label}, ${d.getFullYear()}`;
}

/** One message plus the day divider drawn above it (only on a new day). */
type MsgRow = { m: ThreadMessage; day: string | null };

function withDays(msgs: ThreadMessage[]): MsgRow[] {
  const now = Date.now();
  let prev: string | null = null;
  return msgs.map((m) => {
    const label = dayLabel(m.createdAt, now);
    const day = label && label !== prev ? label : null;
    if (label) prev = label;
    return { m, day };
  });
}

// ── INBOX ROWS ─────────────────────────────────────────────────────────────

/**
 * The channel LED in Requests (brief 2026-11-01): amber = waiting on you (an
 * incoming request still pending, or an open conversation with unread
 * messages), green = an open conversation, off = sent / declined / withdrawn
 * / blocked.
 */
function rowLed(t: ContactThread, unread: number): BadgeLed {
  if (t.status === 'accepted') return unread > 0 ? 'amber' : 'green';
  if (t.status === 'pending' && t.direction === 'incoming') return 'amber';
  return 'off';
}

/** The small mono state under a row that is not waiting on you. */
function stateLine(t: ContactThread): string | null {
  if (t.status === 'accepted') return null;
  if (t.status === 'pending') return t.direction === 'outgoing' ? 'WAITING FOR A REPLY' : null;
  return STATUS_LABEL[t.status].toUpperCase();
}

/** One flattened row of the requests list: a section header or a request row.
 *  All four sections share one scroller, so they share one FlatList. */
type RequestRow =
  | { kind: 'eyebrow'; key: string; label: string; count?: number; first: boolean }
  | { kind: 'incoming'; key: string; thread: ContactThread }
  | { kind: 'outgoing'; key: string; thread: ContactThread };

function SectionHead({ label, count, first }: { label: string; count?: number; first: boolean }) {
  return (
    <View
      style={[st.sec, !first && st.secGap]}
      accessible
      accessibilityRole="header"
      accessibilityLabel={count ? `${label}, ${count}` : label}
    >
      <Text style={st.secText}>{label.toUpperCase()}</Text>
      {count ? <Text style={st.secCount}>{count}</Text> : null}
    </View>
  );
}

/** A compact answer button: ACCEPT (solid green), DECLINE / WITHDRAW (outline). */
function Pill({
  label,
  tone,
  disabled,
  onPress,
}: {
  label: string;
  tone: 'yes' | 'no';
  disabled?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      hitSlop={6}
      style={({ pressed }) => [
        st.pill,
        tone === 'yes' ? st.pillYes : st.pillNo,
        disabled && st.pillOff,
        pressed && !disabled && st.pressed,
      ]}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: !!disabled }}
      aria-disabled={!!disabled}
    >
      <Text style={[st.pillText, tone === 'yes' ? st.pillTextYes : st.pillTextNo]}>{label}</Text>
    </Pressable>
  );
}

/** "···" — shows (or hides) BLOCK and REPORT for one person. */
function MoreButton({ name, open, onPress }: { name: string; open: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      hitSlop={12}
      style={({ pressed }) => [st.more, pressed && st.pressed]}
      accessibilityRole="button"
      accessibilityLabel={`Block or report ${name}`}
      accessibilityState={{ expanded: open }}
    >
      <Text style={[st.moreText, open && st.moreTextOn]}>···</Text>
    </Pressable>
  );
}

/**
 * The shared inbox row: channel badge, who (with the verified plate), a
 * relative time, the purpose, a two-line preview of the request message and,
 * for an open conversation, the OPEN CONVERSATION link. The answer buttons and
 * the BLOCK / REPORT row come in as children from each card.
 */
function InboxRow({
  t,
  unread,
  onOpen,
  more,
  onMore,
  children,
}: {
  t: ContactThread;
  unread: number;
  onOpen: (t: ContactThread) => void;
  more: boolean;
  onMore: () => void;
  children?: ReactNode;
}) {
  const led = rowLed(t, unread);
  const when = relativeTime(t.status === 'pending' ? t.createdAt : (t.respondedAt ?? t.createdAt));
  const state = stateLine(t);
  const isOpen = t.status === 'accepted';
  // Incoming: always (as before). Sent: once accepted — only then can they
  // write back (see ThreadModeration).
  const canModerate = t.direction === 'incoming' || isOpen;
  // WAITING ON YOU shows the WHOLE request: the person needs all of it to
  // decide whether to accept, decline or report. Every other row is a
  // two-line preview.
  const waiting = t.direction === 'incoming' && t.status === 'pending';
  const preview = (
    <Text style={[st.preview, led === 'amber' && st.previewNew]} numberOfLines={waiting ? undefined : 2}>
      {t.message}
    </Text>
  );
  return (
    <View style={st.ib}>
      <ChannelBadge name={t.otherDisplayName} led={led} steel={t.otherKind !== 'member' && t.otherVerified} />
      <View style={st.ibBody}>
        <ThreadWho
          t={t}
          right={
            <View style={st.topRight}>
              {when ? (
                <Text style={st.time} accessibilityLabel={when.spoken}>
                  {when.short}
                </Text>
              ) : null}
              {canModerate ? <MoreButton name={t.otherDisplayName} open={more} onPress={onMore} /> : null}
            </View>
          }
        />
        <Text style={st.purpose}>{t.purposeLabel}</Text>
        {isOpen ? (
          // A tap on the preview opens the conversation too. Hidden from a
          // screen reader, which gets the explicit link just below instead
          // (a Pressable is one element on iOS and would swallow the text).
          <Pressable onPress={() => onOpen(t)} accessible={false} importantForAccessibility="no">
            {preview}
          </Pressable>
        ) : (
          preview
        )}
        {state ? <Text style={st.state}>{state}</Text> : null}
        {isOpen ? (
          <Pressable
            onPress={() => onOpen(t)}
            hitSlop={8}
            style={({ pressed }) => [st.openLink, pressed && st.pressed]}
            accessibilityRole="button"
            accessibilityLabel={conversationLabel(t, unread)}
          >
            <Text style={st.openLinkText}>{`${conversationLabel(t, unread)} ›`}</Text>
          </Pressable>
        ) : null}
        {children}
      </View>
    </View>
  );
}

/**
 * An incoming request row. Extracted to module scope and memoized
 * (virtualization pass 2026-09-11): every row can carry its own ReportLink —
 * which holds state AND mounts a Modal — so rendering the whole inbox eagerly
 * inside a ScrollView cost one hidden sheet per request. Since the 2026-11-01
 * redesign the BLOCK / REPORT row mounts only once "···" opens it.
 */
const IncomingCard = memo(function IncomingCard({
  t,
  onAct,
  onOpen,
  onReload,
  onError,
  onBlocked,
  acting,
  unread,
}: {
  t: ContactThread;
  onAct: (t: ContactThread, action: ThreadAction) => void;
  onOpen: (t: ContactThread) => void;
  onReload: () => Promise<void>;
  /** null clears the banner (a Block / Report that went through). */
  onError: (e: string | null) => void;
  /** The server blocked this thread's member — see RequestsView `onBlocked`. */
  onBlocked: (t: ContactThread) => void;
  /** An accept/decline/withdraw is in flight — see `act`. */
  acting: boolean;
  /** Unread messages from them in this conversation (0 when unknown). */
  unread: number;
}) {
  const [more, setMore] = useState(false);
  return (
    <InboxRow t={t} unread={unread} onOpen={onOpen} more={more} onMore={() => setMore((v) => !v)}>
      {t.status === 'pending' ? (
        <View style={st.actions}>
          <Pill label="ACCEPT" tone="yes" disabled={acting} onPress={() => onAct(t, 'accept')} />
          <Pill label="DECLINE" tone="no" disabled={acting} onPress={() => onAct(t, 'decline')} />
        </View>
      ) : null}
      {more ? <ThreadModeration t={t} onReload={onReload} onError={onError} onBlocked={onBlocked} /> : null}
    </InboxRow>
  );
});

/**
 * BLOCK + REPORT for one thread. Lifted out of the incoming card (bug hunt
 * 2026-09-30) because a SENT request becomes a two-way conversation the moment
 * it is accepted, and that card had neither control: whoever you wrote to
 * could reply with anything and the Requests screen gave you no way to block
 * or report them. Both calls are thread-scoped, so they work from either side.
 * Since 2026-11-01 it sits behind each row's "···" and the thread's "···".
 */
function ThreadModeration({
  t,
  onReload,
  onError,
  onBlocked,
}: {
  t: ContactThread;
  onReload: () => Promise<void>;
  /** null clears the banner (a Block / Report that went through). */
  onError: (e: string | null) => void;
  onBlocked: (t: ContactThread) => void;
}) {
  return (
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
            // Success clears the banner (final round B, 2026-10-02): an old
            // ACCEPT / DECLINE error stayed up over a block that went through.
            () =>
              void blockThread(t.id, true).then((r) => {
                if (!r.ok) return onError(r.error);
                onBlocked(t);
                onError(null);
                return onReload();
              }),
            { destructive: true },
          )
        }
        hitSlop={6}
        style={st.link}
        accessibilityRole="button"
        accessibilityLabel={`Block ${t.otherDisplayName}`}
      >
        <Text style={st.linkText}>BLOCK</Text>
      </Pressable>
      <ReportLink thread={t} onDone={onReload} onError={onError} onBlocked={onBlocked} />
    </View>
  );
}

/** A sent (outgoing) request row. */
const OutgoingCard = memo(function OutgoingCard({
  t,
  onAct,
  onOpen,
  onReload,
  onError,
  onBlocked,
  acting,
  unread,
}: {
  t: ContactThread;
  onAct: (t: ContactThread, action: ThreadAction) => void;
  onOpen: (t: ContactThread) => void;
  onReload: () => Promise<void>;
  /** null clears the banner (a Block / Report that went through). */
  onError: (e: string | null) => void;
  onBlocked: (t: ContactThread) => void;
  acting: boolean;
  /** Unread messages from them in this conversation (0 when unknown). */
  unread: number;
}) {
  const [more, setMore] = useState(false);
  return (
    <InboxRow t={t} unread={unread} onOpen={onOpen} more={more} onMore={() => setMore((v) => !v)}>
      {t.status === 'pending' ? (
        <View style={st.actions}>
          <Pill label="WITHDRAW" tone="no" disabled={acting} onPress={() => onAct(t, 'withdraw')} />
        </View>
      ) : null}
      {t.status === 'accepted' && more ? (
        // Accepted = they can now write back — see ThreadModeration.
        <ThreadModeration t={t} onReload={onReload} onError={onError} onBlocked={onBlocked} />
      ) : null}
    </InboxRow>
  );
});

export function RequestsView({
  onBlocked,
  openThreadId = null,
  onOpenedThread,
}: {
  /**
   * A tapped member alert asked for this conversation (owner 2026-10-04).
   * Opened once the list has loaded AND contains it as an open conversation —
   * a thread that is not this account's, or no longer open (blocked,
   * declined), is simply not opened; the list is the answer. Handed back
   * through `onOpenedThread` either way, so it is consumed once.
   */
  openThreadId?: string | null;
  onOpenedThread?: () => void;
  /**
   * A member was blocked from here (hunt 11, 2026-10-04). Explore stays
   * MOUNTED across tab switches now and keeps its list up while it refreshes,
   * so a member blocked in Requests stayed listed — and openable — in Explore
   * until that search answered. The host hides the token at once, as it does
   * for a block from the member sheet.
   */
  onBlocked?: (token: string) => void;
} = {}) {
  const onBlockedRef = useRef(onBlocked);
  onBlockedRef.current = onBlocked;
  const noteBlocked = useCallback((t: ContactThread) => {
    if (t.otherToken) onBlockedRef.current?.(t.otherToken);
  }, []);
  const [threads, setThreads] = useState<ContactThread[] | null>(null);
  const [err, setErr] = useState<string | null>(null);
  // [75] (2026-09-07): a FAILED load used to land on "No contact requests yet",
  // hiding real pending requests behind what read as an empty inbox. Loading /
  // error+Retry / empty are now three distinct states.
  const [loadErr, setLoadErr] = useState<string | null>(null);
  // The words over a failed load agree with its button (UI-3-04).
  const failLine = useFailedReadLine();
  /** Counts failed reads, so a link waiting on one can tell it failed. */
  const [loadFails, setLoadFails] = useState(0);
  const [open, setOpen] = useState<ContactThread | null>(null);

  // NEWEST LOAD WINS (hunt 6, 2026-10-03; pattern P2). Reloads overlap: a
  // double-tapped RETRY, or the reload after an ACCEPT still out when a BLOCK /
  // REPORT starts its own. An older list landing last put a just-blocked or
  // just-answered request back as it was (live buttons included), and an older
  // failure landing last hung "Showing the last list that loaded" over a list
  // that had just loaded.
  const loadTicket = useRef(0);
  const load = useCallback(async () => {
    const ticket = ++loadTicket.current;
    const r = await fetchContactThreads();
    if (ticket !== loadTicket.current) return;
    if (!r.ok) {
      setLoadErr(r.error);
      setLoadFails((n) => n + 1);
      return;
    }
    setLoadErr(null);
    setThreads(r.rows);
    // The badges re-read with the list: an answered request or a new one
    // seen here must not leave the old count on Profile / the tab.
    void refreshCommunityInbox(true);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const inbox = useCommunityInbox();

  // A linked conversation (member alert tap): open it once the list knows it.
  const onOpenedRef = useRef(onOpenedThread);
  onOpenedRef.current = onOpenedThread;
  /**
   * The link this view's list is FRESH for (toddler pass 2026-10-13). A member
   * alert tapped while Requests was already open was matched against the list
   * loaded earlier: a conversation accepted since then was not in it, so the
   * tap opened nothing; and the conversation already open was handed back as
   * the same object, so its sheet never re-read and the new message did not
   * appear. A link that arrives after the first load re-reads the list first.
   * The link the view MOUNTED with is answered by the first load itself.
   */
  const freshFor = useRef<string | null>(openThreadId);
  useEffect(() => {
    if (!openThreadId || threads === null) return;
    if (freshFor.current !== openThreadId) {
      freshFor.current = openThreadId;
      void load();
      return;
    }
    const hit = threads.find((t) => t.id === openThreadId);
    if (hit && hit.status === 'accepted') setOpen(hit);
    // Consumed: the same conversation linked again later re-reads again.
    freshFor.current = null;
    onOpenedRef.current?.();
  }, [openThreadId, threads, load]);

  // THE RE-READ FOR A LINK FAILED (bug pass 2026-11-08, CODE-1-27). `threads`
  // did not change, so the effect above never ran again: the link was never
  // handed back, and tapping the same alert again set the same id, which is
  // no change, so nothing happened at all. Hand it back now: the stale-list
  // banner says the read failed, and the next tap re-reads.
  const seenFails = useRef(0);
  useEffect(() => {
    if (loadFails === seenFails.current) return;
    seenFails.current = loadFails;
    if (threads === null || !openThreadId || freshFor.current !== openThreadId) return;
    freshFor.current = null;
    onOpenedRef.current?.();
  }, [loadFails, threads, openThreadId]);

  // One answer at a time, until the list has reloaded (bug hunt 2026-09-29):
  // the buttons stayed live while the answer was out, so a double-tap sent
  // ACCEPT twice, or ACCEPT and then DECLINE for the same request.
  const [acting, runAct] = useSending();
  const act = useCallback(
    (t: ContactThread, action: ThreadAction) => {
      runAct(() =>
        respondToRequest(t.id, action).then(async (r) => {
          if (!r.ok) return setErr(r.error);
          setErr(null);
          await load();
        }),
      );
    },
    [load, runAct],
  );

  const openThread = useCallback((t: ContactThread) => setOpen(t), []);
  /** A block from inside the conversation: tell the host, as the rows do, and
   *  close the conversation — it no longer exists. */
  const blockedInThread = useCallback(
    (t: ContactThread) => {
      noteBlocked(t);
      setOpen(null);
    },
    [noteBlocked],
  );

  // Grouped by what each request needs (redesign 2026-11-01), each section
  // behind its header and flattened so ONE FlatList virtualizes them all.
  const rows = useMemo<RequestRow[]>(() => {
    if (!threads) return [];
    const waiting = threads.filter((t) => t.direction === 'incoming' && t.status === 'pending');
    const conversations = threads.filter((t) => t.status === 'accepted');
    const sent = threads.filter((t) => t.direction === 'outgoing' && t.status === 'pending');
    const closed = threads.filter((t) => t.status !== 'pending' && t.status !== 'accepted');
    const sections: [string, string, ContactThread[], boolean][] = [
      ['wait', 'Waiting on you', waiting, true],
      ['conv', 'Conversations', conversations, false],
      ['sent', 'Sent', sent, false],
      ['closed', 'Closed', closed, false],
    ];
    const out: RequestRow[] = [];
    for (const [key, label, list, counted] of sections) {
      if (!list.length) continue;
      out.push({ kind: 'eyebrow', key: `eb:${key}`, label, count: counted ? list.length : undefined, first: out.length === 0 });
      for (const t of list) {
        out.push(
          t.direction === 'incoming'
            ? { kind: 'incoming', key: `in:${t.id}`, thread: t }
            : { kind: 'outgoing', key: `out:${t.id}`, thread: t },
        );
      }
    }
    return out;
  }, [threads]);

  const keyExtractor = useCallback((r: RequestRow) => r.key, []);
  const renderRow = useCallback(
    ({ item }: { item: RequestRow }) => {
      if (item.kind === 'eyebrow') return <SectionHead label={item.label} count={item.count} first={item.first} />;
      if (item.kind === 'incoming') {
        return (
          <IncomingCard
            t={item.thread}
            onAct={act}
            onOpen={openThread}
            onReload={load}
            onError={setErr}
            onBlocked={noteBlocked}
            acting={acting}
            unread={threadUnread(inbox, item.thread.id)}
          />
        );
      }
      return (
        <OutgoingCard
          t={item.thread}
          onAct={act}
          onOpen={openThread}
          onReload={load}
          onError={setErr}
          onBlocked={noteBlocked}
          acting={acting}
          unread={threadUnread(inbox, item.thread.id)}
        />
      );
    },
    [act, openThread, load, acting, noteBlocked, inbox],
  );

  // Never loaded and the fetch failed → say so and offer a retry (not "none").
  if (threads === null && loadErr) {
    return (
      <ScrollView contentContainerStyle={st.body}>
        <Banner tone="warn">{failLine(loadErr, loadErr ?? '', 'Sign in to see your contact requests.')}</Banner>
        {/* A guest gets SIGN IN, not a RETRY that can never work (#26). */}
        <RetryOrSignIn message={loadErr} onRetry={() => void load()} />
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
            {sampleDirectoryOn() ? (
              <Banner tone="warn">SAMPLE DATA · development preview. Made-up members and messages; nothing is sent or saved.</Banner>
            ) : null}
            {err ? <Banner tone="warn">{err}</Banner> : null}
            {/* A REFRESH that failed after a good first load: the list below is
                stale, so say so rather than letting it look current. */}
            {loadErr ? (
              <>
                <Banner tone="warn">{`${failLine(loadErr, loadErr ?? '', 'Sign in to see your contact requests.')} Showing the last list that loaded.`}</Banner>
                {/* A way to try again from here (CODE-1-27). */}
                <RetryOrSignIn message={loadErr} onRetry={() => void load()} />
              </>
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
          <View style={st.footer}>
            <Helper>
              Messages reach members through Pro Audio Training Academy. Email addresses are never
              shown to either side, and both members remain identifiable to the Academy so that
              reports can be acted on.
            </Helper>
          </View>
        }
      />

      {/* Outside the list: a Modal renders as an overlay regardless of where it
          sits in the tree, and this keeps it mounted across cell recycling. */}
      <ThreadSheet
        thread={open}
        onClose={() => setOpen(null)}
        onReload={load}
        onError={setErr}
        onBlocked={blockedInThread}
      />
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
 *
 * A verified INSTRUCTOR or school gets the same treatment with its own words
 * (R1, 2026-10-27): "VERIFIED INSTRUCTOR", and its site.
 *
 * `right` sits at the end of the name line (the row's time and "···").
 */
function ThreadWho({ t, right }: { t: ContactThread; right?: ReactNode }) {
  const verifier = t.otherKind === 'member' ? null : VERIFIER_COPY[t.otherKind];
  const pageUrl = employerPageUrl(t.otherPageToken);
  return (
    <View style={st.whoWrap}>
      <View style={st.whoTop}>
        <View style={st.whoRow}>
          <Text style={st.name}>{t.otherDisplayName}</Text>
          {verifier && t.otherVerified ? (
            <View style={st.verifiedTag} accessible accessibilityLabel={verifier.badgeA11y}>
              <Text style={st.verifiedTagText}>{verifier.badge}</Text>
            </View>
          ) : null}
        </View>
        {right}
      </View>
      {verifier && t.otherWebsite ? (
        <Text style={st.whoSite} numberOfLines={1}>
          {t.otherWebsite}
        </Text>
      ) : null}
      {/* Their public page on the website (must-do H5, 2026-10-29), so the
          person being asked can check who is asking. Drawn only for a
          VERIFIED employer/instructor whose page token the server sent
          (otherPageToken, never the community token). */}
      {verifier && t.otherVerified && pageUrl ? (
        <Pressable
          onPress={() =>
            void Linking.openURL(pageUrl).catch(() =>
              notify('Couldn’t open the page', `Open this address in your browser: ${pageUrl}`),
            )
          }
          hitSlop={10}
          style={st.pageLink}
          accessibilityRole="link"
          accessibilityLabel={`View the public page of ${t.otherDisplayName} on the website`}
        >
          <Text style={st.pageLinkText}>VIEW THEIR PAGE ›</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

function ReportLink({
  thread,
  onDone,
  onError,
  onBlocked,
}: {
  thread: ContactThread;
  onDone: () => Promise<void>;
  /** null clears the banner (a Block / Report that went through). */
  onError: (e: string | null) => void;
  onBlocked: (t: ContactThread) => void;
}) {
  const insets = useSafeAreaInsets();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<ReportReason>('spam');
  const [detail, setDetail] = useState('');
  /** On by default — see the note by the chip. */
  const [alsoBlock, setAlsoBlock] = useState(true);
  const [reporting, runReport] = useSending();
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
        {/* ⛔ KEYBOARD TRAP — the same shape fixed in the message sheet
            below, and missed here. Bottom-anchored Modal, multiline
            detail box, SEND REPORT and CANCEL last, nothing to drag the
            keyboard down with and a scrim that is not pressable. This is the
            messaging report path Apple 1.2 requires. */}
        <KeyboardAvoidingView style={st.sheetRoot} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={[st.sheet, { paddingBottom: 14 + insets.bottom }]}>
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
                Shared with the Directory member sheet — see AlsoBlockChip. */}
            <AlsoBlockChip on={alsoBlock} onToggle={() => setAlsoBlock((v) => !v)} />

            <PrimaryButton
              label="SEND REPORT"
              tone="danger"
              disabled={reporting}
              onPress={() =>
                runReport(() => reportMember({
                  token: thread.otherToken,
                  requestId: thread.id,
                  reason,
                  detail,
                }).then(async (r) => {
                  setOpen(false);
                  if (!r.ok) return onError(r.error);
                  // The report went through: an older error banner no longer
                  // applies (a refused block below sets its own).
                  onError(null);
                  setDetail('');
                  // Thread-scoped, so this works against an employer too.
                  // `blocked` is what the SERVER did (evening hunt 3,
                  // 2026-10-02): a refused block set the banner and then the
                  // notice still said "You will not hear from this member
                  // again" — a block claimed that never happened.
                  let blocked = false;
                  if (alsoBlock) {
                    const b2 = await blockThread(thread.id, true);
                    if (!b2.ok) onError(b2.error);
                    blocked = b2.ok;
                    if (blocked) onBlocked(thread);
                  }
                  // Acknowledge it. A report that vanishes silently reads as
                  // one that was not received, and the person is left
                  // wondering whether to report again.
                  notify(
                    'Report received',
                    blocked
                      ? 'We review reports and act on them. You will not hear from this member again, and they are not told that you reported them.'
                      : 'We review reports and act on them. The other member is not told that you reported them.',
                  );
                  await onDone();
                }))
              }
            />
            <PrimaryButton label="CANCEL" onPress={() => setOpen(false)} />
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </>
  );
}

/** One conversation bubble, with the day divider above it when a new day
 *  starts. Module-level + memoized so the message FlatList can reuse cells
 *  (virtualization pass 2026-09-11). Theirs: charcoal, bottom-left corner
 *  tightened; mine: amber-tinted, bottom-right corner tightened. */
const Bubble = memo(function Bubble({ m, day, who }: { m: ThreadMessage; day: string | null; who: string }) {
  const time = clockTime(m.createdAt);
  return (
    <>
      {day ? (
        <Text style={st.day} accessibilityRole="header">
          {day}
        </Text>
      ) : null}
      <View
        style={[st.bubble, m.mine ? st.bubbleMine : st.bubbleThem]}
        accessible
        accessibilityLabel={`${who}${time ? `, ${time}` : ''}: ${m.body}`}
      >
        <Text style={st.bubbleText}>{m.body}</Text>
        {time ? <Text style={[st.bubbleTime, m.mine && st.bubbleTimeMine]}>{time}</Text> : null}
      </View>
    </>
  );
});

const bubbleKey = (r: MsgRow) => r.m.id;

/** The round amber SEND with an up arrow. Same label and disabled state as
 *  the old SEND button. */
function SendButton({ disabled, onPress }: { disabled: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      hitSlop={4}
      style={({ pressed }) => [st.send, disabled && st.sendOff, pressed && !disabled && st.pressed]}
      accessibilityRole="button"
      accessibilityLabel="SEND"
      accessibilityState={{ disabled }}
      aria-disabled={disabled}
    >
      <Text style={[st.sendArrow, disabled && st.sendArrowOff]}>↑</Text>
    </Pressable>
  );
}

function ThreadSheet({
  thread,
  onClose,
  onReload,
  onError,
  onBlocked,
}: {
  thread: ContactThread | null;
  onClose: () => void;
  /** BLOCK / REPORT from the "···" menu use the list's own handlers. */
  onReload: () => Promise<void>;
  onError: (e: string | null) => void;
  onBlocked: (t: ContactThread) => void;
}) {
  const insets = useSafeAreaInsets();
  /**
   * ⛔ THE MODAL STAYS MOUNTED (checker 2026-11-01, the build-36 frozen-screen
   * pattern). This used to `return null` when the thread closed, unmounting
   * the Modal outright. A block from the header's REPORT closes the nested
   * report Modal and this one in the same moment, and an unmounted outer
   * Modal skips DimModal's nested-close hold: on iOS the outer controller
   * stays presented, empty, over the whole app. So the Modal is always
   * mounted and only `visible` follows `thread`; `view` is the last thread
   * shown, so the closing frames still draw it (and the nested report Modal
   * can finish closing first). Nothing renders inside before the first open.
   */
  const lastThread = useRef<ContactThread | null>(thread);
  if (thread) lastThread.current = thread;
  const view = thread ?? lastThread.current;
  const [msgs, setMsgs] = useState<ThreadMessage[]>([]);
  const [body, setBody] = useState('');
  const [err, setErr] = useState<string | null>(null);
  /** Remaining allowance. null = unknown, which must read as ALLOWED. */
  const [allow, setAllow] = useState<ContactAllowance | null>(null);
  /** The header's "···" (BLOCK / REPORT) is open. */
  const [more, setMore] = useState(false);
  // Per conversation (night pass 3, 2026-10-01): this sheet stays mounted
  // across threads, and one shared lock left SEND dead in B — and swallowed
  // the tap — while a send in A was still out.
  const [sendingIn, runSendIn] = useSendingPer();

  // Which conversation is open NOW (bug hunt 2026-09-30). The clear below only
  // helps if nothing lands after it: a slow fetch for conversation A — or the
  // reload after a SEND in A — resolved after A was closed and B opened, and
  // wrote A's messages and A's allowance under B's name. Every await checks.
  const threadId = thread?.id ?? null;
  const openId = useRef<string | null>(threadId);
  openId.current = threadId;
  const sending = sendingIn(threadId);
  /**
   * Unsent replies, per conversation (bug hunt 2026-09-30). Closing the sheet —
   * ‹, Android BACK, a stray tap — wiped whatever had been typed, because the
   * reset below cleared `body` on every open and close. Kept for as long as
   * the Requests tab is mounted; a successful SEND drops its entry.
   */
  const drafts = useRef(new Map<string, string>());
  const editBody = (t: string) => {
    setBody(t);
    if (threadId) drafts.current.set(threadId, t);
  };
  /**
   * ONE COMPOSED MESSAGE, SENT ONCE (toddler hunt 2026-10-14, #11). Per
   * conversation: the message whose SEND has not yet been answered as sent,
   * with its client id and the ids on screen before its first attempt — see
   * features/directory/sendOnce.ts. `msgsFor` says the list on screen is a
   * real read of THIS conversation (a snapshot of anything else proves nothing).
   */
  const pendingSends = useRef(new Map<string, PendingSend>());
  const msgsFor = useRef<string | null>(null);

  // [75] (2026-09-07): a failed message fetch used to render as an empty
  // conversation; surface it instead (the reply box still works).
  /**
   * Only the LATEST read of the open conversation may land (night pass 2,
   * 2026-10-01). The fence above is per conversation, and two reads of the
   * SAME one overlap whenever SEND is tapped before the opening read answers
   * — SEND is live from the first frame. On a slow connection that opening
   * read landed last: the message just sent vanished from the list, and its
   * stale allowance re-enabled SEND under "Wait for a reply" / a spent cap.
   */
  const loadSeq = useRef(0);
  const load = useCallback(async () => {
    if (!thread) return;
    const id = thread.id;
    const seq = ++loadSeq.current;
    // Allowance rides along with the messages so the count is right after
    // every send, and a failure leaves it null (= unknown = allowed).
    // IN PARALLEL (perf hunt 2026-10-03): it was read only after the messages
    // landed — a second full round trip on every open and after every SEND,
    // with the cap notes and SEND's caps a beat behind the conversation. The
    // allowance is still applied only alongside a good message read.
    const [r, a] = await Promise.all([fetchThreadMessages(id), fetchContactAllowance(id)]);
    if (openId.current !== id || seq !== loadSeq.current) return;
    if (!r.ok) {
      setErr(r.error);
      return;
    }
    setErr(null);
    setMsgs(r.rows);
    msgsFor.current = id;
    // Same fence as above (no await between, so it still holds).
    if (openId.current === id && seq === loadSeq.current) setAllow(a);
    // Read up to now — only after the messages were actually SHOWN. The badge
    // drops this conversation only when the server stored the mark (before
    // the read-state migration it cannot, and nothing is claimed).
    void markThreadRead(id).then((ok) => {
      if (ok) markThreadSeen(id);
    });
  }, [thread]);

  // Clear the previous conversation BEFORE fetching the next one (network audit
  // 2026-09-11). This sheet stays mounted across opens, and a failed fetch keeps
  // whatever `msgs` already held — so opening a second conversation offline
  // displayed the FIRST member's messages under the second member's name.
  useEffect(() => {
    setMsgs([]);
    msgsFor.current = null;
    setErr(null);
    setBody(threadId ? (drafts.current.get(threadId) ?? '') : '');
    setAllow(null);
    // On OPEN only: on close the "···" row (and a report Modal still
    // animating away inside it) stays until the thread has slid out.
    if (threadId) setMore(false);
  }, [threadId]);

  useEffect(() => {
    void load();
  }, [load]);

  // BACK FROM THE BACKGROUND, RE-READ (toddler pass 2026-10-13). There is no
  // live feed: a reply that arrived while the app was in the background — the
  // very thing a member alert tells you about — never appeared in the open
  // conversation until it was closed and reopened.
  useEffect(() => {
    if (!threadId) return;
    const sub = AppState.addEventListener('change', (s) => {
      if (s === 'active') void load();
    });
    return () => sub.remove();
  }, [threadId, load]);

  /**
   * FOLLOW THE NEWEST MESSAGE (toddler pass 2026-10-13). The list opened at the
   * OLDEST message and never moved, so in a long conversation the reply you
   * came for — and the message you had just sent — landed below the fold with
   * nothing to say it was there. Pinned to the end on open and after your own
   * SEND; a drag up to read history unpins it, so a re-read never yanks the
   * reader away from what they are reading.
   */
  const listRef = useRef<FlatList<MsgRow>>(null);
  const pinToEnd = useRef(true);
  useEffect(() => {
    pinToEnd.current = true;
  }, [threadId]);

  // Day dividers ride on the messages (TODAY / a weekday / a date).
  const rowsWithDays = useMemo(() => withDays(msgs), [msgs]);
  const otherName = view?.otherDisplayName ?? '';
  const renderMsg = useCallback(
    ({ item }: { item: MsgRow }) => <Bubble m={item.m} day={item.day} who={item.m.mine ? 'You' : otherName} />,
    [otherName],
  );
  /** A BLOCK / REPORT failure shows here, where the person is looking, and on
   *  the list behind. A success never clears this conversation's own error. */
  const modError = useCallback(
    (e: string | null) => {
      if (e) setErr(e);
      onError(e);
    },
    [onError],
  );

  const verifier = !view || view.otherKind === 'member' ? null : VERIFIER_COPY[view.otherKind];
  const pinState = !view ? '' : view.status === 'accepted' ? 'ACCEPTED' : STATUS_LABEL[view.status].toUpperCase();
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
    <Modal accessibilityViewIsModal visible={thread != null} transparent animationType="slide" onRequestClose={onClose}>
      {view ? (
        <KeyboardAvoidingView
          style={st.threadRoot}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          {/* FULL HEIGHT since the 2026-11-01 redesign: the thread fills the
              screen inside the safe area, and the composer keeps the bottom
              inset (SEND used to sit under the home indicator). */}
          <View style={[st.thread, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
            <View style={st.thHead}>
              <Pressable
                onPress={onClose}
                hitSlop={12}
                style={({ pressed }) => [st.back, pressed && st.pressed]}
                accessibilityRole="button"
                accessibilityLabel="Close conversation"
              >
                <Text style={st.backText} maxFontSizeMultiplier={BACK_GLYPH_MAX_SCALE}>‹</Text>
              </Pressable>
              <ChannelBadge
                name={view.otherDisplayName}
                led={view.status === 'accepted' ? 'green' : 'off'}
                steel={view.otherKind !== 'member' && view.otherVerified}
                size={40}
              />
              <View style={st.thWho}>
                <View style={st.whoRow}>
                  <Text accessibilityRole="header" style={st.thName}>
                    {view.otherDisplayName}
                  </Text>
                  {verifier && view.otherVerified ? (
                    <View style={st.verifiedTag} accessible accessibilityLabel={verifier.badgeA11y}>
                      <Text style={st.verifiedTagText}>{verifier.badge}</Text>
                    </View>
                  ) : null}
                </View>
                <Text style={st.thSub}>{view.purposeLabel}</Text>
              </View>
              <MoreButton name={view.otherDisplayName} open={more} onPress={() => setMore((v) => !v)} />
            </View>
            {more ? (
              <View style={st.thMore}>
                <ThreadModeration t={view} onReload={onReload} onError={modError} onBlocked={onBlocked} />
              </View>
            ) : null}
            {err ? (
              <View style={st.thBanner}>
                <Banner tone="warn">{err}</Banner>
              </View>
            ) : null}
            {/* Virtualized 2026-09-11: a conversation grows without bound, and
                every bubble was mounted on open. The request's purpose + opening
                message stay pinned above as the list header. */}
            <View style={st.msgArea}>
              <FlatList
                // ⛔ flexShrink, NEVER flex: 1 on the list itself (evening hunt
                // 2026-10-02) — the TestFlight-32 PreviewSheet trap in
                // MyProfileView. The thread is full height now and `msgArea`
                // owns the space; the list shrinks into it and scrolls.
                style={{ flexShrink: 1 }}
                ref={listRef}
                onContentSizeChange={() => {
                  if (pinToEnd.current) listRef.current?.scrollToEnd({ animated: false });
                }}
                onScrollBeginDrag={() => {
                  pinToEnd.current = false;
                }}
                // Drag the conversation to put the keyboard away — the second
                // escape route, since a multiline Return cannot dismiss it.
                keyboardDismissMode="interactive"
                keyboardShouldPersistTaps="handled"
                data={rowsWithDays}
                keyExtractor={bubbleKey}
                renderItem={renderMsg}
                initialNumToRender={12}
                maxToRenderPerBatch={12}
                windowSize={7}
                contentContainerStyle={st.msgs}
                ListHeaderComponent={
                  <View style={st.pin}>
                    <Text style={st.pinLabel}>{`${view.purposeLabel.toUpperCase()} REQUEST · ${pinState}`}</Text>
                    <Text style={st.pinText}>{view.message}</Text>
                  </View>
                }
              />
            </View>

            <View style={st.composer}>
              <View style={st.composerRow}>
                <TextInput
                  style={st.reply}
                  value={body}
                  onChangeText={editBody}
                  placeholder="Write a reply"
                  placeholderTextColor={C.muted}
                  multiline
                  maxLength={allow?.messageMaxChars ?? 1000}
                  accessibilityLabel="Write a reply"
                />
                <SendButton
                  disabled={
                    !thread ||
                    sending ||
                    !body.trim() ||
                    allow?.awaitingReply === true ||
                    allow?.messagesLeftHereToday === 0 ||
                    allow?.messagesLeftToday === 0 ||
                    allow?.messagesLeftThisWeek === 0
                  }
                  onPress={() => {
                    // Closing (the thread slides out with `view`): nothing to send to.
                    if (!thread) return;
                    // What this press sent (bug hunt 2026-09-30, pass 2). The box
                    // stays editable while SEND is out, and a success cleared it
                    // outright — whatever was typed during a slow send was wiped,
                    // draft included. Only the text that was actually sent is cleared.
                    const sentRaw = body;
                    // …and the sent text is cleared even when more was typed after it
                    // (bug hunt 2026-09-30, pass 3). Pass 2 kept the WHOLE box in that
                    // case — the message already delivered plus the new words — so the
                    // next SEND delivered the first message a second time.
                    const unsent = (cur: string) =>
                      cur.startsWith(sentRaw) ? cur.slice(sentRaw.length).replace(/^\s+/, '') : cur;
                    // #11: the same text again is a RETRY of the same message — same
                    // client id, and the first attempt's snapshot. A retry re-reads
                    // first: if that attempt already landed (it timed out here but
                    // the server stored it), it is answered as sent, not sent twice.
                    const { pending, retry } = pendingFor(
                      pendingSends.current.get(thread.id),
                      sentRaw.trim(),
                      msgsFor.current === thread.id ? new Set(msgs.map((m) => m.id)) : null,
                      () => Crypto.randomUUID(),
                    );
                    pendingSends.current.set(thread.id, pending);
                    const sendOnce = async () => {
                      if (retry && pending.knownIds) {
                        const seen = await fetchThreadMessages(thread.id);
                        if (seen.ok && landedAlready(pending, seen.rows)) return { ok: true } as const;
                      }
                      // `pending.clientId` goes to the server (Comp A #11, live
                      // 2026-10-23): a repeat id saves nothing. sendThreadMessage
                      // falls back to the 2-argument call on a server without it.
                      return sendThreadMessage(thread.id, pending.body, pending.clientId);
                    };
                    runSendIn(thread.id, () =>
                      sendOnce().then(async (r) => {
                        if (r.ok && pendingSends.current.get(thread.id) === pending) {
                          pendingSends.current.delete(thread.id);
                        }
                        // `thread` is the one this press was made in.
                        const draft = drafts.current.get(thread.id);
                        if (r.ok && draft !== undefined) {
                          const rest = unsent(draft);
                          if (rest) drafts.current.set(thread.id, rest);
                          else drafts.current.delete(thread.id);
                        }
                        // Closed or switched while it was out: this answer is about
                        // a conversation no longer on screen — its error must not
                        // land on the next one, nor its clear wipe that one's draft.
                        if (openId.current !== thread.id) return;
                        if (!r.ok) return setErr(r.error);
                        setErr(null);
                        setBody(unsent);
                        pinToEnd.current = true; // show the message just sent
                        await load();
                      }),
                    );
                  }}
                />
              </View>

              {/* ── SAY THE LIMIT BEFORE THE WALL (owner 2026-09-19) ───────────
                  Every cap here used to be discovered by hitting it. `allow` is
                  null when the read failed, and null must read as ALLOWED — the
                  server is the enforcement, and guessing "blocked" on a dropped
                  connection would lock someone out of their own conversation. */}
              {/* SEND is disabled on THREE caps, and only the per-conversation one
                  had a sentence — the other two produced a dead button and no
                  explanation. All three windows are ROLLING on the server, so none
                  of them "resets tomorrow". */}
              {allow?.awaitingReply ? (
                <Text style={st.allowance}>
                  Wait for a reply before sending more.
                </Text>
              ) : allow?.messagesLeftThisWeek === 0 ? (
                <Text style={st.allowance}>
                  No messages left this week. You can send another one 7 days after your oldest recent message.
                </Text>
              ) : allow?.messagesLeftToday === 0 ? (
                <Text style={st.allowance}>
                  No messages left today across all conversations. You can send another one 24 hours
                  after your oldest recent message.
                </Text>
              ) : allow && allow.messagesLeftHereToday <= 3 ? (
                <Text style={st.allowance}>
                  {allow.messagesLeftHereToday === 0
                    ? 'No replies left in this conversation for now. You can send another one 24 hours after your oldest recent reply.'
                    : `${allow.messagesLeftHereToday} ${allow.messagesLeftHereToday === 1 ? 'reply' : 'replies'} left in this conversation today.`}
                </Text>
              ) : null}
            </View>
          </View>
        </KeyboardAvoidingView>
      ) : null}
    </Modal>
  );
}

const st = StyleSheet.create({
  // Tablet (owner 2026-09-29): card column, centred. No-op on a phone.
  body: { paddingHorizontal: 18, paddingTop: 10, paddingBottom: 40, ...cardColumn },
  footer: { marginTop: 18 },
  pressed: { opacity: 0.7 },

  // ── inbox ──
  sec: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 6, marginBottom: 2 },
  secGap: { marginTop: 22 },
  secText: { fontFamily: fonts.oswaldMedium, fontSize: 11.5, letterSpacing: 1.8, color: C.muted },
  secCount: { fontFamily: fonts.oswaldSemiBold, fontSize: 12, color: colors.amber },
  ib: { flexDirection: 'row', gap: 12, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: C.line },
  ibBody: { flex: 1, minWidth: 0 },
  topRight: { flexDirection: 'row', alignItems: 'center', gap: 4, marginLeft: 8, marginTop: 3 },
  time: { fontFamily: fonts.mono, fontSize: 10.5, color: C.muted },
  // 28 × 24 + a 12-pt slop all round = 52 × 48: the only way to BLOCK / REPORT.
  more: { minWidth: 28, minHeight: 24, alignItems: 'center', justifyContent: 'center' },
  moreText: { fontFamily: fonts.barlowSemiBold, fontSize: 18, lineHeight: 20, letterSpacing: 1, color: C.sub },
  moreTextOn: { color: colors.amber },
  purpose: { fontFamily: fonts.barlowSemiBold, fontSize: 12, color: colors.amber, marginTop: 1 },
  preview: { fontFamily: fonts.barlowRegular, fontSize: 13.5, lineHeight: 19, color: C.sub, marginTop: 4 },
  previewNew: { color: C.text },
  state: { fontFamily: fonts.mono, fontSize: 10.5, letterSpacing: 0.5, color: C.muted, marginTop: 6 },
  openLink: { alignSelf: 'flex-start', paddingVertical: 6, marginTop: 2 },
  openLinkText: { fontFamily: fonts.oswaldMedium, fontSize: 11.5, letterSpacing: 1.2, color: colors.amber },
  actions: { flexDirection: 'row', gap: 8, marginTop: 10 },
  pill: { borderRadius: 10, paddingVertical: 8, paddingHorizontal: 16, borderWidth: 1 },
  pillYes: { backgroundColor: colors.green, borderColor: colors.green },
  pillNo: { backgroundColor: 'transparent', borderColor: C.line2 },
  pillOff: { opacity: 0.45 },
  pillText: { fontFamily: fonts.oswaldMedium, fontSize: 12.5, letterSpacing: 1.25 },
  pillTextYes: { color: '#07130a' },
  pillTextNo: { color: C.sub },

  // ── who ──
  name: { fontFamily: fonts.oswaldSemiBold, fontSize: 16.5, letterSpacing: 0.3, color: C.text, flexShrink: 1 },
  whoWrap: { gap: 2 },
  whoTop: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  whoRow: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  verifiedTag: {
    borderWidth: 1,
    borderColor: 'rgba(159,180,200,.45)',
    backgroundColor: 'rgba(159,180,200,.08)',
    borderRadius: 5,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  verifiedTagText: {
    fontFamily: fonts.mono,
    fontSize: 9.5,
    letterSpacing: 0.8,
    color: STEEL,
  },
  whoSite: { fontFamily: fonts.mono, fontSize: 11, color: C.muted },
  pageLink: { alignSelf: 'flex-start', paddingVertical: 4 },
  pageLinkText: { fontFamily: fonts.oswaldMedium, fontSize: 11, letterSpacing: 1.2, color: colors.amber },

  // ── BLOCK / REPORT row (behind "···") ──
  row: { flexDirection: 'row', alignItems: 'center', gap: 18, marginTop: 4 },
  link: { minHeight: 44, justifyContent: 'center' },
  linkText: { fontFamily: fonts.oswaldSemiBold, fontSize: 11.5, letterSpacing: 1.3, color: C.sub },

  // ── report sheet ──
  sheetRoot: { flex: 1, backgroundColor: 'rgba(0,0,0,.75)', justifyContent: 'flex-end' },
  sheet: {
    // Tablet (owner 2026-09-29): the sheet rides centred at the card column
    // instead of spanning a 1024 pt iPad. No-op on a phone.
    ...cardColumn,
    backgroundColor: C.panel,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    borderWidth: 1,
    borderColor: C.line,
    padding: 14,
  },
  sheetTitle: { fontFamily: fonts.oswaldSemiBold, fontSize: 13, letterSpacing: 2, color: colors.amberLabel },
  input: {
    backgroundColor: C.bg,
    borderWidth: 1,
    borderColor: C.line2,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontFamily: fonts.barlowRegular,
    fontSize: 15,
    color: C.text,
    marginTop: 10,
    minHeight: 48,
  },

  // ── conversation ──
  threadRoot: { flex: 1, backgroundColor: C.bg },
  thread: { flex: 1, ...cardColumn, backgroundColor: C.bg },
  thHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingTop: 6,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: C.line,
  },
  // Never squeezed by a long name or large text (largeTextLayout 2026-10-15).
  back: { minWidth: 28, minHeight: 44, justifyContent: 'center', flexShrink: 0 },
  backText: { fontFamily: fonts.barlowMedium, fontSize: 28, lineHeight: 32, color: C.sub },
  thWho: { flex: 1, minWidth: 0 },
  thName: { fontFamily: fonts.oswaldSemiBold, fontSize: 16, letterSpacing: 0.3, color: C.text, flexShrink: 1 },
  thSub: { fontFamily: fonts.barlowRegular, fontSize: 12, color: C.muted, marginTop: 1 },
  thMore: { paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: C.line },
  thBanner: { paddingHorizontal: 16, paddingTop: 10 },
  msgArea: { flex: 1 },
  msgs: { paddingHorizontal: 16, paddingTop: 14, paddingBottom: 14 },
  pin: {
    backgroundColor: C.panel,
    borderWidth: 1,
    borderColor: C.line,
    borderLeftWidth: 3,
    borderLeftColor: colors.amber,
    borderRadius: 12,
    paddingVertical: 11,
    paddingHorizontal: 13,
    marginBottom: 6,
  },
  pinLabel: { fontFamily: fonts.oswaldMedium, fontSize: 11, letterSpacing: 1.5, color: colors.amber },
  pinText: { fontFamily: fonts.barlowRegular, fontSize: 13.5, lineHeight: 19.5, color: C.sub, marginTop: 4 },
  day: {
    alignSelf: 'center',
    fontFamily: fonts.mono,
    fontSize: 10,
    letterSpacing: 1.2,
    color: C.muted,
    marginTop: 14,
    marginBottom: 6,
  },
  bubble: {
    maxWidth: '80%',
    paddingVertical: 10,
    paddingHorizontal: 13,
    borderRadius: 16,
    borderWidth: 1,
    marginTop: 8,
  },
  bubbleThem: { alignSelf: 'flex-start', backgroundColor: C.raised, borderColor: C.line2, borderBottomLeftRadius: 5 },
  bubbleMine: { alignSelf: 'flex-end', backgroundColor: C.mineBg, borderColor: C.mineBorder, borderBottomRightRadius: 5 },
  bubbleText: { fontFamily: fonts.barlowRegular, fontSize: 14.5, lineHeight: 20.5, color: C.text },
  bubbleTime: { fontFamily: fonts.mono, fontSize: 9.5, color: C.muted, marginTop: 4 },
  bubbleTimeMine: { textAlign: 'right', color: C.mineTime },
  composer: {
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 12,
    borderTopWidth: 1,
    borderTopColor: C.line,
    backgroundColor: C.bg,
  },
  composerRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 10 },
  reply: {
    flex: 1,
    backgroundColor: C.panel,
    borderWidth: 1,
    borderColor: C.line2,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingTop: 11,
    paddingBottom: 11,
    fontFamily: fonts.barlowRegular,
    fontSize: 14.5,
    color: C.text,
    minHeight: 44,
    maxHeight: 132,
  },
  send: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.amber,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 1,
  },
  sendOff: { backgroundColor: C.line2 },
  sendArrow: { fontSize: 19, fontWeight: '700', color: '#111', lineHeight: 22 },
  sendArrowOff: { color: C.muted },
  allowance: { fontFamily: fonts.mono, fontSize: 10.5, lineHeight: 15, color: C.muted, marginTop: 7, paddingLeft: 4 },
});
