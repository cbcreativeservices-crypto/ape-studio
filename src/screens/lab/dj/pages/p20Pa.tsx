/**
 * Screen 20 — PA speakers, subs and venue connections (research DJ21, DJ22,
 * DJ25). The booth now plays a VENUE: the mixer's MASTER goes on labelled,
 * balanced lines into the venue's stage box (DJ L, DJ R), and from there the
 * ENGINEER's input gain — never a DJ control — feeds the venue's processor
 * (the crossover: tops above 100 Hz, a mono sub below) and the speakers.
 *
 * Three views of one system: the ROOM (the coverage field from model/djRoom:
 * nominal angles are −6 dB angles, level falls steeply outside them, subs
 * are near-omni; real staging positions), the HANDOFF (the mixer's rear to
 * the stage box) and the SYSTEM (the crossover's response from the same
 * filters the render uses, the tops and the subs at true size).
 *
 * Sound exposure (DJ25) sits here, at the decks: the model gives the level
 * at the DJ's ears from the PA's spill and the booth monitors, and the
 * Calculator Lab's own NIOSH function (85 dBA, 3 dB exchange) turns a
 * 4-hour set into a dose. The fault: TURNTABLE acoustic feedback (the subs
 * under the booth) — shown on its loop gauge, never played.
 */
import { useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Group } from '@shopify/react-native-skia';
import { colors } from '../../../../theme/tokens';
import { LabChip } from '../../LabShell';
import { UnderstandingCheck } from '../../tuning/components/check';
import type { PageCtx, PageDef } from '../../kit/PagedLab';
import { nioshDose } from '../../calc/workspaces/splSafety';
import { Scene, type Callout } from '../art/Scene';
import { HeatLegend, PlanView, PLAN_FRAME, planAt, planObstacles, type MapMode } from '../art/PlanView';
import { MixerRear } from '../art/RearPanels';
import { PowerAmp, SB_IN, StageBox, Subwoofer, XoverPlot, xoverResp, AMP_W, SUB_W } from '../art/VenueGear';
import { PowerSpeaker, SPEAKER_W } from '../art/gear';
import { CableRun } from '../art/cables';
import { MIXER_REAR, MIXER_REAR_JACKS, type Box } from '../geometry/boothGeometry';
import { DjRack } from '../DjRack';
import { Do, FaultCard, GoalChips, Look, Note, P, Step, Terms, useVisitGoals } from '../bits';
import { stopKey, type Transport } from '../dock';
import { getBooth, updateBooth } from '../booth/boothStore';
import { cueAtBar, useScreenSetup } from '../booth/setup';
import { connect, levelKnobGain, type Booth } from '../model/djModel';
import { PLACEMENTS, ROOM, SUB_PLACES, topsDbaAt, type Placement, type SubPlace } from '../model/djRoom';
import { VENUE_GAIN_MAX_DB, VENUE_GAIN_MIN_DB, evOf, turntableMarginDb, venueHandoffOk, venueSwapped, withVenue, type VenuePatch } from '../model/djEvent';
import { EventListen, Row, TrayNote, useEventKit, withFreshEvent } from './eventShared';
import { PEAK_RED, peakDb } from './shared';

const TERMS = [
  { term: 'Powered or passive', def: 'A powered speaker has its amplifier inside and takes a LINE feed. A passive one needs a separate power amplifier and a SPEAKER cable from it — never a mic or line cable.' },
  { term: 'Balanced line', def: 'Two signal wires and a shield; the input takes the difference between them, so hum picked up equally on both cancels. That is why long runs to a venue are XLR.' },
  { term: 'Crossover', def: 'Splits the music by frequency: the tops get the part above the crossover point (100 Hz here), the subs the part below. Bass is usually sent to the subs in MONO.' },
  { term: 'Coverage angle', def: 'A speaker’s nominal angle is where it is 6 dB down from straight ahead — a 90° top is −6 dB at 45° each side. Outside that, the level falls away fast. Subs spread almost evenly all round.' },
] as const;

