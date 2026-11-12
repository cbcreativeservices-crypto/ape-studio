/**
 * Page 2 — SOUND THAT REACTS (the lab's first idea).
 *
 * A game action can START a sound (an event) or CHANGE a sound that is
 * already playing (a parameter). The learner opens the door, starts the
 * generator, and moves its SPEED while it runs — and reads in the activity
 * log that the third action started nothing new.
 *
 * Common mistake taught against: assuming every change needs a new file
 * played from its start.
 */
import { useState } from 'react';
import type { PageCtx, PageDef } from '../../kit/PagedLab';
import { UnderstandingCheck } from '../../tuning/components/check';
import { GaRack } from '../GaLab';
import { ActivityLog, Do, GoalChips, Look, Note, P, Step, Terms, useVisitGoals } from '../bits';
import { gaTerms } from '../gaTerms';
import { useGa } from '../model/gaStore';
import { G02 } from './guides/p02';
import { doorKey, doorWord, machineKey, pct, speedKey, useSince } from './shared';

const ASSETS = ['door', 'door_rattle', 'gen_hum', 'gen_air'] as const;
const TERMS = gaTerms('Interactive audio', 'Audio event (game)', 'Event-driven audio', 'Audio parameter', 'Playback instance');

function Page({ ctx }: { ctx: PageCtx }) {
  const s = useGa();
  const { since } = useSince(s);
  const [check, setCheck] = useState(false);
  const goals = [
    { label: 'Open or close the door', hit: since('post:door_open') > 0 },
    { label: 'Start the generator', hit: since('inst:generator') > 0 },
    { label: 'Change SPEED while it runs', hit: since('speedWhilePlaying') > 0 },
    { label: 'Pass the check', hit: check },
  ];
  const latched = useVisitGoals(ctx, goals);
  const speed = s.machines[0]?.speed ?? 0.4;

  return (
    <GaRack
      spec={{
        keys: [speedKey(s), doorKey(s), machineKey(s)],
        initialParam: 'speed-generator-1',
        readouts: [
          { k: 'DOOR', v: doorWord(s) },
          { k: 'SPEED', v: pct(speed), vA11y: `generator speed ${pct(speed)}` },
        ],
        showNames: true,
        assets: ASSETS,
      }}
    >
      <Step n={1}>
        <Look>You are looking down on a courtyard and a workshop. You are the figure on the stone path. The generator is in the workshop, behind the door.</Look>
        <P>A film has one soundtrack on one timeline. A game cannot work that way for most of its sound, because you decide what happens and when. So game sound is built from behaviors that wait for the game to ask for them.</P>
        <P>The game asks in three ways. It can START a sound, CHANGE a sound that is already playing, or change the MIX. This page is about the first two.</P>
        <Terms items={TERMS} />
      </Step>
      <Step n={2}>
        <Do>Turn SOUND on. Press OPEN DOOR. Then switch GEN 1 on to start the generator.</Do>
        <P>Each press posts an event: the game calls out a name, and the audio side starts the sounds behind that name. The log shows both halves, the game’s request and the audio side’s answer.</P>
        <ActivityLog state={s} lines={5} />
      </Step>
      <Step n={3}>
        <Do>With the generator running, move the SPEED slider.</Do>
        <P>The hum rises and falls, and the log prints VALUE lines but no new START. The same instance is still playing. Only a value on it changed. That is the difference between an event and a parameter.</P>
        <P>The rings around the generator show its sound at your position: bluer when faint, toward red when loud. They spread faster as SPEED rises. With the door closed the sound is quieter and has less treble. Open the door and listen again.</P>
        <Note tone="mistake">Thinking every change needs a new sound file played from its start. Often the sound keeps playing and one value on it moves.</Note>
        <Note>No sound where you are? The log and the rings in the picture tell you the same thing your ears would.</Note>
      </Step>
      <Step n={4}>
        <P>Do each of these once. Each one is marked done when it really happens in the scene.</P>
        <GoalChips goals={goals} latched={latched} />
      </Step>
      <Step n={5}>
        <UnderstandingCheck
          eyebrow="CHECK YOURSELF"
          question="The generator is running. The game raises its speed. What does the audio side do?"
          options={[
            'Changes the speed value on the instance that is already playing',
            'Stops the sound and plays a faster sound file from its start',
            'Posts the generator event a second time',
            'Turns all the sound effects up together',
          ]}
          correct={0}
          explain="Speed is a parameter. The instance keeps playing and its value moves, so the hum changes with no gap and nothing restarts."
          wrong={[
            undefined,
            'A restart would leave a gap every time the speed moved.',
            'Posting the event again asks for another start. This generator ignores a second start while it is running, and its speed would still not have changed.',
            'That makes all effects louder. It cannot change one generator’s pitch.',
          ]}
          onCorrect={() => setCheck(true)}
        />
      </Step>
    </GaRack>
  );
}

export const P02: PageDef = { title: 'Sound that reacts', short: 'REACTS', Component: Page, manualDone: true, rack: true, guide: G02 };
