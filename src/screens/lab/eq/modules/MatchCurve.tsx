/**
 * MatchCurve — EQ Lab lesson 14 (owner spec 2026-08-07): recreate the gray
 * TARGET response with your own EQ; scored on closeness. Tests frequency +
 * gain + Q understanding WITHOUT requiring hearing — deliberately the lab's
 * most accessible trainer (spec highlight).
 *
 * RACK UNIT (APE_LAB_UX_PROPOSAL 2026-08-23): this module renders the RackUnit
 * frame itself. The target+attempt plot PINS on the stage — the whole game is
 * watching your amber curve settle onto the dim target while a lane moves;
 * FREQ/GAIN/Q are dock faders (FREQ pre-bound: WHERE, then HOW MUCH, then HOW
 * WIDE); SCORE and NEW are keys. The MATCH score reads on the bezel — hidden
 * until you ask (the owner's check-yourself toggle, now a tap-to-reveal
 * readout window); BAND on the bezel switches bands on two-band targets.
 */
import { useCallback, useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { ResponseCurveGraph, eqResponseDb, type EqBandSpec, type ResponseCurve } from '../../../../features/lab/fxViz';
import { colors, fonts } from '../../../../theme/tokens';
import { bwOctFromQ, fFromNorm, fmtHz, gainColor, maxPosDb, normFromF } from './eqMath';
import { RackUnit } from '../../rack/RackUnit';
import type { BezelItem, DockParam } from '../../rack/rackTypes';
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

/** 0–100 match score, normalized by the FLAT-response error (fix 2026-08-31):
 *  the old mean-|error|×12 barely registered a narrow or small target, so a
 *  completely flat EQ scored 95% "EXCELLENT" on a narrow notch — the trainer
 *  rewarded doing nothing. Now: doing nothing = 0, halving the error = 50,
 *  perfect = 100. Same 90/75 verdict thresholds. */
function scoreMatch(target: EqBandSpec[], user: UserBand[]): number {
  let errUser = 0;
  let errFlat = 0;
  const N = 96;
  for (let i = 0; i <= N; i++) {
    const f = 20 * Math.pow(1000, i / N);
    const t = eqResponseDb(target, f);
    const u = user.reduce(
      (s, b) => s + (b.g !== 0 ? eqResponseDb([{ type: 'peak', freq: b.f, q: b.q, gainDb: b.g }], f) : 0),
      0,
    );
    errUser += Math.abs(t - u);
    errFlat += Math.abs(t);
  }
  if (errFlat < 1e-6) return 100; // degenerate flat target
  return Math.max(0, Math.min(100, Math.round(100 * (1 - errUser / errFlat))));
}

export function MatchCurveModule(_p: EqModuleComponentProps) {
  const [target, setTarget] = useState<EqBandSpec[]>(() => makeTarget());
  // Match the FIRST target's band count too (QA night 2026-09-01: a 2-band
  // first roll left one user band and no switcher — unwinnable by design).
  const [bands, setBands] = useState<UserBand[]>(() => freshBands(target.length));
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

  // MIDI plot colour: warms with the user's biggest boost (owner 2026-08-07).
  const plotColor = gainColor(
    maxPosDb((f) =>
      bands.reduce(
        (s, b) => s + (b.g !== 0 ? eqResponseDb([{ type: 'peak', freq: b.f, q: b.q, gainDb: b.g }], f) : 0),
        0,
      ),
    ),
    15,
  );

  const live = scoreMatch(target, bands);
  const verdict =
    live >= 90 ? 'EXCELLENT — that is the curve.' : live >= 75 ? 'CLOSE — refine width and center.' : 'KEEP TRYING — start with WHERE, then HOW MUCH, then HOW WIDE.';

  const params: DockParam[] = [
    {
      kind: 'fader',
      id: 'freq',
      label: 'FREQ',
      value: normFromF(sel.f),
      onChange: (t) => setSel({ f: fFromNorm(t) }),
      format: () => fmtHz(sel.f),
    },
    {
      kind: 'fader',
      id: 'gain',
      label: 'GAIN',
      level: true,
      value: (sel.g + 15) / 30,
      onChange: (t) => setSel({ g: Math.round((t * 30 - 15) * 2) / 2 }),
      format: () => `${sel.g >= 0 ? '+' : ''}${sel.g.toFixed(1)} dB`,
      formatShort: () => `${sel.g >= 0 ? '+' : ''}${sel.g.toFixed(1)}`,
      tint: gainColor(sel.g, 15),
    },
    {
      kind: 'fader',
      id: 'q',
      label: 'Q',
      value: Math.log(sel.q / 0.3) / Math.log(12 / 0.3),
      onChange: (t) => setSel({ q: 0.3 * Math.pow(12 / 0.3, Math.max(0, Math.min(1, t))) }),
      format: () => `Q ${sel.q.toFixed(2)} · ${bwOctFromQ(sel.q).toFixed(2)} oct`,
      formatShort: () => `Q${sel.q.toFixed(1)}`,
    },
    { kind: 'action', id: 'score', label: showScore ? 'HIDE' : 'SCORE', onPress: () => setShowScore((v) => !v) },
    { kind: 'action', id: 'new', label: 'NEW', onPress: newTarget },
  ];

  const bezel: BezelItem[] = [
    // The check-yourself toggle: tap the MATCH window to reveal/hide the score.
    {
      k: 'MATCH',
      v: showScore ? `${live}%` : 'HIDDEN',
      tint: showScore ? (live >= 90 ? colors.green : undefined) : '#7a7f8a',
      onPress: () => setShowScore((v) => !v),
    },
    { k: 'BANDS', v: String(target.length) },
    ...(bands.length > 1
      ? [
          {
            k: 'BAND',
            v: `${Math.min(selIdx, bands.length - 1) + 1}/${bands.length}`,
            onPress: () => setSelIdx((i) => (i + 1) % bands.length),
          },
        ]
      : []),
  ];

  return (
    <RackUnit
      initialParam="freq"
      params={params}
      stage={{
        size: 'L',
        // Legend, verbatim from the pre-rack panel head.
        badge: 'TARGET (dim) vs YOUR EQ (amber)',
        bezel,
        render: (w, h) => (
          <View style={{ width: w, height: h, alignItems: 'center', justifyContent: 'center' }}>
            <ResponseCurveGraph curves={curves} dbRange={15} height={Math.max(80, h - 18)} mainColor={plotColor} />
          </View>
        ),
      }}
    >
      <View style={styles.well}>
        <Text style={styles.body}>
          Recreate the dim TARGET curve with your band{bands.length > 1 ? 's' : ''}. No hearing
          required — this is pure understanding of frequency, gain and Q.
          {bands.length > 1 ? ' Tap the BAND window on the bezel to switch bands.' : ''}
        </Text>
        <Text style={styles.honest}>
          Target uses {target.length} hidden band{target.length > 1 ? 's' : ''} — you have the same
          number. Judge the match by eye first; SCORE when you’re ready.
        </Text>

        {showScore && (
          <View style={[styles.result, live >= 90 ? styles.resultPass : null]}>
            <Text style={[styles.resultHead, live >= 90 ? styles.resultHeadPass : null]}>
              ACCURACY {live}% — {verdict}
            </Text>
          </View>
        )}
      </View>
    </RackUnit>
  );
}

const styles = StyleSheet.create({
  well: { gap: 12 },
  body: { fontFamily: fonts.barlowRegular, fontSize: 14, lineHeight: 20, color: colors.textSecondary },
  honest: { fontFamily: fonts.barlowRegular, fontSize: 11.5, lineHeight: 15, color: colors.textSub },
  result: { borderRadius: 10, borderWidth: 1, borderColor: '#3a3a42', backgroundColor: '#131316', padding: 12 },
  resultPass: { borderColor: 'rgba(55,224,95,.5)', backgroundColor: '#0c1a10' },
  resultHead: { fontFamily: fonts.oswaldSemiBold, fontSize: 12.5, letterSpacing: 0.8, color: colors.textSecondary },
  resultHeadPass: { color: colors.green },
});
