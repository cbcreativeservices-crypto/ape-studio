/**
 * D41 follow-up K1–K8 (owner-approved 2026-11-01) — the SHARED lab end screen
 * (kit/labEnd.ts + kit/LabEndScreen.tsx) and its hosts.
 *
 *   K1  no "n OF N" progress on the end screen (owner rule D117: progress
 *       shows what is DONE — "✓ 3 CREDITED" — never "3 / 9"). RATCHET.
 *   K1+ more than one CHECK row left (Amp: Final + understanding check) is
 *       counted, never "the check".
 *   K1+ a members-only preview says nothing is saved even when signed in.
 *   K2  the closing note never says practicing "never clears" where START
 *       OVER (PRACTICE) clears ticks.
 *   K3  PagedLab's START OVER confirm says only what happens.
 *   K4  PagedLab: a finished row carries no "Counts once…" line.
 *   K5  ROLLED BACK (the strip's spoken name keeps its visible MODULE, WCAG 2.5.3).
 *   K6  a CHECK row whose check is drawn on the end screen moves to it.
 *   K7  LabCheckEnd: Android BACK closes the open ⓘ guide before the layer.
 *   K8  De-Esser lists (and draws) the Smart Processors check, so LAB
 *       COMPLETE never shows above an unpassed certificate check.
 */
import { strict as assert } from 'node:assert';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';
import { endLead, endNote, whatsLeft, type LabEndUnit } from '../src/screens/lab/kit/labEnd.ts';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const raw = (p: string) => readFileSync(resolve(ROOT, p), 'utf8').replace(/\r\n/g, '\n');
/** Code only: comments stripped. */
const code = (p: string) => raw(p).replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');

const PAGES: LabEndUnit[] = [
  { id: 'a', label: 'Alpha' },
  { id: 'b', label: 'Bravo' },
  { id: 'c', label: 'Charlie' },
];
const CHECK: LabEndUnit = { id: 'u', label: 'Check your understanding', kind: 'check' };
const FINAL: LabEndUnit = { id: 'final', label: 'Final assessment', kind: 'check' };

/** "3 pages of 9", "2 OF 5", "1 / 4" — any done-of-total progress count. */
const N_OF_N = /\b\d+\s+(?:\w+\s+)?(?:of|OF)\s+\d+\b|\b\d+\s*\/\s*\d+\b/;

