/**
 * B09 COMMENTATORS AND ANNOUNCE POSITIONS — the lesson's own pages
 * (LessonArt.pages), on the broadcast steps (shared/broadcast/
 * broadcastPages.tsx) and the speech-in-sport steps (sportPages.tsx):
 *
 *   sound   → MEET IT's second half: the voice sequence; THE HEAD TURNS (a
 *             desk-arm mic fixed in front of a commentator who follows the
 *             play — a headset boom would turn with the head); THE
 *             PARTNER'S VOICE (the booth from above: which mic, which side
 *             the boom sits, the seats, the partner's turn); then the checks.
 *   setting → STARTING SETUPS' tail: WHERE EACH MIC GOES (the mic key —
 *             on air, cough, talkback; the return — mix-minus or the whole
 *             program; the crowd bed on its own channel), then BEFORE ANY
 *             MIC with the hearing card.
 * FULLY SILENT; nothing loops (D8).
 */
import type { ReactNode } from 'react';
import type { SourcePageId, Vec3 } from '../../engine/model/types.ts';
import type { PageProps } from '../../pages/pageTypes';
import { BROADCAST_HEARING, aimedAtLips, makeBroadcastSetting, makeBroadcastSound, useTurnStep } from '../shared/broadcast/broadcastPages';
import { useFeedsStep, useSpillStep } from '../shared/broadcast/sportPages';
import { B09Scene } from './scene';
import { B09_ZONES } from './model.ts';
import { ANALYST } from './geometry.ts';

type PageFn = (p: PageProps) => ReactNode;
const v3 = (x: number, y: number, z: number): Vec3 => ({ x, y, z });
const zone = (id: string) => B09_ZONES.find((z) => z.id === id)!;
const DYN_LOOK = { art: 'broadcastDynamic' as const, r: 30, len: 190, pattern: 'cardioid' as const };
const ARM_P = zone('b9.arm').start.p;
const HS_P = zone('b9.headset').start.p;
const LIP_P = zone('b9.lip').start.p;

function useTools(): ReturnType<typeof useTurnStep>[] {
  const turn = useTurnStep({
    mics: [aimedAtLips('arm', 'The desk-arm mic at about 10 cm', 'ARM MIC', ARM_P, DYN_LOOK)],
    top: () => <B09Scene view="top" variant="studio" headless />,
    side: () => <B09Scene view="side" variant="studio" headless />,
    boxTop: { u0: -460, u1: 900, v0: -620, v1: 620 },
    boxSide: { u0: -420, u1: 760, v0: -380, v1: 560 },
    pitch: true,
    phones: true,
    words: {
      subject: 'a commentator at a desk with a mic fixed on an arm in front of the mouth',
      looking: 'From above · the commentator, a mic fixed on its arm · the side in the corner',
      prompt: 'TURN the head to follow the play both ways, then LOOK down at the notes. Watch the distance and the angle at the fixed mic.',
      done: 'The arm holds the mic; the mouth moves. A commentator who follows the play leaves a fixed mic’s axis and drifts away from it — the voice dulls and drops. A headset boom turns with the head and keeps one distance: that is why most commentary positions use one.',
    },
  });
  const spill = useSpillStep({
    mics: [
      { id: 'hs', label: 'The headset boom at the mouth corner', short: 'HEADSET', p: HS_P, art: 'headsetBoom', r: 11, len: 30, pattern: 'cardioid', side: true },
      { id: 'lip', label: 'The lip ribbon against the lip', short: 'LIP RIBBON', p: LIP_P, art: 'lipRibbon', r: 20, len: 220, pattern: 'figure8' },
      { id: 'arm', label: 'The desk-arm mic at about 10 cm', short: 'ARM MIC', p: ARM_P, art: 'broadcastDynamic', r: 30, len: 190, pattern: 'cardioid' },
    ],
    top: (gap) => <B09Scene view="top" variant="booth" analyst={{ ...ANALYST, lip: v3(0, 0, gap) }} />,
    box: (gap) => ({ u0: -650, u1: 1250, v0: -640, v1: gap + 640 }),
    words: {
      looking: 'From above · you and your partner at the desk · the field to the right',
      prompt: 'Choose a MIC, then turn the PARTNER toward you and move the SEATS. Read how much lower the partner’s voice arrives at your mic — by distance, and by the pattern.',
      done: 'A close mic does most of the work: a few centimetres from your lips against most of a metre to your partner’s. Then the pattern: a boom on the partner’s side puts them behind the capsule; a figure-8 has them at its side. When the partner turns to you, they come closer and more in front — listen to each channel while the other talks.',
    },
  });
  return [turn, spill];
}

