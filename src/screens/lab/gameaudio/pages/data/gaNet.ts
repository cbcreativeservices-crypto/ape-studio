/**
 * gaNet — what page 18 ("Multiplayer sound") needs beside the model: the
 * action ids the page hands out, and what ONE delivered action does on each
 * of the two machines. Pure TypeScript (test/gameAudioChD.test.ts).
 *
 * The model plays THIS player's machine only. The card on the page also
 * shows the other player's machine, so the learner sees that each machine
 * decides for its own listener.
 *
 * AN ACTION IS SENT, THEN IT ARRIVES (model `netFlights`, `GA_NET_DELAY_S`).
 * Nothing happens at the press: the door moves, the sound plays and the ID
 * check is read when the action lands. So the card is filled from what the
 * model says BECAME of a delivery (`netArrivalOutcome`), never from what the
 * page expected at the press. The model forgets a landed delivery after a
 * few seconds; `netMemoryAdvance` keeps the page's own record for the visit.
 *
 * `netOutcome` is the same rule as a plain function of (seen before, ID
 * check); the test proves that the two agree on the real reducer, and its
 * "there" half is the rule read from the other player's side.
 */
import { GA_NET_DELAY_S } from '../../model/gaDefs.ts';
import type { GaNetFlight, GaState } from '../../model/gaModel.ts';

export type NetSend = { id: string; what: 'door' | 'alert'; to: 'world' | 'me' | 'them' };

/** The next unused ID: A1, A2, … never one the scene has already been sent
 *  (the scene outlives the page, so the page cannot simply count from 1). */
export function nextNetId(seen: readonly string[]): string {
  let max = 0;
  for (const id of seen) {
    const m = /^A(\d+)$/.exec(id);
    if (m) max = Math.max(max, Number(m[1]));
  }
  return `A${max + 1}`;
}

/** plays = this machine plays the sound for its own listener; ignored = the
 *  ID was already handled, so the message is dropped; nothing = the message
 *  is not for this machine's player. */
export type NetEffect = 'plays' | 'ignored' | 'nothing';
export type NetOutcome = { here: NetEffect; there: NetEffect; second: boolean };

/** What one delivery does. `seenBefore` = this ID was already handled;
 *  `idCheck` = repeated IDs are ignored (as the setting stands WHEN THE
 *  ACTION ARRIVES). `second` = it was handled a second time (a double). */
export function netOutcome(send: NetSend, seenBefore: boolean, idCheck: boolean): NetOutcome {
  if (seenBefore && idCheck) return { here: 'ignored', there: 'ignored', second: false };
  return {
    here: send.to === 'them' ? 'nothing' : 'plays',
    there: send.to === 'me' ? 'nothing' : 'plays',
    second: seenBefore,
  };
}

/* ── what the model says became of a delivery ───────────────────────────── */

/** A delivery that has landed, as the model recorded it. `again` = the same
 *  ID had been sent before. `door` = which way a NEW door action moved the
 *  door (a repeat moves nothing, so it has none). */
export type NetArrival = { result: 'played' | 'ignored' | 'other'; again: boolean; door?: 'opened' | 'closed' };

/** The model's record of one landed delivery, on both machines. */
export function netArrivalOutcome(send: NetSend, a: NetArrival): NetOutcome {
  if (a.result === 'ignored') return { here: 'ignored', there: 'ignored', second: false };
  return {
    here: send.to === 'them' ? 'nothing' : 'plays',
    there: send.to === 'me' ? 'nothing' : 'plays',
    second: a.again,
  };
}

/** Was the ID check on when a REPEATED action arrived? (It ignored it, or it
 *  did not.) A new ID tells nothing about the check: null. */
export const netCheckAtArrival = (a: NetArrival): boolean | null => (a.again ? a.result === 'ignored' : null);

/** One delivery's name for the page's record. The model's flight number
 *  alone is not enough: the model forgets a landed flight after a few
 *  seconds and then counts from 1 again (seen at 390 x 844: the card showed
 *  an old A1 for a new one), so the time it was sent goes with it. */
export const netFlightKey = (f: { n: number; sent: number }): string => `${f.n}@${f.sent}`;

/** The page's record for this visit: every delivery that has landed (by
 *  `netFlightKey`), and which way each door action moved the door. */
export type NetMemory = { landed: Readonly<Record<string, NetArrival>>; door: Readonly<Record<string, 'opened' | 'closed'>> };

export const netMemoryStart = (_s?: GaState): NetMemory => ({ landed: {}, door: {} });

/** Take in whatever has landed by `next` (pages/chdKit `useWatch` calls this
 *  once per change of the scene). Returns `m` itself when nothing is new. */
export function netMemoryAdvance(m: NetMemory, _prev: GaState, next: GaState): NetMemory {
  let out = m;
  for (const f of next.netFlights ?? []) {
    const key = netFlightKey(f);
    if (f.result === 'pending' || out.landed[key]) continue;
    const arrival: NetArrival = { result: f.result, again: !!f.again, door: f.door };
    out = { landed: { ...out.landed, [key]: arrival }, door: f.door ? { ...out.door, [f.id]: f.door } : out.door };
  }
  return out;
}

/** The model's flight number of the delivery that was sent last (the page
 *  reads it straight after it dispatches a `net` action). */
export const newestFlight = (s: GaState): GaNetFlight | undefined => {
  const flights = s.netFlights ?? [];
  return flights[flights.length - 1];
};

/** How long a message travels on this page, in seconds (the model's own). */
export const NET_DELAY_S = GA_NET_DELAY_S;

/* ── the card's words ───────────────────────────────────────────────────── */

/** The action as it travels. A door action is "door" until it lands; the
 *  card then says which way the door moved (`netMessageWords`). */
export const NET_WHAT_WORD: Record<NetSend['what'], string> = { door: 'door', alert: 'alert' };
export const NET_TO_WORD: Record<NetSend['to'], string> = { world: 'for the world', me: 'for you only', them: 'for the other player only' };

/** One machine's result in words. */
export function netEffectWords(send: NetSend, effect: NetEffect, second: boolean): string {
  if (effect === 'ignored') return `Ignores it: action ${send.id} was already handled.`;
  if (effect === 'nothing') return 'Plays nothing: this alert is for the other machine’s player.';
  // a NEW door action moves the door and plays its sound; a repeat that is
  // handled a second time plays the sound again and moves nothing
  if (send.what === 'door') return second ? 'Plays the door sound a SECOND time: a double. The door does not move again.' : 'Moves the door and plays its sound, placed for its own listener.';
  return second ? 'Plays the alert cue a SECOND time: a double.' : 'Plays the alert cue.';
}

/** The message itself: "A3 · door · for the world" while it travels, and
 *  "A3 · door opened · for the world" / "… door closed …" once the model
 *  has said which way the door moved. */
export function netMessageWords(send: NetSend, door?: 'opened' | 'closed'): string {
  const what = send.what === 'door' && door ? `door ${door}` : NET_WHAT_WORD[send.what];
  return `${send.id} · ${what} · ${NET_TO_WORD[send.to]}`;
}
