/**
 * Screen Guide rollout — Cymatics Lab: Sound Made Visible (owner 2026-10-31)
 * — receipts. Pattern: test/screenGuide_20261031.test.ts (the Wave pilot) and
 * the Fundamentals tests (Digital: home + module host + what's-left).
 *
 * Every screen the learner reaches has a guide:
 *   home, what's-left (from the home AND the module host), the eight modules,
 *   the three studios' EXPLORE / LEARN / CHECK tabs, and the Pattern Gallery's
 *   four modes (browse / open / art / compare).
 *
 *   1. shape + house copy rules (and the commit-first Myth guide gives nothing away);
 *   2. every section within its no-scroll budget;
 *   3. each pinned on-screen name is in the guide AND in that screen's source;
 *   4. the TRY THIS numbers are what the models print at those settings;
 *   5. wiring + the accuracy-chip decision (a CONCEPT lab: chip off, ⓘ on).
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
const code = (p: string) =>
  read(p)
    .replace(/\{\/\*[\s\S]*?\*\/\}/g, '')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^\s*\/\/.*$/gm, '');

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

const G = await import('../src/screens/lab/cymatics/cymaticsScreenGuides.ts');
const { CYMATICS_MODULES } = await import('../src/screens/lab/cymatics/modules/registry.ts');
const { SCREEN_GUIDE_SECTIONS, SCREEN_GUIDE_BUDGET } = await import('../src/features/lab/screenGuide/types.ts');
const PM = await import('../src/features/cymatics/plateModes.ts');
const FA = await import('../src/features/cymatics/faraday.ts');
const MB = await import('../src/features/cymatics/membrane.ts');
const MU = await import('../src/features/cymatics/music.ts');
const { EXPERIMENTS } = await import('../src/features/cymatics/presets.ts');
const BZ = await import('../src/features/cymatics/plateBezel.ts');

type Guide = Record<string, string[]>;
const SECTION_KEYS = SCREEN_GUIDE_SECTIONS.map((s: { key: string }) => s.key);
const textOf = (gd: Guide) => SECTION_KEYS.map((k) => gd[k].join('\n')).join('\n');
const MODS = G.CYMATICS_SCREEN_GUIDES as unknown as Record<string, Guide>;
const STUDIOS = G.CYMATICS_STUDIO_GUIDES as unknown as Record<string, Guide>;
const GALLERY = G.CYMATICS_GALLERY_GUIDES as unknown as Record<string, Guide>;
const ALL: [string, Guide][] = [
  ['home', G.CYMATICS_HOME_GUIDE as unknown as Guide],
  ['end', G.CYMATICS_END_GUIDE as unknown as Guide],
  ...Object.entries(MODS).map(([k, v]) => [`module.${k}`, v] as [string, Guide]),
  ...Object.entries(STUDIOS).map(([k, v]) => [`studio.${k}`, v] as [string, Guide]),
  ['learn', G.CYMATICS_LEARN_GUIDE as unknown as Guide],
  ['learn.liquid', G.CYMATICS_LEARN_GUIDES.liquid as unknown as Guide],
  ['learn.membrane', G.CYMATICS_LEARN_GUIDES.membrane as unknown as Guide],
  ['check', G.CYMATICS_CHECK_GUIDE as unknown as Guide],
  ...Object.entries(GALLERY).map(([k, v]) => [`gallery.${k}`, v] as [string, Guide]),
];
const guideOf = (id: string): Guide => ALL.find(([k]) => k === id)![1];

describe('1. every Cymatics screen has a complete guide', () => {
  it('one guide per module (registry order), per studio, per gallery mode; home, end, learn and check', () => {
    assert.deepEqual(Object.keys(MODS).sort(), CYMATICS_MODULES.map((m: { id: string }) => m.id).sort());
    assert.deepEqual(Object.keys(STUDIOS).sort(), ['liquid', 'membrane', 'plate']);
    assert.deepEqual(Object.keys(GALLERY).sort(), ['art', 'browse', 'compare', 'open']);
    const gal = code('src/screens/lab/cymatics/GalleryScreen.tsx');
    assert.match(gal, /type Mode = 'browse' \| 'open' \| 'art' \| 'compare';/);
  });
  for (const [id, gd] of ALL) {
    it(`${id}: all five sections, 1–5 bullets each, none empty, 2–3 TRY THIS`, () => {
      assert.deepEqual(Object.keys(gd).sort(), [...SECTION_KEYS].sort());
      for (const k of SECTION_KEYS) {
        assert.ok(Array.isArray(gd[k]) && gd[k].length >= 1, `${id}.${k} is empty`);
        assert.ok(gd[k].length <= 5, `${id}.${k} has ${gd[k].length} bullets (max 5)`);
        for (const line of gd[k]) assert.ok(typeof line === 'string' && line.trim().length > 10, `${id}.${k}: a blank bullet`);
      }
      assert.ok(gd.tryThis.length >= 2 && gd.tryThis.length <= 3, `${id}: TRY THIS is 2–3 experiments`);
    });
  }
  it('house copy rules: knowledge not skills, no "N of total", "suggest" not "recommend", no build notes, no brands', () => {
    for (const [id, gd] of ALL) {
      // 'Glycerin–water 50/50' is a liquid's on-screen name (a mix ratio), not a count.
      const t = textOf(gd).replace(/Glycerin–water 50\/50/g, 'Glycerin–water');
      assert.doesNotMatch(t, /\byou(’|')?ll (master|build|mix|be able)|\bmaster(y|ed)?\b|\byou will learn to\b/i, `${id}: claims a skill`);
      assert.doesNotMatch(t, /\b\d+\s+of\s+\d+\b|\b\d+\s*\/\s*\d+\b/i, `${id}: an "N of total"`);
      assert.doesNotMatch(t, /\brecommend/i, `${id}: "recommend" (house word is "suggest")`);
      assert.doesNotMatch(t, /\b(TODO|FIXME|placeholder|walkthrough|owner 20\d\d)\b/i, `${id}: a build note in learner text`);
      assert.doesNotMatch(t, /\b(Pro Tools|Logic|Ableton|iZotope|Waves|Shure|Neumann|Sennheiser|Yamaha|Avid|Smaart|Dante|Kevlar|Mylar|Rossing)\b/, `${id}: a brand or a name`);
    }
  });
  it('the module guides place each module in the sequence the registry teaches', () => {
    CYMATICS_MODULES.forEach((m: { id: string; title: string }, i: number) => {
      const t = MODS[m.id].teaches.join(' ');
      if (i < CYMATICS_MODULES.length - 1) {
        assert.ok(t.includes(`Module ${i + 1}; ${CYMATICS_MODULES[i + 1].title} is next.`), `${m.id}: "Module ${i + 1}; ${CYMATICS_MODULES[i + 1].title} is next."`);
      } else {
        assert.match(t, /The last module/);
      }
    });
  });
  it('Evidence vs Myth is commit-first: its guide gives no verdict away', () => {
    const t = textOf(MODS.myth);
    const src = code('src/screens/lab/cymatics/modules/modMyth.tsx');
    const claims = [...src.matchAll(/claim: '([^']+)'/g)].map((m) => m[1]);
    assert.equal(claims.length, 6, 'six claims on the page');
    assert.match(t, /Six claims/);
    for (const c of claims) assert.ok(!t.includes(c.slice(0, 30)), `the guide quotes the claim "${c}"`);
    assert.doesNotMatch(t, /healing|emotion|universal|440 Hz|chord|measurement/i);
    // The score line on the page is an "N of total" — the guide never repeats it.
    assert.doesNotMatch(t, /\d+ of 6/);
  });
});

describe('2. every step fits its no-scroll budget', () => {
  it('seeing / changes / teaches ≤ low, control ≤ high, each TRY THIS item ≤ tryItem', () => {
    const over: string[] = [];
    for (const [id, gd] of ALL) {
      for (const s of SCREEN_GUIDE_SECTIONS as readonly { key: string; place: string }[]) {
        if (s.place === 'strip') {
          for (const item of gd.tryThis) if (item.length > SCREEN_GUIDE_BUDGET.tryItem) over.push(`${id}.tryThis (${item.length}): ${item.slice(0, 40)}…`);
          continue;
        }
        const n = gd[s.key].join(' ').length;
        const cap = s.place === 'high' ? SCREEN_GUIDE_BUDGET.high : SCREEN_GUIDE_BUDGET.low;
        if (n > cap) over.push(`${id}.${s.key}: ${n} > ${cap}`);
      }
    }
    assert.deepEqual(over, [], 'tighten the wording (keep it accurate) — a step must not need scrolling');
  });
});

describe('3. each guide quotes its screen’s real names', () => {
  const D = 'src/screens/lab/cymatics/';
  /** [guide form, source form] — the same name as the guide writes it and as the code holds it. */
  type Name = string | [string, string];
  const PIN: Record<string, { files: string[]; names: Name[] }> = {
    home: {
      files: [`${D}CymaticsHomeScreen.tsx`, `${D}modules/registry.ts`, 'src/components/LabUnderstandingCheck.tsx', 'src/screens/lab/ModuleAccordionRow.tsx'],
      names: ['SIMULATION · 240 mm ALUMINUM · FREE EDGES · CENTRE-DRIVEN', 'NEW HERE? START HERE ›', ['LEARN & EXPERIMENT', 'LEARN &amp; EXPERIMENT'], 'CHECK YOUR UNDERSTANDING', 'SEE WHAT’S LEFT ›', 'GUIDED LESSON', 'OPEN', 'What Is Cymatics?', ['OPEN THE … STUDIO ›', 'OPEN THE CHLADNI PLATE STUDIO ›']],
    },
    end: {
      files: ['src/screens/lab/kit/LabEndScreen.tsx', 'src/screens/lab/kit/labEnd.ts', `${D}modules/registry.ts`, `${D}CymaticsHomeScreen.tsx`, `${D}CymaticsModuleScreen.tsx`],
      names: [['WHAT’S LEFT', "WHAT'S LEFT"], 'ALL MODULES OPENED', 'REVIEW ▾', 'PRACTICE AGAIN FROM THE START', 'DONE · BACK TO LABS', 'What Is Cymatics?', ['✓ DONE', "'DONE'"]],
    },
    'module.intro': {
      files: [`${D}modules/modIntro.tsx`, `${D}modules/shared.tsx`, 'src/screens/lab/kit/ExpandableFigure.tsx'],
      names: ['PRESSURE WAVE', 'SAND ON THE PLATE', 'PHASE VIEW', 'RESPONSE vs FREQUENCY · CALCULATED', 'BEFORE YOU GO ON — A QUESTION', 'OPEN CHANGE ONE THING ›', ['At resonance · 104 Hz', 'At resonance · ${formatHz(f1)}'], ['Off resonance · 80.9 Hz', 'Off resonance · ${formatHz(f1 * 0.78)}'], ['⤢ FULL SCREEN', "'FULL SCREEN'"]],
    },
    'module.nodes': {
      files: [`${D}modules/modNodes.tsx`],
      names: ['Node lines', 'Phase', 'Heat map', 'Sand', '3D plate', 'MODE', 'DRIVE', 'LINES', 'RES', 'FREQ', 'JUMP TO A MODE', 'LAND ON', 'SHAPE', 'Square plate', 'Circular plate', 'VIEW', 'PLAY', 'SILENT'],
    },
    'module.change': {
      files: [`${D}modules/modChange.tsx`],
      names: ['VARY', 'LOCKED', 'PREDICT FIRST', 'CHANGE B FIRST — THEN READ IT', 'REVEAL HOW TO READ IT ›', 'Material', 'Size', 'Thickness', 'Shape', 'Driver position', 'Support', 'Damping', 'Sand + heat', 'Heat map', 'Node lines', 'VIEW', ['A · ALUMINUM', 'A · ${optA.label.toUpperCase()}'], 'High'],
    },
    'module.harmonics': {
      files: [`${D}modules/modHarmonics.tsx`],
      names: ['String', 'Air column (open)', 'Circular membrane', 'Free metal plate', 'HARMONIC', 'INHARMONIC', 'INHARM.', 'LADDER', 'RATIO', 'FREQ', 'FAMILY', 'MODE', 'PLAY'],
    },
    'module.harmony': {
      files: [`${D}modules/modHarmony.tsx`],
      names: ['Wave addition', 'Lissajous figure', 'Spectrum', 'BASE', 'DETUNE', 'RATIO', 'VIEW', 'PLAY', 'INTERVAL', 'BEAT', 'locked — no beats', '1 : 1', 'unison', '5 : 7', 'tritone (near)', '1 : 2', 'octave', 'P5', 'A + B'],
    },
    'module.systems': {
      files: [`${D}modules/modSystems.tsx`],
      names: ['SYSTEM', 'A string', 'An air column', 'A water surface', 'A loudspeaker with particles on it', 'Bells, gongs and cymbals', 'Acoustic levitation', 'MODE', 'NODES', 'FAMILY', 'HARMONIC', 'INHARM.', '1-D wave', 'LIQUID ›', 'SPEAKER ›', 'PLATES ›', '(2,0)'],
    },
    'module.myth': {
      files: [`${D}modules/modMyth.tsx`],
      names: ['EVIDENCE', 'DEPENDS', 'MYTH', 'YOU HAD IT', 'YOU SAID', 'HOW THIS LAB STAYS HONEST'],
    },
    'module.experiments': {
      files: [`${D}modules/modExperiments.tsx`, `${D}ExperimentWell.tsx`, 'src/features/cymatics/presets.ts'],
      names: ['START THE SERIES ›', 'PREDICT FIRST', ['▸ PREVIEW THE … STEPS', '▸ PREVIEW THE'], 'SET UP THE PLATE ›', ['DISH ›', 'SET UP THE DISH ›'], ['DRUM ›', 'SET UP THE DRUM ›'], 'Find the first visible resonance', 'I’VE MADE MY PREDICTION', 'REVEAL LOOK FOR ›', 'EXPERIMENT ›'],
    },
    'studio.plate': {
      files: [`${D}PlateStudioScreen.tsx`, `${D}DriveHint.tsx`, 'src/features/cymatics/plateBezel.ts', 'src/features/cymatics/materials.ts', 'src/screens/lab/LabShell.tsx'],
      names: ['SAVE', 'FREQ', 'JUMP TO A MODE', 'LAND ON', '‹ −0.1%', '+0.1% ›', 'PLATE', 'SOLVED SHAPES', 'MATERIAL', 'DRIVE', 'Sweep the modes', 'Slow motion', 'Silent drive', 'SECOND TONE', 'VIEW', 'Particles', 'Heat map', 'Particles + heat', 'Phase', 'Node lines', '3D plate', 'Cross-section', 'LEVEL', 'SAND', '⟲ Reset sand', 'RESPONSE', 'MODE', 'RES', 'AT', 'NEAR', 'BETWEEN', 'BELOW', 'WHAT THIS PLATE IS', 'SIMULATION', 'Steel', 'LAB NOTES', ['PRESS ▶ PLAY TO DRIVE THE PLATE', 'PRESS ▶ PLAY TO DRIVE THE ${what.toUpperCase()}']],
    },
    'studio.liquid': {
      files: [`${D}LiquidStudioScreen.tsx`, 'src/features/cymatics/faraday.ts', 'src/features/cymatics/liquids.ts', 'src/screens/lab/LabShell.tsx'],
      names: ['DRIVE', 'RESP', 'SHAKE', 'a/a꜀', 'f/2', 'FLAT SURFACE', 'SPLASHING', 'THRESHOLD', 'WHAT THIS RIG IS', 'RIG SAFETY', '‹ −5%', '+5% ›', 'FREQ', 'DRIVE AT TWICE A DISH MODE', 'LIQUID', 'DISH', 'Sweep 15 → 150 Hz', 'Slow motion', 'Silent drive', 'SECOND FREQUENCY', 'The rig', 'Liquid surface', 'Height map', 'Contours', 'Refraction', '3D surface', 'Cross-section', 'Glycerin–water 50/50', 'STABLE STANDING PATTERN', 'SMALL RIPPLES', 'UNSTABLE MOTION', 'SAVE', 'LAB NOTES'],
    },
    'studio.membrane': {
      files: [`${D}MembraneStudioScreen.tsx`, 'src/features/cymatics/membrane.ts', 'src/screens/lab/LabShell.tsx'],
      names: ['DRIVE', 'FUNDAMENTAL', 'MODE', 'RESPONSE', 'f_s', 'ka', 'STAGE', 'FREQ', 'JUMP TO A MODE', 'JUMP TO A CONE STAGE', 'HEAD', 'STRIKE', 'WHERE THE MALLET LANDS', 'Drag on drum', 'Open shell', 'Timpani kettle', 'CONE', 'Show the loudspeaker', 'The drum', 'Heat map', 'Phase', 'Node lines', '3D head', 'Cross-section', 'Loudspeaker', 'LEVEL', 'TUNING', 'TENSION', 'PISTON BAND — THE CONE MOVES AS ONE', 'SAVE', 'LAB NOTES', ['14" snare', '14" snare']],
    },
    learn: {
      files: ['src/features/lab/guidedLessons/GuidedLessonSheet.tsx', 'src/screens/lab/LabShell.tsx', 'src/features/lab/guidedLessons/content.ts', `${D}PlateStudioScreen.tsx`],
      names: ['CONTROLS', 'COMMON MISTAKES', 'PRO TIPS', 'FORMULA / CONCEPT', 'LEARN', 'EXPLORE', 'CHECK', 'GUIDED LESSON', 'LAB NOTES', 'Drive level', 'Material', 'LEVEL', 'PLATE', 'MATERIAL'],
    },
    'learn.liquid': {
      files: ['src/features/lab/guidedLessons/GuidedLessonSheet.tsx', 'src/screens/lab/LabShell.tsx', 'src/features/lab/guidedLessons/content.ts', `${D}LiquidStudioScreen.tsx`, 'src/features/cymatics/faraday.ts', 'src/features/cymatics/liquids.ts'],
      names: ['CONTROLS', 'LEARN', 'EXPLORE', 'Faraday waves', 'SHAKE', 'SMALL RIPPLES', 'Liquid', 'LIQUID', 'Glycerin–water 50/50'],
    },
    'learn.membrane': {
      files: ['src/features/lab/guidedLessons/GuidedLessonSheet.tsx', 'src/screens/lab/LabShell.tsx', 'src/features/lab/guidedLessons/content.ts', `${D}MembraneStudioScreen.tsx`],
      names: ['CONTROLS', 'LEARN', 'EXPLORE', 'Drive level', 'LEVEL', 'Tension and size', 'HEAD', 'TENSION', 'FUNDAMENTAL'],
    },
    check: {
      files: ['src/components/LabUnderstandingCheck.tsx'],
      names: ['CHECK YOUR UNDERSTANDING', 'NOT QUITE — TRY ANOTHER', 'CORRECT'],
    },
    'gallery.browse': {
      files: [`${D}GalleryScreen.tsx`],
      names: ['PATTERN GALLERY & ART STUDIO', 'All', 'Plate', 'Dish', 'Drum', '★ Favourites', 'NOTHING SAVED YET', 'Compare…', ['COMPARE ›', 'COMPARE ${compareIds.length} ›'], 'GUIDED LESSON'],
    },
    'gallery.open': {
      files: [`${D}GalleryScreen.tsx`, `${D}ExportPanel.tsx`],
      names: ['SIMULATION', 'NAME', 'NOTES', 'Open in studio ›', 'Colour ›', 'Duplicate', '★ Favourite', 'Delete', 'EXPORT', 'Art print', 'Lab print', 'PNG card', 'Transparent PNG', 'PDF', 'SVG', 'PAGE', 'SHARE', 'SAVE', 'PRINT'],
    },
    'gallery.art': {
      files: [`${D}GalleryScreen.tsx`, `${D}GalleryArt.tsx`],
      names: ['ART STUDIO', 'REGIONS', 'FILLED', 'UNDO', 'REDO', 'FILL', 'Custom colour…', 'Erase', 'Clear all fills', 'STYLE', 'Solid', 'Gradient', 'WEIGHT', 'PAPER', 'SYM', 'Off'],
    },
    'gallery.compare': {
      files: [`${D}GalleryScreen.tsx`, `${D}GalleryCompare.tsx`, `${D}ExportPanel.tsx`],
      names: ['COMPARE', 'Edit selection ‹', 'What am I looking at?', 'EXPORT', 'Art print', 'Lab print'],
    },
  };
  it('a name list for every guide', () => {
    assert.deepEqual(Object.keys(PIN).sort(), ALL.map(([k]) => k).sort());
  });
  for (const [id, { files, names }] of Object.entries(PIN)) {
    it(`${id}: every pinned name is on the screen AND in the guide`, () => {
      const src = files.map(code).join('\n');
      const gt = textOf(guideOf(id));
      for (const n of names) {
        const [g, s] = typeof n === 'string' ? [n, n] : n;
        assert.ok(src.includes(s), `${id}: "${s}" is no longer in ${files.join(', ')} — update the guide`);
        assert.ok(gt.includes(g), `${id}: the guide never names "${g}"`);
      }
    });
  }
  it('LAND ON is described as the NEXT mode up — what readResonance returns (not the nearest)', () => {
    assert.match(code('src/features/cymatics/plateModes.ts'), /const next = excitable\.find\(\(m\) => m\.hz > f \* 1\.02\) \?\? null;/);
    for (const id of ['module.nodes', 'studio.plate']) {
      const t = textOf(guideOf(id));
      assert.match(t, /LAND ON jumps to the next mode up/);
      assert.doesNotMatch(t, /nearest mode/i);
    }
  });
  it('the studio dock ranges are the screens’ own constants', () => {
    const P = code('src/screens/lab/cymatics/PlateStudioScreen.tsx');
    assert.match(P, /const F_MIN = 30;\nconst F_MAX = 3000;/);
    assert.match(code('src/screens/lab/cymatics/modules/modNodes.tsx'), /const F_MIN = 30;\nconst F_MAX = 3000;/);
    const L = code('src/screens/lab/cymatics/LiquidStudioScreen.tsx');
    assert.match(L, /const F_MIN = 10;\nconst F_MAX = 200;\nconst A_MIN = 0\.02;\nconst A_MAX = 1\.5;/);
    assert.match(L, /initialParam: 'shake'/);
    assert.match(code('src/screens/lab/cymatics/MembraneStudioScreen.tsx'), /const F_MIN = 20;\nconst F_MAX = 6000;/);
    const H = code('src/screens/lab/cymatics/modules/modHarmony.tsx');
    assert.match(H, /const B_MIN = 55;\nconst B_MAX = 440;/);
    assert.match(H, /const DETUNE_MAX = 0\.03;/);
    assert.match(textOf(STUDIOS.plate), /30 Hz–3 kHz/);
    assert.match(textOf(STUDIOS.liquid), /0\.02–1\.5 g[\s\S]*10–200 Hz/);
    assert.match(textOf(STUDIOS.membrane), /20 Hz–6 kHz/);
    assert.match(textOf(MODS.harmony), /55–440 Hz[\s\S]*0 to \+3 %/);
  });
  it('the experiment menu counts are the presets’ own: seventeen — ten plate, four dish, three drum', () => {
    const by = (s: string) => EXPERIMENTS.filter((e: { studio: string }) => e.studio === s).length;
    assert.equal(EXPERIMENTS.length, 17);
    assert.equal(by('plate'), 10);
    assert.equal(by('liquid'), 4);
    assert.equal(by('membrane'), 3);
    assert.equal(EXPERIMENTS[0].title, 'Find the first visible resonance');
    assert.match(textOf(MODS.experiments), /seventeen experiments: ten on the Chladni plate, four in the liquid dish, three on the drumhead and loudspeaker/);
  });
  it('What Is Cymatics?: the chips sit ABOVE the sand plate, the strip under it', () => {
    const I = code('src/screens/lab/cymatics/modules/modIntro.tsx');
    const chips = I.indexOf('<View style={P.chips}>');
    const plate = I.indexOf('title="SAND ON THE PLATE"');
    const strip = I.indexOf('<ResponseStrip');
    assert.ok(chips > 0 && chips < plate && plate < strip);
    assert.match(textOf(MODS.intro), /Above the sand plate: two chips[\s\S]*Under it: a RESPONSE vs FREQUENCY/);
  });
  it('Change One Thing: Solid wood is orthotropic, so the guide does not call every material an exact scaling', () => {
    assert.match(code('src/screens/lab/cymatics/modules/modChange.tsx'), /\{ label: 'Solid wood', short: 'Wood', patch: \{ material: 'wood' \} \}/);
    assert.match(code('src/features/cymatics/materials.ts'), /id: 'wood', label: 'Solid wood', E: 12, Eperp: 0\.9/);
    assert.match(textOf(MODS.change), /Size and thickness shift every mode by an exact scaling law; a new material moves them too \(Solid wood also re-orders them\)/);
  });
  it('CHECK: a wrong pick shows the same explanation as a right one — never called a "hint"', () => {
    assert.match(code('src/components/LabUnderstandingCheck.tsx'), /\{got \? 'CORRECT' : 'NOT QUITE — TRY ANOTHER'\}<\/Text>\s*<Text style=\{s\.explainBody\}>\{q\.explanation\}<\/Text>/);
    assert.doesNotMatch(textOf(G.CYMATICS_CHECK_GUIDE as unknown as Guide), /\bhint\b/);
  });
  it('ART STUDIO: SYM rotates the tap by 360°/k whatever the figure, so the guide names a fold that matches (4-fold on a square)', () => {
    assert.match(code('src/features/cymatics/figure.ts'), /const q = rotatePoint\(tap, g\.aspect, k, i\);/);
    assert.match(code('src/screens/lab/cymatics/GalleryArt.tsx'), /const SYMS = \[1, 2, 3, 4, 6, 8\];/);
    assert.match(textOf(GALLERY.art), /On a square-plate figure such as \(2,2\), set SYM to 4-fold/);
  });
  it('the CHECK guides count the authored questions (Cymatics: five)', () => {
    const src = read('src/features/lab/understandingChecks.ts');
    const block = src.slice(src.indexOf('const CYMATICS: readonly Q[] = ['), src.indexOf('const HARMONOGRAPH: readonly Q[] = ['));
    assert.equal((block.match(/prompt:/g) ?? []).length, 5);
    assert.match(textOf(G.CYMATICS_CHECK_GUIDE as unknown as Guide), /five questions/);
  });
});

