/**
 * Audit Round 2, Round A — ccode's cleanup of partner lines the group agents
 * flagged outside their own files (2026-10-23).
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it } from 'node:test';

const read = (p: string) => readFileSync(join(import.meta.dirname, '..', 'src', p), 'utf8').replace(/\r\n/g, '\n');

describe('audit R2 Round A cleanup', () => {
  it('a live recording does not count as the livestream service (R060162)', () => {
    const logic = read('features/production/preprod/logic.ts');
    assert.match(logic, /if \(services\.includes\('livestream_feed'\)\) return false;/);
    assert.doesNotMatch(logic, /services\.includes\('live_recording'\)\) return false/);
    assert.match(read('features/production/preprod/stage1.data.ts'), /does not include livestream_feed \(a live recording is not a stream\)/);
  });
  it('bell-like cone modes are called circumferential on screen (R049542)', () => {
    assert.match(read('features/cymatics/membrane.ts'), /CIRCUMFERENTIAL MODES — BELL-LIKE CONE MODES/);
    assert.doesNotMatch(read('features/lab/guidedLessons/content.ts'), /bell-like radial modes/);
  });
});
