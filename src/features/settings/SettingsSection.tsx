/**
 * Collapsible Settings container (owner 2026-08-30: "clean up this page by
 * collapsing notifications into a container, and other areas the same").
 *
 * Before this, Settings was one flat scroll — NOTIFICATIONS alone was ten
 * un-grouped rows — so finding anything meant reading the whole page. Each
 * section is now a bordered card whose header is the tap target:
 *
 *   ▸ NOTIFICATIONS                                    3 on
 *
 * The right-hand SUMMARY is what makes a collapsed section still useful: you
 * can read the state of the whole app without opening anything. Sections that
 * matter most (or that the user is actively working in) open by default.
 */
import { useCallback, useState, type ReactNode } from 'react';
import { LayoutAnimation, Platform, Pressable, StyleSheet, Text, UIManager, View } from 'react-native';
import { colors, fonts } from '../../theme/tokens';
import { hapticsEnabled } from './store';
import * as Haptics from 'expo-haptics';

// Old-architecture Android needs this opt-in for LayoutAnimation. Guarded —
// the API is absent on Fabric, where animations are on by default.
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export function SettingsSection({
  title,
  summary,
  defaultOpen = false,
  danger = false,
  children,
}: {
  title: string;
  /** Short state read-out shown on the header while collapsed, e.g. "3 on". */
  summary?: string;
  defaultOpen?: boolean;
  /** Destructive sections (Delete account) get a red rather than amber key. */
  danger?: boolean;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);

  const toggle = useCallback(() => {
    // `reduceAnimations` is honoured by skipping the layout animation entirely
    // rather than by shortening it — a partial animation is worse than none.
    LayoutAnimation.configureNext(LayoutAnimation.create(160, 'easeInEaseOut', 'opacity'));
    if (hapticsEnabled()) void Haptics.selectionAsync();
    setOpen((v) => !v);
  }, []);

  return (
    <View style={[styles.card, danger && styles.cardDanger]}>
      <Pressable
        style={styles.header}
        onPress={toggle}
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        accessibilityLabel={`${title}${summary ? `, ${summary}` : ''}, ${open ? 'expanded' : 'collapsed'}`}
      >
        {/* Rotating caret rather than swapping two glyphs — one element, and
            the direction reads as "this opens downward". */}
        <Text style={[styles.caret, danger && styles.caretDanger, open && styles.caretOpen]}>▸</Text>
        <Text style={[styles.title, danger && styles.titleDanger]}>{title}</Text>
        <View style={styles.spacer} />
        {summary ? <Text style={styles.summary}>{summary}</Text> : null}
      </Pressable>
      {open ? <View style={styles.body}>{children}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#121215',
    borderWidth: 1,
    borderColor: '#26262e',
    borderRadius: 12,
    overflow: 'hidden',
  },
  cardDanger: { borderColor: 'rgba(194,91,82,.45)' },
  // 52 px tall — comfortably over the 44 px touch minimum for the full row.
  header: { flexDirection: 'row', alignItems: 'center', gap: 9, paddingHorizontal: 14, minHeight: 52 },
  caret: { fontFamily: fonts.oswaldSemiBold, fontSize: 13, color: colors.amber, width: 12 },
  caretDanger: { color: '#c25b52' },
  caretOpen: { transform: [{ rotate: '90deg' }] },
  title: { fontFamily: fonts.oswaldSemiBold, fontSize: 12, letterSpacing: 1.6, color: colors.amberLabel },
  titleDanger: { color: '#c25b52' },
  spacer: { flex: 1 },
  summary: { fontFamily: fonts.mono, fontSize: 11, color: colors.textSubAlt },
  // The body is inset from the header so the hairline rows never touch the
  // card border, which was what made the old flat list feel like a wall.
  body: { paddingHorizontal: 14, paddingBottom: 4, borderTopWidth: 1, borderTopColor: '#212128' },
});
