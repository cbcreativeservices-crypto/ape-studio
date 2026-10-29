/**
 * Screen 20 — PA speakers, subs and venue connections (research DJ21, DJ22,
 * DJ25). The booth now plays a VENUE: the mixer's MASTER goes on labelled,
 * balanced lines into the venue's stage box (DJ L, DJ R) at the side of the
 * stage, about 20 m of cable away, and from there the ENGINEER's input gain
 * — never a DJ control — feeds the venue's processor (the crossover: tops
 * above 100 Hz, a mono sub below) and the speakers.
 *
 * Three views of one system: the ROOM (the coverage field from model/djRoom:
 * nominal angles are −6 dB angles, level falls steeply outside them, subs
 * are near-omni and drawn as their COHERENT sum at 60 Hz; real staging
 * positions; PA L at HOUSE LEFT), the HANDOFF (the mixer's rear to the stage
 * box) and the SYSTEM (the crossover's response from the same filters the
 * render uses, the tops and the subs at true size).
 *
 * Sound exposure (DJ25) sits here, at the decks: the model gives the level
 * at the DJ's ears from the PA's spill and the booth monitors (the ROOM
 * only — the headphones add to it), and the Calculator Lab's own NIOSH
 * function (85 dBA, 3 dB exchange) turns a 4-hour set into a dose. The
 * fault (second learning review 2026-10-18, 20 #3: a core PA fault that
 * needs no optional screen): the 20 m run on an UNBALANCED lead (DJ-R3-ADAPTER:
 * a jack lead with an XLR adapter, what a DJ really brings), humming on
 * the floor. The turntable loop (the subs shaking the table) stays on the
 * ROOM's gauge to explore.
 */
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Group } from '@shopify/react-native-skia';
import { colors } from '../../../../theme/tokens';
import { LabChip } from '../../LabShell';
import { UnderstandingCheck } from '../../tuning/components/check';
import type { PageCtx, PageDef } from '../../kit/PagedLab';
import { nioshDose } from '../../calc/workspaces/splSafety';
import { Scene, type Callout } from '../art/Scene';
import { HeatLegend, LEGEND_H, PlanView, PLAN_FRAME, planAt, planObstacles, type MapMode } from '../art/PlanView';
import { MixerRear } from '../art/RearPanels';
import { PassiveTopRear, PowerAmpRear, SB_IN, SB_H, SB_W, SpeakerLead, SpeakerLeadTag, speakerTagWidestPt, StageBox, Subwoofer, XoverPlot, xoverResp, AMP_H, AMP_W, SUB_W } from '../art/VenueGear';
import { PowerSpeaker, SPEAKER_W } from '../art/gear';
import { CableRun } from '../art/cables';
import { MIXER_REAR, MIXER_REAR_JACKS, type Box } from '../geometry/boothGeometry';
import { AMP_REAR, NL4, SYS_AMP_AT, SYS_TOP_AT, speakerLeadPts, speakerTagBox } from '../geometry/eventGeometry';
import { DjRack } from '../DjRack';
import { Do, EvidenceCheck, FaultCard, GoalChips, Look, Note, P, Step, Terms, useVisitGoals } from '../bits';
import { stopKey, type Transport } from '../dock';
import { getBooth, updateBooth } from '../booth/boothStore';
import { cueAtBar, useScreenSetup } from '../booth/setup';
import { connect, levelKnobGain, type Booth } from '../model/djModel';
import { PLACEMENTS, ROOM, SUB_PLACES, topsDbaAt, type Placement, type SubPlace } from '../model/djRoom';
import { VENUE_GAIN_MAX_DB, VENUE_GAIN_MIN_DB, evOf, turntableMarginDb, venueHandoffOk, venueSwapped, withVenue, type VenuePatch } from '../model/djEvent';
import { EventListen, Row, TrayNote, useEventKit, useFreshReading, withFreshEvent } from './eventShared';
import { PEAK_RED } from './shared';

const TERMS = [
  { term: 'House left', def: 'Which speaker is LEFT is the venue’s call. In live sound it is usually HOUSE LEFT — the crowd’s left, your RIGHT as you face them. Ask the engineer; many club systems run mono. (This lab draws PA L at house left.)' },
  { term: 'Balanced line', def: 'Two signal wires and a shield; the input takes the difference between them, so hum picked up equally on both cancels. That is why long runs to a venue are usually XLR.' },
  { term: 'Crossover', def: 'Splits the music by frequency: the tops get the part above the crossover point (100 Hz here), the subs the part below. Bass is usually sent to the subs in MONO.' },
  { term: 'Coverage angle', def: 'A speaker’s nominal angle is where it is 6 dB down from straight ahead — a 90° top is −6 dB at 45° each side. Outside that, the level falls away fast. A single sub spreads almost evenly all round.' },
] as const;

export const GOALS_PA = ['Hand off DJ L and DJ R, balanced', 'Raise the room by the engineer’s gain', 'Crossover on: flat where tops meet subs', 'Tops placed: no hole, decks out of the beam', '4-hour dose at the decks ≤ 100 %', 'On your own: tops behind you, dose ≤ 100 %', 'Find the hum on the floor', 'Pass the check'] as const;

type View3 = 'ROOM' | 'HANDOFF' | 'SYSTEM';

