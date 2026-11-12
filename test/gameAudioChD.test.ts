/**
 * Game Audio lab — chapter 5's pure files (pages/data/gaMix, gaBudget, gaNet,
 * gaFaults), proven against the lab's own reducer with no device:
 *
 *   16 The game mix      the bus lane, the words for a bus, the duck's amounts
 *   17 Budgets           the BUDGET stops, the memory arithmetic, the counts
 *                        the page and its guide quote, "the alarm survived"
 *   18 Multiplayer       action ids, one message on two machines, a double
 *                        that was really heard here
 *   19 Testing           five faults: planted, SEEN, then fixed — never fixed
 *                        by pressing two buttons without the symptom
 *
 * Each scenario runs the real gaReduce, so a page's goal can only be met by
 * something the model really did.
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';
import { GA_BUSES } from '../src/screens/lab/gameaudio/engine/gaEngineProtocol.ts';
import { GA_DUCK_DB } from '../src/screens/lab/gameaudio/model/gaDefs.ts';
import { gaFact, gaInitial, gaPlaying, gaReduce, gaVoiceCount, type GaAction, type GaState } from '../src/screens/lab/gameaudio/model/gaModel.ts';
import { surfaceAt } from '../src/screens/lab/gameaudio/model/gaWorld.ts';
import { gaAsset, gaSound, gaSoundBytes } from '../src/screens/lab/gameaudio/sounds/gaSoundBank.ts';
import {
  BUDGET_STOPS,
  MEMORY_IDS,
  budgetHeld,
  budgetShort,
  budgetStep,
  budgetToLane,
  budgetWords,
  decodedBytes,
  fmtInt,
  laneToBudget,
  memoryRow,
  memoryRowSpoken,
  protectedSounding,
} from '../src/screens/lab/gameaudio/pages/data/gaBudget.ts';
import {
  FAULTS,
  FAULT_IDS,
  benchAdvance,
  benchStart,
  faultActions,
  faultFixed,
  faultOpen,
  faultSet,
  faultsOpen,
  fixChoices,
  settingsWrong,
  standMoves,
  standingOn,
  strayLoops,
  type Bench,
  type FaultId,
} from '../src/screens/lab/gameaudio/pages/data/gaFaults.ts';
import { BUS_DB_MAX, BUS_DB_MIN, BUS_LANE_HOME, MIX_BUSES, SIGNAL_PATH, busNow, busNowSpoken, busNowWord, dbToLane, duckWords, fmtDb, laneToDb, lineSpeaking, mixBus, signalPathSpoken } from '../src/screens/lab/gameaudio/pages/data/gaMix.ts';
import { netEffectWords, netMessageWords, netOutcome, nextNetId, type NetSend } from '../src/screens/lab/gameaudio/pages/data/gaNet.ts';
import { G16 } from '../src/screens/lab/gameaudio/pages/guides/p16.ts';
import { G17 } from '../src/screens/lab/gameaudio/pages/guides/p17.ts';

/** Run actions through the real reducer (sound off: the model works unheard). */
function run(s: GaState, ...actions: GaAction[]): GaState {
  let out = s;
  for (const a of actions) out = gaReduce(out, a).state;
  return out;
}
const texts = (s: GaState, from = 0) => s.log.filter((l) => l.n > from).map((l) => l.text);
/** The scene a page opens on (GaRack sends `enterPage` when it mounts). */
const clean = (from: GaState = gaInitial()): GaState => gaReduce(from, { type: 'enterPage' }).state;

/* ── 16 · the game mix ──────────────────────────────────────────────────── */

