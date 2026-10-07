/**
 * Miking Labs — THE LESSON JOURNEY (docs/labs/miking/LESSON_JOURNEY.md),
 * pinned after the owner's 2026-10-04 Pixel feedback ("the user interaction
 * begins too early … the instrument, the sounds, the layout, then finally
 * the miking"):
 *
 *   • page order (owner restructure 2026-10-06): the two FOUNDATIONS first
 *     (MEET IT — where the sound comes from; STARTING SETUPS), Practice last
 *     (no Sources page since the owner ruling of 2026-10-04, no "where it
 *     sits" page since 2026-10-06); the six stages cover every page once;
 *   • NEW path: no page that operates a microphone opens its activity before
 *     MEET IT + STARTING SETUPS are met; the foundation pages operate no mic
 *     (STARTING SETUPS only draws them); navigation itself is never gated;
 *   • the QUICK CHECK (experienced path): 6 items on the foundations only, a
 *     critical safety item, pass = 5 of 6 with every critical item right,
 *     one attempt per run, and it opens the activities;
 *   • skipping never inflates credit: a passed check leaves `done` untouched,
 *     and lesson-complete still needs every page;
 *   • ORIENT asks nothing; HOW IT SOUNDS and THE SETTING are credited by
 *     their own checks; every page from MICROPHONES to ADVANCED carries a
 *     FROM EARLIER item that reaches back to a foundation stage;
 *   • HOW IT SOUNDS is real physics: the Bessel ratios, a centre strike drives
 *     only ring shapes, the two-head pair matches the Drum Tuning engine;
 *     nothing loops;
 *   • the quick-check items follow the item-writing rules.
 */
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { registerHooks } from 'node:module';
import { join } from 'node:path';
import { beforeEach, describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';
import { assertJourneyPages } from './_mikingPages.ts';

const memory = new Map<string, string>();
registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier === '@react-native-async-storage/async-storage') return { url: 'node:test-journey-storage', shortCircuit: true };
    if (specifier.startsWith('.') && !/\.[cm]?[jt]s$/.test(specifier)) {
      for (const ext of ['.ts', '.tsx']) {
        const candidate = new URL(specifier + ext, context.parentURL);
        if (existsSync(fileURLToPath(candidate))) return { url: candidate.href, shortCircuit: true };
      }
    }
    return nextResolve(specifier, context);
  },
  load(url, context, nextLoad) {
    if (url === 'node:test-journey-storage') {
      return {
        format: 'module',
        shortCircuit: true,
        source: `const g = globalThis; export default { getItem: async (k) => (g.__jStore.has(k) ? g.__jStore.get(k) : null), setItem: async (k, v) => { g.__jStore.set(k, v); }, removeItem: async (k) => { g.__jStore.delete(k); } };`,
      };
    }
    return nextLoad(url, context);
  },
});
(globalThis as unknown as { __jStore: Map<string, string> }).__jStore = memory;

const J = await import('../src/screens/lab/miking/engine/journey.ts');
const { PAGE_IDS } = await import('../src/screens/lab/miking/engine/model/types.ts');
const { M01_LESSON } = await import('../src/screens/lab/miking/lessons/m01Kick/lesson.ts');
const credit = await import('../src/screens/lab/miking/engine/progress/credit.ts');
const R = await import('../src/screens/lab/miking/engine/restructure.ts');
const P = await import('../src/screens/lab/miking/engine/progress/mikingProgress.ts');
const preview = await import('../src/features/lab/labPreviewStore.ts');
const carry = await import('../src/features/lab/sessionCarry.ts');
const MB = await import('../src/screens/lab/miking/engine/physics/membrane.ts');
const { coupledModes, MODE_RATIOS } = await import('../src/screens/lab/drumtuning/drumEngine.ts');

type PageId = (typeof PAGE_IDS)[number];
const lesson = M01_LESSON;
const ROOT = process.cwd();
const read = (p: string) => readFileSync(join(ROOT, p), 'utf8').replace(/\r\n/g, '\n');
const strip = (s: string) => s.replace(/\{\/\*[\s\S]*?\*\/\}/g, '').replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
/** Pages whose activity puts a microphone to work. */
const MIC_PAGES: PageId[] = ['microphone', 'placement', 'context', 'twoMic', 'troubleshoot', 'practice'];

