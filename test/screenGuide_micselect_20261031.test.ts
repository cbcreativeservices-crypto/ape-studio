/**
 * Screen Guide rollout — Microphone Selection Lab (2026-10-31) — receipts.
 * Pattern: test/screenGuide_20261031.test.ts (the Wave Physics pilot) and
 * test/screenGuide_micspeaker_20261031.test.ts (a stepped LabNavBar lab).
 *
 *   1. every step the learner reaches (the screen's STEPS: nine lessons, the
 *      challenge, the optional locker) and the what's-left end screen (which
 *      carries the lab's understanding check) has a guide: five sections, the
 *      copy rules, 2–3 TRY THIS, each step inside its no-scroll budget;
 *   2. each guide quotes the screen's REAL names — every pinned name is in
 *      both the guide and the lab source;
 *   3. every verdict / count a TRY THIS quotes is what the screen computes,
 *      re-derived here from the lab's own data and formulas;
 *   4. wiring: LabHeader `guide` per step (the end guide on the end screen)
 *      and a ScreenGuideHost around the root's content, no regions (no rack);
 *   5. the accuracy-chip decision: a CONCEPT lab (teaching models, no live
 *      mic, no measured numbers) — the chip is gone, the ⓘ takes its spot,
 *      and the chip's "teaching models, not measurements" point is carried by
 *      the guides that show those drawings.
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it } from 'node:test';

const ROOT = process.cwd();
const read = (p: string) => readFileSync(join(ROOT, p), 'utf8').replace(/\r\n/g, '\n');
/** Source with comments stripped — a name in a comment proves nothing. */
const code = (p: string) => read(p).replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '').replace(/\{\/\*[\s\S]*?\*\/\}/g, '');

const GF = await import('../src/screens/lab/micselect/micSelectScreenGuides.ts');
const D = await import('../src/screens/lab/micselect/micSelectData.ts');
const { SCREEN_GUIDE_SECTIONS, SCREEN_GUIDE_BUDGET } = await import('../src/features/lab/screenGuide/types.ts');

type Guide = Record<string, string[]>;
const SECTION_KEYS = SCREEN_GUIDE_SECTIONS.map((s: { key: string }) => s.key);
const G = GF.MICSEL_SCREEN_GUIDES as unknown as Record<string, Guide>;
const END = GF.MICSEL_END_GUIDE as unknown as Guide;
const allGuides: [string, Guide][] = [...Object.entries(G), ['end', END]];
const textOf = (gd: Guide) => SECTION_KEYS.map((k: string) => gd[k].join('\n')).join('\n');

const SCREEN = 'src/screens/lab/micselect/MicSelectLabScreen.tsx';
const s = code(SCREEN);
/** The screen's STEPS, in order: key, tag, title. */
const STEPS = [...s.matchAll(/key: '(\w+)',\s*tag: '([^']+)',\s*title: '([^']+)'/g)].map((m) => ({ key: m[1], tag: m[2], title: m[3] }));

