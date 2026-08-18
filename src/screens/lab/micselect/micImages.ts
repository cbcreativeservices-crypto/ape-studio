/**
 * micImages — reuse the app's glossary term PHOTOS as the Microphone Selection
 * lab's mic visuals (owner ruling 2026-08-17, Option A: replace the code-drawn
 * illustrations with real reference photos). Same public `glossary-images`
 * bucket + URL shape as connectorImages — nothing bundled, nothing gated (the
 * bucket is public read). All 12 MicKinds have a photo: 8 pre-existing term
 * images + 4 Tier-1 additions (dynamic / ribbon / SDC / electret). Every URL
 * HTTP-200 verified 2026-08-17. A kind absent from this map returns null and
 * the caller falls back to the code-drawn MicArt illustration — never a blank.
 */
import { SUPABASE_URL } from '../../../lib/env';
import type { MicKind } from './micSelectData';

const MIC_IMAGE_FILES: Partial<Record<MicKind, string>> = {
  dynamic: 'dynamic-microphone.webp',
  condenser: 'condenser-microphone.webp',
  electret: 'electret-capsule.webp',
  ribbon: 'ribbon-microphone.webp',
  ldc: 'large-diaphragm-microphone.webp',
  sdc: 'small-diaphragm-condenser.webp',
  lav: 'lavalier-microphone.webp',
  headworn: 'headset-microphone.webp',
  shotgun: 'shotgun-microphone.webp',
  boundary: 'boundary-microphone.webp',
  measurement: 'measurement-microphone.webp',
  contact: 'contact-microphone.webp',
};

/** Public bucket URL for a mic kind's photo, or null (caller falls back to MicArt). */
export function micImageUrl(kind: MicKind): string | null {
  const file = MIC_IMAGE_FILES[kind];
  return file ? `${SUPABASE_URL}/storage/v1/object/public/glossary-images/${file}` : null;
}
