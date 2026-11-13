/**
 * Game Audio lab — the MIX, VOICES and NET instrument strips and page 20's
 * tool-window stage (src/screens/lab/gameaudio/scene/hud/cModel.ts), proven
 * against the lab's own reducer with no device.
 *
 * The strips are drawn from these readings and nothing else (the truth rule
 * of gaHudTypes.ts), so what is pinned here is what a learner SEES:
 *
 *   mix      the duck's reduction is on the music bus while a line speaks and
 *            gone after; a muted bus reads silenced; the fader tick follows
 *   voices   the slots never pass the budget; the least important voice is
 *            the one taken; a stolen loop waits and comes back; a refusal
 *            takes no slot
 *   net      a packet is at the network at `sent`, half way at half time, at
 *            the machine at `due`; a duplicate is ignored; with the ID check
 *            off the same id plays twice
 *   tools    for all four tools and all eight windows the stage shows only
 *            words that pages/data/gaToolMap.ts holds
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it } from 'node:test';
import { GA_BUSES } from '../src/screens/lab/gameaudio/engine/gaEngineProtocol.ts';
import { GA_BUS_NAME, GA_DUCK_ATTACK_S, GA_DUCK_DB, GA_DUCK_RELEASE_S, GA_EVENTS, GA_NET_DELAY_S } from '../src/screens/lab/gameaudio/model/gaDefs.ts';
import { gaInitial, gaReduce, gaVoiceCount, type GaAction, type GaState } from '../src/screens/lab/gameaudio/model/gaModel.ts';
import { BUDGET_STOPS } from '../src/screens/lab/gameaudio/pages/data/gaBudget.ts';
import { netFlightKey, netOutcome } from '../src/screens/lab/gameaudio/pages/data/gaNet.ts';
import { GA_TOOLS, GA_TOOL_MAP, GA_TOOL_NONE, GA_TOOL_WINDOWS, type GaToolId } from '../src/screens/lab/gameaudio/pages/data/gaToolMap.ts';
import {
  C_METER_MAX_DB,
  C_METER_MIN_DB,
  C_SLOTS_MAX,
  C_STOLEN_MARK_S,
  C_WINDOW_IDEAS,
  cBusMeters,
  cCapacity,
  cCellHead,
  cDbWord,
  cDuckRampS,
  cIdeaTag,
  cLastPosted,
  cMeterFrac,
  cMetersSettleAt,
  cMixSpoken,
  cMusicAt,
  C_NET_KEEP,
  cNetBoard,
  cNetKeep,
  cNetRemember,
  cNetSpoken,
  cPacketAt,
  cRamp,
  cSeatStep,
  cStolenBetween,
  cToolWord,
  cToolsLive,
  cToolsSpoken,
  cToolsStage,
  cVoiceBoard,
  cVoiceName,
  cVoicesSpoken,
  type CSeating,
} from '../src/screens/lab/gameaudio/scene/hud/cModel.ts';

/** Run actions through the real reducer (sound off: the scene simulates). */
function run(s: GaState, ...actions: GaAction[]): GaState {
  let out = s;
  for (const a of actions) out = gaReduce(out, a).state;
  return out;
}
/** The same, at a scene time. */
const at = (s: GaState, t: number, a: GaAction): GaState => gaReduce(s, a, t).state;
const clean = (): GaState => gaReduce(gaInitial(), { type: 'enterPage' }).state;
/** Where the model's ramps (LEVEL, faders, MUTE, SOLO, the duck) have settled. */
const settled = (s: GaState): number => cMetersSettleAt(s) ?? s.t;
/** A bus as the strip shows it once the ramps have settled (or at `t`). */
const bus = (s: GaState, id: string, t?: number) => cBusMeters(s, t ?? settled(s)).find((m) => m.bus === id)!;
const near = (a: number | null, b: number, eps = 0.05) => a != null && Math.abs(a - b) <= eps;
/** End every one-shot voice of an event (what the conductor does unheard). */
function endEvent(s: GaState, event: string): GaState {
  let out = s;
  for (const i of s.inst.filter((x) => x.event === event)) for (const v of s.voices.filter((x) => x.inst === i.id)) out = run(out, { type: 'expire', v: v.v });
  return out;
}

const HUD = join(process.cwd(), 'src/screens/lab/gameaudio/scene/hud');
const src = (f: string) => readFileSync(join(HUD, f), 'utf8').replace(/\r\n/g, '\n');
const code = (f: string) =>
  src(f)
    .replace(/\{\/\*[\s\S]*?\*\/\}/g, '')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^\s*\/\/.*$/gm, '');

/* ── mix ────────────────────────────────────────────────────────────────── */

