/**
 * Game Audio lab, pages 1 and 5 — the sound families and the solo rule
 * (pages/data/gaFamilies.ts), and the model facts those two pages' text and
 * goals rest on. Proven on the pure model; no device.
 *
 * If one of the second half's tests fails, a sentence on page 1 or page 5 is
 * no longer true and must be read again.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { GA_BUSES, type GaBus } from '../src/screens/lab/gameaudio/engine/gaEngineProtocol.ts';
import { GA_EVENTS } from '../src/screens/lab/gameaudio/model/gaDefs.ts';
import { busGain, gaFact, gaInitial, gaPlaying, gaReduce, gaVoiceCount, type GaAction, type GaState } from '../src/screens/lab/gameaudio/model/gaModel.ts';
import { PLACES } from '../src/screens/lab/gameaudio/model/gaWorld.ts';
import { gaAsset } from '../src/screens/lab/gameaudio/sounds/gaSoundBank.ts';
import {
  GA_FAMILIES,
  GA_FAMILIES_TO_TRY,
  GA_FAMILY_FACTS,
  GA_SOLO_CATEGORIES,
  gaFamiliesTried,
  gaSoloNow,
  gaSoloPlan,
} from '../src/screens/lab/gameaudio/pages/data/gaFamilies.ts';

const run = (s: GaState, ...actions: GaAction[]): GaState => actions.reduce((st, a, i) => gaReduce(st, a, st.t + 0.5 + i * 0.01).state, s);
const sinceOf = (s: GaState, base: GaState) => (k: string) => gaFact(s, k) - gaFact(base, k);
const tail = (s: GaState, from: GaState) => s.log.slice(from.log.length).map((l) => `${l.kind}|${l.text}`);

/** The page's PLAY tray, as actions. */
const PLAY: Record<string, GaAction> = {
  SCENE: { type: 'scene', on: true },
  STEP: { type: 'step', who: 'player' },
  'OPEN DOOR': { type: 'door' },
  CRATE: { type: 'post', event: 'crate_impact', owner: 'crate' },
  'GUIDE LINE': { type: 'post', event: 'vo_greeting', owner: 'guide' },
  INTERFACE: { type: 'post', event: 'ui_confirm' },
};

describe('page 5: the families of game sound', () => {
  it('nine families, in the order the page teaches them', () => {
    assert.deepEqual(GA_FAMILIES.map((f) => f.id), ['bed', 'local', 'movement', 'action', 'impact', 'dialogue', 'interface', 'music', 'chat']);
    for (const f of GA_FAMILIES) {
      assert.ok(f.what.length >= 20 && /[.]$/.test(f.what), `${f.id}: says what it is for`);
      assert.ok(/[.]$/.test(f.here), `${f.id}: "here" is a sentence`);
      assert.ok(!/\b(must|always|never)\b/i.test(f.what + f.here), `${f.id}: no dogma words`);
    }
  });
  it('seven can be played here, each by a key of the PLAY tray and a real event; music and voice chat are named only', () => {
    const playable = GA_FAMILIES.filter((f) => f.event !== null);
    assert.equal(playable.length, 7);
    for (const f of playable) {
      assert.ok(f.event! in GA_EVENTS, `${f.id}: ${f.event} is a model event`);
      assert.ok(f.key && f.key in PLAY, `${f.id}: ${f.key} is a key of the tray`);
    }
    assert.deepEqual(GA_FAMILIES.filter((f) => f.event === null).map((f) => f.id), ['music', 'chat']);
    assert.ok(GA_FAMILIES_TO_TRY <= playable.length && GA_FAMILIES_TO_TRY === 6);
  });
  it('each key really starts its family: the goal counts instances the model made, with sound off', () => {
    const base = gaInitial();
    assert.equal(base.soundOn, false);
    assert.equal(gaFamiliesTried(sinceOf(base, base)), 0);
    let s = base;
    const seen: number[] = [];
    for (const key of ['SCENE', 'STEP', 'OPEN DOOR', 'CRATE', 'GUIDE LINE', 'INTERFACE']) {
      s = run(s, PLAY[key]);
      seen.push(gaFamiliesTried(sinceOf(s, base)));
    }
    // SCENE is two families together: the bed and the fountain
    assert.deepEqual(seen, [2, 3, 4, 5, 6, 7]);
    for (const k of GA_FAMILY_FACTS) assert.ok(gaFact(s, k) > 0, k);
  });
  it('a press alone is not enough: a family whose file is missing does not count', () => {
    const base = run(gaInitial(), { type: 'fault', patch: { missingDoor: true } }, { type: 'option', patch: { doorRattle: false } });
    const s = run(base, PLAY['OPEN DOOR']);
    assert.equal(gaFact(s, 'post:door_open'), 1, 'the event was posted');
    assert.equal(gaFamiliesTried(sinceOf(s, base)), 0, 'nothing played, so nothing is counted');
  });
  it('every sound the page lists for loading exists in the bank', () => {
    for (const id of ['amb_room', 'amb_yard', 'fountain', 'fs_stone_1', 'fs_stone_2', 'fs_stone_3', 'fs_stone_4', 'door', 'door_rattle', 'impact', 'debris', 'vo_greeting', 'ui_confirm', 'alarm']) {
      assert.ok(gaAsset(id), id);
    }
  });
});

