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
      <PlayerBack sc={sc} view={view} arms={{ fretDir: nd.dir, across: nd.across, pluckRot: sc.kind === 'sitar' ? -20 : 25 }} />
      <LuteInstrument sc={sc} view={view} />
      <PlayerHands sc={sc} view={view} fretDir={nd.dir} across={nd.across} pluckRot={sc.kind === 'sitar' ? -20 : 25} />
    </Group>
  );
}

/** Part labels per view (mm of the view's u, v). */
export function luteLabels(sc: LuteScene, view: ViewId): ArtLabel[] {
  const L = (id: string, text: string, p: Pt, align: ArtLabel['align'] = 'center', extra: Partial<ArtLabel> = {}): ArtLabel => ({ id, text, u: p[0], v: p[1], align, ...extra });
  const V = (x: number, y: number, z: number) => vp(sc, view, { x, y, z });
  // A label set clear of the instrument, with a leader back to the part.
  const at = (p: Pt) => ({ lead: { u: p[0], v: p[1] } });
  const head = ep(view, sc.fit.head.c);
  const out: ArtLabel[] = [];
  if (sc.kind === 'oud') {
    const g = sc.oud!;
    if (view === 'side') {
      out.push(L('roseMain', 'MAIN ROSE', [OUD.roseMainX.mm, -OUD.roseMainD.mm / 2 - 26]));
      out.push(L('roseSmall', 'SMALL ROSES', [OUD.roseSmallX.mm, OUD.roseSmallY.mm + 46], 'center', { short: 'ROSES', ...at([OUD.roseSmallX.mm, OUD.roseSmallY.mm]), alts: [{ u: 650, v: 170, align: 'left' }] }));
      // CLASH SWEEP 2026-10-10: the place under the bridge is on the face
      // and everything below the face is the lap's keep-out, so BRIDGE fell
      // to free space and its leader crossed SMALL ROSES'. Both now stack in
      // the clear column right of the fretting arm, BRIDGE (the higher part)
      // on the higher row, so the two leaders never cross.
      out.push(L('bridge', 'BRIDGE', [-6, OUD.bridgeW.mm / 2 + 30], 'center', { ...at([-6, OUD.bridgeW.mm / 2 - 6]), alts: [{ u: 650, v: 112, align: 'left' }] }));
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
      out.push(L('gourd', 'GOURD', V(g.gourd.cx - g.gourd.a - 90, 0, 0), 'center', at(V(g.gourd.cx - g.gourd.a * 0.7, 0, 0))));
      out.push(L('jawari', 'MAIN BRIDGE', V(-10, g.gourd.a + 70, 0), 'left', { short: 'BRIDGE', ...at(V(0, 0, 10)) }));
      out.push(L('sympathetic', 'SYMPATHETIC STRINGS', V(230, g.neck.half + 80, 0), 'left', { short: 'SYMPATHETIC', ...at(V(260, 0, 8)) }));
      out.push(L('frets', 'ARCHED FRETS', V(430, g.neck.half + 80, 0), 'left', { short: 'FRETS', ...at(V(430, 0, 6)) }));
      out.push(L('player', 'PLAYER', [head[0], head[1] - sc.fit.head.r - 24], 'center', { tone: 'muted' }));
    } else {
      out.push(L('gourd', 'GOURD', V(g.gourd.cx - g.gourd.a - 130, 0, -g.gourd.c * 0.5), 'right', at(V(g.gourd.cx - g.gourd.a * 0.7, 0, -g.gourd.c * 0.5))));
      out.push(L('frets', 'ARCHED FRETS', V(520, 0, g.neck.depth + 70), 'center', { short: 'FRETS', ...at(V(520, 0, 6)) }));
      out.push(L('player', 'PLAYER', [head[0], sc.fit.torso.min.z + 30], 'center', { tone: 'muted' }));
      out.push(L('audience', 'AUDIENCE ↓', [700, 600], 'center', { tone: 'muted' }));
    }
    return out;
  }
  const g = sc.veena!;
  if (view === 'side') {
    // Beside the bowl, toward the gourd (under it, the words ran off the floor).
    const res = V(g.bowl.cx, 0, g.bowl.zc - g.bowl.c - 40);
    out.push(L('resonator', 'RESONATOR', [res[0] + 190, res[1] - 120], 'left', at([res[0] + 60, res[1] - 90])));
    out.push(L('frets', 'FRETS ON WAX', V(420, g.neck.half + 60, 70), 'center', { short: 'FRETS', ...at(V(420, 0, 6)) }));
    // CLASH SWEEP 2026-10-10: the place above the gourd is under the neck,
    // so the words fell below it with a leader to an empty spot on the
    // floor. They now name the gourd itself, from beside it.
    const gR = V(g.gourd.x + g.gourd.r + 30, 0, g.gourd.z);
    const gL = V(g.gourd.x - g.gourd.r - 30, 0, g.gourd.z + g.gourd.r * 0.4);
    out.push(L('gourd', 'GOURD (SUPPORT)', V(g.gourd.x, 0, g.gourd.z - g.gourd.r - 40), 'center', { short: 'GOURD', ...at(V(g.gourd.x + g.gourd.r * 0.55, 0, g.gourd.z)), alts: [{ u: gR[0], v: gR[1], align: 'left' }, { u: gL[0], v: gL[1], align: 'right' }] }));
    out.push(L('yali', 'YALI', V(930, g.neck.half + 50, 70), 'center', at(V(930, 0, -40))));
    out.push(L('player', 'PLAYER', [head[0], head[1] - sc.fit.head.r - 24], 'center', { tone: 'muted' }));
  } else {
    out.push(L('plate', 'TOP PLATE', V(g.bowl.cx, -g.plateR - 40, 0), 'center', { short: 'PLATE' }));
    const tala = V(330, g.neck.half, 10);
    out.push(L('tala', 'TALA STRINGS', [tala[0], tala[1] + 160], 'center', { short: 'TALA', ...at(tala) }));
    out.push(L('yali', 'YALI', V(g.tip + 40, 0, 0), 'left', at(V(g.tip - 60, 0, -40))));
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
