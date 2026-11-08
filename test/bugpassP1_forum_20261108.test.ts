/**
 * Bug pass 1 (2026-11-08), group "forum": one pin per fixed bug. Pure rules
 * where the logic can run in node; source shapes where it lives in a screen.
 * Bug texts: the pass's PASS1_CODE.md / PASS1_UI.md (CODE-1-xx, UI-1-xx).
 */
import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  BODY_MAX,
  EMPTY_ASK,
  EXCERPT_MAX,
  aiUsageLine,
  askDraftRead,
  askDraftText,
  askProblem,
  carryAskValues,
  emptyTopicsWords,
  noticeExcerptEdit,
  noticeFace,
  canReportOrBlock,
  forumErrorText,
  replyCountText,
  replyDraftRead,
  replyDraftText,
  solutionMarkedBy,
  jumpStep,
} from '../src/features/forum/rules.ts';
import { existsSync } from 'node:fs';
import { registerHooks } from 'node:module';
import { fileURLToPath } from 'node:url';
import { authorOf } from '../src/features/forum/mappers.ts';

// postOnce.ts and flaggedPosts.ts self-register with the account wipe through
// an extensionless import (the wipe ratchet reads that exact form): resolve it
// to the .ts file, then load them.
registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier.startsWith('.') && !/\.[cm]?[jt]sx?$/.test(specifier)) {
      const candidate = new URL(specifier + '.ts', context.parentURL);
      if (existsSync(fileURLToPath(candidate))) return { url: candidate.href, shortCircuit: true };
    }
    return nextResolve(specifier, context);
  },
});
const {
  SAME_POST_MS,
  clientIdFor,
  forgetClientId,
  onReplyLanded,
  postFingerprint,
  replyLandedSeen,
  resetPostOnce,
  settleClientId,
} = await import('../src/features/forum/postOnce.ts');
const { beginFlag, endFlag, flaggedPostIds, markPostFlagged, resetFlaggedPosts } = await import(
  '../src/features/forum/flaggedPosts.ts'
);
const { resetRegisteredLocalStores } = await import('../src/features/storage/localStoreRegistry.ts');
import type { ForumNotice } from '../src/features/forum/types.ts';

const read = (p: string) => readFileSync(p, 'utf8').replace(/\r\n/g, '\n');
const code = (p: string) => read(p).replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
const F = 'src/screens/directory/forum/';
const ask = () => code(`${F}ForumAskScreen.tsx`);
const thread = () => code(`${F}ForumThreadScreen.tsx`);

const notice = (over: Partial<ForumNotice>): ForumNotice => ({
  id: 1,
  postId: 'p1',
  kind: 'blocked',
  rule: null,
  excerpt: null,
  message: null,
  automated: true,
  expiresAt: null,
  readAt: null,
  createdAt: '2026-11-08T00:00:00Z',
  topicId: null,
  ...over,
});

/* ── CODE-1-05: the same post lands once ─────────────────────────────── */

