/**
 * Lab fix round 1, 2026-11-14 — group F3: the Game Audio Lab and the Stage
 * Plot lab. One block per fixed item of the beginner audit
 * (docs/labs/novice_audit_2026_11_14/G5_GameAudioLab.md, G5b_GameAudioLab.md,
 * G5_StagePlotLab.md; report sections 4 and 7). Each test fails on the code
 * as it was before the fix. Report: docs/labs/novice_audit_2026_11_14/fixes/
 * F3_REPORT.md.
 *
 * Owner, 2026-11-14: "Begin fixing all bugs found and do obvious (my decision
 * is not required) fixes as you suggestted in the report."
 */
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { registerHooks } from 'node:module';
import { describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';
import { introWorkAction } from '../src/features/lab/screenGuide/introHold.ts';
import { GA_CAPTION_MAX, GA_GOALS_COUNTED, GA_GOALS_PENDING, GA_READOUT_CAPTION, GA_SOUND_OFF_LINE, gaGoalsNote, gaWithCaption } from '../src/screens/lab/gameaudio/bitsLogic.ts';
import { GA_HANDS_ON, GA_PAGE_LEFT } from '../src/screens/lab/gameaudio/pages/data/gaPageLeft.ts';
import { GA_END_GUIDE } from '../src/screens/lab/gameaudio/pages/guides/end.ts';
import { gaFact, gaInitial, gaReduce, type GaAction, type GaState } from '../src/screens/lab/gameaudio/model/gaModel.ts';
import { P10_WIND_KEY } from '../src/screens/lab/gameaudio/pages/data/chbScene.ts';
import { BUDGET_STOPS, BURST_COUNT, budgetStep, burstSpoken, burstTotalWords, lastBurst, protectedKept, protectedKeptWords } from '../src/screens/lab/gameaudio/pages/data/gaBudget.ts';
import { FAULTS, FAULT_IDS, benchAdvance, benchStart, faultActions, faultDef, faultFixed, faultOpen, faultRetest, faultStatus, proofCount, stepInPlace, type Bench, type FaultId } from '../src/screens/lab/gameaudio/pages/data/gaFaults.ts';
import { G02 } from '../src/screens/lab/gameaudio/pages/guides/p02.ts';
import { G24 } from '../src/screens/lab/gameaudio/pages/guides/p24.ts';
import { G11 } from '../src/screens/lab/gameaudio/pages/guides/p11.ts';
import { G19 } from '../src/screens/lab/gameaudio/pages/guides/p19.ts';
import { spAddPerformer, spObject } from '../src/features/stageplot/spModel.ts';
import { SP_GUIDED_TITLE, spGuidedOpenByDefault } from '../src/features/stageplot/spReview.ts';
import { spObjectBoxM } from '../src/features/stageplot/spSymbols.ts';
import { spFromTemplate } from '../src/features/stageplot/spTemplates.ts';
import type { SpProject } from '../src/features/stageplot/spTypes.ts';
import { SP_GUIDE_EXPORT } from '../src/screens/lab/stageplot/guides/export.ts';
import { SP_GUIDE_SETUP } from '../src/screens/lab/stageplot/guides/setup.ts';
import { SP_GUIDE_STAGE } from '../src/screens/lab/stageplot/guides/stage.ts';
import { goToSetupPart, placeOnStage, runIssueAction, spSetupField, takeSpSetupAsk } from '../src/screens/lab/stageplot/spIssueActions.ts';
import { spReview } from '../src/features/stageplot/spReview.ts';
import { stageBoxBounds, stageObjectBox, stageTransformFor } from '../src/screens/lab/stageplot/stage/stageGeom.ts';
import { STAGE_MIN_AIR, STAGE_NEW_AIR, STAGE_NEW_SPOT, stageAddDrawing, stageAddWithPackage, stageDefaultWho, stageFreeSpot, stagePackagesFor, stagePlace } from '../src/screens/lab/stageplot/stage/stageLinks.ts';

const read = (p: string) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8').replace(/\r\n/g, '\n');
/** A source file with its comments removed: what runs, and what a learner can read. */
const code = (p: string) => read(p).replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '').replace(/\{\/\*[\s\S]*?\*\/\}/g, '');
const GA = 'src/screens/lab/gameaudio';
const SP = 'src/screens/lab/stageplot';

/* ── Game Audio: the scene, driven through the real reducer ─────────────── */

const run = (s: GaState, ...actions: GaAction[]): GaState => actions.reduce((out, a) => gaReduce(out, a).state, s);
const clean = (): GaState => gaReduce(gaInitial(), { type: 'enterPage' }).state;
const tick = (s: GaState, by: number): GaState => gaReduce(s, { type: 'tick', t: s.t + by }).state;
type Run = { s: GaState; b: Bench };
function drive(r: Run, ...actions: GaAction[]): Run {
  let { s, b } = r;
  for (const a of actions) {
    const next = gaReduce(s, a).state;
    b = benchAdvance(b, s, next);
    s = next;
  }
  return { s, b };
}
const open = (): Run => {
  const s = clean();
  return { s, b: benchStart(s) };
};
const GUIDE_STEP = stepInPlace('guide');
/** Each fault's symptom, with the page's own TEST chips. */
const REPRODUCE: Record<FaultId, GaAction[]> = {
  missingFile: [{ type: 'door' }],
  wrongBus: [{ type: 'machine', id: 'generator-1', on: true }, { type: 'post', event: 'vo_greeting', owner: 'guide' }],
  repeat: [GUIDE_STEP, GUIDE_STEP, GUIDE_STEP],
  scope: [GUIDE_STEP],
  orphan: [{ type: 'addMachine' }, { type: 'machine', id: 'generator-2', on: true }, { type: 'removeMachine', id: 'generator-2' }],
};
/** The same action again, after the repair. */
const RERUN: Record<FaultId, GaAction[]> = {
  missingFile: [{ type: 'door' }],
  wrongBus: [{ type: 'stopAll' }, { type: 'post', event: 'vo_greeting', owner: 'guide' }],
  repeat: [GUIDE_STEP, GUIDE_STEP],
  scope: [GUIDE_STEP],
  orphan: [{ type: 'stopAll' }, ...REPRODUCE.orphan],
};

describe('F3 · Game Audio page 17: the burst card adds up, and BUDGET reaches 8 in one press', () => {
  it('the BUDGET stops halve: 16 → 8 → 4 → 2 → 1, with no 12', () => {
    assert.deepEqual([...BUDGET_STOPS], [1, 2, 4, 8, 16, 0]);
    assert.equal(budgetStep(16, -1), 8, 'step 2 says "Set BUDGET to 8": one press of ‹ FEWER from the page’s 16');
    assert.equal(gaInitial().voiceLimit, 16, 'the page opens at 16');
    for (const from of [16, 8, 4, 2]) assert.equal(budgetStep(from, -1), from / 2);
  });
  it('the total names its sum: six rows stood over a bare "TAKEN 9"', () => {
    const s = run(clean(), { type: 'voiceLimit', limit: 8 }, { type: 'scene', on: true }, { type: 'machine', id: 'generator-1', on: true }, { type: 'burst', count: BURST_COUNT });
    const r = lastBurst(s.log)!;
    assert.equal(r.thefts.length, 6, 'five loops and one grouped row of impacts');
    assert.equal(r.stolen, 9);
    assert.equal(burstTotalWords(r), 'TAKEN 9 = 5 loops + 4 one-shots · REFUSED 0');
    // the rows and the total agree, whatever the scene
    assert.equal(r.thefts.reduce((n, t) => n + t.times, 0), r.stolen);
    assert.match(burstSpoken(r), /9 in all\. 0 new sounds were refused\./);
    // one kind only needs no sum; nothing taken says so
    const alone = run(clean(), { type: 'voiceLimit', limit: 8 }, { type: 'burst', count: BURST_COUNT });
    assert.equal(burstTotalWords(lastBurst(alone.log)!), 'TAKEN 4 one-shots · REFUSED 0');
    const refused = run(clean(), { type: 'alarm', on: true }, { type: 'voiceLimit', limit: 1 }, { type: 'burst', count: BURST_COUNT });
    assert.equal(burstTotalWords(lastBurst(refused.log)!), 'TAKEN 0 · REFUSED 12');
    assert.match(code(`${GA}/pages/p17Budgets.tsx`), /\{burstTotalWords\(r\)\}/);
    assert.doesNotMatch(code(`${GA}/pages/p17Budgets.tsx`), /TAKEN \{r\.stolen\}/);
  });
  it('a protected sound that kept its voice is named on the card', () => {
    const s = run(clean(), { type: 'voiceLimit', limit: 8 }, { type: 'scene', on: true }, { type: 'alarm', on: true }, { type: 'burst', count: BURST_COUNT });
    assert.ok(gaFact(s, 'alarmSurvivedBurst') > 0);
    assert.deepEqual(protectedKept(s), ['Overheat alarm']);
    assert.equal(protectedKeptWords(protectedKept(s)), 'Kept its voice: Overheat alarm (protected).');
    assert.equal(protectedKeptWords([]), '');
    assert.deepEqual(protectedKept(clean()), []);
    assert.match(code(`${GA}/pages/p17Budgets.tsx`), /protectedKeptWords\(protectedKept\(s\)\)/);
  });
});

