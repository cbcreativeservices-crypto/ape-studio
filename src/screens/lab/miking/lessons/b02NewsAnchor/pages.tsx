/**
 * B02 NEWS ANCHORS AND SEATED INTERVIEWS — the lesson's own pages
 * (LessonArt.pages), on the broadcast steps (shared/broadcast/
 * broadcastPages.tsx), the camera step (cameraPages.tsx) and the body-worn
 * turn step (bodyWornPages.tsx):
 *
 *   sound   → MEET IT's second half: the voice sequence; CHEST OR HEAD (the
 *             anchor turns to the camera, the guest and the script: the lav
 *             on the chest, the fixed boom, the gooseneck); THE FRAME LINE
 *             (close or two-shot: the boom just above the frame, the lav on
 *             the chest); THE DESK ANSWERS BACK (a raised desk mic over the
 *             hard desk); EVERY OPEN MIC (the anchor's and the guest's lavs);
 *             then the checks.
 *   setting → STARTING SETUPS' tail: WHERE EACH MIC GOES (the two lavs, the
 *             boom, the producer: the program, the recorder, the earpiece —
 *             one mic on air per voice), then BEFORE ANY MIC.
 * FULLY SILENT; nothing loops (D8).
 */
import type { ReactNode } from 'react';
import type { SourcePageId, Vec3 } from '../../engine/model/types.ts';
import type { PageProps } from '../../pages/pageTypes';
import { makeBroadcastSetting, makeBroadcastSound, useOpenMicStep, useReflectStep, useRoutingStep } from '../shared/broadcast/broadcastPages';
import { useShotStep } from '../shared/broadcast/cameraPages';
import { useBodyTurnStep } from '../shared/broadcast/bodyWornPages';
import type { RoutingPlan } from '../shared/broadcast/routing.ts';
import { B02Scene } from './scene';
import { B02_ZONES } from './model.ts';
import { BOOM_CLOSE, CAM_CLOSE, CAM_TWO, DESK, DESK_PLATE, GUEST, HEAD_TOP, LAV_A, LAV_G_AT } from './geometry.ts';
import { SEATED_FLOOR } from '../shared/broadcast/talkerPose.ts';

type PageFn = (p: PageProps) => ReactNode;
const v3 = (x: number, y: number, z: number): Vec3 => ({ x, y, z });
const zone = (id: string) => B02_ZONES.find((z) => z.id === id)!;
const GOOSE = { art: 'gooseneck' as const, r: 9.5, len: 60, pattern: 'cardioid' as const };

