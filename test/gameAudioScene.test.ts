/**
 * Game Audio lab — THE SCENE PICTURE, THE RACK WRAPPER AND THE WELL
 * FURNITURE (audit 2 fix round, 2026-11-12).
 *
 * The owner's rule for the picture: what you see is what is playing, shown
 * truthfully, and the learner's controls visibly change it. The drawing is
 * Skia (scene/GaScene.tsx) and cannot run here; everything it DECIDES is in
 * scene/gaSceneLogic.ts and is proven below on the real model, with no
 * device:
 *
 *   which sources ring, and when     W1 F03: no ring before a voice sounds
 *   pace from speed                  W1 F15 / W2-26: the whole slider is seen
 *   a quiet source stays visible     W2-12
 *   what is muffled                  W2-13: the model's own wall treatment
 *   silenced / virtual / stolen      never moving rings; named in words
 *   label placement                  W1 F02: MIN and MAX stay in the picture
 *   the accessibility summary        US spelling; says what is not heard
 *   the glass split                  the scene keeps 16:10 beside a strip
 *
 * and the well furniture's pure half (bitsLogic.ts): the log row formatter
 * (L-02 / W1 F16), the time column (W1 F06), the empty log (W2-22), counts
 * (W2-30); and the rack wrapper's wiring, read from its source.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { GA_EVENTS } from '../src/screens/lab/gameaudio/model/gaDefs.ts';
import { GA_LOG_KIND_WORD, gaGeneratorRate, gaInitial, gaInstWall, gaNominalSeconds, gaReduce, type GaAction, type GaLogKind, type GaState } from '../src/screens/lab/gameaudio/model/gaModel.ts';
import { PLACES, WALL_X, WORLD_H, WORLD_W, type GaPoint } from '../src/screens/lab/gameaudio/model/gaWorld.ts';
import { GA_HUD_H } from '../src/screens/lab/gameaudio/scene/hud/gaHudTypes.ts';
import {
  GA_GLASS_PAD,
  GA_LABEL_AREAS,
  GA_RING_GAP,
  GA_RING_MIN_OPACITY,
  GA_RING_MIN_STROKE,
  GA_SPLIT_ASPECT,
  gaBedMarks,
  gaBoxesHit,
  gaClampLabelX,
  gaFootMarks,
  gaFootText,
  gaGlassSplit,
  gaHeard,
  gaNextRingChange,
  gaPersonLabel,
  gaRangeLabels,
  gaRingGap,
  gaRingInPicture,
  gaRingLook,
  gaRingsPerSecond,
  gaSceneSummary,
  gaSelected,
  gaSelectedBehind,
  gaSoundingOf,
  gaWallCrossing,
  gaWallPieceOwner,
  type GaBox,
  type GaSceneSelect,
} from '../src/screens/lab/gameaudio/scene/gaSceneLogic.ts';
import { gaCount, gaLogEmpty, gaLogRow, gaLogSpoken, gaLogTime } from '../src/screens/lab/gameaudio/bitsLogic.ts';

/** Run actions on the model at scene time `t` (sound off: the scene simulates). */
function run(s: GaState, t: number, ...actions: GaAction[]): GaState {
  let cur = s;
  for (const a of actions) cur = gaReduce(cur, a, t).state;
  return cur;
}
const src = (rel: string): string => readFileSync(join(process.cwd(), rel), 'utf8').replace(/\r\n/g, '\n');
const find = (s: GaState, now: number, owner: string) => gaSoundingOf(s, now).filter((x) => x.owner === owner && !x.alarm);

