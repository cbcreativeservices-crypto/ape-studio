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
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { GA_BUS_NAME, GA_EVENTS } from '../src/screens/lab/gameaudio/model/gaDefs.ts';
import { gaFact, gaInitial, gaReduce, surfaceOf, type GaAction, type GaState } from '../src/screens/lab/gameaudio/model/gaModel.ts';
import { WALL_X, surfaceAt, zoneAt } from '../src/screens/lab/gameaudio/model/gaWorld.ts';
import { gaAsset } from '../src/screens/lab/gameaudio/sounds/gaSoundBank.ts';
import { CHB_MISSING_FILE, doorChain, doorChainSummary, doorFile } from '../src/screens/lab/gameaudio/pages/data/chbPipeline.ts';
import {
  CHB_DOORSTEP,
  CHB_FOOTSTEP_ASSETS,
  CHB_P08_LOG,
  CHB_P10_LOG,
  CHB_PLACES,
  chbBeds,
  chbDoorLayers,
  chbGuideOwnSurface,
  chbGuideSurfaceShown,
  chbJoinsPassed,
  chbLoops,
  chbNoteTakes,
  chbOrphans,
  chbPlaceOf,
  chbRawBed,
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
  it('the three cards name the real file, event, layers and the bus by the name on the controls', () => {
    const c = doorChain(false);
    assert.deepEqual(c.cards.map((x) => x.head), ['ASSET RECORD', 'EVENT', 'SCENE CONNECTION']);
    const rows = (i: number) => c.cards[i].rows.map((r) => r.v).join(' | ');
    assert.ok(rows(0).includes(gaAsset('door')!.file));
    assert.ok(rows(0).includes('in the app'));
    assert.ok(rows(1).includes(GA_EVENTS.door_open.name));
    assert.ok(rows(1).includes(gaAsset('door_rattle')!.file), 'the second layer names its own file');
    // the bus as a learner knows it (decision 11), never the model's id; priority is not taught until pages 15 and 17
    assert.ok(rows(1).includes(`${GA_BUS_NAME[GA_EVENTS.door_open.bus]} bus`));
    assert.ok(!c.cards[1].rows.some((r) => r.v === GA_EVENTS.door_open.bus || r.k === 'PRIORITY'));
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
  it('one event, two files: the closing take is door_close.wav, and card 1 and the log agree with the model', () => {
    assert.equal(doorFile(false), 'door_open.wav');
    assert.equal(doorFile(true), 'door_close.wav');
    const closing = doorChain(false, { closing: true });
    assert.equal(closing.cards[0].rows[0].v, 'door_close.wav');
    assert.ok(closing.cards[1].rows.some((r) => r.v.includes('door_close.wav')));
    const s = run(fresh(), { type: 'door' }, { type: 'door' });
    const starts = s.log.filter((l) => l.kind === 'start' && l.text.startsWith('Door · door')).map((l) => l.text);
    assert.equal(starts.length, 2);
    assert.ok(starts[0].includes('door_open.wav') && starts[1].includes('door_close.wav'), 'the START line names the file of each move');
    assert.equal(gaFact(s, 'take:door_open::door') + gaFact(s, 'take:door_open::door_close'), 2, 'page 6 counts both files as the door playing');
    // with the fault, closing asks for the missing name too
    const f = run(fresh(), { type: 'fault', patch: { missingDoor: true } }, { type: 'door' }, { type: 'door' });
    assert.equal(f.log.filter((l) => l.kind === 'failed' && l.text.includes(`"${CHB_MISSING_FILE}"`)).length, 2);
  });
  it('a planted fault does not name itself: unnamed, the chain names no file, with no mark and no verdict (decision 10; bug test B-S1-02)', () => {
    const c = doorChain(true, { named: false });
    assert.equal(c.missing, true);
    assert.equal(c.broken, false);
    assert.ok(!c.cards.some((x) => x.rows.some((r) => r.bad)), 'no red row');
    assert.ok(!c.links.some((l) => /BROKEN|not in the build/i.test(l)));
    assert.ok(!c.cards.some((x) => x.rows.some((r) => r.v.includes(CHB_MISSING_FILE))), 'the wrong file name is not shown before the symptom');
    assert.ok(c.cards[1].rows.some((r) => /^door asks for \?/.test(r.v)), 'the door layer reads "?", as DOOR FILE does');
    assert.ok(!c.cards.some((x) => x.rows.some((r) => /not in the build/.test(r.v))));
    const said = doorChainSummary(c);
    assert.ok(!/broken|in place/i.test(said), said);
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
  it('the planted fault does not name itself: until a guide step uses the wrong surface, the guide shows the floor it stands on', () => {
    let s = go(fresh(), 'gravel');
    s = run(s, { type: 'fault', patch: { globalSurface: true } });
    assert.equal(surfaceOf(s, 'guide'), 'gravel', 'the model already reads the wrong value');
    assert.equal(chbGuideSurfaceShown(s, false), 'wood', 'unnamed: the readout and the table keep the guide’s own floor');
    assert.equal(chbGuideSurfaceShown(s, true), 'gravel', 'named: the true (wrong) value');
    const before = gaFact(s, 'stepWrongSurface');
    s = run(s, stepInPlace('guide'));
    assert.equal(gaFact(s, 'stepWrongSurface') - before, 1, 'the symptom the page waits for is the model’s own count');
    // with no fault, both views are the truth
    const clean = go(fresh(), 'gravel');
    assert.equal(chbGuideSurfaceShown(clean, false), surfaceOf(clean, 'guide'));
  });
  it('page 8’s log shows the GAME lines that carry each switch value, and leaves out START lines', () => {
    assert.ok(CHB_P08_LOG.includes('trigger'));
    assert.ok(!CHB_P08_LOG.includes('start'));
    const s = run(fresh(), stepInPlace('guide'));
    const shown = s.log.filter((l) => CHB_P08_LOG.includes(l.kind)).map((l) => l.text);
    assert.ok(shown.some((t) => t.includes('· GUIDE · SWITCH surface = wood')), shown.join(' / '));
  });
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
    assert.ok(zone[0].includes('ONE crossfade of the ambience beds'), 'what page 10 says a crossing prints');
  });
  it('a crossing with no bed playing fades nothing and is not counted as a cross-fade', () => {
    const s = go(run(fresh(), { type: 'door' }), 'workshop');
    assert.equal(gaFact(s, 'zoneCross'), 1);
    assert.equal(gaFact(s, 'zoneCrossFade'), 0, 'page 10’s crossing goal needs the scene running');
    assert.ok(texts(s).some((t) => t.startsWith('ZONE:') && t.includes('nothing fades')));
  });
  it('the wind-file swap is named in the log by a MIX line', () => {
    const s = run(fresh(), { type: 'scene', on: true }, { type: 'option', patch: { rawYardLoop: true } });
    assert.ok(s.log.some((l) => l.kind === 'mix' && l.text === 'SETTING courtyard wind file: RAW CUT'));
    assert.ok(texts(s).some((t) => t.includes('the loop file was swapped')));
    const back = run(s, { type: 'option', patch: { rawYardLoop: false } });
    assert.ok(back.log.some((l) => l.kind === 'mix' && l.text === 'SETTING courtyard wind file: PREPARED LOOP'));
  });
  it('the raw cut is judged from the clock: its join comes every loop length after that bed started', () => {
    let s = run(fresh(), { type: 'scene', on: true });
    assert.equal(chbRawBed(s), null, 'the prepared loop is playing');
    s = run(s, { type: 'option', patch: { rawYardLoop: true } });
    const raw = chbRawBed(s);
    assert.ok(raw);
    assert.equal(raw.loopS, gaAsset('amb_yard_raw')!.loopS);
    assert.equal(raw.loopS, 10, 'page 10 prints "every 10 s"');
    assert.equal(chbJoinsPassed(raw, raw.born + 9.9), 0, 'no join before one whole pass');
    assert.equal(chbJoinsPassed(raw, raw.born + 10), 1);
    assert.equal(chbJoinsPassed(raw, raw.born + 25), 2);
    assert.equal(chbJoinsPassed(null, 100), 0);
    // choosing RAW CUT alone never meets the goal: no time has passed
    assert.equal(chbJoinsPassed(raw, s.t), 0);
    s = run(s, { type: 'stopAll' });
    assert.equal(chbRawBed(s), null);
  });
  it('the courtyard bed is wind only; the birds are separate one-shots posted while it plays', () => {
    assert.ok(!/bird/i.test(gaAsset('amb_yard')!.label), gaAsset('amb_yard')!.label);
    let s = run(fresh(), { type: 'scene', on: true });
    assert.deepEqual(chbBeds(s), { room: 1, yard: 1, raw: false });
    s = gaReduce(s, { type: 'tick', t: s.t + 20 }, s.t + 20).state;
    assert.ok(gaFact(s, 'inst:bird') >= 1, 'a bird call is its own instance');
    assert.deepEqual(chbBeds(s), { room: 1, yard: 1, raw: false }, 'a bird is not a copy of the bed');
  });
  it('page 10’s log keeps ZONE (STATE), MIX, FAULT and the NOTE that says why a step did nothing; footsteps are left out', () => {
    for (const k of ['state', 'mix', 'failed', 'note'] as const) assert.ok(CHB_P10_LOG.includes(k));
    assert.ok(!CHB_P10_LOG.includes('start') && !CHB_P10_LOG.includes('trigger'));
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
  it('page 7: generator 2 is not placed again over an orphan loop; after ■ STOP it comes in OFF (round 2, R2-GA2-01)', () => {
    let s = run(fresh(), { type: 'addMachine' }, { type: 'machine', id: 'generator-2', on: true }, { type: 'fault', patch: { orphanLoop: true } }, { type: 'removeMachine', id: 'generator-2' });
    assert.equal(chbOrphans(s).length, 1);
    s = run(s, { type: 'addMachine' });
    assert.equal(chbOrphans(s).length, 1, 'the orphan is not taken over');
    assert.equal(s.machines.length, 1);
    assert.equal(s.log[s.log.length - 1].kind, 'refused');
    s = run(s, { type: 'stopAll' }, { type: 'addMachine' });
    assert.equal(s.machines.find((m) => m.id === 'generator-2')?.on, false, 'a new generator starts OFF');
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

const PAGES = ['p06Pipeline', 'p07Instances', 'p08GameSyncs', 'p09Variation', 'p10Loops'] as const;
const src = (f: string) => readFileSync(join(process.cwd(), 'src/screens/lab/gameaudio/pages', `${f}.tsx`), 'utf8').replace(/\r\n/g, '\n');
/** The lesson prose (P, Do, Look, Note), as the learning audit counted it. */
const prose = (f: string): string[] => [...src(f).replace(/\/\*[\s\S]*?\*\//g, '').matchAll(/<(P|Do|Look|Note)(\s[^>]*)?>([\s\S]*?)<\/\1>/g)].map((m) => m[3].replace(/\{[^}]*\}/g, 'X').replace(/\s+/g, ' ').trim());
const words = (t: string) => t.split(/\s+/).filter(Boolean).length;

describe('pages 6–10 as the learner reads them (audit 2)', () => {
  it('page 8: Game Syncs, RTPC and Switch Group are Wwise’s words, and a Wwise Trigger is not a footstep (A1, L-01)', () => {
    const t = prose('p08GameSyncs').join(' ');
    assert.ok(!/often called Game Syncs|These are general meanings/.test(t));
    assert.match(t, /Wwise groups switches, states and parameters as Game Syncs/);
    assert.match(t, /Switch Group/);
    assert.match(t, /FMOD Studio does these jobs with parameters/);
    assert.match(t, /A Wwise Trigger starts a music stinger/);
  });
  it('pages 7 and 8: the speed is kept on the generator and its instance follows it (decision 6, A4)', () => {
    const p7 = prose('p07Instances').join(' ');
    const p8 = prose('p08GameSyncs').join(' ');
    assert.ok(!/stored on that machine’s instance|each instance keeps its own values/.test(p7 + p8));
    assert.match(p7, /kept on the generator, and its instance follows it/);
    assert.match(p7, /Some tools keep such a value on the object, others on the playing instance/);
    assert.match(p8, /kept on one generator, and its instance follows it/);
  });
  it('page 6: three things result, and they are three (L-13); the door’s two files are named', () => {
    const t = prose('p06Pipeline').join(' ');
    assert.ok(!/Three different things result/.test(t));
    assert.match(t, /Three things come out of this work/);
    assert.ok(!/runtime package/.test(t));
  });
  it('page 10: the bed is wind only and the birds are spot sounds; the raw-cut goal is about the join, not a choice', () => {
    const t = prose('p10Loops').join(' ');
    assert.match(t, /The birds are spot sounds: one-shots at random times and places/);
    assert.ok(!/listen for 30 seconds/.test(t));
    assert.match(src('p10Loops'), /label: 'Stay in the courtyard until the raw cut passes its join', hit: yardJoins > 0/);
    assert.ok(!/cross-fade/.test(src('p10Loops')), 'crossfade is one word, as the glossary spells it');
  });
  it('the TROUBLESHOOT card comes before the check, inside step 4, and a step points to it (L-10)', () => {
    for (const f of ['p06Pipeline', 'p07Instances', 'p08GameSyncs', 'p10Loops']) {
      const code = src(f);
      const card = code.indexOf('<FaultCard');
      assert.ok(card > code.indexOf('<Step n={4}>') && card < code.indexOf('<Step n={5}>'), `${f}: the card is in step 4`);
      assert.ok(prose(f).some((x) => /TROUBLESHOOT card/.test(x)), `${f}: a Do line names the card`);
      assert.match(code, /seen=\{/, `${f}: the card is told whether the symptom was seen (decision 10)`);
    }
  });
  it('page 6’s and page 8’s keys and readouts stay as they were until the symptom (decision 10; round 2, R2-GA1-01: no "?", no lock)', () => {
    const p6 = src('p06Pipeline');
    assert.match(p6, /const fileWord = shownMissing \? 'MISSING' : 'FOUND'/);
    assert.doesNotMatch(p6, /locked: unnamed|'\?'/);
    const p8 = src('p08GameSyncs');
    assert.match(p8, /wrong: !unnamed && guideRead !== guideTrue/);
    assert.match(p8, /valueLabel: shownGlobal \? 'GLOBAL' : 'LOCAL'/);
    assert.doesNotMatch(p8, /locked: unnamed|'\?'/);
  });
  it('no check has its correct option as the longest (L-16)', () => {
    let checks = 0;
    for (const f of PAGES) {
      for (const m of src(f).matchAll(/options=\{\[([\s\S]*?)\]\}\s*correct=\{(\d)\}/g)) {
        const opts = [...m[1].matchAll(/'((?:[^'\\]|\\.)*)'/g)].map((x) => x[1]);
        const right = opts[Number(m[2])];
        assert.ok(opts.length >= 3, f);
        assert.ok(opts.some((o, i) => i !== Number(m[2]) && o.length >= right.length), `${f}: “${right}” is the longest option`);
        checks += 1;
      }
    }
    assert.equal(checks, 7, 'pages 6, 7, 8 have one check; pages 9 and 10 have two');
  });
  it('lesson prose is within the plan’s length: 260 words, page 8 at most 290 (it carries the Wwise correction)', () => {
    for (const f of PAGES) {
      const n = prose(f).reduce((a, t) => a + words(t), 0);
      assert.ok(n <= (f === 'p08GameSyncs' ? 290 : 260) && n >= 150, `${f}: ${n} words`);
    }
  });
  it('the learner reads one name for each thing: GENERATORS (not MACHINES), MOOD (not STATE) as the key, COURTYARD / WORKSHOP', () => {
    assert.ok(!/label: 'MACHINES'/.test(src('p07Instances')));
    assert.match(src('p07Instances'), /label: 'GENERATORS'/);
    assert.match(src('p08GameSyncs'), /label: 'MOOD'/);
    assert.ok(!/label: 'STATE'/.test(src('p08GameSyncs')));
    assert.ok(!/'YARD'|'ROOM'/.test(src('p10Loops')));
    assert.ok(!/'YOU ON'|'GUIDE ON'/.test(src('p08GameSyncs')));
  });
  it('no tray on these pages carries a log strip or a note that names a fault (decision 15, decision 10)', () => {
    for (const f of PAGES) assert.ok(!/TrayLog|TrayNote>An instance is playing with no owner/.test(src(f)), f);
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
