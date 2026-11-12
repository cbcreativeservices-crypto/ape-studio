/**
 * gaNet — what page 18 ("Multiplayer sound") needs beside the model: the
 * action ids the page hands out, and what ONE delivered action does on each
 * of the two machines. Pure TypeScript (test/gameAudioChD.test.ts).
 *
 * The model plays THIS player's machine only. The card on the page also
 * shows the other player's machine, so the learner sees that each machine
 * decides for its own listener. `netOutcome` is that picture; its "here"
 * half is checked against the reducer in the test, and its "there" half is
 * the same rule read from the other side.
 */
export type NetSend = { id: string; what: 'door' | 'alert'; to: 'world' | 'me' | 'them' };

/** The next unused id: A1, A2, … never one the scene has already handled
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
 *  id was already handled, so the message is dropped; nothing = the message
 *  is not for this machine's player. */
export type NetEffect = 'plays' | 'ignored' | 'nothing';
export type NetOutcome = { here: NetEffect; there: NetEffect; second: boolean };

/** What one delivery does. `seenBefore` = this id was already handled;
 *  `idCheck` = repeated ids are ignored. `second` = it was handled a second
 *  time (a double). */
export function netOutcome(send: NetSend, seenBefore: boolean, idCheck: boolean): NetOutcome {
  if (seenBefore && idCheck) return { here: 'ignored', there: 'ignored', second: false };
  return {
    here: send.to === 'them' ? 'nothing' : 'plays',
    there: send.to === 'me' ? 'nothing' : 'plays',
    second: seenBefore,
  };
}

export const NET_WHAT_WORD: Record<NetSend['what'], string> = { door: 'door opened', alert: 'alert' };
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

/** The message itself, as it travels: "A3 · door opened · for the world". */
export const netMessageWords = (send: NetSend): string => `${send.id} · ${NET_WHAT_WORD[send.what]} · ${NET_TO_WORD[send.to]}`;
