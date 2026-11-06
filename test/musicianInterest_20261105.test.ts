/**
 * Owner 2026-11-05: Profile needs a choice for artists and musicians, and it
 * carries into the Audio Community as the server's "Creating or performing"
 * role when a listing moves across.
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { LEGACY_INTEREST_MAP, mapLegacyInterests } from '../src/features/directory/rules.ts';

const profile = readFileSync(new URL('../src/features/profile/publicProfile.ts', import.meta.url), 'utf8').replace(/\r\n/g, '\n');

test('Musician / Artist is a Profile choice', () => {
  assert.match(profile, /'Music Production',\n  'Musician \/ Artist',/);
});

test('it becomes the community role, never a work area', () => {
  assert.deepEqual(LEGACY_INTEREST_MAP['Musician / Artist'], { role: 'creating-performing' });
  const r = mapLegacyInterests(['Musician / Artist']);
  assert.deepEqual(r.roles, ['creating-performing']);
  assert.deepEqual(r.areas, []);
  assert.deepEqual(r.dropped, []);
});
