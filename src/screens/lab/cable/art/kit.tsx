/**
 * Cable & Connector Fundamentals — the DRAWING KIT (fix pass 2026-10-16).
 *
 * The lab's lessons carried "ART SLOT" comments and no drawings at all, so a
 * beginner never saw inside a cable or which pin is which. These drawings are
 * CODE-DRAWN (react-native-svg) and authored in MILLIMETRES — every part is
 * placed with `k` = drawing units per mm, so a 6.35 mm shaft, a 1.6 mm XLR pin
 * and a 0.5 mm Cat-5e conductor keep their real proportions in every figure.
 *
 * The ART SLOT comments stay where they were: they are reserved for owner-
 * supplied art. These drawings sit NEXT to them and never replace a photo.
 *
 * House rules honoured: text ≥ 9 pt after the figure's fit (every figure is
 * authored in a ~340-unit viewBox shown ~334 pt wide, so fonts are ≥ 9.5);
 * labels sit beside the object on a leader, never on it; every conductor is
 * its own line; gradient ids are unique per instance (the inline figure and
 * its FULL SCREEN copy are both mounted); colours of conductors are UI inks
 * from connectorInks unless a REAL colour code is the subject (T568B pair
 * colours, a regional mains code — those are stated in the caption).
 */
import { useId, useMemo } from 'react';
import { Circle, G, Line, Path, Text as SvgText } from 'react-native-svg';
import { colors, fonts } from '../../../../theme/tokens';
import { strandCentres } from './kit2';

/** A per-instance id prefix safe for SVG url(#…) references. */
export function useArtUid(): string {
  const raw = useId();
  return useMemo(() => 'cf' + raw.replace(/[^a-zA-Z0-9]/g, ''), [raw]);
}

export const ART = {
  bg: '#0b0b0e',
  label: '#d9dbe0',
  sub: '#9a9ca4',
  muted: '#6d7079',
  leader: '#6d7079',
  hi: colors.amber,
  copper: '#d58a4a',
  copperHi: '#f3c08c',
  copperLo: '#8a4f22',
  tin: '#c3c8cf',
  tinLo: '#7d838c',
  metal: '#b8bec7',
  metalLo: '#5b616a',
  nickel: '#d6d9de',
  gold: '#d9b45a',
  insul: '#141518',
  good: '#4fdc86',
};

/** R7-CB-01: card-figure labels in viewBox units — ≥ 9 pt on a 340-unit
 *  figure at the 302-pt card width (360-pt phone less gutters and padding). */
export const CARD_LABEL_U = 10.5;
export const CARD_INLINE_W = 360 - 2 * 16 - 2 * 13;

/** Label text — Oswald, never below 9.5 viewBox units (≥ 9 pt after fit). */
export function Label({
  x,
  y,
  text,
  anchor = 'start',
  size = 10,
  color = ART.label,
  weight = 'medium',
}: {
  x: number;
  y: number;
  text: string;
  anchor?: 'start' | 'middle' | 'end';
  size?: number;
  color?: string;
  weight?: 'medium' | 'semibold' | 'regular';
}) {
  const family = weight === 'semibold' ? fonts.oswaldSemiBold : weight === 'regular' ? fonts.barlowRegular : fonts.oswaldMedium;
  return (
    <SvgText x={x} y={y} fontSize={Math.max(9.5, size)} fill={color} textAnchor={anchor} fontFamily={family} letterSpacing={0.4}>
      {text}
    </SvgText>
  );
}

/** A thin leader line ending in a small dot on the object. */
export function Leader({ x1, y1, x2, y2, color = ART.leader }: { x1: number; y1: number; x2: number; y2: number; color?: string }) {
  return (
    <G>
      <Line x1={x1} y1={y1} x2={x2} y2={y2} stroke={color} strokeWidth={0.7} />
      <Circle cx={x2} cy={y2} r={1.3} fill={color} />
    </G>
  );
}

/**
 * A stranded copper conductor seen END-ON: the bundle outline plus its
 * strands (7-strand lay: one centre, six around) when it is big enough to
 * read, else a solid conductor with a highlight. `d` is the bundle Ø in mm.
 */
