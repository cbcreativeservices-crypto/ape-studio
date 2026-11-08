/**
 * Audio Community Forum: the fixes from the independent review of slices 1 and 2
 * (2026-11-07, [MD:D44]). One test per finding, written to FAIL on the code
 * before the fix: the modules are imported as namespaces, so a helper that did
 * not exist yet fails its own test instead of the whole file.
 *
 *  High 1  a child-safety post is found from the post, not only the log row
 *  High 2  a held edit is shown, and never restored unseen
 *  High 3  a menu item runs only after the menu has gone (iOS)
 *  Medium 4..13, then the Low items.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import * as R from '../src/features/forum/rules.ts';
import * as M from '../src/features/forum/mappers.ts';
import * as A from '../src/features/forum/adminRows.ts';
import * as C from '../src/features/notifications/communityRules.ts';
import type { ForumNotice, ForumPost } from '../src/features/forum/types.ts';

const read = (p: string) => readFileSync(p, 'utf8').replace(/\r\n/g, '\n');
const code = (p: string) => read(p).replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
// Loose access to helpers that may not exist on the old code.
const r = R as unknown as Record<string, (...a: unknown[]) => unknown> & Record<string, unknown>;

const QUEUE = 'src/screens/admin/ForumQueueView.tsx';
const THREAD = 'src/screens/directory/forum/ForumThreadScreen.tsx';
const ASK = 'src/screens/directory/forum/ForumAskScreen.tsx';

const row = (over: Record<string, unknown> = {}) => ({
  postId: 'p1',
  topicId: 't1',
  topicTitle: 'A title',
  urgentCategory: null as string | null,
  postBody: 'Some text' as string | null,
  postState: 'hidden' as string | null,
  action: 'auto_hide_reports',
  excerpt: null as string | null,
  pendingBody: null as string | null,
  ...over,
});

function post(over: Partial<ForumPost> = {}): ForumPost {
  return {
    id: 'p',
    isOpening: false,
    postKind: 'reply',
    body: 'Body',
    author: { name: 'A', token: null, verifiedKind: null, graduate: false, trust: null, former: false },
    isMine: true,
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
    correctionOfPostId: null,
    correctionState: null,
    labKeys: [],
    safetyNote: false,
    edited: false,
    isFirstPost: false,
    bookmarked: false,
    publishedAt: null,
    createdAt: '2026-11-01T00:00:00Z',
    ...over,
  };
}

const notice = (over: Partial<ForumNotice>): ForumNotice => ({
  id: 1,
  postId: 'p',
  kind: 'hidden',
  rule: null,
  excerpt: null,
  message: null,
  automated: true,
  expiresAt: null,
  readAt: null,
  createdAt: '2026-11-01T00:00:00Z',
  ...over,
});

describe('High 1: a child-safety post is known from the post as well as the row', () => {
  const masked = row({ postBody: '[preserved — not displayed (child-safety)]', urgentCategory: null });

  it('an older row about a child-safety post offers no Restore, Hide or Please edit', () => {
    const o = R.queueOffers(masked);
    assert.equal(o.restore, false);
    assert.equal(o.hide, false);
    assert.equal(o.pleaseEdit, false);
    assert.equal(o.delete, true);
  });

  it('the topic title is never drawn for it', () => {
    assert.equal(typeof r.queueTopicFace, 'function');
    assert.equal((r.queueTopicFace as (x: unknown) => unknown)(masked), null);
    assert.equal((r.queueTopicFace as (x: unknown) => unknown)(row({ urgentCategory: 'child_safety', postBody: null })), null);
  });

  it('the queue and the appeals use the post-aware check, and an appeal never overturns it', () => {
    const q = code(QUEUE);
    assert.match(q, /const child = isChildItem\(item\)/);
    assert.match(q, /queueTopicFace\(item\)/);
    // appealOverturn refuses child safety (second review tests below).
    assert.match(q, /\{overturn\.overturn \? <Act label="OVERTURN"/);
  });
});

describe('High 2: a held edit is shown, and never restored unseen', () => {
  it('an excerpt is never the whole edit (it can hide a new title): Restore stays off', () => {
    // Second review: a short excerpt used to count as "complete".
    const o = R.queueOffers(row({ postState: 'published', action: 'hold', excerpt: 'The new words.' }));
    assert.equal(o.restore, false);
  });

  it('a row about a post with no edit still offers Restore (the positive control)', () => {
    assert.equal(R.queueOffers(row({ postState: 'held', action: 'hold', excerpt: 'Held text.' })).restore, true);
  });

  it('only the start of it, or none of it: Restore is off', () => {
    const long = 'x'.repeat(280);
    assert.equal(R.queueOffers(row({ postState: 'published', action: 'urgent', excerpt: long })).restore, false);
    assert.equal(R.queueOffers(row({ postState: 'published', action: 'budget_hold', excerpt: null })).restore, false);
    assert.equal(R.queueOffers(row({ postState: 'published', action: 'checker_unavailable' })).restore, false);
  });

  it('the full edit, once the server sends all its fields, is enough', () => {
    const pendingBody = 'y'.repeat(600);
    const sent = { pendingKnown: true, pendingState: 'held', pendingBody, pendingTitle: 'New title' };
    assert.equal(R.queueOffers(row({ postState: 'published', action: 'hold', ...sent })).restore, true);
    // A body alone, without the title and state, is not "all of it".
    assert.equal(R.queueOffers(row({ postState: 'published', action: 'hold', pendingBody })).restore, false);
    const item = A.queueItemOf({ log_id: 1, pending_state: 'held', pending_body: 'edit', pending_title: null } as Record<string, unknown>);
    assert.equal((item as unknown as { pendingKnown: boolean }).pendingKnown, true);
    assert.equal(item.pendingBody, 'edit');
    assert.equal((A.queueItemOf({ log_id: 1, pending_body: 'edit' } as Record<string, unknown>) as unknown as { pendingKnown: boolean }).pendingKnown, false);
  });

  it('the card shows the edit under its own head, and what others see now under another', () => {
    const q = code(QUEUE);
    assert.match(q, /THE EDIT BEING REVIEWED/);
    assert.match(q, /WHAT OTHERS SEE NOW/);
    assert.match(q, /pendingEditOf\(item\)/);
  });
});

describe('High 3: a menu item runs after the menu has gone', () => {
  it('MenuPopup hands every item to useAfterModalsClose, never runs it beside its own dismissal', () => {
    const bits = code('src/screens/directory/forum/forumBits.tsx');
    const menu = bits.slice(bits.indexOf('export function MenuPopup'), bits.indexOf('export function PopupScroll'));
    assert.match(menu, /const afterClose = useAfterModalsClose\(\)/);
    assert.match(menu, /onClose\(\);\s*afterClose\(m\.onPress\);/);
    assert.doesNotMatch(menu, /onClose\(\);\s*m\.onPress\(\);/);
  });
});

describe('Medium 4: a forum alert opens its thread, and is quiet in Low-Light', () => {
  const tap = { type: 'forum', kind: 'reply', topicId: '11111111-1111-4111-8111-111111111111', postId: '22222222-2222-4222-8222-222222222222' };

  it('is a member alert, so Low-Light holds it back', () => {
    assert.equal(C.isCommunityData(tap), true);
    assert.equal(C.foregroundPresentation(C.isCommunityData(tap), true).shouldShowBanner, false);
  });

  it('reads the topic and the post, and refuses anything that is not a real id', () => {
    const c = C as unknown as Record<string, (x: unknown) => unknown>;
    assert.deepEqual(c.forumTapFrom(tap), { topicId: tap.topicId, postId: tap.postId });
    assert.deepEqual(c.forumTapFrom({ ...tap, postId: 'x' }), { topicId: tap.topicId, postId: null });
    assert.equal(c.forumTapFrom({ ...tap, topicId: 'not-an-id' }), null);
    assert.equal(c.forumTapFrom({ type: 'community', topicId: tap.topicId }), null);
  });

  it('the tap is routed, also from a cold start', () => {
    assert.match(code('src/features/notifications/push.ts'), /community\.openForum\(forum\)/);
    const app = code('App.tsx');
    assert.match(app, /openForum,/);
    assert.match(app, /flushForumTapNav\(openForumThread\)/);
    assert.match(app, /navigationRef\.navigate\('ForumThread'/);
  });
});

describe('Medium 5: a self-harm case keeps the crisis words, whatever the outcome', () => {
  it('a hidden self-harm post shows them', () => {
    const f = R.moderationFace(post({ modState: 'hidden', urgentCategory: 'self_harm', modRule: 'respect' }));
    assert.equal(f.kind, 'removed');
    assert.equal((f as { crisis?: boolean }).crisis, true);
  });

  it('the removed card is given them', () => {
    const t = code(THREAD);
    const removed = t.slice(t.indexOf("face.kind === 'removed' ? ("), t.indexOf("face.kind === 'removed' && !published"));
    assert.match(removed, /crisis=\{face\.crisis\}/);
  });
});

describe('Medium 6: a warning or a mute reads as a sentence, never a rule code', () => {
  const rules = ['respect', 'harassment', 'hate', 'sexual', 'threat', 'self_harm', 'spam', 'self_promotion', 'privacy',
    'piracy', 'unsafe_advice', 'beginner_shaming', 'impersonation', 'off_topic', 'reports_pending_review', 'owner', null];

  it('every rule, and no rule, gives plain words', () => {
    assert.equal(typeof r.memberReason, 'function');
    for (const rule of rules) {
      const s = (r.memberReason as (x: unknown) => string)(rule);
      assert.match(s, /^[A-Z].*\.$/, String(rule));
      assert.doesNotMatch(s, /_/, String(rule));
      if (rule) assert.notEqual(s, rule);
    }
  });

  it('the queue sends those words, and a standing code AccountStandingNotice can read', () => {
    const q = code(QUEUE);
    assert.match(q, /actOnUser\(user, action, hours, memberReason\(item\.rule\)\)/);
    assert.match(q, /setMemberStanding\(user, status, days, standingReasonCode\(item\.rule\)\)/);
    assert.match(read('src/features/account/AccountStandingNotice.tsx'), /forum: 'Breaking the community forum rules'/);
  });
});

describe('Medium 7: a post the child-safety screen stopped says so', () => {
  it('gives the server\'s words, or the rule\'s own', () => {
    assert.equal(typeof r.hiddenOutcomeNote, 'function');
    const note = r.hiddenOutcomeNote as (x: unknown) => string | null;
    assert.equal(note({ state: 'hidden', urgentCategory: 'child_safety', reason: null }), 'This post was removed under our child-safety rule.');
    assert.equal(note({ state: 'hidden', urgentCategory: 'child_safety', reason: 'Server words.' }), 'Server words.');
    assert.equal(note({ state: 'blocked', urgentCategory: null, reason: 'x' }), null);
  });

  it('both the reply box and the Ask form use it', () => {
    assert.match(code(THREAD), /hiddenOutcomeNote\(r\.value\)/);
    assert.equal((code(ASK).match(/hiddenOutcomeNote\(r\.value\)/g) ?? []).length, 2);
  });
});

describe('Medium 8: a person picked from the search stays mentioned', () => {
  it('the people @ can name keep a pick after the search moves on', () => {
    assert.equal(typeof r.mentionPeople, 'function');
    const maya = { name: 'Maya R.', token: 't-maya' };
    const all = (r.mentionPeople as (...a: unknown[]) => { token: string }[])([], [maya], []);
    assert.deepEqual(R.mentionTokensIn('@Maya R. what do you think?', all as never), ['t-maya']);
  });

  it('the thread keeps its picks', () => {
    const t = code(THREAD);
    assert.match(t, /mentionPeople\(people, picked, found\)/);
    assert.match(t, /setPicked\(/);
  });
});

describe('Medium 9: a read thread stops looking unread', () => {
  it('names the newest post, not the last one in reading order', () => {
    assert.equal(typeof r.readMarkPostId, 'function');
    const mark = r.readMarkPostId as (...a: unknown[]) => string | null;
    // A Q&A thread: ordered by Helpful, so the oldest reply comes last.
    const posts = [
      { id: 'A', publishedAt: '2026-11-01T01:00:00Z' },
      { id: 'C', publishedAt: '2026-11-01T03:00:00Z' },
      { id: 'B', publishedAt: '2026-11-01T02:00:00Z' },
    ];
    assert.equal(mark(posts, false), 'C');
    assert.equal(mark(posts, true), null);
  });

  it('the thread uses it', () => {
    assert.match(code(THREAD), /markRead\(topicId, readMarkPostId\(value\.posts, value\.posts\.length < POSTS_PAGE\)\)/);
  });
});

describe('Medium 10: the Ask form is never a dead end', () => {
  const cat = (slug: string) => ({ slug, name: slug, groupSlug: 'learn', groupName: 'Learn', groupSort: 1, sortOrder: 1,
    kind: 'qa', trackedKind: null, staffOnlyTopics: false, jobsAllowed: false, labThreads: false, description: null, followLevel: null });

  it('no category open: the refusal, in words', () => {
    assert.equal(typeof r.askChoices, 'function');
    const out = (r.askChoices as (...a: unknown[]) => { open: unknown[]; refusal: string; refusalCode: string })(
      [cat('ideas-requests'), cat('ask-the-community')],
      [
        { slug: 'ideas-requests', canStartTopic: false, reason: 'profile_unpublished' },
        { slug: 'ask-the-community', canStartTopic: false, reason: 'profile_unpublished' },
      ],
      'ideas-requests',
    );
    assert.equal(out.open.length, 0);
    assert.equal(out.refusalCode, 'profile_unpublished');
    assert.equal(out.refusal, R.refusalText('profile_unpublished'));
  });

  it('the one they came for refused: said, and never silently swapped for another', () => {
    const out = (r.askChoices as (...a: unknown[]) => { wantedRefused: boolean; refusal: string | null })(
      [cat('ideas-requests'), cat('careers-business')],
      [
        { slug: 'ideas-requests', canStartTopic: false, reason: 'employer_careers_only' },
        { slug: 'careers-business', canStartTopic: true, reason: null },
      ],
      'ideas-requests',
    );
    assert.equal(out.wantedRefused, true);
    assert.equal(out.refusal, R.refusalText('employer_careers_only'));
  });

  it('the form shows the refusal in its place, and asks for a category before posting', () => {
    const a = code(ASK);
    assert.match(a, /choices\.open\.length === 0/);
    assert.match(a, /Choose a category first\./);
  });
});

describe('Medium 11: a lab has one thread, from its home and from its modules', () => {
  const leaves = [
    { name: 'Digital Audio Systems', route: 'DigitalLab' },
    { name: 'Gain Staging', route: 'GainLabHome' },
    { name: 'Visual Audio Analysis', route: 'MeterLab' },
    { name: 'Signal Detective', route: 'MeterModule', params: { id: 'detective' } },
  ];

  it('a module end screen resolves to its lab', () => {
    assert.equal(R.labNameForRoute(leaves, 'DigitalModule', { id: 'nyquist' }), 'Digital Audio Systems');
    assert.equal(R.labNameForRoute(leaves, 'GainModule', { id: 'x' }), 'Gain Staging');
  });

  it('never the first lab that shares a route with other params', () => {
    assert.equal(R.labNameForRoute(leaves, 'MeterModule', { id: 'spectrum' }), 'Visual Audio Analysis');
    assert.equal(R.labNameForRoute(leaves, 'MeterModule', { id: 'detective' }), 'Signal Detective');
  });

  it('every parent route is a lab home in the catalog', () => {
    const catalog = code('src/screens/lab/labCatalog.ts');
    const parents = (r.LAB_PARENT_ROUTES ?? {}) as Record<string, string>;
    assert.ok(Object.keys(parents).length >= 8);
    for (const [child, parent] of Object.entries(parents)) {
      assert.match(catalog, new RegExp(`route: '${parent}'`), `${child} -> ${parent}`);
    }
  });
});

describe('Medium 12: the notices can always be reached', () => {
  it('Your forum links to them, read or not', () => {
    assert.match(code('src/screens/directory/forum/ForumMineScreen.tsx'), /navigation\.navigate\('ForumNotices'\)/);
  });
});

describe('Medium 13: the cards say only what is true', () => {
  it('a removed post never claims the AI decided it, and child safety offers no appeal line', () => {
    const f = R.moderationFace(post({ modState: 'hidden', modRule: 'hate' })) as { how?: string | null };
    assert.equal(f.how, 'An appeal goes to a person.');
    const c = R.moderationFace(post({ modState: 'hidden', urgentCategory: 'child_safety' })) as { how?: string | null };
    assert.equal(c.how, null);
    assert.doesNotMatch(code(THREAD), /Reviewed automatically by AI/);
  });

  it('APPEAL SENT comes from the server as well', () => {
    assert.equal(typeof r.appealSent, 'function');
    const sent = r.appealSent as (...a: unknown[]) => boolean;
    assert.equal(sent('p', [{ postId: 'p', status: 'open' }], []), true);
    assert.equal(sent('p', [{ postId: 'p', status: 'upheld' }], []), false);
    assert.match(code(THREAD), /appealSent\(item\.id, myAppeals, appealed\)/);
  });

  it('the rules popup does not promise an appeal for every removal', () => {
    const popups = read('src/screens/directory/forum/forumPopups.tsx');
    assert.doesNotMatch(popups, /every removal can be appealed/);
    assert.match(popups, /except under the child-safety rule/);
  });
});

describe('the Low items', () => {
  it('L2: the Pro Lounge words only for that refusal', () => {
    const dock = r.postingDock as (...a: unknown[]) => { kind: string; code?: string | null };
    const right = (reason: string) => [{ slug: 'graduate-qa', proOnly: true, canStartTopic: false, reason }];
    assert.deepEqual(dock(right('pro_lounge_members_only'), undefined, true), { kind: 'pro' });
    assert.deepEqual(dock(right('muted'), undefined, true), { kind: 'refusal', code: 'muted' });
    assert.deepEqual(dock(right('profile_unpublished'), 'graduate-qa', false), { kind: 'refusal', code: 'profile_unpublished' });
  });

  it('L3: Edit only where the server takes it', () => {
    const ok = r.editAllowed as (p: unknown) => boolean;
    assert.equal(ok(post({ modState: 'held', urgentCategory: 'threat' })), false);
    assert.equal(ok(post({ modState: 'hidden', modRule: 'reports_pending_review' })), false);
    assert.equal(ok(post({ modState: 'blocked' })), true);
  });

  it('L4: no reply box under my own unpublished topic', () => {
    const b = R.replyBlock({ locked: false, categoryKind: 'qa', modState: 'held' } as never, null);
    assert.equal(b.kind, 'closed');
  });

  it('L5: a changed draft is a new post', () => {
    assert.match(code(THREAD), /clientId\.current = null;\s*setDraft\(text\)/);
    assert.match(code(ASK), /clientId\.current = null;\s*setValues/);
  });

  it('L6: the queue links a topic only while the owner can open it', () => {
    const face = r.queueTopicFace as (x: unknown) => { link: boolean } | null;
    assert.equal(face(row({ postState: 'held' }))?.link, false);
    assert.equal(face(row({ postState: 'published' }))?.link, true);
  });

  it('L7: this month only', () => {
    const pick = (A as unknown as Record<string, (...a: unknown[]) => unknown>).usageOfMonth;
    const rows = [{ month: '2026-10-01', cost_usd: 49 }];
    assert.equal(pick(rows, new Date('2026-11-02T00:00:00Z')), null);
    assert.deepEqual(pick([{ month: '2026-11-01' }, ...rows], new Date('2026-11-02T00:00:00Z')), { month: '2026-11-01' });
  });

  it('L8: the same status again is refused, and a false write is not "saved"', () => {
    assert.match(String(R.trackedProblem('shipped', 'v1.1: x', 'shipped' as never)), /already/);
    assert.match(code('src/features/forum/adminApi.ts'), /if \(raw === false\) throw new Error\('not saved'\)/);
  });

  it('L9 + L10: Accept/Decline latched; a refused agreement says so', () => {
    const t = code(THREAD);
    assert.match(t, /const resolve = useLatchedPress\(/);
    assert.match(t, /else notify\('Not saved', RULES_NOT_SAVED\)/);
    assert.match(code(ASK), /else notify\('Not saved', RULES_NOT_SAVED\)/);
  });

  it('L11: removed reads REMOVED, a report hold reads as a review, a plain hold offers no Edit', () => {
    const stamp = r.topicReviewStamp as (t: unknown) => string | null;
    assert.equal(stamp({ isMine: true, modState: 'hidden' }), 'REMOVED');
    assert.equal(stamp({ isMine: true, modState: 'held' }), 'IN REVIEW');
    const n = R.noticeFace(notice({ kind: 'hidden', message: 'This post is hidden while it is reviewed.' }));
    assert.equal(n.head, 'BEING REVIEWED');
    const held = R.moderationFace(post({ modState: 'held', modRule: 'spam', modReason: 'Your post is waiting for a review.' }));
    assert.ok(held.kind === 'review' && !held.canEdit);
  });

  it('L12: an unknown session never gets the guest face', () => {
    const face = r.signInFace as (...a: unknown[]) => { code: string | null };
    const signIn = R.forumErrorText('permission denied for function forum_me');
    assert.equal(face(signIn, 'unknown').code, null);
    assert.equal(face(signIn, 'present').code, null);
    assert.equal(face(signIn, 'none').code, 'sign_in');
    assert.equal(R.forumErrorText('sign_in').code, 'sign_in');
    assert.match(code('src/features/forum/api.ts'), /safeSessionResult\(supabase\.auth\.getSession\(\), 'forum'\)/);
  });

  it('L13: a lab thread is never "Former member"', () => {
    const t = M.topicOf({ topic_id: 't', lab_key: 'gain-staging', author: { name: 'Former member', former: true } });
    assert.equal(t.author.name, 'Lab discussion');
    assert.doesNotMatch(R.topicA11y(t), /by /);
  });

  it('L13: a blocked member leaves the strip and the ALSO list at once', () => {
    const ex = code('src/screens/directory/ExploreView.tsx');
    assert.match(ex, /hiddenTokens=\{hiddenTokens\}/);
    assert.match(ex, /alsoVisible\.map/);
  });

  it('L14: the correction note and the empty Unanswered list say only what is true', () => {
    assert.doesNotMatch(code(THREAD), /sees it first/);
    assert.doesNotMatch(code('src/screens/directory/forum/ForumHomeView.tsx'), /Every question has had an answer/);
  });
});

/* ── Second review of 155b0257 (2026-11-07) ──────────────────────────── */

