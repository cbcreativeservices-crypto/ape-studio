/**
 * The forum app against BOTH server shapes ([MD:D44], 2026-11-07): the live
 * server of today, and the same server once the Comp A package
 * 2026-11-07_FOR_COMP_A_FORUM_GAPS is applied (F10 to F90). Every flow runs
 * against a fake server of each shape:
 *
 *   OLD  none of the new columns, arguments or functions. A call to a missing
 *        function, or with an argument it does not know, answers PGRST202 as
 *        PostgREST does.
 *   NEW  the package's exact names and shapes (BRIEF_FOR_COMP_A.md section 9.16).
 *
 * A fallback happens ONLY on "missing": any other failure on the new server is
 * told as a failure, never retried the old way.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import * as R from '../src/features/forum/rules.ts';
import * as M from '../src/features/forum/mappers.ts';
import * as A from '../src/features/forum/adminRows.ts';
import * as S from '../src/features/forum/serverShapes.ts';
import * as K from '../src/features/directory/kinds.ts';
import type { ForumPost, ForumTopic } from '../src/features/forum/types.ts';

const read = (p: string) => readFileSync(p, 'utf8').replace(/\r\n/g, '\n');
const code = (p: string) => read(p).replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');

/* ── Fake servers ─────────────────────────────────────────────────────── */

type Answer = { data: unknown; error: { code?: string | null; message?: string | null } | null };
type Handler = (args: Record<string, unknown> | undefined) => Answer;

const MISSING = (fn: string, args?: Record<string, unknown>): Answer => ({
  data: null,
  error: {
    code: 'PGRST202',
    message: `Could not find the function public.${fn}(${Object.keys(args ?? {}).sort().join(', ')}) in the schema cache`,
  },
});
const ok = (data: unknown): Answer => ({ data, error: null });
const refused = (message: string): Answer => ({ data: null, error: { code: 'P0001', message } });

/** A fake server: each function's handler, or PGRST202 for any other. Every
 *  call is recorded, so a test can say what was (and was not) asked. */
function server(handlers: Record<string, Handler>) {
  const calls: { fn: string; args: Record<string, unknown> | undefined }[] = [];
  const call = async (fn: string, args?: Record<string, unknown>): Promise<Answer> => {
    calls.push({ fn, args });
    const h = handlers[fn];
    return h ? h(args) : MISSING(fn, args);
  };
  return { call, calls, names: () => calls.map((c) => c.fn) };
}

const LOUNGE_CATS = [
  { slug: 'general', name: 'General', group_slug: 'community' },
  { slug: 'gig-talk', name: 'Gig Talk', group_slug: 'pro_lounge' },
  { slug: 'hiring-gigs', name: 'Hiring & Gigs', group_slug: 'pro_lounge' },
];

const topicRow = (id: string, last: string, extra: Record<string, unknown> = {}) => ({
  topic_id: id,
  category_slug: 'gig-talk',
  category_name: 'Gig Talk',
  title: `Topic ${id}`,
  topic_kind: 'discussion',
  author: { name: 'Maya R.', token: 'tok-maya' },
  unread: true,
  last_post_at: last,
  created_at: last,
  ...extra,
});

/** forum_topics_list as it is live today: four arguments, no new columns. */
const oldTopicsList: Handler = (args) => {
  if (args && 'p_group' in args) return MISSING('forum_topics_list', args);
  if (args?.p_category === 'gig-talk') return ok([topicRow('a', '2026-11-05T10:00:00Z'), topicRow('b', '2026-11-07T10:00:00Z')]);
  if (args?.p_category === 'hiring-gigs') return ok([topicRow('c', '2026-11-06T10:00:00Z')]);
  return ok([]);
};

/** forum_topics_list after F40: five arguments, three more columns, and the
 *  server's own ranking for the whole group. */
const newTopicsList: Handler = (args) => {
  if (args?.p_group !== 'pro_lounge') return ok([]);
  const extra = { tracked_reason: null, area: null, ever_read: true };
  // "Top this week" ranked by the server: NOT newest activity first.
  return ok([
    topicRow('a', '2026-11-05T10:00:00Z', extra),
    topicRow('c', '2026-11-06T10:00:00Z', extra),
    topicRow('b', '2026-11-07T10:00:00Z', extra),
  ]);
};

/* ── 1. Mappers: the new columns, and their absence ─────────────────── */

