/**
 * Game Audio lab — pages 11–15 (Chapter 3, Space, and Chapter 4, Music and
 * voice): the pure files behind them (pages/data/chcSpace.ts,
 * pages/data/chcMusicVoice.ts), and the claims those pages make to the
 * learner, proven on the model with no device.
 *
 * These check RELATIONSHIPS a page states ("straight ahead and straight
 * behind pan the same", "the level drops 6 dB each time the distance
 * doubles", "turn until it is straight behind, then STEP: it goes virtual",
 * "the withdrawn request never plays", "the Spanish take is the longer
 * file"), that every goal a page shows can be reached with SOUND OFF, and
 * the fixes of the 2026-11-12 audit round (walk W1 F01/F14, W2-03/07/15/16/
 * 21/22/24, accuracy A3/A5/B1/B4/B6, learning L-08/L-11/L-14/L-15/L-16).
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { GA_EVENTS, GA_LINES } from '../src/screens/lab/gameaudio/model/gaDefs.ts';
import { gaFact, gaInitial, gaListenDistance, gaReduce, gaReverbAvailable, gaVoiceCount, listenerOf, type GaAction, type GaState } from '../src/screens/lab/gameaudio/model/gaModel.ts';
import { GA_PAN_WIDTH, OBSTRUCTED, PLACES, START, WALL_X, WORLD_W, attenuationGain, zoneAt } from '../src/screens/lab/gameaudio/model/gaWorld.ts';
import { gaSoundSeconds } from '../src/screens/lab/gameaudio/sounds/gaSoundBank.ts';
import { MUSIC_BAR_S, MUSIC_BEAT_S, MUSIC_BPM, MUSIC_LOOP_S } from '../src/screens/lab/gameaudio/sounds/gaSynth.ts';
import {
  CHC_BOUNDARY_S,
  CHC_LANGUAGE_VERSIONS_NOTE,
  CHC_LAYER_UNHEARD,
  CHC_LINES,
  P14_LOG,
  lastSpeech,
  lineTake,
  lineTakeFact,
  musicRows,
  p14Log,
  p15Log,
  pendingLine,
  pendingShort,
  speakingNow,
} from '../src/screens/lab/gameaudio/pages/data/chcMusicVoice.ts';
import {
  CHC_BEHIND_DEG,
  CHC_SOURCES,
  P11_LOG,
  WALK_EDGE,
  WALK_GEN_RANGE_X,
  WALK_Y,
  WALL_DB,
  WALL_FILTER_SLOPE,
  WALL_FILTER_WORD,
  WALL_HZ,
  atClosedDoor,
  chcSpace,
  directionWord,
  isStraightBehind,
  levelWord,
  outputActions,
  outputOf,
  p13Log,
  panShort,
  panWord,
  sideWord,
  statusWord,
  walkLine,
  walkPlace,
  walkV,
  walkX,
  wallRows,
} from '../src/screens/lab/gameaudio/pages/data/chcSpace.ts';
import { G11 } from '../src/screens/lab/gameaudio/pages/guides/p11.ts';
import { G12 } from '../src/screens/lab/gameaudio/pages/guides/p12.ts';
import { G13 } from '../src/screens/lab/gameaudio/pages/guides/p13.ts';
import { G14 } from '../src/screens/lab/gameaudio/pages/guides/p14.ts';
import { G15 } from '../src/screens/lab/gameaudio/pages/guides/p15.ts';

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

/** A page's source, comments removed (what a learner can read). */
const PAGES = 'src/screens/lab/gameaudio/pages/';
const pageSrc = (f: string) => readFileSync(`${PAGES}${f}`, 'utf8').replace(/\r\n/g, '\n').replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
/** Lesson prose: the words inside <P>, <Do>, <Look>, <Note> (the learning
 *  audit's measure; an expression counts as one word). */
function lessonWords(src: string): number {
  let n = 0;
  for (const m of src.matchAll(/<(P|Do|Look|Note)(\s[^>]*)?>([\s\S]*?)<\/\1>/g)) n += m[3].replace(/\{[^}]*\}/g, 'X').trim().split(/\s+/).filter(Boolean).length;
  return n;
}
/** The options of each check on a page, in source order. */
function checkOptions(src: string): string[][] {
  return [...src.matchAll(/options=\{\[([\s\S]*?)\]\}/g)].map((m) => [...m[1].matchAll(/'((?:[^'\\]|\\.)*)'/g)].map((x) => x[1]));
}
const FILES = ['p11Distance.tsx', 'p12Walls.tsx', 'p13Formats.tsx', 'p14Music.tsx', 'p15Dialogue.tsx'];

