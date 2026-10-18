/**
 * BoothStage — the booth table drawn on the Rack glass through a CAMERA VIEW
 * (geometry/boothGeometry.VIEWS): the whole table, the mixer, its upper or
 * lower half, one deck, or the two jogs. Built on Scene (one canvas, one
 * transform, aligned callouts at every size).
 *
 * ACCESSIBILITY: the canvas carries a label and a plain-words summary of the
 * booth's live state (charter §8: every teaching canvas).
 */
import type { ReactNode } from 'react';
import { LinearGradient, RoundedRect, vec } from '@shopify/react-native-skia';
import type { Booth } from '../model/djModel';
import { BOOTH_D, BOOTH_LAYOUT, BOOTH_W, MIXER_D, MIXER_W, PLAYER_D, PLAYER_W, VIEWS, type Box, type ViewName } from '../geometry/boothGeometry';
import { MixerTop, type MixerPart } from './MixerTop';
import { PlayerTop, type PlayerPart } from './PlayerTop';
import type { BoothMotion } from './motion';
import { Scene, type Callout } from './Scene';

export type { Callout };

export type BoothStageSpec = {
  view: ViewName | Box;
  highlight?: { mixer?: readonly MixerPart[]; A?: readonly PlayerPart[]; B?: readonly PlayerPart[] };
  callouts?: readonly Callout[];
  /** Extra Skia drawn in booth mm, above the devices. */
  overlay?: ReactNode;
  /** Extra Skia in SCREEN points, above everything (plots, panels). */
  screenOverlay?: (w: number, h: number, xf: { s: number; ox: number; oy: number }) => ReactNode;
  /** What the drawing shows, for a screen reader. */
  a11y: string;
  syncLit?: { A?: boolean; B?: boolean };
  /** Fit the view into this part of the glass (see Scene `fit`), given the glass size. */
  fit?: (w: number, h: number) => { x: number; y: number; w: number; h: number };
};

const intersects = (a: Box, b: Box) => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;

/** The live state, in words (the canvas's accessibility value). */
export function boothSummary(b: Booth): string {
  const deck = (id: 'A' | 'B') => {
    const d = b.decks[id];
    return d.track ? `Deck ${id} ${d.playing ? 'playing' : 'paused'}, tempo ${d.pitch >= 0 ? 'plus' : 'minus'} ${Math.abs(d.pitch).toFixed(1)} percent` : `Deck ${id} empty`;
  };
  const ch = (c: 1 | 2) => `channel ${c} fader ${Math.round(b.ch[c].fader * 100)} percent${b.ch[c].cue ? ', cued' : ''}`;
  return `${deck('A')}. ${deck('B')}. ${ch(1)}; ${ch(2)}; crossfader ${Math.round(b.mixer.xf * 100)} percent toward B. Listening as ${b.perspective.toLowerCase()}.`;
}

export function BoothStage({ w, h, booth, spec, motion }: { w: number; h: number; booth: Booth; spec: BoothStageSpec; motion: BoothMotion }) {
  const view = typeof spec.view === 'string' ? VIEWS[spec.view] : spec.view;
  const show = {
    A: intersects(view, { x: BOOTH_LAYOUT.A.x, y: BOOTH_LAYOUT.A.y, w: PLAYER_W, h: PLAYER_D }),
    mixer: intersects(view, { x: BOOTH_LAYOUT.mixer.x, y: BOOTH_LAYOUT.mixer.y, w: MIXER_W, h: MIXER_D }),
    B: intersects(view, { x: BOOTH_LAYOUT.B.x, y: BOOTH_LAYOUT.B.y, w: PLAYER_W, h: PLAYER_D }),
  };
  return (
    <Scene w={w} h={h} frame={view} motion={motion} callouts={spec.callouts} screenOverlay={spec.screenOverlay} fit={spec.fit?.(w, h)} a11y={`${spec.a11y} ${boothSummary(booth)}`}>
      {/* the booth table */}
      <RoundedRect x={-40} y={-30} width={BOOTH_W + 80} height={BOOTH_D + 70} r={18}>
        <LinearGradient start={vec(0, -30)} end={vec(0, BOOTH_D + 40)} colors={['#141519', '#0e0f12']} />
      </RoundedRect>
      {show.A ? <PlayerTop x={BOOTH_LAYOUT.A.x} y={BOOTH_LAYOUT.A.y} deck="A" d={booth.decks.A} highlight={spec.highlight?.A} syncLit={spec.syncLit?.A} /> : null}
      {show.mixer ? <MixerTop x={BOOTH_LAYOUT.mixer.x} y={BOOTH_LAYOUT.mixer.y} booth={booth} highlight={spec.highlight?.mixer} /> : null}
      {show.B ? <PlayerTop x={BOOTH_LAYOUT.B.x} y={BOOTH_LAYOUT.B.y} deck="B" d={booth.decks.B} highlight={spec.highlight?.B} syncLit={spec.syncLit?.B} /> : null}
      {spec.overlay}
    </Scene>
  );
}
