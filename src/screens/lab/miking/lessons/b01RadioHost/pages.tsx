/**
 * B01 RADIO, PODCAST AND STUDIO HOSTS — the lesson's own pages
 * (LessonArt.pages), on the broadcast steps (shared/broadcast/
 * broadcastPages.tsx):
 *
 *   sound   → MEET IT's second half: the voice sequence; THE HEAD TURNS (a
 *             close mic and a mic at the usual start, fixed on their arms);
 *             THE DESK ANSWERS BACK (the desk's reflection: level with the
 *             mouth, low toward the desk, a little above); EVERY OPEN MIC (two
 *             hosts: who speaks, which mics are open); then the checks.
 *   setting → STARTING SETUPS' tail: WHERE EACH MIC GOES (the two hosts, a
 *             remote guest, the producer, the jingles: the guest's return
 *             and where the guest hears it), then BEFORE ANY MIC.
 * FULLY SILENT; nothing loops (D8).
 */
import type { ReactNode } from 'react';
import type { SourcePageId, Vec3 } from '../../engine/model/types.ts';
import type { PageProps } from '../../pages/pageTypes';
import { aimedAtLips, makeBroadcastSetting, makeBroadcastSound, useOpenMicStep, useReflectStep, useRoutingStep, useTurnStep } from '../shared/broadcast/broadcastPages';
import type { RoutingPlan } from '../shared/broadcast/routing.ts';
import { B01Scene } from './scene';
import { B01_ZONES } from './model.ts';
import { DESK_PLATE, HOST_B } from './geometry.ts';

type PageFn = (p: PageProps) => ReactNode;
const v3 = (x: number, y: number, z: number): Vec3 => ({ x, y, z });
const zone = (id: string) => B01_ZONES.find((z) => z.id === id)!;
const DYN_LOOK = { art: 'broadcastDynamic' as const, r: 30, len: 190, pattern: 'cardioid' as const };

/** The two arm mics at their zones' starts (frame V on the host). */
const MIC_START = zone('b1.dyn').start.p;
const MIC_CLOSE = zone('b1.close').start.p;
const MIC_B = zone('b1.hostB').start;

function useTools(): ReturnType<typeof useTurnStep>[] {
  const turn = useTurnStep({
    mics: [aimedAtLips('start', 'The mic at about 12 cm', '12 cm MIC', MIC_START, DYN_LOOK), aimedAtLips('close', 'A close mic at about 6 cm', '6 cm MIC', MIC_CLOSE, DYN_LOOK)],
    oneAtATime: true,
    top: () => <B01Scene view="top" variant="studio" headless />,
    side: () => <B01Scene view="side" variant="studio" headless />,
    boxTop: { u0: -460, u1: 760, v0: -560, v1: 560 },
    boxSide: { u0: -420, u1: 700, v0: -380, v1: 560 },
    pitch: true,
    phones: true,
    words: {
      subject: 'a host at a desk with two mics fixed in front of the mouth',
      looking: 'From above · the host, two mics fixed on their arms · the side in the corner',
      prompt: 'TURN the host’s head both ways, then LOOK down at the script. Which mic’s level changes more?',
      done: 'The mics stay where their arms hold them; the mouth moves. The closer the mic, the bigger the change for the same turn — so a close mic asks for a steady host, and reading down takes the voice off the axis. Move the mic or the script, not the host’s neck.',
    },
  });
  const desk = useReflectStep({
    plate: DESK_PLATE,
    places: [
      { id: 'level', label: 'Level with the mouth', blurb: 'On the mouth’s axis, level — the usual start.', dir: v3(1, 0, 0) },
      { id: 'low', label: 'Low, toward the desk', blurb: 'Down toward the desk top, 30° below the mouth’s line.', dir: v3(Math.cos(Math.PI / 6), Math.sin(Math.PI / 6), 0) },
      { id: 'above', label: 'A little above', blurb: 'A little above the mouth’s line, 15°, angled down at the mouth.', dir: v3(Math.cos(Math.PI / 12), -Math.sin(Math.PI / 12), 0) },
    ],
    look: DYN_LOOK,
    range: { min: 60, max: 300, start: 125 },
    side: () => <B01Scene view="side" variant="studio" />,
    box: { u0: -380, u1: 760, v0: -330, v1: 980 },
    words: {
      title: 'The desk answers back',
      looking: 'Side view · the host, the desk, the mic · white = direct, amber = off the desk',
      prompt: 'Move the mic: level, low toward the desk, a little above — and nearer or farther. Watch the bounce and where the first dip falls.',
      surface: 'the desk',
      subject: 'a host at a desk with a mic in front of the mouth',
      done: 'The nearer the mic is to the mouth — and the farther from the desk — the later and weaker the desk’s copy: it matters less. A mic low over a hard desk hears the bounce strongly. Lift the capsule away from the desk where you can; a soft cloth on the desk is another idea to try.',
    },
  });
  const mics = useOpenMicStep({
    talkers: [
      { id: 'A', label: 'The host', mouth: v3(0, 0, 0) },
      { id: 'B', label: 'Second host', mouth: HOST_B.lip },
    ],
    mics: [
      { id: 'mA', label: 'The host’s mic', short: 'HOST MIC', owner: 'A', pose: zone('b1.dyn').start, pattern: 'cardioid', open: true, look: { art: 'broadcastDynamic', r: 30, len: 190 } },
      { id: 'mB', label: 'The second host’s mic', short: 'HOST 2 MIC', owner: 'B', pose: MIC_B, pattern: 'cardioid', open: true, look: { art: 'broadcastDynamic', r: 30, len: 190 } },
    ],
    presets: [
      { id: 'both', label: 'Both mics open', blurb: 'Both hosts can speak at any moment: both mics open.', open: ['mA', 'mB'] },
      { id: 'A', label: 'Only the host’s mic', blurb: 'The second host is not speaking: their mic muted.', open: ['mA'] },
      { id: 'B', label: 'Only the second host’s', blurb: 'The host is not speaking: their mic muted.', open: ['mB'] },
    ],
    top: () => <B01Scene view="top" variant="twoHosts" />,
    box: { u0: -420, u1: 1920, v0: -720, v1: 720 },
    words: {
      subject: 'two hosts across a desk, each with a mic',
      looking: 'From above · two hosts, a mic each · rays from the one speaking',
      prompt: 'Choose WHO SPEAKS, then which mics are OPEN. Read how much of each voice reaches the other mic, and what the second copy does.',
      done: 'Each voice also reaches the other host’s mic — farther away and off the back of its pattern, so lower, but later. With both mics open the mix hears that voice twice and some pitches cancel. Close mics, rears toward each other, and muting a mic nobody is using keep it small; no rule makes it zero.',
    },
  });
  return [turn, desk, mics];
}

