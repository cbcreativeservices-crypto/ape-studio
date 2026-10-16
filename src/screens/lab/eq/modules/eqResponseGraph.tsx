/**
 * EQ Lab response graph = the house ResponseCurveGraph + a printed LEVEL scale
 * (lab-art round 3, 2026-10-16: "most response graphs have a frequency axis
 * but no dB axis labels"). The +½-range, 0 and −½-range gridlines the house
 * graph already draws are numbered at the left on a dark plate, the unit on
 * the top one ('dB', or '°' for the phase view). Geometry comes from the house
 * graph's own exported helpers, so the numbers sit exactly on its gridlines.
 * Drop-in: same name and props as the house graph, plus `unit`.
 */
import type { ComponentProps } from 'react';
import { View } from 'react-native';
import Svg, { Rect, Text as SvgText } from 'react-native-svg';
import {
  RESPONSE_GRAPH_PAD,
  ResponseCurveGraph as HouseResponseCurveGraph,
  responseGraphPadB,
  responseGraphScale,
  responseGraphTextScale,
  responseGraphY,
} from '../../../../features/lab/fxViz';
import { colors, fonts } from '../../../../theme/tokens';

/** The house graph's tick-label size (fxViz TICK_FONT) — the scale matches it. */
const TICK_FONT = 9;

/** The labels the scale prints for a ±range graph (exported for the test). */
export function dbScaleLabels(dbRange: number, unit = 'dB'): { db: number; text: string }[] {
  return [dbRange / 2, 0, -dbRange / 2].map((db, i) => {
    const a = Math.abs(db);
    const v = Number.isInteger(a) ? String(a) : a.toFixed(1);
    return { db, text: `${db > 0 ? '+' : db < 0 ? '−' : ''}${v}${i === 0 ? ` ${unit}` : ''}` };
  });
}

export function ResponseCurveGraph(props: ComponentProps<typeof HouseResponseCurveGraph> & { unit?: string }) {
  const { unit, ...rest } = props;
  const gw = rest.width;
  if (!gw) return <HouseResponseCurveGraph {...rest} />;
  const dbRange = rest.dbRange ?? 18;
  const ts = responseGraphTextScale(gw);
  const padB = responseGraphPadB(gw);
  const H = rest.totalHeight != null ? Math.max(40, rest.totalHeight - padB) : (rest.height ?? 150);
  const padL = RESPONSE_GRAPH_PAD * responseGraphScale(gw);
  const fs = TICK_FONT * ts;
  return (
    <View>
      <HouseResponseCurveGraph {...rest} />
      <Svg
        pointerEvents="none"
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
        style={{ position: 'absolute', left: 0, top: 0 }}
        width={gw}
        height={H}
      >
        {dbScaleLabels(dbRange, unit).map(({ db, text }) => {
          const y = responseGraphY(db, H, dbRange);
          const tw = 0.62 * fs * text.length + 5 * ts;
          return [
            <Rect key={`p${db}`} x={padL + 1 * ts} y={y - fs * 0.64} width={tw} height={fs * 1.28} rx={2 * ts} fill="#0b0c10" fillOpacity={0.85} />,
            <SvgText key={`t${db}`} x={padL + 3.5 * ts} y={y + fs * 0.36} fill={colors.textSub} fontSize={fs} fontFamily={fonts.mono}>
              {text}
            </SvgText>,
          ];
        })}
      </Svg>
    </View>
  );
}
