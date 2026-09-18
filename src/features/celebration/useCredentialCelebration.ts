/**
 * useCredentialCelebration — notice when a credential has actually been earned,
 * and celebrate it exactly once.
 *
 * ── WHY THIS HAD TO BE WRITTEN ───────────────────────────────────────────────
 *
 * The celebration engine shipped with five credential celebrations — the first
 * certificate, another certificate, the first programme, another programme, and
 * the combined screen for several at once — and `credentialCelebration()` to
 * choose between them. A bug-hunting pass then found that **nothing called it**.
 * The engine was about 40% connected: quizzes celebrated, credentials did not,
 * and the biggest moment in the app passed in silence.
 *
 * ── WHY IT IS A DIFF AND NOT AN EVENT ───────────────────────────────────────
 *
 * Credentials are not awarded by the client. They are awarded server-side when
 * the requirements are met, so there is no moment in this codebase that can say
 * "you just earned one" — by the time the app finds out, it is reading a list
 * that has grown. So this compares the credential ids we have seen against the
 * ones the server reports, and treats anything new as newly earned.
 *
 * That also makes it robust to the thing an event would get wrong: it does not
 * matter WHERE the credential was earned, whether the app was closed at the
 * time, or whether the award landed minutes after the quiz that caused it.
 *
 * ── THE FIRST RUN MUST BE SILENT ─────────────────────────────────────────────
 *
 * An existing member has credentials already. Without the seeding branch below
 * they would be congratulated for every one of them at once, on the next app
 * launch after this ships — which is both wrong and the kind of thing that
 * makes a real achievement feel cheap.
 */
import { useCallback, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { fetchMyCredentials } from '../credentials/api';
import { credentialCelebration } from './celebrationQueue';
import type { CelebrationEvent } from './types';

/** The credential ids this device has already celebrated (or seeded). */
const KNOWN_KEY = 'ape:celebratedCredentials';

type Known = { ids: string[]; certificates: number; programs: number };

async function readKnown(): Promise<Known | null> {
  try {
    const raw = await AsyncStorage.getItem(KNOWN_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<Known>;
    if (!parsed || !Array.isArray(parsed.ids)) return null;
    return {
      ids: parsed.ids.filter((s): s is string => typeof s === 'string'),
      certificates: Number(parsed.certificates) || 0,
      programs: Number(parsed.programs) || 0,
    };
  } catch {
    // Unreadable is treated as ABSENT, which re-seeds silently. The alternative
    // — treating it as empty — would celebrate everything the member already
    // holds, so the failure mode is deliberately the quiet one.
    return null;
  }
}

async function writeKnown(k: Known): Promise<void> {
  try {
    await AsyncStorage.setItem(KNOWN_KEY, JSON.stringify(k));
  } catch {
    /* best-effort: a failed write costs a repeat celebration, never a lost one */
  }
}

export type CredentialCelebration = {
  event: CelebrationEvent;
  /** Filled into the catalog's `{certificate_name}` / `{program_name}`. */
  values: Record<string, string | number>;
  /**
   * Call this at the moment the celebration is actually put on screen.
   *
   * Nothing is recorded until you do. The first version of this hook wrote the
   * new set BEFORE handing the result back, and the caller drops the result when
   * the screen has since lost focus — so navigating away during the network read
   * marked the credential celebrated forever and it was never shown. That is the
   * same "burned, not shown" shape as the hearing-dose warning fixed two commits
   * earlier, on the one moment in the app that is hardest to give back.
   */
  confirmShown: () => void;
};

/**
 * Returns a `check()` to call when the app has reason to think a credential may
 * have landed — on the Trophy Case, and on the Dashboard after a submit.
 *
 * Resolves to the celebration to show, or null. It never throws: a read that
 * fails simply means we do not know yet, and we will look again next time.
 */
export function useCredentialCelebration(): { check: () => Promise<CredentialCelebration | null> } {
  // One check at a time. Two screens can regain focus together, and without
  // this both would read the same "new" credential and celebrate it twice.
  const running = useRef(false);

  const check = useCallback(async (): Promise<CredentialCelebration | null> => {
    if (running.current) return null;
    running.current = true;
    try {
      const rows = await fetchMyCredentials();
      const ids = rows.map((r) => r.id);
      const certificates = rows.filter((r) => r.type === 'certificate').length;
      const programs = rows.filter((r) => r.type === 'program').length;

      const known = await readKnown();
      if (!known) {
        // First run on this device — record what is already held, say nothing.
        await writeKnown({ ids, certificates, programs });
        return null;
      }

      const knownIds = new Set(known.ids);
      const fresh = rows.filter((r) => !knownIds.has(r.id));
      if (fresh.length === 0) return null;

      const event = credentialCelebration({
        certificates: fresh.filter((r) => r.type === 'certificate').length,
        programs: fresh.filter((r) => r.type === 'program').length,
        priorCertificates: known.certificates,
        priorPrograms: known.programs,
      });
      if (!event) return null;

      // The catalog's credential titles ARE the credential's name, so an empty
      // values map would render a blank headline. Name the first fresh one of
      // the matching kind.
      const firstCert = fresh.find((r) => r.type === 'certificate');
      const firstProg = fresh.find((r) => r.type === 'program');
      return {
        event,
        values: {
          ...event.values,
          certificate_name: firstCert?.name ?? 'Your certificate',
          program_name: firstProg?.name ?? 'Your program',
        },
        // Recorded on SHOW, not on discovery — and recorded as the screen is
        // presented rather than when it is dismissed, so a dismissal or an app
        // kill mid-celebration still cannot bring it back every launch.
        confirmShown: () => {
          void writeKnown({ ids, certificates, programs });
        },
      };
    } catch {
      // A failed read is not "no credentials" — it is "we do not know yet".
      return null;
    } finally {
      running.current = false;
    }
  }, []);

  return { check };
}

/** Test seam: forget what this device has celebrated. */
export async function __resetCredentialCelebrationsForTests(): Promise<void> {
  try {
    await AsyncStorage.removeItem(KNOWN_KEY);
  } catch {
    /* ignore */
  }
}
