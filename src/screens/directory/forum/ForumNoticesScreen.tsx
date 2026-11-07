/**
 * "Your post" (approved mockup, screen 7): what a member sees when Claude
 * steps in. A plain notice with the rule and the excerpt, Edit and Repost, and
 * Appeal. Every notice says whether automation was used.
 *
 * `forum_notices_mine` gives the post's id and a 280-character excerpt, not its
 * topic or full text, so Edit and Repost starts from the excerpt here. The same
 * card inside the thread starts from the whole post.
 */
import { useCallback, useEffect, useState } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { notify } from '../../../lib/confirm';
import { fetchMyModeration, markNoticeRead, type MyModeration } from '../../../features/forum/api';
import { EXCERPT_MAX, noticeFace } from '../../../features/forum/rules';
import type { ForumNotice } from '../../../features/forum/types';
import { useForumRead } from '../../../features/forum/useForumRead';
import { useReloadOnReturn } from '../../../features/forum/useReloadOnReturn';
import {
  ForumEmpty,
  ForumHeader,
  ForumLoading,
  ForumUnreadable,
  ModCard,
  SampleStamp,
  StaleNote,
  forumStyles,
} from './forumBits';
import { AppealPopup } from './forumPopups';

type Nav = { navigate: (route: string, params?: Record<string, unknown>) => void };

export function ForumNoticesScreen() {
  const navigation = useNavigation() as unknown as Nav;
  const read = useForumRead<MyModeration>(fetchMyModeration, []);
  const [appealId, setAppealId] = useState<string | null>(null);
  const [sent, setSent] = useState<string[]>([]);

  useReloadOnReturn(read.reload);

  // Seen once they are on screen.
  const value = read.value;
  useEffect(() => {
    if (!value) return;
    for (const n of value.notices) if (!n.readAt) void markNoticeRead(n.id);
  }, [value]);

  const renderItem = useCallback(
    ({ item }: { item: ForumNotice }) => {
      const face = noticeFace(item);
      const postId = item.postId;
      const appealed =
        !!postId && (sent.includes(postId) || (value?.appeals ?? []).some((a) => a.postId === postId));
      return (
        <ModCard
          tone={face.tone}
          head={face.head}
          text={face.text}
          excerpt={face.excerpt}
          how={face.how}
          crisis={face.crisis}
          actions={[
            ...(face.canEdit && postId
              ? [
                  {
                    label: 'EDIT AND REPOST',
                    primary: true,
                    onPress: () =>
                      navigation.navigate('ForumAsk', {
                        edit: { postId, isOpening: false, body: (item.excerpt ?? '').replace(/^…|…$/g, ''), partial: (item.excerpt ?? '').length >= EXCERPT_MAX },
                      }),
                  },
                ]
              : []),
            ...(face.canAppeal && postId
              ? [{ label: appealed ? 'APPEAL SENT' : 'APPEAL', disabled: appealed, onPress: () => setAppealId(postId) }]
              : []),
          ]}
        />
      );
    },
    [navigation, sent, value],
  );

  return (
    <View style={forumStyles.root}>
      <ForumHeader title="Your post" sub="What the review decided" />
      <FlatList
        data={read.face === 'ready' ? (read.value?.notices ?? []) : []}
        keyExtractor={(n) => String(n.id)}
        renderItem={renderItem}
        contentContainerStyle={st.list}
        ListHeaderComponent={
          <>
            <SampleStamp />
            {read.stale ? <StaleNote /> : null}
          </>
        }
        ListEmptyComponent={
          read.face === 'loading' ? (
            <ForumLoading label="Loading your notices…" />
          ) : read.face === 'unreadable' ? (
            <ForumUnreadable error={read.error} code={read.code} onRetry={() => void read.reload()} />
          ) : (
            <ForumEmpty title="No notices" text="Nothing has happened to your posts." />
          )
        }
      />
      <AppealPopup
        postId={appealId}
        onClose={() => setAppealId(null)}
        onDone={() => {
          if (appealId) setSent((s) => [...s, appealId]);
          setAppealId(null);
          notify('Appeal sent', 'A person will read it and you will get a notice with the decision.');
        }}
      />
    </View>
  );
}

const st = StyleSheet.create({
  list: { paddingHorizontal: 16, paddingTop: 4, paddingBottom: 24, gap: 11, flexGrow: 1 },
});

