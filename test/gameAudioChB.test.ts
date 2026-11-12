/**
 * Game Audio lab, chapter 2 (pages 6–10) — the pure files the pages read:
 * pages/data/chbPipeline.ts (page 6's chain) and pages/data/chbScene.ts
 * (routes, orphans, local scope, takes, beds).
 *
 * Each test drives the lab's own reducer and checks what a page SHOWS or
 * JUDGES against what the model really did. The last group pins the fact
 * names the five pages judge their goals from: a renamed fact fails here,
 * not silently on a learner's goal chip.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { GA_EVENTS } from '../src/screens/lab/gameaudio/model/gaDefs.ts';
import { gaFact, gaInitial, gaReduce, surfaceOf, type GaAction, type GaState } from '../src/screens/lab/gameaudio/model/gaModel.ts';
import { WALL_X, surfaceAt, zoneAt } from '../src/screens/lab/gameaudio/model/gaWorld.ts';
import { gaAsset } from '../src/screens/lab/gameaudio/sounds/gaSoundBank.ts';
import { CHB_MISSING_FILE, doorChain, doorChainSummary } from '../src/screens/lab/gameaudio/pages/data/chbPipeline.ts';
import {
  CHB_DOORSTEP,
  CHB_FOOTSTEP_ASSETS,
  CHB_PLACES,
  chbBeds,
  chbDoorLayers,
  chbGuideOwnSurface,
  chbLoops,
  chbNoteTakes,
  chbOrphans,
  chbPlaceOf,
  chbRoute,
  chbSteps,
  chbTakeOf,
  type ChbPlaceId,
  type ChbTake,
} from '../src/screens/lab/gameaudio/pages/data/chbScene.ts';

/** Run actions on the model with sound off (the lab works unheard). */
function run(s: GaState, ...actions: GaAction[]): GaState {
  let t = s.t;
  for (const a of actions) {
    t += 0.05;
    s = gaReduce(s, a, t).state;
  }
  return s;
}
const fresh = () => gaInitial();
const texts = (s: GaState) => s.log.map((l) => l.text);
const stepInPlace = (who: 'player' | 'guide' = 'player'): GaAction => ({ type: 'step', who, dx: 0, dy: 0 });
const go = (s: GaState, to: ChbPlaceId): GaState => run(s, ...chbRoute(s.chars.player, s.doorOpen, to).moves);

describe('page 6: the door’s chain is read from the lab’s own records', () => {
  it('the three cards name the real file, event, layers, bus and priority', () => {
    const c = doorChain(false);
    assert.deepEqual(c.cards.map((x) => x.head), ['ASSET RECORD', 'EVENT', 'SCENE CONNECTION']);
    const rows = (i: number) => c.cards[i].rows.map((r) => r.v).join(' | ');
    assert.ok(rows(0).includes(gaAsset('door')!.file));
    assert.ok(rows(0).includes('in the app'));
    assert.ok(rows(1).includes(GA_EVENTS.door_open.name));
    assert.ok(rows(1).includes(gaAsset('door_rattle')!.file), 'the second layer names its own file');
    assert.ok(rows(1).includes(String(GA_EVENTS.door_open.priority)));
    assert.ok(rows(1).includes(GA_EVENTS.door_open.bus));
    assert.equal(c.broken, false);
    assert.ok(!c.cards.some((x) => x.rows.some((r) => r.bad)));
    assert.ok(doorChainSummary(c).includes('Every link is in place'));
  });
  it('with the fault the event asks for the name the model’s FAULT line prints, and the asset record is unchanged', () => {
    const c = doorChain(true);
    assert.equal(c.broken, true);
    assert.deepEqual(c.cards[0], doorChain(false).cards[0], 'the imported file never left the project');
    const bad = c.cards[1].rows.filter((r) => r.bad);
    assert.equal(bad.length, 1);
    assert.ok(bad[0].v.includes(CHB_MISSING_FILE));
    assert.equal(gaAsset(CHB_MISSING_FILE), undefined, 'the build really has no such file');
    const s = run(fresh(), { type: 'fault', patch: { missingDoor: true } }, { type: 'door' });
    assert.ok(texts(s).some((t) => t.includes(`"${CHB_MISSING_FILE}"`) && t.includes('NOT IN THE BUILD')));
    assert.ok(doorChainSummary(c).includes('broken'));
  });
});

