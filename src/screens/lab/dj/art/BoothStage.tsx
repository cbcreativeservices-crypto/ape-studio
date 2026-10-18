/**
 * BoothStage — the booth table drawn on the Rack glass through a CAMERA VIEW
 * (geometry/boothGeometry.VIEWS): the whole table, the mixer, its upper or
 * lower half, one deck, or the two jogs. Built on Scene (one canvas, one
 * transform, aligned labels at every size). Every control on the devices in
 * view is handed to the label layout as an obstacle, so no label sits on a
 * knob, a key or a fader.
 *
 * INSETS (Screen 10): further views of the same booth, drawn in their own
 * framed panels on the glass (deck A's tempo column, the mixer's lower half)
 * beside the main view — the same devices, the same state, the same clock.
 * In FULL SCREEN a stage may swap to its `fullView` (a frame that fits both
 * decks whole) and drop the insets.
 *
 * ACCESSIBILITY: the canvas carries a label and a plain-words summary of the
 * booth's live state (charter §8: every teaching canvas).
 */
import { useContext, useMemo, type ReactNode } from 'react';
import { Group, LinearGradient, Rect, RoundedRect, Skia, vec } from '@shopify/react-native-skia';
import { StageInFullScreen, useStageTextScale } from '../../rack/stageAspect';
import type { Booth } from '../model/djModel';
import { BOOTH_D, BOOTH_LAYOUT, MIXER_D, MIXER_W, PLAYER_D, PLAYER_W, VIEWS, fitView, type Box, type ViewName } from '../geometry/boothGeometry';
import { MIXER_PARTS, MixerTop, mixerPartBox, type MixerPart } from './MixerTop';
import { PLAYER_PARTS, PlayerTop, playerPartBox, type PlayerPart } from './PlayerTop';
import { INK } from './ink';
import type { BoothMotion } from './motion';
import { Scene, type Callout, type Xf } from './Scene';
import { SceneFontsProvider, SceneText } from './sceneText';

export type { Callout };

export type BoothInset = {
  /** The booth region to show (booth mm). */
  frame: Box;
  /** Where on the glass (points), given the glass size and text scale. */
  at: (w: number, h: number, k: number) => { x: number; y: number; w: number; h: number };
  label: string;
};

export type BoothStageSpec = {
  view: ViewName | Box;
  /** The frame FULL SCREEN shows instead (and without the insets). */
  fullView?: ViewName | Box;
  highlight?: { mixer?: readonly MixerPart[]; A?: readonly PlayerPart[]; B?: readonly PlayerPart[] };
  callouts?: readonly Callout[];
  /** Extra Skia drawn in booth mm, above the devices. */
  overlay?: ReactNode;
  /** Extra Skia in SCREEN points, above everything (plots, panels). */
  screenOverlay?: (w: number, h: number, xf: Xf, k: number) => ReactNode;
  /** What the drawing shows, for a screen reader. */
  a11y: string;
  syncLit?: { A?: boolean; B?: boolean };
  /** A deck's pads flash (a sampler pad on that deck just fired). */
  padFlash?: { A?: boolean; B?: boolean };
  /** Fit the view into this part of the glass (see Scene `fit`), given the
   *  glass size and the full-screen text scale. */
  fit?: (w: number, h: number, k: number) => { x: number; y: number; w: number; h: number };
  insets?: readonly BoothInset[];
  /** The fit FULL SCREEN uses with `fullView` (default: the whole glass). */
  fullFit?: (w: number, h: number, k: number) => { x: number; y: number; w: number; h: number };
  /** The whole composition's width ÷ height for FULL SCREEN (a stage whose
   *  fit is not a plot, e.g. the booth over its listening strip). */
  aspect?: number;
  /** Labels may use the glass outside `fit` (it holds no plot). */
  labelsOutsideFit?: boolean;
  /** Extra label obstacles (booth mm). */
  obstacles?: readonly Box[];
};

