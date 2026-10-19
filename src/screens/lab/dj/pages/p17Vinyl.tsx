/**
 * Screen 17 — Vinyl turntables and phono audio (research DJ06, DJ07; the
 * turntable feedback of DJ22; the ground wire of DJ24) — an OPTIONAL
 * equipment path: cartridge and stylus, the tonearm, tracking force by the
 * real method (balance, zero the ring, set), anti-skate, phono stages and
 * RIAA, grounding and isolation. Everything audible is modelled
 * (model/djVinyl through engine/djStage2): a light arm mistracks (and very
 * light, skips), no ground wire buzzes, a booth monitor too close and too
 * loud builds a low howl — held safe and quiet. A stylus dropped or lifted on
 * the live channel is flagged as a THUMP. The fault (a different cause from
 * the Observe): a raw turntable into a LINE input — no phono stage at all.
 */
import { useEffect, useRef, useState } from 'react';
import { View } from 'react-native';
import { colors } from '../../../../theme/tokens';
import { LabChip } from '../../LabShell';
import { UnderstandingCheck } from '../../tuning/components/check';
import type { PageCtx, PageDef } from '../../kit/PagedLab';
import { Scene, type Callout } from '../art/Scene';
import { TurntableTop, TT_PARTS, armAngleAt, armPartAt, turntablePartBox } from '../art/TurntableTop';
import { ArmSide, PhonoChain, RoomView, type PhonoCount } from '../art/vinylArt';
import { TT, TT_D, TT_W } from '../geometry/boothGeometry';
import { DjRack } from '../DjRack';
import { Do, FaultCard, GoalChips, Look, Note, P, Step, Terms, useVisitGoals } from '../bits';
import { stopKey, pct } from '../dock';
import { getBooth, updateBooth } from '../booth/boothStore';
import { useScreenSetup } from '../booth/setup';
import { TRIM_UNITY, channelRoute, connect, hotPatchSpeakers, type Booth, type JackId } from '../model/djModel';
import { TRACKS, barSec, trackSeconds } from '../engine/djMusic';
import { FORCE_RANGE, armMoveThumps, dialReads, feedbackLoopGain, freshVinyl, inRange, skips, tooHeavy, trackAbility, trueForce, wallForce, zeroDial, BALANCE_AT, type VinylState } from '../model/djVinyl';
import { REV_SEC } from '../model/djDvs';
import { useBoothKit } from './shared';
import { Choices, TrayNote, s2Of, s2styles } from './s2kit';
import { SkipOptional } from './skipOptional';

const TERMS = [
  { term: 'Tracking force', def: 'How hard the stylus presses into the groove, in grams — set by the counterweight. Each cartridge states its range; this one 3–5 g.' },
  { term: 'Anti-skate', def: 'A small outward push that cancels the record’s pull toward the centre, so the stylus presses both groove walls evenly.' },
  { term: 'Phono stage', def: 'The preamp a raw cartridge needs: about +36 dB for the moving-magnet cartridges DJs use, and the RIAA curve undone (bass back up, treble back down). Exactly one in the chain.' },
  { term: 'Ground wire', def: 'The thin wire from the turntable to the mixer’s GND post. A SIGNAL ground against hum — never a reason to touch the mains earth.' },
] as const;

export const GOALS_VINYL = ['Balance, zero, set 4 g', 'Check it with a stylus scale', 'Match the anti-skate', 'Ground it: lose the hum', 'Stop the howl, booth still up', 'Fix the thin, quiet record', 'Pass the check'] as const;

type View3 = 'ARM' | 'PHONO' | 'ROOM';
const setV = (f: (v: VinylState) => Partial<VinylState>) => updateBooth((b) => ({ ...b, vinyl: { ...(b.vinyl ?? freshVinyl()), ...f(b.vinyl ?? freshVinyl()) } }));

