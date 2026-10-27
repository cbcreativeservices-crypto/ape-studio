/**
 * Must-do R7 (2026-10-27): the certificate name is saved through the live
 * `set_registry_name(p_name)` RPC — the server's community-rules filter — never
 * by writing users.registry_name directly. A refusal is shown under the
 * "Name on your certificates" field; a plain failure (offline) is not.
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';

const read = (p: string) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8').replace(/\r\n/g, '\n');
const code = (p: string) => read(p).replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');

describe('R7 · certificate name goes through set_registry_name', () => {
  const api = code('src/features/profile/api.ts');
  const fn = api.slice(api.indexOf('export async function saveMyRegistryName'));
  const body = fn.slice(0, fn.indexOf('\n}\n'));

  it('calls the RPC with p_name and no direct users write', () => {
    assert.match(body, /supabase\.rpc\('set_registry_name', \{ p_name: name\.trim\(\) \}\)/);
    assert.doesNotMatch(body, /from\('users'\)/);
    assert.doesNotMatch(api, /update\(\{ registry_name/);
  });

  it('saved only when the server returns the stored name; community_rules = refused', () => {
    assert.match(body, /typeof data === 'string' && data \? \{ ok: true, name: data \}/);
    assert.match(body, /refused: \(error\.message \?\? ''\)\.toLowerCase\(\)\.includes\('community_rules'\)/);
  });

  it('the sync tells listeners about a refusal, and only a refusal or a save', () => {
    const pp = code('src/features/profile/publicProfile.ts');
    assert.match(pp, /if \(r\.ok\) lastSyncedRegistryName = r\.name;/);
    assert.match(pp, /if \(r\.ok \|\| r\.refused\) nameRefusedListeners\.forEach\(\(cb\) => cb\(!r\.ok\)\);/);
  });

  it('Profile shows the refusal under the field and clears it on edit', () => {
    const s = code('src/screens/profile/ProfileScreen.tsx');
    assert.match(s, /useEffect\(\(\) => onRegistryNameRefused\(setNameRefused\), \[\]\);/);
    assert.match(s, /\{nameRefused \? \(\s*<Text style=\{styles\.fieldError\}>\{REGISTRY_NAME_REFUSED\}<\/Text>/);
    assert.match(s, /setNameRefused\(false\);\s*setPubKey\('registryName', t\);/);
  });

  it('the server function is no longer on the server-only allowlist', () => {
    const al = JSON.parse(read('docs/live/SERVER_ONLY_ALLOWLIST.json'));
    assert.equal(al.allow.set_registry_name, undefined);
  });
});
