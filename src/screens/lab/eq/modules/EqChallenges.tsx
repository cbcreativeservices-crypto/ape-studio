/**
 * EqChallenges — EQ Lab CHALLENGE section (owner spec 2026-08-07): the
 * Boost-vs-Cut trainer. A signal with an EXCESSIVE 250 Hz region; compare the
 * two strategies side by side:
 *
 *   CUT THE PROBLEM  (−6 dB at 250 Hz)
 *   BOOST AROUND IT  (+6 dB below and above it)
 *
 * The lesson (owner ruling — NOT the old "always cut" cliché): EQ is about
 * changing spectral balance. Sometimes cutting the unwanted region is more
 * effective than boosting everything around it — but boosting is not
 * inherently wrong. The overall-level readout shows the practical difference.
 *
 * RACK evaluated 2026-08-23 — KEPT CLASSIC: no continuous teaching parameter
 * (three strategy buttons, an A/B comparison table and a quiz); a rack with an
 * empty lane pins a graph but improves nothing, and the compare columns are
 * exactly reading content.
 */
import { useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { ResponseCurveGraph, eqResponseDb, type EqBandSpec, type ResponseCurve } from '../../../../features/lab/fxViz';
import { CheckQuestion, type CheckSpec } from '../../foundations/bits';
import { ExpandableFigure } from '../../kit/ExpandableFigure';
import { MiniBtn } from './eqBits';
import { colors, fonts } from '../../../../theme/tokens';
import { baseSpectrumDb, gainColor, maxPosDb } from './eqMath';
import { GlossaryText } from '../../../../features/glossary/glossaryLink';
import { EqAuditionBar, eqAuditionAvailable } from './eqAudition';
import type { EqModuleComponentProps } from './registry';

/** The response graph's shape: fxViz's 320-unit width over a 150 px plot + its
 *  14 px frequency-label strip (ExpandableFigure zooms it in this shape). */
const GRAPH_ASPECT = 320 / (150 + 14);

/** The built-in problem: too much 250 Hz. */
const PROBLEM: EqBandSpec[] = [{ type: 'peak', freq: 250, q: 1, gainDb: 6 }];

/** Strategy A — cut the problem region. */
const CUT_FIX: EqBandSpec[] = [{ type: 'peak', freq: 250, q: 1, gainDb: -6 }];
/** Strategy B — boost everything around it instead. */
const BOOST_FIX: EqBandSpec[] = [
  { type: 'peak', freq: 63, q: 0.7, gainDb: 6 },
  { type: 'peak', freq: 2500, q: 0.5, gainDb: 6 },
];

type Strategy = 'none' | 'cut' | 'boost';

const CHECK: CheckSpec = {
  question: 'Both strategies improved the 250 Hz BALANCE. What’s the practical difference?',
  options: [
    'Nothing — they are identical',
    'The boost strategy raised the overall level (eats headroom); the cut removed only the excess',
    'The cut strategy destroyed the low end',
  ],
  correctIdx: 1,
  reveal:
    'Relative balance can end up similar — but boosting everything around a problem raises the whole signal (headroom, noise, gain staging), while a targeted cut removes only the excess. Sometimes cutting is more effective; boosting is still a legitimate tool.',
  wrongHint: 'Look at the overall-shift readout under the graph.',
};

export function EqChallengesModule(p: EqModuleComponentProps) {
  const [strategy, setStrategy] = useState<Strategy>('none');

  const fix = strategy === 'cut' ? CUT_FIX : strategy === 'boost' ? BOOST_FIX : [];
  // The audition plays PROBLEM + fix — the same sum the plot draws.
  const auditionBands = useMemo<EqBandSpec[]>(() => [...PROBLEM, ...fix], [fix]);

  const curves = useMemo<ResponseCurve[]>(
    () => [
      { at: (f: number) => baseSpectrumDb(f), emphasis: 'ref' }, // healthy balance
      {
        at: (f: number) => baseSpectrumDb(f) + eqResponseDb(PROBLEM, f) + (fix.length ? eqResponseDb(fix, f) : 0),
        emphasis: 'main',
      },
    ],
    [fix],
  );

  // Mean applied EQ over the spectrum — the "you just made everything louder" number.
  const overallShift = useMemo(() => {
    if (!fix.length) return 0;
    let s = 0;
    const N = 96;
    for (let i = 0; i <= N; i++) {
      const f = 20 * Math.pow(1000, i / N);
      s += eqResponseDb(fix, f);
    }
    return s / (N + 1);
  }, [fix]);

  // MIDI plot colour: warms with the excess still on the signal.
  const plotColor = gainColor(
    maxPosDb((f) => eqResponseDb(PROBLEM, f) + (fix.length ? eqResponseDb(fix, f) : 0)),
    12,
  );

  // The strategy keys — on the page above the graph AND docked inside FULL
  // SCREEN (legibility pass 2026-09-26), so the A/B still works enlarged.
  const strategyButtons = (
    <View style={styles.btnRow}>
      <MiniBtn label="PROBLEM ONLY" active={strategy === 'none'} onPress={() => setStrategy('none')} />
      <MiniBtn label="CUT THE PROBLEM (−6 @ 250)" active={strategy === 'cut'} onPress={() => setStrategy('cut')} />
      <MiniBtn label="BOOST AROUND IT (+6)" active={strategy === 'boost'} onPress={() => setStrategy('boost')} />
    </View>
  );

  return (
    <View style={styles.root}>
      <GlossaryText style={styles.body}>
        This signal has an EXCESSIVE 250 Hz region (amber vs the dim healthy reference). Goal:
        reduce it. Try both strategies and compare what else changes.
      </GlossaryText>

      {strategyButtons}

      <View style={styles.panel}>
        <View style={styles.panelHead}>
          <Text accessibilityRole="header" style={styles.panelEyebrow}>
            {strategy === 'none' ? 'THE PROBLEM' : strategy === 'cut' ? 'STRATEGY: CUT' : 'STRATEGY: BOOST AROUND'}
          </Text>
          <Text style={styles.readout}>
            {strategy === 'none' ? '250 Hz +6 dB' : `overall shift ≈ ${overallShift >= 0 ? '+' : ''}${overallShift.toFixed(1)} dB`}
          </Text>
        </View>
        <ExpandableFigure
          width={Math.max(120, p.width)}
          aspect={GRAPH_ASPECT}
          title="THE PROBLEM"
          badge="SYNTHETIC SPECTRUM · dim = healthy reference · amber = the signal"
          render={(w, h) => (
            <ResponseCurveGraph
              curves={curves}
              dbRange={24}
              width={w}
              totalHeight={h}
              // MIDI plot colour: warms with the excess still on the signal.
              mainColor={plotColor}
            />
          )}
          controls={strategyButtons}
        />
        {eqAuditionAvailable() ? (
          // Audible A/B (owner 2026-08-10): the PROBLEM coloration + your chosen
          // fix run live — switch strategy while playing and hear cut vs boost.
          <EqAuditionBar bands={auditionBands} />
        ) : (
          <Text style={styles.honest}>Synthetic spectrum — a visual exercise, no audio playback.</Text>
        )}
      </View>

      <View style={styles.compareRow}>
        <View style={styles.compareCol}>
          <Text style={styles.compareHead}>CUT −6 @ 250 Hz</Text>
          <Text style={styles.compareLine}>• Removes only the excess</Text>
          <Text style={styles.compareLine}>• Overall level ~unchanged</Text>
          <Text style={styles.compareLine}>• One move, surgical</Text>
        </View>
        <View style={styles.compareCol}>
          <Text style={styles.compareHead}>BOOST +6 AROUND IT</Text>
          <Text style={styles.compareLine}>• Balance improves relatively</Text>
          <Text style={styles.compareLine}>• Whole signal gets louder</Text>
          <Text style={styles.compareLine}>
            • Costs headroom and gain staging — the signal is louder, thus reducing available
            headroom into the next stage
          </Text>
        </View>
      </View>

      <Text style={styles.caption}>
        EQ is fundamentally about changing spectral balance. Sometimes cutting the unwanted region
        is more effective than boosting everything around it — but boosting is not inherently
        wrong. Choose deliberately.
      </Text>

      <CheckQuestion spec={CHECK} />

      <Text style={styles.caption}>
        More challenges live inside the lab: FLAT → SMOOTH → JAGGED (in “What a Graphic EQ
        Really Does”) and the five Fix-the-Signal scenarios.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: 12 },
  body: { fontFamily: fonts.barlowRegular, fontSize: 14, lineHeight: 20, color: colors.textSecondary },
  caption: { fontFamily: fonts.barlowRegular, fontSize: 12.5, lineHeight: 17, color: colors.textSub },
  honest: { fontFamily: fonts.barlowRegular, fontSize: 11.5, lineHeight: 15, color: colors.textSub },
  btnRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  panel: { borderRadius: 12, borderWidth: 1, borderColor: '#26262c', backgroundColor: '#131316', padding: 12, gap: 8 },
  panelHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  panelEyebrow: { fontFamily: fonts.oswaldSemiBold, fontSize: 11.5, letterSpacing: 1, color: colors.amber, flexShrink: 1 },
  readout: { fontFamily: fonts.mono, fontSize: 11.5, color: colors.amber },
  compareRow: { flexDirection: 'row', gap: 10 },
  compareCol: { flex: 1, borderRadius: 10, borderWidth: 1, borderColor: '#26262c', backgroundColor: '#131316', padding: 10, gap: 3 },
  compareHead: { fontFamily: fonts.oswaldSemiBold, fontSize: 11.5, letterSpacing: 0.8, color: colors.amber, marginBottom: 2 },
  compareLine: { fontFamily: fonts.barlowMedium, fontSize: 12, lineHeight: 17, color: colors.textSecondary },
});
