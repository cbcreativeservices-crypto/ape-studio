/**
 * Game Audio lab, pages 1, 2 and 5 — the sound families and the solo rule
 * (pages/data/gaFamilies.ts), and the model facts those pages' text and
 * goals rest on. Proven on the pure model; no device.
 *
 * If one of the second half's tests fails, a sentence on page 1 or page 5 is
 * no longer true and must be read again.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { GA_BUSES, type GaBus } from '../src/screens/lab/gameaudio/engine/gaEngineProtocol.ts';
import { readFileSync } from 'node:fs';
import { GA_BUS_NAME, GA_DOOR_CLOSE_ASSET, GA_EVENTS } from '../src/screens/lab/gameaudio/model/gaDefs.ts';
import { busGain, gaFact, gaInitial, gaPlaying, gaReduce, gaVoiceCount, gaVoiceOut, type GaAction, type GaState } from '../src/screens/lab/gameaudio/model/gaModel.ts';
import { OBSTRUCTED, PLACES, START } from '../src/screens/lab/gameaudio/model/gaWorld.ts';
import { gaAsset } from '../src/screens/lab/gameaudio/sounds/gaSoundBank.ts';
import {
  GA_FAMILIES,
  GA_FAMILIES_TO_TRY,
  GA_FAMILY_FACTS,
  CHA_RESULT_LINES,
  GA_PLAY,
  GA_SOLO_CATEGORIES,
  chaResultRows,
  gaFamiliesTried,
  gaSoloKeyWord,
  gaSoloNow,
  gaSoloPlan,
} from '../src/screens/lab/gameaudio/pages/data/gaFamilies.ts';

const run = (s: GaState, ...actions: GaAction[]): GaState => actions.reduce((st, a, i) => gaReduce(st, a, st.t + 0.5 + i * 0.01).state, s);
const sinceOf = (s: GaState, base: GaState) => (k: string) => gaFact(s, k) - gaFact(base, k);
const tail = (s: GaState, from: GaState) => s.log.slice(from.log.length).map((l) => `${l.kind}|${l.text}`);

/** The page's PLAY tray, as the actions the page itself dispatches. */
const PLAY = GA_PLAY;
const PAGE5 = readFileSync(new URL('../src/screens/lab/gameaudio/pages/p05Sounds.tsx', import.meta.url), 'utf8').replace(/\r\n/g, '\n');
/** The level the engine is given for one event's first voice: the model's
 *  computed output (distance, wall, bus). */
const levelOf = (s: GaState, event: string): { gain: number; lowpassHz: number } => {
  const inst = s.inst.find((i) => i.event === event);
  assert.ok(inst, `${event} is playing`);
  const voice = s.voices.find((v) => v.inst === inst.id)!;
  const o = gaVoiceOut(s, voice);
  return { gain: o.gain, lowpassHz: o.lowpassHz };
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
      'trigger|EVENT Play_Door posted by DOOR',
      'start|Door · door · door_open.wav → EFFECTS bus (not heard: sound is off)',
      'start|Door · rattle, 1 s later → EFFECTS bus (not heard: sound is off)',
    ]);
    assert.deepEqual(tail(run(base, PLAY.CRATE), base), [
      'trigger|EVENT Play_Crate_Impact posted by CRATE',
      'start|Crate impact · impact → EFFECTS bus (not heard: sound is off)',
      'start|Crate impact · debris, 0.22 s later → EFFECTS bus (not heard: sound is off)',
    ]);
    // the log speaks the categories' own names: the page has nothing to explain away
    for (const line of [...tail(run(base, PLAY['OPEN DOOR']), base), ...tail(run(base, PLAY.INTERFACE), base)]) assert.ok(!/\b(sfx|ui)\b/.test(line), line);
    const door = run(base, PLAY['OPEN DOOR']);
    assert.equal(door.inst.length, 1, 'one instance');
    assert.equal(gaVoiceCount(door), 2, 'two voices');
  });
  it('the guide’s line puts its words on screen', () => {
    const s = run(gaInitial(), PLAY['GUIDE LINE']);
    assert.equal(s.caption?.text, 'The generator is in the workshop. Follow the stone path.');
  });
  it('the PLAY tray shows the guide’s words and the newest log lines at its top (walk audit W1 F04)', () => {
    const tray = PAGE5.slice(PAGE5.indexOf('function PlayTray'), PAGE5.indexOf('function Page('));
    assert.match(tray, /<ChATrayResult state=\{s\} \/>/);
    assert.ok(tray.indexOf('ChATrayResult') < tray.indexOf('ChATrayGrid'), 'the result is ABOVE the chips');
    // every chip of the tray dispatches the action this test proves
    for (const k of ['STEP', "'OPEN DOOR'", 'CRATE', "'GUIDE LINE'", 'INTERFACE']) assert.ok(tray.includes(`GA_PLAY${k.startsWith("'") ? `[${k}]` : `.${k}`}`), k);
  });
  it('after OPEN DOOR the tray’s result panel shows the door’s two parts, even when a footstep has just ended', () => {
    let s = run(gaInitial(), PLAY.STEP);
    const step = s.voices[s.voices.length - 1];
    s = run(s, { type: 'expire', v: step.v });
    assert.ok(s.log.some((l) => l.kind === 'stop'), 'the footstep’s end is in the log');
    s = run(s, PLAY['OPEN DOOR']);
    const rows = chaResultRows(s.log, CHA_RESULT_LINES).map((r) => r.text);
    assert.deepEqual(rows, ['Door · rattle, 1 s later → EFFECTS bus (not heard: sound is off)', 'Door · door · door_open.wav → EFFECTS bus (not heard: sound is off)']);
  });
  it('STEP is a step in place: sixteen presses leave YOU where the page opened (walk audit W1 F08)', () => {
    let s = run(gaInitial(), PLAY['OPEN DOOR']);
    const before = gaFact(s, 'inst:footstep');
    for (let k = 0; k < 16; k++) s = run(s, PLAY.STEP);
    assert.deepEqual([s.chars.player.x, s.chars.player.y], [START.player.x, START.player.y]);
    assert.equal(gaFact(s, 'inst:footstep') - before, 16, 'each press still plays a footstep');
  });
});

