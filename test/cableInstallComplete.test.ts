/**
 * Cable Install completion screen tells the truth about saving (owner
 * 2026-10-01: "fix Cable Install's finish screen to correctly inform the user
 * and offer them membership to save before it is lost").
 *
 * Pure copy (completeCopy.ts, imported directly) + source guards on the
 * screen's wiring.
 */
import { strict as assert } from 'node:assert';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';
import { ciLeftLead, ciSaveNotice, ciSaveState } from '../src/screens/lab/cableinstall/completeCopy.ts';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const src = (p: string) =>
  readFileSync(resolve(ROOT, p), 'utf8')
    .replace(/\r\n/g, '\n')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^\s*\/\/.*$/gm, '');
const SCREEN = src('src/screens/lab/cableinstall/CableInstallLabScreen.tsx');

const LEFT_CASES = [
  { unbanked: 5, replayOnly: 0, total: 13 },
  { unbanked: 1, replayOnly: 2, total: 13 },
  { unbanked: 0, replayOnly: 4, total: 13 },
];

describe('ciSaveState — who is really saved', () => {
  it('a signed-out guest (resolved anonymous) is a guest', () => {
    assert.equal(ciSaveState({ endGuest: true, noAccount: true, isMember: false }), 'guest');
  });
  it('a signed-in non-member preview is a preview', () => {
    assert.equal(ciSaveState({ endGuest: true, noAccount: false, isMember: false }), 'preview');
  });
  it('a signed-in learner (or a tier not yet known) is saved', () => {
    assert.equal(ciSaveState({ endGuest: false, noAccount: false, isMember: false }), 'saved');
  });
  it('a member is always saved', () => {
    assert.equal(ciSaveState({ endGuest: false, noAccount: false, isMember: true }), 'saved');
    assert.equal(ciSaveState({ endGuest: true, noAccount: false, isMember: true }), 'saved');
  });
});

describe('guest / preview copy never says "saved" for this run', () => {
  for (const state of ['guest', 'preview'] as const) {
    it(`${state}: the lead never claims saved, credited or banked`, () => {
      for (const c of LEFT_CASES) {
        const s = ciLeftLead(state, c);
        assert.doesNotMatch(s, /\bis saved\b|so far is saved|credited|banked|nothing is lost/i, s);
      }
    });
    it(`${state}: the notice says it is not saved and offers membership`, () => {
      const n = ciSaveNotice(state);
      assert.ok(n);
      assert.match(n.title, /NOT SAVED/);
      // The only "saved" it may say is about the NEXT run, or "not/nothing … saved".
      assert.doesNotMatch(n.body, /everything|so far is saved|progress is saved|(?<!nothing in )this run is saved/i);
      assert.match(n.join, /MEMBER/);
      // Never promises THIS run survives a sign-up (first sign-in wipes ape:*).
      assert.match(n.body, /cannot be carried over/);
      assert.match(n.body, /next run is saved/);
      assert.doesNotMatch(n.body, /\bfree\b/i);
    });
  }
  it('guest: names leaving the lab and closing the app, and offers sign-in', () => {
    const n = ciSaveNotice('guest')!;
    assert.match(n.body, /not signed in/);
    assert.match(n.body, /leave the lab or close the app/);
    assert.match(n.body, /needs a membership/);
    assert.ok(n.signIn && /SIGN IN/.test(n.signIn));
  });
  it('preview: no sign-in button (already signed in)', () => {
    assert.equal(ciSaveNotice('preview')!.signIn, undefined);
  });
});

describe('signed-in branch is unchanged; members see no offer', () => {
  it('the signed-in lead is the original wording', () => {
    assert.equal(
      ciLeftLead('saved', { unbanked: 5, replayOnly: 0, total: 13 }),
      '5 of 13 stages still to finish before this lab counts toward your credit. Everything you have done so far is saved — pick up wherever you like.',
    );
    assert.equal(
      ciLeftLead('saved', { unbanked: 1, replayOnly: 2, total: 13 }),
      '1 of 13 stage still to finish before this lab counts toward your credit. Everything you have done so far is saved — pick up wherever you like. 2 more not replayed this run — already credited.',
    );
    assert.equal(
      ciLeftLead('saved', { unbanked: 0, replayOnly: 4, total: 13 }),
      '4 of 13 stages not replayed this run. Your credit for every stage is already banked — replay them or leave them; nothing is lost.',
    );
  });
  it('a saved learner (and so every member) gets no notice and no offer', () => {
    assert.equal(ciSaveNotice('saved'), null);
    assert.equal(ciSaveNotice(ciSaveState({ endGuest: true, noAccount: true, isMember: true })), null);
  });
});

describe('CableInstallLabScreen wiring', () => {
  it('uses the shared guest rule and the lab’s own noAccountRef — no new one', () => {
    assert.match(SCREEN, /useLabEndGuest\(\)/);
    assert.match(SCREEN, /ciSaveState\(\{ endGuest, noAccount: noAccountRef\.current, isMember \}\)/);
    assert.match(SCREEN, /noAccountRef\.current = resolved && entitlement === 'anonymous'/);
  });
  it('the old unconditional "saved" sentence is gone from the screen', () => {
    assert.doesNotMatch(SCREEN, /Everything you have done so far is saved/);
    assert.match(SCREEN, /ciLeftLead\(saveState,/);
  });
  it('CREDITED tags only when the run is really saved', () => {
    assert.match(SCREEN, /\{saved && m\.banked \? <Text style=\{styles\.leftBanked\}>CREDITED<\/Text>/);
  });
  it('the offer navigates straight to Paywall / Auth (in-flow, not from a popup)', () => {
    assert.match(SCREEN, /onJoin=\{\(\) => \(navigation as [^\n]*\)\.navigate\('Paywall'\)\}/);
    assert.match(SCREEN, /onSignIn=\{\(\) => \(navigation as [^\n]*\)\.navigate\('Auth'\)\}/);
    // A popup exit would need afterDialogCloses; these are in-flow buttons,
    // so the completion stage must not route them through a dialog at all.
    assert.doesNotMatch(SCREEN, /confirmDialog\([^)]*Paywall/);
    assert.doesNotMatch(SCREEN, /Alert\.alert/);
  });
  it('the offer is rendered only when there is a notice; REPEAT and RETURN stay', () => {
    assert.match(SCREEN, /\{notice \? \(/);
    assert.match(SCREEN, /label="REPEAT LAB"/);
    assert.match(SCREEN, /label="RETURN TO TRAINING"/);
  });
});
