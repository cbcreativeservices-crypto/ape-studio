/**
 * The one row shape both measurement backends store, kept in its own file so
 * the native (SQLite) and web (AsyncStorage) siblings can share a type without
 * either importing the other — importing the web sibling from the native one
 * would pull AsyncStorage back into the path this split exists to keep it out of.
 *
 * `id` and `created_at` are columns rather than fields inside `json` because
 * the store orders and deletes by them, and a query should not have to parse a
 * 119 KB payload to sort a list.
 */
export type MeasurementRow = {
  id: string;
  created_at: string;
  /** The whole SavedMeasurement, serialized. */
  json: string;
};
