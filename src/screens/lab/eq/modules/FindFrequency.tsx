/**
 * FindFrequency — EQ Lab lesson 13 (owner spec 2026-08-07): the parametric
 * trainer. A synthetic program spectrum is deliberately altered; the student
 * hunts the problem with Frequency → Q → Gain and CHECKs:
 *
 *   Target: 630 Hz · Your selection: 670 Hz · Difference: +6.3%
 *
 * Five levels (spec): 1 find a large boost · 2 find a large cut · 3 find a
 * narrow resonance · 4 correct a tonal imbalance · 5 multiple problems.
 *
 * VISUAL TRAINER — the spectrum is synthetic and labeled as such; the by-ear
 * version arrives with the audio build (playback path). Match the dim
 * reference: your correction is perfect when the amber curve sits back on it.
 */
import { useCallback, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ResponseCurveGraph, eqResponseDb, type ResponseCurve } from '../../../../features/lab/fxViz';
import { DragSlider } from '../../foundations/bits';
import { MiniBtn } from './eqBits';
import { colors, fonts } from '../../../../theme/tokens';
import { baseSpectrumDb, bwOctFromQ, fFromNorm, fmtHz, gainColor, maxPosDb, normFromF } from './eqMath';
import type { EqModuleComponentProps } from './registry';

type Hidden = { f: number; g: number; q: number };
type UserBand = { f: number; g: number; q: number };

const LEVELS = [1, 2, 3, 4, 5] as const;
const LEVEL_BRIEF: Record<number, string> = {
  1: 'Something is BOOSTED. Find it and cut it back.',
  2: 'Something is CUT. Find the hole and fill it.',
  3: 'A NARROW resonance is ringing. Hunt it down.',
  4: 'The tonal balance is tilted. Correct the imbalance.',
  5: 'TWO problems this time. Fix both.',
};

const randF = (lo: number, hi: number) => lo * Math.pow(hi / lo, Math.random()); // log-uniform

function makeHidden(level: number): Hidden[] {
  switch (level) {
    case 1:
      return [{ f: randF(100, 8000), g: 9, q: 1 }];
    case 2:
      return [{ f: randF(100, 8000), g: -9, q: 1 }];
    case 3:
      return [{ f: randF(200, 6000), g: 8, q: 8 }];
    case 4:
      // Wide imbalance — a broad low or high tilt.
      return Math.random() < 0.5
        ? [{ f: randF(150, 400), g: 6, q: 0.5 }]
        : [{ f: randF(2500, 8000), g: 6, q: 0.5 }];
    default:
      return [
        { f: randF(80, 700), g: Math.random() < 0.5 ? 8 : -8, q: 1.4 },
        { f: randF(1200, 9000), g: Math.random() < 0.5 ? 8 : -8, q: 1.4 },
      ];
  }
}

const freshBands = (n: number): UserBand[] =>
  Array.from({ length: n }, (_, i) => ({ f: i === 0 ? 500 : 3000, g: 0, q: 1.4 }));

type Verdict = { lines: string[]; pass: boolean };

function judge(hidden: Hidden[], user: UserBand[]): Verdict {
  // Greedy nearest (log-distance) hidden→user pairing; each user band used once.
  const used = new Set<number>();
  const lines: string[] = [];
  let allPass = true;
  for (const h of hidden) {
    let best = -1;
    let bestD = Infinity;
    user.forEach((u, i) => {
      if (used.has(i)) return;
      const d = Math.abs(Math.log2(u.f / h.f));
      if (d < bestD) {
        bestD = d;
        best = i;
      }
    });
    if (best < 0) {
      lines.push(`Target ${fmtHz(h.f)}: no band applied.`);
      allPass = false;
      continue;
    }
    used.add(best);
    const u = user[best];
    const pctDiff = (u.f / h.f - 1) * 100;
    const freqOk = Math.abs(Math.log2(u.f / h.f)) <= 1 / 3;
    const gainOk = Math.abs(u.g + h.g) <= 3 && u.g * h.g < 0;
    lines.push(
      `Target: ${fmtHz(h.f)} · Your selection: ${fmtHz(u.f)} · Difference: ${pctDiff >= 0 ? '+' : ''}${pctDiff.toFixed(1)}%`,
    );
    lines.push(
      `  needed ${h.g > 0 ? '−' : '+'}${Math.abs(h.g).toFixed(0)} dB · you applied ${u.g >= 0 ? '+' : ''}${u.g.toFixed(1)} dB → ${
        freqOk && gainOk ? '✓ corrected' : !freqOk ? '✗ off-frequency' : '✗ wrong amount/direction'
      }`,
    );
    if (!(freqOk && gainOk)) allPass = false;
  }
  return { lines, pass: allPass };
}

