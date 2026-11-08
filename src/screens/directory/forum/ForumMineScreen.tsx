/**
 * Your forum: your level, the badges you have earned, and your bookmarks. What
 * you have done, by name: no totals to reach and no rank against anyone else.
 */
import { useCallback, useMemo } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { notify } from '../../../lib/confirm';
import { fonts } from '../../../theme/tokens';
import { fetchBookmarks, fetchForumMe, setBookmark } from '../../../features/forum/api';
import { BADGE_MEANINGS, levelFace, timeAgo } from '../../../features/forum/rules';
import type { ForumBookmark, ForumMe } from '../../../features/forum/types';
import { useForumRead } from '../../../features/forum/useForumRead';
import { useReloadOnReturn } from '../../../features/forum/useReloadOnReturn';
import { useSendingPer } from '../directoryBits';
import {
  F,
  ForumEmpty,
  ForumHeader,
  ForumLoading,
  ForumUnreadable,
  SampleStamp,
  SecHead,
  StaleNote,
  forumStyles,
} from './forumBits';

type Nav = { navigate: (route: string, params?: Record<string, unknown>) => void };

export function ForumMineScreen() {
  const navigation = useNavigation() as unknown as Nav;
  const me = useForumRead<ForumMe | null>(fetchForumMe, []);
  const marks = useForumRead<ForumBookmark[]>(fetchBookmarks, []);
  useReloadOnReturn(me.reload, marks.reload);

  const [removing, runRemove] = useSendingPer();
  const remove = useCallback(
    (b: ForumBookmark) => {
      runRemove(b.postId, async () => {
        const r = await setBookmark(b.postId, false);
        if (r.ok) marks.patch((rows) => rows.filter((x) => x.postId !== b.postId));
        else notify('Not removed', r.error);
      });
    },
    [marks, runRemove],
  );

  const header = useMemo(
    () => (
      <>
        <SampleStamp />
        <MeBlock read={me} />
        {/* The way back to every notice, read or not (review 2026-11-07): a
            mute's end, an appeal, Edit and Repost, and the only word on a post
            the child-safety rule removed all live there. */}
        <SecHead>Your posts</SecHead>
        <Pressable
          onPress={() => navigation.navigate('ForumNotices')}
          style={({ pressed }) => [st.noticeRow, pressed && st.pressed]}
          accessibilityRole="button"
          accessibilityLabel="Notices about your posts"
        >
          <Text style={st.markTitle}>Notices about your posts ›</Text>
          <Text style={st.markEx}>Reviews, removals, appeals and anything that limits your posting.</Text>
        </Pressable>
        <SecHead>Bookmarks</SecHead>
        {marks.stale ? <StaleNote /> : null}
      </>
    ),
    [marks.stale, me, navigation],
  );

  return (
    <View style={forumStyles.root}>
      <ForumHeader title="Your forum" sub="Your level, badges and bookmarks" />
      <FlatList
        data={marks.face === 'ready' ? (marks.value ?? []) : []}
        keyExtractor={(b) => b.postId}
        contentContainerStyle={st.list}
        ListHeaderComponent={header}
        renderItem={({ item }) => (
          <View style={st.mark}>
            <Pressable
              onPress={() => navigation.navigate('ForumThread', { topicId: item.topicId, jumpTo: item.postId })}
              style={({ pressed }) => [st.markBody, pressed && st.pressed]}
              accessibilityRole="button"
              accessibilityLabel={item.topicTitle}
            >
              <Text style={st.markTitle}>{item.topicTitle}</Text>
              <Text style={st.markEx} numberOfLines={2}>
                {item.excerpt}
              </Text>
              {item.remindAt ? <Text style={st.remind}>Reminder set · {reminderWhen(item.remindAt)}</Text> : null}
            </Pressable>
            <Pressable
              onPress={() => remove(item)}
              disabled={removing(item.postId)}
              hitSlop={10}
              accessibilityRole="button"
              accessibilityLabel={`Remove the bookmark on ${item.topicTitle}`}
            >
              <Text style={st.remove}>✕</Text>
            </Pressable>
          </View>
        )}
        ListEmptyComponent={
          marks.face === 'loading' ? (
            <ForumLoading label="Loading your bookmarks…" />
          ) : marks.face === 'unreadable' ? (
            <ForumUnreadable error={marks.error} code={marks.code} onRetry={() => void marks.reload()} />
          ) : (
            <ForumEmpty title="No bookmarks yet" text="Tap ··· on any post, then Bookmark, to keep it here." />
          )
        }
      />
    </View>
  );
}

