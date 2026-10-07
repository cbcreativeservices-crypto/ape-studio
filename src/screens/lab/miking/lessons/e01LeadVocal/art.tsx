/**
 * E01 LEAD VOCAL — the look (charter §2 layer 3), drawn only from the shared
 * voice family (lessons/shared/voice): the standing singer in profile and
 * from above, the headphones in the studio; MEET IT's voice pages and the
 * "before any mic" step.
 */
import type { LessonArt } from '../../engine/scene/sceneTypes.ts';
import { makeVoiceInstrument, voiceFigureAt, voiceHitTest, voiceLabelObstacles, voiceLabels, type VoiceArtOpts } from '../shared/voice/VoiceArt';
import { VOICE_HEARING, makeVoiceSetting, makeVoiceSound } from '../shared/voice/VoicePages';
import { E01_ZONES } from './model.ts';

const OPTS: VoiceArtOpts = { phones: ['studio'] };

export const E01_ART: LessonArt = {
  Instrument: makeVoiceInstrument(OPTS),
  labels: (view, variant) => voiceLabels(view, variant, OPTS),
  hitTest: (view, variant, u, v, tol) => voiceHitTest(view, variant, u, v, tol, OPTS),
  figureAt: voiceFigureAt,
  labelObstacles: voiceLabelObstacles(E01_ZONES),
  labelsYieldToMic: true,
  pages: {
    sound: makeVoiceSound({
      where: ['THE LUNGS', 'THE THROAT', 'THROAT · MOUTH', 'THE MOUTH'],
      air: {
        vowel: { title: 'A vowel: sound only', text: 'An open “ah” sends sound out of the mouth and round the front of the singer — no jet of air worth the name. The voice’s highs favour the front.' },
        plosive: { title: 'P or B: a puff of air', text: 'The lips hold the air and let it go at once: a puff shoots straight out along the mouth’s axis. A capsule in its path hears a thump — a pop.' },
        sibilant: { title: 'S or T: a narrow hiss', text: 'Air forced past the tongue and the teeth makes a narrow, bright hiss, straight ahead. A mic dead on the axis hears the most of it.' },
      },
      highs: 'The voice’s highest frequencies are very directional: they go out ahead of the mouth, while the lows spread round the head. So a mic off to the side, or on the cheek, hears a duller voice than one in front — the shape of that spread is not drawn here, only its direction.',
      silentNote: 'This lab never plays a sound and draws no frequency curve for the voice: how a real voice sounds depends on the singer, the song, the mic and the room. The pictures show where the sound comes from and where it goes.',
      reveal: 'The folds make the raw buzz, the throat and the mouth shape it, and it leaves through the mouth — so every distance is read from the lips.',
    }),
    setting: makeVoiceSetting({ hearing: VOICE_HEARING }),
  },
  stepCounts: { sound: 3, setting: 1 },
};
