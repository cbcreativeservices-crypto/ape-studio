/**
 * Game Audio lab, page 4 "Kinds of games" — the twelve kinds of game and the
 * three separate choices (pages/data/gaGenres.ts), and the model facts the
 * page's listener lesson rests on.
 *
 * The second half proves, on the pure model, each thing the page tells the
 * student they will read on the GEN PAN readout, in the rings and in the
 * activity log: the camera's height narrows the pan, and level follows the
 * distance along the ground from the middle of the scene. If the model's
 * listener changes again, these fail and the page's text must be read again.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import type { GaCmd } from '../src/screens/lab/gameaudio/engine/gaEngineProtocol.ts';
import { GA_EVENTS } from '../src/screens/lab/gameaudio/model/gaDefs.ts';
import {
  GA_CAMERA_HEIGHT,
  gaFact,
  gaInitial,
  gaListenDistance,
  gaReduce,
  gaVirtualCount,
  listenerOf,
  type GaAction,
  type GaState,
} from '../src/screens/lab/gameaudio/model/gaModel.ts';
import { PLACES, WORLD_H, WORLD_W, stereoPan } from '../src/screens/lab/gameaudio/model/gaWorld.ts';
import { GA_GAME_CHOICES, GA_GENRES, GA_GENRES_TO_OPEN, gaGenre } from '../src/screens/lab/gameaudio/pages/data/gaGenres.ts';

const run = (s: GaState, ...actions: GaAction[]): GaState => actions.reduce((st, a, i) => gaReduce(st, a, st.t + 0.5 + i * 0.01).state, s);
const genPan = (s: GaState): number => stereoPan(listenerOf(s), PLACES.generator);

describe('page 4: twelve kinds of game', () => {
  it('are the handoff’s twelve, in its order', () => {
    assert.deepEqual(
      GA_GENRES.map((g) => g.name),
      [
        'Puzzle and casual',
        'Platformer',
        'Action and shooter',
        'Adventure and role playing',
        'Strategy and management',
        'Racing and vehicle simulation',
        'Sports',
        'Rhythm and music',
        'Horror and stealth',
        'Sandbox and open world',
        'Narrative and visual novel',
        'Educational and serious games',
      ],
    );
    assert.equal(new Set(GA_GENRES.map((g) => g.id)).size, 12);
    assert.equal(new Set(GA_GENRES.map((g) => g.label)).size, 12);
  });
  it('each card says why, and lists three to five sounds it often puts first', () => {
    for (const g of GA_GENRES) {
      assert.ok(g.why.length >= 50 && g.why.length <= 140, `${g.id}.why: ${g.why.length} characters`);
      assert.match(g.why, /[.]$/);
      assert.ok(g.emphasis.length >= 3 && g.emphasis.length <= 5, `${g.id}: ${g.emphasis.length} items`);
      assert.equal(new Set(g.emphasis).size, g.emphasis.length);
      assert.ok(g.short.length <= 7 && /^[A-Z]+$/.test(g.short), `${g.id}: the dock value "${g.short}" is a word of seven letters or fewer`);
      assert.ok(g.label.length <= 11, `${g.id}: "${g.label}" fits a chip`);
    }
    assert.equal(new Set(GA_GENRES.map((g) => g.why)).size, 12, 'no two kinds share a reason');
    assert.equal(new Set(GA_GENRES.map((g) => g.short)).size, 12, 'no two kinds share a dock word');
    assert.ok(!GA_GENRES.some((g) => g.short === 'PLATFORM'), 'no dock word repeats page 3’s PLATFORM key');
  });
  it('the cards are design cases in plain words: no dogma, no product names, no numbers, US spelling', () => {
    const t = [...GA_GENRES.flatMap((g) => [g.name, g.why, ...g.emphasis]), ...GA_GAME_CHOICES.flatMap((c) => [c.asks, c.examples])].join('\n');
    assert.ok(!/\b(must|always|never)\b/i.test(t), 'no dogma words');
    assert.ok(!/\b(wwise|fmod|unity|unreal|playstation|xbox|nintendo)\b/i.test(t), 'no tool or product names');
    assert.ok(!/\b(milliseconds?|ms|latency|doppler|rtpc|emitter)\b/i.test(t), 'no jargon outside the page’s terms');
    assert.ok(!/\d(?!D\b)/.test(t), 'no numbers (2D and 3D are names, not numbers)');
    assert.ok(!/\b(colour|behaviour|centre|metre|programme|organis|recognis|grey)\b/i.test(t), 'US spelling');
    assert.ok(!/locali[sz]ation/i.test(t), 'language versions are never called localization');
  });
  it('the strategy card points at the camera, and the racing card at one sound that keeps playing', () => {
    assert.ok(gaGenre('strategy')!.emphasis.includes('Listening from the camera'));
    assert.match(gaGenre('racing')!.why, /without starting again/);
    assert.ok(gaGenre('narrative')!.emphasis.includes('Language versions'));
  });
  it('genre, perspective and play mode are three separate choices, each a question', () => {
    assert.deepEqual(GA_GAME_CHOICES.map((c) => c.id), ['genre', 'perspective', 'mode']);
    for (const c of GA_GAME_CHOICES) assert.match(c.asks, /\?$/);
    assert.match(GA_GAME_CHOICES[1].examples, /First person, third person, top down or a fixed view/);
    assert.match(GA_GAME_CHOICES[1].examples, /2D can still place its sounds in space/);
    assert.match(GA_GAME_CHOICES[2].examples, /several players on one screen/);
    assert.match(GA_GAME_CHOICES[2].examples, /real time or in turns/);
  });
  it('the first goal asks for three different kinds', () => {
    assert.equal(GA_GENRES_TO_OPEN, 3);
    assert.equal(gaGenre(null), undefined);
  });
});

describe('page 4: what the student reads when the listener moves', () => {
  const facingUp = run(gaInitial(), { type: 'machine', id: 'generator-1', on: true }, { type: 'face', who: 'player', facing: 0 });

  it('facing up the picture, the generator is far to the player’s right', () => {
    assert.ok(genPan(facingUp) > 0.9, `pan ${genPan(facingUp).toFixed(2)}`);
  });
  it('from the overhead camera it sits nearer the center, on the same side, and the same instance keeps playing', () => {
    const cam = run(facingUp, { type: 'listener', mode: 'camera' });
    assert.ok(genPan(cam) > 0.3, `still to the right: pan ${genPan(cam).toFixed(2)}`);
    assert.ok(genPan(cam) < genPan(facingUp) - 0.2, `clearly narrower: ${genPan(facingUp).toFixed(2)} to ${genPan(cam).toFixed(2)}`);
    assert.deepEqual(cam.inst.map((i) => i.id), facingUp.inst.map((i) => i.id), 'nothing restarted');
    assert.equal(gaFact(cam, 'listener:camera'), 1);
    assert.equal(cam.log[cam.log.length - 1].text, 'LISTENER moved to the overhead camera');
  });
  it('the camera is high above the middle, so no place in the scene is fully on one side', () => {
    const cam = run(gaInitial(), { type: 'listener', mode: 'camera' });
    const L = listenerOf(cam);
    assert.deepEqual([L.x, L.y], [WORLD_W / 2, WORLD_H / 2]);
    assert.equal(L.height, GA_CAMERA_HEIGHT);
    assert.ok(L.height >= 5);
    for (const edge of [{ x: 0, y: 0 }, { x: WORLD_W, y: 0 }, { x: 0, y: WORLD_H }, { x: WORLD_W, y: WORLD_H }, { x: 0, y: WORLD_H / 2 }, { x: WORLD_W, y: WORLD_H / 2 }]) {
      // the same place heard from the ground at the middle would be hard to one side
      const onTheGround = Math.abs(stereoPan({ ...L, height: 0 }, edge));
      assert.ok(Math.abs(stereoPan(L, edge)) < 0.85, `edge ${edge.x},${edge.y}: ${stereoPan(L, edge).toFixed(2)}`);
      assert.ok(Math.abs(stereoPan(L, edge)) < onTheGround, `edge ${edge.x},${edge.y}: the height narrows the pan`);
    }
  });
  it('with the camera listening, turning the character changes nothing; with the player’s ears it does', () => {
    const cam = run(facingUp, { type: 'listener', mode: 'camera' });
    const before = genPan(cam);
    for (const facing of [45, 90, 180, 270]) assert.equal(genPan(run(cam, { type: 'face', who: 'player', facing })), before, `facing ${facing}`);
    assert.ok(gaFact(run(cam, { type: 'face', who: 'player', facing: 90 }), 'turned') > gaFact(cam, 'turned'), 'the turn is still a fact');
    const ears = run(facingUp, { type: 'face', who: 'player', facing: 180 });
    assert.ok(genPan(ears) < -0.9, 'for the player’s ears the generator crossed to the other side');
  });
  it('nothing goes VIRTUAL because the camera is high: the fountain and the generator stay in range', () => {
    const scene = run(gaInitial(), { type: 'scene', on: true }, { type: 'machine', id: 'generator-1', on: true });
    assert.equal(gaVirtualCount(scene), 0);
    const cam = run(scene, { type: 'listener', mode: 'camera' });
    const L = listenerOf(cam);
    assert.ok(gaListenDistance(L, PLACES.fountain) < GA_EVENTS.fountain.atten!.max);
    assert.ok(gaListenDistance(L, PLACES.generator) < GA_EVENTS.generator.atten!.max);
    assert.equal(gaVirtualCount(cam), 0);
    assert.ok(!cam.log.some((l) => /VIRTUAL/.test(l.text)), 'the log has no VIRTUAL line');
    const back = run(cam, { type: 'listener', mode: 'player' });
    assert.equal(gaFact(back, 'listener:player'), 1);
    assert.equal(back.log[back.log.length - 1].text, 'LISTENER moved to the player');
  });
  it('for the camera, level follows the distance from the middle of the scene, not from the player', () => {
    // sound on, so the engine is told each voice's level
    const before = gaReduce(run(gaInitial(), { type: 'scene', on: true }, { type: 'machine', id: 'generator-1', on: true }), { type: 'sound', on: true }, 5);
    const cam = gaReduce(before.state, { type: 'listener', mode: 'camera' }, 6);
    const back = gaReduce(cam.state, { type: 'listener', mode: 'player' }, 7);
    const level = (r: { state: GaState; cmds: GaCmd[] }, event: 'fountain' | 'generator', layer: string): number => {
      const inst = r.state.inst.find((i) => i.event === event)!;
      const voice = r.state.voices.find((v) => v.inst === inst.id && v.layer === layer)!;
      const cmd = [...r.cmds].reverse().find((c) => (c.t === 'start' || c.t === 'set') && c.v === voice.v);
      assert.ok(cmd && (cmd.t === 'start' || cmd.t === 'set') && typeof cmd.gain === 'number', `${event}: the engine was given a level`);
      return cmd.gain as number;
    };
    const mid = listenerOf(cam.state);
    const you = listenerOf(before.state);
    // at the start YOU stand nearer the fountain than the middle is, and farther from the generator
    assert.ok(gaListenDistance(you, PLACES.fountain) < gaListenDistance(mid, PLACES.fountain));
    assert.ok(gaListenDistance(you, PLACES.generator) > gaListenDistance(mid, PLACES.generator));
    assert.ok(level(cam, 'fountain', 'water') < level(before, 'fountain', 'water'), 'the fountain is fainter for the camera');
    assert.ok(level(cam, 'fountain', 'water') > 0, 'and still heard');
    assert.ok(level(cam, 'generator', 'hum') > level(before, 'generator', 'hum'), 'the generator is louder for the camera');
    assert.equal(level(back, 'fountain', 'water'), level(before, 'fountain', 'water'), 'back with the player, the level is as it was');
    // moving the player does not move the camera's levels
    const walked = gaReduce(cam.state, { type: 'move', who: 'player', x: 1, y: 9 }, 8);
    assert.deepEqual(listenerOf(walked.state), mid);
  });
  it('the page opens on a clean scene: the player listens and faces east, the generator is off, the log is empty', () => {
    const before = run(gaInitial(), { type: 'machine', id: 'generator-1', on: true }, { type: 'face', who: 'player', facing: 0 }, { type: 'listener', mode: 'camera' });
    const open = run(before, { type: 'enterPage' });
    assert.equal(open.listenerMode, 'player');
    assert.equal(open.chars.player.facing, 90);
    assert.equal(open.machines.length, 1);
    assert.equal(open.machines[0].on, false);
    assert.equal(open.inst.length, 0);
    assert.equal(open.log.length, 0);
    assert.deepEqual(open.facts, before.facts, 'the facts are kept, and opening a page adds none');
    // so the page's own steps are needed, and are enough: generator on, FACING 0, camera, YOUR EARS
    const done = run(open, { type: 'machine', id: 'generator-1', on: true }, { type: 'face', who: 'player', facing: 0 }, { type: 'listener', mode: 'camera' }, { type: 'face', who: 'player', facing: 180 }, { type: 'listener', mode: 'player' });
    assert.equal(gaFact(done, 'listener:camera') - gaFact(open, 'listener:camera'), 1);
    assert.equal(gaFact(done, 'listener:player') - gaFact(open, 'listener:player'), 1, '"Choose YOUR EARS again"');
    assert.ok(gaFact(done, 'turned') - gaFact(open, 'turned') >= 2);
  });
});
