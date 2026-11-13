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
import { readFileSync } from 'node:fs';
import type { GaCmd } from '../src/screens/lab/gameaudio/engine/gaEngineProtocol.ts';
import { GA_EVENTS } from '../src/screens/lab/gameaudio/model/gaDefs.ts';
import {
  GA_CAMERA_HEIGHT,
  busGain,
  gaFact,
  gaInitial,
  gaInstWall,
  gaListenDistance,
  gaPlaying,
  gaReduce,
  gaVirtualCount,
  gaVoiceCount,
  listenerOf,
  type GaAction,
  type GaState,
} from '../src/screens/lab/gameaudio/model/gaModel.ts';
import { GA_PAN_WIDTH, PLACES, WORLD_H, WORLD_W, stereoPan, surfaceAt, zoneAt } from '../src/screens/lab/gameaudio/model/gaWorld.ts';
import {
  GA_DEMO_BURST,
  GA_DEMO_FAR_WEST,
  GA_DEMO_INSIDE,
  GA_DEMO_LANDING,
  GA_DEMO_LINE_MAX,
  GA_DEMO_SPEED,
  GA_GAME_CHOICES,
  GA_GENRES,
  GA_GENRES_TO_OPEN,
  gaGenre,
  type GaGenreId,
} from '../src/screens/lab/gameaudio/pages/data/gaGenres.ts';

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
      assert.ok(g.label.length <= 11, `${g.id}: "${g.label}" fits a chip of the four-column grid`);
      // ONE name for each kind (learning audit L-07, walk audit W1 F18): no second dock word
      assert.ok(!('short' in g), `${g.id}: no invented short name`);
    }
    assert.equal(new Set(GA_GENRES.map((g) => g.why)).size, 12, 'no two kinds share a reason');
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

/* ── each kind's ONE demonstration (walk audit W1 F11) ─────────────────── */

/** What the page does on a pick: a clean scene, then the kind's actions. */
const demo = (id: GaGenreId): GaState => run(run(gaInitial(), { type: 'scene', on: true }, { type: 'door' }, { type: 'listener', mode: 'camera' }), { type: 'enterPage' }, ...gaGenre(id)!.demo.actions);
const PAGE4 = readFileSync(new URL('../src/screens/lab/gameaudio/pages/p04Games.tsx', import.meta.url), 'utf8').replace(/\r\n/g, '\n');

