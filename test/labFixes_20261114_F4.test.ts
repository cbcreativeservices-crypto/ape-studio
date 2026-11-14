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
    assert.match(s, /howItCounts="A guide counts as read when you reach its end and tap MARK AS READ\./);
    assert.match(s, /units=\{MIXING_GUIDE_INDEX\.map\(\(g\) => \(\{ id: g\.id, label: g\.title \}\)\)\}/);
  });
});

// ══ CHECKER C2 (2026-11-14): balanced options, and the one-visit rule ════════

describe('Checker C2 · no right answer stands out by length', () => {
  it('Beginning + Advanced Mixing checks: the right option is at most 1.4× the longest wrong one', () => {
    let n = 0;
    for (const f of ['pagesA', 'pagesB', 'pagesC', 'pagesD', 'pagesAdvA', 'pagesAdvB', 'pagesAdvC', 'pagesAdvD']) {
      const s = read(`${MX}/${f}.tsx`);
      for (const m of s.matchAll(/options=\{\[([\s\S]*?)\]\}\s*correct=\{(\d)\}/g)) {
        n++;
        const opts = [...m[1].matchAll(/'((?:[^'\\]|\\.)*)'/g)].map((x) => x[1]);
        const c = Number(m[2]);
        const other = Math.max(...opts.filter((_, i) => i !== c).map((o) => o.length));
        assert.ok(opts[c].length <= 1.4 * other, `${f}: "${opts[c]}" (${opts[c].length}) vs ${other}`);
      }
    }
    assert.equal(n, 34, 'every check was measured');
  });

  it('Mastering practice cards: the right option is at most 1.3× the longest wrong one', async () => {
    const C = await import(`../${MA}/masteringContent.ts`);
    for (const s of C.ALL_SCENARIOS as readonly { id: string; options: readonly string[]; correct: string }[]) {
      const other = Math.max(...s.options.filter((o) => o !== s.correct).map((o) => o.length));
      assert.ok(s.correct.length <= 1.3 * other, `${s.id}: "${s.correct}" vs ${other}`);
    }
  });

  it('a recorded answer is keyed by card id (true/false), never by option text or index, so rewording an option keeps it', () => {
    const p = code(`${MA}/masteringProgress.ts`);
    assert.match(p, /answers: Record<string, boolean>;/);
    assert.match(code(`${MA}/kit.tsx`), /const picked = pickedHere \?\? \(recorded === true \? s\.correct : null\);/);
  });
});

describe('Checker C2 · HOW A PAGE COUNTS says goals are met in ONE visit', () => {
  it('the mixing labs’ shared line names the one-visit rule', () => {
    assert.match(code(`${MX}/kit.tsx`), /export const HANDS_ON_DETAIL = 'A page counts once all its goals are met in one visit; leaving a page before then clears its marks\. NEXT moves on without counting it\.';/);
    // …which is true: the chips live in a ref that a remount starts empty.
    assert.match(code(`${MX}/kit.tsx`), /const seen = useRef<boolean\[\]>\(goals\.map\(\(\) => ctx\.isDone\)\);/);
  });
});

// ══ PHASE 3 (2026-11-14): the owner's decisions for F4's labs ═══════════════

describe('Phase 3 · decision 1: a Mixing Guide counts only when its work is done', () => {
  const s = code('src/screens/lab/mixingGuides/MixingGuideScreen.tsx');
  it('NEXT › / FINISH no longer mark a guide read; MARK AS READ (at its foot) is the one way', () => {
    assert.doesNotMatch(s, /beforeAdvance:/);
    assert.match(s, /const markRead = useLatchedPress\(\(\) => markGuideRead\(entry\.id\)\);/);
    const foot = s.indexOf('MARK AS READ</Text>');
    const lastSection = s.lastIndexOf('<Section key={s.key}');
    assert.ok(foot > lastSection && lastSection > 0, 'MARK AS READ sits after the last section');
  });
  it('the words say so, and stored reads are untouched (the store keeps every id it has)', async () => {
    assert.match(s, /howItCounts="A guide counts as read when you reach its end and tap MARK AS READ\. Opening it, or moving on with NEXT ›, ‹ PREV or the list, does not count\."/);
    const R = await import('../src/screens/lab/mixingGuides/readRecord.ts');
    assert.deepEqual(R.sanitizeGuidesRead({ v: 1, read: ['pop', 'rock'] }).read, ['pop', 'rock']);
  });
});

