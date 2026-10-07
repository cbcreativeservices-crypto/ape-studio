/**
 * E01 LEAD VOCAL — the shared pages' words (engine/model/copy.ts), built on
 * the voice family's standing-singer words (shared/voice/voiceCopy.ts) with
 * the lesson's own: the worked starting points, the studio card, the "before
 * any mic" points. Starting-points voice (owner ruling 2026-10-04): no
 * sources, brands or badges. Every number is from lead_vocal/SOURCES.md or a
 * named drawing default (CORRECTIONS_LOG E1-…).
 */
import type { LessonCopy } from '../../engine/model/copy.ts';
import { matchedPair, standingVoiceCopy } from '../shared/voice/voiceCopy.ts';

/** The two-mic page's second mic: 16 cm from the lips, 25° to the singer's
 *  right — the lesson's "compare two suitable microphones … at matched
 *  distance and level" (L85). */
export const E01_PAIR_B = matchedPair(160, 25);

export const E01_COPY: Partial<LessonCopy> = standingVoiceCopy({
  what: 'a lead vocal',
  startIntro: 'This lesson is about putting a microphone on a lead vocal — any voice, any style. First the voice itself: where it comes from and where it leaves, then real starting setups drawn on the singer, then the microphones, a worked example, and your own placements. Nothing here makes a sound: the lab is silent and shows the physics instead.',
  worked: { studio: 'lv.close', live: 'lv.stage' },
  liveZone: 'lv.stage',
  pairA: 'lv.close',
  pairB: E01_PAIR_B,
  practice: { gain: 'lv.prac.gain', second: 'lv.prac.3', mixed: ['lv.mix.1', 'lv.mix.2', 'lv.mix.3'], mixedIntro: 'Three cards from earlier pages, mixed: where the air goes, a pattern’s null, and polarity versus delay.' },
  before: [
    { title: 'START WITH THE SINGER, NOT A LABEL', text: 'Hear the actual delivery before choosing a mic: the quietest close phrase, the strongest sustained note, a line full of P, B, S and T, a breathy line and the loudest chorus. A low voice, a high voice, a belt, a whisper or a rap each ask something different — but none of it is a rule for which mic to use, and a singer’s gender is never one.' },
    { title: 'A QUIET ROOM AND A GOOD HEADPHONE MIX', text: 'In the studio: a quiet room with the strongest reflections tamed, a sturdy stand, closed-back headphones and the loudspeakers off. A singer who cannot hear a useful balance changes distance, pitch or effort in ways no mic can repair.' },
    { title: 'NOTHING IN THE SINGER’S WAY', text: 'The stand, its base and the cable stay clear of the singer’s feet and hands, and the mic and screen clear of the face as the singer moves. Never set headphones on or beside a live mic, and never blow into a mic to test it — use speech or singing.' },
  ],
  studio: {
    id: 'lv.ctx.studio',
    prompt: 'A lead vocal overdub in a quiet studio, the singer on closed-back headphones. What is the first thing to set up?',
    note: 'In the studio there is no wedge to reject: closed-back headphones and the loudspeakers off keep the track out of the mic. A screened condenser about 15 cm out is a place to begin; repeated takes are practical. Switch back to LIVE for the wedge exercise.',
  },
});
