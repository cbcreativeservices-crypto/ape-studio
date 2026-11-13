/**
 * Page 6 — FROM SOURCE TO GAME BUILD (chapter 2 opens).
 *
 * The path of ONE sound, the door: its asset record, the event that asks for
 * it, the scene connection that posts the event, and the result in the log.
 * The learner plays the door through the whole chain, both ways (one event,
 * two files: door_open.wav and door_close.wav), then uses the TROUBLESHOOT
 * card: the event asks for a file the build does not contain, a FAULT line
 * names it, and the learner restores it.
 *
 * The cards are read from the lab's own records (pages/data/chbPipeline), so
 * they show what the model really plays. Three keys: LEVEL (the lane), the
 * door, and DOOR FILE (the setting the planted fault `missingDoor` makes
 * wrong). The lesson does not walk through the repair: the card is where
 * the learner finds it.
 *
 * A PLANTED FAULT DOES NOT NAME ITSELF (lead's decision 10). From START THE
 * FAULT until the learner has produced the symptom (the model has logged the
 * missing file on a door press since then), nothing announces it: the DOOR
 * FILE readout reads "?", the DOOR FILE key is locked, and the chain carries
 * no mark and no verdict (it still shows the true file name the event asks
 * for, as a real tool would). After the first FAULT line they name it.
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
import { CHB_MISSING_FILE, doorChain, doorFile } from './data/chbPipeline';
import { G06 } from './guides/p06';
import { doorKey, doorWord, gaFact, useSince } from './shared';

const ASSETS = ['door', 'door_close', 'door_rattle'] as const;
const TERMS = gaTerms('Audio pipeline', 'Audio asset', 'Audio Middleware', 'Sound bank', 'Implementation', 'Audio implementer');
/** The two files the door event asks for when the chain is whole. */
const OPEN_FILE = doorFile(false);
const CLOSE_FILE = doorFile(true);