describe('4. the numbers in TRY THIS are what the models print', () => {
  const P0 = PM.DEFAULT_PLATE;
  const ex = (spec: object, n = 16) => PM.plateModes(spec, n).filter((m: { drive: number }) => m.drive > 0.05);
  const res = (spec: { material: string; damping: number }, hz: number, n = 16) => PM.readResonance(hz, PM.plateModes(spec, n), PM.effectiveQ(spec.material, spec.damping));

  it('What Is Cymatics?: the chips read 104 Hz and 80.9 Hz; 104 Hz is AT, 80.9 Hz is not', () => {
    const f1 = ex(P0, 14)[0].hz;
    assert.equal(MU.formatHz(f1), '104 Hz');
    assert.equal(MU.formatHz(f1 * 0.78), '80.9 Hz');
    assert.equal(res(P0, f1, 14).state, 'at');
    assert.notEqual(res(P0, f1 * 0.78, 14).state, 'at');
  });
  it('Nodes: opens on 104 Hz (2,0) + (0,2), 2 lines; mode 3 is 501 Hz with 4 lines; the disc lands on 89.8 Hz, 2 diameters · 0 circles', () => {
    const sq = PM.plateModes({ ...P0, exciter: { x: 0.5, y: 0.5 } }, 24).filter((m: { drive: number }) => m.drive > 0.05).slice(0, 8);
    assert.equal(MU.formatHz(sq[0].hz), '104 Hz');
    assert.equal(sq[0].label, '(2,0) + (0,2)');
    assert.equal(sq[0].nodalLines, 2);
    assert.equal(`3 · ${MU.formatHz(sq[2].hz)} · ${sq[2].label}`, '3 · 501 Hz · (4,0) + (0,4)');
    assert.equal(sq[2].nodalLines, 4);
    assert.equal(res({ ...P0 }, Math.round(sq[2].hz * 10) / 10, 24).state, 'at', 'landing on mode 3 reads AT, so LINES shows');
    const discSpec = { ...P0, shape: 'circle', exciter: { x: 0.85, y: 0.5 } };
    const disc = PM.plateModes(discSpec, 24).filter((m: { drive: number }) => m.drive > 0.05);
    const land = Math.round(disc[0].hz * 10) / 10;
    assert.equal(MU.formatHz(land), '89.8 Hz');
    assert.equal(disc[0].label, '2 diameters · 0 circles');
    assert.equal(res(discSpec, land, 24).state, 'at');
    // The tray is the first 8 excitable modes of ONE 24-mode list that the read,
    // field and FREQ warp share (D41 #21): the centre-driven square has only 7
    // excitable modes in 24, the edge-driven disc more than 8.
    assert.match(code('src/screens/lab/cymatics/modules/modNodes.tsx'), /const \{ all: allModes, tray: modes \} = useMemo\(\(\) => nodesModeLists\(spec\), \[spec\]\);/);
    assert.match(code('src/screens/lab/cymatics/modules/modeMath.ts'), /export const NODES_MODE_COUNT = 24;/);
    assert.equal(PM.plateModes({ ...P0, exciter: { x: 0.5, y: 0.5 } }, 24).filter((m: { drive: number }) => m.drive > 0.05).length, 7);
    assert.ok(disc.length >= 8);
    const t = textOf(MODS.nodes);
    assert.match(t, /lists the plate’s lowest modes \(up to eight\)/);
    assert.doesNotMatch(t, /first eight modes/);
    assert.match(t, /DRIVE 104 Hz, MODE \(2,0\)\+\(0,2\), LINES 2, RES AT/);
    assert.match(t, /LINES goes from 2 to 4/);
    assert.match(t, /DRIVE lands on 89\.8 Hz and MODE reads \(2,0\): 2 diameters, 0 circles/);
    // The Nodes bezel shows the compact label (the full disc label is cut at phone width).
    assert.match(code('src/screens/lab/cymatics/modules/modNodes.tsx'), /bezelModeLabel\(res\.dominant\.label\)/);
    assert.equal(BZ.bezelModeLabel(disc[0].label), '(2,0)');
    assert.equal(BZ.bezelModeLabel(sq[0].label), '(2,0)+(0,2)');
  });
  it('Change One Thing: LOCKED 191 Hz, B steel BETWEEN; damping High stays AT; thickness 0.5 mm locks 95.6 Hz and 1 mm is BETWEEN', () => {
    const lock = (spec: object) => {
      const e = ex(spec);
      return Math.round((e[1]?.hz ?? e[0].hz) * 10) / 10;
    };
    const hz = lock(P0);
    assert.equal(MU.formatHz(hz), '191 Hz');
    assert.equal(res(P0, hz).state, 'at');
    assert.equal(res({ ...P0, material: 'steel' }, hz).state, 'between');
    assert.equal(res({ ...P0, damping: 0.85 }, hz).state, 'at');
    const thin = { ...P0, thicknessMm: 0.5 };
    const hzT = lock(thin);
    assert.equal(MU.formatHz(hzT), '95.6 Hz');
    assert.equal(res({ ...P0, thicknessMm: 1 }, hzT).state, 'between');
    // The module's own defaults: material first, A = option 0, B = option 1.
    const C = code('src/screens/lab/cymatics/modules/modChange.tsx');
    assert.match(C, /useState<VarId>\('material'\)/);
    assert.match(C, /const \[a, setA\] = useState\(0\);\s*const \[b, setB\] = useState\(1\);/);
    assert.match(C, /\{ label: 'Low', short: 'Low', patch: \{ damping: 0\.1 \} \}, \{ label: 'Medium', short: 'Med', patch: \{ damping: 0\.4 \} \}, \{ label: 'High', short: 'High', patch: \{ damping: 0\.85 \} \}/);
    const t = textOf(MODS.change);
    assert.match(t, /191 Hz to start/);
    assert.match(t, /A reads AT, B reads BETWEEN/);
    assert.match(t, /B stays AT/);
    assert.match(t, /LOCKED reads 95\.6 Hz; B at 1 mm reads BETWEEN/);
    // REVEAL bullet (verified 2026-10-31): steel is the NEAR MISS — its matching mode sits
    // about 1 % below the locked tone, yet the sharp resonance is missed and B goes dark.
    // It is never called an "exception" beside damping (which really does keep B AT).
    assert.doesNotMatch(C, /Steel is the other/);
    assert.match(C, /Steel is the near miss: [^<]*about 1% below aluminum’s[^<]*B goes dark\./);
    const steel = ex({ ...P0, material: 'steel' });
    const near = steel.reduce((m: { hz: number }, x: { hz: number }) => (Math.abs(x.hz - hz) < Math.abs(m.hz - hz) ? x : m));
    const below = ((hz - near.hz) / hz) * 100;
    assert.ok(below > 0.5 && below < 1.5, `steel's matching mode is ${below.toFixed(2)} % below`);
  });
  it('Harmonics vs Plate Modes: string 2.00× 220 Hz; membrane 1.59× 175 Hz; the plate ladder 1.73, 2.33, 3.91', () => {
    const H = code('src/screens/lab/cymatics/modules/modHarmonics.tsx');
    assert.match(H, /const F0 = 110;/);
    assert.match(H, /ratios: \[1, 1\.594, 2\.136, 2\.296, 2\.653, 2\.918\]/);
    assert.equal(MU.formatHz(110 * 2), '220 Hz');
    assert.equal((1.594).toFixed(2), '1.59');
    assert.equal(MU.formatHz(110 * 1.594), '175 Hz');
    const disc = PM.plateModes({ ...P0, shape: 'circle', exciter: { x: 0.85, y: 0.5 } }, 20).filter((m: { drive: number }) => m.drive > 0.05);
    const r = disc.slice(0, 4).map((m: { hz: number }) => (m.hz / disc[0].hz).toFixed(2));
    assert.deepEqual(r, ['1.00', '1.73', '2.33', '3.91']);
    const t = textOf(MODS.harmonics);
    assert.match(t, /Mode 2 · 2\.00× · 220 Hz/);
    assert.match(t, /RATIO 2\.00×, FREQ 220 Hz/);
    assert.match(t, /RATIO 1\.59×, FREQ 175 Hz/);
    assert.match(t, /Plate: 1\.73×, 2\.33×, 3\.91×/);
    assert.match(t, /Membrane: 1\.59×, 2\.14×, 2\.30×/);
  });
  it('Harmony in Motion: opens 220 / 330 Hz (P5); BASE 220 → 440 / 660 Hz; +1 % detune beats at 6.6 Hz', () => {
    const H = code('src/screens/lab/cymatics/modules/modHarmony.tsx');
    assert.match(H, /useState\('fifth'\)/);
    assert.match(H, /useState\(110\)/);
    assert.match(H, /\{ id: 'fifth', n1: 2, n2: 3, label: '2 : 3', interval: 'perfect fifth', short: 'P5' \}/);
    assert.match(H, /const beatHz = Math\.abs\(ratio\.n1 \* f2 - ratio\.n2 \* f1\);/);
    const pair = (base: number, d = 0) => [base * 2, base * 3 * (1 + d)];
    assert.deepEqual(pair(110).map(MU.formatHz), ['220 Hz', '330 Hz']);
    assert.deepEqual(pair(220).map(MU.formatHz), ['440 Hz', '660 Hz']);
    // TRY THIS runs in order: step 1 leaves BASE at 220 Hz, so step 2's beat is quoted there.
    const [a, b] = pair(220, 0.01);
    assert.equal(Math.abs(2 * b - 3 * a).toFixed(1), '13.2');
    // It opens on Wave addition, so step 2 must switch VIEW to see the figure turn.
    assert.match(H, /useState<ViewId>\('waves'\)/);
    // The Lissajous figure is open whenever detuned (y uses n2·(1+detune)), so the
    // octave only closes once DETUNE is back to locked; RATIO does not reset DETUNE.
    assert.match(H, /const y = h \/ 2 \+ R \* Math\.sin\(n2 \* \(1 \+ detune\) \* t\);/);
    assert.match(H, /onSelect: setRatioId,/);
    // Wave addition, detuned, is a still picture about 2.5 beats wide (no clock).
    assert.match(H, /const beatWindow = tone\.detuned \? 2\.5 \/ Math\.max\(0\.2, beatHz\) : 0;/);
    const t = textOf(MODS.harmony);
    assert.match(t, /A 220 Hz, B 330 Hz/);
    assert.match(t, /A reads 440 Hz, B 660 Hz, INTERVAL still P5/);
    assert.match(t, /Set VIEW to Lissajous figure, then ride DETUNE to about \+1\.00 %: at BASE 220 Hz, BEAT reads about 13\.2 Hz/);
    assert.match(t, /Ride DETUNE back to locked, then RATIO 1 : 2/);
    assert.match(t, /about two and a half beats/);
    // Two pure sines: no partials to line up — the guide never says they do.
    assert.doesNotMatch(t, /partials|figure-eight|slowly changes shape/);
  });
  it('Other Cymatic Systems: harmonic n → MODE nf, NODES n + 1 (string 5 → 6; pipe 3 → 4)', () => {
    const S = code('src/screens/lab/cymatics/modules/modSystems.tsx');
    assert.match(S, /\{ k: 'MODE', v: hasHarmonic \? \(n === 1 \? 'fund\.' : `\$\{n\}f`\)/);
    assert.match(S, /\{ k: 'NODES', v: hasHarmonic \? `\$\{n \+ 1\}`/);
    assert.match(S, /onChange: \(v: number\) => setN\(1 \+ Math\.min\(4, Math\.floor/);
    const t = textOf(MODS.systems);
    assert.match(t, /MODE reads 5f and NODES 6/);
    assert.match(t, /NODES reads 4/);
  });
  it('Plate Studio: 240 Hz is BETWEEN at 0 %; 191 Hz · (2,2) is AT at 98 %; steel there is BETWEEN at 6 %', () => {
    const PS = code('src/screens/lab/cymatics/PlateStudioScreen.tsx');
    assert.match(PS, /preset\.freq\.hz : 240\)/);
    assert.match(PS, /label: `\$\{formatHz\(m\.hz\)\} · \$\{m\.label\}`/);
    const modes = ex(P0);
    const r240 = res(P0, 240);
    assert.equal(r240.state, 'between');
    assert.equal(Math.round(r240.strength * 100), 0);
    const m22 = modes.find((m: { label: string }) => m.label === '(2,2)')!;
    assert.equal(`${MU.formatHz(m22.hz)} · ${m22.label}`, '191 Hz · (2,2)');
    const at = res(P0, Math.round(m22.hz * 10) / 10);
    assert.equal(at.state, 'at');
    assert.equal(Math.round(at.strength * 100), 98); // the tray lands on the hz rounded to 0.1
    const st = res({ ...P0, material: 'steel' }, Math.round(m22.hz * 10) / 10);
    assert.equal(st.state, 'between');
    assert.equal(Math.round(st.strength * 100), 6);
    const t = textOf(STUDIOS.plate);
    assert.match(t, /It opens on 240 Hz: RES BETWEEN, RESPONSE 0%/);
    assert.match(t, /tap 191 Hz · \(2,2\)[\s\S]*RES AT, RESPONSE 98%/);
    assert.match(t, /RESPONSE falls to 6% and RES reads BETWEEN/);
    // Step 3 starts on steel (6 %): it must go back to aluminum before promising the figure.
    assert.match(t, /Switch MATERIAL back to Aluminum, then press ▶[\s\S]*\(2,2\) figure/);
  });
  it('Liquid Studio: 40 Hz 0.25 g = STABLE 1.59×, 20.0 Hz f/2; 0.15 g = SMALL RIPPLES at 40.0 Hz f; 0.60 g = UNSTABLE; glycerin–water threshold ≈ 0.53 g', () => {
    const LS = code('src/screens/lab/cymatics/LiquidStudioScreen.tsx');
    assert.match(LS, /useState\(preset\?\.hz \?\? 40\)/);
    assert.match(LS, /preset\.accelG : 0\.25\)/);
    const L0 = FA.DEFAULT_LIQUID;
    const read = (spec: object, f: number, a: number) => ({ fr: FA.readFaraday(spec, f, a), st: FA.readLiquid(spec, f, a) });
    const d = read(L0, 40, 0.25);
    assert.equal(FA.STAGE_LABEL[d.st.stage], 'STABLE STANDING PATTERN');
    assert.equal(`${d.st.ratio.toFixed(2)}×`, '1.59×');
    assert.ok(d.st.subharmonic);
    assert.equal(`${MU.formatHz(d.fr.responseHz)} f/2`, '20.0 Hz f/2');
    assert.equal(MU.formatHz(40), '40.0 Hz');
    const lo = read(L0, 40, 0.15);
    assert.equal(FA.STAGE_LABEL[lo.st.stage], 'SMALL RIPPLES');
    assert.ok(!lo.st.subharmonic);
    const hi = read(L0, 40, 0.6);
    assert.equal(FA.STAGE_LABEL[hi.st.stage], 'UNSTABLE MOTION');
    const gl = read({ ...L0, liquid: 'glycerin50' }, 40, 0.25);
    assert.equal(FA.STAGE_LABEL[gl.st.stage], 'SMALL RIPPLES');
    assert.equal(gl.fr.thresholdG.toFixed(2), '0.53');
    // Depth and frequency raise the threshold as the guide says.
    assert.ok(FA.readFaraday({ ...L0, depthMm: 2 }, 40, 0.25).thresholdG > d.fr.thresholdG);
    assert.ok(FA.readFaraday(L0, 80, 0.25).thresholdG > d.fr.thresholdG);
    assert.ok(FA.readFaraday(L0, 80, 0.25).lambdaMm < d.fr.lambdaMm);
    const t = textOf(STUDIOS.liquid);
    assert.match(t, /40\.0 Hz and 0\.25 g: STABLE STANDING PATTERN, a\/a꜀ 1\.59×, RESP 20\.0 Hz f\/2/);
    assert.match(t, /about 0\.15 g: SMALL RIPPLES, and RESP reads 40\.0 Hz f/);
    assert.match(t, /about 0\.60 g: UNSTABLE MOTION/);
    assert.match(t, /about 0\.53 g/);
  });
  it('Membrane Studio: 180 Hz = 9 %; (0,1) lands at 91 %; 6 kN/m → 282 Hz; the woofer at 180 Hz is PISTON BAND; centre strike wakes no diameters', () => {
    const MS = code('src/screens/lab/cymatics/MembraneStudioScreen.tsx');
    assert.match(MS, /preset\.hz : 180\)/);
    assert.match(MS, /preset\?\.driver \?\? 'woofer200'/);
    const s0 = MB.DEFAULT_MEMBRANE;
    const modes = MB.membraneModes(s0, 16);
    const Q = MB.membraneQ(s0);
    assert.equal(Math.round(MB.membraneStrength(modes, 180, Q).strength * 100), 9);
    const m01 = modes.find((m: { n: number; s: number }) => m.n === 0 && m.s === 1)!;
    assert.ok(m01.label.startsWith('(0,1)'));
    assert.equal(MU.formatHz(m01.hz), '200 Hz');
    const landed = MB.membraneStrength(modes, Math.round(m01.hz * 10) / 10, Q);
    assert.equal(Math.round(landed.strength * 100), 91);
    assert.equal(landed.dominant.label.split(' · ')[0], '(0,1)');
    assert.equal(MU.formatHz(MB.fundamentalHz(s0)), '200 Hz');
    assert.equal(MU.formatHz(MB.fundamentalHz({ ...s0, tensionNpm: 6000 })), '282 Hz');
    const cone = MB.readCone(MB.DRIVER_BY_ID.woofer200, 180);
    assert.equal(MB.CONE_STAGE_LABEL[cone.stage], 'PISTON BAND — THE CONE MOVES AS ONE');
    const centre = MB.membraneModes({ ...s0, strike: { r: 0, thetaDeg: 0 } }, 16).filter((m: { drive: number }) => m.drive > 0.05);
    assert.ok(centre.length > 0 && centre.every((m: { n: number }) => m.n === 0), 'a centre strike drives only n = 0');
    const bare = modes.filter((m: { s: number; n: number }) => m.s === 1 || m.n === 0).slice(0, 3).map((m: { hz: number }) => (m.hz / m01.hz).toFixed(2));
    assert.deepEqual(bare, ['1.00', '1.59', '2.14']);
    const t = textOf(STUDIOS.membrane);
    assert.match(t, /180 Hz with RESPONSE 9 %/);
    assert.match(t, /RESPONSE 91 %, MODE \(0,1\)/);
    assert.match(t, /from 200 Hz to 282 Hz/);
    // After TRY #1 lands on (0,1), DRIVE reads 199.6 Hz (TENSION does not move DRIVE).
    assert.equal(MU.formatHzPrecise(Math.round(m01.hz * 10) / 10), '199.6 Hz');
    assert.equal(MB.CONE_STAGE_LABEL[MB.readCone(MB.DRIVER_BY_ID.woofer200, 199.6).stage], 'PISTON BAND — THE CONE MOVES AS ONE');
    assert.match(t, /with DRIVE still at 199\.6 Hz the ladder reads PISTON BAND — THE CONE MOVES AS ONE/);
    assert.doesNotMatch(t, /at 180 Hz the ladder/);
  });
});

describe('5. wiring and the accuracy-chip decision', () => {
  const D = 'src/screens/lab/cymatics/';
  it('CymaticsHomeScreen: the home guide (end guide on what’s left), host without regions, no chip', () => {
    const S = code(`${D}CymaticsHomeScreen.tsx`);
    assert.match(S, /import \{ CYMATICS_END_GUIDE, CYMATICS_HOME_GUIDE \} from '\.\/cymaticsScreenGuides';/);
    assert.match(S, /<View style=\{\[styles\.root, \{ paddingTop: insets\.top \+ 10 \}\]\}>(\s*\{\})*\s*<ScreenGuideHost regions=\{false\} resetKey=\{ending \? 'end' : 'home'\}>/);
    assert.match(S, /<LabHeader[\s\S]*?guide=\{ending \? CYMATICS_END_GUIDE : CYMATICS_HOME_GUIDE\}\s*guideTitle=\{ending \? 'WHAT’S LEFT' : undefined\}/);
    assert.match(S, /<\/ScreenGuideHost>\s*<\/View>/);
  });
  it('CymaticsModuleScreen: the module’s guide (end guide on what’s left), regions only on a rack module', () => {
    const S = code(`${D}CymaticsModuleScreen.tsx`);
    assert.match(S, /import \{ CYMATICS_END_GUIDE, CYMATICS_SCREEN_GUIDES \} from '\.\/cymaticsScreenGuides';/);
    assert.match(S, /<ScreenGuideHost resetKey=\{ending \? 'end' : meta\.id\} regions=\{!ending && RACK_MODULES\.has\(meta\.id\)\}>/);
    assert.match(S, /guide=\{ending \? CYMATICS_END_GUIDE : CYMATICS_SCREEN_GUIDES\[meta\.id\]\}\s*guideTitle=\{ending \? 'WHAT’S LEFT' : undefined\}/);
    assert.match(S, /<\/ScreenGuideHost>\s*<\/View>\s*<\/LabNavProvider>/);
    // The rack modules really draw a Rack Unit (so the regions are measured).
    assert.match(code(`${D}modules/rackLayout.tsx`), /<RackUnit/);
    assert.match(S, /const RACK_MODULES = new Set<CymaticsModuleId>\(\['nodes', 'harmonics', 'harmony', 'systems', 'change'\]\);/);
    for (const f of ['modNodes', 'modHarmonics', 'modHarmony', 'modSystems', 'modChange']) assert.match(code(`${D}modules/${f}.tsx`), /<CymaticsRackLayout/);
  });
  it('what’s left never claims LAB COMPLETE on visits alone: both hosts pass completeTitle (credit = the understanding check)', () => {
    for (const f of ['CymaticsHomeScreen', 'CymaticsModuleScreen']) {
      assert.match(code(`${D}${f}.tsx`), /<LabEndScreen[\s\S]*?mode="progress"\s*completeTitle="ALL MODULES OPENED"/, f);
    }
    assert.match(code('src/features/lab/trainingLabKeys.ts'), /route: 'CymaticsLab', key: 'tr_cymatics', completion: 'understanding'/);
    assert.doesNotMatch(textOf(G.CYMATICS_END_GUIDE as unknown as Guide), /LAB COMPLETE/);
  });
  it('the three studios: LabShell guide per tab (EXPLORE / LEARN / CHECK), accuracy={false}', () => {
    for (const [f, id] of [['PlateStudioScreen', 'plate'], ['LiquidStudioScreen', 'liquid'], ['MembraneStudioScreen', 'membrane']]) {
      const S = code(`${D}${f}.tsx`);
      assert.match(S, /import \{ CYMATICS_CHECK_TITLE, cymaticsStudioGuide \} from '\.\/cymaticsScreenGuides';/, f);
      assert.match(S, new RegExp(`labId="cymatics"\\s*guide=\\{cymaticsStudioGuide\\('${id}'\\)\\}\\s*accuracy=\\{false\\}`), f);
    }
    const g = G.cymaticsStudioGuide('liquid');
    assert.equal(g('explore'), G.CYMATICS_STUDIO_GUIDES.liquid);
    assert.equal(g('learn'), G.CYMATICS_LEARN_GUIDES.liquid);
    assert.equal(g('check'), G.CYMATICS_CHECK_GUIDE);
    assert.equal(G.cymaticsStudioGuide('plate')('learn'), G.CYMATICS_LEARN_GUIDE);
    assert.equal(G.cymaticsStudioGuide('membrane')('learn'), G.CYMATICS_LEARN_GUIDES.membrane);
    // Each studio's LEARN TRY THIS uses only that studio's own keys.
    assert.doesNotMatch(code(`${D}LiquidStudioScreen.tsx`), /label: 'LEVEL'/);
    assert.doesNotMatch(G.CYMATICS_LEARN_GUIDES.liquid.tryThis.join(' '), /\bLEVEL\b|MATERIAL|PLATE/);
    assert.doesNotMatch(G.CYMATICS_LEARN_GUIDES.membrane.tryThis.join(' '), /SHAKE|PLATE|Material entry/);
    assert.match(G.CYMATICS_LEARN_GUIDE.tryThis.join(' '), /In the Plate Studio/);
  });
  it('GalleryScreen: the mode’s guide in its own header, host with regions only on the ART board', () => {
    const S = code(`${D}GalleryScreen.tsx`);
    assert.match(S, /import \{ ScreenGuideHintAnchor, ScreenGuideHost, ScreenGuideKey \} from '\.\.\/\.\.\/\.\.\/features\/lab\/screenGuide';/);
    assert.match(S, /<ScreenGuideHost resetKey=\{mode\} regions=\{mode === 'art'\}>\s*<ScreenGuideHintAnchor>\s*<View style=\{styles\.header\}>/);
    assert.match(S, /<ScreenGuideKey title=\{[^}]*\} guide=\{CYMATICS_GALLERY_GUIDES\[mode\]\} \/>\s*<\/View>\s*<\/ScreenGuideHintAnchor>/);
    assert.match(S, /<\/ScreenGuideHost>\s*<\/View>\s*\);\s*\}/);
    assert.match(code(`${D}GalleryArt.tsx`), /<RackUnit/);
  });
  it('chip decision: a CONCEPT lab — no AccuracyNote on any Cymatics header; every display carries its SIMULATION label', () => {
    for (const f of ['CymaticsHomeScreen', 'CymaticsModuleScreen', 'GalleryScreen']) {
      assert.doesNotMatch(code(`${D}${f}.tsx`), /AccuracyNote/, `${f} still renders the chip`);
    }
    for (const f of ['PlateStudioScreen', 'LiquidStudioScreen', 'MembraneStudioScreen']) {
      const S = code(`${D}${f}.tsx`);
      assert.doesNotMatch(S, /AccuracyNote/);
      assert.match(S, /accuracy=\{false\}/);
      assert.match(S, /SIMULATION/);
    }
    // Nothing in the lab reads a microphone (what would earn the chip back).
    for (const f of ['CymaticsHomeScreen', 'CymaticsModuleScreen', 'GalleryScreen', 'PlateStudioScreen', 'LiquidStudioScreen', 'MembraneStudioScreen', 'useDriveTone']) {
      assert.doesNotMatch(code(`${D}${f}.tsx`.replace('useDriveTone.tsx', 'useDriveTone.ts')), /useMic|getUserMedia|micStart|startMic|requestRecordingPermissions/);
    }
  });
});
