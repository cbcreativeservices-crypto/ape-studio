/**
 * Cable Install — Stage 5 "THE SORT" reveal photographs, one per
 * CI_SUPPORT_ITEMS id. The photograph is the REAL THING and shows only after
 * the learner has answered (the neutral pictogram is the question; the photo
 * is the reveal — owner 2026-09-25: photos sit alongside the drawings, never
 * instead of them).
 *
 * Delivery (Computer C, prompt package docs/art/APE_LAB_PHOTO_PROMPTS_2026_09_25.md):
 * `assets/exports/group-1-NN-<id>.png` at 1200 × 896 → converted to bundled
 * WebP at `assets/lab-art/cable-install/supports/<id>.webp` (1024 × 764).
 * Add one `require` line per delivered file; an item with no entry shows no
 * photo and the card works exactly as before. test/cableInstallArt.test.ts
 * checks every key is a real item id and every file exists.
 */
export const CI_SUPPORT_ART_ASPECT = 1200 / 896;

export const CI_SUPPORT_ART: Partial<Record<string, number>> = {
  // jhook: require('../../../../../assets/lab-art/cable-install/supports/jhook.webp'),
};
