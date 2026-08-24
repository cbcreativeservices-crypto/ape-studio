/**
 * QBandwidth — EQ Lab lesson 6 (owner spec 2026-08-07): wide vs narrow,
 * concentrated. One control only — Q — with frequency and gain deliberately
 * frozen (1 kHz, +9 dB) so the ONLY thing changing is the width. Ghost curves
 * pin the extremes (Q 0.5 wide · Q 8 narrow) for constant comparison, and the
 * counterintuitive inverse is stated head-on:
 *
 *   HIGH Q = NARROW · LOW Q = WIDE
 *
 * RACK UNIT (APE_LAB_UX_PROPOSAL 2026-08-23): this module renders the RackUnit
 * frame itself (EqModuleScreen gives rack modules the full height, no host
 * ScrollView). The curve-vs-ghosts chart PINS on the stage with the ghost
 * legend as its badge; the frozen FREQ/GAIN and the live dual Q+BW readout sit
 * on the bezel; the single Q fader rides the dock lane — riding it while the
 * bump narrows against the pinned ghosts IS the lesson. Prose scrolls.
 */
import { useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { ResponseCurveGraph, eqResponseDb, type ResponseCurve } from '../../../../features/lab/fxViz';
import { CheckQuestion, type CheckSpec } from '../../foundations/bits';
import { colors, fonts } from '../../../../theme/tokens';
import { RackUnit } from '../../rack/RackUnit';
import type { DockParam } from '../../rack/rackTypes';
import { bwOctFromQ, fmtHz, gainColor } from './eqMath';
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

  const params: DockParam[] = [
    {
      kind: 'fader',
      id: 'q',
      label: 'Q',
      value: normFromQ(q),
      onChange: (t) => setQ(qFromNorm(t)),
      // The dual readout — the whole lesson in two numbers.
      format: () => `Q ${q.toFixed(2)} · ${bwOct.toFixed(2)} oct`,
      formatShort: () => `Q${q.toFixed(1)}`,
    },
  ];

  return (
    <RackUnit
      initialParam="q"
      params={params}
      stage={{
        size: 'M', // response-curve teaching chart
        badge: 'ghosts: Q 0.5 · Q 8',
        bezel: [
          // The live dual readout, then the deliberately frozen parameters.
          { k: 'Q', v: q.toFixed(2) },
          { k: 'BW', v: `${bwOct.toFixed(2)} oct` },
          { k: 'FREQ', v: fmtHz(FREQ), tint: '#7a7f8a' },
          { k: 'GAIN', v: `+${GAIN_DB.toFixed(1)} dB`, tint: '#7a7f8a' },
        ],
        render: (w, h) => (
          <View style={{ width: w, height: h, justifyContent: 'center', paddingHorizontal: 8 }}>
            <ResponseCurveGraph curves={curves} dbRange={12} height={Math.max(80, h - 26)} mainColor={gainColor(GAIN_DB, 12)} />
          </View>
        ),
      }}
    >
      <View style={styles.well}>
        <GlossaryText style={styles.body}>
          Frequency and gain are frozen here (1 kHz, +9 dB) — the ONLY thing you’re changing is Q.
          Watch the same boost go from a broad, musical rise to a surgical spike.
        </GlossaryText>

        <View style={styles.banner}>
          <Text style={styles.bannerText}>HIGH Q = NARROW · LOW Q = WIDE</Text>
        </View>

        <Text style={styles.caption}>
          Q and bandwidth are two ways of describing the same thing: Q = center frequency ÷
          bandwidth. The counterintuitive part — a bigger Q number means a SMALLER affected region —
          trips up almost everyone once. Not you, now.
        </Text>

        <CheckQuestion spec={CHECK} />
      </View>
    </RackUnit>
  );
}

const styles = StyleSheet.create({
  well: { gap: 12 },
  body: { fontFamily: fonts.barlowRegular, fontSize: 14, lineHeight: 20, color: colors.textSecondary },
  caption: { fontFamily: fonts.barlowRegular, fontSize: 12.5, lineHeight: 17, color: colors.textSub },
  banner: { borderRadius: 10, borderWidth: 1, borderColor: 'rgba(255,198,77,.4)', backgroundColor: '#17130a', padding: 12, alignItems: 'center' },
  bannerText: { fontFamily: fonts.oswaldSemiBold, fontSize: 14, letterSpacing: 1.2, color: colors.amber },
});
