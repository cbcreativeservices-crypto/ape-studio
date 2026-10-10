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
  // Tier sweep 2026-10-03: the free copy needs a KNOWN non-member
  // (useUpsellAllowed), not merely `!isMember` — a failed read is not a sale.
  const s = src('src/screens/courses/CourseSelectionScreen.tsx');
  assert.match(s, /upsell \? 'FREE TO BEGIN AND EXPLORE' : 'TRAINING LABS'/);
  assert.match(s, /upsell \? 'FREE · NEW TO AUDIO\? \(BEG LEVEL\)' : 'NEW TO AUDIO\? \(BEG LEVEL\)'/);
  assert.match(s, /upsell \? 'FREE · CAREER DISCOVERY' : 'CAREER DISCOVERY'/);
  assert.match(s, /upsell \? 'INCLUDED FOR EVERYONE' : 'MEASUREMENT TOOLS'/);
  assert.match(s, /upsell \? 'INCLUDED FOR EVERYONE' : 'REFERENCE'/);
  assert.match(s, /upsell \? 'FREE TOPIC' : 'TOPIC'/);
  assert.match(s, /isTools && upsell \? \(\s*<Text style=\{styles\.cardToolsSub\}[^>]*>/);
  assert.equal((s.match(/const upsell = useUpsellAllowed\(\);/g) ?? []).length, 2, 'card + screen both read the house helper');
  assert.doesNotMatch(s, /isMember \? '|!isMember \?/, 'no copy branches on isMember alone');
});

test('every other surface branches its free / membership copy on membership', () => {
  const cases: [string, RegExp][] = [
    ['src/screens/about/AboutHomeSheet.tsx', /!\(!upsell && FREE_TIER_LINES\.has\(p\)\)/],
    ['src/screens/enrollment/EnrollmentScreen.tsx', /free && !isCore && !paid \? '  ·  Free'/],
    ['src/screens/lab/AudioLearningScreen.tsx', /locked \? INTRO : INTRO_MEMBER/],
    ['src/screens/lab/EarLabScreen.tsx', /isMember \? '' : sec\.note/],
    ['src/screens/startHere/NextSteps.tsx', /upsell \? accessTag\(s\.access\) : ''/],
    ['src/screens/careerfinder/CareerFinderScreen.tsx', /upsell \? 'AUDIO CAREER FINDER · FREE · NO ACCOUNT' : 'AUDIO CAREER FINDER'/],
    ['src/screens/careerfinder/CareerFamilyScreen.tsx', /\{!upsell\s*\?/],
    ['src/screens/settings/SettingsScreen.tsx', /isMember \? 'Saves' : 'Academy members: saves'/],
  ];
  for (const [f, re] of cases) assert.match(src(f), re, f);
});

test('members reach Membership from Settings; the header links are for non-members only', () => {
  // Owner 2026-09-30: "for members: remove membership link in top right and
  // have members find it in settings instead".
  // Tier sweep 2026-10-03: KNOWN non-members only (useUpsellAllowed) — a
  // failed membership read must not be offered the membership it may hold.
  assert.match(src('src/screens/courses/CourseSelectionScreen.tsx'), /\{upsell \? \(\s*<Pressable\s*style=\{\[styles\.membershipBtn/);
  assert.match(src('src/screens/curriculum/CurriculumScreen.tsx'), /const upsell = useUpsellAllowed\(\);/);
  assert.match(src('src/screens/curriculum/CurriculumScreen.tsx'), /\{upsell \? \(\s*<Pressable\s*hitSlop=\{6\}\s*style=\{\[styles\.membershipCta/);
  const settings = src('src/screens/settings/SettingsScreen.tsx');
  assert.match(settings, /\{tierKnown && isMember \? \(\s*<Pressable[\s\S]{0,200}navigate\('Paywall'\)[\s\S]{0,200}Manage membership/);
});
