// artshot example: the Gain Staging lab's drawn chain (gain/gainGear.tsx —
import type React from 'react';
// StageGear + StageLink), laid out the way ChainStage (gainViz.tsx) lays the
// columns out on a 375-pt phone (glass 341 pt, 10-pt padding, seven equal
// column wraps, a 10-pt link or spacer, the gear centred in its column, the
// signal-path trace on the gear's centre line). artshot has no flexbox, so
// the columns are placed by hand at the same widths.
import { View } from 'react-native';
import * as gear from '../../../src/screens/lab/gain/gainGear';
import { computeChain, type Stage } from '../../../src/screens/lab/gain/gainEngine';

const T = Number(process.env.ARTSHOT_T ?? 1.6); // 1 = the gear's real on-glass size
const GEAR_H = 36 * T;
const LINK_W = 10 * T;
const COLS = 7;
const WRAP = 46 * T;
export const size = { width: Math.ceil(WRAP * COLS + 4), height: Math.ceil(GEAR_H + 10), scale: 3 };

const stages: Stage[] = [
  { key: 'pre', name: 'Preamp', kind: 'preamp', gain: 30, min: 0, max: 60, adjustable: true },
  { key: 'eq', name: 'EQ', kind: 'eq', gain: -6, min: -12, max: 12, adjustable: true },
  { key: 'comp', name: 'Comp', kind: 'comp', gain: 0, min: -12, max: 12, adjustable: true },
  { key: 'fad', name: 'Fader', kind: 'fader', gain: 0, min: -40, max: 12, adjustable: true },
  { key: 'bus', name: 'Bus', kind: 'bus', gain: 0, min: -40, max: 12, adjustable: true },
  { key: 'out', name: 'Master', kind: 'output', gain: 0, min: -40, max: 12, adjustable: true },
];

const { StageGear, StageLink, GEAR_ASPECT } = gear;
// After GN-R2-03 the mic cable is one lane drawn over both boxes; before it
// did not exist (render the same entry on each tree state).
const MicCableRun = (gear as Record<string, unknown>).MicCableRun as undefined | ((p: { gearW: number; gearH: number; span: number; chevronX: number; hot: boolean }) => React.ReactElement);

export default function GainChainGear() {
  const nodes = computeChain(-30, stages);
  const gw = GEAR_H * GEAR_ASPECT;
  const colW = WRAP - LINK_W;
  const top = 5;
  return (
    <View style={{ position: 'absolute', left: 0, top: 0, width: size.width, height: size.height, backgroundColor: '#0c0d10' }}>
      <View style={{ position: 'absolute', left: 2 + (MicCableRun ? 1.5 * WRAP : WRAP / 2) + LINK_W / 2, top: top + GEAR_H / 2 - 0.75 * T, width: WRAP * (COLS - (MicCableRun ? 2 : 1)), height: 1.5 * T, backgroundColor: '#7a6630' }} />
      {nodes.map((n, i) => {
        const x0 = 2 + i * WRAP;
        return (
          <View key={n.key} style={{ position: 'absolute', left: x0, top, width: WRAP, height: GEAR_H }}>
            {i > 0 ? (
              <View style={{ position: 'absolute', left: 0, top: 0, width: LINK_W, height: GEAR_H }}>
                <StageLink w={LINK_W} h={GEAR_H} cable={i === 1} hot={false} />
              </View>
            ) : null}
            <View style={{ position: 'absolute', left: LINK_W + (colW - gw) / 2, top: 0, width: gw, height: GEAR_H }}>
              <StageGear node={n} w={gw} h={GEAR_H} />
            </View>
          </View>
        );
      })}
      {MicCableRun ? (
        <View style={{ position: 'absolute', left: 2 + (colW - gw) / 2 + LINK_W, top, width: WRAP + gw, height: GEAR_H }}>
          <MicCableRun gearW={gw} gearH={GEAR_H} span={WRAP} chevronX={gw + (colW - gw) / 2 + LINK_W / 2} hot={false} />
        </View>
      ) : null}
    </View>
  );
}
