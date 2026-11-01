/**
 * Screen Guide rollout — Speech & Voice Lab (2026-10-31) — receipts.
 * Pattern: test/screenGuide_patchbay_20261031.test.ts and
 * test/screenGuide_envelope_20261031.test.ts (PagedLab labs).
 *
 *   1. every page the learner reaches has a guide — the lab's eleven pages
 *      (p1…p11, one per PageDef, in page order) plus the understanding check
 *      PagedLab appends (`check`) — with all five sections, 1–5 bullets, 2–3
 *      TRY THIS experiments, the house copy rules, and no answer given away;
 *   2. every step fits its no-scroll budget;
 *   3. each guide quotes its page's REAL names (comments stripped; labels the
 *      page builds from data are rebuilt here from the same data);
 *   4. every number TRY THIS quotes is what the page prints, recomputed with
 *      the SAME model functions the pages call (speechModel / speechSignals);
 *   5. wiring + the accuracy-chip decision: a CONCEPT lab (no microphone, no
 *      measurement — typical teaching values the pages call illustrative) →
 *      `accuracy={false}`.
 */
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { registerHooks } from 'node:module';
import { join } from 'node:path';
import { describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';

const ROOT = process.cwd();
const read = (p: string) => readFileSync(join(ROOT, p), 'utf8').replace(/\r\n/g, '\n');
/** Source with comments stripped — a name in a comment proves nothing. */
const code = (p: string) => read(p).replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '').replace(/\{\/\*[\s\S]*?\*\/\}/g, '');

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier.startsWith('.') && !/\.[cm]?[jt]sx?$/.test(specifier)) {
      const candidate = new URL(specifier + '.ts', context.parentURL);
      if (existsSync(fileURLToPath(candidate))) return { url: candidate.href, shortCircuit: true };
    }
    return nextResolve(specifier, context);
  },
});

const SP = 'src/screens/lab/speech';
const { SPEECH_SCREEN_GUIDES, SPEECH_GUIDE_PAGE_TITLES, speechPageGuide } = await import(`../${SP}/speechScreenGuides.ts`);
const { SCREEN_GUIDE_SECTIONS, SCREEN_GUIDE_BUDGET } = await import('../src/features/lab/screenGuide/types.ts');
const M = await import('../src/features/speech/speechModel.ts');
const SIG = await import('../src/features/speech/speechSignals.ts');
const VF = await import(`../${SP}/vocalFoldsGeometry.ts`);

type Guide = Record<string, string[]>;
const GUIDES = SPEECH_SCREEN_GUIDES as unknown as Record<string, Guide>;
const SECTION_KEYS = SCREEN_GUIDE_SECTIONS.map((s: { key: string }) => s.key);
const textOf = (gd: Guide) => SECTION_KEYS.map((k: string) => gd[k].join('\n')).join('\n');
const allGuides = Object.entries(GUIDES);

const SCREEN = `${SP}/SpeechLabScreen.tsx`;
const s = code(SCREEN);
const A = code(`${SP}/speechPagesA.tsx`);
const B = code(`${SP}/speechPagesB.tsx`);
const SRC = [
  s,
  A,
  B,
  code(`${SP}/headSection.tsx`),
  code(`${SP}/speechViz.tsx`),
  code(`${SP}/vowelViz.tsx`),
  code(`${SP}/consonantViz.tsx`),
  code(`${SP}/distanceViz.tsx`),
  code(`${SP}/speechCharts.tsx`),
  code('src/features/speech/speechModel.ts'),
  code('src/features/speech/speechSignals.ts'),
  code('src/screens/lab/kit/PagedLab.tsx'),
  code('src/screens/lab/kit/LabNavBar.tsx'),
  code('src/screens/lab/kit/labNav.ts'),
  code('src/screens/lab/kit/ExpandableFigure.tsx'),
  code('src/screens/lab/tuning/components/check.tsx'),
  code('src/components/LabUnderstandingCheck.tsx'),
].join('\n');
/** Every PageDef title, in page order. */
const PAGE_TITLES = [...s.matchAll(/\{ title: '((?:[^'\\]|\\.)*)', short: '[^']*', Component:/g)].map((m) => m[1]);

