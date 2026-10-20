// artshot example: the DJ lab's powered-speaker REAR panel and its compact INPUT PLATE
// (src/screens/lab/dj/art/gear.tsx), side by side at S pt per mm (≥ 2.25 so the
// 4 mm legends clear the 9 pt floor of SceneText). DJ-03: the rear and the L plate
// show the MIC · LINE switch on LINE; the R plate on MIC (capstone PA_INPUT_MIC).
import { Group } from '@shopify/react-native-skia';
import { SceneFontsProvider } from '../../../src/screens/lab/dj/art/sceneText';
import { SPEAKER_REAR_H, SPEAKER_REAR_W, SpeakerPlate, SpeakerRear, PLATE_W } from '../../../src/screens/lab/dj/art/gear';

const S = 2.4; // pt per mm
const PAD = 12; // mm
export const size = { width: Math.ceil((PAD * 3 + SPEAKER_REAR_W + PLATE_W) * S), height: Math.ceil((PAD * 2 + SPEAKER_REAR_H) * S), scale: 2 };

export default function DjSpeaker() {
  return (
    <SceneFontsProvider s={S}>
      <Group transform={[{ scale: S }]}>
        <SpeakerRear x={PAD} y={PAD} on />
        <SpeakerPlate x={PAD * 2 + SPEAKER_REAR_W} y={PAD} on title="SPEAKER L · INPUT" live />
        <SpeakerPlate x={PAD * 2 + SPEAKER_REAR_W} y={PAD + 110} on={false} title="SPEAKER R · INPUT" mic />
      </Group>
    </SceneFontsProvider>
  );
}
