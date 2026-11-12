/**
 * Game Audio lab — the pure model (src/screens/lab/gameaudio/model/): the
 * acceptance scenarios of the lab's brief, proven on the reducer with no
 * device. A scenario letter (A…H) refers to the owner's handoff §15.
 *
 * These tests check RELATIONSHIPS a learner is taught (one instance changes,
 * the other does not; the count never passes the limit; a withdrawn change
 * never plays) — not the implementation's own arithmetic re-run.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import type { GaCmd } from '../src/screens/lab/gameaudio/engine/gaEngineProtocol.ts';
import { GA_DUCK_DB, GA_EVENTS, GA_LINES } from '../src/screens/lab/gameaudio/model/gaDefs.ts';
import {
  busGain,
  gaCopies,
  gaFact,
  gaFactKinds,
  gaInitial,
  gaPlaying,
  gaReduce,
  gaVirtualCount,
  gaVoiceCount,
  gaVoiceLevel,
  surfaceOf,
  type GaAction,
  type GaState,
} from '../src/screens/lab/gameaudio/model/gaModel.ts';
import {
  CLEAR,
  OBSTRUCTED,
  PLACES,
  START,
  WALL_X,
  attenuationGain,
  bearing,
  hrtfDirection,
  obstruction,
  stereoPan,
  surfaceAt,
  walkTo,
  zoneAt,
} from '../src/screens/lab/gameaudio/model/gaWorld.ts';
import { gaAsset } from '../src/screens/lab/gameaudio/sounds/gaSoundBank.ts';

/** Run actions; collect every engine command they called for. */
function run(s: GaState, ...actions: GaAction[]): { s: GaState; cmds: GaCmd[] } {
  const cmds: GaCmd[] = [];
  for (const a of actions) {
    const r = gaReduce(s, a);
    s = r.state;
    cmds.push(...r.cmds);
  }
  return { s, cmds };
}
const on = () => run(gaInitial(), { type: 'sound', on: true }).s;
const starts = (cmds: GaCmd[]) => cmds.filter((c) => c.t === 'start') as Extract<GaCmd, { t: 'start' }>[];
const sets = (cmds: GaCmd[]) => cmds.filter((c) => c.t === 'set') as Extract<GaCmd, { t: 'set' }>[];
const texts = (s: GaState) => s.log.map((l) => l.text);

describe('the scene (gaWorld)', () => {
  it('three surfaces, two zones, and a wall you pass only through the open door', () => {
    assert.equal(surfaceAt({ x: 12, y: 3 }), 'wood');
    assert.equal(surfaceAt({ x: 4, y: 5 }), 'stone');
    assert.equal(surfaceAt({ x: 4, y: 8 }), 'gravel');
    assert.equal(zoneAt(START.player), 'yard');
    assert.equal(zoneAt(PLACES.generator), 'room');
    const from = { x: 8.5, y: 5 };
    assert.ok(walkTo(from, { x: 9.6, y: 5 }, false).x < WALL_X, 'a closed door stops you');
    assert.ok(walkTo(from, { x: 9.6, y: 5 }, true).x > WALL_X, 'an open door lets you through');
    assert.ok(walkTo({ x: 8.5, y: 2 }, { x: 9.6, y: 2 }, true).x < WALL_X, 'the wall itself never does');
  });
  it('E — distance: full level inside the minimum, falling beyond it, silent at the maximum', () => {
    const a = { min: 2, max: 12 };
    assert.equal(attenuationGain(1, a), 1);
    assert.equal(attenuationGain(2, a), 1);
    assert.ok(Math.abs(attenuationGain(4, a) - 0.5) < 1e-9, 'twice the minimum distance = half the level (−6 dB)');
    assert.equal(attenuationGain(12, a), 0);
    assert.equal(attenuationGain(40, a), 0);
    let last = 1;
    for (let d = 2; d <= 12; d += 0.25) {
      const g = attenuationGain(d, a);
      assert.ok(g <= last + 1e-12, `never rises with distance (${d} m)`);
      last = g;
    }
  });
  it('E — direction: left is left, turning the listener turns the picture, front and back pan alike', () => {
    const L = { x: 5, y: 5, facing: 0, height: 0 }; // facing north
    assert.ok(stereoPan(L, { x: 8, y: 5 }) > 0.9, 'east of a north-facing listener is hard right');
    assert.ok(stereoPan(L, { x: 2, y: 5 }) < -0.9);
    assert.ok(Math.abs(stereoPan(L, { x: 5, y: 1 })) < 1e-9, 'dead ahead is centre');
    assert.ok(Math.abs(stereoPan(L, { x: 5, y: 9 })) < 1e-9, 'dead behind is ALSO centre: stereo cannot tell');
    const east = { ...L, facing: 90 };
    assert.ok(stereoPan(east, { x: 5, y: 1 }) < -0.9, 'the same source is hard left once the listener faces east');
    assert.equal(Math.round(bearing(L, { x: 8, y: 5 })), 90);
    assert.equal(Math.round(bearing(L, { x: 5, y: 9 })), 180);
    // the head-related direction DOES tell front from back
    assert.ok(hrtfDirection(L, { x: 5, y: 1 })[2] < 0 && hrtfDirection(L, { x: 5, y: 9 })[2] > 0);
    // a camera listener high above pans far less than ears at ground level
    const cam = { x: 8, y: 5, facing: 0, height: 6 };
    assert.ok(Math.abs(stereoPan(cam, { x: 11, y: 5 })) < 0.5);
    assert.ok(stereoPan({ ...cam, height: 0 }, { x: 11, y: 5 }) > 0.99);
  });
  it('the wall: only different zones with the door closed are treated', () => {
    assert.equal(obstruction(START.player, PLACES.generator, false), OBSTRUCTED);
    assert.equal(obstruction(START.player, PLACES.generator, true), CLEAR);
    assert.equal(obstruction(START.player, PLACES.fountain, false), CLEAR);
  });
});

