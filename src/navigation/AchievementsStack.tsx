/**
 * AchievementsStack — Achievements tab: S5* grid → S9 Gallery. Nested so the
 * bottom tab bar stays visible on both (locked). Re-tapping the Achievements
 * tab pops back to the grid (TabBar behavior).
 */
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { NAV_PUSH, NAV_PUSH_REDUCED, useReduceMotionNav } from './reduceMotionNav';
import { AchievementsScreen } from '../screens/achievements/AchievementsScreen';
import { GalleryScreen } from '../screens/achievements/GalleryScreen';
import type { AchievementsStackParamList } from './types';

const Stack = createNativeStackNavigator<AchievementsStackParamList>();

export function AchievementsStack() {
  // Transition standard (owner 2026-08-16): Grid → Gallery is opening
  // contained content = PUSH (short fade under Reduce Motion).
  const reduceMotion = useReduceMotionNav();
  const push = reduceMotion ? NAV_PUSH_REDUCED : NAV_PUSH;
  return (
    <Stack.Navigator
      initialRouteName="AchievementsGrid"
      screenOptions={{ headerShown: false, ...push }}
    >
      <Stack.Screen name="AchievementsGrid" component={AchievementsScreen} />
      <Stack.Screen name="Gallery" component={GalleryScreen} />
    </Stack.Navigator>
  );
}
