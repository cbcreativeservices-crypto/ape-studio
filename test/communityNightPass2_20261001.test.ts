/**
 * GUARDS — community / careers / help fixes from the 2026-10-01 night bug pass 2.
 *
 *  E1  ScreenHelpSheet: a link ran in the same tick as the sheet's close, so a
 *      link to a modal-presentation screen was refused by iOS (Modal-over-Modal).
 *      Links now wait afterDialogCloses, once per open.
 *  E2  Explore: "Show more" for an old list left the new list's button dead on
 *      "Loading…"; an empty page never ended the list (dedupe can hold rows
 *      below total for good).
 *  E3  Report queue: the reload after a decision used the tab of the render the
 *      button was tapped in — an OPEN list could land under the ALL tab.
 *  E4  Career Finder quiz: an account reset with the quiz mounted kept the
 *      departing user's question index.
 *  E5  Help: a double tap on RESET stacked two "Hints reset" popups.
 *  E6  Conversation sheet: the opening read could land after the post-SEND
 *      read of the same thread, dropping the sent message and the allowance.
 *  E7  Home attract cues lit for returning users until storage was read.
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
    .replace(/(^|[^:])\/\/[^\n]*/g, (m, pre) => pre + ' '.repeat(m.length - pre.length));
const between = (s: string, from: string, to: string) => {
  const a = s.indexOf(from);
  assert.ok(a >= 0, `missing ${from}`);
  const b = s.indexOf(to, a + from.length);
  assert.ok(b > a, `missing ${to} after ${from}`);
  return s.slice(a, b);
};

describe('help sheet', () => {
  const src = code('src/features/help/ScreenHelpSheet.tsx');
  test('E1: a link jumps after the sheet has closed, once per open', () => {
    assert.match(src, /import \{ afterDialogCloses \} from '\.\.\/\.\.\/lib\/confirm';/);
    const press = between(src, 'content.links.map((l, i) => (', 'accessibilityRole="button"');
    assert.match(press, /if \(jumping\.current\) return;\s*jumping\.current = true;\s*onClose\(\);\s*afterDialogCloses\(l\.onPress\)\(\);/);
    assert.doesNotMatch(press, /onClose\(\);\s*l\.onPress\(\);/);
    // Re-armed whenever the sheet is closed, and the hook runs above the early return.
    assert.match(src, /const jumping = useRef\(false\);\s*if \(!visible\) \{\s*jumping\.current = false;\s*return null;/);
  });
});

describe('explore paging', () => {
  const src = code('src/screens/directory/ExploreView.tsx');
  test('E2: a new search frees "Show more" and an old page cannot clear the new spinner', () => {
    const run = between(src, 'const run = useCallback(', '}, []);');
    assert.match(run, /setLoadingMore\(false\);\s*setEnded\(false\);/);
    const more = between(src, 'const loadMore = useCallback(', '}, [f, page]);');
    assert.match(more, /finally \{\s*if \(id === reqId\.current\) setLoadingMore\(false\);/);
  });
  test('E2: an empty page ends the list', () => {
    const more = between(src, 'const loadMore = useCallback(', '}, [f, page]);');
    assert.match(more, /if \(out\.results\.length === 0\) setEnded\(true\);/);
    assert.match(src, /const hasMore = !ended && rows\.length < total;/);
    assert.match(src, /const visibleTotal = ended \? visibleRows\.length :/);
  });
});

describe('report queue', () => {
  test('E3: the post-decision reload reads the current tab', () => {
    const src = code('src/screens/admin/ReportsAdminScreen.tsx');
    assert.match(src, /const loadRef = useRef\(load\);\s*loadRef\.current = load;/);
    for (const fn of ['const act = (', 'const dismiss = (']) {
      const body = between(src, fn, '\n  };');
      assert.match(body, /await loadRef\.current\(\);/, fn);
      assert.doesNotMatch(body, /await load\(\);/, fn);
    }
  });
});

describe('career finder quiz', () => {
  test('E4: an account reset re-seeds the question from the new record', () => {
    const src = code('src/screens/careerfinder/CareerFinderQuizScreen.tsx');
    const eff = between(src, 'const [seeded, setSeeded] = useState(false);', '}, [hydrated, seeded, rec]);');
    assert.match(eff, /if \(!hydrated\) \{\s*if \(seeded\) setSeeded\(false\);\s*return;\s*\}\s*if \(seeded\) return;/);
  });
});

describe('help hub', () => {
  test('E5: one hints reset at a time', () => {
    const src = code('src/screens/help/HelpScreen.tsx');
    const press = between(src, 'if (resetting.current) return;', 'accessibilityRole="button"');
    assert.match(press, /resetting\.current = true;\s*Promise\.all\(\[resetCoachMarks\(\)/);
    assert.match(press, /\.finally\(\(\) => \{\s*resetting\.current = false;/);
  });
});

describe('conversation sheet', () => {
  test('E6: only the latest read of the open thread lands', () => {
    const sheet = between(code('src/screens/directory/RequestsView.tsx'), 'function ThreadSheet(', 'const st = StyleSheet.create');
    const load = between(sheet, 'const load = useCallback(async () => {', '}, [thread]);');
    assert.match(load, /const seq = \+\+loadSeq\.current;/);
    assert.match(load, /if \(openId\.current !== id \|\| seq !== loadSeq\.current\) return;/);
    assert.match(load, /if \(openId\.current === id && seq === loadSeq\.current\) setAllow\(a\);/);
  });
});

describe('home attract cues', () => {
  test('E7: nothing is cued before the stored record is read', () => {
    const src = code('src/features/onboarding/attractStore.ts');
    const fn = between(src, 'function computeFlags(now: number): AttractFlags {', 'const explore');
    assert.match(fn, /if \(!hydrated\) return \{ explore: false, about: false, enrollments: false, enrolledOnce: false, deckNext: false \};/);
  });
});
