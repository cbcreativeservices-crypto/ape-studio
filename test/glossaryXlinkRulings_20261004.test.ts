/**
 * OWNER RULING 2026-10-04 — a cross-link inside a definition warns a METERED
 * reader before it spends a lookup. Verbatim: "before opening the crosslinked
 * other glossary term from the link in the description, warn that opening the
 * new term link will count as another credit. the user can decide then to
 * close or go to the other term and use the credit."
 *
 * Replaces the 2026-09-10 free hop (browse view's 120-character opening, no
 * charge). Receipt: FAILS on HEAD e262b2ec (no crossLinkCharge module, the
 * hop never asks and never charges).
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { beforeEach, describe, it } from 'node:test';
import {
  CROSS_LINK_CANCEL,
  CROSS_LINK_OPEN,
  crossLinkBody,
  crossLinkPlan,
  crossLinkTitle,
  lookupsLeft,
} from '../src/features/glossary/crossLinkCharge.ts';

const SCREEN = readFileSync(new URL('../src/screens/glossary/GlossaryScreen.tsx', import.meta.url), 'utf8');
const POPUP = readFileSync(new URL('../src/features/glossary/GlossaryTermPopup.tsx', import.meta.url), 'utf8');

const between = (src: string, a: string, b: string) => {
  const i = src.indexOf(a);
  assert.ok(i >= 0, `missing: ${a}`);
  const j = src.indexOf(b, i);
  assert.ok(j > i, `missing after ${a}: ${b}`);
  return src.slice(i, j);
};

describe('the decision', () => {
  it('an unmetered reader (member, checking, unconfirmed) hops free, never asked', () => {
    assert.equal(crossLinkPlan({ metered: false, alreadyOpened: false, left: 3 }), 'free-hop');
    assert.equal(crossLinkPlan({ metered: false, alreadyOpened: false, left: 0 }), 'free-hop');
  });
  it('a term already opened this session is free and not asked about', () => {
    assert.equal(crossLinkPlan({ metered: true, alreadyOpened: true, left: 0 }), 'open-paid');
    assert.equal(crossLinkPlan({ metered: true, alreadyOpened: true, left: 5 }), 'open-paid');
  });
  it('a used-up week goes straight to the limit handling, never a dialog that then fails', () => {
    assert.equal(crossLinkPlan({ metered: true, alreadyOpened: false, left: 0 }), 'open-limit');
  });
  it('otherwise the metered reader is asked, with or without a known count', () => {
    assert.equal(crossLinkPlan({ metered: true, alreadyOpened: false, left: 4 }), 'ask');
    assert.equal(crossLinkPlan({ metered: true, alreadyOpened: false, left: null }), 'ask');
  });
  it('the count is known only from real numbers', () => {
    assert.equal(lookupsLeft(null), null);
    assert.equal(lookupsLeft({ used: 9, limit: 14 }), 5);
    assert.equal(lookupsLeft({ used: 16, limit: 14 }), 0);
    assert.equal(lookupsLeft({ used: Number.NaN, limit: 14 }), null);
    assert.equal(lookupsLeft({ used: 1, limit: 0 }), null);
  });
});

describe('the words (plain)', () => {
  it('title, body with and without N, buttons', () => {
    assert.equal(crossLinkTitle('Headroom'), 'Open “Headroom”?');
    assert.equal(crossLinkBody(5), 'Opening this term uses 1 definition lookup. You have 5 left this week.');
    assert.equal(crossLinkBody(null), 'Opening this term uses 1 definition lookup.');
    assert.equal(CROSS_LINK_OPEN, 'Open (uses 1 lookup)');
    assert.equal(CROSS_LINK_CANCEL, 'Cancel');
  });
});

describe('GlossaryScreen: the cross-link path', () => {
  // Sliced inside each test, so a missing anchor is a FAILED test, not a
  // suite that never registers its tests.
  let linked = '';
  let metered = '';
  beforeEach(() => {
    linked = SCREEN.includes('const openLinked = useCallback(') && SCREEN.includes('const onLinkPress = useCallback(')
      ? between(SCREEN, 'const openLinked = useCallback(', 'const onLinkPress = useCallback(')
      : '';
    metered = SCREEN.includes('const openLinkedMetered = useCallback(')
      ? between(SCREEN, 'const openLinkedMetered = useCallback(', 'const crossLinkAskingRef')
      : '';
  });

  it('metered = a KNOWN non-member on a metered path (members / checking / unconfirmed never)', () => {
    assert.match(linked, /const metered = meterKnown && \(serverMeters \|\| capped\);/);
  });
  it('"already opened" is the session rule of every metered path', () => {
    assert.match(linked, /sessionDefinition\(id, isMember\) != null \|\|/);
    // 2026-10-04: a sent-but-unanswered term is re-read now (the server's 24 h
    // ledger is live), so it is asked about like a new one — never free-hopped.
    assert.doesNotMatch(linked, /sessionChargeUnanswered\(id\)/);
    assert.match(linked, /\(!serverMeters && SESSION_FALLBACK_CHARGED\.has\(id\)\)/);
    assert.match(linked, /lookupsLeft\(meterCountRef\.current\)/);
  });
  it('asks with the house confirmDialog; Cancel charges nothing; never Alert.alert', () => {
    assert.match(linked, /confirmDialog\(\s*crossLinkTitle\(term\),\s*crossLinkBody\(left\),\s*CROSS_LINK_OPEN,/);
    assert.match(linked, /cancelText: CROSS_LINK_CANCEL,/);
    assert.match(linked, /onCancel: \(\) => \{\s*crossLinkAskingRef\.current = false;\s*\}/);
    assert.doesNotMatch(SCREEN, /Alert\.alert\(/);
  });
  it('K11: one dialog and one charge for a double tap', () => {
    assert.match(linked, /if \(crossLinkAskingRef\.current \|\| crossLinkLatch\.busy\(\)\) return;\s*crossLinkAskingRef\.current = true;/);
    assert.match(linked, /crossLinkLatch\s*\.run\(\(\) => openLinkedMetered\(id\)\)/);
    assert.match(SCREEN, /const crossLinkLatch = useInFlightLatch\(\);/);
  });
  it('Open charges through the same gate as any open, newest open wins', () => {
    assert.match(metered, /const seq = \+\+openSeqRef\.current;/);
    assert.match(metered, /if \(!\(await gateDefinitionOpen\(id\)\)\) return;/);
    assert.match(metered, /if \(seq !== openSeqRef\.current\) return;\s*hopToLinked\(id\);/);
  });
  it('the sense chooser goes through the same warning', () => {
    assert.match(SCREEN, /onPress=\{\(\) => openLinked\(id\)\}/);
  });
  it('the weekly count comes only from the meter, and is dropped on a reader change', () => {
    assert.match(SCREEN, /meterCountRef\.current = \{ used: u\.used, limit: u\.limit \};/);
    assert.match(SCREEN, /meterCountRef\.current = st\.unavailable \? null : \{ used: st\.used, limit: st\.limit \};/);
    assert.match(SCREEN, /meterCountRef\.current = null; \/\/ the last reader's weekly count/);
  });
  it('the old "cross-links are FREE" promise is gone', () => {
    assert.doesNotMatch(SCREEN, /Cross-links are FREE/);
  });
});

describe('GlossaryTermPopup (lessons, labs, Start Here): no cross-links to warn about', () => {
  it('its body is plain text, and a preloaded starter word never reads the meter', () => {
    assert.doesNotMatch(POPUP, /onLink|LinkedText/);
    const pre = between(POPUP, 'if (preloaded) {', '// A re-open of a term this session already read');
    assert.doesNotMatch(pre, /readOnce|readDefinitionOnce/);
  });
});
