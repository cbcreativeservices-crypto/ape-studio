/**
 * Lab fix round 2026-11-14, group S2: the CHECK CARD and the END SCREEN.
 *
 * Owner approval (2026-11-14): "Begin fixing all bugs found and do obvious (my
 * decision is not required) fixes as you suggestted in the report", then the
 * report's suggested order, items 5 (the check card: per-option reasons and
 * FINISH after a pass) and 6 (the end screen recap).
 *
 * Report: docs/labs/novice_audit_2026_11_14/LAB_BEGINNER_AUDIT_REPORT.md,
 * section 3 rows 4 and 5, quick wins 4 and 17, pattern 12.
 * API for phase 2: docs/labs/novice_audit_2026_11_14/fixes/SHARED_API.md (S2).
 */
import { strict as assert } from 'node:assert';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';
import { addMiss, checkFeedback, checkWhyProblems, CHECK_DEFAULT_NUDGE, MISSES_BEFORE_EXPLANATION } from '../src/features/lab/checkFeedback.ts';
import { PRACTICE_LAB_CHECKS } from '../src/features/lab/understandingChecks.ts';
import { LAB_END_CONTENT, labEndContentFor } from '../src/features/lab/labEndContent.ts';
import {
  PAGE_READ_RULE,
  PAGE_TASK_RULE,
  howItCountsHeading,
  nextHeading,
  recapHeading,
  whatsLeft,
  whereToStart,
  type LabEndUnit,
} from '../src/screens/lab/kit/labEnd.ts';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const read = (p: string) => readFileSync(resolve(ROOT, p), 'utf8').replace(/\r\n/g, '\n');
/** Source with comments stripped. */
const code = (p: string) => read(p).replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');

const Q = {
  id: 'q',
  prompt: 'p',
  options: ['RIGHT', 'A', 'B', 'C'],
  correct: 'RIGHT',
  explanation: 'The answer is RIGHT because …',
  why: { A: 'A is what RANGE does.' },
  hint: 'Look at GR between hits.',
};

describe('row 4 · the check card: a reason first, the explanation after a second miss', () => {
  it('nothing picked → no feedback', () => {
    assert.equal(checkFeedback(Q, undefined, [], false), null);
  });
  it('FIRST miss shows that option’s own reason, never the explanation (it names the answer)', () => {
    const f = checkFeedback(Q, 'A', ['A'], false);
    assert.deepEqual(f, { right: false, line: 'A is what RANGE does.' });
  });
  it('an option without its own reason falls back to the question’s hint, then to the shared nudge', () => {
    assert.equal(checkFeedback(Q, 'B', ['B'], false)?.line, Q.hint);
    const noHint = { ...Q, hint: undefined };
    assert.equal(checkFeedback(noHint, 'B', ['B'], false)?.line, CHECK_DEFAULT_NUDGE);
    assert.doesNotMatch(CHECK_DEFAULT_NUDGE, /RIGHT|correct answer is/);
  });
  it('the same wrong option tapped twice is ONE miss; a second, different one opens the explanation', () => {
    assert.deepEqual(addMiss(addMiss([], 'A'), 'A'), ['A']);
    assert.equal(checkFeedback(Q, 'A', addMiss(addMiss([], 'A'), 'A'), false)?.explanation, undefined);
    const two = addMiss(addMiss([], 'A'), 'B');
    assert.equal(two.length, MISSES_BEFORE_EXPLANATION);
    assert.deepEqual(checkFeedback(Q, 'B', two, false), { right: false, line: Q.hint, explanation: Q.explanation });
  });
  it('a RIGHT answer shows CORRECT + the explanation, as before', () => {
    assert.deepEqual(checkFeedback(Q, 'RIGHT', ['A'], true), { right: true, explanation: Q.explanation });
  });
  it('the card renders checkFeedback: the old "explanation on every wrong tap" branch is gone', () => {
    const c = code('src/components/LabUnderstandingCheck.tsx');
    assert.match(c, /const feedback = checkFeedback\(q, chose, misses\[q\.id\] \?\? \[\], got\);/);
    assert.match(c, /setMisses\(\(m\) => \(\{ \.\.\.m, \[q\.id\]: addMiss\(m\[q\.id\], option\) \}\)\);/);
    assert.doesNotMatch(c, /got \|\| wrong \?/);
    assert.match(c, /\{feedback\.right \? 'CORRECT' : 'NOT QUITE — TRY ANOTHER'\}<\/Text>/);
    // nothing new is persisted (labShellCheckEndGuideReset pins the same)
    assert.doesNotMatch(c, /AsyncStorage|createLocalStore/);
  });
  it('the type carries the two optional fields', () => {
    const t = code('src/features/lab/understanding.ts');
    assert.match(t, /why\?: Readonly<Record<string, string>>;/);
    assert.match(t, /hint\?: string;/);
  });
});

