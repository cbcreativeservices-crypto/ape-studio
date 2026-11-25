/**
 * The location pop-up's wording (owner-approved 2026-11-23, word for word;
 * Comp A brief 2026-11-24, launch must-do E4). The app shows this pop-up
 * before it ever asks the phone for location, and iPhone and Android read the
 * same text. The last sentence is the owner's addition: "We never receive or
 * store your location on our end."
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it } from 'node:test';

const SRC = readFileSync(join(process.cwd(), 'src', 'features', 'permissions', 'PermissionPrompt.tsx'), 'utf8').replace(/\r\n/g, '\n');

/** The `location` entry of COPY, with its string pieces joined. */
function locationCopy(): { title: string; body: string; allowLabel: string } {
  const block = /\n  location: \{([\s\S]*?)\n  \},/.exec(SRC);
  assert.ok(block, 'COPY.location not found');
  const field = (name: string): string => {
    const m = new RegExp(`${name}:\\s*((?:'(?:[^'\\\\]|\\\\.)*'\\s*\\+?\\s*)+),`).exec(block[1]);
    assert.ok(m, `COPY.location.${name} not found`);
    return [...m[1].matchAll(/'((?:[^'\\]|\\.)*)'/g)].map((p) => p[1]).join('');
  };
  return { title: field('title'), body: field('body'), allowLabel: field('allowLabel') };
}

describe('location pop-up wording (owner 2026-11-23)', () => {
  it('the body is the approved text, word for word', () => {
    assert.equal(
      locationCopy().body,
      'A measurement snapshot can record where you took it (GPS), which is handy for venue and field documentation. ' +
        'It is optional, stored only in your device’s measurement library, and never shared automatically. ' +
        'We never receive or store your location on our end.',
    );
  });
  it('the title and the button stay as they were', () => {
    assert.equal(locationCopy().title, 'Tag this snapshot with your location?');
    assert.equal(locationCopy().allowLabel, 'ALLOW LOCATION');
  });
  it('one text for both phones: no per-platform branch in the copy', () => {
    const block = /const COPY[\s\S]*?\n\};/.exec(SRC);
    assert.ok(block);
    assert.doesNotMatch(block[0], /Platform\./);
  });
});
