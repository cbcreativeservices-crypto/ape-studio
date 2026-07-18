/**
 * CertIcon — certification tile (design-reference CertIcon.dc.html): 4-column
 * grid tile with lit (earned: color + glow) / unlit (grey) states.
 * SVG glyphs transcribed verbatim: mic / rec / mix (faders) / pa (speaker).
 */
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Line, Path, Rect, Text as SvgText } from 'react-native-svg';
import { fonts } from '../theme/tokens';

export type CertKey = 'mic' | 'rec' | 'mix' | 'pa';

const CERT_COLORS: Record<CertKey, string> = {
  mic: '#2f9bff',
  rec: '#ff3b30',
  mix: '#f2a81f',
  pa: '#2f9bff',
};

function Glyph({ cert, color }: { cert: CertKey; color: string }) {
  const stroke = { stroke: color, strokeWidth: 1.8, fill: 'none' as const, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
  switch (cert) {
    case 'mic':
      return (
        <>
          <Rect x={9} y={2} width={6} height={11} rx={3} fill={color} />
          <Line x1={9.6} y1={5.2} x2={14.4} y2={5.2} stroke="rgba(0,0,0,.35)" strokeWidth={1} />
          <Line x1={9.6} y1={7.4} x2={14.4} y2={7.4} stroke="rgba(0,0,0,.35)" strokeWidth={1} />
          <Line x1={9.6} y1={9.6} x2={14.4} y2={9.6} stroke="rgba(0,0,0,.35)" strokeWidth={1} />
          <Path d="M5 10.5 a7 7 0 0 0 14 0" {...stroke} />
          <Line x1={12} y1={17.5} x2={12} y2={21} {...stroke} />
          <Line x1={8.5} y1={21} x2={15.5} y2={21} {...stroke} />
        </>
      );
    case 'rec':
      return (
        <>
          <Circle cx={12} cy={12} r={9.2} {...stroke} />
          <SvgText
            x={12}
            y={14.9}
            textAnchor="middle"
            fontFamily={fonts.oswaldBold}
            fontSize={8.4}
            fontWeight="700"
            fill={color}
          >
            REC
          </SvgText>
        </>
      );
    case 'mix':
      return (
        <>
          <Line x1={6} y1={3.5} x2={6} y2={20.5} {...stroke} />
          <Line x1={12} y1={3.5} x2={12} y2={20.5} {...stroke} />
          <Line x1={18} y1={3.5} x2={18} y2={20.5} {...stroke} />
          <Rect x={3.9} y={6.5} width={4.2} height={3} rx={1} fill={color} />
          <Rect x={9.9} y={12.5} width={4.2} height={3} rx={1} fill={color} />
          <Rect x={15.9} y={8.5} width={4.2} height={3} rx={1} fill={color} />
        </>
      );
    case 'pa':
      return (
        <>
          <Path d="M4 9 H7 L11.5 4.8 V19.2 L7 15 H4 Z" fill={color} />
          <Path d="M15 9.2 a4 4 0 0 1 0 5.6" {...stroke} />
          <Path d="M17.6 6.4 a8 8 0 0 1 0 11.2" {...stroke} />
        </>
      );
  }
}

export function CertIcon({ cert, active }: { cert: CertKey; active: boolean }) {
  const c = active ? CERT_COLORS[cert] : '#66696e';
  return (
    <View style={[styles.tile, active && { borderColor: CERT_COLORS[cert], backgroundColor: '#171717' }]}>
      <Svg width={32} height={32} viewBox="0 0 24 24">
        <Glyph cert={cert} color={c} />
      </Svg>
      <Text style={[styles.label, { color: active ? '#f0f0f0' : '#7c7f85' }]}>{cert.toUpperCase()}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  tile: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
    paddingVertical: 6,
    borderRadius: 7,
    backgroundColor: '#141414',
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  label: { fontFamily: fonts.oswaldBold, fontSize: 10.5, letterSpacing: 0.85 },
});
