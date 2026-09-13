/**
 * HelpScreen — the Help hub (Pillar C, plan §4). The operator's manual for the
 * app: a searchable FAQ in six sections, each answer short and, where it can,
 * carrying a jump straight into the relevant screen; a "Still need help?"
 * strip routing to the support inbox through sendFeedback (pre-tagged, so
 * replies arrive with locating context); and the replay-hints reset, mirrored
 * from Settings so recovery help lives where a stuck person actually looks.
 *
 * Reached from Settings (WCAG Consistent Help — the affordance is always in
 * the same place). Gated by HELP_HUB_ENABLED until the owner ratifies the FAQ
 * copy; `#helppreview` renders it in the web harness regardless.
 */
import { useMemo, useState } from 'react';
import { LayoutAnimation, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { colors, fonts } from '../../theme/tokens';
import { animationsAllowed } from '../../features/settings/a11y';
import { sendFeedback, SUPPORT_EMAIL } from '../../lib/feedback';
import { notify } from '../../lib/confirm';
import { resetCoachMarks } from '../../lib/coachMark';
import { resetScreenIntros } from '../../features/intro/screenIntros';
import { resetOnboarding } from '../../features/intro/onboardingFlow';
import { resetAmplitudeOrientation } from '../../features/lab/amplitudeOrientation';
import { filterHelp, type HelpEntry } from '../../features/help/helpContent';

export function HelpScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState<string | null>(null);
  const categories = useMemo(() => filterHelp(query), [query]);
  const searching = query.trim().length > 0;
  const noResults = searching && categories.length === 0;

  const toggle = (id: string) => {
    if (animationsAllowed()) LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setOpen((cur) => (cur === id ? null : id));
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top + 10 }]}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={10} accessibilityRole="button" accessibilityLabel="Back">
          <Text style={styles.back}>‹</Text>
        </Pressable>
        <View style={{ flexShrink: 1, flexGrow: 1 }}>
          <Text style={styles.title}>HELP</Text>
          <Text style={styles.subtitle}>QUICK ANSWERS · STRAIGHT ROUTES</Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 24 }]}
        keyboardShouldPersistTaps="handled"
      >
        {/* Search — filters question + answer text live. */}
        <View style={styles.searchWrap}>
          <TextInput
            style={styles.search}
            value={query}
            onChangeText={setQuery}
            placeholder="SEARCH THE MANUAL"
            placeholderTextColor={colors.textSubAlt}
            autoCapitalize="none"
            autoCorrect={false}
            accessibilityLabel="Search help"
            returnKeyType="search"
          />
          {searching ? (
            <Pressable onPress={() => setQuery('')} hitSlop={10} accessibilityRole="button" accessibilityLabel="Clear search">
              <Text style={styles.clear}>✕</Text>
            </Pressable>
          ) : null}
        </View>

        {noResults ? (
          <View style={styles.emptyPanel}>
            <Text style={styles.emptyText}>
              Nothing in the manual matches “{query.trim()}”. Try another word — or ask us directly below, and we’ll answer.
            </Text>
          </View>
        ) : (
          categories.map((c) => (
            <View key={c.key} style={styles.section}>
              <View style={styles.sectionHead}>
                <View style={styles.sectionTick} />
                <Text style={styles.sectionTitle}>{c.title}</Text>
              </View>
              <View style={styles.panel}>
                {c.entries.map((e, i) => (
                  <Entry key={e.id} entry={e} last={i === c.entries.length - 1} open={open === e.id} onToggle={() => toggle(e.id)} onJump={(route, params) => navigation.navigate(route, params)} />
                ))}
              </View>
            </View>
          ))
        )}

        {/* Still need help? — the human route. Pre-tagged so the report lands
            with locating context (owner rule 2026-08-13). */}
        <View style={styles.section}>
          <View style={styles.sectionHead}>
            <View style={[styles.sectionTick, { backgroundColor: colors.amber }]} />
            <Text style={styles.sectionTitle}>STILL NEED HELP?</Text>
          </View>
          <View style={[styles.panel, styles.supportPanel]}>
            <Text style={styles.supportBody}>
              A person reads every message. Both buttons open your mail app addressed to
              {' '}<Text style={styles.supportEmail}>{SUPPORT_EMAIL}</Text> — describe what happened and send.
            </Text>
            <Pressable
              style={[styles.row, styles.rowBorder]}
              onPress={() => sendFeedback('question', undefined, { screen: 'Help', searched: query.trim() || undefined })}
              accessibilityRole="button"
            >
              <Text style={styles.rowLabel}>Ask a question</Text>
              <Text style={styles.monoAction}>WRITE ›</Text>
            </Pressable>
            <Pressable
              style={styles.row}
              onPress={() => sendFeedback('bug', undefined, { screen: 'Help', searched: query.trim() || undefined })}
              accessibilityRole="button"
            >
              <Text style={styles.rowLabel}>Report a bug</Text>
              <Text style={styles.monoAction}>WRITE ›</Text>
            </Pressable>
          </View>
        </View>

        {/* Replay hints — recovery lives where the stuck person looks. */}
        <View style={styles.section}>
          <View style={styles.panel}>
            <Pressable
              style={styles.row}
              onPress={() =>
                Promise.all([resetCoachMarks(), resetScreenIntros(), resetAmplitudeOrientation(), resetOnboarding()]).then(() =>
                  notify('Hints reset', 'Onboarding hints and the welcome greeting will show again on next open.'),
                )
              }
              accessibilityRole="button"
            >
              <Text style={styles.rowLabel}>Replay onboarding hints</Text>
              <Text style={styles.monoAction}>RESET</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

