/**
 * DJ Systems Lab — wiring audit fixes (2026-10-20, docs/wiring findings
 * DJ-02 … DJ-11). Ratchets: each fails if the wrong wording or logic comes
 * back.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { builtBooth, connect, type Booth } from '../src/screens/lab/dj/model/djModel.ts';
import { counterBpm, freshEvent, withDm, type DrumMachine } from '../src/screens/lab/dj/model/djEvent.ts';
import { FAULTS } from '../src/screens/lab/dj/model/djCapstone.ts';
import { TRACKS } from '../src/screens/lab/dj/engine/djMusic.ts';

const ROOT = join(import.meta.dirname, '..');
const read = (p: string) => readFileSync(join(ROOT, p), 'utf8');
const DJ = 'src/screens/lab/dj';

function rig(dm: Partial<DrumMachine>): Booth {
  let b: Booth = { ...builtBooth(), ev: freshEvent() };
  b = {
    ...b,
    decks: { ...b.decks, A: { ...b.decks.A, playing: true, at: 0, posSec: TRACKS.nightFerry.leadInSec + 40 }, B: { ...b.decks.B, playing: true, at: 0 } },
    ch: { ...b.ch, 2: { ...b.ch[2], input: 'LINE' } },
  };
  return withDm(b, dm);
}

describe('DJ-02: the fits list is not called physical fit', () => {
  it('the model and the tray no longer claim every physical fit is offered', () => {
    assert.doesNotMatch(read(`${DJ}/model/djModel.ts`), /Which jacks it physically fits/);
    assert.doesNotMatch(read(`${DJ}/trays.tsx`), /only jacks it\s+\*?\s*physically fits are offered/);
  });
});

describe('DJ-04: USB ports and USB channel pairs have different names', () => {
  it('screen 23 names the physical sockets as ports; screen 16 calls 1/2 and 3/4 pairs', () => {
    const p23 = read(`${DJ}/pages/p23Changeover.tsx`);
    assert.doesNotMatch(p23, /the mixer’s USB 1 feeds CH 1 and USB 2 feeds CH 2/);
    assert.doesNotMatch(p23, /THE MIXER’S USB [12]"/);
    assert.match(p23, /USB PORT 1/);
    assert.match(p23, /pairs of audio channels inside ONE USB connection/);
    assert.match(read(`${DJ}/pages/p16Laptop.tsx`), /A pair is two audio channels/);
  });
});

describe('DJ-05: an unbalanced run hums but keeps its top end', () => {
  it('no low-pass on the unbalanced run (engine, model doc, screen 20)', () => {
    const r = read(`${DJ}/engine/djEventRender.ts`);
    assert.doesNotMatch(r, /LP_UNBAL/);
    assert.doesNotMatch(r, /unbalL|unbalR/);
    assert.doesNotMatch(read('docs/labs/dj/MODEL.md'), /9 kHz roll-off/);
    assert.doesNotMatch(read(`${DJ}/pages/p20Pa.tsx`), /loses top end/);
  });
});

describe('DJ-06: the capstone hum on a balanced line names its mechanism', () => {
  it('PA_HUM names the pin-1 path, not a bare "ground loop through its audio cable"', () => {
    assert.doesNotMatch(FAULTS.PA_HUM.cause, /through its audio cable/);
    assert.match(FAULTS.PA_HUM.cause, /pin 1/);
    assert.match(FAULTS.PA_HUM.cause, /pin-1 problem/);
  });
});

describe('DJ-07: the beat counter reads what the channel hears', () => {
  it('CH 2 with the drum machine in its LINE inputs reads the drum machine, not deck B', () => {
    const patched = (dm: Partial<DrumMachine>) => connect(connect(rig({ audio: true, ...dm }), 'B.rcaL', null)!, 'B.rcaR', null)!;
    assert.equal(counterBpm(patched({ sync: 'INT', intBpm: 97, startedAt: 0 }), 2), 97);
    assert.equal(counterBpm(patched({ sync: 'INT', intBpm: 97, startedAt: null }), 2), null, 'stopped: no tempo');
    assert.equal(counterBpm(patched({ sync: 'EXT', startedAt: 0 }), 2), null, 'slaved to its own channel: no tempo of its own');
  });
  it('a channel whose selector is off the deck’s jacks reads nothing', () => {
    const b = rig({});
    assert.ok(counterBpm(b, 2) != null, 'deck B in CH 2 LINE');
    assert.equal(counterBpm({ ...b, ch: { ...b.ch, 2: { ...b.ch[2], input: 'PHONO' } } }, 2), null);
    const pulled = connect(connect(b, 'B.rcaL', null)!, 'B.rcaR', null)!;
    assert.equal(counterBpm(pulled, 2), null, 'deck B unplugged');
  });
});

describe('DJ-08: phantom is on a combo jack’s XLR pins only', () => {
  it('screen 19 no longer says phantom reaches line gear on a combo jack', () => {
    const p19 = read(`${DJ}/pages/p19Mic.tsx`);
    assert.doesNotMatch(p19, /line gear on a combo jack/);
    assert.match(p19, /XLR pins only/);
  });
});

describe('DJ-09: this mixer’s connectors are not taught as universal', () => {
  it('screens 3, 4, 16, 20 and 23 say "this lab’s mixer" / "this venue"', () => {
    const p03 = read(`${DJ}/pages/p03Connect.tsx`);
    assert.match(p03, /blurb: 'On this lab’s mixer: OUTPUTS, balanced, line level, one XLR/);
    assert.match(p03, /blurb: 'On this lab’s mixer: OUTPUTS, balanced, line level, on 6\.35 mm TRS/);
    assert.match(p03, /Some mixers put the booth out on RCA or unbalanced jacks/);
    // R3-DJ-03 (owner 2026-10-21): Screen 4's sentence now says what a
    // balanced line does ("the input rejects hum picked up equally on both
    // wires") instead of "balanced cables … cancel hum"; the "this lab’s
    // mixer" scoping this test pins is unchanged
    assert.match(read(`${DJ}/pages/p04Build.tsx`), /on this lab’s mixer both on balanced lines/);
    assert.match(read(`${DJ}/pages/p16Laptop.tsx`), /On this lab’s mixer, channel 1 hears/);
    assert.match(read(`${DJ}/pages/p20Pa.tsx`), /every venue numbers its own/);
    assert.match(read(`${DJ}/pages/p23Changeover.tsx`), /This lab’s mixer has two USB PORTS/);
  });
});

describe('DJ-11: comments match the code', () => {
  it('every test file a DJ source comment cites exists', () => {
    const files: string[] = [];
    const walk = (d: string) => {
      for (const f of readdirSync(join(ROOT, d))) {
        const p = `${d}/${f}`;
        if (statSync(join(ROOT, p)).isDirectory()) walk(p);
        else if (/\.(ts|tsx|md)$/.test(f)) files.push(p);
      }
    };
    walk(DJ);
    walk('docs/labs/dj');
    const missing: string[] = [];
    for (const f of files) for (const m of read(f).matchAll(/test\/[A-Za-z0-9_]+\.test\.ts/g)) if (!existsSync(join(ROOT, m[0]))) missing.push(`${f} cites ${m[0]}`);
    assert.deepEqual(missing, []);
  });
  it('hum, rumble and stage-box comments match the values', () => {
    assert.doesNotMatch(read(`${DJ}/engine/djStage2.ts`), /ground HUM \(50 Hz/);
    assert.doesNotMatch(read(`${DJ}/model/djEvent.ts`), /margin \(dB\) at about 60 Hz/);
    assert.doesNotMatch(read(`${DJ}/art/VenueGear.tsx`), /tie-in box at the booth/);
    assert.match(read(`${DJ}/model/djModel.ts`), /6\.35 mm and 3\.5 mm jacks[\s\S]{0,200}one jack/);
  });
});
