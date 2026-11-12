/**
 * Page 9 — VARIATION AND LAYERS.
 *
 * Footsteps: with variation OFF the same take plays every time (the
 * machine-gun effect); with it ON the take changes and never repeats at
 * once; with AVOID REPEAT off a take may come twice. The strip of takes
 * shows it without sound: each tile is the take one step really played, read
 * from the instance (pages/data/chbScene `chbNoteTakes`).
 *
 * The door: ONE event, two layers (the door, and a second later the loose
 * latch). The log shows one line that reads EVENT Play_Door and two START
 * lines.
 *
 * Three keys: LEVEL (the lane), STEP (one foot contact, in place, so the
 * surface stays the same for the comparison) and the SETUP tray (the three
 * settings, and the door beside its layer setting).
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
import { ActivityLog, Do, GoalChips, Look, Note, P, Step, Terms, marked, useVisitGoals } from '../bits';
import { gaTerms } from '../gaTerms';
import type { GaOptions } from '../model/gaModel';
import { gaDispatch, gaGet, useGa } from '../model/gaStore';
import { SURFACE_NAME } from '../model/gaWorld';
import { TakeStrip, TrayBox, TrayChip, TrayLog, TrayNote, TrayRow, useCountWhen } from './chbBits';
import { CHB_FOOTSTEP_ASSETS, CHB_SURFACES, chbDoorLayers, chbNoteTakes, chbSteps, type ChbTake } from './data/chbScene';
import { G09 } from './guides/p09';
import { useSince } from './shared';

const ASSETS: readonly string[] = [...CHB_FOOTSTEP_ASSETS, 'door', 'door_rattle'];
const TERMS = gaTerms('Sound variation', 'Random container', 'Sequence container', 'Avoid-repeat setting', 'Machine-gun effect', 'Pitch randomization');

/** Change one setting, only if it really changes (the model counts each one). */
function setOption<K extends 'variation' | 'avoidRepeat' | 'doorRattle'>(key: K, value: GaOptions[K]): void {
  if (gaGet().options[key] === value) return;
  const patch: Partial<GaOptions> = {};
  patch[key] = value;
  gaDispatch({ type: 'option', patch });
}

/** The SETUP tray: how a footstep chooses its take, and the door's layers. */
function SetupTray() {
  const s = useGa();
  const o = s.options;
  return (
    <TrayBox>
      <TrayRow head="FOOTSTEP TAKES">
        <TrayChip label={marked('VARIATION ON', o.variation)} selected={o.variation} onPress={() => setOption('variation', true)} />
        <TrayChip label={marked('VARIATION OFF', !o.variation)} selected={!o.variation} onPress={() => setOption('variation', false)} />
      </TrayRow>
      <TrayRow head="THE SAME TAKE TWICE IN A ROW">
        <TrayChip label={marked('AVOID REPEAT ON', o.avoidRepeat)} selected={o.avoidRepeat} onPress={() => setOption('avoidRepeat', true)} />
        <TrayChip label={marked('AVOID REPEAT OFF', !o.avoidRepeat)} selected={!o.avoidRepeat} onPress={() => setOption('avoidRepeat', false)} />
      </TrayRow>
      {!o.variation ? <TrayNote>With variation off only the first take plays, so this setting changes nothing.</TrayNote> : null}
      {/* short labels: the three chips keep one line on a phone */}
      <TrayRow head="THE DOOR EVENT · ITS RATTLE LAYER">
        <TrayChip label={marked('RATTLE ON', o.doorRattle)} selected={o.doorRattle} onPress={() => setOption('doorRattle', true)} />
        <TrayChip label={marked('RATTLE OFF', !o.doorRattle)} selected={!o.doorRattle} onPress={() => setOption('doorRattle', false)} />
        <TrayChip label={s.doorOpen ? 'CLOSE DOOR' : 'OPEN DOOR'} onPress={() => gaDispatch({ type: 'door' })} />
      </TrayRow>
      {/* four lines: the event's GAME line and its two STARTs stay in view after the "ended" line */}
      <TrayLog state={s} lines={4} />
    </TrayBox>
  );
}

