/**
 * TabBar — bottom nav (design-reference TabBar.dc.html): 60px, brushed-metal
 * gradient, top hairline + inset highlight. Home / Study / Achievements /
 * Profile, each a NavIcon. Safe-area inset added below the 60px bar.
 */
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CommonActions } from '@react-navigation/native';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { NavIcon, type NavIconName } from './NavIcon';
import { useFootnote } from '../../lib/footnote';
import { colors, fonts } from '../../theme/tokens';
import { CommunityBadge, useCommunityInbox } from '../../features/directory/CommunityBadge';
import { badgeA11y } from '../../features/directory/inboxCounts';

const TAB_ORDER: NavIconName[] = ['Home', 'Study', 'Achievements', 'Profile'];

/** Root screen of each nested-stack tab (for active-tab re-tap). */
const TAB_ROOTS: Partial<Record<NavIconName, string>> = {
  Study: 'Dashboard',
  Achievements: 'AchievementsHome',
};

export function TabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const activeRoute = state.routes[state.index]?.name;
  // Occasional reminder strip BELOW the nav buttons (Booth 2026-07-08) —
  // renders only when a notice is set (see src/lib/footnote.ts).
  const footnote = useFootnote();
  const inbox = useCommunityInbox();
  const inboxLabel = badgeA11y(inbox);

  return (
    // Original black nav bar (matches the other screens, Booth 2026-07-11).
    <LinearGradient colors={['#1b1b1b', '#0d0d0d']} style={[styles.bar, { paddingBottom: insets.bottom }]}>
      <View style={styles.row}>
        {TAB_ORDER.map((name) => {
          const lit = activeRoute === name;
          const route = state.routes.find((r) => r.name === name);
          const handlePress = () => {
            if (!route) return;
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });
            if (event.defaultPrevented) return;

            const root = TAB_ROOTS[name];

            // Stack-backed tabs (Study / Achievements) ALWAYS show their root on
            // ANY press. Booth ruling: STUDY must never land on Glossary/a study
            // screen. Hardened 2026-07-18 (the plain navigate alone regressed):
            // if the nested stack exists but is NOT sitting on its root — e.g.
            // a deep-link mount left another screen at routes[0] — RESET it to
            // the root first, targeted at the stack's LIVE key from this press's
            // state (no captured/stale keys). Then navigate as before.
            if (root) {
              const nested = (route as any).state;
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
              navigation.navigate(name as any, { screen: root } as any);
            } else if (!lit) {
              navigation.navigate(name as any);
            }
          };
          return (
            <Pressable
              key={name}
              style={styles.item}
              accessibilityRole="tab"
              accessibilityState={{ selected: lit }}
              aria-selected={lit}
              // SR label matches the VISIBLE text -- the tab draws "PROGRESS"
              // while the route is named Achievements (QA night 2026-08-31).
              accessibilityLabel={
                name === 'Achievements'
                  ? 'Progress'
                  : name === 'Profile' && inboxLabel
                    ? `Profile, ${inboxLabel}`
                    : name
              }
              onPress={handlePress}
            >
              <NavIcon icon={name} lit={lit} />
              {/* The community lives under Profile: pending contact requests +
                  unread messages (owner 2026-10-04). Nothing when unknown. */}
              {name === 'Profile' ? <CommunityBadge state={inbox} style={styles.badge} /> : null}
            </Pressable>
          );
        })}
      </View>
      {footnote != null && (
        <View style={styles.footnote}>
          <Text style={styles.footnoteText} numberOfLines={1}>
            {footnote}
          </Text>
        </View>
      )}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  bar: {
    borderTopWidth: 1,
    borderTopColor: colors.black,
  },
  row: { flexDirection: 'row', height: 60 },
  item: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  // Top-right of the Profile icon, inside the 60 pt bar.
  badge: { position: 'absolute', top: 6, left: '50%', marginLeft: 8 },
  footnote: {
    borderTopWidth: 1,
    borderTopColor: '#1e1e1e',
    backgroundColor: '#151005',
    paddingVertical: 5,
    paddingHorizontal: 14,
    alignItems: 'center',
  },
  footnoteText: {
    fontFamily: fonts.barlowCondensedSemiBold,
    fontSize: 13,
    letterSpacing: 0.7,
    color: colors.amber,
  },
});
