/**
 * Screen 13 — Effects and their routing (research DJ19): delay and echo
 * timed in beats, feedback, a reverb tail, a filter sweep and a flanger,
 * dry/wet, and WHERE an effect sits — a channel insert, the master, or a
 * send / return. The DSP is real (engine/djFx through engine/djStage2); the
 * scope is the render's own level into and out of the effect. Two faults:
 * the effect on the wrong source, and a return that makes a loop (built up,
 * then held safe — never played loud). Deck B is tempo-matched and in phase.
 */
import { useContext, useMemo, useRef, useState } from 'react';
import { View } from 'react-native';
import { Group } from '@shopify/react-native-skia';
import { colors } from '../../../../theme/tokens';
import { LabChip } from '../../LabShell';
import { UnderstandingCheck } from '../../tuning/components/check';
import { StageInFullScreen, useStageTextScale } from '../../rack/stageAspect';
import type { PageCtx, PageDef } from '../../kit/PagedLab';
import { Scene, type Callout } from '../art/Scene';
import { FX_PANEL, FxPanel, FxRouteMap, FxScope, ROUTE_MAP, fxPartBox, FX_PARTS, type FxPart, type FxSeg } from '../art/fxArt';
import { DjRack } from '../DjRack';
import { Do, FaultCard, GoalChips, Look, Note, P, Step, Terms, useVisitGoals } from '../bits';
import { ChipRow, boothKey, channelFaderKey, pct, stopKey } from '../dock';
import { getBooth, updateBooth } from '../booth/boothStore';
import { cueAtBar, preMatched, useScreenSetup } from '../booth/setup';
import { TRIM_UNITY, trimPos, type Booth } from '../model/djModel';
import { FX_TIMES, FX_TYPES, dryWet, freshFx, fxBpm, fxTempoDeck, fxTimeSec, fxTimeWord, usesFeedback, type FxRoute, type FxState, type FxType } from '../model/djEffects';
import { alignPhase } from '../model/djDeck';
import { peakShort, useBoothKit } from './shared';
import { Choices, TrayNote, deckBeatTimes, s2Of, s2styles, useChunkSegs } from './s2kit';
import type { Box } from '../geometry/boothGeometry';

const TERMS = [
  { term: 'Insert', def: 'The effect sits IN one channel’s path: all of that channel goes through it. On this mixer it is after the fader, so pulling the fader lets an echo ring on.' },
  { term: 'Send / return', def: 'Each channel’s SEND knob feeds the effect a COPY; the RETURN adds only the effect back. The dry sound never changes — one reverb can serve both decks.' },
  { term: 'Dry / wet', def: 'Dry is the sound without the effect, wet is the effect alone. This mixer’s LEVEL knob keeps the dry full up to its centre, then fades it as the wet takes over.' },
  { term: 'Feedback', def: 'How much of an echo’s output goes back in. None: one repeat (a plain delay). More: repeats that keep going and fade more slowly.' },
] as const;

export const GOALS_FX = ['Echo on every beat', 'Echo out deck A', 'One reverb on both decks', 'Sweep the whole mix', 'Effect on deck B only', 'Fix the missing echo', 'Stop the return loop', 'Pass the check'] as const;

const TYPE_BLURB: Record<FxType, string> = {
  ECHO: 'Repeats of the sound, spaced in beats. FEEDBACK sets how many.',
  REVERB: 'A room’s tail. TIME sets how long it takes to die away.',
  FILTER: 'A resonant low-pass sweeping up and down, one sweep per TIME.',
  FLANGER: 'A tiny moving delay: a jet-like comb sweep, one per TIME.',
};
const ROUTE_BLURB: Record<FxRoute, string> = {
  CH1: 'INSERT on channel 1 (deck A): after its fader, before the crossfader.',
  CH2: 'INSERT on channel 2 (deck B).',
  MASTER: 'On the MIX BUS: everything the crowd hears goes through it.',
  SEND: 'SEND / RETURN: each channel sends a copy; the RETURN adds the wet only.',
};

type Knob = 'time' | 'feedback' | 'level';

