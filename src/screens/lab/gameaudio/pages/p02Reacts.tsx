/**
 * Page 2 — SOUND THAT REACTS (the lab's first idea).
 *
 * A game action can START a sound (an event) or CHANGE a sound that is
 * already playing (a parameter). The learner opens the door, starts the
 * generator, and moves its SPEED while it runs — and reads in the activity
 * log that the third action started nothing new.
 *
 * WHAT THE MODEL REALLY DOES (read before changing the text; held by
 * test/gameAudioChAFamilies, "page 2"):
 *   - SPEED is stored on the MACHINE (the generator), not on the event and
 *     not only on the playing instance: a value set while it is off is kept,
 *     and the instance that plays follows it (lead's decision 6, accuracy
 *     audit A4);
 *   - one SPEED drag is ONE VALUE line, updated, ending "· N changes"; no
 *     START line is added;
 *   - the door's one event, Play_Door, plays the OPENING take (door_open.wav)
 *     or the CLOSING take (door_close.wav), then the latch rattle 1 s later;
 *   - a generator's rings leave more often, and sit closer, as SPEED rises.
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
        <Look>You are the figure on the stone path. The generator is in the workshop, behind the door.</Look>
        <P>A film has one soundtrack on one timeline. In a game you decide what happens and when. So most game sound waits for the game to ask for it.</P>
        <P>The game asks in three ways. It can START a sound, CHANGE a sound that is already playing, or change the MIX. This page is about the first two.</P>
        <Terms items={TERMS} />
      </Step>
      <Step n={2}>
        <Do>Turn SOUND on. Press OPEN DOOR. Then switch GEN 1 on to start the generator.</Do>
        <P>Each press posts an event: the game calls out a name, and the audio side starts the sounds behind that name. The door’s one event plays an opening take or a closing take.</P>
        <ActivityLog state={s} lines={5} />
      </Step>
      <Step n={3}>
        <Do>With the generator running, move the SPEED slider.</Do>
        <P>The hum rises and falls. The log prints one VALUE line that counts the changes, and no new START. The same instance is still playing. The speed value is kept on the generator, and the instance follows it. That is the difference between an event and a parameter.</P>
        <P>The rings around the generator show its sound at your position: bluer when faint, toward red when loud. They leave more often as SPEED rises.</P>
        <Note tone="mistake">Thinking every change needs a new sound file played from its start. Often the sound keeps playing and one value moves.</Note>
        <Note>Cannot play sound right now? The log and the rings show what your ears would hear.</Note>
      </Step>
      <Step n={4}>
        <P>Do each of these once. Each one is marked done when it really happens in the scene.</P>
        <GoalChips goals={goals} latched={latched} />
      </Step>
      <Step n={5}>
        <UnderstandingCheck
          eyebrow=""
          question="The generator is running. The game raises its speed. What does the audio side do?"
          options={[
            'Changes its speed value; the playing instance follows it',
            'Stops the sound and plays a faster sound file from its start',
            'Posts the generator event a second time, for a faster copy',
            'Turns every sound effect up together, the generator’s too',
          ]}
          correct={0}
          explain="Speed is a parameter. Its value is kept on the generator, and the playing instance follows it, so the hum changes with no gap and nothing restarts."
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
