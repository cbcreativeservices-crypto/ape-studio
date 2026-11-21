/**
 * Glossary hint (owner 2026-11-20): "it says tap a term at the bottom but it
 * only works once a user goes into full screen … confusing how to get rid of it".
 *  1. the first term a reader opens retires the hint for good;
 *  2. a tap on the pill dismisses it;
 *  3. the wording says what a tap does in the view the reader is in.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const raw = (p: string) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8').replace(/\r\n/g, '\n');
const { glossaryCoachText } = await import('../src/features/glossary/collapsedLines.ts');

describe('Glossary hint wording follows the view', () => {
  it('card view: a tap opens the complete definition', () => {
    assert.equal(glossaryCoachText(true, false), 'Tap a card to open its complete definition');
    assert.equal(glossaryCoachText(true, true), 'Tap a card to open its complete definition');
  });
  it('list view, metered reader (rows clamped): a tap expands the definition', () => {
    assert.equal(glossaryCoachText(false, true), 'Tap a term to expand or collapse the complete definition');
  });
  it('list view, member (whole definition already shown): a tap opens the learning levels', () => {
    assert.equal(glossaryCoachText(false, false), 'Tap a term to open or close its learning levels');
  });
});

describe('Glossary hint retires and can be dismissed', () => {
  const g = raw('src/screens/glossary/GlossaryScreen.tsx');
  const coach = raw('src/components/CoachMark.tsx');
  it('opening a term retires the hint (list expand and card popup)', () => {
    assert.match(g, /coach\.retire\(\);/);
    assert.match(g, /const registerCoach = coach\.retire;/);
    assert.doesNotMatch(g, /coach\.registerAction\(\)/);
  });
  it('the Glossary pill is tappable and its tap retires the hint', () => {
    assert.match(g, /onDismiss=\{coach\.retire\}/);
    assert.match(coach, /pointerEvents=\{onDismiss \? 'auto' : 'none'\}/);
    assert.match(coach, /accessibilityRole="button"/);
  });
});
