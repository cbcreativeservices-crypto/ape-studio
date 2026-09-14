import { test } from 'node:test';
import assert from 'node:assert/strict';
import { computeLabRouteMembership } from '../src/screens/lab/labMembership.ts';
import type { LabCategory } from '../src/screens/lab/labCatalog.ts';

// Guards navigation/notifications bug-hunt 2026-09-14 finding E1: a members-only
// lab reachable by deep link (proaudio://labs/<lab>) or a pendingLink resume
// must be recognized as members-only by the SAME rule the Ear Lab paints as a
// row lock, so it can never show a 🔒 in the list yet open live via a link.
//
// labCatalog itself is Metro-only (its calc-registry import chain uses
// extensionless paths), so these tests exercise the pure derivation directly
// with fixtures that mirror the real catalog's shapes.

const cat = (c: Partial<LabCategory> & Pick<LabCategory, 'id' | 'section' | 'kind'>): LabCategory =>
  ({ glyph: 'x', name: c.id, description: '', ...c } as LabCategory);

test('training-section list labs are members-only', () => {
  const m = computeLabRouteMembership([
    cat({ id: 'dynamics', section: 'training', kind: 'list', labs: [{ name: 'Compression', blurb: '', route: 'CompressionLab' }] }),
  ]);
  assert.equal(m.get('CompressionLab')?.memberOnly, true);
  assert.equal(m.get('CompressionLab')?.name, 'Compression');
});

test('fundamentals labs are free unless the leaf carries member:true', () => {
  const m = computeLabRouteMembership([
    cat({
      id: 'sound',
      section: 'fundamentals',
      kind: 'list',
      labs: [
        { name: 'Amplitude', blurb: '', route: 'AmplitudeLab' },
        { name: 'Mic Principles', blurb: '', route: 'MicLab', member: true },
      ],
    }),
  ]);
  assert.equal(m.get('AmplitudeLab')?.memberOnly, false);
  assert.equal(m.get('MicLab')?.memberOnly, true);
});

test('an alwaysFree training hub is exempt (the Calculator Laboratory)', () => {
  const m = computeLabRouteMembership([
    cat({ id: 'calculators', section: 'training', kind: 'hub', route: 'CalcLab', count: 1, hubBlurb: '', alwaysFree: true }),
  ]);
  assert.equal(m.get('CalcLab')?.memberOnly, false);
});

test('a route free in ANY occurrence is never reported members-only', () => {
  // Same screen route appears once free, once behind a members-only section.
  const m = computeLabRouteMembership([
    cat({ id: 'free', section: 'fundamentals', kind: 'list', labs: [{ name: 'Shared', blurb: '', route: 'SharedModule' }] }),
    cat({ id: 'paid', section: 'training', kind: 'list', labs: [{ name: 'Shared', blurb: '', route: 'SharedModule' }] }),
  ]);
  assert.equal(m.get('SharedModule')?.memberOnly, false);
});

test('a route members-only in EVERY occurrence stays members-only', () => {
  const m = computeLabRouteMembership([
    cat({ id: 'a', section: 'training', kind: 'list', labs: [{ name: 'X', blurb: '', route: 'XLab' }] }),
    cat({ id: 'b', section: 'training', kind: 'list', labs: [{ name: 'X', blurb: '', route: 'XLab' }] }),
  ]);
  assert.equal(m.get('XLab')?.memberOnly, true);
});

test('unknown routes are absent (treated as free by the callers)', () => {
  const m = computeLabRouteMembership([]);
  assert.equal(m.get('NotARealScreen'), undefined);
});
