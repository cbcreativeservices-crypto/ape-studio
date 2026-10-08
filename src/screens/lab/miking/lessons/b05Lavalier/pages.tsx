/**
 * B05 LAVALIER, HEADSET AND CONCEALED PICKUP — the lesson's own pages
 * (LessonArt.pages), on the broadcast steps (shared/broadcast/
 * broadcastPages.tsx) and the body-worn steps (bodyWornPages.tsx):
 *
 *   sound   → MEET IT's second half: the voice sequence; CHEST OR HEAD (a
 *             lav on the sternum, a lav on the lapel and a headset as the
 *             head turns and reads down); THE LOOPS (the broadcast loop and
 *             the secondary loop against a sit, a turn and a gesture); OUT
 *             OF THE BREATH (a headset's capsule slid toward the lips); then
 *             the checks.
 *   setting → STARTING SETUPS' tail: WHERE EACH MIC GOES (the headset, the
 *             lectern, the backup lav: the PA, the stream, the recorder, the
 *             earpiece — mute one of two mics on one voice), then BEFORE ANY
 *             MIC.
 * FULLY SILENT; nothing loops (D8).
 */
import type { ReactNode } from 'react';
import type { SourcePageId } from '../../engine/model/types.ts';
import type { PageProps } from '../../pages/pageTypes';
import { makeBroadcastSetting, makeBroadcastSound, useRoutingStep } from '../shared/broadcast/broadcastPages';
import { useBodyTurnStep, useBreathStep, useCableStep } from '../shared/broadcast/bodyWornPages';
import type { RoutingPlan } from '../shared/broadcast/routing.ts';
import { B05Scene, Presenter } from './scene';
import { HEADSET, LAPEL, STERNUM } from './geometry.ts';

type PageFn = (p: PageProps) => ReactNode;

function useTools() {
  const turn = useBodyTurnStep({
    mics: [
      { id: 'sternum', label: 'The lav on the sternum', short: 'STERNUM LAV', p: STERNUM.at, rides: 'chest', art: 'lavalier', r: 3, len: 12 },
      { id: 'lapel', label: 'The lav on the lapel', short: 'LAPEL LAV', p: LAPEL.at, rides: 'chest', art: 'lavalier', r: 3, len: 12 },
      { id: 'headset', label: 'The headset', short: 'HEADSET', p: HEADSET.at, rides: 'head', art: 'gooseneck', r: 3, len: 14, headset: true },
    ],
    top: () => <Presenter view="top" headless />,
    side: () => <Presenter view="side" headless />,
    boxTop: { u0: -420, u1: 520, v0: -420, v1: 420 },
    boxSide: { u0: -380, u1: 460, v0: -330, v1: 420 },
    pitch: true,
    words: {
      subject: 'a presenter with two lavs and a headset',
      looking: 'From above · the presenter, a lav on the sternum and one on the lapel, a headset · the side in the corner',
      prompt: 'TURN the head both ways, then LOOK down. Switch MIC and read each one: which keeps its distance, and which drifts?',
      done: 'The lavs stay on the chest while the mouth swings: the voice reaches them a little farther away and well off the mouth’s axis — the lapel one more on one side than the other. The headset turns with the head and keeps its distance. A centred lav is the steadier start; a headset, the steadiest.',
    },
  });
  const cable = useCableStep({
    mount: STERNUM,
    standing: true,
    side: () => <Presenter view="side" />,
    box: { u0: -560, u1: 420, v0: -260, v1: 760 },
    words: {
      subject: 'presenter',
      done: 'With no loop, every move tugs the capsule. A small broadcast loop at the clip gives a little; a second loop taped lower down stops the pull before it reaches the clip at all. Rehearse the real moves in the real clothes.',
    },
  });
  const breath = useBreathStep({
    top: () => <Presenter view="top" headless />,
    box: { u0: -240, u1: 360, v0: -220, v1: 220 },
    home: HEADSET.at,
    words: { done: 'In front of the lips the capsule sits in the puffs of P and B; beside the corner of the mouth, where its maker puts it, the puffs go past. A headset is not a license to raise the PA — the room still reaches it.' },
  });
  return [turn, cable, breath];
}

