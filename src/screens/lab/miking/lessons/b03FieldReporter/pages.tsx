/**
 * B03 FIELD REPORTERS AND HANDHELD INTERVIEWS — the lesson's own pages
 * (LessonArt.pages), on the broadcast steps (shared/broadcast/
 * broadcastPages.tsx) and the field reporter's tools (reporterPages.tsx):
 *
 *   sound   → MEET IT's second half: the voice sequence; ONE MIC, TWO PEOPLE
 *             (the handheld along the handoff path — shared at chest height,
 *             moved to the speaker; the omni or a cardioid, pointed at the
 *             speaker or "between"; a loud source the pair is turned
 *             against); WIND ON THE HANDHELD (grille, foam, fitted fur);
 *             then the checks.
 *   setting → STARTING SETUPS' tail: WHERE EACH MIC GOES (the handheld, the
 *             camera's own mic, the program return and the producer's cues;
 *             at a live event the local loudspeaker), then BEFORE ANY MIC.
 * FULLY SILENT; nothing loops (D8).
 */
import type { ReactNode } from 'react';
import type { SourcePageId } from '../../engine/model/types.ts';
import type { PageProps } from '../../pages/pageTypes';
import { makeBroadcastSetting, makeBroadcastSound, useRoutingStep } from '../shared/broadcast/broadcastPages';
import { useInterviewStep, useReporterWindStep } from '../shared/broadcast/reporterPages';
import type { RoutingPlan } from '../shared/broadcast/routing.ts';
import type { MikingStep } from '../../engine/steps';
import { B03Scene } from './scene';
import { PAIR, SHOULDER_REP } from './geometry.ts';

type PageFn = (p: PageProps) => ReactNode;
const OMNI = { art: 'flagHandheld' as const, r: 24, len: 230 };
const CARD = { art: 'flagHandheld' as const, r: 25, len: 162 };

function useTools(): MikingStep[] {
  const interview = useInterviewStep({
    pair: PAIR,
    shoulder: SHOULDER_REP,
    top: () => <B03Scene view="top" variant="street" />,
    side: () => <B03Scene view="side" variant="street" />,
    box: { u0: -1900, u1: 2700, v0: -2350, v1: 2350 },
    sideBox: { u0: -400, u1: 1200, v0: -420, v1: 700 },
    omni: OMNI,
    dir: CARD,
    words: {
      looking: 'From above · a reporter and a guest, one handheld between them · the side in the corner',
      prompt: 'Slide MIC AT from the reporter, through the shared place at chest height, to the guest. Change WHO SPEAKS, the MIC, its AIM, and where the LOUD SOURCE is.',
      done: 'The shared omni is an easy start in a quiet place — it favours neither voice and needs no rushed aiming. When the street is loud, move it to whoever is speaking, just before they start. A directional handheld must point at the speaking mouth, close: pointed between two people, it serves neither.',
    },
  });
  const wind = useReporterWindStep({
    words: {
      looking: 'The reporter’s handheld, close up',
      prompt: 'Add a layer with COVER, then change PLACE. Read what reaches the capsule.',
      done: 'Check the wind at the capsule, not the forecast: a fitted foam for light air, a fitted fur for stronger wind — and when even that buffets, turn the pair or move to a sheltered, permitted spot. No layer makes a mic immune, and none is waterproof.',
    },
  });
  return [interview, wind];
}

const B03Sound = makeBroadcastSound({
  useTools: () => useTools(),
  highs: 'The voice’s highest frequencies go out ahead of the mouth: a guest who turns toward the camera or an interpreter drifts off a directional handheld’s front and sounds duller — the reporter re-aims. In words only — the shape of that spread is not drawn.',
  silentNote: 'This lab never plays a sound and draws no frequency curve for a voice: how a real interview sounds depends on the voices, the mic, the wind and the street. The pictures show where the sound comes from and where it goes.',
});

