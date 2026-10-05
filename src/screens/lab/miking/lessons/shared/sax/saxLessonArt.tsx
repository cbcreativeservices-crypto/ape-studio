/**
 * A saxophone lesson's ART (charter §2 layer 3), from the family: the scene
 * (the horn and the player, standing or seated), the part labels with their
 * leaders, the taps, the face-on figure for ORIENT, and the family's own
 * HOW IT SOUNDS and WHERE IT SITS pages.
 */
import type { VariantId, ViewId } from '../../../engine/model/types.ts';
import type { LessonArt } from '../../../engine/scene/sceneTypes.ts';
import { partIn } from '../bowed/bowedModel.ts';
import { makeSaxInstrument, makeSaxPortrait, saxHitTest, saxLabels } from './SaxArt';
import { makeSaxSoundPage, type SaxSoundConfig } from './SaxSoundPage';
import { makeSaxSettingPage, type SaxSettingConfig } from './SaxSettingPage';
import type { SaxFamily } from './saxFamily.ts';

export function makeSaxLessonArt(F: SaxFamily, opts: { figureA11y: string; sound: Omit<SaxSoundConfig, 'row'>; setting: Omit<SaxSettingConfig, 'P'> }): LessonArt {
  const pose = (v: VariantId) => (v === 'seated' ? F.SEATED : F.STANDING);
  return {
    Instrument: makeSaxInstrument(F.STANDING, F.SEATED),
    labels: (view: ViewId, variant: VariantId) => saxLabels(pose(variant), view),
    hitTest: (view, variant, u, v, tol) => {
      const id = saxHitTest(pose(variant), view, u, v, tol);
      return id ? partIn(F.MODEL, id, variant) : null;
    },
    labelsYieldToMic: true,
    figure: makeSaxPortrait(F.row, opts.figureA11y),
    pages: {
      sound: makeSaxSoundPage({ row: F.row, ...opts.sound }),
      setting: makeSaxSettingPage({ P: F.STANDING, ...opts.setting }),
    },
  };
}
