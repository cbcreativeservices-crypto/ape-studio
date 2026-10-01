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
    assert.match(s, /RUN PATTERN/);
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
  it('stage text never falls under the 9 pt floor (≥ 10.5 design units at 360 wide); RN text ≥ 9 pt', () => {
    for (const f of ['stagesDrum.tsx', 'stagesSignal.tsx']) {
      const s = strip(read(`${DIR}/${f}`));
      const sizes = [...s.matchAll(/fontSize=\{([\d.]+)\}/g)].map((m) => Number(m[1]));
      assert.deepEqual(sizes.filter((n) => n < 10.5), [], `${f}: a literal SVG font size under 10.5 units`);
    }
    assert.match(strip(read(`${DIR}/stagesDrum.tsx`)), /export const FONT = 11;/);
    assert.match(strip(read(`${DIR}/stagesDrum.tsx`)), /export const FONT_S = 10\.5;/);
    for (const f of ['kit.tsx', 'DrumTuningLabScreen.tsx', 'modules/ch6Kit.tsx']) {
      const rn = [...strip(read(`${DIR}/${f}`)).matchAll(/fontSize: ([\d.]+)/g)].map((m) => Number(m[1]));
      assert.deepEqual(rn.filter((n) => n < 9), [], `${f}: text under 9 pt`);
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
      assert.match(s, /levelColor\(/, f);
      assert.doesNotMatch(s, /#3fae52|#e8c341|#e6902f|#ff5f4e/, `${f}: ramp colours are sampled, never copied`);
    }
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
    assert.match(host, /setDrumSaveBlocked\(guest \|\| !resolved\)/);
    assert.match(host, /if \(!resolved \|\| loaded\) return;/);
  });
  it('a blocked store neither reads nor writes; the key is inside the ape:* wipe', () => {
    assert.match(store, /if \(saveBlocked\) return empty\(\);/);
    assert.match(store, /if \(saveBlocked\) return;/);
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
    assert.match(hook, /if \(!\(await requestAudioOutput\(\)\)\) return;/);
    assert.match(hook, /useStopWhenSilenced\(playing \|\| pending, stop\)/);
    assert.match(hook, /useStopOnClose\(stop\)/);
    assert.match(hook, /isAudioOutputEnabled\(\)/);
    assert.match(hook, /new EarClipPlayer\(\)/, 'the house offline-render player (applyCeiling inside)');
    assert.doesNotMatch(hook, /setTimeout\([^)]*play/, 'no auto-replay timer');
  });
  it('the picture re-renders on a control change without the gate; every chapter plays through the hook', () => {
    assert.match(hook, /renderNow\(\);\s*\}, 120\)/);
    for (const f of MODULES) {
      const s = strip(read(`${DIR}/modules/${f}`));
      // Chapter 2 (prepare) is the one silent chapter by design: inspection
      // and the animated pattern, no strike.
      if (f !== 'ch2Prepare.tsx') assert.ok(/useStrike\(|useTap\(|useDrumPlayback\(/.test(s), `${f}: plays through the gated hook`);
      if (/'▶ (STRIKE|TAP|RACK|FLOOR|BOTH)/.test(s)) assert.ok(/useStrike\(|useTap\(|useDrumPlayback\(/.test(s), `${f}: a ▶ key without the hook`);
      assert.doesNotMatch(s, /requestAudioOutput|createAudioPlayer/, `${f}: never bypasses the hook`);
    }
  });
});
