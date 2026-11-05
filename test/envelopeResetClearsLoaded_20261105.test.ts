// Envelope Explorer RESET returns the sliders to the starting shape, so the
// 'LOADED FROM THE GALLERY · …' label must go with the preset.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const src = readFileSync('src/screens/lab/envelope/EnvelopeLabScreen.tsx', 'utf8').replace(/\r\n/g, '\n');

test('the loaded preset is state that can be cleared', () => {
  assert.match(src, /const \[loaded, setLoaded\] = useState\(/);
});

test('RESET clears the gallery label along with the sliders', () => {
  const reset = src.split('\n').find((l) => l.includes('label="RESET"') && l.includes('starting shape'));
  assert.ok(reset, 'explorer RESET button found');
  assert.match(reset!, /setAdsr\(DEFAULT\)/);
  assert.match(reset!, /setLoaded\(null\)/);
});
