/**
 * Screen 4 — Build your first DJ system (research DJ05 + the power sequence
 * of DJ24): connect two sources, the mixer, headphones and speakers; follow
 * the complete signal path; power connections; startup and shutdown. Tap-to-
 * connect on the system map; every cable in its own lane; the blue glow is
 * the render's real route. The fault: half (or none) of the PA.
 */
import { useRef, useState } from 'react';
import { colors } from '../../../../theme/tokens';
import { UnderstandingCheck } from '../../tuning/components/check';
import type { PageCtx, PageDef } from '../../kit/PagedLab';
import { Scene } from '../art/Scene';
import { MAP, MAP_FRAME, SystemMap, speakerInput } from '../art/SystemMap';
import { DjRack } from '../DjRack';
import { Do, FaultCard, GoalChips, Note, P, Step, Terms, useVisitGoals } from '../bits';
import { boothKey, stopKey } from '../dock';
import { PatchTray, PowerTray, type PowerEvent } from '../trays';
import { getBooth, setBooth, updateBooth } from '../booth/boothStore';
import { useScreenSetup } from '../booth/setup';
import { AUDIO_PLUGS, POWERED, POWER_PLUGS, SPEAKERS, connect, deviceLive, plugCorrect, systemBuilt, type Booth } from '../model/djModel';
import { soundCell, useBoothKit } from './shared';

const TERMS = [
  { term: 'Signal path', def: 'The route the music takes, stage by stage: player → cable → mixer input → channel → mix → output → speaker. When something is silent, you follow it until it stops.' },
  { term: 'Balanced output', def: 'A connection (XLR or TRS) that carries the signal twice, once flipped, so noise picked up on a long cable cancels at the other end. Good for runs to the speakers.' },
  { term: 'Powered speaker', def: 'A speaker with its own amplifier inside: it takes a line-level signal and needs its own mains power.' },
  { term: 'Power sequencing', def: 'The order you switch things on and off: sources and mixer first, amplified speakers LAST (and off FIRST), so switching bangs never reach them.' },
  { term: 'Protective earth', def: 'The mains safety connection (the earth pin). Never remove or tape it to cure hum — it is what protects people if a fault happens.' },
] as const;

function unbuilt(b: Booth): Booth {
  const plugs = { ...b.plugs };
  for (const p of [...AUDIO_PLUGS, ...POWER_PLUGS]) plugs[p] = null;
  const power = { ...b.power };
  for (const d of POWERED) power[d] = false;
  return { ...b, plugs, power };
}

