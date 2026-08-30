/**
 * WhyEq — EQ Lab lesson 2 (owner spec 2026-08-07): EQ = changing the BALANCE
 * of frequency content. Introduces boost and cut/attenuation and the idea of
 * targeting a frequency region — nothing else yet (parametric controls are
 * lesson 5; the camera analogy is lesson 4).
 *
 * All-analytic: the curve is the real RBJ peaking response (fxViz — DESIGNED
 * RESPONSE grammar), no audio required.
 *
 * RACK evaluated 2026-08-23 — KEPT CLASSIC: a gentle intro lesson with one
 * slider; the rack would bury the three REGION chips (deliberately co-visible
 * with the graph for beginners) behind a tray and add dock grammar before the
 * student has met parametric controls (lesson 5).
 */
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ResponseCurveGraph, eqResponseDb, type ResponseCurve } from '../../../../features/lab/fxViz';
import { CheckQuestion, DragSlider, type CheckSpec } from '../../foundations/bits';
import { colors, fonts } from '../../../../theme/tokens';
import { fmtHz, gainColor } from './eqMath';
import { GlossaryText } from '../../../../features/glossary/glossaryLink';
import type { EqModuleComponentProps } from './registry';

/** Three broad regions — deliberately coarse; precision arrives in lesson 5. */
const REGIONS = [
  { key: 'LOW', f: 120 },
  { key: 'MID', f: 1000 },
  { key: 'HIGH', f: 6000 },
] as const;

/** Wide, musical bell for the region demo (Q≈0.8 ≈ 1.8 octaves). */
const REGION_Q = 0.8;
const GAIN_RANGE = 12; // ±12 dB — enough to see balance change dramatically

const CHECK: CheckSpec = {
  question: 'Turning a frequency region DOWN with an EQ is called…',
  options: ['Boost', 'Cut (attenuation)', 'Q'],
  correctIdx: 1,
  reveal:
    'Cut (attenuation) lowers a region’s level; boost raises it. Neither is inherently right or wrong — EQ is about changing the BALANCE of frequency content.',
  wrongHint: 'Think “down = ?” — Q is about width, not direction.',
};

export function WhyEqModule(_p: EqModuleComponentProps) {
  const [region, setRegion] = useState<(typeof REGIONS)[number]>(REGIONS[1]);
  const [gainDb, setGainDb] = useState(6);

  const curves = useMemo<ResponseCurve[]>(
    () => [
      {
        at: (f: number) => eqResponseDb([{ type: 'peak', freq: region.f, q: REGION_Q, gainDb }], f),
        emphasis: 'main',
      },
    ],
    [region, gainDb],
  );
  // MIDI level colour (owner 2026-08-07): boost warms toward red, a cut stays blue.
  const gc = gainColor(gainDb, GAIN_RANGE);

  return (
    <View style={styles.root}>
      <GlossaryText style={styles.body}>
        Every sound you work with is a balance of frequency content — lows, mids, highs, all at
        once. An equalizer changes that balance: you pick a frequency region and either raise it
        (BOOST) or lower it (CUT, also called attenuation).
      </GlossaryText>

      <View style={styles.panel}>
        <View style={styles.panelHead}>
          <Text accessibilityRole="header" style={styles.panelEyebrow}>EQ RESPONSE</Text>
          <Text style={[styles.readout, { color: gc }]}>
            {fmtHz(region.f)} · {gainDb >= 0 ? '+' : ''}
            {gainDb.toFixed(1)} dB
          </Text>
        </View>
        <ResponseCurveGraph curves={curves} dbRange={GAIN_RANGE + 3} height={140} mainColor={gc} />
        <Text style={styles.verdict}>
          {gainDb > 0.5
            ? 'BOOST — raising the level of this frequency region.'
            : gainDb < -0.5
              ? 'CUT / ATTENUATION — lowering the level of this frequency region.'
              : 'FLAT — no change; the balance is untouched.'}
        </Text>
      </View>

      <Text style={styles.sectionTitle}>PICK A REGION</Text>
      <View style={styles.chipRow}>
        {REGIONS.map((r) => (
          <Pressable
            key={r.key}
            onPress={() => setRegion(r)}
            hitSlop={6}
            accessibilityRole="button"
            accessibilityLabel={`${r.key} region`}
            accessibilityState={{ selected: region.key === r.key }}
            style={[styles.chip, region.key === r.key && styles.chipActive]}
          >
            <Text style={[styles.chipText, region.key === r.key && styles.chipTextActive]}>{r.key}</Text>
          </Pressable>
        ))}
      </View>

      <DragSlider
        label="GAIN"
        value={(gainDb + GAIN_RANGE) / (2 * GAIN_RANGE)}
        onChange={(t) => setGainDb(Math.round((t * 2 * GAIN_RANGE - GAIN_RANGE) * 2) / 2)}
        readout={`${gainDb >= 0 ? '+' : ''}${gainDb.toFixed(1)} dB`}
        tint={gc}
      />

      <Text style={styles.caption}>
        Boosting and cutting are both legitimate tools — sometimes lowering the unwanted region is
        more effective than raising everything around it, but boosting is not inherently wrong.
      </Text>

      <CheckQuestion spec={CHECK} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: 12 },
  body: { fontFamily: fonts.barlowRegular, fontSize: 14, lineHeight: 20, color: colors.textSecondary },
  caption: { fontFamily: fonts.barlowRegular, fontSize: 12.5, lineHeight: 17, color: colors.textSub },
  sectionTitle: { fontFamily: fonts.oswaldSemiBold, fontSize: 13, letterSpacing: 1.4, color: colors.amber, marginTop: 2 },
  panel: { borderRadius: 12, borderWidth: 1, borderColor: '#26262c', backgroundColor: '#131316', padding: 12, gap: 8 },
  panelHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  panelEyebrow: { fontFamily: fonts.oswaldSemiBold, fontSize: 12, letterSpacing: 1.4, color: colors.amber },
  readout: { fontFamily: fonts.mono, fontSize: 12, color: colors.amber },
  verdict: { fontFamily: fonts.oswaldSemiBold, fontSize: 12, letterSpacing: 0.8, color: colors.textSecondary },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { borderRadius: 8, borderWidth: 1, borderColor: '#2c2c33', paddingHorizontal: 14, paddingVertical: 8, backgroundColor: '#17171c' },
  chipActive: { borderColor: 'rgba(255,198,77,.55)', backgroundColor: '#1d1708' },
  chipText: { fontFamily: fonts.oswaldSemiBold, fontSize: 12, letterSpacing: 0.8, color: colors.textSecondary },
  chipTextActive: { color: colors.amber },
});
