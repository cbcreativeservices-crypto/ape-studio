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
import { safeGoBack } from '../../../lib/safeGoBack';
import { fonts } from '../../../theme/tokens';
import {
  POSTS_PAGE,
  blockAuthor,
  deletePost,
  fetchThread,
  markRead,
  markSolution,
  reactToPost,
  submitPost,
  type ForumPost,
  type ForumThread,
} from '../../../features/forum/api';
import { useForumFlags } from '../../../features/forum/forumFlags';
import {
  ANNOUNCEMENTS_SLUG,
  ASK_SLUG,
  BODY_MAX,
  PRO_LOUNGE_REFUSAL,
  badgeName,
  firstName,
  firstPostHint,
  labChipText,
  monthYear,
  moderationFace,
  orderPosts,
  outcomeKind,
  parseAskBody,
  quoteExcerpt,
  refusalNeedsProfile,
  replyBlock,
  timeAgo,
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
  LabChip,
  LockedNotice,
  MenuPopup,
  ModCard,
  MoreKey,
  NewMark,
  PinStamp,
  SampleStamp,
  ThreadHeader,
  forumStyles,
  type MenuItem,
} from './forumBits';
import { AppealPopup, ReportPopup, RulesPopup } from './forumPopups';

type Params = { topicId?: string; welcome?: boolean };
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
  const { topicId, welcome } = (route.params ?? {}) as Params;
  if (welcome || !topicId) return <LocalWelcome />;
  return <Thread topicId={topicId} />;
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

