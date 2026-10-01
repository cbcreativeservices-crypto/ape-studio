/**
 * Mastering Lab — structure guard (owner build order 2026-10-01).
 *
 *  • REGISTRATION: catalog leaf (member, Mixing category), navigator route
 *    through withMembershipPreview, RootStackParamList entry, the
 *    `#labpreview/MasteringLab` harness entry.
 *  • NAV-STRIP ADOPTION: the host runs kit/LabNavBar in sub-step mode with
 *    the end screen, none of the retired words.
 *  • RACK + FULL SCREEN: every live page (a drawing + controls) is a
 *    MasteringRack → RackUnit with `fullScreen: true`, StageFit and a badge;
 *    every module has rack steps; readouts over 9 pt.
 *  • LEVEL COLOURS: amplitude tints come from features/tools/levelColor; the
 *    peak red is the app standard.
 *  • GUEST RULES: save-block from useLabEndGuest, first load waits for
 *    `resolved`, practice reset keeps `done`.
 *  • AUDIO: the gate, stop-when-silenced and stop-on-close are honoured.
 */
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it } from 'node:test';

const read = (p: string) => readFileSync(join(process.cwd(), p), 'utf8');
const strip = (s: string) => s.replace(/\r\n/g, '\n').replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '').replace(/\{\/\*[\s\S]*?\*\/\}/g, '');
const DIR = 'src/screens/lab/mastering';
const MODULES = readdirSync(join(process.cwd(), DIR, 'modules')).filter((f) => /^mod\d/.test(f));

