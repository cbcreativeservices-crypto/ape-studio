// artshot example: the Amplifier Principles lab, module 2 — the device
// diagram (supply → device → load, with the load's return to the supply) and
// the transformer (primary / secondary waves), both at the 341-pt glass
// width of a 375-pt phone. ARTSHOT_NP / ARTSHOT_NS set the windings.
import { DeviceDiagram, TransformerDiagram } from '../../../src/screens/lab/amp/modules/mod2Devices';
import { View } from 'react-native';

const W = 341;
const DEV_H = (W * 150) / 360;
const XF_H = (W * 136) / 360;
const np = Number(process.env.ARTSHOT_NP ?? 400);
const ns = Number(process.env.ARTSHOT_NS ?? 200);
export const size = { width: W, height: Math.ceil(DEV_H + XF_H + 12), scale: 3 };

export default function AmpMod2() {
  return (
    <View style={{ position: 'absolute', left: 0, top: 0, width: W, height: size.height, backgroundColor: '#0c0d10' }}>
      <View style={{ position: 'absolute', left: 0, top: 0, width: W, height: DEV_H }}>
        <DeviceDiagram device="bjt" control={0.6} width={W} height={DEV_H} />
      </View>
      <View style={{ position: 'absolute', left: 0, top: DEV_H + 12, width: W, height: XF_H }}>
        <TransformerDiagram np={np} ns={ns} width={W} height={XF_H} />
      </View>
    </View>
  );
}
