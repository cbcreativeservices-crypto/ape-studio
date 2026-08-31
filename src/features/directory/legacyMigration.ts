/**
 * Carrying the old profile into the Audio Community Directory (spec §6.1, and
 * the whole reason for the restructure).
 *
 * WHERE THE OLD DATA ACTUALLY IS. Only `registry_name` and `show_in_registry`
 * ever reached the server, and as of the cut-over no account had either set —
 * the server-side migration finds nothing. The real legacy data is the
 * `ape:publicProfile` blob on each device: name, bio and the flat 17-item
 * interest list. So the migration runs on the CLIENT, once, as an offer the
 * member accepts — never as a silent rewrite of what they publish.
 *
 * WHY A MAPPING TABLE RATHER THAN A COPY. The old list mixed four kinds of
 * fact. "Live Sound" was a domain, "Mixing" an activity, "Dante" a technology,
 * "Corporate AV" a work environment, and "Education" and "Sales" were ROLES
 * wearing a work-area costume. Copying them across would carry the confusion
 * forward, so each old value lands in the concept it actually belongs to —
 * which is why two of them become roles and none of them becomes an area by
 * default.
 *
 * NOTHING HERE PUBLISHES. A migrated profile arrives as an unpublished draft
 * with `needs_identity_review`, because the field set that goes public has
 * changed and consent to the old one is not consent to the new one.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LIMITS, aboutIsSafe, mapLegacyInterests } from './rules';

const LEGACY_KEY = 'ape:publicProfile';
const DONE_KEY = 'ape:directoryMigrated';

type LegacyBlob = {
  name?: string;
  registryName?: string;
  bio?: string;
  interests?: string[];
  primaryInterest?: string;
};

export type LegacyDraft = {
  displayName: string;
  about: string;
  primaryArea: string | null;
  areas: string[];
  specialties: string[];
  roles: string[];
  /** Selections dropped because the new caps are smaller than the old free-for-all. */
  droppedForLimit: string[];
  /** True when the bio carried something the public About field refuses. */
  aboutNeedsEdit: boolean;
};

export async function alreadyMigrated(): Promise<boolean> {
  try {
    return (await AsyncStorage.getItem(DONE_KEY)) === '1';
  } catch {
    return false;
  }
}

export async function markMigrated(): Promise<void> {
  try {
    await AsyncStorage.setItem(DONE_KEY, '1');
  } catch {
    /* a failed flag only means we offer again — harmless */
  }
}

/**
 * Build the proposed draft. Returns null when there is nothing worth carrying
 * over, so the member is never shown an empty "we found your old profile" box.
 */
export async function buildLegacyDraft(): Promise<LegacyDraft | null> {
  let blob: LegacyBlob;
  try {
    const raw = await AsyncStorage.getItem(LEGACY_KEY);
    if (!raw) return null;
    blob = JSON.parse(raw) as LegacyBlob;
  } catch {
    return null;
  }

  const interests = Array.isArray(blob.interests) ? blob.interests : [];
  const bio = (blob.bio ?? '').trim();
  // The old registry name was the CREDENTIAL name. It is a reasonable starting
  // point for a public display name but not the same concept, which is exactly
  // why the profile lands flagged for review rather than discoverable.
  const displayName = (blob.registryName || blob.name || '').trim();
  if (!interests.length && !bio && !displayName) return null;

  const { areas, specialties, roles, primaryArea, dropped } = mapLegacyInterests(
    interests,
    blob.primaryInterest,
  );

  const aboutOk = bio.length > 0 && aboutIsSafe(bio);
  return {
    displayName,
    about: aboutOk ? bio : '',
    primaryArea,
    areas,
    specialties,
    roles,
    droppedForLimit: dropped,
    aboutNeedsEdit: bio.length > 0 && !aboutOk,
  };
}