describe('mappers read the new columns, and never guess when they are absent', () => {
  it('topics: ever_read, tracked_reason and area', () => {
    const old = M.topicOf(topicRow('a', '2026-11-07T10:00:00Z'));
    assert.equal(old.everRead, null);
    assert.equal(old.detailKnown, false);
    assert.equal(old.trackedReason, null);
    assert.equal(old.area, null);

    const fresh = M.topicOf(topicRow('a', '2026-11-07T10:00:00Z', { ever_read: false, tracked_reason: 'v1.1: Now in Settings', area: 'live-sound' }));
    assert.equal(fresh.everRead, false);
    assert.equal(fresh.detailKnown, true);
    assert.equal(fresh.trackedReason, 'v1.1: Now in Settings');
    assert.equal(fresh.area, 'live-sound');
    // A NULL reason from the new server is still "known: none".
    const none = M.topicOf(topicRow('a', 'x', { ever_read: true, tracked_reason: null, area: null }));
    assert.equal(none.detailKnown, true);
    assert.equal(none.everRead, true);
  });

  it('notices: topic_id', () => {
    assert.equal(M.noticeOf({ id: 1, post_id: 'p1', kind: 'held' }).topicId, null);
    assert.equal(M.noticeOf({ id: 1, post_id: 'p1', kind: 'held', topic_id: 't9' }).topicId, 't9');
  });

  it('posts: please_edit and mentions', () => {
    const old = M.postOf({ post_id: 'p1', body: 'x' });
    assert.equal(old.pleaseEdit, null);
    assert.deepEqual(old.mentions, []);

    const fresh = M.postOf({
      post_id: 'p1',
      body: 'x',
      please_edit: true,
      mentions: [
        { name: 'Maya R.', token: 'tok-maya' },
        { name: 'Maya R.', token: 'tok-maya' },
        { name: 'No token' },
        { token: 'no-name' },
        'junk',
      ],
    });
    assert.equal(fresh.pleaseEdit, true);
    assert.deepEqual(fresh.mentions, [{ name: 'Maya R.', token: 'tok-maya' }]);
    assert.equal(M.postOf({ post_id: 'p1', please_edit: false }).pleaseEdit, false);
  });

  it('topic: solution_marked_by_name; me: rules_accepted_at', () => {
    assert.equal(M.topicDetailOf({ topic_id: 't' }).solutionMarkedByName, null);
    assert.equal(M.topicDetailOf({ topic_id: 't', solution_marked_by_name: 'Prof. Channing Booth' }).solutionMarkedByName, 'Prof. Channing Booth');
    assert.equal(M.meOf({}).rulesAcceptedAt, null);
    assert.equal(M.meOf({ rules_accepted_at: '2026-11-07T12:00:00Z' }).rulesAcceptedAt, '2026-11-07T12:00:00Z');
  });

  it('queue and appeals: pending_* and post_state', () => {
    const oldQ = A.queueItemOf({ log_id: 1, post_id: 'p', post_state: 'published' });
    assert.equal(oldQ.pendingKnown, false);
    const newQ = A.queueItemOf({ log_id: 1, post_id: 'p', post_state: 'published', pending_body: 'New text', pending_state: 'held', pending_title: null });
    assert.equal(newQ.pendingKnown, true);
    assert.equal(newQ.pendingBody, 'New text');
    assert.equal(newQ.pendingState, 'held');

    const oldA = A.adminAppealOf({ appeal_id: 'a', post_id: 'p' });
    assert.equal(oldA.pendingKnown, false);
    assert.equal(oldA.postState, null);
    const newA = A.adminAppealOf({ appeal_id: 'a', post_id: 'p', post_state: 'published', pending_body: 'Edit', pending_state: 'blocked', pending_title: 'New title' });
    assert.equal(newA.pendingKnown, true);
    assert.equal(newA.postState, 'published');
    assert.equal(newA.pendingTitle, 'New title');
  });
});

/* ── RESTORE and OVERTURN once the pending fields arrive ────────────── */

