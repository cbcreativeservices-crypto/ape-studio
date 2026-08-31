/**
 * GraphicVsParametric — EQ Lab lesson 10 (owner spec 2026-08-07): the graphic
 * EQ workflow, hands-on, against the parametric one the student already knows.
 * 1-OCTAVE board first (mobile-friendly 31…16k), 1/3-OCTAVE demonstrated
 * separately with horizontal scrolling. The comparison is framed the honest
 * way (owner ruling): graphic = FAST fixed-band control (still professionally
 * used); parametric = substantially greater PRECISION — never "pros don't use
 * graphic EQs."
 *
 * RACK UNIT (APE_LAB_UX_PROPOSAL 2026-08-23): renders the RackUnit frame
 * itself. The FADER BANK is a spatial editor, so the whole board rides the
 * PINNED STAGE with the actual-response curve above it — the stage lives
 * outside any ScrollView, which structurally ends the fader-vs-scroll race
 * (corrections-audit #8). The bezel reads the board format and the fader under
 * your finger; the dock carries the board picker (sticky tray) and RESET.
 */
import { useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { ResponseCurveGraph, type ResponseCurve } from '../../../../features/lab/fxViz';
import { CheckQuestion, type CheckSpec } from '../../foundations/bits';
import { GraphicBoard } from './eqBits';
import { colors, fonts } from '../../../../theme/tokens';
import { RackUnit } from '../../rack/RackUnit';
import type { DockParam } from '../../rack/rackTypes';
import { fmtHz, gainColor, graphicActualDb, OCT_CENTERS, Q_1OCT, Q_THIRD, THIRD_CENTERS } from './eqMath';
import { GlossaryText } from '../../../../features/glossary/glossaryLink';
import type { EqModuleComponentProps } from './registry';

// Board block on the stage: 108 track + gap + fader labels (eqBits geometry).
const BOARD_BLOCK_H = 126;

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

  // Bezel-safe active index (the sticky BOARD tray can swap centers mid-touch).
  const liveIdx = activeIdx != null && activeIdx < centers.length ? activeIdx : null;

  const params: DockParam[] = [
    {
      kind: 'options',
      id: 'board',
      label: 'BOARD',
      valueLabel: board === 'oct' ? '1/1 OCT' : '1/3 OCT',
      options: [
        { id: 'oct', label: '1-OCTAVE · 10 BANDS', blurb: 'One fader per octave — broad strokes only. Quick to read, too coarse to fix a narrow problem.' },
        { id: 'third', label: '1/3-OCTAVE · 31 BANDS', blurb: 'Three faders per octave — the live-sound standard, fine enough to notch a feedback frequency.' },
      ],
      selectedId: board,
      onSelect: (id) => setBoard(id as 'oct' | 'third'),
      sticky: true, // swap boards while the curve reacts
    },
    { kind: 'action', id: 'reset', label: 'RESET', onPress: reset },
  ];

  return (
    <RackUnit
      initialParam="board"
      params={params}
      stage={{
        size: 'L', // the board is the star
        badge: `Curve = the ACTUAL combined response of the board’s real filters (fixed ${
          board === 'oct' ? '1-octave' : '1/3-octave'
        } bells)`,
        bezel: [
          { k: 'BOARD', v: board === 'oct' ? '10 · 1/1 OCT' : '31 · 1/3 OCT' },
          { k: 'RANGE', v: '±12 dB' },
          // The fader under your finger — live, never hidden by the hand.
          // (bounds-guarded: the sticky BOARD tray can swap centers mid-touch)
          { k: 'BAND', v: liveIdx != null ? fmtHz(centers[liveIdx]) : '—' },
          {
            k: 'LEVEL',
            v: liveIdx != null ? `${gains[liveIdx] >= 0 ? '+' : ''}${gains[liveIdx].toFixed(1)} dB` : '—',
            tint: liveIdx != null ? gainColor(gains[liveIdx], 12) : undefined,
          },
        ],
        render: (w, h) => {
          const curveH = Math.max(60, h - BOARD_BLOCK_H - 14 - 12);
          return (
            <View style={{ width: w, height: h, paddingHorizontal: 8, paddingTop: 6, gap: 4 }}>
              <ResponseCurveGraph curves={curves} dbRange={15} height={curveH} />
              <GraphicBoard
                centers={centers}
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
        <GlossaryText style={styles.body}>
          A graphic EQ is a row of FIXED bands — one slider per frequency, gain only. You’ve been
          driving a parametric band; now drive the board. The bezel reads the fader under your
          finger.
        </GlossaryText>

        {board === 'third' && (
          <Text style={styles.caption}>1/3-OCTAVE: 31 bands — scroll the board sideways to reach them all.</Text>
        )}

        <Text style={styles.caption}>
          The line printed under the display is the honesty line: the amber curve is the ACTUAL
          combined response of the board’s real fixed-width bells — more on that in “What a Graphic EQ Really Does”.
        </Text>

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
    </RackUnit>
  );
}

const styles = StyleSheet.create({
  well: { gap: 12 },
  body: { fontFamily: fonts.barlowRegular, fontSize: 14, lineHeight: 20, color: colors.textSecondary },
  caption: { fontFamily: fonts.barlowRegular, fontSize: 12.5, lineHeight: 17, color: colors.textSub },
  compareRow: { flexDirection: 'row', gap: 10 },
  compareCol: { flex: 1, borderRadius: 10, borderWidth: 1, borderColor: '#26262c', backgroundColor: '#131316', padding: 10, gap: 3 },
  compareHead: { fontFamily: fonts.oswaldSemiBold, fontSize: 12, letterSpacing: 1, color: colors.amber, marginBottom: 2 },
  compareLine: { fontFamily: fonts.barlowMedium, fontSize: 12.5, lineHeight: 17, color: colors.textSecondary },
  compareWhy: { fontFamily: fonts.barlowRegular, fontSize: 11.5, lineHeight: 15, color: colors.textSub, marginTop: 4 },
});