describe('A — variation and the surface switch', () => {
  it('every event points at assets that exist, and the lines have matching text', () => {
    for (const e of Object.values(GA_EVENTS)) {
      for (const l of e.layers) {
        const lists = Array.isArray(l.assets) ? [l.assets as string[]] : Object.values(l.assets as Record<string, string[]>);
        for (const list of lists) for (const id of list) assert.ok(gaAsset(id), `${e.id}/${l.id} → ${id}`);
      }
    }
    for (const line of Object.values(GA_LINES)) for (const v of Object.values(line)) assert.ok(gaAsset(v.asset) && v.text.length > 10);
  });
  it('a fixed seed gives a repeatable sequence, and adjacent takes differ on every surface', () => {
    const walk = (seed: number) => {
      let s = run(gaInitial(seed), { type: 'sound', on: true }).s;
      const takes: string[] = [];
      for (let i = 0; i < 24; i++) {
        const r = gaReduce(s, { type: 'step', who: 'player', dx: 0, dy: 0 });
        s = r.state;
        takes.push(starts(r.cmds)[0].buf);
      }
      return takes;
    };
    assert.deepEqual(walk(7), walk(7));
    assert.notDeepEqual(walk(7), walk(8));
    for (const place of [{ x: 4, y: 5 }, { x: 4, y: 8 }, { x: 12, y: 3 }]) {
      let s = on();
      s = run(s, { type: 'door' }).s; // open, so the room is reachable
      s.chars.player.x = place.x;
      s.chars.player.y = place.y;
      const surface = surfaceAt(place);
      const takes: string[] = [];
      for (let i = 0; i < 30; i++) {
        const r = gaReduce(s, { type: 'step', who: 'player', dx: 0, dy: 0 });
        s = r.state;
        const st = starts(r.cmds).filter((c) => c.buf.startsWith('fs_'));
        assert.equal(st.length, 1);
        takes.push(st[0].buf);
      }
      assert.ok(takes.every((t) => t.startsWith(`fs_${surface}_`)), `${surface}: only that surface's takes`);
      for (let i = 1; i < takes.length; i++) assert.notEqual(takes[i], takes[i - 1], `${surface}: no immediate repeat`);
      assert.equal(new Set(takes).size, 4, `${surface}: all four takes are used`);
      assert.ok(gaFactKinds(s, `take:footstep:${surface}:`) === 4);
    }
  });
  it('variation off is the machine-gun effect: the same take every time, at the same level and pitch', () => {
    let s = run(on(), { type: 'option', patch: { variation: false } }).s;
    const seen: string[] = [];
    for (let i = 0; i < 6; i++) {
      const r = gaReduce(s, { type: 'step', who: 'player', dx: 0, dy: 0 });
      s = r.state;
      const st = starts(r.cmds)[0];
      seen.push(`${st.buf}|${st.rate}|${st.gain.toFixed(6)}`);
    }
    assert.equal(new Set(seen).size, 1);
  });
  it('a one-take group still plays (the door), and the log names take, owner and bus', () => {
    const r = run(on(), { type: 'door' });
    assert.ok(starts(r.cmds).some((c) => c.buf === 'door'));
    const line = r.s.log.find((l) => l.kind === 'start' && l.text.includes('Door · door'))!;
    assert.equal(line.owner, 'door');
    assert.equal(line.bus, 'sfx');
    const step = run(on(), { type: 'step', who: 'guide', dx: 0, dy: 0 }).s;
    assert.ok(texts(step).some((t) => /TRIGGER foot contact · guide · SWITCH surface = wood/.test(t)));
    assert.ok(texts(step).some((t) => /take \d of 4/.test(t)));
  });
  it('the surface is LOCAL: the player on gravel does not change the guide on wood — until the planted fault', () => {
    let s = on();
    s.chars.player.y = 8; // gravel
    assert.equal(surfaceOf(s, 'player'), 'gravel');
    assert.equal(surfaceOf(s, 'guide'), 'wood');
    const g = run(s, { type: 'step', who: 'guide', dx: 0, dy: 0 });
    assert.ok(starts(g.cmds)[0].buf.startsWith('fs_wood_'));
    s = run(s, { type: 'fault', patch: { globalSurface: true } }).s;
    const bad = run(s, { type: 'step', who: 'guide', dx: 0, dy: 0 });
    assert.ok(starts(bad.cmds)[0].buf.startsWith('fs_gravel_'), 'the guide, indoors, now crunches gravel');
  });
});

