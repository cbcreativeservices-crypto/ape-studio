/**
 * Audio Community Forum: the RULES, with no dependencies, so each decision can
 * be unit-tested without booting React Native.
 *
 * None of this is enforcement. Every limit and permission is decided again by
 * the database (forum_post_submit, forum_eligibility). This copy lets the app
 * show the right words and disable a control before the server refuses it. If
 * the two ever disagree, the database wins.
 */
import type {
  AskValues,
  CategoryKind,
  ForumAuthor,
  ForumCategory,
  ForumNotice,
  ForumPost,
  ForumRights,
  ForumTopic,
  TopicKind,
  TopicSort,
  TrackedStatus,
  TrustLevel,
  VerifiedKind,
} from './types.ts';

/* ── Limits (mirrored from forum_settings; the server wins) ──────────── */

export const TITLE_MIN = 5;
export const TITLE_MAX = 150;
export const BODY_MAX = 10000;
export const APPEAL_MAX = 1000;
export const EXCERPT_MAX = 280;
/** Fewer than this and the server's search answers nothing. */
export const SEARCH_MIN = 3;

export const ANNOUNCEMENTS_SLUG = 'announcements';
export const ASK_SLUG = 'ask-the-community';
export const IDEAS_SLUG = 'ideas-requests';
/** The server allows five @mentions in a post (forum_settings). */
export const MENTIONS_MAX = 5;
export const PRO_LOUNGE_GROUP = 'pro_lounge';

/* ── Refusals ────────────────────────────────────────────────────────── */

/** The owner's exact wording (add-on brief, section 5). */
export const PRO_LOUNGE_REFUSAL =
  'Posting here is for academy graduates and verified employers, companies, institutions and instructors.';
export const FORUM_UNREADABLE = 'We could not reach the forum. Check your connection and try again.';
export const FORUM_SIGN_IN = 'Sign in to use the forum.';
export const FORUM_CLOSED = 'The forum is not open yet.';

const REFUSALS: Record<string, string> = {
  sign_in: FORUM_SIGN_IN,
  forum_closed: FORUM_CLOSED,
  pro_lounge_members_only: PRO_LOUNGE_REFUSAL,
  account_restricted: 'Your account cannot post right now. If you think this is a mistake, contact support.',
  muted: 'You can read the forum, but you cannot post for now. Your notices show when you can post again.',
  email_unconfirmed: 'Confirm your email address to post.',
  profile_unpublished: 'Publish your community profile to post. You can do that in My Profile.',
  employer_careers_only:
    'Verified employers without a community profile can post only in Careers & Business and Hiring & Gigs.',
  adult_attestation: 'Confirm that you are 18 or over in My Profile to post.',
  staff_only: 'Only the Academy can start topics here.',
  jobs_employers_careers_only:
    'Only verified employers and institutions can post jobs, and only in Careers & Business or Hiring & Gigs.',
  rate_limited_replies: 'You are posting very quickly. Wait a little while, then try again.',
  rate_limited_topics: 'You have reached today’s limit for new topics. You can post again tomorrow.',
  rate_limited_reports: 'You have sent a lot of reports this hour. Try again later.',
  links_after_new: 'New members can add links after a few days. Remove the link and post again.',
  too_short: 'Write something first.',
  too_long: 'Your post is too long. Keep it under 10,000 characters.',
  bad_title: `The title needs at least ${TITLE_MIN} characters.`,
  bad_fields: 'Some of the details are missing. Check the form and try again.',
  bad_quote: 'The post you quoted is no longer available. Remove the quote and post again.',
  bad_card: 'That lab cannot be linked. Remove the lab link and post again.',
  too_many_mentions: 'You mentioned too many people. Mention fewer, then post again.',
  locked: 'This topic is closed to new replies.',
  not_found: 'This is no longer available.',
  not_allowed: 'That is not available for this post.',
  not_yours: 'Only the author can do that.',
  no_category: 'That category is no longer available.',
  already_open: 'You already appealed this. A person is reviewing it.',
  bad_reason: 'Choose a reason first.',
  rules_not_accepted: 'Agree to the community rules to post. Read them, tap I AGREE, then try again.',
};

/** The `forum:<code>` a server refusal carries, or null. */
export function refusalCode(message: string | null | undefined): string | null {
  const m = /\bforum:([a-z_]+)/.exec(message ?? '');
  return m ? m[1] : null;
}

/** Plain words for a refusal code. Unknown codes never reach the member raw. */
export function refusalText(code: string | null | undefined): string {
  return (code && REFUSALS[code]) || FORUM_UNREADABLE;
}

/**
 * Words for a server or network message. An anon caller is stopped at the
 * GRANT before any function body runs, which means exactly one thing: no
 * account.
 */
export function forumErrorText(message: string | null | undefined): { error: string; code: string | null } {
  const code = refusalCode(message);
  if (code) return { error: refusalText(code), code };
  // forum-moderate's own 401 says a bare `sign_in` (no `forum:` prefix).
  if (message === 'sign_in') return { error: FORUM_SIGN_IN, code: 'sign_in' };
  if (/permission denied for function/i.test(message ?? '')) return { error: FORUM_SIGN_IN, code: 'sign_in' };
  return { error: FORUM_UNREADABLE, code: null };
}

/**
 * A "sign in" answer is only believed when the phone KNOWS there is no
 * session. A session read that stalled, or one that is present (the token
 * fell back to the anon key for a moment), is an UNKNOWN session: it reads
 * as "could not reach the forum", never as the guest face (house rule).
 */
/**
 * What a session read says about who is here. A stalled or failed read is
 * UNKNOWN. An anonymous Supabase session is nobody (second review
 * 2026-11-07): the forum is for accounts, so it gets the sign-in face.
 */
export function sessionKindOf(session: unknown, timedOut: boolean): 'none' | 'present' | 'unknown' {
  if (timedOut) return 'unknown';
  if (!session || typeof session !== 'object') return 'none';
  const user = (session as { user?: { is_anonymous?: unknown } | null }).user;
  return user?.is_anonymous === true ? 'none' : 'present';
}

export function signInFace(
  result: { error: string; code: string | null },
  session: 'none' | 'present' | 'unknown',
): { error: string; code: string | null } {
  if (result.code !== 'sign_in' || session === 'none') return result;
  return { error: FORUM_UNREADABLE, code: null };
}

/** A lab screen's "Discuss this lab" could not open. */
export const LAB_THREAD_UNREADABLE = 'We could not open this lab’s discussion. Check your connection and try again.';

/** The refusals a member fixes in My Profile. */
export function refusalNeedsProfile(code: string | null | undefined): boolean {
  return code === 'profile_unpublished' || code === 'adult_attestation';
}

/* ── Categories ──────────────────────────────────────────────────────── */

export type DotTone = 'amber' | 'green' | 'blue' | 'steel' | 'purple';

export type CategoryGroup = { slug: string; name: string; categories: ForumCategory[] };

/** Announcements, the Pro Lounge and the rest, in the server's order. */
export function groupCategories(rows: ForumCategory[]): {
  announcements: ForumCategory | null;
  lounge: ForumCategory[];
  groups: CategoryGroup[];
} {
  const sorted = [...rows].sort((a, b) => a.groupSort - b.groupSort || a.sortOrder - b.sortOrder);
  const groups: CategoryGroup[] = [];
  for (const c of sorted) {
    if (c.groupSlug === 'pinned' || c.groupSlug === PRO_LOUNGE_GROUP) continue;
    const last = groups[groups.length - 1];
    if (last && last.slug === c.groupSlug) last.categories.push(c);
    else groups.push({ slug: c.groupSlug, name: c.groupName, categories: [c] });
  }
  return {
    announcements: sorted.find((c) => c.slug === ANNOUNCEMENTS_SLUG) ?? null,
    lounge: sorted.filter((c) => c.groupSlug === PRO_LOUNGE_GROUP),
    groups,
  };
}