/** The stage: the FX scope over the routing map; FULL SCREEN adds the panel. */
function FxStage({ w, h, booth, motion, segs, focus, flow, loop }: { w: number; h: number; booth: Booth; motion: ReturnType<typeof useBoothKit>['motion']; segs: FxSeg[]; focus: Knob; flow: boolean; loop: boolean }) {
  const full = useContext(StageInFullScreen);
  const kz = useStageTextScale();
  const fx = booth.fx ?? freshFx();
  const bpm = fxBpm(booth, fx);
  const A = booth.decks.A;
  const B = booth.decks.B;
  const live = {
    a: A.playing && booth.ch[1].fader > 0.02,
    b: B.playing && booth.ch[2].fader > 0.02,
    bus: (A.playing && booth.ch[1].fader > 0.02) || (B.playing && booth.ch[2].fader > 0.02),
    fx: fx.on,
  };
  const scopeH = (H: number, k: number) => Math.round(Math.min(104 * Math.sqrt(k), H * (full ? 0.26 : 0.32)));
  const frame: Box = full ? { x: -6, y: -6, w: ROUTE_MAP.w + 12, h: ROUTE_MAP.h + 18 + FX_PANEL.h } : { x: -6, y: -6, w: ROUTE_MAP.w + 12, h: ROUTE_MAP.h + 10 };
  const td = booth.decks[fxTempoDeck(fx)];
  const t1 = segs.length ? segs[segs.length - 1].t0 + 9 : 0;
  const beats = useMemo(() => deckBeatTimes(td, t1 - 20, t1), [td, t1]);
  const panelHi: FxPart[] = [focus === 'time' ? 'time' : focus === 'feedback' ? 'feedback' : 'level'];
  const callouts: Callout[] = [];
  return (
    <Scene
      w={w}
      h={h}
      frame={frame}
      motion={motion}
      fit={{ x: 0, y: scopeH(h, kz), w, h: h - scopeH(h, kz) }}
      aspect={false}
      callouts={callouts}
      obstacles={full ? FX_PARTS.map((p) => ({ ...fxPartBox(p), y: fxPartBox(p).y + ROUTE_MAP.h + 12 })) : []}
      screenOverlay={(W, H, _xf, k) => (
        <FxScope b={{ x: 6, y: 4, w: W - 12, h: scopeH(H, k) - 8 }} segs={segs} beatTimes={beats} delaySec={fx.type === 'ECHO' ? fxTimeSec(fx, bpm) : null} k={Math.sqrt(k)} title={`FX SCOPE · ${fx.type}${fx.on ? '' : ' (OFF)'}`} />
      )}
      a11y={`You are looking at the effect’s scope (the level going into the effect and coming out of it, over the last three seconds) above a map of where the effect sits: ${fx.type} ${fx.on ? 'on' : 'off'}, routed to ${fx.route === 'SEND' ? `the send, returning to ${fx.returnTo === 'BUS' ? 'the mix bus' : 'channel 2'}` : fx.route === 'MASTER' ? 'the master' : `channel ${fx.route === 'CH1' ? 1 : 2}`}.${loop ? ' The return is making a loop.' : ''}`}
    >
      <FxRouteMap x={0} y={0} fx={fx} live={live} loop={loop} flow={flow} />
      {full ? (
        <Group>
          <FxPanel x={0} y={ROUTE_MAP.h + 12} fx={fx} bpm={bpm} highlight={panelHi} />
        </Group>
      ) : null}
    </Scene>
  );
}

function setFx(f: (fx: FxState) => FxState) {
  updateBooth((b) => ({ ...b, fx: f(b.fx ?? freshFx()) }));
}

