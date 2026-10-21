/**
 * StudioBayView — the 8-pair studio bay overview (§16/§17). A wide faceplate
 * with two rows and eight numbered columns; tapping a column selects that
 * vertical pair (the page renders the standard PatchPairView for it below —
 * one pair at a time, exactly the "master one pair, then zoom out" pedagogy).
 *
 * `showNormals` reveals the invisible internal connections (§17) with the
 * lab's ONE flow grammar — the normals MARCH (they are carrying the studio's
 * live audio; a static dash would mean "idle" three pages of grammar ago) —
 * while the thru processor pairs show a conspicuous ABSENCE (a THRU tag, not
 * a whisper): the two teaching states of the zero-cables page. Patched
 * columns show a gold cord stub at the plugged jack.
 */
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, G, Line, Path, Rect, Text as SvgText } from 'react-native-svg';
import { colors, fonts } from '../../../../theme/tokens';
import { ExpandableFigure } from '../../kit/ExpandableFigure';
import type { StudioPair } from '../engine/scenariosB';
import { FlowPath, PB, useFlowPhase } from './PatchPairView';

/* True scale (art grading 2026-10-16: "8 pairs across a full 1U width — the
 * jacks read oversized"). This is the LEFT END of a real 1U, 48-point
 * (24-pair) ¼-inch TRS bay at 1.95 units per mm: the 44.45 mm panel, the
 * 15.9 mm rack ear with its slots at the EIA hole heights, columns at the
 * bay's 18.4 mm pitch, 11 mm jack faces. The panel is torn off past pair 8
 * (a break edge) — the bay carries on to pair 24. */
const MM = 1.95;
const W = 340;
const PY = 14; // panel top (the title sits above the metal)
const PANEL_H = 44.45 * MM;
const H = 104;
const ROW_TOP = PY + 13 * MM;
const ROW_BOT = PY + 30 * MM;
const EAR = 15.9 * MM;
const STEP = 18.4 * MM; // column pitch
const X0 = 29.7 * MM; // first column center from the panel's left edge
const BREAK_X = X0 + 7.5 * STEP; // the torn edge, half a pitch past pair 8
const JACK_R = 5.5 * MM;

/** The panel outline: square left end (the rack ear), torn right edge. */
function breakPanelPath(): string {
  const bottom = PY + PANEL_H;
  let d = `M 0 ${PY} L ${BREAK_X} ${PY}`;
  let i = 0;
  for (let y = PY + 6; y < bottom; y += 6, i++) d += ` L ${BREAK_X + (i % 2 ? 0 : -4)} ${y}`;
  return `${d} L ${BREAK_X} ${bottom} L 0 ${bottom} Z`;
}

export type BayPlugs = Record<number, { top?: boolean; bottom?: boolean } | undefined>;

/** The bay's aspect (viewBox W ÷ H). */
export const BAY_ASPECT = W / H;

export type StudioBayDrawingProps = {
  pairs: StudioPair[];
  selected?: number | null;
  onSelect?: (n: number) => void;
  /** Reveal the internal normals (§17's "show all invisible connections"). */
  showNormals?: boolean;
  /** Per-pair front-jack cords to draw (gold stubs). */
  plugs?: BayPlugs;
  reduceMotion?: boolean;
  w: number;
  h: number;
};

/** The bay drawing alone at (w, h), column taps included — the Rack Unit's
 *  glass and the page figure both draw this. */
