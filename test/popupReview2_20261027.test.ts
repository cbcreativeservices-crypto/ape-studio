/**
 * Popup copy review, round 2 (owner OK 2026-10-27, Downloads/
 * 2026-10-27_POPUP_COPY_REVIEW_2.md). The texts that must stay true to the
 * code are pinned to the code itself: the copy names exactly what My Custom
 * List has (studyGate customListMethods() / customListHasQuiz()). D12
 * (2026-10-27) gave it scenarios and its practice quiz, so it names all five.
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const read = (p: string) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8').replace(/\r\n/g, '\n');
const gate = await import('../src/features/commercial/studyGate.ts');
const { HELP_CATEGORIES } = await import('../src/features/help/helpContent.ts');

/** How the copy names each custom-list method key. */
const METHOD_WORDS: Record<string, string> = {
  flashcards: 'flashcards',
  fill_in_blank: 'fill-in-the-blank',
  matching: 'matching',
  scenarios: 'scenario',
};
const listMethods = gate.customListMethods();
const listHasScenarios = listMethods.includes('scenarios');

/** Every method the list has is named; scenarios / the quiz only if it has them. */
function namesTheListsMethods(text: string, where: string) {
  for (const m of listMethods) assert.ok(text.toLowerCase().includes(METHOD_WORDS[m]), `${where} names ${m}`);
  if (!listHasScenarios) assert.doesNotMatch(text, /scenario/i, `${where} promises scenarios the list does not have`);
  if (!gate.customListHasQuiz()) assert.doesNotMatch(text, /\bquiz\b/i, `${where} promises a quiz the list does not have`);
  // …and once it has its quiz, the copy says so — as practice, with its 30-term floor.
  if (gate.customListHasQuiz()) {
    assert.match(text, /\bpractice quiz\b/i, `${where} does not name the list’s practice quiz`);
    assert.match(text, /\b30 terms\b/, `${where} does not give the quiz its 30-term minimum`);
  }
}

// ── D1 ───────────────────────────────────────────────────────────────────────
const sheet = read('src/features/commercial/StudyAccessSheet.tsx');
const listCopy = sheet.slice(sheet.indexOf('export const CUSTOM_LIST_SHEET_COPY = {'), sheet.indexOf('} as const;'));

