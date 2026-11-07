/**
 * Screen Guide rollout — Sound Envelope & Transients Lab (2026-10-31) —
 * receipts. Pattern: test/screenGuide_patchbay_20261031.test.ts (PagedLab).
 *
 *   1. every page the learner reaches has a guide — the lab's seven pages
 *      (p1…p7, one per PageDef, in page order) plus the understanding check
 *      PagedLab appends (`check`) — with all five sections, 1–5 bullets, 2–3
 *      TRY THIS experiments, the house copy rules, and no answer given away;
 *   2. every step fits its no-scroll budget;
 *   3. each guide quotes its page's REAL names (comments stripped);
 *   4. every number TRY THIS quotes is what the page prints, recomputed with
 *      the SAME functions the page calls (envelopeModel + sliderMaps);
 *   5. wiring + the accuracy-chip decision: a CONCEPT lab (visual only,
 *      every chart badged ILLUSTRATIVE MODEL) → `accuracy={false}`;
 *   6. the what's-left END guide (ENVELOPE_END_GUIDE, PagedLab `endGuide`):
 *      shape, budget, copy rules, and every fact it states pinned against
 *      LabEndScreen / labEnd / PagedLab / this lab's own marking code.
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it } from 'node:test';

const ROOT = process.cwd();
const read = (p: string) => readFileSync(join(ROOT, p), 'utf8').replace(/\r\n/g, '\n');
/** Source with comments stripped — a name in a comment proves nothing. */
const code = (p: string) => read(p).replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '').replace(/\{\/\*[\s\S]*?\*\/\}/g, '');

const ENV = 'src/screens/lab/envelope';
const { ENVELOPE_SCREEN_GUIDES, ENVELOPE_GUIDE_PAGE_TITLES, ENVELOPE_END_GUIDE, envelopePageGuide } = await import(`../${ENV}/envelopeScreenGuides.ts`);
const { SCREEN_GUIDE_SECTIONS, SCREEN_GUIDE_BUDGET } = await import('../src/features/lab/screenGuide/types.ts');
const M = await import('../src/features/envelope/envelopeModel.ts');
const S = await import('../src/features/lab/sliderMaps.ts');

type Guide = Record<string, string[]>;
const GUIDES = ENVELOPE_SCREEN_GUIDES as unknown as Record<string, Guide>;
const SECTION_KEYS = SCREEN_GUIDE_SECTIONS.map((s: { key: string }) => s.key);
const textOf = (gd: Guide) => SECTION_KEYS.map((k: string) => gd[k].join('\n')).join('\n');
const allGuides = Object.entries(GUIDES);

const SCREEN = `${ENV}/EnvelopeLabScreen.tsx`;
const s = code(SCREEN);
const SRC = [
  s,
  code(`${ENV}/EnvelopeChart.tsx`),
  code('src/features/envelope/envelopeModel.ts'),
  code('src/screens/lab/kit/PagedLab.tsx'),
  code('src/screens/lab/kit/LabNavBar.tsx'),
  code('src/screens/lab/kit/labNav.ts'),
  code('src/screens/lab/kit/ExpandableFigure.tsx'),
  code('src/screens/lab/tuning/components/check.tsx'),
  code('src/components/LabUnderstandingCheck.tsx'),
].join('\n');
/** Every PageDef title, in page order. */
const PAGE_TITLES = [...s.matchAll(/\{ title: '((?:[^'\\]|\\.)*)', short: '[^']*', Component:/g)].map((m) => m[1]);