function phonoCount(b: Booth): PhonoCount {
  const r = channelRoute(b, 1);
  if (!r.L && !r.R) return -1;
  if (r.tooHot) return 2;
  if (r.tooQuiet) return 0;
  return 1;
}
const plugTarget = (b: Booth): 'phono' | 'line' | 'none' => (b.plugs['tt.rcaL'] === 'ch1.phono.L' ? 'phono' : b.plugs['tt.rcaL'] === 'ch1.line.L' ? 'line' : 'none');

function ArmTray({ onView }: { onView: () => void }) {
  // opening the tray brings up its own view
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => onView(), []);
  const v = getBooth().vinyl ?? freshVinyl();
  const [thump, setThump] = useState(false);
  const turn = (dg: number) => {
    onView();
    setV((x) => ({ weight: Math.round((x.weight + dg) * 100) / 100 }));
  };
  return (
    <View style={s2styles.tray}>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
        <LabChip
          label={v.armUp ? 'LOWER ONTO THE RECORD (CUE LEVER)' : 'LIFT ON THE CUE LEVER TO BALANCE'}
          selected={v.armUp}
          onPress={() => {
            onView();
            const b = getBooth();
            setThump(armMoveThumps(b, !(b.vinyl ?? freshVinyl()).armUp));
            setV((x) => ({ armUp: !x.armUp, scale: false }));
          }}
        />
      </View>
      {thump ? <TrayNote warn>THUMP — the stylus moved on a live channel with its fader up. For real that is a loud thump through the PA, and a dropped stylus can chip. Pull FADER 1 down first (PLATTER), then use the cue lever.</TrayNote> : null}
      <Choices head="TURN THE COUNTERWEIGHT (the ring turns with it)" value={-1} items={[{ id: -0.5, label: '◀ −0.5' }, { id: -0.1, label: '−0.1' }, { id: 0.1, label: '+0.1' }, { id: 0.5, label: '+0.5 ▶' }]} onPick={(d) => turn(d as number)} />
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
        <LabChip label="ZERO THE DIAL RING" selected={false} onPress={() => { onView(); setV((x) => zeroDial(x)); }} compact />
        <LabChip label={v.scale ? 'STYLUS SCALE: ON' : 'STYLUS SCALE'} selected={v.scale} onPress={() => { onView(); setV((x) => ({ scale: !x.scale && !x.armUp })); }} compact />
      </View>
      <Choices head="ANTI-SKATE DIAL" value={v.antiSkate} items={[0, 1, 2, 3, 4, 5].map((g) => ({ id: g, label: String(g) }))} onPick={(g) => { onView(); setV(() => ({ antiSkate: g as number })); }} />
      <TrayNote>The method: lift the arm on the cue lever and turn the weight until the arm FLOATS level; zero the ring without moving the weight; then turn weight and ring together to the force. Check with a scale if you have one. (A slipmat under the record lets it slip for cueing; it is not part of the signal.)</TrayNote>
    </View>
  );
}

function PhonoTray({ onView }: { onView: () => void }) {
  // opening the tray brings up its own view
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => onView(), []);
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
      <Choices head="TURNTABLE PLUGS GO INTO" value={plugTarget(b)} items={[{ id: 'phono', label: 'CH1 PHONO' }, { id: 'line', label: 'CH1 LINE' }]} onPick={(k) => plugTo(k as 'phono' | 'line')} />
      {hot ? <TrayNote warn>HOT-PATCH — those plugs moved on a channel the crowd is hearing. The lab keeps it quiet; for real, pull CH1’s fader down first.</TrayNote> : null}
      <Choices head="CH1 INPUT SELECTOR" value={b.ch[1].input} items={[{ id: 'PHONO', label: 'PHONO' }, { id: 'LINE', label: 'LINE' }]} onPick={(i) => { onView(); updateBooth((x) => ({ ...x, ch: { ...x.ch, 1: { ...x.ch[1], input: i as 'PHONO' } } })); }} />
      <Choices head="GROUND WIRE → MIXER GND POST" value={v.gnd ? 'on' : 'off'} items={[{ id: 'on', label: 'CONNECTED' }, { id: 'off', label: 'LOOSE' }]} onPick={(g) => { onView(); setV(() => ({ gnd: g === 'on' })); }} note="A signal ground. If a buzz stays with the wire on, look at the cables and the turntable’s own ground — never lift the mains plug’s earth." />
    </View>
  );
}

