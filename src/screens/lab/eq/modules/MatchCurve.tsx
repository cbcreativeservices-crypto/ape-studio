/**
 * MatchCurve — EQ Lab lesson 14 (owner spec 2026-08-07): recreate the gray
 * TARGET response with your own EQ; scored on closeness. Tests frequency +
 * gain + Q understanding WITHOUT requiring hearing — deliberately the lab's
 * most accessible trainer (spec highlight).
 */
import { useCallback, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ResponseCurveGraph, eqResponseDb, type EqBandSpec, type ResponseCurve } from '../../../../features/lab/fxViz';
import { DragSlider } from '../../foundations/bits';
import { MiniBtn } from './eqBits';
import { colors, fonts } from '../../../../theme/tokens';
import { bwOctFromQ, fFromNorm, fmtHz, gainColor, maxPosDb, normFromF } from './eqMath';
import type { EqModuleComponentProps } from './registry';

type UserBand = { f: number; g: number; q: number };

const randF = (lo: number, hi: number) => lo * Math.pow(hi / lo, Math.random());
const pick = <T,>(a: T[]): T => a[Math.floor(Math.random() * a.length)];

/** A target = 1–2 hidden bells; the student gets the same band count. */
function makeTarget(): EqBandSpec[] {
  const two = Math.random() < 0.5;
  const one: EqBandSpec = {
    type: 'peak',
    freq: randF(80, 8000),
    q: pick([0.7, 1, 2, 4]),
    gainDb: pick([-10, -8, -6, 6, 8, 10]),
  };
  if (!two) return [one];
  return [
    one,
    {
      type: 'peak',
      freq: randF(80, 8000),
      q: pick([0.7, 1, 2, 4]),
      gainDb: pick([-10, -8, -6, 6, 8, 10]),
    },
  ];
}

const freshBands = (n: number): UserBand[] =>
  Array.from({ length: n }, (_, i) => ({ f: i === 0 ? 300 : 3000, g: 0, q: 1 }));

/** 0–100 match score: mean |target − user| over 96 log-spaced points. */
function scoreMatch(target: EqBandSpec[], user: UserBand[]): number {
  let err = 0;
  const N = 96;
  for (let i = 0; i <= N; i++) {
    const f = 20 * Math.pow(1000, i / N);
    const t = eqResponseDb(target, f);
    const u = user.reduce(
      (s, b) => s + (b.g !== 0 ? eqResponseDb([{ type: 'peak', freq: b.f, q: b.q, gainDb: b.g }], f) : 0),
      0,
    );
    err += Math.abs(t - u);
  }
  return Math.max(0, Math.round(100 - (err / (N + 1)) * 12));
}

