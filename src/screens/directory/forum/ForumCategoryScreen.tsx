/**
 * One category's topics, or the whole Pro Lounge as one feed (approved mockup,
 * screen 3). Everyone signed in may read every thread; the Pro Lounge's notice
 * takes the place of the posting button for anyone who may not post there.
 */
import { useCallback, useMemo, useState } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { notify } from '../../../lib/confirm';
import { useLatchedPress } from '../../../lib/latch';
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
  postingDock,
  refusalNeedsProfile,
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
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type Params = { slug?: string; lounge?: boolean };
type Nav = { navigate: (route: string, params?: Record<string, unknown>) => void };

const PAGE = 30;
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
  const showMore = useLatchedPress(async () => {
    if (lounge || rows.length === 0 || rows.length % PAGE !== 0) return;
    const r = await fetchTopics(slug ?? null, sort, PAGE, rows.length);
    if (r.ok) setMore((m) => [...m, ...r.value]);
  });

  useReloadOnReturn(topics.reload);

  const open = useCallback((t: ForumTopic) => navigation.navigate('ForumThread', topicRoute(t)), [navigation]);
  const changeSort = useCallback((s: TopicSort) => {
    setMore([]);
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
  const followLevel = following ?? category?.followLevel ?? 'replies';
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

  const start = () => {
    if (!here || here.canStartTopic || lounge) {
      navigation.navigate('ForumAsk', { slug: startSlug });
      return;
    }
    notify('Before you post', refusalText(here.reason));
  };

  const dock = posting.kind === 'pro' ? (
    <LockedNotice action={{ label: 'SEE CREDENTIALS', onPress: seeCredentials }}>
      {`${PRO_LOUNGE_REFUSAL} You can read every thread. Earn a credential to post here.`}
    </LockedNotice>
  ) : posting.kind === 'refusal' && refusalNeedsProfile(posting.code) ? (
    <LockedNotice action={{ label: 'MY PROFILE', onPress: () => navigation.navigate('AudioCommunityDirectory', { tab: 'profile' }) }}>
      {refusalText(posting.code)}
    </LockedNotice>
  ) : posting.kind === 'refusal' ? (
    <LockedNotice solid>{refusalText(posting.code)}</LockedNotice>
  ) : home.face === 'ready' && slug !== IDEAS_SLUG ? (
    <View style={[st.dock, { paddingBottom: 14 + insets.bottom }]}>
      <AmberButton label={lounge ? 'START A TOPIC' : startLabel} onPress={start} />
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
        ListEmptyComponent={
          topics.face === 'loading' ? (
            <ForumLoading label="Loading topics…" />
          ) : topics.face === 'unreadable' ? (
            <ForumUnreadable error={topics.error} code={topics.code} onRetry={() => void topics.reload()} />
          ) : sort === 'unanswered' ? (
            <ForumEmpty title="Nothing is waiting" text="No question here is waiting for an answer." />
          ) : (
            <ForumEmpty title="Nothing posted here yet" text="Start the first topic." />
          )
        }
      />
      {dock}
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
});
