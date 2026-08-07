/**
 * FilterShapes — EQ Lab lesson 7 (owner spec 2026-08-07): the six shapes, one
 * at a time, MANIPULATED rather than read about — Bell/Peak · Low Shelf ·
 * High Shelf · High-Pass/Low-Cut · Low-Pass/High-Cut · Notch. Every curve is
 * the real filter response (fxViz RBJ mirrors; notch via eqMath's cookbook
 * coefficients).
 */
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ResponseCurveGraph, eqResponseDb, type ResponseCurve } from '../../../../features/lab/fxViz';
import { CheckQuestion, DragSlider, type CheckSpec } from '../../foundations/bits';
import { colors, fonts } from '../../../../theme/tokens';
import { biquadMagDb, fFromNorm, fmtHz, normFromF, rbjNotch } from './eqMath';
import type { EqModuleComponentProps } from './registry';

type ShapeKey = 'bell' | 'lowShelf' | 'highShelf' | 'highPass' | 'lowPass' | 'notch';

const SHAPES: { key: ShapeKey; label: string; teach: string }[] = [
  { key: 'bell', label: 'BELL / PEAK', teach: 'Raises or lowers a REGION around its center frequency — the everyday parametric shape.' },
  { key: 'lowShelf', label: 'LOW SHELF', teach: 'Raises or lowers EVERYTHING below its corner frequency by a fixed amount — a shelf, not a bump.' },
  { key: 'highShelf', label: 'HIGH SHELF', teach: 'Raises or lowers EVERYTHING above its corner frequency — the classic “air” or “dullness” control.' },
  { key: 'highPass', label: 'HIGH-PASS / LOW-CUT', teach: 'PASSES the highs, removes energy below the cutoff. Two names, one filter — “low-cut” describes what it removes.' },
  { key: 'lowPass', label: 'LOW-PASS / HIGH-CUT', teach: 'PASSES the lows, removes energy above the cutoff — the mirror of the high-pass.' },
  { key: 'notch', label: 'NOTCH', teach: 'A deep, narrow null AT one frequency with the rest untouched — for surgically removing a single problem (hum, ring, feedback).' },
];

const CHECK: CheckSpec = {
  question: 'Which filter leaves everything ABOVE its frequency alone and removes energy BELOW it?',
  options: ['High-pass (low-cut)', 'Low-pass (high-cut)', 'Low shelf'],
  correctIdx: 0,
  reveal:
    'A HIGH-PASS filter PASSES the highs and CUTS the lows — the same device a console labels “low-cut”. The two names describe the same filter from opposite ends.',
  wrongHint: 'Name the filter by what it PASSES, not what it removes.',
};

