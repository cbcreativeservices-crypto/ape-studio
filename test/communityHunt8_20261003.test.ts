/**
 * GUARDS — community / careers / awards, HUNT 8 (2026-10-03).
 *
 *  H1  Celebration (Low-Light, iOS): the inline notice announced itself in an
 *      effect keyed on the `values` OBJECT. The Dashboard builds a fresh one on
 *      every render (pick()), so VoiceOver re-read "Flashcards complete" on
 *      every Dashboard re-render — the comment promised the opposite.
 *  H2  Trophy Case → Topics: the header counter printed "0 / 0" while loading
 *      and beside the "Couldn't load" card — a count nobody read, as fact.
 *  H3  Topics + Gallery RETRY: Retry cleared the error but left the failed
 *      load's [] in place, so the read in flight showed the TRULY EMPTY face
 *      ("No topics available yet." / "No trophies yet — Earn your first
 *      trophy") to a member whose list simply had not loaded yet.
 */
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const read = (p: string) => readFileSync(join(process.cwd(), p), 'utf8').replace(/\r\n/g, '\n');
const blank = (s: string) => s.replace(/[^\n]/g, ' ');
const code = (p: string) =>
  read(p)
    .replace(/\/\*[\s\S]*?\*\//g, blank)
    .replace(/\{\s*\/\*[\s\S]*?\*\/\s*\}/g, blank)
    .replace(/(^|[^:])\/\/[^\n]*/g, (m, pre) => pre + ' '.repeat(m.length - pre.length));

describe('hunt 8 — community / careers / awards', () => {
  test('H1 the Low-Light notice is announced once per text, not once per render', () => {
    const v = code('src/features/celebration/Celebration.tsx');
    const i = v.indexOf('announceForAccessibility(');
    assert.ok(i > 0, 'the announcement exists');
    const end = v.indexOf(']);', i);
    const deps = v.slice(v.lastIndexOf('[', end), end + 1);
    assert.doesNotMatch(deps, /\bvalues\b/, `the effect must not re-run on a fresh values object: ${deps}`);
    assert.doesNotMatch(deps, /\bdef\b(?!\.)/, `nor on the def object: ${deps}`);
    const spokenVar = v.slice(i, end).match(/announceForAccessibility\((\w+)\)/);
    assert.ok(spokenVar, 'announces a precomputed string');
    assert.match(v, new RegExp(`const ${spokenVar![1]} = fill\\(def\\.title, values\\);`));
    assert.ok(deps.includes(spokenVar![1]), 'keyed on the spoken text');
  });

  test('H2 Topics: no "0 / 0" before a read, or beside a failed one', () => {
    const v = code('src/screens/achievements/TopicsScreen.tsx');
    assert.doesNotMatch(v, /\{earnedTotal\} \/ \{total\}/, 'the raw counter is gone');
    assert.match(v, /fields !== null && !loadError \? `\$\{earnedTotal\} \/ \$\{total\}` : '— \/ —'/);
  });

  for (const [file, setter, okArm] of [
    ['src/screens/achievements/TopicsScreen.tsx', 'setFields', 'setFields(fields)'],
    ['src/screens/achievements/GalleryScreen.tsx', 'setEntries', 'setEntries(e)'],
  ] as const) {
    test(`H3 ${file.split('/').pop()}: Retry after a failure shows LOADING, not the empty state`, () => {
      const v = code(file);
      const s = v.indexOf('const load = useCallback');
      const e = v.indexOf('useFocusEffect(', s);
      const load = v.slice(s, e);
      const first = load.search(/fetch\w+\(\)/);
      const before = load.slice(0, first);
      const m = before.match(new RegExp(`if \\((\\w+)\\.current\\) ${setter}\\(null\\);`));
      assert.ok(m, 'a load after a failed one starts from the loading face');
      const flag = m![1];
      assert.match(v, new RegExp(`const ${flag} = useRef\\(false\\);`));
      // set on failure, cleared on success
      const catchArm = load.slice(load.indexOf('.catch('));
      assert.match(catchArm, new RegExp(`${setter}\\(\\[\\]\\);\\s*${flag}\\.current = true;`));
      const thenArm = load.slice(load.indexOf('.then('), load.indexOf('.catch('));
      assert.match(thenArm, new RegExp(`${flag}\\.current = false;\\s*${setter.replace('(', '\\(')}`));
      assert.ok(thenArm.includes(okArm), 'the success arm still lands the read');
    });
  }
});
