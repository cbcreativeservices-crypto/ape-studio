/**
 * Game Audio lab — the pure model (src/screens/lab/gameaudio/model/): the
 * acceptance scenarios of the lab's brief, proven on the reducer with no
 * device. A scenario letter (A…H) refers to the owner's handoff §15.
 *
 * These tests check RELATIONSHIPS a learner is taught (one instance changes,
 * the other does not; the count never passes the limit; a withdrawn change
 * never plays) — not the implementation's own arithmetic re-run.
 */
import { describe, it, mock } from 'node:test';
import assert from 'node:assert/strict';
import type { GaCmd } from '../src/screens/lab/gameaudio/engine/gaEngineProtocol.ts';
import {
  GA_BIRD_ASSETS,
  GA_BIRD_MAX_S,
  GA_BIRD_MIN_S,
  GA_BURST_SPREAD_S,
  GA_BUS_NAME,
  GA_DOOR_CLOSE_ASSET,
  GA_DUCK_DB,
  GA_EVENTS,
  GA_LINES,
  GA_MUSIC_MARGIN_S,
  GA_MUSIC_START_AHEAD_S,
  GA_NET_DELAY_S,
  GA_NET_KEEP_S,
  GA_STINGER_LEAD_S,
} from '../src/screens/lab/gameaudio/model/gaDefs.ts';
import {
  GA_LOG_KIND_WORD,
  GA_METER_FLOOR_DB,
  busGain,
  gaBusMeter,
  gaCopies,
  gaFact,
  gaFactKinds,
  gaGeneratorRate,
  gaInitial,
  gaBusGainAt,
  gaDuckDbAt,
  gaInstWall,
  gaMasterAt,
  gaMusicClock,
  gaMusicWait,
  gaNextDue,
  gaOutputLR,
  gaPlaying,
  gaReduce,
  gaReverbAvailable,
  gaStingerWait,
  gaStolenCount,
  gaVirtualCount,
  gaVoiceCount,
  gaVoiceLevel,
  gaVoiceOut,
  gaVoiceSlots,
  surfaceOf,
  type GaAction,
  type GaState,
} from '../src/screens/lab/gameaudio/model/gaModel.ts';
import {
  CLEAR,
  GA_PAN_WIDTH,
  OBSTRUCTED,
  OCCLUDED,
  PLACES,
  START,
  WALL_X,
  attenuationGain,
  bearing,
  hrtfDirection,
  obstruction,
  occlusion,
  panGains,
  stereoPan,
  surfaceAt,
  walkResult,
  walkTo,
  zoneAt,
} from '../src/screens/lab/gameaudio/model/gaWorld.ts';
import { gaBindEngine, gaCloseScene, gaDispatch, gaGet, gaResetScene, gaSubscribe as gaSubscribeForTest } from '../src/screens/lab/gameaudio/model/gaStore.ts';
import type { GaEngine } from '../src/screens/lab/gameaudio/engine/gaEngine.ts';
import type { GaEvt } from '../src/screens/lab/gameaudio/engine/gaEngineProtocol.ts';
import { GA_ENGINE_JS, GA_HRTF_TRIM } from '../src/screens/lab/gameaudio/engine/gaEngineSource.ts';
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
/** Move the scene clock on (anything due by then happens). */
const tick = (s: GaState, by: number) => gaReduce(s, { type: 'tick', t: s.t + by });
/** SEND a network action and wait for it to ARRIVE (GA_NET_DELAY_S later). */
function net(s: GaState, id: string, what: 'door' | 'alert', to: 'world' | 'me' | 'them'): { s: GaState; cmds: GaCmd[] } {
  const sent = gaReduce(s, { type: 'net', id, what, to });
  const landed = tick(sent.state, GA_NET_DELAY_S);
  return { s: landed.state, cmds: [...sent.cmds, ...landed.cmds] };
}
/** The engine's side of a start: every REQUESTED voice answered `started`. */
function heard(st: GaState): GaState {
  for (const v of st.voices) if (v.state === 'requested') st = gaReduce(st, { type: 'engine', evt: { e: 'started', v: v.v, at: st.t, now: st.t } }).state;
  return st;
}
/** Every object and array inside, frozen: a reducer that writes into its input throws. */
function deepFreeze<T>(o: T): T {
  if (o && typeof o === 'object' && !Object.isFrozen(o)) {
    Object.freeze(o);
    for (const k of Object.keys(o as object)) deepFreeze((o as Record<string, unknown>)[k]);
  }
  return o;
}
/** The door's take for the way it just moved (the closing take once the bank holds it). */
const doorTake = (open: boolean): string => (!open && gaAsset(GA_DOOR_CLOSE_ASSET) ? GA_DOOR_CLOSE_ASSET : 'door');
/** The sounds named tonight that the bank may not hold yet: the model must cope either way. */
const MAY_BE_MISSING = new Set<string>([...GA_BIRD_ASSETS, GA_DOOR_CLOSE_ASSET]);

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
    assert.ok(stereoPan(L, { x: 8, y: 5 }) > 0.8, 'east of a north-facing listener is far right');
    assert.ok(stereoPan(L, { x: 2, y: 5 }) < -0.8);
    assert.ok(Math.abs(stereoPan(L, { x: 5, y: 1 })) < 1e-9, 'dead ahead is centre');
    assert.ok(Math.abs(stereoPan(L, { x: 5, y: 9 })) < 1e-9, 'dead behind is ALSO centre: stereo cannot tell');
    const east = { ...L, facing: 90 };
    assert.ok(stereoPan(east, { x: 5, y: 1 }) < -0.8, 'the same source is far left once the listener faces east');
    assert.equal(Math.round(bearing(L, { x: 8, y: 5 })), 90);
    assert.equal(Math.round(bearing(L, { x: 5, y: 9 })), 180);
    // the head-related direction DOES tell front from back
    assert.ok(hrtfDirection(L, { x: 5, y: 1 })[2] < 0 && hrtfDirection(L, { x: 5, y: 9 })[2] > 0);
    // a camera listener high above pans far less than ears at ground level
    const cam = { x: 8, y: 5, facing: 0, height: 6 };
    assert.ok(Math.abs(stereoPan(cam, { x: 11, y: 5 })) < 0.5);
    assert.ok(Math.abs(stereoPan({ ...cam, height: 0 }, { x: 11, y: 5 }) - GA_PAN_WIDTH) < 0.01);
  });
  it('F25 — a stereo pan never reaches a hard side: no ear is ever left in digital silence', () => {
    assert.equal(GA_PAN_WIDTH, 0.85);
    for (let facing = 0; facing < 360; facing += 15) {
      for (const src of [PLACES.generator, PLACES.fountain, PLACES.crate, PLACES.door]) {
        const p = stereoPan({ x: 5, y: 5, facing, height: 0 }, src);
        assert.ok(Math.abs(p) <= GA_PAN_WIDTH + 1e-12, `facing ${facing}: ${p}`);
        const g = panGains(p);
        assert.ok(g.l > 0.1 && g.r > 0.1, 'both ears always get some of it');
      }
    }
    const c = panGains(0);
    assert.ok(Math.abs(c.l - Math.SQRT1_2) < 1e-9 && Math.abs(c.r - Math.SQRT1_2) < 1e-9, 'equal power at the center');
  });
  it('a walker is told what stopped it: the edge, the wall, or the closed door', () => {
    assert.equal(walkResult({ x: 5, y: 5 }, { x: 5.7, y: 5 }, false).stopped, null);
    assert.equal(walkResult({ x: 1, y: 5 }, { x: 0.3, y: 5 }, false).stopped, 'edge');
    assert.equal(walkResult({ x: 8.5, y: 5 }, { x: 9.6, y: 5 }, false).stopped, 'door');
    assert.equal(walkResult({ x: 8.5, y: 5 }, { x: 9.6, y: 5 }, true).stopped, null);
    assert.equal(walkResult({ x: 8.5, y: 2 }, { x: 9.6, y: 2 }, true).stopped, 'wall');
    assert.deepEqual(walkTo({ x: 8.5, y: 2 }, { x: 9.6, y: 2 }, true), { x: WALL_X - 0.45, y: 2 });
  });
  it('B8 — the wall treatment has its right name beside the old one', () => {
    assert.equal(OCCLUDED, OBSTRUCTED);
    assert.equal(occlusion, obstruction);
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
        for (const list of lists) for (const id of list) assert.ok(gaAsset(id) || MAY_BE_MISSING.has(id), `${e.id}/${l.id} → ${id}`);
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
    assert.ok(texts(step).some((t) => /TRIGGER foot contact · GUIDE · SWITCH surface = wood/.test(t)));
    assert.ok(line.text.endsWith(`→ ${GA_BUS_NAME.sfx} bus`), line.text);
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
    let r = net(on(), 'A17', 'door', 'world');
    assert.equal(starts(r.cmds).filter((c) => c.buf === 'door').length, 1);
    r = net(r.s, 'A17', 'door', 'world');
    assert.equal(starts(r.cmds).length, 0);
    assert.equal(gaFact(r.s, 'netDuplicateIgnored'), 1);
    r = net(r.s, 'A18', 'door', 'world');
    assert.equal(starts(r.cmds).filter((c) => c.buf === doorTake(false)).length, 1, 'the second NEW action closes the door');
  });
  it('a new network door action MOVES the door as well as playing it; a repeat handled twice plays again and moves nothing', () => {
    let r = net(on(), 'D1', 'door', 'world');
    assert.equal(r.s.doorOpen, true, 'the door in the picture is where the sound says it is');
    r = net(r.s, 'D1', 'door', 'world');
    assert.equal(r.s.doorOpen, true, 'an ignored repeat changes nothing');
    r = net(run(r.s, { type: 'option', patch: { dedupe: false } }).s, 'D1', 'door', 'world');
    assert.equal(starts(r.cmds).filter((c) => c.buf === 'door').length, 1, 'the double trigger is heard');
    assert.equal(r.s.doorOpen, true, 'but the door did not move a second time');
    r = net(r.s, 'D2', 'door', 'world');
    assert.equal(r.s.doorOpen, false);
    // the log and the flight say what the action really did to the door (walk audit W2-04)
    assert.ok(texts(r.s).some((t) => t.includes('Action D2 (door closes) ARRIVED')), texts(r.s).join(' | '));
    assert.equal(r.s.netFlights!.find((f) => f.id === 'D2')!.door, 'closed');
  });
  it('without the id check the duplicate double-triggers — and an alert for the other player never plays here', () => {
    const first = net(run(on(), { type: 'option', patch: { dedupe: false } }).s, 'A1', 'door', 'world');
    let r = net(first.s, 'A1', 'door', 'world');
    assert.equal(starts([...first.cmds, ...r.cmds]).filter((c) => c.buf === 'door').length, 2);
    assert.equal(gaFact(r.s, 'netDoublePlayed'), 1);
    r = net(on(), 'B1', 'alert', 'them');
    assert.equal(starts(r.cmds).length, 0);
    r = net(on(), 'B2', 'alert', 'me');
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
    assert.ok(Math.abs(fades.find((c) => c.v === room)!.gain! - Math.pow(10, -12 / 20)) < 1e-9, 'the room bed comes up to its own level, 12 dB under full (F12)');
    assert.equal(gaFact(r.s, 'zoneCross'), 1);
    assert.equal(gaFact(r.s, 'zoneCrossFade'), 1);
    const noBeds = run(on(), { type: 'door' }, { type: 'move', who: 'player', x: 8.6, y: 5 }, { type: 'move', who: 'player', x: 10.2, y: 5 });
    assert.equal(gaFact(noBeds.s, 'zoneCrossFade'), 0);
    assert.ok(texts(noBeds.s).some((t) => t.includes('No ambience bed is playing, so nothing fades')));
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
    assert.ok(gaPlaying(away.s, 'fountain'), 'still an instance: tracked, not played');
    const stopped = away.cmds.find((c) => c.t === 'stop') as Extract<GaCmd, { t: 'stop' }>;
    assert.ok(stopped);
    // F2: the engine CONFIRMS that stop a moment later. That is not the end of the instance.
    const confirmed = run(away.s, { type: 'engine', evt: { e: 'ended', v: stopped.v, why: 'stopped' } });
    assert.ok(gaPlaying(confirmed.s, 'fountain'), 'the virtual loop survives the engine saying "ended"');
    assert.equal(gaVirtualCount(confirmed.s), 1);
    assert.ok(!texts(confirmed.s).some((t) => t.startsWith('Fountain') && t.includes('ended')));
    const back = run(confirmed.s, { type: 'move', who: 'player', x: 9.5, y: 5 }, { type: 'move', who: 'player', x: 4, y: 3 });
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
    assert.equal(r.s.log.slice(before).filter((l) => l.kind === 'stop').length, 1, 'ONE line tells of the interruption');
    assert.ok(r.s.log.slice(before).some((l) => /^Guide: greeting \(i\d+\) INTERRUPTED by a more important line: it stops$/.test(l.text)));
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
  it('lowering the limit below what is playing takes the least important voices first; the loops go virtual, nothing is switched off', () => {
    let s = run(on(), { type: 'scene', on: true }, { type: 'alarm', on: true }, { type: 'machine', id: 'generator-1', on: true }).s;
    const stolenBefore = gaFact(s, 'stolen');
    s = run(s, { type: 'voiceLimit', limit: 3 }).s;
    assert.equal(gaVoiceCount(s), 3);
    assert.ok(gaPlaying(s, 'alarm'), 'the alarm survives');
    const bedVoices = s.voices.filter((v) => v.asset === 'amb_room' || v.asset === 'amb_yard');
    assert.ok(bedVoices.length === 2 && bedVoices.every((v) => v.state === 'virtual' && v.stolen), 'the beds (priority 10) gave up their voices first');
    assert.ok(gaPlaying(s, 'bed_room') && gaPlaying(s, 'bed_yard'), 'and they are still instances: the scene was not switched off');
    assert.equal(gaFact(s, 'stolen'), stolenBefore, 'lowering the budget is not counted as a theft by a new voice');
    assert.equal(gaFact(s, 'shed'), 3);
    assert.ok(texts(s).some((t) => t.startsWith('Over the budget: Room tone (i1) gives up its voice. It is a loop: VIRTUAL until a voice is free')));
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
    assert.ok(texts(r.s).some((t) => t.startsWith('PARAMETER speed = 87% on GENERATOR 1')), texts(r.s).join(' | '));
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
    assert.ok(texts(s).some((t) => t.includes('The budget stays at 2')));
    const one = run(on(), { type: 'voiceLimit', limit: 1 }, { type: 'alarm', on: true }, { type: 'step', who: 'player', dx: 0, dy: 0 });
    assert.ok(texts(one.s).some((t) => t.includes('REFUSED: the one voice is in use')));
  });
  it('A2 — a generator whose voices were all taken is STILL RUNNING: it is virtual, and nothing switched it off', () => {
    let s = run(on(), { type: 'machine', id: 'generator-1', on: true }, { type: 'voiceLimit', limit: 2 }).s;
    s = run(s, { type: 'post', event: 'vo_warning', owner: 'guide' }, { type: 'alarm', on: true }).s;
    assert.ok(gaPlaying(s, 'generator'), 'the instance is still there');
    assert.equal(s.machines[0].on, true, 'the machine is still on');
    assert.equal(gaStolenCount(s), 2);
    assert.equal(gaVoiceCount(s), 2);
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
    // each action must LAND (0.25 s) to be judged at all
    const first = net(run(on(), { type: 'option', patch: { dedupe: false } }).s, 'Z1', 'alert', 'them');
    const r = net(first.s, 'Z1', 'alert', 'them');
    assert.equal(gaFact(r.s, 'netPrivateOther'), 2, 'both copies arrived and were judged');
    assert.equal(gaFact(r.s, 'netDoublePlayed'), 0);
    // the same repeat for THIS player is a double
    const me = net(net(run(on(), { type: 'option', patch: { dedupe: false } }).s, 'Z2', 'alert', 'me').s, 'Z2', 'alert', 'me');
    assert.equal(gaFact(me.s, 'netDoublePlayed'), 1);
  });
});

