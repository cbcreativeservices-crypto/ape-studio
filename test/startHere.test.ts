/**
 * Start Here: Your First Steps in Audio (owner brief 2026-09-29).
 *
 *   "This will always be free, it is not part of the certificates, it is not
 *    in the lab area, it is its own entity entered from the main menu card."
 *
 * Three halves:
 *   1. The CONTENT (imported directly — pure TS): every starter word has a
 *      definition and a glossary target (or a stated gap), every page's words
 *      exist, every check's answer index is real, the quiz is well formed.
 *   2. FREE BY CONSTRUCTION (source guards): no membership gate, no credit, no
 *      lab-catalog entry; every "choose what's next" destination is a real
 *      route, and one the card says is free is not gated.
 *   3. WIRING: the Home card opens it, FINISH opens the end screen with the
 *      next steps on it, and guests are never written to storage.
 */
import { strict as assert } from 'node:assert';
import { readFileSync, readdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';
import {
  MATCH_PROMPTS,
  NEXT_STEPS,
  ORDER_PATH,
  PAGES,
  SECTIONS,
  SORT_MEASURED_OR_HEARD,
  SORT_SOUND_OR_AUDIO,
  STARTER_TERMS,
  STATIONS,
  TERM_GROUPS,
  buildQuiz,
  firstOpenPage,
  sectionDone,
  termById,
} from '../src/features/startHere/startHereContent.ts';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
/** Source with comments stripped and line endings normalised. */
const src = (p: string) =>
  readFileSync(resolve(ROOT, p), 'utf8')
    .replace(/\r\n/g, '\n')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^\s*\/\/.*$/gm, '')
    .replace(/\{\/\*[\s\S]*?\*\/\}/g, '');

const START_FILES = [
  ...readdirSync(resolve(ROOT, 'src/screens/startHere')).map((f) => `src/screens/startHere/${f}`),
  'src/features/startHere/startHereContent.ts',
];

describe('Start Here — starter words', () => {
  it('has the owner’s 24 words in three groups (8 · 10 · 6)', () => {
    assert.equal(STARTER_TERMS.length, 24);
    const count = (g: string) => STARTER_TERMS.filter((t) => t.group === g).length;
    assert.deepEqual(TERM_GROUPS.map((g) => count(g.id)), [8, 10, 6]);
  });

  it('every word has a unique id, a definition and a glossary target (or a stated gap)', () => {
    const ids = new Set<string>();
    for (const t of STARTER_TERMS) {
      assert.ok(!ids.has(t.id), `duplicate id ${t.id}`);
      ids.add(t.id);
      assert.ok(t.def.trim().length > 15, `${t.term}: definition too short`);
      assert.ok(/[.!?]$/.test(t.def.trim()), `${t.term}: definition should be a sentence`);
      if (t.glossary == null) assert.ok((t.glossaryGap ?? '').length > 20, `${t.term}: no glossary target and no stated gap`);
      else assert.ok(t.glossary.trim().length > 0, `${t.term}: empty glossary target`);
    }
  });

  it('includes every word the owner’s plan names', () => {
    const plan = ['Audio', 'Sound', 'Vibration', 'Source', 'Microphone', 'Speaker', 'Frequency', 'Amplitude', 'Waveform', 'Pitch', 'Loudness', 'Decibel (dB)', 'Tone', 'Noise', 'Cable', 'Input', 'Output', 'Recording', 'Playback', 'Medium', 'Listener', 'Audio signal', 'Signal path', 'Meter'];
    const have = new Set(STARTER_TERMS.map((t) => t.term));
    for (const w of plan) assert.ok(have.has(w), `missing starter word: ${w}`);
  });

  it('every word a page or a match prompt names exists', () => {
    for (const p of PAGES) for (const id of p.terms ?? []) assert.ok(termById(id), `${p.id}: unknown word ${id}`);
    for (const m of MATCH_PROMPTS) assert.ok(termById(m.termId), `match: unknown word ${m.termId}`);
  });
});

