/**
 * Glossary temporary device key — the pure decision (owner 2026-09-13).
 *
 * Kept free of imports so it is testable without the React Native module graph
 * (same reason as `profileRead.ts` / `collapsedLines.ts`). The storage and
 * sign-in side lives in `deviceKey.ts`.
 */

export type ConsentRecord = { granted: true; at: number } | null;

/** What the glossary should do about the device key right now. */
export type DeviceKeyState =
  /** Entitlement hasn't resolved — decide nothing, show nothing. */
  | 'unknown'
  /** A real account, or a live key already in hand. Load the glossary. */
  | 'ready'
  /** Consent is on file but there is no key (first launch since a purge). Mint silently. */
  | 'mint'
  /** No consent on file. Raise the dialog. */
  | 'ask'
  /** They said NOT NOW this visit. Glossary closed, with a way back in. */
  | 'declined';

export function deviceKeyState(input: {
  /**
   * Has the server-side gateway been deployed? `undefined` while the probe is
   * in flight, `false` when `glossary_browse_v` does not exist yet.
   *
   * ⚠️ THIS IS THE SHIP-BEFORE-THE-SERVER SWITCH. The client has to reach
   * phones BEFORE anon SELECT on `glossary` is revoked, or the glossary dies in
   * every build already installed. Until the SQL runs there is nothing for a
   * device key to unlock, so asking for one would be a privacy prompt in
   * exchange for nothing. 'ready' means "carry on exactly as today".
   */
  gatewayDeployed: boolean | undefined;
  /** `entitlement === 'anonymous'` — a guest, by the provider's definition. */
  isGuest: boolean;
  /** The provider's first entitlement read has finished. */
  resolved: boolean;
  /** A live Supabase session exists (anonymous or not). */
  hasSession: boolean;
  /** Consent record read from storage; `undefined` while the read is in flight. */
  consent: ConsentRecord | undefined;
  /** They tapped NOT NOW during this visit. */
  declinedThisVisit: boolean;
}): DeviceKeyState {
  const { gatewayDeployed, isGuest, resolved, hasSession, consent, declinedThisVisit } = input;
  if (gatewayDeployed === undefined || !resolved || consent === undefined) return 'unknown';
  if (!gatewayDeployed) return 'ready';
  // A signed-in account is already metered by uid — nothing to ask, nothing to mint.
  if (!isGuest) return 'ready';
  // A guest WITH a session is a guest holding a key (isRealAccount keeps the
  // tier at 'anonymous' precisely so this stays true).
  if (hasSession) return 'ready';
  if (declinedThisVisit) return 'declined';
  return consent ? 'mint' : 'ask';
}

/**
 * Collapse concurrent calls into ONE in-flight call.
 *
 * ⚠️ WRITTEN AFTER MINTING TWO DEVICE KEYS 67 MICROSECONDS APART on the first
 * live run. Tapping AGREE calls the mint directly; it also writes the consent
 * record, and that re-render flips the state machine to 'mint' — which fired a
 * SECOND mint before the first had returned. Two anonymous users per consent:
 * the device keeps one and the other lingers as litter until the 7-day purge.
 *
 * The guard belongs here rather than in the screen because the screen is not
 * the only possible caller, and a ref in a component does not survive the
 * remount that a navigation or a Fast Refresh can cause mid-flight.
 *
 * The slot is cleared when the call settles, so a LATER mint (a renewal after
 * the purge) still works — it is one-at-a-time, not once-ever.
 */
export function singleFlight<T>(): (run: () => Promise<T>) => Promise<T> {
  let inFlight: Promise<T> | null = null;
  return (run) => {
    if (inFlight) return inFlight;
    const p = run();
    inFlight = p;
    const clear = () => {
      if (inFlight === p) inFlight = null;
    };
    void p.then(clear, clear);
    return p;
  };
}

/** The provider-disabled case must be distinguishable from a plain network
 *  failure, because only the first one is permanent: anonymous sign-ins are OFF
 *  by default in the Supabase dashboard and the failure is a runtime 422. */
export function classifyMintError(message: string): 'disabled' | 'network' | 'unknown' {
  const m = message.toLowerCase();
  if (m.includes('anonymous') && (m.includes('disabled') || m.includes('not enabled'))) return 'disabled';
  if (m.includes('signups not allowed')) return 'disabled';
  if (m.includes('network') || m.includes('fetch') || m.includes('timeout')) return 'network';
  return 'unknown';
}
