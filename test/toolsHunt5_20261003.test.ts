/**
 * Toddler hunt 5 (2026-10-03) — TOOLS + AUDIO area.
 *
 *  1. (Correction to hunt 4's useToolsLocked change.) useToolsLocked is now
 *     `known && !isMember` — false while the tier is unknown, which is right
 *     for LOCK COPY (a member whose read failed never sees a 🔒) but four
 *     members-only DESTINATIONS gated their CONTENT on it: ToolLearn,
 *     ToolDemo, ConceptModule and the Saved Measurements library. A free
 *     account whose membership read failed (offline, no remembered tier) got
 *     every tutorial, demo, concept module and the library — against the tier
 *     sweep's "nothing unlocks on a failed read". Now each shows its content
 *     only for useMemberGate() === 'open'; 'locked' keeps the 🔒; 'checking'
 *     is blank; 'unconfirmed' says so (ToolGatePending).
 *  2. Same root, Frequency Counter: the Academy-only Light Pulse mode opened
 *     for anyone whose read failed (`locked = m.key === 'light' && !isMember`
 *     with isMember = !useToolsLocked()). It has no destination screen to gate
 *     it, so the pick itself waits for 'open'.
 *
 * R2: both fail against HEAD 29b2ed4c (source pins — RN screens cannot load
 * under node); the pure gate table is checked against memberGateOf.
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { memberGateOf, tierOf } from '../src/features/commercial/tier.ts';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (p: string) => readFileSync(path.join(ROOT, p), 'utf8').replace(/\r\n/g, '\n');

test('0. the gate a failed read produces is never "open" for a non-member', () => {
  // A signed-in free account, read failed, no remembered tier: the provider
  // shows 'anonymous', resolved, tierKnown false, tierReadFailed true.
  assert.equal(memberGateOf(tierOf('anonymous', true), false, true), 'unconfirmed');
  assert.equal(memberGateOf(tierOf('anonymous', true), false, false), 'checking');
  assert.equal(memberGateOf(tierOf('anonymous', false), false, false), 'checking');
  assert.equal(memberGateOf(tierOf('free', true), false, true), 'locked');
  assert.equal(memberGateOf(tierOf('academy', true), false, true), 'open');
});

for (const f of [
  'src/screens/tools/ToolLearnScreen.tsx',
  'src/screens/tools/ToolDemoScreen.tsx',
  'src/screens/tools/ConceptModuleScreen.tsx',
]) {
  test(`1. ${path.basename(f)}: members-only content only for gate 'open'`, () => {
    const s = read(f);
    assert.doesNotMatch(s, /useToolsLocked\(\)/, 'lock copy is not a content gate');
    assert.match(s, /const gate = useMemberGate\(\);\s*const locked = gate === 'locked';/);
    assert.match(s, /\) : gate !== 'open' \? \(\s*<ToolGatePending gate=\{gate\} \/>/);
  });
}

test('1. MeasurementLibraryScreen: records only for gate open', () => {
  const s = read('src/screens/tools/MeasurementLibraryScreen.tsx');
  assert.doesNotMatch(s, /useToolsLocked\(\)/);
  assert.match(s, /const gate = useMemberGate\(\);\s*const locked = gate === 'locked';/);
  const lockedAt = s.indexOf('  if (locked) {');
  const pendingAt = s.indexOf("  if (gate !== 'open') {");
  assert.ok(lockedAt > 0 && pendingAt > lockedAt, 'the pending return follows the locked return');
  assert.match(s.slice(pendingAt, pendingAt + 900), /<ToolGatePending gate=\{gate\} \/>/);
  assert.ok(pendingAt < s.indexOf('<FlatList'), 'before any record renders');
});

test('1. ToolGatePending: blank while checking, honest once the check gave up', () => {
  const s = read('src/screens/tools/ToolLockUi.tsx');
  const c = s.slice(s.indexOf('export function ToolGatePending'), s.indexOf('/** One-line'));
  assert.match(c, /if \(gate === 'checking'\) return null;/);
  assert.match(c, /\{MEMBERSHIP_NOT_CONFIRMED\}/);
  assert.doesNotMatch(c, /🔒|Paywall|UPGRADE/, 'no lock, no sell on a failed read');
});

test('2. Frequency Counter: Light Pulse opens only for a confirmed member', () => {
  const s = read('src/screens/tools/FrequencyCounterScreen.tsx');
  assert.match(s, /onPick=\{pickMode\}/);
  assert.doesNotMatch(s, /onPick=\{setMode\}/);
  assert.match(
    s,
    /const pickMode = \(m: Mode\) => \{\s*if \(m === 'light' && memberGate !== 'open' && memberGate !== 'locked'\) \{\s*if \(memberGate === 'unconfirmed'\) notify\('Membership not confirmed', MEMBERSHIP_NOT_CONFIRMED\);\s*return;\s*\}\s*setMode\(m\);/,
  );
});