const LOOK: Record<View3, string> = {
  ROOM: 'You are looking down on the venue: the stage at the top, the floor colored by level, the tops with their −6 dB edges, the subs and the booth. PA L stands at house left — on your left here, the DJ’s right.',
  HANDOFF: 'You are looking at the back of the mixer and the venue’s stage box at the side of the stage, about 20 m of cable away: MASTER L and R into the inputs this venue has labelled DJ L and DJ R (13 and 14 here; every venue numbers its own — ask the engineer).',
  SYSTEM: 'You are looking at the venue’s system: the crossover’s response (TOPS, SUB and their SUM), and below, a top and a sub at true size.',
};

/* ── the HANDOFF view (mm) ────────────────────────────────────────────── */

const H_FRAME: Box = { x: -16, y: -36, w: 556, h: 336 };
const SB_AT = { x: 276, y: 158 };
const mst = (side: 'L' | 'R') => MIXER_REAR_JACKS[side === 'L' ? 'master.L' : 'master.R'];
const sbIn = (n: 13 | 14) => {
  const j = SB_IN.find((q) => q.n === n)!;
  return { x: SB_AT.x + j.x, y: SB_AT.y + j.y };
};
/** The two runs' lanes. Seen from behind the mixer, MASTER R is the LEFT
 *  jack, and the stage box's DJ L the left input: so that the two runs
 *  never cross, MASTER R goes up OVER the mixer and MASTER L down UNDER it
 *  (visual review #15: two lanes, traceable, never one double line). */
const LANE = { over: -18, under: 132 } as const;
/** DJ-R2-07: each run leaves its plug SIDEWAYS before it turns, so it never
 *  covers the panel's printing: MASTER R steps left (between the BOOTH
 *  jacks' legends and the MASTER OUT bracket) before it climbs, MASTER L
 *  steps right (past its own "L" legend, short of the USB) before it drops. */
const JOG = { R: -16, L: 8 } as const;
const mstX = (side: 'L' | 'R') => mst(side).x + JOG[side];

function runPts(from: 'L' | 'R', to: 13 | 14): [number, number][] {
  const a = mst(from);
  const b = sbIn(to);
  const lane = from === 'R' ? LANE.over : LANE.under;
  const x = mstX(from);
  return [[a.x, a.y], [x, a.y], [x, lane], [b.x, lane], [b.x, b.y]];
}

export function HandoffView({ booth }: { booth: Booth }) {
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
      {runs.map((r) => {
        if (!r.p) return null;
        const from = r.p === 'MST_L' ? 'L' : 'R';
        const pts = runPts(from, r.to);
        const lane = pts[2][1];
        return (
          <CableRun
            key={r.to}
            flow
            // DJ-R3-ADAPTER (owner 2026-10-21): the unbalanced run is what a DJ
            // really brings — an XLR-to-jack lead (its female XLR on the
            // mixer's male MASTER OUT) whose 6.35 mm TS jack goes into a
            // jack-to-XLR adapter in the stage box's female XLR (every plug
            // fits its jack, C13). The TS jack ties pin 3 to pin 1: the run is
            // unbalanced — thinner, plain, flagged UNBAL
            r={{ id: `v${r.to}`, kind: 'xlr', colour: '#3d4046', pts, plugged: true, live: true, label: `${from === 'L' ? 'MST L' : 'MST R'}${unbal ? ' · UNBAL' : ''}`, dashed: from === 'R', unbal, farAdapter: unbal }}
            labelAt={[(pts[2][0] + pts[3][0]) / 2 + (from === 'R' ? 20 : 0), lane]}
          />
        );
      })}
      {/* the loose master cables the DJ has not handed off */}
      {(['MST_L', 'MST_R'] as const)
        .filter((p) => v.djL !== p && v.djR !== p)
        .map((p) => {
          const side = p === 'MST_L' ? 'L' : 'R';
          const a = mst(side);
          const x = mstX(side);
          const dx = p === 'MST_L' ? 34 : -34;
          return <CableRun key={p} r={{ id: p, kind: 'xlr', colour: '#3d4046', pts: [[a.x, a.y], [x, a.y], [x, a.y + 80], [x + dx, a.y + 126]], plugged: false, live: false, label: p === 'MST_L' ? 'MST L' : 'MST R', dashed: p === 'MST_R' }} labelAt={[x + dx * 0.4, a.y + 98]} />;
        })}
    </Group>
  );
}

/* ── the SYSTEM view (mm) ─────────────────────────────────────────────── */

/** R4-DJ-02 follow-up: the frame keeps 150 mm above the amp (y −120), so the
 *  label for CH B's lead ("TO TOP R") sits right beside that lead, above the
 *  amp, on every glass. */
export const S_FRAME: Box = { x: -40, y: -270, w: 1180, h: 1030 };

/** R4-DJ-02: how far past the frame's edge the amp's leads run before they
 *  end — off the glass at every size, so their far plugs (at the processor,
 *  the mains distro, TOP R) are never drawn hanging in the picture. */
export const AMP_LEAD_RUN_OFF = 1200;
/** The processor's feed into the amp's CH A INPUT: a balanced XLR line (its
 *  male plug in the amp's female socket) coming down from above the view. */
