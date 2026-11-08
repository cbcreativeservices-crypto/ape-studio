/**
 * Screen Guide rollout — Bass Guitar Physics (2026-10-31) — receipts.
 * Pattern: test/screenGuide_20261031.test.ts (the Wave Physics pilot) and
 * test/screenGuide_chain_20261031.test.ts (a one-screen LabShell lab).
 *
 *   1. every screen the learner reaches has a guide: LEARN, CHECK (the lab
 *      has an authored understanding check, so the tab exists) and EXPLORE in
 *      BOTH faces of the MODE key (FRETTED / NATURAL HARMONICS — different
 *      readouts and dock keys); five sections, the copy rules, 2–3 TRY THIS;
 *   2. every step fits its no-scroll budget;
 *   3. the guide quotes the screen's REAL names — each pinned name is in both
 *      the guide and the lab source;
 *   4. every TRY THIS number is what the screen prints, recomputed here from
 *      the screen's own formulas (pinned verbatim);
 *   5. wiring + the accuracy-chip decision: a CONCEPT lab → `accuracy={false}`.
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it } from 'node:test';

const ROOT = process.cwd();
const read = (p: string) => readFileSync(join(ROOT, p), 'utf8').replace(/\r\n/g, '\n');
/** Source with comments stripped — a name in a comment proves nothing. */
const code = (p: string) => read(p).replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '').replace(/\{\/\*[\s\S]*?\*\/\}/g, '');

const { BASS_SCREEN_GUIDES, bassScreenGuide } = await import('../src/screens/lab/bassScreenGuides.ts');
const { SCREEN_GUIDE_SECTIONS, SCREEN_GUIDE_BUDGET } = await import('../src/features/lab/screenGuide/types.ts');

type Guide = Record<string, string[]>;
const SECTION_KEYS = SCREEN_GUIDE_SECTIONS.map((s: { key: string }) => s.key);
const G = BASS_SCREEN_GUIDES as unknown as Record<string, Guide>;
const allGuides = Object.entries(G);
const textOf = (gd: Guide) => SECTION_KEYS.map((k: string) => gd[k].join('\n')).join('\n');

const SCREEN = 'src/screens/lab/BassLabScreen.tsx';
const s = code(SCREEN);

