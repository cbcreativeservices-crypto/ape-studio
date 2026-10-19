/**
 * Screen 4 — Build your first DJ system (research DJ05 + the power sequence
 * of DJ24): connect two sources, the mixer, headphones and speakers; follow
 * the complete signal path; power connections; startup and shutdown. Tap-to-
 * connect on the system map; every cable in its own lane; the blue glow is
 * the render's real route. The fault: half (or none) of the PA.
 */
import { useContext, useEffect, useMemo, useRef, useState } from 'react';
import { colors } from '../../../../theme/tokens';
import { StageInFullScreen } from '../../rack/stageAspect';
import { UnderstandingCheck } from '../../tuning/components/check';
import type { PageCtx, PageDef } from '../../kit/PagedLab';
import { Scene } from '../art/Scene';
import { MAP_FRAME, SystemMap, patchBox, roomSpeakerBox } from '../art/SystemMap';
import { MAP_BODIES, type SpeakerKey } from '../geometry/mapGeometry';
import { ROOM_FLOOR, followBox4, roomPhonesBox, speakerLit } from '../geometry/dressGeometry';
import { DjRack } from '../DjRack';
import { Do, FaultCard, GoalChips, Look, Note, P, Step, Terms, useVisitGoals } from '../bits';
import { boothKey, stopKey } from '../dock';
import { PatchTray, PowerTray, type PowerEvent } from '../trays';
import { getBooth, setBooth, updateBooth } from '../booth/boothStore';
import { useScreenSetup } from '../booth/setup';
import { AUDIO_PLUGS, POWERED, POWER_PLUGS, PLUGS, SPEAKERS, connect, deviceLive, plugCorrect, speakerCabled, systemBuilt, type Booth, type PlugId, type SpeakerId } from '../model/djModel';
import type { BoothRender } from '../engine/djRender';
import type { BoothMotion } from '../art/motion';
import { soundCell, useBoothKit } from './shared';

const TERMS = [
  { term: 'Signal path', def: 'The route the music takes, stage by stage: player → cable → mixer input → channel → mix → output → speaker. When something is silent, you follow it until it stops.' },
  { term: 'Powered speaker', def: 'A speaker with its own amplifier inside: it takes a line-level signal and needs its own mains power. Its rear has an input switch (set LINE, not MIC) and a level knob (set at its marked unity point).' },
  { term: 'Power sequencing', def: 'The order you switch things on and off: sources and mixer first, amplified speakers LAST (and off FIRST), so switching bangs never reach them.' },
  { term: 'Protective earth', def: 'The mains safety connection (the earth pin). Never remove or tape it to cure hum — it is what protects people if a fault happens.' },
] as const;

export const GOALS_BUILD = ['Both players to the mixer', 'PA and booth monitors', 'Headphones in', 'Power ON, speakers last', 'Hear the crowd feed', 'Power OFF, speakers first', 'Fix the missing side', 'Pass the check'] as const;

/** What flashes on the map for a moment: a power-switch THUMP or a
 *  HOT-PATCH — the speakers that would have banged. */
type Flash = { keys: readonly SpeakerKey[]; word: 'THUMP' | 'HOT-PATCH' };

/** The two views (round 2, grades screen 4 — "unreadable at phone size"):
 *  the WHOLE BOOTH (the room over everything you plug), or CABLE — close up
 *  on the cable you are working on, end to end. */
type View4 = 'BOOTH' | 'CABLE';

/** The map on the glass (round 2, grades screen 4). On the glass the cables
 *  in FOCUS — the one being patched, the one just patched, any in the wrong
 *  place — are drawn at full strength and carry their flags; every other run
 *  steps back (audio that is flowing stays bright), and the mains cords fade
 *  further while no power task is on. The CABLE view frames the focus cable
 *  close up. FULL SCREEN keeps the full detail: the whole map, every cable at
 *  full strength, every flag that finds clean air (CABLE opens its zoom on
 *  that cable). The room's names are callouts kept in the room band; the
 *  patch band's words are placed by the map itself (placeLabels). */
