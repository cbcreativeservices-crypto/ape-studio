/**
 * Game Audio lab, chapter 6 — page 22's capstone (pages/data/gaCapstone.ts).
 *
 * The capstone is "judged from what really happened in the scene and the
 * log, never from a button press" (owner's plan, section 4). So these tests
 * drive the REAL reducer and ask the requirements what they saw:
 *
 *   - a reference run of actions satisfies all seven; a fresh scene, none;
 *   - each requirement fails for the near miss it exists to catch (a
 *     crossing with no beds, a music change asked for "now", steps on one
 *     surface, an alarm with no visual cue …);
 *   - the visit counts from when the page opened, and starts again from
 *     zero after CLEAN SCENE (a reset), never reading negative; the clean
 *     scene every page opens on (`enterPage`) keeps the fact counts, counts
 *     as nothing the student did, and every requirement can be met from it;
 *   - the summary is plain text, says what was connected and one test for
 *     each choice, and calls itself a practice record, not a qualification;
 *   - the page is a BRIEF (audit 2, L-04): a goal chip names a result, never
 *     a key; each goal has one hint that names the page's keys, and the
 *     hints followed in order meet all seven from the clean scene;
 *   - the two sticky trays say the truth about the slider (W2-01), and the
 *     shared FACING lane never reaches 360° (W1 F19, W2-08).
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { gaInitial, gaReduce, type GaAction, type GaState } from '../src/screens/lab/gameaudio/model/gaModel.ts';
import { GA_LISTENING, GA_PLATFORMS } from '../src/screens/lab/gameaudio/pages/data/gaPlatforms.ts';
import {
  CAP_MUSIC_BAR,
  GA_CAPSTONE,
  GA_LISTENING_TEST,
  GA_SUMMARY_FOOT,
  gaCapstoneMet,
  gaCapstoneNextHint,
  gaCapstoneSummary,
  gaCapstoneSummaryLines,
  gaListeningTest,
  gaPlatformTest,
  gaStepTakes,
  gaVisitOpen,
  gaVisitSince,
  gaVisitStep,
  type GaVisit,
} from '../src/screens/lab/gameaudio/pages/data/gaCapstone.ts';

type Run = { s: GaState; v: GaVisit };

const open = (s: GaState = gaInitial()): Run => ({ s, v: gaVisitOpen(s) });
/** Send actions through the real reducer, the visit looking at every state. */
function play(run: Run, ...actions: GaAction[]): Run {
  let { s, v } = run;
  for (const a of actions) {
    s = gaReduce(s, a).state;
    v = gaVisitStep(v, s);
  }
  return { s, v };
}
const met = (r: Run): boolean[] => gaCapstoneMet(r.s, gaVisitSince(r.v, r.s));
const metIds = (r: Run): string[] => GA_CAPSTONE.filter((_, i) => met(r)[i]).map((q) => q.id);
/** The report that the waiting music change reached its boundary: the
 *  engine's when heard, the conductor's (model/gaStore) when sound is off. */
const applied = (r: Run): GaAction => ({ type: 'engine', evt: { e: 'music', what: 'applied', req: r.s.music.pending!.req, at: 0 } });
const step: GaAction = { type: 'step', who: 'player' };
const steps = (count: number): GaAction[] => Array.from({ length: count }, () => step);

/** The reference run: the scene the page asks the student to wire. The
 *  player starts on the stone path, facing the door. */
const REFERENCE: GaAction[] = [
  { type: 'scene', on: true },
  { type: 'door' },
  ...steps(6), // five on stone, the sixth through the doorway onto wood
  { type: 'machine', id: 'generator-1', on: true },
  { type: 'speed', id: 'generator-1', value: 0.8 },
  { type: 'post', event: 'vo_greeting', owner: 'guide' },
  { type: 'musicStart' },
  { type: 'mood', mood: 'alert' },
  { type: 'option', patch: { visualCue: true } },
  { type: 'alarm', on: true },
];