describe('places and routes', () => {
  it('each place is on the surface it is named for', () => {
    assert.equal(surfaceAt(CHB_PLACES.stone), 'stone');
    assert.equal(surfaceAt(CHB_PLACES.gravel), 'gravel');
    assert.equal(surfaceAt(CHB_PLACES.workshop), 'wood');
    assert.equal(zoneAt(CHB_DOORSTEP.yard), 'yard');
    assert.equal(zoneAt(CHB_DOORSTEP.room), 'room');
  });
  it('with the door open every route arrives exactly at its place', () => {
    const ids: ChbPlaceId[] = ['stone', 'gravel', 'workshop'];
    for (const from of ids) {
      for (const to of ids) {
        let s = run(fresh(), { type: 'door' });
        s = go(s, from);
        assert.equal(chbPlaceOf(s.chars.player), from, `start at ${from}`);
        const r = chbRoute(s.chars.player, s.doorOpen, to);
        assert.equal(r.blocked, false);
        s = run(s, ...r.moves);
        assert.deepEqual({ x: s.chars.player.x, y: s.chars.player.y }, CHB_PLACES[to], `${from} → ${to}`);
      }
    }
  });
  it('with the door closed a change of zone stops at the door, on the side it began', () => {
    let s = fresh();
    const out = chbRoute(s.chars.player, false, 'workshop');
    assert.equal(out.blocked, true);
    s = run(s, ...out.moves);
    assert.equal(zoneAt(s.chars.player), 'yard');
    assert.ok(s.chars.player.x < WALL_X - 0.5);
    assert.equal(chbPlaceOf(s.chars.player), 'stone');
    // and from the inside
    s = go(run(fresh(), { type: 'door' }), 'workshop');
    s = run(s, { type: 'door' });
    const back = chbRoute(s.chars.player, s.doorOpen, 'gravel');
    assert.equal(back.blocked, true);
    s = run(s, ...back.moves);
    assert.equal(zoneAt(s.chars.player), 'room');
    assert.ok(s.chars.player.x > WALL_X + 0.5);
  });
  it('a route through the open door crosses the zone once', () => {
    let s = run(fresh(), { type: 'door' });
    const before = gaFact(s, 'zoneCross');
    s = go(s, 'workshop');
    assert.equal(gaFact(s, 'zoneCross') - before, 1);
  });
});

describe('page 7: orphans', () => {
  const twoRunning = () => run(fresh(), { type: 'addMachine' }, { type: 'machine', id: 'generator-1', on: true }, { type: 'machine', id: 'generator-2', on: true });
  it('a clean removal leaves no orphan and the other generator plays on', () => {
    const s = run(twoRunning(), { type: 'removeMachine', id: 'generator-2' });
    assert.equal(chbOrphans(s).length, 0);
    assert.equal(gaFact(s, 'cleanRemove'), 1);
    assert.ok(s.inst.some((i) => i.event === 'generator' && i.owner === 'generator-1'));
  });
  it('with the fault the removed machine’s loop is an orphan until STOP', () => {
    let s = run(twoRunning(), { type: 'fault', patch: { orphanLoop: true } }, { type: 'removeMachine', id: 'generator-2' });
    assert.equal(chbOrphans(s).length, 1);
    assert.equal(chbOrphans(s)[0].owner, 'generator-2');
    assert.ok(texts(s).some((t) => t.includes('ORPHAN')));
    s = run(s, { type: 'stopAll' });
    assert.equal(chbOrphans(s).length, 0);
  });
});

