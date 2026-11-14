/**
 * GO DEEPER ▾ — the fold for a long page (owner's decision 5, 2026-11-14:
 * "beginner core first; keep ALL content and fold the depth"). Closed by
 * default; one tap opens it in place. Nothing inside is removed or changed,
 * so every number, table and model note is still one tap away.
 */
import { useState, type ReactNode } from 'react';
import { LayoutAnimation, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, fonts } from '../../../theme/tokens';

export const GO_DEEPER_LABEL = 'GO DEEPER';

export function GoDeeper({ children, hint }: { children: ReactNode; hint?: string }) {
  const [open, setOpen] = useState(false);
  return (
    <View style={styles.wrap}>
      <Pressable
        style={styles.head}
        onPress={() => {
          LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
          setOpen((o) => !o);
        }}
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        aria-expanded={open}
        accessibilityLabel={`${GO_DEEPER_LABEL}, ${open ? 'open' : 'closed'}${hint ? `. ${hint}` : ''}`}
        hitSlop={{ top: 8, bottom: 8 }}
      >
        <Text style={styles.label}>
          {GO_DEEPER_LABEL} {open ? '▴' : '▾'}
        </Text>
        {hint && !open ? <Text style={styles.hint}>{hint}</Text> : null}
      </Pressable>
      {open ? <View style={{ gap: 12 }}>{children}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 10, borderTopWidth: 1, borderTopColor: '#26262c', paddingTop: 10 },
  head: { gap: 2, minHeight: 44, justifyContent: 'center' },
  label: { fontFamily: fonts.oswaldSemiBold, fontSize: 12, letterSpacing: 1.2, color: colors.amber },
  hint: { fontFamily: fonts.barlowRegular, fontSize: 12.5, lineHeight: 17, color: colors.textSub },
});
