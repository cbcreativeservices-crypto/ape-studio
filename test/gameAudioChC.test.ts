/**
 * Game Audio lab — pages 11–15 (Chapter 3, Space, and Chapter 4, Music and
 * voice): the pure files behind them (pages/data/chcSpace.ts,
 * pages/data/chcMusicVoice.ts), and the claims those pages make to the
 * learner, proven on the model with no device.
 *
 * These check RELATIONSHIPS a page states ("straight ahead and straight
 * behind pan the same", "the level halves each time the distance doubles",
 * "walk west and the generator goes virtual", "the withdrawn request never
 * plays", "the Spanish take is the longer file"), and that every goal a page
 * shows can be reached with SOUND OFF where the brief requires it.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { GA_EVENTS, GA_LINES } from '../src/screens/lab/gameaudio/model/gaDefs.ts';
import { gaFact, gaInitial, gaListenDistance, gaReduce, listenerOf, type GaAction, type GaState } from '../src/screens/lab/gameaudio/model/gaModel.ts';
import { OBSTRUCTED, PLACES, START, WALL_X, WORLD_W, attenuationGain, zoneAt } from '../src/screens/lab/gameaudio/model/gaWorld.ts';
import { gaSoundSeconds } from '../src/screens/lab/gameaudio/sounds/gaSoundBank.ts';
import { MUSIC_BAR_S, MUSIC_BEAT_S, MUSIC_BPM, MUSIC_LOOP_S } from '../src/screens/lab/gameaudio/sounds/gaSynth.ts';
import {
  CHC_BOUNDARY_S,
  CHC_LAYER_UNHEARD,
  CHC_LINES,
  lineTake,
  lineTakeFact,
  musicRows,
  pendingLine,
  pendingShort,
  speakingNow,
} from '../src/screens/lab/gameaudio/pages/data/chcMusicVoice.ts';
import {
  WALK_EDGE,
  WALK_Y,
  WALL_DB,
  WALL_HZ,
  atClosedDoor,
  chcSpace,
  directionWord,
  levelWord,
  panShort,
  panWord,
  sideWord,
  walkLine,
  walkV,
  walkX,
} from '../src/screens/lab/gameaudio/pages/data/chcSpace.ts';
import { G11 } from '../src/screens/lab/gameaudio/pages/guides/p11.ts';
import { G12 } from '../src/screens/lab/gameaudio/pages/guides/p12.ts';

function run(s: GaState, ...actions: GaAction[]): GaState {
  for (const a of actions) s = gaReduce(s, a).state;
  return s;
}
const soundOn = () => run(gaInitial(), { type: 'sound', on: true });
/** The scene a page opens on (GaRack dispatches `enterPage`). */
const opened = (from: GaState = gaInitial()) => run(from, { type: 'enterPage' });
/** The player put at a point, facing a compass bearing (a test fixture). */
function standing(x: number, y: number, facing: number, base: GaState = gaInitial()): GaState {
  return { ...base, chars: { ...base.chars, player: { ...base.chars.player, x, y, facing } } };
}
const G = PLACES.generator;

