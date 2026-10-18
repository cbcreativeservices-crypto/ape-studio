/**
 * Screen 6 — Set gain and read meters (research topics DJ11 + DJ12).
 * Input selection, trim, channel meters, master meters, headroom, clipping,
 * and matching two tracks recorded at different levels. The fault: the
 * crowd hears crackle while the MASTER meter looks fine (the mix bus clipped
 * first; a lower master cannot repair it).
 */
import { useState } from 'react';
import { UnderstandingCheck } from '../../tuning/components/check';
import type { PageCtx, PageDef } from '../../kit/PagedLab';
import { BoothStage } from '../art/BoothStage';
import { onMixer, STRIP_X, MIXER } from '../geometry/boothGeometry';
import { DjRack } from '../DjRack';
import { Do, FaultCard, GoalChips, Note, P, Step, Terms, useVisitGoals } from '../bits';
import { boothKey, levelKey, stopKey, trimKey } from '../dock';
import { updateBooth } from '../booth/boothStore';
import { cueAtBar, useScreenSetup } from '../booth/setup';
import { TRIM_UNITY, trimPos } from '../model/djModel';
import { anyClip, peakCell, peakDb, useBoothKit } from './shared';

const TERMS = [
  { term: 'Trim (gain)', def: 'How much of the incoming signal the channel takes in. Set it once for each track so the channel fader is free for the performance.' },
  { term: 'Headroom', def: 'The space between the loudest peaks and the top of the scale, where the stage clips. Leaving some means a loud moment does not distort.' },
  { term: 'dBFS', def: 'Decibels relative to digital full scale. 0 dBFS is the top of a digital stage; everything below is a negative number. This lab’s meters read dBFS.' },
  { term: 'Clipping', def: 'A stage asked for more than its maximum flattens the tops of the waveform. It sounds harsh, and turning a later stage down only makes the damage quieter.' },
  { term: 'Peak meter', def: 'A meter that jumps to the loudest instant at once and falls back slowly, so short peaks are not missed.' },
  { term: 'Mix bus', def: 'Where the channels add together after their faders and the crossfader. It has its own limit, and two clean channels can still overload it.' },
] as const;