describe('page 16 — the bus lane and the words for a bus', () => {
  it('every bus of the engine has its word, and the log’s two short ids are explained', () => {
    assert.deepEqual(MIX_BUSES.map((b) => b.id).sort(), [...GA_BUSES].sort());
    assert.match(mixBus('sfx').carries, /calls it sfx/);
    assert.match(mixBus('ui').carries, /calls it ui/);
    for (const b of MIX_BUSES) assert.ok(b.code.length <= 5 && b.label.length <= 10, `${b.id}: fits a dock key`);
  });
  it('the lane covers −24…+6 dB in whole steps and rests at 0 dB', () => {
    assert.equal(laneToDb(0), BUS_DB_MIN);
    assert.equal(laneToDb(1), BUS_DB_MAX);
    assert.equal(laneToDb(BUS_LANE_HOME), 0);
    for (let db = BUS_DB_MIN; db <= BUS_DB_MAX; db++) assert.equal(laneToDb(dbToLane(db)), db);
    assert.equal(dbToLane(-60), 0);
    assert.equal(fmtDb(0), '0 dB');
    assert.equal(fmtDb(3), '+3 dB');
    assert.equal(fmtDb(-10), '−10 dB');
    assert.equal(fmtDb(-10, false), '−10');
  });
  it('the duck’s amounts in the lesson and the guide are the model’s', () => {
    assert.equal(duckWords(), 'music by 10 dB, ambience by 8 dB and effects by 5 dB');
    assert.deepEqual(GA_DUCK_DB, { music: -10, ambience: -8, sfx: -5 });
    assert.ok(G16.changes.join(' ').includes('music drops 10 dB, ambience 8 dB and effects 5 dB'));
  });
  it('a line ducks the buses the readout names, and DUCK off leaves them alone', () => {
    let s = gaInitial();
    assert.equal(busNowWord(s, 'music'), '0 dB');
    s = run(s, { type: 'post', event: 'vo_greeting', owner: 'guide' });
    assert.ok(lineSpeaking(s));
    assert.equal(gaFact(s, 'duck'), 1);
    assert.equal(busNowWord(s, 'music'), '−10 dB');
    assert.equal(busNowWord(s, 'ambience'), '−8 dB');
    assert.equal(busNowWord(s, 'sfx'), '−5 dB');
    assert.equal(busNowWord(s, 'chat'), '0 dB');
    assert.ok(busNow(s, 'music').ducked && !busNow(s, 'chat').ducked);
    assert.ok(texts(s).some((t) => t.startsWith('DUCK on')));
    // the same line with the duck off: still speaking, nothing dips, no DUCK line
    let off = run(gaInitial(), { type: 'option', patch: { duck: false } }, { type: 'post', event: 'vo_greeting', owner: 'guide' });
    assert.ok(lineSpeaking(off) && !off.options.duck);
    assert.equal(gaFact(off, 'duck'), 0);
    assert.equal(busNowWord(off, 'music'), '0 dB');
    assert.ok(!texts(off).some((t) => t.startsWith('DUCK')));
    assert.ok(texts(off).includes('SETTING ducking under dialogue: OFF'), 'the switch itself is logged');
    assert.equal(gaFact(off, 'option:duck:false'), 1);
    off = run(off, { type: 'bus', bus: 'music', db: -12 });
    assert.equal(busNowWord(off, 'music'), '−12 dB');
  });
  it('a muted bus and a bus left out of a solo read as words, not as a level', () => {
    let s = run(gaInitial(), { type: 'bus', bus: 'music', mute: true });
    assert.equal(busNowWord(s, 'music'), 'MUTED');
    s = run(gaInitial(), { type: 'bus', bus: 'ambience', solo: true });
    assert.equal(busNowWord(s, 'music'), 'SILENT');
    assert.equal(busNowWord(s, 'ambience'), '0 dB');
    assert.equal(busNowSpoken(s, 'music'), 'the music bus is silent, because another bus is soloed');
    assert.equal(busNowSpoken(s, 'ambience'), 'the ambience bus is at 0 dB now');
    // a readout value is seven letters or fewer, so its label is kept
    for (const w of ['MUTED', 'SILENT', '−24 dB', '+6 dB']) assert.ok(w.length <= 7, w);
    assert.equal(gaFact(s, 'bus:ambience'), 1);
  });
  it('the visual cue is a state the page can read while the alarm runs', () => {
    const s = run(gaInitial(), { type: 'alarm', on: true }, { type: 'option', patch: { visualCue: true } });
    assert.ok(gaPlaying(s, 'alarm') && s.options.visualCue);
    assert.equal(gaFact(s, 'alarmOn'), 1);
    assert.equal(gaFact(s, 'option:visualCue:true'), 1);
  });
  it('every page opens on a clean scene: nothing playing, standard settings, the facts kept', () => {
    const busy = run(
      gaInitial(),
      { type: 'scene', on: true },
      { type: 'machine', id: 'generator-1', on: true },
      { type: 'musicStart' },
      { type: 'alarm', on: true },
      { type: 'option', patch: { visualCue: true, duck: false, dedupe: false, variation: false } },
      { type: 'bus', bus: 'music', mute: true },
      { type: 'voiceLimit', limit: 2 },
      { type: 'door' },
    );
    const s = clean(busy);
    assert.equal(s.inst.length, 0);
    assert.equal(gaVoiceCount(s), 0);
    assert.ok(!s.music.on && !s.machines[0].on && s.machines.length === 1 && !s.doorOpen);
    assert.ok(s.options.duck && s.options.dedupe && s.options.variation && !s.options.visualCue);
    assert.ok(!s.bus.music.mute);
    assert.equal(s.voiceLimit, 16);
    assert.equal(s.log.length, 0);
    assert.equal(surfaceAt(s.chars.player), 'stone');
    assert.equal(surfaceAt(s.chars.guide), 'wood');
    // the facts are kept, and the reset is not counted as the learner's act
    assert.equal(gaFact(s, 'option:visualCue:true'), 1);
    assert.equal(gaFact(s, 'option:duck:true'), 0);
    // page 16's steps from there: scene, generator, music, then the guide's line ducks
    const p16 = run(s, { type: 'scene', on: true }, { type: 'machine', id: 'generator-1', on: true }, { type: 'musicStart' }, { type: 'post', event: 'vo_greeting', owner: 'guide' });
    assert.equal(gaFact(p16, 'duck') - gaFact(s, 'duck'), 1);
    // the chat line is not on the dialogue bus: it starts no duck
    const chat = run(s, { type: 'post', event: 'chat' });
    assert.ok(gaPlaying(chat, 'chat') && !lineSpeaking(chat));
    assert.equal(gaFact(chat, 'duck'), gaFact(s, 'duck'));
  });
  it('the signal path card names both paths, and the chat bus is a stand-in voice', () => {
    assert.deepEqual([...SIGNAL_PATH.audio], ['sound', 'its bus', 'master', 'output']);
    assert.deepEqual([...SIGNAL_PATH.control], ['event', 'switch', 'parameter', 'state']);
    assert.equal(
      signalPathSpoken(),
      'Signal path. Audio: sound, then its bus, then master, then output. Control: the game sends an event, a switch, a parameter or a state. Control tells the audio path what to do and carries no audio.',
    );
    assert.match(mixBus('chat').carries, /stand-in voice/);
  });
});

/* ── 17 · budgets ───────────────────────────────────────────────────────── */

