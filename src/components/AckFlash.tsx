/**
 * One acknowledgement flash on a list icon (owner 2026-10-23, Glossary;
 * Flashcards 2026-10-24): when a term is added to or removed from Bookmarks /
 * the Custom Study List, that list's icon in the filter row grows and settles
 * ONCE, so the action is seen to have landed there. Reduced motion /
 * Low-Light: a brief dim instead. `n` counts actions; each new value plays
 * the flash once. Shared so every screen's flash is the same.
 */
import { useEffect, useRef, type ReactNode } from 'react';
import { Animated } from 'react-native';
import { useDecorativeMotion } from '../features/settings/decorativeMotion';

export function AckFlash({ n, children }: { n: number; children: ReactNode }) {
  const motion = useDecorativeMotion();
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (!n) return;
    v.setValue(0);
    Animated.sequence([
      Animated.timing(v, { toValue: 1, duration: 170, useNativeDriver: true }),
      Animated.timing(v, { toValue: 0, duration: 330, useNativeDriver: true }),
    ]).start();
  }, [n, v]);
  const style = motion
    ? { transform: [{ scale: v.interpolate({ inputRange: [0, 1], outputRange: [1, 1.45] }) }] }
    : { opacity: v.interpolate({ inputRange: [0, 1], outputRange: [1, 0.35] }) };
  return <Animated.View style={style}>{children}</Animated.View>;
}
