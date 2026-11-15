/**
 * DJ Systems Lab — what a goal chip SAYS (beginner waves 2026-11-15, group F2).
 *
 * DJ-04 (owner 2026-11-15: "build waves 1 thru 3", D62 adoption plan): many
 * goals tick only while a deck is playing, so a learner who set the booth up
 * right with the deck stopped saw a plain ○ and no reason. A goal may now
 * carry `wait`: the line its chip shows while the set-up is right and only
 * PLAY is missing. Nothing new appears on screen: the chip that was already
 * there says it. What earns the tick is unchanged.
 *
 * Pure, so test/labWaves_20261115_F2 reaches it.
 */

/** The goal is set up right; a stopped deck is all that is missing. */
export const WAIT_PLAY = 'Right, now press PLAY to hear it';
/** The same, for a goal that needs both decks running. */
export const WAIT_PLAY_BOTH = 'Right, now press PLAY on both decks to hear it';
/** The same, for the turntable (its key reads ▶ START TURNTABLE). */
export const WAIT_TURNTABLE = 'Right, now press START TURNTABLE to hear it';

/** Which deck a goal waits on: one deck, both, either ('any') or the turntable. */
export type WaitDeck = 'A' | 'B' | 'both' | 'any' | 'tt';

/** The wait line for `deck`: the deck the goal needs ('both' for two). */
export function waitFor(deck: WaitDeck): string {
  if (deck === 'any') return WAIT_PLAY;
  if (deck === 'both') return WAIT_PLAY_BOTH;
  if (deck === 'tt') return WAIT_TURNTABLE;
  return `Right, now press PLAY ${deck} to hear it`;
}

/** The chip's words. A met goal shows ✓ and its label; an unmet goal shows
 *  ○ and its label, and its wait line after it when one is given. */
export function goalChipWords(label: string, latched: boolean, wait?: string | false | null): { mark: string; text: string; waiting: boolean; a11y: string } {
  const waiting = !latched && !!wait;
  return {
    mark: latched ? '✓ ' : '○ ',
    text: waiting ? `${label} · ${wait}` : label,
    waiting,
    a11y: `${label}: ${latched ? 'done' : waiting ? `not yet. ${wait}` : 'not yet'}`,
  };
}

/** `wait` only when `ok` (the set-up is right) and the deck is stopped. */
export function waitIf(ok: boolean, stopped: boolean, deck: WaitDeck): string | undefined {
  return ok && stopped ? waitFor(deck) : undefined;
}

/**
 * SH-64 (owner 2026-11-15: "build waves 1 thru 3"): a control the current
 * choice ignores is greyed out with a reason. With both channels on THRU the
 * crossfader reaches neither of them, so the X-FADER key is shown locked and
 * says why (a fader's locked line is printed as given, full stop included). Assigning either
 * channel to A or B unlocks it at once.
 */
export const XF_IGNORED = 'both channels are on THRU, so the crossfader does nothing. Open SETUP and put a channel on A or B.';
export function xfIgnoredWhy(xf1: string, xf2: string): string | undefined {
  return xf1 === 'THRU' && xf2 === 'THRU' ? XF_IGNORED : undefined;
}

/**
 * DJ-10 (owner 2026-11-15: "build waves 1 thru 3"): three faults count as
 * fixed only after a second step that the learner was told about only in the
 * last hint. Once the first half is done, the fault card says what proves it
 * (FaultCard `halfway`). What fixes a fault is unchanged.
 */
export const TEMPO_HALFWAY = 'In phase. Now bring CH2 back UP (JOG B → CH2 FADER).';
export const GRID_HALFWAY = 'Grid doubled. Now set a NEW loop: LOOP EXIT, then LOOP 4 BEATS.';
export const MIC_HALFWAY = 'Routed to the recording. Now press TALK NOW and watch the REC meter.';

/** Screen 10: B pulled out of the mix, tempos equal and back in phase, CH2
 *  still down. */
export function tempoHalfway(o: { faultOn: boolean; pulled: boolean; bpmMatch: boolean; inPhase: boolean; ch2Fader: number }): string | null {
  return o.faultOn && o.pulled && o.bpmMatch && o.inPhase && o.ch2Fader < 0.5 ? TEMPO_HALFWAY : null;
}

/** Screen 19: the mic is now sent to the recording; it still has to be heard
 *  there (a TALK after the change). */
export function micHalfway(toRec: boolean, voiceInRec: boolean): string | null {
  return toRec && !voiceInRec ? MIC_HALFWAY : null;
}

/**
 * SH-26 (owner 2026-11-15: "build waves 1 thru 3"): codes are spelled out
 * where they first appear. The PATCH tray's chips are short codes (MST·L,
 * BTH·R, PWR PA L); only the chosen chip was spelled out. The tray's head
 * now carries the key for the codes it actually shows.
 */
const PATCH_CODE_WORDS: readonly [RegExp, string][] = [
  [/^MST/, 'MST = MASTER OUT'],
  // checker fix: BTH is on BOOTH OUT (BTH·L) AND on the booth monitors' cords (PWR BTH L), so the key says "booth"
  [/BTH/, 'BTH = booth'],
  [/^PWR/, 'PWR = power cord'],
  [/^TT/, 'TT = turntable'],
];
export function patchCodeKey(shorts: readonly string[]): string | null {
  const words = PATCH_CODE_WORDS.filter(([re]) => shorts.some((s) => re.test(s))).map(([, w]) => w);
  if (shorts.some((s) => /[·\s][LR]$/.test(s))) words.push('L / R = left / right');
  return words.length ? words.join(' · ') : null;
}
