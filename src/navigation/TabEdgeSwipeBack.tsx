/**
 * TabEdgeSwipeBack — iPhone's edge swipe-back for the ROOT screens of the
 * Profile and Progress tabs (owner 2026-10-25: "on the apple sometimes the
 * final swipe back to home doesn't go (when the android does correctly)").
 *
 * Why it was missing: Profile and Progress are bottom TABS, not pushed screens.
 * A native stack only offers the iOS edge swipe between screens of the SAME
 * stack, so a tab root had nothing to swipe back to. Android's system BACK goes
 * through the tab router instead (backBehavior="history" + tabBackRouter,
 * MainTabs.tsx), which retraces the tabs visited and ends on Home. This makes
 * the iPhone swipe do exactly the same thing: safeGoBack() from the tab root,
 * the same back Android's BACK already resolves to.
 *
 * - iOS only. Android's left edge IS the system back gesture already.
 * - Starts only in the left 24 pt (like the native edge swipe) and only on a
 *   clear rightward drag, so vertical scrolling and taps inside are untouched.
 * - Wraps ONLY the tab roots it is given. Study is not wrapped (owner: study
 *   screens own their horizontal swipes); neither is Home or the Explore pager.
 */
import type { ReactNode } from 'react';
import { useMemo } from 'react';
import { Platform, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { useNavigation } from '@react-navigation/native';
import { safeGoBack } from '../lib/safeGoBack';

const EDGE_PT = 24;
const MIN_TRAVEL = 70;
const MIN_VELOCITY = 600;

export function TabEdgeSwipeBack({ children }: { children: ReactNode }) {
  const navigation = useNavigation<any>();
  const gesture = useMemo(
    () =>
      Gesture.Pan()
        .runOnJS(true)
        .hitSlop({ left: 0, width: EDGE_PT })
        .activeOffsetX(15)
        .failOffsetY([-12, 12])
        .onEnd((e) => {
          if (e.translationX < MIN_TRAVEL && e.velocityX < MIN_VELOCITY) return;
          if (!safeGoBack(navigation) && navigation.isFocused()) navigation.navigate('Home');
        }),
    [navigation],
  );
  if (Platform.OS !== 'ios') return <>{children}</>;
  return (
    <GestureDetector gesture={gesture}>
      <View style={{ flex: 1 }} collapsable={false}>
        {children}
      </View>
    </GestureDetector>
  );
}

/** Wrap a tab-root screen component with the iPhone edge swipe-back. */
export function withTabEdgeSwipeBack<P extends object>(Screen: React.ComponentType<P>) {
  function Wrapped(props: P) {
    return (
      <TabEdgeSwipeBack>
        <Screen {...props} />
      </TabEdgeSwipeBack>
    );
  }
  Wrapped.displayName = `withTabEdgeSwipeBack(${Screen.displayName ?? Screen.name ?? 'Screen'})`;
  return Wrapped;
}