export function StudioBayDrawing({ pairs, selected, onSelect, showNormals, plugs = {}, reduceMotion = false, w, h }: StudioBayDrawingProps) {
  const phase = useFlowPhase(!!showNormals, reduceMotion);
  const a11y =
    `Studio patchbay, the first eight vertical pairs of a 24-pair bay. ` +
    pairs
      .map((p) => `Pair ${p.n}: ${p.sourceLabel} over ${p.destLabel}, ${p.config === 'thru' ? 'thru' : 'half-normal'}.`)
      .join(' ') +
    (showNormals ? ' Internal normals shown flowing on pairs one to six; the processor pairs are thru — no internal connection.' : '');
  return (
      <View style={{ width: w, height: h }}>
        <Svg accessible accessibilityRole="image" accessibilityLabel={a11y} width={w} height={h} viewBox={`0 0 ${W} ${H}`}>
          {/* the faceplate: brushed panel, a lit top bevel, the left rack
              ear with its two oval slots, and a torn BREAK edge on the right
              (the bay continues to pair 24) */}
          <Path d={breakPanelPath()} fill={PB.panel} stroke={PB.panelEdge} strokeWidth={0.9} />
          <Rect x={1} y={PY + 1} width={BREAK_X - 6} height={2} rx={1} fill="#ffffff" opacity={0.07} />
          <Line x1={EAR} y1={PY + 2} x2={EAR} y2={PY + PANEL_H - 2} stroke="#000" strokeWidth={0.8} opacity={0.5} />
          {[6.35, 38.1].map((mm) => (
            <Rect key={mm} x={8.75 * MM - 7} y={PY + mm * MM - 3.4} width={14} height={6.8} rx={3.4} fill="#050506" stroke="#3a3b41" strokeWidth={0.8} />
          ))}
          <SvgText x={2} y={10} fontSize={9} fill={colors.textMuted} fontFamily={fonts.oswaldMedium} letterSpacing={1.2}>STUDIO BAY · PAIRS 1–8 OF A 24-PAIR, 1U BAY</SvgText>
          {pairs.map((p, i) => {
            const cx = X0 + i * STEP;
            const isSel = selected === p.n;
            const plug = plugs[p.n] ?? {};
            return (
              <G key={p.n}>
                {/* selection outline stops clear of both the jack and the
                    numeral (design pass: it used to strike through "01") */}
                {isSel ? <Rect x={cx - STEP / 2 + 1.5} y={ROW_TOP - JACK_R - 4} width={STEP - 3} height={PY + PANEL_H - 2 - (ROW_TOP - JACK_R - 4)} rx={8} fill="none" stroke={colors.cyanBright} strokeWidth={1.4} /> : null}
                {/* the internal zone between the rows */}
                {showNormals ? (
                  p.config === 'thru' ? (
                    <SvgText x={cx} y={(ROW_TOP + ROW_BOT) / 2 + 3} fontSize={9} fill={colors.textMuted} textAnchor="middle" fontFamily={fonts.oswaldMedium} letterSpacing={0.6}>THRU</SvgText>
                  ) : (
                    <FlowPath d={`M ${cx} ${ROW_TOP + JACK_R + 1} L ${cx} ${ROW_BOT - JACK_R - 1}`} flowing phase={phase} reduceMotion={reduceMotion} width={2.2} />
                  )
                ) : null}
                {/* jacks */}
                {/* ¼-inch jacks face-on: the bushing's nut ring, the socket and
                    the sleeve contact inside; a plugged jack shows the patch
                    cord's plug handle end-on with its cord dropping away */}
                {/* the TOP cord drops just right of the jack below; the BOTTOM
                    cord leaves on the LEFT, so with both plugged each cord
                    keeps its own lane (R3-PB-03) */}
                {[{ y: ROW_TOP, on: !!plug.top, side: 1 }, { y: ROW_BOT, on: !!plug.bottom, side: -1 }].map(({ y, on, side }) => (
                  <G key={y}>
                    <Circle cx={cx} cy={y} r={JACK_R} fill="#2a2b31" stroke={on ? PB.cord : isSel ? '#6a6b73' : '#3a3b41'} strokeWidth={on ? 2 : 1.3} />
                    <Circle cx={cx - 1.4} cy={y - 1.4} r={JACK_R - 1.6} fill="none" stroke="#ffffff" strokeWidth={0.7} opacity={0.12} />
                    <Circle cx={cx} cy={y} r={3.2 * MM} fill="#08080a" />
                    <Circle cx={cx} cy={y} r={2.3 * MM} fill="none" stroke="#3d3e45" strokeWidth={0.8} />
                    {on ? (
                      <>
                        {/* the cord hangs from the handle down off the panel;
                            at cx ± 14 the 2.6-wide cord (inner edge 12.7)
                            clears the jack below (JACK_R 10.7 + stroke → 11.7)
                            and stays inside the selection outline (15.7) —
                            at cx ± 12 it grazed the bushing (R4-PB-01) */}
                        <Path d={`M ${cx + side} ${y + 3} C ${cx + 5 * side} ${y + 13}, ${cx + 14 * side} ${y + 18}, ${cx + 14 * side} ${PY + PANEL_H + 4}`} stroke={PB.cord} strokeWidth={2.6} fill="none" strokeLinecap="round" />
                        <Circle cx={cx} cy={y} r={4.6 * MM} fill="#1d1e22" stroke={PB.cord} strokeWidth={1.6} />
                        <Circle cx={cx} cy={y} r={1.4 * MM} fill="#0c0c0e" stroke="#45464d" strokeWidth={0.6} />
                      </>
                    ) : null}
                  </G>
                ))}
                <SvgText x={cx} y={PY + PANEL_H - 5} fontSize={9} fill={isSel ? colors.cyanBright : colors.textMuted} textAnchor="middle" fontFamily={fonts.mono}>
                  {String(p.n).padStart(2, '0')}
                </SvgText>
              </G>
            );
          })}
        </Svg>
        {/* column tap overlays — siblings of the Svg (SR-reachable). */}
        {onSelect ? (
          <View style={styles.tapRow} pointerEvents="box-none">
            {pairs.map((p, i) => (
              <Pressable
                key={p.n}
                onPress={() => onSelect(p.n)}
                style={[styles.colTap, { left: `${((X0 + i * STEP - STEP / 2) / W) * 100}%`, width: `${(STEP / W) * 100}%` }]}
                accessibilityRole="button"
                accessibilityLabel={`Select pair ${p.n}: ${p.sourceLabel} over ${p.destLabel}`}
                accessibilityState={{ selected: selected === p.n }}
                aria-pressed={selected === p.n}
              />
            ))}
          </View>
        ) : null}
      </View>
  );
}

