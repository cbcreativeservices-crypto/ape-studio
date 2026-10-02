/**
 * Drum Tuning Lab — structure, content and progress guard (owner spec
 * 2026-10-01).
 *
 *  • REGISTRATION: catalog leaf (member, Instruments & Recording), navigator
 *    route through withMembershipPreview, RootStackParamList entry, the
 *    `#labpreview/DrumTuningLab` harness entry, the account-wipe exemption.
 *  • SPEC COVERAGE: seven chapters, every named interactive present, the
 *    cross-pattern on 6 / 8 / 10 lugs, the Learn/Hear/Adjust/Practice/Review
 *    flow, the optional See-the-vibration view.
 *  • NAV-STRIP ADOPTION: the host runs kit/LabNavBar in sub-step mode with
 *    the end screen, none of the retired words, no raw Alert.
 *  • RACK + FULL SCREEN: every live page is a DrumRack → RackUnit with
 *    `fullScreen: true`, StageFit and a badge; step counts match the files;
 *    readouts over 9 pt; level colours from levelColor; the peak red.
 *  • WORDING: no invented manufacturer quotes; no relationship called the
 *    correct one; tuning to a note is optional; devices help consistency,
 *    the ear decides; the accuracy note's "trust your ears and a real drum".
 *  • GUEST RULES + CREDIT: save-block from useLabEndGuest, first load waits
 *    for `resolved`, practice reset keeps `done` and the notes, credit banks
 *    on completion; the pure progress logic is exercised with an in-memory
 *    AsyncStorage.
 *  • AUDIO: the gate, stop-when-silenced and stop-on-close are honoured.
 */
import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { registerHooks } from 'node:module';
import { join } from 'node:path';
import { describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';

const read = (p: string) => readFileSync(join(process.cwd(), p), 'utf8');
const strip = (s: string) => s.replace(/\r\n/g, '\n').replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '').replace(/\{\/\*[\s\S]*?\*\/\}/g, '');
const DIR = 'src/screens/lab/drumtuning';
const MODULES = readdirSync(join(process.cwd(), DIR, 'modules')).filter((f) => /^ch\d/.test(f));

// Resolve extension-less imports (the Cymatics chain) and stub AsyncStorage
// so the progress store and the content run in node.
const memory = new Map<string, string>();
registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier === '@react-native-async-storage/async-storage') return { url: 'node:test-async-storage', shortCircuit: true };
    if (specifier.startsWith('.') && !/\.[cm]?[jt]s$/.test(specifier)) {
      const candidate = new URL(specifier + '.ts', context.parentURL);
      if (existsSync(fileURLToPath(candidate))) return { url: candidate.href, shortCircuit: true };
    }
    return nextResolve(specifier, context);
  },
  load(url, context, nextLoad) {
    if (url === 'node:test-async-storage') {
      return {
        format: 'module',
        shortCircuit: true,
        source: `const store = globalThis.__drumStore; export default { getItem: async (k) => store.has(k) ? store.get(k) : null, setItem: async (k, v) => { store.set(k, v); }, removeItem: async (k) => { store.delete(k); } };`,
      };
    }
    return nextLoad(url, context);
  },
});
(globalThis as unknown as { __drumStore: Map<string, string> }).__drumStore = memory;

const content = await import('../src/screens/lab/drumtuning/drumContent.ts');
const progress = await import('../src/screens/lab/drumtuning/drumProgress.ts');
const engine = await import('../src/screens/lab/drumtuning/drumEngine.ts');

describe('registration', () => {
  it('the catalog lists it as a members-only Instruments & Recording lab with a real route', () => {
    const cat = read('src/screens/lab/labCatalog.ts');
    assert.match(cat, /name: 'Drum Tuning Lab'[^\n]*route: 'DrumTuningLab', member: true/);
    const block = cat.slice(cat.indexOf("id: 'instruments'"), cat.indexOf("route: 'DrumTuningLab'"));
    assert.match(block, /section: 'training'/, 'it lives in the training section (Instruments & Recording)');
  });
  it('the navigator registers it through withMembershipPreview', () => {
    const nav = strip(read('src/navigation/RootNavigator.tsx'));
    assert.match(nav, /import \{ DrumTuningLabScreen \} from '\.\.\/screens\/lab\/drumtuning\/DrumTuningLabScreen'/);
    assert.match(nav, /DrumTuningLab: withMembershipPreview\(DrumTuningLabScreen\)/);
    assert.match(nav, /<Stack\.Screen name="DrumTuningLab" component=\{MemberGated\.DrumTuningLab\} \/>/);
    assert.match(read('src/navigation/types.ts'), /DrumTuningLab: undefined;/);
  });
  it('the browser harness can open it by name; the wipe registry knows the store', () => {
    assert.match(read('App.tsx'), /DrumTuningLab: DrumTuningLabScreen as ComponentType/);
    assert.match(read('test/accountWipeRegistry.test.ts'), /'screens\/lab\/drumtuning\/drumProgress\.ts'/);
  });
});