describe('B — one event, independent instances', () => {
  const two = () => run(on(), { type: 'addMachine' }, { type: 'machine', id: 'generator-1', on: true }, { type: 'machine', id: 'generator-2', on: true });
  it('two machines from one event are two instances with their own voices', () => {
    const r = two();
    assert.equal(gaCopies(r.s, 'generator'), 2);
    assert.equal(starts(r.cmds).filter((c) => c.buf === 'gen_hum').length, 2);
    assert.equal(starts(r.cmds).filter((c) => c.buf === 'gen_air').length, 2);
    assert.equal(new Set(r.s.inst.map((i) => i.owner)).size, 2);
  });
  it('a parameter is LOCAL: changing one machine’s speed touches only that instance, and restarts nothing', () => {
    const r = two();
    const i2 = r.s.inst.find((i) => i.owner === 'generator-2')!;
    const mine = new Set(r.s.voices.filter((v) => v.inst === i2.id).map((v) => v.v));
    const ch = run(r.s, { type: 'speed', id: 'generator-2', value: 0.9 });
    assert.equal(starts(ch.cmds).length, 0, 'no new voice');
    assert.ok(sets(ch.cmds).length === 2 && sets(ch.cmds).every((c) => mine.has(c.v)), 'only generator-2’s two voices move');
    assert.ok(sets(ch.cmds).every((c) => (c.rate ?? 0) > 1));
    assert.deepEqual(ch.s.inst.map((i) => i.id), r.s.inst.map((i) => i.id), 'the same instances');
    assert.ok(texts(ch.s).some((t) => t.includes('SAME instance')));
    assert.equal(ch.s.machines.find((m) => m.id === 'generator-1')!.speed, 0.4);
  });
  it('starting a machine that is already running does not stack a second copy', () => {
    const r = two();
    const again = run(r.s, { type: 'post', event: 'generator', owner: 'generator-1' });
    assert.equal(gaCopies(again.s, 'generator'), 2);
    assert.equal(starts(again.cmds).length, 0);
    assert.equal(gaFact(again.s, 'ignoredRetrigger'), 1);
  });
  it('stop or remove one: the other plays on; removing an owner leaves no orphan loop', () => {
    const r = two();
    const stopped = run(r.s, { type: 'machine', id: 'generator-1', on: false });
    assert.equal(stopped.cmds.filter((c) => c.t === 'stop').length, 2);
    assert.ok(gaPlaying(stopped.s, 'generator', 'generator-2') && !gaPlaying(stopped.s, 'generator', 'generator-1'));
    const removed = run(r.s, { type: 'removeMachine', id: 'generator-2' });
    assert.ok(!gaPlaying(removed.s, 'generator', 'generator-2') && gaPlaying(removed.s, 'generator', 'generator-1'));
    assert.equal(removed.s.voices.length, 2);
    assert.equal(gaFact(removed.s, 'cleanRemove'), 1);
  });
  it('the planted fault: the owner is removed and its loop plays on, ownerless', () => {
    const r = run(two().s, { type: 'fault', patch: { orphanLoop: true } }, { type: 'removeMachine', id: 'generator-2' });
    assert.equal(r.cmds.filter((c) => c.t === 'stop').length, 0);
    assert.ok(gaPlaying(r.s, 'generator', 'generator-2'), 'the instance outlived its object');
    assert.equal(r.s.machines.length, 1);
    assert.ok(texts(r.s).some((t) => t.includes('ORPHAN')));
  });
  it('leave and re-enter ten times: nothing accumulates', () => {
    let s = on();
    for (let k = 0; k < 10; k++) {
      s = run(s, { type: 'scene', on: true }, { type: 'machine', id: 'generator-1', on: true }, { type: 'musicStart' }, { type: 'mood', mood: 'alert' }).s;
      assert.equal(s.inst.length, 4, `visit ${k + 1}: two beds, the fountain, the generator`);
      assert.equal(s.voices.length, 5);
      s = run(s, { type: 'stopAll' }).s;
      assert.equal(s.inst.length + s.voices.length, 0);
      assert.equal(s.music.pending, null);
      assert.equal(s.music.on, false);
    }
  });
});

describe('C — layers, secondary detail, and the same action delivered twice', () => {
  it('one door action = the door and exactly one later rattle; they are ONE event’s layers', () => {
    const r = run(on(), { type: 'door' });
    const st = starts(r.cmds);
    assert.deepEqual(st.map((c) => c.buf), ['door', 'door_rattle']);
    assert.equal(st[0].delay, undefined);
    assert.equal(st[1].delay, 1.0);
    assert.equal(r.s.inst.filter((i) => i.event === 'door_open').length, 1, 'one instance, two voices');
    assert.equal(r.s.log.filter((l) => l.text.startsWith('EVENT Play_Door')).length, 1, 'one event was posted');
    const off = run(on(), { type: 'option', patch: { doorRattle: false } }, { type: 'door' });
    assert.deepEqual(starts(off.cmds).map((c) => c.buf), ['door']);
  });
  it('a network action with an id already handled is ignored; a new id plays', () => {
    let r = run(on(), { type: 'net', id: 'A17', what: 'door', to: 'world' });
    assert.equal(starts(r.cmds).filter((c) => c.buf === 'door').length, 1);
    r = run(r.s, { type: 'net', id: 'A17', what: 'door', to: 'world' });
    assert.equal(starts(r.cmds).length, 0);
    assert.equal(gaFact(r.s, 'netDuplicateIgnored'), 1);
    r = run(r.s, { type: 'net', id: 'A18', what: 'door', to: 'world' });
    assert.equal(starts(r.cmds).filter((c) => c.buf === 'door').length, 1);
  });
  it('a new network door action MOVES the door as well as playing it; a repeat handled twice plays again and moves nothing', () => {
    let r = run(on(), { type: 'net', id: 'D1', what: 'door', to: 'world' });
    assert.equal(r.s.doorOpen, true, 'the door in the picture is where the sound says it is');
    r = run(r.s, { type: 'net', id: 'D1', what: 'door', to: 'world' });
    assert.equal(r.s.doorOpen, true, 'an ignored repeat changes nothing');
    r = run(r.s, { type: 'option', patch: { dedupe: false } }, { type: 'net', id: 'D1', what: 'door', to: 'world' });
    assert.equal(starts(r.cmds).filter((c) => c.buf === 'door').length, 1, 'the double trigger is heard');
    assert.equal(r.s.doorOpen, true, 'but the door did not move a second time');
    r = run(r.s, { type: 'net', id: 'D2', what: 'door', to: 'world' });
    assert.equal(r.s.doorOpen, false);
  });
  it('without the id check the duplicate double-triggers — and an alert for the other player never plays here', () => {
    let r = run(on(), { type: 'option', patch: { dedupe: false } }, { type: 'net', id: 'A1', what: 'door', to: 'world' }, { type: 'net', id: 'A1', what: 'door', to: 'world' });
    assert.equal(starts(r.cmds).filter((c) => c.buf === 'door').length, 2);
    assert.equal(gaFact(r.s, 'netDoublePlayed'), 1);
    r = run(on(), { type: 'net', id: 'B1', what: 'alert', to: 'them' });
    assert.equal(starts(r.cmds).length, 0);
    r = run(on(), { type: 'net', id: 'B2', what: 'alert', to: 'me' });
    assert.deepEqual(starts(r.cmds).map((c) => [c.buf, c.bus]), [['ui_confirm', 'ui']]);
  });
});