function Thread({ topicId }: { topicId: string }) {
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
    const last = value.posts[value.posts.length - 1];
    void markRead(topicId, last?.publishedAt ? last.id : null);
  }, [value, topicId]);

  // Back from Edit and Repost.
  useReloadOnReturn(read.reload);

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
    });
    setSending(false);
    if (!r.ok) {
      setSendError(r.error);
      return;
    }
    clientId.current = null;
    setDraft('');
    setQuote(null);
    // Shown once the new post has been laid out (onContentSizeChange).
    pinToEnd.current = true;
    await read.reload();
    if (r.value.state === 'checking') {
      // The check ran past the wait: read once more when it should have landed.
      recheck.current = setTimeout(() => void read.reload(), 8000);
    } else if (outcomeKind(r.value.state) === 'removed') {
      setSendError(null);
    }
  }, [draft, quote, read, topicId]);

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
  });

  /* ── ··· on any post ─────────────────────────────────────────────── */
  const [menuPost, setMenuPost] = useState<ForumPost | null>(null);
  const [reportOf, setReportOf] = useState<ForumPost | null>(null);
  const [appealId, setAppealId] = useState<string | null>(null);
  const [appealed, setAppealed] = useState<string[]>([]);
  const input = useRef<TextInput>(null);

  const block = useCallback(
    (post: ForumPost) => {
      const token = post.author.token;
      if (!token) {
        notify('Block member', 'This member has no community profile to block. You can report the post instead.');
        return;
      }
      confirmDialog(
        `Block ${post.author.name}?`,
        'You won’t see each other anywhere.',
        'BLOCK',
        () => {
          void blockAuthor(token).then((r) => {
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

  const menuItems = useMemo<MenuItem[]>(() => {
    const p = menuPost;
    if (!p || !topic) return [];
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
    if (topic.canMarkSolution && published && !p.isOpening) {
      items.push(
        p.isSolution
          ? { key: 'unsolve', label: 'Remove the Solution mark', onPress: () => void setSolution(null) }
          : { key: 'solve', label: 'Mark as the Solution', note: 'Pins this reply under your question', onPress: () => void setSolution(p) },
      );
    }
    if (p.isMine) {
      items.push({ key: 'edit', label: 'Edit', note: 'Checked again before others see it', onPress: () => edit(p) });
      items.push({ key: 'delete', label: 'Delete', danger: true, onPress: () => remove(p) });
    } else {
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
  }, [announcements, block, edit, menuPost, remove, setSolution, topic]);

  const renderPost = useCallback(
    ({ item }: { item: ForumPost }) => (
      <PostCard
        post={item}
        askerName={value?.topic.author.former ? null : (value?.topic.author.name ?? null)}
        pinned={!!announcements}
        qa={!!qa}
        reacting={reacting}
        onReact={react}
        onMore={setMenuPost}
        onEdit={edit}
        onAppeal={(p) => setAppealId(p.id)}
        appealed={appealed.includes(item.id)}
      />
    ),
    [announcements, appealed, edit, qa, react, reacting, value],
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
        onMore={opening ? () => setMenuPost(opening) : undefined}
      />
      <FlatList
        ref={list}
        data={posts}
        keyExtractor={(p) => p.id}
        renderItem={renderPost}
        contentContainerStyle={st.msgs}
        keyboardShouldPersistTaps="handled"
        onContentSizeChange={() => {
          if (!pinToEnd.current) return;
          pinToEnd.current = false;
          list.current?.scrollToEnd({ animated: true });
        }}
        ListHeaderComponent={
          <>
            <SampleStamp />
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
          <LockedNotice action={{ label: 'SEE CREDENTIALS', onPress: () => navigation.navigate('Certificates') }}>
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
              onChangeText={setDraft}
              placeholder="Write a reply"
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
        </View>
      )}

      <MenuPopup visible={!!menuPost} onClose={() => setMenuPost(null)} items={menuItems} />
      <ReportPopup
        postId={reportOf?.id ?? null}
        authorName={reportOf?.author.name ?? ''}
        canBlock={!!reportOf?.author.token}
        onClose={() => setReportOf(null)}
        onDone={({ alsoBlock }) => {
          const p = reportOf;
          setReportOf(null);
          if (alsoBlock && p?.author.token) {
            void blockAuthor(p.author.token).then((b) => {
              if (!b.ok) notify('Report sent, not blocked', b.error);
              else if (p.isOpening) safeGoBack(navigation as never);
              else void read.reload();
            });
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
}) {
  const face = moderationFace(post);
  const fields = post.isOpening ? parseAskBody(post.body) : null;
  const solution = qa && post.isSolution;
  const published = post.modState === 'published';
  const when = pinned ? monthYear(post.publishedAt ?? post.createdAt) : timeAgo(post.publishedAt ?? post.createdAt);

  return (
    <View style={st.stack}>
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
          how="Reviewed automatically by AI. An appeal goes to a person."
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
          {solution ? (
            <Text style={st.solhd}>✓ SOLUTION{askerName ? ` · MARKED BY ${firstName(askerName).toUpperCase()}` : ''}</Text>
          ) : null}
          <View style={st.who}>
            <ChannelBadge name={badgeName(post.author.name)} led="off" steel={!!post.author.verifiedKind || pinned} size={30} />
            <Text style={st.nm}>{post.author.name}</Text>
            {post.author.trust === 'new' ? <NewMark /> : null}
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
              {fields.trying ? <Answer label="TRYING TO" text={fields.trying} /> : null}
              {fields.gear ? <Answer label="GEAR" text={fields.gear} /> : null}
              {fields.tried ? <Answer label="TRIED" text={fields.tried} /> : null}
            </View>
          ) : (
            post.body.split(/\n{2,}/).map((para, i) => (
              <Text key={`${post.id}:${i}`} style={st.body}>
                {para}
              </Text>
            ))
          )}
          {post.labKeys.map((k) => (
            <LabChip key={k}>{labChipText(k)}</LabChip>
          ))}
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

function Answer({ label, text }: { label: string; text: string }) {
  return (
    <Text style={st.answer}>
      <Text style={st.answerLabel}>{label} </Text>
      {text}
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
  sendError: { fontFamily: fonts.barlowRegular, fontSize: 12.5, lineHeight: 17, color: F.red, marginBottom: 8 },
});
