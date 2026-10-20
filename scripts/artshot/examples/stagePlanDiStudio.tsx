import { StagePlan } from '../../../src/screens/lab/miking/lessons/shared/speakers/StagePlan';
import { SPK_LESSON } from '../../../src/screens/lab/miking/lessons/spk/lesson';
export const size = { width: 390, height: 300, scale: 3 };
export default function S({ width, height }: { width: number; height: number }) {
  return <StagePlan w={width} h={height} scene="studio" wedges={SPK_LESSON.live.wedges} highlight="di" onTap={() => {}} shortOf={(id) => id.toUpperCase()} accessibilityLabel="studio plan" />;
}
