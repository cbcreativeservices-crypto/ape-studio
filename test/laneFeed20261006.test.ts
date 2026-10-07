/**
 * The dock fader's feed (src/screens/lab/rack/laneFeed.ts) — owner, Pixel 7
 * Pro, 2026-10-06, Miking Labs: "many of them their sliders are not working".
 *
 * Cause: ParamLane called the lab's onChange on every touch move; a Miking
 * page re-renders its whole scene per move (60–350 ms measured on a desktop
 * in the web preview, several times that on a phone), so the moves queued,
 * the cap stood still under the finger and the drawing caught up seconds
 * later. Fix: at most one onChange per frame, newest value wins, grab and
 * release delivered at once; the cap follows the finger on the UI thread.
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';
import { createLaneFeed } from '../src/screens/lab/rack/laneFeed.ts';

function harness() {
  const got: number[] = [];
  let queued: (() => void) | null = null;
  let scheduled = 0;
  const feed = createLaneFeed({
    deliver: (v) => got.push(v),
    schedule: (cb) => {
      scheduled++;
      queued = cb;
      return scheduled;
    },
    cancel: () => {
      queued = null;
    },
  });
  const frame = () => {
    const q = queued;
    queued = null;
    q?.();
  };
  return { feed, got, frame, scheduled: () => scheduled };
}

describe('laneFeed: one onChange per frame, newest wins, nothing lost', () => {
  it('the grab jumps at once', () => {
    const h = harness();
    h.feed.grant(0.3);
    assert.deepEqual(h.got, [0.3]);
  });
  it('a burst of moves inside one frame is ONE delivery of the newest value', () => {
    const h = harness();
    h.feed.grant(0.1);
    for (let i = 1; i <= 30; i++) h.feed.move(0.1 + i * 0.01);
    assert.equal(h.scheduled(), 1, 'one frame asked for');
    assert.deepEqual(h.got, [0.1]);
    h.frame();
    assert.deepEqual(h.got, [0.1, 0.4]);
  });
  it('the release delivers what the finger last chose, without waiting for a frame', () => {
    const h = harness();
    h.feed.grant(0.5);
    h.feed.move(0.6);
    h.feed.move(0.72);
    h.feed.end();
    assert.deepEqual(h.got, [0.5, 0.72]);
    h.frame(); // the cancelled frame delivers nothing more
    assert.deepEqual(h.got, [0.5, 0.72]);
  });
  it('a release with nothing pending delivers nothing extra', () => {
    const h = harness();
    h.feed.grant(0.5);
    h.feed.move(0.6);
    h.frame();
    h.feed.end();
    assert.deepEqual(h.got, [0.5, 0.6]);
  });
  it('latest() is the value asked for (pending first)', () => {
    const h = harness();
    assert.equal(h.feed.latest(), null);
    h.feed.grant(0.2);
    assert.equal(h.feed.latest(), 0.2);
    h.feed.move(0.9);
    assert.equal(h.feed.latest(), 0.9);
  });
});

describe('ParamLane uses the feed and a UI-thread cap', () => {
  const s = readFileSync(new URL('../src/screens/lab/rack/ParamLane.tsx', import.meta.url), 'utf8');
  it('moves go through feed.move, the grab through feed.grant, release and terminate through settle (feed.end)', () => {
    assert.match(s, /feed\.grant\(v\);/);
    assert.match(s, /feed\.move\(v\);/);
    assert.match(s, /const settle = useRef\(\(\) => \{\n\s*feed\.end\(\);/);
    assert.match(s, /onPanResponderRelease: \(\) => \{\n\s*settle\(\);/);
    assert.match(s, /onPanResponderTerminate: \(\) => settle\(\),/);
    assert.doesNotMatch(s, /onChangeRef\.current\(laneDragValue/);
  });
  it('a preview lane (onCommit) commits once on release and prints the finger value live', () => {
    assert.match(s, /if \(onCommitRef\.current && last != null\) onCommitRef\.current\(last\);/);
    assert.match(s, /const readout = live \?\? pageReadout;/);
    const rack = readFileSync(new URL('../src/screens/lab/rack/RackUnit.tsx', import.meta.url), 'utf8');
    assert.match(rack, /onCommit=\{bound\.onCommit\}/);
  });
  it('every Miking fader that moves a mic previews and commits (no page re-render per move)', () => {
    for (const f of ['engine/scene/placementDock.ts', 'lessons/shared/journeyPages.tsx', 'pages/PContext.tsx', 'lessons/shared/electric/ampPages.tsx', 'lessons/shared/hand/handPages.tsx', 'lessons/shared/handdrums/pages/HContext.tsx', 'lessons/spk/pages.tsx']) {
      const src = readFileSync(new URL(`../src/screens/lab/miking/${f}`, import.meta.url), 'utf8');
      assert.doesNotMatch(src, /rig\.moveTo\(/, `${f}: a fader moves the mic with rig.moveTo (a page re-render per move)`);
      assert.match(src, /rig\.preview\(/, f);
      assert.match(src, /onCommit: /, f);
    }
  });
  it('the cap is drawn from a shared value, synced to the page value at rest', () => {
    assert.match(s, /style=\{\[styles\.cap, capStyle\]\}/);
    assert.match(s, /if \(!dragging\.current\) capV\.value =/);
  });
});
