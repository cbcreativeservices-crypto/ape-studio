/**
 * Lab END SCREENS (owner 2026-09-29).
 *
 * Owner hard rule: "Labs NEVER block navigation; every lab ends with a 'what's
 * left' screen." Owner rule 2026-09-29: "always keep credit and progress for
 * users, but always allow them to review and redo labs for practice (without
 * losing any previous credit)."
 *
 * Two halves: the pure what's-left helper (imported directly — no RN), and
 * source guards that every lab which used to dead-end now wires the shared
 * LabEndScreen, and that no PRACTISE AGAIN path clears credit.
 */
import { strict as assert } from 'node:assert';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';
import { endLead, endTitle, whatsLeft, type LabEndUnit } from '../src/screens/lab/kit/labEnd.ts';
import { navView } from '../src/screens/lab/kit/labNav.ts';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
/** Source with comments stripped and line endings normalised. */
const src = (p: string) =>
  readFileSync(resolve(ROOT, p), 'utf8')
    .replace(/\r\n/g, '\n')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^\s*\/\/.*$/gm, '');

const UNITS: LabEndUnit[] = [
  { id: 'a', label: 'Alpha' },
  { id: 'b', label: 'Bravo' },
  { id: 'c', label: 'Charlie' },
  { id: 'check', label: 'Check your understanding', kind: 'check' },
];

describe('whatsLeft — the pure list', () => {
  it('lists every uncleared unit in lab order, numbered by position', () => {
    const w = whatsLeft(UNITS, new Set(['b']));
    assert.deepEqual(w.left.map((r) => [r.id, r.num]), [['a', 1], ['c', 3], ['check', 4]]);
    assert.deepEqual(w.credited.map((r) => r.id), ['b']);
    assert.equal(w.total, 4);
    assert.equal(w.complete, false);
    assert.equal(endTitle(w), "WHAT'S LEFT");
  });
  it('reads LAB COMPLETE only when every unit (the check included) is cleared', () => {
    assert.equal(whatsLeft(UNITS, new Set(['a', 'b', 'c'])).complete, false);
    const w = whatsLeft(UNITS, new Set(['a', 'b', 'c', 'check']));
    assert.equal(w.complete, true);
    assert.equal(w.left.length, 0);
    assert.equal(endTitle(w), 'LAB COMPLETE');
  });
  it('a lab with no units is never "complete"', () => {
    assert.equal(whatsLeft([], new Set(['x'])).complete, false);
  });
  it('ignores cleared ids the lab does not list, and counts a repeated unit once', () => {
    const w = whatsLeft([...UNITS, { id: 'a', label: 'dup' }], new Set(['zzz', 'retired']));
    assert.equal(w.total, 4);
    assert.equal(w.left.length, 4);
  });
  it('never mutates the cleared set it is given (credit is read, not rewritten)', () => {
    const cleared = new Set(['a']);
    whatsLeft(UNITS, cleared);
    assert.deepEqual([...cleared], ['a']);
  });
  it('carries the check kind and detail through to the row', () => {
    const w = whatsLeft([{ id: 'final', label: 'Final', kind: 'check', detail: 'Best 60%' }], new Set());
    assert.equal(w.left[0].kind, 'check');
    assert.equal(w.left[0].detail, 'Best 60%');
  });
});

describe('endLead — honest wording', () => {
  const part = whatsLeft(UNITS, new Set(['a']));
  const done = whatsLeft(UNITS, new Set(['a', 'b', 'c', 'check']));
  it('credit labs say what still counts toward credit, and that practising never removes it', () => {
    assert.match(endLead(part, { mode: 'credit', noun: 'module' }), /^2 modules of 3 plus the check still to finish before this lab counts toward your credit/);
    assert.match(endLead(done, { mode: 'credit', noun: 'module' }), /never removes credit/);
  });
  it('progress-only labs never mention credit', () => {
    assert.doesNotMatch(endLead(part, { mode: 'progress', noun: 'section' }), /credit/i);
    assert.doesNotMatch(endLead(done, { mode: 'progress', noun: 'section' }), /credit/i);
  });
  it('a guest is never told anything is saved', () => {
    for (const w of [part, done]) {
      const s = endLead(w, { mode: 'credit', noun: 'page', guest: true });
      assert.match(s, /nothing here is saved|none of this is saved/);
      assert.doesNotMatch(s, /Everything you have done is saved|counts toward your credit/);
    }
  });
  it('singular noun for one item', () => {
    assert.match(endLead(whatsLeft(UNITS.slice(0, 1), new Set()), { mode: 'progress', noun: 'page' }), /^1 page of 1/);
  });
});

