/**
 * Emulator follow-up pass 2026-10-15 — one block per finding.
 *  1. Tray sliders (DragSlider, amp/kit ControlSlider) ignored about every
 *     other fast flick: the 2026-10-14 release landing trusted the end
 *     event's position, which can be STALE (the grab point) — the flick was
 *     landed straight back where it began. laneLandDx now uses the lift only
 *     where it carries the travel on; a flick with no move at all, and a
 *     cancelled touch, still land.
 *  3. Room Design plan labels yield their position to each other (planLabels).
 *  4. Modular Synth keeps a usable well under the tall glass (stage.minWell)
 *     and its SEQ tray shows the step chips first.
 *  5. Gain grouped dock keys carry "dB".
 * Model behaviour where it is pure; a source guard where the view cannot be
 * mounted under the node runner.
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';

const { laneLandDx, laneFingerAt } = await import('../src/screens/lab/rack/laneFinger.ts');
const { createLaneFeed } = await import('../src/screens/lab/rack/laneFeed.ts');
const g = await import('../src/screens/lab/rack/laneEdgeGuard.ts');
const L = await import('../src/screens/lab/roomdesign/planLabels.ts');

const read = (rel: string) => readFileSync(new URL(`../${rel}`, import.meta.url), 'utf8').replace(/\r\n/g, '\n');
const strip = (s: string) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '').replace(/\{\/\*[\s\S]*?\*\/\}/g, '');

type Ev = { identifier: number; pageX: number; changedTouches?: { identifier: number; pageX: number }[]; touches?: { identifier: number; pageX: number }[] };
const at = (x: number, lifting = false): Ev =>
  lifting ? { identifier: 0, pageX: x, changedTouches: [{ identifier: 0, pageX: x }], touches: [] } : { identifier: 0, pageX: x, touches: [{ identifier: 0, pageX: x }] };

/**
 * DragSlider's gesture path with the component stripped away: grant → moves →
 * release (or cancel), through the same pure helpers it calls, delivering to
 * a lab value through laneFeed. `liftAt` is the position the END event
 * reports — the real finger, or a stale one.
 */
function slider(w = 320) {
  let value = 0.5;
  const pending: (() => void)[] = [];
  const feed = createLaneFeed({
    deliver: (v: number) => {
      value = v;
    },
    schedule: (cb: () => void) => {
      pending.push(cb);
      return pending.length;
    },
    cancel: () => {},
  });
  const capPx = (v: number) => 12 + v * (w - 24); // the cap's x for value v (CAP_W 24, no insets)
  return {
    get value() {
      return value;
    },
    capPx,
    gesture(downX: number, moves: number[], liftAt: number) {
      const f = laneFingerAt(at(downX));
      const base = g.laneRawAt(downX, w, g.NO_INSETS, 24);
      feed.grant(g.laneValueAt(downX, w, g.NO_INSETS, 24));
      let lastDx: number | null = null;
      for (const x of moves) {
        lastDx = x - f.px;
        feed.move(g.laneDragValue(base, lastDx, w, g.NO_INSETS, 24));
      }
      const lift = laneLandDx(at(liftAt, true), f, lastDx, 5);
      if (lift != null) feed.move(g.laneDragValue(base, lift, w, g.NO_INSETS, 24));
      feed.end();
    },
  };
}

