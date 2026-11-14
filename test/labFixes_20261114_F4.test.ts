/**
 * Lab fix round 1, group F4 (2026-11-14): Beginning Mixing, Advanced Mixing,
 * Mastering, Mixing Guides, Pre-Production, Post-Production.
 *
 * Owner approval for the round (2026-11-14): "Begin fixing all bugs found and
 * do obvious (my decision is not required) fixes as you suggestted in the
 * report." Source: the novice beginner audit (G4 files).
 *
 * Every test here would have failed before its fix.
 */
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { registerHooks } from 'node:module';
import { join } from 'node:path';
import { describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier.startsWith('.') && !/\.[cm]?[jt]sx?$/.test(specifier)) {
      const candidate = new URL(specifier + '.ts', context.parentURL);
      if (existsSync(fileURLToPath(candidate))) return { url: candidate.href, shortCircuit: true };
      const index = new URL(specifier + '/index.ts', context.parentURL);
      if (existsSync(fileURLToPath(index))) return { url: index.href, shortCircuit: true };
    }
    return nextResolve(specifier, context);
  },
});

const ROOT = process.cwd();
const read = (p: string) => readFileSync(join(ROOT, p), 'utf8').replace(/\r\n/g, '\n');
/** Source without comments, so a pin never matches an explanation. */
const code = (p: string) => read(p).replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '').replace(/\{\/\*[\s\S]*?\*\/\}/g, '');

const MA = 'src/screens/lab/mastering';
const MX = 'src/screens/lab/mixing';
const PR = 'src/screens/lab/production';

// ── Mastering ────────────────────────────────────────────────────────────────

describe('Mastering M6 step 1: TRUE PK never reads below PEAK', async () => {
  const M = await import('../src/screens/lab/meter/meterEngine.ts');
  const SIGNALS = ['music', 'speech', 'kick', 'organ'] as const;

  it('the bezel builds TRUE PK on the PEAK it shows, plus the story’s overshoot', () => {
    const m = code(`${MA}/modules/mod6Loudness.tsx`);
    assert.match(m, /const peak = linDb\(peakOf\(renderSignal\(signal\)\)\);/);
    assert.match(m, /const overshoot = Math\.max\(0, sim\.truePeakDbtp - sim\.samplePeakDbfs\);/);
    assert.match(m, /return \{ peak, tp: peak \+ overshoot, lufs: sim\.integratedLufs \};/);
    assert.doesNotMatch(m, /tp: sim\.truePeakDbtp/, 'the old, separate true-peak number');
  });

  it('for every SIGNAL the displayed TRUE PK is at or above the displayed PEAK (the old values were below for Kick, Organ and Speech)', () => {
    for (const k of SIGNALS) {
      const sim = M.simulateLoudness(k);
      const peak = M.db(M.peakOf(M.renderSignal(k)));
      const tp = peak + Math.max(0, sim.truePeakDbtp - sim.samplePeakDbfs);
      assert.ok(Number(tp.toFixed(1)) >= Number(peak.toFixed(1)), `${k}: PEAK ${peak.toFixed(1)} / TRUE PK ${tp.toFixed(1)}`);
    }
    // The bug as G4 saw it: Kick PEAK +1.6 beside TRUE PK −5.0.
    const kickOld = M.simulateLoudness('kick').truePeakDbtp;
    const kickPeak = M.db(M.peakOf(M.renderSignal('kick')));
    assert.ok(kickOld < kickPeak, 'the old pairing really was inverted');
  });
});

