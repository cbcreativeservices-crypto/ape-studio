/**
 * B07 VOICEOVER, NARRATION AND BROADCAST GUESTS — the lesson's own pages
 * (LessonArt.pages), on the broadcast steps (shared/broadcast/
 * broadcastPages.tsx):
 *
 *   sound   → MEET IT's second half: the voice sequence; THE HEAD TURNS (the
 *             reader in the booth: LOOK down to the script, TURN; a close
 *             mic in front or a mic above the script); THE SCRIPT ANSWERS
 *             BACK (the stand's tilted face as a reflector: in front, low
 *             between mouth and script, or above it); then the checks.
 *   setting → STARTING SETUPS' tail: WHERE EACH MIC GOES (the host, an
 *             in-studio guest, a remote guest's mix-minus return, talkback,
 *             playback), then BEFORE ANY MIC.
 * FULLY SILENT; nothing loops (D8).
 */
import type { ReactNode } from 'react';
import type { SourcePageId, Vec3 } from '../../engine/model/types.ts';
import type { PageProps } from '../../pages/pageTypes';
import { aimedAtLips, makeBroadcastSetting, makeBroadcastSound, useReflectStep, useRoutingStep, useTurnStep } from '../shared/broadcast/broadcastPages';
import type { RoutingPlan } from '../shared/broadcast/routing.ts';
import { B07Scene } from './scene';
import { B07_ZONES } from './model.ts';
import { STAND_PLATE } from './geometry.ts';

type PageFn = (p: PageProps) => ReactNode;
const v3 = (x: number, y: number, z: number): Vec3 => ({ x, y, z });
const zone = (id: string) => B07_ZONES.find((z) => z.id === id)!;
const DYN = { art: 'broadcastDynamic' as const, r: 30, len: 190, pattern: 'cardioid' as const };
const LDC = { art: 'vocalLdc' as const, r: 59, len: 80, pattern: 'cardioid' as const, cross: 255 };

function useTools() {
  const turn = useTurnStep({
    mics: [aimedAtLips('close', 'The close mic in front, about 10 cm', 'CLOSE MIC', zone('b7.close').start.p, DYN), aimedAtLips('over', 'The mic above the script', 'OVER SCRIPT', zone('b7.overScript').start.p, LDC)],
    oneAtATime: true,
    top: () => <B07Scene view="top" variant="booth" headless />,
    side: () => <B07Scene view="side" variant="booth" headless />,
    boxTop: { u0: -420, u1: 720, v0: -520, v1: 520 },
    boxSide: { u0: -380, u1: 640, v0: -380, v1: 600 },
    pitch: true,
    phones: true,
    words: {
      subject: 'a reader in a booth with a mic fixed in front of the mouth',
      looking: 'From above · the reader, the script stand, a fixed mic · the side in the corner',
      prompt: 'LOOK down to the script, then TURN both ways. Switch MIC: the close mic, or the mic above the script.',
      done: 'Reading down tips the mouth’s axis away from a mic in front of it and toward the page. Raise the script, or put the mic where the reader looks, so the voice stays on the axis — move the script, not the neck.',
    },
  });
  const stand = useReflectStep({
    plate: STAND_PLATE,
    places: [
      { id: 'front', label: 'In front, level', blurb: 'On the mouth’s axis, level — between the reader and the script.', dir: v3(1, 0, 0) },
      { id: 'low', label: 'Low, toward the script', blurb: 'Down toward the script, 25° below the mouth’s line.', dir: v3(Math.cos((25 * Math.PI) / 180), Math.sin((25 * Math.PI) / 180), 0) },
      { id: 'over', label: 'Above, at eye level', blurb: 'Above the script at about eye level, 18° above the mouth’s line, aimed down at the mouth.', dir: v3(Math.cos((18 * Math.PI) / 180), -Math.sin((18 * Math.PI) / 180), 0) },
    ],
    look: DYN,
    range: { min: 60, max: 300, start: 100 },
    side: () => <B07Scene view="side" variant="booth" />,
    box: { u0: -380, u1: 720, v0: -360, v1: 860 },
    words: {
      title: 'The script answers back',
      looking: 'Side view · the reader, the script stand, the mic · white = direct, amber = off the stand',
      prompt: 'Move the mic: in front, low toward the script, above at eye level — and nearer or farther. Where does the stand’s copy reach the mic?',
      surface: 'the script stand',
      subject: 'a reader at a script stand with a mic',
      done: 'A hard stand near the mouth sends a second, later copy of the voice to a mic in front of it. Tilting the stand, keeping the mic close to the mouth, or mounting it above the script lets that copy miss the mic or arrive much weaker.',
    },
  });
  return [turn, stand];
}

