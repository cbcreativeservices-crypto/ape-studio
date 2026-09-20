/**
 * Smart Processors Lab — the family hub (owner brief 2026-09-02). V1 opens
 * with the De-Esser & Sibilance Control lab; the other members are listed
 * as planned rows with the catalog's DEV_NOTE (owner changed that note to
 * "Coming Soon" on 2026-09-17 — see labCatalog).
 */
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, fonts } from '../../../theme/tokens';
import type { RootStackParamList } from '../../../navigation/types';
import { DEV_NOTE } from '../labCatalog';
import { AccuracyNote } from '../../../components/AccuracyNote';

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
  { name: 'De-Esser & Sibilance Control', blurb: 'A compressor that listens only to the hiss — detection path, threshold, frequency, range, broadband vs split-band, and what over-doing it sounds like.', route: 'DeEsserLab' },
];

export function SmartProcessorsLabScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<Nav>();
  return (
    <View style={[styles.root, { paddingTop: insets.top + 8 }]}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={10} accessibilityRole="button" accessibilityLabel="Back">
          <Text style={styles.back}>‹</Text>
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={styles.kicker}>TRAINING LAB · DYNAMICS</Text>
          <Text style={styles.title}>Smart Processors Lab</Text>
        </View>
        <AccuracyNote compact detail="The processors here are TEACHING MODELS of how detectors, thresholds and gain computers behave — not emulations of any particular unit, and anything they play goes through your phone’s UNCALIBRATED output. Learn the shape of the behaviour here; set real thresholds on real metering." />
      </View>
      <ScrollView contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 24 }]}>
        <Text style={styles.lead}>Ordinary processors do what their knobs say. Smart processors listen first, decide, then act — and every one of them is built from the same few ideas: a detector, a threshold, a gain computer, and a choice of what to change.</Text>
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
                {/* Open state carried by a tag as well as the border colour (not colour alone). */}
                {f.route ? <Text style={styles.openTag}>OPEN</Text> : null}
              </View>
              <Text style={styles.rowBlurb}>{f.blurb}</Text>
              {!f.route ? <Text style={styles.devNote}>{DEV_NOTE}</Text> : null}
            </View>
            {f.route ? <Text style={styles.chev}>›</Text> : null}
          </Pressable>
        ))}
      </ScrollView>
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
  openTag: { color: colors.green, fontFamily: fonts.oswaldMedium, fontSize: 9.5, letterSpacing: 1.5, borderWidth: 1, borderColor: colors.green, borderRadius: 4, paddingHorizontal: 5, paddingVertical: 1 },
  rowBlurb: { color: colors.textSub, fontFamily: fonts.barlowRegular, fontSize: 12.5, lineHeight: 17 },
  devNote: { color: colors.textMuted, fontFamily: fonts.barlowMedium, fontSize: 11, marginTop: 2 },
  chev: { color: colors.green, fontSize: 24, paddingHorizontal: 4 },
});
