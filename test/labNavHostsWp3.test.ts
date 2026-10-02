/**
 * GUARD — lab navigation migration, package WP3 (owner-approved standard
 * 2026-09-30, kit/LabNavBar): the Vacuum Tube, Speaker Coverage and
 * Microphone Principles hosts navigate through the ONE shared strip.
 *
 *   • LabHeader draws ‹ / title / subtitle (‹ = leave the lab);
 *   • LabNavBar draws ⏮ / ‹ PREV / MODULE n / N ▾ / NEXT › (FINISH › on the
 *     last section); the readout opens CONTENTS, whose WHAT'S LEFT row
 *     replaced the old WHAT'S LEFT chip;
 *   • every section is a unit, in SECTIONS order, with `done` from the lab's
 *     own record (labVisits for Tube, banked credit for the two mic/speaker
 *     labs) — so CONTENTS reads ✓;
 *   • the rack wells get the in-flow "NEXT: <section> ›" from RackUnit under
 *     LabNavProvider; a plain-scroll reading page draws LabNextButton itself;
 *   • LabEndLink and the pinned chip / tab rows are gone from these hosts.
 * (Tuning's own guard is test/tuningLabRack.test.ts.)
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, test } from 'node:test';

const read = (p: string) => readFileSync(new URL(`../src/screens/lab/${p}`, import.meta.url), 'utf8').replace(/\r\n/g, '\n');
const strip = (s: string) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');

const HOSTS: [string, string, string][] = [
  ['Vacuum Tube', 'tube/VacuumTubeLabScreen.tsx', 'visited'],
  ['Speaker Coverage', 'micspeaker/SpeakerCoverageLabScreen.tsx', 'banked'],
  ['Microphone Principles', 'micspeaker/MicPrinciplesLabScreen.tsx', 'banked'],
];

describe('WP3 hosts use the shared lab navigation', () => {
  for (const [name, file, record] of HOSTS) {
    const src = strip(read(file));
    test(`${name}: LabHeader + LabNavBar under a LabNavProvider`, () => {
      assert.match(src, /from '\.\.\/kit\/LabNavBar'/);
      assert.match(src, /<LabHeader\b/);
      assert.match(src, /<LabNavBar nav=\{nav\} \/>/);
      assert.match(src, /<LabNavProvider value=\{nav\}>/);
      // The host's own ‹ is gone with its header styles.
      assert.doesNotMatch(src, /accessibilityLabel="Back"/);
      assert.doesNotMatch(src, /(?:navigation\.goBack\(\)|safeGoBack\(navigation\))\} hitSlop/);
    });
    test(`${name}: one unit per section with done from ${record}; go / finish / unEnd wired to the host's state`, () => {
      assert.match(src, new RegExp(`units: SECTIONS\\.map\\(\\(sec\\) => \\(\\{ id: sec\\.key, title: sec\\.title, done: ${record}\\.has\\(sec\\.key\\) \\}\\)\\)`));
      assert.match(src, /index: sectionIdx,\n\s*ending,\n\s*go: openSection,\n\s*finish: \(\) => setEnding\(true\),\n\s*unEnd: \(\) => setEnding\(false\),/);
    });
    test(`${name}: the pinned WHAT'S LEFT chip and LabEndLink are gone (CONTENTS and the in-flow NEXT replaced them)`, () => {
      assert.doesNotMatch(src, /<LabChip label="WHAT’S LEFT"/);
      assert.doesNotMatch(src, /LabEndLink/);
      assert.doesNotMatch(src, /SECTIONS\.map\(\(sec, i\) => \(\s*<LabChip/);
    });
    test(`${name}: the end screen keeps jump, practise-again, done`, () => {
      const at = src.indexOf('<LabEndScreen');
      assert.ok(at > 0);
      const el = src.slice(at, src.indexOf('/>', at));
      assert.match(el, /onJump=\{\(id\) => openSection\(/);
      assert.match(el, /onPracticeAgain=\{\(\) => openSection\(0\)\}/);
      assert.match(el, /onDone=\{\(\) => safeGoBack\(navigation\)\}/);
    });
  }

  test('Vacuum Tube: every section well is a rack well, so no section draws its own FINISH', () => {
    const src = strip(read('tube/VacuumTubeLabScreen.tsx'));
    assert.doesNotMatch(src, /onFinish/);
    assert.doesNotMatch(src, /<LabNextButton/);
  });

  test('Speaker Coverage: READING IT (no rack) draws the in-flow NEXT at the end of its scroll', () => {
    const src = strip(read('micspeaker/SpeakerCoverageLabScreen.tsx'));
    assert.match(src, /<FutureAudioNote \/>\n\s*(\{\}\n\s*)?<LabNextButton \/>\n\s*<\/ScrollView>/);
    assert.equal((src.match(/<LabNextButton/g) ?? []).length, 1, 'the rack sections get theirs from RackUnit');
  });

  test('Microphone Principles: the two reading pages draw the in-flow NEXT through wellBottom; the chips left the well', () => {
    const src = strip(read('micspeaker/MicPrinciplesLabScreen.tsx'));
    assert.match(src, /key: 'capsule',[^}]*reading: true/);
    assert.match(src, /key: 'mistakes',[^}]*reading: true/);
    assert.equal((src.match(/reading: true/g) ?? []).length, 2, 'CAPSULE and MISTAKES only');
    assert.match(src, /\{s\.reading \? <LabNextButton nav=\{nav\} \/> : null\}/);
    const wellTop = src.slice(src.indexOf('const wellTop = ('), src.indexOf('const wellBottom = ('));
    assert.doesNotMatch(wellTop, /LabChip/, 'the section chips are gone from wellTop');
    assert.match(wellTop, /<Text style=\{styles\.sectionTitle\}>\{s\.title\}<\/Text>/);
  });
});
