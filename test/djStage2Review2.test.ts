/**
 * DJ Systems Lab — screens 13–18 after the second-round reviews (2026-10-18):
 *
 *   - the tonearm's halos and callouts ride the ARM's transform: at rest, at
 *     the lead-in and at the run-out each stays within 3 mm of its part
 *     (visual review 2, blocker 3);
 *   - the FX KNOB key names the knob it shows and is LOCKED while the effect
 *     is off (learning review 2, p13 #1–2; D75);
 *   - SKIP TO SCREEN 19 › lands on screen 19 through the shell's navigation,
 *     and screens 15–18 offer it (learning review 2, W1);
 *   - a stylus dropped or lifted on a LIVE phono channel flags a THUMP; with
 *     the fader down, or the channel not hearing the turntable, it does not
 *     (audio review 2 #13);
 *   - one mains frequency in the booth (60 Hz) and the true RIAA end value.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { ARM_LOCAL, armAngleAt, armPartAt, armToWorld, turntablePartBox } from '../src/screens/lab/dj/geometry/armGeometry.ts';
import { GROOVE, TT } from '../src/screens/lab/dj/geometry/boothGeometry.ts';
import { FX_OFF_LOCK, fxKnobLock, knobLabel, knobShort } from '../src/screens/lab/dj/pages/fxKnob.ts';
import { freshFx } from '../src/screens/lab/dj/model/djEffects.ts';
import { SKIP_LABEL, skipTargetIndex, skipToMic } from '../src/screens/lab/dj/pages/skipTarget.ts';
import { numberPages } from '../src/screens/lab/dj/pages/registry.ts';
import { HUM_HZ, THUMP_FADER, armMoveThumps, freshVinyl, stylusThumps } from '../src/screens/lab/dj/model/djVinyl.ts';
import { HUM_HZ as EVENT_HUM_HZ } from '../src/screens/lab/dj/model/djEvent.ts';
import { builtBooth, connect } from '../src/screens/lab/dj/model/djModel.ts';

const ROOT = join(import.meta.dirname, '..');
const read = (p: string) => readFileSync(join(ROOT, p), 'utf8');
const centre = (b: { x: number; y: number; w: number; h: number }) => ({ x: b.x + b.w / 2, y: b.y + b.h / 2 });
const dist = (a: { x: number; y: number }, b: { x: number; y: number }) => Math.hypot(a.x - b.x, a.y - b.y);

describe('DJ Systems Lab — screen 17: the halos ride the arm', () => {
  const total = 300;
  const poses = { rest: armAngleAt(0, total, false), leadIn: armAngleAt(0, total, true), runOut: armAngleAt(total, total, true) };
  it('the drawing’s arm angle puts the stylus on the lead-in and the run-out grooves', () => {
    const spindle = { x: TT.platter.cx, y: TT.platter.cy };
    assert.ok(Math.abs(dist(armPartAt('stylus', poses.leadIn), spindle) - GROOVE.leadIn) < 0.5);
    assert.ok(Math.abs(dist(armPartAt('stylus', poses.runOut), spindle) - GROOVE.runOut) < 0.5);
    assert.equal(poses.rest, 0);
  });
  for (const [name, ang] of Object.entries(poses)) {
    it(`at ${name}: each halo (and callout anchor) stays within 3 mm of its part`, () => {
      for (const part of ['headshell', 'counterweight'] as const) {
        const truth = armToWorld(ARM_LOCAL[part], ang);
        // the box the page hands the label layout (an obstacle) and its callout anchor
        assert.ok(dist(centre(turntablePartBox(part, ang)), truth) <= 3, `${part} box at ${name}`);
        assert.ok(dist(armPartAt(part, ang), truth) <= 3, `${part} anchor at ${name}`);
        // the halo the drawing paints: the rest box in the arm's own frame,
        // turned by the arm's transform
        const local = centre(turntablePartBox(part, 0));
        const turned = armToWorld({ x: local.x - TT.armPivot.x, y: local.y - TT.armPivot.y }, ang);
        assert.ok(dist(turned, truth) <= 3, `${part} halo at ${name}`);
      }
    });
  }
  it('the page and the drawing use the arm’s transform, not fixed rest anchors', () => {
    const page = read('src/screens/lab/dj/pages/p17Vinyl.tsx');
    assert.doesNotMatch(page, /ARM_AT_REST/);
    assert.match(page, /armPartAt\('counterweight', armAng\)/);
    assert.match(page, /turntablePartBox\(p, armAng\)/);
    const art = read('src/screens/lab/dj/art/TurntableTop.tsx');
    // one pose for the drawing and the page (grade 2026-10-19: no auto-return)
    assert.match(art, /rotate: away \+ \(armPoseAngle\(true, armAway, pos\.value, total\) - away\) \* toward\.value/);
    assert.match(page, /armPoseAngle\(armOn, VINYL_ARM_AWAY, posNow, /);
    assert.match(art, /<Group transform=\{armXf\}>[\s\S]*ARM_HALOS\.includes\(h\)/);
  });
});

describe('DJ Systems Lab — screen 13: the FX KNOB key', () => {
  it('is locked while the effect is OFF, whichever knob it shows', () => {
    const off = { ...freshFx(), on: false };
    for (const f of ['time', 'feedback', 'level'] as const) assert.equal(fxKnobLock(off, f), FX_OFF_LOCK);
    const on = { ...freshFx(), on: true, type: 'ECHO' as const };
    for (const f of ['time', 'feedback', 'level'] as const) assert.equal(fxKnobLock(on, f), undefined);
    // FEEDBACK stays locked on the types it does nothing on
    assert.match(fxKnobLock({ ...on, type: 'REVERB' }, 'feedback') ?? '', /does nothing on REVERB/);
    assert.equal(fxKnobLock({ ...on, type: 'REVERB' }, 'time'), undefined);
  });
  it('names the knob it shows, in a label and a value that fit the dock', () => {
    assert.equal(knobLabel('time', 'CH1'), 'FX TIME');
    assert.equal(knobLabel('feedback', 'CH1'), 'FEEDBACK');
    assert.equal(knobLabel('level', 'CH1'), 'DRY/WET');
    assert.equal(knobLabel('level', 'SEND'), 'RETURN');
    const fx = { ...freshFx(), on: true };
    assert.equal(knobShort('time', fx, 1 / 4), 'T ½B');
    assert.equal(knobShort('feedback', fx, 0.55), 'FB 55%');
    assert.equal(knobShort('level', fx, 0.5), 'W 50%');
    assert.equal(knobShort('level', { ...fx, route: 'SEND' }, 0.5), 'R 50%');
    for (const f of ['time', 'feedback', 'level'] as const) {
      assert.ok(knobLabel(f, 'SEND').length <= 8);
      for (const v of [0, 0.25, 0.5, 0.75, 1]) assert.ok(knobShort(f, fx, v).length <= 7, knobShort(f, fx, v));
    }
    const page = read('src/screens/lab/dj/pages/p13Effects.tsx');
    assert.match(page, /locked: fxKnobLock\(fx, focus\)/);
    assert.match(page, /label: knobLabel\(focus, fx\.route\)/);
  });
});

describe('DJ Systems Lab — SKIP TO SCREEN 19 ›', () => {
  // the lab's own numbering: 24 pages, P19 declares 19
  const pages = Array.from({ length: 24 }, (_, i) => i);
  const numbers = numberPages(pages, new Map([[18, 19]]));
  it('lands on the page that is outline screen 19, through ctx.goTo', () => {
    assert.equal(skipTargetIndex(numbers), 18);
    const went: number[] = [];
    assert.equal(skipToMic({ goTo: (i) => went.push(i) }, numbers), true);
    assert.deepEqual(went, [18]);
    assert.equal(skipToMic({}, numbers), false, 'no navigation, no jump');
    assert.equal(skipToMic({ goTo: () => assert.fail('must not jump') }, [1, 2, 3]), false);
    assert.equal(SKIP_LABEL, 'SKIP TO SCREEN 19 ›');
  });
  it('screens 15, 16, 17 and 18 offer it, worded as optional equipment paths', () => {
    for (const [f, n] of [['p15Stems.tsx', 15], ['p16Laptop.tsx', 16], ['p17Vinyl.tsx', 17], ['p18Dvs.tsx', 18]] as const) {
      assert.match(read(`src/screens/lab/dj/pages/${f}`), new RegExp(`<SkipOptional ctx=\\{ctx\\} here=\\{${n}\\} />`), f);
      assert.doesNotMatch(read(`src/screens/lab/dj/pages/${f}`), /go straight on to the next screens/, f);
    }
    const s = read('src/screens/lab/dj/pages/skipOptional.tsx');
    assert.match(s, /OPTIONAL equipment screens/);
    assert.match(s, /optional equipment paths/);
    assert.match(s, /skipToMic\(ctx, getDjRegistry\(\)\.numbers\)/);
  });
});

describe('DJ Systems Lab — screen 17: a stylus drop on a live channel thumps', () => {
  it('flags a move of the arm on a live channel with its fader up — and nothing else', () => {
    assert.equal(stylusThumps(true, false, true, 0.85), true, 'lowered onto a live channel');
    assert.equal(stylusThumps(false, true, true, 0.85), true, 'lifted off a live channel');
    assert.equal(stylusThumps(true, false, true, 0), false, 'fader down');
    assert.equal(stylusThumps(true, false, true, THUMP_FADER), false, 'at the threshold');
    assert.equal(stylusThumps(true, false, false, 0.85), false, 'the channel does not hear the turntable');
    assert.equal(stylusThumps(true, true, true, 0.85), false, 'the arm did not move');
  });
  it('reads the booth: only when channel 1 really hears the turntable', () => {
    let b = builtBooth();
    b = connect(connect(b, 'tt.rcaL', 'ch1.phono.L')!, 'tt.rcaR', 'ch1.phono.R')!;
    b = { ...b, vinyl: { ...freshVinyl(), armUp: true }, ch: { ...b.ch, 1: { ...b.ch[1], input: 'PHONO', fader: 0.85 } } };
    assert.equal(armMoveThumps(b, false), true);
    assert.equal(armMoveThumps({ ...b, ch: { ...b.ch, 1: { ...b.ch[1], fader: 0 } } }, false), false);
    assert.equal(armMoveThumps({ ...b, ch: { ...b.ch, 1: { ...b.ch[1], input: 'LINE' } } }, false), false);
  });
  it('the page flags it and teaches the cue lever with the fader down', () => {
    const page = read('src/screens/lab/dj/pages/p17Vinyl.tsx');
    assert.match(page, /armMoveThumps\(b, !\(b\.vinyl \?\? freshVinyl\(\)\)\.armUp\)/);
    assert.match(page, /THUMP — the stylus moved on a live channel/);
    assert.match(page, /Lift and lower the arm with the cue lever, and with the channel fader down/);
  });
});

describe('DJ Systems Lab — one booth, one mains; the true RIAA end', () => {
  it('the turntable hums at the same mains frequency as the event screens (60 Hz)', () => {
    assert.equal(HUM_HZ, 60);
    assert.equal(HUM_HZ, EVENT_HUM_HZ);
    assert.match(read('src/screens/lab/dj/pages/p17Vinyl.tsx'), /a 60 Hz buzz under the music \(50 Hz in many countries\)/);
  });
  it('the drawn RIAA playback curve reads +19.3 dB at 20 Hz and −19.6 dB at 20 kHz', async () => {
    // the drawing's own maths, without the React Native drawing around it
    const src = read('src/screens/lab/dj/art/vinylArt.tsx');
    const T = (n: string) => Number(src.match(new RegExp(`const ${n} = ([0-9.e-]+);`))![1]);
    const [T1, T2, T3] = [T('T1'), T('T2'), T('T3')];
    const m = (f: number) => {
      const w = 2 * Math.PI * f;
      return Math.sqrt(1 + (w * T2) ** 2) / (Math.sqrt(1 + (w * T1) ** 2) * Math.sqrt(1 + (w * T3) ** 2));
    };
    const db = (f: number) => 20 * Math.log10(m(f) / m(1000));
    assert.ok(Math.abs(db(20000) + 19.6) < 0.1, db(20000).toFixed(2));
    assert.ok(Math.abs(db(20) - 19.3) < 0.1, db(20).toFixed(2));
    assert.match(src, /riaaPlaybackDb\(f\)/);
  });
});
