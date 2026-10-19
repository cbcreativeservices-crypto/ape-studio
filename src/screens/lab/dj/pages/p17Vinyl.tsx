/**
 * Screen 17 — Vinyl turntables and phono audio (research DJ06, DJ07; the
 * turntable feedback of DJ22; the ground wire of DJ24) — an OPTIONAL
 * equipment path: cartridge and stylus, the tonearm, tracking force by the
 * real method (balance, zero the ring, set), anti-skate, the slipmat, phono
 * stages and RIAA, grounding and isolation. Everything audible is modelled
 * (model/djVinyl through engine/djStage2): a light arm mistracks (and very
 * light, skips), no ground wire buzzes, a booth monitor too close and too
 * loud builds a low howl — held safe and quiet. The fault: a turntable's
 * line output into a PHONO input (two phono stages).
 */
import { useEffect, useRef, useState } from 'react';
import { View } from 'react-native';
import { colors } from '../../../../theme/tokens';
import { LabChip } from '../../LabShell';
import { UnderstandingCheck } from '../../tuning/components/check';
import type { PageCtx, PageDef } from '../../kit/PagedLab';
import { Scene, type Callout } from '../art/Scene';
import { ARM_AT_REST, TurntableTop, TT_PARTS, turntablePartBox } from '../art/TurntableTop';
import { ArmSide, PhonoChain, RoomView, type PhonoCount } from '../art/vinylArt';
import { TT, TT_D, TT_W } from '../geometry/boothGeometry';
import { DjRack } from '../DjRack';
import { Do, FaultCard, GoalChips, Look, Note, P, Step, Terms, useVisitGoals } from '../bits';
import { stopKey, pct } from '../dock';
import { getBooth, updateBooth } from '../booth/boothStore';
import { useScreenSetup } from '../booth/setup';
import { TRIM_UNITY, channelRoute, connect, hotPatchSpeakers, type Booth, type JackId } from '../model/djModel';
import { TRACKS, barSec } from '../engine/djMusic';
import { FORCE_RANGE, dialReads, feedbackLoopGain, freshVinyl, inRange, isBalanced, skips, tooHeavy, trackAbility, trueForce, wallForce, zeroDial, BALANCE_AT, type VinylState } from '../model/djVinyl';
import { REV_SEC } from '../model/djDvs';
import { useBoothKit } from './shared';
import { Choices, TrayNote, s2Of, s2styles } from './s2kit';

const TERMS = [
  { term: 'Tracking force', def: 'How hard the stylus presses into the groove, in grams — set by the counterweight. Each cartridge states its range; this one 3–5 g.' },
  { term: 'Anti-skate', def: 'A small outward push that cancels the record’s pull toward the centre, so the stylus presses both groove walls evenly.' },
  { term: 'Phono stage', def: 'The preamp a raw cartridge needs: about +36 dB, and the RIAA curve undone (bass back up, treble back down). Exactly one in the chain.' },
  { term: 'Ground wire', def: 'The thin wire from the turntable to the mixer’s GND post. A SIGNAL ground against hum — never a reason to touch the mains earth.' },
] as const;

export const GOALS_VINYL = ['Balance, zero, set 4 g', 'Check it with a stylus scale', 'Match the anti-skate', 'Ground it: lose the hum', 'Stop the howl, booth still up', 'Fix the distorted record', 'Pass the check'] as const;

type View3 = 'ARM' | 'PHONO' | 'ROOM';
const setV = (f: (v: VinylState) => Partial<VinylState>) => updateBooth((b) => ({ ...b, vinyl: { ...(b.vinyl ?? freshVinyl()), ...f(b.vinyl ?? freshVinyl()) } }));

function phonoCount(b: Booth): PhonoCount {
  const r = channelRoute(b, 1);
  if (r.tooHot) return 2;
  if (r.tooQuiet) return 0;
  return 1;
}