describe('MIX strip — one meter per bus, from the model', () => {
  it('six buses, in the mixer’s order, under the names the controls use', () => {
    const m = cBusMeters(clean());
    assert.deepEqual(m.map((x) => x.bus), [...GA_BUSES]);
    assert.deepEqual(m.map((x) => x.label), GA_BUSES.map((b) => GA_BUS_NAME[b]));
    for (const x of m) assert.deepEqual([x.db, x.faderDb, x.duckDb, x.silenced, x.solo], [null, 0, 0, null, false], `${x.bus}: at rest`);
  });

  it('the duck’s reduction is on the music bus while a line speaks, and gone after', () => {
    let s = run(clean(), { type: 'musicStart' }, { type: 'scene', on: true }, { type: 'machine', id: 'generator-1', on: true });
    const before = { music: bus(s, 'music').db!, ambience: bus(s, 'ambience').db!, sfx: bus(s, 'sfx').db! };
    assert.ok(before.music > -20 && before.ambience > -42, 'the scene and the music are on the meters');
    assert.equal(bus(s, 'music').duckDb, 0);

    s = run(s, { type: 'post', event: 'vo_greeting', owner: 'guide' });
    assert.equal(bus(s, 'music').duckDb, GA_DUCK_DB.music);
    assert.equal(bus(s, 'ambience').duckDb, GA_DUCK_DB.ambience);
    assert.equal(bus(s, 'sfx').duckDb, GA_DUCK_DB.sfx);
    assert.equal(bus(s, 'dialogue').duckDb, 0, 'the line itself is not ducked');
    assert.equal(bus(s, 'chat').duckDb, 0);
    assert.ok(near(bus(s, 'music').db, before.music - 10), 'the music meter is 10 dB lower');
    assert.ok(near(bus(s, 'ambience').db, before.ambience - 8));
    assert.ok(near(bus(s, 'sfx').db, before.sfx - 5));
    assert.ok(bus(s, 'dialogue').db != null, 'the dialogue bus shows the line');
    assert.equal(bus(s, 'music').faderDb, 0, 'the fader did not move: the duck is not the fader');
    assert.match(cMixSpoken(s, 'music', settled(s)), /music: computed level −\d+ dB, fader 0 dB, ducked −10 dB, the bus on the BUS key/);

    s = endEvent(s, 'vo_greeting');
    assert.equal(bus(s, 'music').duckDb, 0, 'the last line ended: no reduction');
    assert.ok(near(bus(s, 'music').db, before.music));
    assert.equal(bus(s, 'dialogue').db, null);
  });

  it('with the duck switched off a line pulls nothing down', () => {
    const s = run(clean(), { type: 'musicStart' }, { type: 'option', patch: { duck: false } }, { type: 'post', event: 'vo_greeting', owner: 'guide' });
    for (const b of GA_BUSES) assert.equal(bus(s, b).duckDb, 0, b);
  });

  it('the strip follows the model’s ramp: at the instant of the line nothing has moved yet, then the duck opens over the attack and closes over the release', () => {
    let s = at(clean(), 50, { type: 'musicStart' });
    s = at(s, 60, { type: 'tick', t: 60 });
    s = at(s, 61, { type: 'post', event: 'vo_greeting', owner: 'guide' });
    assert.equal(cMetersSettleAt(s), 61 + GA_DUCK_ATTACK_S, 'the strip keeps its clock running to the end of the attack');
    assert.equal(bus(s, 'music', 61).duckDb, 0, 'the change has only begun');
    const half = bus(s, 'music', 61 + GA_DUCK_ATTACK_S / 2).duckDb;
    assert.ok(half < -0.5 && half > -10, `part-way at half the attack: ${half}`);
    assert.equal(Math.round(bus(s, 'music', 61 + GA_DUCK_ATTACK_S).duckDb), -10);
    const line = s.voices.find((v) => v.bus === 'dialogue')!;
    s = at(s, 64, { type: 'expire', v: line.v });
    assert.equal(cMetersSettleAt(s), 64 + GA_DUCK_RELEASE_S);
    assert.equal(Math.round(bus(s, 'music', 64).duckDb), -10, 'the release starts from the full duck');
    assert.equal(bus(s, 'music', 64 + GA_DUCK_RELEASE_S).duckDb, 0);
    assert.equal(cMetersSettleAt(at(s, 65, { type: 'tick', t: 65 })), null, 'settled: the clock stops');
  });

  it('the duck moves over the model’s own attack and release', () => {
    assert.equal(cDuckRampS(0, -10), GA_DUCK_ATTACK_S);
    assert.equal(cDuckRampS(-10, 0), GA_DUCK_RELEASE_S);
    assert.equal(cRamp(0, 10, 5, GA_DUCK_ATTACK_S, 5), 0);
    assert.ok(near(cRamp(0, 10, 5, GA_DUCK_ATTACK_S, 5 + GA_DUCK_ATTACK_S / 2), 5, 1e-9));
    assert.equal(cRamp(0, 10, 5, GA_DUCK_ATTACK_S, 5 + GA_DUCK_ATTACK_S), 10);
    assert.equal(cRamp(10, 0, 5, 0, 5), 0, 'no time given: at once (motion reduced)');
  });

  it('a muted bus reads silenced; SOLO silences the others; MUTE beats SOLO', () => {
    let s = run(clean(), { type: 'musicStart' }, { type: 'scene', on: true });
    s = run(s, { type: 'bus', bus: 'music', mute: true });
    assert.deepEqual([bus(s, 'music').silenced, bus(s, 'music').db], ['mute', null]);
    assert.equal(bus(s, 'ambience').silenced, null);
    assert.match(cMixSpoken(s, undefined, settled(s)), /music: muted/);

    s = run(s, { type: 'bus', bus: 'music', mute: false }, { type: 'bus', bus: 'ambience', solo: true });
    assert.deepEqual([bus(s, 'ambience').solo, bus(s, 'ambience').silenced], [true, null]);
    assert.ok(bus(s, 'ambience').db != null);
    for (const b of GA_BUSES.filter((x) => x !== 'ambience')) assert.deepEqual([bus(s, b).silenced, bus(s, b).db, bus(s, b).solo], ['solo', null, false], b);
    assert.match(cMixSpoken(s, undefined, settled(s)), /music: silent, because another bus is soloed/);

    s = run(s, { type: 'bus', bus: 'ambience', mute: true });
    assert.deepEqual([bus(s, 'ambience').silenced, bus(s, 'ambience').solo], ['mute', false]);
  });

  it('a silenced bus shows no duck: nothing passes for the duck to hold down', () => {
    const s = run(clean(), { type: 'musicStart' }, { type: 'bus', bus: 'music', mute: true }, { type: 'post', event: 'vo_greeting', owner: 'guide' });
    assert.equal(bus(s, 'music').duckDb, 0);
    assert.equal(bus(s, 'ambience').duckDb, GA_DUCK_DB.ambience);
  });

  it('the fader tick follows the bus fader, and the level follows it', () => {
    let s = run(clean(), { type: 'musicStart' });
    const was = bus(s, 'music').db!;
    s = run(s, { type: 'bus', bus: 'music', db: -12 });
    assert.equal(bus(s, 'music').faderDb, -12);
    assert.ok(near(bus(s, 'music').db, was - 12));
  });

  it('the lab LEVEL is in the level (after it), and the scale holds the meter', () => {
    let s = run(clean(), { type: 'musicStart' });
    const was = bus(s, 'music').db!;
    s = run(s, { type: 'master', value: s.master / 2 });
    assert.ok(near(bus(s, 'music').db, was - 6.02));
    assert.equal(cMeterFrac(null), 0);
    assert.equal(cMeterFrac(C_METER_MIN_DB), 0);
    assert.equal(cMeterFrac(C_METER_MAX_DB), 1);
    assert.equal(cMeterFrac(100), 1);
    assert.ok(cMeterFrac(-10) < cMeterFrac(0), 'ten decibels less is further left');
    assert.equal(cDbWord(-10), '−10 dB');
    assert.equal(cDbWord(-10, false), '−10');
    assert.equal(cDbWord(3), '+3 dB');
  });

  it('a layer that starts late is followed on the scene clock until it has begun', () => {
    const s0 = clean();
    const s = at(s0, 20, { type: 'door' });
    const late = s.voices.find((v) => v.delayS > 0);
    assert.ok(late, 'the door’s latch rattle is a late layer');
    assert.ok(near(cMetersSettleAt(s), late!.born + late!.delayS, 1e-6));
    const justBefore = bus(s, 'sfx', late!.born + late!.delayS - 0.01).db!;
    const justAfter = bus(s, 'sfx', late!.born + late!.delayS + 0.01).db!;
    assert.ok(justAfter > justBefore, 'the meter rises when the rattle begins');
    assert.equal(cMetersSettleAt(clean()), null);
  });
});

