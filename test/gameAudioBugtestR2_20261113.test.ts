/**
 * Game Audio lab — ROUND-2 bug test of 2026-11-13, fixer R2-GA.
 * docs/labs/bugtest_2026_11_13_r2/R2_GAMEAUDIO_1_PAGES_01_11.md (R2-GA1-…)
 * and R2_GAMEAUDIO_2_PAGES_12_22.md (R2-GA2-…). Each test pins one fix and
 * would have failed on the code as it was. Proven on the pure model and the
 * pure helpers; a page's wiring is pinned by reading its source (CRLF
 * normalized), the house's way for TSX that node cannot render.
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it } from 'node:test';
import { gaPlantedPick, gaPlantedView, gaPlantedWhere, gaProofStep } from '../src/screens/lab/gameaudio/bitsLogic.ts';
import { GA_TAKES_MAX, gaFact, gaInitial, gaReduce, type GaAction, type GaState } from '../src/screens/lab/gameaudio/model/gaModel.ts';
import { GA_DEMO_LINE_MAX, gaGenre } from '../src/screens/lab/gameaudio/pages/data/gaGenres.ts';
import { benchAdvance, benchStart, faultActions, faultFixed, faultOpen, faultDef, strayLoops, type Bench } from '../src/screens/lab/gameaudio/pages/data/gaFaults.ts';
import { memoryRowSpoken, type MemoryRow } from '../src/screens/lab/gameaudio/pages/data/gaBudget.ts';
import { G04 } from '../src/screens/lab/gameaudio/pages/guides/p04.ts';
import { G06 } from '../src/screens/lab/gameaudio/pages/guides/p06.ts';
import { G07 } from '../src/screens/lab/gameaudio/pages/guides/p07.ts';
import { G10 } from '../src/screens/lab/gameaudio/pages/guides/p10.ts';
import { G19 } from '../src/screens/lab/gameaudio/pages/guides/p19.ts';
import { aChainStep, aChainSummary, aTakes } from '../src/screens/lab/gameaudio/scene/hud/aModel.ts';
import { bMusicSummary } from '../src/screens/lab/gameaudio/scene/hud/bModel.ts';

const GA = join(process.cwd(), 'src/screens/lab/gameaudio');
const read = (p: string) => readFileSync(join(GA, p), 'utf8').replace(/\r\n/g, '\n');
/** The source with its comments taken out, so a test reads what runs. */
const code = (p: string) => read(p).replace(/\{\/\*[\s\S]*?\*\/\}/g, '').replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
const run = (s: GaState, ...actions: GaAction[]): GaState => actions.reduce((st, a, i) => gaReduce(st, a, st.t + 0.5 + i * 0.01).state, s);
const fresh = () => run(gaInitial(), { type: 'enterPage' });
const guideText = (g: typeof G06) => [g.intro?.learning, g.intro?.start, ...g.seeing, ...g.control, ...g.changes, ...g.teaches, ...g.tryThis].join('\n');

/* ── R2-GA1-01: a planted fault never names or marks itself ──────────────── */

