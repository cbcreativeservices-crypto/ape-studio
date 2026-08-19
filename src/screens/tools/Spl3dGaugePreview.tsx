/**
 * Spl3dGaugePreview — DEV + WEB ONLY layout harness for the 3D SPL gauge.
 *
 * The real gauge only renders while the native measurement engine is running
 * (SplMeterScreen gates it behind `state === 'running'`), which never happens
 * in the web preview. This standalone harness renders all three modes stacked
 * with static demo levels so the callout spacing / ring / numerals can be seen
 * and iterated in the browser. Reached at `localhost:8090/#gaugepreview`
 * (App.tsx short-circuits to it in __DEV__ on web). Never bundled into any
 * real navigation path; no engine, no auth, no providers.
 */
import { ScrollView, Text, View } from 'react-native';
import { Spl3dGauge, type DialMode3d } from './Spl3dGauge';
import { fonts } from '../../theme/tokens';

// Demo levels chosen to light a good spread of each mode's zones so the colours
// + lit edge are visible: studio into the gold sweet spot, spl into orange, etc.
const DEMOS: { mode: DialMode3d; level: number; center: string; color: string }[] = [
  { mode: 'studio', level: 81, center: '81', color: '#dfaf35' },
  { mode: 'spl', level: 92, center: '92', color: '#e8842a' },
  { mode: 'optimal', level: 74, center: '74', color: '#3fae52' },
];

export function Spl3dGaugePreview({ width = 900 }: { width?: number }) {
  const w = Math.min(width, 980);
  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#0d0d0f' }} contentContainerStyle={{ padding: 20, gap: 28, alignItems: 'center' }}>
      <Text style={{ fontFamily: fonts.oswaldSemiBold, fontSize: 18, letterSpacing: 2, color: '#e6e7ea' }}>
        SPL 3D GAUGE — DEV PREVIEW (all modes, demo levels)
      </Text>
      {DEMOS.map((d) => (
        <View key={d.mode} style={{ width: w, gap: 6 }}>
          <Text style={{ fontFamily: fonts.mono, fontSize: 12, letterSpacing: 1.5, color: '#8a8f98' }}>
            {d.mode.toUpperCase()} · demo level {d.level} dB SPL
          </Text>
          <Spl3dGauge width={w} mode={d.mode} level={d.level} calibrated={false} centerText={d.center} centerColor={d.color} />
        </View>
      ))}
    </ScrollView>
  );
}