describe('1 · a flick always lands, and never snaps back to its grab', () => {
  it('alternating fast flicks from the cap, each delivered as grant → release with NO move, all land', () => {
    const s = slider();
    for (let i = 0; i < 12; i++) {
      const right = i % 2 === 0;
      s.gesture(s.capPx(s.value), [], right ? 400 : -80);
      assert.equal(s.value, right ? 1 : 0, `flick ${i + 1} (${right ? 'right' : 'left'})`);
    }
  });
  it('THE BUG: a release that reports the GRAB point after real moves no longer lands the slider back on the grab', () => {
    const s = slider();
    s.gesture(s.capPx(s.value), [300], 400); // flick right, fresh lift → 1
    assert.equal(s.value, 1);
    const grab = s.capPx(1);
    s.gesture(grab, [grab - 150], grab); // flick left: one move at −150, then a STALE lift at the grab
    assert.ok(s.value < 0.6, `the flick left took effect (value ${s.value.toFixed(2)}), not snapped back to 1`);
    // …and the next flick right works as before.
    s.gesture(s.capPx(s.value), [s.capPx(s.value) + 100], 400);
    assert.equal(s.value, 1);
  });
  it('a fresh lift beyond the last move still finishes a short-falling flick (the 2026-10-14 fix)', () => {
    const s = slider();
    s.gesture(160, [110], 0); // last move −50, lifted at −160 → the left end
    assert.equal(s.value, 0);
  });
  it('laneLandDx: the rules', () => {
    const f = { id: 0, px: 200 };
    assert.equal(laneLandDx(at(40, true), f, null, 5), -160, 'no move: the lift is all there is');
    assert.equal(laneLandDx(at(203, true), f, null, 5), null, 'a tap inside the slop keeps the grant');
    assert.equal(laneLandDx(at(200, true), f, -120, 5), null, 'a lift back at the grab after travel is stale');
    assert.equal(laneLandDx(at(150, true), f, -120, 5), null, 'a lift short of the last move never pulls back');
    assert.equal(laneLandDx(at(20, true), f, -120, 5), -180, 'a lift further on is used');
    assert.equal(laneLandDx({ identifier: 7, pageX: 0, changedTouches: [{ identifier: 7, pageX: 0 }] }, f, -120, 5), null, 'another finger lifting');
    assert.equal(laneLandDx(undefined, f, -120, 5), null, 'a cancel with no event');
  });
  it('both sliders end release AND cancel through the guarded landing, with the last move tracked', () => {
    const bits = read('src/screens/lab/foundations/bits.tsx');
    const drag = bits.slice(bits.indexOf('export function DragSlider'), bits.indexOf('export function', bits.indexOf('export function DragSlider') + 10));
    const kit = read('src/screens/lab/amp/kit.tsx');
    const ctl = kit.slice(kit.indexOf('export function ControlSlider'));
    for (const [name, body, slop] of [
      ['DragSlider', drag, 'TAP_SLOP'],
      ['ControlSlider', ctl, '5'],
    ] as const) {
      assert.match(body, new RegExp(`laneLandDx\\(ne, fingerRef\\.current, lastDxRef\\.current, ${slop}\\)`), name);
      assert.match(body, /onPanResponderRelease: \(e\) => finishGesture\(e\.nativeEvent\),/, name);
      assert.match(body, /onPanResponderTerminate: \(e\) => finishGesture\(e\?\.nativeEvent\),/, name);
      assert.match(body, /lastDxRef\.current = dx;/, `${name} records the last move`);
      assert.match(body, /lastDxRef\.current = null;\n\s*fingerRef\.current = laneFingerAt|grabXRef\.current = e\.nativeEvent\.locationX;\n\s*lastDxRef\.current = null;/, `${name} resets it on the grab`);
      assert.doesNotMatch(body, /movedRef/, `${name} no longer lands on a bare "moved" flag`);
    }
  });
});

