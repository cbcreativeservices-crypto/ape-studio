/**
 * Ideas & Requests (approved mockup, screen 6): one vote per member, sorted by
 * votes, each with a visible status. A vote's count comes from the server's
 * answer, and the list keeps its order until the next read, so a row does not
 * jump away from the finger.
 *
 * Once `forum_topics_list` sends `tracked_reason` and `area` (SERVER_GAPS rows
 * 3 and 5), every row's line comes from the list itself. A server without them:
 * the first rows are filled in from `forum_topic_get`. Optional: a failed
 * detail read leaves the row without its line, never without its status.
 */
import { memo, useCallback, useEffect, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { notify } from '../../../lib/confirm';
import { fonts } from '../../../theme/tokens';
import { IDEAS_MAX, fetchIdeas, fetchTopicDetail, voteIdea, type ForumTopic } from '../../../features/forum/api';
import { IDEAS_SLUG, applyVote, sortIdeas, trackedFace } from '../../../features/forum/rules';
import { ideaDetailsFromList } from '../../../features/forum/serverShapes';
import { useForumRead } from '../../../features/forum/useForumRead';
import { useReloadOnReturn } from '../../../features/forum/useReloadOnReturn';
import { useSendingPer } from '../directoryBits';
import { usePostGate } from './PostGate';
import {
  AmberButton,
  F,
  ForumEmpty,
  ForumHeader,
  ForumLoading,
  ForumUnreadable,
  SampleStamp,
  StaleNote,
  StatusStamp,
  Tag,
  forumStyles,
} from './forumBits';

type Nav = { navigate: (route: string, params?: Record<string, unknown>) => void };
type Detail = { reason: string | null; area: string | null };

/** Enough for the first screenfuls; the rest still shows its status. */
const DETAIL_LIMIT = 30;

export function ForumIdeasScreen() {
  const navigation = useNavigation() as unknown as Nav;
  const insets = useSafeAreaInsets();
  // Every idea, not the newest 100, so the vote order is true (CODE-1-21).
  const read = useForumRead<{ topics: ForumTopic[]; capped: boolean }>(() => fetchIdeas(IDEAS_SLUG), []);
  const [rows, setRows] = useState<ForumTopic[]>([]);
  const value = read.value?.topics ?? null;
  const capped = !!read.value?.capped;
  useEffect(() => {
    if (value) setRows(sortIdeas(value));
  }, [value]);

  // SHARE AN IDEA is never a dead key: who may post is read on the tap, and a
  // member who may not post yet sees the rules, or why (2026-11-10).
  const gate = usePostGate();
  const shareIdea = () => {
    const intent = { route: 'ForumAsk', params: { slug: IDEAS_SLUG } };
    gate.press({ slug: IDEAS_SLUG, action: 'start' }, undefined, () => navigation.navigate(intent.route, intent.params), intent);
  };

  const [details, setDetails] = useState<Record<string, Detail>>({});
  useEffect(() => {
    if (!value) return undefined;
    // The list carries every row's line: no read per row.
    const fromList = ideaDetailsFromList(value);
    if (fromList) {
      setDetails(fromList);
      return undefined;
    }
    let live = true;
    void Promise.all(
      sortIdeas(value)
        .slice(0, DETAIL_LIMIT)
        .map(async (t): Promise<[string, Detail] | null> => {
          const d = await fetchTopicDetail(t.id);
          if (!d.ok) return null;
          const area = d.value.fields.area;
          return [t.id, { reason: d.value.trackedReason, area: typeof area === 'string' ? area : null }];
        }),
    ).then((pairs) => {
      if (live) setDetails(Object.fromEntries(pairs.filter((p): p is [string, Detail] => p !== null)));
    });
    return () => {
      live = false;
    };
  }, [value]);

  useReloadOnReturn(read.reload);

  const [voting, runVote] = useSendingPer();
  const vote = useCallback(
    (t: ForumTopic) => {
      const on = !t.myVote;
      runVote(t.id, async () => {
        const r = await voteIdea(t.id, on);
        if (r.ok) setRows((list) => applyVote(list, t.id, on, r.value));
        else notify('Vote not saved', r.error);
      });
    },
    [runVote],
  );
  const open = useCallback((t: ForumTopic) => navigation.navigate('ForumThread', { topicId: t.id }), [navigation]);

  const renderItem = useCallback(
    ({ item }: { item: ForumTopic }) => (
      <IdeaRow
        idea={item}
        detail={details[item.id] ?? null}
        busy={voting(item.id)}
        onVote={vote}
        onOpen={open}
      />
    ),
    [details, open, vote, voting],
  );

  return (
    <View style={forumStyles.root}>
      <ForumHeader title="Ideas & Requests" sub="One vote per member · sorted by votes" />
      <FlatList
        data={read.face === 'ready' ? rows : []}
        keyExtractor={(t) => t.id}
        renderItem={renderItem}
        contentContainerStyle={st.list}
        ListHeaderComponent={
          <>
            <SampleStamp />
            {read.stale ? <StaleNote /> : null}
          </>
        }
        ListFooterComponent={
          capped ? <Text style={st.foot}>{`Showing the ${IDEAS_MAX} newest ideas, sorted by votes.`}</Text> : null
        }
        ListEmptyComponent={
          read.face === 'loading' ? (
            <ForumLoading label="Loading ideas…" />
          ) : read.face === 'unreadable' ? (
            <ForumUnreadable error={read.error} code={read.code} onRetry={() => void read.reload()} />
          ) : (
            <ForumEmpty title="No ideas yet" text="What would make the app better for you?" />
          )
        }
      />
      {read.face === 'ready' ? (
        <View style={[st.dock, { paddingBottom: 14 + insets.bottom }]}>
          <AmberButton label="SHARE AN IDEA" onPress={shareIdea} busy={gate.checking} />
        </View>
      ) : null}
      {gate.host}
    </View>
  );
}

const IdeaRow = memo(function IdeaRow({
  idea,
  detail,
  busy,
  onVote,
  onOpen,
}: {
  idea: ForumTopic;
  detail: Detail | null;
  busy: boolean;
  onVote: (t: ForumTopic) => void;
  onOpen: (t: ForumTopic) => void;
}) {
  const face = trackedFace(idea.trackedStatus, detail?.reason);
  return (
    <View style={st.idea}>
      <Pressable
        onPress={() => onVote(idea)}
        disabled={busy}
        hitSlop={4}
        style={[st.vote, idea.myVote && st.voteOn]}
        accessibilityRole="button"
        accessibilityLabel={`Vote for ${idea.title}, ${idea.voteCount} votes`}
        accessibilityState={{ selected: idea.myVote, busy }}
        aria-pressed={idea.myVote}
      >
        <Text style={st.arrow}>▲</Text>
        <Text style={st.count}>{idea.voteCount}</Text>
      </Pressable>
      <Pressable
        onPress={() => onOpen(idea)}
        style={({ pressed }) => [st.body, pressed && st.pressed]}
        accessibilityRole="button"
        accessibilityLabel={idea.title}
      >
        <Text style={st.title}>{idea.title}</Text>
        <View style={st.meta}>
          {face ? <StatusStamp tone={face.tone}>{face.stamp}</StatusStamp> : null}
          {detail?.area ? <Tag>{detail.area}</Tag> : null}
        </View>
        {face?.foot ? <Text style={st.foot}>{face.foot}</Text> : null}
      </Pressable>
    </View>
  );
});

const st = StyleSheet.create({
  pressed: { opacity: 0.7 },
  list: { paddingHorizontal: 16, paddingBottom: 24, flexGrow: 1 },
  idea: { flexDirection: 'row', gap: 12, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: F.line },
  vote: {
    width: 46,
    flexShrink: 0,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: F.line2,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    backgroundColor: F.panel,
  },
  voteOn: { borderColor: 'rgba(255,198,77,.6)', backgroundColor: F.amberDim },
  arrow: { fontFamily: fonts.barlowMedium, fontSize: 13, color: F.amber },
  count: { fontFamily: fonts.mono, fontSize: 13, color: F.text },
  body: { flex: 1, minWidth: 0 },
  title: { fontFamily: fonts.barlowSemiBold, fontSize: 14.5, lineHeight: 19, color: F.text },
  meta: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 6, marginTop: 5 },
  foot: { fontFamily: fonts.barlowRegular, fontSize: 12, lineHeight: 16.5, color: F.muted, marginTop: 4 },
  dock: { paddingHorizontal: 14, paddingTop: 10, borderTopWidth: 1, borderTopColor: F.line, backgroundColor: F.bg },
});
