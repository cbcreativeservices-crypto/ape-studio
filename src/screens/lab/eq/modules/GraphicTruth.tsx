/**
 * GraphicTruth — EQ Lab lesson 11 (owner spec 2026-08-07): "What a Graphic EQ
 * Is REALLY Doing" — THE SLIDERS ARE NOT THE RESPONSE.
 *
 * Two curves over one 10-band board: the smooth SLIDER CURVE a beginner reads
 * by connecting the knobs, and the ACTUAL combined response of the real
 * overlapping filters. SHOW INDIVIDUAL FILTERS reveals every band's own bell
 * under the composite ("that's the revelation"); MAGNITUDE | PHASE shows that
 * a conventional minimum-phase EQ shifts phase around the regions it touches.
 *
 * Technical framing (owner ruling): filters INTERACT because they overlap and
 * each introduces frequency-dependent phase shift — NEVER framed as "adjacent
 * bands cause phase cancellation."
 */
import { useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { ResponseCurveGraph, rbjPeaking, type ResponseCurve } from '../../../../features/lab/fxViz';
import { CheckQuestion, type CheckSpec } from '../../foundations/bits';
import { GraphicBoard, MiniBtn } from './eqBits';
import { colors, fonts } from '../../../../theme/tokens';
import {
  biquadMagDb,
  graphicActualDb,
  graphicPhaseDeg,
  OCT_CENTERS,
  Q_1OCT,
  sliderCurveDb,
} from './eqMath';
import type { EqModuleComponentProps } from './registry';

const PRESET_LABEL = 'TRY 125 +3 · 250 +6 · 500 +3';

const CHECK: CheckSpec = {
  question: 'The line the SLIDER POSITIONS draw across a graphic EQ is…',
  options: [
    'Exactly the frequency response you get',
    'A control setting — the real response comes from overlapping filters and can differ',
    'The phase response',
  ],
  correctIdx: 1,
  reveal:
    'An EQ slider is a CONTROL, not a drawing of the result. Each band is a real filter with finite bandwidth; their responses overlap and combine — and minimum-phase filters also shift phase around the regions they touch.',
  wrongHint: 'If the sliders WERE the response, this lesson wouldn’t exist.',
};

export function GraphicTruthModule(_p: EqModuleComponentProps) {
  const [gains, setGains] = useState<number[]>(Array(OCT_CENTERS.length).fill(0));
  const [showIndividual, setShowIndividual] = useState(false);
  const [view, setView] = useState<'mag' | 'phase'>('mag');

  const setGain = (i: number, db: number) => setGains((g) => g.map((v, k) => (k === i ? db : v)));
  const reset = () => setGains(Array(OCT_CENTERS.length).fill(0));
  const preset = () =>
    setGains(OCT_CENTERS.map((c) => (c === 125 ? 3 : c === 250 ? 6 : c === 500 ? 3 : 0)));

  const magCurves = useMemo<ResponseCurve[]>(() => {
    const list: ResponseCurve[] = [];
    if (showIndividual) {
      OCT_CENTERS.forEach((c, i) => {
        const g = gains[i];
        if (g !== 0) {
          list.push({
            at: (f: number) => biquadMagDb(rbjPeaking(c, Q_1OCT, g), f),
            emphasis: 'ghost',
          });
        }
      });
    }
    // The beginner's imagined line — dim REFERENCE, never amber.
    list.push({ at: (f: number) => sliderCurveDb(OCT_CENTERS, gains, f), emphasis: 'ref' });
    // The truth — the amber main trace.
    list.push({ at: (f: number) => graphicActualDb(OCT_CENTERS, gains, Q_1OCT, f), emphasis: 'main' });
    return list;
  }, [gains, showIndividual]);

  const phaseCurves = useMemo<ResponseCurve[]>(
    () => [
      // The slider curve implies "no phase change" — pinned at 0° for contrast.
      { at: () => 0, emphasis: 'ref' },
      { at: (f: number) => graphicPhaseDeg(OCT_CENTERS, gains, Q_1OCT, f), emphasis: 'main' },
    ],
    [gains],
  );

  return (
    <View style={styles.root}>
      <View style={styles.banner}>
        <Text style={styles.bannerText}>THE SLIDERS ARE NOT THE RESPONSE</Text>
      </View>
      <Text style={styles.body}>
        Your eye connects the slider caps into a smooth line. But every band is a real filter with
        finite bandwidth — their responses overlap and COMBINE. Set the innocent-looking preset and
        compare the line you imagined (dim) with what the filters actually do (amber).
      </Text>

      <View style={styles.btnRow}>
        <MiniBtn label={PRESET_LABEL} onPress={preset} />
        <MiniBtn label="RESET" onPress={reset} />
      </View>
      <View style={styles.btnRow}>
        <MiniBtn label="MAGNITUDE" active={view === 'mag'} onPress={() => setView('mag')} />
        <MiniBtn label="PHASE" active={view === 'phase'} onPress={() => setView('phase')} />
        <MiniBtn
          label="SHOW INDIVIDUAL FILTERS"
          active={showIndividual}
          onPress={() => setShowIndividual((v) => !v)}
        />
      </View>

      <View style={styles.panel}>
        <View style={styles.panelHead}>
          <Text style={styles.panelEyebrow}>
            {view === 'mag' ? 'SLIDER CURVE (dim) vs ACTUAL RESPONSE (amber)' : 'PHASE — ±180° (0° reference dim)'}
          </Text>
        </View>
        {view === 'mag' ? (
          <ResponseCurveGraph curves={magCurves} dbRange={12} height={150} />
        ) : (
          <ResponseCurveGraph curves={phaseCurves} dbRange={180} height={150} />
        )}
        <GraphicBoard centers={OCT_CENTERS} gains={gains} onGain={setGain} />
        <Text style={styles.honest}>
          {view === 'mag'
            ? 'Real overlapping 1-octave bells, energy-combined — not the line through the caps.'
            : 'Conventional minimum-phase EQ shifts phase around every region it touches — it never changes “only amplitude.”'}
        </Text>
      </View>

      {/* The spec's memorable challenge — sliders look smooth, response says otherwise. */}
      <View style={styles.challenge}>
        <Text style={styles.challengeHead}>CHALLENGE — FLAT → SMOOTH → JAGGED</Text>
        <Text style={styles.caption}>
          Reset the board, then build what LOOKS like a beautiful smooth +6 dB rise from 125 Hz to
          1 kHz using only the sliders. Now look at the amber curve — and the phase view. Then try
          the same target with one parametric band in the Parametric Controls module: where, how
          much, how wide. That’s the precision argument in one move.
        </Text>
      </View>

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
  btnRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  panel: { borderRadius: 12, borderWidth: 1, borderColor: '#26262c', backgroundColor: '#131316', padding: 12, gap: 10 },
  panelHead: { flexDirection: 'row', alignItems: 'center' },
  panelEyebrow: { fontFamily: fonts.oswaldSemiBold, fontSize: 11.5, letterSpacing: 1, color: colors.amber, flexShrink: 1 },
  honest: { fontFamily: fonts.barlowRegular, fontSize: 11.5, lineHeight: 15, color: colors.textSub },
  challenge: { borderRadius: 10, borderWidth: 1, borderColor: '#26262c', backgroundColor: '#131316', padding: 12, gap: 6 },
  challengeHead: { fontFamily: fonts.oswaldSemiBold, fontSize: 12, letterSpacing: 1.2, color: colors.amber },
});