const B07Sound = makeBroadcastSound({
  useTools,
  highs: 'The voice’s highest frequencies go out ahead of the mouth: a reader who looks down at the page drifts off a mic in front and sounds duller. In words only — the shape of that spread is not drawn.',
  silentNote: 'This lab never plays a sound and draws no frequency curve for a voice: how a real reader sounds depends on the voice, the mic, the script and the room. The pictures show where the sound comes from and where it goes.',
});

const PLAN: RoutingPlan = {
  sources: [
    { id: 'host', label: 'The host’s mic', short: 'HOST', kind: 'mic', level: 'mic' },
    { id: 'guest', label: 'The studio guest’s mic', short: 'GUEST', kind: 'mic', level: 'mic' },
    { id: 'remote', label: 'The remote guest', short: 'REMOTE', kind: 'remote', level: 'line' },
    { id: 'clips', label: 'Music and clips', short: 'CLIPS', kind: 'playback', level: 'line' },
    { id: 'producer', label: 'The producer’s talkback', short: 'PRODUCER', kind: 'talkback', level: 'mic' },
  ],
  dests: ['phones', 'program', 'recorder', 'remoteReturn', 'ifb', 'talkback'],
  sends: {
    host: ['phones', 'program', 'recorder', 'remoteReturn'],
    guest: ['phones', 'program', 'recorder', 'remoteReturn'],
    remote: ['phones', 'program', 'recorder'],
    clips: ['phones', 'program', 'recorder', 'remoteReturn'],
    producer: ['talkback', 'ifb'],
  },
  openMics: ['host', 'guest'],
  needs: { program: ['host', 'guest', 'remote'], recorder: ['host', 'guest', 'remote'], remoteReturn: ['host', 'guest'] },
};

const B07Setting = makeBroadcastSetting({
  useRouting: () =>
    useRoutingStep({
      plan: PLAN,
      looks: { host: { art: 'broadcastDynamic', r: 30, len: 190 }, guest: { art: 'broadcastDynamic', r: 30, len: 190 }, remote: 'laptop', clips: 'player', producer: 'talkback' },
      switches: [
        {
          id: 'ret',
          label: 'REMOTE RETURN',
          options: [
            { id: 'minus', label: 'Mix-minus', blurb: 'The remote guest hears the host, the studio guest and the clips — not their own voice.', sends: {} },
            { id: 'full', label: 'The whole program', blurb: 'The return is the whole program, the remote guest’s own voice included.', sends: { remote: ['phones', 'program', 'recorder', 'remoteReturn'] } },
          ],
        },
        {
          id: 'tb',
          label: 'TALKBACK',
          options: [
            { id: 'cue', label: 'To the talent only', blurb: 'The producer’s talkback goes to the talkback line and the earpiece.', sends: {} },
            { id: 'air', label: 'Into the program too', blurb: 'The talkback is also routed into the program.', sends: { producer: ['talkback', 'ifb', 'program'] } },
          ],
        },
      ],
      words: {
        looking: 'A signal-flow drawing · the sources, the mixer, where each one goes',
        prompt: 'TRACE the remote guest, then the producer. Try REMOTE RETURN and TALKBACK the other way, and read what goes wrong.',
        done: 'The remote guest hears the program without their own voice, the producer reaches the talent only, and every voice is in the program and the recorder: a clean plan.',
      },
      points: [
        { title: 'THE RETURN WITHOUT THEIR OWN VOICE', text: 'A remote guest needs a return that leaves out their own delayed voice (mix-minus) where the system needs it. It is a support task: it does not replace choosing and checking their mic.' },
        { title: 'THE GUEST’S REAL INPUT', text: 'A good external mic does nothing if the laptop’s own mic is the active input. Confirm the chosen input and monitor device with the guest, in their normal posture.' },
      ],
    }),
});

export const B07_PAGES: Partial<Record<SourcePageId, PageFn>> = { sound: B07Sound, setting: B07Setting };
export const B07_STEP_COUNTS: Partial<Record<SourcePageId, number>> = { sound: 4, setting: 2 };
