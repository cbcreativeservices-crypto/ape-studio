/**
 * DJ Systems Lab — Screen 6 printed-legend hookup (optional polish,
 * 2026-10-19). The art modules load Skia, so these checks read the sources
 * (as the other DJ ratchets do): Screen 6's mixer legends are zoom-aware
 * label obstacles, the same way as Screens 2 and 7.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = join(import.meta.dirname, '..', 'src', 'screens', 'lab', 'dj');
const p06 = readFileSync(join(root, 'pages', 'p06Gain.tsx'), 'utf8');
const stage = readFileSync(join(root, 'art', 'BoothStage.tsx'), 'utf8');

describe('Screen 6: the printed legends keep the callouts off them', () => {
  it('BoothStage offers the mixer legends in booth mm and hands them to the Scene', () => {
    assert.match(stage, /export const BOOTH_MIXER_LEGENDS[^\n]*mixerLegendBoxes\(\)\.map\(\(b\) => \(\{ \.\.\.b, x: b\.x \+ BOOTH_LAYOUT\.mixer\.x, y: b\.y \+ BOOTH_LAYOUT\.mixer\.y \}\)\)/);
    assert.match(stage, /printed\?: readonly \(Box & \{ size: number \}\)\[\];/, 'an optional spec field: other screens are unchanged');
    assert.match(stage, /spec\.printed\?\.filter\(\(b\) => intersects\(b, view\)\)/, 'only the legends in view');
    assert.match(stage, /printed=\{printed\}/);
  });
  it('Screen 6 passes them', () => {
    assert.match(p06, /printed: BOOTH_MIXER_LEGENDS,/);
  });
});
