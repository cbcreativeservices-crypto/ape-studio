/**
 * SystemMap — the whole first system, as you would wire it (Screen 4), seen
 * from BEHIND the booth (geometry/mapGeometry: mirrored, deck B on the left).
 * TWO BANDS, each at ONE stated scale and set apart (overnight fix
 * 2026-10-19, grades screen 4):
 *
 *   ROOM   1:5 — the floor, the PA speakers on tripod stands (cabinets
 *          1.4 m up), the 0.9 m DJ table with the booth monitors, the three
 *          units (rears to you) and the headphones; distances shortened.
 *   PATCH  1:1 — everything you plug: each speaker's input plate, the rear
 *          panels of deck B, the mixer and deck A, the mixer's front edge with
 *          the headphone jack (the headphone cable runs on up to the
 *          headphones in the room, so it starts at a break mark), the power
 *          strip — and EVERY cable, each in its own lane, DRESSED
 *          (geometry/dressGeometry: bend radii, catenary sag where it hangs).
 *
 * The AUDIO is the picture: the audio runs are drawn over the power, glow
 * blue while the last render says audio flows down them. Mains cords are
 * secondary: thinner, darker, ribbed, flat-dressed, no glow (a fine amber
 * thread while powered). Each speaker shows signal only from ITS OWN feed
 * (speakerLit): its cabinet glows blue and its plate's light turns green.
 *
 * Every word on the patch band (cable flags, device names) is placed by one
 * pass that keeps them off the gear, off each other and off other cables, at
 * whatever zoom (placeLabels).
 */
import { memo, useContext, useMemo } from 'react';
import { BlurMask, Group, Line, LinearGradient, Oval, Path, Rect, RoundedRect, Skia, vec } from '@shopify/react-native-skia';
import type { Booth, PlugId } from '../model/djModel';
import { deviceLive, phonesPlugged, PLUGS } from '../model/djModel';
import type { BoothRender } from '../engine/djRender';
import { MIXER_REAR, PLAYER_REAR, type Box } from '../geometry/boothGeometry';
import { PLATE_H, PLATE_W } from '../geometry/gearGeometry';
import { FLAG, FLAG_TEXT, MAP, MAP_BODIES, MAP_PLUGS, PLUG_R, TIED, farKindOf, fixedEnd, fixedKindOf, jackPt, phonesJackPt, type SpeakerKey } from '../geometry/mapGeometry';
import { PATCH_DY, PHONES_BREAK, ROOM4, ROOM_F, ROOM_FLOOR, lane4, roomPhonesBox, roomSpeakerBox4, roomTableTop, run4, speakerLit, type P2 } from '../geometry/dressGeometry';
import { INK } from './ink';
import { CableFlag, CableRun, LaneTies, styleOf, type Run } from './cables';
import { Headphones, PowerSpeaker, PowerStrip, SpeakerPlate, TripodStand } from './gear';
import { MixerRear, PlayerRear } from './RearPanels';
import { Halo } from './parts';
import { SceneFontsContext, SceneText, useLabelMm } from './sceneText';
import { textWidthPt } from './Scene';

export { MAP, speakerInput } from '../geometry/mapGeometry';
export { BUILD_FRAME as MAP_FRAME, PATCH_DY, patchBox, patchPt } from '../geometry/dressGeometry';

/** The floor strip under the room; the patch band starts right under it. */
const FLOOR_H = 10;
const PATCH_TOP = ROOM_FLOOR + FLOOR_H - PATCH_DY;

const PLATE_TITLE: Record<SpeakerKey, string> = { paR: 'PA R · INPUT', boothR: 'BOOTH R · INPUT', boothL: 'BOOTH L · INPUT', paL: 'PA L · INPUT' };

/** Where each speaker stands in the room band (its cabinet box, map mm). */
export const roomSpeakerBox = roomSpeakerBox4;

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

/* ── the room band (1:5) ──────────────────────────────────────────────── */