describe('sound off is not a failure; an engine refusal is', () => {
  it('with sound off: instances, takes and log lines exist, nothing is sent, the log says not heard', () => {
    const r = run(gaInitial(), { type: 'scene', on: true }, { type: 'machine', id: 'generator-1', on: true }, { type: 'step', who: 'player', dx: 0, dy: 0 });
    assert.equal(r.cmds.length, 0);
    assert.ok(gaPlaying(r.s, 'generator') && gaPlaying(r.s, 'footstep'));
    assert.ok(r.s.log.some((l) => l.kind === 'start' && l.text.endsWith('(not heard: sound is off)')));
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
    assert.ok(texts(r.s).some((t) => t.includes('could NOT start Door · door: audio is paused')));
  });
  it('the planted missing file: the event IS posted, nothing can play, and the log names the file', () => {
    const r = run(on(), { type: 'fault', patch: { missingDoor: true, } }, { type: 'option', patch: { doorRattle: false } }, { type: 'door' });
    assert.equal(starts(r.cmds).length, 0);
    assert.ok(r.s.log.some((l) => l.text.startsWith('EVENT Play_Door')));
    assert.ok(texts(r.s).some((t) => t.includes('"door_open_v2.wav" is NOT IN THE BUILD')));
    assert.equal(gaCopies(r.s, 'door_open'), 0);
    const fixed = run(r.s, { type: 'fault', patch: { missingDoor: false } }, { type: 'door' });
    assert.equal(starts(fixed.cmds).filter((c) => c.buf === doorTake(fixed.s.doorOpen)).length, 1);
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

/* ── audit 2 (2026-11-12): each of these would have failed before the fix ── */

const stops = (cmds: GaCmd[]) => cmds.filter((c) => c.t === 'stop') as Extract<GaCmd, { t: 'stop' }>[];
const music = (cmds: GaCmd[]) => cmds.filter((c) => c.t === 'music') as Extract<GaCmd, { t: 'music' }>[];
const db = (g: number) => 20 * Math.log10(g);

describe('audit 2 — numbers the lessons print', () => {
  it('F6 / W1 F01 — the generator: full level inside 4 m, silent from 12 m, and the west end of the path is past it', () => {
    assert.deepEqual(GA_EVENTS.generator.atten, { min: 4, max: 12 });
    // from where every page opens it is 6 dB up on the old 2 m minimum
    const d = Math.hypot(PLACES.generator.x - START.player.x, PLACES.generator.y - START.player.y);
    assert.ok(Math.abs(db(attenuationGain(d, GA_EVENTS.generator.atten!)) - db(attenuationGain(d, { min: 2, max: 13 })) - 6.02) < 0.05);
    // the written steps: face west (270°) and press STEP: it MUST go virtual before the edge
    let s = run(on(), { type: 'machine', id: 'generator-1', on: true }, { type: 'face', who: 'player', facing: 270 }).s;
    let steps = 0;
    while (gaVirtualCount(s) === 0 && steps < 20) {
      s = run(s, { type: 'step', who: 'player' }).s;
      steps++;
    }
    assert.ok(gaVirtualCount(s) === 2 && steps < 10, `virtual after ${steps} steps`);
    // and from any facing between 250° and 290° the same walk gets there
    for (const facing of [250, 260, 275, 280, 290]) {
      let w = run(on(), { type: 'machine', id: 'generator-1', on: true }, { type: 'face', who: 'player', facing }).s;
      for (let k = 0; k < 16 && gaVirtualCount(w) === 0; k++) w = run(w, { type: 'step', who: 'player' }).s;
      assert.equal(gaVirtualCount(w), 2, `facing ${facing}°`);
    }
  });
  it('F12 / F20 — the beds sit 12 and 8 dB under full level, the alarm 11 dB', () => {
    const r = run(on(), { type: 'scene', on: true });
    const st = starts(r.cmds);
    assert.ok(Math.abs(db(st.find((c) => c.buf === 'amb_room')!.gain) + 12) < 1e-6);
    assert.ok(Math.abs(db(st.find((c) => c.buf === 'amb_yard')!.gain) + 8) < 1e-6);
    assert.equal(GA_EVENTS.alarm.layers[0].gainDb, -11);
  });
  it('the constants a page prints are exported once', () => {
    assert.equal(GA_NET_DELAY_S, 0.25);
    assert.equal(GA_STINGER_LEAD_S, 0.3125);
    assert.equal(GA_BURST_SPREAD_S, 0.3);
    assert.deepEqual([GA_BIRD_MIN_S, GA_BIRD_MAX_S], [4, 9]);
    assert.deepEqual(GA_BUS_NAME, { ambience: 'AMBIENCE', sfx: 'EFFECTS', dialogue: 'DIALOGUE', music: 'MUSIC', ui: 'INTERFACE', chat: 'CHAT' });
    assert.equal(OBSTRUCTED.lowpassHz, 900);
    assert.ok(Math.abs(db(OBSTRUCTED.gain) + 9) < 1e-9);
    assert.equal(GA_MUSIC_MARGIN_S, 0.06);
    // the rebuilt fountain file is 3.6 dB quieter, so its layer plays at full gain (was -3 dB)
    assert.equal(GA_EVENTS.fountain.layers[0].gainDb, 0);
    assert.equal(starts(run(on(), { type: 'master', value: 1 }, { type: 'post', event: 'fountain', owner: 'fountain' }).cmds)[0].gain, 1);
  });
});

describe('audit 2 — the door (F13)', () => {
  it('the door itself is never treated by the wall: closing is as clear as opening, from the courtyard', () => {
    const open = run(on(), { type: 'door' });
    const close = run(open.s, { type: 'door' });
    const a = starts(open.cmds).find((c) => c.buf === 'door')!;
    const b = starts(close.cmds).find((c) => c.buf === doorTake(false))!;
    assert.ok(b, 'closing posts its own take once the bank holds it, the one take until then');
    assert.equal(b.lowpass, 20000, 'no wall filter on the door when it closes');
    assert.equal(a.lowpass, 20000);
    assert.ok(Math.abs(a.gain - b.gain) < 1e-9, 'and the same level both ways');
    assert.equal(gaFact(close.s, `take:door_open::${doorTake(false)}`), 1);
    // the helper the picture reads says the same
    assert.equal(gaInstWall(close.s, close.s.inst.find((i) => i.event === 'door_open')!), CLEAR);
    // while the generator behind the same closed door IS treated
    const gen = run(close.s, { type: 'machine', id: 'generator-1', on: true });
    assert.equal(starts(gen.cmds)[0].lowpass, 900);
    assert.equal(gaInstWall(gen.s, gen.s.inst.find((i) => i.event === 'generator')!), OBSTRUCTED);
  });
  it('one event plays both takes, and the START line names the file', () => {
    const r = run(on(), { type: 'door' }, { type: 'door' });
    assert.equal(r.s.log.filter((l) => l.text.startsWith('EVENT Play_Door')).length, 2);
    const lines = r.s.log.filter((l) => l.kind === 'start' && l.text.startsWith('Door · door'));
    assert.ok(lines[0].text.includes('door_open.wav'), lines[0].text);
    if (gaAsset(GA_DOOR_CLOSE_ASSET)) assert.ok(lines[1].text.includes(gaAsset(GA_DOOR_CLOSE_ASSET)!.file), lines[1].text);
  });
});

describe('audit 2 — a walker who cannot move (W1 F01, W2-21)', () => {
  it('STEP against the closed door posts NO footstep, and a NOTE says why', () => {
    let s = run(on(), { type: 'move', who: 'player', x: 8.55, y: 5 }).s;
    const before = gaFact(s, 'post:footstep');
    const r = run(s, { type: 'step', who: 'player' }); // facing 90°, east, into the door
    assert.equal(starts(r.cmds).length, 0);
    assert.equal(gaFact(r.s, 'post:footstep'), before, 'no foot touched the ground');
    assert.equal(gaFact(r.s, 'stepBlocked'), 1);
    const note = r.s.log[r.s.log.length - 1];
    assert.equal(note.kind, 'note');
    assert.ok(/closed door/.test(note.text) && /no footstep/.test(note.text), note.text);
    // pressing again does not stack the same note
    s = run(r.s, { type: 'step', who: 'player' }).s;
    assert.equal(s.log.filter((l) => l.text === note.text).length, 1);
    // open the door: the same press now walks through, with a footstep
    const through = run(s, { type: 'door' }, { type: 'step', who: 'player' });
    assert.ok(starts(through.cmds).some((c) => c.buf.startsWith('fs_')));
  });
  it('at the edge of the scene a dead press says so; a step in place still plays', () => {
    let s = run(on(), { type: 'face', who: 'player', facing: 270 }).s;
    for (let k = 0; k < 12; k++) s = run(s, { type: 'step', who: 'player' }).s;
    assert.ok(Math.abs(s.chars.player.x - 0.9) < 1e-9);
    const r = run(s, { type: 'step', who: 'player' });
    assert.equal(starts(r.cmds).length, 0);
    assert.ok(r.s.log.some((l) => l.kind === 'note' && /edge of the scene/.test(l.text)));
    const inPlace = run(r.s, { type: 'step', who: 'player', dx: 0, dy: 0 });
    assert.equal(starts(inPlace.cmds).filter((c) => c.buf.startsWith('fs_')).length, 1, 'pages 8 and 9 step in place');
  });
});

describe('audit 2 — the log is the instrument (L-02, L-03, L-25, W1 F07, F20)', () => {
  /** A long session that touches every kind of line. Every line it ever
   *  printed is collected (the log itself keeps only the newest 120). */
  function busy(): { log: GaState['log'] } {
    const seen = new Map<number, GaState['log'][number]>();
    const go = (st: GaState, ...actions: GaAction[]): GaState => {
      for (const a of actions) {
        st = a.type === 'net' ? net(st, a.id, a.what, a.to).s : gaReduce(st, a).state;
        for (const l of st.log) seen.set(l.n, l);
      }
      return st;
    };
    let s = on();
    s = go(
      s,
      { type: 'scene', on: true },
      { type: 'machine', id: 'generator-1', on: true },
      { type: 'speed', id: 'generator-1', value: 0.8 },
      { type: 'door' },
      { type: 'step', who: 'player' },
      { type: 'step', who: 'guide', dx: 0, dy: 0 },
      { type: 'post', event: 'vo_greeting', owner: 'guide' },
      { type: 'post', event: 'vo_warning', owner: 'guide' },
      { type: 'post', event: 'vo_greeting', owner: 'guide' },
      { type: 'post', event: 'chat' },
      { type: 'post', event: 'chat' },
      { type: 'post', event: 'ui_deny' },
      { type: 'alarm', on: true },
      { type: 'mood', mood: 'alert' },
      { type: 'musicStart' },
      { type: 'musicLayer', layer: 'pulse', on: false },
      { type: 'musicLayer', layer: 'pulse', on: true },
      { type: 'stinger' },
      { type: 'stinger' },
      { type: 'option', patch: { musicBoundary: 'now', reverb: false, rawYardLoop: true, dedupe: false, language: 'es' } },
      { type: 'mood', mood: 'calm' },
      { type: 'bus', bus: 'sfx', db: -6 },
      { type: 'bus', bus: 'ui', mute: true },
      { type: 'bus', bus: 'ambience', solo: true },
      { type: 'mono', on: true },
      { type: 'pan', mode: 'hrtf' },
      { type: 'mono', on: false },
      { type: 'listener', mode: 'camera' },
      { type: 'listener', mode: 'player' },
      { type: 'addMachine' },
      { type: 'machine', id: 'generator-2', on: true },
      { type: 'removeMachine', id: 'generator-2' },
      { type: 'voiceLimit', limit: 4 },
      { type: 'burst', count: 12 },
      { type: 'voiceLimit', limit: 1 },
      { type: 'voiceLimit', limit: 0 },
      { type: 'move', who: 'player', x: 15, y: 9 },
      { type: 'move', who: 'player', x: 5, y: 5 },
      { type: 'machine', id: 'generator-1', on: false },
      { type: 'musicStop' },
      { type: 'stinger' },
      { type: 'stopAll' },
      { type: 'net', id: 'N1', what: 'door', to: 'world' },
      { type: 'net', id: 'N1', what: 'door', to: 'world' },
      { type: 'net', id: 'N2', what: 'alert', to: 'them' },
      { type: 'net', id: 'N3', what: 'alert', to: 'me' },
      { type: 'fault', patch: { missingDoor: true, orphanLoop: true, bedPileUp: true } },
      { type: 'door' },
      { type: 'engine', evt: { e: 'reverb', ok: false } },
    );
    void s;
    return { log: [...seen.values()].sort((a, b) => a.n - b.n) };
  }
  it('no line begins with the word its own kind column already prints, in any case', () => {
    const s = busy();
    const kinds = new Set(s.log.map((l) => l.kind));
    for (const k of ['trigger', 'start', 'stop', 'value', 'state', 'refused', 'failed', 'mix', 'music', 'net', 'note'] as const) assert.ok(kinds.has(k), `the session has a ${k} line`);
    for (const l of s.log) {
      const word = GA_LOG_KIND_WORD[l.kind];
      assert.ok(!l.text.toUpperCase().startsWith(word), `${word}: ${l.text}`);
      assert.ok(!/^(music|network):/i.test(l.text), l.text);
      assert.ok(/^[A-Z0-9"]/.test(l.text), `starts with a capital: ${l.text}`);
    }
  });
  /** The lines only an ENGINE answer prints: a line ends, a stinger plays and ends, refusals. */
  function answered(): GaState['log'] {
    let s = run(on(), { type: 'post', event: 'vo_greeting', owner: 'guide' }, { type: 'machine', id: 'generator-1', on: true }, { type: 'musicStart' }, { type: 'stinger' }).s;
    s = run(s, { type: 'engine', evt: { e: 'ended', v: s.voices.find((v) => v.bus === 'dialogue')!.v, why: 'natural' } }).s;
    s = run(s, { type: 'engine', evt: { e: 'music', what: 'applied', req: s.music.stinger!.req, at: 0 } }).s;
    s = run(s, { type: 'engine', evt: { e: 'music', what: 'stinger', req: s.voices.find((v) => v.music)!.v, state: 'ended' } }).s;
    s = run(s, { type: 'engine', evt: { e: 'failed', v: 'music:drive', why: 'missing-buffer' } }, { type: 'engine', evt: { e: 'failed', v: s.voices.find((v) => v.asset === 'gen_hum')!.v, why: 'suspended' } }).s;
    s = run(s, { type: 'engine', evt: { e: 'reverb', ok: false } }, { type: 'engine', evt: { e: 'failed', v: 'music', why: 'suspended' } }).s;
    assert.ok(s.log.some((l) => l.text.startsWith('DUCK off')));
    return s.log;
  }
  it('no dash in any line, no "at once", and never a bus or an object by its id', () => {
    for (const l of [...busy().log, ...answered()]) {
      assert.ok(!/[—–]/.test(l.text) && !/\s-\s/.test(l.text), `no dash, and no hyphen standing for one: ${l.text}`);
      assert.ok(!/STOLEN from [a-z_0-9]+ \(|the voice of [a-z_0-9]+ \(|NOT start [a-z_0-9]+:/.test(l.text), `never a file id: ${l.text}`);
      assert.ok(!/\bat once\b/i.test(l.text), l.text);
      assert.ok(!/\b(sfx|ui) bus\b/.test(l.text) && !/BUS (sfx|ui|ambience|dialogue|music|chat)\b/.test(l.text), l.text);
      assert.ok(!/generator-[12]|by player|by guide|· player ·|· guide ·/.test(l.text), l.text);
      assert.ok(!/rendered|cross-fade/.test(l.text), l.text);
    }
  });
  it('the lines read as the controls do', () => {
    const t = busy().log.map((l) => l.text);
    const has = (re: RegExp) => assert.ok(t.some((x) => re.test(x)), `${re} in:\n${t.join('\n')}`);
    has(/^EVENT Play_Footstep posted by YOU$/);
    has(/^Generator · hum → EFFECTS bus$/);
    has(/^Interface: not allowed · cue → INTERFACE bus$/);
    has(/^MOOD = ALERT \(a global state/);
    has(/^BUS EFFECTS: -6 dB$/);
    has(/^BUS INTERFACE: 0 dB, MUTED$/);
    has(/^BUDGET: at most 4 voices may sound at the same time$/);
    has(/^SETTING courtyard wind file: RAW CUT$/);
    has(/^SETTING network ID check: OFF$/);
    has(/^SETTING music changes land: immediately$/);
    has(/^RENDERER: headphone 3D \(binaural\)$/);
    has(/^LISTENER moved back to YOU$/);
    has(/^GENERATOR 2 removed: its instance i\d+ is stopped and released with it$/);
    has(/^Three layers START together on one clock/);
    has(/^The music STOPS$/);
    has(/^Simulated player communication is already playing: the event is ignored/);
    has(/^Action N1 \(door\) SENT: it arrives in 0\.25 s$/);
  });
  it('W1 F07 — one SPEED drag is ONE value line, updated, so the START lines stay on screen', () => {
    let s = run(on(), { type: 'machine', id: 'generator-1', on: true }).s;
    const startLines = s.log.filter((l) => l.kind === 'start').length;
    for (let k = 1; k <= 10; k++) s = run(s, { type: 'speed', id: 'generator-1', value: 0.4 + k * 0.05 }).s;
    const values = s.log.filter((l) => l.kind === 'value');
    assert.equal(values.length, 1);
    assert.equal(values[0].count, 10);
    assert.ok(values[0].text.startsWith('PARAMETER speed = 90% on GENERATOR 1') && values[0].text.endsWith('· 10 changes'), values[0].text);
    assert.equal(s.log.filter((l) => l.kind === 'start').length, startLines);
    assert.equal(s.log.length, 4, 'EVENT, two STARTs and one VALUE: nothing was pushed out');
    assert.equal(gaFact(s, 'speedWhilePlaying'), 10, 'the facts still count every change');
    // something else in between starts a new run
    s = run(s, { type: 'door' }, { type: 'speed', id: 'generator-1', value: 0.2 }).s;
    assert.equal(s.log.filter((l) => l.kind === 'value').length, 2);
    // and a bus fader drag is one line too
    let m = on();
    for (let k = 1; k <= 8; k++) m = run(m, { type: 'bus', bus: 'music', db: -k }).s;
    assert.deepEqual(texts(m), ['BUS MUSIC: -8 dB']);
    m = run(m, { type: 'bus', bus: 'music', mute: true }).s;
    assert.equal(m.log.length, 2, 'a MUTE is its own line');
  });
  it('W1 F20 — a two-voice generator going virtual, and coming back, is one line each', () => {
    let s = run(on(), { type: 'door' }, { type: 'machine', id: 'generator-1', on: true }).s;
    s = run(s, { type: 'move', who: 'player', x: 1, y: 9 }).s;
    assert.equal(gaVirtualCount(s), 2);
    assert.equal(s.log.filter((l) => l.text === 'Generator left its maximum distance: VIRTUAL (tracked, not played)').length, 1);
    s = run(s, { type: 'move', who: 'player', x: 8, y: 5 }).s;
    assert.equal(s.log.filter((l) => l.text === 'Generator is back in range: played again').length, 1);
  });
  it('W2-16 — the two languages read differently in the log: the START line names the take’s file', () => {
    const en = run(on(), { type: 'post', event: 'vo_greeting', owner: 'guide' }).s;
    const es = run(on(), { type: 'option', patch: { language: 'es' }, quiet: true }, { type: 'post', event: 'vo_greeting', owner: 'guide' }).s;
    const line = (s: GaState) => s.log.find((l) => l.kind === 'start')!.text;
    assert.notEqual(line(en), line(es));
    assert.ok(line(en).includes(gaAsset(GA_LINES.vo_greeting.en.asset)!.file) && line(en).endsWith('→ DIALOGUE bus'), line(en));
    assert.ok(line(es).includes(gaAsset(GA_LINES.vo_greeting.es.asset)!.file), line(es));
  });
  it('W2-07 — leaving MONO names what is really chosen', () => {
    let s = run(on(), { type: 'pan', mode: 'hrtf' }, { type: 'mono', on: true }, { type: 'mono', on: false }).s;
    assert.equal(s.log[s.log.length - 1].text, 'OUTPUT no longer folded to mono: headphone 3D (binaural) again');
    s = run(on(), { type: 'mono', on: true }, { type: 'mono', on: false }).s;
    assert.equal(s.log[s.log.length - 1].text, 'OUTPUT no longer folded to mono: stereo again');
    // a mono command that changes nothing says nothing
    assert.equal(run(on(), { type: 'mono', on: false }).s.log.length, 0);
  });
  it('F26 — switching the renderer MOVES every living positioned voice; nothing restarts and nothing ends', () => {
    const s = run(on(), { type: 'scene', on: true }, { type: 'machine', id: 'generator-1', on: true }, { type: 'door' }).s;
    const positioned = s.voices.filter((v) => ['gen_hum', 'gen_air', 'fountain', 'door', 'door_rattle'].includes(v.asset)).map((v) => v.v);
    const r = run(s, { type: 'pan', mode: 'hrtf' });
    assert.equal(starts(r.cmds).length + r.cmds.filter((c) => c.t === 'stop').length, 0, 'no voice is stopped or started again');
    const moved = sets(r.cmds);
    assert.deepEqual(moved.map((c) => c.v).sort(), [...positioned].sort(), 'the beds, which have no position, are left alone');
    assert.ok(moved.every((c) => c.mode === 'hrtf' && c.pos != null && c.pan != null));
    assert.deepEqual(r.s.voices.map((v) => v.v), s.voices.map((v) => v.v), 'the same voices, under the same ids');
    assert.deepEqual(r.s.inst.map((i) => i.id), s.inst.map((i) => i.id), 'the door that was sounding plays on');
    assert.ok(!texts(r.s).some((t) => t.includes('ended')));
    // a voice that starts afterwards starts on the new renderer
    assert.equal(starts(run(r.s, { type: 'step', who: 'player', dx: 0, dy: 0 }).cmds)[0].mode, 'hrtf');
    // unheard, there is nothing to tell the engine
    assert.equal(run(run(gaInitial(), { type: 'machine', id: 'generator-1', on: true }).s, { type: 'pan', mode: 'hrtf' }).cmds.length, 0);
  });
  it('W2-27 — correcting the dialogue routing while the misrouted line still speaks does not claim a duck', () => {
    let s = run(on(), { type: 'fault', patch: { voWrongBus: true } }, { type: 'post', event: 'vo_greeting', owner: 'guide' }).s;
    s = run(s, { type: 'fault', patch: { voWrongBus: false } }).s;
    assert.equal(s.duckOwners, 0, 'that line plays on the effects bus until it ends');
    assert.ok(!texts(s).some((t) => t.startsWith('DUCK on')));
    s = run(s, { type: 'stopAll' }, { type: 'post', event: 'vo_greeting', owner: 'guide' }).s;
    assert.equal(s.duckOwners, 1, 'the next line is on the dialogue bus and ducks');
  });
  it('a page opening stamps its time, so a log row can show time since the page opened', () => {
    const s = gaReduce(gaReduce(on(), { type: 'door' }, 100).state, { type: 'enterPage' }, 250).state;
    assert.equal(s.tPage, 250);
    assert.equal(gaReduce(s, { type: 'door' }, 251.5).state.log[0].t - s.tPage, 1.5);
  });
});

describe('audit 2 — the budget: a stolen loop goes virtual and comes back (decision 4, A2, W2-09)', () => {
  it('the page-17 walk: BUDGET 8, SCENE and GENERATOR 1 on, BURST. Nothing switches itself off', () => {
    let s = run(on(), { type: 'voiceLimit', limit: 8 }, { type: 'scene', on: true }, { type: 'machine', id: 'generator-1', on: true }).s;
    assert.equal(gaVoiceCount(s), 5);
    const r = run(s, { type: 'burst', count: 12 });
    s = r.s;
    assert.equal(gaVoiceCount(s), 8, 'never more than the budget');
    assert.equal(s.machines[0].on, true, 'GENERATOR 1 is still on');
    assert.ok(gaPlaying(s, 'generator') && gaPlaying(s, 'bed_room') && gaPlaying(s, 'bed_yard') && gaPlaying(s, 'fountain'), 'the scene is still on');
    assert.equal(gaStolenCount(s), 5, 'the five loop voices are virtual, marked stolen');
    assert.ok(s.voices.filter((v) => v.loop).every((v) => v.state === 'virtual' && v.stolen && v.slot == null));
    assert.equal(gaFact(s, 'stolen'), 9);
    // ONE line per theft, in the order the rule gives: least important, oldest first
    const thefts = s.log.filter((l) => l.kind === 'stop' && l.text.startsWith('Voice STOLEN from'));
    assert.equal(thefts.length, 9);
    assert.deepEqual(thefts.slice(0, 5).map((l) => l.text.split(' (')[0].replace('Voice STOLEN from ', '')), ['Room tone', 'Courtyard wind', 'Fountain', 'Generator · hum', 'Generator · fan']);
    assert.ok(thefts[0].text.includes('It is a loop: VIRTUAL until a voice is free'), thefts[0].text);
    assert.ok(thefts[8].text.includes('It is a one-shot: it stops'), thefts[8].text);
    assert.equal(s.log.filter((l) => l.kind === 'stop').length, 9, 'no second line per theft');
    // the engine was told to stop each stolen loop, and nothing else of them
    assert.equal(stops(r.cmds).length, 9);
    // the impacts finish: their natural ends are NOT logged (the STOLEN lines stay readable) ...
    const linesBefore = s.log.length;
    for (const v of s.voices.filter((x) => !x.loop)) s = run(s, { type: 'engine', evt: { e: 'ended', v: v.v, why: 'natural' } }).s;
    assert.equal(s.log.filter((l) => /ended \(it finished\)/.test(l.text)).length, 0);
    // ... and every stolen loop has a voice again, the most important first
    assert.equal(gaStolenCount(s), 0);
    assert.equal(gaVoiceCount(s), 5);
    const back = s.log.slice(linesBefore).map((l) => l.text);
    assert.deepEqual(back.map((t) => t.split(' (')[0]), ['Generator · hum', 'Generator · fan', 'Fountain', 'Room tone', 'Courtyard wind'], back.join(' | '));
    assert.ok(s.voices.every((v) => v.state !== 'virtual' && v.slot != null));
  });
  it('a loop that comes back is started again in the engine under a new voice id', () => {
    const s = run(on(), { type: 'voiceLimit', limit: 1 }, { type: 'post', event: 'fountain', owner: 'fountain' }).s;
    const old = s.voices[0].v;
    const steal = run(s, { type: 'post', event: 'ui_confirm' });
    assert.deepEqual(stops(steal.cmds).map((c) => c.v), [old]);
    assert.ok(steal.s.voices.find((v) => v.asset === 'fountain')!.stolen);
    // the engine confirms the stop: the loop is still tracked (F2 again)
    let t = run(steal.s, { type: 'engine', evt: { e: 'ended', v: old, why: 'stopped' } });
    assert.ok(gaPlaying(t.s, 'fountain'));
    // the cue ends: the voice is free, the loop returns
    t = run(t.s, { type: 'engine', evt: { e: 'ended', v: steal.s.voices.find((v) => v.asset === 'ui_confirm')!.v, why: 'natural' } });
    const again = starts(t.cmds);
    assert.equal(again.length, 1);
    assert.equal(again[0].buf, 'fountain');
    assert.notEqual(again[0].v, old);
    assert.ok(!t.s.voices[0].stolen && t.s.voices[0].state === 'requested');
  });
  it('a NEW loop that is refused a voice still starts: it WAITS (not stolen), the machine is on, and it plays when a voice is free', () => {
    let s = run(on(), { type: 'voiceLimit', limit: 1 }, { type: 'alarm', on: true }).s;
    const r = run(s, { type: 'machine', id: 'generator-1', on: true });
    assert.equal(starts(r.cmds).length, 0, 'the alarm is protected: there is no voice to take');
    assert.equal(gaFact(r.s, 'refused'), 2, 'both layers were refused a voice');
    assert.ok(gaPlaying(r.s, 'generator') && r.s.machines[0].on, 'but the generator IS running, and is tracked');
    assert.equal(gaStolenCount(r.s), 0, 'nothing was taken from it (N10)');
    assert.deepEqual(gaVoiceSlots(r.s).out.map((x) => x.state), ['waiting', 'waiting']);
    assert.ok(texts(r.s).some((t) => t === 'Generator has no voice yet: it WAITS (tracked, not played) and plays when a voice is free'));
    // a refused ONE-SHOT is simply gone
    const step = run(r.s, { type: 'step', who: 'player', dx: 0, dy: 0 });
    assert.ok(!gaPlaying(step.s, 'footstep'));
    // the alarm is cleared: one voice is free, and one layer of the generator takes it
    s = run(r.s, { type: 'alarm', on: false }).s;
    assert.equal(gaVoiceCount(s), 1);
    assert.deepEqual(gaVoiceSlots(s).out.map((x) => x.state), ['waiting']);
    assert.ok(texts(s).some((t) => /^Generator · hum \(i\d+\) has a voice now: no longer WAITING$/.test(t)));
    assert.equal(gaVoiceCount(run(s, { type: 'voiceLimit', limit: 0 }).s), 2);
  });
  it('raising the budget brings stolen loops back', () => {
    let s = run(on(), { type: 'scene', on: true }, { type: 'voiceLimit', limit: 1 }).s;
    assert.equal(gaStolenCount(s), 2);
    s = run(s, { type: 'voiceLimit', limit: 0 }).s;
    assert.equal(gaStolenCount(s), 0);
    assert.equal(gaVoiceCount(s), 3);
  });
  it('gaVoiceSlots: a voice keeps its slot, a thief takes the slot it freed, the stolen loop waits outside', () => {
    let s = run(on(), { type: 'voiceLimit', limit: 4 }, { type: 'scene', on: true }, { type: 'alarm', on: true }).s;
    let b = gaVoiceSlots(s);
    assert.equal(b.limit, 4);
    assert.equal(b.used, 4);
    assert.deepEqual(b.slots.map((x) => x?.name), ['Room tone', 'Courtyard wind', 'Fountain', 'Overheat alarm']);
    assert.deepEqual(b.slots[3] && [b.slots[3].busName, b.slots[3].priority, b.slots[3].protected, b.slots[3].state], ['EFFECTS', 90, true, 'requested']);
    s = run(s, { type: 'engine', evt: { e: 'started', v: s.voices[3].v, at: 0, now: 0 } }, { type: 'post', event: 'ui_confirm' }).s;
    b = gaVoiceSlots(s);
    assert.deepEqual(b.slots.map((x) => x?.name), ['Interface: confirm', 'Courtyard wind', 'Fountain', 'Overheat alarm'], 'the cue sits where the room tone was');
    assert.equal(b.slots[3]!.state, 'playing');
    assert.deepEqual(b.out.map((x) => [x.name, x.state]), [['Room tone', 'stolen']]);
    // no limit: as many slots as are in use; a layered event names its layer
    const free = gaVoiceSlots(run(on(), { type: 'voiceLimit', limit: 0 }, { type: 'machine', id: 'generator-1', on: true }).s);
    assert.deepEqual(free.slots.map((x) => x?.name), ['Generator · hum', 'Generator · fan']);
    assert.equal(free.limit, 0);
    // out of range is "virtual", not "stolen"
    const far = gaVoiceSlots(run(on(), { type: 'door' }, { type: 'machine', id: 'generator-1', on: true }, { type: 'move', who: 'player', x: 1, y: 9 }).s);
    assert.deepEqual(far.out.map((x) => x.state), ['virtual', 'virtual']);
    assert.deepEqual(far.slots.filter(Boolean).map((x) => x!.name), ['Door · door', 'Door · rattle']);
  });
  it('F28 — BURST is a busy moment: the impacts are spread over 0.3 s, each with its own level and pitch', () => {
    const r = run(on(), { type: 'burst', count: 12 });
    const st = starts(r.cmds);
    assert.equal(st.length, 12);
    const delays = st.map((c) => c.delay ?? 0);
    assert.equal(delays[0], 0);
    assert.ok(Math.abs(delays[11] - GA_BURST_SPREAD_S) < 1e-9);
    for (let k = 1; k < 12; k++) assert.ok(delays[k] > delays[k - 1], 'each one later than the last');
    assert.ok(new Set(st.map((c) => c.rate)).size >= 10 && new Set(st.map((c) => c.gain.toFixed(5))).size >= 10, 'not twelve copies of one hit');
    assert.ok(texts(r.s)[0].startsWith('BURST: 12 crate impacts are posted within 0.3 s'));
  });
});

describe('audit 2 — music (F3, F5, F23, F24, W2-15)', () => {
  const playing = () => run(on(), { type: 'musicStart' });
  it('F3 — a stinger waits once, begins on its line as an INSTANCE on the music bus, and ends on the engine’s word', () => {
    let r = run(playing().s, { type: 'stinger' });
    const cmd = music(r.cmds).find((c) => c.op === 'stinger') as Extract<GaCmd, { t: 'music'; op: 'stinger' }>;
    assert.equal(cmd.lead, GA_STINGER_LEAD_S, 'the hit is a half beat into the file');
    assert.equal(r.s.music.stinger?.req, cmd.req);
    assert.equal(r.s.inst.length, 0, 'not playing yet');
    // pressed again before it lands: not a second stinger
    const twice = run(r.s, { type: 'stinger' });
    assert.equal(music(twice.cmds).length, 0);
    assert.equal(gaFact(twice.s, 'stingerIgnored'), 1);
    assert.ok(texts(twice.s).some((t) => t.startsWith('A STINGER is already waiting')));
    // the engine: queued, then it begins
    r = run(twice.s, { type: 'engine', evt: { e: 'music', what: 'queued', req: cmd.req, at: 5, inS: 1.8, boundary: 'bar' } });
    assert.equal(r.s.music.stinger?.inS, 1.8);
    r = run(r.s, { type: 'engine', evt: { e: 'music', what: 'applied', req: cmd.req, at: 5 } });
    assert.equal(r.s.music.stinger, null);
    assert.deepEqual(r.s.inst.map((i) => [i.event, i.owner]), [['stinger', 'music']], 'it is shown in PLAYING');
    assert.deepEqual(r.s.voices.map((v) => [v.bus, v.music, v.loop]), [['music', true, false]]);
    assert.equal(gaVoiceCount(r.s), 0, 'the music is outside this scene’s voice count');
    assert.ok(texts(r.s).some((t) => t.startsWith('STINGER played exactly on the bar line') && t.includes('MUSIC bus')), texts(r.s).join(' | '));
    assert.equal(r.cmds.length, 0, 'no voice command: the engine already plays it');
    // it ends when the engine says so
    const done = run(r.s, { type: 'engine', evt: { e: 'music', what: 'stinger', req: cmd.req, state: 'ended' } });
    assert.equal(done.s.inst.length + done.s.voices.length, 0);
    assert.ok(texts(done.s).some((t) => /^Stinger i\d+ ended \(it finished\)$/.test(t)));
    // STOP MUSIC while it sounds: gone from the model at once, and no voice stop is sent for it
    const cut = run(r.s, { type: 'musicStop' });
    assert.equal(cut.s.inst.length, 0);
    assert.deepEqual(cut.cmds.map((c) => c.t), ['music']);
    // ■ STOP too
    assert.equal(run(r.s, { type: 'stopAll' }).s.inst.length, 0);
    // a new one can be asked once the first has begun
    assert.ok(run(r.s, { type: 'stinger' }).s.music.stinger);
  });
  it('a stinger with no music playing says why nothing happens', () => {
    const r = run(on(), { type: 'stinger' });
    assert.equal(r.cmds.length, 0);
    assert.ok(texts(r.s)[0].startsWith('STINGER ignored: the music is not playing'));
  });
  it('unheard, a stinger still waits for a boundary that leaves room for its lead, then plays unheard', () => {
    let s = gaReduce(gaInitial(), { type: 'musicStart' }, 100).state;
    // 2.3 s into the bar: the bar line is 0.2 s away, less than the lead, so it takes the NEXT one
    let r = gaReduce(s, { type: 'stinger' }, 102.3);
    assert.ok(Math.abs(r.state.music.stinger!.inS! - 2.7) < 1e-9);
    assert.ok(Math.abs(gaStingerWait(gaReduce(s, { type: 'tick', t: 101 }).state, 'bar') - 1.5) < 1e-9);
    // the engine's rule exactly: the first line at least 0.06 + 0.3125 = 0.3725 s away.
    // 0.35 s before a line there is room for the lead but not for the margin: the next line.
    assert.ok(Math.abs(gaStingerWait(gaReduce(s, { type: 'tick', t: 102.15 }).state, 'bar') - 2.85) < 1e-9);
    assert.ok(Math.abs(gaStingerWait(gaReduce(s, { type: 'tick', t: 102.12 }).state, 'bar') - 0.38) < 1e-9);
    // a layer change keeps the same 0.06 s margin
    assert.ok(Math.abs(gaMusicWait(gaReduce(s, { type: 'tick', t: 102.45 }).state, 'bar') - 2.55) < 1e-9);
    assert.ok(Math.abs(gaMusicWait(gaReduce(s, { type: 'tick', t: 102.4 }).state, 'bar') - 0.1) < 1e-9);
    assert.ok(Math.abs(gaMusicWait(s, 'bar') - 2.5) < 1e-9, 'asked exactly on a line: the next one');
    s = gaReduce(r.state, { type: 'engine', evt: { e: 'music', what: 'applied', req: r.state.music.stinger!.req, at: 0 } }, 105).state;
    assert.ok(gaPlaying(s, 'stinger'));
    assert.ok(s.log[s.log.length - 1].text.endsWith('(not heard: sound is off)'));
    s = gaReduce(s, { type: 'expire', v: s.voices[0].v }, 107.4).state;
    assert.ok(!gaPlaying(s, 'stinger'));
  });
  it('W2-15 — STOP MUSIC with a change waiting: it is logged withdrawn, and the layer is NOT on at the next START', () => {
    let r = run(playing().s, { type: 'musicLayer', layer: 'pulse', on: true });
    assert.equal(r.s.music.layers.pulse, true, 'asked for');
    assert.equal(r.s.music.applied.pulse, false, 'not sounding yet');
    r = run(r.s, { type: 'musicStop' });
    assert.ok(texts(r.s).some((t) => t === 'The waiting change (add PULSE) is WITHDRAWN: the music stopped first'), texts(r.s).join(' | '));
    assert.equal(r.s.music.layers.pulse, false);
    assert.equal(gaFact(r.s, 'musicWithdrawn'), 0, 'not counted as "a newer request replaced it"');
    r = run(r.s, { type: 'musicStart' });
    const start = music(r.cmds).find((c) => c.op === 'start') as Extract<GaCmd, { t: 'music'; op: 'start' }>;
    assert.deepEqual(start.stems.map((x) => [x.id, x.gain]), [['calm', 1], ['pulse', 0], ['drive', 0]]);
    // ■ STOP does the same, and withdraws a waiting stinger as well
    let all = run(playing().s, { type: 'musicLayer', layer: 'drive', on: true }, { type: 'stinger' }, { type: 'stopAll' });
    assert.equal(all.s.music.layers.drive, false);
    assert.equal(all.s.music.stinger, null);
    assert.ok(texts(all.s).some((t) => t.startsWith('The waiting change (add DRIVE) is WITHDRAWN')) && texts(all.s).some((t) => t.startsWith('The waiting STINGER is WITHDRAWN')));
    // a change the MOOD asked for: the state stands, so the next START begins in it, and the log says so
    all = run(playing().s, { type: 'mood', mood: 'alert' }, { type: 'musicStop' });
    assert.equal(all.s.mood, 'alert');
    assert.deepEqual(all.s.music.layers, { calm: true, pulse: true, drive: true });
    assert.ok(texts(all.s).some((t) => t.includes('never landed') && t.includes('MOOD is still ALERT')));
  });
  it('`applied` keeps what is SOUNDING apart from what is asked', () => {
    let r = run(playing().s, { type: 'mood', mood: 'alert' });
    const req = r.s.music.pending!.req;
    assert.deepEqual(r.s.music.applied, { calm: true, pulse: false, drive: false });
    assert.equal(r.s.music.pending!.cause, 'mood');
    r = run(r.s, { type: 'engine', evt: { e: 'music', what: 'applied', req, at: 1 } });
    assert.deepEqual(r.s.music.applied, { calm: true, pulse: true, drive: true });
    assert.ok(texts(r.s).some((t) => t === 'Add PULSE and DRIVE: APPLIED exactly on the bar line'));
  });
  it('the engine’s "queued" gives the countdown its due time and puts the bar lines on the engine’s clock', () => {
    let s = gaReduce(on(), { type: 'musicStart' }, 10).state;
    s = gaReduce(s, { type: 'musicLayer', layer: 'pulse', on: true }, 11).state;
    // the engine really started 0.12 s after it was asked: its next bar line is 1.62 s away, not 1.5
    s = gaReduce(s, { type: 'engine', evt: { e: 'music', what: 'queued', req: s.music.pending!.req, at: 0, inS: 1.62, boundary: 'bar' } }, 11).state;
    assert.ok(Math.abs(s.music.pending!.due! - 12.62) < 1e-9);
    assert.ok(Math.abs(s.music.t0 - 10.12) < 1e-9);
    const clock = gaMusicClock(s, 12.62 + 0.001);
    assert.deepEqual([clock.bar, clock.beat], [1, 0], 'the play line crosses into bar 2 exactly when the change lands');
    assert.ok(Math.abs(gaMusicClock(s, 10.12 + 5).phase - 0.5) < 1e-9);
    assert.equal(gaMusicClock(gaInitial()).on, false);
  });
  it('F5 — the engine saying "stopped" never switches the music off behind the learner’s back', () => {
    // an interruption: sound off, sound on. The model re-sends the music start.
    let r = run(playing().s, { type: 'sound', on: false }, { type: 'sound', on: true });
    assert.ok(music(r.cmds).some((c) => c.op === 'start'));
    r = run(r.s, { type: 'engine', evt: { e: 'music', what: 'stopped' } }, { type: 'engine', evt: { e: 'music', what: 'started', at: 1, bar: 2.5, beat: 0.625, phrase: 10 } });
    assert.equal(r.s.music.on, true, 'the music is playing, and the lab says so');
    const stop = run(r.s, { type: 'musicStop' });
    assert.ok(music(stop.cmds).some((c) => c.op === 'stop'), 'so its key can stop it');
    assert.equal(stop.s.music.on, false);
    // STOP then START inside one round trip: the late "stopped" is for the stop the lab asked for
    const quick = run(stop.s, { type: 'musicStart' }, { type: 'engine', evt: { e: 'music', what: 'stopped' } });
    assert.equal(quick.s.music.on, true);
  });
  it('the engine refusing the music itself IS taken as off, with its reason', () => {
    const r = run(playing().s, { type: 'engine', evt: { e: 'failed', v: 'music', why: 'suspended' } });
    assert.equal(r.s.music.on, false);
    assert.ok(texts(r.s).some((t) => t === 'The engine could NOT start the music: audio is paused on this device'));
  });
  it('F23 — a change waiting when sound is interrupted is not stranded: the restart carries it', () => {
    let r = run(playing().s, { type: 'musicLayer', layer: 'pulse', on: true });
    assert.ok(r.s.music.pending);
    r = gaReduceAll(r.s, 40, { type: 'sound', on: false }, { type: 'sound', on: true });
    assert.equal(r.s.music.pending, null);
    // carried by the restart, not landed on its bar: a goal judged "on the bar" must not count it (N12)
    assert.equal(gaFact(r.s, 'musicApplied'), 0);
    assert.equal(gaFact(r.s, 'musicAppliedOnRestart'), 1);
    assert.deepEqual(r.s.music.applied, { calm: true, pulse: true, drive: false });
    const start = music(r.cmds).find((c) => c.op === 'start') as Extract<GaCmd, { t: 'music'; op: 'start' }>;
    assert.equal(start.stems.find((x) => x.id === 'pulse')!.gain, 1);
    assert.equal(r.s.music.t0, 40, 'the engine starts the music again from its first bar');
    assert.ok(texts(r.s).some((t) => t.startsWith('Add PULSE: APPLIED as sound came back')));
  });
  it('F24 — sound coming on restarts LOOPS only: a line part-way through is not spoken again from its first word', () => {
    const off = run(gaInitial(), { type: 'scene', on: true }, { type: 'post', event: 'vo_greeting', owner: 'guide' }, { type: 'door' });
    const r = run(off.s, { type: 'sound', on: true });
    assert.deepEqual(starts(r.cmds).map((c) => c.buf).sort(), ['amb_room', 'amb_yard', 'fountain']);
    assert.ok(gaPlaying(r.s, 'vo_greeting'), 'the line goes on unheard, and ends on its own time');
    assert.equal(r.s.voices.find((v) => v.asset === 'vo_greeting')!.state, 'playing');
  });
});

/** Run actions at one scene time. */
function gaReduceAll(s: GaState, now: number, ...actions: GaAction[]): { s: GaState; cmds: GaCmd[] } {
  const cmds: GaCmd[] = [];
  for (const a of actions) {
    const r = gaReduce(s, a, now);
    s = r.state;
    cmds.push(...r.cmds);
  }
  return { s, cmds };
}

describe('audit 2 — the network has a delay (B5)', () => {
  it('an action is SENT, is pending for 0.25 s, then the same rules decide; a landed one is kept 4 s', () => {
    let r = gaReduce(on(), { type: 'net', id: 'A1', what: 'door', to: 'world' }, 10);
    assert.deepEqual(r.state.netFlights, [{ n: 1, id: 'A1', what: 'door', to: 'world', sent: 10, due: 10.25, result: 'pending', again: false }]);
    assert.deepEqual(r.state.netSeen, ['A1'], 'the id is known from the moment it is sent, so the next NEW action cannot reuse it');
    assert.equal(r.cmds.length, 0, 'nothing plays when it is sent');
    assert.equal(r.state.doorOpen, false);
    assert.equal(gaFact(r.state, 'netWorld'), 0, 'every fact counts at landing');
    assert.equal(gaNextDue(r.state), 10.25);
    r = gaReduce(r.state, { type: 'tick', t: 10.2 });
    assert.equal(r.state.netFlights![0].result, 'pending', 'not yet');
    r = gaReduce(r.state, { type: 'tick', t: 10.25 });
    assert.equal(r.state.netFlights![0].result, 'played');
    assert.equal(r.state.netFlights![0].door, 'opened');
    assert.equal(r.state.doorOpen, true);
    assert.equal(starts(r.cmds).filter((c) => c.buf === 'door').length, 1);
    assert.equal(gaFact(r.state, 'netWorld'), 1);
    assert.equal(gaNextDue(r.state), 10.25 + GA_NET_KEEP_S);
    // the same id again, and one for the other player
    let s = gaReduceAll(r.state, 11, { type: 'net', id: 'A1', what: 'door', to: 'world' }, { type: 'net', id: 'B1', what: 'alert', to: 'them' }).s;
    assert.deepEqual(s.netFlights!.map((f) => [f.result, f.again]), [['played', false], ['pending', true], ['pending', false]], 'a repeat is known as one when it is sent');
    s = gaReduce(s, { type: 'tick', t: 11.25 }).state;
    assert.deepEqual(s.netFlights!.map((f) => [f.id, f.result]), [['A1', 'played'], ['A1', 'ignored'], ['B1', 'other']]);
    assert.equal(gaFact(s, 'netDuplicateIgnored'), 1);
    assert.equal(gaFact(s, 'netPrivateOther'), 1);
    // four scene-seconds after it landed, a flight leaves the list
    s = gaReduce(s, { type: 'tick', t: 14.3 }).state;
    assert.deepEqual(s.netFlights!.map((f) => f.id), ['A1', 'B1']);
    s = gaReduce(s, { type: 'tick', t: 15.3 }).state;
    assert.deepEqual(s.netFlights, []);
    assert.equal(gaNextDue(s), null);
  });
  it('any later action lands what is due first; ■ STOP drops what is still on its way', () => {
    let s = gaReduce(on(), { type: 'net', id: 'C1', what: 'alert', to: 'me' }, 5).state;
    const r = gaReduce(s, { type: 'step', who: 'player', dx: 0, dy: 0 }, 5.4);
    assert.deepEqual(starts(r.cmds).map((c) => c.buf.slice(0, 3)), ['ui_', 'fs_'], 'the alert landed before the step');
    s = gaReduce(on(), { type: 'net', id: 'C2', what: 'door', to: 'world' }, 5).state;
    s = gaReduce(s, { type: 'stopAll' }, 5.1).state;
    assert.deepEqual(s.netFlights, []);
    assert.deepEqual(s.netSeen, [], 'it was never handled');
    const later = gaReduce(s, { type: 'tick', t: 6 });
    assert.equal(later.cmds.length, 0, 'nothing starts after ■ STOP');
    assert.equal(later.state.doorOpen, false);
  });
});

describe('audit 2 — the takes strip (recentTakes)', () => {
  it('each take a container chooses is recorded with the pitch and level it was really given; the last 8 are kept', () => {
    let s = on();
    const sent: { rate: number; gain: number }[] = [];
    for (let k = 0; k < 11; k++) {
      const r = gaReduce(s, { type: 'step', who: 'player', dx: 0, dy: 0 }, k);
      s = r.state;
      sent.push(starts(r.cmds)[0]);
    }
    const takes = s.recentTakes!;
    assert.equal(takes.length, 8);
    assert.deepEqual(takes.map((t) => t.n), [4, 5, 6, 7, 8, 9, 10, 11], 'newest last');
    for (const t of takes) {
      assert.deepEqual([t.owner, t.group, t.of], ['player', 'footstep/step/stone', 4]);
      assert.ok(t.take >= 1 && t.take <= 4, 'takes count from 1, as the log prints them');
      assert.ok(Math.abs(t.pitchCents) <= 45 && Math.abs(t.gainDb) <= 1.5);
    }
    // the numbers are the ones the voice was given
    const last = takes[7];
    assert.ok(Math.abs(Math.pow(2, last.pitchCents / 1200) - sent[10].rate) < 1e-4);
    assert.equal(`take ${last.take} of 4`, /take \d of 4/.exec(s.log.filter((l) => l.kind === 'start').pop()!.text)![0]);
    assert.ok(new Set(takes.map((t) => t.pitchCents)).size > 4, 'the variation really varies');
    for (let k = 1; k < takes.length; k++) assert.notEqual(takes[k].take, takes[k - 1].take, 'no immediate repeat');
  });
  it('variation off: the first take every time, with no pitch or level change; the door’s layers are recorded too', () => {
    let s = run(on(), { type: 'option', patch: { variation: false } }).s;
    for (let k = 0; k < 3; k++) s = run(s, { type: 'step', who: 'guide', dx: 0, dy: 0 }).s;
    assert.deepEqual(s.recentTakes!.map((t) => [t.owner, t.group, t.take, t.pitchCents, t.gainDb]), Array(3).fill(['guide', 'footstep/step/wood', 1, 0, 0]));
    s = run(s, { type: 'door' }, { type: 'post', event: 'crate_impact', owner: 'crate' }).s;
    assert.deepEqual(s.recentTakes!.slice(3).map((t) => [t.owner, t.group, t.take, t.of]), [
      ['door', 'door_open/door', 1, 1],
      ['door', 'door_open/rattle', 1, 1],
      ['crate', 'crate_impact/impact', 1, 1],
      ['crate', 'crate_impact/debris', 1, 1],
    ]);
    assert.deepEqual(run(s, { type: 'enterPage' }).s.recentTakes, [], 'a page opens with an empty strip');
  });
});

describe('audit 2 — the reverb this device may not have (F1, model half)', () => {
  it('the engine says "no reverb": the model knows, says so once, sends no reverb, and remembers across pages', () => {
    let s = on();
    assert.equal(gaReverbAvailable(s), true);
    s = run(s, { type: 'move', who: 'guide', x: 11, y: 5 }).s;
    const wet = run(s, { type: 'step', who: 'guide', dx: 0, dy: 0 });
    assert.ok(starts(wet.cmds)[0].rev! > 0, 'a step in the workshop feeds the room reverb');
    let r = run(s, { type: 'engine', evt: { e: 'reverb', ok: false, why: 'rate' } }, { type: 'engine', evt: { e: 'reverb', ok: false } });
    assert.equal(gaReverbAvailable(r.s), false);
    assert.equal(r.s.log.filter((l) => l.text.startsWith('REVERB is not available on this device')).length, 1, 'said once');
    assert.equal(starts(run(r.s, { type: 'step', who: 'guide', dx: 0, dy: 0 }).cmds)[0].rev, 0);
    // choosing REVERB again explains why nothing is heard
    r = run(r.s, { type: 'option', patch: { reverb: false } }, { type: 'option', patch: { reverb: true } });
    assert.ok(r.s.log[r.s.log.length - 1].text.startsWith('REVERB cannot be heard on this device'));
    assert.equal(gaReverbAvailable(run(r.s, { type: 'enterPage' }).s), false);
    assert.equal(gaReverbAvailable(run(r.s, { type: 'reset' }).s), false);
    assert.equal(gaReverbAvailable(run(r.s, { type: 'engine', evt: { e: 'reverb', ok: true } }).s), true);
  });
});

describe('audit 2 — courtyard birds: spot sounds on the bed (F14, model half)', () => {
  const HAVE = GA_BIRD_ASSETS.every((id) => gaAsset(id));
  it('while the courtyard bed plays a call is due every 4 to 9 scene-seconds; none when the scene stops', () => {
    let s = gaReduce(on(), { type: 'scene', on: true }, 20).state;
    assert.ok(s.birdAt! >= 20 + GA_BIRD_MIN_S && s.birdAt! <= 20 + GA_BIRD_MAX_S, String(s.birdAt));
    assert.equal(gaNextDue(s), s.birdAt);
    const first = s.birdAt!;
    const r = gaReduce(s, { type: 'tick', t: first });
    s = r.state;
    assert.ok(s.birdAt! >= first + GA_BIRD_MIN_S && s.birdAt! <= first + GA_BIRD_MAX_S, 'the next one is scheduled');
    const bird = starts(r.cmds);
    if (HAVE) {
      assert.equal(bird.length, 1);
      assert.ok(GA_BIRD_ASSETS.includes(bird[0].buf as (typeof GA_BIRD_ASSETS)[number]));
      assert.equal(bird[0].bus, 'ambience');
      const inst = s.inst.find((i) => i.event === 'bird')!;
      assert.ok(inst.pos!.x < WALL_X && inst.pos!.x >= 1 && inst.pos!.y >= 1 && inst.pos!.y <= 9, 'somewhere in the courtyard');
      assert.ok(!s.log.some((l) => l.text.startsWith('EVENT Play_Courtyard_Bird')), 'the bed scatters it: the game posted nothing');
      assert.equal(s.log.filter((l) => l.owner === 'bird').length, 1);
      // a second call with nothing in between updates that one line
      const again = gaReduce(s, { type: 'tick', t: s.birdAt! }).state;
      const lines = again.log.filter((l) => l.owner === 'bird');
      assert.equal(lines.length, 1);
      assert.equal(lines[0].count, 2);
      // its natural end is not logged
      const ended = gaReduce(again, { type: 'engine', evt: { e: 'ended', v: again.voices.find((v) => v.asset.startsWith('bird_'))!.v, why: 'natural' } }).state;
      assert.ok(!ended.log.some((l) => /^Bird .* ended/.test(l.text)));
    } else {
      assert.equal(bird.length, 0, 'the bank does not hold the calls yet: nothing is posted, nothing is logged');
      assert.ok(!s.log.some((l) => /bird/i.test(l.text)));
    }
    s = gaReduce(s, { type: 'scene', on: false }).state;
    assert.equal(s.birdAt, null);
    assert.equal(gaNextDue(s), null);
  });
  it('never when the budget is full, and the birds never disturb the footstep takes', () => {
    let s = gaReduce(on(), { type: 'voiceLimit', limit: 3 }, 0).state;
    s = gaReduce(s, { type: 'scene', on: true }, 0).state;
    const r = gaReduce(s, { type: 'tick', t: s.birdAt! });
    assert.equal(starts(r.cmds).length, 0);
    assert.equal(gaVoiceCount(r.state), 3);
    assert.ok(!r.state.log.some((l) => l.kind === 'stop' || l.kind === 'refused'), 'it takes no voice and is not a refusal to read');
    const walk = (birds: boolean) => {
      let w = gaReduce(on(), { type: 'scene', on: true }, 0).state;
      const takes: string[] = [];
      for (let k = 1; k <= 12; k++) {
        if (birds) w = gaReduce(w, { type: 'tick', t: k * 10 }).state;
        const step = gaReduce(w, { type: 'step', who: 'player', dx: 0, dy: 0 });
        w = step.state;
        takes.push(starts(step.cmds).find((c) => c.buf.startsWith('fs_'))!.buf);
      }
      return takes;
    };
    assert.deepEqual(walk(true), walk(false));
  });
});

describe('audit 2 — computed levels for the instrument strips', () => {
  const near = (a: number, b: number, eps = 0.01) => assert.ok(Math.abs(a - b) < eps, `${a} vs ${b}`);
  it('gaBusMeter: silent buses rest at the floor; a bus shows distance, wall, fader, duck and the lab LEVEL', () => {
    let s = on();
    let m = gaBusMeter(s);
    assert.deepEqual(m.map((b) => b.bus), ['ambience', 'sfx', 'dialogue', 'music', 'ui', 'chat']);
    assert.deepEqual(m.map((b) => b.name), ['AMBIENCE', 'EFFECTS', 'DIALOGUE', 'MUSIC', 'INTERFACE', 'CHAT']);
    assert.ok(m.every((b) => b.db === GA_METER_FLOOR_DB && b.voices === 0 && b.silenced === null && b.duckDb === 0 && b.faderDb === 0));
    // an interface cue: its own -4 dB and the lab LEVEL (70% = -3.1 dB)
    s = heard(run(s, { type: 'post', event: 'ui_confirm' }).s);
    const ui = () => gaBusMeter(s, s.t + 1).find((b) => b.bus === 'ui')!;
    near(ui().db, -4 + db(0.7));
    s = run(s, { type: 'master', value: 1 }, { type: 'bus', bus: 'ui', db: -6 }).s;
    near(ui().db, -10);
    assert.equal(ui().faderDb, -6);
    // the generator behind the closed door, from where the page opens: distance, wall, speed shape
    s = heard(run(on(), { type: 'master', value: 1 }, { type: 'machine', id: 'generator-1', on: true }).s);
    const d = Math.hypot(PLACES.generator.x - START.player.x, PLACES.generator.y - START.player.y);
    const hum = (4 / d) * OBSTRUCTED.gain * (0.7 + 0.3 * 0.4);
    const fan = (4 / d) * OBSTRUCTED.gain * Math.pow(10, -4 / 20) * (0.15 + 0.85 * 0.4);
    const sfx = () => gaBusMeter(s, s.t + 1).find((b) => b.bus === 'sfx')!;
    near(sfx().gain, Math.hypot(hum, fan), 1e-6);
    assert.equal(sfx().voices, 2);
    const closed = sfx().db;
    s = heard(run(s, { type: 'door' }).s);
    assert.ok(sfx().db > closed + 8, 'opening the door brings it up');
    // a line speaks: the duck shows on the buses it turns down, and only those
    s = heard(run(s, { type: 'post', event: 'vo_greeting', owner: 'guide' }).s);
    m = gaBusMeter(s, s.t + 1);
    assert.deepEqual(m.map((b) => b.duckDb), [-8, -5, 0, -10, 0, 0]);
    near(m.find((b) => b.bus === 'dialogue')!.db, 0);
    // mute and solo are told apart
    s = run(s, { type: 'bus', bus: 'sfx', mute: true }, { type: 'bus', bus: 'dialogue', solo: true }).s;
    m = gaBusMeter(s, s.t + 1);
    assert.deepEqual(m.map((b) => b.silenced), ['solo', 'mute', null, 'solo', 'solo', 'solo']);
    assert.equal(m.find((b) => b.bus === 'sfx')!.db, GA_METER_FLOOR_DB);
  });
  it('gaBusMeter: the music bus is the layers that are SOUNDING, and a delayed layer counts only once it has begun', () => {
    let s = run(on(), { type: 'master', value: 1 }, { type: 'musicStart' }).s;
    const mu = (st: GaState, t: number = st.t + 1) => gaBusMeter(st, t).find((b) => b.bus === 'music')!;
    near(mu(s).db, 0);
    assert.equal(mu(s).voices, 1);
    s = run(s, { type: 'mood', mood: 'alert' }).s;
    assert.equal(mu(s).voices, 1, 'the change is still waiting');
    s = run(s, { type: 'engine', evt: { e: 'music', what: 'applied', req: s.music.pending!.req, at: 0 } }).s;
    assert.equal(mu(s).voices, 3);
    near(mu(s).db, db(Math.sqrt(3)));
    // the door's rattle starts a second after the door
    const door = heard(gaReduce(run(on(), { type: 'master', value: 1 }).s, { type: 'door' }, 50).state);
    const fx = (t: number) => gaBusMeter(door, t).find((b) => b.bus === 'sfx')!;
    assert.equal(fx(50.5).voices, 1);
    assert.equal(fx(51.01).voices, 2);
    assert.ok(fx(51.01).db > fx(50.5).db);
    assert.equal(gaVoiceOut(door, door.voices[1], 50.5).gain, 0);
  });
  it('gaBusMeter: the two beds crossfade over their real 1.5 s, drawn from the clock', () => {
    let s = heard(gaReduce(run(on(), { type: 'master', value: 1 }, { type: 'scene', on: true }, { type: 'door' }).s, { type: 'move', who: 'player', x: 8.6, y: 5 }, 100).state);
    const yard = s.voices.find((v) => v.asset === 'amb_yard')!;
    const room = s.voices.find((v) => v.asset === 'amb_room')!;
    near(gaVoiceOut(s, yard, 100).db, -8);
    assert.equal(gaVoiceOut(s, room, 100).gain, 0, 'the other bed is at zero level');
    s = gaReduce(s, { type: 'move', who: 'player', x: 10.2, y: 5 }, 100).state;
    assert.deepEqual(s.bedFade, { at: 100, to: 'room', ramp: 1.5, from: { room: 0, yard: 1 } });
    near(gaVoiceOut(s, yard, 100).db, -8);
    near(gaVoiceOut(s, yard, 100.75).gain, 0.5 * Math.pow(10, -8 / 20), 1e-6);
    near(gaVoiceOut(s, room, 100.75).gain, 0.5 * Math.pow(10, -12 / 20), 1e-6);
    assert.equal(gaVoiceOut(s, yard, 101.5).gain, 0);
    near(gaVoiceOut(s, room, 103).db, -12);
  });
  it('gaOutputLR: stereo follows the pan the engine is sent; front and behind read alike; mono is equal', () => {
    // only the generator, YOU in the workshop a few meters west of it, facing north
    let s = run(on(), { type: 'master', value: 1 }, { type: 'door' }, { type: 'move', who: 'player', x: 10, y: 5 }, { type: 'move', who: 'player', x: 10, y: 2.4 }, { type: 'face', who: 'player', facing: 0 }).s;
    for (const v of s.voices) s = run(s, { type: 'engine', evt: { e: 'ended', v: v.v, why: 'natural' } }).s;
    const gen = run(s, { type: 'machine', id: 'generator-1', on: true });
    s = heard(gen.s);
    const sent = starts(gen.cmds);
    assert.equal(sent.length, 2);
    let o = gaOutputLR(s, s.t + 1);
    assert.equal(o.mode, 'stereo');
    assert.ok(o.r > o.l * 3, 'the generator is to the east: mostly right');
    assert.ok(o.l > 0, 'but never a silent ear');
    const g = panGains(sent[0].pan!);
    near(o.l, Math.hypot(sent[0].gain, sent[1].gain) * g.l, 1e-6);
    near(o.r, Math.hypot(sent[0].gain, sent[1].gain) * g.r, 1e-6);
    // face it, then turn your back: the two sides are equal both times
    const ahead = gaOutputLR(run(s, { type: 'face', who: 'player', facing: 90 }).s, s.t + 1);
    const behind = gaOutputLR(run(s, { type: 'face', who: 'player', facing: 270 }).s, s.t + 1);
    near(ahead.l, ahead.r, 1e-9);
    near(behind.l, behind.r, 1e-9);
    near(ahead.l, behind.l, 1e-9);
    // mono: both sides equal, wherever it is
    o = gaOutputLR(run(s, { type: 'mono', on: true }).s, s.t + 1);
    assert.equal(o.mode, 'mono');
    near(o.l, o.r, 1e-12);
    assert.equal(gaOutputLR(run(s, { type: 'pan', mode: 'hrtf' }).s).mode, 'hrtf');
    // nothing playing rests at the floor
    assert.deepEqual([gaOutputLR(on()).lDb, gaOutputLR(on()).rDb], [GA_METER_FLOOR_DB, GA_METER_FLOOR_DB]);
    // a sound with no position is the same in both ears
    const cue = gaOutputLR(heard(run(on(), { type: 'post', event: 'ui_confirm' }).s));
    assert.ok(cue.l > 0);
    near(cue.l, cue.r, 1e-12);
  });
  it('gaGeneratorRate is continuous in SPEED (a ring can be paced by it)', () => {
    assert.equal(gaGeneratorRate(0), 0.75);
    assert.equal(gaGeneratorRate(1), 1.45);
    for (let k = 1; k <= 20; k++) assert.ok(gaGeneratorRate(k / 20) > gaGeneratorRate((k - 1) / 20));
  });
});

describe('audit 2 — the conductor (gaStore): a start that waits for its sound is never overtaken (F4)', () => {
  /** An engine that records what it is sent, and a loader that waits until released. */
  function rig(preloaded: readonly string[] = []) {
    const got: GaCmd[] = [];
    const held = new Set<string>(preloaded);
    /** Commands that reached the engine before the sound they play was loaded. */
    const early: string[] = [];
    let emit: (e: GaEvt) => void = () => {};
    let release: () => void = () => {};
    let gate = new Promise<void>((res) => (release = res));
    const engine = {
      has: (id: string) => held.has(id),
      send: (c: GaCmd) => {
        const need = c.t === 'start' || c.t === 'reverb' ? [c.buf] : c.t === 'music' && c.op === 'stinger' ? [c.buf] : c.t === 'music' && c.op === 'start' ? c.stems.map((x) => x.buf) : [];
        for (const id of need) if (!held.has(id)) early.push(`${c.t}${c.t === 'music' ? ' ' + c.op : ''} without ${id}`);
        got.push(c);
      },
      subscribe: (fn: (e: GaEvt) => void) => {
        emit = fn;
        return () => {};
      },
    } as unknown as GaEngine;
    const ensure = async (ids: readonly string[]) => {
      await gate;
      ids.forEach((i) => held.add(i));
      return [] as string[];
    };
    const off = gaBindEngine(engine, ensure);
    gaResetScene();
    return {
      got,
      early,
      emit: (e: GaEvt) => emit(e),
      /** Let every load that is waiting finish, and a new gate close behind it. */
      load: async () => {
        release();
        await new Promise((r) => setTimeout(r, 5));
        gate = new Promise<void>((res) => (release = res));
      },
      close: () => {
        off();
        gaCloseScene();
      },
    };
  }
  const loops = (cmds: GaCmd[]) => (cmds.filter((c) => c.t === 'start') as Extract<GaCmd, { t: 'start' }>[]).filter((c) => c.loop);
  const ops = (cmds: GaCmd[]) => cmds.filter((c) => c.t === 'music').map((c) => (c as { op: string }).op);

  it('ON then OFF before the sound has loaded: the engine is sent neither the start nor the stop', async () => {
    const r = rig();
    try {
      gaDispatch({ type: 'sound', on: true });
      await r.load();
      r.got.length = 0;
      gaDispatch({ type: 'machine', id: 'generator-1', on: true }); // gen_hum and gen_air are not loaded yet
      gaDispatch({ type: 'machine', id: 'generator-1', on: false }); // tapped again before the load ends
      assert.equal(r.got.filter((c) => c.t === 'start' || c.t === 'stop').length, 0, 'nothing went ahead of the waiting start');
      await r.load();
      assert.equal(loops(r.got).length, 0, 'no loop plays that the scene does not show');
      assert.equal(r.got.filter((c) => c.t === 'stop').length, 0);
      assert.equal(gaGet().voices.length, 0);
      // and a plain start still goes out once its sound is there
      gaDispatch({ type: 'machine', id: 'generator-1', on: true });
      await r.load();
      assert.deepEqual(loops(r.got).map((c) => c.buf), ['gen_hum', 'gen_air']);
    } finally {
      r.close();
    }
  });
  it('the door opened while the generator loads: it starts with the OPEN-door level and filter', async () => {
    const r = rig();
    try {
      gaDispatch({ type: 'sound', on: true });
      await r.load();
      r.got.length = 0;
      gaDispatch({ type: 'machine', id: 'generator-1', on: true });
      const hum = gaGet().voices.find((v) => v.asset === 'gen_hum')!.v;
      gaDispatch({ type: 'door' });
      assert.ok(!r.got.some((c) => c.t === 'set' && c.v === hum), 'the change is kept with the waiting start, not sent ahead of it');
      await r.load();
      const sent = loops(r.got).find((c) => c.v === hum)!;
      assert.equal(sent.lowpass, 20000, 'not the 900 Hz it was asked with');
      const d = Math.hypot(PLACES.generator.x - START.player.x, PLACES.generator.y - START.player.y);
      assert.ok(Math.abs(sent.gain - (4 / d) * 0.82) < 1e-9, 'and at the open-door level');
      // once it is started, a change goes straight through
      r.got.length = 0;
      gaDispatch({ type: 'door' });
      assert.ok(r.got.some((c) => c.t === 'set' && c.v === hum && c.lowpass === 900));
    } finally {
      r.close();
    }
  });
  it('music: what follows a waiting start is sent after it, in order; STOP cancels it; ■ STOP drops what waits', async () => {
    let r = rig();
    try {
      gaDispatch({ type: 'sound', on: true });
      await r.load();
      r.got.length = 0;
      gaDispatch({ type: 'musicStart' });
      gaDispatch({ type: 'musicLayer', layer: 'pulse', on: true });
      assert.deepEqual(ops(r.got), [], 'the layer change waits behind the start');
      await r.load();
      assert.deepEqual(ops(r.got), ['start', 'layers']);
    } finally {
      r.close();
    }
    r = rig();
    try {
      gaDispatch({ type: 'sound', on: true });
      await r.load();
      r.got.length = 0;
      gaDispatch({ type: 'musicStart' });
      gaDispatch({ type: 'musicStop' }); // before the stems have loaded
      await r.load();
      assert.deepEqual(ops(r.got), ['stop'], 'no music starts that the lab reads as off');
      gaDispatch({ type: 'machine', id: 'generator-1', on: true });
      gaDispatch({ type: 'stopAll' });
      await r.load();
      assert.equal(loops(r.got).length, 0);
    } finally {
      r.close();
    }
  });
  it('the engine saying "no reverb" reaches the model, and a network action lands by itself', async () => {
    const r = rig();
    try {
      gaDispatch({ type: 'sound', on: true });
      r.emit({ e: 'reverb', ok: false, why: 'The buffer sample rate does not match' });
      assert.equal(gaReverbAvailable(gaGet()), false);
      // the engine's clock reaches the model too (the music's bar lines are put on it)
      r.emit({ e: 'clock', now: 50, state: 'running', latencyS: null });
      assert.ok(Math.abs(gaGet().audioOffset! - (gaGet().t - 50)) < 1e-9);
      gaDispatch({ type: 'net', id: 'W1', what: 'door', to: 'world' });
      assert.equal(gaGet().doorOpen, false, 'sent, not yet arrived');
      assert.equal(gaGet().netFlights![0].result, 'pending');
      await new Promise((res) => setTimeout(res, GA_NET_DELAY_S * 1000 + 120));
      assert.equal(gaGet().netFlights![0].result, 'played');
      assert.equal(gaGet().doorOpen, true);
    } finally {
      r.close();
    }
  });
});

/* ── check M (2026-11-13): the independent checker's findings, each pinned ── */

describe('check M — N1: an event never takes a voice from itself; the engine never passes the budget', () => {
  for (const what of ['door', 'crate', 'generator'] as const) {
    it(`BUDGET 1, ${what}: only voices still held are started, and the second layer waits or is refused`, () => {
      const s0 = run(on(), { type: 'voiceLimit', limit: 1 }).s;
      const r = what === 'door' ? run(s0, { type: 'door' }) : what === 'crate' ? run(s0, { type: 'post', event: 'crate_impact', owner: 'crate' }) : run(s0, { type: 'machine', id: 'generator-1', on: true });
      assert.equal(stops(r.cmds).length, 0, 'nothing was taken: there was nothing else to take');
      const held = new Set(r.s.voices.filter((v) => v.state !== 'virtual').map((v) => v.v));
      assert.equal(held.size, 1);
      assert.deepEqual(starts(r.cmds).map((c) => c.v), [...held], 'the engine is asked for exactly the voice the model holds');
      assert.equal(gaFact(r.s, 'stolen'), 0);
      assert.ok(!texts(r.s).some((t) => t.includes('STOLEN')));
      if (what === 'generator') assert.deepEqual(gaVoiceSlots(r.s).out.map((x) => [x.name, x.state]), [['Generator · fan', 'waiting']]);
      else assert.ok(texts(r.s).includes(`${what === 'door' ? 'Door · rattle' : 'Crate impact · debris'} REFUSED: the one voice is in use by this event's own other layers`), texts(r.s).join(' | '));
    });
  }
  it('a layer may still take ANOTHER event’s voice, by the rule', () => {
    const s = run(on(), { type: 'voiceLimit', limit: 2 }, { type: 'step', who: 'player', dx: 0, dy: 0 }, { type: 'step', who: 'player', dx: 0, dy: 0 }).s;
    const steps = s.voices.map((v) => v.v);
    const r = run(s, { type: 'door' });
    assert.deepEqual(stops(r.cmds).map((c) => c.v), steps, 'the door takes one footstep, its rattle the other (never the door’s own voice)');
    assert.deepEqual(r.s.voices.map((v) => v.asset), ['door', 'door_rattle']);
    assert.deepEqual(starts(r.cmds).map((c) => c.buf), ['door', 'door_rattle']);
  });
});

describe('check M — the voice rule, each clause pinned', () => {
  it('a protected voice is never taken, even by a more important new one', () => {
    const s = run(on(), { type: 'voiceLimit', limit: 1 }, { type: 'alarm', on: true }).s;
    const r = run(s, { type: 'post', event: 'vo_warning', owner: 'guide' });
    assert.ok(gaPlaying(r.s, 'alarm'));
    assert.ok(!gaPlaying(r.s, 'vo_warning'), 'the new line is refused');
    assert.equal(stops(r.cmds).length, 0);
    assert.equal(gaFact(r.s, 'refused'), 1);
  });
  it('a MORE important voice is never taken by a less important one', () => {
    const s = run(on(), { type: 'voiceLimit', limit: 1 }, { type: 'post', event: 'ui_confirm' }).s;
    const r = run(s, { type: 'step', who: 'player', dx: 0, dy: 0 });
    assert.ok(gaPlaying(r.s, 'ui_confirm') && !gaPlaying(r.s, 'footstep'));
    assert.equal(stops(r.cmds).length, 0);
  });
  it('lowering the budget never takes a protected voice, even one less important than an unprotected one', () => {
    // a rule test: for a moment, the chat line is made the most important sound of all
    const chat = GA_EVENTS.chat as { priority: number };
    const keep = chat.priority;
    chat.priority = 99;
    try {
      let s = run(on(), { type: 'alarm', on: true }, { type: 'post', event: 'vo_warning', owner: 'guide' }, { type: 'post', event: 'chat' }).s;
      s = run(s, { type: 'voiceLimit', limit: 2 }).s;
      assert.ok(gaPlaying(s, 'alarm') && gaPlaying(s, 'vo_warning'), 'both protected voices stay');
      assert.ok(!gaPlaying(s, 'chat'), 'the unprotected one goes, though it is the most important');
    } finally {
      chat.priority = keep;
    }
  });
  it('a loop coming back into range respects the budget: it WAITS, and comes back when a voice is free', () => {
    let s = run(on(), { type: 'door' }, { type: 'machine', id: 'generator-1', on: true }, { type: 'move', who: 'player', x: 1, y: 9 }).s;
    for (const v of s.voices.filter((x) => x.asset.startsWith('door'))) s = run(s, { type: 'engine', evt: { e: 'ended', v: v.v, why: 'natural' } }).s;
    assert.equal(gaVirtualCount(s), 2);
    s = run(s, { type: 'voiceLimit', limit: 2 }, { type: 'alarm', on: true }, { type: 'post', event: 'vo_warning', owner: 'guide' }).s;
    const r = run(s, { type: 'move', who: 'player', x: 8, y: 5 }, { type: 'move', who: 'player', x: 12, y: 3 });
    assert.ok(gaVoiceCount(r.s) <= 2, `count ${gaVoiceCount(r.s)}`);
    assert.equal(starts(r.cmds).filter((c) => c.buf.startsWith('gen_')).length, 0);
    assert.deepEqual(gaVoiceSlots(r.s).out.map((x) => x.state), ['waiting', 'waiting']);
    // the warning line ends: a voice is free, and the hum takes it at once
    const line = r.s.voices.find((v) => v.asset === 'vo_warning')!;
    const free = run(r.s, { type: 'engine', evt: { e: 'ended', v: line.v, why: 'natural' } });
    assert.equal(starts(free.cmds).filter((c) => c.buf === 'gen_hum').length, 1);
  });
  it('N10: a protected loop refused at its start WAITS; it is never shown as stolen', () => {
    const s = run(on(), { type: 'voiceLimit', limit: 1 }, { type: 'post', event: 'vo_warning', owner: 'guide' }, { type: 'alarm', on: true }).s;
    const alarm = s.voices.find((v) => v.asset === 'alarm')!;
    assert.equal(alarm.stolen, undefined);
    assert.equal(alarm.waiting, true);
    assert.equal(gaStolenCount(s), 0);
    assert.deepEqual(gaVoiceSlots(s).out.map((x) => [x.name, x.state]), [['Overheat alarm', 'waiting']]);
    const back = run(s, { type: 'engine', evt: { e: 'ended', v: s.voices.find((v) => v.asset === 'vo_warning')!.v, why: 'natural' } }).s;
    assert.equal(gaVoiceCount(back), 1);
    assert.ok(back.voices[0].asset === 'alarm' && !back.voices[0].waiting);
  });
  it('the stinger is not in the budget display', () => {
    let s = run(on(), { type: 'musicStart' }, { type: 'stinger' }).s;
    s = run(s, { type: 'engine', evt: { e: 'music', what: 'applied', req: s.music.stinger!.req, at: 0 } }).s;
    assert.ok(gaPlaying(s, 'stinger'));
    const b = gaVoiceSlots(s);
    assert.equal(b.used, 0);
    assert.ok(b.slots.every((x) => x === null) && b.out.length === 0);
  });
});

describe('check M — purity: the reducer never writes into the state it is given', () => {
  it('a long session on deep-frozen inputs runs, and every input is unchanged', () => {
    let s = deepFreeze(gaInitial());
    const acts: GaAction[] = [
      { type: 'sound', on: true }, { type: 'scene', on: true }, { type: 'machine', id: 'generator-1', on: true }, { type: 'speed', id: 'generator-1', value: 0.9 },
      { type: 'speed', id: 'generator-1', value: 0.8 }, { type: 'door' }, { type: 'step', who: 'player' }, { type: 'move', who: 'player', x: 8.5, y: 5 }, { type: 'move', who: 'player', x: 10, y: 5 },
      { type: 'move', who: 'player', x: 8.5, y: 5 }, { type: 'post', event: 'vo_greeting', owner: 'guide' }, { type: 'post', event: 'vo_warning', owner: 'guide' }, { type: 'alarm', on: true },
      { type: 'musicStart' }, { type: 'mood', mood: 'alert' }, { type: 'stinger' }, { type: 'bus', bus: 'sfx', db: -6 }, { type: 'bus', bus: 'sfx', db: -7 }, { type: 'bus', bus: 'ui', mute: true },
      { type: 'master', value: 0.5 }, { type: 'mono', on: true }, { type: 'pan', mode: 'hrtf' }, { type: 'mono', on: false }, { type: 'listener', mode: 'camera' }, { type: 'listener', mode: 'player' },
      { type: 'addMachine' }, { type: 'machine', id: 'generator-2', on: true }, { type: 'fault', patch: { orphanLoop: true } }, { type: 'removeMachine', id: 'generator-2' }, { type: 'addMachine' },
      { type: 'voiceLimit', limit: 3 }, { type: 'burst', count: 12 }, { type: 'voiceLimit', limit: 0 }, { type: 'net', id: 'A1', what: 'door', to: 'world' }, { type: 'tick', t: 99 },
      { type: 'option', patch: { rawYardLoop: true, duck: false } }, { type: 'fault', patch: { bedPileUp: true } }, { type: 'move', who: 'player', x: 8.4, y: 5 }, { type: 'sound', on: false },
      { type: 'sound', on: true }, { type: 'enterPage' }, { type: 'scene', on: true }, { type: 'tick', t: 120 }, { type: 'stopAll' }, { type: 'reset' }, { type: 'clearLog' },
    ];
    let k = 0;
    for (const a of acts) {
      const snapshot = JSON.stringify(s);
      const r = gaReduce(s, a, ++k);
      assert.equal(JSON.stringify(s), snapshot, `${a.type} left its input as it was`);
      // the engine answers each start, also on frozen state
      s = deepFreeze(r.state);
      for (const c of r.cmds) if (c.t === 'start') s = deepFreeze(gaReduce(s, { type: 'engine', evt: { e: 'started', v: c.v, at: k, now: k } }).state);
      for (const v of s.voices) if (v.music) s = deepFreeze(gaReduce(s, { type: 'engine', evt: { e: 'music', what: 'stinger', req: v.v, state: 'ended' } }).state);
      if (s.music.pending) s = deepFreeze(gaReduce(s, { type: 'engine', evt: { e: 'music', what: 'applied', req: s.music.pending.req, at: 0 } }).state);
      if (s.music.stinger) s = deepFreeze(gaReduce(s, { type: 'engine', evt: { e: 'music', what: 'applied', req: s.music.stinger.req, at: 0 } }).state);
    }
    assert.ok(k === acts.length);
  });
});

describe('check M — the network and the beds, two more facts pinned', () => {
  it('a SENT action is a fact at the press (netSent); its effect is a fact when it lands', () => {
    const r = gaReduce(on(), { type: 'net', id: 'Q1', what: 'alert', to: 'me' }, 1);
    assert.equal(gaFact(r.state, 'netSent'), 1);
    assert.equal(gaFact(r.state, 'netPrivateMe'), 0);
  });
  it('the birds stop when the courtyard bed is gone, however it went', () => {
    let s = gaReduce(on(), { type: 'scene', on: true }, 0).state;
    const yard = s.voices.find((v) => v.asset === 'amb_yard')!;
    // the engine refuses the bed: its instance ends, the scene is still "on"
    s = gaReduce(s, { type: 'engine', evt: { e: 'failed', v: yard.v, why: 'missing-buffer' } }, 0.5).state;
    assert.ok(!gaPlaying(s, 'bed_yard'));
    const r = gaReduce(s, { type: 'tick', t: 30 });
    assert.equal(starts(r.cmds).length, 0, 'no bird after its bed is gone');
    assert.equal(r.state.birdAt, null);
  });
  it('sound coming on starts no VIRTUAL loop', () => {
    const off = run(gaInitial(), { type: 'door' }, { type: 'machine', id: 'generator-1', on: true }, { type: 'move', who: 'player', x: 1, y: 9 }).s;
    assert.equal(gaVirtualCount(off), 2);
    const r = run(off, { type: 'sound', on: true });
    assert.equal(starts(r.cmds).filter((c) => c.buf.startsWith('gen_')).length, 0);
  });
});

describe('check M — N5: the music clock is the engine’s', () => {
  it('the engine’s `music started` puts the bar lines on its own start, from its clock when the model has it', () => {
    // no clock known yet: the engine's own rule, the start 0.12 s after it was asked
    let s = gaReduce(on(), { type: 'musicStart' }, 5).state;
    assert.equal(s.music.t0, 5);
    // the stems took 0.4 s to load: the answer arrives then
    s = gaReduce(s, { type: 'engine', evt: { e: 'music', what: 'started', at: 0, bar: 2.5, beat: 0.625, phrase: 10 } }, 5.4).state;
    assert.ok(Math.abs(s.music.t0 - (5.4 + GA_MUSIC_START_AHEAD_S)) < 1e-9);
    // the clock known from a voice's `started` (scene 2.0 = audio 100.0): t0 is the engine's `at`, in scene time
    let k = gaReduce(on(), { type: 'post', event: 'ui_confirm' }, 2).state;
    k = gaReduce(k, { type: 'engine', evt: { e: 'started', v: k.voices[0].v, at: 100, now: 100 } }, 2).state;
    k = gaReduce(k, { type: 'musicStart' }, 5).state;
    k = gaReduce(k, { type: 'engine', evt: { e: 'music', what: 'started', at: 103.7, bar: 2.5, beat: 0.625, phrase: 10 } }, 5.5).state;
    assert.ok(Math.abs(k.music.t0 - 5.7) < 1e-9, String(k.music.t0));
    // an answer for music that is not playing changes nothing
    const off = gaReduce(on(), { type: 'engine', evt: { e: 'music', what: 'started', at: 1, bar: 2.5, beat: 0.625, phrase: 10 } }, 3).state;
    assert.equal(off.music.t0, 0);
    // the 0.12 s is the engine's own number
    assert.ok(GA_ENGINE_JS.includes(`t0: now() + ${GA_MUSIC_START_AHEAD_S}`));
  });
  it('a reported boundary moves the bar lines by a trip’s worth, never by half a beat or more', () => {
    const base = (b: 'beat' | 'bar') => {
      let s = gaReduce(on(), { type: 'musicStart' }, 10).state;
      s = gaReduce(s, { type: 'option', patch: { musicBoundary: b } }, 10).state;
      return gaReduce(s, { type: 'musicLayer', layer: 'pulse', on: true }, 13).state; // 3.0 s in: next beat line 13.125, next bar line 15
    };
    let s = base('beat');
    s = gaReduce(s, { type: 'engine', evt: { e: 'music', what: 'queued', req: s.music.pending!.req, at: 0, inS: 0.175, boundary: 'beat' } }, 13).state;
    assert.ok(Math.abs(s.music.t0 - 10.05) < 1e-9, 'a 0.05 s difference is taken up');
    s = base('bar');
    s = gaReduce(s, { type: 'engine', evt: { e: 'music', what: 'queued', req: s.music.pending!.req, at: 0, inS: 2.4, boundary: 'bar' } }, 13).state;
    assert.equal(s.music.t0, 10, 'a 0.4 s difference is more than half a beat: it could be another beat line, so it is not "corrected"');
    assert.ok(Math.abs(s.music.pending!.due! - 15.4) < 1e-9, 'the countdown still follows the engine');
  });
  it('at the very instant a change lands, the clock reads the line it lands on', () => {
    let seed = 12345;
    const rnd = () => (seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff;
    const BEAT = 60 / 96;
    for (let k = 0; k < 20000; k++) {
      const s = { ...gaInitial(), music: { ...gaInitial().music, on: true, t0: rnd() * 50 } };
      s.t = s.music.t0 + rnd() * 400;
      const boundary = (['beat', 'bar', 'phrase'] as const)[k % 3];
      const due = s.t + gaMusicWait(s, boundary);
      const idx = Math.round((due - s.music.t0) / BEAT);
      const c = gaMusicClock(s, due);
      assert.deepEqual([c.bar, c.beat], [Math.floor((((idx % 16) + 16) % 16) / 4), idx % 4], `t0 ${s.music.t0} t ${s.t} ${boundary}`);
    }
  });
});

describe('check M — N6: the meters follow what the engine was told, at every moment', () => {
  const near = (a: number, b: number, eps = 1e-6) => assert.ok(Math.abs(a - b) < eps, `${a} vs ${b}`);
  it('the duck: the effects bus moves along its 0.12 s attack and its 0.45 s release', () => {
    let s = heard(gaReduce(on(), { type: 'machine', id: 'generator-1', on: true }, 1).state);
    s = heard(gaReduce(s, { type: 'post', event: 'vo_greeting', owner: 'guide' }, 4).state);
    const duck = Math.pow(10, GA_DUCK_DB.sfx! / 20);
    near(gaBusGainAt(s, 'sfx', 4), 1);
    near(gaBusGainAt(s, 'sfx', 4.06), 1 + (duck - 1) * 0.5, 1e-9);
    near(gaBusGainAt(s, 'sfx', 4.12), duck);
    near(gaDuckDbAt(s, 'sfx', 4.06), db(1 + (duck - 1) * 0.5));
    near(gaDuckDbAt(s, 'sfx', 5), GA_DUCK_DB.sfx!);
    const fx = (st: GaState, t: number) => gaBusMeter(st, t).find((b) => b.bus === 'sfx')!.gain;
    near(fx(s, 4.06) / fx(s, 5), (1 + (duck - 1) * 0.5) / duck);
    // the line ends at 6: the release takes 0.45 s
    s = gaReduce(s, { type: 'engine', evt: { e: 'ended', v: s.voices.find((v) => v.bus === 'dialogue')!.v, why: 'natural' } }, 6).state;
    near(gaBusGainAt(s, 'sfx', 6), duck);
    near(gaBusGainAt(s, 'sfx', 6.225), duck + (1 - duck) * 0.5, 1e-9);
    near(gaBusGainAt(s, 'sfx', 6.45), 1);
    // a duck that ends during its attack releases from where it got to
    let q = heard(gaReduce(on(), { type: 'post', event: 'vo_greeting', owner: 'guide' }, 1).state);
    q = gaReduce(q, { type: 'engine', evt: { e: 'ended', v: q.voices[0].v, why: 'natural' } }, 1.06).state;
    near(gaBusGainAt(q, 'music', 1.06), 1 + (Math.pow(10, GA_DUCK_DB.music! / 20) - 1) * 0.5, 1e-9);
    // unheard, the meters move the same way (the scene simulates)
    const off = gaReduce(gaInitial(), { type: 'post', event: 'vo_greeting', owner: 'guide' }, 1).state;
    near(gaBusGainAt(off, 'sfx', 1.06), 1 + (duck - 1) * 0.5, 1e-9);
  });
  it('a page opening (and a reset) ramps the buses to flat FROM WHERE THEY ARE', () => {
    const duck = Math.pow(10, GA_DUCK_DB.sfx! / 20);
    const s = heard(gaReduce(on(), { type: 'post', event: 'vo_greeting', owner: 'guide' }, 1).state);
    for (const a of [{ type: 'enterPage' }, { type: 'reset' }] as GaAction[]) {
      const p = gaReduce(s, a, 3).state;
      near(gaBusGainAt(p, 'sfx', 3), duck);
      near(gaBusGainAt(p, 'sfx', 3 + (a.type === 'enterPage' ? 0.05 : 0.025)), duck + (1 - duck) * 0.5, 1e-9);
      near(gaBusGainAt(p, 'sfx', 4), 1);
    }
  });
  it('sound coming on SETS the level and the buses (the engine’s old values are unknown): the meters agree at once', () => {
    const duck = Math.pow(10, GA_DUCK_DB.sfx! / 20);
    let s = gaReduce(gaInitial(), { type: 'master', value: 0.3 }, 1).state;
    s = gaReduce(s, { type: 'post', event: 'vo_greeting', owner: 'guide' }, 1).state; // the duck's attack is under way, unheard
    const r = gaReduce(s, { type: 'sound', on: true }, 1.03);
    near(gaBusGainAt(r.state, 'sfx', 1.03), duck);
    near(gaMasterAt(r.state, 1.03), 0.3);
    assert.ok(r.cmds.filter((c) => c.t === 'bus' || c.t === 'master').every((c) => (c as { ramp?: number }).ramp === 0));
  });
  it('the lab LEVEL moves along its 0.05 s ramp', () => {
    const s = gaReduce(on(), { type: 'master', value: 0.2 }, 3).state;
    near(gaMasterAt(s, 3), 0.7);
    near(gaMasterAt(s, 3.025), 0.45, 1e-9);
    near(gaMasterAt(s, 4), 0.2);
  });
  it('a crossing reversed half-way: each bed ramps back FROM WHERE IT IS', () => {
    let s = heard(gaReduce(run(on(), { type: 'master', value: 1 }, { type: 'scene', on: true }, { type: 'door' }).s, { type: 'move', who: 'player', x: 8.5, y: 5 }, 5).state);
    s = gaReduce(s, { type: 'move', who: 'player', x: 9.6, y: 5 }, 6).state; // into the workshop
    s = gaReduce(s, { type: 'move', who: 'player', x: 8.5, y: 5 }, 6.5).state; // back out, a third of the way through
    const yard = s.voices.find((v) => v.asset === 'amb_yard')!;
    const room = s.voices.find((v) => v.asset === 'amb_room')!;
    const share = (v: typeof yard, t: number) => gaVoiceOut(s, v, t).gain / v.base;
    near(share(yard, 6.5), 2 / 3);
    near(share(room, 6.5), 1 / 3);
    near(share(yard, 7.25), 2 / 3 + (1 / 3) * 0.5);
    near(share(room, 7.25), (1 / 3) * 0.5);
    near(share(yard, 8), 1);
    assert.equal(share(room, 8), 0);
    near(s.bedFade!.from!.room, 1 / 3);
    near(s.bedFade!.from!.yard, 2 / 3);
  });
  it('HEADPHONE 3D: the meter carries the engine’s own 3D trim', () => {
    assert.equal(GA_HRTF_TRIM, 0.75);
    const s = heard(run(on(), { type: 'machine', id: 'generator-1', on: true }).s);
    const d3 = run(s, { type: 'pan', mode: 'hrtf' }).s;
    for (const v of s.voices) near(gaVoiceOut(d3, v, d3.t + 1).gain, gaVoiceOut(s, v, s.t + 1).gain * GA_HRTF_TRIM, 1e-12);
    // a bed has no position: no trim
    const beds = heard(run(on(), { type: 'scene', on: true }).s);
    const yard = beds.voices.find((v) => v.asset === 'amb_yard')!;
    near(gaVoiceOut(run(beds, { type: 'pan', mode: 'hrtf' }).s, yard, 9).gain, gaVoiceOut(beds, yard, 9).gain, 1e-12);
  });
  it('N8: with sound on, a voice the engine has not confirmed is not on the meters', () => {
    const s = run(on(), { type: 'machine', id: 'generator-1', on: true }).s;
    const fx = (st: GaState) => gaBusMeter(st, st.t + 1).find((b) => b.bus === 'sfx')!;
    assert.deepEqual([fx(s).db, fx(s).voices], [GA_METER_FLOOR_DB, 0]);
    assert.equal(gaOutputLR(s, s.t + 1).l, 0);
    const h = heard(s);
    assert.ok(fx(h).db > GA_METER_FLOOR_DB && fx(h).voices === 2);
    // unheard, the scene simulates: no answer is waited for
    const off = run(gaInitial(), { type: 'machine', id: 'generator-1', on: true }).s;
    assert.equal(fx(off).voices, 2);
  });
});

describe('check M — found by the walk rerun on the fixed code', () => {
  it('a wake at exactly "landed + 4 s" drops the flight, so the clock is never woken at the same instant again', () => {
    // sent at 0.004 s it lands at 0.254, and (0.254 + 4) - 0.254 is 3.9999999999999996 in floating point
    let s = gaReduce(on(), { type: 'net', id: 'K1', what: 'alert', to: 'me' }, 0.004).state;
    s = gaReduce(s, { type: 'tick', t: gaNextDue(s)! }).state;
    const keep = gaNextDue(s)!;
    s = gaReduce(s, { type: 'tick', t: keep }).state;
    assert.deepEqual(s.netFlights, []);
    assert.equal(gaNextDue(s), null);
  });
  it('a line routed to the wrong bus that interrupts a speaking line ends the duck', () => {
    let s = run(on(), { type: 'post', event: 'vo_greeting', owner: 'guide' }).s;
    assert.equal(s.duckOwners, 1);
    s = run(s, { type: 'fault', patch: { voWrongBus: true } }, { type: 'post', event: 'vo_warning', owner: 'guide' }).s;
    assert.equal(s.duckOwners, 0, 'nobody speaks on the dialogue bus now');
    assert.ok(s.log.some((l) => l.text.startsWith('DUCK off')));
    assert.equal(gaBusGainAt(s, 'music', s.t + 1), 1);
  });
});

describe('check M — N7, N9, N11, N13', () => {
  it('N7: an orphan loop keeps its machine’s last speed, in the engine and on the meter; a new machine adopts it at that speed', () => {
    let s = heard(run(on(), { type: 'move', who: 'player', x: 12, y: 6 }, { type: 'addMachine' }, { type: 'machine', id: 'generator-2', on: true }, { type: 'speed', id: 'generator-2', value: 1 }).s);
    const meter = (st: GaState) => gaBusMeter(st, st.t + 1).find((b) => b.bus === 'sfx')!.gain;
    const before = meter(s);
    s = run(s, { type: 'fault', patch: { orphanLoop: true } }, { type: 'removeMachine', id: 'generator-2' }).s;
    near1(meter(s), before);
    const turn = run(s, { type: 'face', who: 'player', facing: 91 });
    const hum = s.voices.find((v) => v.asset === 'gen_hum')!;
    const set = sets(turn.cmds).find((c) => c.v === hum.v)!;
    const out = gaVoiceOut(turn.s, hum, turn.s.t + 1);
    near1(set.gain!, out.gain / turn.s.master);
    const back = run(turn.s, { type: 'addMachine' }).s;
    assert.deepEqual(back.machines.map((m) => [m.id, m.on, m.speed]), [['generator-1', false, 0.4], ['generator-2', true, 1]]);
    function near1(a: number, b: number) {
      assert.ok(Math.abs(a - b) < 1e-9, `${a} vs ${b}`);
    }
  });
  it('N9: one music layer the engine cannot start is a FAULT line; the music plays on', () => {
    const s = run(on(), { type: 'musicStart' }, { type: 'engine', evt: { e: 'failed', v: 'music:pulse', why: 'missing-buffer' } }).s;
    assert.ok(s.music.on);
    assert.ok(s.log.some((l) => l.kind === 'failed' && l.text === 'The engine could NOT start the music layer PULSE: the sound was not loaded'));
    assert.equal(gaFact(s, 'engineFailed'), 1);
  });
  it('N11: a late refusal for a voice that went virtual meanwhile does not end that layer', () => {
    let s = gaReduce(on(), { type: 'door' }, 0).state;
    s = gaReduce(s, { type: 'machine', id: 'generator-1', on: true }, 1).state;
    const hum = s.voices.find((v) => v.asset === 'gen_hum')!.v;
    s = gaReduce(s, { type: 'move', who: 'player', x: 1, y: 9 }, 1.01).state;
    s = gaReduce(s, { type: 'engine', evt: { e: 'failed', v: hum, why: 'suspended' } }, 1.02).state;
    assert.equal(s.voices.filter((v) => v.asset.startsWith('gen_')).length, 2, 'both layers are still tracked');
    const r = run(s, { type: 'move', who: 'player', x: 12, y: 3 });
    assert.deepEqual(starts(r.cmds).filter((c) => c.buf.startsWith('gen_')).map((c) => c.buf).sort(), ['gen_air', 'gen_hum']);
  });
  it('N13: the clock never runs backward; a start is counted heard once; two generators never share an id', () => {
    const s = gaReduce(gaInitial(), { type: 'tick', t: 10 }).state;
    assert.equal(gaReduce(s, { type: 'tick', t: 4 }).state.t, 10);
    let h = run(on(), { type: 'post', event: 'ui_confirm' }).s;
    const v = h.voices[0].v;
    for (let k = 0; k < 3; k++) h = run(h, { type: 'engine', evt: { e: 'started', v, at: 0, now: 0 } }, { type: 'engine', evt: { e: 'started', v: 'nobody', at: 0, now: 0 } }).s;
    assert.equal(gaFact(h, 'heardStart'), 1);
    const m = run(gaInitial(), { type: 'addMachine' }, { type: 'removeMachine', id: 'generator-1' }, { type: 'addMachine' }).s;
    assert.deepEqual(m.machines.map((x) => x.id).sort(), ['generator-1', 'generator-2']);
    assert.deepEqual(m.machines.find((x) => x.id === 'generator-1')!.x, PLACES.generator.x);
  });
});

describe('check M — the conductor: timers and loads (N2, N3, N4 and the store mutants)', () => {
  function rig(preloaded: readonly string[] | 'all' = []) {
    const got: GaCmd[] = [];
    const held = new Set<string>(preloaded === 'all' ? [] : preloaded);
    const early: string[] = [];
    let emit: (e: GaEvt) => void = () => {};
    let release: () => void = () => {};
    let gate = new Promise<void>((res) => (release = res));
    const engine = {
      has: (id: string) => preloaded === 'all' || held.has(id),
      send: (c: GaCmd) => {
        const need = c.t === 'start' || c.t === 'reverb' ? [c.buf] : c.t === 'music' && c.op === 'stinger' ? [c.buf] : c.t === 'music' && c.op === 'start' ? c.stems.map((x) => x.buf) : [];
        if (preloaded !== 'all') for (const id of need) if (!held.has(id)) early.push(`${c.t}${c.t === 'music' ? ' ' + c.op : ''} without ${id}`);
        got.push(c);
      },
      subscribe: (fn: (e: GaEvt) => void) => {
        emit = fn;
        return () => {};
      },
    } as unknown as GaEngine;
    const ensure = async (ids: readonly string[]) => {
      await gate;
      ids.forEach((i) => held.add(i));
      return [] as string[];
    };
    const off = gaBindEngine(engine, ensure);
    gaResetScene();
    return {
      got,
      early,
      emit: (e: GaEvt) => emit(e),
      load: async () => {
        release();
        await new Promise((r) => setTimeout(r, 5));
        gate = new Promise<void>((res) => (release = res));
      },
      close: () => {
        off();
        gaCloseScene();
      },
    };
  }
  const ops = (cmds: GaCmd[]) => cmds.filter((c) => c.t === 'music').map((c) => (c as { op: string }).op);
  const STEMS = ['mu_calm', 'mu_pulse', 'mu_drive', 'ir_room'];

  it('N2: a stinger withdrawn while its file loads never plays, not even on the next music', async () => {
    const r = rig(STEMS);
    try {
      gaDispatch({ type: 'sound', on: true });
      gaDispatch({ type: 'musicStart' });
      gaDispatch({ type: 'stinger' }); // mu_stinger is loading
      gaDispatch({ type: 'musicStop' });
      gaDispatch({ type: 'musicStart' });
      await r.load();
      assert.deepEqual(ops(r.got), ['start', 'stop', 'start'], 'the withdrawn stinger is never sent');
      // a stinger asked of the new music does play
      gaDispatch({ type: 'stinger' });
      await r.load();
      assert.deepEqual(ops(r.got), ['start', 'stop', 'start', 'stinger']);
    } finally {
      r.close();
    }
    // ■ STOP withdraws one that is loading too
    const q = rig(STEMS);
    try {
      gaDispatch({ type: 'sound', on: true });
      gaDispatch({ type: 'musicStart' });
      gaDispatch({ type: 'stinger' });
      gaDispatch({ type: 'stopAll' });
      await q.load();
      assert.ok(!ops(q.got).includes('stinger'));
    } finally {
      q.close();
    }
  });
  it('N3: a stinger queued behind a loading music start is sent only once its own file has loaded', async () => {
    const r = rig();
    try {
      gaDispatch({ type: 'sound', on: true });
      gaDispatch({ type: 'musicStart' });
      gaDispatch({ type: 'stinger' });
      await r.load();
      assert.deepEqual(ops(r.got), ['start', 'stinger']);
      assert.deepEqual(r.early, [], 'nothing reached the engine before its sound');
    } finally {
      r.close();
    }
  });
  it('N4: a page change or ■ STOP while the room reverb loads does not lose the reverb', async () => {
    for (const a of [{ type: 'enterPage' }, { type: 'stopAll' }, { type: 'reset' }] as GaAction[]) {
      const r = rig();
      try {
        gaDispatch({ type: 'sound', on: true }); // ir_room is loading
        gaDispatch(a);
        await r.load();
        assert.equal(r.got.filter((c) => c.t === 'reverb').length, 1, `${a.type}: the reverb still reaches the engine`);
        assert.deepEqual(r.early, []);
      } finally {
        r.close();
      }
    }
  });
  it('a renderer change while a start waits: it starts on the NEW renderer', async () => {
    const r = rig(['ir_room']);
    try {
      gaDispatch({ type: 'sound', on: true });
      gaDispatch({ type: 'machine', id: 'generator-1', on: true });
      gaDispatch({ type: 'pan', mode: 'hrtf' });
      await r.load();
      const st = r.got.filter((c) => c.t === 'start') as Extract<GaCmd, { t: 'start' }>[];
      assert.deepEqual(st.map((c) => c.mode), ['hrtf', 'hrtf']);
      assert.equal(r.got.filter((c) => c.t === 'set').length, 0);
    } finally {
      r.close();
    }
  });
  it('sound going off drops what waits for a load; so do ■ STOP and a page change', async () => {
    for (const a of [{ type: 'sound', on: false }, { type: 'stopAll' }, { type: 'enterPage' }] as GaAction[]) {
      const r = rig(['ir_room']);
      try {
        gaDispatch({ type: 'sound', on: true });
        gaDispatch({ type: 'machine', id: 'generator-1', on: true });
        gaDispatch({ type: 'musicStart' });
        gaDispatch(a);
        await r.load();
        assert.equal(r.got.filter((c) => c.t === 'start').length, 0, `${a.type}: no loop starts`);
        assert.ok(!ops(r.got).includes('start'), `${a.type}: no music starts`);
      } finally {
        r.close();
      }
    }
  });
  it('a stinger that has begun ends by itself a second after its length, if the engine never says so', () => {
    const r = rig('all');
    mock.timers.enable({ apis: ['setTimeout'] });
    try {
      gaDispatch({ type: 'sound', on: true });
      gaDispatch({ type: 'musicStart' });
      gaDispatch({ type: 'stinger' });
      const req = gaGet().music.stinger!.req;
      r.emit({ e: 'music', what: 'applied', req, at: 0 });
      assert.ok(gaPlaying(gaGet(), 'stinger'));
      mock.timers.tick(2000);
      assert.ok(gaPlaying(gaGet(), 'stinger'), 'not before its time');
      mock.timers.tick(1200);
      assert.ok(!gaPlaying(gaGet(), 'stinger'), 'PLAYING never holds it for ever');
    } finally {
      mock.timers.reset();
      r.close();
    }
  });
  it('closing the lab, a page change and ■ STOP leave no unheard timer running', () => {
    for (const end of ['close', 'enterPage', 'stopAll', 'reset'] as const) {
      gaCloseScene();
      mock.timers.enable({ apis: ['setTimeout'] });
      let calls = 0;
      const off = gaSubscribeForTest(() => calls++);
      try {
        gaDispatch({ type: 'step', who: 'player', dx: 0, dy: 0 }); // an unheard footstep: a 0.4 s timer
        gaDispatch({ type: 'musicStart' });
        gaDispatch({ type: 'mood', mood: 'alert' }); // an unheard change waiting for its bar
        if (end === 'close') gaCloseScene();
        else gaDispatch({ type: end });
        const after = calls;
        mock.timers.tick(30000);
        assert.equal(calls, after, `${end}: nothing fires afterward`);
      } finally {
        off();
        mock.timers.reset();
        gaCloseScene();
      }
    }
  });
});