describe('1. every Speech page has a complete guide', () => {
  it('one guide per page (p1…p11) plus the appended check — and no other', () => {
    assert.equal(PAGE_TITLES.length, 11);
    const keys = [...PAGE_TITLES.map((_, i) => `p${i + 1}`), 'check'];
    assert.deepEqual(Object.keys(GUIDES), keys);
    assert.deepEqual(Object.keys(SPEECH_GUIDE_PAGE_TITLES), keys);
    PAGE_TITLES.forEach((t, i) => assert.equal(SPEECH_GUIDE_PAGE_TITLES[`p${i + 1}`], t, `p${i + 1} title`));
    // PagedLab appends the check because the lab has authored questions,
    // under exactly this title, as page index 11.
    assert.match(code('src/features/lab/understandingChecks.ts'), /^\s*speech: SPEECH,$/m);
    assert.match(code('src/screens/lab/kit/PagedLab.tsx'), /title: 'Check your understanding',/);
    assert.equal(SPEECH_GUIDE_PAGE_TITLES.check, 'Check your understanding');
    for (let i = 0; i < 11; i++) assert.equal(speechPageGuide(i), GUIDES[`p${i + 1}`]);
    assert.equal(speechPageGuide(11), GUIDES.check);
    assert.equal(speechPageGuide(12), undefined);
  });
  for (const [id, gd] of allGuides) {
    it(`${id}: all five sections, 1–5 bullets each, none empty; TRY THIS is 2–3`, () => {
      assert.deepEqual(Object.keys(gd).sort(), [...SECTION_KEYS].sort());
      for (const k of SECTION_KEYS) {
        assert.ok(Array.isArray(gd[k]) && gd[k].length >= 1, `${id}.${k} is empty`);
        assert.ok(gd[k].length <= 5, `${id}.${k} has ${gd[k].length} bullets (max 5)`);
        for (const line of gd[k]) assert.ok(typeof line === 'string' && line.trim().length > 10, `${id}.${k}: a blank bullet`);
      }
      assert.ok(gd.tryThis.length >= 2 && gd.tryThis.length <= 3, `${id}: TRY THIS is 2–3 experiments`);
    });
  }
  it('house copy rules: knowledge not skills, no "N of total", no build notes, no "recommend", no brands', () => {
    for (const [id, gd] of allGuides) {
      const t = textOf(gd);
      assert.doesNotMatch(t, /\byou(’|')?ll (master|build|mix|be able)|\bmaster(y|ed)?\b|\byou will learn to\b/i, `${id}: claims a skill`);
      assert.doesNotMatch(t, /\b\d+\s+(of|OF)\s+\d+\b|\b\d+\s*\/\s*\d+\b/, `${id}: an "N of total"`);
      assert.doesNotMatch(t, /\brecommend/i, `${id}: "recommend" (house word is "suggest")`);
      assert.doesNotMatch(t, /\b(TODO|FIXME|placeholder|walkthrough|owner 20\d\d|NEW COPY|redraw|art grading|parity pass)\b/i, `${id}: a build note in learner text`);
      assert.doesNotMatch(t, /\b(Neumann|Shure|Sennheiser|Rode|AKG|Audio-Technica|Electro-Voice|SM58|SM7B|U87)\b/i, `${id}: a gear maker/model name`);
    }
  });
  it('the check guides never give an answer away', () => {
    // Every correct option the two check pages (and the two in-page checks) ask for.
    const finals = M.SPEECH_CHECKS.map((c: { options: string[]; correct: number }) => c.options[c.correct]);
    const appended = [...code('src/features/lab/understandingChecks.ts').matchAll(/correct: '((?:[^'\\]|\\.)*)'/g)].map((m) => m[1]);
    const t = textOf(GUIDES.check) + '\n' + textOf(GUIDES.p11);
    for (const answer of [...finals, ...appended]) assert.ok(!t.includes(answer), `a check guide quotes the answer "${answer}"`);
    // the specific give-aways, in other words
    assert.doesNotMatch(t, /proximity effect|presence lift|breaks up the air jet|soft palate, lifting|formants — the mouth|narrow gap|saliva|head turned|pattern rolls off|off-axis/i);
    // p5's in-page check (nasals): the guide never says the nose damps the highs
    assert.doesNotMatch(textOf(GUIDES.p5), /nose[^.]*(damp|absorb|weak)/i);
  });
});

describe('2. every step fits its no-scroll budget', () => {
  it('low ≤ 410, high ≤ 700, one TRY THIS item ≤ 200', () => {
    const over: string[] = [];
    for (const [id, gd] of allGuides) {
      for (const sec of SCREEN_GUIDE_SECTIONS as readonly { key: string; place: string }[]) {
        if (sec.place === 'strip') {
          for (const item of gd.tryThis) if (item.length > SCREEN_GUIDE_BUDGET.tryItem) over.push(`${id}.tryThis (${item.length}): ${item.slice(0, 40)}…`);
          continue;
        }
        const n = gd[sec.key].join(' ').length;
        const cap = sec.place === 'high' ? SCREEN_GUIDE_BUDGET.high : SCREEN_GUIDE_BUDGET.low;
        if (n > cap) over.push(`${id}.${sec.key}: ${n} > ${cap}`);
      }
    }
    assert.deepEqual(over, []);
  });
});

describe('3. each guide quotes its page’s real names', () => {
  const NAMES: Record<string, string[]> = {
    p1: ['HEAD AND NECK', 'SIDE VIEW', 'NOT TO SCALE', 'CHEST', 'FRONT VIEW', 'lungs (1)', 'lips (10)', 'jaw (11)', 'Dark blue-gray is air space', 'red is muscle', 'cream is bone', 'pale blue is cartilage', 'pink is the lining', 'a swallowing flap, not a speech part', '⤢', 'FULL SCREEN', '⏮', '‹ PREV', 'NEXT ›', 'MODULE', '▾'],
    p2: ['‹ PREVIOUS', 'NEXT STAGE ›', '▶ PLAY THE SEQUENCE', '■ STOP', 'What you would see:', 'FULL SCREEN'],
    p3: ['LOOKING DOWN THE LARYNX · FRONT AT TOP', 'epiglottis', 'false fold', 'vocal fold', 'glottis', 'arytenoid', 'WHAT COMES OUT', 'WHAT THE MIC HEARS', 'THE PAIRS · SAME SHAPE, FOLDS OFF / ON', 'pulses → pitch + harmonics', 'SLOW MOTION · ABOUT', 'FULL SCREEN'],
    p4: ['FRONT', 'BACK', 'HIGH', 'LOW', 'F1', 'F2', 'F3', 'nearly closed', 'half open', 'rounded', 'FULL SCREEN'],
    p5: ['blue → red = quiet → loud', 'closure', 'release', 'hiss', 'nasal hum', 'vowel', 'Energy', 'At the microphone', 'UNDERSTANDING CHECK', 'FULL SCREEN'],
    p6: ['NO FILTER', 'WITH A POP FILTER', '● air', ') sound', 'pop filter', 'capsule', 'AT THE CAPSULE', 'full scale', 'the loudest a recorder takes', 'WHY THE MESH WORKS', '100 times faster', 'FULL SCREEN'],
    p7: ['VOWEL · AH', '"S"', 'S LIVES HERE', '0 dB = loudest band', 'WHY IT EXISTS', 'WHY IT GETS WORSE', 'WHAT TO DO', 'FULL SCREEN'],
    p8: ['Direct voice', 'Room (reflections)', 'Plosive air', 'Proximity bass', 'Voice over noise', 'lips', 'UNDERSTANDING CHECK', 'FULL SCREEN'],
    p9: ['Typical adult male', 'Typical adult female', 'Typical child', 'typical, not fixed', 'TYPICAL, NOT FIXED', 'formants F1–F3', 'GOT IT ›', 'FULL SCREEN'],
    p10: ['VS A CLEAN VOICE (GRAY)', 'WAVEFORM', 'CAUSE', 'WHAT YOU HEAR', 'FIX', 'EXCESS', 'HONK', 'LOST', 'not part of the voice at all', 'FULL SCREEN'],
    p11: ['UNDERSTANDING CHECK', 'correct this visit', 'NEXT ›', 'Voiced vs Unvoiced', 'The Distance Effect'],
    check: ['CHECK YOUR UNDERSTANDING', '✓', 'CORRECT', 'NOT QUITE — TRY ANOTHER', 'FINISH · SEE WHAT’S LEFT ›', 'FINISH ›', 'Why Sibilance Exists', 'Speech Problem Simulator'],
  };
  it('a name list for every page', () => {
    assert.deepEqual(Object.keys(NAMES), Object.keys(GUIDES));
  });
  for (const [id, names] of Object.entries(NAMES)) {
    it(`${id}: every pinned name is on the page AND in its guide`, () => {
      const gt = textOf(GUIDES[id]);
      for (const n of names) {
        assert.ok(SRC.includes(n), `${id}: "${n}" is no longer in the lab source — update the guide`);
        assert.ok(gt.includes(n), `${id}: the guide never names "${n}"`);
      }
    });
  }
  it('labels the pages build from data: anatomy buttons, stages, pairs, vowels, families, problems', () => {
    // p1: `${i + 1} · ${a.short.toUpperCase()}`
    assert.match(A, /label=\{`\$\{i \+ 1\} · \$\{a\.short\.toUpperCase\(\)\}`\}/);
    const anat = (id: string) => { const i = M.ANATOMY.findIndex((a: { id: string }) => a.id === id); return `${i + 1} · ${M.ANATOMY[i].short.toUpperCase()}`; };
    assert.equal(M.ANATOMY.length, 11);
    for (const l of [anat('lungs'), anat('jaw'), anat('larynx'), anat('velum'), anat('nasal')]) assert.ok(textOf(GUIDES.p1).includes(l), `p1 names ${l}`);
    assert.deepEqual([anat('lungs'), anat('jaw'), anat('larynx'), anat('velum'), anat('nasal')], ['1 · LUNGS', '11 · JAW', '3 · LARYNX', '5 · SOFT PALATE', '6 · NASAL CAVITY']);
    assert.equal(M.ANATOMY.findIndex((a: { id: string }) => a.id === 'lips') + 1, 10);
    assert.equal(M.ANATOMY.findIndex((a: { id: string }) => a.id === 'tongue') + 1, 8);
    // p2: the strip and the readout use the stage names in capitals
    assert.match(A, /\{s\.name\.toUpperCase\(\)\}/);
    assert.match(A, /\{step \+ 1\} · \{st\.name\.toUpperCase\(\)\}/);
    const stages = M.PRODUCTION.map((st: { name: string }) => st.name.toUpperCase());
    assert.deepEqual(stages, ['BREATH', 'VOCAL FOLDS', 'RESONANCE', 'ARTICULATION', 'SPEECH']);
    for (const st of stages) assert.ok(textOf(GUIDES.p2).includes(st), `p2 names ${st}`);
    assert.ok(textOf(GUIDES.p2).includes(`${stages.indexOf('RESONANCE') + 1} · RESONANCE`));
    // p3: `UNVOICED · ${p.unvoiced}` / `VOICED · ${p.voiced}` and `${q.unvoiced} / ${q.voiced}`
    assert.match(A, /label=\{`UNVOICED · \$\{p\.unvoiced\}`\}/);
    assert.match(A, /label=\{`VOICED · \$\{p\.voiced\}`\}/);
    assert.match(A, /label=\{`\$\{q\.unvoiced\} \/ \$\{q\.voiced\}`\}/);
    assert.equal(M.VOICED_PAIRS.length, 7);
    for (const q of M.VOICED_PAIRS.slice(0, 6)) assert.ok(textOf(GUIDES.p3).includes(`${q.unvoiced} / ${q.voiced}`), `p3 names ${q.unvoiced} / ${q.voiced}`);
    for (const l of ['UNVOICED · S', 'VOICED · Z', 'UNVOICED · F']) assert.ok(textOf(GUIDES.p3).includes(l));
    // the page opens on S / Z
    assert.match(A, /VOICED_PAIRS\.findIndex\(\(q\) => q\.unvoiced === 'S'\)/);
    // p4: `${o.letter} · ${o.sound.split(' ')[0]}`
    assert.match(A, /label=\{`\$\{o\.letter\} · \$\{o\.sound\.split\(' '\)\[0\]\}`\}/);
    const vk = M.VOWELS.map((o: { letter: string; sound: string }) => `${o.letter} · ${o.sound.split(' ')[0]}`);
    assert.deepEqual(vk, ['A · AH', 'E · EH', 'I · EE', 'O · AW', 'U · OO']);
    for (const l of vk) assert.ok(textOf(GUIDES.p4).includes(l), `p4 names ${l}`);
    // p5: o.name.split(' ')[0].toUpperCase(); syllables "PA"…
    assert.match(A, /label=\{o\.name\.split\(' '\)\[0\]\.toUpperCase\(\)\}/);
    const fam = M.CONSONANTS.map((o: { name: string }) => o.name.split(' ')[0].toUpperCase());
    assert.deepEqual(fam, ['PLOSIVES', 'FRICATIVES', 'AFFRICATES', 'NASALS', 'LIQUIDS', 'GLIDES']);
    for (const l of fam) assert.ok(textOf(GUIDES.p5).includes(l), `p5 names ${l}`);
    assert.equal(SIG.consonantSyllable('plosive').text.toUpperCase(), 'PA');
    assert.deepEqual(SIG.consonantSyllable('plosive').segments.map((x: { label: string }) => x.label), ['closure', 'release', 'vowel']);
    assert.deepEqual(SIG.consonantSyllable('affricate').segments.map((x: { label: string }) => x.label), ['closure', 'hiss', 'vowel']);
    assert.deepEqual(SIG.consonantSyllable('nasal').segments.map((x: { label: string }) => x.label), ['nasal hum', 'vowel']);
    assert.equal(SIG.SYLLABLE_MS, 400);
    // p10: o.name.toUpperCase()
    assert.match(B, /label=\{o\.name\.toUpperCase\(\)\}/);
    const probs = M.PROBLEMS.map((o: { name: string }) => o.name.toUpperCase());
    assert.equal(probs.length, 8);
    for (const l of probs) assert.ok(textOf(GUIDES.p10).includes(l), `p10 names ${l}`);
    assert.match(B, /useState<ProblemId>\('sibilance'\)/);
    assert.deepEqual(M.PROBLEMS.filter((p: { visual: string }) => p.visual === 'trace').map((p: { id: string }) => p.id), ['plosives', 'clicks', 'breath']);
  });
});

describe('4. every number TRY THIS quotes is what the page prints', () => {
  it('p2: PLAY steps every 1800 ms ("about two seconds") and stops on SPEECH; RESONANCE lights pharynx, nasal cavity, soft palate; disc 8 → ARTICULATION', () => {
    assert.match(A, /setInterval\(\(\) => setStep\(\(s\) => Math\.min\(last, s \+ 1\)\), 1800\)/);
    assert.match(A, /if \(auto && step >= last\) setAuto\(false\);/);
    assert.match(A, /resonance: \['pharynx', 'nasal', 'velum'\],/);
    assert.match(A, /breath: \['lungs', 'trachea'\],/);
    assert.match(A, /articulation: \['tongue', 'lips', 'teeth', 'jaw', 'palate'\],/);
    assert.match(A, /\{!ctx\.reduceMotion \? <Btn label=\{auto \? '■ STOP' : '▶ PLAY THE SEQUENCE'\}/);
  });
  it('p3: the folds are shown about 100× slower (VF_SLOWDOWN)', () => {
    assert.equal(VF.VF_SLOWDOWN, 100);
    assert.match(code(`${SP}/speechViz.tsx`), /`SLOW MOTION · ABOUT \$\{VF_SLOWDOWN\}× SLOWER`/);
    assert.match(textOf(GUIDES.p3), /SLOW MOTION · ABOUT 100× SLOWER/);
  });
  it('p4: I → A: F1 270 → 730, F2 2290 → 1090; U: F1 300, F2 870, rounded; jaw labels per vowel', () => {
    const v = (id: string) => M.VOWELS.find((o: { id: string }) => o.id === id);
    assert.deepEqual([v('i').f1, v('a').f1, v('i').f2, v('a').f2], [270, 730, 2290, 1090]);
    assert.deepEqual([v('u').f1, v('u').f2, v('u').rounded], [300, 870, true]);
    const t = textOf(GUIDES.p4);
    assert.ok(t.includes('F1 climbs from 270 to 730 Hz and F2 falls from 2290 to 1090 Hz'));
    assert.ok(t.includes('F1 ≈ 300 Hz and F2 ≈ 870 Hz'));
    // the drawing's jaw label: open > 0.6, half open > 0.4, else nearly closed (jawOpen = 1 − height)
    assert.match(code(`${SP}/vowelViz.tsx`), /`jaw \$\{jawOpen > 0\.6 \? 'open' : jawOpen > 0\.4 \? 'half open' : 'nearly closed'\}`/);
    const jaw = (id: string) => { const o = 1 - v(id).height; return o > 0.6 ? 'open' : o > 0.4 ? 'half open' : 'nearly closed'; };
    assert.deepEqual(['i', 'u', 'a', 'o', 'e'].map(jaw), ['nearly closed', 'nearly closed', 'open', 'open', 'half open']);
    // the harmonics sit at 120 Hz steps (FormantChart's default f0)
    assert.match(code(`${SP}/vowelViz.tsx`), /export function FormantChart\(\{ v, f0 = 120,/);
  });
  it('p6: the click is at 20 ms; with NO FILTER the swing reaches full scale; the filter leaves the click', () => {
    assert.equal(SIG.PLOSIVE_BURST_MS, 20);
    assert.equal(SIG.PLOSIVE_DUR_MS, 200);
    const bare = M.plosiveTrace(false), filt = M.plosiveTrace(true);
    const peak = (x: Float64Array, t0: number, t1: number) => { let m = 0; for (let i = Math.round(t0 * 16); i < Math.round(t1 * 16); i++) m = Math.max(m, Math.abs(x[i])); return m; };
    assert.equal(peak(bare, 0, 200), 1, 'the bare swing touches the dashed full-scale line');
    assert.ok(peak(filt, 45, 75) < 0.2, 'with the filter the swing (before the vowel) is all but gone');
    assert.ok(peak(bare, 45, 75) > 0.8);
    for (let i = 320; i < 360; i++) assert.equal(bare[i], filt[i], 'the click at 20 ms is sample-for-sample the same');
    assert.equal(peak(bare, 0, 19), 0, 'silence before the lips part');
  });
  it('p7: the page opens on "S"; the S peaks inside 4–10 kHz; the vowel is off the −48 dB scale above 4 kHz', () => {
    assert.match(B, /useState<'vowel' \| 's'>\('s'\)/);
    assert.match(B, /band=\{\[4000, 10000\]\}/);
    const { s: sib, ah } = M.sibilanceSpectra();
    let pk = -Infinity, pkHz = 0;
    for (let i = 0; i < sib.hz.length; i++) if (sib.db[i] > pk) { pk = sib.db[i]; pkHz = sib.hz[i]; }
    assert.ok(pkHz > 4000 && pkHz < 10000, `S peak at ${pkHz}`);
    for (let i = 0; i < ah.hz.length; i++) if (ah.hz[i] >= 4000) assert.ok(ah.db[i] < -48, `AH ${ah.hz[i]} Hz is visible`);
    assert.match(code(`${SP}/speechCharts.tsx`), /export const SPECTRUM_FLOOR_DB = -48;/);
    // the axis labels run 100 … 10k (50 Hz is below the first band)
    assert.ok(sib.hz[0] > 50 / 0.95 && sib.hz[sib.hz.length - 1] * 1.05 > 10000);
  });
  it('p8: 12" / 6" / 1" print exactly the numbers the guide quotes', () => {
    assert.deepEqual([...M.DISTANCE_PRESETS], [1, 6, 12]);
    assert.match(B, /useState<number>\(6\)/);
    // the bar label: sign only when positive, toFixed(0); Room is a fixed −14
    assert.match(B, /\{r\.db > 0 \? '\+' : ''\}\{r\.db\.toFixed\(0\)\} dB/);
    const bar = (v: number) => `${v > 0 ? '+' : ''}${v.toFixed(0)} dB`;
    const row = (i: number) => { const d = M.distanceEffect(i); return { direct: bar(d.directDb), room: bar(d.roomDb), plosive: bar(d.plosiveDb), bass: bar(d.proximityDb), snr: bar(d.snrDb) }; };
    assert.deepEqual(row(12), { direct: '0 dB', room: '-14 dB', plosive: '0 dB', bass: '+2 dB', snr: '+36 dB' });
    assert.deepEqual(row(6), { direct: '+6 dB', room: '-14 dB', plosive: '+15 dB', bass: '+4 dB', snr: '+42 dB' });
    assert.deepEqual(row(1), { direct: '+22 dB', room: '-14 dB', plosive: '+54 dB', bass: '+12 dB', snr: '+58 dB' });
    const t = GUIDES.p8.tryThis.join('\n');
    assert.ok(t.includes('Tap 12": Direct voice and Plosive air read 0 dB, Room -14 dB, Proximity bass +2 dB, Voice over noise +36 dB.'));
    assert.ok(t.includes('Tap 6": Direct voice +6 dB, Plosive air +15 dB, Proximity bass +4 dB. Room stays at -14 dB.'));
    assert.ok(t.includes('Tap 1": Direct voice +22 dB, but Plosive air +54 dB and Proximity bass +12 dB. Voice over noise reads +58 dB.'));
    // the ruler's marks
    assert.match(code(`${SP}/distanceViz.tsx`), /\{\[0, 1, 6, 12\]\.map\(\(i\) => \(/);
  });
  it('p9: the row labels and the harmonic spacing; the male row has the most bright ticks, the child’s the fewest', () => {
    const L = M.voiceChartLayout();
    const nums = L.rows.map((r: { nums: { text: string } }) => r.nums.text);
    assert.deepEqual(nums, ['pitch ~120 Hz · formants 270 Hz–3 kHz', 'pitch ~210 Hz · formants 310 Hz–3.3 kHz', 'pitch ~300 Hz · formants 370 Hz–3.7 kHz']);
    assert.ok(textOf(GUIDES.p9).includes('pitch ~120 Hz, ~210 Hz and ~300 Hz; formants 270 Hz–3 kHz, 310 Hz–3.3 kHz and 370 Hz–3.7 kHz'));
    assert.deepEqual(L.ticks.map((t: { label: { text: string } }) => t.label.text), ['100 Hz', '200 Hz', '500 Hz', '1 kHz', '2 kHz', '4 kHz']);
    const bright = M.VOICE_RANGES.map((r: { f0TypicalHz: number; fmLoHz: number; fmHiHz: number }) => {
      let k = 0;
      for (let j = 1; j <= Math.floor(4000 / r.f0TypicalHz); j++) { const f = j * r.f0TypicalHz; if (f >= r.fmLoHz && f <= r.fmHiHz) k++; }
      return k;
    });
    assert.deepEqual(bright, [23, 14, 11]);
    assert.deepEqual(M.VOICE_RANGES.map((r: { f0TypicalHz: number }) => r.f0TypicalHz), [120, 210, 300]);
    assert.match(code(`${SP}/speechViz.tsx`), /opacity=\{f >= r\.fmLoHz && f <= r\.fmHiHz \? 0\.95 : 0\.4\}/);
  });
  it('p10: 250 ms waveforms; four clicks; off-axis sits below the clean voice everywhere with LOST from 3 kHz', () => {
    assert.equal(M.PROBLEM_TRACE_MS, 250);
    assert.equal(M.CLICK_TIMES.length, 4);
    const clean = M.voiceSpectrum(40), off = M.problemSpectrum('offaxis', 40);
    for (let i = 0; i < clean.mag.length; i++) assert.ok(off.mag[i] < clean.mag[i]);
    assert.deepEqual(M.PROBLEMS.find((p: { id: string }) => p.id === 'offaxis').band, { lo: 3000, hi: 12000, kind: 'loss', label: 'LOST' });
    assert.equal(M.PROBLEMS.find((p: { id: string }) => p.id === 'distance').band, undefined);
  });
  it('p11: seven final checks, five right completes the page; the appended check has four questions', () => {
    assert.equal(M.SPEECH_CHECKS.filter((c: { where: string }) => c.where === 'final').length, 7);
    assert.match(B, /const PASS_MARK = 5;/);
    assert.ok(/Seven questions/.test(textOf(GUIDES.p11)) && /Five right completes the page/.test(textOf(GUIDES.p11)));
    const blk = code('src/features/lab/understandingChecks.ts').match(/const SPEECH: readonly Q\[\] = \[([\s\S]*?)\n\];/);
    assert.ok(blk);
    assert.equal([...blk![1].matchAll(/\bid: '/g)].length, 4);
    assert.match(textOf(GUIDES.check), /four questions/);
  });
});

describe('6. review findings 2026-10-31 — each vetted against the code before the guide changed', () => {
  const g = (id: string, k: string) => GUIDES[id][k].join('\n');
  it('p11: only the ANSWERS are shuffled; the questions keep their authored order', () => {
    assert.match(B, /const FINAL_CHECKS = SPEECH_CHECKS\.filter\(\(c\) => c\.where === 'final'\);/);
    assert.match(B, /\{FINAL_CHECKS\.map\(\(c\) => <SpeechCheckCard key=\{c\.id\}/);
    assert.match(A, /const \[shuffled\] = useState\(\(\) => shuffleCheck\(c\)\);/);
    assert.ok(g('p11', 'seeing').includes('the answers come in a fresh order each visit'));
    assert.doesNotMatch(g('p11', 'seeing'), /card, in a fresh order/);
  });
  it('p11: NEXT advances at any time (the page is manualDone, never blocks)', () => {
    assert.match(s, /title: 'Check Yourself', short: 'Check', Component: PageSpeechChecks, manualDone: true/);
    assert.match(code('src/screens/lab/kit/PagedLab.tsx'), /if \(!pagesWithCheck\[from\]\?\.manualDone\) markDone\(\);/);
    assert.ok(g('p11', 'control').includes('NEXT › moves on to the lab’s final check at any time'));
  });
  it('p10 + check: two FIXes start with the talker, so no guide says every first fix is "at the microphone"', () => {
    const fix = (id: string) => M.PROBLEMS.find((p: { id: string }) => p.id === id).fix as string;
    assert.match(fix('clicks'), /^Water before the take/);
    assert.match(fix('breath'), /^Turn the head slightly/);
    assert.ok(g('p10', 'changes').includes('Every FIX starts before any processing'));
    for (const id of ['p10', 'check']) assert.doesNotMatch(textOf(GUIDES[id]), /fix(es)? (starts )?at the microphone/i, id);
  });
  it('p10: the distance floor slopes and pokes above the clean voice at both ends — the guide never calls it flat', () => {
    const clean = M.voiceSpectrum(40), far = M.problemSpectrum('distance', 40);
    const above = Array.from(clean.hz as Float64Array).filter((_, i) => far.mag[i] > clean.mag[i]);
    assert.ok(above.some((f) => f < 60) && above.some((f) => f > 4000), 'floor above the gray voice low and high');
    assert.ok(above.every((f) => f < 60 || f > 4000), 'and only there');
    assert.doesNotMatch(textOf(GUIDES.p10), /flat floor/);
    assert.ok(g('p10', 'tryThis').includes('at the very bottom and top, that floor rises above the gray clean voice'));
  });
  it('p8: Plosive air has its own 12" reference and Proximity bass is an absolute lift (+2 dB at 12")', () => {
    const d12 = M.distanceEffect(12);
    assert.equal(d12.plosiveDb, 0);
    assert.equal(d12.proximityDb.toFixed(0), '2');
    assert.doesNotMatch(g('p8', 'changes'), /Every bar is relative/);
    assert.ok(g('p8', 'changes').includes('Plosive air against the puff at 12"') && g('p8', 'changes').includes('Proximity bass is the lift itself'));
    // the full-screen readout may wrap to two lines
    assert.match(B, /<Text style=\{styles\.readout\} numberOfLines=\{2\}>\n\s*\{inches\}"/);
    assert.doesNotMatch(g('p8', 'control'), /one-line/);
  });
  it('p1: only the tongue (8) is numbered in place, without a leader line', () => {
    const inPlace = M.ANATOMY.filter((a: { x: number; y: number; ax: number; ay: number }) => a.ax === a.x && a.ay === a.y).map((a: { id: string }) => a.id);
    assert.deepEqual(inPlace, ['tongue']);
    assert.match(code(SP + '/headSection.tsx'), /\{!inPlace \? \(/);
    assert.ok(g('p1', 'seeing').includes('ten on leader lines (the tongue, 8, sits in place)'));
  });
  it('p2: "3 · RESONANCE" on the page is the card’s eyebrow (the readout rides only in full screen)', () => {
    assert.match(A, /<Eyebrow>\{step \+ 1\} · \{st\.name\.toUpperCase\(\)\}<\/Eyebrow>/);
    assert.ok(g('p2', 'tryThis').includes('the card reads 3 · RESONANCE'));
  });
  it('p3: the unvoiced label reads mouth noise (true for bursts and hisses); TRY THIS still uses a fricative pair (F / V) for the card’s hiss', () => {
    assert.match(code(SP + '/speechViz.tsx'), /'mouth noise → no pitch'/);
    const fv = M.VOICED_PAIRS.find((q: { unvoiced: string }) => q.unvoiced === 'F');
    assert.equal(fv.place, 'lower lip against the upper teeth');
    assert.ok(M.CONSONANTS.find((c: { id: string }) => c.id === 'fricative').examples.split(' ').includes('F'));
    assert.ok(g('p3', 'tryThis').includes('UNVOICED · F: the card puts the hiss at the ' + fv.place));
    assert.doesNotMatch(g('p3', 'tryThis'), /UNVOICED · P/);
  });
  it('p7: the De-Esser lab is found by its real names (Dynamics → Smart Processors Lab → De-Esser & Sibilance Control)', () => {
    assert.match(code('src/screens/lab/labCatalog.ts'), /name: 'Dynamics',[\s\S]*?\{ name: 'Smart Processors Lab',/);
    assert.match(code('src/screens/lab/deesser/DeEsserLabScreen.tsx'), /title="De-Esser & Sibilance Control"/);
    assert.ok(g('p7', 'teaches').includes('The De-Esser & Sibilance Control lab (Dynamics → Smart Processors Lab)'));
  });
  it('terms defined where the guide uses them: de-esser (p5, p7), presence boost (p7), the capsule’s membrane (p6)', () => {
    assert.match(g('p5', 'teaches'), /de-esser \(a processor that turns down only the hiss\)/);
    assert.match(g('p7', 'teaches'), /de-esser \(a compressor that turns down only the hiss band\)/);
    assert.match(g('p7', 'changes'), /presence boost \(an EQ lift/);
    assert.doesNotMatch(g('p6', 'changes'), /shoves the diaphragm/);
  });
  it('p9: the bright-tick comparison is done in full screen, without demanding an exact count', () => {
    assert.ok(g('p9', 'tryThis').includes('⤢ FULL SCREEN') && /packed tight/.test(g('p9', 'tryThis')));
  });
});

describe('5. wiring + the accuracy-chip decision', () => {
  it('SpeechLabScreen passes pageGuide to PagedLab; PagedLab draws the ⓘ (none on the what’s-left screen)', () => {
    assert.match(s, /import \{ speechPageGuide \} from '\.\/speechScreenGuides';/);
    assert.match(s, /<PagedLab[\s\S]*?pageGuide=\{speechPageGuide\}[\s\S]*?\/>/);
    const PAGED = code('src/screens/lab/kit/PagedLab.tsx');
    assert.match(PAGED, /const guide = ending \? undefined : def\.guide \?\? pageGuide\?\.\(page\);/);
    assert.match(PAGED, /<ScreenGuideHost resetKey=\{ending \? 'end' : String\(page\)\}/);
  });
  it('a CONCEPT lab: accuracy={false}; no microphone, no audio engine, and the pages keep their own "illustrative" labels', () => {
    assert.match(s, /<PagedLab[\s\S]*?accuracy=\{false\}[\s\S]*?\/>/);
    const all = [s, A, B, code(`${SP}/speechViz.tsx`), code(`${SP}/vowelViz.tsx`), code(`${SP}/speechCharts.tsx`), code(`${SP}/distanceViz.tsx`), code(`${SP}/consonantViz.tsx`), code(`${SP}/headSection.tsx`)].join('\n');
    assert.doesNotMatch(all, /AccuracyNote/);
    assert.doesNotMatch(all, /ApeDsp|useMicrophone|getUserMedia|AudioRecorder|startFenced/);
    assert.match(B, /Relative, illustrative values/);
    assert.match(code(`${SP}/speechCharts.tsx`), /0 dB = loudest band · illustrative/);
    assert.match(code(`${SP}/vowelViz.tsx`), /badge="Typical adult-male values · a source–filter model, not a measurement"/);
  });
});
