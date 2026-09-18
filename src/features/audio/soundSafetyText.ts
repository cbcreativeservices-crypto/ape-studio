/**
 * The Sound Safety Warning, as text.
 *
 * SEPARATE FROM THE COMPONENT ON PURPOSE. This wording is the thing the user
 * agrees to, it is stored verbatim in their acknowledgment record, and it is
 * what a lawyer will read. Keeping it out of the JSX means it can be quoted,
 * diffed, displayed back in Help and written into the record from ONE source
 * that cannot drift from what was on screen.
 *
 * ⚠️ EDITING THIS: if a change alters what is being agreed to, bump
 * SOUND_SAFETY_VERSION in soundSafetyAck.ts. Every user then sees it again.
 * A typo fix does not need a bump; a changed obligation does.
 *
 * Owner's wording, 2026-09-17, kept as written apart from the three additions
 * noted inline — each of which connects the warning to a protection the app
 * already has, rather than leaving the user to believe the warning IS the
 * protection.
 */

export const SOUND_SAFETY_TITLE = 'SOUND SAFETY WARNING';

export const SOUND_SAFETY_INTRO = 'Please read this warning before enabling audio.';

export const SOUND_SAFETY_BODY = [
  'Pro Audio Training Academy can generate tones, frequency sweeps, noise, and other audio signals across a wide range of frequencies and levels. Sound may become unexpectedly loud through headphones, earbuds, device speakers, studio monitors, amplifiers, audio interfaces, or other connected equipment.',
  'Excessive sound—even for a short time—can cause pain, tinnitus, temporary hearing changes, or permanent hearing loss. High output levels may also damage speakers or connected equipment.',
] as const;

export const SOUND_SAFETY_STEPS_TITLE = 'BEFORE ENABLING SOUND:';

export const SOUND_SAFETY_STEPS = [
  'Remove headphones and earbuds, or set every output level to minimum.',
  'Reduce the volume on your device, audio interface, amplifier, speakers, and other connected equipment.',
  'Keep headphones, speakers, and devices away from your ears while testing levels.',
  'Begin at the lowest possible level and increase it slowly only when necessary.',
  'Never increase the level simply because a high or low frequency is difficult—or impossible—for you to hear.',
  'Stop immediately if you experience pain, discomfort, pressure, ringing, buzzing, dizziness, or any change in your hearing.',
] as const;

/**
 * ADDED to the owner's draft (ccode 2026-09-17, on the owner's instruction to
 * connect this to what already exists).
 *
 * The reason: a warning that only transfers responsibility teaches the user
 * that they are alone with the risk. They are not — this app already starts
 * silent, caps its own generator, tracks listening dose and can be muted by
 * shaking the phone. Saying so makes the warning MORE credible, not less, and
 * it tells them the emergency mute exists BEFORE they need it rather than in a
 * popup they will meet later.
 */
export const SOUND_SAFETY_PROTECTIONS_TITLE = 'WHAT THIS APP DOES TO HELP:';

export const SOUND_SAFETY_PROTECTIONS = [
  'Sound is off every time you open the app. Nothing plays until you turn it on deliberately.',
  'Shake the phone at any time to mute instantly.',
  'The signal generator starts well below full scale and will not exceed its own ceiling.',
  'A listening-exposure monitor tracks how long you listen and estimates your daily dose, and checks in with you as you go.',
  'Pro Audio Safety is a free topic in this app, and it covers hearing protection properly.',
] as const;

export const SOUND_SAFETY_LIMITS =
  'Pro Audio Training Academy cannot determine the actual sound level reaching your ears. Safe use depends on your device, connected equipment, settings, listening time, and environment.';

/**
 * The acknowledgment itself. This exact string is what is stored in the user's
 * record, so it must never be assembled at the call site.
 */
export const SOUND_SAFETY_ACK =
  'I have read and understand this Sound Safety Warning. I understand that excessive sound can cause permanent hearing loss or equipment damage. I agree to begin with all levels at minimum and accept responsibility for maintaining safe playback levels and equipment settings.';

export const SOUND_SAFETY_DECLINE = 'KEEP SOUND OFF';
export const SOUND_SAFETY_ACCEPT = 'I UNDERSTAND — ENABLE SOUND';

/**
 * The full warning as one string, for the acknowledgment record and for Help to
 * display back verbatim.
 *
 * Built from the same constants the screen renders, so the record can never
 * describe a screen the user did not see.
 */
export function soundSafetyFullText(): string {
  return [
    SOUND_SAFETY_TITLE,
    '',
    SOUND_SAFETY_INTRO,
    '',
    ...SOUND_SAFETY_BODY,
    '',
    SOUND_SAFETY_STEPS_TITLE,
    ...SOUND_SAFETY_STEPS.map((s) => `• ${s}`),
    '',
    SOUND_SAFETY_PROTECTIONS_TITLE,
    ...SOUND_SAFETY_PROTECTIONS.map((s) => `• ${s}`),
    '',
    SOUND_SAFETY_LIMITS,
    '',
    SOUND_SAFETY_ACK,
  ].join('\n');
}