describe('page 11 — distance and pan (chcSpace)', () => {
  it('full level inside the minimum, −6 dB per doubling beyond it, silence at the maximum', () => {
    const { min, max } = GA_EVENTS.generator.atten!;
    const inside = chcSpace(standing(G.x - min * 0.5, G.y, 90), 'generator-1');
    assert.equal(inside.zone, 'full');
    assert.equal(inside.gain, 1);
    assert.match(levelWord(inside), /^FULL LEVEL/);
    const near = chcSpace(standing(G.x - 4, G.y, 90), 'generator-1');
    const far = chcSpace(standing(G.x - 8, G.y, 90), 'generator-1');
    assert.equal(near.zone, 'falling');
    assert.ok(Math.abs(near.levelDb - far.levelDb - 6.02) < 0.01, `doubling 4 m → 8 m drops ${(near.levelDb - far.levelDb).toFixed(2)} dB`);
    assert.match(levelWord(far), /dB below full level$/);
    const out = chcSpace(standing(G.x - max, G.y, 90), 'generator-1');
    assert.equal(out.zone, 'silent');
    assert.equal(out.gain, 0);
    assert.match(levelWord(out), /^SILENT/);
  });

  it('a source straight ahead and one straight behind pan the same: the center', () => {
    const ahead = chcSpace(standing(G.x - 4, G.y, 90), 'generator-1');
    const behind = chcSpace(standing(G.x - 4, G.y, 270), 'generator-1');
    assert.ok(Math.abs(ahead.bearingDeg) < 1e-9);
    assert.ok(Math.abs(Math.abs(behind.bearingDeg) - 180) < 1e-9);
    assert.equal(panWord(ahead.pan), 'CENTER');
    assert.equal(panWord(behind.pan), 'CENTER');
    assert.equal(panShort(behind.pan), 'CENTER');
    assert.equal(directionWord(ahead.bearingDeg), 'straight ahead');
    assert.equal(directionWord(behind.bearingDeg), 'straight behind');
    // the same angle in front and behind gives the same pan: front/back is not in it
    const front30 = chcSpace(standing(G.x - 4, G.y, 60), 'generator-1');
    const back30 = chcSpace(standing(G.x - 4, G.y, 300), 'generator-1');
    assert.ok(Math.abs(front30.pan - back30.pan) < 1e-9);
    assert.equal(sideWord(front30.bearingDeg), 'AHEAD');
    assert.equal(sideWord(back30.bearingDeg), 'BEHIND');
  });

  it('a source to the right pans right, and the words say which side', () => {
    const right = chcSpace(standing(G.x - 4, G.y, 0), 'generator-1');
    assert.ok(right.pan > 0.99);
    assert.equal(panWord(right.pan), 'RIGHT 100%');
    assert.equal(panShort(right.pan), 'R 100%');
    assert.equal(sideWord(right.bearingDeg), 'RIGHT');
    assert.equal(directionWord(right.bearingDeg), '90° to your right, at your side');
    assert.equal(directionWord(-120), '120° to your left, behind');
    assert.equal(directionWord(40), '40° to your right, in front');
  });

  it('from the start, FACING (5° steps) can put the generator behind you: the goal is reachable', () => {
    const best = Array.from({ length: 72 }, (_, i) => i * 5)
      .map((f) => chcSpace(run(gaInitial(), { type: 'face', who: 'player', facing: f }), 'generator-1'))
      .sort((a, b) => Math.abs(b.bearingDeg) - Math.abs(a.bearingDeg))[0];
    assert.ok(Math.abs(best.bearingDeg) >= 170, `best is ${best.bearingDeg.toFixed(1)}°`);
    assert.ok(Math.abs(best.pan) < 0.06, 'and the pan is back near the center');
  });

  it('sound off, from the clean scene: generator behind you, then STEP — STATE goes VIRTUAL, and comes back', () => {
    // the guide's own numbers: "set FACING to 255° and press STEP until STATE on the card reads VIRTUAL"
    assert.ok(G11.tryThis.some((x) => x.includes('FACING to 255°')));
    let s = run(opened(), { type: 'machine', id: 'generator-1', on: true }, { type: 'face', who: 'player', facing: 255 });
    assert.equal(s.soundOn, false);
    assert.ok(Math.abs(chcSpace(s, 'generator-1').bearingDeg) >= 170, 'the generator is behind you');
    let steps = 0;
    while (gaFact(s, 'virtual') === 0 && steps < 12) {
      s = run(s, { type: 'step', who: 'player' });
      steps++;
    }
    assert.ok(gaFact(s, 'virtual') > 0, 'the model counted it');
    assert.ok(steps <= 8, `${steps} steps`);
    const r = chcSpace(s, 'generator-1');
    assert.ok(r.playing && r.virtual && r.zone === 'silent');
    // the page's log shows STATE lines only, so footsteps cannot push this line out
    const stateLines = s.log.filter((l) => l.kind === 'state');
    assert.ok(stateLines[stateLines.length - 1].text.includes('left its maximum distance: VIRTUAL'));
    s = run(s, { type: 'face', who: 'player', facing: 75 }, { type: 'step', who: 'player' }, { type: 'step', who: 'player' });
    assert.ok(s.log.some((l) => l.text.includes('back in range: rendered again')));
    assert.equal(chcSpace(s, 'generator-1').virtual, false);
  });

  it('the rule the page states: beyond the minimum −6 dB per doubling, and an extra fade over the last fifth', () => {
    const a = GA_EVENTS.fountain.atten!;
    const fadeFrom = a.min + (a.max - a.min) * 0.8;
    assert.ok(fadeFrom >= 7, 'the guide says "Start closer than 7 m"');
    const F = PLACES.fountain;
    const at = (d: number) => chcSpace(standing(F.x + d, F.y, 270), 'fountain');
    assert.ok(Math.abs(at(3.5).levelDb - at(7).levelDb - 6.02) < 0.01, 'from the half distance the level is 6 dB higher');
    const lateDrop = at(4.25).levelDb - at(8.5).levelDb;
    assert.ok(lateDrop > 6.5, `inside the last fifth the drop is more than 6 dB (${lateDrop.toFixed(1)})`);
    assert.equal(at(a.max).gain, 0);
  });

  it('the distance printed is the model’s own, along the ground, for the overhead listener too', () => {
    const s = run(gaInitial(), { type: 'machine', id: 'generator-1', on: true }, { type: 'listener', mode: 'camera' });
    const r = chcSpace(s, 'generator-1');
    assert.equal(r.distanceM, gaListenDistance(listenerOf(s), G));
    assert.equal(r.virtual, false, 'height does not make a source virtual');
  });

  it('a source that is not switched on is measured but not "playing"', () => {
    const r = chcSpace(gaInitial(), 'fountain');
    assert.equal(r.playing, false);
    assert.equal(r.virtual, false);
    assert.ok(r.distanceM > 0);
  });
});

