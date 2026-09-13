/**
 * The free-tier boundary in the glossary list (bug hunt 2026-09-13).
 *
 * A collapsed row used to print the COMPLETE definition in LIST view while the
 * 14-a-week allowance was charged only on EXPAND — so a guest read all 26,855
 * definitions for free and the shipped copy ("Free use includes 14 definitions
 * a week") described an app that did not exist.
 *
 * These cases pin the rule against the two ways it gets broken again: clamping
 * a MEMBER, and failing to clamp a metered reader.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  COLLAPSED_PREVIEW_LINES,
  collapsedDefinitionLines,
} from '../src/features/glossary/collapsedLines.ts';

test('a metered reader gets a preview, not the whole definition', () => {
  assert.equal(collapsedDefinitionLines(false, true), COLLAPSED_PREVIEW_LINES);
});

test('a member reads collapsed definitions in full — the clamp is metering, not layout', () => {
  // Regression guard: clamping members would make the glossary look broken for
  // the people who paid for it.
  assert.equal(collapsedDefinitionLines(false, false), undefined);
});

test('before entitlement resolves nothing clamps', () => {
  // `capped` is false until `resolved`, so this is the cold-start frame. A
  // member must never see a truncated glossary flash on launch.
  assert.equal(collapsedDefinitionLines(false, false), undefined);
});

test('CARDS stays a 2-line tile for everyone — that clamp is layout', () => {
  assert.equal(collapsedDefinitionLines(true, false), COLLAPSED_PREVIEW_LINES);
  assert.equal(collapsedDefinitionLines(true, true), COLLAPSED_PREVIEW_LINES);
});
