/**
 * Owner 2026-09-29: "the message about being 'free' should be removed for
 * members. We do not want to point out to members what they could be getting
 * for free … look for any other instances where we are still marketing the
 * membership to members … and hide them."
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const src = (p: string) => readFileSync(p, 'utf8');

test('Home card eyebrows: plain labels for members', () => {
  const s = src('src/screens/courses/CourseSelectionScreen.tsx');
  assert.match(s, /isMember \? 'TRAINING LABS' : 'FREE TO BEGIN AND EXPLORE'/);
  assert.match(s, /isMember \? 'NEW TO AUDIO\?' : 'FREE · NEW TO AUDIO\?'/);
  assert.match(s, /isMember \? 'MEASUREMENT TOOLS' : 'INCLUDED FOR EVERYONE'/);
  assert.match(s, /isMember \? 'REFERENCE' : 'INCLUDED FOR EVERYONE'/);
  assert.match(s, /isMember \? 'TOPIC' : 'FREE TOPIC'/);
  assert.match(s, /isTools && !isMember \? \(\s*<Text style=\{styles\.cardToolsSub\}>/);
});

test('every other surface branches its free / membership copy on membership', () => {
  const cases: [string, RegExp][] = [
    ['src/screens/about/AboutHomeSheet.tsx', /!\(isMember && FREE_TIER_LINES\.has\(p\)\)/],
    ['src/screens/curriculum/CurriculumScreen.tsx', /isMember \? 'CAREER DISCOVERY LAB' : 'CAREER DISCOVERY LAB · FREE'/],
    ['src/screens/enrollment/EnrollmentScreen.tsx', /free && !isCore && !paid \? '  ·  Free'/],
    ['src/screens/lab/AudioLearningScreen.tsx', /locked \? INTRO : INTRO_MEMBER/],
    ['src/screens/lab/EarLabScreen.tsx', /isMember \? '' : sec\.note/],
    ['src/screens/startHere/NextSteps.tsx', /isMember \? '' : accessTag/],
    ['src/screens/careerfinder/CareerFinderScreen.tsx', /isMember \? 'AUDIO CAREER FINDER' :/],
    ['src/screens/careerfinder/CareerFamilyScreen.tsx', /\{isMember\s*\?/],
    ['src/screens/settings/SettingsScreen.tsx', /isMember \? 'Saves' : 'Academy members: saves'/],
  ];
  for (const [f, re] of cases) assert.match(src(f), re, f);
});
