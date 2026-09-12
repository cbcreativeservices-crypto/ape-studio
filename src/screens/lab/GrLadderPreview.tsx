/**
 * DEV-ONLY harness for the GR ladder (`#grladderpreview`).
 *
 * WHY IT EXISTS: the web preview has no audio engine, so `fxGrStatus()` returns
 * null and every ladder in every dynamics lab renders honestly DARK. That makes
 * the one thing worth checking — does it light, and does it read downward —
 * impossible to see on the surface I can actually drive. This harness feeds the
 * SAME component fixed values so the fill can be inspected.
 *
 * ⚠️ It is a HARNESS, not a demo of the product: these numbers are typed in
 * here, and nothing in the app ever feeds GrLadder anything but the real
 * measured reduction. Keeping the fake values in a file that only a dev hash
 * can reach is what stops them leaking into a lab.
 */
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { GrLadder, GrMeter } from '../../features/lab/fxViz';
import { colors, fonts } from '../../theme/tokens';

const CASES: { db: number; note: string }[] = [
  { db: 0, note: 'silence — nothing lit' },
  { db: 3, note: 'gentle' },
  { db: 6, note: 'working' },
  { db: 12, note: 'half scale' },
  { db: 18, note: 'heavy' },
  { db: 24, note: 'full scale' },
  { db: 40, note: 'over-range → clamps' },
];

export function GrLadderPreview() {
  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content}>
      <Text style={styles.h}>GR LADDER — FILL HARNESS</Text>
      <Text style={styles.note}>
        Fixed values, typed in this file. Reads DOWNWARD from 0 at the top. 24 dB scale (compressor).
      </Text>
      <View style={styles.row}>
        {CASES.map((c) => (
          <View key={c.db} style={styles.cell}>
            <GrLadder grDb={c.db} maxDb={24} height={120} />
            <Text style={styles.cap}>{c.db} dB</Text>
            <Text style={styles.sub}>{c.note}</Text>
          </View>
        ))}
      </View>

      <Text style={styles.h}>GATE — 70 dB SCALE</Text>
      <Text style={styles.note}>24 dB must NOT peg here; a gate closes far harder than a compressor reduces.</Text>
      <View style={styles.row}>
        {[0, 12, 24, 40, 70].map((db) => (
          <View key={db} style={styles.cell}>
            <GrLadder grDb={db} maxDb={70} height={120} />
            <Text style={styles.cap}>{db} dB</Text>
          </View>
        ))}
      </View>

      <Text style={styles.h}>THE HORIZONTAL METER, FOR COMPARISON</Text>
      <View style={{ gap: 10 }}>
        {[0, 6, 12, 24].map((db) => (
          <GrMeter key={db} grDb={db} maxDb={24} label="COMPRESSOR" />
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0c0c0f' },
  content: { padding: 16, gap: 12, paddingBottom: 60 },
  h: { color: colors.amber, fontFamily: fonts.oswaldSemiBold, fontSize: 13, letterSpacing: 1.4, marginTop: 10 },
  note: { color: colors.textSub, fontFamily: fonts.barlowRegular, fontSize: 12, lineHeight: 16 },
  row: { flexDirection: 'row', gap: 14, flexWrap: 'wrap' },
  cell: { alignItems: 'center', gap: 3 },
  cap: { color: colors.textPrimary, fontFamily: fonts.mono, fontSize: 11 },
  sub: { color: colors.textSub, fontFamily: fonts.barlowRegular, fontSize: 10 },
});
