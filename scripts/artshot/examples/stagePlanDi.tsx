// artshot example: the Miking lab's STAGE PLAN for the speaker (guitar combo)
// lesson — the DI box on the floor behind the combo, its cable into the amp's
// LINE / DI OUT (DI_CABLE_JACKS: lineOut → diIn) — highlighted on 'di'.
// StagePlan is Pressable > View > Canvas + an RN label overlay (StaticLabels);
// artshot's react-native stub emulates the absolute-positioned labels in Skia.
import { StagePlan } from '../../../src/screens/lab/miking/lessons/shared/speakers/StagePlan';
import { DI_CABLE_JACKS } from '../../../src/screens/lab/miking/lessons/shared/speakers/stagePlanModel';
import { SPK_LESSON } from '../../../src/screens/lab/miking/lessons/spk/lesson';

export const size = { width: 390, height: 300, scale: 3 };

if (DI_CABLE_JACKS.di !== 'diIn') throw new Error('expected the DI cable into diIn');

export default function StagePlanDi({ width, height }: { width: number; height: number }) {
  return (
    <StagePlan
      w={width}
      h={height}
      scene="stage"
      wedges={SPK_LESSON.live.wedges}
      highlight="di"
      onTap={() => {}}
      shortOf={(id) => id.toUpperCase()}
      accessibilityLabel="stage plan"
    />
  );
}
