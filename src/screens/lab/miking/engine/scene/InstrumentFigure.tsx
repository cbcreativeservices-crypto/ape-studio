/**
 * InstrumentFigure — the lesson's own drawing as a STATIC figure on a read
 * step (ORIENT, "What it is"): the same art and labels every page uses, fitted
 * to the reading column. Nothing moves; full screen is the figure's own
 * ExpandableFigure (kit), where everything zooms (D35).
 */
import { useMemo } from 'react';
import { View } from 'react-native';
import { Canvas, Group } from '@shopify/react-native-skia';
import { useStageTextScale, useStageZoom } from '../../../rack/stageAspect';
import { sceneFrame } from '../geometry/contentFrame.ts';
import { layoutArtLabels } from './artLabels.ts';
import { ExpandableFigure } from '../../../kit/ExpandableFigure';
import type { InstrumentModel, VariantId, ViewBox, ViewId } from '../model/types.ts';
import { viewsOf } from '../model/types.ts';
import { fitXform } from '../geometry/frame.ts';
import type { LessonArt } from './sceneTypes.ts';
import { StaticLabels } from './StaticLabels';

function Figure({ art, model, view, variant, w, h, label, box: boxIn }: { art: LessonArt; model: InstrumentModel; view: ViewId; variant: VariantId; w: number; h: number; label: string; box?: ViewBox }) {
  // Labels keep their 1× full-screen size while a zoom step enlarges the
  // drawing (level of detail: more names find clear space as you zoom in).
  const labelScale = Math.max(1, useStageTextScale() / useStageZoom());
  const box = boxIn ?? figureBox(model, variant, view);
  const xf = useMemo(() => fitXform(view, box, w, h, 6), [view, box, w, h]);
  const Instrument = art.Instrument;
  const labels = useMemo(() => layoutArtLabels(art, view, variant, viewsOf(model, variant)[view]!, xf, labelScale, w, h, { model }), [art, view, variant, model, xf, labelScale, w, h]);
  return (
    <View style={{ width: w, height: h }}>
      <Canvas style={{ width: w, height: h }} accessible accessibilityRole="image" accessibilityLabel={label}>
        <Group transform={[{ translateX: xf.ox }, { translateY: xf.oy }, { scale: xf.s }]}>
          <Instrument view={view} variant={variant} />
        </Group>
      </Canvas>
      <StaticLabels labels={labels} xf={xf} scale={labelScale} w={w} laidOut />
    </View>
  );
}

/** The figure's frame: the instrument's content frame (no mic on a figure). */
const figureBox = (model: InstrumentModel, variant: VariantId, view: ViewId): ViewBox => sceneFrame(model, variant, view, false) ?? viewsOf(model, variant)[view]!;

/** `box`: a tighter frame than the lesson's view (a small drum in a wide view). */
export function InstrumentFigure(props: { art: LessonArt; model: InstrumentModel; view: ViewId; variant: VariantId; label: string; badge: string; title: string; box?: ViewBox }) {
  const box = props.box ?? figureBox(props.model, props.variant, props.view);
  const aspect = (box.u1 - box.u0) / (box.v1 - box.v0);
  return <ExpandableFigure badge={props.badge} title={props.title} aspect={aspect} render={(fw: number, fh: number) => <Figure {...props} w={fw} h={fh} />} />;
}