describe('row 4 · every authored why / hint obeys the rules (phase 2 ratchet)', () => {
  it('keys are options, never the correct one; ≤ 30 words; never quote the answer', () => {
    const problems: string[] = [];
    for (const [lab, qs] of Object.entries(PRACTICE_LAB_CHECKS)) for (const q of qs) for (const p of checkWhyProblems(q)) problems.push(`${lab}/${p}`);
    assert.deepEqual(problems, []);
  });
  // PHASE 2 (owner approved row 4 "per-option reasons", via the coordinator 2026-11-14): every lab is complete.
  it('phase 2: EVERY question of every practice-lab check gives every wrong option its own reason', () => {
    const missing: string[] = [];
    for (const [lab, qs] of Object.entries(PRACTICE_LAB_CHECKS)) for (const q of qs) for (const o of q.options) if (o !== q.correct && !q.why?.[o]) missing.push(`${lab}/${q.id}: ${o}`);
    assert.deepEqual(missing, []);
  });
  it('phase 2: the right answer is never obviously the longest option (> 1.4× the next) — balanced option lengths', () => {
    const tells: string[] = [];
    for (const [lab, qs] of Object.entries(PRACTICE_LAB_CHECKS)) for (const q of qs) {
      const L = q.options.map((o) => o.length).sort((a, b) => b - a);
      if (q.correct.length === L[0] && q.correct.length > 1.4 * L[1]) tells.push(`${lab}/${q.id}`);
    }
    assert.deepEqual(tells, []);
  });
  it('phase 2: every right answer is still one of its options, and options stay distinct', () => {
    for (const [lab, qs] of Object.entries(PRACTICE_LAB_CHECKS)) for (const q of qs) {
      assert.ok(q.options.includes(q.correct), `${lab}/${q.id}`);
      assert.equal(new Set(q.options).size, q.options.length, `${lab}/${q.id}`);
    }
  });
  it('the two worked examples, Gate and Envelope, give every wrong option its own reason', () => {
    for (const lab of ['gate', 'envelope']) {
      for (const q of PRACTICE_LAB_CHECKS[lab]) {
        const wrong = q.options.filter((o) => o !== q.correct);
        assert.deepEqual(Object.keys(q.why ?? {}).sort(), [...wrong].sort(), `${lab}/${q.id}`);
      }
    }
  });
  it('Gate: no reason gives away the HOLD answer of Q4 word for word (pattern 4 example)', () => {
    const q4 = PRACTICE_LAB_CHECKS.gate.find((q) => q.id === 'hold-meaning')!;
    for (const q of PRACTICE_LAB_CHECKS.gate) for (const line of Object.values(q.why ?? {})) assert.ok(!line.includes(q4.correct), q.id);
  });
  // F7's three plainly wrong check texts (forwarded by the coordinator, 2026-11-14).
  it('Gate Q3’s explanation no longer states Q4’s answer ("keeps the gate open for a minimum time")', () => {
    const q3 = PRACTICE_LAB_CHECKS.gate.find((q) => q.id === 'chatter')!;
    assert.doesNotMatch(q3.explanation, /keeps the gate open for a minimum time/i);
  });
  it('Limiter Q2: a first miss gets a hint without the number; the explanation (with 5 dB) waits for a second miss', () => {
    const q2 = PRACTICE_LAB_CHECKS.limiter.find((q) => q.id === 'gr-math')!;
    assert.ok(q2.hint && !/5 dB/.test(q2.hint));
    const wrong = q2.options.find((o) => o !== q2.correct)!;
    assert.equal(checkFeedback(q2, wrong, [wrong], false)?.explanation, undefined);
    // phase 2: every wrong option now has its own reason, which wins over the hint; neither states the number
    assert.equal(checkFeedback(q2, wrong, [wrong], false)?.line, q2.why?.[wrong] ?? q2.hint);
    assert.doesNotMatch(checkFeedback(q2, wrong, [wrong], false)!.line!, /\b5 dB/);
  });
  it('Chorus: the prompt names the lab’s MIX control, not "100% WET"', () => {
    const q = PRACTICE_LAB_CHECKS.chorus.find((x) => x.id === 'full-wet')!;
    assert.match(q.prompt, /^At MIX 100% \(100% wet\)/);
    assert.match(read('src/screens/lab/fxLabConfigs.tsx'), /label: 'MIX', paramId: P\.modMix/);
  });
});

