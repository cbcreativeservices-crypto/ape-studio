/**
 * CompactBrandBar — logo · PRO AUDIO TRAINING ACADEMY · HOME.
 *
 * The small header from the Awards/Enrollments pages, extracted so other
 * screens can use it (owner 2026-09-19: "we need to use this smaller header
 * in some other screens… just the logo and pro audio training academy part
 * and home on the right").
 *
 * ⛔ IT IS DELIBERATELY ALMOST PROPLESS. The same brand row had already been
 * hand-copied into three screens and the spacing had drifted in all three —
 * identical type, three different paddings, which is invisible until two
 * screens sit side by side. A component that takes a size or a colour is a
 * component that drifts again. The only slot is `right`, for the per-screen
 * help key that Pillar C requires.
 *
 * ⛔ HOME IS `popTo`, NEVER `navigate`. Under React Navigation 7,
 * `navigate('Main')` PUSHES a second tab shell on top of the current screen —
 * leaving it, and anything it has running, mounted underneath. `popTo`
 * returns to the one Main that already exists. It is also not `goBack()`,
 * which lands wherever the user came FROM rather than at Course Select.
 * This is the single most copyable mistake in the pattern, which is exactly
 * why it lives in here now and not in each caller.
 *
 * ⚠️ NOT the same as `AppHeader`, and not to be merged with it. That one is
 * the BIG header — logo 47, wordmark 20, glossary eyebrow — for Home and the
 * Dashboard. Two sizes is a deliberate hierarchy: big at the top level,
 * compact on the interior pages.
 */
import type { ReactNode } from 'react';
import { useNavigation } from '@react-navigation/native';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { BrandLogo } from './BrandLogo';
import { NavIcon } from './nav/NavIcon';
import { colors, fonts } from '../theme/tokens';

export function CompactBrandBar({ right }: { right?: ReactNode }) {
  const navigation = useNavigation<any>();
  const home = () => navigation.popTo('Main', { screen: 'Home' });

  return (
    <View style={s.row}>
      {/* The logo is a second way home, as it is on every screen that has one. */}
      <Pressable onPress={home} hitSlop={8} accessibilityRole="button" accessibilityLabel="Back to course selection">
        <BrandLogo size={34} />
      </Pressable>
      <Text style={s.wordmark} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8}>
        PRO AUDIO <Text style={s.accent}>TRAINING ACADEMY</Text>
      </Text>
      <View style={{ flex: 1 }} />
      {right}
      <Pressable onPress={home} hitSlop={10} accessibilityRole="button" accessibilityLabel="Home" style={s.homeBtn}>
        <NavIcon icon="Home" lit />
      </Pressable>
    </View>
  );
}

const s = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingLeft: 14, paddingRight: 6, paddingBottom: 8 },
  /* shrink-to-fit is load-bearing: the wordmark has to survive a narrow phone
     with a help key beside it without wrapping to two lines. */
  wordmark: { flexShrink: 1, fontFamily: fonts.oswaldBold, fontSize: 14, letterSpacing: 0.6, color: colors.textPrimary },
  accent: { fontFamily: fonts.oswaldMedium, color: colors.amber },
  homeBtn: { padding: 4, marginRight: 8 },
});