describe('registration', () => {
  it('the catalog lists it as a members-only Mixing lab with a real route', () => {
    const cat = read('src/screens/lab/labCatalog.ts');
    assert.match(cat, /name: 'Mastering Lab: From Final Mix to Release'[^\n]*route: 'MasteringLab', member: true/);
    const mixingBlock = cat.slice(cat.indexOf("id: 'mixingworkflow'"), cat.indexOf("route: 'MasteringLab'"));
    assert.match(mixingBlock, /section: 'training'/, 'it lives in the training section (Mixing category)');
  });
  it('the navigator registers it through withMembershipPreview', () => {
    const nav = strip(read('src/navigation/RootNavigator.tsx'));
    assert.match(nav, /import \{ MasteringLabScreen \} from '\.\.\/screens\/lab\/mastering\/MasteringLabScreen'/);
    assert.match(nav, /MasteringLab: withMembershipPreview\(MasteringLabScreen\)/);
    assert.match(nav, /<Stack\.Screen name="MasteringLab" component=\{MemberGated\.MasteringLab\} \/>/);
    assert.match(read('src/navigation/types.ts'), /MasteringLab: undefined;/);
  });
  it('the browser harness can open it by name', () => {
    assert.match(read('App.tsx'), /MasteringLab: MasteringLabScreen as ComponentType/);
  });
  it('the lab menu draws it as a glass tile like its neighbours (catalog-driven)', () => {
    const menu = strip(read('src/screens/lab/EarLabScreen.tsx'));
    assert.match(menu, /categoryEntries\(cat\)\.map\(\(leaf\)/);
    assert.match(menu, /<GlassTile/);
  });
});

describe('shared navigation strip', () => {
  const host = strip(read(`${DIR}/MasteringLabScreen.tsx`));
  it('adopts kit/LabNavBar in sub-step mode with the what\'s-left end screen', () => {
    assert.match(host, /from '\.\.\/kit\/LabNavBar'/);
    assert.match(host, /<LabHeader\b/);
    assert.match(host, /<LabNavBar nav=\{nav\} \/>/);
    assert.match(host, /useLabNav\(\{/);
    assert.match(host, /sub,/);
    assert.match(host, /<LabEndScreen\b/);
    assert.match(host, /<LabNextButton \/>/, 'a read step ends on the shared in-flow NEXT');
    assert.match(host, /reset: \{ label: 'START OVER \(PRACTICE\)'/);
  });
  it('none of the retired words, no raw Alert', () => {
    for (const w of ['‹ BACK', 'CONTINUE ›', '⏮ START', 'SKIP AHEAD', 'styles.topNav', 'Alert.alert']) assert.ok(!host.includes(w), `host carries "${w}"`);
    assert.match(host, /confirmDialog\(/);
  });
  it('eight modules, each a run of steps, with CONTENTS as the direct jump', () => {
    assert.match(host, /MASTERING_MODULES\.map\(\(x\) => \(\{ id: x\.id, title: x\.title, done: doneIds\.has\(x\.id\) \}\)\)/);
    assert.equal(MODULES.length, 8);
  });
});

describe('rack + full screen on every live page', () => {
  const rack = strip(read(`${DIR}/MasteringRack.tsx`));
  it('MasteringRack is a RackUnit with FULL SCREEN on, StageFit and a badge', () => {
    assert.match(rack, /<RackUnit\b/);
    assert.match(rack, /fullScreen: true/);
    assert.match(rack, /<StageFit\b/);
    assert.match(rack, /badge: spec\.badge/);
    assert.match(rack, /bezel: spec\.bezel/);
  });
  it('every module has at least one rack step and every rack step declares a badge, bezel and a bound param', () => {
    for (const f of MODULES) {
      const s = strip(read(`${DIR}/modules/${f}`));
      const racks = s.match(/layout: 'rack'/g) ?? [];
      assert.ok(racks.length >= 1, `${f} has no rack step`);
      assert.equal((s.match(/badge:/g) ?? []).length >= racks.length, true, `${f}: a badge per rack`);
      assert.equal((s.match(/initialParam:/g) ?? []).length, racks.length, `${f}: initialParam per rack`);
      assert.equal((s.match(/bezel: \[/g) ?? []).length, racks.length, `${f}: bezel per rack`);
      assert.ok(!/<Slider|<ControlSlider/.test(s), `${f}: no control drawn in the well above the display`);
    }
  });
  it('the LISTEN pages are racks (display above, transport in the dock) and say MEASURED', () => {
    for (const f of ['mod1What.tsx', 'mod5Workflow.tsx', 'mod6Loudness.tsx']) {
      const s = strip(read(`${DIR}/modules/${f}`));
      assert.match(s, /kind: 'LISTEN', layout: 'rack'/, `${f}`);
      assert.match(s, /RENDER_BADGE/, `${f}: measured badge`);
      assert.match(s, /label: '■ STOP'/, `${f}: stop in the dock`);
      assert.match(s, /<WaveOverviewStage/, `${f}: the real-time-base overview on the glass`);
    }
  });
  it('stage text never falls under the 9 pt floor (≥ 10.5 design units at 360 wide)', () => {
    const s = strip(read(`${DIR}/stages.tsx`));
    assert.match(s, /const FONT = 11;/);
    assert.match(s, /const FONT_S = 10\.5;/);
    const sizes = [...s.matchAll(/fontSize=\{([\d.]+)\}/g)].map((m) => Number(m[1]));
    assert.deepEqual(sizes.filter((n) => n < 10.5), [], 'a literal SVG font size under 10.5 units');
    const rn = [...strip(read(`${DIR}/kit.tsx`)).matchAll(/fontSize: ([\d.]+)/g)].map((m) => Number(m[1]));
    assert.deepEqual(rn.filter((n) => n < 9), [], 'kit text under 9 pt');
    const host = [...strip(read(`${DIR}/MasteringLabScreen.tsx`)).matchAll(/fontSize: ([\d.]+)/g)].map((m) => Number(m[1]));
    assert.deepEqual(host.filter((n) => n < 9), []);
  });
  it('the playhead and the stage zoom are SharedValue / viewBox driven, never per-frame React state', () => {
    const hook = strip(read(`${DIR}/useMasterPlayback.ts`));
    assert.match(hook, /useSharedValue\(0\)/);
    assert.match(hook, /useFrameCallback\(/);
    const st = strip(read(`${DIR}/stages.tsx`));
    assert.match(st, /useAnimatedStyle\(/);
    assert.match(st, /viewBox=\{`0 0 \$\{W\}/);
  });
});

describe('level colours', () => {
  it('every amplitude tint comes from features/tools/levelColor; the peak red is the standard', () => {
    const st = strip(read(`${DIR}/stages.tsx`));
    assert.match(st, /from '\.\.\/\.\.\/\.\.\/features\/tools\/levelColor'/);
    assert.match(st, /levelColor\(/);
    assert.match(st, /MIDLINE_BLUE/);
    assert.match(st, /splColorForDba\(/);
    const kit = strip(read(`${DIR}/kit.tsx`));
    assert.match(kit, /export const PEAK_RED = '#ff5a48';/);
    assert.match(kit, /levelColorForDb\(/);
    // No second ramp: no raw rainbow hex list for levels in the lab.
    assert.doesNotMatch(st, /#3fae52|#e8c341|#e6902f|#ff5f4e/, 'ramp colours are sampled, never copied');
  });
  it('level faders ride the amplitude lane', () => {
    const m6 = strip(read(`${DIR}/modules/mod6Loudness.tsx`));
    assert.match(m6, /id: 'drive'[^\n]*level: true/);
  });
});

describe('guest rules and persistence', () => {
  const host = strip(read(`${DIR}/MasteringLabScreen.tsx`));
  const store = strip(read(`${DIR}/masteringProgress.ts`));
  it('the save-block flag is set from useLabEndGuest every render; the first load waits for resolved', () => {
    assert.match(host, /setMasteringSaveBlocked\(useLabEndGuest\(\)\)/);
    assert.match(host, /const \{ resolved \} = useEntitlement\(\);/);
    assert.match(host, /if \(!resolved \|\| loaded\) return;/);
  });
  it('a blocked store neither reads nor writes; a practice reset keeps done', () => {
    assert.match(store, /if \(saveBlocked\) return \{ modules: \{\} \};/);
    assert.match(store, /if \(saveBlocked\) return;/);
    assert.match(store, /done: !!s\.modules\[id\]\?\.done/);
    assert.match(store, /const KEY = 'ape:mastering:v1';/, 'inside the ape:* account wipe');
  });
  it('credit is banked by the way forward, never removed, and the end screen never blocks', () => {
    assert.match(host, /if \(complete && !done\) bank\(\);/);
    assert.doesNotMatch(host, /disabled=\{!complete\}/);
    assert.match(host, /onDone=\{\(\) => navigation\.goBack\(\)\}/);
  });
});

describe('audio honours the gate', () => {
  const hook = strip(read(`${DIR}/useMasterPlayback.ts`));
  it('nothing sounds before requestAudioOutput; silence and close unwind the transport', () => {
    assert.match(hook, /if \(!\(await requestAudioOutput\(\)\)\) return;/);
    assert.match(hook, /useStopWhenSilenced\(active != null \|\| pending != null, stopAll\)/);
    assert.match(hook, /useStopOnClose\(stopAll\)/);
    assert.match(hook, /isAudioOutputEnabled\(\)/);
    assert.match(hook, /new EarClipPlayer\(\)/, 'the house offline-render player (applyCeiling inside)');
  });
  it('the LEARN pages never pay for the programme render at mount', () => {
    for (const f of ['mod4Tools.tsx', 'mod6Loudness.tsx']) assert.match(strip(read(`${DIR}/modules/${f}`)), /programmeIfRendered\(\)/, f);
  });
  it('the lab retains the session stems while open and releases on close', () => {
    const host = strip(read(`${DIR}/MasteringLabScreen.tsx`));
    assert.match(host, /retainSessionStems\(\)/);
    assert.match(host, /releaseProgramme\(\)/);
  });
});
