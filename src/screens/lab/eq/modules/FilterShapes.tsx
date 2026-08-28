/**
 * FilterShapes — EQ Lab lesson 7 (owner spec 2026-08-07): the six shapes, one
 * at a time, MANIPULATED rather than read about — Bell/Peak · Low Shelf ·
 * High Shelf · High-Pass/Low-Cut · Low-Pass/High-Cut · Notch. Every curve is
 * the real filter response (fxViz RBJ mirrors; notch via eqMath's cookbook
 * coefficients).
 *
 * RACK UNIT (APE_LAB_UX_PROPOSAL 2026-08-23): this module renders the RackUnit
 * frame itself (EqModuleScreen gives rack modules the full height, no host
 * ScrollView). The response curve PINS on the stage with the 12 dB/oct honesty
 * line as its badge (HPF/LPF only, as before); SHAPE/FREQ/GAIN/Q state reads
 * on the bezel ("—" = the control doesn't apply to this shape). The dock
 * carries only the faders the shape really has (FREQ always; GAIN for bell +
 * shelves; Q for bell + notch) plus a STICKY SHAPE tray — A/B-ing the six
 * shapes while the glass reacts is the lesson. The per-shape teaching line
 * scrolls in the well.
 */
import { useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { ResponseCurveGraph, eqResponseDb, type ResponseCurve } from '../../../../features/lab/fxViz';
import { CheckQuestion, type CheckSpec } from '../../foundations/bits';
import { colors, fonts } from '../../../../theme/tokens';
import { RackUnit } from '../../rack/RackUnit';
import type { DockParam } from '../../rack/rackTypes';
import { biquadMagDb, fFromNorm, fmtHz, gainColor, normFromF, rbjNotch } from './eqMath';
import { GlossaryText } from '../../../../features/glossary/glossaryLink';
import type { EqModuleComponentProps } from './registry';

type ShapeKey = 'bell' | 'lowShelf' | 'highShelf' | 'highPass' | 'lowPass' | 'notch';

const SHAPES: { key: ShapeKey; label: string; teach: string }[] = [
  { key: 'bell', label: 'BELL / PEAK', teach: 'Raises or lowers a REGION around its center frequency — the everyday parametric shape.' },
  { key: 'lowShelf', label: 'LOW SHELF', teach: 'Raises or lowers EVERYTHING below its corner frequency by a fixed amount — a shelf, not a bump.' },
  { key: 'highShelf', label: 'HIGH SHELF', teach: 'Raises or lowers EVERYTHING above its corner frequency — the classic “air” or “dullness” control.' },
  { key: 'highPass', label: 'HIGH-PASS / LOW-CUT', teach: 'PASSES the highs, removes energy below the cutoff. Two names, one filter — “low-cut” describes what it removes.' },
  { key: 'lowPass', label: 'LOW-PASS / HIGH-CUT', teach: 'PASSES the lows, removes energy above the cutoff — the mirror of the high-pass.' },
  { key: 'notch', label: 'NOTCH', teach: 'A deep, narrow null AT one frequency with the rest untouched — for surgically removing a single problem (hum, ring, feedback).' },
];

/** Compact shape names for the dock button + bezel (≤7 mono chars). */
const SHAPE_SHORT: Record<ShapeKey, string> = {
  bell: 'BELL',
  lowShelf: 'L-SHELF',
  highShelf: 'H-SHELF',
  highPass: 'HPF',
  lowPass: 'LPF',
  notch: 'NOTCH',
};

const CHECK: CheckSpec = {
  question: 'Which filter leaves everything ABOVE its frequency alone and removes energy BELOW it?',
  options: ['High-pass (low-cut)', 'Low-pass (high-cut)', 'Low shelf'],
  correctIdx: 0,
  reveal:
    'A HIGH-PASS filter PASSES the highs and CUTS the lows — the same device a console labels “low-cut”. The two names describe the same filter from opposite ends.',
  wrongHint: 'Name the filter by what it PASSES, not what it removes.',
};

export function FilterShapesModule(_p: EqModuleComponentProps) {
  const [shape, setShape] = useState<ShapeKey>('bell');
  const [freq, setFreq] = useState(1000);
  const [gainDb, setGainDb] = useState(6);
  const [q, setQ] = useState(2);

  const meta = SHAPES.find((s) => s.key === shape)!;
  const hasGain = shape === 'bell' || shape === 'lowShelf' || shape === 'highShelf';
  const hasQ = shape === 'bell' || shape === 'notch';
  // MIDI level colour (owner 2026-08-07): a boost warms; a cut, notch, or a
  // pure high/low-pass (all attenuation) stays blue.
  const gc = hasGain ? gainColor(gainDb, 18) : gainColor(0);

  const curves = useMemo<ResponseCurve[]>(() => {
    const at =
      shape === 'notch'
        ? (f: number) => biquadMagDb(rbjNotch(freq, Math.max(1, q)), f)
        : shape === 'bell'
          ? (f: number) => eqResponseDb([{ type: 'peak', freq, q, gainDb }], f)
          : shape === 'lowShelf' || shape === 'highShelf'
            ? (f: number) => eqResponseDb([{ type: shape, freq, q: 0.707, gainDb }], f)
            : (f: number) => eqResponseDb([{ type: shape, freq, q: 0.707, gainDb: 0 }], f);
    return [{ at, emphasis: 'main' }];
  }, [shape, freq, gainDb, q]);

  // Only the controls this shape really has reach the dock (the two-names
  // lesson keeps its vocabulary: the frequency lane is CUTOFF on a pass
  // filter, NOTCH on a notch). RackUnit re-binds the lane if a fader vanishes.
  const params: DockParam[] = [
    {
      kind: 'fader',
      id: 'freq',
      label: shape === 'highPass' || shape === 'lowPass' ? 'CUTOFF' : shape === 'notch' ? 'NOTCH' : 'FREQ',
      value: normFromF(freq),
      onChange: (t) => setFreq(fFromNorm(t)),
      format: () => fmtHz(freq),
    },
  ];
  if (hasGain) {
    params.push({
      kind: 'fader',
      id: 'gain',
      label: 'GAIN',
      value: (gainDb + 18) / 36,
      onChange: (t) => setGainDb(Math.round((t * 36 - 18) * 2) / 2),
      format: () => `${gainDb >= 0 ? '+' : ''}${gainDb.toFixed(1)} dB`,
      formatShort: () => `${gainDb >= 0 ? '+' : ''}${gainDb.toFixed(1)}`,
      tint: gc,
    });
  }
  if (hasQ) {
    params.push({
      kind: 'fader',
      id: 'q',
      label: 'Q',
      value: Math.log(q / 0.3) / Math.log(12 / 0.3),
      onChange: (t) => setQ(0.3 * Math.pow(12 / 0.3, Math.max(0, Math.min(1, t)))),
      format: () => `Q ${q.toFixed(1)}`,
    });
  }
  params.push({
    kind: 'options',
    id: 'shape',
    label: 'SHAPE',
    valueLabel: SHAPE_SHORT[shape],
    // Each shape's teach line doubles as its tray blurb (owner 2026-08-28).
    options: SHAPES.map((s) => ({ id: s.key, label: s.label, blurb: s.teach })),
    selectedId: shape,
    // Sticky: A/B-ing the six shapes while the curve reacts IS the lesson.
    sticky: true,
    onSelect: (id) => setShape(id as ShapeKey),
  });

  return (
    <RackUnit
      initialParam="freq"
      params={params}
      stage={{
        size: 'M', // response-curve teaching chart
        badge:
          shape === 'highPass' || shape === 'lowPass'
            ? 'Drawn at 12 dB/octave — slopes get their own lesson next.'
            : undefined,
        bezel: [
          { k: 'SHAPE', v: SHAPE_SHORT[shape] },
          { k: 'FREQ', v: fmtHz(freq) },
          {
            k: 'GAIN',
            v: hasGain ? `${gainDb >= 0 ? '+' : ''}${gainDb.toFixed(1)} dB` : '—',
            tint: hasGain ? gc : '#7a7f8a',
          },
          { k: 'Q', v: hasQ ? q.toFixed(1) : '—', tint: hasQ ? undefined : '#7a7f8a' },
        ],
        render: (w, h) => (
          <View style={{ width: w, height: h, justifyContent: 'center', paddingHorizontal: 8 }}>
            <ResponseCurveGraph curves={curves} dbRange={18} height={Math.max(80, h - 26)} mainColor={gc} />
          </View>
        ),
      }}
    >
      <View style={styles.well}>
        <GlossaryText style={styles.body}>
          EQ isn’t one shape — it’s a small family. Pick each one and move it: the differences teach
          themselves.
        </GlossaryText>

        {/* The selected shape's teaching line follows the SHAPE tray pick. */}
        <View style={styles.teachCard}>
          <Text style={styles.teachHead}>{meta.label}</Text>
          <Text style={styles.teach}>{meta.teach}</Text>
        </View>

        <CheckQuestion spec={CHECK} />
      </View>
    </RackUnit>
  );
}

const styles = StyleSheet.create({
  well: { gap: 12 },
  body: { fontFamily: fonts.barlowRegular, fontSize: 14, lineHeight: 20, color: colors.textSecondary },
  teachCard: { borderRadius: 10, borderWidth: 1, borderColor: '#26262c', backgroundColor: '#131316', padding: 12, gap: 4 },
  teachHead: { fontFamily: fonts.oswaldSemiBold, fontSize: 12, letterSpacing: 1.2, color: colors.amber },
  teach: { fontFamily: fonts.barlowRegular, fontSize: 13, lineHeight: 18, color: colors.textSecondary },
});
