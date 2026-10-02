/**
 * sessionCarry — a guest's lab work in THIS app session is written to the
 * account they sign in to, in the same session (owner ruling 2026-10-01:
 * "if in same session guest signs in then current session is saved and
 * stored").
 *
 * ONE shared hand-off for every lab store. A store that refuses to write for
 * a guest (the house guest rule, owner 2026-08-12) HOLDS the work here
 * instead; each store registers a WRITER that merges what it held into its
 * own stored copy (credit is a union, the first recorded answer wins, notes
 * and designs are added under their caps). The ledger decides WHEN and FOR
 * WHOM — never a lab:
 *
 *   • A launch that starts signed OUT is a guest session. The FIRST real
 *     account signed into in that session receives everything held — after
 *     the account switch's device wipe has run (accountLocalSync calls
 *     `settleSessionCarry` at the end of its queue), so the wipe cannot
 *     delete it.
 *   • A signed-in learner whose membership read was slow or failed (it reads
 *     'anonymous' until it lands) is treated as a guest by the labs. The
 *     ledger KNOWS the signed-in identity, so their held work is written to
 *     that same identity straight away.
 *   • A sign-OUT (or any change of account) drops everything held, and work
 *     done after a sign-out is never carried: the next account to sign in
 *     must not receive the previous person's work. A deliberate Guest Mode
 *     start (AuthScreen) begins a fresh guest session.
 *   • PREVIEW EARNS NOTHING (owner 2026-09-01): nothing is held while a
 *     members-only preview is active.
 *   • A relaunch is a new session: the ledger lives in memory only.
 *
 * Holds are DELTAS (or a store's own session copy that started empty), never
 * a whole on-screen copy that could include work from before an identity
 * change. What was held stays held for the rest of the session (re-written
 * idempotently), so a store write that raced the hand-off with an older copy
 * can merge it back in (`peekSessionWork`).
 *
 * Pure apart from the preview read: tested directly in
 * test/sessionCarry.test.ts.
 */
import { getLabPreview } from './labPreviewStore';

/** Writes one held value into its store. Resolves true when it landed. */
export type SessionWriter<T> = (held: T) => Promise<boolean>;

/** undefined = no auth answer yet; '' = signed out (a guest); a uid = a real
 *  account; null = signed out AFTER an account this session (never carried). */
let owner: string | null | undefined = undefined;
/** The device wipe for the current owner has not finished yet: hold, but do
 *  not write. */
let syncPending = false;
/** Bumped whenever held work is DROPPED (a sign-out, an account change, a
 *  fresh Guest Mode). A store that keeps a whole session copy tags it with
 *  the epoch it was started in and holds it only while the epoch matches. */
let epoch = 0;

const held = new Map<string, unknown>();
/** Bumped per key on every hold; `written` keeps the version that landed, so
 *  a key with nothing new is not rewritten. */
const versions = new Map<string, number>();
const written = new Map<string, number>();
const writers = new Map<string, SessionWriter<unknown>>();
let flushing: Promise<void> | null = null;
let flushAgain = false;
/** Auth events noted / settles run (accountLocalSync pairs one settle with
 *  each event, queued in order). */
let noted = 0;
let settled = 0;

const isAccount = (o: string | null | undefined): o is string => typeof o === 'string' && o !== '';

/** A store's writer. Registered at module load (one per key). */
export function registerSessionCarry<T>(key: string, writer: SessionWriter<T>): void {
  writers.set(key, writer as SessionWriter<unknown>);
}

/**
 * Hold work done while the store would not write. `update` receives what is
 * already held for `key` (undefined the first time this session) and returns
 * the new held value — it must only ADD the work just done.
 *
 * `guestOnly`: the store writes for everyone (labCompletion, the Cymatics
 * tick-offs) and only needs carrying across the sign-in wipe, so it holds
 * nothing once an account is known.
 *
 * Returns true when the work was held (false: a preview, or after a sign-out
 * — the caller must not promise that signing in keeps it).
 */