describe('D — zones: one cross-fade per crossing', () => {
  const scene = () => run(on(), { type: 'scene', on: true }, { type: 'door' }).s;
  it('the beds start once; moving inside a zone starts nothing and fades nothing', () => {
    let s = scene();
    assert.equal(gaCopies(s, 'bed_yard') + gaCopies(s, 'bed_room'), 2);
    for (let i = 0; i < 12; i++) {
      const r = gaReduce(s, { type: 'move', who: 'player', x: 3 + i * 0.3, y: 5 });
      s = r.state;
      assert.equal(starts(r.cmds).length, 0);
      assert.equal(sets(r.cmds).filter((c) => c.ramp === 1.5).length, 0);
    }
    assert.equal(gaCopies(s, 'bed_yard') + gaCopies(s, 'bed_room'), 2);
  });
  it('crossing the doorway is ONE cross-fade: the yard bed to 0 and the room bed up', () => {
    const s = scene();
    const yard = s.voices.find((v) => v.asset === 'amb_yard')!.v;
    const room = s.voices.find((v) => v.asset === 'amb_room')!.v;
    const r = run(s, { type: 'move', who: 'player', x: 8.6, y: 5 }, { type: 'move', who: 'player', x: 10.2, y: 5 });
    const fades = sets(r.cmds).filter((c) => c.ramp === 1.5);
    assert.equal(fades.length, 2);
    assert.equal(fades.find((c) => c.v === yard)!.gain, 0);
    assert.ok(fades.find((c) => c.v === room)!.gain! > 0.9);
    assert.equal(gaFact(r.s, 'zoneCross'), 1);
    assert.equal(gaFact(r.s, 'zoneCrossFade'), 1);
    const noBeds = run(on(), { type: 'door' }, { type: 'move', who: 'player', x: 8.6, y: 5 }, { type: 'move', who: 'player', x: 10.2, y: 5 });
    assert.equal(gaFact(noBeds.s, 'zoneCrossFade'), 0);
    assert.ok(texts(noBeds.s).some((t) => t.includes('no ambience bed is playing, so nothing fades')));
    // straight back: again exactly one cross-fade, and still two beds
    const back = run(r.s, { type: 'move', who: 'player', x: 8.4, y: 5 });
    assert.equal(sets(back.cmds).filter((c) => c.ramp === 1.5).length, 2);
    assert.equal(gaCopies(back.s, 'bed_yard') + gaCopies(back.s, 'bed_room'), 2);
  });
  it('the planted fault stacks a new bed on every update — and STOP ALL still silences everything', () => {
    let s = run(scene(), { type: 'fault', patch: { bedPileUp: true } }).s;
    for (let i = 0; i < 5; i++) s = run(s, { type: 'move', who: 'player', x: 4 + i * 0.2, y: 5 }).s;
    assert.equal(gaCopies(s, 'bed_yard'), 6);
    assert.ok(texts(s).some((t) => t.includes('copies are stacked')));
    const r = run(s, { type: 'stopAll' });
    assert.ok(r.cmds.some((c) => c.t === 'stopAll'));
    assert.equal(r.s.voices.length + r.s.inst.length, 0);
  });
  it('a loop that leaves its maximum distance goes virtual and comes back', () => {
    let s = scene();
    assert.ok(gaPlaying(s, 'fountain'));
    const away = run(s, { type: 'move', who: 'player', x: 8.6, y: 5 }, { type: 'move', who: 'player', x: 15, y: 9 });
    assert.equal(gaVirtualCount(away.s), 1);
    assert.ok(gaPlaying(away.s, 'fountain'), 'still an instance: tracked, not rendered');
    assert.ok(away.cmds.some((c) => c.t === 'stop'));
    const back = run(away.s, { type: 'move', who: 'player', x: 9.5, y: 5 }, { type: 'move', who: 'player', x: 4, y: 3 });
    assert.equal(gaVirtualCount(back.s), 0);
    assert.equal(starts(back.cmds).filter((c) => c.buf === 'fountain').length, 1);
    s = back.s;
    assert.equal(gaCopies(s, 'fountain'), 1);
  });
});

