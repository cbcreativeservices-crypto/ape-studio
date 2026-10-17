/**
 * Owner 2026-10-16: "make sure the magenta tracer particles change their
 * length if the particles change their travel length." The ↔ bracket under
 * each tracer must be computed from the SAME amplitude the tracer moves by, so
 * a louder/softer sound (bigger/smaller swing) re-draws the bracket to match.
 */
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

const SRC = readFileSync('src/screens/lab/foundations/viz.tsx', 'utf8');

describe('tracer bracket follows the real swing', () => {
  it('the swing width is the peak of the motion law, per mode', () => {
    assert.match(SRC, /if \(mode === 'wave'\) return amp \* dispMax \* Math\.sin\(/);
    assert.match(SRC, /function airSwing\(mode: AirMode, amp: number, dispMax: number\): number \{\s*if \(mode === 'wave'\) return amp \* dispMax;/);
    assert.match(SRC, /return amp \* dispMax \* 0\.9 \* \(hash\(/);
    assert.match(SRC, /if \(mode === 'noise'\) return 0\.9 \* amp \* dispMax;/);
  });
  it('the bracket is rebuilt whenever the swing changes, from the same amp the dots use', () => {
    assert.match(SRC, /const swing = airSwing\(mode, amp, dispMax\);\s*const marks = useMemo\(\(\) => tracerMarks\(tracers, swing, ts\), \[tracers, swing, ts\]\);/);
    assert.match(SRC, /trX\[j\] \+ airDx\(mode, amp, dispMax, om, k, t, trX\[j\]/);
    assert.match(SRC, /tracerMarks\(tracers, airSwing\('wave', amp, disp\), 1\), \[tracers, amp, disp\]\)/);
  });
});
