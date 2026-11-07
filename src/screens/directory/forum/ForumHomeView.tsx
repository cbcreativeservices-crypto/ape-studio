/**
 * FORUM tab: the forum home (approved mockup, screen 1). Search and ASK, the
 * pinned Announcements row, the PRO LOUNGE block, the category groups, and the
 * latest posts with Latest / Unanswered / Top this week.
 *
 * Loaded on demand by AudioCommunityDirectoryScreen the first time the tab is
 * opened, then kept mounted so the search text and the scroll survive a trip to
 * another tab. Everything deeper is a real screen on the stack, so Android BACK
 * works as it does everywhere else.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useIsFocused, useNavigation } from '@react-navigation/native';
import { confirmDialog, notify } from '../../../lib/confirm';
import { useLatchedPress } from '../../../lib/latch';
import { useOverlaysSuppressed } from '../../../features/dev/popupSuppressStore';
import { fonts } from '../../../theme/tokens';
import {
  fetchForumHome,
  fetchTopics,
  markRead,
  searchTopics,
  type ForumCategory,
  type ForumTopic,
} from '../../../features/forum/api';
import { useForumFlags } from '../../../features/forum/forumFlags';
import {
  ANNOUNCEMENTS_SLUG,
  ASK_SLUG,
  IDEAS_SLUG,
  SEARCH_MIN,
  groupCategories,
  refusalNeedsProfile,
  refusalText,
} from '../../../features/forum/rules';
import { sampleState, takeSampleOpen } from '../../../features/forum/sampleSwitch';
import type { ForumSearchHit, TopicSort } from '../../../features/forum/types';
import { useForumRead } from '../../../features/forum/useForumRead';
import { useReloadOnReturn } from '../../../features/forum/useReloadOnReturn';
import { WELCOME_TITLE, welcomeDue } from '../../../features/forum/welcome';
import {
  AnnounceRow,
  CategoryChip,
  Chips,
  F,
  ForumEmpty,
  ForumLoading,
  ForumUnreadable,
  GroupHead,
  LoungeBlock,
  SampleStamp,
  SearchBar,
  SecHead,
  SortChips,
  StaleNote,
  TopicRow,
  topicRoute,
} from './forumBits';
import { DiscussLabLink } from './DiscussLabLink';
import { ForumWelcomePopup } from './ForumWelcomePopup';

type Nav = { navigate: (route: string, params?: Record<string, unknown>) => void };

const LATEST_PAGE = 20;

export function ForumHomeView({ active, onOpenProfile }: { active: boolean; onOpenProfile: () => void }) {
  const navigation = useNavigation() as unknown as Nav;
  const home = useForumRead(fetchForumHome, []);
  const [sort, setSort] = useState<TopicSort>('latest');
  const latest = useForumRead(() => fetchTopics(null, sort, LATEST_PAGE, 0), [sort]);
  const [query, setQuery] = useState('');
  const hits = useSearch(query);

  // Back from a thread or the Ask form, or back to this tab: read again quietly.
  const reloadHome = home.reload;
  const reloadLatest = latest.reload;
  useReloadOnReturn(reloadHome, reloadLatest);
  const wasActive = useRef(active);
  useEffect(() => {
    if (active && !wasActive.current) {
      void reloadHome();
      void reloadLatest();
    }
    wasActive.current = active;
  }, [active, reloadHome, reloadLatest]);

  // The dev sample may ask for a screen on top of this tab.
  useEffect(() => {
    const open = takeSampleOpen();
    if (open) navigation.navigate(open.route, open.params);
    // Once, when the tab first mounts.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const value = home.value;
  const grouped = useMemo(() => groupCategories(value?.categories ?? []), [value]);
  const pinned = value?.announcements.find((t) => t.pinned) ?? null;
  const welcomePost = value?.announcements.find((t) => t.title === WELCOME_TITLE) ?? pinned;
  const unreadNotices = value?.me?.unreadNotices ?? 0;

  /* ── Welcome: once per account ───────────────────────────────────── */
  const flags = useForumFlags();
  const focused = useIsFocused();
  const suppressed = useOverlaysSuppressed();
  const due = welcomeDue({
    forumReady: home.face === 'ready' && active,
    readKnown: flags.known,
    seenHere: flags.welcomeSeen,
    pinnedUnread: welcomePost ? welcomePost.unread : null,
  });
  const enterForum = useLatchedPress(async () => {
    await flags.markWelcomeSeen();
    if (welcomePost) await markRead(welcomePost.id);
  });

  /* ── Going places ────────────────────────────────────────────────── */
  const openCategory = useCallback(
    (c: ForumCategory) => {
      if (c.slug === IDEAS_SLUG) navigation.navigate('ForumIdeas');
      else navigation.navigate('ForumCategory', { slug: c.slug });
    },
    [navigation],
  );
  const openLounge = useCallback(() => navigation.navigate('ForumCategory', { lounge: true }), [navigation]);
  const openTopic = useCallback(
    (t: ForumTopic) => navigation.navigate('ForumThread', topicRoute(t)),
    [navigation],
  );
  const openAnnouncements = useCallback(() => {
    if (pinned) navigation.navigate('ForumThread', { topicId: pinned.id });
    else navigation.navigate('ForumThread', { welcome: true });
  }, [navigation, pinned]);

  const ask = useCallback(() => {
    const rights = value?.rights?.find((r) => r.slug === ASK_SLUG) ?? null;
    if (rights && !rights.canStartTopic) {
      const text = refusalText(rights.reason);
      if (refusalNeedsProfile(rights.reason)) {
        confirmDialog('Before you post', text, 'MY PROFILE', onOpenProfile);
      } else {
        notify('Before you post', text);
      }
      return;
    }
    navigation.navigate('ForumAsk', { slug: ASK_SLUG });
  }, [navigation, onOpenProfile, value]);

  /* ── Faces ───────────────────────────────────────────────────────── */
  if (home.face === 'loading') {
    return (
      <View style={st.pad}>
        <SampleStamp />
        <ForumLoading />
      </View>
    );
  }
  if (home.face === 'unreadable' || !value) {
    return (
      <View style={st.pad}>
        <SampleStamp />
        <ForumUnreadable error={home.error} code={home.code} onRetry={() => void home.reload()} />
      </View>
    );
  }

  const searching = query.trim().length >= SEARCH_MIN;
  const announcementsCategory = grouped.announcements;
  return (
    <>
      <ScrollView
        style={st.fill}
        contentContainerStyle={st.scroll}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
      >
        <SampleStamp />
        <SamplePanel />
        <SearchBar value={query} onChange={setQuery} onAsk={ask} />
        {searching ? (
          <SearchResults hits={hits} categories={value.categories} onOpen={(id) => navigation.navigate('ForumThread', { topicId: id })} />
        ) : (
          <>
            {home.stale ? <StaleNote /> : null}
            {unreadNotices > 0 ? (
              <AnnounceRow
                mark="⚑"
                head="Your posts"
                text="There is a notice for you"
                onPress={() => navigation.navigate('ForumNotices')}
              />
            ) : null}
            {announcementsCategory ? (
              <AnnounceRow
                mark="📌"
                head={announcementsCategory.name}
                text={pinned?.title ?? WELCOME_TITLE}
                onPress={openAnnouncements}
              />
            ) : null}
            {grouped.lounge.length > 0 ? (
              <LoungeBlock categories={grouped.lounge} onOpen={openLounge} onCategory={openCategory} />
            ) : null}
            {grouped.groups.map((g) => (
              <View key={g.slug}>
                <GroupHead>{g.name}</GroupHead>
                <Chips>
                  {g.categories.map((c) => (
                    <CategoryChip key={c.slug} category={c} onPress={() => openCategory(c)} />
                  ))}
                </Chips>
              </View>
            ))}
            <SecHead link={{ label: 'YOUR FORUM', onPress: () => navigation.navigate('ForumMine') }}>Latest posts</SecHead>
            <SortChips value={sort} onChange={setSort} />
            <LatestList read={latest} onOpen={openTopic} sort={sort} />
          </>
        )}
      </ScrollView>
      <ForumWelcomePopup due={due && focused && !suppressed} onEnter={enterForum} />
    </>
  );
}

