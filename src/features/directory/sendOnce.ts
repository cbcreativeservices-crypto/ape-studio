/**
 * ONE COMPOSED MESSAGE = ONE MESSAGE (toddler hunt 2026-10-14, #11 — client half).
 *
 * On a slow connection SEND can time out at the client while the server has
 * already stored the message. The box still holds the text, the person taps
 * SEND again, and the other member gets it twice.
 *
 * Pure and import-free so the node tests can load it.
 *
 * What the client does now:
 *  • A composed message gets ONE client id, minted on its first SEND and
 *    reused on every retry of the same text (a changed text is a new message).
 *  • A retry first re-reads the conversation. If a message of mine with the
 *    same text appeared that was NOT there before the first attempt, the first
 *    attempt landed — the retry is answered as sent and nothing is sent again.
 *
 * What it cannot do alone: the RPC `contact_message_send(p_request_id, p_body)`
 * takes no client id, so the id stays on the device. Sending an extra named
 * argument to an RPC that does not declare it makes PostgREST refuse the call
 * (no matching function), which would break messaging on the live server.
 *
 * The server half is item #11 of Downloads/2026-10-14_COMP_A_TODDLER_SERVER_FIXES.md
 * (after store approval): a 3-argument
 *   contact_message_send(p_request_id uuid, p_body text, p_client_msg_id uuid)
 * beside the untouched 2-argument one, and contact_messages.client_msg_id,
 * unique per (sender_user, client_msg_id); a repeat answers success, adds nothing.
 * Once that is live, sendThreadMessage passes `pending.clientId` as p_client_msg_id.
 */

export type PendingSend = {
  /** Minted once per composed message; reused on every retry of it. */
  clientId: string;
  /** The trimmed text that was sent. */
  body: string;
  /** Message ids on screen before the FIRST attempt — null when the
   *  conversation had not loaded, so nothing can be proved and a retry sends. */
  knownIds: ReadonlySet<string> | null;
};

/** The pending send for this press: the same one when this is a retry of the
 *  same text, otherwise a new one (new id, fresh snapshot). */
export function pendingFor(
  prev: PendingSend | undefined,
  body: string,
  knownIds: ReadonlySet<string> | null,
  mintId: () => string,
): { pending: PendingSend; retry: boolean } {
  if (prev && prev.body === body) return { pending: prev, retry: true };
  return { pending: { clientId: mintId(), body, knownIds }, retry: false };
}

/** Did an earlier attempt of this message already land? Only provable against
 *  a snapshot taken before that attempt. */
export function landedAlready(
  p: PendingSend,
  rows: readonly { id: string; mine: boolean; body: string }[],
): boolean {
  const known = p.knownIds;
  if (!known) return false;
  return rows.some((m) => m.mine && !known.has(m.id) && m.body.trim() === p.body);
}
