/**
 * E07 SINGER WITH GUITAR OR PIANO — the look (charter §2 layer 3), drawn
 * only from the families it is built on: the guitar family's seated player
 * and steel-string guitar (shared/guitars/GuitarArt — the head drawn as part
 * of the figure) and the piano lesson's grand and pianist (c11Piano/art —
 * the shared figure too), with the singer's MOUTH named on each. MEET IT's
 * voice pages with a step on the instrument's own sound; the "mic, pickup or
 * line" and "before any mic" steps.
 */
import type { ArtLabel, LessonArt } from '../../engine/scene/sceneTypes.ts';
import type { VariantId, ViewId } from '../../engine/model/types.ts';
import { Card, Note, Point } from '../../engine/kit';
import type { MikingStep } from '../../engine/steps';
import { makeGuitarArt } from '../shared/guitars/GuitarArt';
import { PianoArt, pianoHitTest, pianoLabels } from '../c11Piano/art';
import { VOICE_HEARING, makeVoiceSetting, makeVoiceSound } from '../shared/voice/VoicePages';
import { voiceLabelObstacles } from '../shared/voice/VoiceArt';
import { IDS_G, IDS_P, V_GUITAR, V_PIANO } from './geometry.ts';
import { E07_GUITAR, E07_GUITAR_ZONES, E07_ZONES } from './model.ts';

const G = makeGuitarArt(E07_GUITAR, { zones: E07_GUITAR_ZONES });
const piano = (v: VariantId) => v === 'piano';
const vOf = (view: ViewId, p: { y: number; z: number }) => (view === 'side' ? p.y : p.z);

/** The singer's mouth on each host: its label, set clear on a leader. */
function mouthLabel(view: ViewId, variant: VariantId): ArtLabel {
  const V = piano(variant) ? V_PIANO : V_GUITAR;
  const u = V.lip.x;
  const v = vOf(view, V.lip);
  const id = piano(variant) ? IDS_P.mouth : IDS_G.mouth;
  if (piano(variant)) return { id, text: 'MOUTH', u: u + 60, v: v - 160, align: 'left', at: { u: u + 6, v }, alts: [{ u: u - 60, v: v - 170, align: 'right' }] };
  return view === 'side'
    ? { id, text: 'MOUTH', u: u - 170, v: v - 60, align: 'right', at: { u, v: v + 4 }, alts: [{ u: u + 170, v: v - 70, align: 'left' }] }
    : { id, text: 'MOUTH', u: u - 190, v: v + 40, align: 'right', at: { u, v: v + 6 }, alts: [{ u: u + 190, v: v + 60, align: 'left' }] };
}

function mouthHit(view: ViewId, variant: VariantId, u: number, vv: number, tol: number): string | null {
  const V = piano(variant) ? V_PIANO : V_GUITAR;
  return Math.hypot(u - V.lip.x, vv - vOf(view, V.lip)) <= 16 + tol ? (piano(variant) ? IDS_P.mouth : IDS_G.mouth) : null;
}

const zonesObstacles = voiceLabelObstacles(E07_ZONES);

/** MEET IT's step on the instrument: where ITS sound leaves (words; the
 *  families' own pages draw it — here the point is that each mic hears both). */
function useInstrumentStep(p: { variant: VariantId }): MikingStep {
  const pn = piano(p.variant);
  return {
    key: 'both',
    title: 'Two sources, one performer',
    kind: 'LEARN',
    layout: 'read',
    body: (
      <>
        <Card>
          {pn ? (
            <>
              <Point title="THE PIANO">The hammers strike the strings; the soundboard under them moves the air — up toward the open lid, which throws it out to the curved side, and down under the piano. The keys and the action add their own noise.</Point>
              <Point title="THE VOICE ABOVE IT">The singer’s mouth is right above the keys, facing the music desk and the strings. The piano reaches the vocal mic; the voice reaches the piano mics — strongest in the treble mic, nearest the singer.</Point>
            </>
          ) : (
            <>
              <Point title="THE GUITAR">The strings drive the bridge; the top moves the air — much of the sound leaves the lower top round the bridge, the low end breathes through the sound hole, and the strings’ detail is heard near the neck.</Point>
              <Point title="THE VOICE ABOVE IT">The singer’s mouth is about 40 cm above the strings, a little behind the guitar’s top. The guitar reaches the vocal mic; the voice reaches the guitar mic — a little later and quieter.</Point>
            </>
          )}
          <Point title="EVERY MIC HEARS BOTH">Two sources this close are never fully separated. Which way each mic’s least-sensitive side points decides how much of the other source it takes — and the two mics, summed, need a mono check.</Point>
        </Card>
        <Note>Switch WITH on the dock of any drawing to see the other instrument.</Note>
      </>
    ),
  };
}

