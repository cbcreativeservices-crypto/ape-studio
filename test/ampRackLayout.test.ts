/**
 * GUARD — the Amplifier Principles lab lives on the Rack Unit.
 *
 * OWNER (TestFlight build 32, 2026-09-30): "Amplifier principles needs a rework
 * of its screen and rack system. We've got displays below controls, which
 * means your fingers block what you see, so this whole lab needs a redo on
 * the rack system design."
 *
 * The law (governance D24): reading may scroll; operating may not. Every page
 * with a live display + controls is a RackUnit — DISPLAY ABOVE, CONTROLS
 * BELOW. These tests pin the structure so a later edit cannot quietly put a
 * slider back on the page above the thing it drives.
 */
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const read = (p: string) => readFileSync(join(process.cwd(), p), 'utf8');
const strip = (s: string) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
const AMP = 'src/screens/lab/amp';
const MODULES = ['mod1What', 'mod2Devices', 'mod3Bias', 'mod4Classes', 'mod5ClassD', 'mod6Supply', 'mod7RealWorld', 'mod8Apply'];

describe('AmpRack — the rig on the Rack Unit', () => {
  const s = strip(read(`${AMP}/AmpRack.tsx`));
  test('renders RackUnit with FULL SCREEN on and the picture on the glass', () => {
    assert.match(s, /<RackUnit\b/);
    assert.match(s, /fullScreen: true/);
    assert.match(s, /<WaveStack\b/, 'the waveform stack is the stage drawing');
    assert.match(s, /<StageFit\b/, 'the stage keeps its own shape (full screen zooms the drawing, not a stretched box)');
  });
  test('the status readouts are bezel cells and the transport is a dock key — nothing under the display but the well', () => {
    assert.match(s, /bezel: spec\.bezel/);
    assert.match(s, /label: 'RUN'/);
    assert.match(s, /label: 'STEP ¼'/, 'reduced motion keeps its step control');
    assert.match(s, /params = useMemo\(\(\) => \[\.\.\.spec\.params, \.\.\.transportParams\]/);
  });
  test('the dock helpers map the lab’s ranges onto the lane and keep sticky trays for A/B', () => {
    assert.match(s, /export function faderParam/);
    assert.match(s, /export function optionsParam/);
    assert.match(s, /sticky: o\.sticky \?\? true/);
  });
});

describe('AmpRig — a drawing, not a page', () => {
  const s = strip(read(`${AMP}/AmpRig.tsx`));
  test('no control, no status row, no transport button is rendered by the rig itself', () => {
    assert.doesNotMatch(s, /<Pressable/, 'the rig file must not render buttons under the display');
    assert.doesNotMatch(s, /ExpandableFigure/);
    assert.doesNotMatch(s, /FigureDock/);
    assert.match(s, /export function WaveStack/);
    assert.match(s, /export function rigStatusBezel/);
  });
  test('panel titles grow with the full-screen zoom and never fall under 9 pt', () => {
    assert.match(s, /fontSize: TITLE_FONT \* scale/);
    const tf = s.match(/const TITLE_FONT = (\d+(?:\.\d+)?)/);
    assert.ok(tf && Number(tf[1]) >= 9);
  });
});

describe('the module host runs steps, not one long page', () => {
  const s = read(`${AMP}/AmpModuleScreen.tsx`);
  test('the screen hands the module a step host and a document scroller for read steps', () => {
    assert.match(s, /AmpStepHostContext\.Provider value=\{host\}/);
    assert.match(s, /styles\.scroll, readingColumn/);
    assert.doesNotMatch(s, /<AmpRig\b/);
  });
  test('module navigation is the shared strip in sub-step mode: credit banks on NEXT, nothing blocks, FINISH ends on what’s left', () => {
    // The shared lab navigation (owner 2026-09-30) replaced the local step
    // strip, SKIP AHEAD and "MARK COMPLETE & CONTINUE" (CONTINUE is retired).
    assert.match(s, /<LabNavBar nav=\{nav\} \/>/);
    assert.match(s, /<LabNavProvider value=\{nav\}>/);
    assert.match(s, /sub: \{ index: stepIdx, count: stepCount, titles: stepTitles, go: setStep \}|\{ index: stepIdx, count: stepCount, titles: stepTitles, go: setStep \}/, 'PREV / NEXT walk the module’s steps');
    // The credit action stays in the tail and goes through the strip's NEXT.
    assert.match(s, /MARK COMPLETE ›/);
    assert.match(s, /onPress=\{nav\.next\}/);
    // NEXT past the last step banks the module first when every check is in —
    // never a wall: with checks open it simply moves on (the old SKIP AHEAD).
    assert.match(s, /const beforeAdvance = useCallback\(\(\) => \{\s*\n\s*if \(allChecksAnswered && !done\) bank\(\);/);
    assert.doesNotMatch(s, /SKIP AHEAD/);
    // FINISH › opens the what's-left screen in place; a module move is replace.
    assert.match(s, /finish: showEnd/);
    assert.match(s, /navigation\.replace\('AmpModule', \{ id: target\.id \}\);/);
  });
  test('steps.tsx renders a rack step inside AmpRack and a read step through the host scroller; the way forward is LabNextButton', () => {
    const st = strip(read(`${AMP}/steps.tsx`));
    assert.match(st, /<AmpRack key=\{s\.key\} spec=\{s\.rack\}>/);
    assert.match(st, /host\.readWrap\(body\)/);
    // steps.tsx draws no NEXT STEP button of its own: a RackUnit well appends
    // LabNextButton under the provider, and the host's readWrap appends it to
    // a read step.
    assert.doesNotMatch(st, /NEXT STEP/);
    assert.doesNotMatch(st, /<Pressable/);
    assert.match(s, /\{body\}\s*\n\s*<LabNextButton \/>\s*\n\s*<\/ScrollView>/, 'a read step ends with the shared NEXT / FINISH');
  });
});

describe('every module is on the rack; controls sit in the dock, never on the page above a display', () => {
  for (const m of MODULES) {
    const raw = read(`${AMP}/modules/${m}.tsx`);
    const s = strip(raw);
    test(`${m}: declares its steps through AmpModuleSteps`, () => {
      assert.match(s, /<AmpModuleSteps/);
      assert.doesNotMatch(s, /<AmpRig\b/, 'the old page rig is gone');
      assert.doesNotMatch(s, /import \{[^}]*\bAmpRig\b[^}]*\} from '\.\.\/AmpRig'/, 'the rig is imported as a picture type and helpers only');
    });
    test(`${m}: every rack step has a rig or a stage, a bezel, dock params and a bound parameter`, () => {
      const racks = s.split("kind: 'rack'").slice(1);
      for (const r of racks) {
        const block = r.slice(0, r.indexOf('well:'));
        assert.ok(/\brig: \w+|stage: \{/.test(block), `${m}: a rack step without a display`);
        assert.match(block, /bezel:/, `${m}: a rack step without bezel readouts`);
        assert.match(block, /params:/, `${m}: a rack step without dock params`);
        assert.match(block, /initialParam:/, `${m}: a rack step without a bound parameter`);
      }
    });
    test(`${m}: no slider is drawn on the page — a ControlSlider may only ride an inline figure's FULL SCREEN dock`, () => {
      const sliders = (s.match(/<ControlSlider\b/g) ?? []).length;
      const docks = (s.match(/controls=\{<FigureDock>/g) ?? []).length;
      // Module 7's power-ratio calculator is a card with a number, not a
      // display — the one slider allowed on a reading page.
      const allowance = m === 'mod7RealWorld' ? 1 : 0;
      assert.ok(sliders <= docks + allowance, `${m}: ${sliders} ControlSlider(s) for ${docks} figure dock(s) — a slider is sitting on the page`);
    });
    test(`${m}: an inline figure with controls docks them BELOW it (FigureDock), never above`, () => {
      for (const mm of s.matchAll(/controls=\{([^}]*)\}/g)) assert.match(mm[1], /<FigureDock>/, `${m}: figure controls not in a FigureDock`);
    });
  }
  test('the rig steps bind the lane to the page’s teaching parameter', () => {
    assert.match(read(`${AMP}/modules/mod1What.tsx`), /initialParam: 'level'/);
    assert.match(read(`${AMP}/modules/mod3Bias.tsx`), /initialParam: 'bias'/);
    assert.match(read(`${AMP}/modules/mod3Bias.tsx`), /initialParam: 'ppbias'/);
    assert.match(read(`${AMP}/modules/mod4Classes.tsx`), /initialParam: 'drive'/);
    assert.match(read(`${AMP}/modules/mod6Supply.tsx`), /initialParam: 'drive'/);
    assert.match(read(`${AMP}/modules/mod8Apply.tsx`), /initialParam: 'src'/);
  });
  test('the rig status (supply · heat · efficiency · load) is printed on the bezel where a module shows it', () => {
    for (const m of ['mod1What', 'mod3Bias', 'mod4Classes', 'mod5ClassD', 'mod8Apply']) assert.match(read(`${AMP}/modules/${m}.tsx`), /rigStatusBezel\(/, m);
  });
});

/**
 * REVIEW PASS (audio-expert + cognitive, 2026-09-30): every number and every
 * trace on the glass must answer to the engine, and every dock control must
 * change the PICTURE, not only a readout.
 */
describe('review pass — readouts answer to the engine, controls change the picture', () => {
  test('module 5: the bezel never prints the cycle-average duty (≈50 % at every level — ampModel.test pins it); it prints the swing', () => {
    const m5 = strip(read(`${AMP}/modules/mod5ClassD.tsx`));
    assert.doesNotMatch(m5, /k: 'DUTY AVG'/, 'a readout that sits still while LEVEL moves is a decoy');
    assert.match(m5, /k: 'AT TROUGH', v: `\$\{Math\.round\(dutyAtTrough \* 100\)\}%`/);
    assert.match(m5, /k: 'AT PEAK', v: `\$\{Math\.round\(dutyAtPeak \* 100\)\}%`/);
    assert.match(m5, /const dutyAtTrough = \(1 - Math\.min\(0\.95, drive\)\) \/ 2/);
  });
  test('module 5: LEVEL changes the switching-stage DRAWING — one period of the pulse on the node, devices filled by their on-time', () => {
    const m5 = strip(read(`${AMP}/modules/mod5ClassD.tsx`));
    assert.match(m5, /<Path d=\{pulse\}/, 'the pulse itself is drawn on the switching node');
    assert.match(m5, /fillOpacity=\{0\.08 \+ 0\.5 \* d\}/, 'high side fills with its duty');
    assert.match(m5, /fillOpacity=\{0\.08 \+ 0\.5 \* \(1 - d\)\}/, 'low side fills with the rest of the period');
  });
  test('module 8: the challenge waveform follows the CHAIN — a stage that clips upstream arrives at the amplifier flat-topped', () => {
    const m8 = strip(read(`${AMP}/modules/mod8Apply.tsx`));
    assert.match(m8, /amplify\(amplify\(sineCycle\(1\), challenge\.gs\.levels\.source, 1\), chMixer \* 1\.6, 1\)/, 'the amp input is the source, then the mixer, each at its own ceiling');
    assert.match(m8, /amplify\(chInput, chAmp \* 1\.6, challenge\.railLimit\)/, 'the output amplifies THAT input to the rail');
    assert.doesNotMatch(m8, /amplify\(sineCycle\(1\), Math\.min\(challenge\.gs\.levels\.amp/, 'the old clean-sine-whatever-clipped picture is gone');
  });
  test('the rig draws a second device only when one exists, and a single device can set its own full scale', () => {
    const rig = strip(read(`${AMP}/AmpRig.tsx`));
    assert.match(rig, /export function hasNegDevice/);
    assert.match(rig, /\{hasNegDevice\(p\.devices\) \? \(\s*<Polyline points=\{tracePoints\(p\.devices\.iNeg/, 'no purple dashed line at zero for a one-device picture');
    assert.match(rig, /'DEVICE CURRENT \(gold\)'/, 'the default title names one device when there is one');
    assert.match(rig, /p\.deviceYMax \?\? 2\.1/);
    assert.match(read(`${AMP}/modules/mod3Bias.tsx`), /deviceYMax: 1\.05/, 'the bias rig shows its 0..1 device at full scale');
  });
  test('module 7: the loudness note carries both rules — +3 dB per doubling, about +10 dB for twice as loud', () => {
    const m7 = read(`${AMP}/modules/mod7RealWorld.tsx`);
    assert.match(m7, /\+3 dB is clearly audible/);
    assert.match(m7, /\+10 dB — ten times the power — is what most listeners call twice as loud/);
  });
});

describe('text and readouts', () => {
  test('no lab display text under 9 pt in the amp screen files', () => {
    for (const f of ['AmpRack.tsx', 'AmpRig.tsx', 'steps.tsx', 'AmpModuleScreen.tsx']) {
      const s = read(`${AMP}/${f}`);
      for (const m of s.matchAll(/fontSize: ([\d.]+)/g)) assert.ok(Number(m[1]) >= 9, `${f}: fontSize ${m[1]}`);
    }
  });
  test('state words on the bezel are short enough to never crop the number (module 6, module 8)', () => {
    // Both bezels hold FIVE cells. On a 390-wide phone a five-cell window is
    // (390 − 20 − 2) / 5 = 73.6 pt, minus 16 pt padding → 57.6 pt of mono at
    // 8.1 pt per character = 7 characters (BezelReadouts). An 8- or 9-letter
    // word is ellipsized — THERM-LIM shipped that way (review 2026-09-30).
    const FIVE_CELL_MAX = 7;
    const m6 = read(`${AMP}/modules/mod6Supply.tsx`);
    for (const w of m6.match(/STATE_SHORT = \{([\s\S]*?)\}/)![1].matchAll(/'([A-Z\- ]+)'/g)) assert.ok(w[1].length <= FIVE_CELL_MAX, w[1]);
    const m8 = read(`${AMP}/modules/mod8Apply.tsx`);
    const faults = [...m8.match(/FAULT_SHORT: Record<FaultId, string> = \{([\s\S]*?)\};/)![1].matchAll(/: '([A-Z\- ]+)'/g)];
    assert.equal(faults.length, 10, 'every FaultId has a short word');
    for (const w of faults) assert.ok(w[1].length <= FIVE_CELL_MAX, w[1]);
  });
  test('module 3: the handoff cell never says HOT — the handoff is clean there, the HEAT cell says hot', () => {
    const m3 = read(`${AMP}/modules/mod3Bias.tsx`);
    assert.match(m3, /k: 'HANDOFF', v: taskSolved \? 'CLEAN' : tooHot \? 'OVERBIAS' : 'NOTCH'/);
  });
  test('the preview harness can open any amp module by id', () => {
    const app = read('App.tsx');
    assert.match(app, /AmpModule: AmpModuleScreen as ComponentType/);
  });
});
