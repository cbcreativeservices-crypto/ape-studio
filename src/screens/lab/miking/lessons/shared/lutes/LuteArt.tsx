/**
 * THE SHARED LUTE FAMILY — the lesson art the engine draws with (charter §2
 * layer 3): the player and the instrument in each view, the part labels and
 * the hit areas, all from the same scene (luteModel.ts).
 *
 *   front (the engine's side view): the floor, the player behind, the
 *         instrument, the player's forearms and hands over it.
 *   above (the engine's top view):  the player behind, the instrument, the
 *         forearms.
 */
import { Group } from '@shopify/react-native-skia';
import type { VariantId, ViewId } from '../../../engine/model/types.ts';
import type { ArtLabel, LessonArt } from '../../../engine/scene/sceneTypes.ts';
import type { BuiltLute, LuteScene } from './luteModel.ts';
import { OUD, SITAR, VEENA } from './luteSpec.ts';
import { ep, hitAreas, vp, type Pt } from './luteDraw';
import { FloorLine, PlayerBack, PlayerHands } from './lutePlayers';
import { OudAbove, OudFront, oudHits } from './oudArt';
import { SitarAbove, SitarFront, sitarHits } from './sitarArt';
import { VeenaAbove, VeenaFront, veenaHits } from './veenaArt';

/** The instrument alone in a view (the sound page, the plan). */
export function LuteInstrument({ sc, view, dim = 1 }: { sc: LuteScene; view: ViewId; dim?: number }) {
  if (sc.kind === 'oud') return view === 'side' ? <OudFront sc={sc} dim={dim} /> : <OudAbove sc={sc} dim={dim} />;
  if (sc.kind === 'sitar') return view === 'side' ? <SitarFront sc={sc} dim={dim} /> : <SitarAbove sc={sc} dim={dim} />;
  return view === 'side' ? <VeenaFront sc={sc} dim={dim} /> : <VeenaAbove sc={sc} dim={dim} />;
}

/** The neck's direction and width in a view, for the fretting fingers. */
function neckDir(sc: LuteScene, view: ViewId): { dir: Pt; across: number } {
  const a = vp(sc, view, { x: 0, y: 0, z: 0 });
  const b = vp(sc, view, { x: 100, y: 0, z: 0 });
  const across = sc.kind === 'oud' ? 52 : sc.kind === 'sitar' ? SITAR.neckW.mm : VEENA.neckW.mm;
  return { dir: [b[0] - a[0], b[1] - a[1]], across: view === 'side' && sc.kind === 'veena' ? 34 : across };
}

export function LuteSceneArt({ sc, view }: { sc: LuteScene; view: ViewId }) {
  const nd = neckDir(sc, view);
  return (
    <Group>
      {view === 'side' ? <FloorLine y={sc.floorY} u0={-1400} u1={1900} rug={sc.fit.seat === 'floor'} /> : null}
      <PlayerBack sc={sc} view={view} />
      <LuteInstrument sc={sc} view={view} />
      <PlayerHands sc={sc} view={view} fretDir={nd.dir} across={nd.across} pluckRot={sc.kind === 'sitar' ? -20 : 25} />
    </Group>
  );
}

