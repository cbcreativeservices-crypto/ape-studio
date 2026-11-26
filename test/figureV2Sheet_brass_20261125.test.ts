/**
 * FIGURE V2 — THE BRASS AND LOW BRASS FAMILY'S AUTHORED HANDS AND THEIR ONE REVIEW SHEET (owner 2026-11-25, "batches
 * by family"). Checked here:
 *   • every authored hand drawing (figureV2/brassHand*.tsx) exists, says in its header what the hand DOES and what the
 *     eye SEES, and is imported and placed by the family's own art file (brassFigureV2.tsx / lowBrassFigureV2.tsx);
 *   • the sheet (src/dev/brassSheetStudy.tsx, route `sheet-brass`) lists every drawing — each placed drawing is on it,
 *     each NEW entry shows a drawing, each KEPT entry none — and the route is registered in FigureStudy.tsx;
 *   • placed: the figure's own hand is not drawn where a drawing takes its place (`handElsewhere`), and each drawing is
 *     only TURNED onto its picture's forearm (in the picture it was authored for, by under 2°).
 * Source files are read with CRLF normalised.
 */
import './_mikingTsxLoader.ts';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { describe, it } from 'node:test';

const R = <T>(m: T): T => (m as { default?: T }).default ?? m;
const FV = R(await import('../src/screens/lab/miking/lessons/shared/figureV2/familyV2.tsx'));
const BF = R(await import('../src/screens/lab/miking/lessons/shared/brass/brassFigureV2.tsx'));
const BP = R(await import('../src/screens/lab/miking/lessons/shared/brass/brassPosture.ts'));
const BS = R(await import('../src/screens/lab/miking/lessons/shared/brass/brassSpec.ts'));
const LF = R(await import('../src/screens/lab/miking/lessons/shared/lowbrass/lowBrassFigureV2.tsx'));
const LS = R(await import('../src/screens/lab/miking/lessons/shared/lowbrass/lowBrassScene.ts'));
const LSP = R(await import('../src/screens/lab/miking/lessons/shared/lowbrass/lowBrassSpec.ts'));
const SH = R(await import('../src/dev/brassSheetStudy.tsx'));

const src = (p: string) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8').replace(/\r\n/g, '\n');
const FIG = 'src/screens/lab/miking/lessons/shared/figureV2';

type Pt = { u: number; v: number };
type Art = { fore: Pt; body: Pt[] };
type Placed = { art: Art; layer: 'front' | 'behind' };

/** Every drawing: its file, its exported name, the family art file that places it. */
const DRAWINGS: { file: string; name: string; placer: 'brass' | 'lowbrass' }[] = [
  { file: 'brassHandTrumpetValveSide', name: 'BRASS_HAND_TRUMPET_VALVE_SIDE', placer: 'brass' },
  { file: 'brassHandTrumpetValveTop', name: 'BRASS_HAND_TRUMPET_VALVE_TOP', placer: 'brass' },
  { file: 'brassHandTrumpetHoldSide', name: 'BRASS_HAND_TRUMPET_HOLD_SIDE', placer: 'brass' },
  { file: 'brassHandTrumpetHoldTop', name: 'BRASS_HAND_TRUMPET_HOLD_TOP', placer: 'brass' },
  { file: 'brassHandTromboneSlideSide', name: 'BRASS_HAND_TROMBONE_SLIDE_SIDE', placer: 'brass' },
  { file: 'brassHandTromboneHoldSide', name: 'BRASS_HAND_TROMBONE_HOLD_SIDE', placer: 'brass' },
  { file: 'brassHandTromboneSlideTop', name: 'BRASS_HAND_TROMBONE_SLIDE_TOP', placer: 'brass' },
  { file: 'brassHandTromboneHoldTop', name: 'BRASS_HAND_TROMBONE_HOLD_TOP', placer: 'brass' },
  { file: 'brassHandTubaValveSide', name: 'BRASS_HAND_TUBA_VALVE_SIDE', placer: 'lowbrass' },
  { file: 'brassHandTubaValveTop', name: 'BRASS_HAND_TUBA_VALVE_TOP', placer: 'lowbrass' },
  { file: 'brassHandEuphValveSide', name: 'BRASS_HAND_EUPH_VALVE_SIDE', placer: 'lowbrass' },
  { file: 'brassHandEuphValveTop', name: 'BRASS_HAND_EUPH_VALVE_TOP', placer: 'lowbrass' },
  { file: 'brassHandEuphSideValveTop', name: 'BRASS_HAND_EUPH_SIDE_VALVE_TOP', placer: 'lowbrass' },
  { file: 'brassHandHornLeverSide', name: 'BRASS_HAND_HORN_LEVER_SIDE', placer: 'lowbrass' },
  { file: 'brassHandHornLeverTop', name: 'BRASS_HAND_HORN_LEVER_TOP', placer: 'lowbrass' },
];
const PLACER = { brass: 'src/screens/lab/miking/lessons/shared/brass/brassFigureV2.tsx', lowbrass: 'src/screens/lab/miking/lessons/shared/lowbrass/lowBrassFigureV2.tsx' };