describe('second review: an appeal about an edit is never overturned unseen', () => {
  const overturn = (a: Record<string, unknown>, q: string | null) =>
    (r.appealOverturn as (...x: unknown[]) => { overturn: boolean; why: string | null })(a, q);

  it('a queue row about an appeal on a still-published post is an edit with no text', () => {
    const e = R.pendingEditOf({ postState: 'published', action: 'note', mode: 'appeal', excerpt: null } as never);
    assert.deepEqual(e, { text: null, title: null, complete: false });
    assert.equal(R.queueOffers(row({ postState: 'published', action: 'note', mode: 'appeal' })).restore, false);
  });

  it('OVERTURN waits for a published post, and for a post whose state is unknown', () => {
    assert.equal(typeof r.appealOverturn, 'function');
    assert.equal(overturn({ postBody: 'old', postState: 'published' }, null).overturn, false);
    assert.equal(overturn({ postBody: 'old' }, 'published').overturn, false);
    assert.equal(overturn({ postBody: 'old' }, null).overturn, false);
    assert.equal(overturn({ postBody: 'old' }, 'blocked').overturn, true);
    assert.equal(overturn({ postBody: 'old', pendingKnown: true, pendingState: 'blocked', pendingBody: null }, 'published').overturn, false);
    assert.equal(overturn({ postBody: 'old', pendingKnown: true, pendingState: 'blocked', pendingBody: 'new' }, 'published').overturn, true);
    assert.equal(overturn({ postBody: '[preserved — not displayed (child-safety)]' }, 'hidden').overturn, false);
  });

  it('the appeals list uses it', () => {
    assert.match(code(QUEUE), /appealOverturn\(a, stateOf\(a\.postId\)\)/);
  });
});

