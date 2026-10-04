/**
 * Miking — EVERY readout of a pose agrees (polish pass 2026-10-04).
 *
 * The bug: on web the live strip over the canvas kept its first value
 * ("A · ≈ 6 cm") while the bezel and the NOW line said 25 cm, and a mic
 * stopped by a head read "✕ batter head" in the strip only. The fix routes
 * every printed readout through ONE formatter module (readoutText.ts) fed by
 * ONE `Readouts` (deriveReadouts) plus the committed stop reason. This test
 * checks, for every documented zone start and for poses between and around
 * them, that:
 *
 *   • the strip line, the bezel cells and the NOW sentence print the SAME
 *     rounded distance, off-line distance, aim, and stop reason;
 *   • a bezel length cell keeps both units, with the same ≈ 5 mm rounding as
 *     the strip (the cell's two lines are fmtMetric / fmtImperial);
 *   • the page-5 path difference is signed B − A and its cell says so;
 *   • the scene source wires the strip and the pages to those formatters
 *     (and the web strip does NOT rely on animated `text` on a textarea).
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it } from 'node:test';
import { M01_LESSON } from '../src/screens/lab/miking/lessons/m01Kick/lesson.ts';
import { micType } from '../src/screens/lab/miking/data/micTypes.ts';
import { micBodyOf } from '../src/screens/lab/miking/engine/model/validate.ts';
import { compileScene } from '../src/screens/lab/miking/engine/geometry/collision.ts';
import { deriveReadouts, type ReadoutCtx } from '../src/screens/lab/miking/engine/geometry/readouts.ts';
import { fmtAngle, fmtImperial, fmtLen, fmtMetric } from '../src/screens/lab/miking/engine/model/units.ts';
import { describeMic } from '../src/screens/lab/miking/engine/a11y/describe.ts';
import { lenCell, liveLine, placementBezel, withStop, zoneMark, type ReadoutWords } from '../src/screens/lab/miking/engine/scene/readoutText.ts';
import type { MicPose, VariantId } from '../src/screens/lab/miking/engine/model/types.ts';

const read = (p: string) => readFileSync(join(process.cwd(), p), 'utf8').replace(/\r\n/g, '\n');
const lesson = M01_LESSON;
const m = lesson.model;

function ctxFor(typeId: string, variant: VariantId): ReadoutCtx {
  return { scene: compileScene(m, variant), surfaces: m.surfaces, lines: m.lines, zones: lesson.zones, variant, micTypeId: typeId, body: micBodyOf(micType(typeId)) };
}

/** Every zone start, plus nudged copies (between zones, outside, tilted). */
function poses(): { typeId: string; variant: VariantId; pose: MicPose }[] {
  const out: { typeId: string; variant: VariantId; pose: MicPose }[] = [];
  for (const z of lesson.zones) {
    const typeId = z.requires?.micTypeIds?.[0] ?? lesson.micTypeIds[0];
    const variant: VariantId = z.variants?.[0] ?? 'ported';
    out.push({ typeId, variant, pose: z.start });
    for (const dx of [-37, 23, 141]) out.push({ typeId, variant, pose: { ...z.start, p: { ...z.start.p, x: z.start.p.x + dx } } });
    out.push({ typeId, variant, pose: { ...z.start, el: 25, az: -15 } });
  }
  return out;
}

const STOP = { partId: 'kick.batter', label: 'batter head' };