function Room({ booth, last, thump }: { booth: Booth; last: BoothRender | null; thump: readonly SpeakerKey[] }) {
  const F = ROOM_F;
  const T = ROOM4.table;
  const topY = roomTableTop;
  const legs = useMemo(() => {
    const p = Skia.PathBuilder.Make();
    for (const lx of [T.x + 10, T.x + T.w - 10]) {
      p.moveTo(lx, topY + 6);
      p.lineTo(lx, ROOM_FLOOR);
    }
    return p.detach();
  }, [T.x, T.w, topY]);
  const spkOn = (k: SpeakerKey) => deviceLive(booth, k);
  const lit = (k: SpeakerKey) => speakerLit(booth, last, k);
  const note = useLabelMm(9.5);
  const glow = (k: SpeakerKey) => {
    const b = roomSpeakerBox4(k);
    return (
      <RoundedRect key={`g${k}`} x={b.x - 5} y={b.y - 5} width={b.w + 10} height={b.h + 10} r={8} color={INK.blue} opacity={0.42}>
        <BlurMask blur={7} style="normal" />
      </RoundedRect>
    );
  };
  return (
    <Group>
      {/* the room: a dark wall and the floor */}
      <Rect x={-8} y={-8} width={1056} height={ROOM_FLOOR + 8}>
        <LinearGradient start={vec(0, -8)} end={vec(0, ROOM_FLOOR)} colors={['#0c0d10', '#15161a']} />
      </Rect>
      <Rect x={-8} y={ROOM_FLOOR} width={1056} height={FLOOR_H}>
        <LinearGradient start={vec(0, ROOM_FLOOR)} end={vec(0, ROOM_FLOOR + FLOOR_H)} colors={['#1d1e22', '#0d0e10']} />
      </Rect>
      <Line p1={vec(-8, ROOM_FLOOR)} p2={vec(1048, ROOM_FLOOR)} color="rgba(255,255,255,0.16)" strokeWidth={1.2} />
      {/* the PA on its stands */}
      {(['paR', 'paL'] as const).map((k) => {
        const b = roomSpeakerBox4(k);
        return (
          <Group key={k}>
            <TripodStand x={ROOM4.cx[k]} top={b.y + b.h} s={F} floor={ROOM_FLOOR} />
            {lit(k) ? glow(k) : null}
            <PowerSpeaker x={b.x} y={b.y} s={F} on={spkOn(k)} signal={lit(k)} pole />
          </Group>
        );
      })}
      {/* the DJ table, the gear on it (rears toward you), the booth monitors */}
      <Path path={legs} style="stroke" strokeWidth={6} color="#1d1e23" />
      <RoundedRect x={T.x} y={topY} width={T.w} height={7} r={2}>
        <LinearGradient start={vec(0, topY)} end={vec(0, topY + 7)} colors={['#45484f', '#1a1b1f']} />
      </RoundedRect>
      <RoundedRect x={T.x + 4} y={topY + 7} width={T.w - 8} height={22} r={1} color="#121316" />
      <Group transform={[{ translateX: ROOM4.deckB }, { translateY: topY - PLAYER_REAR.h * F }, { scale: F }]}>
        <PlayerRear x={0} y={0} on={deviceLive(booth, 'playerB')} label="DECK B" />
      </Group>
      <Group transform={[{ translateX: ROOM4.mixer }, { translateY: topY - MIXER_REAR.h * F }, { scale: F }]}>
        <MixerRear x={0} y={0} on={deviceLive(booth, 'mixer')} />
      </Group>
      <Group transform={[{ translateX: ROOM4.deckA }, { translateY: topY - PLAYER_REAR.h * F }, { scale: F }]}>
        <PlayerRear x={0} y={0} on={deviceLive(booth, 'playerA')} label="DECK A" />
      </Group>
      <Headphones x={roomPhonesBox.x} y={roomPhonesBox.y} s={F} showPlug={false} />
      {(['boothR', 'boothL'] as const).map((k) => {
        const b = roomSpeakerBox4(k);
        return (
          <Group key={k}>
            {lit(k) ? glow(k) : null}
            <PowerSpeaker x={b.x} y={b.y} s={F} on={spkOn(k)} small signal={lit(k)} />
          </Group>
        );
      })}
      {thump.map((k) => {
        const b = roomSpeakerBox4(k);
        return (
          <Group key={`th${k}`}>
            <RoundedRect x={b.x - 8} y={b.y - 8} width={b.w + 16} height={b.h + 16} r={10} color="rgba(255,90,72,0.35)">
              <BlurMask blur={8} style="normal" />
            </RoundedRect>
            <RoundedRect x={b.x - 5} y={b.y - 5} width={b.w + 10} height={b.h + 10} r={8} style="stroke" strokeWidth={2.2} color={INK.peak} />
          </Group>
        );
      })}
      <SceneText x={520} y={4 + note * 0.95} size={note} text="THE ROOM · 1:5 · DISTANCES SHORTENED" color={INK.amber} face="label" align="center" />
    </Group>
  );
}

