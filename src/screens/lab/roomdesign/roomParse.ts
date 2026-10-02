/**
 * parseRoomNumber — a typed Room Design number, read by the CALCULATORS' rules
 * (parseQuantity, src/screens/lab/calc/calcUnits.ts) with one field-specific
 * difference (pattern hunt wave 4, 2026-10-02).
 *
 * Before: `Number(text.replace(',', '.'))` — so "1,234" became 1.234 and
 * "1,234,5" / "12abc" fell to whatever Number() made of them.
 *
 * Why not parseQuantity alone: it refuses a lone decimal comma ("3,5" → null,
 * because in a calculator it could be a typo'd group). These fields use
 * `keyboardType="decimal-pad"`, and in a comma-decimal locale that keypad's
 * ONLY separator key is the comma — so with parseQuantity alone a fractional
 * room size (3,5 m) could not be typed at all. Here a lone comma is the
 * decimal key, EXCEPT where it also reads as real grouping ("1,234",
 * "12,000"): both readings are realistic, they differ 1000×, and the
 * calculators' rule for that is to refuse rather than guess. A refused entry
 * puts the previous value back, as before.
 *
 *   "3,5"   → 3.5      "0,5"  → 0.5      "12,75" → 12.75    "0,500" → 0.5
 *   "1,234" → null (1.234 or 1234?)       "12,000" → null
 *   "3.5"   → 3.5      "1,234.5" → 1234.5 "1.234,5" → 1234.5 (parseQuantity)
 *   "12abc" → null     ""      → null
 */
import { parseQuantity } from '../calc/calcUnits';

export function parseRoomNumber(raw: string): number | null {
  // The same grouping characters parseQuantity drops.
  const t = raw.replace(/[\s_  ']/g, '');
  // Exactly one comma and no dot: the decimal-pad shape.
  if (/^[+-]?\d*,\d+$/.test(t)) {
    // Also a valid thousands group → two realistic readings → do not guess.
    if (/^[+-]?[1-9]\d{0,2},\d{3}$/.test(t)) return null;
    return parseQuantity(t.replace(',', '.'));
  }
  return parseQuantity(raw);
}