describe('the scene: which sources ring, and when (W1 F03)', () => {
  it('a door whose main file is missing has NO ring until its late layer sounds', () => {
    const s = run(gaInitial(), 10, { type: 'fault', patch: { missingDoor: true } }, { type: 'door' });
    const rattle = s.voices.find((v) => v.layer === 'rattle');
    assert.ok(rattle && rattle.delayS > 0, 'the rattle is a late layer');
    assert.equal(find(s, 10.25, 'door').length, 0, 'a quarter second after the press nothing sounds at the door');
    assert.equal(gaNextRingChange(s, 10.25), rattle.born + rattle.delayS, 'the picture asks to be drawn again when the rattle starts');
    const later = find(s, rattle.born + rattle.delayS, 'door');
    assert.equal(later.length, 1);
    assert.deepEqual(later[0].rings.map((r) => r.start), [rattle.born + rattle.delayS], 'one ring, and it leaves when the rattle starts');
    assert.equal(gaNextRingChange(s, rattle.born + rattle.delayS + 0.01), null);
  });

  it('a whole door has one ring at the press and a second when the rattle joins', () => {
    const s = run(gaInitial(), 20, { type: 'door' });
    const at = (now: number) => find(s, now, 'door')[0]?.rings.map((r) => r.start) ?? [];
    assert.deepEqual(at(20.1), [20]);
    assert.deepEqual(at(21.05), [20, 21]);
  });

  it('a one-shot ring lasts the sound’s own length (the model’s figure)', () => {
    const s = run(gaInitial(), 5, { type: 'step', who: 'player' });
    const [step] = find(s, 5, 'player');
    assert.equal(step.kind, 'shot');
    assert.equal(step.rings.length, 1);
    assert.equal(step.rings[0].len, gaNominalSeconds(s.voices[0].asset));
    assert.equal(step.rings[0].start, 5);
  });

  it('a loop is one source however many voices it has, and carries its instance id', () => {
    const s = run(gaInitial(), 3, { type: 'machine', id: 'generator-1', on: true });
    const [gen] = find(s, 3, 'generator-1');
    assert.equal(gen.kind, 'loop');
    assert.equal(gen.rings.length, 0);
    assert.deepEqual(gen.ids, [s.inst.find((i) => i.event === 'generator')!.id]);
    assert.equal(gen.speed, 0.4);
  });

  it('two generators are two sources, each with its own speed and id (page 7)', () => {
    const s = run(gaInitial(), 3, { type: 'machine', id: 'generator-1', on: true }, { type: 'addMachine' }, { type: 'machine', id: 'generator-2', on: true }, { type: 'speed', id: 'generator-2', value: 0.9 });
    const a = find(s, 3, 'generator-1')[0];
    const b = find(s, 3, 'generator-2')[0];
    assert.ok(a && b);
    assert.notEqual(a.ids[0], b.ids[0]);
    assert.equal(b.speed, 0.9);
    assert.ok(gaRingGap(b.speed) < gaRingGap(a.speed), 'the faster machine’s rings sit closer');
  });
});

describe('the scene: pace from speed (W1 F15, W2-26)', () => {
  it('the ring gap falls steadily over the WHOLE slider: no flat steps', () => {
    let prev = gaRingGap(0);
    for (let k = 1; k <= 20; k++) {
      const g = gaRingGap(k / 20);
      assert.ok(g < prev - 1e-4, `gap at ${k * 5}% is smaller than at ${(k - 1) * 5}%`);
      prev = g;
    }
  });
  it('35% and 65% (one step before) are clearly different', () => {
    assert.ok(gaRingsPerSecond(0.65) / gaRingsPerSecond(0.35) > 1.25);
    assert.ok(gaRingsPerSecond(0.6) / gaRingsPerSecond(0.4) > 1.15, '40% against 60%: page 7’s two machines');
  });
  it('the pace is the model’s own value: it follows the hum’s playback rate', () => {
    for (const [a, b] of [[0, 0.5], [0.5, 1], [0.2, 0.3]]) {
      assert.equal(gaRingGap(a) > gaRingGap(b), gaGeneratorRate(a) < gaGeneratorRate(b));
    }
    assert.equal(gaRingGap(0), 0.66);
  });
  it('a loop with no speed keeps one fixed gap; the smallest gap still fits the slots', () => {
    assert.equal(gaRingGap(null), GA_RING_GAP);
    // GaScene draws 7 slots over a 1.5 m span
    assert.ok(gaRingGap(1) * 7 >= 1.5);
    assert.ok(gaRingGap(1) >= 0.2, 'rings never run together at phone size');
  });
});

describe('the scene: a quiet source stays visible (W2-12)', () => {
  it('no heard ring is drawn under the floor, however quiet', () => {
    for (const db of [-120, -60, -36, -17, -6, 0, 6]) {
      const look = gaRingLook(db);
      assert.ok(look.opacity >= GA_RING_MIN_OPACITY && look.opacity <= 1);
      assert.ok(look.stroke >= GA_RING_MIN_STROKE);
    }
    assert.ok(GA_RING_MIN_OPACITY >= 0.6, 'the old floor was 0.35 and could not be seen on a phone');
    assert.ok(gaRingLook(0).opacity > gaRingLook(-30).opacity, 'louder is still stronger');
  });
  it('a generator with its bus turned far down is quiet, NOT stopped', () => {
    const s = run(gaInitial(), 2, { type: 'machine', id: 'generator-1', on: true }, { type: 'bus', bus: 'sfx', db: -17 });
    const [gen] = find(s, 2, 'generator-1');
    assert.ok(gaHeard(gen), 'it keeps its moving rings');
    assert.ok(gen.db < -17);
  });
});