export function holdSessionWork<T>(key: string, update: (prev: T | undefined) => T, opts: { guestOnly?: boolean } = {}): boolean {
  if (getLabPreview().active) return false; // PREVIEW EARNS NOTHING
  if (owner === null) return false; // signed out after an account: never carried
  // …except while that account's sign-in wipe is still pending (full run 1,
  // 2026-10-01): a unit recorded in that window is deleted by the wipe, so it
  // is held and replayed after it like a guest's.
  if (opts.guestOnly && isAccount(owner) && !syncPending) return false;
  held.set(key, update(held.get(key) as T | undefined));
  versions.set(key, (versions.get(key) ?? 0) + 1);
  if (isAccount(owner) && !syncPending) void flushSessionWork();
  return true;
}

/** A learner's own PRACTICE reset of a progress record (never credit):
 *  what was held for it is let go too, so the reset is not undone by the
 *  hand-off. */
export function dropSessionWork(key: string): void {
  held.delete(key);
  versions.delete(key);
  written.delete(key);
}

/** What is held for `key` in this session (for the current owner). */
export function peekSessionWork<T>(key: string): T | undefined {
  return held.get(key) as T | undefined;
}

/** Changes whenever held work is dropped (see `epoch`). */
export function sessionCarryEpoch(): number {
  return epoch;
}

function drop(): void {
  held.clear();
  versions.clear();
  written.clear();
  epoch++;
}

/**
 * The auth state, IN ORDER, at the moment of each event (accountLocalSync's
 * listener). `identity` = the real account's uid, or '' for no account (an
 * anonymous device-key session is '' too).
 */
export function noteSessionIdentity(identity: string): void {
  noted++;
  if (owner === undefined) {
    // The first answer of this launch: what was held before it is this
    // person's (a member's taps while the tier was still loading).
    owner = identity;
    if (isAccount(identity)) syncPending = true;
    return;
  }
  if (identity === owner) return;
  if (owner === '' && isAccount(identity)) {
    // THE CARRY: a guest session's first account. Written once the wipe that
    // this sign-in triggers has finished.
    owner = identity;
    syncPending = true;
    return;
  }
  // A sign-out, or one account replaced by another: nothing is carried.
  drop();
  owner = identity === '' ? null : identity;
  syncPending = isAccount(identity);
}

/** accountLocalSync, after the identity's device sync (wipe) finished. */
export async function settleSessionCarry(): Promise<void> {
  settled++;
  // ONLY THE LATEST EVENT'S SETTLE ends the wait (full run 1, 2026-10-01).
  // Every auth event notes its identity at once and queues exactly one settle
  // behind its own wipe, in order. When a second event (a different account)
  // arrived before the first event's settle ran, that earlier settle cleared
  // `syncPending` and wrote the new account's held work BEFORE the new
  // account's wipe — which then deleted it, and it was marked written.
  if (settled < noted) return;
  syncPending = false;
  if (isAccount(owner)) await flushSessionWork();
}

/** A deliberate Guest Mode start (AuthScreen): a fresh guest session. */
export function restartGuestSession(): void {
  drop();
  owner = '';
  syncPending = false;
}

/** Write everything held to the signed-in account. Serialized; a hold made
 *  while a flush runs is written by a second pass. */
export function flushSessionWork(): Promise<void> {
  if (!isAccount(owner) || syncPending) return Promise.resolve();
  if (flushing) {
    flushAgain = true;
    return flushing;
  }
  flushing = (async () => {
    do {
      flushAgain = false;
      const ep = epoch;
      for (const [key, value] of [...held]) {
        const version = versions.get(key) ?? 0;
        if (written.get(key) === version) continue;
        const writer = writers.get(key);
        if (!writer) continue;
        let ok = false;
        try {
          ok = await writer(value);
        } catch {
          ok = false;
        }
        // The account changed mid-write: stop this pass. NOT a return (full
        // run 1, 2026-10-01): a flush asked for meanwhile (the new account's
        // settle) only set `flushAgain` and is waiting on THIS promise, so the
        // loop below must still run it, or that account's held work is never
        // written until some later hold.
        if (ep !== epoch) break;
        if (ok) written.set(key, version);
      }
    } while (flushAgain && isAccount(owner) && !syncPending);
  })().finally(() => {
    flushing = null;
  });
  return flushing;
}

/** Tests only: a fresh launch (the stores' writers stay registered — they
 *  register once, at module load). */
export function __resetSessionCarryForTests(): void {
  held.clear();
  versions.clear();
  written.clear();
  owner = undefined;
  syncPending = false;
  epoch++; // never back to an old value: stores tag copies with it
  flushing = null;
  flushAgain = false;
  noted = 0;
  settled = 0;
}
