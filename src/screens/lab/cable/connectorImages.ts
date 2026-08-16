/**
 * connectorImages — reuse of the app's EXISTING glossary term images for the
 * Cable & Connector Lab's connector cards (owner ruling 2026-08-16: the term
 * images already used on flashcards are visually ideal for identification, so
 * the lab reuses them instead of commissioning new drawings).
 *
 * Same public bucket the flashcard term view uses (`glossary-images`), same
 * URL shape as tubeImageUrl — so nothing is bundled, nothing is fetched
 * through a table, and free/signed-out users see the images too (the bucket
 * is public read; only the glossary_media LOOKUP table is membership-gated).
 *
 * Pilot (ts_quarter) approved by owner 2026-08-16; full mapping below.
 * Connectors absent from this map render no image (never a placeholder or
 * stand-in). The 30 missing images are in production — see
 * docs/art/APE_CABLE_NEW_IMAGES_2026_08_16.md; new filenames get added here
 * as the owner uploads them.
 */
import { SUPABASE_URL } from '../../../lib/env';
import type { ConnectorId } from './cableTypes';

/** Bucket filenames VERIFIED live 2026-08-16 (HTTP 200 probe of every entry)
 *  and matched to subjects via the owner's rename manifest
 *  (ape_glossary_media_rename_2026_07_16.json), not by name-guessing. */
const CONNECTOR_IMAGE_FILES: Partial<Record<ConnectorId, string>> = {
  // Core analog
  ts_quarter: 'ts-connector.webp',
  trs_quarter: 'trs-connector.webp',
  trs_35: '3-5mm-connector.webp',
  trrs_35: 'trrs-connector.webp',
  rca: 'rca.webp',
  // Core loudspeaker (generic speakON image = the 2-pole card until the
  // dedicated NL4/NL8 images arrive)
  speakon_nl2: 'speakon.webp',
  banana: 'banana-plug.webp',
  // Core digital / network / control
  ethernet_8p8c: 'gigabit-ethernet.webp',
  bnc: 'bnc-connector.webp',
  toslink: 'toslink.webp',
  hdmi: 'hdmi.webp',
  midi_din5: '5-pin-din.webp', // the MIDI cable plug (manifest: MIDIcable.PNG)
  usb_b: 'usb-b.webp',
  usb_c: 'usb-c.webp',
  // Core power
  mains_wall: 'edison-plug.webp',
  iec_c13_c14: 'iec-connector.webp',
  // Recognition tier
  db25: 'db25.webp',
  cam_type: 'camlock.webp',
};

/** Public Storage URL for a connector image, or null when none is mapped. */
export function connectorImageUrl(id: ConnectorId): string | null {
  const file = CONNECTOR_IMAGE_FILES[id];
  return file ? `${SUPABASE_URL}/storage/v1/object/public/glossary-images/${file}` : null;
}

export function hasConnectorImage(id: ConnectorId): boolean {
  return CONNECTOR_IMAGE_FILES[id] != null;
}
