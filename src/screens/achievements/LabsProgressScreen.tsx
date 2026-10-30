/**
 * LabsProgressScreen — the LABS category of Progress (owner 2026-10-29: "add
 * a LABS container beside TOPICS … labs completed and which ones").
 *
 * Lists only the labs the learner HAS completed, Fundamentals then Training —
 * never "N of 50" (owner 2026-10-29: "not everyone is enrolled in all or
 * intends to do all so then the 'out of' sounds intimidating and defeating").
 * Each row opens that lab again (practice; credit is never removed). BROWSE
 * LABS opens the Audio Learning landing for the rest.
 *
 * Three faces (AGENTS.md): loading, UNREADABLE (a failed device read is never
 * "no labs"), and truly empty.
 */
import { useCallback } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { BACK_GLYPH_MAX_SCALE, colors, fonts } from '../../theme/tokens';
import { StudioButton } from '../../components/StudioButton';
import { cardColumn } from '../../theme/readingColumn';
import { useWideOnTablet } from '../../theme/useIsTablet';
import { safeGoBack } from '../../lib/safeGoBack';
import { TROPHY_CASE_EMPTY } from '../../features/celebration/catalog';
import { useCompletedLabs, type CreditLab } from '../../features/lab/completedLabs';
import { fitValue } from '../../theme/legibility';

const SECTIONS: { id: CreditLab['section']; head: string }[] = [
  { id: 'fundamentals', head: 'AUDIO FUNDAMENTALS' },
  { id: 'training', head: 'TRAINING LABS' },
];

export function LabsProgressScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const wide = useWideOnTablet();
  const { state, retry } = useCompletedLabs();
  const leave = useCallback(() => {
    safeGoBack(navigation);
  }, [navigation]);
  const browse = () => navigation.navigate('AudioLearning');

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <ScrollView contentContainerStyle={[styles.scroll, cardColumn, wide]}>
        <View style={styles.headerRow}>
          <Pressable onPress={leave} hitSlop={10} accessibilityRole="button" accessibilityLabel="Back" style={styles.backBtn}>
            <Text style={styles.back} maxFontSizeMultiplier={BACK_GLYPH_MAX_SCALE}>‹</Text>
          </Pressable>
          <Text style={styles.title}>LABS</Text>
          {/* Not a count until one was READ (the Topics screen's rule). */}
          <Text style={styles.counter} {...fitValue(13)}>
            {state.status === 'ready' ? `${state.labs.length} COMPLETED` : '—'}
          </Text>
        </View>

        {state.status === 'loading' ? (
          <View style={styles.list}>
            {[0, 1, 2].map((i) => (
              <View key={i} style={[styles.row, styles.rowPlaceholder]} />
            ))}
          </View>
        ) : state.status === 'unreadable' ? (
          <View style={styles.note}>
            <Text style={styles.noteText}>
              Couldn’t read your lab record on this device right now. Nothing you’ve completed is lost — retry, and email info@proaudiotrainingacademy.com if it keeps failing.
            </Text>
            <View style={styles.noteBtn}>
              <StudioButton label="Retry" variant="secondary" small onPress={retry} />
            </View>
          </View>
        ) : state.labs.length === 0 ? (
          <View style={styles.note}>
            <Text style={styles.noteText}>{TROPHY_CASE_EMPTY.labs}</Text>
          </View>
        ) : (
          SECTIONS.map((sec) => {
            const rows = state.labs.filter((l) => l.section === sec.id);
            if (rows.length === 0) return null;
            return (
              <View key={sec.id} style={styles.list}>
                <Text style={styles.sectionHead}>{sec.head}</Text>
                {rows.map((lab) => (
                  <Pressable
                    key={lab.key}
                    style={({ pressed }) => [styles.row, pressed && styles.pressed]}
                    onPress={() => (lab.route ? navigation.navigate(lab.route, lab.params) : undefined)}
                    accessibilityRole="button"
                    accessibilityLabel={`${lab.name}, completed. Opens the lab.`}
                  >
                    <Text style={styles.tick}>✓</Text>
                    <Text style={styles.rowName} numberOfLines={2}>
                      {lab.name}
                    </Text>
                    <Text style={styles.chevron}>›</Text>
                  </Pressable>
                ))}
              </View>
            );
          })
        )}

        <View style={styles.browse}>
          <StudioButton label="Browse labs" variant="secondary" small onPress={browse} />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.screenBg },
  scroll: { padding: 16, gap: 14 },
  headerRow: { flexDirection: 'row', alignItems: 'baseline', gap: 10 },
  backBtn: { alignSelf: 'center' },
  back: { fontFamily: fonts.oswaldSemiBold, fontSize: 28, lineHeight: 28, color: colors.textSub, marginRight: -2 },
  title: { fontFamily: fonts.oswaldSemiBold, fontSize: 18, letterSpacing: 1.4, color: colors.textPrimary },
  counter: {
    flexShrink: 1,
    fontFamily: fonts.mono,
    fontSize: 13,
    color: colors.green,
    textShadowColor: `${colors.green}66`,
    textShadowRadius: 6,
    textShadowOffset: { width: 0, height: 0 },
  },
  sectionHead: { fontFamily: fonts.oswaldSemiBold, fontSize: 11, letterSpacing: 1.6, color: colors.textSub, marginBottom: 2 },
  list: { gap: 8 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    minHeight: 48,
    paddingHorizontal: 13,
    paddingVertical: 10,
    backgroundColor: '#161616',
    borderWidth: 1,
    borderColor: '#232323',
    borderRadius: 9,
  },
  rowPlaceholder: { opacity: 0.6 },
  pressed: { opacity: 0.85 },
  tick: { fontFamily: fonts.oswaldSemiBold, fontSize: 15, color: colors.green, width: 16, textAlign: 'center' },
  rowName: { flex: 1, fontFamily: fonts.barlowMedium, fontSize: 15, lineHeight: 20, color: colors.textPrimary },
  chevron: { fontFamily: fonts.oswaldSemiBold, fontSize: 18, color: colors.textSub },
  note: {
    backgroundColor: '#161616',
    borderWidth: 1,
    borderColor: colors.hairlineDim,
    borderRadius: 12,
    padding: 18,
    gap: 12,
    alignItems: 'center',
  },
  noteText: { fontFamily: fonts.barlowRegular, fontSize: 14, lineHeight: 21, color: colors.textSub, textAlign: 'center' },
  noteBtn: { width: 180 },
  browse: { width: 200, alignSelf: 'center', marginTop: 4 },
});