const B09Sound = makeBroadcastSound({
  useTools: () => useTools(),
  highs: 'The voice’s highest frequencies go out ahead of the mouth: a commentator who turns to follow the play, or reads down, drifts off a fixed mic’s axis and sounds duller. A headset boom turns with the head. In words only — the shape of that spread is not drawn.',
  silentNote: 'This lab never plays a sound and draws no frequency curve for a voice: how a real commentator sounds depends on the voice, the mic, the position and the stadium. The pictures show where the sound comes from and where it goes.',
});

const B09Setting = makeBroadcastSetting({
  useRouting: () =>
    useFeedsStep({
      feed: {
        commentators: [
          { id: 'cA', label: 'The commentator’s mic', short: 'COMMENTARY' },
          { id: 'cB', label: 'The analyst’s mic', short: 'ANALYST' },
        ],
        crowd: { id: 'crowd', label: 'The crowd mics', short: 'CROWD' },
        producer: { id: 'prod', label: 'The producer’s talkback', short: 'PRODUCER' },
        dests: ['program', 'recorder', 'phones', 'ifb', 'talkback'],
      },
      looks: { cA: { art: 'headsetBoom', r: 11, len: 30 }, cB: { art: 'headsetBoom', r: 11, len: 30 }, crowd: { art: 'shotgun', r: 9.5, len: 250 }, prod: 'talkback' },
      controls: ['key', 'ret', 'crowd'],
      words: {
        looking: 'A signal-flow drawing · the commentary mics, the crowd, the producer · where each one goes',
        prompt: 'TRACE each source. Then hold the MIC KEY on cough and on talkback, switch the RETURN to the whole program, and take the CROWD off its channel — and read what goes wrong.',
        done: 'Each commentator on their own channel to the program and the recorder, hearing themselves directly; their return is the program minus their own voices with the producer’s cues; the crowd on its own channel: a clean plan.',
      },
      points: [
        { title: 'COUGH AND TALKBACK', text: 'Check where the mic goes while each key is held — off everything for a cough, to the producer only for talkback — before the event, not during it.' },
        { title: 'THE RETURN', text: 'A commentator hears the program minus their own voice, plus the producer’s cues interrupting it (IFB). Their own voice comes back directly in their headphones, never late through the chain.' },
        { title: 'THE CROWD HAS ITS OWN MICS', text: 'The commentary mic is for the voice; the crowd’s energy comes from its own mics on its own channels, added on purpose. A private word off the air stays off the program.' },
      ],
    }),
  hearing: `${BROADCAST_HEARING} Closed earcups reduce some of the crowd at the ear, but a headset is not hearing protection unless it is rated as such: start the return low, set it under real crowd noise, and plan protection with the venue’s safety lead.`,
});

export const B09_PAGES: Partial<Record<SourcePageId, PageFn>> = { sound: B09Sound, setting: B09Setting };
/** MEET IT's sound part: the sequence, two tools, the checks; STARTING
 *  SETUPS' tail: the feeds + before any mic. */
export const B09_STEP_COUNTS: Partial<Record<SourcePageId, number>> = { sound: 4, setting: 2 };
