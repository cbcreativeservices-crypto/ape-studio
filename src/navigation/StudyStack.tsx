/**
 * StudyStack — nested stack inside the Study tab: Dashboard (S4*) → study
 * method screens (S2/S3/S4). Nesting keeps the bottom tab bar visible on the
 * study screens, per the locked specs.
 */
import { Platform } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { NAV_FADE, NAV_PUSH_REDUCED, useReduceMotionNav } from './reduceMotionNav';
import { DashboardScreen } from '../screens/dashboard/DashboardScreen';
import { FlashcardsScreen } from '../screens/study/FlashcardsScreen';
import { FillInBlankScreen } from '../screens/study/FillInBlankScreen';
import { MatchingScreen } from '../screens/study/MatchingScreen';
import { QuizScreen } from '../screens/quiz/QuizScreen';
import { GlossaryScreen } from '../screens/glossary/GlossaryScreen';
import { ScenariosScreen } from '../screens/study/ScenariosScreen';
import type { StudyStackParamList } from './types';

const Stack = createNativeStackNavigator<StudyStackParamList>();

export function StudyStack() {
  // Transition standard (owner 2026-08-16): opening a study method from the
  // Dashboard = PUSH (platform-native horizontal; short fade under Reduce
  // Motion). Glossary ⇄ Dashboard are EQUAL-LEVEL destinations → fade-through.
  const reduceMotion = useReduceMotionNav();
  const push = reduceMotion
    ? NAV_PUSH_REDUCED
    : ({ animation: Platform.OS === 'ios' ? 'default' : 'slide_from_right' } as const);
  return (
    // gestureEnabled:false everywhere: study/quiz screens own horizontal swipes
    // (card prev/next, matching boards) and Dashboard is reached only via the
    // bottom nav, never an edge swipe-back. Quiz exit routes through its own
    // wipe-confirm back control.
    <Stack.Navigator
      initialRouteName="Dashboard"
      screenOptions={{ headerShown: false, gestureEnabled: false, ...push }}
    >
      <Stack.Screen name="Dashboard" component={DashboardScreen} />
      <Stack.Screen name="Flashcards" component={FlashcardsScreen} />
      <Stack.Screen name="FillInBlank" component={FillInBlankScreen} />
      <Stack.Screen name="Matching" component={MatchingScreen} />
      <Stack.Screen name="Quiz" component={QuizScreen} />
      <Stack.Screen name="Glossary" component={GlossaryScreen} options={NAV_FADE} />
      <Stack.Screen name="Scenarios" component={ScenariosScreen} />
    </Stack.Navigator>
  );
}