describe('page 8: the switch is local', () => {
  it('true while the guide reads its own surface and you stand on another', () => {
    let s = go(fresh(), 'gravel');
    assert.equal(chbGuideOwnSurface(s), true);
    s = run(s, { type: 'fault', patch: { globalSurface: true } });
    assert.equal(surfaceOf(s, 'guide'), 'gravel');
    assert.equal(chbGuideOwnSurface(s), false, 'the planted fault never proves local scope');
  });
  it('false when both stand on the same surface', () => {
    const s = go(run(fresh(), { type: 'door' }), 'workshop');
    assert.equal(chbGuideOwnSurface(s), false);
  });
  it('steps are counted per character over every surface', () => {
    let s = run(fresh(), stepInPlace('player'), stepInPlace('guide'));
    s = run(go(s, 'gravel'), stepInPlace('player'));
    assert.equal(chbSteps(s, 'player'), 2);
    assert.equal(chbSteps(s, 'guide'), 1);
  });
});

describe('page 9: the takes that played', () => {
  /** Step n times, noting the takes after every step as the page does. */
  function walk(s: GaState, n: number): { s: GaState; takes: readonly ChbTake[] } {
    let takes: readonly ChbTake[] = [];
    for (let k = 0; k < n; k++) {
      s = run(s, stepInPlace());
      takes = chbNoteTakes(takes, s, 'player', 100);
      // the one-shot ends before the next step
      for (const v of s.voices.filter((x) => !x.loop)) s = run(s, { type: 'expire', v: v.v });
    }
    return { s, takes };
  }
  it('a footstep asset names its surface and take; nothing else does', () => {
    assert.deepEqual(chbTakeOf('fs_stone_3'), { surface: 'stone', take: 3 });
    assert.equal(chbTakeOf('door'), null);
    assert.equal(chbTakeOf('fs_sand_1'), null);
    for (const id of CHB_FOOTSTEP_ASSETS) assert.ok(gaAsset(id) && chbTakeOf(id), id);
    assert.equal(CHB_FOOTSTEP_ASSETS.length, 12);
  });
  it('variation off: the same take every time, and every step after the first is a repeat', () => {
    const { takes } = walk(run(fresh(), { type: 'option', patch: { variation: false } }), 5);
    assert.deepEqual(takes.map((t) => t.take), [1, 1, 1, 1, 1]);
    assert.deepEqual(takes.map((t) => t.repeat), [false, true, true, true, true]);
  });
  it('variation on with avoid-repeat: no take twice in a row, and at least three different takes', () => {
    const { takes } = walk(fresh(), 40);
    assert.equal(takes.length, 40);
    assert.ok(!takes.some((t) => t.repeat));
    assert.ok(new Set(takes.map((t) => t.take)).size >= 3);
  });
  it('avoid-repeat off: an immediate repeat can happen', () => {
    const { takes } = walk(run(fresh(), { type: 'option', patch: { avoidRepeat: false } }), 60);
    assert.ok(takes.some((t) => t.repeat));
  });
  it('noting twice adds nothing, and the strip keeps only the newest', () => {
    const s = run(fresh(), stepInPlace());
    const once = chbNoteTakes([], s);
    assert.equal(once.length, 1);
    assert.equal(chbNoteTakes(once, s), once);
    const { takes } = (() => {
      let st = fresh();
      let tk: readonly ChbTake[] = [];
      for (let k = 0; k < 14; k++) {
        st = run(st, stepInPlace());
        tk = chbNoteTakes(tk, st, 'player', 10);
        for (const v of st.voices.filter((x) => !x.loop)) st = run(st, { type: 'expire', v: v.v });
      }
      return { takes: tk };
    })();
    assert.equal(takes.length, 10);
  });
  it('one door event starts two layers with the rattle on, one with it off', () => {
    let s = run(fresh(), { type: 'door' });
    assert.equal(chbDoorLayers(s), 2);
    s = run(fresh(), { type: 'option', patch: { doorRattle: false } }, { type: 'door' });
    assert.equal(chbDoorLayers(s), 1);
    assert.equal(chbDoorLayers(fresh()), 0);
  });
});

