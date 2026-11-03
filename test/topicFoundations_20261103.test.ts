/**
 * Topic Foundations (D47, owner GO 2026-11-03) — receipts.
 *
 *  1. The lesson text parses into the popup's title + paragraphs (the 5
 *     approved lessons, CRLF, bad input).
 *  2. A missing server column / any failed read means NO row and NO popup.
 *  3. The read state is per learner + topic on createLocalStore: a failed
 *     read is UNREADABLE and writes nothing; a refused write takes the mark
 *     back; the account wipe clears it; the key is inside the `ape:*` sweep.
 *  4. The auto-popup is due only with a KNOWN, unread state.
 *  5. Wiring: the dev preview copy is never imported statically, the column
 *     is read by its own query, the Dashboard adds nothing to the app-start
 *     graph, and the Flashcards popup waits for the T1 intro and the welcome.
 */
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { registerHooks } from 'node:module';
import { join, relative, sep } from 'node:path';
import { describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';

import {
  FOUNDATIONS_READ_STORE_KEY,
  foundationsAutoDue,
  foundationsFromQuery,
  foundationsReadKey,
  isFoundationsRead,
  isMissingColumnError,
  parseFoundationsReadMap,
  parseFoundationsText,
} from '../src/features/foundations/foundationsText.ts';
import { DEV_FOUNDATIONS } from '../src/features/foundations/devFoundations.ts';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const read = (p: string) => readFileSync(join(ROOT, p), 'utf8').replace(/\r\n/g, '\n');
const code = (p: string) => read(p).replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
const APPROVED = 'docs/foundations/approved';
const GS = [3060, 3970, 3350, 3110, 4740];

// ── fake AsyncStorage for the store (the localStore.test pattern) ──────────
const g = globalThis as Record<string, unknown>;
const AS = new Map<string, string>();
g.__TF_AS__ = AS;
g.__TF_FAIL_READS__ = false;
g.__TF_FAIL_WRITES__ = false;
const FAKE_AS =
  'data:text/javascript,' +
  encodeURIComponent(
    `const s = globalThis.__TF_AS__;
     export default {
       async getItem(k) { if (globalThis.__TF_FAIL_READS__) throw new Error('read failed'); return s.has(k) ? s.get(k) : null; },
       async setItem(k, v) { if (globalThis.__TF_FAIL_WRITES__) throw new Error('write failed'); s.set(k, v); },
       async removeItem(k) { s.delete(k); },
     };`,
  );
registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier === '@react-native-async-storage/async-storage') return { url: FAKE_AS, shortCircuit: true };
    if (specifier.startsWith('.') && !/\.[cm]?[jt]sx?$/.test(specifier)) {
      const candidate = new URL(specifier + '.ts', context.parentURL);
      if (existsSync(fileURLToPath(candidate))) return { url: candidate.href, shortCircuit: true };
    }
    return nextResolve(specifier, context);
  },
});
const tick = () => new Promise((r) => setTimeout(r, 0));

describe('1. the lesson text → title + paragraphs', () => {
  for (const gs of GS) {
    it(`approved lesson ${gs}: title without the prefix, 6–8 paragraphs, no blank or prefixed paragraph`, () => {
      const raw = read(`${APPROVED}/${gs}.md`);
      const lesson = parseFoundationsText(raw);
      assert.ok(lesson, `${gs} parsed`);
      const line1 = raw.split('\n')[0].trim();
      assert.ok(line1.startsWith('Topic Foundations: '));
      assert.equal(lesson.title, line1.slice('Topic Foundations: '.length));
      assert.ok(lesson.paragraphs.length >= 6 && lesson.paragraphs.length <= 8, `${gs}: ${lesson.paragraphs.length} paragraphs`);
      for (const p of lesson.paragraphs) {
        assert.ok(p.length > 0 && !p.includes('\n'));
        assert.ok(!p.startsWith('Topic Foundations'));
      }
    });
  }

  it('CRLF text and a wrapped paragraph parse the same as LF', () => {
    const lf = 'Topic Foundations: Test Topic\n\nFirst para line one\nline two.\n\nSecond para.';
    const crlf = lf.replace(/\n/g, '\r\n');
    const a = parseFoundationsText(lf);
    assert.deepEqual(a, { title: 'Test Topic', paragraphs: ['First para line one line two.', 'Second para.'] });
    assert.deepEqual(parseFoundationsText(crlf), a);
  });

  it('a title line without the prefix is kept as the title; extra blank lines are ignored', () => {
    assert.deepEqual(parseFoundationsText('Mixing\n\n\n\nOne.\n\n \n\nTwo.'), { title: 'Mixing', paragraphs: ['One.', 'Two.'] });
  });

  it('nothing usable → null (no row, no popup): null, blank, not a string, a title with no body', () => {
    for (const bad of [null, undefined, '', '   \n  ', 42, {}, 'Topic Foundations: Only a title', 'Topic Foundations:\n\nBody but no title.']) {
      assert.equal(parseFoundationsText(bad), null, JSON.stringify(bad));
    }
  });
});

