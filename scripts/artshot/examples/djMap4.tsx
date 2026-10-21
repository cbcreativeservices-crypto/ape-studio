// artshot example: Screen 4's SYSTEM MAP (src/screens/lab/dj/art/SystemMap.tsx)
// on a wired booth with ONE move applied (ARTSHOT_MOVE="plug>jack", e.g.
// "bth.trsL>mix.phones" or "phones>paL.in"; the jack it lands in frees up, as
// model/djModel connect does). The move's cable is the focus (its flag shows).
// ARTSHOT_S = pt per mm (1.08 ≈ FULL SCREEN 3×); ARTSHOT_CROP="x,y,w,h" (map mm,
// patch band before PATCH_DY) frames part of the map.
import { Group } from '@shopify/react-native-skia';
import { SceneFontsProvider } from '../../../src/screens/lab/dj/art/sceneText';
import { MotionContext, useStillMotion } from '../../../src/screens/lab/dj/art/motion';
import { SystemMap } from '../../../src/screens/lab/dj/art/SystemMap';
import { BUILT_PLUGS, PLUG_IDS, builtBooth, type JackId, type PlugId } from '../../../src/screens/lab/dj/model/djModel';
import { PATCH_DY } from '../../../src/screens/lab/dj/geometry/dressGeometry';

const S = Number(process.env.ARTSHOT_S ?? 1.08);
const [mp, mj] = (process.env.ARTSHOT_MOVE ?? 'bth.trsL>mix.phones').split('>') as [PlugId, JackId];
const crop = (process.env.ARTSHOT_CROP ?? '-8,330,1056,510').split(',').map(Number);
const F = { x: crop[0], y: crop[1] + PATCH_DY, w: crop[2], h: crop[3] };
export const size = { width: Math.ceil(F.w * S), height: Math.ceil(F.h * S), scale: 2 };

const base = builtBooth();
const plugs = { ...BUILT_PLUGS } as Record<PlugId, JackId | null>;
for (const q of PLUG_IDS) if (q !== mp && plugs[q] === mj) plugs[q] = null;
plugs[mp] = mj;
const booth = { ...base, plugs };

export default function DjMap4() {
  const motion = useStillMotion();
  return (
    <MotionContext.Provider value={motion}>
      <SceneFontsProvider s={S}>
        <Group transform={[{ scale: S }, { translateX: -F.x }, { translateY: -F.y }]}>
          <SystemMap booth={booth} last={null} flow={false} flagFor={(p) => p === mp} focus={[mp]} dimRest />
        </Group>
      </SceneFontsProvider>
    </MotionContext.Provider>
  );
}
