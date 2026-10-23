/**
 * Screen 16 — Laptop software and audio interfaces (research DJ09) — an
 * OPTIONAL equipment path: controller connections, device selection,
 * drivers, channel assignments, sample rate, buffer size, latency and
 * dropouts, all SIMULATED (model/djLaptop): no real USB or audio device is
 * touched. The laptop's two decks reach the mixer over its USB audio; the
 * buffer model puts real gaps (dropouts) into that audio. The fault: a deck
 * assigned to the wrong output pair.
 */
import { useEffect, useRef, useState } from 'react';
import { View } from 'react-native';
import { useSharedValue } from 'react-native-reanimated';
import { colors } from '../../../../theme/tokens';
import { LabChip } from '../../LabShell';
import type { PageCtx, PageDef } from '../../kit/PagedLab';
import { Scene } from '../art/Scene';
import { useStageTextScale } from '../../rack/stageAspect';
import { AudioSetupPanel, LaptopRig, RIG, RIG_BODIES, RIG_FRAME, RIG_POINTS } from '../art/laptopArt';
import { DjRack } from '../DjRack';
import { Do, FaultCard, GoalChips, Look, Note, P, Step, Terms, useVisitGoals } from '../bits';
import { boothKey, stopKey } from '../dock';
import { boothNow, getBooth, updateBooth } from '../booth/boothStore';
import { renderedSince } from './s1Guards';
import { cueAtBar, preMatched, useScreenSetup } from '../booth/setup';
import { TRIM_UNITY, trimPos, type Booth, type ChannelId, type DeckId } from '../model/djModel';
import { BUFFERS, RATES, WORKLOADS, bufferMs, devicesSeen, dropoutsPerMin, freshLaptop, loadOf, outputLatencyMs, stableBuffer, type LaptopState, type UsbPair, type Workload } from '../model/djLaptop';
import { STRIP_X } from '../geometry/boothGeometry';
import { useBoothKit } from './shared';
import { Choices, EvidenceCheck, TrayNote, s2Of, s2styles } from './s2kit';
import { SkipOptional } from './skipOptional';
import { freshCleanRun, stepCleanRun, type CleanRun } from './laptopCleanRun';

const TERMS = [
  { term: 'Audio interface', def: 'The part that turns the software’s numbers into analog sound (and back). Here it is built into the mixer; it can be a separate box, or part of a controller.' },
  { term: 'Buffer', def: 'How many samples (the numbers that make up digital sound, tens of thousands every second — the SAMPLE RATE) the software works out at a time. Smaller buffers answer faster but leave less time to finish each one.' },
  { term: 'Latency', def: 'The delay from a move (a jog, a button) to its sound: about one or two buffers plus the interface — your software’s audio page shows the real figure. Under about 10 ms feels instant to most DJs.' },
  { term: 'Dropout', def: 'A buffer the computer did not finish in time: a gap and a click in the sound. A bigger buffer, a lighter workload or fewer background tasks prevent it.' },
] as const;

export const GOALS_LAPTOP = ['Send the audio to the mixer', 'Stable buffer, two decks', 'Heavier load: stable again', 'Unplug the controller: music plays on', '96 kHz without dropouts', 'Fix the silent channel 2', 'Get a silent room back on'] as const;

const setLap = (f: (l: LaptopState) => Partial<LaptopState>) => updateBooth((b) => ({ ...b, laptop: { ...(b.laptop ?? freshLaptop()), ...f(b.laptop ?? freshLaptop()) } }));

/** Switching the output TO the mixer (or plugging its USB back in) while the
 *  decks play and a channel fader is up: for real, the music lands on the PA
 *  at full level the instant it connects (audio review 2 #19). */
export const fullLevelSwitch = (b: Booth): boolean => (b.decks.A.playing || b.decks.B.playing) && (b.ch[1].fader > 0.3 || b.ch[2].fader > 0.3);

