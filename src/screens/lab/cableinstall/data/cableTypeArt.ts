/**
 * Cable Install — Stage 2 workbench photographs, one per cable type, keyed by
 * the CI_CABLE_TYPES id. Owner's exports (assets/exports, 2026-09-25) converted
 * to bundled WebP at 1024 × 765. `extension` (temporary extension / portable
 * power) has no photograph yet; 2-06 "ac-mains portable cord" is `power`
 * (owner ruling 2026-09-25).
 */
import type { CiCableClass } from './cableTypes';

export const CI_CABLE_ART_ASPECT = 1024 / 765;

export const CI_CABLE_TYPE_ART: Partial<Record<CiCableClass, number>> = {
  mic: require('../../../../../assets/lab-art/cable-install/mic.webp'),
  line: require('../../../../../assets/lab-art/cable-install/line.webp'),
  multipair: require('../../../../../assets/lab-art/cable-install/multipair.webp'),
  unbalanced: require('../../../../../assets/lab-art/cable-install/unbalanced.webp'),
  speaker: require('../../../../../assets/lab-art/cable-install/speaker.webp'),
  power: require('../../../../../assets/lab-art/cable-install/power.webp'),
  network: require('../../../../../assets/lab-art/cable-install/network.webp'),
  poe: require('../../../../../assets/lab-art/cable-install/poe.webp'),
  fiber: require('../../../../../assets/lab-art/cable-install/fiber.webp'),
  coax: require('../../../../../assets/lab-art/cable-install/coax.webp'),
  control: require('../../../../../assets/lab-art/cable-install/control.webp'),
  snake: require('../../../../../assets/lab-art/cable-install/snake.webp'),
  tacfiber: require('../../../../../assets/lab-art/cable-install/tacfiber.webp'),
};
