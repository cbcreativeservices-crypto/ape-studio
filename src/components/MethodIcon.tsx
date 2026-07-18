/**
 * MethodIcon — neon per-method glyph in a recessed dark tile (design-reference
 * MethodIcon.dc.html). SVG geometry transcribed verbatim from the prototype:
 *   flashcards (blue cards) · fill_in_blank (gold puzzle) · matching (red TRS
 *   patch cable, silver connectors) · ear_training (green ear) · scenarios
 *   (purple speech bubble) · quiz (yellow clipboard) · glossary (blue book).
 * The CSS drop-shadow neon glow has no react-native-svg equivalent; it's
 * approximated with a wider low-opacity under-stroke of the same paths.
 */
import { StyleSheet, View } from 'react-native';
import Svg, { Circle, Line, Path, Rect } from 'react-native-svg';

export type MethodKey =
  | 'flashcards'
  | 'fill_in_blank'
  | 'matching'
  | 'ear_training'
  | 'scenarios'
  | 'quiz'
  | 'glossary';

export const METHOD_COLORS: Record<MethodKey, string> = {
  flashcards: '#2f9bff',
  fill_in_blank: '#f2a81f',
  matching: '#ff4b3a',
  ear_training: '#37e05f',
  scenarios: '#b45bff',
  quiz: '#ffd23c',
  glossary: '#5bb0ff',
};

function Glyph({ method, glow, color }: { method: MethodKey; glow?: boolean; color?: string }) {
  const c = color ?? METHOD_COLORS[method];
  // Quiz reads fuzzy at the larger tile size — its thin checkmarks/lines get
  // swallowed by the fat halo. Give it a tighter glow so the edges stay crisp
  // (Booth 2026-07-11 #4).
  const sw = glow ? (method === 'quiz' ? 2.9 : 4.2) : 1.7;
  const op = glow ? 0.3 : 1;
  const common = {
    stroke: c,
    strokeWidth: sw,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    fill: 'none' as const,
    opacity: op,
  };

  switch (method) {
    case 'flashcards':
      return (
        <>
          <Rect x={8.5} y={3.5} width={11} height={14} rx={2} {...common} />
          <Rect x={4.5} y={6.5} width={11} height={14} rx={2} {...common} fill={glow ? 'none' : '#101010'} />
          <Line x1={7} y1={10.8} x2={13} y2={10.8} {...common} />
          <Line x1={7} y1={13.8} x2={13} y2={13.8} {...common} />
          <Line x1={7} y1={16.8} x2={10.5} y2={16.8} {...common} />
        </>
      );
    case 'fill_in_blank':
      return (
        <>
          <Path
            d="M20.5 11H19V7c0-1.1-.9-2-2-2h-4V3.5C13 2.12 11.88 1 10.5 1S8 2.12 8 3.5V5H4c-1.1 0-1.99.9-1.99 2v3.8H3.5c1.49 0 2.7 1.21 2.7 2.7s-1.21 2.7-2.7 2.7H2V20c0 1.1.9 2 2 2h3.8v-1.5c0-1.49 1.21-2.7 2.7-2.7 1.49 0 2.7 1.21 2.7 2.7V22H17c1.1 0 2-.9 2-2v-4h1.5c1.38 0 2.5-1.12 2.5-2.5S21.88 11 20.5 11z"
            fill={c}
            stroke={glow ? c : '#7a4d08'}
            // Tighter halo + crisper outline so the puzzle edges read sharp
            // at the larger tile size (Booth 2026-07-11 #4).
            strokeWidth={glow ? 1.8 : 1.05}
            strokeLinejoin="round"
            opacity={op}
          />
          {!glow && (
            <Path
              d="M8 5V3.5C8 2.12 9.12 1 10.5 1S13 2.12 13 3.5V5h-1.4V3.5a1.1 1.1 0 0 0-2.2 0V5z"
              fill="rgba(255,255,255,.35)"
            />
          )}
        </>
      );
    case 'matching':
      return (
        <>
          <Path
            d="M10.9 5.5 L13 5.5 C17.5 5.5, 17.5 12, 12 12 C6.5 12, 6.5 18.5, 11 18.5 L13.1 18.5"
            fill="none"
            stroke={glow ? c : '#6e1a12'}
            strokeWidth={glow ? 4.4 : 3.2}
            opacity={op}
          />
          <Path
            d="M10.9 5.5 L13 5.5 C17.5 5.5, 17.5 12, 12 12 C6.5 12, 6.5 18.5, 11 18.5 L13.1 18.5"
            fill="none"
            stroke="#ff5a48"
            strokeWidth={1.5}
            opacity={op}
          />
          {!glow && (
            <>
              <Rect x={1} y={4.65} width={7} height={1.7} rx={0.85} fill="#d0d4da" />
              <Rect x={1.4} y={4.85} width={4.8} height={0.4} rx={0.2} fill="#eef1f5" />
              <Rect x={2.8} y={4.65} width={0.5} height={1.7} fill="#101010" />
              <Rect x={4.2} y={4.65} width={0.5} height={1.7} fill="#101010" />
              <Rect x={7.4} y={3.9} width={3.2} height={3.2} rx={0.7} fill="#bfc3c9" />
              <Rect x={10.1} y={4.4} width={0.9} height={2.2} rx={0.3} fill="#ff4b3a" />
              <Rect x={16} y={17.65} width={7} height={1.7} rx={0.85} fill="#d0d4da" />
              <Rect x={17.8} y={17.85} width={4.8} height={0.4} rx={0.2} fill="#eef1f5" />
              <Rect x={20.7} y={17.65} width={0.5} height={1.7} fill="#101010" />
              <Rect x={19.3} y={17.65} width={0.5} height={1.7} fill="#101010" />
              <Rect x={13.4} y={16.9} width={3.2} height={3.2} rx={0.7} fill="#bfc3c9" />
              <Rect x={13} y={17.4} width={0.9} height={2.2} rx={0.3} fill="#ff4b3a" />
            </>
          )}
        </>
      );
    case 'ear_training':
      return (
        <>
          <Path d="M6 8.5a6.5 6.5 0 1 1 13 0c0 6 -6 6 -6 10a3.5 3.5 0 1 1 -7 0" {...common} strokeWidth={glow ? 4.4 : 1.8} />
          <Path d="M15 8.5a2.5 2.5 0 0 0 -5 0v1a2 2 0 1 1 0 4" {...common} strokeWidth={glow ? 4.4 : 1.8} />
        </>
      );
    case 'scenarios':
      return (
        <>
          <Path
            d="M4 4.5 h16 a2 2 0 0 1 2 2 v8 a2 2 0 0 1 -2 2 H10.5 l-4.5 4 v-4 H4 a2 2 0 0 1 -2 -2 V6.5 a2 2 0 0 1 2 -2 z"
            {...common}
          />
          {!glow && (
            <>
              <Circle cx={8} cy={10.5} r={1.15} fill={c} />
              <Circle cx={12} cy={10.5} r={1.15} fill={c} />
              <Circle cx={16} cy={10.5} r={1.15} fill={c} />
            </>
          )}
        </>
      );
    case 'quiz':
      return (
        <>
          <Rect x={5} y={4} width={14} height={17} rx={2} {...common} />
          <Rect x={9} y={2.4} width={6} height={3.6} rx={1} fill={c} opacity={op} />
          <Path d="M7.4 10.2 l1.4 1.4 l2.3 -2.8" {...common} />
          <Line x1={13} y1={10.4} x2={16.4} y2={10.4} {...common} />
          <Path d="M7.4 15.4 l1.4 1.4 l2.3 -2.8" {...common} />
          <Line x1={13} y1={15.6} x2={16.4} y2={15.6} {...common} />
        </>
      );
    case 'glossary':
      return (
        <>
          <Path
            d="M12 6.6 C10 4.9 6.5 4.6 3.5 5.6 V18.6 C6.5 17.6 10 17.9 12 19.6 C14 17.9 17.5 17.6 20.5 18.6 V5.6 C17.5 4.6 14 4.9 12 6.6 Z"
            {...common}
          />
          <Line x1={12} y1={6.6} x2={12} y2={19.6} {...common} />
        </>
      );
  }
}