describe('page 5: what the student reads in the log', () => {
  it('DOOR and CRATE each start two parts: the main sound, then a secondary detail', () => {
    const base = gaInitial();
    assert.deepEqual(tail(run(base, PLAY['OPEN DOOR']), base), [
      'trigger|TRIGGER door opened',
      'trigger|EVENT Play_Door posted by door',
      'start|START (not heard: sound is off) Door · door → sfx bus',
      'start|START (not heard: sound is off) Door · rattle, 1 s later → sfx bus',
    ]);
    assert.deepEqual(tail(run(base, PLAY.CRATE), base), [
      'trigger|EVENT Play_Crate_Impact posted by crate',
      'start|START (not heard: sound is off) Crate impact · impact → sfx bus',
      'start|START (not heard: sound is off) Crate impact · debris, 0.22 s later → sfx bus',
    ]);
    const door = run(base, PLAY['OPEN DOOR']);
    assert.equal(door.inst.length, 1, 'one instance');
    assert.equal(gaVoiceCount(door), 2, 'two voices');
  });
  it('the guide’s line puts its words on screen', () => {
    const s = run(gaInitial(), PLAY['GUIDE LINE']);
    assert.equal(s.caption?.text, 'The generator is in the workshop. Follow the stone path.');
  });
});

describe('page 5: the categories and the alarm', () => {
  it('each family is in the category the SOLO tray says holds it', () => {
    const busOfFamily: Record<string, GaBus> = { bed: 'ambience', local: 'ambience', movement: 'sfx', action: 'sfx', impact: 'sfx', dialogue: 'dialogue', interface: 'ui' };
    for (const f of GA_FAMILIES) if (f.event) assert.equal(GA_EVENTS[f.event].bus, busOfFamily[f.id], f.id);
    assert.deepEqual(GA_SOLO_CATEGORIES.map((c) => c.bus), ['ambience', 'sfx', 'dialogue', 'ui']);
    for (const c of GA_SOLO_CATEGORIES) assert.ok(GA_BUSES.includes(c.bus));
    // the log's own names, where they differ from the label, are in the blurb
    assert.match(GA_SOLO_CATEGORIES[1].blurb, /“sfx”/);
    assert.match(GA_SOLO_CATEGORIES[3].blurb, /“ui”/);
    // the dock key's value: a word of seven letters or fewer (eight are cut in the dock)
    assert.deepEqual(GA_SOLO_CATEGORIES.map((c) => c.short), ['AMBIENT', 'EFFECTS', 'SPEECH', 'UI']);
    for (const c of GA_SOLO_CATEGORIES) assert.ok(c.short.length <= 7, c.short);
  });
  it('the alarm comes from the generator and is filed with the EFFECTS, not the ambience', () => {
    assert.equal(GA_EVENTS.alarm.bus, 'sfx');
    assert.equal(GA_EVENTS.alarm.spatial, true);
    const s = run(gaInitial(), { type: 'alarm', on: true });
    assert.deepEqual(s.inst.find((i) => i.event === 'alarm')?.pos, { ...PLACES.generator });
    assert.equal(gaFact(s, 'alarmOn'), 1);
    assert.match(GA_SOLO_CATEGORIES[1].blurb, /alarm/);
    assert.ok(!/alarm/.test(GA_SOLO_CATEGORIES[0].blurb));
  });
  it('with the door CLOSED the alarm is quieter than the fountain anywhere on the stone path; with it open and YOU near it, it is not', () => {
    // the levels the engine is given, read from its commands (sound on)
    const levels = (steps: number, closeDoor: boolean): { alarm: number; fountain: number } => {
      let s = run(gaInitial(), { type: 'sound', on: true }, { type: 'scene', on: true }, { type: 'alarm', on: true }, { type: 'door' });
      for (let k = 0; k < steps; k++) s = run(s, { type: 'step', who: 'player' });
      assert.equal(s.doorOpen, true);
      // the last change re-places every positioned voice: read that
      const r = closeDoor ? gaReduce(s, { type: 'door' }, s.t + 1) : gaReduce(s, { type: 'face', who: 'player', facing: s.chars.player.facing }, s.t + 1);
      const gain = (event: 'alarm' | 'fountain'): number => {
        const inst = r.state.inst.find((i) => i.event === event)!;
        const voice = r.state.voices.find((v) => v.inst === inst.id)!;
        const cmd = [...r.cmds].reverse().find((c) => c.t === 'set' && c.v === voice.v);
        assert.ok(cmd && cmd.t === 'set' && typeof cmd.gain === 'number', `${event}: the engine was given a level`);
        return cmd.gain as number;
      };
      return { alarm: gain('alarm'), fountain: gain('fountain') };
    };
    for (const steps of [0, 1, 2, 3, 4]) {
      const closed = levels(steps, true);
      assert.ok(closed.alarm < closed.fountain, `door closed, ${steps} steps east: alarm ${closed.alarm.toFixed(3)}, fountain ${closed.fountain.toFixed(3)}`);
    }
    // why step 3 says "press CLOSE DOOR if the door is open"
    const open = levels(4, false);
    assert.ok(open.alarm > open.fountain, `door open, 4 steps east: alarm ${open.alarm.toFixed(3)}, fountain ${open.fountain.toFixed(3)}`);
  });
  it('and it is the most important sound the page plays (the model protects it)', () => {
    assert.equal(GA_EVENTS.alarm.protected, true);
    for (const f of GA_FAMILIES) if (f.event) assert.ok(GA_EVENTS.alarm.priority > GA_EVENTS[f.event].priority, f.id);
  });
});

