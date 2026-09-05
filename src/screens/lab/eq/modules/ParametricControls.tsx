/**
 * ParametricControls — EQ Lab lesson 5 (owner spec 2026-08-07): the three
 * parametric controls, formally — Frequency · Gain · Q/Bandwidth — on ONE band
 * with the response graph changing continuously. Q is displayed BOTH ways
 * (Q number + bandwidth in octaves, spec mandate) so the two vocabularies
 * connect. The camera lesson made two of these intuitive; gain is new here.
 *
 * RACK UNIT (APE_LAB_UX_PROPOSAL 2026-08-23): this module renders the RackUnit
 * frame itself (EqModuleScreen gives rack modules the full height, no host
 * ScrollView). The response curve PINS on the stage; FREQ/GAIN/Q/BW read on
 * the bezel (the spec's dual Q+bandwidth readout, always visible); the three
 * controls ride the dock lane as faders — FREQ binds on mount (WHERE is the
 * first lesson). Only the prose and the check question scroll.
 */
import { useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { ResponseCurveGraph, eqResponseDb, type ResponseCurve } from '../../../../features/lab/fxViz';
import { CheckQuestion, type CheckSpec } from '../../foundations/bits';
import { colors, fonts } from '../../../../theme/tokens';
import { RackUnit } from '../../rack/RackUnit';
import type { DockParam } from '../../rack/rackTypes';
import { bwOctFromQ, fFromNorm, fmtHz, gainColor, normFromF } from './eqMath';
import { GlossaryText } from '../../../../features/glossary/glossaryLink';
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
  const gc = gainColor(gainDb, GAIN_RANGE); // boost warms, cut stays blue

  const curves = useMemo<ResponseCurve[]>(
    () => [
      {
        at: (f: number) => eqResponseDb([{ type: 'peak', freq, q, gainDb }], f),
        emphasis: 'main',
      },
    ],
    [freq, q, gainDb],
  );

  const params: DockParam[] = [
    {
      kind: 'fader',
      id: 'freq',
      label: 'FREQ',
      value: normFromF(freq),
      onChange: (t) => setFreq(fFromNorm(t)),
      format: () => fmtHz(freq),
    },
    {
      kind: 'fader',
      id: 'gain',
      label: 'GAIN',
      level: true,
      value: (gainDb + GAIN_RANGE) / (2 * GAIN_RANGE),
      onChange: (t) => setGainDb(Math.round((t * 2 * GAIN_RANGE - GAIN_RANGE) * 2) / 2),
      format: () => `${gainDb >= 0 ? '+' : ''}${gainDb.toFixed(1)} dB`,
      formatShort: () => `${gainDb >= 0 ? '+' : ''}${gainDb.toFixed(1)}`,
      tint: gc,
    },
    {
      kind: 'fader',
      id: 'q',
      label: 'Q',
      value: normFromQ(q),
      onChange: (t) => setQ(qFromNorm(t)),
      // Spec mandate: show Q AND bandwidth together, always.
      format: () => `Q ${q.toFixed(2)} · ${bwOct.toFixed(2)} oct`,
      formatShort: () => `Q${q.toFixed(1)}`,
    },
  ];

  return (
    <RackUnit
      initialParam="freq"
      params={params}
      stage={{
        size: 'M', // response-curve teaching chart
        bezel: [
          { k: 'FREQ', v: fmtHz(freq) },
          { k: 'GAIN', v: `${gainDb >= 0 ? '+' : ''}${gainDb.toFixed(1)} dB`, tint: gc },
          // The dual readout — the two vocabularies, side by side, always.
          { k: 'Q', v: q.toFixed(2) },
          { k: 'BW', v: `${bwOct.toFixed(2)} oct` },
        ],
        render: (w, h) => (
          <View style={{ width: w, height: h, justifyContent: 'center', paddingHorizontal: 8 }}>
            <ResponseCurveGraph curves={curves} dbRange={GAIN_RANGE} height={Math.max(80, h - 26)} mainColor={gc} />
          </View>
        ),
      }}
    >
      <View style={styles.well}>
        <GlossaryText style={styles.body}>
          A fully parametric band gives you three controls. You already know two of them from the
          camera: pan (frequency) and zoom (Q). The third — gain — is what you DO to the region
          you’re looking at.
        </GlossaryText>

        <Text style={styles.roleLine}>Frequency determines WHERE the EQ operates.</Text>
        <Text style={styles.roleLine}>Gain determines HOW MUCH you boost or cut.</Text>
        <Text style={styles.roleLine}>Q determines HOW WIDE or NARROW the affected range is.</Text>

        <CheckQuestion spec={CHECK} />
      </View>
    </RackUnit>
  );
}

const styles = StyleSheet.create({
  well: { gap: 12 },
  body: { fontFamily: fonts.barlowRegular, fontSize: 14, lineHeight: 20, color: colors.textSecondary },
  roleLine: { fontFamily: fonts.barlowMedium, fontSize: 12.5, lineHeight: 17, color: colors.textSub },
});
