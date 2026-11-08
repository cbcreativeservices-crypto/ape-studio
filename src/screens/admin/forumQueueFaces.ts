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

/* ── The QUEUE tab (bug pass 2, 2026-11-08) ─────────────────────────── */

/**
 * fetchQueue (src/features/forum/adminApi.ts) reads at most this many items.
 * Keep the two in step: a test reads both.
 */
export const QUEUE_LIMIT = 100;

/**
 * The read came back full, so more may be waiting behind it. Say so, in words,
 * instead of a list that looks complete; and once that batch is cleared, never
 * "Nothing is waiting for you." (CODE-2-14). The server does not say whether
 * more exist, so the note only ever says "may".
 */
export function queueCapNote(full: boolean, shown: number, limit: number = QUEUE_LIMIT): string | null {
  if (!full) return null;
  if (shown <= 0) return `You cleared every item that was listed. The queue shows at most ${limit} at a time, so more may be waiting. Read it again to check.`;
  return `The queue shows at most ${limit} items at a time, so more may be waiting. Read it again after you clear some.`;
}

type Decision = 'dismiss' | 'confirm' | 'restore' | 'hide' | 'delete' | 'suspended' | 'banned' | 'noted';

const FLAGGED: Record<string, string> = {
  threat: 'This was flagged as a threat of violence.',
  self_harm: 'This was flagged as a self-harm risk.',
  child_safety: 'This was flagged as child safety.',
};

/**
 * The question to ask before a one-tap decision on a threat, self-harm or
 * child-safety item (UI-2-15). DISMISS, CONFIRM and RESTORE each take the item
 * off the queue with no undo here. Other items, and HIDE (which protects
 * people), keep the one tap. Null: no question, decide at once.
 */
export function queueDecisionAsk(
  decision: Decision,
  item: { urgentCategory: string | null; child: boolean; hasMember: boolean; name?: string | null },
): { title: string; body: string; yes: string; destructive: boolean } | null {
  const who = (item.name ?? '').trim();
  const thing = who ? `the item from ${who}` : 'this item';
  const kind = item.child ? 'child_safety' : item.urgentCategory;
  const flagged = kind ? FLAGGED[kind] : undefined;
  if (!flagged) return null;
  const report = item.child ? ' If the law requires a report, make it first.' : '';
  if (decision === 'dismiss') {
    return {
      title: `Dismiss ${thing}?`,
      body: `${flagged} Dismissing takes it off your queue, and the app cannot undo that.${report}`,
      yes: 'DISMISS',
      destructive: true,
    };
  }
  if (decision === 'confirm') {
    const member = item.hasMember ? ' Suspending or banning the member is a separate step, under MEMBER ›.' : '';
    return {
      title: `Confirm ${thing}?`,
      body: `${flagged} Confirming takes it off your queue, and the app cannot undo that.${member}${report}`,
      yes: 'CONFIRM',
      destructive: false,
    };
  }
  if (decision === 'restore') {
    return {
      title: who ? `Restore the post from ${who}?` : 'Restore this post?',
      body: `${flagged} Restoring puts the post back for everyone and takes it off your queue.`,
      yes: 'RESTORE',
      destructive: true,
    };
  }
  return null;
}

const DONE_WORD: Record<Decision | 'please_edit', string> = {
  dismiss: 'Dismissed',
  confirm: 'Confirmed',
  restore: 'Restored',
  hide: 'Hidden',
  delete: 'Deleted',
  suspended: 'Suspended',
  banned: 'Banned',
  noted: 'Done',
  please_edit: 'Asked the member to edit it',
};

/**
 * The short line shown after a decision the server accepted (UI-2-15). Only
 * ever built from a write's own answer, never before it.
 */
export function queueResultLine(decision: Decision | 'please_edit', name: string | null | undefined, days?: number): string {
  const word = decision === 'suspended' && days ? `Suspended for ${days} days` : DONE_WORD[decision];
  const who = (name ?? '').trim();
  return who ? `${word}. The item from ${who} has left the queue.` : `${word}. The item has left the queue.`;
}

/**
 * One decision per queue item (O-1, bug pass 2). A DISMISS then a CONFIRM
 * tapped within one frame could queue two dialogs and send a second decision
 * for an item already decided.
 *
 * An item is claimed only when its write is about to be sent: at the tap for a
 * decision with no question, inside YES for one with a question (N-1). The
 * dialog host drops a request identical to one already showing without running
 * any handler, so a claim taken before the question could never be released.
 * A write that failed, or that `run` refused, releases the claim. A write that
 * landed turns it into "landed", for good: the item never takes another
 * decision, and an older read that still lists it never shows it again (N-2).
 */