describe('Phase 3 · decision 2: no "N of total" progress counters in F4’s labs', () => {
  it('Mixing Guides: the header no longer reads "Mixing guide n of 50"', () => {
    const s = code('src/screens/lab/mixingGuides/MixingGuideScreen.tsx');
    assert.match(s, /subtitle=\{ending \? 'What’s left' : `Mixing guide\$\{isRead \? ' · read' : ''\}`\}/);
    assert.doesNotMatch(s, /\$\{entry\.num\} of/);
  });
  it('Mastering: CONFIRMED, the delivery sheet, the QC card and the key result count what is LEFT', () => {
    const m7 = code(`${MA}/modules/mod7Release.tsx`);
    assert.doesNotMatch(m7, /\$\{done\.size\} \/ \$\{dest\.confirm\.length\}|\$\{done\.size\}\/\$\{dest\.confirm\.length\}/);
    assert.match(m7, /`\$\{dest\.confirm\.length - done\.size\} LEFT`/);
    assert.doesNotMatch(code(`${MA}/stages.tsx`), /\$\{done\} \/ \$\{items\.length\}/);
    const m8 = code(`${MA}/modules/mod8Project.tsx`);
    assert.doesNotMatch(m8, / of \$\{PROJECT_CHECKS\.length\}| of \$\{PROJECT_QC\.length\}/);
    assert.match(m8, /left to check/);
    assert.match(m8, /to look at again/);
  });
  it('Advanced Mixing page 2: "3 more to choose", not "0/3 chosen"', () => {
    const a = code(`${MX}/pagesAdvA.tsx`);
    assert.doesNotMatch(a, /\/3 chosen/);
    assert.match(a, /`\$\{3 - priorities\.length\} more to choose — a priority list longer than three is a wish list\.`/);
  });
});

