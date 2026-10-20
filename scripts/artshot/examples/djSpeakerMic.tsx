// artshot example (DJ-R2-12): the powered speaker's REAR panel
// (src/screens/lab/dj/art/gear.tsx) with its MIC · LINE switch on MIC — the
// capstone fault PA_INPUT_MIC — so its ON · LIMIT lights can be checked.
// S pt per mm (≥ 2.25 so the 4 mm legends clear SceneText's 9 pt floor).
import { Group } from '@shopify/react-native-skia';
import { SceneFontsProvider } from '../../../src/screens/lab/dj/art/sceneText';
import { SPEAKER_REAR_H, SPEAKER_REAR_W, SpeakerRear } from '../../../src/screens/lab/dj/art/gear';

const S = Number(process.env.ARTSHOT_S ?? 2.4); // pt per mm
const PAD = 12; // mm
export const size = { width: Math.ceil((PAD * 3 + SPEAKER_REAR_W * 2) * S), height: Math.ceil((PAD * 2 + SPEAKER_REAR_H) * S), scale: 2 };

export default function DjSpeakerMic() {
  return (
    <SceneFontsProvider s={S}>
      <Group transform={[{ scale: S }]}>
        <SpeakerRear x={PAD} y={PAD} on />
        <SpeakerRear x={PAD * 2 + SPEAKER_REAR_W} y={PAD} on mic />
      </Group>
    </SceneFontsProvider>
  );
}
