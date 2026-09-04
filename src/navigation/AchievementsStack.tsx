/**
 * AchievementsStack — the Achievements tab (redesigned for v3, 2026-09-04).
 * A "Trophy Case" hub → three categories:
 *   • Topics:  Home → TopicFields → TopicSubjects → TopicGrid (one subject)
 *   • Certificates / Programs: earned-only trophy walls
 *   • Gallery: chronological "everything earned" wall
 * Nested so the bottom tab bar stays visible on every screen (locked).
 * Re-tapping the Achievements tab pops back to the hub (TabBar behavior).
 */
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { NAV_PUSH, NAV_PUSH_REDUCED, useReduceMotionNav } from './reduceMotionNav';
import { AchievementsHomeScreen } from '../screens/achievements/AchievementsHomeScreen';
import { TopicFieldsScreen } from '../screens/achievements/TopicFieldsScreen';
import { TopicSubjectsScreen } from '../screens/achievements/TopicSubjectsScreen';
import { TopicGridScreen } from '../screens/achievements/TopicGridScreen';
import { GalleryScreen } from '../screens/achievements/GalleryScreen';
import { CertificatesScreen } from '../screens/achievements/CertificatesScreen';
import { ProgramsScreen } from '../screens/achievements/ProgramsScreen';
import type { AchievementsStackParamList } from './types';

const Stack = createNativeStackNavigator<AchievementsStackParamList>();

export function AchievementsStack() {
  // Transition standard (owner 2026-08-16): opening contained content = PUSH
  // (short fade under Reduce Motion).
  const reduceMotion = useReduceMotionNav();
  const push = reduceMotion ? NAV_PUSH_REDUCED : NAV_PUSH;
  return (
    <Stack.Navigator
      initialRouteName="AchievementsHome"
      screenOptions={{ headerShown: false, ...push }}
    >
      <Stack.Screen name="AchievementsHome" component={AchievementsHomeScreen} />
      <Stack.Screen name="TopicFields" component={TopicFieldsScreen} />
      <Stack.Screen name="TopicSubjects" component={TopicSubjectsScreen} />
      <Stack.Screen name="TopicGrid" component={TopicGridScreen} />
      <Stack.Screen name="Gallery" component={GalleryScreen} />
      <Stack.Screen name="Certificates" component={CertificatesScreen} />
      <Stack.Screen name="Programs" component={ProgramsScreen} />
    </Stack.Navigator>
  );
}
