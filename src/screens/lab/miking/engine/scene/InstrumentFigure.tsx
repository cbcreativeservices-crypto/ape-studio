/**
 * InstrumentFigure — the lesson's own drawing as a STATIC figure on a read
 * step (ORIENT, "What it is"): the same art and labels every page uses, fitted
 * to the reading column. Nothing moves; full screen is the figure's own
 * ExpandableFigure (kit), where everything zooms (D35).
 */
import { useMemo } from 'react';
import { View } from 'react-native';
import { Canvas, Group } from '@shopify/react-native-skia';
import { useStageTextScale } from '../../../rack/stageAspect';
import { ExpandableFigure } from '../../../kit/ExpandableFigure';
import type { InstrumentModel, VariantId, ViewId } from '../model/types.ts';
import { fitXform } from '../geometry/frame.ts';
import type { LessonArt } from './sceneTypes.ts';
import { StaticLabels } from './StaticLabels';

function Figure({ art, model, view, variant, w, h, label }: { art: LessonArt; model: InstrumentModel; view: ViewId; variant: VariantId; w: number; h: number; label: string }) {
  const textScale = useStageTextScale();
  const box = model.views[view]!;
  const xf = useMemo(() => fitXform(view, box, w, h, 6), [view, box, w, h]);
  const Instrument = art.Instrument;
  return (
    <View style={{ width: w, height: h }}>
      <Canvas style={{ width: w, height: h }} accessible accessibilityRole="image" accessibilityLabel={label}>
        <Group transform={[{ translateX: xf.ox }, { translateY: xf.oy }, { scale: xf.s }]}>
          <Instrument view={view} variant={variant} />
        </Group>
      </Canvas>
      <StaticLabels labels={art.labels(view, variant)} xf={xf} scale={textScale} w={w} />
    </View>
  );
}

export function InstrumentFigure(props: { art: LessonArt; model: InstrumentModel; view: ViewId; variant: VariantId; label: string; badge: string; title: string }) {
  const box = props.model.views[props.view]!;
  const aspect = (box.u1 - box.u0) / (box.v1 - box.v0);
  return <ExpandableFigure badge={props.badge} title={props.title} aspect={aspect} render={(fw: number, fh: number) => <Figure {...props} w={fw} h={fh} />} />;
}
