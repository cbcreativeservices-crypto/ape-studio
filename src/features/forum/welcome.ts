/**
 * The forum's first-visit WELCOME (approved by the owner 2026-11-02, text of
 * record: docs/forum/WELCOME_MESSAGE_APPROVED_2026-11-02.md). VERBATIM: a test
 * compares these lines with that file, so a wording change starts there.
 *
 * LEAF, no imports: the pure rule below is unit-tested.
 */
export const WELCOME_TITLE = 'Welcome to the Audio Community Forum';

export const WELCOME_PARAGRAPHS = [
  'Thank you for being here.',
  'We opened the Pro Audio Training Academy in November 2026, and you are one of our very first members. That means a great deal to us.',
  'This forum is brand new, so it is still quiet. Every question you ask, every answer you share and every idea you post helps build it into the place we all want it to be.',
  'As with anything new, a few bugs may still turn up. If you spot one, tell us in Bug Reports; your feedback goes straight into the next update. Thank you for your patience while we get every detail right.',
  "We're glad you're here. Ask your first question, share what you know, and help us make this a welcoming home for everyone who works with sound, or wants to.",
] as const;

export const WELCOME_SIGNATURE = 'Professor Channing Booth';
export const WELCOME_ROLE = 'Founder, Pro Audio Training Academy';
/** The pinned post's author name (owner 2026-11-02). */
export const WELCOME_AUTHOR = 'Prof. Channing Booth';
export const WELCOME_BUTTON = 'ENTER THE FORUM';
export const WELCOME_NOTE = 'You can read this again any time in Announcements.';
/** The month the forum opened: the pinned post's date. */
export const WELCOME_DATE = 'Nov 2026';

/**
 * Once per account. The server's read marker on the pinned post is the per-
 * account truth (it follows the member to a new phone and survives the local
 * wipe at sign-out); the device flag covers the time before that post exists.
 *
 * `readKnown` false: the flag or the forum could not be read. Stay quiet: a
 * member who may already have read it is never interrupted on a guess.
 */
export function welcomeDue(input: {
  forumReady: boolean;
  readKnown: boolean;
  seenHere: boolean;
  /** The pinned post is unread for this account; null while it does not exist. */
  pinnedUnread: boolean | null;
}): boolean {
  if (!input.forumReady || !input.readKnown || input.seenHere) return false;
  return input.pinnedUnread !== false;
}
