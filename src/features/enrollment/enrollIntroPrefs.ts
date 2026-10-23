/**
 * My Enrollments' "what to do here" explanation (owner 2026-10-23): it can be
 * hidden with a reveal triangle, but the triangle only appears once this
 * learner has visited the screen at least ENROLL_INTRO_MIN_VISITS times — a
 * newcomer always sees the explanation. Per account (the account wipe resets
 * it, like every createLocalStore), saved on the phone.
 */
import { createLocalStore } from '../storage/localStore';

export const ENROLL_INTRO_MIN_VISITS = 5;

type Prefs = { visits: number; hidden: boolean };

const store = createLocalStore<Prefs>({
  key: 'ape:enrollIntro',
  empty: () => ({ visits: 0, hidden: false }),
  parse: (p) => {
    const o = (p ?? {}) as Partial<Prefs>;
    const visits = typeof o.visits === 'number' && Number.isFinite(o.visits) ? Math.max(0, Math.floor(o.visits)) : 0;
    return { visits, hidden: o.hidden === true };
  },
});

export const useEnrollIntroPrefs = () => store.use();

/** One visit to My Enrollments. Counting stops at ENROLL_INTRO_MIN_VISITS —
 *  all the triangle needs — so this writes at most that many times, ever. */
export function noteEnrollmentsVisit(): void {
  if (store.get().visits >= ENROLL_INTRO_MIN_VISITS) return;
  void store.mutate((p) => (p.visits >= ENROLL_INTRO_MIN_VISITS ? p : { ...p, visits: p.visits + 1 }));
}

/** The learner's own choice — a refused write is told (the default). */
export function setEnrollIntroHidden(hidden: boolean): void {
  void store.mutate((p) => ({ ...p, hidden }));
}
