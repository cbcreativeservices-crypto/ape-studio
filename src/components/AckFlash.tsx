/**
 * One acknowledgement flash on a list icon (owner 2026-10-23, Glossary;
 * Flashcards 2026-10-24): when a term is added to or removed from Bookmarks /
 * the Custom Study List, that list's icon in the filter row grows and settles
 * ONCE, so the action is seen to have landed there. Reduced motion /
 * Low-Light: a brief dim instead. `n` counts actions; each new value plays
 * the flash once. Shared so every screen's flash is the same.
 */
import { useEffect, useRef, useState, type ReactNode } from 'react';
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

/** How long a list icon shows its colour after an add/remove (owner 2026-10-26). */
export const ACK_TINT_MS = 400;

/**
 * True for ACK_TINT_MS after each new `n` (owner 2026-10-26: "flash the list
 * button bookmark icon purple for .4 sec" on add AND remove). The host colours
 * the icon while it is true; it plays alongside AckFlash's grow. A colour
 * change is not motion, so it shows under reduced motion / Low-Light too.
 */
export function useAckTint(n: number): boolean {
  const [lit, setLit] = useState(false);
  useEffect(() => {
    if (!n) return undefined;
    setLit(true);
    const t = setTimeout(() => setLit(false), ACK_TINT_MS);
    return () => clearTimeout(t);
  }, [n]);
  return lit;
}
