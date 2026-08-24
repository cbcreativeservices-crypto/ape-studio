/**
 * GraphicTruth — EQ Lab lesson 11 (owner spec 2026-08-07): "What a Graphic EQ
 * Is REALLY Doing" — THE SLIDERS ARE NOT THE RESPONSE.
 *
 * Two curves over one 10-band board: the smooth SLIDER CURVE a beginner reads
 * by connecting the knobs, and the ACTUAL combined response of the real
 * overlapping filters. FILTERS (dock key) reveals every band's own bell under
 * the composite ("that's the revelation"); MAGNITUDE | PHASE shows that a
 * conventional minimum-phase EQ shifts phase around the regions it touches.
 *
 * RACK UNIT (APE_LAB_UX_PROPOSAL 2026-08-23): renders the RackUnit frame
 * itself. Curve + FADER BANK share the PINNED STAGE — the bank is a spatial
 * editor and the stage lives outside any ScrollView, which structurally ends
 * the fader-vs-scroll race (corrections-audit #8). The per-view honesty line
 * is the badge (dynamic); the fader under your finger reads on the bezel; the
 * dock carries VIEW (sticky tray), the FILTERS toggle, EXAMPLE and CLEAR.
 *
 * Technical framing (owner ruling): filters INTERACT because they overlap and
 * each introduces frequency-dependent phase shift — NEVER framed as "adjacent
 * bands cause phase cancellation."
 */
import { useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { ResponseCurveGraph, rbjPeaking, type ResponseCurve } from '../../../../features/lab/fxViz';
import { CheckQuestion, type CheckSpec } from '../../foundations/bits';
import { GraphicBoard } from './eqBits';
import { colors, fonts } from '../../../../theme/tokens';
import { RackUnit } from '../../rack/RackUnit';
import type { DockParam } from '../../rack/rackTypes';
import {
  biquadMagDb,
  fmtHz,
  gainColor,
  graphicActualDb,
  graphicPhaseDeg,
  OCT_CENTERS,
  Q_1OCT,
  sliderCurveDb,
} from './eqMath';
import { GlossaryText } from '../../../../features/glossary/glossaryLink';
import type { EqModuleComponentProps } from './registry';

// Board block on the stage: 108 track + gap + fader labels (eqBits geometry).
const BOARD_BLOCK_H = 126;

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
  // Which fader the finger is on — its value reads on the BEZEL while you drag
  // (owner 2026-08-07: you couldn't see you were at +6 dB while touching it).
  const [activeIdx, setActiveIdx] = useState<number | null>(null);

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
            // Each band in its OWN MIDI colour (owner 2026-08-07) — you can see
            // at a glance which filters are boosting and by how much.
            color: gainColor(g, 12),
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

  const params: DockParam[] = [
    {
      kind: 'options',
      id: 'view',
      label: 'VIEW',
      valueLabel: view === 'mag' ? 'MAG' : 'PHASE',
      options: [
        { id: 'mag', label: 'MAGNITUDE' },
        { id: 'phase', label: 'PHASE' },
      ],
      selectedId: view,
      onSelect: (id) => setView(id as 'mag' | 'phase'),
      sticky: true, // flip views while the same board holds
    },
    { kind: 'toggle', id: 'indiv', label: 'FILTERS', value: showIndividual, onToggle: () => setShowIndividual((v) => !v) },
    { kind: 'action', id: 'preset', label: 'EXAMPLE', onPress: preset },
    { kind: 'action', id: 'clear', label: 'CLEAR', onPress: reset },
  ];

  return (
    <RackUnit
      initialParam="view"
      params={params}
      stage={{
        size: 'L', // curve + board — the revelation is the display
        // Per-view honesty line (verbatim, dynamic).
        badge:
          view === 'mag'
            ? 'Real overlapping 1-octave bells, energy-combined — not the line through the caps.'
            : 'Conventional minimum-phase EQ shifts phase around every region it touches — it never changes “only amplitude.”',
        bezel: [
          { k: 'VIEW', v: view === 'mag' ? 'MAG' : 'PHASE ±180°' },
          { k: 'FILTERS', v: showIndividual ? 'SHOWN' : 'HIDDEN' },
          // The fader under your finger — live, never hidden by the hand.
          { k: 'BAND', v: activeIdx != null ? fmtHz(OCT_CENTERS[activeIdx]) : '—' },
          {
            k: 'LEVEL',
            v:
              activeIdx != null
                ? `${gains[activeIdx] >= 0 ? '+' : ''}${gains[activeIdx].toFixed(1)} dB`
                : '—',
            tint: activeIdx != null ? gainColor(gains[activeIdx], 12) : undefined,
          },
        ],
        render: (w, h) => {
          const curveH = Math.max(60, h - BOARD_BLOCK_H - 14 - 12);
          return (
            <View style={{ width: w, height: h, paddingHorizontal: 8, paddingTop: 6, gap: 4 }}>
              {view === 'mag' ? (
                // MIDI level colour (owner 2026-08-07): the actual response warms
                // with the biggest boost on the board; an all-cut board reads blue.
                <ResponseCurveGraph
                  curves={magCurves}
                  dbRange={12}
                  height={curveH}
                  mainColor={gainColor(Math.max(0, ...gains), 12)}
                />
              ) : (
                <ResponseCurveGraph curves={phaseCurves} dbRange={180} height={curveH} />
              )}
              <GraphicBoard
                centers={OCT_CENTERS}
                gains={gains}
                onGain={setGain}
                onActiveIndex={setActiveIdx}
                tintFor={(i) => gainColor(gains[i], 12)}
              />
            </View>
          );
        },
      }}
    >
      <View style={styles.well}>
        <View style={styles.banner}>
          <Text style={styles.bannerText}>THE SLIDERS ARE NOT THE RESPONSE</Text>
        </View>
        <GlossaryText style={styles.body}>
          Your eye connects the slider caps into a smooth line. But every band is a real filter with
          finite bandwidth — their responses overlap and COMBINE. Set the innocent-looking preset and
          compare the line you imagined (dim) with what the filters actually do (amber).
        </GlossaryText>

        <Text style={styles.caption}>
          EXAMPLE drops the sliders to a gentle-looking 125 Hz +3, 250 Hz +6, 500 Hz +3 dB — exactly
          the innocent move whose real response surprises people. CLEAR returns every slider to 0 dB.
          FILTERS reveals every band’s own bell under the composite.
        </Text>
        <Text style={styles.caption}>
          Switch the VIEW between MAGNITUDE and PHASE to compare the two results: MAGNITUDE shows how
          far the real response departs from the smooth line the sliders imply (dim); PHASE shows the
          phase shift the same filters apply — which the sliders don’t reveal at all. The point is
          the gap between what you SEE on the board and what actually happens to the signal.
        </Text>

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
    </RackUnit>
  );
}

const styles = StyleSheet.create({
  well: { gap: 12 },
  body: { fontFamily: fonts.barlowRegular, fontSize: 14, lineHeight: 20, color: colors.textSecondary },
  caption: { fontFamily: fonts.barlowRegular, fontSize: 12.5, lineHeight: 17, color: colors.textSub },
  banner: { borderRadius: 10, borderWidth: 1, borderColor: 'rgba(255,198,77,.4)', backgroundColor: '#17130a', padding: 12, alignItems: 'center' },
  bannerText: { fontFamily: fonts.oswaldSemiBold, fontSize: 14, letterSpacing: 1.2, color: colors.amber },
  challenge: { borderRadius: 10, borderWidth: 1, borderColor: '#26262c', backgroundColor: '#131316', padding: 12, gap: 6 },
  challengeHead: { fontFamily: fonts.oswaldSemiBold, fontSize: 12, letterSpacing: 1.2, color: colors.amber },
});