describe('the journey order (stages and pages)', () => {
  it('the two foundations come first; the lesson ends at Practice (no Sources page, no "where it sits")', () => {
    assert.deepEqual(PAGE_IDS.slice(0, 2), ['meet', 'setups']);
    assert.deepEqual([...J.FOUNDATION_PAGES], ['meet', 'setups']);
    assert.equal(PAGE_IDS.length, 8);
    for (const gone of ['instrument', 'sound', 'setting']) assert.ok(!(PAGE_IDS as readonly string[]).includes(gone), gone);
    assert.equal(PAGE_IDS[PAGE_IDS.length - 1], 'practice');
    assert.ok(!(PAGE_IDS as readonly string[]).includes('sources'));
  });
  it('the six stages cover every page exactly once, in page order', () => {
    assert.equal(J.STAGES.length, 6);
    const flat = J.STAGES.flatMap((s) => s.pages);
    assert.deepEqual(flat, [...PAGE_IDS]);
    assert.deepEqual(J.STAGES.map((s) => s.id), ['meet', 'setups', 'mics', 'placement', 'advanced', 'practice']);
  });
  it('every page of the lesson exists, in that order, with its title', () => {
    assertJourneyPages(lesson);
  });
});

describe('NEW path: no mic is operated before MEET IT + STARTING SETUPS', () => {
  const none = new Set<PageId>();
  it('with nothing met, every mic page shows the Foundations card in place of its activity', () => {
    for (const p of MIC_PAGES) assert.equal(J.pageGate(p, none, false), 'foundations', p);
  });
  it('one of the two foundations is not enough — either way round', () => {
    const F = J.FOUNDATION_PAGES;
    for (let i = 0; i < F.length; i++) {
      const met = new Set<PageId>(F.filter((_, k) => k !== i));
      for (const p of MIC_PAGES) assert.equal(J.pageGate(p, met, false), 'foundations', `${p} without ${F[i]}`);
      assert.deepEqual(J.foundationsLeft(met), [F[i]]);
    }
  });
  it('both met opens every activity', () => {
    const met = new Set<PageId>(J.FOUNDATION_PAGES);
    for (const p of PAGE_IDS) assert.equal(J.pageGate(p, met, false), 'open', p);
  });
  it('the foundations themselves are never gated', () => {
    for (const p of J.FOUNDATION_PAGES) assert.equal(J.pageGate(p, none, false), 'open', p);
  });
  it('the foundation pages OPERATE no microphone: MEET IT places none; STARTING SETUPS only draws them (no drag, no placement controls)', () => {
    for (const f of ['PInstrument.tsx', 'PSound.tsx', 'PSetting.tsx', 'PSetups.tsx']) {
      const s = strip(read(`src/screens/lab/miking/pages/${f}`));
      assert.doesNotMatch(s, /slots=\{\[['"]A['"]/, `${f} places a mic`);
      assert.doesNotMatch(s, /placementParams\(/, `${f} has placement controls`);
    }
    assert.match(strip(read('src/screens/lab/miking/engine/scene/SetupStage.tsx')), /interactive=\{false\}/);
  });
  it('the host gates the ACTIVITY, never navigation: NEXT/CONTENTS keep working, the card replaces the page', () => {
    const host = strip(read('src/screens/lab/miking/MikingLessonScreen.tsx'));
    assert.match(host, /const gated = pageGate\(page, met, quickPassed\) === 'foundations';/);
    assert.match(host, /const Page = gated \? FoundationsPage : PAGE_COMPONENTS\[page\];/);
    // useLabNav gets the same units and go() whatever the gate says.
    assert.match(host, /useLabNav\(\{\s*units,\s*index: pageIdx,/);
    assert.doesNotMatch(host, /disabled=\{[^}]*gated/);
    const card = read('src/screens/lab/miking/engine/journeyKit.tsx');
    assert.match(card, /NEXT and CONTENTS still go anywhere/);
    assert.doesNotMatch(card, /\blocked\b/i, 'the card says what a page needs, never "locked"');
  });
  it('"met" counts what happened on screen too (a guest or preview is judged by what they did)', () => {
    const host = strip(read('src/screens/lab/miking/MikingLessonScreen.tsx'));
    assert.match(host, /const credited = useMemo\(\(\) => creditedPages\(lp\.done\), \[lp\.done\]\);/);
    assert.match(host, /const met = useMemo\(\(\) => new Set<PageId>\(\[\.\.\.credited, \.\.\.metLocal\]\)/);
    assert.match(host, /if \(complete\) markMet\(page\);/);
  });
});

describe('the EXPERIENCED path: an honest quick check', () => {
  // The check the learner meets (a retired item replaced: engine/restructure.ts).
  const items = R.quickCheckOf(lesson);
  const allRight = Object.fromEntries(items.map((i) => [i.id, i.correct]));
  const wrongOf = (id: string) => items.find((i) => i.id === id)!.options.find((o) => o !== items.find((i) => i.id === id)!.correct)!;
  it('validates: 6 items, foundations only, every foundation covered, a critical item, a why for every wrong option', () => {
    assert.deepEqual(J.validateQuickCheck(items), []);
    assert.equal(items.length, J.QUICK_CHECK_SIZE);
    for (const it of items) assert.ok(J.isFoundation(J.journeyPageOf(it.covers)), it.id);
    assert.ok(items.some((i) => i.critical), 'a safety item');
  });
  it('the critical item is the hearing item (max SPL is not a hearing limit)', () => {
    const c = items.filter((i) => i.critical);
    assert.equal(c.length, 1);
    assert.match(c[0].explain, /85 dBA/);
  });
  it('pass = at least 5 of 6 on the first pick, with every critical item right', () => {
    assert.equal(J.gradeQuickCheck(items, allRight).pass, true);
    const nonCrit = items.find((i) => !i.critical)!;
    const crit = items.find((i) => i.critical)!;
    assert.equal(J.gradeQuickCheck(items, { ...allRight, [nonCrit.id]: wrongOf(nonCrit.id) }).pass, true, '5 of 6, safety right');
    assert.equal(J.gradeQuickCheck(items, { ...allRight, [crit.id]: wrongOf(crit.id) }).pass, false, '5 of 6, safety wrong');
    const two = items.filter((i) => !i.critical).slice(0, 2);
    assert.equal(J.gradeQuickCheck(items, { ...allRight, [two[0].id]: wrongOf(two[0].id), [two[1].id]: wrongOf(two[1].id) }).pass, false, '4 of 6');
    const partial = { ...allRight };
    delete partial[items[0].id];
    assert.equal(J.gradeQuickCheck(items, partial).pass, false, 'unanswered never passes');
  });
  it('a miss names the foundation page to look at, in page order', () => {
    const snd = items.filter((i) => J.journeyPageOf(i.covers) === 'meet')[0];
    const set = items.filter((i) => J.journeyPageOf(i.covers) === 'setups' && !i.critical)[0];
    const r = J.gradeQuickCheck(items, { ...allRight, [set.id]: wrongOf(set.id), [snd.id]: wrongOf(snd.id) });
    assert.deepEqual(r.misses, ['meet', 'setups']);
  });
  it('a passed check opens every activity with no foundation met', () => {
    for (const p of MIC_PAGES) assert.equal(J.pageGate(p, new Set(), true), 'open', p);
  });
  it('the quick-check items follow the item-writing rules (same length, real misconceptions, no brand recall)', () => {
    for (const s of items) {
      const others = s.options.filter((o) => o !== s.correct);
      const mean = others.reduce((a, o) => a + o.length, 0) / others.length;
      assert.ok(s.correct.length <= 1.6 * mean, `${s.id}: ${s.correct.length} vs ${mean.toFixed(1)}`);
      for (const o of others) assert.doesNotMatch(o, /\b(always|any|never|every)\b/i, `${s.id}: "${o}"`);
      for (const o of s.options) assert.doesNotMatch(o, /Beta ?\d|e ?902|D112|4055|Shure|Sennheiser|AKG/, `${s.id}: "${o}"`);
      assert.ok(s.options.length >= 3);
    }
    const longest = items.filter((s) => s.options.every((o) => o === s.correct || o.length < s.correct.length)).length;
    assert.ok(longest <= Math.ceil(items.length / 3), `correct is the longest in ${longest} of ${items.length}`);
  });
});

describe('skipping never inflates credit', () => {
  const pass: import('../src/screens/lab/miking/engine/journey.ts').QuickCheckResult = { right: 6, total: 6, pass: true, misses: [] };
  async function fresh() {
    memory.clear();
    preview.endLabPreview();
    carry.__resetSessionCarryForTests();
    P.setMikingSaveBlocked(false);
    P.resetMikingLocal();
    await P.hydrateMiking();
  }
  beforeEach(() => fresh());
  it('withQuickCheck (pure) never touches done, and the first attempt of a run stands', () => {
    const l = { done: ['microphone' as PageId], answers: {}, interactive: [] };
    const a = P.withQuickCheck(l, pass);
    assert.deepEqual(a.done, ['microphone']);
    assert.equal(a.quick?.pass, true);
    const b = P.withQuickCheck(a, { right: 2, total: 6, pass: false, misses: ['meet'] });
    assert.equal(b.quick?.pass, true, 'one attempt per run');
  });
  it('recording a passed check and a path banks no page', async () => {
    assert.equal(await P.recordPath('M01', 'experienced'), true);
    assert.equal(await P.recordQuickCheck('M01', pass), true);
    const lp = P.lessonProgress(P.getMikingProgress(), 'M01');
    assert.deepEqual(lp.done, []);
    assert.equal(lp.path, 'experienced');
    assert.equal(lp.quick?.pass, true);
  });
  it('a practice run clears the check (another try) and keeps the path and every credited page', async () => {
    await P.bankPage('M01', 'placement');
    await P.recordPath('M01', 'experienced');
    await P.recordQuickCheck('M01', pass);
    await P.clearMikingPracticeRun('M01');
    const lp = P.lessonProgress(P.getMikingProgress(), 'M01');
    assert.deepEqual(lp.done, ['placement']);
    assert.equal(lp.path, 'experienced');
    assert.equal(lp.quick, undefined);
  });
  it('a members-only preview records no path and no check', async () => {
    preview.startLabPreview('MikingLesson', 'Miking Labs');
    if (!preview.getLabPreview().active) return; // the store's API differs: covered by mikingProgress.test.ts
    assert.equal(await P.recordQuickCheck('M01', pass), false);
    assert.equal(P.lessonProgress(P.getMikingProgress(), 'M01').quick, undefined);
  });
  it('a damaged path / check on disk is dropped, never trusted', () => {
    const s = P.sanitizeMiking({ lessons: { M01: { done: [], answers: {}, interactive: [], path: 'expert', quick: { right: 9, total: 6, pass: true } } } });
    assert.equal(s.lessons.M01.path, undefined);
    assert.equal(s.lessons.M01.quick, undefined);
  });
  it('lesson complete still needs every page, for both learners', () => {
    const hub = read('src/screens/lab/miking/MikingHubScreen.tsx');
    assert.match(hub, /const all = n === PAGE_IDS\.length;/);
  });
  it('the what’s-left screen says a skipped foundation is still to earn', () => {
    const host = read('src/screens/lab/miking/MikingLessonScreen.tsx');
    assert.match(host, /Skipped with the quick check — open it to earn its credit\./);
  });
});

describe('what each stage asks (cognitive design)', () => {
  it('the ORIENT half of MEET IT (as written) asks nothing', () => {
    const c = lesson.pages.instrument!.credit;
    assert.deepEqual(c.scenarios, []);
    assert.equal(c.interactive, undefined);
  });
  it('MEET IT is credited by its where-the-sound-leaves checks; STARTING SETUPS by its checks and looking at every setup', () => {
    const meet = R.pageOf(lesson, 'meet').credit;
    assert.ok(meet.scenarios.length >= 2);
    assert.equal(credit.banksOnNext(lesson, 'meet'), false);
    const setups = R.pageOf(lesson, 'setups').credit;
    assert.ok(setups.scenarios.length >= 3);
    assert.equal(setups.interactive, 'setupsSeen');
    for (const p of ['meet', 'setups'] as const)
      for (const id of R.pageOf(lesson, p).credit.scenarios) {
        assert.equal(J.journeyPageOf(lesson.scenarios.find((s) => s.id === id)!.page), p, id);
        assert.ok(!R.isRetired(lesson.id, id), `${id} is retired`);
      }
  });
  it('retrieval is spaced: microphone, placement and context each carry a FROM EARLIER check', () => {
    for (const p of ['microphone', 'placement', 'context'] as const) {
      const rec = lesson.pages[p].credit.scenarios.map((id) => lesson.scenarios.find((s) => s.id === id)!).filter((s) => /^FROM EARLIER/.test(s.prompt));
      assert.ok(rec.length >= 1, p);
    }
  });
  it('placement opens with a worked example on its OWN rig (it earns nothing), before the learner places', () => {
    const s = strip(read('src/screens/lab/miking/pages/PPlacement.tsx'));
    const steps = s.slice(s.indexOf('const steps: MikingStep[]'));
    assert.ok(steps.indexOf("key: 'watch'") < steps.indexOf("key: 'place'"));
    assert.match(s, /const ex = useRig\(/);
    assert.match(steps, /rig=\{ex\}[^>]*interactive=\{false\}/);
  });
  it('every foundation stage introduces its ideas before any check (read/explore steps first)', () => {
    for (const f of ['PSound.tsx', 'PSetting.tsx']) {
      const s = strip(read(`src/screens/lab/miking/pages/${f}`));
      const steps = s.slice(s.indexOf('const steps: MikingStep[]'));
      assert.ok(steps.indexOf('<ScenarioList') > steps.lastIndexOf("layout: 'rack'"), `${f}: checks after the explorations`);
    }
  });
});

describe('HOW IT SOUNDS is real physics, never played', () => {
  it('the head shapes are the Bessel-zero ratios the Drum Tuning Lab uses', () => {
    const ours = MB.HEAD_SHAPES.map((s) => s.ratio);
    const theirs = MODE_RATIOS.slice(0, 5).map((m: { ratio: number }) => m.ratio);
    for (let i = 0; i < 5; i++) assert.ok(Math.abs(ours[i] - theirs[i]) < 1e-9, `${i}`);
    assert.deepEqual(MB.HEAD_SHAPES.map((s) => s.label), ['(0,1)', '(1,1)', '(2,1)', '(0,2)', '(3,1)']);
    assert.ok(Math.abs(MB.HEAD_SHAPES[1].ratio - 1.594) < 0.001);
  });
  it('a centre strike drives only the ring-shaped (n = 0) shapes; off-centre drives (1,1) a little', () => {
    for (const s of MB.HEAD_SHAPES) {
      const share = MB.strikeShare(s, 0);
      if (s.n === 0) assert.ok(share > 0.99, s.label);
      else assert.ok(share < 1e-9, s.label);
    }
    const s11 = MB.HEAD_SHAPES.find((s) => s.n === 1)!;
    const twoIn = MB.strikeShare(s11, (2 * 25.4) / (22 * 25.4 / 2));
    assert.ok(Math.abs(twoIn - 0.563) < 0.005, `${twoIn}`); // J1(3.8317 × 2/11) ÷ max J1
  });
  it('still lines sit where the model puts them (ring radii are J_n zero ratios)', () => {
    const s02 = MB.HEAD_SHAPES.find((s) => s.n === 0 && s.s === 2)!;
    assert.ok(Math.abs(MB.stillRings(s02)[0] - 2.4048 / 5.5201) < 1e-9);
    assert.equal(MB.stillDiameters(MB.HEAD_SHAPES.find((s) => s.n === 2)!).length, 2);
    assert.ok(Math.abs(MB.lowestProfile(0) - 1) < 1e-9 && Math.abs(MB.lowestProfile(1)) < 1e-3, 'the outline is still at the hoop');
  });
  it('the two-head pair agrees with the Drum Tuning engine: TOGETHER is the lower, OPPOSED the higher and the stronger radiator', () => {
    const [lo, hi] = coupledModes(55, 60, 0.3, 5, 3);
    assert.ok(lo.hz < hi.hz);
    assert.ok(lo.vb * lo.vr < 0, 'lower: inward displacements of opposite sign = the heads move the same way in space');
    assert.ok(hi.vb * hi.vr > 0, 'higher: both inward together = the air squeezed');
    assert.ok(hi.radiate > lo.radiate && hi.loss > lo.loss, 'the squeezing pair radiates more and spends its energy sooner');
  });
  it('the strike sequence is user-started and finite: no loop host, a stop on cover, reduced motion steps', () => {
    const s = strip(read('src/screens/lab/miking/pages/PSound.tsx'));
    assert.doesNotMatch(s, /\bwithRepeat\(|\buseFrameCallback\(|\bsetInterval\(|\bAnimated\.loop\(/);
    assert.match(s, /withTiming\(n,/);
    assert.match(s, /useAnimationsAllowed\(\)/);
    assert.match(s, /if \(\(hidden \|\| !focused\) && playing\) stop\(\);/);
    assert.match(s, /cancelAnimation\(reveal\)/);
  });
  it('nothing on the sound page plays audio', () => {
    for (const f of ['pages/PSound.tsx', 'lessons/m01Kick/soundArt.tsx', 'engine/scene/MembraneFace.tsx', 'engine/physics/membrane.ts']) {
      assert.doesNotMatch(read(`src/screens/lab/miking/${f}`), /from '[^']*(features\/audio|startFenced|expo-audio|LabAudioPlayer|useLabAudio|drumtuning\/useDrumPlayback)[^']*'/, f);
    }
  });
});
