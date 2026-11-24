/**
 * FIGURE V2 — "ELSEWHERE" (waves 6 and 7 of must-do D78, 2026-11-24): the
 * figures outside Miking, the plan players, the voice cut-away's outline.
 *   • the roles: YOU and the guide in Game Audio, Speaker Coverage's band;
 *   • the screens outside Miking that drew the old figure draw the cast;
 *   • the band from above: the hands where the old plan player's were (the
 *     fretting fist on the neck, the picking hand over the strings), the
 *     approved fist from above (authoredHands 'backTop'), arms of real length;
 *   • the cut-away: the outline is the cast member's approved side head, and
 *     every part of the section still lies inside it, where it was.
 * Reads normalise CRLF.
 */
import './_mikingTsxLoader.ts';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';

const R = <T>(m: T): T => (m as { default?: T }).default ?? m;
const read = (p: string) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8').replace(/\r\n/g, '\n');
const LAB = 'src/screens/lab';
const FV = `${LAB}/miking/lessons/shared/figureV2`;

const CAST = R(await import('../src/screens/lab/miking/lessons/shared/figureV2/cast.ts'));
const PV = R(await import('../src/screens/lab/miking/lessons/shared/figureV2/personV2.tsx'));
const ET = R(await import('../src/screens/lab/miking/lessons/shared/figureV2/elsewhereTop.tsx'));
const EB = R(await import('../src/screens/lab/miking/lessons/shared/figureV2/elsewhereBand.ts'));
const GE = R(await import('../src/screens/lab/miking/lessons/shared/figureV2/geom.ts'));
const VP = R(await import('../src/screens/lab/miking/lessons/shared/voice/voicePose.ts'));
const VC = R(await import('../src/screens/lab/miking/lessons/shared/voice/VoiceCutaway.tsx'));

type Pt = { u: number; v: number };
const P = (u: number, v: number): Pt => ({ u, v });

describe('figure V2 elsewhere — the roles', () => {
  it('YOU, the guide and the band are fixed cast members (never random)', () => {
    assert.equal(CAST.castFor('ga.you').id, 'kofi');
    assert.equal(CAST.castFor('ga.guide').id, 'mei');
    assert.notEqual(CAST.castFor('ga.you').id, CAST.castFor('ga.guide').id, 'two people on one map are two people');
    assert.equal(CAST.castFor('coverage.guitar').id, 'ruth');
    assert.equal(CAST.castFor('coverage.bass').id, 'kofi');
    // the singer beside the band is the voice lessons' singer
    assert.notEqual(CAST.castFor('voice.singer').id, CAST.castFor('coverage.guitar').id);
    assert.notEqual(CAST.castFor('voice.singer').id, CAST.castFor('coverage.bass').id);
  });
});

describe('figure V2 elsewhere — screens outside Miking draw the cast', () => {
  const sites: [string, RegExp][] = [
    [`${LAB}/gameaudio/scene/GaScene.tsx`, /<PersonTopV2 pose=\{SINGER_TOP\} who=\{castFor\(second \? 'ga\.guide' : 'ga\.you'\)\} \/>/],
    [`${LAB}/gameaudio/pages/chcSpeakerMap.tsx`, /<PersonTopV2 pose=\{SINGER_TOP\} who=\{castFor\('ga\.you'\)\} \/>/],
    [`${LAB}/gameaudio/scene/hud/bOutput.tsx`, /<PersonTopV2 pose=\{SINGER_TOP\} who=\{castFor\('ga\.you'\)\} \/>/],
    [`${LAB}/micselect/polarStage.tsx`, /<PersonTopV2 pose=\{SINGER_TOP\} who=\{castFor\('voice\.singer'\)\} \/>/],
  ];
  for (const [file, re] of sites)
    it(`${file.split('/').slice(-2).join('/')}: the cast member, no old figure`, () => {
      const src = read(file);
      assert.match(src, re);
      assert.doesNotMatch(src, /<PlayerBehind|<PlayerInFront/);
    });
  it('Speaker Coverage: the singer (side and above) and the band from above, all in the cast', () => {
    const src = read(`${LAB}/micspeaker/viz.tsx`);
    assert.doesNotMatch(src, /<PlayerBehind|<PlayerInFront|<PlanPlayerTop|<FigureHead /);
    assert.match(src, /<PersonSideV2 pose=\{SINGER_SIDE\} who=\{castFor\('voice\.singer'\)\} opts=\{\{ lip: \{ u: 0, v: 0 \}, rest: 'restSide' \}\} \/>/);
    assert.match(src, /<PersonTopV2 pose=\{SINGER_TOP\} who=\{castFor\('voice\.singer'\)\} \/>/);
    assert.match(src, /<PlayerTopV2 player=\{BAND_TOP_PLAYERS\[p\.kind\]\} who=\{castFor\(p\.kind === 'bass' \? 'coverage\.bass' : 'coverage\.guitar'\)\} \/>/);
  });
});