function Page({ ctx }: { ctx: PageCtx }) {
  const s = useGa();
  const { since, kinds } = useSince(s);
  const [check, setCheck] = useState(false);
  const o = s.options;

  // the takes that really played on this visit, read from each instance
  const takes = useRef<readonly ChbTake[]>([]);
  takes.current = chbNoteTakes(takes.current, s);
  const last = takes.current[takes.current.length - 1];

  // steps the model took while variation was off
  const plainSteps = useCountWhen(chbSteps(s, 'player'), !o.variation);
  // different takes that started on ONE surface
  const mostTakes = Math.max(...CHB_SURFACES.map((su) => kinds(`take:footstep:${su}:`)));

  const goals = [
    { label: 'Take three steps with variation off', hit: plainSteps >= 3 },
    { label: 'Play three different takes on one surface', hit: mostTakes >= 3 },
    { label: 'Open the door: one event, two layers', hit: since('post:door_open') > 0 && chbDoorLayers(s) >= 2 },
    { label: 'Pass the check', hit: check },
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
        keys: [masterKey(s), stepHere, setupKey],
        initialParam: 'master',
        readouts: [
          { k: 'VARIATION', v: o.variation ? 'ON' : 'OFF' },
          { k: 'LAST TAKE', v: last ? String(last.take) : '—', vA11y: last ? `the last footstep played take ${last.take}` : 'no footstep has played yet' },
        ],
        showNames: true,
        assets: ASSETS,
      }}
    >
      <Step n={1}>
        <Look>You stand on the stone path, and each STEP makes one foot contact there. The strip below shows which take played, oldest on the left.</Look>
        <P>The ear notices an exact repeat immediately. So a footstep event holds several takes. A take is one version of the same sound. The event picks one take each time and changes its level and pitch a little. In many engines a pitch change changes playback speed, so a higher step is also shorter.</P>
        <P>A holder that picks at random is a random container. A holder that plays in a set order is a sequence container. Variation has a limit: every take still sounds like the same shoe on the same ground.</P>
        <Terms items={TERMS} />
      </Step>
      <Step n={2}>
        <Do>In SETUP, choose VARIATION OFF. Close the tray and press STEP four times. Choose VARIATION ON and step again.</Do>
        <P>With variation off, every START line reads take 1 of 4, and the strip shows one number. With it on, the takes change and none plays twice in a row. With AVOID REPEAT OFF, a take can come twice.</P>
        <TakeStrip takes={takes.current} surfaceName={(su) => SURFACE_NAME[su]} />
        <ActivityLog state={s} lines={5} />
      </Step>
      <Step n={3}>
        <Do>In SETUP, with RATTLE ON, press OPEN DOOR in the same tray and read the log lines below. Choose RATTLE OFF and press CLOSE DOOR.</Do>
        <P>The game posted one event. The audio side started two layers: the door, and one second later the loose latch. A layer is part of one event, not a second trigger from the game. With the layer off, one sound starts.</P>
        <Note tone="mistake">Unlimited randomness, or details that cover the action. Takes that differ too much stop sounding like one source, and a long, loud rattle hides the door.</Note>
      </Step>
      <Step n={4}>
        <P>Do each of these once. Each one is marked done when it really happens in the scene.</P>
        <GoalChips goals={goals} latched={latched} />
      </Step>
      <Step n={5}>
        <UnderstandingCheck
          eyebrow="CHECK YOURSELF"
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
          onCorrect={() => setCheck(true)}
        />
      </Step>
    </GaRack>
  );
}

export const P09: PageDef = { title: 'Variation and layers', short: 'VARIATION', Component: Page, manualDone: true, rack: true, guide: G09 };
