/**
 * Game Audio lab — the six "A" instrument strips (pages 1, 5, 6, 8, 9, 10):
 * the pure selectors they draw from (scene/hud/aModel.ts, aLoopShapes.ts),
 * driven by the lab's own reducer.
 *
 * What is pinned here is the TRUTH RULE: a strip shows what the model has
 * playing, at the model's computed level, at the model's time. And the
 * lead's decision 10: a planted fault is never named before its symptom.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { GA_EVENTS, type GaEventId } from '../src/screens/lab/gameaudio/model/gaDefs.ts';
import { gaInitial, gaReduce, gaVoiceOut, type GaAction, type GaState } from '../src/screens/lab/gameaudio/model/gaModel.ts';
import { GA_FAMILIES } from '../src/screens/lab/gameaudio/pages/data/gaFamilies.ts';
import { chbRoute } from '../src/screens/lab/gameaudio/pages/data/chbScene.ts';
import { gaSound } from '../src/screens/lab/gameaudio/sounds/gaSoundBank.ts';
import { A_LOOP_SHAPES, aJoinStep, aShapeOf } from '../src/screens/lab/gameaudio/scene/hud/aLoopShapes.ts';
import {
  A_COLOR_MAX_DB,
  A_COLOR_MIN_DB,
  A_FAMILY_LABEL,
  A_FAMILY_OF,
  A_METER_MAX_DB,
  A_METER_MIN_DB,
  A_SYNC_MARK_S,
  aBedFading,
  aBeds,
  aCats,
  aChainMoving,
  aChainStep,
  aChainSummary,
  aDb,
  aEventLevel,
  aFadeEnd,
  aLevelRows,
  aLevelSummary,
  aLevelWord,
  aMeterFrac,
  aNextStart,
  aNoteTakes,
  aRampEnd,
  aRamping,
  aSyncMark,
  aSymptomSeen,
  aSyncMarked,
  aSyncStep,
  aSyncSummary,
  aTakes,
  aTakesRun,
  aTakesSummary,
  aVoiceHeard,
  type AChain,
  type ASync,
  type ATake,
} from '../src/screens/lab/gameaudio/scene/hud/aModel.ts';

/** Run actions on the model with sound off (the lab works unheard). */
function run(s: GaState, ...actions: GaAction[]): GaState {
  let t = s.t;
  for (const a of actions) {
    t += 0.05;
    s = gaReduce(s, a, t).state;
  }
  return s;
}
/** Let scene time pass with nothing happening. */
const wait = (s: GaState, seconds: number): GaState => gaReduce(s, { type: 'tick', t: s.t + seconds }).state;
/** End every one-shot voice that has run its course (the store does this on a timer). */
function expire(s: GaState, layer?: string): GaState {
  for (const v of s.voices.filter((x) => !x.loop && (layer == null || x.layer === layer))) s = gaReduce(s, { type: 'expire', v: v.v }, s.t).state;
  return s;
}
const fresh = () => gaInitial();
const stepInPlace = (who: 'player' | 'guide' = 'player'): GaAction => ({ type: 'step', who, dx: 0, dy: 0 });
const close = (a: number, b: number, eps = 1e-6) => Math.abs(a - b) <= eps;
/** Let every ramp the model started (LEVEL, a bus, a crossfade) run out. */
const settle = (s: GaState): GaState => {
  const end = aRampEnd(s);
  return end != null && end > s.t ? wait(s, end - s.t + 0.001) : s;
};
const cat = (s: GaState, id: string, t = s.t) => aCats(s, t).find((c) => c.id === id)!;

