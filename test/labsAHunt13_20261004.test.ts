/**
 * Labs A — hunt 13 (2026-10-04). Receipts.
 *
 * 1. LEFTOVER (lead, owner guest-carry ruling 2026-10-01): the Production labs'
 *    projects are written for everyone, but a guest's FIRST sign-in wipes the
 *    device's `ape:*` keys — every pre/post-production project a guest built
 *    in this app session was gone the moment they signed in. Now held by the
 *    shared ledger (guestOnly) and merged back after the wipe (by id, the
 *    newer updatedAt wins, never over an unreadable list).
 * 2. LEFTOVER (lead, with SHARED): in full screen the Harmonics THD bezel
 *    cell opened its breakdown Modal OVER the full-screen Modal, and the Tube
 *    lab's TUBE REF key navigated UNDER it. Both now opt in to `leavesFull`.
 *
 * R2: run against the HEAD files and failed.
 */
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { registerHooks } from 'node:module';
import { describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier.startsWith('.') && !/\.[cm]?[jt]s$/.test(specifier)) {
      const candidate = new URL(specifier + '.ts', context.parentURL);
      if (existsSync(fileURLToPath(candidate))) return { url: candidate.href, shortCircuit: true };
    }
    return nextResolve(specifier, context);
  },
});

const read = (p: string) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8').replace(/\r\n/g, '\n');
const code = (s: string) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:'"`])\/\/.*$/gm, '$1');

describe('Production: a guest session\'s projects are carried into the account signed into', () => {
  it('a guest write is held, survives the wipe through carryIn, and a removal is let go of', async () => {
    const carry = await import('../src/features/lab/sessionCarry.ts');
    const store = (await import('../src/features/production/projectStore.ts')) as typeof import('../src/features/production/projectStore.ts') & {
      carryIn?: unknown;
    };
    carry.__resetSessionCarryForTests();
    carry.noteSessionIdentity(''); // a guest launch
    const guestDevice = store.createProjectStore(store.memoryStore());
    const a = store.newProject('preprod', 'live_event' as never, 'Guest plan');
    const b = store.newProject('postprod', 'dialogue_repair' as never, 'Guest repair');
    assert.equal(await guestDevice.upsert(a), true);
    assert.equal(await guestDevice.upsert(b), true);
    const typed = await guestDevice.setValue('preprod', a.id, 's1', 'f1', 'answer');
    assert.ok(typed);
    const held = carry.peekSessionWork<Record<string, { id: string; values: Record<string, unknown> }[]>>('production:projects');
    assert.ok(held, 'the guest work is held by the ledger');
    assert.deepEqual(held!.preprod.map((p) => p.id), [a.id]);
    assert.equal(Object.values(held!.preprod[0].values)[0], 'answer', 'the newest copy (with the typed answer) is held');
    assert.deepEqual(held!.postprod.map((p) => p.id), [b.id]);

    // The sign-in wipe leaves an empty device; the writer fills it back in.
    const wiped = store.createProjectStore(store.memoryStore());
    assert.equal(await (wiped as unknown as { carryIn(h: unknown): Promise<boolean> }).carryIn(held), true);
    const pre = await wiped.load('preprod');
    assert.deepEqual(pre.map((p) => p.id), [a.id]);
    assert.equal(Object.values(pre[0].values)[0], 'answer');
    assert.deepEqual((await wiped.load('postprod')).map((p) => p.id), [b.id]);

    // A project deleted again in the session is let go of.
    assert.equal(await guestDevice.remove('postprod', b.id), true);
    const after = carry.peekSessionWork<Record<string, unknown[]>>('production:projects');
    assert.equal(after!.postprod.length, 0);

    // An account's own writes are not held (guestOnly).
    carry.__resetSessionCarryForTests();
    carry.noteSessionIdentity('uid-1');
    await carry.settleSessionCarry();
    assert.equal(await guestDevice.upsert(store.newProject('preprod', 'live_event' as never, 'Member plan')), true);
    assert.equal(carry.peekSessionWork('production:projects'), undefined);
  });

  it('merge: by id the newer updatedAt wins; never over an unreadable list', async () => {
    const store = await import('../src/features/production/projectStore.ts');
    const merge = (store as unknown as { mergeHeldProjects: (s: unknown[], h: unknown[]) => { id: string; name: string }[] }).mergeHeldProjects;
    assert.equal(typeof merge, 'function');
    const old = { ...store.newProject('preprod', 'x' as never, 'old'), id: 'p1', updatedAt: 10 };
    const newer = { ...old, name: 'newer', updatedAt: 20 };
    assert.equal(merge([newer], [old])[0].name, 'newer', 'an older held copy never overwrites');
    assert.equal(merge([old], [newer])[0].name, 'newer');
    const kv = store.memoryStore();
    const broken = { ...kv, getItem: async () => { throw new Error('read failed'); } };
    const s = store.createProjectStore(broken) as unknown as { carryIn(h: unknown): Promise<boolean> };
    assert.equal(await s.carryIn({ preprod: [old] }), false, 'an unreadable list is refused, not overwritten');
  });

  it('the writer is registered with the ledger at module load', () => {
    const s = code(read('src/features/production/projectStore.ts'));
    assert.match(s, /registerSessionCarry<HeldProjects>\(CARRY_KEY, \(held\) => projectStore\(\)\.carryIn\(held\)\);/);
    assert.match(s, /holdSessionWork<HeldProjects>\(CARRY_KEY, [^;]*\{ guestOnly: true \}\);/);
  });
});

describe('Rack full screen: cells that open something outside the rack leave full screen first', () => {
  it('Harmonics THD bezel cell opts in to leavesFull', () => {
    const s = code(read('src/screens/lab/HarmonicsView.tsx'));
    assert.match(s, /onPress: \(\) => setThdOpen\(true\),\s*leavesFull: true,/);
  });
  it('Tube lab TUBE REF dock key opts in to leavesFull', () => {
    const s = code(read('src/screens/lab/tube/VacuumTubeLabScreen.tsx'));
    assert.match(s, /\{ kind: 'action', id: 'tuberef', label: 'TUBE REF ›', onPress: p\.openReference, leavesFull: true \}/);
  });
});
