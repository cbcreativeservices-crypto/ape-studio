/**
 * Page 5 — KINDS OF GAME SOUND (handoff lesson 4 and section 6).
 *
 * The families of game sound and what each is for (pages/data/gaFamilies).
 * The learner plays them from one PLAY tray, solos a mix category to hear
 * what it holds, and finds that the overheat ALARM — a quiet sound from an
 * object in the world — belongs to the EFFECTS category and carries the most
 * important message in the scene. Importance is not loudness, and it is not
 * the family either.
 *
 * WHAT THE MODEL REALLY DOES (read before changing the text):
 *   - SCENE is the `scene` action: both ambience beds and the fountain;
 *   - DOOR starts two parts (the door, then its rattle 1 s later) and CRATE
 *     starts two (the impact, then debris): one designed sound, several
 *     voices. Both details are on: every page opens with the default options;
 *   - STEP is a step IN PLACE (walk audit W1 F08): this page has no FACING
 *     key, and a walking step carried YOU through the open door with no way
 *     back. YOU stay where the page opened, on the stone path;
 *   - the alarm is on the EFFECTS bus, at the generator. From where YOU
 *     stand it is quieter than the fountain with the door open AND closed;
 *     closing the door makes it 9 dB lower still and low-passed at 900 Hz
 *     (the wall). Step 3 says only that (test/gameAudioChAFamilies);
 *   - a solo silences the other buses; their instances keep running;
 *   - the PLAY tray covers the well, so its top shows the guide's words and
 *     the newest log lines (walk audit W1 F04): step 2 asks for both.
 *
 * The page does not clear its solo when it is left: every page opens with
 * no solo (GaRack's `enterPage`).
 *
 * Common mistake taught against: calling every environmental sound
 * unimportant background.
 */
import { useState } from 'react';
import { colors } from '../../../../theme/tokens';
import type { PageCtx, PageDef } from '../../kit/PagedLab';
import type { DockParam } from '../../rack/rackTypes';
import { UnderstandingCheck } from '../../tuning/components/check';
import type { GaBus } from '../engine/gaEngineProtocol';
import { GaRack, masterKey } from '../GaLab';
import { ActivityLog, Caption, Do, GoalChips, Look, Note, P, Step, Terms, useVisitGoals } from '../bits';
import { gaTerms } from '../gaTerms';
import { gaPlaying, type GaState } from '../model/gaModel';
import { gaDispatch, gaGet, useGa } from '../model/gaStore';
import { ChACard, ChARow, ChATray, ChATrayGrid, ChATrayResult } from './chAViews';
import { GA_FAMILIES, GA_FAMILIES_TO_TRY, GA_PLAY, GA_SOLO_CATEGORIES, GA_SOLO_OFF, gaFamiliesTried, gaSoloKeyWord, gaSoloNow, gaSoloPlan } from './data/gaFamilies';
import { G05 } from './guides/p05';
import { useSince } from './shared';

const ASSETS = ['amb_room', 'amb_yard', 'fountain', 'fs_stone_1', 'fs_stone_2', 'fs_stone_3', 'fs_stone_4', 'door', 'door_rattle', 'impact', 'debris', 'vo_greeting', 'ui_confirm', 'alarm'] as const;
const TERMS = gaTerms('Ambient loop', 'Gameplay sound effect', 'Interface sound', 'NPC bark', 'Diegetic Sound', 'Non-Diegetic Sound', 'Foley');

const sceneRunning = (s: GaState): boolean => gaPlaying(s, 'bed_yard') || gaPlaying(s, 'bed_room') || gaPlaying(s, 'fountain');

/** Leave exactly this category soloed (null = none). */
function setSolo(pick: GaBus | null): void {
  for (const step of gaSoloPlan(gaGet().bus, pick)) gaDispatch({ type: 'bus', bus: step.bus, solo: step.solo });
}

/** The PLAY tray: every sound this page plays, in one sheet that fits a
 *  phone with the strip in place (196 pt): what the last press did on top
 *  (the guide's words, the newest log lines), then seven chips in two rows.
 *  SCENE and ALARM keep playing and say so in their names (· ON / · OFF);
 *  the other five play once per press. */
function PlayTray() {
  const s = useGa();
  const scene = sceneRunning(s);
  const alarm = gaPlaying(s, 'alarm');
  return (
    <ChATray>
      <ChATrayResult state={s} />
      <ChATrayGrid
        label="Sounds to play"
        cols={4}
        chips={[
          { label: scene ? 'SCENE · ON' : 'SCENE · OFF', on: scene, onPress: () => gaDispatch({ type: 'scene', on: !scene }) },
          { label: alarm ? 'ALARM · ON' : 'ALARM · OFF', on: alarm, onPress: () => gaDispatch({ type: 'alarm', on: !alarm }) },
          { label: 'STEP', on: false, onPress: () => gaDispatch(GA_PLAY.STEP) },
          { label: s.doorOpen ? 'CLOSE DOOR' : 'OPEN DOOR', on: false, onPress: () => gaDispatch(GA_PLAY['OPEN DOOR']) },
          { label: 'CRATE', on: false, onPress: () => gaDispatch(GA_PLAY.CRATE) },
          { label: 'GUIDE LINE', on: false, onPress: () => gaDispatch(GA_PLAY['GUIDE LINE']) },
          { label: 'INTERFACE', on: false, onPress: () => gaDispatch(GA_PLAY.INTERFACE) },
        ]}
      />
    </ChATray>
  );
}

