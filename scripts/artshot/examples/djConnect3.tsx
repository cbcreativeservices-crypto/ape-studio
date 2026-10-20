// artshot example (DJ-R2-09): Screen 3 rear stack (source rear over mixer rear, RCA leads, ground wire)
import { Group, Path, Skia } from '@shopify/react-native-skia';
import { SceneFontsProvider } from '../../../src/screens/lab/dj/art/sceneText';
import { MotionContext, useStillMotion } from '../../../src/screens/lab/dj/art/motion';
import { MixerRear, PlayerRear, TurntableRear, GndPost } from '../../../src/screens/lab/dj/art/RearPanels';
import { CableRun } from '../../../src/screens/lab/dj/art/cables';
import { INK } from '../../../src/screens/lab/dj/art/ink';
import { S3, TT3_INSET, TT3_REAR_W, lane3, run3, groundRun3, ttGnd3, mixJack3 } from '../../../src/screens/lab/dj/geometry/dressGeometry';

const S = Number(process.env.ARTSHOT_S ?? 2.4);
const SRC = (process.env.SRC ?? 'TT') as 'A' | 'TT';
const INTO = (process.env.INTO ?? 'phono') as 'line' | 'phono';
const F = S3.frame;
export const size = { width: Math.ceil(F.w * S), height: Math.ceil(F.h * S), scale: 2 };
export default function E() {
  const motion = useStillMotion();
  const jL = `ch1.${INTO}.L` as any, jR = `ch1.${INTO}.R` as any;
  const runs = (['L', 'R'] as const).map((side) => ({ id: side, kind: 'rca' as const, colour: side === 'L' ? INK.rcaWhite : INK.rcaRed, pts: lane3(SRC, side, side === 'L' ? jL : jR), dense: run3(SRC, side, side === 'L' ? jL : jR), plugged: true, live: true, label: side, dashed: side === 'R', looseSag: 1 }));
  const g = groundRun3();
  const pb = Skia.PathBuilder.Make(); pb.moveTo(g[0][0], g[0][1]); for (const p of g.slice(1)) pb.lineTo(p[0], p[1]);
  const m = mixJack3('gnd');
  return (
    <MotionContext.Provider value={motion}><SceneFontsProvider s={S}>
      <Group transform={[{ scale: S }, { translateX: -F.x }, { translateY: -F.y }]}>
        {SRC === 'A' ? <PlayerRear x={0} y={S3.srcY} on label="DECK A (REAR)" /> : <TurntableRear x={S3.ttX - TT3_INSET} y={S3.srcY} on preamp="PHONO" w={TT3_REAR_W} inset={TT3_INSET} />}
        <MixerRear x={S3.mix.x} y={S3.mix.y} on channelsBelow />
        {SRC === 'TT' ? <Group><Path path={pb.detach()} style="stroke" strokeWidth={1.9} color="#2d6a38" /><GndPost cx={ttGnd3.x} cy={ttGnd3.y} d={7.6} /><GndPost cx={m.x} cy={m.y} d={7.2} /></Group> : null}
        {runs.map((r) => <CableRun key={r.id} r={r as any} />)}
      </Group>
    </SceneFontsProvider></MotionContext.Provider>
  );
}
