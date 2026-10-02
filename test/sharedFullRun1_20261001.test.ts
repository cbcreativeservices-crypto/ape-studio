/**
 * Full-app bug run 1 (2026-10-01), area 10 SHARED — regression receipts.
 *
 * sessionCarry (src/features/lab/sessionCarry.ts) is exercised directly: it is
 * pure apart from the preview store. Each case FAILED against the pre-fix file
 * (R2: the fixed file copied aside, the old one restored, the test run, then
 * the fix restored).
 */
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { registerHooks } from 'node:module';
import { join } from 'node:path';
import { beforeEach, describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier.startsWith('.') && !/\.[cm]?[jt]sx?$/.test(specifier) && context.parentURL) {
      for (const ext of ['.ts', '.tsx', '/index.ts']) {
        const candidate = new URL(specifier + ext, context.parentURL);
        if (existsSync(fileURLToPath(candidate))) return { url: candidate.href, shortCircuit: true };
      }
    }
    return nextResolve(specifier, context);
  },
});

const carry = await import('../src/features/lab/sessionCarry.ts');

const read = (p: string) => readFileSync(join(process.cwd(), p), 'utf8').replace(/\r\n/g, '\n');
const tick = () => new Promise((r) => setTimeout(r, 0));
const settleTicks = async () => {
  for (let i = 0; i < 6; i++) await tick();
};

beforeEach(() => {
  carry.__resetSessionCarryForTests();
});

describe('sessionCarry — timing', () => {
  it('a guest-only unit recorded while the new account’s sign-in wipe is still pending is held (the wipe would delete it)', async () => {
    carry.noteSessionIdentity('');
    await carry.settleSessionCarry();
    carry.noteSessionIdentity('u1'); // the wipe for u1 has not run yet
    const heldIt = carry.holdSessionWork<string[]>('t:guestOnly', (p) => [...(p ?? []), 'w1'], { guestOnly: true });
    assert.equal(heldIt, true);
    const got: string[][] = [];
    carry.registerSessionCarry<string[]>('t:guestOnly', async (h) => {
      got.push([...h]);
      return true;
    });
    await carry.settleSessionCarry(); // after the wipe
    assert.deepEqual(got, [['w1']]);
    // Once the account is settled, guest-only work is no longer held.
    assert.equal(carry.holdSessionWork<string[]>('t:guestOnly', (p) => [...(p ?? []), 'w2'], { guestOnly: true }), false);
  });

  it('a flush asked for while an older account’s write is in flight still runs after that write (no lost hand-off)', async () => {
    let release!: () => void;
    const gate = new Promise<void>((r) => (release = r));
    carry.registerSessionCarry<string[]>('t:slow', async () => {
      await gate;
      return true;
    });
    const got: string[][] = [];
    carry.registerSessionCarry<string[]>('t:next', async (h) => {
      got.push([...h]);
      return true;
    });
    carry.noteSessionIdentity('u1');
    await carry.settleSessionCarry();
    carry.holdSessionWork<string[]>('t:slow', () => ['a']); // u1's write starts and stalls
    await tick();
    // u1 signs out; u2 signs in and (tier still loading) holds work.
    carry.noteSessionIdentity('');
    carry.noteSessionIdentity('u2');
    carry.holdSessionWork<string[]>('t:next', (p) => [...(p ?? []), 'b']);
    const s1 = carry.settleSessionCarry();
    const s2 = carry.settleSessionCarry();
    release();
    await s1;
    await s2;
    await settleTicks();
    assert.deepEqual(got, [['b']], "u2's held work is written once the stalled write ends");
  });

  it('an earlier event’s settle never writes the NEXT account’s work before that account’s wipe', async () => {
    let wiped = false;
    const writes: boolean[] = [];
    carry.registerSessionCarry<string[]>('t:order', async () => {
      writes.push(wiped);
      return true;
    });
    carry.noteSessionIdentity('');
    await carry.settleSessionCarry();
    carry.holdSessionWork<string[]>('t:order', () => ['guest-work']);
    // Two events close together: the first one's settle is still queued
    // (behind its own sync) when the sign-in arrives.
    carry.noteSessionIdentity('');
    carry.noteSessionIdentity('u1');
    await carry.settleSessionCarry(); // the first event's settle
    await settleTicks();
    wiped = true; // u1's wipe runs here, in the queue
    await carry.settleSessionCarry(); // u1's settle
    await settleTicks();
    assert.deepEqual(writes, [true], 'written once, AFTER the wipe');
  });

  it('source: the counters pair each noted event with its own queued settle', () => {
    const s = read('src/features/lab/sessionCarry.ts');
    assert.match(s, /export function noteSessionIdentity\(identity: string\): void \{\n  noted\+\+;/);
    assert.match(s, /settled\+\+;[\s\S]{0,700}if \(settled < noted\) return;\n  syncPending = false;/);
  });
});

// ── ParamLane: a second finger never moves the held fader ───────────────────

const lane = await import('../src/screens/lab/rack/laneFinger.ts');

describe('ParamLane follows the finger that grabbed it', () => {
  it('react-native: dx is the centroid of every moved touch (the premise of the bug)', () => {
    const pr = read('node_modules/react-native/Libraries/Interaction/PanResponder.js');
    assert.match(pr, /const x = currentCentroidXOfTouchesChangedAfter\(touchHistory, movedAfter\);/);
    assert.match(pr, /const nextDX = gestureState\.dx \+ \(x - prevX\);/);
  });
  it('a second finger moving elsewhere does not move the lane; the grabbing finger does', () => {
    const f = lane.laneFingerAt({ identifier: 1, pageX: 100 });
    // Finger 1 still at 100, finger 2 dragged 80 px: the centroid says 40.
    assert.equal(lane.laneFingerDx({ touches: [{ identifier: 1, pageX: 100 }, { identifier: 2, pageX: 380 }] }, f, 40), 0);
    assert.equal(lane.laneFingerDx({ touches: [{ identifier: 2, pageX: 380 }, { identifier: 1, pageX: 130 }] }, f, 999), 30);
  });
  it('the grabbing finger lifted while another remains → the lane holds still', () => {
    const f = lane.laneFingerAt({ identifier: 1, pageX: 100 });
    assert.equal(lane.laneFingerDx({ touches: [{ identifier: 2, pageX: 300 }] }, f, 200), 'lifted');
  });
  it('no touch list or no identifier (web mouse edge) → the centroid dx', () => {
    assert.equal(lane.laneFingerDx({}, lane.laneFingerAt({ identifier: 0, pageX: 5 }), 12), 12);
    assert.equal(lane.laneFingerDx({ touches: [{ pageX: 1 }] }, lane.laneFingerAt({ pageX: 5 }), 7), 7);
    // identifier 0 (react-native-web's mouse touch) is a real identifier.
    assert.equal(lane.laneFingerDx({ touches: [{ identifier: 0, pageX: 25 }] }, lane.laneFingerAt({ identifier: 0, pageX: 5 }), 99), 20);
  });
  it('source: ParamLane records the grabbing finger and moves by ITS travel, not g.dx', () => {
    const s = read('src/screens/lab/rack/ParamLane.tsx');
    assert.match(s, /fingerRef\.current = laneFingerAt\(e\.nativeEvent\);/);
    assert.match(s, /const dx = laneFingerDx\(e\.nativeEvent, fingerRef\.current, g\.dx\);\n\s*if \(dx === 'lifted'\) return;/);
    assert.doesNotMatch(s, /baseRef\.current \+ g\.dx/);
  });
});