describe('K1 ratchet: no "n of N" progress text in the shared end screen', () => {
  it('endLead never prints a done-of-total count, for every mode / audience / state', () => {
    const sets = [new Set<string>(), new Set(['a']), new Set(['a', 'b']), new Set(['a', 'b', 'c']), new Set(['a', 'b', 'c', 'u']), new Set(['a', 'u'])];
    const unitLists = [PAGES, [...PAGES, CHECK], [...PAGES, FINAL, CHECK], [CHECK]];
    for (const units of unitLists)
      for (const cleared of sets)
        for (const mode of ['credit', 'progress'] as const)
          for (const extra of [{}, { guest: true }, { guest: true, carry: false }, { preview: true }, { guest: true, preview: true }, { account: 'checking' as const }, { account: 'unconfirmed' as const }]) {
            const s = endLead(whatsLeft(units, cleared), { mode, noun: 'page', ...extra });
            assert.doesNotMatch(s, N_OF_N, s);
          }
  });
  it('the end screen source draws no "OF {total}" / "of ${total}" progress', () => {
    for (const p of ['src/screens/lab/kit/LabEndScreen.tsx', 'src/screens/lab/kit/labEnd.ts']) {
      const s = code(p);
      assert.doesNotMatch(s, /\bOF \{/, `${p}: "n OF {total}" in JSX`);
      assert.doesNotMatch(s, /\b(?:OF|of) \$\{/, `${p}: "n of \${total}" in a template`);
      assert.doesNotMatch(s, /w\.total\b/, `${p}: the total is never shown`);
    }
  });
  it('the done header reads what is done: "✓ n CREDITED" / "✓ n DONE"', () => {
    assert.match(code('src/screens/lab/kit/LabEndScreen.tsx'), /✓ \{w\.credited\.length\} \{tag\}/);
  });
  it('the left lines name how many are left, with no total', () => {
    assert.match(endLead(whatsLeft([...PAGES, CHECK], new Set(['a'])), { mode: 'progress', noun: 'page' }), /^2 pages plus the check not done yet\./);
    assert.match(endLead(whatsLeft(PAGES, new Set(['a'])), { mode: 'credit', noun: 'module' }), /^2 modules still to finish before this lab counts toward your credit\./);
  });
});

describe('K1+ two CHECK rows (Amp: Final assessment + understanding check)', () => {
  it('both left with every module done: "Only the checks are left"', () => {
    const w = whatsLeft([...PAGES, FINAL, CHECK], new Set(['a', 'b', 'c']));
    assert.equal(w.left.length, 2);
    assert.match(endLead(w, { mode: 'credit', noun: 'module' }), /^Only the checks are left before this lab counts toward your credit\./);
  });
  it('both left with modules left: "… plus 2 checks"', () => {
    const w = whatsLeft([...PAGES, FINAL, CHECK], new Set(['a']));
    assert.match(endLead(w, { mode: 'credit', noun: 'module' }), /^2 modules plus 2 checks still to finish/);
  });
  it('one check left keeps the single wording unchanged', () => {
    assert.match(endLead(whatsLeft([...PAGES, FINAL, CHECK], new Set(['a', 'b', 'c', 'final'])), { mode: 'credit', noun: 'module' }), /^Only the check is left/);
    assert.match(endLead(whatsLeft([...PAGES, FINAL, CHECK], new Set(['b', 'c', 'final'])), { mode: 'credit', noun: 'module' }), /^1 module plus the check still to finish/);
  });
});

describe('K1+ a members-only preview records nothing — signed in or not (endLead)', () => {
  for (const mode of ['credit', 'progress'] as const) {
    it(`${mode}: preview without guest says nothing is saved or credited, never "saved"`, () => {
      for (const cleared of [new Set(['a']), new Set(['a', 'b', 'c'])]) {
        const s = endLead(whatsLeft(PAGES, cleared), { mode, noun: 'page', preview: true });
        assert.match(s, /members-only preview, so (nothing here|none of this) is saved or credited/);
        assert.doesNotMatch(s, /is saved on this device|Everything you have done is saved|counts toward your credit|sign in|join|member(?!s-only)/i);
        assert.equal(s, endLead(whatsLeft(PAGES, cleared), { mode, noun: 'page', preview: true, guest: true }));
      }
    });
  }
});

describe('K2 practice wording is true', () => {
  it('a progress lab whose START OVER clears ticks says so', () => {
    assert.match(endNote('progress', true), /START OVER \(PRACTICE\) clears the check marks/);
    assert.doesNotMatch(endNote('progress', true), /never clears/);
    assert.match(endNote('progress', false), /never clears what you have already done/);
  });
  it('a credit lab’s note never claims START OVER clears ticks: credited pages keep their ✓ (endCleared reads the banked unit)', () => {
    for (const startOver of [true, false]) {
      const n = endNote('credit', startOver);
      assert.match(n, /never removes credit you have already earned/);
      assert.doesNotMatch(n, /\bclear/i, n);
    }
    assert.match(endNote('credit', true), /START OVER \(PRACTICE\) starts a fresh run; credited pages keep their ✓\./);
    // the behaviour the words describe: a banked page stays in endCleared after START OVER empties `completed`
    assert.match(code('src/screens/lab/kit/PagedLab.tsx'), /: \(!!creditLabKey && bankedPages\.has\(`p\$\{i \+ 1\}`\)\) \|\| \(!!pageCreditKeys\[i\] && bankedPageKeys\.has\(pageCreditKeys\[i\]\)\);\n\s*if \(banked \|\| progress\?\.completed\.includes\(i\)\) endCleared\.add\(String\(i\)\);/);
  });
  it('the complete progress lead no longer claims "Practicing never clears"', () => {
    const s = endLead(whatsLeft(PAGES, new Set(['a', 'b', 'c'])), { mode: 'progress', noun: 'page' });
    assert.doesNotMatch(s, /Practicing never clears/);
    assert.match(s, /PRACTICE AGAIN clears nothing/);
  });
  it('PagedLab (START OVER clears its ticks) tells its end screen', () => {
    const s = code('src/screens/lab/kit/PagedLab.tsx');
    const el = s.slice(s.indexOf('<LabEndScreen'), s.indexOf('/>', s.indexOf('extra={creditCheckId')));
    assert.match(el, /\bstartOver\b/);
  });
});

describe('K3 PagedLab START OVER confirm says only what happens', () => {
  const s = code('src/screens/lab/kit/PagedLab.tsx');
  it('page-credit labs: credited pages keep their ✓; check-only credit: ticks clear, credit stays; neither: ticks clear', () => {
    assert.match(s, /const pageCredit = !!creditLabKey \|\| pageCreditKeys\.length > 0;/);
    assert.match(s, /const checkCredit = !!check \|\| !!creditCheckId;/);
    assert.match(s, /pageCredit\s*\? `Starts \$\{title\} again from its first page\. Credited pages keep their ✓\.`\s*: checkCredit\s*\? `Starts \$\{title\} again from its first page and clears its page check marks\. Credit you have already earned stays\.`\s*: `Starts \$\{title\} again from its first page and clears its page check marks\.`/);
  });
});

describe('K4 a finished row carries no hands-on line', () => {
  it('pageDetailOf returns no detail for any done page, handsOnDetail labs included', () => {
    const s = code('src/screens/lab/kit/PagedLab.tsx');
    assert.match(s, /const pageDetailOf = [\s\S]*?\{\n\s*if \(endCleared\.has\(String\(i\)\)\) return \{ detail: undefined \};/);
  });
});

describe('K5 rolled back: the nav’s spoken names keep the visible MODULE', () => {
  it('no a11yNoun plumbing; CONTENTS rows say Module', () => {
    for (const p of ['src/screens/lab/kit/labNav.ts', 'src/screens/lab/kit/useLabNav.ts', 'src/screens/lab/kit/LabNavBar.tsx', 'src/screens/lab/kit/PagedLab.tsx', 'src/screens/lab/soundsystems/SsPagedLab.tsx']) assert.doesNotMatch(code(p), /a11yNoun/, p);
    assert.match(code('src/screens/lab/kit/LabNavBar.tsx'), /`Module \$\{i \+ 1\}`/);
  });
});

describe('K6 a CHECK row whose check is on the end screen moves to it', () => {
  const s = code('src/screens/lab/kit/LabEndScreen.tsx');
  it('LabEndScreen: shownHereId row scrolls to the extra block instead of onJump', () => {
    assert.match(s, /const here = shownHereId !== undefined && r\.id === shownHereId && extra != null;/);
    assert.match(s, /onPress=\{\(\) => \(here \? toShownHere\(\) : onJump\(r\.id\)\)\}/);
    // the label promises only what is true: focus does not move with the scroll
    assert.match(s, /here \? 'It is on this screen, above\.' : 'Opens it\.'/);
    assert.doesNotMatch(s, /Moves to it/);
    assert.match(s, /onLayout=\{\(e\) => \{ extraY\.current = e\.nativeEvent\.layout\.y; \}\}/);
    assert.match(s, /scrollRef\.current\?\.scrollTo\(\{ y: Math\.max\(0, extraY\.current - 8\), animated: false \}\)/);
  });
  for (const [f, id] of [
    ['src/screens/lab/micselect/MicSelectLabScreen.tsx', 'UNDERSTANDING_UNIT'],
    ['src/screens/lab/tube/VacuumTubeLabScreen.tsx', 'UNDERSTANDING_UNIT'],
    ['src/screens/lab/amp/AmpLabHomeScreen.tsx', 'AMP_CHECK_UNIT'],
    ['src/screens/lab/amp/AmpModuleScreen.tsx', 'AMP_CHECK_UNIT'],
  ] as const) {
    it(`${f.split('/').pop()}: shownHereId={${id}} beside its check extra`, () => {
      const c = code(f);
      const at = c.indexOf('<LabEndScreen');
      const el = c.slice(at, c.indexOf('/>\n', c.indexOf('extra={', at)));
      assert.match(el, new RegExp(`shownHereId=\\{${id}\\}`));
      assert.match(el, /extra=\{<LabUnderstandingBlock/);
    });
  }
});

describe('K7 LabCheckEnd: BACK closes the open guide first', () => {
  const s = code('src/screens/lab/kit/LabCheckEnd.tsx');
  const host = code('src/features/lab/screenGuide/ScreenGuide.tsx');
  it('the guide stays in-tree (never Modal over Modal, K10): the layer keeps its own host and key', () => {
    assert.match(s, /<ScreenGuideHost regions=\{false\} resetKey=\{open \? 'end' : 'closed'\} backRef=\{guideBack\}>/);
    assert.match(s, /<ScreenGuideKey title="WHERE YOU ARE" guide=\{endGuide\} \/>/);
    assert.doesNotMatch(s, /ScreenGuidePopup/);
  });
  it('the Modal’s BACK asks the host first, and closes the layer only when no guide was open', () => {
    assert.match(s, /onRequestClose=\{\(\) => \{\s*if \(guideBack\.current\?\.\(\)\) return;\s*close\(\);\s*\}\}/);
  });
  it('ScreenGuideHost: optional backRef closes an open guide and answers true, else false; omitted = unchanged', () => {
    assert.match(host, /backRef\?: MutableRefObject<\(\(\) => boolean\) \| null>;/);
    assert.match(host, /useEffect\(\(\) => \{\s*if \(!backRef\) return;\s*backRef\.current = \(\) => \{\s*if \(!shownRef\.current\) return false;\s*shownRef\.current = false;\s*setShown\(null\);\s*return true;\s*\};\s*return \(\) => \{\s*backRef\.current = null;\s*\};\s*\}, \[backRef\]\);/);
    assert.match(host, /shownRef\.current = shown != null;/);
  });
});

describe('K8 De-Esser: the Smart Processors check is on its end screen', () => {
  const p = code('src/screens/lab/kit/PagedLab.tsx');
  it('PagedLab: creditCheckLabId adds a CHECK row cleared only from that lab’s banked unit', () => {
    assert.match(p, /const creditCheckId = !check && creditCheckLabId && understandingFor\(creditCheckLabId\) \? creditCheckLabId : undefined;/);
    assert.match(p, /const bankedCreditCheck = useLabClearedUnits\(creditCheckId \?\? labId\);/);
    assert.match(p, /if \(creditCheckId && bankedCreditCheck\.has\(UNDERSTANDING_UNIT\)\) endCleared\.add\(CREDIT_CHECK_ROW\);/);
    assert.match(p, /endRows\.push\(\{ id: CREDIT_CHECK_ROW, label: 'Check your understanding', kind: 'check',/);
    assert.match(p, /const endUnreadable = unreadable \|\| \(!!creditCheckId && creditUnreadable\);/);
    assert.match(p, /unreadable=\{endUnreadable\}/);
  });
  it('PagedLab draws the check as extra; its row moves there (LabEndScreen never hands it to onJump)', () => {
    assert.match(p, /shownHereId=\{creditCheckId \? CREDIT_CHECK_ROW : undefined\}/);
    assert.match(p, /extra=\{creditCheckId \? <LabUnderstandingBlock labId=\{creditCheckId\} labTitle=\{creditCheckTitle \?\? title\} \/> : undefined\}/);
  });
  it('an unpassed check keeps every-page-done from reading LAB COMPLETE; a banked one completes it', () => {
    const rows: LabEndUnit[] = [...PAGES, { id: 'credit-check', label: 'Check your understanding', kind: 'check' }];
    assert.equal(whatsLeft(rows, new Set(['a', 'b', 'c'])).complete, false);
    assert.equal(whatsLeft(rows, new Set(['a', 'b', 'c', 'credit-check'])).complete, true);
  });
  it('DeEsserLabScreen passes creditCheckLabId="smart-processors"', () => {
    assert.match(code('src/screens/lab/deesser/DeEsserLabScreen.tsx'), /<PagedLab[\s\S]*labId="deesser"[\s\S]*creditCheckLabId="smart-processors"[\s\S]*creditCheckTitle="Smart Processors Lab"/);
  });
  it('the De-Esser end guide names the CHECK row and LAB COMPLETE waiting for the check', () => {
    const g = raw('src/screens/lab/deesser/smartProcessorsScreenGuides.ts');
    const end = g.slice(g.indexOf('export const DEESSER_END_GUIDE'), g.indexOf('export function deEsserPageGuide'));
    assert.match(end, /then a CHECK row: the five-question Smart Processors check\. LAB COMPLETE once every page is done and the check passed\./);
    assert.doesNotMatch(end, /When every page is done the title reads LAB COMPLETE/);
  });
});
