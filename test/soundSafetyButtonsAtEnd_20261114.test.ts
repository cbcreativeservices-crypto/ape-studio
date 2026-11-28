/**
 * Sound Safety warning: the two buttons appear only once the end of the
 * warning has been reached (owner 2026-11-14, iPhone screenshot: "do not show
 * the I UNDERSTAND / KEEP SOUND OFF area until the user scrolls all the way
 * down to the bottom").
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';

const src = readFileSync(new URL('../src/features/audio/SoundSafetyWarning.tsx', import.meta.url), 'utf8').replace(/\r\n/g, '\n');
const code = src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');

// The pure end test, copied by value from the component (no RN import in node).
const SLACK = Number(code.match(/export const END_SLACK_PX = (\d+);/)![1]);
const atEnd = (y: number, view: number, content: number) => y + view >= content - SLACK;

describe('Sound Safety: buttons only at the end of the warning', () => {
  it('the footer with both buttons is drawn only when showButtons is true; otherwise a scroll hint', () => {
    const footerAt = code.indexOf('{!showButtons ? (');
    assert.ok(footerAt > code.indexOf('</ScrollView>'), 'the switch sits below the scroll');
    const hintBranch = code.slice(footerAt, code.indexOf(') : (', footerAt));
    assert.match(hintBranch, /SCROLL_HINT/);
    assert.doesNotMatch(hintBranch, /onPress=\{accept\}|onPress=\{decline\}/, 'no button before the end');
    const btnBranch = code.slice(code.indexOf(') : (', footerAt));
    assert.match(btnBranch, /onPress=\{accept\}/);
    assert.match(btnBranch, /onPress=\{decline\}/);
  });
  it('reached = scrolled to the end, or the text fits without scrolling; sticky; reset per request; on at once for a screen reader', () => {
    assert.match(code, /const showButtons = reachedEnd \|\| readerOn;/);
    assert.match(code, /if \(atScrollEnd\(e\.nativeEvent\)\) setReachedEnd\(true\);/);
    assert.match(code, /if \(reachedEnd\) return;/, 'never hidden again once shown');
    assert.match(code, /textH\.current <= boxH\.current \+ END_SLACK_PX\) setReachedEnd\(true\)/);
    assert.match(code, /useEffect\(\(\) => \{\s*setReachedEnd\(false\);\s*\}, \[openId\]\);/);
    assert.match(code, /AccessibilityInfo\.isScreenReaderEnabled\(\)/);
    assert.match(code, /onRequestClose=\{decline\}/, 'BACK still declines: the sheet never traps');
  });
  it('the end test: within the slack counts, short of it does not', () => {
    assert.equal(atEnd(1000, 500, 1500), true);
    assert.equal(atEnd(1000 - SLACK + 1, 500, 1500), true);
    assert.equal(atEnd(900, 500, 1500), false);
    assert.equal(atEnd(0, 500, 400), true, 'a warning that fits');
  });
  it('the hint is plain and at least 9 pt', () => {
    assert.match(code, /export const SCROLL_HINT = 'Scroll to the end of the warning to continue ↓';/);
    assert.match(code, /scrollHint: \{[^}]*fontSize: 13/);
  });
});
