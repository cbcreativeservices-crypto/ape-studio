/**
 * START HERE — owner decisions 2026-10-04 (receipt key: startHereDecisions).
 *
 *  1. First launch lands on the Glossary (it landed on Start Here since
 *     2026-09-29) — CHANGED.
 *  2. The Start Here card is on every Home deck by default, members' custom
 *     deck included — VERIFIED (pin only; it is a pinned head card built in
 *     code, never stored, so no user order can drop or overwrite it).
 *  3. Lesson 3 is "How High, How Loud" — CHANGED.
 *  4. +2 lookups: Start Here's own metered read goes through
 *     get_glossary_definition_start_here (drafted: supabase/migrations/
 *     2026100407_start_here_glossary_bonus.sql, NOT applied), falls back to the
 *     normal RPC while that is absent, shares the session caches (D50), and the
 *     words are honest — CHANGED.
 *
 * Driven for real where it can be: glossaryGateway is imported with supabase
 * stubbed (records every RPC name), and the pure Start Here helpers directly.
 * Screens import React Native, so those are source receipts.
 *
 * R2: every [R2] test FAILED with the HEAD copies of the changed files written
 * back (git show HEAD:<path>), and passes with the changes restored.
 */
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { registerHooks } from 'node:module';
import { describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';

const g = globalThis as Record<string, unknown>;
g.__SHD_CALLS__ = [] as string[];
g.__SHD_FAULTS__ = {} as Record<string, { code?: string; message: string } | undefined>;
g.__SHD_ROW__ = { used: 3, lim: 14, bonus_spent: true, bonus_left: 1 };
g.__SHD_STATUS__ = 2;

const mod = (src: string) => 'data:text/javascript,' + encodeURIComponent(src);
const SUPABASE = mod(`
  export const supabase = {
    auth: { onAuthStateChange(cb) { globalThis.__SHD_AUTH__ = cb; return { data: { subscription: { unsubscribe() {} } } }; } },
    async rpc(name, args) {
      globalThis.__SHD_CALLS__.push(name + ':' + (args.p_id ?? '') + ':' + (args.p_device_id ?? ''));
      const f = globalThis.__SHD_FAULTS__[name];
      if (f) return { data: null, error: f };
      if (name === 'glossary_start_here_bonus_status') return { data: globalThis.__SHD_STATUS__, error: null };
      const r = globalThis.__SHD_ROW__;
      const row = { definition: 'full text', plain_english: null, purpose_function: null, practical_application: null,
        scenario_contexts: null, related_terms: null, category: null, difficulty: null, common_mistakes: null,
        used: r.used, lim: r.lim, window_start: null };
      if (name === 'get_glossary_definition_start_here') { row.bonus_spent = r.bonus_spent; row.bonus_left = r.bonus_left; }
      return { data: [row], error: null };
    },
    from() { throw new Error('not used'); },
  };`);
const DEVICE = mod(`export async function getDeviceId() { return 'device-abcdef01'; }`);

registerHooks({
  resolve(specifier, context, nextResolve) {
    const stub = (url: string) => ({ url, shortCircuit: true });
    if (/lib\/supabase$/.test(specifier)) return stub(SUPABASE);
    if (/account\/deviceIdentity$/.test(specifier)) return stub(DEVICE);
    if (specifier.startsWith('.') && !/\.[cm]?[jt]sx?$/.test(specifier)) {
      const candidate = new URL(specifier + '.ts', context.parentURL);
      if (existsSync(fileURLToPath(candidate))) return stub(candidate.href);
    }
    return nextResolve(specifier, context);
  },
});

const gw = (await import('../src/features/glossary/glossaryGateway.ts')) as Record<string, any>;
const calls = () => g.__SHD_CALLS__ as string[];
const faults = () => g.__SHD_FAULTS__ as Record<string, { code?: string; message: string } | undefined>;
const signIn = (uid: string | null) =>
  (g.__SHD_AUTH__ as (e: string, s: unknown) => void)('SIGNED_IN', uid ? { user: { id: uid } } : null);
const NOT_THERE = { code: 'PGRST202', message: 'Could not find the function public.get_glossary_definition_start_here' };

const read = (p: string) => readFileSync(p, 'utf8');

// ── 1. Landing ─────────────────────────────────────────────────────────────
describe('decision 1 — every open lands on the Glossary, the first one included', () => {
  it('[R2] the first landing of a session is the Glossary card; no first-open flag is consulted', () => {
    const home = read('src/screens/courses/CourseSelectionScreen.tsx');
    assert.match(home, /if \(!sessionLanded\) \{\s*target = glossaryIdx;/);
    assert.doesNotMatch(home, /isFirstAppOpen|firstOpen|startHereIdx/);
    assert.equal(existsSync('src/features/startHere/firstOpen.ts'), false, 'the first-open module is gone');
  });
  it('a member\'s own Home default still wins (unchanged)', () => {
    const home = read('src/screens/courses/CourseSelectionScreen.tsx');
    assert.match(home, /target = glossaryIdx;\s*if \(defaultHomeGs != null\)/);
  });
});

// ── 2. Home deck (verified, not changed) ──────────────────────────────────
describe('decision 2 — Start Here is on every Home deck by default (pin)', () => {
  const home = read('src/screens/courses/CourseSelectionScreen.tsx');
  it('the default (public) deck builds it in code, right after Career Finder', () => {
    assert.match(home, /\{ kind: 'careerFinder', id: 'careerFinder' \},[\s\S]{0,400}\{ kind: 'startHere', id: 'startHere' \},/);
  });
  // Superseded the same day (owner 2026-10-04: "home is default, stays where
  // user last left it after they move it"): no longer pinned — it is a
  // movable, never-removable row of the saved Home order. The full receipt is
  // test/homeStartHereCard_20261004.test.ts; this keeps the "on every deck" pin.
  it('a member\'s custom deck always carries it: at its default place, or where the learner left it', () => {
    assert.match(home, /const startHere = cards\.filter\(\(c\) => c\.kind === 'startHere'\);/);
    assert.match(home, /if \(anchor < 0\) return \[\.\.\.fixed, \.\.\.startHere, \.\.\.bundleCards, \.\.\.topicCards, \.\.\.showcase\];/);
    assert.match(home, /\.\.\.topicCards\.slice\(0, anchor \+ 1\),\s*\.\.\.startHere,/);
    const store = read('src/features/home/homeCardsStore.ts');
    assert.match(store, /const orderView = lastOf\(\(l\) => \(l\.includes\(HOME_START_HERE\) \? l : \[HOME_START_HERE, \.\.\.l\]\)\);/,
      'a saved order that never held it still reads with it in');
  });
});

// ── 3. Lesson 3 title ─────────────────────────────────────────────────────
describe('decision 3 — Lesson 3 is "How High, How Loud"', async () => {
  const { SECTIONS, kickerFor } = await import('../src/features/startHere/startHereContent.ts');
  it('[R2] title and short name, so the page list, the kicker and the what\'s-left screen all read it', () => {
    const l3 = SECTIONS.find((s: { id: string }) => s.id === 'l3');
    assert.equal(l3.title, 'How High, How Loud');
    assert.equal(l3.short, 'How high, how loud');
    assert.equal(kickerFor('l3'), 'LESSON 3 OF 6 · HOW HIGH, HOW LOUD');
    assert.doesNotMatch(read('src/features/startHere/startHereContent.ts'), /Two Basic Parts|Two parts of sound/);
  });
});

// ── 4. The +2 bonus — client ──────────────────────────────────────────────
describe('decision 4 — Start Here\'s 2 extra definitions (client)', () => {
  it('[R2] a Start Here open calls the Start Here RPC with the device id; other opens call the normal RPC', async () => {
    signIn('free-1');
    calls().length = 0;
    const r = await gw.readDefinitionOnce('a1', undefined, 'startHere');
    assert.equal(r.state, 'ok');
    assert.equal(r.row.bonus_spent, true, 'the fresh caller is told this open spent an extra one');
    await gw.readDefinitionOnce('b1');
    assert.deepEqual(calls(), ['get_glossary_definition_start_here:a1:device-abcdef01', 'get_glossary_definition:b1:device-abcdef01']);
  });

  it('[R2] the session cache is shared (D50): a term paid in Start Here is free elsewhere, and its copy spends nothing', async () => {
    signIn('free-2');
    calls().length = 0;
    await gw.readDefinitionOnce('a2', undefined, 'startHere');
    const again = await gw.readDefinitionOnce('a2', false); // the Glossary screen
    const popup = await gw.readDefinitionOnce('a2', undefined, 'startHere'); // Start Here again
    assert.equal(calls().length, 1, 'charged once per session');
    assert.equal(again.row.bonus_spent, false);
    assert.equal(popup.row.bonus_spent, false, 'a re-open never says it spent an extra one');
  });

  it('[R2] the server answer updates the count of extras left', async () => {
    signIn('free-3');
    (g.__SHD_ROW__ as Record<string, unknown>).bonus_left = 0;
    await gw.readDefinitionOnce('a3', undefined, 'startHere');
    assert.equal(gw.peekStartHereBonusLeft(), 0);
    (g.__SHD_ROW__ as Record<string, unknown>).bonus_left = 1;
  });

  it('[R2] before the migration is applied: the normal RPC answers, nothing is lost, and no extras are claimed', async () => {
    signIn('free-4');
    gw.forgetStartHereBonusForTests();
    faults()['get_glossary_definition_start_here'] = NOT_THERE;
    faults()['glossary_start_here_bonus_status'] = NOT_THERE;
    calls().length = 0;
    const r = await gw.readDefinitionOnce('a4', undefined, 'startHere');
    assert.equal(r.state, 'ok');
    assert.equal(r.row.definition, 'full text');
    assert.equal(r.row.bonus_spent, undefined);
    await gw.readDefinitionOnce('a5', undefined, 'startHere');
    assert.deepEqual(
      calls(),
      ['get_glossary_definition_start_here:a4:device-abcdef01', 'get_glossary_definition:a4:device-abcdef01', 'get_glossary_definition:a5:device-abcdef01'],
      'asks the absent RPC once per app session, then goes straight to the normal one',
    );
    assert.equal(await gw.startHereBonusLeft(), null, 'no count → the normal wording only');
    faults()['get_glossary_definition_start_here'] = undefined;
    faults()['glossary_start_here_bonus_status'] = undefined;
    gw.forgetStartHereBonusForTests();
  });

  it('[R2] the status read: a number is kept per reader; a failed read is not kept; an identity change forgets it', async () => {
    signIn('free-5');
    g.__SHD_STATUS__ = 2;
    faults()['glossary_start_here_bonus_status'] = { message: 'network down' };
    assert.equal(await gw.startHereBonusLeft(), null);
    faults()['glossary_start_here_bonus_status'] = undefined;
    assert.equal(await gw.startHereBonusLeft(), 2, 'asked again after a failed read');
    calls().length = 0;
    assert.equal(await gw.startHereBonusLeft(), 2);
    assert.equal(calls().length, 0, 'kept for this reader');
    signIn('free-6');
    assert.equal(gw.peekStartHereBonusLeft(), undefined, 'another reader never inherits the count');
  });
});

describe('decision 4 — Start Here wording and the ask-first rule', async () => {
  const sh = await import('../src/features/startHere/startHereGlossary.ts');
  it('[R2] related words exist for every starter entry, in a glossary sense the lessons use', () => {
    for (const key of Object.keys(sh.STARTER_GLOSSARY)) assert.ok(sh.starterRelated(key).length >= 3, key);
    const all = Object.values(sh.STARTER_RELATED).flat();
    assert.ok(!all.includes('Damping') && !all.includes('Density'), 'the reverb senses are left out');
  });
  it('[R2] a starter word, a member or an already-opened term opens; a new term for a known non-member asks', () => {
    assert.equal(sh.relatedPlan({ starter: true, metered: true, alreadyOpened: false }), 'open');
    assert.equal(sh.relatedPlan({ starter: false, metered: false, alreadyOpened: false }), 'open');
    assert.equal(sh.relatedPlan({ starter: false, metered: true, alreadyOpened: true }), 'open');
    assert.equal(sh.relatedPlan({ starter: false, metered: true, alreadyOpened: false }), 'ask');
  });
  it('[R2] the words: extras only when the server counted them; normal wording otherwise', () => {
    assert.equal(sh.relatedIntro(2), 'Start Here includes 2 extra definitions (2 left). After those, a related word uses 1 of your weekly definition lookups.');
    assert.equal(sh.relatedIntro(0), 'You’ve used Start Here’s 2 extra definitions. Opening a related word now uses 1 of your weekly definition lookups.');
    assert.equal(sh.relatedIntro(null), 'Opening a related word uses 1 definition lookup.');
    assert.equal(sh.relatedAskBody(1), 'This uses 1 of Start Here’s 2 extra definitions (1 left).');
    assert.equal(sh.relatedAskBody(0), 'Opening this word uses 1 definition lookup.');
    assert.equal(sh.bonusSpentLine(1), 'This used one of Start Here’s 2 extra definitions (1 left).');
  });
  it('[R2] Start Here wires it: the popup reads via "startHere"; maybe-members see no related words; the ask is in the popup', () => {
    const bits = read('src/screens/startHere/bits.tsx');
    assert.match(bits, /via="startHere"/);
    assert.match(bits, /preloaded=\{starterGlossaryEntry\(full\)\}/, 'the 21 built-in starter entries stay free');
    assert.match(bits, /if \(related\.length === 0 \|\| \(gate !== 'open' && gate !== 'locked'\)\) return null;/);
    assert.doesNotMatch(bits, /confirmDialog\(/, 'no dialog Modal over the word sheet (K10)');
    const popup = read('src/features/glossary/GlossaryTermPopup.tsx');
    assert.match(popup, /const full = await readOnce\(hit\.id, via\);/);
    assert.match(popup, /via = 'normal',/, 'every other caller keeps the normal meter');
  });
});

// ── 4. The +2 bonus — server draft ───────────────────────────────────────
describe('decision 4 — the drafted migration (not applied)', () => {
  const sql = existsSync('supabase/migrations/2026100407_start_here_glossary_bonus.sql')
    ? read('supabase/migrations/2026100407_start_here_glossary_bonus.sql')
    : '';
  it('[R2] one grant per account AND per device, both needed, both spent', () => {
    assert.match(sql, /create table if not exists public\.glossary_start_here_bonus_user \(\s*user_id\s+uuid\s+primary key/);
    assert.match(sql, /create table if not exists public\.glossary_start_here_bonus_device \(\s*device_id\s+text\s+primary key/);
    assert.match(sql, /if u_used < v_bonus and d_used < v_bonus then/);
    assert.match(sql, /v_bonus constant integer := 2;/);
    assert.match(sql, /if v_dev is not null then/, 'no device id → no extras, normal meter');
  });
  it('[R2] members first, 24 h re-reads free, a bonus open is a read like any other, the week otherwise', () => {
    const body = sql.slice(sql.indexOf('create or replace function public.get_glossary_definition_start_here'));
    const member = body.indexOf('has_academy_access');
    const reread = body.indexOf('glossary_term_reads r');
    const bonus = body.indexOf('glossary_start_here_bonus_user (user_id)');
    const week = body.indexOf('glossary_consume(p_device_id)');
    assert.ok(member > 0 && member < reread && reread < bonus && bonus < week);
    assert.match(body, /raise exception 'weekly_limit_reached'/);
    assert.match(body, /insert into public\.glossary_term_reads/);
  });
  it('[R2] RLS on, no table grants to clients, functions to authenticated only', () => {
    assert.match(sql, /alter table public\.glossary_start_here_bonus_user\s+enable row level security;/);
    assert.match(sql, /revoke all on table public\.glossary_start_here_bonus_device from public, anon, authenticated;/);
    assert.match(sql, /grant execute on function public\.get_glossary_definition_start_here\(uuid, text\) to authenticated;/);
    assert.match(sql, /revoke all on function public\.get_glossary_definition_start_here\(uuid, text\) from public, anon;/);
    assert.doesNotMatch(sql, /create or replace function public\.get_glossary_definition\(/, 'the normal RPC is not touched');
  });
});