function FxTray() {
  const b = getBooth();
  const fx = b.fx ?? freshFx();
  return (
    <View style={s2styles.tray}>
      <View style={{ flexDirection: 'row', gap: 6 }}>
        <LabChip label={fx.on ? '● FX ON' : '○ FX OFF'} selected={fx.on} onPress={() => setFx((x) => ({ ...x, on: !x.on }))} />
      </View>
      <Choices head="TYPE" value={fx.type} items={FX_TYPES.map((t) => ({ id: t, label: t }))} onPick={(t) => setFx((x) => ({ ...x, type: t as FxType, time: Math.min(x.time, FX_TIMES[t as FxType].length - 1) }))} note={TYPE_BLURB[fx.type]} />
      <Choices head="WHERE IT SITS (CH SELECT)" value={fx.route} items={(['CH1', 'CH2', 'MASTER', 'SEND'] as FxRoute[]).map((r) => ({ id: r, label: r }))} onPick={(r) => setFx((x) => ({ ...x, route: r as FxRoute }))} note={ROUTE_BLURB[fx.route]} />
      {fx.route === 'SEND' ? (
        <View style={s2styles.tray}>
          <Choices head="SEND 1 (deck A)" value={fx.send[1]} items={[{ id: 0, label: 'OFF' }, { id: 0.5, label: '50%' }, { id: 1, label: 'FULL' }]} onPick={(v) => setFx((x) => ({ ...x, send: { ...x.send, 1: v as number } }))} />
          <Choices head="SEND 2 (deck B)" value={fx.send[2]} items={[{ id: 0, label: 'OFF' }, { id: 0.5, label: '50%' }, { id: 1, label: 'FULL' }]} onPick={(v) => setFx((x) => ({ ...x, send: { ...x.send, 2: v as number } }))} />
          <Choices
            head="RETURN TO"
            value={fx.returnTo}
            items={[{ id: 'BUS', label: 'MIX BUS' }, { id: 'CH2', label: 'CHANNEL 2' }]}
            onPick={(v) => setFx((x) => ({ ...x, returnTo: v as 'BUS' | 'CH2' }))}
            note={fx.returnTo === 'CH2' ? 'The return comes in on channel 2 — fine only while channel 2’s own SEND is off.' : 'The return joins the mix bus beside the dry channels.'}
          />
        </View>
      ) : null}
      <TrayNote>The LEVEL, TIME and FEEDBACK knobs are on the FX KNOB key.</TrayNote>
    </View>
  );
}

