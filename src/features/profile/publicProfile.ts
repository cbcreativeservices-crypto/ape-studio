/**
 * Public / networking profile (Booth 2026-07-11) — the commercial user's own
 * details for the employer + networking directory. DEVICE-LOCAL for now: the
 * backend profile table + the employer-visibility consent are FROZEN this
 * session, so this persists to AsyncStorage and the server sync is pending
 * (ROUTE TO GOVERNANCE). We deliberately collect NO sensitive data beyond an
 * email — name, audio interests, and a single contact-consent flag only.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  fetchMyRegistryListing,
  fetchMyRegistryName,
  saveMyRegistryName,
  setRegistryListing,
} from './api';

/** Audio interest areas the user can flag for networking (multi-select). */
export const INTEREST_TOPICS = [
  'Live Sound',
  'Studio Recording',
  'Mixing',
  'Mastering',
  'Music Production',
  'Podcasting',
  'Broadcast',
  'Film & Game Audio',
  'System Design & Install',
  'RF / Wireless',
  'Audio Networking (Dante)',
  'Live Streaming',
  'DJ',
  'Corporate AV',
  'Education',
  'Sales',
  'Repair & Electronics',
] as const;

export type PublicProfile = {
  name: string;
  /** The name the user wants shown on their public Registry profile (user
   *  request 2026-07-22). Falls back to `name` when blank. */
  registryName: string;
  email: string;
  interests: string[];
  /** One interest promoted as the user's PRIMARY focus (user request 2026-07-18). */
  primaryInterest: string;
  /** Optional very-short biography (user request 2026-07-18). */
  bio: string;
  /** Consent to be listed for employers/networking contact. Default OFF. */
  contactConsent: boolean;
  /** User opt-in to appear in the public Pro Registry directory (user request
   *  2026-07-23). Can only be turned ON once name + registryName + email are
   *  filled; must be ON for the user to be shown. Default OFF. */
  showInRegistry: boolean;
};

export const EMPTY_PUBLIC_PROFILE: PublicProfile = {
  name: '',
  registryName: '',
  email: '',
  interests: [],
  primaryInterest: '',
  bio: '',
  contactConsent: false,
  showInRegistry: false,
};

const KEY = 'ape:publicProfile';

export async function loadPublicProfile(): Promise<PublicProfile> {
  let local: PublicProfile = EMPTY_PUBLIC_PROFILE;
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (raw) local = { ...EMPTY_PUBLIC_PROFILE, ...JSON.parse(raw) };
  } catch {
    local = EMPTY_PUBLIC_PROFILE;
  }
  // registryName is the ONE field that is server-backed (2026-08-29): the
  // printed certificate and the public QR verifier must resolve to the same
  // name, and it has to survive a reinstall. The server copy wins when present;
  // a guest or an offline read falls back to the device value.
  const remote = await fetchMyRegistryName();
  noteSyncedRegistryName(remote);
  if (remote) local = { ...local, registryName: remote };
  // The LISTING is server-truth, not a device preference: the public page's
  // existence — and its contents — must not depend on which phone you last
  // used. When a listing exists the server copy IS the published text, so it
  // wins; when there is none, the device draft stands.
  const listing = await fetchMyRegistryListing();
  if (listing) {
    adultConfirmed = listing.adultConfirmed;
    local = { ...local, showInRegistry: listing.listed };
    if (listing.listed) {
      local = {
        ...local,
        bio: listing.bio || local.bio,
        interests: listing.interests.length ? listing.interests : local.interests,
        primaryInterest: listing.primaryInterest || local.primaryInterest,
      };
    }
  }
  return local;
}

/** Whether this account has already attested 18+, so the prompt is asked once. */
let adultConfirmed = false;
export function isAdultConfirmed(): boolean {
  return adultConfirmed;
}

/** Recorded against every consent event so we can show WHAT was agreed to.
 *  Bump whenever the published field set or the disclosure copy changes. */
