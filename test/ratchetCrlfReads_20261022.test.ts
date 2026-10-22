/**
 * Ratchet (2026-10-22): a test that reads source text must normalise line
 * endings. Windows checkouts are CRLF (core.autocrlf), so a regex on '\n'
 * passes in the cloud and fails here — 23 tests did on 2026-10-21.
 * Older files that pass without it are listed in _crlfReadAllow.ts; that list
 * may only shrink.
 */
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it } from 'node:test';
import { CRLF_READ_ALLOW } from './_crlfReadAllow.ts';

const DIR = import.meta.dirname;
// This file names the patterns it scans for, so it skips itself.
const files = readdirSync(DIR).filter((f) => f.endsWith('.test.ts') && f !== 'ratchetCrlfReads_20261022.test.ts');
const readsTextRaw = (src: string) =>
  src.includes('readFileSync') && /'utf-?8'|"utf-?8"/.test(src) && !src.includes('\\r\\n') && !src.includes('\\r?\\n');

describe('tests that read source normalise CRLF', () => {
  it('no new test reads text without CRLF handling', () => {
    const offenders = files.filter((f) => !CRLF_READ_ALLOW.includes(f) && readsTextRaw(readFileSync(join(DIR, f), 'utf8')));
    assert.deepEqual(offenders, [], "add .replace(/\\r\\n/g, '\\n') to the file's readFileSync");
  });
  it('the allowlist only lists files that still need it (shrink as they are fixed)', () => {
    const stale = CRLF_READ_ALLOW.filter((f) => !files.includes(f) || !readsTextRaw(readFileSync(join(DIR, f), 'utf8')));
    assert.deepEqual(stale, [], 'remove these from _crlfReadAllow.ts');
  });
});