describe('Start Here — lessons, lab and exercises', () => {
  it('six lessons plus the lab, in the owner’s order, each with pages', () => {
    const lessons = SECTIONS.filter((s) => s.kind === 'lesson' || s.kind === 'review');
    assert.deepEqual(
      lessons.map((s) => s.title),
      ['What Is Sound?', 'From Sound to Audio', 'The Two Basic Parts of Sound', 'What Audio Equipment Does', 'Seeing and Measuring Sound', 'Listen, Review, and Choose What’s Next'],
    );
    const lab = SECTIONS.find((s) => s.kind === 'lab');
    assert.ok(lab, 'the guided lab exists');
    assert.equal(lab!.title, 'Your First Audio Signal');
    // make a sound → capture it → follow the signal → change or measure it → listen and reflect
    assert.equal(lab!.pages.length, 5);
    for (const s of SECTIONS) assert.ok(s.pages.length > 0, `${s.id} has no pages`);
  });

  it('page ids are unique and every page has a lead line', () => {
    const ids = PAGES.map((p) => p.id);
    assert.equal(new Set(ids).size, ids.length);
    for (const p of PAGES) {
      assert.ok(p.lead.length > 10, `${p.id}: no "what you are looking at" line`);
      if (p.rack) assert.ok((p.caption ?? '').length > 10, `${p.id}: a rack page needs a first-move caption`);
    }
  });

  it('every check question marks a real answer', () => {
    for (const p of PAGES) {
      if (!p.check) continue;
      assert.ok(p.check.options.length >= 2, `${p.id}: too few options`);
      assert.ok(p.check.correctIdx >= 0 && p.check.correctIdx < p.check.options.length, `${p.id}: correctIdx out of range`);
      assert.equal(new Set(p.check.options).size, p.check.options.length, `${p.id}: duplicate options`);
    }
  });

  it('exercises are well formed', () => {
    for (const ex of [SORT_SOUND_OR_AUDIO, SORT_MEASURED_OR_HEARD]) {
      assert.ok(ex.items.some((i) => i.bin === 0) && ex.items.some((i) => i.bin === 1), 'both bins used');
      assert.ok(ex.hint.length > 10);
    }
    assert.equal(ORDER_PATH.steps.length, STATIONS.length);
    for (const m of MATCH_PROMPTS) assert.ok(m.targets.length > 0);
  });

  it('the repeated distinction is taught: frequency ↔ pitch, amplitude ↔ loudness, measured ≠ heard', () => {
    const all = PAGES.flatMap((p) => [p.lead, ...p.paras]).join(' ');
    assert.match(all, /frequency[^.]*pitch/i);
    assert.match(all, /amplitude[^.]*loud/i);
    assert.match(all, /not the same|not always exactly the same|related — but not identical/i);
  });

  it('includes a safe-listening reminder', () => {
    const all = PAGES.flatMap((p) => p.paras).join(' ');
    assert.match(all, /damage hearing/i);
  });

  it('section progress: done only when every page is done; jump lands on the first open page', () => {
    const l2 = PAGES.flatMap((p, i) => (p.sectionId === 'l2' ? [i] : []));
    assert.equal(sectionDone('l2', new Set([l2[0]])), false);
    assert.equal(sectionDone('l2', new Set(l2)), true);
    assert.equal(firstOpenPage('l2', new Set([l2[0]])), l2[1]);
    assert.equal(firstOpenPage('l2', new Set(l2)), l2[0]);
  });

  it('the quiz: four different words, one right answer, stable per seed', () => {
    const a = buildQuiz(42, 8);
    const b = buildQuiz(42, 8);
    assert.deepEqual(a, b);
    assert.equal(a.length, 8);
    for (const q of a) {
      assert.equal(q.options.length, 4);
      assert.equal(new Set(q.options).size, 4);
      assert.equal(q.options[q.correctIdx], termById(q.termId)!.term);
    }
    assert.equal(buildQuiz(7, 99, 'level').length, 6);
  });
});