function useTools() {
  const turn = useBodyTurnStep({
    mics: [
      { id: 'lav', label: 'The lav on the sternum', short: 'LAV', p: LAV_A.at, rides: 'chest', art: 'lavalier', r: 3, len: 12 },
      { id: 'boom', label: 'The fixed boom', short: 'BOOM', p: BOOM_CLOSE.p, rides: 'fixed', art: 'shotgun', r: 9.5, len: 250 },
      { id: 'goose', label: 'The gooseneck on the desk', short: 'GOOSENECK', p: zone('b2.goose').start.p, rides: 'fixed', art: 'gooseneck', r: 9.5, len: 60 },
    ],
    top: () => <B02Scene view="top" variant="close" headless camera={false} />,
    side: () => <B02Scene view="side" variant="close" headless camera={false} />,
    boxTop: { u0: -460, u1: 940, v0: -720, v1: 980 },
    boxSide: { u0: -420, u1: 900, v0: -700, v1: 560 },
    insetAt: { x: 0.6, y: 0.52, w: 0.39, h: 0.46 },
    axisLabelAt: { u: DESK.max.x + 40, v: 0, align: 'left' },
    pitch: true,
    words: {
      subject: 'an anchor at a desk with a lav, a fixed boom and a gooseneck',
      looking: 'From above · the anchor, the guest on their right · the side in the corner',
      prompt: 'TURN toward the guest and back, then LOOK down at the script. Switch MIC: the lav, the boom, the gooseneck — which drifts most?',
      done: 'Every one stays where it is while the mouth turns: the lav from below the chin, the boom from above, the gooseneck from in front. Turning to the guest takes the voice off each one’s axis — rehearse the real turns, and give the guest their own mic.',
      right: 'toward the guest',
      left: 'away from the guest',
    },
  });
  const frame = useShotStep({
    shots: [
      { id: 'close', label: 'Close', words: 'the anchor, head and shoulders', cam: CAM_CLOSE },
      { id: 'two', label: 'Two-shot', words: 'the anchor and the guest together', cam: CAM_TWO },
    ],
    from: ['above'],
    boom: { clearance: 150, elevDeg: 45, planDeg: -20 },
    bodyMic: LAV_A.at,
    camMic: false,
    tube: 200,
    scene: (view) => <B02Scene view={view} variant="twoShot" camera={false} />,
    floor: SEATED_FLOOR,
    headTop: HEAD_TOP,
    boxSide: { u0: -700, u1: 2950, v0: -1150, v1: 1260 },
    boxTop: { u0: -700, u1: 2950, v0: -1400, v1: 1700 },
    insetBoxTop: { u0: -600, u1: 1300, v0: -1200, v1: 1300 },
    insetAt: { x: 0.3, y: 0.55, w: 0.42, h: 0.43 },
    words: {
      subject: 'An anchor at a desk',
      looking: 'Side view · the anchor, the camera and its frame · from above in the corner',
      prompt: 'Switch SHOT: close, then the two-shot. Where can the boom go — and the lav?',
      done: 'The wider two-shot raises the frame’s top: the boom must stay farther away, hearing more room. The lav keeps its distance in any shot. A boom for the program and the lav as its fallback, each on its own track, is a common pairing.',
    },
  });
  const desk = useReflectStep({
    plate: DESK_PLATE,
    places: [
      { id: 'raised', label: 'Raised', blurb: 'The gooseneck’s capsule raised, 20° below the mouth’s line.', dir: v3(Math.cos((20 * Math.PI) / 180), Math.sin((20 * Math.PI) / 180), 0) },
      { id: 'low', label: 'Low', blurb: 'Lower, 45° below the mouth’s line, nearer the desk.', dir: v3(Math.cos(Math.PI / 4), Math.sin(Math.PI / 4), 0) },
      { id: 'level', label: 'Level', blurb: 'On the mouth’s axis, high off the desk.', dir: v3(1, 0, 0) },
    ],
    look: GOOSE,
    range: { min: 150, max: 450, start: 250 },
    side: () => <B02Scene view="side" variant="close" camera={false} base={false} />,
    box: { u0: -380, u1: 800, v0: -330, v1: 1000 },
    words: {
      title: 'The desk answers back',
      looking: 'Side view · the anchor, the desk, a desk mic · white = direct, amber = off the desk',
      prompt: 'Move the mic: raised toward the mouth, low over the desk, level — and nearer or farther. Watch the bounce and where the first dip falls.',
      surface: 'the desk',
      subject: 'an anchor at a desk with a desk mic',
      done: 'A raised mic hears the desk’s copy later and weaker than one low over it. A boundary mic is the other answer: lying on the desk, its element is so close to the surface that the bounce arrives with the direct sound — it hears the desk’s papers and the room instead. Move the mic, the papers or the person; EQ cannot pull a cancelled pitch back.',
    },
  });
  const mics = useOpenMicStep({
    talkers: [
      { id: 'A', label: 'The anchor', mouth: v3(0, 0, 0) },
      { id: 'G', label: 'The guest', mouth: GUEST.lip },
    ],
    mics: [
      { id: 'mA', label: 'The anchor’s lav', short: 'ANCHOR LAV', owner: 'A', pose: zone('b2.lav').start, pattern: 'omni', open: true, look: { art: 'lavalier', r: 6, len: 26 } },
      { id: 'mG', label: 'The guest’s lav', short: 'GUEST LAV', owner: 'G', pose: { ...zone('b2.guestLav').start, p: LAV_G_AT }, pattern: 'omni', open: true, look: { art: 'lavalier', r: 6, len: 26 } },
    ],
    presets: [
      { id: 'both', label: 'Both lavs open', blurb: 'Either may speak at any moment: both open.', open: ['mA', 'mG'] },
      { id: 'A', label: 'Only the anchor’s', blurb: 'The guest is listening: their lav muted.', open: ['mA'] },
      { id: 'G', label: 'Only the guest’s', blurb: 'The anchor is listening: their lav muted.', open: ['mG'] },
    ],
    top: () => <B02Scene view="top" variant="twoShot" camera={false} />,
    box: { u0: -480, u1: 1100, v0: -620, v1: 1300 },
    words: {
      subject: 'an anchor and a guest at a desk, a lav each',
      looking: 'From above · the anchor and the guest, a lav each · rays from the one speaking',
      prompt: 'Choose WHO SPEAKS, then which lavs are OPEN. Read how much of each voice reaches the other lav, and what the second copy does.',
      done: 'Each voice reaches the other’s lav too — farther away, so lower, but later: with both open the program hears it twice and some pitches cancel. An omni lav has no rear to turn away; closeness and muting the unused channel keep it small.',
    },
  });
  return [turn, frame, desk, mics];
}