describe('the spec is covered', () => {
  it('seven chapters with the seven named interactives, in order', () => {
    assert.equal(content.DRUM_CHAPTERS.length, 7);
    assert.deepEqual(
      content.DRUM_CHAPTERS.map((c) => c.interactive),
      ['Turn one rod', 'Preparation checklist', 'Tune the head', 'Compare head relationships', 'Tune a drum for a sound', 'Build the tom range', 'Diagnose the symptom'],
    );
    assert.equal(MODULES.length, 7);
  });
  it('every chapter file carries its interactive step, the flow kinds are the owner\'s, and See-the-vibration is offered', () => {
    const titles: Record<string, string> = { 'ch1Sound.tsx': 'Turn one rod', 'ch2Prepare.tsx': 'Preparation checklist', 'ch3Method.tsx': 'Tune the head', 'ch4Whole.tsx': 'Compare head relationships', 'ch5Types.tsx': 'Tune a drum for a sound', 'ch6Kit.tsx': 'Build the tom range', 'ch7Trouble.tsx': 'Diagnose the symptom' };
    for (const [f, t] of Object.entries(titles)) assert.ok(read(`${DIR}/modules/${f}`).includes(`title: '${t}'`), `${f} lacks "${t}"`);
    const steps = strip(read(`${DIR}/steps.tsx`));
    assert.match(steps, /export type StepKind = 'LEARN' \| 'HEAR' \| 'ADJUST' \| 'PRACTICE' \| 'REVIEW';/);
    assert.match(strip(read(`${DIR}/modules/ch1Sound.tsx`)), /<VibrationStage/);
    assert.match(strip(read(`${DIR}/modules/ch4Whole.tsx`)), /<VibrationStage/);
    const vib = strip(read(`${DIR}/stagesSignal.tsx`));
    assert.match(vib, /from '\.\.\/\.\.\/\.\.\/features\/cymatics\/contours'/, 'the Cymatics contour tracer is reused');
    assert.match(vib, /besselJ\(n, j \* r\)/, 'the same J_n shape the sound was built from');
  });
  it('the cross-pattern is an animated order on 6, 8 and 10 lugs — every lug once, every move to the opposite rod or round the star', () => {
    const s = strip(read(`${DIR}/modules/ch2Prepare.tsx`));
    assert.match(s, /setInterval\(/, 'the pattern animates');
    assert.match(s, /'▶ RUN'/);
    assert.match(s, /onTap: toggleRun/, 'tapping the display runs / pauses the pattern');
    const order = engine.STAR_ORDER as Record<number, readonly number[]>;
    for (const n of [6, 8, 10]) {
      const o = order[n];
      assert.equal(new Set(o).size, n, `${n} lugs: each lug once`);
      assert.equal(o.length, n);
      for (let i = 1; i < n; i += 2) assert.equal((o[i] - o[i - 1] + n) % n, n / 2, `${n} lugs: step ${i} goes to the opposite rod`);
    }
  });
  it('the symptom table has the five rows and every area the spec names', () => {
    const s = read(`${DIR}/drumEngine.ts`);
    for (const row of ['Lug-to-lug pitch differences', 'Head seating', 'Head condition', 'Excessive or uneven tension', 'Damping', 'Head relationship', 'Tuning range', 'Room sound', 'Snare-side head tension', 'Wire adjustment', 'Hardware', 'Rods', 'Lugs', 'Washers', 'Tension consistency', 'Damaged hardware']) assert.ok(s.includes(`'${row}'`), row);
  });
  it('the four goals and the three relationships exist; the tom range verdicts are the spec\'s words', () => {
    assert.deepEqual(content.GOALS.map((g) => g.id), ['short', 'open', 'low', 'bend']);
    assert.deepEqual(content.RELATIONSHIPS.map((r) => r.id), ['resoHigher', 'equal', 'batterHigher']);
    const e = read(`${DIR}/drumEngine.ts`);
    assert.match(e, /'distinct' \| 'close' \| 'unbalanced'/);
    const k = strip(read(`${DIR}/modules/ch6Kit.tsx`));
    assert.match(k, /Save tuning notes/);
    assert.match(k, /onSaveNote\(/);
  });
});

describe('wording rules', () => {
  const all = [...MODULES.map((f) => read(`${DIR}/modules/${f}`)), read(`${DIR}/drumContent.ts`), read(`${DIR}/drumEngine.ts`), read(`${DIR}/DrumTuningLabScreen.tsx`)].join('\n');
  it('no invented manufacturer quotes; attributions are generic', () => {
    assert.doesNotMatch(all, /Yamaha|Remo\b|\bDW\b|Evans|Pearl|Tama|Gretsch|Ludwig/, 'no brand names');
    assert.match(all, /some manufacturers/i);
  });
  it('no relationship is called the correct one; tuning to a note is optional', () => {
    assert.doesNotMatch(all, /the correct (tuning|relationship)\b(?! one)/i);
    assert.match(all, /None of them is "correct"/);
    assert.match(all, /not a rule/i);
    assert.match(all, /tuning to an exact note is OPTIONAL/);
    assert.match(all, /size, construction|Size, construction/);
  });
  it('devices help consistency; the ear decides; the accuracy note says so', () => {
    assert.match(all, /CONSISTENCY/);
    assert.match(all, /final judgement still comes from listening/i);
    assert.match(read(`${DIR}/DrumTuningLabScreen.tsx`), /Learn the method here; trust your ears and a real drum/);
    assert.match(strip(read(`${DIR}/DrumTuningLabScreen.tsx`)), /<AccuracyNote compact detail=\{ACCURACY_DETAIL\} \/>/);
  });
  it('members see no upsell; nothing promised for later', () => {
    assert.doesNotMatch(all, /coming soon|upgrade to|go premium|for free\b/i);
  });
});

describe('shared navigation strip', () => {
  const host = strip(read(`${DIR}/DrumTuningLabScreen.tsx`));
  it('adopts kit/LabNavBar in sub-step mode with the what\'s-left end screen', () => {
    assert.match(host, /from '\.\.\/kit\/LabNavBar'/);
    assert.match(host, /<LabHeader\b/);
    assert.match(host, /<LabNavBar nav=\{nav\} \/>/);
    assert.match(host, /useLabNav\(\{/);
    assert.match(host, /sub,/);
    assert.match(host, /<LabEndScreen\b/);
    assert.match(host, /<LabNextButton \/>/);
    assert.match(host, /reset: \{ label: 'START OVER \(PRACTICE\)'/);
    assert.match(host, /onDone=\{\(\) => navigation\.goBack\(\)\}/);
  });
  it('none of the retired words, no raw Alert; confirmDialog for the reset', () => {
    for (const w of ['‹ BACK', 'CONTINUE ›', '⏮ START', 'SKIP AHEAD', 'styles.topNav', 'Alert.alert']) assert.ok(!host.includes(w), `host carries "${w}"`);
    assert.match(host, /confirmDialog\(/);
    for (const f of MODULES) assert.ok(!read(`${DIR}/modules/${f}`).includes('Alert.alert'), f);
  });
});

describe('rack + full screen on every live page', () => {
  const rack = strip(read(`${DIR}/DrumRack.tsx`));
  it('DrumRack is a RackUnit with FULL SCREEN on, StageFit and a badge', () => {
    assert.match(rack, /<RackUnit\b/);
    assert.match(rack, /fullScreen: true/);
    assert.match(rack, /<StageFit\b/);
    assert.match(rack, /badge: spec\.badge/);
    assert.match(rack, /bezel: spec\.bezel/);
  });
  it('every chapter has rack steps; every rack step declares a badge, a bezel and a bound param; inline figures use ExpandableFigure', () => {
    for (const f of MODULES) {
      const s = strip(read(`${DIR}/modules/${f}`));
      const racks = s.match(/layout: 'rack'/g) ?? [];
      assert.ok(racks.length >= 1, `${f} has no rack step`);
      assert.ok((s.match(/badge:/g) ?? []).length >= racks.length, `${f}: a badge per rack`);
      assert.equal((s.match(/initialParam:/g) ?? []).length, racks.length, `${f}: initialParam per rack`);
      assert.equal((s.match(/bezel: \[/g) ?? []).length, racks.length, `${f}: bezel per rack`);
      assert.ok(!/<Slider|<ControlSlider/.test(s), `${f}: no control drawn in the well above the display`);
      if (/<AnatomyStage/.test(s) && /layout: 'read'/.test(s) && /ExpandableFigure/.test(s)) assert.match(s, /<ExpandableFigure/, `${f}: a read-page figure zooms`);
    }
  });
  it('the step table matches the files; PREV rolls onto the previous chapter\'s last step', () => {
    const idx = read(`${DIR}/modules/index.ts`);
    const table = idx.match(/DRUM_STEP_COUNTS[^=]*= \{([^}]*)\}/)![1];
    const counts = Object.fromEntries([...table.matchAll(/(\w+): (\d+)/g)].map((m) => [m[1], Number(m[2])]));
    const fileFor: Record<string, string> = { sound: 'ch1Sound.tsx', prepare: 'ch2Prepare.tsx', method: 'ch3Method.tsx', whole: 'ch4Whole.tsx', types: 'ch5Types.tsx', kit: 'ch6Kit.tsx', trouble: 'ch7Trouble.tsx' };
    for (const [id, f] of Object.entries(fileFor)) {
      const n = (strip(read(`${DIR}/modules/${f}`)).match(/kind: '(LEARN|HEAR|ADJUST|PRACTICE|REVIEW)', layout: '(rack|read)'/g) ?? []).length;
      assert.equal(counts[id], n, `${id}: the step table says ${counts[id]}, the file has ${n}`);
    }
    const host = strip(read(`${DIR}/DrumTuningLabScreen.tsx`));
    assert.match(host, /onRollPrev: rollPrev/);
    assert.match(host, /DRUM_STEP_COUNTS\[prev\.id\] - 1/);
  });
  it('stage text never falls under the 9 pt floor ON THE PHONE: the real fit scale of every rack step at 375 and 390 wide; RN text ≥ 9 pt', () => {
    const drum = strip(read(`${DIR}/stagesDrum.tsx`));
    const signal = strip(read(`${DIR}/stagesSignal.tsx`));
    const stages = drum + '\n' + signal;
    const sizes = [...stages.matchAll(/fontSize=\{([\d.]+)\}/g)].map((m) => Number(m[1]));
    assert.deepEqual(sizes.filter((n) => n < 10.5), [], 'a literal SVG font size under 10.5 units');
    assert.match(drum, /export const FONT = 11;/);
    assert.match(drum, /export const FONT_S = 10\.5;/);
    const FONT_MIN = 10.5;
    const DESIGN_W = 360;
    // Every stage's aspect, from its exported height: `export const X_H = n`
    // and `X_ASPECT = W / X_H`.
    const heights = Object.fromEntries([...stages.matchAll(/export const (\w+)_H = (\d+);/g)].map((m) => [m[1], Number(m[2])]));
    const aspectOf: Record<string, number> = {};
    for (const m of stages.matchAll(/export const (\w+)_ASPECT = W \/ (\w+)_H;/g)) aspectOf[`${m[1]}_ASPECT`] = DESIGN_W / heights[m[2]];
    assert.ok(Object.keys(aspectOf).length >= 8, 'the stage aspects were found');
    // The rack's glass: STAGE_HEIGHTS by size (rack/rackTypes.ts), the
    // glass is the window width minus the stage wrap's padding and border,
    // StageFit pads 6 each side, and the drawing fits by WIDTH or by HEIGHT.
    const rackTypes = read('src/screens/lab/rack/rackTypes.ts');
    const hm = rackTypes.match(/STAGE_HEIGHTS[^=]*= \{ S: (\d+), M: (\d+), L: (\d+) \}/)!;
    const STAGE_H: Record<string, number> = { S: Number(hm[1]), M: Number(hm[2]), L: Number(hm[3]) };
    const PAD = 14;
    const problems: string[] = [];
    for (const f of MODULES) {
      const s = strip(read(`${DIR}/modules/${f}`));
      const blocks = s.split(/layout: 'rack'/).slice(1);
      blocks.forEach((b, i) => {
        const body = b.slice(0, b.indexOf('well:') > 0 ? b.indexOf('well:') : undefined);
        const aspectExpr = body.match(/aspect: ([^\n]+)/)?.[1] ?? '';
        const names = [...aspectExpr.matchAll(/(\w+_ASPECT)/g)].map((m) => m[1]);
        assert.ok(names.length >= 1, `${f} rack ${i + 1}: aspect uses a named stage aspect`);
        const aspect = Math.min(...names.map((n) => aspectOf[n] ?? NaN));
        assert.ok(Number.isFinite(aspect), `${f} rack ${i + 1}: ${names.join(',')}`);
        const size = body.match(/size: '([SML])'/)?.[1] ?? 'M';
        const title = body.match(/title: '([^']+)'/)?.[1] ?? `rack ${i + 1}`;
        for (const winW of [375, 390]) {
          const glassW = winW - 22;
          const drawW = Math.min(glassW - PAD, (STAGE_H[size] - PAD) * aspect);
          const scale = drawW / DESIGN_W;
          const pt = FONT_MIN * scale;
          if (pt < 9) problems.push(`${f} "${title}" size ${size} aspect ${aspect.toFixed(2)} at ${winW} wide: ${pt.toFixed(1)} pt`);
        }
      });
    }
    assert.deepEqual(problems, [], 'stage text under 9 pt on a phone');
    // THE SHORT PHONE (375 × 667): the rack drops the glass a size, every
    // drum-top drawing is height-limited under 1 : 1, and the stages grow
    // their fonts by drumEngine.textBoost so the smallest label is 9 pt.
    // Every stage applies it; no SVG font size is a bare constant.
    for (const name of ['DrumTopStage', 'AnatomyStage', 'EdgeStage', 'SnareStage', 'KickStage', 'KitStage', 'WaveStage', 'PartialsStage', 'PitchStage', 'VibrationStage']) {
      const fn = stages.slice(stages.indexOf(`export function ${name}(`));
      assert.ok(fn.indexOf('const bst = textBoost(width);') < fn.indexOf('return'), `${name} applies the short-phone font boost`);
    }
    assert.doesNotMatch(stages, /fontSize=\{(FONT|FONT_S|F2)\}/, 'every SVG font size rides the boost (fs / fsS / f2)');
    const short: string[] = [];
    for (const f of MODULES) {
      const s = strip(read(`${DIR}/modules/${f}`));
      for (const b of s.split(/layout: 'rack'/).slice(1)) {
        const body = b.slice(0, b.indexOf('well:') > 0 ? b.indexOf('well:') : undefined);
        const names = [...(body.match(/aspect: ([^\n]+)/)?.[1] ?? '').matchAll(/(\w+_ASPECT)/g)].map((m) => m[1]);
        const aspect = Math.min(...names.map((n) => aspectOf[n] ?? NaN));
        const size = (body.match(/size: '([SML])'/)?.[1] ?? 'M') as 'S' | 'M' | 'L';
        const title = body.match(/title: '([^']+)'/)?.[1] ?? 'rack';
        const drawW = engine.drawnWidth(aspect, 375, engine.glassHeightFor(size, 667));
        const pt = FONT_MIN * (drawW / DESIGN_W) * engine.textBoost(drawW);
        if (pt < 9 - 1e-9) short.push(`${f} "${title}" at 375 × 667: ${pt.toFixed(2)} pt`);
      }
    }
    assert.deepEqual(short, [], 'stage text under 9 pt on a short phone');
    assert.equal(engine.textBoost(400), 1, 'no boost at or above 1 : 1 (a tall phone, FULL SCREEN)');
    assert.ok(Math.abs(engine.textBoost(268) * 10.5 * (268 / 360) - 9) < 1e-9, 'the L → M drum top on an SE lands exactly on the floor');
    for (const f of ['kit.tsx', 'DrumTuningLabScreen.tsx', 'modules/ch6Kit.tsx']) {
      const rn = [...strip(read(`${DIR}/${f}`)).matchAll(/fontSize: ([\d.]+)/g)].map((m) => Number(m[1]));
      assert.deepEqual(rn.filter((n) => n < 9), [], `${f}: text under 9 pt`);
    }
  });
  it('glass captions fit the glass: the T60 label flips near the right edge, the last tick is end-anchored, captions are short', () => {
    const st = strip(read(`${DIR}/stagesSignal.tsx`));
    assert.match(st, /t60X > x1 - 78 \? 'end' : 'start'/, 'the T60 label never runs off the glass');
    assert.match(st, /textAnchor=\{last \? 'end'/, 'the last time tick is anchored to its end');
    // Bottom captions: ≤ 60 characters at FONT_S (≈ 5.5 units per character on a 330-unit line).
    for (const m of st.matchAll(/fontSize=\{FONT_S\}[^>]*>([^<{]{20,})<\/SvgText>/g)) assert.ok(m[1].length <= 60, `caption too long to fit: "${m[1]}"`);
    const drum = strip(read(`${DIR}/stagesDrum.tsx`));
    for (const m of drum.matchAll(/fontSize=\{FONT_S\}[^>]*textAnchor="middle"[^>]*>([^<{]{20,})<\/SvgText>/g)) assert.ok(m[1].length <= 60, `caption too long to fit: "${m[1]}"`);
  });
  it('every rack page opens with a one-line "what you are looking at" and a prompt; no ■ STOP key on any dock (tapping the display stops); credit keys live on the dock', () => {
    for (const f of MODULES) {
      const s = strip(read(`${DIR}/modules/${f}`));
      const racks = (s.match(/layout: 'rack'/g) ?? []).length;
      const landings = (s.match(/<Landing looking=/g) ?? []).length;
      assert.equal(landings, racks, `${f}: a Landing line per rack page`);
      assert.doesNotMatch(s, /label: '■ STOP'/, `${f}: no STOP key on the dock`);
      // Docks: at most FIVE keys (rack/RackUnit: "≤ 5 keys reads best on a
      // 375-wide phone"); a sixth control becomes a bezel tap-cell.
      for (const b of s.split(/params: \[/).slice(1)) {
        const list = b.slice(0, b.indexOf('initialParam:'));
        const keys = (list.match(/^\s{14}(faderParam|optionsParam|flipFader|\{ kind: '|stageKey)/gm) ?? []).length;
        assert.ok(keys <= 5, `${f}: a dock with ${keys} keys`);
      }
    }
    const ch2 = strip(read(`${DIR}/modules/ch2Prepare.tsx`));
    assert.match(ch2, /id: 'reveal', label: revealed \? '✓ KEY SHOWN' : '✓ REVEAL KEY'/, 'REVEAL KEY is a dock action');
    assert.match(ch2, /<ExpandableFigure[^\n]*controls=\{hardwareChips\}/, 'the inline figure docks its controls in full screen');
    const ch5 = strip(read(`${DIR}/modules/ch5Types.tsx`));
    assert.match(ch5, /id: 'check', label: '✓ CHECK'/, 'CHECK is a dock action');
    assert.match(ch5, /k: 'GOAL'[^\n]*onPress: cycleGoal/, 'GOAL is a tap-to-cycle bezel cell, keeping the dock at five keys with CHECK on it');
    // Dock key labels: a key has ~10 characters of room at Oswald 12 (rackTypes).
    for (const f of MODULES) {
      for (const b of strip(read(`${DIR}/modules/${f}`)).split(/params: \[/).slice(1)) {
        const list = b.slice(0, b.indexOf('initialParam:'));
        const keys = (list.match(/^\s{14}(faderParam|optionsParam|flipFader|\{ kind: '|stageKey)/gm) ?? []).length;
        // Measured 2026-10-01 at 390 wide: "SNARE SIDE" (10) and "RACK TOM"
        // (8, wide letters) ellipsized on a five-key dock; "STRAINER" (8)
        // and "▶ STRIKE" (8) fit. Eight is the ceiling, and wide words less.
        const cap = keys >= 5 ? 8 : 12;
        for (const m of list.matchAll(/^\s{14}(?:faderParam|optionsParam|flipFader|\{ kind: '\w+')[^\n]*?label: (?:[^,\n]*? )?'([^']+)'/gm)) assert.ok(m[1].length <= cap, `${f}: dock label too long for ${keys} keys: "${m[1]}"`);
      }
    }
    assert.match(strip(read(`${DIR}/modules/ch7Trouble.tsx`)), /useState<StageView>\('drum'\)/, 'Chapter 7 lands on the drum');
  });
  it('dead controls are gone: TAP and STRIKE have a visible playing state; INSPECT reveals a fault only once looked at; the snare and kick faders draw', () => {
    const drum = strip(read(`${DIR}/stagesDrum.tsx`));
    assert.match(drum, /tapSync\?: SoundSync/);
    assert.match(drum, /strikeSync\?: SoundSync/);
    assert.match(drum, /useAnimatedStyle\(/);
    assert.match(drum, /envAmpAt\(env, sp\.value\)/, 'the strike glow follows the measured envelope');
    assert.match(drum, /look\?: LookAt/);
    assert.match(drum, /scaleBySize/);
    assert.match(drum, /<PitchLadder/, 'the snare and kick draw their heads\' pitches');
    assert.match(drum, /stickA/, 'the snare stick follows the stroke');
    assert.match(drum, /swingStyle/, 'the beater swings on the strike');
    assert.match(drum, /fieldLevelColor\(/, 'the tension map rides the EVEN field ramp, not the meter plateau');
    assert.match(strip(read(`${DIR}/stagesSignal.tsx`)), /<PartialBar/, 'partial bars fade with their own decay');
    const ch2 = strip(read(`${DIR}/modules/ch2Prepare.tsx`));
    assert.match(ch2, /inspected\.has\('head'\)/);
    assert.match(ch2, /inspected\.has\(`lug\$\{faults\.looseLug\}`\)/);
    assert.match(ch2, /inspected\.has\('edge'\)/);
    for (const f of MODULES) {
      const s = strip(read(`${DIR}/modules/${f}`));
      if (/<DrumTopStage[^>]*tap=\{/.test(s) && /'▶ TAP'/.test(s)) assert.match(s, /tapSync=\{syncOf\(/, `${f}: ▶ TAP is seen as well as heard`);
    }
  });
  it('the playhead and the vibration view are SharedValue driven; the waveform is the real buffer on its time base', () => {
    const hook = strip(read(`${DIR}/useDrumPlayback.ts`));
    assert.match(hook, /useSharedValue\(0\)/);
    assert.match(hook, /useFrameCallback\(/);
    const st = strip(read(`${DIR}/stagesSignal.tsx`));
    assert.match(st, /useAnimatedStyle\(/);
    assert.match(st, /ov\.hi\.map\(/, 'min/max columns of the rendered buffer');
    assert.match(st, /real time base/);
    assert.match(strip(read(`${DIR}/drumEngine.ts`)), /export \{ overview, type Overview \};/, 'the Mastering overview (real time base) is reused');
  });
});

describe('level colours and the peak red', () => {
  it('every amplitude tint comes from features/tools/levelColor; the map rides the same ramp; the peak red is the standard', () => {
    for (const f of ['stagesDrum.tsx', 'stagesSignal.tsx']) {
      const s = strip(read(`${DIR}/${f}`));
      assert.match(s, /from '\.\.\/\.\.\/\.\.\/features\/tools\/levelColor'/, f);
      assert.match(s, /\blevelColor\(|fieldLevelColor\(/, f);
      assert.doesNotMatch(s, /#3fae52|#e8c341|#e6902f|#ff5f4e/, `${f}: ramp colours are sampled, never copied`);
    }
    assert.match(strip(read(`${DIR}/stagesDrum.tsx`)), /mapTint = \(cents: number\): string => fieldLevelColor\(/, 'the map: equal cents = equal colour steps either side of even');
    assert.match(strip(read(`${DIR}/stagesSignal.tsx`)), /MIDLINE_BLUE/);
    assert.match(strip(read(`${DIR}/stagesSignal.tsx`)), /PEAK_RED/);
    assert.match(strip(read(`${DIR}/kit.tsx`)), /PEAK_RED/);
    const m1 = strip(read(`${DIR}/modules/ch1Sound.tsx`));
    assert.match(m1, /id: 'strike'[^\n]*level: true/, 'the strike fader rides the amplitude lane');
  });
});

describe('guest rules, persistence and credit', () => {
  const host = strip(read(`${DIR}/DrumTuningLabScreen.tsx`));
  const store = strip(read(`${DIR}/drumProgress.ts`));
  it('the save-block flag is set from useLabEndGuest every render; the first load waits for resolved', () => {
    assert.match(host, /const guest = useLabEndGuest\(\);/);
    assert.match(host, /const blocked = guest \|\| !resolved;\s*setDrumSaveBlocked\(blocked\);/);
    assert.match(host, /if \(!resolved\) return;\s*const reread = loaded && loadedBlockedRef\.current && !blocked;\s*if \(loaded && !reread\) return;/);
  });
  it('a blocked store neither reads nor writes; the key is inside the ape:* wipe', () => {
    // Toddler pass 2 moved the read into readStore (a failed read must not
    // be written over); a blocked store still reads nothing.
    assert.match(store, /if \(saveBlocked\) return \{ state: empty\(\), ok: true \};/);
    assert.match(store, /if \(saveBlocked\) return false;/);
    assert.match(store, /const KEY = 'ape:drumtuning:v1';/);
  });
  it('credit banks ON COMPLETION, is never removed, and the end screen never blocks', () => {
    assert.match(host, /useEffect\(\(\) => \{\s*if \(loaded && complete && !done\) bank\(\);\s*\}, \[loaded, complete, done, bank\]\);/);
    assert.doesNotMatch(host, /disabled=\{!complete\}/);
    assert.match(host, /mode="progress"/);
  });
  it('the chapter interactives report through onInteractive from an effect, never in render', () => {
    for (const f of MODULES.filter((x) => x !== 'ch1Sound.tsx')) {
      const s = strip(read(`${DIR}/modules/${f}`));
      assert.match(s, /onInteractive\(\)/, f);
    }
    assert.match(strip(read(`${DIR}/modules/ch3Method.tsx`)), /useEffect\(\(\) => \{\s*if \(batterEven && !reported\.current\)/);
  });
  it('credit is not gameable: right flags, a seeded failing start, correct answers, a kit outside DISTINCT, a judgement after hearing, a hidden offset', () => {
    const kit = strip(read(`${DIR}/kit.tsx`));
    assert.match(kit, /if \(ok && !reported\.current\)/, 'a decision card reports only when the RIGHT option is reached');
    assert.match(kit, /onAnswered\?\.\(!firstWrong\.current\)/, 'and remembers whether the first pick was right');
    assert.match(kit, /shuffled\(s\.options\.length, hashId\(s\.id\)\)/, 'option order is stable per card');
    const ch2 = strip(read(`${DIR}/modules/ch2Prepare.tsx`));
    assert.match(ch2, /if \(perfect && !reported\.current\)/, 'Chapter 2 credit needs every flag right');
    const ch3 = strip(read(`${DIR}/modules/ch3Method.tsx`));
    assert.match(ch3, /const compose = \(base: HeadState, moved: number\[\]\)/, 'the practice head = hidden offsets + this run\'s moves');
    assert.match(ch3, /value: pass\.moved\[lug\] \?\? 0/, 'the TURN fader shows only this run\'s move');
    assert.doesNotMatch(ch3, /value: head\.turns\[lug\]/, 'the absolute offset is never on a fader');
    assert.match(ch3, /keyTurn=\{pass\.moved\[lug\] \?\? 0\}/, 'the key arrow shows this run of moves, never the hidden offset');
    assert.match(ch3, /showMap=\{mapShown \? true : 'hidden'\}/, 'the HEAR map is hidden until the learner has listened');
    assert.match(ch3, /if \(tapped\.size < SPEC\.lugs\)/, 'REVEAL MAP needs every lug tapped');
    assert.match(ch3, /which === 'batter' \? 'full' : 'brief'/, 'the resonant pass is independent');
    assert.match(ch3, /SHOW ME A MOVE/, 'a worked example before independent practice');
    const ch4 = strip(read(`${DIR}/modules/ch4Whole.tsx`));
    assert.match(ch4, /if \(allHeard && longestRight && !reported\.current\)/, 'Chapter 4 credit needs the right judgement');
    assert.match(ch4, /setTimeout\(\(\) => setHeard/, 'a relationship counts as heard only after it has sounded a while');
    const ch5 = strip(read(`${DIR}/modules/ch5Types.tsx`));
    assert.match(ch5, /if \(!touched\)/, 'Chapter 5 never credits an untouched drum');
    assert.match(ch5, /function seedFor\(goal: GoalId, drum: DrumKind\)/, 'every goal starts from a state that fails it');
    const ch6 = strip(read(`${DIR}/modules/ch6Kit.tsx`));
    assert.match(ch6, /useState\(140\)/);
    assert.match(ch6, /useState\(160\)/);
    assert.equal(engine.tomInterval(140, 160).kind, 'unbalanced', 'Chapter 6 starts clearly outside DISTINCT');
    const ch7 = strip(read(`${DIR}/modules/ch7Trouble.tsx`));
    assert.match(ch7, /const investigated = struck && tappedEnough;/, 'Chapter 7: strike (and tap) before a hypothesis');
    assert.match(ch7, /!investigated\s*\?[\s\S]*?: !hypothesised\s*\?[\s\S]*?optionsParam\(\{ id: 'where'/, 'then WHERE, then FIX');
    assert.match(ch7, /label: !struck \? 'HIT 1ST'/, 'the FIX slot is locked until the drum has been struck');
    assert.match(ch7, /k: 'VIEW'[^\n]*onPress: cycleView/, 'VIEW is a tap-to-cycle bezel cell, keeping the dock at five keys');
    assert.match(ch7, /hypothesisRight/);
    assert.match(ch7, /evidence\(\)/, 'the reply quotes the evidence');
    assert.match(ch7, /RESET CASE puts it back/, 'a wrong fix names what it left behind');
  });
  it('REVIEW pages ask for retrieval and refer to the learner\'s run; jargon is defined at first use; the caution is on the seating and method pages', () => {
    for (const f of MODULES) {
      const s = strip(read(`${DIR}/modules/${f}`));
      assert.ok((s.match(/<RecallCard /g) ?? []).length >= 3, `${f}: three recall cards`);
      assert.match(s, /<YourRun lines=/, `${f}: a "your run" summary`);
      assert.match(s, /TRY NEXT:/, `${f}: a try-next line`);
    }
    const ch1 = strip(read(`${DIR}/modules/ch1Sound.tsx`));
    assert.doesNotMatch(ch1, /j₀₁|2πR|degenerate/, 'no formula or mode-theory vocabulary on the beginner pages');
    assert.match(ch1, /the time it takes to fall 60 dB, which the lab calls T60/);
    assert.match(ch1, /cents \(hundredths of a semitone\)/);
    assert.match(ch1, /k: 'PITCH'/);
    assert.match(ch1, /k: '1ST OVERTONE'/);
    const content = read(`${DIR}/drumContent.ts`);
    assert.match(content, /tuner app keeps jumping between two notes/, 'scenario s2 is a listening question, not a physics quiz');
    assert.doesNotMatch(content, /Bessel/, 'no Bessel in the learner-facing content');
    assert.match(content, /In this model, /, 'the relationships are the model\'s measurements');
    assert.match(content, /describe the pitch bend of these two settings in opposite ways/);
    assert.doesNotMatch(content, /deepest apparent|least apparent/);
    assert.match(content, /never a wrench or pliers/, 'the caution');
    assert.match(strip(read(`${DIR}/modules/ch2Prepare.tsx`)), /CAUTION_TITLE/);
    assert.match(strip(read(`${DIR}/modules/ch3Method.tsx`)), /CAUTION_TITLE/);
    const ch2 = strip(read(`${DIR}/modules/ch2Prepare.tsx`));
    assert.match(ch2, /Hard hitters often choose thicker or two-ply batter heads/, 'no false universal about hard hitters');
    assert.doesNotMatch(ch2, /Hard hitters want more tension/);
  });
  it('the pure progress logic: answers, interactive flag, done, reset keeps done + notes, notes cap', async () => {
    memory.clear();
    progress.setDrumSaveBlocked(false);
    let s = await progress.updateDrumProgress((st) => {
      st.modules.sound = { done: false, answers: { s1: true } };
    });
    assert.equal(s.modules.sound?.answers.s1, true);
    s = await progress.updateDrumProgress((st) => {
      st.modules.method = { ...(st.modules.method ?? progress.emptyDrumChapter()), interactive: true, done: true };
      st.lastModule = 'method';
      st.lastStep = 2;
    });
    assert.equal(s.modules.method?.done, true);
    assert.equal(s.modules.method?.interactive, true);
    s = await progress.saveTuningNote({ id: 'n1', name: 'Club', savedAt: 1, drums: [{ drum: '12" × 8" rack tom', batterHz: 200, resoHz: 200, note: '' }] });
    assert.equal(s.notes.length, 1);
    s = await progress.resetDrumPractice();
    assert.equal(s.modules.method?.done, true, 'credit is never removed');
    assert.equal(s.modules.method?.interactive, undefined, 'the interactive flag clears for a fresh run');
    assert.deepEqual(s.modules.sound?.answers, {}, 'answers clear');
    assert.equal(s.lastModule, undefined);
    assert.equal(s.notes.length, 1, 'tuning notes survive a practice reset');
    for (let i = 0; i < progress.MAX_TUNING_NOTES + 5; i++) s = await progress.saveTuningNote({ id: `x${i}`, name: `n${i}`, savedAt: 10 + i, drums: [] });
    assert.equal(s.notes.length, progress.MAX_TUNING_NOTES, 'the list is capped');
    assert.ok(!s.notes.some((n) => n.id === 'n1'), 'oldest drops first');
    s = await progress.deleteTuningNote(s.notes[0].id);
    assert.equal(s.notes.length, progress.MAX_TUNING_NOTES - 1);
    assert.ok(memory.has('ape:drumtuning:v1'), 'written under the ape: key');
    // Blocked: nothing read, nothing written.
    progress.setDrumSaveBlocked(true);
    const blocked = await progress.loadDrumProgress();
    assert.deepEqual(blocked, { modules: {}, notes: [] });
    const before = memory.get('ape:drumtuning:v1');
    await progress.updateDrumProgress((st) => {
      st.modules.sound = { done: true, answers: {} };
    });
    assert.equal(memory.get('ape:drumtuning:v1'), before, 'a blocked store writes nothing');
    progress.setDrumSaveBlocked(false);
  });
  it('every scenario\'s key is one of its options; ids are unique', () => {
    const ids = new Set<string>();
    for (const sc of content.ALL_DRUM_SCENARIOS) {
      assert.ok(sc.options.includes(sc.correct), sc.id);
      assert.ok(!ids.has(sc.id), `duplicate ${sc.id}`);
      ids.add(sc.id);
      assert.ok(content.DRUM_CHAPTERS.some((c) => c.id === sc.chapterId));
    }
    for (const c of content.DRUM_CHAPTERS) assert.ok(content.DRUM_KEY_TERMS[c.id].length >= 2, `${c.id} key terms`);
  });
});

describe('audio honours the gate', () => {
  const hook = strip(read(`${DIR}/useDrumPlayback.ts`));
  it('nothing sounds before requestAudioOutput; silence and close unwind the transport; nothing replays by itself', () => {
    // The gate is awaited before anything else; a denied gate returns before
    // any load or play (toddler pass 2 reworded it to clear `pending`).
    assert.match(hook, /const granted = await requestAudioOutput\(\);\s*if \(!current\(\)\) return;\s*if \(!granted \|\| !focusedRef\.current\) \{\s*setPending\(false\);\s*return;\s*\}/);
    assert.match(hook, /useStopWhenSilenced\(playing \|\| pending, stop\)/);
    assert.match(hook, /useStopOnClose\(stop\)/);
    assert.match(hook, /isAudioOutputEnabled\(\)/);
    assert.match(hook, /new EarClipPlayer\(\)/, 'the house offline-render player (applyCeiling inside)');
    assert.doesNotMatch(hook, /setTimeout\([^)]*play/, 'no auto-replay timer');
    assert.match(hook, /const host = useContext\(StepHostContext\);[\s\S]*?if \(stepSeen\.current === hostStep\) return;[\s\S]*?stop\(\);/, 'a step change stops the sound (the Mastering rule)');
  });
  it('the picture re-renders on a control change without the gate; every chapter plays through the hook', () => {
    assert.match(hook, /renderNow\(\);\s*\}, 120\)/);
    for (const f of MODULES) {
      const s = strip(read(`${DIR}/modules/${f}`));
      // Every chapter has a HEAR step through the engine — Chapter 2's is
      // the known condition, struck (even rounds vs random turns).
      assert.ok(/useStrike\(|useTap\(|useDrumPlayback\(/.test(s), `${f}: plays through the gated hook`);
      if (/'▶ (STRIKE|TAP|RACK|FLOOR|BOTH)/.test(s)) assert.ok(/useStrike\(|useTap\(|useDrumPlayback\(/.test(s), `${f}: a ▶ key without the hook`);
      assert.doesNotMatch(s, /requestAudioOutput|createAudioPlayer/, `${f}: never bypasses the hook`);
    }
    assert.match(strip(read(`${DIR}/modules/ch2Prepare.tsx`)), /kind: 'HEAR', layout: 'rack'/, 'Chapter 2 has a HEAR step');
  });
});
