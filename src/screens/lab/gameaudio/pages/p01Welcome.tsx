/**
 * Page 1 — WELCOME AND SAFE LISTENING (the lab's first page).
 *
 * The learner sets a safe level BEFORE anything sounds, starts the scene's
 * background, and learns the three parts every page WITH THE SCENE has: the
 * scene, the readouts, the activity log (pages 20 and 21 are reading pages
 * with no scene, no dock and no sound). The lab's one-line summary ("how a
 * game asks for sound, and how the audio side answers") opens this page's
 * intro card (guides/p01): the shared shell never draws a rack page's
 * subtitle (learning audit L-37).
 *
 * Two things are said ONCE, here, for the whole lab:
 *   - every sound is made in the app, not recorded;
 *   - people and objects are drawn larger than their real size; positions
 *     and distances are true.
 *
 * Hearing safety in plain words (start low, raise slowly, ■ STOP is always
 * in the same place). The app's full Sound Safety Warning is its own screen
 * and is not repeated.
 *
 * WHAT THE MODEL REALLY DOES (read before changing the text; each line is
 * held by test/gameAudioChAFamilies, "page 1"):
 *   - SCENE starts three loops (room tone, courtyard wind, fountain): three
 *     GAME lines and three START lines, PLAYING 3, VOICES 3;
 *   - while the courtyard wind plays, a BIRD calls every 4 to 9 seconds: a
 *     one-shot, so PLAYING and VOICES read 4 for as long as the call lasts;
 *   - the room tone runs at ZERO level while the listener is outside and is
 *     still counted. That is this scene's simplification (accuracy audit A5,
 *     lead's decision 5): the page says so, and says what a real engine does.
 *
 * Instances and voices are NOT explained here (learning audit L-12): page 7
 * teaches the first and page 17 the second.
 *
 * Common mistake taught against: raising the level first and starting the
 * sound second.
 */
import { useRef, useState } from 'react';
import type { PageCtx, PageDef } from '../../kit/PagedLab';
import { UnderstandingCheck } from '../../tuning/components/check';
import { GaRack, masterKey } from '../GaLab';
import { ActivityLog, Do, GoalChips, Look, Note, P, Step, Terms, useVisitGoals } from '../bits';
import { gaTerms } from '../gaTerms';
import { gaPlaying, type GaState } from '../model/gaModel';
import { gaDispatch, useGa } from '../model/gaStore';
import type { DockParam } from '../../rack/rackTypes';
import { G01 } from './guides/p01';
import { pct, useSince } from './shared';

const ASSETS = ['amb_room', 'amb_yard', 'fountain'] as const;
const TERMS = gaTerms('Game audio', 'Interactive audio', 'Audio listener');

/** The level this page calls low, in percent as the LEVEL readout prints it. */
const LOW_LEVEL_PCT = 40;

/** The scene's background is running: either ambience bed, or the fountain. */
const sceneRunning = (s: GaState): boolean => gaPlaying(s, 'bed_yard') || gaPlaying(s, 'bed_room') || gaPlaying(s, 'fountain');

/** Start or stop the scene's background: both ambience beds and the fountain. */
const sceneKey = (s: GaState): DockParam => ({
  kind: 'toggle',
  id: 'scene',
  label: 'SCENE',
  value: sceneRunning(s),
  onToggle: () => gaDispatch({ type: 'scene', on: !sceneRunning(s) }),
});

function Page({ ctx }: { ctx: PageCtx }) {
  const s = useGa();
  const { since } = useSince(s);
  const [check, setCheck] = useState(false);
  // the level as it was when the page opened: the goal asks for a MOVE
  const levelAtOpen = useRef(s.master);
  const goals = [
    { label: 'Set LEVEL low: move it to 40% or lower', hit: s.master !== levelAtOpen.current && Math.round(s.master * 100) <= LOW_LEVEL_PCT },
    { label: 'Start the scene', hit: since('sceneOn') > 0 },
    // counted only when ■ STOP (or SOUND off) really stopped something
    { label: 'Stop the scene with ■ STOP', hit: since('stoppedSomething') > 0 },
    { label: 'Pass the check', hit: check },
  ];
  const latched = useVisitGoals(ctx, goals);
  const on = sceneRunning(s);

  return (
    <GaRack
      spec={{
        keys: [masterKey(s), sceneKey(s)],
        initialParam: 'master',
        hud: 'level',
        // a soft mark over each zone while its bed plays, as strong as its level
        show: { beds: true },
        readouts: [
          { k: 'LEVEL', v: pct(s.master), vA11y: `lab level ${pct(s.master)}` },
          { k: 'SCENE', v: on ? 'ON' : 'OFF', vA11y: on ? 'the scene background is running' : 'the scene background is stopped' },
        ],
        showNames: true,
        assets: ASSETS,
      }}
    >
      <Step n={1}>
        <Look>You are looking down on a courtyard and a workshop. The figure marked YOU is the player. The amber wedge marks the listener: the game’s ears.</Look>
        <P>Game audio is every sound a game makes. It is interactive: it reacts to what the player does.</P>
        <P>Every sound in this lab is made in the app, not recorded. People and objects are drawn larger than their real size. Positions and distances are true.</P>
        <P>The activity log lists what the game asked for (GAME) and what the audio side answered (START).</P>
        <P>PLAYING and VOICES count what is sounding now. Page 7 explains them. SOUND says whether you can hear it.</P>
        <Terms items={TERMS} />
      </Step>
      <Step n={2}>
        <Do>Move the LEVEL slider down to 40% or lower. Turn SOUND on. Then switch SCENE on.</Do>
        <P>Three sounds start: the courtyard wind, the fountain and the workshop’s room tone. PLAYING shows 3. When a bird calls, it shows 4 for a moment.</P>
        <P>The room tone stays at zero level until the listener is inside. This scene counts it anyway. A real engine usually does not.</P>
        <ActivityLog state={s} lines={6} />
      </Step>
      <Step n={3}>
        <Do>Raise LEVEL slowly until the scene is comfortable. Then press ■ STOP.</Do>
        <P>LEVEL moves every bar on the strip under the picture.</P>
        <P>■ STOP is always the last key in the dock. It stops everything immediately.</P>
        <P>LEVEL is the lab’s own level. Your device’s volume control is separate: keep it low too.</P>
        <Note tone="mistake">Raising the level first and starting the sound second. A sound you have not heard yet can be louder than you expect.</Note>
      </Step>
      <Step n={4}>
        <P>Do each of these once. Each one is marked done when it really happens in the scene.</P>
        <GoalChips goals={goals} latched={latched} />
      </Step>
      <Step n={5}>
        <UnderstandingCheck
          eyebrow=""
          question="You are about to start a sound you have not heard before. Which order protects your hearing?"
          options={[
            'Set the level low, start the sound, then raise the level slowly',
            'Start the sound at the usual level, and lower it if it is too loud',
            'Set the level high first, so quiet details are easy to hear',
            'Use headphones, because headphones make any level safe',
          ]}
          correct={0}
          explain="A low start means the first moment of an unknown sound is quiet. You then raise the level only as far as you need."
          wrong={[
            undefined,
            'By the time you lower it, your ears have already received the loud start.',
            'A high level makes everything loud, not only the quiet details.',
            'Headphones place the sound close to your ears, so the level matters even more with them.',
          ]}
          onCorrect={() => setCheck(true)}
        />
      </Step>
    </GaRack>
  );
}

export const P01: PageDef = { title: 'Welcome and safe listening', short: 'WELCOME', Component: Page, manualDone: true, rack: true, guide: G01 };
