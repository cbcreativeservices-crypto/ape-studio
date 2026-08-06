/**
 * Symbol key for the Audio Calculator Laboratory — Greek letters, calculus /
 * math symbols, and notation used across the calculators.
 *
 * ⚠ CONTENT IS OWNER-AUTHORED (owner 2026-08-05). The list and definitions are
 * being written SEPARATELY — do NOT author entries here. Populate SYMBOL_GROUPS
 * with the owner's supplied content when it is ready; the key screen renders an
 * honest "being prepared" state while this array is empty.
 */

export type SymbolEntry = {
  /** The glyph as displayed — e.g. 'π', 'Σ', '∂', 'Δ', '√', 'µ', 'ω', 'φ'. */
  symbol: string;
  /** Its name — e.g. 'pi', 'sigma', 'partial derivative', 'delta'. */
  name: string;
  /** Plain-language meaning + how it is used in the audio calculators. */
  meaning: string;
  /** Optional worked example / where it appears. */
  example?: string;
};

export type SymbolGroup = {
  /** Section label — e.g. 'Greek letters', 'Calculus', 'Operators', 'Numbers'. */
  title: string;
  entries: SymbolEntry[];
};

/**
 * OWNER-AUTHORED — intentionally EMPTY until the owner's list is supplied.
 * Add groups/entries here (or replace this with an import of the owner's data)
 * when the content is ready.
 */
export const SYMBOL_GROUPS: SymbolGroup[] = [];
