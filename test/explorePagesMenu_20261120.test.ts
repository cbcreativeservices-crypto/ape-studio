/**
 * The MENU button on every page of the Awards pager (owner 2026-11-20: "add
 * bottom left menu button to the explore, certificates, programs, and pro
 * registry pages" — "do not cover any text if scrolled up completely").
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = (p: string) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8').replace(/\r\n/g, '\n');

describe('Explore pager pages carry the MENU button', () => {
  const awards = read('src/screens/awards/AwardsScreen.tsx');
  it('the menu renders on every page, lighting Enrollment only on My Enrollments', () => {
    assert.match(awards, /<ScreenCircleMenu here=\{currentKey === 'enrollment' \? 'enroll' : null\} onSelf=\{menuSelf\} \/>/);
    assert.doesNotMatch(awards, /currentKey === 'enrollment' \? <ScreenCircleMenu/);
  });
  it("the menu's Enrollment button turns the pager instead of a no-op navigate", () => {
    assert.match(awards, /if \(key !== 'enroll'\) return false;\n\s+goToPage\('enrollment'\);\n\s+return true;/);
    assert.match(read('src/components/nav/CircleMenu.tsx'), /if \(onSelf\?\.\(key\)\) return;/);
  });
  it('every page scroll ends above the button (no text under it when fully scrolled)', () => {
    assert.match(awards, /contentContainerStyle=\{\[styles\.scroll, \{ paddingBottom: menuClearance\(insets\.bottom\) \+ 12 \}\]\}/);
    assert.match(read('src/screens/curriculum/CurriculumScreen.tsx'), /paddingBottom: menuClearance\(insets\.bottom\) \+ 12/);
    assert.match(read('src/screens/directory/DirectoryScreen.tsx'), /paddingBottom: menuClearance\(insets\.bottom\) \+ 12/);
  });
});