/** The status light beside a category, as in the approved mockup. */
export function dotOf(c: Pick<ForumCategory, 'slug' | 'groupSlug'>): DotTone {
  if (c.groupSlug === 'learn') return c.slug === ASK_SLUG ? 'amber' : 'green';
  if (c.groupSlug === 'science-listening') return 'blue';
  if (c.groupSlug === 'tech-systems' || c.groupSlug === 'work') return 'steel';
  if (c.groupSlug === 'help-improve-the-app') return 'purple';
  return 'amber';
}

const SHORT_NAMES: Record<string, string> = {
  'Glossary Corrections': 'Glossary',
  'Bug Reports': 'Bugs',
  'Ideas & Requests': 'Ideas',
};

/** The short tag on a topic row: "Live Sound & Events" reads "Live Sound". */
export function shortCategoryName(name: string): string {
  if (SHORT_NAMES[name]) return SHORT_NAMES[name];
  return name.split(/ & |, /)[0];
}

/** A lab thread names its lab: "Labs · Gain Staging". */
export function topicTag(t: Pick<ForumTopic, 'categoryName' | 'labKey' | 'title'>): string {
  if (t.labKey) {
    const lab = labChipText(t.labKey).replace(/ lab$/i, '').replace(/\b[a-z]/g, (c) => c.toUpperCase());
    return `Labs · ${lab}`;
  }
  return shortCategoryName(t.categoryName);
}

export const SORT_LABELS: Record<TopicSort, string> = {
  latest: 'Latest',
  unanswered: 'Unanswered',
  top_week: 'Top this week',
};
export const SORTS: TopicSort[] = ['latest', 'unanswered', 'top_week'];

/* ── People ──────────────────────────────────────────────────────────── */

export type PlateTone = 'graduate' | 'employer' | 'company' | 'institution' | 'instructor';
export type Plate = { label: string; tone: PlateTone };

const VERIFIED_PLATES: Record<VerifiedKind, Plate> = {
  employer: { label: 'EMPLOYER', tone: 'employer' },
  company: { label: 'COMPANY', tone: 'company' },
  institution: { label: 'INSTITUTION', tone: 'institution' },
  instructor: { label: 'INSTRUCTOR', tone: 'instructor' },
};

/** One plate beside a name. A verified account outranks a graduate plate;
 *  a Former member wears neither. Plates show experience, never rank a reply. */
export function plateOf(a: ForumAuthor): Plate | null {
  if (a.former) return null;
  if (a.verifiedKind) return VERIFIED_PLATES[a.verifiedKind] ?? null;
  return a.graduate ? { label: 'GRADUATE', tone: 'graduate' } : null;
}

/** The name a tile's initials come from: "Prof. Channing Booth" reads CB. */
export function badgeName(name: string): string {
  return name.replace(/^(?:Prof|Professor|Dr|Mr|Mrs|Ms)\.?\s+/i, '');
}

export function firstName(name: string): string {
  return name.trim().split(/\s+/)[0] || name;
}

/** The welcoming hint above a newcomer's first post. Never to the author. */
export function firstPostHint(
  opening: Pick<ForumPost, 'isFirstPost' | 'isMine' | 'author'> | null | undefined,
): string | null {
  if (!opening || !opening.isFirstPost || opening.isMine || opening.author.former) return null;
  return `This is ${firstName(opening.author.name)}'s first post. Be welcoming.`;
}

/* ── Time and counts ─────────────────────────────────────────────────── */

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function monthYear(iso: string | null | undefined): string {
  const d = new Date(iso ?? '');
  return Number.isNaN(d.getTime()) ? '' : `${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

/** "12m", "1h", "2d", "3w", then the month. '' for a date that cannot be read. */
export function timeAgo(iso: string | null | undefined, now: number = Date.now()): string {
  const at = new Date(iso ?? '').getTime();
  if (Number.isNaN(at)) return '';
  const min = Math.floor(Math.max(0, now - at) / 60000);
  if (min < 1) return 'now';
  if (min < 60) return `${min}m`;
  const hours = Math.floor(min / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d`;
  if (days < 56) return `${Math.floor(days / 7)}w`;
  return monthYear(iso);
}

/** "4 replies · 12m" on the first row; the rows under it read "7 · 1h". */
export function topicStat(
  t: Pick<ForumTopic, 'replyCount' | 'lastPostAt' | 'createdAt'>,
  spelled: boolean,
  now: number = Date.now(),
): string {
  const n = Math.max(0, t.replyCount);
  const count = spelled ? (n === 0 ? 'No replies' : n === 1 ? '1 reply' : `${n} replies`) : String(n);
  const at = timeAgo(t.lastPostAt ?? t.createdAt, now);
  return at ? `${count} · ${at}` : count;
}

/* ── Tracked topics ──────────────────────────────────────────────────── */

export type StatusTone = 'planned' | 'progress' | 'shipped' | 'review' | 'declined';

const TRACKED: Record<TrackedStatus, { label: string; tone: StatusTone }> = {
  under_review: { label: 'UNDER REVIEW', tone: 'review' },
  planned: { label: 'PLANNED', tone: 'planned' },
  in_progress: { label: 'IN PROGRESS', tone: 'progress' },
  shipped: { label: 'SHIPPED', tone: 'shipped' },
  accepted: { label: 'ACCEPTED', tone: 'shipped' },
  declined: { label: 'DECLINED', tone: 'declined' },
};

/**
 * The status stamp and the line under it. The server has one free-text reason
 * and no version column, so a shipped reason written "v1.1: Now in Settings"
 * gives the stamp "SHIPPED · v1.1" and the line "Now in Settings". Anything
 * else is shown as written.
 */
export function trackedFace(
  status: TrackedStatus | null | undefined,
  reason?: string | null,
): { stamp: string; tone: StatusTone; foot: string | null } | null {
  if (!status || !TRACKED[status]) return null;
  const { label, tone } = TRACKED[status];
  const text = (reason ?? '').trim();
  if (status === 'shipped') {
    const m = /^(v\d+(?:\.\d+)*)\s*:\s*(.*)$/i.exec(text);
    if (m) return { stamp: `${label} · ${m[1]}`, tone, foot: m[2].trim() || null };
    return { stamp: label, tone, foot: text || null };
  }
  return { stamp: label, tone, foot: text ? `Staff: ${text}` : null };
}

/** One vote per member, sorted by votes; ties go to the newer idea. */
export function sortIdeas<T extends Pick<ForumTopic, 'voteCount' | 'createdAt'>>(rows: T[]): T[] {
  return [...rows].sort(
    (a, b) => b.voteCount - a.voteCount || (a.createdAt < b.createdAt ? 1 : a.createdAt > b.createdAt ? -1 : 0),
  );
}

/** Move a vote on one row, from the count the server answered with. */
export function applyVote<T extends Pick<ForumTopic, 'id' | 'voteCount' | 'myVote'>>(
  rows: T[],
  id: string,
  on: boolean,
  count: number,
): T[] {
  return rows.map((r) => (r.id === id ? { ...r, myVote: on, voteCount: count } : r));
}

/* ── Thread order ────────────────────────────────────────────────────── */

const postTime = (p: Pick<ForumPost, 'publishedAt' | 'createdAt'>) => p.publishedAt ?? p.createdAt;

