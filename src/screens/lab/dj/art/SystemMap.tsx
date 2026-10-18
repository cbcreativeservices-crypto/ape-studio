/**
 * SystemMap — the whole first system, as you would wire it (Screen 4), seen
 * from BEHIND the booth (geometry/mapGeometry: mirrored, deck B on the left):
 *
 *   ROOM   the floor, the PA speakers on their tripod stands, the DJ table
 *          with the booth monitors and the gear on it — all at ONE scale
 *          (ROOM_SCALE, said on the drawing; distances not to scale);
 *   PATCH  at true size: each speaker's input plate, the rear panels of
 *          deck B, the mixer and deck A, the mixer's front edge with the
 *          headphone jack, the headphones and the power strip — and EVERY
 *          cable, each in its own lane, patterned, labelled and tied, from its
 *          fixed end to wherever the learner plugged it (or hanging loose).
 *
 * A cable glows only while the last render says audio (blue) or mains power
 * (amber) actually flows down it; the travelling pulse along it is a
 * decorative overlay (useDecorativeMotion, via `flow`).
 */
import { memo } from 'react';
import { BlurMask, DashPathEffect, Group, Line, LinearGradient, Oval, Path, Rect, RoundedRect, Skia, vec } from '@shopify/react-native-skia';
import type { Booth, PlugId } from '../model/djModel';
import { deviceLive, phonesPlugged, PLUGS } from '../model/djModel';
import type { BoothRender } from '../engine/djRender';
import { PLAYER_REAR } from '../geometry/boothGeometry';
import { MONITOR_H, MONITOR_W, PLATE_W, SPEAKER_H, SPEAKER_W } from '../geometry/gearGeometry';
import { FLAG, FLAG_TEXT, LOOSE_FLAG, FLOOR_Y, MAP, MAP_PLUGS, ROOM_SCALE, TIED, farKindOf, phonesJackPt, routeOf, type SpeakerKey } from '../geometry/mapGeometry';
import { INK } from './ink';
import { CableFlag, CableRun, LaneTies, styleOf, type Run } from './cables';
import { Headphones, PowerSpeaker, PowerStrip, SpeakerPlate, TripodStand } from './gear';
import { MixerRear, PlayerRear } from './RearPanels';
import { Halo } from './parts';
import { SceneText, useLabelMm } from './sceneText';

export { MAP_FRAME, MAP, speakerInput } from '../geometry/mapGeometry';

const F = ROOM_SCALE;
const PLATE_TITLE: Record<SpeakerKey, string> = { paR: 'PA R · INPUT', boothR: 'BOOTH R · INPUT', boothL: 'BOOTH L · INPUT', paL: 'PA L · INPUT' };

