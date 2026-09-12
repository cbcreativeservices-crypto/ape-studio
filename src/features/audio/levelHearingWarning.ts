/**
 * levelHearingWarning — the hearing reminder shown before sound starts on any
 * screen where the USER can drive the output level.
 *
 * Owner 2026-09-13, on the Pixel in Foundations Module 3: "we need to add a new
 * pop up when the user can manipulate the strength of volume output … do not use
 * headphones, loud volume output can cause hearing damage. be extremely cautios
 * and carefull. keep at distance from ears." Then, on a first pass that showed it
 * once per app run: "every time user hits play on any lab with user volume
 * control."
 *
 * ⚠️ EVERY TIME IS THE RULING, AND IT IS DELIBERATE. I argued for once-per-run —
 * that a warning repeated across a long session gets dismissed unread, and a
 * notice people have learned to swat is worse than none. The owner overruled it.
 * Do NOT quietly reintroduce a "seen it" flag, a cooldown, or a per-lab
 * suppression: raising output level is the one control in this app that can hurt
 * someone, and the owner has decided it is worth the friction each time.
 *
 * Scope is "the user can make it LOUDER", not "the screen has a slider". An EQ
 * band's GAIN, a meter's input trim and a mixer channel's fader all change
 * balance inside a signal chain whose output level the user does not command —
 * warning there would spread the notice thin over screens that carry no risk and
 * teach people to swat the one that matters. See LEVEL_WARNING_SITES below.
 */
import { notify } from '../../lib/confirm';
import { LEVEL_HEARING_WARNING_BODY, LEVEL_HEARING_WARNING_TITLE } from './speakerSafety';

/**
 * Show the reminder, then start the sound from its dismissal.
 *
 * The tone starts from `onProceed` rather than beside it so the warning is READ
 * BEFORE anything sounds rather than shouted over it. `notify` routes every
 * dismissal (OK, scrim, Android BACK) through that handler, so a PLAY control
 * can never end up dead because the user tapped outside the card.
 */
export function playWithHearingWarning(onProceed: () => void): void {
  notify(LEVEL_HEARING_WARNING_TITLE, LEVEL_HEARING_WARNING_BODY, onProceed);
}
