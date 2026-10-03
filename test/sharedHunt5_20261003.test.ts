/**
 * SHARED area, hunt 5 (2026-10-03) — receipts.
 *
 * 1. withMembershipPreview's GateUnconfirmed (tier sweep 1e9f0f9d) replaces
 *    the GateHold IN PLACE when the provider gives up. Its text relied on
 *    `accessibilityLiveRegion`, which is Android-only — the exact gap W16
 *    (2026-09-18) closed for the hold with an iOS announceForAccessibility.
 *    A VoiceOver user who last heard "Still checking your membership" was
 *    never told the check had given up.
 *
 * R2: fails on HEAD 29b2ed4c (the HEAD file put in place, run, restored).
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it } from 'node:test';

const read = (p: string) => readFileSync(join(process.cwd(), p), 'utf8').replace(/\r\n/g, '\n');

/** The body of a top-level `function name(` up to the next top-level declaration. */
function fnBody(src: string, name: string): string {
  const start = src.indexOf(`function ${name}(`);
  assert.ok(start >= 0, `${name} not found`);
  const rest = src.slice(start);
  const end = rest.search(/\n(?:const|function|export) /);
  return end > 0 ? rest.slice(0, end) : rest;
}

describe('withMembershipPreview — GateUnconfirmed speaks on iOS', () => {
  const s = read('src/features/lab/withMembershipPreview.tsx');
  const body = fnBody(s, 'GateUnconfirmed');

  it('announces MEMBERSHIP_NOT_CONFIRMED to VoiceOver, iOS only, once', () => {
    assert.match(body, /announceForAccessibility\(\s*MEMBERSHIP_NOT_CONFIRMED\s*\)/);
    assert.match(body, /Platform\.OS\s*!==\s*'ios'/);
    assert.match(body, /useEffect\(\(\) => \{[\s\S]*?\}, \[\]\)/);
  });

  it('still never mounts the lab and still leaves through safeGoBack', () => {
    assert.match(s, /gate === 'unconfirmed'\) return <GateUnconfirmed onBack=\{focused \? goBack : undefined\} \/>/);
    assert.match(s, /safeGoBack\(navigation\)/);
    assert.doesNotMatch(s, /navigation\.goBack\(\)/);
  });
});
