/**
 * B06 PANELS, PRESS CONFERENCES AND GROUPS — the lesson's own pages
 * (LessonArt.pages), on the broadcast steps (shared/broadcast/
 * broadcastPages.tsx):
 *
 *   sound   → MEET IT's second half: the voice sequence; THE HEAD TURNS (the
 *             focus panelist turns to a neighbour — the gooseneck, or the
 *             shared boundary, stays put); EVERY OPEN MIC (four panelists,
 *             four goosenecks: who speaks, how many are open — the bleed,
 *             the later copy, the open-mic cost); then the checks.
 *   setting → STARTING SETUPS' tail: WHERE EACH MIC GOES (the lectern, the
 *             panel, the audience question, a remote contributor: the PA,
 *             the stream, the recorder, the press feed box, the remote
 *             return; the reporter's input level), then BEFORE ANY MIC.
 * FULLY SILENT; nothing loops (D8).
 */
import type { ReactNode } from 'react';
import type { SourcePageId, Vec3 } from '../../engine/model/types.ts';
import type { PageProps } from '../../pages/pageTypes';
import { aimedAtLips, makeBroadcastSetting, makeBroadcastSound, useOpenMicStep, useRoutingStep, useTurnStep } from '../shared/broadcast/broadcastPages';
import { aimOf } from '../shared/ensemble/frameS.ts';
import type { RoutingPlan } from '../shared/broadcast/routing.ts';
import type { PanelMic, PanelTalker } from '../shared/broadcast/openMicPanel.ts';
import { B06Scene } from './scene';
import { B06_ZONES } from './model.ts';
import { FOCUS, P1, P3, P4 } from './geometry.ts';

type PageFn = (p: PageProps) => ReactNode;
const v3 = (x: number, y: number, z: number): Vec3 => ({ x, y, z });
const zone = (id: string) => B06_ZONES.find((z) => z.id === id)!;
const GOOSE = { art: 'gooseneck' as const, r: 9.5, len: 60, pattern: 'cardioid' as const };
const BOUND = { art: 'boundary' as const, r: 10.15, len: 139.1, pattern: 'cardioid' as const, crossTop: 95.11 };

/** The goosenecks of the four panelists: each the focus panelist's start,
 *  moved along the table to its owner (all face the audience). */
const GOOSE_P = zone('b6.goose').start.p;
const gooseAt = (dz: number): Vec3 => v3(GOOSE_P.x, GOOSE_P.y, GOOSE_P.z + dz);

function useTools() {
  const turn = useTurnStep({
    mics: [aimedAtLips('goose', 'The gooseneck, about 25 cm', 'GOOSENECK', GOOSE_P, GOOSE), { id: 'bound', label: 'The shared boundary on the table', short: 'BOUNDARY', p: zone('b6.boundary').start.p, aim: v3(-1, 0, 0), ...BOUND }],
    oneAtATime: true,
    top: () => <B06Scene view="top" variant="panel" headless />,
    side: () => <B06Scene view="side" variant="panel" headless />,
    boxTop: { u0: -460, u1: 860, v0: -520, v1: 900 },
    boxSide: { u0: -420, u1: 760, v0: -380, v1: 760 },
    pitch: true,
    words: {
      subject: 'a panelist at a table turning to a neighbour, a mic fixed in front',
      looking: 'From above · the panel, a mic fixed on the table · the side in the corner',
      prompt: 'TURN the panelist to the next one, and back; LOOK down at the notes. Switch MIC: the gooseneck, or the shared boundary.',
      done: 'Turning to a neighbour swings the mouth off a fixed mic’s axis. The gooseneck, close and below the mouth, stays fairly near; the shared boundary, farther away and low on the table, changes more with each turn — and hears the neighbour too.',
    },
  });
  const talkers: PanelTalker[] = [
    { id: 'focus', label: 'Second panelist', mouth: FOCUS.lip },
    { id: 'p1', label: 'Left panelist', mouth: P1.lip },
    { id: 'p3', label: 'Third panelist', mouth: P3.lip },
    { id: 'p4', label: 'Right panelist', mouth: P4.lip },
  ];
  const aim = aimOf(v3(-GOOSE_P.x, -GOOSE_P.y, -GOOSE_P.z));
  const mic = (id: string, label: string, owner: string, dz: number): PanelMic & { look: { art: 'gooseneck'; r: number; len: number }; short: string } => ({ id, label, short: label.toUpperCase(), owner, pose: { p: gooseAt(dz), ...aim }, pattern: 'cardioid', open: true, look: { art: 'gooseneck', r: 9.5, len: 60 } });
  const mics = useOpenMicStep({
    talkers,
    mics: [mic('m1', 'Left mic', 'p1', P1.lip.z), mic('m2', 'Second mic', 'focus', 0), mic('m3', 'Third mic', 'p3', P3.lip.z), mic('m4', 'Right mic', 'p4', P4.lip.z)],
    presets: [
      { id: 'one', label: 'Only the second panelist’s', blurb: 'Only the mic of the panelist who is speaking is open.', open: ['m2'] },
      { id: 'two', label: 'Two neighbours open', blurb: 'The second and the third panelists’ mics are open.', open: ['m2', 'm3'] },
      { id: 'all', label: 'All four open', blurb: 'Every panel mic is left open.', open: ['m1', 'm2', 'm3', 'm4'] },
    ],
    top: () => <B06Scene view="top" variant="panel" />,
    box: { u0: -460, u1: 900, v0: -1250, v1: 1900 },
    words: {
      subject: 'four panelists at a table, a gooseneck each',
      looking: 'From above · four panelists, a gooseneck each · rays from the one speaking',
      prompt: 'Choose WHO SPEAKS, then how many mics are OPEN. Read what each open mic adds — and what it costs.',
      done: 'Each extra open mic adds the speaker later and lower, more room — and live, about 3 dB less margin before feedback per doubling. Open the mic of whoever speaks; mute or lower the rest, by hand or with a configured automatic mixer, and rehearse interruptions and a soft talker after a loud one.',
    },
  });
  return [turn, mics];
}