describe('page 17 — the BUDGET lane', () => {
  it('stops at 1, 2, 4, 8, 12, 16 and no limit, and steps one stop at a time', () => {
    assert.deepEqual([...BUDGET_STOPS], [1, 2, 4, 8, 12, 16, 0]);
    for (const n of BUDGET_STOPS) assert.equal(laneToBudget(budgetToLane(n)), n);
    assert.equal(laneToBudget(0), 1);
    assert.equal(laneToBudget(1), 0);
    assert.equal(budgetStep(8, -1), 4);
    assert.equal(budgetStep(8, 1), 12);
    assert.equal(budgetStep(16, 1), 0);
    assert.equal(budgetStep(0, 1), 0);
    assert.equal(budgetStep(1, -1), 1);
    assert.equal(budgetStep(0, -1), 16);
    // a limit another page left between two stops reads as the next stop up
    assert.equal(laneToBudget(budgetToLane(6)), 8);
    assert.equal(budgetShort(0), 'NONE');
    assert.equal(budgetShort(8), '8');
    assert.equal(budgetWords(1), 'BUDGET 1 VOICE');
    assert.equal(budgetWords(8), 'BUDGET 8 VOICES');
    assert.equal(budgetWords(0), 'BUDGET: NO LIMIT');
  });
});

describe('page 17 — the memory arithmetic is exact', () => {
  it('samples × 4 bytes × channels, and it is what the sound bank reports', () => {
    assert.equal(decodedBytes(48_000, 1), 192_000);
    assert.equal(fmtInt(192000), '192,000');
    assert.equal(fmtInt(1920000), '1,920,000');
    assert.equal(fmtInt(999), '999');
    for (const id of MEMORY_IDS) {
      const a = gaAsset(id);
      const sound = gaSound(id);
      assert.ok(a && sound, id);
      const row = memoryRow(id, a.label, a.file, sound);
      assert.equal(row.bytes, gaSoundBytes(id), `${id}: the card's size is the bank's`);
      assert.ok(row.sum.endsWith(`= ${fmtInt(row.bytes)} bytes`));
      assert.ok(memoryRowSpoken(row).includes(fmtInt(row.bytes)));
    }
  });
  it('the alarm is the worked example: one second, one channel, 192,000 bytes; the wind has two channels', () => {
    const alarm = memoryRow('alarm', 'a', 'f', gaSound('alarm')!);
    assert.deepEqual([alarm.seconds, alarm.sr, alarm.channels, alarm.bytes], [1, 48_000, 1, 192_000]);
    assert.equal(alarm.sum, '48,000 samples × 4 bytes × 1 channel = 192,000 bytes');
    const wind = memoryRow('amb_yard', 'a', 'f', gaSound('amb_yard')!);
    assert.deepEqual([wind.seconds, wind.channels], [10, 2]);
    assert.ok(wind.sum.includes('× 2 channels ='));
    assert.ok(G17.tryThis.join(' ').includes('192,000 bytes'));
  });
});