/* ── voices ─────────────────────────────────────────────────────────────── */

const loops: GaAction[] = [
  { type: 'scene', on: true },
  { type: 'machine', id: 'generator-1', on: true },
];
/** Drive the strip's memory the way the component does, one state at a time. */
function seatThrough(states: GaState[]): CSeating[] {
  const out: CSeating[] = [];
  let prev: { state: GaState; seating: CSeating } | null = null;
  for (const state of states) {
    const seating = cSeatStep(prev, state);
    out.push(seating);
    prev = { state, seating };
  }
  return out;
}

describe('VOICES strip — the budget as slots', () => {
  it('draws as many slots as the budget, for every stop of the BUDGET key', () => {
    for (const stop of BUDGET_STOPS) {
      const s = run(clean(), { type: 'voiceLimit', limit: stop });
      assert.equal(cCapacity(s.voiceLimit), stop === 0 ? C_SLOTS_MAX : stop, `budget ${stop}`);
      assert.equal(cSeatStep(null, s).seats.length, cCapacity(s.voiceLimit));
    }
    assert.ok(Math.max(...BUDGET_STOPS) <= C_SLOTS_MAX, 'the strip can draw the largest stop');
  });

  it('a slot shows what holds it, its priority and whether it is protected', () => {
    const s = run(clean(), { type: 'voiceLimit', limit: 8 }, ...loops, { type: 'alarm', on: true });
    const b = cVoiceBoard(s);
    assert.equal(b.limit, 8);
    assert.equal(b.used, gaVoiceCount(s));
    const held = b.seats.filter((x) => x != null);
    assert.deepEqual(held.map((x) => x!.short).sort(), ['ALARM', 'FAN', 'FOUNT', 'HUM', 'ROOM', 'WIND']);
    const alarm = held.find((x) => x!.short === 'ALARM')!;
    assert.deepEqual([alarm.priority, alarm.protected], [GA_EVENTS.alarm.priority, true]);
    assert.deepEqual([held.find((x) => x!.short === 'ROOM')!.priority, held.find((x) => x!.short === 'ROOM')!.protected], [GA_EVENTS.bed_room.priority, false]);
    assert.match(cVoicesSpoken(s, 0), /The budget is 8 voices; 6 are in use: .*the overheat alarm, priority 90, protected/);
  });

  it('every name fits a slot: five letters at most in a small slot', () => {
    for (const d of Object.values(GA_EVENTS)) {
      for (const layer of d.layers) {
        for (const owner of ['generator-1', 'generator-2']) {
          const n = cVoiceName(d.id, layer.id, owner);
          assert.ok(n.short.length >= 2 && n.short.length <= 5, `${d.id}/${layer.id}: "${n.short}"`);
          assert.ok(n.name.length <= 9, `${d.id}/${layer.id}: "${n.name}"`);
          assert.ok(n.spoken.length > 3);
        }
      }
    }
    assert.notEqual(cVoiceName('generator', 'hum', 'generator-1').short, cVoiceName('generator', 'hum', 'generator-2').short, 'two generators are told apart');
  });

  it('the slots never pass the budget, whatever arrives', () => {
    let s = run(clean(), { type: 'voiceLimit', limit: 8 }, ...loops);
    for (const a of [{ type: 'burst', count: 12 }, { type: 'door' }, { type: 'burst', count: 12 }, { type: 'alarm', on: true }, { type: 'burst', count: 12 }] as GaAction[]) {
      s = run(s, a);
      const b = cVoiceBoard(s);
      assert.equal(b.seats.length, 8, `${a.type}: eight slots`);
      assert.ok(b.used <= 8 && b.seats.filter((x) => x != null).length === b.used, `${a.type}: no more voices than slots`);
      assert.equal(new Set(b.seats.filter((x) => x != null).map((x) => x!.v)).size, b.used, `${a.type}: one voice per slot`);
    }
  });

  it('at a full budget the least important, oldest voice is the one taken, and its slot changes hands', () => {
    // five loops fill a budget of five: room tone 10, wind 10, fountain 20, hum 40, fan 40
    const full = run(clean(), { type: 'voiceLimit', limit: 5 }, ...loops);
    assert.equal(gaVoiceCount(full), 5);
    const room = cVoiceBoard(full).seats.findIndex((x) => x?.short === 'ROOM');
    const lowest = Math.min(...cVoiceBoard(full).seats.map((x) => x!.priority));
    assert.equal(cVoiceBoard(full).seats[room]!.priority, lowest);

    const next = run(full, { type: 'post', event: 'ui_confirm' });
    const stolen = cStolenBetween(full, next);
    assert.deepEqual(stolen, [cVoiceBoard(full).seats[room]!.v], 'the room tone: the lowest priority, and the older of the two at 10');

    const [, after] = seatThrough([full, next]);
    assert.deepEqual(Object.keys(after.taken), [String(room)], 'only that slot is marked');
    assert.equal(after.taken[room], next.t);
    const b = cVoiceBoard(next);
    assert.equal(b.seats[room]!.short, 'UI', 'the new sound sits in the slot it took');
    assert.deepEqual(b.waiting.map((x) => x.short), ['ROOM'], 'a stolen LOOP waits outside the slots');
    assert.equal(b.used, 5);
    assert.match(cVoicesSpoken(next, 0), /Waiting for a voice after theirs was stolen: the room tone\./);
  });

  it('a stolen loop comes back when a slot is free, and the mark goes with the slot', () => {
    const full = run(clean(), { type: 'voiceLimit', limit: 5 }, ...loops);
    const taken = run(full, { type: 'post', event: 'ui_confirm' });
    const back = endEvent(taken, 'ui_confirm');
    const b = cVoiceBoard(back);
    assert.deepEqual(b.waiting, []);
    assert.equal(b.used, 5);
    assert.ok(b.seats.some((x) => x?.short === 'ROOM'));
    const steps = seatThrough([full, taken, back]);
    assert.deepEqual(steps[2].taken, {}, 'the slot changed hands again: no STOLEN mark is left');
    assert.deepEqual(cStolenBetween(taken, back), [], 'a sound that ends is not a theft');
  });

  it('a STOLEN mark is brief: it does not outlive its moment', () => {
    const full = run(clean(), { type: 'voiceLimit', limit: 5 }, ...loops);
    const taken = at(full, 30, { type: 'post', event: 'vo_warning', owner: 'guide' });
    const fresh = at(taken, 30 + C_STOLEN_MARK_S / 2, { type: 'tick', t: 30 + C_STOLEN_MARK_S / 2 });
    const stale = at(fresh, 30 + C_STOLEN_MARK_S + 0.1, { type: 'tick', t: 30 + C_STOLEN_MARK_S + 0.1 });
    const steps = seatThrough([full, taken, fresh, stale]);
    assert.equal(Object.keys(steps[1].taken).length, 1);
    assert.deepEqual(steps[2].taken, steps[1].taken, 'still marked a moment later');
    assert.deepEqual(steps[3].taken, {}, 'and not after that');
  });

  it('a burst into a full budget: thefts take the loops, least important first', () => {
    const before = run(clean(), { type: 'voiceLimit', limit: 8 }, ...loops);
    const after = run(before, { type: 'burst', count: 12 });
    const stolen = new Set(cStolenBetween(before, after));
    const was = cVoiceBoard(before).seats.filter((x) => x != null);
    assert.equal(stolen.size, 5, 'all five loops were less important than an impact');
    for (const x of was) assert.ok(stolen.has(x!.v), `${x!.short} was taken`);
    const b = cVoiceBoard(after);
    assert.ok(b.seats.every((x) => x?.short === 'CRATE'), 'eight impacts hold the eight slots');
    assert.deepEqual(b.waiting.map((x) => x.short).sort(), ['FAN', 'FOUNT', 'HUM', 'ROOM', 'WIND']);
    const [, marks] = seatThrough([before, after]);
    assert.equal(Object.keys(marks.taken).length, 5, 'five slots changed hands');
  });

  it('a refusal takes no slot: protected voices keep theirs and nothing is marked', () => {
    let s = run(clean(), { type: 'voiceLimit', limit: 8 }, { type: 'alarm', on: true }, { type: 'voiceLimit', limit: 1 });
    const before = s;
    const refused = before.facts.refused ?? 0;
    s = run(s, { type: 'burst', count: 12 });
    assert.equal((s.facts.refused ?? 0) - refused, 12, 'every impact is refused');
    const b = cVoiceBoard(s);
    assert.deepEqual(b.seats.map((x) => x?.short), ['ALARM']);
    assert.deepEqual(cStolenBetween(before, s), []);
    assert.deepEqual(seatThrough([before, s])[1].taken, {});
    assert.match(cVoicesSpoken(s, 12), /Refused on this visit: 12\./);
  });

  it('with no limit the strip draws sixteen slots and counts the rest', () => {
    let s = run(clean(), { type: 'voiceLimit', limit: 0 }, ...loops, { type: 'burst', count: 12 }, { type: 'burst', count: 12 });
    const seating = cSeatStep(null, s);
    assert.equal(seating.seats.length, C_SLOTS_MAX);
    assert.equal(seating.seats.filter((x) => x != null).length + seating.over, gaVoiceCount(s));
    assert.ok(seating.over > 0);
    s = run(s, { type: 'stopAll' });
    assert.equal(cSeatStep(null, s).over, 0);
  });
});