function SetupTray() {
  const l = getBooth().laptop ?? freshLaptop();
  const seen = devicesSeen(l);
  const [hot, setHot] = useState(false);
  return (
    <View style={s2styles.tray}>
      <Choices
        head="OUTPUT DEVICE"
        value={l.device}
        items={(['MIXER USB', 'BUILT-IN'] as const).map((d) => ({ id: d, label: seen.includes(d) ? (d === 'BUILT-IN' ? 'BUILT-IN OUTPUT' : 'MIXER USB AUDIO') : `${d} (NOT FOUND)` }))}
        onPick={(d) => {
          if (!seen.includes(d as 'MIXER USB')) return;
          const b = getBooth();
          setHot(d === 'MIXER USB' && (b.laptop?.device ?? 'MIXER USB') !== 'MIXER USB' && fullLevelSwitch(b));
          setLap(() => ({ device: d as LaptopState['device'] }));
        }}
        note={!l.usbMixer ? 'The mixer is not in the list: its USB cable is out (RIG). A device the computer cannot see — no cable, or no driver on systems that need one — cannot be chosen.' : l.device === 'BUILT-IN' ? 'BUILT-IN: the laptop’s own speakers and headphone jack. Nothing reaches the mixer.' : 'The mixer’s own USB audio interface: deck 1 on the channel pair USB 1/2, deck 2 on the pair USB 3/4 — both pairs over the one USB cable.'}
      />
      {hot ? <TrayNote warn>FULL LEVEL — the music reached the mixer the instant the device connected, with the channel faders up. The lab keeps it at its own level; for real, pick the device with the faders down.</TrayNote> : null}
      <Choices head="BUFFER (samples)" value={l.buffer} items={BUFFERS.map((b) => ({ id: b, label: `${b} · ${bufferMs(b, l.rate).toFixed(1)} ms` }))} onPick={(b) => setLap(() => ({ buffer: b as number }))} />
      <Choices head="SAMPLE RATE" value={l.rate} items={RATES.map((r) => ({ id: r, label: `${(r / 1000).toFixed(1)} kHz` }))} onPick={(r) => setLap(() => ({ rate: r as number }))} note="The interface and the software must agree; a higher rate also means more samples to work out every millisecond." />
      <Choices head="WHAT THE SOFTWARE IS DOING (workload)" value={l.workload} items={WORKLOADS.map((w) => ({ id: w, label: w }))} onPick={(w) => setLap(() => ({ workload: w as Workload }))} />
      <TrayNote>{`This model: about ${dropoutsPerMin(l).toFixed(dropoutsPerMin(l) < 10 ? 1 : 0)} dropouts a minute at this setting (load ${Math.round(loadOf(l) * 100)} %). LOAD is the average; dropouts come from short spikes on top of it, so a low average can still drop out at a small buffer. A real laptop is measured with its own software.`}</TrayNote>
    </View>
  );
}

function OutputsTray() {
  const l = getBooth().laptop ?? freshLaptop();
  const pairs: UsbPair[] = ['USB 1/2', 'USB 3/4'];
  return (
    <View style={s2styles.tray}>
      {(['A', 'B'] as DeckId[]).map((d) => (
        <Choices key={d} head={`SOFTWARE DECK ${d === 'A' ? 1 : 2} → OUTPUT`} value={l.assign[d]} items={pairs.map((p) => ({ id: p, label: p }))} onPick={(p) => setLap((x) => ({ assign: { ...x.assign, [d]: p as UsbPair } }))} />
      ))}
      <TrayNote>On this lab’s mixer, channel 1 hears the USB pair 1/2 and channel 2 the pair USB 3/4 (each channel’s input selector on USB). A pair is two audio channels (L and R) inside the one USB connection, not a socket. Two decks on one pair arrive mixed together on one channel.</TrayNote>
    </View>
  );
}

function RigTray() {
  const b = getBooth();
  const l = b.laptop ?? freshLaptop();
  return (
    <View style={s2styles.tray}>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
        <LabChip label={l.usbMixer ? 'LAPTOP ↔ MIXER USB: IN' : 'LAPTOP ↔ MIXER USB: OUT'} selected={l.usbMixer} onPress={() => setLap((x) => ({ usbMixer: !x.usbMixer, device: x.usbMixer ? 'BUILT-IN' : x.device }))} />
        <LabChip label={l.usbCtrl ? 'CONTROLLER USB: IN' : 'CONTROLLER USB: OUT'} selected={l.usbCtrl} onPress={() => setLap((x) => ({ usbCtrl: !x.usbCtrl }))} />
      </View>
      <TrayNote>The mixer’s cable carries AUDIO both ways (and timing for it). The controller’s carries CONTROL messages and bus POWER: this controller carries no audio (many have their own interface).</TrayNote>
      {([1, 2] as ChannelId[]).map((c) => (
        <Choices key={c} head={`CH${c} INPUT SELECTOR`} value={b.ch[c].input} items={(['LINE', 'PHONO', 'USB'] as const).map((i) => ({ id: i, label: i }))} onPick={(i) => updateBooth((x) => ({ ...x, ch: { ...x.ch, [c]: { ...x.ch[c], input: i as 'LINE' } } }))} />
      ))}
    </View>
  );
}

