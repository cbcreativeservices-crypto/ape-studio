/**
 * StudyStack — nested stack inside the Study tab: Dashboard (S4*) → study
 * method screens (S2/S3/S4). Nesting keeps the bottom tab bar visible on the
 * study screens, per the locked specs.
 */
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { DashboardScreen } from '../screens/dashboard/DashboardScreen';
import { FlashcardsScreen } from '../screens/study/FlashcardsScreen';
import { FillInBlankScreen } from '../screens/study/FillInBlankScreen';
import { MatchingScreen } from '../screens/study/MatchingScreen';
import { QuizScreen } from '../screens/quiz/QuizScreen';
import { GlossaryScreen } from '../screens/glossary/GlossaryScreen';
import { EarTrainingScreen } from '../screens/study/EarTrainingScreen';
import { ScenariosScreen } from '../screens/study/ScenariosScreen';
import type { StudyStackParamList } from './types';

const Stack = createNativeStackNavigator<StudyStackParamList>();

export function StudyStack() {
  return (
    // gestureEnabled:false everywhere: study/quiz screens own horizontal swipes
    // (card prev/next, matching boards) and Dashboard is reached only via the
    // bottom nav, never an edge swipe-back. Quiz exit routes through its own
    // wipe-confirm back control.
    <Stack.Navigator
      initialRouteName="Dashboard"
      screenOptions={{ headerShown: false, gestureEnabled: false }}
    >
      <Stack.Screen name="Dashboard" component={DashboardScreen} />
      <Stack.Screen name="Flashcards" component={FlashcardsScreen} />
      <Stack.Screen name="FillInBlank" component={FillInBlankScreen} />
      <Stack.Screen name="Matching" component={MatchingScreen} />
      <Stack.Screen name="Quiz" component={QuizScreen} />
      <Stack.Screen name="Glossary" component={GlossaryScreen} />
      <Stack.Screen name="EarTraining" component={EarTrainingScreen} />
      <Stack.Screen name="Scenarios" component={ScenariosScreen} />
    </Stack.Navigator>
  );
}