describe('figure V2 elsewhere — the guitarist and bassist from above', () => {
  for (const kind of ['guitar', 'bass'] as const) {
    const pl = EB.BAND_TOP_PLAYERS[kind];
    it(`${kind}: the fretting fist closes round the neck, the picking hand over the strings`, () => {
      // the old plan player's frame: the neck (instrument's) at u 138–162, the top's face at u ≈ 163
      assert.ok(pl.L.at.u >= 138 && pl.L.at.u <= 162, `fretting fist centre on the neck: ${pl.L.at.u}`);
      assert.ok(pl.L.at.v < -400, 'the fretting hand out along the neck');
      assert.ok(pl.R.at.u > 163 && pl.R.at.u < 230, `picking hand just in front of the top: ${pl.R.at.u}`);
      assert.equal(pl.L.kind ?? 'fist', 'fist');
      // the approved fist from above, its middle on the neck
      const placed = ET.placeTopGrip(pl.L);
      assert.ok(GE.dist(placed.F, pl.L.at) < 1, 'the fist is placed by its own middle');
    });
    it(`${kind}: arms of real length (upper arm and forearm as projected from above, never longer than true)`, () => {
      for (const side of ['near', 'far'] as const) {
        const plan = ET.topPlayerPlan(pl, CAST.CAST[kind === 'bass' ? 'kofi' : 'ruth']);
        const a = plan.arms[side];
        const up = GE.dist(a.shoulder, a.elbow);
        const fore = GE.dist(a.elbow, a.wrist);
        assert.ok(up <= 310, `${side} upper arm ${up.toFixed(0)} ≤ 310 mm`);
        assert.ok(fore <= 280 && fore >= 60, `${side} forearm ${fore.toFixed(0)} mm`);
      }
    });
  }
});