test('D1: the My Custom List sheet is not the topic sheet', () => {
  assert.ok(listCopy.length > 0, 'CUSTOM_LIST_SHEET_COPY present');
  assert.doesNotMatch(listCopy, /MEMBERS TOPIC/);
  // Not the topic's Topic Quiz: the list's quiz is a practice quiz (D12).
  assert.doesNotMatch(listCopy, /Topic Quiz/);
  assert.match(listCopy, /eyebrow: '🔒 MY CUSTOM LIST'/);
  assert.match(listCopy, /title: 'Studying My Custom List is part of Academy membership'/);
  namesTheListsMethods(listCopy.slice(listCopy.indexOf('body:')), 'the sheet body');
  // The list branch draws only that copy; the topic copy is the other branch.
  const listBranch = sheet.slice(sheet.indexOf('{customList ? ('), sheet.indexOf(') : (', sheet.indexOf('{customList ? (')));
  assert.doesNotMatch(listBranch, /MEMBERS TOPIC|scenario/i);
  assert.match(listBranch, /guest \? CUSTOM_LIST_SHEET_COPY\.howGuest : CUSTOM_LIST_SHEET_COPY\.how/);
  // The free-topic card's "Same … scenarios and quiz" stays topic-only.
  assert.match(sheet, /\{customList\s*\?\s*CUSTOM_LIST_SHEET_COPY\.freeTail\s*:\s*'Same flashcards, practice activities, scenarios and quiz/);
  assert.doesNotMatch(listCopy.slice(listCopy.indexOf('freeTail:')), /scenario/i);
});

test('D1: the topic sheet keeps its owner copy (2026-08-13)', () => {
  assert.match(sheet, /<Text style=\{styles\.eyebrow\}>🔒 MEMBERS TOPIC<\/Text>/);
  assert.match(sheet, /Membership required to study this topic/);
  assert.match(sheet, /homework \(fill-in-the-blank and matching\), scenarios, and the Topic Quiz\./);
});

test('D1: the Dashboard opens the list variant when the dial is on My Custom List', () => {
  const dash = read('src/screens/dashboard/DashboardScreen.tsx');
  const at = dash.indexOf('<StudyAccessSheet');
  assert.ok(at > 0);
  const props = dash.slice(at, dash.indexOf('/>', dash.indexOf('onTryFree', at)));
  assert.match(props, /customList=\{dispIsCustom\}/);
  assert.match(props, /guest=\{quizAsGuest\}/);
});

// ── D2 ───────────────────────────────────────────────────────────────────────
test('D2: the Custom Study List intro names only the methods the list has', () => {
  const intros = read('src/features/intro/screenIntros.ts');
  const block = intros.slice(intros.indexOf('glossaryCustom: {'), intros.indexOf('enrollments: {'));
  assert.ok(block.length > 0);
  const para = block.match(/'(Your deck sits on the Study Dashboard[^']*)'/)?.[1] ?? '';
  assert.ok(para, 'the study paragraph is present');
  namesTheListsMethods(para, 'the intro');
  const copy = block.replace(/^\s*\/\/.*$/gm, '');
  assert.doesNotMatch(copy, /the same way you study any topic/i);
  // Rule 2 (no power sequence) is what "open from the start" claims.
  assert.equal(gate.customListMethodPowered('matching'), true);
  assert.match(para, /every method is open from the start/);
});

// ── D4 ───────────────────────────────────────────────────────────────────────
test('D4: a locked list meter says LOCKED, from the same flag as its switch', () => {
  const dash = read('src/screens/dashboard/DashboardScreen.tsx');
  assert.match(dash, /value=\{\s*actMembershipLocked\s*\?\s*'LOCKED'\s*:\s*starred\.size > 0/);
  assert.match(dash, /label=\{actMembershipLocked \? 'Locked' : isCustom \? 'Study'/);
});

// ── C1 ───────────────────────────────────────────────────────────────────────
test('C1: the Help hub answers "What is My Custom List?" truthfully', () => {
  const study = HELP_CATEGORIES.find((c) => c.key === 'study');
  assert.ok(study);
  const entry = study!.entries.find((e) => e.id === 'study-custom-list');
  assert.ok(entry, 'study-custom-list entry present in the study category');
  assert.equal(entry!.q, 'What is My Custom List?');
  namesTheListsMethods(entry!.a, 'the help answer');
  assert.match(entry!.a, /three-card icon/);
  assert.match(entry!.a, /turn the topic dial to My Custom List/);
  assert.match(entry!.a, /doesn’t count toward a certificate/);
  const order = study!.entries.find((e) => e.id === 'study-order');
  assert.match(order!.a, /My Custom List is the exception: all of its methods are open from the start\./);
});

// ── House terms the round settled ────────────────────────────────────────────
test('D5–D8: "not counted", never "void", on the quiz and exam screens', () => {
  const files = [
    'src/screens/results/ResultsScreen.tsx',
    'src/screens/exam/FinalExamResultScreen.tsx',
    'src/screens/exam/ExamBriefing.tsx',
    'src/screens/dashboard/TopicDeckSheet.tsx',
  ];
  for (const f of files) {
    const s = read(f);
    // Learner-facing strings only: JSX text and quoted literals, not code or comments.
    // (A one-word literal such as the outcome key 'voided' is code, not copy.)
    const strings = [...s.matchAll(/'[^'\n]*'|"[^"\n]*"|>[^<>{}\n]+</g)]
      .map((m) => m[0])
      .filter((x) => /\s/.test(x.slice(1, -1).trim()))
      .join('\n');
    assert.doesNotMatch(strings, /\bvoid(s|ed)?\b/i, f);
  }
  assert.match(read('src/screens/results/ResultsScreen.tsx'), />ATTEMPT NOT COUNTED</);
  assert.match(read('src/screens/exam/FinalExamResultScreen.tsx'), /title: 'NOT COUNTED'/);
  assert.match(read('src/screens/exam/ExamBriefing.tsx'), /title="Leaving the app twice ends the attempt\."/);
});

test('D12: the shared lab end screen uses US "practice"', () => {
  const end = read('src/screens/lab/kit/LabEndScreen.tsx');
  assert.match(end, /label="PRACTICE AGAIN FROM THE START"/);
  assert.doesNotMatch(read('src/screens/lab/kit/labEnd.ts').replace(/^\s*(\/\/|\*|\/\*).*$/gm, ''), /practis/i);
});
