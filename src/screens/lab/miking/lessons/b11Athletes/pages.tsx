/**
 * B11 ATHLETES, COACHES AND OFFICIALS — the lesson's own pages
 * (LessonArt.pages), on the broadcast steps (shared/broadcast/
 * broadcastPages.tsx) and the speech-in-sport steps (sportPages.tsx):
 *
 *   sound   → MEET IT's second half: the voice sequence; A BODY MIC, FRONT
 *             AND SIDE (frame T: the wearer, the mic's place, the pack, the
 *             cable's loop, the antenna, the keep-outs); THE HEAD TURNS (a
 *             chest mic stays on the chest while the mouth turns); the
 *             checks.
 *   setting → STARTING SETUPS' tail: WHERE EACH MIC GOES (the coach's mic,
 *             the official's announcement mic — off, to the PA, to the PA and
 *             the program with permission — and the officials' private
 *             circuit drawn CLOSED; the chain mic → transmitter → receiver →
 *             its own channel → the approved path), then BEFORE ANY MIC.
 * FULLY SILENT; nothing loops (D8).
 */
import type { ReactNode } from 'react';
import type { SourcePageId } from '../../engine/model/types.ts';
import type { PageProps } from '../../pages/pageTypes';
import { aimedAtLips, makeBroadcastSetting, makeBroadcastSound, useTurnStep } from '../shared/broadcast/broadcastPages';
import { useBodyStep, useFeedsStep } from '../shared/broadcast/sportPages';
import { B11Scene } from './scene';
import { LAV_P } from './geometry.ts';

type PageFn = (p: PageProps) => ReactNode;

function useTools(): ReturnType<typeof useTurnStep>[] {
  const body = useBodyStep({
    wearers: ['coach', 'official', 'athlete'],
    words: {
      looking: 'Front or side · a body mic on the wearer · hatched = never mount here',
      prompt: 'Choose the WEARER, then the MIC, and look from the FRONT and the SIDE. TURN the head and read what a chest mic loses.',
      done: 'The mic goes where the approval says; the pack sits low and retained at the small of the back, its antenna straight; the cable leaves the mic with a small loop and slack for the head and the torso. Protective equipment is never touched. A chest mic stays on the chest when the head turns — a headset turns with it.',
      wearer: {
        coach: 'A coach at the sideline: an approved chest mic leaves both hands for the work; an approved headset holds a steadier distance. Their team headset is their own system — a broadcast mic never taps into it.',
        official: 'An official: the event’s announcement mic or headset, opened on purpose to the PA and muted again. The officials’ private circuit is a different system and stays closed.',
        athlete: 'An athlete in contact kit, only where the rules, the team and the athlete approve: the exact approved place, clear of the helmet, the pads and the contact zones. Many sports refuse a mount entirely.',
      },
    },
  });
  const turn = useTurnStep({
    mics: [aimedAtLips('lav', 'The chest mic at the breastbone', 'CHEST MIC', LAV_P, { art: 'lavalier', r: 3, len: 12, pattern: 'omni' })],
    top: () => <B11Scene view="top" variant="coach" headless />,
    side: () => <B11Scene view="side" variant="coach" headless />,
    boxTop: { u0: -460, u1: 760, v0: -560, v1: 560 },
    boxSide: { u0: -420, u1: 700, v0: -380, v1: 620 },
    pitch: true,
    words: {
      subject: 'a coach with a mic clipped at the breastbone',
      looking: 'From above · the coach, a mic fixed on the chest · the side in the corner',
      prompt: 'TURN the coach’s head both ways, then LOOK down. Watch the distance and the angle at the chest mic.',
      done: 'The chest stays; the mouth turns. A chest mic hears the voice change as the head turns to the play or the bench, and looking down muffles it a little. A headset boom turns with the head: one distance through every turn.',
    },
  });
  return [body, turn];
}

const B11Sound = makeBroadcastSound({
  useTools: () => useTools(),
  highs: 'The voice’s highest frequencies go out ahead of the mouth: a chest mic below the chin hears a duller, chestier voice than a mic in front, and the head’s turns change it. In words only — the shape of that spread is not drawn.',
  silentNote: 'This lab never plays a sound and draws no frequency curve for a voice: how a real body mic sounds depends on the voice, the mic, the kit and the movement. The pictures show where the sound comes from and where it goes.',
});

const B11Setting = makeBroadcastSetting({
  useRouting: () =>
    useFeedsStep({
      feed: {
        commentators: [{ id: 'coach', label: 'The coach’s body mic', short: 'COACH' }],
        official: { id: 'off', label: 'The official’s announcement mic', short: 'OFFICIAL' },
        dests: ['pa', 'program', 'recorder'],
      },
      looks: { coach: { art: 'lavalier', r: 4, len: 30 }, off: { art: 'headsetBoom', r: 11, len: 30 } },
      controls: ['official', 'priv'],
      privateCircuit: { label: 'Officials’ private circuit' },
      chain: true,
      words: {
        looking: 'A signal-flow drawing · the coach’s mic, the official’s announcement mic · the officials’ private circuit, closed, below',
        prompt: 'TRACE each source. Switch the OFFICIAL MIC off, to the PA, to the PA and the program — and ask the tool to put the PRIVATE circuit on air.',
        done: 'The coach’s mic only to its approved destination; the official’s mic opened on purpose to the PA and muted again; the officials’ private circuit on its own route, never on air: a clean plan.',
      },
      points: [
        { title: 'THE DESTINATION IS PART OF THE APPROVAL', text: 'Write down where each mic may go and when: live, delayed, recorded for review — or nowhere. An athlete’s or a coach’s mic may capture bystanders: follow the event’s rights and privacy policy.' },
        { title: 'PUBLIC AND PRIVATE', text: 'A public announcement is opened on purpose and muted again. The inter-official, medical or tactical channel stays on its approved route — never opened into the program by assumption.' },
        { title: 'ONE VOICE, ONE OPEN MIC', text: 'Never leave a body mic and a headset or an announcement mic open on the same voice without a deliberate choice: the two copies comb.' },
      ],
    }),
});

export const B11_PAGES: Partial<Record<SourcePageId, PageFn>> = { sound: B11Sound, setting: B11Setting };
/** MEET IT's sound part: the sequence, two tools, the checks; STARTING
 *  SETUPS' tail: the feeds + before any mic. */
export const B11_STEP_COUNTS: Partial<Record<SourcePageId, number>> = { sound: 4, setting: 2 };