const AMP_IN_A: [number, number][] = [
  [SYS_AMP_AT.x + AMP_REAR.inA.x, SYS_AMP_AT.y + AMP_REAR.inA.y],
  [SYS_AMP_AT.x + AMP_REAR.inA.x, S_FRAME.y - AMP_LEAD_RUN_OFF],
];
/** R5-DJ-01: the processor's right-hand feed into CH B INPUT — a second
 *  balanced XLR (its male plug seated in the amp's female socket), rising
 *  straight up in its own lane between CH A's speaker plug and CH A's XLR,
 *  left of the INPUT (BAL) legend (stereo amp: one input per channel — the
 *  processor's L into A, its R into B). */
export const AMP_IN_B: [number, number][] = [
  [SYS_AMP_AT.x + AMP_REAR.inB.x, SYS_AMP_AT.y + AMP_REAR.inB.y],
  [SYS_AMP_AT.x + AMP_REAR.inB.x, S_FRAME.y - AMP_LEAD_RUN_OFF],
];
/** R4-DJ-02: the mains lead's lane — just under the amp's chassis (its
 *  bottom edge at y + 88). */
export const AMP_MAINS_LANE_Y = SYS_AMP_AT.y + AMP_H + 8;
/** R4-DJ-02: the amp's mains lead — its IEC C13 plug seated in AC IN, the
 *  cord (true scale, ⌀ ≈ 6, ribbed) dropping from the plug and turning LEFT
 *  under the chassis, out of the frame toward the power distro. Mains keeps
 *  to the fan side and the underside; every audio lead (the XLR line, both
 *  speaker leads) is to its right or above it — it crosses none and runs
 *  beside none (rule book R1, R2, R8). */
export const AMP_AC: [number, number][] = [
  [SYS_AMP_AT.x + AMP_REAR.ac.x, SYS_AMP_AT.y + AMP_REAR.ac.y],
  [SYS_AMP_AT.x + AMP_REAR.ac.x, AMP_MAINS_LANE_Y],
  [S_FRAME.x - AMP_LEAD_RUN_OFF, AMP_MAINS_LANE_Y],
];
/** R4-DJ-02: CH B is not empty — it drives the other top (TOP R, out of
 *  view): a Speakon lead (NL4FC seated in CH B OUTPUT) rising in its own
 *  lane out of the frame, called out "TO TOP R". */
export const AMP_OUT_B: [number, number][] = [
  [SYS_AMP_AT.x + AMP_REAR.outB.x, SYS_AMP_AT.y + AMP_REAR.outB.y],
  [SYS_AMP_AT.x + AMP_REAR.outB.x, S_FRAME.y - AMP_LEAD_RUN_OFF],
];

/** The speaker lead. Its name is a two-line tag LEFT of the top
 *  (VenueGear.SpeakerLeadTag; R4-DJ-02 follow-up): a flag on the lead was
 *  wider than the top on a small glass and ran under the sub. */
const LEAD = speakerLeadPts();

/** The SYSTEM view's labels (R4-DJ-02 adds CH B's "TO TOP R"). */
export function sysCallouts(v: { tops: 'POWERED' | 'PASSIVE'; subs: boolean }): Callout[] {
  const tp: Callout = { id: 'tp', text: v.tops === 'PASSIVE' ? 'PASSIVE TOP (BACK)' : 'POWERED TOP', at: { x: SYS_TOP_AT.x + (v.tops === 'PASSIVE' ? SPEAKER_W * 0.22 : SPEAKER_W / 2), y: SYS_TOP_AT.y + 40 }, dx: 0, dy: -30, tone: 'plain' };
  const sb: Callout = { id: 'sb', text: v.subs ? '18-INCH SUB' : 'SUB (OFF)', at: { x: 500 + SUB_W / 2, y: 30 }, dx: 0, dy: -24, tone: 'plain' };
  if (v.tops !== 'PASSIVE') return [tp, sb];
  // R4-DJ-02: CH B's label sits in the band above the amp, right beside its
  // lead; the amp's name to its right, level with it — both placed before
  // the sub's
  return [
    tp,
    { id: 'cb', text: 'TO TOP R', at: { x: AMP_OUT_B[0][0], y: SYS_AMP_AT.y - 75 }, dx: -8, dy: 0, tone: 'plain' },
    { id: 'am', text: 'POWER AMP (BACK)', at: { x: SYS_AMP_AT.x + AMP_W - 11, y: SYS_AMP_AT.y + AMP_H / 2 }, dx: 12, dy: 0, tone: 'plain' },
    sb,
  ];
}

/** The SYSTEM view's cables, kept clear of labels (PASSIVE + AMP only). */
export function sysObstacles(tops: 'POWERED' | 'PASSIVE'): Box[] | undefined {
  if (tops !== 'PASSIVE') return undefined;
  const up = (pts: [number, number][], half: number): Box => ({ x: pts[0][0] - half, y: S_FRAME.y, w: half * 2, h: pts[0][1] + half - S_FRAME.y });
  const ac = AMP_AC[0];
  return [
    { x: Math.min(...LEAD.map((p) => p[0])) - NL4.plugD / 2, y: LEAD[0][1] - NL4.plugD / 2, w: NL4.plugD + 20, h: LEAD[LEAD.length - 1][1] - LEAD[0][1] + NL4.plugD },
    up(AMP_IN_A, 12),
    up(AMP_IN_B, 12),
    up(AMP_OUT_B, NL4.plugD / 2),
    // the mains lead: its plug and drop, then its run out to the left
    { x: ac[0] - 15, y: ac[1] - 11, w: 30, h: AMP_MAINS_LANE_Y + 4 - (ac[1] - 11) },
    { x: S_FRAME.x - AMP_LEAD_RUN_OFF, y: AMP_MAINS_LANE_Y - 4, w: ac[0] + 4 - (S_FRAME.x - AMP_LEAD_RUN_OFF), h: 8 },
  ];
}

