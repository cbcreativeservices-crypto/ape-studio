/**
 * Smart Processors Lab — the family hub (owner brief 2026-09-02). It opens
 * the De-Esser & Sibilance Control lab, its only member today; the planned
 * rows were removed on 2026-09-17 (no placeholder rows — see the note above
 * FAMILY below).
 */
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { BACK_HIT_SLOP } from '../../../components/backHitSlop';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BACK_GLYPH_MAX_SCALE, colors, fonts } from '../../../theme/tokens';
import type { RootStackParamList } from '../../../navigation/types';
import { DEV_NOTE } from '../labCatalog';
// Screen Guide (owner 2026-10-31): the header ⓘ explains this hub. A CONCEPT
// lab — the de-esser is a modelled phrase, nothing plays and nothing is
// measured — so the accuracy chip gives its spot to the ⓘ (accuracy chip
// rule, owner 2026-10-31).
import { ScreenGuideHintAnchor, ScreenGuideHost, ScreenGuideKey } from '../../../features/lab/screenGuide';
import { SMART_PROCESSORS_HOME_GUIDE } from './smartProcessorsScreenGuides';
import { safeGoBack } from '../../../lib/safeGoBack';
import { LabUnderstandingBlock } from '../../../components/LabUnderstandingBlock';

type Nav = NativeStackNavigationProp<RootStackParamList>;

/**
 * ── NO PLACEHOLDER ROWS (owner rule; enforced here 2026-09-17) ───────────
 *
 * Six of these seven had no `route` and rendered as "Coming Soon" — inside a
 * lab a member has paid for. The owner's standing ruling removed every
 * `status:'development'` row from the catalog for exactly this reason ("they
 * return in a future update"), and this screen was missed because it builds its
 * own list instead of reading the catalog.
 *
 * The six are kept HERE, commented out rather than deleted, so whoever builds
 * them has the blurbs — which are good — and so nobody re-derives the list:
 *
 *   Dynamic EQ            EQ bands that move only when the signal asks them to.
 *   Multiband Compressor  Several compressors, each owning a slice of the spectrum.
 *   Spectral Processor    Hundreds of narrow bands deciding independently.
 *   Resonance Suppressor  Finding and taming ringing frequencies as they appear.
 *   Feedback Suppressor   Detecting a building howl and notching it before it takes off.
 *   Ducking & Auto-Mixing One signal deciding the level of another.
 */
const FAMILY: { name: string; blurb: string; route?: keyof RootStackParamList }[] = [
  // DES-04 (owner 2026-11-15: "build waves 1 thru 3", D62): one plain line, not a list of topics.
  { name: 'De-Esser & Sibilance Control', blurb: 'It softens the hissy S sounds in a voice, and only those.', route: 'DeEsserLab' },
];

export function SmartProcessorsLabScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<Nav>();
  return (
    <View style={[styles.root, { paddingTop: insets.top + 8 }]}>
      {/* No Rack Unit here: the guide's steps sit low over the list. */}
      <ScreenGuideHost regions={false}>
      <ScreenGuideHintAnchor>
      <View style={styles.header}>
        <Pressable onPress={() => safeGoBack(navigation)} hitSlop={BACK_HIT_SLOP} accessibilityRole="button" accessibilityLabel="Back">
          <Text style={styles.back} maxFontSizeMultiplier={BACK_GLYPH_MAX_SCALE}>‹</Text>
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={styles.kicker}>TRAINING LAB · DYNAMICS</Text>
          <Text style={styles.title}>Smart Processors Lab</Text>
        </View>
        <ScreenGuideKey title="SMART PROCESSORS LAB" guide={SMART_PROCESSORS_HOME_GUIDE} />
      </View>
      </ScreenGuideHintAnchor>
      <ScrollView contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 24 }]}>
        {/* DES-03 (owner 2026-11-15, D62): plain words instead of "a gain computer". */}
        <Text style={styles.lead}>Ordinary processors do what their knobs say. Smart processors listen first: a detector and a threshold decide when to turn the sound down, and by how much.</Text>
        {FAMILY.map((f) => (
          <Pressable
            key={f.name}
            disabled={!f.route}
            onPress={() => f.route && navigation.navigate(f.route as never)}
            style={[styles.row, !f.route && styles.rowPlanned]}
            accessibilityRole="button"
            accessibilityState={{ disabled: !f.route }}
            aria-disabled={!f.route}
            accessibilityLabel={f.route ? `Open ${f.name}` : `${f.name}. ${DEV_NOTE}`}
          >
            <View style={{ flex: 1, gap: 3 }}>
              <View style={styles.nameRow}>
                <Text style={[styles.rowName, !f.route && { color: colors.textMuted }]}>{f.name}</Text>
              </View>
              <Text style={styles.rowBlurb}>{f.blurb}</Text>
              {!f.route ? <Text style={styles.devNote}>{DEV_NOTE}</Text> : null}
            </View>
            {/* DES-04 (owner 2026-11-15, D62): the small green OPEN tag read like a
                status; one START › replaces it and the bare › chevron. */}
            {f.route ? <Text style={styles.start}>START ›</Text> : null}
          </Pressable>
        ))}
        {/* DES-02 (owner 2026-11-15, D62): the check is labeled for after the lab,
            so a beginner does not answer it before doing the lesson. */}
        <Text style={styles.afterLabel}>AFTER THE DE-ESSER LAB</Text>
        {/* Certificate credit (owner 2026-10-13): renders only once questions are authored. */}
        <LabUnderstandingBlock labId="smart-processors" labTitle="Smart Processors Lab" />
      </ScrollView>
      </ScreenGuideHost>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.screenBg },
  header: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14, paddingBottom: 8 },
  back: { color: colors.textPrimary, fontSize: 30, lineHeight: 32, paddingHorizontal: 4 },
  kicker: { color: colors.amberLabel, fontFamily: fonts.oswaldMedium, fontSize: 9.5, letterSpacing: 1.5 },
  title: { color: colors.textPrimary, fontFamily: fonts.oswaldSemiBold, fontSize: 17, letterSpacing: 0.5 },
  scroll: { paddingHorizontal: 16, gap: 10 },
  lead: { color: colors.textSecondary, fontFamily: fonts.barlowRegular, fontSize: 14, lineHeight: 20, marginBottom: 4 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14, borderRadius: 12, borderWidth: 1, borderColor: colors.green, backgroundColor: '#101512' },
  rowPlanned: { borderColor: colors.hairline, backgroundColor: '#0f0f11' },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  rowName: { color: colors.textPrimary, fontFamily: fonts.oswaldMedium, fontSize: 14, letterSpacing: 0.4, flexShrink: 1 },
  start: { color: colors.green, fontFamily: fonts.oswaldSemiBold, fontSize: 13, letterSpacing: 1.2, borderWidth: 1, borderColor: colors.green, borderRadius: 6, paddingHorizontal: 10, paddingVertical: 6 },
  afterLabel: { color: colors.textSub, fontFamily: fonts.oswaldMedium, fontSize: 11, letterSpacing: 1.5, marginTop: 16, marginBottom: -12 },
  rowBlurb: { color: colors.textSub, fontFamily: fonts.barlowRegular, fontSize: 12.5, lineHeight: 17 },
  devNote: { color: colors.textMuted, fontFamily: fonts.barlowMedium, fontSize: 11, marginTop: 2 },
});
