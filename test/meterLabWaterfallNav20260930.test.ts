/**
 * TestFlight build 32 (owner, iPhone 15 Pro Max):
 *   1. "Waterfall display does not respond to many user adjustment changes."
 *   2. "Visual audio analysis lab does not have convenient forward and
 *      backwards navigation. You have to come back to this menu every time."
 *
 * Engine half: the masked-control test the waterfall module now uses to SAY
 * when a control is physically hidden (rather than look dead), pinned to the
 * scenes measured on 2026-09-30. Source half: guards on the wiring.
 */
import { strict as assert } from 'node:assert';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';
import {
  waterfallDecayUnchanged,
  waterfallRidge,
  waterfallTimeSpan,
  RIDGE_CALLOUT_RATIO,
  type WaterfallOpts,
} from '../src/screens/lab/meter/meterEngine.ts';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const src = (p: string) => readFileSync(resolve(ROOT, p), 'utf8');

const scene = (over: Partial<WaterfallOpts> = {}): WaterfallOpts => ({
  room: 'classroom', damping01: 0.15, eqGains: {}, eqFilter: 'bell220q6', qRing: false, reverb: 'none', ...over,
});

describe('waterfall — masked controls are detected, live ones are not', () => {
  it('a 0.5 s ROOM reverb is hidden inside every bare room shell (the slower decay wins)', () => {
    for (const room of ['cathedral', 'classroom', 'theater'] as const) {
      const s = scene({ room });
      assert.ok(waterfallDecayUnchanged(s, { ...s, reverb: 'room' }), room);
    }
  });
  it('PLATE / HALL in a classroom and any reverb in a damped studio DO change the decay', () => {
    const c = scene();
    assert.equal(waterfallDecayUnchanged(c, { ...c, reverb: 'plate' }), false);
    assert.equal(waterfallDecayUnchanged(c, { ...c, reverb: 'hall' }), false);
    const st = scene({ room: 'studio', damping01: 1 });
    for (const rv of ['room', 'plate', 'hall', 'spring'] as const) {
      assert.equal(waterfallDecayUnchanged(st, { ...st, reverb: rv }), false, rv);
    }
  });
  it('Q RING is hidden in a bare cathedral but rings out in a classroom', () => {
    const cat = scene({ room: 'cathedral' });
    assert.ok(waterfallDecayUnchanged(cat, { ...cat, qRing: true }));
    const cls = scene();
    assert.equal(waterfallDecayUnchanged(cls, { ...cls, qRing: true }), false);
  });
  it('DAMPING always changes the decay (the live control is never masked)', () => {
    for (const room of ['cathedral', 'classroom', 'studio', 'theater', 'living'] as const) {
      const s = scene({ room });
      assert.equal(waterfallDecayUnchanged(s, { ...s, damping01: 1 }), false, room);
    }
  });
  it('EQ never moves the decay — it is a LEVEL control (the lesson)', () => {
    const s = scene();
    assert.ok(waterfallDecayUnchanged(s, { ...s, eqGains: { bell220q6: 12, shelf1k: -12 } }));
  });
  it('LIVING ROOM at its default damping stands above the callout ratio the bezel now uses', () => {
    const r = waterfallRidge(scene({ room: 'living' }));
    assert.ok(r.ratio >= RIDGE_CALLOUT_RATIO && r.ratio < 1.6, `ratio ${r.ratio}`);
  });
});

describe('waterfall module wiring', () => {
  const b = src('src/screens/lab/meter/modules/modMeterB.tsx');
  it('the bezel RIDGE uses the same threshold as the plot (no private 1.6)', () => {
    assert.match(b, /const ringing = rt\.ratio >= RIDGE_CALLOUT_RATIO;/);
    assert.doesNotMatch(b, /rt\.ratio >= 1\.6/);
  });
  it('the EQ lane wears the ringing tint it computes', () => {
    assert.match(b, /tint: eqOnRinging \? colors\.ringing : undefined,/);
  });
  it('a hidden REVERB says so in its tray blurb and under the display', () => {
    assert.match(b, /blurb: reverbHidden\[k\]/);
    assert.match(b, /reverbHidden\[reverb\]/);
    assert.match(b, /qRing && qRingHidden/);
  });
  it('the RT60 accuracy badge is kept', () => {
    assert.match(b, /SYNTHETIC CSD — DRAWN FROM THE RT60 MODEL, NOT A MEASUREMENT/);
  });
  it('Signal Detective: each case gets a fresh clock and the waterfall runs at its real-time rate', () => {
    const c = src('src/screens/lab/meter/modules/modMeterC.tsx');
    assert.match(c, /<CaseHero key=\{idx\}/);
    assert.match(c, /kase\.kind === 'ring' \? vs\.waterfallRealtimeHz\(RING_OPTS\) : kase\.visHz/);
    // The frozen 0.1333 was WF_GROW_END / 3 s; the ring scene's window is 6 s.
    assert.equal(waterfallTimeSpan(scene()), 6);
  });
});

describe('Visual Audio Analysis Lab — PREV / NEXT between modules', () => {
  const s = src('src/screens/lab/meter/MeterModuleScreen.tsx');
  it('has the shared module-host top nav (START / PREV / position / NEXT)', () => {
    assert.match(s, /⏮ START/);
    assert.match(s, /‹ PREV/);
    assert.match(s, /MODULE \$\{idx \+ 1\} \/ \$\{METER_MODULES\.length\}/);
    assert.match(s, /'NEXT ›'/);
  });
  it('swaps the module in place (setParams) so ‹ still returns to the lab menu', () => {
    assert.match(s, /setParams\(\{ id: METER_MODULES\[i\]\.id \}\)/);
    assert.match(s, /onPress=\{\(\) => navigation\.goBack\(\)\}/);
  });
  it('the last NEXT is FINISH and opens the what\'s-left screen — never disabled, behind the double-tap lock', () => {
    assert.match(s, /if \(idx >= last\) setEnding\(true\);\s*else goToModule\(idx \+ 1\);/);
    assert.match(s, /'FINISH ›'/);
    assert.doesNotMatch(s, /disabled=\{idx >= last\}/);
    assert.match(s, /Date\.now\(\) - nextTapAt\.current < 400/);
  });
  it('the end screen keeps credit: practise again clears nothing, DONE goes back', () => {
    const at = s.indexOf('<LabEndScreen');
    assert.ok(at > 0);
    const el = s.slice(at, s.indexOf('/>', at));
    assert.match(el, /cleared=\{banked\}/);
    assert.match(el, /onPracticeAgain=\{\(\) => goToModule\(0\)\}/);
    assert.match(el, /onDone=\{\(\) => navigation\.goBack\(\)\}/);
  });
  it('the module still marks itself viewed for lab credit', () => {
    assert.match(s, /markLabUnit\('af_visual_analysis', meta\.id\)/);
  });
});