/**
 * The opening post first. In a Q&A category: the Solution, then most Helpful,
 * then oldest. Everywhere else a conversation reads top to bottom, so Helpful
 * never moves a post. My own unpublished posts sit at the end.
 *
 * Runs on each read, never on a tap: a post must not move under a finger.
 */
export function orderPosts<T extends ForumPost>(posts: T[], qa: boolean): T[] {
  const rank = (p: T) => (p.isOpening ? 0 : p.modState !== 'published' ? 3 : qa && p.isSolution ? 1 : 2);
  return [...posts].sort((a, b) => {
    const r = rank(a) - rank(b);
    if (r !== 0) return r;
    if (qa && a.helpfulCount !== b.helpfulCount) return b.helpfulCount - a.helpfulCount;
    const at = postTime(a);
    const bt = postTime(b);
    return at < bt ? -1 : at > bt ? 1 : 0;
  });
}

/* ── Posting forms ───────────────────────────────────────────────────── */

export const ASK_LABELS = { trying: 'TRYING TO', gear: 'GEAR', tried: 'TRIED' } as const;
type AskKey = keyof typeof ASK_LABELS;
const ASK_KEYS = Object.keys(ASK_LABELS) as AskKey[];

/**
 * The guided answers live in the post BODY, as labelled lines. `forum_post_edit`
 * cannot change a topic's stored fields while the moderator still reads them,
 * so a problem left in a field could never be fixed by Edit and Repost.
 */
export function composeAskBody(v: Pick<AskValues, AskKey>): string {
  return ASK_KEYS.map((k) => ({ k, text: v[k].trim() }))
    .filter((x) => x.text)
    .map((x) => `${ASK_LABELS[x.k]}: ${x.text}`)
    .join('\n');
}

/** The labelled lines back out of a body, or null for a plain post. */
export function parseAskBody(body: string): Pick<AskValues, AskKey> | null {
  const out: Pick<AskValues, AskKey> = { trying: '', gear: '', tried: '' };
  let current: AskKey | null = null;
  let found = false;
  for (const line of body.split(/\r?\n/)) {
    const key = ASK_KEYS.find((k) => line.startsWith(`${ASK_LABELS[k]}: `));
    if (key) {
      current = key;
      found = true;
      out[key] = line.slice(ASK_LABELS[key].length + 2);
    } else if (current) {
      out[current] += `\n${line}`;
    } else if (line.trim()) {
      return null;
    }
  }
  return found ? out : null;
}

export type AskFormKind = 'question' | 'discussion' | 'idea' | 'glossary' | 'bug';

/** Which form a category asks for. */
export function askFormOf(c: Pick<ForumCategory, 'kind' | 'trackedKind'>): AskFormKind {
  if (c.kind === 'qa') return 'question';
  if (c.kind === 'tracked' && c.trackedKind) return c.trackedKind;
  return 'discussion';
}

export const EMPTY_ASK: AskValues = {
  title: '',
  trying: '',
  gear: '',
  tried: '',
  body: '',
  area: '',
  term: '',
  current: '',
  proposed: '',
  reason: '',
  source: '',
};

/** Why the form cannot be posted yet, or null. */
export function askProblem(form: AskFormKind, v: AskValues): string | null {
  const title = v.title.trim().length;
  if (title < TITLE_MIN) return `The title needs at least ${TITLE_MIN} characters.`;
  if (title > TITLE_MAX) return `Keep the title under ${TITLE_MAX} characters.`;
  if (form === 'question' && !v.trying.trim()) return 'Say what you are trying to do.';
  if ((form === 'discussion' || form === 'idea' || form === 'bug') && !v.body.trim()) return 'Write something first.';
  if (form === 'glossary') {
    if (!v.term.trim()) return 'Name the term.';
    if (!v.proposed.trim()) return 'Add the text you propose.';
    if (!v.reason.trim()) return 'Say why it should change.';
    if (!v.source.trim()) return 'Add a source.';
  }
  return null;
}

export type TopicDraft = { title: string; body: string; topicKind: TopicKind; fields: Record<string, unknown> };

/** The form's answers as the server wants them. */
export function topicFrom(
  form: AskFormKind,
  v: AskValues,
  device: { appVersion: string; device: string } = { appVersion: '', device: '' },
): TopicDraft {
  const title = v.title.trim();
  if (form === 'question') return { title, body: composeAskBody(v), topicKind: 'question', fields: {} };
  if (form === 'idea') {
    return { title, body: v.body.trim(), topicKind: 'idea', fields: v.area ? { area: v.area } : {} };
  }
  if (form === 'bug') {
    return {
      title,
      body: v.body.trim(),
      topicKind: 'bug',
      fields: { app_version: device.appVersion, device: device.device },
    };
  }
  if (form === 'glossary') {
    const term = v.term.trim();
    const current = v.current.trim();
    const proposed = v.proposed.trim();
    const reason = v.reason.trim();
    const source = v.source.trim();
    const lines = [
      `Term: ${term}`,
      current ? `Current text: ${current}` : '',
      `Proposed text: ${proposed}`,
      `Reason: ${reason}`,
      `Source: ${source}`,
    ].filter(Boolean);
    return { title, body: lines.join('\n'), topicKind: 'glossary', fields: { term, current, proposed, reason, source } };
  }
  return { title, body: v.body.trim(), topicKind: 'discussion', fields: {} };
}

/**
 * Ask a question: which categories this member may start a topic in, and what
 * to say when it is none, or when the one they came for is refused. A form
 * with nothing to post into is never shown as if it could post.
 */
export function askChoices(
  categories: ForumCategory[],
  rights: Pick<ForumRights, 'slug' | 'canStartTopic' | 'reason'>[] | null,
  slug: string | undefined,
): { open: ForumCategory[]; refusal: string | null; refusalCode: string | null; wantedRefused: boolean } {
  const rightOf = (s: string) => rights?.find((r) => r.slug === s) ?? null;
  const open = categories.filter((c) => !c.staffOnlyTopics && (rightOf(c.slug)?.canStartTopic ?? true));
  const wanted = slug ? rightOf(slug) : null;
  const wantedRefused = !!slug && !!wanted && !wanted.canStartTopic;
  if (open.length === 0) {
    const reason = wanted?.reason ?? rights?.find((r) => !r.canStartTopic && r.reason)?.reason ?? null;
    return { open, refusal: refusalText(reason), refusalCode: reason, wantedRefused };
  }
  if (wantedRefused) return { open, refusal: refusalText(wanted?.reason), refusalCode: wanted?.reason ?? null, wantedRefused };
  return { open, refusal: null, refusalCode: null, wantedRefused };
}

