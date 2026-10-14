/**
 * SLIDER AUDIT part 1 (owner 2026-10-14): "validate that all labs with the
 * movable horizontal slider at the bottom … actually does things … progress
 * smoothly/equally/incrementally … the slider smoothly always moved with
 * finger."
 *
 * The shared fader core: ParamLane (the rack dock lane), DragSlider
 * (foundations/bits.tsx) and ControlSlider (amp/kit.tsx).
 *
 *  1. The cap stays under the finger for the WHOLE drag — including a grab in
 *     an end zone (the edge-guard inset / half-cap). Anchoring the drag to the
 *     CLAMPED grab value put the cap up to ~45 dp ahead of the finger; the
 *     drag now anchors to laneRawAt (unclamped).
 *  2. Finger travel → value is linear (equal steps, no acceleration, no dead
 *     zone inside the travel) and both ends are reachable from any grab.
 *  3. The feed never loses the last value (release / terminate / unmount).
 *  4. DragSlider's cap rides the UI thread (no page round-trip per frame);
 *     ControlSlider follows its own finger, anchored, fed, scroll-locked.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const g = await import('../src/screens/lab/rack/laneEdgeGuard.ts');
const { createLaneFeed } = await import('../src/screens/lab/rack/laneFeed.ts');

const read = (rel: string) => readFileSync(new URL(`../${rel}`, import.meta.url), 'utf8').replace(/\r\n/g, '\n');

/** Where the cap's CENTRE draws at value v, lane-local (ParamLane's travel). */
const capCentre = (v: number, w: number, ins: { l: number; r: number }, capW: number) =>
  g.capLeftAt(v, w, ins, capW) + capW / 2;

const GEOMS = [
  { name: 'ParamLane, phone dock (fallback insets)', w: 374, ins: g.FALLBACK_INSETS, capW: g.LANE_CAP_W },
  { name: 'ParamLane, tablet column (no insets)', w: 720, ins: g.NO_INSETS, capW: g.LANE_CAP_W },
  { name: 'ParamLane, asymmetric landscape cutout', w: 640, ins: { l: 40, r: 0 }, capW: g.LANE_CAP_W },
  { name: 'DragSlider / ControlSlider in a well', w: 320, ins: g.NO_INSETS, capW: 24 },
  { name: 'DragSlider near an edge', w: 360, ins: { l: 24, r: 24 }, capW: 24 },
];

describe('1. the cap stays under the finger for the whole drag', () => {
  for (const G of GEOMS) {
    it(G.name, () => {
      const lo = G.ins.l + G.capW / 2; // finger x where the cap centre sits at 0
      const hi = G.w - G.ins.r - G.capW / 2; // …and at 1
      // Grabs everywhere, including deep in both end zones.
      for (let gx = 0; gx <= G.w; gx += 7) {
        const base = g.laneRawAt(gx, G.w, G.ins, G.capW);
        for (let dx = -G.w; dx <= G.w; dx += 11) {
          const fx = gx + dx;
          const v = g.laneDragValue(base, dx, G.w, G.ins, G.capW);
          // Identical to a fresh jump-to-finger at the finger's x…
          assert.ok(Math.abs(v - g.laneValueAt(fx, G.w, G.ins, G.capW)) < 1e-9, `grab ${gx} dx ${dx}`);
          // …so inside the travel the cap centre is exactly under the finger.
          if (fx >= lo && fx <= hi) assert.ok(Math.abs(capCentre(v, G.w, G.ins, G.capW) - fx) < 1e-6);
        }
      }
    });
  }

  it('the old clamped anchor is what put the cap ahead (the bug, pinned)', () => {
    const { w, ins, capW } = GEOMS[0];
    const grabX = 4; // in the left end zone: value 0, finger ~42 dp left of the cap
    const clamped = g.laneValueAt(grabX, w, ins, capW);
    assert.equal(clamped, 0);
    const dx = 30;
    const old = g.laneDragValue(clamped, dx, w, ins, capW);
    const now = g.laneDragValue(g.laneRawAt(grabX, w, ins, capW), dx, w, ins, capW);
    assert.ok(capCentre(old, w, ins, capW) - (grabX + dx) > 40, 'old: cap ran > 40 dp ahead of the finger');
    assert.equal(now, 0, 'now: the cap waits until the finger reaches it');
  });
});