describe('capstone: the seven requirements are facts', () => {
  it('seven requirements: a RESULT for its chip, one hint, a label for the summary and a why line', () => {
    assert.deepEqual(
      GA_CAPSTONE.map((r) => r.id),
      ['steps', 'speed', 'zone', 'rattle', 'duck', 'music', 'cue'],
    );
    for (const r of GA_CAPSTONE) {
      assert.ok(r.label.length > 10 && r.label.length <= 46, `${r.id}: a summary label (${r.label.length})`);
      assert.ok(r.chip.length > 10 && r.chip.length <= 46, `${r.id}: a chip (${r.chip.length})`);
      // a brief, not a script (audit 2, L-04): the chip is the result, in plain words, and names no key
      assert.ok(!/\b[A-Z]{3,}\b/.test(r.chip), `${r.id}: "${r.chip}" names no key`);
      assert.ok(!/^(Walk|Run|Cross|Play|Make|Press|Open|Switch) /.test(r.chip), `${r.id}: "${r.chip}" is a result, not an instruction`);
      assert.ok(r.hint.length > 30 && /\.$/.test(r.hint), `${r.id}: a hint sentence`);
      assert.ok(r.why.length > 40 && /\.$/.test(r.why), `${r.id}: a why sentence`);
      assert.ok(!/\b(must|always|never|you will|master|at once|cross-fade|wired?)\b/i.test(`${r.label} ${r.chip} ${r.why} ${r.hint}`), `${r.id}: house wording`);
    }
    assert.equal(new Set(GA_CAPSTONE.map((r) => r.label)).size, 7);
    assert.equal(new Set(GA_CAPSTONE.map((r) => r.chip)).size, 7);
    // decision 6: the speed is kept on the generator, and the playing instance follows it
    assert.match(GA_CAPSTONE.find((r) => r.id === 'speed')!.why, /kept on the generator/);
    // every key a hint names is a label on page 22 (or the shared rack's)
    const page = readFileSync(join(process.cwd(), 'src/screens/lab/gameaudio/pages/p22Capstone.tsx'), 'utf8').replace(/\r\n/g, '\n');
    const shared = readFileSync(join(process.cwd(), 'src/screens/lab/gameaudio/pages/shared.tsx'), 'utf8');
    for (const r of GA_CAPSTONE) {
      for (const m of r.hint.matchAll(/\b[A-Z][A-Z0-9]{1,}(?::? [A-Z0-9]{2,})*\b/g)) {
        const word = m[0];
        // DUCK is a log word the hint quotes, not a key
        const known = word === 'DUCK' || [page, shared].some((src) => src.includes(`'${word}'`) || src.includes(`"${word}"`) || src.includes(`'${word} `) || src.includes(`'${word}:`) || src.includes(`('${word}'`));
        assert.ok(known, `${r.id}: the hint names "${word}", which is not a label on page 22`);
      }
    }
  });

  it('SHOW A HINT gives the first goal not met yet, and nothing once all seven are met', () => {
    assert.equal(gaCapstoneNextHint([false, false, false, false, false, false, false])!.id, 'steps');
    assert.equal(gaCapstoneNextHint([true, true, false, true, false, false, false])!.id, 'zone');
    assert.equal(gaCapstoneNextHint([true, true, true, true, true, true, true]), null);
  });

  it('the hints, followed in order from the clean scene, meet all seven (sound off)', () => {
    let r = play(open(), { type: 'enterPage' });
    // 1 steps: two steps on the stone path, GO: GRAVEL, one more step
    r = play(r, step, step, { type: 'move', who: 'player', x: 6.0, y: 2.6 }, step);
    // 2 speed: GENERATOR 1 on, then the slider
    r = play(r, { type: 'machine', id: 'generator-1', on: true }, { type: 'speed', id: 'generator-1', value: 0.8 });
    // 3 zone: SCENE on, OPEN DOOR, GO: WORKSHOP (to the doorway, through it, to the place)
    r = play(r, { type: 'scene', on: true }, { type: 'door' }, { type: 'move', who: 'player', x: 8.1, y: 5 }, { type: 'move', who: 'player', x: 9.9, y: 5 }, { type: 'move', who: 'player', x: 11, y: 5 });
    // 4 rattle: the door already played it; 5 duck: GUIDE LINE
    r = play(r, { type: 'post', event: 'vo_greeting', owner: 'guide' });
    // 6 music: MUSIC on, ALERT, and the bar arrives
    r = play(r, { type: 'musicStart' }, { type: 'mood', mood: 'alert' });
    r = play(r, applied(r));
    // 7 cue: VISUAL CUE on, then ALARM on
    r = play(r, { type: 'option', patch: { visualCue: true } }, { type: 'alarm', on: true });
    assert.deepEqual(metIds(r), ['steps', 'speed', 'zone', 'rattle', 'duck', 'music', 'cue']);
  });

  it('a fresh scene satisfies none of them', () => {
    assert.deepEqual(met(open()), [false, false, false, false, false, false, false]);
  });

  it('the reference run satisfies every one, with sound off (nobody is blocked by not hearing)', () => {
    let r = play(open(), ...REFERENCE);
    assert.equal(r.s.soundOn, false);
    // unheard, the music change still WAITS for its bar, in scene time
    assert.ok(r.s.music.pending && (r.s.music.pending.inS ?? 0) > 0, 'the change is waiting for the bar');
    assert.deepEqual(metIds(r), ['steps', 'speed', 'zone', 'rattle', 'duck', 'cue']);
    r = play(r, applied(r));
    assert.deepEqual(metIds(r), ['steps', 'speed', 'zone', 'rattle', 'duck', 'music', 'cue']);
    // and the facts behind them are the model's own
    const since = gaVisitSince(r.v, r.s);
    assert.ok(gaStepTakes(since).stone >= 2, 'two different takes on stone');
    assert.equal(gaStepTakes(since).wood, 1);
    assert.equal(since.zoneCross, 1, 'one crossing');
    assert.equal(since.zoneCrossFade, 1, 'and it cross-faded the beds');
    assert.equal(since[CAP_MUSIC_BAR], 1);
    assert.equal(since.duck, 1);
  });

  it('the reference run also satisfies every one with sound on, the music change applied by the engine on the bar', () => {
    let r = play(open(), { type: 'sound', on: true }, ...REFERENCE);
    // heard: the change WAITS for the bar; nothing is applied yet
    assert.ok(r.s.music.pending, 'the change is waiting');
    assert.equal(r.s.music.pending!.boundary, 'bar');
    assert.ok(!metIds(r).includes('music'));
    r = play(r, applied(r));
    assert.deepEqual(metIds(r), ['steps', 'speed', 'zone', 'rattle', 'duck', 'music', 'cue']);
  });

  it('pressing a key that changes nothing in the scene meets nothing', () => {
    // mood and a layer with no music running; speed on a stopped generator; the cue with no alarm
    const r = play(open(), { type: 'mood', mood: 'alert' }, { type: 'musicLayer', layer: 'pulse', on: false }, { type: 'speed', id: 'generator-1', value: 0.9 }, { type: 'option', patch: { visualCue: true } });
    assert.deepEqual(metIds(r), []);
  });
});

