/**
 * Page 9 — VARIATION AND LAYERS.
 *
 * Footsteps: with variation OFF the same take plays every time (the
 * machine-gun effect); with it ON the take changes and never repeats
 * immediately; with AVOID REPEAT off a take may play twice in a row. The
 * strip of takes shows it without sound: each tile is the take one step
 * really played, read from the instance (pages/data/chbScene
 * `chbNoteTakes`). It keeps the same number of takes as the model's own
 * record (GA_TAKES_MAX), so the strip in the lesson and the one on the
 * display show the same steps.
 *
 * The door: ONE event, two layers (the door, and a second later the loose
 * latch). The log shows one line that reads EVENT Play_Door and two START
 * lines.
 *
 * Four keys: LEVEL (the lane), STEP (one foot contact, in place, so the
 * surface stays the same for the comparison), the door (its own key, as on
 * pages 2 and 6, so its log lines are read in the lesson with no tray in the
 * way) and the SETUP tray: three settings, one row each, and nothing else
 * (a tray covers the well and has little room: lead's decision 15).
 *
 * Common mistake taught against: unlimited randomness, or secondary details
 * that bury the action.
 */
import { useRef, useState } from 'react';
import type { PageCtx, PageDef } from '../../kit/PagedLab';
import type { DockParam } from '../../rack/rackTypes';
import { UnderstandingCheck } from '../../tuning/components/check';
import { colors } from '../../../../theme/tokens';
import { GaRack, masterKey } from '../GaLab';
import { ActivityLog, Do, GoalChips, Look, Note, P, Step, Terms, useVisitGoals } from '../bits';
import { gaTerms } from '../gaTerms';
import { GA_TAKES_MAX, type GaOptions } from '../model/gaModel';
import { gaDispatch, gaGet, useGa } from '../model/gaStore';
import { TrayBox, TrayChip, TrayRow, onOff, useCountWhen } from './chbBits';
import { CHB_FOOTSTEP_ASSETS, CHB_SURFACES, chbDoorLayers, chbNoteTakes, chbSteps, type ChbTake } from './data/chbScene';
import { G09 } from './guides/p09';
import { doorKey, useSince } from './shared';

const ASSETS: readonly string[] = [...CHB_FOOTSTEP_ASSETS, 'door', 'door_close', 'door_rattle'];
const TERMS = gaTerms('Sound variation', 'Random container', 'Sequence container', 'Avoid-repeat setting', 'Machine-gun effect', 'Pitch randomization');

/** Change one setting, only if it really changes (the model counts each one). */
function setOption<K extends 'variation' | 'avoidRepeat' | 'doorRattle'>(key: K, value: GaOptions[K]): void {
  if (gaGet().options[key] === value) return;
  const patch: Partial<GaOptions> = {};
  patch[key] = value;
  gaDispatch({ type: 'option', patch });
}

/** The SETUP tray: how a footstep chooses its take, and the door's second
 *  layer. Two rows of switch chips (each says ON or OFF in words), no note
 *  and no log: about 138 pt, inside the tray's 196 (lead's decision 15).
 *  What a press did is on the display: the VARIATION readout, LAST TAKE,
 *  and the takes strip. */
function SetupTray() {
  const s = useGa();
  const o = s.options;
  return (
    <TrayBox>
      {/* with variation off only the first take plays: the head says so */}
      <TrayRow head={o.variation ? 'FOOTSTEP TAKES' : 'FOOTSTEP TAKES · ONLY TAKE 1 PLAYS'}>
        <TrayChip label={onOff('VARIATION', o.variation)} selected={o.variation} onPress={() => setOption('variation', !o.variation)} />
        <TrayChip label={onOff('AVOID REPEAT', o.avoidRepeat)} selected={o.avoidRepeat} onPress={() => setOption('avoidRepeat', !o.avoidRepeat)} />
      </TrayRow>
      <TrayRow head="THE DOOR EVENT · ITS SECOND LAYER">
        <TrayChip label={onOff('RATTLE', o.doorRattle)} selected={o.doorRattle} onPress={() => setOption('doorRattle', !o.doorRattle)} />
      </TrayRow>
    </TrayBox>
  );
}

