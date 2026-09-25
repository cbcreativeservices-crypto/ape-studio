/**
 * Cable Install — Final Inspection "AS FOUND" photographs, one per
 * CI_MISTAKES id. Tapping a numbered marker on the facility drawing opens
 * the finding card; the photograph shows the defect as the inspector would
 * actually see it, above the CLASSIFY / CORRECT steps (the drawing stays the
 * map, the photo is the finding — owner 2026-09-25).
 *
 * Delivery (Computer C, brief docs/art/APE_LAB_PHOTO_BRIEF_v2_2026_09_25.md — one
 * image per Final Inspection FINDING, matching its label and zone):
 * `assets/exports/group-5-NN-<id>.png` at 1200 × 896 → converted to bundled
 * WebP at `assets/lab-art/cable-install/defects/<id>.webp` (1024 × 764).
 * Add one `require` line per delivered file; a defect with no entry shows no
 * photo and the card works exactly as before. test/cableInstallArt.test.ts
 * checks every key is a real mistake id and every file exists.
 */
export const CI_DEFECT_ART_ASPECT = 1200 / 896;

export const CI_DEFECT_ART: Partial<Record<string, number>> = {
  // Computer C delivery 2026-09-25 (assets/group-5-defect-library, d01–d12),
  // converted 1024 wide, q82. Three match their Final Inspection finding
  // (blocked-vent, unlabeled, door-pinch); on-ceiling-tile, foreign-support,
  // jacket-damage and overfilled-pathway are wired for when a surface shows
  // them. Unwired by the owner 2026-09-25 because the photo did not show what
  // the finding label says: crushed-by-tie (d01), sharp-bend (d04),
  // connector-strain (d05), slack-pile (d08), bad-floor-crossing (d10).
  // Their cards are drawing-only until the remakes land
  // (docs/art/APE_DEFECT_PHOTO_REMAKE_BRIEF_2026_09_25.md).
  'on-ceiling-tile': require('../../../../../assets/lab-art/cable-install/defects/on-ceiling-tile.webp'),
  'foreign-support': require('../../../../../assets/lab-art/cable-install/defects/foreign-support.webp'),
  'jacket-damage': require('../../../../../assets/lab-art/cable-install/defects/jacket-damage.webp'),
  'blocked-vent': require('../../../../../assets/lab-art/cable-install/defects/blocked-vent.webp'),
  unlabeled: require('../../../../../assets/lab-art/cable-install/defects/unlabeled.webp'),
  'overfilled-pathway': require('../../../../../assets/lab-art/cable-install/defects/overfilled-pathway.webp'),
  'door-pinch': require('../../../../../assets/lab-art/cable-install/defects/door-pinch.webp'),
};