describe('levels: the strips read the model’s own computed level', () => {
  it('one voice is the model’s gaVoiceOut, with the lab LEVEL in it', () => {
    const s = run(fresh(), { type: 'scene', on: true });
    for (const v of s.voices) assert.equal(aVoiceHeard(s, v, s.t), gaVoiceOut(s, v, s.t).gain);
    // the model ramps LEVEL: read once the ramp has run
    const loud = settle(run(s, { type: 'master', value: 1 }));
    const quiet = settle(run(s, { type: 'master', value: 0.25 }));
    const v = s.voices.find((x) => x.asset === 'fountain')!;
    assert.ok(close(aVoiceHeard(quiet, v, quiet.t) / aVoiceHeard(loud, v, loud.t), 0.25), 'a quarter of LEVEL is a quarter of the level');
  });

  it('a LEVEL change is a ramp: the strip’s clock runs while it does, and with motion reduced shows its end', () => {
    const s = run(fresh(), { type: 'scene', on: true });
    const v = s.voices.find((x) => x.asset === 'fountain')!;
    const before = aVoiceHeard(s, v, s.t);
    const moved = run(s, { type: 'master', value: 0.2 });
    const end = aRampEnd(moved);
    assert.ok(end != null && end > moved.t, 'the model recorded the ramp');
    assert.equal(aRamping(moved, moved.t), true);
    assert.equal(aRamping(moved, end! + 0.001), false);
    const target = aVoiceHeard(moved, v, end! + 0.001);
    assert.ok(close(target / before, 0.2 / 0.7, 1e-9));
    assert.ok(close(aVoiceHeard(moved, v, moved.t, true), target), 'reduced motion: the end of the ramp, not its start');
  });

  it('a late layer is silent until the moment it starts, and that moment is the next wake', () => {
    const s = run(fresh(), { type: 'door' });
    const rattle = s.voices.find((v) => v.layer === 'rattle')!;
    assert.ok(rattle.delayS > 0);
    assert.equal(aVoiceHeard(s, rattle, s.t), 0);
    assert.equal(aNextStart(s, s.t), rattle.born + rattle.delayS);
    assert.ok(aVoiceHeard(s, rattle, rattle.born + rattle.delayS + 0.01) > 0);
    assert.equal(aNextStart(s, rattle.born + rattle.delayS + 0.01), null);
  });

  it('the meter scale and the words', () => {
    assert.equal(aMeterFrac(null), 0);
    assert.equal(aMeterFrac(A_METER_MIN_DB), 0);
    assert.equal(aMeterFrac(A_METER_MAX_DB), 1);
    assert.ok(aMeterFrac(aDb(0.5)) < aMeterFrac(aDb(1)));
    assert.equal(aLevelWord(1), '0 dB');
    assert.equal(aLevelWord(0.5), '−6 dB');
    assert.equal(aLevelWord(0), 'ZERO');
  });

  it('the scale and the color window are the lab’s own (mix strip, scene rings), where those files state them', () => {
    const num = (file: string, name: string): number | null => {
      if (!existsSync(file)) return null;
      const m = new RegExp(`export const ${name} = (-?\\d+)`).exec(readFileSync(file, 'utf8').replace(/\r\n/g, '\n'));
      return m ? Number(m[1]) : null;
    };
    const hud = new URL('../src/screens/lab/gameaudio/scene/', import.meta.url);
    const c = new URL('hud/cModel.ts', hud);
    const ring = new URL('gaSceneLogic.ts', hud);
    for (const [name, mine] of [['C_METER_MIN_DB', A_METER_MIN_DB], ['C_METER_MAX_DB', A_METER_MAX_DB], ['C_COLOR_MIN_DB', A_COLOR_MIN_DB], ['C_COLOR_MAX_DB', A_COLOR_MAX_DB]] as const) {
      const theirs = num(c.pathname.replace(/^\/([A-Za-z]:)/, '$1'), name);
      if (theirs != null) assert.equal(mine, theirs, name);
    }
    const ringMin = num(ring.pathname.replace(/^\/([A-Za-z]:)/, '$1'), 'GA_RING_DB_MIN');
    if (ringMin != null) assert.equal(A_COLOR_MIN_DB, ringMin);
  });
});

