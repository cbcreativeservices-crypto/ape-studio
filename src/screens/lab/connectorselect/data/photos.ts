/**
 * Connector Select — photographs for Station 1 (the stripped cable) and
 * Station 4 (the eight cut-end cross-sections, keyed by SectionKind). Owner's
 * exports (assets/exports, 2026-09-25) converted to bundled WebP, 1024 × 559.
 * The vector drawings stay: they carry the labels and tap zones.
 */
import type { SectionKind } from './practice';

export const PHOTO_ASPECT = 1024 / 559;

export const ANATOMY_PHOTO: number = require('../../../../../assets/lab-art/connector-select/anatomy-cable.webp');

export const SECTION_PHOTO: Record<SectionKind, number> = {
  balanced_pair: require('../../../../../assets/lab-art/connector-select/sections/balanced_pair.webp'),
  instrument: require('../../../../../assets/lab-art/connector-select/sections/instrument.webp'),
  stereo_common: require('../../../../../assets/lab-art/connector-select/sections/stereo_common.webp'),
  speaker: require('../../../../../assets/lab-art/connector-select/sections/speaker.webp'),
  coax75: require('../../../../../assets/lab-art/connector-select/sections/coax75.webp'),
  category: require('../../../../../assets/lab-art/connector-select/sections/category.webp'),
  optical: require('../../../../../assets/lab-art/connector-select/sections/optical.webp'),
  multiconductor: require('../../../../../assets/lab-art/connector-select/sections/multiconductor.webp'),
};
