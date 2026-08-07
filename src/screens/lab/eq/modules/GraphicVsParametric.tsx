/**
 * GraphicVsParametric — EQ Lab lesson 10 (owner spec 2026-08-07): the graphic
 * EQ workflow, hands-on, against the parametric one the student already knows.
 * 1-OCTAVE board first (mobile-friendly 31…16k), 1/3-OCTAVE demonstrated
 * separately with horizontal scrolling. The comparison is framed the honest
 * way (owner ruling): graphic = FAST fixed-band control (still professionally
 * used); parametric = substantially greater PRECISION — never "pros don't use
 * graphic EQs."
 */
import { useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { ResponseCurveGraph, type ResponseCurve } from '../../../../features/lab/fxViz';
import { CheckQuestion, type CheckSpec } from '../../foundations/bits';
import { GraphicBoard, MiniBtn } from './eqBits';
import { colors, fonts } from '../../../../theme/tokens';
import { fmtHz, graphicActualDb, OCT_CENTERS, Q_1OCT, Q_THIRD, THIRD_CENTERS } from './eqMath';
import { GlossaryText } from '../../../../features/glossary/glossaryLink';
import type { EqModuleComponentProps } from './registry';

const CHECK: CheckSpec = {
  question: 'What can a PARAMETRIC band adjust that a GRAPHIC band cannot?',
  options: ['Gain', 'Frequency and Q/bandwidth', 'Nothing — they’re identical'],
  correctIdx: 1,
  reveal:
    'A graphic band has a FIXED frequency and a fixed/defined bandwidth — only its gain moves. A parametric band adjusts frequency, gain, AND Q. Graphic = fast fixed-band control; parametric = precision.',
  wrongHint: 'Both adjust gain — that’s the one thing a graphic slider does.',
};

export function GraphicVsParametricModule(_p: EqModuleComponentProps) {
  const [board, setBoard] = useState<'oct' | 'third'>('oct');
  const [octGains, setOctGains] = useState<number[]>(Array(OCT_CENTERS.length).fill(0));
  const [thirdGains, setThirdGains] = useState<number[]>(Array(THIRD_CENTERS.length).fill(0));
  const [activeIdx, setActiveIdx] = useState<number | null>(null);

  const centers = board === 'oct' ? OCT_CENTERS : THIRD_CENTERS;
  const gains = board === 'oct' ? octGains : thirdGains;
  const q = board === 'oct' ? Q_1OCT : Q_THIRD;
  const setGain = (i: number, db: number) => {
    if (board === 'oct') setOctGains((g) => g.map((v, k) => (k === i ? db : v)));
    else setThirdGains((g) => g.map((v, k) => (k === i ? db : v)));
  };
  const reset = () => {
    if (board === 'oct') setOctGains(Array(OCT_CENTERS.length).fill(0));
    else setThirdGains(Array(THIRD_CENTERS.length).fill(0));
  };

  const curves = useMemo<ResponseCurve[]>(
    () => [{ at: (f: number) => graphicActualDb(centers, gains, q, f), emphasis: 'main' }],
    [centers, gains, q],
  );

  return (
    <View style={styles.root}>
      <GlossaryText style={styles.body}>
        A graphic EQ is a row of FIXED bands — one slider per frequency, gain only. You’ve been
        driving a parametric band; now drive the board.
      </GlossaryText>

      <View style={styles.btnRow}>
        <MiniBtn label="1-OCTAVE" active={board === 'oct'} onPress={() => setBoard('oct')} />
        <MiniBtn label="1/3-OCTAVE" active={board === 'third'} onPress={() => setBoard('third')} />
        <MiniBtn label="RESET" onPress={reset} />
      </View>

      <View style={styles.panel}>
        <View style={styles.panelHead}>
          <Text style={styles.panelEyebrow}>
            {board === 'oct' ? '10 BANDS · 1/1 OCTAVE' : '31 BANDS · 1/3 OCTAVE — scroll the board'}
          </Text>
          <Text style={styles.readout}>±12 dB</Text>
        </View>
        <ResponseCurveGraph curves={curves} dbRange={15} height={130} />
        <Text style={[styles.active, activeIdx != null && styles.activeOn]}>
          {activeIdx != null
            ? `${fmtHz(centers[activeIdx])}  ·  ${gains[activeIdx] >= 0 ? '+' : ''}${gains[activeIdx].toFixed(1)} dB`
            : 'Touch a slider to read its frequency and level'}
        </Text>
        <GraphicBoard centers={centers} gains={gains} onGain={setGain} onActiveIndex={setActiveIdx} />
        <Text style={styles.honest}>
          Curve = the ACTUAL combined response of the board’s real filters (fixed{' '}
          {board === 'oct' ? '1-octave' : '1/3-octave'} bells) — more on that in the next lesson.
        </Text>
      </View>

      {/* The honest comparison (owner ruling). */}
      <View style={styles.compareRow}>
        <View style={styles.compareCol}>
          <Text style={styles.compareHead}>GRAPHIC EQ</Text>
          <Text style={styles.compareLine}>• Fixed frequencies</Text>
          <Text style={styles.compareLine}>• Fixed / defined bandwidth</Text>
          <Text style={styles.compareLine}>• Adjustable gain</Text>
          <Text style={styles.compareWhy}>Fast, repeatable, fixed-band control — rooms, monitors, quick shaping.</Text>
        </View>
        <View style={styles.compareCol}>
          <Text style={styles.compareHead}>PARAMETRIC EQ</Text>
          <Text style={styles.compareLine}>• Adjustable frequency</Text>
          <Text style={styles.compareLine}>• Adjustable gain</Text>
          <Text style={styles.compareLine}>• Adjustable Q / bandwidth</Text>
          <Text style={styles.compareWhy}>Substantially greater precision — put the filter exactly where the problem is.</Text>
        </View>
      </View>
      <Text style={styles.caption}>
        Both remain professional tools. The choice is workflow: speed and fixed bands versus
        precision and full control.
      </Text>

      <CheckQuestion spec={CHECK} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: 12 },
  body: { fontFamily: fonts.barlowRegular, fontSize: 14, lineHeight: 20, color: colors.textSecondary },
  caption: { fontFamily: fonts.barlowRegular, fontSize: 12.5, lineHeight: 17, color: colors.textSub },
  btnRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  panel: { borderRadius: 12, borderWidth: 1, borderColor: '#26262c', backgroundColor: '#131316', padding: 12, gap: 10 },
  panelHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  panelEyebrow: { fontFamily: fonts.oswaldSemiBold, fontSize: 12, letterSpacing: 1.2, color: colors.amber, flexShrink: 1 },
  readout: { fontFamily: fonts.mono, fontSize: 11.5, color: colors.textSub },
  honest: { fontFamily: fonts.barlowRegular, fontSize: 11.5, lineHeight: 15, color: colors.textSub },
  active: { fontFamily: fonts.mono, fontSize: 12.5, color: colors.textSub, textAlign: 'center' },
  activeOn: { color: colors.amber, fontSize: 14 },
  compareRow: { flexDirection: 'row', gap: 10 },
  compareCol: { flex: 1, borderRadius: 10, borderWidth: 1, borderColor: '#26262c', backgroundColor: '#131316', padding: 10, gap: 3 },
  compareHead: { fontFamily: fonts.oswaldSemiBold, fontSize: 12, letterSpacing: 1, color: colors.amber, marginBottom: 2 },
  compareLine: { fontFamily: fonts.barlowMedium, fontSize: 12.5, lineHeight: 17, color: colors.textSecondary },
  compareWhy: { fontFamily: fonts.barlowRegular, fontSize: 11.5, lineHeight: 15, color: colors.textSub, marginTop: 4 },
});
