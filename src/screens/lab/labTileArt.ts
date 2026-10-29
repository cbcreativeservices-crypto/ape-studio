/**
 * labTileArt — background art for the lab tiles on the Labs menu (owner
 * 2026-10-28; Advanced Training Labs added 2026-10-29). The owner's images (ape-studio/assets/Lab Tile Images, 1376×768),
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
  // Advanced Training Labs (owner's images 17–63, 2026-10-29). Phase is the owner's
  // replacement #37: the first one had words on it.
  'Beginning Mixing': require('../../../assets/lab-tiles/tr-17-beginning-mixing.webp'),
  'Advanced Mixing': require('../../../assets/lab-tiles/tr-18-advanced-mixing.webp'),
  'Mastering Lab: From Final Mix to Release': require('../../../assets/lab-tiles/tr-19-mastering-lab-from-final-mix-to-release.webp'),
  'Mixing Guides': require('../../../assets/lab-tiles/tr-20-mixing-guides.webp'),
  'Audio Pre-Production': require('../../../assets/lab-tiles/tr-21-audio-pre-production.webp'),
  'Audio Post-Production': require('../../../assets/lab-tiles/tr-22-audio-post-production.webp'),
  'Sound Systems Lab': require('../../../assets/lab-tiles/tr-23-sound-systems-lab.webp'),
  'DJ Systems Lab': require('../../../assets/lab-tiles/tr-24-dj-systems-lab.webp'),
  'Equalizer': require('../../../assets/lab-tiles/tr-25-equalizer.webp'),
  'EQ Lab': require('../../../assets/lab-tiles/tr-26-eq-lab.webp'),
  'Compression': require('../../../assets/lab-tiles/tr-27-compression.webp'),
  'Gate / Expander': require('../../../assets/lab-tiles/tr-28-gate-expander.webp'),
  'Limiter': require('../../../assets/lab-tiles/tr-29-limiter.webp'),
  'Smart Processors Lab': require('../../../assets/lab-tiles/tr-30-smart-processors-lab.webp'),
  'Delay': require('../../../assets/lab-tiles/tr-31-delay.webp'),
  'Reverb': require('../../../assets/lab-tiles/tr-32-reverb.webp'),
  'Chorus': require('../../../assets/lab-tiles/tr-33-chorus.webp'),
  'Flanger': require('../../../assets/lab-tiles/tr-34-flanger.webp'),
  'Phaser': require('../../../assets/lab-tiles/tr-35-phaser.webp'),
  'Distortion': require('../../../assets/lab-tiles/tr-36-distortion.webp'),
  'Phase': require('../../../assets/lab-tiles/tr-37-phase.webp'),
  'Oscillators': require('../../../assets/lab-tiles/tr-38-oscillators.webp'),
  'Noise': require('../../../assets/lab-tiles/tr-39-noise.webp'),
  'Harmonics': require('../../../assets/lab-tiles/tr-40-harmonics.webp'),
  'FM Synthesis': require('../../../assets/lab-tiles/tr-41-fm-synthesis.webp'),
  'Modular Synth': require('../../../assets/lab-tiles/tr-42-modular-synth.webp'),
  'Sound Envelope & Transients Lab': require('../../../assets/lab-tiles/tr-43-sound-envelope-transients-lab.webp'),
  'Stereo Imaging': require('../../../assets/lab-tiles/tr-44-stereo-imaging.webp'),
  'Binaural Panner': require('../../../assets/lab-tiles/tr-45-binaural-panner.webp'),
  'Autotune': require('../../../assets/lab-tiles/tr-46-autotune.webp'),
  'Tuning & Temperament Lab': require('../../../assets/lab-tiles/tr-47-tuning-temperament-lab.webp'),
  'Drum Tuning Lab': require('../../../assets/lab-tiles/tr-48-drum-tuning-lab.webp'),
  'Cymatics Lab: Sound Made Visible': require('../../../assets/lab-tiles/tr-49-cymatics-lab-sound-made-visible.webp'),
  'Harmonograph': require('../../../assets/lab-tiles/tr-50-harmonograph.webp'),
  'Bass Guitar Physics': require('../../../assets/lab-tiles/tr-51-bass-guitar-physics.webp'),
  'Microphone Selection Lab': require('../../../assets/lab-tiles/tr-52-microphone-selection-lab.webp'),
  'Membranophones': require('../../../assets/lab-tiles/tr-53-membranophones.webp'),
  'Idiophones': require('../../../assets/lab-tiles/tr-54-idiophones.webp'),
  'Aerophones': require('../../../assets/lab-tiles/tr-55-aerophones.webp'),
  'Chordophones': require('../../../assets/lab-tiles/tr-56-chordophones.webp'),
  'Voice & Ensemble': require('../../../assets/lab-tiles/tr-57-voice-ensemble.webp'),
  'Foley, Field & Scientific': require('../../../assets/lab-tiles/tr-58-foley-field-scientific.webp'),
  'Sports & Broadcast': require('../../../assets/lab-tiles/tr-59-sports-broadcast.webp'),
  'Speech & Voice Lab': require('../../../assets/lab-tiles/tr-60-speech-voice-lab.webp'),
  'Vacuum Tube Fundamentals': require('../../../assets/lab-tiles/tr-61-vacuum-tube-fundamentals.webp'),
  'Amplifier Principles Lab': require('../../../assets/lab-tiles/tr-62-amplifier-principles-lab.webp'),
  'Ear Training Lab': require('../../../assets/lab-tiles/tr-63-ear-training-lab.webp'),
};

/** Audio Calculator Laboratory: one image per section tile (owner 2026-10-29),
 *  keyed by the section id in calc/registry.ts SECTION_META. */
const CALC_ART: Readonly<Record<string, ImageSourcePropType>> = {
  waves: require('../../../assets/lab-tiles/calc-01-waves.webp'),
  levels: require('../../../assets/lab-tiles/calc-02-levels.webp'),
  spl: require('../../../assets/lab-tiles/calc-03-spl.webp'),
  speakers: require('../../../assets/lab-tiles/calc-04-speakers.webp'),
  mics: require('../../../assets/lab-tiles/calc-05-mics.webp'),
  digital: require('../../../assets/lab-tiles/calc-06-digital.webp'),
  music: require('../../../assets/lab-tiles/calc-07-music.webp'),
  rooms: require('../../../assets/lab-tiles/calc-08-rooms.webp'),
  filters: require('../../../assets/lab-tiles/calc-09-filters.webp'),
  electronics: require('../../../assets/lab-tiles/calc-10-electronics.webp'),
};

/** The tile art for a Calculator Lab section, or undefined (plain glass). */
export function calcTileArt(sectionId: string): ImageSourcePropType | undefined {
  return CALC_ART[sectionId];
}

/** The tile art for a lab, or undefined (plain glass). */
export function labTileArt(labName: string): ImageSourcePropType | undefined {
  return ART[labName];
}

/** The lab names that have art (tests). */
export const LAB_TILE_ART_NAMES: readonly string[] = Object.keys(ART);