describe('page 10: beds and loops', () => {
  it('the clean scene plays one copy of each bed', () => {
    const s = run(fresh(), { type: 'scene', on: true });
    assert.deepEqual(chbBeds(s), { room: 1, yard: 1, raw: false });
    assert.equal(chbLoops(s), 3, 'two beds and the fountain');
  });
  it('the raw cut replaces the courtyard bed, still one copy', () => {
    const s = run(fresh(), { type: 'scene', on: true }, { type: 'option', patch: { rawYardLoop: true } });
    assert.deepEqual(chbBeds(s), { room: 1, yard: 1, raw: true });
    assert.equal(gaFact(s, 'take:bed_yard::amb_yard_raw'), 1);
  });
  it('with the fault every position update inside the zone stacks a copy; STOP clears them all', () => {
    let s = run(fresh(), { type: 'scene', on: true }, { type: 'fault', patch: { bedPileUp: true } }, stepInPlace(), stepInPlace(), stepInPlace());
    assert.equal(chbBeds(s).yard, 4);
    assert.equal(gaFact(s, 'bedPileUp'), 3);
    s = run(s, { type: 'stopAll' });
    assert.deepEqual(chbBeds(s), { room: 0, yard: 0, raw: false });
    assert.equal(chbLoops(s), 0);
  });
  it('a crossing is one cross-fade and starts no bed', () => {
    let s = run(fresh(), { type: 'scene', on: true }, { type: 'door' });
    s = go(s, 'workshop');
    assert.deepEqual(chbBeds(s), { room: 1, yard: 1, raw: false });
    const zone = texts(s).filter((t) => t.startsWith('ZONE:'));
    assert.equal(zone.length, 1);
    assert.ok(zone[0].includes('ONE cross-fade of the ambience beds'), 'what page 10 says a crossing prints');
  });
  it('a crossing with no bed playing fades nothing and is not counted as a cross-fade', () => {
    const s = go(run(fresh(), { type: 'door' }), 'workshop');
    assert.equal(gaFact(s, 'zoneCross'), 1);
    assert.equal(gaFact(s, 'zoneCrossFade'), 0, 'page 10’s crossing goal needs the scene running');
    assert.ok(texts(s).some((t) => t.startsWith('ZONE:') && t.includes('nothing fades')));
  });
  it('the wind-file swap is named in the log by a MIX line', () => {
    const s = run(fresh(), { type: 'scene', on: true }, { type: 'option', patch: { rawYardLoop: true } });
    assert.ok(s.log.some((l) => l.kind === 'mix' && /^SETTING courtyard wind file with no loop preparation: ON$/.test(l.text)));
    assert.ok(texts(s).some((t) => t.includes('the loop file was swapped')));
  });
});