export const GOALS_PA = ['Hand off DJ L and DJ R, balanced', 'Raise the room by the engineer’s gain', 'Crossover on: flat where tops meet subs', 'Tops placed: no hole, decks out of the beam', '4-hour dose at the decks ≤ 100 %', 'Stop the low howl at the decks', 'Pass the check'] as const;

type View3 = 'ROOM' | 'HANDOFF' | 'SYSTEM';

const LOOK: Record<View3, string> = {
  ROOM: 'You are looking down on the venue: the dance floor coloured by how loud the tops are (or the subs’ bass), the tops with their −6 dB coverage edges, the subs, the booth table with the decks and the DJ’s listening point.',
  HANDOFF: 'You are looking at the back of the mixer and the venue’s stage box beside the booth: MASTER L and R on XLR cables into the inputs labelled DJ L and DJ R, which run to the engineer.',
  SYSTEM: 'You are looking at the venue’s system: the crossover’s response (tops in blue, the sub in violet, what you hear in white), and below, a top, a sub — and the amplifier a passive system needs — at true size.',
};

/* ── the HANDOFF view (mm) ────────────────────────────────────────────── */

const H_FRAME: Box = { x: -10, y: -40, w: 580, h: 250 };
const SB_AT = { x: 352, y: 6 };
const mst = (side: 'L' | 'R') => MIXER_REAR_JACKS[side === 'L' ? 'master.L' : 'master.R'];
const sbIn = (n: 13 | 14) => {
  const j = SB_IN.find((q) => q.n === n)!;
  return { x: SB_AT.x + j.x, y: SB_AT.y + j.y };
};

function HandoffView({ booth }: { booth: Booth }) {
  const v = evOf(booth).venue;
  const runs: { p: VenuePatch; to: 13 | 14 }[] = [
    { p: v.djL, to: 13 },
    { p: v.djR, to: 14 },
  ];
  const unbal = v.cable === 'UNBAL';
  return (
    <Group>
      <MixerRear x={0} y={0} on />
      <StageBox x={SB_AT.x} y={SB_AT.y} hot={runs.filter((r) => r.p).map((r) => r.to)} />
      {runs.map((r, i) => {
        if (!r.p) return null;
        const a = mst(r.p === 'MST_L' ? 'L' : 'R');
        const b = sbIn(r.to);
        const lane = -14 - i * 12;
        return (
          <CableRun
            key={r.to}
            r={{ id: `v${r.to}`, kind: unbal ? 'trs' : 'xlr', colour: '#3d4046', pts: [[a.x, a.y], [a.x, lane], [b.x, lane], [b.x, b.y]], plugged: true, live: true, label: r.p === 'MST_L' ? 'MST L' : 'MST R', dashed: r.p === 'MST_R' }}
            labelAt={[(a.x + b.x) / 2 + (i ? 30 : -30), lane]}
          />
        );
      })}
      {/* the loose master cables the DJ has not handed off */}
      {(['MST_L', 'MST_R'] as const)
        .filter((p) => v.djL !== p && v.djR !== p)
        .map((p) => {
          const a = mst(p === 'MST_L' ? 'L' : 'R');
          return <CableRun key={p} r={{ id: p, kind: 'xlr', colour: '#3d4046', pts: [[a.x, a.y], [a.x, a.y + 70], [a.x + (p === 'MST_L' ? 30 : -30), a.y + 110]], plugged: false, live: false, label: p === 'MST_L' ? 'MST L' : 'MST R', dashed: p === 'MST_R' }} labelAt={[a.x + (p === 'MST_L' ? 22 : -22), a.y + 84]} />;
        })}
    </Group>
  );
}

/* ── the SYSTEM view (mm) ─────────────────────────────────────────────── */

const S_FRAME: Box = { x: -40, y: -140, w: 1180, h: 900 };

function SystemView({ booth, live }: { booth: Booth; live: boolean }) {
  const v = evOf(booth).venue;
  return (
    <Group>
      {v.tops === 'PASSIVE' ? <PowerAmp x={0} y={-120} s={1} on signal={live} /> : null}
      <PowerSpeaker x={40} y={60} s={1} on signal={live} />
      <Subwoofer x={500} y={0} s={1} on={v.subs} />
    </Group>
  );
}