function RoomTray({ onView }: { onView: () => void }) {
  // opening the tray brings up its own view
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => onView(), []);
  const b = getBooth();
  const v = b.vinyl ?? freshVinyl();
  return (
    <View style={s2styles.tray}>
      <Choices head="BOOTH MONITOR LEVEL" value={Math.round(b.mixer.booth * 100) / 100} items={[0.3, 0.45, 0.6, 0.75, 0.9].map((x) => ({ id: x, label: pct(x) }))} onPick={(x) => { onView(); updateBooth((y) => ({ ...y, mixer: { ...y.mixer, booth: x as number } })); }} />
      <Choices head="THE BOOTH MONITOR STANDS" value={v.monitorNear ? 'near' : 'away'} items={[{ id: 'near', label: 'ON THE TABLE, NEAR' }, { id: 'away', label: 'ON A STAND, AWAY' }]} onPick={(p) => { onView(); setV(() => ({ monitorNear: p === 'near' })); }} />
      <Choices head="UNDER THE TURNTABLE" value={v.feet ? 'iso' : 'plain'} items={[{ id: 'plain', label: 'ITS OWN FEET' }, { id: 'iso', label: 'ISOLATION FEET' }]} onPick={(f) => { onView(); setV(() => ({ feet: f === 'iso' })); }} />
      <TrayNote>This feedback is through the AIR, the TABLE and the stylus — different from microphone feedback. The booth monitor does it here; in a club the PA’s subs often do it too (Screen 20). The lab holds the howl at a safe level and plays it quietly.</TrayNote>
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
  const panelH = (H: number, k: number) => (view === 'ROOM' ? Math.round(Math.min(204 * Math.sqrt(k), H * 0.62)) : Math.round(Math.min(160 * Math.sqrt(k), H * 0.52)));
  const frame = { x: -10, y: -10, w: TT_W + 20, h: TT_D + 20 };
  // the arm's angle NOW, from the same formula its transform uses: the
  // callouts and the label obstacles ride the arm (visual review 2, blocker 3)
  const spinning = tt.playing && !!tt.track;
  const posNow = spinning ? tt.posSec + Math.max(0, motion.clock.value - tt.at) * (1 + tt.pitch / 100) : tt.posSec;
  const armAng = armAngleAt(posNow, tt.track ? trackSeconds(tt.track) : 1, spinning && !v.armUp);
  const hl = view === 'ARM' ? (['counterweight', 'headshell'] as const) : view === 'ROOM' ? (['platter'] as const) : ([] as const);
  const callouts: Callout[] =
    view === 'ARM'
      ? [
          { id: 'cw', text: 'COUNTERWEIGHT', at: armPartAt('counterweight', armAng), dx: 18, dy: 0 },
          { id: 'hs', text: 'HEADSHELL + CARTRIDGE', at: armPartAt('headshell', armAng), dx: 0, dy: 20, tone: 'plain' },
          { id: 'as', text: 'ANTI-SKATE', at: { x: TT.armPivot.x + 26, y: TT.armPivot.y + 36 }, dx: 18, dy: 6, tone: 'plain' },
        ]
      : view === 'ROOM'
        ? [{ id: 'pl', text: 'PLATTER · PICKS UP THE SHAKING', at: { x: TT.platter.cx - 96, y: TT.platter.cy - 128 }, dx: -10, dy: -12, tone: 'plain' }]
        : [];
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
            // FULL SCREEN's shape: the side view over the turntable's top view
            aspect={0.86}
            obstacles={[{ x: 0, y: 0, w: TT_W, h: TT_D }, ...TT_PARTS.map((p) => turntablePartBox(p, armAng))]}
            callouts={callouts}
            screenOverlay={(W, H, _xf, k) => {
              const kk = Math.sqrt(k);
              const b = { x: 6, y: 4, w: W - 12, h: panelH(H, k) - 8 };
              return view === 'ARM' ? <ArmSide b={b} v={v} k={kk} /> : view === 'PHONO' ? <PhonoChain b={b} preamp={booth.ttPreamp} input={booth.ch[1].input} count={count} plugTo={plugTarget(booth)} gnd={v.gnd} k={kk} /> : <RoomView b={b} v={v} gain={G} howlDb={s2?.howlDb ?? -120} k={kk} />;
            }}
            a11y={`You are looking at ${view === 'ARM' ? 'the tonearm from the side — its gimbal, counterweight and dial ring, the cue lever, the headshell and cartridge over the record' : view === 'PHONO' ? 'the phono chain from the cartridge to the channel, the turntable’s and the mixer’s rear panels with the leads and the ground wire, and the RIAA playback curve' : 'the booth from the side, drawn to one scale: the table, the turntable on its feet and the booth monitor, with the sound’s path through the air and, as an overlay, the electrical path'}, above the turntable from the top. Dial ${dialReads(v).toFixed(1)} grams; tracking ${trackWord.toLowerCase()}.`}
          >
            <TurntableTop x={0} y={0} d={tt} playing={tt.playing} highlight={hl} slipmat={v.slipmat} armOff={v.armUp} />
          </Scene>
        ),
        bezel: [
          { k: 'DIAL', v: `${dialReads(v).toFixed(1)} g`, tint: colors.textPrimary },
          { k: 'TRUE FORCE', v: v.scale && !v.armUp ? `${Math.max(0, F).toFixed(1)} g` : '—', sub: v.scale ? (tooHeavy(v) ? 'TOO HEAVY' : inRange(v) ? 'IN RANGE' : 'TOO LIGHT') : 'USE A SCALE', tint: v.scale ? (inRange(v) ? colors.green : '#ff8a7e') : colors.textSub },
          { k: 'TRACKING', v: trackWord, tint: trackWord === 'CLEAN' ? colors.green : trackWord === 'ARM UP' ? colors.textSub : '#ff8a7e' },
          view === 'ROOM'
            ? { k: 'LOOP GAIN', v: `×${G.toFixed(2)}`, sub: G >= 1 ? 'HOWL' : G >= 0.6 ? 'BOOMY' : 'OK', tint: G >= 1 ? '#ff5a48' : G >= 0.6 ? colors.amber : colors.green }
            : { k: 'PHONO STAGES', v: count < 0 ? '—' : String(count), sub: !v.gnd ? 'HUM: NO GND' : count === 1 ? 'RIGHT' : 'WRONG', tint: count === 1 && v.gnd ? colors.green : '#ff8a7e' },
        ],
        params: [
          { kind: 'group', id: 'arm', label: 'ARM', valueLabel: `${dialReads(v).toFixed(1)} g`, valueA11y: `dial ${dialReads(v).toFixed(1)} grams`, render: () => <ArmTray onView={() => setView('ARM')} /> },
          // the phono stages in a WORD that fits the key (visual review 2 #23)
          { kind: 'group', id: 'phono', label: 'PHONO', valueLabel: count === 1 ? 'ONE' : count === 2 ? 'TWO' : count === 0 ? 'NONE' : 'NO SIG', valueA11y: `${count} phono stage${count === 1 ? '' : 's'}; turntable preamp ${booth.ttPreamp === 'LINE' ? 'on' : 'off'}, channel 1 input ${booth.ch[1].input}`, render: () => <PhonoTray onView={() => setView('PHONO')} /> },
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
                <Choices head="FADER 1" value={getBooth().ch[1].fader} items={[{ id: 0, label: 'DOWN' }, { id: 0.85, label: 'UP' }]} onPick={(f) => updateBooth((x) => ({ ...x, ch: { ...x.ch, 1: { ...x.ch[1], fader: f as number } } }))} />
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
        <Look>{`You are looking at ${view === 'ARM' ? 'the tonearm from the side (counterweight and dial on the right, the cartridge over the record on the left)' : view === 'PHONO' ? 'the phono chain, cartridge to channel, with the rear panels and the RIAA playback curve' : 'the booth from the side, to scale: table, turntable, booth monitor'} above the turntable seen from the top. ARM, PHONO and ROOM each bring up their own view.`}</Look>
        <P>A turntable’s stylus traces a groove with a few grams of force; the cartridge turns that into a few thousandths of a volt, which needs one phono stage to become line level.</P>
        <P>Set the force by the method, keep the signal’s ground connected, and keep the turntable away from its own sound.</P>
        <Terms items={TERMS} />
        <SkipOptional ctx={ctx} here={17} />
      </Step>
      <Step n={2}>
        <Do>Open PLATTER and start the turntable. The dial says 4.0 g — but listen: the loud, bright moments spit and fizz. Open ARM, put the STYLUS SCALE under the needle: the real force is 2.5 g. The ring was never zeroed.</Do>
        <P>So set it properly: LIFT the arm on the cue lever, turn the weight until it FLOATS LEVEL, ZERO THE DIAL RING, lower it, then turn the weight to 4.0 g. Set the ANTI-SKATE to match.</P>
        <Note tone="safety">Lift and lower the arm with the cue lever, and with the channel fader down (PLATTER → FADER 1 DOWN): a dropped stylus is a loud thump through the PA, and can chip the stylus. The lab flags a THUMP when you move the arm on a live channel.</Note>
      </Step>
      <Step n={3}>
        <P>Open PHONO and loosen the GROUND WIRE: a 60 Hz buzz under the music (50 Hz in many countries). Connect it again. Then switch the turntable’s preamp to LINE while it still feeds CH1 PHONO: two phono stages — loud, boomy, distorted. Switch it back.</P>
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
          title="THE RECORD IS THIN AND QUIET"
          symptom="The turntable is playing into channel 1, but the record is very quiet and thin — the bass has gone and the top end hisses, even with the channel up."
          start={() => {
            void audio.requestSound();
            setView('PHONO');
            // a different cause from the Observe (learning review 2, p17 #2):
            // a RAW turntable (its preamp off) into a LINE input — no phono stage
            updateBooth((x, t) => {
              const y = connect(connect(x, 'tt.rcaL', 'ch1.line.L')!, 'tt.rcaR', 'ch1.line.R')!;
              return { ...y, ttPreamp: 'PHONO', tt: { ...y.tt, playing: true, at: t }, ch: { ...y.ch, 1: { ...y.ch[1], input: 'LINE', fader: 0.85 } }, vinyl: { ...(y.vinyl ?? freshVinyl()), armUp: false } };
            });
          }}
          fixed={tt.playing && phonoCount(booth) === 1 && !!channelRoute(booth, 1).L}
          hints={['Open PHONO and read the chain: how many phono stages are there?', 'The turntable’s own preamp is OFF (PHONO), and it feeds a LINE input — no phono stage at all.', 'Switch the turntable to LINE, or move its plugs to CH1 PHONO with the selector on PHONO.']}
          why="A raw cartridge gives a few thousandths of a volt, cut in the bass and lifted in the treble by the RIAA recording curve. Into a LINE input nothing undid either: about 36 dB too quiet, thin and hissy. Exactly one phono stage — the turntable’s own, or the mixer’s PHONO input."
          onFixed={() => setFaultFixed(true)}
        />
        <GoalChips goals={goals.slice(4)} latched={latched.slice(4)} />
      </Step>
    </DjRack>
  );
}

export const P17: PageDef = { title: 'Vinyl turntables and phono audio', short: 'VINYL', Component: PageVinyl, manualDone: true, rack: true };
