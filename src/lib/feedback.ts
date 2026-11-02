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
import * as Application from 'expo-application';
import * as Updates from 'expo-updates';
import { notify } from './confirm';
import { reportedTier } from '../features/commercial/memberStanding';
import { registerLocalStoreReset } from '../features/storage/localStoreRegistry';
import { buildDataLine, buildFeedbackSubject, clearFeedbackIdentity, getFeedbackIdentity, makeFeedbackRef, type DataField } from './feedbackTags';
// Re-exported so screens import everything feedback from one place.
export { setFeedbackIdentity, clearFeedbackIdentity, type FeedbackIdentity } from './feedbackTags';

// Sign-out clears the email identity with the other local stores (the next
// account must not inherit the student id or role).
registerLocalStoreReset(clearFeedbackIdentity);

// The academy support inbox — NEVER a personal address (owner rule 2026-09-04).
// Matches the web site's contact address (web/lib/connect.ts, Footer, etc.).
export const SUPPORT_EMAIL = 'info@proaudiotrainingacademy.com';

export type FeedbackKind = 'bug' | 'term' | 'definition' | 'suggestion' | 'correction' | 'question';

/** Locating data appended as a labelled block so the owner can find the exact
 *  item. Null/empty entries are dropped. */
export type FeedbackContext = Record<string, string | number | null | undefined>;

const SUBJECT: Record<FeedbackKind, string> = {
  bug: 'Bug report',
  term: 'Suggest a new term',
  definition: 'Definition fix',
  suggestion: 'Feature suggestion (next version)',
  correction: 'Suggest a correction',
  question: 'Question — I need help', // Help hub "Still need help?" (Pillar C)
};

function safeTimeZone(): string | undefined {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || undefined;
  } catch {
    return undefined;
  }
}

function safeUpdateId(): string {
  try {
    return Updates.updateId ?? 'embedded';
  } catch {
    return 'embedded';
  }
}

/** Open the mail composer for a feedback kind. `tag` auto-labels the subject
 *  (e.g. the glossary term the user is looking at) so it's clear what it's
 *  about; `context` adds a machine-locating details block to the body. */
export function sendFeedback(kind: FeedbackKind, tag?: string, context?: FeedbackContext): void {
  const version = Constants.expoConfig?.version ?? '0.0.0';
  const ref = makeFeedbackRef();
  const subject = buildFeedbackSubject(kind, SUBJECT[kind], ref, tag);

  // Locating block — caller-supplied fields first, then platform/version always.
  const detailLines = [
    ...Object.entries(context ?? {})
      .filter(([, v]) => v != null && `${v}`.trim() !== '')
      .map(([k, v]) => `${k}: ${v}`),
    `Platform: ${Platform.OS}`,
    `App version: v${version}`,
  ];
  // The machine line Gmail filters + the inbox sweep read. LAST line of the
  // Details block. `tier` comes ONLY from the identity (set while signed in), so
  // a signed-out member has no tier= at all; `sid` falls back to a caller's
  // own studentId (Settings passes it from the same read).
  const ctx = context ?? {};
  const identity = getFeedbackIdentity();
  const dataFields: DataField[] = [
    ['ref', ref],
    ['kind', kind],
    ['src', 'app'],
    ['os', Platform.OS],
    ['app', version],
    ['build', Application.nativeBuildVersion],
    ['update', safeUpdateId()],
    ['tier', identity.tier ?? reportedTier()],
    ['sid', identity.studentId ?? (ctx.studentId as string | undefined)],
    ['role', identity.role],
    ['tz', safeTimeZone()],
    ...Object.entries(ctx).filter(([k]) => k !== 'tier' && k !== 'studentId'),
  ];
  detailLines.push(buildDataLine(dataFields));
  const details = `\n\n— Details (please keep so we can locate this) —\n${detailLines.join('\n')}`;

  const body =
    (tag ? `Regarding: ${tag}\n\n` : '') +
    'Please describe your feedback here:\n\n\n' +
    details +
    '\n\nThank you for your support!';
  const url = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  // Don't fail silently if there's no mail app (offline audit 2026-09-09) — tell
  // the user the address so they can still reach support instead of nothing.
  Linking.openURL(url).catch(() => {
    notify('Couldn’t open your mail app', `Please email us at ${SUPPORT_EMAIL} and we’ll help.`);
  });
}