describe('RESTORE and OVERTURN, before and after the pending fields', () => {
  const heldEdit = { log_id: 1, post_id: 'p', post_state: 'published', action: 'hold', mode: 'post', excerpt: 'The start of the edit' };

  it('a held edit: RESTORE stays off on the old server, comes back with the whole edit', () => {
    assert.equal(R.queueOffers(A.queueItemOf(heldEdit)).restore, false);
    const whole = A.queueItemOf({ ...heldEdit, pending_body: 'The whole edit', pending_state: 'held', pending_title: 'A new title' });
    assert.equal(R.queueOffers(whole).restore, true);
    const edit = R.pendingEditOf(whole);
    assert.deepEqual(edit, { text: 'The whole edit', title: 'A new title', complete: true });
    // The state came back but not the body (an older masked row): still off.
    const noBody = A.queueItemOf({ ...heldEdit, pending_body: null, pending_state: 'held', pending_title: null });
    assert.equal(R.queueOffers(noBody).restore, false);
  });

  it('a hidden post with no waiting edit is restorable once the server says so', () => {
    const row = { log_id: 2, post_id: 'p', post_state: 'hidden', action: 'auto_hide_reports', mode: 'report' };
    assert.equal(R.queueOffers(A.queueItemOf({ ...row, pending_body: null, pending_state: null, pending_title: null })).restore, true);
  });

  it('child safety: never restored, whatever the server sends', () => {
    const child = A.queueItemOf({
      ...heldEdit,
      urgent_category: null,
      post_body: '[preserved — not displayed (child-safety)]',
      pending_body: '[preserved — not displayed (child-safety)]',
      pending_state: 'held',
      pending_title: '[preserved — not displayed (child-safety)]',
    });
    const offers = R.queueOffers(child);
    assert.equal(offers.restore, false);
    assert.equal(offers.pleaseEdit, false);
  });

  it('an appeal on an edit: OVERTURN waits on the old server, and shows the edit on the new one', () => {
    const old = A.adminAppealOf({ appeal_id: 'a', post_id: 'p', post_body: 'Old text' });
    assert.equal(R.appealOverturn(old, null).overturn, false);
    assert.equal(R.appealEditOf(old), null);

    const fresh = A.adminAppealOf({
      appeal_id: 'a',
      post_id: 'p',
      post_body: 'Old text',
      post_state: 'published',
      pending_body: 'The edit appealed for',
      pending_state: 'blocked',
      pending_title: 'New title',
    });
    assert.equal(R.appealOverturn(fresh, null).overturn, true);
    assert.deepEqual(R.appealEditOf(fresh), { title: 'New title', text: 'The edit appealed for' });

    const unseen = A.adminAppealOf({ appeal_id: 'a', post_id: 'p', post_body: 'Old text', post_state: 'published', pending_body: null, pending_state: 'blocked', pending_title: null });
    assert.equal(R.appealOverturn(unseen, null).overturn, false);

    const child = A.adminAppealOf({ appeal_id: 'a', post_id: 'p', post_body: '[preserved — x]', post_state: 'hidden', pending_body: '[preserved — x]', pending_state: 'blocked', pending_title: null });
    assert.equal(R.appealOverturn(child, null).overturn, false);
    assert.equal(R.appealEditOf(child), null);
  });

  it('the appeal card draws the edit before OVERTURN', () => {
    const q = code('src/screens/admin/ForumQueueView.tsx');
    assert.match(q, /const appealEdit = child \? null : appealEditOf\(a\)/);
    assert.match(q, /THE EDIT APPEALED FOR/);
  });
});

/* ── 2. The rules agreement ─────────────────────────────────────────── */

