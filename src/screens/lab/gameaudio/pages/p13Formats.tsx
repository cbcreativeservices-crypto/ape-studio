/**
 * Page 13 — OUTPUT FORMATS (Chapter 3, Space).
 *
 * Mono and stereo assets, channel-based layouts, object-based rendering,
 * binaural rendering for headphones, Ambisonics and head tracking are
 * related, not the same; a file's compression format is a different question
 * again. The learner compares three things the device can really do, with
 * the fountain running and by turning:
 *
 *   STEREO         the `pan` action 'stereo' — left / right pan only
 *   HEADPHONE 3D   `pan` 'hrtf' — the platform's own head-related panner,
 *                  live; it needs headphones, and now front and back differ
 *   MONO           the `mono` action — the whole mix folded to one signal
 *
 * The three outputs are PAIRED with the ideas behind them in the text (audit
 * 2, L-15): STEREO and MONO are channel-based audio, HEADPHONE 3D is binaural
 * rendering, and object-based audio is named as a third idea that is not
 * played here. What an OUTPUT choice sends is chcSpace `outputActions`.
 *
 * The 5.1 map in the well (chcSpeakerMap) is a STILL PICTURE of a layout; the
 * page says so, and that the phone is not sending surround.
 *
 * The log shows the OUTPUT choices (MIX lines) and ■ STOP; its empty text
 * says so, and never "nothing has happened" while sounds play (W2-22).
 *
 * Common mistakes taught against: thinking headphones need a separate small
 * speaker for each direction; applying a second spatializer to a signal that is
 * already binaural.
 */
import { useState } from 'react';
import type { PageCtx, PageDef } from '../../kit/PagedLab';
import type { DockParam } from '../../rack/rackTypes';
import { UnderstandingCheck } from '../../tuning/components/check';
import { GaRack } from '../GaLab';
import { ActivityLog, Do, GoalChips, Look, Note, P, Step, Terms, marked, useVisitGoals } from '../bits';
import { gaTerms } from '../gaTerms';
import { gaFact, gaPlaying, type GaState } from '../model/gaModel';
import { gaDispatch, gaGet, useGa } from '../model/gaStore';
import { useRoseWhile } from './chcBits';
import { ChcSpeakerMap } from './chcSpeakerMap';
import { chcSpace, outputActions, outputOf, p13Log, sideWord, type ChcOutput } from './data/chcSpace';
import { G13 } from './guides/p13';
import { facingKey, useSince } from './shared';

const ASSETS = ['fountain', 'amb_room', 'amb_yard', 'gen_hum', 'gen_air', 'ir_room'] as const;
const TERMS = gaTerms('Channel-based audio', 'Object-Based Audio', 'Binaural rendering', 'HRTF', 'Ambisonics', 'Head tracking', 'Downmix');

const OUTPUT_WORD: Record<ChcOutput, string> = { stereo: 'STEREO', hrtf: '3D', mono: 'MONO' };

/** Choose what the device sends (chcSpace `outputActions`). */
function setOutput(o: ChcOutput): void {
  for (const a of outputActions(gaGet(), o)) gaDispatch(a);
}

/** The OUTPUT tray stays open to compare, so the choice in force carries a
 *  mark in its LABEL (a highlight alone is not a state: walk audit W2-24). */
const outputKey = (s: GaState): DockParam => {
  const out = outputOf(s);
  return {
    kind: 'options',
    id: 'output',
    label: 'OUTPUT',
    valueLabel: OUTPUT_WORD[out],
    valueA11y: out === 'hrtf' ? 'headphone 3D' : out,
    sticky: true,
    selectedId: out,
    onSelect: (id) => setOutput(id as ChcOutput),
    options: [
      { id: 'stereo', label: marked('STEREO', out === 'stereo'), blurb: 'Left and right pan only. A source in front of you and one behind you sound the same.' },
      { id: 'hrtf', label: marked('HEADPHONE 3D', out === 'hrtf'), blurb: 'Your device filters each sound for each ear, the way a head would. It needs headphones. Now front and back differ.' },
      { id: 'mono', label: marked('MONO', out === 'mono'), blurb: 'A downmix: both ears get the same signal. Distance still sets the level. Direction is gone: a sound to one side folds up to 3 dB quieter than one ahead (the pan law).' },
    ],
  };
};

const sceneKey = (s: GaState): DockParam => {
  const on = gaPlaying(s, 'fountain');
  return { kind: 'toggle', id: 'scene', label: 'SCENE', value: on, onToggle: () => gaDispatch({ type: 'scene', on: !on }) };
};

