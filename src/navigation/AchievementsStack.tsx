/**
 * AchievementsStack — Achievements tab: S5* grid → S9 Gallery. Nested so the
 * bottom tab bar stays visible on both (locked). Re-tapping the Achievements
 * tab pops back to the grid (TabBar behavior).
 */
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AchievementsScreen } from '../screens/achievements/AchievementsScreen';
import { GalleryScreen } from '../screens/achievements/GalleryScreen';
import type { AchievementsStackParamList } from './types';

const Stack = createNativeStackNavigator<AchievementsStackParamList>();

export function AchievementsStack() {
  return (
    <Stack.Navigator initialRouteName="AchievementsGrid" screenOptions={{ headerShown: false }}>
      <Stack.Screen name="AchievementsGrid" component={AchievementsScreen} />
      <Stack.Screen name="Gallery" component={GalleryScreen} />
    </Stack.Navigator>
  );
}