function Page({ ctx }: { ctx: PageCtx }) {
  const s = useGa();
  const { since, kinds } = useSince(s);
  const [check, setCheck] = useState(false);

  const tried = gaFamiliesTried(since);
  const alarm = gaPlaying(s, 'alarm');
  const solo = gaSoloNow(s.bus);
  const soloDef = GA_SOLO_CATEGORIES.find((c) => c.bus === solo);
  const soloWord = solo === null ? 'OFF' : (soloDef?.label ?? solo.toUpperCase());

  const goals = [
    { label: 'Play six kinds of sound', hit: tried >= GA_FAMILIES_TO_TRY },
    { label: 'Solo two categories', hit: kinds('solo:') >= 2 },
    { label: 'Solo the ALARM’s category while it runs', hit: alarm && s.bus.sfx.solo },
    { label: 'Pass the check', hit: check },
  ];
  const latched = useVisitGoals(ctx, goals);

  const playKey: DockParam = {
    kind: 'group',
    id: 'play',
    label: 'PLAY',
    valueLabel: `${tried} TRIED`,
    valueA11y: `${tried} kinds of sound played on this visit`,
    render: () => <PlayTray />,
  };
  const soloKey: DockParam = {
    kind: 'options',
    id: 'solo',
    label: 'SOLO',
    // ON or OFF: the readout carries the category's one name
    valueLabel: gaSoloKeyWord(solo),
    valueA11y: solo === null ? 'no category is soloed' : `only the ${soloWord.toLowerCase()} category is playing`,
    options: [
      { id: GA_SOLO_OFF, label: 'OFF', blurb: 'Every category plays.' },
      ...GA_SOLO_CATEGORIES.map((c) => ({ id: c.bus, label: c.label, blurb: c.blurb })),
    ],
    selectedId: solo ?? GA_SOLO_OFF,
    onSelect: (id) => setSolo(id === GA_SOLO_OFF ? null : (id as GaBus)),
    sticky: true,
  };

  return (
    <GaRack
      spec={{
        keys: [masterKey(s), playKey, soloKey],
        initialParam: 'master',
        hud: 'cats',
        readouts: [
          { k: 'SOLO', v: soloWord, vA11y: solo === null ? 'no category is soloed' : `only ${soloWord.toLowerCase()} is playing`, flex: 1.4 },
          { k: 'ALARM', v: alarm ? 'ON' : 'OFF', vA11y: alarm ? 'the overheat alarm is running' : 'the overheat alarm is off', tint: alarm ? colors.red : colors.textSub },
        ],
        showNames: true,
        assets: ASSETS,
      }}
    >
      <Step n={1}>
        <Look>One scene holds many kinds of sound. The strip under the picture lights each kind while it plays.</Look>
        <P>Game sounds are grouped into families by the job each one does.</P>
        <ChACard eyebrow="SOUND FAMILIES" title="WHAT EACH ONE IS FOR">
          {GA_FAMILIES.map((f) => (
            <ChARow key={f.id} label={f.name.toUpperCase()}>
              {`${f.what} ${f.here}`}
            </ChARow>
          ))}
        </ChACard>
        <P>A sound that belongs to the world is diegetic. A sound that exists only for the player, such as an interface sound, is non-diegetic.</P>
        <Terms items={TERMS} />
      </Step>
      <Step n={2}>
        <Do>Open PLAY. Switch SCENE on, then press STEP, OPEN DOOR, CRATE, GUIDE LINE and INTERFACE. The tray’s top shows the guide’s words and the newest log lines.</Do>
        <P>After OPEN DOOR and after CRATE, one press starts two parts: the door and, one second later, its loose latch; the impact, then its debris. One designed sound can be several files and several voices.</P>
        <Caption state={s} />
        <ActivityLog state={s} lines={6} />
      </Step>
      <Step n={3}>
        <Do>In PLAY, switch ALARM on. Then open SOLO and pick AMBIENCE, then EFFECTS.</Do>
        <P>SOLO plays one category alone: AMBIENCE, EFFECTS, DIALOGUE or INTERFACE. A category is also called a bus. On the strip, SOLO marks the other kinds SILENT.</P>
        <P>With AMBIENCE alone, the wind and the fountain stay and the alarm is gone. The alarm comes from one object, the generator, so it is in EFFECTS.</P>
        <P>Where you stand, the alarm is quieter than the fountain. With the door closed it is also dull. Yet its message matters most: the generator is overheating. Importance comes from what a sound tells the player, not from its loudness or its family.</P>
        <Note tone="mistake">Calling every environmental sound unimportant background. A quiet sound from the world can be the one the player most needs to hear.</Note>
      </Step>
      <Step n={4}>
        <P>Do each of these once. Each one is marked done when it really happens in the scene.</P>
        <GoalChips goals={goals} latched={latched} />
      </Step>
      <Step n={5}>
        <UnderstandingCheck
          eyebrow=""
          question="A quiet beeping comes from a machine at the far side of a level. It means the machine is about to fail. How does the audio team treat it?"
          options={[
            'As an important sound, because of what it tells the player',
            'As background, because it comes from the environment',
            'As unimportant, because it is quiet',
            'As an interface sound, because it gives the player information',
          ]}
          correct={0}
          explain="Importance comes from the message. This sound warns the player, so the team makes sure it can be heard, even though it is quiet and comes from the environment."
          wrong={[
            undefined,
            'Where a sound comes from does not set its importance. This one carries a warning.',
            'Importance is not loudness. A quiet sound can be the one the player needs most.',
            'It comes from an object in the world, so the characters could hear it too. An interface sound exists only for the player.',
          ]}
          onCorrect={() => setCheck(true)}
        />
      </Step>
    </GaRack>
  );
}

export const P05: PageDef = { title: 'Kinds of game sound', short: 'SOUNDS', Component: Page, manualDone: true, rack: true, guide: G05 };
