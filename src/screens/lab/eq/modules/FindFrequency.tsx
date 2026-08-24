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
 * RACK UNIT (APE_LAB_UX_PROPOSAL 2026-08-23): this module renders the RackUnit
 * frame itself. The signal-vs-reference plot PINS on the stage (the hunt IS
 * watching the amber curve settle onto the reference while you ride a lane);
 * FREQ/GAIN/Q are dock faders (FREQ pre-bound — the hunt starts with WHERE);
 * LEVEL is an options tray with NEW SIGNAL as its in-tray reset; CHECK is a
 * key. Game state reads on the bezel (LVL · BAND — tap to switch at level 5 ·
 * RESULT). The brief, audition bar and the verdict lines live in the well.
 *
 * VISUAL + BY-EAR TRAINER — the spectrum is synthetic and labeled as such; on
 * builds with the FX engine, EqAuditionBar plays the hidden coloration live. Match the dim
 * reference: your correction is perfect when the amber curve sits back on it.
 */
import { useCallback, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ResponseCurveGraph, eqResponseDb, type EqBandSpec, type ResponseCurve } from '../../../../features/lab/fxViz';
import { EqAuditionBar, eqAuditionAvailable } from './eqAudition';
import { colors, fonts } from '../../../../theme/tokens';
import { baseSpectrumDb, bwOctFromQ, fFromNorm, fmtHz, gainColor, maxPosDb, normFromF } from './eqMath';
import { RackUnit } from '../../rack/RackUnit';
import type { BezelItem, DockParam } from '../../rack/rackTypes';
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

  // What the audition plays: the HIDDEN coloration plus the user's correction
  // bands — all peaks, exactly the curve the plot shows (owner 2026-08-10).
  const auditionBands = useMemo<EqBandSpec[]>(
    () => [
      ...hidden.map((h) => ({ type: 'peak' as const, freq: h.f, q: h.q, gainDb: h.g })),
      ...bands.filter((b) => b.g !== 0).map((b) => ({ type: 'peak' as const, freq: b.f, q: b.q, gainDb: b.g })),
    ],
    [hidden, bands],
  );

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
      value: (sel.g + 18) / 36,
      onChange: (t) => setSel({ g: Math.round((t * 36 - 18) * 2) / 2 }),
      format: () => `${sel.g >= 0 ? '+' : ''}${sel.g.toFixed(1)} dB`,
      formatShort: () => `${sel.g >= 0 ? '+' : ''}${sel.g.toFixed(1)}`,
      tint: gainColor(sel.g, 18),
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
    {
      kind: 'options',
      id: 'level',
      label: 'LEVEL',
      valueLabel: `L${level}`,
      options: LEVELS.map((l) => ({ id: String(l), label: `LEVEL ${l}` })),
      selectedId: String(level),
      onSelect: (id) => newRound(Number(id)),
      // "Try a new signal" = the round reset, in-container (reset-in-container rule).
      onReset: { label: 'NEW SIGNAL', onPress: () => newRound(level) },
    },
    { kind: 'action', id: 'check', label: 'CHECK', onPress: () => setVerdict(judge(hidden, bands)) },
  ];

  const bezel: BezelItem[] = [
    { k: 'LVL', v: String(level) },
    // Level 5 gives two bands — the BAND window is the switcher (tap cycles).
    ...(bands.length > 1
      ? [
          {
            k: 'BAND',
            v: `${Math.min(selIdx, bands.length - 1) + 1}/${bands.length}`,
            onPress: () => setSelIdx((i) => (i + 1) % bands.length),
          },
        ]
      : []),
    {
      k: 'RESULT',
      v: verdict ? (verdict.pass ? 'PASS' : 'MISS') : '—',
      tint: verdict ? (verdict.pass ? colors.green : '#ff8a5e') : '#7a7f8a',
    },
  ];

  return (
    <RackUnit
      initialParam="freq"
      params={params}
      stage={{
        size: 'L',
        // Legend + honesty, verbatim from the pre-rack panel head.
        badge: 'SIGNAL (amber) vs REFERENCE (dim) · SYNTHETIC',
        bezel,
        render: (w, h) => (
          <View style={{ width: w, height: h, alignItems: 'center', justifyContent: 'center' }}>
            <ResponseCurveGraph curves={curves} dbRange={24} height={Math.max(80, h - 18)} mainColor={plotColor} />
          </View>
        ),
      }}
    >
      <View style={styles.well}>
        <Text style={styles.brief}>{LEVEL_BRIEF[level]}</Text>
        <Text style={styles.body}>
          Something is wrong with this signal. Ride the FREQ / GAIN / Q lanes to match the amber
          spectrum back onto the dim reference — then CHECK.
          {bands.length > 1 ? ' Tap the BAND window on the bezel to switch bands.' : ''}
        </Text>

        {eqAuditionAvailable() ? (
          // BY-EAR mode (owner 2026-08-10): the hidden coloration + your
          // correction bands run live on the native EQ — hunt it with your
          // ears, not just the plot. Correct it and the coloration disappears.
          <EqAuditionBar bands={auditionBands} />
        ) : (
          <Text style={styles.honest}>
            Visual trainer on a synthetic spectrum — train your eyes here, no audio playback.
          </Text>
        )}

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
    </RackUnit>
  );
}

const styles = StyleSheet.create({
  well: { gap: 12 },
  body: { fontFamily: fonts.barlowRegular, fontSize: 14, lineHeight: 20, color: colors.textSecondary },
  brief: { fontFamily: fonts.barlowMedium, fontSize: 13.5, color: colors.amber },
  honest: { fontFamily: fonts.barlowRegular, fontSize: 11.5, lineHeight: 15, color: colors.textSub },
  result: { borderRadius: 10, borderWidth: 1, padding: 12, gap: 4 },
  resultPass: { borderColor: 'rgba(55,224,95,.5)', backgroundColor: '#0c1a10' },
  resultMiss: { borderColor: '#3a3a42', backgroundColor: '#131316' },
  resultHead: { fontFamily: fonts.oswaldSemiBold, fontSize: 12.5, letterSpacing: 1, color: colors.textSecondary },
  resultHeadPass: { color: colors.green },
  resultLine: { fontFamily: fonts.mono, fontSize: 11.5, lineHeight: 17, color: colors.textSecondary },
  nextLink: { fontFamily: fonts.oswaldSemiBold, fontSize: 12.5, letterSpacing: 1, color: colors.amber, marginTop: 6 },
});
