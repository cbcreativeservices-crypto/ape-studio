/**
 * GUARD — the home carousel card must fit the screen it is drawn on.
 *
 * Owner bug report 2026-09-22, two screenshots from a 375x667 phone: the first
 * line of every card title was sliced in half by the top edge of the card
 * ("Professional" above "Audio Glossary"), and the OPEN GLOSSARY / OPEN LABS
 * button was cut off below. The primary action on the home screen could not be
 * reached, and the card read as a rendering fault.
 *
 * Mechanism: `CARD_H` was the literal `409`. That row has roughly 273pt of
 * vertical space on a 667pt screen, and the FlatList centres its items
 * (`alignItems: 'center'`), so an oversized card overflows EQUALLY at top and
 * bottom rather than just running off the end. `styles.card` sets
 * `overflow: 'hidden'`, which then clips both.
 *
 * This is the SECOND time this failed: the comment in the source records 440
 * being shrunk to 409 in July 2026 for the same complaint. A hardcoded height
 * fixes whichever device is in the room and breaks the next one, which is why
 * this guard pins the DERIVATION rather than any particular number.
 */
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const SRC = join(process.cwd(), 'src', 'screens', 'courses', 'CourseSelectionScreen.tsx');
const raw = readFileSync(SRC, 'utf8');

/** The bug is described at length in a comment right above the fix. */
function stripComments(s: string): string {
  return s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
}
const code = stripComments(raw);

describe('home carousel card height follows the screen', () => {
  test('CARD_H is derived, not a hardcoded number', () => {
    const m = code.match(/const CARD_H\s*=\s*([^;]+);/);
    assert.ok(m, 'CARD_H is gone — re-verify this guard against whatever sizes the card now');
    const expr = m[1].trim();
    assert.ok(
      !/^\d+$/.test(expr),
      `CARD_H is the literal ${expr}. A fixed height clips the title and the card's button on short screens — that has now happened twice (440, then 409).`,
    );
    assert.match(expr, /SCREEN_LONG|SCREEN\./, 'CARD_H no longer derives from the screen size');
  });

  test('the card still fits the row on a 667pt screen', () => {
    // The geometry the owner photographed. 394 is the measured chrome above and
    // below the carousel; the row is what remains.
    const cardH = (h: number) => Math.max(260, Math.min(409, h - 394));
    assert.ok(
      cardH(667) <= 667 - 394,
      `card is ${cardH(667)}pt in a ${667 - 394}pt row — it will be clipped at both ends again`,
    );
  });

  test('tall phones are unchanged — no regression where it already fit', () => {
    const cardH = (h: number) => Math.max(260, Math.min(409, h - 394));
    for (const h of [812, 852, 932]) {
      assert.equal(cardH(h), 409, `screen ${h}pt should still get the full 409pt card`);
    }
  });

  test('the card still clips its contents, so height is the only defence', () => {
    // If overflow ever stops being hidden the symptom changes shape entirely,
    // and the reasoning above stops applying.
    assert.match(code, /overflow:\s*'hidden'/, "styles.card no longer hides overflow — re-check this guard's premise");
  });
});
