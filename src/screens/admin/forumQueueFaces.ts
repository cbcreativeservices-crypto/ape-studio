/**
 * Small pure pieces of the owner's forum queue (ForumQueueView), kept apart so
 * node tests can run them (bug pass 1, 2026-11-08).
 */

/**
 * Which popup a write's answer belongs to. Each open is a new turn; an answer
 * lands only while the turn that sent it is still the open one, so a slow save
 * from appeal A can never close appeal B (and drop B's note) or put A's error
 * or A's PIN on B (CODE-1-15, CODE-1-26).
 */
export type PopupTurns = {
  open(): number;
  close(): void;
  /** The open turn, or null when no popup is open. */
  current(): number | null;
  isOpen(turn: number | null): boolean;
};

export function createPopupTurns(): PopupTurns {
  let last = 0;
  let open: number | null = null;
  return {
    open() {
      last += 1;
      open = last;
      return open;
    },
    close() {
      open = null;
    },
    current: () => open,
    isOpen: (turn) => turn !== null && turn === open,
  };
}

/** A refusal is a fact about the account: RETRY can never help (UI-1-14). */
export const OWNER_REFUSED_CODE = 'not_permitted';
export function offersRetry(code: string | null | undefined): boolean {
  return code !== OWNER_REFUSED_CODE;
}

/**
 * fetchTracked (src/features/forum/adminApi.ts) reads at most this many topics
 * per category. Keep the two in step: a test reads both.
 */
export const TRACKED_PER_CATEGORY = 50;

/**
 * When a category came back full, the list may not be complete. Say so, in
 * words, instead of a list that looks complete (CODE-1-26). Counted per fetch
 * (fetchTracked reads one category slug per call), never by display name,
 * which can be missing. The server does not say whether more exist, so the
 * note never claims older topics do.
 */
export function trackedCapNote(
  rows: readonly { categorySlug: string; categoryName: string }[],
  limit: number = TRACKED_PER_CATEGORY,
): string | null {
  const count = new Map<string, { n: number; name: string }>();
  for (const r of rows) {
    const c = count.get(r.categorySlug) ?? { n: 0, name: r.categoryName.trim() };
    c.n += 1;
    if (!c.name) c.name = r.categoryName.trim();
    count.set(r.categorySlug, c);
  }
  const full = [...count.values()].filter((c) => c.n >= limit);
  if (full.length === 0) return null;
  const names = full.map((c) => c.name);
  if (names.some((n) => !n)) return `Only the latest ${limit} topics in each category are listed here.`;
  const list = names.length === 1 ? names[0] : `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`;
  return `Only the latest ${limit} topics in ${list} are listed here.`;
}
