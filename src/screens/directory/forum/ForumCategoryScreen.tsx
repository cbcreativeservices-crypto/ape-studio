/**
 * One category's topics, or the whole Pro Lounge as one feed (approved mockup,
 * screen 3). Everyone signed in may read every thread; the Pro Lounge's notice
 * takes the place of the posting button for anyone who may not post there.
 */
import { useCallback, useMemo, useRef, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { notify } from '../../../lib/confirm';
import { useLatchedPress } from '../../../lib/latch';
import { fonts } from '../../../theme/tokens';
import {
  fetchForumHome,
  fetchLoungeTopics,
  fetchTopics,
  setFollow,
  type FollowLevel,
  type ForumTopic,
} from '../../../features/forum/api';
import {
  IDEAS_SLUG,
  PRO_LOUNGE_GROUP,
  PRO_LOUNGE_REFUSAL,
  SORT_LABELS,
  emptyTopicsWords,
  nextTopicsPage,
  postingDock,
  refusalText,
} from '../../../features/forum/rules';
import type { TopicSort } from '../../../features/forum/types';
import { useForumRead } from '../../../features/forum/useForumRead';
import { useReloadOnReturn } from '../../../features/forum/useReloadOnReturn';
import {
  AmberButton,
  F,
  ForumEmpty,
  ForumLoading,
  ForumUnreadable,
  LockedNotice,
  MenuPopup,
  SampleStamp,
  SortChips,
  StaleNote,
  ThreadHeader,
  TopicRow,
  forumStyles,
  topicRoute,
} from './forumBits';
import { usePostGate } from './PostGate';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type Params = { slug?: string; lounge?: boolean };
type Nav = { navigate: (route: string, params?: Record<string, unknown>) => void };

const PAGE = 30;
const MORE_TOPICS_UNREAD = 'More topics could not be loaded. Check your connection and try again.';
const FOLLOW: { level: FollowLevel; label: string; note: string }[] = [
  { level: 'all', label: 'Every new topic', note: 'An alert for each new topic here' },
  { level: 'replies', label: 'Replies to me only', note: 'Only when someone answers you' },
  { level: 'off', label: 'Off', note: 'No alerts from this category' },
];

export function ForumCategoryScreen() {
  const navigation = useNavigation() as unknown as Nav;
  const route = useRoute();
  const { slug, lounge } = (route.params ?? {}) as Params;
  const insets = useSafeAreaInsets();

  const home = useForumRead(fetchForumHome, []);
  const [sort, setSort] = useState<TopicSort>('latest');
  /** Pages past the first: the server answers at most 100 rows a call. */
  const [more, setMore] = useState<ForumTopic[]>([]);

  const categories = home.value?.categories ?? null;
  const category = categories?.find((c) => c.slug === slug) ?? null;
  const loungeSlugs = useMemo(
    () => (categories ?? []).filter((c) => c.groupSlug === PRO_LOUNGE_GROUP).map((c) => c.slug),
    [categories],
  );

  const topics = useForumRead<ForumTopic[]>(
    () => (lounge ? fetchLoungeTopics(sort) : fetchTopics(slug ?? null, sort, PAGE, 0)),
    [slug, lounge, sort],
  );
  const rows = useMemo(() => {
    const first = topics.value ?? [];
    const seen = new Set(first.map((t) => t.id));
    return [...first, ...more.filter((t) => !seen.has(t.id))];
  }, [more, topics.value]);
  /**
   * Where the next page starts and whether there is one, from what the server
   * ANSWERED, not from the rows drawn: a topic that moved between pages is
   * drawn once, and that used to stop paging for good (CODE-2-08).
   */
  const [paging, setPaging] = useState<{ read: number; full: boolean | null }>({ read: 0, full: null });
  /** The last page read failed: said in words, with a way to try again. */
  const [moreFailed, setMoreFailed] = useState(false);
  const next = nextTopicsPage(topics.value?.length ?? 0, paging, PAGE);
  /** Which list a page read belongs to: a new sort or a reload starts a new
   *  list, and a page still out for the old one is dropped when it lands. It
   *  was appended under the new sort, and its count skipped the new sort's
   *  own rows (bug pass 3, CODE-3-03). */
  const listTicket = useRef(0);
  const loadMore = useLatchedPress(async () => {
    if (lounge || next === null) return;
    const ticket = listTicket.current;
    const r = await fetchTopics(slug ?? null, sort, PAGE, next);
    if (ticket !== listTicket.current) return;
    if (!r.ok) {
      setMoreFailed(true);
      return;
    }
    setMoreFailed(false);
    setMore((m) => [...m, ...r.value]);
    setPaging((p) => ({ read: p.read + r.value.length, full: r.value.length >= PAGE }));
  });
  // Scrolling to the end reads on; after a failure only the button tries again.
  const showMore = () => {
    if (!moreFailed) loadMore();
  };

  // Back from a thread: the first page again, and the pages after it are
  // dropped, never kept from before (CODE-2-08).
  const reloadTopics = useCallback(async () => {
    listTicket.current++;
    await topics.reload();
    // Again once it is in: a page read begun during the reload counted from
    // the old first page (CODE-3-03).
    listTicket.current++;
    setMore([]);
    setPaging({ read: 0, full: null });
    setMoreFailed(false);
  }, [topics]);
  useReloadOnReturn(reloadTopics);

  const open = useCallback((t: ForumTopic) => navigation.navigate('ForumThread', topicRoute(t)), [navigation]);
  const changeSort = useCallback((s: TopicSort) => {
    listTicket.current++;
    setMore([]);
    setPaging({ read: 0, full: null });
    setMoreFailed(false);
    setSort(s);
  }, []);

  /* ── Who may post here ───────────────────────────────────────────── */
  const rights = home.value?.rights ?? null;
  const here = rights?.find((r) => r.slug === slug) ?? null;
  // The Pro Lounge's "Earn a credential" only for that very refusal; a muted
  // graduate or one with an unpublished profile is told their own reason.
  const posting = postingDock(rights, slug, !!lounge);

  const [following, setFollowing] = useState<FollowLevel | null>(null);
  const [menu, setMenu] = useState(false);
  // A ✓ only from a read or a write: the category's row, read (no follow row
  // there reads as 'replies', as before), or the level just saved. While the
  // category is unread there is no ✓ at all (bug pass 3, UI-3-03).
  const followLevel: FollowLevel | null = following ?? (category ? (category.followLevel ?? 'replies') : null);
  const choose = useCallback(
    async (level: FollowLevel) => {
      if (!slug) return;
      const r = await setFollow(slug, level);
      if (r.ok) setFollowing(level);
      else notify('Not saved', r.error);
    },
    [slug],
  );

  const showPlates = !!lounge || !!here?.proOnly;
  const label = lounge
    ? `★ PRO LOUNGE · ${SORT_LABELS[sort].toUpperCase()}`
    : `${(category?.name ?? 'Forum').toUpperCase()} · ${SORT_LABELS[sort].toUpperCase()}`;
  const seeCredentials = () => navigation.navigate('Awards', { category: 'specialization' });
  const startLabel = category?.kind === 'qa' ? 'ASK A QUESTION' : 'START A TOPIC';
  const startSlug = lounge ? loungeSlugs[0] : slug;

  // START A TOPIC is never a dead key (2026-11-10 deadlock): a member who may
  // not post yet is shown the rules, or why, with the one button to the fix.
  const gate = usePostGate();
  const start = () => {
    const intent = { route: 'ForumAsk', params: { slug: startSlug } };
    gate.press(
      { slug: startSlug ?? null, action: 'start' },
      home.value ? { me: home.value.me, rights: home.value.rights } : undefined,
      () => navigation.navigate(intent.route, intent.params),
      intent,
    );
  };

  // The Pro Lounge's approved notice stays for anyone who may only read it,
  // and a staff-only category says so in place: neither is something to fix.
  const dock = posting.kind === 'pro' ? (
    <LockedNotice action={{ label: 'SEE CREDENTIALS', onPress: seeCredentials }}>
      {`${PRO_LOUNGE_REFUSAL} You can read every thread. Earn a credential to post here.`}
    </LockedNotice>
  ) : posting.kind === 'refusal' && posting.code === 'staff_only' ? (
    <LockedNotice solid>{refusalText(posting.code)}</LockedNotice>
  ) : home.face === 'ready' && slug !== IDEAS_SLUG ? (
    <View style={[st.dock, { paddingBottom: 14 + insets.bottom }]}>
      <AmberButton label={lounge ? 'START A TOPIC' : startLabel} onPress={start} busy={gate.checking} />
    </View>
  ) : null;

  return (
    <View style={forumStyles.root}>
      <ThreadHeader label={label} onMore={slug ? () => setMenu(true) : undefined} />
      <FlatList
        data={topics.face === 'ready' ? rows : []}
        keyExtractor={(t) => t.id}
        contentContainerStyle={st.list}
        ListHeaderComponent={
          <View style={st.top}>
            <SampleStamp />
            <SortChips value={sort} onChange={changeSort} />
            {topics.stale ? <StaleNote /> : null}
          </View>
        }
        renderItem={({ item, index }) => <TopicRow topic={item} spelled={index === 0} plates={showPlates} onPress={open} />}
        onEndReachedThreshold={0.4}
        onEndReached={showMore}
        ListFooterComponent={
          moreFailed && topics.face === 'ready' ? (
            <Pressable
              onPress={loadMore}
              style={({ pressed }) => [st.moreFailed, pressed && st.pressed]}
              accessibilityRole="button"
              accessibilityLabel="Try loading more topics again"
            >
              <Text style={st.moreFailedText}>{MORE_TOPICS_UNREAD}</Text>
              <Text style={st.moreFailedKey}>TRY AGAIN</Text>
            </Pressable>
          ) : null
        }
        ListEmptyComponent={
          topics.face === 'loading' ? (
            <ForumLoading label="Loading topics…" />
          ) : topics.face === 'unreadable' ? (
            <ForumUnreadable error={topics.error} code={topics.code} onRetry={() => void topics.reload()} />
          ) : (
            <ForumEmpty {...emptyTopicsWords(sort, true)} />
          )
        }
      />
      {dock}
      {gate.host}
      <MenuPopup
        visible={menu}
        onClose={() => setMenu(false)}
        items={FOLLOW.map((f) => ({
          key: f.level,
          label: f.level === followLevel ? `${f.label} ✓` : f.label,
          note: f.note,
          onPress: () => void choose(f.level),
        }))}
      />
    </View>
  );
}

const st = StyleSheet.create({
  list: { paddingHorizontal: 16, paddingBottom: 24, flexGrow: 1 },
  top: { paddingTop: 12 },
  dock: { paddingHorizontal: 14, paddingTop: 10, borderTopWidth: 1, borderTopColor: F.line, backgroundColor: F.bg },
  pressed: { opacity: 0.7 },
  moreFailed: { minHeight: 44, alignItems: 'center', justifyContent: 'center', paddingVertical: 12, gap: 6 },
  moreFailedText: { fontFamily: fonts.barlowRegular, fontSize: 13, lineHeight: 18, color: F.sub, textAlign: 'center' },
  moreFailedKey: { fontFamily: fonts.oswaldMedium, fontSize: 12.5, letterSpacing: 1.25, color: F.amber },
});