describe('second review: a hidden post with a waiting edit', () => {
  it('once the server says there is an edit, Restore waits for it on a hidden post too', () => {
    const hidden = row({ postState: 'hidden', action: 'auto_hide_reports', pendingKnown: true, pendingState: 'held', pendingBody: null, pendingTitle: null });
    assert.equal(R.queueOffers(hidden).restore, false);
    const clean = row({ postState: 'hidden', action: 'auto_hide_reports', pendingKnown: true, pendingState: null, pendingBody: null, pendingTitle: null });
    assert.equal(R.queueOffers(clean).restore, true);
  });
});

describe('second review: a forum tap never opens above the sign-in screen', () => {
  it('the rule', () => {
    const lands = (C as unknown as Record<string, (x: unknown) => boolean>).forumTapLands;
    assert.equal(typeof lands, 'function');
    assert.equal(lands('Auth'), false);
    assert.equal(lands('Main'), true);
    assert.equal(lands('Splash'), true);
    assert.equal(lands(undefined), true);
  });

  it('App asks it before navigating', () => {
    const app = code('App.tsx');
    const fn = app.slice(app.indexOf('function openForumThread'), app.indexOf('function openCommunityPath'));
    assert.match(fn, /if \(!forumTapLands\(base\)\) return;/);
  });
});