const B06Sound = makeBroadcastSound({
  useTools,
  highs: 'The voice’s highest frequencies go out ahead of the mouth: a panelist who turns to a neighbour drifts off their own mic’s axis and toward the neighbour’s. In words only — the shape of that spread is not drawn.',
  silentNote: 'This lab never plays a sound and draws no frequency curve for a voice: how a real panel sounds depends on the voices, the mics, the table, the room and the PA. The pictures show where the sound comes from and where it goes.',
});

const PLAN: RoutingPlan = {
  sources: [
    { id: 'lectern', label: 'The lectern mic', short: 'LECTERN', kind: 'mic', level: 'mic' },
    { id: 'panel', label: 'The panel mics', short: 'PANEL', kind: 'mic', level: 'mic' },
    { id: 'question', label: 'The audience question mic', short: 'QUESTION', kind: 'mic', level: 'mic' },
    { id: 'remote', label: 'The remote contributor', short: 'REMOTE', kind: 'remote', level: 'line' },
    { id: 'room', label: 'A room ambience mic', short: 'AMBIENCE', kind: 'ambience', level: 'mic' },
  ],
  dests: ['pa', 'stream', 'recorder', 'pressBox', 'remoteReturn'],
  sends: {
    lectern: ['pa', 'stream', 'recorder', 'pressBox', 'remoteReturn'],
    panel: ['pa', 'stream', 'recorder', 'pressBox', 'remoteReturn'],
    question: ['pa'],
    remote: ['pa', 'stream', 'recorder', 'pressBox'],
    room: ['stream', 'recorder'],
  },
  openMics: ['lectern', 'panel', 'question'],
  needs: { stream: ['lectern', 'panel', 'question', 'remote'], pressBox: ['lectern', 'panel', 'question'], remoteReturn: ['lectern', 'panel', 'question'] },
};

const B06Setting = makeBroadcastSetting({
  useRouting: () =>
    useRoutingStep({
      plan: PLAN,
      looks: { lectern: { art: 'gooseneck', r: 9.5, len: 60 }, panel: { art: 'gooseneck', r: 9.5, len: 60 }, question: { art: 'vocalDynamic', r: 25, len: 162 }, remote: 'laptop', room: { art: 'sdc', r: 10.5, len: 104 } },
      switches: [
        {
          id: 'q',
          label: 'QUESTION MIC',
          options: [
            { id: 'pa', label: 'To the PA only', blurb: 'The question mic goes to the room’s PA — nowhere else.', sends: {} },
            { id: 'all', label: 'To every feed', blurb: 'The question mic goes to the PA, the stream, the recorder, the press feed and the remote return.', sends: { question: ['pa', 'stream', 'recorder', 'pressBox', 'remoteReturn'] } },
          ],
        },
        {
          id: 'amb',
          label: 'AMBIENCE MIC',
          options: [
            { id: 'feeds', label: 'Stream and recorder', blurb: 'The room ambience goes to the stream and the recording only.', sends: {} },
            { id: 'pa', label: 'Into the PA too', blurb: 'The room ambience is also sent to the PA.', sends: { room: ['stream', 'recorder', 'pa'] } },
          ],
        },
      ],
      levelCheck: {
        id: 'input',
        label: 'REPORTER IN',
        title: 'A REPORTER’S RECORDER ON THE PRESS BOX',
        out: 'mic',
        options: [
          { id: 'line', label: 'Set for line level', blurb: 'The reporter’s recorder input is set for line level.' },
          { id: 'mic', label: 'Set for mic level', blurb: 'The reporter’s recorder input is set for mic level.' },
        ],
      },
      words: {
        looking: 'A signal-flow drawing · the mics, the mixer, the PA, the stream, the press feed box',
        prompt: 'TRACE the question mic. Send it where it belongs, keep the ambience out of the PA, and set the reporter’s input to match the box’s outputs.',
        done: 'The question reaches the stream, the recording, the press and the remote contributor; the ambience stays out of the PA; the reporter’s input matches the box’s mic-level output: a clean plan.',
      },
      points: [
        { title: 'THE BOX IS A COPY OF THE MIX', text: 'A press feed box takes one line-level mix from the event mixer and gives each reporter an isolated mic-level output. It is a signal path, not another mic: it carries only what is routed into it.' },
        { title: 'CHECK THE PORT', text: 'With the event audio lead: the connector, the level, the isolation and the phantom-power policy of that exact port. No phantom power into a feed nobody has verified.' },
        { title: 'THE REMOTE CONTRIBUTOR', text: 'Their return carries the room’s voices but not their own (mix-minus), and the stream carries them on purpose.' },
      ],
    }),
});

export const B06_PAGES: Partial<Record<SourcePageId, PageFn>> = { sound: B06Sound, setting: B06Setting };
export const B06_STEP_COUNTS: Partial<Record<SourcePageId, number>> = { sound: 4, setting: 2 };