const U: LabEndUnit[] = [
  { id: '0', label: 'Alpha' },
  { id: '1', label: 'Bravo' },
  { id: '2', label: 'Check your understanding', kind: 'check' },
];

describe('row 5 · a state-aware WHERE TO START', () => {
  it('nothing done → start with the first unit, by name', () => {
    const s = whereToStart(whatsLeft(U, new Set()), { noun: 'page' });
    assert.deepEqual(s, { kind: 'start', text: 'Start with the first page: Alpha. Tap here to open it.', jumpId: '0' });
  });
  it('some done → pick up at the first one still listed', () => {
    const s = whereToStart(whatsLeft(U, new Set(['0'])), { noun: 'page' });
    assert.equal(s?.kind, 'resume');
    assert.equal(s?.jumpId, '1');
    assert.match(s!.text, /^Pick up at Bravo, the first one still listed\./);
  });
  it('only the check left → says so (G6: EQ Lab said "open the first module")', () => {
    const s = whereToStart(whatsLeft(U, new Set(['0', '1'])), { noun: 'page' });
    assert.deepEqual(s, { kind: 'check', text: 'Only the check is left. Tap here to go to it.', jumpId: '2' });
  });
  it('a check-only lab with nothing done → start with the check', () => {
    const s = whereToStart(whatsLeft([U[2]], new Set()), { noun: 'check' });
    assert.equal(s?.text, 'Start with the check. Tap here to go to it.');
  });
  it('everything done → no row to tap (G5c: "tap the first page still listed" with none listed)', () => {
    const w = whatsLeft(U, new Set(['0', '1', '2']));
    assert.equal(whereToStart(w, { noun: 'page' })?.kind, 'done');
    assert.equal(whereToStart(w, { noun: 'page' })?.jumpId, undefined);
    assert.match(whereToStart(w, { noun: 'page', hasNext: true })!.text, /try the lab UP NEXT/);
  });
  it('unreadable progress → no claim at all', () => {
    assert.equal(whereToStart(whatsLeft(U, new Set()), { noun: 'page', unreadable: true }), null);
  });
  it('headings follow the state: WHAT YOU LEARNED only once complete', () => {
    assert.equal(recapHeading(whatsLeft(U, new Set())), 'WHAT THIS LAB COVERS');
    assert.equal(recapHeading(whatsLeft(U, new Set(['0', '1', '2']))), 'WHAT YOU LEARNED');
    assert.equal(nextHeading(whatsLeft(U, new Set())), 'AFTER THIS LAB');
    assert.equal(nextHeading(whatsLeft(U, new Set(['0', '1', '2']))), 'UP NEXT');
    assert.equal(howItCountsHeading('page'), 'HOW A PAGE COUNTS');
  });
  it('no new "N of total" counter in the new words', () => {
    for (const t of [PAGE_READ_RULE, PAGE_TASK_RULE]) assert.doesNotMatch(t, /\d+\s*(of|\/)\s*\d+/);
  });
});

