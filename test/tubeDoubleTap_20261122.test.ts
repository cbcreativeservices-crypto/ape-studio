// Owner 2026-11-22: "the double tap on vacuum tube sheets is not zooming in
// like the pop up said it would". On a phone a tap reports a tiny move; the
// Move handler flipped the session into 'swipe' mode on ANY move, and the
// swipe branch of Release returns before the double-tap check. The fix: below
// the touch slop (4 px) Move returns early, so the gesture stays a tap.
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const src = readFileSync(new URL('../src/screens/lab/tube/TubeCardScreen.tsx', import.meta.url), 'utf8').replace(/\r\n/g, '\n');

const move = src.slice(src.indexOf('onPanResponderMove:'), src.indexOf('onPanResponderRelease:'));
const release = src.slice(src.indexOf('onPanResponderRelease:'), src.indexOf('onPanResponderTerminate:'));

describe('tube card: double-tap zoom survives a real finger tap', () => {
  it('Move returns before choosing pan/swipe while the finger is still inside the slop', () => {
    const slop = move.indexOf("if (!s.moved && s.mode !== 'pinch') return;");
    const swipe = move.indexOf("s.mode = 'swipe'");
    const pan = move.indexOf("s.mode = 'pan';\n            const m = maxT");
    assert.ok(slop > 0, 'the slop guard is missing from onPanResponderMove');
    assert.ok(slop < swipe && slop < pan, 'the slop guard must come before the pan/swipe branch');
    assert.ok(move.indexOf('s.moved = true;\n          // Touch slop') > 0 || move.indexOf('Math.abs(g.dx) > 4 || Math.abs(g.dy) > 4) s.moved = true') < slop,
      'moved must be computed before the guard reads it');
  });

  it('the pinch branch still runs before the guard (two fingers never wait for the slop)', () => {
    assert.ok(move.indexOf('if (t.length >= 2)') < move.indexOf("if (!s.moved && s.mode !== 'pinch') return;"));
  });

  it('a double tap is timed generously enough for a real finger (press < 280 ms, release-to-release < 420 ms)', () => {
    assert.match(release, /now - s\.downAt < 280/);
    assert.match(release, /now - s\.lastTapAt < 420/);
  });

  it('the help text still promises double-tap zoom (what the owner read)', () => {
    const guides = readFileSync(new URL('../src/screens/lab/tube/tubeScreenGuides.ts', import.meta.url), 'utf8');
    assert.match(guides, /Double-tap the card to zoom in/);
  });
});
