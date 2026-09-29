/** suggestPassword — the CREATE ACCOUNT passphrase (owner 2026-09-29). */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { suggestPassword } from '../src/features/auth/suggestPassword.ts';
import { passwordIssue } from '../src/features/auth/authErrorCopy.ts';

test('suggestions always pass our own password rules and look like Word-Word-Word-NN', () => {
  for (let i = 0; i < 500; i++) {
    const pw = suggestPassword((n) => Math.floor(Math.random() * n));
    assert.equal(passwordIssue(pw), null, pw);
    assert.match(pw, /^[A-Z][a-z]+-[A-Z][a-z]+-[A-Z][a-z]+-\d{2}$/);
    const words = pw.split('-').slice(0, 3);
    assert.equal(new Set(words).size, 3, 'no repeated word');
  }
});