describe('the scene: not heard = no moving rings (silenced, virtual, stolen)', () => {
  const on = run(gaInitial(), 2, { type: 'machine', id: 'generator-1', on: true });
  it('a muted bus silences its sources', () => {
    const s = run(on, 3, { type: 'bus', bus: 'sfx', mute: true });
    const [gen] = find(s, 3, 'generator-1');
    assert.equal(gen.muted, true);
    assert.equal(gaHeard(gen), false);
    assert.match(gaSceneSummary(s, 3), /Silenced by the mix: generator 1\./);
  });
  it('another bus soloed silences it too', () => {
    const s = run(on, 3, { type: 'bus', bus: 'music', solo: true });
    assert.equal(gaHeard(find(s, 3, 'generator-1')[0]), false);
  });
  it('a loop out of range is virtual', () => {
    let s = run(on, 3, { type: 'face', who: 'player', facing: 250 });
    for (let k = 0; k < 14; k++) s = run(s, 4 + k, { type: 'step', who: 'player' });
    const [gen] = find(s, 30, 'generator-1');
    assert.ok(gen, 'it is still tracked');
    assert.equal(gen.virtual, true);
    assert.equal(gen.stolen, false);
    assert.equal(gaHeard(gen), false);
    assert.match(gaSceneSummary(s, 30), /virtual\): generator 1\./);
  });
  it('a loop whose voice the budget took is named as stolen', () => {
    const s: GaState = { ...on, voices: on.voices.map((v) => ({ ...v, state: 'virtual' as const, stolen: true })) };
    const [gen] = find(s, 3, 'generator-1');
    assert.equal(gen.virtual, true);
    assert.equal(gen.stolen, true);
    assert.match(gaSceneSummary(s, 3), /\(stolen or waiting for a voice\): generator 1\./);
    assert.doesNotMatch(gaSceneSummary(s, 3), /Sounding now/);
  });
  it('a loop the budget refused at its start (waiting) is drawn and named like a stolen one', () => {
    const s: GaState = { ...on, voices: on.voices.map((v) => ({ ...v, state: 'virtual' as const, waiting: true })) };
    const [gen] = find(s, 3, 'generator-1');
    assert.equal(gen.stolen, true);
    assert.match(gaSceneSummary(s, 3), /No voice because of the budget/);
  });
});

describe('the scene: the wall (W2-13)', () => {
  const on = run(gaInitial(), 2, { type: 'machine', id: 'generator-1', on: true });
  it('a generator behind the closed door is muffled; with the door open it is not', () => {
    assert.equal(find(on, 2, 'generator-1')[0].muffled, true);
    const open = run(on, 3, { type: 'door' });
    assert.equal(find(open, 3, 'generator-1')[0].muffled, false);
    assert.match(gaSceneSummary(on, 2), /generator 1 \(through the closed door\)/);
  });
  it('muffled is the MODEL’S treatment of each instance, never a guess', () => {
    const s = run(on, 3, { type: 'scene', on: true }, { type: 'door' }, { type: 'door' }, { type: 'step', who: 'guide' });
    for (const x of gaSoundingOf(s, 3)) {
      const inst = s.inst.find((i) => i.id === x.ids[0])!;
      assert.equal(x.muffled, gaInstWall(s, inst).obstructed, x.name);
    }
  });
  it('the muffled rings are drawn where the line to the listener meets the wall', () => {
    const L = { x: 5.2, y: 5 };
    const c = gaWallCrossing(PLACES.generator, L);
    assert.equal(c.at.x, WALL_X);
    assert.ok(c.at.y > PLACES.generator.y && c.at.y < L.y, 'between the two heights');
    assert.ok(Math.abs(c.d - Math.hypot(WALL_X - PLACES.generator.x, c.at.y - PLACES.generator.y)) < 1e-9);
    assert.equal(gaWallCrossing(PLACES.door, L).d, 0, 'the door stands in the wall');
  });
  it('the door itself is never muffled: it stands in the wall (the model’s rule)', () => {
    const s = run(gaInitial(), 5, { type: 'door' }, { type: 'door' });
    const door = find(s, 5, 'door')[0];
    assert.ok(door);
    assert.equal(s.doorOpen, false);
    assert.equal(door.muffled, false);
  });
  it('two sources in one place (the alarm on its generator) share ONE piece at the wall: the louder one’s', () => {
    const s = run(on, 3, { type: 'alarm', on: true });
    const all = gaSoundingOf(s, 3).filter((x) => x.muffled);
    assert.equal(all.length, 2, 'the generator and its alarm, both behind the closed door');
    const owners = all.filter((x) => gaWallPieceOwner(all, x));
    assert.equal(owners.length, 1);
    assert.equal(owners[0].db, Math.max(...all.map((x) => x.db)));
    // a silenced source never owns it
    const muted = gaSoundingOf(run(s, 4, { type: 'bus', bus: 'sfx', mute: true }), 4);
    assert.equal(muted.filter((x) => gaWallPieceOwner(muted, x)).length, 0);
  });
});