describe('row 5 / quick win 17 · the end screen draws it', () => {
  const E = code('src/screens/lab/kit/LabEndScreen.tsx');
  it('recap (top when complete, under the rows before), WHERE TO START, next-lab card, the shared rule once', () => {
    assert.match(E, /\{w\.complete && !unreadable \? recapBlock : null\}/);
    assert.match(E, /\{!w\.complete \|\| unreadable \? recapBlock : null\}/);
    assert.match(E, /<Text style=\{styles\.sectionHead\}>WHERE TO START<\/Text>/);
    assert.match(E, /\{howItCounts && w\.left\.length > 0 \? \(/);
    assert.match(E, /<Text style=\{styles\.sectionHead\}>\{nextHeading\(w\)\}<\/Text>/);
  });
  it('the next-lab card leaves through the shared one-exit window, after the host’s layer closes', () => {
    assert.match(E, /const openNext = \(\) => \{\n\s*if \(!next \|\| !claimLabLeave\(\)\) return;\n\s*beforeLeave\?\.\(\);\n\s*runSoon\(/);
  });
  it('props win over the labEndContent entry', () => {
    assert.match(E, /const recap = recapProp \?\? content\.recap;/);
    assert.match(E, /const next = nextProp \?\? content\.next;/);
  });
  it('row labels wrap, never cut (G1 Amplitude: its step was cut to "…" at 390)', () => {
    assert.match(E, /<Text style=\{styles\.rowLabel\}>\{r\.label\}<\/Text>/);
    assert.doesNotMatch(E, /styles\.rowLabel\} numberOfLines/);
  });
  it('PagedLab: no shared sentence on every row; the rules go once into howItCounts', () => {
    const P = code('src/screens/lab/kit/PagedLab.tsx');
    assert.doesNotMatch(P, /\{ detail: handsOnDetail \}/);
    // a row's only line is the lab's own pageDetail (its real missing piece)
    assert.match(P, /: \{ id: String\(i\), label: p\.title \},/);
    assert.match(P, /leftPages\.some\(\(p\) => p\.manualDone\) \? handsOnDetail \?\? PAGE_TASK_RULE : null,/);
    assert.match(P, /leftPages\.some\(\(p\) => !p\.manualDone\) \? PAGE_READ_RULE : null,/);
    assert.match(P, /labId=\{labId\}\n\s*howItCounts=\{howItCounts\}/);
  });
  it('Game Audio (F3: one sentence on 19 rows): HANDS_ON reaches only howItCounts; pages 20–22 keep their own pageDetail', () => {
    const P = code('src/screens/lab/kit/PagedLab.tsx');
    // handsOnDetail appears in the props, the destructuring and howItCounts — never in a row
    const rowsBlock = P.slice(P.indexOf('const endUnits: LabEndUnit[]'), P.indexOf('const leftPages'));
    assert.doesNotMatch(rowsBlock, /handsOnDetail/);
    assert.match(rowsBlock, /\.\.\.pageDetailOf\(i\)/);
    assert.match(P, /const d = pageDetail\?\.\(i\);\n\s*return d \? \{ detail: d \} : null;/);
    const GA = code('src/screens/lab/gameaudio/GameAudioLabScreen.tsx');
    assert.match(GA, /handsOnDetail=\{HANDS_ON\} pageDetail=\{pageDetail\}/);
    assert.match(GA, /19: 'Counts once its six checks are done/);
  });
  it('LabCheckEnd and ReviewLabEnd read the content by their id and close their layer before NEXT leaves', () => {
    assert.match(code('src/screens/lab/kit/LabCheckEnd.tsx'), /labId=\{labId\}\n\s*beforeLeave=\{close\}/);
    assert.match(code('src/screens/lab/kit/ReviewLabEnd.tsx'), /labId=\{labKey\}\n\s*beforeLeave=\{close\}/);
  });
  it('text sizes stay ≥ 9 pt (the smallest new style is 11)', () => {
    const sizes = [...E.matchAll(/fontSize: (\d+(?:\.\d+)?)/g)].map((m) => Number(m[1]));
    assert.ok(Math.min(...sizes) >= 9, String(Math.min(...sizes)));
  });
});

describe('row 5 · labEndContent entries obey the rules (phase 2 ratchet)', () => {
  const types = read('src/navigation/types.ts');
  const rootBlock = types.slice(types.indexOf('export type RootStackParamList = {'));
  const routes = new Set([...rootBlock.slice(0, rootBlock.indexOf('\n};')).matchAll(/^\s{2}([A-Za-z0-9_]+)\??:/gm)].map((m) => m[1]));
  const UK = /\b(colour|behaviour|practise|centre|favourite|analyse|organise|programme|labelled|modelling|travelling)\b/i;
  const SKILL = /\byou(?:'ll|’ll| will| can now| now can)\s+(?:master|build|mix|mike|record|design|run|engineer)\b|\byou (?:built|mastered|mixed)\b/i;
  it('the route set was read', () => assert.ok(routes.has('GateLab') && routes.has('HarmonicLab') && routes.size > 50));
  for (const [lab, c] of Object.entries(LAB_END_CONTENT)) {
    it(`${lab}: recap 2–5 lines ≤ 30 words, knowledge not skills, US spelling; next route is real`, () => {
      if (c.recap) {
        assert.ok(c.recap.length >= 2 && c.recap.length <= 5, `${c.recap.length} lines`);
        for (const l of c.recap) {
          assert.ok(l.split(/\s+/).length <= 30, l);
          assert.doesNotMatch(l, SKILL);
          assert.doesNotMatch(l, UK);
        }
      }
      if (c.next) {
        assert.ok(routes.has(c.next.route), `${c.next.route} is not a RootStackParamList route`);
        if (c.next.why) {
          assert.ok(c.next.why.split(/\s+/).length <= 16, c.next.why);
          assert.match(c.next.why, /^[a-z]/);
          assert.doesNotMatch(c.next.why, /\.$/);
          assert.doesNotMatch(c.next.why, UK);
        }
      }
    });
  }
  it('a lab with no entry gets nothing extra', () => {
    assert.deepEqual(labEndContentFor('no-such-lab'), {});
    assert.deepEqual(labEndContentFor(undefined), {});
  });
  it('the worked examples are filled in', () => {
    for (const lab of ['envelope', 'gate', 'stereo']) assert.ok(LAB_END_CONTENT[lab]?.recap?.length && LAB_END_CONTENT[lab]?.next, lab);
  });
});

// F6 via the coordinator (2026-11-14): CONTENTS opened as an in-tree pull-down in every paged lab;
// the owner's standing rule is "popups, never pulldowns". Owner approval for the round: "Begin fixing
// all bugs found and do obvious ... fixes as you suggested in the report".
describe('CONTENTS is a centered popup, never a pull-down', () => {
  const B = code('src/screens/lab/kit/LabNavBar.tsx');
  it('drawn in a DimModal (Low-Light wash), transparent, fade; Android BACK closes it via onRequestClose', () => {
    assert.match(B, /import \{ Modal \} from '\.\.\/\.\.\/\.\.\/components\/DimModal';/);
    assert.match(B, /<Modal\s+visible=\{contentsOpen\}\s+transparent\s+animationType="fade"\s+onRequestClose=\{\(\) => setContentsOpen\(false\)\}/);
    // the focus-aware BackHandler is kept (bug pass 2026-10-01)
    assert.match(B, /if \(navCtx && !navCtx\.isFocused\(\)\) return false;\s*setContentsOpen\(false\);/);
  });
  it('no more in-tree list under the strip', () => {
    assert.doesNotMatch(B, /contentsWrap/);
    assert.doesNotMatch(B, /\{contentsOpen \? <LabContents nav=\{nav\} maxHeight=\{listMax\} \/> : null\}\n\s*<\/View>/);
  });
  it('a centered card at the popup width with a CONTENTS heading and ✕; a tap outside closes it', () => {
    assert.match(B, /contentsBackdrop: \{ flex: 1, backgroundColor: 'rgba\(0,0,0,0\.6\)', justifyContent: 'center'/);
    assert.match(B, /contents: \{\n\s*\.\.\.popupCard,/);
    assert.match(B, /<Pressable accessible=\{false\} style=\{styles\.contentsBackdrop\} onPress=\{close\}>/);
    assert.match(B, /accessibilityLabel="Close the contents"/);
    assert.match(B, /<Text style=\{styles\.contentsCloseText\}>✕<\/Text>/);
  });
  it('every jump still works: rows → nav.jump(i), WHAT\'S LEFT → nav.openEnd, START OVER after the popup closes (useModalHandoff)', () => {
    assert.match(B, /onPress=\{\(\) => nav\.jump\(i\)\}/);
    assert.match(B, /onPress=\{nav\.openEnd\}/);
    assert.match(B, /const handoff = useModalHandoff\(\);/);
    assert.match(B, /nav\.setContentsOpen\(false\);\n\s*if \(run\) handoff\(run\);/);
  });
});

// Coordinator (2026-11-14, F7's list, verified step by step): guided steps that only the ear can do
// carry `needsSound`, drawn with S3's NeedsSoundTag. Owner approval for the round: "Begin fixing all bugs
// found and do obvious ... fixes as you suggested in the report" (report section 3 row 3: "needs sound" tags).
describe('guided steps: a NEEDS SOUND tag on listening-only steps', async () => {
  const { LAB_LESSONS } = await import('../src/features/lab/guidedLessons/content.ts');
  const marked = (lab: string) =>
    ((LAB_LESSONS as Record<string, { steps?: { needsSound?: true }[] }>)[lab].steps ?? []).flatMap((s, i) => (s.needsSound ? [i + 1] : []));
  it('exactly the verified steps are marked', () => {
    assert.deepEqual(marked('eq'), [2, 3, 4]);
    assert.deepEqual(marked('delay'), [6]);
    assert.deepEqual(marked('chorus'), [3, 4]);
    assert.deepEqual(marked('gate'), [6]);
    assert.deepEqual(marked('distortion'), [4]);
    assert.deepEqual(marked('binaural'), [1, 5]);
    assert.deepEqual(marked('fm'), [5]);
    const all = Object.keys(LAB_LESSONS).reduce((n, lab) => n + marked(lab).length, 0);
    assert.equal(all, 11);
  });
  it('the type carries the optional marker and the sheet draws the tag inside the step', () => {
    assert.match(code('src/features/lab/guidedLessons/types.ts'), /needsSound\?: true;/);
    const G = code('src/features/lab/guidedLessons/GuidedLessonSheet.tsx');
    assert.match(G, /import \{ NeedsSoundTag \} from '\.\.\/\.\.\/\.\.\/screens\/lab\/rack\/silentPath';/);
    assert.match(G, /\{st\.do\}\n\s*\{st\.needsSound \? <NeedsSoundTag \/> : null\}/);
  });
});

// F9's shared need 1 (coordinator, 2026-11-14): Mic Selection's end check agrees with the lab's own
// CHECK YOURSELF cards (Lesson 4 lectern, Lesson 9 label vs specs), which F9 rebalanced.
describe('Mic Selection end check matches the lab’s own cards', () => {
  const qs = PRACTICE_LAB_CHECKS.micselect;
  it('lectern: the presence option uses the lab’s own band (Presence rise 3–6 kHz), never "4 kHz"', () => {
    const q = qs.find((x) => x.id === 'lectern-rumble')!;
    assert.ok(q.options.includes('One with a presence rise around 3–6 kHz'));
    assert.match(read('src/screens/lab/micselect/micSelectData.ts'), /name: 'B · Presence rise \(3–6 kHz\)'/);
    assert.doesNotMatch(JSON.stringify(q), /4 kHz/);
    assert.match(q.why!['A perfectly flat response'], /Flat is a choice, not a fix\./);
  });
  it('label vs specs: the right answer no longer carries its reason; the explanation names the specs', () => {
    const q = qs.find((x) => x.id === 'label-vs-spec')!;
    assert.equal(q.correct, 'Yes, if its specs suit the job');
    assert.match(q.explanation, /maximum SPL, pattern and response/);
    const others = q.options.filter((o) => o !== q.correct).map((o) => o.length);
    assert.ok(q.correct.length <= Math.max(...others));
  });
});