function PageGain({ ctx }: { ctx: PageCtx }) {
  const { booth, audio, tr, motion } = useBoothKit();
  const { wiredForYou } = useScreenSetup((b) => {
    let x = cueAtBar(b, 'A', 'nightFerry', 17);
    x = cueAtBar(x, 'B', 'glassHarbour', 17);
    return {
      ...x,
      ch: { 1: { ...x.ch[1], input: 'LINE', trim: TRIM_UNITY, fader: 0.85, xf: 'THRU', cue: false }, 2: { ...x.ch[2], input: 'LINE', trim: TRIM_UNITY, fader: 0.85, xf: 'THRU', cue: false } },
      mixer: { ...x.mixer, master: 0.6 },
      perspective: 'CROWD',
    };
  });
  const last = audio.last;
  const p1 = peakDb(last, 'ch1');
  const p2 = peakDb(last, 'ch2');
  const pm = Math.max(peakDb(last, 'masterL') ?? -Infinity, peakDb(last, 'masterR') ?? -Infinity);
  const bothPlaying = booth.decks.A.playing && booth.decks.B.playing;
  const inBand = (v: number | null) => v != null && v >= -9 && v <= -4;
  const [checkDone, setCheckDone] = useState(false);
  const [faultFixed, setFaultFixed] = useState(false);
  const goals = [
    { label: 'Deck A peaks −9…−4 dBFS', hit: booth.decks.A.playing && inBand(p1) },
    { label: 'Deck B peaks −9…−4 dBFS', hit: booth.decks.B.playing && inBand(p2) },
    { label: 'Matched within 2 dB', hit: bothPlaying && p1 != null && p2 != null && Math.abs(p1 - p2) <= 2 && inBand(p1) && inBand(p2) },
    { label: 'Nothing clips', hit: bothPlaying && !!last && !anyClip(last) },
    { label: 'Fix the hidden overload', hit: faultFixed },
    { label: 'Pass the check', hit: checkDone },
  ];
  const latched = useVisitGoals(ctx, goals);
  const busOver = !!last && last.clipped.bus > 0;

  return (
    <DjRack
      spec={{
        render: (w, h) => (
          <BoothStage
            w={w}
            h={h}
            booth={booth}
            motion={motion}
            spec={{
              view: 'mixerUpper',
              highlight: { mixer: ['trim1', 'trim2', 'meters', 'busOver', 'master'] },
              callouts: [
                { id: 't1', text: 'TRIM 1', at: onMixer(STRIP_X[1] + 10, MIXER.trim.y), dx: 8, dy: -16 },
                { id: 't2', text: 'TRIM 2', at: onMixer(STRIP_X[2] - 10, MIXER.trim.y), dx: -8, dy: -16 },
                { id: 'bo', text: 'BUS OVER', at: onMixer(MIXER.busOver.x + 3, MIXER.busOver.y), dx: 26, dy: -6, tone: 'red' },
                { id: 'ms', text: 'MASTER', at: onMixer(MIXER.master.x - 10, MIXER.master.y + 4), dx: -14, dy: 22 },
              ],
              a11y: 'The mixer from above: the two TRIM knobs, the four meters (channel 1, master left, master right, channel 2) and the BUS OVER light.',
            }}
          />
        ),
        bezel: [peakCell('CH1 PEAK', p1), peakCell('CH2 PEAK', p2), peakCell('MASTER', pm === -Infinity ? null : pm), { k: 'MIX BUS', v: busOver ? 'OVER' : last ? 'CLEAN' : '—', tint: busOver ? '#ff5a48' : '#5bff85' }],
        params: [trimKey(booth, 1), trimKey(booth, 2), levelKey(booth, 'master', 'MASTER'), boothKey(booth, tr), stopKey(tr)],
        initialParam: 'trim1',
      }}
    >
      {wiredForYou ? <Note>The booth is wired and powered for you on this screen (Screen 4 shows how).</Note> : null}
      <Step n={1}>
        <P>The TRIM decides how much of a track comes into its channel. Set it once for each track, so the channel fader is left for the mix itself.</P>
        <P>Read the meter at the stage you are setting. On this mixer each channel’s meter shows the channel after TRIM and EQ, before its fader. The MASTER meters show the output, after the MASTER knob.</P>
        <P>Tracks arrive at different levels. Night Ferry (deck A) was mastered quietly; Glass Harbour (deck B) was mastered loud. The trims are how you even them out.</P>
        <Terms items={TERMS} />
      </Step>
      <Step n={2}>
        <Do>Open DECKS and play deck A. Ride TRIM 1 and watch the CH1 meter rise and fall with it.</Do>
        <P>Then move the channel fader in your mind: the CH1 meter would not change, because it reads before the fader. That is the point of it.</P>
      </Step>
      <Step n={3}>
        <P>Play deck B too. Its meter sits much higher at the same trim — the louder master. Listen with LISTEN → CROWD: the loud track jumps out.</P>
        <P>Push both trims up together and watch BUS OVER. The channels can be clean while their SUM is too big for the mix bus.</P>
        <Note>Every meter in this lab reads dBFS of this mixer’s own scale: 0 dBFS is where a stage clips. A real analog mixer’s meter often puts 0 at a reference level with room above it, so check how your own mixer is marked.</Note>
      </Step>
      <Step n={4}>
        <Do>With both decks playing, set the two trims so each channel peaks between −9 and −4 dBFS, within 2 dB of each other, with nothing clipping.</Do>
        <P>That leaves headroom for EQ boosts and for the moment both tracks play together. It is a suggested starting point; use your ears and the room.</P>
        <GoalChips goals={goals.slice(0, 4)} latched={latched.slice(0, 4)} />
      </Step>
      <Step n={5}>
        <UnderstandingCheck
          eyebrow="CHECK YOURSELF"
          question="The crowd hears crackle, but the MASTER meters only reach about −12 dBFS. What happened, and what fixes it?"
          options={[
            'An earlier stage clipped — find it (a channel meter or BUS OVER) and lower the gain there',
            'The master is too quiet — turn the MASTER up',
            'The speakers are broken — nothing at the mixer can help',
            'The meter is wrong — ignore it',
          ]}
          correct={0}
          explain="A meter after the MASTER knob only shows the output level. If the mix bus or a channel clipped before it, the waveform is already flat-topped, and turning the master down just makes the distortion quieter. Fix the stage that overloaded."
          wrong={[undefined, 'Turning it up makes the crackle louder; the damage happened earlier in the chain.', 'Possible in real life, but check your own stages first — the BUS OVER light is the evidence here.', 'The meter is telling the truth about its own stage. It just is not the stage that clipped.']}
          onCorrect={() => setCheckDone(true)}
        />
        <FaultCard
          title="CRACKLE, BUT THE MASTER LOOKS FINE"
          symptom="Both decks are playing. The sound is harsh and crackly, yet the MASTER meters stay well below the top."
          start={() => {
            void audio.requestSound();
            updateBooth((b, t) => {
              let x = b;
              for (const d of ['A', 'B'] as const) x = { ...x, decks: { ...x.decks, [d]: { ...x.decks[d], playing: true, at: t } } };
              return { ...x, ch: { 1: { ...x.ch[1], trim: trimPos(9), fader: 1 }, 2: { ...x.ch[2], trim: trimPos(4), fader: 1 } }, mixer: { ...x.mixer, master: 0.32 } };
            });
          }}
          fixed={bothPlaying && !!last && last.clipped.bus === 0 && last.clipped.ch1 === 0 && last.clipped.ch2 === 0}
          hints={['Look past the MASTER meters: is the BUS OVER light flashing?', 'Turning the MASTER down made it quieter, not cleaner.', 'Bring the TRIMS down until the channel meters and the bus stay out of the red.']}
          why="The mix bus was clipping before the MASTER knob. Lowering the trims (the stage that was too hot) removed the clipping; the master only ever set how loud the damage was."
          onFixed={() => setFaultFixed(true)}
        />
        <GoalChips goals={goals.slice(4)} latched={latched.slice(4)} />
      </Step>
    </DjRack>
  );
}

export const P06: PageDef = { title: 'Set gain and read meters', short: 'GAIN', Component: PageGain, manualDone: true, rack: true };