function PageLaptop({ ctx }: { ctx: PageCtx }) {
  const { booth, audio, tr, motion } = useBoothKit({ lockPhase: true });
  // FULL SCREEN: the text scale the Scene hands its screenOverlay — the top
  // panel's height is taken at it, so the gear's room must start there too
  const kz = useStageTextScale();
  const { ready } = useScreenSetup((b) => {
    let x = cueAtBar(b, 'A', 'nightFerry', 17);
    x = preMatched(cueAtBar(x, 'B', 'glassHarbour', 17));
    return {
      ...x,
      laptop: { ...freshLaptop(), device: 'BUILT-IN', buffer: 128 },
      ch: { 1: { ...x.ch[1], input: 'USB', trim: TRIM_UNITY, fader: 0.85, xf: 'THRU', cue: false }, 2: { ...x.ch[2], input: 'USB', trim: trimPos(-11), fader: 0.85, xf: 'THRU', cue: false } },
      perspective: 'CROWD',
    };
  });
  const [check, setCheck] = useState(false);
  const [faultFixed, setFaultFixed] = useState(false);
  const l = booth.laptop ?? freshLaptop();
  const last = audio.last;
  const s2 = s2Of(last);
  const A = booth.decks.A;
  const B = booth.decks.B;
  const both = A.playing && B.playing;
  // the dropouts the render put in the sound: the lamp flashes at each, the count runs
  const dropTimes = useSharedValue<number[]>([]);
  const settingKey = `${l.buffer}:${l.rate}:${l.workload}:${l.device}:${l.usbMixer}`;
  // the run is measured in booth time (laptopCleanRun): a re-render replaces the
  // rest of the chunk before it, so mashing a chip never adds seconds
  const run = useRef<CleanRun>(freshCleanRun());
  const seen = useRef<unknown>(null);
  const [, bump] = useState(0);
  useEffect(() => {
    if (!last || seen.current === last) return;
    seen.current = last;
    const drops = last.s2?.dropouts ?? [];
    dropTimes.value = drops;
    const feeding = (A.playing || B.playing) && l.device === 'MIXER USB' && l.usbMixer;
    run.current = stepCleanRun(run.current, { t0: last.t0, seconds: last.seconds, drops }, settingKey, feeding);
    bump((n) => n + 1);
  }, [last, settingKey, dropTimes, A.playing, B.playing, l.device, l.usbMixer]);
  const h = useRef({ device: false, two: false, heavy: false, ctrl: false, hi: false, check: false });
  // booth time SET IT UP was pressed: the check reads only renders made after
  // it (a chunk from before showed the music reaching channel 1)
  const checkAt = useRef<number | null>(null);
  const clean20 = run.current.clean >= 20;
  if (ready && (A.playing || B.playing) && l.device === 'MIXER USB' && last && last.rmsDb.ch1 > -50) h.current.device = true;
  if (ready && clean20 && both && l.workload === 'TWO DECKS' && l.buffer === stableBuffer('TWO DECKS', l.rate) && l.rate === 48000) h.current.two = true;
  if (ready && clean20 && both && l.workload === 'STEMS LIVE' && l.buffer === stableBuffer('STEMS LIVE', l.rate)) h.current.heavy = true;
  if (ready && !l.usbCtrl && (A.playing || B.playing) && l.device === 'MIXER USB' && last && last.rmsDb.ch1 > -50) h.current.ctrl = true;
  if (ready && clean20 && (A.playing || B.playing) && l.rate === 96000 && l.buffer === stableBuffer(l.workload, 96000)) h.current.hi = true;
  // CHECK YOURSELF, from evidence: from a silent room with the mixer's USB
  // out, the music reaches channel 1 over the mixer's interface
  if (ready && check && l.usbMixer && l.device === 'MIXER USB' && (A.playing || B.playing) && booth.ch[1].fader > 0.3 && last && renderedSince(last, checkAt.current) && last.rmsDb.ch1 > -50) h.current.check = true;
  // clean, but not the smallest buffer that manages (learning review 2, p16 #2)
  const biggerThanNeeded = clean20 && (A.playing || B.playing) && l.device === 'MIXER USB' && l.buffer > stableBuffer(l.workload, l.rate);
  const hits = [h.current.device, h.current.two, h.current.heavy, h.current.ctrl, h.current.hi, faultFixed, h.current.check];
  const goals = GOALS_LAPTOP.map((label, i) => ({ label, hit: hits[i] }));
  const latched = useVisitGoals(ctx, goals, 'LAPTOP', ready);
  const audioLive = (A.playing || B.playing) && l.device === 'MIXER USB' && l.usbMixer;
  const panelH = (H: number, k: number) => Math.round(Math.min(112 * Math.sqrt(k), H * 0.4));
  const mix = (x: number, y: number) => ({ x: RIG.mixer.x + x, y: RIG.mixer.y + y });
  const ch2Silent = !!last && both && last.rmsDb.ch2 < -80;
  const RP = RIG_POINTS;
  return (
    <DjRack
      spec={{
        render: (w, hh) => (
          <Scene
            w={w}
            h={hh}
            frame={RIG_FRAME}
            motion={motion}
            // the panel's height at the overlay's text scale (it was taken at
            // 1: in FULL SCREEN the panel ran down over the rig and its labels)
            fit={{ x: 0, y: panelH(hh, kz), w, h: hh - panelH(hh, kz) }}
            // FULL SCREEN's shape: the setup window over the one-scale rig
            aspect={1.35}
            // the gear and its plugs are HARD obstacles: no label lies on them
            obstacles={RIG_BODIES}
            callouts={[
              // the cable flags sit ON their cable lanes, behind the gear
              { id: 'mu', text: l.usbMixer ? 'USB · AUDIO BOTH WAYS' : 'MIXER USB OUT', at: { x: RP.mixLane.x, y: RP.mixLane.y }, dx: -12, dy: -10, tone: l.usbMixer ? ('blue' as const) : ('red' as const) },
              { id: 'cu', text: l.usbCtrl ? 'USB · CONTROL + POWER, NO AUDIO' : 'CONTROLLER UNPLUGGED', at: { x: (RP.ctlLane.x + RP.ctlUsb.x) / 2, y: RP.ctlLane.y }, dx: 0, dy: -16, tone: l.usbCtrl ? ('amber' as const) : ('red' as const) },
              { id: 'c1', text: `CH1 ${booth.ch[1].input}`, at: mix(STRIP_X[1], 24), dx: -6, dy: -36, tone: booth.ch[1].input === 'USB' ? ('green' as const) : ('plain' as const) },
              { id: 'c2', text: `CH2 ${booth.ch[2].input}`, at: mix(STRIP_X[2] + 16, 24), dx: 14, dy: -10, tone: booth.ch[2].input === 'USB' ? ('green' as const) : ('plain' as const) },
            ]}
            screenOverlay={(W, H, _xf, k) => <AudioSetupPanel b={{ x: 6, y: 4, w: W - 12, h: panelH(H, k) - 8 }} l={l} dropTimes={dropTimes} count={run.current.count} k={Math.sqrt(k)} />}
            a11y={`You are looking at the DJ software’s audio setup window above the rig, drawn to one scale: a controller on the left, the laptop, and the mixer on the right, with a USB cable from the laptop to each. Output device ${l.device}, buffer ${l.buffer} samples, ${outputLatencyMs(l.buffer, l.rate).toFixed(1)} milliseconds of latency, load ${Math.round(loadOf(l) * 100)} percent; deck 1 to ${l.assign.A}, deck 2 to ${l.assign.B}.`}
          >
            <LaptopRig booth={booth} audioLive={audioLive} flow={audio.flowMotion} />
          </Scene>
        ),
        bezel: [
          { k: 'DEVICE', v: l.device === 'MIXER USB' ? 'MIXER' : 'BUILT-IN', tint: l.device === 'MIXER USB' ? colors.green : '#ff8a7e' },
          { k: 'LATENCY', v: `${outputLatencyMs(l.buffer, l.rate).toFixed(1)} ms`, sub: `${l.buffer} smp`, tint: '#8fbcff' },
          { k: 'DROPOUTS', v: String(run.current.count), sub: `${Math.min(20, Math.round(run.current.clean))} s CLEAN`, tint: run.current.count ? '#ff8a7e' : colors.green },
          { k: 'CH2 GETS', v: l.device !== 'MIXER USB' ? 'NOTHING' : (['A', 'B'] as DeckId[]).filter((d) => l.assign[d] === 'USB 3/4').map((d) => (d === 'A' ? 'DECK 1' : 'DECK 2')).join('+') || 'NOTHING', tint: ch2Silent ? '#ff8a7e' : colors.textPrimary },
        ],
        params: [
          { kind: 'group', id: 'setup', label: 'SETUP', valueLabel: `${l.buffer}`, valueA11y: `buffer ${l.buffer} samples, ${l.device}`, render: () => <SetupTray /> },
          // short WORDS that fit the key at 390 (visual review 2 #23)
          { kind: 'group', id: 'outs', label: 'OUTPUT', valueLabel: l.assign.A === 'USB 1/2' && l.assign.B === 'USB 3/4' ? 'RIGHT' : 'CHECK', valueA11y: `deck 1 to ${l.assign.A}, deck 2 to ${l.assign.B}`, render: () => <OutputsTray /> },
          { kind: 'group', id: 'rig', label: 'RIG', valueLabel: l.usbMixer && l.usbCtrl ? 'BOTH' : l.usbMixer ? 'NO CTL' : l.usbCtrl ? 'NO MIX' : 'NONE', valueA11y: `mixer cable ${l.usbMixer ? 'in' : 'out'}, controller cable ${l.usbCtrl ? 'in' : 'out'}`, render: () => <RigTray /> },
          boothKey(booth, tr),
          stopKey(tr),
        ],
        initialParam: 'setup',
      }}
    >
      <Step n={1}>
        <Look>You are looking at the DJ software’s AUDIO SETUP window above the rig, drawn to one scale: a controller on the left, the laptop, and the mixer on the right, with a USB cable from the laptop to each.</Look>
        <P>The music is made inside the laptop; an AUDIO INTERFACE (here, built into the mixer) turns it into sound on channels the mixer can hear. The controller only sends control messages.</P>
        <P>The software works a BUFFER at a time: smaller buffers feel quicker, bigger ones are safer.</P>
        <Terms items={TERMS} />
        <SkipOptional ctx={ctx} here={16} />
      </Step>
      <Step n={2}>
        <Do>Open DECKS and play both. Nothing reaches the crowd: open SETUP and change the OUTPUT DEVICE from BUILT-IN to MIXER USB AUDIO.</Do>
        <Note tone="safety">For real, pick the output device (and plug the USB back in) with the channel faders down — the music arrives at full level the moment it connects.</Note>
        <P>Now listen: at a buffer of 128 the sound clicks and stutters, and the DROPOUT lamp flashes — the laptop cannot finish every buffer in time. Each one is a real gap in the audio.</P>
        <Note>This lab simulates the laptop, its USB and the interface — it does not touch a real device. The software you use has its own audio setup page; its numbers are the ones that count.</Note>
      </Step>
      <Step n={3}>
        <P>Try bigger buffers: the dropouts stop, and LATENCY grows — at 2048 a jog move is heard over 40 ms late. Then pick STEMS LIVE as the workload: the load jumps and the dropouts come back.</P>
        <P>Open RIG and unplug the CONTROLLER: the music plays on — that cable never carried audio. Plug it back in. Unplug the MIXER’s USB: the device vanishes from the list and both channels go silent.</P>
      </Step>
      <Step n={4}>
        <Do>Find the SMALLEST buffer that runs 20 s with no dropouts, with both decks playing and the workload on TWO DECKS; then do it again with STEMS LIVE. Unplug the controller and keep the music going.</Do>
        {biggerThanNeeded ? <Note tone="try">Clean — but a smaller buffer may manage too, with less latency. Try one step down.</Note> : null}
        <P>Smaller buffers suit scratching and quick cueing; bigger ones suit a heavy set. Find the balance for your own laptop — these are this model’s numbers.</P>
        <GoalChips goals={goals.slice(0, 4)} latched={latched.slice(0, 4)} />
        <Note>Before a gig: charger in, sleep and USB power saving off, the interface in a port on the laptop itself (not a hub), notifications and wireless tasks off. A hum or whine that comes and goes with the charger is a ground loop — Screen 23.</Note>
      </Step>
      <Step n={5}>
        <Do>On your own: switch the rate to 96 kHz and keep it running 20 s with no dropouts, with the smallest buffer that manages it. Most DJ setups run at 44.1 or 48 kHz; 96 kHz doubles the work for nothing the floor can hear — try it to see the cost.</Do>
        <EvidenceCheck
          task="Both software decks are playing, but the room is silent — and the mixer is not in the list of audio devices. Get the music to the crowd (faders down while you connect, then up)."
          onSetup={() => {
            void audio.requestSound();
            h.current.check = false;
            checkAt.current = boothNow();
            setCheck(true);
            updateBooth((b, t) => ({
              ...b,
              decks: { A: { ...b.decks.A, playing: true, at: t }, B: { ...b.decks.B, playing: true, at: t } },
              laptop: { ...(b.laptop ?? freshLaptop()), usbMixer: false, device: 'BUILT-IN', buffer: 512, workload: 'TWO DECKS', rate: 48000, assign: { A: 'USB 1/2', B: 'USB 3/4' } },
              ch: { 1: { ...b.ch[1], input: 'USB', fader: 0 }, 2: { ...b.ch[2], input: 'USB', fader: 0 } },
              perspective: 'CROWD',
            }));
          }}
          armed={check}
          done={latched[6]}
          hint="A device the computer cannot see cannot be chosen: look at the rig first (RIG), then at the device list (SETUP)."
          explain="The mixer’s USB cable was out, so the computer could not see it and it could not be chosen. Cable in (RIG), then MIXER USB AUDIO as the output device (SETUP), then the faders up. On some systems a device also needs its driver before it appears; buffer and rate only matter once it is there."
        />
        <FaultCard
          title="CHANNEL 2 IS SILENT"
          symptom="Both software decks are playing, but channel 2’s meter is dead — and channel 1 seems to have both decks in it at once."
          start={() => {
            void audio.requestSound();
            updateBooth((b, t) => ({
              ...b,
              decks: { A: { ...b.decks.A, playing: true, at: t }, B: { ...b.decks.B, playing: true, at: t } },
              laptop: { ...(b.laptop ?? freshLaptop()), device: 'MIXER USB', usbMixer: true, buffer: 512, assign: { A: 'USB 1/2', B: 'USB 1/2' } },
              ch: { 1: { ...b.ch[1], input: 'USB', fader: 0.85 }, 2: { ...b.ch[2], input: 'USB', fader: 0.85 } },
              perspective: 'CROWD',
            }));
          }}
          fixed={both && l.device === 'MIXER USB' && l.assign.A === 'USB 1/2' && l.assign.B === 'USB 3/4' && booth.ch[2].input === 'USB'}
          hints={['Read CH2 GETS on the readout strip, and DECK 2 TO in the setup window.', 'Software deck 2 is sending its audio to USB 1/2 — channel 1’s pair.', 'Open OUTPUT and set deck 2 to USB 3/4.']}
          why="Both software decks were assigned to the same output pair, so they arrived mixed together on channel 1 and channel 2 got nothing — its fader and EQ could not touch deck 2. Each deck needs its own pair, matching the channel that listens to it."
          onFixed={() => setFaultFixed(true)}
        />
        <GoalChips goals={goals.slice(4)} latched={latched.slice(4)} />
      </Step>
    </DjRack>
  );
}

export const P16: PageDef = { title: 'Laptop software and audio interfaces', short: 'LAPTOP', Component: PageLaptop, manualDone: true, rack: true };
