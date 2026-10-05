/**
 * ONE SAXOPHONE, READY FOR A LESSON: a row (saxSpec.ts) in both postures,
 * compiled to one engine model with STANDING and SEATED variants
 * (mergeVariants: the horn and the upper body are shared; the legs, the
 * floor and the chair differ).
 */
import type { InstrumentModel, ViewBox } from '../../../engine/model/types.ts';
import { mergeVariants } from '../bowed/bowedModel.ts';
import type { SaxRow } from './saxSpec.ts';
import { anchorsOf, saxPosture, type SaxAnchors, type SaxPosture } from './saxPosture.ts';
import { saxModel } from './saxModel.ts';

export type SaxFamily = {
  row: SaxRow;
  STANDING: SaxPosture;
  SEATED: SaxPosture;
  A: SaxAnchors;
  MODEL: InstrumentModel;
};

export const SAX_VARIANT_IDS = ['standing', 'seated'] as const;

export function saxFamily(row: SaxRow, views: { side: ViewBox; top: ViewBox }, blurbs: { standing: string; seated: string }): SaxFamily {
  const STANDING = saxPosture(row, 'standing');
  const SEATED = saxPosture(row, 'seated');
  const variants = [
    { id: 'standing', label: 'STANDING', blurb: blurbs.standing },
    { id: 'seated', label: 'SEATED', blurb: blurbs.seated },
  ];
  const opts = { id: row.id, name: row.name, views, variants };
  const MODEL = mergeVariants([
    { variant: 'standing', model: saxModel(STANDING, opts) },
    { variant: 'seated', model: saxModel(SEATED, opts) },
  ]);
  return { row, STANDING, SEATED, A: anchorsOf(STANDING), MODEL };
}
