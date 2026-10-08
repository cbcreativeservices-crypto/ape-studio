/**
 * THE HEAD FIX (owner-approved 2026-10-08) — ratchet.
 *
 * Owner rule: "The head icons are only to be used when a head is alone. They
 * are not to be used when attached to a body." Lone heads (a listener, a
 * talker, a plan marker) draw the owner's line-art icons — SIDE (profile) and
 * ABOVE — from ONE shared module; a head on a body is the figure's own
 * skin-silhouette head (PlayerFigure FigureHead, or its px/SVG wrappers),
 * never the icon and never a circle. Crowds may be seating without people,
 * never circle "heads".
 *
 * Pins: the shared module and its geometry, the lone-head sites importing it,
 * the body sites drawing the figure head and no longer their circle/ellipse
 * heads. Lists only SHRINK if a site is deleted; never re-add a circle head.
 */
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { describe, it } from 'node:test';
import {
  ABOVE_CANON,
  HEAD_ABOVE_SVG,
  HEAD_SIDE_SVG,
  SIDE_CANON,
  aboveRotation,
  appendHeadIcon,
  svgPathSink,
  type PathSink,
} from '../src/features/lab/headIconGeometry.ts';

const read = (p: string) => readFileSync(p, 'utf8');
/** Source without comments, so a comment can't satisfy or break a pin. */
const code = (p: string) => read(p).replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/[^\n]*/g, '$1');

/** All the points a builder writes (end points and control points). */
function points(build: (p: PathSink) => void): [number, number][] {
  const out: [number, number][] = [];
  build({
    moveTo: (x, y) => out.push([x, y]),
    lineTo: (x, y) => out.push([x, y]),
    cubicTo: (a, b, c, d, x, y) => out.push([a, b], [c, d], [x, y]),
    close: () => undefined,
  });
  return out;
}

describe('head fix 2026-10-08 — one shared head-icon module', () => {
  it('the shared modules exist: pure geometry, a Skia renderer, an SVG renderer, and the figure head for bodies', () => {
    for (const f of [
      'src/features/lab/headIconGeometry.ts',
      'src/features/lab/headIcons.tsx',
      'src/features/lab/headIconsSvg.tsx',
      'src/features/lab/figureHead.tsx',
      'src/features/lab/figureHeadSvg.tsx',
    ]) assert.ok(existsSync(f), f);
    // The geometry module is renderer-free, so SVG screens stay Skia-free.
    const g = code('src/features/lab/headIconGeometry.ts');
    assert.doesNotMatch(g, /from '@shopify\/react-native-skia'|from 'react-native-svg'/);
    assert.doesNotMatch(code('src/features/lab/headIconsSvg.tsx'), /react-native-skia/);
    assert.doesNotMatch(code('src/features/lab/figureHeadSvg.tsx'), /react-native-skia/);
    // The figure head wraps PlayerFigure's own head (one look for every body).
    assert.match(code('src/features/lab/figureHead.tsx'), /headFront|headProfile/);
    assert.match(code('src/features/lab/figureHead.tsx'), /<FigureHead fill=\{fill\} \/>/);
  });

  it('the SIDE icon is the owner canon moved verbatim (origin = mouth, facing left)', () => {
    assert.ok(HEAD_SIDE_SVG.lines.startsWith('M16.8 -0.6C16.6 6.4 15 10 12 11.4'), HEAD_SIDE_SVG.lines.slice(0, 40));
    assert.equal(SIDE_CANON.height, 45.6);
    const pts = points((p) => appendHeadIcon(p, null, 'side', 0, 0, SIDE_CANON.height, { facing: 'left' }));
    const xs = pts.map((q) => q[0]);
    const ys = pts.map((q) => q[1]);
    assert.ok(Math.min(...xs) < -11 && Math.max(...xs) > 32, 'nose tip −11.3 … occiput +32.5');
    assert.ok(Math.min(...ys) < -35 && Math.max(...ys) > 20, 'crown −35.1 … neck base +20.9');
    // Facing right mirrors it: the nose goes to +x.
    const r = points((p) => appendHeadIcon(p, null, 'side', 0, 0, SIDE_CANON.height, { facing: 'right' }));
    assert.ok(Math.max(...r.map((q) => q[0])) > 11 && Math.min(...r.map((q) => q[0])) < -32);
  });

  it('the ABOVE icon is symmetric, crown→chin 100, and turns to face the way the person faces', () => {
    assert.ok(HEAD_ABOVE_SVG.lines.length > 200 && HEAD_ABOVE_SVG.plate.startsWith('M'));
    const pts = points((p) => appendHeadIcon(p, null, 'above', 0, 0, ABOVE_CANON.height));
    const ys = pts.map((q) => q[1]);
    assert.ok(Math.min(...ys) <= -49.9 && Math.max(...ys) >= 49, 'crown −50 … chin +50');
    const xs = pts.map((q) => q[0]);
    assert.ok(Math.abs(Math.min(...xs) + Math.max(...xs)) < 0.5, 'symmetric about the centre line');
    // Canon faces +y (down the screen); aboveRotation(1, 0) faces +x.
    assert.ok(Math.abs(aboveRotation(0, 1)) < 1e-9);
    const east = points((p) => appendHeadIcon(p, null, 'above', 0, 0, 100, { rotation: aboveRotation(1, 0) }));
    assert.ok(Math.max(...east.map((q) => q[0])) >= 49 && Math.min(...east.map((q) => q[0])) <= -49.9);
    // No eyes: the above art has brows, nose and mouth only — a closed shell,
    // two ears, two brows, one nose, one mouth = 7 subpaths.
    assert.equal((HEAD_ABOVE_SVG.lines.match(/M/g) ?? []).length, 7);
    const sink = svgPathSink();
    sink.moveTo(0, 0);
    sink.lineTo(1, 1);
    assert.equal(sink.d(), 'M0 0L1 1');
  });

  it('micspeaker/viz draws its profile head through the shared module (no second copy)', () => {
    const v = code('src/screens/lab/micspeaker/viz.tsx');
    assert.match(v, /from '\.\.\/\.\.\/\.\.\/features\/lab\/headIcons'/);
    assert.match(v, /<HeadIcon\s+view="side"/);
    for (const gone of ['function appendProfileOutline', 'function buildProfileHead', 'function buildFrontHead', 'function FrontHead', 'function appendBust', 'function LineBusts'])
      assert.ok(!v.includes(gone), gone);
  });
});

