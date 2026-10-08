/**
 * B10 SIDELINE AND POST-EVENT INTERVIEWS — the lesson's own pages
 * (LessonArt.pages), on the broadcast steps (shared/broadcast/
 * broadcastPages.tsx) and the speech-in-sport steps (sportPages.tsx):
 *
 *   sound   → MEET IT's second half: the voice sequence; THE HANDOFF (one
 *             handheld between the reporter and the guest: where it is, who
 *             speaks, the timeline — question, move, pause, answer); EVERY
 *             OPEN MIC (the guest's handheld and the reporter's headset:
 *             who reaches which mic); then the checks.
 *   setting → STARTING SETUPS' tail: WHERE EACH MIC GOES (the guest's mic,
 *             the reporter's, the crowd, the producer's cues and the program
 *             return — what the guest must not hear), then BEFORE ANY MIC.
 * FULLY SILENT; nothing loops (D8).
 */
import type { ReactNode } from 'react';
import type { SourcePageId } from '../../engine/model/types.ts';
import type { PageProps } from '../../pages/pageTypes';
import { makeBroadcastSetting, makeBroadcastSound, useOpenMicStep, useRoutingStep } from '../shared/broadcast/broadcastPages';
import { useHandoffStep } from '../shared/broadcast/sportPages';
import type { RoutingPlan } from '../shared/broadcast/routing.ts';
import { B10Scene } from './scene';
import { B10_ZONES } from './model.ts';
import { GUEST, REPORTER } from './geometry.ts';

type PageFn = (p: PageProps) => ReactNode;
const zone = (id: string) => B10_ZONES.find((z) => z.id === id)!;
const FLAG_LOOK = { art: 'flagHandheld' as const, r: 25, len: 162 };

function useTools(): ReturnType<typeof useHandoffStep>[] {
  const handoff = useHandoffStep({
    reporter: REPORTER.lip,
    guest: GUEST.lip,
    atGuest: zone('b10.hand').start.p,
    atReporter: zone('b10.reporter').start.p,
    look: FLAG_LOOK,
    top: () => <B10Scene view="top" variant="twoMics" />,
    box: { u0: -650, u1: 1150, v0: -1150, v1: 520 },
    words: {
      looking: 'From above · the reporter and the guest, one handheld between them',
      prompt: 'Move the mic: AT THE GUEST, LEFT BETWEEN, AT THE REPORTER — and change WHO SPEAKS. Then try the TIMING: moved late, moved early.',
      done: 'The mic belongs at the mouth that is speaking, and it gets there BEFORE the answer starts: question, move, a short pause, answer — then back for the next question. Left between two people it hears both of them distant, and the crowd comes up with the gain.',
    },
  });
  const mics = useOpenMicStep({
    talkers: [
      { id: 'G', label: 'The guest', mouth: GUEST.lip },
      { id: 'R', label: 'The reporter', mouth: REPORTER.lip },
    ],
    mics: [
      { id: 'mG', label: 'The guest’s handheld', short: 'HANDHELD', owner: 'G', pose: zone('b10.hand').start, pattern: 'cardioid', open: true, look: FLAG_LOOK },
      { id: 'mR', label: 'The reporter’s headset', short: 'HEADSET', owner: 'R', pose: zone('b10.headset').start, pattern: 'cardioid', open: true, look: { art: 'headsetBoom', r: 11, len: 30 } },
    ],
    presets: [
      { id: 'both', label: 'Both mics open', blurb: 'Either may speak at any moment: both open.', open: ['mG', 'mR'] },
      { id: 'G', label: 'Only the guest’s', blurb: 'The guest answers: the reporter’s headset pulled down.', open: ['mG'] },
      { id: 'R', label: 'Only the reporter’s', blurb: 'The reporter asks: the guest’s mic pulled down.', open: ['mR'] },
    ],
    top: () => <B10Scene view="top" variant="sideline" />,
    box: { u0: -650, u1: 1150, v0: -1150, v1: 520 },
    words: {
      subject: 'a reporter with a headset and a guest with a handheld',
      looking: 'From above · the reporter’s headset and the guest’s handheld · rays from the one speaking',
      prompt: 'Choose WHO SPEAKS, then which mics are OPEN. Read how much of each voice reaches the other mic.',
      done: 'Each voice also reaches the other mic — later and lower. Two open mics hear more crowd than one: keep the unused one down. And never leave a body mic and a handheld open on the same person without meaning to — the two copies comb.',
    },
  });
  return [handoff, mics];
}