describe('2. missing column / failed read → no row and no popup', () => {
  it('the column not existing yet (Postgres 42703) is a SETTLED "no text"', () => {
    const res = { data: null, error: { code: '42703', message: 'column achievements.foundations_text does not exist' } };
    assert.deepEqual(foundationsFromQuery(res), { lesson: null, settled: true });
    assert.equal(isMissingColumnError(res.error), true);
  });
  it('PostgREST schema-cache miss (PGRST204) and a message-only form are the same', () => {
    assert.equal(isMissingColumnError({ code: 'PGRST204', message: 'x' }), true);
    assert.equal(isMissingColumnError({ message: "Could not find the 'foundations_text' column of 'achievements'" }), true);
  });
  it('any other error (offline, timeout) is "no text" too, but asked again next time', () => {
    assert.deepEqual(foundationsFromQuery({ data: null, error: { message: 'Failed to fetch' } }), { lesson: null, settled: false });
    assert.deepEqual(foundationsFromQuery({ data: null, error: { code: '57014', message: 'canceling statement due to statement timeout' } }), {
      lesson: null,
      settled: false,
    });
    assert.deepEqual(foundationsFromQuery(null), { lesson: null, settled: false });
    assert.equal(isMissingColumnError(null), false);
  });
  it('a null column / no row is a settled "no text"; text is a lesson', () => {
    assert.deepEqual(foundationsFromQuery({ data: { foundations_text: null }, error: null }), { lesson: null, settled: true });
    assert.deepEqual(foundationsFromQuery({ data: null, error: null }), { lesson: null, settled: true });
    const ok = foundationsFromQuery({ data: { foundations_text: read(`${APPROVED}/3060.md`) }, error: null });
    assert.equal(ok.settled, true);
    assert.equal(ok.lesson?.title, 'Pro Audio Safety');
  });
});