function BuildMap({ w, h, booth, last, motion, flowMotion, flash, sel, justPatched, audioOk, powerOk, view, powerTask }: {
  w: number;
  h: number;
  booth: Booth;
  last: BoothRender | null;
  motion: BoothMotion;
  flowMotion: boolean;
  flash: Flash | null;
  sel: PlugId;
  justPatched: PlugId | null;
  audioOk: number;
  powerOk: number;
  view: View4;
  powerTask: boolean;
}) {
  const inFull = useContext(StageInFullScreen);
  // the cables the screen is about right now
  const focus = useMemo(() => {
    const f = new Set<PlugId>([sel]);
    if (justPatched) f.add(justPatched);
    for (const p of [...AUDIO_PLUGS, ...POWER_PLUGS]) if (booth.plugs[p] != null && !plugCorrect(booth, p)) f.add(p);
    return [...f];
  }, [sel, justPatched, booth]);
  const flagFor = (p: PlugId) => inFull || focus.includes(p);
  // the CABLE view: the focus cable's whole run, grown to the glass's shape
  const follow = useMemo(() => followBox4(sel, booth.plugs, Math.max(0.3, (w - 12) / Math.max(1, h - 12))), [sel, booth.plugs, w, h]);
  const cable = view === 'CABLE' && !inFull;
  const label = (id: string, text: string, at: { x: number; y: number }, dx: number, dy: number, tone?: 'blue' | 'amber' | 'red' | 'plain') => ({ id, text, at, dx, dy, tone });
  const top = (k: SpeakerKey) => {
    const b = roomSpeakerBox(k);
    return { x: b.x + b.w / 2, y: b.y + b.h * 0.3 };
  };
  // the room's names stay in the room band: the patch band is one obstacle
  const hard = [...(['paR', 'boothR', 'boothL', 'paL'] as const).map((k) => roomSpeakerBox(k)), roomPhonesBox, { x: -8, y: ROOM_FLOOR + 20, w: 1056, h: 900 }];
  const keys = flash?.keys ?? [];
  return (
    <Scene
      w={w}
      h={h}
      frame={cable ? patchBox(follow) : MAP_FRAME}
      aspect={MAP_FRAME.w / MAP_FRAME.h}
      motion={motion}
      a11y={`${cable ? `Close up on the ${PLUGS[sel].short} cable, from behind the booth.` : LOOK} ${audioOk} of 9 audio cables and ${powerOk} of 7 devices powered.${flash ? ` A speaker just flagged a ${flash.word.toLowerCase()}.` : ''}`}
      obstacles={cable ? [] : hard}
      focus={view === 'CABLE' ? patchBox(follow) : patchBox(MAP_BODIES[1])}
      callouts={
        cable
          ? []
          : [
              ...keys.map((k) => label(`th${k}`, flash!.word, top(k), 0, -10, 'red')),
              label('par', 'PA R', top('paR'), 18, 0),
              label('pal', 'PA L', top('paL'), -18, 0),
              label('br', 'BOOTH R', top('boothR'), -16, -12),
              label('bl', 'BOOTH L', top('boothL'), 16, -12),
            ]
      }
    >
      <SystemMap booth={booth} last={last} flow={flowMotion} thump={keys} flagFor={flagFor} focus={focus} dimRest={!inFull} cordAlpha={powerTask ? 1 : inFull ? 0.55 : 0.3} labelView={cable ? follow : undefined} />
    </Scene>
  );
}

