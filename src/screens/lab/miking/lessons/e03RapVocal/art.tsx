/**
 * E03 RAP AND RHYTHMIC VOCAL — the look (charter §2 layer 3), from the shared
 * voice family (lessons/shared/voice): the standing performer, the
 * headphones and the WORKING ZONE in the studio; MEET IT's voice pages with
 * the rapper's words; the "before any mic" step.
 */
import type { LessonArt } from '../../engine/scene/sceneTypes.ts';
import { makeVoiceInstrument, voiceFigureAt, voiceHitTest, voiceLabelObstacles, voiceLabels, type VoiceArtOpts } from '../shared/voice/VoiceArt';
import { VOICE_HEARING, makeVoiceSetting, makeVoiceSound } from '../shared/voice/VoicePages';
import { E03_ZONES } from './model.ts';

const OPTS: VoiceArtOpts = { phones: ['studio'], workZone: ['studio'] };

export const E03_ART: LessonArt = {
  Instrument: makeVoiceInstrument(OPTS),
  labels: (view, variant) => voiceLabels(view, variant, OPTS),
  hitTest: (view, variant, u, v, tol) => voiceHitTest(view, variant, u, v, tol, OPTS),
  figureAt: voiceFigureAt,
  labelObstacles: voiceLabelObstacles(E03_ZONES),
  labelsYieldToMic: true,
  pages: {
    sound: makeVoiceSound({
      where: ['THE LUNGS', 'THE THROAT', 'TONGUE · TEETH · LIPS', 'THE MOUTH'],
      air: {
        vowel: { title: 'A vowel: sound only', text: 'An open vowel sends sound out of the mouth and round the front of the performer — no jet of air worth the name. The voice’s highs favour the front.' },
        plosive: { title: 'P, B, T or K: puff after puff', text: 'The lips or the tongue hold the air and let it go at once: a puff shoots straight out along the mouth’s axis. A fast verse sends them one after another — pop after pop on a capsule in their path.' },
        sibilant: { title: 'S: a narrow hiss', text: 'Air forced past the tongue and the teeth makes a narrow, bright hiss straight ahead. A mic dead on the axis hears the most of it.' },
      },
      highs: 'The voice’s highest frequencies are very directional: they go out ahead of the mouth, while the lows spread round the head. Off to the side the consonants lose their edge — the shape of that spread is not drawn here, only its direction.',
      silentNote: 'This lab never plays a sound and draws no frequency curve for the voice: how a real performance sounds depends on the performer, the beat, the mic and the room. The pictures show where the sound comes from and where it goes.',
      reveal: 'The folds make the raw buzz, the tongue, the teeth and the lips chop it into words, and it leaves through the mouth — air and all — so every distance is read from the lips.',
    }),
    setting: makeVoiceSetting({ hearing: VOICE_HEARING }),
  },
  stepCounts: { sound: 3, setting: 1 },
};