describe('Start Here — free by construction', () => {
  const nav = src('src/navigation/RootNavigator.tsx');

  it('is a plain, ungated route', () => {
    // Lazy since perf decision B (2026-10-04): registered from the plain `Lazy`
    // map, whose loader requires the bare screen — no wrapper of any kind.
    assert.match(nav, /<Stack\.Screen name="StartHere" getComponent=\{Lazy\.StartHere\}/);
    assert.match(nav, /<Stack\.Screen name="StartHereTerms" getComponent=\{Lazy\.StartHereTerms\}/);
    assert.match(nav, /^\s*StartHere: lazyScreen\(\(\) => require\('\.\.\/screens\/startHere\/StartHereScreen'\)\.StartHereScreen\),$/m);
    assert.match(nav, /^\s*StartHereTerms: lazyScreen\(\(\) => require\('\.\.\/screens\/startHere\/StartHereTermsScreen'\)\.StartHereTermsScreen\),$/m);
    assert.doesNotMatch(nav, /StartHere[A-Za-z]*: (withMembershipPreview|MemberGated|lazyScreen\(\(\) => withMembershipPreview)/);
  });

  it('never gates, never credits, never reads membership', () => {
    const banned = /withMembershipPreview|useLabPreview|startLabPreview|markLabUnit|registerLabUnits|labCompletion|navigate\('Paywall'\)|isMember|useToolsLocked|UpgradeSheet/;
    // ONE allowed read (owner 2026-09-29): NextSteps hides its FREE / MEMBERS
    // access tags from members — a label, never a gate.
    // `|| !resolved` (bug pass 2 2026-09-30): no tags before the tier is known.
    // useUpsellAllowed (hunt 4, 2026-10-03): no tags until a read actually
    // produced the tier — a member whose read failed is never tagged.
    const TAG_ONLY = "const a = upsell ? accessTag(s.access) : '';";
    for (const f of START_FILES) {
      let body = src(f);
      if (f.endsWith('NextSteps.tsx')) {
        assert.equal(body.split('useUpsellAllowed()').length - 1, 1, 'NextSteps reads the tier only to hide the access tag');
        assert.ok(body.includes(TAG_ONLY));
        body = body.replace('const upsell = useUpsellAllowed();', '').replace(TAG_ONLY, '');
      }
      assert.doesNotMatch(body, banned, `${f} touches gating or credit`);
    }
  });

  it('is not listed in the labs area', () => {
    assert.doesNotMatch(src('src/screens/lab/labCatalog.ts'), /StartHere/);
  });

  it('every next step is a real route; FREE ones are not gated, members-only ones are', () => {
    const screenNames = new Set([...nav.matchAll(/<Stack\.Screen\s+name="([A-Za-z]+)"/g)].map((m) => m[1]));
    for (const g of NEXT_STEPS) {
      for (const s of g.steps) {
        if (s.to.kind === 'glossary') continue;
        const route = s.to.route;
        assert.ok(screenNames.has(route), `next step "${s.title}" → unknown route ${route}`);
        const line = nav.split('\n').find((l) => l.includes(`name="${route}"`))!;
        if (s.access === 'preview') assert.match(line, /MemberGated\./, `${route} is tagged members-only but is not gated`);
        if (s.access === 'free') assert.doesNotMatch(line, /MemberGated\./, `${route} is tagged FREE but is members-only`);
      }
    }
    assert.ok(NEXT_STEPS.some((g) => g.steps.some((s) => s.to.kind === 'glossary')), 'the Glossary is offered');
  });
});

describe('Start Here — wiring', () => {
  it('has its own Home carousel card, beside Pro Audio Safety, on the owner’s card art', () => {
    const home = src('src/screens/courses/CourseSelectionScreen.tsx');
    assert.match(home, /\{ kind: 'startHere', id: 'startHere' \},\s*\{\s*kind: 'freeTopic' as const,\s*id: 'free-3060'/);
    assert.match(home, /navigate\('StartHere'\)/);
    assert.match(home, /startHere: 'start_here\.webp'/);
  });

  it('every page has a component, and rack pages use the Rack Unit', () => {
    const pages = src('src/screens/startHere/pages.tsx');
    for (const p of PAGES) assert.match(pages, new RegExp(`'?${p.id}'?: [A-Za-z0-9]+,`), `no component for ${p.id}`);
    assert.match(pages, /<RackUnit/);
  });

  it('FINISH opens the what’s-left end screen with the next steps on it; CONTINUE is never held', () => {
    const host = src('src/screens/startHere/StartHereScreen.tsx');
    assert.match(host, /setEnding\(true\)/);
    assert.match(host, /<LabEndScreen[\s\S]*extra=\{<NextSteps/);
    assert.doesNotMatch(host, /disabled=\{last\b|disabled=\{!/);
  });

  it('guests are never written to storage (house guest rule)', () => {
    const host = src('src/screens/startHere/StartHereScreen.tsx');
    assert.match(host, /resolved && entitlement === 'anonymous'/);
    assert.match(host, /if \(!noAccountRef\.current && loadedRef\.current && !loadedAsGuestRef\.current\) void savePagedProgress/);
    // Owner ruling 2026-10-01: a guest's work is HELD for the sign-in hand-off
    // (features/lab/sessionCarry), never written while they are a guest.
    assert.match(host, /if \(noAccountRef\.current\) \{[\s\S]*?if \(!first\) \{[\s\S]*?\}\s*return;\s*\}/, 'guests: nothing restored');
    assert.match(host, /else if \(noAccountRef\.current \|\| loadedAsGuestRef\.current\) holdDeltas\(base, next\);/);
    assert.match(host, /function holdDeltas\([\s\S]*?holdPagedProgress\(START_HERE_ID, \{ done: i \}\)/);
  });

  it('sounds go through the course voice (gate, guard, stop on close) and stop on page change', () => {
    const host = src('src/screens/startHere/StartHereScreen.tsx');
    assert.match(host, /useCourseTone\(/);
    assert.match(host, /tone\.stop\(\); \/\/ each page owns its own sound|tone\.stop\(\);/);
  });
});
