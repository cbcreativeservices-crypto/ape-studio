/**
 * E03 RAP AND RHYTHMIC VOCAL — the shared pages' words, on the voice
 * family's standing-singer words (shared/voice/voiceCopy.ts) with the
 * lesson's own. Starting-points voice (owner ruling 2026-10-04).
 */
import type { LessonCopy } from '../../engine/model/copy.ts';
import { matchedPair, standingVoiceCopy } from '../shared/voice/voiceCopy.ts';

/** The two-mic page's second mic: a matched 11 cm, 25° to the rapper's right
 *  (the lesson's "compare a close dynamic … at matched level", L79). */
export const E03_PAIR_B = matchedPair(110, 25);

export const E03_COPY: Partial<LessonCopy> = standingVoiceCopy({
  what: 'a rap vocal',
  startIntro: 'This lesson is about putting a microphone on a rap or rhythmic vocal — fast consonants, sudden peaks, a performer who moves. First the voice itself: where it comes from and what leaves the lips with it, then real starting setups drawn on the performer, then the microphones, a worked example, and your own placements. Nothing here makes a sound: the lab is silent and shows the physics instead.',
  worked: { studio: 'rp.close', live: 'rp.stage' },
  liveZone: 'rp.stage',
  pairA: 'rp.close',
  pairB: E03_PAIR_B,
  practice: { gain: 'rp.prac.gain', second: 'rp.prac.3', mixed: ['rp.mix.1', 'rp.mix.2', 'rp.mix.3'], mixedIntro: 'Three cards from earlier pages, mixed: the working zone, a pattern’s null, and polarity versus delay.' },
  variantNotes: {
    studio: 'IN THE STUDIO: closed-back headphones on, the loudspeakers off — and a WORKING ZONE (dashed) for the head’s movement, agreed with the rapper and rehearsed. Switch WHERE to see the stage.',
    live: 'ON STAGE: a handheld, a floor wedge in front of the performer, the beat loud through the PA. Switch WHERE to see the studio.',
  },
  before: [
    { title: 'HEAR THE REAL DELIVERY FIRST', text: 'Ask for the actual verse, the loudest ad-lib, the quietest internal rhyme, the words full of P, B, T, K and S, and any shouted hook. Watch the head, the hands and the stance — and whether the artist works a handheld or a stand mic. Rap is not one sound: a low, conversational flow and a shouted hook ask different things.' },
    { title: 'A WORKING ZONE, NOT A CHASE', text: 'Do not chase every syllable with a moving mic. Agree a working zone with the performer and rehearse the loudest and quietest lines inside it; a mark on the floor helps.' },
    { title: 'HEADPHONES, AIR AND THE CAPSULE', text: 'Closed-back headphones, the loudspeakers off, a mix clear enough to hear the consonants and the beat without turning it up dangerously. Protect the capsule from breath and moisture with a screen or a windscreen, and never blow into a mic to test it.' },
  ],
  studio: {
    id: 'rp.ctx.studio',
    prompt: 'A dry, close rap verse over a dense beat, in a controlled studio. What is a fair first choice?',
    note: 'In a controlled room, a close dynamic at a steady distance gives a dry, focused verse; a condenser at 20–30 cm opens the consonants. Repeated takes are practical. Switch back to LIVE for the wedge exercise.',
  },
  contextPoints: [
    { title: 'PERSPECTIVE', text: 'Studio: a close dynamic for a dry verse, or a condenser at 20–30 cm behind a screen for open consonants. Live: a handheld within about 10 cm, closer for quiet lines, farther for shouts.' },
    { title: 'SPILL AND FEEDBACK', text: 'Studio: the headphone mix and the room. Live: the wedge, the PA and the beat. Put the wedge where the pattern rejects most — and never cover the grille.' },
    { title: 'MOVEMENT', text: 'A performer who moves changes the level and the low end with every lean. A working zone in the studio; on stage, distance technique — or a headset that moves with the head.' },
    { title: 'THE LOUDEST AD-LIB', text: 'Set gain from the loudest real performance, ad-libs and doubles included: backing away for the loudest line is often more musical than pulling the gain down mid-take.' },
  ],
});