describe('page 5: the solo rule', () => {
  const soloed = (s: GaState) => GA_BUSES.filter((b) => s.bus[b].solo);
  const apply = (s: GaState, pick: GaBus | null): GaState => run(s, ...gaSoloPlan(s.bus, pick).map((p) => ({ type: 'bus', bus: p.bus, solo: p.solo }) as GaAction));

  it('exactly one category plays alone, and moving the solo never leaves two', () => {
    let s = gaInitial();
    assert.equal(gaSoloNow(s.bus), null);
    for (const pick of ['ambience', 'sfx', 'dialogue', 'ui', 'ambience'] as const) {
      s = apply(s, pick);
      assert.deepEqual(soloed(s), [pick]);
      assert.equal(gaSoloNow(s.bus), pick);
      for (const b of GA_BUSES) assert.equal(busGain(s, b) > 0, b === pick, `${b} with ${pick} soloed`);
    }
    s = apply(s, null);
    assert.deepEqual(soloed(s), []);
    for (const b of GA_BUSES) assert.equal(busGain(s, b), 1);
  });
  it('the new solo is set before the old one is cleared, and an unchanged bus is left alone', () => {
    const s = apply(gaInitial(), 'ambience');
    assert.deepEqual(gaSoloPlan(s.bus, 'sfx'), [{ bus: 'sfx', solo: true }, { bus: 'ambience', solo: false }]);
    assert.deepEqual(gaSoloPlan(s.bus, 'ambience'), []);
    assert.deepEqual(gaSoloPlan(gaInitial().bus, null), []);
  });
  it('each solo is a fact (the "solo two categories" goal), and clearing one is not', () => {
    const base = gaInitial();
    let s = apply(base, 'ambience');
    s = apply(s, 'sfx');
    assert.equal(gaFact(s, 'solo:ambience'), 1);
    assert.equal(gaFact(s, 'solo:sfx'), 1);
    s = apply(s, null);
    assert.equal(Object.keys(s.facts).filter((k) => k.startsWith('solo:')).length, 2);
  });
  it('the page opens on a clean scene: no solo, both secondary details on, the door closed, nothing playing, an empty log', () => {
    const s = run(apply(gaInitial(), 'ambience'), { type: 'option', patch: { doorRattle: false, debris: false } }, { type: 'scene', on: true }, { type: 'alarm', on: true }, { type: 'door' });
    const open = run(s, { type: 'enterPage' });
    assert.deepEqual(soloed(open), []);
    assert.equal(open.options.doorRattle && open.options.debris, true);
    assert.equal(open.doorOpen, false);
    assert.equal(open.inst.length, 0);
    assert.equal(open.log.length, 0);
    assert.deepEqual(open.facts, s.facts, 'the facts are kept, and opening a page adds none');
  });
  it('with AMBIENCE alone the alarm is silent and still running; with EFFECTS alone it plays', () => {
    let s = run(gaInitial(), { type: 'scene', on: true }, { type: 'alarm', on: true });
    const playing = s.inst.length;
    s = apply(s, 'ambience');
    assert.equal(busGain(s, GA_EVENTS.alarm.bus), 0);
    assert.ok(busGain(s, GA_EVENTS.fountain.bus) > 0);
    assert.ok(gaPlaying(s, 'alarm'));
    assert.equal(s.inst.length, playing, 'a solo stops nothing');
    s = apply(s, 'sfx');
    assert.ok(busGain(s, GA_EVENTS.alarm.bus) > 0);
    assert.ok(gaPlaying(s, 'alarm') && s.bus.sfx.solo, 'the page’s third goal');
  });
});