describe('level (page 1): the three sounds SCENE starts, under the lab LEVEL', () => {
  it('nothing plays until SCENE is on; then all three run and the room tone waits at zero', () => {
    const off = fresh();
    assert.deepEqual(aLevelRows(off, off.t).map((r) => [r.playing, r.level]), [[false, 0], [false, 0], [false, 0]]);
    const s = run(off, { type: 'scene', on: true });
    const rows = aLevelRows(s, s.t);
    assert.deepEqual(rows.map((r) => r.name), ['COURTYARD WIND', 'FOUNTAIN', 'ROOM TONE']);
    assert.ok(rows.every((r) => r.playing));
    assert.ok(rows[0].level > 0 && rows[1].level > 0);
    assert.equal(rows[2].level, 0, 'the listener is outside: the room tone runs at zero level');
    assert.match(aLevelSummary(s, rows), /room tone at zero level/);
  });

  it('LEVEL moves every bar together, no single sound passes it, and ■ STOP drops them', () => {
    const s = run(fresh(), { type: 'scene', on: true });
    const at = (m: number) => {
      const x = settle(run(s, { type: 'master', value: m }));
      return aLevelRows(x, x.t).map((r) => r.level);
    };
    const hi = at(1);
    const lo = at(0.4);
    for (let k = 0; k < 2; k++) assert.ok(close(lo[k] / hi[k], 0.4), 'each bar follows LEVEL');
    for (const g of lo) assert.ok(g <= 0.4 + 1e-9, 'no single sound is above the lab LEVEL');
    assert.deepEqual(at(0), [0, 0, 0]);
    const stopped = run(s, { type: 'stopAll' });
    assert.ok(aLevelRows(stopped, stopped.t).every((r) => !r.playing && r.level === 0));
  });
});

describe('cats (page 5): one cell for each kind of game sound', () => {
  it('every cell prints the page’s own name for the kind, or its leading words', () => {
    for (const f of GA_FAMILIES) assert.ok(f.name.toUpperCase().startsWith(A_FAMILY_LABEL[f.id]), `${f.id}: ${A_FAMILY_LABEL[f.id]}`);
  });

  it('every event of the model belongs to one of the page’s kinds, and the page’s own examples agree', () => {
    const ids = new Set(GA_FAMILIES.map((f) => f.id));
    for (const e of Object.keys(GA_EVENTS) as GaEventId[]) assert.ok(ids.has(A_FAMILY_OF[e]), e);
    for (const f of GA_FAMILIES) if (f.event) assert.equal(A_FAMILY_OF[f.event], f.id);
  });

  it('a cell lights for a sound that has no place in the picture', () => {
    const idle = fresh();
    assert.ok(aCats(idle, idle.t).every((c) => c.state === 'idle' && c.level === 0));
    const ui = run(idle, { type: 'post', event: 'ui_confirm' });
    assert.equal(cat(ui, 'interface').state, 'sounding');
    assert.ok(cat(ui, 'interface').level > 0);
    const line = run(idle, { type: 'post', event: 'vo_greeting', owner: 'guide' });
    assert.equal(cat(line, 'dialogue').state, 'sounding');
    const music = run(idle, { type: 'musicStart' });
    assert.equal(cat(music, 'music').state, 'sounding');
    const scene = run(idle, { type: 'scene', on: true });
    assert.equal(cat(scene, 'bed').state, 'sounding');
    assert.equal(cat(scene, 'local').state, 'sounding');
  });

  it('a late layer does not light its cell early (the debris after the impact)', () => {
    const s = run(fresh(), { type: 'post', event: 'crate_impact', owner: 'crate' });
    const impact = cat(s, 'impact').level;
    const debris = s.voices.find((v) => v.layer === 'debris')!;
    assert.ok(cat(s, 'impact', debris.born + debris.delayS + 0.01).level > impact, 'the debris adds to the cell only once it has started');
  });

  it('SOLO: the other kinds are marked, and a kind split over two categories says so', () => {
    let s = run(fresh(), { type: 'scene', on: true }, { type: 'alarm', on: true }, stepInPlace());
    assert.equal(cat(s, 'movement').state, 'sounding');
    s = run(s, { type: 'bus', bus: 'ambience', solo: true });
    assert.equal(cat(s, 'movement').state, 'silent', 'running, and shut out by another category’s solo');
    assert.equal(cat(s, 'movement').level, 0);
    assert.equal(cat(s, 'action').state, 'shut', 'not running, and its category is shut out');
    assert.equal(cat(s, 'bed').state, 'sounding');
    // the fountain (ambience) sounds; the alarm (effects) is shut out: one kind, two categories
    assert.equal(cat(s, 'local').state, 'sounding');
    assert.equal(cat(s, 'local').part, true);
    s = run(s, { type: 'bus', bus: 'sfx', solo: true }, { type: 'bus', bus: 'ambience', solo: false });
    assert.equal(cat(s, 'bed').state, 'silent');
    assert.equal(cat(s, 'local').state, 'sounding', 'now it is the alarm that sounds');
    assert.equal(cat(s, 'local').part, true);
    s = run(s, { type: 'bus', bus: 'sfx', solo: false }, { type: 'bus', bus: 'ambience', mute: true });
    assert.equal(cat(s, 'bed').state, 'muted');
  });
});

