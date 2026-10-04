/**
 * GLOSSARY — hunt 8 (2026-10-03). Re-audit of 3c9cb22f (popup re-probe,
 * cross-link detail not a paid read) and 215d7f25 (no glossary paths), then
 * the area.
 *
 * 1. A failed metered read left the browse view's 120-character OPENING on the
 *    Glossary screen as if it were the whole definition. For anyone who is not
 *    a member the row holds that opening; when get_glossary_definition faults
 *    (the 8 s deadline, a dropped link, a denial) readViaGateway fails open and
 *    the term expands — with no word that the text stops mid-sentence. After a
 *    timed-out read the term is not re-sent for the rest of the session (owner
 *    2026-10-03 #2), so the cut text stayed, silently, until the next launch.
 *    The term popup (labs, calculators) already says so (its `partial` note);
 *    the screen now shows the same note on the expanded row and the card popup.
 *
 * Receipts: every test below FAILED on HEAD cf0b9c7e.
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';

const SRC = readFileSync(new URL('../src/screens/glossary/GlossaryScreen.tsx', import.meta.url), 'utf8');
const POPUP = readFileSync(new URL('../src/features/glossary/GlossaryTermPopup.tsx', import.meta.url), 'utf8');

/** The body of a top-level `const name = useCallback(` up to its deps line. */
function callbackBody(name: string): string {
  const start = SRC.indexOf(`const ${name} = useCallback(`);
  assert.ok(start >= 0, `${name} not found`);
  const end = SRC.indexOf('\n  );', start);
  return SRC.slice(start, end);
}

describe('GlossaryScreen: a failed metered read says the definition is only the opening', () => {
  it('readViaGateway records a note on the fail-open path, for a non-member only, never for the legacy table', () => {
    const body = callbackBody('readViaGateway');
    const tail = body.slice(body.indexOf("// 'not-deployed' / 'denied' / 'error'"));
    assert.match(tail, /if \(!isMember && r\.fault !== 'not-deployed'\)/);
    assert.match(tail, /r\.fault === 'error' && sessionChargeUnanswered\(id\) \? 'unanswered' : 'other'/);
    assert.match(tail, /setShortRead\(/);
    // …before it fails open.
    assert.ok(tail.indexOf('setShortRead(') < tail.indexOf('return true;'));
  });

  it('a good read clears the note', () => {
    const body = callbackBody('readViaGateway');
    const ok = body.slice(body.indexOf("if (r.state === 'ok')"), body.indexOf("if (r.fault === 'limit-reached')"));
    assert.match(ok, /setShortRead\(\(prev\) => \{[\s\S]*?delete next\[id\]/);
  });

  it('a reader change drops the last reader\'s notes with their text', () => {
    const fx = SRC.slice(SRC.indexOf('const readerChanged ='), SRC.indexOf('ENTRIES_DEF_TIER = defTier;'));
    assert.match(fx, /setShortRead\(\{\}\)/);
  });

  it('both definition sites render it — the expanded row and the card popup', () => {
    const sites = SRC.match(/<ShortReadNote kind=\{shortRead\[item\.id\]\} \/>/g) ?? [];
    assert.equal(sites.length, 2);
    const row = SRC.slice(SRC.indexOf('{expanded ? ('), SRC.indexOf('COLLAPSED ROW'));
    assert.match(row, /<ShortReadNote kind=\{shortRead\[item\.id\]\} \/>/);
    const popup = SRC.slice(SRC.indexOf('style={styles.cardPopupDef}'), SRC.indexOf('style={styles.cardPopupDef}') + 600);
    assert.match(popup, /<ShortReadNote kind=\{shortRead\[item\.id\]\} \/>/);
  });

  it('the list repaints when a note lands (rowExtraData)', () => {
    const extra = SRC.slice(SRC.indexOf('const rowExtraData = useMemo('), SRC.indexOf('const rowExtraData = useMemo(') + 600);
    assert.match(extra, /capped, shortRead, defRev, mistakesLockLine\]/);
  });

  it("the 'unanswered' words are the term popup's own (one voice for one rule)", () => {
    const words =
      'This is the opening of the entry — the full definition didn’t arrive when this term was opened. So you’re never charged twice, it isn’t fetched again until you next open the app.';
    assert.ok(POPUP.includes(words));
    const note = SRC.slice(SRC.indexOf('function ShortReadNote('), SRC.indexOf('function ShortReadNote(') + 900);
    assert.ok(note.includes(words));
    assert.match(note, /if \(!kind\) return null;/);
  });
});
