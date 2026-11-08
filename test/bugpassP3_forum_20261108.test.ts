/**
 * Bug pass 3 (2026-11-08, final pass), group "forum": one pin per fixed bug.
 * Pure rules where the logic runs in node; source shapes where it lives in a
 * screen. Bug texts: the pass's PASS3_CODE.md / PASS3_UI.md.
 */
import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { registerHooks } from 'node:module';
import { fileURLToPath } from 'node:url';
import {
  BODY_MAX,
  CORRECTION_NEEDS_CHANGE,
  EMPTY_ASK,
  FORUM_SIGN_IN_TO_SEE,
  askProblem,
  editTakesCorrection,
  tooLongText,
} from '../src/features/forum/rules.ts';

// postOnce.ts and flaggedPosts.ts self-register with the account wipe through
// an extensionless import: resolve it to the .ts file, then load them.
registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier.startsWith('.') && !/\.[cm]?[jt]sx?$/.test(specifier)) {
      const candidate = new URL(specifier + '.ts', context.parentURL);
      if (existsSync(fileURLToPath(candidate))) return { url: candidate.href, shortCircuit: true };
    }
    return nextResolve(specifier, context);
  },
});
const { clientIdFor, postFingerprint, resetPostOnce, settleClientId } = await import('../src/features/forum/postOnce.ts');
const { beginFlag, endFlag, flaggedPostIds, resetFlaggedPosts } = await import('../src/features/forum/flaggedPosts.ts');
const { resetRegisteredLocalStores } = await import('../src/features/storage/localStoreRegistry.ts');

const read = (p: string) => readFileSync(p, 'utf8').replace(/\r\n/g, '\n');
const code = (p: string) => read(p).replace(/\{\/\*[\s\S]*?\*\/\}/g, '').replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
const F = 'src/screens/directory/forum/';
const thread = () => code(`${F}ForumThreadScreen.tsx`);
const ask = () => code(`${F}ForumAskScreen.tsx`);
const category = () => code(`${F}ForumCategoryScreen.tsx`);
const popups = () => code(`${F}forumPopups.tsx`);
const bits = () => code(`${F}forumBits.tsx`);
const between = (s: string, a: string, b: string) => {
  const i = s.indexOf(a);
  assert.ok(i >= 0, `missing: ${a}`);
  const j = s.indexOf(b, i + a.length);
  assert.ok(j > i, `missing after ${a}: ${b}`);
  return s.slice(i, j);
};

/* ── CODE-3-01 ───────────────────────────────────────────────────────── */

describe('CODE-3-01: once an answer has landed, the same words sent again are a new reply', () => {
  beforeEach(() => resetPostOnce());
  let n = 0;
  const make = () => `p3-${++n}`;

  it('left mid-send, the answer lands, "Thanks!" typed again later gets a NEW id', () => {
    const fp = postFingerprint('reply:t1', { body: 'Thanks!', quote: null, correctionOf: null });
    const first = clientIdFor(fp, null, make);
    // The thread had gone when the answer came: released all the same.
    settleClientId(fp, true);
    // A box opened after the answer has no draft (it was cleared): no known id.
    assert.notEqual(clientIdFor(fp, null, make), first);
  });

  it('a box reopened BEFORE the answer still sends with the draft id it restored', () => {
    const fp = postFingerprint('reply:t1', { body: 'Thanks!', quote: null, correctionOf: null });
    const first = clientIdFor(fp, null, make);
    settleClientId(fp, true);
    assert.equal(clientIdFor(fp, first, make), first);
  });

  it('the thread releases the id on screen or not', () => {
    const t = thread();
    assert.match(t, /if \(onScreen\.current\) replyLandedSeen\(fingerprint\);\s*else settleClientId\(fingerprint, true\);/);
    assert.doesNotMatch(t, /settleClientId\(fingerprint, false\)/);
  });
});

/* ── CODE-3-02 ───────────────────────────────────────────────────────── */

describe('CODE-3-02: the same category picked again keeps "This is a job post"', () => {
  it('the job flag is cleared only inside the real-change branch of pickCategory', () => {
    const a = ask();
    const pick = between(a, 'const pickCategory', 'setCategory(next);');
    const changed = between(pick, 'if (next && next.slug !== category?.slug) {', 'setValues((v) => carryAskValues');
    assert.ok(changed.length > 0);
    assert.match(pick, /carryAskValues\(form, askFormOf\(next\), v\)\);\s*setJob\(false\);\s*\}/);
  });
  it('the category list no longer clears it on every pick', () => {
    const onPick = between(ask(), 'pickCategory(open.find((c) => c.name === name) ?? category);', 'setPicking(false);');
    assert.doesNotMatch(onPick, /setJob/);
  });
});

/* ── CODE-3-03 ───────────────────────────────────────────────────────── */