describe('chain (page 6): the door’s chain, link by link', () => {
  /** Fold the chain over a press as the strip does. */
  const press = (s0: GaState, c0: AChain | null = null) => {
    const s = run(s0, { type: 'door' });
    return { s, c: aChainStep(c0, s, s.t)! };
  };

  it('nothing is lit before the first press', () => {
    const s = fresh();
    assert.equal(aChainStep(null, s, s.t), null);
    assert.match(aChainSummary(null, s), /Nothing is lit/);
  });

  it('a whole chain: both files found, the door’s voice at once, the rattle’s one second later', () => {
    let { s, c } = press(fresh());
    assert.equal(c.live, true);
    assert.deepEqual(c.lanes.map((l) => [l.layer, l.voice]), [['door', 'playing'], ['rattle', 'waiting']]);
    assert.equal(c.lanes[1].delayS, GA_EVENTS.door_open.layers[1].delayS);
    assert.ok(c.out > 0);
    assert.ok(aChainMoving(c));
    // half a second on: only the clock has moved
    c = aChainStep(c, s, s.t + 0.5)!;
    assert.equal(c.lanes[1].voice, 'waiting');
    assert.ok(close(c.lanes[0].playedS, 0.5));
    // the rattle starts at one second, with no state change at all
    c = aChainStep(c, s, c.born + 1.01)!;
    assert.deepEqual(c.lanes.map((l) => l.voice), ['playing', 'playing']);
    // the door's own voice ends; the rattle plays on
    s = expire(wait(s, 1.2), 'door');
    c = aChainStep(c, s, s.t)!;
    assert.deepEqual(c.lanes.map((l) => l.voice), ['done', 'playing']);
    assert.ok(c.lanes[0].playedS > 1 && c.lanes[0].playedS < 1.4);
    // the instance ends: the strip keeps what that press did
    s = expire(wait(s, 0.7));
    c = aChainStep(c, s, s.t)!;
    assert.equal(c.live, false);
    assert.equal(c.out, 0);
    assert.deepEqual(c.lanes.map((l) => l.voice), ['done', 'done']);
    assert.equal(aChainMoving(c), false);
    assert.equal(aChainStep(c, wait(s, 5), s.t + 5), c, 'held, unchanged, until the next press');
  });

  it('a broken chain stops at the broken link: the door’s file link does not light, the rattle still plays', () => {
    const broken = run(fresh(), { type: 'fault', patch: { missingDoor: true } });
    let { s, c } = press(broken);
    assert.deepEqual(c.lanes.map((l) => [l.layer, l.voice]), [['door', 'missing'], ['rattle', 'waiting']]);
    assert.equal(c.out, 0, 'nothing reaches the output until the rattle starts');
    c = aChainStep(c, s, c.born + 1.01)!;
    assert.deepEqual(c.lanes.map((l) => l.voice), ['missing', 'playing']);
    assert.ok(c.out > 0);
    s = expire(wait(s, 2));
    c = aChainStep(c, s, s.t)!;
    assert.deepEqual(c.lanes.map((l) => l.voice), ['missing', 'done']);
    // put right: the next press lights the whole chain again
    const mended = press(run(s, { type: 'fault', patch: { missingDoor: false } }), c);
    assert.deepEqual(mended.c.lanes.map((l) => l.voice), ['playing', 'waiting']);
  });

  it('the fault is never named before its symptom', () => {
    const clean = fresh();
    const planted = run(clean, { type: 'fault', patch: { missingDoor: true } });
    assert.equal(aSymptomSeen(planted, 'door'), false);
    assert.equal(aChainStep(null, planted, planted.t), null, 'planted and not yet pressed: the strip is as on a clean page');
    assert.equal(aChainSummary(null, planted), aChainSummary(null, clean));
    // a healthy press that is still on show does not change when the fault is planted
    const { s, c } = press(clean);
    const after = run(s, { type: 'fault', patch: { missingDoor: true } });
    const c2 = aChainStep(c, after, after.t)!;
    assert.ok(c2.lanes.every((l) => l.voice !== 'missing'));
    assert.doesNotMatch(aChainSummary(c2, after), /not in the build/);
    // the press that produces the symptom is the first thing that names it
    const hit = press(planted);
    assert.equal(aSymptomSeen(hit.s, 'door'), true);
    assert.match(aChainSummary(hit.c, hit.s), /not in the build/);
  });
});

