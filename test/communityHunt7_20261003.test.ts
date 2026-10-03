/**
 * GUARDS — community / careers / awards, HUNT 7 (2026-10-03).
 *
 *  H1  AwardProgressScreen turned a STALLED session read into "signed out".
 *      When the award read comes back null it asks the session who the user
 *      is, through `safeSession` — which resolves a stall (or a rejected read)
 *      as "no session". A signed-in member on a slow keychain / bad moment was
 *      then told "Sign in with a free account …" with a CREATE A FREE ACCOUNT
 *      button, and a focus reload (back from the Final Exam) DROPPED a loaded
 *      checklist or EARNED box, because the "keep what is on screen" rule only
 *      applies when not signed out. Final round D's rule (safeSessionResult,
 *      used by accessCode and tubeRefs): an unknown identity is never "signed
 *      out" — it takes the connection path (keep / Try again).
 */
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const read = (p: string) => readFileSync(join(process.cwd(), p), 'utf8').replace(/\r\n/g, '\n');
const blank = (s: string) => s.replace(/[^\n]/g, ' ');
const code = (p: string) =>
  read(p)
    .replace(/\/\*[\s\S]*?\*\//g, blank)
    .replace(/(^|[^:])\/\/[^\n]*/g, (m, pre) => pre + ' '.repeat(m.length - pre.length));

describe('hunt 7 — community / careers / awards', () => {
  test('H1 AwardProgress: a stalled session read is not "signed out"', () => {
    const v = code('src/screens/awards/AwardProgressScreen.tsx');
    const ls = v.indexOf('const load = useCallback');
    const le = v.indexOf('}, [awardType, awardId]);', ls);
    assert.ok(ls >= 0 && le > ls, 'load found');
    const load = v.slice(ls, le);
    assert.doesNotMatch(load, /\bsafeSession\(/, 'the lenient safeSession (stall = no session) is not used to decide "signed out"');
    const m = load.match(/const \{ result: (\w+), timedOut \} = await safeSessionResult\(supabase\.auth\.getSession\(\), 'awards\/progress'\);/);
    assert.ok(m, 'the session read says whether it came back');
    const so = load.match(/const signedOut = ([^;]+);/);
    assert.ok(so, 'signedOut found');
    assert.match(so![1], /!timedOut\s*&&/, 'signedOut requires a session read that actually answered');
    assert.match(so![1], new RegExp(`isRealAccount\\(${m![1]}\\.data\\?\\.session\\)`), 'and then no real account in it');
  });
});
