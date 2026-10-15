/**
 * CautionBadge — a warning strip for terms that are DANGEROUS TO TOUCH
 * (electrocution / chemical / burns / injury). Shown on the glossary detail and
 * on flashcards (Booth 2026-07-11).
 */
import { StyleSheet, Text, View } from 'react-native';
import { BRAND_MAX_FONT_SCALE, fonts } from '../theme/tokens';

export function CautionBadge({ compact = false, iconOnly = false }: { compact?: boolean; iconOnly?: boolean }) {
  // Icon-only chip — sits next to the term name (glossary header, Booth
  // 2026-07-15). Carries its own ADA label since there's no visible text.
  if (iconOnly) {
    return (
      <View
        style={[styles.badge, styles.iconOnly]}
        accessible
        accessibilityRole="image"
        accessibilityLabel="Caution: this term can be dangerous to touch — shock, burn, or chemical hazard"
      >
        <Text style={styles.icon}>⚠</Text>
      </View>
    );
  }
  return (
    <View style={[styles.badge, compact && styles.compact]}>
      <Text style={styles.icon} maxFontSizeMultiplier={compact ? BRAND_MAX_FONT_SCALE : undefined}>⚠</Text>
      {/* No numberOfLines (2026-09-11 layout pass): this is a SAFETY
          instruction, and a two-line clamp is exactly what drops the
          instruction half. 87 chars of 12.5px Barlow SemiBold needs ~512px;
          the text box on a 360pt phone is ~282px, so it takes 1.8 lines at the
          design text size and 2.4 lines at a 1.3x OS text size — at which
          point "Follow safety practices." was silently gone. The badge has no
          fixed height, so it simply grows.
          COMPACT (the flashcard face) follows the OS size up to 1.35 and
          holds there (build 36 tester, Larger Text: at the accessibility sizes
          the strip grew to fill the card and left the term no room). Every
          word still shows — it wraps, it is never clamped. The full badge on
          the Glossary and the full-screen card keeps scaling without a cap. */}
      <Text
        style={[styles.text, compact && styles.textCompact]}
        maxFontSizeMultiplier={compact ? BRAND_MAX_FONT_SCALE : undefined}
      >
        CAUTION — can be dangerous to touch (shock / burn / chemical). Follow safety practices.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#2a1706',
    borderWidth: 1,
    borderColor: 'rgba(255,138,30,.6)',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  compact: { paddingVertical: 6, paddingHorizontal: 8 },
  iconOnly: { gap: 0, paddingVertical: 3, paddingHorizontal: 6 },
  icon: { fontSize: 16, color: '#ff8a1e' },
  text: { flex: 1, fontFamily: fonts.barlowSemiBold, fontSize: 12.5, lineHeight: 16, color: '#ffb060' },
  textCompact: { fontSize: 11.5, lineHeight: 15 },
});