describe('sync (page 8): the four kinds of game information', () => {
  it('the last trigger and who sent it; a switch for each character', () => {
    let s = fresh();
    let y: ASync = aSyncStep(null, s);
    assert.equal(y.trigger, null);
    assert.match(aSyncSummary(y), /No trigger has been sent/);
    s = run(s, stepInPlace('guide'));
    y = aSyncStep(y, s);
    assert.deepEqual([y.trigger?.what, y.trigger?.from], ['FOOT CONTACT', 'GUIDE']);
    assert.ok(aSyncMarked(y.trigger?.t, s.t) && aSyncMarked(y.switchAt, s.t), 'the foot contact carries the switch value with it');
    assert.equal(aSyncMarked(y.trigger?.t, s.t + A_SYNC_MARK_S + 0.1), false);
    s = run(s, stepInPlace('player'));
    y = aSyncStep(y, s);
    assert.equal(y.trigger?.from, 'YOU');
    s = run(s, { type: 'door' });
    y = aSyncStep(y, s);
    assert.deepEqual([y.trigger?.what, y.trigger?.from], ['DOOR', 'THE DOOR']);
    // each switch reads what that character's last footstep sent
    assert.deepEqual([y.you, y.guide], ['stone', 'wood']);
    for (const a of chbRoute(s.chars.player, s.doorOpen, 'gravel').moves) s = run(s, a);
    s = run(s, stepInPlace('player'));
    y = aSyncStep(y, s);
    assert.deepEqual([y.you, y.guide], ['gravel', 'wood'], 'YOU moved and stepped: only your switch changes');
  });

  it('a switch shows nothing until that character has stepped on this page', () => {
    const s = fresh();
    const y = aSyncStep(null, s);
    assert.deepEqual([y.you, y.guide], [null, null]);
    assert.match(aSyncSummary(y), /you have not stepped yet; the guide has not stepped yet/);
    const g = aSyncStep(y, run(s, stepInPlace('guide')));
    assert.deepEqual([g.you, g.guide], [null, 'wood']);
  });

  it('a SENT mark fades from whole to nothing over its length', () => {
    assert.equal(aSyncMark(10, 10), 1);
    assert.ok(close(aSyncMark(10, 10 + A_SYNC_MARK_S / 2), 0.5));
    assert.equal(aSyncMark(10, 10 + A_SYNC_MARK_S), 0);
    assert.equal(aSyncMark(null, 10), 0);
  });

  it('a strip opened later (FULL SCREEN) shows the same last trigger', () => {
    const s = run(fresh(), stepInPlace('player'), stepInPlace('guide'));
    const late = aSyncStep(null, s);
    assert.deepEqual([late.trigger?.what, late.trigger?.from], ['FOOT CONTACT', 'GUIDE']);
  });

  it('SPEED is a value on generator 1; the STATE is one word for the whole game', () => {
    let s = fresh();
    let y = aSyncStep(null, s);
    assert.equal(y.running, false);
    assert.equal(y.speedAt, null);
    s = run(s, { type: 'machine', id: 'generator-1', on: true }, { type: 'speed', id: 'generator-1', value: 0.8 });
    y = aSyncStep(y, s);
    assert.equal(y.running, true);
    assert.equal(y.speed, 0.8);
    assert.ok(aSyncMarked(y.speedAt, s.t));
    assert.equal(y.mood, 'calm');
    assert.equal(y.moodAt, null);
    s = run(s, { type: 'mood', mood: 'alert' });
    y = aSyncStep(y, s);
    assert.equal(y.mood, 'alert');
    assert.equal(y.moodAt, s.t);
    assert.equal(aSyncStep(y, s), y, 'nothing changed: the same object, so nothing is redrawn');
  });

  it('the planted fault shows only as its symptom: nothing before the guide’s step really uses your surface', () => {
    let s = run(fresh(), stepInPlace('guide'));
    let y = aSyncStep(null, s);
    assert.equal(y.guide, 'wood');
    // START THE FAULT and stand on the gravel: no guide step yet
    s = run(s, { type: 'fault', patch: { globalSurface: true } });
    for (const a of chbRoute(s.chars.player, s.doorOpen, 'gravel').moves) s = run(s, a);
    y = aSyncStep(y, s);
    assert.notEqual(y.guide, 'gravel', 'the GUIDE cell does not show your surface before its step');
    assert.equal(y.guide, 'wood', 'it still shows what its last step really sent');
    const fresh0 = aSyncStep(null, run(fresh(), { type: 'fault', patch: { globalSurface: true } }));
    assert.equal(fresh0.guide, null, 'fault started, the guide never stepped: nothing at all');
    // the guide steps: now the wrong value has really been used, and shows
    s = run(s, stepInPlace('guide'));
    y = aSyncStep(y, s);
    assert.equal(y.guide, 'gravel');
    assert.doesNotMatch(aSyncSummary(y), /fault|wrong|copied/i);
  });
});

