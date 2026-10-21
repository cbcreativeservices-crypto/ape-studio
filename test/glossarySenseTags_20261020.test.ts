/**
 * Glossary sense tags (Comp A, LIVE 2026-10-19): bare names that now mean the
 * wrong thing — or no longer exist — are never looked up by the app. Each
 * lookup uses the audio sense's own entry (owner go 2026-10-20; the Meter lab
 * links the RTA, owner's pick). Exact-name lookups use ilike on
 * glossary_browse_v, so the bare name would open the other sense.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const src = (p: string) => readFileSync(join(import.meta.dirname, '..', 'src', p), 'utf8');
const FILES = [
  'screens/lab/calc/workspaces/dynamics.ts',
  'screens/lab/calc/workspaces/roomsAdvanced.ts',
  'screens/lab/calc/workspaces/roomsSecond.ts',
  'screens/lab/calc/workspaces/timePhase.ts',
  'features/glossary/learningProfiles.ts',
  'features/startHere/startHereGlossary.ts',
];
// renamed to a non-audio sense, or retired (bare Compression)
const BARE = ['Compression', 'Reflection', 'Spectrum Analyzer', 'Patch', 'Monitoring', 'Voice', 'Cycle', 'Deck', 'Source', 'Clock', 'Range', 'Scene', 'Bridge', 'Unity'];

describe('glossary lookups use the tagged audio sense', () => {
  for (const f of FILES) {
    it(`${f} looks up no bare name that now opens another sense`, () => {
      // code only: a comment may name a term it deliberately does NOT link
      const s = src(f).replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');
      for (const b of BARE) assert.doesNotMatch(s, new RegExp(`'${b}'`), `${f}: '${b}'`);
    });
  }
  it('each lookup names its audio entry', () => {
    assert.match(src('screens/lab/calc/workspaces/dynamics.ts'), /'Dynamic range compression'/);
    assert.match(src('screens/lab/calc/workspaces/roomsAdvanced.ts'), /'Reflection \(acoustics\)'/);
    assert.equal(src('screens/lab/calc/workspaces/roomsSecond.ts').match(/'Reflection \(acoustics\)'/g)?.length, 2);
    assert.match(src('screens/lab/calc/workspaces/timePhase.ts'), /'Reflection \(acoustics\)'/);
    assert.match(src('screens/lab/calc/workspaces/timePhase.ts'), /'Monitoring \(audio\)'/);
    const lp = src('features/glossary/learningProfiles.ts');
    assert.match(lp, /'Patch \(synth preset\)'/);
    assert.match(lp, /'Reflection \(acoustics\)'/);
    assert.match(lp, /'Real-time analyzer'/, 'the Meter lab links the RTA (owner 2026-10-20)');
    const sh = src('features/startHere/startHereGlossary.ts');
    assert.match(sh, /'Compression \(acoustics\)'/);
    assert.match(sh, /'Reflection \(acoustics\)'/);
  });
  it('Start Here’s Source already opens Sound Source', () => {
    assert.match(src('features/startHere/startHereContent.ts'), /term: 'Source',[\s\S]{0,200}glossary: 'Sound Source'/);
  });
});
