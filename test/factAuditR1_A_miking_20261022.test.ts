/**
 * Fact-audit fix pass, Round 1, group A_miking (2026-10-22): Computer B's
 * fact-check return, S1 items in the miking labs. Each fix is pinned so the
 * wrong claim cannot come back. F069258 (the double bass's string sides) was
 * REJECTED: the lab already has the E string on the bow-arm side (the
 * bassist's right) and the G string on the left; the guard below keeps the
 * words and the drawing agreeing so the proposed swap is not applied later.
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it } from 'node:test';
import { FHOLE } from '../src/screens/lab/miking/lessons/shared/bowed/bass.ts';

const ROOT = join(import.meta.dirname, '..');
// CRLF normalised, then whitespace collapsed.
const read = (rel: string) =>
  readFileSync(join(ROOT, rel), 'utf8').replace(/\r\n/g, '\n').replace(/\s+/g, ' ');

const FIELD = read('src/screens/lab/miking/lessons/b13FieldDiamond/lesson.ts');
const DUETS = read('src/screens/lab/miking/lessons/e04Duets/lesson.ts');
const BASS_WORDS = read('src/screens/lab/miking/lessons/shared/bowed/bassWords.ts');

describe('fact audit R1 A_miking (2026-10-22)', () => {
  it('F027576: a lowered shotgun with the old tilt aims UNDER the source, never over it', () => {
    assert.ok(FIELD.includes('Lower, the old aim now passes under the source, or hits the ground short of it.'));
    assert.ok(!FIELD.includes('the old aim points over or past the source'));
  });

  it('F039144: the duet prediction names the side rejection, so an omni no longer fits', () => {
    assert.ok(DUETS.includes('which pattern hears its front and back equally but rejects its sides?'));
    assert.ok(!DUETS.includes('which pattern hears its front and back equally?'));
  });

  it('F069258 (rejected): the bass words put G on the bassist’s left, matching the drawn treble f-hole', () => {
    // Lesson frame: +z is toward the player's right; the treble (G) f-hole is drawn at -z.
    assert.ok(FHOLE.z < 0);
    assert.ok(BASS_WORDS.includes('Toward the bassist’s left (the G side) or right (the E side) (z).'));
  });
});