describe('the brass family’s authored hands', () => {
  it('every drawing exists, says what the hand does and what the eye sees, and is placed by the family art', () => {
    for (const d of DRAWINGS) {
      const p = `${FIG}/${d.file}.tsx`;
      assert.ok(existsSync(new URL(`../${p}`, import.meta.url)), `${p} exists`);
      const s = src(p);
      assert.match(s, /WHAT THE HAND DOES/, `${d.file}: what the hand does`);
      assert.match(s, /WHAT THE EYE SEES/, `${d.file}: what the eye sees`);
      assert.match(s, new RegExp(`export const ${d.name}: BrassHandArt`), `${d.file} exports ${d.name}`);
      const placer = src(PLACER[d.placer]);
      assert.match(placer, new RegExp(`import \\{ ${d.name} \\} from '\\.\\./figureV2/${d.file}'`), `${d.file} imported by ${d.placer}`);
      assert.match(placer, new RegExp(`art: ${d.name},`), `${d.name} placed by ${d.placer}`);
    }
    // the registries hold exactly these drawings
    const placed = [...Object.values(BF.BRASS_HAND_ART as Record<string, Placed>), ...Object.values(LF.LOW_BRASS_HAND_ART as Record<string, Placed>)].map((p) => p.art);
    assert.equal(new Set(placed).size, DRAWINGS.length);
  });

  it('the sheet lists every drawing; NEW shows a drawing, KEPT none; its route is registered', () => {
    const sheet = SH.SHEET as { status: 'NEW' | 'KEPT'; side: 'L' | 'R'; scene: { art: (s: 'L' | 'R') => Art | null } }[];
    const onSheet = new Set<Art>();
    for (const e of sheet) {
      const a = e.scene.art(e.side);
      if (e.status === 'NEW') assert.ok(a, 'a NEW entry shows its drawing');
      else assert.equal(a, null, 'a KEPT entry has no drawing');
      if (a) onSheet.add(a);
    }
    const placed = [...Object.values(BF.BRASS_HAND_ART as Record<string, Placed>), ...Object.values(LF.LOW_BRASS_HAND_ART as Record<string, Placed>)].map((p) => p.art);
    for (const a of placed) assert.ok(onSheet.has(a), 'every placed drawing is on the sheet');
    const fs = src('src/dev/FigureStudy.tsx');
    assert.match(fs, /import \{ BrassSheetStudy \} from '\.\/brassSheetStudy';/);
    assert.match(fs, /if \(only === 'sheet-brass'\) return <BrassSheetStudy \/>;/);
  });

  it('placed: the figure draws no hand where a drawing takes its place, and each drawing is only turned onto its forearm', () => {
    type FamIn = { arms: Record<'L' | 'R', { sk: { frame: { o: { x: number; y: number; z: number } } }; handElsewhere?: boolean }> };
    type ArmP = { side: 'L' | 'R'; elbow2: Pt; handElsewhere: boolean };
    const check = (fi: FamIn, view: 'side' | 'top', art: (side: 'L' | 'R') => Art | null, what: string) => {
      const fp = FV.famPlan(fi) as { arms: ArmP[] };
      const pr = FV.famProj(view);
      for (const a of fp.arms) {
        const d = art(a.side);
        if (!d) continue;
        assert.equal(a.handElsewhere, true, `${what} ${view} ${a.side}: the figure's own hand is not drawn`);
        const o = pr(fi.arms[a.side].sk.frame.o);
        const ang = Math.atan2(o.v - a.elbow2.v, o.u - a.elbow2.u) - Math.atan2(d.fore.v, d.fore.u);
        const deg = Math.abs(((((ang * 180) / Math.PI + 180) % 360) + 360) % 360 - 180);
        assert.ok(deg < 2, `${what} ${view} ${a.side}: authored on this forearm (off by ${deg.toFixed(2)}°)`);
      }
    };
    const tp = BP.valvedPose(BS.TRUMPET);
    const tb = BP.slidePose(BS.TENOR);
    for (const view of ['side', 'top'] as const) {
      check(BF.brassFamIn(tp, view), view, (s) => BF.brassHandArt(tp, view, s)?.art ?? null, 'trumpet');
      check(BF.brassFamIn(tb, view), view, (s) => BF.brassHandArt(tb, view, s)?.art ?? null, 'trombone');
      for (const [spec, o] of [[LSP.HORN, 'back'], [LSP.TUBA, 'up'], [LSP.EUPH, 'up']] as const) {
        const sc = LS.brassScene(spec, o);
        check(LF.lowBrassFamIn(sc, view), view, (s) => LF.lowBrassHandArt(sc, view, s)?.art ?? null, spec.id);
      }
    }
    // the flugelhorn and the bass trombone take the same drawings, turned (never scaled)
    for (const view of ['side', 'top'] as const) {
      const fh = BP.valvedPose(BS.FLUGELHORN);
      const bt = BP.slidePose(BS.BASS_TB);
      for (const s of ['L', 'R'] as const) {
        assert.equal(BF.brassHandArt(fh, view, s)?.art, BF.brassHandArt(tp, view, s)?.art);
        assert.equal(BF.brassHandArt(bt, view, s)?.art, BF.brassHandArt(tb, view, s)?.art);
      }
    }
  });

  it('the shared paint stays the approved paint: one outline, the skin kept off the sleeve, no 3-D model', () => {
    const s = src(`${FIG}/brassHandPaint.tsx`);
    assert.match(s, /AUTHORED 2-D ART/);
    assert.doesNotMatch(s, /handModel|familyHand\b/);
    assert.match(s, /<Path path=\{B\.body\} style="stroke"/);
    assert.match(s, /function handSide\(/);
  });
});