/** A lab's key from its name: "Feedback Lab" is `feedback-lab`. */
export function labKeyOf(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

/** The chip's words, from the key alone: card text is not moderated, so a
 *  thread never prints text a client sent inside a card. */
export function labChipText(key: string): string {
  const words = key.replace(/[-_]+/g, ' ').trim();
  return words ? words[0].toUpperCase() + words.slice(1) : '';
}

/** Up to three plain words from a title, for the glossary match. */
export function glossaryWords(title: string): string[] {
  const stop = new Set([
    'about', 'after', 'audio', 'because', 'could', 'does', 'from', 'have', 'into', 'just', 'like', 'make', 'much',
    'should', 'sound', 'sounds', 'that', 'them', 'then', 'there', 'they', 'this', 'what', 'when', 'where', 'which',
    'while', 'with', 'would', 'your',
  ]);
  const words = title.toLowerCase().match(/[a-z0-9]{4,}/g) ?? [];
  return [...new Set(words.filter((w) => !stop.has(w)))].sort((a, b) => b.length - a.length).slice(0, 3);
}

/**
 * The excerpt sent with a quote. The server needs an exact substring of the
 * post, so it is cut from the body and never reworded or given an ellipsis.
 */
export function quoteExcerpt(body: string): string {
  const text = body.trim();
  if (text.length <= EXCERPT_MAX) return text;
  const cut = text.slice(0, EXCERPT_MAX);
  const space = cut.lastIndexOf(' ');
  return (space > 80 ? cut.slice(0, space) : cut).trimEnd();
}

/** What the reply box does in this topic. */
export const REPLIES_WAIT_FOR_PUBLISH = 'Replies open once your topic is published.';

export function replyBlock(
  topic: { locked: boolean; categoryKind: CategoryKind; modState?: string },
  rights: Pick<ForumRights, 'canReply' | 'reason'> | null,
): { kind: 'open' } | { kind: 'announcements' } | { kind: 'closed'; text: string; code: string | null } {
  if (topic.categoryKind === 'announcements') return { kind: 'announcements' };
  // My own topic before it is published (being checked, held or removed): the
  // server refuses every reply to it, so the box is not offered.
  if (topic.modState && topic.modState !== 'published') {
    return { kind: 'closed', text: REPLIES_WAIT_FOR_PUBLISH, code: 'unpublished' };
  }
  if (topic.locked) return { kind: 'closed', text: REFUSALS.locked, code: 'locked' };
  if (rights && !rights.canReply) return { kind: 'closed', text: refusalText(rights.reason), code: rights.reason };
  return { kind: 'open' };
}

/* ── Reports ─────────────────────────────────────────────────────────── */

export const REPORT_REASONS: { key: string; label: string }[] = [
  { key: 'harassment', label: 'Bullying or harassment' },
  { key: 'hate', label: 'Hate' },
  { key: 'spam', label: 'Spam' },
  { key: 'self_promotion', label: 'Self-promotion' },
  { key: 'unsafe_advice', label: 'Unsafe advice' },
  { key: 'off_topic', label: 'Off topic' },
  { key: 'privacy', label: 'Private information' },
  { key: 'sexual', label: 'Sexual content' },
  { key: 'threat', label: 'A threat' },
  { key: 'self_harm', label: 'Someone may be at risk' },
  { key: 'child_safety', label: 'Child safety' },
  { key: 'other', label: 'Something else' },
];

/* ── Moderation: what the AUTHOR sees ────────────────────────────────── */

const RULE_LABELS: Record<string, string> = {
  respect: 'RESPECT',
  harassment: 'HARASSMENT',
  hate: 'HATE',
  sexual: 'SEXUAL CONTENT',
  threat: 'SAFETY',
  self_harm: 'SAFETY',
  child_safety: 'CHILD SAFETY',
  spam: 'SPAM',
  self_promotion: 'SELF-PROMOTION',
  privacy: 'PRIVACY',
  piracy: 'PIRACY',
  unsafe_advice: 'SAFE ADVICE',
  beginner_shaming: 'WELCOME',
  impersonation: 'IMPERSONATION',
  off_topic: 'ON-TOPIC',
};

/** "RESPECT RULE", or null when no rule applies. */
export function ruleLabel(rule: string | null | undefined): string | null {
  return rule && RULE_LABELS[rule] ? `${RULE_LABELS[rule]} RULE` : null;
}

const REPORTS_RULE = 'reports_pending_review';
const NOT_EDITABLE_RULES = ['child_safety', 'threat', 'self_harm'];

export type ModFace =
  | { kind: 'none' }
  | { kind: 'review'; head: string; text: string; canEdit: boolean; crisis: boolean }
  | {
      kind: 'removed';
      head: string;
      text: string;
      excerpt: string;
      canEdit: boolean;
      canAppeal: boolean;
      /** A self-harm case: the crisis words stay with the card whatever the outcome. */
      crisis: boolean;
      /** The line under the card. A post may have been decided by a person, so it
       *  never claims the AI decided it; it says only what is true for every case. */
      how: string | null;
    };

/** The neutral line every hold puts on a post (the posting check, the cap, the
 *  owner's hold, the word filter). A please-edit note is anything else. */
export const HOLD_SENTENCE = 'Your post is waiting for a review.';
/** What forum_report puts on a post (and its notice) hidden by member reports. */
export const HIDDEN_FOR_REVIEW = 'This post is hidden while it is reviewed.';
export const APPEAL_LINE = 'An appeal goes to a person.';

const noun = (p: Pick<ForumPost, 'isOpening'>) => (p.isOpening ? 'post' : 'reply');

export function excerptOf(body: string): string {
  const t = body.trim().replace(/\s+/g, ' ');
  return t.length > 140 ? `${t.slice(0, 140).trimEnd()}…` : t;
}

/** Nobody else's post ever shows any of this. */
export function moderationFace(p: ForumPost): ModFace {
  if (!p.isMine) return { kind: 'none' };
  const urgent = p.urgentCategory;
  const crisis = urgent === 'self_harm' || p.modRule === 'self_harm';
  const rule = ruleLabel(p.modRule);

  if (p.modState === 'published') {
    if (p.pendingState === 'pending' || p.pendingState === 'held') {
      return {
        kind: 'review',
        head: 'EDIT BEING REVIEWED',
        text: 'Others see your earlier version until this edit is reviewed.',
        canEdit: false,
        crisis,
      };
    }
    if (p.pendingState === 'blocked') {
      return {
        kind: 'removed',
        head: rule ? `EDIT NOT PUBLISHED · ${rule}` : 'EDIT NOT PUBLISHED',
        text: p.modReason ?? 'This edit was not published. Others still see your earlier version.',
        excerpt: excerptOf(p.pendingBody ?? ''),
        canEdit: true,
        canAppeal: true,
        crisis,
        how: APPEAL_LINE,
      };
    }
    return { kind: 'none' };
  }
  if (p.modState === 'pending') {
    return {
      kind: 'review',
      head: 'BEING REVIEWED',
      text: `Your ${noun(p)} is waiting for a quick review before others can see it. Only you can see it for now.`,
      canEdit: false,
      crisis,
    };
  }
  if (p.modState === 'held') {
    return {
      kind: 'review',
      head: 'BEING REVIEWED',
      text: p.modReason ?? `Your ${noun(p)} is waiting for a review. Only you can see it for now.`,
      // Once the server sends `please_edit` (SERVER_GAPS row 29), that flag is
      // the answer. Before it, a "please edit" note carries its own words and a
      // plain hold (by the AI, the cap or the owner) says the neutral
      // HOLD_SENTENCE and waits for a person.
      canEdit:
        p.pleaseEdit === true || p.pleaseEdit === false
          ? p.pleaseEdit && !urgent && !NOT_EDITABLE_RULES.includes(p.modRule ?? '')
          : !urgent &&
            !!p.modRule &&
            p.modRule !== 'none' &&
            !NOT_EDITABLE_RULES.includes(p.modRule) &&
            !!p.modReason &&
            p.modReason !== HOLD_SENTENCE,
      crisis,
    };
  }
  if (p.modState === 'hidden' && p.modRule === REPORTS_RULE) {
    return {
      kind: 'review',
      head: 'BEING REVIEWED',
      text: p.modReason ?? 'This post is hidden while it is reviewed.',
      canEdit: false,
      crisis,
    };
  }
  if (p.modState === 'blocked' || p.modState === 'hidden') {
    return {
      kind: 'removed',
      head: rule ? `REMOVED · ${rule}` : 'REMOVED',
      text: p.modReason ?? `This ${noun(p)} was removed.`,
      excerpt: excerptOf(p.body),
      canEdit: p.modState === 'blocked' && !urgent,
      canAppeal: urgent !== 'child_safety',
      crisis,
      how: urgent === 'child_safety' ? null : APPEAL_LINE,
    };
  }
  return { kind: 'none' };
}

/**
 * Whether ··· offers Edit on my post: exactly when forum_post_edit would take
 * it (never a removed post, never one held for an urgent review).
 */
export function editAllowed(p: Pick<ForumPost, 'isMine' | 'modState' | 'urgentCategory'>): boolean {
  return p.isMine && p.modState !== 'hidden' && !p.urgentCategory;
}

export type NoticeFace = {
  tone: 'hold' | 'removed' | 'good' | 'plain';
  head: string;
  text: string;
  excerpt: string | null;
  canEdit: boolean;
  canAppeal: boolean;
  crisis: boolean;
  /** Says whether automation was used (EU DSA, and the owner's plan). */
  how: string | null;
};

export function noticeFace(n: ForumNotice): NoticeFace {
  const rule = ruleLabel(n.rule);
  const how = n.automated ? 'Reviewed automatically by AI. An appeal goes to a person.' : 'Reviewed by a person.';
  const base = { excerpt: n.excerpt, canEdit: false, canAppeal: false, crisis: n.rule === 'self_harm', how };
  switch (n.kind) {
    case 'held':
      return {
        ...base,
        tone: 'hold',
        head: 'BEING REVIEWED',
        text: n.message ?? 'Your post is waiting for a review. Only you can see it for now.',
        how: null,
      };
    case 'please_edit':
      return {
        ...base,
        tone: 'removed',
        head: rule ? `PLEASE EDIT · ${rule}` : 'PLEASE EDIT',
        text: n.message ?? 'Please edit this post so it can be published.',
        canEdit: true,
        canAppeal: true,
      };
    case 'blocked':
      return {
        ...base,
        tone: 'removed',
        head: rule ? `REMOVED · ${rule}` : 'REMOVED',
        text: n.message ?? 'This post was removed.',
        canEdit: true,
        canAppeal: true,
      };
    case 'hidden':
      // Hidden by member reports, waiting for a review: not a removal yet, and
      // no AI has looked at it. The server after the 2026-11-07 package stores
      // that notice with its own rule (SERVER_GAPS row 30); before it, the
      // sentence and no rule are how it is recognized.
      if (n.rule === REPORTS_RULE || (n.message === HIDDEN_FOR_REVIEW && !n.rule)) {
        return { ...base, tone: 'hold', head: 'BEING REVIEWED', text: HIDDEN_FOR_REVIEW, how: null };
      }
      return {
        ...base,
        tone: 'removed',
        head: rule ? `REMOVED · ${rule}` : 'REMOVED',
        text: n.message ?? 'This post was removed.',
        canAppeal: n.rule !== 'child_safety',
      };
    case 'warning':
      return { ...base, tone: 'hold', head: rule ? `WARNING · ${rule}` : 'WARNING', text: n.message ?? '' };
    case 'mute':
      return { ...base, tone: 'hold', head: 'READ ONLY FOR NOW', text: n.message ?? '' };
    case 'restored':
      return { ...base, tone: 'good', head: 'VISIBLE AGAIN', text: n.message ?? 'Your post is visible again.', how: null };
    case 'appeal_decided':
      return { ...base, tone: 'plain', head: 'YOUR APPEAL', text: n.message ?? '', how: null };
    default:
      return { ...base, tone: 'plain', head: 'NOTICE', text: n.message ?? '', how: null };
  }
}

/** After a post: did it go up, is it waiting, or was it refused? */
export function outcomeKind(state: string): 'published' | 'review' | 'removed' {
  if (state === 'published') return 'published';
  if (state === 'blocked' || state === 'edit_blocked' || state === 'hidden') return 'removed';
  return 'review';
}

/* ── Topic rows ──────────────────────────────────────────────────────── */

/** Spoken for a screen reader: the row in one sentence. */
export function topicA11y(t: ForumTopic): string {
  const parts = [t.title, t.labKey && t.author.former ? null : `by ${t.author.name}`, topicTag(t)].filter(
    (x): x is string => !!x,
  );
  if (t.solved) parts.push('solved');
  if (t.isNewMember) parts.push('new member');
  parts.push(t.replyCount === 1 ? '1 reply' : `${t.replyCount} replies`);
  return parts.join(', ');
}

/**
 * The blue dot on a topic row. `unread` is true for every topic a member has
 * never opened, so a new member saw a dot on nearly everything (SERVER_GAPS row
 * 16). Once the server sends `ever_read`, the dot is for new replies in a topic
 * the member has read before. A server without it keeps today's dot.
 */
export function showsUnreadDot(t: Pick<ForumTopic, 'unread' | 'everRead'>): boolean {
  return t.unread && t.everRead !== false;
}

/** The Pro Lounge feed: every lounge category, newest activity first. */
export function mergeTopics(lists: ForumTopic[][]): ForumTopic[] {
  const at = (t: ForumTopic) => t.lastPostAt ?? t.createdAt;
  return lists.flat().sort((a, b) => (at(a) < at(b) ? 1 : at(a) > at(b) ? -1 : 0));
}


/* ── Levels and badges ───────────────────────────────────────────────── */

const LEVELS: Record<TrustLevel, { label: string; mark: string | null; next: string | null }> = {
  new: { label: 'New member', mark: 'NEW', next: 'You become a Member after a few days of reading and a few posts that follow the rules.' },
  member: { label: 'Member', mark: null, next: 'You become a Regular after weeks of helpful replies.' },
  regular: { label: 'Regular', mark: 'REGULAR', next: null },
  leader: { label: 'Leader', mark: 'LEADER', next: null },
};

/** The small mark beside a name. A plain Member wears none. */
export function levelMark(a: Pick<ForumAuthor, 'trust' | 'former'>): string | null {
  if (a.former || !a.trust) return null;
  return LEVELS[a.trust]?.mark ?? null;
}

export function levelFace(trust: TrustLevel | null | undefined): { label: string; next: string | null } | null {
  if (!trust || !LEVELS[trust]) return null;
  return { label: LEVELS[trust].label, next: LEVELS[trust].next };
}

/** The launch set's badges, with what each one means. */
export const BADGE_MEANINGS: Record<string, string> = {
  'first-solution': 'One of your replies was marked as the Solution.',
  mentor: 'Ten of your replies were marked as the Solution.',
  'glossary-contributor': 'One of your glossary corrections was accepted.',
  'bug-hunter': 'A bug you reported was confirmed.',
  welcomer: 'Your replies helped new members with their first questions.',
};

/* ── @mentions ───────────────────────────────────────────────────────── */

export type MentionPerson = { name: string; token: string };

/** The name being typed at the end of the box, or null. */
export function mentionQuery(text: string): string | null {
  const m = /(?:^|\s)@([\p{L}][\p{L}\p{M}.' -]{0,30})?$/u.exec(text);
  if (!m) return null;
  return (m[1] ?? '').trimStart();
}

/** Finish the mention being typed. */
export function applyMention(text: string, name: string): string {
  return text.replace(/(^|\s)@[^@]*$/u, `$1@${name} `);
}

/** The people still named in the text, once each, within the server's limit. */
export function mentionTokensIn(body: string, people: MentionPerson[]): string[] {
  const out: string[] = [];
  for (const p of people) {
    if (body.includes(`@${p.name}`) && !out.includes(p.token)) out.push(p.token);
  }
  return out.slice(0, MENTIONS_MAX);
}

/** Thread people to suggest: others only, once each, closest match first. */
export function mentionMatches(query: string, people: MentionPerson[]): MentionPerson[] {
  const q = query.trim().toLowerCase();
  const seen = new Set<string>();
  return people
    .filter((p) => (seen.has(p.token) ? false : (seen.add(p.token), true)))
    .filter((p) => !q || p.name.toLowerCase().includes(q))
    .sort((a, b) => Number(b.name.toLowerCase().startsWith(q)) - Number(a.name.toLowerCase().startsWith(q)))
    .slice(0, 5);
}

export type BodyPart = { text: string; mention: boolean };

/** Cut "@Maya R." out of a text so it can be drawn as a mention. */
export function splitMentions(text: string, names: string[]): BodyPart[] {
  const known = [...new Set(names)].filter(Boolean).sort((a, b) => b.length - a.length);
  if (known.length === 0) return [{ text, mention: false }];
  const parts: BodyPart[] = [];
  let rest = text;
  for (;;) {
    let at = -1;
    let hit = '';
    for (const n of known) {
      const i = rest.indexOf(`@${n}`);
      if (i >= 0 && (at < 0 || i < at)) {
        at = i;
        hit = `@${n}`;
      }
    }
    if (at < 0) break;
    if (at > 0) parts.push({ text: rest.slice(0, at), mention: false });
    parts.push({ text: hit, mention: true });
    rest = rest.slice(at + hit.length);
  }
  if (rest) parts.push({ text: rest, mention: false });
  return parts;
}

/* ── Bookmarks, unread, corrections ──────────────────────────────────── */

/** "Remind me tomorrow": nine in the morning, the member's own time. */
export function tomorrowMorning(now: Date = new Date()): string {
  const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 9, 0, 0, 0);
  return d.toISOString();
}

/** Where a thread opens, or null to start at the top. */
export function jumpIndex(posts: Pick<ForumPost, 'id'>[], firstUnread: string | null | undefined): number | null {
  if (!firstUnread) return null;
  const i = posts.findIndex((p) => p.id === firstUnread);
  return i > 0 ? i : null;
}

export type CorrectionFace = { head: string; canResolve: boolean; tone: 'plain' | 'good' };

/** A correction reply. Only the corrected post's author may answer it. */
export function correctionFace(
  p: Pick<ForumPost, 'postKind' | 'correctionState'>,
  targetIsMine: boolean,
): CorrectionFace | null {
  if (p.postKind !== 'correction') return null;
  if (p.correctionState === 'accepted') return { head: 'CORRECTION ACCEPTED', canResolve: false, tone: 'good' };
  if (p.correctionState === 'dismissed') return { head: 'CORRECTION DECLINED', canResolve: false, tone: 'plain' };
  return { head: 'SUGGESTED CORRECTION', canResolve: targetIsMine, tone: 'plain' };
}

/** The draft's name: one per reply box, one per Ask form. */
export function draftKey(target: { topicId?: string; slug?: string; correctionOf?: string }): string {
  if (target.correctionOf) return `correct:${target.correctionOf}`;
  if (target.topicId) return `reply:${target.topicId}`;
  return `ask:${target.slug ?? 'new'}`;
}

/* ── Labs ────────────────────────────────────────────────────────────── */

type LabLeafLike = { name: string; route?: string; params?: object; status?: string };

/**
 * The lab a screen belongs to, so "Discuss this lab" and the Ask form's lab
 * link give one key. One route can serve several labs through its params, so
 * the params decide; a lab with no params matches on its route.
 */
export function labNameForRoute(
  leaves: LabLeafLike[],
  route: string,
  params?: Record<string, unknown> | null,
): string | null {
  const live = leaves.filter((l) => l.route === route && l.status !== 'development');
  const exact = live.find(
    (l) =>
      l.params &&
      Object.entries(l.params as Record<string, unknown>).every(([k, v]) => (params ?? {})[k] === v),
  );
  const own = exact ?? live.find((l) => !l.params);
  if (own) return own.name;
  // A screen inside a lab (its modules) belongs to the lab's home. Never the
  // first lab that happens to share the route with other params: the Visual
  // Audio Analysis modules are not "Signal Detective".
  const parent = LAB_PARENT_ROUTES[route];
  if (parent) return labNameForRoute(leaves, parent, null);
  return live.length === 1 && !live[0].params ? live[0].name : null;
}

/**
 * The lab screens the catalog cannot name: each module route and the lab home
 * it belongs to, so "Discuss this lab" on a module's end screen opens the SAME
 * thread as on the lab home (review 2026-11-07: Digital, Gain Staging and the
 * Visual Audio Analysis modules each made a thread of their own).
 */
export const LAB_PARENT_ROUTES: Record<string, string> = {
  AmpModule: 'AmpLab',
  CymaticsModule: 'CymaticsLab',
  DigitalModule: 'DigitalLab',
  EarModule: 'EarTrainingLab',
  EqModule: 'EqLabHome',
  GainModule: 'GainLabHome',
  MeterModule: 'MeterLab',
  WaveModule: 'WaveLab',
  SoundSystemsLearn: 'SoundSystemsLab',
  SoundSystemsBuild: 'SoundSystemsLab',
  SoundSystemsRoute: 'SoundSystemsLab',
  SoundSystemsOperate: 'SoundSystemsLab',
  SoundSystemsTroubleshoot: 'SoundSystemsLab',
  DeEsserLab: 'SmartProcessorsLab',
};

/** A Miking lesson's lab is its family on the Miking hub: `MikingHub` with
 *  `{ lab: <family id> }`. `familyOf` looks the lesson up (registry). */
export function mikingLessonTarget(
  lessonId: unknown,
  familyOf: (id: string) => string | undefined,
): { route: 'MikingHub'; params: { lab: string } } | null {
  const family = typeof lessonId === 'string' ? familyOf(lessonId) : undefined;
  return family ? { route: 'MikingHub', params: { lab: family } } : null;
}

/** Where a lab card opens, or null when the lab is no longer in the catalog. */
export function labForKey(leaves: LabLeafLike[], key: string): LabLeafLike | null {
  return leaves.find((l) => l.route && l.status !== 'development' && labKeyOf(l.name) === key) ?? null;
}

/* ── The owner's queue ───────────────────────────────────────────────── */

const URGENT_LABELS: Record<string, string> = {
  threat: 'THREAT OF VIOLENCE',
  self_harm: 'SELF-HARM RISK',
  child_safety: 'CHILD SAFETY',
};

export function urgentLabel(category: string | null | undefined): string | null {
  return (category && URGENT_LABELS[category]) || null;
}

/** "auto_hide_reports" as words. The queue never shows a machine code. */
export function queueWords(code: string | null | undefined): string {
  return (code ?? '').replace(/^recommend_/, '').replace(/_/g, ' ').trim();
}

/** forum_admin_queue / forum_admin_appeals put this in place of a body they
 *  will not show (child safety). */
export const CHILD_MASK_PREFIX = '[preserved';

/**
 * A child-safety item, from the log row OR the post. The server masks the body
 * when either is child safety, but the row's own `urgent_category` can be null
 * (an older row about the same post: an auto-hide by reports, a hold), so the
 * row alone is not enough (review 2026-11-07, High 1).
 */
export function isChildItem(item: { urgentCategory: string | null; postBody?: string | null }): boolean {
  return item.urgentCategory === 'child_safety' || (item.postBody ?? '').startsWith(CHILD_MASK_PREFIX);
}

const HOLD_ACTIONS = ['hold', 'urgent', 'budget_hold', 'checker_unavailable'];

/** What the server says about a post's waiting edit, once it sends it
 *  (SERVER_GAPS rows 25 and 33). `pendingKnown` is true only when all three
 *  fields came back, so their absence is never read as "no edit". */
export type PendingFields = {
  pendingKnown?: boolean;
  pendingState?: string | null;
  pendingBody?: string | null;
  pendingTitle?: string | null;
};

/**
 * The EDIT a queue item is about, when it is one. Restoring (or overturning an
 * appeal) PUBLISHES a waiting edit, so it must be seen first.
 *
 * Until the server sends the pending fields, an edit is inferred and is never
 * complete: the log excerpt is only the first 280 characters of the body and
 * never the new title (second review 2026-11-07: a short excerpt switched
 * RESTORE back on for a title edit nobody had seen). Inferred edits:
 *  - a hold of any kind on a post that is still published;
 *  - an appeal about a post that is still published (an appeal is only
 *    allowed then because an edit was held or refused).
 * A post hidden by reports may also carry an edit; nothing in the row says so,
 * and the server fix is to drop it at the hide (SERVER_GAPS row 34).
 */
export function pendingEditOf(
  item: { postState: string | null; action: string; mode?: string; excerpt: string | null } & PendingFields,
): { text: string | null; title: string | null; complete: boolean } | null {
  if (item.pendingKnown) {
    if (!item.pendingState) return null;
    return { text: item.pendingBody ?? null, title: item.pendingTitle ?? null, complete: !!item.pendingBody };
  }
  if (item.postState !== 'published') return null;
  if (HOLD_ACTIONS.includes(item.action)) return { text: item.excerpt, title: null, complete: false };
  if (item.mode === 'appeal') return { text: null, title: null, complete: false };
  return null;
}

/**
 * Whether OVERTURN may be offered on an appeal. Overturning restores the post,
 * and a post that is still published was appealed for its EDIT, which the
 * appeals list cannot show yet. The post's state comes from the appeal (once
 * the server sends it: SERVER_GAPS row 33) or from its open queue row; when
 * neither knows, it may be an edit, so OVERTURN waits (second review
 * 2026-11-07, High 1).
 */
export function appealOverturn(
  a: { postBody: string | null; postState?: string | null } & PendingFields,
  queueState: string | null | undefined,
): { overturn: boolean; why: string | null } {
  if (isChildItem({ urgentCategory: null, postBody: a.postBody })) return { overturn: false, why: null };
  if (a.pendingKnown) {
    return a.pendingState && !a.pendingBody
      ? { overturn: false, why: APPEAL_EDIT_UNSEEN }
      : { overturn: true, why: null };
  }
  const state = a.postState ?? queueState ?? null;
  if (state === null) return { overturn: false, why: APPEAL_STATE_UNKNOWN };
  if (state === 'published') return { overturn: false, why: APPEAL_EDIT_UNSEEN };
  return { overturn: true, why: null };
}

/** The edit an appeal is about, when forum_admin_appeals sends it (row 33):
 *  shown before OVERTURN, which publishes it. Never for child safety. */
export function appealEditOf(
  a: { postBody: string | null } & PendingFields,
): { title: string | null; text: string | null } | null {
  if (!a.pendingKnown || !a.pendingState) return null;
  if (isChildItem({ urgentCategory: null, postBody: a.postBody })) return null;
  if ((a.pendingBody ?? '').startsWith(CHILD_MASK_PREFIX)) return null;
  return { title: a.pendingTitle ?? null, text: a.pendingBody ?? null };
}

export const APPEAL_EDIT_UNSEEN =
  'This appeal is about an edit the app cannot show yet, so OVERTURN is off. UPHOLD keeps the decision; the edit stays unpublished.';
export const APPEAL_STATE_UNKNOWN =
  'This appeal may be about an edit the app cannot show, so OVERTURN is off. UPHOLD keeps the decision.';

/** What the queue offers on an item. A child-safety post is never restored or
 *  sent back for editing from here, and an edit is never restored unseen. */
export function queueOffers(
  item: {
    postId: string | null;
    urgentCategory: string | null;
    postBody?: string | null;
    postState?: string | null;
    action?: string;
    mode?: string;
    excerpt?: string | null;
  } & PendingFields,
): {
  restore: boolean;
  hide: boolean;
  pleaseEdit: boolean;
  delete: boolean;
} {
  const has = !!item.postId;
  const child = isChildItem(item);
  const edit = pendingEditOf({
    postState: item.postState ?? null,
    action: item.action ?? '',
    mode: item.mode,
    excerpt: item.excerpt ?? null,
    pendingKnown: item.pendingKnown,
    pendingState: item.pendingState,
    pendingBody: item.pendingBody,
    pendingTitle: item.pendingTitle,
  });
  const unseenEdit = !!edit && !edit.complete;
  return { restore: has && !child && !unseenEdit, hide: has && !child, pleaseEdit: has && !child, delete: has };
}

/** The topic line of a queue item: never for child safety (a title can be the
 *  very text the screen matched), and a link only while the topic is one the
 *  owner can open (forum_topic_get has no admin bypass yet: SERVER_GAPS row 26). */
export function queueTopicFace(item: {
  topicId: string | null;
  topicTitle: string | null;
  urgentCategory: string | null;
  postBody?: string | null;
  postState: string | null;
}): { title: string; link: boolean } | null {
  if (!item.topicTitle || isChildItem(item)) return null;
  return { title: item.topicTitle, link: !!item.topicId && item.postState === 'published' };
}

/** forum_admin_set_tracked_status: "accepted" is for glossary items; a decline needs a reason. */
export function trackedChoices(kind: TopicKind): TrackedStatus[] {
  const base: TrackedStatus[] = ['under_review', 'planned', 'in_progress', 'shipped', 'declined'];
  return kind === 'glossary' ? [...base, 'accepted'] : base;
}

export function trackedProblem(status: TrackedStatus, reason: string, current?: TrackedStatus | null): string | null {
  // The server changes nothing (not even the reason) when the status is the same.
  if (current && status === current) return 'This is already the status. Choose another one to change it.';
  return status === 'declined' && !reason.trim() ? 'Add a reason before you decline this.' : null;
}

/** "$3.20 of the $50.00 cap, 412 checks" for the AI usage line. */
export function aiUsageLine(u: { calls: number; costUsd: number; capUsd: number } | null): string {
  if (!u) return 'No AI use recorded this month.';
  const calls = u.calls === 1 ? '1 check' : `${u.calls} checks`;
  return `$${u.costUsd.toFixed(2)} of the $${u.capUsd.toFixed(2)} cap · ${calls}`;
}


/* ── Review fixes, 2026-11-07 ────────────────────────────────────────── */

/**
 * The words a member reads when the owner warns or mutes them from the queue.
 * forum_user_action shows `p_reason` to the member as it is, so it is always a
 * plain sentence here, never a rule code (review 2026-11-07, Medium 6).
 */
const MEMBER_REASONS: Record<string, string> = {
  respect: 'One of your posts was rude to another member. Criticize the mix, not the person.',
  harassment: 'Some of your posts singled out another member. Leave people alone when they ask.',
  hate: 'One of your posts attacked people for who they are. That is never allowed here.',
  sexual: 'One of your posts had sexual content. Keep the forum about audio.',
  threat: 'One of your posts read as a threat. Threats are never allowed here, even as a joke.',
  self_harm:
    'One of your posts was reviewed by a person for safety. If you are struggling, please reach out to someone you trust.',
  spam: 'Some of your posts read as spam. Post once, on topic, and without ads.',
  self_promotion: 'One of your posts promoted a business outside Careers & Business. Promote your business only there.',
  privacy: 'One of your posts shared someone else’s private details.',
  piracy: 'One of your posts shared pirated software or samples.',
  unsafe_advice: 'One of your posts gave advice that could hurt someone. Point people to a qualified professional instead.',
  beginner_shaming: 'One of your posts put a beginner down. Beginners are welcome here.',
  impersonation: 'One of your posts pretended to be someone else.',
  off_topic: 'Some of your posts were off topic. Keep threads about audio.',
};
export const MEMBER_REASON_DEFAULT = 'One of your posts broke the community rules.';

export function memberReason(rule: string | null | undefined): string {
  return (rule && MEMBER_REASONS[rule]) || MEMBER_REASON_DEFAULT;
}

/** PLEASE EDIT from the queue: why, and what to do. */
export function pleaseEditReason(rule: string | null | undefined): string {
  return `${memberReason(rule)} Please edit it so it can be published.`;
}

/** The reason code account_set_standing stores, which AccountStandingNotice
 *  turns into words: one of its own codes, else `forum`. */
export function standingReasonCode(rule: string | null | undefined): string {
  switch (rule) {
    case 'spam':
      return 'spam';
    case 'harassment':
    case 'hate':
    case 'threat':
      return 'harassment';
    case 'self_promotion':
      return 'solicitation';
    case 'impersonation':
      return 'impersonation';
    default:
      return 'forum';
  }
}

/**
 * Which post a thread's read mark names (forum_mark_read stores THAT post's
 * time). Null when the whole thread was read, so the server uses "now". When
 * only the first page was read, the newest post on it. Never the last post in
 * reading order: a Q&A thread is ordered by Helpful, so its last post can be
 * old, and the newer ones stayed unread for good (review 2026-11-07, Medium 9).
 */
export function readMarkPostId(
  posts: Pick<ForumPost, 'id' | 'publishedAt'>[],
  wholeThread: boolean,
): string | null {
  if (wholeThread) return null;
  let best: Pick<ForumPost, 'id' | 'publishedAt'> | null = null;
  for (const p of posts) {
    if (p.publishedAt && (!best || (best.publishedAt as string) < p.publishedAt)) best = p;
  }
  return best?.id ?? null;
}

/**
 * Everyone @ can name: people in the thread, people picked from the directory
 * search (kept once picked, so the next search does not drop them before the
 * post is sent: review 2026-11-07, Medium 8), and the current search.
 */
export function mentionPeople(
  thread: MentionPerson[],
  picked: MentionPerson[],
  found: MentionPerson[],
): MentionPerson[] {
  const seen = new Set<string>();
  return [...thread, ...picked, ...found].filter((p) => (seen.has(p.token) ? false : (seen.add(p.token), true)));
}

/** "APPEAL SENT" from the server's list as well as this visit's sends. */
export function appealSent(
  postId: string,
  appeals: { postId: string; status: string }[],
  sentHere: string[],
): boolean {
  return sentHere.includes(postId) || appeals.some((a) => a.postId === postId && a.status === 'open');
}

/** The stamp on my own topic before it is published. */
export function topicReviewStamp(t: Pick<ForumTopic, 'isMine' | 'modState'>): 'IN REVIEW' | 'REMOVED' | null {
  if (!t.isMine || t.modState === 'published') return null;
  return t.modState === 'hidden' || t.modState === 'blocked' ? 'REMOVED' : 'IN REVIEW';
}

/**
 * What takes the posting button's place in a category or the Pro Lounge. The
 * Pro Lounge's own words ("Earn a credential") only for that very refusal: a
 * muted graduate, or one whose profile is unpublished, is told their own
 * reason (review 2026-11-07).
 */
export function postingDock(
  rights: Pick<ForumRights, 'slug' | 'proOnly' | 'canStartTopic' | 'reason'>[] | null,
  slug: string | undefined,
  lounge: boolean,
): { kind: 'post' } | { kind: 'pro' } | { kind: 'refusal'; code: string | null } | { kind: 'unknown' } {
  if (!rights) return { kind: 'unknown' };
  const mine = lounge ? rights.filter((r) => r.proOnly) : rights.filter((r) => r.slug === slug);
  if (mine.length === 0) return { kind: 'unknown' };
  if (mine.some((r) => r.canStartTopic)) return { kind: 'post' };
  const reason = mine.find((r) => r.reason)?.reason ?? null;
  return reason === 'pro_lounge_members_only' ? { kind: 'pro' } : { kind: 'refusal', code: reason };
}

/** A post the child-safety screen stopped is never in the thread (the server
 *  keeps it from every list), so the outcome itself must say so. */
export const CHILD_SAFETY_REMOVED = 'This post was removed under our child-safety rule.';
export function hiddenOutcomeNote(o: { urgentCategory: string | null; reason: string | null }): string | null {
  if (o.urgentCategory !== 'child_safety') return null;
  return o.reason || CHILD_SAFETY_REMOVED;
}

/**
 * The name after "MARKED BY" on a Solution. The server's marker once it sends
 * one (SERVER_GAPS row 8): an admin, or a Regular in a lab thread, is not the
 * asker. A server without it: the asker, as before, and nobody for a lab thread.
 */
export function solutionMarker(
  topic: { solutionMarkedByName?: string | null } | null | undefined,
  askerName: string | null,
): string | null {
  return topic?.solutionMarkedByName || askerName || null;
}

/**
 * Names whose @mentions are drawn in a thread: everyone posting in it, and,
 * once the server sends them (row 17), everyone a post mentions.
 */
export function threadMentionNames(posts: Pick<ForumPost, 'author' | 'mentions'>[]): string[] {
  const out = new Set<string>();
  for (const p of posts) {
    out.add(p.author.name);
    for (const m of p.mentions ?? []) out.add(m.name);
  }
  return [...out];
}

/* ── Two server shapes (the 2026-11-07 package) ──────────────────────── */

/**
 * "This server does not have that function, or not with these arguments, yet":
 * PostgREST's PGRST202 (also its answer to an unknown argument name), or
 * Postgres' undefined_function 42883. Every new call falls back on exactly this,
 * and on nothing else: a network failure is told as one.
 */
export function missingFunction(err: { code?: unknown; message?: unknown } | null | undefined): boolean {
  if (!err) return false;
  if (err.code === 'PGRST202' || err.code === '42883') return true;
  const m = typeof err.message === 'string' ? err.message : '';
  return /could not find the function/i.test(m) || /function [\w.]+\(.*\) does not exist/i.test(m);
}

/** Block, when the server cannot block from a post and the author has no profile. */
export const BLOCK_NO_PROFILE = 'You cannot block this member because they have no community profile. You can report the post instead.';

/** The rules agreement is kept on this phone; when the phone refused to keep it
 *  the post is not sent, and the member is told. */
export const RULES_NOT_SAVED = 'Your agreement to the rules could not be saved, so nothing was posted. Try again.';

/**
 * Whether the rules agreement counts as kept. The server's record
 * (forum_rules_accept, SERVER_GAPS row 10) is the one that follows the account;
 * the phone's record is the fallback for a server without it, or a call that
 * did not land. Either one is enough to post: the server itself still refuses
 * with `rules_not_accepted` when its own record is missing and its check is on.
 */
export function rulesKept(device: boolean, server: 'recorded' | 'missing' | 'failed'): boolean {
  return server === 'recorded' || device;
}

/** A post refused because the server has no rules agreement for the account:
 *  the popup is shown again, so I AGREE records it there. */
export function asksForRules(code: string | null | undefined): boolean {
  return code === 'rules_not_accepted';
}