/* ── net ────────────────────────────────────────────────────────────────── */

describe('NET strip — an action is a message that takes time', () => {
  it('a packet is at the network at `sent`, half way at half time, at the machine at `due`', () => {
    const p = { sent: 10, due: 10 + GA_NET_DELAY_S };
    assert.equal(cPacketAt(p, 9), 0);
    assert.equal(cPacketAt(p, 10), 0);
    assert.ok(near(cPacketAt(p, 10 + GA_NET_DELAY_S / 2), 0.5, 1e-9));
    assert.equal(cPacketAt(p, 10 + GA_NET_DELAY_S), 1);
    assert.equal(cPacketAt(p, 99), 1);
    assert.equal(cPacketAt({ sent: 5, due: 5 }, 5), 1, 'no delay: it is there');
  });

  it('nothing sent: an honest empty strip; a model with no record says so', () => {
    const b = cNetBoard(clean());
    assert.deepEqual([b.known, b.packets.length, b.delayS, b.idCheck], [true, 0, null, true]);
    assert.match(cNetSpoken(clean()), /No action has been sent yet\. The I D check is on\./);
    const old = { ...clean(), netFlights: undefined };
    assert.deepEqual([cNetBoard(old).known, cNetBoard(old).packets.length], [false, 0]);
  });

  it('a new action travels for the model’s delay, then plays on both machines', () => {
    let s = at(clean(), 10, { type: 'net', id: 'A1', what: 'door', to: 'world' });
    let p = cNetBoard(s).packets[0];
    assert.deepEqual([p.id, p.what, p.landed, p.here, p.there, p.toYou, p.toOther], ['A1', 'DOOR', false, 'pending', 'pending', true, true]);
    assert.ok(near(p.due - p.sent, GA_NET_DELAY_S, 1e-6));
    assert.ok(near(cNetBoard(s).delayS, GA_NET_DELAY_S, 1e-6));
    assert.equal(s.inst.some((i) => i.event === 'door_open'), false, 'nothing has played yet: the message is on its way');

    s = at(s, p.due, { type: 'tick', t: p.due });
    p = cNetBoard(s).packets[0];
    assert.deepEqual([p.landed, p.here, p.there, p.double], [true, 'plays', 'plays', false]);
    assert.ok(s.inst.some((i) => i.event === 'door_open'), 'the door sound plays when the message lands');
  });

  it('the same id again: IGNORED with the ID check on, a DOUBLE with it off', () => {
    const land = (s: GaState, t: number) => at(s, t, { type: 'tick', t });
    let on = land(at(clean(), 10, { type: 'net', id: 'A1', what: 'door', to: 'world' }), 10.3);
    on = land(at(on, 11, { type: 'net', id: 'A1', what: 'door', to: 'world' }), 11.3);
    const dup = cNetBoard(on).packets[1];
    assert.deepEqual([dup.id, dup.here, dup.there, dup.double, dup.doubleThere], ['A1', 'ignored', 'ignored', false, false]);
    assert.match(cNetSpoken(on), /your machine, ignored as a duplicate/);

    let off = run(clean(), { type: 'option', patch: { dedupe: false } });
    off = land(at(off, 10, { type: 'net', id: 'A1', what: 'door', to: 'world' }), 10.3);
    off = land(at(off, 11, { type: 'net', id: 'A1', what: 'door', to: 'world' }), 11.3);
    const [first, second] = cNetBoard(off).packets;
    assert.deepEqual([first.here, first.double], ['plays', false]);
    assert.deepEqual([second.here, second.double, second.doubleThere], ['plays', true, true], 'the same id played a second time, on both machines');
    assert.equal(first.doubleThere, false);
    assert.equal(cNetBoard(off).idCheck, false);
    assert.match(cNetSpoken(off), /played a second time, a double/);
  });

  it('a double is still a double after the model has let the first delivery go', () => {
    const land = (s: GaState, t: number) => at(s, t, { type: 'tick', t });
    let s = run(clean(), { type: 'option', patch: { dedupe: false } });
    s = land(at(s, 10, { type: 'net', id: 'A1', what: 'door', to: 'world' }), 10.3);
    const memory = cNetRemember(new Map(), s);
    assert.equal(memory.get('A1'), s.netFlights![0].sent);
    // much later: the first delivery has left the model's list
    s = land(at(s, 60, { type: 'net', id: 'A1', what: 'door', to: 'world' }), 60.3);
    assert.equal(s.netFlights!.length, 1, 'only the second delivery is still listed');
    assert.equal(cNetBoard(s).packets[0].double, false, 'without the strip’s memory it cannot know');
    assert.equal(cNetBoard(s, memory).packets[0].double, true);
    assert.equal(cNetRemember(memory, s), memory, 'nothing new to remember: the same map');
  });

  it('what landed stays on the strip after the model lets it go, keyed as the page keys it', () => {
    const land = (x: GaState, t: number) => at(x, t, { type: 'tick', t });
    let s = land(at(clean(), 10, { type: 'net', id: 'A1', what: 'door', to: 'world' }), 10.3);
    let kept = cNetKeep([], cNetBoard(s));
    assert.deepEqual(kept.map((p) => [p.id, p.here, p.key]), [['A1', 'plays', netFlightKey(s.netFlights![0])]]);
    assert.equal(cNetKeep(kept, cNetBoard(s)), kept, 'nothing new: the same list');
    // much later the model has forgotten it; the strip still says what became of it
    s = land(s, 30);
    assert.equal(cNetBoard(s).packets.length, 0);
    assert.equal(cNetKeep(kept, cNetBoard(s)), kept);
    assert.match(cNetSpoken(s, kept), /Action A1, door: your machine, played; the other machine, played\. A message takes 0\.25 seconds/);
    assert.match(cNetSpoken(s), /No action has been sent yet/);
    // the model reuses the number once its list is empty: a new send is a NEW record
    s = land(at(s, 40, { type: 'net', id: 'A2', what: 'alert', to: 'them' }), 40.3);
    kept = cNetKeep(kept, cNetBoard(s));
    assert.deepEqual(kept.map((p) => p.id), ['A1', 'A2']);
    for (let k = 3; k <= 8; k++) {
      s = land(at(s, 50 + k, { type: 'net', id: `A${k}`, what: 'alert', to: 'me' }), 50.3 + k);
      kept = cNetKeep(kept, cNetBoard(s));
    }
    assert.deepEqual(kept.map((p) => p.id), ['A5', 'A6', 'A7', 'A8'], `the last ${C_NET_KEEP}`);
  });

  it('an alert for one player travels one way only', () => {
    const land = (s: GaState, t: number) => at(s, t, { type: 'tick', t });
    const me = cNetBoard(land(at(clean(), 10, { type: 'net', id: 'A1', what: 'alert', to: 'me' }), 10.3)).packets[0];
    assert.deepEqual([me.toYou, me.toOther, me.here, me.there], [true, false, 'plays', 'nothing']);
    const flying = cNetBoard(at(clean(), 10, { type: 'net', id: 'A2', what: 'alert', to: 'them' })).packets[0];
    assert.deepEqual([flying.toYou, flying.toOther, flying.here, flying.there], [false, true, 'nothing', 'pending']);
    const them = cNetBoard(land(at(clean(), 10, { type: 'net', id: 'A2', what: 'alert', to: 'them' }), 10.3)).packets[0];
    assert.deepEqual([them.here, them.there], ['nothing', 'plays']);
    // the other player's alert again, ID check off: a double THERE, still nothing here
    let twice = run(clean(), { type: 'option', patch: { dedupe: false } });
    twice = land(at(twice, 10, { type: 'net', id: 'A2', what: 'alert', to: 'them' }), 10.3);
    twice = land(at(twice, 11, { type: 'net', id: 'A2', what: 'alert', to: 'them' }), 11.3);
    const again = cNetBoard(twice).packets[1];
    assert.deepEqual([again.here, again.double, again.there, again.doubleThere], ['nothing', false, 'plays', true]);
  });

  it('both ends agree with the page’s own card (pages/data/gaNet)', () => {
    const word = { plays: 'plays', ignored: 'ignored', nothing: 'nothing' } as const;
    for (const to of ['world', 'me', 'them'] as const) {
      for (const idCheck of [true, false]) {
        for (const again of [false, true]) {
          let s = run(clean(), { type: 'option', patch: { dedupe: idCheck } });
          const land = (x: GaState, t: number) => at(x, t, { type: 'tick', t });
          if (again) s = land(at(s, 5, { type: 'net', id: 'A1', what: 'alert', to }), 5.3);
          s = land(at(s, 10, { type: 'net', id: 'A1', what: 'alert', to }), 10.3);
          const p = cNetBoard(s).packets[cNetBoard(s).packets.length - 1];
          const card = netOutcome({ id: 'A1', what: 'alert', to }, again, idCheck);
          // an ignored duplicate never reaches a player it was not sent to
          const here = card.here === 'ignored' && to === 'them' ? 'nothing' : word[card.here];
          const there = card.there === 'ignored' && to === 'me' ? 'nothing' : word[card.there];
          assert.deepEqual([p.here, p.there], [here, there], `to ${to}, check ${idCheck}, again ${again}`);
        }
      }
    }
  });
});