const B02Sound = makeBroadcastSound({
  useTools: () => useTools(),
  highs: 'The voice’s highest frequencies go out ahead of the mouth: an anchor who turns to the guest or reads down drifts off a fixed mic’s axis and sounds duller; a lav below the chin hears a little less of them. In words only — the shape of that spread is not drawn.',
  silentNote: 'This lab never plays a sound and draws no frequency curve for a voice: how a real anchor sounds depends on the voice, the mic, the desk and the room. The pictures show where the sound comes from and where it goes.',
});

/** The news set's routing: two lavs, the boom, the producer. */
const PLAN: RoutingPlan = {
  sources: [
    { id: 'lavA', label: 'The anchor’s lav', short: 'ANCHOR LAV', kind: 'mic', level: 'mic', talker: 'anchor' },
    { id: 'lavG', label: 'The guest’s lav', short: 'GUEST LAV', kind: 'mic', level: 'mic', talker: 'guest' },
    { id: 'boom', label: 'The fixed boom', short: 'BOOM', kind: 'mic', level: 'mic', talker: 'anchor' },
    { id: 'producer', label: 'The producer’s talkback', short: 'PRODUCER', kind: 'talkback', level: 'mic' },
  ],
  dests: ['program', 'recorder', 'ifb', 'talkback'],
  sends: {
    lavA: ['program', 'recorder'],
    lavG: ['program', 'recorder'],
    boom: ['recorder'],
    producer: ['talkback', 'ifb'],
  },
  openMics: ['lavA', 'lavG', 'boom'],
  needs: { program: ['lavA', 'lavG'], recorder: ['lavA', 'lavG', 'boom'] },
};

const B02Setting = makeBroadcastSetting({
  useRouting: () =>
    useRoutingStep({
      plan: PLAN,
      looks: { lavA: { art: 'lavalier', r: 9, len: 40 }, lavG: { art: 'lavalier', r: 9, len: 40 }, boom: { art: 'shotgunMount', r: 9.5, len: 250 }, producer: 'talkback' },
      switches: [
        {
          id: 'air',
          label: 'ANCHOR ON AIR',
          options: [
            { id: 'lav', label: 'The lav', blurb: 'The anchor’s lav in the program; the boom on its own track as the fallback.', sends: { boom: ['recorder'] } },
            { id: 'both', label: 'Lav and boom', blurb: 'The anchor’s lav and the boom both in the program.', sends: { boom: ['program', 'recorder'] } },
          ],
        },
        {
          id: 'ifb',
          label: 'EARPIECE',
          options: [
            { id: 'cues', label: 'Program and cues', blurb: 'The anchor’s earpiece carries the program and the producer’s cues.', sends: { producer: ['talkback', 'ifb'] } },
            { id: 'air', label: 'Cues on air too', blurb: 'The producer’s cues also reach the program.', sends: { producer: ['talkback', 'ifb', 'program'] } },
          ],
        },
      ],
      words: {
        looking: 'A signal-flow drawing · the mics, the mixer, where each one goes',
        prompt: 'TRACE each source. Then put the anchor’s lav AND the boom on air, and the producer’s cues on air — read what goes wrong.',
        done: 'Each speaker on their own labelled channel; one mic on air for the anchor, the boom on its own track as a tested fallback; the producer in the earpiece and on talkback only.',
      },
      points: [
        { title: 'A CHANNEL FOR EACH SPEAKER', text: 'Label each mic and channel; rehearse each speaker alone, then a natural overlap, looking across the desk and into the camera. Mute unused channels as the format permits.' },
        { title: 'TWO UNCHECKED MICS ARE NOT A BACKUP', text: 'A fallback is a second mic, checked on its own, with a clear cue for switching. Summed with the first, it combs.' },
        { title: 'THE RADIO AND THE PA', text: 'Wireless lavs are coordinated — transmitters, receivers, power and frequencies — by the responsible technician. A news set may not reinforce the anchor; a public interview can, and then every open mic hears the PA.' },
      ],
    }),
});

export const B02_PAGES: Partial<Record<SourcePageId, PageFn>> = { sound: B02Sound, setting: B02Setting };
/** MEET IT's sound part: the sequence, four tools, the checks; STARTING
 *  SETUPS' tail: routing + before any mic. */
export const B02_STEP_COUNTS: Partial<Record<SourcePageId, number>> = { sound: 6, setting: 2 };