describe('every listed lab wires the shared end screen', () => {
  const LABS: [string, string][] = [
    ['PagedLab (7 labs)', 'src/screens/lab/kit/PagedLab.tsx'],
    ['Wave Physics', 'src/screens/lab/wave/WaveModuleScreen.tsx'],
    ['Digital Audio', 'src/screens/lab/digital/DigitalModuleScreen.tsx'],
    ['Gain Staging', 'src/screens/lab/gain/GainModuleScreen.tsx'],
    ['EQ Lab', 'src/screens/lab/eq/EqModuleScreen.tsx'],
    ['Cymatics', 'src/screens/lab/cymatics/CymaticsModuleScreen.tsx'],
    ['Amplifier Principles', 'src/screens/lab/amp/AmpModuleScreen.tsx'],
    ['Foundations of Sound', 'src/screens/lab/foundations/FoundationsCourseScreen.tsx'],
    ['Microphone Selection', 'src/screens/lab/micselect/MicSelectLabScreen.tsx'],
    ['Microphone Principles', 'src/screens/lab/micspeaker/MicPrinciplesLabScreen.tsx'],
    ['Speaker Coverage', 'src/screens/lab/micspeaker/SpeakerCoverageLabScreen.tsx'],
    ['Vacuum Tube', 'src/screens/lab/tube/VacuumTubeLabScreen.tsx'],
    ['Tuning & Temperament', 'src/screens/lab/tuning/TuningLabScreen.tsx'],
    ['Visual Audio Analysis (home)', 'src/screens/lab/meter/MeterLabHomeScreen.tsx'],
  ];
  for (const [name, path] of LABS) {
    it(`${name}: renders LabEndScreen with jump, practise-again and done`, () => {
      const s = src(path);
      assert.match(s, /from '\.\.\/kit\/LabEndScreen'|from '\.\/LabEndScreen'/);
      const at = s.indexOf('<LabEndScreen');
      assert.ok(at > 0, 'LabEndScreen is rendered');
      const el = s.slice(at, s.indexOf('/>', at));
      assert.match(el, /onJump=/);
      assert.match(el, /onPracticeAgain=/);
      assert.match(el, /onDone=\{\(\) => safeGoBack\(navigation\)\}/);
    });
    it(`${name}: practising again clears nothing`, () => {
      const s = src(path);
      const at = s.indexOf('onPracticeAgain=');
      const line = s.slice(at, s.indexOf('\n', at));
      assert.doesNotMatch(line, /reset|clear|remove/i);
    });
  }

  it('the module hosts turn the dead last NEXT into FINISH (never disabled) — through the shared strip', () => {
    // Behaviour: the strip's last-module label is FINISH, live, and the end
    // screen keeps PREV live (back to the last module) with NEXT's slot empty.
    const lastView = navView(7, 8, false);
    assert.equal(lastView.nextLabel, 'FINISH ›');
    assert.equal(navView(0, 1, false).nextLabel, 'FINISH ›');
    const endView = navView(7, 8, true);
    assert.equal(endView.nextLabel, null);
    assert.equal(endView.prevOn, true);
    assert.equal(endView.pos, "WHAT'S LEFT");
    // Wiring (WP1, 2026-09-30): each host uses LabNavBar + useLabNav, hands the
    // hook its own finish / unEnd, and keeps no local strip, FINISH or lock.
    for (const p of ['wave/WaveModuleScreen', 'digital/DigitalModuleScreen', 'gain/GainModuleScreen', 'eq/EqModuleScreen', 'cymatics/CymaticsModuleScreen']) {
      const s = src(`src/screens/lab/${p}.tsx`);
      assert.match(s, /from '\.\.\/kit\/LabNavBar'/, `${p} uses LabNavBar`);
      assert.match(s, /<LabNavBar nav=\{nav\} \/>/, `${p} draws the shared strip`);
      assert.match(s, /finish: \(\) => setEnding\(true\),/, `${p} FINISH opens the end screen in place`);
      assert.match(s, /unEnd: \(\) => setEnding\(false\),/, `${p} PREV from WHAT'S LEFT returns to the last module`);
      assert.doesNotMatch(s, /disabled=\{idx >= last\}/, p);
      assert.doesNotMatch(s, /'FINISH ›'|'NEXT ›'|nextTapAt/, `${p} keeps no local strip`);
    }
  });
  it('PagedLab FINISH opens the end screen and is never held', () => {
    // 2026-09-30: through the shared strip (kit/LabNavBar). NEXT / FINISH go
    // through useLabNav, whose FINISH calls the host's `finish` — never a
    // disabled button, never a `finishBlocked`.
    const s = src('src/screens/lab/kit/PagedLab.tsx');
    assert.doesNotMatch(s, /finishBlocked/);
    assert.match(s, /from '\.\/LabNavBar'/);
    assert.match(s, /const finish = useCallback\(\(\) => setEnding\(true\), \[\]\);/);
    assert.match(s, /useLabNav\(\{[\s\S]*?go: goTo,[\s\S]*?finish,[\s\S]*?\}\)/);
    assert.doesNotMatch(s, /disabled=/);
  });
  it('Patchbay and Connector Select pass their credit key so banked pages read CREDITED', () => {
    assert.match(src('src/screens/lab/patchbay/PatchbayLabScreen.tsx'), /creditLabKey=\{PATCHBAY_LAB_KEY\}/);
    assert.match(src('src/screens/lab/connectorselect/ConnectorSelectLabScreen.tsx'), /creditLabKey=\{CONNECTOR_SELECT_LAB_KEY\}/);
  });
  it('Mic Selection and Foundations DONE no longer just go back', () => {
    const mic = src('src/screens/lab/micselect/MicSelectLabScreen.tsx');
    assert.doesNotMatch(mic, /step === STEPS\.length - 1 \? \(Date\.now\(\) - lastNavAtRef\.current < 400 \? undefined : navigation\.goBack\(\)\)/);
    // The shared strip's FINISH › opens the end screen in place (WP5, 2026-10-01).
    assert.match(mic, /from '\.\.\/kit\/LabNavBar'/);
    assert.match(mic, /const finish = useCallback\(\(\) => setEnding\(true\), \[\]\);/);
    assert.match(mic, /useLabNav\(\{[\s\S]*?finish,[\s\S]*?\}\)/);
    assert.doesNotMatch(mic, /DONE ✓/);
    const fnd = src('src/screens/lab/foundations/FoundationsCourseScreen.tsx');
    assert.doesNotMatch(fnd, /if \(step === STEPS\.length - 1\) navigation\.goBack\(\);/);
    // Shared strip (2026-09-30): FINISH › on Module 14 runs `finish`, which
    // stops the tone and swaps the end screen in; PREV from it returns.
    assert.match(fnd, /const finish = useCallback\(\(\) => \{\s*\n\s*tone\.stop\(\);\s*\n\s*setEnding\(true\);/);
    assert.match(fnd, /useLabNav\(\{ units: navUnits, index: step, ending, go: goTo, finish, unEnd \}\)/);
    assert.match(fnd, /<LabNavBar nav=\{nav\} \/>/);
  });
  it('Amp: FINISH on the last module shows the end screen in place, reachable before the final (CONTENTS → WHAT’S LEFT)', () => {
    const s = src('src/screens/lab/amp/AmpModuleScreen.tsx');
    // The strip's FINISH › (and the CONTENTS footer) call showEnd; the end
    // screen renders under the same header + strip, PREV leaves it.
    assert.match(s, /finish: showEnd/);
    // night pass 2 (2026-10-01): unEnd also fences a FINISH read still queued
    assert.match(s, /const unEnd = useCallback\(\(\) => \{\s*endReq\.current\+\+;\s*setEndState\(null\);\s*\}, \[\]\);/);
    assert.match(s, /ending: !!endState/);
    assert.match(s, /<LabEndScreen\s*\n\s*labTitle=\{LAB_TITLE\}/);
    assert.match(s, /onPracticeAgain=\{\(\) => navigation\.replace\('AmpModule', \{ id: built\[0\]\?\.id \?\? mod\.id \}\)\}/);
  });
});

describe('the end screen itself', () => {
  const s = src('src/screens/lab/kit/LabEndScreen.tsx');
  it('never uses a raw platform Alert and never auto-appears (no timers)', () => {
    assert.doesNotMatch(s, /Alert\.alert/);
    assert.doesNotMatch(s, /setTimeout|setInterval/);
  });
  it('both actions are always enabled', () => {
    assert.doesNotMatch(s, /disabled=/);
  });
  it('no text under 9 pt', () => {
    for (const m of s.matchAll(/fontSize: ([\d.]+)/g)) assert.ok(Number(m[1]) >= 9, `fontSize ${m[1]}`);
  });
  it('labVisits is reset on an account switch', () => {
    assert.match(src('src/features/account/clearLocalAccountData.ts'), /resetLabVisits\(\);/);
  });
});
