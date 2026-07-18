/**
 * Feedback / report helper (Booth 2026-07-11). Opens the user's mail composer
 * pre-filled — it never SENDS on the user's behalf; the user reviews and sends.
 * Used for: suggest a correction (auto-tagged with the term), report a bug,
 * suggest a new term, definition fixes, and next-version feature suggestions.
 */
import { Linking } from 'react-native';
import Constants from 'expo-constants';

export const SUPPORT_EMAIL = 'profechano@yahoo.com';

export type FeedbackKind = 'bug' | 'term' | 'definition' | 'suggestion' | 'correction';

const SUBJECT: Record<FeedbackKind, string> = {
  bug: 'Bug report',
  term: 'Suggest a new term',
  definition: 'Definition fix',
  suggestion: 'Feature suggestion (next version)',
  correction: 'Suggest a correction',
};

/** Open the mail composer for a feedback kind. `tag` auto-labels the subject
 *  (e.g. the glossary term the user is looking at) so it's clear what it's about. */
export function sendFeedback(kind: FeedbackKind, tag?: string): void {
  const version = Constants.expoConfig?.version ?? '0.0.0';
  const subject = tag ? `${SUBJECT[kind]} — ${tag}` : SUBJECT[kind];
  const body =
    (tag ? `Regarding: ${tag}\n\n` : '') +
    'Please describe your feedback here:\n\n\n' +
    `— app v${version}\n` +
    'Thank you for your support!';
  const url = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  Linking.openURL(url).catch(() => {});
}