export function MethodIcon({
  method,
  size = 44,
  glowColor,
  mono = false,
}: {
  method: MethodKey;
  size?: number;
  /** When set, the tile's thin border LIGHTS in this color (glow at 70% —
   *  Booth 2026-07-11). Undefined = the default faint #2c2c2c line. */
  glowColor?: string;
  /** Render the glyph GRAY (a method not used in this topic — Booth 2026-07-11). */
  mono?: boolean;
}) {
  // Booth ruling 2026-07-07: the fill_in_blank puzzle glyph reads visually
  // heavier than its siblings — render it 15% smaller (62% → 52.7% of tile).
  const inner = size * 0.62 * (method === 'fill_in_blank' ? 0.85 : 1);
  const glyphColor = mono ? '#565759' : undefined;
  return (
    <View
      style={[
        styles.tile,
        { width: size, height: size, borderRadius: size * 0.2 },
        glowColor
          ? {
              borderColor: glowColor,
              shadowColor: glowColor,
              shadowOpacity: 0.7,
              shadowRadius: 3.5,
              shadowOffset: { width: 0, height: 0 },
            }
          : null,
      ]}
    >
      <Svg width={inner} height={inner} viewBox="0 0 24 24">
        <Glyph method={method} glow color={glyphColor} />
        <Glyph method={method} color={glyphColor} />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  tile: {
    backgroundColor: '#101010',
    borderWidth: 1,
    borderColor: '#2c2c2c',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
});
