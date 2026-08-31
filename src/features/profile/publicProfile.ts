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
  fetchMyRegistryName,
  fetchMyRegistryVisible,
  saveMyRegistryName,
  saveMyRegistryVisible,
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

/** Learning-goal options (personalizes recommendations; optional). */
export const LEARNING_GOALS = ['Career', 'College', 'Church', 'Hobby', 'Studio', 'Broadcast'] as const;

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
  /** Optional learning preference that personalizes recommendations. */
  learningGoal: string;
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
  learningGoal: '',
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
  // Visibility is server-truth, not a device preference: the public page's
  // existence must not depend on which phone you last used.
  const visible = await fetchMyRegistryVisible();
  if (visible !== null) local = { ...local, showInRegistry: visible };
  return local;
}

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
export async function setRegistryVisible(on: boolean): Promise<boolean> {
  return saveMyRegistryVisible(on);
}

export async function savePublicProfile(p: PublicProfile): Promise<void> {
  await AsyncStorage.setItem(KEY, JSON.stringify(p));
  // Best-effort, debounced server sync of registryName only. Never awaited into
  // the caller's failure path: a guest or offline user must still be able to
  // edit their profile.
  queueRegistryNameSync(p.registryName);
}