describe('capstone: each requirement refuses its near miss', () => {
  it('steps: one surface is not enough, and two surfaces with one take each is not enough', () => {
    const oneSurface = play(open(), ...steps(4));
    assert.ok(gaStepTakes(gaVisitSince(oneSurface.v, oneSurface.s)).stone >= 2);
    assert.ok(!metIds(oneSurface).includes('steps'), 'stone only');
    // variation off: every step is take 1, on stone and then on wood
    const noVariation = play(open(), { type: 'option', patch: { variation: false } }, { type: 'door' }, ...steps(6));
    const takes = gaStepTakes(gaVisitSince(noVariation.v, noVariation.s));
    assert.deepEqual([takes.stone, takes.wood], [1, 1]);
    assert.ok(!metIds(noVariation).includes('steps'), 'two surfaces, one take each');
  });

  it('speed: a speed moved before the generator ran does not count, and the generator must still be running', () => {
    let r = play(open(), { type: 'speed', id: 'generator-1', value: 0.9 }, { type: 'machine', id: 'generator-1', on: true });
    assert.ok(!metIds(r).includes('speed'), 'set first, started after');
    r = play(r, { type: 'speed', id: 'generator-1', value: 0.5 });
    assert.ok(metIds(r).includes('speed'));
    r = play(r, { type: 'machine', id: 'generator-1', on: false });
    assert.ok(!metIds(r).includes('speed'), 'stopped again');
  });

  it('zone: a crossing with the beds silent proves no cross-fade', () => {
    let r = play(open(), { type: 'door' }, ...steps(6));
    assert.equal(gaVisitSince(r.v, r.s).zoneCross, 1);
    assert.equal(gaVisitSince(r.v, r.s).zoneCrossFade, undefined, 'the model counted no cross-fade');
    assert.ok(!metIds(r).includes('zone'), 'crossed, but no beds');
    // the model's line since audit 2 (REPORT_M section 3): a capital, no dash
    assert.match(r.s.log.at(-1)!.text, /^ZONE: the listener entered the workshop\. No ambience bed is playing, so nothing fades$/);
    // starting the scene afterwards does not turn that old crossing into one
    r = play(r, { type: 'scene', on: true });
    assert.ok(!metIds(r).includes('zone'));
    // walking back out with the beds running does
    r = play(r, { type: 'face', who: 'player', facing: 270 }, ...steps(2));
    assert.ok(metIds(r).includes('zone'));
  });

  it('rattle: a door with its rattle layer switched off does not count', () => {
    let r = play(open(), { type: 'option', patch: { doorRattle: false } }, { type: 'door' });
    assert.ok(!metIds(r).includes('rattle'));
    r = play(r, { type: 'option', patch: { doorRattle: true } }, { type: 'door' });
    assert.ok(metIds(r).includes('rattle'));
  });

  it('duck: a line with ducking off, or routed to the wrong bus, ducks nothing', () => {
    const off = play(open(), { type: 'option', patch: { duck: false } }, { type: 'post', event: 'vo_greeting', owner: 'guide' });
    assert.ok(!metIds(off).includes('duck'));
    const wrongBus = play(open(), { type: 'fault', patch: { voWrongBus: true } }, { type: 'post', event: 'vo_greeting', owner: 'guide' });
    assert.ok(!metIds(wrongBus).includes('duck'));
  });

  it('music: a change asked for "now" is not a change on the bar', () => {
    const now = play(open(), { type: 'option', patch: { musicBoundary: 'now' } }, { type: 'musicStart' }, { type: 'mood', mood: 'alert' });
    assert.ok((gaVisitSince(now.v, now.s).musicApplied ?? 0) > 0, 'it was applied');
    assert.ok(!metIds(now).includes('music'), 'but not on a bar');
    // asked on the bar, then the option is changed while it waits — the request keeps its bar
    for (const sound of [true, false]) {
      let r = play(open(), { type: 'sound', on: sound }, { type: 'musicStart' }, { type: 'mood', mood: 'alert' });
      assert.equal(r.s.music.pending!.boundary, 'bar');
      r = play(r, { type: 'option', patch: { musicBoundary: 'now' } });
      r = play(r, applied(r));
      assert.ok(metIds(r).includes('music'), `sound ${sound ? 'on' : 'off'}`);
    }
    // a bar request that is WITHDRAWN by a "now" change proves nothing about the bar
    let w = play(open(), { type: 'musicStart' }, { type: 'mood', mood: 'alert' }, { type: 'option', patch: { musicBoundary: 'now' } }, { type: 'mood', mood: 'calm' });
    assert.equal(w.s.music.pending, null);
    // GF1 B-14: CALM is what sounds, so nothing is applied: the model counts it as no change
    assert.ok((gaVisitSince(w.v, w.s).musicWithdrawn ?? 0) > 0);
    assert.equal(gaVisitSince(w.v, w.s).musicApplied ?? 0, 0);
    assert.equal(gaVisitSince(w.v, w.s).musicNoChange ?? 0, 1);
    assert.ok(!metIds(w).includes('music'), 'the bar request never landed');
    // and a late report for the withdrawn request changes nothing
    w = play(w, { type: 'engine', evt: { e: 'music', what: 'applied', req: 'm-gone', at: 0 } });
    assert.ok(!metIds(w).includes('music'));
  });

  it('cue: the alarm alone, or the cue alone, is not an accessible alarm; nor is one left running from an earlier page', () => {
    assert.ok(!metIds(play(open(), { type: 'alarm', on: true })).includes('cue'));
    assert.ok(!metIds(play(open(), { type: 'option', patch: { visualCue: true } })).includes('cue'));
    // left running before the visit opened: the state alone does not count
    const earlier = gaReduce(gaReduce(gaInitial(), { type: 'option', patch: { visualCue: true } }).state, { type: 'alarm', on: true }).state;
    let r = open(earlier);
    assert.ok(!metIds(r).includes('cue'));
    r = play(r, { type: 'alarm', on: false }, { type: 'alarm', on: true });
    assert.ok(metIds(r).includes('cue'));
  });
});

