/**
 * Feedback / report helper (Booth 2026-07-11). Opens the user's mail composer
 * pre-filled — it never SENDS on the user's behalf; the user reviews and sends.
 * Used for: suggest a correction (auto-tagged with the term), report a bug,
 * suggest a new term, definition fixes, next-version feature suggestions, and
 * per-item error reports (flashcards, homework, etc.).
 *
 * EVERY submission should carry enough data to hunt the item down (owner
 * 2026-08-13): pass a `context` map with ids/topic/method/section. The helper
 * also auto-appends the platform + app version. The user still edits/sends.
 */
import { Linking, Platform } from 'react-native';
import Constants from 'expo-constants';

export const SUPPORT_EMAIL = 'profechano@yahoo.com';

export type FeedbackKind = 'bug' | 'term' | 'definition' | 'suggestion' | 'correction';

/** Locating data appended as a labelled block so the owner can find the exact
 *  item. Null/empty entries are dropped. */
export type FeedbackContext = Record<string, string | number | null | undefined>;

const SUBJECT: Record<FeedbackKind, string> = {
  bug: 'Bug report',
  term: 'Suggest a new term',
  definition: 'Definition fix',
  suggestion: 'Feature suggestion (next version)',
  correction: 'Suggest a correction',
};

/** Open the mail composer for a feedback kind. `tag` auto-labels the subject
 *  (e.g. the glossary term the user is looking at) so it's clear what it's
 *  about; `context` adds a machine-locating details block to the body. */
export function sendFeedback(kind: FeedbackKind, tag?: string, context?: FeedbackContext): void {
  const version = Constants.expoConfig?.version ?? '0.0.0';
  const subject = tag ? `${SUBJECT[kind]} — ${tag}` : SUBJECT[kind];

  // Locating block — caller-supplied fields first, then platform/version always.
  const detailLines = [
    ...Object.entries(context ?? {})
      .filter(([, v]) => v != null && `${v}`.trim() !== '')
      .map(([k, v]) => `${k}: ${v}`),
    `Platform: ${Platform.OS}`,
    `App version: v${version}`,
  ];
  const details = `\n\n— Details (please keep so we can locate this) —\n${detailLines.join('\n')}`;

  const body =
    (tag ? `Regarding: ${tag}\n\n` : '') +
    'Please describe your feedback here:\n\n\n' +
    details +
    '\n\nThank you for your support!';
  const url = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  Linking.openURL(url).catch(() => {});
}