describe('Phase 3 · decision 5: beginner core first, depth folded, nothing removed', () => {
  it('Advanced Mixing 7, 8, 10, 11, 13: each second lesson (the toolkit) sits under GO DEEPER ▾', () => {
    const b = code(`${MX}/pagesAdvB.tsx`);
    const c = code(`${MX}/pagesAdvC.tsx`);
    // Checker K2: a required check never hides — each fold opens itself once
    // the page's first goal (its experiment) is met, and says why while closed.
    for (const t of ['THE ADVANCED TOOLKIT', 'THE SET-DESIGN TOOLKIT']) assert.match(b, new RegExp(`<GoDeeper title="${t}" openWhen=\\{latched\\[0\\]\\} note="The check below draws on this list`));
    assert.equal((b.match(/<GoDeeper title=[^>]*openWhen=\{latched\[0\]\}/g) ?? []).length, 3);
    for (const t of ['THE TOOLKIT', 'THE MOVES']) assert.match(c, new RegExp(`<GoDeeper title="${t}" openWhen=\\{latched\\[0\\]\\}`));
    assert.equal((c.match(/<GoDeeper title=[^>]*openWhen=\{latched\[0\]\}/g) ?? []).length, 2);
    assert.match(code(`${MX}/kit.tsx`), /useEffect\(\(\) => \{\s*if \(openWhen\) setOpen\(true\);\s*\}, \[openWhen\]\);/);
    // The toolkit goal is still on each page (nothing became optional).
    for (const g of ['Open all four tools', 'Open all five tools', 'Open all four cards', 'Open all four moves']) assert.ok((b + c).includes(`'${g}'`), g);
  });

  it('FOLDED, NOT SPLIT: Advanced still has the same 20 pages in the same order, so a stored record (page indices and per-page credit keys) means what it meant', async () => {
    // An OLD record, as PagedLab stores it (ape:mixing-adv:v1): pages 7, 8, 10, 11, 13 done.
    const old = { completed: [6, 7, 9, 10, 12], lastPage: 12, done: false };
    const titles = ['Before You Begin', 'Advanced Mix Planning', 'Complex Session Management', 'Groups, Subgroups & VCAs', 'Advanced Auxiliary Routing', 'Parallel & Multibus Mixing', 'Advanced EQ & Masking', 'Advanced Dynamics', 'Phase, Polarity & Alignment', 'Advanced Depth & Space', 'Harmonic Processing', 'Stereo Imaging', 'Advanced Automation', 'Mix-Bus Processing', 'Translation & Quality Control', 'Stems & Alternate Mixes', 'Stem Reconstruction', 'Professional Delivery', 'Mix Diagnosis', 'The Final Repair'];
    const now = ['pagesAdvA', 'pagesAdvB', 'pagesAdvC', 'pagesAdvD'].flatMap((f) => [...code(`${MX}/${f}.tsx`).matchAll(/\{ title: '([^']+)', short: '[^']+', Component: \w+/g)].map((m) => m[1]));
    assert.deepEqual(now, titles);
    assert.deepEqual(old.completed.map((i) => now[i]), ['Advanced EQ & Masking', 'Advanced Dynamics', 'Advanced Depth & Space', 'Harmonic Processing', 'Advanced Automation']);
    const { MIXING_ADV_PAGE_IDS } = await import('../src/features/lab/trainingLabKeys.ts');
    assert.equal(MIXING_ADV_PAGE_IDS.length, 20, 'one credit key per page, unchanged');
  });

  it('Mastering module 1 step 3: what to listen for comes first; the mechanics and numbers fold', () => {
    const m = code(`${MA}/modules/mod1What.tsx`);
    const listen = m.indexOf('What to listen for at matched level');
    const deeper = m.indexOf('<GoDeeper title="HOW THIS COMPARISON WORKS">');
    assert.ok(listen > 0 && deeper > listen, 'the beginner core sits above the fold');
    for (const t of ['driven 8 dB into a peak limiter', 'TRUE PK reads over 0 dBTP here on purpose', 'The faceplate on the display', 'Honesty']) {
      assert.ok(m.indexOf(t) > deeper, `${t} is kept, inside the fold`);
    }
    assert.ok(m.indexOf('Before you switch MATCH off') < deeper, 'the volume warning stays in view');
  });

  it('Pre/Post-Production stages: required questions first, the optional ones folded per section', () => {
    const s = code(`${PR}/ProductionStageScreen.tsx`);
    assert.match(s, /const required = section\.fields\.filter\(\(f\) => f\.required\);/);
    assert.match(s, /const rows = \[\.\.\.required, \.\.\.\(moreOpen \? optional : \[\]\)\];/);
    // Checker K2: the learner's own tap wins over the automatic opening.
    assert.match(s, /const autoOpen = optional\.some\(\(f\) => f\.fieldId === focus \|\| touched\(f\.fieldId\)\);\s*const moreOpen = foldChoice\[section\.sectionId\] \?\? autoOpen;/);
    assert.match(s, /onPress=\{\(\) => setFoldChoice\(\(c\) => \(\{ \.\.\.c, \[section\.sectionId\]: !moreOpen \}\)\)\}/);
    assert.match(code(`${PR}/FieldRow.tsx`), /> · required<\/Text>/);
    // Platform-true: the model note says "this device", not "your phone" (web too).
    assert.doesNotMatch(read(`${MA}/modules/shared.tsx`) + read(`${MA}/modules/mod1What.tsx`), /phone.s uncalibrated/);
    assert.match(s, /MORE QUESTION\$\{optional\.length === 1 \? '' : 'S'\} · OPTIONAL · GO DEEPER ▾/);
  });

  it('Pre-Production stage 1: its 17 required questions are what shows first', async () => {
    const { resolveStage, stageFields } = await import('../src/features/production/schema.ts');
    const { STAGE1_DEFINE } = await import('../src/features/production/preprod/stage1.data.ts');
    const f = stageFields(resolveStage(STAGE1_DEFINE, 'music'));
    assert.equal(f.filter((x: { required: boolean }) => x.required).length, 17);
    assert.ok(f.length >= 30);
  });
});

describe('Phase 3 · decision 3: Mastering’s badges become one plain sentence (S3 modelNote)', () => {
  it('every badge a Mastering stage passes has a plain note, and MasteringRack hands it to the rack', async () => {
    const S = await import(`../${MA}/modules/shared.tsx`).catch(() => null);
    const src = code(`${MA}/modules/shared.tsx`);
    assert.match(code(`${MA}/MasteringRack.tsx`), /modelNote: PLAIN_MODEL_NOTE\[spec\.badge\],/);
    const files = ['mod1What', 'mod2Roles', 'mod3Room', 'mod4Tools', 'mod5Workflow', 'mod6Loudness', 'mod7Release', 'mod8Project'];
    const literal = files.flatMap((f) => [...code(`${MA}/modules/${f}.tsx`).matchAll(/badge: '([^']+)'/g)].map((m) => m[1]));
    for (const b of literal) assert.ok(src.includes(`'${b}': '`), `no plain note for "${b}"`);
    for (const k of ['MODEL_BADGE', 'METER_BADGE', 'RENDER_BADGE']) assert.match(src, new RegExp(`\\[${k}\\]: '`));
    const notes = [...src.matchAll(/\]?: '([^']+)',\n/g)].map((m) => m[1]).filter((t) => /^[A-Z][a-z]/.test(t));
    for (const n of notes) assert.ok(n.length <= 90 && !/[A-Z]{4,}/.test(n), `"${n}" is one plain sentence`);
    void S;
  });
});