const intersects = (a: Box, b: Box) => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
const shift = (b: Box, o: { x: number; y: number }): Box => ({ x: b.x + o.x, y: b.y + o.y, w: b.w, h: b.h });

/** Every control of the booth, in booth mm (the label layout's obstacles). */
export const BOOTH_OBSTACLES: readonly Box[] = [
  ...MIXER_PARTS.filter((p) => p !== 'meters').map((p) => shift(mixerPartBox(p), BOOTH_LAYOUT.mixer)),
  shift(mixerPartBox('meters'), BOOTH_LAYOUT.mixer),
  ...(['A', 'B'] as const).flatMap((d) => PLAYER_PARTS.map((p) => shift(playerPartBox(p), BOOTH_LAYOUT[d]))),
];
export const BOOTH_BODIES: readonly Box[] = [
  { x: BOOTH_LAYOUT.A.x, y: BOOTH_LAYOUT.A.y, w: PLAYER_W, h: PLAYER_D },
  { x: BOOTH_LAYOUT.mixer.x, y: BOOTH_LAYOUT.mixer.y, w: MIXER_W, h: MIXER_D },
  { x: BOOTH_LAYOUT.B.x, y: BOOTH_LAYOUT.B.y, w: PLAYER_W, h: PLAYER_D },
];

/** The live state, in words (the canvas's accessibility value). */
export function boothSummary(b: Booth): string {
  const deck = (id: 'A' | 'B') => {
    const d = b.decks[id];
    return d.track ? `Deck ${id} ${d.playing ? 'playing' : 'paused'}, tempo ${d.pitch >= 0 ? 'plus' : 'minus'} ${Math.abs(d.pitch).toFixed(1)} percent` : `Deck ${id} empty`;
  };
  const ch = (c: 1 | 2) => `channel ${c} fader ${Math.round(b.ch[c].fader * 100)} percent${b.ch[c].cue ? ', cued' : ''}`;
  return `${deck('A')}. ${deck('B')}. ${ch(1)}; ${ch(2)}; crossfader ${Math.round(b.mixer.xf * 100)} percent toward B. Listening as ${b.perspective.toLowerCase()}.`;
}

/** The devices of the booth that a frame shows. */
function Devices({ booth, spec, view }: { booth: Booth; spec: BoothStageSpec; view: Box }) {
  const show = {
    A: intersects(view, { x: BOOTH_LAYOUT.A.x, y: BOOTH_LAYOUT.A.y, w: PLAYER_W, h: PLAYER_D }),
    mixer: intersects(view, { x: BOOTH_LAYOUT.mixer.x, y: BOOTH_LAYOUT.mixer.y, w: MIXER_W, h: MIXER_D }),
    B: intersects(view, { x: BOOTH_LAYOUT.B.x, y: BOOTH_LAYOUT.B.y, w: PLAYER_W, h: PLAYER_D }),
  };
  return (
    <Group>
      {/* the booth table: a matte top running past every edge of the glass,
          its front edge with a lit bevel, and the dark booth front below */}
      <Rect x={-2000} y={-2000} width={5000} height={2000 + BOOTH_D + 44}>
        <LinearGradient start={vec(0, -200)} end={vec(0, BOOTH_D + 44)} colors={['#0f1013', '#17181c', '#121316']} positions={[0, 0.7, 1]} />
      </Rect>
      <Rect x={-2000} y={BOOTH_D + 44} width={5000} height={3} color="rgba(255,255,255,0.10)" />
      <Rect x={-2000} y={BOOTH_D + 47} width={5000} height={2000}>
        <LinearGradient start={vec(0, BOOTH_D + 47)} end={vec(0, BOOTH_D + 160)} colors={['#0a0a0c', '#050506']} />
      </Rect>
      {show.A ? <PlayerTop x={BOOTH_LAYOUT.A.x} y={BOOTH_LAYOUT.A.y} deck="A" d={booth.decks.A} highlight={spec.highlight?.A} syncLit={spec.syncLit?.A} padFlash={spec.padFlash?.A} /> : null}
      {show.mixer ? <MixerTop x={BOOTH_LAYOUT.mixer.x} y={BOOTH_LAYOUT.mixer.y} booth={booth} highlight={spec.highlight?.mixer} /> : null}
      {show.B ? <PlayerTop x={BOOTH_LAYOUT.B.x} y={BOOTH_LAYOUT.B.y} deck="B" d={booth.decks.B} highlight={spec.highlight?.B} syncLit={spec.syncLit?.B} padFlash={spec.padFlash?.B} /> : null}
    </Group>
  );
}