describe('what the pages rely on from the page-open reset', () => {
  const planted: GaAction[] = [
    { type: 'fault', patch: { missingDoor: true, globalSurface: true, orphanLoop: true, bedPileUp: true } },
    { type: 'option', patch: { variation: false, avoidRepeat: false, doorRattle: false, rawYardLoop: true } },
    { type: 'listener', mode: 'camera' },
  ];
  it('no planted fault and no changed setting of pages 6–10 survives the next page opening', () => {
    const before = run(fresh(), { type: 'scene', on: true }, ...planted);
    const s = run(before, { type: 'enterPage' });
    assert.deepEqual(s.faults, { missingDoor: false, voWrongBus: false, globalSurface: false, orphanLoop: false, bedPileUp: false });
    assert.equal(s.options.variation, true);
    assert.equal(s.options.avoidRepeat, true);
    assert.equal(s.options.doorRattle, true);
    assert.equal(s.options.rawYardLoop, false);
    assert.equal(s.listenerMode, 'player', 'page 10’s zones follow the player with no control for it');
  });
  it('a page opens on the clean scene its steps are written from, and no fact moves', () => {
    let before = run(fresh(), { type: 'scene', on: true }, { type: 'door' }, { type: 'addMachine' }, { type: 'machine', id: 'generator-2', on: true }, { type: 'mood', mood: 'alert' }, ...planted);
    before = go(before, 'workshop');
    const s = run(before, { type: 'enterPage' });
    assert.deepEqual(s.facts, before.facts, 'goals are judged from facts counted since the page opened');
    // page 6 and page 9: "Press OPEN DOOR"; page 10: "choose OPEN DOOR"
    assert.equal(s.doorOpen, false);
    // pages 8, 9 and 10: YOU on the stone path, facing the door; the guide on wood
    assert.equal(chbPlaceOf(s.chars.player), 'stone');
    assert.equal(s.chars.player.facing, 90);
    assert.equal(surfaceAt(s.chars.guide), 'wood');
    // page 7: one generator, off; page 8: "choose GENERATOR 1 · ON", "choose ALERT"
    assert.deepEqual(s.machines.map((m) => [m.id, m.on]), [['generator-1', false]]);
    assert.equal(s.mood, 'calm');
    // page 10: "switch SCENE on"; nothing plays and the log is empty
    assert.deepEqual(chbBeds(s), { room: 0, yard: 0, raw: false });
    assert.equal(s.inst.length, 0);
    assert.equal(s.log.length, 0);
  });
  it('from the clean scene, page 10’s walk crosses the doorway by STEP alone once the door is open', () => {
    let s = run(run(fresh(), { type: 'enterPage' }), { type: 'scene', on: true }, { type: 'door' });
    let n = 0;
    while (zoneAt(s.chars.player) === 'yard' && n < 12) {
      s = run(s, { type: 'step', who: 'player' });
      n++;
    }
    assert.equal(zoneAt(s.chars.player), 'room');
    assert.ok(n <= 8, `${n} steps`);
    assert.equal(gaFact(s, 'zoneCrossFade'), 1);
  });
});

describe('the log lines pages 6, 7 and 9 describe', () => {
  it('page 6: the FAULT line names the file and says the LAYER cannot play; the rattle still starts', () => {
    const s = run(fresh(), { type: 'fault', patch: { missingDoor: true } }, { type: 'door' });
    assert.ok(s.log.some((l) => l.kind === 'failed' && l.text.includes(`"${CHB_MISSING_FILE}"`) && l.text.includes('this layer cannot play')));
    assert.ok(s.log.some((l) => l.kind === 'start' && l.text.includes('rattle')));
    assert.ok(s.log.some((l) => l.kind === 'trigger' && l.text.startsWith('EVENT Play_Door')), 'the event was still posted');
  });
  it('page 7: adding generator 2 back under an orphan loop makes it that machine’s sound again', () => {
    let s = run(fresh(), { type: 'addMachine' }, { type: 'machine', id: 'generator-2', on: true }, { type: 'fault', patch: { orphanLoop: true } }, { type: 'removeMachine', id: 'generator-2' });
    assert.equal(chbOrphans(s).length, 1);
    s = run(s, { type: 'addMachine' });
    assert.equal(chbOrphans(s).length, 0);
    assert.equal(s.machines.find((m) => m.id === 'generator-2')?.on, true, 'the tray shows it running, so STOP 2 reaches the loop');
  });
  it('page 9: each setting prints a MIX line when it really changes; a step with variation off reads take 1 of 4', () => {
    let s = run(fresh(), { type: 'option', patch: { variation: false } });
    assert.ok(s.log.some((l) => l.kind === 'mix' && l.text === 'SETTING variation (use every take): OFF'));
    const n = s.log.length;
    s = run(s, { type: 'option', patch: { variation: false } });
    assert.equal(s.log.length, n, 'no line when nothing changed');
    s = run(s, { type: 'option', patch: { avoidRepeat: false } }, { type: 'option', patch: { doorRattle: false } }, stepInPlace());
    assert.ok(texts(s).includes('SETTING avoid repeat: OFF'));
    assert.ok(texts(s).includes('SETTING door rattle layer: OFF'));
    assert.ok(texts(s).some((t) => t.includes('take 1 of 4')));
  });
  it('page 9: one door event, one EVENT line, two START lines with the rattle on', () => {
    const s = run(fresh(), { type: 'door' });
    assert.equal(texts(s).filter((t) => t.startsWith('EVENT Play_Door')).length, 1);
    assert.equal(s.log.filter((l) => l.kind === 'start').length, 2);
    assert.ok(texts(s).some((t) => t.includes('rattle, 1 s later')));
  });
});