export function MatchCurveModule(_p: EqModuleComponentProps) {
  const [target, setTarget] = useState<EqBandSpec[]>(() => makeTarget());
  const [bands, setBands] = useState<UserBand[]>(() => freshBands(1));
  const [selIdx, setSelIdx] = useState(0);
  // The score is a check-yourself TOGGLE (owner 2026-08-07): hidden until you
  // ask, so you judge the match by eye first.
  const [showScore, setShowScore] = useState(false);

  const newTarget = useCallback(() => {
    const t = makeTarget();
    setTarget(t);
    setBands(freshBands(t.length));
    setSelIdx(0);
    setShowScore(false);
  }, []);

  const sel = bands[Math.min(selIdx, bands.length - 1)];
  const setSel = (patch: Partial<UserBand>) =>
    setBands((prev) => prev.map((b, i) => (i === selIdx ? { ...b, ...patch } : b)));

  const curves = useMemo<ResponseCurve[]>(
    () => [
      { at: (f: number) => eqResponseDb(target, f), emphasis: 'ref' }, // the gray target
      {
        at: (f: number) =>
          bands.reduce(
            (s, b) => s + (b.g !== 0 ? eqResponseDb([{ type: 'peak', freq: b.f, q: b.q, gainDb: b.g }], f) : 0),
            0,
          ),
        emphasis: 'main',
      },
    ],
    [target, bands],
  );

  const live = scoreMatch(target, bands);
  const verdict =
    live >= 90 ? 'EXCELLENT — that is the curve.' : live >= 75 ? 'CLOSE — refine width and center.' : 'KEEP TRYING — start with WHERE, then HOW MUCH, then HOW WIDE.';

  return (
    <View style={styles.root}>
      <Text style={styles.body}>
        Recreate the dim TARGET curve with your band{bands.length > 1 ? 's' : ''}. No hearing
        required — this is pure understanding of frequency, gain and Q.
      </Text>

      <View style={styles.panel}>
        <View style={styles.panelHead}>
          <Text style={styles.panelEyebrow}>TARGET (dim) vs YOUR EQ (amber)</Text>
          <Text style={styles.readout}>{showScore ? `MATCH ${live}%` : 'MATCH · hidden'}</Text>
        </View>
        <ResponseCurveGraph
          curves={curves}
          dbRange={15}
          height={150}
          // MIDI plot colour: warms with the user's biggest boost (owner 2026-08-07).
          mainColor={gainColor(
            maxPosDb((f) =>
              bands.reduce(
                (s, b) => s + (b.g !== 0 ? eqResponseDb([{ type: 'peak', freq: b.f, q: b.q, gainDb: b.g }], f) : 0),
                0,
              ),
            ),
            15,
          )}
        />
        <Text style={styles.honest}>
          Target uses {target.length} hidden band{target.length > 1 ? 's' : ''} — you have the same
          number.
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
        value={(sel.g + 15) / 30}
        onChange={(t) => setSel({ g: Math.round((t * 30 - 15) * 2) / 2 })}
        readout={`${sel.g >= 0 ? '+' : ''}${sel.g.toFixed(1)} dB`}
        tint={gainColor(sel.g, 15)}
      />
      <DragSlider
        label="Q"
        value={Math.log(sel.q / 0.3) / Math.log(12 / 0.3)}
        onChange={(t) => setSel({ q: 0.3 * Math.pow(12 / 0.3, Math.max(0, Math.min(1, t))) })}
        readout={`Q ${sel.q.toFixed(2)} · ${bwOctFromQ(sel.q).toFixed(2)} oct`}
      />

      <View style={styles.btnRow}>
        <Pressable
          onPress={() => setShowScore((v) => !v)}
          style={styles.checkBtn}
          accessibilityRole="button"
          accessibilityLabel={showScore ? 'Hide accuracy' : 'Check your accuracy'}
        >
          <Text style={styles.checkBtnText}>{showScore ? 'HIDE ACCURACY' : 'CHECK YOUR ACCURACY'}</Text>
        </Pressable>
        <MiniBtn label="NEW TARGET" onPress={newTarget} />
      </View>

      {showScore && (
        <View style={[styles.result, live >= 90 ? styles.resultPass : null]}>
          <Text style={[styles.resultHead, live >= 90 ? styles.resultHeadPass : null]}>
            ACCURACY {live}% — {verdict}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: 12 },
  body: { fontFamily: fonts.barlowRegular, fontSize: 14, lineHeight: 20, color: colors.textSecondary },
  btnRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, alignItems: 'center' },
  panel: { borderRadius: 12, borderWidth: 1, borderColor: '#26262c', backgroundColor: '#131316', padding: 12, gap: 8 },
  panelHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  panelEyebrow: { fontFamily: fonts.oswaldSemiBold, fontSize: 11.5, letterSpacing: 1, color: colors.amber, flexShrink: 1 },
  readout: { fontFamily: fonts.mono, fontSize: 12, color: colors.amber },
  honest: { fontFamily: fonts.barlowRegular, fontSize: 11.5, lineHeight: 15, color: colors.textSub },
  checkBtn: { borderRadius: 8, borderWidth: 1, borderColor: 'rgba(255,198,77,.55)', backgroundColor: '#1d1708', paddingHorizontal: 22, paddingVertical: 10 },
  checkBtnText: { fontFamily: fonts.oswaldSemiBold, fontSize: 13, letterSpacing: 1.2, color: colors.amber },
  result: { borderRadius: 10, borderWidth: 1, borderColor: '#3a3a42', backgroundColor: '#131316', padding: 12 },
  resultPass: { borderColor: 'rgba(55,224,95,.5)', backgroundColor: '#0c1a10' },
  resultHead: { fontFamily: fonts.oswaldSemiBold, fontSize: 12.5, letterSpacing: 0.8, color: colors.textSecondary },
  resultHeadPass: { color: colors.green },
});
