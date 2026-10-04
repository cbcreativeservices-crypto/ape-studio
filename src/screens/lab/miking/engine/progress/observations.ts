/**
 * Observation sheets (blueprint §8.1, ruling §16.6): OPTIONAL notes a learner
 * keeps after trying a setup on a real drum. Device-local, in their own key
 * so a large notes blob can never endanger credit; capped at 24 per lesson
 * (oldest dropped first, the drumProgress cap). They never gate credit.
 *
 * Written only for a real account (persistAllowed). A guest's sheet is not
 * kept, and the page says so; a preview keeps nothing. "Saved on this
 * device" is shown only from a write that returned true (P6).
 */
import { createLocalStore } from '../../../../../features/storage/localStore';

export const OBS_KEY = 'ape:miking:obs:v1';
export const OBS_CAP = 24;

export type ObservationSheet = { id: string; lessonId: string; at: number; fields: Record<string, string> };
type ObsState = { v: 1; sheets: ObservationSheet[] };

const EMPTY = (): ObsState => ({ v: 1, sheets: [] });

export function sanitizeObs(raw: unknown): ObsState {
  const out = EMPTY();
  const sheets = (raw as { sheets?: unknown } | null)?.sheets;
  if (!Array.isArray(sheets)) return out;
  for (const s of sheets) {
    if (!s || typeof s !== 'object') continue;
    const r = s as Record<string, unknown>;
    if (typeof r.id !== 'string' || typeof r.lessonId !== 'string' || typeof r.at !== 'number') continue;
    const fields: Record<string, string> = {};
    if (r.fields && typeof r.fields === 'object') {
      for (const [k, v] of Object.entries(r.fields as Record<string, unknown>)) if (typeof v === 'string' && k.length < 32) fields[k] = v.slice(0, 600);
    }
    out.sheets.push({ id: r.id, lessonId: r.lessonId, at: r.at, fields });
  }
  return out;
}

/** Pure: add a sheet, keeping at most OBS_CAP per lesson (oldest dropped). */
export function withSheet(state: ObsState, sheet: ObservationSheet): ObsState {
  const mine = state.sheets.filter((s) => s.lessonId === sheet.lessonId && s.id !== sheet.id);
  const others = state.sheets.filter((s) => s.lessonId !== sheet.lessonId);
  const kept = [...mine, sheet].sort((a, b) => a.at - b.at).slice(-OBS_CAP);
  return { v: 1, sheets: [...others, ...kept] };
}

const store = createLocalStore<ObsState>({
  key: OBS_KEY,
  empty: EMPTY,
  parse: (p) => {
    if (!p || typeof p !== 'object') throw new Error('not an observation record');
    return sanitizeObs(p);
  },
});

/** True only when the device took the write (the page says "Saved" then). */
export function saveObservation(sheet: ObservationSheet): Promise<boolean> {
  // A refused write is told by the shared notice (createLocalStore); the page
  // only ever says "Saved" from a true result.
  return store.mutate((s) => withSheet(s, sheet));
}

export function useObservations(lessonId: string): ObservationSheet[] {
  const s = store.use();
  return s.sheets.filter((x) => x.lessonId === lessonId);
}
export function useObservationsUnreadable(): boolean {
  store.use();
  return store.isUnreadable();
}