describe('takes (page 9): the last eight takes, with their real pitch and level change', () => {
  const steps = (s: GaState, n: number): GaState => {
    for (let k = 0; k < n; k++) s = expire(run(s, stepInPlace()));
    return s;
  };

  it('an empty row says so', () => {
    const s = fresh();
    assert.deepEqual(aTakes(s), []);
    assert.match(aTakesSummary([], true), /No take has played/);
  });

  it('variation off: the same take repeats, eight identical bars', () => {
    const s = steps(run(fresh(), { type: 'option', patch: { variation: false } }), 9);
    const row = aTakes(s);
    assert.equal(row.length, 8);
    assert.ok(row.every((t) => t.take === 1 && t.of > 1 && t.pitchCents === 0 && t.gainDb === 0), 'one take, no change in pitch or level');
    assert.equal(row.filter((t) => t.same).length, 7, 'each is the same take as the one before it');
    assert.equal(aTakesRun(row), 8);
    assert.match(aTakesSummary(row, false), /8 times in a row/);
  });

  it('variation on: the takes change, each with a real pitch and level change, and none repeats at once', () => {
    const s = steps(fresh(), 12);
    const row = aTakes(s);
    assert.equal(row.length, 8);
    assert.ok(new Set(row.map((t) => t.take)).size >= 3);
    assert.ok(row.every((t) => !t.same), 'avoid repeat is on');
    assert.ok(row.some((t) => t.pitchCents !== 0) && row.some((t) => t.gainDb !== 0));
    const vary = GA_EVENTS.footstep.vary!;
    for (const t of row) assert.ok(Math.abs(t.pitchCents) <= vary.cents + 0.1 && Math.abs(t.gainDb) <= vary.gainDb + 0.01);
    assert.equal(aTakesRun(row), 1);
  });

  it('with avoid repeat off a take can come twice, and the row marks it', () => {
    // the model's own choice sequence: in 40 draws among 4 takes some neighbors repeat
    let s = run(fresh(), { type: 'option', patch: { avoidRepeat: false } });
    let seen = false;
    for (let k = 0; k < 40 && !seen; k++) {
      s = expire(run(s, stepInPlace()));
      const row = aTakes(s);
      seen = row.some((t, i) => t.same && i > 0 && row[i - 1].take === t.take);
      if (seen) assert.ok(aTakesRun(row) >= 1);
    }
    assert.ok(seen, 'a repeat happened and was marked');
  });

  it('a layer with one take (the door) is not a choice and is not listed', () => {
    const s = run(fresh(), { type: 'door' });
    assert.deepEqual(aTakes(s), []);
  });

  it('a model that keeps no record: the strip’s own notes read the same takes from the instances', () => {
    let s = fresh();
    let noted: readonly ATake[] = [];
    for (let k = 0; k < 6; k++) {
      s = run(s, stepInPlace());
      noted = aNoteTakes(noted, s);
      assert.equal(aNoteTakes(noted, s), noted, 'nothing new: the same list');
      s = expire(s);
    }
    const fromModel = aTakes(s);
    const bare = { ...s, recentTakes: undefined } as GaState;
    const fromNotes = aTakes(bare, noted);
    assert.deepEqual(fromNotes.map((t) => [t.take, t.of, t.same]), fromModel.map((t) => [t.take, t.of, t.same]));
    for (let k = 0; k < fromModel.length; k++) {
      assert.ok(Math.abs(fromNotes[k].pitchCents - fromModel[k].pitchCents) < 0.1);
      assert.ok(Math.abs(fromNotes[k].gainDb - fromModel[k].gainDb) < 0.02);
    }
  });
});