const B10Sound = makeBroadcastSound({
  useTools: () => useTools(),
  highs: 'The voice’s highest frequencies go out ahead of the mouth: a guest who turns to the camera or away, out of breath, drifts off the handheld’s axis and sounds duller — the reporter follows the mouth. In words only — the shape of that spread is not drawn.',
  silentNote: 'This lab never plays a sound and draws no frequency curve for a voice: how a real interview sounds depends on the voices, the mic, the wind and the stadium. The pictures show where the sound comes from and where it goes.',
});

const PLAN: RoutingPlan = {
  sources: [
    { id: 'guest', label: 'The guest’s handheld', short: 'GUEST', kind: 'mic', level: 'mic' },
    { id: 'rep', label: 'The reporter’s headset mic', short: 'REPORTER', kind: 'mic', level: 'mic' },
    { id: 'crowd', label: 'The crowd mics', short: 'CROWD', kind: 'ambience', level: 'mic' },
    { id: 'ret', label: 'The program return', short: 'RETURN', kind: 'playback', level: 'line' },
    { id: 'prod', label: 'The producer’s cues', short: 'PRODUCER', kind: 'talkback', level: 'mic' },
  ],
  dests: ['program', 'recorder', 'ifb', 'monitor'],
  sends: {
    guest: ['program', 'recorder'],
    rep: ['program', 'recorder'],
    crowd: ['program', 'recorder'],
    ret: ['ifb'],
    prod: ['ifb'],
  },
  openMics: ['guest', 'rep'],
  needs: { program: ['guest', 'rep', 'crowd'], recorder: ['guest', 'rep'] },
};

const B10Setting = makeBroadcastSetting({
  useRouting: () =>
    useRoutingStep({
      plan: PLAN,
      looks: { guest: FLAG_LOOK, rep: { art: 'headsetBoom', r: 11, len: 30 }, crowd: { art: 'shotgun', r: 9.5, len: 250 }, ret: 'player', prod: 'talkback' },
      switches: [
        {
          id: 'heard',
          label: 'RETURN TO',
          options: [
            { id: 'ear', label: 'Reporter’s earpiece', blurb: 'The program return and the cues go to the reporter’s earpiece only.', sends: { ret: ['ifb'] } },
            { id: 'speaker', label: 'A loudspeaker', blurb: 'The program return plays on a small loudspeaker beside the interview.', sends: { ret: ['monitor'] } },
          ],
        },
        {
          id: 'crowd',
          label: 'CROWD',
          options: [
            { id: 'own', label: 'Own channel', blurb: 'The crowd mics on their own channel into the program.', sends: { crowd: ['program', 'recorder'] } },
            { id: 'none', label: 'Not routed', blurb: 'No crowd mics: only what the interview mics happen to hear.', sends: { crowd: [] } },
          ],
        },
        {
          id: 'cue',
          label: 'CUES',
          options: [
            { id: 'ifb', label: 'Earpiece only', blurb: 'The producer’s cues to the reporter’s earpiece.', sends: { prod: ['ifb'] } },
            { id: 'air', label: 'Into the program', blurb: 'The producer’s cues end up in the program.', sends: { prod: ['ifb', 'program'] } },
          ],
        },
      ],
      words: {
        looking: 'A signal-flow drawing · the interview mics, the crowd, the return and the cues',
        prompt: 'TRACE each source. Then send the RETURN to a loudspeaker, take the CROWD off, put the CUES on air — and read what goes wrong.',
        done: 'The guest and the reporter on their own channels at the actual program; the crowd on its own; the return and the cues only in the reporter’s earpiece — the guest hears no uncontrolled delayed return: a clean plan.',
      },
      points: [
        { title: 'CHECK THE DESTINATION', text: 'Verify the speech channel at the actual program or stream, not only on a camera meter. The reporter’s cues and return are separate from the program.' },
        { title: 'RADIO', text: 'The venue’s radio coordinator owns the frequencies. Walk the approved route and the interview marks listening for dropouts; keep a tested cabled mic or another channel as the fallback.' },
      ],
    }),
});

export const B10_PAGES: Partial<Record<SourcePageId, PageFn>> = { sound: B10Sound, setting: B10Setting };
/** MEET IT's sound part: the sequence, two tools, the checks; STARTING
 *  SETUPS' tail: routing + before any mic. */
export const B10_STEP_COUNTS: Partial<Record<SourcePageId, number>> = { sound: 4, setting: 2 };
