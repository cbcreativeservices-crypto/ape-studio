/**
 * FixSignal — EQ Lab lesson 15 (owner spec 2026-08-07): practical problems.
 * The scenario tells a STORY, not a frequency — the learner decides what needs
 * changing and how; nobody names the control. Same visual correction engine as
 * Find the Frequency (synthetic spectrum, labeled), scenario-flavored.
 */
import { useCallback, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ResponseCurveGraph, eqResponseDb, type ResponseCurve } from '../../../../features/lab/fxViz';
import { DragSlider } from '../../foundations/bits';
import { MiniBtn } from './eqBits';
import { colors, fonts } from '../../../../theme/tokens';
import { baseSpectrumDb, bwOctFromQ, fFromNorm, fmtHz, normFromF } from './eqMath';
import type { EqModuleComponentProps } from './registry';

type Scenario = {
  name: string;
  story: string;
  hidden: { f: number; g: number; q: number };
  moral: string;
};

const SCENARIOS: Scenario[] = [
  {
    name: 'BOOMY KICK',
    story: 'The kick drum sounds thick and boomy — it swallows the bass line.',
    hidden: { f: 250, g: 8, q: 1.4 },
    moral: 'Low-mid buildup around 200–300 Hz reads as “boomy/muddy” — a cut there cleans it without losing punch.',
  },
  {
    name: 'HARSH VOCAL',
    story: 'The vocal gets painful when the singer pushes — listeners flinch.',
    hidden: { f: 3200, g: 7, q: 2 },
    moral: 'Harshness lives in the 2–5 kHz presence region, where the ear is most sensitive.',
  },
  {
    name: 'STAGE RUMBLE',
    story: 'Something is rumbling under everything — you feel it more than hear it.',
    hidden: { f: 60, g: 9, q: 1 },
    moral: 'Sub-100 Hz rumble is the classic low-cut situation — this is exactly why HPFs are everywhere.',
  },
  {
    name: 'HONKY GUITAR',
    story: 'The acoustic guitar sounds boxy and honky, like it’s in a cardboard tube.',
    hidden: { f: 800, g: 7, q: 1.4 },
    moral: '“Boxy/honky” points at the 400–1000 Hz low-mids.',
  },
  {
    name: 'SIBILANT VOCAL',
    story: 'Every S and T spits — the consonants slice through the mix.',
    hidden: { f: 6500, g: 6, q: 3 },
    moral: 'Sibilance sits around 5–8 kHz; narrow cuts (or a de-esser) tame it.',
  },
];

type UserBand = { f: number; g: number; q: number };

