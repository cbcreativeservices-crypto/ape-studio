/**
 * Small fixes of the function audit (decision 37, first item, and the "left not
 * fixed" list, decision 39), each one a control that showed nothing:
 *
 *   E15      every start of every setup is on the MOVE lanes, both ways
 *   E16      the blocked note is said from what is on the band's stage
 *   E09      a family picked on the side view has its players and its arcs
 *   ROOM     the on/off key's lock speaks of switching, not resizing
 *   DCA      no up/down buttons on a DCA with no members
 *   REVERB   rays fade with absorption, as in Wave Physics
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it } from 'node:test';
import { lessonById } from '../src/screens/lab/miking/data/lessons.ts';
import type { EnsembleLesson } from '../src/screens/lab/miking/lessons/shared/ensemble/ensembleData.ts';
import { blockedWords, sliceFor } from '../src/screens/lab/miking/lessons/shared/ensemble/ensembleModel.ts';
import { seatingOf, seatsOf } from '../src/screens/lab/miking/lessons/shared/ensemble/seating.ts';

const read = (f: string) => readFileSync(join(process.cwd(), f), 'utf8').replace(/\r\n/g, '\n');
const lesson = (id: string) => lessonById(id) as EnsembleLesson;
/** The lanes as ensemblePages.tsx declares them (a page the tests do not import). */
const DEFAULTS = { h: { lo: 1200, hi: 4500 }, z: { lo: -1500, hi: 4000 }, x: { lo: -3000, hi: 3000 } };
const SLICE = 1700; // SECTION_SLICE (SeatingArt, Skia)

describe('E15: the lanes reach every start', () => {
  const E = lesson('E15').ensemble;
  const lane = (a: 'h' | 'z' | 'x') => ({ ...DEFAULTS[a], ...E.placeAxes?.[a] });
  it('the defaults this test states are the page lanes', () => {
    const src = read('src/screens/lab/miking/lessons/shared/ensemble/ensemblePages.tsx');
    assert.ok(src.includes('lo: -1500, hi: 4000'));
  });
  it('every rig of every setup is on all three lanes', () => {
    for (const q of E.setups) {
      if (!q.rig) continue;
      const c = q.rig.place.c;
      for (const [a, v] of [['h', -c.y], ['z', c.z], ['x', c.x]] as const) assert.ok(v >= lane(a).lo && v <= lane(a).hi, `${q.id} ${a} ${v}`);
    }
  });
  it('the guitar amp start can be left and returned to, both ways', () => {
    const z = E.setups.find((q) => q.id === 'amp')!.rig!.place.c.z;
    assert.ok(lane('z').lo < z - 100 && lane('z').hi > z + 100);
  });
  it('the far end stays on the stage', () => {
    assert.ok(lane('z').lo > seatingOf('jazz.quartet').stage.z0);
    assert.ok(lane('z').lo > seatingOf('jazz.guitar').stage.z0);
  });
});

describe('E16: the blocked note', () => {
  for (const id of ['bb.standard', 'bb.horseshoe'] as const) {
    it(`${id} names neither bows nor a conductor`, () => {
      const s = seatingOf(id);
      assert.equal(s.podium, null);
      assert.doesNotMatch(blockedWords(s), /bows|conductor/);
    });
  }
});

