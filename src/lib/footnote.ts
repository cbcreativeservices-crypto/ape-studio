/**
 * Footnote notices (Booth 2026-07-08) — an occasional one-line reminder strip
 * rendered BELOW the bottom nav ("This topic is due this week!" etc.).
 * Infrastructure only for now: nothing sets a footnote yet — the triggering
 * rules (due dates, reminders) need a data source (backend session).
 *
 * Usage: setFootnote('This topic is due this week!') · setFootnote(null) to
 * clear · useFootnote() in the tab bar to render.
 */
import { useSyncExternalStore } from 'react';

let current: string | null = null;
const listeners = new Set<() => void>();

export function setFootnote(message: string | null): void {
  if (message === current) return;
  current = message;
  listeners.forEach((l) => l());
}

export function useFootnote(): string | null {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => current,
  );
}