describe('page 12 — the wall, and the WALK lane', () => {
  it('the numbers the page and its guide print are the model’s treatment', () => {
    assert.equal(WALL_DB, -9);
    assert.equal(WALL_HZ, OBSTRUCTED.lowpassHz);
    const text = G12.changes.join(' ');
    assert.ok(text.includes(`${Math.abs(WALL_DB)} dB`) && text.includes(`${WALL_HZ} Hz`), 'the guide quotes the same two numbers');
  });

  it('the closed door is in the way from the courtyard; opening it clears it; inside the room it never is', () => {
    let s = run(gaInitial(), { type: 'machine', id: 'generator-1', on: true });
    assert.ok(chcSpace(s, 'generator-1').obstructed);
    s = run(s, { type: 'door' });
    assert.equal(chcSpace(s, 'generator-1').obstructed, false);
    assert.equal(gaFact(s, 'doorOpened'), 1);
    s = run(s, { type: 'move', who: 'player', x: walkX(0.75), y: WALK_Y });
    assert.equal(zoneAt(listenerOf(s)), 'room');
    assert.equal(gaFact(s, 'zoneCross'), 1);
    s = run(s, { type: 'door' });
    assert.equal(chcSpace(s, 'generator-1').obstructed, false, 'same room: the door is not between you');
    assert.ok(chcSpace(s, 'fountain').obstructed, 'now the fountain is the one behind the door');
  });

  it('WALK keeps the model’s edge, never asks for a place inside the wall, and round-trips', () => {
    assert.equal(WALK_EDGE, 0.9);
    for (let i = 0; i <= 200; i++) {
      const x = walkX(i / 200);
      assert.ok(Math.abs(x - WALL_X) >= 0.45 - 1e-9, `x = ${x}`);
      assert.ok(x >= WALK_EDGE && x <= WORLD_W - WALK_EDGE);
      // the model accepts the place as asked (no silent clamp at an edge)
      const got = run(run(opened(), { type: 'door' }), { type: 'move', who: 'player', x, y: WALK_Y }).chars.player.x;
      assert.ok(Math.abs(got - x) < 1e-9, `asked ${x}, got ${got}`);
    }
    assert.equal(walkX(-1), WALK_EDGE);
    assert.equal(walkX(2), WORLD_W - WALK_EDGE);
    for (const v of [0, 0.2, 0.5, 0.9, 1]) assert.ok(Math.abs(walkV(walkX(v)) - v) < 0.01 || Math.abs(walkX(v) - WALL_X) <= 0.45 + 1e-9);
  });

  it('with the door closed the walk stops at the wall; the lane’s captions fit the lane', () => {
    let s = opened();
    assert.match(walkLine(s), /^COURTYARD · 3\.8 m TO WALL$/);
    s = run(s, { type: 'move', who: 'player', x: walkX(0.9), y: WALK_Y });
    assert.equal(zoneAt(s.chars.player), 'yard');
    assert.ok(atClosedDoor(s));
    assert.equal(walkLine(s), 'DOOR CLOSED: STOPPED AT THE WALL');
    s = run(s, { type: 'door' }, { type: 'move', who: 'player', x: walkX(0.9), y: WALK_Y });
    assert.equal(zoneAt(s.chars.player), 'room');
    assert.match(walkLine(s), /^WORKSHOP · \d+\.\d m IN$/);
    for (const v of [0, 0.3, 0.55, 0.62, 1]) assert.ok(walkLine(run(s, { type: 'move', who: 'player', x: walkX(v), y: WALK_Y })).length <= 32);
  });

  it('along the WALK lane the running generator is never out of range, and the goal ignores a virtual one', () => {
    const s = run(opened(), { type: 'machine', id: 'generator-1', on: true });
    for (let i = 0; i <= 50; i++) {
      const r = chcSpace(run(s, { type: 'move', who: 'player', x: walkX(i / 50), y: WALK_Y }), 'generator-1');
      assert.ok(!r.virtual, `at lane ${i / 50}`);
    }
    // away from the lane it can be virtual AND behind the closed door at once: that must not count as "heard"
    const far = chcSpace(run({ ...s, chars: { ...s.chars, player: { ...s.chars.player, x: 0.9, y: 9.1 } } }, { type: 'face', who: 'player', facing: 0 }), 'generator-1');
    assert.ok(far.playing && far.obstructed && far.virtual);
  });

  it('the reverb goal’s facts are counted with sound off', () => {
    const s = run(gaInitial(), { type: 'option', patch: { reverb: false } }, { type: 'option', patch: { reverb: true } });
    assert.equal(gaFact(s, 'option:reverb:false'), 1);
    assert.equal(gaFact(s, 'option:reverb:true'), 1);
    assert.deepEqual(s.log.slice(-2).map((l) => `${l.kind} ${l.text}`), ['mix SETTING workshop reverb: OFF', 'mix SETTING workshop reverb: ON']);
  });
});