describe('the facts chapter 2’s goals are judged from exist in the model', () => {
  it('page 6', () => {
    let s = run(fresh(), { type: 'door' });
    assert.equal(gaFact(s, 'take:door_open::door'), 1);
    s = run(s, { type: 'fault', patch: { missingDoor: true } }, { type: 'door' });
    assert.equal(gaFact(s, 'missingAsset'), 1);
    assert.equal(gaFact(s, 'take:door_open::door'), 1, 'the door layer did not start while its file was missing');
    s = run(s, { type: 'fault', patch: { missingDoor: false } }, { type: 'door' });
    assert.equal(gaFact(s, 'take:door_open::door'), 2);
  });
  it('page 7', () => {
    let s = run(fresh(), { type: 'addMachine' }, { type: 'machine', id: 'generator-1', on: true }, { type: 'machine', id: 'generator-2', on: true });
    assert.equal(gaFact(s, 'inst:generator'), 2);
    s = run(s, { type: 'speed', id: 'generator-2', value: 0.8 });
    assert.equal(gaFact(s, 'speed:generator-2'), 1);
    assert.equal(gaFact(s, 'speed:generator-1'), 0);
    assert.notEqual(s.machines[0].speed, s.machines[1].speed);
    s = run(s, { type: 'machine', id: 'generator-1', on: false });
    assert.equal(gaFact(s, 'machineStopped'), 1);
    s = run(s, { type: 'fault', patch: { orphanLoop: true } }, { type: 'removeMachine', id: 'generator-2' });
    assert.equal(gaFact(s, 'orphan'), 1);
  });
  it('page 8', () => {
    let s = run(fresh(), stepInPlace('player'), stepInPlace('guide'));
    assert.equal(gaFact(s, 'step:player:stone'), 1);
    assert.equal(gaFact(s, 'step:guide:wood'), 1);
    s = run(s, { type: 'machine', id: 'generator-1', on: true }, { type: 'speed', id: 'generator-1', value: 0.9 }, { type: 'mood', mood: 'alert' }, { type: 'mood', mood: 'calm' });
    assert.equal(gaFact(s, 'speedWhilePlaying'), 1);
    assert.equal(gaFact(s, 'mood:alert'), 1);
    assert.equal(gaFact(s, 'mood:calm'), 1);
    s = run(go(s, 'gravel'), { type: 'fault', patch: { globalSurface: true } }, stepInPlace('guide'));
    assert.equal(gaFact(s, 'step:guide:gravel'), 1, 'the wrong surface is what the fault card looks for');
  });
  it('page 9', () => {
    const s = run(fresh(), { type: 'option', patch: { variation: false } }, stepInPlace(), { type: 'door' });
    assert.equal(gaFact(s, 'take:footstep:stone:fs_stone_1'), 1);
    assert.equal(gaFact(s, 'post:door_open'), 1);
  });
  it('page 10', () => {
    let s = run(fresh(), { type: 'scene', on: true }, { type: 'door' });
    s = go(s, 'workshop');
    assert.equal(gaFact(s, 'zoneCrossFade'), 1);
    s = go(s, 'stone');
    assert.equal(gaFact(s, 'zoneCrossFade'), 2, 'in and out again: the two crossings the goal asks for');
    s = run(s, { type: 'stopAll' });
    assert.equal(gaFact(s, 'stopAll'), 1);
  });
});