/** R4-DJ-02: the amp's panel, which a label should rather not cover. */
export const SYS_SOFT: Box[] = [{ x: SYS_AMP_AT.x, y: SYS_AMP_AT.y, w: AMP_W, h: AMP_H }];

/** The speaker lead's tag, at the Scene's scale: no label may cover it. */
export const sysObstaclesAt = (s: number, k: number): Box[] => {
  const b = speakerTagBox(s, k, speakerTagWidestPt(k));
  return [{ x: b.x, y: b.y, w: b.w, h: b.h }];
};

/**
 * PASSIVE + AMP (R3-DJ-02, owner 2026-10-21): a passive top has no
 * amplifier, no mains and no power LED, so it is NOT drawn as the powered
 * front. Both boxes are seen from BEHIND, where the connection is: the power
 * amp's Speakon CH A OUTPUT and the top's INPUT cup, joined by a Speakon
 * speaker lead (heavy, unshielded two-core; an NL4FC at each end) — never a
 * mic or line cable (rule book L3, L4, R1). The processor's line comes into
 * the amp's CH A INPUT on XLR from above. R4-DJ-02: the amp is powered — its
 * mains lead (IEC C13 seated in AC IN) drops and leaves the frame to the
 * left, under the chassis, in its own lane — and CH B drives the other top:
 * its Speakon lead rises out of the frame, called out "TO TOP R". R5-DJ-01:
 * CH B is fed too — the processor's R line on its own XLR into CH B INPUT.
 */
export function SystemView({ booth, live }: { booth: Booth; live: boolean }) {
  const v = evOf(booth).venue;
  return (
    <Group>
      {v.tops === 'PASSIVE' ? (
        <Group>
          <PowerAmpRear x={SYS_AMP_AT.x} y={SYS_AMP_AT.y} />
          <CableRun r={{ id: 'ampAc', kind: 'iec', colour: '#16171a', pts: AMP_AC, plugged: true, live: true, label: 'MAINS', farKind: 'mains' }} />
          <CableRun r={{ id: 'ampInA', kind: 'xlr', colour: '#3d4046', pts: AMP_IN_A, plugged: true, live, label: 'FROM PROCESSOR' }} />
          <CableRun r={{ id: 'ampInB', kind: 'xlr', colour: '#3d4046', pts: AMP_IN_B, plugged: true, live, label: 'FROM PROCESSOR R' }} />
          <SpeakerLead pts={AMP_OUT_B} live={live} />
          <PassiveTopRear x={SYS_TOP_AT.x} y={SYS_TOP_AT.y} />
          <SpeakerLead pts={LEAD} live={live} />
          <SpeakerLeadTag live={live} />
        </Group>
      ) : (
        <PowerSpeaker x={SYS_TOP_AT.x} y={SYS_TOP_AT.y} s={1} on signal={live} />
      )}
      <Subwoofer x={500} y={0} s={1} on={v.subs} />
    </Group>
  );
}

/* ── the trays ───────────────────────────────────────────────────────── */

const boothStep = (d: number) => updateBooth((x) => ({ ...x, mixer: { ...x.mixer, booth: Math.max(0, Math.min(1, Math.round((x.mixer.booth + d) * 20) / 20)) } }));

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
        <LabChip label="JACK LEAD + XLR ADAPTER" selected={v.cable === 'UNBAL'} onPress={() => set({ cable: 'UNBAL' })} compact />
      </Row>
      {v.cable === 'UNBAL' ? <TrayNote tone="warn">A jack lead with an XLR adapter — unbalanced: an XLR-to-jack lead from your MASTER OUT, its 6.35 mm TS jack in a jack-to-XLR adapter at the stage box. Every plug fits, but the TS jack ties pin 3 to pin 1, so the line no longer balances.</TrayNote> : null}
      <Row head={`ASK THE ENGINEER (their gain on your feed: ${v.gainDb >= 0 ? '+' : '−'}${Math.abs(v.gainDb)} dB)`}>
        <LabChip label="“UP 3 dB, PLEASE”" selected={false} onPress={() => ask(3)} compact />
        <LabChip label="“DOWN 3 dB”" selected={false} onPress={() => ask(-3)} compact />
      </Row>
      <TrayNote tone="fine">The engineer’s gain is theirs: you ask, they set it. Your MASTER stays at its unity mark (about three-quarters).</TrayNote>
      <Row head={`BOOTH MONITORS · LEVEL ${Math.round(b.mixer.booth * 100)}%`}>
        <LabChip label="BOOTH −" selected={false} onPress={() => boothStep(-0.05)} compact />
        <LabChip label="BOOTH +" selected={false} onPress={() => boothStep(0.05)} compact />
      </Row>
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
      </Row>
      <Row head="THE TURNTABLE ON THE TABLE (Screen 17)">
        <LabChip label={v.ttIso ? 'ISOLATION FEET ON' : 'NO ISOLATION'} selected={v.ttIso} onPress={() => set({ ttIso: !v.ttIso })} compact />
      </Row>
      <Row head="TOPS (see the difference in SYSTEM)">
        <LabChip label={v.tops === 'POWERED' ? 'POWERED' : 'PASSIVE + AMP'} selected={false} onPress={() => { set({ tops: v.tops === 'POWERED' ? 'PASSIVE' : 'POWERED' }); setView('SYSTEM'); }} compact />
      </Row>
      <TrayNote tone="fine">A powered speaker has its amplifier inside and takes a LINE feed. A passive one needs a separate power amplifier and a SPEAKER cable from it — never a mic or line cable.</TrayNote>
    </View>
  );
}