export function FilterShapesModule(_p: EqModuleComponentProps) {
  const [shape, setShape] = useState<ShapeKey>('bell');
  const [freq, setFreq] = useState(1000);
  const [gainDb, setGainDb] = useState(6);
  const [q, setQ] = useState(2);

  const meta = SHAPES.find((s) => s.key === shape)!;
  const hasGain = shape === 'bell' || shape === 'lowShelf' || shape === 'highShelf';
  const hasQ = shape === 'bell' || shape === 'notch';

  const curves = useMemo<ResponseCurve[]>(() => {
    const at =
      shape === 'notch'
        ? (f: number) => biquadMagDb(rbjNotch(freq, Math.max(1, q)), f)
        : shape === 'bell'
          ? (f: number) => eqResponseDb([{ type: 'peak', freq, q, gainDb }], f)
          : shape === 'lowShelf' || shape === 'highShelf'
            ? (f: number) => eqResponseDb([{ type: shape, freq, q: 0.707, gainDb }], f)
            : (f: number) => eqResponseDb([{ type: shape, freq, q: 0.707, gainDb: 0 }], f);
    return [{ at, emphasis: 'main' }];
  }, [shape, freq, gainDb, q]);

  return (
    <View style={styles.root}>
      <Text style={styles.body}>
        EQ isn’t one shape — it’s a small family. Pick each one and move it: the differences teach
        themselves.
      </Text>

      <View style={styles.chipRow}>
        {SHAPES.map((s) => (
          <Pressable
            key={s.key}
            onPress={() => setShape(s.key)}
            hitSlop={6}
            accessibilityRole="button"
            accessibilityLabel={s.label}
            accessibilityState={{ selected: shape === s.key }}
            style={[styles.chip, shape === s.key && styles.chipActive]}
          >
            <Text style={[styles.chipText, shape === s.key && styles.chipTextActive]}>{s.label}</Text>
          </Pressable>
        ))}
      </View>

      <View style={styles.panel}>
        <View style={styles.panelHead}>
          <Text style={styles.panelEyebrow}>{meta.label}</Text>
          <Text style={styles.readout}>
            {fmtHz(freq)}
            {hasGain ? ` · ${gainDb >= 0 ? '+' : ''}${gainDb.toFixed(1)} dB` : ''}
            {hasQ ? ` · Q ${q.toFixed(1)}` : ''}
          </Text>
        </View>
        <ResponseCurveGraph curves={curves} dbRange={18} height={150} />
        <Text style={styles.teach}>{meta.teach}</Text>
        {shape === 'highPass' || shape === 'lowPass' ? (
          <Text style={styles.honest}>Drawn at 12 dB/octave — slopes get their own lesson next.</Text>
        ) : null}
      </View>

      <DragSlider
        label={shape === 'highPass' || shape === 'lowPass' ? 'CUTOFF FREQUENCY' : shape === 'notch' ? 'NOTCH FREQUENCY' : 'FREQUENCY'}
        value={normFromF(freq)}
        onChange={(t) => setFreq(fFromNorm(t))}
        readout={fmtHz(freq)}
      />
      {hasGain ? (
        <DragSlider
          label="GAIN"
          value={(gainDb + 18) / 36}
          onChange={(t) => setGainDb(Math.round((t * 36 - 18) * 2) / 2)}
          readout={`${gainDb >= 0 ? '+' : ''}${gainDb.toFixed(1)} dB`}
        />
      ) : null}
      {hasQ ? (
        <DragSlider
          label="Q"
          value={Math.log(q / 0.3) / Math.log(12 / 0.3)}
          onChange={(t) => setQ(0.3 * Math.pow(12 / 0.3, Math.max(0, Math.min(1, t))))}
          readout={`Q ${q.toFixed(1)}`}
        />
      ) : null}

      <CheckQuestion spec={CHECK} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: 12 },
  body: { fontFamily: fonts.barlowRegular, fontSize: 14, lineHeight: 20, color: colors.textSecondary },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { borderRadius: 8, borderWidth: 1, borderColor: '#2c2c33', paddingHorizontal: 10, paddingVertical: 8, backgroundColor: '#17171c' },
  chipActive: { borderColor: 'rgba(255,198,77,.55)', backgroundColor: '#1d1708' },
  chipText: { fontFamily: fonts.oswaldSemiBold, fontSize: 10.5, letterSpacing: 0.7, color: colors.textSecondary },
  chipTextActive: { color: colors.amber },
  panel: { borderRadius: 12, borderWidth: 1, borderColor: '#26262c', backgroundColor: '#131316', padding: 12, gap: 8 },
  panelHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  panelEyebrow: { fontFamily: fonts.oswaldSemiBold, fontSize: 12, letterSpacing: 1.2, color: colors.amber, flexShrink: 1 },
  readout: { fontFamily: fonts.mono, fontSize: 11.5, color: colors.amber },
  teach: { fontFamily: fonts.barlowRegular, fontSize: 13, lineHeight: 18, color: colors.textSecondary },
  honest: { fontFamily: fonts.barlowRegular, fontSize: 11.5, color: colors.textSub },
});