describe('the scene: labels never leave the picture (W1 F02)', () => {
  const size = 0.4;
  const measure = (t: string) => t.length * size * 0.52;
  const inPicture = (b: GaBox) => b.x0 >= 0 && b.x1 <= WORLD_W && b.y0 >= 0 && b.y1 <= WORLD_H;
  const SOURCES: Exclude<GaSceneSelect, null | 'guide'>[] = ['generator-1', 'generator-2', 'fountain', 'crate', 'door'];
  const listeners: GaPoint[] = [];
  for (let x = 0.9; x <= 15.1; x += 1.42) for (let y = 0.9; y <= 9.1; y += 1.64) listeners.push({ x, y });

  it('every selectable source prints MIN and MAX whole inside the picture, wherever the listener stands', () => {
    for (const sel of SOURCES) {
      const at = gaSelected(sel)!;
      const a = GA_EVENTS[at.event].atten!;
      for (const L of listeners) {
        const labels = gaRangeLabels({ at: at.at, min: a.min, max: a.max, listener: L, size, measure, avoid: [] });
        const min = labels.find((l) => l.tone === 'min');
        const max = labels.find((l) => l.tone === 'max');
        assert.ok(min, `${sel}: MIN is printed`);
        assert.ok(max, `${sel}: MAX is printed`);
        assert.ok(min.text.includes(`${a.min} m`), 'the number is never dropped');
        assert.ok(max.text.includes(`${a.max} m`), 'the number is never dropped');
        for (const l of labels) {
          assert.ok(inPicture(l.box), `${sel} ${l.text} at ${JSON.stringify(l.box)}`);
          assert.ok(GA_LABEL_AREAS.some((f) => l.box.x0 >= f.x0 && l.box.x1 <= f.x1 && l.box.y0 >= f.y0 && l.box.y1 <= f.y1), `${sel} ${l.text}: on the ground, not on a wall`);
          assert.ok(Math.abs((l.box.x0 + l.box.x1) / 2 - l.cx) < 1e-9);
        }
        assert.ok(!gaBoxesHit(min.box, max.box, 0), `${sel}: MIN and MAX do not land on each other`);
      }
    }
  });

  it('the generator’s MIN label (the one that was cut off) keeps its whole text', () => {
    const a = GA_EVENTS.generator.atten!;
    const [min] = gaRangeLabels({ at: PLACES.generator, min: a.min, max: a.max, listener: { x: 5.2, y: 5 }, size, measure, avoid: [] });
    assert.equal(min.text, `MIN ${a.min} m`);
    assert.ok(min.box.x1 <= WORLD_W - 0.4 && min.box.x0 >= WALL_X + 0.24, 'inside the workshop floor');
  });

  it('a maximum ring that lies beyond the picture still prints its number, and says so', () => {
    const a = GA_EVENTS.door_open.atten!;
    assert.equal(gaRingInPicture(PLACES.door, a.max), false, 'the door’s maximum ring is wider than the picture');
    const labels = gaRangeLabels({ at: PLACES.door, min: a.min, max: a.max, listener: { x: 5.2, y: 5 }, size, measure, avoid: [] });
    const max = labels.find((l) => l.tone === 'max')!;
    assert.match(max.text, new RegExp(`^MAX ${a.max} m`));
    assert.match(max.text, /BEYOND THE PICTURE/);
    assert.ok(inPicture(max.box));
    assert.equal(gaRingInPicture(PLACES.generator, GA_EVENTS.generator.atten!.max), true);
  });

  it('where the label has no room, the number alone is kept (never the other way round)', () => {
    // every spot around the ring is taken except room for a short text
    const a = { min: 2, max: 5 };
    const wide = (t: string) => (t.startsWith('MIN') ? 30 : 0.6);
    const [min] = gaRangeLabels({ at: { x: 4, y: 5 }, min: a.min, max: a.max, listener: { x: 1, y: 1 }, size, measure: wide, avoid: [] });
    assert.equal(min.text, '2 m');
  });

  it('labels keep clear of what they are told to avoid', () => {
    const a = GA_EVENTS.fountain.atten!;
    const name: GaBox = { x0: PLACES.fountain.x - 1, x1: PLACES.fountain.x + 1, y0: PLACES.fountain.y + 1.4, y1: PLACES.fountain.y + 1.9 };
    for (const l of gaRangeLabels({ at: PLACES.fountain, min: a.min, max: a.max, listener: { x: 5.2, y: 5 }, size, measure, avoid: [name] })) {
      assert.ok(!gaBoxesHit(l.box, name, 0), l.text);
    }
  });

  it('a person’s label is always whole inside the picture, in every corner', () => {
    const w = measure('GUIDE · STONE PATH · TAKE 3');
    for (const c of [{ x: 0.9, y: 0.9 }, { x: 15.1, y: 0.9 }, { x: 0.9, y: 9.1 }, { x: 15.1, y: 9.1 }, { x: 8, y: 5 }]) {
      const l = gaPersonLabel(c, w, size, []);
      assert.ok(inPicture(l.box), JSON.stringify(c));
    }
    assert.equal(gaClampLabelX(0.3, 2), 1.2);
    assert.equal(gaClampLabelX(15.9, 2), WORLD_W - 1.2);
    assert.equal(gaClampLabelX(8, 2), 8);
  });

  it('the words by a foot are placed WITH the name: neither lands on another label or on a wall', () => {
    const zone: GaBox = { x0: 0.35, x1: 3.2, y0: WORLD_H - 0.75, y1: WORLD_H - 0.25 }; // COURTYARD
    const you = gaPersonLabel({ x: 4.4, y: 8.3 }, measure('YOU'), size, [zone], { w: measure('GRAVEL · TAKE 3'), size });
    assert.ok(you.note);
    for (const l of [you, you.note]) {
      assert.ok(inPicture(l.box));
      assert.ok(l.box.y1 <= WORLD_H - 0.3 && l.box.y0 >= 0.3, 'clear of the top and bottom edge');
      assert.ok(!gaBoxesHit(l.box, zone));
    }
    assert.ok(!gaBoxesHit(you.box, you.note.box, 0), 'the two lines do not overlap');
    assert.ok(you.note.baseline < you.baseline && you.baseline < 8.3, 'here: above the figure, the note furthest out');
    const guide = gaPersonLabel({ x: 11.2, y: 5 }, measure('GUIDE'), size, [], { w: measure('WOOD FLOOR · TAKE 4'), size });
    assert.ok(guide.note && guide.note.baseline > guide.baseline && guide.baseline > 5, 'with room below: under the figure, the note furthest out');
  });

  it('a person’s label moves above the figure when the place below is taken', () => {
    const c = { x: 5, y: 5 };
    const below = gaPersonLabel(c, 1, size, []);
    assert.ok(below.baseline > c.y);
    const above = gaPersonLabel(c, 1, size, [below.box]);
    assert.ok(above.baseline < c.y);
  });
});