describe('page 13 — its goal facts, and the page-open reset it relies on', () => {
  it('the renderer, the fold-down and a turn are counted', () => {
    const s = run(gaInitial(), { type: 'scene', on: true }, { type: 'pan', mode: 'hrtf' }, { type: 'face', who: 'player', facing: 180 }, { type: 'mono', on: true });
    assert.equal(gaFact(s, 'pan:hrtf'), 1);
    assert.equal(gaFact(s, 'turned'), 1);
    assert.equal(gaFact(s, 'monoOn'), 1);
    assert.equal(sideWord(chcSpace(gaInitial(), 'fountain').bearingDeg), 'LEFT');
  });

  it('a page opens on the clean scene these pages are written from, with the facts kept', () => {
    const before = run(
      gaInitial(),
      { type: 'scene', on: true },
      { type: 'machine', id: 'generator-1', on: true },
      { type: 'door' },
      { type: 'step', who: 'player' },
      { type: 'listener', mode: 'camera' },
      { type: 'pan', mode: 'hrtf' },
      { type: 'mono', on: true },
      { type: 'musicStart' },
      { type: 'mood', mood: 'alert' },
      { type: 'option', patch: { reverb: false, language: 'es', musicBoundary: 'beat' } },
    );
    const s = opened(before);
    assert.deepEqual([s.chars.player.x, s.chars.player.y, s.chars.player.facing], [START.player.x, START.player.y, START.player.facing]);
    assert.equal(s.doorOpen, false);
    assert.equal(s.machines.length, 1);
    assert.equal(s.machines[0].on, false);
    assert.equal(s.inst.length, 0, 'nothing is playing');
    assert.deepEqual([s.listenerMode, s.pan, s.mono], ['player', 'stereo', false]);
    assert.deepEqual([s.music.on, s.mood, s.music.pending], [false, 'calm', null]);
    assert.deepEqual(s.music.layers, { calm: true, pulse: false, drive: false });
    assert.deepEqual([s.options.reverb, s.options.language, s.options.musicBoundary], [true, 'en', 'bar']);
    assert.equal(s.log.length, 0, 'an empty log');
    assert.deepEqual(s.facts, before.facts, 'the facts are the record of what the learner did');
  });

  it('page 13: from the clean start the fountain is in range, so SCENE on is enough to hear it turn', () => {
    const s = run(opened(), { type: 'scene', on: true });
    const r = chcSpace(s, 'fountain');
    assert.ok(attenuationGain(r.distanceM, GA_EVENTS.fountain.atten!) > 0);
    assert.ok(r.playing && !r.virtual && !r.obstructed);
  });
});