describe('F — the mix: buses, and dialogue that ducks', () => {
  it('a line ducks only the configured buses, and they return when it ends', () => {
    const r = run(on(), { type: 'post', event: 'vo_greeting', owner: 'guide' });
    assert.equal(r.s.duckOwners, 1);
    for (const b of ['music', 'ambience', 'sfx'] as const) assert.ok(Math.abs(busGain(r.s, b) - Math.pow(10, GA_DUCK_DB[b]! / 20)) < 1e-9);
    for (const b of ['dialogue', 'ui', 'chat'] as const) assert.equal(busGain(r.s, b), 1, `${b} is not ducked`);
    assert.equal(r.s.caption?.text, GA_LINES.vo_greeting.en.text);
    const v = r.s.voices[0].v;
    const end = run(r.s, { type: 'engine', evt: { e: 'ended', v, why: 'natural' } });
    assert.equal(end.s.duckOwners, 0);
    assert.equal(busGain(end.s, 'music'), 1);
    assert.equal(end.s.caption, null);
  });
  it('a more important line interrupts; the duck holds straight through the swap; a lesser line is refused', () => {
    let r = run(on(), { type: 'post', event: 'vo_greeting', owner: 'guide' });
    const before = r.s.log.length;
    r = run(r.s, { type: 'post', event: 'vo_warning', owner: 'guide' });
    assert.ok(r.cmds.some((c) => c.t === 'stop'), 'the old line stops cleanly');
    assert.deepEqual(r.s.inst.map((i) => i.event), ['vo_warning']);
    assert.equal(r.s.duckOwners, 1);
    assert.ok(!r.s.log.slice(before).some((l) => l.text.startsWith('DUCK off')), 'the mix never bounced up');
    assert.equal(r.s.caption?.text, GA_LINES.vo_warning.en.text);
    const low = run(r.s, { type: 'post', event: 'vo_greeting', owner: 'guide' });
    assert.equal(gaFact(low.s, 'lineRefused'), 1);
    assert.deepEqual(low.s.inst.map((i) => i.event), ['vo_warning']);
    assert.ok(texts(low.s).some((t) => t.includes('REFUSED: a more important line')));
  });
  it('a manual mute stays muted after the duck recovers; solo silences the others', () => {
    let r = run(on(), { type: 'bus', bus: 'music', mute: true }, { type: 'post', event: 'vo_greeting', owner: 'guide' });
    r = run(r.s, { type: 'engine', evt: { e: 'ended', v: r.s.voices[0].v, why: 'natural' } });
    assert.equal(busGain(r.s, 'music'), 0);
    r = run(on(), { type: 'bus', bus: 'ambience', solo: true });
    assert.equal(busGain(r.s, 'ambience'), 1);
    assert.equal(busGain(r.s, 'sfx'), 0);
  });
  it('the language swaps the ASSET and the TEXT together, for every line', () => {
    const r = run(on(), { type: 'option', patch: { language: 'es' } }, { type: 'post', event: 'vo_greeting', owner: 'guide' });
    assert.equal(starts(r.cmds)[0].buf, GA_LINES.vo_greeting.es.asset);
    assert.equal(r.s.caption?.text, GA_LINES.vo_greeting.es.text);
    for (const line of Object.values(GA_LINES)) {
      assert.notEqual(line.en.asset, line.es.asset, 'each language has its own take');
      assert.notEqual(line.en.text, line.es.text);
    }
  });
  it('the planted fault: dialogue routed to the effects bus plays — and ducks nothing', () => {
    const r = run(on(), { type: 'fault', patch: { voWrongBus: true } }, { type: 'post', event: 'vo_greeting', owner: 'guide' });
    assert.equal(starts(r.cmds)[0].bus, 'sfx');
    assert.equal(r.s.duckOwners, 0);
    assert.equal(busGain(r.s, 'music'), 1);
  });
});

describe('G — music requests', () => {
  const playing = () => run(on(), { type: 'musicStart' });
  it('starting sends three stems on one start; only CALM is up', () => {
    const r = playing();
    const m = r.cmds.find((c) => c.t === 'music' && c.op === 'start') as Extract<GaCmd, { t: 'music'; op: 'start' }>;
    assert.deepEqual(m.stems.map((s) => [s.id, s.gain]), [['calm', 1], ['pulse', 0], ['drive', 0]]);
    assert.equal(m.bpm, 96);
  });
  it('a change waits for its boundary, shows as pending, and is applied when the engine says so', () => {
    let r = run(playing().s, { type: 'mood', mood: 'alert' });
    const q = r.cmds.find((c) => c.t === 'music' && c.op === 'layers') as Extract<GaCmd, { t: 'music'; op: 'layers' }>;
    assert.equal(q.at, 'bar');
    assert.deepEqual(q.gains, { calm: 1, pulse: 1, drive: 1 });
    assert.equal(r.s.music.pending?.req, q.req);
    r = run(r.s, { type: 'engine', evt: { e: 'music', what: 'queued', req: q.req, at: 12.5, inS: 1.4, boundary: 'bar' } });
    assert.equal(r.s.music.pending?.inS, 1.4);
    r = run(r.s, { type: 'engine', evt: { e: 'music', what: 'applied', req: q.req, at: 12.5 } });
    assert.equal(r.s.music.pending, null);
    assert.equal(gaFact(r.s, 'musicApplied'), 1);
  });
  it('a second wish before the boundary WITHDRAWS the first; the withdrawn one is never reported applied', () => {
    let r = run(playing().s, { type: 'mood', mood: 'alert' });
    const first = (r.cmds.find((c) => c.t === 'music' && c.op === 'layers') as { req: string }).req;
    r = run(r.s, { type: 'mood', mood: 'calm' });
    assert.ok(r.cmds.some((c) => c.t === 'music' && c.op === 'cancel' && c.req === first));
    const second = (r.cmds.find((c) => c.t === 'music' && c.op === 'layers') as { req: string }).req;
    r = run(r.s, { type: 'engine', evt: { e: 'music', what: 'applied', req: first, at: 1 } });
    assert.equal(gaFact(r.s, 'musicApplied'), 0, 'a late report for the withdrawn request changes nothing');
    assert.equal(r.s.music.pending?.req, second);
  });
  it('with sound off a request still WAITS for its bar in scene time, can be withdrawn, and is applied unheard', () => {
    let s = gaReduce(gaInitial(), { type: 'musicStart' }, 100).state;
    let r = gaReduce(s, { type: 'mood', mood: 'alert' }, 103.1); // 0.6 s into bar 2
    assert.equal(r.cmds.length, 0);
    assert.ok(Math.abs(r.state.music.pending!.inS! - 1.9) < 1e-9, 'the next bar line is 1.9 s away');
    assert.equal(gaFact(r.state, 'musicApplied'), 0);
    const first = r.state.music.pending!.req;
    r = gaReduce(r.state, { type: 'mood', mood: 'calm' }, 103.6);
    assert.equal(gaFact(r.state, 'musicWithdrawn'), 1);
    const second = r.state.music.pending!.req;
    assert.notEqual(second, first);
    s = gaReduce(r.state, { type: 'engine', evt: { e: 'music', what: 'applied', req: first, at: 0 } }, 105).state;
    assert.equal(gaFact(s, 'musicApplied'), 0, 'the withdrawn request is never applied');
    s = gaReduce(s, { type: 'engine', evt: { e: 'music', what: 'applied', req: second, at: 0 } }, 105).state;
    assert.equal(gaFact(s, 'musicApplied'), 1);
    assert.ok(texts(s).some((t) => t.includes('APPLIED exactly on the bar line (not heard: sound is off)')));
    // asked for "now", nothing waits
    const now = run(gaInitial(), { type: 'musicStart' }, { type: 'option', patch: { musicBoundary: 'now' } }, { type: 'mood', mood: 'alert' });
    assert.equal(now.s.music.pending, null);
    assert.equal(gaFact(now.s, 'musicApplied'), 1);
  });
});

