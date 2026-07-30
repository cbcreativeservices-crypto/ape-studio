/**
 * digital/bits — shared UI for the Digital Audio Sampling & Conversion Lab
 * (no Skia here; safe on every client). Includes the lab's two signature
 * shared pieces: the MYTH vs REALITY card (the anti-misconception charter is
 * the owner's core requirement) and the SIMPLIFIED/STANDARD/X-RAY view-mode
 * chips used by the ADC/DAC modules.
 */
import { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, fonts } from '../../../theme/tokens';
import { LabChip } from '../LabShell';

export type ViewMode = 'simple' | 'standard' | 'xray';

export function ModeChips({ mode, onMode }: { mode: ViewMode; onMode: (m: ViewMode) => void }) {
  return (
    <View style={styles.chipRow}>
      <LabChip label="SIMPLIFIED" selected={mode === 'simple'} onPress={() => onMode('simple')} />
      <LabChip label="STANDARD" selected={mode === 'standard'} onPress={() => onMode('standard')} />
      <LabChip label="X-RAY" selected={mode === 'xray'} onPress={() => onMode('xray')} />
    </View>
  );
}

export function MythReality({ myth, reality }: { myth: string; reality: string }) {
  return (
    <View style={styles.mythCard}>
      <Text style={styles.mythLabel}>MYTH</Text>
      <Text style={styles.mythText}>{myth}</Text>
      <Text style={styles.realityLabel}>REALITY</Text>
      <Text style={styles.realityText}>{reality}</Text>
    </View>
  );
}

/** Compact label:value readout grid — every module's numbers row.
 *  Long-press-for-help (additive): pass `help` plus a `helpKey` (a default
 *  lesson key for the whole grid) and/or a per-item `helpKey`, and each wired
 *  cell opens that control's guided-lesson entry on long-press. Callers that
 *  omit `help` render exactly as before (plain, non-pressable cells). */
export function ReadoutGrid({
  items,
  help,
  helpKey,
}: {
  items: { k: string; v: string; helpKey?: string }[];
  help?: (k: string) => void;
  helpKey?: string;
}) {
  return (
    <View style={styles.grid}>
      {items.map((it) => {
        const hk = it.helpKey ?? helpKey;
        if (help && hk) {
          return (
            <Pressable
              key={it.k}
              style={styles.cell}
              onLongPress={() => help(hk)}
              delayLongPress={350}
              accessibilityRole="button"
              accessibilityLabel={`${it.k} — what it shows`}
            >
              <Text style={styles.cellK}>{it.k}</Text>
              <Text style={styles.cellV}>{it.v}</Text>
            </Pressable>
          );
        }
        return (
          <View key={it.k} style={styles.cell}>
            <Text style={styles.cellK}>{it.k}</Text>
            <Text style={styles.cellV}>{it.v}</Text>
          </View>
        );
      })}
    </View>
  );
}

export function PanelCard({ children }: { children: ReactNode }) {
  return <View style={styles.panelCard}>{children}</View>;
}

export function Badge({ text }: { text: string }) {
  return <Text style={styles.badge}>{text}</Text>;
}

/** Honest placeholder for listening tests that need the native DSP release. */
export function ListeningSoonCard({ what }: { what: string }) {
  return (
    <View style={styles.soonCard}>
      <Text style={styles.soonTitle}>🔈 LISTENING TEST — IN DEVELOPMENT</Text>
      <Text style={styles.soonBody}>
        {what} needs real-time bit-depth/dither/conversion processing in the native audio engine —
        arriving in a future release. The visuals above show exactly what you will hear.
      </Text>
    </View>
  );
}

export const dstyles = StyleSheet.create({
  eyebrow: { fontFamily: fonts.oswaldSemiBold, fontSize: 11, letterSpacing: 1.4, color: colors.amber, marginTop: 6 },
  body: { fontFamily: fonts.barlowRegular, fontSize: 14, lineHeight: 20, color: colors.textSecondary },
  caption: { fontFamily: fonts.barlowRegular, fontSize: 12.5, lineHeight: 17, color: colors.textSub },
  readout: { fontFamily: fonts.oswaldSemiBold, fontSize: 13, letterSpacing: 0.5, lineHeight: 18, color: colors.amber },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  mono: { fontFamily: fonts.mono, fontSize: 13, color: colors.textPrimary },
});

const styles = StyleSheet.create({
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  panelCard: { gap: 10, borderRadius: 10, borderWidth: 1, borderColor: '#26262c', backgroundColor: '#131316', padding: 12 },
  badge: { fontFamily: fonts.oswaldSemiBold, fontSize: 9, letterSpacing: 1, lineHeight: 13, color: colors.textSub },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  cell: { minWidth: 96, flexGrow: 1, borderRadius: 8, borderWidth: 1, borderColor: '#232329', backgroundColor: '#0f0f13', padding: 8, gap: 2 },
  cellK: { fontFamily: fonts.oswaldSemiBold, fontSize: 9, letterSpacing: 1, color: colors.textSub },
  cellV: { fontFamily: fonts.mono, fontSize: 13.5, color: colors.amber },
  mythCard: { borderRadius: 10, borderWidth: 1, borderColor: '#3a2626', backgroundColor: '#151011', padding: 12, gap: 4 },
  mythLabel: { fontFamily: fonts.oswaldSemiBold, fontSize: 10, letterSpacing: 1.4, color: '#ff6b5e' },
  mythText: { fontFamily: fonts.barlowMedium, fontSize: 13.5, lineHeight: 19, color: colors.textPrimary },
  realityLabel: { fontFamily: fonts.oswaldSemiBold, fontSize: 10, letterSpacing: 1.4, color: '#5bff85', marginTop: 6 },
  realityText: { fontFamily: fonts.barlowRegular, fontSize: 13.5, lineHeight: 19, color: colors.textSecondary },
  soonCard: { borderRadius: 10, borderWidth: 1, borderColor: '#26262c', backgroundColor: '#101014', padding: 12, gap: 5 },
  soonTitle: { fontFamily: fonts.oswaldSemiBold, fontSize: 11, letterSpacing: 1.1, color: colors.textSecondary },
  soonBody: { fontFamily: fonts.barlowRegular, fontSize: 12.5, lineHeight: 17, color: colors.textSub },
});