describe('capstone: the visit', () => {
  it('counts only what happened after the page opened', () => {
    const earlier = play(open(), ...REFERENCE).s;
    const r = open(earlier);
    assert.deepEqual(gaVisitSince(r.v, r.s), {});
    // the generator and the alarm are still running, but nothing was DONE on this visit
    assert.deepEqual(metIds(r), []);
  });

  it('starts again from zero after a clean scene, and never reads negative', () => {
    let r = play(open(), ...REFERENCE);
    r = play(r, { type: 'reset' });
    const since = gaVisitSince(r.v, r.s);
    assert.deepEqual(since, {});
    assert.deepEqual(metIds(r), []);
    r = play(r, { type: 'door' });
    assert.ok(Object.values(gaVisitSince(r.v, r.s)).every((x) => x > 0));
    assert.ok(metIds(r).includes('rattle'));
  });

  it('the clean scene every page opens on is nothing the student did, and every requirement can be met from it', () => {
    // a scene another page left behind: everything running, the door open, YOU in the workshop
    let r = play(open(), ...REFERENCE);
    r = play(r, applied(r));
    const left = r.s;
    // page 22 opens: the visit starts, then the rack sends the clean scene
    r = play(open(left), { type: 'enterPage' });
    assert.equal(r.s.inst.length, 0, 'nothing is playing');
    assert.equal(r.s.music.on, false);
    assert.equal(r.s.doorOpen, false);
    assert.equal(r.s.machines[0].on, false);
    assert.deepEqual([r.s.chars.player.x, r.s.chars.player.y, r.s.chars.player.facing], [5.2, 5, 90]);
    assert.deepEqual([r.s.options.variation, r.s.options.duck, r.s.options.musicBoundary, r.s.options.doorRattle, r.s.options.visualCue], [true, true, 'bar', true, false]);
    assert.equal(r.s.log.length, 0, 'an empty log');
    // the fact counts are kept, so the visit sees no reset and nothing new
    assert.deepEqual(gaVisitSince(r.v, r.s), {});
    assert.deepEqual(metIds(r), []);
    // from that clean scene the page's own keys meet all seven (the reference run is those keys)
    r = play(r, ...REFERENCE);
    assert.deepEqual(metIds(r), ['steps', 'speed', 'zone', 'rattle', 'duck', 'cue']);
    r = play(r, applied(r));
    assert.deepEqual(metIds(r), ['steps', 'speed', 'zone', 'rattle', 'duck', 'music', 'cue']);
  });

  it('the other ways the page offers also work from the clean scene: a place chip for the crossing, gravel for the second surface', () => {
    const clean = play(open(), { type: 'enterPage' });
    // GO: WORKSHOP is three moves (to the door, through it, to the place): one crossing, no footsteps
    let r = play(clean, { type: 'scene', on: true }, { type: 'door' }, { type: 'move', who: 'player', x: 8.1, y: 5 }, { type: 'move', who: 'player', x: 9.9, y: 5 }, { type: 'move', who: 'player', x: 11, y: 5 });
    assert.equal(gaVisitSince(r.v, r.s).zoneCrossFade, 1);
    assert.ok(metIds(r).includes('zone') && metIds(r).includes('rattle'));
    assert.ok(!metIds(r).includes('steps'), 'a place chip plays no footsteps');
    // with the door closed the same chip stops YOU at the door
    r = play(clean, { type: 'move', who: 'player', x: 8.1, y: 5 }, { type: 'move', who: 'player', x: 9.9, y: 5 });
    assert.ok(r.s.chars.player.x < 9, 'stopped on the courtyard side');
    assert.ok(!metIds(r).includes('zone'));
    // two steps on the stone path, then GO: GRAVEL and one step: two surfaces, two takes on one
    r = play(clean, step, step, { type: 'move', who: 'player', x: 6, y: 2.6 }, step);
    const takes = gaStepTakes(gaVisitSince(r.v, r.s));
    assert.deepEqual([takes.stone, takes.gravel], [2, 1]);
    assert.ok(metIds(r).includes('steps'));
  });
});