describe('2. even progression, both ends reachable', () => {
  for (const G of GEOMS) {
    it(G.name, () => {
      const travel = g.laneTravel(G.w, G.ins, G.capW);
      const base = g.laneRawAt(capCentre(0.5, G.w, G.ins, G.capW), G.w, G.ins, G.capW); // the cap at centre
      // Equal finger steps → equal value steps (no taper, no acceleration).
      const step = 3;
      let prev = g.laneDragValue(base, -travel / 2 + 1, G.w, G.ins, G.capW);
      for (let dx = -travel / 2 + 1 + step; dx < travel / 2 - 1; dx += step) {
        const v = g.laneDragValue(base, dx, G.w, G.ins, G.capW);
        assert.ok(Math.abs(v - prev - step / travel) < 1e-9, `uneven at dx ${dx}`);
        prev = v;
      }
      // Ends: a touch at either lane edge is the endpoint; any grab reaches both.
      assert.equal(g.laneValueAt(0, G.w, G.ins, G.capW), 0);
      assert.equal(g.laneValueAt(G.w, G.w, G.ins, G.capW), 1);
      for (const gx of [0, G.w / 3, G.w]) {
        const b = g.laneRawAt(gx, G.w, G.ins, G.capW);
        assert.equal(g.laneDragValue(b, -gx, G.w, G.ins, G.capW), 0);
        assert.equal(g.laneDragValue(b, G.w - gx, G.w, G.ins, G.capW), 1);
      }
    });
  }

  it("ParamLane's 1 dp border costs at most 1 dp between finger and cap", () => {
    // The touch map uses the lane's OUTER width; the cap draws in the travel
    // view inside the 1 dp border (travelW = w − 2 − l − r). Measured, not fixed.
    const { w, ins, capW } = GEOMS[0];
    const T = w - 2 - ins.l - ins.r - capW;
    for (let v = 0; v <= 1; v += 0.05) {
      const drawn = 1 + ins.l + v * T + capW / 2;
      const fingerFor = capCentre(v, w, ins, capW);
      assert.ok(Math.abs(drawn - fingerFor) <= 1.0001, `v ${v}: ${drawn} vs ${fingerFor}`);
    }
  });
});

describe('3. the feed never drops the last value', () => {
  const rig = () => {
    const got: number[] = [];
    let cb: (() => void) | null = null;
    const feed = createLaneFeed({
      deliver: (v) => got.push(v),
      schedule: (f) => ((cb = f), 1),
      cancel: () => (cb = null),
    });
    return { got, feed, tick: () => cb?.() };
  };
  it('release before the tick delivers the last move once', () => {
    const r = rig();
    r.feed.grant(0.1);
    r.feed.move(0.2);
    r.feed.move(0.3);
    r.feed.end();
    r.tick();
    assert.deepEqual(r.got, [0.1, 0.3]);
  });
  it('one delivery per tick, always the newest', () => {
    const r = rig();
    r.feed.grant(0);
    for (let i = 1; i <= 10; i++) r.feed.move(i / 10);
    r.tick();
    r.feed.move(0.05);
    r.tick();
    r.feed.end();
    assert.deepEqual(r.got, [0, 1, 0.05]);
  });
  it('a release with nothing pending delivers nothing extra', () => {
    const r = rig();
    r.feed.grant(0.4);
    r.feed.end();
    assert.deepEqual(r.got, [0.4]);
    assert.equal(r.feed.latest(), 0.4);
  });
});

