/**
 * materialPhotos — the wall materials that have a real reference PHOTO
 * (owner 2026-08-18). In the Wave labs these are NOT shown inline; a photo
 * opens ONLY on LONG-PRESS of that material's chip (via useLabPhoto), wherever
 * the material is selectable (Reflection, Absorption, Room Builder). Materials
 * absent here keep their normal long-press (the guided lesson).
 */
import type { MaterialKey } from './waveEngine';

export const MATERIAL_PHOTOS: Partial<Record<MaterialKey, { file: string; caption: string }>> = {
  foam: {
    file: 'acoustic-foam.webp',
    caption:
      'Acoustic foam — a porous absorber. It turns sound into heat by friction where air-particle velocity is high (about a quarter-wavelength off the wall), so thin foam absorbs highs well but lets bass pass.',
  },
  fiberglass: {
    file: 'fiberglass-panel.webp',
    caption:
      'A rigid fiberglass broadband absorber — thicker and denser than foam, often on an air gap, so it keeps absorbing lower in frequency. Real bass control means thickness and air gaps, not thin panels.',
  },
};