/* ── the trays ───────────────────────────────────────────────────────── */

function VenueTray({ tr, onAsk }: { tr: Transport; onAsk: (msg: string) => void }) {
  const b = getBooth();
  const v = evOf(b).venue;
  const set = (patch: Parameters<typeof withVenue>[1]) => updateBooth((x) => withVenue(x, patch));
  const ask = (d: number) => {
    const cur = evOf(getBooth()).venue.gainDb;
    const next = Math.max(VENUE_GAIN_MIN_DB, Math.min(VENUE_GAIN_MAX_DB, cur + d));
    if (next === cur) {
      onAsk(d > 0 ? 'ENGINEER: “That’s all the room takes from your feed.”' : 'ENGINEER: “You’re as low as I go.”');
      return;
    }
    set({ gainDb: next });
    onAsk(`ENGINEER: “${d > 0 ? 'Up' : 'Down'} 3 dB on your channel — now ${next >= 0 ? '+' : '−'}${Math.abs(next)} dB.”`);
  };
  return (
    <View style={styles.tray}>
      <Row head="THE MUSIC">
        <LabChip label={`${b.decks.A.playing ? '❚❚ PAUSE' : '▶ PLAY'} A`} selected={b.decks.A.playing} onPress={() => tr.toggle('A')} compact />
        {tr.soundDeclined ? <LabChip label="TURN SOUND ON" selected={false} onPress={tr.soundOn} compact /> : null}
      </Row>
      <Row head="STAGE BOX INPUT “DJ L” GETS">
        {(['MST_L', 'MST_R', null] as const).map((p) => (
          <LabChip key={String(p)} label={p === 'MST_L' ? 'MASTER L' : p === 'MST_R' ? 'MASTER R' : 'NOTHING'} selected={v.djL === p} onPress={() => set({ djL: p, ...(p && v.djR === p ? { djR: null } : null) })} compact />
        ))}
      </Row>
      <Row head="STAGE BOX INPUT “DJ R” GETS">
        {(['MST_L', 'MST_R', null] as const).map((p) => (
          <LabChip key={String(p)} label={p === 'MST_L' ? 'MASTER L' : p === 'MST_R' ? 'MASTER R' : 'NOTHING'} selected={v.djR === p} onPress={() => set({ djR: p, ...(p && v.djL === p ? { djL: null } : null) })} compact />
        ))}
      </Row>
      <Row head="THE 20 m RUN TO THE STAGE BOX">
        <LabChip label="XLR (BALANCED)" selected={v.cable === 'XLR'} onPress={() => set({ cable: 'XLR' })} compact />
        <LabChip label="UNBALANCED LEAD" selected={v.cable === 'UNBAL'} onPress={() => set({ cable: 'UNBAL' })} compact />
      </Row>
      <Row head={`ASK THE ENGINEER (their gain on your feed: ${v.gainDb >= 0 ? '+' : '−'}${Math.abs(v.gainDb)} dB)`}>
        <LabChip label="“UP 3 dB, PLEASE”" selected={false} onPress={() => ask(3)} compact />
        <LabChip label="“DOWN 3 dB”" selected={false} onPress={() => ask(-3)} compact />
      </Row>
      <TrayNote tone="fine">The engineer’s gain is theirs: you ask, they set it. Your MASTER stays at its unity mark (about three-quarters).</TrayNote>
      <EventListen withRecorder={false} />
    </View>
  );
}

