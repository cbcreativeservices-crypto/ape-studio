/**
 * UX review 2026-10-15 (owner rulings): the Study Area card button reads
 * CERTIFICATES & PROGRAMS; calculator-backed glossary terms carry a CALCULATOR
 * tag instead of a purple title; the topic list has an A–Z fast-scroll strip;
 * the first tap on CUSTOM STUDY LIST explains the list.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const home = readFileSync('src/screens/courses/CourseSelectionScreen.tsx', 'utf8');
const gl = readFileSync('src/screens/glossary/GlossaryScreen.tsx', 'utf8');
const intros = readFileSync('src/features/intro/screenIntros.ts', 'utf8');
const az = readFileSync('src/features/glossary/AZIndex.tsx', 'utf8');

test('Study Area card button: CERTIFICATES & PROGRAMS, not EXPLORE', () => {
  assert.match(home, /label="CERTIFICATES & PROGRAMS ›"/);
  assert.doesNotMatch(home, /label="EXPLORE ›"/);
});

test('calculator terms: a CALCULATOR tag, no purple title', () => {
  assert.match(gl, /isCalcBackedTerm\(item\.term\) \? \(\s*<View style=\{styles\.calcTag\}/);
  assert.doesNotMatch(gl, /styles\.termEquation/);
});

test('topic list: A–Z strip in both the member and the locked list', () => {
  assert.equal((gl.match(/<AZIndex present=\{topicLetters\} onPick=\{jumpToTopicLetter\} \/>/g) ?? []).length, 2);
  assert.equal((gl.match(/onLayout=\{topicFirstOfLetter\.has\(t\.id\)/g) ?? []).length, 2);
  assert.match(az, /export function azLetterOf/);
});

test('first tap on CUSTOM STUDY LIST shows its explainer once', () => {
  assert.match(intros, /glossaryCustom: \{\s*\/\/[^\n]*\n[^\n]*\n\s*placeholder: false,\s*title: 'Your Custom Study List'/);
  assert.match(gl, /useScreenIntro\('glossaryCustom', false, introHold \|\| filter !== 'custom'/);
  assert.match(gl, /<IntroSheet introKey="glossaryCustom" onDismiss=\{customIntro\.dismiss\} \/>/);
});

test('Glossary links: one switch, in the Glossary AND in Settings › GLOSSARY, kept in step', () => {
  const settings = readFileSync('src/screens/settings/SettingsScreen.tsx', 'utf8');
  const pref = readFileSync('src/features/glossary/linksPref.ts', 'utf8');
  assert.match(settings, /const \[glossaryLinks, setGlossaryLinks\] = useGlossaryLinksPref\(\);/);
  assert.match(settings, /<Toggle on=\{glossaryLinks\} label="Glossary links" onChange=\{setGlossaryLinks\} \/>/);
  assert.match(pref, /listeners\.forEach\(\(l\) => l\(v\)\);/);
  assert.match(gl, /useGlossaryLinksPref\(\)/);
});
