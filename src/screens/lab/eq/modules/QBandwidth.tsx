/**
 * QBandwidth — EQ Lab lesson 6 (owner spec 2026-08-07): wide vs narrow,
 * concentrated. One control only — Q — with frequency and gain deliberately
 * frozen (1 kHz, +9 dB) so the ONLY thing changing is the width. Ghost curves
 * pin the extremes (Q 0.5 wide · Q 8 narrow) for constant comparison, and the
 * counterintuitive inverse is stated head-on:
 *
 *   HIGH Q = NARROW · LOW Q = WIDE
 */
import { useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { ResponseCurveGraph, eqResponseDb, type ResponseCurve } from '../../../../features/lab/fxViz';
import { CheckQuestion, DragSlider, type CheckSpec } from '../../foundations/bits';
import { colors, fonts } from '../../../../theme/tokens';
import { bwOctFromQ, gainColor } from './eqMath';
import { GlossaryText } from '../../../../features/glossary/glossaryLink';
import type { EqModuleComponentProps } from './registry';

const FREQ = 1000;
const GAIN_DB = 9;
const Q_MIN = 0.3;
const Q_MAX = 12;
const qFromNorm = (t: number) => Q_MIN * Math.pow(Q_MAX / Q_MIN, Math.max(0, Math.min(1, t)));
const normFromQ = (q: number) => Math.log(q / Q_MIN) / Math.log(Q_MAX / Q_MIN);

const CHECK: CheckSpec = {
  question: 'You need to affect a NARROWER range of frequencies. You should…',
  options: ['Raise the Q', 'Lower the Q', 'Raise the gain'],
  correctIdx: 0,
  reveal:
    'Higher Q = narrower bandwidth. It’s the counterintuitive part: a BIGGER Q number affects a SMALLER frequency region. Q = center frequency ÷ bandwidth.',
  wrongHint: 'Q works opposite the apparent width — and gain changes amount, not width.',
};

export function QBandwidthModule(_p: EqModuleComponentProps) {
  const [q, setQ] = useState(2);
  const bwOct = bwOctFromQ(q);

  const curves = useMemo<ResponseCurve[]>(
    () => [
      // Ghost extremes stay pinned for comparison (dim, dashed).
      { at: (f: number) => eqResponseDb([{ type: 'peak', freq: FREQ, q: 0.5, gainDb: GAIN_DB }], f), emphasis: 'ghost' },
      { at: (f: number) => eqResponseDb([{ type: 'peak', freq: FREQ, q: 8, gainDb: GAIN_DB }], f), emphasis: 'ghost' },
      { at: (f: number) => eqResponseDb([{ type: 'peak', freq: FREQ, q, gainDb: GAIN_DB }], f), emphasis: 'main' },
    ],
    [q],
  );

  return (
    <View style={styles.root}>
      <GlossaryText style={styles.body}>
        Frequency and gain are frozen here (1 kHz, +9 dB) — the ONLY thing you’re changing is Q.
        Watch the same boost go from a broad, musical rise to a surgical spike.
      </GlossaryText>

      <View style={styles.banner}>
        <Text style={styles.bannerText}>HIGH Q = NARROW · LOW Q = WIDE</Text>
      </View>

      <View style={styles.panel}>
        <View style={styles.panelHead}>
          <Text style={styles.panelEyebrow}>SAME BOOST, DIFFERENT WIDTH</Text>
          <Text style={styles.readoutDim}>ghosts: Q 0.5 · Q 8</Text>
        </View>
        <ResponseCurveGraph curves={curves} dbRange={12} height={150} mainColor={gainColor(GAIN_DB, 12)} />
        {/* The dual readout, large — the whole lesson in two numbers. */}
        <Text style={styles.qBig}>
          Q {q.toFixed(2)}  ↔︎  {bwOct.toFixed(2)} OCTAVES
        </Text>
      </View>

      <DragSlider
        label="Q"
        value={normFromQ(q)}
        onChange={(t) => setQ(qFromNorm(t))}
        readout={`Q ${q.toFixed(2)} · ${bwOct.toFixed(2)} oct`}
      />

      <Text style={styles.caption}>
        Q and bandwidth are two ways of describing the same thing: Q = center frequency ÷
        bandwidth. The counterintuitive part — a bigger Q number means a SMALLER affected region —
        trips up almost everyone once. Not you, now.
      </Text>

      <CheckQuestion spec={CHECK} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: 12 },
  body: { fontFamily: fonts.barlowRegular, fontSize: 14, lineHeight: 20, color: colors.textSecondary },
  caption: { fontFamily: fonts.barlowRegular, fontSize: 12.5, lineHeight: 17, color: colors.textSub },
  banner: { borderRadius: 10, borderWidth: 1, borderColor: 'rgba(255,198,77,.4)', backgroundColor: '#17130a', padding: 12, alignItems: 'center' },
  bannerText: { fontFamily: fonts.oswaldSemiBold, fontSize: 14, letterSpacing: 1.2, color: colors.amber },
  panel: { borderRadius: 12, borderWidth: 1, borderColor: '#26262c', backgroundColor: '#131316', padding: 12, gap: 8 },
  panelHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  panelEyebrow: { fontFamily: fonts.oswaldSemiBold, fontSize: 12, letterSpacing: 1.4, color: colors.amber },
  readoutDim: { fontFamily: fonts.mono, fontSize: 11, color: colors.textSub },
  qBig: { fontFamily: fonts.mono, fontSize: 16, color: colors.amber, textAlign: 'center' },
});