describe('CODE-1-05: a post sent again from anywhere keeps its once-only id', () => {
  beforeEach(() => resetPostOnce());
  let n = 0;
  const make = () => `id-${++n}`;

  it('a second Ask form (or a reopened reply box) with the same words gets the same id', () => {
    const fp = postFingerprint('ask:ask-the-community', { ...EMPTY_ASK, title: 'Hum on my mic' });
    const first = clientIdFor(fp, null, make);
    // A fresh mount: it knows no id of its own.
    const second = clientIdFor(postFingerprint('ask:ask-the-community', { ...EMPTY_ASK, title: 'Hum on my mic' }), null, make);
    assert.equal(second, first);
  });

  it('a changed post, another place, or the same words long after: a new id', () => {
    const t0 = 1_000_000;
    const a = clientIdFor(postFingerprint('reply:t1', { body: 'Try a DI box' }), null, make, t0);
    assert.notEqual(clientIdFor(postFingerprint('reply:t1', { body: 'Try a DI box.' }), null, make, t0), a);
    assert.notEqual(clientIdFor(postFingerprint('reply:t2', { body: 'Try a DI box' }), null, make, t0), a);
    assert.notEqual(clientIdFor(postFingerprint('reply:t1', { body: 'Try a DI box' }), null, make, t0 + SAME_POST_MS + 1), a);
  });

  it('a restored draft\'s own id wins, and a stopped post is forgotten', () => {
    const fp = postFingerprint('ask:x', { title: 'A' });
    assert.equal(clientIdFor(fp, 'from-draft', make), 'from-draft');
    assert.equal(clientIdFor(fp, null, make), 'from-draft');
    forgetClientId(fp);
    assert.notEqual(clientIdFor(fp, null, make), 'from-draft');
  });

  it('the Ask draft keeps the id while the post is out, and gives it back', () => {
    const v = { ...EMPTY_ASK, title: 'Hum on my vocal mic', trying: 'Record a podcast' };
    const got = askDraftRead(askDraftText(v, 'cid-1'));
    assert.equal(got?.clientId, 'cid-1');
    assert.equal(got?.values.title, 'Hum on my vocal mic');
    assert.equal('clientId' in (got?.values ?? {}), false);
    assert.equal(askDraftRead(askDraftText(v, null))?.clientId, null);
    assert.equal(askDraftText(EMPTY_ASK, 'cid'), '');
    assert.equal(askDraftRead('not json'), null);
  });

  it('both posting screens use the shared id and the draft carries it; CANCEL is off while posting', () => {
    const a = ask();
    assert.match(a, /clientIdFor\(fingerprint, clientId\.current/);
    assert.match(a, /await saveDraft\(draftName, askDraftText\(values, cid\)\)/);
    assert.match(a, /clientId\.current = got\.clientId/);
    assert.match(a, /label="CANCEL" onPress=\{\(\) => safeGoBack\(navigation as never\)\} disabled=\{posting\}/);
    assert.doesNotMatch(a, /clientId\.current = clientId\.current \?\? Crypto\.randomUUID\(\)/);
    const t = thread();
    assert.match(t, /clientIdFor\(fingerprint, clientId\.current/);
    assert.doesNotMatch(t, /clientId\.current = clientId\.current \?\? Crypto\.randomUUID\(\)/);
  });

  it('the sample lands a repeated clientId once, as the server does', () => {
    assert.match(code('src/features/forum/sampleData.ts'), /const again = input\.clientId \? landed\.get\(input\.clientId\) : undefined;/);
  });
});

/* ── CODE-1-06 / UI-1-02: the draft moves with the category ──────────── */

describe('CODE-1-06 / UI-1-02: switching category moves the draft and the words', () => {
  it('the old key is cleared on a category change, and "Draft saved" is reset', () => {
    const a = ask();
    const pick = a.slice(a.indexOf('const pickCategory'), a.indexOf('setCategory(next);'));
    assert.match(pick, /void clearDraft\(draftName\)/);
    assert.match(pick, /setDraftSaved\(false\)/);
    assert.match(a, /pickCategory\(open\.find\(\(c\) => c\.name === name\) \?\? category\)/);
  });

  it('question words move into a body form, and back', () => {
    const q = { ...EMPTY_ASK, title: 'T', trying: 'First words here', gear: 'SM58' };
    const bug = carryAskValues('question', 'bug', q);
    assert.equal(bug.body, 'First words here\n\nSM58');
    assert.equal(bug.trying, '');
    assert.equal(bug.title, 'T');
    const back = carryAskValues('bug', 'question', { ...EMPTY_ASK, body: 'It crashed' });
    assert.equal(back.trying, 'It crashed');
    assert.equal(back.body, '');
    // Nothing is overwritten that the new form already holds.
    assert.equal(carryAskValues('question', 'bug', { ...q, body: 'mine' }).body, 'mine');
    assert.deepEqual(carryAskValues('question', 'question', q), q);
  });
});

/* ── CODE-1-07: a new sort is a new read ─────────────────────────────── */

describe('CODE-1-07: changing sort never shows the last sort\'s list', () => {
  it('the effect for new deps resets to loading with no value; only reload keeps it', () => {
    const hook = code('src/features/forum/useForumRead.ts');
    const effect = hook.slice(hook.indexOf('useEffect(() => {'), hook.indexOf('}, deps);'));
    assert.match(effect, /setState\(\{ face: 'loading', value: null, error: null, code: null, stale: false \}\)/);
    assert.doesNotMatch(effect, /s\.value === null \?/);
  });
});

/* ── CODE-1-08: threads past 100 posts ───────────────────────────────── */

describe('CODE-1-08: later posts can be reached, and my new reply shows', () => {
  it('SHOW MORE POSTS reads the next page; a send in a long thread reads to the end', () => {
    const t = thread();
    assert.match(t, /readPages\(POSTS_PAGE \+ later\.length, false\)/);
    assert.match(t, /'SHOW MORE POSTS'/);
    assert.match(t, /if \(long && !hidden\) await readToEnd\(\)/);
    assert.match(t, /pinToEnd\.current = hidden \? null : long \? r\.value\.postId : true/);
    assert.doesNotMatch(t, /Showing the first \{POSTS_PAGE\} posts/);
    // An alert's post past the first page is read before the jump (jumpStep, J1).
    assert.match(t, /if \(step\.kind === 'read'\) \{/);
  });
});

/* ── CODE-1-09: MY PROFILE goes back, never a second copy ────────────── */

describe('CODE-1-09: MY PROFILE pops to the Audio Community screen', () => {
  it('no forum screen pushes AudioCommunityDirectory', () => {
    for (const f of ['ForumThreadScreen', 'ForumCategoryScreen', 'ForumAskScreen']) {
      const src = code(`${F}${f}.tsx`);
      assert.doesNotMatch(src, /navigate\('AudioCommunityDirectory'/, f);
      assert.match(src, /openMyProfile\(navigation\)/, f);
    }
    assert.match(code(`${F}forumBits.tsx`), /nav\.popTo\('AudioCommunityDirectory', \{ tab: 'profile' \}\)/);
  });
});

/* ── CODE-1-16: child safety is never appealed ───────────────────────── */

describe('CODE-1-16: a blocked notice under child safety offers no appeal or edit', () => {
  it('blocked + child_safety: no APPEAL, no EDIT, no "goes to a person"', () => {
    const f = noticeFace(notice({ rule: 'child_safety' }));
    assert.equal(f.canAppeal, false);
    assert.equal(f.canEdit, false);
    assert.equal(f.how, null);
  });
  it('blocked under another rule still offers both', () => {
    const f = noticeFace(notice({ rule: 'respect' }));
    assert.equal(f.canAppeal, true);
    assert.equal(f.canEdit, true);
  });
});

/* ── CODE-1-17 / UI-1-06 / UI-1-15: Edit and Repost from a notice ────── */

describe('CODE-1-17 / UI-1-06 / UI-1-15: notices', () => {
  it('a cut excerpt counts as partial, at any length', () => {
    assert.deepEqual(noticeExcerptEdit('…only an idiot would…'), { body: 'only an idiot would', partial: true });
    assert.deepEqual(noticeExcerptEdit('The whole short post.'), { body: 'The whole short post.', partial: false });
    assert.equal(noticeExcerptEdit('x'.repeat(EXCERPT_MAX)).partial, true);
    assert.deepEqual(noticeExcerptEdit(null), { body: '', partial: false });
  });
  it('a known thread that did not answer is said in words, never guessed from the excerpt', () => {
    const n = code(`${F}ForumNoticesScreen.tsx`);
    assert.match(n, /if \(full === 'failed'\) \{\s*notify\('Could not open your post', NOTICE_EDIT_UNREAD\);\s*return;/);
    assert.match(code('src/features/forum/api.ts'), /return thread\.ok \? noticeEditFrom\(thread\.value, postId\) : 'failed';/);
  });
  it('a notice with its thread offers OPEN THE THREAD', () => {
    assert.match(code(`${F}ForumNoticesScreen.tsx`), /label: 'OPEN THE THREAD'/);
  });
});

/* ── CODE-1-19 / UI-1-04: the joined body ────────────────────────────── */

describe('CODE-1-19 / UI-1-04: a guided question or a correction cannot pass BODY_MAX', () => {
  it('three full boxes: refused before POST, with how much to cut', () => {
    const big = 'x'.repeat(BODY_MAX);
    const p = askProblem('question', { ...EMPTY_ASK, title: 'Hum on my vocal mic', trying: big, gear: big, tried: big });
    assert.match(p ?? '', /^Your post is too long\. Shorten it by [\d,]+ characters\.$/);
    assert.doesNotMatch(p ?? '', /—/);
  });
  it('a correction of five long fields too; a fitting form is fine', () => {
    const big = 'y'.repeat(4000);
    const v = { ...EMPTY_ASK, title: 'Fix the term', term: 'Gain', current: big, proposed: big, reason: big, source: 'AES' };
    assert.match(askProblem('glossary', v) ?? '', /too long/);
    assert.equal(askProblem('question', { ...EMPTY_ASK, title: 'Hum on my vocal mic', trying: 'Record' }), null);
  });
});

/* ── CODE-1-20: a closed report does nothing more ────────────────────── */

describe('CODE-1-20: CANCEL during a report or appeal', () => {
  it('CANCEL is off while sending, and an answer after the close is dropped', () => {
    const p = code(`${F}forumPopups.tsx`);
    assert.equal(p.match(/<QuietButton label="CANCEL" onPress=\{onClose\} disabled=\{busy\} \/>/g)?.length, 2);
    assert.equal(p.match(/if \(!mounted\.current\) return;/g)?.length, 2);
  });
});

/* ── CODE-1-21: every idea is ranked ─────────────────────────────────── */

describe('CODE-1-21: Ideas reads every page before sorting by votes', () => {
  it('fetchIdeas pages to the end; the screen uses it', () => {
    const api = code('src/features/forum/api.ts');
    assert.match(api, /for \(let offset = 0; offset < IDEAS_MAX; offset \+= IDEAS_PAGE\)/);
    const s = code(`${F}ForumIdeasScreen.tsx`);
    assert.match(s, /fetchIdeas\(IDEAS_SLUG\)/);
    assert.doesNotMatch(s, /fetchTopics\(IDEAS_SLUG, 'latest', 100, 0\)/);
  });
});

/* ── CODE-1-22: the last words typed survive BACK ────────────────────── */

describe('CODE-1-22: a pending draft is written on the way out', () => {
  it('both boxes flush the unsaved draft when the screen goes', () => {
    for (const src of [ask(), thread()]) {
      assert.match(src, /const last = unsaved\.current;\s*if \(last\) void saveDraft\(last\.name, last\.text\);/);
    }
  });
});

/* ── CODE-1-23 and UI-1-05: list words ───────────────────────────────── */

describe('CODE-1-23 / UI-1-05: words on the lists', () => {
  it('search results say replies', () => {
    assert.equal(replyCountText(1), '1 reply');
    assert.equal(replyCountText(3), '3 replies');
    assert.match(code(`${F}ForumHomeView.tsx`), /replyCountText\(h\.replyCount\)/);
  });
  it('an empty Top this week does not say nothing was ever posted', () => {
    for (const inCat of [true, false]) {
      const w = emptyTopicsWords('top_week', inCat);
      assert.doesNotMatch(`${w.title} ${w.text}`, /posted|first/i);
    }
    assert.equal(emptyTopicsWords('latest', true).title, 'Nothing posted here yet');
    assert.equal(emptyTopicsWords('latest', false).title, 'Nothing posted yet');
    assert.equal(emptyTopicsWords('unanswered', false).title, 'Nothing is waiting');
    assert.match(code(`${F}ForumCategoryScreen.tsx`), /emptyTopicsWords\(sort, true\)/);
    assert.match(code(`${F}ForumHomeView.tsx`), /emptyTopicsWords\(sort, false\)/);
  });
});

/* ── CODE-1-32: a slow lab read does not pull the person along ───────── */

describe('CODE-1-32: Discuss this lab after leaving the lab', () => {
  it('navigates only while the lab is still on screen', () => {
    const d = code(`${F}DiscussLabLink.tsx`);
    const at = d.indexOf('if (navigation.isFocused && !navigation.isFocused()) return;');
    assert.ok(at > 0 && at < d.indexOf("navigation.navigate('ForumThread'"));
  });
});

/* ── UI-1-01: ACCEPT AND EDIT then CANCEL ────────────────────────────── */

describe('UI-1-01: a correction is accepted only once the edit is posted', () => {
  it('the thread opens the edit without resolving; the Ask form resolves after editPost', () => {
    const t = thread();
    const res = t.slice(t.indexOf('const resolve = useLatchedPress'), t.indexOf('const voteHere'));
    assert.ok(res.indexOf("navigation.navigate('ForumAsk'") < res.indexOf('resolveCorrection('));
    assert.match(res, /acceptCorrection: post\.id/);
    const a = ask();
    assert.match(a, /if \(r\.ok && edit\.acceptCorrection\) \{\s*const a = await resolveCorrection\(edit\.acceptCorrection, true\);/);
  });
});

/* ── UI-1-03: announcements are not glossary text ────────────────────── */

describe('UI-1-03: no glossary links in the Academy\'s announcements', () => {
  it('PostBody can skip terms, and pinned posts do', () => {
    assert.match(code(`${F}PostBody.tsx`), /terms \? linkifyGlossary\(text\) : \[\{ text \}\]/);
    assert.match(thread(), /terms=\{!pinned\}/);
  });
});

/* ── UI-1-08 / UI-1-09 / UI-1-20: the harness ────────────────────────── */

describe('UI-1-08 / UI-1-09 / UI-1-20: the forum harness', () => {
  it('a tap before the first focus is not undone by that focus', () => {
    const p = code('src/dev/ForumPreview.tsx');
    assert.match(p, /if \(!opening\.current\) \{\s*setSampleForum\(null\);/);
    assert.ok(p.indexOf('opening.current = true;') < p.indexOf('setSampleForum(state);'));
  });
  it('the lounge sample takes the sort', () => {
    assert.match(code('src/features/forum/api.ts'), /data\(\)\.sampleLounge\(sort\)/);
  });
  it('the lab stub has a way back', () => {
    assert.match(code('src/dev/ForumPreview.tsx'), /onPress=\{\(\) => safeGoBack\(navigation\)\}/);
  });
});

/* ── UI-1-11 / UI-1-12 / UI-1-16 / UI-1-18 / UI-1-19 ─────────────────── */

describe('UI-1-11 / 12 / 16 / 18 / 19', () => {
  it('UI-1-11: "Also block them" starts on, as the shared chip says', () => {
    assert.match(code(`${F}forumPopups.tsx`), /const \[alsoBlock, setAlsoBlock\] = useState\(canBlock\);/);
  });
  it('UI-1-12: MARKED BY YOU for my own mark', () => {
    assert.equal(solutionMarkedBy('Alex P.', 'Alex P.'), 'YOU');
    assert.equal(solutionMarkedBy('Jordan K.', 'Alex P.'), 'JORDAN');
    assert.equal(solutionMarkedBy('Jordan K.', null), 'JORDAN');
    assert.equal(solutionMarkedBy(null, 'Alex P.'), null);
  });
  it('UI-1-16: an idea thread shows its status and the vote', () => {
    const t = thread();
    assert.match(t, /<TrackedStrip/);
    assert.match(t, /topic\.topicKind === 'idea'/);
    assert.match(t, /await voteIdea\(topicId, on\)/);
  });
  it('UI-1-18: a safety flag is confirmed first and not offered twice', () => {
    const t = thread();
    assert.match(t, /confirmDialog\(\s*'Flag a safety concern\?'/);
    assert.match(t, /if \(published && !flagged\.includes\(p\.id\)\)/);
  });
  it('UI-1-19: the AI line does not say "this month" twice', () => {
    assert.doesNotMatch(aiUsageLine(null), /this month/);
    assert.match(aiUsageLine(null), /No AI use/);
  });
});

/* ── CODE-1-24: no em dash in member text in the forum files ─────────── */

describe('CODE-1-24: no em dash in forum strings', () => {
  it('the forum screens and rules hold none outside comments (the server\'s mask string aside)', () => {
    const files = [
      'src/features/forum/rules.ts',
      'src/features/forum/api.ts',
      'src/features/forum/postOnce.ts',
      `${F}ForumAskScreen.tsx`,
      `${F}ForumThreadScreen.tsx`,
      `${F}ForumHomeView.tsx`,
      `${F}ForumCategoryScreen.tsx`,
      `${F}ForumNoticesScreen.tsx`,
      `${F}ForumIdeasScreen.tsx`,
      `${F}forumPopups.tsx`,
      `${F}DiscussLabLink.tsx`,
      'src/dev/ForumPreview.tsx',
    ];
    for (const f of files) assert.doesNotMatch(code(f), /—/, f);
    const sample = code('src/features/forum/sampleData.ts').replace(/\[preserved — not displayed \(child-safety\)\]/g, '');
    assert.doesNotMatch(sample, /—/);
  });
});

/* ══ Round 2 (coordinator, after the independent check) ════════════════ */

describe('CODE-1-05 (a, b): a reply draft carries its quote, its correction target and its id', () => {
  beforeEach(() => resetPostOnce());
  let n = 0;
  const make = () => `r-${++n}`;
  const quote = { postId: 'p9', excerpt: 'Boost 3 kHz', name: 'Ravi K.' };
  const where = 'reply:t1';
  const content = (d: { body: string; quote: typeof quote | null; correcting: { postId: string } | null }) => ({
    body: d.body.trim(),
    quote: d.quote?.postId ?? null,
    correctionOf: d.correcting?.postId ?? null,
  });

  it('(a) a QUOTED reply resent from a reopened thread is the same reply, with the same id', () => {
    const sent = { body: 'Try a high-pass first', quote, correcting: null };
    const id = clientIdFor(postFingerprint(where, content(sent)), null, make);
    const back = replyDraftRead(replyDraftText({ ...sent, clientId: id }));
    assert.deepEqual(back.quote, quote);
    assert.equal(clientIdFor(postFingerprint(where, content(back)), back.clientId, make), id);
  });

  it('(a) a suggest-a-correction reply keeps its target', () => {
    const corr = { postId: 'p4', name: 'Alex P.' };
    const back = replyDraftRead(replyDraftText({ body: 'It is 6 dB', quote: null, correcting: corr, clientId: 'c1' }));
    assert.deepEqual(back.correcting, corr);
    assert.equal(back.clientId, 'c1');
  });

  it('(b) after an app restart (the id map is empty) the restored draft still sends with its id', () => {
    const sent = { body: 'Thanks, that fixed it', quote: null, correcting: null };
    const id = clientIdFor(postFingerprint(where, content(sent)), null, make);
    const stored = replyDraftText({ ...sent, clientId: id });
    resetPostOnce(); // the restart
    const back = replyDraftRead(stored);
    assert.equal(clientIdFor(postFingerprint(where, content(back)), back.clientId, make), id);
  });

  it('old plain-text drafts still read as words, and words alone stay plain text', () => {
    assert.deepEqual(replyDraftRead('Just words'), { body: 'Just words', quote: null, correcting: null, clientId: null });
    assert.equal(replyDraftText({ body: 'Just words', quote: null, correcting: null, clientId: null }), 'Just words');
    assert.equal(replyDraftRead('{not json').body, '{not json');
    assert.equal(replyDraftText({ body: '  ', quote, correcting: null, clientId: 'x' }), '');
  });

  it('the thread writes the draft WITH the id before sending, and restores all of it', () => {
    const t = thread();
    const send = t.slice(t.indexOf('const sendNow'), t.indexOf('const r = await submitPost'));
    const clear = send.indexOf('if (saveTimer.current) clearTimeout(saveTimer.current);');
    const write = send.indexOf('await saveDraft(draftName, replyDraftText({ body: draft, quote, correcting, clientId: cid }))');
    assert.ok(clear > 0 && write > clear);
    assert.match(t, /setQuote\(got\.quote\);\s*setCorrecting\(got\.correcting\);\s*clientId\.current = got\.clientId;/);
  });
});

describe('CODE-1-05 (c): POST within 800 ms of the last keystroke keeps the id in the Ask draft', () => {
  it('postNow clears the pending draft-save timer before writing the draft with the id', () => {
    const a = ask();
    const post = a.slice(a.indexOf('const postNow'), a.indexOf('const r = await submitPost'));
    const clear = post.indexOf('if (saveTimer.current) clearTimeout(saveTimer.current);');
    const write = post.indexOf('await saveDraft(draftName, askDraftText(values, cid));');
    assert.ok(clear > 0 && write > clear);
    assert.match(a, /saveTimer\.current = t;/);
  });
});

describe('CODE-1-05 (d): a reply SEEN to land releases its id; one not seen keeps it', () => {
  beforeEach(() => resetPostOnce());
  let n = 0;
  const make = () => `d-${++n}`;
  it('"Thanks!" sent again on purpose after it was seen is a new post', () => {
    const fp = postFingerprint('reply:t1', { body: 'Thanks!' });
    const first = clientIdFor(fp, null, make);
    settleClientId(fp, true);
    assert.notEqual(clientIdFor(fp, null, make), first);
  });
  it('not seen (the thread was left): the resend reuses the id', () => {
    const fp = postFingerprint('reply:t1', { body: 'Thanks!' });
    const first = clientIdFor(fp, null, make);
    settleClientId(fp, false);
    assert.equal(clientIdFor(fp, null, make), first);
  });
  it('the thread settles with whether it is still on screen', () => {
    assert.match(thread(), /if \(onScreen\.current\) replyLandedSeen\(fingerprint\);\s*else settleClientId\(fingerprint, false\);/);
  });
});

describe('Wipe: the id map and the flag memory are cleared with the account', () => {
  it('resetRegisteredLocalStores empties both', () => {
    const fp = postFingerprint('reply:t1', { body: 'x' });
    const id = clientIdFor(fp, null, () => 'before-wipe');
    markPostFlagged('p1');
    resetRegisteredLocalStores();
    assert.notEqual(clientIdFor(fp, null, () => 'after-wipe'), id);
    assert.deepEqual(flaggedPostIds(), []);
  });
  it('the thread keeps no module-scope flag set of its own', () => {
    assert.doesNotMatch(thread(), /const flaggedPosts = new Set/);
    assert.match(thread(), /useState<string\[\]>\(\(\) => flaggedPostIds\(\)\)/);
  });
});

describe('Safety flag: one send per post (N2)', () => {
  beforeEach(() => resetFlaggedPosts());
  it('a second flag on the SAME post is refused while out and once sent', () => {
    assert.equal(beginFlag('A'), true);
    assert.equal(beginFlag('A'), false);
    endFlag('A', true);
    assert.equal(beginFlag('A'), false);
    assert.deepEqual(flaggedPostIds(), ['A']);
  });
  it('a flag on post B while A is out is its own send, never dropped', () => {
    assert.equal(beginFlag('A'), true);
    assert.equal(beginFlag('B'), true);
  });
  it('a failed send frees the post for another try', () => {
    assert.equal(beginFlag('A'), true);
    endFlag('A', false);
    assert.equal(beginFlag('A'), true);
    assert.deepEqual(flaggedPostIds(), []);
  });
  it('the thread claims per post, and hides the item from the moment FLAG is pressed', () => {
    const t = thread();
    assert.match(t, /if \(!beginFlag\(post\.id\)\) return;\s*setFlagged/);
    assert.match(t, /endFlag\(post\.id, r\.ok\);/);
    assert.doesNotMatch(t, /const sendFlag = useLatchedPress/);
  });
});

describe('N1: a reply seen to land is dropped from every open box for it', () => {
  beforeEach(() => resetPostOnce());
  it('two copies of one thread: the box underneath drops the same reply, keeps a different one', () => {
    const fp = postFingerprint('reply:t1', { body: 'Thanks!', quote: null, correctionOf: null });
    // Two boxes, as two Thread screens on the stack would be.
    const box = (words: string) => {
      const b = { words, mine: postFingerprint('reply:t1', { body: words, quote: null, correctionOf: null }) };
      const off = onReplyLanded((landed) => {
        if (landed === b.mine) b.words = '';
      });
      return { b, off };
    };
    const under = box('Thanks!');
    const other = box('Thanks, Maya!');
    const id = clientIdFor(fp, null, () => 'sent-id');
    replyLandedSeen(fp);
    assert.equal(under.b.words, '');
    assert.equal(other.b.words, 'Thanks, Maya!');
    // And the id is released: the same words typed again are a new reply.
    assert.notEqual(clientIdFor(fp, null, () => 'new-id'), id);
    under.off();
    other.off();
  });
  it('the thread listens with its current reply, and announces a seen landing', () => {
    const t = thread();
    assert.match(t, /onReplyLanded\(\(fingerprint\) => \{\s*if \(fingerprint !== mineNow\.current\) return;/);
    assert.match(t, /if \(onScreen\.current\) replyLandedSeen\(fingerprint\);\s*else settleClientId\(fingerprint, false\);/);
  });
});

describe('Weak tests made strong: the SCREENS call the helpers', () => {
  it('UI-1-02: pickCategory carries the words into the new form', () => {
    const a = ask();
    const pick = a.slice(a.indexOf('const pickCategory'), a.indexOf('setCategory(next);'));
    assert.match(pick, /setValues\(\(v\) => carryAskValues\(form, askFormOf\(next\), v\)\)/);
  });
  it('UI-1-02: question words reach a glossary correction and back, never dropped', () => {
    const toGloss = carryAskValues('question', 'glossary', { ...EMPTY_ASK, title: 'T', trying: 'Fix the Haas range', gear: 'Ref: AES' });
    assert.equal(toGloss.reason, 'Fix the Haas range\n\nRef: AES');
    assert.equal(toGloss.trying, '');
    const fromGloss = carryAskValues('glossary', 'bug', { ...EMPTY_ASK, term: 'Haas', proposed: '1 to 40 ms' });
    assert.equal(fromGloss.body, 'Haas\n\n1 to 40 ms');
    assert.equal(fromGloss.term, '');
  });
  it('UI-1-06: the notices screen uses the cut-excerpt rule', () => {
    assert.match(code(`${F}ForumNoticesScreen.tsx`), /const cut = noticeExcerptEdit\(n\.excerpt\);[\s\S]*\|\| cut\.partial/);
  });
  it('UI-1-12: PostCard draws MARKED BY from solutionMarkedBy with my name', () => {
    const t = thread();
    assert.match(t, /const marker = solutionMarkedBy\(askerName, myName\);/);
    assert.match(t, /MARKED BY \$\{marker\}/);
    assert.match(t, /myName=\{myName\}/);
    assert.doesNotMatch(t, /firstName\(askerName\)\.toUpperCase\(\)/);
  });
});

describe('Owner wording 2026-11-08', () => {
  it('the Ask heading, the length line and the empty Top this week line', () => {
    assert.match(ask(), /THE SUGGESTED CORRECTION/);
    assert.doesNotMatch(ask(), /THE CORRECTION YOU ACCEPTED/);
    const big = 'x'.repeat(BODY_MAX + 5);
    assert.equal(
      askProblem('question', { ...EMPTY_ASK, title: 'Hum on my vocal mic', trying: big }),
      'Your post is too long. Shorten it by 16 characters.',
    );
    assert.equal(emptyTopicsWords('top_week', true).text, 'Nothing in Top this week yet. Try Latest.');
  });
});

describe('Owner rule 2026-11-08: the Academy account cannot be reported or blocked', () => {
  it('author.academy is mapped, false when missing', () => {
    assert.equal(authorOf({ name: 'Prof. Channing Booth', academy: true }).academy, true);
    assert.equal(authorOf({ name: 'Maya R.' }).academy, false);
    assert.equal(authorOf({ name: 'Maya R.', academy: 'yes' }).academy, false);
  });
  it('the rule, and the thread hides Report, Block and "Also block them" for it', () => {
    assert.equal(canReportOrBlock({ academy: true }), false);
    assert.equal(canReportOrBlock({ academy: false }), true);
    const t = thread();
    const gate = t.indexOf('if (canReportOrBlock(p.author)) {');
    assert.ok(gate > 0 && gate < t.indexOf("key: 'report'") && gate < t.indexOf("key: 'block'"));
    assert.match(t, /canBlock=\{!!reportOf && !reportOf\.isMine && canReportOrBlock\(reportOf\.author\)\}/);
  });
  it('the sample founder is the Academy, so the harness shows it', () => {
    assert.match(
      code('src/features/forum/sampleData.ts'),
      /const FOUNDER = person\('Prof\. Channing Booth', \{ trust: 'leader', academy: true \}\);/,
    );
  });
  it('a not_allowed refusal from report or block reads plainly', () => {
    assert.equal(forumErrorText('forum:not_allowed').error, 'That is not available for this post.');
  });
});

describe('CODE-1-08 / J1: a jump to a post past page 1 waits until it is drawn', () => {
  const ids = (...xs: string[]) => xs.map((id) => ({ id }));
  const page1 = ids('p0', 'p1', 'p2');
  const all = ids('p0', 'p1', 'p2', 'p150');
  const base = { jumpTo: 'p150', hasMore: true, triedRead: false, reading: false };

  it('the whole sequence: read, wait while out, wait in the stale render, then jump', () => {
    // First page drawn, target not there: read the later pages.
    assert.deepEqual(jumpStep({ ...base, shown: page1, read: page1 }), { kind: 'read' });
    // The read is out.
    assert.deepEqual(jumpStep({ ...base, shown: page1, read: page1, triedRead: true, reading: true }), { kind: 'wait' });
    // THE race: the later pages are read, but this render still draws page 1.
    assert.deepEqual(jumpStep({ ...base, shown: page1, read: all, triedRead: true, hasMore: false }), { kind: 'wait' });
    // The next render draws them: jump.
    assert.deepEqual(jumpStep({ ...base, shown: all, read: all, triedRead: true, hasMore: false }), { kind: 'jump', index: 3 });
  });
  it('a post that is nowhere, or a failed read: the top', () => {
    assert.deepEqual(jumpStep({ ...base, jumpTo: 'gone', shown: all, read: all, triedRead: true, hasMore: false }), { kind: 'top' });
    assert.deepEqual(jumpStep({ ...base, shown: page1, read: page1, triedRead: true }), { kind: 'top' });
  });
  it('no target, an empty list, the first post', () => {
    assert.deepEqual(jumpStep({ ...base, jumpTo: null, shown: page1, read: page1 }), { kind: 'top' });
    assert.deepEqual(jumpStep({ ...base, shown: [], read: [] }), { kind: 'wait' });
    assert.deepEqual(jumpStep({ ...base, jumpTo: 'p0', shown: page1, read: page1 }), { kind: 'top' });
  });
  it('the thread decides only through jumpStep, with the drawn list and the read list', () => {
    const t = thread();
    assert.match(t, /const step = jumpStep\(\{\s*jumpTo,\s*shown: posts,\s*read: readAll,/);
    assert.match(t, /if \(step\.kind === 'wait'\) return undefined;/);
  });
});
