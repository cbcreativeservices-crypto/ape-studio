/**
 * CelebrationScreen — the route that shows a full-screen celebration and turns
 * its buttons into real navigation.
 *
 * Owner 2026-09-17: "topic-complete replaces TrophyScreen". This is that
 * replacement, and it is deliberately thin — the card itself is the shared
 * `Celebration` component, the words are in `catalog.ts`, and the ONLY thing
 * that lives here is the mapping from an action KIND to somewhere to go. That
 * separation is what lets the catalog be tested without a navigator.
 *
 * ── WHAT HAPPENED TO TrophyScreen ────────────────────────────────────────────
 *
 * It is NOT deleted, and deleting it would have been a regression. It served
 * two different jobs behind one route:
 *
 *   entrySource 'quiz_win'                     → the celebration  ← replaced here
 *   entrySource 'gallery' / 'achievements_grid' → a VIEWER for an already-earned
 *                                                 trophy, reached by tapping it
 *
 * Only the first is a celebration. The second is someone deliberately opening a
 * trophy they earned weeks ago, and it must keep working — so TrophyScreen
 * stays as the viewer and loses only its quiz-win branch.
 *
 * ── WHY THE PARAMS CARRY AN ID RATHER THAN COPY ──────────────────────────────
 *
 * The route takes a CelebrationId and the values to fill it with, never the
 * rendered text. A deep link, a dev-menu entry and the quiz all produce the
 * same screen, and the wording can be edited in one file without touching any
 * caller.
 */
import { useCallback, useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Celebration } from '../../features/celebration/Celebration';
import { celebration } from '../../features/celebration/catalog';
import type { CelebrationActionKind } from '../../features/celebration/types';
import { colors } from '../../theme/tokens';
import { supabase } from '../../lib/supabase';
import type { RootStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'Celebration'>;

export function CelebrationScreen({ navigation, route }: Props) {
  const insets = useSafeAreaInsets();
  const { id, values, context } = route.params;
  const def = celebration(id);

  // The badge line. TrophyScreen announced a badge when the attempt earned one,
  // and the first version of this replacement dropped it silently — a bug-hunt
  // pass caught it the same day. Fetched exactly as TrophyScreen did.
  //
  // It renders only once the name arrives, so a slow or failed lookup costs the
  // line rather than blocking the celebration. Saying "you earned a badge"
  // without being able to name it would be worse than saying nothing.
  const [badgeName, setBadgeName] = useState<string | null>(null);
  useEffect(() => {
    const achievementId = context?.badge?.achievementId;
    if (!achievementId) return;
    let alive = true;
    void supabase
      .from('achievements')
      .select('badge_trigger')
      .eq('id', achievementId)
      .single()
      .then(
        ({ data }) => {
          if (alive) setBadgeName(data?.badge_trigger?.toUpperCase() ?? null);
        },
        () => {},
      );
    return () => {
      alive = false;
    };
  }, [context]);

  /** Where the user lands when a celebration is over. */
  const toStudy = useCallback(() => {
    navigation.reset({
      index: 0,
      routes: [{ name: 'Main', params: { screen: 'Study', params: { screen: 'Dashboard' } } }],
    });
  }, [navigation]);

  const onAction = useCallback(
    (kind: CelebrationActionKind) => {
      switch (kind) {
        case 'view-results':
          // The quiz result is handed through so REVIEW RESULTS works from
          // here without re-fetching an attempt that has already been graded.
          if (context?.results) {
            navigation.replace('Results', context.results);
            return;
          }
          toStudy();
          return;

        case 'trophy-case':
          navigation.reset({
            index: 0,
            routes: [
              {
                name: 'Main',
                params: { screen: 'Achievements', params: { screen: 'AchievementsHome' } },
              },
            ],
          });
          return;

        case 'view-credential':
          if (context?.award) {
            navigation.replace('AwardProgress', context.award);
            return;
          }
          navigation.reset({
            index: 0,
            routes: [
              {
                name: 'Main',
                params: { screen: 'Achievements', params: { screen: 'AchievementsHome' } },
              },
            ],
          });
          return;

        case 'retry-quiz':
        case 'start-quiz':
          // Both return to the Dashboard rather than launching a quiz directly:
          // starting an attempt has its own gating (intent, entitlement, the
          // activation floor) and jumping past it from a celebration is how a
          // half-started attempt gets created.
          toStudy();
          return;

        case 'view-summary':
        case 'view-requirement':
        case 'share':
        // Share and the two summary destinations are not built yet. Falling
        // through to the same exit as DONE is the honest behaviour: the button
        // does what it can rather than dead-ending, and nothing here pretends
        // to have shared something.
        // eslint-disable-next-line no-fallthrough
        case 'dismiss':
        default:
          toStudy();
      }
    },
    [navigation, context, toStudy],
  );

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <Celebration
        def={def}
        values={values}
        extra={badgeName ? `You also earned the ${badgeName} badge — see it on your Profile.` : null}
        onAction={onAction}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  // The Celebration component draws its own backdrop when it renders as a
  // screen; this only guarantees a dark page behind it in the notice case
  // (low-light), where there is no modal.
  root: { flex: 1, backgroundColor: colors.screenBg, justifyContent: 'center', paddingHorizontal: 18 },
});