describe('H — the voice budget', () => {
  it('twelve equal voices against a limit of eight: never more than eight, oldest replaced first', () => {
    let s = run(on(), { type: 'voiceLimit', limit: 8 }).s;
    const born: string[] = [];
    for (let k = 0; k < 12; k++) {
      const r = gaReduce(s, { type: 'post', event: 'ui_confirm' }, k * 0.01);
      s = r.state;
      born.push(starts(r.cmds)[0].v);
      assert.ok(gaVoiceCount(s) <= 8, `after ${k + 1} requests: ${gaVoiceCount(s)} voices`);
    }
    assert.equal(gaVoiceCount(s), 8);
    assert.deepEqual(s.voices.map((v) => v.v), born.slice(4), 'the first four (the oldest) were the ones replaced');
    assert.equal(gaFact(s, 'stolen'), 4);
  });
  it('the BURST lesson action obeys the same rule', () => {
    const r = run(on(), { type: 'voiceLimit', limit: 8 }, { type: 'burst', count: 12 });
    assert.equal(gaVoiceCount(r.s), 8);
    assert.equal(starts(r.cmds).length, 12);
    assert.equal(r.cmds.filter((c) => c.t === 'stop').length, 4);
  });
  it('a protected alarm and an important line keep their voices; the footsteps pay', () => {
    let s = run(on(), { type: 'voiceLimit', limit: 4 }, { type: 'alarm', on: true }, { type: 'post', event: 'vo_greeting', owner: 'guide' }).s;
    for (let k = 0; k < 10; k++) s = gaReduce(s, { type: 'step', who: 'player', dx: 0, dy: 0 }, k * 0.05).state;
    assert.equal(gaVoiceCount(s), 4);
    assert.ok(gaPlaying(s, 'alarm') && gaPlaying(s, 'vo_greeting'));
  });
  it('when every voice in use is protected or more important, the NEW sound is refused — and says why', () => {
    let s = run(on(), { type: 'voiceLimit', limit: 2 }, { type: 'alarm', on: true }, { type: 'post', event: 'vo_warning', owner: 'guide' }).s;
    const r = run(s, { type: 'step', who: 'player', dx: 0, dy: 0 });
    assert.equal(starts(r.cmds).length, 0);
    assert.equal(gaVoiceCount(r.s), 2);
    assert.ok(texts(r.s).some((t) => t.includes('REFUSED: all 2 voices')));
    s = r.s;
    assert.equal(gaFact(s, 'refused'), 1);
  });
  it('lowering the limit below what is playing sheds the least important first', () => {
    let s = run(on(), { type: 'scene', on: true }, { type: 'alarm', on: true }, { type: 'machine', id: 'generator-1', on: true }).s;
    s = run(s, { type: 'voiceLimit', limit: 3 }).s;
    assert.equal(gaVoiceCount(s), 3);
    assert.ok(gaPlaying(s, 'alarm'), 'the alarm survives');
    assert.ok(!gaPlaying(s, 'bed_room') && !gaPlaying(s, 'bed_yard'), 'the beds (priority 10) went first');
  });
});

describe('what the picture draws from (the level of a voice in the mix)', () => {
  const gen = (s: GaState) => s.voices.filter((v) => s.inst.find((i) => i.id === v.inst)?.event === 'generator');
  it('a muted bus, or another bus soloed, silences the voice; un-muting brings it back', () => {
    const s = run(on(), { type: 'machine', id: 'generator-1', on: true }).s;
    assert.ok(gen(s).length > 0);
    assert.ok(gen(s).every((v) => gaVoiceLevel(s, v) > 0));
    const muted = run(s, { type: 'bus', bus: 'sfx', mute: true }).s;
    assert.ok(gen(muted).every((v) => gaVoiceLevel(muted, v) === 0), 'its own bus is muted');
    const solo = run(s, { type: 'bus', bus: 'ambience', solo: true }).s;
    assert.ok(gen(solo).every((v) => gaVoiceLevel(solo, v) === 0), 'another bus is soloed');
    const own = run(s, { type: 'bus', bus: 'sfx', solo: true }).s;
    assert.ok(gen(own).every((v) => gaVoiceLevel(own, v) > 0), 'its own bus is the soloed one');
    const back = run(muted, { type: 'bus', bus: 'sfx', mute: false }).s;
    assert.ok(gen(back).every((v) => gaVoiceLevel(back, v) > 0));
  });
  it('a faster generator is a louder one, and a duck lowers it while a line speaks', () => {
    const slow = run(on(), { type: 'machine', id: 'generator-1', on: true }, { type: 'speed', id: 'generator-1', value: 0.1 }).s;
    const fast = run(slow, { type: 'speed', id: 'generator-1', value: 1 }).s;
    const top = (s: GaState) => Math.max(...gen(s).map((v) => gaVoiceLevel(s, v)));
    assert.ok(top(fast) > top(slow));
    const ducked = run(fast, { type: 'post', event: 'vo_greeting', owner: 'guide' }).s;
    assert.ok(ducked.duckOwners > 0);
    assert.ok(top(ducked) < top(fast));
  });
  it('the SPEED log line is written the way the readout shows it: a percentage', () => {
    const r = run(on(), { type: 'machine', id: 'generator-1', on: true }, { type: 'speed', id: 'generator-1', value: 0.87 });
    assert.ok(texts(r.s).some((t) => t.startsWith('PARAMETER speed = 87% on generator-1')), texts(r.s).join(' | '));
  });
});

