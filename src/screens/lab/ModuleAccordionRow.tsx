/**
 * ModuleAccordionRow — the collapsed-by-default accordion row for the lab
 * HUB-home menus (owner 2026-08-23). Collapsed shows a reveal triangle + the
 * module name; expanded reveals the blurb + a green [OPEN] button (never a
 * right-side chevron that could read as another reveal triangle). The parent
 * keeps a single open id so only one row is open at a time.
 *
 * Mirrors EarLabScreen's LabRow, for the hub screens (Eq / Gain / Digital /
 * Meter / Wave) that previously rendered every module card fully expanded and
 * opened on tap. `num` is the optional module-order badge some hubs show.
 */
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, fonts } from '../../theme/tokens';

export function ModuleAccordionRow({
  name,
  blurb,
  num,
  expanded,
  done,
  onToggle,
  onOpen,
}: {
  name: string;
  blurb: string;
  num?: number | string;
  expanded: boolean;
  /** Optional viewed/passed tick (categorical state -> stoplight green). */
  done?: boolean;
  onToggle: () => void;
  onOpen: () => void;
}) {
  return (
    <Pressable
      onPress={onToggle}
      accessibilityRole="button"
      accessibilityState={{ expanded }}
      accessibilityLabel={`${name}, ${expanded ? 'expanded' : 'collapsed'}`}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      <Text style={styles.caret}>{expanded ? '▾' : '▸'}</Text>
      {num != null ? <Text style={styles.num}>{num}</Text> : null}
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={styles.name}>{name}</Text>
        {expanded ? <Text style={styles.blurb}>{blurb}</Text> : null}
      </View>
      {done ? <Text style={styles.done}>{'\u2713'}</Text> : null}
      {expanded ? (
        <Pressable
          onPress={onOpen}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={`Open ${name}`}
          style={({ pressed }) => [styles.openBtn, pressed && styles.pressed]}
        >
          <Text style={styles.openText}>OPEN</Text>
        </Pressable>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#26262c',
    backgroundColor: '#131316',
    paddingVertical: 11,
    paddingHorizontal: 12,
    minHeight: 54,
  },
  pressed: { opacity: 0.85 },
  caret: { fontFamily: fonts.oswaldSemiBold, fontSize: 14, color: colors.amber, width: 16, textAlign: 'center' },
  num: { fontFamily: fonts.oswaldSemiBold, fontSize: 12, color: colors.textSub, minWidth: 14, textAlign: 'center' },
  name: { fontFamily: fonts.oswaldMedium, fontSize: 15.5, letterSpacing: 0.5, color: colors.textPrimary },
  blurb: { fontFamily: fonts.barlowRegular, fontSize: 12.5, lineHeight: 17, color: colors.textSub },
  openBtn: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(55,224,95,.6)',
    backgroundColor: '#0c1a10',
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  openText: { fontFamily: fonts.oswaldSemiBold, fontSize: 12, letterSpacing: 1, color: colors.green },
  done: { fontFamily: fonts.oswaldSemiBold, fontSize: 14, color: colors.green },
});
