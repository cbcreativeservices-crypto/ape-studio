/**
 * Bug pass 2 (2026-11-08), group "forum": one pin per fixed bug. Pure rules
 * where the logic runs in node; source shapes where it lives in a screen.
 * Bug texts: the pass's PASS2_CODE.md / PASS2_UI.md (CODE-2-xx, UI-2-xx, S-1).
 */
import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { registerHooks } from 'node:module';
import { fileURLToPath } from 'node:url';
import {
  EMPTY_ASK,
  REPORT_DETAIL_MAX,
  REPORT_REASONS,
  acceptEditStep,
  askDraftForSave,
  askDraftRead,
  askDraftText,
  pendingIdFits,
  canStartReply,
  nextTopicsPage,
  quoteLine,
  reminderLine,
  replyBlock,
  unsentRemainder,
  withCorrection,
  withQuote,
} from '../src/features/forum/rules.ts';

// postOnce.ts self-registers with the account wipe through an extensionless
// import: resolve it to the .ts file, then load it.
registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier.startsWith('.') && !/\.[cm]?[jt]sx?$/.test(specifier)) {
      const candidate = new URL(specifier + '.ts', context.parentURL);
      if (existsSync(fileURLToPath(candidate))) return { url: candidate.href, shortCircuit: true };
    }
    return nextResolve(specifier, context);
  },
});
const { clientIdFor, forgetLandedPost, landedAs, postFingerprint, resetPostOnce } = await import(
  '../src/features/forum/postOnce.ts'
);

const read = (p: string) => readFileSync(p, 'utf8').replace(/\r\n/g, '\n');
const code = (p: string) => read(p).replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
const F = 'src/screens/directory/forum/';
const thread = () => code(`${F}ForumThreadScreen.tsx`);
const ask = () => code(`${F}ForumAskScreen.tsx`);
const between = (s: string, a: string, b: string) => {
  const i = s.indexOf(a);
  assert.ok(i >= 0, `missing: ${a}`);
  const j = s.indexOf(b, i + a.length);
  assert.ok(j > i, `missing after ${a}: ${b}`);
  return s.slice(i, j);
};

/* ── CODE-2-01 ───────────────────────────────────────────────────────── */

