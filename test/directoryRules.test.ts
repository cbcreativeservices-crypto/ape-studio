/**
 * Audio Community Directory — rule tests (spec §2: privacy, access control,
 * migration, contact safety, selection limits).
 *
 * Runs on Node's built-in test runner with native TypeScript stripping, so it
 * needs NO new dependencies in a repo that has never had a test framework:
 *
 *     npm test
 *
 * These cover the rules that are pure logic. The rules the DATABASE enforces —
 * caps, the specialty/area dependency, the age gate, block symmetry, the rate
 * limit, erasure on unpublish — are covered by docs/APE_DIRECTORY_TESTS.sql,
 * which runs the same assertions against the live schema inside a transaction
 * that rolls back.
 */
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  LEGACY_INTEREST_MAP,
  LIMITS,
  aboutIsSafe,
  aboutProblem,
  mapLegacyInterests,
  readableError,
  slugify,
} from '../src/features/directory/rules.ts';

describe('About My Work — what must never reach a public field (§6.8)', () => {
  it('accepts an ordinary professional description', () => {
    assert.equal(aboutIsSafe('FOH engineer, six years, clubs and theatre'), true);
  });

  it('refuses an email address', () => {
    assert.equal(aboutIsSafe('reach me at alex@studio.com'), false);
    assert.equal(aboutProblem('reach me at alex@studio.com'), 'Remove the email address.');
  });

  it('refuses a link in either form', () => {
    assert.equal(aboutIsSafe('portfolio at https://example.com'), false);
    assert.equal(aboutIsSafe('see www.example.com'), false);
  });

  it('refuses a phone number', () => {
    assert.equal(aboutIsSafe('call +1 (555) 123-4567'), false);
    assert.equal(aboutProblem('call +1 (555) 123-4567'), 'Remove the phone number.');
  });

  it('refuses a social handle but not an ordinary word', () => {
    assert.equal(aboutIsSafe('find me @alexmixes'), false);
    assert.equal(aboutIsSafe('mixing at 20 dB headroom'), true);
  });

  it('refuses anything over the character limit', () => {
    assert.equal(aboutIsSafe('a'.repeat(LIMITS.about + 1)), false);
    assert.equal(aboutIsSafe('a'.repeat(LIMITS.about)), true);
  });

  it('treats empty and missing as fine — About is optional', () => {
    assert.equal(aboutIsSafe(''), true);
    assert.equal(aboutIsSafe(null), true);
    assert.equal(aboutIsSafe(undefined), true);
  });
});

describe('Migration from the old flat interest list (§6.1)', () => {
  it('moves Education and Sales to ROLES, not areas — the whole point', () => {
    const r = mapLegacyInterests(['Education', 'Sales']);
    assert.deepEqual(r.roles, ['teaching-mentoring', 'sales-product-support']);
    assert.deepEqual(r.areas, []);
    assert.deepEqual(r.specialties, []);
  });

  it('splits a work area into an area AND a specialty', () => {
    const r = mapLegacyInterests(['Live Sound']);
    assert.deepEqual(r.areas, ['live-sound-event-production']);
    assert.deepEqual(r.specialties, ['foh-mixing']);
    assert.equal(r.primaryArea, 'live-sound-event-production');
  });

  it('collapses several old values that share one area', () => {
    const r = mapLegacyInterests(['Mixing', 'Mastering', 'Studio Recording']);
    assert.deepEqual(r.areas, ['studio-recording-mixing-mastering']);
    assert.equal(r.specialties.length, 3);
    assert.equal(r.dropped.length, 0);
  });

  it('honours the primary interest, even when it was chosen last', () => {
    const r = mapLegacyInterests(['Mixing', 'Broadcast', 'DJ'], 'DJ');
    assert.equal(r.primaryArea, 'live-sound-event-production');
  });

  it('never exceeds the area cap, and reports what it dropped', () => {
    const r = mapLegacyInterests([
      'Live Sound',
      'Studio Recording',
      'Broadcast',
      'Corporate AV',
      'Repair & Electronics',
    ]);
    assert.equal(r.areas.length, LIMITS.areas);
    assert.ok(r.dropped.length > 0, 'the values that did not fit must be reported, not silently lost');
  });

  it('never exceeds the specialty cap', () => {
    const r = mapLegacyInterests(Object.keys(LEGACY_INTEREST_MAP));
    assert.ok(r.specialties.length <= LIMITS.specialties);
    assert.ok(r.roles.length <= LIMITS.roles);
    assert.ok(r.areas.length <= LIMITS.areas);
  });

  it('reports an unrecognised value rather than inventing a mapping', () => {
    const r = mapLegacyInterests(['Underwater Basket Weaving']);
    assert.deepEqual(r.dropped, ['Underwater Basket Weaving']);
    assert.deepEqual(r.areas, []);
  });

  it('every mapped value lands in exactly one concept', () => {
    for (const [label, m] of Object.entries(LEGACY_INTEREST_MAP)) {
      const isRole = !!m.role;
      const isArea = !!m.area;
      assert.ok(isRole !== isArea, `${label} must be either a role or an area, never both or neither`);
    }
  });
});

describe('Slugs round-trip the way the database builds them', () => {
  it('drops ampersands rather than turning them into a separator', () => {
    assert.equal(slugify('Acoustics, Measurement & Sound Science'), 'acoustics-measurement-sound-science');
  });

  it('keeps internal hyphens', () => {
    assert.equal(slugify('Transfer-Function & Signal Analysis'), 'transfer-function-signal-analysis');
    assert.equal(slugify('Hi-Fi Consumer Audio'), 'hi-fi-consumer-audio');
  });

  it('handles a slash', () => {
    assert.equal(slugify('AI/ML Foundations for Audio'), 'ai-ml-foundations-for-audio');
    assert.equal(slugify('RF & Wireless Systems'), 'rf-wireless-systems');
  });

  it('never leaves a leading or trailing separator', () => {
    assert.equal(slugify('  & Mixing & '), 'mixing');
  });
});

describe('Server errors become something a member can act on', () => {
  it('explains a cap', () => {
    assert.match(readableError('at most 3 areas may be selected'), /at most 3 areas/);
  });

  it('explains the specialty/area dependency', () => {
    assert.equal(
      readableError('specialty audio-dsp needs one of its areas selected'),
      'Add the matching area first, or remove that specialty.',
    );
  });

  it('explains the age gate without sounding like an accusation', () => {
    assert.equal(
      readableError('age attestation required'),
      'The community directory is for members 18 or older.',
    );
  });

  it('does not leak that a member has blocked you', () => {
    assert.equal(
      readableError('this member is not accepting contact'),
      'This member is not accepting contact.',
    );
  });

  it('passes an unrecognised failure through rather than inventing a cause', () => {
    assert.equal(readableError('connection reset by peer'), 'connection reset by peer');
  });
});
