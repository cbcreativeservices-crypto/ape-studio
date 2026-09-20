/**
 * TopicAboutPanel — the long-form "About This Topic" overview, rendered inside
 * the full-size topic-image popup (owner 2026-09-20).
 *
 * The content is Computer B's authored overview for each v3 topic, keyed by gs,
 * living in `src/data/topicAbout.ts`. Until now nothing imported that file; this
 * is what puts it on screen.
 *
 * ── TWO THINGS THIS COMPONENT HAS TO GET RIGHT ──────────────────────────────
 *
 * 1. IT SCROLLS INSIDE A TAP-TO-CLOSE SCRIM. TrophyModal dismisses on a tap
 *    anywhere, which is right for a picture and hostile to 600 words. The
 *    responder claim below keeps every touch that lands on the text — drag OR
 *    tap — inside this panel, so reading can never dismiss the thing you are
 *    reading.
 *
 * 2. SECTION ORDER IS DATA, NOT KEY ORDER. Walk TOPIC_ABOUT_SECTION_ORDER and
 *    TOPIC_ABOUT_MODULE_ORDER; object key order is not a contract and the file
 *    says so itself.
 *
 * ⚠️ The section HEADINGS are placeholders derived mechanically from the keys —
 * `TOPIC_ABOUT_SECTION_LABEL` in the data file, which exists so rewording them
 * is one edit. The overview TEXT is final and must not be touched here.
 */
import { ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import {
  TOPIC_ABOUT_MODULE_ORDER,
  TOPIC_ABOUT_SECTION_LABEL,
  TOPIC_ABOUT_SECTION_ORDER,
  topicAbout,
} from '../data/topicAbout';
import { colors, fonts } from '../theme/tokens';

/** Does this topic have an overview? Callers use it to decide layout BEFORE
 *  rendering — the popup shrinks its art to make room only when there is
 *  something to make room for. */
export function hasTopicAbout(gs: number | null | undefined): boolean {
  return topicAbout(gs) != null;
}

export function TopicAboutPanel({
  gs,
  maxHeight,
}: {
  gs: number | null | undefined;
  /** Cap the panel's height. Defaults to 42% of the window — read from the
   *  HOOK, not module scope, so rotating the phone re-measures (the same trap
   *  TrophyModal's artSize was caught by on 2026-09-13). */
  maxHeight?: number;
}) {
  const { height } = useWindowDimensions();
  const cap = maxHeight ?? Math.round(height * 0.42);
  const about = topicAbout(gs);
  if (!about) return null;

  const sections: { key: string; label: string; body: string }[] = [];
  for (const key of TOPIC_ABOUT_SECTION_ORDER) {
    const body = about[key];
    if (body) sections.push({ key, label: TOPIC_ABOUT_SECTION_LABEL[key], body });
  }
  for (const key of TOPIC_ABOUT_MODULE_ORDER) {
    const body = about.optional_modules?.[key];
    if (body) sections.push({ key, label: TOPIC_ABOUT_SECTION_LABEL[key], body });
  }
  if (sections.length === 0) return null;

  return (
    /**
     * ⛔ THE RESPONDER CLAIM IS LOAD-BEARING — do not remove it as dead code.
     * Without it a tap on the text bubbles to TrophyModal's scrim Pressable and
     * closes the popup mid-sentence. Claiming the touch here ends it at the
     * panel; the scrim around the panel still closes normally, which is the
     * behaviour people expect from a dimmed overlay.
     */
    <View
      style={[styles.wrap, { maxHeight: cap }]}
      onStartShouldSetResponder={() => true}
      onResponderRelease={() => {}}
    >
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator
        // The scrim reads the topic name; this is its own region so a screen
        // reader can page through the prose instead of one enormous label.
        accessibilityLabel="About this topic"
      >
        <Text style={styles.eyebrow}>ABOUT THIS TOPIC</Text>
        {sections.map((s) => (
          <View key={s.key} style={styles.section}>
            <Text style={styles.heading}>{s.label.toUpperCase()}</Text>
            <Text style={styles.body}>{s.body}</Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignSelf: 'stretch',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.12)',
  },
  scroll: { alignSelf: 'stretch' },
  content: { paddingTop: 14, paddingBottom: 8, gap: 14 },
  eyebrow: {
    fontFamily: fonts.oswaldSemiBold,
    fontSize: 10,
    letterSpacing: 2,
    color: colors.amber,
  },
  section: { gap: 4 },
  heading: {
    fontFamily: fonts.oswaldSemiBold,
    fontSize: 11,
    letterSpacing: 1.4,
    color: colors.textSubAlt,
  },
  body: {
    fontFamily: fonts.barlowRegular,
    fontSize: 14,
    lineHeight: 21,
    color: colors.textSecondary,
  },
});