export function CopperEnd({ cx, cy, d, k, solid = false, tinned = false }: { cx: number; cy: number; d: number; k: number; solid?: boolean; tinned?: boolean }) {
  const r = (d / 2) * k;
  const base = tinned ? ART.tin : ART.copper;
  const lo = tinned ? ART.tinLo : ART.copperLo;
  const hi = tinned ? '#eef0f3' : ART.copperHi;
  if (!solid && d >= 1.2) {
    // Fine-stranded heavy conductor (speaker, mains): ~0.27 mm strands.
    const s = 0.27;
    return (
      <G>
        <Circle cx={cx} cy={cy} r={r} fill={lo} />
        {strandCentres(d, s).map(([dx, dy], i) => (
          <Circle key={i} cx={cx + dx * k} cy={cy + dy * k} r={(s / 2) * k * 0.95} fill={(i * 7) % 5 === 0 ? hi : base} />
        ))}
      </G>
    );
  }
  if (solid || r < 4) {
    return (
      <G>
        <Circle cx={cx} cy={cy} r={r} fill={base} stroke={lo} strokeWidth={Math.min(0.6, r * 0.25)} />
        <Circle cx={cx - r * 0.3} cy={cy - r * 0.3} r={r * 0.35} fill={hi} opacity={0.7} />
      </G>
    );
  }
  const s = r / 3; // strand radius for a 7-strand bundle
  const pts: [number, number][] = [[0, 0]];
  for (let i = 0; i < 6; i++) pts.push([Math.cos((i * Math.PI) / 3) * 2 * s, Math.sin((i * Math.PI) / 3) * 2 * s]);
  return (
    <G>
      <Circle cx={cx} cy={cy} r={r} fill={lo} />
      {pts.map(([dx, dy], i) => (
        <G key={i}>
          <Circle cx={cx + dx} cy={cy + dy} r={s * 0.97} fill={base} stroke={lo} strokeWidth={0.35} />
          <Circle cx={cx + dx - s * 0.3} cy={cy + dy - s * 0.3} r={s * 0.32} fill={hi} opacity={0.65} />
        </G>
      ))}
    </G>
  );
}

/** An insulated conductor END-ON: insulation ring + copper. `stripe` paints
 *  the tracer colour of a white "white-blue"-style T568 conductor. */
export function InsulatedEnd({
  cx,
  cy,
  od,
  cu,
  k,
  color,
  stripe,
  solid,
}: {
  cx: number;
  cy: number;
  od: number;
  cu: number;
  k: number;
  color: string;
  stripe?: string;
  solid?: boolean;
}) {
  const r = (od / 2) * k;
  return (
    <G>
      <Circle cx={cx} cy={cy} r={r} fill={color} stroke="#0a0a0c" strokeWidth={0.5} />
      {stripe ? (
        <Path
          d={`M${cx - r * 0.95} ${cy - r * 0.3} A${r} ${r} 0 0 1 ${cx - r * 0.3} ${cy - r * 0.95} L${cx - r * 0.22} ${cy - r * 0.7} A${r * 0.74} ${r * 0.74} 0 0 0 ${cx - r * 0.7} ${cy - r * 0.22} Z`}
          fill={stripe}
        />
      ) : null}
      <Circle cx={cx - r * 0.35} cy={cy - r * 0.4} r={r * 0.28} fill="#ffffff" opacity={0.18} />
      <CopperEnd cx={cx} cy={cy} d={cu} k={k} solid={solid} />
    </G>
  );
}

/** A braided shield END-ON: the ring of fine tinned strands. */
export function BraidRing({ cx, cy, ro, ri, k }: { cx: number; cy: number; ro: number; ri: number; k: number }) {
  const rm = ((ro + ri) / 2) * k;
  const t = (ro - ri) * k;
  const n = Math.max(24, Math.round((2 * Math.PI * rm) / Math.max(1.2, t * 0.9)));
  const dots = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    dots.push(<Circle key={i} cx={cx + Math.cos(a) * rm} cy={cy + Math.sin(a) * rm} r={Math.max(0.5, t * 0.42)} fill={ART.tin} />);
  }
  return (
    <G>
      <Circle cx={cx} cy={cy} r={rm} fill="none" stroke={ART.tinLo} strokeWidth={t} />
      {dots}
    </G>
  );
}

/** A plain scale bar: `mm` millimetres at `k` units/mm. */
export function ScaleBar({ x, y, k, mm }: { x: number; y: number; k: number; mm: number }) {
  const w = mm * k;
  return (
    <G>
      <Line x1={x} y1={y} x2={x + w} y2={y} stroke={ART.sub} strokeWidth={1} />
      <Line x1={x} y1={y - 3} x2={x} y2={y + 3} stroke={ART.sub} strokeWidth={1} />
      <Line x1={x + w} y1={y - 3} x2={x + w} y2={y + 3} stroke={ART.sub} strokeWidth={1} />
      <Label x={x + w + 5} y={y + 3.5} text={`${mm} mm`} color={ART.sub} size={9.5} />
    </G>
  );
}