function ArmTray({ onView }: { onView: () => void }) {
  const v = getBooth().vinyl ?? freshVinyl();
  const turn = (dg: number) => {
    onView();
    setV((x) => ({ weight: Math.round((x.weight + dg) * 100) / 100 }));
  };
  return (
    <View style={s2styles.tray}>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
        <LabChip label={v.armUp ? 'LOWER ONTO THE RECORD' : 'LIFT THE ARM TO BALANCE'} selected={v.armUp} onPress={() => { onView(); setV((x) => ({ armUp: !x.armUp, scale: false })); }} />
      </View>
      <Choices head="TURN THE COUNTERWEIGHT (the ring turns with it)" value={-1} items={[{ id: -0.5, label: '◀ −0.5' }, { id: -0.1, label: '−0.1' }, { id: 0.1, label: '+0.1' }, { id: 0.5, label: '+0.5 ▶' }]} onPick={(d) => turn(d as number)} />
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
        <LabChip label="ZERO THE DIAL RING" selected={false} onPress={() => { onView(); setV((x) => zeroDial(x)); }} compact />
        <LabChip label={v.scale ? 'STYLUS SCALE: ON' : 'STYLUS SCALE'} selected={v.scale} onPress={() => { onView(); setV((x) => ({ scale: !x.scale && !x.armUp })); }} compact />
        <LabChip label={v.slipmat ? 'SLIPMAT: ON' : 'SLIPMAT: OFF'} selected={v.slipmat} onPress={() => setV((x) => ({ slipmat: !x.slipmat }))} compact />
      </View>
      <Choices head="ANTI-SKATE DIAL" value={v.antiSkate} items={[0, 1, 2, 3, 4, 5].map((g) => ({ id: g, label: String(g) }))} onPick={(g) => { onView(); setV(() => ({ antiSkate: g as number })); }} />
      <TrayNote>The method: lift the arm and turn the weight until the arm FLOATS level; zero the ring without moving the weight; then turn weight and ring together to the force. Check with a scale if you have one.</TrayNote>
    </View>
  );
}

function PhonoTray({ onView }: { onView: () => void }) {
  const b = getBooth();
  const v = b.vinyl ?? freshVinyl();
  const [hot, setHot] = useState(false);
  const plugTo = (k: 'phono' | 'line') => {
    onView();
    const jl = `ch1.${k}.L` as JackId;
    const jr = `ch1.${k}.R` as JackId;
    const cur = getBooth();
    setHot(hotPatchSpeakers(cur, 'tt.rcaL', jl).length > 0 || hotPatchSpeakers(cur, 'tt.rcaR', jr).length > 0);
    updateBooth((x) => connect(connect(x, 'tt.rcaL', jl)!, 'tt.rcaR', jr)!);
  };
  return (
    <View style={s2styles.tray}>
      <Choices head="TURNTABLE PREAMP SWITCH (on its back)" value={b.ttPreamp} items={[{ id: 'PHONO', label: 'PHONO (raw)' }, { id: 'LINE', label: 'LINE (preamp on)' }]} onPick={(m) => { onView(); updateBooth((x) => ({ ...x, ttPreamp: m as 'PHONO' | 'LINE' })); }} />
      <Choices head="TURNTABLE PLUGS GO INTO" value={b.plugs['tt.rcaL'] === 'ch1.phono.L' ? 'phono' : b.plugs['tt.rcaL'] === 'ch1.line.L' ? 'line' : 'none'} items={[{ id: 'phono', label: 'CH1 PHONO' }, { id: 'line', label: 'CH1 LINE' }]} onPick={(k) => plugTo(k as 'phono' | 'line')} />
      {hot ? <TrayNote warn>HOT-PATCH — those plugs moved on a channel the crowd is hearing. The lab keeps it quiet; for real, pull CH1’s fader down first.</TrayNote> : null}
      <Choices head="CH1 INPUT SELECTOR" value={b.ch[1].input} items={[{ id: 'PHONO', label: 'PHONO' }, { id: 'LINE', label: 'LINE' }]} onPick={(i) => { onView(); updateBooth((x) => ({ ...x, ch: { ...x.ch, 1: { ...x.ch[1], input: i as 'PHONO' } } })); }} />
      <Choices head="GROUND WIRE → MIXER GND POST" value={v.gnd ? 'on' : 'off'} items={[{ id: 'on', label: 'CONNECTED' }, { id: 'off', label: 'LOOSE' }]} onPick={(g) => { onView(); setV(() => ({ gnd: g === 'on' })); }} note="A signal ground. If a buzz stays with the wire on, look at the cables and the turntable’s own ground — never lift the mains plug’s earth." />
    </View>
  );
}

