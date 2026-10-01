/**
 * Module hosts free a stuck drag scroll-lock on every module / end-screen
 * change (night bug pass 1, 2026-10-01): a drag's own release never arrives
 * when its module unmounts mid-drag (a second finger on NEXT / FINISH), and
 * the next classic reading page then could not scroll.
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it } from 'node:test';

const HOSTS = [
  'src/screens/lab/eq/EqModuleScreen.tsx',
  'src/screens/lab/gain/GainModuleScreen.tsx',
  'src/screens/lab/meter/MeterModuleScreen.tsx',
  'src/screens/lab/digital/DigitalModuleScreen.tsx',
  'src/screens/lab/cymatics/CymaticsModuleScreen.tsx',
  'src/screens/lab/wave/WaveModuleScreen.tsx',
];

describe('module hosts reset the scroll lock', () => {
  for (const f of HOSTS) {
    it(f, () => {
      const s = readFileSync(join(process.cwd(), f), 'utf8');
      assert.match(s, /useEffect\(\(\) => setScrollLocked\(false\), \[meta\.id, ending\]\);/);
    });
  }
});