function Entry({
  entry,
  last,
  open,
  onToggle,
  onJump,
}: {
  entry: HelpEntry;
  last: boolean;
  open: boolean;
  onToggle: () => void;
  onJump: (route: string, params?: Record<string, unknown>) => void;
}) {
  return (
    <View style={!last && styles.rowBorder}>
      <Pressable
        style={styles.row}
        onPress={onToggle}
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        aria-expanded={open}
        accessibilityLabel={entry.q}
      >
        <Text style={[styles.question, open && { color: colors.amber }]}>{entry.q}</Text>
        <Text style={[styles.chevron, open && styles.chevronOpen]}>›</Text>
      </Pressable>
      {open ? (
        <View style={styles.answerWrap}>
          <Text style={styles.answer}>{entry.a}</Text>
          {entry.jump ? (
            <Pressable
              style={styles.jump}
              onPress={() => onJump(entry.jump!.route, entry.jump!.params)}
              accessibilityRole="button"
              accessibilityLabel={entry.jump.label}
            >
              <Text style={styles.jumpText}>{entry.jump.label.toUpperCase()} ›</Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.screenBg },
  header: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingBottom: 10 },
  back: { fontFamily: fonts.oswaldSemiBold, fontSize: 28, lineHeight: 28, color: colors.textSubAlt },
  title: { fontFamily: fonts.oswaldSemiBold, fontSize: 18, letterSpacing: 1.6, color: colors.textPrimary },
  subtitle: { fontFamily: fonts.mono, fontSize: 10, letterSpacing: 1.2, color: colors.textSubAlt, marginTop: 2 },
  scroll: { paddingHorizontal: 16, gap: 4 },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#101010',
    borderWidth: 1,
    borderColor: colors.hairlineDim,
    borderRadius: 10,
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  search: {
    flex: 1,
    fontFamily: fonts.mono,
    fontSize: 12.5,
    letterSpacing: 1,
    color: colors.textPrimary,
    paddingVertical: 12,
  },
  clear: { fontFamily: fonts.oswaldSemiBold, fontSize: 14, color: colors.textSubAlt, padding: 4 },
  section: { marginBottom: 14 },
  sectionHead: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6, paddingLeft: 2 },
  sectionTick: { width: 3, height: 12, borderRadius: 1.5, backgroundColor: `${colors.amber}88` },
  sectionTitle: { fontFamily: fonts.oswaldSemiBold, fontSize: 13, letterSpacing: 1.6, color: colors.textPrimary },
  panel: {
    backgroundColor: '#161616',
    borderWidth: 1,
    borderColor: colors.hairlineDim,
    borderRadius: 12,
    paddingHorizontal: 14,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 13 },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: colors.hairlineDim },
  question: { flex: 1, fontFamily: fonts.barlowMedium, fontSize: 14.5, lineHeight: 20, color: colors.textPrimary },
  chevron: { fontFamily: fonts.oswaldSemiBold, fontSize: 18, color: colors.textSubAlt },
  chevronOpen: { transform: [{ rotate: '90deg' }], color: colors.amber },
  answerWrap: { paddingBottom: 14, gap: 10 },
  answer: { fontFamily: fonts.barlowRegular, fontSize: 13.5, lineHeight: 20, color: colors.textSubAlt },
  jump: { alignSelf: 'flex-start', borderWidth: 1, borderColor: `${colors.amber}66`, borderRadius: 8, paddingVertical: 6, paddingHorizontal: 12 },
  jumpText: { fontFamily: fonts.mono, fontSize: 11, letterSpacing: 1.2, color: colors.amber },
  rowLabel: { flex: 1, fontFamily: fonts.barlowMedium, fontSize: 14.5, color: colors.textPrimary },
  monoAction: { fontFamily: fonts.mono, fontSize: 11, letterSpacing: 1.2, color: colors.amber },
  supportPanel: { paddingTop: 12 },
  supportBody: { fontFamily: fonts.barlowRegular, fontSize: 13, lineHeight: 19, color: colors.textSubAlt, paddingBottom: 4 },
  supportEmail: { fontFamily: fonts.mono, fontSize: 12, color: colors.textPrimary },
  emptyPanel: {
    backgroundColor: '#161616',
    borderWidth: 1,
    borderColor: colors.hairlineDim,
    borderRadius: 12,
    padding: 16,
    marginBottom: 14,
  },
  emptyText: { fontFamily: fonts.barlowRegular, fontSize: 13.5, lineHeight: 20, color: colors.textSubAlt },
});
