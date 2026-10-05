/**
 * Start Here re-links (2026-10-04). Comp A applied migration 2026100410: the
 * glossary now has Sound Source, Listener (acoustics) and Audio Signal, and
 * Tone / Recording / Playback were widened. Four starter words move to them
 * (docs/GLOSSARY_STARTHERE_TERMS_2026_10_04.md section 5), and the built-in
 * copies match the live rows (md5 compared read-only on 2026-10-04).
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { STARTER_TERMS, termById } from '../src/features/startHere/startHereContent.ts';
import { STARTER_GLOSSARY, starterGlossaryEntry, starterRelated } from '../src/features/startHere/startHereGlossary.ts';

test('the four starter words open the new / right glossary entries', () => {
  assert.equal(termById('source')?.glossary, 'Sound Source');
  assert.equal(termById('listener')?.glossary, 'Listener (acoustics)');
  assert.equal(termById('audioSignal')?.glossary, 'Audio Signal');
  assert.equal(termById('tone')?.glossary, 'Tone');
  for (const id of ['source', 'listener', 'audioSignal', 'tone']) {
    const g = termById(id)!.glossary!;
    assert.equal(starterGlossaryEntry(g)?.term, g, `${id}: built-in copy has the glossary's exact spelling`);
    assert.ok(starterRelated(g).length >= 3, `${id}: related words`);
  }
});

test('no starter word has a gap any more, and no built-in copy is orphaned', () => {
  for (const t of STARTER_TERMS) {
    assert.ok(t.glossary, `${t.term}: links somewhere`);
    assert.equal(t.glossaryGap, undefined, `${t.term}: no gap text`);
  }
  const linked = new Set(STARTER_TERMS.map((t) => t.glossary!.toLowerCase()));
  for (const key of Object.keys(STARTER_GLOSSARY)) assert.ok(linked.has(key), `${key}: no starter word links here`);
  assert.equal(starterGlossaryEntry('Listening Position'), null);
  assert.equal(starterGlossaryEntry('Pure Tone'), null);
});

test('Recording and Playback carry the general meaning first', () => {
  assert.match(starterGlossaryEntry('Recording')!.plain_english, /^Recording means capturing sound/);
  assert.match(starterGlossaryEntry('Playback')!.plain_english, /^Playback is playing something that was recorded/);
  assert.match(starterGlossaryEntry('Tone')!.plain_english, /any sound with a clear pitch/);
});