describe('the scene: what a page can ask for', () => {
  it('the foot that stepped: the surface the SOUND was chosen for, and the take', () => {
    const s = run(gaInitial(), 5, { type: 'step', who: 'player', dx: 0, dy: 0 });
    const [m] = gaFootMarks(s);
    assert.equal(m.who, 'player');
    assert.equal(m.surface, 'STONE PATH', 'YOU start on the stone path');
    assert.ok(m.take >= 1);
    assert.equal(gaFootText(m, { surface: true }), 'STONE PATH');
    assert.equal(gaFootText(m, { take: true }), `TAKE ${m.take}`);
    assert.equal(gaFootText(m, { surface: true, take: true }), `STONE PATH · TAKE ${m.take}`);
    assert.equal(gaFootText(m, {}), '');
  });
  it('with the surface switch set for everyone, the guide’s foot shows YOUR surface (the symptom, in words)', () => {
    const s = run(gaInitial(), 5, { type: 'fault', patch: { globalSurface: true } }, { type: 'step', who: 'guide', dx: 0, dy: 0 });
    const m = gaFootMarks(s).find((x) => x.who === 'guide')!;
    assert.equal(m.surface, 'STONE PATH', 'the guide stands on wood, and the sound chosen is for stone');
  });
  it('the beds: the bed of the listener’s zone at its level, the other at zero', () => {
    const off = gaBedMarks(gaInitial());
    assert.deepEqual([off.yard.playing, off.room.playing], [false, false]);
    const on = run(gaInitial(), 2, { type: 'scene', on: true });
    const yard = gaBedMarks(on);
    assert.ok(yard.yard.playing && yard.room.playing, 'both beds have a voice');
    assert.ok(yard.yard.level > 0);
    assert.equal(yard.room.level, 0);
    const inside = run(on, 3, { type: 'door' }, { type: 'move', who: 'player', x: 11, y: 5 });
    const room = gaBedMarks(inside);
    assert.equal(room.yard.level, 0);
    assert.ok(room.room.level > 0);
    const muted = gaBedMarks(run(on, 4, { type: 'bus', bus: 'ambience', mute: true }));
    assert.equal(muted.yard.level, 0, 'a muted bed is drawn at zero, and still playing');
    assert.equal(muted.yard.playing, true);
  });
  it('front or behind: more than 90° from straight ahead is behind', () => {
    const s = gaInitial();
    assert.equal(gaSelectedBehind(s, 'generator-1'), false, 'YOU face east; the generator is ahead');
    assert.equal(gaSelectedBehind(run(s, 1, { type: 'face', who: 'player', facing: 270 }), 'generator-1'), true);
    assert.equal(gaSelectedBehind(s, 'fountain'), true, 'the fountain is behind YOU at the start');
    assert.equal(gaSelectedBehind(s, null), null);
    assert.equal(gaSelectedBehind(s, 'guide'), null);
    assert.equal(gaSelectedBehind(run(s, 1, { type: 'listener', mode: 'camera' }), 'fountain'), null, 'a camera has no front and back here');
  });
});