describe('beds (page 10): the crossfade, the loop and its join, stacked copies', () => {
  const sceneOn = () => run(fresh(), { type: 'scene', on: true }, { type: 'door' });
  const cross = (s: GaState, to: 'stone' | 'workshop'): GaState => {
    for (const a of chbRoute(s.chars.player, s.doorOpen, to).moves) s = run(s, a);
    return s;
  };
  const levels = (s: GaState, t: number, still = false) => {
    const [yard, room] = aBeds(s, t, still);
    return { yard: yard.level, room: room.level };
  };

  it('in the courtyard the wind plays and the room tone runs at zero', () => {
    const s = sceneOn();
    const [yard, room] = aBeds(s, s.t);
    assert.deepEqual([yard.name, room.name], ['COURTYARD WIND', 'ROOM TONE']);
    assert.deepEqual([yard.copies, room.copies], [1, 1]);
    assert.ok(yard.level > 0);
    assert.equal(room.level, 0);
    assert.equal(aBedFading(s, s.t), false);
  });

  it('a crossing is ONE crossfade over the model’s own fade time: the two shares always sum to one', () => {
    const before = sceneOn();
    const yardFull = levels(before, before.t).yard;
    const s = cross(before, 'workshop');
    const end = aFadeEnd(s)!;
    assert.ok(s.bedFade && end > s.t, 'the model recorded the fade');
    const roomFull = levels(s, end + 1).room;
    assert.ok(roomFull > 0);
    assert.equal(levels(s, end + 1).yard, 0);
    for (const f of [0, 0.25, 0.5, 0.75, 1]) {
      const t = s.bedFade!.at + f * s.bedFade!.ramp;
      const now = levels(s, t);
      assert.ok(close(now.yard / yardFull + now.room / roomFull, 1, 1e-9), `shares sum to one at ${f}`);
      assert.ok(close(now.room / roomFull, f, 1e-9), 'a straight line over the fade');
    }
    assert.equal(aBedFading(s, s.bedFade!.at + 0.1), true);
    assert.equal(aBedFading(s, end + 0.01), false);
    // motion reduced: the beds are shown where the fade ENDS, never part-way
    const still = levels(s, s.bedFade!.at + 0.2, true);
    assert.equal(still.yard, 0);
    assert.ok(close(still.room, roomFull, 1e-9));
  });

  it('the fade time on the strip is the one the engine is sent', () => {
    let s = gaReduce(fresh(), { type: 'sound', on: true }, 0.1).state;
    s = run(s, { type: 'scene', on: true }, { type: 'door' });
    const moves = chbRoute(s.chars.player, s.doorOpen, 'workshop').moves;
    let ramps: number[] = [];
    let t = s.t;
    for (const a of moves) {
      t += 0.05;
      const r = gaReduce(s, a, t);
      s = r.state;
      const bedVoices = new Set(s.voices.filter((v) => v.asset.startsWith('amb_')).map((v) => v.v));
      ramps = ramps.concat(r.cmds.flatMap((c) => (c.t === 'set' && bedVoices.has(c.v) && c.ramp != null && c.gain != null && (c.gain === 0 || c.ramp > 1) ? [c.ramp] : [])));
    }
    assert.ok(s.bedFade);
    assert.ok(ramps.includes(s.bedFade!.ramp), `the engine's bed fade (${ramps.join(', ')}) is the strip's (${s.bedFade!.ramp})`);
  });

  it('the play position runs along the loop from the voice’s start, over the loop’s real length', () => {
    const s = sceneOn();
    const born = s.voices.find((v) => v.asset === 'amb_yard')!.born;
    const at = (sec: number) => aBeds(s, born + sec)[0];
    assert.equal(at(0).loopS, 10);
    assert.equal(aBeds(s, born)[1].loopS, 8);
    assert.ok(close(at(2.5).pos, 0.25));
    assert.equal(at(2.5).passes, 0);
    assert.ok(close(at(12.5).pos, 0.25));
    assert.equal(at(12.5).passes, 1);
    assert.ok(close(at(12.5).sinceJoin, 2.5));
    assert.equal(at(35).passes, 3);
    assert.equal(at(2.5).raw, false);
  });

  it('RAW CUT swaps the wind file: the strip names the file playing, and its join is a jump in the real samples', () => {
    const s = run(sceneOn(), { type: 'option', patch: { rawYardLoop: true } });
    const yard = aBeds(s, s.t)[0];
    assert.equal(yard.raw, true);
    assert.equal(yard.asset, 'amb_yard_raw');
    assert.ok(Math.abs(aJoinStep(A_LOOP_SHAPES.amb_yard_raw)) >= 15, 'ends in a gust, begins in a lull');
    assert.ok(Math.abs(aJoinStep(A_LOOP_SHAPES.amb_yard)) < 15, 'the prepared loop ends where it begins');
    assert.ok(Math.abs(aJoinStep(A_LOOP_SHAPES.amb_room)) < 15);
  });

  it('the loop shapes on the strip are the loops’ own samples', () => {
    for (const id of Object.keys(A_LOOP_SHAPES)) {
      const real = aShapeOf(gaSound(id)!);
      const drawn = A_LOOP_SHAPES[id];
      assert.equal(drawn.length, real.length, id);
      for (let k = 0; k < real.length; k++) assert.ok(Math.abs(drawn[k] - real[k]) <= 1, `${id} column ${k}: drawn ${drawn[k]}, real ${real[k]}`);
    }
  });

  it('stacked copies are counted only once they exist: the pile-up is not named before its symptom', () => {
    const planted = run(sceneOn(), { type: 'fault', patch: { bedPileUp: true } });
    assert.deepEqual(aBeds(planted, planted.t).map((b) => b.copies), [1, 1], 'planted, no step yet: nothing shows');
    const one = aBeds(planted, planted.t)[0].level;
    let s = planted;
    for (let k = 0; k < 3; k++) s = run(s, { type: 'step', who: 'player', dx: 0.2, dy: 0 });
    const yard = aBeds(s, s.t)[0];
    assert.equal(yard.copies, 4, 'the symptom: one more copy with every step inside the zone');
    assert.ok(close(yard.level, one * 2, 1e-9), 'four unrelated copies: twice the level (the sum of their powers)');
    assert.ok(close(aEventLevel(s, 'bed_yard', s.t), yard.level));
  });
});
