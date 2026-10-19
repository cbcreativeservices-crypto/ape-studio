/**
 * Screen 18 — Digital vinyl systems (research DJ26) — an OPTIONAL equipment
 * path: a control record, its control signal into the mixer's PHONO jacks
 * and over USB to the software, the music back over USB, calibration, the
 * ABSOLUTE / RELATIVE / INTERNAL / THRU modes, tracking problems and
 * recovery. SIMULATED (model/djDvs): the control tone is rendered for real
 * (a 1 kHz quadrature tone whose speed is the platter's), and the scope is
 * its own samples; the software's following is modelled. The fault: the
 * control tone on the crowd's speakers (played quietly in the lab).
 */
import { useEffect, useRef, useState } from 'react';
import { View } from 'react-native';
import { Group } from '@shopify/react-native-skia';
import { colors } from '../../../../theme/tokens';
import { LabChip } from '../../LabShell';
import { UnderstandingCheck } from '../../tuning/components/check';
import type { PageCtx, PageDef } from '../../kit/PagedLab';
import { Scene } from '../art/Scene';
import { useStageTextScale } from '../../rack/stageAspect';
import { TurntableTop, TT_PARTS, armPoseAngle, turntablePartBox } from '../art/TurntableTop';
import { DvsRig, DvsRoute, DvsScope } from '../art/dvsArt';
import { TT_D, TT_W } from '../geometry/boothGeometry';
import { DjRack } from '../DjRack';
import { Do, FaultCard, GoalChips, Look, Note, P, Step, Terms, useVisitGoals } from '../bits';
import { stopKey } from '../dock';
import { getBooth, updateBooth } from '../booth/boothStore';
import { useScreenSetup } from '../booth/setup';
import { TRIM_UNITY, connect, type Booth } from '../model/djModel';
import { TRACKS, barSec, trackSeconds } from '../engine/djMusic';
import { freshLaptop, roundTripMs } from '../model/djLaptop';
import { setVinyl } from '../model/djVinyl';
import { DVS_MODES, DVS_MODE_WORDS, REV_SEC, dvsFollow, dvsLock, dvsQuality, freshDvs, toneOnChannel, type DvsMode, type DvsState } from '../model/djDvs';
import { controlScope } from '../engine/djStage2';
import { useBoothKit } from './shared';
import { Choices, TrayNote, s2Of, s2styles } from './s2kit';
import { SkipOptional } from './skipOptional';
import { clampNeedle } from './eventGuards';

const TERMS = [
  { term: 'Control record', def: 'A record with no music on it — a steady tone the software can read. Its speed and direction tell the software how to play the track.' },
  { term: 'Calibrate', def: 'Letting the software measure the noise — on this system, with the needle on the still record — so it can tell the control tone from hum and crackle.' },
  { term: 'Absolute / relative', def: 'ABSOLUTE: the needle’s place is the track’s place, so a needle drop jumps the music. RELATIVE: only speed and direction follow; the music keeps its own place.' },
  { term: 'Internal', def: 'The software plays on its own and ignores the turntable — the way to keep the music going when the control signal fails.' },
] as const;

export const GOALS_DVS = ['Play deck 1 from the turntable', 'Needle drop in ABSOLUTE', 'Needle drop in RELATIVE', 'Ride out a dirty record', 'Calibrate after a change', 'Get the tone off the speakers', 'Pass the check'] as const;

/** Every change on this screen goes through the DVS follow step (the
 *  software deck reacts in the same update — never in an effect loop). */
const dvsUpdate = (f: (b: Booth, t: number) => Booth) => updateBooth((b, t) => dvsFollow(f(b, t)));
const setDvs = (f: (d: DvsState) => Partial<DvsState>) => dvsUpdate((b) => ({ ...b, dvs: { ...(b.dvs ?? freshDvs()), ...f(b.dvs ?? freshDvs()) } }));