const B05Sound = makeBroadcastSound({
  useTools: () => useTools(),
  highs: 'The voice’s highest frequencies go out ahead of the mouth: a chest mic below the chin hears a little less of them, and a capsule beside the mouth a little less than one in front. In words only — the shape of that spread is not drawn.',
  silentNote: 'This lab never plays a sound and draws no frequency curve for a voice: how a real presenter sounds depends on the voice, the mic, the clothes and the room. The pictures show where the sound comes from and where it goes.',
});

/** The live stage's routing: the headset, the lectern, a backup lav, a clip
 *  player and the producer. Who hears what — and one voice in one mic. */
const PLAN: RoutingPlan = {
  sources: [
    { id: 'headset', label: 'The presenter’s headset', short: 'HEADSET', kind: 'mic', level: 'mic', talker: 'presenter' },
    { id: 'lectern', label: 'The lectern mic', short: 'LECTERN', kind: 'mic', level: 'mic', talker: 'presenter' },
    { id: 'lav', label: 'The backup lav', short: 'BACKUP LAV', kind: 'mic', level: 'mic', talker: 'presenter' },
    { id: 'clips', label: 'Video clips', short: 'CLIPS', kind: 'playback', level: 'line' },
    { id: 'producer', label: 'The producer’s talkback', short: 'PRODUCER', kind: 'talkback', level: 'mic' },
  ],
  dests: ['pa', 'stream', 'recorder', 'ifb', 'talkback'],
  sends: {
    headset: ['pa', 'stream', 'recorder'],
    lectern: [],
    lav: ['recorder'],
    clips: ['pa', 'stream', 'recorder', 'ifb'],
    producer: ['talkback', 'ifb'],
  },
  openMics: ['headset', 'lectern', 'lav'],
  needs: { stream: ['headset'], recorder: ['headset', 'lav'] },
};

const B05Setting = makeBroadcastSetting({
  useRouting: () =>
    useRoutingStep({
      plan: PLAN,
      looks: { headset: { art: 'gooseneck', r: 9, len: 60 }, lectern: { art: 'gooseneck', r: 9.5, len: 60 }, lav: { art: 'lavalier', r: 9, len: 40 }, clips: 'player', producer: 'talkback' },
      switches: [
        {
          id: 'lectern',
          label: 'LECTERN',
          options: [
            { id: 'muted', label: 'Muted', blurb: 'The headset is live: the lectern mic is muted.', sends: { lectern: [] } },
            { id: 'open', label: 'Open too', blurb: 'The lectern mic stays open while the headset is live.', sends: { lectern: ['pa', 'stream', 'recorder'] } },
          ],
        },
        {
          id: 'lav',
          label: 'BACKUP LAV',
          options: [
            { id: 'track', label: 'Its own track', blurb: 'The backup lav goes to its own recorder track only.', sends: { lav: ['recorder'] } },
            { id: 'summed', label: 'In the stream too', blurb: 'The backup lav is summed into the stream with the headset.', sends: { lav: ['stream', 'recorder'] } },
          ],
        },
      ],
      words: {
        looking: 'A signal-flow drawing · the sources, the mixer, where each one goes',
        prompt: 'TRACE each source. Then open the LECTERN while the headset is live, and sum the BACKUP LAV into the stream — read what goes wrong.',
        done: 'The headset to the PA, the stream and the recorder; the lectern muted while the headset is live; the backup lav on its own track; the producer on talkback and in the earpiece only: one voice, one open mic in each feed.',
      },
      points: [
        { title: 'ONE VOICE, ONE OPEN MIC', text: 'A headset and a lectern mic open on the same voice hear it at two different times: the sum sounds hollow, and the PA has one more open mic to feed back through. Agree who mutes which, and when.' },
        { title: 'THE PRIMARY AND THE FALLBACK', text: 'Know which mic is on air, which is the tested fallback, and what goes to the PA, the stream, the recorder and the earpiece. Two unchecked mics are not a backup.' },
        { title: 'THE RADIO PATH', text: 'With the responsible operator: frequencies coordinated, fresh batteries, the transmitter’s input gain, and coverage checked along the whole path the presenter walks — not at one spot.' },
      ],
    }),
});

export const B05_PAGES: Partial<Record<SourcePageId, PageFn>> = { sound: B05Sound, setting: B05Setting };
/** MEET IT's sound part: the sequence, three tools, the checks; STARTING
 *  SETUPS' tail: routing + before any mic. */
export const B05_STEP_COUNTS: Partial<Record<SourcePageId, number>> = { sound: 5, setting: 2 };

export { B05Scene };