describe('the overhead listener, and a page opening', () => {
  it('the camera pans less but still hears by distance along the ground: nothing drops out for being high', () => {
    let s = run(on(), { type: 'scene', on: true }, { type: 'door' }, { type: 'machine', id: 'generator-1', on: true }).s;
    s = run(s, { type: 'face', who: 'player', facing: 0 }).s;
    const ears = run(s, { type: 'move', who: 'player', x: 8, y: 5 });
    const cam = run(ears.s, { type: 'listener', mode: 'camera' });
    assert.equal(gaVirtualCount(cam.s), 0, 'the fountain and the generator are both in range of the middle');
    const hum = cam.s.voices.find((v) => v.asset === 'gen_hum')!.v;
    const before = sets(ears.cmds).filter((c) => c.v === hum).pop()!;
    const after = sets(cam.cmds).filter((c) => c.v === hum).pop()!;
    assert.ok(Math.abs(after.pan!) < Math.abs(before.pan!) - 0.15, `the pan narrows: ${before.pan} to ${after.pan}`);
    assert.ok(Math.abs(after.gain! - before.gain!) < 1e-9, 'the level is the same from the same spot on the ground');
  });
  it('a page opens on a CLEAN scene: start positions, door closed, nothing playing, standard settings, an empty log', () => {
    let s = run(on(), { type: 'scene', on: true }, { type: 'machine', id: 'generator-1', on: true }, { type: 'door' }, { type: 'addMachine' }).s;
    s = run(
      s,
      { type: 'move', who: 'player', x: 12.4, y: 5 },
      { type: 'face', who: 'player', facing: 200 },
      { type: 'listener', mode: 'camera' },
      { type: 'bus', bus: 'ambience', solo: true },
      { type: 'voiceLimit', limit: 8 },
      { type: 'fault', patch: { globalSurface: true, voWrongBus: true } },
      { type: 'option', patch: { variation: false, language: 'es', visualCue: true, rawYardLoop: true } },
      { type: 'mono', on: true },
      { type: 'pan', mode: 'hrtf' },
      { type: 'musicStart' },
      { type: 'mood', mood: 'alert' },
      { type: 'master', value: 0.4 },
    ).s;
    const r = run(s, { type: 'enterPage' });
    const t = r.s;
    const clean = gaInitial();
    assert.deepEqual(t.chars, clean.chars, 'everyone is back at the start');
    assert.equal(t.doorOpen, false);
    assert.deepEqual(t.machines, clean.machines);
    assert.equal(t.inst.length + t.voices.length, 0);
    assert.equal(t.music.on, false);
    assert.equal(t.music.pending, null);
    assert.equal(t.mood, 'calm');
    assert.deepEqual(t.music.layers, { calm: true, pulse: false, drive: false });
    assert.equal(t.listenerMode, 'player');
    assert.equal(t.voiceLimit, 16);
    assert.equal(t.pan, 'stereo');
    assert.equal(t.mono, false);
    assert.deepEqual(t.faults, clean.faults);
    assert.deepEqual(t.options, clean.options);
    assert.deepEqual(t.bus, clean.bus);
    assert.deepEqual(t.log, [], 'each page reads its own log');
    // kept: the sound choice, the level, and the record of what was done
    assert.equal(t.soundOn, true);
    assert.equal(t.master, 0.4);
    assert.deepEqual(t.facts, s.facts);
    assert.ok(t.seq >= s.seq, 'ids keep counting, so a late engine answer never matches a new voice');
    // the engine is told: stop everything, back to stereo, buses flat
    assert.ok(r.cmds.some((c) => c.t === 'stopAll'));
    assert.ok(r.cmds.some((c) => c.t === 'mono' && c.on === false));
    assert.ok(r.cmds.some((c) => c.t === 'bus' && c.bus === 'sfx' && c.gain === 1));
    // on an already clean scene: nothing is stopped, and nothing changes
    const quiet = on();
    const again = run(quiet, { type: 'enterPage' });
    assert.deepEqual(again.s, quiet);
    assert.ok(!again.cmds.some((c) => c.t === 'stopAll'));
    // with sound off nothing is sent at all
    assert.equal(run(run(gaInitial(), { type: 'scene', on: true }).s, { type: 'enterPage' }).cmds.length, 0);
  });
  it('the first MOOD ALERT on a freshly opened page is a real change', () => {
    let s = run(on(), { type: 'mood', mood: 'alert' }).s;
    s = run(s, { type: 'enterPage' }, { type: 'musicStart' }).s;
    const r = run(s, { type: 'mood', mood: 'alert' });
    assert.ok(r.s.music.pending, 'queued');
    assert.equal(gaFact(run(r.s, { type: 'mood', mood: 'calm' }).s, 'musicWithdrawn'), 1);
  });
  it('■ STOP with nothing running is not counted as stopping something', () => {
    assert.equal(gaFact(run(on(), { type: 'stopAll' }).s, 'stoppedSomething'), 0);
    assert.equal(gaFact(run(on(), { type: 'scene', on: true }, { type: 'stopAll' }).s, 'stoppedSomething'), 1);
  });
  it('the budget cannot be set below the protected voices sounding, so the count never passes it', () => {
    let s = run(on(), { type: 'alarm', on: true }, { type: 'post', event: 'vo_warning', owner: 'guide' }).s;
    s = run(s, { type: 'voiceLimit', limit: 1 }).s;
    assert.equal(s.voiceLimit, 2);
    assert.ok(gaVoiceCount(s) <= s.voiceLimit);
    assert.ok(texts(s).some((t) => t.includes('the budget stays at 2')));
    const one = run(on(), { type: 'voiceLimit', limit: 1 }, { type: 'alarm', on: true }, { type: 'step', who: 'player', dx: 0, dy: 0 });
    assert.ok(texts(one.s).some((t) => t.includes('REFUSED: the one voice is in use')));
  });
  it('a generator whose voices were all taken is no longer shown as running', () => {
    let s = run(on(), { type: 'machine', id: 'generator-1', on: true }, { type: 'voiceLimit', limit: 2 }).s;
    s = run(s, { type: 'post', event: 'vo_warning', owner: 'guide' }, { type: 'alarm', on: true }).s;
    assert.ok(!gaPlaying(s, 'generator'));
    assert.equal(s.machines[0].on, false);
  });
  it('a changed setting prints one log line; an unchanged one prints none', () => {
    const r = run(on(), { type: 'option', patch: { duck: false } }, { type: 'option', patch: { duck: false } });
    assert.equal(r.s.log.filter((l) => l.text === 'SETTING ducking under dialogue: OFF').length, 1);
    assert.equal(gaFact(r.s, 'option:duck:false'), 1);
    const q = run(on(), { type: 'option', patch: { variation: false }, quiet: true });
    assert.equal(q.s.log.length, 0, 'a planted fault does not name itself');
    assert.equal(gaFact(q.s, 'option:variation:false'), 1);
  });
  it('a repeated action for the OTHER player is not counted as a double heard here', () => {
    const r = run(on(), { type: 'option', patch: { dedupe: false } }, { type: 'net', id: 'Z1', what: 'alert', to: 'them' }, { type: 'net', id: 'Z1', what: 'alert', to: 'them' });
    assert.equal(gaFact(r.s, 'netDoublePlayed'), 0);
  });
});