export type DecisionGuard = {
  /** True when this item is free and now claimed; false: refuse it. */
  claim(id: number): boolean;
  /** A write that did not land: the item is free again. */
  release(id: number): void;
  /** A write that landed: the item is decided. */
  land(id: number): void;
  held(id: number): boolean;
  landed(id: number): boolean;
};

export function createDecisionGuard(): DecisionGuard {
  const pending = new Set<number>();
  const decided = new Set<number>();
  return {
    claim(id) {
      if (pending.has(id) || decided.has(id)) return false;
      pending.add(id);
      return true;
    },
    release(id) {
      pending.delete(id);
    },
    land(id) {
      pending.delete(id);
      decided.add(id);
    },
    held: (id) => pending.has(id) || decided.has(id),
    landed: (id) => decided.has(id),
  };
}

/**
 * Ask (when there is a question), then claim, then send. The claim is taken in
 * YES, so a dropped or cancelled question never holds the item (N-1). `start`
 * sends the write and settles the claim (land or release).
 */
export function askThenDecide<Q>(
  guard: DecisionGuard,
  id: number,
  ask: Q | null,
  confirm: (ask: Q, yes: () => void) => void,
  start: () => void,
): void {
  const go = () => {
    if (guard.claim(id)) start();
  };
  if (ask) confirm(ask, go);
  else go();
}

/** What the list shows: never an item whose decision already landed, even when
 *  a read that started before it landed still lists it (N-2). */
export function visibleQueueItems<T extends { logId: number }>(items: readonly T[], guard: DecisionGuard): T[] {
  return items.filter((i) => !guard.landed(i.logId));
}

/* ── Two-step decisions (bug pass 3, 2026-11-08) ─────────────────────── */

type Step = () => Promise<{ ok: true } | { ok: false; error: string }>;

/**
 * PLEASE EDIT, Suspend and Ban are two writes: the member action, then taking
 * the item off the queue. When only the second failed, a repeat tap used to
 * send the member action again (a second notice, or a suspension restarted
 * from now), or was refused at step one and could never clear the item
 * (CODE-3-05). This memo remembers, per item, the LAST member action that
 * landed, so a repeat of that same choice sends only the queue step. Choosing
 * another action forgets the older one: Suspend 7, then 30, then 7 again is a
 * new 7-day action that asks YES and is sent, never a skipped retry that
 * leaves the member on 30 days (check P3, follow-up 1).
 */
export type MemberStepMemo = {
  landed(id: number, action: string): boolean;
  mark(id: number, action: string): void;
  /** The item left the queue: forget every action it had. */
  clear(id: number): void;
};

export function createMemberStepMemo(): MemberStepMemo {
  const last = new Map<number, string>();
  return {
    landed: (id, action) => last.get(id) === action,
    mark: (id, action) => {
      last.set(id, action);
    },
    clear: (id) => {
      last.delete(id);
    },
  };
}

/** `step` says which write failed: 'member' (nothing reached the member) or
 *  'queue' (the member action landed; only the queue step is left). */
export type TwoStepOutcome = { ok: true } | { ok: false; step: 'member' | 'queue'; error: string };

/** Member step (only if it has not landed yet for this item and action), then
 *  the queue step. A member step that landed is remembered even when the queue
 *  step fails, so it is never sent twice. */
export async function runTwoStep(
  memo: MemberStepMemo,
  id: number,
  action: string,
  memberStep: Step,
  queueStep: Step,
): Promise<TwoStepOutcome> {
  if (!memo.landed(id, action)) {
    const r = await memberStep();
    if (!r.ok) return { ok: false, step: 'member', error: r.error };
    memo.mark(id, action);
  }
  const d = await queueStep();
  if (!d.ok) return { ok: false, step: 'queue', error: d.error };
  memo.clear(id);
  return { ok: true };
}

/** The words when the member action landed but the item is still listed.
 *  `again` names what to tap, for example "PLEASE EDIT". */
export function memberDoneQueueFailed(again: string): { title: string; body: string } {
  return {
    title: 'Done for the member',
    body: `Clearing it from the queue failed; tap ${again} to try that again. Only the queue step is sent again while you stay on this screen.`,
  };
}