export const REGISTRY_POLICY_VERSION = '2026-08-30.1';

/* --- registryName server sync (debounced) ---------------------------------
 * ProfileScreen calls savePublicProfile on EVERY keystroke (an immediate
 * device-local write, by design). A naive server push here would mean one
 * UPDATE per character typed. So the server write is coalesced: it fires only
 * after the field has been idle, and only when the value actually changed from
 * what the server already has. AsyncStorage still writes immediately — the
 * local copy stays the UI's source of truth.
 */
const REGISTRY_SYNC_IDLE_MS = 1200;
let registrySyncTimer: ReturnType<typeof setTimeout> | null = null;
let lastSyncedRegistryName: string | null = null;

/** Call after a successful server read so an unchanged value never re-writes. */
function noteSyncedRegistryName(v: string | null): void {
  lastSyncedRegistryName = v;
}

function queueRegistryNameSync(name: string): void {
  const trimmed = name.trim();
  if (!trimmed || trimmed === lastSyncedRegistryName) return;
  if (registrySyncTimer) clearTimeout(registrySyncTimer);
  registrySyncTimer = setTimeout(() => {
    registrySyncTimer = null;
    void saveMyRegistryName(trimmed).then((ok) => {
      if (ok) lastSyncedRegistryName = trimmed;
    });
  }, REGISTRY_SYNC_IDLE_MS);
}

/**
 * Publish / unpublish the registry page. Awaited and returns success, unlike
 * the name sync — this one changes what the public can see, so the UI has to
 * be able to revert the switch when the write fails rather than showing a
 * privacy state the server does not share.
 */
export async function setRegistryVisible(
  on: boolean,
  p: PublicProfile,
  opts?: { adult?: boolean },
): Promise<boolean> {
  const ok = await setRegistryListing({
    on,
    adult: opts?.adult ?? adultConfirmed,
    // Only what the user agreed to publish is sent — never the email, never
    // the private account name, never progress.
    bio: on ? p.bio : undefined,
    interests: on ? p.interests : undefined,
    primaryInterest: on ? p.primaryInterest : undefined,
    policyVersion: REGISTRY_POLICY_VERSION,
  });
  if (ok && on && opts?.adult) adultConfirmed = true;
  return ok;
}

/** Push edited bio/interests to an ALREADY-LISTED profile. No-op when private:
 *  nothing about an unlisted account is ever stored on the server. */
export async function syncRegistryListing(p: PublicProfile): Promise<boolean> {
  if (!p.showInRegistry) return true;
  return setRegistryVisible(true, p);
}

/* --- published-content sync (debounced, same shape as the name sync) ------ */
const LISTING_SYNC_IDLE_MS = 1500;
let listingSyncTimer: ReturnType<typeof setTimeout> | null = null;
let lastSyncedListing = '';

function queueListingSync(p: PublicProfile): void {
  // Compare only the PUBLISHED fields — a keystroke in the private email box
  // must not re-publish the profile.
  const sig = JSON.stringify([p.bio, p.interests, p.primaryInterest]);
  if (sig === lastSyncedListing) return;
  if (listingSyncTimer) clearTimeout(listingSyncTimer);
  listingSyncTimer = setTimeout(() => {
    listingSyncTimer = null;
    void syncRegistryListing(p).then((ok) => {
      if (ok) lastSyncedListing = sig;
    });
  }, LISTING_SYNC_IDLE_MS);
}

export async function savePublicProfile(p: PublicProfile): Promise<void> {
  await AsyncStorage.setItem(KEY, JSON.stringify(p));
  // A LISTED profile's bio/interests are published content, so edits have to
  // reach the public page — debounced the same way, and only while listed.
  // An unlisted profile pushes nothing: the server never holds a draft.
  if (p.showInRegistry) queueListingSync(p);
  // Best-effort, debounced server sync of registryName only. Never awaited into
  // the caller's failure path: a guest or offline user must still be able to
  // edit their profile.
  queueRegistryNameSync(p.registryName);
}