describe('E09: a family on the side view is on the side view', () => {
  const s = seatingOf('band.stage');
  const inSlice = (q: { p: { x: number } }) => Math.abs(q.p.x) <= SLICE;
  it('as seated, keys, guitar and bass are all off the centre cut (the bug)', () => {
    for (const id of ['keys', 'gtr', 'bass']) assert.ok(!seatsOf(s, id).some(inSlice), id);
  });
  for (const [fam, ids] of [['KEYS', ['keys']], ['AMPLIFIED', ['gtr', 'bass']]] as const) {
    it(`${fam} is drawn, its z and height untouched`, () => {
      const d = sliceFor(s, ids, SLICE);
      for (const id of ids) {
        const a = seatsOf(s, id);
        const b = seatsOf(d, id);
        assert.ok(b.length && b.every(inSlice), id);
        b.forEach((q, i) => {
          assert.equal(q.p.z, a[i].p.z);
          assert.equal(q.p.y, a[i].p.y);
          assert.equal(Math.sign(q.p.x), Math.sign(a[i].p.x));
        });
      }
    });
  }
  it('its amp comes with the player; the rest of the stage stays put', () => {
    const d = sliceFor(s, ['gtr'], SLICE);
    assert.ok(inSlice(d.gear!.find((g) => g.id === 'amp.gtr')!));
    assert.deepEqual(d.gear!.find((g) => g.id === 'amp.bass')!.p, s.gear!.find((g) => g.id === 'amp.bass')!.p);
    assert.deepEqual(seatsOf(d, 'bass'), seatsOf(s, 'bass'));
  });
  it('a new id: the art caches by id', () => {
    assert.notEqual(sliceFor(s, ['keys'], SLICE).id, s.id);
    assert.notEqual(sliceFor(s, ['keys'], SLICE).id, sliceFor(s, ['gtr'], SLICE).id);
  });
  it('EVERY SECTION, no arcs and a family already on the cut stay the plain slice', () => {
    assert.equal(sliceFor(s, s.sections.map((q) => q.id), SLICE), s);
    assert.equal(sliceFor(s, null, SLICE), s);
    assert.equal(sliceFor(s, ['drums'], SLICE), s);
  });
  it('the stage draws from it, on the side view only', () => {
    const src = read('src/screens/lab/miking/lessons/shared/ensemble/EnsembleStage.tsx');
    assert.ok(src.includes("view === 'section' ? sliceFor(seated, radiate, SECTION_SLICE) : seated"));
  });
});

describe('Room Design: ADD FIRST', () => {
  const src = read('src/screens/lab/roomdesign/modules/modTreatment.tsx');
  const reason = /export const NO_ITEM_SWITCH = '([^']+)'/.exec(src)?.[1] ?? '';
  it('the on/off key says switch, not resize', () => {
    assert.match(reason, /switch/);
    assert.doesNotMatch(reason, /resize/);
    assert.ok(src.includes('locked: !sel ? NO_ITEM_SWITCH : undefined'));
  });
  it('NO_ITEM_LOCK stays on THICK and SIZE', () => {
    assert.ok(src.includes("export const NO_ITEM_LOCK = 'nothing to resize yet"));
    assert.equal((src.match(/locked: sel \? undefined : NO_ITEM_LOCK/g) ?? []).length, 2);
  });
});

describe('Subgroups page: BAND DCA tray', () => {
  const src = read('src/screens/lab/soundsystems/pagesRoute.tsx');
  it('the bare strip is gone: a DCA gets buttons only with a member', () => {
    assert.ok(!src.includes('<DcaStrip cs={cs} onChange={setCs} />'));
    assert.ok(src.includes('const liveDcas = cs.dcas.filter((d) => cs.channels.some((c) => c.dca === d.id));'));
    assert.ok(src.includes('{liveDcas.length ? <DcaStrip cs={{ ...cs, dcas: liveDcas }}'));
  });
  it('a strip change cannot drop the DCAs it was not shown', () => {
    assert.ok(src.includes('dcas: cs.dcas.map((d) => next.dcas.find((x) => x.id === d.id) ?? d)'));
  });
  it('the tray gives the fader reason', () => {
    assert.ok(src.includes('{dcaLocked ? <Body>{`BAND DCA — locked: ${dcaLocked}`}</Body> : null}'));
  });
});

describe('Reverb: rays fade with absorption', () => {
  const src = read('src/screens/lab/wave/modules/modWaveB.tsx');
  const reverb = src.slice(src.indexOf('export function ReverbModule'));
  it('the module asks for it and both layers pass it down', () => {
    assert.match(reverb, /onPulseClock=\{onPulseClock\}\n\s+raysShowLoss\n/);
    assert.ok(src.includes('raysShowLoss={raysShowLoss}\n    />'));
    assert.ok(src.includes('raysShowLoss={raysShowLoss}\n      />'));
  });
  it('and only Reverb in this file', () => {
    assert.equal((src.match(/^\s+raysShowLoss$/gm) ?? []).length, 1);
  });
});