/* ── the patch band (1:1) ─────────────────────────────────────────────── */

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

/** Where the headphone cable runs on, out of the band, up to the headphones
 *  in the room: the drafting break mark (two short strokes across it). */
function CableBreak() {
  const { x, y } = PHONES_BREAK;
  return (
    <Group>
      {[-3.2, 3.2].map((d) => (
        <Line key={d} p1={vec(x + d - 3, y + 6)} p2={vec(x + d + 3, y - 6)} color="#c9cdd3" strokeWidth={1.1} strokeCap="round" />
      ))}
    </Group>
  );
}

/* ── the words on the patch band ──────────────────────────────────────── */

type LabelItem =
  | { kind: 'flag'; id: PlugId; text: string; live: boolean; edge: string; along: readonly P2[]; prefer: P2 }
  | { kind: 'name'; id: string; text: string; box: Box };
type Placed = { id: string; kind: 'flag' | 'name'; text: string; x: number; y: number; w: number; h: number; live?: boolean; edge?: string; leader?: { x0: number; y0: number; x1: number; y1: number } };

const overlap = (a: Box, b: Box) => Math.max(0, Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x)) * Math.max(0, Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y));

/**
 * Place the patch band's words (patch mm): each name beside its device, each
 * cable's flag ON its own cable, none on gear, a plug, another word or
 * another cable where it can be helped. Greedy, in the order given. `s` is
 * the scene's pt per mm, `k` the words' zoom growth.
 */
export function placeLabels(items: readonly LabelItem[], bodies: readonly Box[], plugs: readonly { x: number; y: number; r: number }[], cables: readonly { id: string; pts: readonly P2[] }[], s: number, k: number, band: Box): Placed[] {
  const out: Placed[] = [];
  const samples = cables.map((c) => {
    const pts: P2[] = [];
    for (let i = 1; i < c.pts.length; i++) {
      const [x0, y0] = c.pts[i - 1];
      const [x1, y1] = c.pts[i];
      const n = Math.max(1, Math.ceil(Math.hypot(x1 - x0, y1 - y0) / 6));
      for (let j = 0; j < n; j++) pts.push([x0 + ((x1 - x0) * j) / n, y0 + ((y1 - y0) * j) / n]);
    }
    return { id: c.id, pts };
  });
  const cost = (r: Box, own: string | null) => {
    let c = 0;
    if (r.x < band.x || r.y < band.y || r.x + r.w > band.x + band.w || r.y + r.h > band.y + band.h) c += 5000;
    for (const b of bodies) c += (overlap(r, b) / (r.w * r.h)) * 4000;
    for (const p of plugs) c += (overlap(r, { x: p.x - p.r, y: p.y - p.r, w: p.r * 2, h: p.r * 2 }) / (r.w * r.h)) * 6000;
    for (const q of out) c += overlap(r, { x: q.x - 1.5 / s, y: q.y - 1.5 / s, w: q.w + 3 / s, h: q.h + 3 / s }) > 0 ? 9000 : 0;
    for (const cs of samples) {
      if (cs.id === own) continue;
      let n = 0;
      for (const [x, y] of cs.pts) if (x > r.x && x < r.x + r.w && y > r.y && y < r.y + r.h) n++;
      c += n * 60;
    }
    return c;
  };
  for (const it of items) {
    if (it.kind === 'flag') {
      const pt = (9.5 * k) / s;
      const w = (textWidthPt(it.text, k) * 0.92 + 8 * k) / s;
      const h = pt * 1.32;
      let best: { c: number; x: number; y: number } | null = null;
      const pts = it.along;
      for (let i = 0; i < pts.length; i++) {
        const [cx, cy] = pts[i];
        const r = { x: cx - w / 2, y: cy - h / 2, w, h };
        const c = cost(r, it.id) + Math.hypot(cx - it.prefer[0], cy - it.prefer[1]) * 0.6;
        if (!best || c < best.c) best = { c, x: cx, y: cy };
      }
      if (best) out.push({ id: it.id, kind: 'flag', text: it.text, x: best.x - w / 2, y: best.y - h / 2, w, h, live: it.live, edge: it.edge });
    } else {
      const fs = (10 * k) / s;
      const w = (textWidthPt(it.text, k) + 8 * k) / s;
      const h = fs * 1.45;
      const b = it.box;
      const cands: { x: number; y: number; ax: number; ay: number }[] = [];
      for (const d of [2, 8, 16, 28, 44, 64].map((v) => v / s)) {
        for (const f of [0.15, 0.5, 0.85]) {
          const cx = b.x + b.w * f;
          cands.push({ x: cx - w / 2, y: b.y - d - h, ax: cx, ay: b.y });
          cands.push({ x: cx - w / 2, y: b.y + b.h + d, ax: cx, ay: b.y + b.h });
          const cy = b.y + b.h * f;
          cands.push({ x: b.x - d - w, y: cy - h / 2, ax: b.x, ay: cy });
          cands.push({ x: b.x + b.w + d, y: cy - h / 2, ax: b.x + b.w, ay: cy });
        }
      }
      let best: { c: number; x: number; y: number; ax: number; ay: number } | null = null;
      for (const cd of cands) {
        const r = { x: cd.x, y: cd.y, w, h };
        const lx = Math.max(r.x, Math.min(r.x + r.w, cd.ax));
        const ly = Math.max(r.y, Math.min(r.y + r.h, cd.ay));
        const c = cost(r, null) + Math.hypot(lx - cd.ax, ly - cd.ay) * s * 0.8;
        if (!best || c < best.c) best = { c, ...cd };
      }
      if (best) {
        const r = { x: best.x, y: best.y, w, h };
        const lx = Math.max(r.x, Math.min(r.x + r.w, best.ax));
        const ly = Math.max(r.y, Math.min(r.y + r.h, best.ay));
        const long = Math.hypot(lx - best.ax, ly - best.ay) * s > 6;
        out.push({ id: it.id, kind: 'name', text: it.text, ...r, leader: long ? { x0: best.ax, y0: best.ay, x1: lx, y1: ly } : undefined });
      }
    }
  }
  return out;
}