/** Part labels per view (mm of the view's u, v). */
export function luteLabels(sc: LuteScene, view: ViewId): ArtLabel[] {
  const L = (id: string, text: string, p: Pt, align: ArtLabel['align'] = 'center', extra: Partial<ArtLabel> = {}): ArtLabel => ({ id, text, u: p[0], v: p[1], align, ...extra });
  const V = (x: number, y: number, z: number) => vp(sc, view, { x, y, z });
  const head = ep(view, sc.fit.head.c);
  const out: ArtLabel[] = [];
  if (sc.kind === 'oud') {
    const g = sc.oud!;
    if (view === 'side') {
      out.push(L('roseMain', 'MAIN ROSE', [OUD.roseMainX.mm, -OUD.roseMainD.mm / 2 - 26]));
      out.push(L('roseSmall', 'SMALL ROSES', [OUD.roseSmallX.mm, OUD.roseSmallY.mm + 46], 'center', { short: 'ROSES' }));
      out.push(L('bridge', 'BRIDGE', [-6, OUD.bridgeW.mm / 2 + 30]));
      out.push(L('board', 'FRETLESS NECK', [(g.joint + g.nut) / 2, -g.boardHalf(g.joint) - 26], 'center', { short: 'NECK' }));
      out.push(L('pegbox', 'PEGBOX', [g.pegboxEnd.x + 10, -96]));
      out.push(L('player', 'PLAYER', [head[0], head[1] - sc.fit.head.r - 24], 'center', { tone: 'muted' }));
    } else {
      out.push(L('face', 'FACE', [g.tail + 20, 26], 'left'));
      out.push(L('bowl', 'BOWL', [g.widest - 40, -OUD.bowlDepth.mm * 0.55]));
      out.push(L('pegbox', 'PEGBOX', [g.pegboxEnd.x + 60, g.pegboxEnd.z - 10], 'left'));
      out.push(L('player', 'PLAYER', [head[0], sc.fit.torso.min.z + 30], 'center', { tone: 'muted' }));
      out.push(L('audience', 'AUDIENCE ↓', [g.nut + 40, 560], 'center', { tone: 'muted' }));
    }
    return out;
  }
  if (sc.kind === 'sitar') {
    const g = sc.sitar!;
    if (view === 'side') {
      out.push(L('gourd', 'GOURD', V(g.gourd.cx - 60, g.gourd.a + 30, 0), 'center'));
      out.push(L('jawari', 'MAIN BRIDGE', V(-10, 70, 0), 'left', { short: 'BRIDGE' }));
      out.push(L('sympathetic', 'SYMPATHETIC STRINGS', V(250, -g.neck.half - 110, 0), 'right', { short: 'SYMPATHETIC' }));
      out.push(L('frets', 'ARCHED FRETS', V(430, g.neck.half + 80, 0), 'left', { short: 'FRETS' }));
      out.push(L('player', 'PLAYER', [head[0], head[1] - sc.fit.head.r - 24], 'center', { tone: 'muted' }));
    } else {
      out.push(L('gourd', 'GOURD', V(g.gourd.cx, 0, -g.gourd.c - 60), 'center'));
      out.push(L('frets', 'ARCHED FRETS', V(520, 0, 60), 'center', { short: 'FRETS' }));
      out.push(L('player', 'PLAYER', [head[0], sc.fit.torso.min.z + 30], 'center', { tone: 'muted' }));
      out.push(L('audience', 'AUDIENCE ↓', [700, 600], 'center', { tone: 'muted' }));
    }
    return out;
  }
  const g = sc.veena!;
  if (view === 'side') {
    out.push(L('resonator', 'RESONATOR', V(g.bowl.cx, 0, g.bowl.zc - g.bowl.c - 40), 'center'));
    out.push(L('frets', 'FRETS ON WAX', V(420, g.neck.half, 70), 'center', { short: 'FRETS' }));
    out.push(L('gourd', 'GOURD (SUPPORT)', V(g.gourd.x, 0, g.gourd.z - g.gourd.r - 40), 'center', { short: 'GOURD' }));
    out.push(L('yali', 'YALI', V(930, 0, 70), 'center'));
    out.push(L('player', 'PLAYER', [head[0], head[1] - sc.fit.head.r - 24], 'center', { tone: 'muted' }));
  } else {
    out.push(L('plate', 'TOP PLATE', V(g.bowl.cx, -g.plateR - 40, 0), 'center', { short: 'PLATE' }));
    out.push(L('tala', 'TALA STRINGS', V(330, g.neck.half + 120, 0), 'center', { short: 'TALA' }));
    out.push(L('yali', 'YALI', V(905, 0, 40), 'center'));
    out.push(L('player', 'PLAYER', [head[0], sc.fit.torso.min.z + 30], 'center', { tone: 'muted' }));
    out.push(L('audience', 'AUDIENCE ↓', [900, 640], 'center', { tone: 'muted' }));
  }
  return out;
}

export function luteHit(sc: LuteScene, view: ViewId, u: number, v: number, tol: number): string | null {
  const areas = sc.kind === 'oud' ? oudHits(sc, view) : sc.kind === 'sitar' ? sitarHits(sc, view) : veenaHits(sc, view);
  return hitAreas(areas, u, v, tol);
}

export function makeLuteArt(built: BuiltLute): Pick<LessonArt, 'Instrument' | 'labels' | 'hitTest'> {
  const sc = built.scene;
  return {
    Instrument: ({ view }: { view: ViewId; variant: VariantId }) => <LuteSceneArt sc={sc} view={view} />,
    labels: (view) => luteLabels(sc, view),
    hitTest: (view, _v, u, vv, tol) => luteHit(sc, view, u, vv, tol),
  };
}