/** Dev sample only: parts that live on screens the harness cannot reach. */
function SamplePanel() {
  const panel = sampleState()?.panel;
  if (panel === 'kind-switch') {
    const { KindSwitchRow } = require('../../profile/KindSwitchRow') as typeof import('../../profile/KindSwitchRow');
    return <KindSwitchRow />;
  }
  if (panel === 'discuss-lab') {
    return <DiscussLabLink labTitle="Gain Staging" lab={{ key: 'gain-staging', title: 'Gain Staging' }} />;
  }
  if (panel === 'discuss-lab-new') {
    return <DiscussLabLink labTitle="Equalizer" lab={{ key: 'equalizer', title: 'Equalizer' }} />;
  }
  return null;
}

function LatestList({
  read,
  onOpen,
  sort,
}: {
  read: ReturnType<typeof useForumRead<ForumTopic[]>>;
  onOpen: (t: ForumTopic) => void;
  sort: TopicSort;
}) {
  if (read.face === 'loading') return <ForumLoading label="Loading posts…" />;
  if (read.face === 'unreadable' || !read.value) {
    return <ForumUnreadable error={read.error} code={read.code} onRetry={() => void read.reload()} />;
  }
  if (read.value.length === 0) {
    return sort === 'unanswered' ? (
      <ForumEmpty title="Nothing is waiting" text="No question is waiting for an answer." />
    ) : (
      <ForumEmpty title="Nothing posted yet" text="Be the first. Ask a question, or share what you know." />
    );
  }
  return (
    <>
      {read.stale ? <StaleNote /> : null}
      {read.value.map((t, i) => (
        <TopicRow key={t.id} topic={t} spelled={i === 0} onPress={onOpen} />
      ))}
    </>
  );
}