describe('page 4: GAMES moves the scene, and each line says only what is true', () => {
  it('every kind has a demonstration: actions, and a short line that points at the picture or a readout, not at the log', () => {
    for (const g of GA_GENRES) {
      assert.ok(g.demo.actions.length >= 1, g.id);
      assert.ok(g.demo.line.length <= GA_DEMO_LINE_MAX, `${g.id}: ${g.demo.line.length} characters`);
      assert.match(g.demo.line, /[.]$/);
      assert.ok(!/\blog\b/i.test(g.demo.line), `${g.id}: the tray covers the log`);
      assert.ok(!/\b(colour|grey|centre|metre)\b|—/.test(g.demo.line), `${g.id}: US spelling, no dash`);
    }
    assert.equal(new Set(GA_GENRES.map((g) => g.demo.line)).size, 12);
  });
  it('the page runs a pick as: a clean scene, then that kind’s actions', () => {
    assert.match(PAGE4, /gaDispatch\(\{ type: 'enterPage' \}\);\n\s+for \(const a of g\.demo\.actions\) gaDispatch\(a\);/);
    assert.match(PAGE4, /runDemo\(next\);/);
    const clean = demo('puzzle');
    assert.equal(clean.listenerMode, 'player', 'what the learner left (the camera) does not carry into a demonstration');
  });
  it('PUZZLE: the door opens and its sound starts at the same moment', () => {
    const s = demo('puzzle');
    assert.equal(s.doorOpen, true);
    const door = s.inst.find((i) => i.event === 'door_open')!;
    assert.equal(s.voices.find((v) => v.inst === door.id && v.layer === 'door')!.delayS, 0);
  });
  it('PLATFORMER: YOU land on the gravel and one footstep plays, chosen for gravel', () => {
    const s = demo('platformer');
    assert.deepEqual([s.chars.player.x, s.chars.player.y], [GA_DEMO_LANDING.x, GA_DEMO_LANDING.y]);
    assert.equal(surfaceAt(s.chars.player), 'gravel');
    assert.equal(s.inst.filter((i) => i.event === 'footstep').length, 1);
    assert.equal(gaFact(s, 'step:player:gravel') - gaFact(run(gaInitial()), 'step:player:gravel'), 1);
  });
  it('ACTION: twelve crate impacts in 0.3 s; PLAYING and VOICES jump', () => {
    const s = demo('action');
    assert.equal(GA_DEMO_BURST, 12);
    assert.equal(s.inst.filter((i) => i.event === 'crate_impact').length, 12);
    assert.ok(gaVoiceCount(s) >= 12);
    assert.match(gaGenre('action')!.demo.line, /^Twelve crate impacts in 0\.3 s\./);
  });
  it('ADVENTURE: YOU walk into the workshop and the beds cross over', () => {
    const s = demo('adventure');
    assert.deepEqual([s.chars.player.x, s.chars.player.y], [GA_DEMO_INSIDE.x, GA_DEMO_INSIDE.y]);
    assert.equal(zoneAt(s.chars.player), 'room');
    assert.equal(s.bedFade?.to, 'room');
    assert.ok(gaPlaying(s, 'bed_yard') && gaPlaying(s, 'bed_room'));
  });
  it('STRATEGY: the listener is the overhead camera, and LISTENER reads CAMERA', () => {
    assert.equal(demo('strategy').listenerMode, 'camera');
  });
  it('RACING: one instance keeps playing while SPEED goes from 40% to 90%', () => {
    const s = demo('racing');
    assert.equal(s.inst.filter((i) => i.event === 'generator').length, 1);
    assert.equal(s.machines[0].speed, GA_DEMO_SPEED);
    assert.equal(gaInitial().machines[0].speed, 0.4);
    assert.equal(gaFact(s, 'speedWhilePlaying') - gaFact(run(gaInitial()), 'speedWhilePlaying'), 1);
    // the page has no SPEED readout: the line names what the picture shows (bug test B-S2-03)
    assert.doesNotMatch(gaGenre('racing')!.demo.line, /SPEED/);
    assert.match(gaGenre('racing')!.demo.line, /rings crowd closer.*without starting again/);
  });
  it('SPORTS: an impact, then a voice', () => {
    const s = demo('sports');
    assert.ok(gaPlaying(s, 'crate_impact') && gaPlaying(s, 'vo_greeting'));
  });
  it('RHYTHM: the music starts on its clock, and a hit asked for now lands on the next bar line: PLAYING reads 1 then (bug test B-S2-02)', () => {
    const s = demo('rhythm');
    assert.equal(s.music.on, true);
    assert.equal(s.inst.length, 0, 'nothing is counted before the bar line');
    assert.ok(s.music.stinger && s.music.stinger.boundary === 'bar', 'the hit waits for the next bar');
    assert.ok((s.music.stinger.inS ?? 0) > 0.3, 'the wait is long enough to be seen');
    // unheard, the store moves the clock to the line and reports it applied (gaStore)
    const landed = run(s, { type: 'engine', evt: { e: 'music', what: 'applied', req: s.music.stinger.req, at: 0 } });
    assert.equal(landed.inst.length, 1, 'PLAYING reads 1 when it lands');
    assert.equal(landed.inst[0].event, 'stinger');
    assert.match(gaGenre('rhythm')!.demo.line, /PLAYING reads 1 when it lands/);
  });
  it('HORROR: the generator runs out of sight, behind the closed door, and nothing else plays', () => {
    const s = demo('horror');
    assert.equal(s.doorOpen, false);
    assert.equal(s.inst.length, 1);
    assert.equal(gaInstWall(s, s.inst[0]).obstructed, true, 'the wall treats it: the rings turn thin and dashed past the wall');
  });
  it('OPEN WORLD: far west, the fountain plays and the generator is tracked, not played', () => {
    const s = demo('sandbox');
    assert.deepEqual([s.chars.player.x, s.chars.player.y], [GA_DEMO_FAR_WEST.x, GA_DEMO_FAR_WEST.y]);
    const state = (event: string) => s.voices.filter((v) => s.inst.find((i) => i.id === v.inst)?.event === event).map((v) => v.state);
    assert.ok(state('fountain').every((x) => x !== 'virtual') && state('fountain').length > 0);
    assert.ok(state('generator').length > 0 && state('generator').every((x) => x === 'virtual'));
  });
  it('NARRATIVE: while the guide speaks, the rest of the mix is turned down', () => {
    const s = demo('narrative');
    assert.ok(gaPlaying(s, 'vo_greeting'));
    assert.ok(busGain(s, 'ambience') < 1 && busGain(s, 'sfx') < 1);
    assert.equal(busGain(s, 'dialogue'), 1);
  });
  it('EDUCATIONAL: the alarm sounds and its visual cue is on (the OVERHEAT sign), with no SETTING line naming it', () => {
    const s = demo('educational');
    assert.ok(gaPlaying(s, 'alarm'));
    assert.equal(s.options.visualCue, true);
  });
});