describe('sound off is not a failure; an engine refusal is', () => {
  it('with sound off: instances, takes and log lines exist, nothing is sent, the log says not heard', () => {
    const r = run(gaInitial(), { type: 'scene', on: true }, { type: 'machine', id: 'generator-1', on: true }, { type: 'step', who: 'player', dx: 0, dy: 0 });
    assert.equal(r.cmds.length, 0);
    assert.ok(gaPlaying(r.s, 'generator') && gaPlaying(r.s, 'footstep'));
    assert.ok(texts(r.s).some((t) => t.startsWith('START (not heard: sound is off)')));
    const done = run(r.s, { type: 'expire', v: r.s.voices.find((v) => v.asset.startsWith('fs_'))!.v });
    assert.ok(!gaPlaying(done.s, 'footstep'));
  });
  it('sound coming on sends every loop that is logically playing, once, plus the mix', () => {
    const off = run(gaInitial(), { type: 'scene', on: true }, { type: 'machine', id: 'generator-1', on: true }, { type: 'musicStart' });
    const r = run(off.s, { type: 'sound', on: true });
    assert.deepEqual(starts(r.cmds).map((c) => c.buf).sort(), ['amb_room', 'amb_yard', 'fountain', 'gen_air', 'gen_hum']);
    assert.ok(r.cmds.some((c) => c.t === 'music' && c.op === 'start'));
    assert.ok(r.cmds.some((c) => c.t === 'reverb' && c.buf === 'ir_room'));
    assert.equal(r.cmds.filter((c) => c.t === 'bus').length >= 6, true);
    assert.equal(r.s.inst.length, 4);
  });
  it('the engine refusing a start removes the instance and logs the engine’s reason', () => {
    let r = run(on(), { type: 'door' });
    const v = r.s.voices.find((x) => x.asset === 'door')!.v;
    r = run(r.s, { type: 'engine', evt: { e: 'failed', v, why: 'suspended' } });
    assert.ok(!r.s.voices.some((x) => x.v === v));
    assert.ok(texts(r.s).some((t) => t.includes('could NOT start Door: audio is paused')));
  });
  it('the planted missing file: the event IS posted, nothing can play, and the log names the file', () => {
    const r = run(on(), { type: 'fault', patch: { missingDoor: true, } }, { type: 'option', patch: { doorRattle: false } }, { type: 'door' });
    assert.equal(starts(r.cmds).length, 0);
    assert.ok(r.s.log.some((l) => l.text.startsWith('EVENT Play_Door')));
    assert.ok(texts(r.s).some((t) => t.includes('"door_open_v2.wav" is NOT IN THE BUILD')));
    assert.equal(gaCopies(r.s, 'door_open'), 0);
    const fixed = run(r.s, { type: 'fault', patch: { missingDoor: false } }, { type: 'door' });
    assert.equal(starts(fixed.cmds).filter((c) => c.buf === 'door').length, 1);
  });
  it('the wall treatment reaches the engine: a closed door low-passes and lowers the generator', () => {
    const r = run(on(), { type: 'machine', id: 'generator-1', on: true });
    const hum = starts(r.cmds).find((c) => c.buf === 'gen_hum')!;
    assert.equal(hum.lowpass, 900);
    const open = run(r.s, { type: 'door' });
    const after = sets(open.cmds).filter((c) => c.lowpass != null);
    assert.ok(after.length >= 2 && after.every((c) => c.lowpass === 20000));
    assert.ok(after.some((c) => (c.gain ?? 0) > hum.gain * 2), 'and comes up when the door opens');
  });
  it('the log is bounded and reset returns a clean scene', () => {
    let s = on();
    for (let i = 0; i < 200; i++) s = run(s, { type: 'post', event: 'ui_confirm' }, { type: 'engine', evt: { e: 'ended', v: `v${i}`, why: 'natural' } }).s;
    assert.ok(s.log.length <= 120);
    const r = run(s, { type: 'reset' });
    assert.equal(r.s.inst.length + r.s.voices.length + r.s.log.length, 0);
    assert.equal(r.s.soundOn, true, 'sound stays as the learner set it');
    assert.ok(r.cmds.some((c) => c.t === 'stopAll'));
  });
});