describe('second review: an anonymous session is nobody', () => {
  it('sessionKindOf', () => {
    const kind = r.sessionKindOf as (...a: unknown[]) => string;
    assert.equal(typeof kind, 'function');
    assert.equal(kind({ user: { is_anonymous: true } }, false), 'none');
    assert.equal(kind({ user: { is_anonymous: false } }, false), 'present');
    assert.equal(kind(null, false), 'none');
    assert.equal(kind({ user: {} }, true), 'unknown');
    assert.match(code('src/features/forum/api.ts'), /session = sessionKindOf\(result\?\.data\?\.session, timedOut\)/);
  });
});

describe('second review: the rest', () => {
  it('Please edit and Hide carry plain words to the member', () => {
    const please = r.pleaseEditReason as (x: unknown) => string;
    assert.match(please('respect'), /Please edit it so it can be published\.$/);
    const q = code(QUEUE);
    assert.match(q, /actOnPost\(postId, action, action === 'please_edit' \? pleaseEditReason\(item\.rule\) : memberReason\(item\.rule\)\)/);
    assert.match(q, /decide\(item, 'hide', memberReason\(item\.rule\)\)/);
  });

  it('the long-edit card says what DISMISS does', () => {
    assert.match(code(QUEUE), /If you DISMISS this, the edit stays waiting and is never published\./);
  });

  it('a thread is keyed by its topic', () => {
    assert.match(code(THREAD), /<Thread key=\{topicId\}/);
  });

  it('Sound Systems modes, the De-Esser and Miking lessons have their lab', () => {
    const parents = (r.LAB_PARENT_ROUTES ?? {}) as Record<string, string>;
    assert.equal(parents.SoundSystemsLearn, 'SoundSystemsLab');
    assert.equal(parents.DeEsserLab, 'SmartProcessorsLab');
    const target = r.mikingLessonTarget as (...a: unknown[]) => unknown;
    assert.deepEqual(target('M01', (id: string) => (id === 'M01' ? 'drums' : undefined)), { route: 'MikingHub', params: { lab: 'drums' } });
    assert.equal(target('nope', () => undefined), null);
  });

  it('plain rudeness is not "harassment" on the standing notice', () => {
    assert.equal(R.standingReasonCode('respect'), 'forum');
    assert.equal(R.standingReasonCode('harassment'), 'harassment');
  });
});