/* ── the tool-window stage ──────────────────────────────────────────────── */

const TOOLS_AND_NONE: (GaToolId | null)[] = [null, ...GA_TOOLS.map((t) => t.id)];

describe('tool-window stage — the eight windows, relabeled, nothing invented', () => {
  it('the same eight windows, numbers and order as the figure, for every tool', () => {
    for (const tool of TOOLS_AND_NONE) {
      const st = cToolsStage(tool, 0);
      assert.deepEqual(st.windows.map((w) => [w.n, w.id, w.tag, w.name]), GA_TOOL_WINDOWS.map((w) => [w.n, w.id, w.tag, w.name]));
      assert.ok(st.windows.every((w) => !w.lit && !w.dim), 'window 0: none lit, none dimmed');
      assert.equal(st.toolLabel, tool ? GA_TOOLS.find((t) => t.id === tool)!.label : 'ANY TOOL');
    }
  });

  it('stepping WINDOW lights one and dims the other seven; a number out of range lights none', () => {
    for (let win = 1; win <= 8; win++) {
      const st = cToolsStage('wwise', win);
      assert.deepEqual(st.windows.filter((w) => w.lit).map((w) => w.n), [win]);
      assert.equal(st.windows.filter((w) => w.dim).length, 7);
    }
    for (const bad of [-1, 9, 2.5, Number.NaN]) assert.equal(cToolsStage('wwise', bad).win, 0);
  });

  it('every one of the lab’s twelve ideas has one place on the screen', () => {
    const placed = Object.values(C_WINDOW_IDEAS).flat();
    assert.deepEqual([...placed].sort(), GA_TOOL_MAP.map((r) => r.id).sort());
    assert.deepEqual(Object.keys(C_WINDOW_IDEAS).sort(), GA_TOOL_WINDOWS.map((w) => w.id).sort());
  });

  it('ALL FOUR TOOLS, ALL EIGHT WINDOWS: only names the map holds for that tool', () => {
    let shown = 0;
    for (const tool of GA_TOOLS) {
      for (let win = 0; win <= 8; win++) {
        for (const w of cToolsStage(tool.id, win).windows) {
          for (const x of w.words) {
            const row = GA_TOOL_MAP.find((r) => r.id === x.id)!;
            const cell = row[tool.id];
            shown += 1;
            assert.equal(x.idea, row.idea);
            assert.equal(x.meaning, row.meaning);
            if (cell === GA_TOOL_NONE) {
              assert.deepEqual([x.none, x.word, x.full], [true, row.idea, row.idea], `${tool.id}/${row.id}: a dash shows the lab’s own word, marked`);
            } else {
              assert.equal(x.none, false);
              assert.equal(x.full, cell, `${tool.id}/${row.id}: the lit window prints the whole cell`);
              assert.ok(cell.startsWith(x.word) && x.word.length > 0, `${tool.id}/${row.id}: "${x.word}" is the head of the cell`);
              const rest = cell.slice(x.word.length);
              assert.ok(rest === '' || rest.startsWith(', ') || rest.startsWith(' ('), `${tool.id}/${row.id}: cut only at a comma or a bracket`);
            }
          }
        }
      }
    }
    assert.equal(shown, GA_TOOLS.length * 9 * GA_TOOL_MAP.length);
  });

  it('with no tool chosen every place holds the lab’s own word', () => {
    for (const w of cToolsStage(null, 3).windows) for (const x of w.words) assert.deepEqual([x.word, x.full, x.none], [x.idea, x.idea, false]);
    assert.equal(cToolWord('no-such-idea', 'wwise'), null);
  });

  it('a window’s short heading for an idea uses only the map’s words for that idea', () => {
    for (const row of GA_TOOL_MAP) {
      const tag = cIdeaTag(row.id);
      assert.equal(tag, tag.toUpperCase());
      for (const word of tag.split(' ')) assert.ok(row.idea.toUpperCase().split(' ').includes(word), `${row.id}: "${word}" is in "${row.idea}"`);
    }
    assert.equal(cCellHead('Game Parameter, linked by an RTPC'), 'Game Parameter');
    assert.equal(cCellHead('Sound Cue or MetaSound Source (an asset the game plays, not an event)'), 'Sound Cue or MetaSound Source');
    assert.equal(cCellHead('Audio Bus'), 'Audio Bus');
  });

  it('the drawings hold no tool name of their own: every name comes from the map', () => {
    const files = ['cToolsStage.tsx', 'cModel.ts', 'cKit.tsx', 'hudC.tsx'];
    const cells = new Set<string>();
    for (const row of GA_TOOL_MAP) for (const t of GA_TOOLS) if (row[t.id] !== GA_TOOL_NONE) cells.add(row[t.id]);
    const own = new Set(GA_TOOL_MAP.map((r) => r.idea));
    for (const f of files) {
      const text = code(f);
      for (const cell of cells) {
        if (own.has(cell)) continue; // "Event", "Listener": also the lab's own word
        assert.ok(!text.includes(`'${cell}'`) && !text.includes(`"${cell}"`) && !text.includes(`>${cell}<`), `${f} spells out "${cell}"`);
      }
      for (const t of GA_TOOLS) assert.ok(!new RegExp(`['">]${t.spoken}['"<]`).test(text), `${f} spells out ${t.spoken}`);
    }
  });

  it('it is alive: the event posted is marked, playing, listed, and its settings are the model’s', () => {
    let s = clean();
    let live = cToolsLive(s);
    assert.deepEqual([live.instances.length, live.files.length, live.selected, live.log, live.voices], [0, 0, null, null, 0]);
    assert.ok(live.events.every((e) => !e.newest && e.playing === 0));
    assert.equal(cLastPosted(s), null);

    s = at(s, 12, { type: 'door' });
    live = cToolsLive(s);
    assert.equal(cLastPosted(s), 'door_open');
    const door = live.events.find((e) => e.id === 'door_open')!;
    assert.deepEqual([door.name, door.newest, door.playing], [GA_EVENTS.door_open.name, true, 1]);
    assert.equal(live.events.filter((e) => e.newest).length, 1);
    assert.equal(live.instances.length, 1);
    assert.ok(live.files.length >= 1 && live.files.every((f) => f.endsWith('.wav')), 'the files are the sound bank’s names');
    assert.deepEqual([live.selected!.name, live.selected!.priority, live.selected!.bus, live.selected!.min, live.selected!.max], [GA_EVENTS.door_open.name, 50, GA_BUS_NAME.sfx, GA_EVENTS.door_open.atten!.min, GA_EVENTS.door_open.atten!.max]);
    assert.equal(live.log, s.log[s.log.length - 1], 'the profiler shows the newest log line');
    assert.equal(live.voices, gaVoiceCount(s));
    assert.match(cToolsSpoken('fmod', 2, s), /Window 2, The event list, is lit\. Event: Event; Instance: Event instance\. Playing now: Door\./);
    assert.match(cToolsSpoken('unity', 2, s), /Event: no single name in Unity/);
    assert.match(cToolsSpoken(null, 0, s), /The names are this lab’s own words\./);
  });

  it('the event list keeps its rows: only the last gives way to an event with no row', () => {
    const rest = cToolsLive(clean(), 3).events.map((e) => e.id);
    let s = run(clean(), { type: 'machine', id: 'generator-1', on: true });
    assert.deepEqual(cToolsLive(s, 3).events.map((e) => e.id), rest, 'a listed event plays: no row moves');
    assert.equal(cToolsLive(s, 3).events.find((e) => e.id === 'generator')!.newest, true);
    s = run(s, { type: 'alarm', on: true });
    const rows = cToolsLive(s, 3).events.map((e) => e.id);
    assert.deepEqual(rows.slice(0, 2), rest.slice(0, 2));
    assert.equal(rows[2], 'alarm');
  });

  it('game information is the scene’s: the surface switch, the mood state, the speed value', () => {
    let s = clean();
    assert.deepEqual([cToolsLive(s).surface, cToolsLive(s).mood, cToolsLive(s).speedPct], ['stone', 'calm', 40]);
    s = run(s, { type: 'speed', id: 'generator-1', value: 0.8 }, { type: 'mood', mood: 'alert' });
    assert.deepEqual([cToolsLive(s).mood, cToolsLive(s).speedPct], ['alert', 80]);
  });

  it('the music window’s play line is the model’s clock', () => {
    const s = at(clean(), 100, { type: 'musicStart' });
    assert.deepEqual(cMusicAt(s, 100), { frac: 0, bar: 1, beat: 1 });
    const two = cMusicAt(s, 102.5 + 1e-6);
    assert.deepEqual([two.bar, two.beat], [2, 1]);
    assert.ok(near(two.frac, 0.25, 1e-3));
    assert.deepEqual([cMusicAt(s, 100 + 0.625 * 3 + 1e-6).bar, cMusicAt(s, 100 + 0.625 * 3 + 1e-6).beat], [1, 4]);
    assert.ok(near(cMusicAt(s, 110 + 1e-6).frac, 0, 1e-3), 'ten seconds: the phrase comes round');
    assert.deepEqual(cMusicAt(clean(), 55), { frac: 0, bar: 1, beat: 1 }, 'music off: parked at the start');
    assert.equal(cToolsLive(s).music.on, true);
  });
});

