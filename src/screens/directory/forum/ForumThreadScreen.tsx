/**
 * A thread (approved mockup, screens 4 and 0b).
 *
 * In a Q&A category the Solution is pinned first and Helpful lifts the replies
 * under it; a discussion keeps time order. Order is applied when the thread is
 * read, never on a tap, so a post does not jump away from the finger. Reactions
 * are Helpful, Thanks and Insightful: there is no down anywhere.
 *
 * What the author alone sees (being reviewed, removed, the rule and the
 * excerpt) comes from `moderationFace` and appears on their own posts.
 */
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { FlatList, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import * as Crypto from 'expo-crypto';
import { confirmDialog, notify } from '../../../lib/confirm';
import { useLatchedPress } from '../../../lib/latch';
import { runSoon } from '../../../lib/afterInteractions';
import { safeGoBack } from '../../../lib/safeGoBack';
import { fonts } from '../../../theme/tokens';
import {
  POSTS_PAGE,
  blockPostAuthor,
  deletePost,
  fetchMyAppeals,
  fetchThread,
  flagSafety,
  markRead,
  markSolution,
  reactToPost,
  resolveCorrection,
  setBookmark,
  setTopicFollow,
  submitPost,
  voteIdea,
  type FollowLevel,
  type ForumPost,
  type ForumThread,
} from '../../../features/forum/api';
import { amIForumAdmin, setTopicFlags } from '../../../features/forum/adminApi';
import { clearDraft, draftOwner, draftOwnerStale, readDraft, saveDraft } from '../../../features/forum/drafts';
import { beginFlag, endFlag, flaggedPostIds } from '../../../features/forum/flaggedPosts';
import {
  clientIdFor,
  forgetClientId,
  forgetLandedPost,
  landedAs,
  onReplyLanded,
  postFingerprint,
  replyLandedSeen,
  settleClientId,
} from '../../../features/forum/postOnce';
import { rulesAgreed, useForumFlags } from '../../../features/forum/forumFlags';
import { searchDirectory } from '../../../features/directory/api';
import { GlossaryLinkProvider } from '../../../features/glossary/glossaryLink';
import {
  ANNOUNCEMENTS_SLUG,
  ASK_SLUG,
  BODY_MAX,
  PRO_LOUNGE_REFUSAL,
  appealSent,
  applyMention,
  badgeName,
  canReportOrBlock,
  correctionFace,
  draftKey,
  editAllowed,
  firstName,
  firstPostHint,
  jumpStep,
  hiddenOutcomeNote,
  levelMark,
  mentionMatches,
  mentionPeople,
  mentionQuery,
  mentionTokensIn,
  monthYear,
  moderationFace,
  orderPosts,
  outcomeKind,
  parseAskBody,
  quoteExcerpt,
  readMarkPostId,
  refusalNeedsProfile,
  RULES_NOT_SAVED,
  asksForRules,
  canStartReply,
  quoteLine,
  replyBlock,
  replyDraftRead,
  replyDraftText,
  solutionMarkedBy,
  solutionMarker,
  threadMentionNames,
  trackedFace,
  timeAgo,
  tomorrowMorning,
  unsentRemainder,
  withCorrection,
  withQuote,
  type MentionPerson,
} from '../../../features/forum/rules';
import type { ReactionKind } from '../../../features/forum/types';
import { useForumRead } from '../../../features/forum/useForumRead';
import { useReloadOnReturn } from '../../../features/forum/useReloadOnReturn';
import { WELCOME_AUTHOR, WELCOME_DATE, WELCOME_PARAGRAPHS, WELCOME_TITLE } from '../../../features/forum/welcome';
import { useSendingPer } from '../directoryBits';
import { ChannelBadge } from '../ChannelBadge';
import {
  AuthorPlate,
  Bold,
  F,
  ForumLoading,
  ForumUnreadable,
  LockedNotice,
  MenuPopup,
  ModCard,
  MoreKey,
  NewMark,
  PinStamp,
  SampleStamp,
  StaleNote,
  StatusStamp,
  ThreadHeader,
  ForumEmpty,
  forumStyles,
  openMyProfile,
  type MenuItem,
} from './forumBits';
import { AppealPopup, ReportPopup, RulesPopup } from './forumPopups';
import { LabCard, PostBody } from './PostBody';

type Params = { topicId?: string; welcome?: boolean; jumpTo?: string; unread?: boolean };
type Nav = {
  navigate: (route: string, params?: Record<string, unknown>) => void;
  push?: (route: string, params?: Record<string, unknown>) => void;
};

/** RN-web draws a two-row textarea by default; the box starts one line tall. */
const ONE_ROW = Platform.OS === 'web' ? ({ rows: 1 } as object) : {};

const REACTIONS: { kind: ReactionKind; label: string; count: (p: ForumPost) => number }[] = [
  { kind: 'helpful', label: 'Helpful', count: (p) => p.helpfulCount },
  { kind: 'thanks', label: 'Thanks', count: (p) => p.thanksCount },
  { kind: 'insightful', label: 'Insightful', count: (p) => p.insightfulCount },
];

/** The mockup's ANNOUNCEMENTS strip, with the amber pin. */
const ANNOUNCEMENTS_LABEL = '📌 ANNOUNCEMENTS';
/** Pages read past the first, at most, to reach the end of a long thread. */
const MAX_LATER_PAGES = 10;
const LATER_UNREAD = 'The next posts could not be loaded. Check your connection and try again.';

/** The first page and the pages after it, once each (a post that moved to the
 *  next page between reads is not drawn twice). */
function mergePosts(first: ForumPost[], later: ForumPost[]): ForumPost[] {
  const seen = new Set(first.map((p) => p.id));
  return [...first, ...later.filter((p) => !seen.has(p.id))];
}

const SAFETY_NOTE =
  'Safety note: this reply touches on AC power, rigging or hearing. Check with a qualified professional before you act on it.';

export function ForumThreadScreen() {
  const route = useRoute();
  const { topicId, welcome, jumpTo, unread } = (route.params ?? {}) as Params;
  if (welcome) return <LocalWelcome />;
  // No topic id (an answer that did not say which topic): say so, never the
  // founder's welcome in its place (bug pass 2, S-1).
  if (!topicId) return <NoTopic />;
  return (
    <GlossaryLinkProvider>
      {/* key: a thread opened over another (a forum tap, a link in a post)
          starts fresh, never with the last one's posts, draft or marks. */}
      <Thread key={topicId} topicId={topicId} jumpTo={jumpTo ?? null} unreadMark={!!unread} />
    </GlossaryLinkProvider>
  );
}

function NoTopic() {
  return (
    <View style={forumStyles.root}>
      <ThreadHeader label="" />
      <ForumEmpty title="This topic could not be opened" text="Go back and open it from the list of topics." />
    </View>
  );
}

/** 0b before the owner's pinned post exists on the server: the same words. */
function LocalWelcome() {
  const navigation = useNavigation() as unknown as Nav;
  return (
    <View style={forumStyles.root}>
      <ThreadHeader label={ANNOUNCEMENTS_LABEL} title={WELCOME_TITLE} />
      <FlatList
        data={[0]}
        keyExtractor={String}
        contentContainerStyle={st.msgs}
        renderItem={() => (
          <View style={st.post}>
            <View style={st.who}>
              <ChannelBadge name={badgeName(WELCOME_AUTHOR)} led="off" steel size={30} />
              <Text style={st.nm}>{WELCOME_AUTHOR}</Text>
              <PinStamp />
              <Text style={st.tm}>{WELCOME_DATE}</Text>
            </View>
            {WELCOME_PARAGRAPHS.map((p) => (
              <Text key={p} style={st.body}>
                {p}
              </Text>
            ))}
          </View>
        )}
      />
      <AnnouncementsNotice onAsk={() => navigation.navigate('ForumCategory', { slug: ASK_SLUG })} />
    </View>
  );
}

function AnnouncementsNotice({ onAsk }: { onAsk: () => void }) {
  return (
    <LockedNotice solid>
      Announcements are posted by the Academy. Reply with your questions in{' '}
      <Bold onPress={onAsk}>Ask the Community</Bold>.
    </LockedNotice>
  );
}

function Thread({ topicId, jumpTo, unreadMark }: { topicId: string; jumpTo: string | null; unreadMark: boolean }) {
  const navigation = useNavigation() as unknown as Nav;
  const insets = useSafeAreaInsets();
  const list = useRef<FlatList<ForumPost>>(null);

  const read = useForumRead<ForumThread>(() => fetchThread(topicId), [topicId]);
  const topic = read.value?.topic ?? null;
  const qa = topic?.categoryKind === 'qa';
  const announcements = topic?.categorySlug === ANNOUNCEMENTS_SLUG;

  /** Ordered once per read (see the header): a tap never reorders the thread. */
  const [posts, setPosts] = useState<ForumPost[]>([]);
  /**
   * Posts past the first page (bug pass 2026-11-08, CODE-1-08). Read by SHOW
   * MORE POSTS, after a reply in a long thread (so the member sees it land),
   * and to reach a tapped alert's post.
   */
  const [later, setLater] = useState<ForumPost[]>([]);
  const [laterFull, setLaterFull] = useState<boolean | null>(null);
  const value = read.value;
  /** Every post read so far: what `posts` holds from the next render on. */
  const readAll = useMemo(() => (value ? mergePosts(value.posts, later) : []), [value, later]);
  /** A tap's answer written into the read itself (patchPost): drawn in place,
   *  never reordered, and never undone by the next SHOW MORE (CODE-2-04). */
  const patching = useRef(false);
  // Drawn from the same merge, ordered on the read (never on a tap).
  useEffect(() => {
    if (value && patching.current) {
      patching.current = false;
      const byId = new Map(mergePosts(value.posts, later).map((p) => [p.id, p]));
      setPosts((rows) => rows.map((p) => byId.get(p.id) ?? p));
      return;
    }
    if (value) setPosts(orderPosts(mergePosts(value.posts, later), value.topic.categoryKind === 'qa'));
  }, [value, later]);
  const valueNow = useRef(value);
  valueNow.current = value;
  const laterNow = useRef(later);
  laterNow.current = later;
  /** Change one post where it was read: the first page, else the later pages. */
  const patchPost = useCallback(
    (id: string, fn: (p: ForumPost) => ForumPost) => {
      const onFirst = !!valueNow.current?.posts.some((p) => p.id === id);
      const onLater = laterNow.current.some((p) => p.id === id);
      if (!onFirst && !onLater) return;
      patching.current = true;
      if (onFirst) read.patch((v) => ({ ...v, posts: v.posts.map((p) => (p.id === id ? fn(p) : p)) }));
      else setLater((l) => l.map((p) => (p.id === id ? fn(p) : p)));
    },
    [read],
  );
  const hasMore = !!value && value.posts.length >= POSTS_PAGE && laterFull !== false;

  /** Pages from `from`: one, or every page to the end. Null when one failed. */
  const readPages = useCallback(
    async (from: number, all: boolean): Promise<{ posts: ForumPost[]; full: boolean } | null> => {
      const got: ForumPost[] = [];
      let offset = from;
      for (let i = 0; i < MAX_LATER_PAGES; i++) {
        const r = await fetchThread(topicId, offset);
        if (!r.ok) return null;
        got.push(...r.value.posts);
        const full = r.value.posts.length >= POSTS_PAGE;
        if (!all || !full) return { posts: got, full };
        offset += POSTS_PAGE;
      }
      return { posts: got, full: true };
    },
    [topicId],
  );
  const readToEnd = useCallback(async (): Promise<boolean> => {
    const r = await readPages(POSTS_PAGE, true);
    if (!r) return false;
    setLater(r.posts);
    setLaterFull(r.full);
    return true;
  }, [readPages]);
  /**
   * Read again after a write (delete, block, report, a Solution mark, back
   * from Edit): the later pages too, so a deleted or blocked post past the
   * first page does not stay drawn (CODE-2-03). A failed later read drops
   * them (SHOW MORE POSTS reads them again) rather than keep a stale copy.
   */
  const refreshLater = useCallback(async () => {
    if (laterNow.current.length === 0) return;
    if (!(await readToEnd())) {
      setLater([]);
      setLaterFull(null);
    }
  }, [readToEnd]);
  const reloadAll = useCallback(async () => {
    await read.reload();
    await refreshLater();
  }, [read, refreshLater]);
  const [loadingMore, setLoadingMore] = useState(false);
  const showMore = useLatchedPress(async () => {
    setLoadingMore(true);
    const r = await readPages(POSTS_PAGE + later.length, false);
    setLoadingMore(false);
    if (!r) {
      notify('Could not load', LATER_UNREAD);
      return;
    }
    setLater((l) => [...l, ...r.posts]);
    setLaterFull(r.full);
  });

  // The thread has been seen: clear its unread mark once.
  const marked = useRef(false);
  useEffect(() => {
    if (!value || marked.current) return;
    marked.current = true;
    // The newest post read, never the last one in reading order (a Q&A thread
    // is ordered by Helpful): see readMarkPostId.
    void markRead(topicId, readMarkPostId(value.posts, value.posts.length < POSTS_PAGE));
  }, [value, topicId]);

  // Back from Edit and Repost.
  useReloadOnReturn(reloadAll);

  /** Everyone in this thread: who @ can suggest, and whose mentions are drawn. */
  const people = useMemo<MentionPerson[]>(
    () => [
      ...posts
        .filter((p) => !p.isMine && p.author.token)
        .map((p) => ({ name: p.author.name, token: p.author.token as string })),
      // People the posts mention, once the server says who (SERVER_GAPS row 17).
      ...posts.flatMap((p) => p.mentions),
    ],
    [posts],
  );
  const names = useMemo(() => threadMentionNames(posts), [posts]);
  const mineIds = useMemo(() => new Set(posts.filter((p) => p.isMine).map((p) => p.id)), [posts]);
  /** Who wrote each post, so a quote says who said it (UI-2-09). */
  const authorOf = useMemo(() => new Map(posts.map((p) => [p.id, p.author.name])), [posts]);
  /** My forum name, from a post of mine in this thread: MARKED BY YOU (UI-1-12). */
  const myName = useMemo(() => posts.find((p) => p.isMine)?.author.name ?? null, [posts]);

  // Open at the first unread post, or at a bookmarked one. A post past the
  // first page is read first, once (CODE-1-08).
  const jumped = useRef(false);
  const jumpRead = useRef(false);
  /** The read for a jump is out: nothing else may decide the jump meanwhile. */
  const jumpReading = useRef(false);
  const [jumpLanded, setJumpLanded] = useState(0);
  useEffect(() => {
    if (jumped.current) return undefined;
    const step = jumpStep({
      jumpTo,
      shown: posts,
      read: readAll,
      hasMore,
      triedRead: jumpRead.current,
      reading: jumpReading.current,
    });
    if (step.kind === 'wait') return undefined;
    if (step.kind === 'read') {
      jumpRead.current = true;
      jumpReading.current = true;
      // Runs again once the later posts landed (jumpLanded); a failure
      // decides on what is there.
      void readToEnd().then(() => {
        jumpReading.current = false;
        setJumpLanded((n) => n + 1);
      });
      return undefined;
    }
    jumped.current = true;
    if (step.kind === 'top') return undefined;
    const soon = runSoon(() => list.current?.scrollToIndex({ index: step.index, animated: false, viewPosition: 0 }));
    return () => soon.cancel();
  }, [hasMore, jumpTo, jumpLanded, posts, readAll, readToEnd]);
  // A forum tap for THIS thread while it is open swaps only the route's
  // params: read again and jump to the new post (CODE-2-02).
  const lastJump = useRef(jumpTo);
  useEffect(() => {
    if (lastJump.current === jumpTo) return;
    lastJump.current = jumpTo;
    jumped.current = false;
    jumpRead.current = false;
    jumpReading.current = true;
    void reloadAll().then(() => {
      jumpReading.current = false;
      setJumpLanded((n) => n + 1);
    });
  }, [jumpTo, reloadAll]);

  const [isAdmin, setIsAdmin] = useState(false);
  useEffect(() => {
    let alive = true;
    void amIForumAdmin().then((yes) => {
      if (alive) setIsAdmin(yes);
    });
    return () => {
      alive = false;
    };
  }, []);

  /* ── Reactions: the count comes from the server's answer ─────────── */
  const [reacting, runReact] = useSendingPer();
  const react = useCallback(
    (post: ForumPost, kind: ReactionKind) => {
      const on = !post.myReactions.includes(kind);
      runReact(`${post.id}:${kind}`, async () => {
        const r = await reactToPost(post.id, kind, on);
        if (!r.ok) {
          notify('Not saved', r.error);
          return;
        }
        patchPost(post.id, (p) => ({
          ...p,
          helpfulCount: r.value.helpful,
          thanksCount: r.value.thanks,
          insightfulCount: r.value.insightful,
          myReactions: on ? [...p.myReactions.filter((k) => k !== kind), kind] : p.myReactions.filter((k) => k !== kind),
        }));
      });
    },
    [patchPost, runReact],
  );

  /* ── The reply box ───────────────────────────────────────────────── */
  const [draft, setDraft] = useState('');
  const [quote, setQuote] = useState<{ postId: string; excerpt: string; name: string } | null>(null);
  const [correcting, setCorrecting] = useState<{ postId: string; name: string } | null>(null);
  const [sendError, setSendError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const clientId = useRef<string | null>(null);
  /** Scroll to the end once laid out: true, or once this post is in the list. */
  const pinToEnd = useRef<true | string | null>(null);
  const recheck = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(
    () => () => {
      if (recheck.current) clearTimeout(recheck.current);
    },
    [],
  );
  const flags = useForumFlags();
  const [rulesOpen, setRulesOpen] = useState(false);

  /* ── Draft saved ─────────────────────────────────────────────────── */
  const draftName = draftKey({ topicId });
  /** Whose draft this is: a write after a sign-out or the account wipe would
   *  land in the next member's store, so it is dropped (CODE-2-06). */
  const owner = useRef(draftOwner());
  const typed = useRef(false);
  const [draftSaved, setDraftSaved] = useState(false);
  useEffect(() => {
    let live = true;
    void readDraft(draftName).then((stored) => {
      if (!live || !stored || typed.current) return;
      // The words, what they quote or correct, and the id of a send that may
      // have landed: the same reply sent again lands once (CODE-1-05 a/b).
      const got = replyDraftRead(stored);
      setDraft(got.body);
      setQuote(got.quote);
      setCorrecting(got.correcting);
      clientId.current = got.clientId;
    });
    return () => {
      live = false;
    };
  }, [draftName]);
  /** Typed but not yet written: kept on the way out (CODE-1-22). */
  const unsaved = useRef<{ name: string; text: string } | null>(null);
  /** The pending write: cleared by a send, which writes the draft itself. */
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (!typed.current) return undefined;
    let live = true;
    const text = replyDraftText({ body: draft, quote, correcting, clientId: null });
    unsaved.current = { name: draftName, text };
    const t = setTimeout(() => {
      saveTimer.current = null;
      unsaved.current = null;
      if (draftOwnerStale(owner.current)) return;
      void saveDraft(draftName, text).then((ok) => {
        if (live) setDraftSaved(ok && !!draft.trim());
      });
    }, 800);
    saveTimer.current = t;
    return () => {
      live = false;
      clearTimeout(t);
    };
  }, [correcting, draft, draftName, quote]);
  // An immediate BACK keeps the last words typed: the timer above dies with
  // the screen, so the write happens here. Never after the account changed:
  // a forced sign-out unmounts this screen AFTER the wipe (CODE-2-06).
  useEffect(
    () => () => {
      if (draftOwnerStale(owner.current)) return;
      const last = unsaved.current;
      if (last) void saveDraft(last.name, last.text);
    },
    [],
  );
  const typeDraft = useCallback((text: string) => {
    typed.current = true;
    // A retry keeps its id so it lands once; a CHANGED draft is a new post.
    clientId.current = null;
    setDraft(text);
  }, []);
  /** A new quote or correction target is a changed reply too. A quote and a
   *  correction are about the same post, or only the newest is kept (UI-2-01). */
  const targets = useRef({ quote, correcting });
  targets.current = { quote, correcting };
  const quoteFor = useCallback((next: { postId: string; excerpt: string; name: string } | null) => {
    typed.current = true;
    clientId.current = null;
    const t = withQuote(targets.current, next);
    setQuote(t.quote);
    setCorrecting(t.correcting);
  }, []);
  const correctFor = useCallback((next: { postId: string; name: string } | null) => {
    typed.current = true;
    clientId.current = null;
    const t = withCorrection(targets.current, next);
    setQuote(t.quote);
    setCorrecting(t.correcting);
  }, []);
  /** What is in the box now, for a send that lands later (CODE-2-01). */
  const draftNow = useRef(draft);
  draftNow.current = draft;
  /** This box's reply as it would be sent now, for a reply that landed elsewhere. */
  const mineNow = useRef<string | null>(null);
  mineNow.current = draft.trim()
    ? postFingerprint(`reply:${topicId}`, {
        body: draft.trim(),
        quote: quote?.postId ?? null,
        correctionOf: correcting?.postId ?? null,
      })
    : null;
  // The same reply was seen to land from another box (another copy of this
  // thread on the stack): drop it here too, so it cannot go out twice (N1).
  useEffect(
    () =>
      onReplyLanded((fingerprint) => {
        if (fingerprint !== mineNow.current) return;
        if (saveTimer.current) clearTimeout(saveTimer.current);
        saveTimer.current = null;
        unsaved.current = null;
        typed.current = false;
        clientId.current = null;
        setDraft('');
        setDraftSaved(false);
        setQuote(null);
        setCorrecting(null);
      }),
    [],
  );
  /** Still on screen: a reply's answer that lands here was SEEN (CODE-1-05 d). */
  const onScreen = useRef(true);
  useEffect(() => {
    onScreen.current = true;
    return () => {
      onScreen.current = false;
    };
  }, []);

  /* ── @mentions ───────────────────────────────────────────────────── */
  const mention = mentionQuery(draft);
  const [found, setFound] = useState<MentionPerson[]>([]);
  useEffect(() => {
    if (mention === null || mention.length < 2) {
      setFound([]);
      return undefined;
    }
    let live = true;
    const t = setTimeout(() => {
      void searchDirectory({ q: mention }).then((r) => {
        if (live) setFound(r.status === 'ok' ? r.results.map((m) => ({ name: m.displayName, token: m.publicToken })) : []);
      });
    }, 300);
    return () => {
      live = false;
      clearTimeout(t);
    };
  }, [mention]);
  /** People picked from the directory search: kept until the post is sent, so
   *  the next search (which no longer finds "Maya R. what…") cannot drop them. */
  const [picked, setPicked] = useState<MentionPerson[]>([]);
  const allPeople = useMemo(() => mentionPeople(people, picked, found), [found, people, picked]);
  const suggestions = mention === null ? [] : mentionMatches(mention, allPeople);

  const sendNow = useCallback(async () => {
    const body = draft.trim();
    if (!body) return;
    // What this press sends: words typed while it is out are kept (CODE-2-01).
    const sentRaw = draft;
    const sentQuote = quote?.postId ?? null;
    const sentCorrection = correcting?.postId ?? null;
    setSending(true);
    setSendError(null);
    // The same id for the same reply, from this box or a reopened one (a draft
    // restored after leaving mid-send): it lands once (CODE-1-05).
    const fingerprint = postFingerprint(`reply:${topicId}`, {
      body,
      quote: quote?.postId ?? null,
      correctionOf: correcting?.postId ?? null,
    });
    const cid = clientIdFor(fingerprint, clientId.current, () => Crypto.randomUUID());
    clientId.current = cid;
    // The draft keeps the id until the answer is in: a send cut off by leaving
    // or by an app restart lands once when the restored draft is sent again.
    // The pending timer would write the draft WITHOUT the id: it goes first.
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = null;
    unsaved.current = null;
    await saveDraft(draftName, replyDraftText({ body: draft, quote, correcting, clientId: cid }));
    const r = await submitPost({
      body,
      clientId: cid,
      topicId,
      quotePostId: quote?.postId,
      quoteExcerpt: quote?.excerpt,
      correctionOf: correcting?.postId,
      mentionTokens: mentionTokensIn(body, allPeople),
    });
    setSending(false);
    if (!r.ok) {
      setSendError(r.error);
      // The server has no agreement for this account (its rules check is on):
      // I AGREE records it there, then this reply is sent.
      if (asksForRules(r.code)) setRulesOpen(true);
      return;
    }
    // Seen land here: every open box holding this reply drops it, then the id
    // is released, so the same words later are a new reply. Not seen (the
    // thread was left): kept, for the restored draft (CODE-1-05 d, N1).
    if (onScreen.current) replyLandedSeen(fingerprint);
    else settleClientId(fingerprint, false);
    // Deleting this reply later frees its id: the same words again are a new
    // reply, never the deleted one (CODE-2-07).
    landedAs(fingerprint, r.value.postId);
    clientId.current = null;
    setPicked([]);
    // Only what was sent is cleared. Words typed while it was out stay in the
    // box and in the draft (CODE-2-01).
    const rest = unsentRemainder(sentRaw, draftNow.current);
    const restQuote = targets.current.quote?.postId === sentQuote ? null : targets.current.quote;
    const restCorrection = targets.current.correcting?.postId === sentCorrection ? null : targets.current.correcting;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = null;
    unsaved.current = null;
    if (rest.trim()) {
      typed.current = true;
      setDraft(rest);
      setQuote(restQuote);
      setCorrecting(restCorrection);
      if (!draftOwnerStale(owner.current)) {
        void saveDraft(draftName, replyDraftText({ body: rest, quote: restQuote, correcting: restCorrection, clientId: null }));
      }
    } else {
      typed.current = false;
      setDraft('');
      setDraftSaved(false);
      setQuote(null);
      setCorrecting(null);
      void clearDraft(draftName);
    }
    const hidden = hiddenOutcomeNote(r.value);
    // A long thread: the new reply is past the first page, so the pages up to
    // the end are read and the list scrolls once it is there (CODE-1-08).
    const long = !!value && value.posts.length >= POSTS_PAGE;
    // Shown once the new post has been laid out (onContentSizeChange).
    pinToEnd.current = hidden ? null : long ? r.value.postId : true;
    await read.reload();
    if (long && !hidden) await readToEnd();
    else await refreshLater();
    if (hidden) {
      forgetClientId(fingerprint);
      // Never in the thread (the server keeps it from every list): say so here.
      setSendError(hidden);
    } else if (r.value.state === 'checking') {
      // The check ran past the wait: read once more when it should have landed.
      recheck.current = setTimeout(() => void reloadAll(), 8000);
    } else if (outcomeKind(r.value.state) === 'removed') {
      setSendError(null);
    }
  }, [allPeople, correcting, draft, draftName, quote, read, readToEnd, refreshLater, reloadAll, topicId, value]);

  // Asked from the stored agreement once it is read, never from the store's
  // empty start, and once per session when the phone cannot keep it (CODE-2-12).
  const send = useLatchedPress(async () => {
    if (!(await rulesAgreed())) {
      setRulesOpen(true);
      return;
    }
    await sendNow();
  });
  const acceptRules = useLatchedPress(async () => {
    const ok = await flags.acceptRules();
    setRulesOpen(false);
    if (ok) await sendNow();
    else notify('Not saved', RULES_NOT_SAVED);
  });

  /* ── ··· on any post ─────────────────────────────────────────────── */
  const [menuPost, setMenuPost] = useState<ForumPost | null>(null);
  const [threadMenu, setThreadMenu] = useState(false);
  const [following, setFollowing] = useState<FollowLevel | null>(null);
  const [reportOf, setReportOf] = useState<ForumPost | null>(null);
  const [appealId, setAppealId] = useState<string | null>(null);
  const [appealed, setAppealed] = useState<string[]>([]);
  const [myAppeals, setMyAppeals] = useState<{ postId: string; status: string }[]>([]);
  useEffect(() => {
    let alive = true;
    void fetchMyAppeals().then((r) => {
      if (alive && r.ok) setMyAppeals(r.value);
    });
    return () => {
      alive = false;
    };
  }, [topicId]);
  const input = useRef<TextInput>(null);

  const block = useCallback(
    (post: ForumPost) => {
      // By the post, so an author with no published profile can be blocked once
      // the server has forum_block_author; before that, a member with no
      // profile is told so and offered Report (blockPostAuthor).
      confirmDialog(
        `Block ${post.author.name}?`,
        'You won’t see each other anywhere.',
        'BLOCK',
        () => {
          void blockPostAuthor(post.id, post.author.token).then((r) => {
            if (!r.ok) {
              notify('Not blocked', r.error);
              return;
            }
            if (post.isOpening) safeGoBack(navigation as never);
            else void reloadAll();
          });
        },
        { destructive: true },
      );
    },
    [navigation, reloadAll],
  );

  const edit = useCallback(
    (post: ForumPost) => {
      navigation.navigate('ForumAsk', {
        slug: topic?.categorySlug,
        edit: {
          postId: post.id,
          isOpening: post.isOpening,
          body: post.pendingBody ?? post.body,
          title: post.isOpening ? topic?.title : undefined,
        },
      });
    },
    [navigation, topic],
  );

  const remove = useCallback(
    (post: ForumPost) => {
      confirmDialog(
        post.isOpening ? 'Delete this topic?' : 'Delete this reply?',
        post.isOpening ? 'This deletes the whole thread.' : 'It will be deleted for everyone.',
        'DELETE',
        () => {
          void deletePost(post.id).then((r) => {
            if (!r.ok) {
              notify('Not deleted', r.error);
              return;
            }
            forgetLandedPost(post.id);
            if (post.isOpening) safeGoBack(navigation as never);
            else void reloadAll();
          });
        },
        { destructive: true },
      );
    },
    [navigation, reloadAll],
  );

  const setSolution = useCallback(
    async (post: ForumPost | null) => {
      const r = await markSolution(topicId, post ? post.id : null);
      if (r.ok) await reloadAll();
      else notify('Not saved', r.error);
    },
    [reloadAll, topicId],
  );

  const bookmark = useCallback(async (post: ForumPost, on: boolean, remindAt?: string) => {
    const r = await setBookmark(post.id, on, remindAt);
    if (!r.ok) {
      notify('Not saved', r.error);
      return;
    }
    patchPost(post.id, (p) => ({ ...p, bookmarked: on }));
    if (remindAt) notify('Reminder set', 'We will remind you tomorrow morning.');
  }, [patchPost]);

  // Asked first, as Report is, and once per post (bug pass 2026-11-08, UI-1-18).
  // The item is hidden from the moment FLAG is pressed, and the send is
  // latched: two flags can never go out (check 2026-11-08).
  const [flagged, setFlagged] = useState<string[]>(() => flaggedPostIds());
  // One send per POST (beginFlag): a flag on another post while one is out is
  // its own send, never dropped (N2).
  const sendFlag = useCallback(async (post: ForumPost) => {
    if (!beginFlag(post.id)) return;
    setFlagged((f) => (f.includes(post.id) ? f : [...f, post.id]));
    const r = await flagSafety(post.id);
    endFlag(post.id, r.ok);
    if (!r.ok) {
      setFlagged((f) => f.filter((id) => id !== post.id));
      notify('Not sent', r.error);
      return;
    }
    notify('Flag sent', 'Thank you. It is being reviewed now.');
  }, []);
  const flag = useCallback(
    (post: ForumPost) => {
      confirmDialog(
        'Flag a safety concern?',
        'Use this when advice about AC power, rigging or hearing could hurt someone. It is reviewed straight away.',
        'FLAG',
        () => void sendFlag(post),
      );
    },
    [sendFlag],
  );

  // One press at a time: a fast ACCEPT then DECLINE must not race.
  // ACCEPT AND EDIT opens the edit first; the correction is marked accepted
  // only once the edit is posted, so CANCEL leaves it open (UI-1-01).
  const resolve = useLatchedPress(async (post: ForumPost, accept: boolean) => {
    const target = posts.find((p) => p.id === post.correctionOfPostId);
    if (accept && target) {
      navigation.navigate('ForumAsk', {
        slug: topic?.categorySlug,
        edit: {
          postId: target.id,
          isOpening: target.isOpening,
          body: target.pendingBody ?? target.body,
          ...(target.isOpening ? { title: topic?.title } : {}),
          suggestion: post.body,
          acceptCorrection: post.id,
        },
      });
      return;
    }
    const r = await resolveCorrection(post.id, accept);
    if (!r.ok) {
      notify('Not saved', r.error);
      return;
    }
    await reloadAll();
  });

  /* ── An idea's vote, here as on Ideas & Requests (UI-1-16) ───────── */
  const voteHere = useLatchedPress(async () => {
    if (!topic) return;
    const on = !topic.myVote;
    const r = await voteIdea(topicId, on);
    if (!r.ok) {
      notify('Vote not saved', r.error);
      return;
    }
    read.patch((v) => ({ ...v, topic: { ...v.topic, myVote: on, voteCount: r.value } }));
  });

  const followItems = useMemo<MenuItem[]>(() => {
    const level = following ?? topic?.followLevel ?? 'off';
    const choose = (next: FollowLevel) => {
      void setTopicFollow(topicId, next).then((r) => {
        if (r.ok) setFollowing(next);
        else notify('Not saved', r.error);
      });
    };
    return [
      { key: 'follow-all', label: `Every reply${level === 'all' ? ' ✓' : ''}`, note: 'Follow this thread', onPress: () => choose('all') },
      { key: 'follow-replies', label: `Replies to me only${level === 'replies' ? ' ✓' : ''}`, onPress: () => choose('replies') },
      { key: 'follow-off', label: `Off${level === 'off' ? ' ✓' : ''}`, onPress: () => choose('off') },
    ];
  }, [following, topic, topicId]);

  const adminItems = useMemo<MenuItem[]>(() => {
    if (!isAdmin || !topic) return [];
    const toggle = (flags: { pinned?: boolean; locked?: boolean }) => {
      void setTopicFlags(topicId, flags).then(async (r) => {
        if (r.ok) await read.reload();
        else notify('Not saved', r.error);
      });
    };
    return [
      { key: 'pin', label: topic.pinned ? 'Unpin topic' : 'Pin topic', onPress: () => toggle({ pinned: !topic.pinned }) },
      { key: 'lock', label: topic.locked ? 'Unlock topic' : 'Lock topic', onPress: () => toggle({ locked: !topic.locked }) },
    ];
  }, [isAdmin, read, topic, topicId]);

  const itemsFor = useCallback((p: ForumPost): MenuItem[] => {
    if (!topic) return [];
    const items: MenuItem[] = [];
    const published = p.modState === 'published';
    // Only where a reply can be sent: a locked topic drew no box, and the
    // quote waited unseen for the unlock (UI-2-02).
    const replying = canStartReply(replyBlock(topic, value?.rights ?? null));
    if (published && !announcements && replying) {
      items.push({
        key: 'quote',
        label: 'Quote reply',
        onPress: () => {
          quoteFor({ postId: p.id, excerpt: quoteExcerpt(p.body), name: p.author.name });
          input.current?.focus();
        },
      });
    }
    if (published && replying && !p.isMine && !p.isOpening && !announcements && p.postKind !== 'correction') {
      items.push({
        key: 'correct',
        label: 'Suggest a correction',
        note: 'The author is notified and can accept it',
        onPress: () => {
          correctFor({ postId: p.id, name: p.author.name });
          input.current?.focus();
        },
      });
    }
    if (published) {
      items.push(
        p.bookmarked
          ? { key: 'unmark', label: 'Remove the bookmark', onPress: () => void bookmark(p, false) }
          : { key: 'mark', label: 'Bookmark', note: 'Kept in Your forum', onPress: () => void bookmark(p, true) },
      );
      items.push({ key: 'remind', label: 'Remind me tomorrow', onPress: () => void bookmark(p, true, tomorrowMorning()) });
    }
    if (topic.canMarkSolution && published && !p.isOpening) {
      items.push(
        p.isSolution
          ? { key: 'unsolve', label: 'Remove the Solution mark', onPress: () => void setSolution(null) }
          : { key: 'solve', label: 'Mark as the Solution', note: 'Pins this reply under your question', onPress: () => void setSolution(p) },
      );
    }
    if (p.isMine) {
      if (editAllowed(p)) {
        items.push({ key: 'edit', label: 'Edit', note: 'Checked again before others see it', onPress: () => edit(p) });
      }
      items.push({ key: 'delete', label: 'Delete', danger: true, onPress: () => remove(p) });
    } else {
      if (published && !flagged.includes(p.id)) {
        items.push({
          key: 'safety',
          label: 'Flag a safety concern',
          note: 'AC power, rigging or hearing: reviewed straight away',
          onPress: () => flag(p),
        });
      }
      // Never on the Academy's own posts (owner rule 2026-11-08).
      if (canReportOrBlock(p.author)) {
        items.push({ key: 'report', label: 'Report post', note: 'Reviewed straight away', onPress: () => setReportOf(p) });
        items.push({
          key: 'block',
          label: 'Block member',
          note: 'You won’t see each other anywhere',
          danger: true,
          onPress: () => block(p),
        });
      }
    }
    return items;
  }, [announcements, block, bookmark, correctFor, edit, flag, flagged, quoteFor, remove, setSolution, topic, value]);

  const menuItems = useMemo(() => (menuPost ? itemsFor(menuPost) : []), [itemsFor, menuPost]);
  const opening_ = posts.find((p) => p.isOpening) ?? null;
  const threadItems = useMemo(
    () => [...followItems, ...adminItems, ...(opening_ ? itemsFor(opening_) : [])],
    [adminItems, followItems, itemsFor, opening_],
  );

  const renderPost = useCallback(
    ({ item }: { item: ForumPost }) => (
      <PostCard
        post={item}
        askerName={solutionMarker(value?.topic, value?.topic.author.former ? null : (value?.topic.author.name ?? null))}
        myName={myName}
        pinned={!!announcements}
        qa={!!qa}
        reacting={reacting}
        onReact={react}
        onMore={setMenuPost}
        onEdit={edit}
        onAppeal={(p) => setAppealId(p.id)}
        appealed={appealSent(item.id, myAppeals, appealed)}
        names={names}
        quotedName={item.quotePostId ? (authorOf.get(item.quotePostId) ?? null) : null}
        targetIsMine={!!item.correctionOfPostId && mineIds.has(item.correctionOfPostId)}
        onResolve={resolve}
        firstUnread={unreadMark && item.id === jumpTo}
      />
    ),
    [announcements, appealed, authorOf, edit, jumpTo, mineIds, myAppeals, myName, names, qa, react, reacting, resolve, unreadMark, value],
  );

  /* ── Faces ───────────────────────────────────────────────────────── */
  if (read.face === 'loading') {
    return (
      <View style={forumStyles.root}>
        <ThreadHeader label="" />
        <ForumLoading label="Loading the thread…" />
      </View>
    );
  }
  if (read.face === 'unreadable' || !topic || !value) {
    return (
      <View style={forumStyles.root}>
        <ThreadHeader label="" />
        <ForumUnreadable error={read.error} code={read.code} onRetry={() => void read.reload()} />
      </View>
    );
  }

  const opening = posts.find((p) => p.isOpening) ?? null;
  const hint = firstPostHint(opening);
  const reply = replyBlock(topic, value.rights);
  const label = announcements ? ANNOUNCEMENTS_LABEL : topic.categoryName.toUpperCase();

  return (
    <KeyboardAvoidingView style={forumStyles.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ThreadHeader
        label={label}
        title={topic.title}
        onMore={() => setThreadMenu(true)}
      />
      <FlatList
        ref={list}
        data={posts}
        keyExtractor={(p) => p.id}
        renderItem={renderPost}
        contentContainerStyle={st.msgs}
        keyboardShouldPersistTaps="handled"
        onScrollToIndexFailed={(info) => {
          list.current?.scrollToOffset({ offset: info.averageItemLength * info.index, animated: false });
        }}
        onContentSizeChange={() => {
          const want = pinToEnd.current;
          if (!want) return;
          // A long thread's new reply: wait until its page has landed.
          if (want !== true && !posts.some((p) => p.id === want)) return;
          pinToEnd.current = null;
          list.current?.scrollToEnd({ animated: true });
        }}
        ListHeaderComponent={
          <>
            <SampleStamp />
            {read.stale ? <StaleNote /> : null}
            {hint ? <Text style={st.hint}>{hint}</Text> : null}
            <TrackedStrip
              status={topic.trackedStatus}
              reason={topic.trackedReason}
              vote={
                topic.topicKind === 'idea'
                  ? { count: topic.voteCount, mine: topic.myVote, can: topic.canVote, onPress: voteHere }
                  : null
              }
            />
          </>
        }
        ListFooterComponent={
          hasMore ? (
            <Pressable
              onPress={showMore}
              disabled={loadingMore}
              style={({ pressed }) => [st.moreKey, pressed && st.pressed]}
              accessibilityRole="button"
              accessibilityLabel="Show more posts"
              accessibilityState={{ busy: loadingMore }}
            >
              <Text style={st.moreText}>{loadingMore ? 'LOADING…' : 'SHOW MORE POSTS'}</Text>
            </Pressable>
          ) : null
        }
      />
      {reply.kind === 'announcements' ? (
        <AnnouncementsNotice onAsk={() => navigation.navigate('ForumCategory', { slug: ASK_SLUG })} />
      ) : reply.kind === 'closed' ? (
        reply.text === PRO_LOUNGE_REFUSAL ? (
          <LockedNotice action={{ label: 'SEE CREDENTIALS', onPress: () => navigation.navigate('Awards', { category: 'specialization' }) }}>
            {`${reply.text} You can read every thread. Earn a credential to post here.`}
          </LockedNotice>
        ) : (
          <LockedNotice
            solid
            action={
              refusalNeedsProfile(reply.code)
                ? { label: 'MY PROFILE', onPress: () => openMyProfile(navigation) }
                : undefined
            }
          >
            {reply.text}
          </LockedNotice>
        )
      ) : (
        <View style={[st.compWrap, { paddingBottom: 12 + insets.bottom }]}>
          {suggestions.length > 0 ? (
            <View style={st.mentions}>
              {suggestions.map((p) => (
                <Pressable
                  key={p.token}
                  onPress={() => {
                    setPicked((list) => (list.some((x) => x.token === p.token) ? list : [...list, p]));
                    typeDraft(applyMention(draft, p.name));
                  }}
                  style={st.mentionRow}
                  accessibilityRole="button"
                  accessibilityLabel={`Mention ${p.name}`}
                >
                  <Text style={st.mentionText}>@{p.name}</Text>
                </Pressable>
              ))}
            </View>
          ) : null}
          {correcting ? (
            <View style={st.quoting}>
              <Text style={st.quotingText}>Suggesting a correction to {firstName(correcting.name)}’s reply</Text>
              <Pressable
                onPress={() => correctFor(null)}
                hitSlop={10}
                accessibilityRole="button"
                accessibilityLabel="Cancel the correction"
              >
                <Text style={st.quotingClear}>✕</Text>
              </Pressable>
            </View>
          ) : null}
          {quote ? (
            <View style={st.quoting}>
              <Text style={st.quotingText} numberOfLines={2}>
                {firstName(quote.name)}: {quote.excerpt}
              </Text>
              <Pressable onPress={() => quoteFor(null)} hitSlop={10} accessibilityRole="button" accessibilityLabel="Remove the quote">
                <Text style={st.quotingClear}>✕</Text>
              </Pressable>
            </View>
          ) : null}
          {sendError ? <Text style={st.sendError}>{sendError}</Text> : null}
          <View style={st.comp}>
            <TextInput
              ref={input}
              value={draft}
              onChangeText={typeDraft}
              placeholder={correcting ? 'Write the correction' : 'Write a reply'}
              placeholderTextColor={F.muted}
              multiline
              maxLength={BODY_MAX}
              style={st.inp}
              accessibilityLabel="Write a reply"
              {...ONE_ROW}
            />
            <Pressable
              onPress={send}
              disabled={sending || !draft.trim()}
              style={[st.send, (sending || !draft.trim()) && st.sendOff]}
              accessibilityRole="button"
              accessibilityLabel="Send reply"
              accessibilityState={{ disabled: sending || !draft.trim(), busy: sending }}
              aria-disabled={sending || !draft.trim()}
            >
              <Text style={st.sendText}>↑</Text>
            </Pressable>
          </View>
          {draftSaved ? <Text style={st.draftNote}>Draft saved on this phone.</Text> : null}
        </View>
      )}

      <MenuPopup visible={!!menuPost} onClose={() => setMenuPost(null)} items={menuItems} />
      <MenuPopup visible={threadMenu} onClose={() => setThreadMenu(false)} items={threadItems} />
      <ReportPopup
        postId={reportOf?.id ?? null}
        authorName={reportOf?.author.name ?? ''}
        canBlock={!!reportOf && !reportOf.isMine && canReportOrBlock(reportOf.author)}
        onClose={() => setReportOf(null)}
        onDone={({ alsoBlock }) => {
          const p = reportOf;
          setReportOf(null);
          if (alsoBlock && p) {
            void blockPostAuthor(p.id, p.author.token).then((b) => {
              if (!b.ok) notify('Report sent, not blocked', b.error);
              else if (p.isOpening) safeGoBack(navigation as never);
              else void reloadAll();
            });
          } else {
            // A child-safety report hides the post at once: read again, so it
            // does not stay on the reporter's screen.
            void reloadAll();
          }
          notify('Report sent', 'Thank you. It is being reviewed now.');
        }}
      />
      <AppealPopup
        postId={appealId}
        onClose={() => setAppealId(null)}
        onDone={() => {
          if (appealId) setAppealed((a) => [...a, appealId]);
          setAppealId(null);
          notify('Appeal sent', 'A person will read it and you will get a notice with the decision.');
        }}
      />
      <RulesPopup visible={rulesOpen} onAccept={acceptRules} onClose={() => setRulesOpen(false)} />
    </KeyboardAvoidingView>
  );
}

const PostCard = memo(function PostCard({
  post,
  askerName,
  myName,
  pinned,
  qa,
  reacting,
  onReact,
  onMore,
  onEdit,
  onAppeal,
  appealed,
  names,
  quotedName,
  targetIsMine,
  onResolve,
  firstUnread,
}: {
  post: ForumPost;
  askerName: string | null;
  myName: string | null;
  pinned: boolean;
  qa: boolean;
  reacting: (key: string | null) => boolean;
  onReact: (p: ForumPost, k: ReactionKind) => void;
  onMore: (p: ForumPost) => void;
  onEdit: (p: ForumPost) => void;
  onAppeal: (p: ForumPost) => void;
  appealed: boolean;
  names: string[];
  /** Who wrote the quoted post, when it is in this thread. */
  quotedName: string | null;
  /** This correction is about my post, so I may answer it. */
  targetIsMine: boolean;
  onResolve: (p: ForumPost, accept: boolean) => void;
  firstUnread: boolean;
}) {
  const face = moderationFace(post);
  const correction = correctionFace(post, targetIsMine);
  const level = levelMark(post.author);
  const fields = post.isOpening ? parseAskBody(post.body) : null;
  const solution = qa && post.isSolution;
  const marker = solutionMarkedBy(askerName, myName);
  const published = post.modState === 'published';
  const when = pinned ? monthYear(post.publishedAt ?? post.createdAt) : timeAgo(post.publishedAt ?? post.createdAt);

  return (
    <View style={st.stack}>
      {firstUnread ? <Text style={st.unreadMark}>NEW SINCE YOUR LAST VISIT</Text> : null}
      {face.kind === 'review' ? (
        <ModCard
          tone="hold"
          head={face.head}
          text={face.text}
          crisis={face.crisis}
          actions={face.canEdit ? [{ label: 'EDIT AND REPOST', onPress: () => onEdit(post), primary: true }] : undefined}
        />
      ) : null}
      {face.kind === 'removed' ? (
        <ModCard
          tone="removed"
          head={face.head}
          text={face.text}
          excerpt={face.excerpt}
          how={face.how}
          crisis={face.crisis}
          actions={[
            ...(face.canEdit ? [{ label: 'EDIT AND REPOST', onPress: () => onEdit(post), primary: true }] : []),
            ...(face.canAppeal
              ? [{ label: appealed ? 'APPEAL SENT' : 'APPEAL', onPress: () => onAppeal(post), disabled: appealed }]
              : []),
          ]}
        />
      ) : null}
      {face.kind === 'removed' && !published ? null : (
        <View style={[st.post, solution && st.postSol]}>
          {solution ? <View style={st.solBar} /> : null}
          {correction ? (
            <Text style={[st.correctionHead, correction.tone === 'good' && st.correctionGood]}>{correction.head}</Text>
          ) : null}
          {solution ? (
            <Text style={st.solhd}>✓ SOLUTION{marker ? ` · MARKED BY ${marker}` : ''}</Text>
          ) : null}
          <View style={st.who}>
            <ChannelBadge name={badgeName(post.author.name)} led="off" steel={!!post.author.verifiedKind || pinned} size={30} />
            <Text style={st.nm}>{post.author.name}</Text>
            {level === 'NEW' ? <NewMark /> : level ? <Text style={st.level}>{level}</Text> : null}
            <AuthorPlate author={post.author} />
            {pinned ? <PinStamp /> : null}
            <Text style={st.tm}>{when}</Text>
            {published || post.isMine ? (
              <MoreKey onPress={() => onMore(post)} label={`Options for ${post.author.name}'s post`} style={st.postMore} />
            ) : null}
          </View>
          {post.quoteExcerpt ? <Text style={st.quote}>{quoteLine(post.quoteExcerpt, quotedName)}</Text> : null}
          {fields ? (
            <View style={st.fields}>
              {fields.trying ? <Answer label="TRYING TO" text={fields.trying} names={names} /> : null}
              {fields.gear ? <Answer label="GEAR" text={fields.gear} names={names} /> : null}
              {fields.tried ? <Answer label="TRIED" text={fields.tried} names={names} /> : null}
            </View>
          ) : (
            // The Academy's own announcements are not teaching posts: a word
            // like "feedback" there is not the glossary's acoustic term (UI-1-03).
            post.body.split(/\n{2,}/).map((para, i) => (
              <PostBody key={`${post.id}:${i}`} text={para} names={names} style={st.body} terms={!pinned} />
            ))
          )}
          {post.labKeys.map((k) => (
            <LabCard key={k} labKey={k} />
          ))}
          {correction?.canResolve ? (
            <View style={st.resolve}>
              <Pressable
                onPress={() => onResolve(post, true)}
                style={[st.resolveKey, st.resolveAccept]}
                accessibilityRole="button"
                accessibilityLabel="Accept this correction"
              >
                <Text style={[st.resolveText, st.resolveTextOn]}>ACCEPT AND EDIT</Text>
              </Pressable>
              <Pressable
                onPress={() => onResolve(post, false)}
                style={st.resolveKey}
                accessibilityRole="button"
                accessibilityLabel="Decline this correction"
              >
                <Text style={st.resolveText}>DECLINE</Text>
              </Pressable>
            </View>
          ) : null}
          {post.safetyNote ? <Text style={st.safety}>{SAFETY_NOTE}</Text> : null}
          {post.edited ? <Text style={st.edited}>Edited</Text> : null}
          {published ? (
            <View style={st.rx}>
              {REACTIONS.map((r) => {
                const on = post.myReactions.includes(r.kind);
                const n = r.count(post);
                // My own post can't be reacted to: its counts are just counts.
                if (post.isMine && n === 0) return null;
                return (
                  <Pressable
                    key={r.kind}
                    onPress={() => onReact(post, r.kind)}
                    disabled={post.isMine || reacting(`${post.id}:${r.kind}`)}
                    hitSlop={{ top: 6, bottom: 6, left: 2, right: 2 }}
                    style={[st.rxChip, on && st.rxOn]}
                    accessibilityRole="button"
                    accessibilityLabel={n > 0 ? `${r.label}, ${n}` : r.label}
                    accessibilityState={{ selected: on, disabled: post.isMine }}
                    aria-pressed={on}
                  >
                    <Text style={[st.rxText, on && st.rxTextOn]}>{n > 0 ? `${r.label} ${n}` : r.label}</Text>
                  </Pressable>
                );
              })}
            </View>
          ) : null}
        </View>
      )}
    </View>
  );
});

/** An idea's or a correction's status, the staff reason, and the vote: the
 *  same as on Ideas & Requests, for a member who came from Latest (UI-1-16). */
function TrackedStrip({
  status,
  reason,
  vote,
}: {
  status: ForumThread['topic']['trackedStatus'];
  reason: string | null;
  vote: { count: number; mine: boolean; can: boolean; onPress: () => void } | null;
}) {
  const face = trackedFace(status, reason);
  if (!face && !vote) return null;
  return (
    <View style={st.tracked}>
      {vote ? (
        <Pressable
          onPress={vote.onPress}
          disabled={!vote.can}
          hitSlop={4}
          style={[st.vote, vote.mine && st.voteOn, !vote.can && st.voteOff]}
          accessibilityRole="button"
          accessibilityLabel={`Vote for this idea, ${vote.count} ${vote.count === 1 ? 'vote' : 'votes'}`}
          accessibilityState={{ selected: vote.mine, disabled: !vote.can }}
          aria-pressed={vote.mine}
        >
          <Text style={st.voteArrow}>▲</Text>
          <Text style={st.voteCount}>{vote.count}</Text>
        </Pressable>
      ) : null}
      <View style={st.trackedText}>
        {face ? <StatusStamp tone={face.tone}>{face.stamp}</StatusStamp> : null}
        {face?.foot ? <Text style={st.trackedFoot}>{face.foot}</Text> : null}
      </View>
    </View>
  );
}

function Answer({ label, text, names }: { label: string; text: string; names: string[] }) {
  return (
    <Text style={st.answer}>
      <Text style={st.answerLabel}>{label} </Text>
      <PostBody text={text} names={names} style={st.answer} />
    </Text>
  );
}

const st = StyleSheet.create({
  msgs: { padding: 16, paddingTop: 12, gap: 12, flexGrow: 1 },
  stack: { gap: 8 },
  hint: {
    fontFamily: fonts.barlowRegular,
    fontSize: 11.5,
    color: F.blue,
    backgroundColor: 'rgba(91,176,255,.08)',
    borderWidth: 1,
    borderColor: 'rgba(91,176,255,.3)',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 10,
    overflow: 'hidden',
  },
  post: {
    backgroundColor: F.panel,
    borderWidth: 1,
    borderColor: F.line,
    borderRadius: 14,
    padding: 12,
    overflow: 'hidden',
  },
  postSol: { borderColor: 'rgba(55,224,95,.45)' },
  solBar: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, backgroundColor: F.green },
  solhd: { fontFamily: fonts.mono, fontSize: 10, letterSpacing: 1, color: F.green, marginBottom: 6 },
  who: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  nm: { flexShrink: 1, fontFamily: fonts.oswaldSemiBold, fontSize: 14, color: F.text },
  tm: { marginLeft: 'auto', fontFamily: fonts.mono, fontSize: 10, color: F.muted },
  postMore: { minWidth: 22, marginLeft: -2 },
  body: { fontFamily: fonts.barlowRegular, fontSize: 14, lineHeight: 20.5, color: F.body, marginTop: 8 },
  quote: {
    fontFamily: fonts.barlowItalic,
    fontSize: 12.5,
    lineHeight: 17,
    color: F.sub,
    borderLeftWidth: 2,
    borderLeftColor: F.line2,
    paddingLeft: 8,
    marginTop: 8,
  },
  fields: { marginTop: 8, gap: 4 },
  answer: { fontFamily: fonts.barlowRegular, fontSize: 12.5, lineHeight: 17.5, color: F.sub },
  answerLabel: { fontFamily: fonts.mono, fontSize: 10, letterSpacing: 0.6, color: F.muted },
  safety: {
    fontFamily: fonts.barlowRegular,
    fontSize: 12,
    lineHeight: 17,
    color: F.steel,
    marginTop: 8,
    borderLeftWidth: 2,
    borderLeftColor: 'rgba(159,180,200,.45)',
    paddingLeft: 8,
  },
  edited: { fontFamily: fonts.barlowRegular, fontSize: 11, color: F.muted, marginTop: 6 },
  rx: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 10 },
  rxChip: { borderWidth: 1, borderColor: F.line2, borderRadius: 999, paddingVertical: 3, paddingHorizontal: 9 },
  rxOn: { borderColor: 'rgba(255,198,77,.5)', backgroundColor: F.amberDim },
  rxText: { fontFamily: fonts.barlowMedium, fontSize: 11.5, color: F.sub },
  rxTextOn: { color: F.amber },
  pressed: { opacity: 0.7 },
  moreKey: { minHeight: 44, alignItems: 'center', justifyContent: 'center', marginTop: 8 },
  moreText: { fontFamily: fonts.oswaldMedium, fontSize: 12.5, letterSpacing: 1.25, color: F.amber },
  tracked: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 4 },
  trackedText: { flex: 1, minWidth: 0, gap: 4, paddingTop: 2, alignItems: 'flex-start' },
  trackedFoot: { fontFamily: fonts.barlowRegular, fontSize: 12, lineHeight: 16.5, color: F.muted },
  vote: {
    width: 46,
    borderWidth: 1,
    borderColor: F.line2,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    backgroundColor: F.panel,
  },
  voteOn: { borderColor: 'rgba(255,198,77,.6)', backgroundColor: F.amberDim },
  voteOff: { opacity: 0.5 },
  voteArrow: { fontFamily: fonts.barlowMedium, fontSize: 13, color: F.amber },
  voteCount: { fontFamily: fonts.mono, fontSize: 13, color: F.text },
  compWrap: { paddingHorizontal: 14, paddingTop: 10, borderTopWidth: 1, borderTopColor: F.line, backgroundColor: F.bg },
  comp: { flexDirection: 'row', gap: 10, alignItems: 'flex-end' },
  inp: {
    flex: 1,
    minWidth: 0,
    maxHeight: 120,
    backgroundColor: F.panel,
    borderWidth: 1,
    borderColor: F.line2,
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 16,
    fontFamily: fonts.barlowRegular,
    fontSize: 14,
    color: F.text,
  },
  send: { width: 40, height: 40, borderRadius: 20, backgroundColor: F.amber, alignItems: 'center', justifyContent: 'center' },
  sendOff: { opacity: 0.45 },
  sendText: { fontFamily: fonts.barlowSemiBold, fontSize: 17, color: '#111' },
  quoting: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderLeftWidth: 2,
    borderLeftColor: F.amber,
    paddingLeft: 8,
    marginBottom: 8,
  },
  quotingText: { flex: 1, fontFamily: fonts.barlowItalic, fontSize: 12.5, lineHeight: 17, color: F.sub },
  quotingClear: { fontFamily: fonts.barlowMedium, fontSize: 14, color: F.sub, padding: 2 },
  draftNote: { fontFamily: fonts.barlowRegular, fontSize: 11.5, color: F.muted, marginTop: 6 },
  mentions: { marginBottom: 8, backgroundColor: F.raised, borderWidth: 1, borderColor: F.line2, borderRadius: 12, overflow: 'hidden' },
  mentionRow: { minHeight: 38, justifyContent: 'center', paddingHorizontal: 12, borderBottomWidth: 1, borderBottomColor: F.line },
  mentionText: { fontFamily: fonts.barlowMedium, fontSize: 13.5, color: F.amber },
  level: { fontFamily: fonts.mono, fontSize: 9.5, letterSpacing: 0.57, color: F.sub, borderWidth: 1, borderColor: F.line2, borderRadius: 5, paddingVertical: 2, paddingHorizontal: 6 },
  unreadMark: { fontFamily: fonts.mono, fontSize: 10, letterSpacing: 1, color: F.blue, textAlign: 'center' },
  correctionHead: { fontFamily: fonts.mono, fontSize: 10, letterSpacing: 1, color: F.steel, marginBottom: 6 },
  correctionGood: { color: F.green },
  resolve: { flexDirection: 'row', gap: 8, marginTop: 10 },
  resolveKey: { minHeight: 32, justifyContent: 'center', paddingHorizontal: 12, borderRadius: 10, borderWidth: 1, borderColor: F.line2 },
  resolveAccept: { backgroundColor: F.amber, borderColor: F.amber },
  resolveText: { fontFamily: fonts.oswaldMedium, fontSize: 12, letterSpacing: 1.2, color: F.sub },
  resolveTextOn: { color: '#111' },
  sendError: { fontFamily: fonts.barlowRegular, fontSize: 12.5, lineHeight: 17, color: F.red, marginBottom: 8 },
});
