import { test } from 'node:test';
import assert from 'node:assert/strict';
import { glossaryTermSlug, isClaimedPath, linkPath, slugToQuery } from '../src/navigation/linkPaths.ts';

test('linkPath strips scheme, host, query and hash for https links', () => {
  assert.equal(linkPath('https://proaudiotrainingacademy.com/tools/rta'), 'tools/rta');
  assert.equal(linkPath('https://www.proaudiotrainingacademy.com/glossary/phantom-power?utm=x#top'), 'glossary/phantom-power');
  assert.equal(linkPath('https://proaudiotrainingacademy.com'), '');
  assert.equal(linkPath('https://proaudiotrainingacademy.com/'), '');
});

test('linkPath treats the custom scheme host as the first path segment', () => {
  assert.equal(linkPath('proaudio://tools/rta'), 'tools/rta');
  assert.equal(linkPath('proaudio:///labs'), 'labs');
  assert.equal(linkPath('PROAUDIO://get'), 'get');
  assert.equal(linkPath('tools/spl'), 'tools/spl');
});

test('isClaimedPath accepts exactly the app-owned routes', () => {
  for (const p of [
    'get',
    'tools',
    'tools/spl',
    'tools/hzcounter',
    'tools/multimeter',
    'tools/frequency-counter',
    'learn',
    'labs',
    'labs/harmonograph',
    'labs/acoustics',
    'glossary',
    'glossary/phantom-power',
    'awards/curriculum',
    'awards/program',
    'directory',
    'careers',
  ]) {
    assert.equal(isClaimedPath(p), true, p);
  }
});

test('isClaimedPath refuses website-only and malformed paths', () => {
  for (const p of [
    '',
    'verify/ABC123',
    'registry/tok',
    'u/tok',
    'academy',
    'membership',
    'tools/nope',
    'tools/spl/extra',
    'labs/a/b',
    'glossary/a/b',
    'awards',
    'awards/bogus',
    'get/x',
    'careers/x',
  ]) {
    assert.equal(isClaimedPath(p), false, p);
  }
});

test('glossaryTermSlug and slugToQuery round-trip ordinary terms', () => {
  assert.equal(glossaryTermSlug('Phantom Power'), 'phantom-power');
  assert.equal(glossaryTermSlug('−4.5 dB Pan Law'), '4-5-db-pan-law');
  assert.equal(glossaryTermSlug('Décibel (dB)'), 'decibel-db');
  assert.equal(glossaryTermSlug('---'), '');
  assert.equal(slugToQuery('phantom-power'), 'phantom power');
  assert.equal(slugToQuery('phantom%20power'), 'phantom power');
  assert.equal(slugToQuery('%E0%A4%A'), '%E0%A4%A'); // malformed escape → kept raw, never throws
});
