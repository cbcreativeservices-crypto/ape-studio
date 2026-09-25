/**
 * The glossary weekly meter counts per DEVICE as well as per identity
 * (owner 2026-09-25: "I exceeded the weekly glossary limit and it locked —
 * good. But then I logged in on a free guest account and it was completely
 * unlocked fresh again").
 *
 * Three things have to stay true together, and each can silently drift:
 *   1. the migration keeps a device row and makes BOTH rows gate a lookup;
 *   2. every metered client call sends the per-install id (the live path is
 *      the gateway RPC, not the fallback meter — miss one and the hole is back);
 *   3. the per-install id survives the account wipe (it is on the KEEP list).
 * Read as text, no RN import, no network — the same idiom as
 * cableInstallArt.test.ts.
 */
import { strict as assert } from 'node:assert';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const read = (p: string) => readFileSync(resolve(ROOT, p), 'utf8');

describe('glossary meter per device', () => {
  const sql = read('supabase/migrations/2026092502_glossary_meter_per_device.sql');

  it('the migration keeps a device row and both functions take the device id', () => {
    assert.match(sql, /create table if not exists public\.glossary_usage_device/);
    assert.match(sql, /function public\.glossary_consume\(p_device_id text default null\)/);
    assert.match(sql, /function public\.glossary_usage_status\(p_device_id text default null\)/);
    assert.match(sql, /function public\.get_glossary_definition\(p_id uuid, p_device_id text default null\)/);
    // The gateway passes the id through to the counter.
    assert.match(sql, /from public\.glossary_consume\(p_device_id\)/);
  });

  it('a lookup is blocked when EITHER row is at the cap', () => {
    assert.match(sql, /if u\.used >= v_limit or \(v_dev is not null and d\.used >= v_limit\) then/);
  });

  it('the old zero-argument overloads are dropped so PostgREST has one candidate', () => {
    assert.match(sql, /drop function if exists public\.glossary_consume\(\);/);
    assert.match(sql, /drop function if exists public\.glossary_usage_status\(\);/);
    assert.match(sql, /drop function if exists public\.get_glossary_definition\(uuid\);/);
    assert.match(sql, /grant execute on function public\.get_glossary_definition\(uuid, text\) to authenticated/);
  });

  it('every metered client call sends the per-install device id', () => {
    const cap = read('src/features/glossary/glossaryCap.ts');
    const gateway = read('src/features/glossary/glossaryGateway.ts');
    assert.match(cap, /getDeviceId/);
    assert.match(cap, /rpc\('glossary_consume', await deviceArg\(\)\)/);
    assert.match(cap, /rpc\('glossary_usage_status', await deviceArg\(\)\)/);
    assert.match(gateway, /getDeviceId/);
    assert.match(gateway, /rpc\('get_glossary_definition', \{ p_id: id, p_device_id \}\)/);
  });

  it('the per-install id survives the account wipe', () => {
    const wipe = read('src/features/account/clearLocalAccountData.ts');
    const identity = read('src/features/account/deviceIdentity.ts');
    assert.match(identity, /DEVICE_ID_KEY = 'ape:deviceId'/);
    assert.match(wipe, /'ape:deviceId',/);
  });
});