function RoomTray({ onView }: { onView: () => void }) {
  const b = getBooth();
  const v = b.vinyl ?? freshVinyl();
  return (
    <View style={s2styles.tray}>
      <Choices head="BOOTH MONITOR LEVEL" value={Math.round(b.mixer.booth * 100) / 100} items={[0.3, 0.45, 0.6, 0.75, 0.9].map((x) => ({ id: x, label: pct(x) }))} onPick={(x) => { onView(); updateBooth((y) => ({ ...y, mixer: { ...y.mixer, booth: x as number } })); }} />
      <Choices head="THE BOOTH MONITOR STANDS" value={v.monitorNear ? 'near' : 'away'} items={[{ id: 'near', label: 'ON THE TABLE, NEAR' }, { id: 'away', label: 'ON A STAND, AWAY' }]} onPick={(p) => { onView(); setV(() => ({ monitorNear: p === 'near' })); }} />
      <Choices head="UNDER THE TURNTABLE" value={v.feet ? 'iso' : 'plain'} items={[{ id: 'plain', label: 'ITS OWN FEET' }, { id: 'iso', label: 'ISOLATION FEET' }]} onPick={(f) => { onView(); setV(() => ({ feet: f === 'iso' })); }} />
      <TrayNote>This feedback is through the TABLE and the stylus — different from microphone feedback. The lab holds the howl at a safe level and plays it quietly.</TrayNote>
    </View>
  );
}