/** Lone heads → the owner's icon (Skia HeadIcon / SVG HeadIconSvg / glyph). */
const LONE: [string, RegExp][] = [
  ['src/screens/lab/micspeaker/viz.tsx', /<HeadIcon key=\{px\} view="above"[\s\S]*appendHeadIcon\(seats, seatPlates, 'side'/],
  ['src/screens/lab/wave/vizWave.tsx', /<HeadIcon view="above"[\s\S]*<HeadIcon view="side"/],
  ['src/screens/lab/BinauralLabScreen.tsx', /<HeadIconSvg view="above"/],
  ['src/screens/lab/roomdesign/RoomPlanView.tsx', /<HeadIconSvg view="above"/],
  ['src/screens/lab/soundsystems/art/gearArt.tsx', /<HeadIconSvg view="above"/],
  ['src/screens/lab/mastering/stages.tsx', /<HeadIconSvg view="above" x=\{cx\} y=\{listY\}[^>]*rotation=\{Math\.PI\}/],
  ['src/screens/lab/soundsystems/art/diagrams.tsx', /<HeadIconSvg view="above"[\s\S]*<HeadIconSvg view="above"/],
  ['src/screens/startHere/SignalPathArt.tsx', /<HeadIconSvg view="side" facing="right" speaking[\s\S]*<HeadIconSvg view="side" facing="left"/],
  ['src/screens/startHere/pages.tsx', /<HeadGlyph view="side"/],
  ['src/screens/lab/cableinstall/scenes/floorArt.tsx', /<HeadIconSvg view="above"/],
  ['src/screens/lab/speech/speechPagesB.tsx', /<HeadIconSvg view="side" facing="right" speaking/],
  ['src/screens/lab/miking/lessons/shared/brass/BrassSoundArt.tsx', /<HeadIcon view="above"/],
  ['src/screens/lab/miking/lessons/shared/lowbrass/LowBrassSoundArt.tsx', /<HeadIcon view="above"/],
  ['src/screens/lab/miking/lessons/shared/speakers/StagePlan.tsx', /makeHeadIconPaths\('above'/],
  ['src/screens/lab/miking/lessons/shared/speakers/BacklinePlan.tsx', /makeHeadIconPaths\('above'/],
  ['src/screens/lab/miking/lessons/shared/keys/KeysPlan.tsx', /makeHeadIconPaths\('above'/],
  ['src/screens/lab/miking/lessons/shared/hand/HandPlan.tsx', /makeHeadIconPaths\(\s*'above'[\s\S]*makeHeadIconPaths\(\s*'above'/],
];

/** Bodies → the figure's own head (FigureHead / FigureHeadAt / FigureHeadSvg / PlayerHead). */
const BODY: [string, RegExp][] = [
  ['src/screens/lab/micspeaker/viz.tsx', /<FigureHeadAt view="front"/],
  ['src/screens/lab/wave/vizWave.tsx', /<FigureHeadAt view="front"/],
  ['src/screens/lab/roomdesign/RoomSideView.tsx', /<FigureHeadSvg view="side"/],
  ['src/screens/lab/eq/modules/CameraAnalogy.tsx', /<FigureHeadSvg view="front"/],
  ['src/screens/lab/foundations/viz.tsx', /<FigureHeadAt view="front"/],
  ['src/screens/lab/cableinstall/svgArt.tsx', /<FigureHeadSvg view="front"/],
  ['src/screens/lab/miking/lessons/shared/metal/metalArt.tsx', /<FigureHead fill=\{headFill\(view\)\} \/>/],
  ['src/screens/lab/miking/lessons/shared/mallets/MalletArt.tsx', /<FigureHead fill=\{playerHeadFill\('front'\)\} \/>[\s\S]*<FigureHead fill=\{playerHeadFill\('above'\)\} \/>/],
  ['src/screens/lab/miking/lessons/shared/keys/KeysArt.tsx', /<FigureHead fill=\{g\.head\} \/>/],
  ['src/screens/lab/miking/lessons/shared/smallperc/Player.tsx', /<FigureHead fill=\{g\.head\} \/>[\s\S]*<FigureHead fill=\{g\.head\} \/>/],
  ['src/screens/lab/miking/lessons/i02Cajon/art.tsx', /<FigureHead fill=\{fill\} \/>[\s\S]*<FigureHead fill=\{g\.head\} \/>/],
  ['src/screens/lab/miking/lessons/c12Clavinet/art.tsx', /<FigureHead fill=\{o\.head\} \/>/],
  ['src/screens/lab/miking/lessons/shared/sax/SaxArt.tsx', /return headProfile\(pt\(/],
  ['src/screens/lab/miking/lessons/shared/freereed/PlayerProfile.tsx', /<FigureHead fill=\{b\.head\.fill\} \/>/],
  ['src/screens/lab/miking/lessons/shared/lowbrass/LowBrassArt.tsx', /<FigureHead key="head" fill=\{headFill\} \/>/],
  ['src/screens/lab/miking/lessons/shared/speakers/StagePlan.tsx', /<FigureHead fill=\{b\.head\} \/>/],
  ['src/screens/lab/miking/lessons/shared/speakers/BacklinePlan.tsx', /<FigureHead fill=\{g\.headTop\} \/>/],
  ['src/screens/lab/miking/lessons/shared/keys/KeysPlan.tsx', /<FigureHead fill=\{g\.headTop\} \/>/],
  ['src/screens/lab/miking/lessons/shared/brass/BrassSettingPage.tsx', /<FigureHead fill=\{p\.head\} \/>/],
  ['src/screens/lab/miking/lessons/shared/strings/PStagePlan.tsx', /<FigureHead fill=\{p\.head\} \/>/],
  ['src/screens/lab/miking/lessons/shared/handdrums/HandPlan.tsx', /<FigureHead fill=\{getPlayerHeadTop\(\)\} \/>/],
];

/** The old circle / ellipse heads (and stand-in heads), each gone for good. */
const GONE: [string, RegExp][] = [
  ['src/screens/lab/micspeaker/viz.tsx', /body\.addCircle\(0, -42\.5 \* s/],
  ['src/screens/lab/micspeaker/viz.tsx', /dots\.addCircle\(/],
  ['src/screens/lab/wave/vizWave.tsx', /p\.addCircle\(hx, hy, 0\.12 \* u\)/],
  ['src/screens/lab/wave/vizWave.tsx', /heads\.addCircle\(/],
  ['src/screens/lab/wave/vizWave.tsx', /lines\.addCircle\(0, -8\.4, 4\.8\)/],
  ['src/screens/lab/BinauralLabScreen.tsx', /<Circle cx=\{c\} cy=\{c\} r=\{13\}/],
  ['src/screens/lab/roomdesign/RoomPlanView.tsx', /fill=\{HEAD_PLATE\}/],
  ['src/screens/lab/roomdesign/RoomSideView.tsx', /fill=\{HEAD_PLATE\}/],
  ['src/screens/lab/eq/modules/CameraAnalogy.tsx', /<Circle cx=\{160\} cy=\{58\} r=\{7\}/],
  ['src/screens/lab/foundations/viz.tsx', /p\.addCircle\(px, fy - 41/],
  ['src/screens/lab/cableinstall/svgArt.tsx', /<Ellipse cx=\{x\} cy=\{Y\(163\)\}/],
  ['src/screens/lab/cableinstall/scenes/floorArt.tsx', /<Circle cx=\{x\} cy=\{y - 0\.2\} r=\{3\}/],
  ['src/screens/lab/soundsystems/art/diagrams.tsx', /<Circle cx=\{perf\.x\} cy=\{perf\.y\}/],
  ['src/screens/lab/mastering/stages.tsx', /kind="listener" id="room-ear"/],
  ['src/screens/lab/miking/lessons/shared/metal/metalArt.tsx', /p\.addCircle\(/],
  ['src/screens/lab/miking/lessons/i06bFingerCymbals/art.tsx', /p\.addCircle\(30, -1660/],
  ['src/screens/lab/miking/lessons/shared/mallets/MalletArt.tsx', /<Circle cx=\{b\.player\.head\./],
  ['src/screens/lab/miking/lessons/shared/keys/KeysArt.tsx', /player\.addCircle\(/],
  ['src/screens/lab/miking/lessons/shared/smallperc/Player.tsx', /head: oval\(/],
  ['src/screens/lab/miking/lessons/i02Cajon/art.tsx', /head: oval\(/],
  ['src/screens/lab/miking/lessons/c12Clavinet/art.tsx', /o\.head\.addCircle\(/],
  ['src/screens/lab/miking/lessons/shared/sax/SaxArt.tsx', /P\(-6, -116\), P\(42, -108\)/],
  ['src/screens/lab/miking/lessons/shared/freereed/PlayerProfile.tsx', /function headProfile\(/],
  ['src/screens/lab/miking/lessons/shared/lowbrass/LowBrassArt.tsx', /circ\(hc, r, 28\)/],
  ['src/screens/lab/miking/lessons/shared/speakers/StagePlan.tsx', /head\.addCircle\(|heads\.addCircle\(/],
  ['src/screens/lab/miking/lessons/shared/speakers/BacklinePlan.tsx', /headTop\.addCircle\(|heads\.addCircle\(/],
  ['src/screens/lab/miking/lessons/shared/keys/KeysPlan.tsx', /headTop\.addCircle\(|heads\.addCircle\(/],
  ['src/screens/lab/miking/lessons/shared/brass/BrassSettingPage.tsx', /head\.addCircle\(|hair\.addCircle\(/],
  ['src/screens/lab/miking/lessons/shared/brass/BrassSoundArt.tsx', /addCircle\(head\.x/],
  ['src/screens/lab/miking/lessons/shared/strings/PStagePlan.tsx', /o\.head\.addOval\(/],
  ['src/screens/lab/miking/lessons/shared/hand/HandPlan.tsx', /band\.addCircle\(|audience\.addCircle\(/],
  ['src/screens/lab/miking/lessons/shared/handdrums/HandPlan.tsx', /<Circle cx=\{t\.u \+ 10\} cy=\{t\.v\} r=\{92\}/],
  ['src/screens/lab/miking/lessons/shared/lowbrass/LowBrassSoundArt.tsx', /ear\.addCircle\(/],
  ['src/screens/lab/miking/lessons/shared/sports/VenueArt.tsx', /heads\.addCircle\(/],
  ['src/screens/lab/miking/lessons/m12Tonbak/art.tsx', /person\.addCircle\(|headP\.addCircle\(/],
  ['src/screens/lab/miking/lessons/shared/piano/PianoArt.tsx', /o\.head = oval\(|o\.hair = /],
  ['src/screens/lab/miking/lessons/c10Harp/art.tsx', /o\.head\.addOval\(|o\.hair = /],
];

describe('head fix 2026-10-08 — every site on the right head', () => {
  it('lone heads draw the owner icon from the shared module', () => {
    for (const [f, re] of LONE) {
      const s = code(f);
      assert.match(s, /features\/lab\/headIcons(Svg)?'/, `${f} imports the shared icon module`);
      assert.match(s, re, f);
    }
  });
  it('heads on bodies draw the figure head, never the icon', () => {
    for (const [f, re] of BODY) {
      const s = code(f);
      assert.match(s, re, f);
    }
    // A body file never imports the line-art icon (StagePlan / BacklinePlan /
    // KeysPlan / HandPlan / micspeaker / wave legitimately carry both: their
    // lone audience icons and a figure on a body).
    const both = new Set(LONE.map(([f]) => f));
    for (const [f] of BODY) if (!both.has(f)) assert.doesNotMatch(code(f), /features\/lab\/headIcons/, `${f} must not use the line-art icon on a body`);
  });
  it('the old circle / ellipse / stand-in heads are gone', () => {
    for (const [f, re] of GONE) assert.doesNotMatch(code(f), re, f);
  });
  it('a standalone head glyph decides its accessibility (a11y ratchet)', () => {
    const s = read('src/features/lab/headIconsSvg.tsx');
    assert.match(s, /<Svg[\s\S]*?accessibilityElementsHidden=\{!label\}[\s\S]*?importantForAccessibility=\{label \? 'auto' : 'no-hide-descendants'\}/);
  });
});
