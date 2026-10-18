/**
 * SystemMap — the whole first system, as you would wire it (Screen 4): the
 * two players' and the mixer's REAR panels along the back of the table, the
 * PA speakers and the booth monitors above, the headphones at the mixer's
 * front, the power strip below — and EVERY cable, each in its own lane, from
 * its fixed end to wherever the learner plugged it (or hanging loose).
 * Authored in mm on a schematic layout (devices to true scale within
 * themselves; the speakers drawn at 0.42× so the room fits on a phone — the
 * one simplification, named in MODEL.md).
 *
 * A cable glows only while the last render says audio (blue) or mains power
 * (amber) actually flows down it.
 */
import { memo } from 'react';
import { Circle, Group, RoundedRect } from '@shopify/react-native-skia';
import type { Booth, JackId, PlugId } from '../model/djModel';
import { deviceLive, phonesPlugged, PLUGS } from '../model/djModel';
import type { BoothRender } from '../engine/djRender';
import { MIXER_REAR, MIXER_REAR_JACKS, PLAYER_REAR, PLAYER_REAR_JACKS, type Box, type Pt } from '../geometry/boothGeometry';
import { INK } from './ink';
import { CableRun, type Run } from './cables';
import { Headphones, PHONES_CABLE_END, PowerSpeaker, PowerStrip, SPEAKER_H, SPEAKER_W, STRIP_D, STRIP_W, stripOutletX } from './gear';
import { MixerRear, PlayerRear } from './RearPanels';

export const MAP_FRAME: Box = { x: -6, y: -6, w: 1052, h: 722 };

const SPK_S = 0.42;
const PH_S = 0.35;
const BTH_S = 0.36;
export const MAP = {
  paL: { x: 18, y: 16 },
  paR: { x: 1040 - 18 - SPEAKER_W * SPK_S, y: 16 },
  boothL: { x: 214, y: 168 },
  boothR: { x: 1040 - 214 - 270 * BTH_S, y: 168 },
  A: { x: 20, y: 440 },
  mixer: { x: 385, y: 440 },
  B: { x: 700, y: 440 },
  phones: { x: 470, y: 586 },
  strip: { x: 355, y: 646 },
} as const;

/** Where a speaker's input (and power inlet) sit on the map: its base. */
const spkBox = (k: 'paL' | 'paR' | 'boothL' | 'boothR') => {
  const small = k.startsWith('booth');
  const s = small ? BTH_S : SPK_S;
  const o = MAP[k];
  return { x: o.x, y: o.y, w: (small ? 270 : SPEAKER_W) * s, h: (small ? 420 : SPEAKER_H) * s };
};
export const speakerInput = (k: 'paL' | 'paR' | 'boothL' | 'boothR'): Pt => {
  const b = spkBox(k);
  return { x: b.x + b.w * 0.36, y: b.y + b.h + 6 };
};
const speakerInlet = (k: 'paL' | 'paR' | 'boothL' | 'boothR'): Pt => {
  const b = spkBox(k);
  return { x: b.x + b.w * 0.7, y: b.y + b.h + 6 };
};
const mixerJack = (j: keyof typeof MIXER_REAR_JACKS): Pt => ({ x: MAP.mixer.x + MIXER_REAR_JACKS[j].x, y: MAP.mixer.y + MIXER_REAR_JACKS[j].y });
const playerJack = (d: 'A' | 'B', j: keyof typeof PLAYER_REAR_JACKS): Pt => ({ x: MAP[d].x + PLAYER_REAR_JACKS[j].x, y: MAP[d].y + PLAYER_REAR_JACKS[j].y });
export const phonesJackPt: Pt = { x: MAP.mixer.x + 66, y: MAP.mixer.y + MIXER_REAR.h + 14 };
export const outletPt = (i: number): Pt => ({ x: MAP.strip.x + stripOutletX(i), y: MAP.strip.y + 32 });

/** Map anchor of any jack. */
export function jackPt(j: JackId): Pt {
  if (j.startsWith('ch')) return mixerJack(j as keyof typeof MIXER_REAR_JACKS);
  if (j === 'mix.phones') return phonesJackPt;
  if (j.startsWith('strip.')) return outletPt(Number(j.slice(6)));
  return speakerInput(j.slice(0, -3) as 'paL' | 'paR' | 'boothL' | 'boothR');
}