export function FixSignalModule(_p: EqModuleComponentProps) {
  const [idx, setIdx] = useState(0);
  const [band, setBand] = useState<UserBand>({ f: 500, g: 0, q: 1.4 });
  const [checked, setChecked] = useState<null | { pass: boolean }>(null);

  const sc = SCENARIOS[idx];

  const goTo = useCallback((i: number) => {
    setIdx(i);
    setBand({ f: 500, g: 0, q: 1.4 });
    setChecked(null);
  }, []);

  const curves = useMemo<ResponseCurve[]>(
    () => [
      { at: (f: number) => baseSpectrumDb(f), emphasis: 'ref' },
      {
        at: (f: number) =>
          baseSpectrumDb(f) +
          eqResponseDb([{ type: 'peak', freq: sc.hidden.f, q: sc.hidden.q, gainDb: sc.hidden.g }], f) +
          (band.g !== 0 ? eqResponseDb([{ type: 'peak', freq: band.f, q: band.q, gainDb: band.g }], f) : 0),
        emphasis: 'main',
      },
    ],
    [sc, band],
  );

  const check = () => {
    const freqOk = Math.abs(Math.log2(band.f / sc.hidden.f)) <= 1 / 3;
    const gainOk = Math.abs(band.g + sc.hidden.g) <= 3 && band.g * sc.hidden.g < 0;
    setChecked({ pass: freqOk && gainOk });
  };

  return (
    <View style={styles.root}>
      <Text style={styles.body}>
        Real problems don’t announce their frequency. Read the complaint, look at the spectrum,
        decide what to change — and how much, and how wide.
      </Text>

      <View style={styles.btnRow}>
        {SCENARIOS.map((s, i) => (
          <MiniBtn key={s.name} label={`${i + 1}`} active={idx === i} onPress={() => goTo(i)} />
        ))}
      </View>

      <View style={styles.scenario}>
        <Text style={styles.scenarioName}>{sc.name}</Text>
        <Text style={styles.body}>{sc.story}</Text>
      </View>

      <View style={styles.panel}>
        <View style={styles.panelHead}>
          <Text style={styles.panelEyebrow}>SIGNAL (amber) vs REFERENCE (dim)</Text>
          <Text style={styles.readout}>SYNTHETIC</Text>
        </View>
        <ResponseCurveGraph curves={curves} dbRange={24} height={150} />
      </View>

      <DragSlider label="FREQUENCY" value={normFromF(band.f)} onChange={(t) => setBand((b) => ({ ...b, f: fFromNorm(t) }))} readout={fmtHz(band.f)} />
      <DragSlider
        label="GAIN"
        value={(band.g + 18) / 36}
        onChange={(t) => setBand((b) => ({ ...b, g: Math.round((t * 36 - 18) * 2) / 2 }))}
        readout={`${band.g >= 0 ? '+' : ''}${band.g.toFixed(1)} dB`}
      />
      <DragSlider
        label="Q"
        value={Math.log(band.q / 0.3) / Math.log(12 / 0.3)}
        onChange={(t) => setBand((b) => ({ ...b, q: 0.3 * Math.pow(12 / 0.3, Math.max(0, Math.min(1, t))) }))}
        readout={`Q ${band.q.toFixed(2)} · ${bwOctFromQ(band.q).toFixed(2)} oct`}
      />

      <View style={styles.btnRow}>
        <Pressable onPress={check} style={styles.checkBtn} accessibilityRole="button" accessibilityLabel="Check my fix">
          <Text style={styles.checkBtnText}>CHECK</Text>
        </Pressable>
        {idx < SCENARIOS.length - 1 && <MiniBtn label="NEXT SCENARIO ›" onPress={() => goTo(idx + 1)} />}
      </View>

      {checked && (
        <View style={[styles.result, checked.pass ? styles.resultPass : null]}>
          <Text style={[styles.resultHead, checked.pass ? styles.resultHeadPass : null]}>
            {checked.pass ? '✓ FIXED' : 'NOT YET'} — the problem was {sc.hidden.g > 0 ? 'a boost' : 'a hole'} around{' '}
            {fmtHz(sc.hidden.f)}.
          </Text>
          <Text style={styles.caption}>{sc.moral}</Text>
        </View>
      )}

      <Text style={styles.honest}>Visual trainer on a synthetic spectrum — labeled honestly until the audio build.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: 12 },
  body: { fontFamily: fonts.barlowRegular, fontSize: 14, lineHeight: 20, color: colors.textSecondary },
  caption: { fontFamily: fonts.barlowRegular, fontSize: 12.5, lineHeight: 17, color: colors.textSub },
  honest: { fontFamily: fonts.barlowRegular, fontSize: 11.5, lineHeight: 15, color: colors.textSub },
  btnRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, alignItems: 'center' },
  scenario: { borderRadius: 10, borderWidth: 1, borderColor: 'rgba(255,198,77,.35)', backgroundColor: '#17130a', padding: 12, gap: 4 },
  scenarioName: { fontFamily: fonts.oswaldSemiBold, fontSize: 13, letterSpacing: 1.2, color: colors.amber },
  panel: { borderRadius: 12, borderWidth: 1, borderColor: '#26262c', backgroundColor: '#131316', padding: 12, gap: 8 },
  panelHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  panelEyebrow: { fontFamily: fonts.oswaldSemiBold, fontSize: 11.5, letterSpacing: 1, color: colors.amber, flexShrink: 1 },
  readout: { fontFamily: fonts.mono, fontSize: 11, color: colors.textSub },
  checkBtn: { borderRadius: 8, borderWidth: 1, borderColor: 'rgba(255,198,77,.55)', backgroundColor: '#1d1708', paddingHorizontal: 22, paddingVertical: 10 },
  checkBtnText: { fontFamily: fonts.oswaldSemiBold, fontSize: 13, letterSpacing: 1.2, color: colors.amber },
  result: { borderRadius: 10, borderWidth: 1, borderColor: '#3a3a42', backgroundColor: '#131316', padding: 12, gap: 4 },
  resultPass: { borderColor: 'rgba(55,224,95,.5)', backgroundColor: '#0c1a10' },
  resultHead: { fontFamily: fonts.oswaldSemiBold, fontSize: 12.5, letterSpacing: 0.8, color: colors.textSecondary },
  resultHeadPass: { color: colors.green },
});