export function BoothStage({ w, h, booth, spec, motion }: { w: number; h: number; booth: Booth; spec: BoothStageSpec; motion: BoothMotion }) {
  const full = useContext(StageInFullScreen);
  const k = useStageTextScale();
  const useFull = full && !!spec.fullView;
  const v = useFull ? spec.fullView! : spec.view;
  const view = typeof v === 'string' ? VIEWS[v] : v;
  const insets = useFull ? [] : spec.insets ?? [];
  const obstacles = useMemo(() => [...BOOTH_OBSTACLES.filter((b) => intersects(b, view)), ...(spec.obstacles ?? [])], [view, spec.obstacles]);
  const fit = useFull ? spec.fullFit?.(w, h, k) : spec.fit?.(w, h, k);
  const screenOverlay = (W: number, H: number, xf: Xf, kk: number) => (
    <Group>
      {insets.map((ins) => (
        <InsetPanel key={ins.label} ins={ins} W={W} H={H} k={kk} booth={booth} spec={spec} />
      ))}
      {spec.screenOverlay?.(W, H, xf, kk)}
    </Group>
  );
  return (
    <Scene
      w={w}
      h={h}
      frame={view}
      motion={motion}
      callouts={spec.callouts}
      obstacles={obstacles}
      soft={BOOTH_BODIES}
      screenOverlay={screenOverlay}
      fit={fit}
      labelsOutsideFit={spec.labelsOutsideFit}
      aspect={spec.aspect ?? (fit ? false : undefined)}
      a11y={`${spec.a11y} ${boothSummary(booth)}`}
    >
      <Devices booth={booth} spec={spec} view={view} />
      {spec.overlay}
    </Scene>
  );
}

/** One inset: a framed, labelled window onto another part of the booth. */
function InsetPanel({ ins, W, H, k, booth, spec }: { ins: BoothInset; W: number; H: number; k: number; booth: Booth; spec: BoothStageSpec }) {
  const r = ins.at(W, H, k);
  const head = 15 * k;
  const body = { x: r.x, y: r.y + head, w: r.w, h: r.h - head };
  const f = fitView(ins.frame, body.w, body.h, 2);
  const s = f.s;
  return (
    <Group>
      <RoundedRect x={r.x} y={r.y} width={r.w} height={r.h} r={6} color="#0b0c0f" />
      <Group clip={Skia.RRectXY(Skia.XYWHRect(body.x, body.y, body.w, body.h), 4, 4)}>
        <SceneFontsProvider s={s} textScale={k}>
          <Group transform={[{ translateX: body.x + f.ox }, { translateY: body.y + f.oy }, { scale: s }]}>
            <Devices booth={booth} spec={spec} view={ins.frame} />
          </Group>
        </SceneFontsProvider>
      </Group>
      <RoundedRect x={r.x + 0.5} y={r.y + 0.5} width={r.w - 1} height={r.h - 1} r={6} style="stroke" strokeWidth={1} color="rgba(255,198,77,0.45)" />
      <SceneText x={r.x + r.w / 2} y={r.y + 11 * k} size={9.5 * k} text={ins.label} color={INK.amber} face="label" align="center" minPt={9} />
    </Group>
  );
}
