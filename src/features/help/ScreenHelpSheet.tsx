/**
 * ScreenHelpSheet — a light, reusable "help for THIS screen" popup (owner
 * 2026-09-08, internal-help pass Pillar C / plan §4).
 *
 * Distinct from the labs' GuidedLessonSheet (which renders the rich per-control
 * LessonContent stack). This is for plain screens — Glossary, Dashboard, Awards
 * — that just need a short "what this screen is / how to use it" explainer with
 * optional jump-to links. One consistent look, reused everywhere via useScreenHelp.
 *
 * Honesty + a11y: content is plain and task-focused; the sheet takes modal
 * focus, has a labelled close, and respects the overlay-suppression stores so it
 * never fights the dev kill-switch or Low-Light mode.
 */
import { useCallback, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, fonts } from '../../theme/tokens';
import { LowLightDim } from '../settings/LowLightLayer';

export type HelpSection = { heading?: string; body: string };
export type HelpLink = { label: string; onPress: () => void };

export type ScreenHelpContent = {
  title: string;
  intro?: string;
  sections: HelpSection[];
  links?: HelpLink[];
};

function ArrowIcon() {
  return <Text style={styles.linkArrow}>›</Text>;
}

export function ScreenHelpSheet({
  content,
  visible,
  onClose,
}: {
  content: ScreenHelpContent;
  visible: boolean;
  onClose: () => void;
}) {
  const insets = useSafeAreaInsets();
  if (!visible) return null;
  return (
    <Modal accessibilityViewIsModal transparent animationType="fade" visible statusBarTranslucent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={[styles.card, { maxHeight: '86%', marginTop: insets.top + 8, marginBottom: insets.bottom + 8 }]}>
          <View style={styles.headRow}>
            <Text style={styles.eyebrow}>HELP</Text>
            <Pressable onPress={onClose} hitSlop={10} accessibilityRole="button" accessibilityLabel="Close help">
              <Text style={styles.close}>✕</Text>
            </Pressable>
          </View>
          <Text style={styles.title}>{content.title}</Text>
          <View style={styles.rule} />
          <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator>
            {content.intro ? <Text style={styles.intro}>{content.intro}</Text> : null}
            {content.sections.map((s, i) => (
              <View key={i} style={styles.section}>
                {s.heading ? <Text style={styles.sectionHead}>{s.heading}</Text> : null}
                <Text style={styles.body}>{s.body}</Text>
              </View>
            ))}
            {content.links && content.links.length ? (
              <View style={styles.links}>
                {content.links.map((l, i) => (
                  <Pressable
                    key={i}
                    onPress={() => {
                      onClose();
                      l.onPress();
                    }}
                    accessibilityRole="button"
                    accessibilityLabel={l.label}
                    style={({ pressed }) => [styles.linkRow, pressed && styles.linkRowPressed]}
                  >
                    <Text style={styles.linkText}>{l.label}</Text>
                    <ArrowIcon />
                  </Pressable>
                ))}
              </View>
            ) : null}
          </ScrollView>
        </View>
      </View>
      <LowLightDim />
    </Modal>
  );
}

/** Wire a screen's "?" affordance: `open()` shows the sheet, `sheet` renders it
 *  once at the screen root. Content is passed at the hook so callers keep it
 *  co-located with the screen. */
export function useScreenHelp(content: ScreenHelpContent): { open: () => void; sheet: React.JSX.Element } {
  const [visible, setVisible] = useState(false);
  const open = useCallback(() => setVisible(true), []);
  const sheet = <ScreenHelpSheet content={content} visible={visible} onClose={() => setVisible(false)} />;
  return { open, sheet };
}

/** The "?" button to place in a screen header. Amber ring, generous tap target. */
export function HelpDot({ onPress, label = 'Help for this screen' }: { onPress: () => void; label?: string }) {
  return (
    <Pressable onPress={onPress} hitSlop={8} accessibilityRole="button" accessibilityLabel={label} style={styles.dot}>
      <Text style={styles.dotText}>?</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,.8)', alignItems: 'center', justifyContent: 'center', padding: 20 },
  card: {
    width: '100%',
    maxWidth: 460,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,198,77,.5)',
    backgroundColor: '#141310',
    padding: 20,
    gap: 10,
  },
  headRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  eyebrow: { fontFamily: fonts.oswaldSemiBold, fontSize: 11, letterSpacing: 3, color: colors.amberLabel },
  close: { fontFamily: fonts.oswaldSemiBold, fontSize: 18, color: colors.textSub, paddingHorizontal: 4 },
  title: { fontFamily: fonts.oswaldMedium, fontSize: 22, lineHeight: 27, color: colors.textPrimary },
  rule: { width: 44, height: 2, backgroundColor: colors.amber, borderRadius: 1 },
  scroll: { gap: 14, paddingTop: 4, paddingBottom: 4 },
  intro: { fontFamily: fonts.barlowMedium, fontSize: 15, lineHeight: 22, color: colors.textSecondary },
  section: { gap: 4 },
  sectionHead: { fontFamily: fonts.oswaldSemiBold, fontSize: 13, letterSpacing: 0.5, color: colors.amber },
  body: { fontFamily: fonts.barlowRegular, fontSize: 14, lineHeight: 21, color: colors.textSub },
  links: { gap: 8, marginTop: 4 },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 11,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.steelBorder,
    backgroundColor: 'rgba(255,255,255,0.02)',
  },
  linkRowPressed: { backgroundColor: 'rgba(255,198,77,.08)' },
  linkText: { fontFamily: fonts.oswaldSemiBold, fontSize: 13.5, letterSpacing: 0.3, color: colors.textPrimary },
  linkArrow: { fontFamily: fonts.oswaldSemiBold, fontSize: 18, color: colors.amber },
  dot: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 1.4,
    borderColor: 'rgba(255,198,77,.65)',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,198,77,.08)',
  },
  dotText: { fontFamily: fonts.oswaldSemiBold, fontSize: 14, color: colors.amber, marginTop: -1 },
});
