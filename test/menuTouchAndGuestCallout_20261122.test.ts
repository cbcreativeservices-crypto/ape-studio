// Owner 2026-11-22: (1) the word under each menu circle is tappable too, inside
// the circle's touch area (Android drops touches outside a parent's bounds);
// (2) every guest sign-in shows the MENU callout again (accounts: once);
// (3) the MENU dots are see-through discs with a rim, never filled halos.
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = (p: string) => readFileSync(p, 'utf8').replace(/\r\n/g, '\n');

describe('Circle menu: words tappable, guest callout, see-through dots', () => {
  it('each word is a Pressable that picks its place, inside the hit area', () => {
    const s = read('src/components/nav/CircleMenuPanel.tsx');
    assert.match(s, /<Pressable onPress=\{\(\) => onPick\(place\.key\)\} hitSlop=\{6\} accessible=\{false\}/);
    assert.match(s, /hitArea: \{ position: 'absolute', width: BOX_W \+ 2 \* LABEL_W, height: CIRCLE \+ 2 \* LABEL_H \}/);
    assert.match(s, /styles\.hitArea, \{ left: geo\.fabX - BOX_W \/ 2 - LABEL_W, top: geo\.fabY - CIRCLE \/ 2 - LABEL_H \}/);
  });
  it('a guest sign-in clears the callout flag', () => {
    const m = read('src/components/nav/CircleMenu.tsx');
    assert.match(m, /onGuestStart\(\(\) => \{\n  void hintStore\.set\(false\);\n\}\);/);
  });
  it('the dots are see-through with a rim', () => {
    const m = read('src/components/nav/CircleMenu.tsx');
    assert.match(m, /<G fill="#f2f2f4" fillOpacity=\{0\.18\} stroke="#f2f2f4" strokeOpacity=\{0\.9\} strokeWidth=\{0\.45\}>/);
    assert.doesNotMatch(m, /<G fill="#000000"/);
  });
});
