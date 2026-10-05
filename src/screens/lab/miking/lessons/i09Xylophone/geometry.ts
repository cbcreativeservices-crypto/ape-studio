/**
 * I09 XYLOPHONE — where things are (charter §2 layer 2): the engine model
 * BUILT by the mallet-bar family (shared/mallets/malletModel.ts) from this
 * lesson's family spec (model.ts), so the art, the hit areas, the collision
 * and the readouts read the same numbers.
 */
import type { InstrumentModel } from '../../engine/model/types.ts';
import { malletGeom, malletModel, type MalletGeom } from '../shared/mallets/malletModel.ts';
import { XYLO_FAM } from './model.ts';

export const XYLO_MODEL: InstrumentModel = malletModel(XYLO_FAM);
export const XYLO_GEOM: MalletGeom = malletGeom(XYLO_FAM);