const B01Sound = makeBroadcastSound({
  useTools: () => useTools(),
  highs: 'The voice’s highest frequencies go out ahead of the mouth: a host who turns away or reads down drifts off the mic’s axis and sounds duller. In words only — the shape of that spread is not drawn.',
  silentNote: 'This lab never plays a sound and draws no frequency curve for a voice: how a real host sounds depends on the voice, the mic, the desk and the room. The pictures show where the sound comes from and where it goes.',
});

/** The studio's routing: two hosts, a remote guest, jingles, the producer. */
const PLAN: RoutingPlan = {
  sources: [
    { id: 'hostA', label: 'The host’s mic', short: 'HOST', kind: 'mic', level: 'mic' },
    { id: 'hostB', label: 'The second host’s mic', short: 'HOST 2', kind: 'mic', level: 'mic' },
    { id: 'remote', label: 'The remote guest', short: 'GUEST', kind: 'remote', level: 'line' },
    { id: 'jingles', label: 'Jingles and clips', short: 'CLIPS', kind: 'playback', level: 'line' },
    { id: 'producer', label: 'The producer’s talkback', short: 'PRODUCER', kind: 'talkback', level: 'mic' },
  ],
  dests: ['phones', 'monitor', 'stream', 'recorder', 'remoteReturn', 'talkback'],
  sends: {
    hostA: ['phones', 'stream', 'recorder', 'remoteReturn'],
    hostB: ['phones', 'stream', 'recorder', 'remoteReturn'],
    remote: ['phones', 'stream', 'recorder'],
    jingles: ['phones', 'stream', 'recorder', 'remoteReturn'],
    producer: ['talkback'],
  },
  openMics: ['hostA', 'hostB'],
  needs: { stream: ['hostA', 'hostB', 'remote'], recorder: ['hostA', 'hostB', 'remote'] },
};

const B01Setting = makeBroadcastSetting({
  useRouting: () =>
    useRoutingStep({
      plan: PLAN,
      looks: { hostA: { art: 'broadcastDynamic', r: 30, len: 190 }, hostB: { art: 'broadcastDynamic', r: 30, len: 190 }, remote: 'laptop', jingles: 'player', producer: 'talkback' },
      switches: [
        {
          id: 'hears',
          label: 'GUEST HEARD',
          options: [
            { id: 'phones', label: 'On headphones', blurb: 'The hosts hear the remote guest on their headphones.', sends: { remote: ['phones', 'stream', 'recorder'] } },
            { id: 'speaker', label: 'On a loudspeaker', blurb: 'The remote guest plays on a loudspeaker in the studio.', sends: { remote: ['monitor', 'stream', 'recorder'] } },
          ],
        },
        {
          id: 'ret',
          label: 'GUEST RETURN',
          options: [
            { id: 'minus', label: 'Mix-minus', blurb: 'The guest hears the hosts and the clips — not their own voice.', sends: {} },
            { id: 'full', label: 'The whole program', blurb: 'The guest’s return is the whole program, their own voice included.', sends: { remote: ['phones', 'stream', 'recorder', 'remoteReturn'] } },
          ],
        },
      ],
      words: {
        looking: 'A signal-flow drawing · the sources, the mixer, where each one goes',
        prompt: 'TRACE each source. Then try GUEST HEARD and GUEST RETURN the other way, and read what goes wrong.',
        done: 'Each host on their own channel to the stream and the recorder, the guest heard on headphones, the guest’s return without their own voice, the producer on talkback only: a clean plan.',
      },
      points: [
        { title: 'DIFFERENT DESTINATIONS', text: 'A remote guest’s return, the producer’s talkback, the headphones, the stream and the recorder are different destinations. Label and check each route before the show.' },
        { title: 'HEADPHONES, NOT A LOUDSPEAKER', text: 'Hear the program on headphones: a loudspeaker near an open mic sends it back into the mic. On a live show the PA is placed by its design, and unused mics stay closed.' },
      ],
    }),
});

export const B01_PAGES: Partial<Record<SourcePageId, PageFn>> = { sound: B01Sound, setting: B01Setting };
/** MEET IT's sound part: the sequence, three tools, the checks; STARTING
 *  SETUPS' tail: routing + before any mic. */
export const B01_STEP_COUNTS: Partial<Record<SourcePageId, number>> = { sound: 5, setting: 2 };