describe('the rules agreement: forum_rules_accept() with the phone as fallback', () => {
  const NEW = () => server({ forum_rules_accept: () => ok('2026-11-07T12:00:00+00:00') });
  const OLD = () => server({});
  const DOWN = () => server({ forum_rules_accept: () => refused('Failed to fetch') });

  it('the new server records it, with no arguments', async () => {
    const s = NEW();
    assert.equal(await S.acceptRulesBoth(async () => true, s.call), true);
    assert.deepEqual(s.calls, [{ fn: 'forum_rules_accept', args: undefined }]);
    // The account's record is enough when the phone could not keep it.
    assert.equal(await S.acceptRulesBoth(async () => false, NEW().call), true);
    assert.equal(await S.acceptRulesBoth(async () => { throw new Error('disk'); }, NEW().call), true);
  });

  it('the old server: the phone keeps it, as today', async () => {
    assert.equal(await S.recordRulesOnServer(OLD().call), 'missing');
    assert.equal(await S.acceptRulesBoth(async () => true, OLD().call), true);
    assert.equal(await S.acceptRulesBoth(async () => false, OLD().call), false);
  });

  it('a server call that did not land: the phone covers it; both failing is "not saved"', async () => {
    assert.equal(await S.recordRulesOnServer(DOWN().call), 'failed');
    assert.equal(await S.acceptRulesBoth(async () => true, DOWN().call), true);
    assert.equal(await S.acceptRulesBoth(async () => false, DOWN().call), false);
  });

  it("'rules_not_accepted' has plain words, and brings the popup back", () => {
    const words = R.forumErrorText('forum:rules_not_accepted');
    assert.equal(words.code, 'rules_not_accepted');
    assert.notEqual(words.error, R.FORUM_UNREADABLE);
    assert.match(words.error, /community rules/);
    assert.doesNotMatch(words.error, /rules_not_accepted/);
    assert.equal(R.asksForRules('rules_not_accepted'), true);
    assert.equal(R.asksForRules('muted'), false);
    for (const p of ['src/screens/directory/forum/ForumThreadScreen.tsx', 'src/screens/directory/forum/ForumAskScreen.tsx']) {
      assert.match(code(p), /if \(asksForRules\(r\.code\)\) setRulesOpen\(true\)/, p);
    }
  });

  it('I AGREE goes to both', () => {
    assert.match(code('src/features/forum/forumFlags.ts'), /return acceptForumRules\(\(\) => store\.mutate/);
    assert.match(code('src/features/forum/api.ts'), /return acceptRulesBoth\(device, call\)/);
  });
});

/* ── 3. Block by post ───────────────────────────────────────────────── */

describe('block by post: forum_block_author when present, else the token block', () => {
  const legacyCalls: string[] = [];
  const legacy = async (t: string) => {
    legacyCalls.push(t);
    return { ok: true as const };
  };

  it('the new server blocks from the post, with or without a profile', async () => {
    legacyCalls.length = 0;
    const s = server({ forum_block_author: () => ok(true) });
    assert.deepEqual(await S.blockByPost(s.call, 'p1', null, legacy), { ok: true, value: true });
    assert.deepEqual(s.calls, [{ fn: 'forum_block_author', args: { p_post_id: 'p1', p_on: true } }]);
    assert.deepEqual(legacyCalls, []);
  });

  it('a refusal on the new server is told, never retried the old way', async () => {
    legacyCalls.length = 0;
    const s = server({ forum_block_author: () => refused('forum:not_found') });
    const r = await S.blockByPost(s.call, 'p1', 'tok', legacy);
    assert.equal(r.ok, false);
    assert.equal(!r.ok && r.message, 'forum:not_found');
    assert.deepEqual(legacyCalls, []);
  });

  it('the old server: the token block, and plain words with no profile', async () => {
    legacyCalls.length = 0;
    assert.deepEqual(await S.blockByPost(server({}).call, 'p1', 'tok-maya', legacy), { ok: true, value: true });
    assert.deepEqual(legacyCalls, ['tok-maya']);
    const none = await S.blockByPost(server({}).call, 'p1', null, legacy);
    assert.deepEqual(none, { ok: false, message: null, words: R.BLOCK_NO_PROFILE });
    const failedOld = await S.blockByPost(server({}).call, 'p1', 'tok', async () => ({ ok: false, error: 'No connection' }));
    assert.deepEqual(failedOld, { ok: false, message: null, words: 'No connection' });
  });

  it('the thread offers Block for anyone else, and blocks by the post', () => {
    const t = code('src/screens/directory/forum/ForumThreadScreen.tsx');
    assert.doesNotMatch(t, /blockAuthor\(/);
    assert.match(t, /blockPostAuthor\(post\.id, post\.author\.token\)/);
    assert.match(t, /blockPostAuthor\(p\.id, p\.author\.token\)/);
    assert.match(t, /canBlock=\{!!reportOf && !reportOf\.isMine\}/);
  });
});

/* ── 4. Directory chips ─────────────────────────────────────────────── */

describe('Directory kind chips: directory_search(p_kind) and directory_verified', () => {
  const ORG = 'a1b2c3d4-0000-4000-8000-000000000001';
  const ORG2 = 'a1b2c3d4-0000-4000-8000-000000000002';
  const words = (m: string | null | undefined) => `WORDS:${m ?? ''}`;
  const legacyOut: K.KindChipOutcome = { status: 'ok', results: [], total: 0, badges: new Map(), scanned: { read: 90, of: 200 }, orgs: [] };
  let legacyRan = 0;
  const legacy = async () => {
    legacyRan += 1;
    return legacyOut;
  };
  const member = { public_token: 'tok-harbor', display_name: 'Harbor Venue Group', total_count: 1, verified_kind: 'employer', work_pref: 'local' };

  it('the new server: one search by kind, plates from verified_kind, organizations without a profile', async () => {
    legacyRan = 0;
    const s = server({
      directory_search: (a) => (a?.p_kind === 'employer' ? ok([member]) : ok([])),
      directory_verified: () =>
        ok([
          { public_token: ORG, company_name: 'Coastal Hire Co', verified_kind: 'employer', verified_at: '2026-11-01T00:00:00Z', community_token: null, total_count: 3 },
          { public_token: ORG2, company_name: 'Harbor Venue Group', verified_kind: 'employer', community_token: 'tok-harbor', total_count: 3 },
          { public_token: 'not-a-uuid', company_name: 'Odd', verified_kind: 'employer', community_token: null },
        ]),
    });
    const out = await K.kindChip(s.call, 'employer', { args: { p_q: null, p_limit: 30, p_offset: 0 }, withOrgs: true }, words, legacy);
    assert.equal(out.status, 'ok');
    if (out.status !== 'ok') return;
    assert.equal(legacyRan, 0);
    assert.deepEqual(s.calls[0], { fn: 'directory_search', args: { p_q: null, p_limit: 30, p_offset: 0, p_kind: 'employer' } });
    assert.deepEqual(out.results.map((r) => r.displayName), ['Harbor Venue Group']);
    assert.equal(out.badges.get('tok-harbor')?.verifiedKind, 'employer');
    assert.equal(out.scanned, null);
    // Only the one with no community profile, with a usable page token.
    assert.deepEqual(out.orgs, [{ pageToken: ORG, name: 'Coastal Hire Co', kind: 'employer', verifiedAt: '2026-11-01T00:00:00Z' }]);
    assert.deepEqual(s.calls[1], { fn: 'directory_verified', args: { p_kind: 'employer', p_limit: 100, p_offset: 0 } });
  });

  it('the name box filters organizations too; instructors are never asked of directory_verified', async () => {
    assert.deepEqual(K.orgsOf([{ public_token: ORG, company_name: 'Coastal Hire Co', verified_kind: 'employer' }], 'employer', 'harbor'), []);
    assert.equal(K.orgsOf([{ public_token: ORG, company_name: 'Coastal Hire Co', verified_kind: 'employer' }], 'employer', 'coast').length, 1);
    assert.equal(K.orgsOf([{ public_token: ORG, company_name: 'X', verified_kind: 'company' }], 'employer').length, 0);
    assert.equal(K.orgsListed('instructor', 0, {}), false);
    assert.equal(K.orgsListed('company', 0, {}), true);
    assert.equal(K.orgsListed('company', 1, {}), false);
    assert.equal(K.orgsListed('company', 0, { areas: ['live'] }), false);
    assert.equal(K.orgsListed('company', 0, { q: 'name' } as never), true);
  });

  it('the old server: today\'s scan, and nothing else', async () => {
    legacyRan = 0;
    const s = server({ directory_search: (a) => (a && 'p_kind' in a ? MISSING('directory_search', a) : ok([member])) });
    const out = await K.kindChip(s.call, 'employer', { args: {}, withOrgs: true }, words, legacy);
    assert.equal(legacyRan, 1);
    assert.equal(out, legacyOut);
    assert.deepEqual(s.names(), ['directory_search']);
  });

  it('search by kind present, directory_verified missing: members only', async () => {
    const s = server({ directory_search: () => ok([member]) });
    const out = await K.kindChip(s.call, 'company', { args: {}, withOrgs: true }, words, legacy);
    assert.equal(out.status === 'ok' && out.orgs.length, 0);
  });

  it('a failed read on the new server fails the chip, never "nobody"', async () => {
    legacyRan = 0;
    const down = server({ directory_search: () => refused('Failed to fetch') });
    assert.deepEqual(await K.kindChip(down.call, 'employer', { args: {}, withOrgs: false }, words, legacy), { status: 'error', error: 'WORDS:Failed to fetch' });
    const orgsDown = server({ directory_search: () => ok([member]), directory_verified: () => refused('Failed to fetch') });
    assert.equal((await K.kindChip(orgsDown.call, 'employer', { args: {}, withOrgs: true }, words, legacy)).status, 'error');
    assert.equal(legacyRan, 0);
  });

  it('the chips use it, and the screen draws the organizations', () => {
    const api = code('src/features/directory/kindsApi.ts');
    assert.match(api, /return kindChip\(\s*chipCall,/);
    assert.match(api, /\(\) => scanKind\(chip, f\)/);
    const view = code('src/screens/directory/ExploreView.tsx');
    assert.match(view, /<OrgCard key=\{`org-\$\{o\.pageToken\}`\} org=\{o\} \/>/);
    assert.match(view, /visibleRows\.length === 0 && orgs\.length === 0/);
  });
});

/* ── 5. The Pro Lounge feed ─────────────────────────────────────────── */

describe('the Pro Lounge feed: one p_group read when present', () => {
  it('the new server: one call, and the server\'s ranking is kept', async () => {
    const s = server({ forum_topics_list: newTopicsList, forum_categories_list: () => ok(LOUNGE_CATS) });
    const r = await S.loungeTopics(s.call, 'top_week');
    assert.equal(r.ok, true);
    assert.deepEqual(s.calls, [
      { fn: 'forum_topics_list', args: { p_category: null, p_sort: 'top_week', p_limit: S.LOUNGE_LIMIT, p_offset: 0, p_group: 'pro_lounge' } },
    ]);
    // Not re-sorted by last activity: Top this week truly ranks.
    assert.deepEqual(r.ok && r.value.map((t) => t.id), ['a', 'c', 'b']);
  });

  it('the old server: the lounge categories merged by last activity, as today', async () => {
    const s = server({ forum_topics_list: oldTopicsList, forum_categories_list: () => ok(LOUNGE_CATS) });
    const r = await S.loungeTopics(s.call, 'latest');
    assert.deepEqual(r.ok && r.value.map((t) => t.id), ['b', 'c', 'a']);
    assert.deepEqual(s.names(), ['forum_topics_list', 'forum_categories_list', 'forum_topics_list', 'forum_topics_list']);
    assert.deepEqual(s.calls.slice(2).map((c) => c.args?.p_category), ['gig-talk', 'hiring-gigs']);
  });

  it('the old server: one failed category fails the feed', async () => {
    const s = server({
      forum_categories_list: () => ok(LOUNGE_CATS),
      forum_topics_list: (a) => (a?.p_category === 'hiring-gigs' ? refused('Failed to fetch') : oldTopicsList(a)),
    });
    assert.deepEqual(await S.loungeTopics(s.call, 'latest'), { ok: false, message: 'Failed to fetch' });
  });

  it('a failure on the new server is told, never the old four reads', async () => {
    const s = server({ forum_topics_list: () => refused('forum:pro_lounge_members_only'), forum_categories_list: () => ok(LOUNGE_CATS) });
    assert.deepEqual(await S.loungeTopics(s.call, 'latest'), { ok: false, message: 'forum:pro_lounge_members_only' });
    assert.deepEqual(s.names(), ['forum_topics_list']);
  });

  it('a thrown call is an answer, not a crash', async () => {
    const r = await S.loungeTopics(async () => {
      throw new Error('boom');
    }, 'latest');
    assert.deepEqual(r, { ok: false, message: 'boom' });
  });

  it('the screen reads it through the flow', () => {
    assert.match(code('src/features/forum/api.ts'), /return resultOf\(await loungeTopics\(call, sort\)\)/);
  });
});

/* ── 6. The owner's refusal words ───────────────────────────────────── */

describe('adminError: forum:not_allowed is a fact about the post', () => {
  it('plain owner-facing words, never "Could not read the queue"', () => {
    const r = A.adminError('forum:not_allowed');
    assert.equal(r.code, 'not_allowed');
    assert.equal(r.error, A.ADMIN_NOT_ALLOWED);
    assert.notEqual(r.error, A.ADMIN_UNREADABLE);
    assert.doesNotMatch(r.error, /not_allowed|Could not read/);
    assert.match(r.error, /child-safety/);
  });

  it('the other answers are unchanged', () => {
    assert.equal(A.adminError('not permitted').code, 'not_permitted');
    assert.equal(A.adminError('permission denied for function forum_admin_queue').code, 'not_permitted');
    assert.equal(A.adminError('not saved').code, 'not_saved');
    assert.equal(A.adminError('Failed to fetch').error, A.ADMIN_UNREADABLE);
    assert.equal(A.adminError('forum:not_allowedx').code, null);
  });
});

/* ── 7. The unread dot ──────────────────────────────────────────────── */

describe('the unread dot uses ever_read where present', () => {
  const t = (unread: boolean, everRead: boolean | null) => ({ unread, everRead }) as Pick<ForumTopic, 'unread' | 'everRead'>;

  it('the old server: every unread topic, as today', () => {
    assert.equal(R.showsUnreadDot(t(true, null)), true);
    assert.equal(R.showsUnreadDot(t(false, null)), false);
  });

  it('the new server: new replies in a topic read before, never a topic never opened', () => {
    assert.equal(R.showsUnreadDot(t(true, true)), true);
    assert.equal(R.showsUnreadDot(t(true, false)), false);
    assert.equal(R.showsUnreadDot(t(false, true)), false);
  });

  it('the row draws it, and the welcome popup still reads `unread` itself', () => {
    assert.match(code('src/screens/directory/forum/forumBits.tsx'), /\{showsUnreadDot\(topic\) \? <Text style=\{st\.unread\}>/);
    assert.match(code('src/screens/directory/forum/ForumHomeView.tsx'), /pinnedUnread: welcomePost \? welcomePost\.unread : null/);
  });
});

/* ── The rest of the new columns in use ─────────────────────────────── */

describe('the other new columns in use', () => {
  const post = (over: Partial<ForumPost>): ForumPost =>
    ({
      ...M.postOf({ post_id: 'p1', body: 'Body', is_mine: true, mod_state: 'held' }),
      ...over,
    }) as ForumPost;

  it('please_edit decides Edit and Repost when present; the old sentence rule otherwise', () => {
    const custom = { modRule: 'respect', modReason: 'Please reword the second line.' };
    // Old server: a note of its own means "please edit"; the neutral hold does not.
    assert.equal(R.moderationFace(post({ ...custom, pleaseEdit: null })).kind === 'review' && (R.moderationFace(post({ ...custom, pleaseEdit: null })) as { canEdit: boolean }).canEdit, true);
    assert.equal((R.moderationFace(post({ modRule: 'respect', modReason: R.HOLD_SENTENCE, pleaseEdit: null })) as { canEdit: boolean }).canEdit, false);
    // New server: the flag, whatever the sentence (F20's neutral edit-request
    // sentence, or a plain hold that happens to carry a note).
    assert.equal((R.moderationFace(post({ modRule: 'none', modReason: 'Please edit your post so it follows the forum rules, then post it again.', pleaseEdit: true })) as { canEdit: boolean }).canEdit, true);
    assert.equal((R.moderationFace(post({ ...custom, pleaseEdit: false })) as { canEdit: boolean }).canEdit, false);
    assert.equal((R.moderationFace(post({ ...custom, pleaseEdit: true, urgentCategory: 'child_safety' })) as { canEdit: boolean }).canEdit, false);
    assert.equal((R.moderationFace(post({ modRule: 'self_harm', modReason: 'x', pleaseEdit: true })) as { canEdit: boolean }).canEdit, false);
  });

  it('MARKED BY names the marker once the server says, the asker before', () => {
    assert.equal(R.solutionMarker({ solutionMarkedByName: 'Prof. Channing Booth' }, 'Jordan K.'), 'Prof. Channing Booth');
    assert.equal(R.solutionMarker({ solutionMarkedByName: null }, 'Jordan K.'), 'Jordan K.');
    assert.equal(R.solutionMarker(undefined, null), null);
    assert.match(code('src/screens/directory/forum/ForumThreadScreen.tsx'), /askerName=\{solutionMarker\(value\?\.topic,/);
  });

  it('mentions of people outside the thread are drawn', () => {
    const posts = [
      { author: { name: 'Jordan K.' }, mentions: [{ name: 'Sam T.', token: 's' }] },
      { author: { name: 'Maya R.' }, mentions: [] },
    ] as unknown as Pick<ForumPost, 'author' | 'mentions'>[];
    assert.deepEqual(R.threadMentionNames(posts), ['Jordan K.', 'Sam T.', 'Maya R.']);
    const parts = R.splitMentions('Ask @Sam T. about it', R.threadMentionNames(posts));
    assert.deepEqual(parts.filter((p) => p.mention).map((p) => p.text), ['@Sam T.']);
  });

  it('Ideas: the line from the list when it carries it, else one read per row', () => {
    const oldRows = [M.topicOf({ topic_id: 'i1' }), M.topicOf({ topic_id: 'i2' })];
    assert.equal(S.ideaDetailsFromList(oldRows), null);
    const newRows = [
      M.topicOf({ topic_id: 'i1', tracked_reason: 'v1.1: Now in Settings', area: 'Calculators', ever_read: true }),
      M.topicOf({ topic_id: 'i2', tracked_reason: null, area: null, ever_read: false }),
    ];
    assert.deepEqual(S.ideaDetailsFromList(newRows), {
      i1: { reason: 'v1.1: Now in Settings', area: 'Calculators' },
      i2: { reason: null, area: null },
    });
    assert.match(code('src/screens/directory/forum/ForumIdeasScreen.tsx'), /const fromList = ideaDetailsFromList\(value\);\s*if \(fromList\) \{\s*setDetails\(fromList\);\s*return undefined;/);
  });

  it('Edit and Repost from a notice starts from the whole post when the topic is known', () => {
    const mine = M.postOf({ post_id: 'p2', body: 'The whole approved reply', pending_body: 'The whole refused edit', is_mine: true });
    const opening = M.postOf({ post_id: 'p1', body: 'Opening', is_mine: true, is_opening: true });
    const other = M.postOf({ post_id: 'p3', body: 'Not mine' });
    const thread = { topic: { title: 'Wedge ring', categorySlug: 'ask-the-community' }, posts: [opening, mine, other] };
    assert.deepEqual(S.noticeEditFrom(thread, 'p2'), {
      slug: 'ask-the-community',
      edit: { postId: 'p2', isOpening: false, body: 'The whole refused edit' },
    });
    assert.deepEqual(S.noticeEditFrom(thread, 'p1')?.edit, { postId: 'p1', isOpening: true, body: 'Opening', title: 'Wedge ring' });
    assert.equal(S.noticeEditFrom(thread, 'p3'), null);
    assert.equal(S.noticeEditFrom(thread, 'gone'), null);
    const n = code('src/screens/directory/forum/ForumNoticesScreen.tsx');
    assert.match(n, /const full = await fetchNoticeEdit\(n\.topicId, postId\)/);
    assert.match(n, /partial: \(n\.excerpt \?\? ''\)\.length >= EXCERPT_MAX/);
  });
});

/* ── Row 30: the reports-hidden notice, in both shapes ──────────────── */

describe('a post hidden by member reports reads BEING REVIEWED in both shapes', () => {
  it('the old notice (sentence, no rule) and the new one (rule, not automated)', () => {
    const old = R.noticeFace(M.noticeOf({ id: 1, post_id: 'p', kind: 'hidden', message: R.HIDDEN_FOR_REVIEW, automated: true }));
    const fresh = R.noticeFace(
      M.noticeOf({ id: 1, post_id: 'p', kind: 'hidden', rule: 'reports_pending_review', message: R.HIDDEN_FOR_REVIEW, automated: false, topic_id: 't' }),
    );
    for (const f of [old, fresh]) {
      assert.equal(f.head, 'BEING REVIEWED');
      assert.equal(f.tone, 'hold');
      assert.equal(f.canAppeal, false);
      assert.equal(f.how, null);
    }
    // A real removal is still a removal.
    assert.equal(R.noticeFace(M.noticeOf({ id: 2, kind: 'hidden', rule: 'respect', message: 'Removed.' })).tone, 'removed');
  });
});

/* ── What counts as "the server does not have it" ───────────────────── */

describe('missingFunction: only "not there yet" falls back', () => {
  it('PGRST202, 42883 and their messages', () => {
    assert.equal(R.missingFunction({ code: 'PGRST202', message: '' }), true);
    assert.equal(R.missingFunction({ code: '42883', message: '' }), true);
    assert.equal(R.missingFunction({ message: 'Could not find the function public.forum_block_author(p_on, p_post_id) in the schema cache' }), true);
    assert.equal(R.missingFunction({ message: 'function public.forum_rules_accept() does not exist' }), true);
  });

  it('everything else is a failure', () => {
    assert.equal(R.missingFunction(null), false);
    assert.equal(R.missingFunction({ message: 'Failed to fetch' }), false);
    assert.equal(R.missingFunction({ code: '42501', message: 'permission denied for function forum_block_author' }), false);
    assert.equal(R.missingFunction({ code: 'P0001', message: 'forum:not_found' }), false);
    assert.equal(K.chipFunctionMissing({ code: 'PGRST202' }), true);
    assert.equal(K.chipFunctionMissing({ code: '57014', message: 'canceling statement due to statement timeout' }), false);
  });
});
