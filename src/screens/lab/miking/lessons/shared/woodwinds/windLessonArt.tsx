/**
 * A woodwind lesson's LessonArt, from its layouts and words (one factory for
 * A06–A09b): the scene's instrument and player (WindArt), its labels beside
 * the instrument with leaders, the part under a finger, ORIENT's portrait,
 * and the family's own HOW IT SOUNDS and THE SETTING pages with the section
 * plan. The microphone, placement, studio-or-live, two-mic, troubleshooting
 * and practice pages are the shared ones, in the lesson's own words.
 */
import type { InstrumentModel, VariantId, ViewBox, ViewId } from '../../../engine/model/types.ts';
import type { ArtLabel, LessonArt } from '../../../engine/scene/sceneTypes.ts';
import type { StaticLabel } from '../../../engine/scene/StaticLabels';
import { partIn } from '../bowed/bowedModel.ts';
import { makeWindInstrument, pointLabel, tubeLabel, windHitTest, WindFigure, type LabelSpec } from './WindArt';
import { makeWindSoundPage, type WindSoundConfig } from './WindSoundPage';
import { makeWindSettingPage, type WindSettingConfig } from './WindSettingPage';
import { windPlanFor, type WindPlanConfig } from './WindPlan';
import type { Layout } from './windPosture.ts';

export type PointSpec = { id: string; text: string; short?: string; at: (L: Layout) => { x: number; y: number; z: number }; du: number; dv: number };

export type WindArtConfig = {
  model: InstrumentModel;
  layoutOf: (variant: VariantId) => Layout;
  /** Labels beside the tube, per view (s along the instrument). */
  labels: Record<ViewId, readonly LabelSpec[]>;
  /** Labels for the player and the furniture, per view. */
  points?: Partial<Record<ViewId, readonly PointSpec[]>>;
  portrait: { L: Layout; view?: ViewId; box: ViewBox; labels: readonly StaticLabel[]; a11y: string };
  sound: WindSoundConfig;
  setting: WindSettingConfig;
  plan: WindPlanConfig;
};

export function windLessonArt(c: WindArtConfig): LessonArt {
  const cache = new Map<string, ArtLabel[]>();
  const labels = (view: ViewId, variant: VariantId): ArtLabel[] => {
    const key = `${view}:${variant}`;
    let out = cache.get(key);
    if (!out) {
      const L = c.layoutOf(variant);
      out = [...c.labels[view].map((l) => tubeLabel(L, view, l)), ...(c.points?.[view] ?? []).map((p) => pointLabel(view, p.id, p.text, p.at(L), p.du, p.dv, p.short))];
      cache.set(key, out);
    }
    return out;
  };
  const P = c.portrait;
  const pv = P.view ?? 'side';
  const aspect = (P.box.u1 - P.box.u0) / (P.box.v1 - P.box.v0);
  return {
    Instrument: makeWindInstrument(c.layoutOf),
    labels,
    hitTest: (view, variant, u, v, tol) => {
      const id = windHitTest(c.layoutOf(variant), view, u, v, tol);
      return id ? partIn(c.model, id, variant) : null;
    },
    labelsYieldToMic: true,
    figure: { aspect, render: (w, h) => <WindFigure L={P.L} view={pv} w={w} h={h} box={P.box} labels={[...P.labels]} accessibilityLabel={P.a11y} /> },
    pages: { sound: makeWindSoundPage(c.sound) as never, setting: makeWindSettingPage(c.setting) as never },
    stepCounts: { sound: 4, setting: 3 },
    SettingPlan: windPlanFor(c.plan),
  };
}
