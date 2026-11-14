/**
 * Game Audio lab, pages 1–11 — the fixes of the bug test of 2026-11-13
 * (docs/labs/bugtest_2026_11_13/BUGTEST_GAMEAUDIO_1_PAGES_01_11.md, and B-04
 * of the pages 12–22 report, which rests on the model). Each test names the
 * bug it pins and would have failed before the fix.
 *
 * Proven on the pure model and the pure helpers; a page's wiring is pinned
 * by reading its source (the house's way for TSX that node cannot render).
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { GA_APP_STOP_TEXT, gaFact, gaInitial, gaReduce, gaVoiceOut, type GaAction, type GaState } from '../src/screens/lab/gameaudio/model/gaModel.ts';
import { GA_FAULT_FIRST_HINT, GA_NARROW_W, gaFaultHints, gaFitReadouts, gaReadoutNeed } from '../src/screens/lab/gameaudio/bitsLogic.ts';
import { A_LBL_CH, aAlarm, aLegendFit } from '../src/screens/lab/gameaudio/scene/hud/aModel.ts';
import { directionWord, panShort } from '../src/screens/lab/gameaudio/pages/data/chcSpace.ts';
import { G06 } from '../src/screens/lab/gameaudio/pages/guides/p06.ts';
import { G10 } from '../src/screens/lab/gameaudio/pages/guides/p10.ts';
import { PLACES, panGains } from '../src/screens/lab/gameaudio/model/gaWorld.ts';

const GA = '../src/screens/lab/gameaudio/';
const src = (p: string) => readFileSync(new URL(GA + p, import.meta.url), 'utf8').replace(/\r\n/g, '\n');
const code = (p: string) => src(p).replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
const run = (s: GaState, ...actions: GaAction[]): GaState => actions.reduce((st, a, i) => gaReduce(st, a, st.t + 0.5 + i * 0.01).state, s);
const fresh = () => run(gaInitial(), { type: 'enterPage' });

describe('B-S1-03: SHOW A HINT gives no cause before the symptom', () => {
  const CAUSE = ['watch PLAYING', 'the FAULT line says ORPHAN', 'open GENERATORS and read the rule'];
  it('before the symptom only "first make the problem happen" is offered, however often it is pressed', () => {
    for (const asked of [0, 1, 2, 5]) {
      const h = gaFaultHints(CAUSE, false, 'First make the problem happen: remove it.', asked, 0);
      assert.ok(h.shown.every((x) => x.startsWith('First make the problem happen')), `asked ${asked}: ${h.shown.join(' | ')}`);
      assert.ok(h.shown.length <= 1);
    }
    assert.deepEqual(gaFaultHints(CAUSE, false, undefined, 1, 0).shown, [GA_FAULT_FIRST_HINT]);
    assert.equal(gaFaultHints(CAUSE, false, undefined, 1, 0).more, false, 'no second hint before the symptom');
  });
  it('after the symptom the cause hints come one at a time, and a press made before does not reveal one', () => {
    assert.deepEqual(gaFaultHints(CAUSE, true, 'x', 1, 0).shown, []);
    assert.deepEqual(gaFaultHints(CAUSE, true, 'x', 1, 2).shown, CAUSE.slice(0, 2));
    assert.equal(gaFaultHints(CAUSE, true, 'x', 0, 3).more, false);
  });
  it('the card draws from that rule, and every unnamed-fault page gives its own first hint', () => {
    const bits = code('bits.tsx');
    assert.match(bits, /gaFaultHints\(hints, seen, firstHint, shownBefore, shownAfter\)/);
    assert.doesNotMatch(bits, /hints\.slice\(0, shown\)/);
    for (const p of ['pages/p06Pipeline.tsx', 'pages/p07Instances.tsx', 'pages/p08GameSyncs.tsx', 'pages/p10Loops.tsx']) {
      assert.match(code(p), /firstHint="First make the problem happen: /, p);
    }
  });
});

describe('B-S1-01 / B-S3-11: a rule row names nothing while its planted fault is unseen', () => {
  for (const [p, head] of [
    ['pages/p10Loops.tsx', 'A BED STARTS'],
    ['pages/p07Instances.tsx', 'WHEN A GENERATOR IS REMOVED'],
  ] as const) {
    // round 2 (R2-GA1-01): the row is no longer locked with "?" (that singled
    // the setting out); it shows the rule in use before START, through
    // usePlantedFault, until one more symptom line than at the start
    it(`${p}: START THE FAULT records the count, and the tray draws ${head} as it was before the start until one more`, () => {
      const c = code(p);
      assert.match(c, /const plant = usePlantedFault\(\w+Count, s\.faults\.\w+\);/);
      assert.match(c, /render: \(\) => <\w+Tray \w+=\{plant\.shown\} pick=\{\(on\) => plant\.pick\(on, set\w+\)\} where=\{where\} \/>/);
      assert.match(c, /plant\.start\(gaGet\(\)\.faults\.\w+\);/);
      // checker C-4: the head says whose rule it is, the project's or the build's
      assert.ok(c.includes('<TrayRow head={`' + head + " · ${where === 'project' ? 'IN PROJECT' : 'IN BUILD'}`}>"), head);
      assert.doesNotMatch(c, /TrayLocked/);
    });
  }
  it('page 10’s guide names the symptom, not the rule that causes it', () => {
    assert.ok(!G10.changes.some((l) => /ON EVERY UPDATE/.test(l)), G10.changes.join(' | '));
  });
});

describe('B-S1-02: page 6’s guide does not name the missing file or say the fault sets it', () => {
  it('no guide line names door_open_v2.wav or "sets DOOR FILE to the missing name"', () => {
    const all = [G06.intro?.learning, G06.intro?.start, ...G06.seeing, ...G06.control, ...G06.changes, ...G06.teaches, ...G06.tryThis].join('\n');
    assert.doesNotMatch(all, /door_open_v2/);
    assert.doesNotMatch(all, /missing name/);
  });
});

describe('B-S2-01: page 1 rewards the safe order only', () => {
  it('"start the scene" counts a start made while LEVEL was already low, judged at that moment', () => {
    const c = code('pages/p01Welcome.tsx');
    assert.match(c, /const startedLow = useCountWhen\(gaFact\(s, 'sceneOn'\), Math\.round\(s\.master \* 100\) <= LOW_LEVEL_PCT\) > 0;/);
    assert.match(c, /hit: startedLow \}/);
    assert.doesNotMatch(c, /hit: since\('sceneOn'\) > 0/);
  });
  it('the model counts one sceneOn per start (the fact the goal is judged by)', () => {
    const s = run(fresh(), { type: 'scene', on: true });
    assert.equal(gaFact(s, 'sceneOn') - gaFact(fresh(), 'sceneOn'), 1);
  });
});

describe('B-S2-04 / B-S2-05: page 5’s ALARM readout follows the alarm alone', () => {
  const scene = () => run(fresh(), { type: 'scene', on: true });
  it('OFF, then its own level (quieter than the fountain), SILENT under the AMBIENCE solo, a level again under EFFECTS', () => {
    assert.equal(aAlarm(scene(), scene().t).word, 'OFF');
    const on = run(scene(), { type: 'alarm', on: true });
    const a = aAlarm(on, on.t, true);
    assert.equal(a.state, 'sounding');
    assert.match(a.word, /^−\d+ dB$/);
    const amb = run(on, { type: 'bus', bus: 'ambience', solo: true });
    assert.deepEqual([aAlarm(amb, amb.t + 1, true).state, aAlarm(amb, amb.t + 1, true).word], ['silent', 'SILENT']);
    const sfx = run(on, { type: 'bus', bus: 'sfx', solo: true });
    assert.equal(aAlarm(sfx, sfx.t + 1, true).state, 'sounding');
    const mute = run(on, { type: 'bus', bus: 'sfx', mute: true });
    assert.equal(aAlarm(mute, mute.t + 1, true).word, 'MUTED');
  });
  it('the page prints it, and step 3 no longer says the solo marks every other kind SILENT', () => {
    const c = code('pages/p05Sounds.tsx');
    assert.match(c, /const alarmNow = aAlarm\(s, gaNow\(\), true\);/);
    assert.match(c, /\{ k: 'ALARM', v: alarmNow\.word/);
    assert.doesNotMatch(c, /SOLO marks the other kinds SILENT/);
  });
});

describe('B-S3-01: leaving the app prints ONE line, the app’s, not the game’s', () => {
  it('an app stop is a STOP line that says why, said once for two calls, and counts toward no ■ STOP goal', () => {
    const playing = run(fresh(), { type: 'scene', on: true });
    const s = run(playing, { type: 'stopAll', why: 'app' }, { type: 'stopAll', why: 'app' });
    const lines = s.log.filter((l) => l.text === GA_APP_STOP_TEXT);
    assert.equal(lines.length, 1);
    assert.equal(lines[0].kind, 'stop');
    assert.match(GA_APP_STOP_TEXT, /you left the app/);
    assert.ok(!s.log.some((l) => l.kind === 'trigger' && /^STOP ALL/.test(l.text)), 'no GAME · STOP ALL line');
    assert.equal(s.inst.length, 0, 'everything stopped');
    assert.equal(gaFact(s, 'stopAll'), gaFact(playing, 'stopAll'));
    assert.equal(gaFact(s, 'stoppedSomething'), gaFact(playing, 'stoppedSomething'));
  });
  it('■ STOP is unchanged: a GAME line and its facts', () => {
    const s = run(run(fresh(), { type: 'scene', on: true }), { type: 'stopAll' });
    assert.ok(s.log.some((l) => l.kind === 'trigger' && /^STOP ALL/.test(l.text)));
    assert.equal(gaFact(s, 'stoppedSomething') - gaFact(fresh(), 'stoppedSomething'), 1);
  });
  it('the lab tells its own stops from the app-wide one', () => {
    const c = code('GaLab.tsx');
    assert.match(c, /useGaSound\(\(\) => gaDispatch\(own\.current \? \{ type: 'stopAll' \} : \{ type: 'stopAll', why: 'app' \}\)\)/);
  });
});

describe('B-S2-08 / B-S3-19: no inline style reads `x.value` (the Reanimated warning flood)', () => {
  it('no style object in this lab’s pages, bits or A strips sets a property to a bare `.value` member', () => {
    const files = ['bits.tsx', 'GaLab.tsx', 'scene/GaScene.tsx', 'scene/hud/hudA.tsx', 'scene/hud/aFlows.tsx', 'scene/hud/aLevels.tsx', 'scene/hud/aParts.tsx', 'pages/chAViews.tsx', 'pages/chbBits.tsx', 'pages/shared.tsx'];
    for (let n = 1; n <= 11; n++) files.push(`pages/${['p01Welcome', 'p02Reacts', 'p03Platforms', 'p04Games', 'p05Sounds', 'p06Pipeline', 'p07Instances', 'p08GameSyncs', 'p09Variation', 'p10Loops', 'p11Distance'][n - 1]}.tsx`);
    for (const f of files) {
      const c = code(f);
      // style={{ … prop: a.b.value … }} or style={[ …, { prop: x.value } ]}
      for (const m of c.matchAll(/style=\{[\s\S]*?\}\}?\s*\/?>/g)) {
        assert.doesNotMatch(m[0], /:\s*[A-Za-z_$][\w$.]*\.value\s*[,}\n]/, `${f}: ${m[0].slice(0, 120)}`);
      }
    }
  });
});

describe('B-S2-06: at 320 wide a key shortens and no cell is cut', () => {
  it('on a narrow phone each cell’s share is what its words need; at 390 nothing changes', () => {
    const items = [
      { k: 'YOUR FLOOR', kNarrow: 'YOU', v: 'GRAVEL', flex: 1.65 },
      { k: 'PLAYING', v: '0' },
      { k: 'VOICES', v: '0/16' },
      { k: 'SOUND', v: 'OFF' },
    ];
    assert.deepEqual(gaFitReadouts(items, 390).map((x) => [x.k, x.flex]), [['YOUR FLOOR', 1.65], ['PLAYING', undefined], ['VOICES', undefined], ['SOUND', undefined]]);
    const narrow = gaFitReadouts(items, 320);
    assert.equal(narrow[0].k, 'YOU');
    // the strip at 320 wide is 300 pt: each cell gets at least what it needs
    const total = narrow.reduce((a, x) => a + (x.flex ?? 1), 0);
    for (const x of narrow) assert.ok(((x.flex ?? 1) / total) * 300 + 0.5 >= gaReadoutNeed(x.k, x.v) - 0.5, `${x.k}: ${(((x.flex ?? 1) / total) * 300).toFixed(1)} of ${gaReadoutNeed(x.k, x.v)}`);
    assert.ok(GA_NARROW_W > 320 && GA_NARROW_W <= 375);
  });
  it('pages 4, 6, 8, 9 and 11 give their long keys a short form; the strips shorten a legend that would be cut', () => {
    assert.match(code('pages/p08GameSyncs.tsx'), /k: 'YOUR FLOOR', kNarrow: 'YOU'/);
    // round 2, checker C-4: the key names where the value is true
    assert.match(code('pages/p06Pipeline.tsx'), /k: where === 'project' \? 'IN PROJECT' : 'IN BUILD', kNarrow: where === 'project' \? 'PROJECT' : 'BUILD'/);
    assert.match(code('pages/p04Games.tsx'), /k: 'LISTENER', kNarrow: 'EARS'/);
    assert.match(code('pages/p11Distance.tsx'), /k: 'DISTANCE', kNarrow: 'DIST\.'/);
    assert.equal(aLegendFit('GENERATOR 1 · OFF', 'GEN 1 · OFF', 59, 1), 'GEN 1 · OFF');
    assert.equal(aLegendFit('GENERATOR 1 · OFF', 'GEN 1 · OFF', 112, 1), 'GENERATOR 1 · OFF');
    assert.ok('GEN 1 · OFF'.length * A_LBL_CH <= 59);
  });
});

describe('B-S3-09: page 11 never says "straight behind" beside a PAN that is not CENTER', () => {
  it('at 178° with a 4% pan the card says "almost straight behind"; at 180° with no pan, "straight behind"', () => {
    assert.notEqual(panShort(-0.037), 'CENTER');
    assert.match(directionWord(-178, -0.037), /^almost straight behind \(178° to your left\)$/);
    assert.equal(directionWord(180, 0), 'straight behind');
    assert.equal(directionWord(1.5, 0.02), 'almost straight ahead (2° to your right)');
    assert.equal(directionWord(178), 'straight behind', 'without a pan, as before');
  });
  it('a VIRTUAL source shows no pan', () => {
    const c = code('pages/p11Distance.tsx');
    assert.match(c, /v: r\.virtual \? '—' : panShort\(r\.pan\)/);
    assert.match(c, /directionWord\(r\.bearingDeg, r\.pan\)/);
  });
});

describe('B-S3-10: FIXED needs the repair proven, not only the setting flipped back', () => {
  it('page 7 needs a clean removal after the rule is corrected; page 8 a guide step after the scope is', () => {
    // round 2, checker C-1: the proof is fresh, after the newest symptom
    assert.match(code('pages/p07Instances.tsx'), /const repaired = useFreshProof\(orphanCount, gaFact\(s, 'cleanRemove'\), orphanSeen && !s\.faults\.orphanLoop\);/);
    assert.match(code('pages/p07Instances.tsx'), /const fixed = orphanSeen && !s\.faults\.orphanLoop && orphans === 0 && repaired;/);
    assert.match(code('pages/p08GameSyncs.tsx'), /const repaired = useFreshProof\(wrongSteps, guideSteps, wrongSeen && !global\);/);
    assert.match(code('pages/p08GameSyncs.tsx'), /fixed=\{fixed\}/);
  });
});

describe('B-04 (pages 12–22 report): the MONO fold is the engine’s, so turning still moves it up to 3 dB', () => {
  // DECLINED as a model change: the engine folds with Web Audio's own
  // speaker downmix, 0.5·(L + R), and so does every mono speaker. An
  // equal-power pan summed that way is 3 dB louder in the center than at
  // one side (the pan law). The model must show what is heard, so the text
  // of page 13 is what changes (fixer GF2's file).
  it('in MONO both sides are equal, and are the average of the stereo sides', () => {
    const base = run(fresh(), { type: 'scene', on: true });
    const mono = run(base, { type: 'mono', on: true });
    const v = mono.voices.find((x) => mono.inst.find((i) => i.id === x.inst)?.event === 'fountain')!;
    const st = gaVoiceOut(base, base.voices.find((x) => x.v === v.v)!);
    const o = gaVoiceOut(mono, v);
    assert.equal(o.l, o.r);
    assert.ok(Math.abs(o.l - (st.l + st.r) / 2) < 1e-9);
  });
  it('the fold of an equal-power pan spans 3 dB from center to one side', () => {
    const at = (p: number) => {
      const g = panGains(p);
      return 20 * Math.log10((g.l + g.r) / 2);
    };
    assert.ok(Math.abs(at(0) - at(1) - 3.01) < 0.02);
    assert.ok(PLACES.fountain, 'the fountain is the page’s source');
  });
});

describe('GF2 asks (pages 12–22 report): B-02, B-15 in the model', () => {
  it('B-02: ■ STOP prints one NET line for each action dropped on its way, and the flight leaves netFlights', () => {
    const sent = run(fresh(), { type: 'net', id: 'A5', what: 'door', to: 'world' });
    const s = run(sent, { type: 'stopAll' });
    assert.ok(s.log.some((l) => l.kind === 'net' && l.text === 'Action A5 (door) DROPPED by STOP ALL: it never arrives'), s.log.map((l) => l.text).join(' | '));
    assert.equal((s.netFlights ?? []).length, 0);
  });
  it('B-15: a bus line prints a true minus sign', () => {
    const s = run(fresh(), { type: 'bus', bus: 'sfx', db: -6 });
    assert.ok(s.log.some((l) => l.text === 'BUS EFFECTS: −6 dB'));
    assert.ok(!s.log.some((l) => /BUS .*: -\d/.test(l.text)));
  });
});