function NameTag({ p }: { p: Placed }) {
  const { s, textScale } = useContext(SceneFontsContext);
  const fs = (10 * textScale) / s;
  return (
    <Group>
      {p.leader ? (
        <Group>
          <Line p1={vec(p.leader.x0, p.leader.y0)} p2={vec(p.leader.x1, p.leader.y1)} color="rgba(0,0,0,0.6)" strokeWidth={2.4 / s} />
          <Line p1={vec(p.leader.x0, p.leader.y0)} p2={vec(p.leader.x1, p.leader.y1)} color="rgba(255,198,77,0.75)" strokeWidth={1 / s} />
        </Group>
      ) : null}
      <RoundedRect x={p.x} y={p.y} width={p.w} height={p.h} r={4 / s} color="rgba(8,8,10,0.82)" />
      <SceneText x={p.x + p.w / 2} y={p.y + p.h / 2 + fs * 0.36} size={fs} text={p.text} color={INK.amber} face="label" align="center" />
    </Group>
  );
}

/**
 * `flagFor`: which cables carry their label flag (default: every flag).
 * Screen 4 shows every audio flag once it is plugged, the cable being
 * patched, the one just patched and any in the wrong place; FULL SCREEN
 * shows them all.
 */
export const SystemMap = memo(function SystemMap({ booth, last, flow, thump = [], flagFor }: { booth: Booth; last: BoothRender | null; flow: boolean; thump?: readonly SpeakerKey[]; flagFor?: (p: PlugId) => boolean }) {
  const { s, textScale } = useContext(SceneFontsContext);
  const plugsKey = MAP_PLUGS.map((p) => booth.plugs[p] ?? '-').join('|');
  const geo = useMemo(() => {
    const dense: Partial<Record<PlugId, P2[]>> = {};
    for (const p of MAP_PLUGS) if (booth.plugs[p] != null || PLUGS[p].kind === 'phones') dense[p] = booth.plugs[p] != null ? run4(p, booth.plugs) : lane4(p, null);
    return dense;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [plugsKey]);
  const runs: Run[] = MAP_PLUGS.map((p) => {
    const plugged = booth.plugs[p] != null;
    return {
      id: p,
      kind: PLUGS[p].kind,
      colour: PLUG_COLOUR(p),
      pts: lane4(p, booth.plugs[p] ?? null),
      dense: plugged ? geo[p] : undefined,
      plugged,
      live: liveOf(booth, last, p),
      label: FLAG_TEXT[p] ?? PLUGS[p].short,
      dashed: p.endsWith('R') && PLUGS[p].kind !== 'iec',
      farKind: farKindOf(p),
      noFixedPlug: PLUGS[p].kind === 'phones',
      quiet: PLUGS[p].kind === 'iec',
    };
  });
  const used = Object.entries(booth.plugs)
    .filter(([, j]) => j && j.startsWith('strip.'))
    .map(([, j]) => Number((j as string).slice(6)));
  const spkOn = (k: SpeakerKey) => deviceLive(booth, k);
  const lit = (k: SpeakerKey) => speakerLit(booth, last, k);
  // ties ride the pair's shared sag
  const ties = TIED.map(([a, b]) => {
    const ra = runs.find((r) => r.id === a)!;
    const rb = runs.find((r) => r.id === b)!;
    if (!ra.plugged || !rb.plugged) return null;
    const ya = ra.pts[1][1];
    const yb = rb.pts[1][1];
    const x0 = Math.max(Math.min(ra.pts[1][0], ra.pts[2][0]), Math.min(rb.pts[1][0], rb.pts[2][0]));
    const x1 = Math.min(Math.max(ra.pts[1][0], ra.pts[2][0]), Math.max(rb.pts[1][0], rb.pts[2][0]));
    if (x1 - x0 <= 70) return null;
    const da = geo[a]!;
    const sagAt = (x: number) => {
      // the dressed run's drop below its lane at x
      let best = da[0];
      for (const p of da) if (Math.abs(p[0] - x) < Math.abs(best[0] - x) && Math.abs(p[1] - ya) < 30) best = p;
      return best[1] - ya;
    };
    return { key: `${a}${b}`, x0, x1, y0: ya, y1: yb, sag: sagAt };
  });
  const note = useLabelMm(9.5);
  // the words, placed once per wiring and zoom
  const flagsShown = MAP_PLUGS.filter((p) => !flagFor || flagFor(p));
  const shownKey = flagsShown.join(',');
  const liveKey = runs.map((r) => (r.live ? 1 : 0)).join('');
  const placed = useMemo(() => {
    const plugs: { x: number; y: number; r: number }[] = [];
    for (const p of MAP_PLUGS) {
      const a = fixedEnd(p);
      if (a && PLUGS[p].kind !== 'phones') plugs.push({ x: a.x, y: a.y, r: PLUG_R[fixedKindOf(p)] + 1 });
      const to = booth.plugs[p];
      if (to) {
        const b = jackPt(to);
        plugs.push({ x: b.x, y: b.y, r: PLUG_R[farKindOf(p)] + 1 });
      }
    }
    const bodies: Box[] = [...MAP_BODIES, MAP.front];
    const cables = runs.map((r) => ({ id: r.id, pts: (r.dense ?? r.pts) as P2[] }));
    const order = [...flagsShown].sort((a, b) => (PLUGS[a].kind === 'iec' ? 1 : 0) - (PLUGS[b].kind === 'iec' ? 1 : 0));
    const items: LabelItem[] = [
      { kind: 'name', id: 'db', text: 'DECK B', box: MAP_BODIES[0] },
      { kind: 'name', id: 'mx', text: 'MIXER', box: MAP_BODIES[1] },
      { kind: 'name', id: 'da', text: 'DECK A', box: MAP_BODIES[2] },
      { kind: 'name', id: 'st', text: 'POWER STRIP', box: MAP_BODIES[3] },
      { kind: 'name', id: 'hp', text: 'TO THE HEADPHONES', box: { x: PHONES_BREAK.x - 6, y: PHONES_BREAK.y - 7, w: 12, h: 14 } },
      ...order.map((p): LabelItem => {
        const r = runs.find((x) => x.id === p)!;
        const st = styleOf(r);
        const along = (r.dense ?? r.pts) as P2[];
        // candidates: points along the run, away from its plugs
        const a0 = along[0];
        const a1 = along[along.length - 1];
        const cands: P2[] = [];
        for (let i = 1; i < along.length; i++) {
          const [x0, y0] = along[i - 1];
          const [x1, y1] = along[i];
          const n = Math.max(1, Math.ceil(Math.hypot(x1 - x0, y1 - y0) / 8));
          for (let j = 0; j < n; j++) {
            const q: P2 = [x0 + ((x1 - x0) * j) / n, y0 + ((y1 - y0) * j) / n];
            if (Math.hypot(q[0] - a0[0], q[1] - a0[1]) > 14 && Math.hypot(q[0] - a1[0], q[1] - a1[1]) > 14) cands.push(q);
          }
        }
        if (cands.length === 0) cands.push(a1);
        const pref = (r.plugged ? FLAG[p] : null) ?? cands[Math.floor(cands.length / 2)];
        return { kind: 'flag', id: p, text: r.label, live: r.live, edge: r.kind === 'trs' || r.kind === 'iec' || r.kind === 'phones' ? '#6f757e' : st.colour, along: cands, prefer: pref as P2 };
      }),
    ];
    return placeLabels(items, bodies, plugs, cables, Math.max(1e-6, s), textScale, { x: 0, y: PATCH_TOP + 2, w: 1040, h: 828 - PATCH_TOP });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [plugsKey, shownKey, liveKey, s, textScale]);
  return (
    <Group>
      <Room booth={booth} last={last} thump={thump} />
      <Group transform={[{ translateY: PATCH_DY }]}>
        {/* the patch band: everything you plug, at full size — set apart */}
        <Rect x={-8} y={PATCH_TOP} width={1056} height={900}>
          <LinearGradient start={vec(0, PATCH_TOP)} end={vec(0, 840)} colors={['#111216', '#0b0b0d']} />
        </Rect>
        <Line p1={vec(-8, PATCH_TOP)} p2={vec(1048, PATCH_TOP)} color="rgba(255,198,77,0.45)" strokeWidth={1.4} />
        <SceneText x={-2} y={PATCH_TOP + 4 + note * 0.95} size={note} text="WHAT YOU PLUG · 1:1 (FULL SIZE) · SEEN FROM BEHIND" color={INK.amber} face="label" />
        {(['paR', 'boothR', 'boothL', 'paL'] as const).map((k) => {
          const pl = MAP.plate[k];
          return (
            <Group key={`pl${k}`}>
              <SpeakerPlate x={pl.x} y={pl.y} on={spkOn(k)} title={PLATE_TITLE[k]} live={lit(k)} />
              {thump.includes(k) ? <Halo b={{ x: pl.x - 4, y: pl.y - 4, w: PLATE_W + 8, h: PLATE_H + 8 }} tone="red" /> : null}
            </Group>
          );
        })}
        <PlayerRear x={MAP.B.x} y={MAP.B.y} on={deviceLive(booth, 'playerB')} label="DECK B (REAR)" />
        <MixerRear x={MAP.mixer.x} y={MAP.mixer.y} on={deviceLive(booth, 'mixer')} />
        <PlayerRear x={MAP.A.x} y={MAP.A.y} on={deviceLive(booth, 'playerA')} label="DECK A (REAR)" />
        <MixerFront />
        <PowerStrip x={MAP.strip.x} y={MAP.strip.y} on used={used} mirrored />
        {/* power first, underneath; then the audio the lesson is about */}
        {runs
          .filter((r) => r.quiet)
          .map((r) => (
            <CableRun key={r.id} r={r} flow={false} />
          ))}
        {runs
          .filter((r) => !r.quiet)
          .map((r) => (
            <CableRun key={r.id} r={r} flow={flow} />
          ))}
        <CableBreak />
        {ties.map((t) => (t ? <LaneTies key={t.key} x0={t.x0} x1={t.x1} y0={t.y0} y1={t.y1} sag={t.sag} /> : null))}
        {/* the words last, over every cable */}
        {placed.map((p) =>
          p.kind === 'flag' ? <CableFlag key={`f${p.id}`} x={p.x + p.w / 2} y={p.y + p.h / 2} text={p.text} live={!!p.live} edge={p.edge ?? '#6f757e'} /> : <NameTag key={`n${p.id}`} p={p} />,
        )}
      </Group>
    </Group>
  );
});