/** The fixed end of each plug's cable on the map. */
export function fixedEnd(p: PlugId): Pt | null {
  switch (p) {
    case 'A.rcaL': return playerJack('A', 'outL');
    case 'A.rcaR': return playerJack('A', 'outR');
    case 'B.rcaL': return playerJack('B', 'outL');
    case 'B.rcaR': return playerJack('B', 'outR');
    case 'mst.xlrL': return mixerJack('master.L');
    case 'mst.xlrR': return mixerJack('master.R');
    case 'bth.trsL': return mixerJack('booth.L');
    case 'bth.trsR': return mixerJack('booth.R');
    case 'phones': return { x: MAP.phones.x + PHONES_CABLE_END.x * PH_S, y: MAP.phones.y + PHONES_CABLE_END.y * PH_S };
    case 'ac.playerA': return playerJack('A', 'ac');
    case 'ac.playerB': return playerJack('B', 'ac');
    case 'ac.mixer': return mixerJack('ac');
    case 'ac.paL': return speakerInlet('paL');
    case 'ac.paR': return speakerInlet('paR');
    case 'ac.boothL': return speakerInlet('boothL');
    case 'ac.boothR': return speakerInlet('boothR');
    default: return null;
  }
}

const LANE: Partial<Record<PlugId, number>> = {
  'A.rcaL': 566, 'A.rcaR': 573, 'B.rcaL': 584, 'B.rcaR': 591,
  'mst.xlrL': 380, 'mst.xlrR': 389, 'bth.trsL': 398, 'bth.trsR': 407,
  'ac.playerA': 616, 'ac.mixer': 623, 'ac.playerB': 630,
};
const EDGE_LANE: Partial<Record<PlugId, number>> = { 'ac.paL': 6, 'ac.boothL': 14, 'ac.paR': 1034, 'ac.boothR': 1026 };

/** The run a plug's cable takes through its lane. */
export function routeOf(p: PlugId, to: JackId | null): [number, number][] {
  const a = fixedEnd(p)!;
  const kind = PLUGS[p].kind;
  if (!to) {
    // a loose end, hanging a little below its fixed end
    const drop = kind === 'iec' ? 34 : 26;
    const side = p.endsWith('R') || p === 'ac.playerB' || p === 'ac.paR' || p === 'ac.boothR' ? 10 : -10;
    return [[a.x, a.y], [a.x, a.y + drop * 0.6], [a.x + side, a.y + drop]];
  }
  const b = jackPt(to);
  if (kind === 'rca') {
    const lane = LANE[p]!;
    return [[a.x, a.y], [a.x, lane], [b.x, lane], [b.x, b.y]];
  }
  if (kind === 'xlr' || kind === 'trs') {
    const lane = LANE[p]!;
    return [[a.x, a.y], [a.x, lane], [b.x, lane], [b.x, b.y]];
  }
  if (kind === 'phones') return [[a.x, a.y], [a.x - 26, a.y + 14], [b.x - 30, b.y + 34], [b.x, b.y + 16], [b.x, b.y]];
  // power
  const edge = EDGE_LANE[p];
  if (edge != null) {
    const lane = 612 + Object.keys(EDGE_LANE).indexOf(p) * 7;
    return [[a.x, a.y], [a.x, a.y + 10], [edge, a.y + 10], [edge, lane], [b.x, lane], [b.x, b.y]];
  }
  const lane = LANE[p] ?? 620;
  return [[a.x, a.y], [a.x, lane], [b.x, lane], [b.x, b.y]];
}

function liveOf(b: Booth, last: BoothRender | null, p: PlugId): boolean {
  const at = b.plugs[p];
  if (!at) return false;
  const kind = PLUGS[p].kind;
  if (kind === 'iec') return deviceLive(b, PLUGS[p].device as 'mixer');
  if (!last) return false;
  if (p.startsWith('A.')) return b.decks.A.playing && deviceLive(b, 'playerA');
  if (p.startsWith('B.')) return b.decks.B.playing && deviceLive(b, 'playerB');
  if (p === 'mst.xlrL') return last.rmsDb.masterL > -90;
  if (p === 'mst.xlrR') return last.rmsDb.masterR > -90;
  if (p.startsWith('bth.')) return last.rmsDb.booth > -90;
  if (p === 'phones') return phonesPlugged(b) && Math.max(last.rmsDb.phonesL, last.rmsDb.phonesR) > -90;
  return false;
}

const PLUG_COLOUR = (p: PlugId) => (PLUGS[p].kind === 'rca' ? (p.endsWith('L') ? INK.rcaWhite : INK.rcaRed) : '#2a2c31');

