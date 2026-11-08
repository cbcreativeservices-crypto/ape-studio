/**
 * Screen Guide rollout — Microphone Principles + Speaker Placement & Coverage
 * (owner 2026-10-31) — receipts. Pattern: test/screenGuide_20261031.test.ts
 * (the Wave Physics pilot).
 *
 *   1. every section of both labs (the units.ts ids) and each lab's
 *      what's-left screen has a guide with all five sections, 1–5 bullets,
 *      2–3 TRY THIS experiments, each step inside its no-scroll budget, in the
 *      house copy rules;
 *   2. each guide quotes the screen's REAL names — every pinned name is in
 *      both the guide and the lab's source (rename one → update the guide);
 *   3. every TRY THIS number is what the screen prints: recomputed here from
 *      the screen's own formulas, which are pinned verbatim;
 *   4. wiring: LabHeader `guide` (per section, the end guide on the end
 *      screen) and a ScreenGuideHost wrapping the root's content, regions
 *      only where a Rack Unit draws them;
 *   5. the accuracy-chip decision (correction, owner rule 2026-10-31):
 *      SPEAKER COVERAGE is one of the owner's OWN named examples of a lab that
 *      keeps the chip — so its header KEEPS the compact AccuracyNote with the
 *      ⓘ beside it (as Room Design). Microphone Principles is a CONCEPT lab
 *      (illustrative model drawn from the equations, no live mic) and stays
 *      chip-free, the ⓘ in the chip's spot.
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it } from 'node:test';

const ROOT = process.cwd();
const read = (p: string) => readFileSync(join(ROOT, p), 'utf8').replace(/\r\n/g, '\n');
/** Source with comments stripped — a name in a comment proves nothing. */
const code = (p: string) => read(p).replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '').replace(/\{\/\*[\s\S]*?\*\/\}/g, '');

const G = await import('../src/screens/lab/micspeaker/micSpeakerScreenGuides.ts');
const U = await import('../src/screens/lab/micspeaker/units.ts');
const { SCREEN_GUIDE_SECTIONS, SCREEN_GUIDE_BUDGET } = await import('../src/features/lab/screenGuide/types.ts');

type Guide = Record<string, string[]>;
const SECTION_KEYS = SCREEN_GUIDE_SECTIONS.map((s: { key: string }) => s.key);
const MIC = G.MIC_SCREEN_GUIDES as unknown as Record<string, Guide>;
const SPK = G.SPEAKER_SCREEN_GUIDES as unknown as Record<string, Guide>;
const allGuides: [string, Guide][] = [
  ...Object.entries(MIC).map(([k, v]) => [`mic.${k}`, v] as [string, Guide]),
  ['mic.end', G.MIC_END_GUIDE as unknown as Guide],
  ...Object.entries(SPK).map(([k, v]) => [`speaker.${k}`, v] as [string, Guide]),
  ['speaker.end', G.SPEAKER_END_GUIDE as unknown as Guide],
];
const textOf = (gd: Guide) => SECTION_KEYS.map((k: string) => gd[k].join('\n')).join('\n');

const MIC_SCREEN = 'src/screens/lab/micspeaker/MicPrinciplesLabScreen.tsx';
const SPK_SCREEN = 'src/screens/lab/micspeaker/SpeakerCoverageLabScreen.tsx';
const VIZ = 'src/screens/lab/micspeaker/viz.tsx';