function Page({ ctx }: { ctx: PageCtx }) {
  const s = useGa();
  const { since, kinds } = useSince(s);
  const [layersCheck, setLayersCheck] = useState(false);
  const [takesCheck, setTakesCheck] = useState(false);
  const o = s.options;

  // the takes that really played on this visit, read from each instance
  const takes = useRef<readonly ChbTake[]>([]);
  takes.current = chbNoteTakes(takes.current, s, 'player', GA_TAKES_MAX);
  const last = takes.current[takes.current.length - 1];

  // steps the model took while variation was off
  const plainSteps = useCountWhen(chbSteps(s, 'player'), !o.variation);
  // different takes that started on ONE surface
  const mostTakes = Math.max(...CHB_SURFACES.map((su) => kinds(`take:footstep:${su}:`)));

  const goals = [
    { label: 'Take three steps with variation off', hit: plainSteps >= 3 },
    { label: 'Play three different takes on one surface', hit: mostTakes >= 3 },
    { label: 'Open the door: one event, two layers', hit: since('post:door_open') > 0 && chbDoorLayers(s) >= 2 },
    { label: 'Pass both checks', hit: layersCheck && takesCheck },
  ];
  const latched = useVisitGoals(ctx, goals);

  const stepHere: DockParam = {
    kind: 'action',
    id: 'step-player',
    label: 'STEP',
    onPress: () => gaDispatch({ type: 'step', who: 'player', dx: 0, dy: 0 }),
    tint: colors.amber,
  };
  const setupKey: DockParam = {
    kind: 'group',
    id: 'setup',
    label: 'SETUP',
    valueLabel: o.variation ? 'VAR ON' : 'VAR OFF',
    valueA11y: `variation ${o.variation ? 'on' : 'off'}, avoid repeat ${o.avoidRepeat ? 'on' : 'off'}, rattle layer ${o.doorRattle ? 'on' : 'off'}`,
    render: () => <SetupTray />,
  };

  return (
    <GaRack
      spec={{
        keys: [masterKey(s), stepHere, doorKey(s), setupKey],
        initialParam: 'master',
        hud: 'takes',
        readouts: [
          { k: 'VARIATION', kNarrow: 'VARY', v: o.variation ? 'ON' : 'OFF' },
          { k: 'LAST TAKE', kNarrow: 'TAKE', v: last ? String(last.take) : 'NONE', vA11y: last ? `the last footstep played take ${last.take}` : 'no footstep has played yet' },
        ],
        showNames: true,
        show: { take: true },
        assets: ASSETS,
      }}
    >
      <Step n={1}>
        <Look>Each STEP is one foot contact on the stone path. The strip under the picture shows the last eight takes.</Look>
        <P>The ear notices an exact repeat immediately, so a footstep event holds several takes. A take is one version of the same sound. The event picks one take each time and changes its level and pitch a little.</P>
        <P>A holder that picks at random is a random container. One that plays in a set order is a sequence container. These are Wwise’s names: page 20 has the others. Every take must still sound like the same shoe.</P>
        <Terms items={TERMS} />
      </Step>
      <Step n={2}>
        <Do>In SETUP, switch VARIATION off. Close the tray and press STEP four times. Switch VARIATION on and step again.</Do>
        <P>With variation off, every START line reads take 1 of 4, and the strip joins the takes as SAME TAKE. With it on, the takes change and none plays twice in a row, unless AVOID REPEAT is off.</P>
        <ActivityLog state={s} lines={5} />
      </Step>
      <Step n={3}>
        <Do>Press OPEN DOOR and read the log. Then switch RATTLE off in SETUP and press CLOSE DOOR.</Do>
        <P>The game posted one event. The audio side started two layers: the door, and one second later the loose latch. A layer is part of one event, not a second trigger from the game. With RATTLE off, only the door starts.</P>
        <Note tone="mistake">Unlimited randomness, or details that cover the action. Takes that differ too much stop sounding like one source, and a long, loud rattle hides the door.</Note>
      </Step>
      <Step n={4}>
        <P>Do each of these once. Each one is marked done when it really happens in the scene.</P>
        <GoalChips goals={goals} latched={latched} />
      </Step>
      <Step n={5}>
        <UnderstandingCheck
          eyebrow="QUESTION 1"
          question="You open the door once. The log shows one line that reads EVENT Play_Door, and two START lines. What happened?"
          options={[
            'One event played two layers',
            'The game posted the door event twice',
            'The first sound failed, so it was played again',
            'Two different doors opened',
          ]}
          correct={0}
          explain="The game asked once. The door event holds two layers, the door and the latch rattle, and each layer that plays gets its own START line."
          wrong={[
            undefined,
            'Two posts would print two lines that read EVENT Play_Door. The log shows one.',
            'A sound that cannot start prints a FAULT line. Both of these lines say START.',
            'The scene has one door, and the log names one event. The two START lines are that event’s layers.',
          ]}
          onCorrect={() => setLayersCheck(true)}
        />
        <UnderstandingCheck
          eyebrow="QUESTION 2"
          question="A footstep event has four takes. VARIATION and AVOID REPEAT are on. Take 2 has just played. What can play next?"
          options={[
            'Take 1, 3 or 4, chosen at random',
            'Any of the four takes, chosen at random',
            'Take 3, because the takes play in order',
            'Take 2 again, at a different pitch',
          ]}
          correct={0}
          explain="AVOID REPEAT removes only the take that has just played. Any of the other three can be chosen."
          wrong={[
            undefined,
            'That is AVOID REPEAT · OFF: take 2 could then play twice in a row.',
            'A set order is a sequence container. This event picks at random.',
            'The small pitch change is added to the take that is chosen. It does not let the same take play again.',
          ]}
          onCorrect={() => setTakesCheck(true)}
        />
      </Step>
    </GaRack>
  );
}

export const P09: PageDef = { title: 'Variation and layers', short: 'VARIATION', Component: Page, manualDone: true, rack: true, guide: G09 };