export function FindFrequencyModule(_p: EqModuleComponentProps) {
  const [level, setLevel] = useState<number>(1);
  const [hidden, setHidden] = useState<Hidden[]>(() => makeHidden(1));
  const [bands, setBands] = useState<UserBand[]>(() => freshBands(1));
  const [selIdx, setSelIdx] = useState(0);
  const [verdict, setVerdict] = useState<Verdict | null>(null);

  const newRound = useCallback((lvl: number) => {
    setLevel(lvl);
    setHidden(makeHidden(lvl));
    setBands(freshBands(lvl === 5 ? 2 : 1));
    setSelIdx(0);
    setVerdict(null);
  }, []);

  const sel = bands[Math.min(selIdx, bands.length - 1)];
  const setSel = (patch: Partial<UserBand>) =>
    setBands((prev) => prev.map((b, i) => (i === selIdx ? { ...b, ...patch } : b)));

  const { curves, plotColor } = useMemo<{ curves: ResponseCurve[]; plotColor: string }>(() => {
    const userAt = (f: number) =>
      bands.reduce((s, b) => s + (b.g !== 0 ? eqResponseDb([{ type: 'peak', freq: b.f, q: b.q, gainDb: b.g }], f) : 0), 0);
    const hiddenAt = (f: number) =>
      hidden.reduce((s, h) => s + eqResponseDb([{ type: 'peak', freq: h.f, q: h.q, gainDb: h.g }], f), 0);
    return {
      curves: [
        { at: (f: number) => baseSpectrumDb(f), emphasis: 'ref' }, // healthy reference
        { at: (f: number) => baseSpectrumDb(f) + hiddenAt(f) + userAt(f), emphasis: 'main' },
      ],
      // MIDI plot colour (owner 2026-08-07): warms with the worst remaining
      // excess vs the reference; a corrected signal reads blue/cool.
      plotColor: gainColor(maxPosDb((f) => hiddenAt(f) + userAt(f)), 12),
    };
  }, [hidden, bands]);

  return (
    <View style={styles.root}>
      <Text style={styles.body}>
        Something is wrong with this signal. Match the amber spectrum back onto the dim reference
        using your parametric band{bands.length > 1 ? 's' : ''} — then CHECK.
      </Text>

      <View style={styles.btnRow}>
        {LEVELS.map((l) => (
          <MiniBtn key={l} label={`LEVEL ${l}`} active={level === l} onPress={() => newRound(l)} />
        ))}
      </View>
      <Text style={styles.brief}>{LEVEL_BRIEF[level]}</Text>

      <View style={styles.panel}>
        <View style={styles.panelHead}>
          <Text style={styles.panelEyebrow}>SIGNAL (amber) vs REFERENCE (dim)</Text>
          <Text style={styles.readout}>SYNTHETIC</Text>
        </View>
        <ResponseCurveGraph curves={curves} dbRange={24} height={150} mainColor={plotColor} />
        <Text style={styles.honest}>
          Visual trainer on a synthetic spectrum — the by-ear version arrives with the audio build.
        </Text>
      </View>

      {bands.length > 1 && (
        <View style={styles.btnRow}>
          {bands.map((_, i) => (
            <MiniBtn key={i} label={`BAND ${i + 1}`} active={selIdx === i} onPress={() => setSelIdx(i)} />
          ))}
        </View>
      )}

      <DragSlider label="FREQUENCY" value={normFromF(sel.f)} onChange={(t) => setSel({ f: fFromNorm(t) })} readout={fmtHz(sel.f)} />
      <DragSlider
        label="GAIN"
        value={(sel.g + 18) / 36}
        onChange={(t) => setSel({ g: Math.round((t * 36 - 18) * 2) / 2 })}
        readout={`${sel.g >= 0 ? '+' : ''}${sel.g.toFixed(1)} dB`}
        tint={gainColor(sel.g, 18)}
      />
      <DragSlider
        label="Q"
        value={Math.log(sel.q / 0.3) / Math.log(12 / 0.3)}
        onChange={(t) => setSel({ q: 0.3 * Math.pow(12 / 0.3, Math.max(0, Math.min(1, t))) })}
        readout={`Q ${sel.q.toFixed(2)} · ${bwOctFromQ(sel.q).toFixed(2)} oct`}
      />

      <View style={styles.btnRow}>
        <Pressable onPress={() => setVerdict(judge(hidden, bands))} style={styles.checkBtn} accessibilityRole="button" accessibilityLabel="Check">
          <Text style={styles.checkBtnText}>CHECK</Text>
        </Pressable>
        <MiniBtn label="TRY A NEW SIGNAL CHALLENGE" onPress={() => newRound(level)} />
      </View>

      {verdict && (
        <View style={[styles.result, verdict.pass ? styles.resultPass : styles.resultMiss]}>
          <Text style={[styles.resultHead, verdict.pass ? styles.resultHeadPass : null]}>
            {verdict.pass ? '✓ CORRECTED' : 'NOT YET — compare and adjust'}
          </Text>
          {verdict.lines.map((l, i) => (
            <Text key={i} style={styles.resultLine}>
              {l}
            </Text>
          ))}
          {verdict.pass && level < 5 ? (
            <Pressable onPress={() => newRound(level + 1)} accessibilityRole="button" accessibilityLabel="Next level">
              <Text style={styles.nextLink}>NEXT LEVEL ›</Text>
            </Pressable>
          ) : null}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: 12 },
  body: { fontFamily: fonts.barlowRegular, fontSize: 14, lineHeight: 20, color: colors.textSecondary },
  brief: { fontFamily: fonts.barlowMedium, fontSize: 13.5, color: colors.amber },
  btnRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, alignItems: 'center' },
  panel: { borderRadius: 12, borderWidth: 1, borderColor: '#26262c', backgroundColor: '#131316', padding: 12, gap: 8 },
  panelHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  panelEyebrow: { fontFamily: fonts.oswaldSemiBold, fontSize: 11.5, letterSpacing: 1, color: colors.amber, flexShrink: 1 },
  readout: { fontFamily: fonts.mono, fontSize: 11, color: colors.textSub },
  honest: { fontFamily: fonts.barlowRegular, fontSize: 11.5, lineHeight: 15, color: colors.textSub },
  checkBtn: { borderRadius: 8, borderWidth: 1, borderColor: 'rgba(255,198,77,.55)', backgroundColor: '#1d1708', paddingHorizontal: 22, paddingVertical: 10 },
  checkBtnText: { fontFamily: fonts.oswaldSemiBold, fontSize: 13, letterSpacing: 1.2, color: colors.amber },
  result: { borderRadius: 10, borderWidth: 1, padding: 12, gap: 4 },
  resultPass: { borderColor: 'rgba(55,224,95,.5)', backgroundColor: '#0c1a10' },
  resultMiss: { borderColor: '#3a3a42', backgroundColor: '#131316' },
  resultHead: { fontFamily: fonts.oswaldSemiBold, fontSize: 12.5, letterSpacing: 1, color: colors.textSecondary },
  resultHeadPass: { color: colors.green },
  resultLine: { fontFamily: fonts.mono, fontSize: 11.5, lineHeight: 17, color: colors.textSecondary },
  nextLink: { fontFamily: fonts.oswaldSemiBold, fontSize: 12.5, letterSpacing: 1, color: colors.amber, marginTop: 6 },
});