function reminderWhen(iso: string): string {
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return '';
  return t > Date.now() ? new Date(iso).toLocaleDateString() : `${timeAgo(iso)} ago`;
}

function MeBlock({ read }: { read: ReturnType<typeof useForumRead<ForumMe | null>> }) {
  if (read.face === 'loading') return <ForumLoading label="Loading your level…" />;
  if (read.face === 'unreadable') {
    return <ForumUnreadable error={read.error} code={read.code} onRetry={() => void read.reload()} />;
  }
  const me = read.value;
  const level = levelFace(me?.trust);
  return (
    <View>
      <SecHead style={st.firstHead}>Your level</SecHead>
      {level ? (
        <View style={st.level}>
          <Text style={st.levelName}>{level.label}</Text>
          {level.next ? <Text style={st.levelNext}>{level.next}</Text> : null}
        </View>
      ) : (
        <Text style={st.quiet}>Your level appears after your first post.</Text>
      )}
      <SecHead>Badges</SecHead>
      {me && me.badges.length > 0 ? (
        me.badges.map((b) => (
          <View key={b.slug} style={st.badge}>
            <Text style={st.badgeName}>★ {b.name}</Text>
            {BADGE_MEANINGS[b.slug] ? <Text style={st.badgeText}>{BADGE_MEANINGS[b.slug]}</Text> : null}
          </View>
        ))
      ) : (
        <Text style={st.quiet}>Badges come from helping people here. Your first Solution earns one.</Text>
      )}
    </View>
  );
}

const st = StyleSheet.create({
  pressed: { opacity: 0.7 },
  list: { paddingHorizontal: 16, paddingBottom: 24, flexGrow: 1 },
  firstHead: { marginTop: 4 },
  level: { backgroundColor: F.panel, borderWidth: 1, borderColor: F.line, borderRadius: 14, padding: 12 },
  levelName: { fontFamily: fonts.oswaldSemiBold, fontSize: 16, letterSpacing: 0.4, color: F.text },
  levelNext: { fontFamily: fonts.barlowRegular, fontSize: 13, lineHeight: 18.5, color: F.sub, marginTop: 4 },
  badge: { paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: F.line },
  badgeName: { fontFamily: fonts.barlowSemiBold, fontSize: 14, color: F.amber },
  badgeText: { fontFamily: fonts.barlowRegular, fontSize: 12.5, lineHeight: 17, color: F.sub, marginTop: 2 },
  quiet: { fontFamily: fonts.barlowRegular, fontSize: 13, lineHeight: 18, color: F.muted },
  noticeRow: { paddingVertical: 11, borderBottomWidth: 1, borderBottomColor: F.line },
  mark: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, paddingVertical: 11, borderBottomWidth: 1, borderBottomColor: F.line },
  markBody: { flex: 1, minWidth: 0 },
  markTitle: { fontFamily: fonts.barlowSemiBold, fontSize: 14.5, lineHeight: 19, color: F.text },
  markEx: { fontFamily: fonts.barlowRegular, fontSize: 12.5, lineHeight: 17, color: F.sub, marginTop: 3 },
  remind: { fontFamily: fonts.mono, fontSize: 10, color: F.amber, marginTop: 4 },
  remove: { fontFamily: fonts.barlowMedium, fontSize: 14, color: F.muted, padding: 2 },
});
