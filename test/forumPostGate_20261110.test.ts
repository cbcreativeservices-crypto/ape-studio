/**
 * Who may post (Comp A brief 2026-11-09 rev 2, owner-approved 2026-11-10).
 *
 * §4a THE DEADLOCK: the community rules popup was reached only by posting, and
 * every post control was off while forum_me said `rules_not_accepted`, so no
 * new member could ever post. Now that reason opens the rules popup straight
 * from the tap, and I AGREE goes on to the composer.
 * §4b every other reason opens one popup that says why, with one button to the
 * fix; one decision and one wording table for every post control.
 * §4c a permanent COMMUNITY RULES link on the forum home.
 */
import { afterEach, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import * as R from '../src/features/forum/rules.ts';
import {
  FORUM_SAMPLE_STATES,
  sampleBlocker,
  sampleFix,
  setSampleFlags,
  setSampleForum,
} from '../src/features/forum/sampleSwitch.ts';
import * as D from '../src/features/forum/sampleData.ts';

const read = (p: string) => readFileSync(p, 'utf8').replace(/\r\n/g, '\n');
const code = (p: string) => read(p).replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
const F = 'src/screens/directory/forum/';

const me = (reason: string | null) => ({ canPost: reason === null, reason });
const right = (reason: string | null, start = reason === null, reply = reason === null) => ({
  canStartTopic: start,
  canReply: reply,
  reason,
});

/* ── The one decision ─────────────────────────────────────────────────── */

describe('postStep: reason to rules, a popup, or open', () => {
  it('rules_not_accepted opens the rules popup, never a dead control (§4a)', () => {
    assert.deepEqual(R.postStep(me('rules_not_accepted'), null, 'start'), { kind: 'rules' });
    assert.deepEqual(R.postStep(null, right('rules_not_accepted'), 'reply'), { kind: 'rules' });
    assert.deepEqual(R.blockedStep('rules_not_accepted'), { kind: 'rules' });
  });

  it('every listed reason has its own popup (§4b)', () => {
    for (const code of [
      'profile_unpublished',
      'adult_attestation',
      'email_unconfirmed',
      'muted',
      'account_restricted',
      'pro_lounge_members_only',
      'staff_only',
    ]) {
      assert.deepEqual(R.postStep(me(code), null, 'start'), { kind: 'sheet', sheet: code, code }, code);
    }
  });

  it('any other code, or a refusal with no reason, is the plain popup', () => {
    assert.deepEqual(R.postStep(me('brand_new_rule'), null, 'start'), { kind: 'sheet', sheet: 'other', code: 'brand_new_rule' });
    assert.deepEqual(R.postStep({ canPost: false, reason: null }, null, 'start'), { kind: 'sheet', sheet: 'other', code: null });
  });

  it('forum_me is asked first, then the category, as the server does', () => {
    assert.equal(R.postStep(me('profile_unpublished'), right('staff_only'), 'start').kind, 'sheet');
    assert.deepEqual(R.postStep(me('profile_unpublished'), right('staff_only'), 'start'), {
      kind: 'sheet',
      sheet: 'profile_unpublished',
      code: 'profile_unpublished',
    });
    assert.deepEqual(R.postStep(me(null), right('staff_only', false, true), 'start'), {
      kind: 'sheet',
      sheet: 'staff_only',
      code: 'staff_only',
    });
  });

  it('start and reply read their own permission', () => {
    // A staff-only category: no new topics, replies open.
    assert.deepEqual(R.postStep(me(null), right('staff_only', false, true), 'reply'), { kind: 'open' });
    assert.deepEqual(R.postStep(me(null), right(null), 'start'), { kind: 'open' });
  });

  it('nothing known is open: the press goes on and the server answers', () => {
    assert.deepEqual(R.postStep(null, null, 'start'), { kind: 'open' });
    assert.deepEqual(R.postStep(undefined, undefined, 'reply'), { kind: 'open' });
  });
});

describe('refusalStep: a post call refused for who may post opens the same popup', () => {
  it('category-only codes from the post call map to their popups', () => {
    assert.deepEqual(R.refusalStep('staff_only'), { kind: 'sheet', sheet: 'staff_only', code: 'staff_only' });
    assert.deepEqual(R.refusalStep('pro_lounge_members_only'), {
      kind: 'sheet',
      sheet: 'pro_lounge_members_only',
      code: 'pro_lounge_members_only',
    });
    assert.deepEqual(R.refusalStep('rules_not_accepted'), { kind: 'rules' });
    assert.deepEqual(R.refusalStep('employer_careers_only'), { kind: 'sheet', sheet: 'other', code: 'employer_careers_only' });
  });

  it('a refusal about the post itself stays an inline line', () => {
    for (const code of ['too_long', 'too_short', 'bad_title', 'locked', 'links_after_new', null, undefined]) {
      assert.equal(R.refusalStep(code), null, String(code));
    }
  });
});

describe('followUpStep: back from a fix, the next blocker', () => {
  it('a different blocker left is shown next; the rules open their popup', () => {
    assert.deepEqual(R.followUpStep('profile_unpublished', { kind: 'rules' }), { kind: 'rules' });
    const adult = R.blockedStep('adult_attestation');
    assert.deepEqual(R.followUpStep('profile_unpublished', adult), adult);
  });
  it('nothing left, or the same blocker still there: nothing is shown', () => {
    assert.equal(R.followUpStep('profile_unpublished', { kind: 'open' }), null);
    assert.equal(R.followUpStep('profile_unpublished', R.blockedStep('profile_unpublished')), null);
    assert.equal(R.followUpStep('rules_not_accepted', { kind: 'rules' }), null);
  });
});

/* ── The one wording table ────────────────────────────────────────────── */

const KINDS: R.BlockSheetKind[] = [
  'profile_unpublished',
  'adult_attestation',
  'email_unconfirmed',
  'muted',
  'account_restricted',
  'pro_lounge_members_only',
  'staff_only',
  'other',
];

describe('blockSheet: one wording table, the house words', () => {
  it('every popup has a title, plain words and at most one button to a known place', () => {
    for (const k of KINDS) {
      const s = R.blockSheet(k, k === 'other' ? null : k);
      assert.ok(s.title.length > 0 && s.text.length > 20, k);
      if (s.button) {
        assert.ok(['profile', 'support', 'credentials'].includes(s.button.dest), k);
        assert.equal(s.button.label, s.button.label.toUpperCase(), k);
      }
    }
  });

  it('the buttons and where they go (§4b table)', () => {
    const b = (k: R.BlockSheetKind) => R.blockSheet(k, k).button;
    assert.deepEqual(b('profile_unpublished'), { label: 'SET UP MY PROFILE', dest: 'profile' });
    assert.deepEqual(b('adult_attestation'), { label: 'CONFIRM 18+', dest: 'profile' });
    assert.deepEqual(b('account_restricted'), { label: 'CONTACT SUPPORT', dest: 'support' });
    assert.deepEqual(b('pro_lounge_members_only'), { label: 'SEE CREDENTIALS', dest: 'credentials' });
    assert.equal(b('email_unconfirmed'), null);
    assert.equal(b('muted'), null);
    assert.equal(b('staff_only'), null);
    assert.equal(R.blockSheet('other', 'some_new_reason').button, null);
  });

  it('the profile popup names the Audio Community profile (the two-profile mix-up, 2026-11-08)', () => {
    assert.match(R.blockSheet('profile_unpublished', 'profile_unpublished').text, /Audio Community profile/);
    assert.match(R.blockSheet('adult_attestation', 'adult_attestation').text, /Audio Community profile/);
  });

  it('the Pro Lounge keeps the owner’s exact words', () => {
    assert.ok(R.blockSheet('pro_lounge_members_only', null).text.startsWith(R.PRO_LOUNGE_REFUSAL));
  });

  it('muted says until when, in local time; without a time, the old words', () => {
    const s = R.blockSheet('muted', 'muted', { mutedUntil: '2026-11-12T22:30:00Z', now: Date.parse('2026-11-10T00:00:00Z') });
    const when = R.localWhen('2026-11-12T22:30:00Z', Date.parse('2026-11-10T00:00:00Z'));
    assert.equal(s.text, `You can read the forum, but you cannot post until ${when}.`);
    assert.match(when, /^Nov 1[23] at \d{1,2}:\d{2} (AM|PM)$/);
    assert.equal(R.blockSheet('muted', 'muted').text, R.refusalText('muted'));
    assert.equal(R.blockSheet('muted', 'muted', { mutedUntil: 'not a date' }).text, R.refusalText('muted'));
  });

  it('an unknown code is never shown raw; a known one keeps its own words', () => {
    const s = R.blockSheet('other', 'some_new_reason');
    assert.equal(s.text, R.CANNOT_POST_HERE);
    assert.doesNotMatch(`${s.title} ${s.text}`, /some_new_reason/);
    assert.equal(R.blockSheet('other', 'employer_careers_only').text, R.refusalText('employer_careers_only'));
  });

  it('US English, "suggest" never "recommend", no codes, no "N of total", no long dashes', () => {
    for (const k of KINDS) {
      const s = R.blockSheet(k, k === 'other' ? null : k, { mutedUntil: '2026-11-12T22:30:00Z' });
      const all = `${s.title} ${s.text} ${s.button?.label ?? ''}`;
      assert.doesNotMatch(all, /recommend/i, k);
      assert.doesNotMatch(all, /\b\d+ of \d+\b/, k);
      assert.doesNotMatch(all, /[a-z]+_[a-z]+/, k);
      assert.doesNotMatch(all, /—/, k);
      assert.doesNotMatch(all, /\b(colour|licence|organisation|centre|favour)\b/i, k);
    }
  });
});

describe('localWhen', () => {
  it('names the day and a 12-hour time; the year once it differs', () => {
    const d = new Date(2026, 10, 10, 15, 5);
    assert.equal(R.localWhen(d.toISOString(), d.getTime()), 'Nov 10 at 3:05 PM');
    const midnight = new Date(2026, 10, 10, 0, 0);
    assert.equal(R.localWhen(midnight.toISOString(), midnight.getTime()), 'Nov 10 at 12:00 AM');
    const next = new Date(2027, 0, 2, 9, 30);
    assert.equal(R.localWhen(next.toISOString(), d.getTime()), 'Jan 2, 2027 at 9:30 AM');
    assert.equal(R.localWhen('nope'), '');
  });
});

describe('rulesAgreedNow: the COMMUNITY RULES link (§4c)', () => {
  const device = (known: boolean, rulesAccepted: boolean) => ({ known, rulesAccepted });
  it('the server’s "not agreed" wins over the phone', () => {
    assert.equal(R.rulesAgreedNow({ reason: 'rules_not_accepted', rulesAcceptedAt: null }, device(true, true)), false);
  });
  it('the server’s record, then the phone’s once read', () => {
    assert.equal(R.rulesAgreedNow({ reason: null, rulesAcceptedAt: '2026-11-10T08:00:00Z' }, device(false, false)), true);
    assert.equal(R.rulesAgreedNow({ reason: null, rulesAcceptedAt: null }, device(true, true)), true);
    assert.equal(R.rulesAgreedNow(null, device(false, true)), false);
    assert.equal(R.rulesAgreedNow(null, device(true, false)), false);
  });
});

/* ── The dev sample leads one step at a time ──────────────────────────── */

describe('the sample answers like the server', () => {
  const g = globalThis as { __DEV__?: boolean };
  afterEach(() => {
    setSampleForum(null);
    delete g.__DEV__;
  });
  const open = (id: string) => {
    g.__DEV__ = true;
    const s = FORUM_SAMPLE_STATES.find((x) => x.id === id);
    assert.ok(s, id);
    setSampleForum(s);
  };

  it('the deadlock state: forum_me and every category say rules_not_accepted, until I AGREE', () => {
    open('block-rules');
    const h = D.sampleHome();
    assert.deepEqual([h.me.canPost, h.me.reason], [false, 'rules_not_accepted']);
    assert.ok(h.rights.every((r) => !r.canStartTopic && r.reason === 'rules_not_accepted'));
    setSampleFlags({ rulesAccepted: true });
    const after = D.sampleHome();
    assert.deepEqual([after.me.canPost, after.me.reason], [true, null]);
  });

  it('the chain: profile first, then the rules', () => {
    open('block-chain');
    assert.equal(sampleBlocker(), 'profile_unpublished');
    sampleFix('profile_unpublished');
    assert.equal(sampleBlocker(), 'rules_not_accepted');
    setSampleFlags({ rulesAccepted: true });
    assert.equal(sampleBlocker(), null);
  });

  it('a muted member carries muted_until', () => {
    open('block-muted');
    assert.equal(D.sampleHome().me.mutedUntil, '2026-11-12T22:30:00Z');
  });

  it('the post call refuses a blocked member, and a category-only code', () => {
    open('block-email');
    const r = D.sampleSubmit({ body: 'hello there', clientId: 'x1', category: 'ask-the-community', title: 'A real title' });
    assert.equal(r.ok, false);
    assert.equal(!r.ok && r.code, 'email_unconfirmed');
    open('block-post-staff');
    const s = D.sampleSubmit({ body: 'hello there', clientId: 'x2', category: 'ask-the-community', title: 'A real title' });
    assert.equal(!s.ok && s.code, 'staff_only');
  });
});

/* ── Every post control goes through the one gate ─────────────────────── */

describe('one gate for every post control', () => {
  it('the forum home ASK, START A TOPIC, a reply, SHARE AN IDEA and the Ask form use it', () => {
    for (const f of ['ForumHomeView', 'ForumCategoryScreen', 'ForumThreadScreen', 'ForumIdeasScreen', 'ForumAskScreen']) {
      const src = code(`${F}${f}.tsx`);
      assert.match(src, /usePostGate\(/, f);
      assert.match(src, /\{gate\.host\}/, f);
    }
  });

  it('the home ASK no longer stops at a notice', () => {
    const src = code(`${F}ForumHomeView.tsx`);
    assert.doesNotMatch(src, /confirmDialog\('Before you post'/);
    assert.match(src, /press\(\s*\{ slug: ASK_SLUG, action: 'start' \}/);
  });

  it('the category dock is a button for every fixable reason (no dead notice)', () => {
    const src = code(`${F}ForumCategoryScreen.tsx`);
    assert.doesNotMatch(src, /refusalNeedsProfile\(posting\.code\)/);
    assert.doesNotMatch(src, /posting\.kind === 'refusal' \? \(\s*<LockedNotice/);
    assert.match(src, /gate\.press\(\s*\{ slug: startSlug \?\? null, action: 'start' \}/);
  });

  it('a thread a member may not reply to yet has a reply bar to tap, not a dead notice', () => {
    const src = code(`${F}ForumThreadScreen.tsx`);
    assert.match(src, /onPress=\{pressReply\}/);
    assert.match(src, /action: 'reply' \}/);
    assert.match(src, /else gate\.refused\(r\.code,/);
  });

  it('the Ask form maps a refused post to the same popup, and its empty face opens the rules', () => {
    const src = code(`${F}ForumAskScreen.tsx`);
    assert.match(src, /else gate\.refused\(r\.code,/);
    assert.match(src, /label: 'READ THE RULES'/);
  });

  it('Discuss this lab: the gate is required on the tap only, never with the lab', () => {
    const src = code(`${F}DiscussLabLink.tsx`);
    assert.doesNotMatch(src, /^import .*PostGate/m);
    assert.match(src, /require\('\.\/PostGate'\)/);
    assert.match(src, /where: \{ slug: null, action: 'start' \}/);
  });

  it('the gate: rules popup, latched I AGREE, forum_me read again, then on to the composer', () => {
    const src = code(`${F}PostGate.tsx`);
    assert.match(src, /const agree = useLatchedPress\(/);
    assert.match(src, /await flags\.acceptRules\(\)/);
    assert.match(src, /fetchPostStanding\(\)/);
    assert.match(src, /afterClose\(\(\) => goOn\(now\.go, now\.intent\)\)/);
    // NOT NOW posts nothing: it only closes.
    assert.match(src, /<RulesPopup[\s\S]*?onClose=\{\(\) => setShown\(null\)\}/);
    // One popup goes before the next comes (iOS refuses to present during a dismiss).
    assert.match(src, /useAfterModalsClose\(\)/);
    // The words come from the one table.
    assert.match(src, /blockSheet\(sheetNow\.step\.sheet/);
    // Back from a fix: read again, show the next blocker.
    assert.match(src, /followUpStep\(p\.code, fresh\)/);
    // Support is the app's own path; no raw platform alert.
    assert.match(src, /sendFeedback\('question'/);
    assert.doesNotMatch(src, /Alert\.alert/);
  });
});

describe('the COMMUNITY RULES link (§4c)', () => {
  it('sits on the forum home, always, and opens the same rules to read', () => {
    const src = code(`${F}ForumHomeView.tsx`);
    assert.match(src, /head=\{COMMUNITY_RULES_HEAD\}/);
    assert.match(src, /onPress=\{\(\) => setRulesView\(true\)\}/);
    assert.match(src, /<RulesPopup\s+visible=\{rulesView\}\s+readOnly/);
    assert.match(src, /agreed=\{agreed\}/);
  });

  it('read-only shows CLOSE once agreed, I AGREE while not', () => {
    const src = code(`${F}forumPopups.tsx`);
    assert.match(src, /reading && agreed \?/);
    assert.match(src, /label="CLOSE"/);
    assert.match(src, /label="I AGREE"/);
    assert.match(src, /reading \? COMMUNITY_RULES_LINK : 'BEFORE YOUR FIRST POST'/);
  });

  it('the rules are written once, in forumPopups.tsx', () => {
    const src = read(`${F}forumPopups.tsx`);
    assert.equal(src.split('Respect people. Criticize the mix, not the person.').length - 1, 1);
  });
});