/** Where each speaker stands in the room band (its cabinet box, map mm). */
export function roomSpeakerBox(k: SpeakerKey): { x: number; y: number; w: number; h: number } {
  const small = k.startsWith('booth');
  const w = (small ? MONITOR_W : SPEAKER_W) * F;
  const h = (small ? MONITOR_H : SPEAKER_H) * F;
  const cx = MAP.room[k];
  const top = small ? FLOOR_Y - 900 * F - h : 0;
  return { x: cx - w / 2, y: top, w, h };
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

/** The room band: floor, stands, table, speakers — one scale. */
function Room({ booth, last, thump }: { booth: Booth; last: BoothRender | null; thump: readonly SpeakerKey[] }) {
  const T = MAP.room.table;
  const topY = FLOOR_Y - 900 * F;
  const legs = Skia.PathBuilder.Make();
  for (const lx of [T.x + 8, T.x + T.w - 8]) {
    legs.moveTo(lx, topY + 6);
    legs.lineTo(lx, FLOOR_Y);
  }
  const legPath = legs.detach();
  const spkOn = (k: SpeakerKey) => deviceLive(booth, k);
  const sig = (k: SpeakerKey) => !!last && spkOn(k) && (k.startsWith('pa') ? last.rmsDb.crowd : last.rmsDb.booth) > -90;
  const note = useLabelMm(9.5);
  return (
    <Group>
      {/* the room: a dark wall and the floor */}
      <Rect x={-8} y={-8} width={1056} height={FLOOR_Y + 8}>
        <LinearGradient start={vec(0, -8)} end={vec(0, FLOOR_Y)} colors={['#0c0d10', '#131418']} />
      </Rect>
      <Rect x={-8} y={FLOOR_Y} width={1056} height={22}>
        <LinearGradient start={vec(0, FLOOR_Y)} end={vec(0, FLOOR_Y + 22)} colors={['#1b1c20', '#0b0c0e']} />
      </Rect>
      <Line p1={vec(-8, FLOOR_Y)} p2={vec(1048, FLOOR_Y)} color="rgba(255,255,255,0.14)" strokeWidth={1.2} />
      {/* the PA on its stands */}
      {(['paR', 'paL'] as const).map((k) => {
        const b = roomSpeakerBox(k);
        return (
          <Group key={k}>
            <TripodStand x={MAP.room[k]} top={b.y + b.h} s={F} floor={FLOOR_Y} />
            <PowerSpeaker x={b.x} y={b.y} s={F} on={spkOn(k)} signal={sig(k)} pole />
          </Group>
        );
      })}
      {/* the DJ table, the gear on it (rears toward you), the booth monitors */}
      <Path path={legPath} style="stroke" strokeWidth={5} color="#1a1b1f" />
      <RoundedRect x={T.x} y={topY} width={T.w} height={8} r={2}>
        <LinearGradient start={vec(0, topY)} end={vec(0, topY + 8)} colors={['#3a3d43', '#1a1b1f']} />
      </RoundedRect>
      <RoundedRect x={T.x + 4} y={topY + 8} width={T.w - 8} height={24} r={1} color="#121316" />
      <Group transform={[{ translateX: T.x + 40 }, { translateY: topY - PLAYER_REAR.h * F }, { scale: F }]}>
        <PlayerRear x={0} y={0} on={deviceLive(booth, 'playerB')} label="DECK B" />
      </Group>
      <Group transform={[{ translateX: T.x + 40 + 336 * F }, { translateY: topY - 108 * F }, { scale: F }]}>
        <MixerRear x={0} y={0} on={deviceLive(booth, 'mixer')} />
      </Group>
      <Group transform={[{ translateX: T.x + 40 + 622 * F }, { translateY: topY - PLAYER_REAR.h * F }, { scale: F }]}>
        <PlayerRear x={0} y={0} on={deviceLive(booth, 'playerA')} label="DECK A" />
      </Group>
      {(['boothR', 'boothL'] as const).map((k) => {
        const b = roomSpeakerBox(k);
        return <PowerSpeaker key={k} x={b.x} y={b.y} s={F} on={spkOn(k)} small signal={sig(k)} />;
      })}
      {thump.map((k) => {
        const b = roomSpeakerBox(k);
        return (
          <Group key={`th${k}`}>
            <RoundedRect x={b.x - 8} y={b.y - 8} width={b.w + 16} height={b.h + 16} r={10} color="rgba(255,90,72,0.35)">
              <BlurMask blur={8} style="normal" />
            </RoundedRect>
            <RoundedRect x={b.x - 5} y={b.y - 5} width={b.w + 10} height={b.h + 10} r={8} style="stroke" strokeWidth={2.2} color={INK.peak} />
          </Group>
        );
      })}
      <SceneText x={8} y={FLOOR_Y + 15} size={note * 0.86} text="THE ROOM · GEAR AT 15 % SIZE · DISTANCES NOT TO SCALE" color={INK.printDim} face="label" minPt={8.9} />
    </Group>
  );
}

/** The mixer's front edge, at full size, with its headphone jack. */
function MixerFront() {
  const F0 = MAP.front;
  const j = phonesJackPt;
  return (
    <Group>
      <RoundedRect x={F0.x + 2} y={F0.y + 3} width={F0.w} height={F0.h} r={4} color="rgba(0,0,0,0.6)">
        <BlurMask blur={3} style="normal" />
      </RoundedRect>
      <RoundedRect x={F0.x} y={F0.y} width={F0.w} height={F0.h} r={4}>
        <LinearGradient start={vec(0, F0.y)} end={vec(0, F0.y + F0.h)} colors={['#3a3d44', '#1a1b1f', '#0b0c0e']} positions={[0, 0.35, 1]} />
      </RoundedRect>
      <Oval x={j.x - 6} y={j.y - 5} width={12} height={10}>
        <LinearGradient start={vec(j.x - 6, j.y - 5)} end={vec(j.x + 6, j.y + 5)} colors={[INK.metalHi, INK.metalMid, INK.metalLo]} />
      </Oval>
      <Oval x={j.x - 3.4} y={j.y - 2.8} width={6.8} height={5.6} color="#020203" />
      <SceneText x={j.x + 12} y={j.y + 1.4} size={4} text="PHONES" color={INK.printDim} face="label" />
      <SceneText x={F0.x + F0.w - 6} y={j.y + 1.4} size={4} text="MIXER (FRONT)" color={INK.printDim} face="label" align="right" />
    </Group>
  );
}

export const SystemMap = memo(function SystemMap({ booth, last, flow, thump = [] }: { booth: Booth; last: BoothRender | null; flow: boolean; thump?: readonly SpeakerKey[] }) {
  const runs: Run[] = MAP_PLUGS.map((p) => ({
    id: p,
    kind: PLUGS[p].kind,
    colour: PLUG_COLOUR(p),
    pts: routeOf(p, booth.plugs[p]),
    plugged: booth.plugs[p] != null,
    live: liveOf(booth, last, p),
    label: FLAG_TEXT[p] ?? PLUGS[p].short,
    dashed: p.endsWith('R') && PLUGS[p].kind !== 'iec',
    farKind: farKindOf(p),
    noFixedPlug: PLUGS[p].kind === 'phones',
  }));
  const used = Object.entries(booth.plugs)
    .filter(([, j]) => j && j.startsWith('strip.'))
    .map(([, j]) => Number((j as string).slice(6)));
  const spkOn = (k: SpeakerKey) => deviceLive(booth, k);
  const sig = (k: SpeakerKey) => !!last && spkOn(k) && (k.startsWith('pa') ? last.rmsDb.crowd : last.rmsDb.booth) > -90;
  const tiedSpan = (a: PlugId, b: PlugId) => {
    const ra = runs.find((r) => r.id === a)!;
    const rb = runs.find((r) => r.id === b)!;
    if (!ra.plugged || !rb.plugged) return null;
    const ya = ra.pts[1][1];
    const yb = rb.pts[1][1];
    const xa = [ra.pts[1][0], ra.pts[2][0]];
    const xb = [rb.pts[1][0], rb.pts[2][0]];
    const x0 = Math.max(Math.min(...xa), Math.min(...xb));
    const x1 = Math.min(Math.max(...xa), Math.max(...xb));
    return x1 - x0 > 70 ? { x0, x1, y0: ya, y1: yb } : null;
  };
  const note = useLabelMm(9.5);
  return (
    <Group>
      <Room booth={booth} last={last} thump={thump} />
      {/* the patch band: everything you plug, at full size */}
      <Rect x={-8} y={FLOOR_Y + 22} width={1056} height={820}>
        <LinearGradient start={vec(0, FLOOR_Y + 22)} end={vec(0, 840)} colors={['#101114', '#0b0b0d']} />
      </Rect>
      <SceneText x={8} y={FLOOR_Y + 22 + note * 1.1} size={note * 0.86} text="WHAT YOU PLUG · FULL SIZE · SEEN FROM BEHIND" color={INK.printDim} face="label" minPt={8.9} />
      {/* each plate is the back of the speaker above it */}
      {(['paR', 'boothR', 'boothL', 'paL'] as const).map((k) => {
        const rb = roomSpeakerBox(k);
        const pl = MAP.plate[k];
        return (
          <Group key={`lk${k}`}>
            <Line p1={vec(rb.x + rb.w / 2, rb.y + rb.h + (k.startsWith('pa') ? 150 : 2))} p2={vec(pl.x + PLATE_W / 2, pl.y - 2)} color="rgba(255,198,77,0.35)" strokeWidth={0.9}>
              <DashPathEffect intervals={[4, 4]} />
            </Line>
            <SpeakerPlate x={pl.x} y={pl.y} on={spkOn(k)} title={PLATE_TITLE[k]} live={sig(k)} />
            {thump.includes(k) ? <Halo b={{ x: pl.x - 4, y: pl.y - 4, w: PLATE_W + 8, h: 100 }} tone="red" /> : null}
          </Group>
        );
      })}
      <PlayerRear x={MAP.B.x} y={MAP.B.y} on={deviceLive(booth, 'playerB')} label="DECK B (REAR)" />
      <MixerRear x={MAP.mixer.x} y={MAP.mixer.y} on={deviceLive(booth, 'mixer')} />
      <PlayerRear x={MAP.A.x} y={MAP.A.y} on={deviceLive(booth, 'playerA')} label="DECK A (REAR)" />
      <MixerFront />
      <Headphones x={MAP.phones.x} y={MAP.phones.y} s={MAP.phones.s} showPlug={false} />
      <PowerStrip x={MAP.strip.x} y={MAP.strip.y} on used={used} mirrored />
      {runs.map((r) => (
        <CableRun key={r.id} r={r} flow={flow} />
      ))}
      {TIED.map(([a, b]) => {
        const sp = tiedSpan(a, b);
        return sp ? <LaneTies key={`${a}${b}`} {...sp} /> : null;
      })}
      {/* the flags last, over every cable */}
      {runs.map((r) => {
        // a loose end's flag hangs under its plug, a pair's R one lower so the two never touch
        const end = r.pts[r.pts.length - 1];
        const at = r.plugged
          ? FLAG[r.id]
          : LOOSE_FLAG[r.id as PlugId]
            ? LOOSE_FLAG[r.id as PlugId]!
          : r.kind === 'phones'
            ? ([end[0] + 44, end[1] - 6] as [number, number])
            : r.kind === 'iec'
            ? ([end[0] + (r.id === 'ac.mixer' ? 44 : end[0] > 520 ? -34 : 34), end[1] + 14] as [number, number])
            : ([end[0], end[1] + (r.id.endsWith('R') ? 40 : 18)] as [number, number]);
        const st = styleOf(r);
        return at ? <CableFlag key={`f${r.id}`} x={at[0]} y={at[1]} text={r.label} live={r.live} edge={r.kind === 'trs' || r.kind === 'iec' || r.kind === 'phones' ? '#6f757e' : st.colour} /> : null;
      })}
    </Group>
  );
});
