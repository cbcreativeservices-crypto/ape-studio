/**
 * HomeOrBackKey — the top-left way out of a screen (owner rule 2026-10-14).
 *
 * When the back step lands on Home (the screen was opened straight from Home)
 * it is the HOME key — the same NavIcon the Glossary and CompactBrandBar use,
 * labelled "Home". Two or more levels deep it stays the ‹ arrow. Which one is
 * decided by where the person actually came from (backLeadsHome), read once
 * when the screen mounts — the route under it does not change while it is up.
 *
 * The press is the caller's: safeGoBack(navigation), or the screen's own
 * guarded leave. Either way it IS the back step, so it lands on Home exactly
 * when the key says HOME, and Android BACK (useBackWhileFocused / the tab
 * history in MainTabs) is untouched.
 *
 * `useBackLeadsHome()` is exported for screens that already carry a HOME key
 * elsewhere (CompactBrandBar) and only need to drop a redundant ‹.
 */
import { useState } from 'react';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Pressable, Text, type StyleProp, type TextStyle, type ViewStyle } from 'react-native';
import { NavIcon } from './NavIcon';
import { BACK_HIT_SLOP } from '../backHitSlop';
import { backLeadsHome } from '../../lib/backLeadsHome';

export function useBackLeadsHome(): boolean {
  const navigation = useNavigation();
  const route = useRoute();
  const [home] = useState(() => {
    try {
      return backLeadsHome((navigation as any).getState?.(), route?.key);
    } catch {
      return false;
    }
  });
  return home;
}

export function HomeOrBackKey({
  onPress,
  backStyle,
  backLabel = 'Back',
  hitSlop = BACK_HIT_SLOP,
  style,
}: {
  onPress: () => void;
  /** The screen's own ‹ glyph style — the arrow looks exactly as before. */
  backStyle?: StyleProp<TextStyle>;
  backLabel?: string;
  hitSlop?: number | { top?: number; bottom?: number; left?: number; right?: number };
  /** Applied to the Pressable in BOTH faces (layout slot of the old arrow). */
  style?: StyleProp<ViewStyle>;
}) {
  const home = useBackLeadsHome();
  if (home) {
    return (
      <Pressable onPress={onPress} hitSlop={10} accessibilityRole="button" accessibilityLabel="Home" style={style}>
        <NavIcon icon="Home" lit />
      </Pressable>
    );
  }
  return (
    <Pressable onPress={onPress} hitSlop={hitSlop} accessibilityRole="button" accessibilityLabel={backLabel} style={style}>
      <Text style={backStyle}>‹</Text>
    </Pressable>
  );
}