function Page({ ctx }: { ctx: PageCtx }) {
  const s = useGa();
  const { since } = useSince(s);
  const [check, setCheck] = useState(false);
  const fountain = chcSpace(s, 'fountain');
  const out = outputOf(s);
  const sourceOn = fountain.playing && !fountain.virtual;
  const turns = gaFact(s, 'turned');
  const turnedStereo = useRoseWhile(turns, sourceOn && out === 'stereo');
  const turned3d = useRoseWhile(turns, sourceOn && out === 'hrtf');
  const goals = [
    { label: 'Turn with STEREO chosen', hit: turnedStereo },
    { label: 'Turn with HEADPHONE 3D chosen', hit: turned3d },
    { label: 'Fold the output to MONO', hit: since('monoOn') > 0 },
    { label: 'Pass the check', hit: check },
  ];
  const latched = useVisitGoals(ctx, goals);

  return (
    <GaRack
      spec={{
        keys: [facingKey(s), outputKey(s), sceneKey(s)],
        initialParam: 'facing',
        hud: 'output',
        readouts: [
          { k: 'FOUNTAIN', kNarrow: 'SOURCE', v: sideWord(fountain.bearingDeg), vA11y: `the fountain is ${sideWord(fountain.bearingDeg).toLowerCase()}` },
          { k: 'OUTPUT', kNarrow: 'OUT', v: OUTPUT_WORD[out], vA11y: out === 'hrtf' ? 'headphone 3D' : out },
        ],
        select: 'fountain',
        assets: ASSETS,
      }}
    >
      <Step n={1}>
        <Look>The rings and the dotted line mark the fountain. The strip under the picture shows your head and what reaches each ear.</Look>
        <P>STEREO and MONO are channel-based audio: each sound is mixed into fixed channels, one for each speaker of a known layout. HEADPHONE 3D is binaural rendering: a headphone signal that seems to surround you.</P>
        <P>Object-based audio is a third idea, not played here. Each sound keeps its position, and a renderer works out the signals as it plays. Game platforms have their own renderers, such as Dolby Atmos, DTS:X, Windows Sonic and Tempest 3D AudioTech.</P>
        <ChcSpeakerMap />
        <Terms items={TERMS} />
      </Step>
      <Step n={2}>
        <Do>Switch SCENE on. Open OUTPUT and choose STEREO. Move FACING through a full turn.</Do>
        <P>In the strip the fountain slides along the line between your ears. Ahead and behind land on the same point.</P>
      </Step>
      <Step n={3}>
        <Do>Put on headphones and choose HEADPHONE 3D. Turn again. Then choose MONO.</Do>
        <P>For HEADPHONE 3D your device filters each sound the way a head and outer ears would. That filter is called an HRTF. In the strip the fountain now moves on a circle around your head: front and back differ. The filter suits some ears better than others.</P>
        <P>In MONO both bars stay equal; to one side, both fold up to 3 dB quieter (the pan law).</P>
        <ActivityLog state={p13Log(s)} lines={3} empty="No output change yet. This log shows your OUTPUT choices." />
        <Note tone="mistake">Thinking headphones need a small speaker for each direction. Two are enough: the filtering happens before the sound reaches them.</Note>
        <Note>A binaural signal needs no second 3D effect: a second one damages it.</Note>
      </Step>
      <Step n={4}>
        <P>Do each of these once. Each one is marked done when it really happens in the scene.</P>
        <GoalChips goals={goals} latched={latched} />
      </Step>
      <Step n={5}>
        <UnderstandingCheck
          eyebrow="CHECK YOURSELF"
          question="Headphones have two small speakers, one for each ear. How can a sound seem to come from behind you?"
          options={[
            'Each sound is filtered for each ear before it reaches the speakers',
            'Each ear cup holds several small speakers, one for each direction',
            'The phone sends 5.1 channels to the headphones, one for each speaker',
            'The sound file was saved in a 3D format that holds its direction',
          ]}
          correct={0}
          explain="Binaural rendering does its work before the speakers. It filters each sound for the left ear and for the right ear by direction, which is what the HRTF describes. The two speakers then play the result."
          wrong={[
            undefined,
            'Ordinary headphones have one small speaker for each ear. Direction comes from the filtering, not from extra speakers.',
            'Nothing here sends surround channels. The 5.1 map on this page is a picture of a speaker layout.',
            'The file does not place a sound. The fountain is one ordinary file, and the renderer places it while it plays.',
          ]}
          onCorrect={() => setCheck(true)}
        />
      </Step>
    </GaRack>
  );
}

export const P13: PageDef = { title: 'Output formats', short: 'FORMATS', Component: Page, manualDone: true, rack: true, guide: G13 };