function PageEffects({ ctx }: { ctx: PageCtx }) {
  const { booth, audio, tr, motion } = useBoothKit({ lockPhase: true });
  useScreenSetup((b) => {
    let x = cueAtBar(b, 'A', 'nightFerry', 17);
    x = preMatched(cueAtBar(x, 'B', 'glassHarbour', 17));
    const flat = { hi: 0.5, mid: 0.5, lo: 0.5 };
    return {
      ...x,
      ch: { 1: { ...x.ch[1], trim: TRIM_UNITY, fader: 0.85, xf: 'THRU', eq: flat, filter: 0, cue: false }, 2: { ...x.ch[2], trim: trimPos(-11), fader: 0, xf: 'THRU', eq: flat, filter: 0, cue: true } },
      mixer: { ...x.mixer, master: 0.6 },
      fx: freshFx(),
      perspective: 'CROWD',
    };
  });
  const [focus, setFocus] = useState<Knob>('time');
  const [check, setCheck] = useState(false);
  const [fault1, setFault1] = useState(false);
  const [fault2, setFault2] = useState(false);
  const hit = useRef({ beat: false, out: false, armed: false, both: false, master: false, bOnly: false });
  const fx = booth.fx ?? freshFx();
  const last = audio.last;
  const s2 = s2Of(last);
  const segs = useChunkSegs<FxSeg>(last, (r) => (r.s2?.fxIn && r.s2.fxOut ? { t0: r.t0, inDb: r.s2.fxIn, outDb: r.s2.fxOut } : null));
  const outMax = s2?.fxOut ? Math.max(...Array.from(s2.fxOut)) : -120;
  const A = booth.decks.A;
  const B = booth.decks.B;
  const f1 = booth.ch[1].fader;
  const f2 = booth.ch[2].fader;
  const loop = (s2?.loopGain ?? 0) > 0;
  // the practice, from the booth's own state and the render's readings
  if (fx.on && fx.type === 'ECHO' && FX_TIMES.ECHO[fx.time] === 1 && fx.feedback >= 0.3 && ((fx.route === 'CH1' && A.playing && f1 > 0.3) || fx.route === 'MASTER') && outMax > -40) hit.current.beat = true;
  if (fx.on && fx.type === 'ECHO' && fx.route === 'CH1' && A.playing && f1 >= 0.5) hit.current.armed = true;
  if (hit.current.armed && fx.type === 'ECHO' && fx.route === 'CH1' && A.playing && f1 <= 0.02 && outMax > -45) hit.current.out = true;
  if (fx.on && fx.type === 'REVERB' && fx.route === 'SEND' && fx.returnTo === 'BUS' && fx.send[1] > 0 && fx.send[2] > 0 && fx.wet > 0.2 && A.playing && B.playing && f1 >= 0.4 && f2 >= 0.4) hit.current.both = true;
  if (fx.on && (fx.type === 'FILTER' || fx.type === 'FLANGER') && fx.route === 'MASTER' && (A.playing || B.playing) && outMax > -40) hit.current.master = true;
  if (fx.on && fx.route === 'CH2' && A.playing && B.playing && f1 >= 0.5 && f2 >= 0.5) hit.current.bOnly = true;
  const hits = [hit.current.beat, hit.current.out, hit.current.both, hit.current.master, hit.current.bOnly, fault1, fault2, check];
  const goals = GOALS_FX.map((label, i) => ({ label, hit: hits[i] }));
  const latched = useVisitGoals(ctx, goals, 'EFFECTS');
  const bpm = fxBpm(booth, fx);
  const timeVal = fx.time / (FX_TIMES[fx.type].length - 1);
  const busPk = last ? Math.max(...Array.from(last.raw.bus)) : null;
  const fbLocked = !usesFeedback(fx.type) ? `FEEDBACK does nothing on ${fx.type} — it shapes ECHO repeats and the FLANGER’s sharpness. ${fx.type === 'REVERB' ? 'A reverb’s tail is set by TIME.' : 'The sweep is set by TIME.'}` : undefined;
  const knobKey = {
    kind: 'fader' as const,
    id: 'fxknob',
    label: 'FX KNOB',
    value: focus === 'time' ? timeVal : focus === 'feedback' ? fx.feedback : fx.wet,
    home: focus === 'level' ? 0.5 : undefined,
    locked: focus === 'feedback' ? fbLocked : undefined,
    onChange: (v: number) => {
      if (focus === 'time') {
        const i = Math.round(v * (FX_TIMES[fx.type].length - 1));
        if (i !== getBooth().fx?.time) setFx((x) => ({ ...x, time: i }));
      } else if (focus === 'feedback') setFx((x) => ({ ...x, feedback: v }));
      else setFx((x) => ({ ...x, wet: v }));
    },
    format: (v: number) => {
      if (focus === 'time') return `TIME ${fxTimeWord(fx.type, Math.round(v * (FX_TIMES[fx.type].length - 1)))}${fx.type === 'REVERB' ? '' : ` · ${Math.round(fxTimeSec({ ...fx, time: Math.round(v * (FX_TIMES[fx.type].length - 1)) }, bpm) * 1000)} ms`}`;
      if (focus === 'feedback') return `FEEDBACK ${pct(v)}`;
      const dw = dryWet(v);
      return fx.route === 'SEND' ? `RETURN ${pct(v)}` : `LEVEL ${pct(v)} · dry ${pct(dw.dry)} wet ${pct(dw.wet)}`;
    },
    formatShort: (v: number) => (focus === 'time' ? fxTimeWord(fx.type, Math.round(v * (FX_TIMES[fx.type].length - 1))).replace(' BEATS', 'B').replace(' BEAT', 'B') : pct(v)),
    chooser: {
      title: 'FX KNOB — WHICH ONE',
      options: [
        { id: 'time', label: 'TIME (BEAT)', blurb: fx.type === 'REVERB' ? 'How long the reverb’s tail lasts.' : 'In beats, at the deck’s tempo: the echo’s spacing, or one sweep.' },
        { id: 'feedback', label: 'FEEDBACK', blurb: 'ECHO: how many repeats. FLANGER: how sharp. Nothing on REVERB or FILTER.' },
        { id: 'level', label: fx.route === 'SEND' ? 'RETURN' : 'LEVEL (DRY/WET)', blurb: fx.route === 'SEND' ? 'How much of the effect comes back into the mix; the dry never changes.' : 'Dry full up to the centre, then the wet takes over.' },
      ],
      selectedId: focus,
      onSelect: (id: string) => setFocus(id as Knob),
    },
  };
  const ch2Row = () => (
    <ChipRow
      head={`CH2 FADER (deck B) → ${pct(getBooth().ch[2].fader)}`}
      chips={[0, 0.5, 0.85].map((v) => ({ label: v === 0 ? 'DOWN' : v === 0.5 ? 'HALF' : 'UP', on: Math.abs(getBooth().ch[2].fader - v) < 0.02, onPress: () => updateBooth((x) => ({ ...x, ch: { ...x.ch, 2: { ...x.ch[2], fader: v } } })) }))}
    />
  );
  const routeWord = fx.route === 'SEND' ? (fx.returnTo === 'CH2' ? 'SEND→CH2' : 'SEND') : fx.route;
  return (
    <DjRack
      spec={{
        render: (w, h) => <FxStage w={w} h={h} booth={booth} motion={motion} segs={segs} focus={focus} flow={audio.flowMotion} loop={loop} />,
        bezel: [
          { k: 'EFFECT', v: `${fx.type} ${fx.on ? 'ON' : 'OFF'}`, tint: fx.on ? colors.amber : colors.textSub, flex: 1.3 },
          { k: 'SITS ON', v: routeWord, tint: loop ? '#ff8a7e' : colors.textPrimary },
          { k: 'TIME', v: fx.type === 'REVERB' ? fxTimeWord(fx.type, fx.time) : `${Math.round(fxTimeSec(fx, bpm) * 1000)} ms`, sub: fx.type === 'REVERB' ? 'DECAY' : fxTimeWord(fx.type, fx.time), tint: colors.textPrimary },
          peakShort('MIX BUS PEAK', busPk == null ? null : busPk <= -59.9 ? -Infinity : busPk),
        ],
        params: [
          { kind: 'group', id: 'fx', label: 'FX', valueLabel: `${fx.type.slice(0, 4)} ${fx.on ? 'ON' : 'OFF'}`, valueA11y: `${fx.type} ${fx.on ? 'on' : 'off'}, ${fx.route}`, render: () => <FxTray /> },
          knobKey,
          channelFaderKey(booth, 1),
          boothKey(booth, tr, ['A', 'B'], ch2Row),
          stopKey(tr),
        ],
        initialParam: 'fxknob',
      }}
    >
      <Step n={1}>
        <Look>You are looking at the FX SCOPE — the level going INTO the effect (white) and coming OUT of it (blue) over the last three seconds — above a map of where the effect sits in the mixer’s signal path. FULL SCREEN adds the mixer’s effects panel.</Look>
        <P>An effect’s sound depends on WHERE it sits: on one channel (an insert), on everything the crowd hears (MASTER), or on a send whose return you add back.</P>
        <P>Its TIME follows the tempo, so a ½-beat echo lands on the off-beats; LEVEL sets the effect against the dry sound.</P>
        <Terms items={TERMS} />
      </Step>
      <Step n={2}>
        <Do>Open DECKS and play deck A. Open FX and press FX ON: an ECHO on channel 1. Watch the scope — each repeat is a step of blue, one delay apart.</Do>
        <P>On FX KNOB, try TIME: ¼, ½, ¾, 1 and 2 beats. At 1 beat the repeats land on the thin beat lines. Then raise FEEDBACK: more repeats, fading more slowly.</P>
      </Step>
      <Step n={3}>
        <P>Switch the TYPE to REVERB, FILTER and FLANGER and listen as the CROWD. Then move CH SELECT: on CH1 only deck A is affected; on MASTER both decks are; on SEND each channel’s SEND knob decides, and the dry sound stays exactly as it was.</P>
        <P>This mixer’s cue is taken before the fader and the effect, so your headphones stay dry. Some mixers can put the effect in the cue too; check yours.</P>
        <Note tone="safety">Effects can push the MIX BUS into the red on their own (long feedback especially). Watch MIX BUS PEAK, and keep FEEDBACK under control on a live system.</Note>
        <Note>Deck B’s tempo has been matched to deck A for you — Screen 10 shows how — so the echoes sit in time with both.</Note>
      </Step>
      <Step n={4}>
        <Do>Put an echo on every beat. Then do an ECHO OUT: deck A playing with the echo on, pull CH1 FADER all the way down — the repeats ring on in time after the music stops. Then put one REVERB on both decks with the SENDs, and sweep the whole mix with a FILTER or FLANGER on the MASTER.</Do>
        <P>An echo out is one way to leave a track; a filter sweep or a plain cut are others. These are starting points to try, not rules.</P>
        <GoalChips goals={goals.slice(0, 4)} latched={latched.slice(0, 4)} />
        <Note>FX OFF stops feeding the effect, and what it holds rings out (on this mixer — many have a TRAILS switch; some cut the tail).</Note>
      </Step>
      <Step n={5}>
        <Do>On your own: with both decks up, put the effect on deck B only, while deck A carries on dry.</Do>
        <UnderstandingCheck
          eyebrow="CHECK YOURSELF"
          question="You turn a reverb on and the WHOLE mix gets wet, though you only wanted it on deck A. Where is the effect sitting?"
          options={['On the MASTER — everything the crowd hears goes through it', 'On channel 1 as an insert', 'On channel 2 as an insert', 'On the headphone cue']}
          correct={0}
          explain="An effect on the master (mix bus) takes both decks at once. For deck A alone, put it on channel 1 (an insert) — or on a send with only SEND 1 up."
          wrong={[undefined, 'A channel 1 insert would leave deck B dry.', 'A channel 2 insert would leave deck A dry — the opposite.', 'The cue is what YOU hear; it never makes the crowd’s mix wet.']}
          onCorrect={() => setCheck(true)}
        />
        <FaultCard
          title="FX ON, BUT NO ECHO"
          symptom="The ECHO is switched on and set, but the crowd hears deck A completely dry."
          start={() => {
            void audio.requestSound();
            updateBooth((b, t) =>
              alignPhase(
                { ...b, decks: { A: { ...b.decks.A, playing: true, at: t }, B: { ...b.decks.B, playing: true, at: t } }, ch: { 1: { ...b.ch[1], fader: 0.85 }, 2: { ...b.ch[2], fader: 0 } }, fx: { ...freshFx(), on: true, type: 'ECHO', route: 'CH2', time: 1, feedback: 0.55 }, perspective: 'CROWD' },
                t,
                'B',
              ),
            );
          }}
          fixed={!!booth.fx && booth.fx.on && booth.fx.route === 'CH1' && A.playing && f1 > 0.3}
          hints={['Read SITS ON on the readout strip, and look at the map: which box holds the effect?', 'It is on channel 2 — deck B, cued with its fader down.', 'Open FX and set WHERE IT SITS to CH1.']}
          why="The effect was inserted on channel 2, so it was echoing deck B — which the crowd could not hear. An effect only does something to the signal that passes through the place it sits."
          onFixed={() => setFault1(true)}
        />
        <FaultCard
          title="A ROAR THAT BUILDS ON ITS OWN"
          symptom="With a send effect running, a rising roar starts to build and keeps growing — even between beats."
          start={() => {
            void audio.requestSound();
            updateBooth((b, t) => ({
              ...b,
              decks: { ...b.decks, A: { ...b.decks.A, playing: true, at: t } },
              ch: { 1: { ...b.ch[1], fader: 0.8 }, 2: { ...b.ch[2], fader: 0.9, trim: TRIM_UNITY } },
              fx: { ...freshFx(), on: true, type: 'ECHO', route: 'SEND', time: 0, feedback: 0.4, wet: 0.9, send: { 1: 0.5, 2: 1 }, returnTo: 'CH2' },
              perspective: 'CROWD',
            }));
          }}
          fixed={!!booth.fx && booth.fx.route === 'SEND' && (booth.fx.returnTo === 'BUS' || booth.fx.send[2] === 0) && A.playing}
          hints={['Look at the map: the RETURN is drawn in red. Where does it go?', 'The return comes back in on channel 2 — and channel 2’s SEND feeds the effect again: a loop.', 'Open FX and set RETURN TO the mix bus (or take SEND 2 off).']}
          why="The effect’s return was fed back into channel 2, whose own send fed the effect again — a loop that climbs until something clips at full scale. The lab held it under a safe level and played it quieter; a real one can be loud enough to damage speakers and ears. Return to the bus, or keep a returning channel’s send off."
          onFixed={() => setFault2(true)}
        />
        {loop ? <Note tone="safety">LOOP — the lab is holding this one quiet. On a real system, pull the RETURN down first, then find the routing.</Note> : null}
        <GoalChips goals={goals.slice(4)} latched={latched.slice(4)} />
      </Step>
    </DjRack>
  );
}

export const P13: PageDef = { title: 'Effects and their routing', short: 'EFFECTS', Component: PageEffects, manualDone: true, rack: true };
