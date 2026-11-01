/**
 * D41 behaviour fixes in the shared LabShell (owner-approved 2026-11-01).
 *
 *   #3 / #12 / #14  Binaural, Stereo Imaging and FM ended the CHECK on the
 *        "Lab complete" card with no what's-left screen (owner hard rule:
 *        every lab ends on one). They now pass `checkEnd={<LabCheckEnd …/>}`
 *        (kit/LabCheckEnd.tsx),
 *        the shared FINISH · SEE WHAT'S LEFT link + LabEndScreen layer built
 *        like ModularLabEnd, with its own END guide.
 *   #13  Switching tabs unmounted LabUnderstandingCheck and lost the answers
 *        already right. The CHECK now stays mounted, hidden like the RackUnit.
 *   #11  The open screen guide only reset on a tab change, so Harmonic's
 *        MODEL guide stayed up after MODE → REAL SIGNAL. The host's resetKey
 *        now follows the guide object on screen as well as the tab.
 */
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it } from 'node:test';

const ROOT = process.cwd();
const read = (p: string) => readFileSync(join(ROOT, p), 'utf8').replace(/\r\n/g, '\n');
/** Source with comments stripped — a name in a comment proves nothing. */
const code = (p: string) => read(p).replace(/\{\/\*[\s\S]*?\*\/\}/g, '').replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');

const SHELL = code('src/screens/lab/LabShell.tsx');
const END = code('src/screens/lab/kit/LabCheckEnd.tsx');
const { SCREEN_GUIDE_SECTIONS, SCREEN_GUIDE_BUDGET } = await import('../src/features/lab/screenGuide/types.ts');
const { BINAURAL_END_GUIDE } = await import('../src/screens/lab/binauralScreenGuides.ts');
const { STEREO_END_GUIDE } = await import('../src/screens/lab/stereoScreenGuides.ts');
const { FM_END_GUIDE } = await import('../src/screens/lab/fmScreenGuides.ts');
const { harmonicScreenGuide } = await import('../src/screens/lab/harmonicScreenGuides.ts');
const { bassScreenGuide } = await import('../src/screens/lab/bassScreenGuides.ts');

type Guide = Record<string, string[]>;
const SECTION_KEYS = SCREEN_GUIDE_SECTIONS.map((s: { key: string }) => s.key);

