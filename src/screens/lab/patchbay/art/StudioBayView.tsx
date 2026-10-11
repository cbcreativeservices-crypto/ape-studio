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
import Svg, { Circle, G, Line, Rect, Text as SvgText } from 'react-native-svg';
import { colors, fonts } from '../../../../theme/tokens';
import { ExpandableFigure } from '../../kit/ExpandableFigure';
import type { StudioPair } from '../engine/scenariosB';
import { FlowPath, PB, useFlowPhase } from './PatchPairView';

const W = 340;
const H = 108;
const ROW_TOP = 38;
const ROW_BOT = 78;
const X0 = 34; // first column center
const STEP = 39; // column spacing

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
    `Studio patchbay, eight vertical pairs. ` +
    pairs
      .map((p) => `Pair ${p.n}: ${p.sourceLabel} over ${p.destLabel}, ${p.config === 'thru' ? 'thru' : 'half-normal'}.`)
      .join(' ') +
    (showNormals ? ' Internal normals shown flowing on pairs one to six; the processor pairs are thru — no internal connection.' : '');
  return (
      <View style={{ width: w, height: h }}>
        <Svg accessible accessibilityRole="image" accessibilityLabel={a11y} width={w} height={h} viewBox={`0 0 ${W} ${H}`}>
          {/* the faceplate (art pass 2026-10-10): brushed panel, a lit top
              bevel, and the rack ears' oval mounting slots */}
          <Rect x={0} y={4} width={W} height={H - 8} rx={4} fill={PB.panel} stroke={PB.panelEdge} />
          <Rect x={1} y={5} width={W - 2} height={2} rx={1} fill="#ffffff" opacity={0.07} />
          {[0, W - 16].map((ex) => (
            <G key={ex}>
              <Line x1={ex === 0 ? 16 : W - 16} y1={6} x2={ex === 0 ? 16 : W - 16} y2={H - 6} stroke="#000" strokeWidth={0.8} opacity={0.5} />
              {[H * 0.3, H * 0.7].map((sy) => (
                <Rect key={sy} x={ex + 3} y={sy - 2.4} width={10} height={4.8} rx={2.4} fill="#050506" stroke="#3a3b41" strokeWidth={0.8} />
              ))}
            </G>
          ))}
          <SvgText x={16} y={19} fontSize={9} fill={colors.textMuted} fontFamily={fonts.oswaldMedium} letterSpacing={1.4}>STUDIO BAY</SvgText>
          {pairs.map((p, i) => {
            const cx = X0 + i * STEP;
            const isSel = selected === p.n;
            const plug = plugs[p.n] ?? {};
            return (
              <G key={p.n}>
                {/* selection outline stops clear of both the jack and the
                    numeral (design pass: it used to strike through "01") */}
                {isSel ? <Rect x={cx - 15} y={22} width={30} height={68} rx={8} fill="none" stroke={colors.cyanBright} strokeWidth={1.4} /> : null}
                {/* the internal zone between the rows */}
                {showNormals ? (
                  p.config === 'thru' ? (
                    <SvgText x={cx} y={(ROW_TOP + ROW_BOT) / 2 + 3} fontSize={9} fill={colors.textMuted} textAnchor="middle" fontFamily={fonts.oswaldMedium} letterSpacing={0.6}>THRU</SvgText>
                  ) : (
                    <FlowPath d={`M ${cx} ${ROW_TOP + 8} L ${cx} ${ROW_BOT - 8}`} flowing phase={phase} reduceMotion={reduceMotion} width={2.2} />
                  )
                ) : null}
                {/* jacks */}
                {/* ¼-inch jacks face-on: the bushing's nut ring, the socket and
                    the sleeve contact inside; a plugged jack shows the patch
                    cord's plug handle end-on with its cord dropping away */}
                {[{ y: ROW_TOP, on: !!plug.top }, { y: ROW_BOT, on: !!plug.bottom }].map(({ y, on }) => (
                  <G key={y}>
                    <Circle cx={cx} cy={y} r={7} fill="#2a2b31" stroke={on ? PB.cord : isSel ? '#6a6b73' : '#3a3b41'} strokeWidth={on ? 2 : 1.3} />
                    <Circle cx={cx - 1.2} cy={y - 1.2} r={5.6} fill="none" stroke="#ffffff" strokeWidth={0.6} opacity={0.12} />
                    <Circle cx={cx} cy={y} r={4.2} fill="#08080a" />
                    <Circle cx={cx} cy={y} r={3.2} fill="none" stroke="#3d3e45" strokeWidth={0.8} />
                    {on ? (
                      <>
                        <Line x1={cx + 2} y1={y + 3} x2={cx + 9} y2={y + 16} stroke={PB.cord} strokeWidth={2.4} strokeLinecap="round" />
                        <Circle cx={cx} cy={y} r={5.2} fill="#1d1e22" stroke={PB.cord} strokeWidth={1.6} />
                        <Circle cx={cx - 1} cy={y - 1} r={2.4} fill="#ffffff" opacity={0.12} />
                      </>
                    ) : null}
                  </G>
                ))}
                <SvgText x={cx} y={H - 6} fontSize={9} fill={isSel ? colors.cyanBright : colors.textMuted} textAnchor="middle" fontFamily={fonts.mono}>
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