function TtTray({ onDrop, requestSound }: { onDrop: () => void; requestSound: () => void }) {
  const b = getBooth();
  return (
    <View style={s2styles.tray}>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
        <LabChip
          label={b.tt.playing ? '■ STOP PLATTER' : '▶ START PLATTER'}
          selected={b.tt.playing}
          onPress={() => {
            if (!getBooth().tt.playing) requestSound();
            dvsUpdate((x, t) => ({ ...x, tt: { ...x.tt, playing: !x.tt.playing, at: t } }));
          }}
        />
        <LabChip
          label="NEEDLE DROP +30 s"
          selected={false}
          onPress={() => {
            onDrop();
            dvsUpdate((x, t) => ({ ...x, tt: { ...x.tt, posSec: clampNeedle(x.tt.posSec + 30, x.tt.track ? trackSeconds(x.tt.track) : 0), at: t } }));
          }}
          compact
        />
        <LabChip label="BACK −30 s" selected={false} onPress={() => { onDrop(); dvsUpdate((x, t) => ({ ...x, tt: { ...x.tt, posSec: clampNeedle(x.tt.posSec - 30, x.tt.track ? trackSeconds(x.tt.track) : 0), at: t } })); }} compact />
      </View>
      <Choices head="PLATTER PITCH" value={Math.round(b.tt.pitch)} items={[-4, 0, 4].map((p) => ({ id: p, label: p === 0 ? '0 %' : `${p > 0 ? '+' : ''}${p} %` }))} onPick={(p) => dvsUpdate((x) => ({ ...x, tt: { ...x.tt, pitch: p as number } }))} note="In ABSOLUTE and RELATIVE the software deck follows the platter’s speed." />
    </View>
  );
}

function SignalTray({ onCal }: { onCal: (ok: boolean) => void }) {
  const b = getBooth();
  const d = b.dvs ?? freshDvs();
  const v = b.vinyl ?? setVinyl();
  return (
    <View style={s2styles.tray}>
      <Choices head="TURNTABLE PREAMP SWITCH" value={b.ttPreamp} items={[{ id: 'PHONO', label: 'PHONO (raw)' }, { id: 'LINE', label: 'LINE' }]} onPick={(m) => dvsUpdate((x) => ({ ...x, ttPreamp: m as 'PHONO' | 'LINE', dvs: { ...(x.dvs ?? freshDvs()), calibrated: false } }))} />
      <Choices head="GROUND WIRE" value={v.gnd ? 'on' : 'off'} items={[{ id: 'on', label: 'CONNECTED' }, { id: 'off', label: 'LOOSE' }]} onPick={(g) => dvsUpdate((x) => ({ ...x, vinyl: { ...(x.vinyl ?? setVinyl()), gnd: g === 'on' }, dvs: { ...(x.dvs ?? freshDvs()), calibrated: false } }))} />
      <Choices head="THE CONTROL RECORD" value={d.dirty ? 'dirty' : 'clean'} items={[{ id: 'clean', label: 'CLEAN' }, { id: 'dirty', label: 'DUSTY, WORN' }]} onPick={(c) => setDvs(() => ({ dirty: c === 'dirty', calibrated: false }))} />
      <View style={{ flexDirection: 'row', gap: 6 }}>
        <LabChip
          label={d.calibrated ? 'CALIBRATED ✓' : 'CALIBRATE'}
          selected={d.calibrated}
          onPress={() => {
            const ok = !getBooth().tt.playing;
            if (ok) setDvs(() => ({ calibrated: true }));
            onCal(ok);
          }}
        />
      </View>
      <TrayNote>On this system, calibrate with the needle in the groove and the platter STOPPED (it measures the noise floor); some systems calibrate with the record playing. Do it again after any change to the setup.</TrayNote>
    </View>
  );
}