/* ── the drawings ───────────────────────────────────────────────────────── */

describe('the strips and the stage are read-only displays', () => {
  const drawn = ['cMix.tsx', 'cVoices.tsx', 'cNet.tsx', 'cToolsStage.tsx', 'cKit.tsx'];

  it('hudC serves mix, voices and net, and exports the stage', () => {
    const t = code('hudC.tsx');
    assert.match(t, /mix: MixStrip/);
    assert.match(t, /voices: VoicesStrip/);
    assert.match(t, /net: NetStrip/);
    assert.match(t, /export \{ GaToolsStage, type GaToolsStageProps \} from '\.\/cToolsStage'/);
    assert.match(code('cToolsStage.tsx'), /export type GaToolsStageProps = \{ w: number; h: number; tool: GaToolId \| null; win: number; state: GaState \};/);
  });

  it('nothing on the glass takes a touch', () => {
    for (const f of drawn) {
      const t = code(f);
      assert.ok(!/\bPressable\b|\bTouchable\w*\b|onPress|onPressIn|onResponder|PanResponder|onStartShouldSetResponder/.test(t), `${f} has a touch handler`);
    }
  });

  it('each display says in words what it shows (an image with a label)', () => {
    for (const [f, spoken] of [['cMix.tsx', 'cMixSpoken'], ['cVoices.tsx', 'cVoicesSpoken'], ['cNet.tsx', 'cNetSpoken'], ['cToolsStage.tsx', 'cToolsSpoken']] as const) {
      const t = code(f);
      assert.match(t, /accessible accessibilityRole="image"/, f);
      assert.ok(t.includes(`accessibilityLabel={${spoken}(`), `${f} is labeled from ${spoken}`);
    }
  });

  it('motion is the house’s: every display asks useDecorativeMotion, and none runs a timer of its own to move a picture', () => {
    for (const f of ['cMix.tsx', 'cVoices.tsx', 'cNet.tsx', 'cToolsStage.tsx']) {
      const t = code(f);
      assert.match(t, /useDecorativeMotion\(\)|useSceneClock\(/, `${f}: its motion passes the house gate`);
      assert.ok(!/withRepeat|setInterval|requestAnimationFrame/.test(t), `${f}: the only clocks are cKit’s, anchored to the scene’s time`);
    }
    const kit = code('cKit.tsx');
    assert.match(kit, /gaNow\(\)/, 'the frame clock reads the scene’s own time');
    assert.ok(!/withRepeat/.test(kit), 'nothing loops on a decorative timer');
    // with motion reduced a ramp shows its END value, never part-way
    assert.match(kit, /if \(!moving\) return runUntil != null && Number\.isFinite\(runUntil\) \? Math\.max\(still, runUntil\) : still;/);
    // both clocks ask the gate themselves, so no display can run one ungated
    for (const hook of ['useSceneClock', 'useSceneSeconds']) {
      const body = kit.slice(kit.indexOf(`export function ${hook}(`));
      assert.match(body.slice(0, body.indexOf('\n}\n')), /const moving = useDecorativeMotion\(\);[\s\S]*if \(!moving/, `${hook} holds still when motion is reduced`);
    }
  });

  it('levels use the house loudness ramp, and no size on the glass is under 9 pt', () => {
    assert.match(code('cKit.tsx'), /levelColorForDb\(/);
    assert.match(code('cMix.tsx'), /levelColorForDb\(/);
    for (const f of drawn) {
      for (const m of code(f).matchAll(/fontSize:\s*(\d+(?:\.\d+)?)\b(?!\s*\*)/g)) assert.ok(Number(m[1]) >= 9, `${f}: fontSize ${m[1]}`);
    }
    const type = code('cKit.tsx').match(/label: (\d+(?:\.\d+)?), value: (\d+(?:\.\d+)?), line: \d+, full: false/);
    assert.ok(type && Number(type[1]) >= 9 && Number(type[2]) >= 9, 'a 48 pt strip sets its words at 9 pt or more');
    assert.match(code('cToolsStage.tsx'), /const u = Math\.max\(1,/, 'the stage never scales its type below its authored size');
    assert.match(code('cToolsStage.tsx'), /small: 9 \* u/);
  });
});
