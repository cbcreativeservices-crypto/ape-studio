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
 * The 5.1 map in the well (chcSpeakerMap) is a PICTURE of a layout; the page
 * says so, and that the phone is not sending surround.
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
import { ActivityLog, Do, GoalChips, Look, Note, P, Step, Terms, useVisitGoals } from '../bits';
import { gaTerms } from '../gaTerms';
import { gaFact, gaPlaying, type GaState } from '../model/gaModel';
import { gaDispatch, gaGet, useGa } from '../model/gaStore';
import { useRoseWhile } from './chcBits';
import { ChcSpeakerMap } from './chcSpeakerMap';
import { chcSpace, sideWord } from './data/chcSpace';
import { G13 } from './guides/p13';
import { facingKey, useSince } from './shared';

const ASSETS = ['fountain', 'amb_room', 'amb_yard', 'gen_hum', 'gen_air', 'ir_room'] as const;
const TERMS = gaTerms('Channel-based audio', 'Object-Based Audio', 'Binaural rendering', 'HRTF', 'Ambisonics', 'Downmix');

type Output = 'stereo' | 'hrtf' | 'mono';
const outputOf = (s: GaState): Output => (s.mono ? 'mono' : s.pan);
const OUTPUT_WORD: Record<Output, string> = { stereo: 'STEREO', hrtf: '3D', mono: 'MONO' };

/** Choose what the device sends. MONO folds whatever renderer is on; leaving
 *  MONO for one of the other two switches the fold off again. */
function setOutput(o: Output): void {
  const s = gaGet();
  if (o === 'mono') {
    if (!s.mono) gaDispatch({ type: 'mono', on: true });
    return;
  }
  if (s.mono) gaDispatch({ type: 'mono', on: false });
  gaDispatch({ type: 'pan', mode: o });
}

const outputKey = (s: GaState): DockParam => ({
  kind: 'options',
  id: 'output',
  label: 'OUTPUT',
  valueLabel: OUTPUT_WORD[outputOf(s)],
  valueA11y: outputOf(s) === 'hrtf' ? 'headphone 3D' : outputOf(s),
  sticky: true,
  selectedId: outputOf(s),
  onSelect: (id) => setOutput(id as Output),
  options: [
    { id: 'stereo', label: 'STEREO', blurb: 'Left and right pan only. A source in front of you and one behind you sound the same.' },
    { id: 'hrtf', label: 'HEADPHONE 3D', blurb: 'Your device filters each sound for each ear, the way a head would. It needs headphones. Now front and back differ.' },
    { id: 'mono', label: 'MONO', blurb: 'A downmix: both ears get the same signal. Distance still sets the level. Direction is gone.' },
  ],
});

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
        readouts: [
          { k: 'FOUNTAIN', v: sideWord(fountain.bearingDeg), vA11y: `the fountain is ${sideWord(fountain.bearingDeg).toLowerCase()}` },
          { k: 'OUTPUT', v: OUTPUT_WORD[out], vA11y: out === 'hrtf' ? 'headphone 3D' : out },
        ],
        select: 'fountain',
        assets: ASSETS,
      }}
    >
      <Step n={1}>
        <Look>The rings and the dotted line mark the fountain, the source to listen to. The wedge shows which way you face.</Look>
        <P>Three outputs can be heard on this page: stereo, headphone 3D and mono.</P>
        <P>The ideas behind them are related, not the same. Channel-based audio mixes every sound into a fixed set of channels, one for each speaker of a known layout, such as stereo or 5.1. Object-based audio keeps each sound with its position; the device works out the speaker signals as it plays. Binaural rendering makes a headphone signal that seems to surround you.</P>
        <ChcSpeakerMap />
        <Terms items={TERMS} />
      </Step>
      <Step n={2}>
        <Do>Switch SCENE on. Open OUTPUT and choose STEREO. Move FACING through a full turn.</Do>
        <P>The fountain moves between left and right. Straight ahead and straight behind sound the same.</P>
      </Step>
      <Step n={3}>
        <Do>Put on headphones and choose HEADPHONE 3D. Turn again. Then choose MONO.</Do>
        <P>Your device does HEADPHONE 3D live, with its own HRTF filters. Front and back now differ. The filters are made for one typical head, so they suit some ears better than others. In MONO both ears get the same signal: level remains, direction is gone. Folding stereo to mono is a downmix.</P>
        <ActivityLog state={s} lines={3} only={['mix']} />
        <P>Two more words you will meet. Ambisonics stores sound arriving from every direction at one point. Head tracking senses how your head turns, so sounds can stay still around you.</P>
        <Note tone="mistake">Thinking headphones need a separate small speaker for each direction. Two are enough: the filtering happens before the sound reaches them. Another is adding a second 3D effect to a signal that is already binaural.</Note>
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
            'Each sound is filtered for each ear, the way a head would change it, before it reaches the two speakers',
            'Each ear cup holds several small speakers, one for each direction',
            'The phone sends 5.1 channels to the headphones',
            'The sound file was saved in a 3D format',
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