function PageDvs({ ctx }: { ctx: PageCtx }) {
  const { booth, audio, tr, motion } = useBoothKit();
  // FULL SCREEN: the text scale the Scene hands its screenOverlay — the top
  // panel's height is taken at it, so the gear's room must start there too
  const kz = useStageTextScale();
  const { ready } = useScreenSetup((b) => {
    let x = connect(connect(b, 'tt.rcaL', 'ch1.phono.L')!, 'tt.rcaR', 'ch1.phono.R')!;
    const pos = TRACKS.nightFerry.leadInSec + 16 * barSec('nightFerry');
    x = { ...x, decks: { A: { ...x.decks.A, track: 'nightFerry', posSec: pos, playing: false, pitch: 0 }, B: { ...x.decks.B, playing: false } } };
    return {
      ...x,
      tt: { ...x.tt, track: 'nightFerry', posSec: pos, playing: false, pitch: 0 },
      ttPreamp: 'PHONO',
      vinyl: setVinyl(),
      // DVS players run the smallest buffer that stays clean (audio review 2 #16)
      laptop: { ...freshLaptop(), buffer: 256 },
      dvs: freshDvs(),
      ch: { 1: { ...x.ch[1], input: 'USB', trim: TRIM_UNITY, fader: 0.85, xf: 'THRU', cue: false }, 2: { ...x.ch[2], fader: 0 } },
      perspective: 'CROWD',
    };
  });
  const [check, setCheck] = useState(false);
  const [faultFixed, setFaultFixed] = useState(false);
  const [calMsg, setCalMsg] = useState<string | null>(null);
  const h = useRef({ play: false, abs: false, rel: false, ride: false, cal: false, uncal: false });
  const d = booth.dvs ?? freshDvs();
  const tt = booth.tt;
  const A = booth.decks.A;
  const lock = dvsLock(booth);
  const q = dvsQuality(booth);
  const tone = toneOnChannel(booth);
  const last = audio.last;
  const s2 = s2Of(last);
  // a dusty record makes the needle jump a groove now and then
  // (once per sound chunk while it is dusty — driven by the render, no timer)
  const skipping = tt.playing && d.dirty;
  const lastSkip = useRef<unknown>(null);
  useEffect(() => {
    const l = audio.last;
    if (!skipping || !l || lastSkip.current === l) return;
    lastSkip.current = l;
    dvsUpdate((b, t) => ({ ...b, tt: { ...b.tt, posSec: b.tt.posSec + REV_SEC, at: t } }));
  }, [skipping, audio.last]);
  const musicLive = A.playing && booth.ch[1].input === 'USB' && d.mode !== 'THRU';
  // nothing is judged on the FIRST render (the previous screen's booth): a
  // dvs left uncalibrated on an earlier visit, carried through Screen 19,
  // ticked "Calibrate after a change" on arrival (toddler hunt 2026-10-19)
  if (ready) {
    if (d.mode === 'ABS' && tt.playing && lock === 'LOCKED' && A.playing && booth.ch[1].input === 'USB' && last && last.rmsDb.ch1 > -45) h.current.play = true;
    if (d.dirty && tt.playing && d.mode === 'INT' && A.playing) h.current.ride = true;
    if (!d.calibrated) h.current.uncal = true;
    if (h.current.uncal && d.calibrated && q >= 0.8) h.current.cal = true;
  }
  const onDrop = () => {
    const b = getBooth();
    const lk = dvsLock(b);
    if (b.dvs?.mode === 'ABS' && b.tt.playing && lk === 'LOCKED') h.current.abs = true;
    if (b.dvs?.mode === 'REL' && b.tt.playing && lk !== 'LOST') h.current.rel = true;
  };
  const hits = [h.current.play, h.current.abs, h.current.rel, h.current.ride, h.current.cal, faultFixed, check];
  const goals = GOALS_DVS.map((label, i) => ({ label, hit: hits[i] }));
  const latched = useVisitGoals(ctx, goals, 'DVS', ready);
  const scope = s2?.scope ?? controlScope(booth, 0);
  const topH = (H: number, k: number) => Math.round(Math.min(170 * Math.sqrt(k), H * 0.54));
  const frame = { x: -10, y: -10, w: TT_W + 20, h: TT_D + 20 };
  const rt = roundTripMs(booth.laptop?.buffer ?? 256, booth.laptop?.rate ?? 48000);
  // the bottom of the glass: the turntable (left) beside the DVS cabling at
  // the rear (right), so every connection the lesson names is drawn
  const ttW = (W: number) => Math.round(W * 0.42);
  // the arm's angle now: the label obstacles ride the arm. The needle stays
  // in the control record's groove whether the platter turns or not (a DJ
  // deck has no auto-return; calibration needs it there, platter stopped)
  const spinning = tt.playing && !!tt.track;
  const armAng = armPoseAngle(true, 'rest', spinning ? tt.posSec + Math.max(0, motion.clock.value - tt.at) * (1 + tt.pitch / 100) : tt.posSec, tt.track ? trackSeconds(tt.track) : 1);
  return (
    <DjRack
      spec={{
        render: (w, hh) => (
          <Scene
            w={w}
            h={hh}
            frame={frame}
            motion={motion}
            // the panels' height at the overlay's text scale (it was taken at
            // 1: in FULL SCREEN the scope and map ran down over the turntable)
            fit={{ x: 0, y: topH(hh, kz), w: ttW(w), h: hh - topH(hh, kz) }}
            // FULL SCREEN's shape: scope and map over the turntable and the cabling
            aspect={1.12}
            obstacles={[{ x: 0, y: 0, w: TT_W, h: TT_D }, ...TT_PARTS.map((p) => turntablePartBox(p, armAng))]}
            screenOverlay={(W, H, xf, k) => {
              const kk = Math.sqrt(k);
              const th = topH(H, k) - 8;
              const sw = Math.round(Math.min(th, W * 0.4));
              return (
                <Group>
                  <DvsScope b={{ x: 6, y: 4, w: sw, h: th }} scope={scope} quality={q} lock={lock} mode={d.mode} k={kk} />
                  <DvsRoute b={{ x: sw + 12, y: 4, w: W - sw - 18, h: th }} ttPlaying={tt.playing} toneOnCh1={tone} thru={d.mode === 'THRU' && tt.playing} lock={lock} chInput={booth.ch[1].input} musicLive={musicLive} k={kk} flow={audio.flowMotion} />
                  <DvsRig b={{ x: ttW(W) + 4, y: topH(H, k) + 2, w: W - ttW(W) - 10, h: H - topH(H, k) - 6 }} gnd={(booth.vinyl ?? setVinyl()).gnd} ttPlaying={tt.playing} usbLive={musicLive || tt.playing} preamp={booth.ttPreamp} ang={armAng} scale={xf.s} k={kk} />
                </Group>
              );
            }}
            a11y={`You are looking at the control signal as the software sees it (quality ${Math.round(q * 100)} percent, ${lock.toLowerCase()}), a map of where each signal goes, the turntable with its control record, and the cabling at the rear: the turntable's leads and ground to the mixer's PHONO 1 and GND post, and the USB cable to the laptop. Mode ${DVS_MODE_WORDS[d.mode].toLowerCase()}; channel 1 input ${booth.ch[1].input}.${tone ? ' The control tone is reaching the speakers.' : ''}`}
          >
            <TurntableTop x={0} y={0} d={tt} playing={tt.playing} record="control" armOn />
          </Scene>
        ),
        bezel: [
          { k: 'ROUND TRIP', v: `${rt.toFixed(1)} ms`, vA11y: `${rt.toFixed(1)} milliseconds`, sub: `${booth.laptop?.buffer ?? 256} SMP`, tint: '#8fbcff' },
          { k: 'SIGNAL', v: `${Math.round(q * 100)} %`, sub: lock, tint: lock === 'LOCKED' ? colors.green : lock === 'UNSTABLE' ? colors.amber : lock === 'IGNORED' ? colors.textSub : '#ff5a48' },
          { k: 'DECK 1', v: A.playing ? 'PLAYING' : 'STOPPED', sub: `${A.pitch >= 0 ? '+' : '−'}${Math.abs(A.pitch).toFixed(0)} %`, tint: A.playing ? colors.green : colors.textSub },
          { k: 'CROWD', v: tone ? 'TONE!' : musicLive ? 'MUSIC' : 'NOTHING', tint: tone ? '#ff5a48' : musicLive ? colors.green : colors.textSub },
        ],
        params: [
          { kind: 'group', id: 'tt', label: 'PLATTER', valueLabel: tt.playing ? 'TURNING' : 'STOPPED', render: () => <TtTray onDrop={onDrop} requestSound={() => void audio.requestSound()} /> },
          {
            kind: 'options',
            id: 'mode',
            label: 'MODE',
            valueLabel: d.mode,
            valueA11y: DVS_MODE_WORDS[d.mode],
            options: DVS_MODES.map((m) => ({
              id: m,
              label: DVS_MODE_WORDS[m],
              blurb: m === 'ABS' ? 'The needle’s place is the track’s place: drops and skips move the music.' : m === 'REL' ? 'Speed and direction follow; the music keeps its own place.' : m === 'INT' ? 'The software plays on its own; the turntable is ignored.' : 'The turntable’s own sound passes straight through — for a NORMAL record only.',
            })),
            selectedId: d.mode,
            sticky: true,
            onSelect: (id) => setDvs(() => ({ mode: id as DvsMode })),
          },
          {
            kind: 'options',
            id: 'in1',
            label: 'CH1 IN',
            valueLabel: booth.ch[1].input,
            options: [
              { id: 'USB', label: 'USB (the software’s music)', blurb: 'Channel 1 hears software deck 1 on USB 1/2.' },
              { id: 'PHONO', label: 'PHONO (the record itself)', blurb: 'Channel 1 hears the turntable directly — with a control record, that is the control tone.' },
            ],
            selectedId: booth.ch[1].input,
            onSelect: (id) => dvsUpdate((x) => ({ ...x, ch: { ...x.ch, 1: { ...x.ch[1], input: id as 'USB' } } })),
          },
          { kind: 'group', id: 'sig', label: 'SIGNAL', valueLabel: d.calibrated ? 'CAL ✓' : 'CAL ?', valueA11y: d.calibrated ? 'calibrated' : 'not calibrated', render: () => <SignalTray onCal={(ok) => setCalMsg(ok ? 'Calibrated: the software measured the noise floor of this setup.' : 'Stop the platter first — calibration listens to the needle on a STILL record.')} /> },
          stopKey(tr),
        ],
        initialParam: 'tt',
      }}
    >
      <Step n={1}>
        <Look>You are looking at the control signal as the software sees it (a ring), a map of where each signal goes, the turntable with its white control record, and the cables at the rear.</Look>
        <P>A digital vinyl system plays a track from the laptop while you handle a real turntable: the record carries only a control tone, and the software follows its speed, direction and (in ABSOLUTE) its place.</P>
        <P>The control tone goes in through the mixer’s PHONO jacks and over USB; the music comes back over USB to channel 1.</P>
        <Terms items={TERMS} />
        <SkipOptional ctx={ctx} here={18} />
      </Step>
      <Step n={2}>
        <Do>Open PLATTER and start it. The ring appears, sharp and round, and software deck 1 plays. Try the platter’s pitch: the music follows. Stop the platter: the ring collapses to a dot, and the music stops.</Do>
        <P>Then NEEDLE DROP in ABSOLUTE: the music jumps with the needle. Switch MODE to RELATIVE and drop again: the music keeps its place — only the speed follows.</P>
      </Step>
      <Step n={3}>
        <P>Open SIGNAL. Loosen the ground wire: the ring wobbles with hum and the quality drops — the deck stutters now and then. Switch the turntable to LINE: the phono stage clips the tone and the ring squares off. Put both back.</P>
        <P>Make the record DUSTY: the needle skips, and in ABSOLUTE the music jumps with every skip. Switch to RELATIVE (the jumps stop) or INTERNAL (the software plays on its own) while you clean it.</P>
        <Note>DVS hardware, software and modes vary; this lab simulates one generic system — no real control record is read. Your own system’s manual has its calibration steps.</Note>
      </Step>
      <Step n={4}>
        <Do>Play deck 1 from the turntable; do a needle drop in ABSOLUTE and another in RELATIVE; then ride out a dusty record in INTERNAL.</Do>
        <P>Some DJs live in RELATIVE (skips cannot jump the music); others use ABSOLUTE for needle drops. Many switch to INTERNAL the moment a signal fails. Choose what suits your set.</P>
        <GoalChips goals={goals.slice(0, 4)} latched={latched.slice(0, 4)} />
      </Step>
      <Step n={5}>
        <Do>On your own: change something in SIGNAL, then CALIBRATE so the signal reads clean again.</Do>
        {calMsg ? <Note tone="try">{calMsg}</Note> : null}
        <UnderstandingCheck
          eyebrow="CHECK YOURSELF"
          question={`A scratch on a DVS feels a little "late" next to a normal record. Read ROUND TRIP on the strip (a buffer is the chunk of sound the computer works on at a time — Screen 16): why is it late?`}
          options={[`The control signal goes in through one buffer and the music comes back through another — ${rt.toFixed(1)} ms here`, 'The control record turns slower', 'The mixer adds an echo', 'USB carries audio at half speed']}
          correct={0}
          explain="A DVS is a round trip: the tone is read in one buffer at a time, the software plays, and its sound comes back out through another buffer — the ROUND TRIP reading. Smaller buffers shorten it (Screen 16); DVS players usually run the smallest buffer that stays free of dropouts."
          wrong={[undefined, 'The control record turns at the platter’s speed, like any record.', 'No effect is involved — the delay is the round trip through the buffers.', 'USB carries audio in real time; the delay is the buffering.']}
          onCorrect={() => setCheck(true)}
        />
        <FaultCard
          title="A HIGH WHISTLE ON THE DANCE FLOOR"
          symptom="The turntable is turning and the crowd hears a loud steady whistle instead of the music."
          start={() => {
            void audio.requestSound();
            dvsUpdate((x, t) => ({ ...x, tt: { ...x.tt, playing: true, at: t }, dvs: { ...(x.dvs ?? freshDvs()), mode: 'ABS', dirty: false, calibrated: true }, ch: { ...x.ch, 1: { ...x.ch[1], input: 'PHONO', fader: 0.85 } }, perspective: 'CROWD' }));
          }}
          fixed={tt.playing && !tone && booth.ch[1].input === 'USB' && d.mode !== 'THRU'}
          hints={['Read CROWD on the strip and CH1 IN in the dock, and look at the map: which signal reaches channel 1?', 'Channel 1 is listening to its PHONO jacks — the control record itself.', 'Set CH1 IN to USB (and keep the mode out of THRU).']}
          why="Channel 1 was listening to the turntable directly, so the control record's tone went to the PA. The software's music arrives on USB. The lab played the tone quietly; on a real system it is a loud, harsh whistle — get it off the speakers first (fader down), then fix the input."
          onFixed={() => setFaultFixed(true)}
        />
        <GoalChips goals={goals.slice(4)} latched={latched.slice(4)} />
      </Step>
    </DjRack>
  );
}

export const P18: PageDef = { title: 'Digital vinyl systems', short: 'DVS', Component: PageDvs, manualDone: true, rack: true };