describe('page 4: the GAMES tray fits a phone (196 pt with the strip)', () => {
  it('the line is two lines of text above twelve chips in four columns', () => {
    assert.match(PAGE4, /<ChATrayGrid label="Twelve kinds of game" cols=\{4\}/);
    const tray = PAGE4.slice(PAGE4.indexOf('function GamesTray'), PAGE4.indexOf('function Page('));
    assert.ok(tray.indexOf('styles.line') < tray.indexOf('ChATrayGrid'), 'the line is ABOVE the chips');
    // the line (46 pt) + its gap (6) + 3 rows of 44 pt with 2 gaps of 6: the measured room is 196 pt
    assert.match(tray, /<View style=\{styles\.games\}>/);
    assert.match(PAGE4, /games: \{ gap: 6 \}/);
    assert.match(PAGE4, /minHeight: 46/);
    const rows = Math.ceil(GA_GENRES.length / 4);
    assert.equal(rows, 3);
    assert.ok(46 + 6 + rows * 44 + (rows - 1) * 6 <= 196, `${rows} rows`);
  });
  it('each check’s correct option is not its longest (learning audit L-16), and there are two checks (L-22)', () => {
    const blocks = [...PAGE4.matchAll(/options=\{\[([\s\S]*?)\]\}/g)].map((m) => [...m[1].matchAll(/'([^']+)'/g)].map((x) => x[1]));
    assert.equal(blocks.length, 2);
    for (const opts of blocks) {
      assert.equal(opts.length, 4);
      assert.ok(opts[0].length < Math.max(...opts.slice(1).map((o) => o.length)), opts.map((o) => o.length).join('/'));
    }
    assert.match(PAGE4, /label: 'Pass both checks', hit: check && check2/);
  });
});

describe('page 4: what the student reads when the listener moves', () => {
  const facingUp = run(gaInitial(), { type: 'machine', id: 'generator-1', on: true }, { type: 'face', who: 'player', facing: 0 });

  it('facing the top of the picture, the generator is far to the player’s right (81%: the pan tops out at 85%)', () => {
    assert.equal(GA_PAN_WIDTH, 0.85);
    assert.ok(genPan(facingUp) > 0.75, `pan ${genPan(facingUp).toFixed(2)}`);
    assert.equal(Math.round(genPan(facingUp) * 100), 81);
  });
  it('from the overhead camera it sits nearer the center, on the same side, and the same instance keeps playing', () => {
    const cam = run(facingUp, { type: 'listener', mode: 'camera' });
    assert.ok(genPan(cam) > 0.3, `still to the right: pan ${genPan(cam).toFixed(2)}`);
    assert.ok(genPan(cam) < genPan(facingUp) - 0.2, `clearly narrower: ${genPan(facingUp).toFixed(2)} to ${genPan(cam).toFixed(2)}`);
    assert.equal(Math.round(genPan(cam) * 100), 55);
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
      assert.ok(Math.abs(stereoPan(L, edge)) < 0.75, `edge ${edge.x},${edge.y}: ${stereoPan(L, edge).toFixed(2)}`);
      assert.ok(Math.abs(stereoPan(L, edge)) < onTheGround, `edge ${edge.x},${edge.y}: the height narrows the pan`);
    }
  });
  it('with the camera listening, turning the character changes nothing; with the player’s ears it does', () => {
    const cam = run(facingUp, { type: 'listener', mode: 'camera' });
    const before = genPan(cam);
    for (const facing of [45, 90, 180, 270]) assert.equal(genPan(run(cam, { type: 'face', who: 'player', facing })), before, `facing ${facing}`);
    assert.ok(gaFact(run(cam, { type: 'face', who: 'player', facing: 90 }), 'turned') > gaFact(cam, 'turned'), 'the turn is still a fact');
    const ears = run(facingUp, { type: 'face', who: 'player', facing: 180 });
    assert.ok(genPan(ears) < -0.75, 'for the player’s ears the generator crossed to the other side');
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
    assert.equal(back.log[back.log.length - 1].text, 'LISTENER moved back to YOU');
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
