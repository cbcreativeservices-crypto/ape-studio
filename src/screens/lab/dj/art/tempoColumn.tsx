/**
 * tempoColumn — Screen 14's gear: deck B's TEMPO COLUMN as a labelled inset
 * beside the plots (visual review 2 #7). The player is the shared drawing
 * (PlayerTop) at its booth place; everything of it but the column is DIMMED
 * behind a solid veil with the column's controls cut out of it, so the jog's
 * rim and the screen's chips no longer crowd the plots. Every column key is
 * named by a callout (QUANTIZE, SYNC, MASTER, TEMPO B, TEMPO RANGE, KEY LOCK,
 * KEY − / +); the only label obstacles are the column's own controls, so the
 * words may use the dimmed part.
 */
import { useMemo, type ReactNode } from 'react';
import { Group, Path, RoundedRect, Skia } from '@shopify/react-native-skia';
import { INK } from './ink';
import { KEY_LOCK_KEYS, PlayerTop, playerPartBox } from './PlayerTop';
import { Scene, type Callout } from './Scene';
import { SceneText } from './sceneText';
import type { BoothMotion } from './motion';
import { BOOTH_LAYOUT, PLAYER, type Box } from '../geometry/boothGeometry';
import type { Booth } from '../model/djModel';

const BX = BOOTH_LAYOUT.B.x;
/** The column and the dimmed room to its left for the words (booth mm). */
export const COLUMN_VIEW: Box = { x: BX + 196, y: 136, w: 130, h: 262 };
const KL = KEY_LOCK_KEYS;
const pad = (b: Box, p: number): Box => ({ x: b.x - p, y: b.y - p, w: b.w + 2 * p, h: b.h + 2 * p });
const at = (b: Box): Box => ({ ...b, x: b.x + BX });

/** The column's controls (booth mm): the veil's holes and the label obstacles. */
export const COLUMN_PARTS: readonly Box[] = [
  at(playerPartBox('quantize')),
  at(playerPartBox('sync')),
  at(playerPartBox('tempo')),
  at({ x: PLAYER.tempoRange.x - 3, y: PLAYER.tempoRange.y - 3, w: PLAYER.tempoRange.w + 6, h: PLAYER.tempoRange.h + 6 }),
  at({ x: KL.lock.x - 3, y: KL.lock.y - 3, w: KL.lock.w + 6, h: KL.lock.h + 6 }),
  at({ x: KL.minus.x - 3, y: KL.minus.y - 3, w: KL.plus.x + KL.plus.w - KL.minus.x + 6, h: KL.minus.h + 6 }),
];

/** The callouts naming every column key, anchored on each key's LEFT edge. */
export function columnCallouts(keyLock: boolean, range: number): Callout[] {
  const P = PLAYER;
  const left = (x: number, y: number) => ({ x: BX + x, y });
  return [
    { id: 'tp', text: 'TEMPO B', at: left(P.tempo.x - 10, P.tempo.top + P.tempo.len * 0.35), dx: -14, dy: 0 },
    { id: 'kl', text: keyLock ? 'KEY LOCK ON' : 'KEY LOCK', at: left(KL.lock.x, KL.lock.y + KL.lock.h / 2), dx: -12, dy: 0, tone: keyLock ? 'blue' : 'plain' },
    { id: 'ks', text: 'KEY − / +', at: left(KL.minus.x, KL.minus.y + KL.minus.h / 2), dx: -12, dy: 6, tone: 'plain' },
    { id: 'tr', text: `TEMPO RANGE ±${range}%`, at: left(P.tempoRange.x + P.tempoRange.w / 2, P.tempoRange.y + P.tempoRange.h), dx: 0, dy: 14, tone: 'plain' },
    { id: 'qz', text: 'QUANTIZE', at: left(P.quantize.x, P.quantize.y + P.quantize.h / 2), dx: -12, dy: 0, tone: 'plain' },
    { id: 'sy', text: 'SYNC', at: left(P.sync.x, P.sync.y + P.sync.h / 2), dx: -12, dy: 0, tone: 'plain' },
    { id: 'ms', text: 'MASTER', at: left(P.masterBtn.x, P.masterBtn.y + P.masterBtn.h / 2), dx: -12, dy: 4, tone: 'plain' },
  ];
}

export function TempoColumnStage({ w, h, booth, motion, plotW, overlay, a11y }: { w: number; h: number; booth: Booth; motion: BoothMotion; plotW: (W: number, k: number) => number; overlay: (W: number, H: number, k: number) => ReactNode; a11y: string }) {
  const B = booth.decks.B;
  const veil = useMemo(() => {
    const p = Skia.PathBuilder.Make();
    const v = pad(COLUMN_VIEW, 400);
    p.addRect(Skia.XYWHRect(v.x, v.y, v.w, v.h));
    for (const b of COLUMN_PARTS) p.addRRect(Skia.RRectXY(Skia.XYWHRect(b.x, b.y, b.w, b.h), 4, 4));
    p.setFillType(1);
    return p.detach();
  }, []);
  const fitOf = (W: number, H: number, k: number) => ({ x: plotW(W, k), y: 0, w: W - plotW(W, k), h: H });
  const callouts = useMemo(() => columnCallouts(!!B.keyLock, B.tempoRange ?? 8), [B.keyLock, B.tempoRange]);
  const f = fitOf(w, h, 1);
  return (
    <Scene
      w={w}
      h={h}
      frame={COLUMN_VIEW}
      motion={motion}
      fit={f}
      // FULL SCREEN's shape: the plots and the column side by side
      aspect={1.12}
      callouts={callouts}
      obstacles={COLUMN_PARTS}
      screenOverlay={(W, H, _xf, k) => overlay(W, H, k)}
      a11y={a11y}
    >
      {/* the table under the player, then the player itself */}
      <RoundedRect x={COLUMN_VIEW.x - 400} y={COLUMN_VIEW.y - 400} width={COLUMN_VIEW.w + 800} height={COLUMN_VIEW.h + 800} r={0} color="#121316" />
      <PlayerTop x={BX} y={BOOTH_LAYOUT.B.y} deck="B" d={B} highlight={['tempo']} />
      {/* the veil: the player dimmed except its tempo column */}
      <Path path={veil} color="rgba(10,11,13,0.72)" />
      <Group>
        {COLUMN_PARTS.map((b, i) => (
          <RoundedRect key={i} x={b.x} y={b.y} width={b.w} height={b.h} r={4} style="stroke" strokeWidth={0.6} color="rgba(255,255,255,0.10)" />
        ))}
      </Group>
      <SceneText x={COLUMN_VIEW.x + 4} y={COLUMN_VIEW.y + 9} size={8.5} text="DECK B · TEMPO COLUMN" color={INK.amber} face="label" />
    </Scene>
  );
}
