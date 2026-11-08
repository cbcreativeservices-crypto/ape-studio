/**
 * Audio Community Forum, slice 2 (owner go 2026-11-07): the launch set, the
 * Directory's kinds, the owner's queue and Discuss this lab. Pure rules, and
 * ratchets for what must not drift:
 *  - a lab has ONE key, from the Ask form to Discuss this lab;
 *  - a list that stopped early says so, and a failed badge read is not "nobody";
 *  - the queue never restores a child-safety post, and a refusal is not "empty";
 *  - nothing here is reachable while COMMUNITY_VISIBLE is false.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  MENTIONS_MAX,
  aiUsageLine,
  applyMention,
  correctionFace,
  draftKey,
  jumpIndex,
  labForKey,
  labKeyOf,
  labNameForRoute,
  levelFace,
  levelMark,
  mentionMatches,
  mentionQuery,
  mentionTokensIn,
  queueOffers,
  queueWords,
  splitMentions,
  tomorrowMorning,
  trackedChoices,
  trackedProblem,
  urgentLabel,
} from '../src/features/forum/rules.ts';
import { adminAppealOf, adminError, queueItemOf } from '../src/features/forum/adminRows.ts';
import { bookmarkOf, meOf, postOf, topicDetailOf, topicOf } from '../src/features/forum/mappers.ts';
import {
  badgeLabel,
  badgeOf,
  chipEmpty,
  scanNote,
  stripName,
  tokensOfKind,
} from '../src/features/directory/kinds.ts';
import {
  VERIFIER_COPY,
  contactKindOf,
  switchRefusal,
  verifiedStatusOf,
  verifierKindOf,
} from '../src/features/employer/verifierKind.ts';
import { FORUM_SAMPLE_STATES } from '../src/features/forum/sampleSwitch.ts';

const read = (p: string) => readFileSync(p, 'utf8').replace(/\r\n/g, '\n');
const code = (p: string) => read(p).replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');

describe('levels and badges', () => {
  it('a Member wears no mark; New and Regular do; a former member has none', () => {
    assert.equal(levelMark({ trust: 'new', former: false }), 'NEW');
    assert.equal(levelMark({ trust: 'member', former: false }), null);
    assert.equal(levelMark({ trust: 'regular', former: false }), 'REGULAR');
    assert.equal(levelMark({ trust: 'regular', former: true }), null);
    assert.equal(levelMark({ trust: null, former: false }), null);
  });

  it('says what the next level asks for, never a count against a total', () => {
    assert.match(levelFace('new')?.next ?? '', /Member/);
    assert.equal(levelFace('regular')?.next, null);
    assert.equal(levelFace(null), null);
    assert.doesNotMatch(levelFace('member')?.next ?? '', /\d+ of \d+/);
  });

  it('reads the badges forum_me sends', () => {
    const me = meOf({ badges: [{ slug: 'mentor', name: 'Mentor', awarded_at: 't' }, {}] });
    assert.deepEqual(me.badges, [{ slug: 'mentor', name: 'Mentor', awardedAt: 't' }]);
  });
});

describe('@mentions', () => {
  it('sees the name being typed, at the end of the box only', () => {
    assert.equal(mentionQuery('hello @Ma'), 'Ma');
    assert.equal(mentionQuery('@'), '');
    assert.equal(mentionQuery('no mention'), null);
    assert.equal(mentionQuery('mail me at a@b'), null);
  });

  it('finishes the mention and leaves the rest', () => {
    assert.equal(applyMention('as @Ma', 'Maya R.'), 'as @Maya R. ');
  });

  it('sends each person once, within the server limit', () => {
    const people = [1, 2, 3, 4, 5, 6, 7].map((n) => ({ name: `P${n}`, token: `t${n}` }));
    const body = people.map((p) => `@${p.name}`).join(' ') + ' @P1';
    assert.equal(mentionTokensIn(body, people).length, MENTIONS_MAX);
    assert.deepEqual(mentionTokensIn('nobody', people), []);
    assert.deepEqual(mentionTokensIn('@P1 hi', [...people.slice(0, 1), people[0]]), ['t1']);
  });

  it('suggests each person once, best match first', () => {
    const people = [
      { name: 'Anna Maya', token: 'a' },
      { name: 'Maya R.', token: 'b' },
      { name: 'Maya R.', token: 'b' },
    ];
    assert.deepEqual(mentionMatches('Ma', people).map((p) => p.token), ['b', 'a']);
  });

  it('draws a mention of someone known, and nothing else', () => {
    assert.deepEqual(splitMentions('as @Maya R. says', ['Maya R.']), [
      { text: 'as ', mention: false },
      { text: '@Maya R.', mention: true },
      { text: ' says', mention: false },
    ]);
    assert.deepEqual(splitMentions('as @Nobody says', ['Maya R.']), [{ text: 'as @Nobody says', mention: false }]);
    assert.deepEqual(splitMentions('plain', []), [{ text: 'plain', mention: false }]);
  });
});

describe('bookmarks, unread, drafts, corrections', () => {
  it('"tomorrow" is nine the next morning, the member\'s own time', () => {
    const d = new Date(tomorrowMorning(new Date(2026, 10, 7, 22, 30)));
    assert.equal(d.getDate(), 8);
    assert.equal(d.getHours(), 9);
  });

  it('jumps to the first unread, and stays at the top when that is the start', () => {
    const posts = [{ id: 'a' }, { id: 'b' }, { id: 'c' }];
    assert.equal(jumpIndex(posts, 'c'), 2);
    assert.equal(jumpIndex(posts, 'a'), null);
    assert.equal(jumpIndex(posts, 'gone'), null);
    assert.equal(jumpIndex(posts, null), null);
  });

  it('a draft belongs to one box', () => {
    assert.equal(draftKey({ topicId: 't' }), 'reply:t');
    assert.equal(draftKey({ slug: 's' }), 'ask:s');
    assert.notEqual(draftKey({ topicId: 't' }), draftKey({ slug: 't' }));
  });

  it('only the corrected post\'s author can answer a correction', () => {
    const suggested = { postKind: 'correction', correctionState: 'suggested' };
    assert.equal(correctionFace(suggested, true)?.canResolve, true);
    assert.equal(correctionFace(suggested, false)?.canResolve, false);
    assert.equal(correctionFace({ ...suggested, correctionState: 'accepted' }, true)?.canResolve, false);
    assert.equal(correctionFace({ ...suggested, correctionState: 'dismissed' }, true)?.head, 'CORRECTION DECLINED');
    assert.equal(correctionFace({ postKind: 'reply', correctionState: null }, true), null);
  });

  it('accepting does not rewrite the post: the author edits, and the edit is checked', () => {
    const src = code('src/screens/directory/forum/ForumThreadScreen.tsx');
    assert.match(src, /resolveCorrection\(post\.id, accept\)/);
    assert.match(src, /suggestion: post\.body/);
  });

  it('reads the new fields', () => {
    assert.equal(topicOf({ first_unread_post_id: 'p' }).firstUnreadPostId, 'p');
    assert.equal(topicDetailOf({ follow_level: 'all' }).followLevel, 'all');
    const p = postOf({ correction_of_post_id: 'x', correction_state: 'suggested', bookmarked: true });
    assert.deepEqual([p.correctionOfPostId, p.correctionState, p.bookmarked], ['x', 'suggested', true]);
    assert.equal(bookmarkOf({ post_id: 'p', topic_title: 'T' }).topicTitle, 'T');
  });
});

describe('one key per lab', () => {
  const leaves = [
    { name: 'Gain Staging', route: 'GainLabHome' },
    { name: 'Equalizer', route: 'EqModule', params: { id: 'parametric' } },
    { name: 'Filters', route: 'EqModule', params: { id: 'filters' } },
    { name: 'Planned', route: 'Later', status: 'development' },
  ];

  it('params decide when one route serves several labs', () => {
    assert.equal(labNameForRoute(leaves, 'EqModule', { id: 'filters' }), 'Filters');
    assert.equal(labNameForRoute(leaves, 'EqModule', { id: 'parametric' }), 'Equalizer');
    assert.equal(labNameForRoute(leaves, 'GainLabHome'), 'Gain Staging');
  });

  it('a route that is no lab, or a planned one, is nothing', () => {
    assert.equal(labNameForRoute(leaves, 'Settings'), null);
    assert.equal(labNameForRoute(leaves, 'Later'), null);
  });

  it('a card finds its lab from the key the Ask form wrote', () => {
    assert.equal(labForKey(leaves, labKeyOf('Gain Staging'))?.route, 'GainLabHome');
    assert.equal(labForKey(leaves, labKeyOf('Filters'))?.route, 'EqModule');
    assert.equal(labForKey(leaves, 'not-a-lab'), null);
  });

  it('every lab in the catalog gets a distinct, valid key', () => {
    const names = [...code('src/screens/lab/labCatalog.ts').matchAll(/\{ name: '([^']+)', blurb:/g)].map((m) => m[1]);
    assert.ok(names.length > 40);
    for (const n of names) assert.match(labKeyOf(n), /^[a-z0-9][a-z0-9_-]{1,79}$/, n);
    const byKey = new Map<string, string>();
    for (const n of names) {
      const k = labKeyOf(n);
      assert.ok(!byKey.has(k) || byKey.get(k) === n, `${n} and ${byKey.get(k)} share a key`);
      byKey.set(k, n);
    }
  });

  it('the Ask form and Discuss this lab use the same source', () => {
    assert.match(code('src/screens/directory/forum/ForumAskScreen.tsx'), /labLinks'\)[\s\S]{0,80}\.labNames\(\)/);
    assert.match(code('src/screens/directory/forum/DiscussLabLink.tsx'), /labOfRoute\(route\.name/);
    assert.match(code('src/features/forum/labLinks.ts'), /labKeyOf\(name\)/);
  });

  it('Discuss this lab sits on the shared end screen, off while the community is off', () => {
    assert.match(read('src/screens/lab/kit/LabEndScreen.tsx'), /<DiscussLabLink labTitle=\{labTitle\} \/>/);
    assert.match(code('src/screens/directory/forum/DiscussLabLink.tsx'), /if \(!COMMUNITY_VISIBLE && !sampleForumOn\(\)\) return null;/);
  });

  it('adds nothing to a lab until the tap: everything of the forum is required there', () => {
    const src = code('src/screens/directory/forum/DiscussLabLink.tsx');
    assert.doesNotMatch(src, /^import .*features\/forum\/(api|labLinks|rules)/m);
    assert.match(src, /require\('\.\.\/\.\.\/\.\.\/features\/forum\/api'\)/);
  });
});

describe('the four verified kinds (must-do R1)', () => {
  it('a company or institution is no longer a plain member', () => {
    assert.equal(contactKindOf('company'), 'company');
    assert.equal(contactKindOf('institution'), 'institution');
    assert.equal(contactKindOf('employer'), 'employer');
    assert.equal(contactKindOf('instructor'), 'instructor');
    assert.equal(contactKindOf('spaceship'), 'member');
    assert.equal(contactKindOf(null), 'member');
  });

  it('an account keeps its own kind; the old default stays for anything else', () => {
    for (const k of ['employer', 'company', 'institution', 'instructor']) assert.equal(verifierKindOf(k), k);
    assert.equal(verifierKindOf('spaceship'), 'employer');
  });

  it('every kind has every word', () => {
    const keys = Object.keys(VERIFIER_COPY.employer).sort();
    for (const copy of Object.values(VERIFIER_COPY)) assert.deepEqual(Object.keys(copy).sort(), keys);
    assert.equal(VERIFIER_COPY.company.badge, 'VERIFIED COMPANY');
    assert.equal(VERIFIER_COPY.institution.badge, 'VERIFIED INSTITUTION');
  });

  it('reads the switch status', () => {
    assert.deepEqual(verifiedStatusOf({ kind: 'employer', can_switch: true, switch_to: 'company' }), {
      kind: 'employer',
      canSwitch: true,
      switchTo: 'company',
      nextSwitchAt: null,
    });
    assert.equal(verifiedStatusOf(null).canSwitch, false);
    assert.equal(verifiedStatusOf({ kind: null }).kind, null);
  });

  it('a refused switch is plain words, never a code', () => {
    assert.match(switchRefusal('verified:not_available'), /not open yet/);
    assert.match(switchRefusal('verified:too_soon'), /after a day/);
    assert.doesNotMatch(switchRefusal('verified:something_new'), /verified:/);
    assert.match(switchRefusal(null), /unchanged/);
  });

  it('the switch draws nothing unless the server says it is open', () => {
    const src = code('src/screens/profile/KindSwitchRow.tsx');
    assert.match(src, /if \(!status\?\.canSwitch \|\|/);
    assert.match(read('src/screens/profile/EmployerSection.tsx'), /<KindSwitchRow onSwitched=/);
  });
});

describe('the Directory chips', () => {
  it('a plate for a kind, or for a graduate; a verified kind wins', () => {
    assert.equal(badgeLabel({ verifiedKind: 'company', graduate: true }), 'COMPANY');
    assert.equal(badgeLabel({ verifiedKind: null, graduate: true }), 'GRADUATE');
    assert.equal(badgeLabel({ verifiedKind: null, graduate: false }), null);
    assert.equal(badgeLabel(null), null);
  });

  it('an unknown kind wears no plate', () => {
    assert.deepEqual(badgeOf({ verified_kind: 'spaceship', graduate: false }), { verifiedKind: null, graduate: false });
  });

  it('picks the members of one kind, keeping their order', () => {
    const b = new Map([
      ['a', { verifiedKind: 'employer' as const, graduate: false }],
      ['b', { verifiedKind: 'company' as const, graduate: false }],
      ['c', { verifiedKind: 'employer' as const, graduate: false }],
    ]);
    assert.deepEqual(tokensOfKind(['c', 'b', 'a', 'd'], b, 'employer'), ['c', 'a']);
  });

  it('a kind chip that stopped early says so', () => {
    assert.match(scanNote(90, 212) ?? '', /first 90 members/);
    assert.equal(scanNote(30, 30), null);
  });

  it('a failed badge read is not "nobody of this kind"', () => {
    const src = code('src/features/directory/kindsApi.ts');
    assert.match(src, /if \(badges\.size === 0 && seen\.length > 0\) \{\s*return \{ status: 'error'/);
  });

  it('short words', () => {
    assert.equal(chipEmpty('employer').title, 'No employers listed yet');
    assert.equal(stripName('Maya R.'), 'Maya R.');
    assert.equal(stripName('Northside Production Rentals'), 'Northside');
  });

  it('the strip fails in one line, and the chips go through one search', () => {
    assert.match(code('src/screens/directory/DirectoryChips.tsx'), /Couldn’t load recent graduates\./);
    assert.match(code('src/screens/directory/ExploreView.tsx'), /searchByChip\(chipRef\.current, filters\)/);
  });
});

describe("the owner's queue", () => {
  it('a child-safety post is never restored or sent back for editing from here', () => {
    const child = queueOffers({ postId: 'p', urgentCategory: 'child_safety' });
    assert.deepEqual(child, { restore: false, hide: false, pleaseEdit: false, delete: true });
    const threat = queueOffers({ postId: 'p', urgentCategory: 'threat' });
    assert.deepEqual(threat, { restore: true, hide: true, pleaseEdit: true, delete: true });
    assert.equal(queueOffers({ postId: null, urgentCategory: null }).delete, false);
  });

  it('child-safety text is never drawn, whatever the row carries', () => {
    assert.match(code('src/screens/admin/ForumQueueView.tsx'), /\{child \? \(\s*<Text style=\{st\.child\}>/);
  });

  it('a refusal is its own words, a dropped connection another', () => {
    assert.equal(adminError('not permitted').code, 'not_permitted');
    assert.equal(adminError('Failed to fetch').code, null);
    assert.notEqual(adminError('not permitted').error, adminError('Failed to fetch').error);
  });

  it('every queue list says it failed before it can say it is empty', () => {
    const src = code('src/screens/admin/ForumQueueView.tsx');
    const lists: [string, string][] = [
      ['Nothing is waiting for you.', 'function QueueList'],
      ['No appeals are waiting.', 'function AppealList'],
      ['No ideas, corrections or bug reports yet.', 'function TrackedList'],
    ];
    for (const [empty, fn] of lists) {
      const body = src.slice(src.indexOf(fn));
      assert.ok(body.indexOf('<Failed ') < body.indexOf(empty), fn);
    }
  });

  it('machine codes become words', () => {
    assert.equal(queueWords('auto_hide_reports'), 'auto hide reports');
    assert.equal(queueWords('recommend_ban'), 'ban');
    assert.equal(queueWords(null), '');
    assert.equal(urgentLabel('self_harm'), 'SELF-HARM RISK');
    assert.equal(urgentLabel('other'), null);
  });

  it('a status needs what the server needs', () => {
    assert.ok(trackedChoices('glossary').includes('accepted'));
    assert.ok(!trackedChoices('idea').includes('accepted'));
    assert.match(trackedProblem('declined', ' ') ?? '', /reason/);
    assert.equal(trackedProblem('declined', 'Out of scope'), null);
    assert.equal(trackedProblem('planned', ''), null);
  });

  it('the AI line', () => {
    assert.equal(aiUsageLine({ calls: 412, costUsd: 3.2, capUsd: 50 }), '$3.20 of the $50.00 cap · 412 checks');
    assert.match(aiUsageLine(null), /No AI use/);
  });

  it('reads a row', () => {
    const q = queueItemOf({ log_id: 7, open_reports: 2, post_id: 'p', author: { name: 'A' } });
    assert.deepEqual([q.logId, q.openReports, q.postId, q.author?.name], [7, 2, 'p', 'A']);
    assert.equal(queueItemOf({ log_id: 1 }).author, null);
    assert.equal(adminAppealOf({ appeal_id: 'a', reason: 'r' }).appealId, 'a');
  });

  it('every call checks the sample first, and only the hand of the owner bans', () => {
    const api = code('src/features/forum/adminApi.ts');
    for (const m of api.matchAll(/^export async function (\w+)/gm)) {
      const at = api.indexOf(`export async function ${m[1]}(`);
      const next = api.indexOf('\nexport ', at + 10);
      assert.match(api.slice(at, next < 0 ? undefined : next), /if \(sampleForumOn\(\)\)/, m[1]);
    }
    assert.match(code('src/screens/admin/ForumQueueView.tsx'), /confirmDialog\(\s*`\$\{what\}/);
  });

  it('is reached from the existing Abuse reports screen, and loads on demand', () => {
    const src = code('src/screens/admin/ReportsAdminScreen.tsx');
    assert.match(src, /\['open', 'all', 'forum'\]/);
    assert.match(src, /require\('\.\/ForumQueueView'\)/);
    assert.doesNotMatch(src, /^import .*ForumQueueView/m);
    assert.doesNotMatch(read('src/navigation/linking.ts'), /ReportsAdmin/);
  });
});

describe('the harness and the house rules', () => {
  it('every new area has a state, and failures of each', () => {
    const ids = FORUM_SAMPLE_STATES.map((s) => s.id);
    for (const id of [
      'no-profile', 'thread-correction', 'thread-admin', 'mine', 'mine-empty', 'mine-unreadable', 'discuss', 'discuss-new',
      'kind-switch', 'dir-all', 'dir-graduates', 'dir-employers', 'dir-companies', 'dir-institutions', 'dir-instructors',
      'dir-empty', 'dir-unreadable', 'queue', 'queue-empty', 'queue-unreadable', 'queue-refused',
    ]) {
      assert.ok(ids.includes(id), id);
    }
    assert.equal(new Set(ids).size, ids.length);
  });

  it('the directory calls answer from the sample too, so nothing goes live', () => {
    const dir = read('src/features/directory/api.ts');
    assert.match(dir, /if \(sampleForumOn\(\)\) return \(require\('\.\.\/forum\/sampleData'\)[^\n]*\.sampleMembers\(f\);/);
    assert.match(dir, /if \(sampleForumOn\(\)\) return \(require\('\.\.\/forum\/sampleData'\)[^\n]*\.sampleProfile\(token\);/);
    const kinds = code('src/features/directory/kindsApi.ts');
    assert.match(kinds, /if \(sampleForumOn\(\)\) return data\(\)\.sampleGraduates\(\);/);
    assert.match(kinds, /if \(sampleForumOn\(\)\) return data\(\)\.sampleBadges\(tokens\);/);
  });

  it('the swipe addition is the five approved screens, and no more', () => {
    const nav = read('src/navigation/RootNavigator.tsx');
    for (const s of ['ForumCategory', 'ForumThread', 'ForumAsk', 'ForumIdeas', 'ForumNotices']) {
      assert.match(nav, new RegExp(`name="${s}" getComponent=\\{Lazy\\.${s}\\} options=\\{swipe\\}`), s);
    }
    assert.match(nav, /name="ForumMine" getComponent=\{Lazy\.ForumMine\} \/>/);
  });

  it('the community is on (owner 2026-11-07, forum by OTA)', () => {
    assert.match(read('src/config/communityVisible.ts'), /export const COMMUNITY_VISIBLE = true;/);
  });

  it('SEE CREDENTIALS goes to a route the root stack can reach', () => {
    for (const f of ['ForumCategoryScreen', 'ForumThreadScreen']) {
      const src = code(`src/screens/directory/forum/${f}.tsx`);
      assert.match(src, /navigate\('Awards', \{ category: 'specialization' \}\)/, f);
      assert.doesNotMatch(src, /navigate\('Certificates'\)/, f);
    }
  });

  it('SERVER GAPS is kept, with a smallest change for each', () => {
    const gaps = read('docs/forum/SERVER_GAPS.md');
    const rows = gaps.split('\n').filter((l) => /^\| \d+ \|/.test(l));
    assert.ok(rows.length >= 20);
    for (const r of rows) assert.ok(r.split('|').length >= 5 && !/\|\s*\|/.test(r), r);
  });
});