describe('CODE-3-03: a page read for the old sort is dropped', () => {
  it('loadMore captures a list ticket and drops a stale answer before touching the list', () => {
    const c = category();
    const more = between(c, 'const loadMore = useLatchedPress', 'const showMore');
    assert.match(more, /const ticket = listTicket\.current;\s*const r = await fetchTopics\([^)]*\);\s*if \(ticket !== listTicket\.current\) return;/);
    assert.ok(more.indexOf('if (ticket !== listTicket.current) return;') < more.indexOf('setMore('));
  });
  it('a new sort and a reload each start a new list', () => {
    const c = category();
    assert.match(between(c, 'const changeSort = useCallback', 'setSort(s);'), /listTicket\.current\+\+;/);
    const reload = between(c, 'const reloadTopics = useCallback', 'setMoreFailed(false);');
    // Before the read and again once it is in, ahead of clearing the pages.
    assert.match(reload, /listTicket\.current\+\+;\s*await topics\.reload\(\);\s*listTicket\.current\+\+;\s*setMore\(\[\]\);/);
  });
});

/* ── CODE-3-04 / CODE-3-12 ───────────────────────────────────────────── */

describe('CODE-3-04 / CODE-3-12: the Report and Appeal popups hold while sending', () => {
  it('both popups close through the hold, and the dim does not close them while busy', () => {
    const p = popups();
    const report = between(p, 'export function ReportPopup', 'export function useHoldWhileSending');
    assert.match(report, /const hold = useHoldWhileSending\(props\.onClose\);/);
    assert.match(report, /<Popup visible=\{!!props\.postId\} onClose=\{hold\.close\} closeOnBackdrop=\{!hold\.busy\}/);
    assert.match(report, /onBusy=\{hold\.setBusy\}/);
    const appeal = between(p, 'export function AppealPopup', 'function AppealCard');
    assert.match(appeal, /const hold = useHoldWhileSending\(props\.onClose\);/);
    assert.match(appeal, /<Popup visible=\{!!props\.postId\} onClose=\{hold\.close\} closeOnBackdrop=\{!hold\.busy\}/);
    assert.match(appeal, /onBusy=\{hold\.setBusy\}/);
  });
  it('the hold ignores a close (dim, Android BACK) while the send is out', () => {
    const hold = between(popups(), 'export function useHoldWhileSending', 'function useBusyHeld');
    assert.match(hold, /const close = useCallback\(\(\) => \{\s*if \(busyNow\.current\) return;\s*onClose\(\);/);
  });
  it('each card tells the popup when it is busy', () => {
    const p = popups();
    assert.match(between(p, 'function ReportCard', 'return ('), /const setBusy = useBusyHeld\(setBusyHere, onBusy\);/);
    assert.match(between(p, 'function AppealCard', 'return ('), /const setBusy = useBusyHeld\(setBusyHere, onBusy\);/);
  });
  it('the Popup wires onRequestClose (Android BACK) to the same onClose', () => {
    assert.match(between(bits(), 'export function Popup', 'export type MenuItem'), /onRequestClose=\{onClose\}/);
  });
});

/* ── CODE-3-10 ───────────────────────────────────────────────────────── */

describe('CODE-3-10: a flag still out at sign-out marks nothing for the next member', () => {
  beforeEach(() => resetFlaggedPosts());
  it('the wipe runs while the flag is out: the late answer is ignored', () => {
    assert.equal(beginFlag('P1'), true);
    resetRegisteredLocalStores();
    endFlag('P1', true);
    assert.deepEqual(flaggedPostIds(), []);
    // The next member is offered the flag on that post.
    assert.equal(beginFlag('P1'), true);
  });
  it('with no wipe, a sent flag still marks the post', () => {
    assert.equal(beginFlag('P2'), true);
    endFlag('P2', true);
    assert.deepEqual(flaggedPostIds(), ['P2']);
  });
});

/* ── CODE-3-14 ───────────────────────────────────────────────────────── */

describe('CODE-3-14: a quote picked while a reply sends is kept', () => {
  it('no new words but a new quote or correction: the box keeps that target', () => {
    const send = between(thread(), 'const sendNow = useCallback', 'const hidden = hiddenOutcomeNote(r.value);');
    const kept = between(send, '} else if (restQuote || restCorrection) {', '} else {');
    assert.match(kept, /typed\.current = true;/);
    assert.match(kept, /setQuote\(restQuote\);/);
    assert.match(kept, /setCorrecting\(restCorrection\);/);
    assert.doesNotMatch(kept, /setQuote\(null\)/);
  });
});

/* ── UI-3-01 ─────────────────────────────────────────────────────────── */

describe('UI-3-01: a body past 10,000 characters is never cut silently', () => {
  const long = 'A'.repeat(BODY_MAX + 1);
  it('every Ask form says how much to cut', () => {
    const v = { ...EMPTY_ASK, title: 'A long write-up', body: long };
    assert.equal(askProblem('discussion', v), 'Your post is too long. Shorten it by 1 character.');
    assert.match(askProblem('idea', v) ?? '', /Shorten it by 1 character\./);
    assert.match(askProblem('bug', v) ?? '', /Shorten it by 1 character\./);
    assert.equal(askProblem('discussion', { ...v, body: 'A'.repeat(BODY_MAX) }), null);
  });
  it('a reply says it too', () => {
    assert.equal(tooLongText(BODY_MAX), null);
    assert.equal(tooLongText(BODY_MAX + 17, 'reply'), 'Your reply is too long. Shorten it by 17 characters.');
  });
  it('the boxes no longer stop at BODY_MAX, and SEND / POST are off while too long', () => {
    assert.doesNotMatch(ask(), /maxLength=\{BODY_MAX\}/);
    const t = thread();
    assert.doesNotMatch(t, /maxLength=\{BODY_MAX\}/);
    assert.match(t, /const replyTooLong = tooLongText\(draft\.trim\(\)\.length, 'reply'\);/);
    assert.match(t, /const sendOff = sending \|\| !draft\.trim\(\) \|\| !!replyTooLong;/);
    assert.match(t, /disabled=\{sendOff\}/);
    assert.match(t, /\{replyTooLong \? <Text style=\{st\.tooLong\}>\{replyTooLong\}<\/Text> : null\}/);
    assert.match(t, /if \(!body \|\| tooLongText\(body\.length\)\) return;/);
    // A reply edit and a lab thread are checked too.
    assert.match(ask(), /\? tooLongText\(values\.body\.trim\(\)\.length\)\s*: 'Write something first\.'/);
  });
});

/* ── UI-3-02 ─────────────────────────────────────────────────────────── */

describe('UI-3-02: ACCEPT AND EDIT needs a real change before REPOST', () => {
  it('the same words (even with a space at the end) are not a change', () => {
    const before = 'A 3 dB cut halves the voltage going to the wedge.';
    assert.equal(editTakesCorrection(before, before), false);
    assert.equal(editTakesCorrection(before, `${before}  `), false);
    assert.equal(editTakesCorrection(before, 'A 3 dB cut halves the power. It takes 6 dB to halve the voltage.'), true);
  });
  it('the form keeps REPOST off and says why', () => {
    const a = ask();
    assert.match(a, /const startValues = useRef\(values\);/);
    assert.match(a, /!!edit\?\.acceptCorrection && !editTakesCorrection\(sentBody\(startValues\.current\), sentBody\(values\)\)/);
    assert.match(a, /\?\? \(sameAsBefore \? CORRECTION_NEEDS_CHANGE : null\)/);
    assert.match(a, /disabled=\{!!problem\}/);
    assert.match(CORRECTION_NEEDS_CHANGE, /same as before/);
    assert.doesNotMatch(CORRECTION_NEEDS_CHANGE, /—/);
  });
});

/* ── UI-3-03 ─────────────────────────────────────────────────────────── */

describe('UI-3-03: no ✓ on a follow level that was never read', () => {
  it('an unread category has no level, so no row is ticked', () => {
    const c = category();
    assert.match(c, /const followLevel: FollowLevel \| null = following \?\? \(category \? \(category\.followLevel \?\? 'replies'\) : null\);/);
    assert.doesNotMatch(c, /category\?\.followLevel \?\? 'replies'/);
    assert.match(c, /label: f\.level === followLevel \? `\$\{f\.label\} ✓` : f\.label/);
  });
});

/* ── UI-3-04 ─────────────────────────────────────────────────────────── */

describe('UI-3-04: a failed read says sign in to a signed-out member, over SIGN IN', () => {
  it('the words match the button', () => {
    assert.equal(FORUM_SIGN_IN_TO_SEE, 'Sign in to see the forum.');
    const face = between(bits(), 'export function ForumUnreadable', 'export function ForumEmpty');
    assert.match(face, /const \{ guest \} = useGuestWording\(\);/);
    assert.match(face, /\{guest \? FORUM_SIGN_IN_TO_SEE : error\}/);
    assert.match(face, /<RetryOrSignIn message=\{error\} onRetry=\{onRetry\} \/>/);
  });
});

/* ── UI-3-07 ─────────────────────────────────────────────────────────── */

describe('UI-3-07: every follow choice on a thread says it is about alerts', () => {
  it('each of the three has a note that names alerts', () => {
    const items = between(thread(), 'const followItems = useMemo', 'const adminItems');
    for (const key of ['follow-all', 'follow-replies', 'follow-off']) {
      const row = items.slice(items.indexOf(`key: '${key}'`));
      const line = row.slice(0, row.indexOf('\n'));
      assert.match(line, /note: '[^']*alert[^']*'/, key);
    }
  });
});
