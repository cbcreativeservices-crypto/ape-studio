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

/** Learning-goal options (personalizes recommendations; optional). */
export const LEARNING_GOALS = ['Career', 'College', 'Church', 'Hobby', 'Studio', 'Broadcast'] as const;
/** Preferred difficulty (optional). */
export const DIFFICULTY_LEVELS = ['Beginner', 'Intermediate', 'Advanced'] as const;

export type PublicProfile = {
  name: string;
  email: string;
  interests: string[];
  /** One interest promoted as the user's PRIMARY focus (user request 2026-07-18). */
  primaryInterest: string;
  /** Optional very-short biography (user request 2026-07-18). */
  bio: string;
  /** Optional learning preferences that personalize recommendations. */
  learningGoal: string;
  difficulty: string;
  /** Consent to be listed for employers/networking contact. Default OFF. */
  contactConsent: boolean;
};

export const EMPTY_PUBLIC_PROFILE: PublicProfile = {
  name: '',
  email: '',
  interests: [],
  primaryInterest: '',
  bio: '',
  learningGoal: '',
  difficulty: '',
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