describe('3 · Room Design: plan labels keep out of each other\'s way', () => {
  it('pickSpot takes the first clear spot on the glass', () => {
    const taken = [L.textBox(100, 100, 'DESK', 10, 'start', L.CAPS_W)];
    const a = { boxes: [L.textBox(100, 100, 'NEARFIELD', 10, 'start', L.CAPS_W)] };
    const b = { boxes: [L.textBox(100, 140, 'NEARFIELD', 10, 'start', L.CAPS_W)] };
    assert.equal(L.pickSpot([a, b], taken, 400, 300), b);
  });
  it('a spot off the glass is not clear', () => {
    const off = { boxes: [L.textBox(395, 50, 'NO TRIANGLE', 10, 'start', L.CAPS_W)] };
    const on = { boxes: [L.textBox(200, 50, 'NO TRIANGLE', 10, 'start', L.CAPS_W)] };
    assert.equal(L.pickSpot([off, on], [], 400, 300), on);
  });
  it('when nothing is clear the least-overlapping spot is used — the label is never dropped', () => {
    const taken = [{ x0: 0, y0: 0, x1: 400, y1: 300 }];
    const big = { boxes: [L.textBox(100, 100, '62 cm 62 cm', 10, 'start')] };
    const small = { boxes: [L.textBox(100, 100, '62 cm', 10, 'start')] };
    assert.equal(L.pickSpot([big, small], taken, 400, 300), small);
    assert.ok(L.pickSpot([big], taken, 400, 300), 'always a spot');
  });
  it('the plan places the desk name, the angle / NEARFIELD pair, FRONT and every boundary distance through pickSpot', () => {
    const s = strip(read('src/screens/lab/roomdesign/RoomPlanView.tsx'));
    assert.match(s, /const sp = pickSpot\(deskLabelSpots\(f, T, fs\), taken, gw, gh\);/);
    assert.match(s, /const frontSpot = dimG \? pickSpot\(dimG\.frontSpots, taken, gw, gh\) : null;/);
    assert.match(s, /const spot = pickSpot\(item\.cands, taken, gw, gh\);/);
    assert.match(s, /layers\.triangle && Lsp && Rsp && st\s*\? pickSpot\(/);
    // The fixed labels and the cabinets / head are obstacles first.
    assert.match(s, /if \(dimG\) taken\.push\(\.\.\.dimG\.boxes\);/);
    assert.match(s, /taken\.push\(boxAround\(lisPx\.x, lisPx\.y, lisRing - 4\)\);/);
    // The drawing uses the placed spots.
    assert.match(s, /<SvgText x=\{pair\.tx\} y=\{pair\.ty\}/);
    assert.match(s, /<SvgText x=\{pair\.tx\} y=\{pair\.ty \+ fs \+ 3\}/);
    assert.match(s, /labelAt=\{deskSpot\[f\.id\]\}/);
    assert.match(s, /<BoundaryLines items=\{boundary\} fs=\{fs\} \/>/);
  });
});

describe('4 · Modular Synth: a usable well under the tall glass', () => {
  it('RackUnit lowers the glass to keep stage.minWell, measured, never below the S height', () => {
    const r = strip(read('src/screens/lab/rack/RackUnit.tsx'));
    assert.match(r, /stage\.minWell && rootH > 0 && dockH > 0 && wellChromeH > 0 \? rootH - bottom - dockH - wellChromeH - stage\.minWell : Infinity/);
    assert.match(r, /const targetH = Math\.max\(Math\.min\(declaredH, STAGE_HEIGHTS\.S\), Math\.min\(declaredH, Math\.round\(fitH\)\)\);/);
    assert.match(r, /const c = Math\.round\(e\.nativeEvent\.layout\.y\) - glassH;/);
    assert.match(read('src/screens/lab/rack/rackTypes.ts'), /minWell\?: number;/);
  });
  it('the rule, worked through: the well gets its room and the glass stays a usable display', () => {
    // Illustrative heights for a short phone (not a measurement): rack root
    // 549 under the LabShell header, dock 121, chrome above the well (stage
    // padding + bezel + badge + HIDE DISPLAY row) 126.
    const fit = (rootH: number, dockH: number, chrome: number, minWell: number, declared: number) =>
      Math.max(Math.min(declared, 160), Math.min(declared, Math.round(rootH - dockH - chrome - minWell)));
    const glass = fit(549, 121, 126, 132, 250);
    assert.equal(549 - 121 - 126 - glass, 132, 'the well is exactly minWell');
    assert.ok(glass >= 160, 'never under the S height');
    assert.equal(fit(900, 121, 126, 132, 250), 250, 'a tall phone keeps the declared L glass');
  });
  it('Modular opts in, and its SEQ tray puts the rates and the eight steps before the words', () => {
    const m = read('src/screens/lab/ModularLabScreen.tsx');
    assert.match(m, /minWell: 132,/);
    const tray = m.slice(m.indexOf("id: 'seq',"), m.indexOf('LEDs) is the REAL native sequencer position.'));
    const steps = tray.indexOf('<View style={styles.stepRow}>');
    assert.ok(steps > 0 && steps < tray.indexOf('SEQUENCER — 8 STEPS'), 'the steps come before the heading');
    assert.ok(steps < tray.indexOf('Sequencer OFF — the voice is a steady drone.'), 'and before the OFF note');
    assert.match(tray, /<LabChip\s+compact\s+label=\{s < 0 \? '✕' : `\+\$\{s\}`\}/, 'step chips are compact ("+12" on one line)');
    const shell = read('src/screens/lab/LabShell.tsx');
    assert.match(shell, /\{\.\.\.\(compact \? fitValue\(12\) : null\)\}/, 'a compact chip shrinks to fit, ≥ 9 pt');
  });
});

describe('5 · Gain: the grouped dock keys carry the unit', () => {
  const s = read('src/screens/lab/gain/modules/modExplore.tsx');
  it('PROCESS and LEVELS read "… dB"', () => {
    assert.equal((s.match(/valueLabel: `\$\{g\.eq\}·\$\{g\.comp\} dB`,/g) ?? []).length, 2);
    assert.equal((s.match(/valueLabel: `\$\{g\.fad\}·\$\{g\.bus\}·\$\{g\.out\} dB`,/g) ?? []).length, 2);
  });
  it('the widest LEVELS value still fits a 411 dp phone key at ≥ 9 pt', () => {
    // STAGE_RANGES: fad −30…10, bus −12…12, out −30…6 → "-30·-12·-30 dB".
    const widest = '-30·-12·-30 dB';
    // Share Tech Mono advance ≈ 0.54 em (measured in the web preview); four
    // keys across a 411 dp dock: (411 − 16 padding − 3 × 6 gap) / 4 − 2 border
    // − 8 padding ≈ 84 dp.
    const keyText = (411 - 16 - 18) / 4 - 2 - 8;
    assert.ok(widest.length * 9 * 0.54 <= keyText, `${widest.length * 9 * 0.54} ≤ ${keyText}`);
  });
});