const LOOK = 'You are looking at the whole booth from BEHIND, the way you reach round to wire it, so it is mirrored. At the top, the room at 1:5: the PA speakers on their stands at the corners (PA R on the left), the table with deck B, the mixer, deck A, the headphones and the booth monitors. Below, at full size, everything you plug: each speaker’s input plate, the three rear panels, the mixer’s front edge with the headphone cable (it carries on up to the headphones) and the power strip.';

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
  // the speakers that just THUMPED (or heard a hot-patch): flashed red on the map for a moment
  const [flash, setFlash] = useState<Flash | null>(null);
  useEffect(() => {
    if (!flash) return;
    const id = setTimeout(() => setFlash(null), 1300);
    return () => clearTimeout(id);
  }, [flash]);
  // the cable being patched and the one just patched carry their flags at 1×
  const [selPlug, setSelPlug] = useState<PlugId>('A.rcaL');
  const [justPatched, setJustPatched] = useState<PlugId | null>(null);
  // a power order that thumped: said plainly, with the way to try again
  const [miss, setMiss] = useState<'on' | 'off' | null>(null);
  // the view, and whether the learner is wiring audio or power: picking a
  // cable follows it close up, a power switch shows the whole booth — until
  // the learner picks a VIEW themselves
  const [view, setView] = useState<View4>('BOOTH');
  const viewChosen = useRef(false);
  const [powerTask, setPowerTask] = useState(false);
  const onPick = (p: PlugId) => {
    setSelPlug(p);
    setPowerTask(PLUGS[p].kind === 'iec');
    if (!viewChosen.current) setView('CABLE');
  };
  const onPower = (e: PowerEvent) => {
    setPowerTask(true);
    if (!viewChosen.current) setView('BOOTH');
    setLastPower(e);
    const b = getBooth();
    if (e.thump) setFlash({ keys: SPEAKERS.filter((sp) => deviceLive(b, sp) && speakerCabled(b, sp)), word: 'THUMP' });
    const allOn = POWERED.every((d) => deviceLive(b, d));
    const allOff = POWERED.every((d) => !b.power[d]);
    const s = seq.current;
    if (!s.wasAllOn) {
      if (e.on && e.thump) s.thumpOn = true;
      if (allOn) {
        s.wasAllOn = true;
        if (!s.thumpOn) {
          setOnOk(true);
          setMiss(null);
        } else setMiss('on');
      }
    } else {
      if (!e.on && e.thump) s.thumpOff = true;
      if (allOff) {
        if (!s.thumpOff) {
          setOffOk(true);
          setMiss(null);
        } else setMiss('off');
        seq.current = { thumpOn: false, wasAllOn: false, thumpOff: false, offOk: false };
      }
    }
  };
  const onHot = (spk: readonly SpeakerId[]) => setFlash({ keys: spk, word: 'HOT-PATCH' });
  const audioOk = AUDIO_PLUGS.filter((p) => plugCorrect(booth, p)).length;
  const powerOk = POWERED.filter((d) => deviceLive(booth, d)).length;
  const last = audio.last;
  const crowdLive = !!last && last.rmsDb.crowd > -80;
  if (crowdLive && !heard) setHeard(true);
  // each PA side on its own: the fault is "half the PA" (learning p04 #3)
  // the same per-feed test the map's speaker lights use (dressGeometry)
  const paL = speakerLit(booth, last, 'paL');
  const paR = speakerLit(booth, last, 'paR');
  const hits = [
    (['A.rcaL', 'A.rcaR', 'B.rcaL', 'B.rcaR'] as const).every((p) => plugCorrect(booth, p)),
    (['mst.xlrL', 'mst.xlrR', 'bth.trsL', 'bth.trsR'] as const).every((p) => plugCorrect(booth, p)),
    plugCorrect(booth, 'phones'),
    onOk,
    heard,
    offOk,
    faultFixed,
    check,
  ];
  const goals = GOALS_BUILD.map((label, i) => ({ label, hit: hits[i] }));
  const latched = useVisitGoals(ctx, goals, 'BUILD');
  return (
    <DjRack
      spec={{
        render: (w, h) => <BuildMap w={w} h={h} booth={booth} last={last} motion={motion} flowMotion={audio.flowMotion} flash={flash} sel={selPlug} justPatched={justPatched} audioOk={audioOk} powerOk={powerOk} view={view} powerTask={powerTask} />,
        bezel: [
          { k: 'CABLES', v: `${audioOk} / 9`, tint: audioOk === 9 ? colors.green : colors.amber },
          { k: 'POWERED', v: `${powerOk} / 7`, tint: powerOk === 7 ? colors.green : colors.amber },
          { k: 'PA L · R', v: `${paL ? '✓' : '—'} · ${paR ? '✓' : '—'}`, vA11y: `PA left ${paL ? 'playing' : 'silent'}, PA right ${paR ? 'playing' : 'silent'}`, tint: paL && paR ? colors.green : paL || paR ? colors.amber : colors.textSub },
          soundCell(audio),
        ],
        params: [
          {
            kind: 'group',
            id: 'patch',
            label: 'PATCH',
            valueLabel: `${audioOk}/9`,
            render: () => <PatchTray plugs={[...AUDIO_PLUGS, ...POWER_PLUGS]} initial={selPlug} onSelect={onPick} onPatched={(p) => setJustPatched(p)} onHot={onHot} />,
          },
          {
            kind: 'options',
            id: 'view',
            label: 'VIEW',
            valueLabel: view === 'CABLE' ? 'CABLE' : 'BOOTH',
            valueA11y: view === 'CABLE' ? 'close up on the cable you are patching' : 'the whole booth',
            options: [
              { id: 'BOOTH', label: 'WHOLE BOOTH', blurb: 'The room, and everything you plug, from behind. The cable you are working on stays bright; the rest step back.' },
              { id: 'CABLE', label: 'FOLLOW THE CABLE', blurb: 'Close up on the cable you are patching, from one plug to the other.' },
            ],
            selectedId: view,
            onSelect: (id) => {
              viewChosen.current = true;
              setView(id as View4);
            },
          },
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
        <Look>{LOOK}</Look>
        <P>Each player’s AUDIO OUT goes to a mixer LINE input on an RCA pair (white left, red right); the mixer’s MASTER OUT feeds the PA (the crowd) and its BOOTH OUT the booth monitors (you), both on balanced cables — XLR and TRS, which cancel hum on long runs.</P>
        <P>The headphones plug into the mixer’s front, and every powered device needs its own power cord.</P>
        <Terms items={TERMS} />
      </Step>
      <Step n={2}>
        <Do>Open PATCH. Pick a cable by the end that is already in its source, then tap where its loose end goes. The map follows that cable close up, from one plug to the other; VIEW switches between it and the whole booth, where the cable you are working on stays bright and carries its label while the rest step back. FULL SCREEN shows every cable and label.</Do>
        <P>Look at the mixer’s rear: seen from behind, channel 2’s inputs are on the LEFT. That catches people out on real gear too.</P>
      </Step>
      <Step n={3}>
        <P>Open POWER and DECKS, play a deck and LISTEN as the CROWD. You only hear it once the whole path is complete: player → cable → mixer input → channel → mix → MASTER → PA. While audio flows, its cables glow blue, and each speaker that is getting its own feed glows blue in the room; a mains cord that is live shows a thin amber line.</P>
      </Step>
      <Step n={4}>
        <Do>Wire everything, then power ON in a safe order — players and mixer first, speakers LAST. Hear the crowd, then power OFF with the speakers FIRST.</Do>
        {miss === 'on' ? <Note tone="safety">That order thumped a live speaker. Switch everything OFF and try again: players and mixer first, speakers last.</Note> : null}
        {miss === 'off' ? <Note tone="safety">That order thumped a live speaker on the way down. Switch everything back ON (speakers last), then turn the speakers off FIRST.</Note> : null}
        <Note tone="safety">Before switching speakers on, turn the mixer’s MASTER and BOOTH down, and check each powered speaker’s input is set to LINE with its level at the marked unity point. Bring levels up slowly once everything is on. Never remove a plug’s earth pin to stop a hum — that pin protects people.</Note>
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
          symptom="The crowd hears the music only from one side, and the left booth monitor is playing the crowd’s mix."
          start={() => {
            void audio.requestSound();
            if (!viewChosen.current) setView('BOOTH');
            updateBooth((b, t) => {
              let x: Booth = { ...b };
              const plugs = { ...x.plugs };
              for (const p of [...AUDIO_PLUGS, ...POWER_PLUGS]) plugs[p] = null;
              x = { ...x, plugs: { ...plugs, 'A.rcaL': 'ch1.line.L', 'A.rcaR': 'ch1.line.R', 'B.rcaL': 'ch2.line.L', 'B.rcaR': 'ch2.line.R', 'bth.trsR': 'boothR.in', phones: 'mix.phones', 'ac.paL': 'strip.1', 'ac.boothL': 'strip.2', 'ac.playerA': 'strip.3', 'ac.mixer': 'strip.4', 'ac.playerB': 'strip.5', 'ac.boothR': 'strip.6', 'ac.paR': 'strip.7' } };
              x = connect(connect(x, 'mst.xlrR', 'paR.in')!, 'mst.xlrL', 'boothL.in')!;
              const power = { ...x.power };
              for (const d of POWERED) power[d] = true;
              x = { ...x, power, perspective: 'CROWD', ch: { ...x.ch, 1: { ...x.ch[1], fader: 0.8, xf: 'THRU' } } };
              return { ...x, decks: { ...x.decks, A: { ...x.decks.A, playing: true, at: t } } };
            });
          }}
          fixed={SPEAKERS.every((s) => booth.plugs[s === 'paL' ? 'mst.xlrL' : s === 'paR' ? 'mst.xlrR' : s === 'boothL' ? 'bth.trsL' : 'bth.trsR'] === `${s}.in`)}
          hints={['Turn the MASTER down (or the PA off) first — you are about to move cables on a live system. Then: which speaker is silent? Follow its cable back to the mixer.', 'One MASTER cable is plugged into a booth monitor instead of the PA.', 'Move MASTER L to the PA L input, and connect BOOTH L to the booth monitor.']}
          why="MASTER L was in the left booth monitor, so the crowd’s left speaker had nothing and you heard the master mix in one booth monitor. Each output goes to its own destination: MASTER to the PA, BOOTH to the booth monitors. On a real system you would turn the MASTER down (or the PA off) before moving a cable into a live speaker — a HOT-PATCH can bang."
          onFixed={() => setFaultFixed(true)}
        />
        <GoalChips goals={goals.slice(6)} latched={latched.slice(6)} />
      </Step>
    </DjRack>
  );
}

export const P04: PageDef = { title: 'Build your first DJ system', short: 'BUILD', Component: PageBuild, manualDone: true, rack: true };