describe('3. read state: per learner + topic, on createLocalStore', () => {
  it('key shape and lookup are per uid AND per topic', () => {
    assert.equal(foundationsReadKey('u1', 'a1'), 'u1:a1');
    const m = { 'u1:a1': '2026-11-03T00:00:00.000Z' };
    assert.equal(isFoundationsRead(m, 'u1', 'a1'), true);
    assert.equal(isFoundationsRead(m, 'u2', 'a1'), false, 'another account on the device');
    assert.equal(isFoundationsRead(m, 'guest', 'a1'), false, 'a guest');
    assert.equal(isFoundationsRead(m, 'u1', 'a2'), false, 'another topic');
  });
  it('the stored map is cleaned; a non-object blob throws (set aside as damaged)', () => {
    assert.deepEqual(parseFoundationsReadMap({ 'u:a': 'x', bad: 'y', 'u:b': 3 }), { 'u:a': 'x' });
    assert.throws(() => parseFoundationsReadMap([1]));
    assert.throws(() => parseFoundationsReadMap('x'));
    assert.throws(() => parseFoundationsReadMap(null));
  });

  it('mark → written under the one key; a refused write takes the mark back; a failed READ writes nothing; the wipe resets', async () => {
    const mod = await import('../src/features/foundations/foundationsReadStore.ts');
    const { foundationsReadStore: store, markFoundationsRead, readNow } = mod;
    assert.equal(store.key, FOUNDATIONS_READ_STORE_KEY);
    assert.equal(FOUNDATIONS_READ_STORE_KEY, 'ape:foundations:read');

    // Happy path.
    await store.hydrate();
    assert.equal(await markFoundationsRead('u1', 'topicA'), true);
    assert.equal(readNow('u1', 'topicA'), true);
    assert.equal(readNow('u2', 'topicA'), false);
    const stored = JSON.parse(AS.get(FOUNDATIONS_READ_STORE_KEY) as string);
    assert.ok(typeof stored['u1:topicA'] === 'string');

    // A refused write answers false and the in-memory mark is taken back.
    g.__TF_FAIL_WRITES__ = true;
    assert.equal(await markFoundationsRead('u1', 'topicB'), false);
    await tick();
    await tick();
    assert.equal(readNow('u1', 'topicB'), false, 'no ✓ without a write');
    g.__TF_FAIL_WRITES__ = false;

    // The account wipe: storage swept, then the registered reset.
    AS.delete(FOUNDATIONS_READ_STORE_KEY);
    store.reset();
    assert.equal(store.isHydrated(), false);

    // A failed READ: UNREADABLE, nothing written over the stored copy.
    AS.set(FOUNDATIONS_READ_STORE_KEY, JSON.stringify({ 'u1:topicC': 'kept' }));
    g.__TF_FAIL_READS__ = true;
    await store.hydrate();
    assert.equal(store.isUnreadable(), true);
    assert.equal(store.isHydrated(), false);
    assert.equal(await markFoundationsRead('u1', 'topicD'), false);
    assert.deepEqual(JSON.parse(AS.get(FOUNDATIONS_READ_STORE_KEY) as string), { 'u1:topicC': 'kept' }, 'stored copy untouched');
    g.__TF_FAIL_READS__ = false;
    await store.hydrate();
    assert.equal(readNow('u1', 'topicC'), true, 'the stored read survives the failed read');
    assert.equal(readNow('u1', 'topicD'), false, 'the mark made while unreadable was taken back');
  });

  it('the key is inside the account AND guest sweep (not on KEEP / GUEST_KEEP, not an onboarding prefix)', () => {
    const wipe = code('src/features/account/clearLocalAccountData.ts');
    assert.ok(!wipe.includes(FOUNDATIONS_READ_STORE_KEY));
    assert.ok(!wipe.includes("'ape:foundations"));
    for (const keep of ['ape:intro:', 'ape:coach:', 'ape:onboarding:', 'ape:welcome:seen:', 'ape:attemptDraft:']) {
      assert.ok(!FOUNDATIONS_READ_STORE_KEY.startsWith(keep));
    }
    assert.ok(!FOUNDATIONS_READ_STORE_KEY.endsWith('FsGuide'));
  });

  it('the hook never treats an unanswered session read as a guest', () => {
    const hook = code('src/features/foundations/useFoundationsRead.ts');
    assert.match(hook, /safeSessionResult\(supabase\.auth\.getSession\(\)/);
    assert.match(hook, /if \(timedOut\) return null;/);
    assert.match(hook, /const known = !!achievementId && uid != null && hydrated && !unreadable;/);
  });
});

describe('4. the Flashcards auto-popup is due only with a KNOWN, unread state', () => {
  it('truth table', () => {
    const base = { hasLesson: true, readKnown: true, read: false, closedThisVisit: false };
    assert.equal(foundationsAutoDue(base), true);
    assert.equal(foundationsAutoDue({ ...base, hasLesson: false }), false, 'no lesson → no popup');
    assert.equal(foundationsAutoDue({ ...base, readKnown: false }), false, 'unknown → no popup');
    assert.equal(foundationsAutoDue({ ...base, read: true }), false, "I've read this → never again");
    assert.equal(foundationsAutoDue({ ...base, closedThisVisit: true }), false, 'LATER → not again this visit');
  });
});

describe('5. wiring', () => {
  it('the dev preview copy is the 5 approved lessons, verbatim (manifest md5)', () => {
    const manifest = JSON.parse(read(`${APPROVED}/MANIFEST.json`)) as { gs: number; md5: string }[];
    assert.deepEqual(Object.keys(DEV_FOUNDATIONS).map(Number).sort(), [...GS].sort());
    for (const m of manifest) {
      const file = read(`${APPROVED}/${m.gs}.md`);
      assert.equal(DEV_FOUNDATIONS[m.gs], file.trim(), `${m.gs} matches the approved file`);
      const raw = readFileSync(join(ROOT, `${APPROVED}/${m.gs}.md`));
      assert.equal(createHash('md5').update(raw).digest('hex'), m.md5, `${m.gs}.md is still the approved version`);
    }
  });

  it('devFoundations is never imported statically, and is required only inside if (__DEV__)', () => {
    const SRC = join(ROOT, 'src');
    const walk = (d: string): string[] =>
      readdirSync(d).flatMap((n) => {
        const p = join(d, n);
        return statSync(p).isDirectory() ? walk(p) : /\.(ts|tsx)$/.test(n) ? [p] : [];
      });
    const users: string[] = [];
    for (const f of walk(SRC)) {
      const rel = relative(ROOT, f).split(sep).join('/');
      if (rel === 'src/features/foundations/devFoundations.ts') continue;
      const s = code(rel);
      assert.ok(!/^\s*import\s+(?!type\b)[^;]*devFoundations/m.test(s), `${rel} imports devFoundations statically`);
      if (s.includes("require('./devFoundations')") || s.includes('devFoundations')) users.push(rel);
    }
    assert.deepEqual(users, ['src/features/foundations/foundationsSource.ts']);
    const src = code('src/features/foundations/foundationsSource.ts');
    const block = src.match(/if \(__DEV__\) \{([\s\S]*?)\n {2}\}\n {2}return null;/);
    assert.ok(block, 'the dev fallback is one if (__DEV__) { … } block');
    assert.match(block[1], /require\('\.\/devFoundations'\)/);
    assert.equal(src.match(/require\('\.\/devFoundations'\)/g)?.length, 1);
  });

  it('foundations_text is read by its OWN query on the shared client, and in no other select', () => {
    const src = code('src/features/foundations/foundationsSource.ts');
    assert.match(src, /import \{ supabase \} from '\.\.\/\.\.\/lib\/supabase';/);
    assert.match(src, /\.from\('achievements'\)\.select\('foundations_text'\)\.eq\('id', achievementId\)\.maybeSingle\(\)/);
    assert.ok(!/createClient/.test(src));
    const SRC = join(ROOT, 'src');
    const walk = (d: string): string[] =>
      readdirSync(d).flatMap((n) => {
        const p = join(d, n);
        return statSync(p).isDirectory() ? walk(p) : /\.(ts|tsx)$/.test(n) ? [p] : [];
      });
    for (const f of walk(SRC)) {
      const rel = relative(ROOT, f).split(sep).join('/');
      if (rel.startsWith('src/features/foundations/')) continue;
      assert.ok(!code(rel).includes('foundations_text'), `${rel} must not select foundations_text`);
    }
  });

  it('the Dashboard reaches the row only through a runSoon require (no static import → start graph unchanged)', () => {
    const dash = code('src/screens/dashboard/DashboardScreen.tsx');
    assert.ok(!/^\s*import\s+(?!type\b)[^;]*features\/foundations/m.test(dash));
    assert.match(dash, /runSoon\(\(\) => \{\s*try \{\s*setMod\(require\('\.\.\/\.\.\/features\/foundations\/FoundationsDashboardSlot'\)/);
    // Above Flashcards: the row is rendered before the method map.
    const row = dash.indexOf('<FoundationsRow');
    const map = dash.indexOf('METHOD_ORDER.filter((m) => customMethods.includes(m.key)) : METHOD_ORDER).map(');
    assert.ok(row > 0 && map > row);
    assert.match(dash, /locked=\{actMembershipLocked\}\s*onLocked=\{\(\) => setUpgradeOpen\(true\)\}/);
  });

  it('Flashcards: the popup holds for the T1 intro AND the welcome, and the screen waits for it', () => {
    const fc = code('src/screens/study/FlashcardsScreen.tsx');
    const tag = fc.slice(fc.indexOf('<FoundationsAutoPopup'), fc.indexOf('/>', fc.indexOf('<FoundationsAutoPopup')));
    assert.match(tag, /flashIntro\.owed \|\|\s*welcomeOwed/);
    assert.match(tag, /enabled=\{!flaggedMode\}/);
    assert.match(tag, /onOwedChange=\{setFoundationsOwed\}/);
    assert.match(fc, /const firstVisitOwed = introsOwed \|\| foundationsOwed;/);
    assert.match(fc, /if \(firstVisitOwed\) \{\s*setIntrosSettled\(false\);/);
    assert.match(fc, /\}, \[firstVisitOwed\]\);/);
    // After the welcome in the tree too.
    assert.ok(fc.indexOf('<TopicWelcomeSheet') < fc.indexOf('<FoundationsAutoPopup'));
    const sheet = code('src/features/foundations/TopicFoundationsSheet.tsx');
    assert.match(sheet, /rootModalHoldMs\(\)/);
    assert.match(sheet, /useLatchedPress\(onRead\)/);
    assert.match(sheet, /const wanted = due && focused && !suppressed;/);
    assert.ok(!/Alert\.alert/.test(sheet));
  });
});