describe('#13 the CHECK stays mounted across a tab switch', () => {
  it('rendered whenever the lab has a check, hidden (not unmounted) off its tab — like the RackUnit', () => {
    assert.match(SHELL, /const hasCheck = modes\.some\(\(m\) => m\.key === 'check'\);/);
    assert.match(
      SHELL,
      /\{hasCheck \? \(\s*<View style=\{mode === 'check' \? styles\.rackFill : styles\.rackHidden\}>\s*<ScrollView[\s\S]*?<LabUnderstandingCheck[\s\S]*?\{checkEnd \?\? null\}\s*<\/View>\s*<\/ScrollView>\s*<\/View>\s*\) : null\}/,
    );
    assert.doesNotMatch(SHELL, /\{mode === 'check' \? \(/, 'the old mount-only-on-CHECK branch is gone');
    assert.match(SHELL, /rackHidden: \{ display: 'none' \}/);
  });
  it('a lab with no check never mounts one (an empty check would read as passed)', () => {
    assert.match(SHELL, /return hasUnderstandingCheck\(labId\) \? \[\.\.\.BASE_MODES, \{ key: 'check' as const, label: 'CHECK' \}\] : BASE_MODES;/);
  });
  it('nothing new is persisted: the answered set stays local to LabUnderstandingCheck', () => {
    const c = code('src/components/LabUnderstandingCheck.tsx');
    assert.match(c, /const \[correct, setCorrect\] = useState<Set<string>>/);
    assert.doesNotMatch(c, /AsyncStorage|createLocalStore/);
  });
});

describe('#11 the guide host resets when the guide on screen changes, not only the tab', () => {
  it('resetKey = tab + the guide object’s stable id', () => {
    assert.match(SHELL, /<ScreenGuideHost resetKey=\{`\$\{mode\}:\$\{guideIdOf\(shownGuide\)\}`\} regions=\{!!rack && mode === 'explore'\}>/);
    assert.match(SHELL, /const shownGuide = typeof guide === 'function' \? guide\(mode\) : mode === 'explore' \? guide : undefined;/);
    assert.match(SHELL, /const guideIds = new WeakMap<ScreenGuide, number>\(\);/);
    assert.match(SHELL, /export function guideIdOf\(g: ScreenGuide \| undefined\): number \{\s*if \(!g\) return 0;\s*let id = guideIds\.get\(g\);\s*if \(id === undefined\) \{\s*id = nextGuideId\+\+;\s*guideIds\.set\(g, id\);\s*\}\s*return id;\s*\}/);
    // The host closes an open guide on any resetKey change.
    assert.match(code('src/features/lab/screenGuide/ScreenGuide.tsx'), /useEffect\(\(\) => setShown\(null\), \[resetKey\]\);/);
  });
  it('Harmonic: MODE swaps the EXPLORE guide object (so the key changes); each is a fixed object (so a re-render never does)', () => {
    const model = harmonicScreenGuide('explore', 'model');
    const live = harmonicScreenGuide('explore', 'live');
    assert.ok(model && live && model !== live);
    assert.equal(harmonicScreenGuide('explore', 'model'), model);
    assert.equal(harmonicScreenGuide('explore', 'live'), live);
    assert.match(code('src/screens/lab/HarmonicLabScreen.tsx'), /guide=\{\(mode\) => harmonicScreenGuide\(mode, view\)\}/);
  });
  it('Bass (the other in-screen mode switch) gets the same reset', () => {
    assert.notEqual(bassScreenGuide('explore', 'fretted'), bassScreenGuide('explore', 'harmonics'));
    assert.equal(bassScreenGuide('explore', 'fretted'), bassScreenGuide('explore', 'fretted'));
  });
});

describe('#3 / #12 / #14 Binaural, Stereo Imaging and FM end on a what’s-left screen', () => {
  it('LabCheckEnd: FINISH link → shared LabEndScreen layer, credit mode, the one check unit, nothing auto-appears', () => {
    const m = END.match(/export function LabCheckEnd\([\s\S]*?\n\}\n/);
    assert.ok(m, 'LabCheckEnd exists');
    const c = m![0];
    assert.match(c, /const \[open, setOpen\] = useState\(false\);/, 'closed until a tap (Low-Light: nothing auto-appears)');
    assert.match(c, /<LabEndLink\s+onPress=\{\(\) => \{\s*onOpen\?\.\(\);\s*setOpen\(true\);/);
    assert.match(c, /const cleared = useLabClearedUnits\(labId\);/);
    assert.match(c, /<LabEndScreen[\s\S]*units=\{CHECK_END_UNITS\}[\s\S]*mode="credit"[\s\S]*noun="check"[\s\S]*onJump=\{close\}\s*onPracticeAgain=\{close\}/);
    assert.match(c, /runSoon\(\(\) => safeGoBack\(navigation\)\)/);
    assert.match(c, /<ScreenGuideHost regions=\{false\}[\s\S]*<ScreenGuideKey title="WHERE YOU ARE" guide=\{endGuide\} \/>/);
    assert.match(END, /id: UNDERSTANDING_UNIT,\s*label: 'Understanding check',[\s\S]*?kind: 'check',/);
    for (const f of ['BinauralLabScreen', 'FmLabScreen', 'FxLabScreen']) assert.match(code(`src/screens/lab/${f}.tsx`), /import \{ LabCheckEnd \} from '\.\/kit\/LabCheckEnd';/, f);
  });
  it('each lab passes it as checkEnd, stopping its sound, with its END guide', () => {
    assert.match(code('src/screens/lab/BinauralLabScreen.tsx'), /checkEnd=\{<LabCheckEnd labId="binaural" labTitle="Binaural Panner Lab" onOpen=\{stop\} endGuide=\{BINAURAL_END_GUIDE\} \/>\}/);
    assert.match(code('src/screens/lab/FmLabScreen.tsx'), /checkEnd=\{<LabCheckEnd labId="fm" labTitle="FM Synth Lab" onOpen=\{stop\} endGuide=\{FM_END_GUIDE\} \/>\}/);
    assert.match(
      code('src/screens/lab/FxLabScreen.tsx'),
      /checkEnd=\{\s*config\.labId === 'stereo' \? \(\s*<LabCheckEnd labId="stereo" labTitle="Stereo Imaging Lab" onOpen=\{stop\} endGuide=\{STEREO_END_GUIDE\} \/>\s*\) : undefined\s*\}/,
    );
  });
  const ENDS: [string, Guide][] = [
    ['binaural', BINAURAL_END_GUIDE as unknown as Guide],
    ['stereo', STEREO_END_GUIDE as unknown as Guide],
    ['fm', FM_END_GUIDE as unknown as Guide],
  ];
  for (const [id, gd] of ENDS) {
    it(`${id} END guide: five sections, the budgets, the copy rules, the screen’s names`, () => {
      assert.deepEqual(Object.keys(gd).sort(), [...SECTION_KEYS].sort());
      for (const k of SECTION_KEYS) assert.ok(gd[k].length >= 1 && gd[k].length <= 5, `${id}.${k}`);
      assert.ok(gd.tryThis.length >= 2 && gd.tryThis.length <= 3);
      for (const s of SCREEN_GUIDE_SECTIONS as readonly { key: string; place: string }[]) {
        if (s.place === 'strip') {
          for (const item of gd.tryThis) assert.ok(item.length <= SCREEN_GUIDE_BUDGET.tryItem, `${id}.tryThis ${item.length}`);
          continue;
        }
        const cap = s.place === 'high' ? SCREEN_GUIDE_BUDGET.high : SCREEN_GUIDE_BUDGET.low;
        assert.ok(gd[s.key].join(' ').length <= cap, `${id}.${s.key}: ${gd[s.key].join(' ').length} > ${cap}`);
      }
      const t = SECTION_KEYS.map((k: string) => gd[k].join('\n')).join('\n');
      assert.doesNotMatch(t, /\b\d+\s+of\s+\d+\b/i, 'no "N of total"');
      assert.doesNotMatch(t, /\brecommend|\bmaster(y|ed)?\b/i);
      const end = code('src/screens/lab/kit/LabEndScreen.tsx') + code('src/screens/lab/kit/labEnd.ts') + END;
      for (const n of ['Where you are', '‹ BACK TO THE LAB', 'PRACTICE AGAIN FROM THE START', 'DONE · BACK TO LABS', 'YOUR PROGRESS', 'REVIEW ▾', 'CREDITED', 'Understanding check']) {
        assert.ok(end.includes(n), `"${n}" is on the end screen`);
        assert.ok(t.includes(n), `${id}: the END guide names "${n}"`);
      }
    });
  }
});

describe('D41 #13: no lab-screen guide still says a tab switch clears the check', () => {
  it('no *ScreenGuides.ts under src/screens/lab says the questions start fresh on return', () => {
    const dir = join(process.cwd(), 'src/screens/lab');
    const files = readdirSync(dir).filter((f) => f.endsWith('ScreenGuides.ts'));
    assert.ok(files.length > 10);
    for (const f of files) {
      const t = readFileSync(join(dir, f), 'utf8').replace(/\r\n/g, '\n');
      assert.doesNotMatch(t, /start fresh when you come back|leaving this tab clears/i, f);
    }
  });
});
