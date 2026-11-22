// Owner 2026-11-22: in Flashcards full screen, a shake that marks a card Known shows a
// visual confirmation, as a notification at the TOP of the screen.
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const s = readFileSync('src/screens/study/FlashcardsScreen.tsx', 'utf8').replace(/\r\n/g, '\n');

describe('Flashcards full screen: shake-to-Known is confirmed on screen', () => {
  it('toggleKnown reports what happened', () => {
    assert.match(s, /const toggleKnown = useCallback\(\(\): 'known' \| 'unknown' \| 'wait' \| null =>/);
    assert.match(s, /if \(!dwellOk\(\)\) return 'wait';/);
    assert.match(s, /return isKnown \? 'unknown' : 'known';/);
  });
  it('the shake shows the result for 1.6 s', () => {
    assert.match(s, /const r = toggleKnown\(\);\n\s*if \(!r\) return;\n\s*setShakeNote\(r\);/);
    assert.match(s, /setTimeout\(\(\) => setShakeNote\(null\), 1600\)/);
  });
  it('a banner at the top of the screen, with the three messages', () => {
    assert.match(s, /<View style=\{\[styles\.shakeNoteWrap, \{ top: insets\.top \+ 10 \}\]\} pointerEvents="none">/);
    assert.match(s, /'✓ MARKED KNOWN' : shakeNote === 'unknown' \? 'BACK IN THE DECK' : 'READ THE CARD A MOMENT FIRST'/);
  });
});
