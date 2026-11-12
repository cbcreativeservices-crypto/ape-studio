/**
 * Page 6 — FROM SOURCE TO GAME BUILD (chapter 2 opens).
 *
 * The path of ONE sound, the door: its asset record, the event that plays
 * it, the scene connection that posts the event, and the result in the log.
 * The learner plays the door through the whole chain, then uses the
 * TROUBLESHOOT card: the event asks for a file the build does not contain,
 * a FAULT line names it, and the learner restores it.
 *
 * The cards are read from the lab's own records (pages/data/chbPipeline), so
 * they show what the model really plays. Three keys: LEVEL (the lane), the
 * door, and DOOR FILE (the setting the planted fault `missingDoor` makes
 * wrong). The lesson does not walk through the repair: the card is where
 * the learner finds it.
 *
 * Common mistake taught against: confusing importing a sound with
 * implementing its behavior.
 */
import { useState } from 'react';
import type { PageCtx, PageDef } from '../../kit/PagedLab';
import type { DockParam } from '../../rack/rackTypes';
import { UnderstandingCheck } from '../../tuning/components/check';
import { colors } from '../../../../theme/tokens';
import { GaRack, masterKey } from '../GaLab';
import { ActivityLog, Do, FaultCard, GoalChips, Look, Note, P, Step, Terms, useVisitGoals } from '../bits';
import { gaTerms } from '../gaTerms';
import { gaDispatch, useGa } from '../model/gaStore';
import { ChainCards, useCountWhen } from './chbBits';
import { CHB_MISSING_FILE, doorChain } from './data/chbPipeline';
import { G06 } from './guides/p06';
import { doorKey, doorWord, gaFact, useSince } from './shared';

const ASSETS = ['door', 'door_rattle'] as const;
const TERMS = gaTerms('Audio asset', 'Audio Middleware', 'Sound bank', 'Implementation', 'Audio implementer');
/** The file the door event asks for when the chain is whole. */
const DOOR_FILE = doorChain(false).cards[0].rows[0].v;

