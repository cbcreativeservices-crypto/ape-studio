/**
 * Game Audio lab — chapter 5's pure files (pages/data/gaMix, gaBudget, gaNet,
 * gaFaults), proven against the lab's own reducer with no device:
 *
 *   16 The game mix      the bus lane, the words for a bus, the duck's amounts
 *   17 Budgets           the BUDGET stops, the memory arithmetic, the counts
 *                        the page and its guide quote, "the alarm survived"
 *   18 Multiplayer       action IDs, one message on two machines, SENT and
 *                        ARRIVING 0.25 s later, a double really heard here
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
import { GA_BUS_NAME, GA_DUCK_DB, GA_NET_DELAY_S } from '../src/screens/lab/gameaudio/model/gaDefs.ts';
import { gaFact, gaInitial, gaPlaying, gaReduce, gaStolenCount, gaVoiceCount, type GaAction, type GaState } from '../src/screens/lab/gameaudio/model/gaModel.ts';
import { surfaceAt } from '../src/screens/lab/gameaudio/model/gaWorld.ts';
import { gaAsset, gaSound, gaSoundBytes } from '../src/screens/lab/gameaudio/sounds/gaSoundBank.ts';
import {
  BUDGET_STOPS,
  BURST_COUNT,
  MEMORY_IDS,
  budgetHeld,
  budgetShort,
  budgetStep,
  budgetToLane,
  budgetWords,
  burstSpoken,
  burstTheftWords,
  decodedBytes,
  fmtInt,
  laneToBudget,
  lastBurst,
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
  faultStatus,
  faultsOpen,
  fixChoices,
  nextFault,
  settingsWrong,
  standMoves,
  standingOn,
  stepInPlace,
  strayLoops,
  type Bench,
  type FaultId,
} from '../src/screens/lab/gameaudio/pages/data/gaFaults.ts';
import { BUS_DB_MAX, BUS_DB_MIN, BUS_LANE_HOME, MIX_BUSES, SIGNAL_PATH, busNow, busNowSpoken, busNowWord, dbToLane, duckWords, fmtDb, laneToDb, lineSpeaking, mixBus, signalPathSpoken } from '../src/screens/lab/gameaudio/pages/data/gaMix.ts';
import { netArrivalOutcome, netCheckAtArrival, netFlightKey, netEffectWords, netMemoryAdvance, netMemoryStart, netMessageWords, netOutcome, newestFlight, nextNetId, type NetSend } from '../src/screens/lab/gameaudio/pages/data/gaNet.ts';
import { G16 } from '../src/screens/lab/gameaudio/pages/guides/p16.ts';
import { G17 } from '../src/screens/lab/gameaudio/pages/guides/p17.ts';
import { G18 } from '../src/screens/lab/gameaudio/pages/guides/p18.ts';

/** Run actions through the real reducer (sound off: the model works unheard). */
function run(s: GaState, ...actions: GaAction[]): GaState {
  let out = s;
  for (const a of actions) out = gaReduce(out, a).state;
  return out;
}
const texts = (s: GaState, from = 0) => s.log.filter((l) => l.n > from).map((l) => l.text);
/** The START lines (the START column; the text no longer repeats the word). */
const starts = (s: GaState, from = 0) => s.log.filter((l) => l.n > from && l.kind === 'start').map((l) => l.text);
/** Move the scene clock on (the store ticks by itself: a network action lands). */
const tick = (s: GaState, by: number): GaState => gaReduce(s, { type: 'tick', t: s.t + by }).state;
/** End every one-shot that is playing, as its timer or the engine would. */
function endOneShots(s: GaState, by = 3): GaState {
  let out = tick(s, by);
  for (const v of out.voices.filter((x) => !x.loop)) out = gaReduce(out, { type: 'expire', v: v.v }).state;
  return out;
}
/** The scene a page opens on (GaRack sends `enterPage` when it mounts). */
const clean = (from: GaState = gaInitial()): GaState => gaReduce(from, { type: 'enterPage' }).state;

/* ── 16 · the game mix ──────────────────────────────────────────────────── */

