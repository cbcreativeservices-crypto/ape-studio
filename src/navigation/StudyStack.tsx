/**
 * StudyStack — nested stack inside the Study tab: Dashboard (S4*) → study
 * method screens (S2/S3/S4). Nesting keeps the bottom tab bar visible on the
 * study screens, per the locked specs.
 */
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ScreenErrorBoundary } from '../components/ScreenErrorBoundary';
import { NAV_PUSH, NAV_PUSH_REDUCED, useReduceMotionNav } from './reduceMotionNav';
import { useNavOrientation } from './navOrientation'; // bug hunt 2026-09-29 — see that file
import { DashboardScreen } from '../screens/dashboard/DashboardScreen';
import type { StudyStackParamList } from './types';
import { lazyScreen } from './lazyScreen';

const Stack = createNativeStackNavigator<StudyStackParamList>();

// Lazy screens (perf decision B, 2026-10-04): the Dashboard is the tab's first
// paint and stays imported; each study method loads on first visit. One cached
// component per route — see lazyScreen.ts.
/* eslint-disable @typescript-eslint/no-var-requires */
const Lazy = {
  Flashcards: lazyScreen(() => require('../screens/study/FlashcardsScreen').FlashcardsScreen),
  FillInBlank: lazyScreen(() => require('../screens/study/FillInBlankScreen').FillInBlankScreen),
  Matching: lazyScreen(() => require('../screens/study/MatchingScreen').MatchingScreen),
  Quiz: lazyScreen(() => require('../screens/quiz/QuizScreen').QuizScreen),
  Glossary: lazyScreen(() => require('../screens/glossary/GlossaryScreen').GlossaryScreen),
  Scenarios: lazyScreen(() => require('../screens/study/ScenariosScreen').ScenariosScreen),
} as const;

export function StudyStack() {
  // Transition standard (owner 2026-08-16): opening a study method from the
  // Dashboard = PUSH (platform-native horizontal; short fade under Reduce
  // Motion). Glossary ⇄ Dashboard are EQUAL-LEVEL destinations → fade-through.
  const reduceMotion = useReduceMotionNav();
  const push = reduceMotion ? NAV_PUSH_REDUCED : NAV_PUSH;
  // Portrait on phones, free on tablets (owner 2026-09-29, Android large-screen pass).
  const navOrientation = useNavOrientation();
  return (
    // gestureEnabled:false everywhere: study/quiz screens own horizontal swipes
    // (card prev/next, matching boards) and Dashboard is reached only via the
    // bottom nav, never an edge swipe-back. Quiz exit routes through its own
    // wipe-confirm back control.
    <Stack.Navigator
      initialRouteName="Dashboard"
      screenOptions={{ headerShown: false, gestureEnabled: false, ...navOrientation, ...push }}
      // Per-screen error containment (2026-09-11). Innermost boundary wins, so
      // a broken study method is contained HERE — the Dashboard below it, the
      // tab bar and the session all survive. Renders a Fragment while healthy,
      // so it adds no view; it is inside the card, so gestures/transitions are
      // untouched.
      screenLayout={({ children, navigation, route }) => (
        <ScreenErrorBoundary navigation={navigation} routeName={route.name}>
          {children}
        </ScreenErrorBoundary>
      )}
    >
      <Stack.Screen name="Dashboard" component={DashboardScreen} />
      <Stack.Screen name="Flashcards" getComponent={Lazy.Flashcards} />
      <Stack.Screen name="FillInBlank" getComponent={Lazy.FillInBlank} />
      <Stack.Screen name="Matching" getComponent={Lazy.Matching} />
      <Stack.Screen name="Quiz" getComponent={Lazy.Quiz} />
      {/* Glossary used to be the ONE screen in this stack with a fade
          transition. Two iOS reports point at exactly this route when it is
          reached from Home's OPEN GLOSSARY (a cross-tab navigate that mounts
          the stack and pushes in the same frame): build 28 iPhone "glossary
          lands on the dashboard", and 2026-09-25 iPad "black screen, twice"
          with no JS error, no server error, and the corpus fully loaded.
          Every other Study screen uses the stack's default push and works on
          the same iPad, so the Glossary now does too (owner re-tests). */}
      <Stack.Screen name="Glossary" getComponent={Lazy.Glossary} />
      <Stack.Screen name="Scenarios" getComponent={Lazy.Scenarios} />
    </Stack.Navigator>
  );
}
