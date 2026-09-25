/**
 * Cable Install — Final Inspection "AS FOUND" photographs, one per
 * CI_MISTAKES id. Tapping a numbered marker on the facility drawing opens
 * the finding card; the photograph shows the defect as the inspector would
 * actually see it, above the CLASSIFY / CORRECT steps (the drawing stays the
 * map, the photo is the finding — owner 2026-09-25).
 *
 * Delivery (Computer C, prompt package docs/art/APE_LAB_PHOTO_PROMPTS_2026_09_25.md):
 * `assets/exports/group-5-NN-<id>.png` at 1200 × 896 → converted to bundled
 * WebP at `assets/lab-art/cable-install/defects/<id>.webp` (1024 × 764).
 * Add one `require` line per delivered file; a defect with no entry shows no
 * photo and the card works exactly as before. test/cableInstallArt.test.ts
 * checks every key is a real mistake id and every file exists.
 */
export const CI_DEFECT_ART_ASPECT = 1200 / 896;

export const CI_DEFECT_ART: Partial<Record<string, number>> = {
  // 'on-ceiling-tile': require('../../../../../assets/lab-art/cable-install/defects/on-ceiling-tile.webp'),
};
