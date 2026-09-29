/**
 * labOutputOwner — "one lab owns the output" (owner 2026-09-29).
 *
 * The owner's rule: "Only stop when closed, keep playing when switching
 * screens." A lab's sound now carries on under a pushed screen or a tab switch
 * and stops when the lab is CLOSED (useStopOnClose). That opens one wrong
 * case: lab A still sounding when lab B — Mixing → EQ Lab via OpenLabLink,
 * Bass → the Signal Generator — starts its own sound. Two labs at once is
 * never a lesson, and most labs share the ONE native generator, so lab A's
 * keepalive would also fight lab B's settings.
 *
 * So: the sound screen in FRONT owns the output. When a sound screen comes
 * into focus it claims; the screen that owned it before is told to stop, with
 * its OWN stop, so its transport, visuals and keepalive unwind exactly like a
 * ■ tap. The claim happens at FOCUS, before lab B can possibly start, so the
 * shared generator never sees lab A's stop land after lab B's start.
 *
 * Owners are SCREENS (the route key), not hook instances: several sound
 * components on one screen (a lab host with modules) share one owner and never
 * stop each other.
 *
 * Pure and dependency-free, so it is tested directly.
 */

type StopRef = { current: () => void };

let owner: string | null = null;
const entries = new Map<StopRef, string>();

/** Register a screen's stop. Returns the unregister function. */
export function registerLabSound(id: string, stop: StopRef): () => void {
  entries.set(stop, id);
  return () => {
    entries.delete(stop);
    if (owner === id && ![...entries.values()].includes(id)) owner = null;
  };
}

/** `id` comes to the front: every OTHER owner's sound stops. Idempotent. */
export function claimLabOutput(id: string): void {
  if (owner === id) return;
  const prev = owner;
  owner = id;
  if (prev == null) return;
  for (const [stop, sid] of [...entries]) {
    if (sid !== prev) continue;
    // One throwing stop must never keep the rest sounding.
    try {
      stop.current();
    } catch {
      /* already torn down */
    }
  }
}

/** True unless ANOTHER screen has claimed the output since `id` did — a lab
 *  closed after it was superseded must not stop the newer lab's shared
 *  generator. */
export function mayStopOnClose(id: string): boolean {
  return owner == null || owner === id;
}

export function currentLabOutputOwner(): string | null {
  return owner;
}

export function __resetLabOutputOwnerForTests(): void {
  owner = null;
  entries.clear();
}
