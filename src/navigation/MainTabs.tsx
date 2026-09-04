/**
 * MainTabs — bottom tab shell (Home / Study / Achievements / Profile) using the
 * custom studio TabBar. Default tab = Study (Dashboard) per the seed brief nav
 * map. (The Achievements/PROGRESS glyph is a fixed silver record — the album
 * tier no longer drives it; owner 2026-08-07.)
 */
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { CommonActions } from '@react-navigation/native';
import { TabBar } from '../components/nav/TabBar';
import { StudyStack } from './StudyStack';
import { AchievementsStack } from './AchievementsStack';
import { CourseSelectionScreen } from '../screens/courses/CourseSelectionScreen';
import { ProfileScreen } from '../screens/profile/ProfileScreen';
import type { MainTabParamList } from './types';

const Tab = createBottomTabNavigator<MainTabParamList>();

/**
 * Guarded replacement for `popToTopOnBlur` (owner 2026-08-13). The built-in
 * option dispatches POP_TO_TOP on EVERY blur — including when the tab's nested
 * stack is already at its root (or not yet mounted), which logs the dev warning
 * "The action 'POP_TO_TOP' was not handled by any navigator." Here we reset the
 * nested stack to its root ONLY when it exists AND is off-root — the same
 * guarded shape the TabBar uses on press — so no POP_TO_TOP ever fires at a
 * single-route/unmounted stack. Still invisible: the reset lands while the tab
 * is already blurred, so returning shows the root.
 */
function resetToRootOnBlur(root: string) {
  return ({ navigation, route }: { navigation: any; route: { key: string } }) => ({
    blur: () => {
      const self = navigation.getState?.()?.routes?.find((r: { key: string }) => r.key === route.key);
      const nested = self?.state;
      if (
        nested?.key &&
        Array.isArray(nested.routes) &&
        (nested.index !== 0 || nested.routes[0]?.name !== root)
      ) {
        navigation.dispatch({
          ...CommonActions.reset({ index: 0, routes: [{ name: root }] }),
          target: nested.key,
        });
      }
    },
  });
}

export function MainTabs() {
  return (
    <Tab.Navigator
      // Booth 2026-07-07: the app opens on Course Selection (glossary-first
      // carousel with persisted position), not the Dashboard.
      initialRouteName="Home"
      // Transition standard (owner 2026-08-16): bottom-nav destination ⇄
      // destination = FADE-THROUGH (~200ms) — content fades, the TabBar stays
      // stationary. No zoom/bounce/shift.
      screenOptions={{
        headerShown: false,
        animation: 'fade',
        transitionSpec: { animation: 'timing', config: { duration: 200 } },
      }}
      tabBar={(props) => <TabBar {...props} />}
    >
      <Tab.Screen name="Home" component={CourseSelectionScreen} />
      {/* Reset-to-root-on-blur (Booth 2026-07-10, STUDY-tab regression #5):
          leaving a stack-backed tab returns it to its root. GUARDED manual
          version (owner 2026-08-13) — the built-in popToTopOnBlur logged
          "POP_TO_TOP was not handled by any navigator" when the stack was
          already at its root; resetToRootOnBlur only acts when off-root. */}
      <Tab.Screen name="Study" component={StudyStack} listeners={resetToRootOnBlur('Dashboard')} />
      <Tab.Screen
        name="Achievements"
        component={AchievementsStack}
        listeners={resetToRootOnBlur('AchievementsHome')}
      />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}