describe('page 11 — distance and pan (chcSpace)', () => {
  it('full level inside the minimum, −6 dB per doubling beyond it, silence at the maximum', () => {
    const { min, max } = GA_EVENTS.generator.atten!;
    assert.deepEqual([min, max], [4, 12], 'the model builder’s numbers (audit 2, F6 and W1 F01)');
    const inside = chcSpace(standing(G.x - min * 0.9, G.y, 90), 'generator-1');
    assert.equal(inside.zone, 'full');
    assert.equal(inside.gain, 1);
    assert.match(levelWord(inside), /^FULL LEVEL/);
    const near = chcSpace(standing(G.x - min * 1.2, G.y, 90), 'generator-1');
    const far = chcSpace(standing(G.x - min * 2.4, G.y, 90), 'generator-1');
    assert.ok(min * 2.4 <= min + (max - min) * 0.8, 'both points are before the last-fifth fade');
    assert.equal(near.zone, 'falling');
    assert.ok(Math.abs(near.levelDb - far.levelDb - 6.02) < 0.01, `doubling drops ${(near.levelDb - far.levelDb).toFixed(2)} dB`);
    assert.match(levelWord(far), /dB below full level$/);
    const out = chcSpace(standing(G.x - max, G.y, 90), 'generator-1');
    assert.equal(out.zone, 'silent');
    assert.equal(out.gain, 0);
    assert.match(levelWord(out), /^SILENT/);
  });

  it('a source straight ahead and one straight behind pan the same: the center', () => {
    const ahead = chcSpace(standing(G.x - 5, G.y, 90), 'generator-1');
    const behind = chcSpace(standing(G.x - 5, G.y, 270), 'generator-1');
    assert.ok(Math.abs(ahead.bearingDeg) < 1e-9);
    assert.ok(Math.abs(Math.abs(behind.bearingDeg) - 180) < 1e-9);
    assert.equal(panWord(ahead.pan), 'CENTER');
    assert.equal(panWord(behind.pan), 'CENTER');
    assert.equal(panShort(behind.pan), 'CENTER');
    assert.equal(directionWord(ahead.bearingDeg), 'straight ahead');
    assert.equal(directionWord(behind.bearingDeg), 'straight behind');
    const front30 = chcSpace(standing(G.x - 5, G.y, 60), 'generator-1');
    const back30 = chcSpace(standing(G.x - 5, G.y, 300), 'generator-1');
    assert.ok(Math.abs(front30.pan - back30.pan) < 1e-9, 'the same angle in front and behind gives the same pan');
    assert.equal(sideWord(front30.bearingDeg), 'AHEAD');
    assert.equal(sideWord(back30.bearingDeg), 'BEHIND');
  });

  it('a source square to the right pans right as far as the model goes (85%), and the words say which side', () => {
    const right = chcSpace(standing(G.x - 5, G.y, 0), 'generator-1');
    assert.ok(Math.abs(right.pan - GA_PAN_WIDTH) < 1e-9);
    assert.equal(panWord(right.pan), `RIGHT ${Math.round(GA_PAN_WIDTH * 100)}%`);
    assert.equal(panShort(right.pan), `R ${Math.round(GA_PAN_WIDTH * 100)}%`);
    assert.equal(sideWord(right.bearingDeg), 'RIGHT');
    assert.equal(directionWord(right.bearingDeg), '90° to your right, at your side');
    assert.equal(directionWord(-120), '120° to your left, behind you');
    assert.equal(directionWord(40), '40° to your right, in front');
  });

  it('W1 F14: the card says “straight behind” exactly when the goal chip counts it', () => {
    assert.equal(CHC_BEHIND_DEG, 170);
    for (let d = -180; d <= 180; d += 0.5) {
      const says = directionWord(d).includes('straight behind');
      assert.equal(says, isStraightBehind(d), `${d}° reads "${directionWord(d)}"`);
    }
    const src = pageSrc('p11Distance.tsx');
    assert.match(src, /isStraightBehind\(r\.bearingDeg\)/, 'the goal uses the same test');
    assert.match(src, /“straight behind”/, 'step 3 names the card’s words');
    assert.match(src, /BEHIND YOU from a quarter turn/, 'and says how the picture’s BEHIND YOU mark differs');
  });

  it('from the start, FACING (5° steps) can put the generator straight behind you', () => {
    const best = Array.from({ length: 72 }, (_, i) => i * 5)
      .map((f) => chcSpace(run(gaInitial(), { type: 'face', who: 'player', facing: f }), 'generator-1'))
      .sort((a, b) => Math.abs(b.bearingDeg) - Math.abs(a.bearingDeg))[0];
    assert.ok(isStraightBehind(best.bearingDeg), `best is ${best.bearingDeg.toFixed(1)}°`);
    assert.ok(Math.abs(best.pan) < 0.06, 'and the pan is back near the center');
  });

  it('W1 F01: the walk to VIRTUAL cannot go wrong: any FACING 250–290° from the clean open goes VIRTUAL in 5–6 steps', () => {
    assert.ok(!G11.tryThis.join(' ').includes('255°'), 'the guide no longer needs one magic number');
    for (let f = 250; f <= 290; f += 5) {
      let s = run(opened(), { type: 'machine', id: 'generator-1', on: true }, { type: 'face', who: 'player', facing: f });
      assert.equal(s.soundOn, false);
      let steps = 0;
      while (gaFact(s, 'virtual') === 0 && steps < 12) {
        s = run(s, { type: 'step', who: 'player' });
        steps++;
      }
      assert.ok(gaFact(s, 'virtual') > 0 && steps <= 6, `FACING ${f}°: ${steps} steps`);
      const r = chcSpace(s, 'generator-1');
      assert.ok(r.playing && r.virtual && r.zone === 'silent');
      assert.equal(statusWord(r), 'VIRTUAL: tracked, not played');
    }
  });

  it('W1 F01: from ANYWHERE in the courtyard, straight behind you and inside the maximum, STEP reaches VIRTUAL', () => {
    const { max } = GA_EVENTS.generator.atten!;
    let tried = 0;
    for (let x = 0.9; x <= WALL_X - 0.45; x += 0.9) {
      for (let y = 0.9; y <= 9.1; y += 0.9) {
        for (let f = 0; f < 360; f += 5) {
          let s = run(opened(), { type: 'machine', id: 'generator-1', on: true });
          s = run(standing(x, y, f, s), { type: 'face', who: 'player', facing: f });
          const r = chcSpace(s, 'generator-1');
          if (!isStraightBehind(r.bearingDeg) || r.distanceM >= max) continue;
          tried++;
          const v0 = gaFact(s, 'virtual');
          for (let k = 0; k < 20 && gaFact(s, 'virtual') === v0; k++) s = run(s, { type: 'step', who: 'player' });
          assert.ok(gaFact(s, 'virtual') > v0, `from (${x.toFixed(1)}, ${y.toFixed(1)}) facing ${f}°`);
        }
      }
    }
    assert.ok(tried > 50, `${tried} starting points`);
  });

  it('W1 F01: a STEP that cannot move posts no footstep and logs a NOTE, which this page’s log shows', () => {
    let s = run(opened(), { type: 'face', who: 'player', facing: 270 });
    for (let i = 0; i < 8; i++) s = run(s, { type: 'step', who: 'player' });
    const before = gaFact(s, 'step:player:stone');
    s = run(s, { type: 'step', who: 'player' });
    assert.equal(gaFact(s, 'step:player:stone'), before, 'no foot touched the ground');
    const note = s.log.filter((l) => l.kind === 'note').pop();
    assert.ok(note && /edge of the scene: no step was taken/.test(note.text), note?.text);
    assert.ok(P11_LOG.includes('note') && P11_LOG.includes('state'), 'page 11 shows NOTE lines as well as STATE lines');
    assert.match(pageSrc('p11Distance.tsx'), /only=\{P11_LOG\}/);
  });

  it('sound off: VIRTUAL, then back in range: played again (STATE lines)', () => {
    let s = run(opened(), { type: 'machine', id: 'generator-1', on: true }, { type: 'face', who: 'player', facing: 270 });
    while (gaFact(s, 'virtual') === 0) s = run(s, { type: 'step', who: 'player' });
    const stateLines = s.log.filter((l) => l.kind === 'state');
    assert.equal(stateLines[stateLines.length - 1].text, 'Generator left its maximum distance: VIRTUAL (tracked, not played)');
    s = run(s, { type: 'face', who: 'player', facing: 90 }, { type: 'step', who: 'player' }, { type: 'step', who: 'player' });
    assert.ok(s.log.some((l) => l.kind === 'state' && l.text === 'Generator is back in range: played again'));
    assert.equal(chcSpace(s, 'generator-1').virtual, false);
  });

  it('SOUND ON: a loop that goes virtual really comes back with sound (the engine’s stop is not its end)', () => {
    let s = run(soundOn(), { type: 'enterPage' }, { type: 'sound', on: true }, { type: 'machine', id: 'generator-1', on: true }, { type: 'face', who: 'player', facing: 270 });
    let stopped: string[] = [];
    while (gaFact(s, 'virtual') === 0) {
      const r = gaReduce(s, { type: 'step', who: 'player' });
      s = r.state;
      stopped = r.cmds.filter((c) => c.t === 'stop').map((c) => (c as { v: string }).v);
    }
    assert.ok(stopped.length > 0, 'the voices were stopped in the engine');
    for (const v of stopped) s = run(s, { type: 'engine', evt: { e: 'ended', v, why: 'stopped' } });
    assert.ok(chcSpace(s, 'generator-1').playing, 'the instance is still tracked after the engine confirms the stop');
    s = run(s, { type: 'face', who: 'player', facing: 90 });
    let starts = 0;
    for (let k = 0; k < 3; k++) {
      const r = gaReduce(s, { type: 'step', who: 'player' });
      s = r.state;
      starts += r.cmds.filter((c) => c.t === 'start').length;
    }
    assert.ok(starts >= 2, `the hum and the fan start again (${starts} starts)`);
    assert.equal(chcSpace(s, 'generator-1').virtual, false);
  });

  it('B6: the guide’s “6 dB” experiment says where it holds; the rule the page states holds there', () => {
    assert.match(G11.tryThis[0], /stop before the MIN ring/);
    const a = GA_EVENTS.fountain.atten!;
    const fadeFrom = a.min + (a.max - a.min) * 0.8;
    assert.ok(fadeFrom >= 7, 'the guide says "Start closer than 7 m"');
    const F = PLACES.fountain;
    const at = (d: number) => chcSpace(standing(F.x + d, F.y, 270), 'fountain');
    assert.ok(Math.abs(at(3.5).levelDb - at(7).levelDb - 6.02) < 0.01, 'from the half distance the level is 6 dB higher');
    assert.ok(at(a.min * 0.9).levelDb - at(a.min * 1.8).levelDb < 6, 'inside MIN it does not hold: the caveat is needed');
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

  it('a source that is not switched on is measured but not "playing"; its name is the chips’ name', () => {
    const r = chcSpace(gaInitial(), 'fountain');
    assert.equal(r.playing, false);
    assert.equal(r.virtual, false);
    assert.equal(statusWord(r), 'Not switched on');
    assert.ok(r.distanceM > 0);
    assert.equal(CHC_SOURCES['generator-1'].name, 'GENERATOR 1', 'one name for the generator (L-07)');
  });
});

describe('page 12 — the wall, and the WALK lane', () => {
  it('the numbers the page and its guide print are the model’s treatment, a low-pass at 12 dB per octave (B1)', () => {
    assert.equal(WALL_DB, -9);
    assert.equal(WALL_HZ, OBSTRUCTED.lowpassHz);
    assert.equal(WALL_HZ, 900);
    assert.equal(WALL_FILTER_SLOPE, '12 dB per octave');
    assert.equal(WALL_FILTER_WORD, 'Low-pass at about 900 Hz');
    const text = G12.changes.join(' ');
    assert.ok(text.includes(`${Math.abs(WALL_DB)} dB`) && text.includes(`${WALL_HZ} Hz`), 'the guide quotes the same two numbers');
    const all = [pageSrc('p12Walls.tsx'), ...Object.values(G12).flat().map(String)].join(' ');
    assert.ok(!/cuts? (the sound )?above|filters out/i.test(all), 'a low-pass turns the high part down; it does not cut it off');
    assert.match(pageSrc('p12Walls.tsx'), /WALL_FILTER_SLOPE/);
  });

  it('A3: the page says the scene has no line of sight, and the model agrees (door open = clear, from anywhere)', () => {
    assert.match(pageSrc('p12Walls.tsx'), /no line of sight/);
    const s = run(standing(1, 1, 90, run(gaInitial(), { type: 'machine', id: 'generator-1', on: true })), { type: 'door' });
    assert.equal(chcSpace(s, 'generator-1').obstructed, false, 'a corner far from the doorway still hears it clear');
  });

  it('the closed door is in the way from the courtyard; opening it clears it; inside the room it never is', () => {
    let s = run(gaInitial(), { type: 'machine', id: 'generator-1', on: true });
    assert.ok(chcSpace(s, 'generator-1').obstructed);
    s = run(s, { type: 'door' });
    assert.equal(chcSpace(s, 'generator-1').obstructed, false);
    assert.equal(gaFact(s, 'doorOpened'), 1);
    s = run(s, { type: 'move', who: 'player', x: walkX(0.75), y: WALK_Y });
    assert.equal(zoneAt(listenerOf(s)), 'room');
    assert.equal(walkPlace(s), 'WORKSHOP');
    assert.equal(gaFact(s, 'zoneCross'), 1);
    s = run(s, { type: 'door' });
    assert.equal(chcSpace(s, 'generator-1').obstructed, false, 'same room: the door is not between you');
    assert.ok(chcSpace(s, 'fountain').obstructed, 'now the fountain is the one behind the door');
  });

  it('W2-21: the card never prints a treatment on a sound that is not playing: it says what WOULD apply', () => {
    const off = wallRows(chcSpace(opened(), 'generator-1'));
    assert.equal(off.sounding, false);
    assert.equal(off.level, 'Would be 9 dB lower');
    assert.equal(off.filter, 'Would be a low-pass at about 900 Hz');
    const on = wallRows(chcSpace(run(opened(), { type: 'machine', id: 'generator-1', on: true }), 'generator-1'));
    assert.deepEqual(on, { level: '9 dB lower', filter: 'Low-pass at about 900 Hz', sounding: true });
    const open = wallRows(chcSpace(run(opened(), { type: 'machine', id: 'generator-1', on: true }, { type: 'door' }), 'generator-1'));
    assert.deepEqual([open.level, open.filter], ['None', 'None']);
  });

  it('L-14 / W2-21: goal 1 is something the learner does and reads, judged from a sounding source', () => {
    const src = pageSrc('p12Walls.tsx');
    assert.ok(!/label: 'Hear/.test(src), 'no goal claims the learner heard something');
    assert.match(src, /label: 'Run GENERATOR 1 behind the closed door: GEN 1 reads MUFFLED', hit: since\('inst:generator'\) > 0 && wall\.sounding && gen\.obstructed/);
  });

  it('WALK keeps the model’s edge, never asks for a place inside the wall, and round-trips', () => {
    assert.equal(WALK_EDGE, 0.9);
    for (let i = 0; i <= 200; i++) {
      const x = walkX(i / 200);
      assert.ok(Math.abs(x - WALL_X) >= 0.45 - 1e-9, `x = ${x}`);
      assert.ok(x >= WALK_EDGE && x <= WORLD_W - WALK_EDGE);
      const got = run(run(opened(), { type: 'door' }), { type: 'move', who: 'player', x, y: WALK_Y }).chars.player.x;
      assert.ok(Math.abs(got - x) < 1e-9, `asked ${x}, got ${got}`);
    }
    assert.equal(walkX(-1), WALK_EDGE);
    assert.equal(walkX(2), WORLD_W - WALK_EDGE);
    for (const v of [0, 0.2, 0.5, 0.9, 1]) assert.ok(Math.abs(walkV(walkX(v)) - v) < 0.01 || Math.abs(walkX(v) - WALL_X) <= 0.45 + 1e-9);
  });

  it('with the door closed the walk stops at the wall; the lane’s captions fit the lane; the key says COURTYARD / WORKSHOP', () => {
    let s = opened();
    assert.match(walkLine(s), /^COURTYARD · 3\.8 m TO WALL$/);
    assert.equal(walkPlace(s), 'COURTYARD');
    s = run(s, { type: 'move', who: 'player', x: walkX(0.9), y: WALK_Y });
    assert.equal(zoneAt(s.chars.player), 'yard');
    assert.ok(atClosedDoor(s));
    assert.equal(walkLine(s), 'DOOR CLOSED: STOPPED AT THE WALL');
    s = run(s, { type: 'door' }, { type: 'move', who: 'player', x: walkX(0.9), y: WALK_Y });
    assert.equal(zoneAt(s.chars.player), 'room');
    assert.match(walkLine(s), /^WORKSHOP · \d+\.\d m IN$/);
    for (const v of [0, 0.3, 0.55, 0.62, 1]) assert.ok(walkLine(run(s, { type: 'move', who: 'player', x: walkX(v), y: WALK_Y })).length <= 32);
  });

  it('a STEP into the closed door makes no footstep, and a NOTE says why', () => {
    let s = run(opened(), { type: 'move', who: 'player', x: walkX(0.9), y: WALK_Y });
    assert.ok(atClosedDoor(s));
    const steps = gaFact(s, 'step:player:stone');
    s = run(s, { type: 'step', who: 'player', dx: 0.7, dy: 0 });
    assert.equal(gaFact(s, 'step:player:stone'), steps);
    assert.match(s.log[s.log.length - 1].text, /^YOU are at the closed door: no step was taken, so no footstep plays/);
  });

  it('the WALK lane’s west end is past the generator’s maximum: VIRTUAL there, played everywhere east of it, and the card says why', () => {
    const s = run(opened(), { type: 'machine', id: 'generator-1', on: true });
    assert.ok(WALK_GEN_RANGE_X > WALK_EDGE && WALK_GEN_RANGE_X < WALL_X, `range ends at x = ${WALK_GEN_RANGE_X.toFixed(2)}`);
    let virtualSeen = 0;
    for (let i = 0; i <= 50; i++) {
      const x = walkX(i / 50);
      const r = chcSpace(run(s, { type: 'move', who: 'player', x, y: WALK_Y }), 'generator-1');
      if (Math.abs(x - WALK_GEN_RANGE_X) < 0.05) continue;
      assert.equal(r.virtual, x < WALK_GEN_RANGE_X, `at x = ${x}`);
      if (r.virtual) {
        virtualSeen++;
        assert.equal(wallRows(r).sounding, false, 'a virtual source gets "would be", never a treatment');
      }
    }
    assert.ok(virtualSeen > 0);
    assert.match(pageSrc('p12Walls.tsx'), /past GENERATOR 1’s maximum distance/);
    assert.match(G12.tryThis.join(' '), /far west end of the path\. GEN 1 reads VIRTUAL/);
  });

  it('the reverb goal’s facts are counted with sound off; a device with no reverb is said, not hidden', () => {
    let s = run(gaInitial(), { type: 'option', patch: { reverb: false } }, { type: 'option', patch: { reverb: true } });
    assert.equal(gaFact(s, 'option:reverb:false'), 1);
    assert.equal(gaFact(s, 'option:reverb:true'), 1);
    assert.deepEqual(s.log.slice(-2).map((l) => `${l.kind} ${l.text}`), ['mix SETTING workshop reverb: OFF', 'mix SETTING workshop reverb: ON']);
    assert.equal(gaReverbAvailable(s), true);
    s = run(s, { type: 'engine', evt: { e: 'reverb', ok: false } });
    assert.equal(gaReverbAvailable(s), false);
    const src = pageSrc('p12Walls.tsx');
    assert.match(src, /gaReverbAvailable\(s\)/);
    assert.match(src, /could not load the room reverb, so REVERB and DRY sound the same here/);
    assert.match(src, /listen for a short, quiet tail of room sound/, 'step 3 says what to listen for');
    assert.match(src, /With SOUND off, watch the strip’s REVERB window: DRY flattens the tail\./, 'and what to read with sound off');
    assert.match(src, /The strip’s curve shows both/, 'the wall strip is named where the treatment is taught');
  });
});

describe('page 13 — output formats', () => {
  it('the renderer, the fold-down and a turn are counted', () => {
    const s = run(gaInitial(), { type: 'scene', on: true }, { type: 'pan', mode: 'hrtf' }, { type: 'face', who: 'player', facing: 180 }, { type: 'mono', on: true });
    assert.equal(gaFact(s, 'pan:hrtf'), 1);
    assert.equal(gaFact(s, 'turned'), 1);
    assert.equal(gaFact(s, 'monoOn'), 1);
    // from the start the fountain is 127° round: BEHIND, as the picture's BEHIND YOU mark says (more than 90°)
    assert.equal(sideWord(chcSpace(gaInitial(), 'fountain').bearingDeg), 'BEHIND');
    for (const d of [-180, -127, -91, 91, 150]) assert.equal(sideWord(d), 'BEHIND', `${d}°`);
    assert.deepEqual([sideWord(-90), sideWord(60), sideWord(0)], ['LEFT', 'RIGHT', 'AHEAD']);
  });

  it('W2-07: leaving MONO for STEREO sets the renderer first, so the log never says “headphone 3D again” on the way', () => {
    let s = run(opened(), { type: 'scene', on: true }, { type: 'pan', mode: 'hrtf' }, { type: 'mono', on: true });
    assert.equal(outputOf(s), 'mono');
    const acts = outputActions(s, 'stereo');
    assert.deepEqual(acts, [{ type: 'pan', mode: 'stereo' }, { type: 'mono', on: false }]);
    s = run(s, ...acts);
    assert.equal(outputOf(s), 'stereo');
    assert.equal(s.log[s.log.length - 1].text, 'OUTPUT no longer folded to mono: stereo again');
    assert.ok(!s.log.slice(-2).some((l) => l.text.includes('headphone 3D (binaural) again')));
    assert.deepEqual(outputActions(s, 'stereo'), [], 'a choice in force sends nothing');
    s = run(s, ...outputActions(s, 'mono'));
    s = run(s, ...outputActions(s, 'hrtf'));
    assert.equal(outputOf(s), 'hrtf');
    assert.equal(s.mono, false);
  });

  it('switching the renderer restarts nothing: every instance plays on', () => {
    let s = run(opened(), { type: 'scene', on: true });
    const ids = s.inst.filter((i) => i.event !== 'bird').map((i) => i.id).sort();
    for (const o of ['hrtf', 'mono', 'stereo', 'hrtf'] as const) s = run(s, ...outputActions(s, o));
    assert.deepEqual(s.inst.filter((i) => i.event !== 'bird').map((i) => i.id).sort(), ids);
    assert.ok(!s.log.some((l) => l.kind === 'stop'));
  });

  it('W2-22: the page’s log shows the OUTPUT lines and ■ STOP; its empty text never says nothing happened', () => {
    let s = run(opened(), { type: 'scene', on: true });
    assert.equal(p13Log(s).log.length, 0, 'three sounds started, and none is an OUTPUT line');
    assert.match(pageSrc('p13Formats.tsx'), /empty="No output change yet\./);
    s = run(s, ...outputActions(s, 'hrtf'), { type: 'stopAll' });
    assert.deepEqual(
      p13Log(s).log.map((l) => l.text.split(':')[0]),
      ['RENDERER', 'STOP ALL'],
    );
  });

  it('W2-24 / L-15: the tray marks its choice with ✓; outputs are paired with their ideas; the 5.1 map is a still picture', () => {
    const src = pageSrc('p13Formats.tsx');
    assert.match(src, /label: marked\('STEREO', out === 'stereo'\)/);
    assert.match(src, /STEREO and MONO are channel-based audio/);
    assert.match(src, /HEADPHONE 3D is binaural rendering/);
    assert.match(src, /Object-based audio is a third idea, not played here/);
    assert.match(src, /That filter is called an HRTF/, 'HRTF is explained where it is used');
    assert.match(src, /strip the fountain slides along the line between your ears/, 'the output strip is named for STEREO');
    assert.match(src, /In MONO both bars stay equal as you turn/);
    assert.match(G13.seeing.join(' '), /still map/);
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

  it('from the clean start the fountain is in range, so SCENE on is enough to hear it turn', () => {
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
    assert.deepEqual(musicRows(s).map((r) => r.state), ['heard', 'zero', 'zero']);
    assert.equal(musicRows(s)[0].word, 'HEARD');
    assert.equal(pendingShort(s), 'NONE');
    assert.equal(pendingLine(s), 'Nothing is waiting.');
    s = run(s, { type: 'musicLayer', layer: 'pulse', on: true });
    const req = s.music.pending!.req;
    assert.deepEqual(musicRows(s).map((r) => r.state), ['heard', 'coming', 'zero']);
    assert.equal(pendingShort(s), 'WAITING', 'before the engine answers there is no time to count');
    assert.equal(pendingLine(s), 'Add PULSE: lands on the next bar line.');
    s = run(s, { type: 'engine', evt: { e: 'music', what: 'queued', req, at: 10, inS: 1.4, boundary: 'bar' } });
    assert.equal(pendingShort(s), '1.4 s');
    assert.equal(pendingLine(s), 'Add PULSE: lands on the next bar line in 1.4 s.');
    s = run(s, { type: 'engine', evt: { e: 'music', what: 'applied', req, at: 10 } });
    assert.deepEqual(musicRows(s).map((r) => r.state), ['heard', 'heard', 'zero']);
    s = run(s, { type: 'musicLayer', layer: 'pulse', on: false });
    assert.deepEqual(musicRows(s).map((r) => r.state), ['heard', 'going', 'zero']);
  });

  it('W2-23 / L-08: PENDING COUNTS DOWN from the model’s due time, to zero, never below', () => {
    const s = run(gaInitial(), { type: 'musicStart' }, { type: 'musicLayer', layer: 'pulse', on: true });
    const due = s.music.pending!.due!;
    assert.equal(pendingShort(s, s.t), '2.5 s');
    assert.equal(pendingShort(s, s.t + 1.0), '1.5 s');
    assert.equal(pendingShort(s, due + 0.3), '0.0 s');
    assert.match(pendingLine(s, s.t + 2), /in 0\.5 s\.$/);
    assert.match(pageSrc('p14Music.tsx'), /watch PENDING in the tray until it reads “Nothing is waiting\.”/, 'step 2 points at what the open tray shows');
  });

  it('W2-15: a stinger waits as PENDING too, only one waits, it is logged as played, and PLAYING counts it while VOICES does not', () => {
    let s = run(gaInitial(), { type: 'musicStart' }, { type: 'stinger' });
    assert.ok(s.music.stinger);
    assert.match(pendingShort(s), /^\d+\.\d s$/);
    assert.match(pendingLine(s), /^STINGER: its hit lands on the next bar line in \d+\.\d s\.$/);
    const req = s.music.stinger!.req;
    s = run(s, { type: 'stinger' });
    assert.equal(s.music.stinger!.req, req, 'a second press is not a second stinger');
    assert.equal(s.log[s.log.length - 1].kind, 'note');
    assert.ok(P14_LOG.includes('note'), 'and the page’s log shows that NOTE');
    s = run(s, { type: 'engine', evt: { e: 'music', what: 'applied', req, at: 0 } });
    assert.equal(gaFact(s, 'stingerPlayed'), 1);
    assert.equal(s.log[s.log.length - 1].text, 'STINGER played exactly on the bar line (its hit lands on the line) → MUSIC bus (not heard: sound is off)');
    assert.ok(s.inst.some((i) => i.event === 'stinger'), 'PLAYING counts the stinger while it sounds');
    assert.equal(gaVoiceCount(s), 0, 'VOICES leaves the music out (decision 5)');
    assert.match(pageSrc('p14Music.tsx'), /PLAYING counts a stinger while it sounds\. VOICES leaves the music out: this scene simplifies\. A real engine counts each music layer as a voice\./);
    assert.match(pageSrc('p14Music.tsx'), /since\('stingerPlayed'\)/, 'the goal waits for the stinger to PLAY, not for the press');
  });

  it('W2-15: STOP MUSIC with a change waiting logs it withdrawn and puts the layers back', () => {
    let s = run(gaInitial(), { type: 'musicStart' }, { type: 'musicLayer', layer: 'drive', on: true }, { type: 'musicStop' });
    assert.ok(s.log.some((l) => l.text === 'The waiting change (add DRIVE) is WITHDRAWN: the music stopped first'));
    assert.equal(s.music.layers.drive, false);
    s = run(s, { type: 'musicStart' });
    assert.deepEqual(musicRows(s).map((r) => r.state), ['heard', 'zero', 'zero']);
  });

  it('sound on: ALERT then CALM before the boundary — the first is WITHDRAWN and nothing is left waiting to come in', () => {
    let s = run(soundOn(), { type: 'musicStart' });
    s = run(s, { type: 'option', patch: { musicBoundary: 'phrase' } }, { type: 'mood', mood: 'alert' });
    assert.deepEqual(musicRows(s).map((r) => r.state), ['heard', 'coming', 'coming']);
    s = run(s, { type: 'mood', mood: 'calm' });
    assert.equal(gaFact(s, 'musicWithdrawn'), 1);
    assert.ok(s.log.some((l) => l.text === 'The waiting change (add PULSE and DRIVE) is WITHDRAWN: a newer one replaces it'));
    assert.deepEqual(musicRows(s).map((r) => r.state), ['heard', 'zero', 'zero']);
    assert.equal(pendingLine(s), 'Back to CALM only (that is what plays now, so nothing changes): lands at the end of the phrase.');
  });

  it('step 3 on screen: ALERT sounding, CALM then ALERT again — the waiting request is named as changing nothing', () => {
    let s = run(gaInitial(), { type: 'musicStart' }, { type: 'mood', mood: 'alert' });
    s = run(s, { type: 'engine', evt: { e: 'music', what: 'applied', req: s.music.pending!.req, at: 0 } });
    s = run(s, { type: 'option', patch: { musicBoundary: 'phrase' } }, { type: 'mood', mood: 'calm' });
    assert.match(pendingLine(s), /^Back to CALM only: lands at the end of the phrase in \d+\.\d s\.$/);
    s = run(s, { type: 'mood', mood: 'alert' });
    assert.match(pendingLine(s), /^Add PULSE and DRIVE \(that is what plays now, so nothing changes\): lands at the end of the phrase/);
    assert.deepEqual(musicRows(s).map((r) => r.state), ['heard', 'heard', 'heard']);
  });

  it('sound off: a request still waits for its boundary, and a change of mind withdraws it — every goal is reachable unheard', () => {
    let s = run(gaInitial(), { type: 'musicStart' });
    assert.equal(s.soundOn, false);
    s = run(s, { type: 'musicLayer', layer: 'pulse', on: true });
    assert.ok(s.music.pending, 'the request waits');
    assert.equal(s.music.pending!.inS, CHC_BOUNDARY_S.bar, 'a whole bar from the music’s start, in scene time');
    assert.equal(pendingShort(s), '2.5 s');
    assert.deepEqual(musicRows(s).map((r) => r.state), ['heard', 'coming', 'zero']);
    assert.equal(musicRows(s)[0].word, CHC_LAYER_UNHEARD, 'with sound off a layer that is on does not read HEARD');
    s = run(s, { type: 'engine', evt: { e: 'music', what: 'applied', req: s.music.pending!.req, at: 0 } });
    assert.equal(s.music.pending, null);
    assert.equal(s.log[s.log.length - 1].text, 'Add PULSE: APPLIED exactly on the bar line (not heard: sound is off)');
    s = run(s, { type: 'option', patch: { musicBoundary: 'phrase' } });
    assert.equal(s.log[s.log.length - 1].text, 'SETTING music changes land: at the end of the phrase');
    s = run(s, { type: 'mood', mood: 'alert' }, { type: 'mood', mood: 'calm' });
    assert.equal(gaFact(s, 'musicWithdrawn'), 1);
    assert.equal(gaFact(s, 'mood:alert'), 1);
    assert.deepEqual(musicRows(s).map((r) => r.state), ['heard', 'going', 'zero'], 'DRIVE never comes in; PULSE waits to go out');
  });

  it('the page’s written steps, from the clean scene and unheard, reach every goal', () => {
    const land = (x: GaState, req: string) => run(x, { type: 'engine', evt: { e: 'music', what: 'applied', req, at: 0 } });
    let s = opened();
    const f0 = { ...s.facts };
    // "Open MUSIC and press START. Switch PULSE on and watch PENDING … until it reads Nothing is waiting."
    s = run(s, { type: 'musicStart' }, { type: 'musicLayer', layer: 'pulse', on: true });
    assert.ok(s.log.some((l) => l.text === 'Add PULSE: QUEUED for the next bar'));
    s = land(s, s.music.pending!.req);
    assert.equal(pendingLine(s), 'Nothing is waiting.');
    // "Switch PULSE off and wait again. Then press MOOD ALERT." (in the tray's first row)
    s = run(s, { type: 'musicLayer', layer: 'pulse', on: false });
    s = land(s, s.music.pending!.req);
    s = run(s, { type: 'mood', mood: 'alert' });
    s = land(s, s.music.pending!.req);
    assert.equal(gaFact(s, 'musicWithdrawn') - (f0.musicWithdrawn ?? 0), 0, 'nothing was withdrawn while each change was left to land');
    // "Set CHANGE AT to NEXT PHRASE. Press MOOD CALM, then MOOD ALERT again before the phrase ends. Then press STINGER."
    assert.equal(s.mood, 'alert');
    s = run(s, { type: 'option', patch: { musicBoundary: 'phrase' } }, { type: 'mood', mood: 'calm' }, { type: 'mood', mood: 'alert' }, { type: 'stinger' });
    assert.equal(gaFact(s, 'musicWithdrawn') - (f0.musicWithdrawn ?? 0), 1);
    assert.ok(s.log.some((l) => l.text === 'The waiting change (back to CALM only) is WITHDRAWN: a newer one replaces it'));
    s = land(s, s.music.stinger!.req);
    assert.equal(gaFact(s, 'stingerPlayed') - (f0.stingerPlayed ?? 0), 1);
    assert.equal(s.music.on, true);
    // the page's log keeps what the steps name, and ■ STOP
    s = run(s, { type: 'stopAll' });
    const shown = p14Log(s).log.map((l) => l.text);
    assert.ok(shown.some((t) => t.includes('WITHDRAWN')) && shown.some((t) => t.startsWith('SETTING')) && shown.some((t) => t.startsWith('STOP ALL')));
  });

  it('W2-03: MOOD CALM and MOOD ALERT are on the music tray’s first row; the tray carries no rows the chips already say', () => {
    const src = pageSrc('p14Music.tsx');
    const tray = src.slice(src.indexOf('function MusicTray'), src.indexOf('function LayerCard'));
    const firstRow = tray.slice(tray.indexOf('<View style={tray.row}>'), tray.indexOf('</View>'));
    assert.match(firstRow, /MOOD CALM/);
    assert.match(firstRow, /MOOD ALERT/);
    assert.ok(!/stateRow|musicRows/.test(tray), 'no layer state rows in the tray');
    assert.match(tray, /PENDING · \{pendingLine\(s, t\)\}/);
    assert.match(src, /label: marked\(label, s\.options\.musicBoundary === id\)/, 'CHANGE AT marks its choice with ✓ (W2-24)');
  });

  it('sound off: only the NOW boundary applies immediately', () => {
    const s = run(gaInitial(), { type: 'musicStart' }, { type: 'option', patch: { musicBoundary: 'now' } }, { type: 'musicLayer', layer: 'drive', on: true });
    assert.equal(s.music.pending, null);
    assert.equal(gaFact(s, 'musicApplied'), 1);
    assert.equal(s.log[s.log.length - 1].text, 'Add DRIVE: APPLIED immediately (not heard: sound is off)');
  });

  it('before START every layer reads NOT PLAYING; the guide follows the stinger and the tray', () => {
    assert.deepEqual(musicRows(gaInitial()).map((r) => r.word), ['NOT PLAYING', 'NOT PLAYING', 'NOT PLAYING']);
    assert.match(G14.intro!.start, /until it reads “Nothing is waiting\.”/);
    assert.match(G14.tryThis.join(' '), /A short swell leads to a hit on the boundary/);
    assert.ok(!/count your scene’s sounds, not the music/.test(Object.values(G14).flat().join(' ')));
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
    assert.ok(s.log.some((l) => l.kind === 'stop' && /^Guide: greeting \(i\d+\) INTERRUPTED by a more important line: it stops$/.test(l.text)));
    assert.equal(speakingNow(s)?.event, 'vo_warning', 'the refused line changed nothing');
    assert.match(lastSpeech(s)!, /^REFUSED · Guide: greeting REFUSED/, 'the LINES tray shows the newest result');
  });

  it('the page’s log keeps the speech lines and the LANGUAGE setting, not the duck', () => {
    const s = run(gaInitial(), greet, warn, greet, { type: 'option', patch: { language: 'es' } });
    const shown = p15Log(s).log;
    assert.ok(!shown.some((l) => l.text.startsWith('DUCK')), 'DUCK lines are page 16’s');
    assert.ok(shown.some((l) => l.kind === 'stop' && l.text.includes('INTERRUPTED')));
    assert.ok(shown.some((l) => l.kind === 'refused'));
    assert.equal(shown[shown.length - 1].text, 'SETTING language: Spanish');
  });

  it('W2-16: the language swap changes the text AND the file of BOTH lines, and the START lines differ: the same line, a different file', () => {
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
      const enStart = s.log.find((l) => l.kind === 'start')!.text;
      s = run(gaInitial(), { type: 'option', patch: { language: 'es' } }, post);
      assert.equal(s.log.find((l) => l.kind === 'mix')?.text, 'SETTING language: Spanish');
      assert.equal(gaFact(s, lineTakeFact(line.id, 'es')), 1);
      assert.equal(s.caption?.text, es.text);
      const esStart = s.log.find((l) => l.kind === 'start')!.text;
      assert.ok(enStart.includes(en.file) && esStart.includes(es.file) && enStart !== esStart, `${enStart} / ${esStart}`);
    }
    assert.match(pageSrc('p15Dialogue.tsx'), /the same line, a different file/);
  });

  it('each Spanish take IS the longer file, and the card prints each file’s length', () => {
    for (const line of CHC_LINES) {
      const en = lineTake(line.id, 'en');
      const es = lineTake(line.id, 'es');
      assert.equal(en.seconds, gaSoundSeconds(en.asset));
      assert.ok(es.seconds > en.seconds + 0.2, `${line.name}: EN ${en.seconds.toFixed(2)} s, ES ${es.seconds.toFixed(2)} s`);
    }
    assert.match(pageSrc('p15Dialogue.tsx'), /\{k\.take\.seconds\.toFixed\(1\)\} s/);
  });

  it('L-11 / B4: priority’s rule is on the page; “refused” is this scene’s rule; no builder’s note; the trade’s word, said once', () => {
    const src = pageSrc('p15Dialogue.tsx');
    assert.deepEqual(CHC_LINES.map((l) => l.priority), [80, 95]);
    assert.match(src, /Each line has a priority: the higher number wins\./);
    assert.match(src, /In this scene a less important line is refused while a more important one speaks\. Other games make it wait\./);
    assert.ok(!/until real lines are recorded/.test(src));
    assert.match(src, /<Note>\{CHC_LANGUAGE_VERSIONS_NOTE\}<\/Note>/);
    assert.match(CHC_LANGUAGE_VERSIONS_NOTE, /^Making language versions of a game is called localization\./);
    assert.match(CHC_LANGUAGE_VERSIONS_NOTE, /hearing where a sound comes from/, 'and it says what the app’s glossary means by the word');
    assert.match(G15.changes.join(' '), /this scene’s rule; other games make the line wait/);
    assert.ok(!/slider starts on it/i.test(G15.control.join(' ')), 'the phrase every guide uses (L-35)');
  });

  it('L-33: nobody speaking is QUIET on the key and on the readout', () => {
    const src = pageSrc('p15Dialogue.tsx');
    assert.ok(!/'NOBODY'/.test(src));
    assert.equal((src.match(/: 'QUIET'/g) ?? []).length, 2);
  });
});

describe('pages 11–15 — the checks and the length (L-16, L-06)', () => {
  it('on every check the correct option is not the longest', () => {
    for (const f of FILES) {
      const checks = checkOptions(pageSrc(f));
      assert.ok(checks.length >= 1, f);
      for (const opts of checks) {
        assert.equal(opts.length, 4, f);
        const lens = opts.map((o) => o.length);
        assert.ok(lens[0] < Math.max(...lens.slice(1)), `${f}: correct ${lens[0]} vs ${lens.slice(1).join('/')}`);
      }
    }
  });

  it('lesson prose stays near the plan’s 150–260 words', () => {
    for (const f of FILES) {
      const n = lessonWords(pageSrc(f));
      assert.ok(n >= 150 && n <= 265, `${f}: ${n} words`);
    }
  });
});