function Page({ ctx }: { ctx: PageCtx }) {
  const s = useGa();
  const { since } = useSince(s);
  const [check, setCheck] = useState(false);
  const missing = s.faults.missingDoor;
  const missedCount = since('missingAsset');
  // the door's own layer started, with either of its two files
  const doorStarts = gaFact(s, 'take:door_open::door') + gaFact(s, 'take:door_open::door_close');
  const doorStartsHere = since('take:door_open::door') + since('take:door_open::door_close');
  const posted = since('post:door_open');
  // the door last CLOSED on this visit: card 1 shows the closing take's record
  const closing = !s.doorOpen && posted > 0;
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
  // planted by the card and not yet found: nothing on the page names it
  const unnamed = started && missing && !seenSinceStart;
  const armed = started && (missing || (seenSinceStart && !repairedSinceStart));
  const fixed = started && seenSinceStart && repairedSinceStart && !missing;

  const goals = [
    { label: 'Play the door through the whole chain', hit: doorStartsHere > 0 },
    { label: 'Break the chain: the log names the file', hit: sawMissing },
    { label: 'Restore the file: the door plays again', hit: repaired },
    { label: 'Pass the check', hit: check },
  ];
  const latched = useVisitGoals(ctx, goals);
  const setMissing = (on: boolean) => {
    if (on !== missing) gaDispatch({ type: 'fault', patch: { missingDoor: on } });
  };

  const fileWord = unnamed ? '?' : missing ? 'MISSING' : 'FOUND';
  const fileA11y = unnamed
    ? 'the build has not been asked for the door’s file since the fault began: press the door key'
    : missing
      ? `the door event asks for ${CHB_MISSING_FILE}, which is not in the build`
      : `the door event asks for ${OPEN_FILE} and ${CLOSE_FILE}, which are in the build`;
  const fileKey: DockParam = {
    kind: 'options',
    id: 'door-file',
    label: 'DOOR FILE',
    valueLabel: fileWord,
    valueA11y: fileA11y,
    options: [
      { id: 'ok', label: OPEN_FILE, blurb: `The door layer asks for ${OPEN_FILE} when the door opens and for ${CLOSE_FILE} when it closes. Both files are in the build, so the layer can play.` },
      { id: 'missing', label: CHB_MISSING_FILE, blurb: `The door layer asks for ${CHB_MISSING_FILE}, whichever way the door moves. No file with that name is in the build. The door, the event name and the scene connection are unchanged.` },
    ],
    selectedId: missing ? 'missing' : 'ok',
    onSelect: (id) => setMissing(id === 'missing'),
    locked: unnamed ? 'Press the door key first and read the log. Then DOOR FILE opens.' : undefined,
  };

  return (
    <GaRack
      spec={{
        keys: [masterKey(s), doorKey(s), fileKey],
        initialParam: 'master',
        hud: 'chain',
        readouts: [
          { k: 'DOOR', v: doorWord(s) },
          { k: 'DOOR FILE', v: fileWord, tint: missing && !unnamed ? colors.red : undefined, vA11y: fileA11y },
        ],
        showNames: true,
        assets: ASSETS,
      }}
    >
      <Step n={1}>
        <Look>This page follows one sound, the door, from its file to the result.</Look>
        <P>A sound reaches a game in stages: it is made, then imported and connected, then packaged with the game.</P>
        <P>Three things come out of this work, and they are not the same. The asset is the sound file. The authoring data says how it plays: which event uses it and where it is sent. The build is the packaged game that players run, with the sounds inside. Some tools pack the sounds into sound banks: a sound bank is one kind of package, not a universal file type.</P>
        <Terms items={TERMS} />
      </Step>
      <Step n={2}>
        <Do>Press OPEN DOOR. Read the three cards, then the log under RESULT. Press CLOSE DOOR and read card 1 again.</Do>
        <P>The event asks for files by name. Its two parts are called layers: the door and the latch rattle. The strip under the picture shows the rattle start one second later. The scene connection is where the game posts the event. Closing the door posts the same event, and the door layer asks for a second file.</P>
        <ChainCards chain={doorChain(missing, { closing, named: !unnamed })} posted={posted} doorWord={doorWord(s)} />
        <ActivityLog state={s} lines={5} />
      </Step>
      <Step n={3}>
        <Do>Now go to the TROUBLESHOOT card in step 4. Start the fault, then find the broken link.</Do>
        <P>In the log, GAME lines show that the game asked. START lines show which layers played. A FAULT line names what stopped a layer.</P>
        <Note tone="mistake">Confusing importing a sound with implementing its behavior. A file in a folder is only an asset until an event uses it.</Note>
      </Step>
      <Step n={4}>
        <P>Do each of these once. Each one is marked done when it really happens in the scene.</P>
        <GoalChips goals={goals} latched={latched} />
        <FaultCard
          title="THE DOOR HAS LOST ITS MAIN SOUND"
          symptom="A tester reports that the door moves, but its main sound does not start. Only the latch rattle plays, one second later. Start the fault, then press the door key. It reads OPEN DOOR or CLOSE DOOR."
          // active from START THE FAULT until the door has really played again
          armed={armed}
          fixed={fixed}
          seen={seenSinceStart}
          onStart={() => {
            setStartedAt(missedCount);
            setMissing(true);
          }}
          hints={[
            'Press the door key and read the newest lines of the log. Is the event posted?',
            'A FAULT line names a file. Find that name on the EVENT card, and compare it with FILE on the asset record card.',
            'Open DOOR FILE in the dock and choose the file that is in the build. Then press the door key again.',
          ]}
          why="The event was posted every time, so the scene connection was fine. The event asked for a file name that the build does not contain, so the door layer could not play. Only the rattle layer played. Importing the right file is not enough: the event has to point at it."
        />
        {armed ? <ActivityLog state={s} lines={4} /> : null}
      </Step>
      <Step n={5}>
        <UnderstandingCheck
          eyebrow="QUESTION"
          question="The door opens. The log shows the door event posted, then a FAULT line that names a file. Which link in the chain is broken?"
          options={[
            'The event asks for a file that is not in the build',
            'The scene connection did not post the event for this door',
            'The effects bus is turned down, so the layer is silent',
            'The sound file was recorded badly and cannot be used',
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
    </GaRack>
  );
}

export const P06: PageDef = { title: 'From source to game build', short: 'PIPELINE', Component: Page, manualDone: true, rack: true, guide: G06 };