export const MAP_PLUGS: readonly PlugId[] = ['A.rcaL', 'A.rcaR', 'B.rcaL', 'B.rcaR', 'mst.xlrL', 'mst.xlrR', 'bth.trsL', 'bth.trsR', 'phones', 'ac.playerA', 'ac.playerB', 'ac.mixer', 'ac.paL', 'ac.paR', 'ac.boothL', 'ac.boothR'];

export const SystemMap = memo(function SystemMap({ booth, last, flow }: { booth: Booth; last: BoothRender | null; flow: boolean }) {
  const runs: Run[] = MAP_PLUGS.map((p) => ({
    id: p,
    kind: PLUGS[p].kind,
    colour: PLUG_COLOUR(p),
    pts: routeOf(p, booth.plugs[p]),
    plugged: booth.plugs[p] != null,
    live: liveOf(booth, last, p),
    label: PLUGS[p].short,
    dashed: p.endsWith('R') && PLUGS[p].kind !== 'iec',
  }));
  const used = Object.entries(booth.plugs)
    .filter(([, j]) => j && j.startsWith('strip.'))
    .map(([, j]) => Number((j as string).slice(6)));
  const spkOn = (k: 'paL' | 'paR' | 'boothL' | 'boothR') => deviceLive(booth, k);
  return (
    <Group>
      {/* the room: floor line and the booth table's edge */}
      <RoundedRect x={0} y={420} width={1040} height={190} r={14} color="#121317" />
      <RoundedRect x={0} y={420} width={1040} height={190} r={14} style="stroke" strokeWidth={1.2} color="rgba(255,255,255,0.06)" />
      <PowerSpeaker x={MAP.paL.x} y={MAP.paL.y} s={SPK_S} on={spkOn('paL')} signal={!!last && last.rmsDb.crowd > -90 && spkOn('paL')} />
      <PowerSpeaker x={MAP.paR.x} y={MAP.paR.y} s={SPK_S} on={spkOn('paR')} signal={!!last && last.rmsDb.crowd > -90 && spkOn('paR')} />
      <PowerSpeaker x={MAP.boothL.x} y={MAP.boothL.y} s={BTH_S} on={spkOn('boothL')} small signal={!!last && last.rmsDb.booth > -90 && spkOn('boothL')} />
      <PowerSpeaker x={MAP.boothR.x} y={MAP.boothR.y} s={BTH_S} on={spkOn('boothR')} small signal={!!last && last.rmsDb.booth > -90 && spkOn('boothR')} />
      {(['paL', 'paR', 'boothL', 'boothR'] as const).map((k) => {
        const i = speakerInput(k);
        const c = speakerInlet(k);
        return (
          <Group key={k}>
            <Circle cx={i.x} cy={i.y} r={6} color="#0a0b0d" />
            <Circle cx={i.x} cy={i.y} r={4} color="#3a3d43" />
            <RoundedRect x={c.x - 6} y={c.y - 4} width={12} height={8} r={1.5} color="#0a0b0d" />
          </Group>
        );
      })}
      <PlayerRear x={MAP.A.x} y={MAP.A.y} on={deviceLive(booth, 'playerA')} label="DECK A (REAR)" />
      <MixerRear x={MAP.mixer.x} y={MAP.mixer.y} on={deviceLive(booth, 'mixer')} />
      <PlayerRear x={MAP.B.x} y={MAP.B.y} on={deviceLive(booth, 'playerB')} label="DECK B (REAR)" />
      {/* the mixer's FRONT edge with its headphone jack (below the rear) */}
      <RoundedRect x={MAP.mixer.x + 40} y={phonesJackPt.y - 8} width={190} height={16} r={4} color="#1b1c20" />
      <Circle cx={phonesJackPt.x} cy={phonesJackPt.y} r={5} color="#9aa0a8" />
      <Circle cx={phonesJackPt.x} cy={phonesJackPt.y} r={2.6} color="#050506" />
      <Headphones x={MAP.phones.x} y={MAP.phones.y} s={PH_S} showPlug={false} />
      <PowerStrip x={MAP.strip.x} y={MAP.strip.y} on used={used} />
      {runs.map((r) => (
        <CableRun key={r.id} r={r} flow={flow} />
      ))}
    </Group>
  );
});

export const MAP_SIZE = { w: 1040, h: 710, strip: { w: STRIP_W, h: STRIP_D }, playerRear: PLAYER_REAR, mixerRear: MIXER_REAR };