function SetupTray({ setView, map, setMap }: { setView: (v: View3) => void; map: MapMode; setMap: (m: MapMode) => void }) {
  const b = getBooth();
  const v = evOf(b).venue;
  const set = (patch: Parameters<typeof withVenue>[1]) => updateBooth((x) => withVenue(x, patch));
  return (
    <View style={styles.tray}>
      <Row head="WHERE THE TOPS STAND (shows the room)">
        {(Object.keys(PLACEMENTS) as Placement[]).map((p) => (
          <LabChip key={p} label={PLACEMENTS[p].label} selected={v.place === p} onPress={() => { set({ place: p }); setView('ROOM'); }} compact />
        ))}
      </Row>
      <TrayNote>{PLACEMENTS[v.place].blurb}</TrayNote>
      <Row head="WHERE THE SUBS STAND">
        {(Object.keys(SUB_PLACES) as SubPlace[]).map((p) => (
          <LabChip key={p} label={SUB_PLACES[p].label} selected={v.subPos === p} onPress={() => { set({ subPos: p }); setView('ROOM'); }} compact />
        ))}
      </Row>
      <Row head="THE ROOM MAP SHOWS">
        <LabChip label="TOPS (dBA)" selected={map === 'TOPS'} onPress={() => { setMap('TOPS'); setView('ROOM'); }} compact />
        <LabChip label="SUBS (BASS)" selected={map === 'BASS'} onPress={() => { setMap('BASS'); setView('ROOM'); }} compact />
      </Row>
      <Row head="THE PROCESSOR (shows the system)">
        <LabChip label={v.xover ? 'CROSSOVER ON' : 'CROSSOVER OFF'} selected={v.xover} onPress={() => { set({ xover: !v.xover }); setView('SYSTEM'); }} compact />
        <LabChip label={v.subs ? 'SUBS ON' : 'SUBS OFF'} selected={v.subs} onPress={() => { set({ subs: !v.subs }); setView('SYSTEM'); }} compact />
        <LabChip label={v.tops === 'POWERED' ? 'TOPS: POWERED' : 'TOPS: PASSIVE + AMP'} selected={false} onPress={() => { set({ tops: v.tops === 'POWERED' ? 'PASSIVE' : 'POWERED' }); setView('SYSTEM'); }} compact />
      </Row>
      <Row head={`THE TURNTABLE ON THE TABLE · BOOTH LEVEL ${Math.round(b.mixer.booth * 100)}%`}>
        <LabChip label={v.ttIso ? 'ISOLATION FEET ON' : 'NO ISOLATION'} selected={v.ttIso} onPress={() => set({ ttIso: !v.ttIso })} compact />
        <LabChip label="BOOTH −" selected={false} onPress={() => updateBooth((x) => ({ ...x, mixer: { ...x.mixer, booth: Math.max(0, Math.round((x.mixer.booth - 0.05) * 20) / 20) } }))} compact />
        <LabChip label="BOOTH +" selected={false} onPress={() => updateBooth((x) => ({ ...x, mixer: { ...x.mixer, booth: Math.min(1, Math.round((x.mixer.booth + 0.05) * 20) / 20) } }))} compact />
      </Row>
    </View>
  );
}

/* ── the page ────────────────────────────────────────────────────────── */

const fmtDba = (v: number | null) => (v == null ? '—' : v.toFixed(0));