export const E07_ART: LessonArt = {
  Instrument: ({ view, variant }) => (piano(variant) ? <PianoArt view={view} variant="grand" /> : <G.Instrument view={view} variant="guitar" />),
  labels: (view, variant) => (piano(variant) ? [...pianoLabels(view, 'grand'), mouthLabel(view, variant)] : [...G.labels(view, 'guitar'), mouthLabel(view, variant)]),
  hitTest: (view, variant, u, v, tol) => mouthHit(view, variant, u, v, tol) ?? (piano(variant) ? pianoHitTest(view, 'grand', u, v, tol) : G.hitTest(view, 'guitar', u, v, tol)),
  figureAt: (view, variant, u, v, tol) => (piano(variant) ? false : G.figureAt!(view, 'guitar', u, v, tol)),
  labelObstacles: (view, variant, shown) => [...zonesObstacles(view, variant, shown), ...(piano(variant) ? [] : G.labelObstacles!(view, 'guitar', shown))],
  labelsYieldToMic: true,
  pages: {
    sound: makeVoiceSound({
      where: ['THE LUNGS', 'THE THROAT', 'THROAT · MOUTH', 'THE MOUTH'],
      air: {
        vowel: { title: 'A vowel: sound only', text: 'An open vowel sends sound out of the mouth and round the front of the singer — toward the vocal mic, and down toward the instrument too.' },
        plosive: { title: 'P or B: a puff of air', text: 'The lips hold the air and let it go at once: a puff shoots straight out along the mouth’s axis — at the vocal mic, not down at the instrument.' },
        sibilant: { title: 'S: a narrow hiss', text: 'Air forced past the tongue and the teeth makes a narrow hiss straight ahead. A vocal mic dead on the axis hears the most of it.' },
      },
      highs: 'The voice’s highest frequencies go out ahead of the mouth, the lows spread round the head — so an instrument mic below and in front of the singer hears a duller voice than the vocal mic does. The shape of that spread is not drawn here, only its direction.',
      silentNote: 'This lab never plays a sound and draws no frequency curve: how a real performance sounds depends on the performer, the instrument, the mics and the room. The pictures show where the sounds come from.',
      reveal: 'The folds make the raw buzz, the throat and the mouth shape it, and it leaves through the mouth — a few tens of centimetres from the instrument, so every mic hears both.',
      useExtra: useInstrumentStep,
    }),
    setting: makeVoiceSetting({
      hearing: VOICE_HEARING,
      path: {
        title: 'Mic, pickup or line',
        points: [
          { title: 'A GUITAR PICKUP OR A DI', text: 'Live, a guitar’s pickup or a DI is usually more stable against feedback than a distant guitar mic. A mic adds air, body and detail; blend only after each path works alone, and compare polarity and timing in mono. A pickup is not automatically natural, nor a mic automatically safe.' },
          { title: 'A KEYBOARD’S LINE OUT', text: 'An electronic keyboard’s line output or a DI is the most separated and repeatable path. If it plays through its own speaker, treat the speaker as a source: behind the vocal mic’s rejection where the pattern allows, at the lowest useful level.' },
          { title: 'A PIANO’S MICS', text: 'For reinforcement, a piano’s mics go close — over the strings or inside the lid — with mounts that touch nothing that moves; distant piano mics need too much gain. Open panels or a lid only with the owner’s or the venue’s agreement.' },
        ],
        note: 'Choosing a path is a mic decision: it decides how much of the other source each channel carries.',
      },
    }),
  },
  stepCounts: { sound: 4, setting: 2 },
};
