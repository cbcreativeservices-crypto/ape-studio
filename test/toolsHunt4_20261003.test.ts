/**
 * Toddler hunt 4 (2026-10-03) — TOOLS + AUDIO area.
 *
 *  1. useToolsLocked locked on `resolved && !isMember`. `resolved` also flips
 *     when the membership read FAILED, and a member with no remembered tier
 *     then reads 'anonymous': the Saved Measurements library, LEARN, DEMO,
 *     the concept modules and Light Pulse showed "🔒 Academy membership
 *     required · SEE MEMBERSHIP" to a paying member — against the provider's
 *     contract for a failed read ("never an upsell, never a 🔒") and unlike
 *     useSaveGate, which already waits for a KNOWN tier. Now the lock needs
 *     the same `known` as the SAVE gate.
 *
 * R2: fails against the pre-fix ToolLockUi (source pin — an RN hook cannot
 * load under node).
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (p: string) => readFileSync(path.join(ROOT, p), 'utf8').replace(/\r\n/g, '\n');

test('1. the tools lock waits for a KNOWN tier, like the SAVE gate', () => {
  const s = read('src/screens/tools/ToolLockUi.tsx');
  const hook = s.slice(s.indexOf('export function useToolsLocked()'), s.indexOf('export function useSaveGate()'));
  assert.ok(hook.length > 0);
  assert.doesNotMatch(hook, /return resolved && !isMember;/, 'resolved also means "the read failed"');
  assert.match(hook, /const tier = tierOf\(entitlement, resolved\);\s*const known = tierKnown \|\| tier === 'free' \|\| tier === 'member';\s*return known && !isMember;/);
  // The SAVE gate uses the identical definition — one meaning of "known".
  const gate = s.slice(s.indexOf('export function useSaveGate()'));
  assert.match(gate, /const known = tierKnown \|\| tier === 'free' \|\| tier === 'member';/);
});