describe('CODE-2-01: words typed while a reply sends are kept', () => {
  it('only the sent text is cleared; more typed after it stays', () => {
    assert.equal(unsentRemainder('Try a high-pass at 80 Hz', 'Try a high-pass at 80 Hz'), '');
    assert.equal(
      unsentRemainder('Try a high-pass at 80 Hz', 'Try a high-pass at 80 Hz and check the phase too'),
      'and check the phase too',
    );
    // An edit inside the sent words: the whole box is kept for the member.
    assert.equal(unsentRemainder('Try a high-pass', 'Try a low-pass'), 'Try a low-pass');
  });

  it('the thread clears the box and the draft only when nothing new was typed', () => {
    const send = between(thread(), 'const sendNow = useCallback', 'const hidden = hiddenOutcomeNote(r.value);');
    assert.match(send, /const sentRaw = draft;/);
    assert.match(send, /const rest = unsentRemainder\(sentRaw, draftNow\.current\);/);
    const keep = between(send, 'if (rest.trim()) {', '} else {');
    assert.match(keep, /setDraft\(rest\)/);
    assert.doesNotMatch(keep, /clearDraft/);
    const clear = send.slice(send.indexOf('} else {'));
    assert.match(clear, /setDraft\(''\);[\s\S]*void clearDraft\(draftName\);/);
  });

  it('the Ask form holds still while it posts', () => {
    const a = ask();
    assert.match(a, /const set = useCallback\(\(patch: Partial<AskValues>\) => \{\s*if \(postingNow\.current\) return;/);
    assert.match(a, /editable=\{!posting\}/);
    assert.match(a, /<FormFields form=\{shownForm\} values=\{values\} set=\{set\} locked=\{posting\} \/>/);
    assert.match(code(`${F}forumBits.tsx`), /editable=\{editable\}/);
  });
});

/* ── CODE-2-02 ───────────────────────────────────────────────────────── */

describe('CODE-2-02: a forum tap for the open thread reads again and jumps', () => {
  it('a new jumpTo on the same route resets the jump and reloads', () => {
    const t = thread();
    const eff = between(t, 'const lastJump = useRef(jumpTo);', '}, [jumpTo, reloadAll]);');
    assert.match(eff, /if \(lastJump\.current === jumpTo\) return;/);
    assert.match(eff, /jumped\.current = false;/);
    assert.match(eff, /jumpRead\.current = false;/);
    assert.match(eff, /jumpReading\.current = true;/);
    assert.match(eff, /void reloadAll\(\)\.then\(\(\) => \{\s*jumpReading\.current = false;\s*setJumpLanded/);
  });
});

/* ── CODE-2-03 ───────────────────────────────────────────────────────── */

describe('CODE-2-03: a write in a long thread reads the later pages again', () => {
  it('reloadAll re-reads the later pages, and drops them when that fails', () => {
    const t = thread();
    const later = between(t, 'const refreshLater = useCallback', 'const reloadAll');
    assert.match(later, /if \(laterNow\.current\.length === 0\) return;/);
    assert.match(later, /if \(!\(await readToEnd\(\)\)\) \{\s*setLater\(\[\]\);\s*setLaterFull\(null\);/);
    assert.match(t, /const reloadAll = useCallback\(async \(\) => \{\s*await read\.reload\(\);\s*await refreshLater\(\);/);
  });
  it('delete, block, report, Solution, corrections and the return from Edit all use it', () => {
    const t = thread();
    assert.match(t, /useReloadOnReturn\(reloadAll\);/);
    assert.equal((t.match(/else void read\.reload\(\)/g) ?? []).length, 0);
    assert.ok((t.match(/void reloadAll\(\)/g) ?? []).length >= 5);
    assert.match(between(t, 'const setSolution', 'const bookmark'), /await reloadAll\(\)/);
    assert.match(between(t, 'const resolve = useLatchedPress', 'const voteHere'), /await reloadAll\(\);/);
  });
});

/* ── CODE-2-04 ───────────────────────────────────────────────────────── */

describe('CODE-2-04: reactions and bookmarks survive SHOW MORE POSTS', () => {
  it('the answer is written where the post was read, and drawn in place', () => {
    const t = thread();
    const patch = between(t, 'const patchPost = useCallback', 'const hasMore');
    assert.match(patch, /patching\.current = true;/);
    assert.match(patch, /read\.patch\(/);
    assert.match(patch, /setLater\(\(l\) => l\.map/);
    assert.match(between(t, 'const react = useCallback', 'const [draft, setDraft]'), /patchPost\(post\.id,/);
    assert.match(between(t, 'const bookmark = useCallback', 'const [flagged'), /patchPost\(post\.id, \(p\) => \(\{ \.\.\.p, bookmarked: on \}\)\)/);
    assert.doesNotMatch(between(t, 'const react = useCallback', 'const [draft, setDraft]'), /setPosts\(/);
    // A patch keeps the drawn order; only a read orders.
    const eff = between(t, 'if (value && patching.current) {', 'if (value) setPosts(orderPosts(');
    assert.match(eff, /setPosts\(\(rows\) => rows\.map\(\(p\) => byId\.get\(p\.id\) \?\? p\)\)/);
  });
});

/* ── CODE-2-05 ───────────────────────────────────────────────────────── */

describe('CODE-2-05: ACCEPT AND EDIT marks the correction only once the edit is published', () => {
  it('published accepts; refused stays with the reason; held goes back', () => {
    assert.deepEqual(acceptEditStep('published', null), { kind: 'accept' });
    const stay = acceptEditStep('edit_blocked', 'This edit insults another member.');
    assert.equal(stay.kind, 'stay');
    assert.match((stay as { text: string }).text, /^This edit insults another member\. The correction is still open\./);
    assert.equal(acceptEditStep('blocked', null).kind, 'stay');
    for (const s of ['held', 'checking', 'pending']) assert.equal(acceptEditStep(s, null).kind, 'back', s);
    // Check 1: no promise of an accept that never happens by itself.
    const back = acceptEditStep('held', null) as { text: string };
    assert.equal(back.text, 'Your edit is being reviewed. The correction stays open; accept it again once your edit is published.');
    assert.doesNotMatch(back.text, /until your edit is published/);
  });
  it('the form checks the step before resolveCorrection', () => {
    const a = ask();
    const edit = between(a, 'const r = await editPost(', 'const fingerprint');
    assert.ok(edit.indexOf('acceptEditStep(r.value.state, r.value.reason)') < edit.indexOf('resolveCorrection('));
    assert.match(edit, /if \(step && step\.kind === 'stay'\) \{\s*setPosting\(false\);\s*setError\(step\.text\);\s*return;/);
  });
});

/* ── CODE-2-06 ───────────────────────────────────────────────────────── */

describe('CODE-2-06: no draft is written into the next member\'s store', () => {
  it('the owner is the wipe count and the sample switch', () => {
    const d = code('src/features/forum/drafts.ts');
    assert.match(d, /return \{ wipe: localStoreWipeCount\(\), sample: sampleForumOn\(\) \};/);
    assert.match(d, /return o\.wipe !== localStoreWipeCount\(\) \|\| o\.sample !== sampleForumOn\(\);/);
  });
  it('both boxes take the owner at mount and skip the unmount flush and the timer once it changed', () => {
    for (const src of [thread(), ask()]) {
      assert.match(src, /const owner = useRef\(draftOwner\(\)\);/);
      // []-deps (house ratchet G6): the cleanup runs on unmount only.
      assert.match(src, /\(\) => \(\) => \{\s*if \(draftOwnerStale\(owner\.current\)\) return;\s*const last = unsaved\.current;\s*if \(last\) void saveDraft\(last\.name, last\.text\);\s*\},\s*\[\],/);
      assert.match(src, /unsaved\.current = null;\s*if \(draftOwnerStale\(owner\.current\)\) return;\s*void saveDraft\(draftName, text\)/);
    }
  });
});

/* ── CODE-2-07 ───────────────────────────────────────────────────────── */

describe('CODE-2-07: the once-only id follows the whole post, and a delete frees it', () => {
  beforeEach(() => resetPostOnce());
  it('a deleted post frees its id: the same words again are a new post', () => {
    const fp = postFingerprint('ask:ideas', { title: 'Dark mode for labs' });
    const first = clientIdFor(fp, null, () => 'first');
    landedAs(fp, 'post-1');
    assert.equal(clientIdFor(fp, null, () => 'x'), first);
    forgetLandedPost('post-1');
    assert.equal(clientIdFor(fp, null, () => 'second'), 'second');
  });
  it('the Ask fingerprint has the lab and job, and a landing is recorded', () => {
    const a = ask();
    assert.match(a, /labThread \? values : \{ \.\.\.values, lab, job \}/);
    assert.equal((a.match(/landedAs\(fingerprint, r\.value\.postId\);/g) ?? []).length, 2);
    const t = thread();
    assert.match(t, /forgetLandedPost\(post\.id\);/);
    assert.match(t, /landedAs\(fingerprint, r\.value\.postId\);/);
  });

  it('check 2: an app kill mid-post, then the restored draft posts ONE topic', () => {
    // 1. POST with a lab linked: the draft is written with the id, the lab and the job kind.
    const v = { ...EMPTY_ASK, title: 'Hum on my vocal mic', trying: 'Record a podcast' };
    const stored = askDraftText(v, 'cid-1', { lab: 'Gain Staging', job: false });
    // 2. The app is killed; 3. the form mounts again and restores all of it.
    const got = askDraftRead(stored);
    assert.equal(got?.clientId, 'cid-1');
    assert.equal(got?.lab, 'Gain Staging');
    assert.equal(got?.job, false);
    const madeFor = { lab: got!.lab, job: got!.job };
    // 4. Posted as restored, or after unlinking and linking the same lab again: the id is kept.
    assert.equal(pendingIdFits(madeFor, { lab: 'Gain Staging', job: false }), true);
    // A different lab, or the job kind ticked: a new post, a new id.
    assert.equal(pendingIdFits(madeFor, { lab: 'Phase', job: false }), false);
    assert.equal(pendingIdFits(madeFor, { lab: 'Gain Staging', job: true }), false);
    // No pending id: nothing to keep.
    assert.equal(pendingIdFits(null, { lab: null, job: false }), true);
    // Old drafts without lab or job read as none.
    assert.deepEqual([askDraftRead(askDraftText(v, null))?.lab, askDraftRead(askDraftText(v, null))?.job], [null, false]);
    assert.match(askDraftText(v, 'c', { lab: null, job: true }), /"job":true/);
  });

  it('the form saves and restores the lab and job, and drops the id only when they differ', () => {
    const a = ask();
    assert.match(a, /setLabValue\(got\.lab\);\s*setJobValue\(got\.job\);\s*idMadeFor\.current = got\.clientId \? \{ lab: got\.lab, job: got\.job \} : null;/);
    assert.match(a, /const text = askDraftForSave\(values, clientId\.current, idMadeFor\.current, \{ lab, job \}\);/);
    assert.match(a, /await saveDraft\(draftName, askDraftText\(values, cid, \{ lab, job \}\)\);/);
    assert.match(a, /if \(!pendingIdFits\(idMadeFor\.current, \{ lab, job \}\)\) clientId\.current = null;\s*const cid = clientIdFor/);
    // The setters never drop the id themselves.
    const setters = between(a, 'const setLab = ', 'const [error, setError]');
    assert.doesNotMatch(setters, /clientId\.current = null/);
  });
});

/* ── CODE-2-08 ───────────────────────────────────────────────────────── */

describe('CODE-2-08: category paging counts what the server answered', () => {
  it('a dropped duplicate does not stop paging; a short page ends it', () => {
    assert.equal(nextTopicsPage(30, { read: 0, full: null }, 30), 30);
    // 30 more read, one was a duplicate (59 drawn): the next page is still 60.
    assert.equal(nextTopicsPage(30, { read: 30, full: true }, 30), 60);
    assert.equal(nextTopicsPage(30, { read: 12, full: false }, 30), null);
    assert.equal(nextTopicsPage(17, { read: 0, full: null }, 30), null);
    assert.equal(nextTopicsPage(0, { read: 0, full: null }, 30), null);
  });
  it('a failed page is said in words, and the later pages go on a return', () => {
    const c = code(`${F}ForumCategoryScreen.tsx`);
    assert.match(c, /if \(!r\.ok\) \{\s*setMoreFailed\(true\);\s*return;/);
    assert.match(c, /\{MORE_TOPICS_UNREAD\}/);
    assert.match(c, /useReloadOnReturn\(reloadTopics\);/);
    // Pass 3 (CODE-3-03): a new list ticket between the reload and the clear.
    assert.match(c, /await topics\.reload\(\);\s*(?:listTicket\.current\+\+;\s*)?setMore\(\[\]\);/);
    assert.doesNotMatch(c, /rows\.length % PAGE/);
  });
});

/* ── CODE-2-09 ───────────────────────────────────────────────────────── */

describe('CODE-2-09: a reminder that came says when, never "now ago"', () => {
  it('future and past read as dates', () => {
    const now = new Date(2026, 10, 8, 12, 0).getTime();
    assert.equal(reminderLine(new Date(2026, 10, 9, 8, 0).toISOString(), now), 'Reminder set · Nov 9');
    assert.equal(reminderLine(new Date(2026, 10, 8, 11, 59, 40).toISOString(), now), 'Reminded Nov 8');
    assert.equal(reminderLine(new Date(2026, 8, 1, 8, 0).toISOString(), now), 'Reminded Sep 1');
    assert.equal(reminderLine(new Date(2025, 8, 1, 8, 0).toISOString(), now), 'Reminded Sep 1, 2025');
    assert.equal(reminderLine('not a date', now), '');
  });
  it('the screen uses it', () => {
    const m = code(`${F}ForumMineScreen.tsx`);
    assert.match(m, /reminderLine\(item\.remindAt\)/);
    assert.doesNotMatch(m, / ago`/);
  });
});

/* ── CODE-2-10 ───────────────────────────────────────────────────────── */

describe('CODE-2-10: EDIT AND REPOST does not open after the member moved on', () => {
  it('checks focus right after the read', () => {
    const n = code(`${F}ForumNoticesScreen.tsx`);
    assert.match(n, /const full = await fetchNoticeEdit\(n\.topicId, postId\);\s*if \(!navigation\.isFocused\(\)\) return;/);
  });
});

/* ── CODE-2-12 ───────────────────────────────────────────────────────── */

describe('CODE-2-12: the rules popup comes back only for someone who has not agreed', () => {
  it('the agreement is read from the hydrated store, or this session', () => {
    const f = code('src/features/forum/forumFlags.ts');
    const fn = between(f, 'export async function rulesAgreed', 'export function useForumFlags');
    assert.match(fn, /if \(session\.agreed\) return true;\s*await store\.hydrate\(\);/);
    assert.match(f, /if \(ok\) session\.agreed = true;/);
    assert.match(f, /^registerLocalStoreReset\(resetForumFlagsSession\);/m);
  });
  it('both ways of posting ask through it', () => {
    for (const src of [thread(), ask()]) {
      assert.match(src, /if \(!\(await rulesAgreed\(\)\)\) \{\s*setRulesOpen\(true\);/);
      assert.doesNotMatch(src, /if \(!flags\.rulesAccepted\)/);
    }
  });
});

/* ── S-1 ─────────────────────────────────────────────────────────────── */

describe('S-1: a thread with no topic id says so, never the welcome', () => {
  it('only welcome: true opens the welcome', () => {
    const t = thread();
    assert.match(t, /if \(welcome\) return <LocalWelcome \/>;\s*if \(!topicId\) return <NoTopic \/>;/);
    assert.doesNotMatch(t, /welcome \|\| !topicId/);
  });
});

/* ── UI-2-01 / UI-2-02 / UI-2-09 ─────────────────────────────────────── */

describe('UI-2-01: a correction and a quote are about the same post', () => {
  const maya = { postId: 'm', excerpt: 'Monitors first.', name: 'Maya R.' };
  const diego = { postId: 'd', name: 'Diego M.' };
  it('a correction of another post drops the quote; of the same post keeps it', () => {
    assert.deepEqual(withCorrection({ quote: maya, correcting: null }, diego), { quote: null, correcting: diego });
    const sameMaya = { postId: 'm', name: 'Maya R.' };
    assert.deepEqual(withCorrection({ quote: maya, correcting: null }, sameMaya), { quote: maya, correcting: sameMaya });
  });
  it('a quote of another post ends the correction; clearing one keeps the other', () => {
    assert.deepEqual(withQuote({ quote: null, correcting: diego }, maya), { quote: maya, correcting: null });
    assert.deepEqual(withQuote({ quote: maya, correcting: diego }, null), { quote: null, correcting: diego });
    assert.deepEqual(withCorrection({ quote: maya, correcting: diego }, null), { quote: maya, correcting: null });
  });
  it('the thread sets both through them', () => {
    const t = thread();
    assert.match(t, /const t = withQuote\(targets\.current, next\);\s*setQuote\(t\.quote\);\s*setCorrecting\(t\.correcting\);/);
    assert.match(t, /const t = withCorrection\(targets\.current, next\);\s*setQuote\(t\.quote\);\s*setCorrecting\(t\.correcting\);/);
  });
});

describe('UI-2-02: no Quote or Suggest a correction where no reply can be sent', () => {
  it('a locked topic, or a member who may not reply: no', () => {
    assert.equal(canStartReply(replyBlock({ locked: true, categoryKind: 'qa' }, null)), false);
    assert.equal(canStartReply(replyBlock({ locked: false, categoryKind: 'qa' }, { canReply: false, reason: 'muted' })), false);
    assert.equal(canStartReply(replyBlock({ locked: false, categoryKind: 'discussion' }, null)), true);
  });
  it('both items are gated', () => {
    const items = between(thread(), 'const itemsFor = useCallback', 'const menuItems');
    assert.match(items, /const replying = canStartReply\(replyBlock\(topic, value\?\.rights \?\? null\)\);/);
    assert.match(items, /if \(published && !announcements && replying\) \{/);
    assert.match(items, /if \(published && replying && !p\.isMine/);
  });
});

describe('UI-2-09: a posted quote says who said it', () => {
  it('first name and the words, or the words alone when that post is not here', () => {
    // The display name as the server sends it, whole (check 3).
    assert.equal(quoteLine('Ring out the wedge.', 'Maya R.'), 'Maya R.: Ring out the wedge.');
    assert.equal(quoteLine('Ring out the wedge.', 'Former member'), 'Former member: Ring out the wedge.');
    assert.equal(quoteLine('Ring out the wedge.', 'Prof. Channing Booth'), 'Prof. Channing Booth: Ring out the wedge.');
    assert.equal(quoteLine('Ring out the wedge.', null), 'Ring out the wedge.');
    assert.equal(quoteLine('Ring out the wedge.', '  '), 'Ring out the wedge.');
    assert.match(thread(), /quoteLine\(post\.quoteExcerpt, quotedName\)/);
  });
});

/* ── UI-2-06 ─────────────────────────────────────────────────────────── */

describe('UI-2-06: an edited post keeps its place, as on the server', () => {
  it('the sample keeps the first published date on an edit', () => {
    const s = code('src/features/forum/sampleData.ts');
    assert.match(s, /publishedAt: found\.post\.publishedAt \?\? \(v\.modState === 'published' \? ago\(0\) : null\),/);
  });
});

/* ── UI-2-07 / 10 / 11 / 12 / 13 ─────────────────────────────────────── */

describe('UI-2-07: a glossary term from the Ask form opens in place', () => {
  it('the form sits in a GlossaryLinkProvider and opens the term there', () => {
    const a = ask();
    assert.match(a, /<GlossaryLinkProvider>\s*<AskForm /);
    assert.match(a, /onPress=\{\(\) => \(openTerm \? openTerm\(term\) : navigation\.navigate\('PublicGlossary'/);
  });
});

describe('UI-2-10: CANCEL can throw the draft away', () => {
  it('asks first, then clears the draft and leaves; an edit or an empty form just leaves', () => {
    const c = between(ask(), 'const cancel = () => {', 'const headerTitle');
    assert.match(c, /if \(edit \|\| !hasStarted\(values\)\) \{\s*safeGoBack/);
    assert.match(c, /confirmDialog\(\s*'Discard this draft\?'/);
    assert.match(c, /void clearDraft\(draftName\);\s*safeGoBack\(navigation as never\);/);
    assert.doesNotMatch(c, /—/);
  });
});

describe('UI-2-11: a search with no match says so', () => {
  it('the pick list has an empty face', () => {
    assert.match(ask(), /ListEmptyComponent=\{\s*q\.trim\(\) \? <Text style=\{st\.pickEmpty\}>Nothing matches that search\./);
  });
});

describe('UI-2-12: the notices screen is titled for more than one post', () => {
  it('Your posts', () => {
    const n = code(`${F}ForumNoticesScreen.tsx`);
    assert.match(n, /<ForumHeader title="Your posts"/);
    assert.doesNotMatch(n, /title="Your post"/);
  });
});

describe('UI-2-13: a forum report can say what', () => {
  it('a details box, sent with the report', () => {
    const p = code(`${F}forumPopups.tsx`);
    assert.match(p, /const r = await reportPost\(postId, reason, detail\.trim\(\) \|\| undefined\);/);
    assert.match(p, /maxLength=\{REPORT_DETAIL_MAX\}/);
    assert.match(p, /accessibilityLabel="Report details"/);
    // The server keeps 1000 characters with its "[forum: <reason>] " prefix:
    // with the longest reason the details still fit whole.
    for (const r of REPORT_REASONS) assert.ok(`[forum: ${r.key}] `.length + REPORT_DETAIL_MAX <= 1000, r.key);
    assert.equal(REPORT_DETAIL_MAX, 1000 - '[forum: self_promotion] '.length);
  });
});

/* ── Wording ─────────────────────────────────────────────────────────── */

describe('Pass 2 words: no em dash and no "mains" in the new forum strings', () => {
  it('the new rules lines', () => {
    const lines = [
      acceptEditStep('edit_blocked', null),
      acceptEditStep('held', null),
    ].map((s) => JSON.stringify(s));
    for (const l of lines) {
      assert.doesNotMatch(l, /—/);
      assert.doesNotMatch(l, /\bmains\b/i);
    }
  });
});

describe('CODE-2-02: the browser harness keeps one thread per topic, as the app', () => {
  it('webPreviews passes getId for ForumThread, and ToolPreview hands it to the Stack.Screen', () => {
    assert.match(code('src/dev/webPreviews.tsx'), /name: 'ForumThread',[\s\S]{0,120}getId: \(\{ params \}/);
    assert.match(code('src/screens/tools/ToolPreview.tsx'), /getId=\{s\.getId as never\}/);
    assert.match(code('src/navigation/RootNavigator.tsx'), /name="ForumThread"[\s\S]{0,200}getId=/);
  });
});

describe('CODE-2-07 re-check: the draft timer never writes a restored pending draft without its id', () => {
  it('restore the pending draft, re-pick the same category, the timer fires: the id is still on disk', () => {
    // On disk after an app kill mid-post.
    const v = { ...EMPTY_ASK, title: 'Hum on my vocal mic', trying: 'Record a podcast' };
    const disk1 = askDraftText(v, 'cid-1', { lab: 'Gain Staging', job: false });
    // The form mounts and restores it.
    const got = askDraftRead(disk1)!;
    const madeFor = { lab: got.lab, job: got.job };
    const values = { ...EMPTY_ASK, ...got.values };
    // Re-pick the same category (setJob(false) on job false), or link the same
    // lab again: nothing changes, and if the timer runs it keeps the id.
    const disk2 = askDraftForSave(values, got.clientId, madeFor, { lab: got.lab, job: got.job });
    assert.equal(askDraftRead(disk2)?.clientId, 'cid-1');
    assert.equal(askDraftRead(disk2)?.lab, 'Gain Staging');
    // A different lab: a new post, so the draft no longer carries the old id.
    assert.equal(askDraftRead(askDraftForSave(values, got.clientId, madeFor, { lab: 'Phase', job: false }))?.clientId, null);
    // Changed words: set() already dropped the id (clientId.current is null).
    assert.equal(askDraftRead(askDraftForSave({ ...values, title: 'Hum, again' }, null, madeFor, madeFor))?.clientId, null);
  });

  it('setLab and setJob mark the form touched only on a real change', () => {
    const a = ask();
    assert.match(a, /const setLab = \(next: string \| null\) => \{\s*if \(postingNow\.current \|\| next === lab\) return;\s*touched\.current = true;/);
    assert.match(a, /const value = typeof next === 'function' \? next\(job\) : next;\s*if \(value === job\) return;\s*touched\.current = true;/);
  });
});