describe('1. every Microphone Selection screen has a complete guide', () => {
  it('one guide per STEPS key — no missing, no extra — plus the end screen', () => {
    assert.equal(STEPS.length, 11);
    assert.deepEqual(Object.keys(G), STEPS.map((x) => x.key));
    assert.equal(GF.micSelScreenGuide('types', true), GF.MICSEL_END_GUIDE);
    for (const st of STEPS) assert.equal(GF.micSelScreenGuide(st.key, false), G[st.key]);
    assert.equal(GF.micSelScreenGuide('nope', false), undefined);
    // the end screen carries the understanding check (four questions)
    assert.match(s, /extra=\{<LabUnderstandingBlock labId="micselect" labTitle="Microphone Selection Lab" \/>\}/);
    const q = code('src/features/lab/understandingChecks.ts').match(/const MIC_SELECT: readonly Q\[\] = \[([\s\S]*?)\n\];/)?.[1] ?? '';
    assert.deepEqual([...q.matchAll(/^\s{4}id: '([^']+)'/gm)].map((m) => m[1]), ['categories', 'lectern-rumble', 'self-noise', 'label-vs-spec']);
    assert.match(END.seeing.join(' '), /four questions on the whole lab — categories, lectern rumble, self-noise, and a label versus the specs/);
  });
  for (const [id, gd] of allGuides) {
    it(`${id}: all five sections, 1–5 bullets each, 2–3 TRY THIS`, () => {
      assert.deepEqual(Object.keys(gd).sort(), [...SECTION_KEYS].sort());
      for (const k of SECTION_KEYS) {
        assert.ok(Array.isArray(gd[k]) && gd[k].length >= 1 && gd[k].length <= 5, `${id}.${k}: ${gd[k]?.length} bullets`);
        for (const line of gd[k]) assert.ok(typeof line === 'string' && line.trim().length > 10, `${id}.${k}: a blank bullet`);
      }
      assert.ok(gd.tryThis.length >= 2 && gd.tryThis.length <= 3, `${id}: TRY THIS is 2–3 experiments`);
    });
  }
  it('every step fits its no-scroll budget (375×812)', () => {
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
  it('house copy rules: knowledge not skills, no "N of total", no "recommend", no build notes, no gear makers', () => {
    for (const [id, gd] of allGuides) {
      const t = textOf(gd);
      assert.doesNotMatch(t, /\byou(’|')?ll (master|build|mix|be able)|\bmaster(y|ed)?\b|\byou will learn to\b/i, `${id}: claims a skill`);
      assert.doesNotMatch(t, /\b\d+\s+of\s+\d+\b|\b\d+\s*\/\s*\d+\b|\bOF \d+\b/i, `${id}: an "N of total"`);
      assert.doesNotMatch(t, /\brecommend/i, `${id}: "recommend" (house word is "suggest")`);
      assert.doesNotMatch(t, /\b(TODO|FIXME|placeholder|walkthrough|owner 20\d\d)\b/i, `${id}: a build note in learner text`);
      assert.doesNotMatch(t, /\b(Shure|Sennheiser|Neumann|AKG|Audio-Technica|Electro-Voice|Rode|Røde|Beyerdynamic|Sony|DPA|Schoeps|Royer|Coles|Earthworks|Countryman|Lewitt|SM58|SM57|U87|MD421|RE20|C414)\b/i, `${id}: a gear maker/model name`);
    }
  });
});

describe('2. each guide quotes its screen’s real names', () => {
  const SRC = [
    s,
    code('src/screens/lab/micselect/micSelectData.ts'),
    code('src/screens/lab/micselect/polarStage.tsx'),
    code('src/screens/lab/micselect/micArt.tsx'),
    code('src/screens/lab/foundations/bits.tsx'),
    code('src/screens/lab/kit/labNav.ts'),
    code('src/screens/lab/kit/LabNavBar.tsx'),
  ].join('\n');
  const END_SRC = [code('src/screens/lab/kit/LabEndScreen.tsx'), code('src/screens/lab/kit/labEnd.ts'), code('src/components/LabUnderstandingCheck.tsx')].join('\n');
  const NAMES: Record<string, [string, string[]]> = {
    types: [SRC, ['TAP A MICROPHONE', 'COMPARE', 'COMPARING', 'Moving-Coil Dynamic', 'Condenser', 'Shotgun / Interference-Tube', 'Contact', 'TRANSDUCER PRINCIPLE', 'DESIGN / FORM FACTOR', 'WHAT IT IS', 'MAJOR CHARACTERISTICS', 'TYPICAL APPLICATIONS', 'IMPORTANT LIMITATION', 'NOT equivalent categories', '⤢', '‹']],
    chars: [SRC, ['Polar pattern', 'Environmental suitability', 'Sensitivity', 'Maximum SPL', 'Self-noise', 'Signal-to-noise ratio', 'Equivalent noise level', 'Weight', 'Flat is not synonymous with better.']],
    patterns: [SRC, ['Omni', 'Cardioid', 'Supercardioid', 'Hypercardioid', 'Figure-8', 'Singer · wanted', 'Drum kit', 'Audience', 'Wedge monitor', 'Reflective wall', 'HVAC vent', 'TOP VIEW · DIRECTIONS ONLY, NOT TO SCALE', 'WHY DID YOU CHOOSE', '✓ picked up', '△ partial', '⚠ picked up', '⚠ missed', '✓ rejected', 'Need equal pickup in all directions']],
    curves: [SRC, ['20 Hz', '20 kHz', 'Relatively flat', 'Presence rise (3–6 kHz)', 'Low-frequency rolloff', 'Extended high-frequency response', 'Strongly shaped (application-voiced)', 'EMPHASIZES', 'ATTENUATES', 'WHERE THAT IS USEFUL', 'CHECK YOURSELF', 'fictional but realistic', 'SHAPE', '▾']],
    spl: [SRC, ['Studio condenser', 'Moving-coil dynamic', 'Electret lavalier', 'THE SOURCE SCALE', 'Very quiet', 'Quiet', 'Moderate', 'Loud', 'Extremely loud', '✓ good match', '△ depends', '⚠ caution']],
    power: [SRC, ['PREAMP', '48 V', 'Passive moving-coil', 'Passive ribbon', 'Condenser']],
    form: [SRC, ['Handheld', 'Lavalier', 'Headworn', 'Shotgun', 'Boundary', 'Pencil / SDC', 'Large-diaphragm studio', 'Theater', '⤢']],
    env: [SRC, ['A · Controlled recording studio', 'B · Loud concert stage', 'C · Outdoor interview', 'PRIORITIES', 'Feedback rejection (pattern!)', 'Wind protection']],
    jobs: [SRC, ['Voice', 'Instruments', 'Production / AV', 'Live vocal', 'Studio vocal', 'Voiceover', 'Kick', 'Strings', 'Measurement', 'WHICH MICROPHONE CHARACTERISTICS SATISFY THESE REQUIREMENTS?', 'CHECK YOURSELF', 'Feedback rejection', 'Ruggedness', 'Tonal detail', 'Self-noise', 'Max SPL', 'Voicing']],
    challenge: [SRC, ['Outdoor interview', 'One speaker', 'Moderate traffic noise', 'Wind', 'Camera must stay several feet away', 'Boom operator available', 'CHOOSE THE MICROPHONE', 'WHY? SELECT THE FACTORS THAT DROVE YOUR CHOICE', 'CHECK MY REASONING', 'CHANGE ONE VARIABLE', 'Original brief', 'CHECK', 'A defensible professional choice', 'Also defensible', 'Not the strongest choice', 'Microphone B', 'Microphone D', 'Microphone A', 'Directionality', 'Working distance / application', 'Wind protection']],
    locker: [SRC, ['SLOTS USED', 'APPLICATIONS COVERED', 'THIS WEEK’S JOBS', '✓ covered', 'Kick drum', 'Snare', 'Live vocal', 'Choir', 'Large-diaphragm condenser', 'Second large-diaphragm condenser', 'FINISH · SEE WHAT’S LEFT ›']],
    end: [END_SRC, ['LAB COMPLETE', 'WHAT’S LEFT', 'CHECK YOUR UNDERSTANDING', 'CORRECT', 'NOT QUITE — TRY ANOTHER', 'REVIEW ▾', 'PRACTICE AGAIN FROM THE START', 'DONE · BACK TO LABS']],
  };
  it('a name list for every guide', () => {
    assert.deepEqual(Object.keys(NAMES).sort(), allGuides.map(([id]) => id).sort());
  });
  const byId = Object.fromEntries(allGuides);
  for (const [id, [src, names]] of Object.entries(NAMES)) {
    it(`${id}: every pinned name is on the screen AND in the guide`, () => {
      const gt = textOf(byId[id]);
      for (const n of names) {
        // the end screen's title is written with an ASCII apostrophe in code
        const inSrc = src.includes(n) || src.includes(n.replace('’', "'"));
        assert.ok(inSrc, `${id}: "${n}" is no longer in the lab source — update the guide`);
        assert.ok(gt.includes(n), `${id}: the guide never names "${n}"`);
      }
    });
  }
  it('every "NEXT: … ›" the guides quote is the shared label for the next step', () => {
    assert.match(code('src/screens/lab/kit/labNav.ts'), /return nextTitle \? `NEXT: \$\{nextTitle\.toUpperCase\(\)\} ›` : 'FINISH · SEE WHAT’S LEFT ›';/);
    STEPS.forEach((st, i) => {
      const quoted = [...textOf(G[st.key]).matchAll(/NEXT: ([^›]+) ›/g)].map((m) => m[1]);
      if (i < STEPS.length - 1) assert.deepEqual(quoted, [STEPS[i + 1].title.toUpperCase()], `${st.key}: NEXT label`);
      else assert.deepEqual(quoted, [], 'the last step has no NEXT: label');
    });
    assert.match(G.locker.control.join(' '), /FINISH · SEE WHAT’S LEFT ›/);
  });
  it('chip labels the guides quote are derived exactly as the screen derives them', () => {
    // curves: the part after "·"; environment: the letter before "·"
    assert.match(s, /label=\{\(x\.name\.split\('·'\)\[1\] \?\? x\.name\)\.trim\(\)\}/);
    assert.deepEqual(D.CURVES.map((c: { name: string }) => (c.name.split('·')[1] ?? c.name).trim()), ['Relatively flat', 'Presence rise (3–6 kHz)', 'Low-frequency rolloff', 'Extended high-frequency response', 'Strongly shaped (application-voiced)']);
    assert.match(s, /label=\{s\.title\.split\('·'\)\[0\]\.trim\(\)\}/);
    assert.deepEqual(D.ENV_SCENARIOS.map((e: { title: string }) => e.title.split('·')[0].trim()), ['A', 'B', 'C']);
    // challenge variants: the first sentence of each prompt
    assert.match(s, /label=\{variantsDone\.has\(v\.key\) \? `✓ \$\{v\.prompt\.split\('\.'\)\[0\]\}` : v\.prompt\.split\('\.'\)\[0\]\}/);
    const chips = D.CHALLENGE_VARIANTS.map((v: { prompt: string }) => v.prompt.split('.')[0]);
    assert.deepEqual(chips, ['The boom operator is no longer available', 'The interview is now inside a quiet studio', 'The interviewee must walk around freely']);
    for (const c of chips) assert.ok(G.challenge.control.join(' ').includes(`"${c}"`), `challenge guide lacks "${c}"`);
  });
  it('the defaults the guides call "shown first" are the screen’s initial state', () => {
    assert.match(s, /useState<string \| null>\('dynamic'\)/);
    assert.match(s, /useState\(CHARACTERISTICS\[0\]\.key\)/);
    assert.equal(D.CHARACTERISTICS[0].name, 'Polar pattern');
    assert.match(s, /useState<PatternKey>\('cardioid'\)/);
    assert.match(s, /const \[sel, setSel\] = useState\('a'\);/);
    assert.match(s, /const \[mic, setMic\] = useState\('cond'\);/);
    assert.match(s, /const \[sel, setSel\] = useState\('dyn'\);/);
    assert.match(s, /const \[sel, setSel\] = useState\('studio'\);/);
    assert.match(s, /const \[group, setGroup\] = useState\('voice'\);\s*const \[job, setJob\] = useState\('livevocal'\);/);
  });
});

describe('3. every verdict and count a TRY THIS quotes is what the screen computes', () => {
  it('Lesson 1 + 2 counts: 12 types (4 transducer, 8 form), 16 characteristics', () => {
    assert.equal(D.MIC_TYPES.length, 12);
    assert.equal(D.MIC_TYPES.filter((m: { klass: string }) => m.klass === 'transducer').length, 4);
    assert.equal(D.MIC_TYPES.filter((m: { klass: string }) => m.klass === 'form').length, 8);
    assert.equal(D.CHARACTERISTICS.length, 16);
    assert.match(G.types.seeing[0], /^Twelve microphone types/);
    assert.match(G.chars.seeing[0], /^Sixteen characteristic chips/);
    const shotgun = D.MIC_TYPES.find((m: { key: string }) => m.key === 'shotgun');
    assert.equal(shotgun.klass, 'form');
    assert.match(shotgun.what, /\(condenser\) capsule/);
    // COMPARE: a third pick replaces the older of the two
    assert.match(s, /\[\.\.\.p\.slice\(-1\), key\]/);
  });

  // Lesson 3 — the screen's verdict rule, pinned verbatim, then re-run.
  it('Lesson 3: the verdict thresholds (picked up ≥ 0.6, partial 0.25–0.6)', () => {
    assert.match(s, /const picked = rr >= 0\.6;/);
    assert.match(s, /const partial = rr >= 0\.25 && rr < 0\.6;/);
    assert.match(s, /return wanted \? \{ v: '⚠ missed', c: '#ff8a6b' \} : \{ v: '✓ rejected', c: colors\.green \};/);
  });
  const verdict = (p: string, key: string) => {
    const src = D.STAGE_SOURCES.find((x: { key: string }) => x.key === key);
    const rr = D.polarR(p, (src.angleDeg * Math.PI) / 180);
    const wanted = src.wanted === true;
    if (rr >= 0.25 && rr < 0.6) return '△ partial';
    if (rr >= 0.6) return wanted ? '✓ picked up' : '⚠ picked up';
    return wanted ? '⚠ missed' : '✓ rejected';
  };
  it('Lesson 3 TRY THIS: the wedge, the drums, and Omni', () => {
    assert.equal(verdict('cardioid', 'monitor'), '✓ rejected');
    assert.equal(verdict('hyper', 'monitor'), '△ partial');
    assert.equal(verdict('fig8', 'monitor'), '⚠ picked up');
    assert.equal(verdict('cardioid', 'drums'), '△ partial');
    assert.equal(verdict('hyper', 'drums'), '✓ rejected');
    for (const k of ['audience', 'drums', 'monitor', 'wall', 'hvac']) assert.equal(verdict('omni', k), '⚠ picked up');
    assert.equal(verdict('omni', 'source'), '✓ picked up');
    const reason = D.PATTERN_REASONS.find((r: { text: string }) => r.text === 'Need equal pickup in all directions');
    assert.deepEqual(reason.goodFor, ['omni']);
    const t = G.patterns.tryThis;
    assert.match(t[0], /Cardioid the Wedge monitor, straight behind, reads ✓ rejected\. Hypercardioid: △ partial — its rear lobe\. Figure-8: ⚠ picked up\./);
    assert.match(t[1], /△ partial on Cardioid but ✓ rejected on Hypercardioid/);
    assert.match(t[2], /every unwanted neighbor reads ⚠ picked up \(only the Singer stays ✓\)/);
    // the wedge really is straight behind, the drums really off to the side
    assert.equal(D.STAGE_SOURCES.find((x: { key: string }) => x.key === 'monitor').angleDeg, 180);
    assert.equal(D.STAGE_SOURCES.find((x: { key: string }) => x.key === 'drums').angleDeg, 96);
  });

  it('Lesson 4: rolloff lists rumble/handling/stage wash/HVAC; the presence hump sits right of centre', () => {
    const c = D.CURVES.find((x: { key: string }) => x.key === 'c');
    for (const w of ['Rumble', 'handling noise', 'stage wash', 'HVAC']) assert.ok(c.attenuate.includes(w), w);
    const b = D.CURVES.find((x: { key: string }) => x.key === 'b');
    const peak = b.pts.reduce((a: [number, number], p: [number, number]) => (p[1] > a[1] ? p : a));
    assert.ok(peak[0] > 0.6, `presence peak at x=${peak[0]}`);
    // x is log 20 Hz → 20 kHz: the peak lands in 3–6 kHz
    const hz = 20 * 10 ** (peak[0] * 3);
    assert.ok(hz >= 3000 && hz <= 6000, `${hz.toFixed(0)} Hz`);
    const e = D.CURVES.find((x: { key: string }) => x.key === 'e');
    assert.match(e.useful, /kick-drum-style voicing/);
  });

  it('Lesson 4: the "1 kHz" tick sits at log10(1000/20)/3 ≈ 0.566 of the log axis, not the centre (632 Hz)', () => {
    // Centre of a 20 Hz → 20 kHz log axis is 20 × 10^1.5 ≈ 632 Hz; 1 kHz is at ≈ 0.566.
    assert.ok(Math.abs(20 * 10 ** 1.5 - 632.5) < 1);
    assert.ok(Math.abs(Math.log10(1000 / 20) / 3 - 0.566) < 0.001);
    const src = code('src/screens/lab/micselect/MicSelectLabScreen.tsx');
    const curves = src.slice(src.indexOf('function CurvesStep'), src.indexOf('function', src.indexOf('function CurvesStep') + 20));
    // The curve and the tick use the same x map: 10 + x * (w - 20).
    assert.match(curves, /10 \+ x \* \(w - 20\)/);
    assert.match(curves, /left: 10 \+ \(Math\.log10\(1000 \/ 20\) \/ 3\) \* \(w - 20\) - 20, width: 40, textAlign: 'center'/);
    assert.doesNotMatch(curves, /alignSelf: 'center'[^>]*>\s*1 kHz/);
  });

  it('Lesson 5: the SPL verdicts quoted (condenser ↔ dynamic swap at the ends)', () => {
    const M = D.SPL_MATCH;
    assert.equal(M.vquiet.cond.v, 'good');
    assert.equal(M.vloud.cond.v, 'caution');
    assert.equal(M.vquiet.dyn.v, 'caution');
    assert.equal(M.vloud.dyn.v, 'good');
    assert.equal(M.quiet.lav.v, 'good');
    assert.match(M.quiet.lav.note, /Speech is what a lavalier is designed around/);
    assert.equal(M.loud.cond.v, 'watch');
    assert.match(s, /m\.v === 'good' \? '✓ good match' : m\.v === 'watch' \? '△ depends' : '⚠ caution'/);
    const t = G.spl.tryThis;
    assert.match(t[0], /Very quiet reads ✓ good match, Extremely loud ⚠ caution\. Switch to Moving-coil dynamic and the two swap/);
    assert.match(t[1], /Quiet: ✓ good match/);
    assert.match(t[2], /Loud reads △ depends/);
  });

  it('Lesson 6: 48 V lights only for Condenser', () => {
    const powered = D.POWER_CASES.filter((p: { powered: boolean }) => p.powered).map((p: { name: string }) => p.name);
    assert.deepEqual(powered, ['Condenser']);
    assert.match(s, /styles\.phantomBadge, pc\.powered && styles\.phantomBadgeOn/);
    assert.match(D.POWER_NUANCE, /Most tube \(valve\) condensers/);
  });

  it('Lesson 7: only Lavalier and Headworn list Theater', () => {
    const theater = D.FORM_FACTORS.filter((f: { apps: string[] }) => f.apps.includes('Theater')).map((f: { name: string }) => f.name);
    assert.deepEqual(theater, ['Lavalier', 'Headworn']);
    assert.equal(D.FORM_FACTORS.length, 7);
  });

  it('Lesson 8: B tops with Feedback rejection (pattern!), C with Wind protection', () => {
    const env = Object.fromEntries(D.ENV_SCENARIOS.map((e: { key: string; priorities: string[] }) => [e.key, e.priorities]));
    assert.equal(env.stage[0], 'Feedback rejection (pattern!)');
    assert.equal(env.outdoor[0], 'Wind protection');
  });

  it('Lesson 9: the star ratings quoted', () => {
    const job = (g: string, j: string) => Object.fromEntries(D.JOB_GROUPS.find((x: { key: string }) => x.key === g).jobs.find((x: { key: string }) => x.key === j).ratings);
    const lv = job('voice', 'livevocal');
    assert.equal(lv['Feedback rejection'], 5);
    assert.equal(lv['Ruggedness'], 5);
    const sv = job('voice', 'studiovocal');
    assert.equal(sv['Tonal detail'], 5);
    assert.equal(sv['Self-noise'], 5);
    const vo = job('voice', 'voiceover');
    assert.deepEqual([vo['Self-noise'], vo['Tonal detail'], vo['Ruggedness']], [5, 5, 1]);
    const kick = job('instruments', 'kick');
    assert.deepEqual([kick['Max SPL'], kick['Self-noise']], [5, 1]);
    const strings = job('instruments', 'strings');
    assert.deepEqual([strings['Self-noise'], strings['Max SPL']], [5, 1]);
    assert.equal(job('production', 'measure')['Voicing'], 1);
  });

  it('Challenge: B is correct with the three key factors; the variants pick D (E also), then A', () => {
    assert.equal(D.CHALLENGE_BASE.correct, 'B');
    assert.equal(D.CHALLENGE_MICS.find((m: { key: string }) => m.key === 'B').kind, 'shotgun');
    assert.deepEqual(D.CHALLENGE_FACTORS.filter((f: { correct: boolean }) => f.correct).map((f: { label: string }) => f.label), ['Directionality', 'Working distance / application', 'Wind protection']);
    const v = Object.fromEntries(D.CHALLENGE_VARIANTS.map((x: { key: string }) => [x.key, x]));
    assert.equal(v.noboom.correct, 'D');
    assert.deepEqual(v.noboom.accept, ['E']);
    assert.equal(D.CHALLENGE_MICS.find((m: { key: string }) => m.key === 'D').kind, 'dynamic');
    assert.equal(D.CHALLENGE_MICS.find((m: { key: string }) => m.key === 'E').kind, 'lav');
    assert.equal(v.studio.correct, 'A');
    assert.equal(D.CHALLENGE_MICS.find((m: { key: string }) => m.key === 'A').kind, 'ldc');
    // CHANGE ONE VARIABLE waits for the base brief to be checked once
    assert.match(s, /\{baseTried \|\| variantsDone\.size > 0 \? \(/);
  });

  it('Locker: ten mics, six slots, ten jobs; five mics cover all ten (four cannot); the hint jobs have one mic each', () => {
    assert.equal(D.LOCKER_MICS.length, 10);
    assert.equal(D.LOCKER_SLOTS, 6);
    assert.equal(D.LOCKER_JOBS.length, 10);
    const mics = D.LOCKER_MICS as { key: string; name: string; covers: string[] }[];
    const covers = (set: number[]) => new Set(set.flatMap((i) => mics[i].covers)).size;
    let best = 99;
    for (let mask = 1; mask < 1 << mics.length; mask++) {
      const set = mics.map((_, i) => i).filter((i) => mask & (1 << i));
      if (set.length <= D.LOCKER_SLOTS && covers(set) === 10) best = Math.min(best, set.length);
    }
    assert.equal(best, 5);
    const byJob = (name: string) => {
      const key = D.LOCKER_JOBS.find((j: { name: string }) => j.name === name).key;
      return mics.filter((m) => m.covers.includes(key)).length;
    };
    for (const j of ['Kick drum', 'Snare', 'Live vocal', 'Choir']) assert.equal(byJob(j), 1, j);
    // the second LDC adds nothing after the first
    const ldc = mics.find((m) => m.name === 'Large-diaphragm condenser')!;
    const ldc2 = mics.find((m) => m.name === 'Second large-diaphragm condenser')!;
    assert.ok(ldc2.covers.every((c) => ldc.covers.includes(c)));
    assert.match(s, /color: covered\.size >= 9 \? colors\.green : colors\.amber/);
    assert.match(G.locker.tryThis[0], /five well-chosen mics can do it\. Hint: Kick drum, Snare, Live vocal and Choir each have only one mic that covers them/);
  });
});

describe('4. wiring', () => {
  it('LabHeader gets the step guide (the end guide on the end screen) inside a ScreenGuideHost, no regions', () => {
    assert.match(s, /import \{ ScreenGuideHost \} from '\.\.\/\.\.\/\.\.\/features\/lab\/screenGuide';/);
    assert.match(s, /import \{ micSelScreenGuide \} from '\.\/micSelectScreenGuides';/);
    assert.match(s, /<ScreenGuideHost resetKey=\{ending \? 'end' : s\.key\} regions=\{false\}>\s*(?:\{\}\s*)*<LabHeader/);
    assert.match(s, /guide=\{micSelScreenGuide\(s\.key, ending\)\}/);
    assert.match(s, /guideTitle=\{ending \? 'MICROPHONE SELECTION LAB' : s\.title\}/);
    assert.match(s, /<\/ScrollView>\s*\)\}\s*<\/ScreenGuideHost>\s*<\/View>/);
  });
});

describe('5. the accuracy-chip decision', () => {
  it('a CONCEPT lab: the chip is gone and the ⓘ takes its spot', () => {
    assert.doesNotMatch(s, /AccuracyNote/);
    // no microphone, no engine, no measured number anywhere in the lab
    assert.doesNotMatch(s, /ApeDsp|useMicrophone|getUserMedia|AudioRecorder|requestRecordingPermissions/);
  });
  it('the chip’s honesty point is carried where the drawings are', () => {
    assert.match(G.patterns.seeing.join(' '), /teaching shapes, not a real mic’s chart/);
    assert.match(G.curves.seeing.join(' '), /fictional but realistic/);
    // …and both are still said on the screens themselves
    assert.match(code('src/screens/lab/micselect/polarStage.tsx'), /TOP VIEW · DIRECTIONS ONLY, NOT TO SCALE/);
    assert.match(s, /Every curve below is fictional but realistic/);
  });
});

describe('guide fixes vetted against the screen (2026-10-31 review round)', () => {
  it('the reasoning line shows only on the original brief after a defensible pick', () => {
    assert.match(s, /\{!variant && \(correctPick \|\| acceptedPick\) \? \(/);
    assert.match(G.challenge.changes.join(' '), /On the original brief, once the pick is defensible, a reasoning line/);
  });
  it('LAB COMPLETE = every page opened AND the check passed (D41 #8/#9: the check is a CHECK unit)', () => {
    assert.match(s, /cleared=\{endCleared\}/);
    assert.match(s, /units=\{endUnits\}/);
    assert.match(s, /id: UNDERSTANDING_UNIT, label: 'Check your understanding', kind: 'check'/);
    assert.match(s, /if \(banked\.has\(UNDERSTANDING_UNIT\)\) out\.add\(UNDERSTANDING_UNIT\);/);
    // The CHECK row stays on the end screen (the check is drawn there), never back to Lesson 1.
    assert.match(s, /onJump=\{\(id\) => \{ if \(id !== UNDERSTANDING_UNIT\) goTo\(/);
    assert.match(code('src/features/lab/trainingLabKeys.ts'), /route: 'MicSelectLab', key: 'tr_mic_select', completion: 'understanding'/);
    assert.match(END.seeing[0], /LAB COMPLETE once every step is opened, the mic locker \(marked Optional\) included, and the check is passed/);
    assert.match(END.seeing[0], /CHECK row/);
  });
  it('the shared kit never shows LAB COMPLETE above an unpassed check (re-derived with labEnd)', async () => {
    const { whatsLeft, endTitle, endLead } = await import('../src/screens/lab/kit/labEnd.ts');
    const keys = [...s.matchAll(/^\s{4}key: '([a-z]+)',$/gm)].map((m) => m[1]);
    assert.ok(keys.includes('locker') && keys.length === 11, `STEPS keys: ${keys.join(',')}`);
    const units = [
      ...keys.map((k) => ({ id: k, label: k, ...(k === 'locker' ? { detail: 'Optional' } : null) })),
      { id: 'understanding', label: 'Check your understanding', kind: 'check' as const },
    ];
    const allOpened = new Set(keys);
    const w = whatsLeft(units, allOpened);
    assert.equal(endTitle(w), "WHAT'S LEFT");
    assert.match(endLead(w, { mode: 'progress', noun: 'lesson', guest: false }), /^Only the check is left/);
    assert.equal(endTitle(whatsLeft(units, new Set([...keys, 'understanding']))), 'LAB COMPLETE');
    // The locker still counts (owner ruling 2026-10-31).
    assert.equal(endTitle(whatsLeft(units, new Set([...keys.filter((k) => k !== 'locker'), 'understanding']))), "WHAT'S LEFT");
  });
  it('the locker row is labelled Optional but still counts toward LAB COMPLETE (owner ruling 2026-10-31)', () => {
    assert.match(s, /detail: st\.tag === 'OPTIONAL' \? 'Optional' : undefined/);
    assert.doesNotMatch(s, /optional: st\.tag === 'OPTIONAL'/);
  });
  it('opened lessons sit under the collapsed REVIEW ▾, so the end TRY THIS says so', () => {
    assert.match(code('src/screens/lab/kit/LabEndScreen.tsx'), /const \[showCredited, setShowCredited\] = useState\(false\);/);
    for (const t of END.tryThis) assert.match(t, /under REVIEW ▾ once opened/);
  });
  it('Microphone Principles is an Audio Fundamentals lab; this lab is not', () => {
    assert.match(END.teaches.join(' '), /one of the Audio Fundamentals labs/);
  });
});