describe('page 17 — what the budget does, as the page and its guide say it', () => {
  it('an empty scene, budget 8, burst 12: four impacts are stolen, the oldest first', () => {
    const s = run(gaInitial(), { type: 'voiceLimit', limit: 8 }, { type: 'burst', count: 12 });
    assert.equal(gaFact(s, 'stolen'), 4);
    assert.equal(gaFact(s, 'refused'), 0);
    assert.equal(gaVoiceCount(s), 8);
  });
  it('with the scene and the generator running, the least important voices go first', () => {
    const before = run(gaInitial(), { type: 'voiceLimit', limit: 8 }, { type: 'scene', on: true }, { type: 'machine', id: 'generator-1', on: true });
    assert.equal(gaVoiceCount(before), 5);
    const s = run(before, { type: 'burst', count: 12 });
    const stolen = texts(s, before.logN).filter((t) => t.startsWith('voice STOLEN from')).map((t) => t.replace(/^voice STOLEN from (.+?) \(.*$/, '$1'));
    assert.deepEqual(stolen, ['Room tone', 'Courtyard wind', 'Fountain', 'Generator', 'Generator', 'Crate impact', 'Crate impact', 'Crate impact', 'Crate impact']);
    assert.equal(gaVoiceCount(s), 8);
    assert.equal(s.machines[0].on, false, 'the generator lost both voices, so it reads as off');
    assert.equal(gaFact(s, 'alarmSurvivedBurst'), 0, 'no alarm, no survival');
  });
  it('the alarm on, budget 1, burst 12: every impact is refused and the alarm stays', () => {
    const before = run(gaInitial(), { type: 'alarm', on: true }, { type: 'voiceLimit', limit: 1 });
    const s = run(before, { type: 'burst', count: 12 });
    assert.equal(gaFact(s, 'refused'), 12);
    assert.equal(gaVoiceCount(s), 1);
    assert.ok(gaPlaying(s, 'alarm'));
    assert.equal(gaFact(s, 'alarmSurvivedBurst'), 1);
    assert.ok(texts(s).some((t) => t.includes('REFUSED: the one voice is in use')));
  });
  it('the budget does not go below the protected voices sounding, and the page knows when it is held', () => {
    let s = run(gaInitial(), { type: 'voiceLimit', limit: 8 }, { type: 'alarm', on: true }, { type: 'post', event: 'vo_warning', owner: 'guide' });
    assert.equal(protectedSounding(s), 2);
    assert.ok(budgetHeld(s, 1) && !budgetHeld(s, 2) && !budgetHeld(s, 0));
    s = run(s, { type: 'voiceLimit', limit: 1 });
    assert.equal(s.voiceLimit, 2);
    assert.equal(gaFact(s, 'limitHeldByProtected'), 1);
    assert.ok(texts(s).some((t) => t.includes('the budget stays at 2')));
    s = run(s, { type: 'burst', count: 12 });
    assert.equal(gaFact(s, 'refused'), 12);
    assert.equal(gaVoiceCount(s), 2);
    // the alarm alone: one protected voice, so a budget of 1 is accepted
    const one = run(gaInitial(), { type: 'alarm', on: true });
    assert.ok(!budgetHeld(one, 1));
    assert.equal(run(one, { type: 'voiceLimit', limit: 1 }).voiceLimit, 1);
    assert.ok(G17.changes.join(' ').includes('does not go below the protected voices'));
  });
  it('the alarm and the warning line keep their voices through a burst at budget 8', () => {
    const before = run(gaInitial(), { type: 'voiceLimit', limit: 8 }, { type: 'alarm', on: true }, { type: 'post', event: 'vo_warning', owner: 'guide' });
    const s = run(before, { type: 'burst', count: 12 });
    assert.ok(gaPlaying(s, 'alarm') && gaPlaying(s, 'vo_warning'));
    assert.ok(gaFact(s, 'stolen') > 0);
    assert.equal(gaFact(s, 'alarmSurvivedBurst'), 1);
  });
  it('"the alarm survived" is not granted without the alarm, or without a full budget', () => {
    const survived = (s: GaState) => gaFact(s, 'alarmSurvivedBurst');
    // no alarm
    assert.equal(survived(run(gaInitial(), { type: 'voiceLimit', limit: 8 }, { type: 'burst', count: 12 })), 0);
    // the alarm, but room for everything
    assert.equal(survived(run(gaInitial(), { type: 'voiceLimit', limit: 0 }, { type: 'alarm', on: true }, { type: 'burst', count: 12 })), 0);
    // the alarm started only after the burst
    assert.equal(survived(run(gaInitial(), { type: 'voiceLimit', limit: 8 }, { type: 'burst', count: 12 }, { type: 'alarm', on: true })), 0);
  });
});

/* ── 18 · multiplayer ───────────────────────────────────────────────────── */

describe('page 18 — action ids', () => {
  it('starts at A1 and never hands out an id the scene has handled', () => {
    assert.equal(nextNetId([]), 'A1');
    assert.equal(nextNetId(['A1', 'A2']), 'A3');
    assert.equal(nextNetId(['A7', 'x', 'A2', 'B9']), 'A8');
    let s = gaInitial();
    const ids: string[] = [];
    for (let i = 0; i < 4; i++) {
      const id = nextNetId(s.netSeen);
      ids.push(id);
      s = run(s, { type: 'net', id, what: 'door', to: 'world' });
    }
    assert.deepEqual(ids, ['A1', 'A2', 'A3', 'A4']);
    assert.equal(gaFact(s, 'netDuplicateIgnored'), 0);
  });
});

describe('page 18 — one message on two machines', () => {
  const sends: NetSend[] = [
    { id: 'A1', what: 'door', to: 'world' },
    { id: 'A1', what: 'alert', to: 'me' },
    { id: 'A1', what: 'alert', to: 'them' },
  ];
  /** Did this machine start a sound for the message? */
  const played = (prev: GaState, next: GaState) => gaFact(next, 'inst:door_open') + gaFact(next, 'inst:ui_confirm') > gaFact(prev, 'inst:door_open') + gaFact(prev, 'inst:ui_confirm');

  it('"here" is exactly what the reducer does, first time and repeated, check on and off', () => {
    for (const send of sends) {
      for (const idCheck of [true, false]) {
        const s0 = run(gaInitial(), { type: 'option', patch: { dedupe: idCheck } });
        const first = netOutcome(send, false, idCheck);
        const s1 = run(s0, { type: 'net', ...send });
        assert.equal(played(s0, s1), first.here === 'plays', `${send.to} first, check ${idCheck}`);
        assert.equal(first.second, false);
        const again = netOutcome(send, true, idCheck);
        const s2 = run(s1, { type: 'net', ...send });
        assert.equal(played(s1, s2), again.here === 'plays', `${send.to} again, check ${idCheck}`);
        assert.equal(gaFact(s2, 'netDuplicateIgnored') === 1, again.here === 'ignored');
        assert.equal(again.second, !idCheck);
        // the model's double is one that PLAYED here: never for the other player's alert
        assert.equal(gaFact(s2, 'netDoublePlayed') === 1, !idCheck && send.to !== 'them', `${send.to} double, check ${idCheck}`);
        assert.equal(gaFact(s1, 'netDoublePlayed'), 0);
      }
    }
  });
  it('the other machine is the same rule from its side', () => {
    assert.deepEqual(netOutcome(sends[0], false, true), { here: 'plays', there: 'plays', second: false });
    assert.deepEqual(netOutcome(sends[1], false, true), { here: 'plays', there: 'nothing', second: false });
    assert.deepEqual(netOutcome(sends[2], false, true), { here: 'nothing', there: 'plays', second: false });
    assert.deepEqual(netOutcome(sends[0], true, true), { here: 'ignored', there: 'ignored', second: false });
    assert.deepEqual(netOutcome(sends[0], true, false), { here: 'plays', there: 'plays', second: true });
  });
  it('the card’s words name the id, the action and who it is for', () => {
    assert.equal(netMessageWords(sends[0]), 'A1 · door opened · for the world');
    assert.equal(netMessageWords(sends[2]), 'A1 · alert · for the other player only');
    assert.match(netEffectWords(sends[0], 'ignored', false), /A1 was already handled/);
    assert.match(netEffectWords(sends[0], 'plays', true), /SECOND time/);
    assert.match(netEffectWords(sends[1], 'plays', false), /alert cue/);
    assert.match(netEffectWords(sends[2], 'nothing', false), /Plays nothing/);
  });
  it('a NEW door action moves the door and plays its sound; a repeat handled a second time plays the sound and moves nothing', () => {
    const send = sends[0];
    const s0 = clean();
    assert.equal(s0.doorOpen, false);
    const s1 = run(s0, { type: 'net', ...send });
    assert.equal(s1.doorOpen, true, 'the new action opened the door');
    assert.equal(gaFact(s1, 'inst:door_open') - gaFact(s0, 'inst:door_open'), 1);
    // the same id again, check on: ignored, nothing moves, nothing plays
    const s2 = run(s1, { type: 'net', ...send });
    assert.equal(s2.doorOpen, true);
    assert.equal(gaFact(s2, 'inst:door_open'), gaFact(s1, 'inst:door_open'));
    // check off: the sound a second time, the door where it was
    const s3 = run(s2, { type: 'option', patch: { dedupe: false } }, { type: 'net', ...send });
    assert.equal(s3.doorOpen, true, 'a repeat does not move the door');
    assert.equal(gaFact(s3, 'inst:door_open') - gaFact(s2, 'inst:door_open'), 1);
    assert.equal(gaFact(s3, 'netDoublePlayed') - gaFact(s2, 'netDoublePlayed'), 1);
    // a second NEW action closes it again
    assert.equal(run(s3, { type: 'net', id: 'A2', what: 'door', to: 'world' }).doorOpen, false);
    // the card says the same
    assert.equal(netEffectWords(send, 'plays', false), 'Moves the door and plays its sound, placed for its own listener.');
    assert.equal(netEffectWords(send, 'plays', true), 'Plays the door sound a SECOND time: a double. The door does not move again.');
  });
  it('the log lines the page quotes are the reducer’s', () => {
    const send = sends[0];
    let s = run(gaInitial(), { type: 'net', ...send }, { type: 'net', ...send });
    assert.ok(texts(s).some((t) => t.includes('already handled, ignored')));
    s = run(s, { type: 'option', patch: { dedupe: false } }, { type: 'net', ...send });
    assert.ok(texts(s).includes('SETTING network id check: OFF'));
    assert.ok(texts(s).some((t) => t.endsWith('handled a SECOND time')));
    s = run(s, { type: 'net', id: 'A2', what: 'alert', to: 'them' }, { type: 'net', id: 'A3', what: 'alert', to: 'me' });
    assert.equal(gaFact(s, 'netPrivateOther'), 1);
    assert.equal(gaFact(s, 'netPrivateMe'), 1);
    assert.ok(texts(s).some((t) => t.includes('nothing plays here')));
  });
});

/* ── 19 · the fault bench ───────────────────────────────────────────────── */

type Run = { s: GaState; b: Bench };
/** Drive the scene AND the bench, one change at a time, as the page does. */
function drive(r: Run, ...actions: GaAction[]): Run {
  let { s, b } = r;
  for (const a of actions) {
    const next = gaReduce(s, a).state;
    b = benchAdvance(b, s, next);
    s = next;
  }
  return { s, b };
}
/** A page-19 visit: the clean scene, an empty bench. */
const open = (s: GaState = clean()): Run => ({ s, b: benchStart(s) });
const plant = (r: Run, id: FaultId): Run => drive(r, ...faultActions(id, true));
const repair = (r: Run, id: FaultId): Run => drive(r, ...faultActions(id, false));

/** The actions that make each fault's symptom happen FROM THE CLEAN SCENE,
 *  each one a chip of page 19's TEST tray (door key, GENERATOR 1, GUIDE
 *  LINE, STEP · GUIDE, ADD GENERATOR 2, GENERATOR 2, REMOVE GENERATOR 2). */
const REPRODUCE: Record<FaultId, GaAction[]> = {
  missingFile: [{ type: 'door' }],
  wrongBus: [{ type: 'machine', id: 'generator-1', on: true }, { type: 'post', event: 'vo_greeting', owner: 'guide' }],
  repeat: [{ type: 'step', who: 'guide' }, { type: 'step', who: 'guide' }, { type: 'step', who: 'guide' }],
  scope: [{ type: 'step', who: 'guide' }],
  orphan: [{ type: 'addMachine' }, { type: 'machine', id: 'generator-2', on: true }, { type: 'removeMachine', id: 'generator-2' }],
};

describe('page 19 — five faults, each one wrong setting', () => {
  it('there are five, in the brief’s order, each with a title, a symptom, hints and a reason', () => {
    assert.deepEqual([...FAULT_IDS], ['missingFile', 'wrongBus', 'repeat', 'scope', 'orphan']);
    FAULTS.forEach((f, i) => {
      assert.ok(f.title.startsWith(`FAULT ${i + 1} · `), f.title);
      assert.ok(f.goal.startsWith(`Fault ${i + 1} fixed`), f.goal);
      assert.ok(f.symptom.startsWith('Start the fault.'), `${f.id}: says how to reproduce it`);
      assert.ok(f.hints.length >= 2 && f.hints.length <= 3);
      assert.ok(f.why.length > 80);
      assert.equal(new Set(f.hints).size, f.hints.length);
      const choices = fixChoices(f);
      assert.deepEqual(choices.map((c) => c.label).sort(), [f.right, f.wrong].sort());
      assert.equal(choices.filter((c) => c.right).length, 1);
    });
    // the right value is not always in the same place in the FIX tray
    assert.equal(new Set(FAULTS.map((f) => fixChoices(f)[0].right)).size, 2);
  });
  it('the learner text keeps the house rules', () => {
    for (const f of FAULTS) {
      const t = [f.title, f.goal, f.symptom, ...f.hints, f.why, f.setting, f.right, f.wrong].join('\n');
      assert.ok(!/\b(colour|behaviour|centre|metre|programme|organis|recognis|grey)\b/i.test(t), `${f.id}: US spelling`);
      assert.ok(!/\b(must|always|never)\b/i.test(t), `${f.id}: no dogma words`);
      assert.ok(!/you(’|')ll (master|build|mix|be able)|you will (master|be able to)/i.test(t), `${f.id}: knowledge, not skills`);
      assert.ok(!/locali[sz]ation/i.test(t));
    }
  });
  it('a clean scene has nothing planted, nothing open, nothing fixed', () => {
    const r = open();
    assert.equal(settingsWrong(r.s), 0);
    assert.equal(faultsOpen(r.b, r.s), 0);
    for (const id of FAULT_IDS) assert.ok(!faultSet(id, r.s) && !faultOpen(id, r.b, r.s) && !faultFixed(id, r.b, r.s));
  });
  it('each fault: planted → its symptom really happens → the setting put right = FIXED', () => {
    for (const id of FAULT_IDS) {
      let r = plant(open(), id);
      assert.ok(faultSet(id, r.s) && faultOpen(id, r.b, r.s), `${id}: planted`);
      assert.equal(settingsWrong(r.s), 1, `${id} is ONE wrong setting`);
      assert.equal(r.b[id].seen, 0);
      r = drive(r, ...REPRODUCE[id]);
      assert.ok(r.b[id].seen >= FAULTS.find((f) => f.id === id)!.need, `${id}: the symptom was seen`);
      assert.ok(!faultFixed(id, r.b, r.s), `${id}: seen is not fixed`);
      r = repair(r, id);
      assert.ok(!faultSet(id, r.s));
      if (id === 'orphan') {
        assert.ok(!faultFixed(id, r.b, r.s), 'the stray loop is still playing');
        r = drive(r, { type: 'stopAll' });
      }
      assert.ok(faultFixed(id, r.b, r.s), `${id}: fixed`);
      // no other fault was touched
      for (const other of FAULT_IDS) if (other !== id) assert.ok(!faultFixed(other, r.b, r.s) && r.b[other].seen === 0, `${id} does not count for ${other}`);
    }
  });
  it('starting a fault and switching it straight back fixes nothing', () => {
    for (const id of FAULT_IDS) {
      const r = repair(plant(open(), id), id);
      assert.ok(r.b[id].planted && !faultFixed(id, r.b, r.s), id);
    }
  });
  it('the same actions with the setting RIGHT are not a symptom', () => {
    for (const id of FAULT_IDS) {
      const r = drive(open(), ...REPRODUCE[id]);
      assert.equal(r.b[id].seen, 0, id);
      assert.ok(!r.b[id].planted);
    }
  });
  it('fault 1: the log names the file, and after the repair the door starts', () => {
    let r = drive(plant(open(), 'missingFile'), { type: 'door' });
    assert.ok(texts(r.s).some((t) => t.includes('"door_open_v2.wav" is NOT IN THE BUILD')));
    assert.equal(FAULTS[0].wrong, 'door_open_v2.wav');
    assert.equal(FAULTS[0].right, 'door_open.wav');
    // only the door layer is lost: the rattle still starts, as the card says
    assert.ok(texts(r.s).some((t) => t.startsWith('START') && t.includes('Door · rattle')));
    assert.ok(!texts(r.s).some((t) => t.startsWith('START') && t.includes('Door · door')));
    assert.match(FAULTS[0].symptom, /Only the latch rattle plays/);
    const n = r.s.logN;
    r = drive(repair(r, 'missingFile'), { type: 'door' });
    assert.ok(texts(r.s, n).some((t) => t.startsWith('START') && t.includes('Door · door')));
  });
  it('fault 2: the line goes to the sfx bus and nothing ducks; planting it switches the duck on', () => {
    let r = open(run(gaInitial(), { type: 'option', patch: { duck: false } }));
    r = drive(plant(r, 'wrongBus'), ...REPRODUCE.wrongBus);
    assert.ok(r.s.options.duck, 'a known situation: the duck is on');
    assert.ok(texts(r.s).some((t) => t.includes('Guide: greeting') && t.endsWith('→ sfx bus')));
    assert.equal(gaFact(r.s, 'duck'), 0);
    assert.ok(!texts(r.s).some((t) => t.startsWith('DUCK on')));
    // the repair, then the SAME action again from a quiet scene: now it ducks
    r = drive(repair(r, 'wrongBus'), { type: 'stopAll' });
    const ducksBefore = gaFact(r.s, 'duck');
    const n = r.s.logN;
    r = drive(r, { type: 'post', event: 'vo_greeting', owner: 'guide' });
    assert.equal(gaFact(r.s, 'duck'), ducksBefore + 1);
    assert.ok(texts(r.s, n).some((t) => t.startsWith('DUCK on')));
    assert.ok(texts(r.s, n).some((t) => t.includes('Guide: greeting') && t.endsWith('→ dialogue bus')));
    assert.ok(faultFixed('wrongBus', r.b, r.s));
  });
  it('fault 3: every step names take 1, and two steps are not yet a pattern', () => {
    let r = drive(plant(open(), 'repeat'), { type: 'step', who: 'guide' }, { type: 'step', who: 'guide' });
    assert.equal(r.b.repeat.seen, 2);
    assert.ok(!faultFixed('repeat', repair(r, 'repeat').b, repair(r, 'repeat').s));
    r = drive(r, { type: 'step', who: 'player' });
    const starts = texts(r.s).filter((t) => t.startsWith('START') && t.includes('Footstep'));
    assert.equal(starts.length, 3);
    for (const t of starts) assert.ok(t.includes('take 1 of 4'), t);
    r = repair(r, 'repeat');
    assert.ok(r.s.options.variation && faultFixed('repeat', r.b, r.s));
  });
  it('fault 4: the guide’s step uses YOUR surface, and cannot show when you share a surface', () => {
    let r = drive(plant(open(), 'scope'), { type: 'step', who: 'guide' });
    assert.ok(texts(r.s).some((t) => t === 'TRIGGER foot contact · guide · SWITCH surface = stone'));
    assert.equal(r.b.scope.seen, 1);
    // both indoors on wood: the fault is in, but no symptom can be seen
    r = drive(open(), { type: 'door' }, { type: 'move', who: 'player', x: 11, y: 5 });
    r = drive(plant(r, 'scope'), { type: 'step', who: 'guide' });
    assert.equal(r.b.scope.seen, 0);
    assert.ok(!faultFixed('scope', repair(r, 'scope').b, repair(r, 'scope').s));
  });
  it('fault 5: the loop plays on with no owner until it is stopped; adding and removing again also stops it', () => {
    let r = drive(plant(open(), 'orphan'), ...REPRODUCE.orphan);
    assert.equal(strayLoops(r.s).length, 1);
    assert.ok(texts(r.s).some((t) => t.includes('ORPHAN')));
    assert.ok(r.s.inst.length > 0, 'PLAYING still counts it');
    r = repair(r, 'orphan');
    assert.ok(faultOpen('orphan', r.b, r.s) && !faultFixed('orphan', r.b, r.s));
    r = drive(r, { type: 'addMachine' }, { type: 'removeMachine', id: 'generator-2' });
    assert.equal(strayLoops(r.s).length, 0);
    assert.ok(faultFixed('orphan', r.b, r.s));
  });
  it('all five can be in at once and repaired one by one', () => {
    let r = open();
    for (const id of FAULT_IDS) r = plant(r, id);
    assert.equal(settingsWrong(r.s), 5);
    r = drive(r, { type: 'door' }, { type: 'post', event: 'vo_greeting', owner: 'guide' }, ...REPRODUCE.repeat, ...REPRODUCE.orphan);
    for (const id of FAULT_IDS) r = repair(r, id);
    r = drive(r, { type: 'stopAll' });
    for (const id of FAULT_IDS) assert.ok(faultFixed(id, r.b, r.s), id);
  });
  it('a fault left in on another page is not this visit’s: the page opens with the settings reset', () => {
    // the first state a page sees can still hold the old setting; the reset follows at once
    let r = open(run(gaInitial(), { type: 'fault', patch: { missingDoor: true } }, { type: 'option', patch: { variation: false } }));
    for (const id of FAULT_IDS) assert.ok(!r.b[id].planted, id);
    r = drive(r, { type: 'enterPage' });
    assert.equal(settingsWrong(r.s), 0);
    for (const id of FAULT_IDS) assert.ok(!r.b[id].planted && !faultOpen(id, r.b, r.s), id);
    // the same door action is now healthy, and counts for nothing
    r = drive(r, { type: 'door' });
    assert.equal(r.b.missingFile.seen, 0);
    // planted by the learner here, it counts
    r = drive(plant(r, 'missingFile'), { type: 'door' });
    assert.ok(r.b.missingFile.planted && r.b.missingFile.seen === 1);
  });
  it('a stray loop left by another page is gone when this page opens', () => {
    const left = run(gaInitial(), { type: 'fault', patch: { orphanLoop: true } }, ...REPRODUCE.orphan);
    assert.equal(strayLoops(left).length, 1);
    const r = drive({ s: left, b: benchStart(left) }, { type: 'enterPage' });
    assert.equal(strayLoops(r.s).length, 0);
    assert.equal(r.s.machines.length, 1);
    assert.ok(!faultOpen('orphan', r.b, r.s) && !faultFixed('orphan', r.b, r.s));
  });
  it('fault 5 on this page: adding generator 2 again takes the stray loop back, and the chip reads ON', () => {
    let r = repair(drive(plant(open(), 'orphan'), ...REPRODUCE.orphan), 'orphan');
    assert.equal(strayLoops(r.s).length, 1);
    r = drive(r, { type: 'addMachine' });
    assert.equal(r.s.machines.find((m) => m.id === 'generator-2')?.on, true);
    assert.equal(strayLoops(r.s).length, 0);
    assert.ok(faultFixed('orphan', r.b, r.s));
  });
  it('fault 4 can be shown from anywhere: STONE PATH and WORKSHOP, through the door', () => {
    const go = (r: Run, to: 'path' | 'workshop'): { r: Run; blocked: boolean } => {
      const m = standMoves(r.s.chars.player, r.s.doorOpen, to);
      return { r: drive(r, ...m.moves), blocked: m.blocked };
    };
    let r = open();
    assert.equal(standingOn(r.s), 'path');
    // the door is closed: WORKSHOP walks YOU to the door and says so
    let step = go(r, 'workshop');
    assert.ok(step.blocked);
    assert.equal(surfaceAt(step.r.s.chars.player), 'stone');
    // open the door, choose again: YOU stand on the wood floor
    step = go(drive(step.r, { type: 'door' }), 'workshop');
    assert.ok(!step.blocked);
    assert.equal(standingOn(step.r.s), 'workshop');
    // both on wood: the fault is in but cannot show
    r = drive(plant(step.r, 'scope'), { type: 'step', who: 'guide' });
    assert.equal(r.b.scope.seen, 0);
    // YOU wander off inside, then the door is closed: STONE PATH is blocked until it is opened
    r = drive(r, { type: 'step', who: 'player' }, { type: 'step', who: 'player' }, { type: 'door' });
    step = go(r, 'path');
    assert.ok(step.blocked && surfaceAt(step.r.s.chars.player) === 'wood');
    step = go(drive(step.r, { type: 'door' }), 'path');
    assert.ok(!step.blocked);
    assert.equal(standingOn(step.r.s), 'path');
    // now the guide's step uses YOUR surface: the symptom
    r = drive(step.r, { type: 'step', who: 'guide' });
    assert.equal(r.b.scope.seen, 1);
    assert.ok(texts(r.s).includes('TRIGGER foot contact · guide · SWITCH surface = stone'));
    assert.ok(faultFixed('scope', repair(r, 'scope').b, repair(r, 'scope').s));
    // from the gravel (neither chip is marked) the same holds
    r = drive(open(), { type: 'move', who: 'player', x: 4.2, y: 7.5 });
    assert.equal(standingOn(r.s), null);
    r = drive(plant(r, 'scope'), { type: 'step', who: 'guide' });
    assert.equal(r.b.scope.seen, 1);
  });
  it('no fault names itself when it starts: all five go in with no log line', () => {
    for (const id of FAULT_IDS) {
      const r = plant(open(), id);
      assert.ok(faultSet(id, r.s), id);
      assert.equal(r.s.log.length, 0, `${id}: planting prints nothing`);
    }
    // fault 3 is an option planted quietly: the fact is still counted
    const planted = plant(open(), 'repeat');
    assert.equal(gaFact(planted.s, 'option:variation:false'), 1);
    assert.deepEqual(faultActions('repeat', true), [{ type: 'option', patch: { variation: false }, quiet: true }]);
    // the learner's own repair is a normal, logged change
    const repaired = repair(planted, 'repeat');
    assert.deepEqual(texts(repaired.s), ['SETTING variation (use every take): ON']);
    assert.deepEqual(faultActions('repeat', false), [{ type: 'option', patch: { variation: true } }]);
    // the hints point at what can be observed, not at a log line about the setting
    assert.ok(!FAULTS[2].hints.some((h) => /SETTING/.test(h)));
    assert.ok(FAULTS[2].hints.some((h) => h.includes('take number does not change')));
  });
});

/* ── the four pages' lesson text ────────────────────────────────────────── */

describe('chapter 5 — lesson text', () => {
  const PAGES = ['p16Mix', 'p17Budgets', 'p18Multiplayer', 'p19Testing'];
  const src = (p: string) => readFileSync(new URL(`../src/screens/lab/gameaudio/pages/${p}.tsx`, import.meta.url), 'utf8').replace(/\r\n/g, '\n');
  /** The words inside <P>, <Look>, <Do> and <Note> in the five steps. */
  const lesson = (p: string): string => [...src(p).matchAll(/<(P|Look|Do|Note)(?: [^>]*)?>([\s\S]*?)<\/\1>/g)].map((m) => m[2].replace(/\{[^}]*\}/g, 'x')).join(' ');
  it('each page’s steps stay short (the review round added required sentences: up to 380 words)', () => {
    for (const p of PAGES) {
      const n = lesson(p).trim().split(/\s+/).length;
      assert.ok(n >= 150 && n <= 380, `${p}: ${n} words`);
    }
  });
  it('the fix round’s shared wording rules hold in the pages, their guides and their data', () => {
    const files = [
      ...PAGES.map((p) => `pages/${p}.tsx`),
      ...['16', '17', '18', '19'].map((n) => `pages/guides/p${n}.ts`),
      ...['gaMix', 'gaBudget', 'gaNet', 'gaFaults'].map((d) => `pages/data/${d}.ts`),
    ];
    for (const f of files) {
      const t = readFileSync(new URL(`../src/screens/lab/gameaudio/${f}`, import.meta.url), 'utf8')
        .replace(/\r\n/g, '\n')
        .replace(/\/\*[\s\S]*?\*\//g, '')
        .replace(/^\s*\/\/.*$/gm, '');
      assert.ok(!/\bat once\b/i.test(t), `${f}: "at once"`);
      assert.ok(!/\brecording/i.test(t), `${f}: a made-in-the-app sound is not a recording`);
      assert.ok(!/\becho\b/i.test(t), `${f}: "echo" for a network copy`);
      assert.ok(!/\bENGINE [12]\b|'ENGINE'|START 1/.test(t), `${f}: the generator is GENERATOR 1 / GENERATOR 2`);
      assert.ok(!/tick themselves|is bound to|\bround the\b/i.test(t), `${f}: house wording`);
      assert.ok(!/SOUND turns the lab’s sound on or off/.test(t), `${f}: the SOUND line stays on page 1’s guide`);
    }
  });
  it('dock values and readout labels are seven letters or fewer', () => {
    for (const p of PAGES) {
      const s = src(p);
      for (const m of s.matchAll(/(?:valueLabel|\bk): [^,\n]*?'([^'$]+)'/g)) assert.ok(m[1].length <= 8 && (m[1].length <= 7 || m[1] === 'ID CHECK'), `${p}: "${m[1]}"`);
    }
  });
  it('no dogma words in the lesson text', () => {
    for (const p of PAGES) assert.ok(!/\b(must|always|never)\b/i.test(lesson(p)), p);
  });
  it('each page has five steps, one common mistake, a check with a line for every wrong answer, and three keys of its own', () => {
    for (const p of PAGES) {
      const s = src(p);
      for (const n of [1, 2, 3, 4, 5]) assert.equal(s.split(`<Step n={${n}}>`).length - 1, 1, `${p}: step ${n}`);
      assert.equal(s.split('<Note tone="mistake">').length - 1, 1, `${p}: one common mistake`);
      assert.ok(/wrong=\{\[\s*undefined,\s*'[^']+',\s*'[^']+',\s*'[^']+',\s*\]\}/.test(s), `${p}: a line for each wrong answer`);
      const keys = s.match(/keys: \[([^\]]+)\]/);
      assert.ok(keys && keys[1].split(',').length === 3, `${p}: three keys`);
      assert.ok(!/useEffect\([^)]*gaDispatch/.test(s), `${p}: nothing is dispatched on mount`);
    }
  });
});