const PLAN: RoutingPlan = {
  sources: [
    { id: 'hand', label: 'The reporter’s handheld', short: 'HANDHELD', kind: 'mic', level: 'mic' },
    { id: 'cam', label: 'The camera’s own mic (a reference)', short: 'CAMERA MIC', kind: 'ambience', level: 'mic' },
    { id: 'ret', label: 'The program return', short: 'RETURN', kind: 'playback', level: 'line' },
    { id: 'prod', label: 'The producer’s cues', short: 'PRODUCER', kind: 'talkback', level: 'mic' },
  ],
  dests: ['program', 'recorder', 'ifb', 'monitor', 'pa'],
  sends: {
    hand: ['program', 'recorder'],
    cam: ['recorder'],
    ret: ['ifb'],
    prod: ['ifb'],
  },
  openMics: ['hand'],
  needs: { program: ['hand'], recorder: ['hand', 'cam'] },
};

const B03Setting = makeBroadcastSetting({
  useRouting: () =>
    useRoutingStep({
      plan: PLAN,
      looks: { hand: OMNI, cam: { art: 'shotgun', r: 10, len: 180 }, ret: 'player', prod: 'talkback' },
      switches: [
        {
          id: 'ret',
          label: 'RETURN TO',
          options: [
            { id: 'ear', label: 'Earpiece', blurb: 'The program return goes to the reporter’s earpiece only.', sends: { ret: ['ifb'] } },
            { id: 'speaker', label: 'Speaker', blurb: 'The program return plays on a small loudspeaker beside the interview.', sends: { ret: ['monitor'] } },
          ],
        },
        {
          id: 'cue',
          label: 'CUES',
          options: [
            { id: 'ifb', label: 'Earpiece', blurb: 'The producer’s cues to the reporter’s earpiece.', sends: { prod: ['ifb'] } },
            { id: 'air', label: 'On air', blurb: 'The producer’s cues end up in the program.', sends: { prod: ['ifb', 'program'] } },
          ],
        },
        {
          id: 'pa',
          label: 'LIVE EVENT',
          options: [
            { id: 'none', label: 'No local PA', blurb: 'The handheld goes to the program and the recorder only.', sends: {} },
            { id: 'pa', label: 'Into the local PA', blurb: 'At a live event the handheld also feeds the local loudspeaker — a feedback path to plan for.', sends: { hand: ['program', 'recorder', 'pa'] } },
          ],
        },
      ],
      words: {
        looking: 'A signal-flow drawing · the handheld, the camera’s mic, the return and the cues',
        prompt: 'TRACE each source. Then send the RETURN to a loudspeaker, put the CUES on air, and feed the LIVE EVENT’s PA — and read what each one changes.',
        done: 'The handheld on the program and the recorder, the camera’s mic recorded as a reference, the return and the cues only in the reporter’s earpiece: a clean plan. Mute the paths you are not using — on purpose.',
      },
      points: [
        { title: 'CHECK THE PROGRAM, NOT A METER', text: 'Monitor the actual program channel in comfortable headphones: clipping, a low level, an unexpected mute, a switching fault. A clean meter at setup is not proof through a moving crowd.' },
        { title: 'A LOCAL PA', text: 'At a live event the handheld may also feed a loudspeaker: what goes to it, and where a directional mic’s rejection points, decide how close it gets to feedback. An omni held close may suit the broadcast and need a different plan for loud local speakers.' },
        { title: 'THE FALLBACK', text: 'A cabled mic, a coordinated spare wireless channel, or a sheltered position nearby — tested before a live hit. The radio channels and the range are checked with the responsible technician.' },
      ],
    }),
});

export const B03_PAGES: Partial<Record<SourcePageId, PageFn>> = { sound: B03Sound, setting: B03Setting };
/** MEET IT's sound part: the sequence, two tools, the checks; STARTING
 *  SETUPS' tail: routing + before any mic. */
export const B03_STEP_COUNTS: Partial<Record<SourcePageId, number>> = { sound: 4, setting: 2 };
