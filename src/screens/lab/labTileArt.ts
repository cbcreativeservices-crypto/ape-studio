/**
 * labTileArt — background art for the lab tiles on the Labs menu (owner
 * 2026-10-28). The owner's images (ape-studio/assets/Lab Tile Images, 1376×768),
 * resized to 960×536 WebP in assets/lab-tiles. Keyed by the lab's name as it
 * appears in labCatalog.ts; a lab without art keeps the plain glass tile.
 *
 * Kept OUT of labCatalog.ts on purpose: plain node tests import the catalog,
 * and they cannot load image files.
 */
import type { ImageSourcePropType } from 'react-native';

const ART: Readonly<Record<string, ImageSourcePropType>> = {
  // Audio Fundamentals — Sound
  'Understanding Level & Amplitude': require('../../../assets/lab-tiles/fund-01-level-amplitude.webp'),
  'Foundations of Sound': require('../../../assets/lab-tiles/fund-02-foundations-of-sound.webp'),
  'Sound Playground': require('../../../assets/lab-tiles/fund-03-sound-playground.webp'),
  'Microphone Principles': require('../../../assets/lab-tiles/fund-04-microphone-principles.webp'),
  // Acoustics
  'Wave Physics Laboratory': require('../../../assets/lab-tiles/fund-05-wave-physics.webp'),
  'Speaker Placement & Coverage': require('../../../assets/lab-tiles/fund-06-speaker-coverage.webp'),
  'Room Design & Monitoring': require('../../../assets/lab-tiles/fund-07-room-design.webp'),
  // Signal
  'Digital Audio Systems': require('../../../assets/lab-tiles/fund-08-digital-audio.webp'),
  'Visual Audio Analysis': require('../../../assets/lab-tiles/fund-09-visual-analysis.webp'),
  'Signal Chain Builder': require('../../../assets/lab-tiles/fund-10-signal-chain.webp'),
  'Signal Detective': require('../../../assets/lab-tiles/fund-11-signal-detective.webp'),
  'Cable & Connector Fundamentals': require('../../../assets/lab-tiles/fund-12-cable-connector-fundamentals.webp'),
  'Audio Connectors & Cable Selection': require('../../../assets/lab-tiles/fund-13-connector-cable-selection.webp'),
  'Cable Dressing & Installation': require('../../../assets/lab-tiles/fund-14-cable-dressing.webp'),
  'Patchbay Signal Flow & Normalling': require('../../../assets/lab-tiles/fund-15-patchbay.webp'),
  'Gain Staging': require('../../../assets/lab-tiles/fund-16-gain-staging.webp'),
};

/** The tile art for a lab, or undefined (plain glass). */
export function labTileArt(labName: string): ImageSourcePropType | undefined {
  return ART[labName];
}

/** The lab names that have art (tests). */
export const LAB_TILE_ART_NAMES: readonly string[] = Object.keys(ART);