describe('page 14 — music (chcMusicVoice)', () => {
  it('the boundary lengths the tray quotes are the music’s own', () => {
    assert.equal(MUSIC_BPM, 96);
    assert.equal(CHC_BOUNDARY_S.beat, MUSIC_BEAT_S);
    assert.equal(CHC_BOUNDARY_S.bar, MUSIC_BAR_S);
    assert.equal(CHC_BOUNDARY_S.phrase, MUSIC_LOOP_S);
    assert.equal(CHC_BOUNDARY_S.bar, 2.5);
    assert.equal(CHC_BOUNDARY_S.phrase, 10);
    assert.equal(CHC_BOUNDARY_S.beat.toFixed(1), '0.6');
  });

  it('sound on: a request waits; the card shows the layer WAITING, not heard, until it is applied', () => {
    let s = run(soundOn(), { type: 'musicStart' });
    const applied = { ...s.music.layers };
    assert.deepEqual(musicRows(s, applied).map((r) => r.state), ['heard', 'zero', 'zero']);
    assert.equal(musicRows(s, applied)[0].word, 'HEARD');
    assert.equal(pendingShort(s), 'NONE');
    assert.equal(pendingLine(s), 'Nothing is waiting.');
    s = run(s, { type: 'musicLayer', layer: 'pulse', on: true });
    const req = s.music.pending!.req;
    assert.deepEqual(musicRows(s, applied).map((r) => r.state), ['heard', 'coming', 'zero']);
    assert.equal(pendingShort(s), 'WAITING');
    assert.equal(pendingLine(s), 'add PULSE: waiting for the next bar.');
    s = run(s, { type: 'engine', evt: { e: 'music', what: 'queued', req, at: 10, inS: 1.4, boundary: 'bar' } });
    assert.equal(pendingShort(s), '1.4 s');
    assert.match(pendingLine(s), /1\.4 s to wait/);
    s = run(s, { type: 'engine', evt: { e: 'music', what: 'applied', req, at: 10 } });
    assert.deepEqual(musicRows(s, { ...s.music.layers }).map((r) => r.state), ['heard', 'heard', 'zero']);
    s = run(s, { type: 'musicLayer', layer: 'pulse', on: false });
    assert.deepEqual(musicRows(s, { calm: true, pulse: true, drive: false }).map((r) => r.state), ['heard', 'going', 'zero']);
  });

  it('sound on: ALERT then CALM before the boundary — the first is WITHDRAWN and nothing is left waiting to come in', () => {
    let s = run(soundOn(), { type: 'musicStart' });
    const applied = { ...s.music.layers };
    s = run(s, { type: 'option', patch: { musicBoundary: 'phrase' } }, { type: 'mood', mood: 'alert' });
    assert.deepEqual(musicRows(s, applied).map((r) => r.state), ['heard', 'coming', 'coming']);
    s = run(s, { type: 'mood', mood: 'calm' });
    assert.equal(gaFact(s, 'musicWithdrawn'), 1);
    assert.ok(s.log.some((l) => l.text.includes('the waiting change (add PULSE and DRIVE) is WITHDRAWN')));
    assert.deepEqual(musicRows(s, applied).map((r) => r.state), ['heard', 'zero', 'zero']);
    assert.equal(pendingLine(s), 'back to CALM only: waiting for the next phrase.');
  });

  it('sound off: a request still waits for its boundary, and a change of mind withdraws it — every goal is reachable unheard', () => {
    let s = run(gaInitial(), { type: 'musicStart' });
    assert.equal(s.soundOn, false);
    const applied = { ...s.music.layers };
    s = run(s, { type: 'musicLayer', layer: 'pulse', on: true });
    assert.ok(s.music.pending, 'the request waits');
    assert.equal(s.music.pending!.inS, CHC_BOUNDARY_S.bar, 'a whole bar from the music’s start, in scene time');
    assert.equal(pendingShort(s), '2.5 s');
    assert.deepEqual(musicRows(s, applied).map((r) => r.state), ['heard', 'coming', 'zero']);
    assert.equal(musicRows(s, applied)[0].word, CHC_LAYER_UNHEARD, 'with sound off a layer that is on does not read HEARD');
    assert.equal(gaFact(s, 'layer:pulse:on'), 1);
    // the conductor reports it applied at the boundary; the line says it was not heard
    s = run(s, { type: 'engine', evt: { e: 'music', what: 'applied', req: s.music.pending!.req, at: 0 } });
    assert.equal(s.music.pending, null);
    assert.ok(s.log[s.log.length - 1].text.endsWith('APPLIED exactly on the bar line (not heard: sound is off)'));
    // a change of mind before the boundary
    s = run(s, { type: 'option', patch: { musicBoundary: 'phrase' } });
    assert.equal(s.log[s.log.length - 1].text, 'SETTING music changes land on: the next phrase');
    const heard = { ...s.music.layers };
    s = run(s, { type: 'mood', mood: 'alert' }, { type: 'mood', mood: 'calm' });
    assert.equal(gaFact(s, 'musicWithdrawn'), 1);
    assert.equal(gaFact(s, 'mood:alert'), 1);
    assert.ok(s.log.some((l) => l.text.includes('the waiting change (add PULSE and DRIVE) is WITHDRAWN')));
    assert.deepEqual(musicRows(s, heard).map((r) => r.state), ['heard', 'going', 'zero'], 'DRIVE never comes in; PULSE waits to go out');
    s = run(s, { type: 'stinger' });
    assert.equal(gaFact(s, 'stinger'), 1);
  });

  it('the page’s written steps, from the clean scene and unheard, reach every goal', () => {
    const land = (x: GaState) => run(x, { type: 'engine', evt: { e: 'music', what: 'applied', req: x.music.pending!.req, at: 0 } });
    let s = opened();
    const f0 = { ...s.facts };
    // "Open MUSIC and press START. Switch PULSE on and wait until the log says APPLIED."
    s = run(s, { type: 'musicStart' }, { type: 'musicLayer', layer: 'pulse', on: true });
    assert.ok(s.log.some((l) => l.text.includes('QUEUED for the next bar')));
    s = land(s);
    assert.ok(s.log[s.log.length - 1].text.includes('APPLIED'));
    // "Switch PULSE off and wait again. Then press MOOD ALERT."
    s = land(run(s, { type: 'musicLayer', layer: 'pulse', on: false }));
    s = land(run(s, { type: 'mood', mood: 'alert' }));
    assert.equal(gaFact(s, 'musicWithdrawn') - (f0.musicWithdrawn ?? 0), 0, 'nothing was withdrawn while each change was left to land');
    // "Set CHANGE AT to NEXT PHRASE. MOOD is ALERT now. Press MOOD CALM, then press MOOD ALERT again before the phrase ends. Then press STINGER."
    assert.equal(s.mood, 'alert');
    s = run(s, { type: 'option', patch: { musicBoundary: 'phrase' } }, { type: 'mood', mood: 'calm' }, { type: 'mood', mood: 'alert' }, { type: 'stinger' });
    assert.equal(gaFact(s, 'musicWithdrawn') - (f0.musicWithdrawn ?? 0), 1);
    assert.ok(s.log.some((l) => l.text.includes('the waiting change (back to CALM only) is WITHDRAWN')));
    assert.equal(gaFact(s, 'stinger') - (f0.stinger ?? 0), 1);
    assert.equal(s.inst.length, 0, 'the music is not an instance: PLAYING and VOICES do not count it');
    assert.equal(s.music.on, true);
  });

  it('sound off: only the NOW boundary applies immediately', () => {
    const s = run(gaInitial(), { type: 'musicStart' }, { type: 'option', patch: { musicBoundary: 'now' } }, { type: 'musicLayer', layer: 'drive', on: true });
    assert.equal(s.music.pending, null);
    assert.equal(gaFact(s, 'musicApplied'), 1);
    assert.ok(s.log[s.log.length - 1].text.endsWith('applied (not heard: sound is off)'));
  });

  it('before START every layer reads NOT PLAYING', () => {
    assert.deepEqual(musicRows(gaInitial(), null).map((r) => r.word), ['NOT PLAYING', 'NOT PLAYING', 'NOT PLAYING']);
  });
});

