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
 * COMPLETE 2026-08-16: every one of the 48 connectors now has an image —
 * pre-existing glossary term photos plus the 30 owner-produced additions
 * (owner-uploaded, each URL HTTP-200 verified live 2026-08-16). Connectors
 * absent from this map still render no image (never a placeholder) — the
 * Partial type keeps that contract if a new ConnectorId is ever added.
 */
import { SUPABASE_URL } from '../../../lib/env';
import type { ConnectorId } from './cableTypes';

/** Bucket filenames in `glossary-images`, all VERIFIED live 2026-08-16
 *  (HTTP 200 probe of every entry). Pre-existing term images matched to
 *  subjects via the owner's rename manifest, not name-guessing; the 30
 *  additions identified image-by-image with owner confirmation.
 *  euroblock/opticalcon/mini-xlr are .png (no webp converter at upload);
 *  the rest are .webp. */
const CONNECTOR_IMAGE_FILES: Partial<Record<ConnectorId, string>> = {
  // ── Core analog ──────────────────────────────────────────────────────────
  xlr3: 'xlr-male.webp', // 3-pin XLR; female + full cable also uploaded, single-image card uses the male
  ts_quarter: 'ts-connector.webp',
  trs_quarter: 'trs-connector.webp',
  trs_35: '3-5mm-connector.webp',
  trrs_35: 'trrs-connector.webp',
  rca: 'rca.webp',
  combo_xlr_trs: 'combo-xlr-trs.webp',
  // ── Core loudspeaker ─────────────────────────────────────────────────────
  speakon_nl2: 'speakon.webp', // generic 2-pole speakON
  speakon_nl4: 'speakon-nl4.webp',
  binding_post: 'binding-post.webp',
  banana: 'banana-plug.webp',
  bare_wire: 'bare-wire.webp',
  ts_speaker_legacy: 'speaker-cable-ts.webp', // TS plug on heavy speaker cable
  // ── Core digital / network / control ─────────────────────────────────────
  usb_a: 'usb-a.webp',
  usb_b: 'usb-b.webp',
  usb_micro_b: 'usb-micro-b.webp',
  usb_c: 'usb-c.webp',
  ethernet_8p8c: 'gigabit-ethernet.webp',
  ethercon_style: 'ethercon.webp',
  bnc: 'bnc-connector.webp',
  toslink: 'toslink.webp',
  hdmi: 'hdmi.webp',
  midi_din5: '5-pin-din.webp', // MIDI cable plug (manifest: MIDIcable.PNG)
  // ── Core power ───────────────────────────────────────────────────────────
  mains_wall: 'edison-plug.webp', // NEMA 5-15 plug
  iec_c13_c14: 'iec-connector.webp',
  iec_c19_c20: 'iec-c19.webp',
  iec_c5_c6: 'iec-c5.webp',
  iec_c7_c8: 'iec-c7.webp',
  powercon_xx: 'powercon.webp', // blue power-in (verified female, Neutrik NAC3FCA)
  powercon_true1: 'powercon-true1.webp', // verified Neutrik NAC3FX-W
  dc_barrel: 'dc-barrel.webp',
  usb_c_power: 'usb-c.webp', // reuse USB-C (same connector, power application)
  poe: 'gigabit-ethernet.webp', // reuse Ethernet (same connector, power+data)
  // ── Recognition tier ─────────────────────────────────────────────────────
  tt_bantam: 'tt-bantam.webp',
  quarter_patch: 'patch-plug.webp',
  db25: 'db25.webp',
  edac: 'edac.webp',
  lk_veam: 'multipin-circular.webp',
  euroblock: 'euroblock.png',
  mini_xlr: 'mini-xlr.png', // nickel female (owner ruling 2026-08-16: female, not the black male)
  xlr4: 'xlr-4-pin.webp',
  xlr5: 'xlr-5-pin.webp',
  speakon_nl8: 'speakon-nl8.webp',
  opticalcon_style: 'opticalcon.png',
  nema_twist_lock: 'twist-lock.webp',
  cam_type: 'camlock.webp',
  stage_pin: 'stage-pin.webp',
  socapex_style: 'socapex.webp',
};

/** Public Storage URL for a connector image, or null when none is mapped. */
export function connectorImageUrl(id: ConnectorId): string | null {
  const file = CONNECTOR_IMAGE_FILES[id];
  return file ? `${SUPABASE_URL}/storage/v1/object/public/glossary-images/${file}` : null;
}

export function hasConnectorImage(id: ConnectorId): boolean {
  return CONNECTOR_IMAGE_FILES[id] != null;
}