describe('Mastering M3 step 3: + CONNECT no longer builds the chain by itself', () => {
  it('the selection stays on the placed device: no auto-advance', () => {
    const m = code(`${MA}/modules/mod3Room.tsx`);
    assert.doesNotMatch(m, /firstUnplaced/);
    assert.match(m, /const add = \(\) => setChain\(\(c\) => \(c\.length >= 5 \|\| c\.includes\(next\) \? c : \[\.\.\.c, next\]\)\);/);
    assert.doesNotMatch(m, /moves on to the next unplaced device by itself/);
    assert.match(m, /Then choose the next DEVICE yourself: the order is the decision\./);
  });

  it('the screen guide says the same', () => {
    const g = read(`${MA}/masteringScreenGuides.ts`);
    assert.doesNotMatch(g, /The choice then moves on to the next device not yet placed/);
    assert.doesNotMatch(g, /Press \+ CONNECT five times/);
    assert.match(g, /The choice stays on the device you just placed: picking the next one is your decision\./);
  });
});

describe('Mastering review: a way back to the practice cards', () => {
  it('the credit line is followed by a key to the PRACTICE step while cards are open', () => {
    const s = code(`${MA}/MasteringLabScreen.tsx`);
    assert.match(s, /\{!done && answeredCount < scenarios\.length \? \(\s*<KeyButton label="OPEN THE PRACTICE CARDS ›" onPress=\{\(\) => setStep\(MASTERING_CREDIT_STEP\[mod\.id\]\)\} \/>/);
    assert.match(s, /import \{ KeyButton, RecordedAnswersContext, TakeawayCard \} from '\.\/kit';/);
  });
});

// ── Beginning Mixing ─────────────────────────────────────────────────────────

describe('Beginning Mixing page 15: the inspection waits for a bounce', () => {
  it('RUN THE INSPECTION passes only once a rate and a depth are chosen, and says why otherwise', () => {
    const s = code(`${MX}/pagesD.tsx`);
    assert.match(s, /onPress=\{\(\) => \(rate && depth \? setInspected\(true\) : setTooEarly\(true\)\)\}/);
    assert.doesNotMatch(s, /onPress=\{\(\) => setInspected\(true\)\}/);
    assert.match(s, /No bounce yet: choose a SAMPLE RATE and a BIT DEPTH above first\./);
  });
});

describe('Beginning Mixing page 4: the caption waits for the blind vote', () => {
  it('"B’s bar sits 3 dB higher" shows only after a vote', () => {
    const s = code(`${MX}/pagesA.tsx`);
    assert.match(s, /\{verdict == null\s*\? 'Left: the worst case, identical peaks landing at once\. Right: the two mixes below, measured as they play\. Vote with your ears first, before you read the bars\.'\s*: 'Left: [^']*B’s bar sits 3 dB higher/);
  });
});

describe('Beginning Mixing page 8: the trade-off line follows the fix on the picture', () => {
  it('a tap (sound off too) names its fix, not only a heard one', () => {
    const s = code(`${MX}/pagesC.tsx`);
    assert.match(s, /const lastNote = EQ_SOLUTIONS\.find\(\(s\) => s\.id === \(pick !== 'clash' \? pick : lastHeardFix\)\);/);
  });
});

describe('Mixing labs: the accuracy note says what THIS lab measures', () => {
  it('both labs pass their own accuracyDetail; Beginning uses the ABOUT variant (phase 2, D37)', () => {
    // Beginning Mixing's meters read its own rendered mixes, so its chip is the
    // ABOUT variant (only its own note); Advanced keeps the full chip.
    assert.match(code(`${MX}/BeginningMixingLabScreen.tsx`), /accuracyDetail=\{BEG_ACCURACY_DETAIL\} accuracyVariant="about" pageDetail=\{pageDetail\} pageCreditKeys=/);
    assert.match(code(`${MX}/AdvancedMixingLabScreen.tsx`), /accuracyDetail=\{ADV_ACCURACY_DETAIL\} pageDetail=\{pageDetail\} pageCreditKeys=/);
  });
});

describe('Mixing labs: a silent first step in WHERE TO START', () => {
  it('Beginning pages 5, 8 and 10 open with something a sound-off learner can do and see', async () => {
    const { beginningMixingPageGuide } = await import(`../${MX}/beginningMixingScreenGuides.ts`);
    const start = (i: number) => (beginningMixingPageGuide(i) as { intro: { start: string } }).intro.start;
    assert.match(start(4), /^Pick an anchor under STEP 2/);
    assert.match(start(7), /^Tap each of the five fixes .* even with sound off/);
    assert.match(start(9), /even with sound off/);
  });
});

// ── Advanced Mixing ──────────────────────────────────────────────────────────

describe('Advanced Mixing page 1: Beginning Mixing counts held marks and banked credit', () => {
  it('the gate reads stored marks + this session’s held marks + banked page keys', () => {
    const s = code(`${MX}/pagesAdvA.tsx`);
    assert.match(s, /setBmlMarks\(withHeldPages\(p, heldPaged\('mixing-beg'\)\)\.completed\)/);
    assert.match(s, /const banked = useLabKeysDone\(BML_PAGE_KEYS\);/);
    assert.match(s, /if \(completed\.includes\(i\) \|\| banked\.has\(BML_PAGE_KEYS\[i\]\)\) n\+\+;/);
    assert.match(s, /const BML_PAGE_KEYS = Array\.from\(\{ length: BML_PAGE_COUNT \}, \(_, i\) => mixingPageKeyAt\('beg', i\)\);/);
    assert.doesNotMatch(s, /p\.completed\.length >= BML_PAGE_COUNT/, 'the old stored-marks-only test');
  });

  it('a learner who started Beginning Mixing is told some goals are open, not that they never did it', () => {
    assert.match(code(`${MX}/pagesAdvA.tsx`), /some of its pages still have goals open on this device/);
  });
});

describe('Advanced Mixing page 2: a fourth pick says so; the page-20 promise is kept up front', () => {
  it('a fourth tap is refused out loud', () => {
    const s = code(`${MX}/pagesAdvA.tsx`);
    assert.match(s, /if \(!on && priorities\.length >= 3\) \{\s*setOverPick\(true\);\s*return;\s*\}/);
    assert.match(s, /Three is the limit\. Tap one of your three to drop it, then pick the new one\./);
  });

  it('page 2 promises what page 20 does, and page 20 shows the contract before the work', () => {
    assert.doesNotMatch(code(`${MX}/pagesAdvA.tsx`), /the final page will hold you to them/);
    assert.match(code(`${MX}/pagesAdvA.tsx`), /page 20, the final repair, puts them in front of you before you start it\./);
    const d = code(`${MX}/pagesAdvD.tsx`);
    const card = d.indexOf('YOUR PAGE-2 CONTRACT');
    assert.ok(card > 0 && card < d.indexOf('STEP 1 — DIAGNOSE THE HANDOFF'), 'the contract sits above step 1');
  });
});

// ── Pre- and Post-Production ─────────────────────────────────────────────────

describe('Post-Production stage 7: a measured true peak above 0 dBTP is never silent', async () => {
  const { resolveStage } = await import('../src/features/production/schema.ts');
  const { evaluateStage } = await import('../src/features/production/rules.ts');
  const { newProject } = await import('../src/features/production/projectStore.ts');
  const { POSTPROD_STAGES } = await import('../src/features/production/postprod/index.ts');
  const st = resolveStage(POSTPROD_STAGES.find((s: { stageId: string }) => s.stageId === 'finish')!, 'podcast');
  const fire = (values: Record<string, unknown>) =>
    evaluateStage(st, { ...newProject('postprod', 'podcast', 'T'), values: values as never }).map((f: { ruleId: string }) => f.ruleId);

  it('+0.4 dBTP with no ceiling in the brief raises a finding (it raised none)', () => {
    assert.ok(fire({ 'finish.measured_true_peak': 0.4 }).includes('finish-true-peak-over-zero-no-ceiling'));
  });
  it('below 0 dBTP, or with a ceiling recorded, it stays quiet (the ceiling rule judges then)', () => {
    assert.ok(!fire({ 'finish.measured_true_peak': -1.2 }).includes('finish-true-peak-over-zero-no-ceiling'));
    const withCeiling = fire({ 'finish.measured_true_peak': 0.4, 'brief.true_peak_max': -1 });
    assert.ok(!withCeiling.includes('finish-true-peak-over-zero-no-ceiling'));
    assert.ok(withCeiling.includes('finish-true-peak-over'));
  });
});

describe('Post-Production exercise 1: "One named person" agrees with the committee finding', async () => {
  const { checkActivity, seedActivityProject } = await import('../src/features/production/activities.ts');
  const { POSTPROD_STAGES } = await import('../src/features/production/postprod/index.ts');
  const a = POSTPROD_STAGES.find((s: { activity?: { activityId: string } }) => s.activity?.activityId === 'clarify-the-handoff')!.activity!;
  const ticked = (who: string) => {
    const p = seedActivityProject('postprod', 'podcast', a);
    p.values['brief.approval_authority'] = who;
    return !checkActivity('clarify-the-handoff', p).unmet.some((c: { id: string }) => c.id === 'approver-named');
  };
  it('one name ticks (G4’s typed approver would have ticked: the miss was the preview wipe)', () => {
    assert.equal(ticked('Alex Rivera'), true);
  });
  it('two names or a group do not (the finding already called "Sam and Jo" a committee)', () => {
    assert.equal(ticked('Sam and Jo'), false);
    assert.equal(ticked('The label'), false);
  });
});

describe('Production counters and messages', async () => {
  const { decisionsMadeText } = await import('../src/features/production/packet.ts');

  it('"1 required decision made" is singular', () => {
    assert.equal(decisionsMadeText(1), '1 required decision made');
    assert.equal(decisionsMadeText(0), '0 required decisions made');
    assert.equal(decisionsMadeText(3), '3 required decisions made');
    const stage = code(`${PR}/ProductionStageScreen.tsx`);
    assert.match(stage, /required decision\$\{report\.answeredRequired === 1 \? '' : 's'\} made/);
    assert.doesNotMatch(read(`${PR}/ReadinessMeter.tsx`), /required decisions made/);
  });

  it('the save-failure message no longer guesses "free up some space"', () => {
    const stage = code(`${PR}/ProductionStageScreen.tsx`);
    assert.doesNotMatch(stage, /free up/i);
    assert.match(stage, /if it keeps happening, close the app and open it again/);
  });

  it('a new project reads in neutral grey until the first answer', () => {
    const m = code(`${PR}/ReadinessMeter.tsx`);
    assert.match(m, /const untouched = report\.blockers\.length === 0 && report\.stages\.every\(\(s\) => s\.answeredAll === 0\);/);
    assert.match(m, /const verdictTint = unreadable \|\| untouched\s*\? colors\.textMuted/);
  });

  it('exercises are numbered in the list shown, with their stage named', () => {
    const h = code(`${PR}/ProductionLabScreen.tsx`);
    assert.match(h, /<Text style=\{styles\.exerciseNum\}>\{i \+ 1\}<\/Text>/);
    assert.match(h, /\{` · stage \$\{s\.num\}`\}/);
  });

  it('a stage row says decided, so "0 required" no longer reads as "nothing required"', () => {
    assert.match(code(`${PR}/ReadinessMeter.tsx`), /required decided · \$\{stage\.answeredAll\} answered/);
  });
});

// ══ PHASE 2 (2026-11-14): the shared mechanisms filled in for F4's labs ═════

describe('Phase 2 · Mixing labs: the silent path (every listening goal can be met with sound off)', () => {
  it('a ▶ refused because sound is off records the version as LOOKED AT, and the goals read it', () => {
    const k = code(`${MX}/kit.tsx`);
    assert.match(k, /if \(!\(await requestAudioOutput\(\)\)\) \{[\s\S]{0,400}if \(aliveRef\.current && !isAudioOutputEnabled\(\)\) setStudied\(\(s\) => \(s\.includes\(id\) \? s : \[\.\.\.s, id\]\)\);/);
    assert.match(k, /const heard = useMemo\(\(\) => \(studied\.length \? \[\.\.\.new Set\(\[\.\.\.heardBySound, \.\.\.studied\]\)\] : heardBySound\), \[heardBySound, studied\]\);/);
    assert.match(k, /return \{ status, play, stop, active, pending, measured, heard, studied, failed \};/);
    assert.match(k, /setHeard\(\[\]\);\s*setStudied\(\[\]\);/, 'a new variant set clears both, as before');
  });
  it('every ▶ row says so while sound is off, and names what was looked at', () => {
    const k = code(`${MX}/kit.tsx`);
    assert.match(k, /<SoundOffLine text=\{MIX_SOUND_OFF_LINE\} \/>/);
    assert.match(k, /Looked at \(\$\{NOT_HEARD\}\): \$\{lookedHere\.join\(' · '\)\}\./);
  });
});

describe('Phase 2 · Mixing labs: each unfinished row names its own goals', () => {
  const strip = (s: string) => s.toLowerCase().replace(/[^a-z ]/g, ' ').replace(/\s+/g, ' ');
  it('Beginning: 16 lines, one per page, each naming that page’s goal chips', () => {
    const src = code(`${MX}/BeginningMixingLabScreen.tsx`);
    assert.match(src, /pageDetail=\{pageDetail\}/);
    const lines = [...src.matchAll(/^  '(Goals?: [^']+)',$/gm)].map((m) => m[1]);
    assert.equal(lines.length, 16);
    assert.equal(new Set(lines).size, 16, 'no shared line');
    for (const l of lines) assert.doesNotMatch(l, /NEXT moves on/, 'the shared rule is said once, not per row');
    assert.match(strip(lines[3]), /vote blind/);
    assert.match(strip(code(`${MX}/pagesA.tsx`)), /vote a vs b blind/);
    assert.match(strip(lines[14]), /inspect the bounce/);
  });
  it('Advanced: 20 lines, one per page', () => {
    const src = code(`${MX}/AdvancedMixingLabScreen.tsx`);
    assert.match(src, /pageDetail=\{pageDetail\}/);
    const lines = [...src.matchAll(/^  '(Goals?: [^']+)',$/gm)].map((m) => m[1]);
    assert.equal(lines.length, 20);
    assert.equal(new Set(lines).size, 20);
  });
  it('the end guides’ WHERE TO START no longer depends on the learner’s state', async () => {
    const want = /^Read WHERE TO START at the top: it names the next thing to do from where you are\./;
    const B = await import(`../${MX}/beginningMixingScreenGuides.ts`);
    const A = await import(`../${MX}/advancedMixingScreenGuides.ts`);
    const M = await import(`../${MA}/masteringScreenGuides.ts`);
    const G = await import('../src/screens/lab/mixingGuides/mixingGuidesScreenGuides.ts');
    for (const g of [B.BEGINNING_MIXING_END_GUIDE, A.ADVANCED_MIXING_END_GUIDE, M.MASTERING_END_GUIDE, G.MIXING_GUIDES_END_GUIDE]) assert.match(g.intro.start, want);
  });
});

describe('Phase 2 · Mastering practice cards: a reason per wrong option, the answer after a second miss', async () => {
  const W = await import(`../${MA}/masteringWhy.ts`);
  const C = await import(`../${MA}/masteringContent.ts`);
  const ALL = C.ALL_SCENARIOS as readonly { id: string; options: readonly string[]; correct: string; explain: string }[];

  it('every wrong option of every card has its own reason, and only wrong options do', () => {
    assert.ok(ALL.length >= 43);
    for (const s of ALL) {
      const why = W.SCENARIO_WHY[s.id];
      assert.ok(why, `${s.id} has reasons`);
      for (const o of s.options) {
        if (o === s.correct) assert.equal(why[o], undefined, `${s.id}: no reason on the right option`);
        else assert.ok(why[o], `${s.id}: "${o}" has a reason`);
      }
      for (const key of Object.keys(why)) assert.ok(s.options.includes(key), `${s.id}: "${key}" is a real option`);
    }
  });

  it('S2’s rules: one line, at most 30 words, never quoting the right option; no identical lines inside a card', () => {
    for (const s of ALL) {
      const lines = Object.values(W.SCENARIO_WHY[s.id]) as string[];
      assert.equal(new Set(lines).size, lines.length, `${s.id}: each wrong option says something different`);
      for (const l of lines) {
        assert.ok(l.split(/\s+/).length <= 30, `${s.id}: "${l}" is over 30 words`);
        assert.doesNotMatch(l, /\n/);
        assert.ok(!l.toLowerCase().includes(s.correct.toLowerCase()), `${s.id}: a reason quotes the right answer`);
        assert.doesNotMatch(l, /\b(colour|behaviour|centre|programme|analyse|realise)\b/i, 'US spelling');
      }
    }
  });

  it('the card shows the reason on a first miss and adds the explanation on a second', () => {
    const k = code(`${MA}/kit.tsx`);
    assert.match(k, /: wrongLine\(s, picked, wrongPicks\.length\)\}/);
    assert.doesNotMatch(k, /is not the best fit here — it does not address what the situation actually asks for/);
    assert.match(k, /return misses >= 2 \? `✗ NOT QUITE — \$\{why\}\\n\\n\$\{s\.explain\}` : `✗ NOT QUITE — TRY ANOTHER\. \$\{why\}`;/);
  });
});

describe('Phase 2 · Mastering end screen, silent learner and captions', () => {
  it('each unfinished module says how many of ITS decisions are left; the rule is said once', () => {
    const s = code(`${MA}/MasteringLabScreen.tsx`);
    assert.match(s, /detail: endDetail\(x\.id, endState\)/);
    assert.match(s, /howItCounts="A module counts once each of its PRACTICE decisions has an answer/);
    assert.match(s, /\$\{left\} decision\$\{left === 1 \? '' : 's'\} still to answer on its PRACTICE step\./);
  });
  it('the three LISTEN steps carry their own sound-off line through MasteringRack', () => {
    assert.match(code(`${MA}/MasteringRack.tsx`), /soundOffLine: spec\.soundOffLine,\s*captionsId: spec\.captionsId,/);
    for (const f of ['mod1What', 'mod5Workflow', 'mod6Loudness']) assert.match(code(`${MA}/modules/${f}.tsx`), /soundOffLine: 'Sound off\? /, f);
  });
  it('coded readouts carry a plain caption of at most 14 characters', () => {
    const files = ['kit.tsx', 'modules/mod3Room.tsx', 'modules/mod4Tools.tsx', 'modules/mod6Loudness.tsx', 'modules/mod8Project.tsx'];
    const caps = files.flatMap((f) => [...code(`${MA}/${f}`).matchAll(/caption: '([^']+)'/g)].map((m) => m[1]));
    assert.ok(caps.length >= 15, `${caps.length} captions`);
    for (const c of caps) assert.ok(c.length <= 14, `"${c}" is over 14 characters`);
  });
});

describe('Phase 2 · Mixing Guides end screen: the rule said once', () => {
  it('howItCounts carries the read rule; no row repeats it', () => {
    const s = code('src/screens/lab/mixingGuides/MixingGuideScreen.tsx');
    assert.match(s, /howItCounts="A guide counts as read when you leave it with NEXT › or FINISH ›, or tap MARK AS READ at its foot\./);
    assert.match(s, /units=\{MIXING_GUIDE_INDEX\.map\(\(g\) => \(\{ id: g\.id, label: g\.title \}\)\)\}/);
  });
});