describe('page 5: the categories and the alarm', () => {
  it('each family is in the category the SOLO tray says holds it', () => {
    const busOfFamily: Record<string, GaBus> = { bed: 'ambience', local: 'ambience', movement: 'sfx', action: 'sfx', impact: 'sfx', dialogue: 'dialogue', interface: 'ui' };
    for (const f of GA_FAMILIES) if (f.event) assert.equal(GA_EVENTS[f.event].bus, busOfFamily[f.id], f.id);
    assert.deepEqual(GA_SOLO_CATEGORIES.map((c) => c.bus), ['ambience', 'sfx', 'dialogue', 'ui']);
    for (const c of GA_SOLO_CATEGORIES) assert.ok(GA_BUSES.includes(c.bus));
    // ONE name for each category: the chip, the readout and the log all say
    // the model's bus name, and nothing apologizes for a developer word
    for (const c of GA_SOLO_CATEGORIES) {
      assert.equal(c.label, GA_BUS_NAME[c.bus]);
      assert.ok(!/\b(sfx|ui)\b|“|the log (writes|calls)/i.test(c.blurb), c.blurb);
    }
    assert.deepEqual(GA_SOLO_CATEGORIES.map((c) => c.label), ['AMBIENCE', 'EFFECTS', 'DIALOGUE', 'INTERFACE']);
    // the dock key says only whether a solo is on: never a second name
    assert.equal(gaSoloKeyWord(null), 'OFF');
    for (const c of GA_SOLO_CATEGORIES) assert.equal(gaSoloKeyWord(c.bus), 'ON');
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
  it('step 3: where YOU stand the alarm is quieter than the fountain, door open or closed; closed, it is also dull', () => {
    // YOU never move on this page (STEP is in place), so "where you stand" is the start
    let s = run(gaInitial(), PLAY.SCENE, PLAY.ALARM);
    for (let k = 0; k < 4; k++) s = run(s, PLAY.STEP);
    assert.deepEqual([s.chars.player.x, s.chars.player.y], [START.player.x, START.player.y]);
    const closed = { alarm: levelOf(s, 'alarm'), fountain: levelOf(s, 'fountain') };
    const opened = run(s, PLAY['OPEN DOOR']);
    const open = { alarm: levelOf(opened, 'alarm'), fountain: levelOf(opened, 'fountain') };
    assert.ok(closed.alarm.gain < closed.fountain.gain, `door closed: alarm ${closed.alarm.gain.toFixed(3)}, fountain ${closed.fountain.gain.toFixed(3)}`);
    assert.ok(open.alarm.gain < open.fountain.gain, `door open: alarm ${open.alarm.gain.toFixed(3)}, fountain ${open.fountain.gain.toFixed(3)}`);
    // "With the door closed it is also dull": the wall's level change and its low-pass
    assert.equal(closed.alarm.lowpassHz, OBSTRUCTED.lowpassHz);
    assert.equal(open.alarm.lowpassHz, 20000);
    assert.ok(Math.abs(20 * Math.log10(closed.alarm.gain / open.alarm.gain) + 9) < 0.01, 'the closed door is 9 dB lower');
    // the page no longer sends the learner to CLOSE DOOR for a reason that is gone
    assert.ok(!/press CLOSE DOOR if/.test(PAGE5));
    assert.match(PAGE5, /Where you stand, the alarm is quieter than the fountain\. With the door closed it is also dull\./);
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

const PAGE1 = readFileSync(new URL('../src/screens/lab/gameaudio/pages/p01Welcome.tsx', import.meta.url), 'utf8').replace(/\r\n/g, '\n');

describe('page 1: what the student reads when the scene starts', () => {
  it('SCENE on starts three sounds, with a GAME line and a START line each', () => {
    const base = gaInitial();
    const s = run(base, { type: 'scene', on: true });
    assert.equal(s.inst.length, 3);
    assert.equal(gaVoiceCount(s), 3);
    assert.equal(gaFact(s, 'sceneOn'), 1);
    const lines = tail(s, base);
    assert.equal(lines.filter((l) => l.startsWith('trigger|EVENT ')).length, 3);
    assert.equal(lines.filter((l) => l.startsWith('start|') && l.endsWith(' (not heard: sound is off)')).length, 3);
    assert.deepEqual(s.inst.map((i) => GA_EVENTS[i.event].label), ['Room tone', 'Courtyard wind', 'Fountain']);
  });
  it('"When a bird calls, it shows 4 for a moment": a bird is a one-shot that adds one instance and one voice', () => {
    let s = run(gaInitial(), { type: 'scene', on: true });
    const t0 = s.t;
    let seen: GaState | null = null;
    for (let t = t0; t < t0 + 12 && !seen; t += 0.1) {
      s = gaReduce(s, { type: 'tick', t }).state;
      if (s.inst.some((i) => i.event === 'bird')) seen = s;
    }
    assert.ok(seen, 'a bird called within 12 s');
    assert.equal(seen.inst.length, 4);
    assert.equal(gaVoiceCount(seen), 4);
    assert.equal(GA_EVENTS.bird.kind, 'one-shot', 'so it ends and PLAYING drops back to 3');
    const bird = seen.voices.find((v) => seen!.inst.find((i) => i.id === v.inst)?.event === 'bird')!;
    const after = run(seen, { type: 'expire', v: bird.v });
    assert.equal(after.inst.length, 3);
  });
  it('the welcome page does not teach instances and voices before page 7 does (learning audit L-12)', () => {
    assert.doesNotMatch(PAGE1, /PLAYING counts instances|One instance can use several voices/);
    assert.match(PAGE1, /PLAYING and VOICES count what is sounding now\. Page 7 explains them\./);
    // and it says this scene's simplification about the silent room tone (decision 5)
    assert.match(PAGE1, /This scene counts it anyway\. A real engine usually does not\./);
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

const PAGE2 = readFileSync(new URL('../src/screens/lab/gameaudio/pages/p02Reacts.tsx', import.meta.url), 'utf8').replace(/\r\n/g, '\n');

describe('page 2: what the student reads when a sound reacts', () => {
  const on = run(gaInitial(), { type: 'machine', id: 'generator-1', on: true });
  it('one SPEED drag is ONE VALUE line that counts the changes, and no START (walk audit W1 F07)', () => {
    let s = on;
    for (const v of [0.45, 0.5, 0.6, 0.7, 0.8]) s = run(s, { type: 'speed', id: 'generator-1', value: v });
    const lines = tail(s, on);
    assert.deepEqual(lines.map((l) => l.split('|')[0]), ['value']);
    assert.match(lines[0], /^value\|PARAMETER speed = 80% on GENERATOR 1: the SAME instance i\d+ changes, nothing restarts · 5 changes$/);
    assert.equal(gaFact(s, 'speedWhilePlaying') - gaFact(on, 'speedWhilePlaying'), 5);
    assert.deepEqual(s.inst.map((i) => i.id), on.inst.map((i) => i.id), 'the same instance');
    assert.match(PAGE2, /The log prints one VALUE line that counts the changes, and no new START\./);
  });
  it('the speed value is kept on the generator, and the playing instance follows it (decision 6, accuracy audit A4)', () => {
    const off = run(on, { type: 'machine', id: 'generator-1', on: false }, { type: 'speed', id: 'generator-1', value: 0.2 });
    assert.equal(off.inst.length, 0, 'nothing playing');
    assert.equal(off.machines[0].speed, 0.2, 'the value is kept on the machine');
    const again = run(off, { type: 'machine', id: 'generator-1', on: true });
    assert.equal(again.machines[0].speed, 0.2, 'the new instance starts at the machine’s value');
    assert.match(PAGE2, /The speed value is kept on the generator, and the instance follows it\./);
    assert.doesNotMatch(PAGE2, /speed value on the instance/);
  });
  it('the door’s one event plays an opening take and a closing take', () => {
    const open = run(gaInitial(), { type: 'door' });
    const closed = run(open, { type: 'door' });
    assert.equal(open.inst[0].chose[0], 'door');
    assert.equal(closed.inst[closed.inst.length - 1].chose[0], GA_DOOR_CLOSE_ASSET);
    assert.equal(GA_EVENTS.door_open.name, 'Play_Door');
    assert.match(PAGE2, /The door’s one event plays an opening take or a closing take\./);
  });
  it('the rings are described as the picture draws them: they leave more often, they do not travel faster', () => {
    assert.match(PAGE2, /They leave more often as SPEED rises\./);
    assert.doesNotMatch(PAGE2, /spread faster/);
  });
  it('the check’s correct option is not the longest (learning audit L-16)', () => {
    const block = PAGE2.slice(PAGE2.indexOf('options={['), PAGE2.indexOf(']}', PAGE2.indexOf('options={[')));
    const opts = [...block.matchAll(/'([^']+)'/g)].map((m) => m[1]);
    assert.equal(opts.length, 4);
    assert.ok(opts[0].length < Math.max(...opts.slice(1).map((o) => o.length)), opts.map((o) => o.length).join('/'));
  });
});