/** The row legend as real text (the SVG header stays short + readable) — under
 *  the page figure, and in a rack page's well. */
export function BayLegend() {
  return <Text style={styles.legend}>TOP ROW = SOURCES · BOTTOM ROW = DESTINATIONS</Text>;
}

export function StudioBayView({
  pairs, selected, onSelect, showNormals, plugs = {}, reduceMotion = false, controls,
}: {
  /** The page's controls (reveal button, goal chips), docked under the bay
   *  in FULL SCREEN (D35, full-screen pass 2026-09-30). */
  controls?: ReactNode;
  pairs: StudioPair[];
  selected?: number | null;
  onSelect?: (n: number) => void;
  /** Reveal the internal normals (§17's "show all invisible connections"). */
  showNormals?: boolean;
  /** Per-pair front-jack cords to draw (gold stubs). */
  plugs?: BayPlugs;
  reduceMotion?: boolean;
}) {
  const legend = <BayLegend />;
  return (
    <View style={styles.wrap}>
      {/* The bay through ExpandableFigure: the same column taps at the page
          width and at the zoomed size, the legend and the page's controls
          docked under it in full screen. */}
      <ExpandableFigure
        aspect={W / H}
        title="STUDIO BAY"
        controls={
          <View style={styles.dock}>
            {legend}
            {controls}
          </View>
        }
        render={(w, h) => <StudioBayDrawing pairs={pairs} selected={selected} onSelect={onSelect} showNormals={showNormals} plugs={plugs} reduceMotion={reduceMotion} w={w} h={h} />}
      />
      {/* Row legend as real text (the SVG header stays short + readable). */}
      {legend}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { width: '100%', borderRadius: 12, borderWidth: 1, borderColor: colors.hairline, backgroundColor: '#0d0d10', padding: 8, gap: 5 },
  tapRow: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  colTap: { position: 'absolute', top: 0, height: '100%', minHeight: 44 },
  legend: { color: colors.textMuted, fontFamily: fonts.oswaldMedium, fontSize: 12, letterSpacing: 1 },
  dock: { paddingHorizontal: 12, gap: 8 },
});
