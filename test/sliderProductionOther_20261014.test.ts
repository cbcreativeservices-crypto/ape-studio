/**
 * Slider audit part 5 (2026-10-14) — Sound Systems, Mixing, Mastering, Drum
 * Tuning, Patchbay, Production, study and other sliders.
 *
 * Owner: the bottom-dock slider "seemed like it didn't change anything, or it
 * didn't progress smoothly/equally/incrementally… the slider smoothly always
 * moved with finger". Three clear-cut fixes are pinned here:
 *
 *  1. Drum Tuning ch1 "Turn one rod": the lane delivers ~60 values a second,
 *     mostly the same eighth-turn. setTurn had no same-value guard, so the
 *     "you turned a rod N times" count climbed per frame and the trend line
 *     ("That turn made it less even") flashed for one frame and vanished
 *     (prevSpread was re-read from the already-turned head).
 *  2. Sound Systems ch "Delay alignment": the ±2 ms goal is ~5 px of a
 *     0–300 ms lane on a phone. DELAY now carries ±1 ms nudges.
 *  3. SpectrumColorPicker (hue wheel + lightness bar): moves read
 *     `locationX`, which re-bases to whatever is under the finger (the thumb,
 *     a ring segment, off the bar) — the thumb jumped instead of following.
 *     Now anchored (grant point + dx/dy), Svgs pointer-transparent, and a
 *     parent scroller cannot steal the drag.
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it } from 'node:test';

const read = (p: string) => readFileSync(join(process.cwd(), p), 'utf8').replace(/\r\n/g, '\n');

describe('Drum Tuning ch1 TURN — only a real change counts', () => {
  const s = read('src/screens/lab/drumtuning/modules/ch1Sound.tsx');
  const body = s.slice(s.indexOf('const setTurn = (v: number) => {'), s.indexOf('const rightFirst'));
  it('setTurn returns early when the snapped value equals the rod’s current turn', () => {
    assert.match(body, /if \(Math\.abs\(v - \(head\.turns\[lug\] \?\? 0\)\) < 1e-6\) return;/);
  });
  it('the guard runs BEFORE prevSpread / the turn counter are touched', () => {
    const guard = body.indexOf('< 1e-6) return;');
    assert.ok(guard > 0);
    assert.ok(guard < body.indexOf('setPrevSpread('), 'guard before setPrevSpread');
    assert.ok(guard < body.indexOf('setTurned('), 'guard before setTurned');
  });
  it('simulated drag: 60 deliveries of the same value count as ONE turn', () => {
    // Mirror of the handler's logic on plain state.
    let turns = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    let turned = 0;
    const lug = 2;
    const setTurn = (v: number) => {
      if (Math.abs(v - (turns[lug] ?? 0)) < 1e-6) return;
      turned++;
      turns = turns.map((t, i) => (i === lug ? v : t));
    };
    for (let i = 0; i < 60; i++) setTurn(0.125);
    for (let i = 0; i < 60; i++) setTurn(0.25);
    assert.equal(turned, 2);
  });
});

describe('Sound Systems DELAY — fine steps for a ±2 ms target', () => {
  const s = read('src/screens/lab/soundsystems/pagesLearnC.tsx');
  const start = s.indexOf("id: 'delay',");
  const block = s.slice(start, s.indexOf('},\n    {', start));
  it('the DELAY fader carries −1 / +1 ms nudges clamped to its 0–300 ms range', () => {
    assert.match(block, /nudges: \[/);
    assert.match(block, /setSetMs\(\(ms\) => Math\.max\(0, ms - 1\)\)/);
    assert.match(block, /setSetMs\(\(ms\) => Math\.min\(300, ms \+ 1\)\)/);
  });
  it('the lane range is still 0–300 ms in 1 ms steps (the nudges match it)', () => {
    assert.match(block, /laneVal\(p, 0, 300, 1\)/);
  });
});

describe('SpectrumColorPicker — the thumbs follow the finger', () => {
  const s = read('src/components/SpectrumColorPicker.tsx');
  it('no move handler reads locationX/locationY (they re-base under the finger)', () => {
    for (const m of s.matchAll(/onPanResponderMove:[^\n]*/g)) {
      assert.doesNotMatch(m[0], /location[XY]/, m[0]);
      assert.match(m[0], /g\.dx/, m[0]);
    }
    assert.equal((s.match(/onPanResponderMove:/g) ?? []).length, 2);
  });
  it('both drags anchor at the grant point', () => {
    assert.match(s, /wheelStart\.current = \{ x: e\.nativeEvent\.locationX, y: e\.nativeEvent\.locationY \}/);
    assert.match(s, /barStart\.current = e\.nativeEvent\.locationX/);
  });
  it('a parent scroller cannot take a drag in progress', () => {
    assert.equal((s.match(/onPanResponderTerminationRequest: \(\) => false/g) ?? []).length, 2);
  });
  it('the drawings never become the touch target', () => {
    assert.equal((s.match(/<Svg pointerEvents="none"/g) ?? []).length, 2);
  });
  it('anchored maths: a drag past the bar end clamps, it never jumps', () => {
    const L_MIN = 0.16, L_MAX = 0.86, W = 200;
    const light = (x: number) => L_MIN + Math.max(0, Math.min(1, x / W)) * (L_MAX - L_MIN);
    const start = 150;
    const seq = [0, 10, 30, 49, 80, 140].map((dx) => light(start + dx));
    for (let i = 1; i < seq.length; i++) assert.ok(seq[i] >= seq[i - 1], 'monotone with the finger');
    assert.equal(seq[seq.length - 1], L_MAX);
  });
});
