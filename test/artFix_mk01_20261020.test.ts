/**
 * Art fix MK-01 (owner-approved drawing, 2026-10-20): the Miking SPK stage /
 * studio plan draws the WHOLE signal path, end to end (D69/D70: every cable
 * its own traceable lane) —
 *   guitar (tail jack) → instrument cord → the amp's INPUT (front panel);
 *   the amp's LINE / DI OUT → the DI (already drawn, DI_CABLE);
 *   the DI's XLR out → TO STAGE BOX (stage, off the plan's upstage edge) /
 *   TO WALL PANEL (studio wall).
 * No new cable runs through an object, crosses another cable, or (the drawn
 * cord) crosses the studio phones cord where the player's figure does not
 * cover it; the plan's words keep clear of the new cables.
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it } from 'node:test';
import { segmentHitsRect, segmentsCross, type PlanPt } from '../src/screens/lab/miking/lessons/shared/planFoot.ts';
import { cueCables } from '../src/screens/lab/miking/lessons/shared/monitoring/cueMix.ts';
import { patchVerdict } from '../src/screens/lab/miking/lessons/shared/speakers/signalChain.ts';
import {
  AMP_INPUT,
  CAB,
  DI_CABLE,
  DI_XLR_JACKS,
  DI_XLR_TO,
  diXlr,
  diXlrEnd,
  GUITAR_CORD_JACKS,
  GUITAR_JACK,
  guitarCord,
  guitarCordDrawn,
  PLAN_BOX,
  POS,
  SPK_ROOM,
  spkCables,
  spkCue,
  spkFoots,
  spkPathCables,
} from '../src/screens/lab/miking/lessons/shared/speakers/stagePlanModel.ts';
import { SPK_LESSON } from '../src/screens/lab/miking/lessons/spk/lesson.ts';

const read = (f: string) => readFileSync(join(process.cwd(), f), 'utf8');
const SCENES = ['stage', 'studio'] as const;

function bezier(p0: PlanPt, c1: PlanPt, c2: PlanPt, p3: PlanPt, n = 60): PlanPt[] {
  return Array.from({ length: n + 1 }, (_, i) => {
    const t = i / n;
    const a = (1 - t) ** 3;
    const b = 3 * (1 - t) ** 2 * t;
    const c = 3 * (1 - t) * t * t;
    const d = t ** 3;
    return { u: a * p0.u + b * c1.u + c * c2.u + d * p3.u, v: a * p0.v + b * c1.v + c * c2.v + d * p3.v };
  });
}

describe('MK-01 art: the plan draws the whole path', () => {
  it('the jacks pass the lab’s own patch rule', () => {
    assert.equal(GUITAR_CORD_JACKS.amp, 'ampIn');
    assert.equal(patchVerdict(GUITAR_CORD_JACKS.guitar, GUITAR_CORD_JACKS.amp), 'ok');
    assert.equal(patchVerdict(DI_XLR_JACKS.di, DI_XLR_JACKS.to), 'ok');
  });
  for (const sc of SCENES) {
    it(`${sc}: three cables, instrument vs XLR`, () => {
      const ks = spkCables(sc);
      assert.deepEqual(ks.map((k) => k.id), ['diCable', 'guitarCord', 'diXlr']);
      assert.equal(ks.find((k) => k.id === 'guitarCord')!.kind, 'instrumentCable');
      assert.equal(ks.find((k) => k.id === 'diXlr')!.kind, 'xlr');
      assert.equal(DI_CABLE.kind, 'instrumentCable');
    });
    it(`${sc}: the cord ends at the amp’s front-panel INPUT, the XLR at the plan’s edge`, () => {
      const k = guitarCord(sc);
      const end = k.pts[k.pts.length - 1];
      assert.equal(k.to, 'cab');
      assert.equal(end.u, CAB.box.x1 + AMP_INPUT.plug);
      assert.ok(AMP_INPUT.v > CAB.box.z0 && AMP_INPUT.v < CAB.box.z1);
      assert.ok(k.pts.every((p) => p.u >= CAB.box.x1), 'never over the cabinet');
      const x = diXlrEnd(sc);
      if (sc === 'stage') assert.equal(x.u, PLAN_BOX.stage.u0);
      else assert.equal(x.u, SPK_ROOM.u0);
      assert.equal(diXlr(sc).from, 'dibox');
      assert.match(DI_XLR_TO[sc], /^TO (STAGE BOX|WALL PANEL)$/);
    });
    it(`${sc}: no new cable through an object, none crossing another cable`, () => {
      const foots = spkFoots(sc, SPK_LESSON.live.wedges);
      const all = [...spkCables(sc), ...(sc === 'studio' ? cueCables(spkCue()) : [])];
      const bad: string[] = [];
      for (const k of spkPathCables(sc)) {
        for (let i = 0; i + 1 < k.pts.length; i++) for (const f of foots) if (f.id !== k.from && f.id !== k.to && !(f.zone && f.kind !== 'keepClear') && segmentHitsRect(k.pts[i], k.pts[i + 1], f, 2)) bad.push(`${k.id} through ${f.id}`);
        for (const o of all) {
          if (o.id === k.id) continue;
          for (let i = 0; i + 1 < k.pts.length; i++) for (let j = 0; j + 1 < o.pts.length; j++) if (segmentsCross(k.pts[i], k.pts[i + 1], o.pts[j], o.pts[j + 1])) bad.push(`${k.id} crosses ${o.id}`);
        }
      }
      assert.deepEqual(bad, []);
    });
    it(`${sc}: the drawn cord leaves the guitar’s tail plug; any crossing of the phones cord is under the player’s figure`, () => {
      const C = guitarCordDrawn(sc);
      assert.deepEqual(C.from, { u: GUITAR_JACK.u, v: GUITAR_JACK.v + GUITAR_JACK.plug });
      const pts = [...bezier(C.from, C.turn[0], C.turn[1], C.turn[2]), ...bezier(C.turn[2], C.under[0], C.under[1], C.under[2])];
      const player = spkFoots(sc, []).find((f) => f.id === 'player')!;
      const phones = sc === 'studio' ? cueCables(spkCue()).filter((k) => k.kind === 'phones' && k.to === 'head:guitarist') : [];
      for (const ph of phones)
        for (let i = 0; i + 1 < pts.length; i++)
          for (let j = 0; j + 1 < ph.pts.length; j++)
            if (segmentsCross(pts[i], pts[i + 1], ph.pts[j], ph.pts[j + 1])) {
              const p = pts[i];
              // well inside the figure's torso (its box less the arms' reach)
              assert.ok(p.u > player.u0 + 80 && p.u < POS.player.u + 60 && p.v < player.v1 - 60, `visible crossing at ${Math.round(p.u)}, ${Math.round(p.v)}`);
            }
      // the cord's modelled run starts where the drawing leaves the space
      assert.deepEqual(guitarCord(sc).pts[0], C.lane[0]);
    });
  }
  it('the plan draws them in two styles and keeps its words clear of them', () => {
    const src = read('src/screens/lab/miking/lessons/shared/speakers/StagePlan.tsx');
    assert.match(src, /clearOf=\{clearOfFoots\(T\.foots\(foots\), T\.cables\(\[\.\.\.spkPathCables\(scene\), \.\.\.\(cue \? cueCables\(cue\) : \[\]\)\]\)\)\}/);
    assert.match(src, /path=\{paths\.xlr\}[^\n]*color=\{XLR\.color\}/);
    assert.match(src, /path=\{paths\.cord\}[^\n]*color=\{INSTR\.color\}/);
    assert.match(src, /text: DI_XLR_TO\[scene\]/);
  });
});
