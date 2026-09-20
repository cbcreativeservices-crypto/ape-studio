/**
 * AboutPanel — the scrolling long-form block that sits under the artwork in a
 * full-size image popup (owner 2026-09-20, extended to credentials the same
 * day: "use the same screen with the longer description below").
 *
 * Presentation only. It knows nothing about topics or credentials — callers
 * hand it sections. That is what keeps the topic popup and the credential
 * popup looking like the same feature instead of two that drifted.
 *
 * ⛔ THE RESPONDER CLAIM IS LOAD-BEARING — DO NOT DELETE IT AS DEAD CODE.
 * Both hosts dismiss on a tap anywhere on the scrim, which is right for a
 * picture and hostile to several hundred words. Claiming the touch here ends
 * it at the panel, so scrolling or tapping the prose can never dismiss the
 * thing you are reading. The scrim AROUND the panel still closes normally,
 * which is what people expect of a dimmed overlay.
 */
import { type ReactNode } from 'react';
import { ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { colors, fonts } from '../theme/tokens';

export type AboutSection = { key: string; label: string; body: ReactNode };

export function AboutPanel({
  eyebrow,
  sections,
  maxHeight,
  accent = colors.amber,
}: {
  eyebrow: string;
  sections: readonly AboutSection[];
  /** Cap the panel's height. Defaults to 42% of the window — read from the
   *  HOOK, not module scope, so rotating the phone re-measures (the trap
   *  TrophyModal's own art sizing was caught by on 2026-09-13). */
  maxHeight?: number;
  accent?: string;
}) {
  const { height } = useWindowDimensions();
  const cap = maxHeight ?? Math.round(height * 0.42);
  if (sections.length === 0) return null;

  return (
    <View style={[styles.wrap, { maxHeight: cap }]} onStartShouldSetResponder={() => true} onResponderRelease={() => {}}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator
        // Its own region, so a screen reader pages through the prose instead
        // of meeting one enormous label on the scrim.
        accessibilityLabel={eyebrow}
      >
        <Text style={[styles.eyebrow, { color: accent }]}>{eyebrow.toUpperCase()}</Text>
        {sections.map((s) => (
          <View key={s.key} style={styles.section}>
            {s.label ? <Text style={styles.heading}>{s.label.toUpperCase()}</Text> : null}
            {typeof s.body === 'string' ? <Text style={styles.body}>{s.body}</Text> : s.body}
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

export const aboutPanelStyles = StyleSheet.create({
  body: {
    fontFamily: fonts.barlowRegular,
    fontSize: 14,
    lineHeight: 21,
    color: colors.textSecondary,
  },
});

const styles = StyleSheet.create({
  wrap: { alignSelf: 'stretch', borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.12)' },
  scroll: { alignSelf: 'stretch' },
  content: { paddingTop: 14, paddingBottom: 8, gap: 14 },
  eyebrow: { fontFamily: fonts.oswaldSemiBold, fontSize: 10, letterSpacing: 2 },
  section: { gap: 4 },
  heading: { fontFamily: fonts.oswaldSemiBold, fontSize: 11, letterSpacing: 1.4, color: colors.textSubAlt },
  body: { fontFamily: fonts.barlowRegular, fontSize: 14, lineHeight: 21, color: colors.textSecondary },
});