function Page({ ctx }: { ctx: PageCtx }) {
  const s = useGa();
  const { since } = useSince(s);
  const [check, setCheck] = useState(false);
  const missing = s.faults.missingDoor;
  const missedCount = since('missingAsset');
  const doorStarts = gaFact(s, 'take:door_open::door');
  // the model logged the missing file on this visit
  const sawMissing = missedCount > 0;
  // the door's own layer really started again, with the file back, after that
  const repaired = useCountWhen(doorStarts, !missing && sawMissing) > 0;

  // THE CARD. It counts only what happened after START THE FAULT was pressed
  // (`startedAt` = how many missing-file lines the visit had by then), so it
  // never reads FIXED before the learner has started it.
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const started = startedAt !== null;
  const seenSinceStart = startedAt !== null && missedCount > startedAt;
  const repairedSinceStart = useCountWhen(doorStarts, seenSinceStart && !missing) > 0;

  const goals = [
    { label: 'Play the door through the whole chain', hit: since('take:door_open::door') > 0 },
    { label: 'Break the chain: the log names the file', hit: sawMissing },
    { label: 'Restore the file: the door plays again', hit: repaired },
    { label: 'Pass the check', hit: check },
  ];
  const latched = useVisitGoals(ctx, goals);
  const setMissing = (on: boolean) => {
    if (on !== missing) gaDispatch({ type: 'fault', patch: { missingDoor: on } });
  };

  const fileKey: DockParam = {
    kind: 'options',
    id: 'door-file',
    label: 'DOOR FILE',
    valueLabel: missing ? 'MISSING' : 'FOUND',
    valueA11y: missing ? `the door event asks for ${CHB_MISSING_FILE}, which is not in the build` : `the door event asks for ${DOOR_FILE}, which is in the build`,
    options: [
      { id: 'ok', label: DOOR_FILE, blurb: `The door event asks for ${DOOR_FILE}. That file is in the build, so the door layer can play.` },
      { id: 'missing', label: CHB_MISSING_FILE, blurb: `The door event asks for ${CHB_MISSING_FILE}. No file with that name is in the build. The door, the event name and the scene connection are unchanged.` },
    ],
    selectedId: missing ? 'missing' : 'ok',
    onSelect: (id) => setMissing(id === 'missing'),
  };

  return (
    <GaRack
      spec={{
        keys: [masterKey(s), doorKey(s), fileKey],
        initialParam: 'master',
        readouts: [
          { k: 'DOOR', v: doorWord(s) },
          { k: 'DOOR FILE', v: missing ? 'MISSING' : 'FOUND', tint: missing ? colors.red : undefined, vA11y: missing ? 'the file the door event asks for is missing' : 'the file the door event asks for is in the build' },
        ],
        showNames: true,
        assets: ASSETS,
      }}
    >
      <Step n={1}>
        <Look>This page follows one sound: the door. The cards below show its chain, from file to result.</Look>
        <P>A sound reaches a game in stages. First it is planned, recorded or synthesized, edited and named. Then it is imported, given its behavior and connected in the game. Last it is packaged, tested and revised.</P>
        <P>Three different things result. The original asset is the sound file. The authoring data says how it plays: its event, layers, bus and priority. The runtime package is delivered with the game. A build is the packaged version of the game that players run. A sound bank is the kind of package some tools use, not a universal file type.</P>
        <P>This behavior is often set up in audio middleware. The person who connects sounds to the game is an audio implementer.</P>
        <Terms items={TERMS} />
      </Step>
      <Step n={2}>
        <Do>Press OPEN DOOR. Read the four cards from top to bottom.</Do>
        <P>The asset record is the imported file. The event is its authored behavior. The scene connection is where the game posts that event. The result is what the log shows.</P>
        <ChainCards chain={doorChain(missing)} posted={since('post:door_open')} doorWord={doorWord(s)} />
        <ActivityLog state={s} lines={4} />
      </Step>
      <Step n={3}>
        <Do>Now use the TROUBLESHOOT card at the end of this page: start the fault and find the broken link.</Do>
        <P>In the log, GAME lines show that the game asked. START lines show which layers played. A FAULT line names what stopped a layer.</P>
        <Note tone="mistake">Confusing importing a sound with implementing its behavior. A file in a folder is only an asset. The game plays it when an event uses it and the scene posts that event.</Note>
      </Step>
      <Step n={4}>
        <P>Do each of these once. Each one is marked done when it really happens in the scene.</P>
        <GoalChips goals={goals} latched={latched} />
      </Step>
      <Step n={5}>
        <UnderstandingCheck
          eyebrow="CHECK YOURSELF"
          question="The door opens. The log shows the door event posted, then a FAULT line that names a file. Which link in the chain is broken?"
          options={[
            'The event asks for a file that is not in the build',
            'The scene did not post the event',
            'The effects bus is turned down',
            'The sound file was recorded badly',
          ]}
          correct={0}
          explain="The event was posted, so the scene connection works. The FAULT line names a file the build does not contain. The break is between the event and its file."
          wrong={[
            undefined,
            'The log shows the event posted, so the scene did its part. Look one link further along the chain.',
            'A bus that is turned down still starts the sound: the log would show a START line, not a FAULT line.',
            'A poor recording still plays. Here the door layer cannot start, because the build does not contain the file the event names.',
          ]}
          onCorrect={() => setCheck(true)}
        />
      </Step>
      <FaultCard
        title="THE DOOR HAS LOST ITS MAIN SOUND"
        symptom="A tester reports that the door moves, but its main sound does not start. Only the latch rattle plays, one second later. Start the fault, then press the door key. It reads OPEN DOOR or CLOSE DOOR."
        // "in" from START THE FAULT until the door has really played again
        armed={started && (missing || !repairedSinceStart)}
        fixed={started && repairedSinceStart && !missing}
        onStart={() => {
          setStartedAt(missedCount);
          setMissing(true);
        }}
        hints={[
          'Press the door key and read the newest lines of the log. Is the event posted?',
          'A FAULT line names a file. Compare that name with FILE on the asset record card.',
          'Open DOOR FILE in the dock and choose the file that is in the build. Then press the door key again.',
        ]}
        why="The event was posted every time, so the scene connection was fine. The event asked for a file name that the build does not contain, so the door layer could not play. Only the rattle layer played. Importing the right file is not enough: the event has to point at it."
      />
    </GaRack>
  );
}

export const P06: PageDef = { title: 'From source to game build', short: 'PIPELINE', Component: Page, manualDone: true, rack: true, guide: G06 };
