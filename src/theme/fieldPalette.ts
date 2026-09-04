/**
 * fieldPalette — a STABLE accent color per v3 curriculum FIELD.
 *
 * v3 topics carry no course color (the old `courses.color_hex` is retired with
 * v1), so the Achievements trophy grid colors trophies by their FIELD instead.
 * The color is derived deterministically from the field NAME (a hash into a
 * curated palette), so it is stable across sessions AND across future field
 * additions/renames — unlike an index-based assignment, which reshuffles every
 * time the field list changes.
 *
 * The palette draws from the app's established accent language (theme tokens)
 * plus a few compatible additions, all legible against the dark trophy tiles.
 */
import { colors } from './tokens';

const FIELD_PALETTE: readonly string[] = [
  colors.blue, // #2f9bff
  colors.green, // #37e05f
  colors.gold, // #ffc233
  colors.purple, // #b45bff
  colors.orange, // #ff8a1e
  colors.cyanBright, // #7fd4ff
  '#2ee6c8',
  '#ff5ec4',
  '#b8e986',
  '#ff7a66',
  '#8aa5c9',
  colors.red, // #ff4b3a
] as const;

/**
 * Optional manual override, once the real field names are known and the owner
 * wants a specific field to read a specific color (e.g. a Safety field in red).
 * Empty by default — the hash gives every field a stable color without it.
 */
const FIELD_OVERRIDE: Record<string, string> = {};

/** Deterministic accent color for a curriculum field name. */
export function fieldColor(field: string | null | undefined): string {
  const key = (field ?? '').trim();
  if (!key) return FIELD_PALETTE[0];
  if (FIELD_OVERRIDE[key]) return FIELD_OVERRIDE[key];
  let h = 0;
  for (let i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) >>> 0;
  return FIELD_PALETTE[h % FIELD_PALETTE.length];
}
