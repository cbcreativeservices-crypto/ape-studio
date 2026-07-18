/**
 * MainTabs — bottom tab shell (Home / Study / Achievements / Profile) using the
 * custom studio TabBar. Default tab = Study (Dashboard) per the seed brief nav
 * map. The Achievements glyph color tracks the live Album Level; until profile
 * data is wired (Milestone 7) it defaults to the Black tier.
 */
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { TabBar } from '../components/nav/TabBar';
import { StudyStack } from './StudyStack';
import { AchievementsStack } from './AchievementsStack';
import { CourseSelectionScreen } from '../screens/courses/CourseSelectionScreen';
import { ProfileScreen } from '../screens/profile/ProfileScreen';
import { useAlbumTier } from '../features/profile/api';
import type { MainTabParamList } from './types';

const Tab = createBottomTabNavigator<MainTabParamList>();

export function MainTabs() {
  // Achievements tab glyph = the student's LIVE Album Level (locked spec);
  // profile/achievements fetches push updates into the tier store.
  const album = useAlbumTier();
  return (
    <Tab.Navigator
      // Booth 2026-07-07: the app opens on Course Selection (glossary-first
      // carousel with persisted position), not the Dashboard.
      initialRouteName="Home"
      screenOptions={{ headerShown: false }}
      tabBar={(props) => <TabBar {...props} album={album} />}
    >
      <Tab.Screen name="Home" component={CourseSelectionScreen} />
      {/* popToTopOnBlur (Booth 2026-07-10, STUDY-tab regression #5): leaving a
          stack-backed tab pops its stack to routes[0] using the navigator's
          own LIVE keys (v7 built-in — no stale-key dispatch). Paired with the
          Home glossary card's two-step mount, routes[0] is always the root. */}
      <Tab.Screen name="Study" component={StudyStack} options={{ popToTopOnBlur: true }} />
      <Tab.Screen name="Achievements" component={AchievementsStack} options={{ popToTopOnBlur: true }} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}