describe('1. every screen of both labs has a complete guide', () => {
  it('one guide per section id — no missing, no extra (units.ts is the list)', () => {
    assert.deepEqual(Object.keys(MIC).sort(), [...U.MIC_PRINCIPLES_UNITS].sort());
    assert.deepEqual(Object.keys(SPK).sort(), [...U.SPEAKER_COVERAGE_UNITS].sort());
    assert.equal(Object.keys(MIC).length, 10);
    assert.equal(Object.keys(SPK).length, 3);
  });
  for (const [id, gd] of allGuides) {
    it(`${id}: all five sections, 1–5 bullets each, 2–3 TRY THIS`, () => {
      assert.deepEqual(Object.keys(gd).filter((k) => k !== 'intro').sort(), [...SECTION_KEYS].sort());
      const intro = (gd as unknown as { intro?: { learning: string; start: string } }).intro;
      assert.ok(intro && intro.learning.trim().length > 10 && intro.start.trim().length > 10, `${id}: the intro card (learning + start)`);
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
      for (const s of SCREEN_GUIDE_SECTIONS as readonly { key: string; place: string }[]) {
        if (s.place === 'strip') {
          for (const item of gd.tryThis) if (item.length > SCREEN_GUIDE_BUDGET.tryItem) over.push(`${id}.tryThis (${item.length})`);
          continue;
        }
        const n = gd[s.key].join(' ').length;
        const cap = s.place === 'high' ? SCREEN_GUIDE_BUDGET.high : SCREEN_GUIDE_BUDGET.low;
        if (n > cap) over.push(`${id}.${s.key}: ${n} > ${cap}`);
      }
    }
    assert.deepEqual(over, []);
  });
  it('house copy rules: knowledge not skills, no "N of total", no "recommend", no build notes, no gear makers', () => {
    for (const [id, gd] of allGuides) {
      const t = textOf(gd);
      assert.doesNotMatch(t, /\byou(’|')?ll (master|build|mix|be able)|\bmaster(y)?\b|\byou will learn to\b/i, `${id}: claims a skill`);
      assert.doesNotMatch(t, /\b\d+\s+of\s+\d+\b/i, `${id}: an "N of total"`);
      assert.doesNotMatch(t, /\brecommend/i, `${id}: "recommend" (house word is "suggest")`);
      assert.doesNotMatch(t, /\b(TODO|FIXME|placeholder|walkthrough|owner 20\d\d)\b/i, `${id}: a build note in learner text`);
      assert.doesNotMatch(t, /\b(Shure|Sennheiser|Neumann|AKG|Audio-Technica|Electro-Voice|Rode|Beyerdynamic|Sony|JBL|QSC|Meyer|d&b|L-Acoustics|Bose|Yamaha|SM58|SM57)\b/i, `${id}: a gear maker/model name`);
    }
  });
});

describe('2. each guide quotes its screen’s real names', () => {
  const MIC_SRC = [MIC_SCREEN, VIZ, 'src/screens/lab/kit/ExpandableFigure.tsx', 'src/features/lab/guidedLessons/toolHelp.tsx', 'src/screens/lab/kit/labNav.ts']
    .map(code)
    .join('\n');
  const SPK_SRC = [SPK_SCREEN, VIZ, 'src/features/lab/guidedLessons/toolHelp.tsx'].map(code).join('\n');
  const END_SRC = ['src/screens/lab/kit/LabEndScreen.tsx', 'src/screens/lab/kit/labEnd.ts'].map(code).join('\n');
  const NAMES: Record<string, [string, string[]]> = {
    'mic.capsule': [MIC_SRC, ['e = B · l · v', 'VELOCITY', '⊗/⊙', 'FULL SCREEN', 'WHAT THE DISPLAY SHOWS', '‹ PREV', 'NEXT ›']],
    'mic.polar': [MIC_SRC, ['PATTERN', 'SOURCE', 'PICKUP', 'NULL ≤−26 dB', 'DRAG THE SPEAKER — ANYWHERE', 'OMNI', 'CARDIOID', 'SUPER', 'HYPER', 'FIGURE-8']],
    'mic.distance': [MIC_SRC, ['DIST', 'LEVEL', 'DIRECT', 'ROOM', 'DISTANCE']],
    'mic.proximity': [MIC_SRC, ['DIST', 'BOOST', 'MIC', 'DISTANCE', 'CARDIOID', 'OMNI', 'FLAT', 'NONE', 'GAP']],
    'mic.offaxis': [MIC_SRC, ['ANGLE', '@100 Hz', '@8 kHz', 'PRESET']],
    'mic.stereo': [MIC_SRC, ['TECHNIQUE', 'STEREO FROM', 'LEVEL+TIME', 'XY', 'ORTF', 'AB', 'MID-SIDE', 'MIX', 'IN MONO']],
    'mic.pop': [MIC_SRC, ['BARRIER', 'BLAST AT CAPSULE', 'PLOSIVE ENERGY REACHING THE CAPSULE', 'NONE', 'POP FILTER', 'FOAM', 'SHOTGUN WINDSHIELD']],
    'mic.shock': [MIC_SRC, ['MOUNT', 'INTO MIC', 'RIGID MOUNT', 'SHOCK MOUNT', 'STAND SHAKE — 100% (THE SOURCE)', 'VIBRATION TRANSMITTED INTO THE MIC', 'AT THE CAPSULE — ', '% OF THE SHAKE']],
    'mic.hand': [MIC_SRC, ['GRIP', 'PATTERN', 'INTACT', 'DEGRADING', 'COLLAPSED', 'POSITION', 'LOW HANDLE', 'CORRECT', 'GRILLE RIM', 'FULL CUP', 'WHY IT HAPPENS ▾', 'Correct grip ✅']],
    'mic.mistakes': [MIC_SRC, ['Correct grip', 'Holding the grille', 'Cupping the grille', 'Pointing away', 'Too far away', 'Covering the switch', 'Blocking the antenna', 'SPOT THE MISTAKE — 3 ROUNDS']],
    'mic.end': [END_SRC, ['LAB COMPLETE', 'REVIEW ▾', 'PRACTICE AGAIN FROM THE START', 'DONE · BACK TO LABS']],
    'speaker.top': [SPK_SRC, ['5 m', 'EDIT', 'POS', 'AIM', 'PATTERN', 'POSITION', '60°×40°', '90°×60°', '100°×100°', '120°×60°', 'SPKR 1', 'SPKR 2', 'FILLS', 'RED / ORANGE', 'GREEN', 'BLACK', 'tight']],
    'speaker.side': [SPK_SRC, ['5 m', 'HEIGHT', 'TILT', 'V PATTERN', 'ARRAY', 'ROOM', 'flown high', 'STAGE HEIGHT', 'CEILING HEIGHT', 'AUDIENCE DISTANCE', 'FLAT SEATING', 'SLOPED SEATING', 'SYSTEM', 'ADD DELAY SPEAKER', 'LINE ARRAY', 'REAR DELAY SPKR', 'TIME-ALIGNED', 'MISALIGNED']],
    'speaker.read': [SPK_SRC, ['RED / ORANGE', 'YELLOW', 'GREEN', 'CYAN / BLUE', 'BLACK', 'COVERAGE', 'DISPERSION', 'HOT SPOT', 'DEAD ZONE', 'OVERLAP', 'FRONT FILLS', 'DELAY SPEAKERS', 'THE BIG IDEA', 'WHAT THE DISPLAY SHOWS']],
    'speaker.end': [END_SRC, ['LAB COMPLETE', 'REVIEW ▾', 'PRACTICE AGAIN FROM THE START', 'DONE · BACK TO LABS']],
  };
  it('a name list for every guide', () => {
    assert.deepEqual(Object.keys(NAMES).sort(), allGuides.map(([id]) => id).sort());
  });
  const byId = Object.fromEntries(allGuides);
  for (const [id, [src, names]] of Object.entries(NAMES)) {
    it(`${id}: every pinned name is on the screen AND in the guide`, () => {
      const gt = textOf(byId[id]);
      for (const n of names) {
        assert.ok(src.includes(n), `${id}: "${n}" is no longer in the screen source — update the guide`);
        assert.ok(gt.includes(n), `${id}: the guide never names "${n}"`);
      }
    });
  }
  it('the section ids are the screens’ own SECTIONS keys, typed by the guide file', () => {
    assert.match(code(MIC_SCREEN), /const SECTIONS: \{ key: MicSectionId;/);
    assert.match(code(SPK_SCREEN), /const SECTIONS: \{ key: SpeakerSectionId;/);
  });
});

describe('3. every TRY THIS number is what the screen prints', () => {
  const M = code(MIC_SCREEN);
  const V = code(VIZ);
  const S = code(SPK_SCREEN);
  const fmt1 = (v: number) => {
    const s = v.toFixed(1);
    return (s === '-0.0' ? '0.0' : s).replace('-', '−');
  };
  it('OFF-AXIS: 60° / 90° / 180° from viz.offAxisDb', () => {
    assert.match(V, /const broadband = 20 \* Math\.log10\(Math\.max\(0\.07, polarGain\(0\.5, 0\.5, th\)\)\);/);
    assert.match(V, /const hfCut = -\(angleDeg \/ 180\) \* 9;/);
    assert.match(V, /const hfMix = f <= 2000 \? 0 : Math\.min\(1, Math\.log2\(f \/ 2000\) \/ 3\);/);
    assert.match(M, /const OFF_ANGLES = \[0, 30, 60, 90, 180\];/);
    const off = (f: number, deg: number) => {
      const th = (deg * Math.PI) / 180;
      const bb = 20 * Math.log10(Math.max(0.07, Math.abs(0.5 + 0.5 * Math.cos(th))));
      const mix = f <= 2000 ? 0 : Math.min(1, Math.log2(f / 2000) / 3);
      return bb - (deg / 180) * 9 * mix;
    };
    const t = MIC.offaxis.tryThis.join('\n');
    for (const deg of [60, 90, 180]) {
      assert.ok(t.includes(`${fmt1(off(100, deg))} dB`), `@100 Hz at ${deg}°: ${fmt1(off(100, deg))}`);
      assert.ok(t.includes(`${fmt1(off(8000, deg))} dB`), `@8 kHz at ${deg}°: ${fmt1(off(8000, deg))}`);
    }
  });
  it('PROXIMITY: 1 in → +10 dB, 12 in → NONE, OMNI → FLAT', () => {
    assert.match(M, /const t = Math\.max\(0, Math\.min\(1, \(12 - inches\) \/ 11\)\);\s*return Math\.round\(10 \* Math\.pow\(t, 1\.4\) \* 10\) \/ 10;/);
    assert.match(M, /const inches = Math\.round\(\(12 - d01 \* 11\) \* 10\) \/ 10;/);
    assert.match(M, /v: directional \? \(boostDb > 0 \? `\+\$\{boostDb\} dB` : 'NONE'\) : 'FLAT'/);
    const t = MIC.proximity.tryThis.join('\n');
    for (const s of ['DIST reads 1 in', 'BOOST reads +10 dB', 'BOOST reads FLAT', '12 in: BOOST reads NONE']) assert.ok(t.includes(s), s);
  });
  it('DISTANCE: 4 in / 12 in / 48 in shares and levels; starts at 17 in', () => {
    assert.match(M, /const \[d01, setD01\] = useState\(0\.3\);\s*const inches = Math\.round\(4 \+ d01 \* 44\);\s*const relDb = -20 \* Math\.log10\(inches \/ 4\);/);
    assert.match(M, /const directE = Math\.pow\(4 \/ inches, 2\);\s*const ROOM_E = Math\.pow\(4 \/ 12, 2\);/);
    const at = (inches: number) => {
      const d = (4 / inches) ** 2;
      const r = (4 / 12) ** 2;
      return { lvl: fmt1(-20 * Math.log10(inches / 4)), direct: Math.round((d / (d + r)) * 100), room: Math.round((r / (d + r)) * 100) };
    };
    const t = MIC.distance.tryThis.join('\n');
    const a = at(4);
    assert.ok(t.includes(`LEVEL ${a.lvl} dB, DIRECT ${a.direct}% and ROOM ${a.room}%`), JSON.stringify(a));
    assert.equal(at(12).direct, 50);
    assert.ok(t.includes('both read 50%'));
    const z = at(48);
    assert.ok(t.includes(`DIST 48 in, LEVEL ${z.lvl} dB, ROOM ${z.room}%`), JSON.stringify(z));
    assert.equal(Math.round(4 + 0.3 * 44), 17);
    assert.ok(MIC.distance.control.join(' ').includes('You start at 17 in'));
  });
  it('POLAR: the nulls quoted are the patterns’ own (|A + B·cos θ| = 0)', () => {
    assert.match(M, /\{ key: 'super', label: 'SUPER', a: 0\.37, b: 0\.63,/);
    assert.match(M, /\{ key: 'hyper', label: 'HYPER', a: 0\.25, b: 0\.75,/);
    assert.match(M, /g < 0\.05 \? 'NULL ≤−26 dB'/);
    const nullDeg = (a: number, b: number) => Math.round((Math.acos(-a / b) * 180) / Math.PI);
    const c = MIC.polar.changes.join(' ');
    assert.ok(c.includes(`about ${nullDeg(0.37, 0.63)}° for SUPER`));
    assert.equal(Math.round(nullDeg(0.25, 0.75) / 10) * 10, 110);
    assert.ok(c.includes('about 110° for HYPER'));
    // Cardioid at 90° = 0.5 → −6.0 dB.
    assert.equal(fmt1(20 * Math.log10(0.5 + 0.5 * Math.cos(Math.PI / 2))), '−6.0');
  });
  it('PLOSIVES and HANDLING percentages are the screen’s own', () => {
    assert.match(M, /\{ key: 'none', label: 'NONE', pass: 1,/);
    assert.match(M, /\{ key: 'pop', label: 'POP FILTER', pass: 0\.3,/);
    assert.match(M, /\{ key: 'foam', label: 'FOAM', pass: 0\.5,/);
    assert.match(M, /\{ key: 'blimp', label: 'SHOTGUN WINDSHIELD', pass: 0\.12,/);
    const p = MIC.pop.tryThis.join('\n');
    for (const s of ['from 100% to 30%', 'FOAM (50%)', 'SHOTGUN WINDSHIELD (12%)']) assert.ok(p.includes(s), s);
    assert.match(M, /v: shock \? '15%' : '90%'/);
    assert.match(V, /const damp = shockMount \? 0\.15 : 0\.9;/);
    assert.ok(MIC.shock.tryThis.join('\n').includes('from 90% to 15%'));
  });
  it('HAND GRIP: each POSITION lands in the zone whose PATTERN word the guide quotes', () => {
    assert.match(M, /const ZONE_P_CORRECT = 0\.24;\s*const ZONE_P_RIM = 0\.48;\s*const ZONE_P_FULL = 0\.81;/);
    assert.match(M, /\{ label: 'LOW HANDLE', pos: 0,/);
    assert.match(M, /\{ label: 'GRILLE RIM', pos: 0\.62,/);
    assert.match(M, /\{ label: 'FULL CUP', pos: 1,/);
    const word = (pos: number) => (pos < 0.48 ? 'INTACT' : pos < 0.81 ? 'DEGRADING' : 'COLLAPSED');
    const t = MIC.hand.tryThis.join('\n');
    assert.ok(t.includes(`FULL CUP: PATTERN reads ${word(1)}`));
    assert.ok(t.includes(`GRILLE RIM: PATTERN reads ${word(0.62)}`));
    assert.ok(t.includes(`LOW HANDLE: PATTERN stays ${word(0)}`));
  });
  it('audit fixes 2026-10-31: claims the screen can actually show', () => {
    // CAPSULE: the coil never moves on screen (only waves, current, glow).
    assert.match(code('src/screens/lab/micspeaker/MicCutaway.tsx'), /return \{ opacity: 0\.25 \+ 0\.75 \* Math\.abs\(s\) \};/);
    const cap = textOf(MIC.capsule);
    assert.doesNotMatch(cap, /1,000×|mid-swing|ends of its travel/);
    // DISTANCE: 50/50 only at exactly 12 in (whole-inch steps) → the guide asks for DIST 12 in.
    const share = (inches: number) => Math.round(((4 / inches) ** 2 / ((4 / inches) ** 2 + (4 / 12) ** 2)) * 100);
    assert.deepEqual([share(11), share(12), share(13)], [54, 50, 46]);
    assert.ok(MIC.distance.tryThis.join('\n').includes('DIST reads 12 in: DIRECT and ROOM both read 50%'));
    // PROXIMITY: the shelf starts at 220 Hz and only reaches the full boost near 48 Hz.
    assert.match(V, /const x = Math\.min\(1, Math\.log2\(220 \/ f\) \/ 2\.2\);/);
    assert.equal(Math.round(220 / 2 ** 2.2), 48);
    assert.ok(MIC.proximity.teaches.join(' ').includes('starts at 220 Hz and climbs to about +10 dB near 50 Hz'));
    // POLAR: the PATTERN tray and the guide quote the same SUPER null.
    assert.match(M, /the null moves to ~126°/);
    // MISTAKES: the round prompt carries no "N of total".
    assert.doesNotMatch(M, /Round \$\{i \+ 1\} of/);
    // SIDE VIEW: REAR DELAY starts TIME-ALIGNED, so the learner taps that chip to reach MISALIGNED.
    assert.match(S, /const \[timeAligned, setTimeAligned\] = useState\(true\);/);
    assert.match(S, /label=\{timeAligned \? 'TIME-ALIGNED ●' : 'MISALIGNED'\}/);
    assert.ok(SPK.side.tryThis.join('\n').includes('then tap TIME-ALIGNED ● so it reads MISALIGNED'));
    // House spelling is US English, like the on-screen labels.
    for (const [id, gd] of allGuides) assert.doesNotMatch(textOf(gd), /colour|behaviour|centre|theatre|recognis/i, id);
  });
  it('SPEAKER: ranges and defaults quoted are the screen’s own', () => {
    assert.match(S, /onChange: \(v: number\) => setActive\(\{ \.\.\.active, aim: Math\.round\(v \* 120 - 60\) \}\)/);
    assert.match(S, /onChange: \(v\) => setTilt\(Math\.round\(v \* 40 - 5\)\)/);
    assert.match(S, /const \[tilt, setTilt\] = useState\(12\);/);
    assert.match(S, /const \[h01, setH01\] = useState\(0\.35\);/);
    assert.match(S, /const heightWord = \(h: number\) => \(h < 0\.3 \? 'low' : h > 0\.7 \? 'flown high' : 'mid'\);/);
    assert.match(S, /const \[topDispIdx, setTopDispIdx\] = useState\(1\);/); // 90°×60°
    assert.match(S, /const \[s2, setS2\] = useState\(\{ x: 0\.7, aim: 0 \}\);/); // stage left
    assert.match(S, /const \[fillSpread, setFillSpread\] = useState\(0\.125\);/); // "fills tight"
    assert.match(S, /const spreadWord = \(v: number\) => \(v < 0\.33 \? 'tight'/);
    const top = SPK.top.control.join(' ');
    assert.ok(top.includes('−60° to +60°') && top.includes('90°×60° (where you start)'));
    const side = SPK.side.control.join(' ');
    assert.ok(side.includes('−5° to 35°') && side.includes('You start at 12°') && side.includes('mid (where you start)'));
    assert.ok(SPK.top.tryThis.join('\n').includes('POS reads fills tight'));
  });
});

describe('4. wiring: the ⓘ key in each header, a host around each root', () => {
  const MS = code(MIC_SCREEN);
  const SS = code(SPK_SCREEN);
  it('Microphone Principles: per-section guide, the end guide on the end screen', () => {
    assert.match(MS, /import \{ ScreenGuideHost \} from '\.\.\/\.\.\/\.\.\/features\/lab\/screenGuide';/);
    assert.match(MS, /<LabHeader\s+title="MICROPHONE PRINCIPLES"[\s\S]*?guide=\{ending \? MIC_END_GUIDE : MIC_SCREEN_GUIDES\[s\.key\]\}/);
    assert.match(MS, /<View style=\{\[styles\.root, \{ paddingTop: insets\.top \+ 10 \}\]\}>(\s*\{\})*\s*<ScreenGuideHost resetKey=\{ending \? 'end' : s\.key\} regions=\{!ending && !s\.reading\}>\s*<LabHeader/);
    assert.match(MS, /<\/ScreenGuideHost>\s*<\/View>\s*<\/LabNavProvider>/);
  });
  it('Speaker Placement & Coverage: per-section guide, regions only on the two rack sections', () => {
    assert.match(SS, /import \{ ScreenGuideHost \} from '\.\.\/\.\.\/\.\.\/features\/lab\/screenGuide';/);
    assert.match(SS, /<LabHeader\s+title="SPEAKER PLACEMENT & COVERAGE"[\s\S]*?guide=\{ending \? SPEAKER_END_GUIDE : SPEAKER_SCREEN_GUIDES\[s\.key\]\}/);
    assert.match(SS, /<View style=\{\[styles\.root, \{ paddingTop: insets\.top \+ 10 \}\]\}>(\s*\{\})*\s*<ScreenGuideHost resetKey=\{ending \? 'end' : s\.key\} regions=\{!ending && rack !== null\}>\s*<LabHeader/);
    assert.match(SS, /<\/ScreenGuideHost>\s*<\/View>\s*<\/LabNavProvider>/);
  });
  it('the reading pages really have no Rack Unit (so regions off there is right)', () => {
    const block = (src: string, decl: string) => {
      const at = src.indexOf(decl);
      const rest = src.slice(at + decl.length);
      const next = rest.search(/\nfunction |\nexport function /);
      return next < 0 ? rest : rest.slice(0, next);
    };
    assert.match(MS, /key: 'capsule'[^\n]*reading: true/);
    assert.match(MS, /key: 'mistakes'[^\n]*reading: true/);
    assert.doesNotMatch(block(MS, 'function CapsuleSection('), /<RackUnit/);
    assert.doesNotMatch(block(MS, 'function MistakesSection('), /<RackUnit/);
    assert.match(SS, /const rack = sectionIdx === 0 \? \{ stage: topStage, params: topParams \} : sectionIdx === 1 \? \{ stage: sideStage, params: sideParams \} : null;/);
  });
});

describe('5. the accuracy chip: Speaker Coverage keeps it beside the ⓘ; Mic Principles (concept) goes without', () => {
  it('Speaker Coverage: the compact AccuracyNote stays in LabHeader’s right group, the ⓘ beside it (owner-named example)', () => {
    const c = code(SPK_SCREEN);
    assert.match(c, /import \{ AccuracyNote \} from '\.\.\/\.\.\/\.\.\/components\/AccuracyNote';/);
    // up to the header's OWN closing line (the chip's "/>" sits inside it)
    const header = c.match(/<LabHeader\s+title="SPEAKER PLACEMENT & COVERAGE"[\s\S]*?\n\s*\/>/)![0];
    assert.match(header, /right=\{<AccuracyNote compact \/>\}/);
    assert.match(header, /guide=\{ending \? SPEAKER_END_GUIDE : SPEAKER_SCREEN_GUIDES\[s\.key\]\}/);
    // LabHeader draws `right` FIRST and the key LAST, so chip and ⓘ sit side by side.
    assert.match(code('src/screens/lab/kit/LabNavBar.tsx'), /<View style=\{styles\.headerRight\}>\s*\{right\}\s*\{key\}\s*<\/View>/);
  });
  it('Microphone Principles: no AccuracyNote, nothing else in the header’s right group (a concept lab)', () => {
    const c = code(MIC_SCREEN);
    assert.doesNotMatch(c, /AccuracyNote/, `${MIC_SCREEN} still renders the accuracy chip`);
    assert.doesNotMatch(c, /<LabHeader[^>]*\bright=/, `${MIC_SCREEN}: nothing else in the header's right group`);
  });
  it('the reason holds: both screens say on the glass that they are models, not measurements', () => {
    assert.match(code(MIC_SCREEN), /'ILLUSTRATIVE MODEL — DRAWN FROM THE EQUATIONS, NOT A MEASUREMENT'/);
    assert.match(code(SPK_SCREEN), /const TOP_BADGE = 'CONCEPTUAL LEVEL MAP — ILLUSTRATIVE MODEL, NOT AN SPL PREDICTION';/);
    // No live input anywhere in either lab.
    for (const p of [MIC_SCREEN, SPK_SCREEN]) assert.doesNotMatch(code(p), /useMicrophone|getUserMedia|AudioRecorder|requestRecordingPermissions/);
  });
});