/** Three faces of its own: searching / could not search / truly no match. */
function useSearch(query: string): { face: 'idle' | 'loading' | 'unreadable' | 'ready'; rows: ForumSearchHit[]; error: string | null } {
  const [state, setState] = useState<ReturnType<typeof useSearch>>({ face: 'idle', rows: [], error: null });
  useEffect(() => {
    const q = query.trim();
    if (q.length < SEARCH_MIN) {
      setState({ face: 'idle', rows: [], error: null });
      return undefined;
    }
    let live = true;
    setState((s) => ({ ...s, face: 'loading' }));
    const t = setTimeout(() => {
      void searchTopics(q).then((r) => {
        if (!live) return;
        setState(
          r.ok
            ? { face: 'ready', rows: r.value, error: null }
            : { face: 'unreadable', rows: [], error: r.error },
        );
      });
    }, 300);
    return () => {
      live = false;
      clearTimeout(t);
    };
  }, [query]);
  return state;
}

function SearchResults({
  hits,
  categories,
  onOpen,
}: {
  hits: ReturnType<typeof useSearch>;
  categories: ForumCategory[];
  onOpen: (topicId: string) => void;
}) {
  if (hits.face === 'loading' || hits.face === 'idle') {
    return (
      <View style={st.searching}>
        <ActivityIndicator color={F.amber} />
      </View>
    );
  }
  if (hits.face === 'unreadable') return <ForumEmpty title="This could not be searched" text={hits.error ?? ''} />;
  if (hits.rows.length === 0) {
    return <ForumEmpty title="No topics match" text="Try other words, or ask the community." />;
  }
  return (
    <>
      <SecHead style={st.searchHead}>Results</SecHead>
      {hits.rows.map((h) => (
        <Pressable
          key={h.topicId}
          onPress={() => onOpen(h.topicId)}
          style={({ pressed }) => [st.hit, pressed && st.pressed]}
          accessibilityRole="button"
          accessibilityLabel={h.solved ? `${h.title}, solved` : h.title}
        >
          <Text style={st.hitTitle}>
            {h.solved ? <Text style={st.hitTick}>✓ </Text> : null}
            {h.title}
          </Text>
          <Text style={st.hitMeta}>
            {categories.find((c) => c.slug === h.categorySlug)?.name ?? h.categorySlug}
            {h.categorySlug === ANNOUNCEMENTS_SLUG ? '' : ` · ${h.replyCount}`}
          </Text>
        </Pressable>
      ))}
    </>
  );
}

const st = StyleSheet.create({
  fill: { flex: 1 },
  pad: { paddingHorizontal: 16 },
  scroll: { paddingHorizontal: 16, paddingBottom: 40 },
  pressed: { opacity: 0.7 },
  searching: { paddingVertical: 28 },
  searchHead: { marginTop: 2 },
  hit: { paddingVertical: 11, borderBottomWidth: 1, borderBottomColor: F.line },
  hitTitle: { fontFamily: fonts.barlowSemiBold, fontSize: 14.5, lineHeight: 19, color: F.text },
  hitTick: { color: F.green },
  hitMeta: { fontFamily: fonts.barlowRegular, fontSize: 12, color: F.muted, marginTop: 3 },
});
