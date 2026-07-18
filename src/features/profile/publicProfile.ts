/**
 * Public / networking profile (Booth 2026-07-11) — the commercial user's own
 * details for the employer + networking directory. DEVICE-LOCAL for now: the
 * backend profile table + the employer-visibility consent are FROZEN this
 * session, so this persists to AsyncStorage and the server sync is pending
 * (ROUTE TO GOVERNANCE). We deliberately collect NO sensitive data beyond an
 * email — name, audio interests, and a single contact-consent flag only.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';

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
  email: string;
  interests: string[];
  /** Consent to be listed for employers/networking contact. Default OFF. */
  contactConsent: boolean;
};

export const EMPTY_PUBLIC_PROFILE: PublicProfile = {
  name: '',
  email: '',
  interests: [],
  contactConsent: false,
};

const KEY = 'ape:publicProfile';

export async function loadPublicProfile(): Promise<PublicProfile> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    return raw ? { ...EMPTY_PUBLIC_PROFILE, ...JSON.parse(raw) } : EMPTY_PUBLIC_PROFILE;
  } catch {
    return EMPTY_PUBLIC_PROFILE;
  }
}

export async function savePublicProfile(p: PublicProfile): Promise<void> {
  await AsyncStorage.setItem(KEY, JSON.stringify(p));
}