describe('4. sources', () => {
  it('ParamLane anchors the drag unclamped and settles on an unmount mid-drag', () => {
    const s = read('src/screens/lab/rack/ParamLane.tsx');
    assert.match(s, /base\.value = laneRawAt\(e\.x, w, g\);/);
    assert.match(s, /useEffect\(\(\) => \(\) => \{\n\s*if \(dragging\.current\) settle\(\);\n\s*releaseHold\(\);\n\s*\}, \[\]\);/);
  });
  it('DragSlider: unclamped anchor; the cap rides a shared value, the page value only at rest', () => {
    const s = read('src/screens/lab/foundations/bits.tsx');
    const body = s.slice(s.indexOf('export function DragSlider'), s.indexOf('export function', s.indexOf('export function DragSlider') + 10));
    assert.match(body, /baseRef\.current = laneRawAt\(e\.nativeEvent\.locationX, wRef\.current, insRef\.current, CAP_W\);/);
    assert.match(body, /const capV = useSharedValue\(/);
    assert.match(body, /if \(!draggingRef\.current\) capV\.value = Math\.max\(0, Math\.min\(1, value\)\);/);
    assert.match(body, /<Animated\.View style=\{\[styles\.sliderCap, capStyle\]\}>/);
    assert.doesNotMatch(body, /styles\.sliderCap, \{ left: `\$\{value \* 100\}%` \}/, 'the cap no longer waits for the page');
  });
  it('ControlSlider: grabbing finger, anchored to the grab, fed, scroll-locked', () => {
    const s = read('src/screens/lab/amp/kit.tsx');
    const body = s.slice(s.indexOf('export function ControlSlider'));
    const move = body.slice(body.indexOf('onPanResponderMove'), body.indexOf('onPanResponderRelease'));
    assert.match(move, /laneFingerDx\(e\.nativeEvent, fingerRef\.current, g\.dx\)/);
    assert.doesNotMatch(move, /locationX/, 'a move never reads locationX (it re-bases off the track)');
    assert.match(body, /createLaneFeed\(\{/);
    assert.match(body, /onPanResponderRelease: \(\) => \{\n\s*feed\.end\(\);\n\s*lockRef\.current\(false\);/);
    assert.match(body, /onPanResponderTerminate: \(\) => \{\n\s*feed\.end\(\);\n\s*lockRef\.current\(false\);/);
    assert.match(body, /const ctxLock = useScrollLock\(\);/);
  });
});

/**
 * SLIDER AUDIT part 2 (live emulator, 2026-10-14): on a busy lab the CAP lagged
 * the finger by up to 160 px (PanResponder callbacks run on the JS thread), a
 * quick flick landed at 3–42% (the release delivered the last move JS had got
 * round to), and the LEVEL lane's fill tracked the page value, not the cap.
 * The lane is now a Gesture Handler pan whose callbacks are worklets.
 */
describe('5. ParamLane: the cap follows the finger on the UI thread', () => {
  const s = read('src/screens/lab/rack/ParamLane.tsx');
  const gStart = s.indexOf('const gesture = useMemo(');
  const gest = s.slice(gStart, s.indexOf('[armed, base, capV', gStart));
  /** A helper worklet declared inside the gesture's useMemo. */
  const helper = (name: string) => gest.slice(gest.indexOf(`const ${name} = `), gest.indexOf('\n    };', gest.indexOf(`const ${name} = `)));
  const cb = (name: string) => {
    const i = gest.indexOf(`.${name}(`);
    assert.ok(i >= 0, `no .${name}`);
    const next = gest.slice(i + 1).search(/\n\s*\.on[A-Z]/);
    return next < 0 ? gest.slice(i) : gest.slice(i, i + 1 + next);
  };

  it('a Gesture Handler pan, not a PanResponder; grants on touch-down; one finger', () => {
    assert.doesNotMatch(s, /PanResponder\.create|panHandlers|onPanResponder/, 'the JS-thread responder is gone');
    assert.match(gest, /\.minDistance\(0\)/);
    assert.match(gest, /\.maxPointers\(1\)/);
    assert.match(gest, /\.shouldCancelWhenOutside\(false\)/);
    assert.match(s, /<GestureDetector gesture=\{gesture\}>/);
    // Its own root (full screen is a Modal = its own native root on Android),
    // never flex:1 (the root's default) in the dock.
    assert.match(s, /<GestureHandlerRootView style=\{styles\.root\}>/);
    assert.match(s, /root: \{ alignSelf: 'stretch' \}/);
  });

  it('every callback is a worklet and writes capV directly', () => {
    for (const name of ['onBegin', 'onUpdate', 'onEnd', 'onFinalize']) {
      assert.match(cb(name), /=> \{\n\s*'worklet';/, `${name} is not a worklet`);
    }
    for (const name of ['valueAtX', 'rideTo']) assert.match(helper(name), /=> \{\n\s*'worklet';/, `${name} is not a worklet`);
    for (const name of ['onBegin', 'onEnd']) assert.match(cb(name), /capV\.value = v;/, `${name} does not move the cap`);
    // A move rides through rideTo, which writes the cap on the UI thread.
    assert.match(cb('onUpdate'), /if \(!armed\.value \|\| IS_WEB\) return;\n\s*rideTo\(e\.x\);/);
    assert.match(helper('rideTo'), /const v = valueAtX\(x\);\n\s*if \(v !== capV\.value\) \{\n\s*capV\.value = v;\n\s*scheduleOnRN\(onMove, v\);/);
    assert.match(helper('valueAtX'), /const dx = x - grabX\.value;[\s\S]*return laneDragValue\(base\.value, dx, laneW\.value, \{ l: insL\.value, r: insR\.value \}\);/);
    // Tap jumps to the finger; the drag anchors UNCLAMPED; positions are the
    // handler's own x (never translationX — Android re-bases it on activation).
    assert.match(cb('onBegin'), /const v = laneValueAt\(e\.x, w, g\);/);
    assert.match(cb('onBegin'), /base\.value = laneRawAt\(e\.x, w, g\);/);
    assert.doesNotMatch(gest, /translationX/);
  });

  it('the page hears it through scheduleOnRN + laneFeed (one value per tick)', () => {
    assert.match(s, /import \{ scheduleOnRN \} from 'react-native-worklets';/);
    assert.match(cb('onBegin'), /scheduleOnRN\(onGrant, v\);/);
    assert.match(helper('rideTo'), /scheduleOnRN\(onMove, v\);/);
    assert.match(s, /const onGrant = useRef\(\(v: number \| null\) => \{[\s\S]{0,160}feed\.grant\(v\);/);
    assert.match(s, /const onMove = useRef\(\(v: number\) => \{\n\s*if \(dragging\.current\) feed\.move\(v\);/);
    assert.doesNotMatch(gest, /onChangeRef|feed\./, 'no page call from inside a worklet');
  });

  it('the release delivers the value where the finger LIFTED, computed on the UI thread', () => {
    const end = cb('onEnd');
    // Native: the release event's own x. Web: the pan's raw pointer-up x
    // (its web pan does not track the leave move or the release).
    assert.match(end, /const v = valueAtX\(IS_WEB \? liftX\.value : e\.x\);\n\s*capV\.value = v;/);
    assert.match(end, /scheduleOnRN\(onRelease, v, moved\.value, false\);/);
    assert.match(s, /const IS_WEB = Platform\.OS === 'web';/);
    const web = gest.slice(gest.indexOf('if (IS_WEB) {'));
    assert.match(web, /\.onTouchesMove\(\(e\) => \{\n\s*'worklet';[\s\S]*liftX\.value = t\.x;\n\s*if \(armed\.value\) rideTo\(t\.x\);/);
    assert.match(web, /\.onTouchesUp\(\(e\) => \{\n\s*'worklet';[\s\S]*liftX\.value = t\.x;/);
    assert.match(s, /if \(final != null\) feed\.move\(final\);\n\s*settle\(\);/);
    // A tap / a taken touch still settles; a cancel never counts as a tap.
    assert.match(cb('onFinalize'), /if \(ended\.value\) return;\n\s*const cancelled = e\.state === CANCELLED;/);
    assert.match(cb('onFinalize'), /scheduleOnRN\(onRelease, null, moved\.value, cancelled\);/);
    assert.match(s, /if \(!wasMoved && !cancelled\) \{/);
  });

  it('a flick: the final value is the lift point, whatever moves JS processed', () => {
    for (const G of GEOMS) {
      for (const gx of [G.w * 0.3, G.w * 0.5, 4]) {
        const base = g.laneRawAt(gx, G.w, G.ins, G.capW);
        // Lift past either end → exactly the end, from any grab.
        assert.equal(g.laneDragValue(base, G.w + 50 - gx, G.w, G.ins, G.capW), 1);
        assert.equal(g.laneDragValue(base, -50 - gx, G.w, G.ins, G.capW), 0);
      }
    }
  });

  it('the touch math is worklet-safe (directive first in each function)', () => {
    const eg = read('src/screens/lab/rack/laneEdgeGuard.ts');
    for (const fn of ['laneTravel', 'clamp01', 'laneValueAt', 'laneRawAt', 'laneDragValue', 'capLeftAt']) {
      const at = eg.indexOf(`function ${fn}(`);
      assert.ok(at >= 0, `no ${fn}`);
      const body = eg.slice(eg.indexOf('{\n', at) + 2);
      assert.match(body, /^\s*'worklet';/, `${fn} is not a worklet`);
    }
  });

  it('the LEVEL fill follows capV; an ordinary lane slot stays empty', () => {
    assert.match(s, /const fillStyle = useAnimatedStyle\(\(\) => \(\{ width: `\$\{capV\.value \* 100\}%` \}\)\);/);
    assert.match(s, /\{level \? \(\n\s*<Animated\.View style=\{\[styles\.slotFill, fillStyle\]\}>/);
    assert.doesNotMatch(s, /styles\.slotFill, \{ width: `\$\{v \* 100\}%`/, 'the fill no longer waits for the page');
    assert.match(s, /\) : null\}\n\s*<\/View>/, 'non-level: nothing in the slot');
  });
});

describe('worklet capture (live emulator retest 2026-10-14)', () => {
  // A worklet captures what its BODY reads, never a default-parameter
  // expression: `capW = LANE_CAP_W` threw "Property 'LANE_CAP_W' doesn't
  // exist" on the UI thread the first time a lane was touched.
  it('no laneEdgeGuard worklet reads a module constant in a default parameter', () => {
    const s = read('src/screens/lab/rack/laneEdgeGuard.ts');
    const fns = [...s.matchAll(/export function (\w+)\(([^)]*)\)[^{]*\{\s*'worklet';/g)];
    assert.ok(fns.length >= 5, 'the five touch-math worklets are found');
    for (const [, name, params] of fns) {
      assert.doesNotMatch(params, /=/, `${name}: no default parameters in a worklet`);
    }
  });
});

describe('chooser tray on a short phone (live emulator retest 2026-10-14)', () => {
  // 640 dp window under the Miking stage: the gap between the stage block and
  // the dock was ~25 dp and the AIM chooser opened as an EMPTY sliver.
  it('an open tray rises over the foot of the stage when the gap is under TRAY_MIN', () => {
    const s = read('src/screens/lab/rack/RackUnit.tsx');
    assert.match(s, /const TRAY_MIN = 168;/);
    assert.match(s, /const trayTop = rootH > 0 \? Math\.max\(0, Math\.min\(stageBlockH, rootH - bottom - dockH - 12 - TRAY_MIN\)\) : stageBlockH;/);
    assert.match(s, /const trayRoom = rootH - trayTop - dockH - bottom - 12;/);
    assert.match(s, /styles\.trayLayer, \{ top: trayTop, bottom: dockH \+ bottom \}/);
  });
});

describe('a flick whose lift beats the pan activation (live emulator retest 2026-10-14)', () => {
  it('onFinalize lands an un-activated touch that travelled at the lift point, not the touch-down', () => {
    const s = read('src/screens/lab/rack/ParamLane.tsx');
    assert.match(s, /const wasArmed = armed\.value;\n\s*armed\.value = false;/);
    assert.match(s, /if \(wasArmed && !cancelled && !IS_WEB && Math\.abs\(e\.x - grabX\.value\) > TAP_SLOP\) \{\n\s*const v = valueAtX\(e\.x\);\n\s*capV\.value = v;\n\s*scheduleOnRN\(onRelease, v, true, false\);/);
    assert.match(s, /scheduleOnRN\(onRelease, null, moved\.value, cancelled\);/, 'a tap or a taken touch still settles on the last value');
  });
});