describe('the scene in words (the accessibility summary)', () => {
  it('uses US spelling and names the mood only when it is alert', () => {
    const s = gaInitial();
    const t = gaSceneSummary(s, 0);
    assert.match(t, /meters\./);
    assert.doesNotMatch(t, /metres/);
    assert.match(t, /Nothing positioned is sounding\./);
    assert.doesNotMatch(t, /mood/);
    assert.match(gaSceneSummary(run(s, 1, { type: 'mood', mood: 'alert' }), 1), /The mood is alert\./);
  });
  it('does not call a late layer "sounding" before it sounds', () => {
    const s = run(gaInitial(), 10, { type: 'fault', patch: { missingDoor: true } }, { type: 'door' });
    assert.match(gaSceneSummary(s, 10.2), /Nothing positioned is sounding\./);
    assert.match(gaSceneSummary(s, 11.1), /Sounding now: the door\./);
  });
});

describe('the glass: the scene and the strip under it', () => {
  it('on a phone the strip is its contract height and the scene keeps 16:10, inside the glass', () => {
    for (const [w, h] of [[362, 275], [362, 251], [320, 230], [400, 294]]) {
      for (const hud of [true, false]) {
        const g = gaGlassSplit(w, h, hud, false);
        assert.equal(g.hudH, hud ? GA_HUD_H : 0);
        assert.equal(g.hudH + g.sceneH, h, 'the strip sits directly under the scene’s part');
        assert.ok(Math.abs(g.sceneW / g.sceneDrawH - 1.6) < 1e-9);
        assert.ok(g.sceneW <= w - GA_GLASS_PAD * 2 + 1e-9 && g.sceneDrawH <= g.sceneH - GA_GLASS_PAD * 2 + 1e-9, 'the scene never overlaps the strip or the bezel');
      }
    }
  });
  it('in FULL SCREEN the canvas has the shape of scene + strip, so the scene is not made smaller', () => {
    for (const drawW of [370, 555, 740, 1110]) {
      const w = drawW + GA_GLASS_PAD * 2;
      const h = drawW / GA_SPLIT_ASPECT + GA_GLASS_PAD * 2;
      const g = gaGlassSplit(w, h, true, true);
      assert.ok(g.sceneW > drawW - 2, `at ${drawW} wide the scene fills the width (${g.sceneW})`);
      assert.ok(g.hudH >= GA_HUD_H, 'the strip is never under its phone height');
      assert.ok(Math.abs(g.hudH - drawW * (GA_HUD_H / 360)) <= 1, 'and it grows with the picture');
    }
  });
});