describe('figure V2 elsewhere — the voice cut-away', () => {
  const inside = VC.CUTAWAY_INSIDE as readonly (readonly [number, number])[];
  const neck = (VC.NECK_V2 as readonly (readonly [number, number])[]).map(([u, v]) => P(u, v));
  for (const id of ['ana', 'kofi', 'ruth', 'mei', 'drummer'] as const) {
    it(`${id}: the outline is the approved side head on the lip point, and every part of the section lies inside it`, () => {
      const plan = PV.personPlan(VP.SINGER_SIDE, CAST.CAST[id], { lip: { u: 0, v: 0 }, rest: 'restSide' });
      const skull = plan.head.skull as Pt[];
      // the face is the approved one (nose tip ahead of the lips, the chin under them)
      assert.ok(plan.head.noseTip.u > 10 && plan.head.noseTip.v < -20);
      const out = inside.filter(([u, v]) => !GE.inPoly(P(u, v), skull) && !GE.inPoly(P(u, v), neck));
      assert.deepEqual(out, [], `parts outside the outline: ${JSON.stringify(out)}`);
    });
  }
  it('the section\'s parts did not move (the larynx, the folds, the trachea, the tongue, the jaw as before)', () => {
    const src = read(`${LAB}/miking/lessons/shared/voice/VoiceCutaway.tsx`);
    assert.match(src, /const LARYNX: readonly P2\[\] = \[\[-93, 74\], \[-86, 68\], \[-79, 66\], \[-66, 74\], \[-58, 86\], \[-56, 96\], \[-58, 106\], \[-60, 124\], \[-82, 124\], \[-82, 106\], \[-84, 96\], \[-88, 86\]\];/);
    assert.match(src, /const FOLD_FRONT: readonly P2\[\] = \[\[-56, 91\], \[-67, 96\], \[-56, 101\]\];/);
    assert.match(src, /const THYROID: readonly P2\[\] = \[\[-53, 72\], \[-48, 84\], \[-46, 94\], \[-49, 106\], \[-53, 115\], \[-57, 112\], \[-55, 96\], \[-57, 78\]\];/);
    assert.match(src, /const JAW_BONE: readonly P2\[\] = \[\[-8, 18\], \[-5, 27\], \[-7, 40\], \[-16, 47\], \[-25, 43\], \[-23, 28\], \[-14, 20\]\];/);
    assert.match(src, /const spineX = \(y: number\) => -131 - 0\.00028 \* \(y - 90\) \*\* 2;/);
    // the lessons not converted keep the old outline exactly
    assert.match(src, /<FigureMass path=\{A\.head\} tone="skin" contour=\{2\.6\} \/>/);
    // the jacket only when asked
    assert.match(src, /\{jacket && L\.JACKET \? \(/);
  });
  it('the hair in the section lies only outside the scalp (the cut shows no hair inside the head)', () => {
    const src = read(`${LAB}/miking/lessons/shared/voice/VoiceCutaway.tsx`);
    assert.match(src, /const hair = op\(P\.hair, head, PathOp\.Difference\);/);
  });
});

describe('figure V2 elsewhere — the study page', () => {
  it('registered beside the others (one small edit)', () => {
    assert.match(read('src/dev/FigureStudy.tsx'), /only\.startsWith\('elsewhere'\)/);
    assert.match(read('src/dev/elsewhereStudy.tsx'), /export function ElsewhereStudy/);
  });
  it('no image files are used for the new figures', () => {
    for (const f of [`${FV}/elsewhereTop.tsx`, `${FV}/elsewhereBand.ts`]) assert.doesNotMatch(read(f), /require\(|\.png|\.webp|\.jpg/);
  });
});

/* ── the SVG screens (Room Design, Sound Systems, Stage Plot) ── */
const SV = R(await import('../src/features/lab/figureV2Svg.tsx'));
const SPL = R(await import('../src/screens/lab/miking/lessons/shared/figureV2/sidePlan.ts'));
const TPP = R(await import('../src/screens/lab/miking/lessons/shared/figureV2/topPerson.ts'));

describe('figure V2 elsewhere — the SVG screens paint the SAME plan as the Skia figure', () => {
  it('the SVG curve is paths.ts smoothClosed: same tension, same handle limit, same repeated-point filter', () => {
    const paths = read(`${FV}/paths.ts`);
    const svg = read('src/features/lab/figureV2Svg.tsx');
    for (const line of ['return Math.hypot(q.u - r.u, q.v - r.v) > 0.05;', 'const k = tension / 3;', 'const m = seg * 0.5;', 'return l > m && l > 0 ? m / l : 1;'])
      assert.ok(paths.includes(line) && svg.includes(line), line);
    // a closed curve passes through every control point
    const poly = [P(0, 0), P(100, 0), P(120, 80), P(10, 90)];
    const d: string = SV.dClosed(poly);
    for (const p of poly) assert.ok(d.includes(`${p.u} ${p.v}`), `${p.u} ${p.v} on the curve`);
  });
  it('from above: the plan is topPerson.personTopPlan, on the standing pose facing down the plan', () => {
    for (const id of ['ana', 'kofi', 'ruth', 'mei', 'drummer'] as const) {
      const plan = SV.aboveSvgPlan(CAST.CAST[id]);
      assert.equal(plan, TPP.personTopPlan(SV.abovePose(false), CAST.CAST[id], {}), 'the same plan object (memoised): no second geometry');
      assert.ok(plan.head.nose.every((p: Pt) => p.v > 80), 'the nose toward +y (the house)');
      const w = Math.max(...plan.torso.map((p: Pt) => p.u)) - Math.min(...plan.torso.map((p: Pt) => p.u));
      assert.ok(w > 380 && w < 480, `${id} across the shoulders ${w.toFixed(0)} mm`);
      const n = SV.aboveSvgPlan(CAST.CAST[id], true);
      const wn = Math.max(...n.torso.map((p: Pt) => p.u)) - Math.min(...n.torso.map((p: Pt) => p.u));
      assert.ok(wn <= 400, `${id} narrow build ${wn.toFixed(0)} mm ≤ 400 (choir neighbours 440 apart stay clear)`);
    }
  });
  it('seated in profile: the plan is sidePlan on the seated pose; the ear lands where the screen asks; feet on the floor or the footrest', () => {
    for (const id of ['ana', 'kofi', 'ruth', 'mei', 'drummer'] as const)
      for (const ear of [1000, 1200, 1500]) {
        const who = CAST.CAST[id];
        const S = Math.round(SV.seatForEarV2(ear, who) / 5) * 5;
        const plan = SV.seatedSidePlan(S, who);
        assert.equal(plan, SPL.sidePlan(SV.seatedSidePose(S), { head: who.head, restR: 'restFlat', restL: 'restFlat', seatV: -S, body: who.body }));
        const e = SV.earOf(plan);
        assert.ok(Math.abs(-e.v - ear) < 6, `${id}: ear ${(-e.v).toFixed(0)} for ${ear}`);
        const pose = SV.seatedSidePose(S);
        assert.ok(pose.footR.u - pose.kneeR.u < 120, `${id} ${ear}: the shin near upright (foot ${(pose.footR.u - pose.kneeR.u).toFixed(0)} mm ahead of the knee)`);
        assert.ok(pose.footR.v <= 0, 'the foot on the floor or above it');
      }
  });
  it('the screens draw the cast (positions, scales and counts as before)', () => {
    const room = read(`${LAB}/roomdesign/RoomSideView.tsx`);
    assert.match(room, /<PersonSeatedSideSvg earX=\{p\.x\} earY=\{p\.y\} floorY=\{floorY\} px=\{pxPerMm\} who=\{castFor\('room\.listener'\)\} facing=\{-1\} \/>/);
    assert.match(read(`${LAB}/soundsystems/art/diagrams.tsx`), /<PersonAboveSvg x=\{perf\.x - 2 \* S\} y=\{perf\.y\} pxPerMm=\{WEDGE_W \/ 600\} facingDeg=\{-90\} who=\{castFor\('monitor\.performer'\)\} \/>/);
    assert.match(read(`${LAB}/soundsystems/art/VenueView.tsx`), /<PersonAboveSvg key=\{s\} x=\{q\.x\} y=\{q\.y\} pxPerMm=\{PERSON_PX_PER_MM \* PEOPLE_ENLARGED\} halo="#c3cde2" who=\{castFor\(`venue\.\$\{s\}`/);
    assert.match(read(`${LAB}/stageplot/stage/stageArt.tsx`), /<PersonAboveSvg x=\{cx\} y=\{cy\} pxPerMm=\{\(u \* spSymbol\('performer'\)\.w \* PERSON_ENLARGED\) \/ FIGURE_ABOVE_W_MM\} facingDeg=\{rot\} halo="#c3cde2" who=\{castForKey\(o\.id\)\} \/>/);
    // OWNER RULING 2026-11-24: "for stage plot design lab only make them all the same (generic
    // "person"), in the other labs, yes use the cast": the Stage Plot lab draws the one generic
    // plot symbol for every performer and every choir singer, never a cast member.
    assert.match(read(`${LAB}/stageplot/stage/topArtWorld.tsx`), /<FigureAboveSvg key=\{`\$\{x\.toFixed\(2\)\},\$\{y\.toFixed\(2\)\}`\} x=\{x\} y=\{y\} pxPerMm=\{0\.032\} facingDeg=\{0\} halo="#c3cde2" build="narrow" \/>/);
    assert.doesNotMatch(read(`${LAB}/stageplot/stage/topArtWorld.tsx`), /PersonAboveSvg|castInTurn/);
    assert.match(read(`${LAB}/stageplot/stage/stageArt.tsx`), /export const PERFORMERS_AS_CAST = false;/);
    for (const f of [`${LAB}/roomdesign/RoomSideView.tsx`, `${LAB}/soundsystems/art/diagrams.tsx`, `${LAB}/soundsystems/art/VenueView.tsx`])
      assert.doesNotMatch(read(f), /<FigureAboveSvg|<FigureSeatedSideSvg/, f);
  });
  it('the SVG module needs no Skia (SVG screens load without it)', () => {
    assert.doesNotMatch(read('src/features/lab/figureV2Svg.tsx'), /react-native-skia/);
    for (const f of ['sidePlan.ts', 'topPerson.ts', 'geom.ts', 'authoredHands.ts', 'palette.ts', 'cast.ts', 'look.tsx']) assert.doesNotMatch(read(`${FV}/${f}`), /from '@shopify\/react-native-skia'/, f);
  });
  it('people a screen places by number take the cast in turn; a learner\'s object keeps its person', () => {
    assert.notEqual(SV.castInTurn(0).id, SV.castInTurn(1).id);
    assert.equal(SV.castForKey('perf-1').id, SV.castForKey('perf-1').id);
    assert.equal(new Set([0, 1, 2, 3, 4].map((i: number) => SV.castInTurn(i).id)).size, 5);
  });
});

/* ── step 2: the plan markers and the ensemble plan, behind `v2` (default OFF) ── */
const MP = R(await import('../src/screens/lab/miking/lessons/shared/figureV2/markerPose.ts'));
const LS = 'src/screens/lab/miking/lessons';

describe('figure V2 elsewhere — the plan markers behind v2 (OFF by default; each lesson switches with its own player)', () => {
  const gates: [string, RegExp[]][] = [
    [`${LS}/shared/handdrums/HandPlan.tsx`, [/v2 = false, who \}: HandPlanProps/, /if \(v2\)\s+return <PlayerTopV2 player=\{handDrumPlayer\(t\.u, t\.v\)\}/]],
    [`${LS}/shared/speakers/BacklinePlan.tsx`, [/export function PlanPlayerTop\(\{ pose, v2 = false, who, part = 'all' \}/, /accessibilityLabel, v2 = false, player \}/]],
    [`${LS}/shared/speakers/StagePlan.tsx`, [/accessibilityLabel, v2 = false, player \}/, /<PlanPlayerTop pose="guitar" v2=\{v2\} who=\{player\} \/>/]],
    [`${LS}/shared/keys/KeysPlan.tsx`, [/accessibilityLabel, v2 = false, player \}/]],
    [`${LS}/shared/strings/PStagePlan.tsx`, [/accessibilityLabel, v2 = false, people \}/, /function Glyph\(\{ spot, lit, v2 = false, who \}/]],
    [`${LS}/c12Clavinet/art.tsx`, [/export function ClavinetPlan\(\{ dim = 1, v2 = false, who \}/]],
    [`${LS}/shared/lutes/LutePlan.tsx`, [/function Seated\(\{ x, z, w = 210, v2 = false, id = '' \}/, /v2=\{!!spec\.v2\}/]],
    [`${LS}/shared/ensemble/SeatingArt.tsx`, [/export function SeatingView\(\{ seating, view, hi = null, v2: v2Prop \}/, /\{v2 && view === 'plan' \? <SeatingPlanV2 seating=\{seating\} hi=\{null\} \/> : null\}/]],
  ];
  for (const [f, res] of gates)
    it(`${f.split('/').slice(-2).join('/')}: the new look only when asked`, () => {
      const src = read(f);
      for (const re of res) assert.match(src, re);
    });
  it('no lesson switches a marker on (the owners of those lessons switch them with their own players)', () => {
    const callers = [`${LS}/shared/handdrums/pages/HSetting.tsx`, `${LS}/shared/ensemble/ensembleArt.tsx`, `${LS}/shared/ensemble/EnsembleStage.tsx`];
    for (const f of callers) assert.doesNotMatch(read(f), /\bv2(=\{true\}|\s*\/>|\s+[a-z])/, f);
  });
  it('the hand drummer: both hands flat on the heads where the old arms ended (u + 300, ±150), the head where the old head was', () => {
    const p = MP.handDrumPlayer(0, 0);
    assert.equal(p.R.kind, 'rest');
    assert.ok(Math.abs(p.R.at.v - 150) < 1 && Math.abs(p.L.at.v + 150) < 1 && p.R.at.u > 300);
    assert.equal(p.neck.u + 18, 10, 'the head 18 mm ahead of the neck = the old head at u + 10');
  });
  it('a keyboard player reaches only keys within an arm (the Wurlitzer, 600 mm off, keeps the arms hanging)', () => {
    assert.match(read(`${LS}/shared/keys/KeysPlan.tsx`), /const KEYS_REACH = 420;/);
    assert.match(read(`${LS}/shared/keys/KeysPlan.tsx`), /keyboardRect\(rig\)\.u0 - P\.player\.u <= KEYS_REACH \?/);
  });
  it('the standing marker: the approved top view (shoulders, back, head), turned to face its way', () => {
    assert.match(read(`${FV}/elsewhereTop.tsx`), /export const MarkerTopV2 = memo\(function MarkerTopV2/);
    assert.match(read(`${FV}/elsewhereTop.tsx`), /<PersonTopV2 pose=\{standingAbovePose\(narrow\)\} who=\{who\} dim=\{dim\} \/>/);
  });
});

/* ── step 3: the front view for scale ── */
describe('figure V2 elsewhere — the standing person from the front, at the old height', () => {
  it('Foundations and Wave Physics: the cast from the front (Skia), the same height as before', () => {
    const fo = read(`${LAB}/foundations/viz.tsx`);
    assert.match(fo, /<PersonStandingFrontAt cx=\{personX\} floorY=\{floorY\} pxPerMm=\{personPx\} who=\{castFor\('foundations\.person'\)\} heightMm=\{STANDING_H_MM\} \/>/);
    const wv = read(`${LAB}/wave/vizWave.tsx`);
    assert.equal((wv.match(/<PersonStandingFrontAt /g) ?? []).length, 3);
    assert.doesNotMatch(wv, /<StandingHead /);
    assert.match(wv, /const STANDING_MM = 1745;/);
  });
  it('EQ camera and Cable Install: the cast from the front in SVG, from the same front plan', () => {
    assert.match(read(`${LAB}/eq/modules/CameraAnalogy.tsx`), /<PersonFrontSvg cx=\{160\} floorY=\{FLOOR_Y\} px=\{0\.0377\} who=\{castFor\('eq\.person'\)\} heightMm=\{1745\} \/>/);
    assert.match(read(`${LAB}/cableinstall/svgArt.tsx`), /return <PersonFrontSvg cx=\{x\} floorY=\{floorY\} px=\{m \/ 1000\} who=\{who \?\? castFor\('cable\.person'\)\} heightMm=\{1745\} \/>;/);
    for (const id of ['ana', 'kofi', 'ruth', 'mei', 'drummer'] as const) {
      const F = SV.frontSvgPlan(CAST.CAST[id]);
      const e = SV.frontSvgExtents(CAST.CAST[id]);
      assert.ok(e.floor - e.top > 1500 && e.floor - e.top < 1800, `${id} drawn height before scaling ${(e.floor - e.top).toFixed(0)}`);
      assert.equal(F.arms.length, 2);
    }
  });
});

describe('figure V2 elsewhere — the SVG front head follows the approved front head (no drift)', () => {
  const sk = read(`${FV}/FigureV2Front.tsx`);
  const sv = read('src/features/lab/figureV2Svg.tsx');
  it('paints the same parts in the same order as HeadFrontLite (the plan data itself is shared: frontPlan.ts)', () => {
    const head = sk.slice(sk.indexOf('export function HeadFrontLite'), sk.indexOf('export function FigureV2FrontLite'));
    const want = [...head.matchAll(/P\.(\w+)/g)].map((m) => (m[1] === 'turn' ? 'skull' : m[1]));
    const shead = sv.slice(sv.indexOf('{/* the head (HeadFrontLite) */}'), sv.indexOf('{/* the arms: one sleeve'));
    const got = [...shead.matchAll(/h\.(\w+)/g)].map((m) => m[1]).filter((n) => n !== 'c' && n !== 'r');
    assert.deepEqual(got, want);
  });
  it('the same curves (each part\'s smoothing as frontPaths builds it) and the same inner-rim scale', () => {
    for (const [name, t] of [['ears', '0.55'], ['skull', '0.5'], ['noseShade', '0.5'], ['eyes', '0.45'], ['lids', '0.4'], ['brows', '0.5'], ['upperLip', '0.4'], ['lowerLip', '0.45'], ['hair', '0.45']] as const) {
      const skLine = sk.split('\n').find((l) => l.trim().startsWith(`${name}: `) && l.includes('smoothClosed')) ?? '';
      assert.ok(skLine.includes(`, ${t})`), `frontPaths ${name}: smoothing ${t} (${skLine.trim()})`);
      const svLine = sv.split('\n').find((l) => l.includes(`dClosed(h.${name}, `) || (name === 'ears' && l.includes('d={dClosed(e, ')) || (name === 'eyes' && l.includes('key={`y${i}`} d={dClosed(e, ')) || (name === 'lids' && l.includes('key={`li${i}`} d={dClosed(e, ')) || (name === 'brows' && l.includes('key={`b${i}`} d={dClosed(e, '))) ?? '';
      assert.ok(svLine.includes(`, ${t})`), `svg ${name}: smoothing ${t} (${svLine.trim()})`);
    }
    assert.match(sk, /m\.scale\(0\.86, 0\.93\);/);
    assert.match(sv, /\* 0\.86, v: sb\.c\.v \+ \(q\.v - sb\.c\.v\) \* 0\.93/);
  });
});

/* ── the ensemble lessons switched on whole, and the sports dish operators ── */
const SA = R(await import('../src/screens/lab/miking/lessons/shared/ensemble/SeatingArt.tsx'));
const SE = R(await import('../src/screens/lab/miking/lessons/shared/ensemble/seating.ts'));

describe('figure V2 elsewhere — the ensemble lessons in the approved look, whole', () => {
  it('E02, E04, E08, E10: every seating each lesson shows is switched on, and every one of its seats can be drawn new', () => {
    const on = ['vocal.line', 'vocal.shared', 'vocal.circle', 'duo.shared', 'duo.fig8', 'vocal.quartet', 'acoustic.duo', 'acoustic.trio', 'horns.line', 'horns.arc'];
    for (const id of on) {
      assert.ok(SA.ENSEMBLE_V2.has(id), id);
      assert.ok(SA.seatingV2Ready(SE.seatingOf(id)), `${id} ready`);
    }
  });
  it('the lessons with a conductor, a choir folder, keys, harp, piano, timpani or percussion stay wholly old', () => {
    // (Ensembles2 2026-11-24: the conductor exists — E11's quartets and string orchestra are on; its own test file
    // test/figureV2Ensembles2_20261124.test.ts holds the lessons it switched on)
    // (Ensembles2 2026-11-24: E05, E06, E09, E11–E16 are on too — its own test file holds them; every ensemble
    // lesson is now converted, so no seating stays old here)
    for (const id of [] as string[]) {
      assert.ok(!SA.ENSEMBLE_V2.has(id), id);
    }
  });
  it('the switch is the seating view\'s default (the lessons need no change); a caller can still force it', () => {
    assert.match(read(`${LS}/shared/ensemble/SeatingArt.tsx`), /const v2 = v2Prop \?\? \(ENSEMBLE_V2\.has\(seating\.id\) && seatingV2Ready\(seating\)\);/);
  });
  it('a held instrument\'s player is the family figure on the ensemble\'s own hold (the bow arm, the stopping hand); a violinist\'s head tips to the chin rest', () => {
    const src = read(`${LS}/shared/ensemble/SeatingArt.tsx`);
    assert.match(src, /const fp = famPlan\(fi\);/);
    assert.match(src, /const head = chin \? v3l\(n\.x - 45, n\.y \+ 150, n\.z \+ 40\)/);
    // the plan's map is a proper rotation (a hand drawn from it is not mirrored): (x, y, z) → (x, −y, −z)
    assert.match(src, /const PLAN_RIGID: Rigid = \{ pt: \(q\) => v3l\(q\.x, -q\.y, -q\.z\)/);
  });
  it('children are never drawn in elevation (E06, the lead ruling)', () => {
    assert.match(read(`${LS}/shared/ensemble/SeatingArt.tsx`), /filter\(\(q\) => q\.kind !== 'child' &&/);
  });
});

describe('figure V2 elsewhere — the sports dish operators (nobody else\'s)', () => {
  it('B12 and the venue plans: the operator from above is the cast member, the hands round the grips', () => {
    assert.match(read(`${LS}/shared/sports/DishArt.tsx`), /<PlayerTopV2 player=\{OP_PLAYER\} who=\{castFor\('sports\.dish'\)\} \/>/);
    assert.match(read(`${LS}/shared/sports/VenueArt.tsx`), /<PlayerTopV2 player=\{DISH_OP_PLAYER\} who=\{castFor\('sports\.dish'\)\} \/>/);
    assert.doesNotMatch(read(`${LS}/shared/sports/DishArt.tsx`), /<PlayerBehind/);
  });
});

describe('figure V2 elsewhere — the hand-drum lessons switched on whole', () => {
  it('M04a, M04b, M04c, M05: the plan player (their only drawn person) in the approved look; the cajón (another builder\'s) off', () => {
    const src = read(`${LS}/shared/handdrums/pages/HSetting.tsx`);
    assert.match(src, /const HAND_PLAN_V2: ReadonlySet<string> = new Set\(\['M04a', 'M04b', 'M04c', 'M05'\]\);/);
    assert.match(src, /v2=\{HAND_PLAN_V2\.has\(lesson\.id\)\} \/>/);
  });
});

const CL = R(await import('../src/screens/lab/miking/lessons/shared/figureV2/clapV2.tsx'));
const BA2 = R(await import('../src/screens/lab/miking/lessons/shared/sports/BoundaryArt.tsx'));
describe('figure V2 elsewhere — B14 the clapper (nobody else\'s)', () => {
  it('the lesson\'s own pose, mirrored point for point (the same place the old mirrored drawing had), the hands set as a clap', () => {
    const p = BA2.clapPose(1000);
    const q = CL.clapperPoseV2(p);
    assert.equal(q.facing, -1);
    assert.ok(Math.abs(q.handR.wrist.u + p.handR.wrist.u) < 1e-9 && q.handR.wrist.v === p.handR.wrist.v, 'the wrist where it was (mirrored)');
    assert.ok(Math.abs(q.elbowL.u + p.elbowL.u) < 1e-9, 'the elbow where it was (mirrored)');
    // the near hand's fingers up and forward more steeply than the far hand's: one cupped across the other
    const up = (d: number) => -Math.sin(d);
    assert.ok(up(q.handR.dir) > up(q.handL.dir) && up(q.handL.dir) > 0);
  });
  it('B14 draws the cast member, no old figure', () => {
    const src = read(`${LS}/shared/sports/BoundaryArt.tsx`);
    assert.match(src, /<ClapperV2 pose=\{pose\} who=\{castFor\('sports\.clapper'\)\} \/>/);
    assert.doesNotMatch(src, /<PlayerBehind|<PlayerInFront/);
  });
});
