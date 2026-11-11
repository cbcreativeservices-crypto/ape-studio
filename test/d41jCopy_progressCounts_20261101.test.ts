/**
 * D41 (j) copy — owner approved 2026-11-01 ("Progress counts only"; D117:
 * progress shows what the learner HAS done, never "n of N").
 *
 *   C1  Patchbay page 22 (Design your own bay): "n pairs settled", no total.
 *   C2  Cable Install intro: "n units complete", no total. Cable lab tag row
 *       and its lesson-12 what's-left eyebrow: "n UNITS CLEARED", no total.
 *   C3  Mixing Guides end screen in a members-only PREVIEW: a signed-in
 *       non-member is never told "saved on this device" (markGuideRead drops a
 *       preview's reading) — the host reads the guest-preview line instead.
 *
 * Position labels ("3 OF 12", "Mixing guide 4 of 50") are NOT progress and stay.
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it } from 'node:test';

const read = (p: string) => readFileSync(join(process.cwd(), p), 'utf8').replace(/\r\n/g, '\n');

describe('C1 Patchbay page 22: settled pairs counted without a total', () => {
  const src = read('src/screens/lab/patchbay/pagesD.tsx');
  const page = src.slice(src.indexOf('function PageDesign('), src.indexOf('function PageAssessment('));
  it('reads "n pair(s) settled", never "n of N pairs settled"', () => {
    assert.match(page, /\{settledCount\} \{settledCount === 1 \? 'pair' : 'pairs'\} settled\./);
    assert.doesNotMatch(page, /of \{DESIGN_ROWS\.length\} pairs settled/);
  });
});

describe('C2 Cable Install + Cable lab: units counted without a total', () => {
  it('Cable Install intro progress line is "n unit(s) complete"', () => {
    const src = read('src/screens/lab/cableinstall/CableInstallLabScreen.tsx');
    assert.match(src, /progressLine=\{`\$\{cleared\} \$\{cleared === 1 \? 'unit' : 'units'\} complete`\}/);
    assert.doesNotMatch(src, /of \$\{total\} units complete/);
  });
  it('Cable lab tag row reads "n UNIT(S) CLEARED", label and a11y alike', () => {
    const src = read('src/screens/lab/cable/CableLabScreen.tsx');
    assert.match(src, /\{`\$\{cleared\} \$\{cleared === 1 \? 'UNIT' : 'UNITS'\} CLEARED`\}/);
    assert.match(src, /accessibilityLabel=\{`\$\{cleared\} lab \$\{cleared === 1 \? 'unit' : 'units'\} cleared`\}/);
    assert.doesNotMatch(src, /\$\{cleared\}\/\$\{total\} UNITS/);
    assert.doesNotMatch(src, /of \$\{total\} lab units/);
  });
  it('Cable lab lesson 12 drops the LAB PROGRESS unit count; WHAT’S LEFT says what remains (owner 2026-11-11)', () => {
    const src = read('src/screens/lab/cable/lessons/lesson12.tsx');
    assert.doesNotMatch(src, /LAB PROGRESS ·/);
    assert.doesNotMatch(src, /OF \$\{completion\.total\} UNITS/);
    assert.match(src, /<WhatsLeft nav=\{nav\} \/>/);
    assert.match(src, /`GENERAL · \$\{generalSolved\} SOLVED`/);
    assert.doesNotMatch(src, /OF \$\{FINAL_QUESTIONS\.length\} SOLVED/);
    assert.doesNotMatch(src, /of \$\{SAFETY_QUESTIONS\.length\} safety questions/);
  });
});

describe('C3 Mixing Guides: a preview is never told its reading is saved', () => {
  const src = read('src/screens/lab/mixingGuides/MixingGuideScreen.tsx');
  it('the end screen reads as a guest while a members-only preview is active', () => {
    const end = src.slice(src.indexOf('<LabEndScreen'), src.indexOf('/>', src.indexOf('<LabEndScreen')));
    assert.match(end, /guest=\{inPreview \? true : undefined\}/, 'a signed-in non-member preview fell through to "saved on this device"');
    assert.match(src, /const inPreview = useLabPreview\(\)\.active;/);
  });
  it('the guest-preview lead says nothing is saved and makes no upsell', async () => {
    const { endLead, whatsLeft } = await import('../src/screens/lab/kit/labEnd.ts');
    const units = [{ id: 'pop', label: 'Pop' }, { id: 'rock', label: 'Rock' }];
    for (const done of [new Set<string>(), new Set(['pop']), new Set(['pop', 'rock'])]) {
      const lead = endLead(whatsLeft(units, done), { mode: 'progress', noun: 'guide', guest: true, preview: true });
      assert.doesNotMatch(lead, /saved on this device/i);
      assert.match(lead, /members-only preview/);
      assert.match(lead, /nothing here is saved|none of this is saved/);
      assert.doesNotMatch(lead, /\b(join|upgrade|subscribe|free)\b/i);
    }
  });
  it('the end guide says a preview records nothing and says so', () => {
    const g = read('src/screens/lab/mixingGuides/mixingGuidesScreenGuides.ts');
    assert.match(g, /A preview records nothing and says so\./);
  });
});

describe('Follow-up (checker 2026-11-01): lab-level what\'s-left / hub counts carry no total', () => {
  it('Cable Install ciLeftLead counts what is left in every branch, never "n of N"', async () => {
    const { ciLeftLead } = await import('../src/screens/lab/cableinstall/completeCopy.ts');
    for (const state of ['guest', 'preview', 'saved'] as const) {
      for (const o of [{ unbanked: 5, replayOnly: 0 }, { unbanked: 1, replayOnly: 2 }, { unbanked: 0, replayOnly: 4 }]) {
        const lead = ciLeftLead(state, { ...o, total: 13 });
        assert.doesNotMatch(lead, /\bof 13\b/, `${state}: ${lead}`);
      }
    }
    assert.equal(ciLeftLead('guest', { unbanked: 1, replayOnly: 0, total: 13 }), '1 stage still to go.');
  });
  it('Amp hub progress reads "n module(s) complete"', () => {
    const src = read('src/screens/lab/amp/AmpLabHomeScreen.tsx');
    assert.match(src, /\{doneCount\} \{doneCount === 1 \? 'module' : 'modules'\} complete<\/Text>/);
    assert.doesNotMatch(src, /of \{built\.length\} modules complete/);
  });
});