describe('the activity log: one clean label per line (L-02, W1 F16)', () => {
  it('drops the kind word from the text, whichever way the text carries it', () => {
    assert.deepEqual(gaLogRow('start', 'START Door · door → sfx bus'), { word: 'START', text: 'Door · door → sfx bus' });
    assert.deepEqual(gaLogRow('start', 'START (not heard: sound is off) Door · door → sfx bus'), { word: 'START', text: 'Door · door → sfx bus (not heard: sound is off)' });
    assert.deepEqual(gaLogRow('start', 'Door · door → effects bus (not heard: sound is off)'), { word: 'START', text: 'Door · door → effects bus (not heard: sound is off)' });
    assert.equal(gaLogRow('state', 'STATE mood = alert (a global state)').text, 'mood = alert (a global state)');
    assert.equal(gaLogRow('music', 'music: STOP').text, 'STOP');
    assert.equal(gaLogRow('music', 'music: three layers START together').text, 'three layers START together');
    assert.equal(gaLogRow('net', 'network: action A1 arrived AGAIN').text, 'action A1 arrived AGAIN');
    assert.equal(gaLogRow('refused', 'Crate impact REFUSED: all 8 voices are in use').text, 'Crate impact: all 8 voices are in use');
  });
  it('leaves every other word alone', () => {
    assert.equal(gaLogRow('trigger', 'TRIGGER foot contact · YOU').text, 'TRIGGER foot contact · YOU', 'TRIGGER is the lab’s own term under GAME');
    assert.equal(gaLogRow('trigger', 'STOP ALL: every instance is stopped').text, 'STOP ALL: every instance is stopped');
    assert.equal(gaLogRow('stop', 'voice STOLEN from Generator (i3)').text, 'voice STOLEN from Generator (i3)');
    assert.equal(gaLogRow('state', 'ZONE: the listener entered the workshop').text, 'ZONE: the listener entered the workshop');
    assert.equal(gaLogRow('mix', 'DUCK on: a line is speaking').text, 'DUCK on: a line is speaking');
    assert.equal(gaLogRow('stop', 'stopped by the budget').text, 'stopped by the budget', 'a word that only BEGINS like the kind word stays');
    assert.equal(gaLogRow('music', 'MUSIC').text, 'MUSIC', 'a line is never emptied');
  });
  it('no line the real model writes shows its kind word twice', () => {
    let s = gaInitial();
    const script: GaAction[] = [
      { type: 'door' },
      { type: 'step', who: 'player' },
      { type: 'machine', id: 'generator-1', on: true },
      { type: 'speed', id: 'generator-1', value: 0.8 },
      { type: 'mood', mood: 'alert' },
      { type: 'scene', on: true },
      { type: 'musicStart' },
      { type: 'musicLayer', layer: 'pulse', on: true },
      { type: 'stinger' },
      { type: 'musicStop' },
      { type: 'bus', bus: 'sfx', mute: true },
      { type: 'bus', bus: 'sfx', mute: false },
      { type: 'post', event: 'vo_greeting', owner: 'guide' },
      { type: 'post', event: 'vo_greeting', owner: 'guide' },
      { type: 'net', id: 'A1', what: 'door', to: 'world' },
      { type: 'tick', t: 40 },
      { type: 'net', id: 'A1', what: 'door', to: 'world' },
      { type: 'tick', t: 45 },
      { type: 'voiceLimit', limit: 2 },
      { type: 'burst', count: 6 },
      { type: 'alarm', on: true },
      { type: 'listener', mode: 'camera' },
      { type: 'stopAll' },
    ];
    const seen = new Set<GaLogKind>();
    script.forEach((a, k) => {
      s = gaReduce(s, a, a.type === 'tick' ? a.t : 30 + k * 0.5).state;
    });
    assert.ok(s.log.length > 20);
    for (const l of s.log) {
      seen.add(l.kind);
      const word = GA_LOG_KIND_WORD[l.kind];
      const row = gaLogRow(l.kind, l.text);
      assert.equal(row.word, word);
      assert.ok(row.text.length > 0);
      assert.doesNotMatch(row.text, new RegExp(`^${word}\\b`, 'i'), `${word} | ${row.text}`);
      assert.doesNotMatch(row.text, new RegExp(`\\b${word}:`), `${word} | ${row.text}`);
      assert.equal(gaLogSpoken(l.kind, l.text), `${word}: ${row.text}`);
    }
    for (const k of ['trigger', 'start', 'state', 'music', 'mix'] as GaLogKind[]) assert.ok(seen.has(k), `the script wrote a ${k} line`);
  });
});