function PagePa({ ctx }: { ctx: PageCtx }) {
  const { booth, audio, tr, motion, last } = useEventKit();
  useScreenSetup((b) => {
    let x = cueAtBar(b, 'A', 'glassHarbour', 17);
    x = { ...x, ch: { 1: { ...x.ch[1], fader: 0.85, xf: 'THRU', cue: false }, 2: { ...x.ch[2], fader: 0, cue: false } }, mixer: { ...x.mixer, master: 0.6, booth: 0.45, xf: 0.5 }, perspective: 'CROWD' };
    // the master cables come out of the booth's own PA: this is a venue
    x = connect(connect(x, 'mst.xlrL', null) ?? x, 'mst.xlrR', null) ?? x;
    return withFreshEvent(x, (ev) => ({ ...ev, venue: { ...ev.venue, on: true, gainDb: VENUE_GAIN_MIN_DB, place: 'STRAIGHT', subPos: 'TOPS', xover: false } }));
  });
  const [view, setView] = useState<View3>('HANDOFF');
  const [map, setMap] = useState<MapMode>('TOPS');
  const [engineer, setEngineer] = useState<string | null>(null);
  const [check, setCheck] = useState(false);
  const [faultFixed, setFaultFixed] = useState(false);
  const ev = evOf(booth);
  const v = ev.venue;
  const mPeak = peakDb(last, 'masterL');
  const mPeakR = peakDb(last, 'masterR');
  const masterPk = Math.max(mPeak ?? -120, mPeakR ?? -120);
  const masterClip = !!last && last.clipped.master > 0;
  const floor = last?.ext.floorDba ?? null;
  const dj = last?.ext.djDba ?? null;
  const dose = dj != null ? Math.round(nioshDose([dj], [240])) : null;
  const feed = last?.ext.feedRms.venue ?? -120;
  const playing = booth.decks.A.playing;
  // the placement's own numbers (at this feed): the floor centre, the
  // front-centre hole, the decks
  const fc = topsDbaAt(ROOM.floorCentre, v.place, feed > -90 ? feed : -20);
  const front = topsDbaAt({ x: 0, y: 4.2 }, v.place, feed > -90 ? feed : -20);
  const decks = topsDbaAt(ROOM.dj, v.place, feed > -90 ? feed : -20);
  const placedOk = front - fc >= -6 && decks - fc <= -8;
  const ttMargin = turntableMarginDb(v, feed > -90 ? feed - v.gainDb : -20);
  const at100 = xoverResp(100, v.xover, v.subs).sum;
  const flatAt100 = Math.abs(at100) <= 1;
  const hits = [
    venueHandoffOk(v),
    venueHandoffOk(v) && playing && floor != null && floor >= 95 && !masterClip && booth.mixer.master <= 0.8 && v.gainDb > VENUE_GAIN_MIN_DB,
    v.xover && v.subs && flatAt100,
    placedOk,
    playing && dose != null && dose <= 100 && floor != null && floor >= 90,
    faultFixed,
    check,
  ];
  const goals = GOALS_PA.map((label, i) => ({ label, hit: hits[i] }));
  const latched = useVisitGoals(ctx, goals, 'PA');
  const swapped = venueSwapped(v);

  const roomCallouts: Callout[] = [
    { id: 'pl', text: 'PA L', at: planAt.top(v.place, 'L'), dx: 14, dy: -18, tone: 'plain' },
    { id: 'pr', text: 'PA R', at: planAt.top(v.place, 'R'), dx: -14, dy: -18, tone: 'plain' },
    { id: 'fc', text: `FLOOR ${fmtDba(fc)} dBA`, at: planAt.floorCentre(), dx: 0, dy: 18, tone: 'amber' },
    { id: 'fr', text: `FRONT ${fmtDba(front)}`, at: planAt.frontCentre(), dx: 28, dy: 0, tone: front - fc < -6 ? 'red' : 'plain' },
    { id: 'dj', text: `PA AT THE DECKS ${fmtDba(decks)}`, at: planAt.dj(), dx: 30, dy: -6, tone: decks - fc > -8 ? 'red' : 'green' },
    ...(v.subs ? [{ id: 'sb', text: v.subPos === 'BOOTH' ? 'SUB UNDER THE BOOTH' : 'SUBS', at: planAt.sub(v.subPos), dx: v.subPos === 'BOOTH' ? -40 : 30, dy: 30, tone: v.subPos === 'BOOTH' ? ('red' as const) : ('plain' as const) }] : []),
  ];
  const sb = (n: 13 | 14) => sbIn(n);
  const handoffCallouts: Callout[] = [
    { id: 'ml', text: 'MASTER L', at: { x: mst('L').x, y: mst('L').y + 12 }, dx: 0, dy: 20, tone: 'plain' },
    { id: 'mr', text: 'MASTER R', at: { x: mst('R').x, y: mst('R').y + 12 }, dx: -6, dy: 22, tone: 'plain' },
    { id: 'sl', text: v.djL ? `DJ L ← ${v.djL === 'MST_L' ? 'MASTER L' : 'MASTER R'}` : 'DJ L (EMPTY)', at: { x: sb(13).x, y: sb(13).y + 30 }, dx: 0, dy: 22, tone: v.djL === 'MST_L' ? 'green' : v.djL ? 'red' : 'plain' },
    { id: 'sr', text: v.djR ? `DJ R ← ${v.djR === 'MST_R' ? 'MASTER R' : 'MASTER L'}` : 'DJ R (EMPTY)', at: { x: sb(14).x, y: sb(14).y + 30 }, dx: 10, dy: 40, tone: v.djR === 'MST_R' ? 'green' : v.djR ? 'red' : 'plain' },
    { id: 'sn', text: 'TO THE ENGINEER', at: { x: SB_AT.x + 250, y: SB_AT.y + 150 }, dx: -10, dy: 8, tone: 'plain' },
    ...(v.cable === 'UNBAL' && (v.djL || v.djR) ? [{ id: 'ub', text: 'UNBALANCED: HUM', at: { x: (mst('L').x + sb(13).x) / 2, y: -14 }, dx: 0, dy: -18, tone: 'red' as const }] : []),
  ];
  const sysCallouts: Callout[] = [
    { id: 'tp', text: v.tops === 'PASSIVE' ? 'PASSIVE TOP' : 'POWERED TOP', at: { x: 40 + SPEAKER_W / 2, y: 60 + 40 }, dx: 0, dy: -30, tone: 'plain' },
    { id: 'sb', text: v.subs ? '18-INCH SUB' : 'SUB (OFF)', at: { x: 500 + SUB_W / 2, y: 30 }, dx: 0, dy: -24, tone: 'plain' },
    ...(v.tops === 'PASSIVE' ? [{ id: 'am', text: 'POWER AMP', at: { x: AMP_W / 2, y: -120 }, dx: 0, dy: -16, tone: 'plain' as const }] : []),
  ];

  const fourth =
    view === 'ROOM'
      ? { k: 'TURNTABLE LOOP', v: Number.isFinite(ttMargin) ? (ttMargin <= 0 ? 'HOWLING' : `${ttMargin.toFixed(0)} dB`) : 'NO SUBS', sub: Number.isFinite(ttMargin) && ttMargin > 0 ? 'SPARE' : undefined, tint: ttMargin <= 0 ? PEAK_RED : ttMargin < 6 ? colors.amber : colors.green }
      : view === 'HANDOFF'
        ? { k: 'DJ L · DJ R', v: `${v.djL === 'MST_L' ? '✓' : v.djL ? '✗' : '—'} · ${v.djR === 'MST_R' ? '✓' : v.djR ? '✗' : '—'}`, tint: venueHandoffOk(v) ? colors.green : colors.amber }
        : { k: 'AT 100 Hz', v: `${at100 >= 0 ? '+' : '−'}${Math.abs(at100).toFixed(1)}`, sub: 'dB', tint: flatAt100 ? colors.green : colors.amber };

  return (
    <DjRack
      spec={{
        render: (w, h) =>
          view === 'ROOM' ? (
            <Scene w={w} h={h} frame={PLAN_FRAME} motion={motion} a11y={`${LOOK.ROOM} Floor centre about ${fmtDba(fc)} dBA, the decks ${fmtDba(decks)}.`} obstacles={planObstacles(v.place, v.subPos, v.subs, true)} callouts={roomCallouts} screenOverlay={(sw, sh, _x, kz) => <HeatLegend w={sw} h={sh} k={Math.sqrt(Math.max(1, kz))} mode={map} />}>
              <PlanView spec={{ map, place: v.place, subPos: v.subPos, subs: v.subs, feedDbfs: feed > -90 ? feed : -20, monitors: true, turntable: true, edges: map === 'TOPS', points: true, djTone: dose != null && dose > 100 ? '#ff5a48' : '#5bff85' }} />
            </Scene>
          ) : view === 'HANDOFF' ? (
            <Scene w={w} h={h} frame={H_FRAME} motion={motion} a11y={`${LOOK.HANDOFF} DJ L gets ${v.djL ?? 'nothing'}, DJ R gets ${v.djR ?? 'nothing'}.`} obstacles={[{ x: 0, y: 0, w: MIXER_REAR.w, h: MIXER_REAR.h }, { x: SB_AT.x, y: SB_AT.y, w: 200, h: 116 }]} callouts={handoffCallouts}>
              <HandoffView booth={booth} />
            </Scene>
          ) : (
            <Scene
              w={w}
              h={h}
              frame={S_FRAME}
              motion={motion}
              fit={{ x: 0, y: h * 0.46, w, h: h * 0.54 }}
              aspect={false}
              a11y={`${LOOK.SYSTEM} The crossover is ${v.xover ? 'on' : 'off'}; at 100 hertz the sum is ${at100.toFixed(1)} dB.`}
              callouts={sysCallouts}
              screenOverlay={(sw, sh, _x, kz) => <XoverPlot b={{ x: 46, y: 18, w: sw - 70, h: sh * 0.46 - 42 }} xover={v.xover} subs={v.subs} k={Math.sqrt(Math.max(1, kz))} />}
            >
              <SystemView booth={booth} live={playing && feed > -90} />
            </Scene>
          ),
        bezel: [
          { k: 'FLOOR', v: fmtDba(floor), sub: 'dBA (MODEL)', vA11y: floor == null ? 'no sound on the floor' : `${floor.toFixed(0)} dBA modelled at the floor centre`, tint: colors.amber },
          { k: 'AT THE DECKS', v: fmtDba(dj), sub: 'dBA (MODEL)', tint: dj != null && dj > 88 ? PEAK_RED : colors.green },
          { k: '4-HOUR DOSE', v: dose == null ? '—' : `${dose} %`, tint: dose != null && dose > 100 ? PEAK_RED : colors.green },
          fourth,
        ],
        params: [
          {
            kind: 'fader',
            id: 'master',
            label: 'MASTER',
            value: booth.mixer.master,
            level: true,
            home: 0.75,
            onChange: (x) => updateBooth((b) => ({ ...b, mixer: { ...b.mixer, master: x } })),
            format: (x) => `MASTER ${Math.round(x * 100)}% · ${(20 * Math.log10(Math.max(1e-6, levelKnobGain(x)))).toFixed(1)} dB${x > 0.8 ? ' — past unity' : ''}`,
            formatShort: (x) => `${Math.round(x * 100)}%`,
          },
          { kind: 'options', id: 'view', label: 'VIEW', valueLabel: view, options: [{ id: 'ROOM', label: 'ROOM', blurb: 'The venue from above, coloured by level.' }, { id: 'HANDOFF', label: 'HANDOFF', blurb: 'The mixer’s rear and the venue’s stage box.' }, { id: 'SYSTEM', label: 'SYSTEM', blurb: 'The crossover and the speakers.' }], selectedId: view, onSelect: (id) => setView(id as View3) },
          { kind: 'group', id: 'venue', label: 'VENUE', valueLabel: venueHandoffOk(v) ? `${v.gainDb >= 0 ? '+' : '−'}${Math.abs(v.gainDb)} dB` : 'NOT FED', valueA11y: `the venue gets ${v.djL ? 'DJ L' : 'no DJ L'} and ${v.djR ? 'DJ R' : 'no DJ R'}; engineer's gain ${v.gainDb} dB`, render: () => <VenueTray tr={tr} onAsk={setEngineer} /> },
          { kind: 'group', id: 'setup', label: 'SETUP', valueLabel: v.place, render: () => <SetupTray setView={setView} map={map} setMap={setMap} /> },
          stopKey(tr),
        ],
        initialParam: 'master',
      }}
    >
      <Step n={1}>
        <Look>{LOOK[view]}</Look>
        <P>In a venue your MASTER is a line feed to someone else’s system: hand it over labelled and balanced, at its unity mark, and let the engineer set the room. What the crowd hears then depends on the processor, the speakers and where they stand.</P>
        <Terms items={TERMS} />
      </Step>
      <Step n={2}>
        <Do>Open VENUE and play deck A. Put MASTER L into DJ L and MASTER R into DJ R on XLR — read DJ L · DJ R on the strip.</Do>
        <P>The room is quiet: ask the engineer for more (“UP 3 dB”) until the FLOOR reads 95 dBA or more, with your MASTER at its unity mark. Pushing your MASTER into the red instead just sends them distortion.</P>
        {engineer ? <Note tone="try">{engineer}</Note> : null}
        {swapped ? <Note>L and R are swapped: the room’s left speaker is playing your right channel. Swap the two inputs.</Note> : null}
      </Step>
      <Step n={3}>
        <P>In SYSTEM, the crossover is OFF: the tops’ and the sub’s own roll-offs overlap and the sum bulges round 100 Hz. Turn it ON and watch the white line go flat — the tops above, the sub below, in mono.</P>
        <P>In the ROOM, the tops aimed straight down leave a hole in front of the floor. Try each placement: the front corners, aimed in, cover the floor evenly and keep the decks out of their beam; behind the DJ, the decks become the loudest seat in the house.</P>
        <Note tone="safety">At the decks you hear the PA’s spill AND the booth monitors, for hours. A 4-hour set at more than about 88 dBA is over the 85 dBA / 8-hour reference (3 dB exchange). Turn the BOOTH down before you turn the headphones up; take breaks; wear musicians’ earplugs. This is a modelled level — a phone’s volume is not your ears’ level.</Note>
      </Step>
      <Step n={4}>
        <Do>Hand off DJ L and DJ R on XLR, get the room to 95 dBA through the engineer, turn the crossover on, place the tops, and bring your 4-hour dose at the decks to 100 % or less.</Do>
        <GoalChips goals={goals.slice(0, 5)} latched={latched.slice(0, 5)} />
      </Step>
      <Step n={5}>
        <UnderstandingCheck
          eyebrow="CHECK YOURSELF"
          question="A small bar’s system has ONE input for the DJ. Someone offers a Y-cable that joins your MASTER L and MASTER R outputs into it. What do you do?"
          options={['Use the mixer’s MONO switch (or a proper summing box) and send one output', 'Use the Y-cable — it is the same as mono', 'Send MASTER L only; the right side is just a copy', 'Send the booth output instead']}
          correct={0}
          explain="A Y-cable ties two outputs straight together: each drives into the other, which can load them, distort and, on some gear, damage them. Sum L and R properly — the mixer’s MONO master, or a summing circuit — and check the mix in mono: anything only on one side, or out of phase between the sides, can vanish."
          wrong={[undefined, 'Joining two outputs with a cable is not a summing circuit: they fight each other.', 'L and R are rarely identical: whatever sits only on the right would disappear.', 'The booth output follows the BOOTH knob, and it is still stereo.']}
          onCorrect={() => setCheck(true)}
        />
        <FaultCard
          title="A LOW HOWL AT THE DECKS"
          symptom="With the turntable playing loud, a deep hum-howl builds by itself — and the microphone is switched off."
          start={() => {
            updateBooth((b) => withVenue(b, { subPos: 'BOOTH', ttIso: false, subs: true }));
            setView('ROOM');
            setMap('BASS');
          }}
          fixed={turntableMarginDb(evOf(booth).venue) >= 6}
          hints={['The mic is off, so this is not mic feedback. Read TURNTABLE LOOP on the strip.', 'Show the room’s BASS: the sub stands right under the booth table, shaking the turntable — the stylus plays the shaking back.', 'Move the subs back under the tops, or put the turntable on isolation feet (SETUP), until TURNTABLE LOOP shows 6 dB or more.']}
          why="Two different loops: MIC feedback rings through the air into a microphone, high up the range. TURNTABLE feedback is the floor and the table shaking the stylus — low and slow, from the subs. It is cured by distance and isolation, not by the mic level. The lab shows this loop on its gauge; it never plays the howl."
          onFixed={() => setFaultFixed(true)}
        />
        <GoalChips goals={goals.slice(5)} latched={latched.slice(5)} />
      </Step>
    </DjRack>
  );
}

const styles = StyleSheet.create({
  tray: { gap: 10 },
});

export const P20: PageDef = { title: 'PA speakers, subs and venue connections', short: 'PA', Component: PagePa, manualDone: true, rack: true };