describe('F3 · Game Audio page 19: FIX opens on no setting', () => {
  const page = code(`${GA}/pages/p19Testing.tsx`);
  it('no setting is chosen when the tray opens, and the fault on screen is not handed to it', () => {
    assert.match(page, /useState<FaultId \| null>\(null\)/);
    assert.doesNotMatch(page, /<FixTray start=/);
    assert.match(page, /render: \(\) => <FixTray \/>/);
    assert.match(page, /Choose the setting you think is wrong\./);
  });
  it('the chosen setting carries ▸, never ✓ (✓ read as "this one is fine")', () => {
    assert.doesNotMatch(page, /marked\(x\.pick/);
    assert.match(page, /label=\{`\$\{x\.id === pick \? '▸ ' : ''\}\$\{x\.pick\}`\}/);
    assert.match(G19.control.join(' '), /FIX opens the five settings, with none chosen\./);
  });
});

describe('F3 · Game Audio page 19: every fault is proved by a re-run (1-4 were not, 5 was)', () => {
  it('a corrected setting is not FIXED until the same action runs again', () => {
    for (const id of FAULT_IDS) {
      let r = drive(open(), ...faultActions(id, true), ...REPRODUCE[id]);
      r = drive(r, ...faultActions(id, false));
      if (id === 'orphan') r = drive(r, { type: 'stopAll' });
      assert.ok(!faultFixed(id, r.b, r.s), `${id}: corrected is not fixed`);
      assert.ok(faultOpen(id, r.b, r.s) && faultRetest(id, r.b, r.s), `${id}: its card asks for the re-run`);
      assert.equal(faultStatus(id, r.b, r.s), 'active');
      r = drive(r, ...RERUN[id]);
      assert.ok(faultFixed(id, r.b, r.s), `${id}: fixed after the re-run`);
      assert.ok(!faultRetest(id, r.b, r.s));
      assert.equal(faultStatus(id, r.b, r.s), 'fixed');
    }
  });
  it('a re-run counts only while the setting is right, and only after the symptom was seen', () => {
    // the door with the fault still in: a symptom, not a proof
    let r = drive(open(), ...faultActions('missingFile', true), { type: 'door' }, { type: 'door' });
    assert.equal(r.b.missingFile.seen, 2);
    assert.equal(r.b.missingFile.proved ?? 0, 0);
    // a healthy door BEFORE the symptom was ever seen proves nothing later
    r = drive(open(), { type: 'door' }, ...faultActions('missingFile', true), ...faultActions('missingFile', false));
    assert.ok(!faultFixed('missingFile', r.b, r.s) && !faultOpen('missingFile', r.b, r.s), 'started and switched straight back: not started again');
    const a = clean();
    assert.equal(proofCount('missingFile', a, run(a, { type: 'door' })), 1);
    const wrong = run(a, ...faultActions('missingFile', true));
    assert.equal(proofCount('missingFile', wrong, run(wrong, { type: 'door' })), 0);
  });
  it('the footsteps need two steps (one cannot show that the take changes); a new symptom clears the proof', () => {
    let r = drive(open(), ...faultActions('repeat', true), ...REPRODUCE.repeat, ...faultActions('repeat', false), GUIDE_STEP);
    assert.ok(!faultFixed('repeat', r.b, r.s));
    r = drive(r, GUIDE_STEP);
    assert.ok(faultFixed('repeat', r.b, r.s));
    assert.equal(faultDef('repeat').prove, 2);
    // the fault put back and seen again: the old proof no longer counts
    r = drive(r, ...faultActions('repeat', true), GUIDE_STEP, ...faultActions('repeat', false));
    assert.ok(!faultFixed('repeat', r.b, r.s) && faultRetest('repeat', r.b, r.s));
  });
  it('the guide’s line pressed while it still speaks is ignored, and proves nothing', () => {
    let r = drive(open(), ...faultActions('wrongBus', true), ...REPRODUCE.wrongBus, ...faultActions('wrongBus', false));
    r = drive(r, { type: 'post', event: 'vo_greeting', owner: 'guide' });
    assert.ok(!faultFixed('wrongBus', r.b, r.s));
    // the line ends, then it is played again
    let s = tick(r.s, 6);
    for (const v of s.voices.filter((x) => !x.loop)) s = gaReduce(s, { type: 'expire', v: v.v }).state;
    r = drive({ s, b: benchAdvance(r.b, r.s, s) }, { type: 'post', event: 'vo_greeting', owner: 'guide' });
    assert.ok(faultFixed('wrongBus', r.b, r.s));
  });
  it('each card says which action to repeat, and the page, the card and the guide state the one rule', () => {
    for (const f of FAULTS) {
      assert.ok(f.retest.length > 40 && f.prove >= 1, f.id);
      assert.doesNotMatch(f.retest, /\b(must|always|never)\b/i, `${f.id}: no dogma words`);
      assert.doesNotMatch(f.why, /Press the door key again and read|When the line has ended, play it again/, `${f.id}: FIXED no longer asks for a step that is now done`);
    }
    assert.match(faultDef('orphan').retest, /Correcting the setting does not stop a loop that has already lost its generator\. Press ■ STOP/);
    const page = code(`${GA}/pages/p19Testing.tsx`);
    assert.match(page, /A fault is fixed once you have seen its symptom, corrected the setting, and run the same action again\./);
    assert.doesNotMatch(page, /It counts as fixed after you have seen its symptom and corrected the setting/);
    assert.match(page, /retest=\{retest\}/);
    // FIX does not read ALL OK beside FAULTS 1 while a re-run is owed
    assert.match(page, /wrong \? `\$\{wrong\} WRONG` : open \? 'RE-TEST' : 'ALL OK'/);
    const bits = code(`${GA}/bits.tsx`);
    assert.match(bits, /SETTING CORRECTED · NOW TEST IT AGAIN/);
    assert.match(bits, /\{armed && !retest \? \(/, 'the card stops asking for the cause once the setting is right');
    assert.match(G19.changes.join(' '), /its setting is correct again, and you have run the same action once more/);
  });
});

describe('F3 · Game Audio page 11: the SOURCES key never reads a bare NONE', () => {
  it('it says what is switched on with ON / OFF, and the guide quotes the same four words', () => {
    const page = code(`${GA}/pages/p11Distance.tsx`);
    assert.doesNotMatch(page, /'NONE'/);
    for (const w of ['BOTH ON', 'GEN 1 ON', 'SCENE ON', 'ALL OFF']) {
      assert.ok(page.includes(`'${w}'`), w);
      assert.ok(G11.control.join(' ').includes(w), `the guide: ${w}`);
      assert.ok(w.length <= 8, `${w} fits the key`);
    }
    assert.doesNotMatch(G11.control.join(' '), /\bNONE\b/);
  });
});

describe('F3 · Game Audio page 21: the first line points at the TOPIC key where it is', () => {
  it('"at the bottom of the screen", not "under the picture"', () => {
    const page = code(`${GA}/pages/p21Today.tsx`);
    assert.doesNotMatch(page, /Choose a TOPIC under the picture/);
    assert.match(page, /Press the TOPIC key at the bottom of the screen and choose a topic\./);
    assert.match(page, /<Note>\{!t \? P21_NO_TOPIC :/);
  });
});

describe('F3 · Game Audio page 10: the fourth key is not cut at 390 wide', () => {
  // (phase 3: the WIND key went with the loop lesson to its own page, p24LoopJoin.tsx)
  it('WIND, not WIND FILE, on the key, in the lesson and in the guide', () => {
    assert.equal(P10_WIND_KEY, 'WIND');
    assert.ok(P10_WIND_KEY.length <= 6, 'no longer than SOUNDS, the longest key that dock shows whole');
    const page = code(`${GA}/pages/p24LoopJoin.tsx`);
    assert.match(page, /label: P10_WIND_KEY,/);
    assert.doesNotMatch(page, /WIND FILE/);
    assert.match(page, /set WIND to RAW CUT/);
    assert.doesNotMatch(Object.values(G24).flat().map(String).join(' ') + G24.intro!.start, /WIND FILE/);
  });
});

describe('F3 · Game Audio: a page says when it counts (the end screen’s "21 pages not done yet")', () => {
  it('one line under the goal chips: the rule while goals are open, the result when all are met', () => {
    assert.equal(gaGoalsNote(false, false), GA_GOALS_PENDING);
    assert.equal(gaGoalsNote(true, false), GA_GOALS_COUNTED);
    assert.equal(gaGoalsNote(true, true), GA_GOALS_COUNTED);
    assert.equal(gaGoalsNote(false, true), null, 'a finished page keeps its own "that is kept" line');
    assert.match(GA_GOALS_PENDING, /every goal here is ✓ in one visit/);
    assert.doesNotMatch(GA_GOALS_PENDING + GA_GOALS_COUNTED, /\d/, 'no "N of total"');
    assert.doesNotMatch(GA_GOALS_PENDING, /\bNEXT\b/, 'the capstone’s key is FINISH');
    assert.match(code(`${GA}/bits.tsx`), /const counts = gaGoalsNote\(all, latched\.doneBefore === true\);/);
  });
});

describe('F3 · Game Audio: a first step that works with sound off', () => {
  it('page 2 starts with the door, not with SOUND', () => {
    assert.doesNotMatch(G02.intro!.start, /^Turn SOUND on/);
    assert.match(G02.intro!.start, /^Press OPEN DOOR/);
    assert.match(G02.intro!.start, /with sound off, the log still shows it/);
    const page = code(`${GA}/pages/p02Reacts.tsx`);
    assert.doesNotMatch(page, /<Do>Turn SOUND on\./);
    assert.match(page, /<Do>Press OPEN DOOR and read the log\./);
  });
  it('page 13’s headphone step says what to do without headphones', () => {
    // owner 2026-11-15: "build waves 1 thru 3" (D62 adoption plan, item GA-04): the step is lettered parts now, and the
    // no-headphones line sits with the part that asks for headphones
    assert.match(code(`${GA}/pages/p13Formats.tsx`), /'Put on headphones and choose HEADPHONE 3D\. No headphones\? Read the strip instead\.'/);
  });
});

/* ── Stage Plot ─────────────────────────────────────────────────────────── */

const blank = (): SpProject => spFromTemplate('blank', { id: 'f3', now: 1 });
/** The editor as a screen sees it: `apply` runs at once, `goTo` is recorded. */
function fakeEditor(start: SpProject) {
  const ed = {
    project: start,
    went: [] as { area: string; sel: unknown }[],
    apply(change: (p: SpProject) => SpProject) {
      ed.project = change(ed.project);
    },
    goTo(area: string, sel?: unknown) {
      ed.went.push({ area, sel });
    },
  };
  return ed;
}

describe('F3 · Stage Plot: PLACE ON THE STAGE places', () => {
  it('one press draws the performer and opens the stage with the figure selected', () => {
    const a = spAddPerformer(blank(), { name: 'Performer 1', role: '' });
    const ed = fakeEditor(a.p);
    const id = placeOnStage(ed as never, { kind: 'performer', id: a.id });
    assert.ok(id, 'something was placed');
    const fig = spObject(ed.project, id!);
    assert.ok(fig && fig.kind === 'performer' && fig.performerId === a.id);
    assert.equal(ed.project.objects.length, 1);
    assert.deepEqual(ed.went, [{ area: 'stage', sel: { kind: 'object', id } }]);
    // a drawing only: nothing joins any list
    assert.equal(ed.project.inputs.length, 0);
    assert.equal(ed.project.devices.length, 0);
    assert.equal(ed.project.performers.length, 1);
  });
  it('a row that cannot be drawn is handed to the stage as before', () => {
    const ed = fakeEditor(blank());
    assert.equal(placeOnStage(ed as never, { kind: 'performer', id: 'gone' }), null);
    assert.equal(ed.project.objects.length, 0);
    assert.deepEqual(ed.went, [{ area: 'stage', sel: { kind: 'performer', id: 'gone' } }]);
  });
  it('every PLACE ON THE STAGE button uses it: Setup, a source, an input, a stage box, a monitor device, a review answer', () => {
    assert.match(code(`${SP}/SetupArea.tsx`), /else placeOnStage\(ed, \{ kind: 'performer', id: pf\.id \}\);/);
    assert.match(code(`${SP}/inputs/SourceEditor.tsx`), /else placeOnStage\(ed, \{ kind: 'source', id: sourceId \}\);/);
    assert.match(code(`${SP}/inputs/InputEditor.tsx`), /else placeOnStage\(ed, \{ kind: 'input', id: inputId \}\);/);
    assert.match(code(`${SP}/inputs/BoxPanel.tsx`), /else placeOnStage\(ed, \{ kind: 'box', id: boxId \}\);/);
    assert.match(code(`${SP}/MonitorsArea.tsx`), /if \(placeOnStage\(ed, sel\)\) sentAway = null;/);
    // no button that says PLACE still promises only a trip
    for (const f of ['SetupArea.tsx', 'inputs/SourceEditor.tsx', 'inputs/InputEditor.tsx', 'inputs/BoxPanel.tsx', 'MonitorsArea.tsx', 'monitors/DeviceSheets.tsx']) assert.doesNotMatch(code(`${SP}/${f}`), /Go to the (Stage area|stage) to place/, f);
    // the review's own answer
    const a = spAddPerformer(blank(), { name: 'Ana', role: '' });
    const issue = spReview(a.p).find((i) => i.rule === 'performer-unplaced');
    assert.ok(issue, 'the review asks where Ana stands');
    const ed = fakeEditor(a.p);
    runIssueAction(ed as never, issue, 'locate');
    assert.equal(ed.project.objects.filter((o) => o.performerId === a.id).length, 1);
    assert.equal(spReview(ed.project).some((i) => i.rule === 'performer-unplaced'), false);
  });
});

describe('F3 · Stage Plot: a new object is seen apart from the last one', () => {
  /** The gap between two objects' boxes, in meters (0 or less = touching). */
  const gapM = (p: SpProject, i: number, j: number): number => {
    const a = spObjectBoxM(p, p.objects[i]);
    const b = spObjectBoxM(p, p.objects[j]);
    return Math.max(Math.abs(a.cx - b.cx) - (a.w + b.w) / 2, Math.abs(a.cy - b.cy) - (a.h + b.h) / 2);
  };
  it('the audit’s walk: Performer 1, then a guitar amplifier, stand side by side with clear air', () => {
    const a = spAddPerformer(blank(), { name: 'Performer 1', role: '' });
    let p = stagePlace(a.p, { kind: 'performer', id: a.id }, STAGE_NEW_SPOT)!.p;
    const pkg = stagePackagesFor('guitar-amp')[0];
    p = stageAddWithPackage(p, 'guitar-amp', stageFreeSpot(p, STAGE_NEW_SPOT, 'guitar-amp'), pkg, { performerId: a.id }).p;
    const [fig, amp] = p.objects;
    // it was put straight in front of the performer (same x, 0.1 m of gap: 8 points on a phone)
    assert.ok(Math.abs(amp.x - fig.x) > 0.05, 'not in the same column');
    assert.ok(Math.abs(amp.y - fig.y) < 1e-9, 'in the same row: beside, not in front or behind');
    assert.ok(gapM(p, 0, 1) >= STAGE_NEW_AIR - 1e-9, `air ${gapM(p, 0, 1).toFixed(2)} m`);
    // at phone size the two drawings are clearly apart
    const T = stageTransformFor(p, 366, 260);
    const A = stageBoxBounds(stageObjectBox(p, fig, T));
    const B = stageBoxBounds(stageObjectBox(p, amp, T));
    const gapPx = Math.max(Math.max(A.x0, B.x0) - Math.min(A.x1, B.x1), Math.max(A.y0, B.y0) - Math.min(A.y1, B.y1));
    assert.ok(gapPx >= 12, `${gapPx.toFixed(1)} points between them on a 390-wide phone`);
  });
  it('eight objects added one after another all keep the clear air, on the stage', () => {
    let p = blank();
    for (const kind of ['performer', 'guitar-amp', 'performer', 'keyboard', 'wedge', 'wedge', 'drum-kit', 'bass-amp'] as const) p = stageAddDrawing(p, kind, stageFreeSpot(p, STAGE_NEW_SPOT, kind), { visualOnly: true }).p;
    for (let i = 0; i < p.objects.length; i++) {
      assert.ok(p.objects[i].x > 0 && p.objects[i].x < 1 && p.objects[i].y > 0 && p.objects[i].y < 1);
      for (let j = i + 1; j < p.objects.length; j++) assert.ok(gapM(p, i, j) >= STAGE_NEW_AIR - 1e-9, `${p.objects[i].kind} / ${p.objects[j].kind}: ${gapM(p, i, j).toFixed(2)} m`);
    }
  });
  it('a stage too full for the clear air still gets a free place, with the least air', () => {
    // chairs in rows, with a gap between their boxes that holds a quad box
    // with 0.1 m of air each side, and not with 0.3 m
    let p = spFromTemplate('blank', { id: 'full', now: 1 });
    p = { ...p, stage: { ...p.stage, snap: false } };
    const boxOf = (kind: 'chair' | 'power') => {
      const q = stageAddDrawing(p, kind, { x: 0.5, y: 0.5 }).p;
      return spObjectBoxM(q, q.objects[0]);
    };
    const chair = boxOf('chair');
    const quad = boxOf('power');
    const gap = Math.max(quad.w, quad.h) + 2 * STAGE_MIN_AIR + 0.15;
    assert.ok(gap < Math.min(quad.w, quad.h) + 2 * STAGE_NEW_AIR, 'too narrow for the clear air');
    const pitchX = (chair.w + gap) / 7.2;
    const pitchY = (chair.h + gap) / 4.5;
    for (let y = pitchY / 2; y < 1; y += pitchY) for (let x = pitchX / 2; x < 1; x += pitchX) p = stageAddDrawing(p, 'chair', { x, y }, { visualOnly: true }).p;
    const n = p.objects.length;
    assert.ok(n > 20, `${n} chairs fill the stage`);
    p = stageAddDrawing(p, 'power', stageFreeSpot(p, STAGE_NEW_SPOT, 'power'), { visualOnly: true }).p;
    let least = Infinity;
    for (let i = 0; i < n; i++) least = Math.min(least, gapM(p, i, n));
    assert.ok(least >= STAGE_MIN_AIR - 1e-9, `the quad box shares no place (${least.toFixed(2)} m)`);
    assert.ok(least < STAGE_NEW_AIR, 'the clear air had no room: the second pass found this place');
    assert.ok(STAGE_MIN_AIR < STAGE_NEW_AIR);
  });
});

describe('F3 · Stage Plot: "Who plays or sings it" does not default to Nobody when the answer is plain', () => {
  it('the only performer, or the one whose figure is selected; never a guess among several', () => {
    const one = spAddPerformer(blank(), { name: 'Performer 1', role: '' });
    assert.equal(stageDefaultWho(one.p), one.id);
    const two = spAddPerformer(one.p, { name: 'Performer 2', role: '' });
    assert.equal(stageDefaultWho(two.p), null, 'two performers, none selected: nobody is guessed');
    assert.equal(stageDefaultWho(two.p, two.id), two.id);
    assert.equal(stageDefaultWho(two.p, 'gone'), null);
    assert.equal(stageDefaultWho(blank()), null);
  });
  it('the palette asks it when a package opens, and the stage tells it who is selected', () => {
    const palette = code(`${SP}/stage/StagePalette.tsx`);
    assert.match(palette, /setWho\(stageDefaultWho\(p, selectedPerformerId\) \?\? NOBODY\);/);
    assert.doesNotMatch(palette, /setWho\(NOBODY\);/);
    assert.match(code(`${SP}/StageArea.tsx`), /selectedPerformerId=\{sel\?\.performerId \?\? null\}/);
  });
});

describe('F3 · Stage Plot: the palette does not stay over what was added', () => {
  it('an add from the popup closes the popup (already so; pinned)', () => {
    const area = code(`${SP}/StageArea.tsx`);
    assert.match(area, /const addFromPalette = \(make: \(q: SpProject, at: Pt\) => StageAdded\) => \{\s+add\(make\);\s+setPanel\(null\);\s+\};/);
    assert.match(area, /\{paletteBody\(sheetH, addFromPalette\)\}/);
  });
});

describe('F3 · Stage Plot: the guided task is open on a blank stage, and no longer headed (OPTIONAL)', () => {
  it('open by default on a plot started from a blank stage; closed on an example band', () => {
    assert.equal(spGuidedOpenByDefault(blank()), true);
    assert.equal(spGuidedOpenByDefault(spFromTemplate('four-piece', { id: 'x', now: 1 })), false);
    assert.equal(spGuidedOpenByDefault({ startedBlank: false }), false);
    const task = code(`${SP}/GuidedTask.tsx`);
    assert.match(task, /useState\(stepsChoice \?\? spGuidedOpenByDefault\(ed\.project\)\)/);
    assert.doesNotMatch(task, /let stepsOpen = false;/);
  });
  it('the heading is GUIDED TASK; the line under it still says it can be skipped', () => {
    assert.equal(SP_GUIDED_TITLE, 'GUIDED TASK');
    const task = code(`${SP}/GuidedTask.tsx`);
    assert.doesNotMatch(task, /\(OPTIONAL\)/);
    assert.match(task, /<Section title=\{SP_GUIDED_TITLE\}/);
    assert.match(task, /Working on a real gig\? Skip this and build what you need\./);
    assert.match(SP_GUIDE_SETUP.control.join(' '), /GUIDED TASK opens on a blank stage\. All five steps/);
    assert.doesNotMatch(SP_GUIDE_SETUP.control.join(' '), /The guided task is optional\./);
    assert.match(SP_GUIDE_SETUP.intro!.start, /GUIDED TASK, at the top, lists five steps\./);
  });
});

describe('F3 · Stage Plot: two intro cards that named the wrong first step', () => {
  it('Stage: performers from Setup are placed first; ADD → Performer is for someone new', () => {
    assert.doesNotMatch(SP_GUIDE_STAGE.intro!.start, /^Tap ADD and choose Performer\./);
    assert.match(SP_GUIDE_STAGE.intro!.start, /^Performers from Setup wait under the drawing: tap PLACE … ON THE STAGE for each\. For anyone new, tap ADD and choose Performer\./);
    assert.match(code(`${SP}/StageArea.tsx`), /label=\{`PLACE \$\{u\.name\.toUpperCase\(\)\} ON THE STAGE`\}/, 'the button the card names');
  });
  it('Export: the card names the browser’s button too', () => {
    assert.match(SP_GUIDE_EXPORT.intro!.start, /press SHARE PDF \(DOWNLOAD PDF in a browser\) or PRINT\./);
    assert.match(code(`${SP}/ExportArea.tsx`), /label="DOWNLOAD PDF"/);
  });
});

/* ══ PHASE 2: the shared frame, filled in for both labs ═══════════════════ */

/** The page files in the LEARNER'S order (pages/index.ts GA_PAGES): 24 since
 *  the split of phase 3. A file's number is its name, not its place. */
const PAGE_FILES = ['p01Welcome', 'p02Reacts', 'p03Platforms', 'p04Games', 'p23Listener', 'p05Sounds', 'p06Pipeline', 'p07Instances', 'p08GameSyncs', 'p09Variation', 'p10Loops', 'p24LoopJoin', 'p11Distance', 'p12Walls', 'p13Formats', 'p14Music', 'p15Dialogue', 'p16Mix', 'p17Budgets', 'p18Multiplayer', 'p19Testing', 'p20Tools', 'p21Today', 'p22Capstone'];
const pageCode = (f: string) => code(`${GA}/pages/${f}.tsx`);

describe('F3 phase 2 · Game Audio: the silent learner (S3)', () => {
  it('the frame line is on for every page, in the lab’s words', () => {
    assert.match(code(`${GA}/GaLab.tsx`), /soundOffLine: GA_SOUND_OFF_LINE,/);
    assert.match(GA_SOUND_OFF_LINE, /^Sound off\? You can still do every step\./);
    assert.match(GA_SOUND_OFF_LINE, /activity log and the rings/);
  });
  it('the one step judged by ear is tagged, and its sound-off path is in the next line', () => {
    const p1 = pageCode('p01Welcome');
    assert.match(p1, /Raise LEVEL slowly until the scene is comfortable\. <NeedsSoundTag \/> Then press ■ STOP\./);
    assert.match(p1, /With sound off, watch the bars rise instead\./);
    assert.match(p1, /import \{ NeedsSoundTag \} from '\.\.\/\.\.\/rack\/silentPath';/);
    // no goal needs sound: every goal is judged from what the scene did
    for (const f of PAGE_FILES) assert.doesNotMatch(pageCode(f), /hit: [^}]*heardStart/, `${f}: a goal that needs hearing`);
  });
});

describe('F3 phase 2 · Game Audio: first-visit captions under the readouts (S3)', () => {
  it('each is one to three plain words, at most 12 characters (five cells at 390 wide cut 14), and never a unit', () => {
    assert.equal(GA_CAPTION_MAX, 12);
    for (const [k, c] of Object.entries(GA_READOUT_CAPTION)) {
      assert.ok(c.length <= GA_CAPTION_MAX, `${k}: "${c}" is ${c.length} characters`);
      assert.ok(c.split(' ').filter((w) => w !== '/').length <= 3, `${k}: ${c}`);
      assert.equal(c, c.toLowerCase(), `${k}: lower case, not a second label`);
      assert.doesNotMatch(c, /\b(db|hz|ms|%)\b/i, `${k}: not a unit`);
    }
  });
  it('every captioned key is a readout some page really shows, and the terms the audit named have one', () => {
    const all = PAGE_FILES.map(pageCode).join('\n') + code(`${GA}/GaLab.tsx`);
    for (const k of Object.keys(GA_READOUT_CAPTION)) assert.ok(all.includes(`'${k}'`), `${k} is a readout key`);
    for (const k of ['VOICES', 'PLAYING', 'GEN PAN', 'DUCK', 'BEDS', 'STOLEN', 'REFUSED', 'PRIORITY', 'PENDING']) assert.ok(GA_READOUT_CAPTION[k], k);
  });
  it('the rack adds them to the page’s readouts and its own three; a page’s own caption wins', () => {
    assert.deepEqual(gaWithCaption({ k: 'VOICES', v: '0/16' }), { k: 'VOICES', v: '0/16', caption: 'used/max' });
    // the two cells every page shows are its narrowest (62 points on page 8): eight letters at most
    for (const k of ['PLAYING', 'VOICES']) assert.ok(GA_READOUT_CAPTION[k].length <= 8, k);
    assert.deepEqual(gaWithCaption({ k: 'DOOR', v: 'OPEN' }), { k: 'DOOR', v: 'OPEN' });
    assert.equal(gaWithCaption({ k: 'VOICES', v: '1', caption: 'mine' }).caption, 'mine');
    assert.match(code(`${GA}/GaLab.tsx`), /\]\.map\(gaWithCaption\),\s+winW,/);
  });
});

describe('F3 phase 2 · Game Audio: one key order on every page (S3, trays)', () => {
  it('where LEVEL is a page’s slider it is the first key (pages 18 and 19 had it last)', () => {
    let seen = 0;
    for (const f of PAGE_FILES) {
      const m = pageCode(f).match(/keys: \[([^\n]*)\],/);
      assert.ok(m, `${f}: its keys`);
      if (!m[1].includes('masterKey(')) continue;
      seen += 1;
      assert.ok(m[1].startsWith('masterKey(s)'), `${f}: keys: [${m[1]}]`);
    }
    assert.ok(seen >= 7);
    assert.match(pageCode('p18Multiplayer'), /keys: \[masterKey\(s\), sendKey, checkKey\],/);
    assert.match(pageCode('p19Testing'), /keys: \[masterKey\(s\), testKey, fixKey\],/);
  });
});

describe('F3 phase 2 · Game Audio: each unfinished row says what that page needs (S2)', () => {
  it('one line for each of pages 1 to 21: its own goals, in the words of its chips, then its check', () => {
    assert.equal(GA_PAGE_LEFT.length, 21);
    assert.equal(new Set(GA_PAGE_LEFT).size, 21, 'no two pages share a line');
    GA_PAGE_LEFT.forEach((line, i) => {
      const f = PAGE_FILES[i];
      assert.ok(line.startsWith('Still to do: '), f);
      assert.ok(line.length <= 190, `${f}: ${line.length} characters`);
      assert.doesNotMatch(line, /Counts once|NEXT moves on/, `${f}: the shared rule is printed once, above the list`);
      assert.doesNotMatch(line, /\d+ of \d+/, `${f}: no "N of total"`);
      const labels = [...pageCode(f).matchAll(/\{ label: '([^']+)', hit:/g)].map((m) => m[1]);
      assert.ok(labels.length >= 1, `${f}: goal chips`);
      // the check: "Pass the check" or "Pass both checks", as the page's own chip says
      const check = labels[labels.length - 1];
      assert.match(check, /^Pass (the check|both checks)$/);
      assert.ok(line.endsWith(`and ${check.toLowerCase()}.`), `${f}: ends with its check (${check})`);
      // every control or readout word a goal chip names is in the line
      for (const label of labels.slice(0, -1)) for (const w of label.match(/\b[A-Z]{3,}\b/g) ?? []) assert.ok(line.includes(w), `${f}: the line names ${w} ("${label}")`);
    });
    // the testing page's goals are its five faults
    assert.equal(PAGE_FILES[20], 'p19Testing');
    for (const fault of FAULTS) assert.ok(GA_PAGE_LEFT[20].includes(fault.goal.split(': ')[1]), fault.goal);
  });
  it('the screen hands them to the end screen; pages 20 to 22 keep their own; the rule stands alone as a sentence', () => {
    const screen = code(`${GA}/GameAudioLabScreen.tsx`);
    assert.match(screen, /const pageDetail = \(i: number\): string \| undefined => PAGE_DETAIL\[i\] \?\? GA_PAGE_LEFT\[i\];/);
    assert.match(screen, /handsOnDetail=\{HANDS_ON\} pageDetail=\{pageDetail\}/);
    assert.match(screen, /const HANDS_ON = GA_HANDS_ON;/);
    assert.equal(GA_HANDS_ON, 'A page counts once its practice goals and its check are done in one visit; NEXT moves on without counting it.');
    for (const i of [21, 22, 23]) assert.match(screen, new RegExp(`${i}: '`), `page ${i + 1} keeps its own line`);
    assert.doesNotMatch(screen, /\b(19|20): '/, 'no line is left on an index of the 22-page list');
  });
  it('the end guide’s WHERE TO START is true whatever is left', () => {
    assert.equal(GA_END_GUIDE.intro!.start, 'Read WHERE TO START at the top: it names the next thing to do from where you are. Tap any page in the list to open it.');
    assert.doesNotMatch(GA_END_GUIDE.intro!.start, /first page still listed/);
  });
});

describe('F3 phase 2 · both labs: the check card and the accuracy chip need nothing more', () => {
  it('Game Audio: every check gives each wrong option its own reason, and the right option is never the longest', () => {
    let checks = 0;
    for (const f of PAGE_FILES) {
      for (const m of pageCode(f).matchAll(/options=\{\[([\s\S]*?)\]\}\s*correct=\{(\d)\}([\s\S]*?)onCorrect/g)) {
        checks += 1;
        const opts = [...m[1].matchAll(/'((?:[^'\\]|\\.)*)'/g)].map((x) => x[1]);
        const c = Number(m[2]);
        assert.ok(opts.some((o, i) => i !== c && o.length >= opts[c].length), `${f}: the right option is the longest`);
        const wrong = m[3].match(/wrong=\{\[([\s\S]*?)\]\}/);
        assert.ok(wrong, `${f}: a reason for each wrong option`);
        assert.equal([...wrong[1].matchAll(/'((?:[^'\\]|\\.)*)'/g)].length, opts.length - 1, `${f}: one reason per wrong option`);
      }
    }
    assert.ok(checks >= 30, `${checks} checks`);
  });
  it('Game Audio is a concept lab with no accuracy chip (D37); Stage Plot shows none', () => {
    assert.match(code(`${GA}/GameAudioLabScreen.tsx`), /accuracy=\{false\}/);
    assert.doesNotMatch(code(`${SP}/StagePlotLabScreen.tsx`), /AccuracyNote/);
  });
});

describe('F3 phase 2 · Stage Plot: no intro card over an open popup (S1)', () => {
  it('every popup of the lab reports work under way to the screen’s guide host', () => {
    const form = code(`${SP}/spForm.tsx`);
    assert.match(form, /export function Sheet\(p: \{[^\n]*\n\s+useScreenGuideWork\(p\.visible\);/);
    assert.match(form, /import \{ useScreenGuideWork \} from '\.\.\/\.\.\/\.\.\/features\/lab\/screenGuide\/introHold';/);
    // the host's rule: an owed card is dropped for this visit, a card already up closes
    assert.equal(introWorkAction(true, true, null), 'drop');
    assert.equal(introWorkAction(true, false, 'intro'), 'close');
    assert.equal(introWorkAction(false, true, null), 'none');
    // both hosts wrap the areas whose popups these are
    assert.equal((code(`${SP}/StagePlotLabScreen.tsx`).match(/<ScreenGuideHost /g) ?? []).length, 2);
  });
});

/* ══ PHASE 3: the owner's decisions ═══════════════════════════════════════ */

/* ── Game Audio: 22 pages became 24, and no saved mark is lost ───────────── */

// A fake device store, so the real pagedProgress and the real layout store run.
type F3Kv = { map: Map<string, string>; failGet: boolean; failSet: boolean };
const f3kv: F3Kv = { map: new Map(), failGet: false, failSet: false };
(globalThis as unknown as { __f3Kv: F3Kv }).__f3Kv = f3kv;
(globalThis as unknown as { __DEV__: boolean }).__DEV__ = false;
const F3_STUBS: Record<string, string> = {
  'async-storage': `const s = globalThis.__f3Kv; export default {
    getItem: async (k) => { if (s.failGet) throw new Error('unreadable'); return s.map.has(k) ? s.map.get(k) : null; },
    setItem: async (k, v) => { if (s.failSet) throw new Error('refused'); s.map.set(k, v); },
    removeItem: async (k) => { s.map.delete(k); },
    multiRemove: async (ks) => { for (const k of ks) s.map.delete(k); },
    getAllKeys: async () => [...s.map.keys()],
  };`,
  supabase: `export const supabase = { rpc: async () => ({ data: null, error: { message: 'user_not_found' } }) };`,
};
registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier === '@react-native-async-storage/async-storage') return { url: 'f3-stub:async-storage', shortCircuit: true };
    if (/\/lib\/supabase$/.test(specifier)) return { url: 'f3-stub:supabase', shortCircuit: true };
    if (specifier.startsWith('.') && !/\.[cm]?[jt]sx?$/.test(specifier) && context.parentURL) {
      for (const ext of ['.ts', '.tsx', '/index.ts']) {
        const candidate = new URL(specifier + ext, context.parentURL);
        if (existsSync(fileURLToPath(candidate))) return { url: candidate.href, shortCircuit: true };
      }
    }
    return nextResolve(specifier, context);
  },
  load(url, context, nextLoad) {
    if (url.startsWith('f3-stub:')) return { format: 'module', shortCircuit: true, source: F3_STUBS[url.slice('f3-stub:'.length)] };
    return nextLoad(url, context);
  },
});
const layout = await import('../src/screens/lab/gameaudio/model/gaPageLayout.ts');
const paged = await import('../src/features/lab/pagedProgress.ts');
const WIPE = read('src/features/account/clearLocalAccountData.ts');

const GA_KEY = 'ape:game-audio:v1';
const LAYOUT_KEY = 'ape:onboarding:gaPageLayout';
/** A new app start on a device that holds exactly these keys. */
async function freshDevice(keys: Record<string, unknown> = {}): Promise<void> {
  f3kv.map.clear();
  f3kv.failGet = false;
  f3kv.failSet = false;
  for (const [k, v] of Object.entries(keys)) f3kv.map.set(k, JSON.stringify(v));
  await layout.gaPageLayoutReload();
}
const stored = () => JSON.parse(f3kv.map.get(GA_KEY) ?? 'null') as { completed: number[]; lastPage: number; done: boolean } | null;

describe('F3 phase 3 · Game Audio: pages 4 and 10 are two pages each, and saved marks follow them', () => {
  const titles = [...read(`${GA}/pages/index.ts`).matchAll(/^import \{ (P\d\d) \} from '\.\/(p\d\d\w+)';$/gm)].map((m) => ({ id: m[1], file: m[2] }));
  const order = read(`${GA}/pages/index.ts`).match(/export const GA_PAGES: PageDef\[\] = \[([^\]]+)\];/)![1].split(',').map((x) => x.trim());
  const titleOf = (id: string): string => {
    const file = titles.find((t) => t.id === id)!.file;
    return code(`${GA}/pages/${file}.tsx`).match(/export const P\d\d: PageDef = \{\s*title: '([^']+)'/)![1];
  };

  it('24 pages, in this order; each split page is followed by its second lesson', () => {
    assert.equal(order.length, 24);
    assert.equal(new Set(order).size, 24);
    assert.equal(layout.GA_PAGES_LAYOUT_2, order.length);
    const names = order.map(titleOf);
    assert.deepEqual(names.slice(2, 6), ['Where games run', 'Kinds of games', 'Whose ears: the listener', 'Kinds of game sound']);
    assert.deepEqual(names.slice(9, 13), ['Variation and layers', 'Ambience and zones', 'Loops and their joins', 'Emitters and distance']);
    assert.equal(names[0], 'Welcome and safe listening');
    assert.equal(names[23], 'Capstone and free play');
  });

  it('the map: every old page keeps its mark, and a finished old page 4 or 10 marks both pages it became', () => {
    const old = ['Welcome and safe listening', 'Sound that reacts', 'Where games run', 'Kinds of games', 'Kinds of game sound', 'From source to game build', 'Events and instances', 'Triggers, states, switches', 'Variation and layers', 'Loops, ambience and zones', 'Emitters and distance', 'Walls, doors and rooms', 'Output formats', 'Adaptive music', 'Dialogue and languages', 'The game mix', 'Budgets and voice limits', 'Multiplayer sound', 'Testing and fault finding', 'Finding your way in the tools', 'Game audio today', 'Capstone and free play'];
    assert.equal(old.length, layout.GA_PAGES_LAYOUT_1);
    const now = order.map(titleOf);
    old.forEach((title, i) => {
      const to = layout.gaIndexFromLayout1(i);
      if (i === 3) assert.deepEqual(to.map((n) => now[n]), ['Kinds of games', 'Whose ears: the listener']);
      else if (i === 9) assert.deepEqual(to.map((n) => now[n]), ['Ambience and zones', 'Loops and their joins']);
      else assert.deepEqual(to.map((n) => now[n]), [title], `old page ${i + 1}`);
    });
    // every new page is reached by exactly one old page: nothing is added that was not earned
    const hit = old.flatMap((_, i) => layout.gaIndexFromLayout1(i));
    assert.deepEqual([...hit].sort((a, b) => a - b), Array.from({ length: 24 }, (_, i) => i));
    for (const bad of [-1, 22, 23, 500, 1.5, Number.NaN]) assert.deepEqual(layout.gaIndexFromLayout1(bad), []);
  });

  it('a record saved before the split is moved once: a learner with every page done still has every page done', async () => {
    const all = Array.from({ length: 22 }, (_, i) => i);
    await freshDevice({ [GA_KEY]: { completed: all, lastPage: 21, done: true } });
    assert.equal(await layout.gaEnsurePageLayout('game-audio'), 'moved');
    assert.deepEqual(stored(), { completed: Array.from({ length: 24 }, (_, i) => i), lastPage: 23, done: true });
    const p = await paged.loadPagedProgress('game-audio');
    assert.ok(Array.from({ length: 24 }, (_, i) => i).every((i) => p.completed.includes(i)), 'the shell’s "lab done" rule holds for all 24');
    // the pre-split record is kept on the device, beside the layout number
    assert.deepEqual(JSON.parse(f3kv.map.get(LAYOUT_KEY)!), { v: 2, was: { completed: all, lastPage: 21, done: true } });
  });

  it('a partly done record: pages 1, 4, 6, 10 and 17 done, last open on page 12', async () => {
    await freshDevice({ [GA_KEY]: { completed: [0, 3, 5, 9, 16], lastPage: 11, done: false } });
    assert.equal(await layout.gaEnsurePageLayout('game-audio'), 'moved');
    // 1 → 1 · 4 → 4 and 5 · 6 → 7 · 10 → 11 and 12 · 17 → 19 (as page numbers)
    assert.deepEqual(stored(), { completed: [0, 3, 4, 6, 10, 11, 18], lastPage: 13, done: false });
  });

  it('it never runs twice: the next visit, a new app start and a later wipe leave a 24-page record alone', async () => {
    await freshDevice({ [GA_KEY]: { completed: [3, 9], lastPage: 4, done: false } });
    assert.equal(await layout.gaEnsurePageLayout('game-audio'), 'moved');
    const after = stored();
    assert.deepEqual(after, { completed: [3, 4, 10, 11], lastPage: 5, done: false });
    assert.equal(await layout.gaEnsurePageLayout('game-audio'), 'current');
    await layout.gaPageLayoutReload(); // a new app start
    assert.equal(await layout.gaEnsurePageLayout('game-audio'), 'current');
    assert.deepEqual(stored(), after);
    // the shell saves in the new layout; an account wipe then removes the record but keeps the layout number
    await paged.savePagedProgress('game-audio', { completed: [3, 4, 5, 10, 11], lastPage: 5, done: false });
    // (the wipe keeps the whole `ape:onboarding:` family, in both its forms, before it looks at any list)
    assert.match(WIPE, /k\.startsWith\('ape:onboarding:'\) \|\|/);
    assert.match(WIPE, /if \(isOnboardingFlag\(k\)\) return true;\s+return opts\?\.total === true \? GUEST_KEEP\.has\(k\) : KEEP\.has\(k\);/);
    assert.ok(LAYOUT_KEY.startsWith('ape:onboarding:') && !GA_KEY.startsWith('ape:onboarding:'));
    f3kv.map.delete(GA_KEY);
    // a guest's pages written to the account AFTER the wipe (24-page indexes) are not moved again
    await paged.savePagedProgress('game-audio', { completed: [5, 6], lastPage: 6, done: false });
    await layout.gaPageLayoutReload();
    assert.equal(await layout.gaEnsurePageLayout('game-audio'), 'current');
    assert.deepEqual(stored(), { completed: [5, 6], lastPage: 6, done: false });
  });

  it('a device with nothing stored is marked 24-page at once, so its first record is never taken for an old one', async () => {
    await freshDevice();
    assert.equal(await layout.gaEnsurePageLayout('game-audio'), 'fresh');
    assert.equal(stored(), null);
    await paged.savePagedProgress('game-audio', { completed: [3], lastPage: 3, done: false });
    await layout.gaPageLayoutReload();
    assert.equal(await layout.gaEnsurePageLayout('game-audio'), 'current');
    assert.deepEqual(stored(), { completed: [3], lastPage: 3, done: false });
  });

  it('the app closed in the middle of the move: the next start finishes it from the copy, not from the half-moved record', async () => {
    const old = { completed: [3, 4, 9], lastPage: 9, done: false };
    // step 1 landed (the copy is in the value), step 2 also landed, step 3 did not
    await freshDevice({ [LAYOUT_KEY]: { v: 1, old }, [GA_KEY]: { completed: [3, 4, 5, 10, 11], lastPage: 10, done: false } });
    assert.equal(await layout.gaEnsurePageLayout('game-audio'), 'moved');
    assert.deepEqual(stored(), { completed: [3, 4, 5, 10, 11], lastPage: 10, done: false }, 'the same record, not one moved twice');
    // step 1 landed, step 2 did not: the record on the device is still the old one
    await freshDevice({ [LAYOUT_KEY]: { v: 1, old }, [GA_KEY]: old });
    assert.equal(await layout.gaEnsurePageLayout('game-audio'), 'moved');
    assert.deepEqual(stored(), { completed: [3, 4, 5, 10, 11], lastPage: 10, done: false });
  });

  it('a device that cannot be read or will not write changes nothing, and tries again next time', async () => {
    const old = { completed: [0, 3], lastPage: 3, done: false };
    await freshDevice({ [GA_KEY]: old });
    f3kv.failGet = true;
    await layout.gaPageLayoutReload();
    assert.equal(await layout.gaEnsurePageLayout('game-audio'), 'unread');
    f3kv.failGet = false;
    assert.deepEqual(stored(), old);
    assert.equal(f3kv.map.has(LAYOUT_KEY), false);
    // writes refused: still nothing changed
    await layout.gaPageLayoutReload();
    f3kv.failSet = true;
    assert.equal(await layout.gaEnsurePageLayout('game-audio'), 'unread');
    f3kv.failSet = false;
    assert.deepEqual(stored(), old);
    // the next visit moves it
    await layout.gaPageLayoutReload();
    assert.equal(await layout.gaEnsurePageLayout('game-audio'), 'moved');
    assert.deepEqual(stored(), { completed: [0, 3, 4], lastPage: 3, done: false });
  });

  it('the lab screen moves the record before the shell can read it, and never blocks on it', () => {
    const screen = code(`${GA}/GameAudioLabScreen.tsx`);
    assert.match(screen, /void gaEnsurePageLayout\(GA_LAB_ID\)\.then\(\(\) => \{/);
    assert.match(screen, /\{ready \? \(\s*<PagedLab labId=\{GA_LAB_ID\}/);
    // the credit key and the "every page" rule are untouched: all 24 pages, no optional page
    assert.match(screen, /labDoneKey=\{trainingKeyFor\('GameAudioLab'\)\}/);
    assert.match(screen, /optionalPage=\{noPageOptional\}/);
    // the layout value is in the family the wipe keeps, on the shared safe store
    const mod = code(`${GA}/model/gaPageLayout.ts`);
    assert.match(mod, /key: 'ape:onboarding:gaPageLayout'/);
    assert.match(mod, /createLocalStore<LayoutValue>\(/);
  });
});

describe('F3 phase 3 · Game Audio: the split pages keep every lesson, goal and check of the old ones', () => {
  const kinds = pageCode('p04Games');
  const ears = pageCode('p23Listener');
  const zones = pageCode('p10Loops');
  const loops = pageCode('p24LoopJoin');

  it('old page 4: its five goals and two checks are on the two pages, none twice', () => {
    const labels = (src: string) => [...src.matchAll(/\{ label: '([^']+)', hit:/g)].map((m) => m[1]);
    assert.deepEqual(labels(kinds), ['Open three kinds of game', 'Pass the check']);
    assert.deepEqual(labels(ears), ['Listen from the overhead camera', 'Move FACING while the camera listens', 'Choose YOUR EARS again', 'Pass the check']);
    assert.match(kinds, /question="A racing game is seen from above\. Two people play it in turns on one screen\. Which of these is its play mode\?"/);
    assert.match(ears, /question="You move the listener from the player to the overhead camera\. The generator has not moved\. Why does its pan change\?"/);
    // every sentence of the old lesson is still said, on one page or the other
    for (const s of [
      'Genre, perspective and play mode are three separate choices. A puzzle can be played in first person, and a racing game can be seen from above.',
      'Each kind of game puts different sounds first, built from the same parts.',
      'Each pick starts the scene again and shows one thing that kind of game cares about.',
      'A card shows a typical emphasis, not a rule. Many games combine several kinds.',
      'One thing changes with the perspective: where the game puts its listener.',
      'At 0°, for your ears the generator is far to the right. For the camera it sits nearer the center, because the camera is high above the scene.',
      'GEN PAN stays still. The character is not the listener.',
      'Level follows the listener too: for the camera, each sound’s level depends on its distance from the middle of the scene, not from YOU.',
      'Placing every sound on the visible player character in every camera mode. The team chooses where the listener goes.',
    ]) assert.ok((kinds + ears).includes(s), s);
    // one lesson each: the listener's tray is not on the kinds page, the games tray not on the listener page
    assert.doesNotMatch(kinds, /ListenerTray|GEN PAN/);
    assert.doesNotMatch(ears, /GamesTray|GA_GENRES/);
  });

  it('old page 10: its three goals and two checks are on the two pages, none twice', () => {
    const labels = (src: string) => [...src.matchAll(/\{ label: '([^']+)', hit:/g)].map((m) => m[1]);
    assert.deepEqual(labels(zones), ['Cross the doorway twice with the scene running', 'Pass the check']);
    assert.deepEqual(labels(loops), ['Stay in the courtyard until the raw cut passes its join', 'Silence every loop with ■ STOP', 'Pass the check']);
    assert.match(zones, /question="You stay inside the workshop and walk around\. How many copies of the room tone are playing\?"/);
    assert.match(loops, /question="A wind loop jumps in level every 10 seconds\. Someone makes the crossfade at the doorway twice as long\. What happens to the jump\?"/);
    for (const s of [
      'A loop repeats, so the join where its end meets its start must be prepared, or it jumps on every pass.',
      'A bed is a loop with no position: courtyard wind, workshop room tone. The birds are spot sounds: one-shots at random times and places, so the background does not repeat.',
      'Both beds start once, with the scene. Entering the other zone fades one bed down and the other up: a crossfade.',
      'A fade does not repair a badly cut loop.',
      'Each crossing prints one STATE line that begins ZONE: one crossfade of 1.5 s.',
      'The raw cut was not prepared as a loop. It ends in a gust and begins in a lull, so it jumps every 10 s.',
      'Starting a background loop again on every position update in one area. The copies stack, get louder and use voices.',
    ]) assert.ok((zones + loops).includes(s), s);
    // the fault and its card stay with the zones; the WIND key goes with the loop
    assert.match(zones, /<FaultCard\s+title="THE BACKGROUND THAT KEEPS GROWING"/);
    assert.doesNotMatch(zones, /windKey|rawYardLoop/);
    assert.doesNotMatch(loops, /FaultCard|bedPileUp/);
    // the loop page needs no walking: three keys, the slider first
    assert.match(loops, /keys: \[masterKey\(s\), sceneKey\(s\), windKey\],/);
    // owner 2026-11-15: "build waves 1 thru 3" (D62 adoption plan, item GA-05): the zones page walks with WALK, the
    // lab's one walking control, in place of FACING and STEP
    assert.match(zones, /keys: \[walkKey\(s\), soundsKey\],/);
  });

  it('every page number a learner reads is today’s number', () => {
    const order = PAGE_FILES;
    const titleAt = (n: number) => pageCode(order[n - 1]).match(/export const P\d\d: PageDef = \{\s*title: '([^']+)'/)![1];
    // number → the page that sentence is about
    const expected: Record<number, string> = { 8: 'Events and instances', 19: 'Budgets and voice limits', 22: 'Finding your way in the tools', 23: 'Game audio today' };
    for (const [n, title] of Object.entries(expected)) assert.equal(titleAt(Number(n)), title, `page ${n}`);
    const files = [...order.map((f) => `${GA}/pages/${f}.tsx`), ...order.map((f) => `${GA}/pages/guides/p${f.slice(1, 3)}.ts`), `${GA}/pages/guides/end.ts`, `${GA}/gaTerms.ts`, `${GA}/bits.tsx`, `${GA}/bitsLogic.ts`, `${GA}/pages/data/gaPageLeft.ts`];
    let seen = 0;
    for (const f of files) {
      const src = code(f).replace(/\s\/\/ .*$/gm, '');
      for (const m of src.matchAll(/\b[Pp]ages? (\d+)/g)) {
        seen += 1;
        assert.ok(expected[Number(m[1])], `${f} says "page ${m[1]}": is that still the right page?`);
      }
    }
    assert.ok(seen >= 6, `${seen} page numbers checked`);
    // owner 2026-11-15: "build waves 1 thru 3" (D62 adoption plan, item GA-12): the page-8 pointer is now part of the voice line
    assert.match(pageCode('p01Welcome'), /page 8 explains how the two differ\./);
    assert.match(GA_END_GUIDE.changes.join(' '), /Page 22 is done when its six checks are passed, page 23 when its two are\./);
  });

  it('the strip, CONTENTS and the end screen use the lab’s own word, page (owner’s decision 3)', () => {
    assert.match(code(`${GA}/GameAudioLabScreen.tsx`), /pageDetail=\{pageDetail\} unitNoun="page" /);
    assert.match(GA_HANDS_ON, /^A page counts once/);
    assert.match(GA_GOALS_PENDING, /^This page counts once/);
  });

  it('the glass says "drawing…" until the picture has had its first frames, and never for good', () => {
    const lab = code(`${GA}/GaLab.tsx`);
    assert.match(lab, /drawing: !painted,/);
    assert.match(lab, /export const GA_DRAWING_MAX_MS = 1200;/);
    assert.match(lab, /const timer = setTimeout\(\(\) => setPainted\(true\), GA_DRAWING_MAX_MS\);/);
    // a one-shot wait on the house runSoon (two real macrotasks), never frame callbacks: GaLab must not
    // become a loop host (D8; test/patternP10b_20261002.test.ts, whose lists may only shrink)
    assert.match(lab, /let wait = runSoon\(\(\) => \{\s*wait = runSoon\(\(\) => setPainted\(true\)\);\s*\}\);/);
    assert.match(lab, /wait\.cancel\(\);\s*clearTimeout\(timer\);/);
    assert.match(lab, /import \{ runSoon \} from '\.\.\/\.\.\/\.\.\/lib\/afterInteractions';/);
    assert.doesNotMatch(lab, /requestAnimationFrame|cancelAnimationFrame|InteractionManager/);
  });
});

/* ── Stage Plot: Setup shows the beginner core, the rest is folded ───────── */

const folds = await import('../src/features/stageplot/spSetupFolds.ts');

describe('F3 phase 3 · Stage Plot SETUP: the band and the performers first, five parts folded', () => {
  const setup = code(`${SP}/SetupArea.tsx`);
  it('five parts fold, in the order they were in; THE BAND and PERFORMERS do not', () => {
    assert.deepEqual(folds.SP_SETUP_FOLDS.map((f) => f.title), ['THE GIG', 'TECHNICAL CONTACT', 'REVISION AND STATUS', 'STAGE SIZE', 'NOTES']);
    assert.deepEqual([...folds.SP_SETUP_OPEN_PARTS], ['THE BAND', 'PERFORMERS']);
    const sections = [...setup.matchAll(/<(Section|FoldSection) title="([^"]+)"/g)].map((m) => `${m[1]}:${m[2]}`);
    assert.deepEqual(sections, ['Section:THE BAND', 'Section:PERFORMERS', 'FoldSection:THE GIG', 'FoldSection:TECHNICAL CONTACT', 'FoldSection:REVISION AND STATUS', 'FoldSection:STAGE SIZE', 'FoldSection:NOTES']);
    for (const f of folds.SP_SETUP_FOLDS) assert.match(setup, new RegExp(`<FoldSection title="${f.title}"[^>]*\\{\\.\\.\\.fold\\('${f.id}'\\)\\}>`), f.title);
    assert.equal(folds.SP_FOLD_OPEN_WORD, 'GO DEEPER ▾');
    assert.match(setup, /openWord: 'GO DEEPER ▾',/);
    assert.match(setup, /useState<ReadonlySet<SpSetupFoldId>>\(\(\) => openFolds\[p\.id\] \?\? new Set\(\)\)/, 'closed until opened; kept while the app is open');
  });
  it('nothing was removed: every field, switch and note of the five parts is still in the file', () => {
    for (const label of ['label="Venue"', 'label="Event date"', 'label="Load-in"', 'label="Soundcheck"', 'label="Performance"', "label: 'Contact name'", "label: 'Their role'", "label: 'Email'", "label: 'Phone'", 'label={`Show the ${f.word} in the packet`}', 'label="Status"', 'label="The venue has confirmed this revision"', 'label="Shape of the stage"', 'label="Wings at each side"', 'label="Width"', 'label="Depth"', 'label="Diameter"', 'label="Thrust width"', 'label="Thrust depth"', 'label="Width of each wing"', 'label="Measured in"', 'label="These numbers are"', 'label="General notes"', 'label="Access and setup notes"', 'label="Viewpoint note"', 'title="Thrust, in the round, wings: what changes for sound"', 'title="Stage right, stage left, upstage, downstage"']) {
      assert.ok(read(`${SP}/SetupArea.tsx`).includes(label), label);
    }
  });
  it('a closed part says what it holds, in one line, and is never blank', () => {
    const p = spFromTemplate('blank', { id: 'folds', now: 1 });
    assert.equal(folds.spSetupFoldSummary(p, 'gig'), 'The venue, the date and the times. Nothing typed yet.');
    assert.equal(folds.spSetupFoldSummary(p, 'contact'), 'The person the venue’s engineer should ask. Nobody yet.');
    assert.equal(folds.spSetupFoldSummary(p, 'status'), 'Revision 1 · Draft');
    assert.equal(folds.spSetupFoldSummary(p, 'size'), 'Rectangle · no size yet (not to scale)');
    assert.equal(folds.spSetupFoldSummary(p, 'notes'), 'Nothing written yet.');
    const q: SpProject = { ...p, venue: 'The Roxy', eventDate: '2026-12-05', soundcheck: '5:00 PM', notes: 'Two vans.', viewNote: 'x', contact: { ...p.contact, name: 'Ana', email: 'ana@example.com' }, stage: { ...p.stage, width: 24, depth: 16 } };
    assert.equal(folds.spSetupFoldSummary(q, 'gig'), 'The Roxy · December 5, 2026 · soundcheck 5:00 PM');
    assert.equal(folds.spSetupFoldSummary(q, 'contact'), 'Ana · ana@example.com');
    assert.equal(folds.spSetupFoldSummary(q, 'size'), 'Rectangle · 24 × 16 ft');
    assert.equal(folds.spSetupFoldSummary(q, 'notes'), 'Written: general, viewpoint.');
    for (const f of folds.SP_SETUP_FOLDS) for (const x of [p, q]) assert.ok(folds.spSetupFoldSummary(x, f.id).length > 5, f.id);
    // no "N of total" in any summary
    for (const f of folds.SP_SETUP_FOLDS) assert.doesNotMatch(folds.spSetupFoldSummary(q, f.id), /\d+ of \d+/);
  });
  it('a screen reader hears each part of a row as its own sentence (checker K2: two rows ran into "Show this part")', () => {
    const p = spFromTemplate('blank', { id: 'say', now: 1 });
    const q: SpProject = { ...p, venue: 'The Roxy', contact: { ...p.contact, name: 'Ana', email: 'ana@example.com' }, stage: { ...p.stage, width: 24, depth: 16 } };
    const say = (x: SpProject, id: 'gig' | 'contact' | 'status' | 'size' | 'notes', ask: string | null = null, open = false) =>
      folds.spFoldRowSay({ title: folds.SP_SETUP_FOLDS.find((f) => f.id === id)!.title, summary: folds.spSetupFoldSummary(x, id), ask, open });
    assert.equal(say(p, 'status'), 'REVISION AND STATUS. Revision 1 · Draft. Show this part.');
    assert.equal(say(p, 'size'), 'STAGE SIZE. Rectangle · no size yet (not to scale). Show this part.');
    assert.equal(say(q, 'size'), 'STAGE SIZE. Rectangle · 24 × 16 ft. Show this part.');
    assert.equal(say(q, 'gig'), 'THE GIG. The Roxy. Show this part.');
    assert.equal(say(q, 'contact'), 'TECHNICAL CONTACT. Ana · ana@example.com. Show this part.');
    assert.equal(say(p, 'notes'), 'NOTES. Nothing written yet. Show this part.', 'a summary that ends in a full stop gets no second one');
    assert.equal(say(p, 'contact', 'Nobody to ask'), 'TECHNICAL CONTACT. The person the venue’s engineer should ask. Nobody yet. A question: Nobody to ask. Show this part.');
    assert.equal(say(p, 'gig', null, true), 'THE GIG. Hide this part.');
    // every row, empty and filled, closed: no two sentences run together, and no doubled full stop
    for (const x of [p, q]) for (const f of folds.SP_SETUP_FOLDS) {
      const s = say(x, f.id);
      assert.match(s, /[.!?…] Show this part\.$/, `${f.id}: ${s}`);
      assert.doesNotMatch(s, /\.\./, `${f.id}: ${s}`);
    }
    assert.match(code(`${SP}/spForm.tsx`), /accessibilityLabel=\{spFoldRowSay\(p\)\}/);
  });
  it('a review question is never folded away: it shows on the closed row, and GO TO opens the part', () => {
    const a = spAddPerformer(spFromTemplate('blank', { id: 'ask', now: 1 }), { name: 'Ana', role: '' });
    const issues = spReview(a.p);
    const ask = issues.find((i) => i.rule === 'no-contact');
    assert.ok(ask, 'a plot with a performer and no contact is asked about it');
    assert.equal(folds.spSetupFoldAsk(issues, 'contact'), ask.text);
    assert.equal(folds.spSetupFoldAsk(issues, 'gig'), null);
    assert.equal(folds.spSetupFoldOfRule('no-contact'), 'contact');
    for (const rule of ['no-band-name', 'example-title', 'empty', null]) assert.equal(folds.spSetupFoldOfRule(rule), null, `${rule}: its field is in the open part`);
    assert.match(setup, /const inFold = spSetupFoldOfRule\(rule\);\s+if \(inFold\) setFoldOpen\(inFold, true\);/);
    const form = code(`${SP}/spForm.tsx`);
    assert.match(form, /\{!p\.open && p\.ask \? <Text style=\{styles\.foldAsk\}>\{`\? \$\{p\.ask\}`\}<\/Text> : null\}/);
    assert.match(form, /accessibilityState=\{\{ expanded: p\.open \}\}/);
  });
  it('Export’s GO TO SETUP for the contact opens the folded contact part (it landed at the top of Setup, contact folded away: seen on screen)', () => {
    const went: unknown[][] = [];
    goToSetupPart({ goTo: (...a: unknown[]) => void went.push(a) } as never, 'no-contact');
    assert.deepEqual(went, [['setup']], 'it goes to Setup');
    const rule = takeSpSetupAsk();
    assert.equal(rule, 'no-contact', 'and leaves the part’s rule for Setup, as a review "Go to" does');
    assert.equal(folds.spSetupFoldOfRule(rule), 'contact', 'which opens the TECHNICAL CONTACT part');
    assert.equal(spSetupField(rule), 'contact', 'and brings it into view');
    assert.equal(takeSpSetupAsk(), null, 'taken once');
    assert.match(code(`${SP}/ExportArea.tsx`), /<Button label="GO TO SETUP" onPress=\{\(\) => goToSetupPart\(ed, 'no-contact'\)\}/);
    // every other "go to Setup" in the lab is about a performer, and PERFORMERS is never folded
    for (const f of ['monitors/MixSheets.tsx', 'stage/StageInspector.tsx']) {
      for (const m of code(`${SP}/${f}`).matchAll(/a11yLabel=(?:"|\{`)(Go to [^"`]*Setup[^"`]*)/g)) assert.match(m[1], /performer|in Setup/i, `${f}: ${m[1]}`);
    }
  });
  it('the guide and the intro card say the parts are folded', () => {
    assert.match(SP_GUIDE_SETUP.control.join(' '), /GO DEEPER ▾ opens a folded part, such as the gig or the stage size\. Its row says what it holds\./);
    assert.match(SP_GUIDE_SETUP.intro!.start, /each is folded until you open it/);
    assert.ok(SP_GUIDE_SETUP.control.join('\n').length <= 700);
  });
});