/* ── the page ────────────────────────────────────────────────────────── */

/** The plan's DANCE FLOOR word (cm): no label sits on it. */
const FLOOR_WORD: Box = { x: -170, y: 300, w: 340, h: 46 };

const fmtDba = (v: number | null) => (v == null ? '—' : v.toFixed(0));
const PLACE_SHORT: Record<Placement, string> = { CORNERS: 'AIM IN', STRAIGHT: 'DOWN', BEHIND: 'BEHIND' };

function PagePa({ ctx }: { ctx: PageCtx }) {
  const { booth, audio, tr, motion, last } = useEventKit();
  const { ready } = useScreenSetup((b) => {
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
  const [own, setOwn] = useState(false);
  const [faultFixed, setFaultFixed] = useState(false);
  const ev = evOf(booth);
  const v = ev.venue;
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
  const floorHum = !!last && last.ext.hum.crowd;
  // the floor and the dose count only from a render of the booth as it is
  // NOW: SET IT UP below moved the tops BEHIND and passed at once on the old
  // placement's dose (toddler hunt 2026-10-19)
  const fresh = useFreshReading(booth, last);
  const hits = [
    venueHandoffOk(v),
    fresh && venueHandoffOk(v) && playing && floor != null && floor >= 95 && !masterClip && booth.mixer.master <= 0.8 && v.gainDb > VENUE_GAIN_MIN_DB,
    v.xover && v.subs && flatAt100,
    placedOk,
    fresh && playing && dose != null && dose <= 100 && floor != null && floor >= 90,
    own,
    faultFixed,
    check,
  ];
  const goals = GOALS_PA.map((label, i) => ({ label, hit: hits[i] }));
  const latched = useVisitGoals(ctx, goals, 'PA', ready);
  const swapped = venueSwapped(v);

  const stacked = v.subs && v.subPos === 'TOPS';
  const roomCallouts: Callout[] = [
    { id: 'pl', text: stacked ? 'PA L · TOP + SUB' : 'PA L', at: planAt.top(v.place, 'L'), dx: -14, dy: -18, tone: 'plain' },
    { id: 'pr', text: stacked ? 'PA R · TOP + SUB' : 'PA R', at: planAt.top(v.place, 'R'), dx: 14, dy: -18, tone: 'plain' },
    { id: 'fc', text: `FLOOR ${fmtDba(fc)} dBA`, at: planAt.floorCentre(), dx: 0, dy: 18, tone: 'amber' },
    { id: 'fr', text: `FRONT ${fmtDba(front)}`, at: planAt.frontCentre(), dx: 28, dy: 0, tone: front - fc < -6 ? 'red' : 'plain' },
    { id: 'dj', text: `PA AT THE DECKS ${fmtDba(decks)}`, at: planAt.dj(), dx: 30, dy: -6, tone: decks - fc > -8 ? 'red' : 'green' },
    ...(v.subs && v.subPos === 'BOOTH' ? [{ id: 'sb', text: 'SUB UNDER THE BOOTH', at: planAt.sub(v.subPos), dx: -40, dy: 30, tone: 'red' as const }] : []),
  ];
  const sbx = (n: 13 | 14) => sbIn(n);
  const handoffCallouts: Callout[] = [
    { id: 'mr', text: 'MASTER R', at: { x: mst('R').x - 10, y: mst('R').y }, dx: -12, dy: 0, tone: 'plain' },
    { id: 'ml', text: 'MASTER L', at: { x: mst('L').x + 10, y: mst('L').y + 4 }, dx: 12, dy: 18, tone: 'plain' },
    { id: 'sl', text: v.djL ? `DJ L ← ${v.djL === 'MST_L' ? 'MASTER L' : 'MASTER R'}` : 'DJ L (EMPTY)', at: { x: sbx(13).x, y: SB_AT.y + SB_H }, dx: -6, dy: 20, tone: v.djL === 'MST_L' ? 'green' : v.djL ? 'red' : 'plain' },
    { id: 'sr', text: v.djR ? `DJ R ← ${v.djR === 'MST_R' ? 'MASTER R' : 'MASTER L'}` : 'DJ R (EMPTY)', at: { x: sbx(14).x, y: SB_AT.y + SB_H }, dx: 10, dy: 40, tone: v.djR === 'MST_R' ? 'green' : v.djR ? 'red' : 'plain' },
    { id: 'sn', text: 'TO THE ENGINEER', at: { x: SB_AT.x + SB_W + 50, y: SB_AT.y + SB_H + 30 }, dx: -10, dy: 12, tone: 'plain' },
    ...(v.cable === 'UNBAL' && (v.djL || v.djR) ? [{ id: 'ub', text: 'UNBALANCED: HUM', at: { x: 240, y: LANE.under }, dx: 0, dy: 16, tone: 'red' as const }] : []),
  ];
  // the cables' lanes and runs are kept clear of labels (flags label them)
  const handoffObstacles: Box[] = [
    { x: 0, y: 0, w: MIXER_REAR.w, h: MIXER_REAR.h },
    { x: SB_AT.x, y: SB_AT.y, w: SB_W, h: SB_H },
    { x: 150, y: LANE.over - 8, w: 240, h: 16 },
    { x: 190, y: LANE.under - 8, w: 140, h: 16 },
    { x: sbx(14).x - 8, y: LANE.over, w: 16, h: SB_AT.y - LANE.over },
    { x: sbx(13).x - 8, y: LANE.under, w: 16, h: SB_AT.y - LANE.under },
    { x: mstX('L') - 7, y: mst('L').y, w: 14, h: LANE.under - mst('L').y },
    { x: mstX('R') - 7, y: LANE.over, w: 14, h: mst('R').y - LANE.over },
  ];
  const sysCalloutsNow = sysCallouts(v);

  const fourth =
    view === 'ROOM'
      ? { k: 'TT LOOP', v: Number.isFinite(ttMargin) ? (ttMargin <= 0 ? 'HOWLING' : `${ttMargin.toFixed(0)} dB`) : 'NO SUBS', sub: Number.isFinite(ttMargin) && ttMargin > 0 ? 'SPARE' : undefined, tint: ttMargin <= 0 ? PEAK_RED : ttMargin < 6 ? colors.amber : colors.green }
      : view === 'HANDOFF'
        ? { k: 'DJ L · DJ R', v: `${v.djL === 'MST_L' ? '✓' : v.djL ? '✗' : '—'} · ${v.djR === 'MST_R' ? '✓' : v.djR ? '✗' : '—'}`, sub: v.cable === 'UNBAL' && (v.djL || v.djR) ? 'UNBALANCED' : undefined, tint: venueHandoffOk(v) ? colors.green : colors.amber }
        : { k: 'AT 100 Hz', v: Math.abs(at100) < 0.05 ? '0.0' : `${at100 > 0 ? '+' : '−'}${Math.abs(at100).toFixed(1)}`, sub: 'dB', tint: flatAt100 ? colors.green : colors.amber };

  return (
    <DjRack
      spec={{
        render: (w, h) => {
          const k = Math.sqrt(Math.max(1, w / 360));
          return view === 'ROOM' ? (
            <Scene w={w} h={h} frame={PLAN_FRAME} motion={motion} fit={{ x: 0, y: 0, w, h: h - LEGEND_H * k }} aspect={false} focus={{ x: -160, y: 60, w: 320, h: 200 }} a11y={`${LOOK.ROOM} Floor center about ${fmtDba(fc)} dBA, the decks ${fmtDba(decks)}.${map === 'BASS' ? ' The bass map shows 60 hertz: the subs’ sound adds in step in some places and cancels in others.' : ''}`} obstacles={[...planObstacles(v.place, v.subPos, v.subs, true), FLOOR_WORD]} callouts={roomCallouts} screenOverlay={(sw, sh, _x, kz) => <HeatLegend w={sw} h={sh} k={Math.sqrt(Math.max(1, kz))} mode={map} place={v.place} feedDbfs={feed > -90 ? feed : -20} strip />}>
              <PlanView spec={{ map, place: v.place, subPos: v.subPos, subs: v.subs, feedDbfs: feed > -90 ? feed : -20, monitors: true, turntable: true, edges: map === 'TOPS', points: true, djTone: dose != null && dose > 100 ? '#ff5a48' : '#5bff85' }} />
            </Scene>
          ) : view === 'HANDOFF' ? (
            <Scene w={w} h={h} frame={H_FRAME} motion={motion} focus={{ x: 150, y: -20, w: 320, h: 260 }} a11y={`${LOOK.HANDOFF} DJ L gets ${v.djL ?? 'nothing'}, DJ R gets ${v.djR ?? 'nothing'}; the run is ${v.cable === 'XLR' ? 'balanced XLR' : 'a jack lead with an XLR adapter at the stage box — unbalanced'}.`} obstacles={handoffObstacles} callouts={handoffCallouts}>
              <HandoffView booth={booth} />
            </Scene>
          ) : (
            <Scene
              w={w}
              h={h}
              frame={S_FRAME}
              motion={motion}
              fit={{ x: 0, y: h * 0.5, w, h: h * 0.5 }}
              aspect={false}
              a11y={`${LOOK.SYSTEM}${v.tops === 'PASSIVE' ? ' The passive top and its power amp are seen from the back: the processor’s line comes into the amp’s CH A input on XLR, and a Speakon speaker cable runs from the amp’s CH A output to the top’s INPUT. The processor’s right-hand line comes into the amp’s CH B input on a second XLR. The amp’s CH B output feeds the other top, TOP R, on its own Speakon lead out of view, and the amp’s mains lead is plugged into its AC IN. The top has no amplifier and no power light of its own.' : ''} The crossover is ${v.xover ? 'on' : 'off'}; at 100 hertz the sum is ${at100.toFixed(1)} dB.`}
              obstacles={sysObstacles(v.tops)}
              obstaclesAt={v.tops === 'PASSIVE' ? sysObstaclesAt : undefined}
              soft={v.tops === 'PASSIVE' ? SYS_SOFT : undefined}
              callouts={sysCalloutsNow}
              screenOverlay={(sw, sh, _x, kz) => {
                const kk = Math.sqrt(Math.max(1, kz));
                return <XoverPlot b={{ x: 42 * kk, y: 14 * kk, w: sw - 56 * kk, h: sh * 0.5 - 42 * kk }} xover={v.xover} subs={v.subs} k={kk} />;
              }}
            >
              <SystemView booth={booth} live={playing && feed > -90} />
            </Scene>
          );
        },
        bezel: [
          { k: 'FLOOR', v: fmtDba(floor), sub: floorHum ? 'dBA · HUM' : 'dBA (MODEL)', vA11y: floor == null ? 'no sound on the floor' : `${floor.toFixed(0)} dBA modelled at the floor center${floorHum ? ', with a hum' : ''}`, tint: floorHum ? PEAK_RED : colors.amber },
          { k: 'AT THE DECKS', v: fmtDba(dj), sub: 'dBA (MODEL)', tint: dj != null && dj > 88 ? PEAK_RED : colors.green },
          { k: '4-HOUR DOSE', v: dose == null ? '—' : `${dose} %`, sub: 'ROOM ONLY', vA11y: dose == null ? 'no dose yet' : `${dose} percent of the daily dose in four hours, from the room only — the headphones add to it`, tint: dose != null && dose > 100 ? PEAK_RED : colors.green },
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
          { kind: 'options', id: 'view', label: 'VIEW', valueLabel: view, options: [{ id: 'ROOM', label: 'ROOM', blurb: 'The venue from above, colored by level.' }, { id: 'HANDOFF', label: 'HANDOFF', blurb: 'The mixer’s rear and the venue’s stage box.' }, { id: 'SYSTEM', label: 'SYSTEM', blurb: 'The crossover and the speakers.' }], selectedId: view, onSelect: (id) => setView(id as View3) },
          { kind: 'group', id: 'venue', label: 'VENUE', valueLabel: venueHandoffOk(v) ? `${v.gainDb >= 0 ? '+' : '−'}${Math.abs(v.gainDb)} dB` : 'NOT FED', valueA11y: `the venue gets ${v.djL ? 'DJ L' : 'no DJ L'} and ${v.djR ? 'DJ R' : 'no DJ R'}; engineer's gain ${v.gainDb} dB; booth monitors ${Math.round(booth.mixer.booth * 100)} percent`, render: () => <VenueTray tr={tr} onAsk={setEngineer} /> },
          { kind: 'group', id: 'setup', label: 'SETUP', valueLabel: PLACE_SHORT[v.place], valueA11y: `tops ${PLACEMENTS[v.place].label.toLowerCase()}`, render: () => <SetupTray setView={setView} map={map} setMap={setMap} /> },
          stopKey(tr),
        ],
        initialParam: 'master',
      }}
    >
      <Step n={1}>
        <Look>{LOOK[view]}</Look>
        <P>In a venue your MASTER is a line feed to someone else’s system: hand it over labelled and balanced, at its unity mark, and let the engineer set the room. The stage box inputs are mic preamps: the engineer pads them or sets the gain low for your line feed. What the crowd hears then depends on the processor, the speakers and where they stand.</P>
        <Terms items={TERMS} />
      </Step>
      <Step n={2}>
        <Do>Open VENUE and play deck A. Put MASTER L into DJ L and MASTER R into DJ R on XLR — read DJ L · DJ R on the strip.</Do>
        <P>The room is quiet: ask the engineer for more (“UP 3 dB”) until the FLOOR reads about 95 dBA (a suggested level for a busy floor in this model; a real venue’s limit and its engineer decide), with your MASTER at its unity mark. Pushing your MASTER into the red instead just sends them distortion.</P>
        {engineer ? <Note tone="try">{engineer}</Note> : null}
        {swapped ? <Note>L and R are swapped against the venue’s labels: swap the two inputs.</Note> : null}
      </Step>
      <Step n={3}>
        <P>In SYSTEM, the crossover is OFF: the tops’ and the sub’s own roll-offs overlap and the SUM bulges round 100 Hz. Turn it ON and watch SUM go flat — the tops above, the sub below, in mono. It is flat here because this sub and these tops arrive together; in a real system the engineer also time-aligns them (a delay and the polarity at the processor), and a sub far from its tops can cancel round the crossover point.</P>
        <P>A venue with ONE input for the DJ gets a mono mix: the mixer’s MONO switch, or a summing box — never a Y-cable joining two outputs, which makes them fight each other.</P>
        <P>In the ROOM, the tops aimed straight down leave a hole in front of the floor. Try each placement: the front corners, aimed in, cover the floor evenly and keep the decks out of their beam; behind the DJ, the decks become the loudest seat in the house. (The map is a simplified picture of the mid range: no height, no reflections. The SUBS map shows 60 Hz: two spaced subs add in step in some places and cancel in others — move a metre and the bass changes.)</P>
        <Note>The TT LOOP (turntable loop) reading on the ROOM’s strip is a different loop from mic feedback: the subs shake the table and the turntable’s stylus plays the shaking back — low and slow (Screen 17). Mic feedback rings at whatever pitch the loop peaks first, often the mids or highs. Distance and isolation cure the turntable loop; turning a mic down does not.</Note>
        <Note tone="safety">Real stands: on level ground, legs fully out, the top locked on the pole, the legs taped clear of feet, and kept within the stand’s rated height and load. With passive speakers, the amplifier is OFF (or its level down) while you connect or move a speaker cable — its terminals can carry a shock-level voltage on a big amplifier.</Note>
        <Note tone="safety">At the decks you hear the PA’s spill AND the booth monitors, for hours. This dose counts the room at the decks only — your headphones add to it, often more than the room. A 4-hour set at more than about 88 dBA is over the NIOSH guideline from Screen 1 (85 dBA for 8 hours, half the time for every 3 dB more; the OSHA legal limit is 90 dBA with a 5 dB rule). Turn the BOOTH down before you turn the headphones up; take breaks; wear musicians’ earplugs. This is a modelled level — a phone’s volume is not your ears’ level.</Note>
      </Step>
      <Step n={4}>
        <Do>Hand off DJ L and DJ R on XLR, get the room to about 95 dBA through the engineer, turn the crossover on, place the tops, and bring your 4-hour dose at the decks to 100 % or less.</Do>
        <GoalChips goals={goals.slice(0, 5)} latched={latched.slice(0, 5)} />
      </Step>
      <Step n={5}>
        <EvidenceCheck
          eyebrow="ON YOUR OWN"
          task="the tops now stand BEHIND THE DJ. Bring your 4-hour dose back to 100 % or less without moving them — only the booth level and the engineer’s gain — with the floor still at 90 dBA or more."
          start={() => {
            void audio.requestSound();
            updateBooth((b, t) => {
              const x = withVenue(b, { place: 'BEHIND', djL: 'MST_L', djR: 'MST_R', cable: 'XLR' });
              return { ...x, decks: { ...x.decks, A: { ...x.decks.A, playing: true, at: t } } };
            });
            setView('ROOM');
          }}
          met={fresh && v.place === 'BEHIND' && playing && dose != null && dose <= 100 && floor != null && floor >= 90}
          progress={v.place === 'BEHIND' && dose != null ? `4-HOUR DOSE ${dose} % · FLOOR ${fmtDba(floor)} dBA` : null}
          explain="Behind the DJ, the tops’ beam passes the decks: the booth monitors and the engineer’s gain are all you have, and the margin is thin. That is why tops belong in front of the DJ line."
          onMet={() => setOwn(true)}
        />
        <UnderstandingCheck
          eyebrow="CHECK YOURSELF"
          question="A small bar’s system has ONE input for the DJ. Someone offers a Y-cable that joins your MASTER L and MASTER R outputs into it. What do you do?"
          options={['Use the mixer’s MONO switch (or a proper summing box) and send one output', 'Use the Y-cable — it is the same as mono', 'Send MASTER L only; the right side is just a copy', 'Send the booth output instead']}
          correct={0}
          explain="A Y-cable ties two outputs straight together: each drives into the other, which can load them, distort and, on some gear, damage them. Sum L and R properly — the mixer’s MONO master, or a summing circuit — and check the mix in mono: anything only on one side gets quieter, and anything out of phase between the sides can vanish."
          wrong={[undefined, 'Joining two outputs with a cable is not a summing circuit: they fight each other.', 'L and R are rarely identical: whatever sits only on the right would disappear.', 'The booth output follows the BOOTH knob, and it is still stereo.']}
          onCorrect={() => setCheck(true)}
        />
        <FaultCard
          title="A HUM ON THE DANCE FLOOR"
          symptom="A steady 60 Hz hum (50 Hz in many countries) comes from the PA, between tracks too — yet the booth monitors and the headphones are clean."
          start={() => {
            void audio.requestSound();
            updateBooth((b, t) => {
              const x = withVenue(b, { djL: 'MST_L', djR: 'MST_R', cable: 'UNBAL' });
              return { ...x, decks: { ...x.decks, A: { ...x.decks.A, playing: true, at: t } } };
            });
            setView('ROOM');
          }}
          fixed={venueHandoffOk(evOf(booth).venue) && !floorHum}
          hints={['The booth and the headphones are clean, so where does the hum get in: before the mixer, or after it?', 'Look at the HANDOFF: what kind of cable makes the 20 m run to the stage box?', 'Open VENUE: the 20 m run.']}
          why="This run is a jack lead with an XLR adapter — unbalanced: the 6.35 mm TS jack ties pin 3 to pin 1, so its shield is also the music’s return wire — and over 20 m its shield also carries ground current between the booth’s earth and the stage’s earth: that is the hum. A balanced line carries the music on two wires and the input cancels whatever both pick up. A hum only on the venue’s feed, not in the booth or the headphones, entered after the mixer."
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
