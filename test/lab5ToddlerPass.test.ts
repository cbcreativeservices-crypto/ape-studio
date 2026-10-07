/**
 * Miking Lab 5 (Voice & Ensemble) — toddler passes 2026-10-07
 * (docs/bughunt/TODDLER_2026_10_07_lab5.md). Screen fixes pinned by source
 * guards; the reasoning sits beside each fix in the source.
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it } from 'node:test';

const DIR = join(process.cwd(), 'src/screens/lab/miking/lessons/shared/ensemble');
const stage = readFileSync(join(DIR, 'EnsembleStage.tsx'), 'utf8');
const pages = readFileSync(join(DIR, 'ensemblePages.tsx'), 'utf8');

describe('Lab 5 toddler pass', () => {
  it('L5-R1-01: EnsembleStage defaults are stable empties, never a fresh []', () => {
    assert.match(stage, /const NONE: readonly never\[\] = Object\.freeze\(\[\]\)/);
    const destructure = stage.slice(stage.indexOf('export function EnsembleStage('), stage.indexOf('const textScale'));
    assert.doesNotMatch(destructure, /= \[\]/);
  });
  it('L5-R1-02/03: the stage inputs a page passes are memoised', () => {
    assert.match(pages, /const radiate = useMemo\(/);
    assert.match(pages, /const rigM: StageRig\[\] = useMemo\(/);
    assert.match(pages, /const st = useMemo\(\(\) => \(sel \? stageOf\(sel\)/);
    assert.match(pages, /rings=\{eqRings\}/);
    assert.match(pages, /const rigNow: StageRig\[\] = useMemo\(/);
    assert.match(pages, /const mount: ArrayMount = useMemo\(/);
    assert.doesNotMatch(pages, /rings=\{eq \? \[eq\.ring\] : \[\]\}/);
  });
  it('L5-R1-04: picking a START never earns a zone (moved resets)', () => {
    const pick = pages.slice(pages.indexOf('const pickStart = '), pages.indexOf('const pickPreset = '));
    assert.match(pick, /setMoved\(false\)/);
  });
  it('L5-R1-05: switching ARRAY takes that array’s own geometry; the geometry fader stays in range', () => {
    assert.match(pages, /onSelect: \(id\) => pickPreset\(id as ArrayPresetId\)/);
    assert.match(pages, /const gv = geom \? Math\.max\(geom\.r\.min, Math\.min\(geom\.r\.max,/);
  });
  it('L5-R1-06: a SEATING change re-seats the Placement Studio on its own start', () => {
    assert.match(pages, /seenVariant\.current === variant/);
  });
});
