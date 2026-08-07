/**
 * ParametricControls — EQ Lab lesson 5 (owner spec 2026-08-07): the three
 * parametric controls, formally — Frequency · Gain · Q/Bandwidth — on ONE band
 * with the response graph changing continuously. Q is displayed BOTH ways
 * (Q number + bandwidth in octaves, spec mandate) so the two vocabularies
 * connect. The camera lesson made two of these intuitive; gain is new here.
 */
import { useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { ResponseCurveGraph, eqResponseDb, type ResponseCurve } from '../../../../features/lab/fxViz';
import { CheckQuestion, DragSlider, type CheckSpec } from '../../foundations/bits';
import { colors, fonts } from '../../../../theme/tokens';
import { bwOctFromQ, fFromNorm, fmtHz, normFromF } from './eqMath';
import type { EqModuleComponentProps } from './registry';

const GAIN_RANGE = 18; // spec: −18 … +18 dB
// Q slider is log-mapped 0.3 … 12 (console-realistic range).
const Q_MIN = 0.3;
const Q_MAX = 12;
const qFromNorm = (t: number) => Q_MIN * Math.pow(Q_MAX / Q_MIN, Math.max(0, Math.min(1, t)));
const normFromQ = (q: number) => Math.log(q / Q_MIN) / Math.log(Q_MAX / Q_MIN);

const CHECK: CheckSpec = {
  question: 'Which control decides WHERE in the spectrum the EQ operates?',
  options: ['Frequency', 'Gain', 'Q'],
  correctIdx: 0,
  reveal:
    'Frequency = WHERE the EQ operates. Gain = HOW MUCH you boost or cut. Q/bandwidth = HOW WIDE or NARROW the affected region is. Three controls — full parametric command.',
  wrongHint: 'Think back to the camera: which control was PAN?',
};

export function ParametricControlsModule(_p: EqModuleComponentProps) {
  const [freq, setFreq] = useState(1000);
  const [gainDb, setGainDb] = useState(6);
  const [q, setQ] = useState(2);
  const bwOct = bwOctFromQ(q);

  const curves = useMemo<ResponseCurve[]>(
    () => [
      {
        at: (f: number) => eqResponseDb([{ type: 'peak', freq, q, gainDb }], f),
        emphasis: 'main',
      },
    ],
    [freq, q, gainDb],
  );

  return (
    <View style={styles.root}>
      <Text style={styles.body}>
        A fully parametric band gives you three controls. You already know two of them from the
        camera: pan (frequency) and zoom (Q). The third — gain — is what you DO to the region
        you’re looking at.
      </Text>

      <View style={styles.panel}>
        <View style={styles.panelHead}>
          <Text style={styles.panelEyebrow}>ONE PARAMETRIC BAND</Text>
          <Text style={styles.readout}>
            {fmtHz(freq)} · {gainDb >= 0 ? '+' : ''}
            {gainDb.toFixed(1)} dB
          </Text>
        </View>
        <ResponseCurveGraph curves={curves} dbRange={GAIN_RANGE} height={150} />
        {/* Spec mandate: show Q AND bandwidth together, always. */}
        <Text style={styles.qReadout}>
          Q: {q.toFixed(2)}   Bandwidth: {bwOct.toFixed(2)} octaves
        </Text>
      </View>

      <DragSlider
        label="FREQUENCY"
        value={normFromF(freq)}
        onChange={(t) => setFreq(fFromNorm(t))}
        readout={fmtHz(freq)}
      />
      <Text style={styles.roleLine}>Frequency determines WHERE the EQ operates.</Text>

      <DragSlider
        label="GAIN"
        value={(gainDb + GAIN_RANGE) / (2 * GAIN_RANGE)}
        onChange={(t) => setGainDb(Math.round((t * 2 * GAIN_RANGE - GAIN_RANGE) * 2) / 2)}
        readout={`${gainDb >= 0 ? '+' : ''}${gainDb.toFixed(1)} dB`}
      />
      <Text style={styles.roleLine}>Gain determines HOW MUCH you boost or cut.</Text>

      <DragSlider
        label="Q / BANDWIDTH"
        value={normFromQ(q)}
        onChange={(t) => setQ(qFromNorm(t))}
        readout={`Q ${q.toFixed(2)} · ${bwOct.toFixed(2)} oct`}
      />
      <Text style={styles.roleLine}>Q determines HOW WIDE or NARROW the affected range is.</Text>

      <CheckQuestion spec={CHECK} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: 12 },
  body: { fontFamily: fonts.barlowRegular, fontSize: 14, lineHeight: 20, color: colors.textSecondary },
  panel: { borderRadius: 12, borderWidth: 1, borderColor: '#26262c', backgroundColor: '#131316', padding: 12, gap: 8 },
  panelHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  panelEyebrow: { fontFamily: fonts.oswaldSemiBold, fontSize: 12, letterSpacing: 1.4, color: colors.amber },
  readout: { fontFamily: fonts.mono, fontSize: 12, color: colors.amber },
  qReadout: { fontFamily: fonts.mono, fontSize: 13, color: colors.amber, textAlign: 'center' },
  roleLine: { fontFamily: fonts.barlowMedium, fontSize: 12.5, lineHeight: 17, color: colors.textSub, marginTop: -6 },
});
