// artshot example: Screen 20's HANDOFF view (src/screens/lab/dj/pages/p20Pa.tsx)
// — the mixer's rear and the venue stage box, MASTER L/R into DJ L/DJ R over
// the 20 m run. `ARTSHOT_CABLE=UNBAL` (default) shows the unbalanced-lead
// fault; `XLR` the balanced run. Rendered at S pt per mm (0.7 ≈ a phone's 1×).
import { Group } from '@shopify/react-native-skia';
import { SceneFontsProvider } from '../../../src/screens/lab/dj/art/sceneText';
import { HandoffView } from '../../../src/screens/lab/dj/pages/p20Pa';
import { builtBooth } from '../../../src/screens/lab/dj/model/djModel';
import { withVenue } from '../../../src/screens/lab/dj/model/djEvent';
import { MotionContext, useStillMotion } from '../../../src/screens/lab/dj/art/motion';

const S = Number(process.env.ARTSHOT_S ?? 0.7);
const CABLE = (process.env.ARTSHOT_CABLE ?? 'UNBAL') as 'XLR' | 'UNBAL';
const F = { x: -16, y: -36, w: 556, h: 336 }; // H_FRAME
export const size = { width: Math.ceil(F.w * S), height: Math.ceil(F.h * S), scale: 3 };

const booth = withVenue(builtBooth(), { on: true, djL: 'MST_L', djR: 'MST_R', cable: CABLE });

export default function DjHandoff() {
  const motion = useStillMotion();
  return (
    <MotionContext.Provider value={motion}>
    <SceneFontsProvider s={S}>
      <Group transform={[{ scale: S }, { translateX: -F.x }, { translateY: -F.y }]}>
        <HandoffView booth={booth} />
      </Group>
    </SceneFontsProvider>
    </MotionContext.Provider>
  );
}
