/**
 * localDay — a calendar date the way the person holding the phone sees it.
 *
 * ── WHY THIS EXISTS (2026-09-18) ─────────────────────────────────────────────
 *
 * `new Date(x).toISOString().slice(0, 10)` is the obvious way to stamp a
 * document, and it is wrong: `toISOString` converts to UTC first. So an evening
 * anywhere west of Greenwich prints TOMORROW'S DATE.
 *
 * At 7pm in Los Angeles it is already the next day in UTC. A revision-control
 * block on a Production Packet — a document a professional hands to a paying
 * client — would be stamped with a date that had not happened yet, and the
 * revision history would read out of order against the client's own records.
 *
 * The same applies to the Cymatics export sheets, which carry a date a user may
 * print and file.
 *
 * These are calendar days in the user's own week, not instants in UTC, so they
 * are built from local components. Same reasoning as `when()` in the Production
 * rules, which builds a LOCAL date for exactly this reason.
 */

/** `YYYY-MM-DD` for the given instant, in the device's own timezone. */
export function localDay(at: Date | number | string = new Date()): string {
  const d = at instanceof Date ? at : new Date(at);
  if (Number.isNaN(d.getTime())) return '';
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}