describe('the activity log: the time column and the empty log (W1 F06, W2-22)', () => {
  it('the time is at most 7 characters, so it never wraps in its cell', () => {
    assert.equal(gaLogTime(0), '0.0s');
    assert.equal(gaLogTime(399.94), '399.9s');
    assert.equal(gaLogTime(1000), '1000.0s');
    assert.equal(gaLogTime(9999.9), '9999.9s');
    assert.equal(gaLogTime(12345.6), '12346s');
    for (const t of [0, 9.99, 99.99, 999.99, 1000, 5432.1, 9999.94, 9999.96, 86400, 99999.4]) assert.ok(gaLogTime(t).length <= 7, gaLogTime(t));
    const css = src('src/screens/lab/gameaudio/bits.tsx');
    const width = Number(/logTime: \{ width: (\d+)/.exec(css)![1]);
    // 11 pt Share Tech Mono: "1000.0s" measured 41.6 pt on the page (audit 2)
    assert.ok(width >= 44, `the cell (${width}) holds 7 characters`);
    // one line, by the house helper: it may shrink to 9 pt, it never wraps or ends in "…"
    assert.match(css, /style=\{styles\.logTime\} \{\.\.\.fitValue\(11\)\}/);
  });
  it('an empty FILTERED log never says nothing has happened while other things have', () => {
    assert.equal(gaLogEmpty(undefined, 0), 'Nothing has happened yet. Use the controls at the bottom.');
    const some = gaLogEmpty(['mix', 'failed'], 3);
    assert.doesNotMatch(some, /Nothing has happened/);
    assert.match(some, /^No MIX or FAULT line yet\./);
    assert.match(gaLogEmpty(['state', 'mix', 'failed'], 0), /^Nothing has happened yet\. This log shows only STATE, MIX or FAULT lines\.$/);
    assert.match(gaLogEmpty(['mix'], 9), /^No MIX line yet\. This log shows only that kind of line/);
  });
  it('counts read right for one and for many (W2-30)', () => {
    assert.equal(gaCount(1, 'instance'), '1 instance');
    assert.equal(gaCount(0, 'instance'), '0 instances');
    assert.equal(gaCount(2, 'voice'), '2 voices');
  });
});

describe('the rack wrapper and the furniture, from their source', () => {
  const lab = src('src/screens/lab/gameaudio/GaLab.tsx');
  const bits = src('src/screens/lab/gameaudio/bits.tsx');
  const scene = src('src/screens/lab/gameaudio/scene/GaScene.tsx');
  it('SOUND, when on, switches sound OFF: it is not a second STOP (SND F7)', () => {
    assert.match(lab, /if \(sound === 'on'\) disableSound\(\);/);
    assert.match(lab, /disableSound: disable\b/);
    assert.doesNotMatch(lab, /if \(sound === 'on'\) stopAll\(\)/);
  });
  it('no check-only code was left behind', () => {
    for (const t of [lab, bits, scene]) assert.doesNotMatch(t, /TEMP-SC|__gaDispatch|console\.log/);
  });
  it('the readouts are spoken with the right number word, and no builder’s word is shown', () => {
    assert.match(lab, /gaCount\(s\.inst\.length, 'instance'\)/);
    assert.doesNotMatch(lab, /instances playing`/);
    assert.doesNotMatch(lab, /NO ENGINE/);
  });
  it('the scene takes what a page asks for, and nothing is on unless asked', () => {
    assert.match(lab, /show=\{spec\.show\}/);
    assert.match(scene, /show = NO_SHOW/);
    for (const k of ['ids', 'mood', 'guideListens', 'surface', 'take', 'beds']) assert.match(scene, new RegExp(`\\n  ${k}\\?: boolean;`), `GaSceneShow.${k} is optional`);
  });
  it('the scene obeys reduced motion and never draws text under 9 pt', () => {
    assert.match(scene, /useDecorativeMotion\(\)/);
    assert.match(scene, /size \* f\.s < MIN_TEXT_PT - 1e-3\) return null/);
    assert.doesNotMatch(scene, /withRepeat\(/);
  });
  it('the furniture’s words: US usage, no em dash in a heading, one clean log label', () => {
    assert.doesNotMatch(bits, /put it right|The fault is in\./);
    assert.doesNotMatch(bits, /SCREEN — TAP|LOG — NEWEST/);
    assert.match(bits, /gaLogRow\(r\.kind, r\.text\)/);
    assert.match(bits, /gaLogEmpty\(only, state\.log\.length\)/);
  });
});
