/**
 * FilterSlopes — EQ Lab lesson 8 (owner spec 2026-08-07): dB/octave, seen
 * geometrically. The cutoff is HELD at 80 Hz and ONLY the slope changes —
 * 6 · 12 · 18 · 24 · 36 · 48 dB/oct — with every slope overlaid as a ghost so
 * the chosen one reads against the whole family. The readout proves the
 * geometry with the REAL attenuation one octave below the cutoff (40 Hz).
 */
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ResponseCurveGraph, type ResponseCurve } from '../../../../features/lab/fxViz';
import { CheckQuestion, type CheckSpec } from '../../foundations/bits';
import { colors, fonts } from '../../../../theme/tokens';
import { butterworthHpDb, gainColor } from './eqMath';
import { GlossaryText } from '../../../../features/glossary/glossaryLink';
import type { EqModuleComponentProps } from './registry';

const CUTOFF = 80;
const SLOPES = [6, 12, 18, 24, 36, 48] as const;

const CHECK: CheckSpec = {
  question: '“24 dB per octave” describes…',
  options: [
    'How quickly attenuation increases beyond the filter’s transition region',
    'How much the filter boosts at the cutoff',
    'How wide the filter’s Q is',
  ],
  correctIdx: 0,
  reveal:
    'Slope is the RATE of attenuation past the transition region: each octave beyond the cutoff loses roughly another 24 dB. Steeper slope = harder edge; gentler slope = more gradual.',
  wrongHint: 'Filters here only remove — and Q belongs to bells, not slopes.',
};

export function FilterSlopesModule(_p: EqModuleComponentProps) {
  const [slope, setSlope] = useState<(typeof SLOPES)[number]>(12);
  const order = slope / 6;

  const curves = useMemo<ResponseCurve[]>(
    () => [
      // The whole family stays overlaid (ghosts) — the spec's key visual.
      ...SLOPES.filter((s) => s !== slope).map((s) => ({
        at: (f: number) => butterworthHpDb(CUTOFF, f, s / 6),
        emphasis: 'ghost' as const,
      })),
      { at: (f: number) => butterworthHpDb(CUTOFF, f, order), emphasis: 'main' },
    ],
    [slope, order],
  );

  const atOctBelow = butterworthHpDb(CUTOFF, CUTOFF / 2, order);
  const atTwoOct = butterworthHpDb(CUTOFF, CUTOFF / 4, order);

  return (
    <View style={styles.root}>
      <GlossaryText style={styles.body}>
        Same filter, same 80 Hz cutoff — only the SLOPE changes. Slope describes how quickly
        attenuation increases beyond the filter’s transition region, in dB per octave.
      </GlossaryText>

      <View style={styles.chipRow}>
        {SLOPES.map((s) => (
          <Pressable
            key={s}
            onPress={() => setSlope(s)}
            hitSlop={6}
            accessibilityRole="button"
            accessibilityLabel={`${s} dB per octave`}
            accessibilityState={{ selected: slope === s }}
            style={[styles.chip, slope === s && styles.chipActive]}
          >
            <Text style={[styles.chipText, slope === s && styles.chipTextActive]}>{s}</Text>
          </Pressable>
        ))}
        <Text style={styles.chipUnit}>dB/OCT</Text>
      </View>

      <View style={styles.panel}>
        <View style={styles.panelHead}>
          <Text style={styles.panelEyebrow}>HPF @ 80 Hz — THE SLOPE FAMILY</Text>
          <Text style={styles.readout}>{slope} dB/OCT</Text>
        </View>
        {/* A slope is pure attenuation (all ≤0 dB) → MIDI blue (owner 2026-08-07). */}
        <ResponseCurveGraph curves={curves} dbRange={48} height={160} mainColor={gainColor(0)} />
        {/* Geometry proof: the REAL computed attenuation at 40 and 20 Hz. */}
        <Text style={styles.proof}>
          AT 40 Hz (1 oct below): {atOctBelow.toFixed(1)} dB · AT 20 Hz (2 oct below):{' '}
          {atTwoOct.toFixed(1)} dB
        </Text>
        <Text style={styles.honest}>Butterworth response — order {order} ({slope} dB/oct asymptotic).</Text>
      </View>

      <Text style={styles.caption}>
        Gentle slopes (6–12 dB/oct) sound transparent and are common on channel low-cuts; steep
        slopes (24–48 dB/oct) carve harder and appear in crossovers and surgical cleanup. Watch how
        the −3 dB point stays put while the skirt swings.
      </Text>

      <CheckQuestion spec={CHECK} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: 12 },
  body: { fontFamily: fonts.barlowRegular, fontSize: 14, lineHeight: 20, color: colors.textSecondary },
  caption: { fontFamily: fonts.barlowRegular, fontSize: 12.5, lineHeight: 17, color: colors.textSub },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8 },
  chip: { borderRadius: 8, borderWidth: 1, borderColor: '#2c2c33', paddingHorizontal: 13, paddingVertical: 8, backgroundColor: '#17171c' },
  chipActive: { borderColor: 'rgba(255,198,77,.55)', backgroundColor: '#1d1708' },
  chipText: { fontFamily: fonts.oswaldSemiBold, fontSize: 12, letterSpacing: 0.8, color: colors.textSecondary },
  chipTextActive: { color: colors.amber },
  chipUnit: { fontFamily: fonts.oswaldSemiBold, fontSize: 10.5, letterSpacing: 1, color: colors.textSub },
  panel: { borderRadius: 12, borderWidth: 1, borderColor: '#26262c', backgroundColor: '#131316', padding: 12, gap: 8 },
  panelHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  panelEyebrow: { fontFamily: fonts.oswaldSemiBold, fontSize: 12, letterSpacing: 1.2, color: colors.amber, flexShrink: 1 },
  readout: { fontFamily: fonts.mono, fontSize: 12, color: colors.amber },
  proof: { fontFamily: fonts.mono, fontSize: 11.5, color: colors.textSecondary, textAlign: 'center' },
  honest: { fontFamily: fonts.barlowRegular, fontSize: 11.5, color: colors.textSub },
});