describe('page 15 — dialogue (chcMusicVoice)', () => {
  const greet: GaAction = { type: 'post', event: 'vo_greeting', owner: 'guide' };
  const warn: GaAction = { type: 'post', event: 'vo_warning', owner: 'guide' };

  it('sound off: greeting, interrupted by the warning, then the greeting REFUSED — each goal is a fact', () => {
    let s = gaInitial();
    assert.equal(speakingNow(s), null);
    s = run(s, greet);
    assert.equal(gaFact(s, 'inst:vo_greeting'), 1);
    assert.equal(speakingNow(s)?.event, 'vo_greeting');
    s = run(s, warn);
    assert.equal(gaFact(s, 'interrupted'), 1);
    assert.equal(speakingNow(s)?.event, 'vo_warning');
    assert.ok(speakingNow(s)!.priority > GA_EVENTS.vo_greeting.priority, 'the warning is the more important line');
    assert.equal(s.caption?.text, GA_LINES.vo_warning.en.text);
    assert.equal(gaFact(s, 'lineRefused'), 0);
    s = run(s, greet);
    assert.equal(gaFact(s, 'lineRefused'), 1);
    assert.ok(s.log.some((l) => l.kind === 'refused' && l.text === 'Guide: greeting REFUSED: a more important line is speaking'));
    assert.ok(s.log.some((l) => l.kind === 'stop' && l.text === 'Guide: greeting INTERRUPTED by a more important line'));
    assert.equal(speakingNow(s)?.event, 'vo_warning', 'the refused line changed nothing');
  });

  it('the language swap changes the text AND the file of BOTH lines, and the model counts the take that started', () => {
    for (const line of CHC_LINES) {
      const en = lineTake(line.id, 'en');
      const es = lineTake(line.id, 'es');
      assert.notEqual(en.asset, es.asset, line.name);
      assert.match(en.file, /_EN\.wav$/);
      assert.match(es.file, /_ES\.wav$/);
      assert.equal(es.text, GA_LINES[line.id].es.text);
      const post: GaAction = { type: 'post', event: line.id, owner: 'guide' };
      let s = run(gaInitial(), post);
      assert.equal(gaFact(s, lineTakeFact(line.id, 'en')), 1);
      assert.equal(gaFact(s, lineTakeFact(line.id, 'es')), 0);
      s = run(gaInitial(), { type: 'option', patch: { language: 'es' } }, post);
      assert.equal(s.log.find((l) => l.kind === 'mix')?.text, 'SETTING language: Spanish');
      assert.equal(gaFact(s, lineTakeFact(line.id, 'es')), 1);
      assert.equal(s.caption?.text, es.text);
    }
  });

  it('each Spanish take IS the longer file (the page says so without a number)', () => {
    for (const line of CHC_LINES) {
      const en = gaSoundSeconds(lineTake(line.id, 'en').asset);
      const es = gaSoundSeconds(lineTake(line.id, 'es').asset);
      assert.ok(es > en + 0.2, `${line.name}: EN ${en.toFixed(2)} s, ES ${es.toFixed(2)} s`);
    }
  });
});
