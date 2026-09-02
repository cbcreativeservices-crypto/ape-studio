/**
 * Smart Processors Lab — the family hub (owner brief 2026-09-02). V1 opens
 * with the De-Esser & Sibilance Control lab; the other members are listed
 * as planned rows with the catalog's DEV_NOTE (no timeline, no promise).
 */
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, fonts } from '../../../theme/tokens';
import type { RootStackParamList } from '../../../navigation/types';
import { DEV_NOTE } from '../labCatalog';

type Nav = NativeStackNavigationProp<RootStackParamList>;

const FAMILY: { name: string; blurb: string; route?: keyof RootStackParamList }[] = [
  { name: 'De-Esser & Sibilance Control', blurb: 'A compressor that listens only to the hiss — detection path, threshold, frequency, range, broadband vs split-band, and what over-doing it sounds like.', route: 'DeEsserLab' },
  { name: 'Dynamic EQ', blurb: 'EQ bands that move only when the signal asks them to.' },
  { name: 'Multiband Compressor', blurb: 'Several compressors, each owning a slice of the spectrum.' },
  { name: 'Spectral Processor', blurb: 'Hundreds of narrow bands deciding independently.' },
  { name: 'Resonance Suppressor', blurb: 'Finding and taming ringing frequencies as they appear.' },
  { name: 'Feedback Suppressor', blurb: 'Detecting a building howl and notching it before it takes off.' },
  { name: 'Ducking & Auto-Mixing', blurb: 'One signal deciding the level of another.' },
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