describe('1. every Bass Guitar Physics screen has a complete guide', () => {
  it('LEARN, CHECK and EXPLORE in each MODE — and the CHECK tab really exists', () => {
    assert.deepEqual(Object.keys(G).sort(), ['check', 'fretted', 'harmonics', 'learn']);
    // CHECK is offered only where an understanding check is authored.
    assert.match(code('src/features/lab/understandingChecks.ts'), /^\s*bass: BASS,$/m);
    assert.equal((code('src/features/lab/understandingChecks.ts').match(/const BASS: readonly Q\[\] = \[([\s\S]*?)\n\];/)?.[1].match(/^\s{4}id: '/gm) ?? []).length, 4);
    // The two EXPLORE faces are the screen's own MODE options.
    assert.match(s, /type Mode = 'fretted' \| 'harmonics';/);
    assert.equal(bassScreenGuide('explore', 'fretted'), BASS_SCREEN_GUIDES.fretted);
    assert.equal(bassScreenGuide('explore', 'harmonics'), BASS_SCREEN_GUIDES.harmonics);
    assert.equal(bassScreenGuide('learn', 'harmonics'), BASS_SCREEN_GUIDES.learn);
    assert.equal(bassScreenGuide('check', 'fretted'), BASS_SCREEN_GUIDES.check);
    assert.equal(bassScreenGuide('nope', 'fretted'), undefined);
  });
  for (const [id, gd] of allGuides) {
    it(`${id}: all five sections, 1–5 bullets each, none empty; TRY THIS is 2–3`, () => {
      assert.deepEqual(Object.keys(gd).filter((k) => k !== 'intro').sort(), [...SECTION_KEYS].sort());
      // the intro card (Guided Lessons return 2026-11-08): learning ≤ 30 words, start ≤ 40
      const intro = (gd as unknown as { intro?: { learning: string; start: string } }).intro;
      assert.ok(intro, `${id}: no intro`);
      assert.ok(intro.learning.trim().split(/\s+/).length <= 30, `${id}: intro.learning over 30 words`);
      assert.ok(intro.start.trim().split(/\s+/).length <= 40, `${id}: intro.start over 40 words`);
      for (const k of SECTION_KEYS) {
        assert.ok(Array.isArray(gd[k]) && gd[k].length >= 1 && gd[k].length <= 5, `${id}.${k}: ${gd[k]?.length} bullets`);
        for (const line of gd[k]) assert.ok(typeof line === 'string' && line.trim().length > 10, `${id}.${k}: a blank bullet`);
      }
      assert.ok(gd.tryThis.length >= 2 && gd.tryThis.length <= 3, `${id}: TRY THIS is 2–3 experiments`);
    });
  }
  it('house copy rules: knowledge not skills, no "N of total", no build notes, no "recommend", no brands', () => {
    for (const [id, gd] of allGuides) {
      const t = textOf(gd);
      assert.doesNotMatch(t, /\byou(’|')?ll (master|build|mix|be able)|\bmaster(y|ed)?\b|\byou will learn to\b/i, `${id}: claims a skill`);
      // (1/12) inside 2^(1/12) is an exponent, not a count
      assert.doesNotMatch(t, /\b\d+\s+of\s+\d+\b|(?<![−\-(])\b\d+\s*\/\s*1[0-9]\b/i, `${id}: an "N of total"`);
      assert.doesNotMatch(t, /\brecommend/i, `${id}: "recommend" (house word is "suggest")`);
      assert.doesNotMatch(t, /\b(TODO|FIXME|placeholder|walkthrough|owner 20\d\d|engine build|dev client|dev build)\b/i, `${id}: a build note in learner text`);
      assert.doesNotMatch(t, /\b(Fender|Precision Bass|Jazz Bass|Music Man|Rickenbacker|Ibanez|Gibson|Yamaha|Warwick|Hofner|Höfner)\b/i, `${id}: a gear maker/model name`);
    }
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

describe('3. each guide quotes its screen’s real names', () => {
  const SRC = [
    s,
    code('src/screens/lab/LabShell.tsx'),
    code('src/screens/lab/rack/RackUnit.tsx'),
    code('src/screens/lab/foundations/bits.tsx'),
    code('src/components/LabUnderstandingCheck.tsx'),
    code('src/features/lab/guidedLessons/GuidedLessonSheet.tsx'),
    code('src/features/lab/guidedLessons/content.ts'),
  ].join('\n');
  const NAMES: Record<string, string[]> = {
    fretted: [
      'BRIDGE', 'HEADSTOCK', 'NOTE', 'FREQ', 'INTERVAL', 'LENGTH', 'MODE', 'FRETTED', 'NATURAL HARMONICS', 'STRING', 'FRET', 'OPEN',
      'LAB NOTES', 'THE EXACT NUMBERS', 'THE NOTE, AS SOUND', 'CHECK YOURSELF', 'OCTAVE', 'PERFECT 5TH', 'PERFECT 4TH', '▶', '■', 'ⓘ',
    ],
    harmonics: [
      'NOTE', 'FREQ', 'INTERVAL', 'NODE', 'MODE', 'FRETTED', 'STRING', 'OPEN', 'FULL SCREEN', 'HIDE DISPLAY', '−14¢',
      'OCTAVE (2:1)', 'OCTAVE + 5TH (3:1)', '2 OCTAVES (4:1)', '2 OCT + MAJ 3RD (5:1)', '▶', '■',
    ],
    // Decision 1 (2026-11-08): LEARN names the controls by their on-screen labels
    // (STRING, FRET, NODE, ▶), no longer the old lesson names Pluck tone / Harmonic node.
    learn: ['LEARN', 'EXPLORE', 'CHECK', 'CONTROLS', 'COMMON MISTAKES', 'PRO TIPS', 'FORMULA / CONCEPT', 'GUIDED LESSON', 'LAB NOTES', '▶','f = f₀ · 2^(n/12)', 'f = n · f₀', 'λ = 2L', 'THE EXACT NUMBERS', 'MODE', 'STRING', 'FRET', 'NODE'],
    check: ['CHECK YOUR UNDERSTANDING', 'CORRECT', 'NOT QUITE — TRY ANOTHER', 'this lab is complete', 'EXPLORE'],
  };
  it('a name list for every guide', () => {
    assert.deepEqual(Object.keys(NAMES).sort(), Object.keys(G).sort());
  });
  for (const [id, names] of Object.entries(NAMES)) {
    it(`${id}: every pinned name is on the screen AND in the guide`, () => {
      const gt = textOf(G[id]);
      for (const n of names) {
        assert.ok(SRC.includes(n), `${id}: "${n}" is no longer in the lab source — update the guide`);
        assert.ok(gt.includes(n), `${id}: the guide never names "${n}"`);
      }
    });
  }
  it('the CHECK guide names the four questions the check really asks', () => {
    const q = code('src/features/lab/understandingChecks.ts').match(/const BASS: readonly Q\[\] = \[([\s\S]*?)\n\];/)?.[1] ?? '';
    for (const id of ['twelfth-fret', 'seventh-fret', 'fret-spacing', 'node-harmonic']) assert.match(q, new RegExp(`id: '${id}'`));
    assert.match(G.check.seeing[0], /asks four questions: the 12th fret, the 7th fret, why frets crowd together, and the touch at ⅓/);
    // D41: CHECK stays mounted across a tab switch (only a pass is banked) —
    // right answers survive a trip to EXPLORE; leaving the lab starts over.
    assert.match(code('src/screens/lab/LabShell.tsx'), /\{hasCheck \? \(\s*<View style=\{mode === 'check' \? styles\.rackFill : styles\.rackHidden\}>\s*<ScrollView[\s\S]*?<LabUnderstandingCheck/);
    assert.match(G.check.control.join(' '), /answers already right stay right until you leave the lab/);
  });
});

describe('4. every TRY THIS number is what the screen prints', () => {
  it('the screen formulas the arithmetic copies (pinned verbatim)', () => {
    assert.match(s, /\{ key: 'E', label: 'E', midi: 28, hz: 41\.203 \}/);
    assert.match(s, /\{ key: 'A', label: 'A', midi: 33, hz: 55\.0 \}/);
    assert.match(s, /\{ key: 'D', label: 'D', midi: 38, hz: 73\.416 \}/);
    assert.match(s, /\{ key: 'G', label: 'G', midi: 43, hz: 97\.999 \}/);
    assert.match(s, /const soundHz = mode === 'fretted' \? str\.hz \* Math\.pow\(2, fret \/ 12\) : str\.hz \* node\.n;/);
    assert.match(s, /mode === 'fretted' \? str\.midi \+ fret : str\.midi \+ Math\.round\(12 \* Math\.log2\(node\.n\)\);/);
    assert.match(s, /const vibFrac = mode === 'fretted' \? Math\.pow\(2, -fret \/ 12\) : 1;/);
    assert.match(s, /\{ k: 'FREQ', v: `\$\{soundHz\.toFixed\(1\)\} Hz`/);
    assert.match(s, /\{ k: 'LENGTH', v: `\$\{\(vibFrac \* 100\)\.toFixed\(0\)\}%`/);
    assert.match(s, /\{ k: 'INTERVAL', v: INTERVALS\[fret\]/);
    assert.match(s, /node\.n === 5 \? `≈\$\{midiName\(soundMidi\)\} −14¢`/);
    assert.match(s, /const midiName = \(m: number\) => `\$\{NOTE_NAMES\[m % 12\]\}\$\{Math\.floor\(m \/ 12\) - 1\}`;/);
    assert.match(s, /const fretPos = \(n: number\) => 1 - Math\.pow\(2, -n \/ 12\);/);
    assert.match(s, /const SPEED_OF_SOUND = 343;/);
    assert.match(s, /≈ \{airWavelen\.toFixed\(2\)\} m/);
    assert.match(s, /label: `\$\{s\.label\} · \$\{s\.hz\.toFixed\(0\)\} Hz`/);
    assert.match(s, /format: \(\) => \(fret === 0 \? 'OPEN' :/);
    assert.match(s, /const NUM_FRETS = 12;/);
  });

  const STR = { E: { midi: 28, hz: 41.203 }, A: { midi: 33, hz: 55.0 }, D: { midi: 38, hz: 73.416 }, G: { midi: 43, hz: 97.999 } } as const;
  const NOTE_NAMES = ['C', 'C♯', 'D', 'D♯', 'E', 'F', 'F♯', 'G', 'G♯', 'A', 'A♯', 'B'];
  const INTERVALS = ['UNISON', 'MINOR 2ND', 'MAJOR 2ND', 'MINOR 3RD', 'MAJOR 3RD', 'PERFECT 4TH', 'TRITONE', 'PERFECT 5TH', 'MINOR 6TH', 'MAJOR 6TH', 'MINOR 7TH', 'MAJOR 7TH', 'OCTAVE'];
  const midiName = (m: number) => `${NOTE_NAMES[m % 12]}${Math.floor(m / 12) - 1}`;
  const fretted = (k: keyof typeof STR, fret: number) => ({
    note: midiName(STR[k].midi + fret),
    freq: (STR[k].hz * 2 ** (fret / 12)).toFixed(1),
    length: `${(2 ** (-fret / 12) * 100).toFixed(0)}%`,
    interval: INTERVALS[fret],
  });
  const harmonic = (k: keyof typeof STR, n: number) => ({
    note: midiName(STR[k].midi + Math.round(12 * Math.log2(n))),
    freq: (STR[k].hz * n).toFixed(1),
  });

  it('the screen still lists those intervals and note names', () => {
    assert.match(s, /'PERFECT 4TH', 'TRITONE',\s*'PERFECT 5TH', 'MINOR 6TH', 'MAJOR 6TH', 'MINOR 7TH', 'MAJOR 7TH', 'OCTAVE',/);
    assert.match(s, /const NOTE_NAMES = \['C', 'C♯', 'D', 'D♯', 'E', 'F', 'F♯', 'G', 'G♯', 'A', 'A♯', 'B'\] as const;/);
  });

  it('FRETTED: open E → fret 12, fret 7, fret 5 (and the open A it matches)', () => {
    const open = fretted('E', 0);
    const f12 = fretted('E', 12);
    const f7 = fretted('E', 7);
    const f5 = fretted('E', 5);
    assert.deepEqual([open.note, open.freq], ['E1', '41.2']);
    assert.deepEqual(f12, { note: 'E2', freq: '82.4', length: '50%', interval: 'OCTAVE' });
    assert.deepEqual(f7, { note: 'B1', freq: '61.7', length: '67%', interval: 'PERFECT 5TH' });
    assert.deepEqual(f5, { note: 'A1', freq: '55.0', length: '75%', interval: 'PERFECT 4TH' });
    const openA = fretted('A', 0);
    assert.deepEqual([openA.note, openA.freq], ['A1', '55.0']);
    assert.equal((Number(f7.freq) / Number(open.freq)).toFixed(2), '1.50');
    const t = G.fretted.tryThis;
    assert.match(t[0], /FREQ goes 41\.2 → 82\.4 Hz, NOTE E1 → E2, LENGTH 50%/);
    assert.match(t[1], /B1, 61\.7 Hz, PERFECT 5TH, LENGTH 67%/);
    assert.match(t[1], /61\.7 ÷ 41\.2 ≈ 1\.50/);
    assert.match(t[2], /A1, 55\.0 Hz, the same as STRING A, OPEN/);
  });

  it('FRETTED changes: one fret keeps about 94.4% and multiplies by 1.0595', () => {
    assert.equal((2 ** (-1 / 12) * 100).toFixed(1), '94.4');
    assert.equal((2 ** (1 / 12)).toFixed(4), '1.0595');
    assert.match(G.fretted.changes[0], /about 94\.4%/);
    assert.match(G.fretted.changes[0], /×1\.0595/);
  });

  it('the STRING key labels the guide quotes are the screen’s own', () => {
    const labels = (Object.keys(STR) as (keyof typeof STR)[]).map((k) => `${k} · ${STR[k].hz.toFixed(0)} Hz`);
    assert.deepEqual(labels, ['E · 41 Hz', 'A · 55 Hz', 'D · 73 Hz', 'G · 98 Hz']);
    for (const l of labels) assert.ok(G.fretted.control.join(' ').includes(l), `guide lacks "${l}"`);
  });

  it('HARMONICS: ½ ⅓ ¼ ⅕ on E, the −14¢ of H5, and ⅓ over fret 7', () => {
    const h = [2, 3, 4, 5].map((n) => harmonic('E', n));
    assert.deepEqual(h.map((x) => x.freq), ['82.4', '123.6', '164.8', '206.0']);
    assert.deepEqual(h.map((x) => x.note), ['E2', 'B2', 'E3', 'G♯3']);
    // H5 really is 14 cents flat of the tempered note the bezel names.
    assert.equal(Math.round(2800 - 1200 * Math.log2(5)), 14);
    const t = G.harmonics.tryThis;
    assert.match(t[0], /NODE ½: E2, 82\.4 Hz, the same as fret 12/);
    assert.equal(fretted('E', 12).freq, h[0].freq);
    assert.match(t[1], /82\.4, 123\.6, 164\.8, 206\.0 Hz/);
    // ⅓ of the way from the nut sits on fret 7 (33.3 %), where fretting gives B1.
    const fp7 = 1 - 2 ** (-7 / 12);
    assert.equal((fp7 * 100).toFixed(1), '33.3');
    assert.equal(((1 / 3) * 100).toFixed(1), '33.3');
    assert.match(t[2], /33\.3% from the nut/);
    assert.match(t[2], /B1 61\.7 Hz; the harmonic is B2 123\.6 Hz, an octave higher/);
    // "an octave higher": within 3 cents of 2:1
    assert.ok(Math.abs(1200 * Math.log2(Number(h[1].freq) / Number(fretted('E', 7).freq)) - 1200) < 3);
  });

  it('LEARN + CHECK: open E 41.2 / E2 82.4, B1 61.7 / B2 123.6, air λ of open E 8.32 m', () => {
    assert.equal((343 / 41.203).toFixed(2), '8.32');
    assert.match(G.learn.tryThis[0], /open E reads E1 41\.2 Hz; fret 12 and the ½ harmonic both read E2 82\.4 Hz/);
    assert.match(G.learn.tryThis[1], /about 8\.32 m long in air/);
    // Decision 6 (2026-11-08): CHECK never walks the student to a reading that IS an answer.
    // The 12th-fret answer is the doubling itself, so CHECK points to LEARN's FORMULA / CONCEPT;
    // the ⅓-touch question gets a DIFFERENT example (NODE ¼ → H4 = 4 × open E).
    const ci = (G.check as unknown as { intro: { learning: string; start: string } }).intro;
    const ct = [...G.check.tryThis, ...G.check.teaches, ci.learning, ci.start].join(' ');
    assert.doesNotMatch(ct, /82\.4|123\.6|61\.7|FRET to 12|octave|doubl|three times|3rd harmonic|\bH3\b|fifth|PERFECT 5TH|same ratio/i);
    assert.match(G.check.tryThis[0], /On LEARN, reread FORMULA \/ CONCEPT: the fret rule f = f₀ · 2\^\(n\/12\)/);
    assert.equal(harmonic('E', 4).freq, '164.8');
    assert.equal(STR.E.hz.toFixed(1), '41.2');
    assert.match(G.check.tryThis[1], /MODE NATURAL HARMONICS, STRING E, NODE ¼\. Count the lobes, then compare FREQ, 164\.8 Hz, with open E’s 41\.2 Hz/);
    assert.match(ci.start, /Reread FORMULA \/ CONCEPT on LEARN/);
    // the PRO TIPS line the LEARN step points at is the first one (old lesson text, or the 2026-11-08 Part A rewrite)
    assert.match(code('src/features/lab/guidedLessons/content.ts'), /proTips: \[\s*["']Play open E, then (the 12th-fret octave|fret 12), then the (12th-fret|½) harmonic/);
  });
});

describe('5. wiring + the accuracy-chip decision', () => {
  it('LabShell gets a per-tab guide that follows the EXPLORE MODE', () => {
    assert.match(s, /import \{ bassScreenGuide \} from '\.\/bassScreenGuides';/);
    assert.match(s, /<LabShell[\s\S]*?guide=\{\(tab\) => bassScreenGuide\(tab, mode\)\}/);
    const shell = code('src/screens/lab/LabShell.tsx');
    assert.match(shell, /typeof guide === 'function' \? guide\(mode\)/);
    assert.match(shell, /<ScreenGuideHost resetKey=\{`\$\{mode\}:\$\{guideIdOf\(shownGuide\)\}`\} regions=\{!!rack && mode === 'explore'\}>/);
  });
  it('a CONCEPT lab: no live mic, no real-world measurement — the chip gives its spot to the ⓘ', () => {
    assert.match(s, /<LabShell[\s\S]*?accuracy=\{false\}/);
    assert.doesNotMatch(s, /<AccuracyNote/);
    // Re-vetted 2026-10-31: no microphone is opened (ApeDsp.start() is mic
    // capture and is never called) — only the generator fallback and the
    // recordings play; every readout is computed from the string equations.
    const calls = new Set([...s.matchAll(/ApeDsp\.(\w+)/g)].map((m) => m[1]));
    assert.ok(calls.size > 0);
    for (const c of calls) assert.match(c, /^gen[A-Z]\w*$|^(isAvailable|engineVersion)$/, `ApeDsp.${c} — not a generator call`);
    assert.doesNotMatch(s, /useMicrophone|getUserMedia|AudioRecorder|requestRecordingPermissions|getMeterFrame/);
    // The honesty disclosure stays on the faceplate.
    assert.match(s, /badge: 'TRUE FRET GEOMETRY — BRIDGE ← NUT · DRAWN FROM THE EQUATIONS'/);
  });
});

describe('6. guide fixes vetted against the screen (2026-10-31 review round)', () => {
  it('▶ falls back to the string model and says so; ■ stays lit and later picks play', () => {
    assert.match(s, /playing the string model instead\./);
    for (const id of ['fretted', 'harmonics']) {
      assert.match(G[id].control.join(' '), /While ■ shows, every new pick plays; ■ stops\. If the screen says the string model is playing, you hear a modeled string\./);
    }
  });
  it('the swing speed follows the FRET, not the string — the guide says "on one string"', () => {
    assert.match(s, /const visHz = 0\.45 \* \(mode === 'fretted' \? Math\.pow\(2, fret \/ 12\) : harmonicN\);/);
    assert.match(G.fretted.changes.join(' '), /On one string, a higher fret swings faster/);
    assert.doesNotMatch(textOf(G.fretted), /a higher note swings faster/);
  });
  it('the header ▶ stays on LEARN, so LEARN never says "Nothing here plays"', () => {
    assert.match(code('src/screens/lab/LabShell.tsx'), /\{headerAction \? <View style=\{styles\.headerAction\}/);
    assert.doesNotMatch(textOf(G.learn), /Nothing here plays/);
    assert.match(G.learn.seeing[0], /▶ in the header still plays the note you chose on EXPLORE/);
  });
  it('tuned in fourths: fret 5 on E, A, D is the next string open', () => {
    const open = [28, 33, 38, 43];
    for (let i = 0; i < 3; i++) assert.equal(open[i] + 5, open[i + 1]);
    assert.match(G.fretted.tryThis[2], /tuned in fourths \(E, A, D, G\), so fret 5 on E, A or D matches the next string open/);
  });
});

describe('D41 #10: a FRETTED tap picks the fret SPACE, not the nearest wire', () => {
  const src = code('src/screens/lab/BassLabScreen.tsx');
  // Lift the screen's own fretForTap + fretPos out of the source and run them.
  const fnSrc = src.match(/function fretForTap\(fx: number, nutFx: number\): number \{[\s\S]*?\n\}/)?.[0];
  assert.ok(fnSrc, 'fretForTap is in the screen');
  const js = fnSrc!.replace(/: number/g, '');
  const fretPos = (n: number) => 1 - Math.pow(2, -n / 12);
  const fretForTap = new Function('fretPos', 'NUM_FRETS', `${js}; return fretForTap;`)(fretPos, 12) as (fx: number, nutFx: number) => number;
  const NUT = 4.5 / 300; // a 300-unit board

  it('the tap handler uses it (no nearest-wire snap left)', () => {
    assert.match(src, /onPick\(si, fretForTap\(fx, NUT_W \/ w\)\);/);
    assert.doesNotMatch(src, /Math\.abs\(fx - fretPos\(n\)\)/);
    assert.match(src, /const NUT_W = 4\.5;/);
    assert.match(src, /width=\{NUT_W\}/);
  });
  it('each inlay dot (drawn halfway between wires n−1 and n) picks fret n', () => {
    for (const n of [3, 5, 7, 9, 12]) assert.equal(fretForTap((fretPos(n - 1) + fretPos(n)) / 2, NUT), n, `dot ${n}`);
  });
  it('every fret space, both halves, picks its own fret; a tap on wire n is fret n', () => {
    for (let n = 1; n <= 12; n++) {
      const a = Math.max(fretPos(n - 1), NUT);
      const b = fretPos(n);
      assert.equal(fretForTap(a + (b - a) * 0.05, NUT), n, `near wire ${n - 1}`);
      assert.equal(fretForTap(a + (b - a) * 0.95, NUT), n, `near wire ${n}`);
      assert.equal(fretForTap(b, NUT), n, `on wire ${n}`);
    }
  });
  it('the nut and the headstock (fx ≤ 0, clamped) are the OPEN string, fret 0', () => {
    assert.equal(fretForTap(0, NUT), 0);
    assert.equal(fretForTap(NUT, NUT), 0);
    assert.equal(fretForTap(NUT * 1.01, NUT), 1);
  });
  it('past wire 12 (the dimmer frets) and at the bridge stays fret 12, the highest', () => {
    assert.equal(fretForTap(fretPos(12) + 1e-6, NUT), 12);
    assert.equal(fretForTap(fretPos(16), NUT), 12);
    assert.equal(fretForTap(1, NUT), 12);
  });
  it('the guide and caption describe the fret space, not the nearest fret', () => {
    assert.match(G.fretted.control[0], /A fret is the space up to its wire, so an inlay dot picks that fret\. The nut or headstock gives OPEN; past fret 12 gives 12/);
    assert.doesNotMatch(G.fretted.control[0], /nearest string and fret/);
    assert.match(src, /exploreCaption="Tap the fretboard — between two frets or at a node/);
  });
});