describe('page 1: what the student reads when the scene starts', () => {
  it('SCENE on starts three sounds, with a GAME line and a START line each', () => {
    const base = gaInitial();
    const s = run(base, { type: 'scene', on: true });
    assert.equal(s.inst.length, 3);
    assert.equal(gaVoiceCount(s), 3);
    assert.equal(gaFact(s, 'sceneOn'), 1);
    const lines = tail(s, base);
    assert.equal(lines.filter((l) => l.startsWith('trigger|EVENT ')).length, 3);
    assert.equal(lines.filter((l) => l.startsWith('start|START (not heard: sound is off) ')).length, 3);
    assert.deepEqual(s.inst.map((i) => GA_EVENTS[i.event].label), ['Room tone', 'Courtyard wind', 'Fountain']);
  });
  it('the room tone waits at zero level while the listener is outside', () => {
    const { cmds } = gaReduce(run(gaInitial(), { type: 'sound', on: true }), { type: 'scene', on: true }, 1);
    const started = cmds.filter((c) => c.t === 'start');
    const room = started.find((c) => c.t === 'start' && c.buf === 'amb_room');
    assert.ok(room && room.t === 'start');
    const set = cmds.filter((c) => c.t === 'set' && c.v === room.v).pop();
    assert.ok(set && set.t === 'set' && set.gain === 0, 'the room bed is set to zero for a listener in the courtyard');
    const yard = started.find((c) => c.t === 'start' && c.buf === 'amb_yard');
    const yardSet = cmds.filter((c) => c.t === 'set' && yard && yard.t === 'start' && c.v === yard.v).pop();
    assert.ok(yardSet && yardSet.t === 'set' && (yardSet.gain ?? 0) > 0);
  });
  it('■ STOP stops everything immediately, and the log says STOP ALL', () => {
    const s = run(gaInitial(), { type: 'scene', on: true }, { type: 'stopAll' });
    assert.equal(s.inst.length, 0);
    assert.equal(gaFact(s, 'stopAll'), 1);
    assert.match(s.log[s.log.length - 1].text, /^STOP ALL:/);
  });
  it('the stop goal counts only a ■ STOP that stopped something', () => {
    const idle = run(gaInitial(), { type: 'stopAll' });
    assert.equal(gaFact(idle, 'stoppedSomething'), 0, 'a press with nothing playing is not counted');
    const busy = run(gaInitial(), { type: 'scene', on: true }, { type: 'stopAll' });
    assert.equal(gaFact(busy, 'stoppedSomething'), 1);
  });
  it('LEVEL is the lab’s own level: it starts at 70% and holds what it is given', () => {
    assert.equal(gaInitial().master, 0.7);
    assert.equal(run(gaInitial(), { type: 'master', value: 0.4 }).master, 0.4);
  });
});