function PageBuild({ ctx }: { ctx: PageCtx }) {
  const { booth, audio, tr, motion } = useBoothKit();
  useScreenSetup((b) => (systemBuilt(b) ? b : { ...unbuilt(b), perspective: 'CROWD' }), false);
  const [lastPower, setLastPower] = useState<PowerEvent | null>(null);
  // the power story since the last time everything was off
  const seq = useRef<{ thumpOn: boolean; wasAllOn: boolean; thumpOff: boolean; offOk: boolean }>({ thumpOn: false, wasAllOn: false, thumpOff: false, offOk: false });
  const [onOk, setOnOk] = useState(false);
  const [offOk, setOffOk] = useState(false);
  const [heard, setHeard] = useState(false);
  const [check, setCheck] = useState(false);
  const [faultFixed, setFaultFixed] = useState(false);
  const onPower = (e: PowerEvent) => {
    setLastPower(e);
    const b = getBooth();
    const allOn = POWERED.every((d) => deviceLive(b, d));
    const allOff = POWERED.every((d) => !b.power[d]);
    const s = seq.current;
    if (!s.wasAllOn) {
      if (e.on && e.thump) s.thumpOn = true;
      if (allOn) {
        s.wasAllOn = true;
        if (!s.thumpOn) setOnOk(true);
      }
    } else {
      if (!e.on && e.thump) s.thumpOff = true;
      if (allOff) {
        if (!s.thumpOff) setOffOk(true);
        seq.current = { thumpOn: false, wasAllOn: false, thumpOff: false, offOk: false };
      }
    }
  };
  const audioOk = AUDIO_PLUGS.filter((p) => plugCorrect(booth, p)).length;
  const powerOk = POWERED.filter((d) => deviceLive(booth, d)).length;
  const crowdLive = !!audio.last && audio.last.rmsDb.crowd > -80;
  if (crowdLive && !heard) setHeard(true);
  const goals = [
    { label: 'Both players to the mixer', hit: (['A.rcaL', 'A.rcaR', 'B.rcaL', 'B.rcaR'] as const).every((p) => plugCorrect(booth, p)) },
    { label: 'PA and booth monitors', hit: (['mst.xlrL', 'mst.xlrR', 'bth.trsL', 'bth.trsR'] as const).every((p) => plugCorrect(booth, p)) },
    { label: 'Headphones in', hit: plugCorrect(booth, 'phones') },
    { label: 'Power ON, speakers last', hit: onOk },
    { label: 'Hear the crowd feed', hit: heard },
    { label: 'Power OFF, speakers first', hit: offOk },
    { label: 'Fix the missing side', hit: faultFixed },
    { label: 'Pass the check', hit: check },
  ];
  const latched = useVisitGoals(ctx, goals);
  const label = (id: string, text: string, at: { x: number; y: number }, dx: number, dy: number, tone?: 'blue' | 'amber') => ({ id, text, at, dx, dy, tone });
  return (
    <DjRack
      spec={{
        render: (w, h) => (
          <Scene
            w={w}
            h={h}
            frame={MAP_FRAME}
            motion={motion}
            a11y={`The whole system, wired from behind: deck A, the mixer and deck B along the back of the table, the PA speakers and booth monitors above, the headphones at the mixer front, the power strip below. ${audioOk} of 9 audio cables and ${powerOk} of 7 devices powered.`}
            callouts={[
              label('pal', 'PA L', { x: MAP.paL.x + 76, y: MAP.paL.y + 12 }, 0, -2),
              label('par', 'PA R', { x: MAP.paR.x + 76, y: MAP.paR.y + 12 }, 0, -2),
              label('bl', 'BOOTH L', speakerInput('boothL'), 0, 12),
              label('br', 'BOOTH R', speakerInput('boothR'), 0, 12),
              label('st', 'POWER STRIP', { x: MAP.strip.x + 165, y: MAP.strip.y + 64 }, 0, 6),
            ]}
          >
            <SystemMap booth={booth} last={audio.last} flow />
          </Scene>
        ),
        bezel: [
          { k: 'AUDIO CABLES', v: `${audioOk} / 9`, tint: audioOk === 9 ? colors.green : colors.amber },
          { k: 'POWERED', v: `${powerOk} / 7`, tint: powerOk === 7 ? colors.green : colors.amber },
          { k: 'CROWD HEARS', v: crowdLive ? 'MUSIC' : 'NOTHING', tint: crowdLive ? colors.green : colors.textSub },
          soundCell(audio),
        ],
        params: [
          { kind: 'group', id: 'patch', label: 'PATCH', valueLabel: `${audioOk}/9`, render: () => <PatchTray plugs={[...AUDIO_PLUGS, ...POWER_PLUGS]} /> },
          { kind: 'group', id: 'power', label: 'POWER', valueLabel: `${powerOk}/7`, render: () => <PowerTray onEvent={onPower} lastEvent={lastPower} /> },
          boothKey(booth, tr),
          {
            kind: 'action',
            id: 'reset',
            label: 'UNWIRE',
            onPress: () => {
              tr.stopAll();
              setBooth(unbuilt(getBooth()));
              seq.current = { thumpOn: false, wasAllOn: false, thumpOff: false, offOk: false };
              setLastPower(null);
            },
          },
          stopKey(tr),
        ],
        initialParam: 'patch',
      }}
    >
      <Step n={1}>
        <P>A first system: each player’s AUDIO OUT goes to a mixer LINE input with an RCA pair (white is left, red is right). The mixer’s MASTER OUT (balanced XLR) feeds the two PA speakers — the crowd. Its BOOTH OUT (TRS) feeds the booth monitors — you. The headphones plug into the front of the mixer.</P>
        <P>Every powered device also needs a power cord. Audio flows player → cable → mixer input → channel → mix → MASTER → PA. When something is silent, follow that path until the music stops.</P>
        <Terms items={TERMS} />
      </Step>
      <Step n={2}>
        <Do>Open PATCH. Pick a cable by the end that is already in its source, then tap where its free end goes. Watch the map: every cable gets its own lane, so you can trace each one.</Do>
        <P>Look at the mixer’s rear: seen from behind, channel 2’s inputs are on the LEFT. That catches people out on real gear too.</P>
      </Step>
      <Step n={3}>
        <P>Open POWER and DECKS, play a deck and LISTEN as the CROWD. You only hear it once the whole path is complete. While audio flows, its cables glow blue; a powered cord glows amber.</P>
      </Step>
      <Step n={4}>
        <Do>Wire everything, then power ON in a safe order — players and mixer first, speakers LAST. Hear the crowd, then power OFF with the speakers FIRST.</Do>
        <Note tone="safety">Before switching speakers on, turn the mixer’s MASTER and BOOTH down. Bring levels up slowly once everything is on. Never remove a plug’s earth pin to stop a hum — that pin protects people.</Note>
        <GoalChips goals={goals.slice(0, 6)} latched={latched.slice(0, 6)} />
      </Step>
      <Step n={5}>
        <UnderstandingCheck
          eyebrow="CHECK YOURSELF"
          question="The PA speakers are on. You switch the MIXER off. What can happen, and what is the safe habit?"
          options={[
            'A loud thump through the PA — switch the speakers off first, and on last',
            'Nothing — speakers ignore what is upstream',
            'The mixer saves the PA by muting itself, always',
            'Only the booth monitors are affected',
          ]}
          correct={0}
          explain="An amplified speaker that is on will reproduce whatever bang a source makes as it switches. Speakers go on LAST and off FIRST, with the levels down, so nothing upstream can reach them while it switches."
          wrong={[undefined, 'A powered speaker amplifies whatever arrives, including the switching transient.', 'Some gear has protection, but you cannot count on it — the habit is what protects the speakers.', 'Any speaker that is on and connected can thump.']}
          onCorrect={() => setCheck(true)}
        />
        <FaultCard
          title="HALF THE PA IS SILENT"
          symptom="The crowd hears the music only from one side, and the booth monitors sound odd."
          start={() => {
            void audio.requestSound();
            updateBooth((b, t) => {
              let x: Booth = { ...b };
              const plugs = { ...x.plugs };
              for (const p of [...AUDIO_PLUGS, ...POWER_PLUGS]) plugs[p] = null;
              x = { ...x, plugs: { ...plugs, 'A.rcaL': 'ch1.line.L', 'A.rcaR': 'ch1.line.R', 'B.rcaL': 'ch2.line.L', 'B.rcaR': 'ch2.line.R', 'bth.trsR': 'boothR.in', phones: 'mix.phones', 'ac.playerA': 'strip.1', 'ac.playerB': 'strip.2', 'ac.mixer': 'strip.3', 'ac.paL': 'strip.4', 'ac.paR': 'strip.5', 'ac.boothL': 'strip.6', 'ac.boothR': 'strip.7' } };
              x = connect(connect(x, 'mst.xlrR', 'paR.in')!, 'mst.xlrL', 'boothL.in')!;
              const power = { ...x.power };
              for (const d of POWERED) power[d] = true;
              x = { ...x, power, perspective: 'CROWD', ch: { ...x.ch, 1: { ...x.ch[1], fader: 0.8, xf: 'THRU' } } };
              return { ...x, decks: { ...x.decks, A: { ...x.decks.A, playing: true, at: t } } };
            });
          }}
          fixed={SPEAKERS.every((s) => booth.plugs[s === 'paL' ? 'mst.xlrL' : s === 'paR' ? 'mst.xlrR' : s === 'boothL' ? 'bth.trsL' : 'bth.trsR'] === `${s}.in`)}
          hints={['Which speaker is silent? Follow its cable back to the mixer.', 'One MASTER cable is plugged into a booth monitor instead of the PA.', 'Move MASTER L to the PA L input, and connect BOOTH L to the booth monitor.']}
          why="MASTER L was in the left booth monitor, so the crowd’s left speaker had nothing and you heard the master mix in one booth monitor. Each output goes to its own destination: MASTER to the PA, BOOTH to the booth monitors."
          onFixed={() => setFaultFixed(true)}
        />
        <GoalChips goals={goals.slice(6)} latched={latched.slice(6)} />
      </Step>
    </DjRack>
  );
}

export const P04: PageDef = { title: 'Build your first DJ system', short: 'BUILD', Component: PageBuild, manualDone: true, rack: true };