describe('capstone: the learning summary', () => {
  it('every platform and every listening setup has one test', () => {
    for (const p of GA_PLATFORMS) assert.ok((gaPlatformTest(p.id) ?? '').length > 30, p.id);
    assert.deepEqual(Object.keys(GA_LISTENING_TEST).sort(), GA_LISTENING.map((l) => l.id).sort());
    for (const l of GA_LISTENING) {
      const t = gaListeningTest(l.id)!;
      assert.match(t, /Confirm /, `${l.id}: a test says what to confirm`);
      assert.ok(!/\b(must|always|never)\b/i.test(t));
    }
    assert.equal(gaPlatformTest(null), null);
    assert.equal(gaListeningTest(null), null);
  });

  it('before anything is chosen or wired it says so', () => {
    const text = gaCapstoneSummary(null, null, GA_CAPSTONE.map(() => false));
    assert.match(text, /^Game Audio Lab: learning summary\n/);
    assert.match(text, /PLATFORM\n- not chosen yet/);
    assert.match(text, /LISTENING SETUP\n- not chosen yet/);
    assert.match(text, /CONNECTED IN THE SCENE\n- Nothing yet\./);
    assert.ok(!/One test:/.test(text));
  });

  it('it lists the choices, one test for each, what was wired and why', () => {
    const done = GA_CAPSTONE.map((r) => r.id === 'steps' || r.id === 'duck');
    const text = gaCapstoneSummary('console', 'tv', done);
    assert.match(text, /PLATFORM\n- Game consoles\n {2}One test: Suspend the game/);
    assert.match(text, /LISTENING SETUP\n- TV speakers\n {2}One test: Listen from across a room/);
    assert.match(text, /- Done: Footsteps on two surfaces, two takes on one\n {2}One footstep event served every surface\./);
    assert.match(text, /- Done: A guide line that ducked the mix/);
    assert.match(text, /STILL TO CONNECT\n- Generator running/);
    assert.ok(!/Done: One music change/.test(text));
  });

  it('it is plain text, and a practice record, not a qualification', () => {
    const all = gaCapstoneSummary('mobile', 'headphones', GA_CAPSTONE.map(() => true));
    assert.ok(all.endsWith(GA_SUMMARY_FOOT));
    assert.match(GA_SUMMARY_FOOT, /not a qualification/);
    assert.ok(!/certificate|exam|passed|score|grade/i.test(all));
    assert.ok(!/STILL TO CONNECT/.test(all));
    assert.ok(!/wire/i.test(all), 'the summary says connect, not wire (audit 2, L-32)');
    assert.ok(!/[<>{}*_#]/.test(all), 'no markup');
    const lines = gaCapstoneSummaryLines('mobile', 'headphones', GA_CAPSTONE.map(() => true));
    assert.equal(lines.filter((l) => l.kind === 'item' && l.text.startsWith('Done: ')).length, 7);
    assert.equal(lines.at(-1)!.kind, 'foot');
  });
});

describe('capstone: the page says the truth about its controls', () => {
  const page = readFileSync(join(process.cwd(), 'src/screens/lab/gameaudio/pages/p22Capstone.tsx'), 'utf8').replace(/\r\n/g, '\n');
  const body = page.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
  it('the two sticky trays say the slider changes only when the tray closes (W2-01), and each title is short enough not to be cut', () => {
    const titles = [...body.matchAll(/export const P22_(MOVE|SOUNDS)_TITLE = '([^']+)'/g)].map((m) => m[2]);
    assert.equal(titles.length, 2);
    for (const t of titles) {
      assert.match(t, /CLOSE THIS: THE SLIDER /, t);
      assert.ok(t.length <= 40, `"${t}" is ${t.length} characters`);
    }
    assert.ok(!/SLIDER = /.test(body), 'the old titles, which said the slider was already bound, are gone');
    assert.match(body, /The slider changes to their control only when you close the tray\./);
  });
  it('step 2 is a brief: it names the trays, not the keys inside them', () => {
    const step2 = body.slice(body.indexOf('<Step n={2}>'), body.indexOf('<Step n={3}>'));
    const doLine = step2.match(/<Do>([\s\S]*?)<\/Do>/)![1];
    for (const key of ['OPEN DOOR', 'STEP FORWARD', 'GUIDE LINE', 'GENERATOR 1', 'ALERT', 'VISUAL CUE', 'ALARM', 'SCENE']) assert.ok(!doLine.includes(key), `step 2 does not script ${key}`);
    assert.match(doLine, /seven goals/);
    assert.ok(!/<Do>/.test(body.slice(body.indexOf('<Step n={3}>'), body.indexOf('<Step n={4}>'))), 'step 3 has no Do line');
  });
  it('the Wwise word is not used as the general one (A1), and the old names are gone', () => {
    assert.ok(!/Game Syncs change them/.test(body));
    assert.ok(!/'Game Syncs'/.test(body), 'not a chip on the capstone');
    assert.ok(!/'WORLD'|'SETUP'|WORLD ·|Wired in/.test(body), 'WORLD is SOUNDS, SETUP is REPORT');
    assert.ok(!/LabChip/.test(body), 'the trays use the 44 pt TrayChip');
  });
  it('the REPORT tray puts SHARE SUMMARY first and leaves the tests to the summary card (W2-03)', () => {
    const tray = body.slice(body.indexOf('function SummaryTray'), body.indexOf('function HintLine'));
    assert.ok(tray.indexOf('SHARE SUMMARY') < tray.indexOf('PLATFORM'), 'SHARE first');
    assert.ok(!/One test/.test(tray), 'the one-test lines are in the summary card only');
  });
});

describe('the shared FACING lane (pages/shared.tsx)', () => {
  const src = readFileSync(join(process.cwd(), 'src/screens/lab/gameaudio/pages/shared.tsx'), 'utf8');
  const m = src.match(/export const facingFromLane = \(v: number\): number => ([^;]+);/);
  it('the right end is 355°, never 360° (which the model keeps as 0°, so the knob jumped left: W1 F19, W2-08)', () => {
    assert.ok(m, 'facingFromLane is in shared.tsx');
    const f = new Function('v', `return ${m![1]};`) as (v: number) => number;
    assert.equal(f(0), 0);
    assert.equal(f(0.5), 180);
    assert.equal(f(1), 355);
    assert.equal(f(1.2), 355);
    assert.equal(f(-0.1), 0);
    for (let i = 0; i <= 100; i++) assert.equal(f(i / 100) % 5, 0, 'steps of 5°');
    // the lane, its readout and its key all use it
    const key = src.slice(src.indexOf('export const facingKey'));
    assert.equal((key.match(/facingFromLane\(v\)/g) ?? []).length, 3);
  });
});