function PageVinyl({ ctx }: { ctx: PageCtx }) {
  const { booth, audio, tr, motion } = useBoothKit();
  useScreenSetup((b) => {
    let x = connect(connect(b, 'tt.rcaL', 'ch1.phono.L')!, 'tt.rcaR', 'ch1.phono.R')!;
    const pos = TRACKS.nightFerry.leadInSec + 16 * barSec('nightFerry');
    x = { ...x, decks: { A: { ...x.decks.A, playing: false }, B: { ...x.decks.B, playing: false } } };
    return {
      ...x,
      tt: { ...x.tt, track: 'nightFerry', posSec: pos, playing: false, pitch: 0 },
      ttPreamp: 'PHONO',
      vinyl: freshVinyl(),
      ch: { 1: { ...x.ch[1], input: 'PHONO', trim: TRIM_UNITY, fader: 0.85, xf: 'THRU', cue: false }, 2: { ...x.ch[2], fader: 0 } },
      mixer: { ...x.mixer, booth: 0.45 },
      perspective: 'CROWD',
    };
  });
  const [view, setView] = useState<View3>('ARM');
  const [check, setCheck] = useState(false);
  const [faultFixed, setFaultFixed] = useState(false);
  const h = useRef({ set: false, scale: false, as: false, humHeard: false, gnd: false, howled: false, howlFixed: false });
  const v = booth.vinyl ?? freshVinyl();
  const tt = booth.tt;
  const s2 = s2Of(audio.last);
  const F = trueForce(v);
  const G = feedbackLoopGain(booth, v);
  // very light, the stylus jumps a groove (one revolution on) once per sound
  // chunk while it is too light — driven by the render, no timer
  const skipping = tt.playing && skips(v);
  const lastSkip = useRef<unknown>(null);
  useEffect(() => {
    const l = audio.last;
    if (!skipping || !l || lastSkip.current === l) return;
    lastSkip.current = l;
    updateBooth((b, t) => ({ ...b, tt: { ...b.tt, posSec: b.tt.posSec + REV_SEC, at: t } }));
  }, [skipping, audio.last]);
  const zeroedRight = v.ringZero != null && Math.abs(v.ringZero - BALANCE_AT) <= 0.1;
  if (!v.armUp && zeroedRight && Math.abs(F - FORCE_RANGE.suggest) <= 0.2 && Math.abs(dialReads(v) - FORCE_RANGE.suggest) <= 0.2) h.current.set = true;
  if (v.scale && !v.armUp && inRange(v)) h.current.scale = true;
  if (inRange(v) && Math.abs(v.antiSkate - F) <= 0.3) h.current.as = true;
  if (!v.gnd && tt.playing && booth.ch[1].fader > 0.3) h.current.humHeard = true;
  if (h.current.humHeard && v.gnd && tt.playing) h.current.gnd = true;
  if (tt.playing && G >= 1) h.current.howled = true;
  if (h.current.howled && tt.playing && G < 0.6 && booth.mixer.booth >= 0.7) h.current.howlFixed = true;
  const hits = [h.current.set, h.current.scale, h.current.as, h.current.gnd, h.current.howlFixed, faultFixed, check];
  const goals = GOALS_VINYL.map((label, i) => ({ label, hit: hits[i] }));
  const latched = useVisitGoals(ctx, goals, 'VINYL');
  const wf = wallForce(v);
  const trk = { l: trackAbility(wf.L) >= 1, r: trackAbility(wf.R) >= 1 };
  const trackWord = v.armUp ? 'ARM UP' : skips(v) ? 'SKIPS' : trk.l && trk.r ? 'CLEAN' : !trk.l && !trk.r ? 'MISTRACKS' : `MISTRACKS ${trk.r ? 'L' : 'R'}`;
  const count = phonoCount(booth);
  const panelH = (H: number, k: number) => Math.round(Math.min(160 * Math.sqrt(k), H * 0.52));
  const frame = { x: -10, y: -10, w: TT_W + 20, h: TT_D + 20 };
  const hl = view === 'ARM' ? (['counterweight', 'headshell'] as const) : view === 'ROOM' ? (['platter'] as const) : ([] as const);
  const callouts: Callout[] =
    view === 'ARM'
      ? [
          { id: 'cw', text: 'COUNTERWEIGHT', at: ARM_AT_REST.counterweight, dx: 18, dy: 0 },
          { id: 'hs', text: 'HEADSHELL + CARTRIDGE', at: ARM_AT_REST.headshell, dx: 0, dy: 20, tone: 'plain' },
          { id: 'as', text: 'ANTI-SKATE', at: { x: TT.armPivot.x + 26, y: TT.armPivot.y + 36 }, dx: 18, dy: 6, tone: 'plain' },
        ]
      : view === 'ROOM'
        ? [{ id: 'pl', text: 'PLATTER (picks up the shaking)', at: { x: TT.platter.cx - 120, y: TT.platter.cy + 100 }, dx: -10, dy: 14, tone: 'plain' }]
        : [{ id: 'rec', text: v.slipmat ? 'RECORD ON ITS SLIPMAT' : 'NO SLIPMAT', at: { x: TT.platter.cx - 100, y: TT.platter.cy - 90 }, dx: -10, dy: -10, tone: 'plain' }];
  return (
    <DjRack
      spec={{
        render: (w, hh) => (
          <Scene
            w={w}
            h={hh}
            frame={frame}
            motion={motion}
            fit={{ x: 0, y: panelH(hh, 1), w, h: hh - panelH(hh, 1) }}
            aspect={false}
            obstacles={TT_PARTS.map((p) => turntablePartBox(p))}
            soft={[{ x: 0, y: 0, w: TT_W, h: TT_D }]}
            callouts={callouts}
            screenOverlay={(W, H, _xf, k) => {
              const kk = Math.sqrt(k);
              const b = { x: 6, y: 4, w: W - 12, h: panelH(H, k) - 8 };
              return view === 'ARM' ? <ArmSide b={b} v={v} k={kk} /> : view === 'PHONO' ? <PhonoChain b={b} preamp={booth.ttPreamp} input={booth.ch[1].input} count={count} k={kk} /> : <RoomView b={b} v={v} gain={G} howlDb={s2?.howlDb ?? -120} k={kk} />;
            }}
            a11y={`You are looking at ${view === 'ARM' ? 'the tonearm from the side, with its counterweight dial' : view === 'PHONO' ? 'the phono chain from the cartridge to the channel, over the RIAA playback curve' : 'the booth from the side: the table, the turntable and the booth monitor'}, above the turntable from the top. Dial ${dialReads(v).toFixed(1)} grams; tracking ${trackWord.toLowerCase()}.`}
          >
            <TurntableTop x={0} y={0} d={tt} playing={tt.playing} highlight={hl} slipmat={v.slipmat} />
          </Scene>
        ),
        bezel: [
          { k: 'DIAL', v: `${dialReads(v).toFixed(1)} g`, tint: colors.textPrimary },
          { k: 'TRUE FORCE', v: v.scale && !v.armUp ? `${Math.max(0, F).toFixed(1)} g` : '—', sub: v.scale ? (tooHeavy(v) ? 'TOO HEAVY' : inRange(v) ? 'IN RANGE' : 'TOO LIGHT') : 'USE A SCALE', tint: v.scale ? (inRange(v) ? colors.green : '#ff8a7e') : colors.textSub },
          { k: 'TRACKING', v: trackWord, tint: trackWord === 'CLEAN' ? colors.green : trackWord === 'ARM UP' ? colors.textSub : '#ff8a7e' },
          view === 'ROOM'
            ? { k: 'LOOP GAIN', v: `×${G.toFixed(2)}`, sub: G >= 1 ? 'HOWL' : G >= 0.6 ? 'BOOMY' : 'OK', tint: G >= 1 ? '#ff5a48' : G >= 0.6 ? colors.amber : colors.green }
            : { k: 'STAGES', v: String(count), sub: !v.gnd ? 'HUM: NO GND' : count === 1 ? 'RIGHT' : 'WRONG', tint: count === 1 && v.gnd ? colors.green : '#ff8a7e' },
        ],
        params: [
          { kind: 'group', id: 'arm', label: 'ARM', valueLabel: `${dialReads(v).toFixed(1)} g`, valueA11y: `dial ${dialReads(v).toFixed(1)} grams`, render: () => <ArmTray onView={() => setView('ARM')} /> },
          { kind: 'group', id: 'phono', label: 'PHONO', valueLabel: `${booth.ttPreamp === 'LINE' ? 'TT ON' : 'RAW'}→${booth.ch[1].input}`, render: () => <PhonoTray onView={() => setView('PHONO')} /> },
          { kind: 'group', id: 'room', label: 'ROOM', valueLabel: `×${G.toFixed(1)}`, valueA11y: `acoustic loop gain ${G.toFixed(2)}`, render: () => <RoomTray onView={() => setView('ROOM')} /> },
          {
            kind: 'group',
            id: 'tt',
            label: 'PLATTER',
            valueLabel: tt.playing ? 'PLAYING' : 'STOPPED',
            render: () => (
              <View style={s2styles.tray}>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                  <LabChip
                    label={getBooth().tt.playing ? '■ STOP TURNTABLE' : '▶ START TURNTABLE'}
                    selected={getBooth().tt.playing}
                    onPress={() => {
                      if (!getBooth().tt.playing) void audio.requestSound();
                      updateBooth((x, t) => ({ ...x, tt: { ...x.tt, playing: !x.tt.playing, at: t } }));
                    }}
                  />
                </View>
                <Choices head="CH1 FADER" value={getBooth().ch[1].fader} items={[{ id: 0, label: 'DOWN' }, { id: 0.85, label: 'UP' }]} onPick={(f) => updateBooth((x) => ({ ...x, ch: { ...x.ch, 1: { ...x.ch[1], fader: f as number } } }))} />
                <Choices head="LISTEN AS" value={getBooth().perspective} items={[{ id: 'CROWD', label: 'CROWD' }, { id: 'BOOTH', label: 'BOOTH' }]} onPick={(p) => updateBooth((x) => ({ ...x, perspective: p as 'CROWD', listen: 0.35 }))} />
                {tt.playing && v.armUp ? <TrayNote>The arm is lifted: the platter turns, but no stylus is in the groove.</TrayNote> : null}
              </View>
            ),
          },
          stopKey(tr),
        ],
        initialParam: 'arm',
      }}
    >
      <Step n={1}>
        <Look>{`You are looking at ${view === 'ARM' ? 'the tonearm from the side (counterweight and dial on the right, the cartridge on the left)' : view === 'PHONO' ? 'the phono chain, cartridge to channel, over the RIAA playback curve' : 'the booth from the side: table, turntable, booth monitor'} above the turntable seen from the top. ARM, PHONO and ROOM each bring up their own view.`}</Look>
        <P>A turntable’s stylus traces a groove with a few grams of force; the cartridge turns that into a few thousandths of a volt, which needs one phono stage to become line level.</P>
        <P>Set the force by the method, keep the signal’s ground connected, and keep the turntable away from its own sound.</P>
        <Terms items={TERMS} />
        <Note>{`An optional screen, for turntables. On a standalone system you can go straight on to the next screens — nothing here is needed for them.`}</Note>
      </Step>
      <Step n={2}>
        <Do>Open TURNTABLE and start it. The dial says 4.0 g — but listen: the loud, bright moments spit and fizz. Open ARM, put the STYLUS SCALE under the needle: the real force is 2.5 g. The ring was never zeroed.</Do>
        <P>So set it properly: LIFT THE ARM, turn the weight until it FLOATS LEVEL, ZERO THE DIAL RING, lower it, then turn the weight to 4.0 g. Set the ANTI-SKATE to match.</P>
      </Step>
      <Step n={3}>
        <P>Open PHONO and loosen the GROUND WIRE: a 50 Hz buzz under the music (in some countries 60 Hz). Connect it again. Then switch the turntable’s preamp to LINE while it still feeds CH1 PHONO: two phono stages — loud, boomy, distorted.</P>
        <P>Open ROOM and raise the BOOTH MONITOR to 75 %: with the monitor close and no isolation, a low howl starts to build. The lab holds it at a safe level and plays it quietly — on a real system it can damage speakers.</P>
        <Note tone="safety">Too heavy a force does not sound wrong at first, but wears the record and the stylus fast. Stay inside the cartridge’s range; its instructions win over any number here.</Note>
      </Step>
      <Step n={4}>
        <Do>Balance, zero and set 4 g; check it with the scale; match the anti-skate; then loosen the ground wire, hear the buzz and connect it again.</Do>
        <P>Many scratch DJs set the anti-skate to zero so the arm never skates off a back-cue; many others follow the instructions and set it to the force. Try both — starting points, not rules.</P>
        <GoalChips goals={goals.slice(0, 4)} latched={latched.slice(0, 4)} />
      </Step>
      <Step n={5}>
        <Do>On your own: with the booth monitor at 75 % or more, stop the howl — without turning the booth down.</Do>
        <UnderstandingCheck
          eyebrow="CHECK YOURSELF"
          question="The force is set to 4 g, but on loud passages the RIGHT channel distorts while the left stays clean. What do you check?"
          options={['The anti-skate — too little lets the stylus lean off the outer wall, which carries the right channel', 'The ground wire', 'The tracking force — it must be far too heavy', 'The record’s RIAA curve']}
          correct={0}
          explain="A spinning record pulls the arm toward the centre (skating), pressing the inner groove wall (left) and easing off the outer wall (right). Anti-skate cancels that pull; without it the right channel mistracks first."
          wrong={[undefined, 'A missing ground is a steady buzz on both sides, not distortion on loud passages.', 'Too heavy wears the record but tracks fine; one-sided distortion points at the skating force.', 'The RIAA curve is undone by the phono stage for both channels alike.']}
          onCorrect={() => setCheck(true)}
        />
        <FaultCard
          title="THE RECORD SOUNDS DISTORTED AND BOOMY"
          symptom="The turntable is playing into channel 1. It is far too loud, the bass booms and everything distorts — even with the trim down."
          start={() => {
            void audio.requestSound();
            setView('PHONO');
            updateBooth((x, t) => {
              const y = connect(connect(x, 'tt.rcaL', 'ch1.phono.L')!, 'tt.rcaR', 'ch1.phono.R')!;
              return { ...y, ttPreamp: 'LINE', tt: { ...y.tt, playing: true, at: t }, ch: { ...y.ch, 1: { ...y.ch[1], input: 'PHONO', fader: 0.85 } }, vinyl: { ...(y.vinyl ?? freshVinyl()), armUp: false } };
            });
          }}
          fixed={tt.playing && phonoCount(booth) === 1 && !!channelRoute(booth, 1).L}
          hints={['Open PHONO and read the chain: how many phono stages are there?', 'The turntable’s own preamp is ON (LINE), and it feeds a PHONO input — two stages.', 'Switch the turntable to PHONO, or move its plugs to CH1 LINE with the selector on LINE. Then reset the trim.']}
          why="The turntable’s built-in preamp had already added the gain and undone the RIAA curve; the mixer’s PHONO input did it again — about 36 dB too hot, with the bass boosted twice, so the phono stage overloaded before the trim. Exactly one phono stage."
          onFixed={() => setFaultFixed(true)}
        />
        <GoalChips goals={goals.slice(4)} latched={latched.slice(4)} />
      </Step>
    </DjRack>
  );
}

export const P17: PageDef = { title: 'Vinyl turntables and phono audio', short: 'VINYL', Component: PageVinyl, manualDone: true, rack: true };