describe('page 16 — the bus lane and the words for a bus', () => {
  it('every bus has ONE name, the model’s, on the controls and in the log; a readout label fits', () => {
    assert.deepEqual(MIX_BUSES.map((b) => b.id).sort(), [...GA_BUSES].sort());
    for (const b of MIX_BUSES) {
      assert.equal(b.label, GA_BUS_NAME[b.id], `${b.id}: the chooser says what the log says`);
      assert.ok(b.readout.length <= 7, `${b.id}: its readout label keeps its value (${b.readout})`);
      assert.ok(b.code.length <= 5, `${b.id}: a narrow meter's code`);
      // the apologies for the log's developer ids are gone (L-03): the log says EFFECTS now
      assert.ok(!/calls it|\bsfx\b|\bui\b/.test(b.carries), `${b.id}: ${b.carries}`);
    }
    const s = run(gaInitial(), { type: 'bus', bus: 'sfx', db: -6 }, { type: 'bus', bus: 'ui', mute: true });
    assert.ok(texts(s).includes('BUS EFFECTS: −6 dB'), 'a true minus, as every other number in the lab (GA2 B-15)');
    assert.ok(texts(s).some((t) => t.startsWith('BUS INTERFACE:') && t.includes('MUTED')));
    assert.ok(!texts(s).some((t) => /\b(sfx|ui)\b/.test(t)));
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
  it('page 16 step 2 as written: the guide’s line ducks and lets go; the chat line ducks nothing; a quiet bus still plays', () => {
    let s = run(clean(), { type: 'scene', on: true }, { type: 'machine', id: 'generator-1', on: true }, { type: 'musicStart' });
    const n = s.logN;
    s = run(s, { type: 'post', event: 'vo_greeting', owner: 'guide' });
    assert.ok(lineSpeaking(s), 'DUCK reads DUCKING');
    assert.ok(texts(s, n).includes('DUCK on: a line is speaking. Music, ambience and effects turn down'));
    s = endOneShots(s);
    assert.ok(!lineSpeaking(s), 'DUCK reads READY again');
    assert.ok(texts(s, n).includes('DUCK off: the last line ended. The mix comes back'));
    const k = s.logN;
    s = run(s, { type: 'post', event: 'chat' });
    assert.ok(gaPlaying(s, 'chat') && !lineSpeaking(s));
    assert.ok(!texts(s, k).some((t) => t.startsWith('DUCK')));
    s = run(s, { type: 'bus', bus: 'sfx', db: -24 });
    assert.equal(busNowWord(s, 'sfx'), '−24 dB');
    assert.ok(gaPlaying(s, 'generator') && !busNow(s, 'sfx').silent);
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
  it('the signal path card names both paths (the control row is page 8’s four kinds), and the chat bus is a stand-in voice', () => {
    assert.deepEqual([...SIGNAL_PATH.audio], ['sound', 'its bus', 'master', 'output']);
    assert.deepEqual([...SIGNAL_PATH.control], ['trigger', 'switch', 'parameter', 'state']);
    assert.equal(
      signalPathSpoken(),
      'Signal path. Audio: sound, then its bus, then master, then output. Control: the game sends a trigger, a switch, a parameter or a state. Control tells the audio path what to do and carries no audio.',
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
    // the lane's value beside its name BUDGET (W2-30: "BUDGET: BUDGET: NO LIMIT")
    assert.equal(budgetWords(1), '1 VOICE');
    assert.equal(budgetWords(8), '8 VOICES');
    assert.equal(budgetWords(0), 'NO LIMIT');
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
  it('with the scene and the generator running: the least important voices go first, and NOTHING is switched off (decision 4)', () => {
    const before = run(clean(), { type: 'voiceLimit', limit: 8 }, { type: 'scene', on: true }, { type: 'machine', id: 'generator-1', on: true });
    assert.equal(gaVoiceCount(before), 5);
    const s = run(before, { type: 'burst', count: BURST_COUNT });
    const stolen = texts(s, before.logN)
      .filter((t) => t.startsWith('Voice STOLEN from'))
      .map((t) => t.replace(/^Voice STOLEN from (.+?) \(i\d+\).*$/, '$1'));
    assert.deepEqual(stolen, ['Room tone', 'Courtyard wind', 'Fountain', 'Generator · hum', 'Generator · fan', 'Crate impact · impact', 'Crate impact · impact', 'Crate impact · impact', 'Crate impact · impact']);
    assert.equal(gaFact(s, 'stolen') - gaFact(before, 'stolen'), 9);
    assert.equal(gaVoiceCount(s), 8);
    // the five loop voices are virtual and waiting; the generator and the scene are still ON
    assert.equal(gaStolenCount(s), 5);
    assert.equal(s.machines[0].on, true, 'the budget does not switch the generator off');
    assert.ok(gaPlaying(s, 'bed_room') && gaPlaying(s, 'bed_yard') && gaPlaying(s, 'fountain') && gaPlaying(s, 'generator'));
    assert.ok(texts(s, before.logN).some((t) => t.endsWith('It is a loop: VIRTUAL until a voice is free')));
    assert.ok(texts(s, before.logN).some((t) => t.endsWith('It is a one-shot: it stops')));
    assert.equal(gaFact(s, 'alarmSurvivedBurst'), 0, 'no alarm, no survival');
    // the impacts end: every loop has its voice again
    const after = endOneShots(s);
    assert.equal(gaStolenCount(after), 0);
    assert.equal(gaVoiceCount(after), 5);
    assert.equal(texts(after, s.logN).filter((t) => t.endsWith('has a voice again: no longer VIRTUAL')).length, 5);
  });
  it('the LAST BURST card reads the model’s own lines: in order, runs grouped, loops told from one-shots', () => {
    assert.equal(lastBurst([]), null);
    assert.match(burstSpoken(null), /No burst yet/);
    const before = run(clean(), { type: 'voiceLimit', limit: 8 }, { type: 'scene', on: true }, { type: 'machine', id: 'generator-1', on: true });
    const s = run(before, { type: 'burst', count: BURST_COUNT });
    const r = lastBurst(s.log)!;
    assert.deepEqual(r.thefts.map(burstTheftWords), [
      'Room tone · a loop: it went virtual',
      'Courtyard wind · a loop: it went virtual',
      'Fountain · a loop: it went virtual',
      'Generator · hum · a loop: it went virtual',
      'Generator · fan · a loop: it went virtual',
      'Crate impact · impact × 4 · one-shots: they stopped',
    ]);
    assert.equal(r.stolen, gaFact(s, 'stolen') - gaFact(before, 'stolen'));
    assert.equal(r.refused, 0);
    // a second burst starts a new card
    const again = run(s, { type: 'alarm', on: true }, { type: 'voiceLimit', limit: 1 }, { type: 'burst', count: BURST_COUNT });
    const r2 = lastBurst(again.log)!;
    assert.deepEqual([r2.stolen, r2.refused], [0, 12]);
    assert.match(burstSpoken(r2), /No voice was taken\. 12 new sounds were refused\./);
  });
  it('a bird call can be the first voice taken: STOLEN is then 10', () => {
    let s = run(clean(), { type: 'voiceLimit', limit: 8 }, { type: 'scene', on: true }, { type: 'machine', id: 'generator-1', on: true });
    s = gaReduce(s, { type: 'tick', t: s.birdAt! }).state;
    assert.ok(gaPlaying(s, 'bird'), 'a bird is calling');
    assert.equal(gaVoiceCount(s), 6);
    const n = gaFact(s, 'stolen');
    s = run(s, { type: 'burst', count: BURST_COUNT });
    assert.equal(gaFact(s, 'stolen') - n, 10);
    assert.equal(lastBurst(s.log)!.thefts[0].name, 'Bird');
  });
  it('a NEW loop refused a voice starts virtual and plays when a voice is free; lowering BUDGET is not counted as STOLEN', () => {
    let s = run(clean(), { type: 'alarm', on: true }, { type: 'voiceLimit', limit: 1 }, { type: 'machine', id: 'generator-1', on: true });
    assert.equal(s.machines[0].on, true);
    // refused a voice, not robbed of one: it WAITS (the model's word), it is not STOLEN
    const waits = (x: GaState) => x.voices.filter((v) => v.state === 'virtual' && v.waiting).length;
    assert.ok(gaPlaying(s, 'generator') && waits(s) === 2 && gaStolenCount(s) === 0 && gaVoiceCount(s) === 1);
    assert.ok(texts(s).some((t) => t.includes('has no voice yet: it WAITS (tracked, not played) and plays when a voice is free')));
    s = run(s, { type: 'voiceLimit', limit: 4 });
    assert.equal(gaVoiceCount(s), 3);
    assert.equal(waits(s), 0);
    // shedding: five loop voices, budget 2: three give up their voice, none of it STOLEN
    let w = run(clean(), { type: 'scene', on: true }, { type: 'machine', id: 'generator-1', on: true });
    const stolen0 = gaFact(w, 'stolen');
    const shed0 = gaFact(w, 'shed');
    w = run(w, { type: 'voiceLimit', limit: 2 });
    assert.equal(gaFact(w, 'stolen'), stolen0);
    assert.equal(gaFact(w, 'shed') - shed0, 3);
    assert.ok(w.machines[0].on && gaPlaying(w, 'bed_room'));
  });
  it('the alarm on, budget 1, burst 12: every impact is refused and the alarm stays', () => {
    const before = run(gaInitial(), { type: 'alarm', on: true }, { type: 'voiceLimit', limit: 1 });
    const s = run(before, { type: 'burst', count: 12 });
    assert.equal(gaFact(s, 'refused'), 12);
    assert.equal(gaVoiceCount(s), 1);
    assert.ok(gaPlaying(s, 'alarm'));
    assert.equal(gaFact(s, 'alarmSurvivedBurst'), 1);
    assert.ok(texts(s).some((t) => t.includes('REFUSED: the one voice is in use by a sound that is more important or protected')));
  });
  it('the budget does not go below the protected voices sounding, and the page knows when it is held', () => {
    let s = run(gaInitial(), { type: 'voiceLimit', limit: 8 }, { type: 'alarm', on: true }, { type: 'post', event: 'vo_warning', owner: 'guide' });
    assert.equal(protectedSounding(s), 2);
    assert.ok(budgetHeld(s, 1) && !budgetHeld(s, 2) && !budgetHeld(s, 0));
    s = run(s, { type: 'voiceLimit', limit: 1 });
    assert.equal(s.voiceLimit, 2);
    assert.equal(gaFact(s, 'limitHeldByProtected'), 1);
    assert.ok(texts(s).some((t) => t.includes('The budget stays at 2')));
    s = run(s, { type: 'burst', count: 12 });
    assert.equal(gaFact(s, 'refused'), 12);
    assert.equal(gaVoiceCount(s), 2);
    // the alarm alone: one protected voice, so a budget of 1 is accepted
    const one = run(gaInitial(), { type: 'alarm', on: true });
    assert.ok(!budgetHeld(one, 1));
    assert.equal(run(one, { type: 'voiceLimit', limit: 1 }).voiceLimit, 1);
    assert.ok(G17.changes.join(' ').includes('does not go below the protected voices'));
    // the guide's experiment: the alarm and the warning line, then BUDGET 1: it stays at 2
    assert.ok(G17.tryThis.join(' ').includes('It stays at 2, because two protected voices are playing'));
  });
  it('page 17 steps 2 and 3 as written: ALARM on at budget 8, BURST; then BUDGET 1, BURST: every impact REFUSED', () => {
    let s = run(clean(), { type: 'voiceLimit', limit: 8 }, { type: 'scene', on: true }, { type: 'machine', id: 'generator-1', on: true });
    s = endOneShots(run(s, { type: 'burst', count: BURST_COUNT }));
    const survived = gaFact(s, 'alarmSurvivedBurst');
    s = run(s, { type: 'alarm', on: true }, { type: 'burst', count: BURST_COUNT });
    assert.equal(gaFact(s, 'alarmSurvivedBurst') - survived, 1, 'goal 2');
    s = endOneShots(s);
    s = run(s, { type: 'voiceLimit', limit: 1 });
    assert.equal(s.voiceLimit, 1, 'one protected voice: a budget of 1 is accepted');
    const refused = gaFact(s, 'refused');
    s = run(s, { type: 'burst', count: BURST_COUNT });
    assert.equal(gaFact(s, 'refused') - refused, 12, 'every impact REFUSED');
    assert.ok(gaPlaying(s, 'alarm') && gaVoiceCount(s) === 1);
    assert.ok(s.machines[0].on, 'the generator is still on, its loop waiting');
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
      // the next ID is taken at once, even before this action has arrived
      s = run(s, { type: 'net', id, what: 'door', to: 'world' });
      assert.notEqual(nextNetId(s.netSeen), id);
      s = tick(s, GA_NET_DELAY_S);
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
  /** Send, then let it arrive (0.25 s later). */
  const deliver = (s: GaState, send: NetSend): GaState => tick(run(s, { type: 'net', ...send }), GA_NET_DELAY_S);
  /** Did this machine start a sound for the message? */
  const played = (prev: GaState, next: GaState) => gaFact(next, 'inst:door_open') + gaFact(next, 'inst:ui_confirm') > gaFact(prev, 'inst:door_open') + gaFact(prev, 'inst:ui_confirm');

  it('"here" is exactly what the reducer does, first time and repeated, check on and off', () => {
    for (const send of sends) {
      for (const idCheck of [true, false]) {
        const s0 = run(gaInitial(), { type: 'option', patch: { dedupe: idCheck } });
        const first = netOutcome(send, false, idCheck);
        const s1 = deliver(s0, send);
        assert.equal(played(s0, s1), first.here === 'plays', `${send.to} first, check ${idCheck}`);
        assert.equal(first.second, false);
        const again = netOutcome(send, true, idCheck);
        const s2 = deliver(s1, send);
        assert.equal(played(s1, s2), again.here === 'plays', `${send.to} again, check ${idCheck}`);
        assert.equal(gaFact(s2, 'netDuplicateIgnored') === 1, again.here === 'ignored');
        assert.equal(again.second, !idCheck);
        // the model's double is one that PLAYED here: never for the other player's alert
        assert.equal(gaFact(s2, 'netDoublePlayed') === 1, !idCheck && send.to !== 'them', `${send.to} double, check ${idCheck}`);
        assert.equal(gaFact(s1, 'netDoublePlayed'), 0);
        // the card's record of each arrival says the same as the rule
        const f1 = newestFlight(s1)!;
        const f2 = newestFlight(s2)!;
        assert.deepEqual(netArrivalOutcome(send, { result: f1.result as 'played', again: !!f1.again, door: f1.door }), first);
        assert.deepEqual(netArrivalOutcome(send, { result: f2.result as 'played', again: !!f2.again, door: f2.door }), again);
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
  it('nothing happens at the press: the action is SENT, and ARRIVES 0.25 s later', () => {
    const s0 = clean();
    const s1 = run(s0, { type: 'net', id: 'A1', what: 'door', to: 'world' });
    assert.equal(s1.doorOpen, false);
    assert.equal(gaFact(s1, 'inst:door_open'), gaFact(s0, 'inst:door_open'));
    assert.deepEqual(texts(s1), ['Action A1 (door) SENT: it arrives in 0.25 s']);
    assert.equal(newestFlight(s1)?.result, 'pending');
    assert.equal(tick(s1, GA_NET_DELAY_S - 0.01).doorOpen, false, 'not yet');
    const s2 = tick(s1, GA_NET_DELAY_S);
    assert.equal(s2.doorOpen, true);
    assert.equal(newestFlight(s2)?.door, 'opened');
    // the page's memory takes the arrival in, and keeps it after the model forgets it
    let m = netMemoryStart();
    m = netMemoryAdvance(m, s0, s1);
    assert.equal(Object.keys(m.landed).length, 0);
    m = netMemoryAdvance(m, s1, s2);
    const n = netFlightKey(newestFlight(s1)!);
    assert.deepEqual(m.landed[n], { result: 'played', again: false, door: 'opened' });
    assert.equal(netMemoryAdvance(m, s2, s2), m, 'nothing new: the same record');
    const later = tick(s2, 10);
    assert.equal(later.netFlights!.length, 0, 'the model forgot it');
    assert.equal(netMemoryAdvance(m, s2, later).landed[n].door, 'opened');
    // the model counts its flights from 1 again once it has forgotten them:
    // the next delivery must not be taken for the old one (seen on screen)
    const s3 = run(later, { type: 'net', id: 'A1', what: 'door', to: 'world' });
    assert.equal(newestFlight(s3)!.n, newestFlight(s1)!.n, 'the model reuses the number');
    assert.notEqual(netFlightKey(newestFlight(s3)!), n);
    const m2 = netMemoryAdvance(netMemoryAdvance(m, later, s3), s3, tick(s3, GA_NET_DELAY_S));
    assert.deepEqual(m2.landed[netFlightKey(newestFlight(s3)!)], { result: 'ignored', again: true, door: undefined });
  });
  it('ID CHECK is read when the action ARRIVES, not when it is sent', () => {
    let s = tick(run(clean(), { type: 'net', id: 'A1', what: 'door', to: 'world' }), GA_NET_DELAY_S);
    // sent with the check ON, switched OFF on its way: it is handled a second time
    s = run(s, { type: 'net', id: 'A1', what: 'door', to: 'world' }, { type: 'option', patch: { dedupe: false } });
    s = tick(s, GA_NET_DELAY_S);
    assert.equal(newestFlight(s)!.result, 'played');
    assert.equal(gaFact(s, 'netDoublePlayed'), 1);
    assert.equal(netCheckAtArrival({ result: 'played', again: true }), false);
    assert.equal(netCheckAtArrival({ result: 'ignored', again: true }), true);
    assert.equal(netCheckAtArrival({ result: 'played', again: false }), null);
  });
  it('the card’s words name the ID, the action, which way the door moved, and who it is for', () => {
    assert.equal(netMessageWords(sends[0]), 'A1 · door · for the world');
    assert.equal(netMessageWords(sends[0], 'opened'), 'A1 · door opened · for the world');
    assert.equal(netMessageWords(sends[0], 'closed'), 'A1 · door closed · for the world');
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
    const s1 = deliver(s0, send);
    assert.equal(s1.doorOpen, true, 'the new action opened the door');
    assert.equal(gaFact(s1, 'inst:door_open') - gaFact(s0, 'inst:door_open'), 1);
    // the same id again, check on: ignored, nothing moves, nothing plays
    const s2 = deliver(s1, send);
    assert.equal(s2.doorOpen, true);
    assert.equal(gaFact(s2, 'inst:door_open'), gaFact(s1, 'inst:door_open'));
    // check off: the sound a second time, the door where it was
    const s3 = deliver(run(s2, { type: 'option', patch: { dedupe: false } }), send);
    assert.equal(s3.doorOpen, true, 'a repeat does not move the door');
    assert.equal(gaFact(s3, 'inst:door_open') - gaFact(s2, 'inst:door_open'), 1);
    assert.equal(gaFact(s3, 'netDoublePlayed') - gaFact(s2, 'netDoublePlayed'), 1);
    // a second NEW action closes it again, and the model says so (W2-04)
    const s4 = deliver(s3, { id: 'A2', what: 'door', to: 'world' });
    assert.equal(s4.doorOpen, false);
    assert.equal(newestFlight(s4)?.door, 'closed');
    assert.ok(texts(s4).some((t) => t.startsWith('Action A2 (door closes) ARRIVED')));
    // the card says the same
    assert.equal(netEffectWords(send, 'plays', false), 'Moves the door and plays its sound, placed for its own listener.');
    assert.equal(netEffectWords(send, 'plays', true), 'Plays the door sound a SECOND time: a double. The door does not move again.');
  });
  it('the log lines the page and its guide quote are the reducer’s', () => {
    const send = sends[0];
    let s = deliver(deliver(gaInitial(), send), send);
    assert.ok(texts(s).includes('Action A1 ARRIVED AGAIN: it was already handled, so it is ignored'));
    assert.ok(G18.intro!.start.includes('already handled, so it is ignored'));
    s = deliver(run(s, { type: 'option', patch: { dedupe: false } }), send);
    assert.ok(texts(s).includes('SETTING network ID check: OFF'));
    assert.ok(texts(s).some((t) => t.includes('handled a SECOND time')));
    assert.ok(G18.tryThis.join(' ').includes('handled a SECOND time'));
    s = deliver(deliver(s, { id: 'A2', what: 'alert', to: 'them' }), { id: 'A3', what: 'alert', to: 'me' });
    assert.equal(gaFact(s, 'netPrivateOther'), 1);
    assert.equal(gaFact(s, 'netPrivateMe'), 1);
    assert.ok(texts(s).some((t) => t.includes('nothing plays here')));
    assert.equal(GA_NET_DELAY_S, 0.25, 'the page and its guide print 0.25 s');
  });
  it('every page 18 goal latches with sound off, by the written steps', () => {
    let s = clean();
    const f0 = { ...s.facts };
    s = deliver(s, { id: 'A1', what: 'door', to: 'world' });
    s = deliver(s, { id: 'A1', what: 'door', to: 'world' });
    s = deliver(run(s, { type: 'option', patch: { dedupe: false } }), { id: 'A1', what: 'door', to: 'world' });
    s = deliver(s, { id: 'A2', what: 'alert', to: 'me' });
    s = deliver(s, { id: 'A3', what: 'alert', to: 'them' });
    for (const k of ['netDuplicateIgnored', 'netDoublePlayed', 'netPrivateMe', 'netPrivateOther']) assert.ok(gaFact(s, k) > (f0[k] ?? 0), k);
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
 *  each one a chip of page 19's TEST tray (OPEN DOOR, GENERATOR 1, GUIDE
 *  LINE, STEP: GUIDE in place, ADD GENERATOR 2, GENERATOR 2, REMOVE
 *  GENERATOR 2). */
const GUIDE_STEP = stepInPlace('guide');
const REPRODUCE: Record<FaultId, GaAction[]> = {
  missingFile: [{ type: 'door' }],
  wrongBus: [{ type: 'machine', id: 'generator-1', on: true }, { type: 'post', event: 'vo_greeting', owner: 'guide' }],
  repeat: [GUIDE_STEP, GUIDE_STEP, GUIDE_STEP],
  scope: [GUIDE_STEP],
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
  it('the learner text keeps the house rules and the lab’s one name for each thing', () => {
    for (const f of FAULTS) {
      const t = [f.title, f.goal, f.symptom, ...f.hints, f.why, f.setting, f.pick, f.right, f.wrong].join('\n');
      assert.ok(!/\bmachine\b/i.test(t), `${f.id}: a generator is a generator (page 18 keeps "machine" for a player’s computer)`);
      assert.ok(!/\b(sfx|ui)\b|STEP ·|· guide ·|put (it|the setting) right/.test(t), `${f.id}: the names the screen uses`);
      assert.ok(f.pick.length <= 10, `${f.id}: the FIX chip ${f.pick}`);
      assert.ok(!/\b(colour|behaviour|centre|metre|programme|organis|recognis|grey)\b/i.test(t), `${f.id}: US spelling`);
      assert.ok(!/\b(must|always|never)\b/i.test(t), `${f.id}: no dogma words`);
      assert.ok(!/you(’|')ll (master|build|mix|be able)|you will (master|be able to)/i.test(t), `${f.id}: knowledge, not skills`);
      assert.ok(!/locali[sz]ation/i.test(t));
    }
  });
  it('the FIX values are the words of the pages that taught each setting (L-31)', () => {
    const page = (f: string) => readFileSync(new URL(`../src/screens/lab/gameaudio/pages/${f}.tsx`, import.meta.url), 'utf8');
    const byId = Object.fromEntries(FAULTS.map((f) => [f.id, f]));
    assert.deepEqual([byId.orphan.setting, byId.orphan.right, byId.orphan.wrong], ['WHEN A GENERATOR IS REMOVED', 'STOP ITS LOOP', 'LEAVE IT PLAYING']);
    for (const w of ['STOP ITS LOOP', 'LEAVE IT PLAYING', 'WHEN A GENERATOR IS REMOVED']) assert.ok(page('p07Instances').includes(w), w);
    assert.deepEqual([byId.scope.right, byId.scope.wrong], ['FOR EACH CHARACTER', 'FOR EVERYONE']);
    for (const w of ['FOR EACH CHARACTER', 'FOR EVERYONE']) assert.ok(page('p08GameSyncs').includes(w), w);
    // page 9's chip is onOff('VARIATION', …): VARIATION · ON / VARIATION · OFF
    assert.deepEqual([byId.repeat.right, byId.repeat.wrong], ['VARIATION · ON', 'VARIATION · OFF']);
    assert.ok(page('p09Variation').includes("onOff('VARIATION'"));
    assert.deepEqual([byId.wrongBus.right, byId.wrongBus.wrong], [GA_BUS_NAME.dialogue, GA_BUS_NAME.sfx]);
    assert.equal(new Set(FAULTS.map((f) => f.pick)).size, 5);
  });
  it('a STEP chip can be pressed without end: a step in place always posts its footstep', () => {
    let r = open();
    for (let k = 0; k < 12; k++) r = drive(r, GUIDE_STEP, stepInPlace('player'));
    assert.equal(starts(r.s).filter((t) => t.startsWith('Footstep')).length, 24);
    assert.equal(surfaceAt(r.s.chars.guide), 'wood');
    assert.equal(surfaceAt(r.s.chars.player), 'stone');
  });
  it('one card at a time: each fault’s status, and NEXT goes to one that is not fixed', () => {
    let r = open();
    for (const id of FAULT_IDS) assert.equal(faultStatus(id, r.b, r.s), 'idle');
    assert.equal(nextFault('missingFile', r.b, r.s), 'wrongBus');
    assert.equal(nextFault('orphan', r.b, r.s), 'missingFile', 'it comes back to the start');
    r = plant(r, 'missingFile');
    assert.equal(faultStatus('missingFile', r.b, r.s), 'active');
    r = repair(drive(r, ...REPRODUCE.missingFile), 'missingFile');
    assert.equal(faultStatus('missingFile', r.b, r.s), 'fixed');
    assert.equal(nextFault('orphan', r.b, r.s), 'wrongBus', 'a fixed fault is skipped');
    // started and switched straight back: not started again, so it can be started again
    const back = repair(plant(open(), 'scope'), 'scope');
    assert.equal(faultStatus('scope', back.b, back.s), 'idle');
    for (const id of FAULT_IDS.slice(1)) r = repair(drive(plant(r, id), ...REPRODUCE[id]), id);
    r = drive(r, { type: 'stopAll' });
    // round 2 (R2-GA2-01): fault 5 also needs the removal tested again
    assert.equal(faultStatus('orphan', r.b, r.s), 'active');
    r = drive(r, ...REPRODUCE.orphan);
    for (const id of FAULT_IDS) assert.equal(faultStatus(id, r.b, r.s), 'fixed', id);
    assert.equal(nextFault('scope', r.b, r.s), null);
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
        assert.ok(!faultFixed(id, r.b, r.s), 'silenced, but the removal is not tested again (round 2, R2-GA2-01)');
        r = drive(r, ...REPRODUCE.orphan);
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
    assert.ok(starts(r.s).some((t) => t.includes('Door · rattle')));
    assert.ok(!starts(r.s).some((t) => t.includes('Door · door')));
    assert.match(FAULTS[0].symptom, /Only the latch rattle plays/);
    const n = r.s.logN;
    r = drive(repair(r, 'missingFile'), { type: 'door' });
    // the START line names the door's file, as the card's reason says (the second press closes it)
    assert.ok(starts(r.s, n).some((t) => t.includes('Door · door_close.wav')));
  });
  it('fault 2: the line goes to the EFFECTS bus and nothing ducks; planting it switches the duck on', () => {
    let r = open(run(gaInitial(), { type: 'option', patch: { duck: false } }));
    r = drive(plant(r, 'wrongBus'), ...REPRODUCE.wrongBus);
    assert.ok(r.s.options.duck, 'a known situation: the duck is on');
    assert.ok(starts(r.s).some((t) => t.includes('Guide: greeting') && t.includes('→ EFFECTS bus')));
    assert.ok(FAULTS[1].hints.some((h) => h.includes('“→ EFFECTS bus”')), 'the hint quotes the log');
    assert.equal(gaFact(r.s, 'duck'), 0);
    assert.ok(!texts(r.s).some((t) => t.startsWith('DUCK on')));
    // the repair, then the SAME action again from a quiet scene: now it ducks
    r = drive(repair(r, 'wrongBus'), { type: 'stopAll' });
    const ducksBefore = gaFact(r.s, 'duck');
    const n = r.s.logN;
    r = drive(r, { type: 'post', event: 'vo_greeting', owner: 'guide' });
    assert.equal(gaFact(r.s, 'duck'), ducksBefore + 1);
    assert.ok(texts(r.s, n).some((t) => t.startsWith('DUCK on')));
    assert.ok(starts(r.s, n).some((t) => t.includes('Guide: greeting') && t.includes('→ DIALOGUE bus')));
    assert.ok(faultFixed('wrongBus', r.b, r.s));
  });
  it('fault 2 corrected WHILE the wrongly routed line still speaks: no DUCK on for it (W2-27)', () => {
    let r = drive(plant(open(), 'wrongBus'), ...REPRODUCE.wrongBus);
    const ducks = gaFact(r.s, 'duck');
    const n = r.s.logN;
    r = repair(r, 'wrongBus');
    assert.ok(gaPlaying(r.s, 'vo_greeting'), 'the line still speaks');
    assert.equal(gaFact(r.s, 'duck'), ducks);
    assert.ok(!texts(r.s, n).some((t) => t.startsWith('DUCK')));
    assert.ok(faultFixed('wrongBus', r.b, r.s));
    // the same line again while it speaks is ignored; after it ends, it ducks (the card's reason)
    r = drive(r, { type: 'post', event: 'vo_greeting', owner: 'guide' });
    assert.equal(gaFact(r.s, 'duck'), ducks);
    r = { s: endOneShots(r.s), b: r.b };
    r = drive(r, { type: 'post', event: 'vo_greeting', owner: 'guide' });
    assert.equal(gaFact(r.s, 'duck'), ducks + 1);
    assert.match(FAULTS[1].why, /When the line has ended, play it again/);
  });
  it('fault 3: every step names take 1, and two steps are not yet a pattern', () => {
    let r = drive(plant(open(), 'repeat'), GUIDE_STEP, GUIDE_STEP);
    assert.equal(r.b.repeat.seen, 2);
    assert.ok(!faultFixed('repeat', repair(r, 'repeat').b, repair(r, 'repeat').s));
    r = drive(r, stepInPlace('player'));
    const steps = starts(r.s).filter((t) => t.includes('Footstep'));
    assert.equal(steps.length, 3);
    for (const t of steps) assert.ok(t.includes('take 1 of 4'), t);
    r = repair(r, 'repeat');
    assert.ok(r.s.options.variation && faultFixed('repeat', r.b, r.s));
  });
  it('fault 4: the guide’s step uses YOUR surface, and cannot show when you share a surface', () => {
    let r = drive(plant(open(), 'scope'), GUIDE_STEP);
    assert.ok(texts(r.s).some((t) => t === 'TRIGGER foot contact · GUIDE · SWITCH surface = stone'));
    assert.equal(r.b.scope.seen, 1);
    // both indoors on wood: the fault is in, but no symptom can be seen
    r = drive(open(), { type: 'door' }, { type: 'move', who: 'player', x: 11, y: 5 });
    r = drive(plant(r, 'scope'), GUIDE_STEP);
    assert.equal(r.b.scope.seen, 0);
    assert.ok(!faultFixed('scope', repair(r, 'scope').b, repair(r, 'scope').s));
  });
  it('fault 5: the loop plays on with no owner until it is stopped; then the removal is tested again (round 2, R2-GA2-01)', () => {
    let r = drive(plant(open(), 'orphan'), ...REPRODUCE.orphan);
    assert.equal(strayLoops(r.s).length, 1);
    assert.ok(texts(r.s).some((t) => t.includes('ORPHAN')));
    assert.ok(r.s.inst.length > 0, 'PLAYING still counts it');
    r = repair(r, 'orphan');
    assert.ok(faultOpen('orphan', r.b, r.s) && !faultFixed('orphan', r.b, r.s));
    r = drive(r, { type: 'stopAll' });
    assert.equal(strayLoops(r.s).length, 0);
    assert.ok(faultOpen('orphan', r.b, r.s) && !faultFixed('orphan', r.b, r.s), 'silenced is not tested');
    r = drive(r, ...REPRODUCE.orphan);
    assert.ok(faultFixed('orphan', r.b, r.s));
  });
  it('all five can be in at once and repaired one by one', () => {
    let r = open();
    for (const id of FAULT_IDS) r = plant(r, id);
    assert.equal(settingsWrong(r.s), 5);
    r = drive(r, { type: 'door' }, { type: 'post', event: 'vo_greeting', owner: 'guide' }, ...REPRODUCE.repeat, ...REPRODUCE.orphan);
    for (const id of FAULT_IDS) r = repair(r, id);
    r = drive(r, { type: 'stopAll' }, ...REPRODUCE.orphan);
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
  it('fault 5 on this page: ADD GENERATOR 2 does not take the stray loop over and fixes nothing (round 2, R2-GA2-01)', () => {
    let r = repair(drive(plant(open(), 'orphan'), ...REPRODUCE.orphan), 'orphan');
    assert.equal(strayLoops(r.s).length, 1);
    r = drive(r, { type: 'addMachine' });
    assert.equal(r.s.machines.find((m) => m.id === 'generator-2'), undefined, 'not placed while its old loop plays');
    assert.equal(strayLoops(r.s).length, 1);
    assert.ok(!faultFixed('orphan', r.b, r.s));
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
    r = drive(plant(step.r, 'scope'), GUIDE_STEP);
    assert.equal(r.b.scope.seen, 0);
    // YOU wander off inside, then the door is closed: STONE PATH is blocked until it is opened
    r = drive(r, { type: 'step', who: 'player' }, { type: 'step', who: 'player' }, { type: 'door' });
    step = go(r, 'path');
    assert.ok(step.blocked && surfaceAt(step.r.s.chars.player) === 'wood');
    step = go(drive(step.r, { type: 'door' }), 'path');
    assert.ok(!step.blocked);
    assert.equal(standingOn(step.r.s), 'path');
    // now the guide's step uses YOUR surface: the symptom
    r = drive(step.r, GUIDE_STEP);
    assert.equal(r.b.scope.seen, 1);
    assert.ok(texts(r.s).includes('TRIGGER foot contact · GUIDE · SWITCH surface = stone'));
    assert.ok(faultFixed('scope', repair(r, 'scope').b, repair(r, 'scope').s));
    // from the gravel (neither chip is marked) the same holds
    r = drive(open(), { type: 'move', who: 'player', x: 4.2, y: 7.5 });
    assert.equal(standingOn(r.s), null);
    r = drive(plant(r, 'scope'), GUIDE_STEP);
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
  it('each page’s lesson prose is inside the approved plan’s 150–260 words (decision 12)', () => {
    for (const p of PAGES) {
      const n = lesson(p).trim().split(/\s+/).length;
      assert.ok(n >= 150 && n <= 260, `${p}: ${n} words`);
    }
  });
  it('in each check the correct option is not the longest (L-16)', () => {
    for (const p of PAGES) {
      const s = src(p);
      const opts = [...s.match(/options=\{\[([\s\S]*?)\]\}/)![1].matchAll(/'([^']*)'/g)].map((m) => m[1]);
      const k = Number(s.match(/correct=\{(\d)\}/)![1]);
      const others = opts.filter((_, i) => i !== k).map((o) => o.length);
      assert.ok(opts[k].length < Math.max(...others), `${p}: correct ${opts[k].length}, others ${others}`);
    }
  });
  it('the words the pages were told to stop using are gone, and the fixes the audits asked for are in', () => {
    for (const p of PAGES) {
      const t = lesson(p);
      assert.ok(!/sfx means|ui means|After DUCK off/.test(t), `${p}: the log's ids and "After DUCK off" (L-03, L-09)`);
      assert.ok(!/\bid\b/.test(t), `${p}: ID in capitals (L-25)`);
    }
    assert.ok(!/REMOVING A MACHINE|NO MACHINE/.test(src('p19Testing')));
    assert.ok(/hudArg: sel/.test(src('p16Mix')), 'page 16 marks the chosen bus on its mix strip');
    // the line chips say SPEAKING in a word, not by their highlight alone (W2-24)
    assert.ok(/speaking\('GUIDE LINE'/.test(src('p16Mix')) && /speaking\('CHAT LINE'/.test(src('p16Mix')));
    // the tray kit gives the measured tray room, not "300 points" (W2-03), and words a log line as the log does
    const kit = readFileSync(new URL('../src/screens/lab/gameaudio/pages/chdKit.tsx', import.meta.url), 'utf8');
    assert.ok(!/300 points/.test(kit) && /242 points/.test(kit));
    assert.ok(/gaLogRow/.test(kit), 'a tray never prints the kind word twice');
  });
  it('the fix round’s shared wording rules hold in the pages, their guides and their data', () => {
    const files = [
      ...PAGES.map((p) => `pages/${p}.tsx`),
      ...['16', '17', '18', '19'].map((n) => `pages/guides/p${n}.ts`),
      'pages/chdKit.tsx',
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
      // ID CHECK is a readout label; an 8-letter dock key value is cut ("DUCK O…", seen at 390 pt)
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