describe('R2-GA1-01: after START THE FAULT every setting looks as it did, until the symptom', () => {
  it('the pure rule: shown as before while unseen; the symptom or the learner’s own other choice shows the real value', () => {
    const plant = { at: 2, shown: false, touched: false };
    assert.deepEqual(gaPlantedView(null, 0, true), { unnamed: false, shown: true }, 'not started: the real value');
    assert.deepEqual(gaPlantedView(plant, 2, true), { unnamed: true, shown: false }, 'planted, no new symptom: as before');
    assert.deepEqual(gaPlantedView(plant, 3, true), { unnamed: false, shown: true }, 'one more symptom: the real value');
    assert.deepEqual(gaPlantedView(plant, 2, false), { unnamed: false, shown: false }, 'corrected: the real value');
    assert.deepEqual(gaPlantedView({ ...plant, touched: true }, 2, true), { unnamed: false, shown: true });
    // choosing what it shows changes nothing; the other value is the learner's own change
    assert.deepEqual(gaPlantedPick(plant, true, false), { apply: false, touch: false });
    assert.deepEqual(gaPlantedPick(plant, true, true), { apply: true, touch: true });
    assert.deepEqual(gaPlantedPick(plant, false, false), { apply: true, touch: false });
  });
  for (const p of ['pages/p06Pipeline.tsx', 'pages/p07Instances.tsx', 'pages/p08GameSyncs.tsx', 'pages/p10Loops.tsx']) {
    it(`${p}: no "?" value, no lock, no locked row; the setting reads plant.shown`, () => {
      const c = code(p);
      assert.match(c, /const plant = usePlantedFault\(/);
      assert.match(c, /plant\.start\(/);
      assert.doesNotMatch(c, /'\?'/, 'no "?" value');
      assert.doesNotMatch(c, /locked: unnamed/, 'no lock while unnamed');
      assert.doesNotMatch(c, /TrayLocked/, 'no "· ?" row');
      assert.match(c, /plant\.pick\(/, 'a choice goes through the rule above');
    });
  }
  it('the "?" row is gone from the kit', () => {
    assert.doesNotMatch(code('pages/chbBits.tsx'), /TrayLocked/);
  });
  it('page 6: DOOR FILE, its chooser and the chain cards all read the shown value', () => {
    const c = code('pages/p06Pipeline.tsx');
    assert.match(c, /const fileWord = shownMissing \? 'MISSING' : 'FOUND';/);
    assert.match(c, /selectedId: shownMissing \? 'missing' : 'ok'/);
    assert.match(c, /tint: shownMissing \? colors\.red : undefined/);
    assert.match(c, /doorChain\(shownMissing, \{ closing \}\)/);
  });
  it('pages 7, 8 and 10: the rule row and SCOPE read the shown value', () => {
    assert.match(code('pages/p07Instances.tsx'), /<GeneratorsTray leave=\{plant\.shown\}/);
    assert.match(code('pages/p10Loops.tsx'), /<SoundsTray pile=\{plant\.shown\}/);
    const p8 = code('pages/p08GameSyncs.tsx');
    assert.match(p8, /valueLabel: shownGlobal \? 'GLOBAL' : 'LOCAL'/);
    assert.match(p8, /selectedId: shownGlobal \? 'global' : 'local'/);
  });
  it('the guides no longer say the "?" marks the fault or that a setting stays locked', () => {
    for (const [n, g] of [['p06', G06], ['p07', G07], ['p10', G10]] as const) {
      const t = guideText(g);
      assert.doesNotMatch(t, /question mark|reads \? instead|stays locked until|While a fault you started/, n);
    }
    assert.match(guideText(G06), /Nothing on the screen names it until you have made the problem happen/);
  });
  it('pages 8 and 10: the common mistake (the cause in words) sits BELOW the card, not above it', () => {
    for (const p of ['pages/p08GameSyncs.tsx', 'pages/p10Loops.tsx']) {
      const c = code(p);
      const card = c.indexOf('<FaultCard');
      const note = c.indexOf('<Note tone="mistake">');
      assert.ok(card > 0 && note > card && note < c.indexOf('<Step n={5}>'), `${p}: the note follows the card in step 4`);
      assert.equal(c.split('<Note tone="mistake">').length - 1, 1, `${p}: one common mistake`);
    }
  });
  it('R2-GA1-11: before the log has named a missing file, DOOR FILE’s wrong option says nothing about the build', () => {
    assert.match(code('pages/p06Pipeline.tsx'), /\$\{sawMissing \? ' No file with that name is in the build\.' : ''\}/);
  });
});

/* ── R2-GA1-02, -06, -07, -12, -13: page 4 ───────────────────────────────── */

describe('page 4', () => {
  it('R2-GA1-02: the camera’s "nearer the center" is said for FACING 0° only; what is always true is said in general', () => {
    const changes = G04.changes.join('\n');
    assert.doesNotMatch(changes, /From the camera the generator sits nearer the center, because/);
    assert.match(changes, /From the camera, left and right follow the picture, so FACING no longer changes GEN PAN\. At 0° the generator sits nearer the center\./);
    const c = read('pages/p04Games.tsx');
    assert.match(c, /At 0°, for your ears the generator is far to the right\./);
    assert.doesNotMatch(c, /They sit less far to the side, because the camera is high above them/);
  });
  it('R2-GA1-06: the camera goal counts only the LISTENER tray’s own choice, not STRATEGY’s demonstration', () => {
    const c = code('pages/p04Games.tsx');
    assert.match(c, /hit: choseCamera && since\('listener:camera'\) > 0/);
    assert.match(c, /<ListenerTray onCamera=\{\(\) => setChoseCamera\(true\)\} \/>/);
    assert.deepEqual(gaGenre('strategy')!.demo.actions, [{ type: 'listener', mode: 'camera' }], 'the demonstration still hands the camera over');
  });
  it('R2-GA1-07: GEN PAN is "—" for a generator that is not played; OPEN WORLD leaves it VIRTUAL', () => {
    const c = code('pages/p04Games.tsx');
    assert.match(c, /if \(!voices\.length\) return \{ v: '—'/);
    assert.match(c, /if \(voices\.every\(\(v\) => v\.state === 'virtual'\)\) return \{ v: '—'/);
    const s = run(fresh(), ...gaGenre('sandbox')!.demo.actions);
    const gen = s.inst.find((i) => i.event === 'generator')!;
    assert.ok(s.voices.filter((v) => v.inst === gen.id).every((v) => v.state === 'virtual'), 'the case the "—" is for');
  });
  it('R2-GA1-12 / -13: RHYTHM says VOICES leaves music out; RACING promises no "then … faster"', () => {
    assert.match(gaGenre('rhythm')!.demo.line, /VOICES leaves music out\./);
    assert.doesNotMatch(gaGenre('racing')!.demo.line, /\bthen\b|faster|closer/);
    for (const id of ['rhythm', 'racing'] as const) assert.ok(gaGenre(id)!.demo.line.length <= GA_DEMO_LINE_MAX, id);
  });
  it('B-S3-05: a GAMES pick starts the scene again but keeps the page’s log clock', () => {
    let s = run(fresh(), { type: 'tick', t: 50 });
    const opened = s.tPage;
    s = run(s, { type: 'enterPage', keepClock: true }, ...gaGenre('educational')!.demo.actions);
    assert.equal(s.tPage, opened, 'the log keeps counting from the page’s opening');
    assert.ok(s.log.length > 0 && s.log[0].t - s.tPage > 40, 'a line after the pick does not read 0.0 s');
    assert.equal(run(s, { type: 'enterPage' }).tPage, run(s, { type: 'enterPage' }).t, 'a real page open still starts the clock');
    assert.match(code('pages/p04Games.tsx'), /gaDispatch\(\{ type: 'enterPage', keepClock: true \}\);/);
  });
});

/* ── R2-GA1-03 / -10: page 9's strip of takes ───────────────────────────── */

describe('R2-GA1-03 / -10: door presses no longer push footstep takes out of the strip', () => {
  it('16 steps, then 4 door presses: the strip still shows the eight newest footsteps, and the last of them is LAST TAKE', () => {
    let s = fresh();
    for (let k = 0; k < 16; k++) s = run(s, { type: 'step', who: 'player', dx: 0, dy: 0 });
    const before = aTakes(s).map((t) => t.key);
    assert.equal(before.length, GA_TAKES_MAX);
    s = run(s, { type: 'door' }, { type: 'door' }, { type: 'door' }, { type: 'door' });
    const after = aTakes(s);
    assert.deepEqual(after.map((t) => t.key), before, 'no footstep take was lost');
    assert.ok(s.recentTakes!.some((t) => t.group === 'door_open/door'), 'the door’s one-take layers are still recorded');
    const lastStep = [...s.recentTakes!].reverse().find((t) => t.of > 1)!;
    assert.equal(after[after.length - 1].take, lastStep.take);
  });
  it('the record stays bounded: one-take entries are dropped first past twice the strip', () => {
    let s = fresh();
    for (let k = 0; k < 30; k++) s = run(s, { type: 'door' });
    assert.ok(s.recentTakes!.length <= 2 * GA_TAKES_MAX);
  });
});

/* ── R2-GA1-05: page 10 needs proof ─────────────────────────────────────── */

describe('R2-GA1-05: page 10’s FIXED needs a step with the scene on after the repair, not ■ STOP alone', () => {
  it('the card reads FIXED only from the proof', () => {
    const c = code('pages/p10Loops.tsx');
    assert.match(c, /const proved = useFreshProof\(pileCount, chbSteps\(s, 'player'\), pileSeen && !s\.faults\.bedPileUp && sceneOn && clean\);/);
    assert.match(c, /const fixed = pileSeen && !s\.faults\.bedPileUp && clean && proved;/);
    assert.match(c, /fixed=\{fixed\}/);
    assert.match(c, /const faultArmed = s\.faults\.bedPileUp \|\| \(pileSeen && !fixed\);/, 'the card stays active until then');
  });
  it('the model: after the rule is corrected, a step with the scene on stacks nothing', () => {
    let s = run(fresh(), { type: 'fault', patch: { bedPileUp: true } }, { type: 'scene', on: true }, { type: 'step', who: 'player', dx: 0.3, dy: 0 }, { type: 'step', who: 'player', dx: 0.3, dy: 0 });
    assert.ok(gaFact(s, 'bedPileUp') > 0, 'the symptom');
    s = run(s, { type: 'fault', patch: { bedPileUp: false } }, { type: 'stopAll' }, { type: 'scene', on: true });
    const piled = gaFact(s, 'bedPileUp');
    s = run(s, { type: 'step', who: 'player', dx: 0.3, dy: 0 });
    assert.equal(gaFact(s, 'bedPileUp'), piled);
    assert.equal(s.inst.filter((i) => i.event === 'bed_yard' || i.event === 'bed_room').length, 2);
  });
});

/* ── R2-GA2-01: page 19's fault 5 ───────────────────────────────────────── */

type Run = { s: GaState; b: Bench };
const drive = (r: Run, ...actions: GaAction[]): Run => actions.reduce((x, a) => {
  const next = run(x.s, a);
  return { s: next, b: benchAdvance(x.b, x.s, next) };
}, r);
const ORPHAN: GaAction[] = [{ type: 'addMachine' }, { type: 'machine', id: 'generator-2', on: true }, { type: 'removeMachine', id: 'generator-2' }];

describe('R2-GA2-01: fault 5 counts only after the removal is tested again, and a new generator never adopts the orphan', () => {
  const planted = (): Run => {
    const s = fresh();
    return drive({ s, b: benchStart(s) }, ...faultActions('orphan', true), ...ORPHAN, ...faultActions('orphan', false));
  };
  it('ADD GENERATOR 2 over the orphan places nothing, says why, and fixes nothing', () => {
    let r = planted();
    assert.equal(strayLoops(r.s).length, 1);
    r = drive(r, { type: 'addMachine' });
    assert.equal(r.s.machines.length, 1, 'not placed');
    assert.equal(strayLoops(r.s).length, 1, 'the orphan plays on, not taken over');
    const last = r.s.log[r.s.log.length - 1];
    assert.equal(last.kind, 'refused');
    assert.match(last.text, /GENERATOR 2 is not placed again: its old loop, instance i\d+, still plays with no owner\. ■ STOP silences it/);
    assert.ok(!faultFixed('orphan', r.b, r.s));
  });
  it('■ STOP alone is not the re-test; ADD, switch on, REMOVE with the rule right is', () => {
    let r = drive(planted(), { type: 'stopAll' });
    assert.ok(faultOpen('orphan', r.b, r.s) && !faultFixed('orphan', r.b, r.s), 'still active: silenced, not tested');
    r = drive(r, { type: 'addMachine' });
    assert.equal(r.s.machines.find((m) => m.id === 'generator-2')?.on, false, 'a new generator comes in OFF');
    r = drive(r, { type: 'machine', id: 'generator-2', on: true }, { type: 'removeMachine', id: 'generator-2' });
    assert.ok(faultFixed('orphan', r.b, r.s));
  });
  it('a removal tested with the rule still wrong proves nothing', () => {
    const s = fresh();
    let r = drive({ s, b: benchStart(s) }, ...faultActions('orphan', true), ...ORPHAN, { type: 'stopAll' }, ...ORPHAN);
    assert.equal(r.b.orphan.proved ?? 0, 0);
    r = drive(r, { type: 'stopAll' }, ...faultActions('orphan', false), ...ORPHAN);
    assert.ok(faultFixed('orphan', r.b, r.s));
  });
  it('the card’s third hint and the guide ask for the re-test, with no dogma word', () => {
    const h = faultDef('orphan').hints[2];
    assert.match(h, /Press ■ STOP to silence the stray loop\. Then test again: ADD GENERATOR 2, switch it on, REMOVE GENERATOR 2/);
    assert.doesNotMatch(h, /\b(must|always|never)\b/i);
    assert.match(G19.changes.join(' '), /Fault 5 also needs the stray loop stopped and the removal tested again\./);
  });
});

/* ── R2-GA2-04 / -12: page 14 ───────────────────────────────────────────── */

describe('page 14', () => {
  it('R2-GA2-04: a stinger with CHANGE AT ▸ NOW plays but is not "on a boundary"; one that waits for the bar is', () => {
    let s = run(fresh(), { type: 'musicStart' }, { type: 'option', patch: { musicBoundary: 'now' } }, { type: 'stinger' });
    assert.equal(gaFact(s, 'stingerPlayed'), 1);
    assert.equal(gaFact(s, 'stingerOnLine'), 0);
    s = run(s, { type: 'option', patch: { musicBoundary: 'bar' } }, { type: 'stinger' });
    // the bar line comes (the engine's answer, as test/gameAudioChC lands it)
    s = run(s, { type: 'engine', evt: { e: 'music', what: 'applied', req: s.music.stinger!.req, at: 0 } });
    assert.equal(gaFact(s, 'stingerPlayed'), 2);
    assert.equal(gaFact(s, 'stingerOnLine'), 1);
    assert.match(code('pages/p14Music.tsx'), /\{ label: 'Play a stinger on a boundary', hit: since\('stingerOnLine'\) > 0 \}/);
  });
  it('R2-GA2-12: while only a stinger waits, the strip’s label no longer says "Nothing is waiting"', () => {
    let s = run(fresh(), { type: 'musicStart' }, { type: 'option', patch: { musicBoundary: 'phrase' } }, { type: 'stinger' });
    const said = bMusicSummary(s, s.t);
    assert.doesNotMatch(said, /Nothing is waiting/);
    assert.match(said, /No layer or mood change is waiting\..*A stinger waits for its line\./);
    s = run(s, { type: 'stopAll' });
  });
});

/* ── the S3s ────────────────────────────────────────────────────────────── */

describe('round-2 S3s', () => {
  it('R2-GA2-05: page 15’s refused row draws no cut cross over its words', () => {
    assert.match(code('scene/hud/bLines.tsx'), /\{wasCut && !refused \? <Cross x=\{cutX\} y=\{mid\} \/> : null\}/);
  });
  it('R2-GA2-06: page 17’s explanation agrees with "HELD: 2 PROTECTED"', () => {
    const c = read('pages/p17Budgets.tsx');
    assert.match(c, /explain="No voice can be taken: both are protected/);
    assert.doesNotMatch(c, /one is protected and the other is more important than the impact/);
  });
  it('R2-GA2-09: page 21 no longer says every sound is a file made ahead of time (the lab builds each in the app)', () => {
    const c = code('pages/p21Today.tsx');
    assert.doesNotMatch(c, /made ahead of time/);
    assert.match(c, /Each sound here is built once in the app, then played as a fixed file\./);
    assert.match(read('sounds/gaSoundBank.ts'), /synthesis|synthesised/i, 'what the words rest on');
  });
  it('R2-GA2-10: page 20’s tool header is the short word on a narrow stage', () => {
    assert.match(code('scene/hud/cToolsStage.tsx'), /\{w < 360 \? 'SIMPLIFIED' : 'SIMPLIFIED · NOT ONE REAL PRODUCT'\}/);
  });
  it('R2-GA2-11: page 12’s wall title keeps a visible gap after the number', () => {
    assert.match(code('scene/hud/bWall.tsx'), /`IF \$\{t\.name\}  PLAYED`/);
  });
  it('R2-GA2-13 (b): the DOOR label moves below the doorway while a figure stands on it', () => {
    const c = code('scene/GaScene.tsx');
    assert.match(c, /const below: Line = \{ \.\.\.doorLine, y: DOOR_Y1 \+ 0\.3 \+ tag \};/);
    assert.match(c, /const roomSide: Line = \{ \.\.\.doorLine, x: WALL_X \+ 0\.42, align: 'left' \};/);
    assert.match(c, /put\(spots\.find\(\(l\) => !covered\(l\) && !crowded\(l\)\) \?\? spots\.find\(\(l\) => !covered\(l\)\) \?\? doorLine\);/);
  });
  it('R2-GA2-14 (a): the chain’s spoken label no longer reads "level zero level"', () => {
    const s = run(fresh(), { type: 'door' });
    const said = aChainSummary(aChainStep(null, s, s.t), s);
    assert.doesNotMatch(said, /level zero level|level minus|level plus/);
    assert.match(said, /Computed output: /);
  });
  it('R2-GA2-14 (b): one second is "1 second"', () => {
    const row = { label: 'Overheat alarm', seconds: 1, sr: 48000, channels: 1, bytes: 96000 } as unknown as MemoryRow;
    assert.match(memoryRowSpoken(row), /Overheat alarm: 1 second at 48,000 samples per second/);
    assert.match(memoryRowSpoken({ ...row, seconds: 2 } as MemoryRow), /2 seconds at/);
  });
  it('B-S3-02 / B-S3-03: "Door · door_open.wav" once; a late layer says its voice is held from the request', () => {
    const s = run(fresh(), { type: 'door' });
    const starts = s.log.filter((l) => l.kind === 'start').map((l) => l.text);
    assert.ok(starts.includes('Door · door_open.wav → EFFECTS bus (not heard: sound is off)'), starts.join(' | '));
    assert.ok(!starts.some((t) => t.includes('Door · door · ')));
    assert.ok(starts.includes('Door · rattle, 1 s later (its voice is held from now) → EFFECTS bus (not heard: sound is off)'));
  });
  it('R2-GA1-15: the lab credit checks every page index, not the number of stored entries', () => {
    const c = code('GameAudioLabScreen.tsx');
    assert.match(c, /const noPageOptional = \(_i: number\): boolean => false;/);
    assert.match(c, /optionalPage=\{noPageOptional\}/);
    // PagedLab's rule with an optionalPage: every index must be in the list
    const kit = readFileSync(join(process.cwd(), 'src/screens/lab/kit/PagedLab.tsx'), 'utf8').replace(/\r\n/g, '\n');
    assert.match(kit, /return pagesWithCheck\.every\(\(_, i\) => opt\(i\) \|\| completed\.includes\(i\)\);/);
    const allDone = (completed: number[]) => Array.from({ length: 22 }, (_, i) => i).every((i) => completed.includes(i));
    assert.equal(allDone([...Array.from({ length: 21 }, (_, i) => i), 30]), false, '21 real pages and a stray index is not done');
    assert.equal(allDone(Array.from({ length: 22 }, (_, i) => i)), true);
  });
});

/* ── after the shared-frame fix: a key that does not fit is DROPPED ─────── */

describe('readout keys keep a short form for the frame (lead, after the shared-frame fix)', () => {
  it('wider than GA_NARROW_W the short key reaches the frame; narrower it replaces the key', async () => {
    const { gaFitReadouts, GA_NARROW_W } = await import('../src/screens/lab/gameaudio/bitsLogic.ts');
    const items = [{ k: 'VARIATION', kNarrow: 'VARY', v: 'ON' }, { k: 'LAST TAKE', kNarrow: 'TAKE', v: '2' }];
    assert.deepEqual(gaFitReadouts(items, 375).map((x) => [x.k, x.kNarrow]), [['VARIATION', 'VARY'], ['LAST TAKE', 'TAKE']], 'page 9 at 375');
    assert.deepEqual(gaFitReadouts(items, GA_NARROW_W - 40).map((x) => [x.k, x.kNarrow]), [['VARY', undefined], ['TAKE', undefined]]);
  });
  it('the standard PLAYING and SOUND readouts carry short keys', () => {
    const c = code('GaLab.tsx');
    // checker C-5: not a verb on a key that reads like a button
    assert.match(c, /\{ k: 'PLAYING', kNarrow: 'PLAYS',/);
    assert.match(read('pages/p01Welcome.tsx'), /On a narrow phone they read PLAYS and SND\./, 'the lesson names what is on screen');
    assert.match(c, /\{ k: 'SOUND', kNarrow: 'SND',/);
  });
});

/* ── the independent checker's follow-up (CHECK_GAMEAUDIO_R2.md) ────────── */

describe('checker: the concealment cannot be undone unnoticed (M03, M04, M07)', () => {
  it('page 6 behaviour: after START the shown DOOR FILE value equals the one before START, until the door shows the fault', () => {
    const s0 = fresh();
    const count0 = gaFact(s0, 'missingAsset');
    const before = gaPlantedView(null, count0, s0.faults.missingDoor).shown;
    // what onStart records: plant.start(missing) BEFORE the fault goes in
    const plant = { at: count0, shown: s0.faults.missingDoor, touched: false };
    const s1 = run(s0, { type: 'fault', patch: { missingDoor: true } });
    assert.equal(s1.faults.missingDoor, true);
    assert.equal(gaPlantedView(plant, gaFact(s1, 'missingAsset'), s1.faults.missingDoor).shown, before, 'FOUND stays FOUND at START');
    const s2 = run(s1, { type: 'door' });
    assert.equal(gaPlantedView(plant, gaFact(s2, 'missingAsset'), s2.faults.missingDoor).shown, true, 'MISSING after the symptom');
  });
  it('page 8 behaviour: SCOPE reads LOCAL after START until a guide step uses the wrong surface', () => {
    const s0 = fresh();
    const c0 = gaFact(s0, 'stepWrongSurface');
    const plant = { at: c0, shown: s0.faults.globalSurface, touched: false };
    const s1 = run(s0, { type: 'fault', patch: { globalSurface: true } });
    assert.equal(gaPlantedView(plant, gaFact(s1, 'stepWrongSurface'), true).shown, false);
    const s2 = run(s1, { type: 'step', who: 'guide', dx: 0, dy: 0 });
    assert.ok(gaFact(s2, 'stepWrongSurface') > c0, 'the guide on wood used YOUR stone');
    assert.equal(gaPlantedView(plant, gaFact(s2, 'stepWrongSurface'), true).shown, true);
  });
  it('the pages feed exactly that: the shown value, and START records the value before planting', () => {
    const p6 = code('pages/p06Pipeline.tsx');
    assert.match(p6, /const shownMissing = plant\.shown;/);
    assert.match(p6, /plant\.start\(missing\);\s*setMissing\(true\);/);
    const p8 = code('pages/p08GameSyncs.tsx');
    assert.match(p8, /const shownGlobal = plant\.shown;/);
    assert.match(p8, /plant\.start\(gaGet\(\)\.faults\.globalSurface\);\s*setGlobalSurface\(true\);/);
    assert.match(code('pages/p07Instances.tsx'), /plant\.start\(gaGet\(\)\.faults\.orphanLoop\);\s*setOrphanRule\(true\);/);
    assert.match(code('pages/p10Loops.tsx'), /plant\.start\(gaGet\(\)\.faults\.bedPileUp\);\s*setPileUp\(true\);/);
  });
});

describe('checker: M19, M25, M52', () => {
  it('M19: a removal counted while the rule is still wrong proves nothing (the guard itself)', () => {
    const s = fresh();
    const b = { ...benchStart(s), orphan: { planted: true, seen: 1, proved: 0 } } as Bench;
    const wrong = { ...s, faults: { ...s.faults, orphanLoop: true } } as GaState;
    const after = { ...wrong, facts: { ...wrong.facts, cleanRemove: (wrong.facts.cleanRemove ?? 0) + 1 } } as GaState;
    assert.equal(benchAdvance(b, wrong, after).orphan.proved ?? 0, 0);
    const right = { ...s, faults: { ...s.faults, orphanLoop: false } } as GaState;
    const after2 = { ...right, facts: { ...right.facts, cleanRemove: (right.facts.cleanRemove ?? 0) + 1 } } as GaState;
    assert.equal(benchAdvance(b, right, after2).orphan.proved, 1);
  });
  it('M25: a narrow orphan slot drops its priority number', () => {
    assert.match(code('scene/hud/cVoices.tsx'), /\{slot\.protected \? <Lock size=\{lockSize\} color=\{C_FACE\.amber\} \/> : slot\.orphan \? null : pri\}/);
  });
  it('M52: page 10’s third hint asks for the step that FIXED needs', () => {
    assert.match(read('pages/p10Loops.tsx'), /Then switch SCENE on again and take a step: BEDS stays at 2\./);
  });
});

describe('checker C-1: a second round of a fault needs its own proof', () => {
  it('the pure rule: a new symptom clears the proof; a proof only counts while the repair is in', () => {
    let p = gaProofStep(null, 0, 0, false);
    p = gaProofStep(p, 1, 0, false); // symptom
    assert.equal(p.proved, false);
    p = gaProofStep(p, 1, 1, false); // a proof while the setting is still wrong
    assert.equal(p.proved, false);
    p = gaProofStep(p, 1, 2, true); // the repair proved
    assert.equal(p.proved, true);
    p = gaProofStep(p, 2, 2, true); // a second round: the newest symptom
    assert.equal(p.proved, false, 'the first proof does not count for it');
    p = gaProofStep(p, 2, 3, true);
    assert.equal(p.proved, true);
  });
  it('pages 6, 7, 8 and 10 judge FIXED by the fresh proof', () => {
    assert.match(code('pages/p06Pipeline.tsx'), /const repairedSinceStart = useFreshProof\(missedCount, doorStarts, seenSinceStart && !missing\);/);
    assert.match(code('pages/p07Instances.tsx'), /useFreshProof\(orphanCount, /);
    assert.match(code('pages/p08GameSyncs.tsx'), /useFreshProof\(wrongSteps, /);
    assert.match(code('pages/p10Loops.tsx'), /useFreshProof\(pileCount, /);
  });
  it('page 19 fault 5: after FIXED, a new orphan, the rule put right and ■ STOP is not fixed again until the removal is re-tested', () => {
    const s = fresh();
    let r = drive({ s, b: benchStart(s) }, ...faultActions('orphan', true), ...ORPHAN, ...faultActions('orphan', false), { type: 'stopAll' }, ...ORPHAN);
    assert.ok(faultFixed('orphan', r.b, r.s), 'round one');
    r = drive(r, ...faultActions('orphan', true), ...ORPHAN, ...faultActions('orphan', false), { type: 'stopAll' });
    assert.ok(faultOpen('orphan', r.b, r.s), 'round two is still open after ■ STOP');
    r = drive(r, ...ORPHAN);
    assert.ok(!faultOpen('orphan', r.b, r.s) && faultFixed('orphan', r.b, r.s));
  });
});

describe('checker C-2: the common mistake never names a fault while it hides', () => {
  it('pages 8 and 10 render their note only while nothing is hidden', () => {
    for (const p of ['pages/p08GameSyncs.tsx', 'pages/p10Loops.tsx']) assert.match(code(p), /\{!unnamed \? <Note tone="mistake">/, p);
  });
});

describe('checker C-3: a refused ADD GENERATOR 2 says why in the tray', () => {
  it('pages 7 and 19 show the note while a stray loop holds generator 2', () => {
    const p7 = code('pages/p07Instances.tsx');
    assert.match(p7, /const strayHolds2 = !m2 && s\.inst\.some\(\(i\) => i\.event === 'generator' && i\.owner === G2\);/);
    assert.match(p7, /\{strayHolds2 \? <TrayNote>■ STOP first: a stray loop still holds generator 2\.<\/TrayNote> : null\}/);
    const p19 = code('pages/p19Testing.tsx');
    assert.match(p19, /const strayHolds2 = !m2 && s\.inst\.some\(\(i\) => i\.event === 'generator' && i\.owner === 'generator-2'\);/);
    assert.match(p19, /\{strayHolds2 \? '■ STOP first: a stray loop still holds generator 2\.' : 'No second generator yet\.'\}/);
  });
  it('the model case the note is for: ADD is refused and an orphan owns generator 2', () => {
    const s = run(fresh(), { type: 'fault', patch: { orphanLoop: true } }, ...ORPHAN, { type: 'addMachine' });
    assert.ok(!s.machines.some((m) => m.id === 'generator-2') && s.inst.some((i) => i.event === 'generator' && i.owner === 'generator-2'));
  });
});

describe('checker C-4: a concealed value says where it is true', () => {
  it('the pure rule: PROJECT while hidden or before any symptom, BUILD once a symptom has shown', () => {
    assert.equal(gaPlantedWhere(false, false), 'project', 'before START: project and build agree');
    assert.equal(gaPlantedWhere(true, false), 'project', 'hidden');
    assert.equal(gaPlantedWhere(true, true), 'project', 'hidden again in a second round');
    assert.equal(gaPlantedWhere(false, true), 'build');
  });
  it('page 6 names the place on the readout, in words and in its spoken label; its guide says so', () => {
    const c = code('pages/p06Pipeline.tsx');
    assert.match(c, /const where = gaPlantedWhere\(unnamed, sawMissing\);/);
    assert.match(c, /k: where === 'project' \? 'IN PROJECT' : 'IN BUILD'/);
    assert.match(c, /in the project, the door event asks for \$\{OPEN_FILE\} and \$\{CLOSE_FILE\}, which are in the project/);
    assert.doesNotMatch(G06.seeing.join(' '), /whether the build holds/);
    assert.match(G06.seeing.join(' '), /IN PROJECT: does the project hold the file the door layer asks for\? Once a FAULT line names a missing file, it reads IN BUILD\./);
  });
  it('pages 7, 8 and 10 name the place on the rule row or in SCOPE’s words', () => {
    assert.match(code('pages/p07Instances.tsx'), /WHEN A GENERATOR IS REMOVED · \$\{where === 'project' \? 'IN PROJECT' : 'IN BUILD'\}/);
    assert.match(code('pages/p10Loops.tsx'), /A BED STARTS · \$\{where === 'project' \? 'IN PROJECT' : 'IN BUILD'\}/);
    const p8 = code('pages/p08GameSyncs.tsx');
    assert.match(p8, /const inWhere = where === 'project' \? 'In the project' : 'In the build';/);
    assert.match(p8, /blurb: `\$\{inWhere\}, the surface switch is local\./);
    assert.match(p8, /valueA11y: `\$\{inWhere\.toLowerCase\(\)\}, /);
    for (const g of [G07, G10]) assert.match(g.control.join(' '), /A ✓ marks the rule in use: IN PROJECT, or IN BUILD once a fault has shown itself\./);
  });
});