describe('one pose → one set of printed numbers', () => {
  for (const [i, c] of poses().entries()) {
    for (const surfaceId of m.surfaces.map((s) => s.id)) {
      for (const stop of [null, STOP]) {
        it(`pose ${i} (${c.typeId}, ${c.variant}) from ${surfaceId}${stop ? ', stopped' : ''}`, () => {
          const raw = deriveReadouts(ctxFor(c.typeId, c.variant), c.pose, surfaceId, m.lines[0].id);
          const r = withStop(raw, stop);
          const words: ReadoutWords = {
            slot: 'A',
            surfaceLabel: m.surfaces.find((s) => s.id === surfaceId)!.label,
            lineLabel: m.lines[0].label,
            showAim: micType(c.typeId).mount !== 'surface',
          };
          const zone = r.zoneId ? lesson.zones.find((z) => z.id === r.zoneId) ?? null : null;
          const strip = liveLine(r, words);
          const bezel = placementBezel(r, words, zone, (id) => m.parts.find((p) => p.id === id)?.short ?? id);
          const now = describeMic(
            { slot: 'A', typeLabel: 'x', patternLabel: 'y', readouts: r, surfaceLabel: words.surfaceLabel, lineLabel: words.lineLabel, zoneLabel: zone?.label ?? null, zoneKind: zone?.kind ?? null, showAim: words.showAim },
            true,
          );

          // Distance from the reference head: same rounded figure in all three.
          const d = Math.abs(r.distance);
          assert.ok(strip.includes(fmtLen(d)), `strip "${strip}" lacks ${fmtLen(d)}`);
          assert.ok(now.includes(fmtLen(d)), `NOW "${now}" lacks ${fmtLen(d)}`);
          assert.equal(bezel[0].v, `≈ ${fmtMetric(d)}`);
          assert.equal(bezel[0].sub, `(${fmtImperial(d)})`);
          assert.match(bezel[0].k, new RegExp(`^(FROM|BEHIND) ${words.surfaceLabel.replace('the ', '').replace(' head', '').toUpperCase()}$`));
          assert.equal(bezel[0].k.includes('BEHIND'), r.distance < 0);
          assert.equal(strip.includes(' behind '), r.distance < 0);

          // Off the reference line.
          assert.ok(strip.includes(`${fmtLen(r.radial)} off ${words.lineLabel}`));
          assert.ok(now.includes(`${fmtLen(r.radial)} off ${words.lineLabel}`));
          assert.equal(bezel[1].v, `≈ ${fmtMetric(r.radial)}`);

          // Aim (a surface plate has none).
          if (words.showAim) {
            assert.ok(strip.includes(`aim ${fmtAngle(r.offAxis)}`));
            assert.ok(now.includes(`aimed ${fmtAngle(r.offAxis)}`));
            assert.equal(bezel[2].v, fmtAngle(r.offAxis));
          } else {
            assert.ok(!strip.includes('aim '));
            assert.equal(bezel[2].v, 'FLAT');
          }

          // The stop / block reason: all three or none.
          if (r.blocked) {
            assert.ok(strip.includes(`✕ ${r.blocked.label}`));
            assert.ok(now.includes(`Blocked by the ${r.blocked.label}`));
            assert.equal(bezel[3].k, '✕ STOPPED');
          } else {
            assert.ok(!strip.includes('✕'));
            assert.ok(!now.includes('Blocked'));
            assert.equal(bezel[3].k, 'ZONE');
            assert.equal(bezel[3].v, zoneMark(zone));
            assert.ok(['TRIAL', 'SOURCED', 'SOURCED*', 'NONE'].includes(bezel[3].v));
          }
        });
      }
    }
  }
});

describe('bezel length cells', () => {
  it('keep both units at the strip’s rounding', () => {
    for (const mm of [0, 2, 3, 62, 65, 249, 251, 300.4, 1240]) {
      const c = lenCell(mm);
      assert.equal(`${c.v} ${c.sub}`, fmtLen(mm));
    }
  });
  it('sign Δd as B − A (and print no sign for zero)', () => {
    assert.equal(lenCell(240, true).v, '≈ +24 cm');
    assert.equal(lenCell(-240, true).v, '≈ −24 cm');
    assert.equal(lenCell(-240, true).sub, '(−9.4 in)');
    assert.equal(lenCell(1, true).v, '≈ 0 mm');
  });
  it('fit a 390-pt cell, so the key is never dropped (≤ 10 glyphs)', () => {
    for (const mm of [5, 65, 250, 455, 995]) assert.ok(lenCell(mm, true).v.length <= 10, lenCell(mm, true).v);
  });
});

describe('wiring', () => {
  const scene = read('src/screens/lab/miking/engine/scene/PlacementScene.tsx');
  const place = read('src/screens/lab/miking/pages/PPlacement.tsx');
  const two = read('src/screens/lab/miking/pages/PTwoMic.tsx');
  const words = read('src/screens/lab/miking/engine/scene/sceneWords.ts');
  const dock = read('src/screens/lab/miking/engine/scene/placementDock.ts');
  it('the strip formats with liveLine + withStop on both platforms', () => {
    assert.match(scene, /liveLine\(withStop\(deriveReadouts\(/);
    assert.match(scene, /Platform\.OS === 'web' \? LiveReadoutWeb : LiveReadoutNative/);
    // The web strip renders a Text from a reaction, not an animated textarea.
    const web = scene.slice(scene.indexOf('function LiveReadoutWeb'), scene.indexOf('const LiveReadout ='));
    assert.ok(web.includes('useAnimatedReaction') && web.includes('<Text') && !web.includes('animatedProps'));
    // No remount-per-commit workaround is needed any more.
    assert.ok(!/key=\{`live:\$\{m\.slot\}:\$\{rig\.version\}`\}/.test(scene));
  });
  it('the bezel, the NOW line and the dock read the SHOWN readouts / the committed stop', () => {
    assert.match(place, /placementBezel\(shown, readoutWords\(rig, 'A'\)/);
    assert.match(place, /const shown = rig\.shown\('A'\)/);
    assert.match(words, /const r = rig\.shown\(slot\)/);
    assert.match(dock, /rig\.stop\[slot\]/);
    assert.ok(!/useState<Blocked>/.test(place) && !/useState<Blocked>/.test(two), 'no page-wide copy of the stop');
  });
  it('page 5 labels its path difference and delay as B − A', () => {
    assert.match(two, /k: 'PATH Δd B−A'/);
    assert.match(two, /k: 'DELAY Δt B−A'/);
  });
});
