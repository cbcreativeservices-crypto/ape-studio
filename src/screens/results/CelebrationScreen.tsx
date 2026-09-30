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
import { useCallback, useRef } from 'react';
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


  /**
   * Where the user lands when a celebration is over: the Study Dashboard.
   *
   * goBack() FIRST (2026-09-27 audit). Both routes into this screen leave the
   * existing Main shell — Study tab on its Dashboard — directly beneath it:
   * QuizScreen popToTop()s the Study stack to the Dashboard before navigating
   * here, and DashboardScreen's credential check navigates here FROM the
   * Dashboard. So popping this one screen lands exactly where the old reset
   * did, without remounting the whole tab shell: the reset threw away the
   * Dashboard's pending params (a focus not yet landed) and every other tab's
   * state, Home's deck position included. The reset stays as the fallback for
   * a Celebration with nothing under it (e.g. a restored navigation state).
   */
  /**
   * ONE EXIT PER SCREEN (bug pass 2, 2026-09-30) — same latch as ResultsScreen.
   * A RESET is honoured even from a screen that is already leaving, so a double
   * tap on "Trophy case" rebuilt the whole tab shell twice, and a double tap on
   * DONE could goBack() twice (popping the Dashboard's parent too). A ref,
   * because the second tap lands before any re-render.
   */
  const leavingRef = useRef(false);

  const toStudy = useCallback(() => {
    if (navigation.canGoBack()) {
      navigation.goBack();
      return;
    }
    navigation.reset({
      index: 0,
      routes: [{ name: 'Main', params: { screen: 'Study', params: { screen: 'Dashboard' } } }],
    });
  }, [navigation]);

  const onAction = useCallback(
    (kind: CelebrationActionKind) => {
      if (leavingRef.current) return;
      leavingRef.current = true;
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
