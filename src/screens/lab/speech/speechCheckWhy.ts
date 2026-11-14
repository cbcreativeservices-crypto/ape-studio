/**
 * Speech & Voice Lab — one reason per WRONG option of its own checks
 * (lab fix round 2026-11-14, phase 2; the shared check card's rule,
 * SHARED_API S2 §1). The questions live in features/speech/speechModel.ts
 * (SPEECH_CHECKS); this file keys each reason by the check id and the
 * option's EXACT text, so a shuffle never moves a reason to the wrong
 * option. A first miss shows the reason; the explanation follows from the
 * second miss on (tuning/components/checkFeedback.ts). A reason never states
 * the right answer: it says why that option is not it, or where to look.
 */
export const SPEECH_CHECK_WHY: Readonly<Record<string, Readonly<Record<string, string>>>> = {
  'nasal-family': {
    'They are whispered rather than voiced': 'Hum an M with a finger on your throat: you feel the buzz, so it is voiced. Look at the way the sound leaves.',
    'The tongue blocks the throat so only the lowest harmonics escape': 'For M the lips close, not the throat, and the buzz still gets out. On The Speech System, which way can it go?',
    'The vocal folds vibrate more slowly for nasal sounds': 'The folds set the pitch, but these highs are lost after the buzz is made. Look at the path the sound takes.',
  },
  'distance-6in': {
    'Both rise by about 6 dB, so the balance is unchanged': 'The room sound reaches the mic from every side at much the same level. Does moving closer change that?',
    'The room rises more than the voice, because reflections add up': 'Reflections do not grow when you lean in. Watch the Room bar on The Distance Effect from 12" to 6".',
    'Nothing changes until you raise the gain': 'Distance changes the level before any gain knob does. Watch the Direct voice bar on The Distance Effect at 12" and 6".',
  },
  voicing: {
    'Z is louder because the breath pushes harder': 'Say S and Z at the same loudness and they still differ. Put a finger on your throat while you say each one.',
    'Z moves the tongue further back toward the soft palate': 'The question says the tongue and lips do not change. Feel your throat as you say S, then Z.',
    'Z rounds the lips slightly to lower the hiss': 'The lips stay the same for both. Put a finger on your throat and say each one.',
  },
  vowel: {
    'The pitch — AH is always sung on a lower note than EE': 'Both singers hold the same note, so pitch cannot be the difference. Look at Vowels & Formants.',
    'The loudness — open vowels like AH carry more energy': 'Sing AH and EE at the same level and they still differ. On Vowels & Formants, which bars move?',
    'The length — AH is held longer than EE': 'A short AH is still AH. Look at what changes on the chart in Vowels & Formants.',
  },
  popfilter: {
    'The mesh blocks low frequencies and passes the highs': 'A pop filter is not an EQ: the voice’s lows still get through. On Why Pop Filters Work, what does the mesh stop?',
    'The mesh absorbs the loudest part of every consonant': 'An S or a T passes the mesh just as before. Look at what a P has that they do not.',
    'The mesh adds distance, so the inverse-square law tames the P': 'A few more inches would lower the whole voice, not only the P. Watch the puff on Why Pop Filters Work.',
  },
  velum: {
    'The tongue, by rising against the hard palate to block the mouth': 'The tongue shapes sounds inside the mouth, but it cannot open or close the way into the nose. Look at The Speech System.',
    'The epiglottis, by folding down over the top of the windpipe': 'The epiglottis covers the windpipe when you swallow; it has no job in speech. Look at The Speech System.',
    'The jaw, by closing far enough to force the air upward': 'The jaw opens and closes the mouth; it does not steer air into the nose. Look at The Speech System.',
  },
  sibilance: {
    'It captures the pitch of the S more accurately': 'An S has no pitch to capture: it is a hiss. Look at where its energy sits on Why Sibilance Exists.',
    'Condensers respond faster, so every S starts more sharply': 'Speed changes the edge of a sound, not how much hiss there is. Compare where an S lives with what the mic lifts.',
    'Its proximity effect boosts the S at close range': 'Proximity effect works on the lows, and an S lives far up the spectrum. Look at Why Sibilance Exists.',
  },
  voices: {
    'It is certainly a female voice, since 200 Hz is above the male band': 'On Voices Differ, check where the male and female bands end. Do they stop at a clean line?',
    'It must be a child, because adult voices stay below 200 Hz': 'On Voices Differ, check whether the adult bands really stop below 200 Hz.',
    'Its formants must also sit near 200 Hz, one per harmonic': 'Formants are set by the mouth and throat, not by the pitch. Look at the formant bars on Voices Differ.',
  },
  proximity: {
    'The inverse-square law boosts bass more than treble as you get closer': 'Inverse-square changes level, not tone: every frequency rises together. Something else lifts the lows up close.',
    'The room’s low-frequency modes are stronger near the mouth': 'The mic moved; the room did not. Watch the bars on The Distance Effect as you go from 6" to 1".',
    'Plosive air blasts are now feeding the capsule continuously': 'The boom stays on words with no P or B. Watch the bars on The Distance Effect as you go from 6" to 1".',
  },
};

/** The `wrong` array UnderstandingCheck takes, in the order of `options`. */
export function speechWrongFor(id: string, options: readonly string[], correct: number): (string | undefined)[] | undefined {
  const map = SPEECH_CHECK_WHY[id];
  if (!map) return undefined;
  return options.map((o, i) => (i === correct ? undefined : map[o]));
}
