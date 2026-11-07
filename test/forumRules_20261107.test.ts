/**
 * Audio Community Forum, first slice (owner go 2026-11-07). The rules the
 * screens rest on, and ratchets for the promises that must not drift:
 *  - the welcome is the owner's approved text, word for word;
 *  - a failed read is never shown as "nothing here";
 *  - Helpful moves replies in Q&A only, the Solution stays first, no downvotes;
 *  - what Claude did is shown only to the author, with the rule and a way back;
 *  - the sample can never run in a release build;
 *  - the forum stays off and out of the start graph.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import {
  APPEAL_MAX,
  EMPTY_ASK,
  EXCERPT_MAX,
  FORUM_CLOSED,
  FORUM_SIGN_IN,
  FORUM_UNREADABLE,
  PRO_LOUNGE_REFUSAL,
  REPORT_REASONS,
  TITLE_MIN,
  applyVote,
  askFormOf,
  askProblem,
  badgeName,
  composeAskBody,
  dotOf,
  firstName,
  firstPostHint,
  forumErrorText,
  glossaryWords,
  groupCategories,
  labChipText,
  labKeyOf,
  mergeTopics,
  moderationFace,
  monthYear,
  noticeFace,
  orderPosts,
  outcomeKind,
  parseAskBody,
  plateOf,
  quoteExcerpt,
  refusalCode,
  refusalNeedsProfile,
  refusalText,
  replyBlock,
  ruleLabel,
  shortCategoryName,
  sortIdeas,
  timeAgo,
  topicFrom,
  topicStat,
  topicTag,
  trackedFace,
} from '../src/features/forum/rules.ts';
import {
  authorOf,
  labKeysOf,
  meOf,
  outcomeOf,
  postOf,
  topicOf,
} from '../src/features/forum/mappers.ts';
import {
  FORUM_SAMPLE_STATES,
  SAMPLE_TOPIC,
  sampleForumOn,
  setSampleForum,
  takeSampleOpen,
} from '../src/features/forum/sampleSwitch.ts';
import {
  WELCOME_BUTTON,
  WELCOME_NOTE,
  WELCOME_PARAGRAPHS,
  WELCOME_ROLE,
  WELCOME_SIGNATURE,
  WELCOME_TITLE,
  welcomeDue,
} from '../src/features/forum/welcome.ts';
import type { ForumAuthor, ForumCategory, ForumNotice, ForumPost, ForumTopic } from '../src/features/forum/types.ts';

const read = (p: string) => readFileSync(p, 'utf8').replace(/\r\n/g, '\n');
const code = (p: string) => read(p).replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');

const FORUM_DIRS = ['src/features/forum', 'src/screens/directory/forum'];
const forumFiles = FORUM_DIRS.flatMap((d) => readdirSync(d).map((f) => join(d, f).replace(/\\/g, '/')));

const NOW = Date.parse('2026-11-07T12:00:00Z');
const minutesAgo = (m: number) => new Date(NOW - m * 60000).toISOString();

const author = (over: Partial<ForumAuthor> = {}): ForumAuthor => ({
  name: 'Maya R.',
  token: 'tok',
  verifiedKind: null,
  graduate: false,
  trust: 'member',
  former: false,
  ...over,
});

const post = (over: Partial<ForumPost> = {}): ForumPost => ({
  id: 'p',
  isOpening: false,
  postKind: 'reply',
  body: 'A reply.',
  author: author(),
  isMine: false,
  modState: 'published',
  modReason: null,
  modRule: null,
  pendingState: null,
  pendingBody: null,
  urgentCategory: null,
  isSolution: false,
  helpfulCount: 0,
  thanksCount: 0,
  insightfulCount: 0,
  myReactions: [],
  quotePostId: null,
  quoteExcerpt: null,
  labKeys: [],
  safetyNote: false,
  edited: false,
  isFirstPost: false,
  publishedAt: minutesAgo(10),
  createdAt: minutesAgo(10),
  ...over,
});

const topic = (over: Partial<ForumTopic> = {}): ForumTopic => ({
  id: 't',
  categorySlug: 'ask-the-community',
  categoryName: 'Ask the Community',
  title: 'A title',
  topicKind: 'question',
  author: author(),
  isMine: false,
  modState: 'published',
  trackedStatus: null,
  solved: false,
  replyCount: 0,
  voteCount: 0,
  myVote: false,
  pinned: false,
  locked: false,
  isNewMember: false,
  labKey: null,
  unread: false,
  lastPostAt: minutesAgo(12),
  createdAt: minutesAgo(30),
  ...over,
});

const category = (over: Partial<ForumCategory> = {}): ForumCategory => ({
  slug: 'x',
  name: 'X',
  groupSlug: 'learn',
  groupName: 'Learn',
  groupSort: 2,
  sortOrder: 1,
  kind: 'qa',
  trackedKind: null,
  staffOnlyTopics: false,
  jobsAllowed: false,
  labThreads: false,
  description: null,
  followLevel: null,
  ...over,
});

const notice = (over: Partial<ForumNotice> = {}): ForumNotice => ({
  id: 1,
  postId: 'p',
  kind: 'blocked',
  rule: 'respect',
  excerpt: 'an excerpt',
  message: 'This reply was removed.',
  automated: true,
  expiresAt: null,
  readAt: null,
  createdAt: minutesAgo(5),
  ...over,
});

describe('refusals', () => {
  it('reads the code out of a server message', () => {
    assert.equal(refusalCode('forum:muted'), 'muted');
    assert.equal(refusalCode('P0001: forum:pro_lounge_members_only'), 'pro_lounge_members_only');
    assert.equal(refusalCode('something else'), null);
    assert.equal(refusalCode(undefined), null);
  });

  it("uses the owner's exact Pro Lounge sentence", () => {
    assert.equal(
      refusalText('pro_lounge_members_only'),
      'Posting here is for academy graduates and verified employers, companies, institutions and instructors.',
    );
  });

  it('never shows a raw code, even an unknown one', () => {
    assert.equal(refusalText('some_new_code'), FORUM_UNREADABLE);
    assert.equal(refusalText(null), FORUM_UNREADABLE);
  });

  it('has words for every refusal the live functions can raise', () => {
    const codes = [
      'account_restricted', 'adult_attestation', 'already_open', 'bad_card', 'bad_fields', 'bad_quote', 'bad_title',
      'email_unconfirmed', 'employer_careers_only', 'forum_closed', 'jobs_employers_careers_only', 'links_after_new',
      'locked', 'muted', 'no_category', 'not_allowed', 'not_found', 'not_yours', 'pro_lounge_members_only',
      'profile_unpublished', 'rate_limited_replies', 'rate_limited_reports', 'rate_limited_topics', 'sign_in',
      'staff_only', 'too_long', 'too_many_mentions', 'too_short', 'bad_reason',
    ];
    for (const c of codes) assert.notEqual(refusalText(c), FORUM_UNREADABLE, c);
  });

  it('an anon caller stopped at the grant reads as sign in, not as a broken server', () => {
    assert.deepEqual(forumErrorText('permission denied for function forum_me'), { error: FORUM_SIGN_IN, code: 'sign_in' });
    assert.equal(forumErrorText('TypeError: Failed to fetch').code, null);
    assert.equal(forumErrorText('forum:forum_closed').error, FORUM_CLOSED);
  });

  it('only the profile refusals send a member to My Profile', () => {
    assert.equal(refusalNeedsProfile('profile_unpublished'), true);
    assert.equal(refusalNeedsProfile('adult_attestation'), true);
    assert.equal(refusalNeedsProfile('muted'), false);
    assert.equal(refusalNeedsProfile(null), false);
  });
});

describe('categories', () => {
  const rows = [
    category({ slug: 'bug-reports', name: 'Bug Reports', groupSlug: 'help-improve-the-app', groupName: 'Help', groupSort: 7 }),
    category({ slug: 'announcements', name: 'Announcements', groupSlug: 'pinned', groupName: 'Pinned', groupSort: 0 }),
    category({ slug: 'hiring-gigs', name: 'Hiring & Gigs', groupSlug: 'pro_lounge', groupName: 'Pro Lounge', groupSort: 1, sortOrder: 2 }),
    category({ slug: 'introductions', name: 'Introductions', groupSlug: 'pro_lounge', groupName: 'Pro Lounge', groupSort: 1, sortOrder: 1 }),
    category({ slug: 'ask-the-community', name: 'Ask the Community' }),
    category({ slug: 'new-to-audio', name: 'New to Audio', sortOrder: 3 }),
  ];

  it('splits Announcements and the Pro Lounge from the groups, in server order', () => {
    const g = groupCategories(rows);
    assert.equal(g.announcements?.slug, 'announcements');
    assert.deepEqual(g.lounge.map((c) => c.slug), ['introductions', 'hiring-gigs']);
    assert.deepEqual(g.groups.map((x) => x.slug), ['learn', 'help-improve-the-app']);
    assert.deepEqual(g.groups[0].categories.map((c) => c.slug), ['ask-the-community', 'new-to-audio']);
  });

  it('the status lights follow the mockup', () => {
    assert.equal(dotOf({ slug: 'ask-the-community', groupSlug: 'learn' }), 'amber');
    assert.equal(dotOf({ slug: 'labs-lessons', groupSlug: 'learn' }), 'green');
    assert.equal(dotOf({ slug: 'x', groupSlug: 'science-listening' }), 'blue');
    assert.equal(dotOf({ slug: 'x', groupSlug: 'create-perform' }), 'amber');
    assert.equal(dotOf({ slug: 'x', groupSlug: 'tech-systems' }), 'steel');
    assert.equal(dotOf({ slug: 'x', groupSlug: 'work' }), 'steel');
    assert.equal(dotOf({ slug: 'x', groupSlug: 'help-improve-the-app' }), 'purple');
  });

  it('short tags read as in the mockup', () => {
    assert.equal(shortCategoryName('Live Sound & Events'), 'Live Sound');
    assert.equal(shortCategoryName('Glossary Corrections'), 'Glossary');
    assert.equal(shortCategoryName('Studio, Mixing & Mastering'), 'Studio');
    assert.equal(topicTag({ categoryName: 'Labs & Lessons', labKey: 'gain-staging-lab', title: 'x' }), 'Labs · Gain Staging');
  });
});

describe('people', () => {
  it('one plate; verified outranks graduate; a former member has none', () => {
    assert.equal(plateOf(author()), null);
    assert.equal(plateOf(author({ graduate: true }))?.label, 'GRADUATE');
    assert.equal(plateOf(author({ graduate: true, verifiedKind: 'employer' }))?.label, 'EMPLOYER');
    for (const k of ['company', 'institution', 'instructor'] as const) {
      assert.equal(plateOf(author({ verifiedKind: k }))?.label, k.toUpperCase());
    }
    assert.equal(plateOf(author({ former: true, graduate: true })), null);
  });

  it('the first-post hint is for readers of a newcomer, never for the author', () => {
    const p = post({ isOpening: true, isFirstPost: true, author: author({ name: 'Jordan L.' }) });
    assert.equal(firstPostHint(p), "This is Jordan's first post. Be welcoming.");
    assert.equal(firstPostHint({ ...p, isMine: true }), null);
    assert.equal(firstPostHint({ ...p, isFirstPost: false }), null);
    assert.equal(firstPostHint({ ...p, author: author({ former: true }) }), null);
    assert.equal(firstPostHint(null), null);
  });

  it('names', () => {
    assert.equal(firstName('Jordan L.'), 'Jordan');
    assert.equal(badgeName('Prof. Channing Booth'), 'Channing Booth');
    assert.equal(badgeName('Maya R.'), 'Maya R.');
  });
});

describe('time and counts', () => {
  it('short times, then the month', () => {
    assert.equal(timeAgo(minutesAgo(0.2), NOW), 'now');
    assert.equal(timeAgo(minutesAgo(12), NOW), '12m');
    assert.equal(timeAgo(minutesAgo(60), NOW), '1h');
    assert.equal(timeAgo(minutesAgo(1440), NOW), '1d');
    assert.equal(timeAgo(minutesAgo(1440 * 21), NOW), '3w');
    assert.equal(timeAgo(minutesAgo(1440 * 90), NOW), monthYear(minutesAgo(1440 * 90)));
    assert.equal(timeAgo('not a date', NOW), '');
    assert.equal(timeAgo(null, NOW), '');
  });

  it('the first row spells the count, the rest read compact, and none reads N of total', () => {
    assert.equal(topicStat({ replyCount: 4, lastPostAt: minutesAgo(12), createdAt: minutesAgo(30) }, true, NOW), '4 replies · 12m');
    assert.equal(topicStat({ replyCount: 7, lastPostAt: minutesAgo(60), createdAt: minutesAgo(90) }, false, NOW), '7 · 1h');
    assert.equal(topicStat({ replyCount: 1, lastPostAt: null, createdAt: minutesAgo(5) }, true, NOW), '1 reply · 5m');
    assert.equal(topicStat({ replyCount: 0, lastPostAt: null, createdAt: minutesAgo(5) }, true, NOW), 'No replies · 5m');
  });
});

describe('thread order', () => {
  const opening = post({ id: 'open', isOpening: true, helpfulCount: 0, publishedAt: minutesAgo(100) });
  const solution = post({ id: 'sol', isSolution: true, helpfulCount: 1, publishedAt: minutesAgo(50) });
  const popular = post({ id: 'popular', helpfulCount: 9, publishedAt: minutesAgo(20) });
  const early = post({ id: 'early', helpfulCount: 2, publishedAt: minutesAgo(90) });
  const quiet = post({ id: 'quiet', helpfulCount: 2, publishedAt: minutesAgo(10) });
  const mine = post({ id: 'mine', isMine: true, modState: 'pending', publishedAt: null, createdAt: minutesAgo(200), helpfulCount: 50 });
  const shuffled = [quiet, mine, popular, solution, early, opening];

  it('Q&A: opening, Solution, then most Helpful, then oldest; unpublished last', () => {
    assert.deepEqual(orderPosts(shuffled, true).map((p) => p.id), ['open', 'sol', 'popular', 'early', 'quiet', 'mine']);
  });

  it('discussion: Helpful moves nothing, and a Solution mark is not a thing', () => {
    assert.deepEqual(orderPosts(shuffled, false).map((p) => p.id), ['open', 'early', 'sol', 'popular', 'quiet', 'mine']);
  });

  it('does not change the array it was given', () => {
    const before = [...shuffled];
    orderPosts(shuffled, true);
    assert.deepEqual(shuffled, before);
  });

  it('there are three reactions and no way down', () => {
    const src = code('src/screens/directory/forum/ForumThreadScreen.tsx') + read('src/features/forum/types.ts');
    assert.match(src, /'helpful' \| 'thanks' \| 'insightful'/);
    assert.doesNotMatch(src, /downvote|thumbs.?down|'dislike'/i);
  });

  it('a tap never reorders: order is applied to reads, not to the reaction answer', () => {
    const src = code('src/screens/directory/forum/ForumThreadScreen.tsx');
    assert.equal((src.match(/orderPosts\(/g) ?? []).length, 1);
    assert.match(src, /if \(value\) setPosts\(orderPosts\(/);
  });
});

describe('the guided Ask form', () => {
  const v = { ...EMPTY_ASK, title: 'Vocals sound thin', trying: 'A warmer vocal', gear: 'Condenser → DAW', tried: 'Boosted 200 Hz' };

  it('the answers live in the body, and read back out', () => {
    const body = composeAskBody(v);
    assert.equal(body, 'TRYING TO: A warmer vocal\nGEAR: Condenser → DAW\nTRIED: Boosted 200 Hz');
    assert.deepEqual(parseAskBody(body), { trying: 'A warmer vocal', gear: 'Condenser → DAW', tried: 'Boosted 200 Hz' });
  });

  it('nothing goes in stored fields, because forum_post_edit cannot change them', () => {
    const t = topicFrom('question', v);
    assert.deepEqual(t.fields, {});
    assert.equal(t.topicKind, 'question');
    assert.match(t.body, /Boosted 200 Hz/);
  });

  it('skips an empty answer and keeps a multi-line one', () => {
    const body = composeAskBody({ trying: 'One\nTwo', gear: '', tried: '' });
    assert.equal(body, 'TRYING TO: One\nTwo');
    assert.deepEqual(parseAskBody(body), { trying: 'One\nTwo', gear: '', tried: '' });
  });

  it('a plain post is left alone', () => {
    assert.equal(parseAskBody('Just a post.'), null);
    assert.equal(parseAskBody('Hello\nTRYING TO: x'), null);
  });

  it('each kind of category asks for what the server needs', () => {
    assert.equal(askFormOf(category({ kind: 'qa' })), 'question');
    assert.equal(askFormOf(category({ kind: 'discussion' })), 'discussion');
    assert.equal(askFormOf(category({ kind: 'tracked', trackedKind: 'idea' })), 'idea');
    assert.equal(askFormOf(category({ kind: 'tracked', trackedKind: 'glossary' })), 'glossary');
    assert.equal(askFormOf(category({ kind: 'tracked', trackedKind: 'bug' })), 'bug');
  });

  it('a title and what the form needs, before it can post', () => {
    assert.match(askProblem('question', { ...v, title: 'abc' }) ?? '', new RegExp(String(TITLE_MIN)));
    assert.match(askProblem('question', { ...v, trying: ' ' }) ?? '', /trying/);
    assert.equal(askProblem('question', v), null);
    assert.match(askProblem('discussion', v) ?? '', /Write something/);
    assert.match(askProblem('glossary', { ...v, term: 'Haas', proposed: 'x', reason: 'y' }) ?? '', /source/i);
  });

  it('a glossary correction carries the source; a bug carries version and device', () => {
    const g = topicFrom('glossary', { ...v, term: 'Haas', proposed: '1–40 ms', reason: 'Range', source: 'A paper' });
    assert.deepEqual(Object.keys(g.fields).sort(), ['current', 'proposed', 'reason', 'source', 'term']);
    assert.match(g.body, /Source: A paper/);
    const b = topicFrom('bug', { ...v, body: 'It froze' }, { appVersion: '1.0.1', device: 'ios 18' });
    assert.deepEqual(b.fields, { app_version: '1.0.1', device: 'ios 18' });
    const i = topicFrom('idea', { ...v, body: 'Please', area: 'Labs' });
    assert.deepEqual(i.fields, { area: 'Labs' });
  });

  it('the lab key meets the server pattern; the chip comes from the key alone', () => {
    const key = labKeyOf('Feedback Lab: Part 2!');
    assert.equal(key, 'feedback-lab-part-2');
    assert.match(key, /^[a-z0-9][a-z0-9_-]{1,79}$/);
    assert.equal(labChipText('feedback-lab'), 'Feedback lab');
  });

  it('glossary words are plain, deduplicated and few', () => {
    assert.deepEqual(glossaryWords('Vocals sound thin'), ['vocals', 'thin']);
    assert.ok(glossaryWords('feedback feedback squeals frequency every night').length <= 3);
    assert.deepEqual(glossaryWords('a b c'), []);
    for (const w of glossaryWords("Don't; drop table, please")) assert.match(w, /^[a-z0-9]+$/);
  });
});

describe('quotes', () => {
  it('is an exact substring of the post, as the server demands', () => {
    const long = `${'word '.repeat(100)}end`;
    const q = quoteExcerpt(long);
    assert.ok(q.length <= EXCERPT_MAX);
    assert.ok(long.includes(q));
    assert.doesNotMatch(q, /…/);
    assert.equal(quoteExcerpt('  short  '), 'short');
  });

  it('a body with no spaces still cuts', () => {
    assert.equal(quoteExcerpt('x'.repeat(900)).length, EXCERPT_MAX);
  });
});

describe('the reply box', () => {
  it('Announcements, a closed topic and a refused member each say why', () => {
    assert.deepEqual(replyBlock({ locked: false, categoryKind: 'announcements' }, null), { kind: 'announcements' });
    assert.equal(replyBlock({ locked: true, categoryKind: 'discussion' }, null).kind, 'closed');
    const barred = replyBlock({ locked: false, categoryKind: 'qa' }, { canReply: false, reason: 'pro_lounge_members_only' });
    assert.deepEqual(barred, { kind: 'closed', text: PRO_LOUNGE_REFUSAL, code: 'pro_lounge_members_only' });
  });

  it('unknown rights leave it open: the server still decides', () => {
    assert.deepEqual(replyBlock({ locked: false, categoryKind: 'qa' }, null), { kind: 'open' });
    assert.deepEqual(replyBlock({ locked: false, categoryKind: 'qa' }, { canReply: true, reason: null }), { kind: 'open' });
  });
});

describe('tracked topics', () => {
  it('says the status; a reason is credited to staff', () => {
    assert.deepEqual(trackedFace('planned'), { stamp: 'PLANNED', tone: 'planned', foot: null });
    assert.equal(trackedFace('in_progress', 'building it.')?.foot, 'Staff: building it.');
    assert.equal(trackedFace('declined', 'Out of scope.')?.foot, 'Staff: Out of scope.');
    assert.equal(trackedFace(null), null);
  });

  it('a shipped reason may name its version', () => {
    assert.deepEqual(trackedFace('shipped', 'v1.1: Now in Settings.'), { stamp: 'SHIPPED · v1.1', tone: 'shipped', foot: 'Now in Settings.' });
    assert.deepEqual(trackedFace('shipped', 'Now in Settings.'), { stamp: 'SHIPPED', tone: 'shipped', foot: 'Now in Settings.' });
    assert.deepEqual(trackedFace('shipped'), { stamp: 'SHIPPED', tone: 'shipped', foot: null });
  });

  it('ideas sort by votes, newer first on a tie', () => {
    const rows = [
      { id: 'a', voteCount: 3, createdAt: '2026-11-01' },
      { id: 'b', voteCount: 9, createdAt: '2026-10-01' },
      { id: 'c', voteCount: 3, createdAt: '2026-11-05' },
    ];
    assert.deepEqual(sortIdeas(rows).map((r) => r.id), ['b', 'c', 'a']);
  });

  it('a vote takes the count the server answered, and moves no row', () => {
    const rows = [
      { id: 'a', voteCount: 3, myVote: false },
      { id: 'b', voteCount: 2, myVote: true },
    ];
    assert.deepEqual(applyVote(rows, 'a', true, 40), [
      { id: 'a', voteCount: 40, myVote: true },
      { id: 'b', voteCount: 2, myVote: true },
    ]);
  });
});

describe('when Claude steps in', () => {
  it("nobody else's post shows anything", () => {
    assert.deepEqual(moderationFace(post({ isMine: false, modState: 'blocked' })), { kind: 'none' });
    assert.deepEqual(moderationFace(post({ isMine: true })), { kind: 'none' });
  });

  it('pending is being reviewed, in the approved words', () => {
    const f = moderationFace(post({ isMine: true, modState: 'pending' }));
    assert.equal(f.kind, 'review');
    if (f.kind === 'review') {
      assert.equal(f.head, 'BEING REVIEWED');
      assert.equal(f.text, 'Your reply is waiting for a quick review before others can see it. Only you can see it for now.');
    }
  });

  it('removed shows the rule, the excerpt, Edit and Repost, and Appeal', () => {
    const f = moderationFace(post({ isMine: true, modState: 'blocked', modRule: 'respect', modReason: 'Why.', body: 'The text' }));
    assert.deepEqual(f, {
      kind: 'removed',
      head: 'REMOVED · RESPECT RULE',
      text: 'Why.',
      excerpt: 'The text',
      canEdit: true,
      canAppeal: true,
      crisis: false,
      how: 'An appeal goes to a person.',
    });
  });

  it('a hidden post cannot be edited (the server refuses), and child safety has no appeal', () => {
    const hidden = moderationFace(post({ isMine: true, modState: 'hidden', modRule: 'hate' }));
    assert.ok(hidden.kind === 'removed' && !hidden.canEdit && hidden.canAppeal);
    const child = moderationFace(post({ isMine: true, modState: 'hidden', modRule: 'child_safety', urgentCategory: 'child_safety' }));
    assert.ok(child.kind === 'removed' && !child.canAppeal && !child.canEdit);
  });

  it('a post hidden by reports is waiting, not removed', () => {
    const f = moderationFace(post({ isMine: true, modState: 'hidden', modRule: 'reports_pending_review' }));
    assert.equal(f.kind, 'review');
  });

  it('a held post with a rule can be edited; a plain or urgent hold waits for a person', () => {
    const edit = moderationFace(post({ isMine: true, modState: 'held', modRule: 'spam', modReason: 'Please edit.' }));
    assert.ok(edit.kind === 'review' && edit.canEdit);
    const plain = moderationFace(post({ isMine: true, modState: 'held' }));
    assert.ok(plain.kind === 'review' && !plain.canEdit);
    const urgent = moderationFace(post({ isMine: true, modState: 'held', modRule: 'threat', urgentCategory: 'threat' }));
    assert.ok(urgent.kind === 'review' && !urgent.canEdit);
  });

  it('a held self-harm post shows crisis resources, as the owner email promises', () => {
    const f = moderationFace(post({ isMine: true, modState: 'held', modRule: 'self_harm', urgentCategory: 'self_harm' }));
    assert.ok(f.kind === 'review' && f.crisis);
    assert.equal(noticeFace(notice({ kind: 'held', rule: 'self_harm' })).crisis, true);
  });

  it('an edit under review leaves the earlier version up', () => {
    const f = moderationFace(post({ isMine: true, pendingState: 'pending', pendingBody: 'new' }));
    assert.ok(f.kind === 'review' && /earlier version/.test(f.text));
    const refused = moderationFace(post({ isMine: true, pendingState: 'blocked', pendingBody: 'new text' }));
    assert.ok(refused.kind === 'removed' && refused.excerpt === 'new text');
  });

  it('every removal says whether automation was used', () => {
    assert.match(noticeFace(notice({ automated: true })).how ?? '', /automatically by AI\. An appeal goes to a person/);
    assert.match(noticeFace(notice({ automated: false })).how ?? '', /by a person/);
  });

  it('a notice offers what the server allows', () => {
    const blocked = noticeFace(notice({ kind: 'blocked' }));
    assert.ok(blocked.canEdit && blocked.canAppeal);
    assert.equal(blocked.head, 'REMOVED · RESPECT RULE');
    const hidden = noticeFace(notice({ kind: 'hidden' }));
    assert.ok(!hidden.canEdit && hidden.canAppeal);
    assert.equal(noticeFace(notice({ kind: 'hidden', rule: 'child_safety' })).canAppeal, false);
    assert.equal(noticeFace(notice({ kind: 'held', rule: null })).head, 'BEING REVIEWED');
    assert.equal(noticeFace(notice({ kind: 'restored' })).tone, 'good');
    assert.equal(noticeFace(notice({ kind: 'something_new' })).head, 'NOTICE');
  });

  it('outcomes', () => {
    assert.equal(outcomeKind('published'), 'published');
    for (const s of ['checking', 'held', 'edit_held']) assert.equal(outcomeKind(s), 'review');
    for (const s of ['blocked', 'edit_blocked', 'hidden']) assert.equal(outcomeKind(s), 'removed');
  });

  it('a rule with no label says nothing rather than a code', () => {
    assert.equal(ruleLabel('respect'), 'RESPECT RULE');
    assert.equal(ruleLabel('none'), null);
    assert.equal(ruleLabel(null), null);
  });

  it('report reasons are the ones forum_report accepts', () => {
    const accepted = ['spam', 'harassment', 'hate', 'sexual', 'threat', 'self_harm', 'child_safety', 'unsafe_advice', 'off_topic', 'self_promotion', 'privacy', 'other'];
    assert.deepEqual(REPORT_REASONS.map((r) => r.key).sort(), [...accepted].sort());
    assert.equal(APPEAL_MAX, 1000);
  });
});

describe('the welcome', () => {
  const doc = read('docs/forum/WELCOME_MESSAGE_APPROVED_2026-11-02.md');

  it('is the approved text, word for word', () => {
    assert.ok(doc.includes(`**${WELCOME_TITLE}**`));
    for (const p of WELCOME_PARAGRAPHS) assert.ok(doc.includes(p), p);
    assert.ok(doc.includes(`**${WELCOME_SIGNATURE}**`));
    assert.ok(doc.includes(WELCOME_ROLE));
    assert.ok(doc.includes(`**${WELCOME_BUTTON}**`));
    assert.ok(doc.includes(WELCOME_NOTE));
    const body = doc.slice(doc.indexOf('---'));
    const paragraphs = body.split('\n\n').filter((l) => !l.startsWith('**') && !l.startsWith('---') && l.trim());
    assert.equal(paragraphs.length, WELCOME_PARAGRAPHS.length);
  });

  const ready = { forumReady: true, readKnown: true, seenHere: false, pinnedUnread: null };

  it('shows on a first visit', () => {
    assert.equal(welcomeDue(ready), true);
    assert.equal(welcomeDue({ ...ready, pinnedUnread: true }), true);
  });

  it('once per account: the server read mark beats a fresh device', () => {
    assert.equal(welcomeDue({ ...ready, pinnedUnread: false }), false);
  });

  it('never twice on this device, and never on a guess', () => {
    assert.equal(welcomeDue({ ...ready, seenHere: true }), false);
    assert.equal(welcomeDue({ ...ready, readKnown: false }), false);
    assert.equal(welcomeDue({ ...ready, forumReady: false }), false);
  });

  it('follows the popup rules: holds for a dismiss, and nothing auto-appears in Low-Light', () => {
    assert.match(code('src/screens/directory/forum/ForumWelcomePopup.tsx'), /rootModalHoldMs\(\)/);
    assert.match(code('src/screens/directory/forum/ForumHomeView.tsx'), /due && focused && !suppressed/);
    assert.match(code('src/screens/directory/forum/ForumHomeView.tsx'), /useOverlaysSuppressed\(\)/);
  });
});

describe('reading the server', () => {
  it('fills the gaps a row may have', () => {
    assert.deepEqual(authorOf(null), { name: 'Member', token: null, verifiedKind: null, graduate: false, trust: null, former: false });
    assert.equal(authorOf({ name: 'A', verified_kind: 'spaceship' }).verifiedKind, null);
    assert.equal(authorOf({ name: 'Former member', former: true }).former, true);
    assert.equal(topicOf({ topic_id: 't', mod_state: null }).modState, 'published');
    assert.equal(meOf({ can_post: true, unread_notices: 2 }).unreadNotices, 2);
  });

  it('keeps known reactions only', () => {
    assert.deepEqual(postOf({ post_id: 'p', my_reactions: ['helpful', 'evil'] }).myReactions, ['helpful']);
  });

  it('keeps only well-formed lab keys: card text is not moderated', () => {
    assert.deepEqual(labKeysOf([{ type: 'lab', lab_key: 'feedback-lab', title: 'nasty text' }, { type: 'lab', lab_key: 'BAD KEY' }, { type: 'x' }]), ['feedback-lab']);
    assert.deepEqual(labKeysOf(null), []);
  });

  it('an answer that names no post is not a success', () => {
    assert.equal(outcomeOf({ ok: true }), null);
    assert.deepEqual(outcomeOf({ post_id: 'p', topic_id: 't', state: 'held' }), {
      postId: 'p',
      topicId: 't',
      state: 'held',
      reason: null,
      urgentCategory: null,
    });
    assert.equal(outcomeOf({ post_id: 'p' })?.state, 'checking');
  });

  it('merges the Pro Lounge newest first', () => {
    const a = topic({ id: 'a', lastPostAt: minutesAgo(50) });
    const b = topic({ id: 'b', lastPostAt: minutesAgo(5) });
    const c = topic({ id: 'c', lastPostAt: null, createdAt: minutesAgo(20) });
    assert.deepEqual(mergeTopics([[a], [b, c]]).map((t) => t.id), ['b', 'c', 'a']);
  });
});

describe('three faces: a failed read is never "nothing here"', () => {
  const hook = read('src/features/forum/useForumRead.ts');

  it('the hook has an unreadable face, and a failed refresh keeps the list', () => {
    assert.match(hook, /'loading' \| 'unreadable' \| 'ready'/);
    assert.match(hook, /s\.value !== null\s*\? \{ \.\.\.s, stale: true \}/);
  });

  it('every list screen checks unreadable before it can say empty', () => {
    for (const f of ['ForumCategoryScreen', 'ForumIdeasScreen', 'ForumNoticesScreen']) {
      const src = code(`src/screens/directory/forum/${f}.tsx`);
      const bad = src.indexOf("'unreadable' ?");
      const empty = src.indexOf('<ForumEmpty');
      assert.ok(bad > 0 && empty > bad, f);
      assert.match(src, /read\.face === 'ready' \?|topics\.face === 'ready' \?/, f);
    }
    const home = code('src/screens/directory/forum/ForumHomeView.tsx');
    assert.ok(home.indexOf("read.face === 'unreadable'") < home.indexOf('read.value.length === 0'));
  });

  it('a failed read in the API layer answers ok: false, never []', () => {
    const api = code('src/features/forum/api.ts');
    // failChecked: a "sign in" refusal is first checked against the session.
    assert.match(api, /if \(error\) return failChecked\(error\.message\)/);
    assert.match(api, /const bad = lists\.find\(\(l\) => !l\.ok\)/);
    assert.doesNotMatch(api.slice(api.indexOf('async function rpc'), api.indexOf('const rows =')), /value: \[\]/);
  });

  it('a screen that cannot be read is not the same as a forum that is not open', () => {
    assert.match(code('src/screens/directory/forum/forumBits.tsx'), /code === 'forum_closed'/);
  });
});

describe('the sample never runs in production', () => {
  it('cannot switch on without __DEV__', () => {
    setSampleForum(FORUM_SAMPLE_STATES[0]);
    assert.equal(sampleForumOn(), false);
    assert.equal(takeSampleOpen(), null);
    setSampleForum(null);
  });

  it('every call in the API layer checks the sample first', () => {
    const api = code('src/features/forum/api.ts');
    const fns = [...api.matchAll(/^export async function (\w+)/gm)].map((m) => m[1]);
    assert.ok(fns.length >= 20);
    for (const fn of fns) {
      const at = api.indexOf(`export async function ${fn}(`);
      const next = api.indexOf('\nexport ', at + 10);
      const body = api.slice(at, next < 0 ? undefined : next);
      assert.match(body, /if \(sampleForumOn\(\)\)/, fn);
    }
  });

  it('the data is required behind the switch, never imported', () => {
    assert.doesNotMatch(code('src/features/forum/api.ts'), /^import .*sampleData/m);
    for (const f of forumFiles) {
      if (f.endsWith('sampleData.ts')) continue;
      assert.doesNotMatch(code(f), /^import [^;]*from '[^']*sampleData/m, f);
    }
  });

  it('leaving the directory turns it off, and each screen says SAMPLE DATA', () => {
    assert.match(read('src/screens/directory/AudioCommunityDirectoryScreen.tsx'), /useEffect\(\(\) => \(\) => setSampleForum\(null\), \[\]\)/);
    assert.match(read('src/screens/directory/forum/forumBits.tsx'), /SAMPLE DATA/);
    for (const f of ['ForumHomeView', 'ForumCategoryScreen', 'ForumThreadScreen', 'ForumAskScreen', 'ForumIdeasScreen', 'ForumNoticesScreen']) {
      assert.match(read(`src/screens/directory/forum/${f}.tsx`), /<SampleStamp \/>/, f);
    }
  });

  it('every mockup screen has a state, and each state opens a real route', () => {
    const labels = FORUM_SAMPLE_STATES.map((s) => s.label).join(' | ');
    for (const n of ['0 ·', '0b ·', '1 ·', '3 ·', '4 ·', '5 ·', '6 ·', '7 ·']) assert.ok(labels.includes(n), n);
    const types = read('src/navigation/types.ts');
    for (const s of FORUM_SAMPLE_STATES) {
      if (s.open) assert.match(types, new RegExp(`\\b${s.open.route}:`), s.id);
    }
    assert.equal(new Set(FORUM_SAMPLE_STATES.map((s) => s.id)).size, FORUM_SAMPLE_STATES.length);
    assert.ok(Object.values(SAMPLE_TOPIC).every((id) => /^[0-9a-f-]{36}$/.test(id)));
  });

  it('is in the dev index and the web preview', () => {
    assert.match(read('src/features/dev/DevVisualIndex.tsx'), /FORUM_SAMPLE_STATES\.map/);
    assert.match(read('src/dev/webPreviews.tsx'), /hash === '#forumpreview'/);
  });
});

describe('house rules', () => {
  it('stays off: the one switch is still false', () => {
    assert.match(read('src/config/communityVisible.ts'), /export const COMMUNITY_VISIBLE = false;/);
  });

  it('the tabs read DIRECTORY · FORUM · MY PROFILE · REQUESTS', () => {
    const src = read('src/screens/directory/AudioCommunityDirectoryScreen.tsx');
    const labels = [...src.matchAll(/\{ key: '\w+', label: '([A-Z ]+)' \}/g)].map((m) => m[1]);
    assert.deepEqual(labels, ['DIRECTORY', 'FORUM', 'MY PROFILE', 'REQUESTS']);
  });

  it('the forum loads on demand: required on the tab, lazy on the stack', () => {
    const dir = code('src/screens/directory/AudioCommunityDirectoryScreen.tsx');
    assert.match(dir, /require\('\.\/forum\/ForumHomeView'\)/);
    assert.doesNotMatch(dir, /^import .*from '\.\/forum\//m);
    const nav = read('src/navigation/RootNavigator.tsx');
    for (const s of ['Category', 'Thread', 'Ask', 'Ideas', 'Notices']) {
      assert.match(nav, new RegExp(`Forum${s}: lazyScreen\\(`), s);
    }
    assert.doesNotMatch(nav, /^import .*forum/im);
  });

  it('never a deep link into the forum', () => {
    assert.doesNotMatch(read('src/navigation/linking.ts'), /Forum/);
  });

  it('uses the one client, the house dialog and the dimmed Modal', () => {
    for (const f of forumFiles) {
      const src = code(f);
      assert.doesNotMatch(src, /Alert\.alert/, f);
      assert.doesNotMatch(src, /createClient/, f);
      assert.doesNotMatch(src, /import \{[^}]*\bModal\b[^}]*\} from 'react-native'/, f);
      assert.doesNotMatch(src, /navigation\.goBack\(/, f);
      assert.doesNotMatch(src, /InteractionManager/, f);
      assert.doesNotMatch(src, /AsyncStorage/, f);
    }
  });

  it('no em dash in what a member reads', () => {
    for (const f of forumFiles) {
      if (!/\.tsx$/.test(f) && !f.endsWith('rules.ts') && !f.endsWith('welcome.ts')) continue;
      assert.doesNotMatch(code(f), /—/, f);
    }
  });

  it('no text under 9 pt', () => {
    for (const f of forumFiles) {
      for (const m of read(f).matchAll(/fontSize: ([\d.]+)/g)) assert.ok(Number(m[1]) >= 9, `${f}: ${m[0]}`);
    }
  });

  it('adds no native dependency and leaves package.json alone', () => {
    const imports = forumFiles.flatMap((f) => [...read(f).matchAll(/from '([^.'][^']*)'/g)].map((m) => m[1]));
    const pkg = JSON.parse(read('package.json')) as { dependencies: Record<string, string> };
    for (const dep of imports) {
      const name = dep.startsWith('@') ? dep.split('/').slice(0, 2).join('/') : dep.split('/')[0];
      assert.ok(name in pkg.dependencies, dep);
    }
  });

  it('the AI disclosure is the approved line, shown on the form and in the rules', () => {
    const line =
      'Posts are checked for the community rules by an AI service (Anthropic) before they appear. Most posts appear within a few seconds.';
    assert.ok(read('src/screens/directory/forum/forumPopups.tsx').includes(line));
    assert.match(read('src/screens/directory/forum/ForumAskScreen.tsx'), /\{AI_DISCLOSURE\}/);
  });

  it('rules are accepted before a first post, on both ways of posting', () => {
    for (const f of ['ForumAskScreen', 'ForumThreadScreen']) {
      const src = code(`src/screens/directory/forum/${f}.tsx`);
      assert.match(src, /if \(!flags\.rulesAccepted\) \{\s*setRulesOpen\(true\);\s*return;/, f);
    }
  });
});
