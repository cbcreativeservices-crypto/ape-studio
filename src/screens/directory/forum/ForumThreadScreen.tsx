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
  type FollowLevel,
  type ForumPost,
  type ForumThread,
} from '../../../features/forum/api';
import { amIForumAdmin, setTopicFlags } from '../../../features/forum/adminApi';
import { clearDraft, readDraft, saveDraft } from '../../../features/forum/drafts';
import { useForumFlags } from '../../../features/forum/forumFlags';
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
  correctionFace,
  draftKey,
  editAllowed,
  firstName,
  firstPostHint,
  jumpIndex,
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
  replyBlock,
  solutionMarker,
  threadMentionNames,
  timeAgo,
  tomorrowMorning,
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
  ThreadHeader,
  forumStyles,
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
const SAFETY_NOTE =
  'Safety note: this reply touches on mains power, rigging or hearing. Check with a qualified professional before you act on it.';

export function ForumThreadScreen() {
  const route = useRoute();
  const { topicId, welcome, jumpTo, unread } = (route.params ?? {}) as Params;
  if (welcome || !topicId) return <LocalWelcome />;
  return (
    <GlossaryLinkProvider>
      {/* key: a thread opened over another (a forum tap, a link in a post)
          starts fresh, never with the last one's posts, draft or marks. */}
      <Thread key={topicId} topicId={topicId} jumpTo={jumpTo ?? null} unreadMark={!!unread} />
    </GlossaryLinkProvider>
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
  const value = read.value;
  useEffect(() => {
    if (value) setPosts(orderPosts(value.posts, value.topic.categoryKind === 'qa'));
  }, [value]);

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
  useReloadOnReturn(read.reload);

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

  // Open at the first unread post, or at a bookmarked one.
  const jumped = useRef(false);
  useEffect(() => {
    if (jumped.current || posts.length === 0) return undefined;
    jumped.current = true;
    const index = jumpIndex(posts, jumpTo);
    if (index === null) return undefined;
    const soon = runSoon(() => list.current?.scrollToIndex({ index, animated: false, viewPosition: 0 }));
    return () => soon.cancel();
  }, [jumpTo, posts]);

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
        setPosts((rows) =>
          rows.map((p) =>
            p.id === post.id
              ? {
                  ...p,
                  helpfulCount: r.value.helpful,
                  thanksCount: r.value.thanks,
                  insightfulCount: r.value.insightful,
                  myReactions: on ? [...p.myReactions, kind] : p.myReactions.filter((k) => k !== kind),
                }
              : p,
          ),
        );
      });
    },
    [runReact],
  );

  /* ── The reply box ───────────────────────────────────────────────── */
  const [draft, setDraft] = useState('');
  const [quote, setQuote] = useState<{ postId: string; excerpt: string; name: string } | null>(null);
  const [correcting, setCorrecting] = useState<{ postId: string; name: string } | null>(null);
  const [sendError, setSendError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const clientId = useRef<string | null>(null);
  const pinToEnd = useRef(false);
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
  const typed = useRef(false);
  const [draftSaved, setDraftSaved] = useState(false);
  useEffect(() => {
    let live = true;
    void readDraft(draftName).then((stored) => {
      if (live && stored && !typed.current) setDraft(stored);
    });
    return () => {
      live = false;
    };
  }, [draftName]);
  useEffect(() => {
    if (!typed.current) return undefined;
    let live = true;
    const t = setTimeout(() => {
      void saveDraft(draftName, draft).then((ok) => {
        if (live) setDraftSaved(ok && !!draft.trim());
      });
    }, 800);
    return () => {
      live = false;
      clearTimeout(t);
    };
  }, [draft, draftName]);
  const typeDraft = useCallback((text: string) => {
    typed.current = true;
    // A retry keeps its id so it lands once; a CHANGED draft is a new post.
    clientId.current = null;
    setDraft(text);
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
    setSending(true);
    setSendError(null);
    // The same id for a retry of the same draft: it lands once.
    clientId.current = clientId.current ?? Crypto.randomUUID();
    const r = await submitPost({
      body,
      clientId: clientId.current,
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
    clientId.current = null;
    typed.current = false;
    setDraft('');
    setDraftSaved(false);
    setQuote(null);
    setCorrecting(null);
    setPicked([]);
    void clearDraft(draftName);
    // Shown once the new post has been laid out (onContentSizeChange).
    pinToEnd.current = true;
    await read.reload();
    const hidden = hiddenOutcomeNote(r.value);
    if (hidden) {
      // Never in the thread (the server keeps it from every list): say so here.
      setSendError(hidden);
    } else if (r.value.state === 'checking') {
      // The check ran past the wait: read once more when it should have landed.
      recheck.current = setTimeout(() => void read.reload(), 8000);
    } else if (outcomeKind(r.value.state) === 'removed') {
      setSendError(null);
    }
  }, [allPeople, correcting, draft, draftName, quote, read, topicId]);

  const send = useLatchedPress(async () => {
    if (!flags.rulesAccepted) {
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
            else void read.reload();
          });
        },
        { destructive: true },
      );
    },
    [navigation, read],
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
        post.isOpening ? 'The whole thread goes with it.' : 'It will be gone for everyone.',
        'DELETE',
        () => {
          void deletePost(post.id).then((r) => {
            if (!r.ok) {
              notify('Not deleted', r.error);
              return;
            }
            if (post.isOpening) safeGoBack(navigation as never);
            else void read.reload();
          });
        },
        { destructive: true },
      );
    },
    [navigation, read],
  );

  const setSolution = useCallback(
    async (post: ForumPost | null) => {
      const r = await markSolution(topicId, post ? post.id : null);
      if (r.ok) await read.reload();
      else notify('Not saved', r.error);
    },
    [read, topicId],
  );

  const bookmark = useCallback(async (post: ForumPost, on: boolean, remindAt?: string) => {
    const r = await setBookmark(post.id, on, remindAt);
    if (!r.ok) {
      notify('Not saved', r.error);
      return;
    }
    setPosts((rows) => rows.map((p) => (p.id === post.id ? { ...p, bookmarked: on } : p)));
    if (remindAt) notify('Reminder set', 'We will remind you tomorrow morning.');
  }, []);

  const flag = useCallback(async (post: ForumPost) => {
    const r = await flagSafety(post.id);
    if (r.ok) notify('Flag sent', 'Thank you. It is being reviewed now.');
    else notify('Not sent', r.error);
  }, []);

  // One press at a time: a fast ACCEPT then DECLINE must not race.
  const resolve = useLatchedPress(async (post: ForumPost, accept: boolean) => {
    const r = await resolveCorrection(post.id, accept);
    if (!r.ok) {
      notify('Not saved', r.error);
      return;
    }
    await read.reload();
    const target = posts.find((p) => p.id === post.correctionOfPostId);
    if (accept && target) {
      navigation.navigate('ForumAsk', {
        slug: topic?.categorySlug,
        edit: { postId: target.id, isOpening: target.isOpening, body: target.body, suggestion: post.body },
      });
    }
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
    if (published && !announcements) {
      items.push({
        key: 'quote',
        label: 'Quote reply',
        onPress: () => {
          setQuote({ postId: p.id, excerpt: quoteExcerpt(p.body), name: p.author.name });
          input.current?.focus();
        },
      });
    }
    if (published && !p.isMine && !p.isOpening && !announcements && p.postKind !== 'correction') {
      items.push({
        key: 'correct',
        label: 'Suggest a correction',
        note: 'The author is told and can accept it',
        onPress: () => {
          setCorrecting({ postId: p.id, name: p.author.name });
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
      if (published) {
        items.push({
          key: 'safety',
          label: 'Flag a safety concern',
          note: 'Mains power, rigging or hearing: reviewed straight away',
          onPress: () => void flag(p),
        });
      }
      items.push({ key: 'report', label: 'Report post', note: 'Reviewed straight away', onPress: () => setReportOf(p) });
      items.push({
        key: 'block',
        label: 'Block member',
        note: 'You won’t see each other anywhere',
        danger: true,
        onPress: () => block(p),
      });
    }
    return items;
  }, [announcements, block, bookmark, edit, flag, remove, setSolution, topic]);

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
        pinned={!!announcements}
        qa={!!qa}
        reacting={reacting}
        onReact={react}
        onMore={setMenuPost}
        onEdit={edit}
        onAppeal={(p) => setAppealId(p.id)}
        appealed={appealSent(item.id, myAppeals, appealed)}
        names={names}
        targetIsMine={!!item.correctionOfPostId && mineIds.has(item.correctionOfPostId)}
        onResolve={resolve}
        firstUnread={unreadMark && item.id === jumpTo}
      />
    ),
    [announcements, appealed, edit, jumpTo, mineIds, myAppeals, names, qa, react, reacting, resolve, unreadMark, value],
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
          if (!pinToEnd.current) return;
          pinToEnd.current = false;
          list.current?.scrollToEnd({ animated: true });
        }}
        ListHeaderComponent={
          <>
            <SampleStamp />
            {read.stale ? <StaleNote /> : null}
            {hint ? <Text style={st.hint}>{hint}</Text> : null}
          </>
        }
        ListFooterComponent={
          value.posts.length >= POSTS_PAGE ? (
            <Text style={st.more}>Showing the first {POSTS_PAGE} posts.</Text>
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
                ? { label: 'MY PROFILE', onPress: () => navigation.navigate('AudioCommunityDirectory', { tab: 'profile' }) }
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
                onPress={() => setCorrecting(null)}
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
              <Pressable onPress={() => setQuote(null)} hitSlop={10} accessibilityRole="button" accessibilityLabel="Remove the quote">
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
        canBlock={!!reportOf && !reportOf.isMine}
        onClose={() => setReportOf(null)}
        onDone={({ alsoBlock }) => {
          const p = reportOf;
          setReportOf(null);
          if (alsoBlock && p) {
            void blockPostAuthor(p.id, p.author.token).then((b) => {
              if (!b.ok) notify('Report sent, not blocked', b.error);
              else if (p.isOpening) safeGoBack(navigation as never);
              else void read.reload();
            });
          } else {
            // A child-safety report hides the post at once: read again, so it
            // does not stay on the reporter's screen.
            void read.reload();
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
  pinned,
  qa,
  reacting,
  onReact,
  onMore,
  onEdit,
  onAppeal,
  appealed,
  names,
  targetIsMine,
  onResolve,
  firstUnread,
}: {
  post: ForumPost;
  askerName: string | null;
  pinned: boolean;
  qa: boolean;
  reacting: (key: string | null) => boolean;
  onReact: (p: ForumPost, k: ReactionKind) => void;
  onMore: (p: ForumPost) => void;
  onEdit: (p: ForumPost) => void;
  onAppeal: (p: ForumPost) => void;
  appealed: boolean;
  names: string[];
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
            <Text style={st.solhd}>✓ SOLUTION{askerName ? ` · MARKED BY ${firstName(askerName).toUpperCase()}` : ''}</Text>
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
          {post.quoteExcerpt ? <Text style={st.quote}>{post.quoteExcerpt}</Text> : null}
          {fields ? (
            <View style={st.fields}>
              {fields.trying ? <Answer label="TRYING TO" text={fields.trying} names={names} /> : null}
              {fields.gear ? <Answer label="GEAR" text={fields.gear} names={names} /> : null}
              {fields.tried ? <Answer label="TRIED" text={fields.tried} names={names} /> : null}
            </View>
          ) : (
            post.body.split(/\n{2,}/).map((para, i) => (
              <PostBody key={`${post.id}:${i}`} text={para} names={names} style={st.body} />
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
  more: { fontFamily: fonts.barlowRegular, fontSize: 12, color: F.muted, textAlign: 'center', marginTop: 12 },
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