describe('1. every Envelope page has a complete guide', () => {
  it('one guide per page (p1…p7) plus the appended check — and no other', () => {
    assert.equal(PAGE_TITLES.length, 7);
    assert.deepEqual(Object.keys(GUIDES), ['p1', 'p2', 'p3', 'p4', 'p5', 'p6', 'p7', 'check']);
    assert.deepEqual(Object.keys(ENVELOPE_GUIDE_PAGE_TITLES), Object.keys(GUIDES));
    PAGE_TITLES.forEach((t, i) => assert.equal(ENVELOPE_GUIDE_PAGE_TITLES[`p${i + 1}`], t, `p${i + 1} title`));
    // PagedLab appends the check because the lab has authored questions,
    // under exactly this title, as page index 7.
    assert.match(code('src/features/lab/understandingChecks.ts'), /^\s*envelope: ENVELOPE,$/m);
    assert.match(code('src/screens/lab/kit/PagedLab.tsx'), /title: 'Check your understanding',/);
    assert.equal(ENVELOPE_GUIDE_PAGE_TITLES.check, 'Check your understanding');
    for (let i = 0; i < 7; i++) assert.equal(envelopePageGuide(i), GUIDES[`p${i + 1}`]);
    assert.equal(envelopePageGuide(7), GUIDES.check);
    assert.equal(envelopePageGuide(8), undefined);
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
      assert.doesNotMatch(t, /\b(TODO|FIXME|placeholder|walkthrough|owner 20\d\d|NEW COPY|engine build|dev client)\b/i, `${id}: a build note in learner text`);
      assert.doesNotMatch(t, /\b(Steinway|Yamaha|Zildjian|Ludwig|Pearl|Bach|Stradivari|Sabian)\b/, `${id}: a gear maker/model name`);
    }
  });
  it('the check guides never give an answer away', () => {
    const t = textOf(GUIDES.check) + '\n' + textOf(GUIDES.p7);
    for (const answer of ['the level held while energy keeps being supplied', 'The fast-changing onset', 'No true sustain', 'Less than 40 ms', 'The hit sets the peak', 'Two different spans', 'travel through space is propagation', 'release is the source stopping', 'peak level and its average level']) {
      assert.ok(!t.includes(answer), `a check guide quotes the answer "${answer}"`);
    }
    // the check guide never names the 10 % / 90 % points (that is question 2)
    assert.doesNotMatch(textOf(GUIDES.check), /10\s?%|90\s?%/);
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
    p1: ['A', 'D', 'S', 'R', 'ms →', '90%', '10%', 'SWEEP THE SHAPE', 'Attack', 'Decay', 'Release', 'Sustain level', 'Hold (energy still supplied)', 'ATTACK: LINEAR', 'SNAP', 'DECAY: LINEAR', 'NATURAL', 'RESET', 'READOUT', 'THE WORDS', 'FULL SCREEN', '‹ PREV', 'NEXT ›', 'MODULE', '▾'],
    p2: ['Snare drum', 'Kick drum', 'Piano', 'Violin', 'Trumpet', 'Cymbal', 'Speech', 'SWEEP THE SHAPE', 'FULL SCREEN', 'LOAD INTO THE EXPLORER ›', 'The Envelope Explorer', 'ATTACK: SNAP'],
    p3: ['Sharp transient', 'Soft transient', 'No transient', 'THE WORDS · ONSETS', 'WHY TRANSIENTS MATTER', 'SWEEP THE SHAPE', 'FULL SCREEN'],
    p4: ['TYPICAL VALUES — ILLUSTRATIVE, NOT MEASURED', 'Finger snap', 'Pink noise', 'Piano note', 'About', 'FULL SCREEN'],
    p5: ['peak', 'average (RMS)', 'crest factor', 'Percussive (snare)', 'Sustained (trumpet)', 'WORKED EXAMPLE', 'WHY IT MATTERS', 'FULL SCREEN'],
    p6: ['SOUND ENVELOPE · THIS LAB', 'WAVE PROPAGATION · THE WAVE PHYSICS LAB', 'GOT IT ›', 'NEXT ›', 'MODULE', '▾', 'Common Sound Shapes', 'Cymbal'],
    p7: ['UNDERSTANDING CHECK', '✓', 'NEXT ›', 'The Envelope Explorer', 'RESET', 'Peak vs Average Level'],
    check: ['CHECK YOUR UNDERSTANDING', '✓', 'CORRECT', 'NOT QUITE — TRY ANOTHER', 'FINISH · SEE WHAT’S LEFT ›', 'FINISH ›', 'The Envelope Explorer', 'Envelope vs Propagation'],
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
  it('the sounds, onsets and markers the guides list are exactly the page’s', () => {
    assert.deepEqual(M.PRESETS.map((p: { name: string }) => p.name), ['Snare drum', 'Kick drum', 'Piano', 'Violin', 'Trumpet', 'Cymbal']);
    assert.match(s, /<Btn label="Speech"/);
    assert.equal(M.SPEECH_SYLLABLES.length, 7);
    assert.match(GUIDES.p2.seeing.join(' '), /seven syllable envelopes: PRO-FES-SION-AL AU-DI-O/);
    assert.deepEqual(Object.values(M.TRANSIENTS).map((t: { name: string }) => t.name), ['Sharp transient', 'Soft transient', 'No transient']);
    assert.equal(M.DURATION_EXAMPLES.length, 7);
    assert.equal(M.DURATION_EXAMPLES[0].name, 'Finger snap');
    assert.equal(M.DURATION_EXAMPLES[6].name, 'Pink noise');
    assert.deepEqual(M.DURATION_BANDS.map((b: { category: string }) => b.category.toUpperCase()), ['IMPULSE', 'SHORT', 'MEDIUM', 'LONG', 'CONTINUOUS']);
    assert.match(s, /label=\{`\$\{i \+ 1\} · \$\{e\.name\}`\}/); // "1 · Finger snap" buttons
    for (const band of ['IMPULSE', 'SHORT', 'MEDIUM', 'LONG', 'CONTINUOUS']) assert.ok(GUIDES.p4.seeing[0].includes(band), `p4 names ${band}`);
    assert.match(code(SCREEN), /\{b\.category\.toUpperCase\(\)\}/);
    // the axis runs 1 ms … 20 s (logTimePos) — the guide says so
    assert.equal(M.logTimePos(1), 0);
    assert.equal(M.logTimePos(20000), 1);
    assert.match(GUIDES.p4.seeing[0], /from 1 ms to 20 s/);
    // the own-checks page has six questions; the appended check four
    assert.equal((s.match(/^\s{4}q: '/gm) ?? []).length, 6);
    assert.match(GUIDES.p7.seeing[0], /^Six questions/);
    const env = code('src/features/lab/understandingChecks.ts').match(/const ENVELOPE: readonly Q\[\] = \[([\s\S]*?)\n\];/)?.[1] ?? '';
    assert.equal((env.match(/^\s{4}id: '/gm) ?? []).length, 4);
    assert.match(GUIDES.check.seeing[0], /four questions/);
  });
});

describe('4. every number TRY THIS quotes is what the page prints', () => {
  const D = { attackMs: 40, decayMs: 200, sustain: 0.6, releaseMs: 300, holdMs: 500 };
  const fmt = S.fmtEnvMs;
  const preset = (id: string) => M.PRESETS.find((p: { id: string }) => p.id === id);

  it('the page wiring the numbers come from', () => {
    assert.match(s, /const DEFAULT: Adsr = \{ attackMs: 40, decayMs: 200, sustain: 0\.6, releaseMs: 300, holdMs: 500 \};/);
    assert.match(s, /<Text style=\{styles\.read\}>attack \{fmtMs\(adsr\.attackMs\)\} → rise time \(10→90 %\) \{rise\.toFixed\(1\)\} ms · total duration \{fmtMs\(adsrTotalMs\(adsr\)\)\}<\/Text>/);
    assert.match(s, /<ControlSlider label="Attack" value=\{toLog\(adsr\.attackMs\)\} min=\{0\} max=\{3\.3\}/);
    assert.match(s, /<ControlSlider label="Decay" value=\{toLog\(adsr\.decayMs\)\} min=\{0\} max=\{3\.5\}/);
    assert.match(s, /<ControlSlider label="Release" value=\{toLog\(adsr\.releaseMs\)\} min=\{0\} max=\{3\.5\}/);
    assert.match(s, /label="Hold \(energy still supplied\)" value=\{adsr\.holdMs\} min=\{0\} max=\{2000\}/);
    assert.match(s, /const fmtMs = fmtEnvMs;/);
  });
  it('p1: Attack ends 0 ms → rise 0.0, 1995 ms ("2.0 s") → rise 1596.0; RESET 32.0 ms, SNAP 20.5 ms; Decay/Release top ≈ 3 s', () => {
    assert.equal(S.envLogMs(0), 0);
    assert.equal(M.riseTimeMs({ ...D, attackMs: 0 }).toFixed(1), '0.0');
    const top = S.envLogMs(3.3);
    assert.equal(top, 1995);
    assert.equal(fmt(top), '2.0 s');
    assert.equal(M.riseTimeMs({ ...D, attackMs: top }).toFixed(1), '1596.0');
    assert.equal(M.riseTimeMs(D).toFixed(1), '32.0');
    assert.equal(M.riseTimeMs({ ...D, attackShape: 'exponential' }).toFixed(1), '20.5');
    assert.equal(S.envLogMs(3.5), 3162); // "about 3 s"
    const t = GUIDES.p1.tryThis.join('\n');
    assert.match(t, /attack 0 ms → rise time 0\.0 ms/);
    assert.match(t, /attack 2\.0 s → rise time 1596\.0 ms/);
    assert.match(t, /rise time 32\.0 ms\. Tap ATTACK: LINEAR to switch to SNAP: 20\.5 ms/);
    // the three onset words and their thresholds (the READOUT card)
    assert.match(s, /adsr\.attackMs < 15 \? 'A fast attack like this IS a transient/);
    assert.match(s, /: adsr\.attackMs < 120 \? 'A medium attack/);
    assert.match(GUIDES.p1.changes.join(' '), /Under 15 ms the attack reads as a transient; from 120 ms the sound swells in/);
    assert.match(s, /adsr\.sustain === 0 \? 'With zero sustain the sound is percussive: it can only decay\.'/);
  });
  it('p2: snare 122 ms; piano decay 1400 / release 500, no S region; the loaded snare reads 2 ms → 1.0 ms with SNAP', () => {
    assert.equal(M.adsrTotalMs(preset('snare').adsr), 122);
    assert.match(GUIDES.p2.tryThis[0], /over in 122 ms/);
    const piano = preset('piano').adsr;
    assert.equal(piano.decayMs, 1400);
    assert.equal(piano.releaseMs, 500);
    assert.equal(piano.holdMs, 0, 'no flat S region is drawn');
    assert.match(GUIDES.p2.tryThis[1], /decay 1400 ms runs straight into release 500 ms/);
    const snare = preset('snare').adsr;
    assert.equal(fmt(snare.attackMs), '2 ms');
    assert.equal(M.riseTimeMs(snare).toFixed(1), '1.0');
    assert.equal(snare.attackShape, 'exponential'); // → the button reads ATTACK: SNAP
    assert.match(s, /label=\{snap \? 'ATTACK: SNAP' : 'ATTACK: LINEAR'\}/);
    assert.match(GUIDES.p2.tryThis[2], /attack 2 ms → rise time 1\.0 ms, with ATTACK: SNAP/);
    // drums carry no S or R region
    for (const id of ['snare', 'kick']) {
      const a = preset(id).adsr;
      assert.equal(a.holdMs + a.releaseMs, 0, `${id}: no S or R region`);
    }
  });
  it('p3: rise 1.0 / 48.0 / 320.0 ms for attacks 2 / 60 / 400 ms', () => {
    const r = (['sharp', 'soft', 'none'] as const).map((k) => [M.TRANSIENTS[k].adsr.attackMs, M.riseTimeMs(M.TRANSIENTS[k].adsr).toFixed(1)]);
    assert.deepEqual(r, [[2, '1.0'], [60, '48.0'], [400, '320.0']]);
    assert.match(GUIDES.p3.tryThis[0], /rise time 1\.0 ms, then 48\.0 ms, then 320\.0 ms/);
    assert.match(GUIDES.p3.changes[0], /from 2 ms to 60 ms to 400 ms/);
    assert.match(GUIDES.p3.tryThis[1], /400 ms swell/);
  });
  it('p4: "About 12 ms" vs "About 12 s" (×1000, three decades); Piano note "About 2.5 s" in LONG', () => {
    assert.match(s, /About \{fmtMs\(chosen\.ms\)\}/);
    const snap = M.DURATION_EXAMPLES[0], noise = M.DURATION_EXAMPLES[6], piano = M.DURATION_EXAMPLES[4];
    assert.equal(fmt(snap.ms), '12 ms');
    assert.equal(fmt(noise.ms), '12 s');
    assert.equal(noise.ms / snap.ms, 1000);
    assert.equal(piano.name, 'Piano note');
    assert.equal(fmt(piano.ms), '2.5 s');
    assert.equal(piano.category, 'long');
    assert.match(GUIDES.p4.tryThis[0], /About 12 ms against About 12 s — a thousand times longer, three steps apart/);
    assert.match(GUIDES.p4.tryThis[1], /5 · Piano note: About 2\.5 s, in the LONG band — long enough to have a clear onset, body and tail/);
    assert.match(s, /'Long enough to have a clear onset, body and tail\.'/);
  });
  it('p5: snare peak −0.4 / average −15.7 / crest 15.3 dB; trumpet 0.0 / −4.3 / 4.3 dB', () => {
    const fmtDb = (v: number) => { const r = Math.round(v * 10) / 10; return `${r === 0 ? '0.0' : r.toFixed(1)} dB`; };
    assert.match(s, /const fmtDb = \(v: number\) => \{ const r = Math\.round\(v \* 10\) \/ 10; return `\$\{r === 0 \? '0\.0' : r\.toFixed\(1\)\} dB`; \};/);
    const read3 = (id: string) => {
      const w = M.envelopeAudio(preset(id).adsr, M.PRESET_TONES[id]);
      return [fmtDb(M.toDb(M.peakAbs(w))), fmtDb(M.toDb(M.rms(w))), M.crestFactorDb(w).toFixed(1)];
    };
    assert.deepEqual(read3('snare'), ['-0.4 dB', '-15.7 dB', '15.3']);
    assert.deepEqual(read3('trumpet'), ['0.0 dB', '-4.3 dB', '4.3']);
    assert.match(GUIDES.p5.tryThis[0], /peak −0\.4 dB, average −15\.7 dB, crest factor 15\.3 dB\. Now Sustained \(trumpet\): peak 0\.0, average −4\.3, crest factor 4\.3 dB/);
  });
  it('p6: the cymbal’s release is 1400 ms', () => {
    assert.equal(preset('cymbal').adsr.releaseMs, 1400);
    assert.match(GUIDES.p6.tryThis[0], /Cymbal: release 1400 ms/);
  });
  // Review 2026-10-31 — each claim vetted against the code before the fix.
  it('vetted: the three onsets differ past the onset too (sustain 0.35 / 0.6 / 1.0) — never "only the onset changes"', () => {
    const lv = (['sharp', 'soft', 'none'] as const).map((k) => M.TRANSIENTS[k].adsr.sustain);
    assert.deepEqual(lv, [0.35, 0.6, 1]);
    assert.match(GUIDES.p3.changes[0], /35, 60 and 100 % of the peak/);
    assert.doesNotMatch(GUIDES.p3.changes.join(' ') + GUIDES.p3.tryThis.join(' '), /only the onset changes/i);
  });
  it('vetted: Peak vs Average dB are of the model full scale (envelope top 1.0), so the snare peak is below 0 dB', () => {
    assert.match(code('src/features/envelope/envelopeModel.ts'), /export const toDb = \(lin: number\) => \(lin > 0 \? 20 \* Math\.log10\(lin\) : -120\);/);
    assert.ok(M.peakAbs(M.envelopeAudio(preset('snare').adsr, M.PRESET_TONES.snare)) < 1);
    assert.match(GUIDES.p5.seeing.join(' '), /relative to the chart’s full scale \(the top of the envelope\)/);
    assert.doesNotMatch(GUIDES.p5.seeing.join(' '), /relative to the drawn peak/);
  });
  it('vetted: with the wave drawn, level 0 is the centre line (not the floor)', () => {
    const chart = code('src/screens/lab/envelope/EnvelopeChart.tsx');
    assert.match(chart, /const y = showWave \? \(v: number\) => mid - v \* halfH/);
    assert.match(GUIDES.p1.tryThis[2], /flatten onto the center \(zero\) line/);
    assert.doesNotMatch(GUIDES.p1.tryThis.join(' '), /drops to the floor/);
  });
  it('vetted: Hold is time at the sustain level, after attack + decay (adsrTotalMs = A + D + hold + R)', () => {
    assert.match(code('src/features/envelope/envelopeModel.ts'), /adsrTotalMs = \(a: Adsr\) => a\.attackMs \+ a\.decayMs \+ a\.holdMs \+ a\.releaseMs/);
    assert.match(GUIDES.p1.control.join(' '), /0 to 2000 ms spent at the sustain level, after attack and decay, before release/);
  });
  it('vetted: the strip has ⏮; the Gallery full-screen dock holds the six sound buttons (no Speech)', () => {
    assert.match(code('src/screens/lab/kit/LabNavBar.tsx'), />⏮</);
    assert.match(GUIDES.p1.control.join(' '), /⏮ goes to the first page/);
    assert.match(s, /controls=\{<Row>\{presetBtns\}<\/Row>\}/);
    assert.match(s, /const presetBtns = PRESETS\.map/);
    assert.equal(M.PRESETS.length, 6);
    assert.match(GUIDES.p2.control.join(' '), /with the six sound buttons under it/);
  });
  it('vetted: stretching Attack keeps ATTACK: SNAP; past 15 ms the READOUT card stops calling it a transient', () => {
    assert.match(s, /adsr\.attackMs < 15 \? 'A fast attack like this IS a transient/);
    assert.match(GUIDES.p2.tryThis[2], /Stretch Attack past 15 ms: the READOUT card stops calling it a transient/);
    assert.doesNotMatch(GUIDES.p2.tryThis[2], /snap go/);
  });
  it('vetted: the envelope is the same AT THE SOURCE (the screen’s qualifier is kept)', () => {
    assert.match(s, /A snare’s envelope at the source is the same whether you stand at one meter or twenty/);
    assert.match(GUIDES.p6.teaches[0], /envelope at the source is the same whether you stand at one meter or twenty\. Farther away, the room adds more of its own tail on top\./);
  });
});

describe('5. wiring + the accuracy-chip decision', () => {
  it('EnvelopeLabScreen passes pageGuide AND endGuide to PagedLab; PagedLab draws the ⓘ on every page and on the what’s-left screen', () => {
    assert.match(s, /import \{ ENVELOPE_END_GUIDE, envelopePageGuide \} from '\.\/envelopeScreenGuides';/);
    assert.match(s, /<PagedLab[\s\S]*?pageGuide=\{envelopePageGuide\}[\s\S]*?\/>/);
    assert.match(s, /<PagedLab[\s\S]*?endGuide=\{ENVELOPE_END_GUIDE\}[\s\S]*?\/>/);
    const PAGED = code('src/screens/lab/kit/PagedLab.tsx');
    assert.match(PAGED, /const guide = ending \? endGuide : def\.guide \?\? pageGuide\?\.\(page\);/);
    assert.match(PAGED, /guideTitle=\{ending \? 'WHERE YOU ARE' : def\.title\.toUpperCase\(\)\}/);
    assert.match(PAGED, /<ScreenGuideHost resetKey=\{ending \? 'end' : String\(page\)\}/);
  });
  it('a CONCEPT lab: accuracy={false}; nothing is measured and every chart keeps its ILLUSTRATIVE MODEL badge', () => {
    assert.match(s, /<PagedLab[\s\S]*?accuracy=\{false\}[\s\S]*?\/>/);
    assert.doesNotMatch(s, /AccuracyNote/);
    assert.doesNotMatch(code(`${ENV}/EnvelopeChart.tsx`), /AccuracyNote/);
    // visual only: no audio engine, no microphone
    assert.doesNotMatch(s + code(`${ENV}/EnvelopeChart.tsx`), /ApeDsp|useMicrophone|getUserMedia|AudioRecorder/);
    assert.match(code(`${ENV}/EnvelopeChart.tsx`), /export const CHART_HONESTY = 'ILLUSTRATIVE MODEL — DRAWN FROM THE SETTINGS, NOT A MEASUREMENT';/);
    assert.match(s, /badge="TYPICAL VALUES — ILLUSTRATIVE, NOT MEASURED"/);
  });
});

describe('6. the what’s-left END guide is complete and true for this lab', () => {
  const END = ENVELOPE_END_GUIDE as unknown as Guide;
  const t = textOf(END);
  const END_SCREEN = code('src/screens/lab/kit/LabEndScreen.tsx');
  const LAB_END = code('src/screens/lab/kit/labEnd.ts');
  const PAGED = code('src/screens/lab/kit/PagedLab.tsx');
  const NAVC = code('src/screens/lab/kit/labNav.ts');
  const BAR = code('src/screens/lab/kit/LabNavBar.tsx');
  const PAGED_END = PAGED.match(/<LabEndScreen[\s\S]*?\/>/)?.[0] ?? '';

  it('all five sections, 1–5 bullets, TRY THIS 2–3, within the no-scroll budget', () => {
    assert.deepEqual(Object.keys(END).sort(), [...SECTION_KEYS].sort());
    for (const k of SECTION_KEYS) {
      assert.ok(END[k].length >= 1 && END[k].length <= 5, `end.${k}: ${END[k].length} bullets`);
      for (const line of END[k]) assert.ok(line.trim().length > 10, `end.${k}: a blank bullet`);
    }
    assert.ok(END.tryThis.length >= 2 && END.tryThis.length <= 3);
    for (const sec of SCREEN_GUIDE_SECTIONS as readonly { key: string; place: string }[]) {
      if (sec.place === 'strip') {
        for (const item of END.tryThis) assert.ok(item.length <= SCREEN_GUIDE_BUDGET.tryItem, `end.tryThis (${item.length})`);
        continue;
      }
      const n = END[sec.key].join(' ').length;
      assert.ok(n <= (sec.place === 'high' ? SCREEN_GUIDE_BUDGET.high : SCREEN_GUIDE_BUDGET.low), `end.${sec.key}: ${n}`);
    }
  });
  it('house copy rules: knowledge not skills, no "N of total", no "recommend", no build notes', () => {
    assert.doesNotMatch(t, /\byou(’|')?ll (master|build|mix|be able)|\bmaster(y|ed)?\b|\byou will learn to\b/i);
    assert.doesNotMatch(t, /\b\d+\s+(of|OF)\s+\d+\b|\b\d+\s*\/\s*\d+\b/);
    assert.doesNotMatch(t, /\bOF\b/); // never echoes the "✓ DONE · n OF N" count
    assert.doesNotMatch(t, /\brecommend/i);
    assert.doesNotMatch(t, /\b(TODO|FIXME|placeholder|owner 20\d\d|NEW COPY)\b/i);
  });
  it('the titles: WHAT’S LEFT / LAB COMPLETE (endTitle; Envelope passes no completeTitle), YOUR PROGRESS when unreadable', () => {
    assert.match(LAB_END, /return w\.complete \? 'LAB COMPLETE' : "WHAT'S LEFT";/);
    assert.match(END_SCREEN, /const title = unreadable \? 'YOUR PROGRESS' : w\.complete && completeTitle \? completeTitle : endTitle\(w\);/);
    assert.doesNotMatch(PAGED_END, /completeTitle=/);
    assert.match(PAGED_END, /unreadable=\{(unreadable|endUnreadable)\}/);
    // LAB COMPLETE needs every page AND the check (all rows cleared)
    assert.match(LAB_END, /complete: required > 0 && left\.length === 0/);
    assert.match(END.seeing[0], /WHAT'S LEFT, or LAB COMPLETE once every page and the check are done/);
    // unreadable: a failed credit read ALONE sets it (this lab has a check),
    // so done pages may still fold into ✓ DONE — never "every page is listed";
    // the shared note replaces the lead line; every row (listed or under
    // REVIEW ▾) still jumps.
    assert.match(PAGED, /const unreadable = pagesUnreadable \|\| \(\(!!creditLabKey \|\| !!check \|\| pageCreditKeys\.length > 0\) && creditUnreadable\);/);
    assert.match(END_SCREEN, /\{unreadable \? \(\s*<ProgressUnreadableNote \/>\s*\) : \(\s*<Text style=\{styles\.lead\}>/);
    assert.match(END.seeing[2], /title reads YOUR PROGRESS, a note replaces the line under it, and every page still opens\./);
    assert.doesNotMatch(t, /every page is still listed/);
  });
  it('progress mode: Envelope banks no page credit, so rows and the fold read ✓ DONE, never CREDITED', () => {
    assert.doesNotMatch(s, /creditLabKey=|pageCreditKeys=|onPageDone=/);
    assert.match(PAGED, /const creditMode: 'credit' \| 'progress' = creditLabKey \|\| pageCreditKeys\.length > 0 \? 'credit' : 'progress';/);
    assert.match(PAGED_END, /mode=\{creditMode\}/);
    assert.match(PAGED_END, /noun="page"/);
    assert.match(END_SCREEN, /const tag = mode === 'credit' && !isGuest \? 'CREDITED' : 'DONE';/);
    assert.match(END_SCREEN, /\{showCredited \? 'HIDE ▴' : 'REVIEW ▾'\}/);
    assert.match(t, /✓ DONE line/);
    assert.match(END.changes[2], /^Rows read ✓ DONE: a page ✓ is progress, not credit\./);
    assert.doesNotMatch(t, /CREDITED/); // a word this lab's end screen never shows
    // the check row: label + CHECK in the number column, listed last
    assert.match(PAGED, /label: 'Check your understanding', kind: 'check'/);
    assert.match(END_SCREEN, /r\.kind === 'check' \? 'CHECK'/);
    assert.match(END.seeing[1], /Check your understanding sits last, marked CHECK/);
    // passing the check is the lab's certificate unit
    assert.match(code('src/features/lab/trainingLabKeys.ts'), /\{ route: 'EnvelopeLab', key: 'tr_envelope', completion: 'understanding' \}/);
    assert.match(END.changes[2], /Passing the check completes the lab, for any certificate that needs it\./);
  });
  it('the buttons are the exact labels this lab gets (PagedLab passes no doneLabel)', () => {
    assert.match(END_SCREEN, /<GlassButton label="PRACTICE AGAIN FROM THE START"/);
    assert.match(END_SCREEN, /doneLabel = 'DONE · BACK TO LABS',/);
    assert.doesNotMatch(PAGED_END, /doneLabel=/);
    assert.match(PAGED_END, /onPracticeAgain=\{\(\) => goTo\(0\)\}/); // page 1, clears nothing
    assert.equal(PAGE_TITLES[0], 'The Envelope Explorer');
    assert.match(PAGED_END, /onJump=\{\(id\) => goTo\(Number\(id\)\)\}/);
    assert.match(PAGED_END, /onDone=\{\(\) => safeGoBack\(navigation\)\}/);
    assert.match(END.control.join(' '), /PRACTICE AGAIN FROM THE START reopens The Envelope Explorer and clears nothing\. DONE · BACK TO LABS leaves the lab\./);
    // D41 K2: PagedLab's START OVER clears ticks, so its end screen's note says so (endNote).
    assert.match(PAGED_END, /\bstartOver\b/);
    assert.match(LAB_END, /'PRACTICE AGAIN and reviewing clear nothing\. START OVER \(PRACTICE\) clears the check marks for a fresh run\.'/);
    // …but START OVER (PRACTICE) at the foot of CONTENTS DOES clear the page
    // ticks: no creditLabKey / pageCreditKeys here, so only the banked check
    // survives doReset. The guide must never say "nothing is taken away".
    assert.match(PAGED, /reset: \{ label: 'START OVER \(PRACTICE\)', run: confirmReset \}/);
    assert.match(PAGED, /resetPagedProgress\(labId\)\)\.then\(\(\) => \{\s*const fresh: PagedProgress = \{ completed: \[\], lastPage: 0, done: false \};/);
    assert.match(PAGED, /\? bankedCheck\.has\(UNDERSTANDING_UNIT\)\s*: \(!!creditLabKey && bankedPages\.has/);
    assert.match(PAGED, /confirmDialog\('Start a fresh practice run\?'/);
    assert.match(END.teaches[1], /^PRACTICE AGAIN and reviewing clear nothing\. START OVER \(PRACTICE\) clears the page check marks for a fresh run; a passed check stays\.$/);
    assert.match(END.control[3], /START OVER \(PRACTICE\), at the foot of that list, asks first, then clears the page check marks\./);
    assert.doesNotMatch(t, /Nothing is taken away/i);
  });
  it('the strip on the end screen: ⏮ live, ‹ PREV leaves back to the page, readout WHAT’S LEFT ▾ opens the list; CONTENTS footer WHAT’S LEFT ›', () => {
    assert.match(NAVC, /if \(ending\) \{\s*return \{\s*startOn: count > 0,\s*prevOn: true,\s*nextLabel: null,\s*noun: '',\s*pos: NAV\.whatsLeft,/);
    assert.match(code('src/screens/lab/kit/useLabNav.ts'), /if \(ending\) \{\s*unEnd\(\);\s*return;\s*\}/);
    assert.match(PAGED, /const unEnd = useCallback\(\(\) => setEnding\(false\), \[\]\);/); // page unchanged
    assert.match(BAR, /\{view\.pos\} \{contentsOpen \? '▴' : '▾'\}/);
    assert.match(BAR, /\{NAV\.whatsLeft\} ›/);
    assert.match(END.control[3], /⏮ opens the first page, ‹ PREV returns to the page you came from, and the WHAT'S LEFT ▾ readout opens the list of pages/);
    // CONTENTS order: the page rows, then WHAT'S LEFT ›, then START OVER
    // (PRACTICE) last — so WHAT'S LEFT › is "just under the page list", not
    // "at the foot".
    assert.match(BAR, /\{NAV\.whatsLeft\} ›<\/Text>\s*<\/Pressable>\s*\{nav\.reset \? \(/);
    assert.match(END.tryThis[0], /tap MODULE ▾ and WHAT'S LEFT ›, just under the page list:/);
    assert.doesNotMatch(END.tryThis[0], /foot of the list/);
    // REVIEW ▾ exists only once something is done; the ✓ is read in CONTENTS
    assert.match(END_SCREEN, /\{w\.credited\.length > 0 \? \(/);
    assert.match(PAGED, /done: endCleared\.has\(String\(i\)\),/);
    assert.match(END.tryThis[2], /^Some pages done\? Tap REVIEW ▾, open one and use it again, then tap MODULE ▾: its ✓ is still there\.$/);
    // labels quoted with the straight ' the screen draws
    assert.doesNotMatch(t, /WHAT’S/);
  });
  it('what makes a page count as done, as THIS lab codes it', () => {
    // pages 1–5: the first slider / choice button (useTouch), or NEXT (not manualDone)
    assert.match(s, /function useTouch\(ctx: PageCtx\) \{[\s\S]*?if \(!ctx\.isDone\) ctx\.markDone\(\);/);
    assert.equal((s.match(/const touch = useTouch\(ctx\);/g) ?? []).length, 5);
    assert.match(s, /const set = \(k: keyof Adsr\) => \(v: number\) => \{ setAdsr\(\(prev\) => \(\{ \.\.\.prev, \[k\]: v \}\)\); touch\(\); \};/);
    assert.match(PAGED, /if \(!pagesWithCheck\[from\]\?\.manualDone\) markDone\(\);/);
    assert.match(s, /const pick = \(i: number\) => \{ setSel\(i\); touch\(\); \};/);
    assert.match(s, /<G key=\{e\.name\} onPress=\{\(\) => pick\(i\)\}>/); // page 4's numbered markers
    assert.match(END.changes[0], /^Pages 1–5 count as done once you move a slider or tap a choice button or numbered marker, or with NEXT ›/);
    // page 6: GOT IT › or NEXT
    assert.match(s, /\{!ctx\.isDone \? <Btn label="GOT IT ›" tone="primary" onPress=\{ctx\.markDone\} \/> : null\}/);
    assert.match(END.changes[0], /Envelope vs Propagation counts with GOT IT › or NEXT ›/);
    // page 7 (manualDone): all six; the check (manualDone): all four
    assert.match(s, /\{ title: 'Check Yourself', short: 'Check', Component: PageChecks, manualDone: true \}/);
    assert.match(s, /if \(got\.current\.size >= CHECKS\.length && !ctx\.isDone\) ctx\.markDone\(\);/);
    assert.equal((s.match(/^\s{4}q: '/gm) ?? []).length, 6);
    const env = code('src/features/lab/understandingChecks.ts').match(/const ENVELOPE: readonly Q\[\] = \[([\s\S]*?)\n\];/)?.[1] ?? '';
    assert.equal((env.match(/^\s{4}id: '/gm) ?? []).length, 4);
    assert.match(END.changes[1], /Check Yourself counts once all six are right, Check your understanding once all four are/);
    // a jump (row / CONTENTS) never marks: goTo sets the page only
    assert.match(PAGED, /const goTo = useCallback\(\(i: number\) => \{\s*const idx = [^\n]*\n\s*navigatedRef\.current = true;\s*setEnding\(false\);\s*setPage\(idx\);/);
    assert.match(END.changes[1], /A jump never marks a page\./);
  });
  it('every on-screen name the END guide quotes is in the source it describes', () => {
    const SRC_END = [END_SCREEN, LAB_END, PAGED, NAVC, BAR, s].join('\n');
    for (const n of ['LAB COMPLETE', 'YOUR PROGRESS', 'Check your understanding', 'CHECK', 'DONE', 'REVIEW ▾', 'START OVER (PRACTICE)', 'PRACTICE AGAIN FROM THE START', 'DONE · BACK TO LABS', '⏮', '‹ PREV', 'MODULE', 'GOT IT ›', 'Check Yourself', 'Envelope vs Propagation', 'The Envelope Explorer', 'FINISH ›']) {
      assert.ok(SRC_END.includes(n), `"${n}" is no longer in the source`);
      assert.ok(t.includes(n), `the END guide never names "${n}"`);
    }
    assert.ok(SRC_END.includes("WHAT'S LEFT"));
  });
});
